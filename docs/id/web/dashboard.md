---
read_when:
    - Mengubah autentikasi dasbor atau mode eksposur
summary: Akses dan autentikasi dasbor Gateway (Control UI)
title: Dasbor
x-i18n:
    generated_at: "2026-05-05T01:50:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e2086587fee6303221663748c3047886a5beae29862d66e2edf78e02bfe3da1
    source_path: web/dashboard.md
    workflow: 16
---

Dasbor Gateway adalah UI Kontrol browser yang secara default disajikan di `/`
(ganti dengan `gateway.controlUi.basePath`).

Buka cepat (Gateway lokal):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (atau [http://localhost:18789/](http://localhost:18789/))
- Dengan `gateway.tls.enabled: true`, gunakan `https://127.0.0.1:18789/` dan
  `wss://127.0.0.1:18789` untuk endpoint WebSocket.

Referensi utama:

- [UI Kontrol](/id/web/control-ui) untuk penggunaan dan kemampuan UI.
- [Tailscale](/id/gateway/tailscale) untuk otomatisasi Serve/Funnel.
- [Permukaan web](/id/web) untuk mode bind dan catatan keamanan.

Autentikasi diterapkan pada handshake WebSocket melalui jalur auth gateway
yang dikonfigurasi:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header identitas Tailscale Serve ketika `gateway.auth.allowTailscale: true`
- header identitas trusted-proxy ketika `gateway.auth.mode: "trusted-proxy"`

Lihat `gateway.auth` di [Konfigurasi Gateway](/id/gateway/configuration).

Catatan keamanan: UI Kontrol adalah **permukaan admin** (chat, config, persetujuan exec).
Jangan ekspos secara publik. UI menyimpan token URL dasbor di sessionStorage
untuk sesi tab browser saat ini dan URL gateway yang dipilih, lalu menghapusnya dari URL setelah dimuat.
Utamakan localhost, Tailscale Serve, atau tunnel SSH.

## Jalur cepat (direkomendasikan)

- Setelah onboarding, CLI otomatis membuka dasbor dan mencetak tautan bersih (tanpa token).
- Buka ulang kapan saja: `openclaw dashboard` (menyalin tautan, membuka browser jika memungkinkan, menampilkan petunjuk SSH jika headless).
- Jika pengiriman melalui clipboard dan browser gagal, `openclaw dashboard` tetap mencetak
  URL bersih dan memberi tahu Anda untuk menggunakan token dari `OPENCLAW_GATEWAY_TOKEN` atau
  `gateway.auth.token` sebagai kunci fragmen URL `token`; perintah ini tidak mencetak nilai
  token di log.
- Jika UI meminta auth rahasia bersama, tempel token atau
  kata sandi yang dikonfigurasi ke pengaturan UI Kontrol.

## Dasar auth (lokal vs jarak jauh)

- **Localhost**: buka `http://127.0.0.1:18789/`.
- **TLS Gateway**: ketika `gateway.tls.enabled: true`, tautan dasbor/status menggunakan
  `https://` dan tautan WebSocket UI Kontrol menggunakan `wss://`.
- **Sumber token rahasia bersama**: `gateway.auth.token` (atau
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` dapat meneruskannya melalui fragmen URL
  untuk bootstrap satu kali, dan UI Kontrol menyimpannya di sessionStorage untuk
  sesi tab browser saat ini dan URL gateway yang dipilih, bukan di localStorage.
- Jika `gateway.auth.token` dikelola SecretRef, `openclaw dashboard`
  sengaja mencetak/menyalin/membuka URL tanpa token. Ini menghindari tereksposnya
  token yang dikelola secara eksternal di log shell, riwayat clipboard, atau argumen
  peluncuran browser.
- Jika `gateway.auth.token` dikonfigurasi sebagai SecretRef dan belum terselesaikan di
  shell Anda saat ini, `openclaw dashboard` tetap mencetak URL tanpa token beserta
  panduan penyiapan auth yang dapat ditindaklanjuti.
- **Kata sandi rahasia bersama**: gunakan `gateway.auth.password` yang dikonfigurasi (atau
  `OPENCLAW_GATEWAY_PASSWORD`). Dasbor tidak mempertahankan kata sandi lintas
  pemuatan ulang.
- **Mode yang membawa identitas**: Tailscale Serve dapat memenuhi auth UI Kontrol/WebSocket
  melalui header identitas ketika `gateway.auth.allowTailscale: true`, dan reverse proxy
  non-loopback yang sadar identitas dapat memenuhi
  `gateway.auth.mode: "trusted-proxy"`. Dalam mode tersebut, dasbor tidak
  memerlukan rahasia bersama yang ditempel untuk WebSocket.
- **Bukan localhost**: gunakan Tailscale Serve, bind rahasia bersama non-loopback,
  reverse proxy non-loopback yang sadar identitas dengan
  `gateway.auth.mode: "trusted-proxy"`, atau tunnel SSH. API HTTP tetap menggunakan
  auth rahasia bersama kecuali Anda sengaja menjalankan
  `gateway.auth.mode: "none"` untuk ingress privat atau auth HTTP trusted-proxy. Lihat
  [Permukaan web](/id/web).

<a id="if-you-see-unauthorized-1008"></a>

## Jika Anda melihat "unauthorized" / 1008

- Pastikan gateway dapat dijangkau (lokal: `openclaw status`; jarak jauh: tunnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` lalu buka `http://127.0.0.1:18789/`).
- Untuk `AUTH_TOKEN_MISMATCH`, klien dapat melakukan satu percobaan ulang tepercaya dengan token perangkat yang di-cache ketika gateway mengembalikan petunjuk retry. Retry token yang di-cache tersebut menggunakan ulang cakupan yang disetujui dari cache token; pemanggil `deviceToken` eksplisit / `scopes` eksplisit mempertahankan kumpulan cakupan yang diminta. Jika auth masih gagal setelah retry tersebut, selesaikan drift token secara manual.
- Di luar jalur retry tersebut, prioritas auth koneksi adalah token/kata sandi bersama eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token perangkat tersimpan, lalu token bootstrap.
- Pada jalur UI Kontrol Tailscale Serve asinkron, percobaan gagal untuk
  `{scope, ip}` yang sama diserialkan sebelum limiter auth gagal mencatatnya, sehingga
  retry buruk kedua yang bersamaan sudah dapat menampilkan `retry later`.
- Untuk langkah perbaikan drift token, ikuti [Daftar periksa pemulihan drift token](/id/cli/devices#token-drift-recovery-checklist).
- Ambil atau berikan rahasia bersama dari host gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Kata sandi: selesaikan `gateway.auth.password` yang dikonfigurasi atau
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token yang dikelola SecretRef: selesaikan penyedia rahasia eksternal atau ekspor
    `OPENCLAW_GATEWAY_TOKEN` di shell ini, lalu jalankan ulang `openclaw dashboard`
  - Tidak ada rahasia bersama yang dikonfigurasi: `openclaw doctor --generate-gateway-token`
- Di pengaturan dasbor, tempel token atau kata sandi ke kolom auth,
  lalu hubungkan.
- Pemilih bahasa UI ada di **Ikhtisar -> Akses Gateway -> Bahasa**.
  Ini adalah bagian dari kartu akses, bukan bagian Tampilan.

## Terkait

- [UI Kontrol](/id/web/control-ui)
- [WebChat](/id/web/webchat)
