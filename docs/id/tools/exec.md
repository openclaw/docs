---
read_when:
    - Menggunakan atau memodifikasi alat exec
    - Men-debug perilaku stdin atau TTY
summary: Penggunaan alat exec, mode stdin, dan dukungan TTY
title: Alat eksekusi
x-i18n:
    generated_at: "2026-07-16T18:38:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b8d7c3fcaa670851635cbd029d73f529a50be8c8c4df69565a1f96ea28757d04
    source_path: tools/exec.md
    workflow: 16
---

Jalankan perintah shell di ruang kerja. `exec` adalah permukaan shell yang dapat melakukan perubahan: perintah dapat membuat, mengedit, atau menghapus berkas di mana pun yang diizinkan oleh host atau sistem berkas sandbox yang dipilih. Menonaktifkan alat sistem berkas OpenClaw seperti `write`, `edit`, atau `apply_patch` tidak menjadikan `exec` hanya-baca.

Mendukung eksekusi latar depan dan latar belakang melalui `process`. Jika `process` tidak diizinkan, `exec` berjalan secara sinkron dan mengabaikan `yieldMs`/`background`. Sesi latar belakang dibatasi per agen; `process` hanya melihat sesi dari agen yang sama.

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
Secara otomatis jadikan perintah berjalan di latar belakang setelah penundaan ini (md).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Jalankan perintah di latar belakang dengan segera alih-alih menunggu `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Timpa batas waktu exec yang dikonfigurasi untuk panggilan ini, dalam detik. Berlaku untuk eksekusi latar depan, latar belakang, `yieldMs`, gateway, sandbox, dan node `system.run`. `timeout: 0` menonaktifkan batas waktu proses exec untuk panggilan tersebut.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Jalankan dalam terminal semu jika tersedia. Gunakan untuk CLI yang hanya mendukung TTY, agen pengodean, dan UI terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Tempat eksekusi. `auto` diubah menjadi `sandbox` saat runtime sandbox aktif dan menjadi `gateway` jika tidak.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Diabaikan untuk panggilan alat normal. Keamanan `gateway`/`node` dikendalikan oleh `tools.exec.security` dan berkas persetujuan host; mode dengan hak yang ditingkatkan hanya dapat memaksakan `security=full` ketika operator secara eksplisit memberikan akses yang ditingkatkan.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Mode permintaan dasar berasal dari `tools.exec.ask` dan persetujuan host. Untuk panggilan model yang berasal dari saluran, `ask` per panggilan diabaikan saat permintaan host efektif adalah `off`; jika tidak, nilainya hanya dapat diperketat ke mode yang lebih ketat. Pemanggil internal/API tepercaya yang membuat alat exec dengan nilai `ask` eksplisit tidak berubah.
</ParamField>

<ParamField path="node" type="string">
ID/nama Node saat `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Minta mode dengan hak yang ditingkatkan: keluar dari sandbox menuju jalur host yang dikonfigurasi. `security=full` hanya dipaksakan ketika mode dengan hak yang ditingkatkan ditetapkan menjadi `full`.
</ParamField>

Catatan:

- `host` hanya menerima `auto`, `sandbox`, `gateway`, atau `node`. Ini bukan pemilih nama host; nilai yang menyerupai nama host ditolak sebelum perintah berjalan.
- `host=node` per panggilan diizinkan dari `auto`; `host=gateway` per panggilan hanya diizinkan saat tidak ada runtime sandbox yang aktif.
- Tanpa konfigurasi tambahan, `host=auto` tetap "langsung berfungsi": jika tidak ada sandbox, nilainya diubah menjadi `gateway`; jika ada sandbox aktif, eksekusi tetap berada di dalam sandbox.
- `elevated` keluar dari sandbox menuju jalur host yang dikonfigurasi: `gateway` secara default, atau `node` ketika `tools.exec.host=node` (atau default sesi adalah `host=node`). Ini hanya tersedia ketika akses yang ditingkatkan diaktifkan untuk sesi/penyedia saat ini.
- Persetujuan `gateway`/`node` dikendalikan oleh berkas persetujuan host.
- `node` memerlukan Node yang dipasangkan (aplikasi pendamping atau host Node tanpa antarmuka). Jika tersedia beberapa Node, atur `exec.node` atau `tools.exec.node` untuk memilih salah satunya.
- `exec host=node` adalah satu-satunya jalur eksekusi shell untuk Node; pembungkus lama `nodes.run` telah dihapus.
- Pada host non-Windows, exec menggunakan `SHELL` jika ditetapkan; jika `SHELL` adalah `fish`, exec memilih `bash` (atau `sh`) dari `PATH` untuk menghindari bashisme yang tidak kompatibel dengan fish, lalu beralih ke `SHELL` jika keduanya tidak tersedia.
- Pada host Windows, exec memprioritaskan penemuan PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, lalu PATH), kemudian beralih ke Windows PowerShell 5.1.
- Pada host gateway non-Windows, perintah exec bash dan zsh menggunakan snapshot awal. OpenClaw menangkap alias/fungsi yang dapat dimuat dengan source dan sekumpulan kecil lingkungan aman dari berkas awal shell ke dalam `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`, lalu memuat snapshot tersebut dengan source sebelum setiap perintah exec. Variabel yang tampak seperti rahasia dikecualikan; exec sandbox dan Node tidak menggunakan snapshot ini. Tetapkan `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` dalam lingkungan proses Gateway untuk menonaktifkan jalur snapshot ini.
- Eksekusi host (`gateway`/`node`) menolak `env.PATH` dan penimpaan pemuat (`LD_*`/`DYLD_*`) untuk mencegah pembajakan biner atau penyuntikan kode.
- OpenClaw menetapkan `OPENCLAW_SHELL=exec` dalam lingkungan perintah yang dibuat (termasuk eksekusi PTY dan sandbox) agar aturan shell/profil dapat mendeteksi konteks alat exec.
- Untuk eksekusi yang berasal dari saluran, OpenClaw juga mengekspos muatan JSON identitas pengirim/obrolan yang terbatas dalam `OPENCLAW_CHANNEL_CONTEXT` ketika saluran menyediakan ID tersebut.
- `exec` tidak dapat menjalankan perintah shell `openclaw channels login` atau `/approve`: `openclaw channels login` adalah alur autentikasi saluran interaktif, dan `/approve` harus melalui penangan perintah persetujuan, bukan shell. Jalankan proses masuk saluran di terminal pada host gateway, atau gunakan alat agen masuk khusus saluran jika tersedia (misalnya `whatsapp_login`).
- Penting: sandbox **nonaktif secara default**. Jika sandbox nonaktif, `host=auto` implisit diubah menjadi `gateway`. `host=sandbox` eksplisit tetap gagal secara tertutup alih-alih berjalan diam-diam pada host gateway. Aktifkan sandbox atau gunakan `host=gateway` dengan persetujuan.
- Pemeriksaan awal skrip (untuk kesalahan sintaks shell Python/Node yang umum) hanya memeriksa berkas di dalam batas efektif `workdir`. Jika jalur skrip diubah menjadi lokasi di luar `workdir`, pemeriksaan awal dilewati untuk berkas tersebut. Pemeriksaan awal juga dilewati sepenuhnya ketika `host=gateway` dan kebijakan efektif adalah `security=full` dengan `ask=off`.
- Untuk pekerjaan berdurasi panjang yang dimulai sekarang, mulai sekali dan andalkan pemicuan penyelesaian otomatis saat fitur tersebut diaktifkan dan perintah menghasilkan keluaran atau gagal. Gunakan `process` untuk log, status, masukan, atau intervensi; jangan meniru penjadwalan dengan perulangan tidur, perulangan batas waktu, atau polling berulang.
- Untuk pekerjaan yang harus dilakukan nanti atau sesuai jadwal, gunakan cron alih-alih pola tidur/penundaan `exec`.

## Konfigurasi

