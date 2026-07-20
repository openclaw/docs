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
    generated_at: "2026-07-20T03:44:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4de443c749806ccb7fe3e7919a319ff125130192e8814708a79b2b3a93162e7d
    source_path: cli/gateway.md
    workflow: 16
---

Gateway adalah server WebSocket OpenClaw (kanal, node, sesi, hook). Semua subperintah di bawah ini berada di bawah `openclaw gateway ...`.

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
  <Accordion title="Perilaku saat memulai">
    - Menolak dimulai kecuali `gateway.mode=local` ditetapkan di `~/.openclaw/openclaw.json`. Gunakan `--allow-unconfigured` untuk proses ad hoc/pengembangan; opsi ini melewati pemeriksaan tanpa menulis atau memperbaiki konfigurasi.
    - Saat proses awal menemukan konfigurasi tidak valid yang dapat diperbaiki, terminal interaktif menawarkan untuk menjalankan `openclaw doctor --fix` dan mencoba memulai sekali lagi setelah mendapat persetujuan. Proses noninteraktif tidak pernah memperbaiki secara otomatis; sebagai gantinya, proses tersebut mencetak perintahnya. Jika konfigurasi yang diperbaiki masih tidak valid, proses awal tetap dihentikan.
    - `openclaw onboard --mode local` dan `openclaw setup` menulis `gateway.mode=local`. Jika berkas konfigurasi ada tetapi `gateway.mode` tidak ada, kondisi tersebut dianggap sebagai konfigurasi yang rusak/tertimpa dan Gateway menolak menebak `local` untuk Anda — jalankan kembali orientasi awal, tetapkan kunci secara manual, atau berikan `--allow-unconfigured`.
    - Pengikatan di luar loopback tanpa autentikasi diblokir.
    - Nilai `--bind` `lan`, `tailnet`, dan `custom` saat ini diresolusikan melalui jalur khusus IPv4; penyiapan host milik sendiri yang hanya menggunakan IPv6 memerlukan sidecar IPv4 atau proksi di depan Gateway.
    - `SIGUSR1` memicu mulai ulang dalam proses jika diotorisasi. `commands.restart` (bawaan: diaktifkan) mengendalikan `SIGUSR1` yang dikirim secara eksternal; tetapkan ke `false` untuk memblokir mulai ulang manual melalui sinyal OS. Alat `gateway` yang tersedia bagi agen bersifat hanya-baca; agen meminta mulai ulang melalui alat delegasi `openclaw` yang disetujui manusia.
    - `SIGINT`/`SIGTERM` menghentikan proses tetapi tidak memulihkan status terminal khusus — jika Anda membungkus CLI dalam TUI atau input mode mentah, pulihkan sendiri terminal sebelum keluar.

  </Accordion>
</AccordionGroup>

### Opsi

<ParamField path="--port <port>" type="number">
  Port WebSocket (bawaan dari konfigurasi/lingkungan; biasanya `18789`).
</ParamField>
<ParamField path="--bind <mode>" type="string">
  Mode pengikatan: `loopback` (bawaan), `lan`, `tailnet`, `auto`, `custom`.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token bersama untuk `connect.params.auth.token`. Secara bawaan menggunakan `OPENCLAW_GATEWAY_TOKEN` jika ditetapkan.
</ParamField>
<ParamField path="--auth <mode>" type="string">
  Mode autentikasi: `none`, `token`, `password`, `trusted-proxy`.
</ParamField>
<ParamField path="--password <password>" type="string">
  Kata sandi untuk `--auth password`.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Baca kata sandi Gateway dari berkas.
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Eksposur Tailscale: `off`, `serve`, `funnel`.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Atur ulang konfigurasi serve/funnel Tailscale saat dimatikan.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Mulai tanpa memberlakukan `gateway.mode=local`. Hanya untuk bootstrap ad hoc/pengembangan; tidak menyimpan atau memperbaiki konfigurasi.
</ParamField>
<ParamField path="--dev" type="boolean">
  Buat konfigurasi pengembangan + ruang kerja jika belum ada (melewati `BOOTSTRAP.md`).
