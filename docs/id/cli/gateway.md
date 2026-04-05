---
read_when:
    - Menjalankan Gateway dari CLI (dev atau server)
    - Men-debug autentikasi Gateway, mode bind, dan konektivitas
    - Menemukan gateway melalui Bonjour (DNS-SD lokal + area luas)
summary: CLI Gateway OpenClaw (`openclaw gateway`) — jalankan, kueri, dan temukan gateway
title: gateway
x-i18n:
    generated_at: "2026-04-05T13:49:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: e311ded0dbad84b8212f0968f3563998d49c5e0eb292a0dc4b3bd3c22d4fa7f2
    source_path: cli/gateway.md
    workflow: 15
---

# CLI Gateway

Gateway adalah server WebSocket OpenClaw (channel, node, sesi, hook).

Subperintah di halaman ini berada di bawah `openclaw gateway …`.

Dokumentasi terkait:

- [/gateway/bonjour](/gateway/bonjour)
- [/gateway/discovery](/gateway/discovery)
- [/gateway/configuration](/gateway/configuration)

## Menjalankan Gateway

Jalankan proses Gateway lokal:

```bash
openclaw gateway
```

Alias latar depan:

```bash
openclaw gateway run
```

Catatan:

- Secara default, Gateway menolak untuk memulai kecuali `gateway.mode=local` disetel di `~/.openclaw/openclaw.json`. Gunakan `--allow-unconfigured` untuk proses ad-hoc/dev.
- `openclaw onboard --mode local` dan `openclaw setup` diharapkan menulis `gateway.mode=local`. Jika file ada tetapi `gateway.mode` tidak ada, perlakukan itu sebagai konfigurasi yang rusak atau tertimpa dan perbaiki alih-alih mengasumsikan mode lokal secara implisit.
- Jika file ada dan `gateway.mode` tidak ada, Gateway memperlakukannya sebagai kerusakan konfigurasi yang mencurigakan dan menolak untuk “menebak mode lokal” untuk Anda.
- Bind di luar loopback tanpa autentikasi diblokir (guardrail keamanan).
- `SIGUSR1` memicu restart dalam proses jika diizinkan (`commands.restart` aktif secara default; setel `commands.restart: false` untuk memblokir restart manual, sementara penerapan/pembaruan tool/konfigurasi gateway tetap diizinkan).
- Handler `SIGINT`/`SIGTERM` menghentikan proses gateway, tetapi tidak memulihkan status terminal kustom apa pun. Jika Anda membungkus CLI dengan TUI atau input mode mentah, pulihkan terminal sebelum keluar.

### Opsi

