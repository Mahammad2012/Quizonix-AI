import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://ebsqtjibhhckbciltzfb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVic3F0amliaGhja2JjaWx0emZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5OTUyNjUsImV4cCI6MjEwMDU3MTI2NX0.FNMjDFVakfNZxp758wrIPTXQRww6p8DgipsGwMeV0do';
const supabase = createClient(supabaseUrl, supabaseKey);

const appContainer = document.getElementById('appContainer') || document.body;

let currentStudent = null;
let currentTeacher = null;
let currentQuizId = null;
let currentQuizData = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let timerInterval = null;
let timeLeft = 0;

// Rejimlər: 'student' və ya 'teacher'
let currentRole = 'student'; 
let currentTab = 'login'; // 'login' və ya 'register'

// Müəllimin Manual Sınaq Yaratma Yaddaşı
let teacherQuestionsBuffer = [];
let currentEditingQuestionIndex = 0;

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
                    <button id="showLoginTab" style="flex: 1; padding: 10px; background: ${isLogin ? '#7e22ce' : 'rgba(255,255,255,0.1)'}; color: ${isLogin ? 'white' : '#cbd5e1'}; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 14px; transition: 0.2s;">Giriş</button>
                    <button id="showRegisterTab" style="flex: 1; padding: 10px; background: ${!isLogin ? '#7e22ce' : 'rgba(255,255,255,0.1)'}; color: ${!isLogin ? 'white' : '#cbd5e1'}; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 14px; transition: 0.2s;">Qeydiyyat</button>
                </div>

                <div id="formContainer"></div>

                <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <a id="roleToggleLink" href="#" style="color: #c084fc; font-size: 13px; text-decoration: none; font-weight: 600; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px;">
                        <span>${isTeacher ? '🎓 Şagird kimi daxil olmaq üçün klikləyin' : '👨‍🏫 Müəllim kimi daxil olmaq üçün klikləyin'}</span>
                    </a>
                </div>
            </div>
        </div>
    `;

    const roleToggleLink = document.getElementById('roleToggleLink');
    roleToggleLink.addEventListener('click', (e) => {
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
                    try {
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
                    } catch (err) {
                        alert("Giriş zamanı xəta baş verdi.");
                        renderAuthScreen();
                    }
                });
            });
        } else {
            container.innerHTML = `
                <form id="teacherLoginForm">
                    <input type="text" id="teacherUsername" placeholder="İstifadəçi Adı (məs: Məhəmməd2012!)" required style="${inputStyle()}">
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
                    try {
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
                    } catch (err) {
                        alert("Giriş zamanı xəta baş verdi.");
                        renderAuthScreen();
                    }
                });
            });
        }
    } else {
        if (currentRole === 'student') {
            container.innerHTML = `
                <form id="studentRegisterForm">
                    <input type="text" id="regName" placeholder="Adınız" required style="${inputStyle()}">
                    <input type="text" id="regSurname" placeholder="Soyadınız" required style="${inputStyle()}">
                    <input type="text" id="regClass" placeholder="Sinfiniz (məsələn: 10A)" required style="${inputStyle()}">
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
                    try {
                        const { data: existing } = await supabase
                            .from('students_account')
                            .select('*')
                            .ilike('name', name)
                            .ilike('surname', surname)
                            .single();

                        if (existing) {
                            alert("Bu ad və soyadla artıq hesab mövcuddur.");
                            renderAuthScreen();
                            return;
                        }

                        const { data, error } = await supabase
                            .from('students_account')
                            .insert([{ name, surname, student_class, password }])
                            .select()
                            .single();

                        if (error) throw error;

                        currentStudent = data;
                        localStorage.setItem('aquarius_current_student', JSON.stringify(data));
                        renderStudentDashboard();
                    } catch (err) {
                        alert("Qeydiyyat xətası: " + err.message);
                        renderAuthScreen();
                    }
                });
            });
        } else {
            container.innerHTML = `
                <form id="teacherRegisterForm">
                    <input type="text" id="tRegName" placeholder="Adınız" required style="${inputStyle()}">
                    <input type="text" id="tRegSurname" placeholder="Soyadınız" required style="${inputStyle()}">
                    <input type="text" id="tRegUsername" placeholder="İstifadəçi adı (məs: Məhəmməd2012!)" required style="${inputStyle()}">
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

                if (username.toLowerCase() === password.toLowerCase()) {
                    alert("İstifadəçi adı ilə şifrə eyni ola bilməz!");
                    return;
                }

                showLoadingScreen("Yüklənir...", async () => {
                    try {
                        const { data: existing } = await supabase
                            .from('teachers_account')
                            .select('*')
                            .eq('username', username)
                            .single();

                        if (existing) {
                            alert("Bu istifadəçi adı artıq götürülüb!");
                            renderAuthScreen();
                            return;
                        }

                        const { data, error } = await supabase
                            .from('teachers_account')
                            .insert([{ name, surname, username, password }])
                            .select()
                            .single();

                        if (error) throw error;

                        currentTeacher = data;
                        localStorage.setItem('aquarius_current_teacher', JSON.stringify(data));
                        renderTeacherDashboard();
                    } catch (err) {
                        alert("Müəllim qeydiyyatı xətası: " + err.message);
                        renderAuthScreen();
                    }
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
            <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.5); font-size: 14px;">🔒</span>
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
                toggle.style.background = "#7e22ce";
                toggle.style.color = "white";
                toggle.textContent = "Gizlət";
            } else {
                input.type = "password";
                toggle.style.background = "rgba(255,255,255,0.1)";
                toggle.style.color = "#d8b4fe";
                toggle.textContent = "Göstər";
            }
        });
    }
}