</ParamField>
<ParamField path="--reset" type="boolean">
  Atur ulang konfigurasi pengembangan, kredensial, sesi, dan ruang kerja. Memerlukan `--dev`.
</ParamField>
<ParamField path="--force" type="boolean">
  Hentikan semua listener yang ada pada port target sebelum memulai. Dalam shell noninteraktif, opsi ini menolak menghentikan listener Gateway yang telah diverifikasi; sebagai gantinya, gunakan `--dev` atau `--profile` yang terisolasi dengan port kosong.
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

Untuk `--bind custom`, tetapkan `gateway.customBindHost` ke alamat IPv4. Semua alamat selain `127.0.0.1` atau `0.0.0.0` juga memerlukan `127.0.0.1` pada port yang sama bagi klien di host yang sama; proses awal gagal jika salah satu listener tidak dapat mengikat. Wildcard `0.0.0.0` tidak menambahkan alias wajib terpisah. Penyiapan host milik sendiri yang hanya menggunakan IPv6 memerlukan sidecar IPv4 atau proksi di depan Gateway.

## Memulai Ulang Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` meminta Gateway yang sedang berjalan untuk melakukan pemeriksaan awal atas pekerjaan aktif dan menjadwalkan satu mulai ulang terkonsolidasi setelah pekerjaan tersebut selesai. Waktu tunggu dibatasi hingga 5 menit; ketika batas waktu habis, mulai ulang dipaksakan. `--safe` tidak dapat digabungkan dengan `--force` atau `--wait`.

`--skip-deferral` melewati gerbang penundaan pekerjaan aktif pada mulai ulang aman, sehingga Gateway segera dimulai ulang meskipun ada pemblokir yang dilaporkan. Opsi ini memerlukan `--safe` — gunakan saat penundaan macet karena tugas yang berjalan tak terkendali.

`--wait <duration>` mengganti batas waktu pengosongan untuk mulai ulang biasa (tidak aman). Menerima milidetik tanpa satuan atau akhiran satuan `ms`, `s`, `m`, `h`, `d` (misalnya `30s`, `5m`, `1h30m`); `--wait 0` menunggu tanpa batas. Tidak kompatibel dengan `--force` atau `--safe`.

`--force` melewati pengosongan pekerjaan aktif dan segera memulai ulang. `restart` biasa (tanpa flag) mempertahankan perilaku mulai ulang pengelola layanan yang ada.

<Warning>
`--password` sebaris dapat terlihat dalam daftar proses lokal. Utamakan `--password-file`, lingkungan, atau `gateway.auth.password` yang didukung SecretRef.
</Warning>

### Supervisor eksternal

Tetapkan `OPENCLAW_SUPERVISOR_MODE=external` hanya jika pengelola proses lain memiliki siklus hidup Gateway. Dalam mode ini:

- `openclaw gateway restart` mempertahankan perilaku aman, paksa, dan waktu tunggu terbatas yang ada sambil menargetkan Gateway berjalan yang telah diverifikasi, bukan launchd, systemd, atau Task Scheduler.
- Operasi pemasangan, memulai, menghentikan, dan menghapus layanan native ditolak dengan panduan untuk menggunakan supervisor eksternal.
- Pembaruan mandiri OpenClaw ditolak agar supervisor dapat menghentikan Gateway, mengganti dan menyelesaikan runtime, serta memulainya kembali dengan aman.
- Mulai ulang dengan proses baru menulis serah-terima SQLite terbatas sebelum keluar secara bersih. Jika persistensi gagal, Gateway beralih ke mulai ulang dalam proses alih-alih keluar tanpa serah-terima yang dapat digunakan.

`OPENCLAW_SERVICE_REPAIR_POLICY=external` tetap merupakan kebijakan perbaikan Doctor yang terpisah. Variabel tersebut tidak menyatakan kepemilikan runtime; supervisor yang memerlukan kedua perilaku harus menetapkan kedua variabel.

Supervisor eksternal dapat menegosiasikan dan menggunakan serah-terima mulai ulang melalui kontrak mesin tersembunyi:

```bash
openclaw gateway restart-handoff capabilities --json
openclaw gateway restart-handoff consume --expected-pid <pid> --json
```

Versi protokol `1` mendukung operasi `consume`. Penggunaan memvalidasi PID yang diharapkan dan bidang serah-terima terbatas dalam satu transaksi SQLite langsung. Serah-terima yang diterima dihapus sebelum keberhasilan dikembalikan, sehingga konsumen serentak atau konsumen yang memutar ulang tidak dapat menerima serah-terima yang sama. Ketidakcocokan PID dipertahankan untuk pemilik yang cocok; baris yang tidak ada, kedaluwarsa, dan tidak valid tidak mengotorisasi mulai ulang.

Permintaan mesin yang valid mengembalikan JSON dengan kode keluar `0`, termasuk hasil yang tidak memulai ulang. Argumen tidak valid mengembalikan `reason: "invalid-expected-pid"` dengan kode keluar `2`; kegagalan penyimpanan status mengembalikan `reason: "store-unavailable"` dengan kode keluar `1`. Supervisor harus memeriksa `capabilities` pada runtime atau peluncur persis yang akan digunakan, bukan menyimpulkan dukungan dari string versi OpenClaw atau membaca langsung skema SQLite privat.

### Pembuatan profil Gateway

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` mencatat waktu fase selama proses awal, termasuk penundaan `eventLoopMax` per fase dan waktu tabel pencarian plugin (indeks terpasang, registri manifes, perencanaan proses awal, pekerjaan peta pemilik).
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` mencatat baris `restart trace:` yang tercakup pada mulai ulang: penanganan sinyal, pengosongan pekerjaan aktif, fase pematian, proses awal berikutnya, waktu kesiapan, dan metrik memori.
- `OPENCLAW_DIAGNOSTICS=timeline` dengan `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` menulis linimasa diagnostik proses awal JSONL dengan upaya terbaik untuk harness QA eksternal (setara dengan konfigurasi `diagnostics.flags: ["timeline"]`; jalur tetap hanya tersedia melalui lingkungan). Tambahkan `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` untuk menyertakan sampel event loop.
- `pnpm build` lalu `pnpm test:startup:gateway -- --runs 5 --warmup 1` melakukan tolok ukur proses awal Gateway terhadap entri CLI hasil build: keluaran proses pertama, `/healthz`, `/readyz`, waktu jejak proses awal, penundaan event loop, dan waktu tabel pencarian plugin.
- `pnpm build` lalu `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` melakukan tolok ukur mulai ulang dalam proses pada macOS atau Linux (tidak didukung pada Windows; mulai ulang memerlukan `SIGUSR1`). Menggunakan `SIGUSR1`, mengaktifkan kedua jejak dalam proses anak, serta mencatat `/healthz` berikutnya, `/readyz` berikutnya, waktu henti, waktu kesiapan, CPU, RSS, dan metrik jejak mulai ulang.
- `/healthz` menunjukkan keaktifan; `/readyz` menunjukkan kesiapan untuk digunakan. Perlakukan baris jejak dan keluaran tolok ukur sebagai sinyal atribusi pemilik, bukan kesimpulan kinerja lengkap dari satu rentang atau sampel.

## Mengueri Gateway yang Sedang Berjalan

Semua perintah kueri menggunakan RPC WebSocket.

<Tabs>
  <Tab title="Mode keluaran">
    - Bawaan: mudah dibaca manusia (berwarna di TTY).
    - `--json`: JSON yang dapat dibaca mesin (tanpa gaya/spinner).
    - `--no-color` (atau `NO_COLOR=1`): nonaktifkan ANSI sambil mempertahankan tata letak untuk manusia.

  </Tab>
  <Tab title="Opsi bersama">
    - `--url <url>`: URL WebSocket Gateway.
    - `--token <token>`: token Gateway.
    - `--password <password>`: kata sandi Gateway.
    - `--timeout <ms>`: batas waktu/anggaran (bawaan berbeda untuk setiap perintah; lihat setiap perintah di bawah).
    - `--expect-final`: tunggu respons "final" (panggilan agen).

  </Tab>
</Tabs>

