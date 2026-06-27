---
read_when:
    - Menambahkan atau memodifikasi perilaku exec latar belakang
    - Men-debug tugas exec yang berjalan lama
summary: Eksekusi exec latar belakang dan manajemen proses
title: Eksekusi latar belakang dan alat proses
x-i18n:
    generated_at: "2026-06-27T17:28:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5822c1e26b0144c5216ae6e59e279ccc506cf4c0a42b8cd6c386f535fe458bd3
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw menjalankan perintah shell melalui alat `exec` dan menyimpan tugas berjalan lama di memori. Alat `process` mengelola sesi latar belakang tersebut.

## alat exec

Parameter utama:

- `command` (wajib)
- `yieldMs` (default 10000): otomatis berjalan di latar belakang setelah penundaan ini
- `background` (bool): langsung berjalan di latar belakang
- `timeout` (detik, default `tools.exec.timeoutSec`): hentikan proses setelah batas waktu ini; atur `timeout: 0` hanya untuk menonaktifkan batas waktu proses exec untuk panggilan tersebut
- `elevated` (bool): jalankan di luar sandbox jika mode elevated diaktifkan/diizinkan (`gateway` secara default, atau `node` ketika target exec adalah `node`)
- Perlu TTY sungguhan? Atur `pty: true`.
- `workdir`, `env`

Perilaku:

- Proses foreground mengembalikan output secara langsung.
- Saat dijalankan di latar belakang (eksplisit atau karena batas waktu), alat mengembalikan `status: "running"` + `sessionId` dan tail singkat.
- Proses latar belakang dan proses `yieldMs` mewarisi `tools.exec.timeoutSec` kecuali panggilan menyediakan `timeout` eksplisit.
- Output disimpan di memori sampai sesi di-poll atau dibersihkan.
- Jika alat `process` tidak diizinkan, `exec` berjalan sinkron dan mengabaikan `yieldMs`/`background`.
- Perintah exec yang dibuat menerima `OPENCLAW_SHELL=exec` untuk aturan shell/profil yang sadar konteks.
- Untuk pekerjaan berjalan lama yang dimulai sekarang, mulai sekali dan andalkan
  pemicu bangun penyelesaian otomatis saat diaktifkan dan perintah mengeluarkan output atau gagal.
- Jika pemicu bangun penyelesaian otomatis tidak tersedia, atau Anda memerlukan
  konfirmasi keberhasilan senyap untuk perintah yang selesai bersih tanpa output, gunakan `process`
  untuk mengonfirmasi penyelesaian.
- Jangan meniru pengingat atau tindak lanjut tertunda dengan loop `sleep` atau polling
  berulang; gunakan cron untuk pekerjaan mendatang.

## Penjembatanan proses anak

Saat membuat proses anak berjalan lama di luar alat exec/process (misalnya, respawn CLI atau helper gateway), pasang helper jembatan proses anak agar sinyal terminasi diteruskan dan listener dilepas saat keluar/error. Ini menghindari proses yatim pada systemd dan menjaga perilaku shutdown tetap konsisten lintas platform.

Override lingkungan:

- `OPENCLAW_BASH_YIELD_MS`: yield default (md)
- `OPENCLAW_BASH_MAX_OUTPUT_CHARS`: batas output dalam memori (karakter)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: batas stdout/stderr tertunda per stream (karakter)
- `OPENCLAW_BASH_JOB_TTL_MS`: TTL untuk sesi yang selesai (md, dibatasi 1m–3j)
- `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`: ambang output idle sebelum sesi latar belakang yang dapat ditulis ditandai kemungkinan menunggu input (default 15000 md)

Konfigurasi (disarankan):

- `tools.exec.backgroundMs` (default 10000)
- `tools.exec.timeoutSec` (default 1800)
- `tools.exec.cleanupMs` (default 1800000)
- `tools.exec.notifyOnExit` (default true): antrekan event sistem + minta Heartbeat saat exec latar belakang keluar.
- `tools.exec.notifyOnExitEmptySuccess` (default false): ketika true, juga antrekan event penyelesaian untuk proses latar belakang yang berhasil tetapi tidak menghasilkan output.

## alat process

Tindakan:

- `list`: sesi berjalan + selesai
- `poll`: kuras output baru untuk sebuah sesi (juga melaporkan status keluar)
- `log`: baca output agregat dan tampilkan petunjuk pemulihan input (mendukung `offset` + `limit`)
- `write`: kirim stdin (`data`, `eof` opsional)
- `send-keys`: kirim token tombol eksplisit atau byte ke sesi berbasis PTY
- `submit`: kirim Enter / carriage return ke sesi berbasis PTY
- `paste`: kirim teks literal, opsional dibungkus dalam mode paste bertanda kurung
- `kill`: hentikan sesi latar belakang
- `clear`: hapus sesi selesai dari memori
- `remove`: hentikan jika sedang berjalan, jika tidak bersihkan jika selesai

Catatan:

- Hanya sesi latar belakang yang dicantumkan/disimpan di memori.
- Sesi hilang saat proses dimulai ulang (tidak ada persistensi disk).
- Log sesi hanya disimpan ke riwayat chat jika Anda menjalankan `process poll/log` dan hasil alat direkam.
- `process` tercakup per agent; alat ini hanya melihat sesi yang dimulai oleh agent tersebut.
- Gunakan `poll` / `log` untuk status, log, konfirmasi keberhasilan senyap, atau
  konfirmasi penyelesaian saat pemicu bangun penyelesaian otomatis tidak tersedia.
- Gunakan `log` sebelum memulihkan CLI interaktif agar transkrip saat ini,
  status stdin, dan petunjuk tunggu-input terlihat bersama.
- Gunakan `write` / `send-keys` / `submit` / `paste` / `kill` saat Anda memerlukan input
  atau intervensi.
- `process list` menyertakan `name` turunan (kata kerja perintah + target) untuk pemindaian cepat.
- `process list`, `poll`, dan `log` melaporkan `waitingForInput` hanya
  saat sesi masih memiliki stdin yang dapat ditulis dan telah idle lebih lama dari
  ambang tunggu-input.
- `process log` menggunakan `offset`/`limit` berbasis baris.
- Ketika `offset` dan `limit` sama-sama dihilangkan, alat mengembalikan 200 baris terakhir dan menyertakan petunjuk paging.
- Ketika `offset` diberikan dan `limit` dihilangkan, alat mengembalikan dari `offset` hingga akhir (tidak dibatasi 200).
- Polling digunakan untuk status sesuai permintaan, bukan penjadwalan loop tunggu. Jika pekerjaan harus
  terjadi nanti, gunakan cron sebagai gantinya.

## Contoh

Jalankan tugas panjang dan poll nanti:

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

- [Alat exec](/id/tools/exec)
- [Persetujuan exec](/id/tools/exec-approvals)