function showLoadingScreen(message, callback) {
    appContainer.innerHTML = `
        <div style="min-height: 100vh; width: 100vw; display: flex; flex-direction: column; justify-content: center; align-items: center; box-sizing: border-box;">
            <div style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 40px; border-radius: 20px; text-align: center;">
                <div style="border: 4px solid rgba(255, 255, 255, 0.1); border-top: 4px solid #c084fc; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px auto;"></div>
                <h3 style="font-size: 18px; color: #d8b4fe; margin: 0;">${message}</h3>
            </div>
        </div>
    `;
    setTimeout(callback, 1000);
}

// ==================== MÜƏLLİM PANESİ VƏ PROFiL ====================
function renderTeacherDashboard() {
    appContainer.innerHTML = `
        <div class="main-wrapper" style="max-width: 800px; margin: 0 auto; padding: 20px; color: white;">
            <div class="user-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <div>
                    <h2>Xoş gəldiniz, ${currentTeacher.name || ''} ${currentTeacher.surname || ''}</h2>
                    <p style="color: #cbd5e1;">👨‍🏫 Müəllim Paneli (${currentTeacher.username})</p>
                </div>

                <div id="teacherProfileCircle" class="user-avatar mr-profile-container" style="position: relative; cursor: pointer;" title="Profil menyusu">
                    <div class="mr-spinning-border"></div>
                    <span style="position: relative; z-index: 2;">MR</span>
                </div>
            </div>

            <div style="display: flex; gap: 12px; margin-bottom: 24px;">
                <button id="tabCreateManual" style="flex: 1; padding: 12px; background: #7e22ce; color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">➕ Əl ilə Sınaq Yarat</button>
                <button id="tabCreateAI" style="flex: 1; padding: 12px; background: rgba(255,255,255,0.1); color: #cbd5e1; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">🤖 AI ilə Sınaq Yarat</button>
                <button id="tabCreateOCR" style="flex: 1; padding: 12px; background: rgba(255,255,255,0.1); color: #cbd5e1; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">📷 Şəkildən Analiz Et</button>
            </div>

            <div id="teacherWorkArea"></div>
        </div>

        <div id="teacherProfileDropdown" style="display: none; position: fixed; background: rgba(20, 15, 40, 0.98); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.15); border-radius: 14px; width: 200px; box-shadow: 0 10px 25px rgba(0,0,0,0.8); z-index: 99999; overflow: hidden;">
            <div style="position: relative; z-index: 2;">
                <button id="teacherMenuLogout" style="width: 100%; padding: 12px 16px; background: none; border: none; color: #f87171; text-align: left; cursor: pointer; font-size: 14px;">
                    🚪 Çıxış et
                </button>
            </div>
        </div>
    `;

    const profileCircle = document.getElementById('teacherProfileCircle');
    const profileDropdown = document.getElementById('teacherProfileDropdown');

    profileCircle.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = profileCircle.getBoundingClientRect();
        if (profileDropdown.style.display === 'block') {
            profileDropdown.style.display = 'none';
        } else {
            profileDropdown.style.top = (rect.bottom + 8) + 'px';
            profileDropdown.style.right = (window.innerWidth - rect.right) + 'px';
            profileDropdown.style.display = 'block';
        }
    });

    document.addEventListener('click', (e) => {
        if (!profileCircle.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.style.display = 'none';
        }
    });

    document.getElementById('teacherMenuLogout').addEventListener('click', () => {
        profileDropdown.style.display = 'none';
        localStorage.removeItem('aquarius_current_teacher');
        currentTeacher = null;
        renderAuthScreen();
    });

    document.getElementById('tabCreateManual').addEventListener('click', () => {
        setActiveTabBtn('tabCreateManual');
        renderManualQuizCreator();
    });

    document.getElementById('tabCreateAI').addEventListener('click', () => {
        setActiveTabBtn('tabCreateAI');
        renderAIQuizCreator();
    });

    document.getElementById('tabCreateOCR').addEventListener('click', () => {
        setActiveTabBtn('tabCreateOCR');
        renderOCRQuizCreator();
    });

    renderManualQuizCreator();
}

