---
read_when:
    - Anda menginginkan pertahanan berlapis terhadap serangan SSRF dan DNS rebinding
    - Mengonfigurasi proksi forward eksternal untuk lalu lintas runtime OpenClaw
summary: Cara merutekan lalu lintas HTTP dan WebSocket saat OpenClaw berjalan melalui proxy penyaringan yang dikelola operator
title: Proksi jaringan
x-i18n:
    generated_at: "2026-05-06T17:59:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: aed1cd94ce6a32cd8a3f6c7e579011992af87c1ccc40eb53efaa83b020a6792b
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw dapat merutekan lalu lintas HTTP dan WebSocket runtime melalui proxy maju yang dikelola operator. Ini adalah pertahanan berlapis opsional untuk penerapan yang menginginkan kontrol egress terpusat, perlindungan SSRF yang lebih kuat, dan auditabilitas jaringan yang lebih baik.

OpenClaw tidak menyertakan, mengunduh, memulai, mengonfigurasi, atau mensertifikasi proxy. Anda menjalankan teknologi proxy yang sesuai dengan lingkungan Anda, dan OpenClaw merutekan klien HTTP serta WebSocket normal yang bersifat lokal proses melaluinya.

## Mengapa menggunakan proxy

Proxy memberi operator satu titik kontrol jaringan untuk lalu lintas HTTP dan WebSocket keluar. Itu dapat berguna bahkan di luar penguatan SSRF:

- Kebijakan terpusat: kelola satu kebijakan egress alih-alih mengandalkan setiap lokasi pemanggilan HTTP aplikasi untuk menerapkan aturan jaringan dengan benar.
- Pemeriksaan saat koneksi: evaluasi tujuan setelah resolusi DNS dan tepat sebelum proxy membuka koneksi upstream.
- Pertahanan terhadap DNS rebinding: kurangi celah antara pemeriksaan DNS tingkat aplikasi dan koneksi keluar yang sebenarnya.
- Cakupan JavaScript yang lebih luas: rutekan `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch, dan klien serupa melalui jalur yang sama.
- Auditabilitas: catat tujuan yang diizinkan dan ditolak di batas egress.
- Kontrol operasional: terapkan aturan tujuan, segmentasi jaringan, batas laju, atau allowlist keluar tanpa membangun ulang OpenClaw.

Perutean proxy adalah pagar pembatas tingkat proses untuk egress HTTP dan WebSocket normal. Ini memberi operator jalur fail-closed untuk merutekan klien HTTP JavaScript yang didukung melalui proxy penyaringan mereka sendiri, tetapi ini bukan sandbox jaringan tingkat OS dan tidak membuat OpenClaw mensertifikasi kebijakan tujuan proxy.

## Cara OpenClaw merutekan lalu lintas

Saat `proxy.enabled=true` dan URL proxy dikonfigurasi, proses runtime terlindungi seperti `openclaw gateway run`, `openclaw node run`, dan `openclaw agent --local` merutekan egress HTTP dan WebSocket normal melalui proxy yang dikonfigurasi:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Kontrak publiknya adalah perilaku perutean, bukan hook Node internal yang digunakan untuk mengimplementasikannya. Klien WebSocket control plane OpenClaw Gateway menggunakan jalur langsung yang sempit untuk lalu lintas RPC Gateway local loopback ketika URL Gateway menggunakan `localhost` atau IP loopback literal seperti `127.0.0.1` atau `[::1]`. Jalur control plane itu harus dapat menjangkau Gateway loopback bahkan ketika proxy operator memblokir tujuan loopback. Permintaan HTTP dan WebSocket runtime normal tetap menggunakan proxy yang dikonfigurasi.

Secara internal, OpenClaw menggunakan dua hook perutean tingkat proses untuk fitur ini:

- Perutean dispatcher Undici mencakup `fetch`, klien berbasis undici, dan transport yang menyediakan dispatcher undici sendiri.
- Perutean `global-agent` mencakup pemanggil inti Node `node:http` dan `node:https`, termasuk banyak pustaka yang dibangun di atas `http.request`, `https.request`, `http.get`, dan `https.get`. Mode proxy terkelola memaksa agent global itu agar agent HTTP Node eksplisit tidak secara tidak sengaja melewati proxy operator.

Beberapa Plugin memiliki transport khusus yang memerlukan pengkabelan proxy eksplisit bahkan ketika perutean tingkat proses tersedia. Misalnya, transport Bot API Telegram menggunakan dispatcher undici HTTP/1 miliknya sendiri dan karena itu mematuhi env proxy proses serta fallback `OPENCLAW_PROXY_URL` terkelola di jalur transport khusus pemilik tersebut.

URL proxy itu sendiri harus menggunakan `http://`. Tujuan HTTPS tetap didukung melalui proxy dengan HTTP `CONNECT`; ini hanya berarti OpenClaw mengharapkan listener proxy maju HTTP polos seperti `http://127.0.0.1:3128`.

