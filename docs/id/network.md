---
read_when:
    - Anda memerlukan ikhtisar arsitektur jaringan + keamanan
    - Anda sedang men-debug akses lokal versus tailnet atau pemasangan perangkat
    - Anda menginginkan daftar kanonis dokumentasi jaringan
summary: 'Hub jaringan: antarmuka Gateway, pemasangan, penemuan, dan keamanan'
title: Jaringan
x-i18n:
    generated_at: "2026-07-12T14:20:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9751bb0fe71009455b243b109ef7ef4eda08d58f940f7dcef305800a5ed89586
    source_path: network.md
    workflow: 16
---

Hub ini menautkan dokumentasi inti tentang cara OpenClaw menghubungkan, memasangkan, dan mengamankan
perangkat di localhost, LAN, dan tailnet.

## Model inti

Sebagian besar operasi mengalir melalui Gateway (`openclaw gateway`), sebuah proses tunggal yang berjalan lama dan mengelola koneksi kanal serta bidang kontrol WebSocket.

- **Utamakan loopback**: WS Gateway secara default menggunakan `ws://127.0.0.1:18789`.
  Pengikatan non-loopback tidak dapat dimulai tanpa jalur autentikasi gateway yang valid:
  autentikasi token/kata sandi rahasia bersama, atau deployment non-loopback
  `trusted-proxy` yang dikonfigurasi dengan benar.
- **Satu Gateway per host** direkomendasikan. Untuk isolasi, jalankan beberapa gateway dengan profil dan port yang terisolasi ([Beberapa Gateway](/id/gateway/multiple-gateways)).
- **Host Canvas** disajikan pada port yang sama dengan Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), dilindungi oleh autentikasi Gateway saat diikat di luar loopback.
- **Akses jarak jauh** biasanya menggunakan tunnel SSH atau VPN Tailscale ([Akses Jarak Jauh](/id/gateway/remote)).

Referensi utama:

- [Arsitektur Gateway](/id/concepts/architecture)
- [Protokol Gateway](/id/gateway/protocol)
- [Panduan operasional Gateway](/id/gateway)
- [Antarmuka web + mode pengikatan](/id/web)

## Pemasangan + identitas

- [Ringkasan pemasangan (DM + node)](/id/channels/pairing)
- [Pemasangan node yang dikelola Gateway](/id/gateway/pairing)
- [CLI perangkat (pemasangan + rotasi token)](/id/cli/devices)
- [CLI pemasangan (persetujuan DM)](/id/cli/pairing)

Kepercayaan lokal:

- Koneksi local loopback langsung (tanpa header penerusan/proksi) dapat
  disetujui secara otomatis untuk pemasangan agar pengalaman pengguna pada host yang sama tetap lancar.
- OpenClaw juga memiliki jalur koneksi mandiri lokal backend/kontainer yang terbatas untuk
  alur pembantu rahasia bersama tepercaya.
- Klien tailnet dan LAN, termasuk pengikatan tailnet pada host yang sama, tetap memerlukan
  persetujuan pemasangan eksplisit.

## Penemuan + transportasi

- [Penemuan dan transportasi](/id/gateway/discovery)
- [Bonjour / mDNS](/id/gateway/bonjour)
- [Akses jarak jauh (SSH)](/id/gateway/remote)
- [Tailscale](/id/gateway/tailscale)

## Node + transportasi

- [Ringkasan node](/id/nodes)
- [Protokol jembatan (node lama, historis)](/id/gateway/bridge-protocol)
- [Panduan operasional Node: iOS](/id/platforms/ios)
- [Panduan operasional Node: Android](/id/platforms/android)

## Keamanan

- [Ringkasan keamanan](/id/gateway/security)
- [Referensi konfigurasi Gateway](/id/gateway/configuration)
- [Pemecahan masalah](/id/gateway/troubleshooting)
- [Doctor](/id/gateway/doctor)

## Terkait

- [Panduan operasional Gateway](/id/gateway)
- [Akses jarak jauh](/id/gateway/remote)
