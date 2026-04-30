---
read_when:
    - Menggunakan atau memodifikasi alat exec
    - Men-debug perilaku stdin atau TTY
summary: Penggunaan alat Exec, mode stdin, dan dukungan TTY
title: Alat eksekusi
x-i18n:
    generated_at: "2026-04-30T10:15:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7949cfde9f141202a3bc36c2be72ecdf6d43305b5f16fb02835a69bcaa46067b
    source_path: tools/exec.md
    workflow: 16
---

Jalankan perintah shell di workspace. Mendukung eksekusi foreground + background melalui `process`.
Jika `process` tidak diizinkan, `exec` berjalan secara sinkron dan mengabaikan `yieldMs`/`background`.
Sesi background diberi cakupan per agen; `process` hanya melihat sesi dari agen yang sama.

## Parameter

<ParamField path="command" type="string" required>
Perintah shell yang akan dijalankan.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Direktori kerja untuk perintah.
</ParamField>

<ParamField path="env" type="object">
Override lingkungan key/value yang digabungkan di atas lingkungan yang diwarisi.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Jadikan perintah background otomatis setelah penundaan ini (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Jadikan perintah background segera alih-alih menunggu `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Override timeout exec yang dikonfigurasi untuk panggilan ini. Tetapkan `timeout: 0` hanya ketika perintah harus berjalan tanpa timeout proses exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Jalankan dalam pseudo-terminal bila tersedia. Gunakan untuk CLI yang hanya mendukung TTY, agen pengodean, dan UI terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Tempat eksekusi. `auto` diselesaikan menjadi `sandbox` saat runtime sandbox aktif dan menjadi `gateway` jika tidak.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Mode penegakan untuk eksekusi `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Perilaku prompt persetujuan untuk eksekusi `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
ID/nama Node saat `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Minta mode elevated — keluar dari sandbox ke path host yang dikonfigurasi. `security=full` dipaksakan hanya ketika elevated diselesaikan menjadi `full`.
</ParamField>

Catatan:

- `host` default ke `auto`: sandbox saat runtime sandbox aktif untuk sesi, jika tidak Gateway.
- `host` hanya menerima `auto`, `sandbox`, `gateway`, atau `node`. Ini bukan pemilih hostname; nilai yang mirip hostname ditolak sebelum perintah berjalan.
- `auto` adalah strategi routing default, bukan wildcard. `host=node` per panggilan diizinkan dari `auto`; `host=gateway` per panggilan hanya diizinkan saat tidak ada runtime sandbox yang aktif.
- Tanpa konfigurasi tambahan, `host=auto` tetap "langsung berfungsi": tidak ada sandbox berarti diselesaikan ke `gateway`; sandbox live berarti tetap berada di sandbox.
- `elevated` keluar dari sandbox ke path host yang dikonfigurasi: `gateway` secara default, atau `node` saat `tools.exec.host=node` (atau default sesi adalah `host=node`). Ini hanya tersedia saat akses elevated diaktifkan untuk sesi/provider saat ini.
- Persetujuan `gateway`/`node` dikontrol oleh `~/.openclaw/exec-approvals.json`.
- `node` memerlukan Node yang dipasangkan (aplikasi pendamping atau host Node headless).
- Jika beberapa Node tersedia, tetapkan `exec.node` atau `tools.exec.node` untuk memilih salah satu.
- `exec host=node` adalah satu-satunya path eksekusi shell untuk Node; wrapper lama `nodes.run` telah dihapus.
- `timeout` berlaku untuk eksekusi foreground, background, `yieldMs`, Gateway, sandbox, dan `system.run` Node. Jika dihilangkan, OpenClaw menggunakan `tools.exec.timeoutSec`; `timeout: 0` eksplisit menonaktifkan timeout proses exec untuk panggilan tersebut.
- Pada host non-Windows, exec menggunakan `SHELL` saat ditetapkan; jika `SHELL` adalah `fish`, exec lebih memilih `bash` (atau `sh`)
  dari `PATH` untuk menghindari skrip yang tidak kompatibel dengan fish, lalu fallback ke `SHELL` jika keduanya tidak ada.
- Pada host Windows, exec lebih memilih penemuan PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, lalu PATH),
  lalu fallback ke Windows PowerShell 5.1.
- Eksekusi host (`gateway`/`node`) menolak `env.PATH` dan override loader (`LD_*`/`DYLD_*`) untuk
  mencegah pembajakan biner atau kode yang diinjeksi.
- OpenClaw menetapkan `OPENCLAW_SHELL=exec` dalam lingkungan perintah yang dibuat (termasuk eksekusi PTY dan sandbox) agar aturan shell/profile dapat mendeteksi konteks alat exec.
- `openclaw channels login` diblokir dari `exec` karena ini adalah alur auth channel interaktif; jalankan di terminal pada host Gateway, atau gunakan alat login bawaan channel dari chat saat tersedia.
- Penting: sandboxing **nonaktif secara default**. Jika sandboxing nonaktif, `host=auto` implisit
  diselesaikan ke `gateway`. `host=sandbox` eksplisit tetap gagal tertutup alih-alih diam-diam
  berjalan pada host Gateway. Aktifkan sandboxing atau gunakan `host=gateway` dengan persetujuan.
