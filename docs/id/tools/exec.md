---
read_when:
    - Menggunakan atau memodifikasi tool exec
    - Men-debug perilaku stdin atau TTY
summary: Penggunaan tool exec, mode stdin, dan dukungan TTY
title: Tool Exec
x-i18n:
    generated_at: "2026-04-05T14:08:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: b73e9900c109910fc4e178c888b7ad7f3a4eeaa34eb44bc816abba9af5d664d7
    source_path: tools/exec.md
    workflow: 15
---

# Tool Exec

Jalankan perintah shell di workspace. Mendukung eksekusi latar depan + latar belakang melalui `process`.
Jika `process` tidak diizinkan, `exec` berjalan sinkron dan mengabaikan `yieldMs`/`background`.
Sesi latar belakang dicakup per agen; `process` hanya melihat sesi dari agen yang sama.

## Parameter

- `command` (wajib)
- `workdir` (default ke cwd)
- `env` (override key/value)
- `yieldMs` (default 10000): latar belakang otomatis setelah jeda
- `background` (bool): langsung ke latar belakang
- `timeout` (detik, default 1800): hentikan saat kedaluwarsa
- `pty` (bool): jalankan dalam pseudo-terminal jika tersedia (CLI khusus TTY, agen coding, UI terminal)
- `host` (`auto | sandbox | gateway | node`): tempat eksekusi
- `security` (`deny | allowlist | full`): mode penegakan untuk `gateway`/`node`
- `ask` (`off | on-miss | always`): prompt persetujuan untuk `gateway`/`node`
- `node` (string): id/nama node untuk `host=node`
- `elevated` (bool): minta mode elevated (keluar dari sandbox ke path host yang dikonfigurasi); `security=full` hanya dipaksakan saat elevated diresolusikan ke `full`

Catatan:

- `host` default ke `auto`: sandbox saat runtime sandbox aktif untuk sesi, jika tidak maka gateway.
- `auto` adalah strategi perutean default, bukan wildcard. Per panggilan `host=node` diizinkan dari `auto`; per panggilan `host=gateway` hanya diizinkan saat tidak ada runtime sandbox yang aktif.
- Tanpa konfigurasi tambahan, `host=auto` tetap “langsung berfungsi”: tanpa sandbox berarti diresolusikan ke `gateway`; sandbox aktif berarti tetap berada di sandbox.
- `elevated` keluar dari sandbox ke path host yang dikonfigurasi: `gateway` secara default, atau `node` saat `tools.exec.host=node` (atau default sesi adalah `host=node`). Ini hanya tersedia saat akses elevated diaktifkan untuk sesi/penyedia saat ini.
- Persetujuan `gateway`/`node` dikontrol oleh `~/.openclaw/exec-approvals.json`.
- `node` memerlukan node yang dipasangkan (aplikasi pendamping atau host node headless).
- Jika beberapa node tersedia, tetapkan `exec.node` atau `tools.exec.node` untuk memilih salah satunya.
- `exec host=node` adalah satu-satunya jalur eksekusi shell untuk node; wrapper lama `nodes.run` telah dihapus.
- Pada host non-Windows, exec menggunakan `SHELL` jika ditetapkan; jika `SHELL` adalah `fish`, ia lebih memilih `bash` (atau `sh`)
  dari `PATH` untuk menghindari skrip yang tidak kompatibel dengan fish, lalu kembali ke `SHELL` jika keduanya tidak ada.
- Pada host Windows, exec lebih memilih penemuan PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, lalu PATH),
  lalu kembali ke Windows PowerShell 5.1.
- Eksekusi host (`gateway`/`node`) menolak `env.PATH` dan override loader (`LD_*`/`DYLD_*`) untuk
  mencegah pembajakan biner atau kode yang disisipkan.
- OpenClaw menetapkan `OPENCLAW_SHELL=exec` di lingkungan perintah yang di-spawn (termasuk eksekusi PTY dan sandbox) agar aturan shell/profile dapat mendeteksi konteks tool exec.
- Penting: sandboxing **nonaktif secara default**. Jika sandboxing nonaktif, `host=auto`
  implisit akan diresolusikan ke `gateway`. `host=sandbox` eksplisit tetap gagal tertutup alih-alih diam-diam
  berjalan di host gateway. Aktifkan sandboxing atau gunakan `host=gateway` dengan persetujuan.
- Pemeriksaan preflight skrip (untuk kesalahan sintaks shell Python/Node umum) hanya memeriksa file di dalam
  batas `workdir` yang efektif. Jika path skrip diresolusikan di luar `workdir`, preflight dilewati untuk
  file tersebut.
