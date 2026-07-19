---
read_when:
    - Menggunakan atau memodifikasi alat exec
    - Men-debug perilaku stdin atau TTY
summary: Penggunaan alat exec, mode stdin, dan dukungan TTY
title: Alat eksekusi
x-i18n:
    generated_at: "2026-07-19T05:12:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 096260e5a5a657682797c00430519f2b664bc7ae9dc682970494fd63a061f227
    source_path: tools/exec.md
    workflow: 16
---

Jalankan perintah shell di ruang kerja. `exec` adalah permukaan shell yang dapat mengubah: perintah dapat membuat, mengedit, atau menghapus file di mana pun yang diizinkan oleh sistem file host atau sandbox yang dipilih. Menonaktifkan alat sistem file OpenClaw seperti `write`, `edit`, atau `apply_patch` tidak menjadikan `exec` hanya-baca.

Mendukung eksekusi latar depan dan latar belakang melalui `process`. Jika `process` tidak diizinkan, `exec` berjalan secara sinkron dan mengabaikan `yieldMs`/`background`. Sesi latar belakang dicakup per agen; `process` hanya melihat sesi dari agen yang sama.

## Parameter

<ParamField path="command" type="string" required>
Perintah shell yang akan dijalankan.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Direktori kerja untuk perintah.
</ParamField>

