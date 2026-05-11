---
read_when:
    - Memecahkan masalah penemuan Bonjour di macOS/iOS
    - Mengubah jenis layanan mDNS, rekaman TXT, atau UX penemuan
summary: Penemuan Bonjour/mDNS + pemecahan masalah (beacon Gateway, klien, dan mode kegagalan umum)
title: Penemuan Bonjour
x-i18n:
    generated_at: "2026-05-11T20:28:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03bd9403591a389c06d3131e4c110d4ccf711eee56cbe9a5c9baed2b6df8fb80
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw dapat menggunakan Bonjour (mDNS / DNS-SD) untuk menemukan Gateway aktif (endpoint WebSocket).
Penelusuran multicast `local.` adalah **kemudahan khusus LAN**. Plugin `bonjour`
bawaan memiliki iklan LAN. Ini dimulai otomatis pada host macOS dan bersifat ikut serta pada
Linux, Windows, dan deployment Gateway dalam kontainer. Untuk penemuan lintas jaringan, beacon yang sama
juga dapat dipublikasikan melalui domain DNS-SD wide-area yang dikonfigurasi. Penemuan
tetap bersifat upaya terbaik dan **tidak** menggantikan konektivitas berbasis SSH atau Tailnet.

## Bonjour wide-area (DNS-SD Unicast) melalui Tailscale

Jika node dan gateway berada di jaringan berbeda, multicast mDNS tidak akan melewati
batas tersebut. Anda dapat mempertahankan UX penemuan yang sama dengan beralih ke **DNS-SD unicast**
("Wide-Area Bonjour") melalui Tailscale.

Langkah tingkat tinggi:

1. Jalankan server DNS pada host gateway (dapat dijangkau melalui Tailnet).
2. Publikasikan catatan DNS-SD untuk `_openclaw-gw._tcp` di bawah zona khusus
   (contoh: `openclaw.internal.`).
3. Konfigurasikan **split DNS** Tailscale agar domain pilihan Anda diselesaikan melalui
   server DNS tersebut untuk klien (termasuk iOS).

OpenClaw mendukung domain penemuan apa pun; `openclaw.internal.` hanyalah contoh.
Node iOS/Android menelusuri `local.` dan domain wide-area yang Anda konfigurasi.

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

- mendengarkan pada port 53 hanya pada antarmuka Tailscale milik gateway
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

Setelah klien menerima DNS tailnet, node iOS dan penemuan CLI dapat menelusuri
`_openclaw-gw._tcp` di domain penemuan Anda tanpa multicast.

### Keamanan listener Gateway (direkomendasikan)

Port WS Gateway (default `18789`) terikat ke loopback secara default. Untuk akses LAN/tailnet,
ikat secara eksplisit dan biarkan autentikasi aktif.

Untuk penyiapan khusus tailnet:

- Tetapkan `gateway.bind: "tailnet"` di `~/.openclaw/openclaw.json`.
- Mulai ulang Gateway (atau mulai ulang aplikasi menubar macOS).

## Apa yang beriklan

Hanya Gateway yang mengiklankan `_openclaw-gw._tcp`. Iklan multicast LAN
disediakan oleh Plugin `bonjour` bawaan saat Plugin diaktifkan; publikasi
DNS-SD wide-area tetap dimiliki Gateway.

## Jenis layanan

- `_openclaw-gw._tcp` - beacon transport gateway (digunakan oleh node macOS/iOS/Android).

## Kunci TXT (petunjuk non-rahasia)

