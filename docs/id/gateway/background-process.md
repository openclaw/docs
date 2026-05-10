---
read_when:
    - Menambahkan atau memodifikasi perilaku eksekusi latar belakang
    - Menelusuri kesalahan pada tugas exec yang berjalan lama
summary: Eksekusi exec di latar belakang dan manajemen proses
title: Alat eksekusi latar belakang dan proses
x-i18n:
    generated_at: "2026-05-10T19:33:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95fb986cf0c07ef3d054189ce2838b441ae24f07703f8edc1ddb8aca3a58b300
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw menjalankan perintah shell melalui alat `exec` dan menyimpan tugas yang berjalan lama di memori. Alat `process` mengelola sesi latar belakang tersebut.

## Alat exec

Parameter utama:

- `command` (wajib)
- `yieldMs` (default 10000): otomatis berjalan di latar belakang setelah jeda ini
- `background` (bool): langsung berjalan di latar belakang
- `timeout` (detik, default `tools.exec.timeoutSec`): hentikan proses setelah batas waktu ini; tetapkan `timeout: 0` hanya untuk menonaktifkan batas waktu proses exec untuk panggilan tersebut
- `elevated` (bool): jalankan di luar sandbox jika mode elevated diaktifkan/diizinkan (`gateway` secara default, atau `node` saat target exec adalah `node`)
- Perlu TTY nyata? Tetapkan `pty: true`.
- `workdir`, `env`

Perilaku:

- Eksekusi latar depan mengembalikan output secara langsung.
- Saat dijalankan di latar belakang (eksplisit atau karena waktu habis), alat mengembalikan `status: "running"` + `sessionId` dan cuplikan akhir singkat.
- Eksekusi `background` dan `yieldMs` mewarisi `tools.exec.timeoutSec` kecuali panggilan menyediakan `timeout` eksplisit.
- Output disimpan di memori hingga sesi dipolling atau dibersihkan.
- Jika alat `process` tidak diizinkan, `exec` berjalan secara sinkron dan mengabaikan `yieldMs`/`background`.
- Perintah exec yang dibuat menerima `OPENCLAW_SHELL=exec` untuk aturan shell/profil yang sadar konteks.
- Untuk pekerjaan yang berjalan lama dan dimulai sekarang, mulai sekali dan andalkan wake penyelesaian otomatis saat diaktifkan dan perintah mengeluarkan output atau gagal.
- Jika wake penyelesaian otomatis tidak tersedia, atau Anda membutuhkan konfirmasi sukses senyap untuk perintah yang keluar bersih tanpa output, gunakan `process` untuk mengonfirmasi penyelesaian.
- Jangan meniru pengingat atau tindak lanjut tertunda dengan loop `sleep` atau polling berulang; gunakan cron untuk pekerjaan mendatang.

## Penjembatanan proses turunan

Saat membuat proses turunan yang berjalan lama di luar alat exec/process (misalnya, respawn CLI atau helper gateway), pasang helper bridge proses turunan agar sinyal terminasi diteruskan dan listener dilepas saat keluar/error. Ini menghindari proses yatim pada systemd dan menjaga perilaku shutdown tetap konsisten di berbagai platform.

Override lingkungan:

- `PI_BASH_YIELD_MS`: yield default (md)
- `PI_BASH_MAX_OUTPUT_CHARS`: batas output dalam memori (karakter)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: batas stdout/stderr tertunda per stream (karakter)
- `PI_BASH_JOB_TTL_MS`: TTL untuk sesi selesai (md, dibatasi 1m–3h)
- `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`: ambang output idle sebelum sesi latar belakang yang dapat ditulis ditandai kemungkinan menunggu input (default 15000 md)

Konfigurasi (disarankan):

- `tools.exec.backgroundMs` (default 10000)
- `tools.exec.timeoutSec` (default 1800)
- `tools.exec.cleanupMs` (default 1800000)
- `tools.exec.notifyOnExit` (default true): antrekan event sistem + minta Heartbeat saat exec latar belakang keluar.
- `tools.exec.notifyOnExitEmptySuccess` (default false): saat true, juga antrekan event penyelesaian untuk eksekusi latar belakang yang berhasil tetapi tidak menghasilkan output.

## Alat process

Tindakan:

- `list`: sesi berjalan + selesai
- `poll`: kuras output baru untuk sebuah sesi (juga melaporkan status keluar)
- `log`: baca output teragregasi dan tampilkan petunjuk pemulihan input (mendukung `offset` + `limit`)
- `write`: kirim stdin (`data`, opsional `eof`)
- `send-keys`: kirim token tombol eksplisit atau byte ke sesi yang didukung PTY
- `submit`: kirim Enter / carriage return ke sesi yang didukung PTY
- `paste`: kirim teks literal, opsional dibungkus dalam mode bracketed paste
- `kill`: akhiri sesi latar belakang
- `clear`: hapus sesi selesai dari memori
- `remove`: hentikan jika berjalan, jika tidak bersihkan jika selesai

Catatan:

- Hanya sesi latar belakang yang dicantumkan/dipertahankan di memori.
- Sesi hilang saat proses dimulai ulang (tidak ada persistensi disk).
- Log sesi hanya disimpan ke riwayat chat jika Anda menjalankan `process poll/log` dan hasil alat direkam.
- `process` memiliki cakupan per agent; hanya melihat sesi yang dimulai oleh agent tersebut.
- Gunakan `poll` / `log` untuk status, log, konfirmasi sukses senyap, atau konfirmasi penyelesaian saat wake penyelesaian otomatis tidak tersedia.
- Gunakan `log` sebelum memulihkan CLI interaktif agar transkrip saat ini, status stdin, dan petunjuk tunggu-input terlihat bersama.
- Gunakan `write` / `send-keys` / `submit` / `paste` / `kill` saat Anda membutuhkan input atau intervensi.
- `process list` menyertakan `name` turunan (kata kerja perintah + target) untuk pemindaian cepat.
- `process list`, `poll`, dan `log` melaporkan `waitingForInput` hanya saat sesi masih memiliki stdin yang dapat ditulis dan telah idle lebih lama dari ambang tunggu-input.
- `process log` menggunakan `offset`/`limit` berbasis baris.
- Saat `offset` dan `limit` sama-sama dihilangkan, ini mengembalikan 200 baris terakhir dan menyertakan petunjuk paginasi.
- Saat `offset` diberikan dan `limit` dihilangkan, ini mengembalikan dari `offset` hingga akhir (tidak dibatasi ke 200).
- Polling ditujukan untuk status sesuai permintaan, bukan penjadwalan loop tunggu. Jika pekerjaan harus terjadi nanti, gunakan cron sebagai gantinya.

## Contoh

Jalankan tugas panjang dan polling nanti:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Periksa sesi interaktif sebelum mengirim input:

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

Mulai langsung di latar belakang:

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
