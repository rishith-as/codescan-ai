// ══════════════════════════════════════
//   CodeScan AI — script.js
// ══════════════════════════════════════

const SAMPLES = {
  1: {
    lang: 'java',
    code: `class Solution {
    public int numDistinct(String s, String t) {
        int c[]=new int[1];
        plz(s,t,0,"",c);
        return c[0];
    }
    public static void plz(String s,String t,int i,String ans,int c[]){
        if(i>=s.length()){
            if(ans.length()!=t.length()){ return; }
            if(ans.equals(t)){ c[0]++; }
            return;
        }
        plz(s,t,i+1,ans+s.charAt(i),c);
        plz(s,t,i+1,ans,c);
    }
}`
  },
  2: {
    lang: 'python',
    code: `def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(len(nums)):
            if i != j and nums[i] + nums[j] == target:
                return [i, j]
    return []

print(two_sum([2,7,11,15], 9))`
  },
  3: {
    lang: 'javascript',
    code: `function fetchUserData(userId) {
  fetch('/api/users/' + userId)
    .then(res => res.json())
    .then(data => {
      document.getElementById('name').innerHTML = data.name
      document.getElementById('email').innerHTML = data.email
    })
}

var users = []
for(var i = 0; i < 100; i++){
  users.push(fetchUserData(i))
}`
  }
};

let sessionHistory = [];
let totalReviewed  = 0;
let totalErrors    = 0;
let scoreSum       = 0;
let savedCount     = 0;
let currentReview  = null;
let currentCode    = '';

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.textContent.toLowerCase().includes(name));
  });
  if (name === 'database') loadDbReviews();
}

function onCodeInput() {
  const code  = document.getElementById('code-in').value;
  const lines = code ? code.split('\n').length : 0;
  document.getElementById('char-count').textContent = code.length + ' chars';
  document.getElementById('line-count').textContent = lines + ' lines';
}

function loadSample(n) {
  const s = SAMPLES[n];
  document.getElementById('code-in').value  = s.code;
  document.getElementById('lang-sel').value = s.lang;
  onCodeInput();
}

function clearAll() {
  document.getElementById('code-in').value = '';
  onCodeInput();
  document.getElementById('review-out').innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⚡</div>
      <div class="empty-title">No review yet</div>
      <div class="empty-sub">Paste code and click Run Review</div>
    </div>`;
  setStatus('READY', 'var(--text3)');
}

function setStatus(text, color) {
  const dot = document.getElementById('status-dot');
  dot.textContent = '● ' + text;
  dot.style.color = color;
}

function checkApiKey() {
  if (!CONFIG || !CONFIG.GROQ_API_KEY || CONFIG.GROQ_API_KEY === '' || CONFIG.GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
    document.getElementById('review-out').innerHTML = `
      <div class="error-box">
        <div class="err-title">⚠ API Key Missing</div>
        Open <strong>public/config.js</strong> and paste your Groq API key.<br><br>
        Get a free key at: <a href="https://console.groq.com" style="color:var(--accent2)" target="_blank">console.groq.com</a>
      </div>`;
    setStatus('NO KEY', 'var(--red)');
    return false;
  }
  return true;
}

async function callGroq(prompt) {
  const res = await fetch(CONFIG.GROQ_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + CONFIG.GROQ_API_KEY },
    body: JSON.stringify({ model: CONFIG.GROQ_MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.2, max_tokens: 2000 })
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || 'Groq error ' + res.status); }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function runReview() {
  const code = document.getElementById('code-in').value.trim();
  const lang = document.getElementById('lang-sel').value;
  if (!code) { alert('Please paste some code first!'); return; }
  if (!checkApiKey()) return;

  const btn = document.getElementById('run-btn');
  btn.disabled = true;
  setStatus('ANALYZING...', 'var(--accent2)');

  document.getElementById('review-out').innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <div class="loading-steps">
        <div class="loading-step">Sending to Groq AI...</div>
        <div class="loading-step">Detecting bugs &amp; errors...</div>
        <div class="loading-step">Calculating complexity...</div>
      </div>
    </div>`;

  const prompt = `You are a senior software engineer and expert code reviewer.
Analyze the following ${lang === 'auto' ? '' : lang} code carefully.
Return ONLY a valid JSON object. No markdown, no backticks, no text outside the JSON.

JSON format:
{
  "language": "detected language name",
  "score": <integer 0-100>,
  "lines": <total line count>,
  "complexity": "Low|Medium|High",
  "has_error": <true|false>,
  "error_message": "describe the error clearly, or empty string if no error",
  "corrected_code": "fixed version of code if has_error is true, else empty string",
  "time_complexity": "Big-O notation e.g. O(n^2)",
  "space_complexity": "Big-O notation e.g. O(n)",
  "optimized_code": "better version of the code with improvements",
  "issues": [
    { "type": "critical|warning|suggestion|good", "title": "short title max 6 words", "body": "1-2 sentence explanation", "fix": "code fix or tip, empty string if none" }
  ],
  "summary": "2-3 sentence overall summary"
}

Rules:
- score: 90-100 excellent, 70-89 good, 50-69 needs work, 0-49 poor
- has_error: true only for syntax errors or logical bugs that break execution
- Include 4-6 issues, at least one 'good' if code has merit
- optimized_code: always provide a better version

Code:
${code}`;

  try {
    const raw    = await callGroq(prompt);
    const clean  = raw.replace(/```json|```/g, '').trim();
    const review = JSON.parse(clean);
    currentReview = review; currentCode = code;
    renderReview(review);
    updateSessionStats(review);
    pushSessionHistory(code, lang, review);
    setStatus('DONE', 'var(--green)');
  } catch (err) {
    document.getElementById('review-out').innerHTML = `
      <div class="error-box">
        <div class="err-title">Review Failed</div>
        ${escHtml(err.message)}<br><br>
        Common fixes:<br>
        • Check your Groq API key in public/config.js<br>
        • Make sure the server is running (node server.js)<br>
        • Try again — AI occasionally returns malformed JSON
      </div>`;
    setStatus('ERROR', 'var(--red)');
  }
  btn.disabled = false;
}