<ParamField path="env" type="object">
Penimpaan lingkungan pasangan kunci/nilai yang digabungkan di atas lingkungan yang diwarisi.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Alihkan perintah ke latar belakang secara otomatis setelah penundaan ini (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Alihkan perintah ke latar belakang segera alih-alih menunggu `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Timpa batas waktu exec yang dikonfigurasi untuk panggilan ini, dalam detik. Berlaku untuk eksekusi latar depan, latar belakang, `yieldMs`, gateway, sandbox, dan node `system.run`. `timeout: 0` menonaktifkan batas waktu proses exec untuk panggilan tersebut.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Jalankan dalam terminal semu jika tersedia. Gunakan untuk CLI yang hanya mendukung TTY, agen pengodean, dan UI terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Tempat eksekusi. `auto` diresolusikan menjadi `sandbox` saat runtime sandbox aktif dan menjadi `gateway` jika tidak.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Diabaikan untuk panggilan alat normal. Keamanan `gateway`/`node` dikendalikan oleh `tools.exec.security` dan file persetujuan host; mode dengan hak istimewa yang ditingkatkan hanya dapat memaksakan `security=full` saat operator secara eksplisit memberikan akses tersebut.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Mode permintaan dasar berasal dari `tools.exec.ask` dan persetujuan host. Untuk panggilan model yang berasal dari saluran, `ask` per panggilan diabaikan ketika permintaan host efektif adalah `off`; jika tidak, nilainya hanya dapat diperketat ke mode yang lebih ketat. Pemanggil internal/API tepercaya yang membuat alat exec dengan nilai `ask` eksplisit tidak berubah.
</ParamField>

<ParamField path="node" type="string">
Id/nama Node saat `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Minta mode dengan hak istimewa yang ditingkatkan: keluar dari sandbox ke jalur host yang dikonfigurasi. `security=full` hanya dipaksakan ketika elevated diresolusikan menjadi `full`.
</ParamField>

Catatan:

- `host` hanya menerima `auto`, `sandbox`, `gateway`, atau `node`. Ini bukan pemilih nama host; nilai yang menyerupai nama host ditolak sebelum perintah dijalankan.
- `host=node` per panggilan diizinkan dari `auto`; `host=gateway` per panggilan hanya diizinkan ketika tidak ada runtime sandbox yang aktif.
- Tanpa konfigurasi tambahan, `host=auto` tetap "langsung berfungsi": tanpa sandbox, nilainya diresolusikan menjadi `gateway`; dengan sandbox aktif, nilainya tetap berada di dalam sandbox.
- `elevated` keluar dari sandbox ke jalur host yang dikonfigurasi: `gateway` secara default, atau `node` ketika `tools.exec.host=node` (atau nilai default sesi adalah `host=node`). Ini hanya tersedia ketika akses dengan hak istimewa yang ditingkatkan diaktifkan untuk sesi/penyedia saat ini.
- Persetujuan `gateway`/`node` dikendalikan oleh file persetujuan host.
- `node` memerlukan Node yang telah dipasangkan (aplikasi pendamping atau host Node tanpa antarmuka). Jika tersedia beberapa Node, tetapkan `exec.node` atau `tools.exec.node` untuk memilih salah satunya.
- `exec host=node` adalah satu-satunya jalur eksekusi shell untuk Node; pembungkus lama `nodes.run` telah dihapus.
- Pada host non-Windows, exec menggunakan `SHELL` jika ditetapkan; jika `SHELL` adalah `fish`, exec memprioritaskan `bash` (atau `sh`) dari `PATH` untuk menghindari konstruksi bash yang tidak kompatibel dengan fish, lalu kembali menggunakan `SHELL` jika keduanya tidak tersedia.
- Pada host Windows, exec memprioritaskan penemuan PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, lalu PATH), kemudian kembali menggunakan Windows PowerShell 5.1.
- Pada host gateway non-Windows, perintah exec bash dan zsh menggunakan snapshot awal. OpenClaw menangkap alias/fungsi yang dapat dimuat dengan source serta sekumpulan kecil variabel lingkungan aman dari file awal shell ke dalam `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`, lalu memuat snapshot tersebut dengan source sebelum setiap perintah exec. Variabel yang tampak seperti rahasia dikecualikan; exec sandbox dan Node tidak menggunakan snapshot ini. Tetapkan `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` dalam lingkungan proses Gateway untuk menonaktifkan jalur snapshot ini.
- Eksekusi host (`gateway`/`node`) menolak `env.PATH` dan penimpaan pemuat (`LD_*`/`DYLD_*`) untuk mencegah pembajakan biner atau injeksi kode.
- OpenClaw menetapkan `OPENCLAW_SHELL=exec` dalam lingkungan perintah yang dijalankan (termasuk eksekusi PTY dan sandbox) agar aturan shell/profil dapat mendeteksi konteks alat exec.
- Untuk proses yang berasal dari saluran, OpenClaw juga mengekspos payload JSON identitas pengirim/obrolan yang terbatas dalam `OPENCLAW_CHANNEL_CONTEXT` ketika saluran menyediakan id tersebut.
- `exec` tidak dapat menjalankan perintah shell `openclaw channels login` atau `/approve`: `openclaw channels login` adalah alur autentikasi saluran interaktif, dan `/approve` harus melalui penangan perintah persetujuan, bukan shell. Jalankan login saluran di terminal pada host gateway, atau gunakan alat agen login khusus saluran jika tersedia (misalnya `whatsapp_login`).
- Penting: sandbox **nonaktif secara default**. Jika sandbox nonaktif, `host=auto` implisit diresolusikan menjadi `gateway`. `host=sandbox` eksplisit tetap gagal secara tertutup alih-alih berjalan diam-diam pada host gateway. Aktifkan sandbox atau gunakan `host=gateway` dengan persetujuan.
- Pemeriksaan awal skrip (untuk kesalahan sintaks shell Python/Node yang umum) hanya memeriksa file di dalam batas efektif `workdir`. Jika jalur skrip diresolusikan ke luar `workdir`, pemeriksaan awal dilewati untuk file tersebut. Pemeriksaan awal juga dilewati sepenuhnya ketika `host=gateway` dan kebijakan efektifnya adalah `security=full` dengan `ask=off`.
- Untuk pekerjaan jangka panjang yang dimulai sekarang, mulai satu kali dan andalkan pemicu penyelesaian otomatis ketika diaktifkan dan perintah menghasilkan keluaran atau gagal. Gunakan `process` untuk log, status, masukan, atau intervensi; jangan meniru penjadwalan dengan perulangan tidur, perulangan batas waktu, atau polling berulang.
- Perintah latar belakang yang dimulai agen muncul dalam tampilan tugas latar belakang Web, iOS, dan Android hingga selesai. Buku besar tugas diselesaikan sebelum Heartbeat penyelesaian membangunkan agen kembali.
- Untuk pekerjaan yang harus dilakukan nanti atau sesuai jadwal, gunakan cron alih-alih pola tidur/penundaan `exec`.

