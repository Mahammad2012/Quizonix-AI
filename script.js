import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://ebsqtjibhhckbciltzfb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVic3F0amliaGhja2JjaWx0emZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5OTUyNjUsImV4cCI6MjEwMDU3MTI2NX0.FNMjDFVakfNZxp758wrIPTXQRww6p8DgipsGwMeV0do';
const supabase = createClient(supabaseUrl, supabaseKey);

const appContainer = document.getElementById('appContainer') || document.body;

function applyGlobalStyles() {
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.background = 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    document.body.style.color = 'white';
}
applyGlobalStyles();

let currentStudent = null;
let currentQuizId = null;
let currentQuizData = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let timerInterval = null;
let timeLeft = 0;

function renderAuthScreen() {
    appContainer.innerHTML = `
        <div style="min-height: 100vh; width: 100vw; display: flex; justify-content: center; align-items: center; box-sizing: border-box; padding: 20px;">
            <div style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 20px; width: 100%; max-width: 420px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="font-size: 26px; font-weight: 700; color: #d8b4fe; margin-bottom: 8px;">🎓 Aquarius Kviz AI</h1>
                    <p style="font-size: 14px; color: #cbd5e1;">Zəhmət olmasa hesabınıza daxil olun və ya qeydiyyatdan keçin</p>
                </div>

                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <button id="showLoginTab" style="flex: 1; padding: 10px; background: #7e22ce; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">Giriş</button>
                    <button id="showRegisterTab" style="flex: 1; padding: 10px; background: rgba(255,255,255,0.1); color: #cbd5e1; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">Qeydiyyat</button>
                </div>

                <div id="formContainer"></div>
            </div>
        </div>
    `;

    document.getElementById('showLoginTab').addEventListener('click', (e) => {
        e.target.style.background = '#7e22ce';
        e.target.style.color = 'white';
        document.getElementById('showRegisterTab').style.background = 'rgba(255,255,255,0.1)';
        document.getElementById('showRegisterTab').style.color = '#cbd5e1';
        renderLoginForm();
    });

    document.getElementById('showRegisterTab').addEventListener('click', (e) => {
        e.target.style.background = '#7e22ce';
        e.target.style.color = 'white';
        document.getElementById('showLoginTab').style.background = 'rgba(255,255,255,0.1)';
        document.getElementById('showLoginTab').style.color = '#cbd5e1';
        renderRegisterForm();
    });

    renderLoginForm();
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
            <input type="password" id="${id}" placeholder="${placeholder}" required style="width: 100%; padding: 12px 45px 12px 45px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; color: white; font-size: 14px; outline: none; box-sizing: border-box; text-align: center;">
            <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.5); font-size: 14px; user-select: none;">...</span>
            <span id="toggle_${id}" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); cursor: pointer; font-size: 13px; font-weight: 600; background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 6px; user-select: none; color: #d8b4fe;" title="Şifrəni göstər/gizlət">123</span>
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
            } else {
                input.type = "password";
                toggle.style.background = "rgba(255,255,255,0.1)";
                toggle.style.color = "#d8b4fe";
            }
        });
    }
}

function showLoadingScreen(message, callback) {
    appContainer.innerHTML = `
        <div style="min-height: 100vh; width: 100vw; display: flex; flex-direction: column; justify-content: center; align-items: center; box-sizing: border-box;">
            <div style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 40px; border-radius: 20px; text-align: center; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);">
                <div style="border: 4px solid rgba(255, 255, 255, 0.1); border-top: 4px solid #c084fc; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px auto;"></div>
                <h3 style="font-size: 18px; color: #d8b4fe; margin: 0;">${message}</h3>
            </div>
        </div>
        <style>
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
    `;
    setTimeout(callback, 2000);
}

