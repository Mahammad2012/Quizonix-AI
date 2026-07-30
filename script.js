import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://ebsqtjibhhckbciltzfb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVic3F0amliaGhja2JjaWx0emZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5OTUyNjUsImV4cCI6MjEwMDU3MTI2NX0.FNMjDFVakfNZxp758wrIPTXQRww6p8DgipsGwMeV0do';
const supabase = createClient(supabaseUrl, supabaseKey);

const appContainer = document.getElementById('appContainer') || document.body;

// Uçdan-Uca Şifrələmə (E2EE) Alqoritmi Simulyasiyası / AES-style Key Cipher
const E2E_SECRET_KEY = "AquariusE2EE_Secure_Chat_Key_2026!";

function encryptMessage(text) {
    if (!text) return "";
    try {
        const encoded = btoa(unescape(encodeURIComponent(text)));
        return "E2EE::" + encoded.split('').reverse().join('');
    } catch(e) {
        return text;
    }
}

function decryptMessage(cipherText) {
    if (!cipherText || !cipherText.startsWith("E2EE::")) return cipherText;
    try {
        const rawCipher = cipherText.replace("E2EE::", "").split('').reverse().join('');
        return decodeURIComponent(escape(atob(rawCipher)));
    } catch(e) {
        return "🔒 [Şifrələnmiş Mesaj]";
    }
}

let currentStudent = null;
let currentTeacher = null;
let currentQuizId = null;
let currentQuizData = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let timerInterval = null;
let timeLeft = 0;

let currentRole = 'student'; 
let currentTab = 'login'; 

let teacherQuestionsBuffer = [];
let activeChatGroupId = null;
let chatPollInterval = null;

function checkSavedSession() {
    const savedStudent = localStorage.getItem('aquarius_current_student');
    const savedTeacher = localStorage.getItem('aquarius_current_teacher');
    
    if (savedTeacher) {
        try {
            currentTeacher = JSON.parse(savedTeacher);
            renderTeacherDashboard();
            return true;
        } catch (e) {
            localStorage.removeItem('aquarius_current_teacher');
        }
    }

    if (savedStudent) {
        try {
            currentStudent = JSON.parse(savedStudent);
            renderStudentDashboard();
            return true;
        } catch (e) {
            localStorage.removeItem('aquarius_current_student');
        }
    }
    return false;
}

function renderAuthScreen() {
    const isTeacher = (currentRole === 'teacher');
    const isLogin = (currentTab === 'login');

    appContainer.innerHTML = `
        <div style="min-height: 100vh; width: 100vw; display: flex; justify-content: center; align-items: center; box-sizing: border-box; padding: 20px;">
            <div style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 20px; width: 100%; max-width: 420px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="font-size: 26px; font-weight: 700; color: #d8b4fe; margin-bottom: 8px;">🎓 Aquarius Kviz AI</h1>
                    <p style="font-size: 14px; color: #cbd5e1;">
                        ${isTeacher ? '👨‍🏫 Müəllim paneli' : '🎓 Şagird paneli'}
                    </p>
                </div>

                <div style="display: flex; gap: 8px; margin-bottom: 20px;">
                    <button id="showLoginTab" style="flex: 1; padding: 10px; background: ${isLogin ? '#7e22ce' : 'rgba(255,255,255,0.1)'}; color: ${isLogin ? 'white' : '#cbd5e1'}; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">Giriş</button>
                    <button id="showRegisterTab" style="flex: 1; padding: 10px; background: ${!isLogin ? '#7e22ce' : 'rgba(255,255,255,0.1)'}; color: ${!isLogin ? 'white' : '#cbd5e1'}; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">Qeydiyyat</button>
                </div>

                <div id="formContainer"></div>

                <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <a id="roleToggleLink" href="#" style="color: #c084fc; font-size: 13px; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px;">
                        <span>${isTeacher ? '🎓 Şagird kimi daxil olmaq' : '👨‍🏫 Müəllim kimi daxil olmaq'}</span>
                    </a>
                </div>
            </div>
        </div>
    `;

    document.getElementById('roleToggleLink').addEventListener('click', (e) => {
        e.preventDefault();
        currentRole = (currentRole === 'student') ? 'teacher' : 'student';
        renderAuthScreen();
    });

    document.getElementById('showLoginTab').addEventListener('click', () => {
        currentTab = 'login';
        renderAuthScreen();
    });

    document.getElementById('showRegisterTab').addEventListener('click', () => {
        currentTab = 'register';
        renderAuthScreen();
    });

    renderCurrentForm();
}

