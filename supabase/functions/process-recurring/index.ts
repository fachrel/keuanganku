import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// MODIFIED: Removed 'add' as it's not available in this version
import { format } from 'https://deno.land/std@0.208.0/datetime/mod.ts';

// Define the type for a recurring transaction rule, matching our database
interface RecurringTransaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  account_id: string;
  category_id: string | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  end_date: string | null;
  next_due_date: string;
}

serve(async (req) => {
  try {
    // Create a Supabase client with the service_role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the current date in YYYY-MM-DD format (UTC)
    const today = format(new Date(), "yyyy-MM-dd");

    // 1. Fetch all recurring transaction rules that are due today or in the past
    const { data: dueTransactions, error: fetchError } = await supabaseAdmin
      .from('recurring_transactions')
      .select('*')
      .lte('next_due_date', today);

    if (fetchError) throw fetchError;
    if (!dueTransactions || dueTransactions.length === 0) {
      return new Response(JSON.stringify({ message: "No recurring transactions due." }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Process each due transaction
    for (const rule of dueTransactions) {
      
      // A. Create a new entry in the 'transactions' table
      const { error: insertError } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: rule.user_id,
          description: rule.description,
          amount: rule.amount,
          type: rule.type,
          account_id: rule.account_id,
          category_id: rule.category_id,
          date: today, // The date the transaction is created
        });
      
      if (insertError) {
        console.error(`Failed to create transaction for rule ${rule.id}:`, insertError.message);
        continue; // Skip to the next rule if this one fails
      }

      // B. Update the user's account balance
      const { error: rpcError } = await supabaseAdmin.rpc('update_account_balance', {
          account_id_to_update: rule.account_id,
          amount_to_add: rule.type === 'income' ? rule.amount : -rule.amount
      });

      if (rpcError) {
          console.error(`Failed to update balance for rule ${rule.id}:`, rpcError.message);
          continue; // Skip to next rule
      }

      // C. Calculate the next due date and update the rule
      // MODIFIED: Replaced the 'add' function with standard JavaScript Date methods
      const newNextDueDate = new Date(rule.next_due_date);

      switch (rule.frequency) {
        case 'daily':   newNextDueDate.setDate(newNextDueDate.getDate() + 1); break;
        case 'weekly':  newNextDueDate.setDate(newNextDueDate.getDate() + 7); break;
        case 'monthly': newNextDueDate.setMonth(newNextDueDate.getMonth() + 1); break;
        case 'yearly':  newNextDueDate.setFullYear(newNextDueDate.getFullYear() + 1); break;
        default: continue; // Should not happen
      }

      // If the new date is past the end_date, or if the rule's end date itself is today, we deactivate the rule
      // by setting next_due_date to null. Otherwise, we update it.
      const isExpired = rule.end_date && format(newNextDueDate, "yyyy-MM-dd") > rule.end_date;
      const endsToday = rule.end_date && rule.end_date === today;
      
      const updates = {
          last_created_date: today,
          next_due_date: (isExpired || endsToday) ? null : format(newNextDueDate, "yyyy-MM-dd"),
      };
      
      const { error: updateError } = await supabaseAdmin
        .from('recurring_transactions')
        .update(updates)
        .eq('id', rule.id);

      if (updateError) {
        console.error(`Failed to update rule ${rule.id}:`, updateError.message);
      }
    }

    return new Response(JSON.stringify({ message: `Successfully processed ${dueTransactions.length} transaction(s).` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
