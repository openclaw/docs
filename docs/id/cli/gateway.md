---
read_when:
    - Menjalankan Gateway dari CLI (pengembangan atau server)
    - Men-debug autentikasi Gateway, mode bind, dan konektivitas
    - Menemukan Gateway melalui Bonjour (lokal + DNS-SD area luas)
sidebarTitle: Gateway
summary: CLI Gateway OpenClaw (`openclaw gateway`) — jalankan, kueri, dan temukan Gateway
title: Gateway
x-i18n:
    generated_at: "2026-07-12T14:05:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75f8f4bebe585b213f486f08bf20015aeb89ca4d179f6d96c1008ec9d1cd00ea
    source_path: cli/gateway.md
    workflow: 16
---

Gateway adalah server WebSocket OpenClaw (kanal, node, sesi, hook). Semua subperintah di bawah berada di bawah `openclaw gateway ...`.

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
openclaw gateway run   # bentuk eksplisit yang setara
```

<AccordionGroup>
  <Accordion title="Perilaku saat memulai">
    - Menolak dimulai kecuali `gateway.mode=local` ditetapkan dalam `~/.openclaw/openclaw.json`. Gunakan `--allow-unconfigured` untuk menjalankan secara ad hoc/pengembangan; opsi ini melewati pengaman tanpa menulis atau memperbaiki konfigurasi.
    - `openclaw onboard --mode local` dan `openclaw setup` menulis `gateway.mode=local`. Jika berkas konfigurasi ada tetapi `gateway.mode` tidak tersedia, hal tersebut dianggap sebagai konfigurasi yang rusak/tertimpa dan Gateway menolak menebak `local` untuk Anda — jalankan kembali orientasi awal, tetapkan kunci secara manual, atau berikan `--allow-unconfigured`.
    - Pengikatan di luar loopback tanpa autentikasi diblokir.
    - Nilai `--bind` `lan`, `tailnet`, dan `custom` saat ini diresolusikan hanya melalui jalur IPv4; penyiapan host milik sendiri yang hanya menggunakan IPv6 memerlukan sidecar IPv4 atau proksi di depan Gateway.
    - `SIGUSR1` memicu mulai ulang dalam proses jika diizinkan. `commands.restart` (bawaan: diaktifkan) mengontrol `SIGUSR1` yang dikirim secara eksternal; tetapkan ke `false` untuk memblokir mulai ulang manual melalui sinyal OS sambil tetap mengizinkan mulai ulang melalui perintah `gateway restart`, alat gateway, dan penerapan/pembaruan konfigurasi.
    - `SIGINT`/`SIGTERM` menghentikan proses tetapi tidak memulihkan keadaan terminal khusus — jika Anda membungkus CLI dalam TUI atau masukan mode mentah, pulihkan sendiri terminal sebelum keluar.

  </Accordion>
</AccordionGroup>

### Opsi

<ParamField path="--port <port>" type="number">
  Porta WebSocket (bawaan dari konfigurasi/variabel lingkungan; biasanya `18789`).
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
  Membaca kata sandi Gateway dari berkas.
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Eksposur Tailscale: `off`, `serve`, `funnel`.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Mengatur ulang konfigurasi serve/funnel Tailscale saat dimatikan.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Memulai tanpa mewajibkan `gateway.mode=local`. Hanya untuk bootstrap ad hoc/pengembangan; tidak menyimpan atau memperbaiki konfigurasi.
</ParamField>
<ParamField path="--dev" type="boolean">
  Membuat konfigurasi + ruang kerja pengembangan jika belum ada (melewati `BOOTSTRAP.md`).
</ParamField>
<ParamField path="--reset" type="boolean">
  Mengatur ulang konfigurasi pengembangan, kredensial, sesi, dan ruang kerja. Memerlukan `--dev`.
</ParamField>
<ParamField path="--force" type="boolean">
  Menghentikan semua listener yang ada pada porta target sebelum memulai.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Pencatatan log terperinci ke stdout/stderr.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Hanya menampilkan log backend CLI di konsol (juga mengaktifkan stdout/stderr).
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  Gaya log WebSocket: `auto`, `full`, `compact`.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias untuk `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Mencatat peristiwa aliran model mentah ke JSONL.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Jalur JSONL aliran mentah.
</ParamField>

