import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function useContracts(options = {}) {
  const { type, status, search, from, to } = options;
  const { profile } = useAuth();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContracts = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let q = supabase
        .from("contracts")
        .select(`
          *,
          players(id, full_name, position, teams(name))
        `)
        .order("created_at", { ascending: false });

      if (type) q = q.eq("contract_type", type);
      if (status) q = q.eq("status", status);
      if (from) q = q.gte("start_date", from);
      if (to) q = q.lte("end_date", to);
      if (search) {
        q = q.or(
          `party_name.ilike.%${search}%,contract_number.ilike.%${search}%,description.ilike.%${search}%`,
        );
      }

      const { data, error: err } = await q;
      if (err) throw err;
      setContracts(data || []);
    } catch (err) {
      console.error("useContracts:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profile, type, status, search, from, to]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const getContractById = useCallback(async (id) => {
    const { data, error: err } = await supabase
      .from("contracts")
      .select(`
        *,
        players(id, full_name, position, teams(name))
      `)
      .eq("id", id)
      .single();
    if (err) throw err;
    return data;
  }, []);

  const getContractPayments = useCallback(async (contractId) => {
    const { data, error: err } = await supabase
      .from("contract_payments")
      .select("*")
      .eq("contract_id", contractId)
      .order("installment_number", { ascending: true });
    if (err) throw err;
    return data || [];
  }, []);

  const createContract = async (payload) => {
    const { data, error: err } = await supabase
      .from("contracts")
      .insert({ ...payload, created_by: profile.id })
      .select()
      .single();
    if (err) throw err;
    await fetchContracts();
    return data;
  };

  const updateContract = async (id, payload) => {
    const { data, error: err } = await supabase
      .from("contracts")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (err) throw err;
    await fetchContracts();
    return data;
  };

  const removeContract = async (id) => {
    const { error: err } = await supabase
      .from("contracts")
      .delete()
      .eq("id", id);
    if (err) throw err;
    await fetchContracts();
  };

  const createPayment = async (payload) => {
    const { data, error: err } = await supabase
      .from("contract_payments")
      .insert(payload)
      .select()
      .single();
    if (err) throw err;
    return data;
  };

  const updatePayment = async (id, payload) => {
    const { data, error: err } = await supabase
      .from("contract_payments")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (err) throw err;
    return data;
  };

  const removePayment = async (id) => {
    const { error: err } = await supabase
      .from("contract_payments")
      .delete()
      .eq("id", id);
    if (err) throw err;
  };

  // ✅ تسجيل دفعة + ربطها بالخزينة
  const markPaymentAsPaid = async (payment, contract) => {
    const today = new Date().toISOString().split("T")[0];

    // 1) سجّل مصروف في الخزينة
    const { data: treasuryTx, error: treasuryErr } = await supabase
      .from("treasury_transactions")
      .insert({
        type: "expense",
        category: `عقد ${contract.contract_type === "player" ? "لاعب" : contract.contract_type}`,
        amount: Number(payment.amount),
        description: `دفعة عقد: ${contract.party_name}${
          payment.installment_number ? ` (قسط ${payment.installment_number})` : ""
        }`,
        receipt_number: contract.contract_number || null,
        transaction_date: today,
        created_by: profile.id,
      })
      .select()
      .single();

    if (treasuryErr) throw treasuryErr;

    // 2) حدّث حالة الدفعة
    const { data: updated, error: updateErr } = await supabase
      .from("contract_payments")
      .update({
        status: "paid",
        paid_date: today,
        treasury_transaction_id: treasuryTx.id,
      })
      .eq("id", payment.id)
      .select()
      .single();

    if (updateErr) throw updateErr;
    return updated;
  };

  return {
    contracts,
    loading,
    error,
    refetch: fetchContracts,
    getContractById,
    getContractPayments,
    createContract,
    updateContract,
    removeContract,
    createPayment,
    updatePayment,
    removePayment,
    markPaymentAsPaid,
  };
}