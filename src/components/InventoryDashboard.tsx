import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchProducts } from "../utils/apiClient";

export const InventoryDashboard: React.FC = () => {
  const { hasPermission, hasRole, user } = useAuth();
  const canWrite =
    hasPermission("INVENTORY_WRITE") ||
    hasPermission("PRODUCT_WRITE") ||
    hasRole("ADMIN");

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Stock Adjustment Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [adjustDirection, setAdjustDirection] = useState<"in" | "out">("in");
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState("New Stock Received");

  // Recent Audit Activity Log
  const [auditLog, setAuditLog] = useState<
    Array<{
      id: string;
      user: string;
      action: string;
      details: string;
      time: string;
      type: "in" | "out" | "edit";
    }>
  >([
    {
      id: "1",
      user: "Admin User",
      action: "added stock",
      details: "+45 units • Zenith Pro",
      time: "10 mins ago",
      type: "in",
    },
    {
      id: "2",
      user: "System",
      action: "audit adjustment",
      details: "-2 units • Lumina Mug",
      time: "1 hour ago",
      type: "out",
    },
    {
      id: "3",
      user: "Sarah J.",
      action: "changed threshold",
      details: "Min: 5 → 15 • ErgoFlex Chair",
      time: "Yesterday",
      type: "edit",
    },
  ]);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = () => {
    setLoading(true);
    setError(null);
    fetchProducts()
      .then((data) => {
        const list = Array.isArray(data) ? data : data.content || [];
        setProducts(list);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching inventory products:", err);
        setError(err.message || "Failed to load inventory from server");
        setLoading(false);
      });
  };

  // Categories list
  const categories = Array.from(
    new Set(
      products
        .map((p) => p.categoryName || p.category || "General")
        .filter(Boolean)
    )
  );

  // Filtering Logic
  const filteredProducts = products.filter((item) => {
    const sku = (item.sku || item.id || "").toString().toLowerCase();
    const name = (item.name || item.title || "").toLowerCase();
    const matchesSearch =
      sku.includes(searchQuery.toLowerCase()) ||
      name.includes(searchQuery.toLowerCase());

    const itemCategory = item.categoryName || item.category || "General";
    const matchesCategory =
      selectedCategory === "ALL" || itemCategory === selectedCategory;

    const stock = item.stockQuantity ?? item.stock ?? item.quantity ?? 0;
    const minThreshold = item.minStockThreshold || 15;
    const isLow = stock <= minThreshold;

    const matchesLowStock = !lowStockOnly || isLow;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // Metric Math
  const totalTrackedItems = products.length;
  const lowStockCount = products.filter((p) => {
    const qty = p.stockQuantity ?? p.stock ?? p.quantity ?? 0;
    const min = p.minStockThreshold || 15;
    return qty > 0 && qty <= min;
  }).length;

  const outOfStockCount = products.filter((p) => {
    const qty = p.stockQuantity ?? p.stock ?? p.quantity ?? 0;
    return qty === 0;
  }).length;

  const totalInventoryValue = products.reduce((acc, p) => {
    const qty = p.stockQuantity ?? p.stock ?? p.quantity ?? 0;
    const price = Number(p.price || 0);
    return acc + qty * price;
  }, 0);

  // Pagination Math
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const currentItems = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Modal Handlers
  const handleOpenAdjustModal = (product: any) => {
    setSelectedProduct(product);
    setAdjustDirection("in");
    setAdjustAmount(0);
    setAdjustReason("New Stock Received");
    setModalOpen(true);
  };

  const handleConfirmAdjustment = () => {
    if (!selectedProduct || adjustAmount <= 0) {
      setModalOpen(false);
      return;
    }

    const currentStock =
      selectedProduct.stockQuantity ??
      selectedProduct.stock ??
      selectedProduct.quantity ??
      0;

    const delta = adjustDirection === "in" ? adjustAmount : -adjustAmount;
    const newStock = Math.max(0, currentStock + delta);

    // Update local state
    setProducts((prev) =>
      prev.map((p) =>
        (p.id || p.sku) === (selectedProduct.id || selectedProduct.sku)
          ? { ...p, stockQuantity: newStock, stock: newStock }
          : p
      )
    );

    // Add to audit log
    const productName = selectedProduct.name || selectedProduct.title || "Product";
    const logItem = {
      id: Date.now().toString(),
      user: user?.username || "Admin User",
      action: adjustDirection === "in" ? "added stock" : "removed stock",
      details: `${adjustDirection === "in" ? "+" : "-"}${adjustAmount} units • ${productName}`,
      time: "Just now",
      type: adjustDirection,
    };

    setAuditLog((prev) => [logItem, ...prev]);
    setModalOpen(false);
  };

  return (
    <div className="flex flex-col w-full p-6 md:p-8 space-y-8 max-w-container-max mx-auto text-on-background">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface">
            Inventory Management
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Monitor stock levels, adjust quantities, and manage thresholds across all warehouses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const dataStr =
                "data:text/json;charset=utf-8," +
                encodeURIComponent(JSON.stringify(products, null, 2));
              const downloadAnchor = document.createElement("a");
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute(
                "download",
                `inventory_report_${new Date().toISOString().slice(0, 10)}.json`
              );
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="bg-surface-container-high text-on-surface px-4 py-2 rounded-lg font-body-sm flex items-center gap-2 hover:bg-surface-variant transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Export Report
          </button>
          {canWrite && (
            <button
              onClick={() => alert("Quick Receive Stock Modal")}
              className="bg-primary text-on-primary px-4 py-2 rounded-lg font-body-sm flex items-center gap-2 hover:bg-primary-container transition-colors shadow-md shadow-primary/20 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Stock Receive
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Items */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group border border-outline-variant/30">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
            <span className="font-data-label text-data-label text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-md flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-primary">
                trending_up
              </span>{" "}
              2.4%
            </span>
          </div>
          <div className="relative z-10">
            <h3 className="font-body-sm text-body-sm text-on-surface-variant mb-1">
              Total Tracked Items
            </h3>
            <p className="font-headline-md text-headline-md text-on-surface">
              {loading ? "..." : totalTrackedItems.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group border border-outline-variant/30">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/5 rounded-full blur-xl group-hover:bg-tertiary/10 transition-colors" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <span className="font-data-label text-data-label text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-md flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-error">
                trending_up
              </span>{" "}
              {lowStockCount} items
            </span>
          </div>
          <div className="relative z-10">
            <h3 className="font-body-sm text-body-sm text-on-surface-variant mb-1">
              Low Stock Items
            </h3>
            <div className="flex items-center gap-2">
              <p className="font-headline-md text-headline-md text-on-surface">
                {loading ? "..." : lowStockCount}
              </p>
              {lowStockCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group border border-outline-variant/30">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-error/5 rounded-full blur-xl group-hover:bg-error/10 transition-colors" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-error-container flex items-center justify-center text-on-error-container">
              <span className="material-symbols-outlined">remove_shopping_cart</span>
            </div>
            <span className="font-data-label text-data-label text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-md flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-primary">
                trending_down
              </span>{" "}
              {outOfStockCount} items
            </span>
          </div>
          <div className="relative z-10">
            <h3 className="font-body-sm text-body-sm text-on-surface-variant mb-1">
              Out of Stock
            </h3>
            <p className="font-headline-md text-headline-md text-error">
              {loading ? "..." : outOfStockCount}
            </p>
          </div>
        </div>

        {/* Total Value */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group border border-outline-variant/30">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/5 rounded-full blur-xl group-hover:bg-secondary/10 transition-colors" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="font-body-sm text-body-sm text-on-surface-variant mb-1">
              Total Inventory Value
            </h3>
            <p className="font-headline-md text-headline-md text-on-surface">
              {loading
                ? "..."
                : `$${(totalInventoryValue / 1000).toFixed(1)}k`}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area: Split Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Inventory Table Section */}
        <div className="flex-1 bg-surface-container-lowest rounded-2xl shadow-md overflow-hidden flex flex-col min-w-0 border border-outline-variant/30">
          {/* Toolbar */}
          <div className="p-5 bg-surface-container-low flex flex-col md:flex-row gap-4 justify-between items-center z-10 relative">
            <div className="relative w-full md:w-96 group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name or SKU..."
                className="w-full bg-surface-container-lowest rounded-lg py-2 pl-10 pr-4 font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-shadow border border-outline-variant/30"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-surface-container-lowest font-body-sm text-on-surface rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none pr-8 relative cursor-pointer border border-outline-variant/30"
              >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-2 rounded-lg shadow-sm border border-outline-variant/30">
                <input
                  type="checkbox"
                  id="lowStockOnly"
                  checked={lowStockOnly}
                  onChange={(e) => {
                    setLowStockOnly(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="accent-primary w-4 h-4 rounded cursor-pointer"
                />
                <label
                  htmlFor="lowStockOnly"
                  className="font-body-sm text-on-surface-variant cursor-pointer whitespace-nowrap"
                >
                  Low Stock Only
                </label>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-2.5 px-3 first:pl-4">Product Details</th>
                  <th className="py-2.5 px-3 hidden sm:table-cell">SKU</th>
                  <th className="py-2.5 px-3 text-right">Stock</th>
                  <th className="py-2.5 px-3 hidden md:table-cell">Status</th>
                  <th className="py-2.5 px-3 text-right hidden lg:table-cell">
                    Last Updated
                  </th>
                  <th className="py-2.5 px-3 text-right last:pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low bg-surface-container-lowest font-body-sm">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-secondary">
                      <span className="material-symbols-outlined animate-spin text-2xl">
                        progress_activity
                      </span>
                      <p className="mt-2 text-label-sm">Fetching stock inventory...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-error bg-error-container/10">
                      <span className="material-symbols-outlined text-[20px] align-middle mr-1">
                        warning
                      </span>
                      {error}
                      <button
                        onClick={loadInventory}
                        className="ml-4 underline text-primary cursor-pointer font-medium"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-secondary">
                      No stock items match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((item, idx) => {
                    const sku = item.sku || item.id || `SKU-${idx + 1}`;
                    const name = item.name || item.title || "Unnamed Product";
                    const stock =
                      item.stockQuantity ?? item.stock ?? item.quantity ?? 0;
                    const minThreshold = item.minStockThreshold || 15;

                    let rowClass = "hover:bg-surface-container/50 transition-colors group";
                    let accentBorder = null;
                    let badgeClass = "bg-primary/10 text-primary";
                    let dotClass = "bg-primary";
                    let statusText = "In Stock";

                    if (stock === 0) {
                      rowClass += " bg-error/5 relative";
                      accentBorder = (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-error" />
                      );
                      badgeClass = "bg-error/10 text-error";
                      dotClass = "bg-error";
                      statusText = "Out of Stock";
                    } else if (stock <= minThreshold) {
                      rowClass += " bg-tertiary/5 relative";
                      accentBorder = (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary" />
                      );
                      badgeClass = "bg-tertiary/10 text-tertiary";
                      dotClass = "bg-tertiary animate-pulse";
                      statusText = "Low Stock";
                    }

                    return (
                      <tr key={item.id || idx} className={rowClass}>
                        <td className="p-4 first:pl-6">
                          {accentBorder}
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-surface-container-high overflow-hidden shrink-0 flex items-center justify-center text-on-surface-variant">
                              <span className="material-symbols-outlined text-[20px]">
                                inventory_2
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-body-md text-on-surface font-medium truncate">
                                {name}
                              </p>
                              <p className="font-body-sm text-on-surface-variant truncate lg:hidden">
                                SKU: {sku}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden sm:table-cell font-data-label text-on-surface-variant">
                          {sku}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex flex-col items-end">
                            <span
                              className={`font-data-label text-[14px] ${
                                stock === 0
                                  ? "text-error font-bold"
                                  : stock <= minThreshold
                                  ? "text-tertiary font-bold"
                                  : "text-on-surface"
                              }`}
                            >
                              {stock}
                            </span>
                            <span className="text-[10px] text-on-surface-variant">
                              Min: {minThreshold}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-data-label text-[11px] ${badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                            {statusText}
                          </span>
                        </td>
                        <td className="p-4 text-right hidden lg:table-cell text-on-surface-variant font-data-label">
                          Today, 09:41
                        </td>
                        <td className="p-4 text-right last:pr-6">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                            <button
                              onClick={() => alert(`View history for ${name}`)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors cursor-pointer"
                              title="View History"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                history
                              </span>
                            </button>
                            <button
                              onClick={() => handleOpenAdjustModal(item)}
                              className="px-3 py-1.5 bg-surface-container hover:bg-surface-variant text-on-surface rounded-lg font-data-label text-[12px] transition-colors cursor-pointer"
                            >
                              Adjust
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-surface-container-low flex items-center justify-between bg-surface-container-lowest">
            <p className="font-body-sm text-on-surface-variant">
              Showing {filteredProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}{" "}
              to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of{" "}
              {filteredProducts.length} entries
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  chevron_left
                </span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded flex items-center justify-center font-body-sm font-medium transition-colors cursor-pointer ${
                    currentPage === pageNum
                      ? "bg-primary text-on-primary shadow-sm"
                      : "text-on-surface hover:bg-surface-container"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side Panel: Quick Audit Activity */}
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0 hidden xl:flex">
          <div className="bg-surface-container-lowest rounded-2xl shadow-md p-5 border border-surface-container-low">
            <h3 className="font-headline-md text-[18px] text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                history
              </span>
              Recent Audit Log
            </h3>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-surface-container before:to-transparent">
              {auditLog.map((log) => (
                <div key={log.id} className="relative flex items-start gap-4">
                  <div
                    className={`absolute left-0 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-surface-container-lowest z-10 ml-[18px] -translate-x-1.5 md:mx-auto md:translate-x-0 ${
                      log.type === "in"
                        ? "bg-primary"
                        : log.type === "out"
                        ? "bg-error"
                        : "bg-surface-variant"
                    }`}
                  />
                  <div className="flex-1 ml-10">
                    <p className="font-body-sm text-on-surface">
                      <span className="font-medium text-on-surface">{log.user}</span>{" "}
                      {log.action}
                    </p>
                    <p
                      className={`font-data-label text-[11px] mt-0.5 ${
                        log.type === "in"
                          ? "text-primary"
                          : log.type === "out"
                          ? "text-error"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {log.details}
                    </p>
                    <p className="font-data-label text-[10px] text-on-surface-variant mt-1 uppercase tracking-wider">
                      {log.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => alert("Full Audit Log Modal")}
              className="w-full mt-6 py-2 text-primary font-body-sm hover:bg-primary/5 rounded-lg transition-colors border border-primary/20 cursor-pointer"
            >
              View Full Audit Log
            </button>
          </div>

          {/* Mini Data Viz */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-md p-5 border border-surface-container-low flex-1 flex flex-col">
            <h3 className="font-headline-md text-[18px] text-on-surface mb-2">
              Stock Distribution
            </h3>
            <p className="font-body-sm text-on-surface-variant mb-4">
              By category
            </p>
            <div className="flex-1 flex flex-col justify-center gap-4">
              <div>
                <div className="flex justify-between font-data-label text-[11px] mb-1">
                  <span className="text-on-surface">Electronics</span>
                  <span className="text-on-surface-variant">45%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: "45%" }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-data-label text-[11px] mb-1">
                  <span className="text-on-surface">Apparel</span>
                  <span className="text-on-surface-variant">30%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-secondary h-full rounded-full"
                    style={{ width: "30%" }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-data-label text-[11px] mb-1">
                  <span className="text-on-surface">Home Goods</span>
                  <span className="text-on-surface-variant">25%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-tertiary h-full rounded-full"
                    style={{ width: "25%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {modalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-surface-container-low flex justify-between items-center bg-surface-container-lowest">
              <div>
                <h2 className="font-headline-md text-[20px] text-on-surface">
                  Adjust Stock
                </h2>
                <p className="font-body-sm text-on-surface-variant mt-1">
                  {selectedProduct.name || selectedProduct.title || "Product"} (
                  {selectedProduct.sku || selectedProduct.id})
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Toggle Direction */}
              <div className="flex p-1 bg-surface-container-low rounded-lg">
                <button
                  onClick={() => setAdjustDirection("in")}
                  className={`flex-1 py-2 font-body-sm font-medium rounded-md transition-all cursor-pointer ${
                    adjustDirection === "in"
                      ? "bg-surface-container-lowest shadow-sm text-primary"
                      : "text-on-surface-variant hover:bg-surface-container/50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] align-text-bottom mr-1">
                    add_circle
                  </span>{" "}
                  Stock In
                </button>
                <button
                  onClick={() => setAdjustDirection("out")}
                  className={`flex-1 py-2 font-body-sm font-medium rounded-md transition-all cursor-pointer ${
                    adjustDirection === "out"
                      ? "bg-surface-container-lowest shadow-sm text-error"
                      : "text-on-surface-variant hover:bg-surface-container/50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] align-text-bottom mr-1">
                    do_not_disturb_on
                  </span>{" "}
                  Stock Out
                </button>
              </div>

              {/* Input Group */}
              <div className="space-y-4">
                <div>
                  <label className="block font-data-label text-data-label text-on-surface-variant mb-1.5">
                    QUANTITY
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={adjustAmount}
                    onChange={(e) =>
                      setAdjustAmount(Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="w-full bg-surface-container-lowest border border-surface-container-high rounded-lg px-4 py-3 font-data-label text-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-right"
                  />
                </div>
                <div>
                  <label className="block font-data-label text-data-label text-on-surface-variant mb-1.5">
                    REASON
                  </label>
                  <select
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-surface-container-high rounded-lg px-4 py-3 font-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none transition-colors cursor-pointer"
                  >
                    <option value="New Stock Received">New Stock Received</option>
                    <option value="Customer Return">Customer Return</option>
                    <option value="Audit Discrepancy">Audit Discrepancy</option>
                    <option value="Damaged / Expired">Damaged / Expired</option>
                  </select>
                </div>
              </div>

              {/* Preview Card */}
              <div className="bg-surface-container rounded-xl p-4 flex items-center justify-between border border-surface-container-low relative overflow-hidden">
                <div className="relative z-10">
                  <p className="font-data-label text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">
                    Current Stock
                  </p>
                  <p className="font-data-label text-[20px] text-on-surface">
                    {selectedProduct.stockQuantity ??
                      selectedProduct.stock ??
                      selectedProduct.quantity ??
                      0}
                  </p>
                </div>
                <div className="relative z-10 text-on-surface-variant">
                  <span className="material-symbols-outlined">
                    arrow_forward
                  </span>
                </div>
                <div className="text-right relative z-10">
                  <p className="font-data-label text-[10px] text-primary uppercase tracking-wider mb-1">
                    New Stock
                  </p>
                  <p
                    className={`font-data-label text-[24px] font-bold ${
                      adjustDirection === "in" ? "text-primary" : "text-error"
                    }`}
                  >
                    {Math.max(
                      0,
                      (selectedProduct.stockQuantity ??
                        selectedProduct.stock ??
                        selectedProduct.quantity ??
                        0) +
                        (adjustDirection === "in"
                          ? adjustAmount
                          : -adjustAmount)
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-surface-container-low flex justify-end gap-3 border-t border-surface-container-high">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 font-body-sm text-on-surface hover:bg-surface-variant rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAdjustment}
                className="px-4 py-2 font-body-sm bg-primary text-on-primary hover:bg-primary-container rounded-lg shadow-sm shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  check
                </span>{" "}
                Confirm Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
