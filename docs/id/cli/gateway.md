---
read_when:
    - Menjalankan Gateway dari CLI (pengembangan atau server)
    - Memecahkan masalah autentikasi Gateway, mode bind, dan konektivitas
    - Menemukan Gateway melalui Bonjour (DNS-SD lokal + area luas)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — jalankan, kueri, dan temukan Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-12T12:50:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b19babe545895b8a5fc4b49bef5a0f9103091795f3e3c9bbcdf9ba9d7784538
    source_path: cli/gateway.md
    workflow: 16
---

Gateway adalah server WebSocket OpenClaw (saluran, node, sesi, hook). Subperintah di halaman ini berada di bawah `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/id/gateway/bonjour">
    Penyiapan mDNS lokal + DNS-SD area luas.
  </Card>
  <Card title="Discovery overview" href="/id/gateway/discovery">
    Cara OpenClaw mengiklankan dan menemukan Gateway.
  </Card>
  <Card title="Configuration" href="/id/gateway/configuration">
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
  <Accordion title="Startup behavior">
    - Secara default, Gateway menolak untuk dimulai kecuali `gateway.mode=local` diatur di `~/.openclaw/openclaw.json`. Gunakan `--allow-unconfigured` untuk eksekusi ad-hoc/pengembangan.
    - `openclaw onboard --mode local` dan `openclaw setup` diharapkan menulis `gateway.mode=local`. Jika file ada tetapi `gateway.mode` tidak ada, perlakukan itu sebagai konfigurasi yang rusak atau tertimpa dan perbaiki, alih-alih mengasumsikan mode lokal secara implisit.
    - Jika file ada dan `gateway.mode` tidak ada, Gateway memperlakukan itu sebagai kerusakan konfigurasi yang mencurigakan dan menolak untuk "menebak lokal" untuk Anda.
    - Binding di luar loopback tanpa autentikasi diblokir (batas pengaman keselamatan).
    - `SIGUSR1` memicu mulai ulang dalam proses saat diotorisasi (`commands.restart` diaktifkan secara default; atur `commands.restart: false` untuk memblokir mulai ulang manual, sementara penerapan/pembaruan alat/konfigurasi Gateway tetap diizinkan).
    - Handler `SIGINT`/`SIGTERM` menghentikan proses Gateway, tetapi tidak memulihkan status terminal khusus apa pun. Jika Anda membungkus CLI dengan TUI atau input raw-mode, pulihkan terminal sebelum keluar.

  </Accordion>
</AccordionGroup>

### Opsi

<ParamField path="--port <port>" type="number">
  Port WebSocket (default berasal dari konfigurasi/env; biasanya `18789`).
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
  Baca kata sandi Gateway dari file.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Ekspos Gateway melalui Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Reset konfigurasi serve/funnel Tailscale saat dimatikan.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Izinkan Gateway dimulai tanpa `gateway.mode=local` dalam konfigurasi. Hanya melewati pengaman startup untuk bootstrap ad-hoc/pengembangan; tidak menulis atau memperbaiki file konfigurasi.
</ParamField>
<ParamField path="--dev" type="boolean">
  Buat konfigurasi pengembangan + workspace jika tidak ada (melewati BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Reset konfigurasi pengembangan + kredensial + sesi + workspace (memerlukan `--dev`).
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
  Catat event stream model mentah ke jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Path jsonl stream mentah.
</ParamField>

## Mulai Ulang Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` meminta Gateway yang berjalan melakukan preflight pekerjaan OpenClaw aktif sebelum memulai ulang. Jika operasi antrean, pengiriman balasan, eksekusi tertanam, atau eksekusi tugas sedang aktif, Gateway melaporkan pemblokirnya, menggabungkan permintaan mulai ulang aman yang duplikat, dan memulai ulang setelah pekerjaan aktif selesai. `restart` biasa mempertahankan perilaku service-manager yang sudah ada untuk kompatibilitas. Gunakan `--force` hanya saat Anda secara eksplisit menginginkan jalur override langsung.