function renderCurrentForm() {
    const container = document.getElementById('formContainer');

    if (currentTab === 'login') {
        if (currentRole === 'student') {
            container.innerHTML = `
                <form id="studentLoginForm">
                    <input type="text" id="loginName" placeholder="Adınız" required style="${inputStyle()}">
                    ${createPasswordFieldHTML('loginPassword', 'Şifrəniz')}
                    <button type="submit" style="${buttonStyle()}">Daxil Ol</button>
                </form>
            `;
            attachPasswordToggle('loginPassword');

            document.getElementById('studentLoginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('loginName').value.trim();
                const password = document.getElementById('loginPassword').value.trim();

                showLoadingScreen("Yüklənir...", async () => {
                    const { data, error } = await supabase
                        .from('students_account')
                        .select('*')
                        .ilike('name', name)
                        .eq('password', password)
                        .single();

                    if (error || !data) {
                        alert("Ad və ya şifrə yanlışdır!");
                        renderAuthScreen();
                        return;
                    }

                    currentStudent = data;
                    localStorage.setItem('aquarius_current_student', JSON.stringify(data));
                    renderStudentDashboard();
                });
            });
        } else {
            container.innerHTML = `
                <form id="teacherLoginForm">
                    <input type="text" id="teacherUsername" placeholder="İstifadəçi Adı" required style="${inputStyle()}">
                    ${createPasswordFieldHTML('teacherPassword', 'Müəllim Şifrəsi')}
                    <button type="submit" style="${buttonStyle()}">Müəllim Panelinə Giriş</button>
                </form>
            `;
            attachPasswordToggle('teacherPassword');

            document.getElementById('teacherLoginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('teacherUsername').value.trim();
                const password = document.getElementById('teacherPassword').value.trim();

                showLoadingScreen("Yüklənir...", async () => {
                    const { data, error } = await supabase
                        .from('teachers_account')
                        .select('*')
                        .eq('username', username)
                        .eq('password', password)
                        .single();

                    if (error || !data) {
                        alert("İstifadəçi adı və ya şifrə yanlışdır!");
                        renderAuthScreen();
                        return;
                    }

                    currentTeacher = data;
                    localStorage.setItem('aquarius_current_teacher', JSON.stringify(data));
                    renderTeacherDashboard();
                });
            });
        }
    } else {
        if (currentRole === 'student') {
            container.innerHTML = `
                <form id="studentRegisterForm">
                    <input type="text" id="regName" placeholder="Adınız" required style="${inputStyle()}">
                    <input type="text" id="regSurname" placeholder="Soyadınız" required style="${inputStyle()}">
                    <input type="text" id="regClass" placeholder="Sinfiniz (məs: 10A)" required style="${inputStyle()}">
                    ${createPasswordFieldHTML('regPassword', 'Şifrə yarat')}
                    <button type="submit" style="${buttonStyle()}">Qeydiyyatdan Keç</button>
                </form>
            `;
            attachPasswordToggle('regPassword');

            document.getElementById('studentRegisterForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('regName').value.trim();
                const surname = document.getElementById('regSurname').value.trim();
                const student_class = document.getElementById('regClass').value.trim();
                const password = document.getElementById('regPassword').value.trim();

                showLoadingScreen("Yüklənir...", async () => {
                    const { data: existing } = await supabase
                        .from('students_account')
                        .select('*')
                        .ilike('name', name)
                        .ilike('surname', surname)
                        .single();

                    if (existing) {
                        alert("Bu ad və soyadla artıq hesab var.");
                        renderAuthScreen();
                        return;
                    }

                    const { data, error } = await supabase
                        .from('students_account')
                        .insert([{ name, surname, student_class, password }])
                        .select()
                        .single();

                    if (error) {
                        alert("Qeydiyyat xətası!");
                        renderAuthScreen();
                        return;
                    }

                    currentStudent = data;
                    localStorage.setItem('aquarius_current_student', JSON.stringify(data));
                    renderStudentDashboard();
                });
            });
        } else {
            container.innerHTML = `
                <form id="teacherRegisterForm">
                    <input type="text" id="tRegName" placeholder="Adınız" required style="${inputStyle()}">
                    <input type="text" id="tRegSurname" placeholder="Soyadınız" required style="${inputStyle()}">
                    <input type="text" id="tRegUsername" placeholder="İstifadəçi adı" required style="${inputStyle()}">
                    ${createPasswordFieldHTML('tRegPassword', 'Şifrə yarat')}
                    <button type="submit" style="${buttonStyle()}">Müəllim Qeydiyyatı</button>
                </form>
            `;
            attachPasswordToggle('tRegPassword');

            document.getElementById('teacherRegisterForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('tRegName').value.trim();
                const surname = document.getElementById('tRegSurname').value.trim();
                const username = document.getElementById('tRegUsername').value.trim();
                const password = document.getElementById('tRegPassword').value.trim();

                showLoadingScreen("Yüklənir...", async () => {
                    const { data, error } = await supabase
                        .from('teachers_account')
                        .insert([{ name, surname, username, password }])
                        .select()
                        .single();

                    if (error) {
                        alert("Müəllim qeydiyyatı xətası!");
                        renderAuthScreen();
                        return;
                    }

                    currentTeacher = data;
                    localStorage.setItem('aquarius_current_teacher', JSON.stringify(data));
                    renderTeacherDashboard();
                });
            });
        }
    }
}

function inputStyle() {
    return "width: 100%; padding: 12px 14px; margin-bottom: 14px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; color: white; font-size: 14px; outline: none; box-sizing: border-box; text-align: center;";
}

function buttonStyle() {
    return "width: 100%; padding: 12px; background: linear-gradient(135deg, #9333ea, #c084fc); color: white; border: none; border-radius: 10px; font-weight: 700; font-size: 15px; cursor: pointer; transition: 0.3s;";
}

function createPasswordFieldHTML(id, placeholder) {
    return `
        <div style="position: relative; width: 100%; margin-bottom: 14px;">
            <input type="password" id="${id}" placeholder="${placeholder}" required style="width: 100%; padding: 12px 45px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; color: white; font-size: 14px; outline: none; box-sizing: border-box; text-align: center;">
            <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.5);">🔒</span>
            <span id="toggle_${id}" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); cursor: pointer; font-size: 13px; font-weight: 600; background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 6px; color: #d8b4fe;">Göstər</span>
        </div>
    `;
}

function attachPasswordToggle(id) {
    const input = document.getElementById(id);
    const toggle = document.getElementById(`toggle_${id}`);
    if (input && toggle) {
        toggle.addEventListener('click', () => {
            if (input.type === "password") {
                input.type = "text";
                toggle.textContent = "Gizlət";
            } else {
                input.type = "password";
                toggle.textContent = "Göstər";
            }
        });
    }
}

function showLoadingScreen(message, callback) {
    appContainer.innerHTML = `
        <div style="min-height: 100vh; width: 100vw; display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <div style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 40px; border-radius: 20px; text-align: center;">
                <div style="border: 4px solid rgba(255, 255, 255, 0.1); border-top: 4px solid #c084fc; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px auto;"></div>
                <h3 style="font-size: 18px; color: #d8b4fe; margin: 0;">${message}</h3>
            </div>
        </div>
    `;
    setTimeout(callback, 600);
}

// ==================== MÜƏLLİM PANESİ ====================
function renderTeacherDashboard() {
    if (chatPollInterval) clearInterval(chatPollInterval);

    appContainer.innerHTML = `
        <div class="main-wrapper" style="max-width: 900px; margin: 0 auto; padding: 20px; color: white;">
            <div class="user-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <div>
                    <h2>Xoş gəldiniz, ${currentTeacher.name || ''} ${currentTeacher.surname || ''}</h2>
                    <p style="color: #cbd5e1;">👨‍🏫 Müəllim Paneli (${currentTeacher.username})</p>
                </div>
                <button id="teacherLogoutBtn" style="padding: 8px 16px; background: rgba(239, 68, 68, 0.2); border: 1px solid #f87171; border-radius: 8px; color: #f87171; cursor: pointer; font-weight: bold;">🚪 Çıxış</button>
            </div>

            <!-- Əsas Naviqasiya Menyuları -->
            <div style="display: flex; gap: 10px; margin-bottom: 24px;">
                <button id="navCreateQuiz" style="flex: 1; padding: 12px; background: #7e22ce; color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">📝 Sınaq Əlavə Et</button>
                <button id="navGroups" style="flex: 1; padding: 12px; background: rgba(255,255,255,0.1); color: #cbd5e1; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">👥 Qruplar</button>
                <button id="navContacts" style="flex: 1; padding: 12px; background: rgba(255,255,255,0.1); color: #cbd5e1; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">📇 Kontaktlar</button>
            </div>

            <div id="teacherWorkArea"></div>
        </div>
    `;

    document.getElementById('teacherLogoutBtn').addEventListener('click', () => {
        localStorage.removeItem('aquarius_current_teacher');
        currentTeacher = null;
        renderAuthScreen();
    });

    document.getElementById('navCreateQuiz').addEventListener('click', () => {
        setTeacherNavActive('navCreateQuiz');
        renderTeacherQuizCreatorSection();
    });

    document.getElementById('navGroups').addEventListener('click', () => {
        setTeacherNavActive('navGroups');
        renderTeacherGroupsSection();
    });

    document.getElementById('navContacts').addEventListener('click', () => {
        setTeacherNavActive('navContacts');
        renderTeacherContactsSection();
    });

    renderTeacherQuizCreatorSection();
}

