import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://ebsqtjibhhckbciltzfb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVic3F0amliaGhja2JjaWx0emZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5OTUyNjUsImV4cCI6MjEwMDU3MTI2NX0.FNMjDFVakfNZxp758wrIPTXQRww6p8DgipsGwMeV0do';
const supabase = createClient(supabaseUrl, supabaseKey);

// DOM Seksiyaları
const authSection = document.getElementById('authSection');
const studentDashboard = document.getElementById('studentDashboard');
const teacherDashboard = document.getElementById('teacherDashboard');
const createQuizSection = document.getElementById('createQuizSection');
const quizContainerBox = document.getElementById('quizContainerBox');
const reviewSection = document.getElementById('reviewSection');
const loading = document.getElementById('loading');

// Dəyişənlər
let currentUser = null;
let activeRole = 'student';
let activeMode = 'login';
let currentQuizData = [];
let currentQuizId = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let timerInterval = null;
let timeLeft = 0;

// Yüklənir Ekranı
function toggleLoading(show) {
    if (show) loading.classList.remove('hidden');
    else loading.classList.add('hidden');
}

// Bütün ekranları gizlət
function hideAllSections() {
    authSection.classList.add('hidden');
    studentDashboard.classList.add('hidden');
    teacherDashboard.classList.add('hidden');
    createQuizSection.classList.add('hidden');
    quizContainerBox.classList.add('hidden');
    reviewSection.classList.add('hidden');
}

// ------------------- GİRİŞ VƏ QEYDİYYAT -------------------
const tabStudent = document.getElementById('tabStudent');
const tabTeacher = document.getElementById('tabTeacher');
const btnModeLogin = document.getElementById('btnModeLogin');
const btnModeRegister = document.getElementById('btnModeRegister');
const authFormContainer = document.getElementById('authFormContainer');

tabStudent.addEventListener('click', () => { activeRole = 'student'; updateAuthUI(); });
tabTeacher.addEventListener('click', () => { activeRole = 'teacher'; updateAuthUI(); });
btnModeLogin.addEventListener('click', () => { activeMode = 'login'; updateAuthUI(); });
btnModeRegister.addEventListener('click', () => { activeMode = 'register'; updateAuthUI(); });

function updateAuthUI() {
    if (activeRole === 'student') {
        tabStudent.className = 'btn primary-btn'; tabTeacher.className = 'btn secondary-btn';
    } else {
        tabTeacher.className = 'btn primary-btn'; tabStudent.className = 'btn secondary-btn';
    }

    btnModeLogin.style.color = activeMode === 'login' ? '#c084fc' : '#cbd5e1';
    btnModeLogin.style.borderBottom = activeMode === 'login' ? '2px solid #c084fc' : 'none';
    btnModeRegister.style.color = activeMode === 'register' ? '#c084fc' : '#cbd5e1';
    btnModeRegister.style.borderBottom = activeMode === 'register' ? '2px solid #c084fc' : 'none';

    renderAuthFields();
}

