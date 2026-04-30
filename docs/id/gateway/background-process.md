---
read_when:
    - Menambahkan atau mengubah perilaku eksekusi latar belakang
    - Men-debug tugas exec yang berjalan lama
summary: Eksekusi exec di latar belakang dan manajemen proses
title: Alat eksekusi latar belakang dan proses
x-i18n:
    generated_at: "2026-04-30T09:46:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0df76d7a09184bf87f5568d800bcee683620a76c092f34451d987db4ef1a1eaf
    source_path: gateway/background-process.md
    workflow: 16
---

# Exec Latar Belakang + Alat Process

OpenClaw menjalankan perintah shell melalui alat `exec` dan menyimpan tugas yang berjalan lama di memori. Alat `process` mengelola sesi latar belakang tersebut.

## Alat exec

Parameter utama:

- `command` (wajib)
- `yieldMs` (default 10000): otomatis menjadi latar belakang setelah penundaan ini
- `background` (bool): langsung jalankan di latar belakang
- `timeout` (detik, default `tools.exec.timeoutSec`): hentikan proses setelah timeout ini; atur `timeout: 0` hanya untuk menonaktifkan timeout proses exec untuk panggilan tersebut
- `elevated` (bool): jalankan di luar sandbox jika mode elevated diaktifkan/diizinkan (`gateway` secara default, atau `node` ketika target exec adalah `node`)
- Perlu TTY nyata? Atur `pty: true`.
- `workdir`, `env`

Perilaku:

- Eksekusi foreground mengembalikan output secara langsung.
- Saat dijalankan di latar belakang (eksplisit atau timeout), alat mengembalikan `status: "running"` + `sessionId` dan tail singkat.
- Eksekusi latar belakang dan `yieldMs` mewarisi `tools.exec.timeoutSec` kecuali panggilan menyediakan `timeout` eksplisit.
- Output disimpan di memori hingga sesi di-poll atau dibersihkan.
- Jika alat `process` tidak diizinkan, `exec` berjalan secara sinkron dan mengabaikan `yieldMs`/`background`.
- Perintah exec yang di-spawn menerima `OPENCLAW_SHELL=exec` untuk aturan shell/profil yang sadar konteks.
- Untuk pekerjaan berjalan lama yang dimulai sekarang, mulai sekali dan andalkan wake penyelesaian otomatis saat fitur itu diaktifkan dan perintah mengeluarkan output atau gagal.
- Jika wake penyelesaian otomatis tidak tersedia, atau Anda perlu konfirmasi sukses senyap untuk perintah yang keluar bersih tanpa output, gunakan `process` untuk mengonfirmasi penyelesaian.
- Jangan meniru pengingat atau tindak lanjut tertunda dengan loop `sleep` atau polling berulang; gunakan cron untuk pekerjaan masa depan.

## Bridging proses anak

Saat men-spawn proses anak yang berjalan lama di luar alat exec/process (misalnya, respawn CLI atau helper gateway), pasang helper bridge proses anak agar sinyal terminasi diteruskan dan listener dilepas saat exit/error. Ini menghindari proses yatim di systemd dan menjaga perilaku shutdown tetap konsisten di seluruh platform.

Override lingkungan:

- `PI_BASH_YIELD_MS`: yield default (md)
- `PI_BASH_MAX_OUTPUT_CHARS`: batas output dalam memori (karakter)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: batas stdout/stderr tertunda per stream (karakter)
- `PI_BASH_JOB_TTL_MS`: TTL untuk sesi selesai (md, dibatasi 1m–3h)

Config (disarankan):

- `tools.exec.backgroundMs` (default 10000)
- `tools.exec.timeoutSec` (default 1800)
- `tools.exec.cleanupMs` (default 1800000)
- `tools.exec.notifyOnExit` (default true): antrekan event sistem + minta Heartbeat saat exec latar belakang keluar.
- `tools.exec.notifyOnExitEmptySuccess` (default false): saat true, juga antrekan event penyelesaian untuk eksekusi latar belakang yang berhasil dan tidak menghasilkan output.

## Alat process

Tindakan:

- `list`: sesi berjalan + selesai
- `poll`: kuras output baru untuk sesi (juga melaporkan status keluar)
- `log`: baca output teragregasi (mendukung `offset` + `limit`)
- `write`: kirim stdin (`data`, opsional `eof`)
- `send-keys`: kirim token tombol eksplisit atau byte ke sesi berbasis PTY
- `submit`: kirim Enter / carriage return ke sesi berbasis PTY
- `paste`: kirim teks literal, opsional dibungkus dalam mode bracketed paste
- `kill`: hentikan sesi latar belakang
- `clear`: hapus sesi selesai dari memori
- `remove`: hentikan jika berjalan, atau bersihkan jika selesai

Catatan:

- Hanya sesi latar belakang yang dicantumkan/disimpan di memori.
- Sesi hilang saat proses dimulai ulang (tidak ada persistensi disk).
- Log sesi hanya disimpan ke riwayat chat jika Anda menjalankan `process poll/log` dan hasil alat direkam.
- `process` dibatasi per agen; alat ini hanya melihat sesi yang dimulai oleh agen tersebut.
- Gunakan `poll` / `log` untuk status, log, konfirmasi sukses senyap, atau konfirmasi penyelesaian saat wake penyelesaian otomatis tidak tersedia.
- Gunakan `write` / `send-keys` / `submit` / `paste` / `kill` saat Anda membutuhkan input atau intervensi.
- `process list` menyertakan `name` turunan (verb perintah + target) untuk pemindaian cepat.
- `process log` menggunakan `offset`/`limit` berbasis baris.
- Saat `offset` dan `limit` keduanya dihilangkan, alat mengembalikan 200 baris terakhir dan menyertakan petunjuk paging.
- Saat `offset` diberikan dan `limit` dihilangkan, alat mengembalikan dari `offset` hingga akhir (tidak dibatasi ke 200).
- Polling ditujukan untuk status sesuai permintaan, bukan penjadwalan loop tunggu. Jika pekerjaan harus terjadi nanti, gunakan cron sebagai gantinya.

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

## Terkait

- [Alat Exec](/id/tools/exec)
- [Persetujuan Exec](/id/tools/exec-approvals)
