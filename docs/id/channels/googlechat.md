---
read_when:
    - Mengerjakan fitur saluran Google Chat
summary: Status dukungan, kemampuan, dan konfigurasi aplikasi Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-07-12T13:55:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72a08c41f7da019f91265cbf7ae73134a0767c603449ebd8cd9a5354936a3b52
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat berjalan sebagai plugin resmi `@openclaw/googlechat`: pesan langsung dan ruang melalui Webhook Google Chat API (hanya titik akhir HTTP, tanpa Pub/Sub).

## Instalasi

```bash
openclaw plugins install @openclaw/googlechat
```

Checkout lokal (saat dijalankan dari repositori git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Penyiapan cepat (pemula)

1. Buat proyek Google Cloud dan aktifkan **Google Chat API**.
   - Buka: [Kredensial Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Aktifkan API jika belum diaktifkan.
2. Buat **Service Account**:
   - Tekan **Create Credentials** > **Service Account**.
   - Beri nama sesuai keinginan (misalnya, `openclaw-chat`).
   - Biarkan izin dan prinsipal kosong (**Continue**, lalu **Done**).
3. Buat dan unduh **kunci JSON**:
   - Klik akun layanan baru > tab **Keys** > **Add Key** > **Create new key** > **JSON** > **Create**.
4. Simpan berkas JSON yang diunduh pada hos Gateway Anda (misalnya, `~/.openclaw/googlechat-service-account.json`).
5. Buat aplikasi Google Chat di [Konfigurasi Chat Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Isi **Application info** (nama aplikasi, URL avatar, deskripsi).
   - Aktifkan **Interactive features**.
   - Di bagian **Functionality**, centang **Join spaces and group conversations**.
   - Di bagian **Connection settings**, pilih **HTTP endpoint URL**.
   - Di bagian **Triggers**, pilih **Use a common HTTP endpoint URL for all triggers** dan tetapkan ke URL Gateway publik Anda yang diikuti `/googlechat` (lihat [URL publik](#public-url-webhook-only)).
   - Di bagian **Visibility**, centang **Make this Chat app available to specific people and groups in `<Your Domain>`** dan masukkan alamat email Anda.
   - Klik **Save**.
6. Aktifkan status aplikasi: muat ulang halaman, temukan **App status**, tetapkan ke **Live - available to users**, lalu klik **Save** lagi.
7. Konfigurasikan OpenClaw dengan akun layanan dan audiens Webhook (harus cocok dengan konfigurasi aplikasi Chat):
   - Variabel lingkungan: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json` (hanya akun default), atau
   - Konfigurasi: lihat [Sorotan konfigurasi](#config-highlights). `openclaw channels add --channel googlechat` juga menerima `--audience-type`, `--audience`, `--webhook-path`, dan `--webhook-url`.
8. Mulai Gateway. Google Chat akan mengirim POST ke jalur Webhook Anda (default `/googlechat`).

## Tambahkan ke Google Chat

Setelah Gateway berjalan dan email Anda ada dalam daftar visibilitas:

1. Buka [Google Chat](https://chat.google.com/).
2. Klik ikon **+** (tambah) di samping **Direct Messages**.
3. Cari **App name** yang Anda konfigurasikan di Google Cloud Console.
   - Bot _tidak_ muncul dalam daftar penelusuran Marketplace karena merupakan aplikasi privat; cari berdasarkan namanya.
4. Pilih bot, klik **Add** atau **Chat**, lalu kirim pesan.

## URL publik (khusus Webhook)

Webhook Google Chat memerlukan titik akhir HTTPS publik. Demi keamanan, paparkan **hanya jalur `/googlechat`** ke internet dan pertahankan dasbor OpenClaw serta titik akhir lainnya tetap privat.

### Opsi A: Tailscale Funnel (Disarankan)

Gunakan Tailscale Serve untuk dasbor privat dan Funnel untuk jalur Webhook publik.

1. Periksa alamat yang digunakan Gateway untuk mendengarkan:

   ```bash
   ss -tlnp | grep 18789
   ```

   Catat IP-nya (misalnya, `127.0.0.1`, `0.0.0.0`, atau alamat Tailscale `100.x.x.x`).

2. Paparkan dasbor hanya ke tailnet (port 8443):

   ```bash
   # Jika terikat ke localhost (127.0.0.1 atau 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Jika hanya terikat ke IP Tailscale:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. Paparkan hanya jalur Webhook secara publik:

   ```bash
   # Jika terikat ke localhost (127.0.0.1 atau 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Jika hanya terikat ke IP Tailscale:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. Jika diminta, kunjungi URL otorisasi yang ditampilkan dalam keluaran untuk mengaktifkan Funnel bagi Node ini.

5. Verifikasi:

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

URL Webhook publik Anda adalah `https://<node-name>.<tailnet>.ts.net/googlechat`; dasbor tetap hanya dapat diakses melalui tailnet di `https://<node-name>.<tailnet>.ts.net:8443/`. Gunakan URL publik (tanpa `:8443`) dalam konfigurasi aplikasi Google Chat.

> Catatan: Konfigurasi ini tetap tersimpan setelah dimulai ulang. Hapus nanti dengan `tailscale funnel reset` dan `tailscale serve reset`.

### Opsi B: Proksi Terbalik (Caddy)

Proksikan hanya jalur Webhook:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Permintaan ke `your-domain.com/` diabaikan atau menghasilkan 404, sedangkan `your-domain.com/googlechat` dirutekan ke OpenClaw.

### Opsi C: Cloudflare Tunnel

Konfigurasikan aturan masuk tunnel agar hanya merutekan jalur Webhook:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default rule**: HTTP 404 (Not Found)

## Cara kerjanya

1. Google Chat mengirim JSON melalui POST ke jalur Webhook Gateway (hanya POST, jenis konten JSON wajib, dibatasi lajunya per IP).
2. OpenClaw mengautentikasi setiap permintaan sebelum meneruskannya:
   - Peristiwa aplikasi Chat membawa `Authorization: Bearer <token>`; token diverifikasi sebelum seluruh isi permintaan diurai.
   - Peristiwa Add-on Google Workspace membawa token dalam isi permintaan (`authorizationEventObject.systemIdToken`) dan dibaca dengan batas praautentikasi yang lebih ketat (16 KB, 3 detik) sebelum verifikasi.
3. Token diperiksa terhadap `audienceType` + `audience`:
   - `audienceType: "app-url"` → audiens adalah URL Webhook HTTPS Anda.
   - `audienceType: "project-number"` → audiens adalah nomor proyek Cloud.
   - Token Add-on dengan `app-url` juga mengharuskan `appPrincipal` ditetapkan ke ID klien OAuth 2.0 numerik aplikasi (21 digit, bukan email); jika tidak, verifikasi gagal dan peringatan dicatat.
4. Pesan dirutekan berdasarkan ruang:
   - Ruang mendapatkan sesi per ruang `agent:<agentId>:googlechat:group:<spaceId>`; balasan dikirim ke utas pesan.
   - Pesan langsung secara default digabungkan ke sesi utama agen; tetapkan `session.dmScope` untuk sesi pesan langsung per rekan (lihat [Sesi](/id/concepts/session)).
5. Akses pesan langsung menggunakan pemasangan secara default. Pengirim yang tidak dikenal menerima kode pemasangan; setujui dengan:
   - `openclaw pairing approve googlechat <code>`
6. Ruang grup secara default memerlukan penyebutan @. Penyebutan dideteksi dari anotasi `USER_MENTION` Chat yang ditujukan ke aplikasi; tetapkan `botUser` (misalnya, `users/1234567890`) jika pendeteksian memerlukan nama sumber daya pengguna aplikasi.
7. Saat persetujuan eksekusi atau Plugin dimulai dari Google Chat dan pemberi persetujuan `users/<id>` yang stabil dikonfigurasikan, OpenClaw memposting kartu persetujuan native (`cardsV2`) di ruang atau utas asal. Tombol kartu membawa token panggilan balik buram; perintah manual `/approve <id> <decision>` hanya muncul saat pengiriman native tidak tersedia.

## Tujuan

Gunakan pengenal berikut untuk pengiriman dan daftar yang diizinkan:

- Pesan langsung: `users/<userId>` (disarankan).
- Ruang: `spaces/<spaceId>`.
- Email mentah `name@example.com` dapat berubah dan hanya digunakan untuk pencocokan daftar yang diizinkan saat `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Tidak digunakan lagi: `users/<email>` diperlakukan sebagai ID pengguna, bukan entri email dalam daftar yang diizinkan.
- Awalan `googlechat:`, `google-chat:`, dan `gchat:` diterima dan dihapus.

## Sorotan konfigurasi

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // atau serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // hanya verifikasi add-on; ID klien OAuth numerik
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // opsional; membantu pendeteksian penyebutan
      allowBots: false,
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          enabled: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Hanya jawaban singkat.",
        },
      },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Catatan:

- Kredensial akun layanan: `serviceAccountFile` (jalur), `serviceAccount` (string atau objek JSON sebaris), atau `serviceAccountRef` (SecretRef variabel lingkungan/berkas). Variabel lingkungan `GOOGLE_CHAT_SERVICE_ACCOUNT` (JSON sebaris) dan `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (jalur) hanya berlaku untuk akun default. Penyiapan multiakun menggunakan `channels.googlechat.accounts.<id>` dengan kunci yang sama, termasuk `serviceAccountRef` per akun.
- Jalur Webhook default adalah `/googlechat` saat `webhookPath` tidak ditetapkan; `webhookUrl` dapat menyediakan jalur sebagai gantinya.
- Kunci grup harus berupa ID ruang yang stabil (`spaces/<spaceId>`). Kunci nama tampilan tidak digunakan lagi dan dicatat sebagai demikian.
- `dangerouslyAllowNameMatching` mengaktifkan kembali pencocokan prinsipal email yang dapat berubah untuk daftar yang diizinkan (mode kompatibilitas darurat); doctor memperingatkan tentang entri email.
- Tindakan reaksi Google Chat tidak diekspos. Plugin menggunakan autentikasi akun layanan, sedangkan titik akhir reaksi Google Chat memerlukan autentikasi pengguna. Konfigurasi `actions.reactions` yang ada diterima untuk kompatibilitas, tetapi tidak berpengaruh.
- Kartu persetujuan native menggunakan klik tombol `cardsV2` Google Chat, bukan peristiwa reaksi. Pemberi persetujuan berasal dari `dm.allowFrom` atau `defaultTo` dan harus berupa nilai numerik `users/<id>` yang stabil.
- Tindakan pesan hanya mengekspos `send` teks. Pengunggahan lampiran Google Chat memerlukan autentikasi pengguna, sedangkan Plugin ini menggunakan autentikasi akun layanan, sehingga pengunggahan berkas keluar tidak diekspos.
- `typingIndicator`: `message` (default) memposting placeholder `_<Bot> sedang mengetik..._` dan mengubahnya menjadi balasan pertama; `none` menonaktifkannya; `reaction` memerlukan OAuth pengguna dan saat ini kembali ke `message` dengan kesalahan yang dicatat ketika menggunakan autentikasi akun layanan.
- Lampiran masuk (lampiran pertama per pesan) diunduh melalui Chat API ke alur media, dengan batas `mediaMaxMb` (default 20).
- Pesan yang dibuat bot diabaikan secara default. Dengan `allowBots: true`, pesan bot yang diterima menggunakan [perlindungan perulangan bot](/id/channels/bot-loop-protection) bersama: konfigurasikan `channels.defaults.botLoopProtection`, lalu timpa dengan `channels.googlechat.botLoopProtection` atau `channels.googlechat.groups.<space>.botLoopProtection`.

Detail referensi rahasia: [Pengelolaan Rahasia](/id/gateway/secrets).

## Pemecahan masalah

### 405 Metode Tidak Diizinkan

Jika Google Cloud Logs Explorer menampilkan kesalahan seperti:

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Penangan Webhook tidak terdaftar. Penyebab umum:

1. **Saluran belum dikonfigurasikan**: bagian `channels.googlechat` tidak ada. Verifikasi dengan:

   ```bash
   openclaw config get channels.googlechat
   ```

   Jika mengembalikan "Config path not found", tambahkan konfigurasi (lihat [Sorotan konfigurasi](#config-highlights)).

2. **Plugin tidak diaktifkan**: periksa status Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Jika menampilkan "disabled", tambahkan `plugins.entries.googlechat.enabled: true` ke konfigurasi Anda.

3. **Gateway belum dimulai ulang** setelah perubahan konfigurasi:

   ```bash
   openclaw gateway restart
   ```

Verifikasi bahwa saluran sedang berjalan:

```bash
openclaw channels status
# Seharusnya menampilkan: Google Chat default: enabled, configured, ...
```

### Masalah lainnya

- `openclaw channels status --probe` menampilkan kesalahan autentikasi dan konfigurasi audiens yang tidak ada (`audience` dan `audienceType` keduanya wajib).
- Jika tidak ada pesan yang masuk, konfirmasikan URL Webhook dan konfigurasi pemicu aplikasi Chat.
- Jika gerbang penyebutan memblokir balasan, tetapkan `botUser` ke nama sumber daya pengguna aplikasi dan periksa `requireMention`.
- Jalankan `openclaw logs --follow` saat mengirim pesan percobaan untuk melihat apakah permintaan mencapai Gateway.

## Terkait

- [Ikhtisar Kanal](/id/channels) — semua kanal yang didukung
- [Perutean Kanal](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Konfigurasi Gateway](/id/gateway/configuration)
- [Grup](/id/channels/groups) — perilaku obrolan grup dan pembatasan berdasarkan penyebutan
- [Pemasangan](/id/channels/pairing) — autentikasi DM dan alur pemasangan
- [Keamanan](/id/gateway/security) — model akses dan penguatan keamanan
