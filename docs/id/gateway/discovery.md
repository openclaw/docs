---
read_when:
    - Mengimplementasikan atau mengubah discovery/advertising Bonjour
    - Menyesuaikan mode koneksi jarak jauh (langsung vs SSH)
    - Merancang discovery + pairing Node untuk Node jarak jauh
summary: Discovery Node dan transport (Bonjour, Tailscale, SSH) untuk menemukan gateway
title: Discovery dan transport
x-i18n:
    generated_at: "2026-04-24T09:07:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 684e5aeb1f74a90bf8689f8b25830be2c9e497fcdeda390d98f204d7cb4134b8
    source_path: gateway/discovery.md
    workflow: 15
---

# Discovery & transport

OpenClaw memiliki dua masalah berbeda yang tampak mirip di permukaan:

1. **Kontrol jarak jauh operator**: aplikasi menu bar macOS mengendalikan gateway yang berjalan di tempat lain.
2. **Pairing Node**: iOS/Android (dan Node masa depan) menemukan gateway dan melakukan pairing dengan aman.

Tujuan desainnya adalah menjaga semua discovery/advertising jaringan di **Node Gateway** (`openclaw gateway`) dan menjaga klien (aplikasi mac, iOS) tetap sebagai konsumen.

## Istilah

- **Gateway**: satu proses gateway berumur panjang yang memiliki state (sesi, pairing, registri Node) dan menjalankan kanal. Sebagian besar penyiapan menggunakan satu per host; penyiapan multi-gateway terisolasi dimungkinkan.
- **Gateway WS (control plane)**: endpoint WebSocket pada `127.0.0.1:18789` secara default; dapat di-bind ke LAN/tailnet melalui `gateway.bind`.
- **Transport WS langsung**: endpoint Gateway WS yang menghadap LAN/tailnet (tanpa SSH).
- **Transport SSH (fallback)**: kontrol jarak jauh dengan meneruskan `127.0.0.1:18789` melalui SSH.
- **Bridge TCP lama (dihapus)**: transport Node lama (lihat
  [Protokol bridge](/id/gateway/bridge-protocol)); tidak lagi diiklankan untuk
  discovery dan tidak lagi menjadi bagian dari build saat ini.

Detail protokol:

- [Protokol Gateway](/id/gateway/protocol)
- [Protokol bridge (lama)](/id/gateway/bridge-protocol)

## Mengapa kami mempertahankan "langsung" dan SSH

- **WS langsung** adalah UX terbaik pada jaringan yang sama dan dalam tailnet:
  - auto-discovery di LAN melalui Bonjour
  - token pairing + ACL dimiliki oleh gateway
  - tidak memerlukan akses shell; permukaan protokol dapat tetap sempit dan dapat diaudit
- **SSH** tetap menjadi fallback universal:
  - berfungsi di mana saja Anda memiliki akses SSH (bahkan lintas jaringan yang tidak terkait)
  - bertahan dari masalah multicast/mDNS
  - tidak memerlukan port inbound baru selain SSH

## Input discovery (bagaimana klien mengetahui di mana gateway berada)

### 1) Discovery Bonjour / DNS-SD

Multicast Bonjour bersifat best-effort dan tidak melintasi jaringan. OpenClaw juga dapat menelusuri
beacon gateway yang sama melalui domain DNS-SD wide-area yang dikonfigurasi, sehingga discovery dapat mencakup:

- `local.` pada LAN yang sama
- domain DNS-SD unicast yang dikonfigurasi untuk discovery lintas jaringan

Arah target:

- **gateway** mengiklankan endpoint WS-nya melalui Bonjour.
- Klien menelusuri dan menampilkan daftar “pilih gateway”, lalu menyimpan endpoint yang dipilih.

Pemecahan masalah dan detail beacon: [Bonjour](/id/gateway/bonjour).

#### Detail beacon layanan

- Jenis layanan:
  - `_openclaw-gw._tcp` (beacon transport gateway)
- Kunci TXT (non-secret):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (nama tampilan yang dikonfigurasi operator)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (hanya saat TLS diaktifkan)
  - `gatewayTlsSha256=<sha256>` (hanya saat TLS diaktifkan dan fingerprint tersedia)
  - `canvasPort=<port>` (port host canvas; saat ini sama dengan `gatewayPort` ketika host canvas diaktifkan)
  - `tailnetDns=<magicdns>` (petunjuk opsional; dideteksi otomatis saat Tailscale tersedia)
  - `sshPort=<port>` (hanya mode penuh mDNS; DNS-SD wide-area dapat menghilangkannya, dalam hal ini default SSH tetap `22`)
  - `cliPath=<path>` (hanya mode penuh mDNS; DNS-SD wide-area tetap menuliskannya sebagai petunjuk instalasi jarak jauh)

Catatan keamanan:

- Rekaman TXT Bonjour/mDNS bersifat **tanpa autentikasi**. Klien harus memperlakukan nilai TXT hanya sebagai petunjuk UX.
- Perutean (host/port) sebaiknya mengutamakan **endpoint layanan yang diselesaikan** (SRV + A/AAAA) dibanding `lanHost`, `tailnetDns`, atau `gatewayPort` yang diberikan TXT.
- TLS pinning tidak boleh pernah mengizinkan `gatewayTlsSha256` yang diiklankan untuk menimpa pin yang sebelumnya disimpan.
- Node iOS/Android harus memerlukan konfirmasi eksplisit “percaya fingerprint ini” sebelum menyimpan pin pertama kali (verifikasi out-of-band) kapan pun rute yang dipilih aman/berbasis TLS.

Nonaktifkan/override:

- `OPENCLAW_DISABLE_BONJOUR=1` menonaktifkan advertising.
- `gateway.bind` di `~/.openclaw/openclaw.json` mengendalikan mode bind Gateway.
- `OPENCLAW_SSH_PORT` mengganti port SSH yang diiklankan ketika `sshPort` dipancarkan.
- `OPENCLAW_TAILNET_DNS` menerbitkan petunjuk `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` mengganti path CLI yang diiklankan.

### 2) Tailnet (lintas jaringan)

Untuk penyiapan gaya London/Vienna, Bonjour tidak akan membantu. Target “langsung” yang direkomendasikan adalah:

- nama Tailscale MagicDNS (disarankan) atau IP tailnet yang stabil.

Jika gateway dapat mendeteksi bahwa gateway berjalan di bawah Tailscale, gateway menerbitkan `tailnetDns` sebagai petunjuk opsional untuk klien (termasuk beacon wide-area).

Aplikasi macOS sekarang lebih memilih nama MagicDNS dibanding IP Tailscale mentah untuk discovery gateway. Ini meningkatkan keandalan saat IP tailnet berubah (misalnya setelah Node restart atau penugasan ulang CGNAT), karena nama MagicDNS otomatis diselesaikan ke IP saat ini.

Untuk pairing Node mobile, petunjuk discovery tidak melonggarkan keamanan transport pada rute tailnet/publik:

- iOS/Android tetap memerlukan jalur koneksi pertama tailnet/publik yang aman (`wss://` atau Tailscale Serve/Funnel).
- IP tailnet mentah yang ditemukan adalah petunjuk perutean, bukan izin untuk menggunakan `ws://` jarak jauh plaintext.
- `ws://` direct-connect LAN privat tetap didukung.
- Jika Anda menginginkan jalur Tailscale paling sederhana untuk Node mobile, gunakan Tailscale Serve agar discovery dan kode penyiapan sama-sama diselesaikan ke endpoint MagicDNS aman yang sama.

### 3) Target manual / SSH

Ketika tidak ada rute langsung (atau langsung dinonaktifkan), klien selalu dapat terhubung melalui SSH dengan meneruskan port gateway loopback.

Lihat [Akses jarak jauh](/id/gateway/remote).

## Pemilihan transport (kebijakan klien)

Perilaku klien yang direkomendasikan:

1. Jika endpoint langsung yang sudah dipasangkan dikonfigurasi dan dapat dijangkau, gunakan itu.
2. Jika tidak, bila discovery menemukan gateway di `local.` atau domain wide-area yang dikonfigurasi, tawarkan pilihan satu ketukan “Gunakan gateway ini” dan simpan sebagai endpoint langsung.
3. Jika tidak, bila DNS/IP tailnet dikonfigurasi, coba langsung.
   Untuk Node mobile pada rute tailnet/publik, langsung berarti endpoint aman, bukan `ws://` jarak jauh plaintext.
4. Jika tidak, fallback ke SSH.

## Pairing + auth (transport langsung)

Gateway adalah sumber kebenaran untuk penerimaan Node/klien.

- Permintaan pairing dibuat/disetujui/ditolak di gateway (lihat [Pairing Gateway](/id/gateway/pairing)).
- Gateway menegakkan:
  - auth (token / keypair)
  - cakupan/ACL (gateway bukan proxy mentah ke setiap metode)
  - rate limit

## Tanggung jawab per komponen

- **Gateway**: mengiklankan beacon discovery, memiliki keputusan pairing, dan meng-host endpoint WS.
- **Aplikasi macOS**: membantu Anda memilih gateway, menampilkan prompt pairing, dan menggunakan SSH hanya sebagai fallback.
- **Node iOS/Android**: menelusuri Bonjour sebagai kemudahan dan terhubung ke Gateway WS yang sudah dipasangkan.

## Terkait

- [Akses jarak jauh](/id/gateway/remote)
- [Tailscale](/id/gateway/tailscale)
- [Discovery Bonjour](/id/gateway/bonjour)
