import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function useTreasury(options = {}) {
  const { type, category, from, to, search } = options;
  const { profile } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let q = supabase
        .from("treasury_transactions")
        .select("*")
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (type) q = q.eq("type", type);
      if (category) q = q.ilike("category", `%${category}%`);
      if (from) q = q.gte("transaction_date", from);
      if (to) q = q.lte("transaction_date", to);
      if (search) {
        q = q.or(
          `description.ilike.%${search}%,receipt_number.ilike.%${search}%,category.ilike.%${search}%`,
        );
      }

      const { data, error: err } = await q;
      if (err) throw err;
      setTransactions(data || []);
    } catch (err) {
      console.error("useTreasury:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profile, type, category, from, to, search]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const createTransaction = async (payload) => {
    const { data, error: err } = await supabase
      .from("treasury_transactions")
      .insert({ ...payload, created_by: profile.id })
      .select()
      .single();
    if (err) throw err;
    await fetchTransactions();
    return data;
  };

  const updateTransaction = async (id, payload) => {
    const { data, error: err } = await supabase
      .from("treasury_transactions")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (err) throw err;
    await fetchTransactions();
    return data;
  };

  const removeTransaction = async (id) => {
    const { error: err } = await supabase
      .from("treasury_transactions")
      .delete()
      .eq("id", id);
    if (err) throw err;
    await fetchTransactions();
  };

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
    createTransaction,
    updateTransaction,
    removeTransaction,
  };
}