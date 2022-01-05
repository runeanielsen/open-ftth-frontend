import { useTranslation } from "react-i18next";

function BlowingReport() {
  const { t } = useTranslation();

  return (
    <div className="blowing-report">
      <div className="blowing-report-container">
        <p className="blowing-report_title">{t("CABLE")}: 12345678</p>
        <p className="blowing-report_title">{t("TOTAL_LENGTH")}: 335 meter</p>
        <div className="blowing-report-row-header">
          <div className="blowing-report-row">
            <p>{t("FROM")}</p>
            <p>{t("TO")}</p>
            <p>{t("OUTER_CONDUIT")}</p>
            <p>{t("INNER_CONDUIT")}</p>
            <p>{t("DISTANCE")}</p>
          </div>
        </div>
        <div className="blowing-report-row-body">
          <div className="blowing-report-row">
            <p>GALARH</p>
            <p>FP 1200</p>
            <p>OE50 7x12 Roed Tape</p>
            <p>Subreor 1 - Blaa</p>
            <p>0</p>
          </div>
          <div className="blowing-report-row">
            <p>GALARH</p>
            <p>FP 1200</p>
            <p>OE50 7x12 Roed Tape</p>
            <p>Subreor 1 - Blaa</p>
            <p>0</p>
          </div>
          <div className="blowing-report-row">
            <p>GALARH</p>
            <p>FP 1200</p>
            <p>OE50 7x12 Roed Tape</p>
            <p>Subreor 1 - Blaa</p>
            <p>0</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlowingReport;