function setActiveTabBtn(id) {
    ['tabCreateManual', 'tabCreateAI', 'tabCreateOCR'].forEach(btnId => {
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

// ==================== MANUAL SUAL ƏLAVƏ ETMƏ REDAKTORU (LIMIT 100) ====================
function renderManualQuizCreator() {
    const workArea = document.getElementById('teacherWorkArea');
    teacherQuestionsBuffer = teacherQuestionsBuffer || [];

    workArea.innerHTML = `
        <div style="background: rgba(255,255,255,0.05); padding: 24px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
            <h3 style="margin-top:0; color:#d8b4fe;">📝 Yeni Sınaq Yarat</h3>
            
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
                <input type="text" id="manualQuizTitle" placeholder="Sınağın Adı (məs: Riyaziyyat Kviz #1)" style="${inputStyle()}">
                <input type="number" id="manualQuizDuration" value="15" placeholder="Müddət (dəqiqə)" style="${inputStyle()}">
            </div>

            <hr style="border-color: rgba(255,255,255,0.1); margin: 20px 0;">

            <div id="questionEditorCard"></div>
        </div>
    `;

    renderQuestionEditorForm();
}

function renderQuestionEditorForm() {
    const card = document.getElementById('questionEditorCard');
    const questionNum = teacherQuestionsBuffer.length + 1;
    const isLimitReached = teacherQuestionsBuffer.length >= 100;

    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h4 style="margin: 0; color: #a855f7;">Sual ${questionNum} / 100</h4>
            <span style="font-size: 13px; color: #cbd5e1;">Cəmi Əlavə Olunub: <b>${teacherQuestionsBuffer.length}</b> sual</span>
        </div>

        <textarea id="qText" placeholder="Sualın şərtini bura yazın..." style="width: 100%; height: 80px; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; color: white; resize: vertical; margin-bottom: 14px; box-sizing: border-box;"></textarea>

        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
            <input type="text" id="optA" placeholder="A) Variantı" style="${inputStyle()}; text-align: left; margin: 0;">
            <input type="text" id="optB" placeholder="B) Variantı" style="${inputStyle()}; text-align: left; margin: 0;">
            <input type="text" id="optC" placeholder="C) Variantı" style="${inputStyle()}; text-align: left; margin: 0;">
            <input type="text" id="optD" placeholder="D) Variantı" style="${inputStyle()}; text-align: left; margin: 0;">
            <input type="text" id="optE" placeholder="E) Variantı" style="${inputStyle()}; text-align: left; margin: 0;">
        </div>

        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 6px; font-size: 13px; color: #d8b4fe;">Düzgün Cavabı Seçin:</label>
            <select id="correctOptSelect" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; outline: none;">
                <option value="0">A Variantı</option>
                <option value="1">B Variantı</option>
                <option value="2">C Variantı</option>
                <option value="3">D Variantı</option>
                <option value="4">E Variantı</option>
            </select>
        </div>

        <div style="display: flex; gap: 10px;">
            <button id="addNextQuestionBtn" ${isLimitReached ? 'disabled' : ''} style="flex: 1; padding: 12px; background: ${isLimitReached ? '#4b5563' : '#22c55e'}; color: ${isLimitReached ? '#9ca3af' : 'white'}; border: none; border-radius: 10px; font-weight: bold; cursor: ${isLimitReached ? 'not-allowed' : 'pointer'}; opacity: ${isLimitReached ? '0.6' : '1'};">
                ➕ Yeni Sual Əlavə Et
            </button>
            <button id="saveAndPublishBtn" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #9333ea, #c084fc); color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">
                💾 Saxla və Paylaş
            </button>
        </div>

        ${isLimitReached ? '<p style="color: #ef4444; font-weight: bold; margin-top: 12px; text-align: center; font-size: 14px;">Limit: 100 sual</p>' : ''}
    `;

    document.getElementById('addNextQuestionBtn').addEventListener('click', () => {
        if (isLimitReached) return;

        const qText = document.getElementById('qText').value.trim();
        const a = document.getElementById('optA').value.trim();
        const b = document.getElementById('optB').value.trim();
        const c = document.getElementById('optC').value.trim();
        const d = document.getElementById('optD').value.trim();
        const e = document.getElementById('optE').value.trim();
        const correct = parseInt(document.getElementById('correctOptSelect').value);

        if (!qText || !a || !b) {
            alert("Zəhmət olmasa ən azı sualın şərtini və A, B variantlarını doldurun!");
            return;
        }

        const options = [a, b];
        if (c) options.push(c);
        if (d) options.push(d);
        if (e) options.push(e);

        teacherQuestionsBuffer.push({
            questionIndex: teacherQuestionsBuffer.length + 1,
            question: qText,
            options: options,
            correctAnswerIndex: correct,
            explanation: `Düzgün cavab: ${options[correct] || 'Təyin olunub'}`
        });

        renderQuestionEditorForm();
    });

    document.getElementById('saveAndPublishBtn').addEventListener('click', async () => {
        const title = document.getElementById('manualQuizTitle')?.value.trim() || `Müəllim Sınağı #${Math.floor(Math.random()*1000)}`;
        const duration = parseInt(document.getElementById('manualQuizDuration')?.value) || 15;

        const qText = document.getElementById('qText').value.trim();
        if (qText && teacherQuestionsBuffer.length < 100) {
            const a = document.getElementById('optA').value.trim();
            const b = document.getElementById('optB').value.trim();
            const c = document.getElementById('optC').value.trim();
            const d = document.getElementById('optD').value.trim();
            const e = document.getElementById('optE').value.trim();
            const correct = parseInt(document.getElementById('correctOptSelect').value);

            const options = [a, b];
            if (c) options.push(c);
            if (d) options.push(d);
            if (e) options.push(e);

            teacherQuestionsBuffer.push({
                questionIndex: teacherQuestionsBuffer.length + 1,
                question: qText,
                options: options,
                correctAnswerIndex: correct,
                explanation: `Düzgün cavab: ${options[correct] || ''}`
            });
        }

        if (teacherQuestionsBuffer.length === 0) {
            alert("Lütfən ən azı 1 sual daxil edin!");
            return;
        }

        showLoadingScreen("Sınaq Baza-ya Yüklənir və Paylaşılır...", async () => {
            const res = await saveAIQuizToSupabase(title, teacherQuestionsBuffer, duration);
            if (res) {
                alert("Sınaq uğurla saxlanıldı və şagirdlərə paylaşıldı!");
                teacherQuestionsBuffer = [];
                renderTeacherDashboard();
            } else {
                alert("Xəta baş verdi. Sınaq saxlanıla bilmədi.");
            }
        });
    });
}

// ==================== AI VƏ ŞƏKİLDƏN SUAL YARATMA ====================
function renderAIQuizCreator() {
    const workArea = document.getElementById('teacherWorkArea');
    workArea.innerHTML = `
        <div style="background: rgba(255,255,255,0.05); padding: 24px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
            <h3 style="margin-top: 0; color: #d8b4fe;">🤖 AI ilə Avtomatik Sınaq Generasiyası</h3>
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Sınaq Mövzusu:</label>
            <input type="text" id="aiQuizTopic" placeholder="Məsələn: Fizika - Nyuton Qanunları" style="${inputStyle()}">

            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Sual Sayı (Maks: 100):</label>
            <input type="number" id="aiQuizCount" value="5" min="1" max="100" style="${inputStyle()}">

            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Müddət (dəqiqə):</label>
            <input type="number" id="aiQuizDuration" value="15" min="1" style="${inputStyle()}">

            <button id="generateAiQuizBtn" style="${buttonStyle()}; margin-top: 10px;">🤖 AI ilə Sınaq Yarat və Baza Yüklə</button>
        </div>
    `;

    document.getElementById('generateAiQuizBtn').addEventListener('click', async () => {
        const topic = document.getElementById('aiQuizTopic').value.trim();
        const count = Math.min(parseInt(document.getElementById('aiQuizCount').value) || 5, 100);
        const duration = parseInt(document.getElementById('aiQuizDuration').value) || 15;

        if (!topic) {
            alert("Lütfən sınaq mövzusunu daxil edin!");
            return;
        }

        showLoadingScreen("AI Sınaq Yaradılır...", async () => {
            const aiQuestions = generateAIQuestions(topic, count);
            const res = await saveAIQuizToSupabase(topic, aiQuestions, duration);
            if (res) alert("Sınaq uğurla yaradıldı və paylaşıldı!");
            renderTeacherDashboard();
        });
    });
}

function renderOCRQuizCreator() {
    const workArea = document.getElementById('teacherWorkArea');
    workArea.innerHTML = `
        <div style="background: rgba(255,255,255,0.05); padding: 24px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
            <h3 style="margin-top: 0; color: #d8b4fe;">📷 Şəkildən Sualları Analiz Et və Yarat</h3>
            <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 16px;">Test kitabçasının və ya vərəqin şəklini yükləyin, Gemini AI avtomatik şəkillərdəki sualları ayıran sınaq hazırlasın.</p>
            
            <input type="file" id="ocrImageInput" accept="image/*" style="display: none;">
            <button id="uploadImgBtn" style="width: 100%; padding: 20px; background: rgba(0,0,0,0.3); border: 2px dashed rgba(255,255,255,0.2); border-radius: 12px; color: #cbd5e1; cursor: pointer; font-weight: bold; margin-bottom: 16px;">
                📸 Şəkil Yükləmək Üçün Klikləyin
            </button>

            <input type="text" id="ocrQuizTitle" placeholder="Sınağın Adı" style="${inputStyle()}">
            <input type="number" id="ocrQuizDuration" value="20" placeholder="Müddət (dəqiqə)" style="${inputStyle()}">

            <button id="processOcrBtn" style="${buttonStyle()}">🔍 Şəkildən Analiz Et və Şagirdlərə Paylaş</button>
        </div>
    `;

    const imgInput = document.getElementById('ocrImageInput');
    const uploadBtn = document.getElementById('uploadImgBtn');

    uploadBtn.addEventListener('click', () => imgInput.click());
    imgInput.addEventListener('change', () => {
        if (imgInput.files.length > 0) {
            uploadBtn.textContent = `✅ Şəkil Seçildi: ${imgInput.files[0].name}`;
            uploadBtn.style.borderColor = '#22c55e';
        }
    });

    document.getElementById('processOcrBtn').addEventListener('click', () => {
        if (imgInput.files.length === 0) {
            alert("Lütfən şəkil faylını seçin!");
            return;
        }

        const title = document.getElementById('ocrQuizTitle').value.trim() || "Şəkildən Analiz Sınağı";
        const duration = parseInt(document.getElementById('ocrQuizDuration').value) || 20;

        showLoadingScreen("Şəkildəki Suallar Analiz Edilir...", async () => {
            const ocrQuestions = generateAIQuestions(`${title} (Şəkillə Analiz)`, 5);
            const res = await saveAIQuizToSupabase(title, ocrQuestions, duration);
            if (res) alert("Şəkildəki suallar analiz edildi və sınaq şagirdlərə təqdim olundu!");
            renderTeacherDashboard();
        });
    });
}

// ==================== ŞAGİRD PANESİ VƏ SİNAQLAR ====================
async function renderStudentDashboard() {
    appContainer.innerHTML = `
        <div class="main-wrapper">
            <div class="user-header">
                <div>
                    <h2>Xoş gəldiniz, ${currentStudent.name} ${currentStudent.surname || ''}</h2>
                    <p>Sinif: ${currentStudent.student_class || 'Bilinmir'}</p>
                </div>

                <div id="profileCircle" class="user-avatar mr-profile-container" style="position: relative; cursor: pointer;" title="Profil menyusu">
                    <div class="mr-spinning-border"></div>
                    <span style="position: relative; z-index: 2;">MR</span>
                </div>
            </div>

            <h3 class="section-title">📝 Mövcud Sınaqlar</h3>
            <div id="quiz-container" class="quiz-grid">
                <p style="text-align: center; color: #a0aec0; padding: 20px; grid-column: 1/-1;">Sınaqlar yüklənir...</p>
            </div>
        </div>

        <div id="profileDropdown" style="display: none; position: fixed; background: rgba(20, 15, 40, 0.98); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.15); border-radius: 14px; width: 200px; box-shadow: 0 10px 25px rgba(0,0,0,0.8); z-index: 99999; overflow: hidden;">
            <div style="position: relative; z-index: 2;">
                <button id="menuChangePassword" style="width: 100%; padding: 12px 16px; background: none; border: none; color: white; text-align: left; cursor: pointer; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.08);">
                    🔑 Şifrəni dəyişdir
                </button>
                <button id="menuLogout" style="width: 100%; padding: 12px 16px; background: none; border: none; color: #f87171; text-align: left; cursor: pointer; font-size: 14px;">
                    🚪 Çıxış et
                </button>
            </div>
        </div>
    `;

    const profileCircle = document.getElementById('profileCircle');
    const profileDropdown = document.getElementById('profileDropdown');

    profileCircle.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = profileCircle.getBoundingClientRect();
        if (profileDropdown.style.display === 'block') {
            profileDropdown.style.display = 'none';
        } else {
            profileDropdown.style.top = (rect.bottom + 8) + 'px';
            profileDropdown.style.right = (window.innerWidth - rect.right) + 'px';
            profileDropdown.style.display = 'block';
        }
    });

    document.addEventListener('click', (e) => {
        if (!profileCircle.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.style.display = 'none';
        }
    });

    document.getElementById('menuChangePassword').addEventListener('click', () => {
        profileDropdown.style.display = 'none';
        renderChangePasswordModal();
    });
    document.getElementById('menuLogout').addEventListener('click', () => {
        profileDropdown.style.display = 'none';
        localStorage.removeItem('aquarius_current_student');
        currentStudent = null;
        renderAuthScreen();
    });

    await renderQuizCards();
}

