---
read_when:
    - Mengimplementasikan atau mengubah penemuan/periklanan Bonjour
    - Menyesuaikan mode koneksi jarak jauh (langsung vs SSH)
    - Merancang penemuan Node + pairing untuk Node jarak jauh
summary: Penemuan Node dan transport (Bonjour, Tailscale, SSH) untuk menemukan gateway
title: Penemuan dan transport
x-i18n:
    generated_at: "2026-04-26T11:28:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 615be0f501470772c257beb8e798c522c108b09081a603f44218404277fdf269
    source_path: gateway/discovery.md
    workflow: 15
---

# Penemuan & transport

OpenClaw memiliki dua masalah berbeda yang sekilas tampak mirip:

1. **Kontrol jarak jauh operator**: aplikasi menu bar macOS mengendalikan gateway yang berjalan di tempat lain.
2. **Node pairing**: iOS/Android (dan Node masa depan) menemukan gateway dan melakukan pairing dengan aman.

Tujuan desainnya adalah menjaga semua penemuan/periklanan jaringan di **Node Gateway** (`openclaw gateway`) dan menjaga klien (aplikasi Mac, iOS) tetap sebagai konsumen.

## Istilah

- **Gateway**: satu proses gateway berjalan lama yang memiliki state (sesi, pairing, registri Node) dan menjalankan kanal. Sebagian besar penyiapan menggunakan satu per host; penyiapan multi-gateway terisolasi dimungkinkan.
- **Gateway WS (control plane)**: endpoint WebSocket pada `127.0.0.1:18789` secara default; dapat di-bind ke LAN/tailnet melalui `gateway.bind`.
- **Direct WS transport**: endpoint Gateway WS yang menghadap LAN/tailnet (tanpa SSH).
- **SSH transport (fallback)**: kontrol jarak jauh dengan meneruskan `127.0.0.1:18789` melalui SSH.
- **Legacy TCP bridge (dihapus)**: transport Node lama (lihat
  [Bridge protocol](/id/gateway/bridge-protocol)); tidak lagi diiklankan untuk
  penemuan dan tidak lagi menjadi bagian dari build saat ini.

Detail protokol:

- [Gateway protocol](/id/gateway/protocol)
- [Bridge protocol (legacy)](/id/gateway/bridge-protocol)

## Mengapa kami mempertahankan "direct" dan SSH

- **Direct WS** memberikan UX terbaik pada jaringan yang sama dan di dalam tailnet:
  - penemuan otomatis di LAN melalui Bonjour
  - token pairing + ACL dimiliki oleh gateway
  - tidak memerlukan akses shell; surface protokol dapat tetap ketat dan dapat diaudit
- **SSH** tetap menjadi fallback universal:
  - bekerja di mana pun Anda memiliki akses SSH (bahkan lintas jaringan yang tidak terkait)
  - tetap berfungsi saat ada masalah multicast/mDNS
  - tidak memerlukan port masuk baru selain SSH

## Input penemuan (bagaimana klien mengetahui di mana gateway berada)

### 1) Penemuan Bonjour / DNS-SD

Bonjour multicast bersifat best-effort dan tidak melintasi jaringan. OpenClaw juga dapat menelusuri
beacon gateway yang sama melalui domain DNS-SD area luas yang dikonfigurasi, sehingga penemuan dapat mencakup:

- `local.` pada LAN yang sama
- domain DNS-SD unicast yang dikonfigurasi untuk penemuan lintas jaringan

Arah target:

- **Gateway** mengiklankan endpoint WS-nya melalui Bonjour.
- Klien menelusuri dan menampilkan daftar “pilih gateway”, lalu menyimpan endpoint yang dipilih.

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
  - `gatewayTls=1` (hanya saat TLS diaktifkan)
  - `gatewayTlsSha256=<sha256>` (hanya saat TLS diaktifkan dan fingerprint tersedia)
  - `canvasPort=<port>` (port host canvas; saat ini sama dengan `gatewayPort` saat host canvas diaktifkan)
  - `tailnetDns=<magicdns>` (petunjuk opsional; terdeteksi otomatis saat Tailscale tersedia)
  - `sshPort=<port>` (hanya mode penuh mDNS; DNS-SD area luas dapat menghilangkannya, dalam hal ini default SSH tetap di `22`)
  - `cliPath=<path>` (hanya mode penuh mDNS; DNS-SD area luas tetap menuliskannya sebagai petunjuk instalasi jarak jauh)

Catatan keamanan:

