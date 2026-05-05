---
read_when:
    - Anda menginginkan pertahanan berlapis terhadap serangan SSRF dan DNS rebinding
    - Mengonfigurasi proksi penerus eksternal untuk lalu lintas runtime OpenClaw
summary: Cara merutekan lalu lintas HTTP dan WebSocket waktu jalan OpenClaw melalui proksi pemfilteran yang dikelola operator
title: Proksi jaringan
x-i18n:
    generated_at: "2026-05-05T01:49:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7ab345d172d63e388ff1221535efd19934dcbf3173f95bc69131f9ad672e0df
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy Jaringan

OpenClaw dapat merutekan lalu lintas HTTP dan WebSocket runtime melalui proxy penerus yang dikelola operator. Ini adalah pertahanan berlapis opsional untuk deployment yang menginginkan kontrol egress terpusat, perlindungan SSRF yang lebih kuat, dan auditabilitas jaringan yang lebih baik.

OpenClaw tidak mengirimkan, mengunduh, memulai, mengonfigurasi, atau mensertifikasi proxy. Anda menjalankan teknologi proxy yang sesuai dengan lingkungan Anda, dan OpenClaw merutekan klien HTTP dan WebSocket normal yang lokal terhadap proses melaluinya.

## Mengapa Menggunakan Proxy?

Proxy memberi operator satu titik kontrol jaringan untuk lalu lintas HTTP dan WebSocket keluar. Itu dapat berguna bahkan di luar penguatan SSRF:

- Kebijakan terpusat: pertahankan satu kebijakan egress alih-alih mengandalkan setiap lokasi panggilan HTTP aplikasi untuk menerapkan aturan jaringan dengan benar.
- Pemeriksaan saat koneksi: evaluasi tujuan setelah resolusi DNS dan tepat sebelum proxy membuka koneksi upstream.
- Pertahanan DNS rebinding: kurangi celah antara pemeriksaan DNS tingkat aplikasi dan koneksi keluar yang sebenarnya.
- Cakupan JavaScript yang lebih luas: rutekan klien biasa seperti `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch, dan klien serupa melalui jalur yang sama.
- Auditabilitas: catat tujuan yang diizinkan dan ditolak di batas egress.
- Kontrol operasional: terapkan aturan tujuan, segmentasi jaringan, batas laju, atau allowlist keluar tanpa membangun ulang OpenClaw.

Perutean proxy adalah pagar pembatas tingkat proses untuk egress HTTP dan WebSocket normal. Ini memberi operator jalur gagal-tertutup untuk merutekan klien HTTP JavaScript yang didukung melalui proxy penyaring milik mereka sendiri, tetapi ini bukan sandbox jaringan tingkat OS dan tidak membuat OpenClaw mensertifikasi kebijakan tujuan proxy.

## Cara OpenClaw Merutekan Lalu Lintas

Saat `proxy.enabled=true` dan URL proxy dikonfigurasi, proses runtime yang dilindungi seperti `openclaw gateway run`, `openclaw node run`, dan `openclaw agent --local` merutekan egress HTTP dan WebSocket normal melalui proxy yang dikonfigurasi:

```text
Proses OpenClaw
  fetch                  -> proxy penyaring yang dikelola operator -> internet publik
  node:http and https    -> proxy penyaring yang dikelola operator -> internet publik
  Klien WebSocket        -> proxy penyaring yang dikelola operator -> internet publik
