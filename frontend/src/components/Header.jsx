import React, { useEffect, useState } from "react";
import { fetchHospitals } from "../services/clinical.js";
import { getHospitalId, setHospitalId } from "../services/auth.js";

export default function Header() {
  const [hospitals, setHospitals] = useState([]);
  const [selected, setSelected] = useState(getHospitalId() || "");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchHospitals()
      .then((response) => {
        if (!active) {
          return;
        }
        setHospitals(response);
        if (response.length > 0) {
          const stored = getHospitalId();
          const hasStored = stored && response.some((h) => h.hospital_id === stored);
          const nextId = hasStored ? stored : response[0].hospital_id;
          setSelected(nextId);
          setHospitalId(nextId);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "No se pudieron cargar los hospitales");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleHospitalChange = (event) => {
    const nextId = event.target.value;
    setSelected(nextId);
    setHospitalId(nextId);
    window.location.reload();
  };

  return (
    <header className="header">
      <div className="header-title">Resumen clínico en vivo</div>
      <div className="header-filters">
        {error ? (
          <div className="filter-pill">Hospital no disponible</div>
        ) : hospitals.length > 1 ? (
          <label className="filter-select">
            <span>Hospital</span>
            <select value={selected} onChange={handleHospitalChange}>
              {hospitals.map((hospital) => (
                <option key={hospital.hospital_id} value={hospital.hospital_id}>
                  {hospital.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="filter-pill">
            Hospital: {hospitals[0] ? hospitals[0].name : "Cargando..."}
          </div>
        )}
        <div className="filter-pill">Últimas 24 h</div>
      </div>
    </header>
  );
}