`openclaw gateway restart --safe --skip-deferral` menjalankan mulai ulang terkoordinasi yang sama dan sadar OpenClaw seperti `--safe`, tetapi melewati gerbang penundaan pekerjaan aktif sehingga Gateway langsung memancarkan mulai ulang meskipun pemblokir dilaporkan. Gunakan ini sebagai pintu keluar operator saat penundaan tertahan oleh eksekusi tugas yang macet dan `--safe` saja akan menunggu tanpa batas. `--skip-deferral` memerlukan `--safe`.

<Warning>
`--password` inline dapat terekspos dalam daftar proses lokal. Lebih baik gunakan `--password-file`, env, atau `gateway.auth.password` yang didukung SecretRef.
</Warning>

### Profiling startup

- Atur `OPENCLAW_GATEWAY_STARTUP_TRACE=1` untuk mencatat timing fase selama startup Gateway, termasuk penundaan `eventLoopMax` per fase dan timing tabel lookup plugin untuk indeks terinstal, registry manifest, perencanaan startup, dan pekerjaan owner-map.
- Atur `OPENCLAW_DIAGNOSTICS=timeline` dengan `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` untuk menulis timeline diagnostik startup JSONL best-effort bagi harness QA eksternal. Anda juga dapat mengaktifkan flag dengan `diagnostics.flags: ["timeline"]` dalam konfigurasi; path tetap disediakan env. Tambahkan `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` untuk menyertakan sampel event-loop.
- Jalankan `pnpm test:startup:gateway -- --runs 5 --warmup 1` untuk mengukur startup Gateway. Benchmark mencatat output proses pertama, `/healthz`, `/readyz`, timing trace startup, penundaan event-loop, dan detail timing tabel lookup plugin.

## Kueri Gateway yang berjalan

Semua perintah kueri menggunakan RPC WebSocket.

<Tabs>
  <Tab title="Output modes">
    - Default: mudah dibaca manusia (berwarna di TTY).
    - `--json`: JSON yang dapat dibaca mesin (tanpa styling/spinner).
    - `--no-color` (atau `NO_COLOR=1`): nonaktifkan ANSI sambil mempertahankan tata letak manusia.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: URL WebSocket Gateway.
    - `--token <token>`: token Gateway.
    - `--password <password>`: kata sandi Gateway.
    - `--timeout <ms>`: timeout/anggaran (bervariasi per perintah).
    - `--expect-final`: tunggu respons "final" (panggilan agen).

  </Tab>
</Tabs>

<Note>
Saat Anda mengatur `--url`, CLI tidak fallback ke kredensial konfigurasi atau lingkungan. Teruskan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang tidak ada adalah error.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Endpoint HTTP `/healthz` adalah probe liveness: ia mengembalikan respons setelah server dapat menjawab HTTP. Endpoint HTTP `/readyz` lebih ketat dan tetap merah saat sidecar plugin startup, saluran, atau hook yang dikonfigurasi masih dalam proses stabil. Respons readiness detail yang lokal atau terautentikasi menyertakan blok diagnostik `eventLoop` dengan penundaan event-loop, utilisasi event-loop, rasio inti CPU, dan flag `degraded`.

### `gateway usage-cost`

