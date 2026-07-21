---
read_when:
    - Menjalankan Gateway dari CLI (pengembangan atau server)
    - Men-debug autentikasi Gateway, mode bind, dan konektivitas
    - Menemukan Gateway melalui Bonjour (DNS-SD lokal + area luas)
    - Mengintegrasikan pengawas proses Gateway eksternal
sidebarTitle: Gateway
summary: CLI Gateway OpenClaw (`openclaw gateway`) — jalankan, kueri, dan temukan gateway
title: Gateway
x-i18n:
    generated_at: "2026-07-21T12:49:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0188d7c79571ebf8f350295775625533a83cb2eb909bcc8763e8ce81806d2214
    source_path: cli/gateway.md
    workflow: 16
---

Gateway adalah server WebSocket OpenClaw (saluran, node, sesi, hook). Semua subperintah di bawah ini berada di bawah `openclaw gateway ...`.

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

## Menjalankan Gateway

```bash
openclaw gateway
openclaw gateway run   # setara, bentuk eksplisit
```

<AccordionGroup>
  <Accordion title="Perilaku saat dimulai">
    - Menolak dimulai kecuali `gateway.mode=local` ditetapkan di `~/.openclaw/openclaw.json`. Gunakan `--allow-unconfigured` untuk proses ad hoc/pengembangan; opsi ini melewati pemeriksaan tanpa menulis atau memperbaiki konfigurasi.
    - Saat proses awal menemukan konfigurasi tidak valid yang dapat diperbaiki, terminal interaktif menawarkan untuk menjalankan `openclaw doctor --fix` dan mencoba memulai kembali satu kali setelah mendapat persetujuan. Proses noninteraktif tidak pernah memperbaiki secara otomatis; proses tersebut menampilkan perintahnya. Jika konfigurasi yang diperbaiki masih tidak valid, proses awal tetap dihentikan.
    - `openclaw onboard --mode local` dan `openclaw setup` menulis `gateway.mode=local`. Jika file konfigurasi ada tetapi `gateway.mode` tidak ditemukan, hal tersebut dianggap sebagai konfigurasi yang rusak/tertindih dan Gateway menolak menebak `local` untuk Anda — jalankan kembali orientasi awal, tetapkan kunci secara manual, atau berikan `--allow-unconfigured`.
    - Pengikatan di luar loopback tanpa autentikasi diblokir.
    - Nilai `--bind` `lan`, `tailnet`, dan `custom` saat ini di-resolve melalui jalur khusus IPv4; penyiapan host milik sendiri yang hanya menggunakan IPv6 memerlukan sidecar IPv4 atau proksi di depan Gateway.
    - `SIGUSR1` memicu mulai ulang dalam proses jika diotorisasi. `commands.restart` (default: diaktifkan) mengendalikan `SIGUSR1` yang dikirim secara eksternal; tetapkan ke `false` untuk memblokir mulai ulang manual melalui sinyal OS. Alat `gateway` yang tersedia bagi agen bersifat hanya-baca; agen meminta mulai ulang melalui alat delegasi `openclaw` yang disetujui manusia.
    - `SIGINT`/`SIGTERM` menghentikan proses tetapi tidak memulihkan status terminal khusus — jika Anda membungkus CLI dalam TUI atau input mode mentah, pulihkan terminal sendiri sebelum keluar.

  </Accordion>
</AccordionGroup>

### Opsi

<ParamField path="--port <port>" type="number">
  Port WebSocket (default dari konfigurasi/lingkungan; biasanya `18789`).
</ParamField>
<ParamField path="--bind <mode>" type="string">
  Mode pengikatan: `loopback` (default), `lan`, `tailnet`, `auto`, `custom`.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token bersama untuk `connect.params.auth.token`. Default-nya adalah `OPENCLAW_GATEWAY_TOKEN` jika ditetapkan.
</ParamField>
<ParamField path="--auth <mode>" type="string">
  Mode autentikasi: `none`, `token`, `password`, `trusted-proxy`.
</ParamField>
<ParamField path="--password <password>" type="string">
  Kata sandi untuk `--auth password`.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Baca kata sandi Gateway dari file.
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Eksposur Tailscale: `off`, `serve`, `funnel`.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Atur ulang konfigurasi serve/funnel Tailscale saat dimatikan.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Mulai tanpa memberlakukan `gateway.mode=local`. Hanya untuk bootstrap ad hoc/pengembangan; tidak mempertahankan atau memperbaiki konfigurasi.
</ParamField>
<ParamField path="--dev" type="boolean">
  Buat konfigurasi pengembangan + ruang kerja jika belum ada (melewati `BOOTSTRAP.md`).
