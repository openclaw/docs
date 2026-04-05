---
read_when:
    - Mengimplementasikan atau mengubah penemuan/pengiklanan Bonjour
    - Menyesuaikan mode koneksi jarak jauh (langsung vs SSH)
    - Merancang penemuan node + pairing untuk node jarak jauh
summary: Penemuan node dan transport (Bonjour, Tailscale, SSH) untuk menemukan gateway
title: Penemuan dan Transport
x-i18n:
    generated_at: "2026-04-05T13:53:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: e76cca9279ca77b55e30d6e746f6325e5644134ef06b9c58f2cf3d793d092685
    source_path: gateway/discovery.md
    workflow: 15
---

# Penemuan & transport

OpenClaw memiliki dua masalah berbeda yang di permukaan terlihat mirip:

1. **Kontrol jarak jauh operator**: aplikasi menu bar macOS mengendalikan gateway yang berjalan di tempat lain.
2. **Pairing node**: iOS/Android (dan node masa depan) menemukan gateway dan melakukan pairing dengan aman.

Tujuan desainnya adalah menjaga semua penemuan/pengiklanan jaringan di **Node Gateway** (`openclaw gateway`) dan menjaga klien (mac app, iOS) sebagai konsumen.

## Istilah

- **Gateway**: satu proses gateway jangka panjang yang memiliki status (sesi, pairing, registri node) dan menjalankan kanal. Sebagian besar penyiapan menggunakan satu per host; penyiapan multi-gateway yang terisolasi dimungkinkan.
- **Gateway WS (control plane)**: endpoint WebSocket di `127.0.0.1:18789` secara default; dapat di-bind ke LAN/tailnet melalui `gateway.bind`.
- **Transport WS langsung**: endpoint Gateway WS yang menghadap LAN/tailnet (tanpa SSH).
- **Transport SSH (fallback)**: kontrol jarak jauh dengan meneruskan `127.0.0.1:18789` melalui SSH.
- **Legacy TCP bridge (dihapus)**: transport node lama (lihat
  [Protokol Bridge](/gateway/bridge-protocol)); tidak lagi diiklankan untuk
  penemuan dan tidak lagi menjadi bagian dari build saat ini.

Detail protokol:

- [Protokol Gateway](/gateway/protocol)
- [Protokol Bridge (lama)](/gateway/bridge-protocol)

## Mengapa kami mempertahankan transport "langsung" dan SSH

- **WS langsung** adalah UX terbaik di jaringan yang sama dan dalam sebuah tailnet:
  - penemuan otomatis di LAN melalui Bonjour
  - token pairing + ACL dimiliki oleh gateway
  - tidak memerlukan akses shell; permukaan protokol dapat tetap ketat dan mudah diaudit
- **SSH** tetap menjadi fallback universal:
  - berfungsi di mana pun Anda memiliki akses SSH (bahkan di jaringan yang tidak terkait)
  - tetap berfungsi meskipun ada masalah multicast/mDNS
  - tidak memerlukan port masuk baru selain SSH

## Input penemuan (bagaimana klien mengetahui lokasi gateway)

### 1) Penemuan Bonjour / DNS-SD

Bonjour multicast bersifat best-effort dan tidak melintasi jaringan. OpenClaw juga dapat menelusuri
beacon gateway yang sama melalui domain DNS-SD area luas yang dikonfigurasi, sehingga penemuan dapat mencakup:

- `local.` di LAN yang sama
- domain unicast DNS-SD yang dikonfigurasi untuk penemuan lintas jaringan

Arah target:

- **gateway** mengiklankan endpoint WS-nya melalui Bonjour.
- Klien menelusuri dan menampilkan daftar “pilih gateway”, lalu menyimpan endpoint yang dipilih.

Detail beacon dan pemecahan masalah: [Bonjour](/gateway/bonjour).

#### Detail beacon layanan

- Tipe layanan:
  - `_openclaw-gw._tcp` (beacon transport gateway)
- Kunci TXT (tidak rahasia):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (nama tampilan yang dikonfigurasi operator)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (hanya saat TLS diaktifkan)
  - `gatewayTlsSha256=<sha256>` (hanya saat TLS diaktifkan dan fingerprint tersedia)
  - `canvasPort=<port>` (port host canvas; saat ini sama dengan `gatewayPort` saat host canvas diaktifkan)
  - `tailnetDns=<magicdns>` (petunjuk opsional; terdeteksi otomatis saat Tailscale tersedia)
  - `sshPort=<port>` (hanya mode penuh mDNS; DNS-SD area luas dapat menghilangkannya, dalam hal ini default SSH tetap `22`)
  - `cliPath=<path>` (hanya mode penuh mDNS; DNS-SD area luas tetap menuliskannya sebagai petunjuk instalasi jarak jauh)

