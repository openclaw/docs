---
read_when:
    - Men-debug masalah penemuan Bonjour di macOS/iOS
    - Mengubah jenis layanan mDNS, rekaman TXT, atau UX penemuan
summary: Penemuan + debugging Bonjour/mDNS (beacon Gateway, klien, dan mode kegagalan umum)
title: Penemuan Bonjour
x-i18n:
    generated_at: "2026-07-16T18:01:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 42a46dc34e94dc86ee0432b12fcb59b3855371c745d79825a00aa557e1369160
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw dapat menggunakan Bonjour (mDNS/DNS-SD) untuk menemukan Gateway aktif (titik akhir WebSocket). Penelusuran multicast `local.` merupakan **kemudahan khusus LAN**: Plugin bawaan `bonjour` menangani pengiklanan LAN, dimulai otomatis pada host macOS dan bersifat opsional pada Linux, Windows, serta deployment Gateway dalam kontainer. Suar yang sama juga dapat dipublikasikan melalui domain DNS-SD area luas yang dikonfigurasi untuk penemuan lintas jaringan. Penemuan bersifat upaya terbaik dan **tidak** menggantikan konektivitas berbasis SSH atau Tailnet.

## Bonjour area luas (DNS-SD Unicast) melalui Tailscale

Jika Node dan Gateway berada di jaringan yang berbeda, mDNS multicast tidak dapat melintasi batas tersebut. Pertahankan pengalaman pengguna penemuan yang sama dengan beralih ke **DNS-SD unicast** ("Bonjour Area Luas") melalui Tailscale:

1. Jalankan server DNS pada host Gateway yang dapat dijangkau melalui Tailnet.
2. Publikasikan catatan DNS-SD untuk `_openclaw-gw._tcp` di bawah zona khusus (contoh: `openclaw.internal.`).
3. Konfigurasikan **DNS terpisah** Tailscale agar domain pilihan Anda diresolusi melalui server DNS tersebut untuk klien, termasuk iOS.

`openclaw.internal.` di atas hanyalah contoh — OpenClaw mendukung domain penemuan apa pun. Node iOS/Android menelusuri `local.` dan domain area luas yang Anda konfigurasi.

### Konfigurasi Gateway

