-- Create the recurring_transactions table
CREATE TABLE public.recurring_transactions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL DEFAULT auth.uid(),
    description text NOT NULL,
    amount numeric NOT NULL,
    type text NOT NULL,
    account_id uuid NOT NULL,
    category_id uuid,
    frequency text NOT NULL,
    start_date date NOT NULL,
    end_date date,
    last_created_date date,
    next_due_date date NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT recurring_transactions_pkey PRIMARY KEY (id),
    CONSTRAINT recurring_transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE,
    CONSTRAINT recurring_transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL,
    CONSTRAINT recurring_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT recurring_transactions_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT recurring_transactions_type_check CHECK ((type = ANY (ARRAY['income'::text, 'expense'::text])))
);

-- Add comments to the table and columns for clarity
COMMENT ON TABLE public.recurring_transactions IS 'Stores rules for recurring income and expenses.';
COMMENT ON COLUMN public.recurring_transactions.frequency IS 'e.g., ''daily'', ''weekly'', ''monthly'', ''yearly''';
COMMENT ON COLUMN public.recurring_transactions.last_created_date IS 'The date the last transaction was generated from this rule.';
COMMENT ON COLUMN public.recurring_transactions.next_due_date IS 'The date the next transaction should be generated.';


-- 1. Enable Row Level Security (RLS)
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies
--    Users can view their own recurring transactions
CREATE POLICY "Allow individual read access" ON public.recurring_transactions FOR SELECT
USING (auth.uid() = user_id);

--    Users can create recurring transactions for themselves
CREATE POLICY "Allow individual insert access" ON public.recurring_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

--    Users can update their own recurring transactions
CREATE POLICY "Allow individual update access" ON public.recurring_transactions FOR UPDATE
USING (auth.uid() = user_id);

--    Users can delete their own recurring transactions
CREATE POLICY "Allow individual delete access" ON public.recurring_transactions FOR DELETE
USING (auth.uid() = user_id);
