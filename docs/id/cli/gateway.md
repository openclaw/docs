---
read_when:
    - Menjalankan Gateway dari CLI (pengembangan atau server)
    - Men-debug autentikasi Gateway, mode pengikatan, dan konektivitas
    - Menemukan Gateway melalui Bonjour (DNS-SD lokal + area luas)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — jalankan, kueri, dan temukan Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-11T20:26:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 774753c844909d1ec9257f2035b10c2561432ec2161351e9a6438cd12f7f2ecc
    source_path: cli/gateway.md
    workflow: 16
---

Gateway adalah server WebSocket OpenClaw (channel, node, sesi, hook). Subperintah di halaman ini berada di bawah `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Penemuan Bonjour" href="/id/gateway/bonjour">
    Penyiapan mDNS lokal + DNS-SD area luas.
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
    - Secara default, Gateway menolak untuk dimulai kecuali `gateway.mode=local` diatur di `~/.openclaw/openclaw.json`. Gunakan `--allow-unconfigured` untuk proses ad-hoc/dev.
    - `openclaw onboard --mode local` dan `openclaw setup` diharapkan menulis `gateway.mode=local`. Jika file ada tetapi `gateway.mode` hilang, perlakukan itu sebagai konfigurasi yang rusak atau tertimpa dan perbaiki, bukan mengasumsikan mode lokal secara implisit.
    - Jika file ada dan `gateway.mode` hilang, Gateway memperlakukannya sebagai kerusakan konfigurasi yang mencurigakan dan menolak untuk "menebak lokal" untuk Anda.
    - Binding di luar loopback tanpa autentikasi diblokir (pembatas keamanan).
    - `SIGUSR1` memicu restart dalam proses saat diotorisasi (`commands.restart` diaktifkan secara default; atur `commands.restart: false` untuk memblokir restart manual, sementara penerapan/pembaruan alat/konfigurasi gateway tetap diizinkan).
    - Handler `SIGINT`/`SIGTERM` menghentikan proses gateway, tetapi tidak memulihkan status terminal khusus apa pun. Jika Anda membungkus CLI dengan TUI atau input raw-mode, pulihkan terminal sebelum keluar.

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
  Override mode autentikasi.
</ParamField>
<ParamField path="--token <token>" type="string">
  Override token (juga mengatur `OPENCLAW_GATEWAY_TOKEN` untuk proses).
</ParamField>
<ParamField path="--password <password>" type="string">
  Override kata sandi.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Baca kata sandi gateway dari file.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Ekspos Gateway melalui Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Reset konfigurasi serve/funnel Tailscale saat shutdown.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Izinkan gateway dimulai tanpa `gateway.mode=local` di konfigurasi. Hanya melewati penjaga startup untuk bootstrap ad-hoc/dev; tidak menulis atau memperbaiki file konfigurasi.
</ParamField>
<ParamField path="--dev" type="boolean">
  Buat konfigurasi dev + workspace jika hilang (melewati BOOTSTRAP.md).
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
  Log event stream model mentah ke jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Path jsonl stream mentah.
</ParamField>

## Restart Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` meminta Gateway yang sedang berjalan untuk melakukan preflight pada pekerjaan OpenClaw aktif sebelum restart. Jika operasi antrean, pengiriman balasan, run tertanam, atau task run sedang aktif, Gateway melaporkan pemblokir, menggabungkan permintaan restart aman yang duplikat, dan restart setelah pekerjaan aktif selesai. `restart` biasa mempertahankan perilaku service-manager yang ada untuk kompatibilitas. Gunakan `--force` hanya saat Anda secara eksplisit menginginkan jalur override langsung.

`openclaw gateway restart --safe --skip-deferral` menjalankan restart terkoordinasi yang sadar OpenClaw yang sama seperti `--safe`, tetapi melewati gerbang penundaan pekerjaan aktif sehingga Gateway memancarkan restart segera meskipun pemblokir dilaporkan. Gunakan ini sebagai pintu keluar operator saat penundaan tertahan oleh task run yang macet dan `--safe` saja akan menunggu tanpa batas. `--skip-deferral` memerlukan `--safe`.

