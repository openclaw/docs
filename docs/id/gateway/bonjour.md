---
read_when:
    - Memecahkan masalah penemuan Bonjour di macOS/iOS
    - Mengubah jenis layanan mDNS, rekaman TXT, atau UX penemuan
summary: Penemuan + pemecahan masalah Bonjour/mDNS (suar Gateway, klien, dan mode kegagalan umum)
title: Penemuan Bonjour
x-i18n:
    generated_at: "2026-05-06T09:10:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7b7d029e6eb6bee90eb96e7ea169ecadf3bda6d969b2450349c5716a950e205
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw dapat menggunakan Bonjour (mDNS / DNS-SD) untuk menemukan Gateway aktif (endpoint WebSocket).
Penjelajahan multicast `local.` adalah **kemudahan khusus LAN**. Plugin `bonjour`
bawaan memiliki pengiklanan LAN. Plugin ini otomatis dimulai di host macOS dan bersifat opsional di
Linux, Windows, dan deployment Gateway berbasis container. Untuk penemuan lintas jaringan, beacon yang sama
juga dapat dipublikasikan melalui domain DNS-SD area luas yang dikonfigurasi. Penemuan
tetap bersifat upaya terbaik dan **tidak** menggantikan konektivitas berbasis SSH atau Tailnet.

## Bonjour area luas (DNS-SD unicast) melalui Tailscale

Jika node dan gateway berada di jaringan berbeda, multicast mDNS tidak akan melewati
batas tersebut. Anda dapat mempertahankan UX penemuan yang sama dengan beralih ke **DNS-SD unicast**
("Bonjour Area Luas") melalui Tailscale.

Langkah tingkat tinggi:

1. Jalankan server DNS di host gateway (dapat dijangkau melalui Tailnet).
2. Publikasikan record DNS-SD untuk `_openclaw-gw._tcp` di bawah zona khusus
   (contoh: `openclaw.internal.`).
3. Konfigurasikan **split DNS** Tailscale agar domain pilihan Anda di-resolve melalui
   server DNS tersebut untuk klien (termasuk iOS).

OpenClaw mendukung domain penemuan apa pun; `openclaw.internal.` hanyalah contoh.
Node iOS/Android menjelajahi `local.` dan domain area luas yang Anda konfigurasi.

### Konfigurasi Gateway (direkomendasikan)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### Penyiapan server DNS satu kali (host gateway)

```bash
openclaw dns setup --apply
```

Ini memasang CoreDNS dan mengonfigurasinya untuk:

- mendengarkan pada port 53 hanya di antarmuka Tailscale milik gateway
- melayani domain pilihan Anda (contoh: `openclaw.internal.`) dari `~/.openclaw/dns/<domain>.db`

Validasi dari mesin yang terhubung ke tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Pengaturan DNS Tailscale

Di konsol admin Tailscale:

- Tambahkan nameserver yang menunjuk ke IP tailnet gateway (UDP/TCP 53).
- Tambahkan split DNS agar domain penemuan Anda menggunakan nameserver tersebut.

Setelah klien menerima DNS tailnet, node iOS dan penemuan CLI dapat menjelajahi
`_openclaw-gw._tcp` di domain penemuan Anda tanpa multicast.

### Keamanan listener Gateway (direkomendasikan)

Port WS Gateway (default `18789`) terikat ke loopback secara default. Untuk akses LAN/tailnet,
ikat secara eksplisit dan tetap aktifkan autentikasi.

Untuk penyiapan khusus tailnet:

- Atur `gateway.bind: "tailnet"` di `~/.openclaw/openclaw.json`.
- Mulai ulang Gateway (atau mulai ulang aplikasi menubar macOS).

## Apa yang mengiklankan

Hanya Gateway yang mengiklankan `_openclaw-gw._tcp`. Pengiklanan multicast LAN
disediakan oleh Plugin `bonjour` bawaan saat Plugin diaktifkan; publikasi
DNS-SD area luas tetap dimiliki Gateway.

## Jenis layanan

- `_openclaw-gw._tcp` - beacon transport gateway (digunakan oleh node macOS/iOS/Android).

## Kunci TXT (petunjuk non-rahasia)

