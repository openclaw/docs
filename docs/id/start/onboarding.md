---
read_when:
    - Merancang asisten orientasi macOS
    - Mengimplementasikan penyiapan autentikasi atau identitas
sidebarTitle: 'Onboarding: macOS App'
summary: Alur penyiapan pertama kali untuk OpenClaw (aplikasi macOS)
title: Orientasi (aplikasi macOS)
x-i18n:
    generated_at: "2026-05-06T09:28:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6dc7ebea5de7b1398d7b64c00245255c59af8a7ef51315cdd0ef1cb4898a41a4
    source_path: start/onboarding.md
    workflow: 16
---

Dokumen ini menjelaskan alur penyiapan pertama kali yang **saat ini** berlaku. Tujuannya adalah pengalaman
"hari 0" yang lancar: pilih lokasi Gateway berjalan, hubungkan autentikasi, jalankan
wizard, dan biarkan agen melakukan bootstrap sendiri.
Untuk gambaran umum tentang jalur onboarding, lihat [Gambaran Umum Onboarding](/id/start/onboarding-overview).

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
<Frame caption="Baca pemberitahuan keamanan yang ditampilkan dan putuskan sesuai kebutuhan">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Model kepercayaan keamanan:

- Secara default, OpenClaw adalah agen pribadi: satu batas operator tepercaya.
- Penyiapan bersama/multi-pengguna memerlukan penguncian (pisahkan batas kepercayaan, pertahankan akses alat seminimal mungkin, dan ikuti [Keamanan](/id/gateway/security)).
- Onboarding lokal kini secara default menetapkan konfigurasi baru ke `tools.profile: "coding"` sehingga penyiapan lokal baru tetap memiliki alat filesystem/runtime tanpa memaksa profil `full` yang tidak dibatasi.
- Jika hook/webhook atau umpan konten tidak tepercaya lainnya diaktifkan, gunakan tingkat model modern yang kuat dan pertahankan kebijakan alat/sandboxing yang ketat.

</Step>
<Step title="Lokal vs Jarak Jauh">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Di mana **Gateway** berjalan?

- **Mac Ini (Hanya lokal):** onboarding dapat mengonfigurasi autentikasi dan menulis kredensial
  secara lokal.
- **Jarak jauh (melalui SSH/Tailnet):** onboarding **tidak** mengonfigurasi autentikasi lokal;
  kredensial harus ada di host gateway.
- **Konfigurasi nanti:** lewati penyiapan dan biarkan aplikasi belum dikonfigurasi.

<Tip>
**Tips autentikasi Gateway:**

- Wizard kini menghasilkan **token** bahkan untuk loopback, sehingga klien WS lokal harus diautentikasi.
- Jika Anda menonaktifkan autentikasi, proses lokal apa pun dapat terhubung; gunakan hanya pada mesin yang sepenuhnya tepercaya.
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
  Aplikasi dapat menginstal CLI global `openclaw` melalui npm, pnpm, atau bun.
  Aplikasi memprioritaskan npm terlebih dahulu, lalu pnpm, lalu bun jika itu adalah satu-satunya
  manajer paket yang terdeteksi. Untuk runtime Gateway, Node tetap menjadi jalur yang direkomendasikan.
</Step>
<Step title="Chat Onboarding (sesi khusus)">
  Setelah penyiapan, aplikasi membuka sesi chat onboarding khusus agar agen dapat
  memperkenalkan diri dan memandu langkah berikutnya. Ini memisahkan panduan pertama kali
  dari percakapan normal Anda. Lihat [Bootstrapping](/id/start/bootstrapping) untuk
  mengetahui apa yang terjadi pada host gateway selama agen pertama kali berjalan.
</Step>
</Steps>

## Terkait

- [Gambaran umum onboarding](/id/start/onboarding-overview)
- [Memulai](/id/start/getting-started)
