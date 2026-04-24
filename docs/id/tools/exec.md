---
read_when:
    - Menggunakan atau memodifikasi alat exec
    - Men-debug perilaku stdin atau TTY
summary: Penggunaan alat exec, mode stdin, dan dukungan TTY
title: Alat exec
x-i18n:
    generated_at: "2026-04-24T09:30:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cad17fecfaf7d6a523282ef4f0090e4ffaab89ab53945b5cd831e426f3fc3ac
    source_path: tools/exec.md
    workflow: 15
---

Jalankan perintah shell di workspace. Mendukung eksekusi foreground + background melalui `process`.
Jika `process` tidak diizinkan, `exec` berjalan sinkron dan mengabaikan `yieldMs`/`background`.
Sesi background dibatasi per agen; `process` hanya melihat sesi dari agen yang sama.

## Parameter

<ParamField path="command" type="string" required>
Perintah shell yang akan dijalankan.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Direktori kerja untuk perintah.
</ParamField>

<ParamField path="env" type="object">
Override environment key/value yang digabungkan di atas environment turunan.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Otomatis jadikan background setelah jeda ini (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Jadikan background segera alih-alih menunggu `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="1800">
Hentikan perintah setelah jumlah detik ini.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Jalankan dalam pseudo-terminal jika tersedia. Gunakan untuk CLI yang hanya mendukung TTY, agen coding, dan UI terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Tempat eksekusi. `auto` diselesaikan menjadi `sandbox` saat runtime sandbox aktif dan `gateway` jika tidak.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Mode enforcement untuk eksekusi `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Perilaku prompt persetujuan untuk eksekusi `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
ID/nama Node saat `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Minta mode elevated — keluar dari sandbox ke path host yang dikonfigurasi. `security=full` dipaksakan hanya saat elevated diselesaikan menjadi `full`.
</ParamField>

Catatan:

- `host` default ke `auto`: sandbox saat runtime sandbox aktif untuk sesi, jika tidak gateway.
- `auto` adalah strategi perutean default, bukan wildcard. `host=node` per pemanggilan diizinkan dari `auto`; `host=gateway` per pemanggilan hanya diizinkan saat tidak ada runtime sandbox aktif.
- Tanpa config tambahan, `host=auto` tetap "langsung berfungsi": tanpa sandbox berarti diselesaikan menjadi `gateway`; jika sandbox aktif, tetap berada di sandbox.
- `elevated` keluar dari sandbox ke path host yang dikonfigurasi: `gateway` secara default, atau `node` saat `tools.exec.host=node` (atau default sesi adalah `host=node`). Ini hanya tersedia saat akses elevated diaktifkan untuk sesi/penyedia saat ini.
- Persetujuan `gateway`/`node` dikendalikan oleh `~/.openclaw/exec-approvals.json`.
- `node` memerlukan Node yang telah di-pair (aplikasi pendamping atau host Node headless).
- Jika ada beberapa Node yang tersedia, tetapkan `exec.node` atau `tools.exec.node` untuk memilih salah satunya.
- `exec host=node` adalah satu-satunya jalur eksekusi shell untuk Node; wrapper `nodes.run` lama telah dihapus.
- Pada host non-Windows, exec menggunakan `SHELL` jika ditetapkan; jika `SHELL` adalah `fish`, exec memilih `bash` (atau `sh`)
  dari `PATH` untuk menghindari skrip yang tidak kompatibel dengan fish, lalu kembali ke `SHELL` jika keduanya tidak ada.
- Pada host Windows, exec mengutamakan penemuan PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, lalu PATH),
  lalu kembali ke Windows PowerShell 5.1.
- Eksekusi host (`gateway`/`node`) menolak `env.PATH` dan override loader (`LD_*`/`DYLD_*`) untuk
  mencegah pembajakan biner atau kode yang disisipkan.
- OpenClaw menetapkan `OPENCLAW_SHELL=exec` di environment perintah yang di-spawn (termasuk eksekusi PTY dan sandbox) sehingga aturan shell/profile dapat mendeteksi konteks alat exec.
- Penting: sandboxing **nonaktif secara default**. Jika sandboxing nonaktif, `host=auto`
  implisit akan diselesaikan menjadi `gateway`. `host=sandbox` eksplisit tetap gagal tertutup alih-alih diam-diam
  berjalan di host gateway. Aktifkan sandboxing atau gunakan `host=gateway` dengan persetujuan.
- Pemeriksaan preflight skrip (untuk kesalahan sintaks shell Python/Node yang umum) hanya memeriksa file di dalam
  batas `workdir` yang efektif. Jika path skrip diselesaikan di luar `workdir`, preflight dilewati untuk
  file tersebut.
