---
read_when:
    - Menjalankan Gateway dari CLI (pengembangan atau server)
    - Melakukan debug pada autentikasi Gateway, mode bind, dan konektivitas
    - Menemukan Gateway melalui Bonjour (DNS-SD lokal + area luas)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — jalankan, kueri, dan temukan Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-01T09:22:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 127a6ccb4baa1ad5e5051db0bc7ef0ed30d410c4c3d13f36356483a6e03dce4c
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
    - `openclaw onboard --mode local` dan `openclaw setup` diharapkan menulis `gateway.mode=local`. Jika file ada tetapi `gateway.mode` hilang, perlakukan itu sebagai konfigurasi yang rusak atau tertimpa dan perbaiki, bukan mengasumsikan mode lokal secara implisit.
    - Jika file ada dan `gateway.mode` hilang, Gateway memperlakukan itu sebagai kerusakan konfigurasi yang mencurigakan dan menolak untuk "menebak lokal" untuk Anda.
    - Pengikatan di luar loopback tanpa autentikasi diblokir (pagar pengaman keselamatan).
    - `SIGUSR1` memicu restart dalam proses saat diotorisasi (`commands.restart` diaktifkan secara default; atur `commands.restart: false` untuk memblokir restart manual, sementara penerapan/pembaruan alat/konfigurasi gateway tetap diizinkan).
    - Handler `SIGINT`/`SIGTERM` menghentikan proses gateway, tetapi tidak memulihkan status terminal khusus apa pun. Jika Anda membungkus CLI dengan TUI atau input mode mentah, pulihkan terminal sebelum keluar.

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
  Baca kata sandi gateway dari file.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Ekspos Gateway melalui Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Reset konfigurasi serve/funnel Tailscale saat shutdown.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Izinkan gateway dimulai tanpa `gateway.mode=local` dalam konfigurasi. Hanya melewati penjaga startup untuk bootstrap ad-hoc/dev; tidak menulis atau memperbaiki file konfigurasi.
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
  Catat event stream model mentah ke jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Jalur jsonl stream mentah.
</ParamField>

<Warning>
`--password` inline dapat terekspos dalam daftar proses lokal. Lebih baik gunakan `--password-file`, env, atau `gateway.auth.password` yang didukung SecretRef.
</Warning>

### Profiling startup

- Atur `OPENCLAW_GATEWAY_STARTUP_TRACE=1` untuk mencatat timing fase selama startup Gateway, termasuk penundaan `eventLoopMax` per fase dan timing tabel pencarian plugin untuk indeks terpasang, registri manifes, perencanaan startup, dan pekerjaan owner-map.
- Atur `OPENCLAW_DIAGNOSTICS=timeline` dengan `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` untuk menulis timeline diagnostik startup JSONL best-effort bagi harness QA eksternal. Anda juga dapat mengaktifkan flag dengan `diagnostics.flags: ["timeline"]` dalam konfigurasi; jalurnya tetap disediakan env. Tambahkan `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` untuk menyertakan sampel event-loop.
- Jalankan `pnpm test:startup:gateway -- --runs 5 --warmup 1` untuk melakukan benchmark startup Gateway. Benchmark merekam output proses pertama, `/healthz`, `/readyz`, timing trace startup, penundaan event-loop, dan detail timing tabel pencarian plugin.