```

Kontrak publiknya adalah perilaku perutean, bukan hook Node internal yang digunakan untuk menerapkannya. Klien WebSocket bidang kontrol OpenClaw Gateway menggunakan jalur langsung yang sempit untuk lalu lintas RPC Gateway local loopback saat URL Gateway menggunakan `localhost` atau IP loopback literal seperti `127.0.0.1` atau `[::1]`. Jalur bidang kontrol tersebut harus dapat menjangkau Gateway loopback bahkan saat proxy operator memblokir tujuan loopback. Permintaan HTTP dan WebSocket runtime normal tetap menggunakan proxy yang dikonfigurasi.

Secara internal, OpenClaw menggunakan dua hook perutean tingkat proses untuk fitur ini:

- Perutean dispatcher Undici mencakup `fetch`, klien berbasis undici, dan transport yang menyediakan dispatcher undici mereka sendiri.
- Perutean `global-agent` mencakup pemanggil inti Node `node:http` dan `node:https`, termasuk banyak pustaka yang dibangun di atas `http.request`, `https.request`, `http.get`, dan `https.get`. Mode proxy terkelola memaksa agen global tersebut sehingga agen HTTP Node eksplisit tidak secara tidak sengaja melewati proxy operator.

Beberapa Plugin memiliki transport kustom yang memerlukan pengkabelan proxy eksplisit bahkan saat perutean tingkat proses ada. Misalnya, transport Bot API Telegram menggunakan dispatcher HTTP/1 undici miliknya sendiri dan karena itu menghormati env proxy proses plus fallback `OPENCLAW_PROXY_URL` terkelola pada jalur transport khusus pemilik tersebut.

URL proxy itu sendiri harus menggunakan `http://`. Tujuan HTTPS tetap didukung melalui proxy dengan HTTP `CONNECT`; ini hanya berarti OpenClaw mengharapkan listener proxy penerus HTTP biasa seperti `http://127.0.0.1:3128`.

Saat proxy aktif, OpenClaw menghapus `no_proxy`, `NO_PROXY`, dan `GLOBAL_AGENT_NO_PROXY`. Daftar bypass tersebut berbasis tujuan, jadi membiarkan `localhost` atau `127.0.0.1` di sana akan memungkinkan target SSRF berisiko tinggi melewati proxy penyaring.

Saat shutdown, OpenClaw memulihkan lingkungan proxy sebelumnya dan mengatur ulang status perutean proses yang di-cache.

## Istilah Proxy Terkait