</ParamField>
<ParamField path="--dev-ambient-channels" type="boolean">
  Izinkan Gateway pengembangan mengonfigurasi saluran secara otomatis dari variabel lingkungan sekitar. Memerlukan `--dev`.
</ParamField>
<ParamField path="--reset" type="boolean">
  Atur ulang konfigurasi pengembangan, kredensial, sesi, dan ruang kerja. Memerlukan `--dev`.
</ParamField>
<ParamField path="--force" type="boolean">
  Hentikan semua listener yang ada pada port target sebelum memulai. Dalam shell noninteraktif, opsi ini menolak menghentikan listener Gateway yang telah diverifikasi; sebagai gantinya gunakan `--dev` atau `--profile` yang terisolasi dengan port kosong.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Pencatatan mendetail ke stdout/stderr.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Hanya tampilkan log backend CLI di konsol (juga mengaktifkan stdout/stderr).
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  Gaya log WebSocket: `auto`, `full`, `compact`.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias untuk `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Catat peristiwa aliran model mentah ke JSONL.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Jalur JSONL aliran mentah.
</ParamField>

`--claude-cli-logs` adalah alias usang untuk `--cli-backend-logs`.

Untuk `--bind custom`, tetapkan `gateway.customBindHost` ke alamat IPv4. Semua alamat selain `127.0.0.1` atau `0.0.0.0` juga memerlukan `127.0.0.1` pada port yang sama untuk klien pada host yang sama; proses awal gagal jika salah satu listener tidak dapat mengikat. Wildcard `0.0.0.0` tidak menambahkan alias wajib yang terpisah. Penyiapan host milik sendiri yang hanya menggunakan IPv6 memerlukan sidecar IPv4 atau proksi di depan Gateway.

## Memulai Ulang Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` meminta Gateway yang sedang berjalan untuk melakukan pemeriksaan awal atas pekerjaan aktif dan menjadwalkan satu mulai ulang gabungan setelah pekerjaan tersebut selesai. Waktu tunggu dibatasi hingga 5 menit; saat jatah waktu habis, mulai ulang dipaksakan. `--safe` tidak dapat digabungkan dengan `--force` atau `--wait`.

`--skip-deferral` melewati gerbang penundaan pekerjaan aktif pada mulai ulang aman, sehingga Gateway segera dimulai ulang meskipun ada penghambat yang dilaporkan. Opsi ini memerlukan `--safe` — gunakan saat penundaan macet akibat tugas yang tidak terkendali.

`--wait <duration>` mengganti jatah waktu penyelesaian untuk mulai ulang biasa (tidak aman). Menerima milidetik polos atau akhiran unit `ms`, `s`, `m`, `h`, `d` (misalnya `30s`, `5m`, `1h30m`); `--wait 0` menunggu tanpa batas. Tidak kompatibel dengan `--force` atau `--safe`.

`--force` melewati penyelesaian pekerjaan aktif dan segera memulai ulang. `restart` biasa (tanpa flag) mempertahankan perilaku mulai ulang pengelola layanan yang ada.

<Warning>
`--password` sebaris dapat terlihat dalam daftar proses lokal. Utamakan `--password-file`, lingkungan, atau `gateway.auth.password` yang didukung SecretRef.
</Warning>

### Supervisor eksternal

Tetapkan `OPENCLAW_SUPERVISOR_MODE=external` hanya jika pengelola proses lain memiliki siklus hidup Gateway. Dalam mode ini:

- `openclaw gateway restart` mempertahankan perilaku aman, paksa, dan waktu tunggu terbatas yang ada sambil menargetkan Gateway aktif yang telah diverifikasi, bukan launchd, systemd, atau Task Scheduler.
- Operasi instalasi, mulai, penghentian, dan penghapusan instalasi layanan native ditolak dengan panduan untuk menggunakan supervisor eksternal.
- Pembaruan mandiri OpenClaw ditolak agar supervisor dapat menghentikan Gateway, mengganti dan memfinalisasi runtime, lalu memulai ulang dengan aman.
- Mulai ulang dengan proses baru menulis serah-terima SQLite berbatas sebelum keluar secara bersih. Jika persistensi gagal, Gateway kembali menggunakan mulai ulang dalam proses, alih-alih keluar tanpa serah-terima yang dapat digunakan.