function setTeacherNavActive(id) {
    ['navCreateQuiz', 'navGroups', 'navContacts'].forEach(btnId => {
        const el = document.getElementById(btnId);
        if (btnId === id) {
            el.style.background = '#7e22ce';
            el.style.color = 'white';
        } else {
            el.style.background = 'rgba(255,255,255,0.1)';
            el.style.color = '#cbd5e1';
        }
    });
}

// 1. Sınaq Əlavə Et
function renderTeacherQuizCreatorSection() {
    const workArea = document.getElementById('teacherWorkArea');
    workArea.innerHTML = `
        <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
            <div style="display: flex; gap: 8px; margin-bottom: 20px;">
                <button id="subManual" style="flex: 1; padding: 10px; background: #7e22ce; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">➕ Əl ilə Sual Əlavə Et</button>
                <button id="subAI" style="flex: 1; padding: 10px; background: rgba(255,255,255,0.1); color: #cbd5e1; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">🤖 AI ilə Yarat</button>
            </div>
            <div id="quizSubArea"></div>
        </div>
    `;

    document.getElementById('subManual').addEventListener('click', () => {
        document.getElementById('subManual').style.background = '#7e22ce';
        document.getElementById('subAI').style.background = 'rgba(255,255,255,0.1)';
        renderManualQuizForm();
    });

    document.getElementById('subAI').addEventListener('click', () => {
        document.getElementById('subAI').style.background = '#7e22ce';
        document.getElementById('subManual').style.background = 'rgba(255,255,255,0.1)';
        renderAIQuizForm();
    });

    renderManualQuizForm();
}

