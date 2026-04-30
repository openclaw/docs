---
read_when:
    - Anda menginginkan pertahanan berlapis terhadap serangan SSRF dan pengikatan ulang DNS
    - Mengonfigurasi proxy penerus eksternal untuk lalu lintas runtime OpenClaw
summary: Cara merutekan lalu lintas HTTP dan WebSocket runtime OpenClaw melalui proksi pemfilteran yang dikelola operator
title: Proksi jaringan
x-i18n:
    generated_at: "2026-04-30T10:12:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4e879f787571410acdda55dcdbb5fd77aef1d24045af5c9208cba51330a70ca
    source_path: security/network-proxy.md
    workflow: 16
---

# Proksi Jaringan

OpenClaw dapat merutekan lalu lintas HTTP dan WebSocket runtime melalui proksi maju yang dikelola operator. Ini adalah pertahanan berlapis opsional untuk deployment yang menginginkan kontrol egress terpusat, perlindungan SSRF yang lebih kuat, dan auditabilitas jaringan yang lebih baik.

OpenClaw tidak mengirimkan, mengunduh, memulai, mengonfigurasi, atau mensertifikasi proksi. Anda menjalankan teknologi proksi yang sesuai dengan lingkungan Anda, dan OpenClaw merutekan klien HTTP dan WebSocket lokal-proses biasa melaluinya.

## Mengapa Menggunakan Proksi?

Proksi memberi operator satu titik kontrol jaringan untuk lalu lintas HTTP dan WebSocket keluar. Itu dapat berguna bahkan di luar pengerasan SSRF:

- Kebijakan terpusat: pertahankan satu kebijakan egress alih-alih mengandalkan setiap lokasi panggilan HTTP aplikasi untuk menerapkan aturan jaringan dengan benar.
- Pemeriksaan saat koneksi: evaluasi tujuan setelah resolusi DNS dan tepat sebelum proksi membuka koneksi upstream.
- Pertahanan DNS rebinding: kurangi jarak antara pemeriksaan DNS tingkat aplikasi dan koneksi keluar yang sebenarnya.
- Cakupan JavaScript yang lebih luas: rutekan klien biasa seperti `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch, dan klien serupa melalui jalur yang sama.
- Auditabilitas: catat tujuan yang diizinkan dan ditolak di batas egress.
- Kontrol operasional: terapkan aturan tujuan, segmentasi jaringan, batas laju, atau allowlist keluar tanpa membangun ulang OpenClaw.

Perutean proksi adalah guardrail tingkat proses untuk egress HTTP dan WebSocket biasa. Ini memberi operator jalur fail-closed untuk merutekan klien HTTP JavaScript yang didukung melalui proksi pemfilteran mereka sendiri, tetapi ini bukan sandbox jaringan tingkat OS dan tidak membuat OpenClaw mensertifikasi kebijakan tujuan proksi.

## Cara OpenClaw Merutekan Lalu Lintas

Ketika `proxy.enabled=true` dan URL proksi dikonfigurasi, proses runtime terlindungi seperti `openclaw gateway run`, `openclaw node run`, dan `openclaw agent --local` merutekan egress HTTP dan WebSocket biasa melalui proksi yang dikonfigurasi:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Kontrak publiknya adalah perilaku perutean, bukan hook internal Node yang digunakan untuk mengimplementasikannya. Klien WebSocket control-plane OpenClaw Gateway menggunakan jalur langsung yang sempit untuk lalu lintas RPC Gateway local loopback ketika URL Gateway menggunakan `localhost` atau IP loopback literal seperti `127.0.0.1` atau `[::1]`. Jalur control-plane itu harus dapat menjangkau Gateway loopback bahkan ketika proksi operator memblokir tujuan loopback. Permintaan HTTP dan WebSocket runtime biasa tetap menggunakan proksi yang dikonfigurasi.

Secara internal, OpenClaw menggunakan dua hook perutean tingkat proses untuk fitur ini:

- Perutean dispatcher Undici mencakup `fetch`, klien berbasis undici, dan transport yang menyediakan dispatcher undici sendiri.
- Perutean `global-agent` mencakup pemanggil inti Node `node:http` dan `node:https`, termasuk banyak pustaka yang dibangun di atas `http.request`, `https.request`, `http.get`, dan `https.get`. Mode proksi terkelola memaksa agen global itu agar agen HTTP Node eksplisit tidak secara tidak sengaja melewati proksi operator.

Beberapa plugin memiliki transport khusus yang memerlukan pengawatan proksi eksplisit bahkan ketika perutean tingkat proses sudah ada. Misalnya, transport Bot API Telegram menggunakan dispatcher undici HTTP/1 miliknya sendiri dan karena itu menghormati env proksi proses plus fallback `OPENCLAW_PROXY_URL` terkelola di jalur transport khusus pemilik tersebut.

URL proksi itu sendiri harus menggunakan `http://`. Tujuan HTTPS tetap didukung melalui proksi dengan HTTP `CONNECT`; ini hanya berarti OpenClaw mengharapkan listener proksi-maju HTTP polos seperti `http://127.0.0.1:3128`.

