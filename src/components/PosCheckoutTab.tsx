import React, { useState, useEffect } from "react";
import { fetchProducts, createSale } from "../utils/apiClient";

export interface CartItem {
  product: any;
  quantity: number;
}

export const PosCheckoutTab: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  useEffect(() => {
    loadCatalogProducts();
  }, []);

  const loadCatalogProducts = () => {
    setLoading(true);
    setError(null);
    fetchProducts()
      .then((data) => {
        const list = Array.isArray(data) ? data : data.content || [];
        setProducts(list);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading POS products from backend:", err);
        setError(err.message || "Failed to load products from server");
        setLoading(false);
      });
  };

  const categories = Array.from(
    new Set(products.map((p) => p.categoryName || p.category || "General").filter(Boolean))
  );

  const filteredProducts = products.filter((item) => {
    const name = (item.name || "").toLowerCase();
    const sku = (item.sku || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = name.includes(query) || sku.includes(query);
    const itemCat = item.categoryName || item.category || "General";
    const matchesCat = selectedCategory === "ALL" || itemCat === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const addToCart = (product: any) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + Number(item.product.price || 0) * item.quantity,
    0
  );

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    setSuccessMessage(null);
    setError(null);

    try {
      const payload = {
        customerName: customerName.trim() || "Walk-in Customer",
        paymentMethod,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: Number(item.product.price || 0),
        })),
      };

      await createSale(payload);
      setSuccessMessage(`Transaction complete! Total: ₦${cartTotal.toFixed(2)}`);
      setCart([]);
      setCustomerName("");
      loadCatalogProducts();
    } catch (err: any) {
      console.error("POS Checkout Error:", err);
      setError(err.message || "Failed to process POS checkout transaction");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* Left Catalog Grid */}
      <div className="flex-1 bg-surface-container-lowest shadow-sm rounded-xl p-5 border border-outline-variant/30 flex flex-col overflow-hidden">
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-outline-variant/30">
          <div>
            <h2 className="font-headline-md text-[20px] text-on-surface font-bold">
              POS Terminal
            </h2>
            <p className="font-body-sm text-secondary text-[13px]">
              Select products from backend catalog to process sale
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search product name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-surface-container-low border border-outline-variant/50 text-on-surface font-body-md text-body-md rounded-lg py-2 px-3 outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-3 border-b border-outline-variant/20 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === "ALL"
                ? "bg-primary text-on-primary"
                : "bg-surface-container-low text-secondary hover:bg-surface-container-high"
            }`}
          >
            All Products ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-secondary hover:bg-surface-container-high"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-secondary gap-2 font-body-md">
              <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
              Loading backend catalog...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-secondary">
              <span className="material-symbols-outlined text-[36px] mb-2">search_off</span>
              <p className="font-body-md">No products found in backend catalog.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const stock = Number(product.quantityOnHand ?? product.stockQuantity ?? product.stock ?? 0);
                const isOutOfStock = stock <= 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`bg-surface-container-lowest p-4 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                      isOutOfStock
                        ? "opacity-50 border-outline-variant/30 cursor-not-allowed"
                        : "border-outline-variant/40 hover:border-primary hover:shadow-md"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-code-mono text-[11px] text-secondary bg-surface-container-low px-2 py-0.5 rounded">
                          {product.sku || "PROD"}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            isOutOfStock
                              ? "bg-error-container text-error"
                              : stock <= 10
                              ? "bg-warning-container text-warning"
                              : "bg-primary-container/20 text-primary"
                          }`}
                        >
                          {isOutOfStock ? "Out of Stock" : `${stock} ${product.unitName || "pcs"}`}
                        </span>
                      </div>
                      <h4 className="font-title-md font-bold text-on-surface text-[14px] line-clamp-1 mb-1">
                        {product.name}
                      </h4>
                      <p className="font-body-sm text-secondary text-[12px] mb-3">
                        {product.categoryName || "General"}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-outline-variant/20">
                      <span className="font-bold text-primary font-code-mono text-[15px]">
                        ₦{Number(product.price || 0).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        className="bg-primary text-on-primary p-1.5 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Cart Summary Panel */}
      <div className="w-full lg:w-96 bg-surface-container-lowest shadow-sm rounded-xl p-5 border border-outline-variant/30 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-outline-variant/30">
            <h3 className="font-headline-md text-[18px] text-on-surface font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">shopping_cart</span>
              Current Order
            </h3>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-[12px] text-error hover:underline font-medium cursor-pointer"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="p-3 mb-3 bg-error-container/20 border border-error/30 text-error rounded-lg text-[12px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 mb-3 bg-primary-container/20 border border-primary/30 text-primary rounded-lg text-[12px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              {successMessage}
            </div>
          )}

          {/* Cart Item List */}
          <div className="max-h-[320px] overflow-y-auto space-y-3 pr-1 mb-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-secondary">
                <span className="material-symbols-outlined text-[36px] mb-2 opacity-50">shopping_bag</span>
                <p className="font-body-md text-[13px]">Cart is empty</p>
                <p className="text-[11px] text-secondary/70">Click products on the left to add</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-surface-container-low p-3 rounded-lg flex items-center justify-between border border-outline-variant/30"
                >
                  <div className="flex-1 pr-2">
                    <p className="font-medium text-on-surface text-[13px] line-clamp-1">
                      {item.product.name}
                    </p>
                    <p className="font-code-mono text-[12px] text-primary font-semibold">
                      ₦{(Number(item.product.price || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-surface-container-lowest rounded-md border border-outline-variant/40">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-secondary hover:text-on-surface cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2 text-[12px] font-bold font-code-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-secondary hover:text-on-surface cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-secondary hover:text-error transition-colors p-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Customer & Payment Form */}
        <div className="pt-4 border-t border-outline-variant/30 space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-secondary mb-1">
              Customer Name / Reference
            </label>
            <input
              type="text"
              placeholder="e.g. Walk-in Customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/50 text-on-surface text-[13px] rounded-lg p-2 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-secondary mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/50 text-on-surface text-[13px] rounded-lg p-2 outline-none focus:border-primary cursor-pointer"
            >
              <option value="CASH">Cash Payment</option>
              <option value="CARD">Card / POS Terminal</option>
              <option value="TRANSFER">Bank Transfer</option>
            </select>
          </div>

          <div className="flex justify-between items-center py-2 border-t border-outline-variant/30">
            <span className="font-body-md font-semibold text-secondary text-[14px]">Total Payable</span>
            <span className="font-headline-md font-bold text-primary font-code-mono text-[20px]">
              ₦{cartTotal.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || submitting}
            className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-[14px]"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                Processing Sale...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">payments</span>
                Complete Order (₦{cartTotal.toFixed(2)})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