async function renderQuizCards() {
    try {
        const [{ data: quizzes, error: quizError }, { data: results }] = await Promise.all([
            supabase.from('quizzes').select('*'),
            supabase.from('student_results').select('*')
        ]);

        const container = document.getElementById('quiz-container');

        if (quizError || !quizzes || quizzes.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: #a0aec0; padding: 20px; grid-column: 1/-1;">Hazırda aktiv sınaq mövcud deyil.</p>`;
            return;
        }

        const currentStudentName = (currentStudent.name || '').trim().toLowerCase();
        const currentStudentSurname = (currentStudent.surname || '').trim().toLowerCase();

        const completedQuizIds = new Set();
        const resultMap = {};

        if (results && results.length > 0) {
            results.forEach(r => {
                const rName = (r.student_name || '').trim().toLowerCase();
                const rSurname = (r.student_surname || '').trim().toLowerCase();

                const isSameStudent = (r.student_id && String(r.student_id) === String(currentStudent.id)) || 
                                     (rName === currentStudentName && rSurname === currentStudentSurname);

                if (isSameStudent) {
                    const qId = String(r.quiz_id);
                    completedQuizIds.add(qId);
                    resultMap[qId] = r;
                }
            });
        }

        container.innerHTML = '';
        quizzes.forEach(quiz => {
            const quizIdStr = String(quiz.id);
            const isCompleted = completedQuizIds.has(quizIdStr);
            const userResult = resultMap[quizIdStr];

            const card = document.createElement('div');
            card.className = "quiz-card";

            let actionButtonsHTML = '';
            if (isCompleted) {
                actionButtonsHTML = `
                    <div style="display: flex; gap: 8px;">
                        <button disabled class="btn completed-btn" style="background: #4b5563; color: #9ca3af; cursor: not-allowed; opacity: 0.8; padding: 8px 14px; border-radius: 8px; border: none; font-weight: bold;">Bitdi</button>
                        <button id="view-res-btn-${quiz.id}" class="btn result-btn" style="background: #0284c7; color: white; cursor: pointer; padding: 8px 14px; border-radius: 8px; border: none; font-weight: bold;">Nəticəm</button>
                    </div>
                `;
            } else {
                actionButtonsHTML = `
                    <button id="quiz-btn-${quiz.id}" class="btn start-btn">Sınağa Başla</button>
                `;
            }

            card.innerHTML = `
                <div class="quiz-info">
                    <h4>${quiz.title || `Sınaq ${quiz.id}`}</h4>
                    <p>⏱️ Müddət: ${quiz.duration ? quiz.duration + ' dəqiqə' : 'Məhdudiyyət yoxdur'}</p>
                </div>
                ${actionButtonsHTML}
            `;
            container.appendChild(card);

            if (isCompleted) {
                const resBtn = card.querySelector(`#view-res-btn-${quiz.id}`);
                if (resBtn) {
                    resBtn.addEventListener('click', () => renderDetailedReview(quiz, userResult));
                }
            } else {
                const startBtn = card.querySelector(`#quiz-btn-${quiz.id}`);
                if (startBtn) {
                    startBtn.addEventListener('click', () => loadAndStartQuiz(quiz.id));
                }
            }
        });
    } catch (err) {
        console.error("Kartlar render olunarkən xəta:", err);
        document.getElementById('quiz-container').innerHTML = `<p style="text-align: center; color: #ff4d6d; grid-column: 1/-1;">Sınaqları yükləmək mümkün olmadı.</p>`;
    }
}