<Warning>
`--password` inline dapat terekspos dalam daftar proses lokal. Lebih baik gunakan `--password-file`, env, atau `gateway.auth.password` berbasis SecretRef.
</Warning>

### Profiling startup

- Atur `OPENCLAW_GATEWAY_STARTUP_TRACE=1` untuk mencatat timing fase selama startup Gateway, termasuk delay `eventLoopMax` per fase dan timing tabel lookup plugin untuk installed-index, registri manifest, perencanaan startup, dan pekerjaan owner-map.
- Atur `OPENCLAW_DIAGNOSTICS=timeline` dengan `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` untuk menulis timeline diagnostik startup JSONL best-effort bagi harness QA eksternal. Anda juga dapat mengaktifkan flag dengan `diagnostics.flags: ["timeline"]` di konfigurasi; path tetap disediakan melalui env. Tambahkan `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` untuk menyertakan sampel event-loop.
- Jalankan `pnpm test:startup:gateway -- --runs 5 --warmup 1` untuk melakukan benchmark startup Gateway. Benchmark mencatat output proses pertama, `/healthz`, `/readyz`, timing trace startup, delay event-loop, dan detail timing tabel lookup plugin.

## Kueri Gateway yang berjalan

Semua perintah kueri menggunakan RPC WebSocket.

<Tabs>
  <Tab title="Mode output">
    - Default: mudah dibaca manusia (berwarna di TTY).
    - `--json`: JSON yang mudah dibaca mesin (tanpa styling/spinner).
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
Saat Anda mengatur `--url`, CLI tidak fallback ke kredensial konfigurasi atau lingkungan. Teruskan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang hilang adalah error.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Endpoint HTTP `/healthz` adalah probe liveness: endpoint ini mengembalikan respons setelah server dapat menjawab HTTP. Endpoint HTTP `/readyz` lebih ketat dan tetap merah saat sidecar plugin startup, channel, atau hook terkonfigurasi masih dalam proses stabilisasi. Respons readiness detail yang lokal atau terautentikasi menyertakan blok diagnostik `eventLoop` dengan delay event-loop, utilisasi event-loop, rasio core CPU, dan flag `degraded`.

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

Ambil perekam stabilitas diagnostik terbaru dari Gateway yang berjalan.

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
  Filter menurut tipe event diagnostik, seperti `payload.large` atau `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Sertakan hanya event setelah nomor urut diagnostik.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Baca bundle stabilitas yang dipersist, bukan memanggil Gateway yang berjalan. Gunakan `--bundle latest` (atau cukup `--bundle`) untuk bundle terbaru di bawah direktori state, atau teruskan path JSON bundle secara langsung.
</ParamField>
<ParamField path="--export" type="boolean">
  Tulis zip diagnostik dukungan yang dapat dibagikan, bukan mencetak detail stabilitas.
</ParamField>
<ParamField path="--output <path>" type="string">
  Path output untuk `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privasi dan perilaku bundle">
    - Rekaman menyimpan metadata operasional: nama event, hitungan, ukuran byte, pembacaan memori, status antrean/sesi, nama channel/plugin, dan ringkasan sesi yang disunting. Rekaman tidak menyimpan teks chat, body webhook, output alat, body permintaan atau respons mentah, token, cookie, nilai rahasia, hostname, atau id sesi mentah. Atur `diagnostics.enabled: false` untuk menonaktifkan perekam sepenuhnya.
    - Pada exit Gateway fatal, timeout shutdown, dan kegagalan startup restart, OpenClaw menulis snapshot diagnostik yang sama ke `~/.openclaw/logs/stability/openclaw-stability-*.json` saat perekam memiliki event. Periksa bundle terbaru dengan `openclaw gateway stability --bundle latest`; `--limit`, `--type`, dan `--since-seq` juga berlaku untuk output bundle.

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
  Path zip output. Default ke ekspor dukungan di bawah direktori state.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maksimum baris log yang sudah disanitasi untuk disertakan.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maksimum byte log yang akan diperiksa.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket Gateway untuk snapshot health.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token Gateway untuk snapshot health.