<Note>
Saat Anda menetapkan `--url`, CLI tidak beralih ke kredensial dari konfigurasi atau lingkungan. Berikan `--token` atau `--password` secara eksplisit. Tidak adanya kredensial eksplisit merupakan kesalahan.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` adalah probe keaktifan: probe ini langsung kembali begitu server dapat menjawab HTTP. `/readyz` lebih ketat dan tetap merah selama sidecar Plugin saat startup, saluran, atau hook yang dikonfigurasi masih dalam proses stabilisasi. Respons terperinci `/readyz` yang lokal atau terautentikasi menyertakan blok diagnostik `eventLoop` (penundaan, utilisasi, rasio inti CPU, flag `degraded`).

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
  Batasi ringkasan ke satu id agen yang dikonfigurasi.
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
  Baca bundel stabilitas yang dipersistenkan alih-alih memanggil Gateway yang sedang berjalan. `--bundle latest` (atau hanya `--bundle`) memilih bundel terbaru di bawah direktori status; Anda juga dapat meneruskan jalur JSON bundel secara langsung.
</ParamField>
<ParamField path="--export" type="boolean">
  Tulis zip diagnostik dukungan yang dapat dibagikan alih-alih mencetak detail stabilitas.
</ParamField>
<ParamField path="--output <path>" type="string">
  Jalur keluaran untuk `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privasi dan perilaku bundel">
    - Catatan menyimpan metadata operasional: nama peristiwa, jumlah, ukuran byte, pembacaan memori, status antrean/sesi, id persetujuan, nama saluran/Plugin, dan ringkasan sesi yang disamarkan. Catatan ini mengecualikan teks obrolan, isi Webhook, keluaran alat, isi mentah permintaan/respons, token, cookie, nilai rahasia, nama host, dan id sesi mentah. Tetapkan `diagnostics.enabled: false` untuk menonaktifkan perekam sepenuhnya.
    - Penghentian fatal Gateway, batas waktu pematian, dan kegagalan startup setelah dimulai ulang menulis snapshot diagnostik yang sama ke `~/.openclaw/logs/stability/openclaw-stability-*.json` ketika perekam memiliki peristiwa. Periksa bundel terbaru dengan `openclaw gateway stability --bundle latest`; `--limit`, `--type`, dan `--since-seq` juga berlaku pada keluaran bundel.

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
  Jalur zip keluaran. Secara default menggunakan ekspor dukungan di bawah direktori status.
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

