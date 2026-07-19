---
read_when:
    - Merancang asisten orientasi macOS
    - Menerapkan penyiapan autentikasi atau identitas
sidebarTitle: 'Onboarding: macOS App'
summary: Alur penyiapan saat pertama kali dijalankan untuk OpenClaw (aplikasi macOS)
title: Orientasi awal (aplikasi macOS)
x-i18n:
    generated_at: "2026-07-19T05:36:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 19527a001bf4e06a214a03872d1a60f66cc90067dbebf87a7798eb46ff0260d5
    source_path: start/onboarding.md
    workflow: 16
---

Alur penggunaan pertama aplikasi macOS: pilih lokasi Gateway dijalankan, hubungkan backend AI terverifikasi, berikan izin, lalu serahkan prosesnya ke ritual bootstrap milik agen.
Untuk onboarding CLI dan perbandingan kedua jalur tersebut, lihat [Ikhtisar Onboarding](/id/start/onboarding-overview).

<Steps>
<Step title="Setujui peringatan macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Izinkan pencarian jaringan lokal">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Sambutan dan pemberitahuan keamanan">
<Frame caption="Baca pemberitahuan keamanan yang ditampilkan dan tentukan tindakan yang sesuai">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Model kepercayaan keamanan:

- Secara default, OpenClaw adalah agen pribadi: satu batas operator tepercaya.
- Penyiapan bersama/multipengguna perlu diperketat: pisahkan batas kepercayaan, minimalkan akses alat, dan ikuti panduan [Keamanan](/id/gateway/security).
- Onboarding lokal secara default menetapkan konfigurasi baru ke `tools.profile: "coding"` agar penyiapan baru tetap memiliki alat sistem berkas/runtime tanpa profil `full` yang tidak dibatasi.
- Jika hook/webhook atau umpan konten tidak tepercaya lainnya diaktifkan, gunakan tingkat model modern yang andal serta pertahankan kebijakan alat dan sandboxing yang ketat.

</Step>
<Step title="Lokal vs Jarak Jauh">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Di mana **Gateway** dijalankan?

- **Mac Ini (Hanya lokal):** onboarding mengonfigurasi autentikasi dan menulis kredensial secara lokal.
- **Jarak Jauh (melalui SSH/Tailnet):** onboarding **tidak** mengonfigurasi autentikasi lokal;
  kredensial harus sudah tersedia di host Gateway. Kolom token Gateway jarak jauh
  menyimpan token yang digunakan aplikasi macOS untuk terhubung ke Gateway tersebut;
  nilai SecretRef `gateway.remote.token` yang ada dipertahankan hingga Anda
  menggantinya.
- **Konfigurasikan nanti:** lewati penyiapan dan biarkan aplikasi belum dikonfigurasi.

<Tip>
**Kiat autentikasi Gateway:**

- Mode autentikasi Gateway secara default ditetapkan ke `token` bahkan untuk binding loopback, sehingga klien WS lokal harus melakukan autentikasi.
- Menetapkan `gateway.auth.mode: "none"` memungkinkan proses lokal apa pun terhubung; gunakan hanya pada mesin yang sepenuhnya tepercaya.
- Gunakan token untuk akses multimesin atau binding non-loopback.

</Tip>
</Step>
<Step title="CLI">
  Penyiapan lokal menginstal CLI global `openclaw` melalui npm, pnpm, atau bun,
  dengan memprioritaskan npm. Node tetap menjadi runtime yang direkomendasikan untuk
  Gateway itu sendiri. Instalasi kompatibel yang sudah ada akan digunakan kembali.
</Step>
<Step title="Hubungkan AI Anda">
  Gateway terhubung yang sudah memiliki model agen terkonfigurasi akan melewati
  halaman ini sepenuhnya dan membuka UI agen normal. Penyiapan OpenClaw dan penyedia
  hanya dijalankan untuk Gateway baru atau yang belum lengkap.

Setelah Gateway siap, onboarding mencari akses AI yang sudah Anda miliki:
login Claude Code atau Codex, `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`, atau
model berkemampuan alat yang sudah terinstal di server Ollama atau LM Studio
yang dapat dijangkau. Deteksi dijalankan di host Gateway, termasuk ketika aplikasi
macOS terhubung ke Gateway Linux. Opsi terbaik diuji dengan penyelesaian nyata dan
hanya disimpan setelah berhasil merespons; ketika pengujian gagal, aplikasi secara
otomatis mencoba opsi berikutnya dan menampilkan alasan kegagalan opsi sebelumnya.
Jika ditemukan beberapa opsi, Anda dapat beralih di antaranya sebelum melanjutkan.
Penemuan lokal otomatis tidak pernah menarik atau mengunduh model.