function renderLoginForm() {
    const container = document.getElementById('formContainer');
    container.innerHTML = `
        <form id="loginForm">
            <input type="text" id="loginName" placeholder="Adınız" required style="${inputStyle()}">
            <input type="text" id="loginSurname" placeholder="Soyadınız" required style="${inputStyle()}">
            ${createPasswordFieldHTML('loginPassword', 'Şifrəniz')}
            <button type="submit" style="${buttonStyle()}">Daxil Ol</button>
        </form>
    `;
    attachPasswordToggle('loginPassword');

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('loginName').value.trim();
        const surname = document.getElementById('loginSurname').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        showLoadingScreen("Yüklənir...", async () => {
            try {
                const { data, error } = await supabase
                    .from('students_account')
                    .select('*')
                    .eq('name', name)
                    .eq('surname', surname)
                    .eq('password', password)
                    .single();

                if (error || !data) {
                    alert("Ad, Soyad və ya şifrə yanlışdır!");
                    renderAuthScreen();
                    return;
                }

                currentStudent = data;
                renderStudentDashboard();
            } catch (err) {
                alert("Giriş zamanı xəta baş verdi.");
                renderAuthScreen();
            }
        });
    });
}

function renderRegisterForm() {
    const container = document.getElementById('formContainer');
    container.innerHTML = `
        <form id="registerForm">
            <input type="text" id="regName" placeholder="Adınız" required style="${inputStyle()}">
            <input type="text" id="regSurname" placeholder="Soyadınız" required style="${inputStyle()}">
            <input type="text" id="regClass" placeholder="Sinfiniz (məsələn: 10A)" required style="${inputStyle()}">
            ${createPasswordFieldHTML('regPassword', 'Şifrə yarat')}
            <button type="submit" style="${buttonStyle()}">Qeydiyyatdan Keç</button>
        </form>
    `;
    attachPasswordToggle('regPassword');

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
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
                    .eq('name', name)
                    .eq('surname', surname)
                    .single();

                if (existing) {
                    alert("Bu ad və soyadla artıq hesab mövcuddur. Zəhmət olmasa daxil olun.");
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
                renderStudentDashboard();
            } catch (err) {
                alert("Qeydiyyat xətası: " + err.message);
                renderAuthScreen();
            }
        });
    });
}

