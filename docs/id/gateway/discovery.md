---
read_when:
    - Mengimplementasikan atau mengubah penemuan/pengiklanan Bonjour
    - Menyesuaikan mode koneksi jarak jauh (langsung vs SSH)
    - Merancang penemuan + pemasangan Node untuk Node jarak jauh
summary: Penemuan Node dan transport (Bonjour, Tailscale, SSH) untuk menemukan Gateway
title: Penemuan dan transportasi
x-i18n:
    generated_at: "2026-07-12T14:13:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a3f1a6a1212ab0bc7021e77c88de059edcb8e09eff90d3e1e59451b9b20876b
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw memiliki dua masalah penemuan yang saling terkait tetapi berbeda:

1. **Kendali jarak jauh operator**: aplikasi bilah menu macOS yang mengendalikan Gateway yang berjalan di tempat lain.
2. **Pemasangan Node**: iOS/Android (dan Node mendatang) menemukan Gateway dan melakukan pemasangan secara aman.

Semua penemuan/pengiklanan jaringan berada di **Gateway Node**
(`openclaw gateway`); klien (aplikasi Mac, iOS) hanya bertindak sebagai konsumen.

## Istilah

- **Gateway**: satu proses berumur panjang yang memiliki status (sesi,
  pemasangan, registri Node) dan menjalankan kanal. Sebagian besar konfigurasi menggunakan satu per host;
  konfigurasi dengan beberapa Gateway yang terisolasi juga dimungkinkan.
- **WS Gateway (bidang kendali)**: titik akhir WebSocket pada `127.0.0.1:18789`
  secara default; ikat ke LAN/tailnet melalui `gateway.bind`.
- **Transportasi WS langsung**: titik akhir WS Gateway yang menghadap LAN/tailnet (tanpa SSH).
- **Transportasi SSH (cadangan)**: kendali jarak jauh dengan meneruskan
  `127.0.0.1:18789` melalui SSH.
- **Jembatan TCP lama (dihapus)**: transportasi Node lama (lihat
  [Protokol jembatan](/id/gateway/bridge-protocol)); tidak lagi diiklankan untuk
  penemuan dan tidak lagi menjadi bagian dari build saat ini.

Detail protokol: [Protokol Gateway](/id/gateway/protocol),
[Protokol jembatan (lama)](/id/gateway/bridge-protocol).

## Mengapa koneksi langsung dan SSH tersedia

- **WS langsung** memberikan pengalaman pengguna terbaik di jaringan yang sama dan dalam satu tailnet: penemuan
  otomatis LAN melalui Bonjour, token pemasangan dan ACL yang dimiliki oleh Gateway,
  serta tidak memerlukan akses shell.
- **SSH** adalah cadangan universal: berfungsi di mana pun Anda memiliki akses SSH, bahkan
  di antara jaringan yang tidak berkaitan, tetap berfungsi saat terjadi masalah multicast/mDNS, dan tidak memerlukan
  port masuk baru selain SSH.

## Masukan penemuan

### 1) Bonjour / DNS-SD

Bonjour multicast bersifat upaya terbaik dan tidak melintasi jaringan. OpenClaw juga
mendukung penelusuran suar Gateway yang sama melalui domain DNS-SD area luas yang
dikonfigurasi, sehingga penemuan dapat mencakup `local.` di LAN yang sama dan domain
DNS-SD unicast yang dikonfigurasi untuk penemuan lintas jaringan.

**Gateway** mengiklankan titik akhir WS-nya melalui Bonjour saat Plugin bawaan
`bonjour` diaktifkan; klien menelusuri dan menampilkan daftar "pilih Gateway",
lalu menyimpan titik akhir yang dipilih.

Pemecahan masalah dan detail suar: [Bonjour](/id/gateway/bonjour).

#### Detail suar layanan