Saat proksi aktif, OpenClaw menghapus `no_proxy`, `NO_PROXY`, dan `GLOBAL_AGENT_NO_PROXY`. Daftar bypass tersebut berbasis tujuan, sehingga membiarkan `localhost` atau `127.0.0.1` di sana akan membuat target SSRF berisiko tinggi melewati proksi pemfilteran.

Saat shutdown, OpenClaw memulihkan lingkungan proksi sebelumnya dan mereset status perutean proses yang di-cache.

## Istilah Proksi Terkait

- `proxy.enabled` / `proxy.proxyUrl`: perutean proksi-maju keluar untuk egress runtime OpenClaw. Halaman ini mendokumentasikan fitur tersebut.
- `gateway.auth.mode: "trusted-proxy"`: autentikasi proksi-balik masuk yang sadar identitas untuk akses Gateway. Lihat [autentikasi proksi tepercaya](/id/gateway/trusted-proxy-auth).
- `openclaw proxy`: proksi debug lokal dan pemeriksa tangkapan untuk pengembangan dan dukungan. Lihat [openclaw proxy](/id/cli/proxy).
- Pengaturan proksi khusus channel atau penyedia: override khusus pemilik untuk transport tertentu. Utamakan proksi jaringan terkelola ketika tujuannya adalah kontrol egress terpusat di seluruh runtime.