## Kueri Gateway yang berjalan

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
Saat Anda mengatur `--url`, CLI tidak melakukan fallback ke kredensial konfigurasi atau lingkungan. Teruskan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang hilang adalah error.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Endpoint HTTP `/healthz` adalah probe liveness: endpoint ini mengembalikan respons setelah server dapat menjawab HTTP. Endpoint HTTP `/readyz` lebih ketat dan tetap merah saat dependensi runtime plugin startup, sidecar, saluran, atau hook yang dikonfigurasi masih dalam proses stabilisasi. Respons readiness mendetail lokal atau terautentikasi menyertakan blok diagnostik `eventLoop` dengan penundaan event-loop, utilisasi event-loop, rasio inti CPU, dan flag `degraded`.

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
  Filter berdasarkan tipe event diagnostik, seperti `payload.large` atau `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Sertakan hanya event setelah nomor urut diagnostik.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Baca bundel stabilitas tersimpan alih-alih memanggil Gateway yang berjalan. Gunakan `--bundle latest` (atau cukup `--bundle`) untuk bundel terbaru di bawah direktori status, atau teruskan jalur JSON bundel secara langsung.
</ParamField>
<ParamField path="--export" type="boolean">
  Tulis zip diagnostik dukungan yang dapat dibagikan alih-alih mencetak detail stabilitas.
</ParamField>
<ParamField path="--output <path>" type="string">
  Jalur output untuk `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Perilaku privasi dan bundel">
    - Rekaman menyimpan metadata operasional: nama event, jumlah, ukuran byte, pembacaan memori, status antrean/sesi, nama saluran/plugin, dan ringkasan sesi yang disunting. Rekaman tidak menyimpan teks chat, isi webhook, output alat, isi permintaan atau respons mentah, token, cookie, nilai rahasia, hostname, atau id sesi mentah. Atur `diagnostics.enabled: false` untuk menonaktifkan perekam sepenuhnya.
    - Saat Gateway keluar fatal, timeout shutdown, dan kegagalan startup restart, OpenClaw menulis snapshot diagnostik yang sama ke `~/.openclaw/logs/stability/openclaw-stability-*.json` saat perekam memiliki event. Periksa bundel terbaru dengan `openclaw gateway stability --bundle latest`; `--limit`, `--type`, dan `--since-seq` juga berlaku untuk output bundel.

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
  Jalur zip output. Default ke ekspor dukungan di bawah direktori status.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Jumlah maksimum baris log tersanitasi yang disertakan.
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
  Kata sandi Gateway untuk snapshot health.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Timeout snapshot status/health.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Lewati pencarian bundel stabilitas tersimpan.
</ParamField>
<ParamField path="--json" type="boolean">
  Cetak jalur tertulis, ukuran, dan manifes sebagai JSON.
</ParamField>

Ekspor berisi manifes, ringkasan Markdown, bentuk konfigurasi, detail konfigurasi tersanitasi, ringkasan log tersanitasi, snapshot status/health Gateway tersanitasi, dan bundel stabilitas terbaru jika ada.

Ini dimaksudkan untuk dibagikan. Ekspor menyimpan detail operasional yang membantu debugging, seperti field log OpenClaw yang aman, nama subsistem, kode status, durasi, mode yang dikonfigurasi, port, id plugin, id penyedia, pengaturan fitur non-rahasia, dan pesan log operasional yang disunting. Ekspor menghilangkan atau menyunting teks chat, isi webhook, output alat, kredensial, cookie, pengenal akun/pesan, teks prompt/instruksi, hostname, dan nilai rahasia. Saat pesan bergaya LogTape tampak seperti teks payload pengguna/chat/alat, ekspor hanya menyimpan bahwa sebuah pesan dihilangkan beserta jumlah byte-nya.

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
  Timeout probe.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Lewati probe konektivitas (tampilan hanya layanan).
</ParamField>
<ParamField path="--deep" type="boolean">
  Pindai juga layanan tingkat sistem.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Tingkatkan probe konektivitas default menjadi probe baca dan keluar non-zero saat probe baca tersebut gagal. Tidak dapat digabungkan dengan `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantik status">
    - `gateway status` tetap tersedia untuk diagnostik meskipun konfigurasi CLI lokal hilang atau tidak valid.
    - `gateway status` default membuktikan status layanan, koneksi WebSocket, dan kapabilitas auth yang terlihat pada waktu handshake. Ini tidak membuktikan operasi baca/tulis/admin.
    - Probe diagnostik tidak melakukan mutasi untuk auth perangkat pertama kali: probe menggunakan ulang token perangkat cache yang sudah ada jika tersedia, tetapi tidak membuat identitas perangkat CLI baru atau catatan pairing perangkat read-only hanya untuk memeriksa status.
    - `gateway status` menyelesaikan SecretRef auth yang dikonfigurasi untuk auth probe jika memungkinkan.
    - Jika SecretRef auth yang diperlukan tidak terselesaikan pada jalur perintah ini, `gateway status --json` melaporkan `rpc.authWarning` ketika konektivitas/auth probe gagal; berikan `--token`/`--password` secara eksplisit atau selesaikan sumber rahasia terlebih dahulu.
    - Jika probe berhasil, peringatan auth-ref yang tidak terselesaikan ditekan untuk menghindari positif palsu.
    - Gunakan `--require-rpc` dalam skrip dan otomasi ketika layanan yang mendengarkan saja tidak cukup dan Anda juga membutuhkan panggilan RPC cakupan baca yang sehat.
    - `--deep` menambahkan pemindaian upaya terbaik untuk instalasi launchd/systemd/schtasks tambahan. Ketika beberapa layanan mirip Gateway terdeteksi, keluaran manusia mencetak petunjuk pembersihan dan memperingatkan bahwa sebagian besar setup sebaiknya menjalankan satu Gateway per mesin.
    - Keluaran manusia menyertakan jalur log file yang terselesaikan serta snapshot jalur/validitas konfigurasi CLI-vs-service untuk membantu mendiagnosis drift profil atau state-dir.

  </Accordion>
  <Accordion title="Pemeriksaan drift auth systemd Linux">
    - Pada instalasi systemd Linux, pemeriksaan drift auth layanan membaca nilai `Environment=` dan `EnvironmentFile=` dari unit (termasuk `%h`, jalur yang dikutip, beberapa file, dan file `-` opsional).
    - Pemeriksaan drift menyelesaikan SecretRef `gateway.auth.token` menggunakan env runtime gabungan (env perintah layanan terlebih dahulu, lalu fallback env proses).
    - Jika auth token tidak aktif secara efektif (`gateway.auth.mode` eksplisit berupa `password`/`none`/`trusted-proxy`, atau mode belum disetel ketika password dapat menang dan tidak ada kandidat token yang dapat menang), pemeriksaan token-drift melewati penyelesaian token konfigurasi.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` adalah perintah "debug semuanya". Perintah ini selalu mem-probe:

