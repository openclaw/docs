---
read_when:
    - Anda menginginkan pertahanan berlapis terhadap serangan SSRF dan DNS rebinding
    - Mengonfigurasi proksi penerusan eksternal untuk lalu lintas runtime OpenClaw
summary: Cara merutekan lalu lintas HTTP dan WebSocket lingkungan eksekusi OpenClaw melalui proksi pemfilteran yang dikelola operator
title: Proksi jaringan
x-i18n:
    generated_at: "2026-05-01T09:28:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9207d349e4410e38631ae7665be19b536e4a4128a4e80dd095e802804dfd66a3
    source_path: security/network-proxy.md
    workflow: 16
---

# Proksi Jaringan

OpenClaw dapat merutekan lalu lintas HTTP dan WebSocket runtime melalui proksi forward yang dikelola operator. Ini adalah pertahanan berlapis opsional untuk deployment yang menginginkan kontrol egress terpusat, perlindungan SSRF yang lebih kuat, dan auditabilitas jaringan yang lebih baik.

OpenClaw tidak menyertakan, mengunduh, memulai, mengonfigurasi, atau mensertifikasi proksi. Anda menjalankan teknologi proksi yang sesuai dengan lingkungan Anda, dan OpenClaw merutekan klien HTTP dan WebSocket process-local normal melaluinya.

## Mengapa Menggunakan Proksi?

Proksi memberi operator satu titik kontrol jaringan untuk lalu lintas HTTP dan WebSocket keluar. Itu dapat berguna bahkan di luar pengerasan SSRF:

- Kebijakan terpusat: pertahankan satu kebijakan egress alih-alih bergantung pada setiap titik panggilan HTTP aplikasi untuk menerapkan aturan jaringan dengan benar.
- Pemeriksaan saat koneksi: evaluasi tujuan setelah resolusi DNS dan tepat sebelum proksi membuka koneksi upstream.
- Pertahanan DNS rebinding: kurangi celah antara pemeriksaan DNS tingkat aplikasi dan koneksi keluar yang sebenarnya.
- Cakupan JavaScript yang lebih luas: rutekan klien biasa seperti `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch, dan klien serupa melalui jalur yang sama.
- Auditabilitas: catat tujuan yang diizinkan dan ditolak di batas egress.
- Kontrol operasional: berlakukan aturan tujuan, segmentasi jaringan, batas laju, atau daftar izin keluar tanpa membangun ulang OpenClaw.

Perutean proksi adalah pagar pembatas tingkat proses untuk egress HTTP dan WebSocket normal. Ini memberi operator jalur fail-closed untuk merutekan klien HTTP JavaScript yang didukung melalui proksi pemfilteran milik mereka, tetapi ini bukan sandbox jaringan tingkat OS dan tidak membuat OpenClaw mensertifikasi kebijakan tujuan proksi.

## Cara OpenClaw Merutekan Lalu Lintas

Ketika `proxy.enabled=true` dan URL proksi dikonfigurasi, proses runtime terlindungi seperti `openclaw gateway run`, `openclaw node run`, dan `openclaw agent --local` merutekan egress HTTP dan WebSocket normal melalui proksi yang dikonfigurasi:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Kontrak publiknya adalah perilaku perutean, bukan hook internal Node yang digunakan untuk mengimplementasikannya. Klien WebSocket control-plane OpenClaw Gateway menggunakan jalur langsung yang sempit untuk lalu lintas RPC Gateway local loopback ketika URL Gateway menggunakan `localhost` atau IP loopback literal seperti `127.0.0.1` atau `[::1]`. Jalur control-plane tersebut harus dapat menjangkau Gateway loopback bahkan ketika proksi operator memblokir tujuan loopback. Permintaan HTTP dan WebSocket runtime normal tetap menggunakan proksi yang dikonfigurasi.

Secara internal, OpenClaw menggunakan dua hook perutean tingkat proses untuk fitur ini:

- Perutean dispatcher Undici mencakup `fetch`, klien berbasis undici, dan transport yang menyediakan dispatcher undici sendiri.
- Perutean `global-agent` mencakup pemanggil inti Node `node:http` dan `node:https`, termasuk banyak library yang dibangun di atas `http.request`, `https.request`, `http.get`, dan `https.get`. Mode proksi terkelola memaksa agen global tersebut sehingga agen HTTP Node eksplisit tidak secara tidak sengaja melewati proksi operator.

Beberapa Plugin memiliki transport kustom yang memerlukan wiring proksi eksplisit bahkan ketika perutean tingkat proses sudah ada. Misalnya, transport Bot API Telegram menggunakan dispatcher HTTP/1 undici miliknya sendiri sehingga menghormati env proksi proses ditambah fallback `OPENCLAW_PROXY_URL` terkelola di jalur transport khusus pemilik tersebut.

URL proksi itu sendiri harus menggunakan `http://`. Tujuan HTTPS tetap didukung melalui proksi dengan HTTP `CONNECT`; ini hanya berarti OpenClaw mengharapkan listener proksi forward HTTP biasa seperti `http://127.0.0.1:3128`.