Gateway mengiklankan petunjuk kecil non-rahasia untuk membuat alur UI praktis:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (hanya saat TLS diaktifkan)
- `gatewayTlsSha256=<sha256>` (hanya saat TLS diaktifkan dan fingerprint tersedia)
- `canvasPort=<port>` (hanya saat host canvas diaktifkan; saat ini sama dengan `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (hanya mode penuh mDNS, petunjuk opsional saat Tailnet tersedia)
- `sshPort=<port>` (hanya mode penuh mDNS; DNS-SD area luas dapat menghilangkannya)
- `cliPath=<path>` (hanya mode penuh mDNS; DNS-SD area luas tetap menuliskannya sebagai petunjuk instalasi jarak jauh)

Catatan keamanan:

- Record TXT Bonjour/mDNS **tidak diautentikasi**. Klien tidak boleh memperlakukan TXT sebagai routing otoritatif.
- Klien sebaiknya merutekan menggunakan endpoint layanan yang di-resolve (SRV + A/AAAA). Perlakukan `lanHost`, `tailnetDns`, `gatewayPort`, dan `gatewayTlsSha256` hanya sebagai petunjuk.
- Penargetan otomatis SSH juga sebaiknya menggunakan host layanan yang di-resolve, bukan petunjuk berbasis TXT saja.
- Pinning TLS tidak boleh pernah mengizinkan `gatewayTlsSha256` yang diiklankan untuk menimpa pin yang sebelumnya disimpan.
- Node iOS/Android sebaiknya memperlakukan koneksi langsung berbasis penemuan sebagai **hanya TLS** dan memerlukan konfirmasi pengguna eksplisit sebelum mempercayai fingerprint pertama kali.

## Debugging di macOS

Alat bawaan yang berguna:

- Jelajahi instance:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Resolve satu instance (ganti `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Jika penjelajahan berhasil tetapi resolve gagal, biasanya Anda mengalami masalah kebijakan LAN atau
resolver mDNS.

## Debugging di log Gateway

Gateway menulis file log bergulir (dicetak saat startup sebagai
`gateway log file: ...`). Cari baris `bonjour:`, terutama:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour menggunakan hostname sistem untuk host `.local` yang diiklankan saat hostname tersebut merupakan
label DNS yang valid. Jika hostname sistem berisi spasi, garis bawah, atau karakter
label DNS lain yang tidak valid, OpenClaw fallback ke `openclaw.local`. Atur
`OPENCLAW_MDNS_HOSTNAME=<name>` sebelum memulai Gateway saat Anda membutuhkan
label host eksplisit.

## Debugging di node iOS

Node iOS menggunakan `NWBrowser` untuk menemukan `_openclaw-gw._tcp`.

Untuk menangkap log:

- Settings → Gateway → Advanced → **Log Debug Penemuan**
- Settings → Gateway → Advanced → **Log Penemuan** → reproduksi → **Copy**

Log tersebut mencakup transisi status browser dan perubahan set hasil.

## Kapan mengaktifkan Bonjour

Bonjour otomatis dimulai untuk startup Gateway dengan konfigurasi kosong di host macOS karena
aplikasi lokal dan node iOS/Android di sekitar umumnya mengandalkan penemuan sesama LAN.

Aktifkan Bonjour secara eksplisit saat penemuan otomatis sesama LAN berguna di Linux,
Windows, atau host non-macOS lain:

```bash
openclaw plugins enable bonjour
```

Saat diaktifkan, Bonjour menggunakan `discovery.mdns.mode` untuk memutuskan seberapa banyak metadata TXT
yang akan dipublikasikan. Mode default adalah `minimal`; gunakan `full` hanya saat klien lokal membutuhkan
petunjuk `cliPath` atau `sshPort`, dan gunakan `off` untuk menekan multicast LAN tanpa
mengubah pengaktifan Plugin.

## Kapan menonaktifkan Bonjour

Biarkan Bonjour dinonaktifkan saat pengiklanan multicast LAN tidak diperlukan, tidak tersedia,
atau merugikan. Kasus umum adalah server non-macOS, networking bridge Docker,
WSL, atau kebijakan jaringan yang menjatuhkan multicast mDNS. Di lingkungan tersebut
Gateway tetap dapat dijangkau melalui URL yang dipublikasikan, SSH, Tailnet, atau DNS-SD
area luas, tetapi penemuan otomatis LAN tidak andal.

Utamakan override environment yang ada saat masalahnya terkait cakupan deployment:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Itu menonaktifkan pengiklanan multicast LAN tanpa mengubah konfigurasi Plugin.
Ini aman untuk image Docker, file service, skrip launch, dan debugging sekali pakai
karena pengaturan tersebut hilang saat environment hilang.

Gunakan konfigurasi Plugin saat Anda memang ingin mematikan Plugin penemuan LAN
bawaan untuk konfigurasi OpenClaw tersebut:

```bash
openclaw plugins disable bonjour
```

## Hal yang perlu diperhatikan di Docker

Plugin Bonjour bawaan otomatis menonaktifkan pengiklanan multicast LAN di container
yang terdeteksi saat `OPENCLAW_DISABLE_BONJOUR` tidak diatur. Jaringan bridge Docker
biasanya tidak meneruskan multicast mDNS (`224.0.0.251:5353`) antara container
dan LAN, sehingga pengiklanan dari container jarang membuat penemuan berfungsi.

Hal penting yang perlu diperhatikan:

- Bonjour otomatis dimulai di host macOS dan bersifat opsional di tempat lain. Membiarkannya
  dinonaktifkan tidak menghentikan Gateway; itu hanya melewati pengiklanan multicast LAN.
- Menonaktifkan Bonjour tidak mengubah `gateway.bind`; Docker tetap default ke
  `OPENCLAW_GATEWAY_BIND=lan` agar port host yang dipublikasikan dapat berfungsi.
- Menonaktifkan Bonjour tidak menonaktifkan DNS-SD area luas. Gunakan penemuan area luas
  atau Tailnet saat Gateway dan node tidak berada di LAN yang sama.
- Menggunakan ulang `OPENCLAW_CONFIG_DIR` yang sama di luar Docker tidak mempertahankan
  kebijakan penonaktifan otomatis container.
- Atur `OPENCLAW_DISABLE_BONJOUR=0` hanya untuk host networking, macvlan, atau jaringan lain
  yang diketahui dapat melewatkan multicast mDNS; atur ke `1` untuk menonaktifkan paksa.

## Memecahkan masalah Bonjour yang dinonaktifkan

Jika node tidak lagi menemukan Gateway secara otomatis setelah penyiapan Docker:

1. Konfirmasi apakah Gateway berjalan dalam mode otomatis, dipaksa aktif, atau dipaksa nonaktif:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Konfirmasi Gateway itu sendiri dapat dijangkau melalui port yang dipublikasikan:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Gunakan target langsung saat Bonjour dinonaktifkan:
   - Control UI atau alat lokal: `http://127.0.0.1:18789`
   - Klien LAN: `http://<gateway-host>:18789`
   - Klien lintas jaringan: Tailnet MagicDNS, IP Tailnet, tunnel SSH, atau
     DNS-SD area luas

4. Jika Anda sengaja mengaktifkan Plugin Bonjour di Docker dan memaksa pengiklanan
   dengan `OPENCLAW_DISABLE_BONJOUR=0`, uji multicast dari host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Jika penjelajahan kosong atau log Gateway menunjukkan pembatalan watchdog ciao
   berulang, pulihkan `OPENCLAW_DISABLE_BONJOUR=1` dan gunakan rute langsung atau
   Tailnet.

## Mode kegagalan umum

- **Bonjour tidak melewati jaringan**: gunakan Tailnet atau SSH.
- **Multicast diblokir**: beberapa jaringan Wi-Fi menonaktifkan mDNS.
- **Advertiser macet dalam probing/announcing**: host dengan multicast yang diblokir,
  bridge container, WSL, atau perubahan antarmuka dapat membuat advertiser ciao berada dalam
  status tidak diumumkan. OpenClaw mencoba ulang beberapa kali lalu menonaktifkan Bonjour
  untuk proses Gateway saat ini alih-alih memulai ulang advertiser selamanya.
- **Networking bridge Docker**: Bonjour otomatis dinonaktifkan di container yang terdeteksi.
  Atur `OPENCLAW_DISABLE_BONJOUR=0` hanya untuk host, macvlan, atau jaringan lain
  yang mendukung mDNS.
- **Sleep / perubahan antarmuka**: macOS dapat sementara kehilangan hasil mDNS; coba ulang.
- **Penjelajahan berhasil tetapi resolve gagal**: jaga nama mesin tetap sederhana (hindari emoji atau
  tanda baca), lalu mulai ulang Gateway. Nama instance layanan diturunkan dari
  nama host, sehingga nama yang terlalu kompleks dapat membingungkan beberapa resolver.

## Nama instance yang di-escape (`\032`)

Bonjour/DNS-SD sering meng-escape byte dalam nama instance layanan sebagai urutan
desimal `\DDD` (misalnya spasi menjadi `\032`).

- Ini normal pada tingkat protokol.
- UI sebaiknya mendekode untuk tampilan (iOS menggunakan `BonjourEscapes.decode`).

## Mengaktifkan / menonaktifkan / konfigurasi

- Host macOS otomatis memulai Plugin penemuan LAN bawaan secara default.
- `openclaw plugins enable bonjour` mengaktifkan Plugin penemuan LAN bawaan pada host yang tidak mengaktifkannya secara default.
- `openclaw plugins disable bonjour` menonaktifkan pengiklanan multicast LAN dengan menonaktifkan Plugin bawaan.
- `OPENCLAW_DISABLE_BONJOUR=1` menonaktifkan pengiklanan multicast LAN tanpa mengubah konfigurasi Plugin; nilai truthy yang diterima adalah `1`, `true`, `yes`, dan `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` memaksa pengiklanan multicast LAN aktif, termasuk di dalam container yang terdeteksi; nilai falsy yang diterima adalah `0`, `false`, `no`, dan `off`.
- Saat Plugin Bonjour diaktifkan dan `OPENCLAW_DISABLE_BONJOUR` tidak diatur, Bonjour mengiklankan di host normal dan otomatis menonaktifkan diri di dalam container yang terdeteksi.
- `gateway.bind` di `~/.openclaw/openclaw.json` mengontrol mode bind Gateway.
- `OPENCLAW_SSH_PORT` menimpa port SSH saat `sshPort` diiklankan (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` memublikasikan petunjuk MagicDNS di TXT saat mode penuh mDNS diaktifkan (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` menimpa path CLI yang diiklankan (legacy: `OPENCLAW_CLI_PATH`).

## Dokumentasi terkait

- Kebijakan penemuan dan pemilihan transport: [Penemuan](/id/gateway/discovery)
- Pairing node + persetujuan: [Pairing Gateway](/id/gateway/pairing)