- Rekaman TXT Bonjour/mDNS **tidak diautentikasi**. Klien harus memperlakukan nilai TXT hanya sebagai petunjuk UX.
- Perutean (host/port) harus memilih **endpoint layanan yang di-resolve** (SRV + A/AAAA) daripada `lanHost`, `tailnetDns`, atau `gatewayPort` yang diberikan TXT.
- TLS pinning tidak boleh mengizinkan `gatewayTlsSha256` yang diiklankan menimpa pin yang sebelumnya disimpan.
- Node iOS/Android harus memerlukan konfirmasi eksplisit “percayai fingerprint ini” sebelum menyimpan pin pertama kali (verifikasi out-of-band) kapan pun rute yang dipilih aman/berbasis TLS.

Nonaktifkan/override:

- `OPENCLAW_DISABLE_BONJOUR=1` menonaktifkan periklanan.
- Docker Compose secara default menetapkan `OPENCLAW_DISABLE_BONJOUR=1` karena jaringan bridge
  biasanya tidak membawa multicast mDNS secara andal; gunakan `0` hanya pada host, macvlan,
  atau jaringan lain yang mendukung mDNS.
- `gateway.bind` di `~/.openclaw/openclaw.json` mengontrol mode bind Gateway.
- `OPENCLAW_SSH_PORT` mengoverride port SSH yang diiklankan saat `sshPort` dipancarkan.
- `OPENCLAW_TAILNET_DNS` memublikasikan petunjuk `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` mengoverride path CLI yang diiklankan.

### 2) Tailnet (lintas jaringan)

Untuk penyiapan gaya London/Vienna, Bonjour tidak akan membantu. Target “direct” yang direkomendasikan adalah:

- nama Tailscale MagicDNS (disarankan) atau IP tailnet yang stabil.

Jika gateway dapat mendeteksi bahwa ia berjalan di bawah Tailscale, gateway akan memublikasikan `tailnetDns` sebagai petunjuk opsional untuk klien (termasuk beacon area luas).

Aplikasi macOS kini lebih memilih nama MagicDNS daripada IP Tailscale mentah untuk penemuan gateway. Ini meningkatkan keandalan saat IP tailnet berubah (misalnya setelah restart Node atau penetapan ulang CGNAT), karena nama MagicDNS otomatis di-resolve ke IP saat ini.

Untuk pairing Node mobile, petunjuk penemuan tidak melonggarkan keamanan transport pada rute tailnet/publik:

- iOS/Android tetap memerlukan path koneksi pertama tailnet/publik yang aman (`wss://` atau Tailscale Serve/Funnel).
- IP tailnet mentah yang ditemukan adalah petunjuk perutean, bukan izin untuk menggunakan `ws://` jarak jauh plaintext.
- `ws://` direct-connect LAN privat tetap didukung.
- Jika Anda menginginkan path Tailscale paling sederhana untuk Node mobile, gunakan Tailscale Serve agar penemuan dan kode penyiapan sama-sama di-resolve ke endpoint MagicDNS aman yang sama.

### 3) Target manual / SSH

Saat tidak ada rute direct (atau direct dinonaktifkan), klien selalu dapat terhubung melalui SSH dengan meneruskan port gateway loopback.

Lihat [Remote access](/id/gateway/remote).

## Pemilihan transport (kebijakan klien)

Perilaku klien yang direkomendasikan:

1. Jika endpoint direct yang telah dipairing dikonfigurasi dan dapat dijangkau, gunakan itu.
2. Jika tidak, bila penemuan menemukan gateway di `local.` atau domain area luas yang dikonfigurasi, tawarkan pilihan “Gunakan gateway ini” sekali ketuk dan simpan sebagai endpoint direct.
3. Jika tidak, bila DNS/IP tailnet dikonfigurasi, coba direct.
   Untuk Node mobile pada rute tailnet/publik, direct berarti endpoint yang aman, bukan `ws://` jarak jauh plaintext.
4. Jika tidak, fallback ke SSH.

## Pairing + auth (direct transport)

Gateway adalah sumber kebenaran untuk penerimaan Node/klien.

- Permintaan pairing dibuat/disetujui/ditolak di gateway (lihat [Gateway pairing](/id/gateway/pairing)).
- Gateway menegakkan:
  - auth (token / keypair)
  - scope/ACL (gateway bukan proxy mentah ke setiap metode)
  - rate limit

## Tanggung jawab per komponen

- **Gateway**: mengiklankan beacon penemuan, memiliki keputusan pairing, dan menghosting endpoint WS.
- **Aplikasi macOS**: membantu Anda memilih gateway, menampilkan prompt pairing, dan menggunakan SSH hanya sebagai fallback.
- **Node iOS/Android**: menelusuri Bonjour sebagai kemudahan dan terhubung ke Gateway WS yang telah dipairing.

## Terkait

- [Remote access](/id/gateway/remote)
- [Tailscale](/id/gateway/tailscale)
- [Bonjour discovery](/id/gateway/bonjour)
