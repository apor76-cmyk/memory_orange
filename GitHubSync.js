/* ================= GitHub Sync Core (병합 + 올리기/내려받기 분리) ================= */

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

/* 📦 로컬 데이터 가져오기 */
function getSyncData() {
  return {
    memoryPathState: localStorage.getItem("memoryPathState") || "{}",
    sessions: localStorage.getItem("sessions") || "{}",
    completedSessions: localStorage.getItem("completedSessions") || "{}",
    darkMode: localStorage.getItem("darkMode") || "false"
  };
}

/* JSON 문자열 병합 (중복 key는 로컬 우선) */
function mergeJSON(localStr, remoteStr) {
  try {
    const local = JSON.parse(localStr || "{}");
    const remote = JSON.parse(remoteStr || "{}");
    return JSON.stringify({ ...remote, ...local });
  } catch {
    return localStr || "{}";
  }
}

/* 📥 GitHub → 로컬 (병합 적용) */
async function syncFromGitHub() {
  try {
    const res = await fetch(GH_RAW + "?t=" + Date.now());
    if (!res.ok) return;

    const remoteData = await res.json();
    const localData = getSyncData();

    const merged = {
      memoryPathState: mergeJSON(localData.memoryPathState, remoteData.memoryPathState),
      sessions: mergeJSON(localData.sessions, remoteData.sessions),
      completedSessions: mergeJSON(localData.completedSessions, remoteData.completedSessions),
      darkMode: remoteData.darkMode || localData.darkMode
    };

    applySyncData(merged);
    console.log("✅ GitHub → 로컬 동기화 완료 (병합 적용)");
    alert("✅ GitHub 데이터 내려받기 완료!");

  } catch (e) {
    console.log("syncFromGitHub 실패", e);
    alert("❌ GitHub 내려받기 실패");
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
    alert("✅ GitHub 데이터 올리기 완료!");

  } catch (e) {
    console.log("syncToGitHub 실패", e);
    alert("❌ GitHub 올리기 실패");
  }
}

/* 로컬 데이터 적용 */
function applySyncData(data) {
  if (!data) return;
  if (data.memoryPathState) localStorage.setItem("memoryPathState", data.memoryPathState);
  if (data.sessions) localStorage.setItem("sessions", data.sessions);
  if (data.completedSessions) localStorage.setItem("completedSessions", data.completedSessions);
  if (data.darkMode) localStorage.setItem("darkMode", data.darkMode);
}

/* 🌍 전역 노출 */
window.GitHubSync = {
  syncToGitHub,
  syncFromGitHub
};