- Untuk pekerjaan berjalan lama yang dimulai sekarang, mulai sekali lalu andalkan
  wake penyelesaian otomatis saat fitur itu aktif dan perintah menghasilkan output atau gagal.
  Gunakan `process` untuk log, status, input, atau intervensi; jangan meniru
  penjadwalan dengan loop sleep, loop timeout, atau polling berulang.
- Untuk pekerjaan yang harus terjadi nanti atau menurut jadwal, gunakan cron alih-alih
  pola sleep/delay `exec`.

## Konfigurasi

- `tools.exec.notifyOnExit` (default: true): saat true, sesi exec yang dilatarbelakangkan akan mengantrikan system event dan meminta heartbeat saat keluar.
- `tools.exec.approvalRunningNoticeMs` (default: 10000): kirim satu pemberitahuan “running” saat exec yang dijaga persetujuan berjalan lebih lama dari ini (0 menonaktifkan).
- `tools.exec.host` (default: `auto`; diresolusikan ke `sandbox` saat runtime sandbox aktif, jika tidak ke `gateway`)
- `tools.exec.security` (default: `deny` untuk sandbox, `full` untuk gateway + node saat tidak ditetapkan)
- `tools.exec.ask` (default: `off`)
- Exec host tanpa persetujuan adalah default untuk gateway + node. Jika Anda ingin perilaku persetujuan/allowlist, perketat `tools.exec.*` dan host `~/.openclaw/exec-approvals.json`; lihat [Persetujuan exec](/tools/exec-approvals#no-approval-yolo-mode).
- Mode YOLO berasal dari default kebijakan host (`security=full`, `ask=off`), bukan dari `host=auto`. Jika Anda ingin memaksa perutean gateway atau node, tetapkan `tools.exec.host` atau gunakan `/exec host=...`.
- `tools.exec.node` (default: tidak ditetapkan)
- `tools.exec.strictInlineEval` (default: false): saat true, bentuk eval interpreter inline seperti `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, dan `osascript -e` selalu memerlukan persetujuan eksplisit. `allow-always` tetap dapat menyimpan kepercayaan untuk pemanggilan interpreter/skrip yang aman, tetapi bentuk inline-eval tetap meminta prompt setiap kali.
- `tools.exec.pathPrepend`: daftar direktori untuk ditambahkan di depan `PATH` untuk run exec (hanya gateway + sandbox).
- `tools.exec.safeBins`: biner aman khusus stdin yang dapat berjalan tanpa entri allowlist eksplisit. Untuk detail perilaku, lihat [Safe bins](/tools/exec-approvals#safe-bins-stdin-only).
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

- `host=gateway`: menggabungkan `PATH` shell login Anda ke lingkungan exec. Override `env.PATH`
  ditolak untuk eksekusi host. Daemon itu sendiri tetap berjalan dengan `PATH` minimal:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: menjalankan `sh -lc` (login shell) di dalam container, sehingga `/etc/profile` dapat mereset `PATH`.
  OpenClaw menambahkan `env.PATH` di depan setelah profile sourcing melalui env var internal (tanpa interpolasi shell);
  `tools.exec.pathPrepend` juga berlaku di sini.
- `host=node`: hanya override env yang tidak diblokir dan Anda berikan yang dikirim ke node. Override `env.PATH`
  ditolak untuk eksekusi host dan diabaikan oleh host node. Jika Anda memerlukan entri PATH tambahan pada node,
  konfigurasikan lingkungan layanan host node (systemd/launchd) atau instal tool di lokasi standar.

Pengikatan node per agen (gunakan indeks daftar agen dalam konfigurasi):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

UI Kontrol: tab Nodes menyertakan panel kecil “Exec node binding” untuk pengaturan yang sama.

## Override sesi (`/exec`)

Gunakan `/exec` untuk menetapkan default **per sesi** bagi `host`, `security`, `ask`, dan `node`.
Kirim `/exec` tanpa argumen untuk menampilkan nilai saat ini.

Contoh:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Model otorisasi

`/exec` hanya dihormati untuk **pengirim yang berwenang** (allowlist/pairing channel plus `commands.useAccessGroups`).
Ini hanya memperbarui **status sesi** dan tidak menulis konfigurasi. Untuk menonaktifkan exec sepenuhnya, tolak melalui kebijakan tool
(`tools.deny: ["exec"]` atau per agen). Persetujuan host tetap berlaku kecuali Anda secara eksplisit menetapkan
`security=full` dan `ask=off`.

## Persetujuan exec (aplikasi pendamping / host node)

Agen yang disandbox dapat memerlukan persetujuan per permintaan sebelum `exec` berjalan di host gateway atau node.
Lihat [Persetujuan exec](/tools/exec-approvals) untuk kebijakan, allowlist, dan alur UI.

Saat persetujuan diperlukan, tool exec segera mengembalikan
`status: "approval-pending"` dan id persetujuan. Setelah disetujui (atau ditolak / timeout),
Gateway mengirim system event (`Exec finished` / `Exec denied`). Jika perintah masih
berjalan setelah `tools.exec.approvalRunningNoticeMs`, satu pemberitahuan `Exec running` akan dikirim.
Pada channel dengan kartu/tombol persetujuan native, agen harus mengandalkan
UI native tersebut terlebih dahulu dan hanya menyertakan perintah `/approve` manual saat hasil
tool secara eksplisit menyatakan bahwa persetujuan chat tidak tersedia atau persetujuan manual adalah
satu-satunya jalur.

## Allowlist + safe bins

Penegakan allowlist manual hanya mencocokkan **path biner yang diresolusikan** (tanpa pencocokan nama dasar). Saat
`security=allowlist`, perintah shell hanya diizinkan otomatis jika setiap segmen pipeline
berada dalam allowlist atau merupakan safe bin. Chaining (`;`, `&&`, `||`) dan redirection ditolak dalam
mode allowlist kecuali setiap segmen tingkat atas memenuhi allowlist (termasuk safe bins).
Redirection tetap tidak didukung.
Kepercayaan `allow-always` yang tahan lama tidak melewati aturan itu: perintah berantai tetap memerlukan setiap
segmen tingkat atas cocok.

`autoAllowSkills` adalah jalur kenyamanan terpisah dalam persetujuan exec. Ini tidak sama dengan
entri allowlist path manual. Untuk kepercayaan eksplisit yang ketat, biarkan `autoAllowSkills` nonaktif.

Gunakan dua kontrol tersebut untuk tugas yang berbeda:

- `tools.exec.safeBins`: filter aliran kecil khusus stdin.
- `tools.exec.safeBinTrustedDirs`: direktori tepercaya eksplisit tambahan untuk path executable safe-bin.
- `tools.exec.safeBinProfiles`: kebijakan argv eksplisit untuk safe bin kustom.
- allowlist: kepercayaan eksplisit untuk path executable.

Jangan perlakukan `safeBins` sebagai allowlist umum, dan jangan tambahkan biner interpreter/runtime (misalnya `python3`, `node`, `ruby`, `bash`). Jika Anda memerlukan itu, gunakan entri allowlist eksplisit dan tetap aktifkan prompt persetujuan.
`openclaw security audit` memperingatkan saat entri interpreter/runtime `safeBins` tidak memiliki profil eksplisit, dan `openclaw doctor --fix` dapat membuat kerangka entri `safeBinProfiles` kustom yang hilang.
`openclaw security audit` dan `openclaw doctor` juga memperingatkan saat Anda secara eksplisit menambahkan kembali bin berperilaku luas seperti `jq` ke `safeBins`.
Jika Anda secara eksplisit mengizinkan interpreter, aktifkan `tools.exec.strictInlineEval` agar bentuk eval kode inline tetap memerlukan persetujuan baru.

Untuk detail kebijakan lengkap dan contohnya, lihat [Persetujuan exec](/tools/exec-approvals#safe-bins-stdin-only) dan [Safe bins versus allowlist](/tools/exec-approvals#safe-bins-versus-allowlist).

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

Polling adalah untuk status sesuai permintaan, bukan loop menunggu. Jika wake penyelesaian otomatis
aktif, perintah dapat membangunkan sesi saat menghasilkan output atau gagal.

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

Tempel (default dibungkus bracket):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` adalah subtool dari `exec` untuk edit multi-file terstruktur.
Ini aktif secara default untuk model OpenAI dan OpenAI Codex. Gunakan konfigurasi hanya
saat Anda ingin menonaktifkannya atau membatasinya ke model tertentu:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

Catatan:

- Hanya tersedia untuk model OpenAI/OpenAI Codex.
- Kebijakan tool tetap berlaku; `allow: ["write"]` secara implisit mengizinkan `apply_patch`.
- Konfigurasi berada di bawah `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` default ke `true`; tetapkan ke `false` untuk menonaktifkan tool ini bagi model OpenAI.
- `tools.exec.applyPatch.workspaceOnly` default ke `true` (terbatas pada workspace). Tetapkan ke `false` hanya jika Anda memang sengaja ingin `apply_patch` menulis/menghapus di luar direktori workspace.

## Terkait

- [Persetujuan Exec](/tools/exec-approvals) — gerbang persetujuan untuk perintah shell
- [Sandboxing](/id/gateway/sandboxing) — menjalankan perintah di lingkungan yang disandbox
- [Proses Latar Belakang](/id/gateway/background-process) — exec berjalan lama dan tool process
- [Keamanan](/id/gateway/security) — kebijakan tool dan akses elevated