function renderReview(r) {
  const sc = r.score;
  const scClass    = sc >= 75 ? 's-great' : sc >= 50 ? 's-ok' : 's-bad';
  const grade      = sc >= 90 ? 'Excellent' : sc >= 75 ? 'Good' : sc >= 50 ? 'Needs Work' : 'Poor';
  const gradeColor = sc >= 75 ? 'var(--green)' : sc >= 50 ? 'var(--yellow)' : 'var(--red)';
  const cxColor    = r.complexity === 'High' ? 'var(--red)' : r.complexity === 'Medium' ? 'var(--yellow)' : 'var(--green)';

  const errorSection = r.has_error ? `
    <div class="error-detect-box">
      <div class="ed-title"><span style="color:var(--red)">✖</span> Error Detected</div>
      <div class="ed-msg">${escHtml(r.error_message)}</div>
      ${r.corrected_code ? `<div class="code-section-title" style="color:var(--green)"><span>✔</span> Corrected Code</div><div class="code-block">${escHtml(r.corrected_code)}</div>` : ''}
    </div>` : '';

  const issuesHtml = r.issues.map((iss, i) => `
    <div class="issue ${iss.type}" style="animation-delay:${i * 0.07}s" onclick="this.classList.toggle('open')">
      <div class="issue-top">
        <span class="ibadge ib-${iss.type}">${iss.type}</span>
        <span class="issue-title">${escHtml(iss.title)}</span>
        ${iss.fix ? '<span class="issue-expand">fix</span>' : ''}
      </div>
      <div class="issue-body">${escHtml(iss.body)}</div>
      ${iss.fix ? `<div class="issue-fix">${escHtml(iss.fix)}</div>` : ''}
    </div>`).join('');

  document.getElementById('review-out').innerHTML = `
    <div class="save-row">
      <button class="copy-btn" onclick="copyReport()">Copy Report</button>
      <button class="save-btn" id="save-db-btn" onclick="saveToDb()">↑ Save to MongoDB</button>
    </div>
    <div class="score-header">
      <div class="score-left">
        <div class="score-circle ${scClass}">${sc}</div>
        <div><div class="grade" style="color:${gradeColor}">${grade}</div><div class="grade-sub">${r.issues.length} issues found</div></div>
      </div>
      <div class="score-right">
        <div class="label">Language</div>
        <span class="lang-pill">${escHtml(r.language)}</span>
      </div>
    </div>
    <div class="metrics">
      <div class="metric"><div class="metric-val" style="color:var(--accent2)">${r.lines}</div><div class="metric-label">Lines</div></div>
      <div class="metric"><div class="metric-val" style="color:${cxColor}">${r.complexity}</div><div class="metric-label">Complexity</div></div>
      <div class="metric"><div class="metric-val" style="color:var(--red)">${r.issues.filter(i=>i.type==='critical').length}</div><div class="metric-label">Critical</div></div>
      <div class="metric"><div class="metric-val" style="color:var(--yellow)">${r.issues.filter(i=>i.type==='warning').length}</div><div class="metric-label">Warnings</div></div>
      <div class="metric"><div class="metric-val" style="color:var(--green)">${r.issues.filter(i=>i.type==='good').length}</div><div class="metric-label">Good</div></div>
    </div>
    <div class="complexity-row">
      <div class="cx-badge"><span class="cx-label">Time</span><span class="cx-val">${escHtml(r.time_complexity || 'N/A')}</span></div>
      <div class="cx-badge"><span class="cx-label">Space</span><span class="cx-val">${escHtml(r.space_complexity || 'N/A')}</span></div>
      <div class="cx-badge"><span class="cx-label">Error</span><span class="cx-val" style="color:${r.has_error ? 'var(--red)' : 'var(--green)'}">${r.has_error ? 'Yes' : 'None'}</span></div>
    </div>
    ${errorSection}
    <div class="issues-list">${issuesHtml}</div>
    <div class="summary-box"><strong>Summary: </strong>${escHtml(r.summary)}</div>
    ${r.optimized_code ? `<div class="code-section"><div class="code-section-title" style="color:var(--accent2)"><span>⚡</span> Optimized Code</div><div class="code-block">${escHtml(r.optimized_code)}</div></div>` : ''}`;
}