Saat proksi aktif, OpenClaw menghapus `no_proxy`, `NO_PROXY`, dan `GLOBAL_AGENT_NO_PROXY`. Daftar bypass tersebut berbasis tujuan, sehingga membiarkan `localhost` atau `127.0.0.1` di sana akan membuat target SSRF berisiko tinggi melewati proksi pemfilteran.

Saat shutdown, OpenClaw memulihkan lingkungan proksi sebelumnya dan mereset status perutean proses yang di-cache.

## Istilah Proksi Terkait

- `proxy.enabled` / `proxy.proxyUrl`: perutean proksi forward keluar untuk egress runtime OpenClaw. Halaman ini mendokumentasikan fitur tersebut.
- `gateway.auth.mode: "trusted-proxy"`: autentikasi reverse-proxy masuk yang sadar identitas untuk akses Gateway. Lihat [Autentikasi proksi tepercaya](/id/gateway/trusted-proxy-auth).
- `openclaw proxy`: proksi debug lokal dan inspektur capture untuk pengembangan dan dukungan. Lihat [openclaw proxy](/id/cli/proxy).
- Pengaturan proksi khusus channel atau provider: override khusus pemilik untuk transport tertentu. Utamakan proksi jaringan terkelola ketika tujuannya adalah kontrol egress terpusat di seluruh runtime.

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

`proxy.proxyUrl` memiliki prioritas lebih tinggi daripada `OPENCLAW_PROXY_URL`.

Jika `enabled=true` tetapi tidak ada URL proksi valid yang dikonfigurasi, perintah terlindungi gagal saat startup alih-alih kembali ke akses jaringan langsung.

Untuk layanan gateway terkelola yang dimulai dengan `openclaw gateway start`, sebaiknya simpan URL di konfigurasi:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Fallback lingkungan paling cocok untuk run foreground. Jika Anda menggunakannya dengan layanan terpasang, letakkan `OPENCLAW_PROXY_URL` di lingkungan durable layanan, seperti `$OPENCLAW_STATE_DIR/.env` atau `~/.openclaw/.env`, lalu instal ulang layanan agar launchd, systemd, atau Scheduled Tasks memulai gateway dengan nilai tersebut.

Untuk perintah `openclaw --container ...`, OpenClaw meneruskan `OPENCLAW_PROXY_URL` ke CLI child yang ditargetkan ke kontainer ketika nilainya disetel. URL harus dapat dijangkau dari dalam kontainer; `127.0.0.1` merujuk ke kontainer itu sendiri, bukan host. OpenClaw menolak URL proksi loopback untuk perintah yang ditargetkan ke kontainer kecuali Anda secara eksplisit mengesampingkan pemeriksaan keamanan tersebut.

## Persyaratan Proksi

Kebijakan proksi adalah batas keamanan. OpenClaw tidak dapat memverifikasi bahwa proksi memblokir target yang benar.

Konfigurasikan proksi untuk:

- Bind hanya ke loopback atau antarmuka privat tepercaya.
- Batasi akses sehingga hanya proses OpenClaw, host, kontainer, atau akun layanan yang dapat menggunakannya.
- Selesaikan resolusi tujuan sendiri dan blokir IP tujuan setelah resolusi DNS.
- Terapkan kebijakan saat koneksi untuk permintaan HTTP biasa dan tunnel HTTPS `CONNECT`.
- Tolak bypass berbasis tujuan untuk rentang loopback, privat, link-local, metadata, multicast, reserved, atau dokumentasi.
- Hindari daftar izin hostname kecuali Anda sepenuhnya memercayai jalur resolusi DNS.
- Catat tujuan, keputusan, status, dan alasan tanpa mencatat body permintaan, header otorisasi, cookie, atau rahasia lainnya.
- Simpan kebijakan proksi di bawah version control dan tinjau perubahan seperti konfigurasi sensitif keamanan.

## Tujuan Terblokir yang Direkomendasikan

Gunakan denylist ini sebagai titik awal untuk proksi forward, firewall, atau kebijakan egress apa pun.

Logika classifier tingkat aplikasi OpenClaw berada di `src/infra/net/ssrf.ts` dan `src/shared/net/ip.ts`. Hook paritas yang relevan adalah `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX`, dan penanganan sentinel IPv4 tertanam untuk NAT64, 6to4, Teredo, ISATAP, dan bentuk IPv4-mapped. File-file tersebut adalah referensi berguna saat memelihara kebijakan proksi eksternal, tetapi OpenClaw tidak secara otomatis mengekspor atau memberlakukan aturan tersebut di proksi Anda.