`OPENCLAW_SERVICE_REPAIR_POLICY=external` tetap menjadi kebijakan perbaikan Doctor yang terpisah. Variabel ini tidak menyatakan kepemilikan runtime; supervisor yang memerlukan kedua perilaku harus menetapkan kedua variabel.

Supervisor eksternal dapat menegosiasikan dan menggunakan serah-terima mulai ulang melalui kontrak mesin tersembunyi:

```bash
openclaw gateway restart-handoff capabilities --json
openclaw gateway restart-handoff consume --expected-pid <pid> --json
```

Versi protokol `1` mendukung operasi `consume`. Penggunaan memvalidasi PID yang diharapkan dan bidang serah-terima berbatas dalam satu transaksi SQLite langsung. Serah-terima yang diterima dihapus sebelum keberhasilan dikembalikan, sehingga konsumen bersamaan atau konsumen yang mengulang tidak dapat sama-sama menerimanya. Ketidakcocokan PID dipertahankan untuk pemilik yang cocok; baris yang hilang, kedaluwarsa, dan tidak valid tidak mengotorisasi mulai ulang.

Permintaan mesin yang valid mengembalikan JSON dengan kode keluar `0`, termasuk hasil tanpa mulai ulang. Argumen tidak valid mengembalikan `reason: "invalid-expected-pid"` dengan kode keluar `2`; kegagalan penyimpanan status mengembalikan `reason: "store-unavailable"` dengan kode keluar `1`. Supervisor harus memeriksa `capabilities` pada runtime atau peluncur persis yang akan digunakan, bukan menyimpulkan dukungan dari string versi OpenClaw atau membaca skema SQLite privat secara langsung.

### Pemrofilan Gateway

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` mencatat waktu setiap fase selama proses awal, termasuk penundaan `eventLoopMax` per fase dan waktu tabel pencarian plugin (indeks terinstal, registri manifes, perencanaan proses awal, pekerjaan peta pemilik).
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` mencatat baris `restart trace:` dalam cakupan mulai ulang: penanganan sinyal, penyelesaian pekerjaan aktif, fase penghentian, proses awal berikutnya, waktu kesiapan, dan metrik memori.
- `OPENCLAW_DIAGNOSTICS=timeline` dengan `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` menulis linimasa diagnostik proses awal JSONL dengan upaya terbaik untuk harness QA eksternal (setara dengan konfigurasi `diagnostics.flags: ["timeline"]`; jalur tetap hanya tersedia melalui lingkungan). Tambahkan `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` untuk menyertakan sampel event loop.
- `pnpm build` lalu `pnpm test:startup:gateway -- --runs 5 --warmup 1` membuat tolok ukur proses awal Gateway terhadap titik masuk CLI yang telah dibuat: keluaran proses pertama, `/healthz`, `/readyz`, waktu pelacakan proses awal, penundaan event loop, dan waktu tabel pencarian plugin.
- `pnpm build` lalu `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` membuat tolok ukur mulai ulang dalam proses pada macOS atau Linux (tidak didukung pada Windows; mulai ulang memerlukan `SIGUSR1`). Menggunakan `SIGUSR1`, mengaktifkan kedua pelacakan dalam proses anak, dan mencatat `/healthz` berikutnya, `/readyz` berikutnya, waktu henti, waktu kesiapan, CPU, RSS, dan metrik pelacakan mulai ulang.
- `/healthz` menunjukkan keaktifan; `/readyz` menunjukkan kesiapan untuk digunakan. Perlakukan baris pelacakan dan keluaran tolok ukur sebagai sinyal atribusi pemilik, bukan kesimpulan kinerja lengkap dari satu rentang atau sampel.

## Mengueri Gateway yang Sedang Berjalan

Semua perintah kueri menggunakan RPC WebSocket.

<Tabs>
  <Tab title="Mode keluaran">
    - Default: mudah dibaca manusia (berwarna di TTY).
    - `--json`: JSON yang dapat dibaca mesin (tanpa gaya/spinner).
    - `--no-color` (atau `NO_COLOR=1`): nonaktifkan ANSI sambil mempertahankan tata letak untuk manusia.

  </Tab>
  <Tab title="Opsi bersama">
    - `--url <url>`: URL WebSocket Gateway.
    - `--token <token>`: token Gateway.
    - `--password <password>`: kata sandi Gateway.
    - `--timeout <ms>`: batas waktu/jatah (default berbeda untuk setiap perintah; lihat setiap perintah di bawah).
    - `--expect-final`: tunggu respons "final" (panggilan agen).

  </Tab>