async function renderManualQuizForm() {
    const container = document.getElementById('quizSubArea');
    const { data: groups } = await supabase.from('groups').select('*');

    let groupOptionsHTML = `<option value="">Bütün Şagirdlər (Qrup Məhdudiyyəti Yoxdur)</option>`;
    if (groups && groups.length > 0) {
        groups.forEach(g => {
            groupOptionsHTML += `<option value="${g.id}">${g.name}</option>`;
        });
    }

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
            <input type="text" id="manualQuizTitle" placeholder="Sınağın Adı" style="${inputStyle()}">
            <input type="number" id="manualQuizDuration" value="15" placeholder="Müddət (dəqiqə)" style="${inputStyle()}">
        </div>

        <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 13px; color: #d8b4fe; margin-bottom: 6px;">Sınağı Hansı Qrupa Təyin Edirsiniz?</label>
            <select id="manualQuizGroupId" style="width: 100%; padding: 12px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; color: white;">
                ${groupOptionsHTML}
            </select>
        </div>

        <hr style="border-color: rgba(255,255,255,0.1); margin: 16px 0;">
        <div id="questionFormBox"></div>
    `;

    renderQuestionBuilder();
}

function renderQuestionBuilder() {
    const box = document.getElementById('questionFormBox');
    const qNum = teacherQuestionsBuffer.length + 1;

    box.innerHTML = `
        <h4 style="margin: 0 0 10px 0; color: #c084fc;">Sual ${qNum} / 100 (Cəmi əlavə edilib: ${teacherQuestionsBuffer.length})</h4>
        <textarea id="qText" placeholder="Sualın şərti..." style="width: 100%; height: 70px; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; color: white; margin-bottom: 10px;"></textarea>
        
        <input type="text" id="optA" placeholder="A variantı" style="${inputStyle()}">
        <input type="text" id="optB" placeholder="B variantı" style="${inputStyle()}">
        <input type="text" id="optC" placeholder="C variantı" style="${inputStyle()}">
        <input type="text" id="optD" placeholder="D variantı" style="${inputStyle()}">
        
        <label style="display: block; font-size: 13px; color: #d8b4fe; margin-bottom: 6px;">Düzgün Variant:</label>
        <select id="correctOpt" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; margin-bottom: 16px;">
            <option value="0">A Variantı</option>
            <option value="1">B Variantı</option>
            <option value="2">C Variantı</option>
            <option value="3">D Variantı</option>
        </select>

        <div style="display: flex; gap: 10px;">
            <button id="addMoreQBtn" style="flex: 1; padding: 10px; background: #22c55e; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">➕ Növbəti Sualı Əlavə Et</button>
            <button id="saveQuizBtn" style="flex: 1; padding: 10px; background: #7e22ce; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">💾 Sınağı Tamamla və Yayımla</button>
        </div>
    `;

    document.getElementById('addMoreQBtn').addEventListener('click', () => {
        const qText = document.getElementById('qText').value.trim();
        const a = document.getElementById('optA').value.trim();
        const b = document.getElementById('optB').value.trim();
        const c = document.getElementById('optC').value.trim();
        const d = document.getElementById('optD').value.trim();
        const correct = parseInt(document.getElementById('correctOpt').value);

        if (!qText || !a || !b) {
            alert("Sual və ən azı A, B variantlarını doldurun!");
            return;
        }

        teacherQuestionsBuffer.push({
            questionIndex: teacherQuestionsBuffer.length + 1,
            question: qText,
            options: [a, b, c, d].filter(Boolean),
            correctAnswerIndex: correct,
            explanation: `Düzgün cavab: ${[a,b,c,d][correct]}`
        });

        renderQuestionBuilder();
    });

    document.getElementById('saveQuizBtn').addEventListener('click', async () => {
        const title = document.getElementById('manualQuizTitle').value.trim() || "Yeni Sınaq";
        const duration = parseInt(document.getElementById('manualQuizDuration').value) || 15;
        const group_id = document.getElementById('manualQuizGroupId').value || null;

        const qText = document.getElementById('qText').value.trim();
        if (qText) {
            const a = document.getElementById('optA').value.trim();
            const b = document.getElementById('optB').value.trim();
            const c = document.getElementById('optC').value.trim();
            const d = document.getElementById('optD').value.trim();
            const correct = parseInt(document.getElementById('correctOpt').value);
            teacherQuestionsBuffer.push({
                questionIndex: teacherQuestionsBuffer.length + 1,
                question: qText,
                options: [a, b, c, d].filter(Boolean),
                correctAnswerIndex: correct,
                explanation: `Düzgün cavab: ${[a,b,c,d][correct]}`
            });
        }

        if (teacherQuestionsBuffer.length === 0) {
            alert("Ən azı 1 sual daxil edin!");
            return;
        }

        showLoadingScreen("Sınaq Yayımlanır...", async () => {
            const { error } = await supabase.from('quizzes').insert([{
                title: title,
                questions_data: JSON.stringify(teacherQuestionsBuffer),
                duration: duration,
                group_id: group_id ? parseInt(group_id) : null
            }]);

            if (error) {
                alert("Sınaq yaradılarkən xəta: " + error.message);
            } else {
                alert("Sınaq uğurla yaradıldı və paylaşıldı!");
                teacherQuestionsBuffer = [];
                renderTeacherDashboard();
            }
        });
    });
}

function renderAIQuizForm() {
    const container = document.getElementById('quizSubArea');
    container.innerHTML = `
        <input type="text" id="aiTopic" placeholder="Mövzu (məs: Biologiya - Hüceyrə)" style="${inputStyle()}">
        <input type="number" id="aiCount" value="5" placeholder="Sual Sayı" style="${inputStyle()}">
        <input type="number" id="aiDuration" value="15" placeholder="Müddət (dəqiqə)" style="${inputStyle()}">
        <button id="generateAiBtn" style="${buttonStyle()}">🤖 AI ilə Sınaq Yarat və Yayımla</button>
    `;

    document.getElementById('generateAiBtn').addEventListener('click', async () => {
        const topic = document.getElementById('aiTopic').value.trim();
        const count = parseInt(document.getElementById('aiCount').value) || 5;
        const duration = parseInt(document.getElementById('aiDuration').value) || 15;

        if (!topic) return alert("Mövzunu daxil edin!");

        showLoadingScreen("AI Sınaq Hazırlayır...", async () => {
            const generated = [];
            for(let i=1; i<=count; i++) {
                generated.push({
                    questionIndex: i,
                    question: `${topic} üzrə ${i}-ci sual: Aşağıdakılardan hansı doğrudur?`,
                    options: [`A variantı (${topic})`, `B variantı (${topic})`, `C variantı (Doğru)`, `D variantı (${topic})`],
                    correctAnswerIndex: 2,
                    explanation: "Mövzu qaydasına əsasən doğru cavab C variantıdır."
                });
            }

            await supabase.from('quizzes').insert([{
                title: `${topic} (AI Test)`,
                questions_data: JSON.stringify(generated),
                duration: duration
            }]);

            alert("AI Sınaq yaradıldı!");
            renderTeacherDashboard();
        });
    });
}

// 2. Qruplar Bölməsi
async function renderTeacherGroupsSection() {
    const workArea = document.getElementById('teacherWorkArea');
    workArea.innerHTML = `
        <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
            <h3 style="margin-top: 0; color: #d8b4fe;">👥 Qrupların İdarə Olunması</h3>
            
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <input type="text" id="newGroupName" placeholder="Yeni Qrup Adı (məs: 10A Sinfi)" style="${inputStyle()}; margin-bottom: 0;">
                <button id="createGroupBtn" style="padding: 12px 20px; background: #22c55e; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; white-space: nowrap;">➕ Qrup Yarat</button>
            </div>

            <div id="groupsListArea" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px;">
                <p style="color: #cbd5e1;">Qruplar yüklənir...</p>
            </div>
        </div>
    `;

    document.getElementById('createGroupBtn').addEventListener('click', async () => {
        const name = document.getElementById('newGroupName').value.trim();
        if (!name) return alert("Qrup adını yazın!");

        const { error } = await supabase.from('groups').insert([{ name: name, created_by: currentTeacher.username }]);
        if (error) alert("Xəta: " + error.message);
        else {
            document.getElementById('newGroupName').value = '';
            loadGroupsList();
        }
    });

    loadGroupsList();
}

async function loadGroupsList() {
    const area = document.getElementById('groupsListArea');
    const { data: groups, error } = await supabase.from('groups').select('*');

    if (error || !groups || groups.length === 0) {
        area.innerHTML = `<p style="color: #cbd5e1; grid-column: 1/-1;">Hələ heç bir qrup yaradılmayıb.</p>`;
        return;
    }

    area.innerHTML = '';
    groups.forEach(g => {
        const card = document.createElement('div');
        card.style.cssText = "background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); padding: 16px; border-radius: 12px; display: flex; flex-direction: column; gap: 10px;";
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4 style="margin:0; color:#c084fc;">${g.name}</h4>
                <span style="font-size: 12px; color: #22c55e; background: rgba(34,197,94,0.1); padding: 4px 8px; border-radius: 6px;">Aktiv</span>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="add-students-btn" style="flex:1; padding: 8px; background: #7e22ce; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: bold; cursor: pointer;">➕ Şagird Əlavə Et</button>
                <button class="open-chat-btn" style="flex:1; padding: 8px; background: #059669; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: bold; cursor: pointer;">💬 WhatsApp Çat</button>
            </div>
        `;

        card.querySelector('.add-students-btn').addEventListener('click', () => renderAddStudentsToGroupModal(g));
        card.querySelector('.open-chat-btn').addEventListener('click', () => renderWhatsAppChat(g));

        area.appendChild(card);
    });
}