- Gateway jarak jauh Anda yang dikonfigurasi (jika disetel), dan
- localhost (loopback) **meskipun remote dikonfigurasi**.

Jika Anda memberikan `--url`, target eksplisit tersebut ditambahkan sebelum keduanya. Keluaran manusia memberi label target sebagai:

- `URL (explicit)`
- `Remote (configured)` atau `Remote (configured, inactive)`
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
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` melaporkan apa yang dapat dibuktikan probe tentang auth. Ini terpisah dari keterjangkauan.
    - `Read probe: ok` berarti panggilan RPC detail cakupan baca (`health`/`status`/`system-presence`/`config.get`) juga berhasil.
    - `Read probe: limited - missing scope: operator.read` berarti koneksi berhasil tetapi RPC cakupan baca terbatas. Ini dilaporkan sebagai keterjangkauan **terdegradasi**, bukan kegagalan penuh.
    - `Read probe: failed` setelah `Connect: ok` berarti Gateway menerima koneksi WebSocket, tetapi diagnostik baca lanjutan timeout atau gagal. Ini juga merupakan keterjangkauan **terdegradasi**, bukan Gateway yang tidak dapat dijangkau.
    - Seperti `gateway status`, probe menggunakan ulang auth perangkat cache yang sudah ada tetapi tidak membuat identitas perangkat pertama kali atau status pairing.
    - Kode keluar non-nol hanya ketika tidak ada target yang di-probe dapat dijangkau.

  </Accordion>
  <Accordion title="Keluaran JSON">
    Level atas:

    - `ok`: setidaknya satu target dapat dijangkau.
    - `degraded`: setidaknya satu target menerima koneksi tetapi tidak menyelesaikan diagnostik RPC detail penuh.
    - `capability`: kapabilitas terbaik yang terlihat di seluruh target yang dapat dijangkau (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, atau `unknown`).
    - `primaryTargetId`: target terbaik untuk diperlakukan sebagai pemenang aktif dalam urutan ini: URL eksplisit, tunnel SSH, remote yang dikonfigurasi, lalu local loopback.
    - `warnings[]`: catatan peringatan upaya terbaik dengan `code`, `message`, dan `targetIds` opsional.
    - `network`: petunjuk URL local loopback/tailnet yang diturunkan dari konfigurasi saat ini dan jaringan host.
    - `discovery.timeoutMs` dan `discovery.count`: anggaran/jumlah hasil discovery aktual yang digunakan untuk pass probe ini.

    Per target (`targets[].connect`):

    - `ok`: keterjangkauan setelah koneksi + klasifikasi terdegradasi.
    - `rpcOk`: keberhasilan RPC detail penuh.
    - `scopeLimited`: RPC detail gagal karena cakupan operator hilang.

    Per target (`targets[].auth`):

    - `role`: peran auth yang dilaporkan di `hello-ok` jika tersedia.
    - `scopes`: cakupan yang diberikan dan dilaporkan di `hello-ok` jika tersedia.
    - `capability`: klasifikasi kapabilitas auth yang ditampilkan untuk target tersebut.

  </Accordion>
  <Accordion title="Kode peringatan umum">
    - `ssh_tunnel_failed`: setup tunnel SSH gagal; perintah fallback ke probe langsung.
    - `multiple_gateways`: lebih dari satu target dapat dijangkau; ini tidak biasa kecuali Anda sengaja menjalankan profil terisolasi, seperti bot penyelamat.
    - `auth_secretref_unresolved`: SecretRef auth yang dikonfigurasi tidak dapat diselesaikan untuk target yang gagal.
    - `probe_scope_limited`: koneksi WebSocket berhasil, tetapi probe baca dibatasi oleh `operator.read` yang hilang.

  </Accordion>
</AccordionGroup>

#### Remote melalui SSH (paritas aplikasi Mac)

Mode "Remote over SSH" aplikasi macOS menggunakan port-forward lokal sehingga Gateway jarak jauh (yang mungkin hanya terikat ke loopback) dapat dijangkau di `ws://127.0.0.1:<port>`.

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
  Pilih host Gateway pertama yang ditemukan sebagai target SSH dari endpoint discovery yang terselesaikan (`local.` plus domain wide-area yang dikonfigurasi, jika ada). Petunjuk TXT-only diabaikan.