</Tabs>

<Note>
Saat Anda menetapkan `--url`, CLI tidak menggunakan kredensial dari konfigurasi atau lingkungan sebagai cadangan. Berikan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang tidak diberikan merupakan kesalahan.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` adalah probe keaktifan: probe ini langsung mengembalikan respons segera setelah server dapat menjawab HTTP. `/readyz` lebih ketat dan tetap merah selama sidecar Plugin saat startup, saluran, atau hook yang dikonfigurasi masih dalam proses stabilisasi. Respons terperinci `/readyz` yang bersifat lokal atau terautentikasi menyertakan blok diagnostik `eventLoop` (penundaan, utilisasi, rasio inti CPU, tanda `degraded`).

<ParamField path="--port <port>" type="number">
  Targetkan Gateway loopback lokal pada port ini. Menggantikan `OPENCLAW_GATEWAY_URL` dan `OPENCLAW_GATEWAY_PORT` untuk panggilan ini.
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
  Batasi cakupan ringkasan ke satu ID agen yang dikonfigurasi.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Agregasikan semua agen yang dikonfigurasi. Tidak dapat digabungkan dengan `--agent`.
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
  Jumlah maksimum peristiwa terbaru yang akan disertakan (maks. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filter berdasarkan jenis peristiwa diagnostik, misalnya `payload.large` atau `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Sertakan hanya peristiwa setelah nomor urutan diagnostik.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Baca bundel stabilitas yang dipersistenkan alih-alih memanggil Gateway yang sedang berjalan. `--bundle latest` (atau `--bundle` saja) memilih bundel terbaru di bawah direktori status; Anda juga dapat meneruskan jalur JSON bundel secara langsung.
</ParamField>
<ParamField path="--export" type="boolean">
  Tulis zip diagnostik dukungan yang dapat dibagikan alih-alih mencetak detail stabilitas.
</ParamField>
<ParamField path="--output <path>" type="string">
  Jalur keluaran untuk `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privasi dan perilaku bundel">
    - Catatan menyimpan metadata operasional: nama peristiwa, jumlah, ukuran byte, pembacaan memori, status antrean/sesi, ID persetujuan, nama saluran/Plugin, dan ringkasan sesi yang disunting. Catatan tidak menyertakan teks percakapan, isi Webhook, keluaran alat, isi mentah permintaan/respons, token, cookie, nilai rahasia, nama host, dan ID sesi mentah. Atur `diagnostics.enabled: false` untuk menonaktifkan perekam sepenuhnya.
    - Penghentian fatal Gateway, batas waktu pematian, dan kegagalan startup saat dimulai ulang menulis snapshot diagnostik yang sama ke `~/.openclaw/logs/stability/openclaw-stability-*.json` saat perekam memiliki peristiwa. Periksa bundel terbaru dengan `openclaw gateway stability --bundle latest`; `--limit`, `--type`, dan `--since-seq` juga berlaku untuk keluaran bundel.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Tulis zip diagnostik lokal yang dirancang untuk laporan bug. Untuk model privasi dan isi bundel, lihat [Ekspor Diagnostik](/id/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Jalur zip keluaran. Nilai defaultnya adalah ekspor dukungan di bawah direktori status.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Jumlah maksimum baris log yang telah disanitasi untuk disertakan.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Jumlah maksimum byte log yang akan diperiksa.
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

Ekspor membundel: `manifest.json` (inventaris berkas), `summary.md` (ringkasan Markdown), `diagnostics.json` (ringkasan konfigurasi/log/penemuan/stabilitas/status/kesehatan tingkat atas), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl`, dan `stability/latest.json` jika bundel tersedia.

Ekspor ini dirancang untuk dibagikan. Ekspor mempertahankan detail operasional yang berguna untuk proses debug — bidang log yang aman, nama subsistem, kode status, durasi, mode yang dikonfigurasi, port, ID Plugin/penyedia, pengaturan fitur yang tidak bersifat rahasia, dan pesan log operasional yang disunting — serta menghilangkan atau menyunting teks percakapan, isi Webhook, keluaran alat, kredensial, cookie, pengidentifikasi akun/pesan, teks prompt/instruksi, nama host, dan nilai rahasia. Saat pesan log tampak seperti teks payload pengguna/percakapan/alat (misalnya "pengguna berkata", "teks percakapan", "keluaran alat", "isi Webhook"), ekspor hanya mempertahankan fakta bahwa pesan dihilangkan beserta jumlah byte-nya.