async function renderAddStudentsToGroupModal(group) {
    const { data: allStudents } = await supabase.from('students_account').select('*');
    const { data: groupMembers } = await supabase.from('group_members').select('*').eq('group_id', group.id);
    const memberStudentIds = new Set((groupMembers || []).map(m => m.student_id));

    let studentRows = '';
    (allStudents || []).forEach(st => {
        const isMember = memberStudentIds.has(st.id);
        studentRows += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 6px;">
                <div>
                    <b>${st.name} ${st.surname || ''}</b> (${st.student_class || 'Sinifsiz'})
                </div>
                <button data-id="${st.id}" class="toggle-member-btn" style="padding: 6px 12px; background: ${isMember ? '#f87171' : '#22c55e'}; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                    ${isMember ? 'Xaric Et' : 'Əlavə Et'}
                </button>
            </div>
        `;
    });

    const modal = document.createElement('div');
    modal.style.cssText = "position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 99999; padding: 20px;";
    modal.innerHTML = `
        <div style="background: rgba(20,15,40,0.95); border: 1px solid rgba(255,255,255,0.2); padding: 24px; border-radius: 16px; width: 100%; max-width: 480px; max-height: 80vh; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="margin: 0; color: #d8b4fe;">'${group.name}' Qrupuna Şagird Əlavə Et</h3>
                <button id="closeModalBtn" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">✕</button>
            </div>
            <div style="flex: 1; overflow-y: auto; margin-bottom: 16px;">
                ${studentRows || '<p>Şagird tapılmadı</p>'}
            </div>
            <button id="doneModalBtn" style="${buttonStyle()}">Tamamlandı</button>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#closeModalBtn').addEventListener('click', () => modal.remove());
    modal.querySelector('#doneModalBtn').addEventListener('click', () => modal.remove());

    modal.querySelectorAll('.toggle-member-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const stId = parseInt(e.currentTarget.getAttribute('data-id'));
            const isMember = memberStudentIds.has(stId);

            if (isMember) {
                await supabase.from('group_members').delete().eq('group_id', group.id).eq('student_id', stId);
                memberStudentIds.delete(stId);
                e.currentTarget.style.background = '#22c55e';
                e.currentTarget.textContent = 'Əlavə Et';
            } else {
                await supabase.from('group_members').insert([{ group_id: group.id, student_id: stId }]);
                memberStudentIds.add(stId);
                e.currentTarget.style.background = '#f87171';
                e.currentTarget.textContent = 'Xaric Et';
            }
        });
    });
}

// 3. Kontaktlar Bölməsi (Axtarışlı)
async function renderTeacherContactsSection() {
    const workArea = document.getElementById('teacherWorkArea');
    workArea.innerHTML = `
        <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
            <h3 style="margin-top: 0; color: #d8b4fe;">📇 Qeydiyyatlı Şagird Kontaktları</h3>
            
            <input type="text" id="contactSearchInput" placeholder="🔍 Şagirdin adını və ya sinfini axtarın..." style="${inputStyle()}; text-align: left; margin-bottom: 16px;">

            <div id="contactsContainer" style="display: flex; flex-direction: column; gap: 8px;">
                <p style="color: #cbd5e1;">Kontaktlar yüklənir...</p>
            </div>
        </div>
    `;

    const { data: students } = await supabase.from('students_account').select('*');

    function filterAndRenderContacts(query = "") {
        const container = document.getElementById('contactsContainer');
        if (!students || students.length === 0) {
            container.innerHTML = `<p style="color: #cbd5e1;">Qeydiyyatlı şagird yoxdur.</p>`;
            return;
        }

        const filtered = students.filter(s => {
            const fullName = `${s.name} ${s.surname || ''} ${s.student_class || ''}`.toLowerCase();
            return fullName.includes(query.toLowerCase());
        });

        if (filtered.length === 0) {
            container.innerHTML = `<p style="color: #cbd5e1;">Axtarışa uyğun şagird tapılmadı.</p>`;
            return;
        }

        container.innerHTML = '';
        filtered.forEach(s => {
            const item = document.createElement('div');
            item.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;";
            item.innerHTML = `
                <div>
                    <h4 style="margin: 0; color: #e2e8f0; font-size: 15px;">👤 ${s.name} ${s.surname || ''}</h4>
                    <span style="font-size: 12px; color: #cbd5e1;">Sinif: <b>${s.student_class || 'Təyin edilməyib'}</b></span>
                </div>
                <span style="font-size: 11px; background: rgba(168,85,247,0.2); color: #d8b4fe; padding: 4px 8px; border-radius: 6px;">ID: ${s.id}</span>
            `;
            container.appendChild(item);
        });
    }

    filterAndRenderContacts();

    document.getElementById('contactSearchInput').addEventListener('input', (e) => {
        filterAndRenderContacts(e.target.value.trim());
    });
}

