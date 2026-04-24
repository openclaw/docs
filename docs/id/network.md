---
read_when:
    - Anda memerlukan ikhtisar arsitektur + keamanan jaringan
    - Anda sedang men-debug akses lokal vs tailnet atau pairing
    - Anda menginginkan daftar kanonis dokumen jaringan
summary: 'Hub jaringan: surface gateway, pairing, discovery, dan keamanan'
title: Jaringan
x-i18n:
    generated_at: "2026-04-24T09:15:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 663f372555f044146a5d381566371e9a38185e7f295243bfd61314f12e3a4f06
    source_path: network.md
    workflow: 15
---

# Hub jaringan

Hub ini menautkan dokumen inti tentang cara OpenClaw terhubung, melakukan pairing, dan mengamankan
perangkat di localhost, LAN, dan tailnet.

## Model inti

Sebagian besar operasi mengalir melalui Gateway (`openclaw gateway`), satu proses berjalan lama yang memiliki koneksi channel dan control plane WebSocket.

- **Loopback terlebih dahulu**: WS Gateway secara default adalah `ws://127.0.0.1:18789`.
  Bind non-loopback memerlukan jalur autentikasi gateway yang valid: autentikasi
  token/password shared-secret, atau deployment `trusted-proxy`
  non-loopback yang dikonfigurasi dengan benar.
- **Satu Gateway per host** direkomendasikan. Untuk isolasi, jalankan beberapa gateway dengan profile dan port terisolasi ([Multiple Gateways](/id/gateway/multiple-gateways)).
- **Canvas host** disajikan pada port yang sama dengan Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), dilindungi oleh autentikasi Gateway saat bind di luar loopback.
- **Akses jarak jauh** biasanya berupa tunnel SSH atau VPN Tailscale ([Akses Jarak Jauh](/id/gateway/remote)).

Referensi utama:

- [Arsitektur Gateway](/id/concepts/architecture)
- [Protokol Gateway](/id/gateway/protocol)
- [Runbook Gateway](/id/gateway)
- [Surface web + mode bind](/id/web)

## Pairing + identitas

- [Ikhtisar pairing (DM + node)](/id/channels/pairing)
- [Pairing node milik Gateway](/id/gateway/pairing)
- [CLI devices (pairing + rotasi token)](/id/cli/devices)
- [CLI pairing (persetujuan DM)](/id/cli/pairing)

Kepercayaan lokal:

- Koneksi loopback lokal langsung dapat disetujui otomatis untuk pairing agar
  UX pada host yang sama tetap mulus.
- OpenClaw juga memiliki jalur self-connect backend/container-lokal yang sempit untuk
  alur helper shared-secret tepercaya.
- Klien tailnet dan LAN, termasuk bind tailnet pada host yang sama, tetap memerlukan
  persetujuan pairing eksplisit.

## Discovery + transport

- [Discovery & transport](/id/gateway/discovery)
- [Bonjour / mDNS](/id/gateway/bonjour)
- [Akses jarak jauh (SSH)](/id/gateway/remote)
- [Tailscale](/id/gateway/tailscale)

## Node + transport

- [Ikhtisar Nodes](/id/nodes)
- [Protokol Bridge (node lama, historis)](/id/gateway/bridge-protocol)
- [Runbook node: iOS](/id/platforms/ios)
- [Runbook node: Android](/id/platforms/android)

## Keamanan

- [Ikhtisar keamanan](/id/gateway/security)
- [Referensi config Gateway](/id/gateway/configuration)
- [Pemecahan masalah](/id/gateway/troubleshooting)
- [Doctor](/id/gateway/doctor)

## Terkait

- [Model jaringan Gateway](/id/gateway/network-model)
- [Akses jarak jauh](/id/gateway/remote)
