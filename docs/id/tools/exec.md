---
read_when:
    - Menggunakan atau memodifikasi alat exec
    - Pemecahan masalah perilaku stdin atau TTY
summary: Penggunaan alat exec, mode stdin, dan dukungan TTY
title: Alat eksekusi
x-i18n:
    generated_at: "2026-05-03T21:37:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: dbc8dda08abfd4d7b2e2cd5c7319a7eddf1575156bbfbc52df841908589c8c81
    source_path: tools/exec.md
    workflow: 16
---

Jalankan perintah shell di workspace. Mendukung eksekusi latar depan + latar belakang melalui `process`.
Jika `process` tidak diizinkan, `exec` berjalan secara sinkron dan mengabaikan `yieldMs`/`background`.
Sesi latar belakang dibatasi per agen; `process` hanya melihat sesi dari agen yang sama.

## Parameter

<ParamField path="command" type="string" required>
Perintah shell yang akan dijalankan.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Direktori kerja untuk perintah.
</ParamField>

<ParamField path="env" type="object">
Penimpaan lingkungan key/value yang digabungkan di atas lingkungan turunan.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Otomatis jalankan perintah di latar belakang setelah penundaan ini (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Jalankan perintah di latar belakang segera alih-alih menunggu `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Timpa batas waktu exec yang dikonfigurasi untuk panggilan ini. Tetapkan `timeout: 0` hanya ketika perintah harus berjalan tanpa batas waktu proses exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Jalankan di pseudo-terminal jika tersedia. Gunakan untuk CLI khusus TTY, agen pengodean, dan UI terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Tempat mengeksekusi. `auto` diresolusikan ke `sandbox` ketika runtime sandbox aktif dan ke `gateway` jika tidak.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Mode penegakan untuk eksekusi `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Perilaku prompt persetujuan untuk eksekusi `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Id/nama Node ketika `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Minta mode yang ditingkatkan — keluar dari sandbox ke jalur host yang dikonfigurasi. `security=full` dipaksakan hanya ketika elevated diresolusikan ke `full`.
</ParamField>

Catatan:

- `host` default ke `auto`: sandbox ketika runtime sandbox aktif untuk sesi, jika tidak gateway.
- `host` hanya menerima `auto`, `sandbox`, `gateway`, atau `node`. Ini bukan pemilih hostname; nilai seperti hostname ditolak sebelum perintah berjalan.
- `auto` adalah strategi perutean default, bukan wildcard. `host=node` per panggilan diizinkan dari `auto`; `host=gateway` per panggilan hanya diizinkan ketika tidak ada runtime sandbox yang aktif.
- Tanpa konfigurasi tambahan, `host=auto` tetap "langsung berfungsi": tanpa sandbox berarti diresolusikan ke `gateway`; sandbox aktif berarti tetap berada di sandbox.
- `elevated` keluar dari sandbox ke jalur host yang dikonfigurasi: `gateway` secara default, atau `node` ketika `tools.exec.host=node` (atau default sesi adalah `host=node`). Ini hanya tersedia ketika akses yang ditingkatkan diaktifkan untuk sesi/penyedia saat ini.
- Persetujuan `gateway`/`node` dikontrol oleh `~/.openclaw/exec-approvals.json`.
- `node` memerlukan node yang dipasangkan (aplikasi pendamping atau host node headless).
- Jika beberapa node tersedia, tetapkan `exec.node` atau `tools.exec.node` untuk memilih salah satunya.
- `exec host=node` adalah satu-satunya jalur eksekusi shell untuk node; pembungkus lama `nodes.run` telah dihapus.
- `timeout` berlaku untuk eksekusi latar depan, latar belakang, `yieldMs`, gateway, sandbox, dan `system.run` node. Jika dihilangkan, OpenClaw menggunakan `tools.exec.timeoutSec`; `timeout: 0` eksplisit menonaktifkan batas waktu proses exec untuk panggilan tersebut.
- Pada host non-Windows, exec menggunakan `SHELL` ketika ditetapkan; jika `SHELL` adalah `fish`, exec lebih memilih `bash` (atau `sh`)
  dari `PATH` untuk menghindari skrip yang tidak kompatibel dengan fish, lalu kembali ke `SHELL` jika keduanya tidak ada.
- Pada host Windows, exec lebih memilih penemuan PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, lalu PATH),
  lalu kembali ke Windows PowerShell 5.1.
