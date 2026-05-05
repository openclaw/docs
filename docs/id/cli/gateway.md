---
read_when:
    - Menjalankan Gateway dari CLI (pengembangan atau server)
    - Mendiagnosis autentikasi Gateway, mode pengikatan, dan konektivitas
    - Menemukan Gateway melalui Bonjour (DNS-SD lokal + area luas)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — jalankan, kueri, dan temukan Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-05T01:44:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 521558189b150b2faa22f95ec32419ac9e02c5f47c72b9095f40d1432840c038
    source_path: cli/gateway.md
    workflow: 16
---

Gateway adalah server WebSocket OpenClaw (saluran, node, sesi, hook). Subperintah di halaman ini berada di bawah `openclaw gateway …`.

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

Alias latar depan:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Perilaku startup">
    - Secara default, Gateway menolak untuk dimulai kecuali `gateway.mode=local` diatur di `~/.openclaw/openclaw.json`. Gunakan `--allow-unconfigured` untuk eksekusi ad-hoc/dev.
    - `openclaw onboard --mode local` dan `openclaw setup` diharapkan menulis `gateway.mode=local`. Jika file ada tetapi `gateway.mode` hilang, anggap itu sebagai konfigurasi yang rusak atau tertimpa dan perbaiki, bukan mengasumsikan mode lokal secara implisit.
    - Jika file ada dan `gateway.mode` hilang, Gateway menganggapnya sebagai kerusakan konfigurasi yang mencurigakan dan menolak untuk "menebak lokal" untuk Anda.
    - Pengikatan di luar loopback tanpa autentikasi diblokir (pagar pengaman).
    - `SIGUSR1` memicu restart dalam proses saat diotorisasi (`commands.restart` diaktifkan secara default; atur `commands.restart: false` untuk memblokir restart manual, sementara penerapan/pembaruan tool/config gateway tetap diizinkan).
    - Handler `SIGINT`/`SIGTERM` menghentikan proses gateway, tetapi tidak memulihkan status terminal kustom apa pun. Jika Anda membungkus CLI dengan TUI atau input mode raw, pulihkan terminal sebelum keluar.

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
  Reset config serve/funnel Tailscale saat shutdown.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Izinkan gateway dimulai tanpa `gateway.mode=local` dalam config. Hanya melewati pelindung startup untuk bootstrap ad-hoc/dev; tidak menulis atau memperbaiki file config.
