import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AnimatePresence, motion } from "motion/react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const hideTimer = useRef(null);
  const navRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setHovered(null);
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const enter = (key) => {
    clearTimeout(hideTimer.current);
    setHovered(key);
    setProfileOpen(false);
  };

  const leave = () => {
    hideTimer.current = setTimeout(() => {
      setHovered(null);
      setHoveredItem(null);
    }, 150);
  };

  const keepOpen = () => clearTimeout(hideTimer.current);

  const navItems = [
    {
      key: "workspace",
      label: "Workspace",
      items: [
        {
          id: "collab",
          label: "Collaborative Rooms",
          desc: "Code together in real time with your team",
          onClick: () => {
            navigate("/create?type=room");
            setHovered(null);
          },
        },
        {
          id: "contest",
          label: "Contest Mode",
          desc: "Race to match the target output",
          onClick: () => {
            navigate("/create?type=contest");
            setHovered(null);
          },
        },
        {
          id: "newroom",
          label: "New Room",
          desc: "Start a fresh coding space instantly",
          onClick: () => {
            navigate("/create");
            setHovered(null);
          },
        },
      ],
    },
    {
      key: "resources",
      label: "Resources",
      items: [
        {
          id: "docs",
          label: "Documentation",
          desc: "Guides, API reference and tutorials",
        },
        {
          id: "how",
          label: "How it works",
          desc: "Learn about real-time collaboration",
        },
        {
          id: "students",
          label: "For Students",
          desc: "Classroom mode and team projects",
        },
        {
          id: "hackathons",
          label: "For Hackathons",
          desc: "Zero-setup team coding environment",
        },
      ],
    },
  ];

  const profileItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      onClick: () => {
        navigate("/app");
        setProfileOpen(false);
      },
    },
    {
      id: "newroom",
      label: "New Room",
      onClick: () => {
        navigate("/create");
        setProfileOpen(false);
      },
    },
    {
      id: "settings",
      label: "Settings",
      onClick: () => {
        setProfileOpen(false);
      },
    },
  ];

  return (
    <nav ref={navRef} style={S.nav}>
      <div style={S.inner}>
        {/* Wordmark */}
        <div style={S.logo} onClick={() => navigate("/dashboard")}>
          <span style={S.logoBlack}>Code</span>
          <span style={S.logoPink}>Collab</span>
        </div>

        {/* Nav links */}
        <div style={S.links}>
          {navItems.map((item) => (
            <div
              key={item.key}
              style={S.navItemWrap}
              onMouseEnter={() => enter(item.key)}
              onMouseLeave={leave}
            >
              <button
                style={{
                  ...S.navBtn,
                  color: hovered === item.key ? "#FFFFFF" : "#8B949E",
                }}
              >
                {item.label}
                <motion.span
                  animate={{ rotate: hovered === item.key ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    display: "inline-block",
                    fontSize: "10px",
                    marginLeft: "2px",
                  }}
                >
                  ▾
                </motion.span>
              </button>

              <AnimatePresence>
                {hovered === item.key && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    style={S.panelWrap}
                    onMouseEnter={keepOpen}
                    onMouseLeave={leave}
                  >
                    <div style={S.panel}>
                      {/* Animated items */}
                      {item.items.map((navItem) => (
                        <div
                          key={navItem.id}
                          style={{
                            position: "relative",
                            borderRadius: "8px",
                            overflow: "hidden",
                          }}
                          onMouseEnter={() => setHoveredItem(navItem.id)}
                          onMouseLeave={() => setHoveredItem(null)}
                          onClick={navItem.onClick}
                        >
                          {/* Animated highlight */}
                          <AnimatePresence>
                            {hoveredItem === navItem.id && (
                              <motion.div
                                layoutId={`nav-highlight-${item.key}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{
                                  type: "spring",
                                  bounce: 0.2,
                                  duration: 0.4,
                                }}
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  background: "rgba(255,255,255,0.06)",
                                  borderRadius: "8px",
                                  zIndex: 0,
                                }}
                              />
                            )}
                          </AnimatePresence>

                          <div
                            style={{
                              ...S.panelItem,
                              position: "relative",
                              zIndex: 1,
                            }}
                          >
                            <p
                              style={{
                                ...S.panelItemTitle,
                                color:
                                  hoveredItem === navItem.id
                                    ? "#FFFFFF"
                                    : "#C9D1D9",
                                transition: "color 0.15s",
                              }}
                            >
                              {navItem.label}
                            </p>
                            <p style={S.panelItemDesc}>{navItem.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Right */}
        <div style={S.right}>
          {user ? (
            <>
              <button
                style={S.newRoomBtn}
                onClick={() =>
                  user ? navigate("/create") : navigate("/login?next=create")
                }
              >
                New Room
              </button>

              {/* Avatar */}
              <div style={{ position: "relative" }}>
                <div
                  style={S.avatarWrap}
                  onClick={() => {
                    setProfileOpen(!profileOpen);
                    setHovered(null);
                  }}
                >
                  <div style={{ ...S.avatar, background: user.avatar_color }}>
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                  <div style={S.onlineDot} />
                </div>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      style={S.profilePanel}
                    >
                      {/* User header */}
                      <div style={S.profileHeader}>
                        <div
                          style={{
                            ...S.avatarLg,
                            background: user.avatar_color,
                          }}
                        >
                          {user.username?.[0]?.toUpperCase()}
                          <div style={S.onlineDotLg} />
                        </div>
                        <div>
                          <p style={S.profileName}>{user.username}</p>
                          <p style={S.profileEmail}>{user.email}</p>
                        </div>
                      </div>

                      <div style={S.profileDivider} />

                      {/* Profile items with animated hover */}
                      {profileItems.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            position: "relative",
                            borderRadius: "8px",
                            overflow: "hidden",
                          }}
                          onMouseEnter={() =>
                            setHoveredItem(`profile-${item.id}`)
                          }
                          onMouseLeave={() => setHoveredItem(null)}
                          onClick={item.onClick}
                        >
                          <AnimatePresence>
                            {hoveredItem === `profile-${item.id}` && (
                              <motion.div
                                layoutId="profile-highlight"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{
                                  type: "spring",
                                  bounce: 0.2,
                                  duration: 0.35,
                                }}
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  background: "rgba(255,255,255,0.06)",
                                  borderRadius: "8px",
                                  zIndex: 0,
                                }}
                              />
                            )}
                          </AnimatePresence>
                          <div
                            style={{
                              ...S.profileItem,
                              position: "relative",
                              zIndex: 1,
                            }}
                          >
                            <span
                              style={{
                                ...S.profileItemLabel,
                                color:
                                  hoveredItem === `profile-${item.id}`
                                    ? "#FFFFFF"
                                    : "#C9D1D9",
                                transition: "color 0.15s",
                              }}
                            >
                              {item.label}
                            </span>
                          </div>
                        </div>
                      ))}

                      <div style={S.profileDivider} />

                      {/* Sign out */}
                      <div
                        style={{
                          position: "relative",
                          borderRadius: "8px",
                          overflow: "hidden",
                        }}
                        onMouseEnter={() => setHoveredItem("signout")}
                        onMouseLeave={() => setHoveredItem(null)}
                        onClick={() => {
                          logout();
                          navigate("/login");
                        }}
                      >
                        <AnimatePresence>
                          {hoveredItem === "signout" && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              style={{
                                position: "absolute",
                                inset: 0,
                                background: "rgba(247,129,102,0.1)",
                                borderRadius: "8px",
                                zIndex: 0,
                              }}
                            />
                          )}
                        </AnimatePresence>
                        <div
                          style={{
                            ...S.profileItem,
                            position: "relative",
                            zIndex: 1,
                          }}
                        >
                          <span
                            style={{
                              ...S.profileItemLabel,
                              color:
                                hoveredItem === "signout"
                                  ? "#F78166"
                                  : "#8B949E",
                              transition: "color 0.15s",
                            }}
                          >
                            Sign out
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <button style={S.loginBtn} onClick={() => navigate("/login")}>
                Log in
              </button>
              <button style={S.signupBtn} onClick={() => navigate("/login")}>
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const S = {
  nav: {
    background: "#0D1117",
    borderBottom: "1px solid #21262D",
    position: "sticky",
    top: 0,
    zIndex: 100,
    flexShrink: 0,
    backdropFilter: "blur(12px)",
  },
  inner: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "0 28px",
    height: "58px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    flexShrink: 0,
    marginRight: "16px",
  },
  logoBlack: {
  fontSize: "28px",
  fontWeight: "900",
  color: "#FFFFFF",
  letterSpacing: "-1px",
  fontFamily: "'Georgia', serif",
  lineHeight: 1,
},
logoPink: {
  fontSize: "28px",
  fontWeight: "900",
  color: "#58A6FF",
  letterSpacing: "-1px",
  fontFamily: "'Georgia', serif",
  lineHeight: 1,
  textShadow: "0 0 24px rgba(88,166,255,0.45)",
},

  links: { display: "flex", alignItems: "center", gap: "2px", flex: 1 },
  navItemWrap: { position: "relative" },
  navBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "8px 14px",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontFamily: "inherit",
    transition: "color 0.15s",
  },
  panelWrap: {
    position: "absolute",
    top: "calc(100% + 10px)",
    left: 0,
    zIndex: 200,
  },
  panel: {
    background: "#161B22",
    border: "1px solid #30363D",
    borderRadius: "12px",
    minWidth: "280px",
    boxShadow: "0 16px 40px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)",
    padding: "8px",
    overflow: "hidden",
  },
  panelItem: {
    padding: "10px 12px",
    cursor: "pointer",
  },
  panelItemTitle: {
    fontSize: "14px",
    fontWeight: "600",
    margin: 0,
    lineHeight: 1.3,
  },
  panelItemDesc: {
    fontSize: "12px",
    color: "#484F58",
    margin: "3px 0 0 0",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginLeft: "auto",
  },
  newRoomBtn: {
    background: "#238636",
    color: "#FFFFFF",
    border: "1px solid #2ea043",
    borderRadius: "6px",
    padding: "7px 16px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "background 0.15s",
  },
  avatarWrap: {
    position: "relative",
    cursor: "pointer",
    width: "34px",
    height: "34px",
  },
  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: "14px",
    border: "2px solid #30363D",
  },
  onlineDot: {
    position: "absolute",
    bottom: "0px",
    right: "0px",
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#3FB950",
    border: "2px solid #0D1117",
  },
  profilePanel: {
    position: "absolute",
    top: "calc(100% + 10px)",
    right: 0,
    background: "#161B22",
    border: "1px solid #30363D",
    borderRadius: "12px",
    minWidth: "220px",
    boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
    padding: "8px",
    zIndex: 300,
    overflow: "hidden",
  },
  profileHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 10px 12px",
  },
  avatarLg: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: "16px",
    flexShrink: 0,
    position: "relative",
  },
  onlineDotLg: {
    position: "absolute",
    bottom: "0px",
    right: "0px",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#3FB950",
    border: "2px solid #161B22",
  },
  profileName: {
    color: "#E6EDF3",
    fontWeight: "700",
    fontSize: "14px",
    margin: 0,
  },
  profileEmail: { color: "#484F58", fontSize: "11px", margin: "2px 0 0 0" },
  profileDivider: { height: "1px", background: "#21262D", margin: "6px 0" },
  profileItem: {
    padding: "9px 12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  profileItemLabel: {
    fontSize: "13px",
    fontWeight: "500",
  },
  loginBtn: {
    background: "transparent",
    color: "#8B949E",
    border: "none",
    padding: "7px 12px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  signupBtn: {
    background: "#238636",
    color: "#fff",
    border: "1px solid #2ea043",
    borderRadius: "6px",
    padding: "7px 16px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
