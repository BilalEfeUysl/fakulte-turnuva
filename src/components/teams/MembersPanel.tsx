import type { Team, TeamMember } from "../../types/team";
import type { PlayerSummaryRow } from "../../types/tournament";
import { initialsFromName } from "../../utils/initials";

type Props = {
  selected: Team | null;
  selectedId: number | null;
  members: TeamMember[];
  memberName: string;
  memberRole: string;
  memberJerseyNo: string;
  memberSchoolNo: string;
  onMemberNameChange: (v: string) => void;
  onMemberRoleChange: (v: string) => void;
  onMemberJerseyNoChange: (v: string) => void;
  onMemberSchoolNoChange: (v: string) => void;
  onSubmitMember: (e: React.FormEvent) => void;
  onEditTeam: (t: Team) => void;
  onRequestDeleteTeam: (t: Team) => void;
  onRequestDeleteMember: (m: TeamMember) => void;
  onOpenPlayerDetail?: (teamId: number, playerName: string) => void;
  playerStats?: PlayerSummaryRow[];
  membersLoading?: boolean;
  savingMember?: boolean;
  formDisabled?: boolean;
};

export function MembersPanel({
  selected,
  selectedId,
  members,
  memberName,
  memberRole,
  memberJerseyNo,
  memberSchoolNo,
  onMemberNameChange,
  onMemberRoleChange,
  onMemberJerseyNoChange,
  onMemberSchoolNoChange,
  onSubmitMember,
  onEditTeam,
  onRequestDeleteTeam,
  onRequestDeleteMember,
  onOpenPlayerDetail,
  playerStats = [],
  membersLoading = false,
  savingMember = false,
  formDisabled = false,
}: Props) {
  const freezeForm = formDisabled || savingMember;
  const statByName = new Map(playerStats.map((p) => [p.player_name, p]));

  return (
    <section
      className={
        "panel panel--wide members-panel" + (membersLoading ? " panel--busy" : "")
      }
      aria-labelledby="members-title"
    >
      <div className="panel__head">
        <h2 className="panel__title" id="members-title">
          Kadro
        </h2>
        <span className="panel__meta">
          {!selected ? "Takım seçin" : membersLoading ? "Yükleniyor…" : `${members.length} oyuncu`}
        </span>
      </div>
      {!selected ? (
        <div className="empty-state empty-state--soft">
          <strong>Takım seçilmedi</strong>
          Orta sütundaki listeden bir takıma tıklayın. Seçiminiz burada açılır ve oyuncu ekleyebilirsiniz.
        </div>
      ) : (
        <>
          <div className="team-detail">
            <span className="team-detail__avatar" style={{ background: selected.color || "var(--arena-surface2)", color: selected.color ? "#fff" : "inherit" }} aria-hidden>
              {selected.short_name || initialsFromName(selected.name)}
            </span>
            <div className="team-detail__text">
              <p className="team-detail__name">{selected.name}</p>
              {selected.faculty_name && selected.faculty_name !== selected.name ? (
                <p className="team-detail__faculty">{selected.faculty_name}</p>
              ) : null}
            </div>
          </div>
          {(selected.manager_name || selected.manager_phone || selected.manager_email) && (
            <div className="team-manager">
              <span className="team-manager__label">Sorumlu</span>
              <div className="team-manager__info">
                {selected.manager_name && (
                  <span className="team-manager__name">{selected.manager_name}</span>
                )}
                <div className="team-manager__links">
                  {selected.manager_phone && (
                    <a href={`tel:${selected.manager_phone}`} className="team-manager__link">
                      {selected.manager_phone}
                    </a>
                  )}
                  {selected.manager_email && (
                    <a href={`mailto:${selected.manager_email}`} className="team-manager__link">
                      {selected.manager_email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="row-actions members-toolbar">
            <button type="button" className="ghost" onClick={() => onEditTeam(selected)} disabled={freezeForm}>
              Takımı düzenle
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => onRequestDeleteTeam(selected)}
              disabled={freezeForm}
            >
              Takımı sil
            </button>
          </div>
          <form className="form-grid form-grid--inline-2" onSubmit={onSubmitMember}>
            <label>
              Oyuncu adı soyadı
              <input
                value={memberName}
                onChange={(e) => onMemberNameChange(e.target.value)}
                placeholder="Ad Soyad"
                autoComplete="off"
                disabled={freezeForm}
              />
            </label>
            <label>
              Rol / not (isteğe bağlı)
              <input
                value={memberRole}
                onChange={(e) => onMemberRoleChange(e.target.value)}
                placeholder="Kaptan, kaleci…"
                autoComplete="off"
                disabled={freezeForm}
              />
            </label>
            <label>
              Forma no
              <input
                type="number"
                min={1}
                max={99}
                value={memberJerseyNo}
                onChange={(e) => onMemberJerseyNoChange(e.target.value)}
                placeholder="10"
                disabled={freezeForm}
              />
            </label>
            <label>
              Okul no
              <input
                value={memberSchoolNo}
                onChange={(e) => onMemberSchoolNoChange(e.target.value)}
                placeholder="202312345"
                disabled={freezeForm}
              />
            </label>
            <div className="row-actions row-actions--form-foot">
              <button type="submit" className="primary" disabled={!selectedId || freezeForm}>
                {savingMember ? (
                  <span className="btn-with-spinner">
                    <span className="spinner spinner--sm spinner--on-dark" aria-hidden />
                    Ekleniyor
                  </span>
                ) : (
                  "Oyuncu ekle"
                )}
              </button>
            </div>
          </form>
          <div className="members">
            <p className="members__label">Oyuncu listesi</p>
            {membersLoading ? (
              <ul className="members members--skeleton" aria-hidden>
                {["x", "y"].map((k) => (
                  <li key={k}>
                    <span className="skeleton skeleton--member" />
                  </li>
                ))}
              </ul>
            ) : members.length === 0 ? (
              <p className="empty">Bu takımda henüz oyuncu yok. Yukarıdaki formdan ekleyin.</p>
            ) : (
              <ul>
                {members.map((m) => (
                  <li key={m.id}>
                    <span className="member-main">
                      <span className="member-avatar" aria-hidden>
                        {initialsFromName(m.full_name)}
                      </span>
                      <button
                        type="button"
                        className="member-text member-text-btn"
                        onClick={() => onOpenPlayerDetail?.(selected.id, m.full_name)}
                      >
                        <span className="member-name">{m.full_name}</span>
                        {m.role_hint ? <span className="role">{m.role_hint}</span> : null}
                        <span className="role">
                          {m.jersey_no ? `#${m.jersey_no}` : "Forma yok"}
                          {m.school_no ? ` · ${m.school_no}` : ""}
                        </span>
                        {statByName.get(m.full_name) ? (
                          <span className="role">
                            G:{statByName.get(m.full_name)?.goals ?? 0} · S:
                            {statByName.get(m.full_name)?.yellow_cards ?? 0} · K:
                            {statByName.get(m.full_name)?.red_cards ?? 0}
                          </span>
                        ) : null}
                      </button>
                    </span>
                    <button
                      type="button"
                      className="danger ghost btn-icon-pad"
                      onClick={() => onRequestDeleteMember(m)}
                      disabled={freezeForm}
                    >
                      Çıkar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