- Eksekusi host (`gateway`/`node`) menolak `env.PATH` dan penimpaan loader (`LD_*`/`DYLD_*`) untuk
  mencegah pembajakan biner atau kode yang disuntikkan.
- OpenClaw menetapkan `OPENCLAW_SHELL=exec` di lingkungan perintah yang dijalankan (termasuk eksekusi PTY dan sandbox) sehingga aturan shell/profile dapat mendeteksi konteks alat exec.
- `openclaw channels login` diblokir dari `exec` karena ini adalah alur auth channel interaktif; jalankan di terminal pada host gateway, atau gunakan alat login native channel dari chat jika tersedia.
- Penting: sandboxing **nonaktif secara default**. Jika sandboxing nonaktif, `host=auto` implisit
  diresolusikan ke `gateway`. `host=sandbox` eksplisit tetap gagal tertutup alih-alih diam-diam
  berjalan pada host gateway. Aktifkan sandboxing atau gunakan `host=gateway` dengan persetujuan.
- Pemeriksaan preflight skrip (untuk kesalahan umum sintaks shell Python/Node) hanya memeriksa file di dalam
  batas `workdir` efektif. Jika jalur skrip diresolusikan di luar `workdir`, preflight dilewati untuk
  file tersebut.
- Untuk pekerjaan berjalan lama yang dimulai sekarang, mulai sekali dan andalkan wake penyelesaian
  otomatis ketika diaktifkan dan perintah menghasilkan output atau gagal.
  Gunakan `process` untuk log, status, input, atau intervensi; jangan meniru
  penjadwalan dengan loop sleep, loop timeout, atau polling berulang.
- Untuk pekerjaan yang harus terjadi nanti atau sesuai jadwal, gunakan cron alih-alih
  pola sleep/delay `exec`.

## Konfigurasi