- Jenis layanan: `_openclaw-gw._tcp` (suar transportasi Gateway).
- Kunci TXT (bukan rahasia):

  | Kunci                       | Catatan                                                                                                                                                          |
  | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `role=gateway`              | Selalu ada.                                                                                                                                                      |
  | `transport=gateway`         | Selalu ada.                                                                                                                                                      |
  | `displayName=<name>`        | Nama tampilan yang dikonfigurasi operator.                                                                                                                       |
  | `lanHost=<hostname>.local`  | Hanya pengiklan mDNS LAN; tidak ditulis oleh DNS-SD area luas.                                                                                                   |
  | `gatewayPort=18789`         | Port WS Gateway + HTTP.                                                                                                                                          |
  | `gatewayTls=1`              | Hanya saat TLS diaktifkan.                                                                                                                                       |
  | `gatewayTlsSha256=<sha256>` | Hanya saat TLS diaktifkan dan sidik jari tersedia.                                                                                                               |
  | `tailnetDns=<magicdns>`     | Petunjuk opsional; terdeteksi otomatis saat Tailscale tersedia.                                                                                                  |
  | `sshPort=<port>`            | Hanya ada saat `discovery.mdns.mode="full"`; dihilangkan (SSH secara default menggunakan `22`) dalam mode default `"minimal"`, baik pada pengiklan LAN maupun DNS-SD area luas. |
  | `cliPath=<path>`            | Menggunakan batasan `discovery.mdns.mode="full"` yang sama seperti `sshPort`; petunjuk instalasi jarak jauh untuk jalur CLI.                                     |

  Kunci TXT `canvasPort` ditentukan dalam kontrak penemuan Plugin untuk
  port host kanvas mendatang, tetapi saat ini tidak ada jalur kode yang menetapkan nilainya, sehingga
  saat ini kunci tersebut tidak pernah dipancarkan.

Catatan keamanan:

- Catatan TXT Bonjour/mDNS **tidak diautentikasi**. Klien harus memperlakukan nilai TXT
  hanya sebagai petunjuk pengalaman pengguna.
- Perutean (host/port) sebaiknya mengutamakan **titik akhir layanan yang diresolusi**
  (SRV + A/AAAA) daripada `lanHost`, `tailnetDns`, atau `gatewayPort` yang disediakan TXT.
- Penyematan TLS tidak boleh membiarkan `gatewayTlsSha256` yang diiklankan menggantikan
  sematan yang telah disimpan sebelumnya.
- Node iOS/Android harus mewajibkan konfirmasi eksplisit "percayai sidik jari ini"
  sebelum menyimpan sematan untuk pertama kalinya (verifikasi di luar kanal)
  setiap kali rute yang dipilih aman/berbasis TLS.

Mengaktifkan, menonaktifkan, dan mengganti:

- `openclaw plugins enable bonjour` mengaktifkan pengiklanan multicast LAN.
- `discovery.mdns.mode` dalam `openclaw.json` mengendalikan siaran mDNS:
  `"minimal"` (default), `"full"` (menambahkan `cliPath`/`sshPort` ke suar LAN
  dan zona DNS-SD area luas mana pun), atau `"off"` (menonaktifkan mDNS).
- `OPENCLAW_DISABLE_BONJOUR=1` menonaktifkan pengiklanan secara paksa; `discovery.mdns.mode="off"`
  menonaktifkannya secara terpisah. `OPENCLAW_DISABLE_BONJOUR=0` adalah persetujuan eksplisit
  yang menggantikan penonaktifan otomatis Plugin di dalam kontainer yang terdeteksi
  (Docker, containerd, Kubernetes, LXC); nilai ini tidak menggantikan
  `discovery.mdns.mode="off"`. Plugin bawaan `bonjour` dimulai otomatis pada
  host macOS (`enabledByDefaultOnPlatforms: ["darwin"]`) dan dinonaktifkan otomatis
  di dalam kontainer yang terdeteksi; penerapan Linux, Windows, dan penerapan
  terkontainerisasi lainnya memerlukan `plugins enable bonjour` secara eksplisit.
- `gateway.bind` dalam `~/.openclaw/openclaw.json` mengendalikan mode pengikatan Gateway.
- `OPENCLAW_SSH_PORT` mengganti port SSH yang diiklankan (hanya berlaku
  saat `discovery.mdns.mode="full"`).
