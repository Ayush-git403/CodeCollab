import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import RoomDialog from "../components/RoomDialog";
import AnimatedBackground from "../components/core/animated-background";
// ======================================================
// LETTER-BY-LETTER ANIMATION
// =====================================================
function AnimatedText({ text, visible }) {
  return (
    <>
      {text.split("").map((char, index) => (
        <span
          key={index}
          className="animated-letter"
          style={{
            animationDelay: visible ? `${index * 0.045}s` : "0s",
            animationPlayState: visible ? "running" : "paused",
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </>
  );
}
const animationStyles = `
  /* HERO - whole phrase animation */
  .hero-pop {
    display: inline-block;
    opacity: 0;
    transform: translateY(24px) scale(0.94);
    animation: heroPop 3.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }



  .hero-pop-delay {

    animation-delay: 0.16s;

  }



  @keyframes heroPop {

    0% {

      opacity: 0;

      transform: translateY(24px) scale(0.94);

    }



    60% {

      opacity: 1;

      transform: translateY(-3px) scale(1.02);

    }



    100% {

      opacity: 1;

      transform: translateY(0) scale(1);

    }

  }





  /* FEATURE HEADING - letter by letter */



  .animated-letter {

    display: inline-block;

    opacity: 0;

    transform: translateY(16px) scale(0.92);



    animation:

      letterPop

      0.5s

      cubic-bezier(0.22, 1, 0.36, 1)

      forwards;

  }



  @keyframes letterPop {

    0% {

      opacity: 0;

      transform: translateY(16px) scale(0.92);

    }



    60% {

      opacity: 1;

      transform: translateY(-3px) scale(1.03);

    }



    100% {

      opacity: 1;

      transform: translateY(0) scale(1);

    }

  }





  @media (prefers-reduced-motion: reduce) {

    .hero-pop,

    .animated-letter {

      animation: none;

      opacity: 1;

      transform: none;

    }

  }

`;



// ======================================================

// DASHBOARD

// ======================================================



export default function Home() {

  const { user } = useAuth();

  const navigate = useNavigate();



  // ====================================================

  // CREATE ROOM DIALOG URL STATE

  // ====================================================



  const [searchParams, setSearchParams] = useSearchParams();



  const createRoomOpen = searchParams.get("createRoom") === "true";



  const handleCreateRoomDialog = (open) => {

    const params = new URLSearchParams(searchParams);



    if (open) {

      params.set("createRoom", "true");

    } else {

      params.delete("createRoom");

    }



    setSearchParams(params);

  };



  const [roomId, setRoomId] = useState("");

  const [joining, setJoining] = useState(false);

  const [error, setError] = useState("");

  const [hoveredCard, setHoveredCard] = useState(null);



  // Feature heading animation

  const [sectionVisible, setSectionVisible] = useState(false);



  const sectionRef = useRef(null);



  // ====================================================

  // ADD ANIMATION CSS

  // ====================================================



  useEffect(() => {

    const style = document.createElement("style");



    style.innerHTML = animationStyles;



    document.head.appendChild(style);



    return () => {

      document.head.removeChild(style);

    };

  }, []);



  // ====================================================

  // DETECT FEATURE SECTION IN VIEWPORT

  // ====================================================



  useEffect(() => {

    const observer = new IntersectionObserver(

      ([entry]) => {

        if (entry.isIntersecting) {

          setSectionVisible(true);

          observer.disconnect();

        }

      },

      {

        threshold: 0.46,

      },

    );



    if (sectionRef.current) {

      observer.observe(sectionRef.current);

    }



    return () => observer.disconnect();

  }, []);



  // ====================================================

  // CREATE ROOM

  // ====================================================



  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  const handleCreateRoom = () => {
    if (user) {
      navigate("/create");
    } else {
      setAuthPromptOpen(true);
    }
  };



  // ====================================================

  // JOIN ROOM

  // ====================================================



  const handleJoinRoom = async () => {

    if (!roomId.trim()) return;



    const id = roomId.toUpperCase();



    if (!user) {

      navigate(`/login?next=room/${id}`);

      return;

    }



    setJoining(true);

    setError("");



    try {

      await axios.get(`http://localhost:5000/api/room/${id}`);

      navigate(`/room/${id}`);

    } catch {

      setError("Room not found — check the ID");

    } finally {

      setJoining(false);

    }

  };



  return (

    <div style={S.page}>

      <Navbar />

      {/* Login / signup prompt for visitors who want to create a room */}
      {authPromptOpen && (
        <div
          onClick={() => setAuthPromptOpen(false)}
          style={S.authModalOverlay}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="authPromptTitle"
            onClick={(e) => e.stopPropagation()}
            style={S.authModal}
          >
            <button
              type="button"
              aria-label="Close dialog"
              onClick={() => setAuthPromptOpen(false)}
              style={S.authModalClose}
            >
              ×
            </button>

            <h2 id="authPromptTitle" style={S.authModalTitle}>
              Join CodeCollab Arena
            </h2>
            <p style={S.authModalDescription}>
              Log in or create an account to start collaborating with your team.
            </p>

            <button
              type="button"
              style={S.authModalPrimary}
              onClick={() => {
                setAuthPromptOpen(false);
                navigate("/login?next=create");
              }}
            >
              Log in
            </button>

            <button
              type="button"
              style={S.authModalSecondary}
              onClick={() => {
                setAuthPromptOpen(false);
                navigate("/login?tab=signup&next=create");
              }}
            >
              Sign up
            </button>

            <button
              type="button"
              style={S.authModalCancel}
              onClick={() => setAuthPromptOpen(false)}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* ==================================================
          HERO SECTION

          ================================================== */}



      <div style={S.hero}>

        <div style={S.heroInner}>

          <div style={S.heroBadge}>

            <span style={S.heroBadgeDot} />

            Real-time collaboration platform

          </div>



          {/* HERO TITLE */}



          <h1 style={S.heroTitle}>

            <span className="hero-pop">Code together.</span>



            <br />



            <span className="hero-pop hero-pop-delay" style={S.heroTitleAccent}>

              Ship faster.

            </span>

          </h1>



          <p style={S.heroDesc}>

            A complete coding workspace for your team. Collaborate in real time,

            run code, manage files, and preview your work — all in the browser.

          </p>



          <div style={S.heroActions}>

            {/* CREATE ROOM DIALOG */}



            <RoomDialog

              open={createRoomOpen}

              onOpenChange={handleCreateRoomDialog}

            />



            <div style={S.heroJoinRow}>

              <input

                style={S.heroInput}

                placeholder="Enter Room ID"

                value={roomId}

                onChange={(e) => setRoomId(e.target.value.toUpperCase())}

                onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}

                maxLength={6}

              />



              <button

                style={S.heroSecondaryBtn}

                onClick={handleJoinRoom}

                disabled={joining}

              >

                {joining ? "Joining..." : "Join →"}

              </button>

            </div>



            {error && <p style={S.errorText}>⚠ {error}</p>}

          </div>



          {/* QUICK STATS */}



          <div style={S.heroStats}>

            {[

              { num: "0ms", label: "Setup time" },

              { num: "10+", label: "Languages" },

              { num: "∞", label: "Collaborators" },

              {

                num: "100%",

                label: "Browser-based",

              },

            ].map((s) => (

              <div key={s.label} style={S.heroStat}>

                <p style={S.heroStatNum}>{s.num}</p>



                <p style={S.heroStatLabel}>{s.label}</p>

              </div>

            ))}

          </div>

        </div>



        {/* ==================================================

            HERO EDITOR MOCK

            ================================================== */}



        <div style={S.heroVisual}>

          <div style={S.editorMock}>

            <div style={S.editorMockBar}>

              <div

                style={{

                  ...S.editorDot,

                  background: "#FF5F57",

                }}

              />



              <div

                style={{

                  ...S.editorDot,

                  background: "#FFBD2E",

                }}

              />



              <div

                style={{

                  ...S.editorDot,

                  background: "#28C840",

                }}

              />



              <span style={S.editorMockTitle}>index.js — CodeCollab Arena</span>

            </div>



            <div style={S.editorMockBody}>

              {[

                {

                  color: "#79C0FF",

                  text: "import",

                },

                {

                  color: "#C9D1D9",

                  text: " express ",

                },

                {

                  color: "#79C0FF",

                  text: "from",

                },

                {

                  color: "#A5D6FF",

                  text: " 'express'",

                },

              ].map((t, i) => (

                <span key={i} style={{ color: t.color }}>

                  {t.text}

                </span>

              ))}



              <br />



              <span style={{ color: "#79C0FF" }}>const </span>



              <span style={{ color: "#C9D1D9" }}>app </span>



              <span style={{ color: "#FF7B72" }}>= </span>



              <span style={{ color: "#D2A8FF" }}>express</span>



              <span style={{ color: "#C9D1D9" }}>()</span>



              <br />

              <br />



              <span style={{ color: "#79C0FF" }}>app</span>



              <span style={{ color: "#C9D1D9" }}>.</span>



              <span style={{ color: "#D2A8FF" }}>get</span>



              <span style={{ color: "#C9D1D9" }}>

                {"('/', (req, res) => {"}

              </span>



              <br />



              <span style={{ color: "#C9D1D9" }}>{"  res."}</span>



              <span style={{ color: "#D2A8FF" }}>send</span>



              <span style={{ color: "#C9D1D9" }}>(</span>



              <span style={{ color: "#A5D6FF" }}>'Hello World!'</span>



              <span style={{ color: "#C9D1D9" }}>{")"}</span>



              <br />



              <span style={{ color: "#C9D1D9" }}>{"}"}</span>



              <br />

              <br />



              <span style={{ color: "#79C0FF" }}>app</span>



              <span style={{ color: "#C9D1D9" }}>.</span>



              <span style={{ color: "#D2A8FF" }}>listen</span>



              <span style={{ color: "#C9D1D9" }}>(</span>



              <span style={{ color: "#F8C555" }}>3000</span>



              <span style={{ color: "#C9D1D9" }}>)</span>

            </div>



            {/* Fake users */}



            <div style={S.fakeUsers}>

              {["#FF6B6B", "#4ECDC4", "#58A6FF"].map((c, i) => (

                <div

                  key={i}

                  style={{

                    ...S.fakeUser,

                    background: c,

                    left: `${i * 20}px`,

                  }}

                >

                  {String.fromCharCode(65 + i)}

                </div>

              ))}



              <span style={S.fakeUsersLabel}>3 collaborating</span>

            </div>

          </div>

        </div>

      </div>



      {/* ==================================================

          FEATURE SECTION

          ================================================== */}



      <div ref={sectionRef} style={S.section}>

        <div style={S.sectionInner}>

          {/* ONLY THE HEADING IS ANIMATED */}



          <h2 style={S.sectionTitle}>

            <AnimatedText

              text="Build. Collaborate. Compete."

              visible={sectionVisible}

            />

          </h2>



          <p style={S.sectionDesc}>

            One link. Your whole team. No installs, no config, no delays.

          </p>



          <div style={S.featureGrid}>

            <AnimatedBackground

              transition={{

                type: "spring",

                bounce: 0.2,

                duration: 0.6,

              }}

              enableHover

              backgroundStyle={{

                background: "rgba(255,255,255,0.06)",

                borderRadius: "12px",

                border: "1px solid rgba(255,255,255,0.1)",

              }}

              onValueChange={(id) => {

                setHoveredCard(id ? Number(id.replace("card-", "")) : null);

              }}

            >

              {[

                {

                  icon: "🏠",

                  title: "Collaborative Rooms",

                  desc: "Real-time multi-user editing with live cursors, file tree, and instant sync.",

                  color: "#DDF4FF",

                  accent: "#0969DA",

                  action: "Create Room",

                  onClick: handleCreateRoom,

                },

                {

                  icon: "⚡",

                  title: "Contest Mode",

                  desc: "Race to match a target output. Live leaderboard. AI-generated challenges.",

                  color: "#FFF8C5",

                  accent: "#9A6700",

                  action: "Coming Soon",

                  disabled: true,

                },

                {

                  icon: "⬛",

                  title: "Browser based Terminal",

                  desc: "Full Node.js environment running in your browser. npm install, node server.js — all supported.",

                  color: "#DAFBE1",

                  accent: "#1A7F37",

                  action: "Learn More",

                },

                {

                  icon: "👁",

                  title: "Live web Preview",

                  desc: "Build and preview web projects instantly. See every HTML, CSS, and JavaScript change in real time.",

                  color: "#FFEFF7",

                  accent: "#BF3989",

                  action: "Try it",

                  onClick: handleCreateRoom,

                },

                {

                  icon: "🤖",

                  title: "AI Coding Assistant",

                  desc: "Understand, debug, and improve your code with an AI assistant built directly into your workspace.",

                  color: "#F1EFFF",

                  accent: "#6639BA",

                  action: "Coming Soon",

                  disabled: true,

                },

                {

                  icon: "💾",

                  title: "Automatic Sync & Save",

                  desc: "Your work stays safe automatically. Changes are continuously saved and synchronized across your workspace.",

                  color: "#DAFBE1",

                  accent: "#1A7F37",

                  disabled: true,

                  action: "Coming Soon",

                },

              ].map((f, i) => (

                <div

                  key={i}

                  data-id={`card-${i}`}

                  style={{

                    borderRadius: "12px",

                    opacity: sectionVisible ? 1 : 0,

                    transform: sectionVisible

                      ? "translateY(0)"

                      : "translateY(35px)",

                    transition: `

            opacity 1.4s ease ${i < 3 ? "0s" : "0.5s"},

            transform 1.4s cubic-bezier(0.22, 1, 0.36, 1) ${i < 3 ? "0s" : "0.5s"}

          `,

                  }}

                >

                  <div style={S.featureCard}>

                    <div

                      style={{

                        ...S.featureIcon,

                        background: f.color,

                      }}

                    >

                      {f.icon}

                    </div>



                    <h3

                      style={{

                        ...S.featureTitle,

                        color: hoveredCard === i ? "#FFFFFF" : "#C9D1D9",

                        transition: "color 0.2s",

                      }}

                    >

                      {f.title}

                    </h3>



                    <p

                      style={{

                        ...S.featureDesc,

                        color: hoveredCard === i ? "#8B949E" : "#57606A",

                        transition: "color 0.2s",

                      }}

                    >

                      {f.desc}

                    </p>



                    <button

                      style={{

                        ...S.featureBtn,

                        color: f.disabled

                          ? hoveredCard === i

                            ? "#8B949E"

                            : "#57606A"

                          : hoveredCard === i

                            ? "#FFFFFF"

                            : f.accent,

                        borderColor: f.disabled

                          ? hoveredCard === i

                            ? "#57606A"

                            : "#30363D"

                          : hoveredCard === i

                            ? "rgba(255,255,255,0.3)"

                            : f.accent,

                        cursor: f.disabled ? "default" : "pointer",

                        opacity: f.disabled ? 0.6 : 1,

                        transition: "all 0.2s",

                      }}

                      onClick={f.disabled ? undefined : f.onClick}

                      disabled={f.disabled}

                    >

                      {f.action} {!f.disabled && "→"}

                    </button>

                  </div>

                </div>

              ))}

            </AnimatedBackground>

          </div>

        </div>

      </div>



      {/* ==================================================

          CTA

          ================================================== */}



      <div style={S.cta}>

        <div style={S.ctaInner}>

          <h2 style={S.ctaTitle}>Ready to start coding together?</h2>



          <p style={S.ctaDesc}>

            Create a room in seconds. Share the link. Start building.

          </p>



          <button style={S.ctaBtn} onClick={handleCreateRoom}>

            Create your first room →

          </button>

        </div>

      </div>



      {/* ==================================================

          FOOTER

          ================================================== */}



      <div style={S.footer}>

        <div style={S.footerInner}>

          <div style={S.footerLogo}>

            <span

              style={{

                fontSize: "20px",

                fontWeight: "800",

                color: "#0D1117",

                letterSpacing: "-0.5px",

              }}

            >

              Code

            </span>



            <span

              style={{

                fontSize: "20px",

                fontWeight: "800",

                color: "#0969DA",

                letterSpacing: "-0.5px",

              }}

            >

              Collab

            </span>

          </div>



          <p style={S.footerText}>

            Built for hackathons, classrooms, and remote teams.

          </p>

        </div>

      </div>

    </div>

  );

}



// ======================================================

// STYLES

// ======================================================



const S = {
  authModalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(0, 0, 0, 0.72)",
    backdropFilter: "blur(5px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  authModal: {
    position: "relative",
    width: "100%",
    maxWidth: "410px",
    boxSizing: "border-box",
    padding: "32px",
    borderRadius: "16px",
    border: "1px solid #30363D",
    background: "#161B22",
    color: "#E6EDF3",
    textAlign: "center",
    boxShadow: "0 24px 80px rgba(0, 0, 0, 0.45)",
  },
  authModalClose: {
    position: "absolute",
    top: "12px",
    right: "14px",
    background: "transparent",
    border: "none",
    color: "#8B949E",
    fontSize: "26px",
    cursor: "pointer",
  },
  authModalTitle: {
    margin: "10px 0",
    fontSize: "24px",
    fontWeight: "750",
    color: "#E6EDF3",
  },
  authModalDescription: {
    margin: "0 0 22px",
    color: "#8B949E",
    fontSize: "14px",
    lineHeight: "1.6",
  },
  authModalPrimary: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #2EA043",
    background: "#238636",
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
  },
  authModalSecondary: {
    width: "100%",
    marginTop: "10px",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #30363D",
    background: "#21262D",
    color: "#E6EDF3",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
  },
  authModalCancel: {
    marginTop: "16px",
    padding: "6px 10px",
    border: "none",
    background: "transparent",
    color: "#8B949E",
    fontSize: "13px",
    cursor: "pointer",
  },

  page: {

    minHeight: "100vh",

    background:

      "linear-gradient(135deg, #0D1117 0%, #161B22 50%, #1C2128 100%)",

    display: "flex",

    flexDirection: "column",

    fontFamily: "-apple-system,'Segoe UI',sans-serif",

    overflowX: "hidden",

  },



  // ====================================================

  // HERO

  // ====================================================



  hero: {

    background: "transparent",

    padding: "80px 24px",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "60px",

    flexWrap: "wrap",

  },



  heroInner: {

    maxWidth: "540px",

    flex: 1,

  },



  heroBadge: {

    display: "inline-flex",

    alignItems: "center",

    gap: "8px",

    background: "rgba(88,166,255,0.1)",

    border: "1px solid rgba(88,166,255,0.3)",

    borderRadius: "20px",

    padding: "5px 14px",

    color: "#58A6FF",

    fontSize: "13px",

    fontWeight: "500",

    marginBottom: "24px",

  },



  heroBadgeDot: {

    width: "6px",

    height: "6px",

    borderRadius: "50%",

    background: "#3FB950",

    flexShrink: 0,

  },



  heroTitle: {

    color: "#E6EDF3",

    fontSize: "48px",

    fontWeight: "800",

    lineHeight: "1.15",

    margin: "0 0 16px 0",

    letterSpacing: "-1px",

  },



  heroTitleAccent: {

    color: "#58A6FF",

  },



  heroDesc: {

    color: "#8B949E",

    fontSize: "17px",

    lineHeight: "1.7",

    margin: "0 0 32px 0",

  },



  heroActions: {

    display: "flex",

    flexDirection: "column",

    gap: "12px",

  },



  heroPrimaryBtn: {

    background: "#238636",

    color: "#fff",

    border: "none",

    borderRadius: "8px",

    padding: "14px 28px",

    fontSize: "16px",

    fontWeight: "700",

    cursor: "pointer",

    alignSelf: "flex-start",

    fontFamily: "inherit",

    transition: "all 0.15s",

  },



  heroJoinRow: {

    display: "flex",

    gap: "8px",

  },



  heroInput: {

    background: "#161B22",

    border: "1px solid #30363D",

    borderRadius: "8px",

    color: "#E6EDF3",

    padding: "12px 16px",

    fontSize: "15px",

    outline: "none",

    fontFamily: "monospace",

    letterSpacing: "3px",

    fontWeight: "700",

    textTransform: "uppercase",

    width: "160px",

  },



  heroSecondaryBtn: {

    background: "#21262D",

    color: "#E6EDF3",

    border: "1px solid #30363D",

    borderRadius: "8px",

    padding: "12px 20px",

    fontSize: "15px",

    fontWeight: "600",

    cursor: "pointer",

    fontFamily: "inherit",

  },



  errorText: {

    color: "#F78166",

    fontSize: "13px",

    margin: 0,

  },



  heroStats: {

    display: "flex",

    gap: "32px",

    marginTop: "40px",

    paddingTop: "32px",

    borderTop: "1px solid #30363D",

  },



  heroStat: {},



  heroStatNum: {

    color: "#58A6FF",

    fontSize: "24px",

    fontWeight: "800",

    margin: 0,

  },



  heroStatLabel: {

    color: "#8B949E",

    fontSize: "12px",

    margin: "2px 0 0 0",

  },



  // ====================================================

  // EDITOR MOCK

  // ====================================================



  heroVisual: {

    flex: 1,

    maxWidth: "480px",

    minWidth: "300px",

  },



  editorMock: {

    background: "#0D1117",

    border: "1px solid #30363D",

    borderRadius: "12px",

    overflow: "hidden",

    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",

    position: "relative",

  },



  editorMockBar: {

    background: "#161B22",

    padding: "10px 14px",

    display: "flex",

    alignItems: "center",

    gap: "6px",

    borderBottom: "1px solid #30363D",

  },



  editorDot: {

    width: "10px",

    height: "10px",

    borderRadius: "50%",

  },



  editorMockTitle: {

    color: "#8B949E",

    fontSize: "12px",

    marginLeft: "8px",

    fontFamily: "monospace",

  },



  editorMockBody: {

    padding: "20px",

    fontFamily: "Fira Code,Consolas,monospace",

    fontSize: "14px",

    lineHeight: "1.8",

    color: "#C9D1D9",

  },



  fakeUsers: {

    padding: "10px 14px",

    background: "#161B22",

    borderTop: "1px solid #30363D",

    display: "flex",

    alignItems: "center",

    gap: "8px",

  },



  fakeUser: {

    width: "24px",

    height: "24px",

    borderRadius: "50%",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    color: "#fff",

    fontSize: "10px",

    fontWeight: "bold",

    border: "2px solid #0D1117",

  },



  fakeUsersLabel: {

    color: "#3FB950",

    fontSize: "11px",

    marginLeft: "8px",

  },



  // ====================================================

  // FEATURES

  // ====================================================



  section: {

    background: "transparent",

    padding: "80px 24px",

  },



  sectionInner: {

    maxWidth: "1100px",

    margin: "0 auto",

  },



  sectionTitle: {

    color: "#FFFFFF",

    fontSize: "32px",

    fontWeight: "800",

    textAlign: "center",

    margin: "0 0 12px 0",

  },



  sectionDesc: {

    color: "#57606A",

    fontSize: "16px",

    textAlign: "center",

    margin: "0 0 48px 0",

  },



  featureGrid: {

    display: "grid",

    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",

  },



  featureCard: {

    background: "transparent",

    border: "none",

    borderRadius: "0",

    padding: "24px",

    display: "flex",

    flexDirection: "column",

    gap: "12px",

    cursor: "default",

  },



  featureIcon: {

    width: "44px",

    height: "44px",

    borderRadius: "10px",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    fontSize: "22px",

  },



  featureTitle: {

    color: "#0D1117",

    fontSize: "16px",

    fontWeight: "700",

    margin: 0,

  },



  featureDesc: {

    color: "#57606A",

    fontSize: "14px",

    lineHeight: "1.6",

    margin: 0,

    flex: 1,

  },



  featureBtn: {

    background: "transparent",

    border: "1px solid",

    borderRadius: "6px",

    padding: "7px 14px",

    fontSize: "13px",

    fontWeight: "600",

    cursor: "pointer",

    alignSelf: "flex-start",

    fontFamily: "inherit",

    transition: "all 0.15s",

    marginTop: "auto",

  },



  // ====================================================

  // CTA

  // ====================================================



  cta: {

    background: "#0D1117",

    padding: "80px 24px",

    textAlign: "center",

  },



  ctaInner: {

    maxWidth: "600px",

    margin: "0 auto",

  },



  ctaTitle: {

    color: "#E6EDF3",

    fontSize: "32px",

    fontWeight: "800",

    margin: "0 0 12px 0",

  },



  ctaDesc: {

    color: "#8B949E",

    fontSize: "16px",

    margin: "0 0 32px 0",

  },



  ctaBtn: {

    background: "#238636",

    color: "#fff",

    border: "none",

    borderRadius: "8px",

    padding: "14px 32px",

    fontSize: "16px",

    fontWeight: "700",

    cursor: "pointer",

    fontFamily: "inherit",

  },



  // ====================================================

  // FOOTER

  // ====================================================



  footer: {

    background: "#F6F8FA",

    borderTop: "1px solid #D0D7DE",

    padding: "32px 24px",

  },



  footerInner: {

    maxWidth: "1100px",

    margin: "0 auto",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    gap: "8px",

  },



  footerLogo: {

    display: "flex",

    alignItems: "center",

    gap: "8px",

    fontSize: "16px",

  },



  footerText: {

    color: "#57606A",

    fontSize: "13px",

    margin: 0,

  },

};
