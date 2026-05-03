---
read_when:
    - Men-debug masalah penemuan Bonjour di macOS/iOS
    - Mengubah jenis layanan mDNS, rekaman TXT, atau UX penemuan
summary: Penemuan Bonjour/mDNS + pemecahan masalah (suar Gateway, klien, dan mode kegagalan umum)
title: Penemuan Bonjour
x-i18n:
    generated_at: "2026-05-03T21:30:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2975fea03bc8fe8ccbd57f7a4ca8c15a59fb21b3f92c2b77b9a57ae4ebd5d374
    source_path: gateway/bonjour.md
    workflow: 16
---

# Penemuan Bonjour / mDNS

OpenClaw dapat menggunakan Bonjour (mDNS / DNS-SD) untuk menemukan Gateway aktif (endpoint WebSocket).
Penelusuran multicast `local.` adalah **kemudahan khusus LAN**. Plugin `bonjour`
bawaan memiliki iklan LAN. Plugin ini dimulai otomatis di host macOS dan bersifat ikut-serta di
Linux, Windows, dan deployment Gateway berbasis kontainer. Untuk penemuan lintas jaringan, beacon yang sama
juga dapat dipublikasikan melalui domain DNS-SD area luas yang dikonfigurasi. Penemuan
tetap bersifat upaya terbaik dan **tidak** menggantikan konektivitas berbasis SSH atau Tailnet.

## Bonjour area luas (Unicast DNS-SD) melalui Tailscale

Jika node dan gateway berada di jaringan berbeda, multicast mDNS tidak akan melewati
batasnya. Anda dapat mempertahankan UX penemuan yang sama dengan beralih ke **unicast DNS‑SD**
("Bonjour Area Luas") melalui Tailscale.

Langkah tingkat tinggi:

1. Jalankan server DNS di host gateway (dapat dijangkau melalui Tailnet).
2. Publikasikan catatan DNS‑SD untuk `_openclaw-gw._tcp` di bawah zona khusus
   (contoh: `openclaw.internal.`).
3. Konfigurasikan **split DNS** Tailscale agar domain pilihan Anda diselesaikan melalui
   server DNS tersebut untuk klien (termasuk iOS).

OpenClaw mendukung domain penemuan apa pun; `openclaw.internal.` hanya contoh.
Node iOS/Android menelusuri `local.` dan domain area luas yang Anda konfigurasi.

### Konfigurasi Gateway (direkomendasikan)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### Penyiapan server DNS sekali saja (host gateway)

```bash
openclaw dns setup --apply
```

Ini memasang CoreDNS dan mengonfigurasinya untuk:

- mendengarkan di port 53 hanya pada antarmuka Tailscale milik gateway
- melayani domain pilihan Anda (contoh: `openclaw.internal.`) dari `~/.openclaw/dns/<domain>.db`

Validasi dari mesin yang terhubung ke tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Pengaturan DNS Tailscale

Di konsol admin Tailscale:

- Tambahkan nameserver yang mengarah ke IP tailnet gateway (UDP/TCP 53).
- Tambahkan split DNS agar domain penemuan Anda menggunakan nameserver tersebut.

Setelah klien menerima DNS tailnet, node iOS dan penemuan CLI dapat menelusuri
`_openclaw-gw._tcp` di domain penemuan Anda tanpa multicast.

### Keamanan listener Gateway (direkomendasikan)

Port WS Gateway (default `18789`) secara default mengikat ke loopback. Untuk akses LAN/tailnet,
ikat secara eksplisit dan tetap aktifkan autentikasi.

Untuk penyiapan khusus tailnet:

- Tetapkan `gateway.bind: "tailnet"` di `~/.openclaw/openclaw.json`.
- Mulai ulang Gateway (atau mulai ulang aplikasi menubar macOS).

## Yang mengiklankan

Hanya Gateway yang mengiklankan `_openclaw-gw._tcp`. Iklan multicast LAN
disediakan oleh Plugin `bonjour` bawaan saat Plugin diaktifkan; publikasi
DNS-SD area luas tetap dimiliki Gateway.

## Tipe layanan

- `_openclaw-gw._tcp` — beacon transport gateway (digunakan oleh node macOS/iOS/Android).

## Kunci TXT (petunjuk non-rahasia)

Gateway mengiklankan petunjuk non-rahasia kecil agar alur UI lebih nyaman:

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