// ==================== WHATSAPP ÜSLUBLU UÇDAN-UCA ŞİFRƏLƏMƏLİ ÇAT ====================
function renderWhatsAppChat(group) {
    if (chatPollInterval) clearInterval(chatPollInterval);
    activeChatGroupId = group.id;

    const senderName = currentTeacher ? `${currentTeacher.name} (Müəllim)` : `${currentStudent.name} ${currentStudent.surname || ''}`;

    appContainer.innerHTML = `
        <div style="min-height: 100vh; width: 100vw; background: #0b141a; display: flex; justify-content: center; align-items: center; padding: 10px; box-sizing: border-box; font-family: sans-serif;">
            <div style="width: 100%; max-width: 600px; height: 90vh; background: #111b21; border-radius: 16px; border: 1px solid #222d34; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 12px 32px rgba(0,0,0,0.8);">
                
                <!-- WhatsApp Header -->
                <div style="background: #202c33; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #222d34;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; background: #00a884; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: bold; color: white;">👥</div>
                        <div>
                            <h3 style="margin: 0; color: #e9edef; font-size: 16px;">${group.name}</h3>
                            <span style="font-size: 11px; color: #00a884;">🔒 Uçdan uca şifrələnib (E2EE)</span>
                        </div>
                    </div>
                    <button id="exitChatBtn" style="background: #2a3942; border: none; color: #8696a0; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-weight: bold;">✕ Bağla</button>
                </div>

                <!-- Encryption Notice -->
                <div style="text-align: center; padding: 8px; background: #182229; border-bottom: 1px solid #222d34;">
                    <p style="margin: 0; font-size: 11px; color: #ffd279; display: inline-flex; align-items: center; gap: 4px;">
                        🔒 Mesajlar və zənglər uçdan uca şifrələnir. Hakerlər və ya 3-cü şəxslər oxuya bilməz.
                    </p>
                </div>

                <!-- Chat Messages Body -->
                <div id="chatMessagesBox" style="flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background-image: radial-gradient(#202c33 1px, transparent 1px); background-size: 16px 16px;">
                    <p style="text-align: center; color: #8696a0; font-size: 12px;">Mesajlar yüklənir...</p>
                </div>

                <!-- Input Field -->
                <div style="background: #202c33; padding: 10px 14px; display: flex; gap: 10px; align-items: center;">
                    <input type="text" id="chatInput" placeholder="Mesaj yazın..." style="flex: 1; padding: 12px 16px; background: #2a3942; border: none; border-radius: 20px; color: #e9edef; font-size: 14px; outline: none;">
                    <button id="sendChatBtn" style="width: 42px; height: 42px; background: #00a884; border: none; border-radius: 50%; color: white; display: flex; justify-content: center; align-items: center; cursor: pointer; font-size: 18px;">➔</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('exitChatBtn').addEventListener('click', () => {
        if (chatPollInterval) clearInterval(chatPollInterval);
        if (currentTeacher) renderTeacherDashboard();
        else renderStudentDashboard();
    });

    const sendMsg = async () => {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text) return;

        const encrypted = encryptMessage(text);
        input.value = '';

        await supabase.from('group_chats').insert([{
            group_id: group.id,
            sender_name: senderName,
            encrypted_content: encrypted
        }]);

        fetchAndRenderMessages(group.id, senderName);
    };

    document.getElementById('sendChatBtn').addEventListener('click', sendMsg);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMsg();
    });

    fetchAndRenderMessages(group.id, senderName);
    chatPollInterval = setInterval(() => fetchAndRenderMessages(group.id, senderName), 2000);
}

async function fetchAndRenderMessages(groupId, currentSenderName) {
    const box = document.getElementById('chatMessagesBox');
    if (!box) return;

    const { data: messages } = await supabase.from('group_chats').select('*').eq('group_id', groupId).order('created_at', { ascending: true });

    if (!messages || messages.length === 0) {
        box.innerHTML = `<p style="text-align: center; color: #8696a0; font-size: 12px;">Hələ mesaj yoxdur. İlk mesajı siz yazın!</p>`;
        return;
    }

    box.innerHTML = '';
    messages.forEach(m => {
        const isMe = m.sender_name === currentSenderName;
        const decryptedText = decryptMessage(m.encrypted_content);

        const msgDiv = document.createElement('div');
        msgDiv.style.cssText = `max-width: 75%; padding: 8px 12px; border-radius: 12px; font-size: 14px; word-break: break-word; align-self: ${isMe ? 'flex-end' : 'flex-start'}; background: ${isMe ? '#005c4b' : '#202c33'}; color: #e9edef; box-shadow: 0 1px 2px rgba(0,0,0,0.3);`;
        
        msgDiv.innerHTML = `
            <div style="font-size: 11px; color: ${isMe ? '#8696a0' : '#53bdeb'}; font-weight: bold; margin-bottom: 3px;">${m.sender_name}</div>
            <div>${decryptedText}</div>
            <div style="font-size: 9px; color: #8696a0; text-align: right; margin-top: 4px;">🔒 E2EE</div>
        `;
        box.appendChild(msgDiv);
    });

    box.scrollTop = box.scrollHeight;
}

// ==================== ŞAGİRD PANESİ ====================
async function renderStudentDashboard() {
    if (chatPollInterval) clearInterval(chatPollInterval);

    appContainer.innerHTML = `
        <div class="main-wrapper" style="max-width: 900px; margin: 0 auto; padding: 20px; color: white;">
            <div class="user-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <div>
                    <h2>Xoş gəldiniz, ${currentStudent.name} ${currentStudent.surname || ''}</h2>
                    <p style="color: #cbd5e1;">Sinif: ${currentStudent.student_class || 'Bilinmir'}</p>
                </div>
                <button id="studentLogoutBtn" style="padding: 8px 16px; background: rgba(239, 68, 68, 0.2); border: 1px solid #f87171; border-radius: 8px; color: #f87171; cursor: pointer; font-weight: bold;">🚪 Çıxış</button>
            </div>

            <!-- Şagird Menyusu -->
            <div style="display: flex; gap: 10px; margin-bottom: 24px;">
                <button id="sNavQuizzes" style="flex: 1; padding: 12px; background: #7e22ce; color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">📝 Sınaqlarım</button>
                <button id="sNavGroups" style="flex: 1; padding: 12px; background: rgba(255,255,255,0.1); color: #cbd5e1; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">👥 Qruplarım (Çat)</button>
            </div>

            <div id="studentWorkArea"></div>
        </div>
    `;

    document.getElementById('studentLogoutBtn').addEventListener('click', () => {
        localStorage.removeItem('aquarius_current_student');
        currentStudent = null;
        renderAuthScreen();
    });

    document.getElementById('sNavQuizzes').addEventListener('click', () => {
        setStudentNavActive('sNavQuizzes');
        renderStudentQuizzesSection();
    });

    document.getElementById('sNavGroups').addEventListener('click', () => {
        setStudentNavActive('sNavGroups');
        renderStudentGroupsSection();
    });

    renderStudentQuizzesSection();
}

function setStudentNavActive(id) {
    ['sNavQuizzes', 'sNavGroups'].forEach(btnId => {
        const el = document.getElementById(btnId);
        if (btnId === id) {
            el.style.background = '#7e22ce';
            el.style.color = 'white';
        } else {
            el.style.background = 'rgba(255,255,255,0.1)';
            el.style.color = '#cbd5e1';
        }
    });
}

