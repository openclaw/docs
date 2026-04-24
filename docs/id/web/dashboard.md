---
read_when:
    - Mengubah autentikasi dasbor atau mode eksposur
summary: Akses dan autentikasi dasbor Gateway (UI Control)
title: Dasbor
x-i18n:
    generated_at: "2026-04-24T09:34:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8753e0edf0a04e4c36b76aa6973dcd9d903a98c0b85e498bfcb05e728bb6272b
    source_path: web/dashboard.md
    workflow: 15
---

Dasbor Gateway adalah UI Control berbasis browser yang disajikan di `/` secara default
(override dengan `gateway.controlUi.basePath`).

Buka cepat (Gateway lokal):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (atau [http://localhost:18789/](http://localhost:18789/))

Referensi utama:

- [UI Control](/id/web/control-ui) untuk penggunaan dan kemampuan UI.
- [Tailscale](/id/gateway/tailscale) untuk otomatisasi Serve/Funnel.
- [Permukaan web](/id/web) untuk mode bind dan catatan keamanan.

Autentikasi ditegakkan saat handshake WebSocket melalui jalur autentikasi gateway yang dikonfigurasi:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Header identitas Tailscale Serve saat `gateway.auth.allowTailscale: true`
- Header identitas trusted-proxy saat `gateway.auth.mode: "trusted-proxy"`

Lihat `gateway.auth` di [Konfigurasi Gateway](/id/gateway/configuration).

Catatan keamanan: UI Control adalah **permukaan admin** (chat, config, persetujuan exec).
Jangan ekspos ini ke publik. UI menyimpan token URL dasbor di sessionStorage
untuk sesi tab browser saat ini dan URL gateway yang dipilih, lalu menghapusnya dari URL setelah dimuat.
Utamakan localhost, Tailscale Serve, atau tunnel SSH.

## Jalur cepat (disarankan)

- Setelah onboarding, CLI otomatis membuka dasbor dan mencetak tautan bersih (tanpa token).
- Buka kembali kapan saja: `openclaw dashboard` (menyalin tautan, membuka browser jika memungkinkan, menampilkan petunjuk SSH jika headless).
- Jika UI meminta autentikasi shared-secret, tempel token atau
  password yang dikonfigurasi ke pengaturan UI Control.

## Dasar autentikasi (lokal vs remote)

- **Localhost**: buka `http://127.0.0.1:18789/`.
- **Sumber token shared-secret**: `gateway.auth.token` (atau
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` dapat meneruskannya melalui fragmen URL
  untuk bootstrap satu kali, dan UI Control menyimpannya di sessionStorage untuk
  sesi tab browser saat ini dan URL gateway yang dipilih, bukan localStorage.
- Jika `gateway.auth.token` dikelola oleh SecretRef, `openclaw dashboard`
  secara desain mencetak/menyalin/membuka URL tanpa token. Ini menghindari mengekspos
  token yang dikelola secara eksternal di log shell, riwayat clipboard, atau argumen
  peluncuran browser.
- Jika `gateway.auth.token` dikonfigurasi sebagai SecretRef dan tidak ter-resolve di
  shell Anda saat ini, `openclaw dashboard` tetap mencetak URL tanpa token plus
  panduan penyiapan autentikasi yang dapat ditindaklanjuti.
- **Password shared-secret**: gunakan `gateway.auth.password` yang dikonfigurasi (atau
  `OPENCLAW_GATEWAY_PASSWORD`). Dasbor tidak menyimpan password saat reload.
- **Mode pembawa identitas**: Tailscale Serve dapat memenuhi autentikasi
  UI Control/WebSocket melalui header identitas saat `gateway.auth.allowTailscale: true`, dan
  reverse proxy sadar-identitas non-loopback dapat memenuhi
  `gateway.auth.mode: "trusted-proxy"`. Dalam mode-mode tersebut, dasbor tidak
  memerlukan shared secret yang ditempel untuk WebSocket.
- **Bukan localhost**: gunakan Tailscale Serve, bind shared-secret non-loopback, reverse proxy sadar-identitas non-loopback dengan
  `gateway.auth.mode: "trusted-proxy"`, atau tunnel SSH. API HTTP tetap menggunakan
  autentikasi shared-secret kecuali Anda sengaja menjalankan ingress privat
  `gateway.auth.mode: "none"` atau autentikasi HTTP trusted-proxy. Lihat
  [Permukaan web](/id/web).

<a id="if-you-see-unauthorized-1008"></a>

## Jika Anda melihat "unauthorized" / 1008

- Pastikan gateway dapat dijangkau (lokal: `openclaw status`; remote: tunnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` lalu buka `http://127.0.0.1:18789/`).
- Untuk `AUTH_TOKEN_MISMATCH`, klien dapat melakukan satu retry tepercaya dengan token perangkat yang di-cache saat gateway mengembalikan petunjuk retry. Retry token-cache itu menggunakan kembali scope yang disetujui yang di-cache milik token tersebut; pemanggil `deviceToken` eksplisit / `scopes` eksplisit tetap mempertahankan set scope yang diminta. Jika autentikasi tetap gagal setelah retry itu, selesaikan drift token secara manual.
- Di luar jalur retry tersebut, prioritas autentikasi connect adalah shared token/password eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token perangkat yang tersimpan, lalu token bootstrap.
- Pada jalur UI Control Tailscale Serve async, percobaan gagal untuk pasangan
  `{scope, ip}` yang sama diserialkan sebelum limiter auth-gagal mencatatnya, sehingga
  retry buruk kedua yang konkuren sudah dapat menampilkan `retry later`.
- Untuk langkah perbaikan drift token, ikuti [Checklist pemulihan drift token](/id/cli/devices#token-drift-recovery-checklist).
- Ambil atau sediakan shared secret dari host gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Password: resolve `gateway.auth.password` yang dikonfigurasi atau
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token yang dikelola SecretRef: resolve provider rahasia eksternal atau ekspor
    `OPENCLAW_GATEWAY_TOKEN` di shell ini, lalu jalankan ulang `openclaw dashboard`
  - Tidak ada shared secret yang dikonfigurasi: `openclaw doctor --generate-gateway-token`
- Di pengaturan dasbor, tempel token atau password ke field autentikasi,
  lalu sambungkan.
- Pemilih bahasa UI ada di **Overview -> Gateway Access -> Language**.
  Ini bagian dari kartu akses, bukan bagian Appearance.

## Terkait

- [UI Control](/id/web/control-ui)
- [WebChat](/id/web/webchat)