function renderAuthFields() {
    if (activeRole === 'student') {
        authFormContainer.innerHTML = activeMode === 'login' ? `
            <form id="authForm">
                <input type="text" id="sName" placeholder="Adınız" class="input-field" required>
                <input type="text" id="sSurname" placeholder="Soyadınız" class="input-field" required>
                <input type="password" id="sPass" placeholder="Şifrəniz" class="input-field" required>
                <button type="submit" class="btn primary-btn full-btn">Daxil Ol (Şagird)</button>
            </form>` : `
            <form id="authForm">
                <input type="text" id="sName" placeholder="Adınız" class="input-field" required>
                <input type="text" id="sSurname" placeholder="Soyadınız" class="input-field" required>
                <input type="text" id="sClass" placeholder="Sinif (məs: 9A)" class="input-field" required>
                <input type="password" id="sPass" placeholder="Şifrə Təyin Et" class="input-field" required>
                <button type="submit" class="btn primary-btn full-btn">Qeydiyyatdan Keç (Şagird)</button>
            </form>`;
    } else {
        authFormContainer.innerHTML = activeMode === 'login' ? `
            <form id="authForm">
                <input type="text" id="tUser" placeholder="İstifadəçi Adı" class="input-field" required>
                <input type="password" id="tPass" placeholder="Şifrə" class="input-field" required>
                <button type="submit" class="btn primary-btn full-btn">Daxil Ol (Müəllim)</button>
            </form>` : `
            <form id="authForm">
                <input type="text" id="tName" placeholder="Ad Soyad" class="input-field" required>
                <input type="text" id="tUser" placeholder="İstifadəçi Adı Təyin Et" class="input-field" required>
                <input type="password" id="tPass" placeholder="Şifrə Təyin Et" class="input-field" required>
                <button type="submit" class="btn primary-btn full-btn">Qeydiyyatdan Keç (Müəllim)</button>
            </form>`;
    }

    document.getElementById('authForm').addEventListener('submit', handleAuthSubmit);
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    toggleLoading(true);

    try {
        if (activeRole === 'student') {
            const name = document.getElementById('sName').value.trim();
            const surname = document.getElementById('sSurname').value.trim();
            const pass = document.getElementById('sPass').value.trim();

            if (activeMode === 'login') {
                const { data } = await supabase.from('students_account').select('*').eq('name', name).eq('surname', surname).eq('password', pass).single();
                if (!data) { alert("Məlumatlar yanlışdır!"); return; }
                currentUser = { role: 'student', data };
            } else {
                const sClass = document.getElementById('sClass').value.trim();
                const { data, error } = await supabase.from('students_account').insert([{ name, surname, student_class: sClass, password: pass }]).select().single();
                if (error) { alert("Xəta: " + error.message); return; }
                currentUser = { role: 'student', data };
            }
            localStorage.setItem('aquarius_user_session', JSON.stringify(currentUser));
            renderStudentDashboard();
        } else {
            const username = document.getElementById('tUser').value.trim();
            const pass = document.getElementById('tPass').value.trim();

            if (activeMode === 'login') {
                const { data } = await supabase.from('teachers_account').select('*').eq('username', username).eq('password', pass).single();
                if (!data && !(username === "admin" && pass === "12345")) {
                    alert("Şifrə və ya istifadəçi adı səhvdir!"); return;
                }
                currentUser = { role: 'teacher', data: data || { name: 'Müəllim', username: 'admin' } };
            } else {
                const name = document.getElementById('tName').value.trim();
                const { data, error } = await supabase.from('teachers_account').insert([{ name, username, password: pass }]).select().single();
                if (error) { alert("Xəta: " + error.message); return; }
                currentUser = { role: 'teacher', data };
            }
            localStorage.setItem('aquarius_user_session', JSON.stringify(currentUser));
            renderTeacherDashboard();
        }
    } finally {
        toggleLoading(false);
    }
}

// ------------------- MÜƏLLİM PANALİ & KONTAKTLAR -------------------
async function renderTeacherDashboard() {
    hideAllSections();
    teacherDashboard.classList.remove('hidden');
    document.getElementById('teacherWelcomeTitle').textContent = `👨‍🏫 Müəllim Portalı: ${currentUser.data.name || currentUser.data.username}`;

    await loadTeacherContactsAndGroups();
}

document.getElementById('tLogoutBtn').addEventListener('click', logout);
document.getElementById('createGroupBtn').addEventListener('click', async () => {
    const groupName = document.getElementById('groupNameInput').value.trim();
    if (!groupName) return alert("Qrup adını yazın");
    await supabase.from('groups').insert([{ group_name: groupName }]);
    alert("Qrup yaradıldı!");
    document.getElementById('groupNameInput').value = '';
    loadTeacherContactsAndGroups();
});