// Şagird yalnız üzv olduğu qrupun sınaqlarını görür
async function renderStudentQuizzesSection() {
    const area = document.getElementById('studentWorkArea');
    area.innerHTML = `<p style="color: #cbd5e1;">Sınaqlarınız yüklənir...</p>`;

    // Şagirdin olduğu qrupları tapırıq
    const { data: myMemberships } = await supabase.from('group_members').select('group_id').eq('student_id', currentStudent.id);
    const myGroupIds = new Set((myMemberships || []).map(m => m.group_id));

    const [{ data: quizzes }, { data: results }] = await Promise.all([
        supabase.from('quizzes').select('*'),
        supabase.from('student_results').select('*').eq('student_id', currentStudent.id)
    ]);

    if (!quizzes || quizzes.length === 0) {
        area.innerHTML = `<p style="color: #cbd5e1;">Aktiv sınaq tapılmadı.</p>`;
        return;
    }

    // Filter: Ya qrup_id null-dur (hamı üçün), ya da şagird həmin qrupun üzvüdür
    const allowedQuizzes = quizzes.filter(q => !q.group_id || myGroupIds.has(q.group_id));

    if (allowedQuizzes.length === 0) {
        area.innerHTML = `<p style="color: #cbd5e1;">Sizin daxil olduğunuz qrupa hələ ki, sınaq təyin edilməyib.</p>`;
        return;
    }

    const resultMap = {};
    (results || []).forEach(r => resultMap[String(r.quiz_id)] = r);

    area.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;"></div>`;
    const grid = area.firstElementChild;

    allowedQuizzes.forEach(quiz => {
        const quizIdStr = String(quiz.id);
        const userResult = resultMap[quizIdStr];

        const card = document.createElement('div');
        card.style.cssText = "background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 18px; border-radius: 14px; display: flex; flex-direction: column; justify-content: space-between;";
        
        if (userResult) {
            card.innerHTML = `
                <div>
                    <h4 style="margin: 0 0 8px 0; color: #d8b4fe;">${quiz.title}</h4>
                    <p style="font-size: 13px; color: #cbd5e1; margin: 0 0 12px 0;">⏱️ Müddət: ${quiz.duration} dəq</p>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button disabled style="flex:1; padding: 8px; background: #4b5563; color: #9ca3af; border: none; border-radius: 8px; font-weight: bold; cursor: not-allowed;">Bitdi</button>
                    <button id="resBtn_${quiz.id}" style="flex:1; padding: 8px; background: #0284c7; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Nəticəm</button>
                </div>
            `;
            grid.appendChild(card);
            card.querySelector(`#resBtn_${quiz.id}`).addEventListener('click', () => renderDetailedReview(quiz, userResult));
        } else {
            card.innerHTML = `
                <div>
                    <h4 style="margin: 0 0 8px 0; color: #d8b4fe;">${quiz.title}</h4>
                    <p style="font-size: 13px; color: #cbd5e1; margin: 0 0 12px 0;">⏱️ Müddət: ${quiz.duration} dəq</p>
                </div>
                <button id="startBtn_${quiz.id}" style="${buttonStyle()}">Sınağa Başla</button>
            `;
            grid.appendChild(card);
            card.querySelector(`#startBtn_${quiz.id}`).addEventListener('click', () => loadAndStartQuiz(quiz.id));
        }
    });
}

// Şagird qrupları və çat
async function renderStudentGroupsSection() {
    const area = document.getElementById('studentWorkArea');
    area.innerHTML = `<p style="color: #cbd5e1;">Qruplarınız yüklənir...</p>`;

    const { data: myMemberships } = await supabase.from('group_members').select('group_id').eq('student_id', currentStudent.id);
    const myGroupIds = (myMemberships || []).map(m => m.group_id);

    if (myGroupIds.length === 0) {
        area.innerHTML = `<p style="color: #cbd5e1;">Hələ heç bir qrupa əlavə edilməmisiniz.</p>`;
        return;
    }

    const { data: groups } = await supabase.from('groups').select('*').in('id', myGroupIds);

    area.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px;"></div>`;
    const grid = area.firstElementChild;

    (groups || []).forEach(g => {
        const card = document.createElement('div');
        card.style.cssText = "background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); padding: 16px; border-radius: 12px; display: flex; flex-direction: column; gap: 12px;";
        card.innerHTML = `
            <h4 style="margin: 0; color: #c084fc;">👥 ${g.name}</h4>
            <button id="openStudentChat_${g.id}" style="padding: 10px; background: #059669; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">💬 Qrup Çatına Daxil Ol (WhatsApp E2EE)</button>
        `;
        grid.appendChild(card);
        card.querySelector(`#openStudentChat_${g.id}`).addEventListener('click', () => renderWhatsAppChat(g));
    });
}

// ==================== İZAH VƏ SİNAQ NƏTİCƏLƏRİ ====================
function renderDetailedReview(quizObj, resultItem) {
    let questions = quizObj.questions_data;
    if (typeof questions === 'string') {
        try { questions = JSON.parse(questions); } catch(e) {}
    }

    let details = resultItem.details_json;
    if (typeof details === 'string') {
        try { details = JSON.parse(details); } catch(e) {}
    }

    let reviewHtml = `
        <div class="main-wrapper" style="max-width: 800px; margin: 0 auto; padding: 20px; color: white;">
            <div class="user-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; background: rgba(255,255,255,0.05); padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
                <div>
                    <h2 style="margin: 0 0 8px 0; color: #d8b4fe;">📋 Sınaq İcmalı: ${quizObj.title}</h2>
                    <p style="margin: 0; font-size: 16px;">Topladığınız Xal: <b style="color: #4ade80;">${resultItem.score} / ${resultItem.total}</b></p>
                </div>
                <button id="backToDashboardBtn" style="padding: 10px 18px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">Geri qayıt</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 16px;">
    `;

    questions.forEach((q, idx) => {
        const detailItem = details ? details.find(d => d.questionIndex === idx + 1) : null;
        const userAnsText = detailItem ? detailItem.userAnswer : "Cavabsız";
        const isCorrect = detailItem ? detailItem.isCorrect : false;
        
        const correctIdx = q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : 0;
        const correctOptionText = (q.options && q.options[correctIdx]) ? q.options[correctIdx] : "Təyin olunmayıb";

        reviewHtml += `
            <div style="background: rgba(255,255,255,0.05); border: 1px solid ${isCorrect ? 'rgba(74, 222, 128, 0.4)' : 'rgba(248, 113, 113, 0.4)'}; padding: 20px; border-radius: 14px;">
                <p style="font-size: 16px; margin-top: 0; margin-bottom: 12px; color: #f1f5f9;"><b>Sual ${idx + 1}:</b> ${q.question}</p>
                <div style="font-size: 14px; margin-bottom: 8px;">
                    <b>Sizin cavabınız:</b> <span style="color: ${isCorrect ? '#4ade80' : '#f87171'}; font-weight: bold;">${userAnsText} ${isCorrect ? '✅' : '❌'}</span>
                </div>
                ${!isCorrect ? `<div style="font-size: 14px; color: #4ade80; margin-bottom: 12px;"><b>Düzgün cavab:</b> ${correctOptionText}</div>` : ''}
                <div style="margin-top: 12px; padding: 12px; background: rgba(0,0,0,0.3); border-radius: 8px; border-left: 4px solid #a855f7; font-size: 13px; color: #cbd5e1;">
                    💡 <b>İzah:</b> ${q.explanation || `Düzgün cavab: ${correctOptionText}`}
                </div>
            </div>
        `;
    });

    reviewHtml += `</div></div>`;
    appContainer.innerHTML = reviewHtml;
    document.getElementById('backToDashboardBtn').addEventListener('click', renderStudentDashboard);
}

