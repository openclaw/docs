---
read_when:
    - Anda menginginkan pertahanan berlapis terhadap serangan SSRF dan DNS rebinding
    - Mengonfigurasi proxy penerus eksternal untuk lalu lintas waktu eksekusi OpenClaw
summary: Cara merutekan lalu lintas HTTP dan WebSocket waktu jalan OpenClaw melalui proksi pemfilteran yang dikelola operator
title: Proksi jaringan
x-i18n:
    generated_at: "2026-05-04T07:08:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc7140c5ced0e7454a6f85d1ea8f3256bbd28cc0cb42eeafe8e5e6439b90e3f0
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy Jaringan

OpenClaw dapat merutekan lalu lintas HTTP dan WebSocket runtime melalui forward proxy yang dikelola operator. Ini adalah pertahanan berlapis opsional untuk deployment yang menginginkan kontrol egress terpusat, perlindungan SSRF yang lebih kuat, dan auditabilitas jaringan yang lebih baik.

OpenClaw tidak menyertakan, mengunduh, memulai, mengonfigurasi, atau mensertifikasi proxy. Anda menjalankan teknologi proxy yang sesuai dengan lingkungan Anda, dan OpenClaw merutekan klien HTTP dan WebSocket process-local normal melaluinya.

## Mengapa Menggunakan Proxy?

Proxy memberi operator satu titik kontrol jaringan untuk lalu lintas HTTP dan WebSocket keluar. Itu dapat berguna bahkan di luar pengerasan SSRF:

- Kebijakan terpusat: pelihara satu kebijakan egress alih-alih mengandalkan setiap call site HTTP aplikasi untuk menerapkan aturan jaringan dengan benar.
- Pemeriksaan saat koneksi: evaluasi tujuan setelah resolusi DNS dan tepat sebelum proxy membuka koneksi upstream.
- Pertahanan DNS rebinding: kurangi celah antara pemeriksaan DNS tingkat aplikasi dan koneksi keluar yang sebenarnya.
- Cakupan JavaScript yang lebih luas: rute klien biasa seperti `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch, dan klien serupa melalui jalur yang sama.
- Auditabilitas: catat tujuan yang diizinkan dan ditolak di batas egress.
- Kontrol operasional: terapkan aturan tujuan, segmentasi jaringan, batas laju, atau allowlist keluar tanpa membangun ulang OpenClaw.

Perutean proxy adalah guardrail tingkat proses untuk egress HTTP dan WebSocket normal. Ini memberi operator jalur fail-closed untuk merutekan klien HTTP JavaScript yang didukung melalui proxy penyaringan milik mereka sendiri, tetapi ini bukan sandbox jaringan tingkat OS dan tidak membuat OpenClaw mensertifikasi kebijakan tujuan proxy.

## Cara OpenClaw Merutekan Lalu Lintas

Ketika `proxy.enabled=true` dan URL proxy dikonfigurasi, proses runtime terlindungi seperti `openclaw gateway run`, `openclaw node run`, dan `openclaw agent --local` merutekan egress HTTP dan WebSocket normal melalui proxy yang dikonfigurasi:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Kontrak publiknya adalah perilaku perutean, bukan hook Node internal yang digunakan untuk mengimplementasikannya. Klien WebSocket control-plane OpenClaw Gateway menggunakan jalur langsung yang sempit untuk lalu lintas RPC Gateway local loopback ketika URL Gateway menggunakan `localhost` atau IP loopback literal seperti `127.0.0.1` atau `[::1]`. Jalur control-plane itu harus dapat menjangkau Gateway loopback bahkan ketika proxy operator memblokir tujuan loopback. Permintaan HTTP dan WebSocket runtime normal tetap menggunakan proxy yang dikonfigurasi.

Secara internal, OpenClaw menggunakan dua hook perutean tingkat proses untuk fitur ini:

- Perutean dispatcher Undici mencakup `fetch`, klien berbasis undici, dan transport yang menyediakan dispatcher undici miliknya sendiri.
- Perutean `global-agent` mencakup pemanggil Node core `node:http` dan `node:https`, termasuk banyak library yang berlapis di atas `http.request`, `https.request`, `http.get`, dan `https.get`. Mode proxy terkelola memaksa agen global itu agar agen HTTP Node eksplisit tidak secara tidak sengaja melewati proxy operator.

Beberapa Plugin memiliki transport kustom yang memerlukan wiring proxy eksplisit meskipun perutean tingkat proses sudah ada. Misalnya, transport Bot API Telegram menggunakan dispatcher undici HTTP/1 miliknya sendiri sehingga menghormati env proxy proses ditambah fallback `OPENCLAW_PROXY_URL` terkelola di jalur transport khusus pemilik tersebut.

URL proxy itu sendiri harus menggunakan `http://`. Tujuan HTTPS tetap didukung melalui proxy dengan HTTP `CONNECT`; ini hanya berarti OpenClaw mengharapkan listener forward-proxy HTTP biasa seperti `http://127.0.0.1:3128`.

