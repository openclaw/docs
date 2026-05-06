---
read_when:
    - Menambahkan atau memodifikasi perilaku eksekusi latar belakang
    - Memecahkan masalah tugas exec yang berjalan lama
summary: Eksekusi exec di latar belakang dan pengelolaan proses
title: Eksekusi latar belakang dan alat proses
x-i18n:
    generated_at: "2026-05-06T09:10:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7677dcb1cb28b4922a034855550696f839e64cdd349b39d09fbf2c00acf8cec1
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw menjalankan perintah shell melalui alat `exec` dan menyimpan tugas yang berjalan lama dalam memori. Alat `process` mengelola sesi latar belakang tersebut.

## alat exec

Parameter kunci:

- `command` (wajib)
- `yieldMs` (default 10000): otomatis masuk latar belakang setelah penundaan ini
- `background` (bool): langsung berjalan di latar belakang
- `timeout` (detik, default `tools.exec.timeoutSec`): hentikan proses setelah timeout ini; tetapkan `timeout: 0` hanya untuk menonaktifkan timeout proses exec untuk panggilan tersebut
- `elevated` (bool): jalankan di luar sandbox jika mode elevated diaktifkan/diizinkan (`gateway` secara default, atau `node` saat target exec adalah `node`)
- Perlu TTY sungguhan? Tetapkan `pty: true`.
- `workdir`, `env`

Perilaku:

- Eksekusi latar depan mengembalikan output secara langsung.
- Saat dijalankan di latar belakang (eksplisit atau karena timeout), alat mengembalikan `status: "running"` + `sessionId` dan tail singkat.
- Eksekusi latar belakang dan `yieldMs` mewarisi `tools.exec.timeoutSec` kecuali panggilan menyediakan `timeout` eksplisit.
- Output disimpan dalam memori sampai sesi dipolling atau dibersihkan.
- Jika alat `process` tidak diizinkan, `exec` berjalan secara sinkron dan mengabaikan `yieldMs`/`background`.
- Perintah exec yang dijalankan menerima `OPENCLAW_SHELL=exec` untuk aturan shell/profil yang sadar konteks.
- Untuk pekerjaan berjalan lama yang dimulai sekarang, mulai sekali dan andalkan wake penyelesaian otomatis saat diaktifkan dan perintah mengeluarkan output atau gagal.
- Jika wake penyelesaian otomatis tidak tersedia, atau Anda memerlukan konfirmasi sukses-senyap untuk perintah yang keluar bersih tanpa output, gunakan `process` untuk mengonfirmasi penyelesaian.
- Jangan meniru pengingat atau tindak lanjut tertunda dengan loop `sleep` atau polling berulang; gunakan cron untuk pekerjaan mendatang.

## Penghubungan proses anak

Saat menjalankan proses anak yang berjalan lama di luar alat exec/process (misalnya, respawn CLI atau helper gateway), lampirkan helper bridge proses anak agar sinyal terminasi diteruskan dan listener dilepas saat exit/error. Ini menghindari proses yatim pada systemd dan menjaga perilaku shutdown tetap konsisten di berbagai platform.

Override lingkungan:

- `PI_BASH_YIELD_MS`: yield default (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: batas output dalam memori (karakter)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: batas stdout/stderr tertunda per stream (karakter)
- `PI_BASH_JOB_TTL_MS`: TTL untuk sesi selesai (ms, dibatasi 1m–3h)

Konfigurasi (disukai):

- `tools.exec.backgroundMs` (default 10000)
- `tools.exec.timeoutSec` (default 1800)
- `tools.exec.cleanupMs` (default 1800000)
- `tools.exec.notifyOnExit` (default true): mengantrekan event sistem + meminta Heartbeat saat exec latar belakang keluar.
- `tools.exec.notifyOnExitEmptySuccess` (default false): saat true, juga mengantrekan event penyelesaian untuk eksekusi latar belakang yang berhasil tetapi tidak menghasilkan output.

## alat process

Tindakan:

- `list`: sesi berjalan + selesai
- `poll`: menguras output baru untuk sesi (juga melaporkan status keluar)
- `log`: membaca output agregat (mendukung `offset` + `limit`)
- `write`: mengirim stdin (`data`, `eof` opsional)
- `send-keys`: mengirim token tombol eksplisit atau byte ke sesi berbasis PTY
- `submit`: mengirim Enter / carriage return ke sesi berbasis PTY
- `paste`: mengirim teks literal, opsional dibungkus dalam mode bracketed paste
- `kill`: menghentikan sesi latar belakang
- `clear`: menghapus sesi selesai dari memori
- `remove`: hentikan jika sedang berjalan, jika tidak bersihkan jika sudah selesai

Catatan:

- Hanya sesi latar belakang yang dicantumkan/dipertahankan dalam memori.
- Sesi hilang saat proses dimulai ulang (tidak ada persistensi disk).
- Log sesi hanya disimpan ke riwayat chat jika Anda menjalankan `process poll/log` dan hasil alat direkam.
- `process` dicakup per agen; ini hanya melihat sesi yang dimulai oleh agen tersebut.
- Gunakan `poll` / `log` untuk status, log, konfirmasi sukses-senyap, atau konfirmasi penyelesaian saat wake penyelesaian otomatis tidak tersedia.
- Gunakan `write` / `send-keys` / `submit` / `paste` / `kill` saat Anda memerlukan input atau intervensi.
- `process list` menyertakan `name` turunan (verba perintah + target) untuk pemindaian cepat.
- `process log` menggunakan `offset`/`limit` berbasis baris.
- Saat `offset` dan `limit` sama-sama dihilangkan, ini mengembalikan 200 baris terakhir dan menyertakan petunjuk paging.
- Saat `offset` disediakan dan `limit` dihilangkan, ini mengembalikan dari `offset` hingga akhir (tidak dibatasi hingga 200).
- Polling adalah untuk status sesuai permintaan, bukan penjadwalan loop tunggu. Jika pekerjaan harus terjadi nanti, gunakan cron sebagai gantinya.

## Contoh

Jalankan tugas panjang dan polling nanti:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
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
