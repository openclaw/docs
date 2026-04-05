---
read_when:
    - Menambahkan atau memodifikasi perilaku background exec
    - Men-debug tugas exec yang berjalan lama
summary: Eksekusi exec latar belakang dan manajemen proses
title: Background Exec dan Tool Process
x-i18n:
    generated_at: "2026-04-05T13:52:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4398e2850f6f050944f103ad637cd9f578e9cc7fb478bc5cd5d972c92289b831
    source_path: gateway/background-process.md
    workflow: 15
---

# Background Exec + Tool Process

OpenClaw menjalankan perintah shell melalui tool `exec` dan menyimpan tugas yang berjalan lama di memori. Tool `process` mengelola sesi latar belakang tersebut.

## Tool exec

Parameter utama:

- `command` (wajib)
- `yieldMs` (default 10000): otomatis ke latar belakang setelah penundaan ini
- `background` (bool): langsung jalankan di latar belakang
- `timeout` (detik, default 1800): hentikan proses setelah batas waktu ini
- `elevated` (bool): jalankan di luar sandbox jika mode elevated diaktifkan/diizinkan (`gateway` secara default, atau `node` saat target exec adalah `node`)
- Butuh TTY nyata? Setel `pty: true`.
- `workdir`, `env`

Perilaku:

- Eksekusi foreground mengembalikan output secara langsung.
- Saat dijalankan di latar belakang (eksplisit atau karena batas waktu), tool mengembalikan `status: "running"` + `sessionId` dan tail singkat.
- Output disimpan di memori sampai sesi dipoll atau dibersihkan.
- Jika tool `process` tidak diizinkan, `exec` berjalan sinkron dan mengabaikan `yieldMs`/`background`.
- Perintah exec yang di-spawn menerima `OPENCLAW_SHELL=exec` untuk aturan shell/profile yang sadar konteks.
- Untuk pekerjaan berjalan lama yang dimulai sekarang, mulai sekali dan andalkan wake penyelesaian otomatis saat fitur itu diaktifkan dan perintah menghasilkan output atau gagal.
- Jika wake penyelesaian otomatis tidak tersedia, atau Anda memerlukan konfirmasi sukses-senyap untuk perintah yang selesai bersih tanpa output, gunakan `process` untuk mengonfirmasi penyelesaian.
- Jangan meniru pengingat atau tindak lanjut tertunda dengan loop `sleep` atau polling berulang; gunakan cron untuk pekerjaan di masa mendatang.

## Bridging child process

Saat men-spawn child process yang berjalan lama di luar tool exec/process (misalnya respawn CLI atau helper gateway), lampirkan helper bridge child-process agar sinyal penghentian diteruskan dan listener dilepas saat exit/error. Ini menghindari proses yatim di systemd dan menjaga perilaku shutdown tetap konsisten lintas platform.

Override environment:

- `PI_BASH_YIELD_MS`: yield default (md)
- `PI_BASH_MAX_OUTPUT_CHARS`: batas output di memori (karakter)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: batas stdout/stderr tertunda per stream (karakter)
- `PI_BASH_JOB_TTL_MS`: TTL untuk sesi selesai (md, dibatasi ke 1m–3j)

Config (disarankan):

- `tools.exec.backgroundMs` (default 10000)
- `tools.exec.timeoutSec` (default 1800)
- `tools.exec.cleanupMs` (default 1800000)
- `tools.exec.notifyOnExit` (default true): antrekan event sistem + minta heartbeat saat exec latar belakang keluar.
- `tools.exec.notifyOnExitEmptySuccess` (default false): saat true, juga antrekan event penyelesaian untuk eksekusi latar belakang yang berhasil tanpa menghasilkan output.

## Tool process

Aksi:

- `list`: sesi yang berjalan + selesai
- `poll`: kuras output baru untuk sebuah sesi (juga melaporkan status keluar)
- `log`: baca output teragregasi (mendukung `offset` + `limit`)
- `write`: kirim stdin (`data`, opsional `eof`)
- `send-keys`: kirim token tombol eksplisit atau byte ke sesi berbasis PTY
- `submit`: kirim Enter / carriage return ke sesi berbasis PTY
- `paste`: kirim teks literal, opsional dibungkus dalam bracketed paste mode
- `kill`: hentikan sesi latar belakang
- `clear`: hapus sesi selesai dari memori
- `remove`: hentikan jika masih berjalan, jika tidak bersihkan jika sudah selesai

Catatan:

- Hanya sesi yang dijalankan di latar belakang yang dicantumkan/disimpan di memori.
- Sesi hilang saat proses dimulai ulang (tanpa persistensi ke disk).
- Log sesi hanya disimpan ke riwayat chat jika Anda menjalankan `process poll/log` dan hasil tool direkam.
- `process` dicakup per agen; tool ini hanya melihat sesi yang dimulai oleh agen tersebut.
- Gunakan `poll` / `log` untuk status, log, konfirmasi sukses-senyap, atau konfirmasi penyelesaian saat wake penyelesaian otomatis tidak tersedia.
- Gunakan `write` / `send-keys` / `submit` / `paste` / `kill` saat Anda membutuhkan input atau intervensi.
- `process list` menyertakan `name` turunan (kata kerja perintah + target) untuk pemindaian cepat.
- `process log` menggunakan `offset`/`limit` berbasis baris.
- Saat `offset` dan `limit` keduanya dihilangkan, tool mengembalikan 200 baris terakhir dan menyertakan petunjuk paging.
- Saat `offset` diberikan dan `limit` dihilangkan, tool mengembalikan dari `offset` sampai akhir (tidak dibatasi ke 200).
- Polling adalah untuk status sesuai permintaan, bukan penjadwalan wait-loop. Jika pekerjaan seharusnya terjadi nanti, gunakan cron.

## Contoh

Jalankan tugas panjang dan poll nanti:

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
