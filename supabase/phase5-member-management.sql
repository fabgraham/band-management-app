-- Phase 5: Member Management
-- Database schema for band member invitations and role-based permissions

-- band_members table: Stores member relationships and roles
CREATE TABLE IF NOT EXISTS public.band_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(band_id, user_id) -- Prevent duplicate memberships
);

-- band_invitations table: Stores pending invitations
CREATE TABLE IF NOT EXISTS public.band_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  invitation_token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired')) DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_band_members_band_id ON public.band_members(band_id);
CREATE INDEX IF NOT EXISTS idx_band_members_user_id ON public.band_members(user_id);
CREATE INDEX IF NOT EXISTS idx_band_members_role ON public.band_members(role);
CREATE INDEX IF NOT EXISTS idx_band_invitations_band_id ON public.band_invitations(band_id);
CREATE INDEX IF NOT EXISTS idx_band_invitations_invited_email ON public.band_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_band_invitations_status ON public.band_invitations(status);
CREATE INDEX IF NOT EXISTS idx_band_invitations_expires_at ON public.band_invitations(expires_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_band_members_updated_at
  BEFORE UPDATE ON public.band_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_band_invitations_updated_at
  BEFORE UPDATE ON public.band_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper that bypasses RLS recursion by running as table owner
CREATE OR REPLACE FUNCTION is_band_member(user_id UUID, band_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF user_id IS NULL OR band_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.band_members
    WHERE band_members.user_id = is_band_member.user_id
      AND band_members.band_id = is_band_member.band_id
  );
END;
$$;

-- Function to check whether a member has any of the allowed roles
CREATE OR REPLACE FUNCTION has_band_role(user_id UUID, band_id UUID, allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF user_id IS NULL OR band_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.band_members
    WHERE band_members.user_id = has_band_role.user_id
      AND band_members.band_id = has_band_role.band_id
      AND band_members.role = ANY(has_band_role.allowed_roles)
  );
END;
$$;

-- Function to get user's role in a band
CREATE OR REPLACE FUNCTION get_user_band_role(user_id UUID, band_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_role TEXT;
BEGIN
  IF user_id IS NULL OR band_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT role INTO member_role
  FROM public.band_members
  WHERE band_members.user_id = get_user_band_role.user_id
    AND band_members.band_id = get_user_band_role.band_id
  LIMIT 1;

  RETURN member_role;
END;
$$;

-- Function to automatically accept pending invitations when user signs up with invited email
CREATE OR REPLACE FUNCTION process_invitation_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Find pending invitations for this email
  UPDATE public.band_invitations
  SET status = 'accepted', accepted_at = NOW()
  WHERE invited_email = NEW.email
  AND status = 'pending'
  AND expires_at > NOW();

  -- Add user to bands for accepted invitations
  INSERT INTO public.band_members (band_id, user_id, role)
  SELECT band_id, NEW.id, role
  FROM public.band_invitations
  WHERE invited_email = NEW.email
  AND status = 'accepted'
  AND NOT EXISTS (
    SELECT 1 FROM public.band_members
    WHERE band_members.band_id = band_invitations.band_id
    AND band_members.user_id = NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to process invitations on user signup
CREATE TRIGGER process_user_invitations
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION process_invitation_on_signup();
