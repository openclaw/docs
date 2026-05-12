---
read_when:
    - Mendiagnosis masalah penemuan Bonjour di macOS/iOS
    - Mengubah jenis layanan mDNS, catatan TXT, atau UX penemuan
summary: Penemuan Bonjour/mDNS + pemecahan masalah (suar Gateway, klien, dan mode kegagalan umum)
title: Penemuan Bonjour
x-i18n:
    generated_at: "2026-05-12T12:50:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05892ee8f0dc880f68f7cf024de9452b8d999ff1af3c7ca9850fb4f2d732af0c
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw dapat menggunakan Bonjour (mDNS / DNS-SD) untuk menemukan Gateway aktif (endpoint WebSocket).
Penelusuran multicast `local.` adalah **kemudahan khusus LAN**. Plugin `bonjour`
bawaan memiliki kepemilikan atas iklan LAN. Plugin ini mulai otomatis pada host macOS dan bersifat opsional pada
Linux, Windows, dan deployment Gateway terkontainerisasi. Untuk penemuan lintas jaringan, beacon yang sama
juga dapat dipublikasikan melalui domain DNS-SD area-luas yang dikonfigurasi. Penemuan
tetap bersifat best-effort dan **tidak** menggantikan konektivitas berbasis SSH atau Tailnet.

## Bonjour area-luas (Unicast DNS-SD) melalui Tailscale

Jika node dan gateway berada di jaringan berbeda, multicast mDNS tidak akan melewati
batas tersebut. Anda dapat mempertahankan UX penemuan yang sama dengan beralih ke **unicast DNS-SD**
("Wide-Area Bonjour") melalui Tailscale.

Langkah tingkat tinggi:

1. Jalankan server DNS pada host gateway (dapat dijangkau melalui Tailnet).
2. Publikasikan record DNS-SD untuk `_openclaw-gw._tcp` di bawah zona khusus
   (contoh: `openclaw.internal.`).
3. Konfigurasikan **split DNS** Tailscale agar domain pilihan Anda di-resolve melalui
   server DNS tersebut untuk klien (termasuk iOS).

OpenClaw mendukung domain penemuan apa pun; `openclaw.internal.` hanyalah contoh.
Node iOS/Android menelusuri `local.` dan domain area-luas yang Anda konfigurasi.

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
- menyajikan domain pilihan Anda (contoh: `openclaw.internal.`) dari `~/.openclaw/dns/<domain>.db`

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

Port WS Gateway (default `18789`) secara default terikat ke loopback. Untuk akses LAN/tailnet,
ikat secara eksplisit dan tetap aktifkan auth.

Untuk penyiapan khusus tailnet:

- Atur `gateway.bind: "tailnet"` di `~/.openclaw/openclaw.json`.
- Mulai ulang Gateway (atau mulai ulang aplikasi menubar macOS).

## Yang mengiklankan

Hanya Gateway yang mengiklankan `_openclaw-gw._tcp`. Iklan multicast LAN
disediakan oleh Plugin `bonjour` bawaan saat Plugin diaktifkan; publikasi
DNS-SD area-luas tetap dimiliki Gateway.

## Tipe layanan

- `_openclaw-gw._tcp` - beacon transport gateway (digunakan oleh node macOS/iOS/Android).

## Kunci TXT (petunjuk non-rahasia)