## Konfigurasi

| Kunci                                  | Default                                                | Catatan                                                                                                                                                   |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.timeoutSec`              | `1800`                                                 | Batas waktu default eksekusi per perintah dalam detik. `timeout` per panggilan menimpanya; `timeout: 0` per panggilan menonaktifkan batas waktu proses eksekusi.                  |
| `tools.exec.host`                    | `auto`                                                 | Diubah menjadi `sandbox` saat runtime sandbox aktif, dan `gateway` jika tidak.                                                                            |
| `tools.exec.security`                | `deny` untuk sandbox, `full` untuk gateway/node saat tidak ditetapkan |                                                                                                                                                         |
| `tools.exec.ask`                     | `off`                                                  |                                                                                                                                                         |
| `tools.exec.mode`                    | tidak ditetapkan                                                  | Opsi kebijakan yang dinormalisasi. Lihat [Mode](#modes) di bawah. Tidak dapat digabungkan dengan `tools.exec.security`/`tools.exec.ask`.                                      |
| `tools.exec.reviewer.model`          | model utama agen yang dikonfigurasi                               | Penggantian penyedia/model opsional untuk review `mode=auto`.                                                                                                |
| `tools.exec.reviewer.timeoutMs`      | `30000`                                                | Batas waktu per tahap untuk persiapan dan penyelesaian model peninjau sebelum beralih ke manusia.                                                                  |
| `tools.exec.node`                    | tidak ditetapkan                                                  |                                                                                                                                                         |
| `tools.exec.notifyOnExit`            | `true`                                                 | Jika bernilai true, sesi eksekusi yang dijalankan di latar belakang akan mengantrekan peristiwa sistem dan meminta Heartbeat saat selesai.                                                           |
| `tools.exec.approvalRunningNoticeMs` | `10000`                                                | Tampilkan satu pemberitahuan "sedang berjalan" ketika eksekusi yang memerlukan persetujuan berjalan lebih lama dari durasi ini (`0` menonaktifkannya).                                                        |
| `tools.exec.strictInlineEval`        | `false`                                                | Lihat [Evaluasi inline](#inline-eval-strictinlineeval).                                                                                                       |
| `tools.exec.commandHighlighting`     | `false`                                                | Jika bernilai true, permintaan persetujuan dapat menyoroti rentang perintah hasil pengurai dalam teks perintah. Tetapkan secara global atau per agen; tidak mengubah kebijakan persetujuan. |
| `tools.exec.pathPrepend`             | tidak ditetapkan                                                  | Daftar direktori yang akan ditambahkan di awal `PATH` untuk proses eksekusi (khusus gateway + sandbox).                                                                        |
| `tools.exec.safeBins`                | tidak ditetapkan                                                  | Biner aman khusus stdin yang dapat dijalankan tanpa entri daftar izin eksplisit. Lihat [Biner aman](/id/tools/exec-approvals-advanced#safe-bins-stdin-only).         |
| `tools.exec.safeBinTrustedDirs`      | `/bin`, `/usr/bin`                                     | Direktori eksplisit tambahan yang dipercaya untuk pemeriksaan jalur `safeBins`. Entri `PATH` tidak pernah dipercaya secara otomatis.                                              |
| `tools.exec.safeBinProfiles`         | tidak ditetapkan                                                  | Kebijakan argv khusus opsional per biner aman (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).                                        |

Eksekusi host tanpa persetujuan merupakan default untuk gateway dan node (`security=full`, `ask=off`) — ini berasal dari default kebijakan host, bukan dari `host=auto`. Jika menginginkan perilaku persetujuan/daftar izin, perketat `tools.exec.*` dan berkas persetujuan host; lihat [Persetujuan eksekusi](/id/tools/exec-approvals#yolo-mode-no-approval). Untuk memaksa perutean gateway atau node terlepas dari status sandbox, tetapkan `tools.exec.host` atau gunakan `/exec host=...`.

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

### Mode

`tools.exec.mode` adalah opsi kebijakan yang dinormalisasi. Menetapkannya akan menurunkan `security`/`ask` dan tidak dapat digabungkan dengan `tools.exec.security`/`tools.exec.ask` eksplisit.

| Mode        | keamanan    | tanyakan       | Perilaku                                                                                                                       |
| ----------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | `deny`      | `off`     | Eksekusi ditolak.                                                                                                                |
| `allowlist` | `allowlist` | `off`     | Hanya perintah dalam daftar izin/biner aman yang dijalankan; tidak ada perintah lain yang dimintakan persetujuan.                                                                 |
| `ask`       | `allowlist` | `on-miss` | Kecocokan daftar izin dijalankan langsung; semua yang lain meminta persetujuan manusia.                                                                  |
| `auto`      | `allowlist` | `on-miss` | Kecocokan daftar izin/biner aman dijalankan langsung; semua yang lain diarahkan melalui peninjau otomatis native OpenClaw sebelum meminta persetujuan manusia. |
| `full`      | `full`      | `off`     | Tanpa gerbang persetujuan.                                                                                                              |

`ask`/`ask=always` tetap meminta persetujuan manusia setiap kali, apa pun modenya.

Persetujuan review otomatis hanya berlaku sekali. Pada gateway, OpenClaw memberikan jalur executable yang telah diresolusi kepada peninjau dan menyematkan eksekusi ke jalur yang sama. Perintah yang tidak dapat disederhanakan menjadi satu rencana eksekusi yang dapat ditegakkan—seperti heredoc, ekspansi shell, atau pengutipan pembungkus yang tidak didukung—akan beralih ke persetujuan manusia meskipun model seharusnya mengizinkannya.

Persetujuan perintah server aplikasi Codex yang belum diputuskan oleh kebijakan runtime eksplisit atau kebijakan native menggunakan jalur persetujuan manusia. OpenClaw tidak menjalankan peninjau eksekusi yang dikonfigurasikan untuk permintaan ini karena Codex tidak mengekspos executable hasil resolusi yang dapat ditegakkan untuk mengikat keputusan review dengan perintah yang dijalankan Codex.

### Evaluasi inline (`strictInlineEval`)

Saat `tools.exec.strictInlineEval` bernilai `true`, bentuk evaluasi interpreter inline memerlukan peninjau atau persetujuan eksplisit: `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, `osascript -e`, dan bentuk serupa di berbagai interpreter serta pembawa perintah lain yang didukung (`awk`, `find -exec`, `make`, `sed`, `xargs`, dan lainnya). Dalam `mode=auto`, jalur persetujuan eksekusi normal dapat memungkinkan peninjau otomatis native mengizinkan perintah sekali jalan yang jelas berisiko rendah; panggilan `system.run` langsung pada host node tetap memerlukan persetujuan eksplisit karena panggilan tersebut tidak dapat menyerahkan perintah ke jalur persetujuan manusia. Jika peninjau meminta persetujuan, permintaan diteruskan kepada manusia. `allow-always` masih dapat menyimpan pemanggilan interpreter/skrip yang tidak berbahaya, tetapi bentuk evaluasi inline tidak menjadi aturan izin permanen.