async function saveToDb() {
  if (!currentReview) return;
  const btn = document.getElementById('save-db-btn');
  btn.disabled = true; btn.textContent = 'Saving...';
  try {
    const res  = await fetch(CONFIG.BACKEND_URL + '/reviews', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...currentReview, code_snippet: currentCode.slice(0, 200) })
    });
    const data = await res.json();
    if (data.success) {
      btn.textContent = '✔ Saved!'; btn.style.color = 'var(--green)';
      savedCount++; document.getElementById('s-saved').textContent = savedCount;
      setTimeout(() => { btn.textContent = '↑ Save to MongoDB'; btn.style.color = ''; btn.disabled = false; }, 2000);
    } else throw new Error(data.message);
  } catch (err) {
    btn.textContent = 'Save Failed'; btn.style.color = 'var(--red)';
    setTimeout(() => { btn.textContent = '↑ Save to MongoDB'; btn.style.color = ''; btn.disabled = false; }, 2000);
  }
}

async function loadDbReviews() {
  const listEl = document.getElementById('db-list');
  listEl.innerHTML = '<div class="hist-empty">Loading from MongoDB...</div>';
  try {
    const statsRes  = await fetch(CONFIG.BACKEND_URL + '/stats');
    const statsData = await statsRes.json();
    if (statsData.success) {
      document.getElementById('db-total').textContent  = statsData.total;
      document.getElementById('db-avg').textContent    = statsData.avgScore || '—';
      document.getElementById('db-errors').textContent = statsData.errors;
    }
    const res  = await fetch(CONFIG.BACKEND_URL + '/reviews');
    const data = await res.json();
    if (!data.success || !data.reviews.length) {
      listEl.innerHTML = '<div class="hist-empty">No reviews saved yet. Run a review and click "Save to MongoDB".</div>';
      return;
    }
    listEl.innerHTML = data.reviews.map(r => {
      const sc      = r.score;
      const scColor = sc >= 75 ? 'var(--green)' : sc >= 50 ? 'var(--yellow)' : 'var(--red)';
      const date    = new Date(r.createdAt).toLocaleString();
      return `<div class="db-item">
        <div>
          <div style="margin-bottom:6px"><span class="hist-lang">${escHtml(r.language)}</span><span class="hist-meta">${escHtml((r.summary||'').slice(0,55))}...</span></div>
          <div class="hist-tags">
            ${r.has_error ? `<span class="hist-tag" style="background:rgba(248,113,113,.15);color:var(--red)">has error</span>` : ''}
            <span class="hist-tag" style="background:rgba(124,106,255,.15);color:var(--accent2)">${r.lines} lines</span>
            <span class="hist-tag" style="background:var(--bg3);color:var(--text3)">${r.complexity}</span>
          </div>
          <div class="hist-preview">${escHtml((r.code_snippet||'').replace(/\n/g,' '))}</div>
          <div style="font-size:10px;color:var(--text3);font-family:var(--mono);margin-top:6px">${date}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
          <div class="hist-score" style="color:${scColor}">${sc}</div>
          <button class="db-delete-btn" onclick="deleteDbReview('${r._id}')">Delete</button>
        </div>
      </div>`;
    }).join('');
  } catch (err) {
    listEl.innerHTML = `<div class="error-box"><div class="err-title">Cannot connect to backend</div>Make sure server is running:<br><strong>node server.js</strong><br><br>Error: ${escHtml(err.message)}</div>`;
  }
}

