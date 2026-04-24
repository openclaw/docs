---
read_when:
    - Anda menginginkan gambaran ringkas tentang model jaringan Gateway
summary: Bagaimana Gateway, Node, dan host canvas terhubung.
title: Model jaringan
x-i18n:
    generated_at: "2026-04-24T09:08:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68637b72c4b3a6110556909da9a454e4be480fe2f3b42b09d054949c1104a62c
    source_path: gateway/network-model.md
    workflow: 15
---

> Konten ini telah digabungkan ke [Network](/id/network#core-model). Lihat halaman tersebut untuk panduan terbaru.

Sebagian besar operasi mengalir melalui Gateway (`openclaw gateway`), satu proses berjalan lama
yang memiliki koneksi channel dan control plane WebSocket.

## Aturan inti

- Satu Gateway per host direkomendasikan. Ini adalah satu-satunya proses yang diizinkan memiliki sesi WhatsApp Web. Untuk bot penyelamat atau isolasi ketat, jalankan beberapa gateway dengan profil dan port terisolasi. Lihat [Multiple gateways](/id/gateway/multiple-gateways).
- Utamakan loopback: WS Gateway default ke `ws://127.0.0.1:18789`. Wizard membuat auth shared-secret secara default dan biasanya menghasilkan token, bahkan untuk loopback. Untuk akses non-loopback, gunakan jalur auth gateway yang valid: auth token/kata sandi shared-secret, atau deployment `trusted-proxy` non-loopback yang dikonfigurasi dengan benar. Penyiapan tailnet/mobile biasanya paling baik bekerja melalui Tailscale Serve atau endpoint `wss://` lain alih-alih `ws://` tailnet mentah.
- Node terhubung ke WS Gateway melalui LAN, tailnet, atau SSH sesuai kebutuhan. Bridge TCP legacy telah dihapus.
- Host canvas dilayani oleh server HTTP Gateway pada **port yang sama** dengan Gateway (default `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    Saat `gateway.auth` dikonfigurasi dan Gateway bind di luar loopback, rute ini dilindungi oleh auth Gateway. Klien Node menggunakan URL capability yang dibatasi Node dan terikat ke sesi WS aktif mereka. Lihat [Gateway configuration](/id/gateway/configuration) (`canvasHost`, `gateway`).
- Penggunaan remote biasanya melalui tunnel SSH atau VPN tailnet. Lihat [Remote access](/id/gateway/remote) dan [Discovery](/id/gateway/discovery).

## Terkait

- [Remote access](/id/gateway/remote)
- [Trusted proxy auth](/id/gateway/trusted-proxy-auth)
- [Gateway protocol](/id/gateway/protocol)
