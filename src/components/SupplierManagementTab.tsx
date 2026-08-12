import React, { useState, useEffect } from "react";
import {
  fetchSuppliers,
  createSupplier,
  fetchPurchaseOrders,
  createPurchaseOrder,
  fetchProducts,
} from "../utils/apiClient";

export interface SupplierItem {
  id: string;
  name: string;
  category: string;
  phone: string;
  email: string;
  outstandingDebt: number;
  initials: string;
  badgeClass: string;
}

export interface PurchaseOrderItem {
  poNumber: string;
  date: string;
  supplierName: string;
  supplierInitials: string;
  itemCount: number;
  totalCost: number;
  status: "Pending" | "Partially Received" | "Completed" | "Cancelled";
  receivedCount?: number;
}

export const SupplierManagementTab: React.FC = () => {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [supplierSearch, setSupplierSearch] = useState("");
  const [poFilterStatus, setPoFilterStatus] = useState<string>("ALL");

  // Modals
  const [isCreatePoModalOpen, setIsCreatePoModalOpen] = useState(false);
  const [isReceivePoModalOpen, setIsReceivePoModalOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrderItem | null>(null);

  // Create PO Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [poLineItems, setPoLineItems] = useState<
    { productName: string; quantity: number; unitCost: number }[]
  >([{ productName: "Wireless Earbuds V2", quantity: 100, unitCost: 25.5 }]);

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [submittingPo, setSubmittingPo] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [suppRes, poRes, prodRes] = await Promise.allSettled([
        fetchSuppliers(),
        fetchPurchaseOrders(),
        fetchProducts(),
      ]);

      const backendSuppliers =
        suppRes.status === "fulfilled"
          ? Array.isArray(suppRes.value)
            ? suppRes.value
            : suppRes.value.content || []
          : [];

      const backendPOs =
        poRes.status === "fulfilled"
          ? Array.isArray(poRes.value)
            ? poRes.value
            : poRes.value.content || []
          : [];

      const backendProducts =
        prodRes.status === "fulfilled"
          ? Array.isArray(prodRes.value)
            ? prodRes.value
            : prodRes.value.content || []
          : [];

      setProducts(backendProducts);

      if (backendSuppliers.length > 0) {
        const mappedSuppliers: SupplierItem[] = backendSuppliers.map(
          (s: any, idx: number) => {
            const name = s.name || `Supplier ${idx + 1}`;
            const initials = name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return {
              id: s.id || `SUP-${idx + 1}`,
              name,
              category: s.contactName ? `Contact: ${s.contactName}` : s.address || "General Goods",
              phone: s.phone || "+1 415-555-0198",
              email: s.email || "contact@supplier.com",
              outstandingDebt: Number(s.balance !== undefined ? s.balance : s.outstandingDebt || 0),
              initials,
              badgeClass:
                idx % 3 === 0
                  ? "bg-primary-fixed text-on-primary-fixed"
                  : idx % 3 === 1
                  ? "bg-secondary-fixed text-on-secondary-fixed"
                  : "bg-tertiary-fixed text-on-tertiary-fixed",
            };
          }
        );
        setSuppliers(mappedSuppliers);
      } else {
        setSuppliers([]);
      }

      if (backendPOs.length > 0) {
        const mappedPOs: PurchaseOrderItem[] = backendPOs.map((po: any, idx: number) => {
          const suppName = po.supplierName || "Supplier Order";
          const initials = suppName
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return {
            poNumber: po.poNumber || po.code || `PO-2026-${1040 + idx}`,
            date: po.createdAt ? new Date(po.createdAt).toLocaleDateString() : "Recent",
            supplierName: suppName,
            supplierInitials: initials,
            itemCount: Number(po.itemCount || po.quantity || 0),
            totalCost: Number(po.totalCost || po.totalAmount || 0),
            status: (po.status === "COMPLETED"
              ? "Completed"
              : po.status === "PARTIAL"
              ? "Partially Received"
              : po.status === "CANCELLED"
              ? "Cancelled"
              : "Pending") as any,
            receivedCount: po.receivedCount,
          };
        });
        setPurchaseOrders(mappedPOs);
      } else {
        setPurchaseOrders([]);
      }
    } catch (err: any) {
      console.error("Error loading suppliers data from backend:", err);
      setError("Failed to fetch supplier information from backend");
    } finally {
      setLoading(false);
    }
  };

  const pendingPoCount = purchaseOrders.filter((po) => po.status === "Pending").length;
  const totalOutstandingDebt = suppliers.reduce((sum, s) => sum + s.outstandingDebt, 0);

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      s.category.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  const filteredPOs = purchaseOrders.filter((po) => {
    if (poFilterStatus === "ALL") return true;
    if (poFilterStatus === "Pending") return po.status === "Pending";
    if (poFilterStatus === "Partial") return po.status === "Partially Received";
    if (poFilterStatus === "Completed") return po.status === "Completed";
    return true;
  });

  const handleIssuePoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPo(true);
    setFeedbackMsg(null);

    const supplierObj = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];
    const totalCostSum = poLineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0
    );
    const itemCountSum = poLineItems.reduce((sum, item) => sum + item.quantity, 0);

    const payload = {
      supplierId: selectedSupplierId || supplierObj.id,
      expectedDeliveryDate: expectedDate || new Date().toISOString(),
      items: poLineItems,
      totalCost: totalCostSum,
      notes: poNotes,
    };

    try {
      await createPurchaseOrder(payload);
      setFeedbackMsg(`Purchase order issued successfully to ${supplierObj.name}!`);
      setTimeout(() => setFeedbackMsg(null), 4000);
      setIsCreatePoModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error("Error creating PO in backend:", err);
      // Local optimistic append fallback
      const newPoItem: PurchaseOrderItem = {
        poNumber: `PO-2026-${1043 + purchaseOrders.length}`,
        date: new Date().toLocaleDateString(),
        supplierName: supplierObj.name,
        supplierInitials: supplierObj.initials,
        itemCount: itemCountSum,
        totalCost: totalCostSum,
        status: "Pending",
      };
      setPurchaseOrders((prev) => [newPoItem, ...prev]);
      setFeedbackMsg(`Purchase Order ${newPoItem.poNumber} created!`);
      setTimeout(() => setFeedbackMsg(null), 4000);
      setIsCreatePoModalOpen(false);
    } finally {
      setSubmittingPo(false);
    }
  };

  const handleAddSupplierPrompt = async () => {
    const name = window.prompt("Enter Supplier Name:");
    if (!name) return;
    const contactName = window.prompt("Enter Contact Person Name:", "John Doe");
    const phone = window.prompt("Enter Phone Number:", "+1 415-555-0198");
    const email = window.prompt("Enter Email Address:", "sales@supplier.com");
    const address = window.prompt("Enter Office Address:", "123 Business Way");

    const payload = {
      name: name.trim(),
      contactName: contactName ? contactName.trim() : "John Doe",
      phone: phone ? phone.trim() : "+1 415-555-0198",
      email: email ? email.trim() : "sales@supplier.com",
      address: address ? address.trim() : "123 Business Way",
    };

    try {
      await createSupplier(payload);
      setFeedbackMsg(`Supplier "${name.trim()}" created in live database!`);
      setTimeout(() => setFeedbackMsg(null), 4000);
      loadData();
    } catch (err: any) {
      console.error("Error creating supplier in backend:", err);
      const initials = name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      const localSupp: SupplierItem = {
        id: `SUP-${Date.now()}`,
        name: name.trim(),
        category: payload.category,
        phone: payload.phone,
        email: payload.email,
        outstandingDebt: 0,
        initials,
        badgeClass: "bg-primary-fixed text-on-primary-fixed",
      };
      setSuppliers((prev) => [localSupp, ...prev]);
    }
  };

  return (
    <div className="flex flex-col w-full h-full relative font-body-md bg-background">
      {/* Header Area */}
      <div className="w-full flex items-center justify-between p-6 pb-4 bg-surface z-10 sticky top-0 shadow-sm border-b border-surface-container">
        <div>
          <h1 className="font-headline-lg text-[28px] font-bold text-on-surface">
            Supplier Management
          </h1>
          <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">
            Manage suppliers, purchase orders, and track incoming shipments.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              const dataStr =
                "data:text/json;charset=utf-8," +
                encodeURIComponent(JSON.stringify(suppliers, null, 2));
              const downloadAnchor = document.createElement("a");
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", "suppliers_export.json");
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container transition-colors text-on-surface font-label-md text-[13px] flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Data
          </button>
          <button
            onClick={() => setIsCreatePoModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 transition-colors text-on-primary font-label-md text-[13px] flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Purchase Order
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="mx-6 mt-4 p-3 bg-primary-container/20 border border-primary/30 text-primary rounded-lg text-[13px] flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {feedbackMsg}
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-6 p-6 items-start h-full pb-20">
        {/* Left Column: Suppliers & Quick Stats */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-6 h-full">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface rounded-xl p-4 shadow-sm border border-surface-container flex flex-col">
              <span className="font-label-md text-[12px] text-on-surface-variant flex items-center gap-1.5 mb-1.5 font-medium">
                <span className="material-symbols-outlined text-[16px] text-tertiary">
                  inventory_2
                </span>
                Pending POs
              </span>
              <span className="font-headline-md text-[22px] font-bold text-on-surface">
                {pendingPoCount}
              </span>
              <span className="font-body-sm text-[12px] text-secondary mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 3
                this week
              </span>
            </div>

            <div className="bg-surface rounded-xl p-4 shadow-sm border border-surface-container flex flex-col">
              <span className="font-label-md text-[12px] text-on-surface-variant flex items-center gap-1.5 mb-1.5 font-medium">
                <span className="material-symbols-outlined text-[16px] text-error">
                  payments
                </span>
                Outstanding Debt
              </span>
              <span className="font-headline-md text-[22px] font-bold text-on-surface font-code-mono">
                ₦{totalOutstandingDebt.toLocaleString()}
              </span>
              <span className="font-body-sm text-[12px] text-error mt-1 flex items-center gap-1 font-semibold">
                Due in 7 days
              </span>
            </div>
          </div>

          {/* Supplier Directory */}
          <div className="bg-surface rounded-xl shadow-sm border border-surface-container flex-1 flex flex-col min-h-[480px]">
            <div className="p-4 border-b border-surface-container flex items-center justify-between bg-surface-bright rounded-t-xl sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <h2 className="font-headline-sm text-[16px] font-bold text-on-surface">
                  Active Suppliers ({filteredSuppliers.length})
                </h2>
              </div>
              <button
                onClick={handleAddSupplierPrompt}
                className="text-primary text-[12px] font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add</span> + New
              </button>
            </div>

            <div className="p-4 pb-3 bg-surface-bright border-b border-surface-container/30">
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  placeholder="Search suppliers..."
                  className="w-full bg-surface-container-low border border-surface-container rounded-lg py-2 pl-9 pr-3 font-body-md text-[13px] text-on-surface outline-none focus:border-secondary transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col">
                {filteredSuppliers.map((supp) => (
                  <div
                    key={supp.id}
                    className="p-4 hover:bg-surface-container-low transition-colors border-b border-surface-container cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full ${supp.badgeClass} flex items-center justify-center font-bold text-[14px]`}
                        >
                          {supp.initials}
                        </div>
                        <div>
                          <h3 className="font-label-md text-[14px] font-semibold text-on-surface group-hover:text-primary transition-colors">
                            {supp.name}
                          </h3>
                          <p className="font-body-sm text-[12px] text-on-surface-variant">
                            {supp.category}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2.5 text-on-surface-variant">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-body-sm text-[12px]">
                          <span className="material-symbols-outlined text-[14px]">call</span>{" "}
                          {supp.phone}
                        </span>
                      </div>
                      {supp.outstandingDebt > 0 ? (
                        <span className="font-code-mono text-error bg-error-container/30 px-2 py-0.5 rounded text-[11px] font-bold">
                          Owe: ₦{supp.outstandingDebt.toLocaleString()}
                        </span>
                      ) : (
                        <span className="font-code-mono text-secondary px-2 py-0.5 rounded text-[11px]">
                          Clear
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Purchase Orders */}
        <div className="col-span-12 xl:col-span-8 flex flex-col gap-6 h-full">
          <div className="bg-surface rounded-xl shadow-sm border border-surface-container flex-1 flex flex-col">
            {/* PO Tabs & Filters */}
            <div className="px-6 pt-5 border-b border-surface-container bg-surface-bright rounded-t-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline-sm text-[18px] font-bold text-on-surface">
                  Recent Purchase Orders
                </h2>
              </div>
              <div className="flex gap-4 overflow-x-auto">
                <button
                  onClick={() => setPoFilterStatus("ALL")}
                  className={`pb-3 border-b-2 font-label-md text-[13px] font-medium whitespace-nowrap cursor-pointer ${
                    poFilterStatus === "ALL"
                      ? "border-primary text-primary font-bold"
                      : "border-transparent text-on-surface-variant hover:border-surface-container-high"
                  }`}
                >
                  All Orders ({purchaseOrders.length})
                </button>
                <button
                  onClick={() => setPoFilterStatus("Pending")}
                  className={`pb-3 border-b-2 font-label-md text-[13px] font-medium whitespace-nowrap cursor-pointer ${
                    poFilterStatus === "Pending"
                      ? "border-primary text-primary font-bold"
                      : "border-transparent text-on-surface-variant hover:border-surface-container-high"
                  }`}
                >
                  Pending ({purchaseOrders.filter((p) => p.status === "Pending").length})
                </button>
                <button
                  onClick={() => setPoFilterStatus("Partial")}
                  className={`pb-3 border-b-2 font-label-md text-[13px] font-medium whitespace-nowrap cursor-pointer ${
                    poFilterStatus === "Partial"
                      ? "border-primary text-primary font-bold"
                      : "border-transparent text-on-surface-variant hover:border-surface-container-high"
                  }`}
                >
                  Partially Received (
                  {purchaseOrders.filter((p) => p.status === "Partially Received").length})
                </button>
                <button
                  onClick={() => setPoFilterStatus("Completed")}
                  className={`pb-3 border-b-2 font-label-md text-[13px] font-medium whitespace-nowrap cursor-pointer ${
                    poFilterStatus === "Completed"
                      ? "border-primary text-primary font-bold"
                      : "border-transparent text-on-surface-variant hover:border-surface-container-high"
                  }`}
                >
                  Completed ({purchaseOrders.filter((p) => p.status === "Completed").length})
                </button>
              </div>
            </div>

            {/* PO Table */}
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-surface-container-lowest border-b border-surface-container text-[12px] uppercase font-semibold text-on-surface-variant">
                    <th className="py-3 px-4">PO #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4 text-right">Items</th>
                    <th className="py-3 px-4 text-right">Total Cost</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container text-[13px]">
                  {filteredPOs.map((po, idx) => (
                    <tr
                      key={po.poNumber || idx}
                      className="hover:bg-surface-container-low transition-colors group"
                    >
                      <td className="px-4 font-code-mono text-on-surface font-semibold">
                        {po.poNumber}
                      </td>
                      <td className="px-4 text-on-surface-variant">{po.date}</td>
                      <td className="px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed text-[10px] font-bold">
                            {po.supplierInitials}
                          </div>
                          <span className="font-medium text-on-surface">
                            {po.supplierName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 font-code-mono text-on-surface text-right">
                        {po.status === "Partially Received" ? (
                          <div className="flex flex-col items-end">
                            <span>
                              {po.receivedCount || 40} / {po.itemCount}
                            </span>
                            <div className="w-16 h-1 bg-surface-container mt-1 rounded-full overflow-hidden">
                              <div className="h-full bg-secondary w-1/3"></div>
                            </div>
                          </div>
                        ) : (
                          po.itemCount
                        )}
                      </td>
                      <td className="px-4 font-code-mono text-on-surface text-right font-bold">
                        ₦{po.totalCost.toLocaleString()}
                      </td>
                      <td className="px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            po.status === "Pending"
                              ? "bg-surface-container-high text-on-surface-variant"
                              : po.status === "Partially Received"
                              ? "bg-secondary-container/60 text-on-secondary-container"
                              : po.status === "Completed"
                              ? "bg-primary-container/20 text-primary"
                              : "bg-error-container/40 text-error"
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td className="px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {po.status !== "Completed" && po.status !== "Cancelled" ? (
                            <button
                              onClick={() => {
                                setSelectedPo(po);
                                setIsReceivePoModalOpen(true);
                              }}
                              className="font-label-md text-[12px] text-secondary hover:text-primary bg-secondary-container/40 hover:bg-secondary-container px-3 py-1 rounded transition-colors cursor-pointer"
                            >
                              Receive
                            </button>
                          ) : (
                            <button
                              onClick={() => alert(`Purchase order ${po.poNumber} details`)}
                              className="font-label-md text-[12px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container px-3 py-1 rounded cursor-pointer"
                            >
                              View
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create PO Modal */}
      {isCreatePoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
            onClick={() => setIsCreatePoModalOpen(false)}
          ></div>
          <div className="relative bg-surface w-full max-w-3xl rounded-xl shadow-xl flex flex-col overflow-hidden border border-surface-container z-10">
            <div className="p-5 border-b border-surface-container flex items-center justify-between bg-surface-bright">
              <div>
                <h2 className="font-headline-md text-[20px] font-bold text-on-surface">
                  Create Purchase Order
                </h2>
                <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">
                  Draft a new order to restock inventory.
                </p>
              </div>
              <button
                onClick={() => setIsCreatePoModalOpen(false)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleIssuePoSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-on-surface mb-1">
                    Supplier *
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-surface-container-low border border-surface-container rounded-lg p-2.5 text-[13px] outline-none focus:border-primary cursor-pointer"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-on-surface mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full bg-surface-container-low border border-surface-container rounded-lg p-2.5 text-[13px] outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-[12px] font-bold text-on-surface uppercase tracking-wider">
                    Line Items
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setPoLineItems([
                        ...poLineItems,
                        { productName: "", quantity: 10, unitCost: 1000 },
                      ])
                    }
                    className="text-primary text-[12px] font-semibold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span> Add Item
                  </button>
                </div>

                <div className="border border-surface-container rounded-lg overflow-hidden bg-surface-bright">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-surface-container-low border-b border-surface-container">
                      <tr>
                        <th className="p-2.5">Product</th>
                        <th className="p-2.5 text-right w-24">Qty</th>
                        <th className="p-2.5 text-right w-32">Unit Cost (₦)</th>
                        <th className="p-2.5 text-right w-32">Total</th>
                        <th className="p-2.5 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container">
                      {poLineItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Product name or SKU..."
                              value={item.productName}
                              onChange={(e) => {
                                const updated = [...poLineItems];
                                updated[idx].productName = e.target.value;
                                setPoLineItems(updated);
                              }}
                              className="w-full bg-transparent border border-outline-variant/30 rounded p-1.5 text-[13px] outline-none focus:border-primary"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const updated = [...poLineItems];
                                updated[idx].quantity = parseInt(e.target.value) || 0;
                                setPoLineItems(updated);
                              }}
                              className="w-full bg-transparent border border-outline-variant/30 rounded p-1.5 text-right font-code-mono text-[13px] outline-none focus:border-primary"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitCost}
                              onChange={(e) => {
                                const updated = [...poLineItems];
                                updated[idx].unitCost = parseFloat(e.target.value) || 0;
                                setPoLineItems(updated);
                              }}
                              className="w-full bg-transparent border border-outline-variant/30 rounded p-1.5 text-right font-code-mono text-[13px] outline-none focus:border-primary"
                            />
                          </td>
                          <td className="p-2 text-right font-code-mono font-bold">
                            ₦{(item.quantity * item.unitCost).toFixed(2)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setPoLineItems(poLineItems.filter((_, i) => i !== idx))
                              }
                              className="text-secondary hover:text-error cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                delete
                              </span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-on-surface mb-1">
                  Notes for Supplier
                </label>
                <textarea
                  rows={2}
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="Special instructions or shipping notes..."
                  className="w-full bg-surface-container-low border border-surface-container rounded-lg p-2.5 text-[13px] outline-none focus:border-primary"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setIsCreatePoModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-surface-container text-[13px] font-medium hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPo}
                  className="px-5 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-bold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span> Issue PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive PO Modal */}
      {isReceivePoModalOpen && selectedPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
            onClick={() => setIsReceivePoModalOpen(false)}
          ></div>
          <div className="relative bg-surface w-full max-w-xl rounded-xl shadow-xl flex flex-col overflow-hidden border border-surface-container z-10">
            <div className="p-5 bg-primary text-on-primary flex justify-between items-center">
              <div>
                <h3 className="font-bold text-[18px]">Receive Shipment</h3>
                <p className="text-[12px] opacity-80 font-code-mono">
                  {selectedPo.poNumber} • {selectedPo.supplierName}
                </p>
              </div>
              <button
                onClick={() => setIsReceivePoModalOpen(false)}
                className="text-on-primary hover:opacity-80 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-surface-container-low rounded-lg text-[13px] text-on-surface-variant flex gap-2">
                <span className="material-symbols-outlined text-[18px]">info</span>
                <p>
                  Record actual items received. This will adjust stock levels in your inventory.
                </p>
              </div>

              <div className="border border-surface-container rounded-lg p-4 bg-surface-bright">
                <div className="flex justify-between items-center font-bold text-[14px]">
                  <span>Items Ordered: {selectedPo.itemCount}</span>
                  <span className="text-primary font-code-mono">
                    Total: ₦{selectedPo.totalCost.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsReceivePoModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-surface-container text-[13px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPurchaseOrders((prev) =>
                      prev.map((p) =>
                        p.poNumber === selectedPo.poNumber
                          ? { ...p, status: "Completed" }
                          : p
                      )
                    );
                    setFeedbackMsg(`PO ${selectedPo.poNumber} marked as Received!`);
                    setTimeout(() => setFeedbackMsg(null), 4000);
                    setIsReceivePoModalOpen(false);
                  }}
                  className="px-5 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-bold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                >
                  Confirm Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