Ambil ringkasan biaya penggunaan dari log sesi.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Jumlah hari yang akan disertakan.
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
  Jumlah maksimum event terbaru yang akan disertakan (maks `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filter menurut jenis event diagnostik, seperti `payload.large` atau `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Hanya sertakan event setelah nomor urut diagnostik.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Baca bundle stabilitas yang dipersistenkan alih-alih memanggil Gateway yang berjalan. Gunakan `--bundle latest` (atau cukup `--bundle`) untuk bundle terbaru di bawah direktori state, atau teruskan langsung path JSON bundle.
</ParamField>
<ParamField path="--export" type="boolean">
  Tulis zip diagnostik dukungan yang dapat dibagikan alih-alih mencetak detail stabilitas.
</ParamField>
<ParamField path="--output <path>" type="string">
  Path output untuk `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - Rekaman menyimpan metadata operasional: nama event, jumlah, ukuran byte, pembacaan memori, status antrean/sesi, nama saluran/plugin, dan ringkasan sesi yang disunting. Rekaman tidak menyimpan teks chat, body webhook, output alat, body request atau respons mentah, token, cookie, nilai rahasia, hostname, atau id sesi mentah. Atur `diagnostics.enabled: false` untuk menonaktifkan perekam sepenuhnya.
    - Pada keluarnya Gateway yang fatal, timeout shutdown, dan kegagalan startup restart, OpenClaw menulis snapshot diagnostik yang sama ke `~/.openclaw/logs/stability/openclaw-stability-*.json` saat perekam memiliki event. Periksa bundle terbaru dengan `openclaw gateway stability --bundle latest`; `--limit`, `--type`, dan `--since-seq` juga berlaku untuk output bundle.

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
  Baris log tersanitasi maksimum yang akan disertakan.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Byte log maksimum yang akan diperiksa.
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
  Timeout snapshot status/kesehatan.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Lewati lookup bundle stabilitas yang dipersistenkan.
</ParamField>
<ParamField path="--json" type="boolean">
  Cetak path yang ditulis, ukuran, dan manifest sebagai JSON.
</ParamField>

Ekspor berisi manifest, ringkasan Markdown, bentuk konfigurasi, detail konfigurasi tersanitasi, ringkasan log tersanitasi, snapshot status/kesehatan Gateway tersanitasi, dan bundle stabilitas terbaru saat ada.

Ini dimaksudkan untuk dibagikan. Ekspor menyimpan detail operasional yang membantu debugging, seperti field log OpenClaw yang aman, nama subsistem, kode status, durasi, mode yang dikonfigurasi, port, id plugin, id provider, pengaturan fitur non-rahasia, dan pesan log operasional yang disunting. Ekspor menghilangkan atau menyunting teks chat, body webhook, output alat, kredensial, cookie, identifier akun/pesan, teks prompt/instruksi, hostname, dan nilai rahasia. Saat pesan bergaya LogTape tampak seperti teks payload pengguna/chat/alat, ekspor hanya menyimpan bahwa sebuah pesan dihilangkan beserta jumlah byte-nya.

### `gateway status`

`gateway status` menampilkan layanan Gateway (launchd/systemd/schtasks) ditambah probe opsional untuk kemampuan konektivitas/autentikasi.

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
  Batas waktu probe.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Lewati probe konektivitas (tampilan layanan saja).
</ParamField>
<ParamField path="--deep" type="boolean">
  Pindai juga layanan tingkat sistem.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Tingkatkan probe konektivitas default menjadi probe baca dan keluar dengan non-zero ketika probe baca tersebut gagal. Tidak dapat digabungkan dengan `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantik status">
    - `gateway status` tetap tersedia untuk diagnostik bahkan ketika konfigurasi CLI lokal hilang atau tidak valid.
    - `gateway status` default membuktikan status layanan, koneksi WebSocket, dan kapabilitas autentikasi yang terlihat pada waktu handshake. Ini tidak membuktikan operasi baca/tulis/admin.
    - Probe diagnostik tidak melakukan mutasi untuk autentikasi perangkat pertama kali: probe menggunakan ulang token perangkat yang sudah ada di cache jika tersedia, tetapi tidak membuat identitas perangkat CLI baru atau catatan pemasangan perangkat read-only hanya untuk memeriksa status.
    - `gateway status` menyelesaikan SecretRefs autentikasi yang dikonfigurasi untuk autentikasi probe jika memungkinkan.
    - Jika SecretRef autentikasi wajib tidak terselesaikan dalam jalur perintah ini, `gateway status --json` melaporkan `rpc.authWarning` ketika konektivitas/autentikasi probe gagal; teruskan `--token`/`--password` secara eksplisit atau selesaikan sumber secret terlebih dahulu.
    - Jika probe berhasil, peringatan auth-ref yang tidak terselesaikan disembunyikan untuk menghindari positif palsu.
    - Gunakan `--require-rpc` dalam skrip dan otomatisasi ketika layanan yang mendengarkan saja tidak cukup dan Anda juga memerlukan panggilan RPC cakupan-baca yang sehat.
    - `--deep` menambahkan pemindaian best-effort untuk instalasi launchd/systemd/schtasks tambahan. Ketika beberapa layanan mirip gateway terdeteksi, keluaran manusia mencetak petunjuk pembersihan dan memperingatkan bahwa sebagian besar penyiapan sebaiknya menjalankan satu Gateway per mesin.
    - `--deep` juga melaporkan handoff restart supervisor Gateway terbaru ketika proses layanan keluar dengan bersih untuk restart supervisor eksternal.
    - `--deep` menjalankan validasi konfigurasi dalam mode sadar-plugin (`pluginValidation: "full"`) dan menampilkan peringatan manifes plugin yang dikonfigurasi (misalnya metadata konfigurasi channel yang hilang) sehingga pemeriksaan smoke instalasi dan pembaruan menangkapnya. `gateway status` default mempertahankan jalur read-only cepat yang melewati validasi plugin.
    - Keluaran manusia menyertakan path log file yang terselesaikan plus snapshot path/validitas konfigurasi CLI-vs-layanan untuk membantu mendiagnosis drift profil atau state-dir.

  </Accordion>
  <Accordion title="Pemeriksaan drift autentikasi systemd Linux">
    - Pada instalasi systemd Linux, pemeriksaan drift autentikasi layanan membaca nilai `Environment=` dan `EnvironmentFile=` dari unit (termasuk `%h`, path yang dikutip, beberapa file, dan file opsional `-`).
    - Pemeriksaan drift menyelesaikan SecretRefs `gateway.auth.token` menggunakan env runtime gabungan (env perintah layanan terlebih dahulu, lalu fallback env proses).
    - Jika autentikasi token tidak aktif secara efektif (`gateway.auth.mode` eksplisit berupa `password`/`none`/`trusted-proxy`, atau mode tidak disetel saat kata sandi dapat menang dan tidak ada kandidat token yang dapat menang), pemeriksaan token-drift melewati penyelesaian token konfigurasi.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` adalah perintah "debug semuanya". Perintah ini selalu memprobe:

- gateway remote yang Anda konfigurasi (jika disetel), dan
- localhost (loopback) **bahkan jika remote dikonfigurasi**.

Jika Anda meneruskan `--url`, target eksplisit tersebut ditambahkan sebelum keduanya. Keluaran manusia melabeli target sebagai:

- `URL (explicit)`
- `Remote (configured)` atau `Remote (configured, inactive)`
- `Local loopback`

<Note>
Jika beberapa gateway dapat dijangkau, perintah ini mencetak semuanya. Beberapa gateway didukung ketika Anda menggunakan profil/port terisolasi (misalnya, bot penyelamat), tetapi sebagian besar instalasi tetap menjalankan satu gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretasi">
    - `Reachable: yes` berarti setidaknya satu target menerima koneksi WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` melaporkan apa yang dapat dibuktikan probe tentang autentikasi. Ini terpisah dari keterjangkauan.
    - `Read probe: ok` berarti panggilan RPC detail cakupan-baca (`health`/`status`/`system-presence`/`config.get`) juga berhasil.
    - `Read probe: limited - missing scope: operator.read` berarti koneksi berhasil tetapi RPC cakupan-baca terbatas. Ini dilaporkan sebagai keterjangkauan **terdegradasi**, bukan kegagalan penuh.
    - `Read probe: failed` setelah `Connect: ok` berarti Gateway menerima koneksi WebSocket, tetapi diagnostik baca lanjutan kehabisan waktu atau gagal. Ini juga merupakan keterjangkauan **terdegradasi**, bukan Gateway yang tidak dapat dijangkau.
    - Seperti `gateway status`, probe menggunakan ulang autentikasi perangkat yang sudah ada di cache tetapi tidak membuat identitas perangkat pertama kali atau status pemasangan.
    - Exit code bernilai non-zero hanya ketika tidak ada target yang diprobe yang dapat dijangkau.

  </Accordion>
  <Accordion title="Keluaran JSON">
    Tingkat atas:

    - `ok`: setidaknya satu target dapat dijangkau.
    - `degraded`: setidaknya satu target menerima koneksi tetapi tidak menyelesaikan diagnostik RPC detail penuh.
    - `capability`: kapabilitas terbaik yang terlihat di seluruh target yang dapat dijangkau (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, atau `unknown`).
    - `primaryTargetId`: target terbaik untuk diperlakukan sebagai pemenang aktif dalam urutan ini: URL eksplisit, tunnel SSH, remote yang dikonfigurasi, lalu local loopback.
    - `warnings[]`: catatan peringatan best-effort dengan `code`, `message`, dan `targetIds` opsional.
    - `network`: petunjuk URL local loopback/tailnet yang diturunkan dari konfigurasi saat ini dan jaringan host.
    - `discovery.timeoutMs` dan `discovery.count`: anggaran/jumlah hasil discovery aktual yang digunakan untuk lintasan probe ini.

    Per target (`targets[].connect`):

    - `ok`: keterjangkauan setelah koneksi + klasifikasi terdegradasi.
    - `rpcOk`: keberhasilan RPC detail penuh.
    - `scopeLimited`: RPC detail gagal karena cakupan operator yang hilang.

    Per target (`targets[].auth`):

    - `role`: peran autentikasi yang dilaporkan dalam `hello-ok` jika tersedia.
    - `scopes`: cakupan yang diberikan yang dilaporkan dalam `hello-ok` jika tersedia.
    - `capability`: klasifikasi kapabilitas autentikasi yang ditampilkan untuk target tersebut.

  </Accordion>
  <Accordion title="Kode peringatan umum">
    - `ssh_tunnel_failed`: penyiapan tunnel SSH gagal; perintah beralih kembali ke probe langsung.
    - `multiple_gateways`: lebih dari satu target dapat dijangkau; ini tidak biasa kecuali Anda sengaja menjalankan profil terisolasi, seperti bot penyelamat.
    - `auth_secretref_unresolved`: SecretRef autentikasi yang dikonfigurasi tidak dapat diselesaikan untuk target yang gagal.
    - `probe_scope_limited`: koneksi WebSocket berhasil, tetapi probe baca dibatasi oleh `operator.read` yang hilang.

  </Accordion>
</AccordionGroup>

#### Remote lewat SSH (paritas app Mac)

Mode "Remote over SSH" app macOS menggunakan port-forward lokal sehingga gateway remote (yang mungkin hanya terikat ke loopback) menjadi dapat dijangkau di `ws://127.0.0.1:<port>`.

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
  Pilih host gateway pertama yang ditemukan sebagai target SSH dari endpoint discovery yang terselesaikan (`local.` plus domain wide-area yang dikonfigurasi, jika ada). Petunjuk TXT-only diabaikan.
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
  Anggaran batas waktu.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Terutama untuk RPC bergaya agen yang men-stream event perantara sebelum payload final.
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

Gunakan `--wrapper` ketika layanan terkelola harus dimulai melalui executable lain, misalnya shim
pengelola secret atau helper run-as. Wrapper menerima argumen Gateway normal dan
bertanggung jawab untuk pada akhirnya mengeksekusi `openclaw` atau Node dengan argumen tersebut.

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

Anda juga dapat menyetel wrapper melalui environment. `gateway install` memvalidasi bahwa path adalah
file executable, menulis wrapper ke `ProgramArguments` layanan, dan menyimpan
`OPENCLAW_WRAPPER` di environment layanan untuk reinstall paksa, pembaruan, dan perbaikan doctor
berikutnya.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Untuk menghapus wrapper yang disimpan, kosongkan `OPENCLAW_WRAPPER` saat menginstal ulang:

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
    - Gunakan `gateway restart` untuk memulai ulang layanan terkelola. Jangan merangkai `gateway stop` dan `gateway start` sebagai pengganti mulai ulang.
    - Di macOS, `gateway stop` menggunakan `launchctl bootout` secara default, yang menghapus LaunchAgent dari sesi boot saat ini tanpa menyimpan penonaktifan — pemulihan otomatis KeepAlive tetap aktif untuk crash berikutnya dan `gateway start` mengaktifkan ulang dengan bersih tanpa `launchctl enable` manual. Berikan `--disable` untuk menekan KeepAlive dan RunAtLoad secara persisten agar gateway tidak muncul kembali sampai `gateway start` eksplisit berikutnya; gunakan ini saat penghentian manual harus bertahan melewati reboot atau mulai ulang sistem.
    - `gateway restart --safe` meminta Gateway yang berjalan untuk melakukan preflight pekerjaan OpenClaw aktif dan menunda mulai ulang sampai pengiriman balasan, run tertanam, dan run tugas selesai dikosongkan. `--safe` tidak dapat digabungkan dengan `--force` atau `--wait`.
    - `gateway restart --wait 30s` menimpa anggaran drain mulai ulang yang dikonfigurasi untuk mulai ulang tersebut. Angka polos adalah milidetik; unit seperti `s`, `m`, dan `h` diterima. `--wait 0` menunggu tanpa batas.
    - `gateway restart --safe --skip-deferral` menjalankan mulai ulang aman yang sadar OpenClaw tetapi melewati gerbang penundaan sehingga Gateway memancarkan mulai ulang segera meskipun pemblokir dilaporkan. Pintu keluar operator untuk penundaan run tugas yang macet; memerlukan `--safe`.
    - `gateway restart --force` melewati drain pekerjaan aktif dan memulai ulang segera. Gunakan saat operator sudah memeriksa pemblokir tugas yang tercantum dan ingin gateway kembali sekarang.
    - Perintah siklus hidup menerima `--json` untuk scripting.

  </Accordion>
  <Accordion title="Autentikasi dan SecretRefs pada waktu instalasi">
    - Saat autentikasi token memerlukan token dan `gateway.auth.token` dikelola SecretRef, `gateway install` memvalidasi bahwa SecretRef dapat di-resolve tetapi tidak menyimpan token yang di-resolve ke metadata lingkungan layanan.
    - Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi tidak ter-resolve, instalasi gagal tertutup alih-alih menyimpan plaintext fallback.
    - Untuk autentikasi kata sandi pada `gateway run`, pilih `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, atau `gateway.auth.password` yang didukung SecretRef daripada `--password` inline.
    - Dalam mode autentikasi tersimpul, `OPENCLAW_GATEWAY_PASSWORD` yang hanya ada di shell tidak melonggarkan persyaratan token instalasi; gunakan konfigurasi tahan lama (`gateway.auth.password` atau config `env`) saat menginstal layanan terkelola.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum diatur, instalasi diblokir sampai mode diatur secara eksplisit.

  </Accordion>
</AccordionGroup>

## Temukan gateway (Bonjour)

`gateway discover` memindai beacon Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): pilih domain (contoh: `openclaw.internal.`) dan siapkan split DNS + server DNS; lihat [Bonjour](/id/gateway/bonjour).

Hanya gateway dengan penemuan Bonjour yang diaktifkan (default) yang mengiklankan beacon.

Record penemuan wide-area dapat menyertakan petunjuk TXT ini:

- `role` (petunjuk peran gateway)
- `transport` (petunjuk transport, mis. `gateway`)
- `gatewayPort` (port WebSocket, biasanya `18789`)
- `sshPort` (hanya mode penemuan penuh; klien menetapkan default target SSH ke `22` saat ini tidak ada)
- `tailnetDns` (hostname MagicDNS, bila tersedia)
- `gatewayTls` / `gatewayTlsSha256` (TLS diaktifkan + fingerprint sertifikat)
- `cliPath` (hanya mode penemuan penuh)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Timeout per perintah (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Output yang dapat dibaca mesin (juga menonaktifkan gaya/spinner).
</ParamField>

Contoh:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI memindai `local.` ditambah domain wide-area yang dikonfigurasi saat ada yang diaktifkan.
- `wsUrl` dalam output JSON diturunkan dari endpoint layanan yang di-resolve, bukan dari petunjuk khusus TXT seperti `lanHost` atau `tailnetDns`.
- Pada mDNS `local.` dan DNS-SD wide-area, `sshPort` dan `cliPath` hanya dipublikasikan saat `discovery.mdns.mode` adalah `full`.

</Note>

## Terkait

- [Referensi CLI](/id/cli)
- [Runbook Gateway](/id/gateway)
