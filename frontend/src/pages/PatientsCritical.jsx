import React, { useEffect, useState } from "react";
import PaginationControls from "../components/PaginationControls.jsx";
import PatientsTable from "../components/PatientsTable.jsx";
import { fetchCriticalPatients } from "../services/clinical.js";

const PAGE_SIZE_KEY = "cah_page_size_critical";

export default function PatientsCritical() {
  const [patients, setPatients] = useState({ items: [], page: { total: 0, limit: 20, offset: 0 } });
  const [error, setError] = useState("");
  const [limit, setLimit] = useState(() => {
    const stored = Number(localStorage.getItem(PAGE_SIZE_KEY));
    return Number.isNaN(stored) || stored <= 0 ? 20 : stored;
  });
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let active = true;
    fetchCriticalPatients({ limit, offset })
      .then((response) => {
        if (active) {
          setPatients(response);
          if (response.page.total > 0 && offset >= response.page.total) {
            const lastOffset = Math.max(0, response.page.total - response.page.limit);
            if (lastOffset !== offset) {
              setOffset(lastOffset);
            }
          }
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "No se pudieron cargar los pacientes");
        }
      });

    return () => {
      active = false;
    };
  }, [limit, offset]);

  if (error) {
    return <div className="panel">{error}</div>;
  }

  return (
    <div className="panel">
      <div className="panel-title">Pacientes críticos</div>
      <PatientsTable patients={patients.items} />
      <PaginationControls
        total={patients.page.total}
        limit={patients.page.limit}
        offset={patients.page.offset}
        onPageChange={setOffset}
        onLimitChange={(value) => {
          localStorage.setItem(PAGE_SIZE_KEY, String(value));
          setLimit(value);
          setOffset(0);
        }}
      />
    </div>
  );
}