`--claude-cli-logs` adalah alias usang untuk `--cli-backend-logs`.

Untuk `--bind custom`, tetapkan `gateway.customBindHost` ke alamat IPv4. Semua alamat selain `127.0.0.1` atau `0.0.0.0` juga memerlukan `127.0.0.1` pada porta yang sama untuk klien pada host yang sama; proses memulai gagal jika salah satu listener tidak dapat mengikat. Wildcard `0.0.0.0` tidak menambahkan alias wajib yang terpisah. Penyiapan host milik sendiri yang hanya menggunakan IPv6 memerlukan sidecar IPv4 atau proksi di depan Gateway.

## Memulai Ulang Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` meminta Gateway yang sedang berjalan untuk memeriksa lebih dahulu pekerjaan aktif dan menjadwalkan satu mulai ulang tergabung setelah pekerjaan tersebut selesai. Waktu tunggu dibatasi oleh `gateway.reload.deferralTimeoutMs` (bawaan: 5 menit / `300000`); saat anggaran waktu habis, mulai ulang dipaksakan. Tetapkan `deferralTimeoutMs: 0` untuk menunggu tanpa batas waktu (dengan peringatan berkala bahwa pekerjaan masih tertunda), alih-alih memaksakan. `--safe` tidak dapat digabungkan dengan `--force` atau `--wait`.

`--skip-deferral` melewati pengaman penundaan pekerjaan aktif pada mulai ulang aman, sehingga Gateway segera dimulai ulang meskipun ada pemblokir yang dilaporkan. Opsi ini memerlukan `--safe` — gunakan saat penundaan macet karena tugas yang berjalan tak terkendali.

`--wait <duration>` mengganti anggaran pengurasan untuk mulai ulang biasa (tidak aman). Menerima milidetik tanpa akhiran atau akhiran satuan `ms`, `s`, `m`, `h`, `d` (misalnya `30s`, `5m`, `1h30m`); `--wait 0` menunggu tanpa batas waktu. Tidak kompatibel dengan `--force` atau `--safe`.

`--force` melewati pengurasan pekerjaan aktif dan segera memulai ulang. `restart` biasa (tanpa flag) mempertahankan perilaku mulai ulang pengelola layanan yang ada.

<Warning>
`--password` sebaris dapat terekspos dalam daftar proses lokal. Utamakan `--password-file`, variabel lingkungan, atau `gateway.auth.password` yang didukung SecretRef.
</Warning>

### Pemrofilan Gateway

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` mencatat pengaturan waktu fase selama proses memulai, termasuk penundaan `eventLoopMax` per fase dan pengaturan waktu tabel pencarian plugin (indeks terpasang, registri manifes, perencanaan proses memulai, pekerjaan peta pemilik).
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` mencatat baris `restart trace:` yang cakupannya terbatas pada mulai ulang: penanganan sinyal, pengurasan pekerjaan aktif, fase pematian, proses memulai berikutnya, waktu kesiapan, dan metrik memori.
- `OPENCLAW_DIAGNOSTICS=timeline` dengan `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` menulis linimasa diagnostik proses memulai dalam JSONL secara upaya terbaik untuk harness QA eksternal (setara dengan konfigurasi `diagnostics.flags: ["timeline"]`; jalur tetap hanya dapat ditetapkan melalui variabel lingkungan). Tambahkan `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` untuk menyertakan sampel loop peristiwa.
- `pnpm build` lalu `pnpm test:startup:gateway -- --runs 5 --warmup 1` mengukur kinerja proses memulai Gateway terhadap entri CLI hasil build: keluaran proses pertama, `/healthz`, `/readyz`, pengaturan waktu jejak proses memulai, penundaan loop peristiwa, dan pengaturan waktu tabel pencarian plugin.
- `pnpm build` lalu `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` mengukur kinerja mulai ulang dalam proses pada macOS atau Linux (tidak didukung pada Windows; mulai ulang memerlukan `SIGUSR1`). Menggunakan `SIGUSR1`, mengaktifkan kedua jejak dalam proses anak, dan merekam `/healthz` berikutnya, `/readyz` berikutnya, waktu henti, waktu kesiapan, CPU, RSS, dan metrik jejak mulai ulang.
- `/healthz` menunjukkan bahwa proses hidup; `/readyz` menunjukkan kesiapan untuk digunakan. Perlakukan baris jejak dan keluaran tolok ukur sebagai sinyal atribusi pemilik, bukan kesimpulan kinerja lengkap dari satu rentang atau sampel.

