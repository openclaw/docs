---
read_when:
    - Anda menginginkan pertahanan berlapis terhadap serangan SSRF dan DNS rebinding
    - Mengonfigurasi proksi penerusan eksternal untuk lalu lintas runtime OpenClaw
summary: Cara merutekan lalu lintas HTTP dan WebSocket runtime OpenClaw melalui proksi pemfilteran yang dikelola operator
title: Proksi jaringan
x-i18n:
    generated_at: "2026-07-12T14:42:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd82684a17a79242891eca69c549c0bfcdd5bde40fa4e791dda7f2b62c473c89
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw dapat merutekan lalu lintas HTTP dan WebSocket runtime melalui proksi penerusan yang dikelola operator. Ini merupakan pertahanan berlapis opsional: kontrol lalu lintas keluar terpusat, perlindungan SSRF yang lebih kuat, dan kemampuan audit tujuan pada batas jaringan. Karena proksi mengevaluasi tujuan pada saat koneksi, setelah resolusi DNS dan tepat sebelum membuka koneksi hulu, proksi juga mempersempit celah yang dimanfaatkan serangan pengikatan ulang DNS antara pemeriksaan DNS tingkat aplikasi sebelumnya dan koneksi keluar yang sebenarnya. Satu kebijakan proksi juga memberi operator satu tempat untuk menerapkan aturan tujuan, segmentasi jaringan, batas laju, atau daftar izin keluar tanpa membangun ulang OpenClaw.

OpenClaw tidak menyertakan, mengunduh, memulai, mengonfigurasi, atau menyertifikasi proksi. Anda menjalankan teknologi proksi yang sesuai dengan lingkungan Anda; OpenClaw merutekan klien HTTP dan WebSocket miliknya sendiri melalui proksi tersebut.

## Konfigurasi

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Anda juga dapat menetapkan URL melalui lingkungan selama `proxy.enabled: true` tetap berada dalam konfigurasi:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` lebih diprioritaskan daripada `OPENCLAW_PROXY_URL`. Jika `proxy.enabled` bernilai `true`, tetapi tidak ada URL valid yang dapat ditentukan, perintah yang dilindungi gagal dimulai alih-alih beralih kembali ke akses jaringan langsung.

| Kunci                | Jenis                                | Bawaan         | Catatan                                                                                                                                           |
| -------------------- | ------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.enabled`      | boolean                              | tidak ditetapkan | Harus bernilai `true` untuk mengaktifkan perutean.                                                                                                 |
| `proxy.proxyUrl`     | string                               | tidak ditetapkan | URL proksi penerusan `http://` atau `https://`. Kredensial yang disematkan dalam URL dianggap sensitif dan disamarkan dari snapshot/log.           |
| `proxy.tls.caFile`   | string                               | tidak ditetapkan | Bundel CA untuk memverifikasi titik akhir proksi `https://` yang ditandatangani oleh CA privat.                                                    |
| `proxy.loopbackMode` | `gateway-only` \| `proxy` \| `block` | `gateway-only` | Mengontrol perilaku pengabaian loopback; lihat di bawah.                                                                                           |

Untuk layanan Gateway terkelola, simpan URL dalam konfigurasi agar tetap tersedia setelah penginstalan ulang, alih-alih mengandalkan variabel lingkungan proses latar depan:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Penggunaan cadangan variabel lingkungan `OPENCLAW_PROXY_URL` paling sesuai untuk proses latar depan. Untuk menggunakannya dengan layanan yang telah diinstal, letakkan variabel tersebut dalam lingkungan persisten layanan (`$OPENCLAW_STATE_DIR/.env`, bawaan `~/.openclaw/.env`), lalu instal ulang agar launchd/systemd/Scheduled Tasks mengambilnya.

### Titik akhir proksi HTTPS dengan CA privat

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

