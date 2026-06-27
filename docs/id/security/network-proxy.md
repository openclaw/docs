---
read_when:
    - Anda menginginkan pertahanan berlapis terhadap serangan SSRF dan DNS rebinding
    - Mengonfigurasi proksi penerus eksternal untuk lalu lintas runtime OpenClaw
summary: Cara merutekan lalu lintas HTTP dan WebSocket runtime OpenClaw melalui proxy pemfilteran yang dikelola operator
title: Proksi jaringan
x-i18n:
    generated_at: "2026-06-27T18:13:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3fc68d950037922ba3dc983c94a71bac3374750a02ef25f2c046cf782410be68
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw dapat merutekan lalu lintas HTTP dan WebSocket runtime melalui proksi penerusan yang dikelola operator. Ini adalah pertahanan berlapis opsional untuk deployment yang menginginkan kontrol egress terpusat, perlindungan SSRF yang lebih kuat, dan auditabilitas jaringan yang lebih baik.

OpenClaw tidak menyertakan, mengunduh, memulai, mengonfigurasi, atau mensertifikasi proksi. Anda menjalankan teknologi proksi yang sesuai dengan lingkungan Anda, dan OpenClaw merutekan klien HTTP dan WebSocket lokal proses normal melaluinya.

## Mengapa menggunakan proksi

Proksi memberi operator satu titik kontrol jaringan untuk lalu lintas HTTP dan WebSocket keluar. Itu dapat berguna bahkan di luar pengerasan SSRF:

- Kebijakan terpusat: pertahankan satu kebijakan egress alih-alih mengandalkan setiap call site HTTP aplikasi untuk menerapkan aturan jaringan dengan benar.
- Pemeriksaan saat koneksi: evaluasi tujuan setelah resolusi DNS dan tepat sebelum proksi membuka koneksi upstream.
- Pertahanan DNS rebinding: kurangi celah antara pemeriksaan DNS tingkat aplikasi dan koneksi keluar sebenarnya.
- Cakupan JavaScript yang lebih luas: rutekan klien biasa seperti `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch, dan klien serupa melalui jalur yang sama.
- Auditabilitas: catat tujuan yang diizinkan dan ditolak di batas egress.
- Kontrol operasional: terapkan aturan tujuan, segmentasi jaringan, batas laju, atau allowlist keluar tanpa membangun ulang OpenClaw.

Perutean proksi adalah guardrail tingkat proses untuk egress HTTP dan WebSocket normal. Ini memberi operator jalur fail-closed untuk merutekan klien HTTP JavaScript yang didukung melalui proksi pemfilteran mereka sendiri, tetapi ini bukan sandbox jaringan tingkat OS dan tidak membuat OpenClaw mensertifikasi kebijakan tujuan proksi.

## Cara OpenClaw merutekan lalu lintas

Saat `proxy.enabled=true` dan URL proksi dikonfigurasi, proses runtime terlindungi seperti `openclaw gateway run`, `openclaw node run`, dan `openclaw agent --local` merutekan egress HTTP dan WebSocket normal melalui proksi yang dikonfigurasi:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Kontrak publiknya adalah perilaku perutean, bukan hook Node internal yang digunakan untuk mengimplementasikannya. Klien WebSocket control plane OpenClaw Gateway menggunakan jalur langsung yang sempit untuk lalu lintas RPC Gateway local loopback saat URL Gateway menggunakan `localhost` atau IP loopback literal seperti `127.0.0.1` atau `[::1]`. Jalur control plane itu harus dapat menjangkau Gateway loopback bahkan ketika proksi operator memblokir tujuan loopback. Permintaan HTTP dan WebSocket runtime normal tetap menggunakan proksi yang dikonfigurasi.

Secara internal, OpenClaw memasang Proxyline sebagai runtime perutean tingkat proses untuk fitur ini. Proxyline mencakup `fetch`, klien berbasis undici, pemanggil inti Node `node:http` / `node:https`, klien WebSocket umum, dan tunnel CONNECT yang dibuat helper. Mode proksi terkelola menggantikan agen HTTP Node yang disediakan pemanggil agar agen eksplisit tidak secara tidak sengaja melewati proksi operator.

Beberapa plugin memiliki transport kustom yang membutuhkan wiring proksi eksplisit bahkan ketika perutean tingkat proses tersedia. Misalnya, transport Bot API Telegram menggunakan dispatcher HTTP/1 undici miliknya sendiri sehingga menghormati env proksi proses plus fallback terkelola `OPENCLAW_PROXY_URL` di jalur transport khusus pemilik tersebut.

URL proksi itu sendiri dapat menggunakan `http://` atau `https://`. Skema ini menjelaskan koneksi dari OpenClaw ke endpoint proksi:

- `http://proxy.example:3128`: OpenClaw membuka koneksi TCP polos ke proksi penerusan dan mengirim permintaan proksi HTTP, termasuk `CONNECT` untuk tujuan HTTPS.
- `https://proxy.example:8443`: OpenClaw membuka TLS ke endpoint proksi, memverifikasi sertifikat proksi, lalu mengirim permintaan proksi HTTP di dalam sesi TLS tersebut.

HTTPS tujuan terpisah dari TLS endpoint proksi. Untuk tujuan HTTPS, OpenClaw tetap meminta tunnel HTTP `CONNECT` kepada proksi lalu memulai TLS tujuan melalui tunnel tersebut.

Saat proksi aktif, OpenClaw menghapus `no_proxy` dan `NO_PROXY`. Daftar bypass tersebut berbasis tujuan, sehingga membiarkan `localhost` atau `127.0.0.1` di sana akan memungkinkan target SSRF berisiko tinggi melewati proksi pemfilteran.

Saat shutdown, OpenClaw memulihkan lingkungan proksi sebelumnya dan mereset status perutean proses yang di-cache.

## Istilah proksi terkait

- `proxy.enabled` / `proxy.proxyUrl`: perutean proksi penerusan keluar untuk egress runtime OpenClaw. Halaman ini mendokumentasikan fitur tersebut.
- `gateway.auth.mode: "trusted-proxy"`: autentikasi reverse proxy masuk yang sadar identitas untuk akses Gateway. Lihat [Autentikasi proksi tepercaya](/id/gateway/trusted-proxy-auth).
- `openclaw proxy`: proksi debug lokal dan inspektor capture untuk pengembangan dan dukungan. Lihat [openclaw proxy](/id/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opt-in untuk `web_fetch` agar proksi env HTTP(S) yang dikontrol operator dapat menyelesaikan DNS sambil mempertahankan pinning DNS ketat dan kebijakan hostname bawaan. Lihat [Web fetch](/id/tools/web-fetch#trusted-env-proxy).
- Pengaturan proksi khusus channel atau provider: override khusus pemilik untuk transport tertentu. Pilih proksi jaringan terkelola ketika tujuannya adalah kontrol egress terpusat di seluruh runtime.

## Konfigurasi

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Untuk endpoint proksi HTTPS dengan CA proksi privat:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

Anda juga dapat menyediakan URL melalui lingkungan, sambil tetap mempertahankan `proxy.enabled=true` dalam config:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` memiliki prioritas atas `OPENCLAW_PROXY_URL`.

### Mode Loopback Gateway

Klien control plane Gateway lokal biasanya terhubung ke WebSocket loopback seperti `ws://127.0.0.1:18789`. Gunakan `proxy.loopbackMode` untuk memilih bagaimana pengecualian proksi terkelola loopback berperilaku saat proksi terkelola aktif:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (default): OpenClaw mendaftarkan otoritas loopback Gateway dalam kebijakan bypass terkelola Proxyline sehingga lalu lintas WebSocket Gateway lokal dapat terhubung langsung. Port Gateway loopback kustom berfungsi karena host dan port URL Gateway aktif didaftarkan. Plugin browser bawaan juga dapat mendaftarkan endpoint kesiapan CDP lokal dan WebSocket DevTools yang persis untuk browser terkelola yang diluncurkan OpenClaw, dan provider embedding memori Ollama bawaan dapat menggunakan jalur langsung terjaga miliknya yang lebih sempit untuk origin embedding loopback host-lokal yang dikonfigurasi secara persis.
- `proxy`: OpenClaw tidak mendaftarkan bypass loopback Gateway atau Ollama, sehingga lalu lintas loopback tersebut dikirim melalui proksi terkelola. Jika proksi berada jarak jauh, proksi harus menyediakan perutean khusus untuk layanan loopback host OpenClaw, seperti memetakannya ke hostname, IP, atau tunnel yang dapat dijangkau proksi. Proksi jarak jauh standar menyelesaikan `127.0.0.1` dan `localhost` dari host proksi, bukan dari host OpenClaw.
- `block`: OpenClaw menolak koneksi control plane loopback Gateway dan koneksi loopback embedding host-lokal Ollama yang dijaga sebelum membuka socket.

Jika `enabled=true` tetapi tidak ada URL proksi valid yang dikonfigurasi, perintah terlindungi gagal saat startup alih-alih fallback ke akses jaringan langsung.

Untuk layanan gateway terkelola yang dimulai dengan `openclaw gateway start`, sebaiknya simpan URL dalam config:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Fallback lingkungan paling cocok untuk eksekusi foreground. Jika Anda menggunakannya dengan layanan terpasang, letakkan `OPENCLAW_PROXY_URL` dalam lingkungan tahan lama layanan, seperti `$OPENCLAW_STATE_DIR/.env` atau `~/.openclaw/.env`, lalu pasang ulang layanan agar launchd, systemd, atau Scheduled Tasks memulai gateway dengan nilai tersebut.

Untuk perintah `openclaw --container ...`, OpenClaw meneruskan `OPENCLAW_PROXY_URL` ke CLI anak yang ditargetkan ke kontainer saat variabel tersebut disetel. URL harus dapat dijangkau dari dalam kontainer; `127.0.0.1` merujuk ke kontainer itu sendiri, bukan host. OpenClaw menolak URL proksi loopback untuk perintah yang ditargetkan ke kontainer kecuali Anda secara eksplisit menimpa pemeriksaan keamanan tersebut.

## Persyaratan Proksi

Kebijakan proksi adalah batas keamanan. OpenClaw tidak dapat memverifikasi bahwa proksi memblokir target yang benar.

Konfigurasikan proksi untuk:

- Mengikat hanya ke loopback atau antarmuka privat tepercaya.
- Membatasi akses sehingga hanya proses, host, kontainer, atau akun layanan OpenClaw yang dapat menggunakannya.
- Menyelesaikan tujuan sendiri dan memblokir IP tujuan setelah resolusi DNS.
- Menerapkan kebijakan saat koneksi untuk permintaan HTTP polos maupun tunnel HTTPS `CONNECT`.
- Menolak bypass berbasis tujuan untuk rentang loopback, privat, link-local, metadata, multicast, reserved, atau dokumentasi.
- Menghindari allowlist hostname kecuali Anda sepenuhnya memercayai jalur resolusi DNS.
- Mencatat tujuan, keputusan, status, dan alasan tanpa mencatat body permintaan, header otorisasi, cookie, atau secret lain.
- Menyimpan kebijakan proksi dalam version control dan meninjau perubahan seperti konfigurasi sensitif keamanan.

## Tujuan yang direkomendasikan untuk diblokir

Gunakan denylist ini sebagai titik awal untuk setiap proksi penerusan, firewall, atau kebijakan egress.

Logika classifier tingkat aplikasi OpenClaw berada di `src/infra/net/ssrf.ts` dan `packages/net-policy/src/ip.ts`. Hook paritas yang relevan adalah `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX`, dan penanganan sentinel IPv4 tersemat untuk NAT64, 6to4, Teredo, ISATAP, dan bentuk IPv4-mapped. File-file tersebut adalah referensi berguna saat memelihara kebijakan proksi eksternal, tetapi OpenClaw tidak secara otomatis mengekspor atau menerapkan aturan tersebut dalam proksi Anda.

| Rentang atau host                                                                       | Alasan diblokir                                      |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                     | loopback IPv4                                        |
| `::1/128`                                                                               | loopback IPv6                                        |
| `0.0.0.0/8`, `::/128`                                                                   | Alamat tak ditentukan dan alamat jaringan-ini        |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                         | Jaringan privat RFC1918                              |
| `169.254.0.0/16`, `fe80::/10`                                                           | Alamat link-local dan jalur metadata cloud umum      |
| `169.254.169.254`, `metadata.google.internal`                                           | Layanan metadata cloud                               |
| `100.64.0.0/10`                                                                         | Ruang alamat bersama NAT tingkat operator            |
| `198.18.0.0/15`, `2001:2::/48`                                                          | Rentang benchmarking                                 |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32`    | Rentang penggunaan khusus dan dokumentasi            |
| `224.0.0.0/4`, `ff00::/8`                                                               | Multicast                                            |
| `240.0.0.0/4`                                                                           | IPv4 cadangan                                        |
| `fc00::/7`, `fec0::/10`                                                                 | Rentang lokal/privat IPv6                            |
| `100::/64`, `2001:20::/28`                                                              | Rentang discard IPv6 dan ORCHIDv2                    |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                        | Prefiks NAT64 dengan IPv4 tersemat                   |
| `2002::/16`, `2001::/32`                                                                | 6to4 dan Teredo dengan IPv4 tersemat                 |
| `::/96`, `::ffff:0:0/96`                                                                | IPv6 kompatibel-IPv4 dan IPv6 yang dipetakan ke IPv4 |

Jika penyedia cloud atau platform jaringan Anda mendokumentasikan host metadata atau rentang cadangan tambahan, tambahkan juga.

## Validasi

Validasikan proksi dari host, kontainer, atau akun layanan yang sama dengan yang menjalankan OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Untuk endpoint proksi HTTPS yang ditandatangani oleh CA privat:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

Secara default, ketika tidak ada tujuan kustom yang diberikan, perintah memeriksa bahwa `https://example.com/` berhasil dan memulai canary loopback sementara yang tidak boleh dijangkau oleh proksi. Pemeriksaan penolakan default lulus ketika proksi mengembalikan respons penolakan non-2xx atau memblokir canary dengan kegagalan transport; pemeriksaan gagal jika respons berhasil mencapai canary. Jika tidak ada proksi yang diaktifkan dan dikonfigurasi, validasi melaporkan masalah konfigurasi; gunakan `--proxy-url` untuk preflight sekali jalan sebelum mengubah konfigurasi. Gunakan `--allowed-url` dan `--denied-url` untuk menguji ekspektasi khusus deployment. Tambahkan `--apns-reachable` untuk juga memverifikasi bahwa pengiriman APNs HTTP/2 langsung dapat membuka tunnel CONNECT melalui proksi dan menerima respons APNs sandbox; probe memakai token penyedia yang sengaja tidak valid, sehingga `403 InvalidProviderToken` diharapkan dan dihitung sebagai dapat dijangkau. Tujuan penolakan kustom bersifat fail-closed: respons HTTP apa pun berarti tujuan dapat dijangkau melalui proksi, dan galat transport apa pun dilaporkan sebagai tidak meyakinkan karena OpenClaw tidak dapat membuktikan bahwa proksi memblokir origin yang dapat dijangkau. Pada kegagalan validasi, perintah keluar dengan kode 1.

Gunakan `--json` untuk otomasi. Keluaran JSON berisi hasil keseluruhan, sumber konfigurasi proksi efektif, galat konfigurasi apa pun, dan setiap pemeriksaan tujuan. Kredensial URL proksi disamarkan dalam keluaran teks dan JSON:

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
    {
      "kind": "allowed",
      "url": "https://example.com/",
      "ok": true,
      "status": 200
    },
    {
      "kind": "apns",
      "url": "https://api.sandbox.push.apple.com",
      "ok": true,
      "status": 403
    }
  ]
}
```

Anda juga dapat memvalidasi secara manual dengan `curl`:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

Permintaan publik seharusnya berhasil. Permintaan loopback dan metadata seharusnya diblokir oleh proksi. Untuk `openclaw proxy validate`, canary loopback bawaan dapat membedakan penolakan proksi dari origin yang dapat dijangkau. Pemeriksaan `--denied-url` kustom tidak memiliki canary itu, jadi perlakukan respons HTTP maupun kegagalan transport ambigu sebagai kegagalan validasi kecuali proksi Anda mengekspos sinyal penolakan khusus deployment yang dapat Anda verifikasi secara terpisah.

## Kepercayaan CA proksi

Gunakan `proxy.tls.caFile` terkelola ketika endpoint proksi itu sendiri memakai sertifikat yang ditandatangani oleh CA privat:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

CA tersebut digunakan untuk verifikasi TLS endpoint proksi. Ini bukan pengaturan kepercayaan MITM tujuan, bukan sertifikat klien, dan bukan pengganti kebijakan tujuan proksi.

Gunakan `NODE_EXTRA_CA_CERTS` hanya ketika seluruh proses Node harus memercayai CA tambahan sejak startup proses, seperti ketika sistem inspeksi TLS perusahaan menandatangani ulang sertifikat tujuan untuk setiap klien HTTPS dalam proses. `NODE_EXTRA_CA_CERTS` bersifat global untuk proses dan harus ada sebelum Node dimulai. Utamakan `proxy.tls.caFile` untuk kepercayaan endpoint proksi HTTPS karena cakupannya terbatas pada routing proksi terkelola.

Lalu aktifkan routing proksi OpenClaw:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

atau atur:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

## Batasan

- Proksi meningkatkan cakupan untuk klien HTTP JavaScript dan WebSocket lokal proses, tetapi ini bukan sandbox jaringan tingkat OS.
- Lalu lintas control-plane loopback Gateway secara default memakai bypass lokal langsung melalui `proxy.loopbackMode: "gateway-only"`. OpenClaw menerapkan bypass itu dengan mendaftarkan otoritas loopback Gateway aktif dalam kebijakan bypass terkelola Proxyline. Operator dapat mengatur `proxy.loopbackMode: "proxy"` untuk mengirim lalu lintas loopback Gateway melalui proksi terkelola, atau `proxy.loopbackMode: "block"` untuk menolak koneksi Gateway loopback. Lihat [Mode Loopback Gateway](#gateway-loopback-mode) untuk catatan penting proksi jarak jauh.
- Socket mentah `net`, `tls`, dan `http2`, addon native, serta proses turunan non-OpenClaw dapat melewati routing proksi tingkat Node kecuali proses tersebut mewarisi dan mematuhi variabel lingkungan proksi. CLI turunan OpenClaw yang di-fork mewarisi URL proksi terkelola dan status `proxy.loopbackMode`.
- IRC adalah kanal TCP/TLS mentah di luar routing proksi forward yang dikelola operator. Dalam deployment yang mengharuskan semua egress melalui proksi forward tersebut, atur `channels.irc.enabled=false` kecuali egress IRC langsung disetujui secara eksplisit.
- Proksi debug lokal adalah tooling diagnostik dan penerusan upstream langsungnya untuk permintaan proksi serta tunnel CONNECT dinonaktifkan secara default saat mode proksi terkelola aktif; aktifkan penerusan langsung hanya untuk diagnostik lokal yang disetujui.
- WebUI lokal pengguna dan server model lokal harus dimasukkan ke allowlist dalam kebijakan proksi operator bila diperlukan; OpenClaw tidak mengekspos bypass jaringan lokal umum untuk keduanya. Penyedia embedding memori Ollama bawaan lebih sempit: penyedia ini dapat memakai jalur langsung yang dijaga hanya untuk origin embedding loopback lokal-host persis yang diturunkan dari `baseUrl` terkonfigurasi agar embedding lokal-host tetap berfungsi ketika proksi terkelola tidak dapat menjangkau loopback host. Host embedding Ollama LAN, tailnet, jaringan privat, dan publik tetap memakai jalur proksi terkelola. `proxy.loopbackMode: "proxy"` mengirim lalu lintas loopback Ollama ini melalui proksi terkelola, dan `proxy.loopbackMode: "block"` menolaknya sebelum membuka koneksi.
- Bypass proksi control-plane Gateway sengaja dibatasi ke `localhost` dan URL IP loopback literal. Gunakan `ws://127.0.0.1:18789`, `ws://[::1]:18789`, atau `ws://localhost:18789` untuk koneksi control-plane Gateway lokal langsung; hostname lain dirutekan seperti lalu lintas berbasis hostname biasa.
- OpenClaw tidak menginspeksi, menguji, atau mensertifikasi kebijakan proksi Anda.
- Perlakukan perubahan kebijakan proksi sebagai perubahan operasional yang sensitif terhadap keamanan.

| Permukaan                                                    | Status proksi terkelola                                                                            |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, klien WebSocket umum     | Dirutekan melalui hook proksi terkelola ketika dikonfigurasi.                                      |
| APNs HTTP/2 langsung                                         | Dirutekan melalui helper CONNECT terkelola APNs.                                                   |
| Loopback control-plane Gateway                               | Langsung hanya untuk URL Gateway loopback lokal yang dikonfigurasi.                                |
| Penerusan upstream proksi debug                              | Dinonaktifkan saat mode proksi terkelola aktif kecuali diaktifkan secara eksplisit untuk diagnostik lokal. |
| IRC                                                          | TCP/TLS mentah; tidak diproksikan oleh mode proksi HTTP terkelola. Nonaktifkan kecuali egress IRC langsung disetujui. |
| Panggilan klien `net`, `tls`, atau `http2` mentah lainnya    | Harus diklasifikasikan oleh penjaga socket mentah sebelum masuk.                                   |