### `gateway status`

Menampilkan layanan Gateway (launchd/systemd/schtasks) beserta probe konektivitas/autentikasi opsional.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Tambahkan target probe eksplisit. Remote yang dikonfigurasi + localhost tetap diperiksa.
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
  Tingkatkan probe konektivitas menjadi probe baca dan keluar dengan kode bukan nol jika gagal. Tidak dapat digabungkan dengan `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantik status">
    - Tetap tersedia untuk diagnostik meskipun konfigurasi CLI lokal tidak ada atau tidak valid.
    - Keluaran default membuktikan status layanan, koneksi WebSocket, dan kemampuan autentikasi yang terlihat saat handshake — bukan operasi baca/tulis/admin.
    - Probe tidak melakukan perubahan untuk autentikasi perangkat pertama kali: probe menggunakan kembali token perangkat tersimpan yang sudah ada, tetapi tidak pernah membuat identitas perangkat CLI baru atau catatan pairing hanya-baca hanya untuk memeriksa status.
    - Menyelesaikan SecretRef autentikasi yang dikonfigurasi untuk autentikasi probe jika memungkinkan. Jika SecretRef yang diperlukan tidak dapat diselesaikan, `--json` melaporkan `rpc.authWarning` saat konektivitas/autentikasi probe gagal; teruskan `--token`/`--password` secara eksplisit atau perbaiki sumber rahasia. Peringatan autentikasi yang belum terselesaikan disembunyikan setelah probe berhasil.
    - Keluaran JSON menyertakan `gateway.version` saat Gateway yang berjalan melaporkannya; `--require-rpc` dapat kembali menggunakan payload RPC `status.runtimeVersion` jika probe handshake tidak dapat menyediakan metadata versi.
    - Gunakan `--require-rpc` dalam skrip/otomatisasi saat layanan yang sedang mendengarkan belum memadai dan RPC cakupan-baca juga harus sehat.
    - `--deep` memindai instalasi launchd/systemd/schtasks tambahan; saat ditemukan beberapa layanan mirip Gateway, keluaran yang dapat dibaca manusia mencetak petunjuk pembersihan (biasanya jalankan satu Gateway per mesin) dan melaporkan serah-terima mulai ulang supervisor terbaru jika relevan.
    - `--deep` juga menjalankan validasi konfigurasi dalam mode yang mengetahui Plugin (`pluginValidation: "full"`) dan menampilkan peringatan manifes Plugin (misalnya metadata konfigurasi saluran yang tidak ada). `gateway status` default mempertahankan jalur hanya-baca cepat yang melewati validasi Plugin.
    - Keluaran yang dapat dibaca manusia menyertakan jalur log berkas yang telah diselesaikan beserta jalur/validitas konfigurasi CLI dibandingkan layanan untuk membantu mendiagnosis penyimpangan profil atau direktori status.
    - Keluaran yang dapat dibaca manusia menyertakan `Gateway heap:` dengan batas yang diterapkan dan derivasi adaptifnya. Keluaran JSON menyajikan laporan yang sama sebagai `service.gatewayHeap`.

  </Accordion>
  <Accordion title="Pemeriksaan penyimpangan autentikasi systemd Linux">
    - Pemeriksaan penyimpangan autentikasi layanan membaca `Environment=` dan `EnvironmentFile=` dari unit (termasuk `%h`, jalur yang dikutip, beberapa berkas, dan berkas `-` opsional).
    - Menyelesaikan SecretRef `gateway.auth.token` menggunakan lingkungan runtime gabungan (lingkungan perintah layanan terlebih dahulu, lalu lingkungan proses sebagai fallback).
    - Pemeriksaan penyimpangan token melewati penyelesaian token konfigurasi saat autentikasi token tidak aktif secara efektif (`gateway.auth.mode` secara eksplisit `password`/`none`/`trusted-proxy`, atau mode tidak ditetapkan ketika kata sandi dapat diprioritaskan dan tidak ada kandidat token yang dapat diprioritaskan).

  </Accordion>
</AccordionGroup>

### `gateway probe`

Perintah "debug semuanya". Perintah ini selalu memeriksa:

- Gateway remote yang dikonfigurasi (jika ditetapkan), dan
- localhost (loopback), **meskipun remote dikonfigurasi**.

Meneruskan `--url` menambahkan target eksplisit tersebut sebelum keduanya. Keluaran yang dapat dibaca manusia memberi label target sebagai `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)`, dan `Local loopback`.

<Note>
Jika beberapa target probe dapat dijangkau, semuanya akan dicetak. Tunnel SSH, URL TLS/proksi, dan URL remote yang dikonfigurasi dapat mengarah ke Gateway yang sama meskipun menggunakan port transportasi yang berbeda; `multiple_gateways` dicadangkan untuk Gateway berbeda atau Gateway terjangkau yang identitasnya ambigu. Menjalankan beberapa Gateway didukung untuk profil yang terisolasi (misalnya bot pemulihan), tetapi sebagian besar instalasi menjalankan satu Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Gunakan port ini untuk target probe loopback lokal dan port remote tunnel SSH. Tanpa `--url`, opsi ini hanya memilih target loopback lokal alih-alih URL lingkungan Gateway yang dikonfigurasi, port lingkungan, atau target remote.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretasi">
    - `Reachable: yes` berarti setidaknya satu target menerima koneksi WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` melaporkan hal yang dapat dibuktikan probe tentang autentikasi, secara terpisah dari keterjangkauan.
    - `Read probe: ok` berarti panggilan RPC detail cakupan-baca (`health`/`status`/`system-presence`/`config.get`) juga berhasil.
    - `Read probe: limited - missing scope: operator.read` berarti koneksi berhasil, tetapi RPC cakupan-baca terbatas. Dilaporkan sebagai keterjangkauan yang **menurun**, bukan kegagalan total.
    - `Read probe: failed` setelah `Connect: ok` berarti WebSocket terhubung, tetapi diagnostik baca lanjutan kehabisan waktu atau gagal — juga **menurun**, bukan tidak dapat dijangkau.
    - Seperti `gateway status`, probe menggunakan kembali autentikasi perangkat tersimpan yang sudah ada, tetapi tidak membuat identitas perangkat atau status pairing untuk pertama kalinya.
    - Kode keluar hanya bukan nol jika tidak ada target yang diperiksa dapat dijangkau.

  </Accordion>
  <Accordion title="Keluaran JSON">
    Tingkat atas:

    - `ok`: setidaknya satu target dapat dijangkau.
    - `degraded`: setidaknya satu target menerima koneksi tetapi tidak menyelesaikan diagnostik RPC detail penuh.
    - `capability`: kapabilitas terbaik yang terlihat di seluruh target yang dapat dijangkau (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, atau `unknown`).
    - `primaryTargetId`: target terbaik untuk diperlakukan sebagai pemenang aktif, dengan urutan: URL eksplisit, terowongan SSH, remote yang dikonfigurasi, loopback lokal.
    - `warnings[]`: catatan peringatan upaya terbaik dengan `code`, `message`, dan `targetIds` opsional.
    - `network`: petunjuk URL loopback lokal/tailnet yang diturunkan dari konfigurasi saat ini dan jaringan host.
    - `discovery.timeoutMs` / `discovery.count`: anggaran penemuan/jumlah hasil aktual yang digunakan untuk tahap pemeriksaan ini.

    Per target (`targets[].connect`): `ok` (keterjangkauan + klasifikasi terdegradasi), `rpcOk` (keberhasilan RPC detail penuh), `scopeLimited` (RPC detail gagal karena cakupan operator tidak tersedia).

    Per target (`targets[].auth`): `role` dan `scopes` dilaporkan dalam `hello-ok` jika tersedia, beserta klasifikasi `capability` yang ditampilkan.

  </Accordion>
  <Accordion title="Kode peringatan umum">
    - `ssh_tunnel_failed`: penyiapan terowongan SSH gagal; perintah beralih kembali ke pemeriksaan langsung.
    - `multiple_gateways`: identitas Gateway yang berbeda dapat dijangkau, atau OpenClaw tidak dapat membuktikan bahwa target yang dapat dijangkau merupakan Gateway yang sama. Terowongan SSH, URL proksi, atau URL remote yang dikonfigurasi ke Gateway yang sama tidak memicu hal ini.
    - `auth_secretref_unresolved`: SecretRef autentikasi yang dikonfigurasi tidak dapat diurai untuk target yang gagal.
    - `probe_scope_limited`: koneksi WebSocket berhasil, tetapi pemeriksaan baca dibatasi karena `operator.read` tidak tersedia.
    - `local_tls_runtime_unavailable`: TLS Gateway lokal diaktifkan, tetapi OpenClaw tidak dapat memuat sidik jari sertifikat lokal.

  </Accordion>
