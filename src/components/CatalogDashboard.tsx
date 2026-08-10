import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchProducts } from "../utils/apiClient";

export const CatalogDashboard: React.FC = () => {
  const { hasPermission, hasRole } = useAuth();
  const canWrite = hasPermission("INVENTORY_WRITE") || hasPermission("PRODUCT_WRITE") || hasRole("ADMIN");

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [stockStatus, setStockStatus] = useState({
    inStock: true,
    lowStock: true,
    outOfStock: true,
  });
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected Checkboxes
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    setLoading(true);
    setError(null);
    fetchProducts()
      .then((data) => {
        const list = Array.isArray(data) ? data : data.content || [];
        setProducts(list);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setError(err.message || "Failed to load products from server");
        setLoading(false);
      });
  };

  // Categories extraction
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
    const isOut = stock === 0;
    const isLow = stock > 0 && stock <= 10;
    const isIn = stock > 10;

    let matchesStock = false;
    if (stockStatus.inStock && isIn) matchesStock = true;
    if (stockStatus.lowStock && isLow) matchesStock = true;
    if (stockStatus.outOfStock && isOut) matchesStock = true;

    const price = Number(item.price || 0);
    const matchesMin = minPrice === "" || price >= Number(minPrice);
    const matchesMax = maxPrice === "" || price <= Number(maxPrice);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStock &&
      matchesMin &&
      matchesMax
    );
  });

  // Calculate Metrics
  const totalActive = products.length;
  const totalCategories = categories.length || 1;
  const lowOrOut = products.filter((p) => {
    const qty = p.stockQuantity ?? p.stock ?? p.quantity ?? 0;
    return qty <= 10;
  }).length;

  // Pagination Math
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const currentItems = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSelectAll = () => {
    if (selectedProducts.length === currentItems.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(currentItems.map((p) => p.id || p.sku));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("ALL");
    setStockStatus({ inStock: true, lowStock: true, outOfStock: true });
    setMinPrice("");
    setMaxPrice("");
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col w-full px-gutter py-margin-desktop gap-lg relative text-on-background">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-lg">
        <div>
          <h1 class="font-headline-lg text-headline-lg text-on-surface">
            Master Catalog
          </h1>
          <p className="font-body-lg text-body-lg text-secondary mt-1">
            Manage and organize all active inventory across all stores.
          </p>
        </div>
        <div className="flex gap-sm items-center self-end md:self-auto flex-wrap">
          <button
            onClick={() => alert("Taxonomy manager modal")}
            className="flex items-center gap-xs bg-surface-container-lowest text-on-surface border border-outline-variant shadow-sm hover:bg-surface-container-low transition-colors px-4 py-2 rounded-lg font-label-sm text-label-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              account_tree
            </span>
            Manage Taxonomy
          </button>
          <button
            onClick={() => {
              const dataStr =
                "data:text/json;charset=utf-8," +
                encodeURIComponent(JSON.stringify(filteredProducts, null, 2));
              const downloadAnchor = document.createElement("a");
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute(
                "download",
                `catalog_export_${new Date().toISOString().slice(0, 10)}.json`
              );
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="flex items-center gap-xs bg-surface-container-lowest text-on-surface border border-outline-variant shadow-sm hover:bg-surface-container-low transition-colors px-4 py-2 rounded-lg font-label-sm text-label-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              file_download
            </span>
            Export
          </button>
          {canWrite && (
            <button
              onClick={() => alert("Add Product feature initiated")}
              className="flex items-center gap-xs bg-primary text-on-primary border-none shadow-sm hover:shadow-md transition-shadow px-4 py-2 rounded-lg font-label-sm text-label-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Product
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md w-full">
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant/30 flex items-center gap-md">
          <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">inventory_2</span>
          </div>
          <div>
            <p className="text-label-sm text-secondary font-medium">
              Total Active Products
            </p>
            <p className="text-title-md font-semibold text-on-surface">
              {loading ? "..." : totalActive.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant/30 flex items-center gap-md">
          <div className="w-12 h-12 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined">category</span>
          </div>
          <div>
            <p className="text-label-sm text-secondary font-medium">
              Total Categories
            </p>
            <p className="text-title-md font-semibold text-on-surface">
              {loading ? "..." : totalCategories}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant/30 flex items-center gap-md">
          <div className="w-12 h-12 rounded-full bg-error-container/30 flex items-center justify-center text-error">
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div>
            <p className="text-label-sm text-secondary font-medium">
              Out of Stock / Low
            </p>
            <p className="text-title-md font-semibold text-on-surface">
              {loading ? "..." : lowOrOut}
            </p>
          </div>
        </div>
      </div>

      {/* Main Catalog Content */}
      <div className="flex flex-col lg:flex-row gap-lg w-full items-stretch">
        {/* Left Filter Sidebar */}
        <div className="w-full lg:w-1/4 bg-surface-container-lowest shadow-sm rounded-xl p-md flex flex-col gap-lg border border-outline-variant/30">
          <h2 className="font-title-md text-title-md text-on-surface">
            Filters
          </h2>

          <div className="flex flex-col gap-sm">
            <label className="font-label-sm text-label-sm text-secondary">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md rounded-lg p-2.5 border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-sm">
            <label className="font-label-sm text-label-sm text-secondary">
              Stock Status
            </label>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={stockStatus.inStock}
                  onChange={(e) =>
                    setStockStatus({
                      ...stockStatus,
                      inStock: e.target.checked,
                    })
                  }
                  className="accent-primary w-4 h-4 rounded border-outline-variant focus:ring-primary/20 cursor-pointer"
                />
                <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">
                  In Stock
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={stockStatus.lowStock}
                  onChange={(e) =>
                    setStockStatus({
                      ...stockStatus,
                      lowStock: e.target.checked,
                    })
                  }
                  className="accent-primary w-4 h-4 rounded border-outline-variant focus:ring-primary/20 cursor-pointer"
                />
                <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">
                  Low Stock
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={stockStatus.outOfStock}
                  onChange={(e) =>
                    setStockStatus({
                      ...stockStatus,
                      outOfStock: e.target.checked,
                    })
                  }
                  className="accent-primary w-4 h-4 rounded border-outline-variant focus:ring-primary/20 cursor-pointer"
                />
                <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">
                  Out of Stock
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-sm">
            <label className="font-label-sm text-label-sm text-secondary">
              Price Range
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                className="w-full bg-surface-container-low border border-outline-variant/50 text-on-surface font-body-md text-body-md rounded-lg p-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
              <span className="text-secondary">-</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                className="w-full bg-surface-container-low border border-outline-variant/50 text-on-surface font-body-md text-body-md rounded-lg p-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="mt-auto pt-4 flex gap-2">
            <button
              onClick={handleResetFilters}
              className="flex-1 bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors py-2 rounded-lg font-label-sm text-label-sm cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={() => setCurrentPage(1)}
              className="flex-1 bg-primary text-on-primary shadow-sm hover:shadow-md transition-shadow py-2 rounded-lg font-label-sm text-label-sm cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Right Product Data Table */}
        <div className="w-full lg:w-3/4 bg-surface-container-lowest shadow-sm rounded-xl flex flex-col overflow-hidden border border-outline-variant/30">
          <div className="p-md bg-surface-container-lowest flex items-center justify-between border-b border-outline-variant/30 gap-md">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by SKU or Name..."
                className="w-full bg-surface-container-low border border-outline-variant/50 text-on-surface font-body-md text-body-md rounded-full py-2 pl-10 pr-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-md hidden md:flex">
              <span className="font-body-md text-body-md text-secondary">
                Showing {filteredProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of{" "}
                {filteredProducts.length}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded hover:bg-surface-container-high transition-colors text-secondary disabled:opacity-30 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    chevron_left
                  </span>
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 rounded hover:bg-surface-container-high transition-colors text-secondary disabled:opacity-30 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant/30 text-[11px] uppercase font-semibold text-secondary">
                <tr>
                  <th className="p-2.5 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={
                        currentItems.length > 0 &&
                        selectedProducts.length === currentItems.length
                      }
                      onChange={toggleSelectAll}
                      className="accent-primary rounded cursor-pointer"
                    />
                  </th>
                  <th className="p-2.5 cursor-pointer hover:text-on-surface transition-colors group">
                    SKU
                  </th>
                  <th className="p-2.5 cursor-pointer hover:text-on-surface transition-colors group">
                    Product Name
                  </th>
                  <th className="p-2.5">
                    Category
                  </th>
                  <th className="p-2.5 text-right">
                    Base Price
                  </th>
                  <th className="p-2.5 text-center">
                    Unit
                  </th>
                  <th className="p-2.5 text-right">
                    Available Stock
                  </th>
                  <th className="p-2.5 text-center">
                    Status
                  </th>
                  <th className="p-2.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant/20">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-secondary">
                      <span className="material-symbols-outlined animate-spin text-2xl">
                        progress_activity
                      </span>
                      <p className="mt-2 text-label-sm">Fetching catalog products...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-error bg-error-container/10">
                      <span className="material-symbols-outlined text-[20px] align-middle mr-1">
                        warning
                      </span>
                      {error}
                      <button
                        onClick={loadProducts}
                        className="ml-4 underline text-primary cursor-pointer font-medium"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-secondary">
                      No products match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((item, idx) => {
                    const sku = item.sku || item.id || `PROD-${idx + 1}`;
                    const name = item.name || item.title || "Unnamed Product";
                    const cat = item.categoryName || item.category || "General";
                    const price = Number(item.price || 0);
                    const unit = item.unit || "pcs";
                    const stock = item.stockQuantity ?? item.stock ?? item.quantity ?? 0;
                    
                    let statusLabel = "Active";
                    let statusBadgeClass =
                      "bg-primary-container/10 text-primary-container border-primary-container/20";
                    let dotClass = "bg-primary-container";

                    if (stock === 0) {
                      statusLabel = "Out of Stock";
                      statusBadgeClass = "bg-error-container text-error border-error/30";
                      dotClass = "bg-error";
                    } else if (stock <= 10) {
                      statusLabel = "Low Stock";
                      statusBadgeClass = "bg-error-container/20 text-error border-error/20";
                      dotClass = "bg-error";
                    } else if (item.active === false) {
                      statusLabel = "Inactive";
                      statusBadgeClass =
                        "bg-surface-container-high text-secondary border-outline-variant";
                      dotClass = "bg-secondary";
                    }

                    const isChecked = selectedProducts.includes(item.id || sku);

                    return (
                      <tr
                        key={item.id || idx}
                        className={`hover:bg-surface-container-low transition-colors group cursor-pointer ${
                          stock === 0 ? "bg-error-container/5" : ""
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectProduct(item.id || sku)}
                            className="accent-primary rounded cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-code-mono text-secondary group-hover:text-primary transition-colors text-[13px]">
                          {sku}
                        </td>
                        <td className="p-3 font-medium">{name}</td>
                        <td className="p-3 text-secondary">{cat}</td>
                        <td className="p-3 text-right font-code-mono text-[13px]">
                          ${price.toFixed(2)}
                        </td>
                        <td className="p-3 text-center text-secondary">{unit}</td>
                        <td
                          className={`p-3 text-right font-code-mono text-[13px] ${
                            stock === 0
                              ? "text-error font-bold"
                              : stock <= 10
                              ? "text-error font-medium"
                              : ""
                          }`}
                        >
                          {stock}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-[11px] font-medium border ${statusBadgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                            {statusLabel}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => alert(`Adjust stock for ${name}`)}
                              className="text-secondary hover:text-primary transition-colors p-1.5 rounded hover:bg-surface-container-high cursor-pointer"
                              title="Adjust Stock"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                inventory
                              </span>
                            </button>
                            {canWrite && (
                              <>
                                <button
                                  onClick={() => alert(`Edit ${name}`)}
                                  className="text-secondary hover:text-primary transition-colors p-1.5 rounded hover:bg-surface-container-high cursor-pointer"
                                  title="Edit"
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    edit
                                  </span>
                                </button>
                                <button
                                  onClick={() => alert(`Delete ${name}`)}
                                  className="text-secondary hover:text-error transition-colors p-1.5 rounded hover:bg-error-container/30 cursor-pointer"
                                  title="Delete"
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    delete
                                  </span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer & Pagination */}
          <div className="p-md bg-surface-container-lowest border-t border-outline-variant/30 flex justify-between items-center flex-wrap gap-md">
            <span className="font-body-md text-body-md text-secondary">
              Showing {filteredProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}{" "}
              to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of{" "}
              {filteredProducts.length} entries
            </span>
            <div className="flex gap-2 items-center">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-4 py-1.5 bg-surface-container-low border border-outline-variant/50 hover:bg-surface-container-high rounded shadow-sm text-on-surface font-label-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-4 py-1.5 rounded shadow-sm font-label-sm transition-colors cursor-pointer ${
                    currentPage === pageNum
                      ? "bg-primary text-on-primary hover:shadow-md"
                      : "bg-surface-container-low border border-outline-variant/50 hover:bg-surface-container-high text-on-surface"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-1.5 bg-surface-container-low border border-outline-variant/50 hover:bg-surface-container-high rounded shadow-sm text-on-surface font-label-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