Untuk menggunakan langganan Claude ketika host Gateway tidak memiliki login Claude CLI,
jalankan `claude setup-token` pada mesin mana pun yang telah menginstal Claude Code, lalu
tempelkan token yang dicetak sebagai **Anthropic setup-token** di bagian **Hubungkan
dengan kunci API atau token**.

CLI Gemini, Antigravity, Pi, dan OpenCode yang terinstal ditampilkan sebagai konteks
ketika tidak dapat dipilih sebagai jalur inferensi penyiapan terpandu yang dapat digunakan
kembali. Gemini dan Antigravity tidak dapat memberlakukan pemeriksaan inferensi tanpa alat.
Pi dan OpenCode adalah harness agen lengkap, bukan jalur inferensi penyiapan; integrasi
sesinya memerlukan penyiapan runtime dan plugin secara terpisah.

Anda juga dapat masuk melalui alur OAuth atau pemasangan perangkat milik penyedia.
Pilihan bawaan mencakup OpenAI/ChatGPT, OpenRouter, GitHub Copilot, Google
Gemini CLI, xAI, MiniMax Global dan CN, serta Chutes. Daftar tersebut berasal dari
plugin penyedia inferensi teks aktif milik Gateway, bukan daftar aplikasi tetap,
sehingga penyedia lain dapat ikut serta tanpa menambahkan kode macOS khusus penyedia.

Pemilih kunci/token manual menggunakan registri penyedia yang sama. Dalam setiap jalur,
penyedia memasok model awal dan konfigurasinya; OpenClaw memverifikasi
kredensial dengan pengujian langsung yang sama sebelum menyimpan profil autentikasinya.
Tombol Berikutnya tetap terkunci hingga satu backend berhasil, sehingga percakapan agen
pertama tidak dapat dimulai tanpa inferensi yang berfungsi. Setelah pemeriksaan langsung
tersebut berhasil, OpenClaw tersedia untuk membantu mengonfigurasi ruang kerja, Gateway,
saluran, dan fitur opsional lainnya yang tersisa. Ketika OpenClaw menawarkan daftar singkat
pilihan, aplikasi menampilkan kartu opsi native; memilih salah satunya akan mengirimkan
pilihan tersebut, dan **Lewati untuk sekarang** selalu membuat pilihan tetap opsional.
OpenClaw juga tersedia nanti di Settings → OpenClaw.
</Step>
<Step title="Impor memori (ditampilkan saat terdeteksi)">
Untuk Gateway lokal, onboarding memeriksa Mac guna mencari memori dari alat AI
yang didukung: memori otomatis Claude Code, memori terkonsolidasi Codex, dan berkas
memori Hermes. Ketika ditemukan, halaman ini mencantumkan setiap sumber beserta jumlah
memorinya dan memungkinkan Anda mengimpor sumber yang dipilih ke ruang kerja agen di
bawah `memory/imports/` untuk pemanggilan kembali terindeks. Berkas yang sudah diimpor
akan dilewati, dan halaman ini tidak pernah muncul jika tidak ada yang dapat diimpor.
Melewatinya aman; halaman impor Memori di dasbor menawarkan impor yang sama nanti
dengan kontrol per berkas.
</Step>
<Step title="Izin">

<Frame caption="Pilih izin yang ingin Anda berikan kepada OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Onboarding meminta izin TCC untuk: Automation (AppleScript), Notifications, Accessibility, Screen Recording, Microphone, Speech Recognition, Camera, dan Location.

</Step>
<Step title="Selesai">
  Setelah inferensi berhasil, OpenClaw menangani penyiapan opsional yang tersisa dan dapat
  mengarahkan Anda ke percakapan agen normal. Menyelesaikan panduan izin akan membuka
  percakapan yang sama; aplikasi tidak membuat ruang kerja atau memulai percakapan
  penyiapan agen terpisah sebelum OpenClaw. Lihat
  [Bootstrap](/id/start/bootstrapping) untuk mengetahui apa yang terjadi di host Gateway
  selama giliran nyata pertama agen.
</Step>
</Steps>

## Terkait

- [Ikhtisar onboarding](/id/start/onboarding-overview)
- [Memulai](/id/start/getting-started)