| Kunci                                | Default                                                | Catatan                                                                                                                                                 |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.timeoutSec`              | `1800`                                                 | Batas waktu eksekusi default per perintah dalam detik. `timeout` per panggilan menimpanya; `timeout: 0` per panggilan menonaktifkan batas waktu proses eksekusi.                  |
| `tools.exec.host`                    | `auto`                                                 | Ditetapkan menjadi `sandbox` ketika runtime sandbox aktif, dan `gateway` jika tidak.                                                                            |
| `tools.exec.security`                | `deny` untuk sandbox, `full` untuk Gateway/Node saat tidak ditetapkan |                                                                                                                                                         |
| `tools.exec.ask`                     | `off`                                                  |                                                                                                                                                         |
| `tools.exec.mode`                    | tidak ditetapkan                                      | Opsi kebijakan yang dinormalisasi. Lihat [Mode](#modes) di bawah. Tidak dapat digabungkan dengan `tools.exec.security`/`tools.exec.ask`.                                      |
| `tools.exec.reviewer.model`          | agen utama yang dikonfigurasi                          | Penggantian penyedia/model opsional untuk peninjauan `mode=auto`.                                                                                                |
| `tools.exec.reviewer.timeoutMs`      | `30000`                                                | Batas waktu per tahap untuk persiapan dan penyelesaian model peninjau sebelum beralih ke manusia.                                                                  |
| `tools.exec.node`                    | tidak ditetapkan                                      |                                                                                                                                                         |
| `tools.exec.notifyOnExit`            | `true`                                                 | Jika bernilai true, sesi eksekusi di latar belakang memasukkan peristiwa sistem ke antrean dan meminta Heartbeat saat selesai.                                                           |
| `tools.exec.approvalRunningNoticeMs` | `10000`                                                | Mengirim satu pemberitahuan "sedang berjalan" ketika eksekusi yang memerlukan persetujuan berjalan lebih lama dari durasi ini (`0` menonaktifkannya).                                                        |
| `tools.exec.strictInlineEval`        | `false`                                                | Lihat [Evaluasi inline](#inline-eval-strictinlineeval).                                                                                                       |
| `tools.exec.commandHighlighting`     | `false`                                                | Jika bernilai true, permintaan persetujuan dapat menyoroti bagian perintah yang diperoleh dari parser dalam teks perintah. Tetapkan secara global atau per agen; ini tidak mengubah kebijakan persetujuan. |
| `tools.exec.pathPrepend`             | tidak ditetapkan                                      | Daftar direktori yang akan ditambahkan di awal `PATH` untuk eksekusi (hanya Gateway + sandbox).                                                                        |
| `tools.exec.safeBins`                | tidak ditetapkan                                      | Biner aman khusus stdin yang dapat dijalankan tanpa entri daftar izin eksplisit. Lihat [Biner aman](/id/tools/exec-approvals-advanced#safe-bins-stdin-only).         |
| `tools.exec.safeBinTrustedDirs`      | `/bin`, `/usr/bin`                                     | Direktori eksplisit tambahan yang dipercaya untuk pemeriksaan jalur `safeBins`. Entri `PATH` tidak pernah dipercaya secara otomatis.                                              |
| `tools.exec.safeBinProfiles`         | tidak ditetapkan                                      | Kebijakan argv khusus opsional per biner aman (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).                                        |

Eksekusi host tanpa persetujuan merupakan default untuk Gateway dan Node (`security=full`, `ask=off`) — ini berasal dari default kebijakan host, bukan dari `host=auto`. Jika Anda menginginkan perilaku persetujuan/daftar izin, perketat `tools.exec.*` sekaligus berkas persetujuan host; lihat [Persetujuan eksekusi](/id/tools/exec-approvals#yolo-mode-no-approval). Untuk memaksa perutean Gateway atau Node terlepas dari status sandbox, tetapkan `tools.exec.host` atau gunakan `/exec host=...`.

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

`tools.exec.mode` adalah opsi kebijakan yang dinormalisasi. Menetapkannya akan menghasilkan `security`/`ask` dan tidak dapat digabungkan dengan `tools.exec.security`/`tools.exec.ask` eksplisit.

| Mode        | security    | ask       | Perilaku                                                                                                                       |
| ----------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | `deny`      | `off`     | Eksekusi ditolak.                                                                                                              |
| `allowlist` | `allowlist` | `off`     | Hanya perintah dalam daftar izin/biner aman yang dijalankan; tidak ada perintah lain yang meminta persetujuan.                                                                 |
| `ask`       | `allowlist` | `on-miss` | Perintah yang cocok dengan daftar izin dijalankan langsung; semua perintah lainnya meminta persetujuan manusia.                                                                  |
| `auto`      | `allowlist` | `on-miss` | Perintah yang cocok dengan daftar izin/biner aman dijalankan langsung; semua perintah lainnya diteruskan melalui peninjau otomatis native OpenClaw sebelum meminta persetujuan manusia. |
| `full`      | `full`      | `off`     | Tanpa gerbang persetujuan.                                                                                                     |

`ask`/`ask=always` tetap meminta persetujuan manusia setiap kali, apa pun modenya.

Persetujuan peninjauan otomatis hanya berlaku sekali. Di Gateway, OpenClaw memberikan jalur executable yang telah ditetapkan kepada peninjau dan mengikat eksekusi ke jalur yang sama. Perintah yang tidak dapat disederhanakan menjadi satu rencana eksekusi yang dapat diberlakukan—seperti heredoc, ekspansi shell, atau pengutipan wrapper yang tidak didukung—akan beralih ke persetujuan manusia meskipun model seharusnya mengizinkannya.

Persetujuan perintah app-server Codex yang belum diputuskan oleh kebijakan runtime eksplisit atau kebijakan native menggunakan jalur persetujuan manusia. OpenClaw tidak menjalankan peninjau eksekusi yang dikonfigurasi untuk permintaan ini karena Codex tidak mengekspos executable terselesaikan yang dapat diberlakukan untuk mengikat keputusan peninjauan dengan perintah yang dijalankan Codex.

### Evaluasi inline (`strictInlineEval`)

Ketika `tools.exec.strictInlineEval` adalah `true`, bentuk evaluasi interpreter inline memerlukan persetujuan peninjau atau persetujuan eksplisit: `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, `osascript -e`, dan bentuk serupa pada interpreter serta pembawa perintah lain yang didukung (`awk`, `find -exec`, `make`, `sed`, `xargs`, dan lainnya). Dalam `mode=auto`, jalur persetujuan eksekusi normal dapat memungkinkan peninjau otomatis native mengizinkan perintah sekali pakai yang jelas berisiko rendah; panggilan `system.run` langsung pada host Node tetap memerlukan persetujuan eksplisit karena tidak dapat menyerahkan perintah ke jalur persetujuan manusia. Jika peninjau meminta persetujuan, permintaan diteruskan kepada manusia. `allow-always` tetap dapat menyimpan pemanggilan interpreter/skrip yang aman, tetapi bentuk evaluasi inline tidak menjadi aturan izin permanen.