async function renderStudentDashboard() {
    const initials = (currentStudent.name.charAt(0) + currentStudent.surname.charAt(0)).toUpperCase();

    appContainer.innerHTML = `
        <div style="min-height: 100vh; width: 100vw; box-sizing: border-box; padding: 20px; display: flex; flex-direction: column; align-items: center;">
            <div style="width: 100%; max-width: 500px;">
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); padding: 16px 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px;">
                    <div>
                        <h2 style="font-size: 18px; color: #d8b4fe; margin: 0 0 4px 0;">Xoş gəldiniz, ${currentStudent.name} ${currentStudent.surname}</h2>
                        <p style="font-size: 13px; color: #94a3b8; margin: 0;">Sinif: ${currentStudent.student_class}</p>
                    </div>

                    <div>
                        <div id="profileCircle" style="width: 45px; height: 45px; background: linear-gradient(135deg, #7e22ce, #a855f7); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 16px; cursor: pointer; border: 2px solid rgba(255,255,255,0.2);">
                            ${initials}
                        </div>
                    </div>
                </div>

                <h3 style="font-size: 18px; margin-bottom: 16px; color: #e2e8f0;">📝 Mövcud Sınaqlar</h3>
                <div id="quizzesList" style="display: flex; flex-direction: column; gap: 12px;">
                    <p style="text-align: center; color: #94a3b8; padding: 20px;">Sınaqlar yüklənir...</p>
                </div>
            </div>
        </div>
        
        <div id="profileDropdown" style="display: none; position: fixed; background: rgba(20, 15, 40, 0.98); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; width: 180px; box-shadow: 0 10px 25px rgba(0,0,0,0.8); z-index: 99999; overflow: hidden;">
            <button id="menuMyResults" style="width: 100%; padding: 12px 16px; background: none; border: none; color: white; text-align: left; cursor: pointer; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.08);">📊 Nəticələrim</button>
            <button id="menuChangePassword" style="width: 100%; padding: 12px 16px; background: none; border: none; color: white; text-align: left; cursor: pointer; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.08);">🔑 Şifrəni dəyişdir</button>
            <button id="menuLogout" style="width: 100%; padding: 12px 16px; background: none; border: none; color: #f87171; text-align: left; cursor: pointer; font-size: 14px;">🚪 Çıxış et</button>
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

    document.getElementById('menuMyResults').addEventListener('click', () => {
        profileDropdown.style.display = 'none';
        renderStudentResultsView();
    });
    document.getElementById('menuChangePassword').addEventListener('click', () => {
        profileDropdown.style.display = 'none';
        renderChangePasswordModal();
    });
    document.getElementById('menuLogout').addEventListener('click', () => {
        profileDropdown.style.display = 'none';
        currentStudent = null;
        renderAuthScreen();
    });

    try {
        const { data: quizzes, error } = await supabase.from('quizzes').select('id, title, duration');
        const listContainer = document.getElementById('quizzesList');

        if (error || !quizzes || quizzes.length === 0) {
            listContainer.innerHTML = `<p style="text-align: center; color: #94a3b8; background: rgba(255,255,255,0.03); padding: 20px; border-radius: 12px;">Hazırda aktiv sınaq mövcud deyil.</p>`;
            return;
        }

        listContainer.innerHTML = '';
        quizzes.forEach(quiz => {
            const card = document.createElement('div');
            // Sınaq kartı düzbucaqlı formada və daha yığcam (mütənasib) edilməsi üçün padding və struktur tənzimləndi
            card.style.cssText = "background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 16px 20px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box;";
            card.innerHTML = `
                <div>
                    <h4 style="font-size: 15px; font-weight: 600; color: #f1f5f9; margin: 0 0 4px 0;">${quiz.title || `Test #${quiz.id}`}</h4>
                    <p style="font-size: 13px; color: #a78bfa; margin: 0;">⏱️ Müddət: ${quiz.duration ? quiz.duration + ' dəqiqə' : 'Məhdudiyyət yoxdur'}</p>
                </div>
                <button data-id="${quiz.id}" class="startQuizBtn" style="padding: 8px 16px; background: #7e22ce; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap;">Sınağa Başla</button>
            `;
            listContainer.appendChild(card);
        });

        document.querySelectorAll('.startQuizBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                loadAndStartQuiz(e.target.getAttribute('data-id'));
            });
        });
    } catch (err) {
        document.getElementById('quizzesList').innerHTML = `<p style="text-align: center; color: #f87171;">Sınaqları yükləmək mümkün olmadı.</p>`;
    }
}

async function renderStudentResultsView() {
    appContainer.innerHTML = `
        <div style="min-height: 100vh; width: 100vw; box-sizing: border-box; padding: 20px; display: flex; flex-direction: column; align-items: center;">
            <div style="width: 100%; max-width: 500px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 style="font-size: 20px; color: #d8b4fe; margin: 0;">📊 Sənin Nəticələrin</h2>
                    <button id="backToDashboard" style="padding: 8px 16px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 8px; cursor: pointer; font-weight: 600;">Kabinetə qayıt</button>
                </div>
                <div id="resultsContainer" style="display: flex; flex-direction: column; gap: 16px;">
                    <p style="text-align: center; color: #94a3b8; padding: 20px;">Nəticələr yüklənir...</p>
                </div>
            </div>
        </div>
    `;

    document.getElementById('backToDashboard').addEventListener('click', renderStudentDashboard);

    try {
        const { data: results, error } = await supabase
            .from('student_results')
            .select('*')
            .eq('student_name', currentStudent.name)
            .eq('student_surname', currentStudent.surname);

        const container = document.getElementById('resultsContainer');
        if (error || !results || results.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: #94a3b8; background: rgba(255,255,255,0.03); padding: 20px; border-radius: 12px;">Hələ ki, heç bir sınaq nəticəniz yoxdur.</p>`;
            return;
        }

        container.innerHTML = '';
        results.forEach(res => {
            const percent = Math.round((res.score / res.total) * 100);

            let detailsParsed = [];
            try {
                detailsParsed = typeof res.details_json === 'string' ? JSON.parse(res.details_json) : res.details_json;
            } catch(e) {}

            let correctCount = res.score;
            let incorrectCount = res.total - res.score;
            let blankCount = 0;

            if (Array.isArray(detailsParsed)) {
                correctCount = detailsParsed.filter(d => d.isCorrect).length;
                incorrectCount = detailsParsed.filter(d => !d.isCorrect && d.userAnswer !== "Cavabsız").length;
                blankCount = detailsParsed.filter(d => d.userAnswer === "Cavabsız").length;
            }

            const card = document.createElement('div');
            card.style.cssText = "background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 16px; display: flex; align-items: center; justify-content: space-between; gap: 20px;";
            
            card.innerHTML = `
                <div>
                    <h4 style="font-size: 16px; font-weight: 600; color: #f1f5f9; margin: 0 0 8px 0;">Test ID: #${res.quiz_id}</h4>
                    <p style="font-size: 14px; color: #cbd5e1; margin: 0 0 4px 0;">Nəticə: <b>${res.score} / ${res.total}</b></p>
                    <div style="font-size: 12px; color: #94a3b8; display: flex; gap: 12px; margin-top: 8px;">
                        <span style="color: #4ade80;">✅ Düz: ${correctCount}</span>
                        <span style="color: #f87171;">❌ Səhv: ${incorrectCount}</span>
                        <span style="color: #fbbf24;">⚪ Boş: ${blankCount}</span>
                    </div>
                </div>
                <div style="width: 65px; height: 65px; border-radius: 50%; background: conic-gradient(#7e22ce ${percent}%, rgba(255,255,255,0.1) 0%); display: flex; justify-content: center; align-items: center; position: relative;">
                    <div style="width: 53px; height: 53px; background: #18152e; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 13px; font-weight: bold; color: #d8b4fe;">
                        ${percent}%
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        document.getElementById('resultsContainer').innerHTML = `<p style="text-align: center; color: #f87171;">Nəticələri yükləmək mümkün olmadı.</p>`;
    }
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
                    <button type="button" id="cancelPassBtn" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.1); border: none; border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">Geri qayıt</button>
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
            const { error } = await supabase
                .from('students_account')
                .update({ password: newPass })
                .eq('id', currentStudent.id);

            if (error) throw error;

            currentStudent.password = newPass;
            alert("Şifrəniz uğurla yeniləndi!");
            renderStudentDashboard();
        } catch (err) {
            alert("Xəta baş verdi: " + err.message);
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
                <div id="questionBox" style="margin-bottom: 20px; font-size: 16px; line-height: 1.5;"></div>
                <div style="display: flex; justify-content: space-between; gap: 10px;">
                    <button id="prevQuestionBtn" style="flex: 1; padding: 10px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; display: none;">Geri</button>
                    <button id="nextQuestionBtn" style="flex: 1; padding: 10px; background: #7e22ce; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">Növbəti</button>
                </div>
            </div>
        </div>
    `;

    currentQuizId = quizId;
    try {
        const { data, error } = await supabase
            .from('quizzes')
            .select('title, questions_data, duration')
            .eq('id', quizId)
            .single();

        if (error || !data) throw new Error("Test tapılmadı.");

        document.getElementById('quizTitle').textContent = data.title || `Test #${quizId}`;

        let parsedData = data.questions_data;
        if (typeof parsedData === 'string') {
            try { parsedData = JSON.parse(parsedData); } catch(e) {}
        }

        currentQuizData = Array.isArray(parsedData) ? parsedData : [];
        if (currentQuizData.length === 0) throw new Error("Bu testdə suallar yoxdur.");

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
            alert("Vaxt bitdi! Sınaq avtomatik təqdim olunur.");
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
    const options = Array.isArray(q.options || q.choices || q.variants) ? (q.options || q.choices || q.variants) : [];

    options.forEach((opt, index) => {
        const isSelected = userAnswers[currentQuestionIndex] === index ? "background: rgba(126, 34, 206, 0.5); border-color: #a855f7;" : "background: rgba(0,0,0,0.2); border-color: rgba(255,255,255,0.1);";
        optionsHtml += `<button class="option-btn" data-index="${index}" style="width: 100%; text-align: left; padding: 12px 16px; margin-bottom: 10px; ${isSelected} border-radius: 10px; color: white; border-style: solid; border-width: 1px; cursor: pointer; transition: 0.2s; box-sizing: border-box;">${opt}</button>`;
    });

    const questionText = q.question || q.text || q.prompt || q.title || (typeof q === 'string' ? q : "");

    document.getElementById('questionBox').innerHTML = `
        <p style="margin-bottom: 8px; font-weight: 600; font-size: 13px; color: #d8b4fe;">Sual ${currentQuestionIndex + 1} / ${currentQuizData.length}</p>
        <p style="margin-bottom: 16px; font-size: 15px;">${questionText}</p>
        <div>${optionsHtml}</div>
    `;

    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.getAttribute('data-index'));
            userAnswers[currentQuestionIndex] = idx;
            renderQuestion();
        });
    });

    const prevBtn = document.getElementById('prevQuestionBtn');
    prevBtn.style.display = currentQuestionIndex === 0 ? "none" : "block";
    document.getElementById('nextQuestionBtn').textContent = currentQuestionIndex === currentQuizData.length - 1 ? "Bitir" : "Növbəti";
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
        const correctAnsIdx = q.correctAnswer !== undefined ? q.correctAnswer : q.correct;
        const isCorrect = userAnsIdx === correctAnsIdx;
        if (isCorrect) score++;

        const rawOptions = q.options || q.choices || q.variants || [];
        details.push({
            questionIndex: idx + 1,
            userAnswer: userAnsIdx !== undefined ? (rawOptions[userAnsIdx] || "Cavab seçilib") : "Cavabsız",
            isCorrect: isCorrect
        });
    });

    try {
        await supabase.from('student_results').insert([
            {
                quiz_id: parseInt(currentQuizId) || 0,
                student_name: currentStudent.name,
                student_surname: currentStudent.surname,
                student_class: currentStudent.student_class,
                score: score,
                total: total,
                details_json: JSON.stringify(details)
            }
        ]);
    } catch (err) {
        console.error("Nəticə yazılarkən xəta:", err);
    }

    appContainer.innerHTML = `
        <div style="min-height: 100vh; width: 100vw; box-sizing: border-box; padding: 20px; display: flex; justify-content: center; align-items: center;">
            <div style="width: 100%; max-width: 450px; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 20px; text-align: center; color: white;">
                <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 12px; color: #a855f7;">🎉 Sınaq Tamamlandı!</h2>
                <div style="background: rgba(126, 34, 206, 0.2); border: 1px solid rgba(168, 85, 247, 0.4); padding: 16px; border-radius: 12px; margin-bottom: 20px;">
                    <p style="font-size: 16px; margin-bottom: 6px;">İştirakçı: <b>${currentStudent.name} ${currentStudent.surname} (${currentStudent.student_class})</b></p>
                    <p style="font-size: 20px; font-weight: bold; color: #4ade80;">Nəticə: ${score} / ${total}</p>
                </div>
                <button id="backToCabinetBtn" style="padding: 12px 24px; background: #7e22ce; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; width: 100%;">Kabinetə qayıt</button>
            </div>
        </div>
    `;

    document.getElementById('backToCabinetBtn').addEventListener('click', renderStudentDashboard);
}

window.addEventListener('DOMContentLoaded', () => {
    renderAuthScreen();
});
