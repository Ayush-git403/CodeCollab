import { Link } from "react-router-dom";

// TODO: replace this with your real contact email before deploying
const CONTACT_EMAIL = "your-email@example.com";
const UPDATED = "October 15, 2026";

export default function Privacy() {
  return (
    <div style={S.page}>
      <div style={S.card}>
        <Link to="/login" style={S.back}>← Back to CodeCollab Arena</Link>

        <h1 style={S.h1}>Privacy Policy</h1>
        <p style={S.muted}>Last updated: {UPDATED}</p>

        <p style={S.p}>
          CodeCollab Arena ("we", "the app") is a collaborative coding platform where
          people write code together in shared rooms. This policy explains what
          information we collect and how we use it.
        </p>

        <h2 style={S.h2}>Information we collect</h2>
        <ul style={S.ul}>
          <li>
            <strong>Account details:</strong> your username, email address and an
            encrypted (hashed) password if you sign up with email.
          </li>
          <li>
            <strong>Google or GitHub sign-in:</strong> if you choose to sign in with
            Google, we receive your Google account ID, name and email address. If you
            sign in with GitHub, we receive your GitHub ID, username and your primary
            verified email address. We do not receive your Google or GitHub password.
          </li>
          <li>
            <strong>Content you create:</strong> files, code, rooms and chat messages
            you create or send inside the app.
          </li>
        </ul>

        <h2 style={S.h2}>How we use your information</h2>
        <ul style={S.ul}>
          <li>To create your account and sign you in.</li>
          <li>To show your name and avatar to other people in your rooms.</li>
          <li>To store and sync your files and messages so you can collaborate.</li>
        </ul>
        <p style={S.p}>
          We use Google user data only to provide sign-in and create your account. We
          do not use it for advertising, and we do not sell it or share it with third
          parties.
        </p>

        <h2 style={S.h2}>Where your data is stored</h2>
        <p style={S.p}>
          Your data is stored in a managed PostgreSQL database (Supabase). The app is
          hosted on Vercel (frontend) and Render (backend). These providers process
          data on our behalf to run the service. Your sign-in token is stored in your
          browser so you stay logged in.
        </p>

        <h2 style={S.h2}>Sharing</h2>
        <p style={S.p}>
          Other members of a room can see your username, avatar color, messages and
          the files in that room. We do not share your personal information with
          anyone else, except where required by law.
        </p>

        <h2 style={S.h2}>Your choices</h2>
        <p style={S.p}>
          You can ask us to delete your account and the data linked to it at any time
          by emailing <a href={`mailto:${CONTACT_EMAIL}`} style={S.a}>{CONTACT_EMAIL}</a>.
          You can also remove CodeCollab Arena's access from your Google account
          settings or your GitHub settings.
        </p>

        <h2 style={S.h2}>Changes to this policy</h2>
        <p style={S.p}>
          We may update this policy from time to time. The date at the top shows when
          it was last changed.
        </p>

        <h2 style={S.h2}>Contact</h2>
        <p style={S.p}>
          Questions? Email <a href={`mailto:${CONTACT_EMAIL}`} style={S.a}>{CONTACT_EMAIL}</a>.
        </p>
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    background: "#000",
    display: "flex",
    justifyContent: "center",
    padding: "32px 20px",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "720px",
    background: "#191919",
    border: "1px solid #2D2D2D",
    borderRadius: "14px",
    padding: "36px",
    boxSizing: "border-box",
    textAlign: "left",
    color: "#C9D1D9",
    fontFamily: "-apple-system,'Segoe UI',sans-serif",
    lineHeight: 1.65,
    height: "fit-content",
  },
  back: { color: "#8B949E", fontSize: "13px", textDecoration: "none" },
  h1: { color: "#FFFFFF", fontSize: "28px", margin: "18px 0 4px" },
  h2: { color: "#FFFFFF", fontSize: "17px", margin: "26px 0 8px" },
  muted: { color: "#8B949E", fontSize: "13px", margin: "0 0 18px" },
  p: { fontSize: "14px", margin: "0 0 10px" },
  ul: { fontSize: "14px", paddingLeft: "20px", margin: "0 0 10px" },
  a: { color: "#58A6FF" },
};