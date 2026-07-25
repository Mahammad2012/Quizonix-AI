// Supabase-dən testlərin siyahısını çəkmək
document.getElementById("fetchQuizListBtn").addEventListener("click", async () => {
    const container = document.getElementById("quizListContainer");
    container.innerHTML = "Yüklənir...";

    try {
        const response = await fetch('/api/get-quizzes'); // Supabase-dən oxuyan endpoint və ya birbaşa client
        // Qeyd: Əgər birbaşa Supabase client istifadə edirsinizsə:
        // const { data, error } = await supabase.from('quizzes').select('id, title, created_at');
        
        // Alternativ olaraq serverdə handler yarada bilərsiniz, yaxud birbaşa frontend-dən Supabase çağırabilərsiniz:
        const { data, error } = await window.supabaseClient.from('quizzes').select('id, title, created_at');

        if (error) throw error;

        container.innerHTML = "";
        if (!data || data.length === 0) {
            container.innerHTML = "<p style='color: #94a3b8;'>Heç bir test tapılmadı.</p>";
            return;
        }

        data.forEach(q => {
            const item = document.createElement("div");
            item.className = "quiz-list-item";
            item.innerHTML = `<span>ID: ${q.id} - ${q.title}</span> <span style="font-size: 12px; color: #94a3b8;">${new Date(q.created_at).toLocaleDateString()}</span>`;
            item.onclick = () => loadQuizFromDatabase(q.id);
            container.appendChild(item);
        });

    } catch (err) {
        container.innerHTML = `<p style='color: #ef4444;'>Xəta: ${err.message}</p>`;
    }
});

// ID vasitəsilə konkret testi bazadan çağırıb ekranda açmaq
document.getElementById("loadQuizByIdBtn").addEventListener("click", () => {
    const id = document.getElementById("quizIdInput").value.trim();
    if (!id) return alert("Zəhmət olmasa Test ID daxil edin!");
    loadQuizFromDatabase(id);
});

async function loadQuizFromDatabase(quizId) {
    loading.classList.remove("hidden");
    quizContainer.classList.add("hidden");

    try {
        const { data, error } = await window.supabaseClient
            .from('quizzes')
            .select('questions_data')
            .eq('id', quizId)
            .single();

        if (error || !data) throw new Error("Test tapılmadı və ya xəta baş verdi.");

        generatedQuiz = data.questions_data;
        renderQuiz(generatedQuiz);

    } catch (err) {
        alert("Xəta: " + err.message);
    } finally {
        loading.classList.add("hidden");
    }
}
