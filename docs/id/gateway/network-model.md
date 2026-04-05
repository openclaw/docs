---
read_when:
    - Anda menginginkan gambaran ringkas tentang model jaringan Gateway
summary: Bagaimana Gateway, node, dan host canvas terhubung.
title: Model jaringan
x-i18n:
    generated_at: "2026-04-05T13:53:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d02d87f38ee5a9fae228f5028892b192c50b473ab4441bbe0b40ee85a1dd402
    source_path: gateway/network-model.md
    workflow: 15
---

# Model Jaringan

> Konten ini telah digabungkan ke [Network](/network#core-model). Lihat halaman tersebut untuk panduan terbaru.

Sebagian besar operasi mengalir melalui Gateway (`openclaw gateway`), sebuah proses tunggal jangka panjang
yang memiliki koneksi kanal dan control plane WebSocket.

## Aturan inti

- Satu Gateway per host disarankan. Ini adalah satu-satunya proses yang diizinkan untuk memiliki sesi WhatsApp Web. Untuk bot penyelamat atau isolasi ketat, jalankan beberapa gateway dengan profil dan port yang terisolasi. Lihat [Beberapa gateway](/gateway/multiple-gateways).
- Loopback terlebih dahulu: Gateway WS secara default menggunakan `ws://127.0.0.1:18789`. Wizard membuat auth shared-secret secara default dan biasanya menghasilkan token, bahkan untuk loopback. Untuk akses non-loopback, gunakan jalur auth gateway yang valid: auth token/kata sandi shared-secret, atau deployment `trusted-proxy` non-loopback yang dikonfigurasi dengan benar. Penyiapan tailnet/seluler biasanya paling baik bekerja melalui Tailscale Serve atau endpoint `wss://` lain alih-alih `ws://` tailnet mentah.
- Node terhubung ke Gateway WS melalui LAN, tailnet, atau SSH sesuai kebutuhan. TCP bridge
  lama telah dihapus.
- Host canvas disajikan oleh server HTTP Gateway pada **port yang sama** dengan Gateway (default `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    Ketika `gateway.auth` dikonfigurasi dan Gateway melakukan bind di luar loopback, rute ini dilindungi oleh auth Gateway. Klien node menggunakan URL kapabilitas dengan cakupan node yang terikat ke sesi WS aktif mereka. Lihat [Konfigurasi Gateway](/gateway/configuration) (`canvasHost`, `gateway`).
- Penggunaan jarak jauh biasanya melalui tunnel SSH atau VPN tailnet. Lihat [Akses jarak jauh](/gateway/remote) dan [Discovery](/gateway/discovery).
