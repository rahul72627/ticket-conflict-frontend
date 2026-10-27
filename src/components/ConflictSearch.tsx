import { useState, useEffect, FormEvent } from "react";

export interface StationCode {
  id: number;
  code: string;
  utility_type: string;
}

export interface ServiceArea {
  name: string;
  station_code_id: number;
  srid: number;
  geom: string;
  coordinates: [number, number][];
}

export interface Ticket {
  ticket_no: string;
  status: string;
  priority: string;
  station_code_id: number;
  due_at: string;
  longitude: number;
  latitude: number;
  geom: string;
  srid: number;
}

export interface PublicResponseData {
  station_codes: StationCode[];
  service_areas: ServiceArea[];
  tickets: Ticket[];
}

export interface ConflictSearchSuccessResponse {
  message: string;
  bbox: string;
  stationCode: string | null;
  utilityType: string | null;
  radiusMeters: number;
  data: PublicResponseData;
}

export default function ConflictSearch() {
  const [bbox, setBbox] = useState<string>("-80.00,43.20,-79.70,43.40");
  const [utilityType, setUtilityType] = useState<string>("WATER");
  const [stationCode, setStationCode] = useState<string>("");
  const [radiusMeters, setRadiusMeters] = useState<string>("250");

  const [response, setResponse] = useState<ConflictSearchSuccessResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConflicts = async (params: {
    bbox: string;
    utilityType: string;
    stationCode: string;
    radiusMeters: string;
  }) => {
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (params.bbox) queryParams.set("bbox", params.bbox);
    if (params.utilityType) queryParams.set("utilityType", params.utilityType);
    if (params.stationCode) queryParams.set("stationCode", params.stationCode);
    if (params.radiusMeters) queryParams.set("radiusMeters", params.radiusMeters);

    try {
      const res = await fetch(`/api/tickets/conflicts?${queryParams.toString()}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const json: ConflictSearchSuccessResponse = await res.json();
      setResponse(json);
    } catch (err: any) {
      console.error("Fetch failed:", err);
      setError(err.message || "Failed to load conflicts");
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConflicts({ bbox, utilityType, stationCode, radiusMeters });
  }, []);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchConflicts({ bbox, utilityType, stationCode, radiusMeters });
  };

  return (
    <div style={{ padding: "1.5rem", fontFamily: "sans-serif", maxWidth: "1000px", margin: "0 auto" }}>
      <h2>Conflict Search</h2>
      <form
        onSubmit={handleSearch}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
          padding: "16px",
          background: "#f7f7f7",
          borderRadius: "8px",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
            Bounding Box (minLng,minLat,maxLng,maxLat):
          </label>
          <input
            type="text"
            value={bbox}
            onChange={(e) => setBbox(e.target.value)}
            style={{ width: "100%", padding: "6px" }}
            placeholder="-80.00,43.20,-79.70,43.40"
            required
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
            Utility Type:
          </label>
          <select
            value={utilityType}
            onChange={(e) => setUtilityType(e.target.value)}
            style={{ width: "100%", padding: "6px" }}
          >
            <option value="">All Utilities</option>
            <option value="WATER">WATER</option>
            <option value="GAS">GAS</option>
            <option value="SANITARY">SANITARY</option>
            <option value="TELECOM">TELECOM</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
            Station Code:
          </label>
          <input
            type="text"
            value={stationCode}
            onChange={(e) => setStationCode(e.target.value)}
            style={{ width: "100%", padding: "6px" }}
            placeholder="e.g. HLTNW02"
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
            Radius (meters):
          </label>
          <input
            type="number"
            value={radiusMeters}
            onChange={(e) => setRadiusMeters(e.target.value)}
            style={{ width: "100%", padding: "6px" }}
            min="0"
          />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "8px 20px",
              background: "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Searching..." : "Search Conflicts"}
          </button>
        </div>
      </form>

      {loading && <p>Loading data...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {response && !loading && (
        <div>
          <h3>Tickets Found ({response.data.tickets.length})</h3>
          <table border={1} cellPadding={8} style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1.5rem" }}>
            <thead>
              <tr style={{ background: "#f0f0f0", textAlign: "left" }}>
                <th>Ticket No</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Station ID</th>
                <th>Coordinates (Lon, Lat)</th>
                <th>Due At</th>
              </tr>
            </thead>
            <tbody>
              {response.data.tickets.map((t) => (
                <tr key={t.ticket_no}>
                  <td>{t.ticket_no}</td>
                  <td>{t.status}</td>
                  <td>{t.priority}</td>
                  <td>{t.station_code_id}</td>
                  <td>{t.longitude}, {t.latitude}</td>
                  <td>{t.due_at}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Service Areas ({response.data.service_areas.length})</h3>
          <ul>
            {response.data.service_areas.map((area) => (
              <li key={area.name}>
                <strong>{area.name}</strong> (Station ID: {area.station_code_id})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}