Ekspor membundel: `manifest.json` (inventaris file), `summary.md` (ringkasan Markdown), `diagnostics.json` (ringkasan konfigurasi/log/penemuan/stabilitas/status/kesehatan tingkat atas), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl`, dan `stability/latest.json` ketika bundel tersedia.

Ekspor ini dirancang untuk dibagikan. Ekspor ini mempertahankan detail operasional yang berguna untuk debugging — kolom log yang aman, nama subsistem, kode status, durasi, mode yang dikonfigurasi, port, id Plugin/penyedia, pengaturan fitur yang bukan rahasia, dan pesan log operasional yang disamarkan — serta menghilangkan atau menyamarkan teks obrolan, isi Webhook, keluaran alat, kredensial, cookie, pengidentifikasi akun/pesan, teks prompt/instruksi, nama host, dan nilai rahasia. Ketika pesan log tampak seperti teks payload pengguna/obrolan/alat (misalnya "pengguna mengatakan", "teks obrolan", "keluaran alat", "isi Webhook"), ekspor hanya mempertahankan fakta bahwa pesan telah dihilangkan beserta jumlah byte-nya.

### `gateway status`

Menampilkan layanan Gateway (launchd/systemd/schtasks) beserta probe konektivitas/autentikasi opsional.

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
  Tingkatkan probe konektivitas menjadi probe baca dan keluar dengan kode bukan nol jika gagal. Tidak dapat digabungkan dengan `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantik status">
    - Tetap tersedia untuk diagnostik meskipun konfigurasi CLI lokal tidak ada atau tidak valid.
    - Keluaran default membuktikan status layanan, koneksi WebSocket, dan kemampuan autentikasi yang terlihat pada saat handshake — bukan operasi baca/tulis/admin.
    - Probe tidak melakukan mutasi untuk autentikasi perangkat pertama kali: probe menggunakan kembali token perangkat dalam cache yang sudah ada, tetapi tidak pernah membuat identitas perangkat CLI baru atau catatan pemasangan hanya-baca hanya untuk memeriksa status.
    - Menyelesaikan SecretRef autentikasi yang dikonfigurasi untuk autentikasi probe jika memungkinkan. Jika SecretRef yang diperlukan tidak terselesaikan, `--json` melaporkan `rpc.authWarning` ketika konektivitas/autentikasi probe gagal; teruskan `--token`/`--password` secara eksplisit atau perbaiki sumber rahasia. Peringatan autentikasi yang belum terselesaikan disembunyikan setelah probe berhasil.
    - Keluaran JSON menyertakan `gateway.version` ketika Gateway yang berjalan melaporkannya; `--require-rpc` dapat kembali menggunakan payload RPC `status.runtimeVersion` jika probe handshake tidak dapat menyediakan metadata versi.
    - Gunakan `--require-rpc` dalam skrip/otomatisasi ketika layanan yang mendengarkan saja tidak cukup dan RPC lingkup-baca juga harus sehat.
    - `--deep` memindai instalasi launchd/systemd/schtasks tambahan; ketika ditemukan beberapa layanan yang menyerupai Gateway, keluaran untuk manusia mencetak petunjuk pembersihan (biasanya jalankan satu Gateway per mesin) dan melaporkan serah-terima mulai ulang supervisor terbaru jika relevan.
    - `--deep` juga menjalankan validasi konfigurasi dalam mode sadar-Plugin (`pluginValidation: "full"`) dan menampilkan peringatan manifes Plugin (misalnya metadata konfigurasi saluran yang tidak ada). `gateway status` default mempertahankan jalur hanya-baca cepat yang melewati validasi Plugin.
    - Keluaran untuk manusia menyertakan jalur log file yang telah diselesaikan beserta jalur/validitas konfigurasi CLI dibandingkan layanan untuk membantu mendiagnosis pergeseran profil atau direktori status.
    - Keluaran untuk manusia menyertakan `Gateway heap:` dengan batas yang diterapkan dan derivasi adaptifnya. Keluaran JSON mengekspos laporan yang sama sebagai `service.gatewayHeap`.

  </Accordion>
  <Accordion title="Pemeriksaan pergeseran autentikasi systemd Linux">
    - Pemeriksaan pergeseran autentikasi layanan membaca `Environment=` dan `EnvironmentFile=` dari unit (termasuk `%h`, jalur yang diberi tanda kutip, beberapa file, dan file `-` opsional).
    - Menyelesaikan SecretRef `gateway.auth.token` menggunakan lingkungan runtime gabungan (lingkungan perintah layanan terlebih dahulu, lalu lingkungan proses sebagai fallback).
    - Pemeriksaan pergeseran token melewati penyelesaian token konfigurasi ketika autentikasi token tidak aktif secara efektif (`gateway.auth.mode` secara eksplisit `password`/`none`/`trusted-proxy`, atau mode tidak ditetapkan ketika kata sandi dapat menang dan tidak ada kandidat token yang dapat menang).

  </Accordion>
</AccordionGroup>

### `gateway probe`

Perintah "debug semuanya". Perintah ini selalu memprobe:

- Gateway remote yang dikonfigurasi (jika ditetapkan), dan
- localhost (loopback), **meskipun remote dikonfigurasi**.

Meneruskan `--url` menambahkan target eksplisit tersebut sebelum keduanya. Keluaran untuk manusia memberi label target `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)`, dan `Local loopback`.

