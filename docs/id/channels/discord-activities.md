---
read_when:
    - Menyiapkan atau memecahkan masalah widget Discord Activity
summary: Luncurkan widget HTML OpenClaw mandiri di dalam Discord Activities
title: Aktivitas Discord
x-i18n:
    generated_at: "2026-07-19T04:48:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b1bc04443aef89fd514290c3bebdbdd3e9972298b45cae3806bec99344f6d8cd
    source_path: channels/discord-activities.md
    workflow: 16
---

Discord Activities memungkinkan agen memposting widget HTML interaktif dan mandiri ke channel Discord saat ini. Pesan tersebut menyertakan tombol **Open widget**; mengekliknya akan meluncurkan widget di dalam Discord.

Fitur ini dinonaktifkan secara default. OpenClaw mendaftarkan rute HTTP Activity, alat agen `show_widget`, dan penangan tombol peluncuran hanya ketika `channels.discord.activities` tersedia dan rahasia klien dapat diperoleh. Alias `discord_widget` yang tidak digunakan lagi tetap tersedia selama satu rilis.

## Prasyarat

- [bot Discord OpenClaw](/id/channels/discord) yang sudah ada
- nama host HTTPS publik yang dapat menjangkau Gateway OpenClaw
- izin untuk mengonfigurasi Activities dan OAuth2 bagi aplikasi Discord milik bot

Proksi balik atau tunnel HTTPS apa pun dapat digunakan. Cloudflare Tunnel bernama menyediakan nama host yang stabil tanpa mengekspos port Gateway secara langsung.

```yaml
# ~/.cloudflared/config.yml
tunnel: openclaw-discord
credentials-file: /home/you/.cloudflared/TUNNEL-ID.json
ingress:
  - hostname: openclaw.example.com
    service: http://127.0.0.1:18789
  - service: http_status:404
```

```bash
cloudflared tunnel login
cloudflared tunnel create openclaw-discord
cloudflared tunnel route dns openclaw-discord openclaw.example.com
cloudflared tunnel run openclaw-discord
```

Biarkan autentikasi Gateway normal tetap aktif. Hanya prefiks Activity yang bersifat publik, dan plugin memvalidasi sendiri OAuth, keanggotaan instans Activity, pengikatan channel, sesi, serta kapabilitas dokumen sekali pakai.

## Penyiapan