- `tools.exec.notifyOnExit` (default: true): ketika true, sesi exec yang dilatarkanbelakangkan mengantrekan event sistem dan meminta Heartbeat saat keluar.
- `tools.exec.approvalRunningNoticeMs` (default: 10000): emit satu pemberitahuan “berjalan” ketika exec yang dijaga persetujuan berjalan lebih lama dari ini (0 menonaktifkan).
- `tools.exec.timeoutSec` (default: 1800): batas waktu exec default per perintah dalam detik. `timeout` per panggilan menimpanya; `timeout: 0` per panggilan menonaktifkan batas waktu proses exec.
- `tools.exec.host` (default: `auto`; diresolusikan ke `sandbox` ketika runtime sandbox aktif, `gateway` jika tidak)
- `tools.exec.security` (default: `deny` untuk sandbox, `full` untuk gateway + node ketika tidak ditetapkan)
- `tools.exec.ask` (default: `off`)
- Exec host tanpa persetujuan adalah default untuk gateway + node. Jika Anda menginginkan perilaku persetujuan/daftar izin, perketat `tools.exec.*` dan host `~/.openclaw/exec-approvals.json`; lihat [Persetujuan exec](/id/tools/exec-approvals#yolo-mode-no-approval).
- YOLO berasal dari default kebijakan host (`security=full`, `ask=off`), bukan dari `host=auto`. Jika Anda ingin memaksa perutean gateway atau node, tetapkan `tools.exec.host` atau gunakan `/exec host=...`.
- Dalam mode `security=full` plus `ask=off`, exec host mengikuti kebijakan yang dikonfigurasi secara langsung; tidak ada lapisan tambahan prefilter heuristik obfuscation perintah atau penolakan preflight skrip.
- `tools.exec.node` (default: tidak ditetapkan)
- `tools.exec.strictInlineEval` (default: false): ketika true, bentuk eval interpreter inline seperti `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, dan `osascript -e` selalu memerlukan persetujuan eksplisit. `allow-always` masih dapat mempertahankan invokasi interpreter/skrip yang jinak, tetapi bentuk inline-eval tetap memunculkan prompt setiap kali.
- `tools.exec.pathPrepend`: daftar direktori untuk ditambahkan di awal `PATH` untuk run exec (hanya gateway + sandbox).
- `tools.exec.safeBins`: biner aman hanya-stdin yang dapat berjalan tanpa entri daftar izin eksplisit. Untuk detail perilaku, lihat [Bin aman](/id/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: direktori eksplisit tambahan yang dipercaya untuk pemeriksaan jalur `safeBins`. Entri `PATH` tidak pernah otomatis dipercaya. Default bawaan adalah `/bin` dan `/usr/bin`.
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

- `host=gateway`: menggabungkan `PATH` shell login Anda ke lingkungan exec. Penimpaan `env.PATH`
  ditolak untuk eksekusi host. Daemon itu sendiri tetap berjalan dengan `PATH` minimal:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: menjalankan `sh -lc` (login shell) di dalam kontainer, sehingga `/etc/profile` dapat mereset `PATH`.
  OpenClaw menambahkan `env.PATH` di awal setelah sourcing profile melalui env var internal (tanpa interpolasi shell);
  `tools.exec.pathPrepend` juga berlaku di sini.
- `host=node`: hanya penimpaan env yang tidak diblokir yang Anda berikan yang dikirim ke node. Penimpaan `env.PATH`
  ditolak untuk eksekusi host dan diabaikan oleh host node. Jika Anda memerlukan entri PATH tambahan pada node,
  konfigurasikan lingkungan layanan host node (systemd/launchd) atau instal alat di lokasi standar.

Pengikatan node per agen (gunakan indeks daftar agen dalam konfigurasi):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: tab Nodes mencakup panel kecil “Pengikatan node exec” untuk pengaturan yang sama.

## Penimpaan sesi (`/exec`)

Gunakan `/exec` untuk menetapkan default **per sesi** untuk `host`, `security`, `ask`, dan `node`.
Kirim `/exec` tanpa argumen untuk menampilkan nilai saat ini.

Contoh:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Model otorisasi

`/exec` hanya dihormati untuk **pengirim terotorisasi** (daftar izin/pairing channel plus `commands.useAccessGroups`).
Ini hanya memperbarui **status sesi** dan tidak menulis konfigurasi. Untuk menonaktifkan exec secara permanen, tolak melalui
kebijakan alat (`tools.deny: ["exec"]` atau per agen). Persetujuan host tetap berlaku kecuali Anda secara eksplisit menetapkan
`security=full` dan `ask=off`.

## Persetujuan exec (aplikasi pendamping / host node)

Agen yang disandbox dapat memerlukan persetujuan per permintaan sebelum `exec` berjalan pada gateway atau host node.
Lihat [Persetujuan exec](/id/tools/exec-approvals) untuk kebijakan, daftar izin, dan alur UI.

Ketika persetujuan diperlukan, alat exec langsung mengembalikan
`status: "approval-pending"` dan id persetujuan. Setelah disetujui (atau ditolak / waktu habis),
Gateway mengemit event sistem (`Exec finished` / `Exec denied`). Jika perintah masih
berjalan setelah `tools.exec.approvalRunningNoticeMs`, satu pemberitahuan `Exec running` diemit.
Pada channel dengan kartu/tombol persetujuan native, agen harus mengandalkan
UI native tersebut terlebih dahulu dan hanya menyertakan perintah manual `/approve` ketika hasil
alat secara eksplisit mengatakan persetujuan chat tidak tersedia atau persetujuan manual adalah
satu-satunya jalur.

## Daftar izin + bin aman

Penegakan daftar izin manual mencocokkan glob jalur biner yang diresolusikan dan glob nama perintah polos.
Nama polos hanya cocok dengan perintah yang dipanggil melalui PATH, sehingga `rg` dapat cocok dengan
`/opt/homebrew/bin/rg` ketika perintahnya adalah `rg`, tetapi tidak `./rg` atau `/tmp/rg`.
Ketika `security=allowlist`, perintah shell hanya diizinkan otomatis jika setiap segmen pipeline
ada dalam daftar izin atau merupakan bin aman. Chaining (`;`, `&&`, `||`) dan redirection
ditolak dalam mode daftar izin kecuali setiap segmen tingkat atas memenuhi
daftar izin (termasuk bin aman). Redirection tetap tidak didukung.
Kepercayaan tahan lama `allow-always` tidak melewati aturan tersebut: perintah berantai tetap memerlukan setiap
segmen tingkat atas untuk cocok.

`autoAllowSkills` adalah jalur kemudahan terpisah dalam persetujuan exec. Ini tidak sama dengan
entri daftar izin jalur manual. Untuk kepercayaan eksplisit yang ketat, biarkan `autoAllowSkills` dinonaktifkan.

Gunakan dua kontrol untuk pekerjaan yang berbeda:

- `tools.exec.safeBins`: filter stream kecil hanya-stdin.
- `tools.exec.safeBinTrustedDirs`: direktori tepercaya tambahan eksplisit untuk jalur executable bin aman.
- `tools.exec.safeBinProfiles`: kebijakan argv eksplisit untuk bin aman kustom.
- daftar izin: kepercayaan eksplisit untuk jalur executable.

Jangan perlakukan `safeBins` sebagai daftar izin generik, dan jangan tambahkan biner interpreter/runtime (misalnya `python3`, `node`, `ruby`, `bash`). Jika Anda memerlukannya, gunakan entri daftar izin eksplisit dan tetap aktifkan permintaan persetujuan.
`openclaw security audit` memperingatkan ketika entri `safeBins` interpreter/runtime tidak memiliki profil eksplisit, dan `openclaw doctor --fix` dapat membuat kerangka entri `safeBinProfiles` kustom yang hilang.
`openclaw security audit` dan `openclaw doctor` juga memperingatkan ketika Anda secara eksplisit menambahkan kembali biner dengan perilaku luas seperti `jq` ke dalam `safeBins`.
Jika Anda secara eksplisit mengizinkan interpreter, aktifkan `tools.exec.strictInlineEval` agar bentuk evaluasi kode inline tetap memerlukan persetujuan baru.

Untuk detail kebijakan dan contoh lengkap, lihat [Persetujuan exec](/id/tools/exec-approvals-advanced#safe-bins-stdin-only) dan [Bin aman versus daftar izin](/id/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Contoh

Latar depan:

```json
{ "tool": "exec", "command": "ls -la" }
```

Latar belakang + poling:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Poling digunakan untuk status sesuai permintaan, bukan loop menunggu. Jika bangun penyelesaian otomatis
diaktifkan, perintah dapat mengaktifkan kembali sesi saat mengeluarkan output atau gagal.

Kirim tombol (gaya tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Kirim (hanya kirim CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Tempel (diberi kurung secara default):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` adalah subalat dari `exec` untuk pengeditan multi-file terstruktur.
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
- Kebijakan alat tetap berlaku; `allow: ["write"]` secara implisit mengizinkan `apply_patch`.
- `deny: ["write"]` tidak menolak `apply_patch`; tolak `apply_patch` secara eksplisit atau gunakan `deny: ["group:fs"]` ketika penulisan patch juga harus diblokir.
- Konfigurasi berada di bawah `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` defaultnya adalah `true`; atur ke `false` untuk menonaktifkan alat bagi model OpenAI.
- `tools.exec.applyPatch.workspaceOnly` defaultnya adalah `true` (terbatas dalam workspace). Atur ke `false` hanya jika Anda secara sengaja ingin `apply_patch` menulis/menghapus di luar direktori workspace.

## Terkait

- [Persetujuan Exec](/id/tools/exec-approvals) — gerbang persetujuan untuk perintah shell
- [Sandboxing](/id/gateway/sandboxing) — menjalankan perintah di lingkungan sandbox
- [Proses Latar Belakang](/id/gateway/background-process) — exec yang berjalan lama dan alat proses
- [Keamanan](/id/gateway/security) — kebijakan alat dan akses yang ditingkatkan
