---
read_when:
    - Mengerjakan fitur saluran Google Chat
summary: Status dukungan, kemampuan, dan konfigurasi aplikasi Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-05-06T09:02:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b6ac581578df0fccfb560057e4b30ec359a368cb671519a153e1c727d7b920c
    source_path: channels/googlechat.md
    workflow: 16
---

Status: Plugin yang dapat diunduh untuk DM + ruang melalui Webhook Google Chat API (hanya HTTP).

## Instalasi

Instal Google Chat sebelum mengonfigurasi kanal:

```bash
openclaw plugins install @openclaw/googlechat
```

Checkout lokal (saat dijalankan dari repo git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Penyiapan cepat (pemula)

1. Buat proyek Google Cloud dan aktifkan **Google Chat API**.
   - Buka: [Kredensial Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Aktifkan API jika belum aktif.
2. Buat **Service Account**:
   - Tekan **Create Credentials** > **Service Account**.
   - Beri nama sesuai keinginan Anda (misalnya, `openclaw-chat`).
   - Biarkan izin kosong (tekan **Continue**).
   - Biarkan prinsipal dengan akses kosong (tekan **Done**).
3. Buat dan unduh **JSON Key**:
   - Dalam daftar service account, klik yang baru saja Anda buat.
   - Buka tab **Keys**.
   - Klik **Add Key** > **Create new key**.
   - Pilih **JSON** dan tekan **Create**.
4. Simpan file JSON yang diunduh di host Gateway Anda (misalnya, `~/.openclaw/googlechat-service-account.json`).
5. Buat aplikasi Google Chat di [Konfigurasi Chat Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Isi **Application info**:
     - **App name**: (misalnya `OpenClaw`)
     - **Avatar URL**: (misalnya `https://openclaw.ai/logo.png`)
     - **Description**: (misalnya `Asisten AI Pribadi`)
   - Aktifkan **Interactive features**.
   - Di bawah **Functionality**, centang **Join spaces and group conversations**.
   - Di bawah **Connection settings**, pilih **HTTP endpoint URL**.
   - Di bawah **Triggers**, pilih **Use a common HTTP endpoint URL for all triggers** dan atur ke URL publik Gateway Anda diikuti dengan `/googlechat`.
     - _Kiat: Jalankan `openclaw status` untuk menemukan URL publik Gateway Anda._
   - Di bawah **Visibility**, centang **Make this Chat app available to specific people and groups in `<Your Domain>`**.
   - Masukkan alamat email Anda (misalnya `user@example.com`) di kotak teks.
   - Klik **Save** di bagian bawah.
6. **Aktifkan status aplikasi**:
   - Setelah menyimpan, **muat ulang halaman**.
   - Cari bagian **App status** (biasanya dekat bagian atas atau bawah setelah menyimpan).
   - Ubah status menjadi **Live - available to users**.
   - Klik **Save** lagi.
7. Konfigurasikan OpenClaw dengan path service account + audiens Webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Atau config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Tetapkan jenis + nilai audiens Webhook (sesuai dengan config aplikasi Chat Anda).
9. Mulai Gateway. Google Chat akan mengirim POST ke path Webhook Anda.

## Tambahkan ke Google Chat

Setelah Gateway berjalan dan email Anda ditambahkan ke daftar visibilitas:

1. Buka [Google Chat](https://chat.google.com/).
2. Klik ikon **+** (plus) di sebelah **Direct Messages**.
3. Di bilah pencarian (tempat Anda biasanya menambahkan orang), ketik **App name** yang Anda konfigurasikan di Google Cloud Console.
   - **Catatan**: Bot _tidak_ akan muncul di daftar jelajah "Marketplace" karena ini aplikasi privat. Anda harus mencarinya berdasarkan nama.
4. Pilih bot Anda dari hasil.
5. Klik **Add** atau **Chat** untuk memulai percakapan 1:1.
6. Kirim "Halo" untuk memicu asisten!

## URL Publik (Hanya Webhook)

Webhook Google Chat memerlukan endpoint HTTPS publik. Demi keamanan, **hanya ekspos path `/googlechat`** ke internet. Biarkan dasbor OpenClaw dan endpoint sensitif lainnya tetap berada di jaringan privat Anda.

### Opsi A: Tailscale Funnel (Direkomendasikan)

Gunakan Tailscale Serve untuk dasbor privat dan Funnel untuk path Webhook publik. Ini menjaga `/` tetap privat sambil hanya mengekspos `/googlechat`.

1. **Periksa alamat yang menjadi binding Gateway Anda:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Catat alamat IP-nya (misalnya, `127.0.0.1`, `0.0.0.0`, atau IP Tailscale Anda seperti `100.x.x.x`).

2. **Ekspos dasbor hanya ke tailnet (port 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Ekspos hanya path Webhook secara publik:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Otorisasi node untuk akses Funnel:**
   Jika diminta, kunjungi URL otorisasi yang ditampilkan di output untuk mengaktifkan Funnel bagi node ini dalam kebijakan tailnet Anda.

5. **Verifikasi konfigurasi:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

URL Webhook publik Anda akan menjadi:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Dasbor privat Anda tetap hanya untuk tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Gunakan URL publik (tanpa `:8443`) di config aplikasi Google Chat.

> Catatan: Konfigurasi ini tetap ada setelah reboot. Untuk menghapusnya nanti, jalankan `tailscale funnel reset` dan `tailscale serve reset`.

### Opsi B: Proxy Terbalik (Caddy)

Jika Anda menggunakan proxy terbalik seperti Caddy, hanya proxy path tertentu:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Dengan config ini, setiap permintaan ke `your-domain.com/` akan diabaikan atau dikembalikan sebagai 404, sementara `your-domain.com/googlechat` dirutekan dengan aman ke OpenClaw.

### Opsi C: Cloudflare Tunnel

Konfigurasikan aturan ingress tunnel Anda agar hanya merutekan path Webhook:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Aturan Default**: HTTP 404 (Tidak Ditemukan)

## Cara kerjanya

1. Google Chat mengirim POST Webhook ke Gateway. Setiap permintaan menyertakan header `Authorization: Bearer <token>`.
   - OpenClaw memverifikasi auth bearer sebelum membaca/mengurai body Webhook penuh saat header ada.
   - Permintaan Google Workspace Add-on yang membawa `authorizationEventObject.systemIdToken` di body didukung melalui batas anggaran body pre-auth yang lebih ketat.
2. OpenClaw memverifikasi token terhadap `audienceType` + `audience` yang dikonfigurasi:
   - `audienceType: "app-url"` → audiens adalah URL Webhook HTTPS Anda.
   - `audienceType: "project-number"` → audiens adalah nomor proyek Cloud.
3. Pesan dirutekan berdasarkan ruang:
   - DM menggunakan kunci sesi `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Ruang menggunakan kunci sesi `agent:<agentId>:googlechat:group:<spaceId>`.
4. Akses DM menggunakan pairing secara default. Pengirim tidak dikenal menerima kode pairing; setujui dengan:
   - `openclaw pairing approve googlechat <code>`
5. Ruang grup memerlukan @-mention secara default. Gunakan `botUser` jika deteksi mention memerlukan nama pengguna aplikasi.

## Target

Gunakan pengenal ini untuk pengiriman dan allowlist:

- Pesan langsung: `users/<userId>` (direkomendasikan).
- Email mentah `name@example.com` dapat berubah dan hanya digunakan untuk pencocokan allowlist langsung saat `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Tidak digunakan lagi: `users/<email>` diperlakukan sebagai id pengguna, bukan allowlist email.
- Ruang: `spaces/<spaceId>`.

## Sorotan config

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
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
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Catatan:

- Kredensial service account juga dapat diteruskan secara inline dengan `serviceAccount` (string JSON).
- `serviceAccountRef` juga didukung (env/file SecretRef), termasuk ref per akun di bawah `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Path Webhook default adalah `/googlechat` jika `webhookPath` tidak diatur.
- `dangerouslyAllowNameMatching` mengaktifkan kembali pencocokan prinsipal email yang dapat berubah untuk allowlist (mode kompatibilitas break-glass).
- Reaksi tersedia melalui alat `reactions` dan `channels action` saat `actions.reactions` diaktifkan.
- Tindakan pesan mengekspos `send` untuk teks dan `upload-file` untuk pengiriman lampiran eksplisit. `upload-file` menerima `media` / `filePath` / `path` plus `message`, `filename`, dan penargetan thread opsional.
- `typingIndicator` mendukung `none`, `message` (default), dan `reaction` (reaksi memerlukan OAuth pengguna).
- Lampiran diunduh melalui Chat API dan disimpan di pipeline media (ukuran dibatasi oleh `mediaMaxMb`).

Detail referensi rahasia: [Manajemen Rahasia](/id/gateway/secrets).

## Pemecahan masalah

### 405 Metode Tidak Diizinkan

Jika Google Cloud Logs Explorer menampilkan kesalahan seperti:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Ini berarti handler Webhook belum terdaftar. Penyebab umum:

1. **Kanal belum dikonfigurasi**: Bagian `channels.googlechat` hilang dari config Anda. Verifikasi dengan:

   ```bash
   openclaw config get channels.googlechat
   ```

   Jika mengembalikan "Config path not found", tambahkan konfigurasi (lihat [Sorotan config](#config-highlights)).

2. **Plugin tidak diaktifkan**: Periksa status Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Jika menampilkan "disabled", tambahkan `plugins.entries.googlechat.enabled: true` ke config Anda.

3. **Gateway belum dimulai ulang**: Setelah menambahkan config, mulai ulang Gateway:

   ```bash
   openclaw gateway restart
   ```

Verifikasi kanal sedang berjalan:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Masalah lain

- Periksa `openclaw channels status --probe` untuk kesalahan auth atau config audiens yang hilang.
- Jika tidak ada pesan yang masuk, konfirmasi URL Webhook aplikasi Chat + langganan peristiwa.
- Jika gating mention memblokir balasan, atur `botUser` ke nama resource pengguna aplikasi dan verifikasi `requireMention`.
- Gunakan `openclaw logs --follow` saat mengirim pesan uji untuk melihat apakah permintaan mencapai Gateway.

Dokumen terkait:

- [Konfigurasi Gateway](/id/gateway/configuration)
- [Keamanan](/id/gateway/security)
- [Reaksi](/id/tools/reactions)

## Terkait

- [Ikhtisar Kanal](/id/channels) — semua kanal yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku obrolan grup dan gating mention
- [Perutean Kanal](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan penguatan