## Mengueri Gateway yang Sedang Berjalan

Semua perintah kueri menggunakan RPC WebSocket.

<Tabs>
  <Tab title="Mode keluaran">
    - Bawaan: mudah dibaca manusia (berwarna dalam TTY).
    - `--json`: JSON yang dapat dibaca mesin (tanpa gaya/spinner).
    - `--no-color` (atau `NO_COLOR=1`): menonaktifkan ANSI sambil mempertahankan tata letak yang mudah dibaca manusia.

  </Tab>
  <Tab title="Opsi bersama">
    - `--url <url>`: URL WebSocket Gateway.
    - `--token <token>`: token Gateway.
    - `--password <password>`: kata sandi Gateway.
    - `--timeout <ms>`: batas waktu/anggaran (bawaan berbeda-beda untuk setiap perintah; lihat setiap perintah di bawah).
    - `--expect-final`: menunggu respons "final" (panggilan agen).

  </Tab>
</Tabs>

<Note>
Saat Anda menetapkan `--url`, CLI tidak menggunakan kredensial dari konfigurasi atau variabel lingkungan sebagai fallback. Berikan `--token` atau `--password` secara eksplisit. Tidak adanya kredensial eksplisit merupakan kesalahan.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` adalah probe keaktifan: probe ini kembali segera setelah server dapat menjawab HTTP. `/readyz` lebih ketat dan tetap merah selama sidecar plugin proses memulai, kanal, atau hook yang dikonfigurasi masih dalam proses stabilisasi. Respons terperinci `/readyz` yang bersifat lokal atau terautentikasi menyertakan blok diagnostik `eventLoop` (penundaan, utilisasi, rasio inti CPU, flag `degraded`).

<ParamField path="--port <port>" type="number">
  Menargetkan Gateway local loopback pada porta ini. Mengganti `OPENCLAW_GATEWAY_URL` dan `OPENCLAW_GATEWAY_PORT` untuk panggilan ini.
</ParamField>

### `gateway usage-cost`

Mengambil ringkasan biaya penggunaan dari log sesi.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Jumlah hari yang disertakan.
</ParamField>
<ParamField path="--agent <id>" type="string">
  Membatasi ringkasan ke satu ID agen yang dikonfigurasi.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Mengagregasikan semua agen yang dikonfigurasi. Tidak dapat digabungkan dengan `--agent`.
</ParamField>

### `gateway stability`

Mengambil perekam stabilitas diagnostik terbaru dari Gateway yang sedang berjalan.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Jumlah maksimum peristiwa terbaru yang disertakan (maksimum `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Memfilter berdasarkan jenis peristiwa diagnostik, misalnya `payload.large` atau `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Hanya menyertakan peristiwa setelah nomor urutan diagnostik.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Membaca bundel stabilitas tersimpan alih-alih memanggil Gateway yang sedang berjalan. `--bundle latest` (atau `--bundle` tanpa nilai) memilih bundel terbaru di bawah direktori keadaan; Anda juga dapat memberikan jalur JSON bundel secara langsung.
</ParamField>
<ParamField path="--export" type="boolean">
  Menulis zip diagnostik dukungan yang dapat dibagikan alih-alih mencetak detail stabilitas.
</ParamField>
<ParamField path="--output <path>" type="string">
  Jalur keluaran untuk `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Perilaku privasi dan bundel">
    - Rekaman mempertahankan metadata operasional: nama peristiwa, hitungan, ukuran byte, pembacaan memori, keadaan antrean/sesi, ID persetujuan, nama kanal/plugin, dan ringkasan sesi yang disunting. Rekaman tidak menyertakan teks obrolan, isi webhook, keluaran alat, isi permintaan/respons mentah, token, kuki, nilai rahasia, nama host, dan ID sesi mentah. Tetapkan `diagnostics.enabled: false` untuk menonaktifkan perekam sepenuhnya.
    - Penghentian fatal Gateway, batas waktu pematian, dan kegagalan proses memulai saat mulai ulang menulis snapshot diagnostik yang sama ke `~/.openclaw/logs/stability/openclaw-stability-*.json` jika perekam memiliki peristiwa. Periksa bundel terbaru dengan `openclaw gateway stability --bundle latest`; `--limit`, `--type`, dan `--since-seq` juga berlaku untuk keluaran bundel.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Menulis zip diagnostik lokal yang dirancang untuk laporan bug. Untuk model privasi dan isi bundel, lihat [Ekspor Diagnostik](/id/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Jalur keluaran zip. Secara default menggunakan ekspor dukungan di bawah direktori status.
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

Ekspor membundel: `manifest.json` (inventaris berkas), `summary.md` (ringkasan Markdown), `diagnostics.json` (ringkasan tingkat teratas untuk konfigurasi/log/penemuan/stabilitas/status/kesehatan), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl`, dan `stability/latest.json` jika terdapat bundel.

Ekspor ini dirancang untuk dibagikan. Ekspor mempertahankan detail operasional yang berguna untuk pengawakutuan — kolom log yang aman, nama subsistem, kode status, durasi, mode yang dikonfigurasi, port, ID plugin/penyedia, pengaturan fitur nonrahasia, dan pesan log operasional yang disunting — serta menghilangkan atau menyunting teks percakapan, isi webhook, keluaran alat, kredensial, kuki, pengidentifikasi akun/pesan, teks prompt/instruksi, nama host, dan nilai rahasia. Ketika pesan log tampak seperti teks muatan pengguna/percakapan/alat (misalnya "pengguna berkata", "teks percakapan", "keluaran alat", "isi webhook"), ekspor hanya mempertahankan fakta bahwa sebuah pesan dihilangkan beserta jumlah byte-nya.

### `gateway status`

Menampilkan layanan Gateway (launchd/systemd/schtasks) beserta pemeriksaan opsional konektivitas/autentikasi.

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
  Lewati pemeriksaan konektivitas (tampilan khusus layanan).
</ParamField>
<ParamField path="--deep" type="boolean">
  Pindai juga layanan tingkat sistem.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Tingkatkan pemeriksaan konektivitas menjadi pemeriksaan baca dan keluar dengan kode bukan nol jika gagal. Tidak dapat digabungkan dengan `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantik status">
    - Tetap tersedia untuk diagnostik meskipun konfigurasi CLI lokal tidak ada atau tidak valid.
    - Keluaran default membuktikan status layanan, koneksi WebSocket, dan kapabilitas autentikasi yang terlihat saat proses jabat tangan — bukan operasi baca/tulis/admin.
    - Pemeriksaan tidak melakukan mutasi untuk autentikasi perangkat pertama kali: pemeriksaan menggunakan kembali token perangkat tersimpan yang sudah ada, tetapi tidak pernah membuat identitas perangkat CLI atau rekaman pemasangan hanya-baca baru sekadar untuk memeriksa status.
    - Menyelesaikan SecretRef autentikasi yang dikonfigurasi untuk autentikasi pemeriksaan jika memungkinkan. Jika SecretRef yang diperlukan tidak terselesaikan, `--json` melaporkan `rpc.authWarning` ketika konektivitas/autentikasi pemeriksaan gagal; teruskan `--token`/`--password` secara eksplisit atau perbaiki sumber rahasianya. Peringatan autentikasi yang tidak terselesaikan disembunyikan setelah pemeriksaan berhasil.
    - Keluaran JSON menyertakan `gateway.version` ketika Gateway yang berjalan melaporkannya; `--require-rpc` dapat beralih ke muatan RPC `status.runtimeVersion` jika pemeriksaan jabat tangan tidak dapat menyediakan metadata versi.
    - Gunakan `--require-rpc` dalam skrip/otomasi ketika layanan yang mendengarkan saja tidak cukup dan RPC cakupan-baca juga harus sehat.
    - `--deep` memindai pemasangan launchd/systemd/schtasks tambahan; ketika ditemukan beberapa layanan mirip Gateway, keluaran yang mudah dibaca manusia menampilkan petunjuk pembersihan (biasanya jalankan satu Gateway per mesin) dan melaporkan serah-terima mulai ulang supervisor terbaru jika relevan.
    - `--deep` juga menjalankan validasi konfigurasi dalam mode sadar-plugin (`pluginValidation: "full"`) dan menampilkan peringatan manifes plugin (misalnya metadata konfigurasi kanal yang tidak ada). `gateway status` default mempertahankan jalur hanya-baca cepat yang melewati validasi plugin.
    - Keluaran yang mudah dibaca manusia menyertakan jalur log berkas yang telah diselesaikan beserta jalur/validitas konfigurasi CLI dibandingkan layanan untuk membantu mendiagnosis penyimpangan profil atau direktori status.

  </Accordion>
  <Accordion title="Pemeriksaan penyimpangan autentikasi systemd Linux">
    - Pemeriksaan penyimpangan autentikasi layanan membaca `Environment=` dan `EnvironmentFile=` dari unit (termasuk `%h`, jalur dalam tanda kutip, beberapa berkas, dan berkas opsional `-`).
    - Menyelesaikan SecretRef `gateway.auth.token` menggunakan lingkungan runtime gabungan (lingkungan perintah layanan terlebih dahulu, lalu lingkungan proses sebagai alternatif).
    - Pemeriksaan penyimpangan token melewati penyelesaian token konfigurasi ketika autentikasi token tidak aktif secara efektif (`gateway.auth.mode` secara eksplisit bernilai `password`/`none`/`trusted-proxy`, atau mode tidak ditetapkan ketika kata sandi dapat diprioritaskan dan tidak ada kandidat token yang dapat diprioritaskan).

  </Accordion>
</AccordionGroup>

### `gateway probe`

Perintah "awakutu semuanya". Perintah ini selalu memeriksa:

- Gateway remote yang Anda konfigurasi (jika ditetapkan), dan
- localhost (loopback), **meskipun remote dikonfigurasi**.

Meneruskan `--url` akan menambahkan target eksplisit tersebut sebelum keduanya. Keluaran yang mudah dibaca manusia memberi label target `URL (eksplisit)`, `Remote (dikonfigurasi)` / `Remote (dikonfigurasi, tidak aktif)`, dan `Local loopback`.

<Note>
Jika beberapa target pemeriksaan dapat dijangkau, semuanya dicetak. Terowongan SSH, URL TLS/proksi, dan URL remote yang dikonfigurasi dapat mengarah ke Gateway yang sama meskipun menggunakan port transportasi berbeda; `multiple_gateways` dikhususkan untuk Gateway yang dapat dijangkau tetapi berbeda atau identitasnya ambigu. Menjalankan beberapa Gateway didukung untuk profil yang terisolasi (misalnya bot pemulihan), tetapi sebagian besar pemasangan menjalankan satu Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Gunakan port ini untuk target pemeriksaan local loopback dan port remote terowongan SSH. Tanpa `--url`, opsi ini hanya memilih target local loopback, bukan URL lingkungan Gateway yang dikonfigurasi, port lingkungan, atau target remote.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretasi">
    - `Reachable: yes` berarti setidaknya satu target menerima koneksi WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` melaporkan hal yang dapat dibuktikan pemeriksaan tentang autentikasi, terpisah dari keterjangkauan.
    - `Read probe: ok` berarti panggilan RPC detail cakupan-baca (`health`/`status`/`system-presence`/`config.get`) juga berhasil.
    - `Read probe: limited - missing scope: operator.read` berarti koneksi berhasil tetapi RPC cakupan-baca terbatas. Dilaporkan sebagai keterjangkauan **menurun**, bukan kegagalan penuh.
    - `Read probe: failed` setelah `Connect: ok` berarti WebSocket terhubung tetapi diagnostik baca lanjutan mencapai batas waktu atau gagal — juga **menurun**, bukan tidak terjangkau.
    - Seperti `gateway status`, pemeriksaan menggunakan kembali autentikasi perangkat tersimpan yang ada, tetapi tidak membuat identitas perangkat atau status pemasangan pertama kali.
    - Kode keluar bukan nol hanya ketika tidak ada target yang diperiksa dapat dijangkau.

  </Accordion>
  <Accordion title="Keluaran JSON">
    Tingkat teratas:

    - `ok`: setidaknya satu target dapat dijangkau.
    - `degraded`: setidaknya satu target menerima koneksi tetapi tidak menyelesaikan diagnostik RPC detail sepenuhnya.
    - `capability`: kapabilitas terbaik yang terlihat di antara target yang dapat dijangkau (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, atau `unknown`).
    - `primaryTargetId`: target terbaik yang dianggap sebagai pemenang aktif, dengan urutan: URL eksplisit, terowongan SSH, remote yang dikonfigurasi, local loopback.
    - `warnings[]`: rekaman peringatan upaya terbaik dengan `code`, `message`, dan `targetIds` opsional.
    - `network`: petunjuk URL local loopback/tailnet yang diturunkan dari konfigurasi saat ini dan jaringan host.
    - `discovery.timeoutMs` / `discovery.count`: anggaran/jumlah hasil penemuan aktual yang digunakan untuk tahap pemeriksaan ini.

    Per target (`targets[].connect`): `ok` (klasifikasi keterjangkauan + kondisi menurun), `rpcOk` (keberhasilan RPC detail penuh), `scopeLimited` (RPC detail gagal karena cakupan operator tidak ada).

    Per target (`targets[].auth`): `role` dan `scopes` yang dilaporkan dalam `hello-ok` jika tersedia, beserta klasifikasi `capability` yang ditampilkan.

  </Accordion>
  <Accordion title="Kode peringatan umum">
    - `ssh_tunnel_failed`: Penyiapan terowongan SSH gagal; perintah beralih ke pemeriksaan langsung.
    - `multiple_gateways`: Identitas Gateway yang berbeda dapat dijangkau, atau OpenClaw tidak dapat membuktikan bahwa target yang dapat dijangkau merupakan Gateway yang sama. Terowongan SSH, URL proksi, atau URL remote yang dikonfigurasi ke Gateway yang sama tidak memicu ini.
    - `auth_secretref_unresolved`: SecretRef autentikasi yang dikonfigurasi tidak dapat diselesaikan untuk target yang gagal.
    - `probe_scope_limited`: Koneksi WebSocket berhasil, tetapi pemeriksaan baca dibatasi karena `operator.read` tidak ada.
    - `local_tls_runtime_unavailable`: TLS Gateway lokal diaktifkan tetapi OpenClaw tidak dapat memuat sidik jari sertifikat lokal.

  </Accordion>
</AccordionGroup>

#### Remote melalui SSH (setara dengan aplikasi Mac)

Mode "Remote over SSH" pada aplikasi macOS menggunakan penerusan port lokal agar Gateway remote khusus-loopback dapat dijangkau di `ws://127.0.0.1:<port>`.

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
  Pilih host Gateway pertama yang ditemukan sebagai target SSH dari titik akhir penemuan yang telah diselesaikan (`local.` beserta domain area luas yang dikonfigurasi, jika ada). Petunjuk khusus TXT diabaikan.
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
  Terutama untuk RPC bergaya agen yang mengalirkan peristiwa perantara sebelum muatan akhir.
</ParamField>
<ParamField path="--json" type="boolean">
  Keluaran JSON yang dapat dibaca mesin.
</ParamField>

<Note>
`--params` harus berupa JSON yang valid, dan setiap metode memvalidasi bentuk parameternya sendiri (kolom tambahan/salah nama ditolak).
</Note>

## Kelola layanan Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Pasang dengan pembungkus

Gunakan `--wrapper` ketika layanan terkelola harus dimulai melalui program lain yang dapat dieksekusi, misalnya shim pengelola rahasia atau pembantu untuk menjalankan sebagai pengguna tertentu. Pembungkus menerima argumen Gateway normal dan bertanggung jawab untuk pada akhirnya mengeksekusi `openclaw` atau Node dengan argumen tersebut.

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

Anda juga dapat mengatur pembungkus melalui lingkungan. `gateway install` memvalidasi bahwa jalur tersebut adalah berkas yang dapat dieksekusi, menulis pembungkus ke dalam `ProgramArguments` layanan, dan mempertahankan `OPENCLAW_WRAPPER` di lingkungan layanan untuk penginstalan ulang paksa, pembaruan, dan perbaikan oleh doctor di kemudian hari.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Untuk menghapus pembungkus yang dipertahankan, kosongkan `OPENCLAW_WRAPPER` saat menginstal ulang:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Opsi perintah">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>` (bawaan: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Perilaku siklus hidup">
    - Gunakan `gateway restart` untuk memulai ulang layanan terkelola. Jangan merangkai `gateway stop` dan `gateway start` sebagai pengganti pemulaian ulang.
    - Di macOS, `gateway stop` menggunakan `launchctl bootout` secara bawaan, yang menghapus LaunchAgent dari sesi boot saat ini tanpa mempertahankan status nonaktif — pemulihan otomatis KeepAlive tetap aktif untuk kerusakan mendatang dan `gateway start` mengaktifkannya kembali dengan benar tanpa `launchctl enable` manual. Berikan `--disable` untuk menonaktifkan KeepAlive dan RunAtLoad secara permanen agar Gateway tidak aktif kembali hingga `gateway start` berikutnya dijalankan secara eksplisit; gunakan ini jika penghentian manual harus tetap berlaku setelah boot ulang.
    - Perintah siklus hidup menerima `--json` untuk pembuatan skrip.

  </Accordion>
  <Accordion title="Autentikasi dan SecretRef saat penginstalan">
    - Ketika autentikasi token memerlukan token dan `gateway.auth.token` dikelola oleh SecretRef, `gateway install` memvalidasi bahwa SecretRef dapat diuraikan, tetapi tidak mempertahankan token yang telah diuraikan ke dalam metadata lingkungan layanan.
    - Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi tidak dapat diuraikan, penginstalan gagal secara tertutup alih-alih mempertahankan teks biasa cadangan.
    - Untuk autentikasi kata sandi pada `gateway run`, utamakan `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, atau `gateway.auth.password` yang didukung SecretRef daripada `--password` sebaris.
    - Dalam mode autentikasi yang disimpulkan, `OPENCLAW_GATEWAY_PASSWORD` yang hanya tersedia di shell tidak melonggarkan persyaratan token penginstalan; gunakan konfigurasi persisten (`gateway.auth.password` atau `env` konfigurasi) saat menginstal layanan terkelola.
    - Jika `gateway.auth.token` dan `gateway.auth.password` keduanya dikonfigurasi dan `gateway.auth.mode` belum diatur, penginstalan diblokir hingga mode diatur secara eksplisit.

  </Accordion>
</AccordionGroup>

## Menemukan Gateway (Bonjour)

`gateway discover` memindai suar Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour area luas): pilih domain (contoh: `openclaw.internal.`) dan siapkan DNS terpisah + server DNS; lihat [Bonjour](/id/gateway/bonjour).

Hanya Gateway dengan penemuan Bonjour yang diaktifkan (bawaan) yang menyiarkan suar.

Petunjuk TXT pada setiap suar: `role` (petunjuk peran Gateway), `transport` (petunjuk transportasi, misalnya `gateway`), `gatewayPort` (port WebSocket, biasanya `18789`), `tailnetDns` (nama host MagicDNS, jika tersedia), `gatewayTls` / `gatewayTlsSha256` (TLS diaktifkan + sidik jari sertifikat). `sshPort` dan `cliPath` hanya dipublikasikan dalam mode penemuan penuh (`discovery.mdns.mode: "full"`; bawaannya adalah `"minimal"`, yang tidak menyertakannya — klien kemudian menggunakan port `22` sebagai bawaan target SSH).

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Batas waktu per perintah (telusuri/uraikan).
</ParamField>
<ParamField path="--json" type="boolean">
  Keluaran yang dapat dibaca mesin (juga menonaktifkan gaya/indikator pemuatan).
</ParamField>

Contoh:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- Memindai `local.` beserta domain area luas yang dikonfigurasi jika diaktifkan.
- `wsUrl` dalam keluaran JSON berasal dari titik akhir layanan yang telah diuraikan, bukan dari petunjuk khusus TXT seperti `lanHost` atau `tailnetDns`.
- `discovery.mdns.mode` mengendalikan publikasi `sshPort`/`cliPath` pada mDNS `local.` dan DNS-SD area luas (lihat di atas).

</Note>

## Terkait

- [Referensi CLI](/id/cli)
- [Panduan operasional Gateway](/id/gateway)