- Untuk pekerjaan yang berjalan lama dan dimulai sekarang, mulai satu kali dan andalkan
  wake penyelesaian otomatis saat diaktifkan dan perintah menghasilkan output atau gagal.
  Gunakan `process` untuk log, status, input, atau intervensi; jangan meniru
  penjadwalan dengan loop sleep, loop timeout, atau polling berulang.
- Untuk pekerjaan yang harus terjadi nanti atau sesuai jadwal, gunakan Cron alih-alih
  pola sleep/delay `exec`.

## Config

- `tools.exec.notifyOnExit` (default: true): saat true, sesi exec yang dijadikan background akan mengantre event sistem dan meminta Heartbeat saat selesai.
- `tools.exec.approvalRunningNoticeMs` (default: 10000): keluarkan satu notifikasi “running” saat exec yang memerlukan persetujuan berjalan lebih lama dari ini (0 untuk menonaktifkan).
- `tools.exec.host` (default: `auto`; diselesaikan menjadi `sandbox` saat runtime sandbox aktif, `gateway` jika tidak)
- `tools.exec.security` (default: `deny` untuk sandbox, `full` untuk gateway + Node saat tidak diatur)
- `tools.exec.ask` (default: `off`)
- Exec host tanpa persetujuan adalah default untuk gateway + Node. Jika Anda ingin perilaku persetujuan/allowlist, perketat `tools.exec.*` dan kebijakan host `~/.openclaw/exec-approvals.json`; lihat [Persetujuan exec](/id/tools/exec-approvals#no-approval-yolo-mode).
- YOLO berasal dari default kebijakan host (`security=full`, `ask=off`), bukan dari `host=auto`. Jika Anda ingin memaksa perutean gateway atau Node, tetapkan `tools.exec.host` atau gunakan `/exec host=...`.
- Dalam mode `security=full` plus `ask=off`, exec host mengikuti kebijakan yang dikonfigurasi secara langsung; tidak ada lapisan prefilter heuristik pengaburan perintah atau penolakan preflight skrip tambahan.
- `tools.exec.node` (default: tidak diatur)
- `tools.exec.strictInlineEval` (default: false): saat true, bentuk eval interpreter inline seperti `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, dan `osascript -e` selalu memerlukan persetujuan eksplisit. `allow-always` masih dapat mempertahankan pemanggilan interpreter/skrip yang aman, tetapi bentuk inline-eval tetap meminta persetujuan setiap kali.
- `tools.exec.pathPrepend`: daftar direktori yang ditambahkan di depan `PATH` untuk eksekusi exec (gateway + sandbox saja).
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

- `host=gateway`: menggabungkan `PATH` login-shell Anda ke environment exec. Override `env.PATH`
  ditolak untuk eksekusi host. Daemon itu sendiri tetap berjalan dengan `PATH` minimal:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: menjalankan `sh -lc` (login shell) di dalam container, sehingga `/etc/profile` dapat mereset `PATH`.
  OpenClaw menambahkan `env.PATH` di depan setelah profile sourcing melalui var env internal (tanpa interpolasi shell);
  `tools.exec.pathPrepend` juga berlaku di sini.
- `host=node`: hanya override env yang tidak diblokir yang Anda kirim yang diteruskan ke Node. Override `env.PATH`
  ditolak untuk eksekusi host dan diabaikan oleh host Node. Jika Anda memerlukan entri PATH tambahan pada Node,
  konfigurasikan environment layanan host Node (systemd/launchd) atau instal alat di lokasi standar.

Binding Node per agen (gunakan indeks daftar agen dalam config):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

UI Kontrol: tab Nodes menyertakan panel kecil “Exec node binding” untuk pengaturan yang sama.

## Override sesi (`/exec`)

Gunakan `/exec` untuk menetapkan default **per sesi** untuk `host`, `security`, `ask`, dan `node`.
Kirim `/exec` tanpa argumen untuk menampilkan nilai saat ini.

Contoh:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Model otorisasi

`/exec` hanya dihormati untuk **pengirim yang berwenang** (allowlist/pairing channel plus `commands.useAccessGroups`).
Perintah ini memperbarui **state sesi saja** dan tidak menulis config. Untuk menonaktifkan exec secara paksa, tolak melalui kebijakan alat
(`tools.deny: ["exec"]` atau per agen). Persetujuan host tetap berlaku kecuali Anda secara eksplisit menetapkan
`security=full` dan `ask=off`.

## Persetujuan exec (aplikasi pendamping / host Node)

Agen dalam sandbox dapat memerlukan persetujuan per permintaan sebelum `exec` berjalan di host gateway atau Node.
Lihat [Persetujuan exec](/id/tools/exec-approvals) untuk kebijakan, allowlist, dan alur UI.

Saat persetujuan diperlukan, alat exec segera mengembalikan
`status: "approval-pending"` dan ID persetujuan. Setelah disetujui (atau ditolak / time out),
Gateway memancarkan event sistem (`Exec finished` / `Exec denied`). Jika perintah masih
berjalan setelah `tools.exec.approvalRunningNoticeMs`, satu notifikasi `Exec running` akan dikeluarkan.
Pada channel dengan kartu/tombol persetujuan native, agen seharusnya mengandalkan
UI native tersebut terlebih dahulu dan hanya menyertakan perintah `/approve` manual saat hasil
alat secara eksplisit mengatakan persetujuan chat tidak tersedia atau persetujuan manual adalah
satu-satunya jalur.

## Allowlist + safe bins

Enforcement allowlist manual hanya mencocokkan **path biner yang diselesaikan** (tanpa pencocokan basename). Saat
`security=allowlist`, perintah shell hanya diizinkan otomatis jika setiap segmen pipeline
ada di allowlist atau safe bin. Chaining (`;`, `&&`, `||`) dan redirection ditolak dalam
mode allowlist kecuali setiap segmen tingkat atas memenuhi allowlist (termasuk safe bins).
Redirection tetap tidak didukung.
Kepercayaan `allow-always` yang persisten tidak melewati aturan itu: perintah berantai tetap memerlukan setiap
segmen tingkat atas untuk cocok.

`autoAllowSkills` adalah jalur kemudahan terpisah dalam persetujuan exec. Ini tidak sama dengan
entri allowlist path manual. Untuk kepercayaan eksplisit yang ketat, pertahankan `autoAllowSkills` nonaktif.

Gunakan dua kontrol tersebut untuk pekerjaan yang berbeda:

- `tools.exec.safeBins`: filter stream kecil khusus stdin.
- `tools.exec.safeBinTrustedDirs`: direktori eksplisit tambahan yang dipercaya untuk path executable safe-bin.
- `tools.exec.safeBinProfiles`: kebijakan argv eksplisit untuk safe bin kustom.
- allowlist: kepercayaan eksplisit untuk path executable.

Jangan perlakukan `safeBins` sebagai allowlist generik, dan jangan tambahkan biner interpreter/runtime (misalnya `python3`, `node`, `ruby`, `bash`). Jika Anda memerlukannya, gunakan entri allowlist eksplisit dan tetap aktifkan prompt persetujuan.
`openclaw security audit` memperingatkan saat entri `safeBins` interpreter/runtime tidak memiliki profil eksplisit, dan `openclaw doctor --fix` dapat membuat scaffold entri `safeBinProfiles` kustom yang hilang.
`openclaw security audit` dan `openclaw doctor` juga memperingatkan saat Anda secara eksplisit menambahkan kembali biner berperilaku luas seperti `jq` ke `safeBins`.
Jika Anda secara eksplisit meng-allowlist interpreter, aktifkan `tools.exec.strictInlineEval` agar bentuk eval kode inline tetap memerlukan persetujuan baru.

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

Polling ditujukan untuk status sesuai permintaan, bukan loop menunggu. Jika wake penyelesaian otomatis
diaktifkan, perintah dapat membangunkan sesi saat menghasilkan output atau gagal.

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

Tempel (dibungkus bracket secara default):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` adalah subtool dari `exec` untuk edit multi-file terstruktur.
Ini aktif secara default untuk model OpenAI dan OpenAI Codex. Gunakan config hanya
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
- Config berada di bawah `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` default-nya `true`; tetapkan ke `false` untuk menonaktifkan alat ini bagi model OpenAI.
- `tools.exec.applyPatch.workspaceOnly` default-nya `true` (dibatasi pada workspace). Tetapkan ke `false` hanya jika Anda memang sengaja ingin `apply_patch` menulis/menghapus di luar direktori workspace.

## Terkait

- [Persetujuan Exec](/id/tools/exec-approvals) — gate persetujuan untuk perintah shell
- [Sandboxing](/id/gateway/sandboxing) — menjalankan perintah di lingkungan sandbox
- [Proses Background](/id/gateway/background-process) — exec yang berjalan lama dan alat process
- [Keamanan](/id/gateway/security) — kebijakan alat dan akses elevated
