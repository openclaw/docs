---
read_when:
    - Men-debug masalah penemuan Bonjour di macOS/iOS
    - Mengubah tipe layanan mDNS, record TXT, atau UX penemuan
summary: Penemuan Bonjour/mDNS + debugging (beacon Gateway, klien, dan mode kegagalan umum)
title: Penemuan Bonjour
x-i18n:
    generated_at: "2026-04-05T13:53:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f5a7f3211c74d4d10fdc570fc102b3c949c0ded9409c54995ab8820e5787f02
    source_path: gateway/bonjour.md
    workflow: 15
---

# Penemuan Bonjour / mDNS

OpenClaw menggunakan Bonjour (mDNS / DNS‑SD) untuk menemukan Gateway aktif (endpoint WebSocket).
Penelusuran multicast `local.` adalah **kemudahan khusus LAN**. Untuk penemuan lintas jaringan, beacon yang
sama juga dapat dipublikasikan melalui domain DNS-SD area luas yang dikonfigurasi. Penemuan tetap
bersifat best-effort dan **tidak** menggantikan konektivitas berbasis SSH atau Tailnet.

## Bonjour area luas (Unicast DNS-SD) melalui Tailscale

Jika node dan gateway berada di jaringan yang berbeda, mDNS multicast tidak akan melintasi
batas tersebut. Anda dapat mempertahankan UX penemuan yang sama dengan beralih ke **unicast DNS‑SD**
("Wide‑Area Bonjour") melalui Tailscale.

Langkah-langkah tingkat tinggi:

1. Jalankan server DNS di host gateway (dapat dijangkau melalui Tailnet).
2. Publikasikan record DNS‑SD untuk `_openclaw-gw._tcp` di bawah zona khusus
   (contoh: `openclaw.internal.`).
3. Konfigurasikan **split DNS** Tailscale agar domain yang Anda pilih diselesaikan melalui
   server DNS tersebut untuk klien (termasuk iOS).

OpenClaw mendukung domain penemuan apa pun; `openclaw.internal.` hanyalah contoh.
Node iOS/Android menelusuri `local.` dan domain area luas yang Anda konfigurasi.

### Config Gateway (disarankan)

```json5
{
  gateway: { bind: "tailnet" }, // khusus tailnet (disarankan)
  discovery: { wideArea: { enabled: true } }, // mengaktifkan publikasi DNS-SD area luas
}
```

### Penyiapan server DNS satu kali (host gateway)

```bash
openclaw dns setup --apply
```

Ini memasang CoreDNS dan mengonfigurasinya untuk:

- mendengarkan pada port 53 hanya di interface Tailscale milik gateway
- melayani domain yang Anda pilih (contoh: `openclaw.internal.`) dari `~/.openclaw/dns/<domain>.db`

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

### Keamanan listener Gateway (disarankan)

Port WS Gateway (default `18789`) melakukan bind ke loopback secara default. Untuk akses LAN/tailnet,
lakukan bind secara eksplisit dan tetap aktifkan auth.

Untuk penyiapan khusus tailnet:

- Setel `gateway.bind: "tailnet"` di `~/.openclaw/openclaw.json`.
- Mulai ulang Gateway (atau mulai ulang aplikasi menubar macOS).

## Apa yang mengiklankan

Hanya Gateway yang mengiklankan `_openclaw-gw._tcp`.

## Tipe layanan

- `_openclaw-gw._tcp` — beacon transport gateway (digunakan oleh node macOS/iOS/Android).

## Kunci TXT (petunjuk non-rahasia)

Gateway mengiklankan petunjuk kecil yang tidak rahasia agar alur UI lebih nyaman:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (hanya saat TLS diaktifkan)
- `gatewayTlsSha256=<sha256>` (hanya saat TLS diaktifkan dan fingerprint tersedia)
- `canvasPort=<port>` (hanya saat host canvas diaktifkan; saat ini sama dengan `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (petunjuk opsional saat Tailnet tersedia)
- `sshPort=<port>` (hanya mode penuh mDNS; DNS-SD area luas dapat menghilangkannya)
- `cliPath=<path>` (hanya mode penuh mDNS; DNS-SD area luas tetap menuliskannya sebagai petunjuk instalasi jarak jauh)

Catatan keamanan:

- Record TXT Bonjour/mDNS **tidak diautentikasi**. Klien tidak boleh memperlakukan TXT sebagai routing otoritatif.
- Klien harus melakukan routing menggunakan endpoint layanan yang diselesaikan (SRV + A/AAAA). Perlakukan `lanHost`, `tailnetDns`, `gatewayPort`, dan `gatewayTlsSha256` hanya sebagai petunjuk.
- Penargetan otomatis SSH juga harus menggunakan host layanan yang diselesaikan, bukan petunjuk TXT semata.
- TLS pinning tidak boleh pernah mengizinkan `gatewayTlsSha256` yang diiklankan menimpa pin yang sebelumnya disimpan.
- Node iOS/Android harus memperlakukan koneksi langsung berbasis penemuan sebagai **khusus TLS** dan memerlukan konfirmasi pengguna eksplisit sebelum mempercayai fingerprint pertama kali.

## Debugging di macOS

Tool bawaan yang berguna:

- Telusuri instance:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Selesaikan satu instance (ganti `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Jika penelusuran berfungsi tetapi penyelesaian gagal, biasanya Anda menghadapi kebijakan LAN atau
masalah resolver mDNS.

## Debugging di log Gateway

Gateway menulis file log bergulir (dicetak saat startup sebagai
`gateway log file: ...`). Cari baris `bonjour:`, khususnya:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Debugging di node iOS

Node iOS menggunakan `NWBrowser` untuk menemukan `_openclaw-gw._tcp`.

Untuk menangkap log:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → reproduksi → **Copy**

Log tersebut mencakup transisi status browser dan perubahan kumpulan hasil.

## Mode kegagalan umum

- **Bonjour tidak melintasi jaringan**: gunakan Tailnet atau SSH.
- **Multicast diblokir**: beberapa jaringan Wi‑Fi menonaktifkan mDNS.
- **Sleep / pergantian interface**: macOS dapat sementara kehilangan hasil mDNS; coba lagi.
- **Penelusuran berfungsi tetapi penyelesaian gagal**: buat nama mesin tetap sederhana (hindari emoji atau
  tanda baca), lalu mulai ulang Gateway. Nama instance layanan diturunkan dari
  nama host, jadi nama yang terlalu rumit dapat membingungkan beberapa resolver.

## Nama instance escape (`\032`)

Bonjour/DNS‑SD sering melakukan escape byte dalam nama instance layanan sebagai urutan desimal `\DDD`
(misalnya spasi menjadi `\032`).

- Ini normal pada tingkat protokol.
- UI sebaiknya melakukan decode untuk tampilan (iOS menggunakan `BonjourEscapes.decode`).

## Menonaktifkan / konfigurasi

- `OPENCLAW_DISABLE_BONJOUR=1` menonaktifkan pengiklanan (lama: `OPENCLAW_DISABLE_BONJOUR`).
- `gateway.bind` di `~/.openclaw/openclaw.json` mengontrol mode bind Gateway.
- `OPENCLAW_SSH_PORT` menimpa port SSH saat `sshPort` diiklankan (lama: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` memublikasikan petunjuk MagicDNS di TXT (lama: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` menimpa path CLI yang diiklankan (lama: `OPENCLAW_CLI_PATH`).

## Dokumen terkait

- Kebijakan penemuan dan pemilihan transport: [Discovery](/gateway/discovery)
- Pairing node + persetujuan: [Gateway pairing](/gateway/pairing)
