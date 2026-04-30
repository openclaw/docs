---
read_when:
    - Men-debug masalah penemuan Bonjour di macOS/iOS
    - Mengubah jenis layanan mDNS, rekaman TXT, atau UX penemuan
summary: Penemuan + penelusuran masalah Bonjour/mDNS (suar Gateway, klien, dan mode kegagalan umum)
title: Penemuan Bonjour
x-i18n:
    generated_at: "2026-04-30T09:46:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0720451843aae0509949324e51f3a23dc69e366e68de851c595ce76c8ab0eec9
    source_path: gateway/bonjour.md
    workflow: 16
---

# Bonjour / penemuan mDNS

OpenClaw menggunakan Bonjour (mDNS / DNS‑SD) untuk menemukan Gateway aktif (endpoint WebSocket).
Penjelajahan multicast `local.` adalah **kemudahan khusus LAN**. Plugin `bonjour`
bawaan mengelola periklanan LAN dan diaktifkan secara default. Untuk penemuan lintas jaringan,
beacon yang sama juga dapat dipublikasikan melalui domain DNS-SD area luas yang dikonfigurasi.
Penemuan tetap bersifat upaya terbaik dan **tidak** menggantikan konektivitas berbasis SSH atau Tailnet.

## Bonjour area luas (Unicast DNS-SD) melalui Tailscale

Jika node dan gateway berada di jaringan berbeda, multicast mDNS tidak akan melewati
batas tersebut. Anda dapat mempertahankan UX penemuan yang sama dengan beralih ke **unicast DNS‑SD**
("Bonjour Area Luas") melalui Tailscale.

Langkah tingkat tinggi:

1. Jalankan server DNS pada host gateway (dapat dijangkau melalui Tailnet).
2. Publikasikan record DNS‑SD untuk `_openclaw-gw._tcp` di bawah zona khusus
   (contoh: `openclaw.internal.`).
3. Konfigurasikan **split DNS** Tailscale agar domain pilihan Anda di-resolve melalui
   server DNS tersebut untuk klien (termasuk iOS).

OpenClaw mendukung domain penemuan apa pun; `openclaw.internal.` hanyalah contoh.
Node iOS/Android menjelajahi `local.` dan domain area luas yang Anda konfigurasi.

### Konfigurasi Gateway (disarankan)

```json5
{
  gateway: { bind: "tailnet" }, // hanya tailnet (disarankan)
  discovery: { wideArea: { enabled: true } }, // mengaktifkan publikasi DNS-SD area luas
}
```

### Penyiapan server DNS satu kali (host gateway)

```bash
openclaw dns setup --apply
```

Ini menginstal CoreDNS dan mengonfigurasinya untuk:

- mendengarkan pada port 53 hanya pada antarmuka Tailscale milik gateway
- melayani domain pilihan Anda (contoh: `openclaw.internal.`) dari `~/.openclaw/dns/<domain>.db`

Validasi dari mesin yang tersambung ke tailnet:

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

### Keamanan listener Gateway (disarankan)

Port WS Gateway (default `18789`) terikat ke loopback secara default. Untuk akses
LAN/tailnet, ikat secara eksplisit dan tetap aktifkan auth.

Untuk penyiapan khusus tailnet:

- Atur `gateway.bind: "tailnet"` di `~/.openclaw/openclaw.json`.
- Mulai ulang Gateway (atau mulai ulang aplikasi menubar macOS).

## Apa yang beriklan

Hanya Gateway yang mengiklankan `_openclaw-gw._tcp`. Periklanan multicast LAN
disediakan oleh Plugin `bonjour` bawaan; publikasi DNS-SD area luas tetap
dimiliki Gateway.

## Jenis layanan

- `_openclaw-gw._tcp` — beacon transport gateway (digunakan oleh node macOS/iOS/Android).

## Kunci TXT (petunjuk non-rahasia)

