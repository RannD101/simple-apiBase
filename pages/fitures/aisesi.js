const fs = require("fs");
const path = require("path");

// Direktori untuk menyimpan sesi
const sessionsDir = path.join(__dirname, "sessions");

// Pastikan folder sesi ada
if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir);
}

// Fungsi untuk membaca atau membuat sesi
function getSession(sessionId) {
    const sessionFile = path.join(sessionsDir, `${sessionId}.json`);
    if (fs.existsSync(sessionFile)) {
        const sessionData = JSON.parse(fs.readFileSync(sessionFile, "utf-8"));
        return sessionData.messages || [];
    }
    return [];
}

// Fungsi untuk menyimpan sesi
function saveSession(sessionId, messages) {
    const sessionFile = path.join(sessionsDir, `${sessionId}.json`);
    const sessionData = {
        createdAt: Date.now(),
        messages,
    };
    fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
}

// Fungsi untuk menghapus sesi lama
function deleteOldSessions() {
    const now = Date.now();
    const sessionFiles = fs.readdirSync(sessionsDir);

    sessionFiles.forEach((file) => {
        const sessionFilePath = path.join(sessionsDir, file);
        const sessionData = JSON.parse(fs.readFileSync(sessionFilePath, "utf-8"));
        if (sessionData.createdAt && now - sessionData.createdAt > 24 * 60 * 60 * 1000) {
            fs.unlinkSync(sessionFilePath);
            console.log(`Deleted old session: ${file}`);
        }
    });
}

// Fungsi untuk memuat modul OpenAI secara dinamis
async function loadOpenAI() {
    try {
        // Dynamic import untuk modul ESM
        const openaiModule = await import("openai");
        return openaiModule.OpenAI;
    } catch (error) {
        console.error("Error loading OpenAI module:", error);
        throw error;
    }
}

// Fungsi utama untuk menangani AI
async function handleAI(prompt, sessionId) {
    try {
        // Muat modul OpenAI
        const OpenAI = await loadOpenAI();

        // Inisialisasi OpenAI
        const openai = new OpenAI({
            apiKey: "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", // Ganti dengan API key kamu
        });

        // Ambil atau buat sesi
        const messages = getSession(sessionId);

        // Tambahkan prompt user ke sesi
        messages.push({ role: "user", content: prompt });

        // Kirim permintaan ke OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: "Kamu adalah asisten AI yang ramah dan informatif." },
                ...messages,
            ],
        });

        const responseText = response.choices[0].message.content;

        // Tambahkan respons AI ke sesi
        messages.push({ role: "assistant", content: responseText });

        // Simpan sesi
        saveSession(sessionId, messages);

        return {
            status: true,
            response: responseText,
        };
    } catch (error) {
        console.error("Error generating AI response:", error);
        return {
            status: false,
            error: error.message,
        };
    }
}

// Panggil pembersihan sesi setiap 1 jam
setInterval(() => {
    deleteOldSessions();
}, 60 * 60 * 1000); // Setiap 1 jam

// Contoh penggunaan
(async () => {
    const prompt = "Apa itu AI?";
    const sessionId = "abc123xyz"; // ID sesi contoh
    const result = await handleAI(prompt, sessionId);

    console.log(result);
})();