`proxy.tls.caFile` memverifikasi sertifikat TLS milik titik akhir proksi. Ini bukan pengaturan kepercayaan MITM tujuan, sertifikat klien, atau pengganti kebijakan tujuan proksi. Gunakan `NODE_EXTRA_CA_CERTS` hanya ketika seluruh proses Node harus memercayai CA tambahan sejak dimulai (misalnya, sistem inspeksi TLS perusahaan yang menandatangani ulang setiap sertifikat tujuan HTTPS) — variabel tersebut berlaku untuk seluruh proses dan harus ditetapkan sebelum Node dimulai, sehingga OpenClaw tidak dapat menerapkannya saat proses berjalan seperti halnya `proxy.tls.caFile`. Utamakan `proxy.tls.caFile` untuk kepercayaan terhadap titik akhir proksi HTTPS: cakupannya terbatas pada perutean proksi terkelola, bukan seluruh proses.

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

## Cara kerja perutean

Dengan `proxy.enabled: true` dan URL yang valid, proses runtime yang dilindungi (`openclaw gateway run`, `openclaw node run`, `openclaw agent --local`) merutekan lalu lintas keluar HTTP dan WebSocket biasa melalui proksi:

```text
Proses OpenClaw
  klien fetch, node:http, node:https, WebSocket  -> proksi operator -> tujuan
```

