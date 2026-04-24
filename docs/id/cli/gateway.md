---
read_when:
    - Menjalankan Gateway dari CLI (pengembangan atau server)
    - Men-debug autentikasi, mode bind, dan konektivitas Gateway
    - Menemukan gateway melalui Bonjour (DNS-SD lokal + wide-area)
summary: CLI Gateway OpenClaw (`openclaw gateway`) — jalankan, kueri, dan temukan gateway
title: Gateway
x-i18n:
    generated_at: "2026-04-24T09:01:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 011b8c8f86de6ecafbf17357a458956357ebe8285fe86e2bf875a4e2d87b5126
    source_path: cli/gateway.md
    workflow: 15
---

# CLI Gateway

Gateway adalah server WebSocket OpenClaw (channel, node, sesi, hook).

Subperintah di halaman ini berada di bawah `openclaw gateway …`.

Dokumen terkait:

- [/gateway/bonjour](/id/gateway/bonjour)
- [/gateway/discovery](/id/gateway/discovery)
- [/gateway/configuration](/id/gateway/configuration)

## Jalankan Gateway

Jalankan proses Gateway lokal:

```bash
openclaw gateway
```

Alias foreground:

```bash
openclaw gateway run
```

Catatan:

- Secara default, Gateway menolak untuk mulai kecuali `gateway.mode=local` diatur di `~/.openclaw/openclaw.json`. Gunakan `--allow-unconfigured` untuk run ad-hoc/dev.
- `openclaw onboard --mode local` dan `openclaw setup` seharusnya menulis `gateway.mode=local`. Jika file ada tetapi `gateway.mode` tidak ada, perlakukan itu sebagai config yang rusak atau tertimpa dan perbaiki alih-alih mengasumsikan mode lokal secara implisit.
- Jika file ada dan `gateway.mode` tidak ada, Gateway memperlakukan itu sebagai kerusakan config yang mencurigakan dan menolak “menebak lokal” untuk Anda.
- Bind di luar loopback tanpa autentikasi diblokir (guardrail keamanan).
- `SIGUSR1` memicu restart dalam proses saat diizinkan (`commands.restart` diaktifkan secara default; atur `commands.restart: false` untuk memblokir restart manual, sementara penerapan/pembaruan alat/config gateway tetap diizinkan).
- Handler `SIGINT`/`SIGTERM` menghentikan proses gateway, tetapi tidak memulihkan status terminal kustom apa pun. Jika Anda membungkus CLI dengan TUI atau input mode mentah, pulihkan terminal sebelum keluar.

### Opsi

