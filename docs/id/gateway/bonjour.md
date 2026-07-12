---
read_when:
    - Men-debug masalah penemuan Bonjour di macOS/iOS
    - Mengubah jenis layanan mDNS, rekaman TXT, atau UX penemuan
summary: Penemuan + penelusuran kesalahan Bonjour/mDNS (beacon Gateway, klien, dan mode kegagalan umum)
title: Penemuan Bonjour
x-i18n:
    generated_at: "2026-07-12T14:08:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0526c9e20dd02d143ae7aa4c8e1e6830763763e95c9a74c4d73332c5e5e155e
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw dapat menggunakan Bonjour (mDNS/DNS-SD) untuk menemukan Gateway aktif (titik akhir WebSocket). Penelusuran multicast `local.` merupakan **kemudahan khusus LAN**: Plugin `bonjour` bawaan menangani pengiklanan LAN, dimulai otomatis pada host macOS dan harus diaktifkan secara manual pada Linux, Windows, serta penerapan Gateway dalam kontainer. Suar yang sama juga dapat dipublikasikan melalui domain DNS-SD area luas yang dikonfigurasi untuk penemuan lintas jaringan. Penemuan bersifat upaya terbaik dan **tidak** menggantikan konektivitas berbasis SSH atau Tailnet.

## Bonjour area luas (DNS-SD unicast) melalui Tailscale

Jika Node dan Gateway berada di jaringan yang berbeda, mDNS multicast tidak dapat melintasi batas tersebut. Pertahankan pengalaman pengguna penemuan yang sama dengan beralih ke **DNS-SD unicast** ("Bonjour Area Luas") melalui Tailscale:

1. Jalankan server DNS pada host Gateway yang dapat dijangkau melalui Tailnet.
2. Publikasikan rekaman DNS-SD untuk `_openclaw-gw._tcp` di bawah zona khusus (contoh: `openclaw.internal.`).
3. Konfigurasikan **split DNS** Tailscale agar domain pilihan Anda diresolusikan melalui server DNS tersebut untuk klien, termasuk iOS.

`openclaw.internal.` di atas hanyalah contoh — OpenClaw mendukung domain penemuan apa pun. Node iOS/Android menelusuri `local.` dan domain area luas yang Anda konfigurasikan.

### Konfigurasi Gateway