- `--port <port>`: port WebSocket (default berasal dari config/env; biasanya `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: mode bind listener.
- `--auth <token|password>`: override mode autentikasi.
- `--token <token>`: override token (juga menetapkan `OPENCLAW_GATEWAY_TOKEN` untuk proses).
- `--password <password>`: override kata sandi. Peringatan: kata sandi inline dapat terlihat di daftar proses lokal.
- `--password-file <path>`: baca kata sandi gateway dari file.
- `--tailscale <off|serve|funnel>`: ekspos Gateway melalui Tailscale.
- `--tailscale-reset-on-exit`: reset konfigurasi Tailscale serve/funnel saat shutdown.
- `--allow-unconfigured`: izinkan gateway mulai tanpa `gateway.mode=local` di config. Ini melewati guard startup hanya untuk bootstrap ad-hoc/dev; ini tidak menulis atau memperbaiki file config.
- `--dev`: buat config + workspace dev jika belum ada (melewati BOOTSTRAP.md).
- `--reset`: reset config + kredensial + sesi + workspace dev (memerlukan `--dev`).
- `--force`: matikan listener yang ada pada port yang dipilih sebelum memulai.
- `--verbose`: log verbose.
- `--cli-backend-logs`: hanya tampilkan log backend CLI di konsol (dan aktifkan stdout/stderr).
- `--claude-cli-logs`: alias usang untuk `--cli-backend-logs`.
- `--ws-log <auto|full|compact>`: gaya log websocket (default `auto`).
- `--compact`: alias untuk `--ws-log compact`.
- `--raw-stream`: log event stream model mentah ke jsonl.
- `--raw-stream-path <path>`: path jsonl stream mentah.

## Mengueri Gateway yang sedang berjalan

Semua perintah kueri menggunakan RPC WebSocket.

Mode output:

- Default: dapat dibaca manusia (berwarna di TTY).
- `--json`: JSON yang dapat dibaca mesin (tanpa styling/spinner).
- `--no-color` (atau `NO_COLOR=1`): nonaktifkan ANSI sambil tetap mempertahankan tata letak untuk manusia.

Opsi bersama (jika didukung):

- `--url <url>`: URL WebSocket Gateway.
- `--token <token>`: token Gateway.
- `--password <password>`: kata sandi Gateway.
- `--timeout <ms>`: timeout/anggaran waktu (bervariasi per perintah).
- `--expect-final`: tunggu respons “final” (panggilan agen).

Catatan: saat Anda menetapkan `--url`, CLI tidak kembali menggunakan kredensial config atau environment.
Berikan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang tidak ada akan menghasilkan error.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

### `gateway usage-cost`

Ambil ringkasan biaya penggunaan dari log sesi.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Opsi:

- `--days <days>`: jumlah hari yang disertakan (default `30`).

### `gateway status`

`gateway status` menampilkan layanan Gateway (launchd/systemd/schtasks) beserta probe RPC opsional.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Opsi:

- `--url <url>`: tambahkan target probe eksplisit. Remote yang dikonfigurasi + localhost tetap diprobe.
- `--token <token>`: autentikasi token untuk probe.
- `--password <password>`: autentikasi kata sandi untuk probe.
- `--timeout <ms>`: timeout probe (default `10000`).
- `--no-probe`: lewati probe RPC (tampilan layanan saja).
- `--deep`: pindai juga layanan tingkat sistem.
- `--require-rpc`: keluar dengan status non-zero saat probe RPC gagal. Tidak dapat digabungkan dengan `--no-probe`.

Catatan:

- `gateway status` tetap tersedia untuk diagnostik meskipun config CLI lokal tidak ada atau tidak valid.
- `gateway status` menyelesaikan SecretRef autentikasi yang dikonfigurasi untuk autentikasi probe jika memungkinkan.
- Jika SecretRef autentikasi yang diperlukan tidak terselesaikan di jalur perintah ini, `gateway status --json` melaporkan `rpc.authWarning` saat konektivitas/autentikasi probe gagal; berikan `--token`/`--password` secara eksplisit atau selesaikan sumber secret terlebih dahulu.
- Jika probe berhasil, peringatan auth-ref yang tidak terselesaikan disembunyikan untuk menghindari positif palsu.
- Gunakan `--require-rpc` dalam skrip dan otomatisasi saat layanan yang mendengarkan saja tidak cukup dan Anda memerlukan RPC Gateway itu sendiri dalam keadaan sehat.
- `--deep` menambahkan pemindaian best-effort untuk instalasi launchd/systemd/schtasks tambahan. Ketika beberapa layanan mirip gateway terdeteksi, output untuk manusia mencetak petunjuk pembersihan dan memperingatkan bahwa sebagian besar setup seharusnya menjalankan satu gateway per mesin.
- Output untuk manusia mencakup path log file yang telah diselesaikan beserta snapshot path/validitas config CLI-vs-service untuk membantu mendiagnosis drift profil atau state-dir.
- Pada instalasi systemd Linux, pemeriksaan drift autentikasi layanan membaca nilai `Environment=` dan `EnvironmentFile=` dari unit (termasuk `%h`, path dalam tanda kutip, beberapa file, dan file opsional `-`).
- Pemeriksaan drift menyelesaikan SecretRef `gateway.auth.token` menggunakan env runtime gabungan (env perintah layanan terlebih dahulu, lalu fallback env proses).
- Jika autentikasi token tidak aktif secara efektif (nilai eksplisit `gateway.auth.mode` adalah `password`/`none`/`trusted-proxy`, atau mode tidak disetel sehingga password bisa menang dan tidak ada kandidat token yang bisa menang), pemeriksaan drift token melewati resolusi token config.

### `gateway probe`

`gateway probe` adalah perintah “debug semuanya”. Perintah ini selalu memprobe:

- gateway remote yang dikonfigurasi (jika ada), dan
- localhost (loopback) **bahkan jika remote dikonfigurasi**.

Jika Anda memberikan `--url`, target eksplisit tersebut ditambahkan di depan keduanya. Output untuk manusia memberi label pada
target sebagai:

- `URL (eksplisit)`
- `Remote (dikonfigurasi)` atau `Remote (dikonfigurasi, tidak aktif)`
- `Local loopback`

Jika beberapa gateway dapat dijangkau, perintah ini mencetak semuanya. Beberapa gateway didukung saat Anda menggunakan profil/port terisolasi (misalnya, rescue bot), tetapi sebagian besar instalasi tetap menjalankan satu gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Interpretasi:

- `Reachable: yes` berarti setidaknya satu target menerima koneksi WebSocket.
- `RPC: ok` berarti panggilan RPC detail (`health`/`status`/`system-presence`/`config.get`) juga berhasil.
- `RPC: limited - missing scope: operator.read` berarti koneksi berhasil tetapi RPC detail dibatasi oleh scope. Ini dilaporkan sebagai keterjangkauan **terdegradasi**, bukan kegagalan penuh.
- Kode keluar non-zero hanya ketika tidak ada target yang diprobe yang dapat dijangkau.

Catatan JSON (`--json`):

- Level atas:
  - `ok`: setidaknya satu target dapat dijangkau.
  - `degraded`: setidaknya satu target memiliki RPC detail yang dibatasi scope.
  - `primaryTargetId`: target terbaik untuk diperlakukan sebagai pemenang aktif dalam urutan ini: URL eksplisit, tunnel SSH, remote yang dikonfigurasi, lalu local loopback.
  - `warnings[]`: catatan peringatan best-effort dengan `code`, `message`, dan `targetIds` opsional.
  - `network`: petunjuk URL local loopback/tailnet yang diturunkan dari config saat ini dan jaringan host.
  - `discovery.timeoutMs` dan `discovery.count`: anggaran penemuan/jumlah hasil aktual yang digunakan untuk pass probe ini.
- Per target (`targets[].connect`):
  - `ok`: keterjangkauan setelah koneksi + klasifikasi terdegradasi.
  - `rpcOk`: keberhasilan penuh RPC detail.
  - `scopeLimited`: RPC detail gagal karena scope operator tidak ada.

Kode peringatan umum:

- `ssh_tunnel_failed`: setup tunnel SSH gagal; perintah kembali menggunakan probe langsung.
- `multiple_gateways`: lebih dari satu target dapat dijangkau; ini tidak biasa kecuali Anda sengaja menjalankan profil terisolasi, seperti rescue bot.
- `auth_secretref_unresolved`: SecretRef autentikasi yang dikonfigurasi tidak dapat diselesaikan untuk target yang gagal.
- `probe_scope_limited`: koneksi WebSocket berhasil, tetapi RPC detail dibatasi karena `operator.read` tidak ada.

#### Remote melalui SSH (paritas app Mac)

Mode “Remote over SSH” pada app macOS menggunakan port-forward lokal sehingga gateway remote (yang mungkin hanya di-bind ke loopback) menjadi dapat dijangkau di `ws://127.0.0.1:<port>`.

Padanan CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Opsi:

- `--ssh <target>`: `user@host` atau `user@host:port` (port default `22`).
- `--ssh-identity <path>`: file identitas.
- `--ssh-auto`: pilih host gateway pertama yang ditemukan sebagai target SSH dari endpoint
  discovery yang telah diselesaikan (`local.` ditambah domain area luas yang dikonfigurasi, jika ada). Petunjuk TXT saja
  diabaikan.

Config (opsional, digunakan sebagai default):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Helper RPC level rendah.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

Opsi:

- `--params <json>`: string objek JSON untuk parameter (default `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

Catatan:

- `--params` harus berupa JSON yang valid.
- `--expect-final` terutama untuk RPC gaya agen yang mengalirkan event perantara sebelum payload final.

## Mengelola layanan Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

Opsi perintah:

- `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `gateway uninstall|start|stop|restart`: `--json`

Catatan:

- `gateway install` mendukung `--port`, `--runtime`, `--token`, `--force`, `--json`.
- Ketika autentikasi token memerlukan token dan `gateway.auth.token` dikelola oleh SecretRef, `gateway install` memvalidasi bahwa SecretRef dapat diselesaikan tetapi tidak menyimpan token yang telah diselesaikan ke metadata environment layanan.
- Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi tidak terselesaikan, instalasi gagal secara tertutup alih-alih menyimpan fallback plaintext.
- Untuk autentikasi kata sandi pada `gateway run`, pilih `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, atau `gateway.auth.password` berbasis SecretRef daripada `--password` inline.
- Dalam mode autentikasi tersimpulkan, `OPENCLAW_GATEWAY_PASSWORD` yang hanya ada di shell tidak melonggarkan persyaratan token instalasi; gunakan konfigurasi yang persisten (`gateway.auth.password` atau `env` config) saat menginstal layanan terkelola.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` tidak disetel, instalasi diblokir sampai mode disetel secara eksplisit.
- Perintah siklus hidup menerima `--json` untuk scripting.

## Menemukan gateway (Bonjour)

`gateway discover` memindai beacon Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): pilih domain (contoh: `openclaw.internal.`) dan siapkan split DNS + server DNS; lihat [/gateway/bonjour](/gateway/bonjour)

Hanya gateway dengan discovery Bonjour yang diaktifkan (default) yang mengiklankan beacon.

Rekaman discovery Wide-Area menyertakan (TXT):

- `role` (petunjuk peran gateway)
- `transport` (petunjuk transport, misalnya `gateway`)
- `gatewayPort` (port WebSocket, biasanya `18789`)
- `sshPort` (opsional; klien menggunakan target SSH default `22` ketika ini tidak ada)
- `tailnetDns` (hostname MagicDNS, jika tersedia)
- `gatewayTls` / `gatewayTlsSha256` (TLS diaktifkan + sidik jari sertifikat)
- `cliPath` (petunjuk instalasi remote yang ditulis ke zona area luas)

### `gateway discover`

```bash
openclaw gateway discover
```

Opsi:

- `--timeout <ms>`: timeout per perintah (browse/resolve); default `2000`.
- `--json`: output yang dapat dibaca mesin (juga menonaktifkan styling/spinner).

Contoh:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Catatan:

- CLI memindai `local.` ditambah domain area luas yang dikonfigurasi saat ada yang diaktifkan.
- `wsUrl` dalam output JSON diturunkan dari endpoint layanan yang telah diselesaikan, bukan dari petunjuk
  TXT saja seperti `lanHost` atau `tailnetDns`.
- Pada mDNS `local.`, `sshPort` dan `cliPath` hanya disiarkan ketika
  `discovery.mdns.mode` adalah `full`. Wide-area DNS-SD tetap menulis `cliPath`; `sshPort`
  tetap opsional di sana juga.
