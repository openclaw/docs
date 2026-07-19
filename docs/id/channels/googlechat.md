---
read_when:
    - Mengerjakan fitur saluran Google Chat
summary: Status dukungan, kemampuan, dan konfigurasi aplikasi Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-07-19T16:35:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5300ce6da3bf69136b7286dc87f14a5809c5f28a206c881a95f520376304b97d
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat berjalan sebagai plugin resmi `@openclaw/googlechat`: DM dan ruang melalui webhook Google Chat API (hanya endpoint HTTP, tanpa Pub/Sub).

## Instalasi

```bash
openclaw plugins install @openclaw/googlechat
```

Checkout lokal (saat menjalankan dari repo git):

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
4. Simpan file JSON yang diunduh di host Gateway Anda (misalnya, `~/.openclaw/googlechat-service-account.json`).
5. Buat aplikasi Google Chat di [Konfigurasi Chat Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Isi **Application info** (nama aplikasi, URL avatar, deskripsi).
   - Aktifkan **Interactive features**.
   - Di bagian **Functionality**, centang **Join spaces and group conversations**.
   - Di bagian **Connection settings**, pilih **HTTP endpoint URL**.
   - Di bagian **Triggers**, pilih **Use a common HTTP endpoint URL for all triggers** dan atur ke URL Gateway publik Anda yang diikuti oleh `/googlechat` (lihat [URL publik](#public-url-webhook-only)).
   - Di bagian **Visibility**, centang **Make this Chat app available to specific people and groups in `<Your Domain>`** dan masukkan alamat email Anda.
   - Klik **Save**.
6. Aktifkan status aplikasi: muat ulang halaman, temukan **App status**, atur ke **Live - available to users**, lalu **Save** lagi.
7. Konfigurasikan OpenClaw dengan akun layanan dan audiens webhook (harus sesuai dengan konfigurasi aplikasi Chat):
   - Variabel lingkungan: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json` (hanya akun default), atau
   - Konfigurasi: lihat [Sorotan konfigurasi](#config-highlights). `openclaw channels add --channel googlechat` juga menerima `--audience-type`, `--audience`, `--webhook-path`, dan `--webhook-url`.
8. Mulai Gateway. Google Chat akan mengirim POST ke jalur webhook Anda (default `/googlechat`).

## Tambahkan ke Google Chat

Setelah Gateway berjalan dan email Anda ada dalam daftar visibilitas:

1. Buka [Google Chat](https://chat.google.com/).
2. Klik ikon **+** (tambah) di sebelah **Direct Messages**.
3. Cari **App name** yang Anda konfigurasikan di Google Cloud Console.
   - Bot _tidak_ muncul dalam daftar penelusuran Marketplace karena merupakan aplikasi privat; cari berdasarkan namanya.
4. Pilih bot, klik **Add** atau **Chat**, lalu kirim pesan.

## URL publik (Khusus webhook)

Webhook Google Chat memerlukan endpoint HTTPS publik. Demi keamanan, ekspos **hanya jalur `/googlechat`** ke internet dan pertahankan dasbor OpenClaw serta endpoint lainnya tetap privat.

### Opsi A: Tailscale Funnel (Direkomendasikan)

Gunakan Tailscale Serve untuk dasbor privat dan Funnel untuk jalur webhook publik.

1. Periksa alamat yang menjadi tujuan pengikatan Gateway Anda:

   ```bash
   ss -tlnp | grep 18789
   ```

   Catat IP-nya (misalnya, `127.0.0.1`, `0.0.0.0`, atau alamat Tailscale `100.x.x.x`).

2. Ekspos dasbor hanya ke tailnet (port 8443):

   ```bash
   # Jika terikat ke localhost (127.0.0.1 atau 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Jika hanya terikat ke IP Tailscale:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. Ekspos hanya jalur webhook secara publik:

   ```bash
   # Jika terikat ke localhost (127.0.0.1 atau 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Jika hanya terikat ke IP Tailscale:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. Jika diminta, kunjungi URL otorisasi yang ditampilkan dalam output untuk mengaktifkan Funnel bagi Node ini.

5. Verifikasi:

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

URL webhook publik Anda adalah `https://<node-name>.<tailnet>.ts.net/googlechat`; dasbor tetap hanya dapat diakses melalui tailnet di `https://<node-name>.<tailnet>.ts.net:8443/`. Gunakan URL publik (tanpa `:8443`) dalam konfigurasi aplikasi Google Chat.

> Catatan: Konfigurasi ini tetap berlaku setelah mulai ulang. Hapus nanti dengan `tailscale funnel reset` dan `tailscale serve reset`.

### Opsi B: Proksi terbalik (Caddy)

Proksikan hanya jalur webhook:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Permintaan ke `your-domain.com/` diabaikan atau menghasilkan 404, sedangkan `your-domain.com/googlechat` dirutekan ke OpenClaw.

### Opsi C: Cloudflare Tunnel

Konfigurasikan aturan ingress tunnel agar hanya merutekan jalur webhook:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default rule**: HTTP 404 (Not Found)

## Cara kerjanya

1. Google Chat mengirim POST berisi JSON ke jalur webhook Gateway (hanya POST, jenis konten JSON wajib, dibatasi lajunya per IP).
2. OpenClaw mengautentikasi setiap permintaan sebelum meneruskannya:
   - Peristiwa aplikasi Chat membawa `Authorization: Bearer <token>`; token diverifikasi sebelum seluruh isi permintaan diuraikan.
   - Peristiwa Add-on Google Workspace membawa token dalam isi permintaan (`authorizationEventObject.systemIdToken`) dan dibaca dengan batas praautentikasi yang lebih ketat (16 KB, 3 dtk) sebelum diverifikasi.
3. Token diperiksa terhadap `audienceType` + `audience`:
   - `audienceType: "app-url"` → audiens adalah URL webhook HTTPS Anda.
   - `audienceType: "project-number"` → audiens adalah nomor proyek Cloud.
   - Token Add-on dalam `app-url` juga mewajibkan `appPrincipal` diatur ke ID klien OAuth 2.0 numerik aplikasi (21 digit, bukan email); jika tidak, verifikasi gagal dengan peringatan yang dicatat.
4. Pesan dirutekan berdasarkan ruang:
   - Ruang mendapatkan sesi per ruang `agent:<agentId>:googlechat:group:<spaceId>`; balasan dikirim ke utas pesan.
   - Secara default, DM digabungkan ke sesi utama agen; atur `session.dmScope` untuk sesi DM per rekan (lihat [Sesi](/id/concepts/session)).
5. Akses DM menggunakan pemasangan secara default. Pengirim yang tidak dikenal menerima kode pemasangan; setujui dengan:
   - `openclaw pairing approve googlechat <code>`
6. Secara default, ruang grup memerlukan penyebutan @. Penyebutan dideteksi dari anotasi `USER_MENTION` Chat yang menargetkan aplikasi; atur `botUser` (misalnya, `users/1234567890`) jika deteksi memerlukan nama sumber daya pengguna aplikasi.
7. Saat persetujuan eksekusi atau Plugin dimulai dari Google Chat dan pemberi persetujuan `users/<id>` yang stabil dikonfigurasikan, OpenClaw memposting kartu persetujuan native (`cardsV2`) di ruang atau utas asal. Tombol kartu membawa token callback buram; perintah manual `/approve <id> <decision>` hanya muncul jika pengiriman native tidak tersedia.

### Ketahanan pesan masuk

Setelah autentikasi permintaan, OpenClaw menghapus objek otorisasi Add-on dari penyimpanan dan memasukkan peristiwa `MESSAGE` Google Chat secara persisten ke antrean sebelum mengembalikan `200`. Kegagalan persistensi mengembalikan `503`, sehingga Google Chat dapat mencoba lagi alih-alih mengakui peristiwa yang mungkin hilang.

Pesan yang tertunda atau dapat dicoba ulang tetap bertahan setelah Gateway dimulai ulang, tetap diserialkan per ruang, dan menggunakan nama sumber daya pesan Google Chat untuk mencegah entri antrean duplikat selama catatan penyelesaian yang aktif atau dipertahankan masih ada. Tindakan nonpesan mempertahankan jalur webhook terpisah yang ada dan tidak mendapatkan jaminan antrean persisten ini. Pengiriman tetap bersifat setidaknya satu kali melintasi batas antrean-ke-agen, sehingga crash selama serah terima dapat memutar ulang satu giliran.

## Target

Gunakan pengidentifikasi berikut untuk pengiriman dan daftar izin:

- Pesan langsung: `users/<userId>` (direkomendasikan).
- Ruang: `spaces/<spaceId>`.
- Email mentah `name@example.com` dapat berubah dan hanya digunakan untuk pencocokan daftar izin saat `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Tidak digunakan lagi: `users/<email>` diperlakukan sebagai ID pengguna, bukan entri daftar izin email.
- Prefiks `googlechat:`, `google-chat:`, dan `gchat:` diterima dan dihapus.

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
      botUser: "users/1234567890", // opsional; membantu deteksi penyebutan
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

- Kredensial akun layanan: `serviceAccountFile` (jalur), `serviceAccount` (string atau objek JSON sebaris), atau `serviceAccountRef` (SecretRef variabel lingkungan/file). Variabel lingkungan `GOOGLE_CHAT_SERVICE_ACCOUNT` (JSON sebaris) dan `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (jalur) hanya berlaku untuk akun default. Penyiapan multiakun menggunakan `channels.googlechat.accounts.<id>` dengan kunci yang sama, termasuk `serviceAccountRef` per akun.
- Jalur webhook default adalah `/googlechat` saat `webhookPath` tidak diatur; `webhookUrl` dapat menyediakan jalur sebagai gantinya.
- Kunci grup harus berupa ID ruang yang stabil (`spaces/<spaceId>`). Kunci nama tampilan tidak digunakan lagi dan dicatat sebagaimana mestinya.
- `dangerouslyAllowNameMatching` mengaktifkan kembali pencocokan prinsipal email yang dapat berubah untuk daftar izin (mode kompatibilitas darurat); doctor memperingatkan tentang entri email.
- Tindakan reaksi Google Chat tidak diekspos. Plugin menggunakan autentikasi akun layanan, sedangkan endpoint reaksi Google Chat memerlukan autentikasi pengguna. Konfigurasi `actions.reactions` yang ada diterima untuk kompatibilitas, tetapi tidak berpengaruh.
- Kartu persetujuan native menggunakan klik tombol `cardsV2` Google Chat, bukan peristiwa reaksi. Pemberi persetujuan berasal dari `allowFrom` atau `defaultTo` dan harus berupa nilai `users/<id>` numerik yang stabil.
- Tindakan pesan hanya mengekspos `send` teks. Pengunggahan lampiran Google Chat memerlukan autentikasi pengguna, sedangkan Plugin ini menggunakan autentikasi akun layanan, sehingga pengunggahan file keluar tidak diekspos.
- `typingIndicator`: `message` (default) memposting placeholder `_<Bot> is typing..._` dan mengeditnya menjadi balasan pertama; `none` menonaktifkannya; `reaction` memerlukan OAuth pengguna dan saat ini kembali menggunakan `message` dengan kesalahan yang dicatat saat menggunakan autentikasi akun layanan.
- Lampiran masuk (lampiran pertama per pesan) diunduh melalui Chat API ke pipeline media, dengan batas `mediaMaxMb` (default 20).
- Pesan yang dibuat bot diabaikan secara default. Dengan `allowBots: true`, pesan bot yang diterima menggunakan [perlindungan perulangan bot](/id/channels/bot-loop-protection) bersama: konfigurasikan `channels.defaults.botLoopProtection`, lalu timpa dengan `channels.googlechat.botLoopProtection` atau `channels.googlechat.groups.<space>.botLoopProtection`.

Detail referensi rahasia: [Manajemen Rahasia](/id/gateway/secrets).

## Pemecahan masalah

### 405 Method Not Allowed

Jika Google Cloud Logs Explorer menampilkan kesalahan seperti:

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Penangan webhook tidak terdaftar. Penyebab umum:

1. **Saluran tidak dikonfigurasi**: bagian `channels.googlechat` tidak ada. Verifikasi dengan:

   ```bash
   openclaw config get channels.googlechat
   ```

   Jika perintah tersebut mengembalikan "Config path not found", tambahkan konfigurasi (lihat [Sorotan konfigurasi](#config-highlights)).

2. **Plugin tidak diaktifkan**: periksa status plugin:

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
- Jika tidak ada pesan yang masuk, konfirmasikan URL webhook dan konfigurasi pemicu aplikasi Chat.
- Jika pembatasan penyebutan memblokir balasan, atur `botUser` ke nama resource pengguna aplikasi dan periksa `requireMention`.
- `openclaw logs --follow` saat mengirim pesan uji menunjukkan apakah permintaan mencapai Gateway.

## Terkait

- [Ikhtisar Saluran](/id/channels) — semua saluran yang didukung
- [Perutean Saluran](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Konfigurasi Gateway](/id/gateway/configuration)
- [Grup](/id/channels/groups) — perilaku obrolan grup dan pembatasan penyebutan
- [Pemasangan](/id/channels/pairing) — autentikasi DM dan alur pemasangan
- [Keamanan](/id/gateway/security) — model akses dan penguatan