Gateway mengiklankan petunjuk kecil non-rahasia agar alur UI lebih mudah:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (hanya saat TLS diaktifkan)
- `gatewayTlsSha256=<sha256>` (hanya saat TLS diaktifkan dan fingerprint tersedia)
- `canvasPort=<port>` (hanya saat host canvas diaktifkan; saat ini sama dengan `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (hanya mode mDNS penuh, petunjuk opsional saat Tailnet tersedia)
- `sshPort=<port>` (hanya mode penuh; dihilangkan dalam mode minimal dan off)
- `cliPath=<path>` (hanya mode penuh; dihilangkan dalam mode minimal dan off)

Catatan keamanan:

- Record TXT Bonjour/mDNS **tidak diautentikasi**. Klien tidak boleh memperlakukan TXT sebagai routing otoritatif.
- Klien sebaiknya melakukan routing menggunakan endpoint layanan yang di-resolve (SRV + A/AAAA). Perlakukan `lanHost`, `tailnetDns`, `gatewayPort`, dan `gatewayTlsSha256` hanya sebagai petunjuk.
- Penargetan otomatis SSH juga sebaiknya menggunakan host layanan yang di-resolve, bukan petunjuk khusus TXT.
- TLS pinning tidak boleh pernah mengizinkan `gatewayTlsSha256` yang diiklankan untuk menimpa pin yang sebelumnya disimpan.
- Node iOS/Android sebaiknya memperlakukan koneksi langsung berbasis penemuan sebagai **hanya TLS** dan mewajibkan konfirmasi pengguna eksplisit sebelum memercayai fingerprint pertama kali.

## Debugging di macOS

Alat bawaan yang berguna:

- Telusuri instans:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Resolve satu instans (ganti `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Jika penelusuran berfungsi tetapi resolve gagal, Anda biasanya menghadapi kebijakan LAN atau
masalah resolver mDNS.

## Debugging di log Gateway

Gateway menulis file log bergulir (dicetak saat startup sebagai
`gateway log file: ...`). Cari baris `bonjour:`, terutama:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Watchdog memperlakukan `probing`, `announcing`, dan penggantian nama konflik yang baru
sebagai status yang sedang berlangsung. Jika layanan tidak pernah mencapai `announced`, OpenClaw pada akhirnya
membuat ulang advertiser dan, setelah kegagalan berulang, menonaktifkan Bonjour untuk
proses Gateway tersebut alih-alih terus mengiklankan ulang tanpa henti.

Bonjour menggunakan hostname sistem untuk host `.local` yang diiklankan saat hostname tersebut adalah
label DNS yang valid. Jika hostname sistem berisi spasi, garis bawah, atau karakter
label DNS lain yang tidak valid, OpenClaw fallback ke `openclaw.local`. Atur
`OPENCLAW_MDNS_HOSTNAME=<name>` sebelum memulai Gateway saat Anda membutuhkan
label host eksplisit.

## Debugging pada node iOS

Node iOS menggunakan `NWBrowser` untuk menemukan `_openclaw-gw._tcp`.

Untuk menangkap log:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → reproduksi → **Copy**

Log menyertakan transisi status browser dan perubahan set hasil.

## Kapan mengaktifkan Bonjour

Bonjour mulai otomatis untuk startup Gateway dengan konfigurasi kosong pada host macOS karena
aplikasi lokal dan node iOS/Android terdekat umumnya mengandalkan penemuan dalam LAN yang sama.

Aktifkan Bonjour secara eksplisit saat penemuan otomatis dalam LAN yang sama berguna pada Linux,
Windows, atau host non-macOS lain:

```bash
openclaw plugins enable bonjour
```

Saat diaktifkan, Bonjour menggunakan `discovery.mdns.mode` untuk menentukan seberapa banyak metadata TXT
yang dipublikasikan. Mode yang sama mengontrol petunjuk TXT opsional dalam record DNS-SD area-luas.
Mode default adalah `minimal`; gunakan `full` hanya saat klien membutuhkan petunjuk `cliPath` atau
`sshPort`. Gunakan `off` untuk menekan multicast LAN tanpa mengubah pengaktifan Plugin;
DNS-SD area-luas masih dapat memublikasikan beacon Gateway minimal saat
`discovery.wideArea.enabled` bernilai true.

## Kapan menonaktifkan Bonjour

Biarkan Bonjour dinonaktifkan saat iklan multicast LAN tidak diperlukan, tidak tersedia,
atau merugikan. Kasus umum adalah server non-macOS, jaringan bridge Docker,
WSL, atau kebijakan jaringan yang memblokir multicast mDNS. Di lingkungan tersebut,
Gateway masih dapat dijangkau melalui URL yang dipublikasikan, SSH, Tailnet, atau DNS-SD
area-luas, tetapi penemuan otomatis LAN tidak andal.

Pilih override lingkungan yang ada saat masalahnya terkait deployment:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Itu menonaktifkan iklan multicast LAN tanpa mengubah konfigurasi Plugin.
Ini aman untuk image Docker, file layanan, skrip launch, dan debugging sekali jalan
karena pengaturan tersebut hilang saat lingkungan hilang.

Gunakan konfigurasi Plugin saat Anda memang ingin mematikan Plugin penemuan LAN
bawaan untuk konfigurasi OpenClaw tersebut:

```bash
openclaw plugins disable bonjour
```

## Catatan penting Docker

Plugin Bonjour bawaan menonaktifkan otomatis iklan multicast LAN dalam container yang terdeteksi
saat `OPENCLAW_DISABLE_BONJOUR` tidak disetel. Jaringan bridge Docker
biasanya tidak meneruskan multicast mDNS (`224.0.0.251:5353`) antara container
dan LAN, sehingga iklan dari container jarang membuat penemuan berfungsi.

Catatan penting:

- Bonjour mulai otomatis pada host macOS dan bersifat opt-in di tempat lain. Membiarkannya
  dinonaktifkan tidak menghentikan Gateway; itu hanya melewati iklan multicast LAN.
- Menonaktifkan Bonjour tidak mengubah `gateway.bind`; Docker tetap default ke
  `OPENCLAW_GATEWAY_BIND=lan` agar port host yang dipublikasikan dapat berfungsi.
- Menonaktifkan Bonjour tidak menonaktifkan DNS-SD area-luas. Gunakan penemuan area-luas
  atau Tailnet saat Gateway dan node tidak berada di LAN yang sama.
- Menggunakan ulang `OPENCLAW_CONFIG_DIR` yang sama di luar Docker tidak mempertahankan
  kebijakan penonaktifan otomatis container.
- Atur `OPENCLAW_DISABLE_BONJOUR=0` hanya untuk host networking, macvlan, atau jaringan lain
  yang diketahui dapat melewatkan multicast mDNS; atur ke `1` untuk menonaktifkan paksa.

## Pemecahan masalah Bonjour yang dinonaktifkan

Jika sebuah node tidak lagi menemukan Gateway secara otomatis setelah penyiapan Docker:

1. Konfirmasi apakah Gateway berjalan dalam mode otomatis, dipaksa aktif, atau dipaksa nonaktif:

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
     DNS-SD area-luas

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
- **Advertiser macet dalam probing/announcing**: host dengan multicast yang diblokir,
  bridge container, WSL, atau perubahan antarmuka dapat membuat advertiser ciao berada dalam
  status non-announced. OpenClaw mencoba ulang beberapa kali lalu menonaktifkan Bonjour
  untuk proses Gateway saat ini alih-alih memulai ulang advertiser tanpa henti.
- **Jaringan bridge Docker**: Bonjour menonaktifkan otomatis dalam container yang terdeteksi.
  Atur `OPENCLAW_DISABLE_BONJOUR=0` hanya untuk host, macvlan, atau jaringan lain
  yang mendukung mDNS.
- **Sleep / perubahan antarmuka**: macOS dapat sementara kehilangan hasil mDNS; coba lagi.
- **Penelusuran berfungsi tetapi resolve gagal**: jaga nama mesin tetap sederhana (hindari emoji atau
  tanda baca), lalu mulai ulang Gateway. Nama instans layanan diturunkan dari
  nama host, sehingga nama yang terlalu kompleks dapat membingungkan sebagian resolver.

## Nama instans yang di-escape (`\032`)

Bonjour/DNS-SD sering meng-escape byte dalam nama instans layanan sebagai urutan desimal `\DDD`
(misalnya spasi menjadi `\032`).

- Ini normal pada level protokol.
- UI sebaiknya mendekode untuk tampilan (iOS menggunakan `BonjourEscapes.decode`).

## Mengaktifkan / menonaktifkan / konfigurasi

- Host macOS memulai otomatis plugin penemuan LAN bawaan secara default.
- `openclaw plugins enable bonjour` mengaktifkan plugin penemuan LAN bawaan pada host yang tidak mengaktifkannya secara default.
- `openclaw plugins disable bonjour` menonaktifkan pengiklanan multicast LAN dengan menonaktifkan plugin bawaan.
- `OPENCLAW_DISABLE_BONJOUR=1` menonaktifkan pengiklanan multicast LAN tanpa mengubah konfigurasi plugin; nilai truthy yang diterima adalah `1`, `true`, `yes`, dan `on` (lama: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` memaksa pengiklanan multicast LAN aktif, termasuk di dalam kontainer yang terdeteksi; nilai falsy yang diterima adalah `0`, `false`, `no`, dan `off`.
- Saat Plugin Bonjour diaktifkan dan `OPENCLAW_DISABLE_BONJOUR` tidak disetel, Bonjour mengiklankan pada host normal dan menonaktifkan diri secara otomatis di dalam kontainer yang terdeteksi.
- `gateway.bind` di `~/.openclaw/openclaw.json` mengontrol mode bind Gateway.
- `OPENCLAW_SSH_PORT` mengganti port SSH saat `sshPort` diiklankan (lama: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` menerbitkan petunjuk MagicDNS di TXT saat mode penuh mDNS diaktifkan (lama: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` mengganti path CLI yang diiklankan (lama: `OPENCLAW_CLI_PATH`).

## Dokumen terkait

- Kebijakan penemuan dan pemilihan transport: [Penemuan](/id/gateway/discovery)
- Penyandingan Node + persetujuan: [Penyandingan Gateway](/id/gateway/pairing)