<Steps>
  <Step title="Ekspos Gateway melalui HTTPS">
    Jalankan tunnel atau proksi balik Anda dan pastikan bahwa `https://openclaw.example.com/discord/activity/` dapat menjangkau Gateway setelah konfigurasi Activities ditambahkan. Ganti nama host contoh dengan nama host Anda sendiri.
  </Step>

  <Step title="Aktifkan Activities di Discord">
    Buka aplikasi bot yang sudah ada di [Discord Developer Portal](https://discord.com/developers/applications). Buka **Activities**, aktifkan Activities, lalu buat pemetaan URL:

    - prefiks: `ROOT` (`/`)
    - target: `openclaw.example.com/discord/activity`

    Target adalah nama host publik ditambah `/discord/activity`, tanpa garis miring di bagian akhir.

  </Step>

  <Step title="Salin rahasia klien OAuth2">
    Buka **OAuth2** di Developer Portal. Discord memerlukan setidaknya satu URI pengalihan, jadi tambahkan placeholder lokal seperti alamat loopback jika aplikasi belum memilikinya; Embedded App SDK menangani alur pengembalian Activity. Salin atau atur ulang rahasia klien aplikasi. Perlakukan nilai tersebut sebagai kredensial: jangan tempelkan ke dalam obrolan, log, atau berkas konfigurasi yang dikomit.
  </Step>

  <Step title="Konfigurasikan OpenClaw">
    Tambahkan satu blok ke akun Discord yang harus menyediakan widget:

    ```json5
    {
      channels: {
        discord: {
          token: "${DISCORD_BOT_TOKEN}",
          activities: {
            clientSecret: "${DISCORD_CLIENT_SECRET}",
            // Opsional. Nilai defaultnya adalah ID aplikasi bot yang diperoleh saat memulai.
            applicationId: "YOUR_DISCORD_APPLICATION_ID",
          },
        },
      },
    }
    ```

    Anda dapat menghilangkan `clientSecret` dari blok ketika `DISCORD_CLIENT_SECRET` ditetapkan. Blok itu sendiri harus tetap ada untuk mengaktifkan fitur ini.

    Pengaturan akses Discord normal tetap terpisah. Misalnya, `allowFrom` tetap mengontrol siapa yang dapat mengirim DM kepada agen; pengaturan tersebut tidak mengontrol siapa yang dapat membuka widget yang sudah diposting di sebuah channel.

  </Step>

  <Step title="Mulai ulang dan uji">
    Mulai ulang Gateway. Dalam percakapan Discord, minta agen menampilkan widget interaktif. Agen memanggil `show_widget`; klik **Open widget** pada pesan yang diposting.
  </Step>
</Steps>

## Model keamanan

- OAuth mengidentifikasi pengguna Discord sebelum metadata widget dikembalikan.
- API Get Activity Instance milik Discord harus mengonfirmasi bahwa pengguna OAuth berada dalam instans Activity saat ini. Channel instans harus cocok dengan channel tempat widget diposting.
- Semua orang yang diizinkan Discord untuk masuk ke channel tersebut dapat membuka widgetnya. Untuk mempersempit audiens, gunakan izin channel Discord. Daftar yang diizinkan untuk perintah dan DM OpenClaw tidak memberikan atau menghapus akses ke konten channel yang sudah diposting.
- Sesi OAuth kedaluwarsa setelah 15 menit. Kapabilitas dokumen widget kedaluwarsa setelah 60 detik dan hanya dapat digunakan sekali.
- Widget kedaluwarsa setelah tujuh hari, dengan maksimal 64 widget dipertahankan per instans plugin Discord.
- HTML widget dibuat oleh agen Anda dan harus diperlakukan sebagai konten tepercaya. Jangan menyematkan rahasia yang tidak ingin Anda biarkan terekspos oleh widget yang bermasalah.
- Widget dapat bernavigasi di dalam frame bersarangnya sendiri. iframe `sandbox="allow-scripts"` memblokir navigasi tingkat atas, popup, dan akses asal yang sama, sementara Content Security Policy-nya memblokir koneksi jaringan dan sumber daya eksternal. Kontrol ini merupakan pertahanan berlapis, bukan batas keamanan terhadap agen yang membuat widget.
- Ketika Activities dinonaktifkan, `/discord/activity` sama sekali tidak didaftarkan.

Shell Activity publik dan rute pertukaran token dapat dijangkau melalui tunnel Anda ketika diaktifkan. Keduanya tidak mengekspos HTML widget tanpa sesi OAuth yang valid dan kapabilitas dokumen sekali pakai.

## Pemecahan masalah

### Activity menampilkan “Gateway offline”

- pastikan tunnel berjalan dan merutekan ke port pengikatan Gateway yang sebenarnya
- pastikan target Developer Portal menyertakan `/discord/activity`
- mulai ulang Gateway setelah mengubah konfigurasi Discord atau OpenClaw
- periksa log Gateway untuk peringatan satu baris tentang rahasia klien Activities yang tidak tersedia

### Discord membuka halaman kosong atau melaporkan `blocked:csp`

- pastikan pemetaan URL menggunakan `ROOT` dan tidak menambahkan segmen `/discord/activity` kedua
- pastikan shell, `shell.js`, dan modul SDK semuanya dikembalikan melalui proksi Discord
- periksa log Gateway untuk permintaan di bawah `/discord/activity/`

Permintaan jaringan widget sengaja diblokir. Sematkan semua CSS, JavaScript, gambar, dan data yang diperlukan widget secara inline.

### “Widget unavailable”

Luncurkan tombol dari channel tempat agen mempostingnya. OpenClaw melacak peluncuran di sisi server ketika tombol diklik, sehingga catatan peluncuran baru dapat menemukan widget yang tepat bahkan ketika Discord menghilangkan atau merusak ID khusus tombol. Ketika ID khusus maupun catatan peluncuran tidak dapat menemukan widget, OpenClaw membuka widget aktif yang paling baru diposting di channel tersebut. Widget lama tetap dapat diakses melalui tombol yang mempertahankan ID khususnya.

### “You cannot launch Activities in this channel”

Discord tidak meluncurkan Activities dari utas postingan forum. OpenClaw dapat memposting pesan widget dan tombol di sana, tetapi luncurkan Activity dari channel teks biasa sebagai gantinya. Pembatasan ini berasal dari Discord, bukan OpenClaw.
