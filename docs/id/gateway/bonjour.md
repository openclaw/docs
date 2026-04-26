---
read_when:
    - Debugging masalah penemuan Bonjour di macOS/iOS
    - Mengubah tipe layanan mDNS, catatan TXT, atau UX penemuan
summary: Penemuan Bonjour/mDNS + debugging (beacon Gateway, klien, dan mode kegagalan umum)
title: Penemuan Bonjour
x-i18n:
    generated_at: "2026-04-26T11:27:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: b055021bdcd92740934823dea2acf758c6ec991a15c0a315426dc359a7eea093
    source_path: gateway/bonjour.md
    workflow: 15
---

# Penemuan Bonjour / mDNS

OpenClaw menggunakan Bonjour (mDNS / DNS‑SD) untuk menemukan Gateway aktif (endpoint WebSocket).
Browsing multicast `local.` adalah **kemudahan khusus LAN**. Plugin `bonjour`
yang dibundel memiliki LAN advertising dan diaktifkan secara default. Untuk penemuan lintas jaringan,
beacon yang sama juga dapat dipublikasikan melalui domain DNS-SD wide-area yang dikonfigurasi.
Penemuan tetap best-effort dan **tidak** menggantikan konektivitas SSH atau berbasis Tailnet.

## Bonjour wide-area (Unicast DNS-SD) melalui Tailscale

Jika node dan gateway berada di jaringan yang berbeda, mDNS multicast tidak akan melintasi
batas tersebut. Anda dapat mempertahankan UX penemuan yang sama dengan beralih ke **unicast DNS‑SD**
("Wide‑Area Bonjour") melalui Tailscale.

Langkah tingkat tinggi:

1. Jalankan server DNS pada host gateway (dapat dijangkau melalui Tailnet).
2. Publikasikan catatan DNS‑SD untuk `_openclaw-gw._tcp` di bawah zona khusus
   (contoh: `openclaw.internal.`).
3. Konfigurasikan **split DNS** Tailscale agar domain yang Anda pilih diresolusikan melalui
   server DNS tersebut untuk klien (termasuk iOS).

OpenClaw mendukung domain penemuan apa pun; `openclaw.internal.` hanyalah contoh.
Node iOS/Android melakukan browsing pada `local.` dan domain wide-area yang Anda konfigurasi.

### Config Gateway (disarankan)

```json5
{
  gateway: { bind: "tailnet" }, // khusus tailnet (disarankan)
  discovery: { wideArea: { enabled: true } }, // mengaktifkan publikasi DNS-SD wide-area
}
```

### Penyiapan server DNS satu kali (host gateway)

```bash
openclaw dns setup --apply
```

Ini menginstal CoreDNS dan mengonfigurasinya untuk:

- mendengarkan pada port 53 hanya di interface Tailscale gateway
- melayani domain pilihan Anda (contoh: `openclaw.internal.`) dari `~/.openclaw/dns/<domain>.db`

Validasikan dari mesin yang terhubung ke tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Pengaturan DNS Tailscale

Di konsol admin Tailscale:

- Tambahkan nameserver yang mengarah ke IP tailnet gateway (UDP/TCP 53).
- Tambahkan split DNS agar domain penemuan Anda menggunakan nameserver tersebut.

Setelah klien menerima DNS tailnet, node iOS dan penemuan CLI dapat melakukan browsing
`_openclaw-gw._tcp` di domain penemuan Anda tanpa multicast.

### Keamanan listener Gateway (disarankan)

Port WS Gateway (default `18789`) melakukan bind ke loopback secara default. Untuk akses LAN/tailnet,
lakukan bind secara eksplisit dan tetap aktifkan auth.

Untuk penyiapan khusus tailnet:

- Atur `gateway.bind: "tailnet"` di `~/.openclaw/openclaw.json`.
- Mulai ulang Gateway (atau mulai ulang app menubar macOS).

## Apa yang melakukan advertising

Hanya Gateway yang melakukan advertising `_openclaw-gw._tcp`. LAN multicast advertising
disediakan oleh Plugin `bonjour` yang dibundel; publikasi DNS-SD wide-area tetap
dimiliki oleh Gateway.

## Tipe layanan