- `OPENCLAW_TAILNET_DNS` menerbitkan petunjuk `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` mengganti jalur CLI yang diiklankan.

### 2) Tailnet (lintas jaringan)

Untuk Gateway di jaringan fisik yang berbeda, Bonjour tidak akan membantu. Target
langsung yang disarankan adalah nama Tailscale MagicDNS (diutamakan) atau
IP tailnet yang stabil.

Jika Gateway mendeteksi bahwa ia berjalan di bawah Tailscale, Gateway menerbitkan
`tailnetDns` sebagai petunjuk opsional bagi klien (termasuk suar area luas).
Aplikasi macOS mengutamakan nama MagicDNS daripada IP Tailscale mentah untuk
penemuan Gateway, yang tetap andal ketika IP tailnet berubah (Node dimulai ulang,
penetapan ulang CGNAT) karena MagicDNS secara otomatis meresolusi ke IP saat ini.

Untuk pemasangan Node seluler, petunjuk penemuan tidak pernah melonggarkan keamanan transportasi pada
rute tailnet/publik:

- iOS/Android tetap memerlukan jalur koneksi pertama kali ke tailnet/publik yang aman
  (`wss://` atau Tailscale Serve/Funnel).
- IP tailnet mentah yang ditemukan adalah petunjuk perutean, bukan izin untuk menggunakan
  `ws://` jarak jauh tanpa enkripsi.
- Koneksi langsung `ws://` pada LAN privat tetap didukung.
- Untuk jalur Tailscale paling sederhana pada Node seluler, gunakan Tailscale Serve agar
  penemuan dan penyiapan sama-sama mengarah ke titik akhir MagicDNS aman yang sama.

### 3) Target manual / SSH

Saat tidak ada rute langsung (atau koneksi langsung dinonaktifkan), klien selalu dapat
terhubung melalui SSH dengan meneruskan port Gateway local loopback. Lihat
[Akses jarak jauh](/id/gateway/remote).

## Pemilihan transportasi (kebijakan klien)

1. Jika titik akhir langsung yang telah dipasangkan dikonfigurasi dan dapat dijangkau, gunakan titik akhir tersebut.
2. Jika tidak, bila penemuan menemukan Gateway pada `local.` atau domain area luas yang
   dikonfigurasi, tawarkan pilihan sekali ketuk "Gunakan Gateway ini" dan simpan sebagai
   titik akhir langsung.
3. Jika tidak, bila DNS/IP tailnet dikonfigurasi, coba koneksi langsung. Untuk Node seluler pada
   rute tailnet/publik, koneksi langsung berarti titik akhir yang aman, bukan
   `ws://` jarak jauh tanpa enkripsi.
4. Jika tidak, gunakan SSH sebagai cadangan.

## Pemasangan dan autentikasi (transportasi langsung)

Gateway adalah sumber kebenaran untuk penerimaan Node/klien:

- Permintaan pemasangan dibuat/disetujui/ditolak di Gateway (lihat
  [Pemasangan Gateway](/id/gateway/pairing)).
- Gateway memberlakukan autentikasi (token/pasangan kunci), cakupan/ACL (Gateway bukan proksi mentah
  ke setiap metode), dan batas laju.

## Tanggung jawab berdasarkan komponen

- **Gateway**: mengiklankan suar penemuan, memiliki keputusan pemasangan, dan menghosting
  titik akhir WS.
- **Aplikasi macOS**: membantu Anda memilih Gateway, menampilkan permintaan pemasangan, dan menggunakan SSH
  hanya sebagai cadangan.
- **Node iOS/Android**: menelusuri Bonjour untuk kemudahan, lalu terhubung ke
  WS Gateway yang dipasangkan.

## Terkait

- [Akses jarak jauh](/id/gateway/remote)
- [Tailscale](/id/gateway/tailscale)
- [Penemuan Bonjour](/id/gateway/bonjour)
