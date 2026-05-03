---
read_when:
    - Mengimplementasikan atau mengubah penemuan/pengiklanan Bonjour
    - Menyesuaikan mode koneksi jarak jauh (langsung vs SSH)
    - Merancang penemuan Node + penyandingan untuk Node jarak jauh
summary: Penemuan Node dan transport (Bonjour, Tailscale, SSH) untuk menemukan Gateway
title: Penemuan dan transport
x-i18n:
    generated_at: "2026-05-03T21:32:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41a5ed7a910ae4bbdfa21a81882c3b1af0c16622fa20a5e616b666390dccdc9c
    source_path: gateway/discovery.md
    workflow: 16
---

# Penemuan & transport

OpenClaw memiliki dua masalah berbeda yang tampak mirip di permukaan:

1. **Kendali jarak jauh operator**: aplikasi bilah menu macOS yang mengendalikan gateway yang berjalan di tempat lain.
2. **Pemasangan Node**: iOS/Android (dan node masa depan) menemukan gateway dan melakukan pemasangan secara aman.

Tujuan desainnya adalah menjaga semua penemuan/advertising jaringan di **Node Gateway** (`openclaw gateway`) dan menjaga klien (aplikasi mac, iOS) sebagai konsumen.

## Istilah

- **Gateway**: satu proses gateway yang berjalan lama yang memiliki status (sesi, pemasangan, registri node) dan menjalankan channel. Sebagian besar pengaturan menggunakan satu per host; pengaturan multi-gateway terisolasi dimungkinkan.
- **Gateway WS (control plane)**: endpoint WebSocket pada `127.0.0.1:18789` secara default; dapat di-bind ke LAN/tailnet melalui `gateway.bind`.
- **Transport WS langsung**: endpoint Gateway WS yang menghadap LAN/tailnet (tanpa SSH).
- **Transport SSH (fallback)**: kendali jarak jauh dengan meneruskan `127.0.0.1:18789` melalui SSH.
- **Bridge TCP lama (dihapus)**: transport node lama (lihat
  [Protokol bridge](/id/gateway/bridge-protocol)); tidak lagi diiklankan untuk
  penemuan dan tidak lagi menjadi bagian dari build saat ini.

Detail protokol:

- [Protokol Gateway](/id/gateway/protocol)
- [Protokol bridge (lama)](/id/gateway/bridge-protocol)

## Mengapa kami mempertahankan "langsung" dan SSH

- **WS langsung** adalah UX terbaik pada jaringan yang sama dan di dalam tailnet:
  - penemuan otomatis di LAN melalui Bonjour
  - token pemasangan + ACL yang dimiliki oleh gateway
  - tidak memerlukan akses shell; permukaan protokol dapat tetap ketat dan dapat diaudit
- **SSH** tetap menjadi fallback universal:
  - berfungsi di mana pun Anda memiliki akses SSH (bahkan lintas jaringan yang tidak terkait)
  - tetap berjalan saat ada masalah multicast/mDNS
  - tidak memerlukan port inbound baru selain SSH

## Input penemuan (bagaimana klien mengetahui lokasi gateway)

### 1) Penemuan Bonjour / DNS-SD

Bonjour multicast bersifat upaya terbaik dan tidak melintasi jaringan. OpenClaw juga dapat menjelajahi beacon gateway yang sama melalui domain DNS-SD area luas yang dikonfigurasi, sehingga penemuan dapat mencakup:

- `local.` pada LAN yang sama
- domain DNS-SD unicast yang dikonfigurasi untuk penemuan lintas jaringan

Arah target:

- **Gateway** mengiklankan endpoint WS-nya melalui Bonjour ketika plugin bawaan
  `bonjour` diaktifkan. Plugin otomatis dimulai pada host macOS dan
  bersifat opt-in di tempat lain.
- Klien menjelajah dan menampilkan daftar “pilih gateway”, lalu menyimpan endpoint yang dipilih.

Pemecahan masalah dan detail beacon: [Bonjour](/id/gateway/bonjour).

#### Detail beacon layanan

- Jenis layanan:
  - `_openclaw-gw._tcp` (beacon transport gateway)
- Kunci TXT (bukan rahasia):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (nama tampilan yang dikonfigurasi operator)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (hanya ketika TLS diaktifkan)
  - `gatewayTlsSha256=<sha256>` (hanya ketika TLS diaktifkan dan fingerprint tersedia)
  - `canvasPort=<port>` (port host canvas; saat ini sama dengan `gatewayPort` ketika host canvas diaktifkan)
  - `tailnetDns=<magicdns>` (petunjuk opsional; terdeteksi otomatis ketika Tailscale tersedia)
  - `sshPort=<port>` (hanya mode penuh mDNS; DNS-SD area luas dapat menghilangkannya, dalam hal ini default SSH tetap di `22`)
  - `cliPath=<path>` (hanya mode penuh mDNS; DNS-SD area luas tetap menuliskannya sebagai petunjuk instalasi jarak jauh)

Catatan keamanan:

- Catatan TXT Bonjour/mDNS **tidak diautentikasi**. Klien harus memperlakukan nilai TXT hanya sebagai petunjuk UX.
- Routing (host/port) sebaiknya mengutamakan **endpoint layanan yang di-resolve** (SRV + A/AAAA) daripada `lanHost`, `tailnetDns`, atau `gatewayPort` yang disediakan TXT.
- Pinning TLS tidak boleh pernah mengizinkan `gatewayTlsSha256` yang diiklankan untuk menimpa pin yang sebelumnya disimpan.
- Node iOS/Android harus mewajibkan konfirmasi eksplisit “percayai fingerprint ini” sebelum menyimpan pin pertama kali (verifikasi di luar jalur) setiap kali rute yang dipilih berbasis aman/TLS.

Aktifkan/nonaktifkan/timpa:

- `openclaw plugins enable bonjour` mengaktifkan advertising multicast LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` menonaktifkan advertising.
- Ketika plugin Bonjour diaktifkan dan `OPENCLAW_DISABLE_BONJOUR` tidak disetel,
  Bonjour beriklan pada host normal dan otomatis nonaktif di dalam container yang terdeteksi.
  Startup Gateway macOS dengan konfigurasi kosong mengaktifkan plugin secara otomatis; deployment Linux,
  Windows, dan ter-container perlu pengaktifan eksplisit.
  Gunakan `0` hanya pada host, macvlan, atau jaringan lain yang mendukung mDNS; gunakan `1` untuk
  memaksa nonaktif.
- `gateway.bind` di `~/.openclaw/openclaw.json` mengontrol mode bind Gateway.
- `OPENCLAW_SSH_PORT` menimpa port SSH yang diiklankan ketika `sshPort` dipancarkan.
- `OPENCLAW_TAILNET_DNS` menerbitkan petunjuk `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` menimpa jalur CLI yang diiklankan.

### 2) Tailnet (lintas jaringan)

Untuk pengaturan gaya London/Vienna, Bonjour tidak akan membantu. Target “langsung” yang direkomendasikan adalah:

- Nama MagicDNS Tailscale (disukai) atau IP tailnet yang stabil.

Jika gateway dapat mendeteksi bahwa ia berjalan di bawah Tailscale, gateway menerbitkan `tailnetDns` sebagai petunjuk opsional untuk klien (termasuk beacon area luas).

Aplikasi macOS kini lebih memilih nama MagicDNS daripada IP Tailscale mentah untuk penemuan gateway. Ini meningkatkan keandalan ketika IP tailnet berubah (misalnya setelah node dimulai ulang atau penetapan ulang CGNAT), karena nama MagicDNS otomatis di-resolve ke IP saat ini.

Untuk pemasangan node seluler, petunjuk penemuan tidak melonggarkan keamanan transport pada rute tailnet/publik:

- iOS/Android tetap mewajibkan jalur koneksi tailnet/publik pertama kali yang aman (`wss://` atau Tailscale Serve/Funnel).
- IP tailnet mentah yang ditemukan adalah petunjuk routing, bukan izin untuk menggunakan `ws://` jarak jauh plaintext.
- Koneksi langsung LAN privat `ws://` tetap didukung.
- Jika Anda menginginkan jalur Tailscale paling sederhana untuk node seluler, gunakan Tailscale Serve sehingga penemuan dan kode penyiapan sama-sama di-resolve ke endpoint MagicDNS yang aman.

### 3) Target manual / SSH

Ketika tidak ada rute langsung (atau langsung dinonaktifkan), klien selalu dapat terhubung melalui SSH dengan meneruskan port gateway local loopback.

Lihat [Akses jarak jauh](/id/gateway/remote).

## Pemilihan transport (kebijakan klien)

Perilaku klien yang direkomendasikan:

1. Jika endpoint langsung yang sudah dipasangkan dikonfigurasi dan dapat dijangkau, gunakan itu.
2. Jika tidak, jika penemuan menemukan gateway pada `local.` atau domain area luas yang dikonfigurasi, tawarkan pilihan satu ketuk “Gunakan gateway ini” dan simpan sebagai endpoint langsung.
3. Jika tidak, jika DNS/IP tailnet dikonfigurasi, coba langsung.
   Untuk node seluler pada rute tailnet/publik, langsung berarti endpoint aman, bukan `ws://` jarak jauh plaintext.
4. Jika tidak, fallback ke SSH.

## Pemasangan + autentikasi (transport langsung)

Gateway adalah sumber kebenaran untuk penerimaan node/klien.

- Permintaan pemasangan dibuat/disetujui/ditolak di gateway (lihat [Pemasangan Gateway](/id/gateway/pairing)).
- Gateway menegakkan:
  - autentikasi (token / keypair)
  - cakupan/ACL (gateway bukan proxy mentah ke setiap metode)
  - batas laju

## Tanggung jawab menurut komponen

- **Gateway**: mengiklankan beacon penemuan, memiliki keputusan pemasangan, dan meng-host endpoint WS.
- **Aplikasi macOS**: membantu Anda memilih gateway, menampilkan prompt pemasangan, dan menggunakan SSH hanya sebagai fallback.
- **Node iOS/Android**: menjelajahi Bonjour sebagai kemudahan dan terhubung ke Gateway WS yang dipasangkan.

## Terkait

- [Akses jarak jauh](/id/gateway/remote)
- [Tailscale](/id/gateway/tailscale)
- [Penemuan Bonjour](/id/gateway/bonjour)
