---
read_when:
    - Menjalankan Gateway dari CLI (pengembangan atau server)
    - Men-debug autentikasi Gateway, mode bind, dan konektivitas
    - Menemukan gateway melalui Bonjour (DNS-SD lokal + area luas)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — jalankan, kueri, dan temukan Gateway
title: Gateway
x-i18n:
    generated_at: "2026-06-30T14:27:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c33900a9bdc61c1e922e424dbfce139c6591a7a5071ed8263b172e19bdf653b
    source_path: cli/gateway.md
    workflow: 16
---

Gateway adalah server WebSocket OpenClaw (kanal, node, sesi, hook). Subperintah di halaman ini berada di bawah `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Penemuan Bonjour" href="/id/gateway/bonjour">
    Penyiapan mDNS lokal + DNS-SD area luas.
  </Card>
  <Card title="Ikhtisar penemuan" href="/id/gateway/discovery">
    Cara OpenClaw mengiklankan dan menemukan Gateway.
  </Card>
  <Card title="Konfigurasi" href="/id/gateway/configuration">
    Kunci konfigurasi Gateway tingkat atas.
  </Card>
</CardGroup>

## Jalankan Gateway

Jalankan proses Gateway lokal:

```bash
openclaw gateway
```

Alias latar depan:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Perilaku startup">
    - Secara default, Gateway menolak untuk dimulai kecuali `gateway.mode=local` diatur di `~/.openclaw/openclaw.json`. Gunakan `--allow-unconfigured` untuk proses ad-hoc/dev.
    - `openclaw onboard --mode local` dan `openclaw setup` diharapkan menulis `gateway.mode=local`. Jika file ada tetapi `gateway.mode` hilang, perlakukan itu sebagai konfigurasi yang rusak atau tertimpa dan perbaiki, bukan mengasumsikan mode lokal secara implisit.
    - Jika file ada dan `gateway.mode` hilang, Gateway memperlakukan itu sebagai kerusakan konfigurasi yang mencurigakan dan menolak untuk "menebak lokal" untuk Anda.
    - Pengikatan di luar loopback tanpa auth diblokir (pagar pengaman).
    - `lan`, `tailnet`, dan `custom` saat ini diselesaikan melalui jalur BYOH khusus IPv4.
    - BYOH khusus IPv6 tidak didukung secara native pada jalur ini saat ini. Gunakan sidecar atau proxy IPv4 jika host itu sendiri hanya IPv6.
    - `SIGUSR1` memicu restart dalam proses saat diotorisasi (`commands.restart` diaktifkan secara default; atur `commands.restart: false` untuk memblokir restart manual, sementara penerapan/pembaruan alat/konfigurasi Gateway tetap diizinkan).
    - Handler `SIGINT`/`SIGTERM` menghentikan proses Gateway, tetapi tidak memulihkan status terminal kustom apa pun. Jika Anda membungkus CLI dengan TUI atau input mode raw, pulihkan terminal sebelum keluar.

  </Accordion>
</AccordionGroup>

### Opsi

<ParamField path="--port <port>" type="number">
  Port WebSocket (default berasal dari konfigurasi/env; biasanya `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Mode bind listener. `lan`, `tailnet`, dan `custom` saat ini diselesaikan melalui jalur khusus IPv4.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Override mode auth.
</ParamField>
<ParamField path="--token <token>" type="string">
  Override token (juga menetapkan `OPENCLAW_GATEWAY_TOKEN` untuk proses).
</ParamField>
<ParamField path="--password <password>" type="string">
  Override kata sandi.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Baca kata sandi Gateway dari file.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Ekspos Gateway melalui Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Reset konfigurasi serve/funnel Tailscale saat shutdown.