```json5
{
  gateway: { bind: "tailnet" }, // khusus tailnet (disarankan)
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

`discovery.wideArea.domain` juga menerima variabel lingkungan `OPENCLAW_WIDE_AREA_DOMAIN` sebagai nilai cadangan ketika belum diatur.

### Penyiapan server DNS satu kali (host Gateway, khusus macOS)

```bash
openclaw dns setup --apply
```

Perintah ini hanya tersedia di macOS serta memerlukan Homebrew dan koneksi Tailscale yang aktif. Perintah ini memasang CoreDNS (`brew install coredns`) dan mengonfigurasinya untuk:

- mendengarkan pada porta 53 hanya di antarmuka Tailscale milik Gateway
- melayani domain pilihan Anda (contoh: `openclaw.internal.`) dari `~/.openclaw/dns/<domain>.db`

Jalankan terlebih dahulu tanpa `--apply` untuk meninjau rencana (domain, jalur berkas zona, IP Tailnet yang terdeteksi, konfigurasi yang disarankan) tanpa memasang apa pun.

Validasikan dari mesin yang terhubung ke Tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Pengaturan DNS Tailscale

Di konsol admin Tailscale:

- Tambahkan server nama yang mengarah ke IP Tailnet milik Gateway (UDP/TCP 53).
- Tambahkan split DNS agar domain penemuan Anda menggunakan server nama tersebut.

Setelah klien menerima DNS Tailnet, Node iOS dan penemuan CLI dapat menelusuri `_openclaw-gw._tcp` dalam domain penemuan Anda tanpa multicast.

### Keamanan pendengar Gateway

Porta WS Gateway (bawaan `18789`) secara bawaan terikat ke local loopback. Untuk akses LAN/Tailnet, tetapkan pengikatan secara eksplisit dan biarkan autentikasi tetap aktif. Untuk penyiapan khusus Tailnet, atur `gateway.bind: "tailnet"` dalam `~/.openclaw/openclaw.json` dan mulai ulang Gateway (atau aplikasi bilah menu macOS).

## Yang diiklankan

Hanya Gateway yang mengiklankan `_openclaw-gw._tcp`. Pengiklanan multicast LAN berasal dari Plugin `bonjour` bawaan ketika diaktifkan; publikasi DNS-SD area luas tetap menjadi tanggung jawab Gateway.

## Jenis layanan

- `_openclaw-gw._tcp` - suar transportasi Gateway, digunakan oleh Node macOS/iOS/Android.

## Kunci TXT (petunjuk nonrahasia)

| Kunci                         | Saat tersedia                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | Selalu.                                                                        |
| `displayName=<friendly name>` | Selalu.                                                                        |
| `lanHost=<hostname>.local`    | Selalu.                                                                        |
| `gatewayPort=<port>`          | Selalu (WS + HTTP Gateway).                                                     |
| `transport=gateway`           | Selalu.                                                                        |
| `gatewayTls=1`                | Hanya saat TLS diaktifkan.                                                      |
| `gatewayTlsSha256=<sha256>`   | Hanya saat TLS diaktifkan dan sidik jari tersedia.                              |
| `gatewayDirectReachable=1`    | Hanya saat Gateway dapat dijangkau langsung (bukan hanya melalui jalur relai/proksi). |
| `canvasPort=<port>`           | Hanya saat host kanvas diaktifkan; saat ini sama dengan `gatewayPort`.          |
| `tailnetDns=<magicdns>`       | Hanya mode lengkap mDNS; petunjuk opsional saat Tailnet tersedia.               |
| `sshPort=<port>`              | Hanya mode lengkap; dihilangkan dalam mode minimal dan nonaktif.                |
| `cliPath=<path>`              | Hanya mode lengkap; dihilangkan dalam mode minimal dan nonaktif.                |

Catatan keamanan:

- Rekaman TXT Bonjour/mDNS **tidak diautentikasi**. Klien tidak boleh menganggap TXT sebagai perutean otoritatif.
- Klien sebaiknya melakukan perutean menggunakan titik akhir layanan yang diresolusikan (SRV + A/AAAA). Perlakukan `lanHost`, `tailnetDns`, `gatewayPort`, dan `gatewayTlsSha256` hanya sebagai petunjuk.
- Penentuan target SSH otomatis juga harus menggunakan host layanan yang diresolusikan, bukan petunjuk yang hanya berasal dari TXT.
- Penyematan TLS tidak boleh membiarkan `gatewayTlsSha256` yang diiklankan menggantikan sematan yang telah disimpan sebelumnya.
- Node iOS/Android harus memperlakukan koneksi langsung berbasis penemuan sebagai **khusus TLS** dan mewajibkan konfirmasi pengguna secara eksplisit sebelum memercayai sidik jari untuk pertama kalinya.

## Penelusuran kesalahan di macOS

Alat bawaan:

```bash
# Telusuri instans
dns-sd -B _openclaw-gw._tcp local.

# Resolusikan satu instans (ganti <instance>)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

Jika penelusuran berhasil tetapi resolusi gagal, biasanya masalahnya berasal dari kebijakan LAN atau resolver mDNS.

## Penelusuran kesalahan dalam log Gateway

Gateway menulis berkas log bergulir (dicetak saat dimulai sebagai `gateway log file: ...`). Cari baris `bonjour:`, khususnya:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Pengawas memperlakukan `probing`, `announcing`, dan penggantian nama baru akibat konflik yang aktif sebagai status sedang berlangsung. Jika layanan tidak pernah mencapai `announced`, OpenClaw membuat ulang pengiklan dan, setelah kegagalan berulang, menonaktifkan Bonjour untuk proses Gateway tersebut alih-alih terus mengiklankan ulang tanpa henti.

Bonjour menggunakan nama host sistem untuk host `.local` yang diiklankan jika nama tersebut merupakan label DNS yang valid. Jika nama host sistem memuat spasi, garis bawah, atau karakter lain yang tidak valid untuk label DNS, OpenClaw menggunakan `openclaw.local` sebagai nilai cadangan. Atur `OPENCLAW_MDNS_HOSTNAME=<name>` sebelum memulai Gateway jika Anda memerlukan label host yang eksplisit.

## Penelusuran kesalahan pada Node iOS

Node iOS menggunakan `NWBrowser` untuk menemukan `_openclaw-gw._tcp`.

Untuk merekam log: Settings -> Gateway -> Advanced -> **Discovery Debug Logs**, lalu Settings -> Gateway -> Advanced -> **Discovery Logs** -> reproduksi -> **Copy**. Log tersebut mencakup transisi status peramban dan perubahan kumpulan hasil.

## Kapan mengaktifkan Bonjour

