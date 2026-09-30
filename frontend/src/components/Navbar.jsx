import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function HoverMenu({ items }) {
  return (
    <div style={S.dropdown}>
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} style={S.dropdownDivider} />
        ) : (
          <div
            key={i}
            style={S.dropdownItem}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#F6F8FA")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
            onClick={item.onClick}
          >
            <div
              style={{
                ...S.dropdownIconBox,
                background: item.iconBg || "#F6F8FA",
              }}
            >
              <span style={{ fontSize: "16px" }}>{item.icon}</span>
            </div>

            <div style={{ flex: 1 }}>
              <p style={S.dropdownItemTitle}>{item.label}</p>
              {item.desc && (
                <p style={S.dropdownItemDesc}>{item.desc}</p>
              )}
            </div>

            <span style={S.dropdownArrow}>→</span>
          </div>
        )
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [hoveredNav, setHoveredNav] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(null);

  const hideTimer = useRef(null);
  const navRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setHoveredNav(null);
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () =>
      document.removeEventListener("mousedown", handler);
  }, []);

  const handleMouseEnter = (key) => {
    clearTimeout(hideTimer.current);
    setHoveredNav(key);
  };

  const handleMouseLeave = () => {
    hideTimer.current = setTimeout(() => {
      setHoveredNav(null);
    }, 120);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const workspaceItems = [
    {
      icon: "🏠",
      iconBg: "#DDF4FF",
      label: "Collaborative Rooms",
      desc: "Code together in real time with your team",
      onClick: () => {
        navigate("/admin?type=room");
        setHoveredNav(null);
      },
    },
    {
      icon: "⚡",
      iconBg: "#FFF8C5",
      label: "Contest Mode",
      desc: "Race to match the target output",
      onClick: () => {
        navigate("/admin?type=contest");
        setHoveredNav(null);
      },
    },
    { divider: true },
    {
      icon: "➕",
      iconBg: "#DAFBE1",
      label: "New Room",
      desc: "Start a fresh coding space instantly",
      onClick: () => {
        navigate("/admin");
        setHoveredNav(null);
      },
    },
  ];

  const resourceItems = [
    {
      icon: "📖",
      iconBg: "#F1EFFF",
      label: "Documentation",
      desc: "Guides, API reference and tutorials",
      onClick: () => setHoveredNav(null),
    },
    {
      icon: "💡",
      iconBg: "#FFF8C5",
      label: "How it works",
      desc: "Learn about real-time collaboration",
      onClick: () => setHoveredNav(null),
    },
    { divider: true },
    {
      icon: "🎓",
      iconBg: "#DDF4FF",
      label: "For Students",
      desc: "Classroom mode and team projects",
      onClick: () => setHoveredNav(null),
    },
    {
      icon: "🏆",
      iconBg: "#FFEFF7",
      label: "For Hackathons",
      desc: "Zero-setup team coding environment",
      onClick: () => setHoveredNav(null),
    },
  ];

  return (
    <nav ref={navRef} style={S.nav}>
      <div style={S.inner}>

        {/* Logo */}
        <div
          style={S.logo}
          onClick={() => navigate("/dashboard")}
        >
          <span style={S.logoWord1}>Code</span>
          <span style={S.logoWord2}>Collab</span>
        </div>

        {/* Navigation */}
        <div style={S.navLinks}>

          {/* ================= WORKSPACE / RESOURCES ================= */}

          <div style={S.animatedNavContainer}>

            {/* Sliding background */}
            <div
              style={{
                ...S.animatedNavBackground,

                opacity: hoveredNav ? 1 : 0,

                transform:
                  hoveredNav === "resources"
                    ? "translateX(100%)"
                    : "translateX(0)",

                width: hoveredNav === "resources"
                  ? "108px"
                  : "112px",
              }}
            />

            {/* Workspace */}
            <div
              style={{
                ...S.navItemWrap,
                zIndex: 2,
              }}
              onMouseEnter={() =>
                handleMouseEnter("workspace")
              }
              onMouseLeave={handleMouseLeave}
            >
              <button
                style={{
                  ...S.navBtn,
                  color:
                    hoveredNav === "workspace"
                      ? "#0969DA"
                      : "#57606A",
                }}
              >
                Workspace

                <span
                  style={{
                    ...S.chevron,
                    transform:
                      hoveredNav === "workspace"
                        ? "rotate(180deg)"
                        : "none",
                    color:
                      hoveredNav === "workspace"
                        ? "#0969DA"
                        : "#57606A",
                  }}
                >
                  ▾
                </span>
              </button>

              {hoveredNav === "workspace" && (
                <div
                  onMouseEnter={() =>
                    handleMouseEnter("workspace")
                  }
                  onMouseLeave={handleMouseLeave}
                >
                  <HoverMenu items={workspaceItems} />
                </div>
              )}
            </div>

            {/* Resources */}
            <div
              style={{
                ...S.navItemWrap,
                zIndex: 2,
              }}
              onMouseEnter={() =>
                handleMouseEnter("resources")
              }
              onMouseLeave={handleMouseLeave}
            >
              <button
                style={{
                  ...S.navBtn,
                  color:
                    hoveredNav === "resources"
                      ? "#0969DA"
                      : "#57606A",
                }}
              >
                Resources

                <span
                  style={{
                    ...S.chevron,
                    transform:
                      hoveredNav === "resources"
                        ? "rotate(180deg)"
                        : "none",
                    color:
                      hoveredNav === "resources"
                        ? "#0969DA"
                        : "#57606A",
                    transition:
                      "transform 0.2s ease, color 0.2s ease",
                  }}
                >
                  ▾
                </span>
              </button>

              {hoveredNav === "resources" && (
                <div
                  onMouseEnter={() =>
                    handleMouseEnter("resources")
                  }
                  onMouseLeave={handleMouseLeave}
                >
                  <HoverMenu items={resourceItems} />
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Right */}
        <div style={S.right}>
          {user ? (
            <>
              <button
                style={S.newRoomBtn}
                onClick={() => navigate("/admin")}
              >
                + New Room
              </button>

              <div style={{ position: "relative" }}>
                <div
                  style={{
                    ...S.avatar,
                    background: user.avatar_color,
                  }}
                  onClick={() =>
                    setUserMenuOpen(!userMenuOpen)
                  }
                >
                  {user.username?.[0]?.toUpperCase()}
                </div>

                {userMenuOpen && (
                  <div
                    style={{
                      ...S.dropdown,
                      right: 0,
                      left: "auto",
                      minWidth: "210px",
                    }}
                  >
                    <div style={S.userHeader}>
                      <div
                        style={{
                          ...S.avatarSm,
                          background: user.avatar_color,
                        }}
                      >
                        {user.username?.[0]?.toUpperCase()}
                      </div>

                      <div>
                        <p style={S.userName}>
                          {user.username}
                        </p>

                        <p style={S.userEmail}>
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div style={S.dropdownDivider} />

                    {[
                      {
                        icon: "🏠",
                        label: "Dashboard",
                        onClick: () => {
                          navigate("/dashboard");
                          setUserMenuOpen(false);
                        },
                      },
                      {
                        icon: "➕",
                        label: "New Room",
                        onClick: () => {
                          navigate("/admin");
                          setUserMenuOpen(false);
                        },
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        style={S.dropdownItem}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "#F6F8FA")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            "transparent")
                        }
                        onClick={item.onClick}
                      >
                        <div
                          style={{
                            ...S.dropdownIconBox,
                            background: "#F6F8FA",
                          }}
                        >
                          <span
                            style={{ fontSize: "14px" }}
                          >
                            {item.icon}
                          </span>
                        </div>

                        <p style={S.dropdownItemTitle}>
                          {item.label}
                        </p>
                      </div>
                    ))}

                    <div style={S.dropdownDivider} />

                    <div
                      style={S.dropdownItem}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "#FFF0EE")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          "transparent")
                      }
                      onClick={handleLogout}
                    >
                      <div
                        style={{
                          ...S.dropdownIconBox,
                          background: "#FFF0EE",
                        }}
                      >
                        <span style={{ fontSize: "14px" }}>
                          🚪
                        </span>
                      </div>

                      <p
                        style={{
                          ...S.dropdownItemTitle,
                          color: "#CF222E",
                        }}
                      >
                        Sign out
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                style={S.loginBtn}
                onClick={() => navigate("/login")}
              >
                Log in
              </button>

              <button
                style={S.signupBtn}
                onClick={() => navigate("/login")}
              >
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
    background: "#FFFFFF",
    borderBottom: "1px solid #D0D7DE",
    position: "sticky",
    top: 0,
    zIndex: 100,
    flexShrink: 0,
  },

  inner: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "0 24px",
    height: "56px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  // Logo
  logo: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    flexShrink: 0,
    marginRight: "16px",
  },

  logoWord1: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#0D1117",
    letterSpacing: "-0.5px",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },

  logoWord2: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#0969DA",
    letterSpacing: "-0.5px",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },

  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    flex: 1,
  },

  /*
   * Motion Primitives-style container.
   * The background is a single element that slides
   * between Workspace and Resources.
   */
  animatedNavContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "2px",
    height: "40px",
  },

  animatedNavBackground: {
    position: "absolute",
    left: 0,
    top: "4px",
    height: "32px",
    borderRadius: "8px",
    background: "#F6F8FA",
    boxShadow:
      "0 1px 3px rgba(140,149,159,0.12)",
    transition:
      "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), width 0.3s ease, opacity 0.2s ease",
    pointerEvents: "none",
  },

  navItemWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },

  navBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "8px 14px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontFamily: "inherit",
    transition: "color 0.2s ease",
  },

  chevron: {
    fontSize: "10px",
    display: "inline-block",
    transition:
      "transform 0.2s ease, color 0.2s ease",
  },

  // Dropdown
  dropdown: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    background: "#FFFFFF",
    border: "1px solid #D0D7DE",
    borderRadius: "12px",
    minWidth: "300px",
    boxShadow:
      "0 8px 24px rgba(140,149,159,0.25)",
    zIndex: 200,
    padding: "8px",
  },

  dropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 10px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background 0.1s",
    background: "transparent",
  },

  dropdownIconBox: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  dropdownItemTitle: {
    color: "#0D1117",
    fontSize: "14px",
    fontWeight: "600",
    margin: 0,
  },

  dropdownItemDesc: {
    color: "#57606A",
    fontSize: "12px",
    margin: "2px 0 0 0",
  },

  dropdownArrow: {
    color: "#57606A",
    fontSize: "12px",
    marginLeft: "auto",
    flexShrink: 0,
  },

  dropdownDivider: {
    height: "1px",
    background: "#D0D7DE",
    margin: "6px 0",
  },

  // User menu
  userHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 10px",
  },

  avatarSm: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "13px",
    flexShrink: 0,
  },

  userName: {
    color: "#0D1117",
    fontWeight: "600",
    fontSize: "13px",
    margin: 0,
  },

  userEmail: {
    color: "#57606A",
    fontSize: "11px",
    margin: 0,
  },

  // Right
  right: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginLeft: "auto",
  },

  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "13px",
    cursor: "pointer",
    border: "2px solid #D0D7DE",
    flexShrink: 0,
  },

  newRoomBtn: {
    background: "#0969DA",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "7px 16px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "inherit",
  },

  loginBtn: {
    background: "transparent",
    color: "#0D1117",
    border: "none",
    borderRadius: "6px",
    padding: "7px 12px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    fontFamily: "inherit",
  },

  signupBtn: {
    background: "#0969DA",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "7px 16px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};