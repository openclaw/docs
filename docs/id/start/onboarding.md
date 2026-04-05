---
read_when:
    - Merancang asisten onboarding macOS
    - Menerapkan autentikasi atau penyiapan identitas
sidebarTitle: 'Onboarding: macOS App'
summary: Alur penyiapan pertama kali untuk OpenClaw (aplikasi macOS)
title: Onboarding (Aplikasi macOS)
x-i18n:
    generated_at: "2026-04-05T14:06:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: a3c5f313a8e5c3a2e68a9488f07c40fcdf75b170dc868c7614565ad9f67755d6
    source_path: start/onboarding.md
    workflow: 15
---

# Onboarding (Aplikasi macOS)

Dokumen ini menjelaskan alur penyiapan pertama kali yang **saat ini** berlaku. Tujuannya adalah
pengalaman “hari ke-0” yang mulus: pilih tempat Gateway berjalan, hubungkan autentikasi, jalankan
wizard, dan biarkan agen melakukan bootstrap sendiri.
Untuk gambaran umum tentang jalur onboarding, lihat [Ikhtisar Onboarding](/start/onboarding-overview).

<Steps>
<Step title="Setujui peringatan macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Setujui temukan jaringan lokal">
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
- Pengaturan bersama/multi-pengguna memerlukan penguncian ketat (pisahkan batas kepercayaan, minimalkan akses tool, dan ikuti [Keamanan](/id/gateway/security)).
- Onboarding lokal sekarang secara default mengatur konfigurasi baru ke `tools.profile: "coding"` agar penyiapan lokal baru tetap memiliki tool filesystem/runtime tanpa memaksa profil `full` yang tidak dibatasi.
- Jika hooks/webhooks atau feed konten tak tepercaya lainnya diaktifkan, gunakan tier model modern yang kuat dan pertahankan kebijakan tool/sandboxing yang ketat.

</Step>
<Step title="Lokal vs Remote">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Di mana **Gateway** berjalan?

- **Mac ini (Hanya lokal):** onboarding dapat mengonfigurasi autentikasi dan menulis kredensial
  secara lokal.
- **Remote (melalui SSH/Tailnet):** onboarding **tidak** mengonfigurasi autentikasi lokal;
  kredensial harus sudah ada di host gateway.
- **Konfigurasi nanti:** lewati penyiapan dan biarkan aplikasi belum dikonfigurasi.

<Tip>
**Tip autentikasi Gateway:**

- Wizard sekarang membuat **token** bahkan untuk loopback, sehingga klien WS lokal harus diautentikasi.
- Jika Anda menonaktifkan autentikasi, proses lokal apa pun dapat terhubung; gunakan itu hanya pada mesin yang sepenuhnya tepercaya.
- Gunakan **token** untuk akses multi-mesin atau bind non-loopback.

</Tip>
</Step>
<Step title="Izin">
<Frame caption="Pilih izin apa yang ingin Anda berikan ke OpenClaw">
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
  Aplikasi lebih memilih npm terlebih dahulu, lalu pnpm, lalu bun jika itu satu-satunya
  package manager yang terdeteksi. Untuk runtime Gateway, Node tetap menjadi jalur yang direkomendasikan.
</Step>
<Step title="Chat Onboarding (sesi khusus)">
  Setelah penyiapan, aplikasi membuka sesi chat onboarding khusus agar agen dapat
  memperkenalkan diri dan memandu langkah berikutnya. Ini menjaga panduan pertama kali tetap terpisah
  dari percakapan normal Anda. Lihat [Bootstrapping](/start/bootstrapping) untuk
  apa yang terjadi di host gateway selama agen pertama kali dijalankan.
</Step>
</Steps>