- Pemeriksaan preflight skrip (untuk kesalahan umum sintaks shell Python/Node) hanya memeriksa file di dalam
  batas `workdir` efektif. Jika path skrip diselesaikan di luar `workdir`, preflight dilewati untuk
  file tersebut.
- Untuk pekerjaan berjalan lama yang dimulai sekarang, mulai sekali dan andalkan wake
  penyelesaian otomatis saat diaktifkan dan perintah menghasilkan output atau gagal.
  Gunakan `process` untuk log, status, input, atau intervensi; jangan meniru
  penjadwalan dengan loop sleep, loop timeout, atau polling berulang.
- Untuk pekerjaan yang harus terjadi nanti atau sesuai jadwal, gunakan cron alih-alih
  pola sleep/delay `exec`.

## Konfigurasi

- `tools.exec.notifyOnExit` (default: true): saat true, sesi exec yang dijadikan background mengantrekan event sistem dan meminta Heartbeat saat keluar.
- `tools.exec.approvalRunningNoticeMs` (default: 10000): kirim satu pemberitahuan “running” saat exec yang dibatasi persetujuan berjalan lebih lama dari ini (0 menonaktifkan).
- `tools.exec.timeoutSec` (default: 1800): timeout exec default per perintah dalam detik. `timeout` per panggilan meng-override ini; `timeout: 0` per panggilan menonaktifkan timeout proses exec.
- `tools.exec.host` (default: `auto`; diselesaikan menjadi `sandbox` saat runtime sandbox aktif, `gateway` jika tidak)
- `tools.exec.security` (default: `deny` untuk sandbox, `full` untuk Gateway + Node saat tidak ditetapkan)
- `tools.exec.ask` (default: `off`)
- Exec host tanpa persetujuan adalah default untuk Gateway + Node. Jika Anda menginginkan perilaku persetujuan/allowlist, perketat `tools.exec.*` dan `~/.openclaw/exec-approvals.json` host; lihat [Persetujuan exec](/id/tools/exec-approvals#no-approval-yolo-mode).
- YOLO berasal dari default kebijakan host (`security=full`, `ask=off`), bukan dari `host=auto`. Jika Anda ingin memaksa routing Gateway atau Node, tetapkan `tools.exec.host` atau gunakan `/exec host=...`.
- Dalam mode `security=full` plus `ask=off`, exec host mengikuti kebijakan yang dikonfigurasi secara langsung; tidak ada lapisan tambahan prefilter heuristik obfuscation perintah atau penolakan preflight skrip.
- `tools.exec.node` (default: tidak ditetapkan)
- `tools.exec.strictInlineEval` (default: false): saat true, bentuk eval interpreter inline seperti `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, dan `osascript -e` selalu memerlukan persetujuan eksplisit. `allow-always` masih dapat mempertahankan invokasi interpreter/skrip yang aman, tetapi bentuk inline-eval tetap memunculkan prompt setiap kali.
- `tools.exec.pathPrepend`: daftar direktori untuk ditambahkan ke awal `PATH` untuk run exec (Gateway + sandbox saja).
- `tools.exec.safeBins`: biner aman khusus stdin yang dapat berjalan tanpa entri allowlist eksplisit. Untuk detail perilaku, lihat [Safe bins](/id/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: direktori eksplisit tambahan yang dipercaya untuk pemeriksaan path `safeBins`. Entri `PATH` tidak pernah otomatis dipercaya. Default bawaan adalah `/bin` dan `/usr/bin`.
- `tools.exec.safeBinProfiles`: kebijakan argv kustom opsional per safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: menggabungkan `PATH` login-shell Anda ke dalam lingkungan exec. Override `env.PATH`
  ditolak untuk eksekusi host. Daemon itu sendiri tetap berjalan dengan `PATH` minimal:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: menjalankan `sh -lc` (login shell) di dalam kontainer, sehingga `/etc/profile` dapat mereset `PATH`.
  OpenClaw menambahkan `env.PATH` ke awal setelah profile sourcing melalui variabel env internal (tanpa interpolasi shell);
  `tools.exec.pathPrepend` juga berlaku di sini.
- `host=node`: hanya override env yang tidak diblokir yang Anda teruskan yang dikirim ke Node. Override `env.PATH`
  ditolak untuk eksekusi host dan diabaikan oleh host Node. Jika Anda memerlukan entri PATH tambahan pada Node,
  konfigurasikan lingkungan layanan host Node (systemd/launchd) atau instal alat di lokasi standar.

Binding Node per agen (gunakan indeks daftar agen di konfigurasi):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: tab Nodes menyertakan panel kecil “Exec node binding” untuk pengaturan yang sama.

## Override sesi (`/exec`)

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

## Persetujuan exec (aplikasi pendamping / host Node)

Agen yang disandbox dapat memerlukan persetujuan per permintaan sebelum `exec` berjalan pada host Gateway atau Node.
Lihat [Persetujuan exec](/id/tools/exec-approvals) untuk kebijakan, allowlist, dan alur UI.

Saat persetujuan diperlukan, alat exec segera mengembalikan
`status: "approval-pending"` dan ID persetujuan. Setelah disetujui (atau ditolak / timeout),
Gateway mengirim event sistem (`Exec finished` / `Exec denied`). Jika perintah masih
berjalan setelah `tools.exec.approvalRunningNoticeMs`, satu pemberitahuan `Exec running` dikirim.
Pada channel dengan kartu/tombol persetujuan native, agen harus mengandalkan
UI native tersebut terlebih dahulu dan hanya menyertakan perintah manual `/approve` saat hasil
alat secara eksplisit mengatakan persetujuan chat tidak tersedia atau persetujuan manual adalah
satu-satunya path.

## Allowlist + safe bins

Penegakan allowlist manual mencocokkan glob path biner yang diselesaikan dan glob nama perintah polos.
Nama polos hanya cocok dengan perintah yang dipanggil melalui PATH, sehingga `rg` dapat cocok dengan
`/opt/homebrew/bin/rg` saat perintahnya adalah `rg`, tetapi tidak dengan `./rg` atau `/tmp/rg`.
Saat `security=allowlist`, perintah shell otomatis diizinkan hanya jika setiap segmen pipeline
ada di allowlist atau merupakan safe bin. Chaining (`;`, `&&`, `||`) dan redirection
ditolak dalam mode allowlist kecuali setiap segmen tingkat atas memenuhi
allowlist (termasuk safe bins). Redirection tetap tidak didukung.
Kepercayaan tahan lama `allow-always` tidak melewati aturan tersebut: perintah berantai tetap mengharuskan setiap
segmen tingkat atas cocok.

`autoAllowSkills` adalah path kemudahan terpisah dalam persetujuan exec. Ini tidak sama dengan
entri allowlist path manual. Untuk kepercayaan eksplisit yang ketat, biarkan `autoAllowSkills` dinonaktifkan.

Gunakan dua kontrol untuk tugas yang berbeda:

- `tools.exec.safeBins`: filter stream kecil khusus stdin.
- `tools.exec.safeBinTrustedDirs`: direktori tepercaya ekstra eksplisit untuk path executable safe-bin.
- `tools.exec.safeBinProfiles`: kebijakan argv eksplisit untuk safe bin kustom.
- allowlist: kepercayaan eksplisit untuk path executable.

Jangan perlakukan `safeBins` sebagai daftar izin generik, dan jangan tambahkan biner interpreter/runtime (misalnya `python3`, `node`, `ruby`, `bash`). Jika Anda membutuhkannya, gunakan entri daftar izin eksplisit dan tetap aktifkan prompt persetujuan.
`openclaw security audit` memperingatkan ketika entri `safeBins` interpreter/runtime tidak memiliki profil eksplisit, dan `openclaw doctor --fix` dapat membuat kerangka entri `safeBinProfiles` kustom yang belum ada.
`openclaw security audit` dan `openclaw doctor` juga memperingatkan ketika Anda secara eksplisit menambahkan kembali bin berperilaku luas seperti `jq` ke dalam `safeBins`.
Jika Anda secara eksplisit mengizinkan interpreter, aktifkan `tools.exec.strictInlineEval` agar bentuk eval kode inline tetap memerlukan persetujuan baru.

Untuk detail kebijakan lengkap dan contoh, lihat [Persetujuan exec](/id/tools/exec-approvals-advanced#safe-bins-stdin-only) dan [Bin aman versus daftar izin](/id/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

Polling digunakan untuk status sesuai permintaan, bukan loop menunggu. Jika bangun penyelesaian otomatis
diaktifkan, perintah dapat membangunkan sesi ketika menghasilkan output atau gagal.

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

Tempel (dengan bracket secara default):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` adalah subtool dari `exec` untuk edit multi-file terstruktur.
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
- Konfigurasi berada di bawah `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` default-nya `true`; atur ke `false` untuk menonaktifkan tool bagi model OpenAI.
- `tools.exec.applyPatch.workspaceOnly` default-nya `true` (terbatas dalam workspace). Atur ke `false` hanya jika Anda secara sengaja ingin `apply_patch` menulis/menghapus di luar direktori workspace.

## Terkait

- [Persetujuan Exec](/id/tools/exec-approvals) — gerbang persetujuan untuk perintah shell
- [Sandboxing](/id/gateway/sandboxing) — menjalankan perintah di lingkungan sandbox
- [Proses Latar Belakang](/id/gateway/background-process) — exec dan tool proses yang berjalan lama
- [Keamanan](/id/gateway/security) — kebijakan tool dan akses yang ditingkatkan