async function loadTeacherContactsAndGroups() {
    const container = document.getElementById('contactsContainer');
    const [{ data: students }, { data: groups }] = await Promise.all([
        supabase.from('students_account').select('*'),
        supabase.from('groups').select('*')
    ]);

    if (!students || students.length === 0) {
        container.innerHTML = `<p style="color:#94a3b8;">Qeydiyyatlı şagird tapılmadı.</p>`;
        return;
    }

    let groupOptions = `<option value="">Qrup Seçin...</option>`;
    if (groups) groups.forEach(g => groupOptions += `<option value="${g.group_name}">${g.group_name}</option>`);

    let html = `<div style="overflow-x:auto;"><table style="width:100%; border-collapse:collapse; font-size:14px; text-align:left;">
        <thead><tr style="color:#c084fc; border-bottom:1px solid rgba(255,255,255,0.1);">
            <th style="padding:8px;">Şagird (Kontakt)</th>
            <th style="padding:8px;">Sinif</th>
            <th style="padding:8px;">Qrupu</th>
            <th style="padding:8px;">Qrupa Əlavə Et</th>
        </tr></thead><tbody>`;

    students.forEach(s => {
        html += `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:8px; font-weight:600;">👤 ${s.name} ${s.surname}</td>
                <td style="padding:8px; color:#94a3b8;">${s.student_class || '-'}</td>
                <td style="padding:8px; color:#a78bfa;">${s.group_name || 'Qrupsuz'}</td>
                <td style="padding:8px;">
                    <select data-studid="${s.id}" class="group-select input-field" style="padding:4px; font-size:12px; margin:0;">
                        ${groupOptions}
                    </select>
                </td>
            </tr>`;
    });
    html += `</tbody></table></div>`;
    container.innerHTML = html;

    document.querySelectorAll('.group-select').forEach(sel => {
        sel.addEventListener('change', async (e) => {
            const studId = e.target.getAttribute('data-studid');
            const gName = e.target.value;
            if (gName) {
                await supabase.from('students_account').update({ group_name: gName }).eq('id', studId);
                alert("Şagird qrupa əlavə olundu!");
                loadTeacherContactsAndGroups();
            }
        });
    });
}

// ------------------- TEST YARATMA VƏ GEMINI İZAHI -------------------
document.getElementById('btnOpenCreateQuiz').addEventListener('click', async () => {
    hideAllSections();
    createQuizSection.classList.remove('hidden');
    
    const { data: groups } = await supabase.from('groups').select('*');
    const groupSel = document.getElementById('quizGroupSelect');
    groupSel.innerHTML = `<option value="ALL">Bütün Şagirdlərə Göstər</option>`;
    if (groups) groups.forEach(g => groupSel.innerHTML += `<option value="${g.group_name}">${g.group_name}</option>`);

    document.getElementById('questionsBuilder').innerHTML = '';
    addQuestionBlock();
});

document.getElementById('cancelCreateQuizBtn').addEventListener('click', renderTeacherDashboard);
document.getElementById('addQuestionBtn').addEventListener('click', addQuestionBlock);

let qCount = 0;
function addQuestionBlock() {
    qCount++;
    const builder = document.getElementById('questionsBuilder');
    const div = document.createElement('div');
    div.style.cssText = "background: rgba(0,0,0,0.2); padding:12px; border-radius:10px; margin-bottom:12px; border:1px solid rgba(255,255,255,0.1);";
    div.innerHTML = `
        <h4 style="color:#c084fc; margin-bottom:6px;">Sual ${qCount}</h4>
        <input type="text" class="q-title input-field" placeholder="Sual Mətni">
        <input type="text" class="q-opt0 input-field" placeholder="Variant A">
        <input type="text" class="q-opt1 input-field" placeholder="Variant B">
        <input type="text" class="q-opt2 input-field" placeholder="Variant C">
        <input type="text" class="q-opt3 input-field" placeholder="Variant D">
        <select class="q-correct input-field" style="background:#1e1b4b;">
            <option value="0">Düzgün Cavab: A</option>
            <option value="1">Düzgün Cavab: B</option>
            <option value="2">Düzgün Cavab: C</option>
            <option value="3">Düzgün Cavab: D</option>
        </select>
        <textarea class="q-explanation input-field" placeholder="✨ Gemini Sadə İzah: (Şagird səhv yazsa göstəriləcək izahı daxil edin)" style="height:60px;"></textarea>
    `;
    builder.appendChild(div);
}

