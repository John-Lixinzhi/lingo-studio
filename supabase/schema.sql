-- ==============================================================================
-- Supabase 数据库初始化脚本
-- 使用方法：
--   1. 注册 https://supabase.com （免费，GitHub 登录即可）
--   2. New project → 填项目名（如 lingo-studio）→ 选离你近的区域 → 等初始化完成（20秒）
--   3. 左侧菜单 SQL Editor → 点新建查询
--   4. 把本文件内容完整粘贴进去 → Run
--   5. 返回 Settings → API，把 Project URL 和 anon public key 填到
--      本项目的 assets/js/config.js 里
-- ==============================================================================

-- 用户扩展资料（Supabase Auth 的 users 表由 Auth 系统自动管密码/邮箱）
create table if not exists public.profiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  name      text not null default '学习者',
  target    text not null default 'en',       -- 主攻语言
  accent    text not null default 'gold',     -- 颜色标签
  created_at timestamptz default now()
);

-- 学习进度整块 JSON（间隔重复、XP、成就、课节记录都塞这里）
create table if not exists public.progress (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  data      jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- 社区动态
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid references auth.users(id) on delete cascade,
  author_name text,
  lang        text default 'en',
  type        text default '打卡',
  content     text,
  tags        text[],
  likes       int not null default 0,
  created_at  timestamptz default now()
);

-- 学习小组（种子数据，手动 INSERT 或让前端先跑）
create table if not exists public.groups (
  id           uuid primary key default gen_random_uuid(),
  name         text,
  member_count int not null default 0
);

/* -------------------------------------------------------------------------- */
/* 行级安全策略（RLS）——没有它，任何匿名请求都能读/改所有数据               */
/*                                                                            */
/* 核心原则：                                                                  */
/*   profiles    — 所有人可读；本人可写                                        */
/*   progress     — 只有本人可读写                                             */
/*   posts        — 所有人可读；登录用户可点赞；只有作者可发/删                */
/*   groups       — 所有人可读                                                 */
/* -------------------------------------------------------------------------- */

alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.posts enable row level security;
alter table public.groups enable row level security;

-- profiles：公开读
drop policy if exists "profiles public read" on public.profiles;
create policy "profiles public read" on public.profiles for select using (true);
-- profiles：本人写
drop policy if exists "profiles self write" on public.profiles;
create policy "profiles self write" on public.profiles for all using (auth.uid() = id);

-- progress：仅限本人
drop policy if exists "progress self only" on public.progress;
create policy "progress self only" on public.progress for all using (auth.uid() = user_id);

-- posts：公开读
drop policy if exists "posts public read" on public.posts;
create policy "posts public read" on public.posts for select using (true);
-- posts：登录用户可 INSERT（author_id 必须是自己）
drop policy if exists "posts self insert" on public.posts;
create policy "posts self insert" on public.posts for insert
  with check (auth.uid() = author_id);
-- posts：所有人可更新（主要是点赞 counter；RLS 只管「谁能 update」，前端自己算 +/-）
drop policy if exists "posts anyone update likes" on public.posts;
create policy "posts anyone update likes" on public.posts for update using (true);

-- groups：公开读
drop policy if exists "groups public read" on public.groups;
create policy "groups public read" on public.groups for select using (true);

/* -------------------------------------------------------------------------- */
/* 为注册时缺失的 profile 自动补一条（可选，推荐启用）                        */
/* -------------------------------------------------------------------------- */
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, target, accent)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'target', 'en'),
    coalesce(new.raw_user_meta_data->>'accent', coalesce(new.raw_user_meta_data->>'target', 'en'))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
