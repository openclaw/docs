---
read_when:
    - Menggunakan atau memodifikasi alat exec
    - Men-debug perilaku stdin atau TTY
summary: Penggunaan alat exec, mode stdin, dan dukungan TTY
title: Alat eksekusi
x-i18n:
    generated_at: "2026-05-11T20:36:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43ed3dc70d1998f2f2a3eed70aaf20da61ba93d23b7fa7d378f22e8635c6ec68
    source_path: tools/exec.md
    workflow: 16
---

Jalankan perintah shell di workspace. `exec` adalah permukaan shell yang mengubah keadaan: perintah dapat membuat, mengedit, atau menghapus file di mana pun host terpilih atau filesystem sandbox mengizinkan. Menonaktifkan alat filesystem OpenClaw seperti `write`, `edit`, atau `apply_patch` tidak membuat `exec` menjadi hanya-baca.

Mendukung eksekusi foreground + background melalui `process`. Jika `process` tidak diizinkan, `exec` berjalan secara sinkron dan mengabaikan `yieldMs`/`background`.
Sesi background dicakup per agen; `process` hanya melihat sesi dari agen yang sama.

## Parameter

<ParamField path="command" type="string" required>
Perintah shell yang akan dijalankan.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Direktori kerja untuk perintah.
</ParamField>