<Note>
Jika beberapa target probe dapat dijangkau, semuanya dicetak. Tunnel SSH, URL TLS/proksi, dan URL remote yang dikonfigurasi dapat menunjuk ke Gateway yang sama meskipun menggunakan port transport yang berbeda; `multiple_gateways` dicadangkan untuk Gateway berbeda atau Gateway terjangkau yang identitasnya ambigu. Menjalankan beberapa Gateway didukung untuk profil terisolasi (misalnya bot pemulihan), tetapi sebagian besar instalasi menjalankan satu Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Gunakan port ini untuk target probe loopback lokal dan port remote tunnel SSH. Tanpa `--url`, ini hanya memilih target loopback lokal, bukan URL lingkungan Gateway yang dikonfigurasi, port lingkungan, atau target remote.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretasi">
    - `Reachable: yes` berarti setidaknya satu target menerima koneksi WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` melaporkan apa yang dapat dibuktikan probe mengenai autentikasi, terpisah dari keterjangkauan.
    - `Read probe: ok` berarti panggilan RPC detail lingkup-baca (`health`/`status`/`system-presence`/`config.get`) juga berhasil.
    - `Read probe: limited - missing scope: operator.read` berarti koneksi berhasil tetapi RPC lingkup-baca terbatas. Dilaporkan sebagai keterjangkauan **terdegradasi**, bukan kegagalan penuh.
    - `Read probe: failed` setelah `Connect: ok` berarti WebSocket terhubung tetapi diagnostik baca lanjutan mencapai batas waktu atau gagal — juga **terdegradasi**, bukan tidak terjangkau.
    - Seperti `gateway status`, probe menggunakan kembali autentikasi perangkat dalam cache yang sudah ada, tetapi tidak membuat identitas perangkat atau status pemasangan pertama kali.
    - Kode keluar bukan nol hanya ketika tidak ada target yang diprobe dapat dijangkau.

  </Accordion>
  <Accordion title="Keluaran JSON">
    Tingkat atas:

    - `ok`: setidaknya satu target dapat dijangkau.
    - `degraded`: setidaknya satu target menerima koneksi tetapi tidak menyelesaikan diagnostik RPC detail lengkap.
    - `capability`: kapabilitas terbaik yang terlihat di seluruh target yang dapat dijangkau (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, atau `unknown`).
    - `primaryTargetId`: target terbaik untuk diperlakukan sebagai pemenang aktif, dengan urutan: URL eksplisit, tunnel SSH, remote yang dikonfigurasi, loopback lokal.
    - `warnings[]`: catatan peringatan upaya terbaik dengan `code`, `message`, dan `targetIds` opsional.
    - `network`: petunjuk URL loopback/tailnet lokal yang diturunkan dari konfigurasi saat ini dan jaringan host.
    - `discovery.timeoutMs` / `discovery.count`: anggaran penemuan/jumlah hasil aktual yang digunakan untuk proses probe ini.

    Per target (`targets[].connect`): `ok` (keterjangkauan + klasifikasi terdegradasi), `rpcOk` (RPC detail lengkap berhasil), `scopeLimited` (RPC detail gagal karena cakupan operator tidak tersedia).

    Per target (`targets[].auth`): `role` dan `scopes` dilaporkan dalam `hello-ok` jika tersedia, ditambah klasifikasi `capability` yang ditampilkan.

  </Accordion>
  <Accordion title="Kode peringatan umum">
    - `ssh_tunnel_failed`: penyiapan tunnel SSH gagal; perintah beralih kembali ke probe langsung.
    - `multiple_gateways`: identitas gateway yang berbeda dapat dijangkau, atau OpenClaw tidak dapat membuktikan bahwa target yang dapat dijangkau merupakan gateway yang sama. Tunnel SSH, URL proksi, atau URL remote yang dikonfigurasi ke gateway yang sama tidak memicu hal ini.
    - `auth_secretref_unresolved`: SecretRef autentikasi yang dikonfigurasi tidak dapat diuraikan untuk target yang gagal.
    - `probe_scope_limited`: koneksi WebSocket berhasil, tetapi probe baca dibatasi karena `operator.read` tidak tersedia.
    - `local_tls_runtime_unavailable`: TLS Gateway lokal diaktifkan, tetapi OpenClaw tidak dapat memuat sidik jari sertifikat lokal.

  </Accordion>
</AccordionGroup>

#### Remote melalui SSH (setara dengan aplikasi Mac)

Mode "Remote over SSH" pada aplikasi macOS menggunakan penerusan port lokal agar gateway remote yang hanya menggunakan loopback dapat dijangkau di `ws://127.0.0.1:<port>`.

