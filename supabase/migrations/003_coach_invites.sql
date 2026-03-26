-- Coach invites (separate from player/parent invites)
create table coach_invites (
  id uuid primary key default uuid_generate_v4(),
  invited_email text not null,
  branch_id uuid references branches(id),
  age_group text,
  invited_by uuid references users(id),
  token text unique not null,
  accepted_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

alter table coach_invites enable row level security;

-- Only superadmin can manage coach invites
create policy "superadmin_manage_coach_invites" on coach_invites
  for all using (get_role(auth.uid()) = 'superadmin');

-- Allow unauthenticated read by token (for invite acceptance page)
create policy "public_read_coach_invite_by_token" on coach_invites
  for select using (true);