<ParamField path="env" type="object">
Pengesampingan lingkungan kunci/nilai yang digabungkan di atas lingkungan yang diwarisi.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Jadikan perintah background secara otomatis setelah penundaan ini (md).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Jadikan perintah background segera alih-alih menunggu `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Kesampingkan batas waktu exec yang dikonfigurasi untuk panggilan ini. Atur `timeout: 0` hanya ketika perintah harus berjalan tanpa batas waktu proses exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Jalankan dalam terminal semu saat tersedia. Gunakan untuk CLI khusus TTY, agen pengodean, dan UI terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Tempat mengeksekusi. `auto` diresolusikan ke `sandbox` ketika runtime sandbox aktif dan ke `gateway` jika tidak.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Diabaikan untuk panggilan alat normal. Keamanan `gateway` / `node` dikendalikan oleh
`tools.exec.security` dan `~/.openclaw/exec-approvals.json`; mode yang ditingkatkan dapat
memaksa `security=full` hanya ketika operator secara eksplisit memberi akses yang ditingkatkan.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Perilaku prompt persetujuan untuk eksekusi `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Id/nama node ketika `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Minta mode yang ditingkatkan — keluar dari sandbox ke path host yang dikonfigurasi. `security=full` dipaksa hanya ketika elevated diresolusikan ke `full`.
</ParamField>

Catatan:

- `host` secara default adalah `auto`: sandbox ketika runtime sandbox aktif untuk sesi, jika tidak Gateway.
- `host` hanya menerima `auto`, `sandbox`, `gateway`, atau `node`. Ini bukan pemilih hostname; nilai yang mirip hostname ditolak sebelum perintah berjalan.
- `auto` adalah strategi perutean default, bukan wildcard. `host=node` per panggilan diizinkan dari `auto`; `host=gateway` per panggilan hanya diizinkan ketika tidak ada runtime sandbox yang aktif.
- Tanpa konfigurasi tambahan, `host=auto` tetap "langsung berfungsi": tidak ada sandbox berarti diresolusikan ke `gateway`; sandbox aktif berarti tetap berada di sandbox.
- `elevated` keluar dari sandbox ke path host yang dikonfigurasi: `gateway` secara default, atau `node` ketika `tools.exec.host=node` (atau default sesi adalah `host=node`). Ini hanya tersedia ketika akses yang ditingkatkan diaktifkan untuk sesi/penyedia saat ini.
- Persetujuan `gateway`/`node` dikendalikan oleh `~/.openclaw/exec-approvals.json`.
- `node` memerlukan node yang dipasangkan (aplikasi pendamping atau host node tanpa antarmuka).
- Jika beberapa node tersedia, atur `exec.node` atau `tools.exec.node` untuk memilih salah satu.
- `exec host=node` adalah satu-satunya jalur eksekusi shell untuk node; wrapper lama `nodes.run` telah dihapus.
- `timeout` berlaku untuk eksekusi foreground, background, `yieldMs`, Gateway, sandbox, dan `system.run` node. Jika dihilangkan, OpenClaw menggunakan `tools.exec.timeoutSec`; `timeout: 0` eksplisit menonaktifkan batas waktu proses exec untuk panggilan tersebut.
- Pada host non-Windows, exec menggunakan `SHELL` ketika disetel; jika `SHELL` adalah `fish`, exec lebih memilih `bash` (atau `sh`)
  dari `PATH` untuk menghindari skrip yang tidak kompatibel dengan fish, lalu kembali ke `SHELL` jika keduanya tidak ada.
- Pada host Windows, exec lebih memilih penemuan PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, lalu PATH),
  lalu kembali ke Windows PowerShell 5.1.
- Eksekusi host (`gateway`/`node`) menolak pengesampingan `env.PATH` dan loader (`LD_*`/`DYLD_*`) untuk
  mencegah pembajakan biner atau kode yang disuntikkan.
- OpenClaw menetapkan `OPENCLAW_SHELL=exec` di lingkungan perintah yang dibuat (termasuk eksekusi PTY dan sandbox) sehingga aturan shell/profil dapat mendeteksi konteks alat exec.
- `openclaw channels login` diblokir dari `exec` karena merupakan alur autentikasi channel interaktif; jalankan di terminal pada host Gateway, atau gunakan alat login bawaan channel dari chat jika ada.
- Penting: sandboxing **nonaktif secara default**. Jika sandboxing nonaktif, `host=auto` implisit
  diresolusikan ke `gateway`. `host=sandbox` eksplisit tetap gagal tertutup alih-alih diam-diam
  berjalan pada host Gateway. Aktifkan sandboxing atau gunakan `host=gateway` dengan persetujuan.
- Pemeriksaan preflight skrip (untuk kesalahan umum sintaks shell Python/Node) hanya memeriksa file di dalam
  batas `workdir` efektif. Jika path skrip diresolusikan di luar `workdir`, preflight dilewati untuk
  file tersebut.
- Untuk pekerjaan berjalan lama yang dimulai sekarang, mulai sekali dan andalkan
  wake penyelesaian otomatis ketika diaktifkan dan perintah mengeluarkan output atau gagal.
  Gunakan `process` untuk log, status, input, atau intervensi; jangan meniru
  penjadwalan dengan loop sleep, loop timeout, atau polling berulang.
- Untuk pekerjaan yang harus terjadi nanti atau sesuai jadwal, gunakan Cron alih-alih
  pola sleep/delay `exec`.

## Konfigurasi

- `tools.exec.notifyOnExit` (default: true): ketika true, sesi exec yang dijadikan background memasukkan peristiwa sistem ke antrean dan meminta Heartbeat saat keluar.
- `tools.exec.approvalRunningNoticeMs` (default: 10000): keluarkan satu pemberitahuan "running" ketika exec yang dibatasi persetujuan berjalan lebih lama dari ini (0 menonaktifkan).
- `tools.exec.timeoutSec` (default: 1800): batas waktu exec default per perintah dalam detik. `timeout` per panggilan mengesampingkannya; `timeout: 0` per panggilan menonaktifkan batas waktu proses exec.
- `tools.exec.host` (default: `auto`; diresolusikan ke `sandbox` ketika runtime sandbox aktif, `gateway` jika tidak)
- `tools.exec.security` (default: `deny` untuk sandbox, `full` untuk Gateway + node ketika tidak disetel)
- `tools.exec.ask` (default: `off`)
- Exec host tanpa persetujuan adalah default untuk Gateway + node. Jika Anda menginginkan perilaku persetujuan/allowlist, perketat baik `tools.exec.*` maupun host `~/.openclaw/exec-approvals.json`; lihat [Persetujuan exec](/id/tools/exec-approvals#yolo-mode-no-approval).
- YOLO berasal dari default kebijakan host (`security=full`, `ask=off`), bukan dari `host=auto`. Jika Anda ingin memaksa perutean Gateway atau node, atur `tools.exec.host` atau gunakan `/exec host=...`.
- Dalam mode `security=full` plus `ask=off`, exec host mengikuti kebijakan yang dikonfigurasi secara langsung; tidak ada lapisan tambahan prefilter heuristik pengaburan perintah atau penolakan preflight skrip.
- `tools.exec.node` (default: tidak disetel)
- `tools.exec.strictInlineEval` (default: false): ketika true, bentuk eval interpreter inline seperti `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, dan `osascript -e` selalu memerlukan persetujuan eksplisit. `allow-always` tetap dapat mempertahankan invocation interpreter/skrip yang tidak berbahaya, tetapi bentuk eval inline tetap meminta prompt setiap kali.
- `tools.exec.commandHighlighting` (default: false): ketika true, prompt persetujuan dapat menyorot rentang perintah turunan parser dalam teks perintah. Atur ke `true` secara global atau per agen untuk mengaktifkan penyorotan teks perintah tanpa mengubah kebijakan persetujuan exec.
- `tools.exec.pathPrepend`: daftar direktori untuk ditambahkan di awal `PATH` untuk eksekusi exec (hanya Gateway + sandbox).
- `tools.exec.safeBins`: biner aman khusus stdin yang dapat berjalan tanpa entri allowlist eksplisit. Untuk detail perilaku, lihat [Biner aman](/id/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: direktori eksplisit tambahan yang dipercaya untuk pemeriksaan path `safeBins`. Entri `PATH` tidak pernah otomatis dipercaya. Default bawaan adalah `/bin` dan `/usr/bin`.
- `tools.exec.safeBinProfiles`: kebijakan argv kustom opsional per biner aman (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: menggabungkan `PATH` shell login Anda ke lingkungan exec. Pengesampingan `env.PATH`
  ditolak untuk eksekusi host. Daemon itu sendiri tetap berjalan dengan `PATH` minimal:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: menjalankan `sh -lc` (shell login) di dalam kontainer, sehingga `/etc/profile` dapat mereset `PATH`.
  OpenClaw menambahkan `env.PATH` di awal setelah sourcing profil melalui var env internal (tanpa interpolasi shell);
  `tools.exec.pathPrepend` juga berlaku di sini.
- `host=node`: hanya pengesampingan env yang tidak diblokir yang Anda teruskan yang dikirim ke node. Pengesampingan `env.PATH`
  ditolak untuk eksekusi host dan diabaikan oleh host node. Jika Anda memerlukan entri PATH tambahan pada node,
  konfigurasikan lingkungan layanan host node (systemd/launchd) atau instal alat di lokasi standar.

Pengikatan node per agen (gunakan indeks daftar agen dalam konfigurasi):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

UI kontrol: tab Nodes menyertakan panel kecil "Pengikatan node exec" untuk pengaturan yang sama.

## Pengesampingan sesi (`/exec`)

Gunakan `/exec` untuk menetapkan default **per sesi** untuk `host`, `security`, `ask`, dan `node`.
Kirim `/exec` tanpa argumen untuk menampilkan nilai saat ini.

Contoh:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Model otorisasi

`/exec` hanya dihormati untuk **pengirim terotorisasi** (allowlist/pairing channel plus `commands.useAccessGroups`).
Ini hanya memperbarui **status sesi** dan tidak menulis konfigurasi. Untuk menonaktifkan exec secara keras, tolak melalui kebijakan alat
(`tools.deny: ["exec"]` atau per agen). Persetujuan host tetap berlaku kecuali Anda secara eksplisit menetapkan
`security=full` dan `ask=off`.

## Persetujuan exec (aplikasi pendamping / host node)

Agen yang di-sandbox dapat memerlukan persetujuan per permintaan sebelum `exec` berjalan pada Gateway atau host node.
Lihat [Persetujuan exec](/id/tools/exec-approvals) untuk kebijakan, allowlist, dan alur UI.

Ketika persetujuan diperlukan, alat exec segera mengembalikan
`status: "approval-pending"` dan id persetujuan. Setelah disetujui (atau ditolak / waktu habis),
Gateway mengeluarkan peristiwa sistem (`Exec finished` / `Exec denied`). Jika perintah masih
berjalan setelah `tools.exec.approvalRunningNoticeMs`, satu pemberitahuan `Exec running` dikeluarkan.
Pada channel dengan kartu/tombol persetujuan native, agen harus mengandalkan
UI native tersebut terlebih dahulu dan hanya menyertakan perintah `/approve` manual ketika hasil
alat secara eksplisit mengatakan persetujuan chat tidak tersedia atau persetujuan manual adalah
satu-satunya jalur.

## Allowlist + biner aman

Penegakan allowlist manual mencocokkan glob path biner yang diresolusikan dan glob nama perintah polos.
Nama polos hanya cocok dengan perintah yang dipanggil melalui PATH, sehingga `rg` dapat cocok dengan
`/opt/homebrew/bin/rg` ketika perintahnya adalah `rg`, tetapi tidak dengan `./rg` atau `/tmp/rg`.
Ketika `security=allowlist`, perintah shell otomatis diizinkan hanya jika setiap segmen pipeline
ada di allowlist atau merupakan biner aman. Chaining (`;`, `&&`, `||`) dan redirection
ditolak dalam mode allowlist kecuali setiap segmen tingkat atas memenuhi
allowlist (termasuk biner aman). Redirection tetap tidak didukung.
Kepercayaan tahan lama `allow-always` tidak melewati aturan itu: perintah berantai tetap memerlukan setiap
segmen tingkat atas untuk cocok.

`autoAllowSkills` adalah jalur kemudahan terpisah dalam persetujuan exec. Ini tidak sama dengan
entri allowlist path manual. Untuk kepercayaan eksplisit yang ketat, biarkan `autoAllowSkills` dinonaktifkan.

Gunakan dua kontrol untuk pekerjaan yang berbeda:

- `tools.exec.safeBins`: filter stream kecil yang hanya menggunakan stdin.
- `tools.exec.safeBinTrustedDirs`: direktori tepercaya tambahan yang eksplisit untuk jalur executable safe-bin.
- `tools.exec.safeBinProfiles`: kebijakan argv eksplisit untuk safe bin kustom.
- allowlist: kepercayaan eksplisit untuk jalur executable.

Jangan perlakukan `safeBins` sebagai allowlist generik, dan jangan tambahkan biner interpreter/runtime (misalnya `python3`, `node`, `ruby`, `bash`). Jika Anda membutuhkannya, gunakan entri allowlist eksplisit dan tetap aktifkan prompt persetujuan.
`openclaw security audit` memperingatkan ketika entri `safeBins` interpreter/runtime tidak memiliki profil eksplisit, dan `openclaw doctor --fix` dapat membuat kerangka entri `safeBinProfiles` kustom yang hilang.
`openclaw security audit` dan `openclaw doctor` juga memperingatkan ketika Anda secara eksplisit menambahkan kembali bin berperilaku luas seperti `jq` ke dalam `safeBins`.
Jika Anda secara eksplisit memasukkan interpreter ke allowlist, aktifkan `tools.exec.strictInlineEval` agar bentuk evaluasi kode inline tetap memerlukan persetujuan baru.

Untuk detail kebijakan lengkap dan contoh, lihat [Persetujuan exec](/id/tools/exec-approvals-advanced#safe-bins-stdin-only) dan [Safe bins versus allowlist](/id/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Contoh

Foreground:

```json
{ "tool": "exec", "command": "ls -la" }
```

Background + poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Polling digunakan untuk status sesuai permintaan, bukan loop tunggu. Jika bangun otomatis saat selesai
diaktifkan, perintah dapat membangunkan sesi ketika menghasilkan output atau gagal.

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

Paste (secara default dengan bracket):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` adalah subtool dari `exec` untuk pengeditan multi-file terstruktur.
Ini diaktifkan secara default untuk model OpenAI dan OpenAI Codex. Gunakan konfigurasi hanya
ketika Anda ingin menonaktifkannya atau membatasinya ke model tertentu:

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
- Kebijakan tool tetap berlaku; `allow: ["write"]` secara implisit mengizinkan `apply_patch`.
- `deny: ["write"]` tidak menolak `apply_patch`; tolak `apply_patch` secara eksplisit atau gunakan `deny: ["group:fs"]` ketika penulisan patch juga harus diblokir.
- Konfigurasi berada di bawah `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` defaultnya `true`; atur ke `false` untuk menonaktifkan tool bagi model OpenAI.
- `tools.exec.applyPatch.workspaceOnly` defaultnya `true` (terbatas dalam workspace). Atur ke `false` hanya jika Anda sengaja ingin `apply_patch` menulis/menghapus di luar direktori workspace.

## Terkait

- [Persetujuan Exec](/id/tools/exec-approvals) — gerbang persetujuan untuk perintah shell
- [Sandboxing](/id/gateway/sandboxing) — menjalankan perintah di lingkungan sandbox
- [Proses Background](/id/gateway/background-process) — exec yang berjalan lama dan tool proses
- [Keamanan](/id/gateway/security) — kebijakan tool dan akses yang ditingkatkan