</ParamField>
<ParamField path="--password <password>" type="string">
  Kata sandi Gateway untuk snapshot health.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Timeout snapshot status/health.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Lewati lookup bundle stabilitas yang dipersist.
</ParamField>
<ParamField path="--json" type="boolean">
  Cetak path tertulis, ukuran, dan manifest sebagai JSON.
</ParamField>

Ekspor berisi manifest, ringkasan Markdown, bentuk konfigurasi, detail konfigurasi yang disanitasi, ringkasan log yang disanitasi, snapshot status/health Gateway yang disanitasi, dan bundle stabilitas terbaru jika ada.

Ini dimaksudkan untuk dibagikan. Ekspor menyimpan detail operasional yang membantu debugging, seperti field log OpenClaw yang aman, nama subsistem, kode status, durasi, mode terkonfigurasi, port, id plugin, id penyedia, pengaturan fitur nonrahasia, dan pesan log operasional yang disunting. Ekspor menghilangkan atau menyunting teks chat, body webhook, output alat, kredensial, cookie, pengenal akun/pesan, teks prompt/instruksi, hostname, dan nilai rahasia. Saat pesan bergaya LogTape terlihat seperti teks payload pengguna/chat/alat, ekspor hanya menyimpan bahwa sebuah pesan dihilangkan beserta jumlah byte-nya.

### `gateway status`

`gateway status` menampilkan layanan Gateway (launchd/systemd/schtasks) plus probe opsional untuk kemampuan konektivitas/autentikasi.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Tambahkan target probe eksplisit. Remote yang dikonfigurasi + localhost tetap diprobe.
</ParamField>
<ParamField path="--token <token>" type="string">
  Autentikasi token untuk probe.
</ParamField>
<ParamField path="--password <password>" type="string">
  Autentikasi kata sandi untuk probe.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Waktu tunggu probe.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Lewati probe konektivitas (tampilan khusus layanan).
</ParamField>
<ParamField path="--deep" type="boolean">
  Pindai juga layanan tingkat sistem.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Tingkatkan probe konektivitas default menjadi probe baca dan keluar dengan nilai non-nol saat probe baca tersebut gagal. Tidak dapat digabungkan dengan `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantik status">
    - `gateway status` tetap tersedia untuk diagnostik meskipun konfigurasi CLI lokal hilang atau tidak valid.
    - `gateway status` default membuktikan status layanan, koneksi WebSocket, dan kapabilitas auth yang terlihat saat handshake. Perintah ini tidak membuktikan operasi baca/tulis/admin.
    - Probe diagnostik tidak melakukan mutasi untuk auth perangkat pertama kali: probe menggunakan kembali token perangkat cache yang sudah ada jika tersedia, tetapi tidak membuat identitas perangkat CLI baru atau rekaman pemasangan perangkat hanya-baca baru hanya untuk memeriksa status.
    - `gateway status` menyelesaikan SecretRefs auth yang dikonfigurasi untuk auth probe jika memungkinkan.
    - Jika SecretRef auth yang diperlukan tidak terselesaikan di jalur perintah ini, `gateway status --json` melaporkan `rpc.authWarning` saat konektivitas/auth probe gagal; teruskan `--token`/`--password` secara eksplisit atau selesaikan sumber secret terlebih dahulu.
    - Jika probe berhasil, peringatan auth-ref yang belum terselesaikan disembunyikan untuk menghindari positif palsu.
    - Gunakan `--require-rpc` dalam skrip dan otomatisasi saat layanan yang mendengarkan saja tidak cukup dan Anda juga memerlukan panggilan RPC cakupan-baca dalam kondisi sehat.
    - `--deep` menambahkan pemindaian best-effort untuk instalasi launchd/systemd/schtasks tambahan. Saat beberapa layanan mirip gateway terdeteksi, output manusia mencetak petunjuk pembersihan dan memperingatkan bahwa sebagian besar setup sebaiknya menjalankan satu Gateway per mesin.
    - `--deep` juga melaporkan handoff restart supervisor Gateway terbaru saat proses layanan keluar dengan bersih untuk restart supervisor eksternal.
    - `--deep` menjalankan validasi konfigurasi dalam mode sadar plugin (`pluginValidation: "full"`) dan menampilkan peringatan manifes plugin yang dikonfigurasi (misalnya metadata konfigurasi channel yang hilang) agar pemeriksaan smoke instalasi dan pembaruan dapat menangkapnya. `gateway status` default mempertahankan jalur hanya-baca cepat yang melewati validasi plugin.
    - Output manusia menyertakan jalur log file yang terselesaikan plus snapshot jalur/validitas konfigurasi CLI-vs-layanan untuk membantu mendiagnosis drift profil atau state-dir.

  </Accordion>
  <Accordion title="Pemeriksaan drift auth Linux systemd">
    - Pada instalasi Linux systemd, pemeriksaan drift auth layanan membaca nilai `Environment=` dan `EnvironmentFile=` dari unit (termasuk `%h`, jalur berpetik, beberapa file, dan file opsional `-`).
    - Pemeriksaan drift menyelesaikan SecretRefs `gateway.auth.token` menggunakan env runtime gabungan (env perintah layanan terlebih dahulu, lalu fallback env proses).
    - Jika auth token tidak aktif secara efektif (`gateway.auth.mode` eksplisit berupa `password`/`none`/`trusted-proxy`, atau mode tidak disetel ketika kata sandi bisa menang dan tidak ada kandidat token yang bisa menang), pemeriksaan token-drift melewati penyelesaian token konfigurasi.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` adalah perintah "debug semuanya". Perintah ini selalu memprobe:

- gateway remote yang Anda konfigurasi (jika disetel), dan
- localhost (loopback) **meskipun remote dikonfigurasi**.

Jika Anda meneruskan `--url`, target eksplisit tersebut ditambahkan di depan keduanya. Output manusia memberi label target sebagai:

- `URL (explicit)`
- `Remote (configured)` atau `Remote (configured, inactive)`
- `Local loopback`

<Note>
Jika beberapa gateway dapat dijangkau, perintah ini mencetak semuanya. Beberapa gateway didukung saat Anda menggunakan profil/port terisolasi (misalnya, bot penyelamat), tetapi sebagian besar instalasi tetap menjalankan satu Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretasi">
    - `Reachable: yes` berarti setidaknya satu target menerima koneksi WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` melaporkan apa yang dapat dibuktikan probe tentang auth. Ini terpisah dari keterjangkauan.
    - `Read probe: ok` berarti panggilan RPC detail cakupan-baca (`health`/`status`/`system-presence`/`config.get`) juga berhasil.
    - `Read probe: limited - missing scope: operator.read` berarti koneksi berhasil tetapi RPC cakupan-baca terbatas. Ini dilaporkan sebagai keterjangkauan **terdegradasi**, bukan kegagalan penuh.
    - `Read probe: failed` setelah `Connect: ok` berarti Gateway menerima koneksi WebSocket, tetapi diagnostik baca lanjutan kehabisan waktu atau gagal. Ini juga merupakan keterjangkauan **terdegradasi**, bukan Gateway yang tidak dapat dijangkau.
    - Seperti `gateway status`, probe menggunakan kembali auth perangkat cache yang ada tetapi tidak membuat identitas perangkat pertama kali atau status pemasangan.
    - Exit code bernilai non-nol hanya jika tidak ada target yang diprobe yang dapat dijangkau.

  </Accordion>
  <Accordion title="Output JSON">
    Tingkat atas:

    - `ok`: setidaknya satu target dapat dijangkau.
    - `degraded`: setidaknya satu target menerima koneksi tetapi tidak menyelesaikan diagnostik RPC detail penuh.
    - `capability`: kapabilitas terbaik yang terlihat di seluruh target yang dapat dijangkau (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, atau `unknown`).
    - `primaryTargetId`: target terbaik untuk diperlakukan sebagai pemenang aktif dalam urutan ini: URL eksplisit, tunnel SSH, remote yang dikonfigurasi, lalu local loopback.
    - `warnings[]`: rekaman peringatan best-effort dengan `code`, `message`, dan `targetIds` opsional.
    - `network`: petunjuk URL local loopback/tailnet yang diturunkan dari konfigurasi saat ini dan jaringan host.
    - `discovery.timeoutMs` dan `discovery.count`: anggaran/jumlah hasil discovery aktual yang digunakan untuk pass probe ini.

    Per target (`targets[].connect`):

    - `ok`: keterjangkauan setelah klasifikasi koneksi + terdegradasi.
    - `rpcOk`: keberhasilan RPC detail penuh.
    - `scopeLimited`: RPC detail gagal karena cakupan operator hilang.

    Per target (`targets[].auth`):

    - `role`: peran auth yang dilaporkan dalam `hello-ok` saat tersedia.
    - `scopes`: cakupan yang diberikan yang dilaporkan dalam `hello-ok` saat tersedia.
    - `capability`: klasifikasi kapabilitas auth yang ditampilkan untuk target tersebut.

  </Accordion>
  <Accordion title="Kode peringatan umum">
    - `ssh_tunnel_failed`: setup tunnel SSH gagal; perintah kembali ke probe langsung.
    - `multiple_gateways`: lebih dari satu target dapat dijangkau; ini tidak biasa kecuali Anda sengaja menjalankan profil terisolasi, seperti bot penyelamat.
    - `auth_secretref_unresolved`: SecretRef auth yang dikonfigurasi tidak dapat diselesaikan untuk target yang gagal.
    - `probe_scope_limited`: koneksi WebSocket berhasil, tetapi probe baca dibatasi oleh `operator.read` yang hilang.

  </Accordion>
</AccordionGroup>

#### Remote melalui SSH (paritas aplikasi Mac)

Mode "Remote melalui SSH" aplikasi macOS menggunakan port-forward lokal sehingga gateway remote (yang mungkin hanya terikat ke loopback) dapat dijangkau di `ws://127.0.0.1:<port>`.

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
  Pilih host gateway pertama yang ditemukan sebagai target SSH dari endpoint discovery yang terselesaikan (`local.` plus domain area-luas yang dikonfigurasi, jika ada). Petunjuk hanya-TXT diabaikan.