| Rentang atau host                                                                     | Alasan memblokir                                   |
| ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                      |
| `::1/128`                                                                            | Loopback IPv6                                      |
| `0.0.0.0/8`, `::/128`                                                                | Alamat unspecified dan this-network                |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Jaringan privat RFC1918                            |
| `169.254.0.0/16`, `fe80::/10`                                                        | Alamat link-local dan jalur metadata cloud umum    |
| `169.254.169.254`, `metadata.google.internal`                                        | Layanan metadata cloud                             |
| `100.64.0.0/10`                                                                      | Ruang alamat bersama carrier-grade NAT             |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Rentang benchmarking                               |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Rentang special-use dan dokumentasi                |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                          |
| `240.0.0.0/4`                                                                        | IPv4 reserved                                      |
| `fc00::/7`, `fec0::/10`                                                              | Rentang lokal/privat IPv6                          |
| `100::/64`, `2001:20::/28`                                                           | Rentang discard IPv6 dan ORCHIDv2                  |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefiks NAT64 dengan IPv4 tertanam                 |
| `2002::/16`, `2001::/32`                                                             | 6to4 dan Teredo dengan IPv4 tertanam               |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-compatible dan IPv4-mapped IPv6               |

Jika penyedia cloud atau platform jaringan Anda mendokumentasikan host metadata tambahan atau rentang reserved, tambahkan juga.

## Validasi

Validasikan proksi dari host, kontainer, atau akun layanan yang sama yang menjalankan OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Secara default, ketika tidak ada tujuan kustom yang disediakan, perintah memeriksa bahwa `https://example.com/` berhasil dan memulai canary loopback sementara yang tidak boleh dijangkau oleh proksi. Pemeriksaan ditolak default lulus ketika proksi mengembalikan respons penolakan non-2xx atau memblokir canary dengan kegagalan transport; pemeriksaan gagal jika respons berhasil mencapai canary. Jika tidak ada proksi yang diaktifkan dan dikonfigurasi, validasi melaporkan masalah konfigurasi; gunakan `--proxy-url` untuk preflight sekali pakai sebelum mengubah konfigurasi. Gunakan `--allowed-url` dan `--denied-url` untuk menguji ekspektasi khusus deployment. Tujuan ditolak kustom bersifat fail-closed: respons HTTP apa pun berarti tujuan dapat dijangkau melalui proksi, dan error transport apa pun dilaporkan sebagai tidak konklusif karena OpenClaw tidak dapat membuktikan bahwa proksi memblokir origin yang dapat dijangkau. Jika validasi gagal, perintah keluar dengan kode 1.

Gunakan `--json` untuk otomasi. Output JSON berisi hasil keseluruhan, sumber konfigurasi proksi efektif, error konfigurasi apa pun, dan setiap pemeriksaan tujuan. Kredensial URL proksi disamarkan dalam output teks dan JSON:

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

Permintaan publik seharusnya berhasil. Permintaan loopback dan metadata seharusnya diblokir oleh proksi. Untuk `openclaw proxy validate`, canary loopback bawaan dapat membedakan penolakan proksi dari origin yang dapat dijangkau. Pemeriksaan `--denied-url` kustom tidak memiliki canary tersebut, jadi perlakukan respons HTTP maupun kegagalan transport yang ambigu sebagai kegagalan validasi kecuali proksi Anda mengekspos sinyal penolakan khusus deployment yang dapat Anda verifikasi secara terpisah.

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

- Proksi meningkatkan cakupan untuk klien HTTP dan WebSocket JavaScript dalam proses lokal, tetapi bukan sandbox jaringan tingkat OS.
- Soket mentah `net`, `tls`, dan `http2`, addon native, serta proses anak dapat melewati perutean proksi tingkat Node kecuali mereka mewarisi dan mematuhi variabel lingkungan proksi.
- WebUI lokal pengguna dan server model lokal sebaiknya dimasukkan ke allowlist dalam kebijakan proksi operator bila diperlukan; OpenClaw tidak mengekspos bypass jaringan lokal umum untuk keduanya.
- Bypass proksi control-plane Gateway sengaja dibatasi ke URL IP `localhost` dan loopback literal. Gunakan `ws://127.0.0.1:18789`, `ws://[::1]:18789`, atau `ws://localhost:18789` untuk koneksi control-plane Gateway langsung lokal; hostname lain dirutekan seperti lalu lintas berbasis hostname biasa.
- OpenClaw tidak memeriksa, menguji, atau mensertifikasi kebijakan proksi Anda.
- Perlakukan perubahan kebijakan proksi sebagai perubahan operasional yang sensitif terhadap keamanan.
