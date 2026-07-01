---
read_when:
    - Menjalankan Gateway dari CLI (pengembangan atau server)
    - Men-debug auth Gateway, mode bind, dan konektivitas
    - Menemukan gateway melalui Bonjour (DNS-SD lokal + area luas)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — menjalankan, meminta kueri, dan menemukan gateway
title: Gateway
x-i18n:
    generated_at: "2026-07-01T08:31:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80f329ebd154f6fd0e87869c498c58fc6d5276a21934f8a36837653bd68a2d22
    source_path: cli/gateway.md
    workflow: 16
---

Gateway adalah server WebSocket OpenClaw (saluran, node, sesi, hook). Subperintah di halaman ini berada di bawah `openclaw gateway …`.

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

Alias foreground:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Perilaku startup">
    - Secara default, Gateway menolak untuk memulai kecuali `gateway.mode=local` ditetapkan di `~/.openclaw/openclaw.json`. Gunakan `--allow-unconfigured` untuk eksekusi ad-hoc/dev.
    - `openclaw onboard --mode local` dan `openclaw setup` diharapkan menulis `gateway.mode=local`. Jika file ada tetapi `gateway.mode` tidak ada, perlakukan itu sebagai konfigurasi yang rusak atau tertimpa dan perbaiki, bukan mengasumsikan mode lokal secara implisit.
    - Jika file ada dan `gateway.mode` tidak ada, Gateway memperlakukannya sebagai kerusakan konfigurasi yang mencurigakan dan menolak untuk "menebak lokal" untuk Anda.
    - Binding di luar loopback tanpa auth diblokir (pagar pengaman keselamatan).
    - `lan`, `tailnet`, dan `custom` saat ini di-resolve melalui jalur BYOH khusus IPv4.
    - BYOH khusus IPv6 belum didukung secara native pada jalur ini saat ini. Gunakan sidecar IPv4 atau proxy jika host itu sendiri hanya IPv6.
    - `SIGUSR1` memicu restart dalam proses saat diotorisasi (`commands.restart` diaktifkan secara default; tetapkan `commands.restart: false` untuk memblokir restart manual, sementara penerapan/pembaruan alat/konfigurasi Gateway tetap diizinkan).
    - Handler `SIGINT`/`SIGTERM` menghentikan proses Gateway, tetapi tidak memulihkan state terminal kustom apa pun. Jika Anda membungkus CLI dengan TUI atau input raw-mode, pulihkan terminal sebelum keluar.

  </Accordion>
</AccordionGroup>

### Opsi