Saat proxy aktif, OpenClaw menghapus `no_proxy`, `NO_PROXY`, dan `GLOBAL_AGENT_NO_PROXY`. Daftar bypass tersebut berbasis tujuan, jadi membiarkan `localhost` atau `127.0.0.1` di sana akan membuat target SSRF berisiko tinggi melewati proxy penyaringan.

Saat shutdown, OpenClaw memulihkan lingkungan proxy sebelumnya dan mengatur ulang status perutean proses yang di-cache.

## Istilah Proxy Terkait

- `proxy.enabled` / `proxy.proxyUrl`: perutean forward-proxy keluar untuk egress runtime OpenClaw. Halaman ini mendokumentasikan fitur tersebut.
- `gateway.auth.mode: "trusted-proxy"`: autentikasi reverse-proxy masuk yang sadar identitas untuk akses Gateway. Lihat [Autentikasi proxy tepercaya](/id/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy debug lokal dan inspektur capture untuk pengembangan dan dukungan. Lihat [openclaw proxy](/id/cli/proxy).
- Pengaturan proxy khusus kanal atau provider: override khusus pemilik untuk transport tertentu. Gunakan proxy jaringan terkelola ketika tujuannya adalah kontrol egress terpusat di seluruh runtime.

## Konfigurasi

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Anda juga dapat menyediakan URL melalui lingkungan, sambil tetap menjaga `proxy.enabled=true` di config:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` memiliki prioritas atas `OPENCLAW_PROXY_URL`.

Jika `enabled=true` tetapi tidak ada URL proxy valid yang dikonfigurasi, perintah terlindungi gagal saat startup alih-alih kembali ke akses jaringan langsung.

Untuk layanan gateway terkelola yang dimulai dengan `openclaw gateway start`, sebaiknya simpan URL di config:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Fallback lingkungan paling cocok untuk proses foreground. Jika Anda menggunakannya dengan layanan terinstal, letakkan `OPENCLAW_PROXY_URL` di lingkungan tahan lama layanan, seperti `$OPENCLAW_STATE_DIR/.env` atau `~/.openclaw/.env`, lalu instal ulang layanan agar launchd, systemd, atau Scheduled Tasks memulai gateway dengan nilai tersebut.

Untuk perintah `openclaw --container ...`, OpenClaw meneruskan `OPENCLAW_PROXY_URL` ke CLI child yang ditargetkan ke container ketika variabel itu disetel. URL harus dapat dijangkau dari dalam container; `127.0.0.1` merujuk ke container itu sendiri, bukan host. OpenClaw menolak URL proxy loopback untuk perintah yang ditargetkan ke container kecuali Anda secara eksplisit mengoverride pemeriksaan keamanan itu.

## Persyaratan Proxy

Kebijakan proxy adalah batas keamanan. OpenClaw tidak dapat memverifikasi bahwa proxy memblokir target yang benar.

Konfigurasikan proxy untuk:

- Mengikat hanya ke loopback atau antarmuka privat tepercaya.
- Membatasi akses sehingga hanya proses, host, container, atau akun layanan OpenClaw yang dapat menggunakannya.
- Meresolusi tujuan sendiri dan memblokir IP tujuan setelah resolusi DNS.
- Menerapkan kebijakan saat koneksi untuk permintaan HTTP biasa maupun tunnel HTTPS `CONNECT`.
- Menolak bypass berbasis tujuan untuk rentang loopback, privat, link-local, metadata, multicast, reserved, atau dokumentasi.
- Menghindari allowlist hostname kecuali Anda sepenuhnya memercayai jalur resolusi DNS.
- Mencatat tujuan, keputusan, status, dan alasan tanpa mencatat body permintaan, header otorisasi, cookie, atau secret lainnya.
- Menyimpan kebijakan proxy di bawah version control dan meninjau perubahan seperti konfigurasi sensitif keamanan.

## Tujuan Terblokir yang Direkomendasikan

Gunakan denylist ini sebagai titik awal untuk forward proxy, firewall, atau kebijakan egress apa pun.

Logika classifier tingkat aplikasi OpenClaw berada di `src/infra/net/ssrf.ts` dan `src/shared/net/ip.ts`. Hook paritas yang relevan adalah `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX`, dan penanganan sentinel IPv4 tertanam untuk NAT64, 6to4, Teredo, ISATAP, dan bentuk IPv4-mapped. File-file tersebut adalah referensi yang berguna saat memelihara kebijakan proxy eksternal, tetapi OpenClaw tidak secara otomatis mengekspor atau menerapkan aturan tersebut di proxy Anda.

| Rentang atau host                                                                    | Alasan memblokir                                    |
| ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                       |
| `::1/128`                                                                            | Loopback IPv6                                       |
| `0.0.0.0/8`, `::/128`                                                                | Alamat unspecified dan this-network                 |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Jaringan privat RFC1918                            |
| `169.254.0.0/16`, `fe80::/10`                                                        | Alamat link-local dan jalur metadata cloud umum    |
| `169.254.169.254`, `metadata.google.internal`                                        | Layanan metadata cloud                              |
| `100.64.0.0/10`                                                                      | Ruang alamat bersama NAT carrier-grade             |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Rentang benchmarking                                |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Rentang penggunaan khusus dan dokumentasi          |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                           |
| `240.0.0.0/4`                                                                        | IPv4 reserved                                       |
| `fc00::/7`, `fec0::/10`                                                              | Rentang lokal/privat IPv6                          |
| `100::/64`, `2001:20::/28`                                                           | Rentang discard IPv6 dan ORCHIDv2                  |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefiks NAT64 dengan IPv4 tertanam                 |
| `2002::/16`, `2001::/32`                                                             | 6to4 dan Teredo dengan IPv4 tertanam               |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 kompatibel IPv4 dan IPv4-mapped               |

Jika penyedia cloud atau platform jaringan Anda mendokumentasikan host metadata atau rentang reserved tambahan, tambahkan juga.

## Validasi

Validasi proxy dari host, container, atau akun layanan yang sama yang menjalankan OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Secara default, ketika tidak ada tujuan kustom yang diberikan, perintah memeriksa bahwa `https://example.com/` berhasil dan memulai canary loopback sementara yang tidak boleh dijangkau proxy. Pemeriksaan penolakan default lulus ketika proxy mengembalikan respons penolakan non-2xx atau memblokir canary dengan kegagalan transport; pemeriksaan gagal jika respons berhasil mencapai canary. Jika tidak ada proxy yang diaktifkan dan dikonfigurasi, validasi melaporkan masalah config; gunakan `--proxy-url` untuk preflight sekali jalan sebelum mengubah config. Gunakan `--allowed-url` dan `--denied-url` untuk menguji ekspektasi khusus deployment. Tujuan penolakan kustom bersifat fail-closed: respons HTTP apa pun berarti tujuan dapat dijangkau melalui proxy, dan error transport apa pun dilaporkan sebagai inkonklusif karena OpenClaw tidak dapat membuktikan proxy memblokir origin yang dapat dijangkau. Saat validasi gagal, perintah keluar dengan kode 1.

Gunakan `--json` untuk otomasi. Output JSON berisi hasil keseluruhan, sumber config proxy efektif, error config apa pun, dan setiap pemeriksaan tujuan. Kredensial URL proxy disunting dalam output teks dan JSON:

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

Permintaan publik seharusnya berhasil. Permintaan loopback dan metadata seharusnya diblokir oleh proksi. Untuk `openclaw proxy validate`, canary loopback bawaan dapat membedakan penolakan proksi dari origin yang dapat dijangkau. Pemeriksaan `--denied-url` kustom tidak memiliki canary tersebut, jadi perlakukan respons HTTP dan kegagalan transport yang ambigu sebagai kegagalan validasi kecuali proksi Anda mengekspos sinyal penolakan khusus deployment yang dapat Anda verifikasi secara terpisah.

Lalu aktifkan perutean proksi OpenClaw:

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

- Proksi meningkatkan cakupan untuk klien HTTP dan WebSocket JavaScript lokal proses, tetapi bukan sandbox jaringan tingkat OS.
- Socket `net`, `tls`, dan `http2` mentah, addon native, dan proses anak dapat melewati perutean proksi tingkat Node kecuali mereka mewarisi dan mematuhi variabel lingkungan proksi.
- IRC adalah kanal TCP/TLS mentah di luar perutean proksi penerusan yang dikelola operator. Dalam deployment yang mewajibkan semua egress melalui proksi penerusan tersebut, tetapkan `channels.irc.enabled=false` kecuali egress IRC langsung disetujui secara eksplisit.
- Proksi debug lokal adalah alat diagnostik dan penerusan upstream langsungnya untuk permintaan proksi serta tunnel CONNECT dinonaktifkan secara default saat mode proksi terkelola aktif; aktifkan penerusan langsung hanya untuk diagnostik lokal yang disetujui.
- WebUI lokal pengguna dan server model lokal harus dimasukkan ke allowlist dalam kebijakan proksi operator bila diperlukan; OpenClaw tidak mengekspos bypass jaringan lokal umum untuk keduanya.
- Bypass proksi bidang kontrol Gateway sengaja dibatasi pada URL `localhost` dan IP loopback literal. Gunakan `ws://127.0.0.1:18789`, `ws://[::1]:18789`, atau `ws://localhost:18789` untuk koneksi bidang kontrol Gateway langsung lokal; hostname lain dirutekan seperti lalu lintas berbasis hostname biasa.
- OpenClaw tidak memeriksa, menguji, atau menyertifikasi kebijakan proksi Anda.
- Perlakukan perubahan kebijakan proksi sebagai perubahan operasional yang sensitif terhadap keamanan.
