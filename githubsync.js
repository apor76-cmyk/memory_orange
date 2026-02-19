const github = {
  user: "apor76-cmyk",
  repo: "memory_dark",
  path: "memory_sync.json",
  
// 데이터 불러오기
async function loadCloud(){
  const url = `https://api.github.com/repos/${github.user}/${github.repo}/contents/${github.path}`;

  const res = await fetch(url,{
    headers:{ Authorization:`token ${github.token}` }
  });

  if(!res.ok) return {};

  const data = await res.json();
  const content = decodeURIComponent(escape(atob(data.content)));
  return JSON.parse(content);
}

// 데이터 저장
async function saveCloud(state){
  const url = `https://api.github.com/repos/${github.user}/${github.repo}/contents/${github.path}`;

  let sha=null;
  const res = await fetch(url,{ headers:{ Authorization:`token ${github.token}` }});
  if(res.ok){
    const data = await res.json();
    sha = data.sha;
  }

  await fetch(url,{
    method:"PUT",
    headers:{
      "Content-Type":"application/json",
      Authorization:`token ${github.token}`
    },
    body:JSON.stringify({
      message:"update data",
      content:btoa(unescape(encodeURIComponent(JSON.stringify(state)))),
      sha
    })
  });
}
