---
read_when:
    - Merancang asisten onboarding macOS
    - Menerapkan penyiapan autentikasi atau identitas
sidebarTitle: 'Onboarding: macOS App'
summary: Alur penyiapan pertama kali untuk OpenClaw (aplikasi macOS)
title: Orientasi (aplikasi macOS)
x-i18n:
    generated_at: "2026-06-27T18:14:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 73f902bcbb7ef782d4a5fbe442a8855a8fcb426d45167c4d2fc1fc050263b5f1
    source_path: start/onboarding.md
    workflow: 16
---

Dokumen ini menjelaskan alur penyiapan pertama kali yang **saat ini** berlaku. Tujuannya adalah pengalaman "hari 0" yang lancar: pilih tempat Gateway berjalan, hubungkan autentikasi, jalankan wizard, dan biarkan agen melakukan bootstrap sendiri.
Untuk gambaran umum jalur onboarding, lihat [Ikhtisar Onboarding](/id/start/onboarding-overview).

<Steps>
<Step title="Setujui peringatan macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Setujui pencarian jaringan lokal">
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
- Penyiapan bersama/multi-pengguna memerlukan penguncian (pisahkan batas kepercayaan, jaga akses alat tetap minimal, dan ikuti [Keamanan](/id/gateway/security)).
- Onboarding lokal sekarang menetapkan default konfigurasi baru ke `tools.profile: "coding"` sehingga penyiapan lokal baru tetap mempertahankan alat filesystem/runtime tanpa memaksa profil `full` yang tidak dibatasi.
- Jika hook/webhook atau feed konten tidak tepercaya lainnya diaktifkan, gunakan tingkat model modern yang kuat dan pertahankan kebijakan alat/sandboxing yang ketat.

</Step>
<Step title="Lokal vs Jarak Jauh">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Di mana **Gateway** berjalan?

- **Mac Ini (Hanya lokal):** onboarding dapat mengonfigurasi autentikasi dan menulis kredensial secara lokal.
- **Jarak Jauh (melalui SSH/Tailnet):** onboarding **tidak** mengonfigurasi autentikasi lokal; kredensial harus ada di host gateway. Kolom token gateway jarak jauh menyimpan token yang digunakan aplikasi macOS untuk terhubung ke Gateway tersebut; nilai `gateway.remote.token` non-plaintext yang ada dipertahankan hingga Anda menggantinya.
- **Konfigurasi nanti:** lewati penyiapan dan biarkan aplikasi belum dikonfigurasi.

<Tip>
**Kiat autentikasi Gateway:**

- Wizard sekarang menghasilkan **token** bahkan untuk loopback, sehingga klien WS lokal harus diautentikasi.
- Jika Anda menonaktifkan autentikasi, proses lokal apa pun dapat terhubung; gunakan itu hanya pada mesin yang sepenuhnya tepercaya.
- Gunakan **token** untuk akses multi-mesin atau bind non-loopback.

</Tip>
</Step>
<Step title="Izin">
<Frame caption="Pilih izin apa yang ingin Anda berikan kepada OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Onboarding meminta izin TCC yang diperlukan untuk:

- Otomasi (AppleScript)
- Notifikasi
- Aksesibilitas
- Perekaman Layar
- Mikrofon
- Pengenalan Ucapan
- Kamera
- Lokasi

</Step>
<Step title="CLI">
  <Info>Langkah ini opsional</Info>
  Aplikasi dapat menginstal CLI `openclaw` global melalui npm, pnpm, atau bun.
  Aplikasi mengutamakan npm terlebih dahulu, lalu pnpm, lalu bun jika itu satu-satunya
  manajer paket yang terdeteksi. Untuk runtime Gateway, Node tetap menjadi jalur yang direkomendasikan.
</Step>
<Step title="Chat Onboarding (sesi khusus)">
  Setelah penyiapan, aplikasi membuka sesi chat onboarding khusus agar agen dapat
  memperkenalkan dirinya dan memandu langkah berikutnya. Ini memisahkan panduan pertama kali
  dari percakapan normal Anda. Lihat [Bootstrapping](/id/start/bootstrapping) untuk
  mengetahui apa yang terjadi pada host gateway selama agen pertama kali berjalan.
</Step>
</Steps>

## Terkait

- [Ikhtisar onboarding](/id/start/onboarding-overview)
- [Memulai](/id/start/getting-started)