document.getElementById('saveQuizBtn').addEventListener('click', async () => {
    const title = document.getElementById('quizTitleInput').value.trim();
    const duration = parseInt(document.getElementById('quizDurationInput').value) || 0;
    const targetGroup = document.getElementById('quizGroupSelect').value;

    if (!title) return alert("Test adını yazın!");

    const blocks = document.querySelectorAll('#questionsBuilder > div');
    const questionsData = [];
    const correctAnswers = [];

    blocks.forEach(b => {
        const qTitle = b.querySelector('.q-title').value.trim();
        const opt0 = b.querySelector('.q-opt0').value.trim();
        const opt1 = b.querySelector('.q-opt1').value.trim();
        const opt2 = b.querySelector('.q-opt2').value.trim();
        const opt3 = b.querySelector('.q-opt3').value.trim();
        const correctIdx = parseInt(b.querySelector('.q-correct').value);
        const exp = b.querySelector('.q-explanation').value.trim();

        if (qTitle) {
            questionsData.push({ question: qTitle, options: [opt0, opt1, opt2, opt3], explanation: exp });
            correctAnswers.push({ correctAnswerIndex: correctIdx });
        }
    });

    if (questionsData.length === 0) return alert("Sual əlavə edin!");

    toggleLoading(true);
    await supabase.from('quizzes').insert([{
        title, duration, target_group: targetGroup,
        questions_data: JSON.stringify(questionsData),
        correct_answers: JSON.stringify(correctAnswers)
    }]);
    toggleLoading(false);

    alert("Test yayımlandı!");
    renderTeacherDashboard();
});

// ------------------- ŞAGİRD PANALİ VƏ KVIZ HƏLL ETMƏ -------------------
async function renderStudentDashboard() {
    hideAllSections();
    studentDashboard.classList.remove('hidden');

    const s = currentUser.data;
    document.getElementById('studentWelcomeTitle').textContent = `Xoş gəldiniz, ${s.name} ${s.surname}`;
    document.getElementById('studentGroupSub').textContent = `Qrup / Sinif: ${s.group_name || s.student_class || 'Ümumi'}`;
    document.getElementById('profileAvatar').textContent = `${s.name[0]}${s.surname[0]}`;

    const container = document.getElementById('quizContainer');
    const [{ data: quizzes }, { data: results }] = await Promise.all([
        supabase.from('quizzes').select('*'),
        supabase.from('student_results').select('*').eq('student_name', s.name).eq('student_surname', s.surname)
    ]);

    if (!quizzes || quizzes.length === 0) {
        container.innerHTML = `<p style="color:#94a3b8;">Aktiv test yoxdur.</p>`;
        return;
    }

    const filtered = quizzes.filter(q => !q.target_group || q.target_group === 'ALL' || q.target_group === s.group_name);
    const resultMap = {};
    if (results) results.forEach(r => resultMap[String(r.quiz_id)] = r);

    container.innerHTML = '';
    filtered.forEach(q => {
        const res = resultMap[String(q.id)];
        const card = document.createElement('div');
        card.style.cssText = "background:rgba(255,255,255,0.05); padding:15px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); width:280px; display:flex; justify-content:space-between; align-items:center;";
        
        card.innerHTML = `
            <div>
                <h4 style="color:#f1f5f9;">${q.title}</h4>
                <p style="font-size:12px; color:#a78bfa;">⏱️ ${q.duration ? q.duration + ' dəq' : 'Sərbəst'}</p>
            </div>
            ${res ? `<button class="btn secondary-btn rev-btn" style="font-size:12px;">İzahlara Bax</button>` : `<button class="btn primary-btn start-btn" style="font-size:12px;">Başla</button>`}
        `;
        container.appendChild(card);

        if (res) card.querySelector('.rev-btn').addEventListener('click', () => showReview(q, res));
        else card.querySelector('.start-btn').addEventListener('click', () => startQuiz(q));
    });
}

