import React from "react";
import { Link } from "react-router-dom";

export default function PatientsTable({ patients }) {
  const statusLabel = (status) => {
    const value = String(status || "").toLowerCase();
    if (value === "critical") return "Crítico";
    if (value === "warning") return "Advertencia";
    if (value === "normal") return "Normal";
    return status;
  };

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Referencia externa</th>
            <th>Estado</th>
            <th>Creado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient.patient_id}>
              <td>{patient.external_ref}</td>
              <td>
                <span className={`status-pill ${patient.current_status}`}>
                  {statusLabel(patient.current_status)}
                </span>
              </td>
              <td>{new Date(patient.created_at).toLocaleString()}</td>
              <td>
                <Link className="link" to={`/patients/${patient.patient_id}`}>
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