</AccordionGroup>

#### Remote melalui SSH (paritas aplikasi Mac)

Mode "Remote over SSH" pada aplikasi macOS menggunakan penerusan porta lokal agar Gateway remote yang hanya menggunakan loopback dapat dijangkau di `ws://127.0.0.1:<port>`.

Perintah CLI yang setara:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` atau `user@host:port` (porta ditetapkan secara default ke `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Berkas identitas.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Pilih host Gateway pertama yang ditemukan sebagai target SSH dari endpoint penemuan yang telah diurai (`local.` beserta domain area luas yang dikonfigurasi, jika ada). Petunjuk yang hanya berupa TXT diabaikan.
</ParamField>

Konfigurasi default (opsional): `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`.

### `gateway call <method>`

Pembantu RPC tingkat rendah.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
```

<ParamField path="--params <json>" type="string" default="{}">
  String objek JSON untuk parameter.
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
<ParamField path="--timeout <ms>" type="number" default="10000">
  Batas waktu tunggu.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Terutama untuk RPC bergaya agen yang mengalirkan peristiwa perantara sebelum payload akhir.
</ParamField>
<ParamField path="--json" type="boolean">
  Keluaran JSON yang dapat dibaca mesin.
</ParamField>

<Note>
`--params` harus berupa JSON yang valid, dan setiap metode memvalidasi bentuk parameternya sendiri (bidang tambahan atau yang salah nama akan ditolak).
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

Gunakan `--wrapper` ketika layanan terkelola harus dimulai melalui executable lain, misalnya shim pengelola rahasia atau pembantu run-as. Wrapper menerima argumen Gateway normal dan bertanggung jawab untuk pada akhirnya menjalankan melalui exec `openclaw` atau Node dengan argumen tersebut.

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

Anda juga dapat mengatur wrapper melalui lingkungan. `gateway install` memvalidasi bahwa path tersebut adalah file executable, menuliskan wrapper ke `ProgramArguments` layanan, dan mempertahankan `OPENCLAW_WRAPPER` dalam lingkungan layanan untuk penginstalan ulang paksa, pembaruan, dan perbaikan doctor di kemudian hari.

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
    - `gateway install`: `--port`, `--runtime <node>` (bawaan: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--force`, `--json`

  </Accordion>
  <Accordion title="Perilaku siklus hidup">
    - `gateway start` bersifat idempoten: ketika layanan terkelola sudah berjalan, perintah ini melaporkan proses yang berjalan dan membiarkannya tanpa perubahan. Layanan yang telah dimuat tetapi berhenti akan dimulai seperti sebelumnya.
    - Gunakan `gateway restart` untuk memulai ulang layanan terkelola. Jangan merangkai `gateway stop` dan `gateway start` sebagai pengganti mulai ulang.
    - Dalam shell noninteraktif, `gateway stop` memerlukan `--force`. Terminal interaktif mempertahankan perilaku tanpa prompt yang ada. Untuk otomatisasi dan pengujian, utamakan `gateway run --dev` atau `--profile` yang terisolasi dengan port kosong.
    - Di macOS, `gateway stop` menggunakan `launchctl bootout` secara bawaan, yang menghapus LaunchAgent dari sesi boot saat ini tanpa mempertahankan penonaktifan — pemulihan otomatis KeepAlive tetap aktif untuk kegagalan mendatang dan `gateway start` mengaktifkannya kembali dengan bersih tanpa `launchctl enable` manual. Teruskan `--disable` untuk menekan KeepAlive dan RunAtLoad secara persisten agar gateway tidak muncul kembali hingga `gateway start` eksplisit berikutnya; gunakan ini ketika penghentian manual harus tetap berlaku setelah boot ulang.
    - Mutasi siklus hidup Gateway menambahkan catatan audit pasangan kunci-nilai berbasis upaya terbaik ke `<state-dir>/logs/gateway-restart.log`, termasuk operasi mulai, berhenti, dan mulai ulang CLI, permintaan mulai ulang aman, mulai ulang supervisor, serta serah terima terpisah.
    - Perintah siklus hidup menerima `--json` untuk pembuatan skrip.

  </Accordion>
  <Accordion title="Penentuan ukuran heap Gateway terkelola">
    - `gateway install` menulis nilai `NODE_OPTIONS` khusus heap untuk layanan Gateway terkelola. Nilai ini menargetkan 50% dari memori yang dibatasi ketika Node melaporkan batas kontainer atau layanan, atau 50% dari memori fisik jika tidak.
    - Rentang target nominal adalah 2048–8192 MiB, dengan batas ruang tambahan native sebesar 75%. Pada host kecil, batas ruang tambahan tersebut dapat membuat batas yang diterapkan berada di bawah nilai minimum nominal 2048 MiB.
    - Nilai eksplisit `--max-old-space-size` yang valid dan sudah tersimpan dalam layanan terinstal dipertahankan selama instalasi ulang paksa dan perbaikan doctor. Flag `NODE_OPTIONS` lainnya tidak diteruskan ke layanan terkelola.
    - `NODE_OPTIONS` dari shell sekitar tidak menggantikan kebijakan ini. Gunakan `gateway status` atau `doctor` untuk memeriksa nilai yang terinstal; jalankan `openclaw gateway install --force` untuk membuat ulang metadata layanan lama yang tidak memiliki pengaturan heap terkelola.
    - Kebijakan ini hanya berlaku untuk layanan Gateway terkelola. `gateway run` di latar depan, layanan node, dan unit supervisor yang ditulis manual mempertahankan konfigurasi runtime masing-masing.

  </Accordion>
  <Accordion title="Autentikasi dan SecretRef saat instalasi">
    - Ketika autentikasi token memerlukan token dan `gateway.auth.token` dikelola oleh SecretRef, `gateway install` memvalidasi bahwa SecretRef dapat diresolusi, tetapi tidak menyimpan token yang telah diresolusi ke dalam metadata lingkungan layanan.
    - Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi tidak dapat diresolusi, instalasi gagal secara tertutup alih-alih menyimpan teks biasa cadangan.
    - Untuk autentikasi kata sandi pada `gateway run`, utamakan `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, atau `gateway.auth.password` yang didukung SecretRef daripada `--password` sebaris.
    - Dalam mode autentikasi tersimpulkan, `OPENCLAW_GATEWAY_PASSWORD` yang hanya tersedia di shell tidak melonggarkan persyaratan token instalasi; gunakan konfigurasi tahan lama (`gateway.auth.password` atau konfigurasi `env`) saat menginstal layanan terkelola.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` tidak ditetapkan, instalasi diblokir hingga mode ditetapkan secara eksplisit.

  </Accordion>
