---
read_when:
    - Men-debug masalah penemuan Bonjour di macOS/iOS
    - Mengubah tipe layanan mDNS, record TXT, atau UX penemuan
summary: Penemuan Bonjour/mDNS + debugging (beacon Gateway, klien, dan mode kegagalan umum)
title: Penemuan Bonjour
x-i18n:
    generated_at: "2026-04-24T09:06:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62961714a0c9880be457c254e1cfc1701020ea51b89f2582757cddc8b3dd2113
    source_path: gateway/bonjour.md
    workflow: 15
---

# Penemuan Bonjour / mDNS

OpenClaw menggunakan Bonjour (mDNS / DNS-SD) untuk menemukan Gateway aktif (endpoint WebSocket).
Browsing multicast `local.` adalah **kemudahan khusus LAN**. Plugin `bonjour`
bawaan memiliki iklan LAN dan diaktifkan secara default. Untuk penemuan lintas jaringan,
beacon yang sama juga dapat dipublikasikan melalui domain DNS-SD wide-area yang dikonfigurasi.
Penemuan tetap bersifat best-effort dan **tidak** menggantikan konektivitas berbasis SSH atau Tailnet.

## Bonjour wide-area (Unicast DNS-SD) melalui Tailscale

Jika Node dan gateway berada di jaringan yang berbeda, mDNS multicast tidak akan melewati
batas tersebut. Anda tetap dapat mempertahankan UX penemuan yang sama dengan beralih ke **DNS-SD unicast**
("Wide-Area Bonjour") melalui Tailscale.

Langkah tingkat tinggi:

1. Jalankan server DNS pada host gateway (dapat dijangkau melalui Tailnet).
2. Publikasikan record DNS-SD untuk `_openclaw-gw._tcp` di bawah zona khusus
   (contoh: `openclaw.internal.`).
3. Konfigurasikan **split DNS** Tailscale agar domain yang Anda pilih diresolusikan melalui
   server DNS tersebut untuk klien (termasuk iOS).

OpenClaw mendukung domain penemuan apa pun; `openclaw.internal.` hanyalah contoh.
Node iOS/Android melakukan browsing ke `local.` dan domain wide-area yang Anda konfigurasi.

### Config Gateway (disarankan)

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

Setelah klien menerima DNS tailnet, Node iOS dan penemuan CLI dapat melakukan browsing
`_openclaw-gw._tcp` di domain penemuan Anda tanpa multicast.

### Keamanan listener Gateway (disarankan)

Port WS Gateway (default `18789`) secara default bind ke loopback. Untuk akses LAN/tailnet,
bind secara eksplisit dan biarkan auth tetap aktif.

Untuk penyiapan khusus tailnet:

- Setel `gateway.bind: "tailnet"` di `~/.openclaw/openclaw.json`.
- Mulai ulang Gateway (atau mulai ulang aplikasi menubar macOS).

## Apa yang melakukan iklan

Hanya Gateway yang mengiklankan `_openclaw-gw._tcp`. Iklan multicast LAN
disediakan oleh Plugin `bonjour` bawaan; publikasi DNS-SD wide-area tetap
dimiliki Gateway.

## Jenis layanan

- `_openclaw-gw._tcp` — beacon transport gateway (digunakan oleh Node macOS/iOS/Android).

## Kunci TXT (petunjuk non-secret)

Gateway mengiklankan petunjuk kecil non-secret untuk memudahkan alur UI:

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
- `cliPath=<path>` (hanya mode penuh mDNS; DNS-SD wide-area tetap menuliskannya sebagai petunjuk instalasi remote)

Catatan keamanan:

- Record TXT Bonjour/mDNS **tidak diautentikasi**. Klien tidak boleh memperlakukan TXT sebagai perutean yang otoritatif.
- Klien harus merutekan menggunakan endpoint layanan yang diresolusikan (SRV + A/AAAA). Perlakukan `lanHost`, `tailnetDns`, `gatewayPort`, dan `gatewayTlsSha256` hanya sebagai petunjuk.
- Penargetan otomatis SSH juga seharusnya menggunakan host layanan yang diresolusikan, bukan petunjuk TXT saja.
- TLS pinning tidak boleh mengizinkan `gatewayTlsSha256` yang diiklankan menimpa pin yang sebelumnya disimpan.
- Node iOS/Android harus memperlakukan koneksi langsung berbasis penemuan sebagai **khusus TLS** dan memerlukan konfirmasi pengguna yang eksplisit sebelum mempercayai fingerprint pertama kali.

## Debugging di macOS

Alat bawaan yang berguna:

- Browsing instance:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Resolusikan satu instance (ganti `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Jika browsing berfungsi tetapi resolusi gagal, biasanya Anda terkena kebijakan LAN atau
masalah resolver mDNS.

## Debugging di log Gateway

Gateway menulis file log bergulir (dicetak saat startup sebagai
`gateway log file: ...`). Cari baris `bonjour:`, terutama:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Debugging di Node iOS

Node iOS menggunakan `NWBrowser` untuk menemukan `_openclaw-gw._tcp`.

Untuk menangkap log:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → reproduksi → **Copy**

Log tersebut mencakup transisi state browser dan perubahan result-set.

## Mode kegagalan umum

- **Bonjour tidak melintasi jaringan**: gunakan Tailnet atau SSH.
- **Multicast diblokir**: beberapa jaringan Wi-Fi menonaktifkan mDNS.
- **Tidur / churn interface**: macOS dapat sementara menghilangkan hasil mDNS; coba lagi.
- **Browsing berfungsi tetapi resolusi gagal**: pertahankan nama mesin tetap sederhana (hindari emoji atau
  tanda baca), lalu mulai ulang Gateway. Nama instance layanan diturunkan dari
  nama host, sehingga nama yang terlalu rumit dapat membingungkan beberapa resolver.

## Nama instance yang di-escape (`\032`)

Bonjour/DNS-SD sering meng-escape byte dalam nama instance layanan sebagai urutan desimal `\DDD`
(misalnya spasi menjadi `\032`).

- Ini normal pada tingkat protokol.
- UI seharusnya mendekodekannya untuk tampilan (iOS menggunakan `BonjourEscapes.decode`).

## Menonaktifkan / konfigurasi

- `openclaw plugins disable bonjour` menonaktifkan iklan multicast LAN dengan menonaktifkan Plugin bawaan.
- `openclaw plugins enable bonjour` memulihkan Plugin penemuan LAN default.
- `OPENCLAW_DISABLE_BONJOUR=1` menonaktifkan iklan multicast LAN tanpa mengubah config Plugin; nilai truthy yang diterima adalah `1`, `true`, `yes`, dan `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `gateway.bind` di `~/.openclaw/openclaw.json` mengontrol mode bind Gateway.
- `OPENCLAW_SSH_PORT` mengoverride port SSH saat `sshPort` diiklankan (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` memublikasikan petunjuk MagicDNS di TXT saat mode penuh mDNS diaktifkan (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` mengoverride path CLI yang diiklankan (legacy: `OPENCLAW_CLI_PATH`).

## Dokumentasi terkait

- Kebijakan penemuan dan pemilihan transport: [Discovery](/id/gateway/discovery)
- Pairing + persetujuan Node: [Gateway pairing](/id/gateway/pairing)