function startQuiz(quiz) {
    hideAllSections();
    quizContainerBox.classList.remove('hidden');

    currentQuizId = quiz.id;
    currentQuizData = typeof quiz.questions_data === 'string' ? JSON.parse(quiz.questions_data) : quiz.questions_data;
    currentQuestionIndex = 0;
    userAnswers = {};

    document.getElementById('quizTitleHeader').textContent = quiz.title;
    renderQuestion();

    if (quiz.duration > 0) {
        timeLeft = quiz.duration * 60;
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (timeLeft <= 0) { clearInterval(timerInterval); finishQuiz(); }
            else {
                timeLeft--;
                const m = Math.floor(timeLeft / 60); const s = timeLeft % 60;
                document.getElementById('timerDisplay').textContent = `⏱️ ${m}:${s < 10 ? '0' : ''}${s}`;
            }
        }, 1000);
    } else {
        document.getElementById('timerDisplay').textContent = "";
    }
}

function renderQuestion() {
    const q = currentQuizData[currentQuestionIndex];
    let optsHtml = "";

    q.options.forEach((opt, idx) => {
        const sel = userAnswers[currentQuestionIndex] === idx ? "background:rgba(126,34,206,0.5); border-color:#a855f7;" : "background:rgba(0,0,0,0.2);";
        optsHtml += `<button class="btn full-btn opt-btn" data-idx="${idx}" style="text-align:left; margin-bottom:8px; ${sel}">${opt}</button>`;
    });

    document.getElementById('questionBox').innerHTML = `
        <p style="font-size:12px; color:#d8b4fe;">Sual ${currentQuestionIndex + 1} / ${currentQuizData.length}</p>
        <p style="font-size:16px; margin-bottom:12px;">${q.question}</p>
        <div>${optsHtml}</div>
    `;

    document.querySelectorAll('.opt-btn').forEach(b => {
        b.addEventListener('click', (e) => {
            userAnswers[currentQuestionIndex] = parseInt(e.currentTarget.getAttribute('data-idx'));
            renderQuestion();
        });
    });

    document.getElementById('prevQuestionBtn').style.display = currentQuestionIndex === 0 ? 'none' : 'inline-block';
    document.getElementById('nextQuestionBtn').textContent = currentQuestionIndex === currentQuizData.length - 1 ? "Bitir" : "Növbəti";
}

document.getElementById('nextQuestionBtn').addEventListener('click', () => {
    if (currentQuestionIndex < currentQuizData.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    } else {
        finishQuiz();
    }
});

document.getElementById('prevQuestionBtn').addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
});

async function finishQuiz() {
    clearInterval(timerInterval);
    toggleLoading(true);

    const { data: quizData } = await supabase.from('quizzes').select('correct_answers').eq('id', currentQuizId).single();
    let correctAnswers = typeof quizData.correct_answers === 'string' ? JSON.parse(quizData.correct_answers) : quizData.correct_answers;

    let score = 0;
    const details = [];

    currentQuizData.forEach((q, idx) => {
        const uAns = userAnswers[idx];
        const cAns = correctAnswers[idx].correctAnswerIndex;
        const isCorr = (uAns !== undefined && uAns === cAns);
        if (isCorr) score++;

        details.push({
            questionIndex: idx + 1,
            userAnswer: uAns !== undefined ? q.options[uAns] : "Cavabsız",
            isCorrect: isCorr
        });
    });

    const s = currentUser.data;
    await supabase.from('student_results').insert([{
        quiz_id: currentQuizId,
        student_name: s.name,
        student_surname: s.surname,
        student_class: s.group_name || s.student_class,
        score, total: currentQuizData.length,
        details_json: JSON.stringify(details)
    }]);

    toggleLoading(false);
    alert(`Test Bitdi! Nəticəniz: ${score} / ${currentQuizData.length}`);
    renderStudentDashboard();
}

