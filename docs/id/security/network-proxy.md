---
read_when:
    - Anda menginginkan pertahanan berlapis terhadap serangan SSRF dan DNS rebinding
    - Mengonfigurasi proksi penerusan eksternal untuk lalu lintas waktu eksekusi OpenClaw
summary: Cara merutekan lalu lintas HTTP dan WebSocket runtime OpenClaw melalui proksi penyaringan yang dikelola operator
title: Proksi jaringan
x-i18n:
    generated_at: "2026-05-06T09:27:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: d733c690b5f86ef62fe7a35d38fbfcd07910970bca12ca6f74fdb26c8ec4557b
    source_path: security/network-proxy.md
    workflow: 16
---

# Proksi Jaringan

OpenClaw dapat merutekan lalu lintas HTTP dan WebSocket runtime melalui proksi maju yang dikelola operator. Ini adalah pertahanan berlapis opsional untuk deployment yang menginginkan kontrol egress terpusat, perlindungan SSRF yang lebih kuat, dan auditabilitas jaringan yang lebih baik.

OpenClaw tidak menyertakan, mengunduh, memulai, mengonfigurasi, atau mensertifikasi proksi. Anda menjalankan teknologi proksi yang sesuai dengan lingkungan Anda, dan OpenClaw merutekan klien HTTP dan WebSocket normal yang lokal ke proses melalui proksi tersebut.

## Mengapa Menggunakan Proksi?

Proksi memberi operator satu titik kontrol jaringan untuk lalu lintas HTTP dan WebSocket keluar. Itu dapat berguna bahkan di luar pengerasan SSRF:

- Kebijakan terpusat: pertahankan satu kebijakan egress alih-alih bergantung pada setiap lokasi panggilan HTTP aplikasi untuk menerapkan aturan jaringan dengan benar.
- Pemeriksaan saat koneksi: evaluasi tujuan setelah resolusi DNS dan tepat sebelum proksi membuka koneksi upstream.
- Pertahanan DNS rebinding: kurangi celah antara pemeriksaan DNS tingkat aplikasi dan koneksi keluar yang sebenarnya.
- Cakupan JavaScript yang lebih luas: rutekan klien biasa seperti `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch, dan klien serupa melalui jalur yang sama.
- Auditabilitas: catat tujuan yang diizinkan dan ditolak di batas egress.
- Kontrol operasional: terapkan aturan tujuan, segmentasi jaringan, batas laju, atau daftar izin keluar tanpa membangun ulang OpenClaw.

Perutean proksi adalah pembatas tingkat proses untuk egress HTTP dan WebSocket normal. Ini memberi operator jalur gagal-tertutup untuk merutekan klien HTTP JavaScript yang didukung melalui proksi pemfilteran mereka sendiri, tetapi ini bukan sandbox jaringan tingkat OS dan tidak membuat OpenClaw mensertifikasi kebijakan tujuan proksi.

## Cara OpenClaw Merutekan Lalu Lintas

Saat `proxy.enabled=true` dan URL proksi dikonfigurasi, proses runtime terlindungi seperti `openclaw gateway run`, `openclaw node run`, dan `openclaw agent --local` merutekan egress HTTP dan WebSocket normal melalui proksi yang dikonfigurasi:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Kontrak publiknya adalah perilaku perutean, bukan hook Node internal yang digunakan untuk mengimplementasikannya. Klien WebSocket control-plane OpenClaw Gateway menggunakan jalur langsung yang sempit untuk lalu lintas RPC Gateway local loopback ketika URL Gateway menggunakan `localhost` atau IP loopback literal seperti `127.0.0.1` atau `[::1]`. Jalur control-plane tersebut harus dapat menjangkau Gateway loopback bahkan ketika proksi operator memblokir tujuan loopback. Permintaan HTTP dan WebSocket runtime normal tetap menggunakan proksi yang dikonfigurasi.

Secara internal, OpenClaw menggunakan dua hook perutean tingkat proses untuk fitur ini:

- Perutean dispatcher Undici mencakup `fetch`, klien berbasis undici, dan transport yang menyediakan dispatcher undici mereka sendiri.
- Perutean `global-agent` mencakup pemanggil Node core `node:http` dan `node:https`, termasuk banyak pustaka yang dibangun di atas `http.request`, `https.request`, `http.get`, dan `https.get`. Mode proksi terkelola memaksa agen global tersebut agar agen HTTP Node eksplisit tidak secara tidak sengaja melewati proksi operator.

Beberapa plugin memiliki transport kustom yang memerlukan pengabelan proksi eksplisit meskipun perutean tingkat proses sudah ada. Misalnya, transport Bot API Telegram menggunakan dispatcher undici HTTP/1 miliknya sendiri sehingga menghormati env proksi proses ditambah fallback `OPENCLAW_PROXY_URL` terkelola dalam jalur transport khusus pemilik tersebut.

URL proksi itu sendiri harus menggunakan `http://`. Tujuan HTTPS tetap didukung melalui proksi dengan HTTP `CONNECT`; ini hanya berarti OpenClaw mengharapkan listener proksi maju HTTP polos seperti `http://127.0.0.1:3128`.

