---
read_when:
    - Menambahkan atau mengubah perilaku eksekusi latar belakang
    - Men-debug tugas exec yang berjalan lama
summary: Eksekusi latar belakang dan manajemen proses
title: Eksekusi latar belakang dan alat proses
x-i18n:
    generated_at: "2026-07-12T14:10:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b540455797df71dcdb18b0caa5f5088e81ef8823e0ec79364bebad8e6f060f12
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw menjalankan perintah shell melalui alat `exec` dan menyimpan tugas yang berjalan lama dalam memori. Alat `process` mengelola sesi latar belakang tersebut.

## Alat exec

Parameter:

| Parameter    | Deskripsi                                                                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`    | Wajib. Perintah shell yang akan dijalankan.                                                                                                                         |
| `workdir`    | Direktori kerja; abaikan untuk menggunakan cwd bawaan.                                                                                                              |
| `env`        | Variabel lingkungan tambahan untuk perintah.                                                                                                                        |
| `yieldMs`    | Waktu tunggu dalam milidetik sebelum dialihkan ke latar belakang (bawaan 10000).                                                                                     |
| `background` | Jalankan segera di latar belakang.                                                                                                                                  |
| `timeout`    | Batas waktu dalam detik (bawaan `tools.exec.timeoutSec`); menghentikan proses saat waktu habis. Atur `timeout: 0` untuk menonaktifkan batas waktu proses exec bagi pemanggilan tersebut. |
| `pty`        | Jalankan dalam terminal semu jika tersedia (CLI yang memerlukan TTY, agen pemrograman).                                                                              |
| `elevated`   | Jalankan di luar sandbox jika mode dengan hak tinggi diaktifkan/diizinkan (`gateway` secara bawaan, atau `node` jika target exec adalah `node`).                     |
| `host`       | Target exec: `auto`, `sandbox`, `gateway`, atau `node`.                                                                                                             |
| `node`       | ID/nama Node, digunakan dengan `host: "node"`.                                                                                                                      |

Perilaku:

- Proses latar depan mengembalikan keluaran secara langsung.
- Saat dialihkan ke latar belakang (secara eksplisit atau karena batas waktu `yieldMs`), alat mengembalikan `status: "running"` + `sessionId` dan cuplikan singkat keluaran terakhir.
- Proses yang berjalan di latar belakang dan proses `yieldMs` mewarisi `tools.exec.timeoutSec`, kecuali pemanggilan meneruskan `timeout` secara eksplisit.
- Keluaran tetap berada dalam memori hingga sesi diperiksa atau dibersihkan.
- Jika alat `process` tidak diizinkan, `exec` berjalan secara sinkron dan mengabaikan `yieldMs`/`background`.
- Perintah exec yang dibuat menerima `OPENCLAW_SHELL=exec` untuk aturan shell/profil yang peka konteks.
- Untuk pekerjaan jangka panjang yang dimulai sekarang: mulai sekali dan andalkan pengaktifan otomatis saat selesai (jika diaktifkan) ketika perintah menghasilkan keluaran atau gagal.
- Jika pengaktifan otomatis saat selesai tidak tersedia, atau Anda memerlukan konfirmasi keberhasilan tanpa keluaran untuk perintah yang berakhir dengan baik tanpa keluaran, lakukan pemeriksaan dengan `process`.
- Jangan meniru pengingat atau tindak lanjut tertunda dengan perulangan `sleep` atau pemeriksaan berulang — gunakan Cron untuk pekerjaan mendatang.

### Penggantian melalui variabel lingkungan

| Variabel                                 | Efek                                                                                                                    |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_BASH_YIELD_MS`                 | Waktu tunggu bawaan sebelum dialihkan ke latar belakang (md). Bawaan 10000, dibatasi antara 10-120000.                  |
| `OPENCLAW_BASH_MAX_OUTPUT_CHARS`         | Batas keluaran dalam memori (karakter).                                                                                 |
| `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` | Batas stdout/stderr tertunda per aliran (karakter).                                                                     |
| `OPENCLAW_BASH_JOB_TTL_MS`               | TTL untuk sesi yang telah selesai (md), dibatasi antara 1 mnt-3 jam.                                                    |
| `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`    | Ambang keluaran tidak aktif sebelum sesi latar belakang yang dapat ditulisi ditandai kemungkinan menunggu masukan. Bawaan 15000. |

### Konfigurasi (lebih disarankan daripada penggantian melalui variabel lingkungan)

