type Props = {
  editTeamId: number | null;
  formName: string;
  formNotes: string;
  formColor: string;
  formShortName: string;
  onNameChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onColorChange: (v: string) => void;
  onShortNameChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
  disabled?: boolean;
  saving?: boolean;
};

export function TeamFormPanel({
  editTeamId,
  formName,
  formNotes,
  formColor,
  formShortName,
  onNameChange,
  onNotesChange,
  onColorChange,
  onShortNameChange,
  onSubmit,
  onCancelEdit,
  disabled = false,
  saving = false,
}: Props) {
  const editing = editTeamId != null;
  const freeze = disabled || saving;
  return (
    <section
      className={"panel panel--accent-strip" + (saving ? " panel--busy" : "")}
      aria-labelledby="team-form-title"
    >
      <div className="panel__head">
        <h2 className="panel__title" id="team-form-title">
          {editing ? "Takımı düzenle" : "Yeni takım"}
        </h2>
        <span className="panel__meta">
          {saving ? "Kaydediliyor…" : editing ? `Kayıt #${editTeamId}` : "Kayıt formu"}
        </span>
      </div>
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          Takım adı
          <input
            value={formName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Örn. Mühendislik Fakültesi"
            autoComplete="off"
            disabled={freeze}
          />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <label>
            Kısaltma
            <input
              value={formShortName}
              onChange={(e) => onShortNameChange(e.target.value)}
              placeholder="Örn. MÜH"
              autoComplete="off"
              maxLength={5}
              disabled={freeze}
            />
          </label>
          <label>
            Takım Rengi
            <input
              type="color"
              value={formColor}
              onChange={(e) => onColorChange(e.target.value)}
              disabled={freeze}
              style={{ padding: "0 0.5rem", height: "42px" }}
            />
          </label>
        </div>
        <label>
          Notlar (isteğe bağlı)
          <textarea
            value={formNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Kısa açıklama, iletişim, saha bilgisi…"
            disabled={freeze}
          />
        </label>
        <div className="row-actions">
          <button type="submit" className="primary" disabled={freeze}>
            {saving ? (
              <span className="btn-with-spinner">
                <span className="spinner spinner--sm spinner--on-dark" aria-hidden />
                Kaydediliyor
              </span>
            ) : editing ? (
              "Değişiklikleri kaydet"
            ) : (
              "Takım oluştur"
            )}
          </button>
          {editing ? (
            <button type="button" className="ghost" onClick={onCancelEdit} disabled={freeze}>
              Vazgeç
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
