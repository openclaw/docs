---
read_when:
    - Mengimplementasikan atau mengubah penemuan/pengiklanan Bonjour
    - Menyesuaikan mode koneksi jarak jauh (langsung vs SSH)
    - Merancang penemuan Node + pemasangan untuk Node jarak jauh
summary: Penemuan Node dan transport (Bonjour, Tailscale, SSH) untuk menemukan Gateway
title: Penemuan dan transport
x-i18n:
    generated_at: "2026-04-30T09:48:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: c396e6e07808e2571c6d7f539922b94443adbf39339027e6e962596c6f13deaa
    source_path: gateway/discovery.md
    workflow: 16
---

# Penemuan & transport

OpenClaw memiliki dua masalah berbeda yang sekilas terlihat mirip:

1. **Kendali jarak jauh operator**: aplikasi bilah menu macOS yang mengendalikan Gateway yang berjalan di tempat lain.
2. **Pemasangan Node**: iOS/Android (dan Node masa depan) menemukan Gateway dan memasangkan secara aman.

Tujuan desainnya adalah menjaga semua penemuan/iklan jaringan di **Node Gateway** (`openclaw gateway`) dan menjadikan klien (aplikasi Mac, iOS) sebagai konsumen.

## Istilah

- **Gateway**: satu proses Gateway yang berjalan lama yang memiliki status (sesi, pemasangan, registri Node) dan menjalankan kanal. Sebagian besar penyiapan menggunakan satu per host; penyiapan multi-Gateway terisolasi dimungkinkan.
- **Gateway WS (control plane)**: endpoint WebSocket pada `127.0.0.1:18789` secara default; dapat diikat ke LAN/tailnet melalui `gateway.bind`.
- **Transport WS langsung**: endpoint Gateway WS yang menghadap LAN/tailnet (tanpa SSH).
- **Transport SSH (fallback)**: kendali jarak jauh dengan meneruskan `127.0.0.1:18789` melalui SSH.
- **Bridge TCP lama (dihapus)**: transport Node lama (lihat
  [Protokol bridge](/id/gateway/bridge-protocol)); tidak lagi diiklankan untuk
  penemuan dan tidak lagi menjadi bagian dari build saat ini.

Detail protokol:

- [Protokol Gateway](/id/gateway/protocol)
- [Protokol bridge (lama)](/id/gateway/bridge-protocol)

## Mengapa kami mempertahankan "langsung" dan SSH

- **WS langsung** adalah UX terbaik di jaringan yang sama dan di dalam tailnet:
  - penemuan otomatis di LAN melalui Bonjour
  - token pemasangan + ACL dimiliki oleh Gateway
  - tidak memerlukan akses shell; permukaan protokol dapat tetap ketat dan dapat diaudit
- **SSH** tetap menjadi fallback universal:
  - berfungsi di mana pun Anda memiliki akses SSH (bahkan lintas jaringan yang tidak terkait)
  - tahan terhadap masalah multicast/mDNS
  - tidak memerlukan port masuk baru selain SSH

## Input penemuan (cara klien mengetahui lokasi Gateway)

### 1) Penemuan Bonjour / DNS-SD

Multicast Bonjour bersifat upaya terbaik dan tidak melintasi jaringan. OpenClaw juga dapat menelusuri
beacon Gateway yang sama melalui domain DNS-SD area luas yang dikonfigurasi, sehingga penemuan dapat mencakup:

- `local.` di LAN yang sama
- domain DNS-SD unicast yang dikonfigurasi untuk penemuan lintas jaringan

Arah target:

- **Gateway** mengiklankan endpoint WS-nya melalui Bonjour.
- Klien menelusuri dan menampilkan daftar “pilih Gateway”, lalu menyimpan endpoint yang dipilih.

Pemecahan masalah dan detail beacon: [Bonjour](/id/gateway/bonjour).

#### Detail beacon layanan

- Jenis layanan:
  - `_openclaw-gw._tcp` (beacon transport Gateway)
- Kunci TXT (non-rahasia):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (nama tampilan yang dikonfigurasi operator)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (hanya saat TLS diaktifkan)
  - `gatewayTlsSha256=<sha256>` (hanya saat TLS diaktifkan dan fingerprint tersedia)
  - `canvasPort=<port>` (port host canvas; saat ini sama dengan `gatewayPort` saat host canvas diaktifkan)
  - `tailnetDns=<magicdns>` (petunjuk opsional; terdeteksi otomatis saat Tailscale tersedia)
  - `sshPort=<port>` (hanya mode penuh mDNS; DNS-SD area luas dapat menghilangkannya, dalam hal ini default SSH tetap di `22`)
  - `cliPath=<path>` (hanya mode penuh mDNS; DNS-SD area luas tetap menuliskannya sebagai petunjuk instalasi jarak jauh)

Catatan keamanan:

- Catatan TXT Bonjour/mDNS **tidak diautentikasi**. Klien harus memperlakukan nilai TXT hanya sebagai petunjuk UX.
- Perutean (host/port) sebaiknya mengutamakan **endpoint layanan yang di-resolve** (SRV + A/AAAA) dibanding `lanHost`, `tailnetDns`, atau `gatewayPort` yang disediakan TXT.
- Pinning TLS tidak boleh pernah mengizinkan `gatewayTlsSha256` yang diiklankan untuk menimpa pin yang telah disimpan sebelumnya.
- Node iOS/Android harus memerlukan konfirmasi eksplisit “percayai fingerprint ini” sebelum menyimpan pin pertama kali (verifikasi di luar band) setiap kali rute yang dipilih berbasis aman/TLS.

Nonaktifkan/timpa:

- `OPENCLAW_DISABLE_BONJOUR=1` menonaktifkan iklan.
- Saat `OPENCLAW_DISABLE_BONJOUR` tidak disetel, Bonjour mengiklankan pada host normal
  dan otomatis nonaktif di dalam container yang terdeteksi. Gunakan `0` hanya pada host, macvlan,
  atau jaringan lain yang mendukung mDNS; gunakan `1` untuk memaksa nonaktif.
- `gateway.bind` di `~/.openclaw/openclaw.json` mengendalikan mode bind Gateway.
- `OPENCLAW_SSH_PORT` menimpa port SSH yang diiklankan saat `sshPort` dipancarkan.
- `OPENCLAW_TAILNET_DNS` menerbitkan petunjuk `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` menimpa jalur CLI yang diiklankan.

### 2) Tailnet (lintas jaringan)

Untuk penyiapan gaya London/Vienna, Bonjour tidak akan membantu. Target “langsung” yang direkomendasikan adalah:

- Nama MagicDNS Tailscale (lebih disukai) atau IP tailnet yang stabil.

Jika Gateway dapat mendeteksi bahwa ia berjalan di bawah Tailscale, ia menerbitkan `tailnetDns` sebagai petunjuk opsional untuk klien (termasuk beacon area luas).

Aplikasi macOS sekarang lebih memilih nama MagicDNS daripada IP Tailscale mentah untuk penemuan Gateway. Ini meningkatkan keandalan saat IP tailnet berubah (misalnya setelah restart Node atau penetapan ulang CGNAT), karena nama MagicDNS otomatis di-resolve ke IP saat ini.

Untuk pemasangan Node seluler, petunjuk penemuan tidak melonggarkan keamanan transport pada rute tailnet/publik:

- iOS/Android tetap memerlukan jalur koneksi pertama kali tailnet/publik yang aman (`wss://` atau Tailscale Serve/Funnel).
- IP tailnet mentah yang ditemukan adalah petunjuk perutean, bukan izin untuk menggunakan `ws://` jarak jauh plaintext.
- Koneksi langsung LAN privat `ws://` tetap didukung.
- Jika Anda menginginkan jalur Tailscale paling sederhana untuk Node seluler, gunakan Tailscale Serve agar penemuan dan kode penyiapan sama-sama di-resolve ke endpoint MagicDNS aman yang sama.

### 3) Target manual / SSH

Saat tidak ada rute langsung (atau langsung dinonaktifkan), klien selalu dapat terhubung melalui SSH dengan meneruskan port Gateway loopback.

Lihat [Akses jarak jauh](/id/gateway/remote).

## Pemilihan transport (kebijakan klien)

Perilaku klien yang direkomendasikan:

1. Jika endpoint langsung yang sudah dipasangkan dikonfigurasi dan dapat dijangkau, gunakan itu.
2. Jika tidak, jika penemuan menemukan Gateway di `local.` atau domain area luas yang dikonfigurasi, tawarkan pilihan sekali ketuk “Gunakan Gateway ini” dan simpan sebagai endpoint langsung.
3. Jika tidak, jika DNS/IP tailnet dikonfigurasi, coba langsung.
   Untuk Node seluler pada rute tailnet/publik, langsung berarti endpoint aman, bukan `ws://` jarak jauh plaintext.
4. Jika tidak, fallback ke SSH.

## Pemasangan + auth (transport langsung)

Gateway adalah sumber kebenaran untuk penerimaan Node/klien.

- Permintaan pemasangan dibuat/disetujui/ditolak di Gateway (lihat [Pemasangan Gateway](/id/gateway/pairing)).
- Gateway menegakkan:
  - auth (token / keypair)
  - cakupan/ACL (Gateway bukan proxy mentah ke setiap metode)
  - batas laju

## Tanggung jawab menurut komponen

- **Gateway**: mengiklankan beacon penemuan, memiliki keputusan pemasangan, dan menghosting endpoint WS.
- **Aplikasi macOS**: membantu Anda memilih Gateway, menampilkan prompt pemasangan, dan menggunakan SSH hanya sebagai fallback.
- **Node iOS/Android**: menelusuri Bonjour sebagai kemudahan dan terhubung ke Gateway WS yang sudah dipasangkan.

## Terkait

- [Akses jarak jauh](/id/gateway/remote)
- [Tailscale](/id/gateway/tailscale)
- [Penemuan Bonjour](/id/gateway/bonjour)