## Konfigurasi

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Anda juga dapat menyediakan URL melalui lingkungan, sambil tetap menyimpan `proxy.enabled=true` di konfigurasi:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` lebih diprioritaskan daripada `OPENCLAW_PROXY_URL`.

Jika `enabled=true` tetapi tidak ada URL proksi valid yang dikonfigurasi, perintah terlindungi gagal saat startup alih-alih kembali ke akses jaringan langsung.

Untuk layanan gateway terkelola yang dimulai dengan `openclaw gateway start`, utamakan menyimpan URL di konfigurasi:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Fallback lingkungan paling cocok untuk run foreground. Jika Anda menggunakannya dengan layanan terinstal, letakkan `OPENCLAW_PROXY_URL` di lingkungan tahan lama layanan, seperti `$OPENCLAW_STATE_DIR/.env` atau `~/.openclaw/.env`, lalu instal ulang layanan agar launchd, systemd, atau Scheduled Tasks memulai gateway dengan nilai tersebut.

Untuk perintah `openclaw --container ...`, OpenClaw meneruskan `OPENCLAW_PROXY_URL` ke CLI anak yang ditargetkan ke container ketika variabel itu disetel. URL harus dapat dijangkau dari dalam container; `127.0.0.1` merujuk ke container itu sendiri, bukan host. OpenClaw menolak URL proksi loopback untuk perintah yang ditargetkan ke container kecuali Anda secara eksplisit mengesampingkan pemeriksaan keselamatan tersebut.

## Persyaratan Proksi

Kebijakan proksi adalah batas keamanan. OpenClaw tidak dapat memverifikasi bahwa proksi memblokir target yang tepat.

Konfigurasikan proksi untuk:

- Bind hanya ke loopback atau antarmuka privat tepercaya.
- Batasi akses sehingga hanya proses, host, container, atau akun layanan OpenClaw yang dapat menggunakannya.
- Menyelesaikan tujuan sendiri dan memblokir IP tujuan setelah resolusi DNS.
- Menerapkan kebijakan pada waktu koneksi untuk permintaan HTTP polos dan tunnel HTTPS `CONNECT`.
- Menolak bypass berbasis tujuan untuk rentang loopback, privat, link-local, metadata, multicast, reserved, atau dokumentasi.
- Hindari allowlist hostname kecuali Anda sepenuhnya memercayai jalur resolusi DNS.
- Catat tujuan, keputusan, status, dan alasan tanpa mencatat body permintaan, header otorisasi, cookie, atau rahasia lainnya.
- Simpan kebijakan proksi di bawah kontrol versi dan tinjau perubahan seperti konfigurasi sensitif keamanan.

## Tujuan Terblokir yang Direkomendasikan

Gunakan denylist ini sebagai titik awal untuk proksi maju, firewall, atau kebijakan egress apa pun.

Logika classifier tingkat aplikasi OpenClaw berada di `src/infra/net/ssrf.ts` dan `src/shared/net/ip.ts`. Hook paritas yang relevan adalah `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX`, dan penanganan sentinel IPv4 tertanam untuk NAT64, 6to4, Teredo, ISATAP, dan bentuk IPv4-mapped. File-file tersebut adalah referensi yang berguna saat memelihara kebijakan proksi eksternal, tetapi OpenClaw tidak secara otomatis mengekspor atau menerapkan aturan tersebut di proksi Anda.

| Rentang atau host                                                                    | Mengapa diblokir                                      |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                         |
| `::1/128`                                                                            | Loopback IPv6                                         |
| `0.0.0.0/8`, `::/128`                                                                | Alamat unspecified dan this-network                   |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Jaringan privat RFC1918                               |
| `169.254.0.0/16`, `fe80::/10`                                                        | Alamat link-local dan jalur metadata cloud umum       |
| `169.254.169.254`, `metadata.google.internal`                                        | Layanan metadata cloud                                |
| `100.64.0.0/10`                                                                      | Ruang alamat bersama NAT carrier-grade                |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Rentang benchmarking                                  |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Rentang special-use dan dokumentasi                   |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                             |
| `240.0.0.0/4`                                                                        | IPv4 reserved                                         |
| `fc00::/7`, `fec0::/10`                                                              | Rentang lokal/privat IPv6                             |
| `100::/64`, `2001:20::/28`                                                           | Rentang discard IPv6 dan ORCHIDv2                     |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefiks NAT64 dengan IPv4 tertanam                    |
| `2002::/16`, `2001::/32`                                                             | 6to4 dan Teredo dengan IPv4 tertanam                  |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 yang kompatibel IPv4 dan IPv4-mapped             |

Jika penyedia cloud atau platform jaringan Anda mendokumentasikan host metadata atau rentang reserved tambahan, tambahkan juga.

## Validasi

Validasi proksi dari host, container, atau akun layanan yang sama yang menjalankan OpenClaw:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

Permintaan publik harus berhasil. Permintaan loopback dan metadata harus gagal di proksi.

Kemudian aktifkan perutean proksi OpenClaw:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

atau setel:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## Batasan

- Proksi meningkatkan cakupan untuk klien HTTP dan WebSocket JavaScript lokal-proses, tetapi ini bukan sandbox jaringan tingkat OS.
- Socket raw `net`, `tls`, dan `http2`, addon native, serta proses anak dapat melewati perutean proksi tingkat Node kecuali mereka mewarisi dan menghormati variabel lingkungan proksi.
- WebUI lokal pengguna dan server model lokal harus dimasukkan ke allowlist dalam kebijakan proksi operator saat diperlukan; OpenClaw tidak mengekspos bypass jaringan lokal umum untuk mereka.
- Bypass proksi control-plane Gateway sengaja dibatasi ke `localhost` dan URL IP loopback literal. Gunakan `ws://127.0.0.1:18789`, `ws://[::1]:18789`, atau `ws://localhost:18789` untuk koneksi control-plane Gateway langsung lokal; hostname lain dirutekan seperti lalu lintas berbasis hostname biasa.
- OpenClaw tidak memeriksa, menguji, atau mensertifikasi kebijakan proksi Anda.
- Perlakukan perubahan kebijakan proksi sebagai perubahan operasional yang sensitif terhadap keamanan.