### Penanganan PATH

- `host=gateway`: menggabungkan `PATH` shell login Anda ke lingkungan eksekusi. Penggantian `env.PATH` ditolak untuk eksekusi host. Daemon itu sendiri tetap berjalan dengan `PATH` minimal:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
  - Untuk mencegah konfigurasi shell pengguna (seperti `~/.zshenv` atau `/etc/zshenv`) menimpa jalur prioritas saat dimulai, entri `tools.exec.pathPrepend` ditambahkan secara aman di awal `PATH` akhir di dalam perintah shell tepat sebelum eksekusi.
- `host=sandbox`: menjalankan `sh -lc` (shell login) di dalam kontainer, sehingga `/etc/profile` dapat mengatur ulang `PATH`. OpenClaw menambahkan `env.PATH` di awal setelah pemuatan profil melalui variabel lingkungan internal (tanpa interpolasi shell); `tools.exec.pathPrepend` juga berlaku di sini.
- `host=node`: hanya penggantian lingkungan yang tidak diblokir dan Anda berikan yang dikirimkan ke Node. Penggantian `env.PATH` ditolak untuk eksekusi host dan diabaikan oleh host Node. Jika Anda memerlukan entri PATH tambahan pada Node, konfigurasikan lingkungan layanan host Node (systemd/launchd) atau instal alat di lokasi standar.

