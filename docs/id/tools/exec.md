---
read_when:
    - Menggunakan atau memodifikasi alat exec
    - Men-debug perilaku stdin atau TTY
summary: Penggunaan alat exec, mode stdin, dan dukungan TTY
title: Alat eksekusi
x-i18n:
    generated_at: "2026-06-27T18:17:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2831d9e66b25ce251f90e59a41b25234e22106d865466e61b878e3999e849dc
    source_path: tools/exec.md
    workflow: 16
---

Jalankan perintah shell di workspace. `exec` adalah permukaan shell yang memutasi: perintah dapat membuat, mengedit, atau menghapus file di mana pun host atau sistem file sandbox yang dipilih mengizinkan. Menonaktifkan alat sistem file OpenClaw seperti `write`, `edit`, atau `apply_patch` tidak membuat `exec` menjadi hanya-baca.

Mendukung eksekusi foreground + background melalui `process`. Jika `process` tidak diizinkan, `exec` berjalan secara sinkron dan mengabaikan `yieldMs`/`background`.
Sesi background dicakup per agen; `process` hanya melihat sesi dari agen yang sama.

## Parameter

<ParamField path="command" type="string" required>
Perintah shell untuk dijalankan.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Direktori kerja untuk perintah.
</ParamField>

<ParamField path="env" type="object">
Override lingkungan kunci/nilai yang digabungkan di atas lingkungan yang diwarisi.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Jadikan perintah background otomatis setelah penundaan ini (md).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Jadikan perintah background segera alih-alih menunggu `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Timpa timeout exec yang dikonfigurasi untuk panggilan ini. Tetapkan `timeout: 0` hanya ketika perintah harus berjalan tanpa timeout proses exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Jalankan di terminal semu saat tersedia. Gunakan untuk CLI khusus TTY, agen pengkodean, dan UI terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Tempat mengeksekusi. `auto` diselesaikan menjadi `sandbox` ketika runtime sandbox aktif dan menjadi `gateway` jika tidak.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Diabaikan untuk panggilan alat normal. Keamanan `gateway` / `node` dikendalikan oleh
`tools.exec.security` dan file persetujuan host; mode elevated dapat
memaksa `security=full` hanya ketika operator secara eksplisit memberikan akses elevated.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Mode tanya dasar berasal dari `tools.exec.ask` dan persetujuan host.
Untuk panggilan model yang berasal dari channel, `ask` per panggilan diabaikan ketika
ask host efektif adalah `off`; jika tidak, ini hanya dapat diperketat ke mode yang lebih ketat.
Pemanggil internal/API tepercaya yang membuat alat exec dengan nilai `ask`
eksplisit tidak berubah.
</ParamField>

<ParamField path="node" type="string">
ID/nama Node ketika `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Minta mode elevated — keluar dari sandbox ke jalur host yang dikonfigurasi. `security=full` dipaksa hanya ketika elevated diselesaikan menjadi `full`.
</ParamField>

Catatan:

- `host` default ke `auto`: sandbox ketika runtime sandbox aktif untuk sesi, jika tidak gateway.
- `host` hanya menerima `auto`, `sandbox`, `gateway`, atau `node`. Ini bukan pemilih nama host; nilai mirip nama host ditolak sebelum perintah berjalan.
- `auto` adalah strategi routing default, bukan wildcard. `host=node` per panggilan diizinkan dari `auto`; `host=gateway` per panggilan hanya diizinkan ketika tidak ada runtime sandbox yang aktif.
- `tools.exec.mode` adalah tombol kebijakan yang dinormalisasi. Nilainya adalah `deny`, `allowlist`, `ask`, `auto`, dan `full`. `auto` menjalankan kecocokan allowlist/safe-bin deterministik secara langsung dan merutekan setiap kasus persetujuan exec yang tersisa melalui peninjau otomatis native OpenClaw sebelum meminta manusia. `ask` / `ask=always` tetap meminta manusia setiap kali.
- Tanpa konfigurasi tambahan, `host=auto` tetap "langsung berfungsi": tanpa sandbox berarti diselesaikan menjadi `gateway`; sandbox aktif berarti tetap berada di sandbox.
- `elevated` keluar dari sandbox ke jalur host yang dikonfigurasi: `gateway` secara default, atau `node` ketika `tools.exec.host=node` (atau default sesi adalah `host=node`). Ini hanya tersedia ketika akses elevated diaktifkan untuk sesi/penyedia saat ini.
- Persetujuan `gateway`/`node` dikendalikan oleh file persetujuan host.
- `node` memerlukan node berpasangan (aplikasi pendamping atau host node headless).
- Jika beberapa node tersedia, tetapkan `exec.node` atau `tools.exec.node` untuk memilih salah satu.
- `exec host=node` adalah satu-satunya jalur eksekusi shell untuk node; wrapper lama `nodes.run` telah dihapus.
- `timeout` berlaku untuk eksekusi foreground, background, `yieldMs`, gateway, sandbox, dan `system.run` node. Jika dihilangkan, OpenClaw menggunakan `tools.exec.timeoutSec`; `timeout: 0` eksplisit menonaktifkan timeout proses exec untuk panggilan tersebut.
- Pada host non-Windows, exec menggunakan `SHELL` saat ditetapkan; jika `SHELL` adalah `fish`, exec lebih memilih `bash` (atau `sh`)
  dari `PATH` untuk menghindari skrip yang tidak kompatibel dengan fish, lalu fallback ke `SHELL` jika keduanya tidak ada.
- Pada host Windows, exec lebih memilih penemuan PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, lalu PATH),
  lalu fallback ke Windows PowerShell 5.1.
- Pada host gateway non-Windows, perintah exec bash dan zsh menggunakan snapshot startup. OpenClaw menangkap
  alias/fungsi yang dapat di-source dan sekumpulan kecil lingkungan aman dari file startup shell ke
  `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`, lalu men-source snapshot tersebut sebelum setiap perintah exec.
  Variabel yang tampak seperti rahasia dikecualikan; exec sandbox dan node tidak menggunakan snapshot ini. Tetapkan
  `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` di lingkungan proses Gateway untuk menonaktifkan jalur snapshot ini.
- Eksekusi host (`gateway`/`node`) menolak `env.PATH` dan override loader (`LD_*`/`DYLD_*`) untuk
  mencegah pembajakan biner atau kode yang disuntikkan.
- OpenClaw menetapkan `OPENCLAW_SHELL=exec` di lingkungan perintah yang dibuat (termasuk eksekusi PTY dan sandbox) sehingga aturan shell/profil dapat mendeteksi konteks alat exec.
- Untuk run yang berasal dari channel, OpenClaw juga mengekspos payload JSON identitas pengirim/chat yang sempit di
  `OPENCLAW_CHANNEL_CONTEXT` ketika channel menyediakan id tersebut.
- `openclaw channels login` diblokir dari `exec` karena merupakan alur autentikasi channel interaktif; jalankan di terminal pada host gateway, atau gunakan alat login native channel dari chat saat tersedia.
- Penting: sandboxing **nonaktif secara default**. Jika sandboxing nonaktif, `host=auto` implisit
  diselesaikan menjadi `gateway`. `host=sandbox` eksplisit tetap gagal tertutup alih-alih diam-diam
  berjalan pada host gateway. Aktifkan sandboxing atau gunakan `host=gateway` dengan persetujuan.
- Pemeriksaan preflight skrip (untuk kesalahan sintaks shell Python/Node umum) hanya memeriksa file di dalam
  batas `workdir` efektif. Jika jalur skrip diselesaikan di luar `workdir`, preflight dilewati untuk
  file tersebut.
- Untuk pekerjaan berjalan lama yang dimulai sekarang, mulai sekali dan andalkan wake penyelesaian
  otomatis saat diaktifkan dan perintah menghasilkan output atau gagal.
  Gunakan `process` untuk log, status, input, atau intervensi; jangan meniru
  penjadwalan dengan loop sleep, loop timeout, atau polling berulang.