</ParamField>
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  Saat ini mengharapkan alamat IPv4. Untuk BYOH khusus IPv6, tempatkan sidecar atau proxy IPv4 di depan Gateway dan arahkan OpenClaw ke endpoint IPv4 tersebut.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Izinkan Gateway dimulai tanpa `gateway.mode=local` dalam konfigurasi. Hanya melewati guard startup untuk bootstrap ad-hoc/dev; tidak menulis atau memperbaiki file konfigurasi.
</ParamField>
<ParamField path="--dev" type="boolean">
  Buat konfigurasi dev + workspace jika belum ada (melewati BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Reset konfigurasi dev + kredensial + sesi + workspace (memerlukan `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Matikan listener yang sudah ada pada port yang dipilih sebelum memulai.
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
  Catat event stream model raw ke jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Jalur jsonl stream raw.
</ParamField>

## Restart Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` meminta Gateway yang sedang berjalan untuk melakukan preflight pekerjaan aktif dan menjadwalkan satu restart tergabung setelah pekerjaan aktif terkuras. Restart aman default menunggu pekerjaan aktif hingga `gateway.reload.deferralTimeoutMs` yang dikonfigurasi (default 5 menit); saat anggaran itu habis, restart dipaksa. Atur `gateway.reload.deferralTimeoutMs` ke `0` untuk penantian aman tanpa batas yang tidak pernah memaksa. `restart` biasa mempertahankan perilaku service-manager yang ada; `--force` tetap menjadi jalur override langsung.

`openclaw gateway restart --safe --skip-deferral` menjalankan restart terkoordinasi yang sadar OpenClaw yang sama seperti `--safe`, tetapi melewati gate penundaan pekerjaan aktif sehingga Gateway memancarkan restart langsung meskipun blocker dilaporkan. Gunakan ini sebagai pintu keluar operator ketika penundaan telah tertahan oleh task run yang macet dan `--safe` saja mungkin dibatasi oleh `gateway.reload.deferralTimeoutMs`. `--skip-deferral` memerlukan `--safe`.

<Warning>
`--password` inline dapat terekspos dalam daftar proses lokal. Lebih baik gunakan `--password-file`, env, atau `gateway.auth.password` berbasis SecretRef.
</Warning>

### Profiling Gateway

- Atur `OPENCLAW_GATEWAY_STARTUP_TRACE=1` untuk mencatat timing fase selama startup Gateway, termasuk delay `eventLoopMax` per fase dan timing tabel lookup Plugin untuk installed-index, registry manifest, perencanaan startup, dan pekerjaan owner-map.
- Atur `OPENCLAW_GATEWAY_RESTART_TRACE=1` untuk mencatat baris `restart trace:` berskop restart untuk penanganan sinyal restart, pengurasan pekerjaan aktif, fase shutdown, start berikutnya, timing siap, dan metrik memori.
- Atur `OPENCLAW_DIAGNOSTICS=timeline` dengan `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` untuk menulis timeline diagnostik startup JSONL best-effort untuk harness QA eksternal. Anda juga dapat mengaktifkan flag dengan `diagnostics.flags: ["timeline"]` dalam konfigurasi; jalurnya tetap disediakan melalui env. Tambahkan `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` untuk menyertakan sampel event-loop.
- Jalankan `pnpm build` terlebih dahulu, lalu `pnpm test:startup:gateway -- --runs 5 --warmup 1` untuk membenchmark startup Gateway terhadap entri CLI yang sudah dibangun. Benchmark merekam output proses pertama, `/healthz`, `/readyz`, timing trace startup, delay event-loop, dan detail timing tabel lookup Plugin.
- Jalankan `pnpm build` terlebih dahulu, lalu `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` untuk membenchmark restart Gateway dalam proses terhadap entri CLI yang sudah dibangun di macOS atau Linux. Benchmark restart menggunakan SIGUSR1, mengaktifkan trace startup dan restart di proses child, dan merekam `/healthz` berikutnya, `/readyz` berikutnya, downtime, timing siap, CPU, RSS, dan metrik trace restart.
- Perlakukan `/healthz` sebagai liveness dan `/readyz` sebagai readiness yang dapat digunakan. Baris trace dan output benchmark ditujukan untuk atribusi pemilik; jangan perlakukan satu span trace atau satu sampel sebagai kesimpulan performa lengkap.

## Kueri Gateway yang sedang berjalan

Semua perintah kueri menggunakan RPC WebSocket.

<Tabs>
  <Tab title="Mode output">
    - Default: mudah dibaca manusia (berwarna di TTY).
    - `--json`: JSON yang dapat dibaca mesin (tanpa styling/spinner).
    - `--no-color` (atau `NO_COLOR=1`): nonaktifkan ANSI sambil mempertahankan tata letak manusia.

  </Tab>
  <Tab title="Opsi bersama">
    - `--url <url>`: URL WebSocket Gateway.
    - `--token <token>`: Token Gateway.
    - `--password <password>`: Kata sandi Gateway.
    - `--timeout <ms>`: timeout/anggaran (bervariasi per perintah).
    - `--expect-final`: tunggu respons "final" (panggilan agen).

  </Tab>
</Tabs>

<Note>
Saat Anda mengatur `--url`, CLI tidak fallback ke kredensial konfigurasi atau environment. Berikan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang hilang adalah error.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

Endpoint HTTP `/healthz` adalah probe liveness: endpoint ini mengembalikan respons setelah server dapat menjawab HTTP. Endpoint HTTP `/readyz` lebih ketat dan tetap merah saat sidecar Plugin startup, kanal, atau hook yang dikonfigurasi masih menstabilkan diri. Respons readiness terperinci lokal atau terautentikasi menyertakan blok diagnostik `eventLoop` dengan delay event-loop, utilisasi event-loop, rasio core CPU, dan flag `degraded`.

<ParamField path="--port <port>" type="number">
  Targetkan Gateway local loopback pada port ini. Ini menimpa `OPENCLAW_GATEWAY_URL` dan `OPENCLAW_GATEWAY_PORT` untuk panggilan health.
</ParamField>

### `gateway usage-cost`

Ambil ringkasan biaya penggunaan dari log sesi.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Jumlah hari yang akan disertakan.
</ParamField>
<ParamField path="--agent <id>" type="string">
  Batasi ringkasan biaya ke satu id agen yang dikonfigurasi.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Agregasikan ringkasan biaya di semua agen yang dikonfigurasi. Tidak dapat digabungkan dengan `--agent`.
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
  Jumlah maksimum event terbaru yang disertakan (maks `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filter berdasarkan jenis event diagnostik, seperti `payload.large` atau `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Sertakan hanya event setelah nomor urut diagnostik.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Baca bundel stabilitas yang dipersist, bukan memanggil Gateway yang sedang berjalan. Gunakan `--bundle latest` (atau cukup `--bundle`) untuk bundel terbaru di bawah direktori state, atau berikan jalur JSON bundel secara langsung.
</ParamField>
<ParamField path="--export" type="boolean">
  Tulis zip diagnostik dukungan yang dapat dibagikan, bukan mencetak detail stabilitas.
</ParamField>
<ParamField path="--output <path>" type="string">
  Jalur output untuk `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privasi dan perilaku bundel">
    - Rekaman menyimpan metadata operasional: nama event, hitungan, ukuran byte, pembacaan memori, status queue/sesi, nama kanal/Plugin, dan ringkasan sesi yang direduksi. Rekaman tidak menyimpan teks chat, body Webhook, output alat, body request atau respons raw, token, cookie, nilai rahasia, hostname, atau id sesi raw. Atur `diagnostics.enabled: false` untuk menonaktifkan perekam sepenuhnya.
    - Pada exit Gateway fatal, timeout shutdown, dan kegagalan startup restart, OpenClaw menulis snapshot diagnostik yang sama ke `~/.openclaw/logs/stability/openclaw-stability-*.json` saat perekam memiliki event. Periksa bundel terbaru dengan `openclaw gateway stability --bundle latest`; `--limit`, `--type`, dan `--since-seq` juga berlaku untuk output bundel.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Tulis zip diagnostik lokal yang dirancang untuk dilampirkan ke laporan bug. Untuk model privasi dan isi bundel, lihat [Ekspor Diagnostik](/id/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Jalur zip keluaran. Default ke ekspor dukungan di bawah direktori state.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Jumlah maksimum baris log tersanitasi yang disertakan.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Byte log maksimum untuk diperiksa.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket Gateway untuk snapshot kesehatan.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token Gateway untuk snapshot kesehatan.
</ParamField>
<ParamField path="--password <password>" type="string">
  Kata sandi Gateway untuk snapshot kesehatan.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Batas waktu snapshot status/kesehatan.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Lewati pencarian bundel stabilitas yang dipersistenkan.
</ParamField>
<ParamField path="--json" type="boolean">
  Cetak jalur yang ditulis, ukuran, dan manifes sebagai JSON.
</ParamField>

Ekspor berisi manifes, ringkasan Markdown, bentuk konfigurasi, detail konfigurasi tersanitasi, ringkasan log tersanitasi, snapshot status/kesehatan Gateway tersanitasi, dan bundel stabilitas terbaru jika ada.

Ini dimaksudkan untuk dibagikan. Ini mempertahankan detail operasional yang membantu debugging, seperti bidang log OpenClaw yang aman, nama subsistem, kode status, durasi, mode yang dikonfigurasi, port, id plugin, id penyedia, pengaturan fitur non-rahasia, dan pesan log operasional yang direduksi. Ini menghilangkan atau mereduksi teks obrolan, isi webhook, keluaran alat, kredensial, cookie, pengenal akun/pesan, teks prompt/instruksi, nama host, dan nilai rahasia. Ketika pesan bergaya LogTape tampak seperti teks payload pengguna/obrolan/alat, ekspor hanya mempertahankan bahwa sebuah pesan dihilangkan beserta jumlah byte-nya.

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
  Auth kata sandi untuk probe.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Batas waktu probe.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Lewati probe konektivitas (tampilan layanan saja).
</ParamField>
<ParamField path="--deep" type="boolean">
  Pindai juga layanan tingkat sistem.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Tingkatkan probe konektivitas default menjadi probe baca dan keluar dengan non-nol ketika probe baca tersebut gagal. Tidak dapat digabungkan dengan `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantik status">
    - `gateway status` tetap tersedia untuk diagnostik meskipun konfigurasi CLI lokal hilang atau tidak valid.
    - `gateway status` default membuktikan status layanan, koneksi WebSocket, dan kemampuan auth yang terlihat saat handshake. Ini tidak membuktikan operasi baca/tulis/admin.
    - Probe diagnostik tidak memutasi auth perangkat pertama kali: probe menggunakan ulang token perangkat yang sudah di-cache jika ada, tetapi tidak membuat identitas perangkat CLI baru atau catatan pairing perangkat baca-saja hanya untuk memeriksa status.
    - `gateway status` menyelesaikan SecretRef auth yang dikonfigurasi untuk auth probe jika memungkinkan.
    - Jika SecretRef auth yang diperlukan tidak terselesaikan di jalur perintah ini, `gateway status --json` melaporkan `rpc.authWarning` ketika konektivitas/auth probe gagal; berikan `--token`/`--password` secara eksplisit atau selesaikan sumber rahasianya terlebih dahulu.
    - Jika probe berhasil, peringatan auth-ref yang belum terselesaikan disembunyikan untuk menghindari positif palsu.
    - Ketika probing diaktifkan, keluaran JSON menyertakan `gateway.version` saat Gateway yang berjalan melaporkannya; `--require-rpc` dapat fallback ke payload RPC `status.runtimeVersion` jika probe handshake lanjutan tidak dapat menyediakan metadata versi.
    - Gunakan `--require-rpc` dalam skrip dan otomatisasi ketika layanan yang mendengarkan saja tidak cukup dan Anda juga membutuhkan panggilan RPC cakupan baca yang sehat.
    - `--deep` menambahkan pemindaian upaya terbaik untuk instalasi launchd/systemd/schtasks tambahan. Ketika beberapa layanan mirip gateway terdeteksi, keluaran manusia mencetak petunjuk pembersihan dan memperingatkan bahwa sebagian besar setup sebaiknya menjalankan satu gateway per mesin.
    - `--deep` juga melaporkan handoff restart supervisor Gateway terbaru ketika proses layanan keluar dengan bersih untuk restart supervisor eksternal.
    - `--deep` menjalankan validasi konfigurasi dalam mode sadar plugin (`pluginValidation: "full"`) dan menampilkan peringatan manifes plugin yang dikonfigurasi (misalnya metadata konfigurasi channel yang hilang) agar pemeriksaan smoke instalasi dan pembaruan menangkapnya. `gateway status` default mempertahankan jalur baca-saja cepat yang melewati validasi plugin.
    - Keluaran manusia menyertakan jalur log file yang diselesaikan plus snapshot jalur/validitas konfigurasi CLI-vs-layanan untuk membantu mendiagnosis drift profil atau state-dir.

  </Accordion>
  <Accordion title="Pemeriksaan drift auth systemd Linux">
    - Pada instalasi systemd Linux, pemeriksaan drift auth layanan membaca nilai `Environment=` dan `EnvironmentFile=` dari unit (termasuk `%h`, jalur dengan kutipan, beberapa file, dan file opsional `-`).
    - Pemeriksaan drift menyelesaikan SecretRef `gateway.auth.token` menggunakan env runtime gabungan (env perintah layanan terlebih dahulu, lalu fallback env proses).
    - Jika auth token tidak aktif secara efektif (`gateway.auth.mode` eksplisit berupa `password`/`none`/`trusted-proxy`, atau mode tidak disetel ketika kata sandi dapat menang dan tidak ada kandidat token yang dapat menang), pemeriksaan token-drift melewati penyelesaian token konfigurasi.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` adalah perintah "debug semuanya". Perintah ini selalu memprobe:

- gateway remote yang Anda konfigurasi (jika disetel), dan
- localhost (loopback) **meskipun remote dikonfigurasi**.

Jika Anda memberikan `--url`, target eksplisit tersebut ditambahkan sebelum keduanya. Keluaran manusia memberi label target sebagai:

- `URL (explicit)`
- `Remote (configured)` atau `Remote (configured, inactive)`
- `Local loopback`

<Note>
Jika beberapa target probe dapat dijangkau, perintah ini mencetak semuanya. Tunnel SSH, URL TLS/proxy, dan URL remote yang dikonfigurasi semuanya dapat menunjuk ke gateway yang sama meskipun port transportnya berbeda; `multiple_gateways` disediakan untuk gateway yang dapat dijangkau yang berbeda atau identitasnya ambigu. Beberapa gateway didukung ketika Anda menggunakan profil terisolasi (misalnya bot penyelamat), tetapi sebagian besar instalasi tetap menjalankan satu gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Gunakan port ini untuk target probe local loopback dan port remote tunnel SSH. Tanpa `--url`, ini memilih target local loopback alih-alih URL lingkungan gateway yang dikonfigurasi, port lingkungan, atau target remote.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretasi">
    - `Reachable: yes` berarti setidaknya satu target menerima koneksi WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` melaporkan apa yang dapat dibuktikan probe tentang auth. Ini terpisah dari keterjangkauan.
    - `Read probe: ok` berarti panggilan RPC detail cakupan baca (`health`/`status`/`system-presence`/`config.get`) juga berhasil.
    - `Read probe: limited - missing scope: operator.read` berarti koneksi berhasil tetapi RPC cakupan baca terbatas. Ini dilaporkan sebagai keterjangkauan **terdegradasi**, bukan kegagalan penuh.
    - `Read probe: failed` setelah `Connect: ok` berarti Gateway menerima koneksi WebSocket, tetapi diagnostik baca lanjutan timeout atau gagal. Ini juga merupakan keterjangkauan **terdegradasi**, bukan Gateway yang tidak dapat dijangkau.
    - Seperti `gateway status`, probe menggunakan ulang auth perangkat yang sudah di-cache tetapi tidak membuat identitas perangkat pertama kali atau state pairing.
    - Kode keluar non-nol hanya ketika tidak ada target yang diprobe dapat dijangkau.

  </Accordion>
  <Accordion title="Keluaran JSON">
    Tingkat atas:

    - `ok`: setidaknya satu target dapat dijangkau.
    - `degraded`: setidaknya satu target menerima koneksi tetapi tidak menyelesaikan diagnostik RPC detail penuh.
    - `capability`: kemampuan terbaik yang terlihat di seluruh target yang dapat dijangkau (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, atau `unknown`).
    - `primaryTargetId`: target terbaik untuk diperlakukan sebagai pemenang aktif dalam urutan ini: URL eksplisit, tunnel SSH, remote yang dikonfigurasi, lalu local loopback.
    - `warnings[]`: catatan peringatan upaya terbaik dengan `code`, `message`, dan `targetIds` opsional.
    - `network`: petunjuk URL local loopback/tailnet yang diturunkan dari konfigurasi saat ini dan jaringan host.
    - `discovery.timeoutMs` dan `discovery.count`: anggaran/jumlah hasil discovery aktual yang digunakan untuk lintasan probe ini.

    Per target (`targets[].connect`):

    - `ok`: keterjangkauan setelah klasifikasi connect + terdegradasi.
    - `rpcOk`: keberhasilan RPC detail penuh.
    - `scopeLimited`: RPC detail gagal karena cakupan operator hilang.

    Per target (`targets[].auth`):

    - `role`: peran auth yang dilaporkan dalam `hello-ok` jika tersedia.
    - `scopes`: cakupan yang diberikan yang dilaporkan dalam `hello-ok` jika tersedia.
    - `capability`: klasifikasi kemampuan auth yang ditampilkan untuk target tersebut.

  </Accordion>
  <Accordion title="Kode peringatan umum">
    - `ssh_tunnel_failed`: setup tunnel SSH gagal; perintah fallback ke probe langsung.
    - `multiple_gateways`: identitas gateway yang berbeda dapat dijangkau, atau OpenClaw tidak dapat membuktikan bahwa target yang dapat dijangkau adalah gateway yang sama. Tunnel SSH, URL proxy, atau URL remote yang dikonfigurasi ke gateway yang sama tidak memicu peringatan ini.
    - `auth_secretref_unresolved`: SecretRef auth yang dikonfigurasi tidak dapat diselesaikan untuk target yang gagal.
    - `probe_scope_limited`: koneksi WebSocket berhasil, tetapi probe baca dibatasi oleh `operator.read` yang hilang.

  </Accordion>
</AccordionGroup>

#### Remote melalui SSH (paritas aplikasi Mac)

Mode "Remote over SSH" aplikasi macOS menggunakan port-forward lokal sehingga gateway remote (yang mungkin hanya terikat ke loopback) dapat dijangkau di `ws://127.0.0.1:<port>`.

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
  Pilih host gateway pertama yang ditemukan sebagai target SSH dari endpoint discovery yang diselesaikan (`local.` plus domain area luas yang dikonfigurasi, jika ada). Petunjuk hanya TXT diabaikan.
</ParamField>

Konfigurasi (opsional, digunakan sebagai default):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Pembantu RPC tingkat rendah.

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
  Kata sandi Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  Anggaran batas waktu.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Terutama untuk RPC bergaya agen yang men-stream event menengah sebelum payload final.
</ParamField>
<ParamField path="--json" type="boolean">
  Keluaran JSON yang dapat dibaca mesin.
</ParamField>

<Note>
`--params` harus berupa JSON valid.
</Note>

## Kelola layanan Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Instal dengan wrapper

Gunakan `--wrapper` ketika layanan terkelola harus dimulai melalui executable lain, misalnya shim
manajer rahasia atau helper run-as. Wrapper menerima argumen Gateway normal dan bertanggung jawab
untuk pada akhirnya mengeksekusi `openclaw` atau Node dengan argumen tersebut.

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

Anda juga dapat mengatur wrapper melalui lingkungan. `gateway install` memvalidasi bahwa path tersebut
adalah file executable, menulis wrapper ke `ProgramArguments` layanan, dan mempertahankan
`OPENCLAW_WRAPPER` di lingkungan layanan untuk instalasi ulang paksa, pembaruan, dan perbaikan doctor
di kemudian hari.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Untuk menghapus wrapper tersimpan, kosongkan `OPENCLAW_WRAPPER` saat menginstal ulang:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Opsi perintah">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Perilaku daur hidup">
    - Gunakan `gateway restart` untuk memulai ulang layanan terkelola. Jangan merangkai `gateway stop` dan `gateway start` sebagai pengganti mulai ulang.
    - Di macOS, `gateway stop` menggunakan `launchctl bootout` secara default, yang menghapus LaunchAgent dari sesi boot saat ini tanpa mempertahankan penonaktifan — pemulihan otomatis KeepAlive tetap aktif untuk crash di masa mendatang dan `gateway start` mengaktifkan kembali dengan bersih tanpa `launchctl enable` manual. Berikan `--disable` untuk menekan KeepAlive dan RunAtLoad secara persisten agar gateway tidak muncul kembali sampai `gateway start` eksplisit berikutnya; gunakan ini saat penghentian manual harus bertahan melewati reboot atau mulai ulang sistem.
    - `gateway restart --safe` meminta Gateway yang sedang berjalan untuk melakukan preflight pekerjaan aktif dan menjadwalkan satu mulai ulang tergabung setelah pekerjaan aktif terkuras. Mulai ulang aman default menunggu pekerjaan aktif hingga `gateway.reload.deferralTimeoutMs` yang dikonfigurasi (default 5 menit); ketika batas waktu itu habis, mulai ulang dipaksa. Atur `gateway.reload.deferralTimeoutMs` ke `0` untuk penantian aman tanpa batas yang tidak pernah memaksa. `--safe` tidak dapat digabungkan dengan `--force` atau `--wait`.
    - `gateway restart --wait 30s` mengganti batas pengosongan mulai ulang yang dikonfigurasi untuk mulai ulang tersebut. Angka tanpa satuan adalah milidetik; satuan seperti `s`, `m`, dan `h` diterima. `--wait 0` menunggu tanpa batas.
    - `gateway restart --safe --skip-deferral` menjalankan mulai ulang aman yang sadar OpenClaw tetapi melewati gerbang penundaan sehingga Gateway memancarkan mulai ulang segera bahkan ketika pemblokir dilaporkan. Jalur keluar operator untuk penundaan stuck-task-run; memerlukan `--safe`.
    - `gateway restart --force` melewati pengosongan pekerjaan aktif dan memulai ulang segera. Gunakan saat operator sudah memeriksa pemblokir tugas yang tercantum dan ingin gateway kembali sekarang.
    - Perintah daur hidup menerima `--json` untuk skrip.

  </Accordion>
  <Accordion title="Auth dan SecretRefs saat instalasi">
    - Saat auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, `gateway install` memvalidasi bahwa SecretRef dapat di-resolve tetapi tidak mempertahankan token yang di-resolve ke metadata lingkungan layanan.
    - Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi tidak ter-resolve, instalasi gagal tertutup alih-alih mempertahankan plaintext fallback.
    - Untuk auth kata sandi pada `gateway run`, pilih `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, atau `gateway.auth.password` yang didukung SecretRef daripada `--password` inline.
    - Dalam mode auth tersimpul, `OPENCLAW_GATEWAY_PASSWORD` khusus shell tidak melonggarkan persyaratan token instalasi; gunakan konfigurasi tahan lama (`gateway.auth.password` atau `env` konfigurasi) saat menginstal layanan terkelola.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` tidak diatur, instalasi diblokir sampai mode diatur secara eksplisit.

  </Accordion>
</AccordionGroup>

## Temukan gateway (Bonjour)

`gateway discover` memindai suar Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): pilih domain (contoh: `openclaw.internal.`) dan siapkan split DNS + server DNS; lihat [Bonjour](/id/gateway/bonjour).

Hanya gateway dengan penemuan Bonjour yang diaktifkan (default) yang mengiklankan suar.

Catatan penemuan area luas dapat menyertakan petunjuk TXT berikut:

- `role` (petunjuk peran Gateway)
- `transport` (petunjuk transport, mis. `gateway`)
- `gatewayPort` (port WebSocket, biasanya `18789`)
- `sshPort` (hanya mode penemuan penuh; klien menetapkan target SSH default ke `22` saat ini tidak ada)
- `tailnetDns` (nama host MagicDNS, jika tersedia)
- `gatewayTls` / `gatewayTlsSha256` (TLS diaktifkan + fingerprint sertifikat)
- `cliPath` (hanya mode penemuan penuh)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Timeout per perintah (jelajah/resolve).
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
- CLI memindai `local.` ditambah domain area luas yang dikonfigurasi saat salah satunya diaktifkan.
- `wsUrl` dalam output JSON diturunkan dari endpoint layanan yang di-resolve, bukan dari petunjuk hanya TXT seperti `lanHost` atau `tailnetDns`.
- Pada mDNS `local.` dan DNS-SD area luas, `sshPort` dan `cliPath` hanya dipublikasikan saat `discovery.mdns.mode` adalah `full`.

</Note>

## Terkait

- [Referensi CLI](/id/cli)
- [Runbook Gateway](/id/gateway)
