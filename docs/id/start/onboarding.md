---
read_when:
    - Merancang asisten orientasi macOS
    - Menerapkan penyiapan autentikasi atau identitas
sidebarTitle: 'Onboarding: macOS App'
summary: Alur penyiapan pertama kali untuk OpenClaw (aplikasi macOS)
title: Orientasi awal (aplikasi macOS)
x-i18n:
    generated_at: "2026-07-12T14:39:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cced671a375bd80cbdf920383add8cf01f75a85259963a4286e9ce49913d8b47
    source_path: start/onboarding.md
    workflow: 16
---

Alur penggunaan pertama aplikasi macOS: pilih lokasi Gateway dijalankan, hubungkan backend AI yang terverifikasi, berikan izin, lalu serahkan prosesnya ke ritual bootstrap milik agen.
Untuk orientasi CLI dan perbandingan kedua jalur tersebut, lihat [Ikhtisar Orientasi](/id/start/onboarding-overview).

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
<Frame caption="Baca pemberitahuan keamanan yang ditampilkan dan putuskan sebagaimana mestinya">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Model kepercayaan keamanan:

- Secara default, OpenClaw adalah agen pribadi: satu batas operator tepercaya.
- Penyiapan bersama/multipengguna perlu diperketat: pisahkan batas kepercayaan, minimalkan akses alat, dan ikuti [Keamanan](/id/gateway/security).
- Orientasi lokal secara default menetapkan konfigurasi baru ke `tools.profile: "coding"` agar penyiapan baru tetap memiliki alat sistem berkas/runtime tanpa profil `full` yang tidak dibatasi.
- Jika hook/webhook atau umpan konten tidak tepercaya lainnya diaktifkan, gunakan tingkat model modern yang kuat serta pertahankan kebijakan alat dan sandboxing yang ketat.

</Step>
<Step title="Lokal vs Jarak Jauh">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Di mana **Gateway** dijalankan?

- **Mac Ini (Hanya lokal):** orientasi mengonfigurasi autentikasi dan menulis kredensial secara lokal.
- **Jarak Jauh (melalui SSH/Tailnet):** orientasi **tidak** mengonfigurasi autentikasi lokal;
  kredensial harus sudah tersedia di host Gateway. Kolom token Gateway jarak jauh
  menyimpan token yang digunakan aplikasi macOS untuk terhubung ke Gateway tersebut;
  nilai SecretRef `gateway.remote.token` yang sudah ada dipertahankan hingga Anda
  menggantinya.
- **Konfigurasikan nanti:** lewati penyiapan dan biarkan aplikasi belum dikonfigurasi.

<Tip>
**Kiat autentikasi Gateway:**

- Mode autentikasi Gateway secara default adalah `token`, bahkan untuk pengikatan loopback, sehingga klien WS lokal harus melakukan autentikasi.
- Menetapkan `gateway.auth.mode: "none"` memungkinkan proses lokal apa pun terhubung; gunakan hanya pada mesin yang sepenuhnya tepercaya.
- Gunakan token untuk akses antarmesin atau pengikatan non-loopback.

</Tip>
</Step>
<Step title="CLI">
  Penyiapan lokal memasang CLI global `openclaw` melalui npm, pnpm, atau bun,
  dengan mengutamakan npm. Node tetap menjadi runtime yang direkomendasikan
  untuk Gateway. Instalasi kompatibel yang sudah ada akan digunakan kembali.
</Step>
<Step title="Hubungkan AI Anda">
  Gateway terhubung yang sudah memiliki model agen terkonfigurasi akan melewati
  halaman ini sepenuhnya dan membuka antarmuka agen normal. Penyiapan Crestodian
  dan penyedia hanya dijalankan untuk Gateway yang baru atau belum lengkap.

Setelah Gateway siap, orientasi akan mencari akses AI yang sudah Anda miliki:
login Claude Code atau Codex, maupun `OPENAI_API_KEY` /
`ANTHROPIC_API_KEY`. Opsi terbaik diuji dengan penyelesaian nyata dan
hanya disimpan setelah berhasil memberikan jawaban; jika pengujian gagal,
aplikasi secara otomatis mencoba opsi berikutnya dan menampilkan alasan
kegagalan opsi sebelumnya. Jika ditemukan beberapa opsi, Anda dapat beralih
di antaranya sebelum melanjutkan.

Gemini CLI tetap tersedia untuk agen normal setelah penyiapan, tetapi tidak
ditawarkan di sini karena tidak dapat memberlakukan pemeriksaan inferensi tanpa alat.

Anda juga dapat masuk melalui alur OAuth atau pemasangan perangkat milik penyedia.
Pilihan bawaan mencakup OpenAI/ChatGPT, OpenRouter, GitHub Copilot, Google
Gemini CLI, xAI, MiniMax Global dan CN, serta Chutes. Daftar tersebut berasal
dari Plugin penyedia inferensi teks aktif milik Gateway, bukan dari daftar
tetap aplikasi, sehingga penyedia lain dapat ikut serta tanpa menambahkan
kode macOS khusus penyedia.

Pemilih kunci/token manual menggunakan registri penyedia yang sama. Dalam setiap
jalur, penyedia memasok model awal dan konfigurasinya; OpenClaw memverifikasi
kredensial dengan pengujian langsung yang sama sebelum menyimpan profil
autentikasinya. Berikutnya tetap terkunci hingga satu backend berhasil, sehingga
percakapan agen pertama tidak dapat dimulai tanpa inferensi yang berfungsi.
Setelah pemeriksaan langsung tersebut berhasil, Crestodian tersedia untuk
membantu mengonfigurasi ruang kerja, Gateway, saluran, dan fitur opsional
lainnya; Crestodian juga tersedia nanti di Settings → Crestodian.
</Step>
<Step title="Izin">

<Frame caption="Pilih izin yang ingin Anda berikan kepada OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Orientasi meminta izin TCC untuk: Otomasi (AppleScript), Notifikasi, Aksesibilitas, Perekaman Layar, Mikrofon, Pengenalan Ucapan, Kamera, dan Lokasi.

</Step>
<Step title="Selesai">
  Setelah inferensi berhasil, Crestodian menangani sisa penyiapan opsional dan dapat
  mengalihkan Anda ke percakapan agen normal. Menyelesaikan panduan izin akan
  membuka percakapan yang sama; aplikasi tidak membuat ruang kerja atau memulai
  percakapan penyiapan agen terpisah sebelum Crestodian. Lihat
  [Bootstrap](/id/start/bootstrapping) untuk mengetahui apa yang terjadi pada host Gateway
  selama giliran nyata pertama agen.
</Step>
</Steps>

## Terkait

- [Ikhtisar orientasi](/id/start/onboarding-overview)
- [Memulai](/id/start/getting-started)