Catatan keamanan:

- Record TXT Bonjour/mDNS **tidak diautentikasi**. Klien harus memperlakukan nilai TXT hanya sebagai petunjuk UX.
- Routing (host/port) sebaiknya mengutamakan **endpoint layanan yang diselesaikan** (SRV + A/AAAA) dibanding `lanHost`, `tailnetDns`, atau `gatewayPort` yang diberikan TXT.
- TLS pinning tidak boleh pernah mengizinkan `gatewayTlsSha256` yang diiklankan menimpa pin yang sebelumnya disimpan.
- Node iOS/Android harus memerlukan konfirmasi eksplisit “percayai fingerprint ini” sebelum menyimpan pin pertama kali (verifikasi di luar jalur) kapan pun rute yang dipilih aman/berbasis TLS.

Nonaktifkan/timpa:

- `OPENCLAW_DISABLE_BONJOUR=1` menonaktifkan pengiklanan.
- `gateway.bind` di `~/.openclaw/openclaw.json` mengontrol mode bind Gateway.
- `OPENCLAW_SSH_PORT` menimpa port SSH yang diiklankan saat `sshPort` dipancarkan.
- `OPENCLAW_TAILNET_DNS` memublikasikan petunjuk `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` menimpa path CLI yang diiklankan.

### 2) Tailnet (lintas jaringan)

Untuk penyiapan bergaya London/Vienna, Bonjour tidak akan membantu. Target “langsung” yang direkomendasikan adalah:

- nama Tailscale MagicDNS (disukai) atau IP tailnet yang stabil.

Jika gateway dapat mendeteksi bahwa ia berjalan di bawah Tailscale, gateway memublikasikan `tailnetDns` sebagai petunjuk opsional untuk klien (termasuk beacon area luas).

Aplikasi macOS sekarang lebih memilih nama MagicDNS daripada IP Tailscale mentah untuk penemuan gateway. Ini meningkatkan keandalan ketika IP tailnet berubah (misalnya setelah restart node atau penetapan ulang CGNAT), karena nama MagicDNS otomatis diselesaikan ke IP saat ini.

Untuk pairing node seluler, petunjuk penemuan tidak melonggarkan keamanan transport pada rute tailnet/publik:

- iOS/Android tetap memerlukan jalur koneksi pertama yang aman di tailnet/publik (`wss://` atau Tailscale Serve/Funnel).
- IP tailnet mentah yang ditemukan adalah petunjuk routing, bukan izin untuk menggunakan `ws://` jarak jauh plaintext.
- `ws://` direct-connect LAN privat tetap didukung.
- Jika Anda menginginkan jalur Tailscale paling sederhana untuk node seluler, gunakan Tailscale Serve agar penemuan dan kode penyiapan sama-sama diselesaikan ke endpoint MagicDNS aman yang sama.

### 3) Target manual / SSH

Ketika tidak ada rute langsung (atau transport langsung dinonaktifkan), klien selalu dapat terhubung melalui SSH dengan meneruskan port gateway loopback.

Lihat [Akses jarak jauh](/gateway/remote).

## Pemilihan transport (kebijakan klien)

Perilaku klien yang direkomendasikan:

1. Jika endpoint langsung yang sudah paired dikonfigurasi dan dapat dijangkau, gunakan itu.
2. Jika tidak, bila penemuan menemukan gateway di `local.` atau domain area luas yang dikonfigurasi, tawarkan pilihan sekali ketuk “Gunakan gateway ini” dan simpan sebagai endpoint langsung.
3. Jika tidak, bila DNS/IP tailnet dikonfigurasi, coba langsung.
   Untuk node seluler di rute tailnet/publik, langsung berarti endpoint aman, bukan `ws://` jarak jauh plaintext.
4. Jika tidak, kembali ke SSH.

## Pairing + auth (transport langsung)

Gateway adalah source of truth untuk penerimaan node/klien.

- Permintaan pairing dibuat/disetujui/ditolak di gateway (lihat [Gateway pairing](/gateway/pairing)).
- Gateway menegakkan:
  - auth (token / keypair)
  - scope/ACL (gateway bukan proxy mentah ke setiap metode)
  - rate limit

## Tanggung jawab per komponen

- **Gateway**: mengiklankan beacon penemuan, memiliki keputusan pairing, dan meng-host endpoint WS.
- **macOS app**: membantu Anda memilih gateway, menampilkan prompt pairing, dan menggunakan SSH hanya sebagai fallback.
- **Node iOS/Android**: menelusuri Bonjour sebagai kemudahan dan terhubung ke Gateway WS yang sudah paired.