Secara internal, OpenClaw memasang [Proxyline](https://github.com/openclaw/proxyline) sebagai runtime perutean tingkat proses. Runtime ini mencakup `fetch`, klien berbasis undici, `node:http`/`node:https`, klien WebSocket umum, dan terowongan `CONNECT` yang dibuat oleh pembantu, serta mengganti agen HTTP Node yang disediakan pemanggil sehingga agen eksplisit (termasuk `axios`, `got`, `node-fetch`, dan klien serupa yang berbasis agen Node) tidak dapat melewati proksi secara diam-diam.

Skema URL proksi menjelaskan lintasan dari OpenClaw ke proksi, bukan ke tujuan akhir:

- `http://proxy.example:3128` — TCP biasa ke proksi; OpenClaw mengirim permintaan proksi HTTP, termasuk `CONNECT` untuk tujuan HTTPS.
- `https://proxy.example:8443` — OpenClaw membuka TLS ke proksi itu sendiri (dengan memverifikasi sertifikat proksi), lalu mengirim permintaan proksi HTTP di dalam sesi tersebut.

TLS tujuan tidak bergantung pada TLS titik akhir proksi: untuk tujuan HTTPS, OpenClaw selalu meminta terowongan `CONNECT` kepada proksi dan memulai TLS tujuan melalui terowongan tersebut.

Saat proksi aktif, OpenClaw menghapus `no_proxy`/`NO_PROXY`. Daftar pengabaian tersebut berbasis tujuan; membiarkan `localhost` atau `127.0.0.1` di dalamnya akan memungkinkan target SSRF melewati proksi sepenuhnya. Saat dimatikan, OpenClaw memulihkan lingkungan proksi sebelumnya dan mengatur ulang status perutean yang disimpan dalam cache.

Beberapa Plugin memiliki transportasi khusus yang memerlukan pengaturan proksi tersendiri meskipun perutean tingkat proses aktif. Klien Bot API Telegram menggunakan dispatcher undici HTTP/1 miliknya sendiri dan secara terpisah mematuhi variabel lingkungan proksi proses serta penggunaan cadangan `OPENCLAW_PROXY_URL`.

### Mode loopback Gateway

Klien bidang kontrol Gateway lokal biasanya terhubung ke WebSocket loopback seperti `ws://127.0.0.1:18789`. `proxy.loopbackMode` mengontrol apakah lalu lintas tersebut melewati proksi terkelola:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, atau block
```

| Mode                     | Perilaku                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway-only` (bawaan)  | OpenClaw mendaftarkan otoritas loopback Gateway aktif sebagai pengecualian koneksi langsung, sehingga lalu lintas WebSocket Gateway lokal terhubung tanpa proksi. Porta loopback khusus berfungsi karena pengecualian menargetkan host/porta persis yang dikonfigurasi. Plugin peramban bawaan mendaftarkan jenis pengecualian yang sama untuk URL kesiapan CDP lokal dan WebSocket DevTools yang persis dari peramban terkelola yang diluncurkan OpenClaw; penyedia penyematan memori Ollama bawaan memiliki jalur langsung terlindungi yang lebih sempit untuk asal penyematan loopback lokal-host persis yang dikonfigurasi. |
| `proxy`                  | Tidak ada pengecualian loopback yang didaftarkan; lalu lintas loopback Gateway dan Ollama melewati proksi. Proksi jarak jauh harus dapat merutekan kembali ke layanan loopback host OpenClaw (misalnya melalui nama host, IP, atau terowongan yang dapat dijangkau) — proksi jarak jauh standar menentukan `127.0.0.1`/`localhost` terhadap dirinya sendiri, bukan terhadap host OpenClaw.                                                                                                                                                                                                                          |
| `block`                  | OpenClaw menolak koneksi bidang kontrol loopback Gateway dan koneksi penyematan loopback Ollama yang dilindungi sebelum membuka soket.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

Pengabaian bidang kontrol Gateway dibatasi pada `localhost` dan URL IP loopback literal — gunakan `ws://127.0.0.1:18789`, `ws://[::1]:18789`, atau `ws://localhost:18789`. Nama host lainnya dirutekan seperti lalu lintas biasa.

### Kontainer

Untuk perintah `openclaw --container ...`, OpenClaw meneruskan `OPENCLAW_PROXY_URL` ke CLI anak yang ditargetkan ke kontainer ketika variabel tersebut ditetapkan. URL harus dapat dijangkau dari dalam kontainer — `127.0.0.1` di sana merujuk ke kontainer itu sendiri, bukan host. OpenClaw menolak URL proksi loopback untuk perintah yang ditargetkan ke kontainer kecuali Anda menetapkan `OPENCLAW_CONTAINER_ALLOW_LOOPBACK_PROXY_URL=1` untuk secara eksplisit mengesampingkan pemeriksaan tersebut.

## Istilah proksi terkait

- `proxy.enabled` / `proxy.proxyUrl` — perutean proksi penerusan keluar untuk lalu lintas keluar runtime. Halaman ini.
- `gateway.auth.mode: "trusted-proxy"` — autentikasi proksi balik masuk yang sadar identitas untuk akses Gateway. Lihat [Autentikasi proksi tepercaya](/id/gateway/trusted-proxy-auth).
- `openclaw proxy` — proksi debug lokal dan pemeriksa tangkapan untuk pengembangan dan dukungan. Lihat [openclaw proxy](/id/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy` — keikutsertaan opsional bagi `web_fetch` untuk mengizinkan proksi lingkungan HTTP(S) yang dikontrol operator menentukan DNS sambil tetap mempertahankan penyematan DNS ketat dan kebijakan nama host secara bawaan. Lihat [Pengambilan web](/id/tools/web-fetch#trusted-env-proxy).
- Pengaturan proksi khusus saluran atau penyedia — pengesampingan khusus pemilik untuk satu transportasi. Utamakan proksi jaringan terkelola untuk kontrol lalu lintas keluar terpusat di seluruh runtime.

## Memvalidasi proksi

Kebijakan tujuan proksi merupakan batas keamanan yang sebenarnya; OpenClaw tidak dapat memverifikasi bahwa proksi Anda memblokir target yang tepat. Konfigurasikan proksi untuk:

- Mengikat hanya ke loopback atau antarmuka privat tepercaya yang hanya dapat dijangkau oleh proses/host/kontainer/akun layanan OpenClaw.
- Menentukan tujuan sendiri dan memblokir berdasarkan IP setelah resolusi DNS, pada saat koneksi, baik untuk HTTP biasa maupun terowongan `CONNECT` HTTPS.
- Menolak pengabaian berbasis tujuan untuk rentang loopback, privat, link-local, metadata, multicast, khusus, dan dokumentasi.
- Menghindari daftar izin nama host kecuali Anda sepenuhnya memercayai jalur resolusi DNS.
- Mencatat tujuan, keputusan, status, dan alasan — jangan pernah mencatat isi permintaan, header otorisasi, kuki, atau rahasia lainnya.
- Menyimpan kebijakan dalam kontrol versi dan meninjau perubahan sebagai hal yang sensitif terhadap keamanan.

Validasi dari host/kontainer/akun layanan yang sama dengan yang menjalankan OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Dengan titik akhir proksi HTTPS ber-CA privat:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

| Flag                     | Tujuan                                                               |
| ------------------------ | -------------------------------------------------------------------- |
| `--proxy-url <url>`      | Validasi URL ini alih-alih menentukan config/env.                    |
| `--proxy-ca-file <path>` | Bundel CA untuk titik akhir proxy HTTPS.                             |
| `--allowed-url <url>`    | Tujuan yang diharapkan berhasil (dapat diulang).                     |
| `--denied-url <url>`     | Tujuan yang diharapkan diblokir (dapat diulang).                     |
| `--apns-reachable`       | Verifikasi juga bahwa proxy dapat membuat terowongan untuk pemeriksaan langsung HTTP/2 APNs sandbox. |
| `--apns-authority <url>` | Timpa otoritas APNs yang diperiksa dengan `--apns-reachable`.        |
| `--timeout-ms <ms>`      | Batas waktu per permintaan.                                         |
| `--json`                 | Keluaran yang dapat dibaca mesin.                                   |

Jika `proxy.enabled` bukan `true` dan tidak ada `--proxy-url` yang diberikan, perintah akan melaporkan masalah konfigurasi alih-alih melakukan validasi; berikan `--proxy-url` untuk pemeriksaan awal satu kali sebelum mengubah konfigurasi.

Tanpa `--allowed-url`/`--denied-url`, pemeriksaan bawaannya adalah: `https://example.com/` harus berhasil, dan server kanari local loopback sementara yang tidak boleh dijangkau proxy harus diblokir. Pemeriksaan local loopback dinyatakan berhasil jika terjadi kegagalan transportasi, atau jika respons non-2xx tidak memiliki token per-eksekusi milik kanari; pemeriksaan dinyatakan gagal pada respons 2xx tanpa token tersebut (keberhasilan tak terduga dari sesuatu selain kanari) dan, terutama, pada respons apa pun yang membawa token yang cocok, karena hal itu membuktikan bahwa proxy benar-benar meneruskan tujuan local loopback yang seharusnya ditolak. Target `--denied-url` khusus tidak memiliki token kanari seperti itu, sehingga target tersebut bersifat gagal-tertutup: respons HTTP apa pun dianggap dapat dijangkau (gagal), dan kesalahan transportasi dilaporkan sebagai tidak meyakinkan, bukan terbukti diblokir, karena OpenClaw tidak dapat memastikan apakah proxy Anda menolak asal yang dapat dijangkau atau ada hal lain yang bermasalah. `--apns-reachable` mengirim token penyedia yang sengaja dibuat tidak valid, sehingga respons `403 InvalidProviderToken` dianggap sebagai bukti bahwa terowongan mencapai Apple. Perintah keluar dengan kode `1` jika ada kegagalan validasi; kredensial URL proxy disamarkan dari keluaran teks maupun JSON.

```json
{
  "ok": true,
  "config": {
    "enabled": true,
    "proxyUrl": "http://127.0.0.1:3128/",
    "source": "override",
    "errors": []
  },
  "checks": [
    { "kind": "allowed", "url": "https://example.com/", "ok": true, "status": 200 },
    { "kind": "apns", "url": "https://api.sandbox.push.apple.com", "ok": true, "status": 403 }
  ]
}
```

Pemeriksaan `curl` manual (permintaan publik harus berhasil; permintaan local loopback dan metadata harus diblokir oleh proxy itu sendiri — `curl` saja tidak dapat membedakan penolakan proxy dari asal yang tidak dapat dijangkau seperti yang dapat dilakukan kanari bawaan `openclaw proxy validate`):

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

## Tujuan yang disarankan untuk diblokir

Daftar penolakan awal untuk setiap proxy penerusan, firewall, atau kebijakan lalu lintas keluar. Pengklasifikasi SSRF milik OpenClaw berada di `src/infra/net/ssrf.ts` dan `packages/net-policy/src/ip.ts` (`BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, prefiks tolok ukur RFC 2544, serta penanganan IPv4 tertanam untuk bentuk NAT64/6to4/Teredo/ISATAP/IPv4-terpetakan) — referensi yang berguna, tetapi OpenClaw tidak mengekspor atau memberlakukan aturan ini pada proxy eksternal Anda.

| Rentang atau host                                                                      | Alasan untuk memblokir                            |
| -------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                    | local loopback IPv4                               |
| `::1/128`                                                                              | local loopback IPv6                               |
| `0.0.0.0/8`, `::/128`                                                                  | Alamat tidak ditentukan/jaringan ini              |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                        | Jaringan privat RFC 1918                          |
| `169.254.0.0/16`, `fe80::/10`                                                          | Lokal-tautan, termasuk jalur metadata cloud umum  |
| `169.254.169.254`, `metadata.google.internal`                                          | Layanan metadata cloud                            |
| `100.64.0.0/10`                                                                        | Ruang alamat bersama NAT tingkat operator         |
| `198.18.0.0/15`, `2001:2::/48`                                                         | Rentang tolok ukur                                 |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32`   | Rentang penggunaan khusus dan dokumentasi         |
| `224.0.0.0/4`, `ff00::/8`                                                              | Multicast                                         |
| `240.0.0.0/4`                                                                          | IPv4 yang dicadangkan                             |
| `fc00::/7`, `fec0::/10`                                                                | Rentang lokal/privat IPv6                         |
| `100::/64`, `2001:20::/28`                                                             | Rentang pembuangan IPv6 dan ORCHIDv2              |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                       | Prefiks NAT64 dengan IPv4 tertanam                |
| `2002::/16`, `2001::/32`                                                               | 6to4 dan Teredo dengan IPv4 tertanam              |
| `::/96`, `::ffff:0:0/96`                                                               | IPv6 kompatibel IPv4 dan IPv6 terpetakan IPv4     |

Tambahkan host metadata atau rentang cadangan lain yang didokumentasikan oleh penyedia cloud atau platform jaringan Anda.

## Batasan

| Permukaan                                                     | Status proxy terkelola                                                                                                                                     |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, klien WebSocket umum      | Dirutekan melalui kait proxy terkelola saat dikonfigurasi.                                                                                                 |
| HTTP/2 langsung APNs                                          | Dirutekan melalui pembantu `CONNECT` terkelola APNs.                                                                                                       |
| local loopback bidang kendali Gateway                         | Langsung hanya untuk URL Gateway local loopback terkonfigurasi yang sama persis.                                                                            |
| Penerusan hulu proxy debug                                    | Dinonaktifkan saat mode proxy terkelola aktif, kecuali diaktifkan secara eksplisit untuk diagnostik lokal.                                                 |
| IRC                                                           | TCP/TLS mentah; tidak diproksikan oleh mode proxy HTTP terkelola. Atur `channels.irc.enabled: false` jika penerapan Anda mengharuskan semua lalu lintas keluar melalui proxy penerusan. |
| Panggilan klien `net`, `tls`, atau `http2` mentah lainnya     | Harus diklasifikasikan oleh penjaga soket mentah sebelum diterapkan.                                                                                        |

- Ini adalah cakupan tingkat proses untuk klien HTTP/WebSocket JavaScript, bukan sandbox jaringan tingkat OS.
- Soket `net`, `tls`, `http2` mentah, pengaya native, dan proses anak non-OpenClaw dapat melewati perutean tingkat Node kecuali proses tersebut mewarisi dan mematuhi variabel lingkungan proxy. CLI anak OpenClaw hasil fork mewarisi URL proxy terkelola dan status `proxy.loopbackMode`.
- WebUI lokal pengguna dan server model lokal tidak tercakup oleh pengabaian jaringan lokal umum — masukkan ke daftar izin dalam kebijakan proxy operator jika diperlukan. Pengecualiannya adalah jalur langsung terlindungi milik penyedia penyematan memori Ollama bawaan, yang dibatasi pada asal local loopback host-lokal yang sama persis dari `baseUrl` terkonfigurasinya; host Ollama di LAN, tailnet, jaringan privat, dan publik tetap menggunakan proxy terkelola.
- Penerusan hulu langsung milik proxy debug lokal (untuk permintaan proxy dan terowongan `CONNECT`) dinonaktifkan secara bawaan saat mode proxy terkelola aktif; aktifkan hanya untuk diagnostik lokal yang disetujui.
- OpenClaw tidak memeriksa, menguji, atau menyertifikasi kebijakan proxy Anda. Perlakukan perubahan kebijakan proxy sebagai perubahan operasional yang sensitif terhadap keamanan.