```json5
{
  gateway: { bind: "tailnet" }, // khusus tailnet (disarankan)
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

`discovery.wideArea.domain` juga menerima variabel lingkungan `OPENCLAW_WIDE_AREA_DOMAIN` sebagai cadangan saat belum ditetapkan.

### Penyiapan server DNS satu kali (host Gateway, khusus macOS)

```bash
openclaw dns setup --apply
```

Perintah ini khusus macOS serta memerlukan Homebrew dan koneksi Tailscale yang sedang berjalan. Perintah ini menginstal CoreDNS (`brew install coredns`) dan mengonfigurasinya untuk:

- mendengarkan pada port 53 hanya di antarmuka Tailscale milik Gateway
- melayani domain pilihan Anda (contoh: `openclaw.internal.`) dari `~/.openclaw/dns/<domain>.db`

Jalankan terlebih dahulu tanpa `--apply` untuk melihat pratinjau rencana (domain, jalur berkas zona, IP Tailnet yang terdeteksi, konfigurasi yang disarankan) tanpa menginstal apa pun.

Validasikan dari mesin yang terhubung ke Tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Pengaturan DNS Tailscale

Di konsol admin Tailscale:

- Tambahkan server nama yang mengarah ke IP Tailnet milik Gateway (UDP/TCP 53).
- Tambahkan DNS terpisah agar domain penemuan Anda menggunakan server nama tersebut.

Setelah klien menerima DNS Tailnet, Node iOS dan penemuan CLI dapat menelusuri `_openclaw-gw._tcp` di domain penemuan Anda tanpa multicast.

### Keamanan pendengar Gateway

Port WS Gateway (default `18789`) secara default diikat ke loopback. Untuk akses LAN/Tailnet, ikat secara eksplisit dan pertahankan autentikasi tetap aktif. Untuk penyiapan khusus Tailnet, tetapkan `gateway.bind: "tailnet"` di `~/.openclaw/openclaw.json` dan mulai ulang Gateway (atau aplikasi bilah menu macOS).

## Yang diiklankan

Hanya Gateway yang mengiklankan `_openclaw-gw._tcp`. Pengiklanan multicast LAN berasal dari Plugin bawaan `bonjour` saat diaktifkan; publikasi DNS-SD area luas tetap ditangani oleh Gateway.

## Jenis layanan

- `_openclaw-gw._tcp` - suar transportasi Gateway yang digunakan oleh Node macOS/iOS/Android.

## Kunci TXT (petunjuk nonrahasia)

| Kunci                           | Saat tersedia                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | Selalu.                                                                        |
| `displayName=<friendly name>` | Selalu.                                                                        |
| `lanHost=<hostname>.local`    | Selalu.                                                                        |
| `gatewayPort=<port>`          | Selalu (WS + HTTP Gateway).                                                    |
| `transport=gateway`           | Selalu.                                                                        |
| `gatewayTls=1`                | Hanya saat TLS diaktifkan.                                                      |
| `gatewayTlsSha256=<sha256>`   | Hanya saat TLS diaktifkan dan sidik jari tersedia.                       |
| `gatewayDirectReachable=1`    | Hanya saat Gateway dapat dijangkau secara langsung (bukan hanya melalui jalur relai/proksi). |
| `canvasPort=<port>`           | Hanya saat host kanvas diaktifkan; saat ini sama dengan `gatewayPort`.     |
| `tailnetDns=<magicdns>`       | Khusus mode penuh mDNS; petunjuk opsional saat Tailnet tersedia.                  |
| `sshPort=<port>`              | Khusus mode penuh; dihilangkan dalam mode minimal dan nonaktif.                              |
| `cliPath=<path>`              | Khusus mode penuh; dihilangkan dalam mode minimal dan nonaktif.                              |

Catatan keamanan:

- Catatan TXT Bonjour/mDNS **tidak diautentikasi**. Klien tidak boleh menganggap TXT sebagai perutean yang otoritatif.
- Klien harus melakukan perutean menggunakan titik akhir layanan yang telah diresolusi (SRV + A/AAAA). Perlakukan `lanHost`, `tailnetDns`, `gatewayPort`, dan `gatewayTlsSha256` hanya sebagai petunjuk.
- Penargetan otomatis SSH juga harus menggunakan host layanan yang telah diresolusi, bukan petunjuk khusus TXT.
- Penyematan TLS tidak boleh membiarkan `gatewayTlsSha256` yang diiklankan menimpa sematan yang telah disimpan sebelumnya.
- Node iOS/Android harus memperlakukan koneksi langsung berbasis penemuan sebagai **khusus TLS** dan mewajibkan konfirmasi pengguna secara eksplisit sebelum memercayai sidik jari untuk pertama kalinya.

## Debugging di macOS

Alat bawaan:

```bash
# Telusuri instans
dns-sd -B _openclaw-gw._tcp local.

# Resolusi satu instans (ganti <instance>)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

Jika penelusuran berhasil tetapi resolusi gagal, biasanya penyebabnya adalah kebijakan LAN atau masalah resolver mDNS.

## Debugging dalam log Gateway

