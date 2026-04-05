---
read_when:
    - Sedang mengerjakan fitur channel Google Chat
summary: Status dukungan aplikasi Google Chat, kapabilitas, dan konfigurasi
title: Google Chat
x-i18n:
    generated_at: "2026-04-05T13:42:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 570894ed798dd0b9ba42806b050927216379a1228fcd2f96de565bc8a4ac7c2c
    source_path: channels/googlechat.md
    workflow: 15
---

# Google Chat (Chat API)

Status: siap untuk DM + space melalui webhook Google Chat API (hanya HTTP).

## Penyiapan cepat (pemula)

1. Buat project Google Cloud dan aktifkan **Google Chat API**.
   - Buka: [Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Aktifkan API jika belum diaktifkan.
2. Buat **Service Account**:
   - Tekan **Create Credentials** > **Service Account**.
   - Beri nama sesuai keinginan Anda (misalnya, `openclaw-chat`).
   - Biarkan izin kosong (tekan **Continue**).
   - Biarkan principal dengan akses tetap kosong (tekan **Done**).
3. Buat dan unduh **JSON Key**:
   - Dalam daftar service account, klik yang baru saja Anda buat.
   - Buka tab **Keys**.
   - Klik **Add Key** > **Create new key**.
   - Pilih **JSON** dan tekan **Create**.
4. Simpan file JSON yang diunduh di host gateway Anda (misalnya, `~/.openclaw/googlechat-service-account.json`).
5. Buat aplikasi Google Chat di [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Isi **Application info**:
     - **App name**: (misalnya `OpenClaw`)
     - **Avatar URL**: (misalnya `https://openclaw.ai/logo.png`)
     - **Description**: (misalnya `Personal AI Assistant`)
   - Aktifkan **Interactive features**.
   - Di bawah **Functionality**, centang **Join spaces and group conversations**.
   - Di bawah **Connection settings**, pilih **HTTP endpoint URL**.
   - Di bawah **Triggers**, pilih **Use a common HTTP endpoint URL for all triggers** dan atur ke URL publik gateway Anda diikuti dengan `/googlechat`.
     - _Tip: Jalankan `openclaw status` untuk menemukan URL publik gateway Anda._
   - Di bawah **Visibility**, centang **Make this Chat app available to specific people and groups in &lt;Your Domain&gt;**.
   - Masukkan alamat email Anda (misalnya `user@example.com`) ke dalam kotak teks.
   - Klik **Save** di bagian bawah.
6. **Aktifkan status aplikasi**:
   - Setelah menyimpan, **muat ulang halaman**.
   - Cari bagian **App status** (biasanya di dekat atas atau bawah setelah menyimpan).
   - Ubah status menjadi **Live - available to users**.
   - Klik **Save** lagi.
7. Konfigurasikan OpenClaw dengan path service account + audience webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Atau config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Atur jenis + nilai audience webhook (sesuai dengan config aplikasi Chat Anda).
9. Mulai gateway. Google Chat akan mengirim POST ke path webhook Anda.

## Tambahkan ke Google Chat

Setelah gateway berjalan dan email Anda ditambahkan ke daftar visibilitas:

1. Buka [Google Chat](https://chat.google.com/).
2. Klik ikon **+** (plus) di samping **Direct Messages**.
3. Di bilah pencarian (tempat Anda biasanya menambahkan orang), ketik **App name** yang Anda konfigurasi di Google Cloud Console.
   - **Catatan**: Bot _tidak_ akan muncul dalam daftar penelusuran "Marketplace" karena ini adalah aplikasi privat. Anda harus mencarinya berdasarkan nama.
4. Pilih bot Anda dari hasil pencarian.
5. Klik **Add** atau **Chat** untuk memulai percakapan 1:1.
6. Kirim "Hello" untuk memicu asisten!

## URL publik (khusus webhook)

Webhook Google Chat memerlukan endpoint HTTPS publik. Demi keamanan, **hanya ekspos path `/googlechat`** ke internet. Simpan dashboard OpenClaw dan endpoint sensitif lainnya di jaringan privat Anda.

### Opsi A: Tailscale Funnel (Direkomendasikan)

Gunakan Tailscale Serve untuk dashboard privat dan Funnel untuk path webhook publik. Ini menjaga `/` tetap privat sambil hanya mengekspos `/googlechat`.

1. **Periksa alamat tempat gateway Anda terikat:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Catat alamat IP (misalnya `127.0.0.1`, `0.0.0.0`, atau IP Tailscale Anda seperti `100.x.x.x`).

2. **Ekspos dashboard hanya ke tailnet (port 8443):**

   ```bash
   # Jika terikat ke localhost (127.0.0.1 atau 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Jika terikat hanya ke IP Tailscale (misalnya, 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Ekspos hanya path webhook secara publik:**

   ```bash
   # Jika terikat ke localhost (127.0.0.1 atau 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Jika terikat hanya ke IP Tailscale (misalnya, 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Otorisasi node untuk akses Funnel:**
   Jika diminta, kunjungi URL otorisasi yang ditampilkan dalam output untuk mengaktifkan Funnel bagi node ini dalam kebijakan tailnet Anda.

5. **Verifikasi konfigurasi:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

URL webhook publik Anda akan menjadi:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Dashboard privat Anda tetap hanya untuk tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Gunakan URL publik (tanpa `:8443`) dalam config aplikasi Google Chat.

> Catatan: Konfigurasi ini tetap ada setelah reboot. Untuk menghapusnya nanti, jalankan `tailscale funnel reset` dan `tailscale serve reset`.

### Opsi B: Reverse Proxy (Caddy)

Jika Anda menggunakan reverse proxy seperti Caddy, proksikan hanya path spesifik:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Dengan config ini, setiap permintaan ke `your-domain.com/` akan diabaikan atau mengembalikan 404, sedangkan `your-domain.com/googlechat` akan dirutekan dengan aman ke OpenClaw.

### Opsi C: Cloudflare Tunnel

Konfigurasikan aturan ingress tunnel Anda agar hanya merutekan path webhook:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## Cara kerjanya

1. Google Chat mengirim webhook POST ke gateway. Setiap permintaan menyertakan header `Authorization: Bearer <token>`.
   - OpenClaw memverifikasi autentikasi bearer sebelum membaca/mem-parse body webhook penuh saat header tersebut ada.
   - Permintaan Google Workspace Add-on yang membawa `authorizationEventObject.systemIdToken` di dalam body didukung melalui anggaran body pra-autentikasi yang lebih ketat.
2. OpenClaw memverifikasi token terhadap `audienceType` + `audience` yang dikonfigurasi:
   - `audienceType: "app-url"` → audience adalah URL webhook HTTPS Anda.
   - `audienceType: "project-number"` → audience adalah nomor project Cloud.
3. Pesan dirutekan berdasarkan space:
   - DM menggunakan kunci sesi `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Space menggunakan kunci sesi `agent:<agentId>:googlechat:group:<spaceId>`.
4. Akses DM menggunakan pairing secara default. Pengirim yang tidak dikenal menerima kode pairing; setujui dengan:
   - `openclaw pairing approve googlechat <code>`
5. Space grup memerlukan @-mention secara default. Gunakan `botUser` jika deteksi mention memerlukan nama pengguna aplikasi.

## Target

Gunakan identifier ini untuk pengiriman dan allowlist:

- Direct messages: `users/<userId>` (direkomendasikan).
- Email mentah `name@example.com` dapat berubah dan hanya digunakan untuk pencocokan allowlist direct saat `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Deprecated: `users/<email>` diperlakukan sebagai user id, bukan allowlist email.
- Spaces: `spaces/<spaceId>`.

## Sorotan config

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // atau serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // opsional; membantu deteksi mention
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
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

- Kredensial service account juga dapat diberikan secara inline dengan `serviceAccount` (string JSON).
- `serviceAccountRef` juga didukung (SecretRef env/file), termasuk ref per akun di bawah `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Path webhook default adalah `/googlechat` jika `webhookPath` tidak diatur.
- `dangerouslyAllowNameMatching` mengaktifkan kembali pencocokan principal email yang dapat berubah untuk allowlist (mode kompatibilitas break-glass).
- Reactions tersedia melalui alat `reactions` dan `channels action` saat `actions.reactions` diaktifkan.
- Message actions mengekspos `send` untuk teks dan `upload-file` untuk pengiriman lampiran eksplisit. `upload-file` menerima `media` / `filePath` / `path` ditambah `message`, `filename`, dan penargetan thread opsional.
- `typingIndicator` mendukung `none`, `message` (default), dan `reaction` (reaction memerlukan OAuth pengguna).
- Lampiran diunduh melalui Chat API dan disimpan di pipeline media (ukuran dibatasi oleh `mediaMaxMb`).

Detail referensi rahasia: [Secrets Management](/gateway/secrets).

## Pemecahan masalah

### 405 Method Not Allowed

Jika Google Cloud Logs Explorer menampilkan error seperti:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Ini berarti handler webhook tidak terdaftar. Penyebab umum:

1. **Channel tidak dikonfigurasi**: Bagian `channels.googlechat` tidak ada dari config Anda. Verifikasi dengan:

   ```bash
   openclaw config get channels.googlechat
   ```

   Jika mengembalikan "Config path not found", tambahkan konfigurasi tersebut (lihat [Sorotan config](#config-highlights)).

2. **Plugin tidak diaktifkan**: Periksa status plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Jika menampilkan "disabled", tambahkan `plugins.entries.googlechat.enabled: true` ke config Anda.

3. **Gateway belum dimulai ulang**: Setelah menambahkan config, mulai ulang gateway:

   ```bash
   openclaw gateway restart
   ```

Verifikasi bahwa channel berjalan:

```bash
openclaw channels status
# Harus menampilkan: Google Chat default: enabled, configured, ...
```

### Masalah lain

- Periksa `openclaw channels status --probe` untuk error autentikasi atau config audience yang hilang.
- Jika tidak ada pesan yang masuk, konfirmasikan URL webhook + langganan peristiwa aplikasi Chat.
- Jika pembatasan mention memblokir balasan, atur `botUser` ke nama resource pengguna aplikasi dan verifikasi `requireMention`.
- Gunakan `openclaw logs --follow` saat mengirim pesan uji untuk melihat apakah permintaan mencapai gateway.

Dokumen terkait:

- [Konfigurasi gateway](/gateway/configuration)
- [Keamanan](/gateway/security)
- [Reactions](/tools/reactions)

## Terkait

- [Ikhtisar Channels](/channels) — semua channel yang didukung
- [Pairing](/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/channels/groups) — perilaku obrolan grup dan pembatasan mention
- [Channel Routing](/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/gateway/security) — model akses dan penguatan