</ParamField>

Konfigurasi (opsional, digunakan sebagai default):

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
  Kata sandi Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  Anggaran waktu tunggu.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Terutama untuk RPC gaya agen yang melakukan streaming peristiwa perantara sebelum payload final.
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

### Instal dengan wrapper

Gunakan `--wrapper` saat layanan terkelola harus dimulai melalui executable lain, misalnya
shim pengelola secret atau helper run-as. Wrapper menerima argumen Gateway normal dan
bertanggung jawab untuk akhirnya menjalankan `openclaw` atau Node dengan argumen tersebut.

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

Anda juga dapat menyetel wrapper melalui environment. `gateway install` memvalidasi bahwa jalur tersebut adalah
file executable, menulis wrapper ke `ProgramArguments` layanan, dan mempertahankan
`OPENCLAW_WRAPPER` di environment layanan untuk instalasi ulang paksa, pembaruan, dan perbaikan doctor
selanjutnya.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Untuk menghapus wrapper yang dipertahankan, kosongkan `OPENCLAW_WRAPPER` saat menginstal ulang:

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
  <Accordion title="Perilaku siklus hidup">
    - Gunakan `gateway restart` untuk memulai ulang layanan terkelola. Jangan merangkai `gateway stop` dan `gateway start` sebagai pengganti restart.
    - Di macOS, `gateway stop` menggunakan `launchctl bootout` secara default, yang menghapus LaunchAgent dari sesi boot saat ini tanpa mempertahankan penonaktifan — pemulihan otomatis KeepAlive tetap aktif untuk crash di masa mendatang dan `gateway start` mengaktifkan ulang dengan bersih tanpa `launchctl enable` manual. Berikan `--disable` untuk menekan KeepAlive dan RunAtLoad secara persisten agar gateway tidak muncul ulang hingga `gateway start` eksplisit berikutnya; gunakan ini ketika penghentian manual harus bertahan melewati reboot atau restart sistem.
    - `gateway restart --safe` meminta Gateway yang sedang berjalan untuk melakukan preflight pekerjaan OpenClaw aktif dan menunda restart hingga pengiriman balasan, run tersemat, dan run tugas selesai dikosongkan. `--safe` tidak dapat digabungkan dengan `--force` atau `--wait`.
    - `gateway restart --wait 30s` menimpa anggaran pengosongan restart yang dikonfigurasi untuk restart tersebut. Angka polos adalah milidetik; unit seperti `s`, `m`, dan `h` diterima. `--wait 0` menunggu tanpa batas.
    - `gateway restart --safe --skip-deferral` menjalankan restart aman yang sadar OpenClaw tetapi melewati gerbang penundaan sehingga Gateway memancarkan restart segera meskipun pemblokir dilaporkan. Jalan keluar operator untuk penundaan run tugas yang macet; memerlukan `--safe`.
    - `gateway restart --force` melewati pengosongan pekerjaan aktif dan memulai ulang segera. Gunakan ini ketika operator sudah memeriksa pemblokir tugas yang tercantum dan ingin gateway kembali sekarang.
    - Perintah siklus hidup menerima `--json` untuk skrip.

  </Accordion>
  <Accordion title="Autentikasi dan SecretRefs saat instalasi">
    - Ketika autentikasi token memerlukan token dan `gateway.auth.token` dikelola SecretRef, `gateway install` memvalidasi bahwa SecretRef dapat di-resolve tetapi tidak mempertahankan token yang di-resolve ke metadata lingkungan layanan.
    - Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi tidak ter-resolve, instalasi gagal secara tertutup alih-alih mempertahankan fallback plaintext.
    - Untuk autentikasi kata sandi pada `gateway run`, pilih `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, atau `gateway.auth.password` yang didukung SecretRef daripada `--password` inline.
    - Dalam mode autentikasi inferensi, `OPENCLAW_GATEWAY_PASSWORD` yang hanya ada di shell tidak melonggarkan persyaratan token instalasi; gunakan konfigurasi tahan lama (`gateway.auth.password` atau config `env`) saat menginstal layanan terkelola.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum diatur, instalasi diblokir hingga mode diatur secara eksplisit.

  </Accordion>
</AccordionGroup>

## Temukan gateway (Bonjour)

`gateway discover` memindai beacon Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): pilih domain (contoh: `openclaw.internal.`) dan siapkan split DNS + server DNS; lihat [Bonjour](/id/gateway/bonjour).

Hanya gateway dengan penemuan Bonjour yang diaktifkan (default) yang mengiklankan beacon.

Catatan penemuan Wide-Area mencakup (TXT):

- `role` (petunjuk peran gateway)
- `transport` (petunjuk transport, mis. `gateway`)
- `gatewayPort` (port WebSocket, biasanya `18789`)
- `sshPort` (opsional; klien menetapkan target SSH default ke `22` saat ini tidak ada)
- `tailnetDns` (hostname MagicDNS, bila tersedia)
- `gatewayTls` / `gatewayTlsSha256` (TLS aktif + fingerprint sertifikat)
- `cliPath` (petunjuk instalasi jarak jauh yang ditulis ke zona wide-area)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Timeout per perintah (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Output yang dapat dibaca mesin (juga menonaktifkan gaya tampilan/indikator pemuatan).
</ParamField>

Contoh:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI memindai `local.` ditambah domain wide-area yang dikonfigurasi ketika salah satunya diaktifkan.
- `wsUrl` dalam output JSON berasal dari endpoint layanan yang di-resolve, bukan dari petunjuk khusus TXT seperti `lanHost` atau `tailnetDns`.
- Pada mDNS `local.`, `sshPort` dan `cliPath` hanya disiarkan ketika `discovery.mdns.mode` adalah `full`. DNS-SD wide-area tetap menulis `cliPath`; `sshPort` tetap opsional di sana juga.

</Note>

## Terkait

- [Referensi CLI](/id/cli)
- [Runbook Gateway](/id/gateway)
