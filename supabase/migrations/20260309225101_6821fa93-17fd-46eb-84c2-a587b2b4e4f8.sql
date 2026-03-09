
-- Add phone column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- token_transactions
CREATE TABLE public.token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  tokens integer NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own token_transactions" ON public.token_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own token_transactions" ON public.token_transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all token_transactions" ON public.token_transactions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert token_transactions" ON public.token_transactions
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- works
CREATE TABLE public.works (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT '',
  content text,
  file_url text,
  tokens_used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own works" ON public.works
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own works" ON public.works
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own works" ON public.works
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all works" ON public.works
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- rooms
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  leader_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view rooms" ON public.rooms
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create rooms" ON public.rooms
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "Leaders can update own rooms" ON public.rooms
  FOR UPDATE TO authenticated USING (auth.uid() = leader_id);
CREATE POLICY "Leaders can delete own rooms" ON public.rooms
  FOR DELETE TO authenticated USING (auth.uid() = leader_id);

-- room_members
CREATE TABLE public.room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  UNIQUE (room_id, user_id)
);
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view room_members" ON public.room_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leaders can insert room_members" ON public.room_members
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() IN (SELECT leader_id FROM public.rooms WHERE id = room_id)
    OR auth.uid() = user_id
  );
CREATE POLICY "Leaders can delete room_members" ON public.room_members
  FOR DELETE TO authenticated USING (
    auth.uid() IN (SELECT leader_id FROM public.rooms WHERE id = room_id)
  );

-- room_tasks
CREATE TABLE public.room_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.room_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members can view tasks" ON public.room_tasks
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.room_members WHERE room_id = room_tasks.room_id AND user_id = auth.uid())
  );
CREATE POLICY "Room members can insert tasks" ON public.room_tasks
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.room_members WHERE room_id = room_tasks.room_id AND user_id = auth.uid())
  );
CREATE POLICY "Task owner or leader can update" ON public.room_tasks
  FOR UPDATE TO authenticated USING (
    auth.uid() = user_id
    OR auth.uid() IN (SELECT leader_id FROM public.rooms WHERE id = room_id)
  );
CREATE POLICY "Leader can delete tasks" ON public.room_tasks
  FOR DELETE TO authenticated USING (
    auth.uid() IN (SELECT leader_id FROM public.rooms WHERE id = room_id)
  );