- Untuk pekerjaan yang harus terjadi nanti atau sesuai jadwal, gunakan cron alih-alih
  pola sleep/penundaan `exec`.

## Konfigurasi

- `tools.exec.notifyOnExit` (default: true): ketika true, sesi exec yang di-background mengantrekan event sistem dan meminta Heartbeat saat keluar.
- `tools.exec.approvalRunningNoticeMs` (default: 10000): memancarkan satu pemberitahuan "berjalan" ketika exec yang dibatasi persetujuan berjalan lebih lama dari ini (0 menonaktifkan).
- `tools.exec.timeoutSec` (default: 1800): timeout exec default per perintah dalam detik. `timeout` per panggilan menimpanya; `timeout: 0` per panggilan menonaktifkan timeout proses exec.
- `tools.exec.host` (default: `auto`; diselesaikan menjadi `sandbox` ketika runtime sandbox aktif, `gateway` jika tidak)
- `tools.exec.security` (default: `deny` untuk sandbox, `full` untuk gateway + node ketika tidak ditetapkan)
- `tools.exec.ask` (default: `off`)
- Exec host tanpa persetujuan adalah default untuk gateway + node. Jika Anda menginginkan perilaku persetujuan/allowlist, perketat `tools.exec.*` dan file persetujuan host; lihat [Persetujuan exec](/id/tools/exec-approvals#yolo-mode-no-approval).
- YOLO berasal dari default kebijakan host (`security=full`, `ask=off`), bukan dari `host=auto`. Jika Anda ingin memaksa routing gateway atau node, tetapkan `tools.exec.host` atau gunakan `/exec host=...`.
- Dalam mode `security=full` plus `ask=off`, exec host mengikuti kebijakan yang dikonfigurasi secara langsung; tidak ada lapisan prefilter heuristik obfuscation perintah atau penolakan preflight skrip tambahan.
- `tools.exec.node` (default: tidak ditetapkan)
- `tools.exec.strictInlineEval` (default: false): ketika true, bentuk eval interpreter inline seperti `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, dan `osascript -e` memerlukan peninjau atau persetujuan eksplisit. Dalam `mode=auto`, jalur persetujuan exec normal dapat membiarkan peninjau otomatis native mengizinkan perintah satu kali yang jelas berisiko rendah; panggilan `system.run` host node langsung tetap memerlukan persetujuan eksplisit karena tidak dapat menyerahkan perintah ke rute persetujuan manusia. Jika peninjau meminta, permintaan diteruskan ke manusia. `allow-always` tetap dapat mempertahankan invocation interpreter/skrip yang aman, tetapi bentuk inline-eval tidak menjadi aturan izin yang tahan lama.
- `tools.exec.commandHighlighting` (default: false): ketika true, prompt persetujuan dapat menyorot rentang perintah turunan parser dalam teks perintah. Tetapkan ke `true` secara global atau per agen untuk mengaktifkan penyorotan teks perintah tanpa mengubah kebijakan persetujuan exec.
- `tools.exec.pathPrepend`: daftar direktori untuk ditambahkan di awal `PATH` untuk run exec (hanya gateway + sandbox).
- `tools.exec.safeBins`: biner aman hanya-stdin yang dapat berjalan tanpa entri allowlist eksplisit. Untuk detail perilaku, lihat [Bin aman](/id/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: direktori eksplisit tambahan yang dipercaya untuk pemeriksaan jalur `safeBins`. Entri `PATH` tidak pernah dipercaya otomatis. Default bawaan adalah `/bin` dan `/usr/bin`.
- `tools.exec.safeBinProfiles`: kebijakan argv kustom opsional per bin aman (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

Contoh:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### Penanganan PATH

- `host=gateway`: menggabungkan `PATH` shell login Anda ke lingkungan exec. Override `env.PATH`
  ditolak untuk eksekusi host. Daemon itu sendiri tetap berjalan dengan `PATH` minimal:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
    - Untuk mencegah konfigurasi shell pengguna (seperti `~/.zshenv` atau `/etc/zshenv`) menimpa jalur prioritas saat startup, entri `tools.exec.pathPrepend` ditambahkan secara aman ke awal `PATH` akhir di dalam perintah shell tepat sebelum eksekusi.
- `host=sandbox`: menjalankan `sh -lc` (login shell) di dalam kontainer, sehingga `/etc/profile` dapat mereset `PATH`.
  OpenClaw menambahkan `env.PATH` di awal setelah sourcing profil melalui variabel env internal (tanpa interpolasi shell);
  `tools.exec.pathPrepend` juga berlaku di sini.
- `host=node`: hanya override env yang tidak diblokir yang Anda berikan yang dikirim ke node. Override `env.PATH`
  ditolak untuk eksekusi host dan diabaikan oleh host node. Jika Anda memerlukan entri PATH tambahan pada node,
  konfigurasikan lingkungan layanan host node (systemd/launchd) atau instal alat di lokasi standar.

Binding node per agen (gunakan indeks daftar agen dalam konfigurasi):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Control UI: tab Nodes menyertakan panel kecil "Binding node exec" untuk pengaturan yang sama.

## Override sesi (`/exec`)

Gunakan `/exec` untuk menetapkan default **per sesi** untuk `host`, `security`, `ask`, dan `node`.
Kirim `/exec` tanpa argumen untuk menampilkan nilai saat ini.

Contoh:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Model otorisasi

`/exec` hanya dipatuhi untuk **pengirim resmi** (daftar izin/pemasangan kanal plus `commands.useAccessGroups`).
Ini hanya memperbarui **status sesi** dan tidak menulis konfigurasi. Pengirim kanal eksternal resmi dapat
mengatur default sesi ini. Klien gateway/webchat internal memerlukan `operator.admin` untuk menyimpannya secara persisten.
Untuk menonaktifkan exec secara keras, tolak melalui kebijakan alat (`tools.deny: ["exec"]` atau per agen). Persetujuan host
tetap berlaku kecuali Anda secara eksplisit mengatur `security=full` dan `ask=off`.

## Persetujuan exec (aplikasi pendamping / host Node)

Agen tersandbox dapat memerlukan persetujuan per permintaan sebelum `exec` berjalan di Gateway atau host Node.
Lihat [Persetujuan exec](/id/tools/exec-approvals) untuk kebijakan, daftar izin, dan alur UI.

Saat persetujuan diperlukan, alat exec langsung mengembalikan
`status: "approval-pending"` dan id persetujuan. Setelah disetujui (atau ditolak / waktunya habis),
Gateway mengeluarkan peristiwa sistem progres perintah dan penyelesaian hanya untuk eksekusi yang disetujui
(`Exec running` / `Exec finished`). Persetujuan yang ditolak atau kedaluwarsa bersifat terminal dan tidak
membangunkan sesi agen dengan peristiwa sistem penolakan.
Pada kanal dengan kartu/tombol persetujuan native, agen harus mengandalkan
UI native tersebut terlebih dahulu dan hanya menyertakan perintah `/approve` manual ketika hasil
alat secara eksplisit menyatakan bahwa persetujuan chat tidak tersedia atau persetujuan manual adalah
satu-satunya jalur.

## Daftar izin + bin aman

Penerapan daftar izin manual mencocokkan glob jalur biner yang telah di-resolve dan glob nama perintah polos.
Nama polos hanya cocok dengan perintah yang dipanggil melalui PATH, sehingga `rg` dapat cocok dengan
`/opt/homebrew/bin/rg` saat perintahnya adalah `rg`, tetapi tidak dengan `./rg` atau `/tmp/rg`.
Saat `security=allowlist`, perintah shell diizinkan otomatis hanya jika setiap segmen pipeline
ada dalam daftar izin atau merupakan bin aman. Chaining (`;`, `&&`, `||`) dan pengalihan
ditolak dalam mode daftar izin kecuali setiap segmen tingkat atas memenuhi
daftar izin (termasuk bin aman). Pengalihan tetap tidak didukung.
Kepercayaan tahan lama `allow-always` tidak melewati aturan itu: perintah berantai tetap memerlukan setiap
segmen tingkat atas untuk cocok.

`autoAllowSkills` adalah jalur kemudahan terpisah dalam persetujuan exec. Ini tidak sama dengan
entri daftar izin jalur manual. Untuk kepercayaan eksplisit yang ketat, biarkan `autoAllowSkills` dinonaktifkan.

Gunakan dua kontrol untuk tugas yang berbeda:

- `tools.exec.safeBins`: filter stream kecil yang hanya menerima stdin.
- `tools.exec.safeBinTrustedDirs`: direktori tepercaya tambahan yang eksplisit untuk jalur executable bin aman.
- `tools.exec.safeBinProfiles`: kebijakan argv eksplisit untuk bin aman kustom.
- daftar izin: kepercayaan eksplisit untuk jalur executable.

Jangan perlakukan `safeBins` sebagai daftar izin generik, dan jangan tambahkan biner interpreter/runtime (misalnya `python3`, `node`, `ruby`, `bash`). Jika Anda memerlukannya, gunakan entri daftar izin eksplisit dan biarkan prompt persetujuan tetap aktif.
`openclaw security audit` memperingatkan saat entri `safeBins` interpreter/runtime tidak memiliki profil eksplisit, dan `openclaw doctor --fix` dapat membuat scaffold entri `safeBinProfiles` kustom yang hilang.
`openclaw security audit` dan `openclaw doctor` juga memperingatkan saat Anda secara eksplisit menambahkan kembali bin berperilaku luas seperti `jq` ke dalam `safeBins`.
Jika Anda secara eksplisit memasukkan interpreter ke daftar izin, aktifkan `tools.exec.strictInlineEval` agar bentuk evaluasi kode inline tetap memerlukan peninjau atau persetujuan eksplisit.

Untuk detail dan contoh kebijakan lengkap, lihat [Persetujuan exec](/id/tools/exec-approvals-advanced#safe-bins-stdin-only) dan [Bin aman versus daftar izin](/id/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Contoh

Latar depan:

```json
{ "tool": "exec", "command": "ls -la" }
```

Latar belakang + polling:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Polling digunakan untuk status sesuai permintaan, bukan loop menunggu. Jika wake penyelesaian otomatis
diaktifkan, perintah dapat membangunkan sesi saat mengeluarkan output atau gagal.

Kirim tombol (gaya tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Submit (hanya kirim CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Tempel (dengan bracket secara default):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` adalah subalat dari `exec` untuk edit multi-file terstruktur.
Ini diaktifkan secara default untuk model OpenAI dan OpenAI Codex. Gunakan konfigurasi hanya
saat Anda ingin menonaktifkannya atau membatasinya ke model tertentu:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

Catatan:

- Hanya tersedia untuk model OpenAI/OpenAI Codex.
- Kebijakan alat tetap berlaku; `allow: ["write"]` secara implisit mengizinkan `apply_patch`.
- `deny: ["write"]` tidak menolak `apply_patch`; tolak `apply_patch` secara eksplisit atau gunakan `deny: ["group:fs"]` saat penulisan patch juga harus diblokir.
- Konfigurasi berada di bawah `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` default-nya adalah `true`; atur ke `false` untuk menonaktifkan alat bagi model OpenAI.
- `tools.exec.applyPatch.workspaceOnly` default-nya adalah `true` (terbatas di workspace). Atur ke `false` hanya jika Anda secara sengaja ingin `apply_patch` menulis/menghapus di luar direktori workspace.

## Terkait

- [Persetujuan Exec](/id/tools/exec-approvals) — gerbang persetujuan untuk perintah shell
- [Sandboxing](/id/gateway/sandboxing) — menjalankan perintah di lingkungan tersandbox
- [Proses Latar Belakang](/id/gateway/background-process) — exec yang berjalan lama dan alat proses
- [Keamanan](/id/gateway/security) — kebijakan alat dan akses yang ditingkatkan
