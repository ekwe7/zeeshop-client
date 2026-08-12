import React, { useState, useEffect } from "react";
import { fetchCustomers, fetchSales, createCustomer } from "../utils/apiClient";

export interface CustomerDebtRecord {
  id: string;
  name: string;
  code: string;
  creditLimit: number;
  outstandingDebt: number;
  status: "Normal" | "High" | "Critical";
  invoices: {
    id: string;
    invoiceNumber: string;
    date: string;
    amount: number;
    status: "Unpaid" | "Overdue" | "Paid";
  }[];
}

export const DebtManagementTab: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerDebtRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [paymentDate, setPaymentDate] = useState("2026-08-11");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const [salesList, setSalesList] = useState<any[]>([]);

  useEffect(() => {
    loadLedgerData();
  }, []);

  const loadLedgerData = async () => {
    setLoading(true);
    try {
      const [customerRes, salesRes] = await Promise.allSettled([
        fetchCustomers(),
        fetchSales(),
      ]);

      const backendCustomerList =
        customerRes.status === "fulfilled"
          ? Array.isArray(customerRes.value)
            ? customerRes.value
            : customerRes.value.content || []
          : [];

      const backendSalesList =
        salesRes.status === "fulfilled"
          ? Array.isArray(salesRes.value)
            ? salesRes.value
            : salesRes.value.content || []
          : [];

      setSalesList(backendSalesList);

      if (backendCustomerList.length > 0) {
        const mappedList: CustomerDebtRecord[] = backendCustomerList.map(
          (cItem: any, idx: number) => {
            const cId = cItem.id || `CUST-${idx + 1}`;
            const limit = Number(cItem.creditLimit || cItem.limit || 1500000);
            const outstanding = Number(cItem.outstandingDebt || cItem.balance || cItem.debt || 0);
            const ratio = limit > 0 ? outstanding / limit : 0;
            const status: "Normal" | "High" | "Critical" =
              ratio >= 0.8 ? "Critical" : ratio >= 0.5 ? "High" : "Normal";

            // Find matching customer sales invoices
            const custInvoices = backendSalesList
              .filter(
                (s: any) =>
                  s.customerId === cId ||
                  (s.customerName &&
                    s.customerName.toLowerCase() === (cItem.name || "").toLowerCase())
              )
              .map((s: any, invIdx: number) => ({
                id: s.id || `inv-${invIdx}`,
                invoiceNumber: s.orderNumber || s.code || `INV-2026-${100 + invIdx}`,
                date: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "Recent",
                amount: Number(s.totalAmount || s.amount || s.totalPrice || 0),
                status: (s.status === "PAID" ? "Paid" : s.status === "OVERDUE" ? "Overdue" : "Unpaid") as "Unpaid" | "Overdue" | "Paid",
              }));

            return {
              id: cId,
              name: cItem.name || cItem.customerName || `Customer ${idx + 1}`,
              code: cItem.code || cItem.customerCode || `CUST-${8400 + idx}`,
              creditLimit: limit,
              outstandingDebt: outstanding,
              status,
              invoices: custInvoices,
            };
          }
        );

        setCustomers(mappedList);
        setSelectedCustomerId(mappedList[0]?.id || "");
      } else {
        setCustomers([]);
        setSelectedCustomerId("");
      }
    } catch (err: any) {
      console.error("Error fetching live debt ledger from backend:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer =
    customers.find((c) => c.id === selectedCustomerId) || customers[0];

  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingDebt, 0);
  const collectedThisMonth = salesList.reduce(
    (sum, s) => sum + Number(s.totalAmount || s.amount || s.totalPrice || 0),
    0
  );
  const accountsInArrearsCount = customers.filter(
    (c) => c.status === "High" || c.status === "Critical"
  ).length;

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();    
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid payment amount greater than 0");
      return;
    }

    if (!selectedCustomer) return;

    const newOutstanding = Math.max(0, selectedCustomer.outstandingDebt - amountNum);
    const newStatus =
      newOutstanding === 0
        ? "Normal"
        : newOutstanding / selectedCustomer.creditLimit > 0.8
        ? "Critical"
        : newOutstanding / selectedCustomer.creditLimit > 0.5
        ? "High"
        : "Normal";

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === selectedCustomer.id
          ? {
              ...c,
              outstandingDebt: newOutstanding,
              status: newStatus,
            }
          : c
      )
    );

    setFeedbackMsg(
      `Payment of ₦${amountNum.toLocaleString()} recorded for ${selectedCustomer.name}!`
    );
    setPaymentAmount("");
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const safeCustomer = selectedCustomer || {
    id: "none",
    name: "No Customer Selected",
    code: "CUST-0000",
    creditLimit: 1000000,
    outstandingDebt: 0,
    status: "Normal" as const,
    invoices: [],
  };

  const creditUtilizationPercent = safeCustomer.creditLimit > 0
    ? Math.min(
        100,
        Math.round((safeCustomer.outstandingDebt / safeCustomer.creditLimit) * 100)
      )
    : 0; 

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-secondary gap-2 font-body-md">
        <span className="material-symbols-outlined animate-spin text-[24px]">
          progress_activity
        </span>
        Loading Debt Management Ledger...
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-background min-h-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <p className="font-label-sm text-secondary uppercase tracking-widest mb-1 text-[11px] font-semibold">
            Finance & Credit
          </p>
          <h1 className="font-headline-lg text-[28px] font-bold text-on-surface">
            Debt Management
          </h1>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => {
              const dataStr =
                "data:text/json;charset=utf-8," +
                encodeURIComponent(JSON.stringify(customers, null, 2));
              const downloadAnchor = document.createElement("a");
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", "debt_ledger_export.json");
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="px-5 py-2.5 rounded-full bg-surface-container-high hover:bg-surface-container transition-colors flex items-center gap-2 text-on-surface font-label-sm text-[13px] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Ledger
          </button>
          <button
            onClick={async () => {
              const name = window.prompt("Enter Customer Name:");
              if (!name) return;
              const limitStr = window.prompt("Enter Credit Limit (₦):", "1000000");
              if (!limitStr) return;
              const limitVal = parseFloat(limitStr) || 1000000;

              try {
                await createCustomer({
                  name: name.trim(),
                  creditLimit: limitVal,
                });
                setFeedbackMsg(`Customer account "${name.trim()}" created in live database!`);
                setTimeout(() => setFeedbackMsg(null), 4000);
                loadLedgerData();
              } catch (err: any) {
                console.error("Error creating customer in backend:", err);
                alert(`Failed to create customer on server: ${err.message}`);
              }
            }}
            className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 transition-colors flex items-center gap-2 text-on-primary font-label-sm text-[13px] shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Credit Account
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Metric 1 */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-error-container/40 rounded-lg text-error">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
            <span className="font-label-sm text-[12px] text-error flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-[16px]">trending_up</span> +4.2%
            </span>
          </div>
          <p className="font-label-sm text-secondary text-[12px] mb-1 font-medium">
            Total Outstanding Debt
          </p>
          <p className="font-headline-md text-[24px] font-bold text-on-surface font-code-mono">
            ₦{totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-secondary-container/50 rounded-lg text-secondary">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <span className="font-label-sm text-[12px] text-secondary flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-[16px]">trending_down</span> -1.5%
            </span>
          </div>
          <p className="font-label-sm text-secondary text-[12px] mb-1 font-medium">
            Collected This Month
          </p>
          <p className="font-headline-md text-[24px] font-bold text-on-surface font-code-mono">
            ₦{collectedThisMonth.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary-fixed/40 rounded-lg text-primary">
              <span className="material-symbols-outlined">group</span>
            </div>
            <span className="font-label-sm text-[12px] text-secondary font-semibold">Active</span>
          </div>
          <p className="font-label-sm text-secondary text-[12px] mb-1 font-medium">
            Accounts in Arrears
          </p>
          <p className="font-headline-md text-[24px] font-bold text-on-surface font-code-mono">
            {accountsInArrearsCount}{" "}
            <span className="font-body-sm text-[13px] text-secondary font-normal">
              / {customers.length} total
            </span>
          </p>
        </div>
      </div>

      {/* Main Layout Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer Ledger (Takes up 7 cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 flex flex-col min-h-[550px]">
          <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center flex-wrap gap-3">
            <h2 className="font-headline-sm text-[18px] font-bold text-on-surface">
              Customer Ledger
            </h2>
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
                search
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customers..."
                type="text"
                className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg font-body-sm text-[13px] text-on-surface outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant/30 text-[11px] uppercase font-semibold text-secondary">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3 text-right">Credit Limit</th>
                  <th className="p-3 text-right">Outstanding</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-[13px]">
                {filteredCustomers.map((cust) => {
                  const isSelected = cust.id === selectedCustomerId;
                  const initials = cust.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={cust.id}
                      onClick={() => setSelectedCustomerId(cust.id)}
                      className={`hover:bg-surface-container-low transition-colors cursor-pointer border-b border-outline-variant/20 last:border-0 ${
                        isSelected
                          ? "bg-primary-fixed/20 border-l-4 border-l-primary font-medium"
                          : ""
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-container/30 text-on-primary-container flex items-center justify-center font-label-sm text-[11px] font-bold">
                            {initials}
                          </div>
                          <div>
                            <p className="font-label-sm text-on-surface font-semibold">
                              {cust.name}
                            </p>
                            <p className="font-body-sm text-[11px] text-secondary">
                              ID: {cust.code}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right font-code-mono">
                        ₦{cust.creditLimit.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-code-mono text-error font-bold">
                        ₦{cust.outstandingDebt.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                            cust.status === "Critical"
                              ? "bg-error-container text-error border-error/30"
                              : cust.status === "High"
                              ? "bg-warning-container text-warning border-warning/30"
                              : "bg-surface-container-high text-secondary border-outline-variant/30"
                          }`}
                        >
                          {cust.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button className="p-1 rounded-full hover:bg-surface-container-high transition-colors text-primary cursor-pointer">
                          <span className="material-symbols-outlined text-[18px]">
                            chevron_right
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Detail View & Actions (Takes up 5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Account Summary Card */}
          <div className="bg-primary text-on-primary rounded-xl shadow-md p-6 relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-start mb-6">
              <div>
                <h3 className="font-headline-sm text-[20px] font-bold mb-1">
                  {safeCustomer.name}
                </h3>
                <p className="font-body-sm text-[12px] text-on-primary/80">
                  ID: {safeCustomer.code} • Retail Client
                </p>
              </div>
              <button
                onClick={() => alert(`Edit profile for ${safeCustomer.name}`)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                title="Edit Profile"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
            </div>

            <div className="relative z-10 mb-6">
              <p className="font-label-sm text-[11px] text-on-primary/80 uppercase tracking-wider mb-1">
                Outstanding Balance
              </p>
              <p className="font-headline-lg text-[26px] font-bold text-error-container font-code-mono">
                ₦{safeCustomer.outstandingDebt.toLocaleString()}
              </p>
            </div>

            <div className="relative z-10">
              <div className="flex justify-between text-[12px] mb-1.5 font-medium">
                <span className="text-on-primary/80">Credit Utilization</span>
                <span className="font-code-mono">
                  {creditUtilizationPercent}% (₦
                  {(safeCustomer.creditLimit / 1000).toFixed(0)}k Limit)
                </span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-error-container rounded-full transition-all"
                  style={{ width: `${creditUtilizationPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Record Payment Form */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 p-5">
            <h3 className="font-headline-sm text-[16px] font-bold text-on-surface mb-3">
              Record Payment
            </h3>

            {feedbackMsg && (
              <div className="p-3 mb-3 bg-primary-container/20 border border-primary/30 text-primary rounded-lg text-[12px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">
                  check_circle
                </span>
                {feedbackMsg}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-secondary mb-1">
                  Payment Amount (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-code-mono text-secondary text-[13px]">
                    ₦
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg font-code-mono text-[13px] text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-secondary mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg font-body-sm text-[13px] text-on-surface outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-secondary mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg font-body-sm text-[13px] text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 transition-colors font-label-sm text-[13px] font-bold text-on-primary mt-1 cursor-pointer"
              >
                Record Payment
              </button>
            </form>
          </div>

          {/* Debt Breakdown / Transaction History */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 flex-1 flex flex-col min-h-[220px]">
            <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center">
              <h3 className="font-label-sm text-[11px] text-secondary uppercase tracking-wider font-semibold">
                Debt Breakdown
              </h3>
              <button className="text-primary font-label-sm text-[12px] hover:underline font-medium cursor-pointer">
                View All
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedCustomer.invoices.length === 0 ? (
                <p className="text-secondary text-[12px] text-center py-4">
                  No unpaid invoices for this customer.
                </p>
              ) : (
                selectedCustomer.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex justify-between items-start pb-3 border-b border-outline-variant/20 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-on-surface text-[13px]">
                        Invoice #{inv.invoiceNumber}
                      </p>
                      <p className="font-body-sm text-[11px] text-secondary">
                        {inv.date} • Due Net 30
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-code-mono text-[13px] font-bold text-on-surface">
                        ₦{inv.amount.toLocaleString()}
                      </p>
                      <span
                        className={`text-[10px] uppercase font-bold ${
                          inv.status === "Overdue" ? "text-error" : "text-primary"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