</ParamField>
<ParamField path="--dev" type="boolean">
  Buat config dev + workspace jika belum ada (melewati BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Reset config dev + kredensial + sesi + workspace (memerlukan `--dev`).
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
  Path jsonl stream raw.
</ParamField>

## Restart Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` meminta Gateway yang sedang berjalan untuk melakukan preflight pada pekerjaan OpenClaw aktif sebelum restart. Jika operasi antrean, pengiriman balasan, eksekusi tertanam, atau eksekusi tugas aktif, Gateway melaporkan pemblokir, menggabungkan permintaan restart aman duplikat, dan restart setelah pekerjaan aktif selesai. `restart` biasa mempertahankan perilaku service-manager yang sudah ada untuk kompatibilitas. Gunakan `--force` hanya saat Anda secara eksplisit menginginkan jalur override langsung.

<Warning>
`--password` inline dapat terekspos dalam daftar proses lokal. Utamakan `--password-file`, env, atau `gateway.auth.password` berbasis SecretRef.
</Warning>

### Profiling startup

- Atur `OPENCLAW_GATEWAY_STARTUP_TRACE=1` untuk mencatat timing fase selama startup Gateway, termasuk delay `eventLoopMax` per fase dan timing tabel lookup Plugin untuk installed-index, registry manifest, perencanaan startup, dan pekerjaan owner-map.
- Atur `OPENCLAW_DIAGNOSTICS=timeline` dengan `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` untuk menulis timeline diagnostik startup JSONL best-effort bagi harness QA eksternal. Anda juga dapat mengaktifkan flag dengan `diagnostics.flags: ["timeline"]` di config; path tetap disediakan lewat env. Tambahkan `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` untuk menyertakan sampel event-loop.
- Jalankan `pnpm test:startup:gateway -- --runs 5 --warmup 1` untuk membenchmark startup Gateway. Benchmark merekam output proses pertama, `/healthz`, `/readyz`, timing trace startup, delay event-loop, dan detail timing tabel lookup Plugin.

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
    - `--token <token>`: token Gateway.
    - `--password <password>`: kata sandi Gateway.
    - `--timeout <ms>`: timeout/anggaran (bervariasi per perintah).
    - `--expect-final`: tunggu respons "final" (panggilan agen).

  </Tab>
</Tabs>

<Note>
Saat Anda mengatur `--url`, CLI tidak fallback ke kredensial config atau environment. Berikan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang hilang adalah error.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Endpoint HTTP `/healthz` adalah probe liveness: endpoint ini mengembalikan respons begitu server dapat menjawab HTTP. Endpoint HTTP `/readyz` lebih ketat dan tetap merah saat sidecar Plugin startup, saluran, atau hook yang dikonfigurasi masih dalam proses stabil. Respons kesiapan detail lokal atau terautentikasi menyertakan blok diagnostik `eventLoop` dengan delay event-loop, utilisasi event-loop, rasio core CPU, dan flag `degraded`.

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
  Jumlah maksimum event terbaru yang disertakan (maks `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filter berdasarkan tipe event diagnostik, seperti `payload.large` atau `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Hanya sertakan event setelah nomor urut diagnostik.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Baca bundle stabilitas persisten alih-alih memanggil Gateway yang sedang berjalan. Gunakan `--bundle latest` (atau cukup `--bundle`) untuk bundle terbaru di bawah direktori state, atau berikan path JSON bundle secara langsung.
</ParamField>
<ParamField path="--export" type="boolean">
  Tulis zip diagnostik dukungan yang dapat dibagikan alih-alih mencetak detail stabilitas.
</ParamField>
<ParamField path="--output <path>" type="string">
  Path output untuk `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privasi dan perilaku bundle">
    - Rekaman menyimpan metadata operasional: nama event, hitungan, ukuran byte, pembacaan memori, status antrean/sesi, nama saluran/Plugin, dan ringkasan sesi yang disunting. Rekaman tidak menyimpan teks chat, body webhook, output tool, body request atau response raw, token, cookie, nilai rahasia, hostname, atau id sesi raw. Atur `diagnostics.enabled: false` untuk menonaktifkan perekam sepenuhnya.
    - Pada exit fatal Gateway, timeout shutdown, dan kegagalan startup restart, OpenClaw menulis snapshot diagnostik yang sama ke `~/.openclaw/logs/stability/openclaw-stability-*.json` saat perekam memiliki event. Periksa bundle terbaru dengan `openclaw gateway stability --bundle latest`; `--limit`, `--type`, dan `--since-seq` juga berlaku untuk output bundle.

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
  Jumlah maksimum baris log tersanitasi yang disertakan.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Jumlah maksimum byte log yang diperiksa.
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
  Lewati lookup bundle stabilitas persisten.
</ParamField>
<ParamField path="--json" type="boolean">
  Cetak path tertulis, ukuran, dan manifest sebagai JSON.
</ParamField>

Ekspor berisi manifest, ringkasan Markdown, bentuk config, detail config tersanitasi, ringkasan log tersanitasi, snapshot status/health Gateway tersanitasi, dan bundle stabilitas terbaru saat tersedia.

Ini dimaksudkan untuk dibagikan. Ekspor mempertahankan detail operasional yang membantu debugging, seperti field log OpenClaw yang aman, nama subsistem, kode status, durasi, mode yang dikonfigurasi, port, id Plugin, id provider, pengaturan fitur non-rahasia, dan pesan log operasional yang disunting. Ekspor menghilangkan atau menyunting teks chat, body webhook, output tool, kredensial, cookie, identifier akun/pesan, teks prompt/instruksi, hostname, dan nilai rahasia. Saat pesan bergaya LogTape terlihat seperti teks payload pengguna/chat/tool, ekspor hanya mempertahankan bahwa suatu pesan dihilangkan beserta jumlah byte-nya.

### `gateway status`

`gateway status` menampilkan layanan Gateway (launchd/systemd/schtasks) plus probe opsional untuk kapabilitas konektivitas/autentikasi.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Tambahkan target probe eksplisit. Remote yang dikonfigurasi + localhost tetap di-probe.
</ParamField>
<ParamField path="--token <token>" type="string">
  Autentikasi token untuk probe.
</ParamField>
<ParamField path="--password <password>" type="string">
  Autentikasi kata sandi untuk probe.
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
  Tingkatkan probe konektivitas default menjadi probe baca dan keluar dengan nilai non-zero ketika probe baca itu gagal. Tidak dapat digabungkan dengan `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantik status">
    - `gateway status` tetap tersedia untuk diagnostik meskipun konfigurasi CLI lokal hilang atau tidak valid.
    - `gateway status` default membuktikan status layanan, koneksi WebSocket, dan kapabilitas autentikasi yang terlihat pada waktu handshake. Ini tidak membuktikan operasi baca/tulis/admin.
    - Probe diagnostik tidak melakukan mutasi untuk autentikasi perangkat pertama kali: probe menggunakan kembali token perangkat yang sudah di-cache jika ada, tetapi tidak membuat identitas perangkat CLI baru atau catatan pairing perangkat read-only hanya untuk memeriksa status.
    - `gateway status` menyelesaikan SecretRefs autentikasi yang dikonfigurasi untuk autentikasi probe bila memungkinkan.
    - Jika SecretRef autentikasi yang diperlukan tidak terselesaikan di jalur perintah ini, `gateway status --json` melaporkan `rpc.authWarning` ketika konektivitas/autentikasi probe gagal; berikan `--token`/`--password` secara eksplisit atau selesaikan sumber secret terlebih dahulu.
    - Jika probe berhasil, peringatan auth-ref yang tidak terselesaikan disembunyikan untuk menghindari false positive.
    - Gunakan `--require-rpc` di skrip dan otomatisasi ketika layanan yang listening saja tidak cukup dan Anda juga perlu panggilan RPC cakupan baca dalam kondisi sehat.
    - `--deep` menambahkan pemindaian best-effort untuk instalasi launchd/systemd/schtasks tambahan. Ketika beberapa layanan mirip Gateway terdeteksi, output manusia mencetak petunjuk pembersihan dan memperingatkan bahwa sebagian besar setup sebaiknya menjalankan satu Gateway per mesin.
    - Output manusia menyertakan path log file yang terselesaikan plus snapshot path/validitas konfigurasi CLI-vs-layanan untuk membantu mendiagnosis drift profil atau state-dir.

  </Accordion>
  <Accordion title="Pemeriksaan auth-drift Linux systemd">
    - Pada instalasi Linux systemd, pemeriksaan drift autentikasi layanan membaca nilai `Environment=` dan `EnvironmentFile=` dari unit (termasuk `%h`, path yang dikutip, beberapa file, dan file opsional `-`).
    - Pemeriksaan drift menyelesaikan SecretRefs `gateway.auth.token` menggunakan env runtime gabungan (env perintah layanan terlebih dahulu, lalu fallback env proses).
    - Jika autentikasi token tidak aktif secara efektif (`gateway.auth.mode` eksplisit berupa `password`/`none`/`trusted-proxy`, atau mode tidak disetel ketika kata sandi dapat menang dan tidak ada kandidat token yang dapat menang), pemeriksaan token-drift melewati resolusi token konfigurasi.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` adalah perintah "debug semuanya". Perintah ini selalu mem-probe:

- Gateway remote Anda yang dikonfigurasi (jika disetel), dan
- localhost (loopback) **meskipun remote dikonfigurasi**.

Jika Anda memberikan `--url`, target eksplisit itu ditambahkan di depan keduanya. Output manusia memberi label target sebagai:

- `URL (eksplisit)`
- `Remote (dikonfigurasi)` atau `Remote (dikonfigurasi, tidak aktif)`
- `Local loopback`

<Note>
Jika beberapa Gateway dapat dijangkau, perintah ini mencetak semuanya. Beberapa Gateway didukung ketika Anda menggunakan profil/port terisolasi (misalnya, bot penyelamat), tetapi sebagian besar instalasi tetap menjalankan satu Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretasi">
    - `Reachable: yes` berarti setidaknya satu target menerima koneksi WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` melaporkan apa yang dapat dibuktikan probe tentang autentikasi. Ini terpisah dari keterjangkauan.
    - `Read probe: ok` berarti panggilan RPC detail cakupan baca (`health`/`status`/`system-presence`/`config.get`) juga berhasil.
    - `Read probe: limited - missing scope: operator.read` berarti koneksi berhasil tetapi RPC cakupan baca terbatas. Ini dilaporkan sebagai keterjangkauan **terdegradasi**, bukan kegagalan penuh.
    - `Read probe: failed` setelah `Connect: ok` berarti Gateway menerima koneksi WebSocket, tetapi diagnostik baca lanjutan timeout atau gagal. Ini juga merupakan keterjangkauan **terdegradasi**, bukan Gateway yang tidak dapat dijangkau.
    - Seperti `gateway status`, probe menggunakan kembali autentikasi perangkat yang sudah di-cache tetapi tidak membuat identitas perangkat pertama kali atau status pairing.
    - Kode keluar bernilai non-zero hanya ketika tidak ada target yang di-probe yang dapat dijangkau.

  </Accordion>
  <Accordion title="Output JSON">
    Tingkat atas:

    - `ok`: setidaknya satu target dapat dijangkau.
    - `degraded`: setidaknya satu target menerima koneksi tetapi tidak menyelesaikan diagnostik RPC detail penuh.
    - `capability`: kapabilitas terbaik yang terlihat di seluruh target yang dapat dijangkau (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, atau `unknown`).
    - `primaryTargetId`: target terbaik untuk diperlakukan sebagai pemenang aktif dalam urutan ini: URL eksplisit, tunnel SSH, remote yang dikonfigurasi, lalu local loopback.
    - `warnings[]`: catatan peringatan best-effort dengan `code`, `message`, dan `targetIds` opsional.
    - `network`: petunjuk URL local loopback/tailnet yang diturunkan dari konfigurasi saat ini dan jaringan host.
    - `discovery.timeoutMs` dan `discovery.count`: anggaran discovery/jumlah hasil aktual yang digunakan untuk pass probe ini.

    Per target (`targets[].connect`):

    - `ok`: keterjangkauan setelah connect + klasifikasi terdegradasi.
    - `rpcOk`: keberhasilan RPC detail penuh.
    - `scopeLimited`: RPC detail gagal karena cakupan operator tidak ada.

    Per target (`targets[].auth`):

    - `role`: peran autentikasi yang dilaporkan dalam `hello-ok` bila tersedia.
    - `scopes`: cakupan yang diberikan yang dilaporkan dalam `hello-ok` bila tersedia.
    - `capability`: klasifikasi kapabilitas autentikasi yang ditampilkan untuk target tersebut.

  </Accordion>
  <Accordion title="Kode peringatan umum">
    - `ssh_tunnel_failed`: setup tunnel SSH gagal; perintah fallback ke probe langsung.
    - `multiple_gateways`: lebih dari satu target dapat dijangkau; ini tidak biasa kecuali Anda sengaja menjalankan profil terisolasi, seperti bot penyelamat.
    - `auth_secretref_unresolved`: SecretRef autentikasi yang dikonfigurasi tidak dapat diselesaikan untuk target yang gagal.
    - `probe_scope_limited`: koneksi WebSocket berhasil, tetapi probe baca dibatasi oleh `operator.read` yang tidak ada.

  </Accordion>
</AccordionGroup>

#### Remote melalui SSH (paritas aplikasi Mac)

Mode "Remote over SSH" aplikasi macOS menggunakan port-forward lokal sehingga Gateway remote (yang mungkin hanya terikat ke loopback) dapat dijangkau di `ws://127.0.0.1:<port>`.

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
  Pilih host Gateway pertama yang ditemukan sebagai target SSH dari endpoint discovery yang terselesaikan (`local.` plus domain wide-area yang dikonfigurasi, jika ada). Petunjuk khusus TXT diabaikan.
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
  Anggaran timeout.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Terutama untuk RPC bergaya agent yang melakukan stream event antara sebelum payload final.
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

Gunakan `--wrapper` ketika layanan terkelola harus dimulai melalui executable lain, misalnya shim pengelola secret atau helper run-as. Wrapper menerima argumen Gateway normal dan bertanggung jawab untuk pada akhirnya menjalankan exec `openclaw` atau Node dengan argumen tersebut.

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

Anda juga dapat menyetel wrapper melalui environment. `gateway install` memvalidasi bahwa path adalah file executable, menulis wrapper ke `ProgramArguments` layanan, dan mempertahankan `OPENCLAW_WRAPPER` di environment layanan untuk reinstall paksa, pembaruan, dan perbaikan doctor berikutnya.

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
    - `gateway restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="Perilaku siklus hidup">
    - Gunakan `gateway restart` untuk memulai ulang layanan terkelola. Jangan merangkai `gateway stop` dan `gateway start` sebagai pengganti restart; di macOS, `gateway stop` sengaja menonaktifkan LaunchAgent sebelum menghentikannya.
    - `gateway restart --safe` meminta Gateway yang sedang berjalan untuk melakukan preflight pekerjaan OpenClaw aktif dan menunda restart sampai pengiriman balasan, run tertanam, dan run tugas selesai. `--safe` tidak dapat digabungkan dengan `--force` atau `--wait`.
    - `gateway restart --wait 30s` mengesampingkan anggaran drain restart yang dikonfigurasi untuk restart tersebut. Angka tanpa satuan berarti milidetik; satuan seperti `s`, `m`, dan `h` diterima. `--wait 0` menunggu tanpa batas waktu.
    - `gateway restart --force` melewati drain pekerjaan aktif dan langsung memulai ulang. Gunakan ini ketika operator sudah memeriksa blocker tugas yang terdaftar dan menginginkan Gateway kembali sekarang.
    - Perintah siklus hidup menerima `--json` untuk scripting.

  </Accordion>
  <Accordion title="Autentikasi dan SecretRefs saat instalasi">
    - Ketika autentikasi token memerlukan token dan `gateway.auth.token` dikelola SecretRef, `gateway install` memvalidasi bahwa SecretRef dapat di-resolve tetapi tidak menyimpan token yang sudah di-resolve ke metadata lingkungan layanan.
    - Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi belum ter-resolve, instalasi gagal secara tertutup alih-alih menyimpan fallback teks biasa.
    - Untuk autentikasi kata sandi pada `gateway run`, utamakan `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, atau `gateway.auth.password` berbasis SecretRef daripada `--password` inline.
    - Dalam mode autentikasi yang disimpulkan, `OPENCLAW_GATEWAY_PASSWORD` khusus shell tidak melonggarkan persyaratan token instalasi; gunakan konfigurasi tahan lama (`gateway.auth.password` atau `env` konfigurasi) saat menginstal layanan terkelola.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum ditetapkan, instalasi diblokir hingga mode ditetapkan secara eksplisit.

  </Accordion>
</AccordionGroup>

## Temukan gateway (Bonjour)

`gateway discover` memindai beacon Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Wide-Area Bonjour): pilih domain (contoh: `openclaw.internal.`) dan siapkan DNS terbagi + server DNS; lihat [Bonjour](/id/gateway/bonjour).

Hanya gateway dengan penemuan Bonjour yang diaktifkan (default) yang mengiklankan beacon.

Catatan penemuan Wide-Area mencakup (TXT):

- `role` (petunjuk peran gateway)
- `transport` (petunjuk transport, mis. `gateway`)
- `gatewayPort` (port WebSocket, biasanya `18789`)
- `sshPort` (opsional; klien menggunakan target SSH default `22` saat ini tidak ada)
- `tailnetDns` (nama host MagicDNS, jika tersedia)
- `gatewayTls` / `gatewayTlsSha256` (TLS diaktifkan + sidik jari sertifikat)
- `cliPath` (petunjuk instalasi jarak jauh yang ditulis ke zona wide-area)

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
- CLI memindai `local.` ditambah domain wide-area yang dikonfigurasi saat ada yang diaktifkan.
- `wsUrl` dalam output JSON diturunkan dari endpoint layanan yang di-resolve, bukan dari petunjuk khusus TXT seperti `lanHost` atau `tailnetDns`.
- Pada mDNS `local.`, `sshPort` dan `cliPath` hanya disiarkan saat `discovery.mdns.mode` adalah `full`. DNS-SD Wide-area tetap menulis `cliPath`; `sshPort` juga tetap opsional di sana.

</Note>

## Terkait

- [Referensi CLI](/id/cli)
- [Runbook Gateway](/id/gateway)
