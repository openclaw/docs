---
read_when:
    - Memasangkan node iOS/watchOS/Android ke Gateway
    - Menggunakan kanvas/kamera Node untuk konteks agen
    - Menambahkan perintah node atau pembantu CLI baru
summary: 'Node: pemasangan, kapabilitas, izin, dan pembantu CLI untuk kanvas/kamera/layar/perangkat/notifikasi/sistem'
title: Node
x-i18n:
    generated_at: "2026-07-19T04:58:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0789bd1f9a855285eab4916a03a347308540e82ea6f3ae26c3653ddf8a4435e8
    source_path: nodes/index.md
    workflow: 16
---

Sebuah **node** adalah perangkat pendamping (macOS/iOS/watchOS/Android/headless) yang terhubung ke Gateway dengan `role: "node"` dan menyediakan permukaan perintah (misalnya `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) melalui `node.invoke`. Sebagian besar node menggunakan WebSocket Gateway pada port operator. Node Apple Watch langsung opsional menggunakan polling HTTPS bertanda tangan pada port yang sama karena watchOS memblokir jaringan tingkat rendah generik untuk aplikasi biasa. Detail protokol: [Protokol Gateway](/id/gateway/protocol).

Transport lama: [Protokol Bridge](/id/gateway/bridge-protocol) (TCP JSONL; hanya untuk riwayat node saat ini).

macOS juga dapat berjalan dalam **mode node**: aplikasi bilah menu terhubung ke server
WS Gateway sebagai satu node (sehingga `openclaw nodes …` berfungsi pada Mac ini). Aplikasi
menambahkan perintah native Canvas, kamera, layar, notifikasi, dan kontrol komputer
ke permukaan perintah host node yang sama dengan yang digunakan oleh `openclaw node run`. Jangan memulai
node CLI kedua pada Mac tersebut; aplikasi menjalankan runtime host node CLI yang sesuai sebagai
pekerja internal dan tetap menjadi satu-satunya koneksi Gateway serta identitas node.

Node adalah **periferal**, bukan gateway: node tidak menjalankan layanan gateway, dan pesan saluran (Telegram, WhatsApp, dll.) tiba di gateway, bukan di node.

Panduan pemecahan masalah: [/nodes/troubleshooting](/id/nodes/troubleshooting)

## Pemasangan + status

Node menggunakan **pemasangan perangkat**. Node menyajikan identitas perangkat bertanda tangan saat terhubung; Gateway membuat permintaan pemasangan perangkat untuk `role: node`. Setujui melalui CLI perangkat (atau UI). Penyiapan Apple Watch langsung menggunakan kode penyiapan khusus node berumur pendek yang dibuat oleh admin untuk menyetujui permukaan perintah tetap berisiko rendah; perluasan kemampuan selanjutnya tetap memerlukan persetujuan normal.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Permintaan pemasangan yang tertunda kedaluwarsa 5 menit setelah percobaan ulang terakhir perangkat — perangkat yang terus terhubung kembali mempertahankan satu permintaan tertundanya (dan `requestId`) tetap aktif alih-alih membuat perintah baru setiap beberapa menit; lihat [Pemasangan node](/id/gateway/pairing) untuk siklus hidup lengkap permintaan/persetujuan. Jika node mencoba ulang dengan detail autentikasi yang berubah (peran/cakupan/kunci publik), permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat — klien menerima peristiwa `device.pair.resolved` untuk permintaan yang digantikan, dan Anda harus menjalankan kembali `openclaw devices list` sebelum menyetujui.

- `nodes status` menandai node sebagai **terpasang** ketika peran pemasangan perangkatnya mencakup `node`.
- Mac native yang terhubung dengan izin Aksesibilitas dapat melaporkan aktivitas
  masukan fisik yang digabungkan. Gateway menandai Mac memenuhi syarat yang paling baru sebagai
  `active`, memberikan petunjuk ID node yang stabil kepada agen, dan merutekan peringatan koneksi
  node ke sana sebelum fallback tertunda. Lihat
  [Kehadiran komputer aktif](/id/nodes/presence) untuk penyiapan, privasi, pengaturan waktu, dan
  pemecahan masalah.
- Catatan pemasangan perangkat adalah kontrak peran yang disetujui dan persisten. Rotasi token tetap berada dalam kontrak tersebut; rotasi tidak dapat meningkatkan node terpasang menjadi peran yang tidak pernah diberikan oleh persetujuan pemasangan.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) adalah penyimpanan pemasangan node terpisah milik gateway yang melacak permukaan perintah/kemampuan node yang disetujui selama koneksi ulang. Penyimpanan ini **tidak** membatasi autentikasi transport — pemasangan perangkat yang melakukannya.
- `openclaw nodes remove --node <id|name|ip>` menghapus pemasangan node. Untuk node berbasis perangkat, tindakan ini mencabut peran `node` perangkat dalam penyimpanan perangkat terpasang dan memutus sesi peran node perangkat tersebut: perangkat dengan beberapa peran mempertahankan barisnya dan hanya kehilangan peran `node`, sedangkan baris perangkat khusus node dihapus. Tindakan ini juga menghapus entri yang cocok dari penyimpanan pemasangan node terpisah. `operator.pairing` dapat menghapus baris node non-operator pada perangkat lain; pemanggil token perangkat yang mencabut peran nodenya sendiri pada perangkat dengan beberapa peran juga memerlukan `operator.admin`.
- Cakupan persetujuan mengikuti perintah yang dideklarasikan oleh permintaan tertunda:
  - permintaan tanpa perintah: `operator.pairing`
  - perintah node non-exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Perbedaan versi dan urutan peningkatan

WebSocket Gateway menerima klien node terautentikasi dalam jendela protokol N-1.
Karena itu, Gateway v4 saat ini menerima node v3 ketika koneksi mendeklarasikan
`role: "node"` dan `client.mode: "node"`. Sesi operator dan UI harus
tetap menggunakan protokol saat ini.

Untuk peningkatan armada bertahap, tingkatkan Gateway terlebih dahulu, lalu tingkatkan setiap node.
Node N-1 tetap terlihat dan dapat dikelola saat ditingkatkan; Gateway
mencatat `legacy node protocol accepted` dengan rekomendasi peningkatan. Pemasangan,
autentikasi perangkat, daftar perintah yang diizinkan, dan persetujuan exec tetap berlaku.
Kemampuan dan perintah milik Plugin tetap disembunyikan hingga node ditingkatkan ke
protokol saat ini. Node yang lebih lama dari N-1 memerlukan peningkatan di luar jalur sebelum
terhubung kembali.

Transport HTTPS watchOS langsung memerlukan versi protokol saat ini; perbarui
aplikasi jam tangan bersama Gateway sebelum mengaktifkan mode langsung.

## Host node jarak jauh (system.run)

Gunakan **host node** ketika Gateway berjalan pada satu mesin dan Anda ingin perintah dieksekusi pada mesin lain. Model tetap berkomunikasi dengan **gateway**; gateway meneruskan panggilan `exec` ke **host node** ketika `host=node` dipilih.

| Peran        | Tanggung jawab                                                   |
| ------------ | ---------------------------------------------------------------- |
| Host Gateway | Menerima pesan, menjalankan model, merutekan panggilan alat.     |
| Host node    | Menjalankan `system.run`/`system.which` pada mesin node.         |
| Persetujuan  | Diberlakukan pada host node melalui `~/.openclaw/exec-approvals.json`. |

Catatan persetujuan:

- Eksekusi node berbasis persetujuan mengikat konteks permintaan yang tepat. Jalur exec menyiapkan `systemRunPlan` kanonis sebelum persetujuan; setelah diberikan, gateway meneruskan rencana tersimpan tersebut, bukan kolom perintah/cwd/sesi yang kemudian diedit pemanggil, dan memvalidasi ulang direktori kerja sebelum menjalankannya.
- Untuk eksekusi file shell/runtime langsung, OpenClaw juga berupaya sebaik mungkin mengikat satu operand file lokal konkret dan menolak eksekusi jika file tersebut berubah sebelum eksekusi.
- Jika OpenClaw tidak dapat mengidentifikasi tepat satu file lokal konkret untuk perintah interpreter/runtime, eksekusi berbasis persetujuan ditolak alih-alih berpura-pura memberikan cakupan runtime penuh. Gunakan sandboxing, host terpisah, atau daftar izin tepercaya eksplisit/alur kerja lengkap untuk semantik interpreter yang lebih luas.

### Memulai host node (latar depan)

Pada mesin node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` juga menerima `--context-path` (jalur konteks WS Gateway), `--tls`, `--tls-fingerprint <sha256>`, dan `--node-id` (mengganti ID instans klien lama; ini tidak mengatur ulang pemasangan). Pada macOS, berikan `--share-installed-apps` untuk mengiklankan `device.apps`; berbagi dinonaktifkan secara default. Gunakan `--no-share-installed-apps` untuk menonaktifkan persetujuan tersimpan sebelumnya.

### Gateway jarak jauh melalui terowongan SSH (pengikatan loopback)

Jika Gateway mengikat ke loopback (`gateway.bind=loopback`, default dalam mode lokal), host node jarak jauh tidak dapat terhubung secara langsung. Buat terowongan SSH dan arahkan host node ke ujung lokal terowongan.

Contoh (host node -> host gateway):

```bash
# Terminal A (biarkan berjalan): teruskan lokal 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: ekspor token gateway dan hubungkan melalui terowongan
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Catatan:

- `openclaw node run` mendukung autentikasi token atau kata sandi.
- Variabel lingkungan lebih disarankan: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Fallback konfigurasi adalah `gateway.auth.token` / `gateway.auth.password`.
- Dalam mode lokal, host node sengaja mengabaikan `gateway.remote.token` / `gateway.remote.password`.
- Dalam mode jarak jauh, `gateway.remote.token` / `gateway.remote.password` memenuhi syarat berdasarkan aturan prioritas jarak jauh.
- Jika SecretRef `gateway.auth.*` lokal aktif dikonfigurasi tetapi tidak terselesaikan, autentikasi host node gagal secara tertutup.
- Resolusi autentikasi host node hanya menerima variabel lingkungan `OPENCLAW_GATEWAY_*`.

### Memulai host node (layanan)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` juga menerima `--context-path`, `--tls`, `--tls-fingerprint`, `--node-id` (hanya ID instans klien lama), `--share-installed-apps` / `--no-share-installed-apps`, `--runtime <node>` (default: node), dan `--force` untuk menginstal ulang. `node status`, `node stop`, dan `node uninstall` juga tersedia.

### Pasangkan + beri nama

Pada host gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Jika node mencoba ulang dengan detail autentikasi yang berubah, jalankan kembali `openclaw devices list` dan setujui `requestId` saat ini.

Opsi penamaan:

- `--display-name` pada `openclaw node run` / `openclaw node install` (dipertahankan dalam baris SQLite `node_host_config` bersama dengan ID instans klien dan metadata koneksi Gateway).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (penggantian gateway).

### Server MCP yang dihost node

Konfigurasikan server MCP dalam `openclaw.json` pada mesin node, bukan pada
Gateway:

```json5
{
  nodeHost: {
    mcp: {
      servers: {
        localDocs: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/srv/docs"],
          toolFilter: {
            include: ["read_*", "search"],
          },
        },
        internalApi: {
          url: "https://mcp.internal.example/mcp",
          transport: "streamable-http",
          headers: {
            Authorization: "Bearer ${INTERNAL_MCP_TOKEN}",
          },
        },
      },
    },
  },
}
```

Host node headless memulai server-server ini, mencantumkan alatnya, dan memublikasikan
deskriptor setelah terhubung. Panggilan alat kembali ke node tersebut melalui
`mcp.tools.call.v1`; Gateway tidak memerlukan konfigurasi MCP yang cocok atau Plugin
JS. Server MCP OAuth tidak didukung oleh jalur v1 yang dihost node ini.

Host node saat ini mendeklarasikan keluarga perintah bawaan `mcp.tools.call.v1` selama
pemasangan awalnya meskipun tidak ada server MCP yang dikonfigurasi. Node yang dipasangkan pada
versi OpenClaw lebih lama dapat meminta peningkatan permukaan perintah satu kali setelah
host node diperbarui. Menambahkan, menghapus, atau memfilter server setelah itu tidak
memerlukan pemasangan ulang karena keluarga perintah yang disetujui tidak berubah. Mulai ulang
`openclaw node run` atau `openclaw node restart` untuk menerapkan perubahan konfigurasi MCP node;
host node tidak memantau konfigurasi ini.

Operator Gateway dapat mengabaikan semua alat yang terlihat oleh agen dan dipublikasikan oleh node terpasang,
termasuk alat MCP yang dihost node, dengan
`gateway.nodes.pluginTools.enabled: false`. Penolakan perintah persis seperti
`gateway.nodes.denyCommands: ["mcp.tools.call.v1"]` juga memblokir eksekusi.

### Skills yang dihost node

Instal Skills di bawah direktori Skills OpenClaw aktif pada mesin node,
`~/.openclaw/skills` secara default. `OPENCLAW_HOME`, `OPENCLAW_STATE_DIR`, dan
`OPENCLAW_CONFIG_PATH` memindahkan profil aktif tersebut. `OPENCLAW_STATE_DIR` lebih
diutamakan untuk Skills; jika tidak, `skills/` berada di samping jalur yang dicetak oleh
`openclaw config file`. Host node headless memublikasikan file `SKILL.md` yang valid
setelah terhubung, dan Gateway menambahkannya ke snapshot Skills agen hanya selama
node tersebut tetap terhubung. Setiap nama direktori Skills harus cocok dengan bidang frontmatter
`name` agar pencari lokasi node abstrak dipetakan ke satu entri tanpa menambahkan
bidang protokol lain.

Pemasangan awal peran node menyetujui publikasi Skills. Menambahkan, menghapus, atau
mengubah Skills tidak memerlukan pemasangan lain atau perubahan konfigurasi Gateway.
Mulai ulang `openclaw node run` atau `openclaw node restart` setelah mengubah
file Skills node; host node tidak memantau direktori Skills.

Entri Skills yang dihosting node mengidentifikasi node-nya dan memuat lokasi
eksekusinya. File Skills, jalur relatif yang dirujuk, dan biner tetap berada di
node tersebut. Agen membaca lokasi `node://.../SKILL.md` yang diiklankan dengan
alat `read` biasa. `file_fetch` menerima jalur node absolut yang disetujui operator,
bukan pencari lokasi Skills node; runtime tanpa alat baca biasa dapat menjalankan
`cat SKILL.md` melalui `exec host=node node=<node-id>` dengan direktori
`node://.../skills/<name>` yang diiklankan sebagai `workdir`. File dan biner yang dirujuk
menggunakan target exec dan workdir yang sama. Host node menyelesaikan pencari lokasi tersebut terhadap
direktori status OpenClaw aktifnya, sehingga jalur relatif diselesaikan pada node, bukan
pada mesin Gateway. Node penerbit harus memiliki `system.run` yang disetujui,
dan kebijakan exec agen harus mengizinkan `host=node`; jika tidak, Skills tersebut tetap
tidak disertakan dalam snapshot agen itu.

Tetapkan `nodeHost.skills.enabled: false` pada node untuk menghentikan publikasi. Operator
Gateway dapat mengabaikan Skills dari setiap node yang dipasangkan dengan
`gateway.nodes.skills.enabled: false`.

### Status identitas headless

Node headless menyimpan tiga catatan status terpisah:

- `~/.openclaw/state/openclaw.sqlite` (`node_host_config`): ID instans klien, nama tampilan, dan metadata koneksi Gateway.
- `~/.openclaw/state/openclaw.sqlite` (`device_identities`, kunci `primary`): pasangan kunci perangkat yang ditandatangani dan ID perangkat kriptografis turunannya.
- `~/.openclaw/identity/device-auth.json`: token autentikasi perangkat yang dipasangkan, dikunci berdasarkan ID perangkat kriptografis dan peran.

Untuk node yang ditandatangani, Gateway menggunakan ID perangkat kriptografis untuk pemasangan dan
perutean node. ID instans klien hanya merupakan metadata koneksi. Karena itu, mengubah
`--node-id` atau memigrasikan `node.json` yang telah dihentikan tidak mengatur ulang pemasangan. Lihat
[Status identitas dan pemasangan](/id/cli/node#identity-and-pairing-state) untuk
alur pencabutan dan pemasangan ulang yang didukung serta catatan peningkatan.

File `identity/device.json` yang telah dihentikan atau klaim Doctor yang terinterupsi memblokir
penggunaan identitas normal. Hentikan host node dan jalankan `openclaw doctor --fix`; Doctor mengimpor
pasangan kunci yang telah divalidasi ke SQLite sebelum menghapus file lama. Migrasi identitas
membiarkan `identity/device-auth.json` tetap tidak berubah.

### Masukkan perintah ke daftar yang diizinkan

Persetujuan exec berlaku **per host node**. Tambahkan entri daftar yang diizinkan dari Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Persetujuan berada pada host node di `~/.openclaw/exec-approvals.json`.

### Arahkan exec ke node

Konfigurasikan default (konfigurasi Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Atau per sesi:

```text
/exec host=node security=allowlist node=<id-or-name>
```

Setelah ditetapkan, setiap panggilan `exec` dengan `host=node` berjalan pada host node (tunduk pada daftar yang diizinkan/persetujuan node).

`host=auto` tidak akan secara implisit memilih node sendiri, tetapi permintaan `host=node` eksplisit per panggilan diizinkan dari `auto`. Jika ingin exec node menjadi default untuk sesi, tetapkan `tools.exec.host=node` atau `/exec host=node ...` secara eksplisit.

Terkait:

- [CLI host node](/id/cli/node)
- [Alat exec](/id/tools/exec)
- [Persetujuan exec](/id/tools/exec-approvals)

### Inferensi model lokal

Node desktop atau server dapat mengekspos model berkemampuan percakapan dari server Ollama yang berjalan pada node tersebut. Agen menggunakan alat `node_inference` milik Plugin Ollama untuk menemukan model yang terinstal dan menjalankan prompt terbatas dari jarak jauh; Gateway tidak memerlukan akses jaringan langsung ke Ollama. Lihat [Inferensi lokal-node Ollama](/id/providers/ollama#node-local-inference) untuk penyiapan, pemfilteran model, dan perintah verifikasi langsung.

### Sesi dan transkrip Codex

Plugin resmi `codex` dapat mengekspos sesi Codex yang tidak diarsipkan pada
host node headless atau node macOS native. Pendaftaran katalog tidak lagi bergantung
pada `supervision.enabled`; opsi tersebut mengontrol alat supervisi yang tersedia bagi agen.
Tetapkan `sessionCatalog.enabled: false` dalam konfigurasi Plugin Codex untuk menonaktifkan
perintah katalog operator dan katalog node yang dipasangkan tanpa menonaktifkan
penyedia atau harness.
Plugin tersebut tetap harus aktif pada kedua komputer, dan pengaturan node tetap menjadi
persetujuan lokal: hanya mengaktifkan Gateway tidak dapat membaca status Codex
komputer lain.

Node mengiklankan perintah hanya-baca berversi
`codex.appServer.threads.list.v1` dan
`codex.appServer.thread.turns.list.v1`. Host node native dengan
CLI Codex yang tersedia juga mengiklankan `codex.terminal.resume.v1`. Setujui peningkatan pemasangan node
saat perintah tersebut pertama kali muncul. Gateway memanggilnya melalui
kebijakan node Plugin normal dan mengisolasi kegagalan berdasarkan host.

Baris node yang dipasangkan muncul sebagai grup **Codex** di bilah samping sesi normal.
Dalam setiap host, baris dikelompokkan berdasarkan folder proyek secara default; direktori kerja
di bawah `.claude/worktrees/<name>` digabungkan ke repositori asalnya, dan grup
proyek dapat diciutkan seperti bagian bilah samping lainnya. Gunakan ikon folder di header katalog
untuk meratakan atau memulihkan grup proyek. Pengelompokan yang sama berlaku untuk
katalog sesi Claude.
Secara default, memilih baris akan membuka panel Chat normal dan membaca transkrip tersimpannya
melalui panggilan `thread/turns/list` yang dibatasi dan dipaginasi dengan kursor,
dengan proyeksi item lengkap. Gunakan menu baris, header penampil, atau preferensi **Buka sesi Codex/Claude di** untuk memulai `codex resume <thread-id>` di terminal operator pada komputer pemilik sesi. Jalur terminal node yang dipasangkan adalah relai PTY dalam daftar yang diizinkan dan dimiliki oleh Plugin Codex, bukan eksekusi perintah node arbitrer.

Relai tersebut tidak menyediakan kontrak kelanjutan harness OpenClaw dan kepemilikan arsip secara lengkap. Karena itu, **Lanjutkan** dan **Arsipkan** tidak tersedia untuk baris jarak jauh. Pada komputer Gateway, baris tersimpan dan tidak aktif
dapat memulai cabang Chat terpisah yang dikunci ke model. Keduanya hanya dapat diarsipkan
setelah operator mengonfirmasi bahwa tidak ada klien Codex lain yang menggunakannya; aktivitas langsung
baris tersimpan tetap tidak diketahui. Baris aktif tidak dapat membuat cabang atau diarsipkan.

Lihat [Mengawasi sesi Codex](/plugins/codex-supervision) untuk penyiapan,
paginasi, kelanjutan lokal, dan batas keamanan metadata.

### Sesi dan transkrip Claude

Plugin bawaan `anthropic` secara default menemukan sesi Claude CLI dan Claude
Desktop yang tidak diarsipkan pada Gateway dan node yang dipasangkan. Tetapkan
`plugins.entries.anthropic.config.sessionCatalog.enabled: false` untuk menonaktifkan
perintah katalog operator dan katalog node yang dipasangkan tanpa menonaktifkan model
Anthropic atau backend Claude CLI.
Node aplikasi macOS jarak jauh mengiklankan
`anthropic.claude.sessions.list.v1` dan `anthropic.claude.sessions.read.v1`
saat Plugin Anthropic diaktifkan dan `~/.claude/projects/` tersedia. Setujui
peningkatan pemasangan node saat perintah tersebut pertama kali muncul.

Host node native dengan Claude CLI yang tersedia juga mengiklankan
`anthropic.claude.terminal.resume.v1`. Baris CLI dan Desktop yang memenuhi syarat dapat membuka
`claude --resume <session-id>` di terminal operator pada host pemiliknya.
Ini merupakan pengambilalihan sesi native; tidak seperti adopsi OpenClaw, tindakan ini tidak
mencabangkan sesi Claude terlebih dahulu.

Katalog menggabungkan catatan indeks proyek Claude CLI yang valid dengan awalan
metadata terbatas dari file JSONL `sdk-cli` saat ini. Metadata lokal Claude Desktop
menyediakan judul Desktop dan status arsip. Metadata Desktop diprioritaskan saat
kedua sumber merujuk ke ID sesi Claude Code yang sama; transkrip khusus CLI
tetap terlihat karena CLI tidak memiliki tanda arsip. Pembacaan transkrip menggunakan kursor
offset byte opak dan pembacaan file mundur yang dibatasi, sehingga memilih sesi besar
atau memuat halaman lama tidak membaca seluruh riwayat JSONL ke dalam satu
respons Gateway.

Perintah daftar dan baca bersifat hanya-baca. Perintah tersebut hanya mengekspos metadata katalog dan konten
transkrip melalui metode generik `sessions.catalog.list` dan
`sessions.catalog.read` kepada koneksi operator terautentikasi dengan
`operator.write`. Baris Claude CLI lokal-Gateway dapat diadopsi dari komposer
Chat normal: OpenClaw mengimpor riwayat terlihat yang dibatasi, melanjutkan dengan
`--fork-session` pada giliran pertama, dan membiarkan transkrip sumber tetap tidak berubah.

Host node headless dapat ikut serta dalam alur kelanjutan yang sama:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

Node mengiklankan `agent.cli.claude.run.v1` hanya saat pengaturan lokal-node ini
diaktifkan dan executable `claude` dapat ditemukan pada node tersebut. Gateway tidak dapat
mengaktifkannya dari jarak jauh. Perintah tersebut juga melewati kebijakan persetujuan exec
node yang sudah ada. Saat ketiga perintah Claude diiklankan dan diizinkan oleh
kebijakan perintah node Gateway, baris Claude CLI
pada node tersebut dapat dilanjutkan: OpenClaw mengimpor riwayat terbatas, mengikat
sesi yang diadopsi ke node dan direktori kerja yang dilaporkan katalognya, lalu
menjalankan setiap giliran sekali-jalan `claude -p` di sana. Giliran pertama tetap menggunakan
`--fork-session`, sehingga mempertahankan transkrip sumber.

Giliran yang ditempatkan pada node menggunakan default Claude milik node. Dalam v1, giliran tersebut tidak menerima
konfigurasi MCP loopback Gateway atau Plugin Skills Gateway, tidak dapat melakukan seed ulang dari
transkrip Gateway, serta menolak lampiran dan gambar. Baris Claude Desktop dan
node yang tidak mengiklankan perintah run tetap hanya dapat dilihat. Node aplikasi
macOS belum mengiklankan perintah ini, sehingga barisnya tetap hanya dapat dilihat.

Lihat [Anthropic: Sesi Claude di berbagai komputer](/id/providers/anthropic#claude-sessions-across-computers)
untuk perilaku Control UI dan sumber penyimpanan.

### Sesi OpenCode dan Pi

Plugin OpenCode dan ACPX bawaan juga menemukan katalog sesi native hanya-baca
pada Gateway dan node yang dipasangkan. Sebuah node mengiklankan
`opencode.sessions.list.v1` / `opencode.sessions.read.v1` saat CLI `opencode`
terinstal, serta `acpx.pi.sessions.list.v1` / `acpx.pi.sessions.read.v1`
saat direktori sesi Pi tersedia. Setujui peningkatan pemasangan node saat perintah baru
pertama kali muncul. Jika CLI yang cocok juga tersedia, node menambahkan
`opencode.terminal.resume.v1` atau `acpx.pi.terminal.resume.v1`; menu baris
dan header penampil yang ada kemudian dapat membuka kembali sesi yang dipilih di terminal
pemiliknya dengan `opencode --session <id>` atau `pi --session <id>`.

OpenCode membaca melalui permukaan JSON/ekspor CLI resminya. Pi membaca
penyimpanan sesi JSONL yang didokumentasikan, termasuk direktori sesi `settings.json`
proyek dan global serta penggantian `PI_CODING_AGENT_DIR` dan
`PI_CODING_AGENT_SESSION_DIR`. Kedua katalog diaktifkan secara default;
nonaktifkan di Web UI pada **Config > Plugins**.

Pelanjutan terminal menggunakan direktori kerja sesi yang tersimpan dan relai PTY dupleks
dalam daftar yang diizinkan yang sama seperti Codex dan Claude. Fitur ini tidak mengekspos eksekusi
perintah node arbitrer.

### Unggahan file terminal

Control UI dapat menyeret file ke terminal node yang dipasangkan dan terbuka. Host node native mengiklankan perintah khusus-admin `terminal.upload`; setujui peningkatan pemasangan saat perintah tersebut pertama kali muncul. Setiap file dibatasi hingga 16 MiB, ditempatkan sementara dalam direktori temporer privat pada node tersebut, dan dikembalikan ke terminal sebagai jalur yang dikutip untuk shell tanpa mengeksekusinya.

Penyisipan path mendukung PowerShell, `cmd.exe`, dan shell POSIX yang dikenali (`sh`, Bash, Dash, Ash, Ksh, Zsh, dan Fish), termasuk Git Bash di Windows. Penggantian shell lain ditolak karena aturan pengutipannya tidak dapat disimpulkan dengan aman; jalankan host node di dalam WSL untuk path WSL native. Path `cmd.exe` yang berisi `%` atau `!` juga ditolak karena shell tersebut memperluas karakter-karakter itu bahkan di dalam tanda kutip ganda.

## Menjalankan perintah

Tingkat rendah (RPC mentah):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` memblokir `system.run` dan `system.run.prepare`; perintah-perintah tersebut hanya dijalankan melalui alat `exec` dengan `host=node` (lihat di atas). Pembantu tingkat tinggi tersedia untuk alur kerja umum "berikan lampiran MEDIA kepada agen" (canvas, kamera, layar, lokasi, di bawah).

Perintah node streaming yang berjalan lama menggunakan peristiwa tambahan `node.invoke.progress`. Setiap peristiwa membawa ID pemanggilan, nomor urut berbasis nol, dan potongan teks UTF-8 berukuran terbatas; Gateway mengurutkan potongan sebelum mengirimkannya kepada pemanggil. `node.invoke.result` yang ada tetap menjadi satu-satunya respons terminal. Pemanggil streaming dapat menetapkan tenggat waktu tidak aktif yang dimulai saat peristiwa progres pertama dan diatur ulang setelah progres berikutnya, sambil mempertahankan batas waktu keras terpisah milik pemanggilan selama persetujuan dan eksekusi. Hasil, batas waktu keras, batas waktu tidak aktif, dan terputusnya koneksi node semuanya membuang status stream yang tertunda. Pembatalan oleh pemanggil memancarkan `node.invoke.cancel`; host node kemudian menghentikan pohon proses yang cocok. Perintah permintaan/respons yang ada tidak berubah.

## Kebijakan perintah

Perintah Node harus melewati dua gerbang sebelum dapat dijalankan:

1. Node harus mendeklarasikan perintah dalam metadata koneksi terautentikasinya (`connect.commands`).
2. Daftar izin Gateway yang diturunkan dari platform dan persetujuan harus mencakup perintah yang dideklarasikan.

Daftar izin default berdasarkan platform (sebelum default plugin dan penggantian `allowCommands`/`denyCommands`):

| Platform | Perintah yang diizinkan secara default                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `device.apps`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                         |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify` (perintah host node seperti `system.run` memerlukan persetujuan, lihat di bawah)                                                                                                                                                                                                                                  |

Baris-baris ini menjelaskan batas atas kebijakan Gateway, bukan perintah yang diimplementasikan oleh setiap aplikasi node. Perintah hanya dapat digunakan ketika node yang terhubung juga mendeklarasikannya. Secara khusus, aplikasi macOS saat ini tidak mendeklarasikan kelompok perangkat dan data pribadi yang tercantum pada baris kebijakan macOS.

Perintah `canvas.*` (`canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`) merupakan default plugin pada iOS, Android, macOS, Windows, Linux, dan platform yang tidak diketahui. Node Linux hanya mendeklarasikannya ketika soket Canvas lokal aplikasi desktop tersedia. Semua perintah Canvas dibatasi untuk latar depan pada iOS.

`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, dan `talk.ptt.once` diizinkan secara default untuk setiap node yang mengiklankan kapabilitas `talk` atau mendeklarasikan perintah `talk.*`, terlepas dari label platform.

Perintah host desktop (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `mcp.tools.call.v1`, dan `screen.snapshot` pada macOS/Windows) bukan bagian dari tabel default platform statis di atas. Perintah tersebut tersedia setelah operator menyetujui permintaan pemasangan yang mendeklarasikannya, dan setelah itu kumpulan perintah node yang disetujui mempertahankannya saat tersambung kembali.

Perintah berbahaya atau yang banyak melibatkan privasi tetap memerlukan persetujuan eksplisit dengan `gateway.nodes.allowCommands`, meskipun node mendeklarasikannya: `camera.snap`, `camera.clip`, `screen.record`, `computer.act`, `contacts.add`, `calendar.add`, `reminders.add`, `health.summary`, `sms.send`, `sms.search`. `gateway.nodes.denyCommands` selalu mengesampingkan default dan entri daftar izin tambahan. Lihat [ringkasan HealthKit](/id/platforms/ios-healthkit) untuk gerbang persetujuan iPhone dan [Penggunaan komputer](/id/nodes/computer-use) untuk gerbang tambahan macOS, kebijakan alat, dan pengaktifan di sekitar input desktop.

Perintah node milik Plugin dapat menambahkan kebijakan pemanggilan node Gateway. Kebijakan tersebut berjalan setelah pemeriksaan daftar izin dan sebelum diteruskan ke node, sehingga `node.invoke` mentah, pembantu CLI, dan alat agen khusus berbagi batas izin plugin yang sama. Perintah node plugin yang berbahaya tetap memerlukan persetujuan eksplisit `gateway.nodes.allowCommands`.

Setelah node mengubah daftar perintah yang dideklarasikannya, tolak pemasangan perangkat lama dan setujui permintaan baru agar Gateway menyimpan cuplikan perintah yang diperbarui.

## Konfigurasi (`openclaw.json`)

Pengaturan terkait node berada di bawah `gateway.nodes` dan `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Setujui otomatis pemasangan node pertama kali dari jaringan tepercaya (daftar CIDR).
      // Dinonaktifkan jika tidak ditetapkan. Hanya berlaku untuk permintaan role:node pertama kali
      // tanpa cakupan yang diminta; tidak menyetujui peningkatan secara otomatis.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // Persetujuan otomatis terverifikasi SSH (default: diaktifkan). Menyetujui pemasangan
        // node pertama kali berdasarkan kecocokan persis kunci perangkat yang dibaca kembali melalui SSH.
        sshVerify: true,
      },
      // Percayai alat plugin yang terlihat oleh agen dan dipublikasikan oleh node terpasang (default: true).
      pluginTools: {
        enabled: true,
      },
      // Setujui penggunaan perintah node yang berbahaya/banyak melibatkan privasi (camera.snap, dll.).
      allowCommands: ["camera.snap", "screen.record"],
      // Blokir nama perintah persis meskipun default atau allowCommands menyertakannya.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Host exec default: "node" merutekan semua panggilan exec ke node terpasang.
      host: "node",
      // Mode keamanan untuk exec node: hanya izinkan perintah yang disetujui/tercantum dalam daftar izin.
      security: "allowlist",
      // Sematkan exec ke node tertentu (id atau nama). Hilangkan agar node mana pun diizinkan.
      node: "build-node",
    },
  },
}
```

Gunakan nama perintah node yang persis. `denyCommands` menghapus perintah meskipun default platform atau entri `allowCommands` seharusnya mengizinkannya. Node terpasang dapat memublikasikan deskriptor alat plugin yang terlihat oleh agen secara default, tetapi perintah setiap deskriptor tetap harus berada dalam permukaan perintah node yang disetujui. Tetapkan `gateway.nodes.pluginTools.enabled: false` untuk mengabaikan semua deskriptor tersebut. Lihat [referensi konfigurasi Gateway](/id/gateway/configuration-reference#gateway) untuk detail kolom pemasangan node Gateway dan kebijakan perintah.

Penggantian node exec per agen:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## Tangkapan layar (snapshot canvas)

Jika node sedang menampilkan Canvas (WebView), `canvas.snapshot` mengembalikan `{ format, base64 }`.

Pembantu CLI (menulis ke berkas sementara dan mencetak path yang disimpan):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Kontrol Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Catatan:

- `canvas present` menerima URL atau path berkas lokal (`--target`) pada node yang mendukung path lokal, ditambah `--x/--y/--width/--height` opsional untuk penempatan. Canvas Linux menerima URL HTTP(S) atau perender A2UI bawaannya.
- `canvas eval` menerima JS sebaris (`--js`) atau argumen posisional.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Catatan:

- Node desktop seluler dan Linux menggunakan halaman A2UI bawaan milik aplikasi untuk perenderan yang mendukung tindakan.
- Hanya A2UI v0.8 JSONL yang didukung (v0.9/createSurface ditolak).
- iOS dan Android merender halaman Canvas Gateway jarak jauh, tetapi tindakan tombol A2UI hanya dikirim dari halaman A2UI bawaan milik aplikasi. Halaman A2UI HTTP/HTTPS yang di-host Gateway hanya dapat dirender pada klien seluler tersebut.
- macOS dapat mengirim tindakan dari halaman A2UI Gateway dengan cakupan kapabilitas yang persis dipilih oleh aplikasi. Halaman HTTP/HTTPS lainnya tetap hanya dapat dirender.
- Linux hanya mengirim tindakan dari halaman A2UI bawaan. Halaman HTTP/HTTPS lainnya tetap hanya dapat dirender, dan node Linux tanpa antarmuka grafis yang tidak memiliki aplikasi desktop tidak mengiklankan Canvas.

## Foto + video (kamera node)

Foto (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: kedua arah kamera (2 baris MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

Klip video (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Catatan:

- Node harus berada di **latar depan** untuk `canvas.*` dan `camera.*` (panggilan latar belakang mengembalikan `NODE_BACKGROUND_UNAVAILABLE`).
- Node membatasi durasi klip agar payload base64 tetap dapat dikelola (lihat [Pengambilan gambar kamera](/id/nodes/camera) untuk batas pasti setiap platform). Alat agen `nodes` juga membatasi `durationMs` yang diminta hingga 300000 (5 menit) sebelum meneruskan panggilan; Node itu sendiri menerapkan batas yang lebih ketat.
- Android akan meminta izin `CAMERA`/`RECORD_AUDIO` jika memungkinkan; izin yang ditolak akan gagal dengan `*_PERMISSION_REQUIRED`.

## Perekaman layar (Node)

Node yang didukung menyediakan `screen.record` (mp4). Contoh:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Catatan:

- Ketersediaan `screen.record` bergantung pada platform Node.
- Alat agen `nodes` membatasi `durationMs` yang diminta hingga 300000 (5 menit); Node dapat menerapkan batas yang lebih ketat untuk membatasi payload yang dikembalikan.
- `--no-audio` menonaktifkan pengambilan audio mikrofon pada platform yang didukung.
- Gunakan `--screen <index>` untuk memilih layar ketika tersedia beberapa layar (0 = utama).

## Lokasi (Node)

Node menyediakan `location.get` ketika Lokasi diaktifkan di pengaturan.

Pembantu CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Catatan:

- Lokasi **dinonaktifkan secara default**.
- "Always" memerlukan izin sistem; pengambilan di latar belakang dilakukan semampunya.
- Respons mencakup lintang/bujur, akurasi (meter), dan stempel waktu.
- Bentuk parameter/respons lengkap dan kode kesalahan: [Perintah lokasi](/id/nodes/location-command).

## SMS (Node Android)

Node Android dapat menyediakan `sms.send` dan `sms.search` ketika pengguna memberikan izin **SMS** dan perangkat mendukung telefoni. Kedua perintah tersebut secara default dianggap berbahaya: operator Gateway juga harus menambahkannya ke `gateway.nodes.allowCommands` sebelum dapat dipanggil (lihat [Kebijakan perintah](#command-policy)).

Untuk pencarian SMS hanya-baca, aktifkan secara eksplisit di `openclaw.json`:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["sms.search"],
    },
  },
}
```

Tambahkan `sms.send` secara terpisah hanya ketika Node juga harus dapat mengirim pesan. Izin Android dan otorisasi perintah Gateway bersifat independen; memberikan izin telepon tidak mengubah kebijakan Gateway.

Pemanggilan tingkat rendah:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Catatan:

- `sms.search` dapat dideklarasikan sebelum `READ_SMS` diberikan agar pemanggilan dapat mengembalikan diagnostik izin; membaca pesan tetap memerlukan izin Android tersebut.
- Perangkat khusus Wi-Fi tanpa telefoni tidak akan mengiklankan `sms.send`.
- Kesalahan `requires explicit gateway.nodes.allowCommands opt-in` berarti ponsel mendeklarasikan perintah tersebut, tetapi operator Gateway belum mengotorisasinya.

## Perintah perangkat dan data pribadi

Node iOS dan Android mengiklankan beberapa perintah data hanya-baca secara default (lihat tabel [Kebijakan perintah](#command-policy)); Android juga menyediakan kelompok yang lebih besar yang dibatasi oleh pengaturan dalam aplikasinya sendiri. Host Node TypeScript macOS atau Mac tanpa antarmuka hanya mengiklankan `device.apps` setelah operator mengaktifkan berbagi aplikasi terinstal dengan `--share-installed-apps`.

Kelompok yang tersedia:

- `device.status`, `device.info` — iOS, Android, Windows.
- `device.permissions`, `device.health` — hanya Android.
- `device.apps` — Node Android, macOS, dan Mac tanpa antarmuka. Android memerlukan berbagi Aplikasi Terinstal di Settings dan secara default mengembalikan aplikasi yang terlihat di peluncur. Host Node TypeScript menonaktifkan berbagi secara default serta menerima `query`, `limit`, dan `includeSystem`; hasil macOS berisi `label`, `bundleId`, `path`, dan `system`.
- `notifications.list`, `notifications.actions` — hanya Android.
- `photos.latest` — iOS, Android.
- `contacts.search` — iOS, Android (default hanya-baca); `contacts.add` berbahaya dan memerlukan `gateway.nodes.allowCommands`.
- `calendar.events` — iOS, Android (default hanya-baca); `calendar.add` berbahaya dan memerlukan `gateway.nodes.allowCommands`.
- `reminders.list` — iOS, Android (default hanya-baca); `reminders.add` berbahaya dan memerlukan `gateway.nodes.allowCommands`.
- `callLog.search` — hanya Android.
- `motion.activity`, `motion.pedometer` — iOS, Android; dibatasi berdasarkan kapabilitas sensor yang tersedia.

Contoh pemanggilan:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## Perintah sistem (host Node / Node Mac)

Node macOS menyediakan `system.run`, `system.which`, `system.notify`, dan `system.execApprovals.get/set`. Host Node tanpa antarmuka menyediakan `system.run.prepare`, `system.run`, `system.which`, dan `system.execApprovals.get/set`.

Contoh:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

Catatan:

- `system.run` mengembalikan stdout/stderr/kode keluar dalam payload.
- Eksekusi shell kini dilakukan melalui alat `exec` dengan `host=node`; `nodes` tetap menjadi permukaan RPC langsung untuk perintah Node eksplisit.
- `nodes invoke` tidak menyediakan `system.run` atau `system.run.prepare`; keduanya tetap hanya tersedia di jalur exec.
- Jalur exec menyiapkan `systemRunPlan` kanonis sebelum persetujuan. Setelah persetujuan diberikan, Gateway meneruskan rencana tersimpan tersebut, bukan bidang perintah/cwd/sesi yang kemudian diedit oleh pemanggil.
- `system.notify` mematuhi status izin notifikasi pada aplikasi macOS; mendukung `--priority <passive|active|timeSensitive>` dan `--delivery <system|overlay|auto>`.
- Metadata `platform` / `deviceFamily` Node yang tidak dikenali menggunakan daftar izin default konservatif yang mengecualikan `system.run` dan `system.which`. Jika Anda memang memerlukan perintah tersebut untuk platform yang tidak dikenal, tambahkan secara eksplisit melalui `gateway.nodes.allowCommands`.
- `system.run` mendukung `--cwd`, `--env KEY=VAL`, `--command-timeout`, dan `--needs-screen-recording`.
- Untuk pembungkus shell (`bash|sh|zsh ... -c/-lc`), nilai `--env` yang tercakup pada permintaan dikurangi menjadi daftar izin eksplisit (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Untuk keputusan selalu izinkan dalam mode daftar izin, pembungkus pengiriman yang dikenal (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) menyimpan jalur executable internal alih-alih jalur pembungkus. Jika pembukaan pembungkus tidak aman, entri daftar izin tidak disimpan secara otomatis.
- Pada host Node Windows dalam mode daftar izin, eksekusi pembungkus shell melalui `cmd.exe /c` memerlukan persetujuan (entri daftar izin saja tidak otomatis mengizinkan bentuk pembungkus).
- Host Node mengabaikan penggantian `PATH` di `--env` dan menghapus sekumpulan besar variabel startup interpreter/shell yang dipelihara (misalnya `NODE_OPTIONS`, `PYTHONPATH`, `BASH_ENV`, `DYLD_*`, `LD_*`) sebelum menjalankan perintah. Jika memerlukan entri PATH tambahan, konfigurasikan lingkungan layanan host Node (atau instal alat di lokasi standar), bukan meneruskan `PATH` melalui `--env`.
- Dalam mode Node macOS, `system.run` dibatasi oleh persetujuan exec dalam aplikasi macOS (Settings → Exec approvals). Perilaku tanya/daftar izin/penuh sama dengan host Node tanpa antarmuka; permintaan yang ditolak mengembalikan `SYSTEM_RUN_DENIED`.
- Pada host Node tanpa antarmuka, `system.run` dibatasi oleh persetujuan exec (`~/.openclaw/exec-approvals.json`); khusus di macOS, lihat variabel lingkungan perutean host exec pada [Host Node tanpa antarmuka](#headless-node-host-cross-platform) di bawah.

## Pengikatan Node exec

Ketika tersedia beberapa Node, exec dapat diikat ke Node tertentu. Ini menetapkan Node default untuk `exec host=node` (dan dapat diganti per agen).

Default global:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Penggantian per agen:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Hapus pengaturan untuk mengizinkan Node mana pun:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Peta izin

Node dapat menyertakan peta `permissions` dalam `node.list` / `node.describe`, dengan kunci berupa nama izin (misalnya `screenRecording`, `accessibility`, `location`) dan nilai boolean (`true` = diberikan).

## Host Node tanpa antarmuka (lintas platform)

OpenClaw dapat menjalankan **host Node tanpa antarmuka** (tanpa UI) yang terhubung ke WebSocket Gateway dan menyediakan `system.run` / `system.which`. Ini berguna di Linux/Windows atau untuk menjalankan Node minimal bersama server.

Jalankan:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Catatan:

- Pemasangan masih diperlukan (Gateway akan menampilkan permintaan pemasangan perangkat).
- Metadata instans klien, identitas perangkat yang ditandatangani, dan autentikasi pemasangan menggunakan rekaman status terpisah; lihat [Status identitas tanpa antarmuka](#headless-identity-state).
- Persetujuan exec diterapkan secara lokal melalui `~/.openclaw/exec-approvals.json` (lihat [Persetujuan exec](/id/tools/exec-approvals)).
- Di macOS, host Node tanpa antarmuka mengeksekusi `system.run` secara lokal secara default. Tetapkan `OPENCLAW_NODE_EXEC_HOST=app` untuk merutekan `system.run` melalui host exec aplikasi pendamping; tambahkan `OPENCLAW_NODE_EXEC_FALLBACK=0` untuk mewajibkan host aplikasi dan gagal secara tertutup jika tidak tersedia.
- Tambahkan `--tls` / `--tls-fingerprint` ketika WS Gateway menggunakan TLS.

## Mode Node Mac

- Aplikasi bilah menu macOS terhubung ke server WS Gateway sebagai Node (sehingga `openclaw nodes …` berfungsi terhadap Mac ini).
- Dalam mode jarak jauh, aplikasi membuka terowongan SSH untuk port Gateway dan terhubung ke `localhost`.