Padanan CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` atau `user@host:port` (port secara default adalah `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Berkas identitas.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Pilih host gateway pertama yang ditemukan sebagai target SSH dari endpoint penemuan yang telah diuraikan (`local.` ditambah domain area luas yang dikonfigurasi, jika ada). Petunjuk yang hanya berupa TXT diabaikan.
</ParamField>

Default konfigurasi (opsional): `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`.

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
  Anggaran batas waktu.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Terutama untuk RPC bergaya agen yang mengalirkan peristiwa perantara sebelum payload akhir.
</ParamField>
<ParamField path="--json" type="boolean">
  Keluaran JSON yang dapat dibaca mesin.
</ParamField>

<Note>
`--params` harus berupa JSON yang valid, dan setiap metode memvalidasi bentuk parameternya sendiri (bidang tambahan/salah nama ditolak).
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

Gunakan `--wrapper` ketika layanan terkelola harus dimulai melalui executable lain, misalnya shim pengelola rahasia atau pembantu run-as. Wrapper menerima argumen Gateway normal dan bertanggung jawab untuk pada akhirnya menjalankan exec pada `openclaw` atau Node dengan argumen tersebut.

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

Anda juga dapat menetapkan wrapper melalui lingkungan. `gateway install` memvalidasi bahwa path tersebut adalah berkas yang dapat dieksekusi, menulis wrapper ke dalam `ProgramArguments` layanan, dan mempertahankan `OPENCLAW_WRAPPER` dalam lingkungan layanan untuk instalasi ulang paksa, pembaruan, dan perbaikan doctor berikutnya.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Untuk menghapus wrapper yang tersimpan, kosongkan `OPENCLAW_WRAPPER` saat menginstal ulang:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Opsi perintah">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node>` (default: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--force`, `--json`

  </Accordion>
  <Accordion title="Perilaku siklus hidup">
    - `gateway start` bersifat idempoten: saat layanan terkelola sudah berjalan, perintah ini melaporkan proses yang berjalan dan membiarkannya tanpa perubahan. Layanan yang dimuat tetapi dihentikan akan dimulai seperti sebelumnya.
    - Gunakan `gateway restart` untuk memulai ulang layanan terkelola. Jangan merangkai `gateway stop` dan `gateway start` sebagai pengganti mulai ulang.
    - Dalam shell noninteraktif, `gateway stop` memerlukan `--force`. Terminal interaktif mempertahankan perilaku yang ada tanpa perintah konfirmasi. Untuk otomatisasi dan pengujian, utamakan `gateway run --dev` atau `--profile` yang terisolasi dengan port kosong.
    - Di macOS, `gateway stop` menggunakan `launchctl bootout` secara default, yang menghapus LaunchAgent dari sesi boot saat ini tanpa menyimpan status penonaktifan — pemulihan otomatis KeepAlive tetap aktif untuk kegagalan mendatang dan `gateway start` mengaktifkannya kembali dengan bersih tanpa `launchctl enable` manual. Teruskan `--disable` untuk terus menekan KeepAlive dan RunAtLoad agar Gateway tidak muncul kembali hingga `gateway start` eksplisit berikutnya; gunakan ini saat penghentian manual harus tetap berlaku setelah boot ulang.
    - Mutasi siklus hidup Gateway menambahkan catatan audit pasangan kunci-nilai dengan upaya terbaik ke `<state-dir>/logs/gateway-restart.log`, termasuk operasi mulai, hentikan, dan mulai ulang CLI, permintaan mulai ulang aman, mulai ulang supervisor, serta serah terima terpisah.
    - Perintah siklus hidup menerima `--json` untuk pembuatan skrip.

  </Accordion>
  <Accordion title="Penentuan ukuran heap Gateway terkelola">
    - `gateway install` menulis nilai `NODE_OPTIONS` khusus heap untuk layanan Gateway terkelola. Nilainya menargetkan 50% dari memori yang dibatasi saat Node melaporkan batas kontainer atau layanan, atau 50% dari memori fisik jika tidak.
    - Rentang target nominal adalah 2048–8192 MiB, dengan batas tambahan ruang cadangan native sebesar 75%. Pada host kecil, batas ruang cadangan tersebut dapat membuat batas yang diterapkan berada di bawah batas bawah nominal 2048 MiB.
    - Nilai eksplisit `--max-old-space-size` yang valid dan sudah tersimpan dalam layanan yang terinstal dipertahankan selama penginstalan ulang paksa dan perbaikan doctor. Flag `NODE_OPTIONS` lainnya tidak dibawa ke layanan terkelola.
    - `NODE_OPTIONS` dari lingkungan shell tidak menggantikan kebijakan ini. Gunakan `gateway status` atau `doctor` untuk memeriksa nilai yang terinstal; jalankan `openclaw gateway install --force` untuk membuat ulang metadata layanan lama yang tidak memiliki pengaturan heap terkelola.
    - Kebijakan ini hanya berlaku untuk layanan Gateway terkelola. `gateway run` latar depan, layanan node, dan unit supervisor yang ditulis secara manual mempertahankan konfigurasi runtime masing-masing.

  </Accordion>
  <Accordion title="Autentikasi dan SecretRef pada waktu penginstalan">
    - Saat autentikasi token memerlukan token dan `gateway.auth.token` dikelola oleh SecretRef, `gateway install` memvalidasi bahwa SecretRef dapat diresolusi, tetapi tidak menyimpan token yang diresolusi ke dalam metadata lingkungan layanan.
    - Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi tidak dapat diresolusi, penginstalan gagal secara tertutup, alih-alih menyimpan teks biasa cadangan.
    - Untuk autentikasi kata sandi pada `gateway run`, utamakan `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, atau `gateway.auth.password` yang didukung SecretRef daripada `--password` sebaris.
    - Dalam mode autentikasi yang disimpulkan, `OPENCLAW_GATEWAY_PASSWORD` yang hanya tersedia di shell tidak melonggarkan persyaratan token penginstalan; gunakan konfigurasi persisten (`gateway.auth.password` atau konfigurasi `env`) saat menginstal layanan terkelola.
    - Jika `gateway.auth.token` dan `gateway.auth.password` dikonfigurasi sementara `gateway.auth.mode` tidak ditetapkan, penginstalan diblokir hingga mode ditetapkan secara eksplisit.

  </Accordion>
</AccordionGroup>

## Menemukan Gateway (Bonjour)

`gateway discover` memindai beacon Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour area luas): pilih domain (contoh: `openclaw.internal.`) dan siapkan DNS terpisah + server DNS; lihat [Bonjour](/id/gateway/bonjour).

Hanya Gateway dengan penemuan Bonjour diaktifkan (default) yang mengiklankan beacon.

Petunjuk TXT pada setiap beacon: `role` (petunjuk peran Gateway), `transport` (petunjuk transportasi, misalnya `gateway`), `gatewayPort` (port WebSocket, biasanya `18789`), `tailnetDns` (nama host MagicDNS, jika tersedia), `gatewayTls` / `gatewayTlsSha256` (TLS diaktifkan + sidik jari sertifikat). `sshPort` dan `cliPath` hanya dipublikasikan dalam mode penemuan penuh (`discovery.mdns.mode: "full"`; default-nya adalah `"minimal"`, yang menghilangkannya — klien kemudian menetapkan target SSH secara default ke port `22`).

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
- Memindai `local.` ditambah domain area luas yang dikonfigurasi jika diaktifkan.
- `wsUrl` dalam keluaran JSON berasal dari titik akhir layanan yang diresolusi, bukan dari petunjuk khusus TXT seperti `lanHost` atau `tailnetDns`.
- `discovery.mdns.mode` mengontrol publikasi `sshPort`/`cliPath` pada mDNS `local.` dan DNS-SD area luas (lihat di atas).

</Note>

## Terkait

- [Referensi CLI](/id/cli)
- [Panduan operasional Gateway](/id/gateway)
