---
read_when:
    - Menambahkan atau memodifikasi perilaku exec latar belakang
    - Men-debug tugas exec yang berjalan lama
summary: Eksekusi exec latar belakang dan manajemen proses
title: Exec latar belakang dan tool proses
x-i18n:
    generated_at: "2026-04-24T09:06:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6dbf6fd0ee39a053fda0a910e95827e9d0e31dcdfbbf542b6ba5d1d63aa48dc
    source_path: gateway/background-process.md
    workflow: 15
---

# Exec Latar Belakang + Tool Proses

OpenClaw menjalankan perintah shell melalui tool `exec` dan menyimpan tugas yang berjalan lama di memori. Tool `process` mengelola sesi latar belakang tersebut.

## Tool exec

Parameter utama:

- `command` (wajib)
- `yieldMs` (default 10000): otomatis ke latar belakang setelah jeda ini
- `background` (bool): langsung jalankan di latar belakang
- `timeout` (detik, default 1800): matikan proses setelah timeout ini
- `elevated` (bool): jalankan di luar sandbox jika mode elevated diaktifkan/diizinkan (`gateway` secara default, atau `node` ketika target exec adalah `node`)
- Butuh TTY sungguhan? Setel `pty: true`.
- `workdir`, `env`

Perilaku:

- Run foreground mengembalikan output secara langsung.
- Saat dijalankan di latar belakang (eksplisit atau karena timeout), tool mengembalikan `status: "running"` + `sessionId` dan tail singkat.
- Output disimpan di memori sampai sesi dipoll atau dibersihkan.
- Jika tool `process` tidak diizinkan, `exec` berjalan sinkron dan mengabaikan `yieldMs`/`background`.
- Perintah exec yang di-spawn menerima `OPENCLAW_SHELL=exec` untuk aturan shell/profil yang sadar konteks.
- Untuk pekerjaan yang berjalan lama dan dimulai sekarang, mulai sekali dan andalkan
  automatic completion wake ketika fitur itu diaktifkan dan perintah mengeluarkan output atau gagal.
- Jika automatic completion wake tidak tersedia, atau Anda memerlukan konfirmasi
  quiet-success untuk perintah yang keluar bersih tanpa output, gunakan `process`
  untuk mengonfirmasi penyelesaian.
- Jangan meniru pengingat atau tindak lanjut tertunda dengan loop `sleep` atau polling
  berulang; gunakan Cron untuk pekerjaan di masa depan.

## Bridging child process

Saat men-spawn child process yang berjalan lama di luar tool exec/process (misalnya respawn CLI atau helper gateway), lampirkan helper bridge child-process agar sinyal terminasi diteruskan dan listener dilepas saat exit/error. Ini mencegah proses yatim di systemd dan menjaga perilaku shutdown tetap konsisten di berbagai platform.

Override lingkungan:

- `PI_BASH_YIELD_MS`: yield default (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: batas output dalam memori (karakter)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: batas stdout/stderr pending per stream (karakter)
- `PI_BASH_JOB_TTL_MS`: TTL untuk sesi yang sudah selesai (ms, dibatasi ke 1m–3h)

Konfigurasi (disarankan):

- `tools.exec.backgroundMs` (default 10000)
- `tools.exec.timeoutSec` (default 1800)
- `tools.exec.cleanupMs` (default 1800000)
- `tools.exec.notifyOnExit` (default true): antrekan event sistem + minta heartbeat saat exec latar belakang keluar.
- `tools.exec.notifyOnExitEmptySuccess` (default false): saat true, juga antrekan event penyelesaian untuk run latar belakang yang berhasil tetapi tidak menghasilkan output.

## Tool process

Aksi:

- `list`: sesi berjalan + selesai
- `poll`: kuras output baru untuk suatu sesi (juga melaporkan status keluar)
- `log`: baca output yang teragregasi (mendukung `offset` + `limit`)
- `write`: kirim stdin (`data`, opsional `eof`)
- `send-keys`: kirim token key atau byte eksplisit ke sesi berbasis PTY
- `submit`: kirim Enter / carriage return ke sesi berbasis PTY
- `paste`: kirim teks literal, opsional dibungkus dengan mode bracketed paste
- `kill`: hentikan sesi latar belakang
- `clear`: hapus sesi yang sudah selesai dari memori
- `remove`: hentikan jika masih berjalan, jika tidak bersihkan jika sudah selesai

Catatan:

- Hanya sesi yang dijalankan di latar belakang yang dicantumkan/dipertahankan di memori.
- Sesi hilang saat proses dimulai ulang (tidak ada persistensi disk).
- Log sesi hanya disimpan ke riwayat obrolan jika Anda menjalankan `process poll/log` dan hasil tool dicatat.
- `process` bercakupan per agen; hanya melihat sesi yang dimulai oleh agen tersebut.
- Gunakan `poll` / `log` untuk status, log, konfirmasi quiet-success, atau
  konfirmasi penyelesaian ketika automatic completion wake tidak tersedia.
- Gunakan `write` / `send-keys` / `submit` / `paste` / `kill` ketika Anda membutuhkan input
  atau intervensi.
- `process list` menyertakan `name` turunan (kata kerja perintah + target) untuk pemindaian cepat.
- `process log` menggunakan `offset`/`limit` berbasis baris.
- Ketika `offset` dan `limit` sama-sama dihilangkan, tool mengembalikan 200 baris terakhir dan menyertakan petunjuk paging.
- Ketika `offset` diberikan dan `limit` dihilangkan, tool mengembalikan dari `offset` sampai akhir (tidak dibatasi ke 200).
- Polling ditujukan untuk status sesuai permintaan, bukan penjadwalan wait-loop. Jika pekerjaan
  seharusnya terjadi nanti, gunakan Cron.

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

Kirim key PTY:

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

- [Tool exec](/id/tools/exec)
- [Persetujuan exec](/id/tools/exec-approvals)