</ParamField>

Konfigurasi (opsional, digunakan sebagai default):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Helper RPC level rendah.

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
  Terutama untuk RPC gaya agen yang melakukan stream event perantara sebelum payload final.
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
secrets manager atau helper run-as. Wrapper menerima arg Gateway normal dan
bertanggung jawab untuk akhirnya menjalankan exec `openclaw` atau Node dengan arg tersebut.

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
`OPENCLAW_WRAPPER` di environment layanan untuk reinstall paksa, pembaruan, dan perbaikan doctor
berikutnya.

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
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="Perilaku siklus hidup">
    - Gunakan `gateway restart` untuk memulai ulang layanan terkelola. Jangan merantai `gateway stop` dan `gateway start` sebagai pengganti restart; di macOS, `gateway stop` secara sengaja menonaktifkan LaunchAgent sebelum menghentikannya.
    - Perintah siklus hidup menerima `--json` untuk scripting.

  </Accordion>
  <Accordion title="Auth dan SecretRefs pada waktu instalasi">
    - Ketika auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, `gateway install` memvalidasi bahwa SecretRef dapat diselesaikan tetapi tidak mempertahankan token yang terselesaikan ke metadata environment layanan.
    - Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi tidak terselesaikan, instalasi gagal tertutup alih-alih mempertahankan plaintext fallback.
    - Untuk auth password pada `gateway run`, prioritaskan `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, atau `gateway.auth.password` yang didukung SecretRef daripada `--password` inline.
    - Dalam mode auth terinferensi, `OPENCLAW_GATEWAY_PASSWORD` yang hanya shell tidak melonggarkan persyaratan token instalasi; gunakan konfigurasi tahan lama (`gateway.auth.password` atau config `env`) saat menginstal layanan terkelola.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum disetel, instalasi diblokir hingga mode disetel secara eksplisit.

  </Accordion>
</AccordionGroup>

## Temukan Gateway (Bonjour)

`gateway discover` memindai beacon Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): pilih domain (contoh: `openclaw.internal.`) dan siapkan split DNS + server DNS; lihat [Bonjour](/id/gateway/bonjour).

Hanya Gateway dengan discovery Bonjour diaktifkan (default) yang mengiklankan beacon.

Catatan discovery Wide-Area menyertakan (TXT):

- `role` (petunjuk peran Gateway)
- `transport` (petunjuk transport, mis. `gateway`)
- `gatewayPort` (port WebSocket, biasanya `18789`)
- `sshPort` (opsional; klien menetapkan default target SSH ke `22` ketika tidak ada)
- `tailnetDns` (hostname MagicDNS, ketika tersedia)
- `gatewayTls` / `gatewayTlsSha256` (TLS diaktifkan + fingerprint sertifikat)
- `cliPath` (petunjuk instalasi remote yang ditulis ke zona wide-area)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Timeout per perintah (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Keluaran yang dapat dibaca mesin (juga menonaktifkan styling/spinner).
</ParamField>

Contoh:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI memindai `local.` ditambah domain area luas yang dikonfigurasi saat diaktifkan.
- `wsUrl` dalam output JSON berasal dari endpoint layanan yang diselesaikan, bukan dari petunjuk khusus TXT seperti `lanHost` atau `tailnetDns`.
- Pada mDNS `local.`, `sshPort` dan `cliPath` hanya disiarkan saat `discovery.mdns.mode` bernilai `full`. DNS-SD area luas tetap menulis `cliPath`; `sshPort` juga tetap opsional di sana.

</Note>

## Terkait

- [Referensi CLI](/id/cli)
- [Runbook Gateway](/id/gateway)
