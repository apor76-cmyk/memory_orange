/* ================= GitHub Sync Core ================= */

const GITHUB = {
  user: "apor76-cmyk",
  repo: "memory_dark",
  path: "memory_sync.json"
};

const GH_API = `https://api.github.com/repos/${GITHUB.user}/${GITHUB.repo}/contents/${GITHUB.path}`;
const GH_RAW = `https://raw.githubusercontent.com/${GITHUB.user}/${GITHUB.repo}/main/${GITHUB.path}`;

/* 🔐 토큰 관리 */
function getToken() {
  let token = localStorage.getItem("GH_TOKEN");
  if (!token) {
    token = prompt("GitHub Token 입력 (한 번만 입력)");
    if (token) localStorage.setItem("GH_TOKEN", token);
  }
  return token;
}

/* 📦 동기화 데이터 정의 (앱마다 커스터마이즈 가능) */
function getSyncData() {
  return {
    memoryPathState: localStorage.getItem("memoryPathState"),
    sessions: localStorage.getItem("sessions"),
    completedSessions: localStorage.getItem("completedSessions"),
    darkMode: localStorage.getItem("darkMode")
  };
}

function applySyncData(data) {
  if (!data) return;
  if (data.memoryPathState) localStorage.setItem("memoryPathState", data.memoryPathState);
  if (data.sessions) localStorage.setItem("sessions", data.sessions);
  if (data.completedSessions) localStorage.setItem("completedSessions", data.completedSessions);
  if (data.darkMode) localStorage.setItem("darkMode", data.darkMode);
}

/* 📥 GitHub → 로컬 */
async function syncFromGitHub() {
  try {
    const res = await fetch(GH_RAW + "?t=" + Date.now());
    if (!res.ok) return;
    const data = await res.json();
    applySyncData(data);
    console.log("✅ GitHub → 로컬 동기화 완료");
  } catch (e) {
    console.log("syncFromGitHub 실패", e);
  }
}

/* 📤 로컬 → GitHub */
async function syncToGitHub() {
  try {
    const token = getToken();
    if (!token) return;

    const data = getSyncData();

    let sha = null;
    const fileRes = await fetch(GH_API, {
      headers: { Authorization: `token ${token}` }
    });

    if (fileRes.ok) {
      const fileData = await fileRes.json();
      sha = fileData.sha;
    }

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));

    await fetch(GH_API, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "auto sync",
        content,
        sha
      })
    });

    console.log("✅ 로컬 → GitHub 동기화 완료");

  } catch (e) {
    console.log("syncToGitHub 실패", e);
  }
}

/* 🌍 전역으로 노출 (HTML에서 사용 가능) */
window.GitHubSync = {
  syncToGitHub,
  syncFromGitHub
};
