---
read_when:
    - Mengubah autentikasi dashboard atau mode eksposur
summary: Akses dan autentikasi dashboard Gateway (UI Kontrol)
title: Dashboard
x-i18n:
    generated_at: "2026-04-05T14:10:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 316e082ae4759f710b457487351e30c53b34c7c2b4bf84ad7b091a50538af5cc
    source_path: web/dashboard.md
    workflow: 15
---

# Dashboard (UI Kontrol)

Dashboard Gateway adalah UI Kontrol berbasis browser yang disajikan di `/` secara default
(override dengan `gateway.controlUi.basePath`).

Buka cepat (Gateway lokal):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (atau [http://localhost:18789/](http://localhost:18789/))

Referensi utama:

- [UI Kontrol](/web/control-ui) untuk penggunaan dan kemampuan UI.
- [Tailscale](/id/gateway/tailscale) untuk otomatisasi Serve/Funnel.
- [Permukaan web](/web) untuk mode bind dan catatan keamanan.

Autentikasi diberlakukan pada handshake WebSocket melalui jalur autentikasi gateway
yang dikonfigurasi:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Header identitas Tailscale Serve saat `gateway.auth.allowTailscale: true`
- Header identitas trusted-proxy saat `gateway.auth.mode: "trusted-proxy"`

Lihat `gateway.auth` di [Konfigurasi Gateway](/id/gateway/configuration).

Catatan keamanan: UI Kontrol adalah **permukaan admin** (chat, config, persetujuan exec).
Jangan mengeksposnya secara publik. UI menyimpan token URL dashboard di sessionStorage
untuk sesi tab browser saat ini dan URL gateway yang dipilih, lalu menghapusnya dari URL setelah dimuat.
Pilih localhost, Tailscale Serve, atau tunnel SSH.

## Jalur cepat (direkomendasikan)

- Setelah onboarding, CLI otomatis membuka dashboard dan mencetak tautan bersih (tanpa token).
- Buka kembali kapan saja: `openclaw dashboard` (menyalin tautan, membuka browser jika memungkinkan, menampilkan petunjuk SSH jika headless).
- Jika UI meminta autentikasi shared-secret, tempel token atau
  password yang dikonfigurasi ke pengaturan UI Kontrol.

## Dasar autentikasi (lokal vs jarak jauh)

- **Localhost**: buka `http://127.0.0.1:18789/`.
- **Sumber token shared-secret**: `gateway.auth.token` (atau
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` dapat meneruskannya melalui URL fragment
  untuk bootstrap satu kali, dan UI Kontrol menyimpannya di sessionStorage untuk
  sesi tab browser saat ini dan URL gateway yang dipilih alih-alih localStorage.
- Jika `gateway.auth.token` dikelola SecretRef, `openclaw dashboard`
  mencetak/menyalin/membuka URL tanpa token secara desain. Ini menghindari
  mengekspos token yang dikelola secara eksternal di log shell, riwayat clipboard, atau argumen peluncuran browser.
- Jika `gateway.auth.token` dikonfigurasi sebagai SecretRef dan tidak dapat diresolusikan di
  shell Anda saat ini, `openclaw dashboard` tetap mencetak URL tanpa token beserta
  panduan penyiapan autentikasi yang dapat ditindaklanjuti.
- **Password shared-secret**: gunakan `gateway.auth.password` yang dikonfigurasi (atau
  `OPENCLAW_GATEWAY_PASSWORD`). Dashboard tidak menyimpan password antar
  reload.
- **Mode pembawa identitas**: Tailscale Serve dapat memenuhi autentikasi UI Kontrol/WebSocket
  melalui header identitas saat `gateway.auth.allowTailscale: true`, dan
  reverse proxy non-loopback yang sadar identitas dapat memenuhi
  `gateway.auth.mode: "trusted-proxy"`. Dalam mode tersebut dashboard tidak
  memerlukan shared secret yang ditempel untuk WebSocket.
- **Bukan localhost**: gunakan Tailscale Serve, bind shared-secret non-loopback, sebuah
  reverse proxy non-loopback yang sadar identitas dengan
  `gateway.auth.mode: "trusted-proxy"`, atau tunnel SSH. API HTTP tetap menggunakan
  autentikasi shared-secret kecuali Anda sengaja menjalankan private-ingress
  `gateway.auth.mode: "none"` atau autentikasi HTTP trusted-proxy. Lihat
  [Permukaan web](/web).

<a id="if-you-see-unauthorized-1008"></a>

## Jika Anda melihat "unauthorized" / 1008

- Pastikan gateway dapat dijangkau (lokal: `openclaw status`; jarak jauh: tunnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` lalu buka `http://127.0.0.1:18789/`).
- Untuk `AUTH_TOKEN_MISMATCH`, klien dapat melakukan satu percobaan ulang tepercaya dengan token perangkat tersimpan saat gateway mengembalikan petunjuk retry. Percobaan ulang token tersimpan itu menggunakan kembali scope yang telah disetujui dan tersimpan pada token; pemanggil `deviceToken` eksplisit / `scopes` eksplisit tetap mempertahankan set scope yang diminta. Jika autentikasi masih gagal setelah retry itu, selesaikan token drift secara manual.
- Di luar jalur retry itu, prioritas autentikasi koneksi adalah shared token/password eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token perangkat tersimpan, lalu token bootstrap.
- Pada jalur UI Kontrol Tailscale Serve async, percobaan gagal untuk
  `{scope, ip}` yang sama diserialkan sebelum limiter failed-auth mencatatnya, sehingga
  percobaan buruk kedua yang berjalan bersamaan sudah bisa menampilkan `retry later`.
- Untuk langkah perbaikan token drift, ikuti [Checklist pemulihan token drift](/cli/devices#token-drift-recovery-checklist).
- Ambil atau sediakan shared secret dari host gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Password: resolusikan `gateway.auth.password` atau
    `OPENCLAW_GATEWAY_PASSWORD` yang dikonfigurasi
  - Token yang dikelola SecretRef: resolusikan penyedia secret eksternal atau ekspor
    `OPENCLAW_GATEWAY_TOKEN` di shell ini, lalu jalankan ulang `openclaw dashboard`
  - Tidak ada shared secret yang dikonfigurasi: `openclaw doctor --generate-gateway-token`
- Di pengaturan dashboard, tempel token atau password ke field autentikasi,
  lalu sambungkan.