- `--port <port>`: port WebSocket (default berasal dari config/env; biasanya `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: mode bind listener.
- `--auth <token|password>`: override mode autentikasi.
- `--token <token>`: override token (juga menetapkan `OPENCLAW_GATEWAY_TOKEN` untuk proses).
- `--password <password>`: override kata sandi. Peringatan: kata sandi inline dapat terekspos di daftar proses lokal.
- `--password-file <path>`: baca kata sandi gateway dari file.
- `--tailscale <off|serve|funnel>`: ekspos Gateway melalui Tailscale.
- `--tailscale-reset-on-exit`: reset config serve/funnel Tailscale saat shutdown.
- `--allow-unconfigured`: izinkan gateway mulai tanpa `gateway.mode=local` di config. Ini melewati guard startup hanya untuk bootstrap ad-hoc/dev; ini tidak menulis atau memperbaiki file config.
- `--dev`: buat config + workspace dev jika belum ada (melewati `BOOTSTRAP.md`).
- `--reset`: reset config + kredensial + sesi + workspace dev (memerlukan `--dev`).
- `--force`: matikan listener yang ada pada port yang dipilih sebelum mulai.
- `--verbose`: log verbose.
- `--cli-backend-logs`: hanya tampilkan log backend CLI di konsol (dan aktifkan stdout/stderr).
- `--ws-log <auto|full|compact>`: gaya log websocket (default `auto`).
- `--compact`: alias untuk `--ws-log compact`.
- `--raw-stream`: catat peristiwa stream model mentah ke jsonl.
- `--raw-stream-path <path>`: path jsonl stream mentah.

Profiling startup:

- Atur `OPENCLAW_GATEWAY_STARTUP_TRACE=1` untuk mencatat timing fase selama startup Gateway.
- Jalankan `pnpm test:startup:gateway -- --runs 5 --warmup 1` untuk membenchmark startup Gateway. Benchmark mencatat output proses pertama, `/healthz`, `/readyz`, dan timing jejak startup.

## Kueri Gateway yang sedang berjalan

Semua perintah kueri menggunakan WebSocket RPC.

Mode output:

- Default: dapat dibaca manusia (berwarna di TTY).
- `--json`: JSON yang dapat dibaca mesin (tanpa styling/spinner).
- `--no-color` (atau `NO_COLOR=1`): nonaktifkan ANSI sambil tetap mempertahankan tata letak untuk manusia.

Opsi bersama (jika didukung):

- `--url <url>`: URL WebSocket Gateway.
- `--token <token>`: token Gateway.
- `--password <password>`: kata sandi Gateway.
- `--timeout <ms>`: batas waktu/anggaran (bervariasi per perintah).
- `--expect-final`: tunggu respons “final” (pemanggilan agen).

Catatan: saat Anda menetapkan `--url`, CLI tidak menggunakan fallback ke kredensial config atau environment.
Berikan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang tidak ada adalah error.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Endpoint HTTP `/healthz` adalah probe liveness: endpoint ini mengembalikan hasil setelah server dapat menjawab HTTP. Endpoint HTTP `/readyz` lebih ketat dan tetap merah selama sidecar startup, channel, atau hook yang dikonfigurasi masih dalam proses stabil.

### `gateway usage-cost`

Ambil ringkasan usage-cost dari log sesi.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Opsi:

- `--days <days>`: jumlah hari yang disertakan (default `30`).

### `gateway stability`

Ambil perekam stability diagnostik terbaru dari Gateway yang sedang berjalan.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

Opsi:

- `--limit <limit>`: jumlah maksimum peristiwa terbaru yang disertakan (default `25`, maks `1000`).
- `--type <type>`: filter berdasarkan jenis peristiwa diagnostik, seperti `payload.large` atau `diagnostic.memory.pressure`.
- `--since-seq <seq>`: sertakan hanya peristiwa setelah nomor urut diagnostik.
- `--bundle [path]`: baca bundle stability tersimpan alih-alih memanggil Gateway yang sedang berjalan. Gunakan `--bundle latest` (atau cukup `--bundle`) untuk bundle terbaru di bawah direktori status, atau berikan path JSON bundle secara langsung.
- `--export`: tulis zip diagnostik dukungan yang dapat dibagikan alih-alih mencetak detail stability.
- `--output <path>`: path output untuk `--export`.

Catatan:

- Rekaman menyimpan metadata operasional: nama peristiwa, jumlah, ukuran byte, pembacaan memori, status antrean/sesi, nama channel/plugin, dan ringkasan sesi yang disamarkan. Rekaman tidak menyimpan teks chat, body webhook, output alat, body permintaan atau respons mentah, token, cookie, nilai secret, hostname, atau id sesi mentah. Atur `diagnostics.enabled: false` untuk menonaktifkan perekam sepenuhnya.
- Pada keluarnya Gateway yang fatal, timeout shutdown, dan kegagalan startup saat restart, OpenClaw menulis snapshot diagnostik yang sama ke `~/.openclaw/logs/stability/openclaw-stability-*.json` saat perekam memiliki peristiwa. Periksa bundle terbaru dengan `openclaw gateway stability --bundle latest`; `--limit`, `--type`, dan `--since-seq` juga berlaku untuk output bundle.

### `gateway diagnostics export`

Tulis zip diagnostik lokal yang dirancang untuk dilampirkan ke laporan bug.
Untuk model privasi dan isi bundle, lihat [Ekspor Diagnostik](/id/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

Opsi:

- `--output <path>`: path zip output. Default ke ekspor dukungan di bawah direktori status.
- `--log-lines <count>`: jumlah maksimum baris log tersanitasi yang disertakan (default `5000`).
- `--log-bytes <bytes>`: jumlah maksimum byte log yang diperiksa (default `1000000`).
- `--url <url>`: URL WebSocket Gateway untuk snapshot health.
- `--token <token>`: token Gateway untuk snapshot health.
- `--password <password>`: kata sandi Gateway untuk snapshot health.
- `--timeout <ms>`: batas waktu snapshot status/health (default `3000`).
- `--no-stability-bundle`: lewati lookup bundle stability tersimpan.
- `--json`: cetak path yang ditulis, ukuran, dan manifest sebagai JSON.

Ekspor berisi manifest, ringkasan Markdown, bentuk config, detail config tersanitasi, ringkasan log tersanitasi, snapshot status/health Gateway tersanitasi, dan bundle stability terbaru jika ada.

Ekspor ini dimaksudkan untuk dibagikan. Ekspor ini menyimpan detail operasional yang membantu debugging, seperti field log OpenClaw yang aman, nama subsistem, kode status, durasi, mode yang dikonfigurasi, port, id plugin, id provider, pengaturan fitur non-secret, dan pesan log operasional yang disamarkan. Ekspor ini menghilangkan atau menyamarkan teks chat, body webhook, output alat, kredensial, cookie, pengenal akun/pesan, teks prompt/instruksi, hostname, dan nilai secret. Saat pesan bergaya LogTape terlihat seperti teks payload pengguna/chat/alat, ekspor hanya menyimpan bahwa sebuah pesan dihilangkan beserta jumlah bytenya.

### `gateway status`

`gateway status` menampilkan layanan Gateway (launchd/systemd/schtasks) plus probe opsional atas konektivitas/kapabilitas autentikasi.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Opsi:

- `--url <url>`: tambahkan target probe eksplisit. Remote yang dikonfigurasi + localhost tetap diprobe.
- `--token <token>`: autentikasi token untuk probe.
- `--password <password>`: autentikasi kata sandi untuk probe.
- `--timeout <ms>`: batas waktu probe (default `10000`).
- `--no-probe`: lewati probe konektivitas (tampilan hanya layanan).
- `--deep`: pindai layanan tingkat sistem juga.
- `--require-rpc`: tingkatkan probe konektivitas default menjadi probe baca dan keluar non-zero saat probe baca itu gagal. Tidak dapat digabungkan dengan `--no-probe`.

Catatan:

- `gateway status` tetap tersedia untuk diagnostik bahkan saat config CLI lokal tidak ada atau tidak valid.
- `gateway status` default membuktikan status layanan, koneksi WebSocket, dan kapabilitas autentikasi yang terlihat saat handshake. Ini tidak membuktikan operasi baca/tulis/admin.
- `gateway status` me-resolve SecretRef autentikasi yang dikonfigurasi untuk autentikasi probe bila memungkinkan.
- Jika SecretRef autentikasi yang diperlukan tidak ter-resolve di path perintah ini, `gateway status --json` melaporkan `rpc.authWarning` saat konektivitas/autentikasi probe gagal; berikan `--token`/`--password` secara eksplisit atau resolve sumber secret terlebih dahulu.
- Jika probe berhasil, peringatan auth-ref yang tidak ter-resolve disembunyikan untuk menghindari false positive.
- Gunakan `--require-rpc` dalam skrip dan otomasi saat layanan yang mendengarkan saja tidak cukup dan Anda juga perlu memastikan pemanggilan RPC dengan cakupan baca sehat.
- `--deep` menambahkan pemindaian best-effort untuk pemasangan launchd/systemd/schtasks tambahan. Saat beberapa layanan mirip gateway terdeteksi, output untuk manusia mencetak petunjuk pembersihan dan memperingatkan bahwa sebagian besar penyiapan seharusnya menjalankan satu gateway per mesin.
- Output untuk manusia mencakup path log file yang di-resolve plus snapshot path/validitas config CLI-vs-service untuk membantu mendiagnosis drift profil atau direktori status.
- Pada pemasangan systemd Linux, pemeriksaan drift autentikasi layanan membaca nilai `Environment=` dan `EnvironmentFile=` dari unit (termasuk `%h`, path yang dikutip, beberapa file, dan file opsional `-`).
- Pemeriksaan drift me-resolve SecretRef `gateway.auth.token` menggunakan env runtime gabungan (env perintah layanan terlebih dahulu, lalu fallback env proses).
- Jika autentikasi token tidak aktif secara efektif (mode `gateway.auth.mode` eksplisit `password`/`none`/`trusted-proxy`, atau mode tidak diatur saat password dapat menang dan tidak ada kandidat token yang dapat menang), pemeriksaan token-drift melewati resolusi token config.

### `gateway probe`

`gateway probe` adalah perintah “debug semuanya”. Perintah ini selalu memprobe:

- gateway remote yang Anda konfigurasi (jika diatur), dan
- localhost (loopback) **bahkan jika remote dikonfigurasi**.

Jika Anda memberikan `--url`, target eksplisit itu ditambahkan di depan keduanya. Output untuk manusia memberi label
target sebagai:

- `URL (explicit)`
- `Remote (configured)` atau `Remote (configured, inactive)`
- `Local loopback`

Jika beberapa gateway dapat dijangkau, perintah ini mencetak semuanya. Beberapa gateway didukung saat Anda menggunakan profil/port terisolasi (misalnya bot penyelamat), tetapi sebagian besar pemasangan tetap menjalankan satu gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Interpretasi:

- `Reachable: yes` berarti setidaknya satu target menerima koneksi WebSocket.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` melaporkan apa yang dapat dibuktikan probe tentang autentikasi. Ini terpisah dari keterjangkauan.
- `Read probe: ok` berarti pemanggilan RPC detail cakupan baca (`health`/`status`/`system-presence`/`config.get`) juga berhasil.
- `Read probe: limited - missing scope: operator.read` berarti koneksi berhasil tetapi RPC cakupan baca terbatas. Ini dilaporkan sebagai keterjangkauan **degraded**, bukan kegagalan penuh.
- Kode keluar non-zero hanya saat tidak ada target yang diprobe yang dapat dijangkau.

Catatan JSON (`--json`):

- Tingkat atas:
  - `ok`: setidaknya satu target dapat dijangkau.
  - `degraded`: setidaknya satu target memiliki RPC detail yang terbatas cakupannya.
  - `capability`: kapabilitas terbaik yang terlihat di seluruh target yang dapat dijangkau (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, atau `unknown`).
  - `primaryTargetId`: target terbaik untuk diperlakukan sebagai pemenang aktif dalam urutan ini: URL eksplisit, tunnel SSH, remote yang dikonfigurasi, lalu local loopback.
  - `warnings[]`: rekaman peringatan best-effort dengan `code`, `message`, dan `targetIds` opsional.
  - `network`: petunjuk URL local loopback/tailnet yang diturunkan dari config saat ini dan jaringan host.
  - `discovery.timeoutMs` dan `discovery.count`: anggaran/hasil penemuan aktual yang digunakan untuk pass probe ini.
- Per target (`targets[].connect`):
  - `ok`: keterjangkauan setelah klasifikasi connect + degraded.
  - `rpcOk`: keberhasilan RPC detail penuh.
  - `scopeLimited`: RPC detail gagal karena cakupan operator tidak ada.
- Per target (`targets[].auth`):
  - `role`: peran autentikasi yang dilaporkan dalam `hello-ok` bila tersedia.
  - `scopes`: cakupan yang diberikan dan dilaporkan dalam `hello-ok` bila tersedia.
  - `capability`: klasifikasi kapabilitas autentikasi yang dimunculkan untuk target tersebut.

Kode peringatan umum:

- `ssh_tunnel_failed`: penyiapan tunnel SSH gagal; perintah menggunakan fallback ke probe langsung.
- `multiple_gateways`: lebih dari satu target dapat dijangkau; ini tidak biasa kecuali Anda sengaja menjalankan profil terisolasi, seperti bot penyelamat.
- `auth_secretref_unresolved`: SecretRef autentikasi yang dikonfigurasi tidak dapat di-resolve untuk target yang gagal.
- `probe_scope_limited`: koneksi WebSocket berhasil, tetapi probe baca dibatasi karena `operator.read` tidak ada.

#### Remote melalui SSH (paritas aplikasi Mac)

Mode macOS app “Remote over SSH” menggunakan port-forward lokal sehingga gateway remote (yang mungkin hanya bind ke loopback) menjadi dapat dijangkau di `ws://127.0.0.1:<port>`.

Padanan CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Opsi:

- `--ssh <target>`: `user@host` atau `user@host:port` (port default ke `22`).
- `--ssh-identity <path>`: file identitas.
- `--ssh-auto`: pilih host gateway pertama yang ditemukan sebagai target SSH dari endpoint penemuan
  yang sudah di-resolve (`local.` plus domain wide-area yang dikonfigurasi, jika ada). Petunjuk
  yang hanya-TXT diabaikan.

Config (opsional, digunakan sebagai default):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Helper RPC tingkat rendah.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

Opsi:

- `--params <json>`: string objek JSON untuk params (default `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

Catatan:

- `--params` harus berupa JSON yang valid.
- `--expect-final` terutama untuk RPC bergaya agen yang men-stream peristiwa perantara sebelum payload final.

## Kelola layanan Gateway

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
- Saat autentikasi token memerlukan token dan `gateway.auth.token` dikelola SecretRef, `gateway install` memvalidasi bahwa SecretRef dapat di-resolve tetapi tidak menyimpan token yang sudah di-resolve ke metadata env layanan.
- Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi tidak ter-resolve, pemasangan gagal secara tertutup alih-alih menyimpan fallback plaintext.
- Untuk autentikasi kata sandi pada `gateway run`, utamakan `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, atau `gateway.auth.password` berbasis SecretRef daripada `--password` inline.
- Dalam mode autentikasi inferred, `OPENCLAW_GATEWAY_PASSWORD` yang hanya ada di shell tidak melonggarkan persyaratan token instalasi; gunakan config yang persisten (`gateway.auth.password` atau config `env`) saat memasang layanan terkelola.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` tidak diatur, pemasangan diblokir sampai mode diatur secara eksplisit.
- Perintah siklus hidup menerima `--json` untuk scripting.

## Temukan gateway (Bonjour)

`gateway discover` memindai beacon Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): pilih domain (contoh: `openclaw.internal.`) dan siapkan split DNS + server DNS; lihat [/gateway/bonjour](/id/gateway/bonjour)

Hanya gateway dengan penemuan Bonjour yang diaktifkan (default) yang mengiklankan beacon.

Rekaman penemuan Wide-Area menyertakan (TXT):

- `role` (petunjuk peran gateway)
- `transport` (petunjuk transport, mis. `gateway`)
- `gatewayPort` (port WebSocket, biasanya `18789`)
- `sshPort` (opsional; klien menggunakan target SSH default `22` saat ini tidak ada)
- `tailnetDns` (hostname MagicDNS, jika tersedia)
- `gatewayTls` / `gatewayTlsSha256` (TLS diaktifkan + fingerprint sertifikat)
- `cliPath` (petunjuk remote-install yang ditulis ke zona wide-area)

### `gateway discover`

```bash
openclaw gateway discover
```

Opsi:

- `--timeout <ms>`: batas waktu per perintah (browse/resolve); default `2000`.
- `--json`: output yang dapat dibaca mesin (juga menonaktifkan styling/spinner).

Contoh:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Catatan:

- CLI memindai `local.` plus domain wide-area yang dikonfigurasi saat domain tersebut diaktifkan.
- `wsUrl` dalam output JSON diturunkan dari endpoint layanan yang sudah di-resolve, bukan dari petunjuk
  yang hanya-TXT seperti `lanHost` atau `tailnetDns`.
- Pada mDNS `local.`, `sshPort` dan `cliPath` hanya disiarkan saat
  `discovery.mdns.mode` adalah `full`. Wide-area DNS-SD tetap menulis `cliPath`; `sshPort`
  tetap opsional di sana juga.

## Terkait

- [Referensi CLI](/id/cli)
- [Runbook Gateway](/id/gateway)