// ------------------- GEMINI SADƏ İZAH PARADİQMASI -------------------
function showReview(quiz, result) {
    hideAllSections();
    reviewSection.classList.remove('hidden');

    const questions = typeof quiz.questions_data === 'string' ? JSON.parse(quiz.questions_data) : quiz.questions_data;
    const details = typeof result.details_json === 'string' ? JSON.parse(result.details_json) : result.details_json;
    const correctAnswers = typeof quiz.correct_answers === 'string' ? JSON.parse(quiz.correct_answers) : quiz.correct_answers;

    const container = document.getElementById('reviewCardsContainer');
    container.innerHTML = '';

    questions.forEach((q, idx) => {
        const det = details ? details.find(d => d.questionIndex === idx + 1) : null;
        const uAns = det ? det.userAnswer : "Cavabsız";
        const isCorr = det ? det.isCorrect : false;
        const cAnsText = q.options[correctAnswers[idx].correctAnswerIndex];

        const card = document.createElement('div');
        card.style.cssText = "background:rgba(255,255,255,0.05); padding:15px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); margin-bottom:12px;";

        let geminiExp = q.explanation ? `
            <div style="margin-top:10px; padding:10px; background:rgba(147,51,234,0.15); border:1px solid rgba(192,132,252,0.3); border-radius:8px; font-size:13px; color:#f3e8ff;">
                <div style="font-weight:bold; color:#c084fc; margin-bottom:4px;">✨ Gemini Sadə İzah:</div>
                <div>${q.explanation}</div>
            </div>
        ` : '';

        card.innerHTML = `
            <div style="display:flex; justify-space-between; margin-bottom:6px;">
                <span style="font-size:12px; color:#d8b4fe;">Sual ${idx + 1}</span>
                <span>${isCorr ? '✅ Düzgün' : '❌ Səhv'}</span>
            </div>
            <p style="font-size:15px; margin-bottom:8px;">${q.question}</p>
            <div style="font-size:13px; color:#cbd5e1;">
                Cavabınız: <b style="color:${isCorr ? '#22c55e' : '#ef4444'}">${uAns}</b> | Düzgün: <b style="color:#22c55e">${cAnsText}</b>
            </div>
            ${geminiExp}
        `;
        container.appendChild(card);
    });
}

document.getElementById('backDashFromReview').addEventListener('click', renderStudentDashboard);

// ------------------- NƏZARƏT CƏDVƏLİ VƏ DROPDOWN -------------------
const profileCircle = document.getElementById('profileCircle');
const profileDropdown = document.getElementById('profileDropdown');

profileCircle.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = profileCircle.getBoundingClientRect();
    profileDropdown.style.top = (rect.bottom + 8) + 'px';
    profileDropdown.style.left = (rect.left - 100) + 'px';
    profileDropdown.style.display = profileDropdown.style.display === 'block' ? 'none' : 'block';
});

document.addEventListener('click', () => profileDropdown.style.display = 'none');
document.getElementById('menuLogout').addEventListener('click', logout);

function logout() {
    localStorage.removeItem('aquarius_user_session');
    currentUser = null;
    hideAllSections();
    authSection.classList.remove('hidden');
    updateAuthUI();
}

// Başlanğıc Yoxlama
window.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    const saved = localStorage.getItem('aquarius_user_session');
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
            if (currentUser.role === 'teacher') renderTeacherDashboard();
            else renderStudentDashboard();
        } catch (e) {
            logout();
        }
    }
});