Bonjour dimulai otomatis saat Gateway dijalankan dengan konfigurasi kosong pada host macOS karena aplikasi lokal dan Node iOS/Android di sekitar umumnya mengandalkan penemuan dalam LAN yang sama.

Aktifkan secara eksplisit ketika penemuan otomatis dalam LAN yang sama berguna di Linux, Windows, atau host non-macOS lainnya:

```bash
openclaw plugins enable bonjour
```

Saat diaktifkan, Bonjour menggunakan `discovery.mdns.mode` untuk menentukan jumlah metadata TXT yang akan dipublikasikan; mode yang sama mengendalikan petunjuk TXT opsional dalam rekaman DNS-SD area luas. Mode:

| Mode                | Perilaku                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` (bawaan)  | Hanya kunci TXT inti; menghilangkan `sshPort`, `cliPath`, `tailnetDns`.                                                                                        |
| `full`              | Menambahkan `sshPort`, `cliPath`, `tailnetDns` — gunakan saat klien memerlukan petunjuk tersebut.                                                              |
| `off`               | Menekan multicast LAN tanpa mengubah status pengaktifan Plugin; DNS-SD area luas masih dapat memublikasikan suar minimal saat `discovery.wideArea.enabled` bernilai true. |

## Kapan menonaktifkan Bonjour

Biarkan Bonjour dinonaktifkan ketika pengiklanan multicast LAN tidak diperlukan, tidak tersedia, atau merugikan — kasus yang umum meliputi server non-macOS, jaringan jembatan Docker, WSL, atau kebijakan jaringan yang membuang multicast mDNS. Gateway tetap dapat dijangkau melalui URL yang dipublikasikan, SSH, Tailnet, atau DNS-SD area luas; hanya penemuan otomatis LAN yang menjadi tidak andal.

Gunakan penggantian melalui variabel lingkungan untuk masalah yang terbatas pada penerapan (aman untuk citra Docker, berkas layanan, skrip peluncuran, dan penelusuran kesalahan sesekali — pengaturan ini hilang saat lingkungannya tidak ada):

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Gunakan konfigurasi Plugin jika Anda sengaja ingin menonaktifkan Plugin penemuan LAN bawaan untuk konfigurasi OpenClaw tersebut:

```bash
openclaw plugins disable bonjour
```

## Hal-hal yang perlu diperhatikan pada Docker

Plugin Bonjour bawaan secara otomatis menonaktifkan pengiklanan multicast LAN dalam kontainer yang terdeteksi ketika `OPENCLAW_DISABLE_BONJOUR` belum diatur. Jaringan jembatan Docker biasanya tidak meneruskan multicast mDNS (`224.0.0.251:5353`) antara kontainer dan LAN, sehingga pengiklanan dari kontainer jarang membuat penemuan berfungsi.

Hal-hal yang perlu diperhatikan:

- Bonjour dimulai otomatis pada host macOS dan harus diaktifkan secara manual di tempat lain. Membiarkannya dinonaktifkan tidak menghentikan Gateway — tindakan ini hanya melewati pengiklanan multicast LAN.
- Menonaktifkan Bonjour tidak mengubah `gateway.bind`; Docker tetap menggunakan `OPENCLAW_GATEWAY_BIND=lan` secara bawaan agar porta host yang dipublikasikan berfungsi.
- Menonaktifkan Bonjour tidak menonaktifkan DNS-SD area luas. Gunakan penemuan area luas atau Tailnet ketika Gateway dan Node tidak berada di LAN yang sama.
- Menggunakan kembali `OPENCLAW_CONFIG_DIR` yang sama di luar Docker tidak mempertahankan kebijakan penonaktifan otomatis kontainer.
- Atur `OPENCLAW_DISABLE_BONJOUR=0` hanya untuk jaringan host, macvlan, atau jaringan lain yang diketahui meneruskan multicast mDNS; atur ke `1` untuk memaksa penonaktifan.

## Pemecahan masalah Bonjour yang dinonaktifkan

Jika Node tidak lagi menemukan Gateway secara otomatis setelah penyiapan Docker:

1. Pastikan apakah Gateway berjalan dalam mode otomatis, dipaksa aktif, atau dipaksa nonaktif:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Pastikan Gateway itu sendiri dapat dijangkau melalui porta yang dipublikasikan:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Gunakan target langsung saat Bonjour dinonaktifkan:
   - UI Kontrol atau alat lokal: `http://127.0.0.1:18789`
   - Klien LAN: `http://<gateway-host>:18789`
   - Klien lintas jaringan: MagicDNS Tailnet, IP Tailnet, terowongan SSH, atau DNS-SD area luas