Gateway menulis berkas log bergulir (dicetak saat dimulai sebagai `gateway log file: ...`). Cari baris `bonjour:`, terutama:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao netmask assertion ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`

OpenClaw memulai setiap layanan Bonjour satu kali dan menyerahkan probing, percobaan ulang, resolusi konflik nama, serta publikasi ulang saat antarmuka berubah kepada responder mDNS. Hal ini menghindari percobaan publikasi yang tumpang tindih selama perubahan jaringan normal. Pesan pemeriksaan mandiri internal yang berulang ditekan agar tidak membanjiri log Gateway.

Saat beberapa Gateway OpenClaw mengiklankan dari host yang sama, Bonjour dapat menambahkan akhiran seperti `(2)` atau `(3)` agar nama instans layanan tetap unik. Akhiran tersebut merupakan resolusi konflik normal dan tidak menunjukkan supervisi OCM duplikat.

Bonjour menggunakan nama host sistem untuk host `.local` yang diiklankan apabila nama tersebut merupakan label DNS yang valid. Jika nama host sistem berisi spasi, garis bawah, atau karakter lain yang tidak valid untuk label DNS, OpenClaw beralih ke `openclaw.local`. Tetapkan `OPENCLAW_MDNS_HOSTNAME=<name>` sebelum memulai Gateway jika Anda memerlukan label host yang eksplisit.

## Debugging pada Node iOS

Node iOS menggunakan `NWBrowser` untuk menemukan `_openclaw-gw._tcp`.

Untuk mengambil log: Settings -> Gateway -> Advanced -> **Discovery Debug Logs**, lalu Settings -> Gateway -> Advanced -> **Discovery Logs** -> reproduksi -> **Copy**. Log mencakup transisi status browser dan perubahan kumpulan hasil.

## Kapan mengaktifkan Bonjour

Bonjour dimulai otomatis saat Gateway dengan konfigurasi kosong dijalankan pada host macOS karena aplikasi lokal dan Node iOS/Android di sekitar umumnya mengandalkan penemuan dalam LAN yang sama.

Aktifkan secara eksplisit saat penemuan otomatis dalam LAN yang sama berguna pada Linux, Windows, atau host non-macOS lainnya:

```bash
openclaw plugins enable bonjour
```

Saat diaktifkan, Bonjour menggunakan `discovery.mdns.mode` untuk menentukan jumlah metadata TXT yang dipublikasikan; mode yang sama mengontrol petunjuk TXT opsional dalam catatan DNS-SD area luas. Mode:

| Mode                | Perilaku                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` (default) | Hanya kunci TXT inti; menghilangkan `sshPort`, `cliPath`, `tailnetDns`.                                                                                                 |
| `full`              | Menambahkan `sshPort`, `cliPath`, `tailnetDns` — gunakan saat klien memerlukan petunjuk tersebut.                                                                                  |
| `off`               | Menonaktifkan multicast LAN tanpa mengubah status pengaktifan Plugin; DNS-SD area luas masih dapat memublikasikan suar minimal saat `discovery.wideArea.enabled` bernilai true. |

## Kapan menonaktifkan Bonjour

Biarkan Bonjour dinonaktifkan saat pengiklanan multicast LAN tidak diperlukan, tidak tersedia, atau merugikan — kasus umum meliputi server non-macOS, jaringan bridge Docker, WSL, atau kebijakan jaringan yang membuang multicast mDNS. Gateway tetap dapat dijangkau melalui URL yang dipublikasikan, SSH, Tailnet, atau DNS-SD area luas; hanya penemuan otomatis LAN yang tidak dapat diandalkan.

Gunakan penggantian variabel lingkungan untuk masalah yang terbatas pada deployment (aman untuk citra Docker, berkas layanan, skrip peluncuran, atau debugging satu kali — pengaturan ini hilang ketika lingkungannya hilang):

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Gunakan konfigurasi Plugin jika Anda sengaja ingin menonaktifkan Plugin penemuan LAN bawaan untuk konfigurasi OpenClaw tersebut:

```bash
openclaw plugins disable bonjour
```

## Hal yang perlu diperhatikan pada Docker

Plugin Bonjour bawaan menonaktifkan otomatis pengiklanan multicast LAN dalam kontainer yang terdeteksi saat `OPENCLAW_DISABLE_BONJOUR` belum ditetapkan. Jaringan bridge Docker biasanya tidak meneruskan multicast mDNS (`224.0.0.251:5353`) antara kontainer dan LAN, sehingga pengiklanan dari kontainer jarang membuat penemuan berfungsi.

Hal yang perlu diperhatikan:

- Bonjour dimulai otomatis pada host macOS dan bersifat opsional di tempat lain. Membiarkannya dinonaktifkan tidak menghentikan Gateway — tindakan ini hanya melewati pengiklanan multicast LAN.
- Menonaktifkan Bonjour tidak mengubah `gateway.bind`; Docker tetap menggunakan default `OPENCLAW_GATEWAY_BIND=lan` agar port host yang dipublikasikan berfungsi.
- Menonaktifkan Bonjour tidak menonaktifkan DNS-SD area luas. Gunakan penemuan area luas atau Tailnet saat Gateway dan Node tidak berada dalam LAN yang sama.
- Menggunakan kembali `OPENCLAW_CONFIG_DIR` yang sama di luar Docker tidak mempertahankan kebijakan penonaktifan otomatis kontainer.
- Tetapkan `OPENCLAW_DISABLE_BONJOUR=0` hanya untuk jaringan host, macvlan, atau jaringan lain yang diketahui dapat meneruskan multicast mDNS; tetapkan ke `1` untuk menonaktifkannya secara paksa.

## Pemecahan masalah Bonjour yang dinonaktifkan

Jika Node tidak lagi menemukan Gateway secara otomatis setelah penyiapan Docker:

1. Konfirmasikan apakah Gateway berjalan dalam mode otomatis, dipaksa aktif, atau dipaksa nonaktif:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Konfirmasikan bahwa Gateway itu sendiri dapat dijangkau melalui port yang dipublikasikan:

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

   Jika hasil penelusuran kosong, atau log Gateway menunjukkan kegagalan pemeriksaan ciao berulang, pulihkan `OPENCLAW_DISABLE_BONJOUR=1` dan gunakan rute langsung atau Tailnet.

## Mode kegagalan umum

- **Bonjour tidak menjangkau lintas jaringan**: gunakan Tailnet atau SSH.
- **Multicast diblokir**: beberapa jaringan Wi-Fi menonaktifkan mDNS.
- **Pengiklan macet dalam tahap probing/announcing**: host dengan multicast yang diblokir, bridge kontainer, WSL, atau perubahan antarmuka berulang dapat membuat responder berada dalam status tidak diumumkan. Gateway tetap tersedia melalui rute langsung, SSH, Tailnet, atau DNS-SD area luas; nonaktifkan Bonjour LAN dengan `discovery.mdns.mode: "off"` atau `OPENCLAW_DISABLE_BONJOUR=1` saat multicast tidak tersedia.
- **Jaringan bridge Docker**: Bonjour otomatis dinonaktifkan dalam kontainer yang terdeteksi. Tetapkan `OPENCLAW_DISABLE_BONJOUR=0` hanya untuk jaringan host, macvlan, atau jaringan lain yang mendukung mDNS.
- **Perubahan berulang akibat mode tidur/antarmuka**: macOS mungkin kehilangan hasil mDNS untuk sementara; coba lagi.
- **Penelusuran berfungsi tetapi resolusi gagal**: gunakan nama mesin yang sederhana (hindari emoji atau tanda baca), lalu mulai ulang Gateway. Nama instans layanan berasal dari nama host, sehingga nama yang terlalu kompleks dapat membingungkan beberapa resolver.

## Nama instans yang di-escape (`\032`)

Bonjour/DNS-SD sering meng-escape byte dalam nama instans layanan sebagai urutan desimal `\DDD` (spasi menjadi `\032`). Hal ini normal pada tingkat protokol; UI harus mendekodenya untuk ditampilkan (iOS menggunakan `BonjourEscapes.decode`).

## Mengaktifkan / menonaktifkan / konfigurasi

| Pengaturan                                              | Efek                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | Mengaktifkan Plugin penemuan LAN bawaan pada host yang tidak mengaktifkannya secara default. |
| `openclaw plugins disable bonjour`                   | Menonaktifkan pengiklanan multicast LAN dengan menonaktifkan Plugin bawaan.               |
| `OPENCLAW_DISABLE_BONJOUR=1` (atau `true`/`yes`/`on`)  | Menonaktifkan pengiklanan multicast LAN tanpa mengubah konfigurasi Plugin.                |
| `OPENCLAW_DISABLE_BONJOUR=0` (atau `false`/`no`/`off`) | Memaksa pengiklanan multicast LAN aktif, termasuk di dalam kontainer yang terdeteksi.        |
| `discovery.mdns.mode`                                | `off` \| `minimal` (default) \| `full` — lihat mode di atas.                         |
| `gateway.bind`                                       | Mengontrol mode pengikatan Gateway di `~/.openclaw/openclaw.json`.                    |
| `OPENCLAW_SSH_PORT`                                  | Mengganti port SSH saat `sshPort` diiklankan (mode penuh).                  |
| `OPENCLAW_TAILNET_DNS`                               | Menerbitkan petunjuk MagicDNS dalam TXT saat mode penuh mDNS diaktifkan.                  |
| `OPENCLAW_CLI_PATH`                                  | Mengganti path CLI yang diiklankan (mode penuh).                                    |

Host macOS secara default memulai otomatis Plugin penemuan LAN bawaan. Saat Plugin Bonjour diaktifkan dan `OPENCLAW_DISABLE_BONJOUR` tidak ditetapkan, Bonjour beriklan pada host normal dan otomatis dinonaktifkan di dalam kontainer yang terdeteksi (Docker, mesin Fly.io, dan runtime kontainer umum).

## Dokumentasi terkait

- Kebijakan penemuan dan pemilihan transportasi: [Penemuan](/id/gateway/discovery)
- Pemasangan Node + persetujuan: [Pemasangan Gateway](/id/gateway/pairing)
