import { useEffect, useState } from "react";
import type { Gender } from "@hearth/shared";
import { useMe, useUpdateProfile } from "@hearth/client";
import { Chips } from "../components/Chips";

const GENDERS: Gender[] = ["woman", "man", "nonbinary", "other"];

export function ProfilePage() {
  const me = useMe();
  const update = useUpdateProfile();
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [seeking, setSeeking] = useState<Gender[]>([]);
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);

  // Hydrate the form once the profile loads.
  useEffect(() => {
    const p = me.data?.profile;
    if (!p) return;
    setDisplayName(p.displayName);
    setAge(p.age ? String(p.age) : "");
    setGender(p.gender ?? "");
    setSeeking(p.seekingGenders);
    setCity(p.city ?? "");
    setBio(p.bio);
  }, [me.data]);

  if (me.isLoading) return <div className="center-state">Loading…</div>;
  const profile = me.data?.profile;
  if (!profile) return <div className="center-state">No profile.</div>;

  function toggleSeeking(g: Gender) {
    setSeeking((s) => (s.includes(g) ? s.filter((x) => x !== g) : [...s, g]));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    await update.mutateAsync({
      displayName,
      age: age ? Number(age) : undefined,
      gender: gender || undefined,
      seekingGenders: seeking,
      city,
      bio,
    });
    setSaved(true);
  }

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <h1 className="title">Your profile</h1>
      <p className="subtitle">This is what your matchmaker uses to find your people.</p>

      <div className="profile-photos">
        {profile.photoUrls.map((url) => (
          <img key={url} src={url} alt="" />
        ))}
      </div>

      {profile.interests.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 12 }}>
            Your interests (from your interview)
          </div>
          <Chips items={profile.interests} />
        </>
      )}

      <form onSubmit={save} style={{ marginTop: 22 }}>
        <div className="field">
          <label>Display name</label>
          <input
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>

        <div className="row-2">
          <div className="field">
            <label>Age</label>
            <input
              className="input"
              type="number"
              min={18}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div className="field">
            <label>City</label>
            <input
              className="input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>I am a…</label>
          <div className="seek-toggles">
            {GENDERS.map((g) => (
              <button
                type="button"
                key={g}
                className={`toggle ${gender === g ? "on" : ""}`}
                onClick={() => setGender(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Looking to meet</label>
          <div className="seek-toggles">
            {GENDERS.map((g) => (
              <button
                type="button"
                key={g}
                className={`toggle ${seeking.includes(g) ? "on" : ""}`}
                onClick={() => toggleSeeking(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Bio</label>
          <textarea
            className="textarea"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={1000}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button className="btn btn-primary" disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save changes"}
          </button>
          {saved && <span className="saved-note">✓ Saved</span>}
        </div>
      </form>
    </div>
  );
}