- `proxy.enabled` / `proxy.proxyUrl`: perutean proxy penerus keluar untuk egress runtime OpenClaw. Halaman ini mendokumentasikan fitur tersebut.
- `gateway.auth.mode: "trusted-proxy"`: autentikasi reverse proxy masuk yang sadar identitas untuk akses Gateway. Lihat [Autentikasi proxy tepercaya](/id/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy debug lokal dan inspektur tangkapan untuk pengembangan dan dukungan. Lihat [openclaw proxy](/id/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opt-in bagi `web_fetch` untuk memungkinkan proxy env HTTP(S) yang dikendalikan operator menyelesaikan DNS sambil mempertahankan pinning DNS ketat default dan kebijakan nama host. Lihat [Web fetch](/id/tools/web-fetch#trusted-env-proxy).
- Pengaturan proxy khusus channel atau penyedia: override khusus pemilik untuk transport tertentu. Lebih baik gunakan proxy jaringan terkelola saat tujuannya adalah kontrol egress terpusat di seluruh runtime.

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

`proxy.proxyUrl` lebih diprioritaskan daripada `OPENCLAW_PROXY_URL`.

Jika `enabled=true` tetapi tidak ada URL proxy valid yang dikonfigurasi, perintah yang dilindungi akan gagal saat startup alih-alih kembali ke akses jaringan langsung.

Untuk layanan gateway terkelola yang dimulai dengan `openclaw gateway start`, lebih baik simpan URL dalam konfigurasi:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Fallback lingkungan paling cocok untuk proses foreground. Jika Anda menggunakannya dengan layanan yang terinstal, letakkan `OPENCLAW_PROXY_URL` di lingkungan tahan lama layanan, seperti `$OPENCLAW_STATE_DIR/.env` atau `~/.openclaw/.env`, lalu instal ulang layanan agar launchd, systemd, atau Scheduled Tasks memulai gateway dengan nilai tersebut.

Untuk perintah `openclaw --container ...`, OpenClaw meneruskan `OPENCLAW_PROXY_URL` ke CLI anak yang ditargetkan ke kontainer saat nilai tersebut disetel. URL harus dapat dijangkau dari dalam kontainer; `127.0.0.1` merujuk ke kontainer itu sendiri, bukan host. OpenClaw menolak URL proxy loopback untuk perintah yang ditargetkan ke kontainer kecuali Anda secara eksplisit meng-override pemeriksaan keamanan tersebut.

## Persyaratan Proxy

Kebijakan proxy adalah batas keamanan. OpenClaw tidak dapat memverifikasi bahwa proxy memblokir target yang tepat.

Konfigurasikan proxy untuk:

- Mengikat hanya ke loopback atau antarmuka privat tepercaya.
- Membatasi akses sehingga hanya proses, host, kontainer, atau akun layanan OpenClaw yang dapat menggunakannya.
- Menyelesaikan tujuan sendiri dan memblokir IP tujuan setelah resolusi DNS.
- Menerapkan kebijakan saat koneksi untuk permintaan HTTP biasa maupun tunnel HTTPS `CONNECT`.
- Menolak bypass berbasis tujuan untuk loopback, privat, link-local, metadata, multicast, reserved, atau rentang dokumentasi.
- Menghindari allowlist nama host kecuali Anda sepenuhnya memercayai jalur resolusi DNS.
- Mencatat tujuan, keputusan, status, dan alasan tanpa mencatat isi permintaan, header otorisasi, cookie, atau rahasia lainnya.
- Menyimpan kebijakan proxy dalam kontrol versi dan meninjau perubahan seperti konfigurasi yang sensitif terhadap keamanan.

## Tujuan yang Direkomendasikan untuk Diblokir

Gunakan denylist ini sebagai titik awal untuk proxy penerus, firewall, atau kebijakan egress apa pun.

Logika classifier tingkat aplikasi OpenClaw berada di `src/infra/net/ssrf.ts` dan `src/shared/net/ip.ts`. Hook paritas yang relevan adalah `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX`, dan penanganan sentinel IPv4 tertanam untuk NAT64, 6to4, Teredo, ISATAP, dan bentuk IPv4-mapped. File-file tersebut adalah referensi berguna saat memelihara kebijakan proxy eksternal, tetapi OpenClaw tidak secara otomatis mengekspor atau menegakkan aturan tersebut di proxy Anda.

| Rentang atau host                                                                     | Alasan untuk memblokir                              |
| ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                       |
| `::1/128`                                                                            | Loopback IPv6                                       |
| `0.0.0.0/8`, `::/128`                                                                | Alamat unspecified dan jaringan ini                 |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Jaringan privat RFC1918                            |
| `169.254.0.0/16`, `fe80::/10`                                                        | Alamat link-local dan jalur metadata cloud umum     |
| `169.254.169.254`, `metadata.google.internal`                                        | Layanan metadata cloud                              |
| `100.64.0.0/10`                                                                      | Ruang alamat bersama NAT carrier-grade              |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Rentang benchmarking                                |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Rentang special-use dan dokumentasi                 |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                           |
| `240.0.0.0/4`                                                                        | IPv4 reserved                                       |
| `fc00::/7`, `fec0::/10`                                                              | Rentang lokal/privat IPv6                           |
| `100::/64`, `2001:20::/28`                                                           | Rentang discard IPv6 dan ORCHIDv2                   |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefiks NAT64 dengan IPv4 tertanam                  |
| `2002::/16`, `2001::/32`                                                             | 6to4 dan Teredo dengan IPv4 tertanam                |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 kompatibel IPv4 dan IPv6 IPv4-mapped           |

Jika penyedia cloud atau platform jaringan Anda mendokumentasikan host metadata atau rentang reserved tambahan, tambahkan juga.

## Validasi

Validasi proxy dari host, kontainer, atau akun layanan yang sama yang menjalankan OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Secara default, saat tidak ada tujuan kustom yang diberikan, perintah memeriksa bahwa `https://example.com/` berhasil dan memulai canary loopback sementara yang tidak boleh dijangkau oleh proxy. Pemeriksaan penolakan default lulus saat proxy mengembalikan respons penolakan non-2xx atau memblokir canary dengan kegagalan transport; pemeriksaan gagal jika respons berhasil mencapai canary. Jika tidak ada proxy yang diaktifkan dan dikonfigurasi, validasi melaporkan masalah konfigurasi; gunakan `--proxy-url` untuk preflight satu kali sebelum mengubah konfigurasi. Gunakan `--allowed-url` dan `--denied-url` untuk menguji ekspektasi khusus deployment. Tambahkan `--apns-reachable` untuk juga memverifikasi bahwa pengiriman HTTP/2 APNs langsung dapat membuka tunnel CONNECT melalui proxy dan menerima respons sandbox APNs; probe menggunakan token penyedia yang sengaja tidak valid, jadi `403 InvalidProviderToken` diharapkan dan dihitung sebagai dapat dijangkau. Tujuan penolakan kustom bersifat gagal-tertutup: respons HTTP apa pun berarti tujuan dapat dijangkau melalui proxy, dan kesalahan transport apa pun dilaporkan sebagai tidak konklusif karena OpenClaw tidak dapat membuktikan bahwa proxy memblokir origin yang dapat dijangkau. Pada kegagalan validasi, perintah keluar dengan kode 1.

Gunakan `--json` untuk otomatisasi. Keluaran JSON berisi hasil keseluruhan, sumber konfigurasi proxy efektif, kesalahan konfigurasi apa pun, dan setiap pemeriksaan tujuan. Kredensial URL proxy disamarkan dalam keluaran teks dan JSON:

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

Permintaan publik seharusnya berhasil. Permintaan loopback dan metadata seharusnya diblokir oleh proxy. Untuk `openclaw proxy validate`, kanari loopback bawaan dapat membedakan penolakan proxy dari origin yang dapat dijangkau. Pemeriksaan `--denied-url` khusus tidak memiliki kanari itu, jadi perlakukan respons HTTP dan kegagalan transport yang ambigu sebagai kegagalan validasi kecuali proxy Anda mengekspos sinyal penolakan khusus deployment yang dapat Anda verifikasi secara terpisah.

Kemudian aktifkan perutean proxy OpenClaw:

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

## Batas

- Proxy meningkatkan cakupan untuk klien HTTP dan WebSocket JavaScript lokal proses, tetapi ini bukan sandbox jaringan tingkat OS.
- Soket mentah `net`, `tls`, dan `http2`, addon native, dan proses anak dapat melewati perutean proxy tingkat Node kecuali mereka mewarisi dan mematuhi variabel lingkungan proxy.
- IRC adalah channel TCP/TLS mentah di luar perutean proxy forward yang dikelola operator. Dalam deployment yang mewajibkan semua egress melalui proxy forward tersebut, atur `channels.irc.enabled=false` kecuali egress IRC langsung disetujui secara eksplisit.
- Proxy debug lokal adalah perkakas diagnostik dan penerusan upstream langsungnya untuk permintaan proxy serta tunnel CONNECT dinonaktifkan secara default saat mode proxy terkelola aktif; aktifkan penerusan langsung hanya untuk diagnostik lokal yang disetujui.
- WebUI lokal pengguna dan server model lokal harus dimasukkan dalam allowlist di kebijakan proxy operator bila diperlukan; OpenClaw tidak mengekspos bypass jaringan lokal umum untuk keduanya.
- Bypass proxy control-plane Gateway sengaja dibatasi ke `localhost` dan URL IP loopback literal. Gunakan `ws://127.0.0.1:18789`, `ws://[::1]:18789`, atau `ws://localhost:18789` untuk koneksi control-plane Gateway langsung lokal; hostname lain dirutekan seperti lalu lintas berbasis hostname biasa.
- OpenClaw tidak memeriksa, menguji, atau mensertifikasi kebijakan proxy Anda.
- Perlakukan perubahan kebijakan proxy sebagai perubahan operasional yang sensitif terhadap keamanan.
