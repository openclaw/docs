---
read_when:
    - Menjalankan Gateway dari CLI (dev atau server)
    - Men-debug autentikasi, mode bind, dan konektivitas Gateway
    - Menemukan gateway melalui Bonjour (DNS-SD lokal + wide-area)
sidebarTitle: Gateway
summary: CLI Gateway OpenClaw (`openclaw gateway`) — jalankan, kueri, dan temukan gateway
title: Gateway
x-i18n:
    generated_at: "2026-04-26T11:26:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8cdca95676f0b098e2dd79ff4245a32eaae82711ed6c2b7e39522331872cfd9
    source_path: cli/gateway.md
    workflow: 15
---

Gateway adalah server WebSocket OpenClaw (channel, node, sesi, hook). Subperintah di halaman ini berada di bawah `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Penemuan Bonjour" href="/id/gateway/bonjour">
    Penyiapan mDNS lokal + DNS-SD wide-area.
  </Card>
  <Card title="Ikhtisar penemuan" href="/id/gateway/discovery">
    Cara OpenClaw mengiklankan dan menemukan gateway.
  </Card>
  <Card title="Konfigurasi" href="/id/gateway/configuration">
    Kunci konfigurasi gateway tingkat atas.
  </Card>
</CardGroup>

## Jalankan Gateway

Jalankan proses Gateway lokal:

```bash
openclaw gateway
```

Alias foreground:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Perilaku startup">
    - Secara default, Gateway menolak untuk memulai kecuali `gateway.mode=local` diatur di `~/.openclaw/openclaw.json`. Gunakan `--allow-unconfigured` untuk eksekusi ad-hoc/dev.
    - `openclaw onboard --mode local` dan `openclaw setup` diharapkan menulis `gateway.mode=local`. Jika file ada tetapi `gateway.mode` tidak ada, perlakukan itu sebagai konfigurasi rusak atau tertimpa dan perbaiki alih-alih mengasumsikan mode lokal secara implisit.
    - Jika file ada dan `gateway.mode` tidak ada, Gateway memperlakukannya sebagai kerusakan konfigurasi yang mencurigakan dan menolak untuk "menebak lokal" untuk Anda.
    - Bind di luar loopback tanpa auth akan diblokir (pagar pengaman).
    - `SIGUSR1` memicu restart dalam proses jika diizinkan (`commands.restart` aktif secara default; atur `commands.restart: false` untuk memblokir restart manual, sementara gateway tool/config apply/update tetap diizinkan).
    - Handler `SIGINT`/`SIGTERM` menghentikan proses gateway, tetapi tidak memulihkan status terminal kustom apa pun. Jika Anda membungkus CLI dengan TUI atau input mode-raw, pulihkan terminal sebelum keluar.
  </Accordion>
</AccordionGroup>

### Opsi

<ParamField path="--port <port>" type="number">
  Port WebSocket (default berasal dari config/env; biasanya `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Mode bind listener.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Override mode auth.
</ParamField>
<ParamField path="--token <token>" type="string">
  Override token (juga mengatur `OPENCLAW_GATEWAY_TOKEN` untuk proses ini).
</ParamField>
<ParamField path="--password <password>" type="string">
  Override password.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Baca password gateway dari file.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Ekspos Gateway melalui Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Setel ulang konfigurasi serve/funnel Tailscale saat shutdown.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Izinkan gateway memulai tanpa `gateway.mode=local` di config. Melewati guard startup hanya untuk bootstrap ad-hoc/dev; tidak menulis atau memperbaiki file config.