Saat proksi aktif, OpenClaw menghapus `no_proxy`, `NO_PROXY`, dan `GLOBAL_AGENT_NO_PROXY`. Daftar bypass tersebut berbasis tujuan, sehingga membiarkan `localhost` atau `127.0.0.1` di sana akan membuat target SSRF berisiko tinggi melewati proksi pemfilteran.

Saat shutdown, OpenClaw memulihkan lingkungan proksi sebelumnya dan mereset status perutean proses yang di-cache.

## Istilah Proksi Terkait

- `proxy.enabled` / `proxy.proxyUrl`: perutean proksi maju keluar untuk egress runtime OpenClaw. Halaman ini mendokumentasikan fitur tersebut.
- `gateway.auth.mode: "trusted-proxy"`: autentikasi proksi balik masuk yang sadar identitas untuk akses Gateway. Lihat [Autentikasi proksi tepercaya](/id/gateway/trusted-proxy-auth).
- `openclaw proxy`: proksi debug lokal dan pemeriksa tangkapan untuk pengembangan dan dukungan. Lihat [openclaw proxy](/id/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opt-in untuk `web_fetch` agar proksi env HTTP(S) yang dikendalikan operator dapat meresolusi DNS sambil tetap mempertahankan penyematan DNS ketat default dan kebijakan hostname. Lihat [Web fetch](/id/tools/web-fetch#trusted-env-proxy).
- Pengaturan proksi khusus channel atau provider: override khusus pemilik untuk transport tertentu. Lebih baik gunakan proksi jaringan terkelola ketika tujuannya adalah kontrol egress terpusat di seluruh runtime.

## Konfigurasi

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Anda juga dapat menyediakan URL melalui lingkungan, sambil mempertahankan `proxy.enabled=true` di konfigurasi:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` memiliki prioritas atas `OPENCLAW_PROXY_URL`.

### Mode Loopback Gateway

Klien control-plane Gateway lokal biasanya terhubung ke WebSocket loopback seperti `ws://127.0.0.1:18789`. Gunakan `proxy.loopbackMode` untuk memilih bagaimana lalu lintas tersebut berperilaku saat proksi terkelola aktif:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (default): OpenClaw mendaftarkan otoritas loopback Gateway di controller `NO_PROXY` `global-agent` yang aktif sehingga lalu lintas WebSocket Gateway lokal dapat terhubung langsung. Port Gateway loopback kustom berfungsi karena host dan port URL Gateway aktif didaftarkan.
- `proxy`: OpenClaw tidak mendaftarkan otoritas `NO_PROXY` loopback Gateway, sehingga lalu lintas Gateway lokal dikirim melalui proksi terkelola. Jika proksinya remote, proksi tersebut harus menyediakan perutean khusus untuk layanan loopback host OpenClaw, seperti memetakannya ke hostname, IP, atau tunnel yang dapat dijangkau proksi. Proksi remote standar meresolusi `127.0.0.1` dan `localhost` dari host proksi, bukan dari host OpenClaw.
- `block`: OpenClaw menolak koneksi control-plane Gateway loopback sebelum membuka socket.

Jika `enabled=true` tetapi tidak ada URL proksi valid yang dikonfigurasi, perintah terlindungi gagal saat startup alih-alih kembali ke akses jaringan langsung.

Untuk layanan gateway terkelola yang dimulai dengan `openclaw gateway start`, sebaiknya simpan URL di konfigurasi:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Fallback lingkungan paling cocok untuk run foreground. Jika Anda menggunakannya dengan layanan yang terinstal, letakkan `OPENCLAW_PROXY_URL` di lingkungan tahan lama layanan, seperti `$OPENCLAW_STATE_DIR/.env` atau `~/.openclaw/.env`, lalu instal ulang layanan agar launchd, systemd, atau Scheduled Tasks memulai gateway dengan nilai tersebut.

Untuk perintah `openclaw --container ...`, OpenClaw meneruskan `OPENCLAW_PROXY_URL` ke CLI anak bertarget container saat variabel tersebut disetel. URL harus dapat dijangkau dari dalam container; `127.0.0.1` merujuk ke container itu sendiri, bukan host. OpenClaw menolak URL proksi loopback untuk perintah bertarget container kecuali Anda secara eksplisit mengesampingkan pemeriksaan keamanan tersebut.

## Persyaratan Proksi

Kebijakan proksi adalah batas keamanan. OpenClaw tidak dapat memverifikasi bahwa proksi memblokir target yang tepat.

Konfigurasikan proksi untuk:

- Bind hanya ke loopback atau antarmuka privat tepercaya.
- Batasi akses sehingga hanya proses, host, container, atau akun layanan OpenClaw yang dapat menggunakannya.
- Meresolusi tujuan sendiri dan memblokir IP tujuan setelah resolusi DNS.
- Menerapkan kebijakan saat koneksi untuk permintaan HTTP polos dan tunnel HTTPS `CONNECT`.
- Menolak bypass berbasis tujuan untuk rentang loopback, privat, link-local, metadata, multicast, cadangan, atau dokumentasi.
- Hindari daftar izin hostname kecuali Anda sepenuhnya memercayai jalur resolusi DNS.
- Catat tujuan, keputusan, status, dan alasan tanpa mencatat body permintaan, header otorisasi, cookie, atau rahasia lainnya.
- Simpan kebijakan proksi dalam kontrol versi dan tinjau perubahan seperti konfigurasi sensitif keamanan.

## Tujuan yang Direkomendasikan untuk Diblokir

Gunakan denylist ini sebagai titik awal untuk proksi maju, firewall, atau kebijakan egress apa pun.

Logika classifier tingkat aplikasi OpenClaw berada di `src/infra/net/ssrf.ts` dan `src/shared/net/ip.ts`. Hook parity yang relevan adalah `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX`, dan penanganan sentinel IPv4 tertanam untuk NAT64, 6to4, Teredo, ISATAP, dan bentuk IPv4-mapped. File-file tersebut adalah referensi berguna saat memelihara kebijakan proksi eksternal, tetapi OpenClaw tidak secara otomatis mengekspor atau menegakkan aturan tersebut di proksi Anda.

| Rentang atau host                                                                     | Alasan diblokir                                     |
| ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                       |
| `::1/128`                                                                            | Loopback IPv6                                       |
| `0.0.0.0/8`, `::/128`                                                                | Alamat tidak ditentukan dan alamat jaringan ini     |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Jaringan privat RFC1918                            |
| `169.254.0.0/16`, `fe80::/10`                                                        | Alamat link-local dan jalur metadata cloud umum     |
| `169.254.169.254`, `metadata.google.internal`                                        | Layanan metadata cloud                              |
| `100.64.0.0/10`                                                                      | Ruang alamat bersama NAT carrier-grade              |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Rentang benchmarking                                |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Rentang special-use dan dokumentasi                 |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                           |
| `240.0.0.0/4`                                                                        | IPv4 cadangan                                       |
| `fc00::/7`, `fec0::/10`                                                              | Rentang lokal/privat IPv6                           |
| `100::/64`, `2001:20::/28`                                                           | Rentang discard IPv6 dan ORCHIDv2                   |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefiks NAT64 dengan IPv4 tertanam                  |
| `2002::/16`, `2001::/32`                                                             | 6to4 dan Teredo dengan IPv4 tertanam                |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 yang kompatibel dengan IPv4 dan IPv4-mapped    |

Jika penyedia cloud atau platform jaringan Anda mendokumentasikan host metadata atau rentang cadangan tambahan, tambahkan juga.

## Validasi

Validasi proksi dari host, container, atau akun layanan yang sama yang menjalankan OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Secara default, ketika tidak ada tujuan kustom yang disediakan, perintah memeriksa bahwa `https://example.com/` berhasil dan memulai canary loopback sementara yang tidak boleh dijangkau proksi. Pemeriksaan yang ditolak secara default lulus ketika proksi mengembalikan respons penolakan non-2xx atau memblokir canary dengan kegagalan transport; pemeriksaan gagal jika respons berhasil mencapai canary. Jika tidak ada proksi yang diaktifkan dan dikonfigurasi, validasi melaporkan masalah konfigurasi; gunakan `--proxy-url` untuk preflight sekali jalan sebelum mengubah konfigurasi. Gunakan `--allowed-url` dan `--denied-url` untuk menguji ekspektasi spesifik deployment. Tambahkan `--apns-reachable` untuk juga memverifikasi bahwa pengiriman HTTP/2 APNs langsung dapat membuka tunnel CONNECT melalui proksi dan menerima respons APNs sandbox; probe menggunakan token penyedia yang sengaja tidak valid, sehingga `403 InvalidProviderToken` diharapkan dan dihitung sebagai dapat dijangkau. Tujuan kustom yang ditolak bersifat fail-closed: respons HTTP apa pun berarti tujuan dapat dijangkau melalui proksi, dan error transport apa pun dilaporkan sebagai tidak meyakinkan karena OpenClaw tidak dapat membuktikan bahwa proksi memblokir origin yang dapat dijangkau. Pada kegagalan validasi, perintah keluar dengan kode 1.

Gunakan `--json` untuk otomatisasi. Output JSON berisi hasil keseluruhan, sumber konfigurasi proksi efektif, error konfigurasi apa pun, dan setiap pemeriksaan tujuan. Kredensial URL proksi disamarkan dalam output teks dan JSON:

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

Permintaan publik seharusnya berhasil. Permintaan loopback dan metadata seharusnya diblokir oleh proksi. Untuk `openclaw proxy validate`, canary loopback bawaan dapat membedakan penolakan proksi dari origin yang dapat dijangkau. Pemeriksaan kustom `--denied-url` tidak memiliki canary tersebut, jadi perlakukan baik respons HTTP maupun kegagalan transport ambigu sebagai kegagalan validasi kecuali proksi Anda mengekspos sinyal penolakan spesifik deployment yang dapat Anda verifikasi secara terpisah.

Lalu aktifkan perutean proksi OpenClaw:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

atau atur:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## Batasan

- Proksi meningkatkan cakupan untuk klien HTTP JavaScript dan WebSocket lokal proses, tetapi ini bukan sandbox jaringan tingkat OS.
- Lalu lintas control plane loopback Gateway secara default menggunakan bypass lokal langsung melalui `proxy.loopbackMode: "gateway-only"`. OpenClaw menerapkan bypass tersebut dengan mendaftarkan otoritas loopback Gateway aktif di pengontrol `NO_PROXY` `global-agent` terkelola. Operator dapat mengatur `proxy.loopbackMode: "proxy"` untuk mengirim lalu lintas loopback Gateway melalui proksi terkelola, atau `proxy.loopbackMode: "block"` untuk menolak koneksi Gateway loopback. Lihat [Mode Loopback Gateway](#gateway-loopback-mode) untuk catatan tentang proksi jarak jauh.
- Socket mentah `net`, `tls`, dan `http2`, addon native, serta proses turunan non-OpenClaw dapat melewati perutean proksi tingkat Node kecuali mereka mewarisi dan menghormati variabel lingkungan proksi. CLI turunan OpenClaw yang di-fork mewarisi URL proksi terkelola dan status `proxy.loopbackMode`.
- IRC adalah channel TCP/TLS mentah di luar perutean forward proxy yang dikelola operator. Dalam deployment yang mensyaratkan semua egress melalui forward proxy tersebut, atur `channels.irc.enabled=false` kecuali egress IRC langsung disetujui secara eksplisit.
- Proksi debug lokal adalah alat diagnostik dan penerusan upstream langsungnya untuk permintaan proksi dan tunnel CONNECT dinonaktifkan secara default saat mode proksi terkelola aktif; aktifkan penerusan langsung hanya untuk diagnostik lokal yang disetujui.
- WebUI lokal pengguna dan server model lokal harus dimasukkan ke allowlist dalam kebijakan proksi operator bila diperlukan; OpenClaw tidak mengekspos bypass jaringan lokal umum untuk keduanya.
- Bypass proksi control plane Gateway sengaja dibatasi ke `localhost` dan URL IP loopback literal. Gunakan `ws://127.0.0.1:18789`, `ws://[::1]:18789`, atau `ws://localhost:18789` untuk koneksi control plane Gateway lokal langsung; hostname lain dirutekan seperti lalu lintas berbasis hostname biasa.
- OpenClaw tidak memeriksa, menguji, atau mensertifikasi kebijakan proksi Anda.
- Perlakukan perubahan kebijakan proksi sebagai perubahan operasional yang sensitif terhadap keamanan.
