---
read_when:
    - Anda memerlukan gambaran arsitektur + keamanan jaringan
    - Anda sedang men-debug akses lokal vs tailnet atau pairing
    - Anda menginginkan daftar kanonis dokumentasi jaringan
summary: 'Pusat jaringan: permukaan gateway, pairing, discovery, dan keamanan'
title: Jaringan
x-i18n:
    generated_at: "2026-04-05T13:59:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a5f39d4f40ad19646d372000c85b663770eae412af91e1c175eb27b22208118
    source_path: network.md
    workflow: 15
---

# Pusat jaringan

Pusat ini menautkan dokumentasi inti tentang cara OpenClaw menghubungkan, melakukan pairing, dan mengamankan
perangkat melalui localhost, LAN, dan tailnet.

## Model inti

Sebagian besar operasi mengalir melalui Gateway (`openclaw gateway`), sebuah proses tunggal yang berjalan lama dan memiliki koneksi channel serta control plane WebSocket.

- **Loopback terlebih dahulu**: Gateway WS default ke `ws://127.0.0.1:18789`.
  Bind non-loopback memerlukan jalur auth gateway yang valid: auth
  token/kata sandi shared-secret, atau deployment `trusted-proxy`
  non-loopback yang dikonfigurasi dengan benar.
- **Satu Gateway per host** direkomendasikan. Untuk isolasi, jalankan beberapa gateway dengan profil dan port yang terisolasi ([Beberapa Gateway](/id/gateway/multiple-gateways)).
- **Canvas host** disajikan pada port yang sama dengan Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), dilindungi oleh auth Gateway saat bind dilakukan di luar loopback.
- **Akses jarak jauh** biasanya melalui tunnel SSH atau VPN Tailscale ([Akses Jarak Jauh](/id/gateway/remote)).

Referensi utama:

- [Arsitektur Gateway](/id/concepts/architecture)
- [Protokol Gateway](/id/gateway/protocol)
- [Runbook Gateway](/id/gateway)
- [Permukaan web + mode bind](/web)

## Pairing + identitas

- [Ringkasan pairing (DM + node)](/id/channels/pairing)
- [Pairing node yang dimiliki Gateway](/id/gateway/pairing)
- [CLI perangkat (pairing + rotasi token)](/cli/devices)
- [CLI pairing (persetujuan DM)](/cli/pairing)

Kepercayaan lokal:

- Koneksi loopback lokal langsung dapat disetujui otomatis untuk pairing agar
  UX pada host yang sama tetap mulus.
- OpenClaw juga memiliki jalur self-connect backend/lokal-container yang sempit untuk
  alur helper shared-secret tepercaya.
- Klien tailnet dan LAN, termasuk bind tailnet pada host yang sama, tetap memerlukan
  persetujuan pairing eksplisit.

## Discovery + transport

- [Discovery & transport](/id/gateway/discovery)
- [Bonjour / mDNS](/id/gateway/bonjour)
- [Akses jarak jauh (SSH)](/id/gateway/remote)
- [Tailscale](/id/gateway/tailscale)

## Node + transport

- [Ringkasan node](/nodes)
- [Protokol bridge (node lama, historis)](/id/gateway/bridge-protocol)
- [Runbook node: iOS](/platforms/ios)
- [Runbook node: Android](/platforms/android)

## Keamanan

- [Ringkasan keamanan](/gateway/security)
- [Referensi konfigurasi Gateway](/id/gateway/configuration)
- [Pemecahan masalah](/gateway/troubleshooting)
- [Doctor](/id/gateway/doctor)
