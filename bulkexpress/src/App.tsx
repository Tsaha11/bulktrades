import { useEffect, useMemo, useState } from "react";
import "./App.css";

type DealType = "BULK" | "BLOCK" | "SHORT_SELLING";

interface Deal {
  deal_type: DealType;
  date: string;
  symbol: string;
  company: string;
  client: string;
  side: string;
  quantity: number;
  price: number;
  value_crores: number;
  remarks: string;
}

interface ApiResponse {
  success: boolean;
  from_date: string;
  to_date: string;
  total_count: number;
  bulk_deals_count: number;
  block_deals_count: number;
  short_selling_count: number;
  data: Deal[];
}

type Filter = "BULK" | "BLOCK" | "SHORT_SELLING";

function App() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeFilter, setActiveFilter] = useState<Filter>("BULK");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/v1/weekly-deals`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch weekly deals");
        }

        const result: ApiResponse = await response.json();

        setDeals(result.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load market data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      if (deal.deal_type !== activeFilter) {
        return false;
      }

      if (activeFilter === "SHORT_SELLING" && !deal.symbol) {
        return false;
      }

      const searchValue = search.toLowerCase().trim();

      if (!searchValue) {
        return true;
      }

      return (
        deal.symbol.toLowerCase().includes(searchValue) ||
        deal.company.toLowerCase().includes(searchValue)
      );
    });
  }, [deals, activeFilter, search]);

  const groupedCompanies = useMemo(() => {
    const groups: Record<string, Deal[]> = {};

    filteredDeals.forEach((deal) => {
      const key = deal.symbol || deal.company;

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(deal);
    });

    return groups;
  }, [filteredDeals]);

  const getCount = (type: Filter) => {
    return deals.filter(
      (deal) =>
        deal.deal_type === type &&
        (type !== "SHORT_SELLING" || deal.symbol)
    ).length;
  };

  /*
   * Calculate company's total BUY value
   */
  const getCompanyBuyValue = (companyDeals: Deal[]) => {
    return companyDeals
      .filter((deal) => deal.side?.toUpperCase() === "BUY")
      .reduce((total, deal) => total + (deal.value_crores || 0), 0);
  };

  /*
   * Calculate company's total SELL value
   */
  const getCompanySellValue = (companyDeals: Deal[]) => {
    return companyDeals
      .filter((deal) => deal.side?.toUpperCase() === "SELL")
      .reduce((total, deal) => total + (deal.value_crores || 0), 0);
  };

  /*
   * Net = Total BUY - Total SELL
   *
   * Positive  -> Net Bought
   * Negative  -> Net Sold
   */
  const getCompanyNetValue = (companyDeals: Deal[]) => {
    const buyValue = getCompanyBuyValue(companyDeals);
    const sellValue = getCompanySellValue(companyDeals);

    return buyValue - sellValue;
  };

  const formatCrores = (value: number) => {
    return `₹${Math.abs(value).toFixed(2)} Cr`;
  };

  return (
    <div className="app">
      {/* ================= NAVBAR ================= */}

      <header className="navbar">
        <div className="brand">BulkExpress</div>

        <nav className="nav-links">
          <a href="#home">Home</a>

          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
      </header>

      <main id="home">
        {/* ================= HERO ================= */}

        <section className="hero">
          <div className="hero-content">
            <div className="badge">Indian Stock Market</div>

            <h1>
              Find any stock.
              <br />
              <span>Explore every bulk deal.</span>
            </h1>

            <p>
              Search for a stock to discover its bulk deals,
              block deals, investors, quantities, and transaction
              prices.
            </p>

            <div className="search-box">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stock name or symbol..."
              />

              <button
                onClick={() => {
                  document
                    .getElementById("deals")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Search
              </button>
            </div>

            <div className="search-hint">
              Try searching for{" "}
              <strong>RELIANCE</strong>,{" "}
              <strong>TCS</strong>, or{" "}
              <strong>INFY</strong>
            </div>
          </div>
        </section>

        {/* ================= DEALS ================= */}

        <section id="deals" className="deals-section">
          <div className="deals-header">
            <div>
              <div className="section-label">
                MARKET ACTIVITY
              </div>

              <h2>Weekly Deals</h2>

              <p>
                Institutional and large investor activity from
                the latest trading week.
              </p>
            </div>
          </div>

          {/* ================= FILTERS ================= */}

          <div className="deal-filters">
            <button
              className={
                activeFilter === "BULK"
                  ? "filter active"
                  : "filter"
              }
              onClick={() => setActiveFilter("BULK")}
            >
              Bulk Deals
              <span>{getCount("BULK")}</span>
            </button>

            <button
              className={
                activeFilter === "BLOCK"
                  ? "filter active"
                  : "filter"
              }
              onClick={() => setActiveFilter("BLOCK")}
            >
              Block Deals
              <span>{getCount("BLOCK")}</span>
            </button>

            <button
              className={
                activeFilter === "SHORT_SELLING"
                  ? "filter active"
                  : "filter"
              }
              onClick={() => setActiveFilter("SHORT_SELLING")}
            >
              Short Selling
              <span>{getCount("SHORT_SELLING")}</span>
            </button>
          </div>

          {/* ================= LOADING ================= */}

          {loading && (
            <div className="state-message">
              <div className="spinner"></div>
              Loading market activity...
            </div>
          )}

          {/* ================= ERROR ================= */}

          {!loading && error && (
            <div className="state-message error">
              {error}
            </div>
          )}

          {/* ================= NO RESULTS ================= */}

          {!loading &&
            !error &&
            Object.keys(groupedCompanies).length === 0 && (
              <div className="state-message">
                No deals found.
              </div>
            )}

          {/* ================= COMPANY CARDS ================= */}

          {!loading && !error && (
            <div className="company-grid">
              {Object.entries(groupedCompanies).map(
                ([symbol, companyDeals]) => {
                  const firstDeal = companyDeals[0];

                  const buyValue =
                    getCompanyBuyValue(companyDeals);

                  const sellValue =
                    getCompanySellValue(companyDeals);

                  const netValue =
                    getCompanyNetValue(companyDeals);

                  const isNetBought = netValue > 0;
                  const isNetSold = netValue < 0;
                  const isNetNeutral = netValue === 0;

                  return (
                    <div
                      className="company-card"
                      key={symbol}
                    >
                      {/* ================= COMPANY HEADER ================= */}

                      <div className="company-header">
                        <div>
                          <div className="company-symbol">
                            {firstDeal.symbol}
                          </div>

                          <h3>{firstDeal.company}</h3>
                        </div>

                        <div
                          className={`deal-type ${activeFilter.toLowerCase()}`}
                        >
                          {activeFilter === "BULK"
                            ? "BULK"
                            : activeFilter === "BLOCK"
                            ? "BLOCK"
                            : "SHORT SELLING"}
                        </div>
                      </div>

                      {/* ================= COMPANY SUMMARY ================= */}

                      <div className="company-summary">
                        {/* Total Deals */}

                        <div className="summary-item">
                          <span>Total Deals</span>
                          <strong>
                            {companyDeals.length}
                          </strong>
                        </div>

                        {/* Total Bought */}

                        <div className="summary-item">
                          <span>Total Bought</span>

                          <strong className="summary-buy">
                            {formatCrores(buyValue)}
                          </strong>
                        </div>

                        {/* Total Sold */}

                        <div className="summary-item">
                          <span>Total Sold</span>

                          <strong className="summary-sell">
                            {formatCrores(sellValue)}
                          </strong>
                        </div>

                        {/* NET */}

                        <div
                          className={`summary-item net ${
                            isNetBought
                              ? "net-bought"
                              : isNetSold
                              ? "net-sold"
                              : "net-neutral"
                          }`}
                        >
                          <span>Net Position</span>

                          <strong>
                            {isNetBought && "+"}
                            {isNetSold && "-"}
                            {formatCrores(netValue)}
                          </strong>

                          <small>
                            {isNetBought
                              ? "NET BOUGHT"
                              : isNetSold
                              ? "NET SOLD"
                              : "NEUTRAL"}
                          </small>
                        </div>
                      </div>

                      {/* ================= DEAL LIST ================= */}

                      <div className="deal-list">
                        {companyDeals.map((deal, index) => {
                          const isBuy =
                            deal.side?.toUpperCase() === "BUY";

                          const isSell =
                            deal.side?.toUpperCase() === "SELL";

                          return (
                            <div
                              className="deal-row"
                              key={`${deal.client}-${deal.date}-${index}`}
                            >
                              <div className="deal-client">
                                <span>Client</span>
                                <strong>
                                  {deal.client}
                                </strong>
                              </div>

                              <div>
                                <span>Date</span>
                                <strong>
                                  {deal.date}
                                </strong>
                              </div>

                              <div>
                                <span>Side</span>

                                <strong
                                  className={
                                    isBuy
                                      ? "buy"
                                      : isSell
                                      ? "sell"
                                      : ""
                                  }
                                >
                                  {deal.side || "-"}
                                </strong>
                              </div>

                              <div>
                                <span>Quantity</span>

                                <strong>
                                  {deal.quantity.toLocaleString(
                                    "en-IN"
                                  )}
                                </strong>
                              </div>

                              <div>
                                <span>Price</span>

                                <strong>
                                  ₹
                                  {deal.price.toLocaleString(
                                    "en-IN"
                                  )}
                                </strong>
                              </div>

                              <div>
                                <span>Value</span>

                                <strong>
                                  ₹
                                  {deal.value_crores.toLocaleString(
                                    "en-IN",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}{" "}
                                  Cr
                                </strong>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* ================= FEATURES ================= */}

        <section className="features">
          <div>
            <h3>Bulk Deals</h3>

            <p>
              Track significant trades and large institutional
              transactions.
            </p>
          </div>

          <div>
            <h3>Block Deals</h3>

            <p>
              Monitor large negotiated transactions between major
              market participants.
            </p>
          </div>

          <div>
            <h3>Net Position</h3>

            <p>
              Quickly see whether investors are net buying or
              selling each company.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
