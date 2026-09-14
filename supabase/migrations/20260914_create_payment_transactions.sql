-- ============================================================
-- SEOMETRICHUB
-- PayU payment transaction tracking / idempotency
-- Created: 2026-09-14
-- ============================================================

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  plan_id bigint not null
    references public.plans(id),

  provider text not null default 'payu',

  txnid text not null,
  mihpayid text,

  status text not null,

  amount numeric(10,2) not null,
  currency text not null default 'INR',

  raw_response jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint payment_transactions_txnid_unique
    unique (txnid),

  constraint payment_transactions_mihpayid_unique
    unique (mihpayid)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists payment_transactions_user_id_idx
  on public.payment_transactions(user_id);

create index if not exists payment_transactions_plan_id_idx
  on public.payment_transactions(plan_id);

-- ============================================================
-- SERVICE ROLE PERMISSIONS
-- PayU callback uses Supabase service role on the server.
-- ============================================================

grant select, insert, update
on table public.payment_transactions
to service_role;