</AccordionGroup>

## Menemukan gateway (Bonjour)

`gateway discover` memindai beacon Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour area luas): pilih domain (contoh: `openclaw.internal.`) dan siapkan DNS terpisah + server DNS; lihat [Bonjour](/id/gateway/bonjour).

Hanya gateway dengan penemuan Bonjour yang diaktifkan (bawaan) yang mengiklankan beacon.

Petunjuk TXT pada setiap beacon: `role` (petunjuk peran gateway), `transport` (petunjuk transportasi, misalnya `gateway`), `gatewayPort` (port WebSocket, biasanya `18789`), `tailnetDns` (nama host MagicDNS, jika tersedia), `gatewayTls` / `gatewayTlsSha256` (TLS diaktifkan + sidik jari sertifikat). `sshPort` dan `cliPath` hanya dipublikasikan dalam mode penemuan penuh (`discovery.mdns.mode: "full"`; bawaannya adalah `"minimal"`, yang menghilangkannya — klien kemudian menetapkan target SSH secara bawaan ke port `22`).

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Batas waktu per perintah (telusuri/resolusi).
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
- Memindai `local.` serta domain area luas yang dikonfigurasi ketika salah satunya diaktifkan.
- `wsUrl` dalam keluaran JSON berasal dari endpoint layanan yang telah diresolusi, bukan dari petunjuk khusus TXT seperti `lanHost` atau `tailnetDns`.
- `discovery.mdns.mode` mengontrol publikasi `sshPort`/`cliPath` pada mDNS `local.` dan DNS-SD area luas (lihat sebelumnya).

</Note>

## Terkait

- [Referensi CLI](/id/cli)
- [Panduan operasional Gateway](/id/gateway)