Gateway mengiklankan petunjuk kecil non-rahasia agar alur UI praktis:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (hanya saat TLS diaktifkan)
- `gatewayTlsSha256=<sha256>` (hanya saat TLS diaktifkan dan fingerprint tersedia)
- `canvasPort=<port>` (hanya saat host canvas diaktifkan; saat ini sama dengan `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (hanya mode penuh mDNS, petunjuk opsional saat Tailnet tersedia)
- `sshPort=<port>` (hanya mode penuh mDNS; DNS-SD wide-area dapat menghilangkannya)
- `cliPath=<path>` (hanya mode penuh mDNS; DNS-SD wide-area tetap menuliskannya sebagai petunjuk instalasi jarak jauh)

Catatan keamanan:

- Catatan TXT Bonjour/mDNS **tidak diautentikasi**. Klien tidak boleh memperlakukan TXT sebagai routing otoritatif.
- Klien harus merutekan menggunakan endpoint layanan yang diselesaikan (SRV + A/AAAA). Perlakukan `lanHost`, `tailnetDns`, `gatewayPort`, dan `gatewayTlsSha256` hanya sebagai petunjuk.
- Penargetan otomatis SSH juga harus menggunakan host layanan yang diselesaikan, bukan petunjuk khusus TXT.
- TLS pinning tidak boleh pernah mengizinkan `gatewayTlsSha256` yang diiklankan untuk menimpa pin yang disimpan sebelumnya.
- Node iOS/Android harus memperlakukan koneksi langsung berbasis penemuan sebagai **hanya TLS** dan mewajibkan konfirmasi pengguna eksplisit sebelum memercayai fingerprint pertama kali.

## Debugging di macOS

Alat bawaan yang berguna:

- Telusuri instance:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Selesaikan satu instance (ganti `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Jika penelusuran berfungsi tetapi penyelesaian gagal, biasanya Anda mengalami kebijakan LAN atau
masalah resolver mDNS.

## Debugging di log Gateway

Gateway menulis file log bergulir (dicetak saat startup sebagai
`gateway log file: ...`). Cari baris `bonjour:`, terutama:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Watchdog memperlakukan `probing`, `announcing`, dan penggantian nama konflik yang baru sebagai
status sedang berlangsung. Jika layanan tidak pernah mencapai `announced`, OpenClaw pada akhirnya
membuat ulang pengiklan dan, setelah kegagalan berulang, menonaktifkan Bonjour untuk proses
Gateway tersebut alih-alih terus mengiklankan ulang selamanya.

Bonjour menggunakan nama host sistem untuk host `.local` yang diiklankan saat itu adalah
label DNS yang valid. Jika nama host sistem berisi spasi, garis bawah, atau karakter
label DNS tidak valid lainnya, OpenClaw beralih ke `openclaw.local`. Tetapkan
`OPENCLAW_MDNS_HOSTNAME=<name>` sebelum memulai Gateway saat Anda membutuhkan
label host eksplisit.

## Debugging pada node iOS

Node iOS menggunakan `NWBrowser` untuk menemukan `_openclaw-gw._tcp`.

Untuk menangkap log:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → reproduksi → **Copy**

Log mencakup transisi status browser dan perubahan set hasil.

## Kapan mengaktifkan Bonjour

Bonjour dimulai otomatis untuk startup Gateway dengan konfigurasi kosong pada host macOS karena
aplikasi lokal dan node iOS/Android di sekitar umumnya bergantung pada penemuan LAN yang sama.

Aktifkan Bonjour secara eksplisit saat penemuan otomatis LAN yang sama berguna pada Linux,
Windows, atau host non-macOS lainnya:

```bash
openclaw plugins enable bonjour
```

Saat diaktifkan, Bonjour menggunakan `discovery.mdns.mode` untuk menentukan seberapa banyak metadata TXT
yang dipublikasikan. Mode default adalah `minimal`; gunakan `full` hanya saat klien lokal membutuhkan
petunjuk `cliPath` atau `sshPort`, dan gunakan `off` untuk menekan multicast LAN tanpa
mengubah pengaktifan Plugin.

## Kapan menonaktifkan Bonjour

Biarkan Bonjour dinonaktifkan saat iklan multicast LAN tidak diperlukan, tidak tersedia,
atau merugikan. Kasus umum adalah server non-macOS, jaringan bridge Docker,
WSL, atau kebijakan jaringan yang menjatuhkan multicast mDNS. Di lingkungan tersebut,
Gateway tetap dapat dijangkau melalui URL yang dipublikasikan, SSH, Tailnet, atau
DNS-SD wide-area, tetapi penemuan otomatis LAN tidak andal.

Utamakan override lingkungan yang ada saat masalahnya terkait deployment:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Itu menonaktifkan iklan multicast LAN tanpa mengubah konfigurasi Plugin.
Ini aman untuk image Docker, file layanan, skrip peluncuran, dan debugging sekali jalan
karena pengaturan menghilang saat lingkungannya hilang.

Gunakan konfigurasi Plugin saat Anda sengaja ingin mematikan Plugin penemuan LAN
bawaan untuk konfigurasi OpenClaw tersebut:

```bash
openclaw plugins disable bonjour
```

## Hal yang perlu diwaspadai pada Docker

Plugin Bonjour bawaan otomatis menonaktifkan iklan multicast LAN dalam kontainer yang terdeteksi
saat `OPENCLAW_DISABLE_BONJOUR` tidak disetel. Jaringan bridge Docker
biasanya tidak meneruskan multicast mDNS (`224.0.0.251:5353`) antara kontainer
dan LAN, sehingga iklan dari kontainer jarang membuat penemuan berfungsi.

Hal penting yang perlu diwaspadai:

- Bonjour dimulai otomatis pada host macOS dan bersifat ikut serta di tempat lain. Membiarkannya
  dinonaktifkan tidak menghentikan Gateway; ini hanya melewati iklan multicast LAN.
- Menonaktifkan Bonjour tidak mengubah `gateway.bind`; Docker tetap default ke
  `OPENCLAW_GATEWAY_BIND=lan` agar port host yang dipublikasikan dapat berfungsi.
- Menonaktifkan Bonjour tidak menonaktifkan DNS-SD wide-area. Gunakan penemuan wide-area
  atau Tailnet saat Gateway dan node tidak berada pada LAN yang sama.
- Menggunakan ulang `OPENCLAW_CONFIG_DIR` yang sama di luar Docker tidak mempertahankan
  kebijakan auto-disable kontainer.
- Tetapkan `OPENCLAW_DISABLE_BONJOUR=0` hanya untuk host networking, macvlan, atau jaringan lain
  yang diketahui meneruskan multicast mDNS; tetapkan ke `1` untuk memaksa penonaktifan.

## Memecahkan masalah Bonjour yang dinonaktifkan

Jika node tidak lagi menemukan Gateway secara otomatis setelah penyiapan Docker:

1. Konfirmasi apakah Gateway berjalan dalam mode otomatis, paksa aktif, atau paksa nonaktif:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Konfirmasi Gateway itu sendiri dapat dijangkau melalui port yang dipublikasikan:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Gunakan target langsung saat Bonjour dinonaktifkan:
   - UI kontrol atau alat lokal: `http://127.0.0.1:18789`
   - Klien LAN: `http://<gateway-host>:18789`
   - Klien lintas jaringan: Tailnet MagicDNS, IP Tailnet, tunnel SSH, atau
     DNS-SD wide-area

4. Jika Anda sengaja mengaktifkan Plugin Bonjour di Docker dan memaksa iklan
   dengan `OPENCLAW_DISABLE_BONJOUR=0`, uji multicast dari host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Jika penelusuran kosong atau log Gateway menunjukkan pembatalan watchdog ciao
   berulang, pulihkan `OPENCLAW_DISABLE_BONJOUR=1` dan gunakan rute langsung atau
   Tailnet.

## Mode kegagalan umum

- **Bonjour tidak melewati jaringan**: gunakan Tailnet atau SSH.
- **Multicast diblokir**: beberapa jaringan Wi-Fi menonaktifkan mDNS.
- **Pengiklan macet di probing/announcing**: host dengan multicast yang diblokir,
  bridge kontainer, WSL, atau perubahan antarmuka dapat meninggalkan pengiklan ciao dalam
  status belum diumumkan. OpenClaw mencoba ulang beberapa kali lalu menonaktifkan Bonjour
  untuk proses Gateway saat ini alih-alih memulai ulang pengiklan selamanya.
- **Jaringan bridge Docker**: Bonjour otomatis dinonaktifkan dalam kontainer yang terdeteksi.
  Tetapkan `OPENCLAW_DISABLE_BONJOUR=0` hanya untuk host, macvlan, atau jaringan lain
  yang mendukung mDNS.
- **Sleep / perubahan antarmuka**: macOS dapat sementara menghilangkan hasil mDNS; coba ulang.
- **Penelusuran berfungsi tetapi penyelesaian gagal**: pertahankan nama mesin tetap sederhana (hindari emoji atau
  tanda baca), lalu mulai ulang Gateway. Nama instance layanan berasal dari
  nama host, sehingga nama yang terlalu kompleks dapat membingungkan beberapa resolver.

## Nama instance yang di-escape (`\032`)

Bonjour/DNS-SD sering meng-escape byte dalam nama instance layanan sebagai urutan desimal `\DDD`
(misalnya spasi menjadi `\032`).

- Ini normal pada tingkat protokol.
- UI harus mendekode untuk tampilan (iOS menggunakan `BonjourEscapes.decode`).

## Mengaktifkan / menonaktifkan / konfigurasi

- Host macOS memulai otomatis Plugin penemuan LAN bawaan secara default.
- `openclaw plugins enable bonjour` mengaktifkan Plugin penemuan LAN bawaan pada host yang tidak diaktifkan secara default.
- `openclaw plugins disable bonjour` menonaktifkan iklan multicast LAN dengan menonaktifkan Plugin bawaan.
- `OPENCLAW_DISABLE_BONJOUR=1` menonaktifkan iklan multicast LAN tanpa mengubah konfigurasi Plugin; nilai truthy yang diterima adalah `1`, `true`, `yes`, dan `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` memaksa iklan multicast LAN aktif, termasuk di dalam kontainer yang terdeteksi; nilai falsy yang diterima adalah `0`, `false`, `no`, dan `off`.
- Saat Plugin Bonjour diaktifkan dan `OPENCLAW_DISABLE_BONJOUR` tidak disetel, Bonjour beriklan pada host normal dan otomatis dinonaktifkan di dalam kontainer yang terdeteksi.
- `gateway.bind` di `~/.openclaw/openclaw.json` mengontrol mode bind Gateway.
- `OPENCLAW_SSH_PORT` menimpa port SSH saat `sshPort` diiklankan (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` menerbitkan petunjuk MagicDNS di TXT saat mode penuh mDNS diaktifkan (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` menimpa path CLI yang diiklankan (legacy: `OPENCLAW_CLI_PATH`).

## Dokumentasi terkait

- Kebijakan penemuan dan pemilihan transport: [Penemuan](/id/gateway/discovery)
- Pemasangan Node + persetujuan: [Pemasangan Gateway](/id/gateway/pairing)
