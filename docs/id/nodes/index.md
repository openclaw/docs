---
read_when:
    - Memasangkan Node iOS/watchOS/Android ke Gateway
    - Menggunakan kanvas/kamera Node untuk konteks agen
    - Menambahkan perintah Node atau pembantu CLI baru
summary: 'Node: pemasangan, kapabilitas, izin, dan pembantu CLI untuk kanvas/kamera/layar/perangkat/notifikasi/sistem'
title: Node
x-i18n:
    generated_at: "2026-07-16T18:19:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c2c1e9ad62866704941906db136546f7e81975f52c503c24ce829d0b13613bcc
    source_path: nodes/index.md
    workflow: 16
---

Sebuah **node** adalah perangkat pendamping (macOS/iOS/watchOS/Android/headless) yang terhubung ke Gateway dengan `role: "node"` dan menyediakan permukaan perintah (misalnya `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) melalui `node.invoke`. Sebagian besar node menggunakan WebSocket Gateway pada port operator. Node Apple Watch langsung opsional menggunakan polling HTTPS bertanda tangan pada port yang sama karena watchOS memblokir jaringan tingkat rendah generik untuk aplikasi biasa. Detail protokol: [Protokol Gateway](/id/gateway/protocol).

Transport lama: [Protokol bridge](/id/gateway/bridge-protocol) (TCP JSONL; hanya untuk riwayat node saat ini).

macOS juga dapat berjalan dalam **mode node**: aplikasi bilah menu terhubung ke server
WS Gateway sebagai satu node (sehingga `openclaw nodes …` berfungsi pada Mac ini). Aplikasi
menambahkan perintah native Canvas, kamera, layar, notifikasi, dan kendali komputer
ke permukaan perintah host-node yang sama dengan yang digunakan oleh `openclaw node run`. Jangan memulai
node CLI kedua pada Mac tersebut; aplikasi menjalankan runtime host-node CLI yang sesuai sebagai
pekerja internal dan tetap menjadi satu-satunya koneksi Gateway serta identitas node.

Node adalah **periferal**, bukan gateway: node tidak menjalankan layanan gateway, dan pesan saluran (Telegram, WhatsApp, dan sebagainya) masuk ke gateway, bukan ke node.

Panduan pemecahan masalah: [/nodes/troubleshooting](/id/nodes/troubleshooting)

## Penyandingan + status

Node menggunakan **penyandingan perangkat**. Node menyajikan identitas perangkat bertanda tangan saat terhubung; Gateway membuat permintaan penyandingan perangkat untuk `role: node`. Setujui melalui CLI perangkat (atau UI). Penyiapan Apple Watch langsung menggunakan kode penyiapan khusus node berumur pendek yang dibuat oleh admin untuk menyetujui permukaan perintah tetap berisiko rendah; perluasan kapabilitas berikutnya tetap memerlukan persetujuan normal.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Permintaan penyandingan yang tertunda kedaluwarsa 5 menit setelah percobaan ulang terakhir perangkat — perangkat yang terus menghubungkan ulang mempertahankan satu permintaan tertundanya (dan `requestId`) tetap aktif alih-alih membuat prompt baru setiap beberapa menit; lihat [Penyandingan node](/id/gateway/pairing) untuk seluruh siklus hidup permintaan/persetujuan. Jika node mencoba ulang dengan detail autentikasi yang berubah (peran/cakupan/kunci publik), permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat — klien menerima peristiwa `device.pair.resolved` untuk permintaan yang digantikan, dan Anda harus menjalankan kembali `openclaw devices list` sebelum menyetujui.

- `nodes status` menandai node sebagai **tersanding** ketika peran penyandingan perangkatnya menyertakan `node`.
- Mac native yang terhubung dan memiliki izin Accessibility dapat melaporkan aktivitas
  input fisik yang digabungkan. Gateway menandai Mac terbaru yang memenuhi syarat sebagai
  `active`, memberi agen petunjuk ID node yang stabil, dan merutekan peringatan koneksi
  node ke sana sebelum fallback tertunda. Lihat
  [Kehadiran komputer aktif](/nodes/presence) untuk penyiapan, privasi, pengaturan waktu, dan
  pemecahan masalah.
- Catatan penyandingan perangkat adalah kontrak peran yang disetujui dan bersifat persisten. Rotasi token tetap berada di dalam kontrak tersebut; rotasi tidak dapat meningkatkan node yang telah tersanding ke peran yang tidak pernah diberikan oleh persetujuan penyandingan.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) adalah penyimpanan penyandingan node terpisah milik gateway yang melacak permukaan perintah/kapabilitas node yang disetujui di seluruh koneksi ulang. Penyimpanan ini **tidak** mengatur autentikasi transport — penyandingan perangkatlah yang melakukannya.
- `openclaw nodes remove --node <id|name|ip>` menghapus penyandingan node. Untuk node yang didukung perangkat, tindakan ini mencabut peran `node` perangkat dalam penyimpanan perangkat tersanding dan memutus sesi berperan node milik perangkat tersebut: perangkat dengan peran campuran mempertahankan barisnya dan hanya kehilangan peran `node`, sedangkan baris perangkat khusus node dihapus. Tindakan ini juga menghapus entri yang cocok dari penyimpanan penyandingan node terpisah. `operator.pairing` dapat menghapus baris node non-operator pada perangkat lain; pemanggil dengan token perangkat yang mencabut peran nodenya sendiri pada perangkat dengan peran campuran juga memerlukan `operator.admin`.
- Cakupan persetujuan mengikuti perintah yang dideklarasikan oleh permintaan tertunda:
  - permintaan tanpa perintah: `operator.pairing`
  - perintah node non-exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Ketidakselarasan versi dan urutan peningkatan

WebSocket Gateway menerima klien node terautentikasi dalam rentang protokol N-1.
Karena itu, Gateway v4 saat ini menerima node v3 ketika koneksi mendeklarasikan
`role: "node"` dan `client.mode: "node"`. Sesi operator dan UI tetap harus
menggunakan protokol saat ini.

Untuk peningkatan armada secara bertahap, tingkatkan Gateway terlebih dahulu, lalu tingkatkan setiap node.
Node N-1 tetap terlihat dan dapat dikelola selama ditingkatkan; Gateway
mencatat `legacy node protocol accepted` beserta rekomendasi peningkatan. Penyandingan,
autentikasi perangkat, daftar izin perintah, dan persetujuan exec tetap berlaku.
Kapabilitas dan perintah milik Plugin tetap disembunyikan hingga node ditingkatkan ke
protokol saat ini. Node yang lebih lama dari N-1 memerlukan peningkatan di luar pita sebelum
menghubungkan ulang.

Transport HTTPS watchOS langsung memerlukan versi protokol saat ini; perbarui
aplikasi watch bersama Gateway sebelum mengaktifkan mode langsung.

## Host node jarak jauh (system.run)

Gunakan **host node** ketika Gateway berjalan pada satu mesin dan perintah perlu dieksekusi pada mesin lain. Model tetap berkomunikasi dengan **gateway**; gateway meneruskan panggilan `exec` ke **host node** ketika `host=node` dipilih.

| Peran        | Tanggung jawab                                                   |
| ------------ | ---------------------------------------------------------------- |
| Host Gateway | Menerima pesan, menjalankan model, merutekan panggilan alat.     |
| Host node    | Mengeksekusi `system.run`/`system.which` pada mesin node.        |
| Persetujuan  | Diberlakukan pada host node melalui `~/.openclaw/exec-approvals.json`. |

Catatan persetujuan:

- Eksekusi node berbasis persetujuan mengikat konteks permintaan secara tepat. Jalur exec menyiapkan `systemRunPlan` kanonis sebelum persetujuan; setelah diberikan, gateway meneruskan rencana tersimpan tersebut, bukan bidang perintah/cwd/sesi yang kemudian diedit pemanggil, dan memvalidasi ulang direktori kerja sebelum menjalankannya.
- Untuk eksekusi file shell/runtime langsung, OpenClaw juga berupaya sebaik mungkin mengikat satu operand file lokal konkret dan menolak eksekusi jika file tersebut berubah sebelum dieksekusi.
- Jika OpenClaw tidak dapat mengidentifikasi tepat satu file lokal konkret untuk perintah interpreter/runtime, eksekusi berbasis persetujuan ditolak alih-alih berpura-pura memberikan cakupan runtime penuh. Gunakan sandboxing, host terpisah, atau daftar izin tepercaya/alur kerja lengkap yang eksplisit untuk semantik interpreter yang lebih luas.

### Memulai host node (latar depan)

Pada mesin node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` juga menerima `--context-path` (jalur konteks WS Gateway), `--tls`, `--tls-fingerprint <sha256>`, dan `--node-id` (mengganti ID instans klien lama; tindakan ini tidak mengatur ulang penyandingan).

### Gateway jarak jauh melalui terowongan SSH (pengikatan loopback)

Jika Gateway diikat ke loopback (`gateway.bind=loopback`, bawaan dalam mode lokal), host node jarak jauh tidak dapat terhubung secara langsung. Buat terowongan SSH dan arahkan host node ke ujung lokal terowongan.

Contoh (host node -> host gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Catatan:

- `openclaw node run` mendukung autentikasi token atau kata sandi.
- Variabel lingkungan lebih disarankan: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Fallback konfigurasi adalah `gateway.auth.token` / `gateway.auth.password`.
- Dalam mode lokal, host node sengaja mengabaikan `gateway.remote.token` / `gateway.remote.password`.
- Dalam mode jarak jauh, `gateway.remote.token` / `gateway.remote.password` memenuhi syarat berdasarkan aturan prioritas jarak jauh.
- Jika SecretRef `gateway.auth.*` lokal aktif dikonfigurasi tetapi tidak dapat diresolusi, autentikasi host-node gagal secara tertutup.
- Resolusi autentikasi host-node hanya menerima variabel lingkungan `OPENCLAW_GATEWAY_*`.

### Memulai host node (layanan)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` juga menerima `--context-path`, `--tls`, `--tls-fingerprint`, `--node-id` (hanya ID instans klien lama), `--runtime <node>` (bawaan: node), dan `--force` untuk menginstal ulang. `node status`, `node stop`, dan `node uninstall` juga tersedia.

### Menyandingkan + memberi nama

Pada host gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Jika node mencoba ulang dengan detail autentikasi yang berubah, jalankan kembali `openclaw devices list` dan setujui `requestId` saat ini.

Opsi penamaan:

- `--display-name` pada `openclaw node run` / `openclaw node install` (disimpan dalam baris SQLite `node_host_config` bersama ID instans klien dan metadata koneksi Gateway).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (penggantian oleh gateway).

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
deskriptornya setelah terhubung. Panggilan alat kembali ke node tersebut melalui
`mcp.tools.call.v1`; Gateway tidak memerlukan konfigurasi MCP atau Plugin JS yang cocok.
Server MCP OAuth tidak didukung oleh jalur v1 yang dihost node ini.

Host node saat ini mendeklarasikan keluarga perintah bawaan `mcp.tools.call.v1` selama
penyandingan awalnya meskipun tidak ada server MCP yang dikonfigurasi. Node yang disandingkan pada
versi OpenClaw lama dapat meminta peningkatan permukaan perintah satu kali setelah
host node diperbarui. Menambahkan, menghapus, atau memfilter server setelah itu tidak
memerlukan penyandingan ulang karena keluarga perintah yang disetujui tidak berubah. Mulai ulang
`openclaw node run` atau `openclaw node restart` untuk menerapkan perubahan konfigurasi MCP node;
host node tidak memantau konfigurasi ini.

Operator Gateway dapat mengabaikan semua alat yang terlihat oleh agen dan dipublikasikan oleh node tersanding,
termasuk alat MCP yang dihost node, dengan
`gateway.nodes.pluginTools.enabled: false`. Penolakan perintah persis seperti
`gateway.nodes.denyCommands: ["mcp.tools.call.v1"]` juga memblokir eksekusi.

### Skills yang dihost node

Instal Skills di bawah direktori Skills OpenClaw aktif pada mesin node,
secara bawaan `~/.openclaw/skills`. `OPENCLAW_HOME`, `OPENCLAW_STATE_DIR`, dan
`OPENCLAW_CONFIG_PATH` memindahkan profil aktif tersebut. `OPENCLAW_STATE_DIR` memiliki
prioritas untuk Skills; jika tidak, `skills/` berada di samping jalur yang dicetak oleh
`openclaw config file`. Host node headless memublikasikan file `SKILL.md` yang valid
setelah terhubung, dan Gateway menambahkannya ke snapshot Skills agen hanya selama
node tersebut tetap terhubung. Setiap nama direktori Skills harus cocok dengan bidang frontmatter `name`
agar pencari lokasi node abstrak memetakan ke satu entri tanpa menambahkan
bidang protokol lain.

Pemasangan awal peran node menyetujui publikasi skill. Menambahkan, menghapus, atau
mengubah skill tidak memerlukan pemasangan lain atau perubahan konfigurasi
Gateway. Mulai ulang `openclaw node run` atau `openclaw node restart` setelah mengubah
file skill node; host node tidak memantau direktori skill.

Entri skill yang di-host di node mengidentifikasi node-nya dan memuat lokasi
eksekusinya. File skill, jalur relatif yang dirujuk, dan biner tetap berada di
node tersebut. Agen membaca lokasi `node://.../SKILL.md` yang diumumkan dengan
alat `read` biasa. `file_fetch` menerima jalur node absolut yang disetujui operator,
bukan pencari lokasi skill node; runtime tanpa alat baca biasa sebagai gantinya dapat menjalankan
`cat SKILL.md` melalui `exec host=node node=<node-id>` dengan direktori
`node://.../skills/<name>` yang diumumkan sebagai `workdir`. File dan biner yang dirujuk
menggunakan target exec dan direktori kerja yang sama. Host node menyelesaikan pencari lokasi tersebut terhadap
direktori status OpenClaw aktifnya, sehingga jalur relatif diselesaikan di node,
bukan di mesin Gateway. Node yang menerbitkan harus memiliki `system.run` yang disetujui,
dan kebijakan exec agen harus mengizinkan `host=node`; jika tidak, skill tetap
berada di luar snapshot agen tersebut.

Tetapkan `nodeHost.skills.enabled: false` pada node untuk menghentikan publikasi. Operator
Gateway dapat mengabaikan skill dari setiap node yang dipasangkan dengan
`gateway.nodes.skills.enabled: false`.

### Status identitas tanpa antarmuka

Node tanpa antarmuka menyimpan tiga catatan status terpisah:

- `~/.openclaw/state/openclaw.sqlite` (`node_host_config`): ID instans klien, nama tampilan, dan metadata koneksi Gateway.
- `~/.openclaw/identity/device.json`: pasangan kunci perangkat yang ditandatangani dan ID perangkat kriptografis yang diturunkan.
- `~/.openclaw/identity/device-auth.json`: token autentikasi perangkat yang dipasangkan, dengan kunci berupa ID perangkat kriptografis dan peran.

Untuk node yang ditandatangani, Gateway menggunakan ID perangkat kriptografis untuk pemasangan dan
perutean node. ID instans klien hanya merupakan metadata koneksi. Oleh karena itu, mengubah
`--node-id` atau memigrasikan `node.json` yang sudah dihentikan tidak mengatur ulang pemasangan. Lihat
[Status identitas dan pemasangan](/id/cli/node#identity-and-pairing-state) untuk
alur pencabutan dan pemasangan ulang yang didukung serta catatan peningkatan.

### Izinkan perintah dalam daftar izin

Persetujuan exec berlaku **per host node**. Tambahkan entri daftar izin dari Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Persetujuan berada di host node pada `~/.openclaw/exec-approvals.json`.

### Arahkan exec ke node

Konfigurasikan nilai default (konfigurasi Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Atau per sesi:

```text
/exec host=node security=allowlist node=<id-or-name>
```

Setelah ditetapkan, setiap panggilan `exec` dengan `host=node` dijalankan pada host node (sesuai daftar izin/persetujuan node).

`host=auto` tidak akan secara implisit memilih node sendiri, tetapi permintaan `host=node` per panggilan yang eksplisit diizinkan dari `auto`. Jika Anda ingin exec node menjadi nilai default untuk sesi, tetapkan `tools.exec.host=node` atau `/exec host=node ...` secara eksplisit.

Terkait:

- [CLI host node](/id/cli/node)
- [Alat exec](/id/tools/exec)
- [Persetujuan exec](/id/tools/exec-approvals)

### Inferensi model lokal

Node desktop atau server dapat menyediakan model berkemampuan obrolan dari server Ollama yang berjalan pada node tersebut. Agen menggunakan alat `node_inference` milik Plugin Ollama untuk menemukan model yang terinstal dan menjalankan prompt terbatas dari jarak jauh; Gateway tidak memerlukan akses jaringan langsung ke Ollama. Lihat [Inferensi lokal node Ollama](/id/providers/ollama#node-local-inference) untuk penyiapan, pemfilteran model, dan perintah verifikasi langsung.

### Sesi dan transkrip Codex

Plugin resmi `codex` dapat menyediakan sesi Codex yang tidak diarsipkan pada
host node tanpa antarmuka atau node macOS native. Pendaftaran katalog tidak lagi bergantung
pada `supervision.enabled`; opsi tersebut mengendalikan alat pengawasan yang ditujukan bagi agen.
Tetapkan `sessionCatalog.enabled: false` dalam konfigurasi Plugin Codex untuk menonaktifkan
perintah katalog operator dan katalog node yang dipasangkan tanpa menonaktifkan
penyedia atau harness.
Plugin masih harus aktif di kedua komputer, dan pengaturan node tetap merupakan
persetujuan lokal: hanya mengaktifkan Gateway tidak dapat membaca status Codex
komputer lain.

Node mengumumkan perintah hanya-baca berversi
`codex.appServer.threads.list.v1` dan
`codex.appServer.thread.turns.list.v1`. Host node native dengan
CLI Codex yang tersedia juga mengumumkan `codex.terminal.resume.v1`. Setujui peningkatan pemasangan node
ketika perintah tersebut pertama kali muncul. Gateway menjalankannya melalui
kebijakan node Plugin normal dan mengisolasi kegagalan berdasarkan host.

Baris node yang dipasangkan muncul sebagai grup **Codex** di bilah samping sesi normal.
Secara default, memilih baris akan membuka panel Obrolan normal dan membaca transkrip tersimpannya
melalui panggilan `thread/turns/list` terbatas dengan paginasi kursor
dan proyeksi item lengkap. Gunakan menu baris, header penampil, atau preferensi **Buka sesi Codex/Claude di** untuk memulai `codex resume <thread-id>` di terminal operator pada komputer yang memiliki sesi tersebut. Jalur terminal node yang dipasangkan adalah relai PTY dalam daftar izin yang dimiliki oleh Plugin Codex, bukan eksekusi perintah node arbitrer.

Relai tidak menyediakan kontrak kelanjutan harness OpenClaw dan kepemilikan arsip secara lengkap. Oleh karena itu, **Lanjutkan** dan **Arsipkan** tidak tersedia untuk baris jarak jauh. Pada komputer Gateway, baris yang tersimpan dan tidak aktif
dapat memulai cabang Obrolan terpisah yang dikunci ke model. Keduanya hanya dapat diarsipkan
setelah operator mengonfirmasi bahwa tidak ada klien Codex lain yang menggunakannya; aktivitas langsung
baris tersimpan tetap tidak diketahui. Baris aktif tidak dapat dicabangkan atau diarsipkan.

Lihat [Awasi sesi Codex](/id/plugins/codex-supervision) untuk penyiapan,
paginasi, kelanjutan lokal, dan batas keamanan metadata.

### Sesi dan transkrip Claude

Plugin bawaan `anthropic` menemukan sesi CLI Claude dan Claude
Desktop yang tidak diarsipkan pada Gateway dan node yang dipasangkan secara default. Tetapkan
`plugins.entries.anthropic.config.sessionCatalog.enabled: false` untuk menonaktifkan
perintah katalog operator dan katalog node yang dipasangkan tanpa menonaktifkan model
Anthropic atau backend CLI Claude.
Node aplikasi macOS jarak jauh mengumumkan
`anthropic.claude.sessions.list.v1` dan `anthropic.claude.sessions.read.v1`
ketika Plugin Anthropic diaktifkan dan `~/.claude/projects/` tersedia. Setujui
peningkatan pemasangan node ketika perintah tersebut pertama kali muncul.

Host node native dengan CLI Claude yang tersedia juga mengumumkan
`anthropic.claude.terminal.resume.v1`. Baris CLI dan Desktop yang memenuhi syarat dapat membuka
`claude --resume <session-id>` di terminal operator pada host pemiliknya.
Ini merupakan pengambilalihan sesi native; tidak seperti adopsi OpenClaw, tindakan ini tidak
membuat fork sesi Claude terlebih dahulu.

Katalog menggabungkan catatan indeks proyek CLI Claude yang valid dengan prefiks
metadata terbatas dari file JSONL `sdk-cli` saat ini. Metadata lokal Claude Desktop
menyediakan judul Desktop dan status arsip. Metadata Desktop diprioritaskan ketika
kedua sumber merujuk ID sesi Claude Code yang sama; transkrip khusus CLI
tetap terlihat karena CLI tidak memiliki tanda arsip. Pembacaan transkrip menggunakan kursor
offset byte buram dan pembacaan file mundur yang terbatas, sehingga memilih sesi
besar atau memuat halaman lama tidak membaca seluruh riwayat JSONL ke dalam satu
respons Gateway.

Perintah daftar dan baca bersifat hanya-baca. Perintah tersebut hanya memaparkan metadata katalog dan konten
transkrip melalui metode generik `sessions.catalog.list` dan
`sessions.catalog.read` kepada koneksi operator terautentikasi dengan
`operator.write`. Baris CLI Claude lokal Gateway dapat diadopsi dari penyusun
Obrolan normal: OpenClaw mengimpor riwayat terlihat yang terbatas, melanjutkan dengan
`--fork-session` pada giliran pertama, dan membiarkan transkrip sumber tidak berubah.

Host node tanpa antarmuka dapat memilih ikut serta dalam alur kelanjutan yang sama:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

Node mengumumkan `agent.cli.claude.run.v1` hanya ketika pengaturan lokal node ini
diaktifkan dan executable `claude` dapat diselesaikan pada node tersebut. Gateway tidak dapat
mengaktifkannya dari jarak jauh. Perintah tersebut juga melewati kebijakan persetujuan exec
node yang sudah ada. Ketika ketiga perintah Claude diumumkan dan diizinkan oleh
kebijakan perintah node Gateway, baris CLI Claude
pada node tersebut dapat dilanjutkan: OpenClaw mengimpor riwayat terbatas, mengikat
sesi yang diadopsi ke node dan direktori kerjanya yang dilaporkan katalog, serta
menjalankan setiap giliran sekali jalan `claude -p` di sana. Giliran pertama tetap menggunakan
`--fork-session`, sehingga mempertahankan transkrip sumber.

Giliran yang ditempatkan pada node menggunakan nilai default Claude milik node. Dalam v1, giliran tersebut tidak menerima
konfigurasi MCP loopback Gateway atau Plugin skill Gateway, tidak dapat mengisi ulang dari
transkrip Gateway, serta menolak lampiran dan gambar. Baris Claude Desktop dan
node yang tidak mengumumkan perintah run tetap hanya dapat dilihat. Node aplikasi
macOS belum mengumumkan perintah ini, sehingga barisnya tetap hanya dapat dilihat.

Lihat [Anthropic: Sesi Claude lintas komputer](/id/providers/anthropic#claude-sessions-across-computers)
untuk perilaku UI Kontrol dan sumber penyimpanan.

### Sesi OpenCode dan Pi

Plugin OpenCode dan ACPX bawaan juga menemukan katalog sesi native hanya-baca
pada Gateway dan node yang dipasangkan. Node mengumumkan
`opencode.sessions.list.v1` / `opencode.sessions.read.v1` ketika CLI `opencode`
terinstal, dan `acpx.pi.sessions.list.v1` / `acpx.pi.sessions.read.v1`
ketika direktori sesi Pi tersedia. Setujui peningkatan pemasangan node ketika perintah baru
pertama kali muncul. Ketika CLI yang sesuai juga tersedia, node menambahkan
`opencode.terminal.resume.v1` atau `acpx.pi.terminal.resume.v1`; menu baris
dan header penampil yang sudah ada kemudian dapat membuka kembali sesi terpilih di terminal
pemiliknya dengan `opencode --session <id>` atau `pi --session <id>`.

OpenCode membaca melalui permukaan JSON/ekspor CLI resminya. Pi membaca
penyimpanan sesi JSONL terdokumentasinya, termasuk direktori sesi `settings.json`
proyek dan global serta penggantian `PI_CODING_AGENT_DIR` dan
`PI_CODING_AGENT_SESSION_DIR`. Kedua katalog diaktifkan secara default;
nonaktifkan di UI Web pada **Config > Plugins**.

Melanjutkan terminal menggunakan direktori kerja sesi tersimpan dan relai PTY
dupleks dalam daftar izin yang sama seperti Codex dan Claude. Fitur ini tidak memaparkan
eksekusi perintah node arbitrer.

### Unggahan file terminal

UI Kontrol dapat menyeret file ke terminal node yang dipasangkan dan sedang terbuka. Host node native mengumumkan perintah khusus admin `terminal.upload`; setujui peningkatan pemasangan saat perintah tersebut pertama kali muncul. Setiap file dibatasi hingga 16 MiB, ditempatkan sementara di direktori privat pada node tersebut, dan dikembalikan ke terminal sebagai jalur yang diberi kutip shell tanpa mengeksekusinya.

Penyisipan jalur mendukung PowerShell, `cmd.exe`, dan shell POSIX yang dikenali (`sh`, Bash, Dash, Ash, Ksh, Zsh, dan Fish), termasuk Git Bash pada Windows. Penggantian shell lain ditolak karena aturan pengutipannya tidak dapat disimpulkan secara aman; jalankan host node di dalam WSL untuk jalur WSL native. Jalur `cmd.exe` yang berisi `%` atau `!` juga ditolak karena shell tersebut memperluas karakter-karakter itu bahkan di dalam tanda kutip ganda.

## Menjalankan perintah

Tingkat rendah (RPC mentah):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` memblokir `system.run` dan `system.run.prepare`; perintah tersebut hanya dijalankan melalui alat `exec` dengan `host=node` (lihat di atas). Pembantu tingkat lebih tinggi tersedia untuk alur kerja umum "berikan agen lampiran MEDIA" (kanvas, kamera, layar, lokasi, di bawah).

Perintah Node streaming yang berjalan lama menggunakan event `node.invoke.progress`
tambahan. Setiap event membawa ID pemanggilan, nomor urut berbasis nol, dan
potongan teks UTF-8 berukuran terbatas; Gateway mengurutkan potongan sebelum mengirimkannya kepada
pemanggil. `node.invoke.result` yang ada tetap menjadi satu-satunya respons
terminal. Pemanggil streaming dapat menetapkan tenggat waktu ketidakaktifan yang dimulai saat
event progres pertama dan direset setelah progres berikutnya, sambil mempertahankan
batas waktu mutlak terpisah milik pemanggilan selama persetujuan dan eksekusi. Hasil, batas
waktu mutlak, batas waktu ketidakaktifan, dan terputusnya koneksi Node semuanya menghapus status stream yang
tertunda. Pembatalan oleh pemanggil memancarkan `node.invoke.cancel`; host Node kemudian
menghentikan pohon proses yang sesuai. Perintah permintaan/respons yang ada tidak berubah.

## Kebijakan perintah

Perintah Node harus melewati dua gerbang sebelum dapat dipanggil:

1. Node harus mendeklarasikan perintah dalam metadata koneksi terautentikasinya (`connect.commands`).
2. Daftar izin Gateway yang diturunkan dari platform dan persetujuan harus mencakup perintah yang dideklarasikan.

Daftar izin default berdasarkan platform (sebelum default Plugin dan penggantian `allowCommands`/`denyCommands`):

| Platform | Perintah yang diizinkan secara default                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify` (perintah host Node seperti `system.run` memerlukan persetujuan, lihat di bawah)                                                                                                                                                                                                                                  |

Baris-baris ini menjelaskan batas atas kebijakan Gateway, bukan perintah yang diimplementasikan oleh setiap aplikasi Node. Suatu perintah hanya dapat digunakan jika Node yang terhubung juga mendeklarasikannya. Secara khusus, aplikasi macOS saat ini tidak mendeklarasikan kelompok perangkat dan data pribadi yang tercantum dalam baris kebijakan macOS.

Perintah `canvas.*` (`canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`) merupakan default Plugin pada iOS, Android, macOS, Windows, Linux, dan platform yang tidak diketahui. Node Linux hanya mendeklarasikannya ketika soket Canvas lokal milik aplikasi desktop tersedia. Semua perintah Canvas dibatasi hanya saat berada di latar depan pada iOS.

`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, dan `talk.ptt.once` diizinkan secara default untuk setiap Node yang mengiklankan kapabilitas `talk` atau mendeklarasikan perintah `talk.*`, terlepas dari label platform.

Perintah host desktop (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `mcp.tools.call.v1`, dan `screen.snapshot` pada macOS/Windows) bukan bagian dari tabel default platform statis di atas. Perintah tersebut tersedia setelah operator menyetujui permintaan penyandingan yang mendeklarasikannya, dan setelah itu kumpulan perintah Node yang disetujui akan mempertahankannya saat tersambung kembali.

Perintah berbahaya atau yang sangat sensitif terhadap privasi tetap memerlukan persetujuan eksplisit melalui `gateway.nodes.allowCommands`, meskipun Node mendeklarasikannya: `camera.snap`, `camera.clip`, `screen.record`, `computer.act`, `contacts.add`, `calendar.add`, `reminders.add`, `health.summary`, `sms.send`, `sms.search`. `gateway.nodes.denyCommands` selalu mengesampingkan default dan entri daftar izin tambahan. Lihat [ringkasan HealthKit](/platforms/ios-healthkit) untuk gerbang persetujuan iPhone dan [Penggunaan komputer](/id/nodes/computer-use) untuk gerbang tambahan macOS, kebijakan alat, dan pengaktifan seputar input desktop.

Perintah Node milik Plugin dapat menambahkan kebijakan pemanggilan Node Gateway. Kebijakan tersebut dijalankan setelah pemeriksaan daftar izin dan sebelum diteruskan ke Node, sehingga `node.invoke` mentah, pembantu CLI, dan alat agen khusus berbagi batas izin Plugin yang sama. Perintah Node Plugin yang berbahaya tetap memerlukan persetujuan eksplisit melalui `gateway.nodes.allowCommands`.

Setelah Node mengubah daftar perintah yang dideklarasikannya, tolak penyandingan perangkat lama dan setujui permintaan baru agar Gateway menyimpan snapshot perintah yang diperbarui.

## Konfigurasi (`openclaw.json`)

Pengaturan terkait Node berada di bawah `gateway.nodes` dan `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Setujui otomatis penyandingan Node pertama kali dari jaringan tepercaya (daftar CIDR).
      // Dinonaktifkan jika tidak ditetapkan. Hanya berlaku untuk permintaan role:node pertama kali
      // tanpa cakupan yang diminta; tidak menyetujui peningkatan secara otomatis.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // Persetujuan otomatis yang diverifikasi SSH (default: diaktifkan). Menyetujui penyandingan
        // Node pertama kali dengan kecocokan kunci perangkat persis yang dibaca kembali melalui SSH.
        sshVerify: true,
      },
      // Percayai alat Plugin yang terlihat oleh agen dan dipublikasikan oleh Node tersanding (default: true).
      pluginTools: {
        enabled: true,
      },
      // Aktifkan perintah Node yang berbahaya/sangat sensitif terhadap privasi (camera.snap, dll.).
      allowCommands: ["camera.snap", "screen.record"],
      // Blokir nama perintah yang persis sama meskipun default atau allowCommands menyertakannya.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Host exec default: "node" merutekan semua panggilan exec ke Node tersanding.
      host: "node",
      // Mode keamanan untuk exec Node: hanya izinkan perintah yang disetujui/tercantum dalam daftar izin.
      security: "allowlist",
      // Sematkan exec ke Node tertentu (ID atau nama). Hilangkan agar Node mana pun dapat digunakan.
      node: "build-node",
    },
  },
}
```

Gunakan nama perintah Node yang persis. `denyCommands` menghapus perintah meskipun default platform atau entri `allowCommands` seharusnya mengizinkannya. Node tersanding dapat memublikasikan deskriptor alat Plugin yang terlihat oleh agen secara default, tetapi perintah setiap deskriptor tetap harus berada dalam permukaan perintah Node yang disetujui. Tetapkan `gateway.nodes.pluginTools.enabled: false` untuk mengabaikan semua deskriptor tersebut. Lihat [referensi konfigurasi Gateway](/id/gateway/configuration-reference#gateway) untuk detail bidang penyandingan Node Gateway dan kebijakan perintah.

Penggantian Node exec per agen:

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

## Tangkapan layar (snapshot Canvas)

Jika Node sedang menampilkan Canvas (WebView), `canvas.snapshot` mengembalikan `{ format, base64 }`.

Pembantu CLI (menulis ke file sementara dan mencetak jalur yang disimpan):

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

- `canvas present` menerima URL atau jalur file lokal (`--target`) pada Node yang mendukung jalur lokal, serta `--x/--y/--width/--height` opsional untuk penempatan. Canvas Linux menerima URL HTTP(S) atau perender A2UI bawaannya.
- `canvas eval` menerima JS sebaris (`--js`) atau argumen posisional.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Catatan:

- Node seluler dan desktop Linux menggunakan halaman A2UI bawaan milik aplikasi untuk perenderan yang mendukung tindakan.
- Hanya JSONL A2UI v0.8 yang didukung (v0.9/createSurface ditolak).
- iOS dan Android merender halaman Canvas Gateway jarak jauh, tetapi tindakan tombol A2UI hanya dikirim dari halaman A2UI bawaan milik aplikasi. Halaman A2UI HTTP/HTTPS yang dihosting Gateway hanya dapat dirender pada klien seluler tersebut.
- macOS dapat mengirim tindakan dari halaman A2UI Gateway dengan cakupan kapabilitas yang persis dipilih oleh aplikasi. Halaman HTTP/HTTPS lainnya tetap hanya dapat dirender.
- Linux hanya mengirim tindakan dari halaman A2UI bawaan. Halaman HTTP/HTTPS lainnya tetap hanya dapat dirender, dan Node Linux tanpa antarmuka grafis yang tidak memiliki aplikasi desktop tidak mengiklankan Canvas.

## Foto + video (kamera Node)

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
- Node membatasi durasi klip agar muatan base64 tetap dapat dikelola (lihat [Pengambilan gambar kamera](/id/nodes/camera) untuk batas persis per platform). Alat agen `nodes` juga membatasi `durationMs` yang diminta hingga 300000 (5 menit) sebelum meneruskan panggilan; Node itu sendiri memberlakukan batas yang lebih ketat.
- Android akan meminta izin `CAMERA`/`RECORD_AUDIO` jika memungkinkan; izin yang ditolak akan gagal dengan `*_PERMISSION_REQUIRED`.

## Perekaman layar (Node)

Node yang didukung mengekspos `screen.record` (mp4). Contoh:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Catatan:

- Ketersediaan `screen.record` bergantung pada platform node.
- Alat agen `nodes` membatasi `durationMs` yang diminta hingga 300000 (5 menit); node dapat menerapkan batas yang lebih ketat untuk membatasi payload yang dikembalikan.
- `--no-audio` menonaktifkan pengambilan audio mikrofon pada platform yang didukung.
- Gunakan `--screen <index>` untuk memilih layar saat tersedia beberapa layar (0 = utama).

## Lokasi (node)

Node menyediakan `location.get` saat Lokasi diaktifkan di pengaturan.

Pembantu CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Catatan:

- Lokasi **dinonaktifkan secara default**.
- "Always" memerlukan izin sistem; pengambilan di latar belakang dilakukan sebisa mungkin.
- Respons mencakup lintang/bujur, akurasi (meter), dan stempel waktu.
- Bentuk parameter/respons lengkap dan kode kesalahan: [Perintah lokasi](/id/nodes/location-command).

## SMS (node Android)

Node Android dapat menyediakan `sms.send` dan `sms.search` saat pengguna memberikan izin **SMS** dan perangkat mendukung telefoni. Kedua perintah berbahaya secara default: operator Gateway juga harus menambahkannya ke `gateway.nodes.allowCommands` sebelum dapat dipanggil (lihat [Kebijakan perintah](#command-policy)).

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

Tambahkan `sms.send` secara terpisah hanya jika node juga harus dapat mengirim pesan. Izin Android dan otorisasi perintah Gateway bersifat independen; memberikan izin telepon tidak mengubah kebijakan Gateway.

Pemanggilan tingkat rendah:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Catatan:

- `sms.search` dapat dideklarasikan sebelum `READ_SMS` diberikan sehingga pemanggilan dapat mengembalikan diagnostik izin; membaca pesan tetap memerlukan izin Android tersebut.
- Perangkat khusus Wi-Fi tanpa telefoni tidak akan mengiklankan `sms.send`.
- Kesalahan `requires explicit gateway.nodes.allowCommands opt-in` berarti telepon mendeklarasikan perintah tersebut, tetapi operator Gateway belum mengotorisasinya.

## Perintah perangkat dan data pribadi

Node iOS dan Android mengiklankan beberapa perintah data hanya-baca secara default (lihat tabel [Kebijakan perintah](#command-policy)); Android juga menyediakan kelompok yang lebih besar dan dikontrol oleh pengaturan dalam aplikasinya sendiri.

Kelompok yang tersedia:

- `device.status`, `device.info` — iOS, Android, Windows.
- `device.permissions`, `device.health`, `device.apps` — hanya Android; `device.apps` mengharuskan berbagi Installed Apps diaktifkan di Android Settings dan secara default mengembalikan aplikasi yang terlihat di peluncur.
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

## Perintah sistem (host node/node Mac)

Node macOS menyediakan `system.run`, `system.which`, `system.notify`, dan `system.execApprovals.get/set`. Host node tanpa antarmuka menyediakan `system.run.prepare`, `system.run`, `system.which`, dan `system.execApprovals.get/set`.

Contoh:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

Catatan:

- `system.run` mengembalikan stdout/stderr/kode keluar dalam payload.
- Eksekusi shell kini dilakukan melalui alat `exec` dengan `host=node`; `nodes` tetap menjadi permukaan RPC langsung untuk perintah node eksplisit.
- `nodes invoke` tidak menyediakan `system.run` atau `system.run.prepare`; keduanya tetap hanya tersedia pada jalur exec.
- Jalur exec menyiapkan `systemRunPlan` kanonis sebelum persetujuan. Setelah persetujuan diberikan, Gateway meneruskan rencana tersimpan tersebut, bukan bidang perintah/cwd/sesi yang kemudian diedit oleh pemanggil.
- `system.notify` mematuhi status izin notifikasi pada aplikasi macOS; mendukung `--priority <passive|active|timeSensitive>` dan `--delivery <system|overlay|auto>`.
- Metadata `platform` / `deviceFamily` node yang tidak dikenali menggunakan daftar izin default konservatif yang mengecualikan `system.run` dan `system.which`. Jika perintah tersebut memang diperlukan untuk platform yang tidak dikenal, tambahkan secara eksplisit melalui `gateway.nodes.allowCommands`.
- `system.run` mendukung `--cwd`, `--env KEY=VAL`, `--command-timeout`, dan `--needs-screen-recording`.
- Untuk pembungkus shell (`bash|sh|zsh ... -c/-lc`), nilai `--env` dengan cakupan permintaan dikurangi menjadi daftar izin eksplisit (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Untuk keputusan selalu-izinkan dalam mode daftar izin, pembungkus pengiriman yang dikenal (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) mempertahankan jalur executable bagian dalam, bukan jalur pembungkus. Jika pembukaan pembungkus tidak aman, tidak ada entri daftar izin yang disimpan secara otomatis.
- Pada host node Windows dalam mode daftar izin, proses pembungkus shell melalui `cmd.exe /c` memerlukan persetujuan (entri daftar izin saja tidak otomatis mengizinkan bentuk pembungkus).
- Host node mengabaikan penggantian `PATH` dalam `--env` dan menghapus sekumpulan besar variabel startup interpreter/shell yang dikelola (misalnya `NODE_OPTIONS`, `PYTHONPATH`, `BASH_ENV`, `DYLD_*`, `LD_*`) sebelum menjalankan perintah. Jika memerlukan entri PATH tambahan, konfigurasikan lingkungan layanan host node (atau instal alat di lokasi standar), bukan meneruskan `PATH` melalui `--env`.
- Dalam mode node macOS, `system.run` dikontrol oleh persetujuan exec di aplikasi macOS (Settings → Exec approvals). Ask/allowlist/full berperilaku sama seperti host node tanpa antarmuka; permintaan yang ditolak mengembalikan `SYSTEM_RUN_DENIED`.
- Pada host node tanpa antarmuka, `system.run` dikontrol oleh persetujuan exec (`~/.openclaw/exec-approvals.json`); khusus di macOS, lihat variabel lingkungan perutean host exec pada [Host node tanpa antarmuka](#headless-node-host-cross-platform) di bawah.

## Pengikatan node exec

Saat tersedia beberapa node, exec dapat diikat ke node tertentu. Tindakan ini menetapkan node default untuk `exec host=node` (dan dapat ditimpa per agen).

Default global:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Penggantian per agen:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Hapus pengaturan untuk mengizinkan node mana pun:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Peta izin

Node dapat menyertakan peta `permissions` dalam `node.list` / `node.describe`, dengan nama izin sebagai kunci (misalnya `screenRecording`, `accessibility`, `location`) dan nilai boolean (`true` = diberikan).

## Host node tanpa antarmuka (lintas platform)

OpenClaw dapat menjalankan **host node tanpa antarmuka** (tanpa UI) yang terhubung ke WebSocket Gateway dan menyediakan `system.run` / `system.which`. Ini berguna di Linux/Windows atau untuk menjalankan node minimal bersama server.

Mulai:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Catatan:

- Pemasangan tetap diperlukan (Gateway akan menampilkan permintaan pemasangan perangkat).
- Metadata instans klien, identitas perangkat yang ditandatangani, dan autentikasi pemasangan menggunakan file terpisah; lihat [Status identitas tanpa antarmuka](#headless-identity-state).
- Persetujuan exec diterapkan secara lokal melalui `~/.openclaw/exec-approvals.json` (lihat [Persetujuan exec](/id/tools/exec-approvals)).
- Di macOS, host node tanpa antarmuka menjalankan `system.run` secara lokal secara default. Tetapkan `OPENCLAW_NODE_EXEC_HOST=app` untuk merutekan `system.run` melalui host exec aplikasi pendamping; tambahkan `OPENCLAW_NODE_EXEC_FALLBACK=0` untuk mewajibkan host aplikasi dan menutup akses jika tidak tersedia.
- Tambahkan `--tls` / `--tls-fingerprint` saat WS Gateway menggunakan TLS.

## Mode node Mac

- Aplikasi bilah menu macOS terhubung ke server WS Gateway sebagai node (sehingga `openclaw nodes …` berfungsi terhadap Mac ini).
- Dalam mode jarak jauh, aplikasi membuka terowongan SSH untuk port Gateway dan terhubung ke `localhost`.