Saat proxy aktif, OpenClaw menghapus `no_proxy`, `NO_PROXY`, dan `GLOBAL_AGENT_NO_PROXY`. Daftar bypass tersebut berbasis tujuan, sehingga membiarkan `localhost` atau `127.0.0.1` di sana akan membuat target SSRF berisiko tinggi melewati proxy penyaringan.

Saat shutdown, OpenClaw memulihkan lingkungan proxy sebelumnya dan mereset status perutean proses yang di-cache.

## Istilah proxy terkait

- `proxy.enabled` / `proxy.proxyUrl`: perutean proxy maju keluar untuk egress runtime OpenClaw. Halaman ini mendokumentasikan fitur tersebut.
- `gateway.auth.mode: "trusted-proxy"`: autentikasi reverse proxy masuk yang sadar identitas untuk akses Gateway. Lihat [autentikasi proxy tepercaya](/id/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy debug lokal dan inspektur capture untuk pengembangan dan dukungan. Lihat [openclaw proxy](/id/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opt-in untuk `web_fetch` agar proxy env HTTP(S) yang dikendalikan operator dapat menyelesaikan DNS sambil mempertahankan penyematan DNS ketat dan kebijakan hostname default. Lihat [Web fetch](/id/tools/web-fetch#trusted-env-proxy).
- Pengaturan proxy khusus channel atau provider: override khusus pemilik untuk transport tertentu. Utamakan proxy jaringan terkelola ketika tujuannya adalah kontrol egress terpusat di seluruh runtime.

## Konfigurasi

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Anda juga dapat menyediakan URL melalui lingkungan, sambil tetap mempertahankan `proxy.enabled=true` dalam konfigurasi:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` diprioritaskan atas `OPENCLAW_PROXY_URL`.

### Mode Loopback Gateway

Klien control plane Gateway lokal biasanya terhubung ke WebSocket loopback seperti `ws://127.0.0.1:18789`. Gunakan `proxy.loopbackMode` untuk memilih bagaimana lalu lintas itu berperilaku saat proxy terkelola aktif:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (default): OpenClaw mendaftarkan authority loopback Gateway di controller `NO_PROXY` `global-agent` yang aktif sehingga lalu lintas WebSocket Gateway lokal dapat terhubung secara langsung. Port Gateway loopback kustom berfungsi karena host dan port URL Gateway aktif didaftarkan.
- `proxy`: OpenClaw tidak mendaftarkan authority `NO_PROXY` loopback Gateway, sehingga lalu lintas Gateway lokal dikirim melalui proxy terkelola. Jika proxy bersifat remote, proxy itu harus menyediakan perutean khusus untuk layanan loopback host OpenClaw, seperti memetakannya ke hostname, IP, atau tunnel yang dapat dijangkau proxy. Proxy remote standar menyelesaikan `127.0.0.1` dan `localhost` dari host proxy, bukan dari host OpenClaw.
- `block`: OpenClaw menolak koneksi control plane Gateway loopback sebelum membuka socket.

Jika `enabled=true` tetapi tidak ada URL proxy valid yang dikonfigurasi, perintah terlindungi gagal saat startup alih-alih fallback ke akses jaringan langsung.

Untuk layanan Gateway terkelola yang dimulai dengan `openclaw gateway start`, sebaiknya simpan URL dalam konfigurasi:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Fallback lingkungan paling cocok untuk eksekusi foreground. Jika Anda menggunakannya dengan layanan terinstal, letakkan `OPENCLAW_PROXY_URL` di lingkungan tahan lama layanan, seperti `$OPENCLAW_STATE_DIR/.env` atau `~/.openclaw/.env`, lalu instal ulang layanan agar launchd, systemd, atau Scheduled Tasks memulai Gateway dengan nilai tersebut.

Untuk perintah `openclaw --container ...`, OpenClaw meneruskan `OPENCLAW_PROXY_URL` ke CLI anak yang ditargetkan ke container saat nilai itu disetel. URL harus dapat dijangkau dari dalam container; `127.0.0.1` merujuk ke container itu sendiri, bukan host. OpenClaw menolak URL proxy loopback untuk perintah yang ditargetkan ke container kecuali Anda secara eksplisit mengesampingkan pemeriksaan keamanan tersebut.

## Persyaratan Proxy

Kebijakan proxy adalah batas keamanan. OpenClaw tidak dapat memverifikasi bahwa proxy memblokir target yang tepat.

Konfigurasikan proxy untuk:

- Mengikat hanya ke loopback atau antarmuka privat tepercaya.
- Membatasi akses sehingga hanya proses, host, container, atau akun layanan OpenClaw yang dapat menggunakannya.
- Menyelesaikan tujuan sendiri dan memblokir IP tujuan setelah resolusi DNS.
- Menerapkan kebijakan saat koneksi untuk permintaan HTTP polos maupun tunnel HTTPS `CONNECT`.
- Menolak bypass berbasis tujuan untuk rentang loopback, privat, link-local, metadata, multicast, reserved, atau dokumentasi.
- Menghindari allowlist hostname kecuali Anda sepenuhnya memercayai jalur resolusi DNS.
- Mencatat tujuan, keputusan, status, dan alasan tanpa mencatat body permintaan, header otorisasi, cookie, atau rahasia lain.
- Menyimpan kebijakan proxy dalam version control dan meninjau perubahan seperti konfigurasi yang sensitif terhadap keamanan.

## Tujuan yang direkomendasikan untuk diblokir

Gunakan denylist ini sebagai titik awal untuk proxy maju, firewall, atau kebijakan egress apa pun.

Logika classifier tingkat aplikasi OpenClaw berada di `src/infra/net/ssrf.ts` dan `src/shared/net/ip.ts`. Hook paritas yang relevan adalah `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX`, dan penanganan sentinel IPv4 tersemat untuk NAT64, 6to4, Teredo, ISATAP, dan bentuk IPv4-mapped. File-file tersebut adalah referensi yang berguna saat memelihara kebijakan proxy eksternal, tetapi OpenClaw tidak secara otomatis mengekspor atau menerapkan aturan tersebut di proxy Anda.

| Rentang atau host                                                                     | Alasan pemblokiran                                  |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                        |
| `::1/128`                                                                            | Loopback IPv6                                        |
| `0.0.0.0/8`, `::/128`                                                                | Alamat unspecified dan this-network                  |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Jaringan privat RFC1918                             |
| `169.254.0.0/16`, `fe80::/10`                                                        | Alamat link-local dan jalur metadata cloud umum     |
| `169.254.169.254`, `metadata.google.internal`                                        | Layanan metadata cloud                              |
| `100.64.0.0/10`                                                                      | Ruang alamat bersama NAT carrier-grade              |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Rentang benchmarking                                |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Rentang special-use dan dokumentasi                 |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                           |
| `240.0.0.0/4`                                                                        | IPv4 reserved                                       |
| `fc00::/7`, `fec0::/10`                                                              | Rentang IPv6 lokal/privat                           |
| `100::/64`, `2001:20::/28`                                                           | Rentang IPv6 discard dan ORCHIDv2                   |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefiks NAT64 dengan IPv4 tersemat                  |
| `2002::/16`, `2001::/32`                                                             | 6to4 dan Teredo dengan IPv4 tersemat                |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 yang kompatibel dengan IPv4 dan IPv4-mapped    |

Jika penyedia cloud atau platform jaringan Anda mendokumentasikan host metadata tambahan atau rentang reserved lainnya, tambahkan juga.

## Validasi

Validasi proxy dari host, container, atau akun layanan yang sama yang menjalankan OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Secara default, ketika tidak ada tujuan khusus yang diberikan, perintah memeriksa bahwa `https://example.com/` berhasil dan memulai canary loopback sementara yang tidak boleh dijangkau oleh proxy. Pemeriksaan default yang ditolak lulus ketika proxy mengembalikan respons penolakan non-2xx atau memblokir canary dengan kegagalan transport; pemeriksaan gagal jika respons yang berhasil mencapai canary. Jika tidak ada proxy yang diaktifkan dan dikonfigurasi, validasi melaporkan masalah konfigurasi; gunakan `--proxy-url` untuk preflight sekali jalan sebelum mengubah konfigurasi. Gunakan `--allowed-url` dan `--denied-url` untuk menguji ekspektasi khusus deployment. Tambahkan `--apns-reachable` untuk juga memverifikasi bahwa pengiriman HTTP/2 APNs langsung dapat membuka tunnel CONNECT melalui proxy dan menerima respons APNs sandbox; probe menggunakan token penyedia yang sengaja tidak valid, jadi `403 InvalidProviderToken` diharapkan dan dihitung sebagai dapat dijangkau. Tujuan khusus yang ditolak bersifat fail-closed: respons HTTP apa pun berarti tujuan dapat dijangkau melalui proxy, dan kesalahan transport apa pun dilaporkan sebagai tidak meyakinkan karena OpenClaw tidak dapat membuktikan bahwa proxy memblokir origin yang dapat dijangkau. Saat validasi gagal, perintah keluar dengan kode 1.

Gunakan `--json` untuk automasi. Output JSON berisi hasil keseluruhan, sumber konfigurasi proxy efektif, kesalahan konfigurasi apa pun, dan setiap pemeriksaan tujuan. Kredensial URL proxy disamarkan dalam output teks dan JSON:

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

Permintaan publik seharusnya berhasil. Permintaan loopback dan metadata seharusnya diblokir oleh proxy. Untuk `openclaw proxy validate`, canary loopback bawaan dapat membedakan penolakan proxy dari origin yang dapat dijangkau. Pemeriksaan `--denied-url` khusus tidak memiliki canary tersebut, jadi perlakukan respons HTTP maupun kegagalan transport yang ambigu sebagai kegagalan validasi kecuali proxy Anda mengekspos sinyal penolakan khusus deployment yang dapat Anda verifikasi secara terpisah.

Lalu aktifkan routing proxy OpenClaw:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

atau tetapkan:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## Batasan

- Proxy meningkatkan cakupan untuk klien HTTP JavaScript dan WebSocket lokal proses, tetapi ini bukan sandbox jaringan tingkat OS.
- Lalu lintas control-plane loopback Gateway secara default menggunakan bypass lokal langsung melalui `proxy.loopbackMode: "gateway-only"`. OpenClaw menerapkan bypass tersebut dengan mendaftarkan otoritas loopback Gateway aktif di pengontrol `NO_PROXY` `global-agent` terkelola. Operator dapat menetapkan `proxy.loopbackMode: "proxy"` untuk mengirim lalu lintas loopback Gateway melalui proxy terkelola, atau `proxy.loopbackMode: "block"` untuk menolak koneksi Gateway loopback. Lihat [Mode Loopback Gateway](#gateway-loopback-mode) untuk catatan penting proxy jarak jauh.
- Socket mentah `net`, `tls`, dan `http2`, addon native, serta proses anak non-OpenClaw dapat melewati routing proxy tingkat Node kecuali mereka mewarisi dan mematuhi variabel lingkungan proxy. CLI anak OpenClaw yang di-fork mewarisi URL proxy terkelola dan status `proxy.loopbackMode`.
- IRC adalah channel TCP/TLS mentah di luar routing forward proxy yang dikelola operator. Dalam deployment yang mengharuskan semua egress melalui forward proxy tersebut, tetapkan `channels.irc.enabled=false` kecuali egress IRC langsung disetujui secara eksplisit.
- Proxy debug lokal adalah tooling diagnostik dan penerusan upstream langsungnya untuk permintaan proxy dan tunnel CONNECT dinonaktifkan secara default saat mode proxy terkelola aktif; aktifkan penerusan langsung hanya untuk diagnostik lokal yang disetujui.
- WebUI lokal pengguna dan server model lokal harus dimasukkan ke allowlist dalam kebijakan proxy operator saat diperlukan; OpenClaw tidak mengekspos bypass jaringan lokal umum untuk keduanya.
- Bypass proxy control-plane Gateway sengaja dibatasi pada `localhost` dan URL IP loopback literal. Gunakan `ws://127.0.0.1:18789`, `ws://[::1]:18789`, atau `ws://localhost:18789` untuk koneksi control-plane Gateway langsung lokal; hostname lain dirutekan seperti lalu lintas berbasis hostname biasa.
- OpenClaw tidak memeriksa, menguji, atau mensertifikasi kebijakan proxy Anda.
- Perlakukan perubahan kebijakan proxy sebagai perubahan operasional yang sensitif terhadap keamanan.
