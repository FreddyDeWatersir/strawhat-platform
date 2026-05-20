-- Straw Hat Platform — cases & box inventory
-- Run in SQL Editor after 001_initial.sql and 002_pgvector.sql

create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  product_set text,
  box_count int not null default 12 check (box_count > 0),
  purchase_currency text,
  purchase_price numeric,
  purchased_at date,
  document_id uuid references documents(id) on delete set null,
  transaction_id uuid references transactions(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists case_boxes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  box_number int not null check (box_number > 0),
  sold_at date,
  sale_price numeric,
  sale_currency text,
  notes text,
  unique (case_id, box_number)
);

create index if not exists case_boxes_case_id_idx on case_boxes (case_id);
create index if not exists cases_purchased_at_idx on cases (purchased_at desc nulls last);

-- Auto-create box rows when a case is inserted
create or replace function create_case_boxes()
returns trigger
language plpgsql
as $$
begin
  insert into case_boxes (case_id, box_number)
  select new.id, gs
  from generate_series(1, new.box_count) as gs;
  return new;
end;
$$;

drop trigger if exists after_case_insert on cases;
create trigger after_case_insert
  after insert on cases
  for each row
  execute function create_case_boxes();