</ParamField>
<ParamField path="--dev" type="boolean">
  Buat config + workspace dev jika belum ada (melewati BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Reset config + kredensial + sesi + workspace dev (memerlukan `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Hentikan listener yang ada pada port yang dipilih sebelum memulai.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Log verbose.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Hanya tampilkan log backend CLI di konsol (dan aktifkan stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Gaya log WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias untuk `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Log peristiwa stream model mentah ke jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Path jsonl stream mentah.
</ParamField>

<Warning>
`--password` inline dapat terekspos di daftar proses lokal. Gunakan `--password-file`, env, atau `gateway.auth.password` berbasis SecretRef.
</Warning>

### Pembuatan profil startup

- Atur `OPENCLAW_GATEWAY_STARTUP_TRACE=1` untuk mencatat timing fase selama startup Gateway.
- Jalankan `pnpm test:startup:gateway -- --runs 5 --warmup 1` untuk membenchmark startup Gateway. Benchmark ini merekam output proses pertama, `/healthz`, `/readyz`, dan timing jejak startup.

## Kueri Gateway yang sedang berjalan

Semua perintah kueri menggunakan RPC WebSocket.

<Tabs>
  <Tab title="Mode output">
    - Default: dapat dibaca manusia (berwarna di TTY).
    - `--json`: JSON yang dapat dibaca mesin (tanpa styling/spinner).
    - `--no-color` (atau `NO_COLOR=1`): nonaktifkan ANSI sambil mempertahankan tata letak yang dapat dibaca manusia.
  </Tab>
  <Tab title="Opsi bersama">
    - `--url <url>`: URL WebSocket Gateway.
    - `--token <token>`: token Gateway.
    - `--password <password>`: password Gateway.
    - `--timeout <ms>`: timeout/anggaran waktu (bervariasi per perintah).
    - `--expect-final`: tunggu respons "final" (panggilan agen).
  </Tab>
</Tabs>

<Note>
Saat Anda mengatur `--url`, CLI tidak akan fallback ke kredensial config atau environment. Berikan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang tidak ada adalah error.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Endpoint HTTP `/healthz` adalah probe liveness: endpoint ini mengembalikan hasil setelah server dapat menjawab HTTP. Endpoint HTTP `/readyz` lebih ketat dan tetap merah selama sidecar startup, channel, atau hook yang dikonfigurasi masih dalam proses stabil.

### `gateway usage-cost`

Ambil ringkasan biaya penggunaan dari log sesi.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Jumlah hari yang disertakan.
</ParamField>

### `gateway stability`

Ambil perekam stabilitas diagnostik terbaru dari Gateway yang sedang berjalan.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Jumlah maksimum peristiwa terbaru yang disertakan (maks `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filter berdasarkan jenis peristiwa diagnostik, seperti `payload.large` atau `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Sertakan hanya peristiwa setelah nomor urutan diagnostik.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Baca bundle stabilitas yang dipersistenkan alih-alih memanggil Gateway yang sedang berjalan. Gunakan `--bundle latest` (atau cukup `--bundle`) untuk bundle terbaru di bawah direktori status, atau berikan langsung path JSON bundle.
</ParamField>
<ParamField path="--export" type="boolean">
  Tulis zip diagnostik dukungan yang dapat dibagikan alih-alih mencetak detail stabilitas.
</ParamField>
<ParamField path="--output <path>" type="string">
  Path output untuk `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privasi dan perilaku bundle">
    - Catatan menyimpan metadata operasional: nama peristiwa, jumlah, ukuran byte, pembacaan memori, status antrean/sesi, nama channel/plugin, dan ringkasan sesi yang disunting. Catatan ini tidak menyimpan teks chat, body Webhook, output tool, body permintaan atau respons mentah, token, cookie, nilai rahasia, hostname, atau ID sesi mentah. Atur `diagnostics.enabled: false` untuk menonaktifkan perekam sepenuhnya.
    - Pada exit Gateway fatal, timeout shutdown, dan kegagalan startup restart, OpenClaw menulis snapshot diagnostik yang sama ke `~/.openclaw/logs/stability/openclaw-stability-*.json` saat perekam memiliki peristiwa. Periksa bundle terbaru dengan `openclaw gateway stability --bundle latest`; `--limit`, `--type`, dan `--since-seq` juga berlaku untuk output bundle.
  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Tulis zip diagnostik lokal yang dirancang untuk dilampirkan ke laporan bug. Untuk model privasi dan isi bundle, lihat [Diagnostics Export](/id/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Path zip output. Default ke ekspor dukungan di bawah direktori status.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Jumlah maksimum baris log yang sudah disanitasi untuk disertakan.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Jumlah maksimum byte log untuk diperiksa.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket Gateway untuk snapshot health.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token Gateway untuk snapshot health.
</ParamField>
<ParamField path="--password <password>" type="string">
  Password Gateway untuk snapshot health.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Timeout snapshot status/health.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Lewati pencarian bundle stabilitas yang dipersistenkan.
</ParamField>
<ParamField path="--json" type="boolean">
  Cetak path yang ditulis, ukuran, dan manifes sebagai JSON.
</ParamField>

Ekspor ini berisi manifes, ringkasan Markdown, bentuk config, detail config yang sudah disanitasi, ringkasan log yang sudah disanitasi, snapshot status/health Gateway yang sudah disanitasi, dan bundle stabilitas terbaru bila ada.

Ekspor ini dimaksudkan untuk dibagikan. Ekspor ini menyimpan detail operasional yang membantu debugging, seperti field log OpenClaw yang aman, nama subsistem, kode status, durasi, mode yang dikonfigurasi, port, ID plugin, ID provider, pengaturan fitur non-rahasia, dan pesan log operasional yang sudah disunting. Ekspor ini menghilangkan atau menyunting teks chat, body Webhook, output tool, kredensial, cookie, pengidentifikasi akun/pesan, teks prompt/instruksi, hostname, dan nilai rahasia. Saat pesan bergaya LogTape terlihat seperti teks payload pengguna/chat/tool, ekspor hanya menyimpan bahwa sebuah pesan dihilangkan beserta jumlah bytenya.

### `gateway status`

`gateway status` menampilkan layanan Gateway (launchd/systemd/schtasks) plus probe opsional untuk kemampuan konektivitas/auth.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Tambahkan target probe eksplisit. Remote yang dikonfigurasi + localhost tetap diprobe.
</ParamField>
<ParamField path="--token <token>" type="string">
  Auth token untuk probe.
</ParamField>
<ParamField path="--password <password>" type="string">
  Auth password untuk probe.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Timeout probe.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Lewati probe konektivitas (tampilan layanan saja).
</ParamField>
<ParamField path="--deep" type="boolean">
  Pindai juga layanan tingkat sistem.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Tingkatkan probe konektivitas default menjadi probe baca dan keluar non-zero saat probe baca itu gagal. Tidak dapat digabungkan dengan `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantik status">
    - `gateway status` tetap tersedia untuk diagnostik bahkan ketika config CLI lokal tidak ada atau tidak valid.
    - `gateway status` default membuktikan status layanan, koneksi WebSocket, dan kemampuan auth yang terlihat saat handshake. Ini tidak membuktikan operasi read/write/admin.
    - Probe diagnostik tidak memodifikasi untuk auth perangkat pertama kali: probe ini menggunakan ulang token perangkat cache yang sudah ada bila tersedia, tetapi tidak membuat identitas perangkat CLI baru atau catatan pairing perangkat read-only hanya untuk memeriksa status.
    - `gateway status` me-resolve SecretRef auth yang dikonfigurasi untuk auth probe bila memungkinkan.
    - Jika SecretRef auth yang diperlukan tidak ter-resolve dalam jalur perintah ini, `gateway status --json` melaporkan `rpc.authWarning` saat probe konektivitas/auth gagal; berikan `--token`/`--password` secara eksplisit atau selesaikan sumber secret terlebih dahulu.
    - Jika probe berhasil, peringatan unresolved auth-ref disembunyikan untuk menghindari false positive.
    - Gunakan `--require-rpc` dalam skrip dan otomatisasi ketika layanan yang mendengarkan saja tidak cukup dan Anda juga memerlukan panggilan RPC scope baca yang sehat.
    - `--deep` menambahkan pemindaian best-effort untuk instalasi launchd/systemd/schtasks tambahan. Ketika beberapa layanan mirip gateway terdeteksi, output yang dapat dibaca manusia mencetak petunjuk pembersihan dan memperingatkan bahwa sebagian besar penyiapan seharusnya menjalankan satu gateway per mesin.
    - Output yang dapat dibaca manusia mencakup path log file yang telah di-resolve plus snapshot path/validitas config CLI-vs-service untuk membantu mendiagnosis drift profil atau state-dir.
  </Accordion>
  <Accordion title="Pemeriksaan auth-drift systemd Linux">
    - Pada instalasi systemd Linux, pemeriksaan drift auth membaca nilai `Environment=` dan `EnvironmentFile=` dari unit (termasuk `%h`, path dalam kutip, beberapa file, dan file opsional `-`).
    - Pemeriksaan drift me-resolve SecretRef `gateway.auth.token` menggunakan env runtime gabungan (env perintah layanan lebih dulu, lalu fallback env proses).
    - Jika auth token tidak efektif aktif (eksplisit `gateway.auth.mode` bernilai `password`/`none`/`trusted-proxy`, atau mode tidak diatur saat password dapat menang dan tidak ada kandidat token yang dapat menang), pemeriksaan token-drift melewati resolusi token config.
  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` adalah perintah "debug semuanya". Perintah ini selalu mem-probe:

- gateway remote yang Anda konfigurasi (jika diatur), dan
- localhost (loopback) **bahkan jika remote dikonfigurasi**.

Jika Anda memberikan `--url`, target eksplisit itu ditambahkan sebelum keduanya. Output yang dapat dibaca manusia memberi label target sebagai:

- `URL (eksplisit)`
- `Remote (configured)` atau `Remote (configured, inactive)`
- `local loopback`

<Note>
Jika beberapa gateway dapat dijangkau, semuanya akan dicetak. Beberapa gateway didukung saat Anda menggunakan profil/port terisolasi (misalnya, rescue bot), tetapi sebagian besar instalasi tetap menjalankan satu gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretasi">
    - `Reachable: yes` berarti setidaknya satu target menerima koneksi WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` melaporkan apa yang dapat dibuktikan probe tentang auth. Ini terpisah dari reachability.
    - `Read probe: ok` berarti panggilan RPC detail scope-baca (`health`/`status`/`system-presence`/`config.get`) juga berhasil.
    - `Read probe: limited - missing scope: operator.read` berarti koneksi berhasil tetapi RPC scope-baca terbatas. Ini dilaporkan sebagai reachability **degraded**, bukan kegagalan penuh.
    - Seperti `gateway status`, probe menggunakan ulang auth perangkat cache yang ada tetapi tidak membuat identitas perangkat atau status pairing untuk pertama kali.
    - Kode keluar non-zero hanya ketika tidak ada target yang di-probe dapat dijangkau.
  </Accordion>
  <Accordion title="Output JSON">
    Tingkat atas:

    - `ok`: setidaknya satu target dapat dijangkau.
    - `degraded`: setidaknya satu target memiliki RPC detail yang terbatas oleh scope.
    - `capability`: kemampuan terbaik yang terlihat di seluruh target yang dapat dijangkau (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, atau `unknown`).
    - `primaryTargetId`: target terbaik yang diperlakukan sebagai pemenang aktif dalam urutan ini: URL eksplisit, tunnel SSH, remote yang dikonfigurasi, lalu loopback lokal.
    - `warnings[]`: catatan peringatan best-effort dengan `code`, `message`, dan opsional `targetIds`.
    - `network`: petunjuk URL loopback lokal/tailnet yang diturunkan dari config saat ini dan jaringan host.
    - `discovery.timeoutMs` dan `discovery.count`: anggaran/hasil discovery aktual yang digunakan untuk pass probe ini.

    Per target (`targets[].connect`):

    - `ok`: reachability setelah koneksi + klasifikasi degraded.
    - `rpcOk`: keberhasilan penuh RPC detail.
    - `scopeLimited`: RPC detail gagal karena scope operator tidak ada.

    Per target (`targets[].auth`):

    - `role`: peran auth yang dilaporkan dalam `hello-ok` saat tersedia.
    - `scopes`: scope yang diberikan dan dilaporkan dalam `hello-ok` saat tersedia.
    - `capability`: klasifikasi kemampuan auth yang ditampilkan untuk target tersebut.

  </Accordion>
  <Accordion title="Kode peringatan umum">
    - `ssh_tunnel_failed`: penyiapan tunnel SSH gagal; perintah kembali ke probe langsung.
    - `multiple_gateways`: lebih dari satu target dapat dijangkau; ini tidak biasa kecuali Anda sengaja menjalankan profil terisolasi, seperti rescue bot.
    - `auth_secretref_unresolved`: SecretRef auth yang dikonfigurasi tidak dapat di-resolve untuk target yang gagal.
    - `probe_scope_limited`: koneksi WebSocket berhasil, tetapi probe baca dibatasi oleh tidak adanya `operator.read`.
  </Accordion>
</AccordionGroup>

#### Remote melalui SSH (paritas aplikasi Mac)

Mode aplikasi macOS "Remote over SSH" menggunakan port-forward lokal sehingga gateway remote (yang mungkin hanya bind ke loopback) menjadi dapat dijangkau di `ws://127.0.0.1:<port>`.

Padanan CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` atau `user@host:port` (port default ke `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  File identitas.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Pilih host gateway yang pertama kali ditemukan sebagai target SSH dari endpoint discovery yang telah di-resolve (`local.` plus domain wide-area yang dikonfigurasi, jika ada). Petunjuk TXT-only diabaikan.
</ParamField>

Config (opsional, digunakan sebagai default):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Helper RPC tingkat rendah.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  String objek JSON untuk params.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  Password Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  Anggaran timeout.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Terutama untuk RPC bergaya agen yang men-stream peristiwa perantara sebelum payload final.
</ParamField>
<ParamField path="--json" type="boolean">
  Output JSON yang dapat dibaca mesin.
</ParamField>

<Note>
`--params` harus berupa JSON yang valid.
</Note>

## Kelola layanan Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

<AccordionGroup>
  <Accordion title="Opsi perintah">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`
  </Accordion>
  <Accordion title="Catatan instalasi dan siklus hidup layanan">
    - `gateway install` mendukung `--port`, `--runtime`, `--token`, `--force`, `--json`.
    - Gunakan `gateway restart` untuk memulai ulang layanan terkelola. Jangan merangkai `gateway stop` dan `gateway start` sebagai pengganti restart; di macOS, `gateway stop` sengaja menonaktifkan LaunchAgent sebelum menghentikannya.
    - Ketika auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, `gateway install` memvalidasi bahwa SecretRef dapat di-resolve tetapi tidak menyimpan token yang sudah di-resolve ke metadata environment layanan.
    - Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi tidak ter-resolve, install gagal tertutup alih-alih menyimpan fallback plaintext.
    - Untuk auth password pada `gateway run`, gunakan `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, atau `gateway.auth.password` berbasis SecretRef alih-alih `--password` inline.
    - Dalam mode auth inferred, `OPENCLAW_GATEWAY_PASSWORD` yang hanya ada di shell tidak melonggarkan persyaratan token install; gunakan config yang tahan lama (`gateway.auth.password` atau config `env`) saat menginstal layanan terkelola.
    - Jika `gateway.auth.token` dan `gateway.auth.password` keduanya dikonfigurasi dan `gateway.auth.mode` tidak diatur, install diblokir sampai mode diatur secara eksplisit.
    - Perintah siklus hidup menerima `--json` untuk scripting.
  </Accordion>
</AccordionGroup>

## Temukan gateway (Bonjour)

`gateway discover` memindai beacon Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): pilih domain (contoh: `openclaw.internal.`) dan siapkan split DNS + server DNS; lihat [Bonjour](/id/gateway/bonjour).

Hanya gateway dengan discovery Bonjour yang diaktifkan (default) yang mengiklankan beacon.

Catatan discovery Wide-Area menyertakan (TXT):

- `role` (petunjuk peran gateway)
- `transport` (petunjuk transport, misalnya `gateway`)
- `gatewayPort` (port WebSocket, biasanya `18789`)
- `sshPort` (opsional; klien menggunakan default target SSH ke `22` saat tidak ada)
- `tailnetDns` (hostname MagicDNS, saat tersedia)
- `gatewayTls` / `gatewayTlsSha256` (TLS aktif + fingerprint sertifikat)
- `cliPath` (petunjuk remote-install yang ditulis ke zona wide-area)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Timeout per perintah (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Output yang dapat dibaca mesin (juga menonaktifkan styling/spinner).
</ParamField>

Contoh:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI memindai `local.` plus domain wide-area yang dikonfigurasi saat diaktifkan.
- `wsUrl` dalam output JSON diturunkan dari endpoint layanan yang telah di-resolve, bukan dari petunjuk TXT-only seperti `lanHost` atau `tailnetDns`.
- Pada mDNS `local.`, `sshPort` dan `cliPath` hanya disiarkan ketika `discovery.mdns.mode` adalah `full`. Wide-area DNS-SD tetap menulis `cliPath`; `sshPort` juga tetap opsional di sana.
</Note>

## Terkait

- [Referensi CLI](/id/cli)
- [Runbook Gateway](/id/gateway)