Gateway mengiklankan petunjuk kecil non-rahasia untuk memudahkan alur UI:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (hanya ketika TLS diaktifkan)
- `gatewayTlsSha256=<sha256>` (hanya ketika TLS diaktifkan dan sidik jari tersedia)
- `canvasPort=<port>` (hanya ketika host canvas diaktifkan; saat ini sama dengan `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (hanya mode penuh mDNS, petunjuk opsional ketika Tailnet tersedia)
- `sshPort=<port>` (hanya mode penuh mDNS; DNS-SD area luas dapat menghilangkannya)
- `cliPath=<path>` (hanya mode penuh mDNS; DNS-SD area luas tetap menuliskannya sebagai petunjuk instalasi jarak jauh)

Catatan keamanan:

- Record TXT Bonjour/mDNS **tidak diautentikasi**. Klien tidak boleh menganggap TXT sebagai routing otoritatif.
- Klien harus melakukan routing menggunakan endpoint layanan yang di-resolve (SRV + A/AAAA). Perlakukan `lanHost`, `tailnetDns`, `gatewayPort`, dan `gatewayTlsSha256` hanya sebagai petunjuk.
- Penargetan otomatis SSH juga harus menggunakan host layanan yang di-resolve, bukan petunjuk khusus TXT.
- Pinning TLS tidak boleh pernah mengizinkan `gatewayTlsSha256` yang diiklankan menggantikan pin yang sebelumnya disimpan.
- Node iOS/Android harus memperlakukan koneksi langsung berbasis penemuan sebagai **hanya TLS** dan mewajibkan konfirmasi pengguna eksplisit sebelum memercayai sidik jari pertama kali.

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

Jika penjelajahan berfungsi tetapi resolve gagal, biasanya Anda terkena kebijakan LAN atau
masalah resolver mDNS.

## Debugging di log Gateway

Gateway menulis file log bergilir (dicetak saat startup sebagai
`gateway log file: ...`). Cari baris `bonjour:`, terutama:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour menggunakan hostname sistem untuk host `.local` yang diiklankan ketika itu merupakan
label DNS yang valid. Jika hostname sistem berisi spasi, garis bawah, atau karakter
label DNS tidak valid lainnya, OpenClaw akan fallback ke `openclaw.local`. Atur
`OPENCLAW_MDNS_HOSTNAME=<name>` sebelum memulai Gateway ketika Anda membutuhkan
label host eksplisit.

## Debugging pada node iOS

Node iOS menggunakan `NWBrowser` untuk menemukan `_openclaw-gw._tcp`.

Untuk menangkap log:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → reproduksi → **Copy**

Log mencakup transisi status browser dan perubahan set hasil.

## Kapan menonaktifkan Bonjour

Nonaktifkan Bonjour hanya ketika periklanan multicast LAN tidak tersedia atau merugikan.
Kasus umum adalah Gateway yang berjalan di balik jaringan bridge Docker, WSL, atau
kebijakan jaringan yang menjatuhkan multicast mDNS. Di lingkungan tersebut Gateway
tetap dapat dijangkau melalui URL yang dipublikasikan, SSH, Tailnet, atau DNS-SD area luas,
tetapi penemuan otomatis LAN tidak andal.

Utamakan override environment yang ada ketika masalahnya terkait lingkup deployment:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Itu menonaktifkan periklanan multicast LAN tanpa mengubah konfigurasi Plugin.
Ini aman untuk image Docker, file service, skrip launch, dan debugging satu kali
karena pengaturan tersebut hilang ketika environment hilang.

Gunakan konfigurasi Plugin hanya ketika Anda sengaja ingin mematikan
Plugin penemuan LAN bawaan untuk konfigurasi OpenClaw tersebut:

```bash
openclaw plugins disable bonjour
```

## Hal yang perlu diperhatikan di Docker

Plugin Bonjour bawaan otomatis menonaktifkan periklanan multicast LAN dalam
container yang terdeteksi ketika `OPENCLAW_DISABLE_BONJOUR` tidak diatur. Jaringan bridge Docker
biasanya tidak meneruskan multicast mDNS (`224.0.0.251:5353`) antara container
dan LAN, jadi periklanan dari container jarang membuat penemuan berhasil.

Hal penting yang perlu diperhatikan:

- Menonaktifkan Bonjour tidak menghentikan Gateway. Itu hanya menghentikan periklanan
  multicast LAN.
- Menonaktifkan Bonjour tidak mengubah `gateway.bind`; Docker tetap default ke
  `OPENCLAW_GATEWAY_BIND=lan` agar port host yang dipublikasikan dapat berfungsi.
- Menonaktifkan Bonjour tidak menonaktifkan DNS-SD area luas. Gunakan penemuan area luas
  atau Tailnet ketika Gateway dan node tidak berada di LAN yang sama.
- Menggunakan ulang `OPENCLAW_CONFIG_DIR` yang sama di luar Docker tidak mempertahankan
  kebijakan penonaktifan otomatis container.
- Atur `OPENCLAW_DISABLE_BONJOUR=0` hanya untuk host networking, macvlan, atau jaringan lain
  yang diketahui meneruskan multicast mDNS; atur ke `1` untuk menonaktifkan secara paksa.

## Pemecahan masalah Bonjour yang dinonaktifkan

Jika node tidak lagi menemukan Gateway secara otomatis setelah penyiapan Docker:

1. Konfirmasi apakah Gateway berjalan dalam mode otomatis, dipaksa aktif, atau dipaksa nonaktif:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Konfirmasi Gateway itu sendiri dapat dijangkau melalui port yang dipublikasikan:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Gunakan target langsung ketika Bonjour dinonaktifkan:
   - Control UI atau alat lokal: `http://127.0.0.1:18789`
   - Klien LAN: `http://<gateway-host>:18789`
   - Klien lintas jaringan: Tailnet MagicDNS, IP Tailnet, tunnel SSH, atau
     DNS-SD area luas

4. Jika Anda sengaja mengaktifkan Bonjour di Docker dengan
   `OPENCLAW_DISABLE_BONJOUR=0`, uji multicast dari host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Jika penjelajahan kosong atau log Gateway menunjukkan pembatalan watchdog ciao
   berulang, pulihkan `OPENCLAW_DISABLE_BONJOUR=1` dan gunakan rute langsung atau
   Tailnet.

## Mode kegagalan umum

- **Bonjour tidak melewati jaringan**: gunakan Tailnet atau SSH.
- **Multicast diblokir**: beberapa jaringan Wi‑Fi menonaktifkan mDNS.
- **Advertiser macet dalam probing/announcing**: host dengan multicast yang diblokir,
  bridge container, WSL, atau perubahan antarmuka dapat membuat advertiser ciao berada dalam
  status tidak diumumkan. OpenClaw mencoba ulang beberapa kali lalu menonaktifkan Bonjour
  untuk proses Gateway saat ini alih-alih memulai ulang advertiser tanpa henti.
- **Jaringan bridge Docker**: Bonjour otomatis dinonaktifkan dalam container yang terdeteksi.
  Atur `OPENCLAW_DISABLE_BONJOUR=0` hanya untuk host, macvlan, atau jaringan lain
  yang mendukung mDNS.
- **Sleep / perubahan antarmuka**: macOS dapat sementara menjatuhkan hasil mDNS; coba lagi.
- **Browse berfungsi tetapi resolve gagal**: jaga nama mesin tetap sederhana (hindari emoji atau
  tanda baca), lalu mulai ulang Gateway. Nama instance layanan berasal dari
  nama host, jadi nama yang terlalu kompleks dapat membingungkan beberapa resolver.

## Nama instance yang di-escape (`\032`)

Bonjour/DNS‑SD sering meng-escape byte dalam nama instance layanan sebagai urutan `\DDD`
desimal (mis. spasi menjadi `\032`).

- Ini normal pada tingkat protokol.
- UI harus mendecode untuk tampilan (iOS menggunakan `BonjourEscapes.decode`).

## Penonaktifan / konfigurasi

- `openclaw plugins disable bonjour` menonaktifkan periklanan multicast LAN dengan menonaktifkan Plugin bawaan.
- `openclaw plugins enable bonjour` memulihkan Plugin penemuan LAN default.
- `OPENCLAW_DISABLE_BONJOUR=1` menonaktifkan periklanan multicast LAN tanpa mengubah konfigurasi Plugin; nilai truthy yang diterima adalah `1`, `true`, `yes`, dan `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` memaksa periklanan multicast LAN aktif, termasuk di dalam container yang terdeteksi; nilai falsy yang diterima adalah `0`, `false`, `no`, dan `off`.
- Ketika `OPENCLAW_DISABLE_BONJOUR` tidak diatur, Bonjour beriklan pada host normal dan otomatis nonaktif di dalam container yang terdeteksi.
- `gateway.bind` di `~/.openclaw/openclaw.json` mengontrol mode bind Gateway.
- `OPENCLAW_SSH_PORT` menimpa port SSH ketika `sshPort` diiklankan (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` memublikasikan petunjuk MagicDNS dalam TXT ketika mode penuh mDNS diaktifkan (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` menimpa path CLI yang diiklankan (legacy: `OPENCLAW_CLI_PATH`).

## Dokumen terkait

- Kebijakan penemuan dan pemilihan transport: [Penemuan](/id/gateway/discovery)
- Pairing node + persetujuan: [Pairing Gateway](/id/gateway/pairing)