4. Jika Anda sengaja mengaktifkan Plugin Bonjour di Docker dan memaksa pengiklanan dengan `OPENCLAW_DISABLE_BONJOUR=0`, uji multicast dari host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Jika hasil penelusuran kosong atau log Gateway menunjukkan pembatalan pengawas ciao secara berulang, pulihkan `OPENCLAW_DISABLE_BONJOUR=1` dan gunakan rute langsung atau Tailnet.

## Mode kegagalan umum

- **Bonjour tidak melintasi jaringan**: gunakan Tailnet atau SSH.
- **Multicast diblokir**: beberapa jaringan Wi-Fi menonaktifkan mDNS.
- **Pengiklan macet dalam tahap pemeriksaan/pengumuman**: host dengan multicast yang diblokir, bridge kontainer, WSL, atau perubahan antarmuka dapat menyebabkan pengiklan ciao berada dalam status belum diumumkan. OpenClaw mencoba kembali beberapa kali, lalu menonaktifkan Bonjour untuk proses Gateway saat ini alih-alih memulai ulang pengiklan tanpa henti.
- **Jaringan bridge Docker**: Bonjour dinonaktifkan otomatis dalam kontainer yang terdeteksi. Atur `OPENCLAW_DISABLE_BONJOUR=0` hanya untuk jaringan host, macvlan, atau jaringan lain yang mendukung mDNS.
- **Perubahan akibat mode tidur/antarmuka**: macOS mungkin kehilangan hasil mDNS untuk sementara; coba lagi.
- **Penelusuran berfungsi tetapi resolusi gagal**: gunakan nama mesin yang sederhana (hindari emoji atau tanda baca), lalu mulai ulang Gateway. Nama instans layanan berasal dari nama host, sehingga nama yang terlalu kompleks dapat membingungkan beberapa resolver.

## Nama instans yang di-escape (`\032`)

Bonjour/DNS-SD sering meng-escape byte dalam nama instans layanan sebagai urutan desimal `\DDD` (spasi menjadi `\032`). Hal ini normal pada tingkat protokol; UI harus mendekodenya untuk ditampilkan (iOS menggunakan `BonjourEscapes.decode`).

## Mengaktifkan / menonaktifkan / konfigurasi

| Pengaturan                                           | Efek                                                                                                  |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | Mengaktifkan Plugin penemuan LAN bawaan pada host yang tidak mengaktifkannya secara default.           |
| `openclaw plugins disable bonjour`                   | Menonaktifkan pengiklanan multicast LAN dengan menonaktifkan Plugin bawaan.                            |
| `OPENCLAW_DISABLE_BONJOUR=1` (atau `true`/`yes`/`on`)  | Menonaktifkan pengiklanan multicast LAN tanpa mengubah konfigurasi Plugin.                             |
| `OPENCLAW_DISABLE_BONJOUR=0` (atau `false`/`no`/`off`) | Memaksa pengiklanan multicast LAN aktif, termasuk di dalam kontainer yang terdeteksi.                  |
| `discovery.mdns.mode`                                | `off` \| `minimal` (default) \| `full` — lihat mode di atas.                                           |
| `gateway.bind`                                       | Mengontrol mode pengikatan Gateway dalam `~/.openclaw/openclaw.json`.                                  |
| `OPENCLAW_SSH_PORT`                                  | Mengganti port SSH saat `sshPort` diiklankan (mode penuh).                                             |
| `OPENCLAW_TAILNET_DNS`                               | Menerbitkan petunjuk MagicDNS dalam TXT saat mode penuh mDNS diaktifkan.                               |
| `OPENCLAW_CLI_PATH`                                  | Mengganti jalur CLI yang diiklankan (mode penuh).                                                      |

Host macOS secara default memulai otomatis Plugin penemuan LAN bawaan. Saat Plugin Bonjour diaktifkan dan `OPENCLAW_DISABLE_BONJOUR` tidak ditetapkan, Bonjour beriklan pada host normal dan dinonaktifkan otomatis di dalam kontainer yang terdeteksi (Docker, mesin Fly.io, dan runtime kontainer umum).

## Dokumentasi terkait

- Kebijakan penemuan dan pemilihan transportasi: [Penemuan](/id/gateway/discovery)
- Penyandingan Node + persetujuan: [Penyandingan Gateway](/id/gateway/pairing)