- Catatan TXT Bonjour/mDNS **tidak diautentikasi**. Klien tidak boleh memperlakukan TXT sebagai routing otoritatif.
- Klien sebaiknya merutekan menggunakan endpoint layanan yang diselesaikan (SRV + A/AAAA). Perlakukan `lanHost`, `tailnetDns`, `gatewayPort`, dan `gatewayTlsSha256` hanya sebagai petunjuk.
- Penargetan otomatis SSH juga sebaiknya menggunakan host layanan yang diselesaikan, bukan petunjuk hanya TXT.
- Penyematan TLS tidak boleh pernah mengizinkan `gatewayTlsSha256` yang diiklankan menimpa pin yang sebelumnya tersimpan.
- Node iOS/Android sebaiknya memperlakukan koneksi langsung berbasis penemuan sebagai **hanya TLS** dan mewajibkan konfirmasi pengguna eksplisit sebelum mempercayai fingerprint pertama kali.

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

Jika penelusuran berhasil tetapi penyelesaian gagal, biasanya Anda terkena kebijakan LAN atau
masalah resolver mDNS.

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
label DNS tidak valid lainnya, OpenClaw fallback ke `openclaw.local`. Tetapkan
`OPENCLAW_MDNS_HOSTNAME=<name>` sebelum memulai Gateway saat Anda memerlukan
label host eksplisit.

## Debugging pada node iOS

Node iOS menggunakan `NWBrowser` untuk menemukan `_openclaw-gw._tcp`.

Untuk menangkap log:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → reproduksi → **Copy**

Log mencakup transisi status browser dan perubahan kumpulan hasil.

## Kapan mengaktifkan Bonjour

Bonjour dimulai otomatis untuk startup Gateway konfigurasi kosong di host macOS karena
aplikasi lokal dan node iOS/Android terdekat umumnya mengandalkan penemuan LAN yang sama.

Aktifkan Bonjour secara eksplisit saat penemuan otomatis LAN yang sama berguna di Linux,
Windows, atau host non-macOS lain:

```bash
openclaw plugins enable bonjour
```

Saat diaktifkan, Bonjour menggunakan `discovery.mdns.mode` untuk menentukan seberapa banyak metadata TXT
yang dipublikasikan. Mode default adalah `minimal`; gunakan `full` hanya saat klien lokal memerlukan
petunjuk `cliPath` atau `sshPort`, dan gunakan `off` untuk menekan multicast LAN tanpa
mengubah pengaktifan Plugin.

## Kapan menonaktifkan Bonjour

Biarkan Bonjour nonaktif saat iklan multicast LAN tidak diperlukan, tidak tersedia,
atau merugikan. Kasus umum adalah server non-macOS, jaringan bridge Docker,
WSL, atau kebijakan jaringan yang menjatuhkan multicast mDNS. Di lingkungan tersebut,
Gateway tetap dapat dijangkau melalui URL yang dipublikasikan, SSH, Tailnet, atau
DNS-SD area luas, tetapi penemuan otomatis LAN tidak andal.

Utamakan override lingkungan yang ada saat masalahnya bersifat deployment-scoped:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Itu menonaktifkan iklan multicast LAN tanpa mengubah konfigurasi Plugin.
Aman untuk image Docker, file layanan, skrip peluncuran, dan debugging sekali pakai
karena pengaturan tersebut hilang saat lingkungannya hilang.

Gunakan konfigurasi Plugin saat Anda sengaja ingin mematikan Plugin penemuan LAN
bawaan untuk konfigurasi OpenClaw tersebut:

```bash
openclaw plugins disable bonjour
```

## Catatan penting Docker

Plugin Bonjour bawaan menonaktifkan otomatis iklan multicast LAN di kontainer yang terdeteksi
saat `OPENCLAW_DISABLE_BONJOUR` belum ditetapkan. Jaringan bridge Docker
biasanya tidak meneruskan multicast mDNS (`224.0.0.251:5353`) antara kontainer
dan LAN, sehingga iklan dari kontainer jarang membuat penemuan berhasil.

Catatan penting:

- Bonjour dimulai otomatis di host macOS dan bersifat ikut-serta di tempat lain. Membiarkannya
  nonaktif tidak menghentikan Gateway; ini hanya melewati iklan multicast LAN.
- Menonaktifkan Bonjour tidak mengubah `gateway.bind`; Docker tetap default ke
  `OPENCLAW_GATEWAY_BIND=lan` agar port host yang dipublikasikan dapat bekerja.
- Menonaktifkan Bonjour tidak menonaktifkan DNS-SD area luas. Gunakan penemuan area luas
  atau Tailnet saat Gateway dan node tidak berada di LAN yang sama.