### Penanganan PATH

- `host=gateway`: menggabungkan `PATH` shell login Anda ke dalam lingkungan eksekusi. Penggantian `env.PATH` ditolak untuk eksekusi host. Daemon itu sendiri tetap berjalan dengan `PATH` minimal:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
  - Untuk mencegah konfigurasi shell pengguna (seperti `~/.zshenv` atau `/etc/zshenv`) mengganti jalur prioritas selama proses mulai, entri `tools.exec.pathPrepend` ditambahkan secara aman di awal `PATH` akhir di dalam perintah shell tepat sebelum eksekusi.
- `host=sandbox`: menjalankan `sh -lc` (shell login) di dalam kontainer, sehingga `/etc/profile` dapat mengatur ulang `PATH`. OpenClaw menambahkan `env.PATH` di awal setelah pemuatan profil melalui variabel lingkungan internal (tanpa interpolasi shell); `tools.exec.pathPrepend` juga berlaku di sini.
- `host=node`: hanya penggantian lingkungan yang tidak diblokir dan Anda berikan yang dikirim ke node. Penggantian `env.PATH` ditolak untuk eksekusi host dan diabaikan oleh host node. Jika memerlukan entri PATH tambahan pada node, konfigurasikan lingkungan layanan host node (systemd/launchd) atau instal alat di lokasi standar.