Pengikatan Node per agen (gunakan indeks daftar agen dalam konfigurasi):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

UI Kontrol: halaman **Devices** menyertakan panel kecil "Exec node binding" untuk pengaturan yang sama.

## Penggantian sesi (`/exec`)

Gunakan `/exec` untuk menetapkan default **per sesi** bagi `host`, `security`, `ask`, dan `node`. Kirim `/exec` tanpa argumen untuk menampilkan nilai saat ini.

Contoh:

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

`/exec` hanya dipatuhi untuk **pengirim yang diotorisasi** (daftar izin saluran/pemasangan plus `commands.useAccessGroups`). Ini hanya memperbarui **status sesi** dan tidak menulis konfigurasi. Pengirim saluran eksternal yang diotorisasi dapat menetapkan default sesi ini. Klien Gateway/webchat internal memerlukan `operator.admin` agar dapat menyimpannya secara permanen.

Untuk menonaktifkan eksekusi secara mutlak, tolak melalui kebijakan alat (`tools.deny: ["exec"]` atau per agen). Persetujuan host tetap berlaku kecuali Anda secara eksplisit menetapkan `security=full` dan `ask=off`.

## Persetujuan eksekusi (aplikasi pendamping / host Node)

Agen dalam sandbox dapat mewajibkan persetujuan per permintaan sebelum `exec` dijalankan pada Gateway atau host Node. Lihat [Persetujuan eksekusi](/id/tools/exec-approvals) untuk kebijakan, daftar izin, dan alur UI.

Ketika persetujuan manusia diperlukan, alur host Node dan Gateway non-native segera mengembalikan `status: "approval-pending"` beserta id persetujuan. Alur Gateway melalui chat native dan UI Web dapat menunggu secara inline dan mengembalikan hasil akhir perintah setelah disetujui. Hasil `approval-pending` berarti perintah belum dimulai, sehingga peringatan fallback latar depan hanya muncul jika perintah yang disetujui benar-benar dijalankan secara inline. Eksekusi asinkron yang disetujui mengirimkan peristiwa sistem progres dan penyelesaian perintah (`Exec running` / `Exec finished`); persetujuan yang ditolak atau kehabisan waktu bersifat terminal dan tidak membangunkan sesi agen dengan peristiwa sistem penolakan.

Pada channel dengan kartu/tombol persetujuan native, agen harus mengandalkan UI native tersebut terlebih dahulu dan hanya menyertakan perintah manual `/approve` ketika hasil alat secara eksplisit menyatakan bahwa persetujuan melalui chat tidak tersedia atau persetujuan manual merupakan satu-satunya jalur.

## Daftar izin + bin aman

Penerapan daftar izin manual mencocokkan glob jalur biner yang telah diresolusi dan glob nama perintah biasa. Nama biasa hanya cocok dengan perintah yang dipanggil melalui PATH, sehingga `rg` dapat cocok dengan `/opt/homebrew/bin/rg` ketika perintahnya adalah `rg`, tetapi tidak dengan `./rg` atau `/tmp/rg`.

Ketika `security=allowlist`, perintah shell diizinkan secara otomatis hanya jika setiap segmen pipeline tercantum dalam daftar izin atau merupakan bin aman. Perangkaian (`;`, `&&`, `||`) dan pengalihan ditolak dalam mode daftar izin kecuali setiap segmen tingkat atas memenuhi daftar izin (termasuk bin aman). Pengalihan tetap tidak didukung. Kepercayaan `allow-always` yang persisten tidak mengabaikan aturan tersebut: perintah berantai tetap mengharuskan setiap segmen tingkat atas cocok.

`autoAllowSkills` adalah jalur kemudahan terpisah dalam persetujuan eksekusi, bukan hal yang sama dengan entri daftar izin jalur manual. Untuk kepercayaan eksplisit yang ketat, biarkan `autoAllowSkills` dinonaktifkan.

