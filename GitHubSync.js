/* ================= GitHub Sync (수정 버전) ================= */
const GITHUB = {
  user: "apor76-cmyk",
  repo: "memory_dark",
  branch: "main",
  path: "memory_sync.json"
};
const GH_API = `https://api.github.com/repos/${GITHUB.user}/${GITHUB.repo}/contents/${GITHUB.path}`;

function getToken() {
  let token = localStorage.getItem("GH_TOKEN");
  if (!token) {
    token = prompt("GitHub Token 입력 (한 번만 입력, repo 권한 필요: Contents Read & Write)");
    if (token) localStorage.setItem("GH_TOKEN", token);
  }
  return token;
}

function getSyncData() {
  return {
    memoryPathState: localStorage.getItem("memoryPathState") || "{}",
    sessions: localStorage.getItem("sessions") || "{}",
    completedSessions: localStorage.getItem("completedSessions") || "{}",
    darkMode: localStorage.getItem("darkMode") || "false"
  };
}

function mergeJSON(localStr, remoteStr) {
  try { 
    return JSON.stringify({...JSON.parse(remoteStr || "{}"), ...JSON.parse(localStr || "{}")}); 
  } catch { 
    return localStr || "{}"; 
  }
}

async function syncFromGitHub() {
  try {
    const token = getToken();
    if (!token) return alert("토큰 필요");

    const res = await fetch(GH_API, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw "파일 없음 또는 권한 문제";

    const j = await res.json();
    const remoteData = JSON.parse(atob(j.content));

    const localData = getSyncData();
    const merged = {
      memoryPathState: mergeJSON(localData.memoryPathState, remoteData.memoryPathState),
      sessions: mergeJSON(localData.sessions, remoteData.sessions),
      completedSessions: mergeJSON(localData.completedSessions, remoteData.completedSessions),
      darkMode: remoteData.darkMode || localData.darkMode
    };

    applySyncData(merged);
    render(); 
    loadSessionList(); 
    loadCompletedList();
    alert("✅ GitHub에서 내려받기 완료!");
  } catch (e) {
    console.error(e);
    alert("❌ 내려받기 실패: " + e);
  }
}

async function syncToGitHub() {
  try {
    const token = getToken();
    if (!token) return alert("토큰 필요");

    const data = getSyncData();
    let sha;

    // 기존 파일이 있는지 확인
    const check = await fetch(GH_API, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (check.ok) {
      const j = await check.json();
      sha = j.sha;
    }

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));

    const res = await fetch(GH_API, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "MemoryPath 자동 백업",
        content,
        branch: GITHUB.branch,
        ...(sha ? { sha } : {})
      })
    });

    if (res.ok) alert("✅ GitHub 업로드 성공!");
    else {
      const err = await res.json();
      console.error("업로드 실패:", err);
      alert("❌ 업로드 실패: " + (err.message || "Unknown"));
    }
  } catch (e) {
    console.error(e);
    alert("❌ 업로드 실패: " + e);
  }
}

function applySyncData(data) {
  if (!data) return;

  if (data.memoryPathState) {
    localStorage.setItem("memoryPathState", data.memoryPathState);
    const s = JSON.parse(data.memoryPathState);
    words = s.words || [];
    positions = s.positions || [];
    completedWords = s.completedWords || [];
    originalWords = s.originalWords || [];
  }

  if (data.sessions) localStorage.setItem("sessions", data.sessions);
  if (data.completedSessions) localStorage.setItem("completedSessions", data.completedSessions);
  if (data.darkMode) {
    localStorage.setItem("darkMode", data.darkMode);
    document.body.classList.toggle("dark", data.darkMode === "true");
  }
}

window.GitHubSync = {
  syncToGitHub,
  syncFromGitHub,
  clearToken: () => { localStorage.removeItem("GH_TOKEN"); alert("토큰 삭제됨"); }
};