- `_openclaw-gw._tcp` — beacon transport gateway (digunakan oleh node macOS/iOS/Android).

## Kunci TXT (petunjuk non-rahasia)

Gateway melakukan advertising petunjuk kecil non-rahasia untuk memudahkan alur UI:

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

- Catatan TXT Bonjour/mDNS bersifat **tanpa autentikasi**. Klien tidak boleh memperlakukan TXT sebagai perutean yang otoritatif.
- Klien harus merutekan menggunakan endpoint layanan yang diresolusikan (SRV + A/AAAA). Perlakukan `lanHost`, `tailnetDns`, `gatewayPort`, dan `gatewayTlsSha256` hanya sebagai petunjuk.
- Auto-targeting SSH juga harus menggunakan host layanan yang diresolusikan, bukan petunjuk TXT saja.
- TLS pinning tidak boleh mengizinkan `gatewayTlsSha256` yang diiklankan menimpa pin yang sebelumnya telah disimpan.
- Node iOS/Android harus memperlakukan koneksi langsung berbasis penemuan sebagai **khusus TLS** dan memerlukan konfirmasi pengguna eksplisit sebelum memercayai fingerprint pertama kali.

## Debugging di macOS

Tool bawaan yang berguna:

- Browse instance:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Resolve satu instance (ganti `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Jika browsing berfungsi tetapi resolve gagal, biasanya Anda mengalami kebijakan LAN atau
masalah resolver mDNS.

## Debugging di log Gateway

Gateway menulis file log rolling (dicetak saat startup sebagai
`gateway log file: ...`). Cari baris `bonjour:`, terutama:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

## Debugging di node iOS

Node iOS menggunakan `NWBrowser` untuk menemukan `_openclaw-gw._tcp`.

Untuk mengambil log:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → reproduksi → **Copy**

Log mencakup transisi status browser dan perubahan set hasil.

## Kapan menonaktifkan Bonjour

Nonaktifkan Bonjour hanya ketika LAN multicast advertising tidak tersedia atau merugikan.
Kasus yang umum adalah Gateway yang berjalan di belakang Docker bridge networking, WSL, atau
kebijakan jaringan yang membuang mDNS multicast. Di environment tersebut Gateway
tetap dapat dijangkau melalui URL yang dipublikasikan, SSH, Tailnet, atau DNS-SD wide-area,
tetapi auto-discovery LAN tidak andal.

Lebih baik gunakan override environment yang ada ketika masalahnya terbatas pada deployment:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Itu menonaktifkan LAN multicast advertising tanpa mengubah konfigurasi Plugin.
Ini aman untuk image Docker, file service, script launcher, dan
debugging satu kali karena pengaturannya hilang saat environment-nya hilang.

Gunakan konfigurasi Plugin hanya ketika Anda memang ingin mematikan
Plugin penemuan LAN bawaan untuk config OpenClaw tersebut:

```bash
openclaw plugins disable bonjour
```

## Gotcha Docker

Docker Compose yang dibundel menetapkan `OPENCLAW_DISABLE_BONJOUR=1` untuk layanan Gateway
secara default. Docker bridge network biasanya tidak meneruskan mDNS multicast
(`224.0.0.251:5353`) antara container dan LAN, jadi membiarkan Bonjour aktif dapat
menghasilkan kegagalan `probing` atau `announcing` ciao berulang tanpa membuat penemuan
berfungsi.

Gotcha penting:

- Menonaktifkan Bonjour tidak menghentikan Gateway. Ini hanya menghentikan LAN multicast
  advertising.
- Menonaktifkan Bonjour tidak mengubah `gateway.bind`; Docker tetap default ke
  `OPENCLAW_GATEWAY_BIND=lan` agar port host yang dipublikasikan dapat berfungsi.
- Menonaktifkan Bonjour tidak menonaktifkan DNS-SD wide-area. Gunakan penemuan wide-area
  atau Tailnet saat Gateway dan node tidak berada pada LAN yang sama.
- Menggunakan kembali `OPENCLAW_CONFIG_DIR` yang sama di luar Docker tidak mewarisi
  default Compose kecuali environment masih menetapkan `OPENCLAW_DISABLE_BONJOUR`.
- Atur `OPENCLAW_DISABLE_BONJOUR=0` hanya untuk host networking, macvlan, atau jaringan lain
  tempat mDNS multicast diketahui dapat lewat.

## Pemecahan masalah Bonjour yang dinonaktifkan

Jika node tidak lagi menemukan Gateway secara otomatis setelah penyiapan Docker:

1. Konfirmasikan apakah Gateway memang sengaja menekan LAN advertising:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Konfirmasikan bahwa Gateway itu sendiri dapat dijangkau melalui port yang dipublikasikan:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Gunakan target langsung saat Bonjour dinonaktifkan:
   - UI Kontrol atau tool lokal: `http://127.0.0.1:18789`
   - Klien LAN: `http://<gateway-host>:18789`
   - Klien lintas jaringan: Tailnet MagicDNS, Tailnet IP, tunnel SSH, atau
     DNS-SD wide-area

4. Jika Anda sengaja mengaktifkan Bonjour di Docker dengan
   `OPENCLAW_DISABLE_BONJOUR=0`, uji multicast dari host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Jika browsing kosong atau log Gateway menampilkan pembatalan watchdog ciao
   berulang, pulihkan `OPENCLAW_DISABLE_BONJOUR=1` dan gunakan rute langsung atau
   Tailnet.

## Mode kegagalan umum

- **Bonjour tidak melintasi jaringan**: gunakan Tailnet atau SSH.
- **Multicast diblokir**: beberapa jaringan Wi‑Fi menonaktifkan mDNS.
- **Advertiser macet di probing/announcing**: host dengan multicast yang diblokir,
  container bridge, WSL, atau perubahan interface dapat meninggalkan advertiser ciao dalam
  status non-announced. OpenClaw mencoba lagi beberapa kali lalu menonaktifkan Bonjour
  untuk proses Gateway saat ini alih-alih terus me-restart advertiser.
- **Docker bridge networking**: Docker Compose yang dibundel menonaktifkan Bonjour secara
  default dengan `OPENCLAW_DISABLE_BONJOUR=1`. Atur ke `0` hanya untuk host,
  macvlan, atau jaringan lain yang mendukung mDNS.
- **Sleep / perubahan interface**: macOS dapat sementara menghilangkan hasil mDNS; coba lagi.
- **Browsing berfungsi tetapi resolve gagal**: buat nama mesin tetap sederhana (hindari emoji atau
  tanda baca), lalu mulai ulang Gateway. Nama instance layanan berasal dari
  nama host, sehingga nama yang terlalu kompleks dapat membingungkan beberapa resolver.

## Nama instance escape (`\032`)

Bonjour/DNS‑SD sering meng-escape byte dalam nama instance layanan sebagai urutan desimal `\DDD`
(misalnya spasi menjadi `\032`).

- Ini normal pada level protokol.
- UI harus mendekodekannya untuk tampilan (iOS menggunakan `BonjourEscapes.decode`).

## Menonaktifkan / konfigurasi

- `openclaw plugins disable bonjour` menonaktifkan LAN multicast advertising dengan menonaktifkan Plugin bawaan.
- `openclaw plugins enable bonjour` memulihkan Plugin penemuan LAN default.
- `OPENCLAW_DISABLE_BONJOUR=1` menonaktifkan LAN multicast advertising tanpa mengubah config Plugin; nilai truthy yang diterima adalah `1`, `true`, `yes`, dan `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- Docker Compose menetapkan `OPENCLAW_DISABLE_BONJOUR=1` secara default untuk bridge networking; override dengan `OPENCLAW_DISABLE_BONJOUR=0` hanya saat mDNS multicast tersedia.
- `gateway.bind` di `~/.openclaw/openclaw.json` mengontrol mode bind Gateway.
- `OPENCLAW_SSH_PORT` menimpa port SSH saat `sshPort` diiklankan (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` memublikasikan petunjuk MagicDNS di TXT saat mode penuh mDNS diaktifkan (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` menimpa path CLI yang diiklankan (legacy: `OPENCLAW_CLI_PATH`).

## Dokumen terkait

- Kebijakan penemuan dan pemilihan transport: [Discovery](/id/gateway/discovery)
- Pairing node + approvals: [Gateway pairing](/id/gateway/pairing)