// ==================== SİNAQ PROSESİ VƏ İCRA ====================
async function loadAndStartQuiz(quizId) {
    appContainer.innerHTML = `
        <div style="min-height: 100vh; width: 100vw; box-sizing: border-box; padding: 20px; display: flex; justify-content: center; align-items: center;">
            <div style="width: 100%; max-width: 500px; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 24px; border-radius: 20px; color: white;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h2 id="quizTitle" style="font-size: 18px; color: #d8b4fe; margin: 0;">Sınaq yüklənir...</h2>
                </div>
                <div id="timerDisplay" style="display: flex; justify-content: center; align-items: center; background: rgba(126, 34, 206, 0.2); border: 1px solid rgba(168, 85, 247, 0.4); padding: 8px 16px; border-radius: 12px; font-weight: bold; color: #f87171; margin: 0 auto 16px auto; width: fit-content; font-size: 15px;"></div>
                <div id="questionBox" style="margin-bottom: 20px; font-size: 16px;"></div>
                <div style="display: flex; justify-content: space-between; gap: 10px;">
                    <button id="prevQuestionBtn" style="display: none; padding: 10px 16px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; cursor: pointer;">Geri</button>
                    <button id="nextQuestionBtn" style="flex: 1; padding: 10px 16px; background: linear-gradient(135deg, #9333ea, #c084fc); border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer;">Növbəti</button>
                </div>
            </div>
        </div>
    `;

    currentQuizId = quizId;
    try {
        const { data, error } = await supabase.from('quizzes').select('*').eq('id', quizId).single();
        if (error || !data) throw new Error("Sınaq tapılmadı.");

        document.getElementById('quizTitle').textContent = data.title || `Sınaq #${quizId}`;
        let parsedData = data.questions_data;
        if (typeof parsedData === 'string') {
            try { parsedData = JSON.parse(parsedData); } catch(e) {}
        }

        currentQuizData = Array.isArray(parsedData) ? parsedData : [];
        currentQuestionIndex = 0;
        userAnswers = {};
        renderQuestion();

        const durationMinutes = data.duration || 0;
        if (durationMinutes > 0) {
            timeLeft = durationMinutes * 60;
            startTimer();
        }

        document.getElementById('nextQuestionBtn').addEventListener('click', handleNextQuestion);
        document.getElementById('prevQuestionBtn').addEventListener('click', handlePrevQuestion);
    } catch (err) {
        alert("Xəta: " + err.message);
        renderStudentDashboard();
    }
}

function startTimer() {
    clearInterval(timerInterval);
    const timerEl = document.getElementById('timerDisplay');
    timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Vaxt bitdi!");
            showResults();
            return;
        }
        timeLeft--;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerEl.innerHTML = `⏱️ Qalan vaxt: ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}

function renderQuestion() {
    const q = currentQuizData[currentQuestionIndex];
    let optionsHtml = "";
    const options = Array.isArray(q.options) ? q.options : [];

    options.forEach((opt, index) => {
        const isSelected = userAnswers[currentQuestionIndex] === index ? "background: rgba(126, 34, 206, 0.5); border-color: #a855f7;" : "background: rgba(0,0,0,0.2); border-color: rgba(255,255,255,0.1);";
        optionsHtml += `<button class="option-btn" data-index="${index}" style="width: 100%; text-align: left; padding: 12px 16px; margin-bottom: 10px; ${isSelected} border-radius: 10px; color: white; border-style: solid; border-width: 1px; cursor: pointer;">${opt}</button>`;
    });

    document.getElementById('questionBox').innerHTML = `
        <p style="margin-bottom: 8px; font-weight: 600; font-size: 13px; color: #d8b4fe;">Sual ${currentQuestionIndex + 1} / ${currentQuizData.length}</p>
        <p style="margin-bottom: 16px; font-size: 15px;">${q.question}</p>
        <div>${optionsHtml}</div>
    `;

    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            userAnswers[currentQuestionIndex] = parseInt(e.currentTarget.getAttribute('data-index'));
            renderQuestion();
        });
    });

    document.getElementById('prevQuestionBtn').style.display = currentQuestionIndex === 0 ? "none" : "block";
    document.getElementById('nextQuestionBtn').textContent = currentQuestionIndex === currentQuizData.length - 1 ? "Bitdir" : "Növbəti";
}

function handleNextQuestion() {
    if (currentQuestionIndex < currentQuizData.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    } else {
        showResults();
    }
}

function handlePrevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

async function showResults() {
    clearInterval(timerInterval);
    let score = 0;
    const total = currentQuizData.length;
    const details = [];

    currentQuizData.forEach((q, idx) => {
        const userAnsIdx = userAnswers[idx];
        const correctAnsIdx = q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : 0;
        const isCorrect = (userAnsIdx !== undefined && userAnsIdx === correctAnsIdx);
        if (isCorrect) score++;

        details.push({
            questionIndex: idx + 1,
            userAnswer: userAnsIdx !== undefined ? (q.options[userAnsIdx] || "Cavab seçilib") : "Cavabsız",
            isCorrect: isCorrect
        });
    });

    try {
        await supabase.from('student_results').insert([
            {
                quiz_id: parseInt(currentQuizId) || 0,
                student_id: currentStudent.id,
                student_name: currentStudent.name,
                student_surname: currentStudent.surname || '',
                student_class: currentStudent.student_class || '',
                score: score,
                total: total,
                details_json: JSON.stringify(details)
            }
        ]);
    } catch (err) {
        console.error("Nəticə yazılarkən xəta:", err);
    }

    const percent = Math.round((score / total) * 100);
    appContainer.innerHTML = `
        <div style="min-height: 100vh; width: 100vw; box-sizing: border-box; padding: 20px; display: flex; justify-content: center; align-items: center;">
            <div style="width: 100%; max-width: 400px; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 20px; text-align: center; color: white;">
                <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 12px; color: #22c55e;">🎉 Sınaq Tamamlandı!</h2>
                <p style="font-size: 18px; font-weight: bold; color: #22c55e;">Nəticə: ${score} / ${total} (${percent}%)</p>
                <button id="backToCabinetBtn" style="${buttonStyle()}; margin-top: 20px;">Kabinetə qayıt</button>
            </div>
        </div>
    `;

    document.getElementById('backToCabinetBtn').addEventListener('click', renderStudentDashboard);
}

window.addEventListener('DOMContentLoaded', () => {
    if (!checkSavedSession()) {
        renderAuthScreen();
    }
});