Gunakan kedua kontrol tersebut untuk tugas yang berbeda:

- `tools.exec.safeBins`: filter aliran kecil yang hanya menggunakan stdin.
- `tools.exec.safeBinTrustedDirs`: direktori tepercaya tambahan yang eksplisit untuk jalur executable bin aman.
- `tools.exec.safeBinProfiles`: kebijakan argv eksplisit untuk bin aman kustom.
- allowlist: kepercayaan eksplisit untuk jalur executable.

Jangan perlakukan `safeBins` sebagai daftar izin generik, dan jangan tambahkan biner interpreter/runtime (misalnya `python3`, `node`, `ruby`, `bash`). Jika memerlukannya, gunakan entri daftar izin eksplisit dan tetap aktifkan permintaan persetujuan.

`openclaw security audit` memperingatkan ketika entri interpreter/runtime `safeBins` tidak memiliki profil eksplisit, dan `openclaw doctor --fix` dapat membuat kerangka entri `safeBinProfiles` kustom yang belum ada. `openclaw security audit` dan `openclaw doctor` juga memperingatkan ketika Anda secara eksplisit menambahkan kembali bin dengan perilaku luas seperti `jq` ke `safeBins` (`jq` dapat membaca data lingkungan dan memuat kode jq dari modul atau berkas startup, jadi pilih entri daftar izin eksplisit atau eksekusi yang dibatasi persetujuan sebagai gantinya). `jq` ditolak sebagai bin aman meskipun tercantum secara eksplisit. Jika Anda secara eksplisit memasukkan interpreter ke daftar izin, aktifkan `tools.exec.strictInlineEval` agar bentuk evaluasi kode inline tetap memerlukan peninjau atau persetujuan eksplisit.

Untuk detail dan contoh kebijakan selengkapnya, lihat [Persetujuan eksekusi](/id/tools/exec-approvals-advanced#safe-bins-stdin-only) dan [Bin aman versus daftar izin](/id/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

Polling digunakan untuk status sesuai permintaan, bukan loop penantian. Jika pengaktifan otomatis saat selesai diaktifkan, perintah dapat mengaktifkan sesi ketika menghasilkan output atau gagal.

Kirim tombol (gaya tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Kirim (hanya mengirim CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Tempel (menggunakan bracket secara default):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` adalah subalat dari `exec` untuk pengeditan multi-berkas terstruktur. Alat ini diaktifkan secara default dan tersedia bagi penyedia model apa pun; `allowModels` dapat membatasinya. Gunakan konfigurasi hanya jika Anda ingin menonaktifkannya atau membatasinya ke model tertentu:

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
- `deny: ["write"]` tidak menolak `apply_patch`; tolak `apply_patch` secara eksplisit atau gunakan `deny: ["group:fs"]` jika penulisan patch juga harus diblokir.
- Konfigurasi berada di bawah `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` secara default bernilai `true`; atur menjadi `false` untuk menonaktifkan alat.
- `tools.exec.applyPatch.workspaceOnly` secara default bernilai `true` (terbatas dalam ruang kerja). Atur menjadi `false` hanya jika Anda secara sengaja ingin `apply_patch` menulis/menghapus di luar direktori ruang kerja.
- `tools.exec.applyPatch.allowModels` adalah daftar izin opsional untuk ID model (mentah, seperti `gpt-5.4`, atau lengkap, seperti `openai/gpt-5.4`). Jika ditetapkan, hanya model yang cocok yang mendapatkan alat tersebut; jika tidak ditetapkan, semua model mendapatkannya.

## Terkait

- [Persetujuan Eksekusi](/id/tools/exec-approvals) — gerbang persetujuan untuk perintah shell
- [Sandboxing](/id/gateway/sandboxing) — menjalankan perintah di lingkungan sandbox
- [Proses Latar Belakang](/id/gateway/background-process) — alat eksekusi dan proses yang berjalan lama
- [Keamanan](/id/gateway/security) — kebijakan alat dan akses dengan hak istimewa lebih tinggi