<ParamField path="--port <port>" type="number">
  Port WebSocket (default berasal dari konfigurasi/env; biasanya `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Mode bind listener. `lan`, `tailnet`, dan `custom` saat ini di-resolve melalui jalur khusus IPv4.
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
  Saat ini mengharapkan alamat IPv4. Untuk BYOH khusus IPv6, tempatkan sidecar IPv4 atau proxy di depan Gateway dan arahkan OpenClaw ke endpoint IPv4 tersebut.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Izinkan Gateway mulai tanpa `gateway.mode=local` dalam konfigurasi. Hanya melewati penjaga startup untuk bootstrap ad-hoc/dev; tidak menulis atau memperbaiki file konfigurasi.
</ParamField>
<ParamField path="--dev" type="boolean">
  Buat konfigurasi dev + workspace jika belum ada (melewati BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Reset konfigurasi dev + kredensial + sesi + workspace (memerlukan `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Hentikan listener yang sudah ada pada port yang dipilih sebelum memulai.
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
  Catat event stream model mentah ke jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Jalur jsonl stream mentah.
</ParamField>

## Restart Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` meminta Gateway yang sedang berjalan untuk melakukan preflight pekerjaan aktif dan menjadwalkan satu restart yang digabungkan setelah pekerjaan aktif selesai. Restart aman default menunggu pekerjaan aktif hingga `gateway.reload.deferralTimeoutMs` yang dikonfigurasi (default 5 menit); ketika anggaran itu habis, restart dipaksa. Tetapkan `gateway.reload.deferralTimeoutMs` ke `0` untuk penantian aman tanpa batas yang tidak pernah memaksa. `restart` biasa mempertahankan perilaku manajer layanan yang ada; `--force` tetap menjadi jalur override langsung.

`openclaw gateway restart --safe --skip-deferral` menjalankan restart terkoordinasi yang sadar OpenClaw sama seperti `--safe`, tetapi melewati gerbang penundaan pekerjaan aktif sehingga Gateway memancarkan restart segera bahkan ketika pemblokir dilaporkan. Gunakan ini sebagai escape hatch operator ketika penundaan tertahan oleh task run yang macet dan `--safe` saja mungkin dibatasi oleh `gateway.reload.deferralTimeoutMs`. `--skip-deferral` memerlukan `--safe`.

<Warning>
`--password` inline dapat terekspos dalam daftar proses lokal. Lebih baik gunakan `--password-file`, env, atau `gateway.auth.password` yang didukung SecretRef.
</Warning>

### Profiling Gateway

- Tetapkan `OPENCLAW_GATEWAY_STARTUP_TRACE=1` untuk mencatat timing fase selama startup Gateway, termasuk delay `eventLoopMax` per fase dan timing tabel pencarian Plugin untuk installed-index, registri manifest, perencanaan startup, dan pekerjaan owner-map.
- Tetapkan `OPENCLAW_GATEWAY_RESTART_TRACE=1` untuk mencatat baris `restart trace:` berscope restart untuk penanganan sinyal restart, pengurasan pekerjaan aktif, fase shutdown, start berikutnya, timing ready, dan metrik memori.
- Tetapkan `OPENCLAW_DIAGNOSTICS=timeline` dengan `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` untuk menulis timeline diagnostik startup JSONL best-effort bagi harness QA eksternal. Anda juga dapat mengaktifkan flag dengan `diagnostics.flags: ["timeline"]` dalam konfigurasi; jalurnya tetap disediakan melalui env. Tambahkan `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` untuk menyertakan sampel event-loop.
- Jalankan `pnpm build` terlebih dahulu, lalu `pnpm test:startup:gateway -- --runs 5 --warmup 1` untuk membenchmark startup Gateway terhadap entri CLI yang sudah dibangun. Benchmark mencatat output proses pertama, `/healthz`, `/readyz`, timing trace startup, delay event-loop, dan detail timing tabel pencarian Plugin.
- Jalankan `pnpm build` terlebih dahulu, lalu `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` untuk membenchmark restart Gateway dalam proses terhadap entri CLI yang sudah dibangun di macOS atau Linux. Benchmark restart menggunakan SIGUSR1, mengaktifkan trace startup dan restart dalam proses child, serta mencatat `/healthz` berikutnya, `/readyz` berikutnya, downtime, timing ready, CPU, RSS, dan metrik trace restart.
- Perlakukan `/healthz` sebagai liveness dan `/readyz` sebagai kesiapan yang dapat digunakan. Baris trace dan output benchmark ditujukan untuk atribusi owner; jangan perlakukan satu rentang trace atau satu sampel sebagai kesimpulan performa lengkap.

## Kueri Gateway yang berjalan

Semua perintah kueri menggunakan RPC WebSocket.

<Tabs>
  <Tab title="Mode output">
    - Default: dapat dibaca manusia (berwarna di TTY).
    - `--json`: JSON yang dapat dibaca mesin (tanpa styling/spinner).
    - `--no-color` (atau `NO_COLOR=1`): nonaktifkan ANSI sambil mempertahankan tata letak manusia.

  </Tab>
  <Tab title="Opsi bersama">
    - `--url <url>`: URL WebSocket Gateway.
    - `--token <token>`: token Gateway.
    - `--password <password>`: kata sandi Gateway.
    - `--timeout <ms>`: timeout/anggaran (bervariasi per perintah).
    - `--expect-final`: tunggu respons "final" (panggilan agen).

  </Tab>
</Tabs>

<Note>
Saat Anda menetapkan `--url`, CLI tidak fallback ke kredensial konfigurasi atau lingkungan. Berikan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang hilang adalah error.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

Endpoint HTTP `/healthz` adalah probe liveness: endpoint ini kembali setelah server dapat menjawab HTTP. Endpoint HTTP `/readyz` lebih ketat dan tetap merah saat sidecar Plugin startup, saluran, atau hook yang dikonfigurasi masih dalam proses stabil. Respons kesiapan terperinci yang lokal atau terautentikasi menyertakan blok diagnostik `eventLoop` dengan delay event-loop, utilisasi event-loop, rasio core CPU, dan flag `degraded`.

<ParamField path="--port <port>" type="number">
  Targetkan Gateway local loopback pada port ini. Ini mengoverride `OPENCLAW_GATEWAY_URL` dan `OPENCLAW_GATEWAY_PORT` untuk panggilan health.
</ParamField>

### `gateway usage-cost`

Ambil ringkasan usage-cost dari log sesi.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Jumlah hari untuk disertakan.
</ParamField>
<ParamField path="--agent <id>" type="string">
  Scope ringkasan biaya ke satu id agen yang dikonfigurasi.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Agregasikan ringkasan biaya di semua agen yang dikonfigurasi. Tidak dapat digabungkan dengan `--agent`.
</ParamField>

### `gateway stability`

Ambil perekam stabilitas diagnostik terbaru dari Gateway yang berjalan.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Jumlah maksimum event terbaru untuk disertakan (maks `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filter berdasarkan tipe event diagnostik, seperti `payload.large` atau `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Sertakan hanya event setelah nomor urut diagnostik.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Baca bundle stabilitas yang dipersist, bukan memanggil Gateway yang berjalan. Gunakan `--bundle latest` (atau cukup `--bundle`) untuk bundle terbaru di bawah direktori state, atau berikan jalur JSON bundle secara langsung.
</ParamField>
<ParamField path="--export" type="boolean">
  Tulis zip diagnostik dukungan yang dapat dibagikan, bukan mencetak detail stabilitas.
</ParamField>
<ParamField path="--output <path>" type="string">
  Jalur output untuk `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privasi dan perilaku bundle">
    - Catatan menyimpan metadata operasional: nama event, hitungan, ukuran byte, pembacaan memori, state antrean/sesi, id persetujuan, nama saluran/Plugin, dan ringkasan sesi yang disunting. Catatan tidak menyimpan teks chat, body webhook, output alat, body request atau respons mentah, token, cookie, nilai rahasia, hostname, atau id sesi mentah. Tetapkan `diagnostics.enabled: false` untuk menonaktifkan perekam sepenuhnya.
    - Pada exit fatal Gateway, timeout shutdown, dan kegagalan startup restart, OpenClaw menulis snapshot diagnostik yang sama ke `~/.openclaw/logs/stability/openclaw-stability-*.json` ketika perekam memiliki event. Periksa bundle terbaru dengan `openclaw gateway stability --bundle latest`; `--limit`, `--type`, dan `--since-seq` juga berlaku untuk output bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Tulis zip diagnostik lokal yang dirancang untuk dilampirkan ke laporan bug. Untuk model privasi dan isi bundle, lihat [Ekspor Diagnostik](/id/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Jalur zip keluaran. Default-nya adalah ekspor dukungan di bawah direktori status.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Jumlah maksimum baris log yang telah disanitasi untuk disertakan.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Jumlah maksimum byte log untuk diperiksa.
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
  Cetak jalur tertulis, ukuran, dan manifes sebagai JSON.
</ParamField>

Ekspor berisi manifes, ringkasan Markdown, bentuk konfigurasi, detail konfigurasi yang telah disanitasi, ringkasan log yang telah disanitasi, snapshot status/kesehatan Gateway yang telah disanitasi, dan bundel stabilitas terbaru jika ada.

Ini dimaksudkan untuk dibagikan. Ekspor ini menyimpan detail operasional yang membantu debugging, seperti bidang log OpenClaw yang aman, nama subsistem, kode status, durasi, mode yang dikonfigurasi, port, id plugin, id penyedia, pengaturan fitur non-rahasia, dan pesan log operasional yang disunting. Ekspor ini menghilangkan atau menyunting teks obrolan, isi webhook, keluaran alat, kredensial, cookie, pengidentifikasi akun/pesan, teks prompt/instruksi, nama host, dan nilai rahasia. Ketika pesan bergaya LogTape terlihat seperti teks payload pengguna/obrolan/alat, ekspor hanya menyimpan bahwa sebuah pesan dihilangkan beserta jumlah byte-nya.

### `gateway status`

`gateway status` menampilkan layanan Gateway (launchd/systemd/schtasks) plus pemeriksaan opsional untuk kemampuan konektivitas/autentikasi.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Tambahkan target pemeriksaan eksplisit. Remote yang dikonfigurasi + localhost tetap diperiksa.
</ParamField>
<ParamField path="--token <token>" type="string">
  Autentikasi token untuk pemeriksaan.
</ParamField>
<ParamField path="--password <password>" type="string">
  Autentikasi kata sandi untuk pemeriksaan.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Batas waktu pemeriksaan.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Lewati pemeriksaan konektivitas (tampilan layanan saja).
</ParamField>
<ParamField path="--deep" type="boolean">
  Pindai juga layanan tingkat sistem.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Tingkatkan pemeriksaan konektivitas default menjadi pemeriksaan baca dan keluar dengan nilai non-nol ketika pemeriksaan baca tersebut gagal. Tidak dapat digabungkan dengan `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Status semantics">
    - `gateway status` tetap tersedia untuk diagnostik meskipun konfigurasi CLI lokal hilang atau tidak valid.
    - `gateway status` default membuktikan status layanan, koneksi WebSocket, dan kemampuan autentikasi yang terlihat saat handshake. Ini tidak membuktikan operasi baca/tulis/admin.
    - Pemeriksaan diagnostik tidak memutasi autentikasi perangkat pertama kali: pemeriksaan ini menggunakan ulang token perangkat cache yang sudah ada jika tersedia, tetapi tidak membuat identitas perangkat CLI baru atau catatan pemasangan perangkat baca-saja hanya untuk memeriksa status.
    - `gateway status` menyelesaikan SecretRefs autentikasi yang dikonfigurasi untuk autentikasi pemeriksaan jika memungkinkan.
    - Jika SecretRef autentikasi yang diperlukan tidak terselesaikan di jalur perintah ini, `gateway status --json` melaporkan `rpc.authWarning` ketika konektivitas/autentikasi pemeriksaan gagal; teruskan `--token`/`--password` secara eksplisit atau selesaikan sumber rahasia terlebih dahulu.
    - Jika pemeriksaan berhasil, peringatan auth-ref yang tidak terselesaikan ditekan untuk menghindari positif palsu.
    - Ketika pemeriksaan diaktifkan, keluaran JSON menyertakan `gateway.version` saat Gateway yang berjalan melaporkannya; `--require-rpc` dapat kembali ke payload RPC `status.runtimeVersion` jika pemeriksaan handshake lanjutan tidak dapat menyediakan metadata versi.
    - Gunakan `--require-rpc` dalam skrip dan otomatisasi ketika layanan yang mendengarkan saja tidak cukup dan Anda juga membutuhkan panggilan RPC cakupan baca dalam keadaan sehat.
    - `--deep` menambahkan pemindaian upaya terbaik untuk instalasi launchd/systemd/schtasks tambahan. Ketika beberapa layanan mirip gateway terdeteksi, keluaran manusia mencetak petunjuk pembersihan dan memperingatkan bahwa sebagian besar pengaturan sebaiknya menjalankan satu gateway per mesin.
    - `--deep` juga melaporkan handoff restart supervisor Gateway terbaru ketika proses layanan keluar dengan bersih untuk restart supervisor eksternal.
    - `--deep` menjalankan validasi konfigurasi dalam mode sadar plugin (`pluginValidation: "full"`) dan menampilkan peringatan manifes plugin yang dikonfigurasi (misalnya metadata konfigurasi kanal yang hilang) sehingga pemeriksaan smoke instalasi dan pembaruan menangkapnya. `gateway status` default mempertahankan jalur baca-saja cepat yang melewati validasi plugin.
    - Keluaran manusia menyertakan jalur log file yang terselesaikan plus snapshot jalur/validitas konfigurasi CLI-vs-layanan untuk membantu mendiagnosis drift profil atau state-dir.

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - Pada instalasi systemd Linux, pemeriksaan drift autentikasi layanan membaca nilai `Environment=` dan `EnvironmentFile=` dari unit (termasuk `%h`, jalur yang dikutip, beberapa file, dan file `-` opsional).
    - Pemeriksaan drift menyelesaikan SecretRefs `gateway.auth.token` menggunakan env runtime gabungan (env perintah layanan terlebih dahulu, lalu fallback env proses).
    - Jika autentikasi token tidak aktif secara efektif (`gateway.auth.mode` eksplisit berupa `password`/`none`/`trusted-proxy`, atau mode tidak disetel saat kata sandi dapat menang dan tidak ada kandidat token yang dapat menang), pemeriksaan token-drift melewati resolusi token konfigurasi.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` adalah perintah "debug semuanya". Perintah ini selalu memeriksa:

- gateway remote yang Anda konfigurasi (jika disetel), dan
- localhost (loopback) **meskipun remote dikonfigurasi**.

Jika Anda meneruskan `--url`, target eksplisit tersebut ditambahkan sebelum keduanya. Keluaran manusia memberi label target sebagai:

- `URL (explicit)`
- `Remote (configured)` atau `Remote (configured, inactive)`
- `Local loopback`

<Note>
Jika beberapa target pemeriksaan dapat dijangkau, perintah ini mencetak semuanya. Tunnel SSH, URL TLS/proxy, dan URL remote yang dikonfigurasi semuanya dapat menunjuk ke gateway yang sama meskipun port transportnya berbeda; `multiple_gateways` disediakan untuk gateway yang dapat dijangkau dan berbeda atau ambigu identitasnya. Beberapa gateway didukung ketika Anda menggunakan profil terisolasi (misalnya bot penyelamat), tetapi sebagian besar instalasi tetap menjalankan satu gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Gunakan port ini untuk target pemeriksaan local loopback dan port remote tunnel SSH. Tanpa `--url`, ini memilih target local loopback, bukan URL lingkungan gateway yang dikonfigurasi, port lingkungan, atau target remote.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` berarti setidaknya satu target menerima koneksi WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` melaporkan apa yang dapat dibuktikan pemeriksaan tentang autentikasi. Ini terpisah dari keterjangkauan.
    - `Read probe: ok` berarti panggilan RPC detail cakupan baca (`health`/`status`/`system-presence`/`config.get`) juga berhasil.
    - `Read probe: limited - missing scope: operator.read` berarti koneksi berhasil tetapi RPC cakupan baca terbatas. Ini dilaporkan sebagai keterjangkauan **terdegradasi**, bukan kegagalan penuh.
    - `Read probe: failed` setelah `Connect: ok` berarti Gateway menerima koneksi WebSocket, tetapi diagnostik baca lanjutan kehabisan waktu atau gagal. Ini juga merupakan keterjangkauan **terdegradasi**, bukan Gateway yang tidak dapat dijangkau.
    - Seperti `gateway status`, pemeriksaan menggunakan ulang autentikasi perangkat cache yang sudah ada tetapi tidak membuat identitas perangkat pertama kali atau status pemasangan.
    - Kode keluar non-nol hanya ketika tidak ada target yang diperiksa dapat dijangkau.

  </Accordion>
  <Accordion title="JSON output">
    Tingkat atas:

    - `ok`: setidaknya satu target dapat dijangkau.
    - `degraded`: setidaknya satu target menerima koneksi tetapi tidak menyelesaikan diagnostik RPC detail penuh.
    - `capability`: kemampuan terbaik yang terlihat di seluruh target yang dapat dijangkau (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, atau `unknown`).
    - `primaryTargetId`: target terbaik untuk diperlakukan sebagai pemenang aktif dalam urutan ini: URL eksplisit, tunnel SSH, remote yang dikonfigurasi, lalu local loopback.
    - `warnings[]`: catatan peringatan upaya terbaik dengan `code`, `message`, dan `targetIds` opsional.
    - `network`: petunjuk URL local loopback/tailnet yang diturunkan dari konfigurasi saat ini dan jaringan host.
    - `discovery.timeoutMs` dan `discovery.count`: anggaran/jumlah hasil discovery aktual yang digunakan untuk pass pemeriksaan ini.

    Per target (`targets[].connect`):

    - `ok`: keterjangkauan setelah koneksi + klasifikasi terdegradasi.
    - `rpcOk`: keberhasilan RPC detail penuh.
    - `scopeLimited`: RPC detail gagal karena cakupan operator hilang.

    Per target (`targets[].auth`):

    - `role`: peran autentikasi yang dilaporkan dalam `hello-ok` jika tersedia.
    - `scopes`: cakupan yang diberikan yang dilaporkan dalam `hello-ok` jika tersedia.
    - `capability`: klasifikasi kemampuan autentikasi yang ditampilkan untuk target tersebut.

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`: penyiapan tunnel SSH gagal; perintah kembali ke pemeriksaan langsung.
    - `multiple_gateways`: identitas gateway yang berbeda dapat dijangkau, atau OpenClaw tidak dapat membuktikan target yang dapat dijangkau adalah gateway yang sama. Tunnel SSH, URL proxy, atau URL remote yang dikonfigurasi ke gateway yang sama tidak memicu peringatan ini.
    - `auth_secretref_unresolved`: SecretRef autentikasi yang dikonfigurasi tidak dapat diselesaikan untuk target yang gagal.
    - `probe_scope_limited`: koneksi WebSocket berhasil, tetapi pemeriksaan baca dibatasi oleh `operator.read` yang hilang.

  </Accordion>
</AccordionGroup>

#### Remote melalui SSH (paritas aplikasi Mac)

Mode "Remote over SSH" aplikasi macOS menggunakan penerusan port lokal sehingga gateway remote (yang mungkin hanya diikat ke loopback) menjadi dapat dijangkau di `ws://127.0.0.1:<port>`.

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
  Pilih host gateway pertama yang ditemukan sebagai target SSH dari endpoint discovery yang terselesaikan (`local.` plus domain area-luas yang dikonfigurasi, jika ada). Petunjuk hanya TXT diabaikan.
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
  Terutama untuk RPC bergaya agen yang mengalirkan peristiwa perantara sebelum payload final.
</ParamField>
<ParamField path="--json" type="boolean">
  Keluaran JSON yang dapat dibaca mesin.
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

### Instal dengan wrapper

Gunakan `--wrapper` saat layanan terkelola harus dimulai melalui executable lain, misalnya shim
pengelola rahasia atau helper run-as. Wrapper menerima argumen Gateway normal dan
bertanggung jawab untuk pada akhirnya menjalankan exec `openclaw` atau Node dengan argumen tersebut.

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

Anda juga dapat menetapkan wrapper melalui environment. `gateway install` memvalidasi bahwa path tersebut adalah
file executable, menulis wrapper ke `ProgramArguments` layanan, dan mempertahankan
`OPENCLAW_WRAPPER` di environment layanan untuk reinstall paksa, pembaruan, dan perbaikan doctor
di kemudian hari.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Untuk menghapus wrapper yang tersimpan secara persisten, kosongkan `OPENCLAW_WRAPPER` saat memasang ulang:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Command options">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - Gunakan `gateway restart` untuk memulai ulang layanan terkelola. Jangan merangkai `gateway stop` dan `gateway start` sebagai pengganti mulai ulang.
    - Di macOS, `gateway stop` menggunakan `launchctl bootout` secara default, yang menghapus LaunchAgent dari sesi boot saat ini tanpa menyimpan penonaktifan secara persisten — pemulihan otomatis KeepAlive tetap aktif untuk crash mendatang dan `gateway start` mengaktifkan ulang dengan bersih tanpa `launchctl enable` manual. Berikan `--disable` untuk menekan KeepAlive dan RunAtLoad secara persisten agar gateway tidak muncul ulang sampai `gateway start` eksplisit berikutnya; gunakan ini ketika penghentian manual harus bertahan melewati reboot atau mulai ulang sistem.
    - `gateway restart --safe` meminta Gateway yang sedang berjalan untuk memeriksa awal pekerjaan aktif dan menjadwalkan satu mulai ulang tergabung setelah pekerjaan aktif selesai. Mulai ulang aman default menunggu pekerjaan aktif hingga `gateway.reload.deferralTimeoutMs` yang dikonfigurasi (default 5 menit); ketika batas waktu itu habis, mulai ulang dipaksa. Atur `gateway.reload.deferralTimeoutMs` ke `0` untuk penantian aman tanpa batas yang tidak pernah memaksa. `--safe` tidak dapat digabungkan dengan `--force` atau `--wait`.
    - `gateway restart --wait 30s` menimpa batas waktu drain mulai ulang yang dikonfigurasi untuk mulai ulang tersebut. Angka tanpa satuan adalah milidetik; satuan seperti `s`, `m`, dan `h` diterima. `--wait 0` menunggu tanpa batas.
    - `gateway restart --safe --skip-deferral` menjalankan mulai ulang aman yang sadar OpenClaw tetapi melewati gerbang penangguhan sehingga Gateway langsung memancarkan mulai ulang meskipun pemblokir dilaporkan. Jalan keluar operator untuk penangguhan task-run yang macet; memerlukan `--safe`.
    - `gateway restart --force` melewati drain pekerjaan aktif dan langsung memulai ulang. Gunakan ini ketika operator sudah memeriksa pemblokir tugas yang tercantum dan ingin gateway kembali sekarang.
    - Perintah siklus hidup menerima `--json` untuk scripting.

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - Ketika auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, `gateway install` memvalidasi bahwa SecretRef dapat di-resolve tetapi tidak menyimpan token yang di-resolve ke dalam metadata lingkungan layanan.
    - Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi tidak terselesaikan, pemasangan gagal tertutup alih-alih menyimpan plaintext fallback.
    - Untuk auth kata sandi pada `gateway run`, pilih `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, atau `gateway.auth.password` yang didukung SecretRef daripada `--password` inline.
    - Dalam mode auth yang diinferensikan, `OPENCLAW_GATEWAY_PASSWORD` yang hanya ada di shell tidak melonggarkan persyaratan token pemasangan; gunakan konfigurasi tahan lama (`gateway.auth.password` atau config `env`) saat memasang layanan terkelola.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum diatur, pemasangan diblokir sampai mode diatur secara eksplisit.

  </Accordion>
</AccordionGroup>

## Temukan gateway (Bonjour)

`gateway discover` memindai beacon Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Wide-Area Bonjour): pilih domain (contoh: `openclaw.internal.`) dan siapkan DNS terpisah + server DNS; lihat [Bonjour](/id/gateway/bonjour).

Hanya Gateway dengan penemuan Bonjour yang diaktifkan (default) yang mengiklankan beacon.

Record penemuan area luas dapat menyertakan petunjuk TXT berikut:

- `role` (petunjuk peran Gateway)
- `transport` (petunjuk transport, mis. `gateway`)
- `gatewayPort` (port WebSocket, biasanya `18789`)
- `sshPort` (hanya mode penemuan penuh; klien menetapkan target SSH default ke `22` saat ini tidak ada)
- `tailnetDns` (nama host MagicDNS, saat tersedia)
- `gatewayTls` / `gatewayTlsSha256` (TLS diaktifkan + sidik jari sertifikat)
- `cliPath` (hanya mode penemuan penuh)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Batas waktu per perintah (telusuri/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Keluaran yang dapat dibaca mesin (juga menonaktifkan gaya/spinner).
</ParamField>

Contoh:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI memindai `local.` ditambah domain area luas yang dikonfigurasi saat ada yang diaktifkan.
- `wsUrl` dalam keluaran JSON diturunkan dari endpoint layanan yang di-resolve, bukan dari petunjuk khusus TXT seperti `lanHost` atau `tailnetDns`.
- Pada mDNS `local.` dan DNS-SD area luas, `sshPort` dan `cliPath` hanya dipublikasikan saat `discovery.mdns.mode` adalah `full`.

</Note>

## Terkait

- [Referensi CLI](/id/cli)
- [Runbook Gateway](/id/gateway)
