import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPatient } from "../services/clinical.js";

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchPatient(id)
      .then((response) => {
        if (active) {
          setPatient(response);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "No se pudo cargar el paciente");
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (error) {
    return <div className="panel">{error}</div>;
  }

  if (!patient) {
    return <div className="panel">Cargando paciente...</div>;
  }

  return (
    <div className="panel">
      <div className="panel-title">Detalle del paciente</div>
      <div className="detail-grid">
        <div>
          <div className="detail-label">Referencia externa</div>
          <div className="detail-value">{patient.external_ref}</div>
        </div>
        <div>
          <div className="detail-label">Estado</div>
          <div className={`detail-value status-pill ${patient.current_status}`}>
            {String(patient.current_status || "")
              .replace(/^critical$/i, "Crítico")
              .replace(/^warning$/i, "Advertencia")
              .replace(/^normal$/i, "Normal")}
          </div>
        </div>
        <div>
          <div className="detail-label">Hospital</div>
          <div className="detail-value">{patient.hospital_id}</div>
        </div>
        <div>
          <div className="detail-label">Creado</div>
          <div className="detail-value">{new Date(patient.created_at).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
