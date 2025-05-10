import React, { useState } from "react";
import Accordion from "react-bootstrap/Accordion";
import { sendPortBlockingRules } from "../api";

const PortBlocking = () => {
  const [rules, setRules] = useState([]);
  const [formData, setFormData] = useState({
    protocol: "TCP",
    portRange: "",
  });

  const [portError, setPortError] = useState("");
  const [requiredError, setRequiredError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "portRange") {
      const portRangeRegex = /^([0-9]{1,5})(-([0-9]{1,5}))?$/;
      if (!portRangeRegex.test(value) || value.split("-").some((p) => parseInt(p) > 65535)) {
        setPortError("Port numarası 0-65535 arasında olmalıdır. Örnek: 80-100 veya 443");
      } else {
        setPortError("");
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleAddRule = () => {
    if (!formData.portRange) {
      setRequiredError("Lütfen port aralığını girin.");
      return;
    }

    if (portError) {
      alert("Lütfen formdaki hataları düzeltin.");
      return;
    }

    setRequiredError("");
    setRules([...rules, formData]);
    setFormData({
      protocol: "TCP",
      portRange: "",
    });
  };

  const handleDeleteRule = (index) => {
    const updatedRules = rules.filter((_, i) => i !== index);
    setRules(updatedRules);
  };

  const handleSubmitToOpenWRT = async () => {
    try {
      await sendPortBlockingRules(rules);
      alert("Port engelleme kuralları başarıyla gönderildi!");
    } catch (error) {
      alert("Kurallar gönderilirken bir hata oluştu: " + error.message);
    }
  };

  return (
    <div className="container mt-4">
      <Accordion defaultActiveKey={null} className="mb-4">
        <Accordion.Item eventKey="0">
          <Accordion.Header>
            <span style={{ color: "#D84040", fontWeight: "bold" }}>
              Port Engelleme Kullanımı
            </span>
          </Accordion.Header>
          <Accordion.Body>
            <ul>
              <li>
                <strong>Protokoller:</strong> Belirli bir protokol üzerinden gelen veya giden trafiği engelleyebilirsiniz.
                <ul>
                  <li><strong>TCP:</strong> Web tarayıcıları, e-posta gibi güvenilir bağlantılar için kullanılır.</li>
                  <li><strong>UDP:</strong> Canlı yayınlar ve oyunlar gibi hızlı bağlantılar için kullanılır.</li>
                </ul>
              </li>
              <li>
                <strong>Port Aralığı:</strong> Engellenecek trafiğin port numarasını veya aralığını belirtin. <em>(Örnek: 80-100 veya 443)</em>
              </li>
            </ul>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>

      <h2 style={{ color: "#D84040" }}>Port Engelleme</h2>
      <p>
        Port Engelleme, belirli bir port üzerinden gelen veya giden ağ trafiğini durdurma işlemidir.
      </p>
      <p>
        <strong>Neden Kullanılır? </strong> güvenliği sağlamak, yetkisiz erişimleri engellemek ve gereksiz trafiği durdurarak ağ performansını artırmak için kullanılır.
      </p>

      <div className="card p-4 mb-4 shadow-sm">
        <h5 style={{ color: "#D84040" }}>Kural Ekle</h5>
        <div className="row g-3">
          <div className="col-md-4">
            <label>Protokol</label>
            <select
              className="form-select"
              name="protocol"
              value={formData.protocol}
              onChange={handleInputChange}
            >
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
            </select>
          </div>
          <div className="col-md-4">
            <label>Port Aralığı</label>
            <input
              type="text"
              className="form-control"
              name="portRange"
              value={formData.portRange}
              onChange={handleInputChange}
              placeholder="Ör: 80-100 veya 443"
            />
            {portError && <small className="text-danger">{portError}</small>}
          </div>
        </div>
        {requiredError && <small className="text-danger mt-2">{requiredError}</small>}
        <button
          className="btn mt-3"
          style={{ backgroundColor: "#D84040", color: "white" }}
          onClick={handleAddRule}
        >
          Engelle
        </button>
      </div>

      <div className="card p-4 shadow-sm">
        <h5 style={{ color: "#D84040" }}>Eklenen Kurallar</h5>
        {rules.length > 0 ? (
          <ul className="list-group">
            {rules.map((rule, index) => (
              <li
                key={index}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <span>
                  {rule.protocol} Port: {rule.portRange} - Engelle
                </span>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteRule(index)}
                >
                  Sil
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Henüz bir kural eklenmedi.</p>
        )}
      </div>

      <div className="d-flex justify-content-end mt-4">
        <button
          className="btn"
          style={{ backgroundColor: "#D84040", color: "white" }}
          onClick={handleSubmitToOpenWRT}
        >
          Firewall'a Gönder
        </button>
      </div>
    </div>
  );
};

export default PortBlocking;