async function deleteDbReview(id) {
  if (!confirm('Delete this review?')) return;
  try { await fetch(CONFIG.BACKEND_URL + '/reviews/' + id, { method: 'DELETE' }); loadDbReviews(); }
  catch (err) { alert('Delete failed: ' + err.message); }
}

async function deleteAllDb() {
  if (!confirm('Delete ALL reviews from MongoDB? This cannot be undone.')) return;
  try { await fetch(CONFIG.BACKEND_URL + '/reviews', { method: 'DELETE' }); loadDbReviews(); }
  catch (err) { alert('Delete failed: ' + err.message); }
}

function updateSessionStats(r) {
  totalReviewed++;
  if (r.has_error) totalErrors++;
  scoreSum += r.score;
  document.getElementById('s-total').textContent  = totalReviewed;
  document.getElementById('s-errors').textContent = totalErrors;
  document.getElementById('s-avg').textContent    = Math.round(scoreSum / totalReviewed);
}

function pushSessionHistory(code, lang, review) {
  sessionHistory.unshift({ id: Date.now(), code, lang, review, ts: new Date().toLocaleTimeString() });
  renderSessionHistory();
}

function renderSessionHistory() {
  const el = document.getElementById('hist-list');
  if (!sessionHistory.length) { el.innerHTML = '<div class="hist-empty">No reviews yet — go review some code!</div>'; return; }
  el.innerHTML = sessionHistory.map(h => {
    const sc      = h.review.score;
    const scColor = sc >= 75 ? 'var(--green)' : sc >= 50 ? 'var(--yellow)' : 'var(--red)';
    const crit    = h.review.issues.filter(i => i.type === 'critical').length;
    const warn    = h.review.issues.filter(i => i.type === 'warning').length;
    const tags = [
      h.review.has_error ? `<span class="hist-tag" style="background:rgba(248,113,113,.15);color:var(--red)">has error</span>` : '',
      crit ? `<span class="hist-tag" style="background:rgba(248,113,113,.15);color:var(--red)">${crit} critical</span>` : '',
      warn ? `<span class="hist-tag" style="background:rgba(251,191,36,.15);color:var(--yellow)">${warn} warnings</span>` : '',
      `<span class="hist-tag" style="background:rgba(124,106,255,.15);color:var(--accent2)">${h.review.lines} lines</span>`
    ].filter(Boolean).join('');
    return `<div class="hist-item" onclick="restoreSession(${h.id})">
      <div>
        <div><span class="hist-lang">${escHtml(h.review.language)}</span><span class="hist-meta">${escHtml((h.review.summary||'').slice(0,55))}...</span></div>
        <div class="hist-tags">${tags}</div>
        <div class="hist-preview">${escHtml(h.code.slice(0,80).replace(/\n/g,' '))}</div>
      </div>
      <div class="hist-right"><div class="hist-score" style="color:${scColor}">${sc}</div><div class="hist-time">${h.ts}</div></div>
    </div>`;
  }).join('');
}

function restoreSession(id) {
  const h = sessionHistory.find(x => x.id === id);
  if (!h) return;
  document.getElementById('code-in').value  = h.code;
  document.getElementById('lang-sel').value = h.lang;
  onCodeInput();
  currentReview = h.review; currentCode = h.code;
  renderReview(h.review);
  setStatus('DONE', 'var(--green)');
  showPage('reviewer');
}

function clearHistory() {
  if (!sessionHistory.length) return;
  if (confirm('Clear session history?')) { sessionHistory = []; renderSessionHistory(); }
}

function copyReport() {
  if (!currentReview) return;
  const r = currentReview;
  const lines = [
    '=== CodeScan AI Report ===',
    `Language: ${r.language} | Score: ${r.score}/100 | Complexity: ${r.complexity}`,
    `Time: ${r.time_complexity} | Space: ${r.space_complexity} | Error: ${r.has_error ? 'Yes' : 'No'}`,
    '', 'ISSUES:',
    ...r.issues.map(i => `[${i.type.toUpperCase()}] ${i.title}\n  ${i.body}${i.fix ? '\n  Fix: ' + i.fix : ''}`),
    '', `SUMMARY: ${r.summary}`
  ];
  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    const btn = document.querySelector('.copy-btn');
    if (btn) { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy Report', 2000); }
  });
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
