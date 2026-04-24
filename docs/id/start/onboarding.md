---
read_when:
    - Merancang asisten onboarding macOS
    - Mengimplementasikan penyiapan auth atau identitas
sidebarTitle: 'Onboarding: macOS App'
summary: Alur penyiapan run pertama untuk OpenClaw (aplikasi macOS)
title: Onboarding (aplikasi macOS)
x-i18n:
    generated_at: "2026-04-24T09:28:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa516f8f5b4c7318f27a5af4e7ac12f5685aef6f84579a68496c2497d6f9041d
    source_path: start/onboarding.md
    workflow: 15
---

Dokumen ini menjelaskan alur penyiapan run pertama **saat ini**. Tujuannya adalah
pengalaman “hari 0” yang mulus: pilih di mana Gateway berjalan, hubungkan auth, jalankan
wizard, lalu biarkan agen melakukan bootstrap dirinya sendiri.
Untuk ikhtisar umum jalur onboarding, lihat [Onboarding Overview](/id/start/onboarding-overview).

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
<Step title="Selamat datang dan pemberitahuan keamanan">
<Frame caption="Baca pemberitahuan keamanan yang ditampilkan dan putuskan sesuai kebutuhan">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Model kepercayaan keamanan:

- Secara default, OpenClaw adalah agen pribadi: satu batas operator tepercaya.
- Penyiapan bersama/multi-pengguna memerlukan penguncian (pisahkan batas kepercayaan, pertahankan akses alat seminimal mungkin, dan ikuti [Security](/id/gateway/security)).
- Onboarding lokal kini secara default menyetel config baru ke `tools.profile: "coding"` sehingga penyiapan lokal baru mempertahankan alat filesystem/runtime tanpa memaksa profil `full` yang tidak dibatasi.
- Jika hooks/Webhook atau feed konten tidak tepercaya lainnya diaktifkan, gunakan tier model modern yang kuat dan pertahankan kebijakan alat/sandboxing yang ketat.

</Step>
<Step title="Lokal vs Remote">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Di mana **Gateway** berjalan?

- **Mac ini (hanya lokal):** onboarding dapat mengonfigurasi auth dan menulis kredensial
  secara lokal.
- **Remote (melalui SSH/Tailnet):** onboarding **tidak** mengonfigurasi auth lokal;
  kredensial harus sudah ada di host gateway.
- **Konfigurasikan nanti:** lewati setup dan biarkan aplikasi tidak terkonfigurasi.

<Tip>
**Tips auth Gateway:**

- Wizard sekarang menghasilkan **token** bahkan untuk loopback, jadi klien WS lokal harus melakukan autentikasi.
- Jika Anda menonaktifkan auth, proses lokal apa pun dapat terhubung; gunakan itu hanya pada mesin yang sepenuhnya tepercaya.
- Gunakan **token** untuk akses multi-mesin atau bind non-loopback.

</Tip>
</Step>
<Step title="Izin">
<Frame caption="Pilih izin apa yang ingin Anda berikan ke OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Onboarding meminta izin TCC yang diperlukan untuk:

- Automation (AppleScript)
- Notifications
- Accessibility
- Screen Recording
- Microphone
- Speech Recognition
- Camera
- Location

</Step>
<Step title="CLI">
  <Info>Langkah ini opsional</Info>
  Aplikasi dapat menginstal CLI `openclaw` global melalui npm, pnpm, atau bun.
  Aplikasi lebih memilih npm terlebih dahulu, lalu pnpm, lalu bun jika itu satu-satunya
  package manager yang terdeteksi. Untuk runtime Gateway, Node tetap menjadi jalur yang direkomendasikan.
</Step>
<Step title="Chat Onboarding (sesi khusus)">
  Setelah setup, aplikasi membuka sesi chat onboarding khusus agar agen dapat
  memperkenalkan dirinya dan memandu langkah selanjutnya. Ini menjaga panduan run pertama tetap terpisah
  dari percakapan normal Anda. Lihat [Bootstrapping](/id/start/bootstrapping) untuk
  apa yang terjadi di host gateway selama run agen pertama.
</Step>
</Steps>

## Terkait

- [Onboarding overview](/id/start/onboarding-overview)
- [Getting started](/id/start/getting-started)