Pengikatan node per agen (gunakan indeks daftar agen dalam konfigurasi):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

UI Kontrol: halaman **Perangkat** menyertakan panel kecil "Pengikatan node eksekusi" untuk pengaturan yang sama.

## Penggantian sesi (`/exec`)

Gunakan `/exec` untuk menetapkan default **per sesi** bagi `host`, `security`, `ask`, dan `node`. Kirim `/exec` tanpa argumen untuk menampilkan nilai saat ini.

Contoh:

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

`/exec` hanya dipatuhi untuk **pengirim yang diotorisasi** (daftar izin kanal/pemasangan serta `commands.useAccessGroups`). Perintah ini hanya memperbarui **status sesi** dan tidak menulis konfigurasi. Pengirim kanal eksternal yang diotorisasi dapat menetapkan default sesi ini. Klien gateway/webchat internal memerlukan `operator.admin` untuk mempertahankannya.

Untuk menonaktifkan eksekusi sepenuhnya, tolak melalui kebijakan alat (`tools.deny: ["exec"]` atau per agen). Persetujuan host tetap berlaku kecuali Anda secara eksplisit menetapkan `security=full` dan `ask=off`.

## Persetujuan eksekusi (aplikasi pendamping/host node)

Agen dalam sandbox dapat memerlukan persetujuan per permintaan sebelum `exec` dijalankan pada gateway atau host node. Lihat [Persetujuan eksekusi](/id/tools/exec-approvals) untuk kebijakan, daftar izin, dan alur UI.

Saat persetujuan manusia diperlukan, alur host node dan gateway non-native segera mengembalikan `status: "approval-pending"` beserta ID persetujuan. Alur gateway chat native dan UI Web dapat menunggu secara inline dan mengembalikan hasil akhir perintah setelah disetujui. Hasil `approval-pending` berarti perintah belum dimulai, sehingga peringatan peralihan latar depan hanya muncul jika perintah yang disetujui benar-benar dijalankan secara inline. Eksekusi asinkron yang disetujui memancarkan peristiwa sistem progres dan penyelesaian perintah (`Exec running` / `Exec finished`); persetujuan yang ditolak atau melewati batas waktu bersifat terminal dan tidak membangunkan sesi agen dengan peristiwa sistem penolakan.

Pada kanal dengan kartu/tombol persetujuan native, agen harus terlebih dahulu mengandalkan UI native tersebut dan hanya menyertakan perintah manual `/approve` ketika hasil alat secara eksplisit menyatakan bahwa persetujuan melalui chat tidak tersedia atau persetujuan manual merupakan satu-satunya cara.

## Daftar izin + bin aman

Penegakan daftar izin manual mencocokkan glob jalur biner yang telah di-resolve dan glob nama perintah tanpa jalur. Nama tanpa jalur hanya cocok dengan perintah yang dipanggil melalui PATH, sehingga `rg` dapat cocok dengan `/opt/homebrew/bin/rg` ketika perintahnya adalah `rg`, tetapi tidak dengan `./rg` atau `/tmp/rg`.

Ketika `security=allowlist`, perintah shell diizinkan secara otomatis hanya jika setiap segmen pipeline tercantum dalam daftar izin atau merupakan bin aman. Perangkaian (`;`, `&&`, `||`) dan pengalihan ditolak dalam mode daftar izin kecuali setiap segmen tingkat atas memenuhi daftar izin (termasuk bin aman). Pengalihan tetap tidak didukung. Kepercayaan `allow-always` yang persisten tidak melewati aturan tersebut: perintah berantai tetap mengharuskan setiap segmen tingkat atas cocok.

`autoAllowSkills` merupakan jalur kemudahan terpisah dalam persetujuan exec, bukan hal yang sama dengan entri daftar izin jalur manual. Untuk kepercayaan eksplisit yang ketat, biarkan `autoAllowSkills` dinonaktifkan.

Gunakan kedua kontrol tersebut untuk tugas yang berbeda:

- `tools.exec.safeBins`: filter aliran kecil yang hanya menggunakan stdin.
- `tools.exec.safeBinTrustedDirs`: direktori tepercaya tambahan yang eksplisit untuk jalur executable bin aman.
- `tools.exec.safeBinProfiles`: kebijakan argv eksplisit untuk bin aman kustom.
- allowlist: kepercayaan eksplisit untuk jalur executable.

Jangan perlakukan `safeBins` sebagai daftar izin generik, dan jangan tambahkan biner interpreter/runtime (misalnya `python3`, `node`, `ruby`, `bash`). Jika Anda membutuhkannya, gunakan entri daftar izin eksplisit dan biarkan prompt persetujuan tetap diaktifkan.

`openclaw security audit` memperingatkan ketika entri `safeBins` interpreter/runtime tidak memiliki profil eksplisit, dan `openclaw doctor --fix` dapat membuat kerangka entri `safeBinProfiles` kustom yang belum ada. `openclaw security audit` dan `openclaw doctor` juga memperingatkan ketika Anda secara eksplisit menambahkan kembali bin dengan perilaku luas seperti `jq` ke dalam `safeBins` (`jq` dapat membaca data lingkungan dan memuat kode jq dari modul atau berkas startup, jadi sebagai gantinya, utamakan entri daftar izin eksplisit atau eksekusi yang dilindungi persetujuan). `jq` ditolak sebagai bin aman meskipun tercantum secara eksplisit. Jika Anda secara eksplisit memasukkan interpreter ke daftar izin, aktifkan `tools.exec.strictInlineEval` agar bentuk evaluasi kode inline tetap memerlukan peninjau atau persetujuan eksplisit.

Untuk detail dan contoh kebijakan lengkap, lihat [Persetujuan exec](/id/tools/exec-approvals-advanced#safe-bins-stdin-only) dan [Bin aman dibandingkan dengan daftar izin](/id/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

Polling digunakan untuk memeriksa status sesuai permintaan, bukan untuk loop penantian. Jika pengaktifan sesi otomatis setelah selesai diaktifkan, perintah dapat mengaktifkan sesi ketika menghasilkan keluaran atau mengalami kegagalan.

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

Tempel (secara default menggunakan bracketed paste):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` adalah subalat dari `exec` untuk pengeditan multi-berkas terstruktur. Alat ini diaktifkan secara default dan tersedia untuk penyedia model mana pun; `allowModels` dapat membatasinya. Gunakan konfigurasi hanya ketika Anda ingin menonaktifkannya atau membatasinya ke model tertentu:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.6-sol"] },
    },
  },
}
```

Catatan:

- Kebijakan alat tetap berlaku; `allow: ["write"]` secara implisit mengizinkan `apply_patch`.
- `deny: ["write"]` tidak menolak `apply_patch`; tolak `apply_patch` secara eksplisit atau gunakan `deny: ["group:fs"]` ketika penulisan patch juga harus diblokir.
- Konfigurasi berada di bawah `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` secara default bernilai `true`; atur nilainya menjadi `false` untuk menonaktifkan alat.
- `tools.exec.applyPatch.workspaceOnly` secara default bernilai `true` (dibatasi di dalam ruang kerja). Atur nilainya menjadi `false` hanya jika Anda memang bermaksud mengizinkan `apply_patch` menulis/menghapus di luar direktori ruang kerja.
- `tools.exec.applyPatch.allowModels` adalah daftar izin opsional untuk id model (mentah, seperti `gpt-5.4`, atau lengkap, seperti `openai/gpt-5.4`). Jika ditetapkan, hanya model yang cocok yang mendapatkan alat tersebut; jika tidak ditetapkan, semua model mendapatkannya.

## Terkait

- [Persetujuan Exec](/id/tools/exec-approvals) — gerbang persetujuan untuk perintah shell
- [Sandboxing](/id/gateway/sandboxing) — menjalankan perintah dalam lingkungan sandbox
- [Proses Latar Belakang](/id/gateway/background-process) — alat exec dan proses yang berjalan lama
- [Keamanan](/id/gateway/security) — kebijakan alat dan akses dengan hak istimewa tinggi