| Kunci                                 | Bawaan  | Efek                                                                                  |
| ------------------------------------- | ------- | ------------------------------------------------------------------------------------- |
| `tools.exec.backgroundMs`             | 10000   | Sama seperti `OPENCLAW_BASH_YIELD_MS`.                                                 |
| `tools.exec.timeoutSec`               | 1800    | Batas waktu bawaan per pemanggilan.                                                    |
| `tools.exec.cleanupMs`                | 1800000 | Sama seperti `OPENCLAW_BASH_JOB_TTL_MS`.                                               |
| `tools.exec.notifyOnExit`             | true    | Antrekan peristiwa sistem + minta Heartbeat saat exec latar belakang berakhir.         |
| `tools.exec.notifyOnExitEmptySuccess` | false   | Antrekan juga peristiwa penyelesaian untuk proses latar belakang yang berhasil tanpa keluaran. |

## Penghubungan proses anak

Saat membuat proses anak yang berjalan lama di luar alat exec/process (pemunculan ulang CLI, pembantu Gateway), lampirkan pembantu jembatan proses anak agar sinyal penghentian diteruskan dan pendengar dilepas saat keluar/terjadi kesalahan. Hal ini mencegah proses yatim pada systemd dan menjaga penghentian tetap konsisten di seluruh platform.

## Alat process

Tindakan:

| Tindakan    | Efek                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------ |
| `list`      | Sesi yang berjalan + selesai.                                                              |
| `poll`      | Ambil keluaran baru untuk suatu sesi (juga melaporkan status keluar).                      |
| `log`       | Baca keluaran gabungan dan petunjuk pemulihan masukan. Mendukung `offset` + `limit`.       |
| `write`     | Kirim stdin (`data`, `eof` opsional).                                                      |
| `send-keys` | Kirim token tombol atau byte secara eksplisit ke sesi yang didukung PTY.                   |
| `submit`    | Kirim Enter/carriage return ke sesi yang didukung PTY.                                     |
| `paste`     | Kirim teks literal, secara opsional dibungkus dalam mode penempelan bertanda kurung.       |
| `kill`      | Hentikan sesi latar belakang.                                                              |
| `clear`     | Hapus sesi yang telah selesai dari memori.                                                 |
| `remove`    | Hentikan jika sedang berjalan, atau bersihkan jika telah selesai.                          |

Catatan:

- Hanya sesi latar belakang yang dicantumkan/disimpan — hanya dalam memori, bukan pada disk. Sesi hilang saat proses dimulai ulang.
- Sesi latar belakang aktif mencegah penangguhan host secara kooperatif dan mulai ulang Gateway yang aman hingga pemilik proses mengonfirmasi bahwa proses benar-benar telah berhenti.
- `process remove` dapat langsung menyembunyikan sesi yang sedang berjalan setelah meminta penghentian; penangguhan dan mulai ulang tetap terblokir hingga keluarnya proses dikonfirmasi.
- Log sesi hanya disimpan ke riwayat obrolan jika Anda menjalankan `process poll`/`log` dan hasil alat direkam.
- `process` memiliki cakupan per agen; alat ini hanya melihat sesi yang dimulai oleh agen tersebut.
- Gunakan `poll`/`log` untuk status, log, atau konfirmasi penyelesaian saat pengaktifan otomatis ketika selesai tidak tersedia.
- Gunakan `log` sebelum memulihkan CLI interaktif agar transkrip saat ini, status stdin, dan petunjuk menunggu masukan terlihat bersama-sama.
- Gunakan `write`/`send-keys`/`submit`/`paste`/`kill` saat Anda memerlukan masukan atau intervensi.
- `process list` menyertakan `name` turunan (kata kerja perintah + target) untuk pemindaian cepat.
- `process list`, `poll`, dan `log` melaporkan `waitingForInput` hanya ketika sesi masih memiliki stdin yang dapat ditulisi dan telah tidak aktif lebih lama daripada ambang tunggu masukan (bawaan 15000 md, `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`).
- `process log` menggunakan `offset`/`limit` berbasis baris. Jika keduanya diabaikan, alat mengembalikan 200 baris terakhir beserta petunjuk paginasi. Jika `offset` ditetapkan dan `limit` tidak ditetapkan, alat mengembalikan dari `offset` hingga akhir (tidak dibatasi hingga 200).
- `timeout` milik `poll` menunggu hingga jumlah milidetik tersebut sebelum mengembalikan hasil; nilai di atas 30000 dibatasi menjadi 30000.
- Pemeriksaan digunakan untuk status sesuai permintaan, bukan penjadwalan perulangan tunggu. Jika pekerjaan harus dilakukan nanti, gunakan Cron.

## Contoh

Jalankan tugas panjang dan periksa nanti:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Periksa sesi interaktif sebelum mengirim masukan:

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

Mulai segera di latar belakang:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

Kirim stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

Kirim tombol PTY:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Kirim baris saat ini:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Tempel teks literal:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Terkait

- [Alat Exec](/id/tools/exec)
- [Persetujuan Exec](/id/tools/exec-approvals)