- Menggunakan ulang `OPENCLAW_CONFIG_DIR` yang sama di luar Docker tidak mempertahankan
  kebijakan nonaktif otomatis kontainer.
- Tetapkan `OPENCLAW_DISABLE_BONJOUR=0` hanya untuk jaringan host, macvlan, atau jaringan lain
  yang diketahui melewatkan multicast mDNS; tetapkan ke `1` untuk memaksa nonaktif.

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
   - Control UI atau alat lokal: `http://127.0.0.1:18789`
   - Klien LAN: `http://<gateway-host>:18789`
   - Klien lintas jaringan: Tailnet MagicDNS, IP Tailnet, tunnel SSH, atau
     DNS-SD area luas

4. Jika Anda sengaja mengaktifkan Plugin Bonjour di Docker dan memaksa iklan
   dengan `OPENCLAW_DISABLE_BONJOUR=0`, uji multicast dari host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Jika penelusuran kosong atau log Gateway menampilkan pembatalan watchdog ciao
   berulang, pulihkan `OPENCLAW_DISABLE_BONJOUR=1` dan gunakan rute langsung atau
   Tailnet.

## Mode kegagalan umum

- **Bonjour tidak melewati jaringan**: gunakan Tailnet atau SSH.
- **Multicast diblokir**: beberapa jaringan Wi‑Fi menonaktifkan mDNS.
- **Advertiser macet dalam probing/announcing**: host dengan multicast terblokir,
  bridge kontainer, WSL, atau perubahan antarmuka dapat meninggalkan advertiser ciao dalam
  status belum diumumkan. OpenClaw mencoba ulang beberapa kali lalu menonaktifkan Bonjour
  untuk proses Gateway saat ini alih-alih memulai ulang advertiser tanpa henti.
- **Jaringan bridge Docker**: Bonjour menonaktifkan otomatis di kontainer yang terdeteksi.
  Tetapkan `OPENCLAW_DISABLE_BONJOUR=0` hanya untuk host, macvlan, atau jaringan lain
  yang mampu mDNS.
- **Sleep / perubahan antarmuka**: macOS dapat sementara menjatuhkan hasil mDNS; coba lagi.
- **Penelusuran berhasil tetapi resolve gagal**: jaga nama mesin tetap sederhana (hindari emoji atau
  tanda baca), lalu mulai ulang Gateway. Nama instance layanan berasal dari
  nama host, sehingga nama yang terlalu kompleks dapat membingungkan beberapa resolver.

## Nama instance yang di-escape (`\032`)

Bonjour/DNS‑SD sering meng-escape byte dalam nama instance layanan sebagai urutan
desimal `\DDD` (misalnya spasi menjadi `\032`).

- Ini normal di tingkat protokol.
- UI sebaiknya mendekode untuk tampilan (iOS menggunakan `BonjourEscapes.decode`).

## Mengaktifkan / menonaktifkan / konfigurasi

- Host macOS memulai otomatis Plugin penemuan LAN bawaan secara default.
- `openclaw plugins enable bonjour` mengaktifkan Plugin penemuan LAN bawaan di host tempat Plugin tersebut tidak diaktifkan secara default.
- `openclaw plugins disable bonjour` menonaktifkan iklan multicast LAN dengan menonaktifkan Plugin bawaan.
- `OPENCLAW_DISABLE_BONJOUR=1` menonaktifkan iklan multicast LAN tanpa mengubah konfigurasi Plugin; nilai truthy yang diterima adalah `1`, `true`, `yes`, dan `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` memaksa iklan multicast LAN aktif, termasuk di dalam kontainer yang terdeteksi; nilai falsy yang diterima adalah `0`, `false`, `no`, dan `off`.
- Saat Plugin Bonjour diaktifkan dan `OPENCLAW_DISABLE_BONJOUR` belum ditetapkan, Bonjour beriklan di host normal dan menonaktifkan otomatis di dalam kontainer yang terdeteksi.
- `gateway.bind` di `~/.openclaw/openclaw.json` mengontrol mode bind Gateway.
- `OPENCLAW_SSH_PORT` mengganti port SSH saat `sshPort` diiklankan (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` memublikasikan petunjuk MagicDNS di TXT saat mode penuh mDNS diaktifkan (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` mengganti path CLI yang diiklankan (legacy: `OPENCLAW_CLI_PATH`).

## Dokumen terkait

- Kebijakan penemuan dan pemilihan transport: [Discovery](/id/gateway/discovery)
- Pemasangan node + persetujuan: [Gateway pairing](/id/gateway/pairing)