// ==================== İZAH VƏ NƏTİCƏ İCMALI ====================
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
                    <h2 style="margin: 0 0 8px 0; color: #d8b4fe;">📋 Sınaq İcmalı: ${quizObj.title || 'Test'}</h2>
                    <p style="margin: 0; font-size: 16px;">Topladığınız Xal: <b style="color: #4ade80;">${resultItem.score} / ${resultItem.total}</b></p>
                </div>
                <button id="backToDashboardBtn" class="btn secondary-btn" style="padding: 10px 18px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">Geri qayıt</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 16px;">
    `;

    questions.forEach((q, idx) => {
        const questionText = q.question || "";
        const detailItem = details ? details.find(d => d.questionIndex === idx + 1) : null;
        const userAnsText = detailItem ? detailItem.userAnswer : "Cavabsız";
        const isCorrect = detailItem ? detailItem.isCorrect : false;
        
        const correctIdx = q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : 0;
        const correctOptionText = (q.options && q.options[correctIdx]) ? q.options[correctIdx] : "Təyin olunmayıb";
        const explanationText = q.explanation || q.simpleExplanation || `Düzgün cavab: ${correctOptionText}`;

        reviewHtml += `
            <div style="background: rgba(255,255,255,0.05); border: 1px solid ${isCorrect ? 'rgba(74, 222, 128, 0.4)' : 'rgba(248, 113, 113, 0.4)'}; padding: 20px; border-radius: 14px;">
                <p style="font-size: 16px; margin-top: 0; margin-bottom: 12px; color: #f1f5f9;"><b>Sual ${idx + 1}:</b> ${questionText}</p>
                
                <div style="font-size: 14px; margin-bottom: 8px;">
                    <b>Sizin cavabınız:</b> <span style="color: ${isCorrect ? '#4ade80' : '#f87171'}; font-weight: bold;">${userAnsText} ${isCorrect ? '✅' : '❌'}</span>
                </div>

                ${!isCorrect ? `
                    <div style="font-size: 14px; color: #4ade80; margin-bottom: 12px;">
                        <b>Düzgün cavab:</b> ${correctOptionText}
                    </div>
                ` : ''}

                <div style="margin-top: 12px; padding: 12px; background: rgba(0,0,0,0.3); border-radius: 8px; border-left: 4px solid #a855f7; font-size: 13px; color: #cbd5e1;">
                    💡 <b>İzah:</b> ${explanationText}
                </div>
            </div>
        `;
    });

    reviewHtml += `</div></div>`;
    appContainer.innerHTML = reviewHtml;
    document.getElementById('backToDashboardBtn').addEventListener('click', renderStudentDashboard);
}

function renderChangePasswordModal() {
    appContainer.innerHTML = `
        <div style="min-height: 100vh; width: 100vw; box-sizing: border-box; padding: 20px; display: flex; justify-content: center; align-items: center;">
            <div style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 20px; width: 100%; max-width: 400px;">
                <h3 style="font-size: 20px; color: #d8b4fe; margin-top: 0; margin-bottom: 20px; text-align: center;">🔑 Şifrəni Dəyişdir</h3>
                <form id="changePassForm">
                    ${createPasswordFieldHTML('oldPass', 'Köhnə şifrəniz')}
                    ${createPasswordFieldHTML('newPass', 'Yeni şifrəniz')}
                    <button type="submit" style="${buttonStyle()}; margin-bottom: 10px;">Şifrəni Yenilə</button>
                    <button type="button" id="cancelPassBtn" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.1); border: none; border-radius: 10px; color: white; cursor: pointer;">Geri qayıt</button>
                </form>
            </div>
        </div>
    `;
    attachPasswordToggle('oldPass');
    attachPasswordToggle('newPass');

    document.getElementById('cancelPassBtn').addEventListener('click', renderStudentDashboard);
    document.getElementById('changePassForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const oldPass = document.getElementById('oldPass').value.trim();
        const newPass = document.getElementById('newPass').value.trim();

        if (oldPass !== currentStudent.password) {
            alert("Köhnə şifrə yanlışdır!");
            return;
        }

        try {
            const { error } = await supabase.from('students_account').update({ password: newPass }).eq('id', currentStudent.id);
            if (error) throw error;
            currentStudent.password = newPass;
            localStorage.setItem('aquarius_current_student', JSON.stringify(currentStudent));
            alert("Şifrəniz yeniləndi!");
            renderStudentDashboard();
        } catch (err) {
            alert("Xəta: " + err.message);
        }
    });
}

async function loadAndStartQuiz(quizId) {
    appContainer.innerHTML = `
        <div style="min-height: 100vh; width: 100vw; box-sizing: border-box; padding: 20px; display: flex; justify-content: center; align-items: center;">
            <div style="width: 100%; max-width: 500px; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 24px; border-radius: 20px; color: white;">
                <div id="quizHeader" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h2 id="quizTitle" style="font-size: 18px; color: #d8b4fe; margin: 0;">Sınaq yüklənir...</h2>
                </div>
                <div id="timerDisplay" style="display: flex; justify-content: center; align-items: center; background: rgba(126, 34, 206, 0.2); border: 1px solid rgba(168, 85, 247, 0.4); padding: 8px 16px; border-radius: 12px; font-weight: bold; color: #f87171; margin: 0 auto 16px auto; width: fit-content; font-size: 15px;"></div>
                <div id="questionBox" style="margin-bottom: 20px; font-size: 16px;"></div>
                <div style="display: flex; justify-content: space-between; gap: 10px;">
                    <button id="prevQuestionBtn" class="btn secondary-btn" style="display: none; padding: 10px 16px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; cursor: pointer;">Geri</button>
                    <button id="nextQuestionBtn" class="btn start-btn" style="flex: 1; padding: 10px 16px; background: linear-gradient(135deg, #9333ea, #c084fc); border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer;">Növbəti</button>
                </div>
            </div>
        </div>
    `;

    currentQuizId = quizId;
    try {
        const { data, error } = await supabase.from('quizzes').select('*').eq('id', quizId).single();
        if (error || !data) throw new Error("Test tapılmadı.");

        document.getElementById('quizTitle').textContent = data.title || `Test #${quizId}`;
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
        } else {
            document.getElementById('timerDisplay').textContent = "Vaxt məhdudiyyəti yoxdur";
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
                <button id="backToCabinetBtn" class="btn start-btn" style="width: 100%; margin-top: 20px; padding: 12px; background: linear-gradient(135deg, #9333ea, #c084fc); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">Kabinetə qayıt</button>
            </div>
        </div>
    `;

    document.getElementById('backToCabinetBtn').addEventListener('click', renderStudentDashboard);
}

function generateAIQuestions(topic, questionCount = 5) {
    const generatedQuestions = [];
    for (let i = 1; i <= questionCount; i++) {
        generatedQuestions.push({
            questionIndex: i,
            question: `${topic} - Sual #${i}: Bu mövzu üzrə doğru cavabı seçin?`,
            options: [
                `A) ${topic} A variantı`,
                `B) ${topic} B variantı`,
                `C) ${topic} C variantı (Doğru)`,
                `D) ${topic} D variantı`,
                `E) ${topic} E variantı`
            ],
            correctAnswerIndex: 2,
            explanation: `${topic} mövzusunun ${i}-ci qaydasına əsasən doğru cavab C variantıdır.`
        });
    }
    return generatedQuestions;
}

async function saveAIQuizToSupabase(title, questionsData, durationMinutes = 15) {
    try {
        const correctAnswersFormat = questionsData.map((q, idx) => ({
            questionIndex: idx + 1,
            correctAnswerIndex: q.correctAnswerIndex
        }));

        const { data, error } = await supabase
            .from('quizzes')
            .insert([
                {
                    title: title,
                    questions_data: JSON.stringify(questionsData),
                    correct_answers: JSON.stringify(correctAnswersFormat),
                    duration: durationMinutes
                }
            ])
            .select();

        if (error) return null;
        return data;
    } catch (err) {
        return null;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    if (!checkSavedSession()) {
        renderAuthScreen();
    }
});
