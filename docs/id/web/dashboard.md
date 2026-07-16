---
read_when:
    - Mengubah autentikasi dasbor atau mode eksposur
summary: Akses dan autentikasi dasbor Gateway (UI Kontrol)
title: Dasbor
x-i18n:
    generated_at: "2026-07-16T18:40:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 34d7ab6c5f503f2dd3ab212a1fc6b47c84fcd47c5ad88aa9cdbbbbc73b7ef90e
    source_path: web/dashboard.md
    workflow: 16
---

Dasbor Gateway adalah Control UI berbasis peramban yang secara default disajikan di `/` (ubah dengan `gateway.controlUi.basePath`).

Buka cepat (Gateway lokal):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (atau [http://localhost:18789/](http://localhost:18789/))
- Dengan `gateway.tls.enabled: true`, gunakan `https://127.0.0.1:18789/` dan `wss://127.0.0.1:18789` untuk endpoint WebSocket.

Referensi utama:

- [Control UI](/id/web/control-ui) untuk penggunaan dan kemampuan UI.
- [Tailscale](/id/gateway/tailscale) untuk otomatisasi Serve/Funnel.
- [Permukaan web](/id/web) untuk mode pengikatan dan catatan keamanan.

Autentikasi diberlakukan saat handshake WebSocket melalui jalur autentikasi gateway yang dikonfigurasi:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Header identitas Tailscale Serve ketika `gateway.auth.allowTailscale: true`
- Header identitas proksi tepercaya ketika `gateway.auth.mode: "trusted-proxy"`

Lihat `gateway.auth` di [Konfigurasi Gateway](/id/gateway/configuration).

<Warning>
Control UI adalah **permukaan admin** (percakapan, konfigurasi, persetujuan eksekusi). Jangan mengeksposnya secara publik. UI menyimpan token URL dasbor di sessionStorage untuk tab peramban saat ini dan URL gateway yang dipilih, lalu menghapusnya dari URL setelah dimuat. Utamakan localhost, Tailscale Serve, atau tunnel SSH.
</Warning>

## Jalur cepat (disarankan)

- Setelah onboarding, CLI otomatis membuka dasbor dan mencetak tautan bersih (tanpa token).
- Buka kembali kapan saja: `openclaw dashboard` (menyalin tautan, membuka peramban jika memungkinkan, mencetak petunjuk SSH jika tanpa antarmuka grafis).
- Jika pengiriman melalui papan klip dan peramban sama-sama gagal, `openclaw dashboard` tetap mencetak URL bersih dan memberi tahu Anda untuk menambahkan token (dari `OPENCLAW_GATEWAY_TOKEN` atau `gateway.auth.token`) sebagai kunci fragmen URL `token`; nilai token tidak pernah dicetak dalam log.
- Jika UI meminta autentikasi rahasia bersama, tempelkan token atau kata sandi yang dikonfigurasi ke pengaturan Control UI.

## Dasar-dasar autentikasi (lokal vs jarak jauh)

- **Localhost**: buka `http://127.0.0.1:18789/`.
- **TLS Gateway**: ketika `gateway.tls.enabled: true`, tautan dasbor/status menggunakan `https://` dan tautan WebSocket Control UI menggunakan `wss://`.
- **Sumber token rahasia bersama**: `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`). `openclaw dashboard` dapat meneruskannya melalui fragmen URL untuk bootstrap satu kali; Control UI menyimpannya di sessionStorage untuk tab saat ini dan URL gateway yang dipilih, bukan localStorage.
- Jika `gateway.auth.token` dikelola oleh SecretRef, `openclaw dashboard` secara sengaja mencetak/menyalin/membuka URL tanpa token untuk menghindari pemaparan token yang dikelola secara eksternal dalam log shell, riwayat papan klip, atau argumen peluncuran peramban. Jika referensi tidak dapat diurai dalam shell Anda saat ini, perintah tersebut tetap mencetak URL tanpa token beserta panduan penyiapan autentikasi yang dapat ditindaklanjuti.
- **Kata sandi rahasia bersama**: gunakan `gateway.auth.password` yang dikonfigurasi (atau `OPENCLAW_GATEWAY_PASSWORD`). Dasbor tidak menyimpan kata sandi setelah pemuatan ulang.
- **Mode yang membawa identitas**: Tailscale Serve memenuhi autentikasi Control UI/WebSocket melalui header identitas ketika `gateway.auth.allowTailscale: true`; proksi terbalik berbasis identitas non-loopback memenuhi `gateway.auth.mode: "trusted-proxy"`. Keduanya tidak memerlukan penempelan rahasia bersama untuk WebSocket.
- **Bukan localhost**: gunakan Tailscale Serve, pengikatan rahasia bersama non-loopback, proksi terbalik berbasis identitas non-loopback dengan `gateway.auth.mode: "trusted-proxy"`, atau tunnel SSH. API HTTP tetap menggunakan autentikasi rahasia bersama kecuali Anda sengaja menjalankan `gateway.auth.mode: "none"` dengan ingress privat atau autentikasi HTTP proksi tepercaya. Lihat [Permukaan web](/id/web).

## Buka di Telegram

Bot Telegram dapat membuka dasbor sebagai Telegram Mini App dengan `/dashboard`.

Persyaratan:

- `gateway.tailscale.mode: "serve"` atau `"funnel"` agar Telegram mendapatkan URL Mini App HTTPS.
- Pengirim Telegram harus merupakan pemilik bot: ID pengguna Telegram numerik dalam `commands.ownerAllowFrom` atau `channels.telegram.allowFrom` efektif milik akun yang dipilih.
- Jalankan `/dashboard` dalam DM dengan bot. Pemanggilan di grup hanya memberi tahu Anda untuk membuka perintah tersebut di DM dan tidak menyertakan tombol.
- Instalasi Docker: mode Serve/Funnel mengharuskan gateway terikat ke loopback di sebelah `tailscaled`, yang tidak dapat dipenuhi oleh jaringan bridge dengan port yang dipublikasikan. Jalankan kontainer gateway dengan `network_mode: host` dan pasang soket `tailscaled` host (`/var/run/tailscale`) beserta CLI `tailscale` ke dalam kontainer.

Mini App melakukan serah terima pemilik satu kali dan mengalihkan ke Control UI dengan token bootstrap berumur pendek. Mini App tidak mengekspos token gateway bersama dalam URL.

Bukan tujuan untuk v1:

- Iframe Web Telegram tidak didukung.
- Tailscale Serve/Funnel adalah satu-satunya jalur URL publikasi yang didukung.

<a id="if-you-see-unauthorized-1008"></a>

## Jika Anda melihat "unauthorized" / 1008

- Pastikan gateway dapat dijangkau: lokal `openclaw status`; untuk jarak jauh, buat tunnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`, lalu buka `http://127.0.0.1:18789/`.
- Untuk `AUTH_TOKEN_MISMATCH`, klien dapat melakukan satu percobaan ulang tepercaya dengan token perangkat yang disimpan dalam cache ketika gateway mengembalikan petunjuk percobaan ulang; percobaan ulang tersebut menggunakan kembali cakupan yang telah disetujui dan disimpan dalam cache token (pemanggil eksplisit `deviceToken`/`scopes` mempertahankan kumpulan cakupan yang diminta). Jika autentikasi masih gagal setelah percobaan ulang tersebut, atasi ketidakselarasan token secara manual.
- Untuk `AUTH_SCOPE_MISMATCH`, token perangkat dikenali tetapi tidak memiliki cakupan yang diminta; lakukan pemasangan ulang atau setujui kumpulan cakupan baru alih-alih merotasi token gateway bersama.
- Di luar jalur percobaan ulang tersebut, urutan prioritas autentikasi koneksi adalah: token/kata sandi bersama eksplisit, lalu `deviceToken` eksplisit, kemudian token perangkat tersimpan, lalu token bootstrap.
- Pada jalur Tailscale Serve asinkron, upaya gagal untuk `{scope, ip}` yang sama diserialkan sebelum pembatas autentikasi gagal mencatatnya, sehingga percobaan ulang buruk kedua yang berlangsung bersamaan sudah dapat menampilkan `retry later`.
- Untuk langkah perbaikan ketidakselarasan token, lihat [Daftar periksa pemulihan ketidakselarasan token](/id/cli/devices#token-drift-recovery-checklist).
- Ambil atau berikan rahasia bersama dari host gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Kata sandi: uraikan `gateway.auth.password` atau `OPENCLAW_GATEWAY_PASSWORD` yang dikonfigurasi
  - Token yang dikelola SecretRef: uraikan penyedia rahasia eksternal, atau ekspor `OPENCLAW_GATEWAY_TOKEN` dalam shell ini dan jalankan kembali `openclaw dashboard`
  - Tidak ada rahasia bersama yang dikonfigurasi: `openclaw doctor --generate-gateway-token`
- Di pengaturan dasbor, tempelkan token atau kata sandi ke bidang autentikasi, lalu hubungkan.
- Pemilih bahasa UI berada di **Settings -> General -> Language**, bukan di bawah Appearance.

## Terkait

- [Control UI](/id/web/control-ui)
- [WebChat](/id/web/webchat)
