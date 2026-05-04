---
read_when:
    - Mengubah lingkungan eksekusi agen, inisialisasi ruang kerja, atau perilaku sesi
summary: Runtime agen, kontrak ruang kerja, dan inisialisasi sesi
title: Lingkungan eksekusi agen
x-i18n:
    generated_at: "2026-05-04T02:22:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89bbbd05a9bf2054d3a1f24aeed005a05b61152a047b593addfb46817baae05a
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw menjalankan **satu runtime agen tertanam** — satu proses agen per
Gateway, dengan workspace, file bootstrap, dan penyimpanan sesinya sendiri. Halaman ini
mencakup kontrak runtime tersebut: apa yang harus ada di workspace, file mana yang
diinjeksikan, dan bagaimana sesi melakukan bootstrap terhadapnya.

## Workspace (wajib)

OpenClaw menggunakan satu direktori workspace agen (`agents.defaults.workspace`) sebagai **satu-satunya** direktori kerja (`cwd`) agen untuk alat dan konteks.

Direkomendasikan: gunakan `openclaw setup` untuk membuat `~/.openclaw/openclaw.json` jika belum ada dan menginisialisasi file workspace.

Tata letak workspace lengkap + panduan pencadangan: [Workspace agen](/id/concepts/agent-workspace)

Jika `agents.defaults.sandbox` diaktifkan, sesi non-utama dapat menimpa ini dengan
workspace per sesi di bawah `agents.defaults.sandbox.workspaceRoot` (lihat
[Konfigurasi Gateway](/id/gateway/configuration)).

## File bootstrap (diinjeksikan)

Di dalam `agents.defaults.workspace`, OpenClaw mengharapkan file yang dapat diedit pengguna berikut:

- `AGENTS.md` — instruksi operasi + “memori”
- `SOUL.md` — persona, batasan, nada
- `TOOLS.md` — catatan alat yang dikelola pengguna (mis. `imsg`, `sag`, konvensi)
- `BOOTSTRAP.md` — ritual pertama kali satu kali (dihapus setelah selesai)
- `IDENTITY.md` — nama/vibe/emoji agen
- `USER.md` — profil pengguna + sapaan pilihan

Pada giliran pertama sesi baru, OpenClaw menginjeksikan isi file-file ini ke dalam Project Context pada prompt sistem.

File kosong dilewati. File besar dipangkas dan dipotong dengan penanda agar prompt tetap ramping (baca file untuk konten lengkap).

Jika file tidak ada, OpenClaw menginjeksikan satu baris penanda “file hilang” (dan `openclaw setup` akan membuat templat default yang aman).

`BOOTSTRAP.md` hanya dibuat untuk **workspace yang benar-benar baru** (tidak ada file bootstrap lain). Selagi masih tertunda, OpenClaw mempertahankannya di Project Context dan menambahkan panduan bootstrap prompt sistem untuk ritual awal alih-alih menyalinnya ke pesan pengguna. Jika Anda menghapusnya setelah menyelesaikan ritual, file itu tidak seharusnya dibuat ulang pada restart berikutnya.

Untuk menonaktifkan pembuatan file bootstrap sepenuhnya (untuk workspace yang sudah diisi sebelumnya), atur:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Alat bawaan

Alat inti (read/exec/edit/write dan alat sistem terkait) selalu tersedia,
tunduk pada kebijakan alat. `apply_patch` bersifat opsional dan dikontrol oleh
`tools.exec.applyPatch`. `TOOLS.md` **tidak** mengontrol alat mana yang ada; itu adalah
panduan tentang bagaimana _Anda_ ingin alat tersebut digunakan.

## Skills

OpenClaw memuat Skills dari lokasi berikut (prioritas tertinggi lebih dulu):

- Workspace: `<workspace>/skills`
- Skills agen proyek: `<workspace>/.agents/skills`
- Skills agen pribadi: `~/.agents/skills`
- Terkelola/lokal: `~/.openclaw/skills`
- Terbundel (dikirim bersama instalasi)
- Folder Skills tambahan: `skills.load.extraDirs`

Skills dapat dikontrol oleh config/env (lihat `skills` di [Konfigurasi Gateway](/id/gateway/configuration)).

## Batas runtime

Runtime agen tertanam dibangun di atas inti agen Pi (model, alat, dan
pipeline prompt). Manajemen sesi, penemuan, penyambungan alat, dan pengiriman
kanal adalah lapisan milik OpenClaw di atas inti tersebut.

## Sesi

Transkrip sesi disimpan sebagai JSONL di:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

ID sesi stabil dan dipilih oleh OpenClaw.
Folder sesi lama dari alat lain tidak dibaca.

## Pengarahan saat streaming

Saat mode antrean adalah `steer`, pesan masuk diinjeksikan ke run saat ini.
Pengarahan yang diantrekan dikirim **setelah giliran asisten saat ini selesai
mengeksekusi tool call-nya**, sebelum panggilan LLM berikutnya. Pi menguras semua pesan
pengarahan yang tertunda bersama-sama untuk `steer`; `queue` lama menguras satu pesan per
batas model. Pengarahan tidak lagi melewati tool call yang tersisa dari pesan
asisten saat ini.

Saat mode antrean adalah `followup` atau `collect`, pesan masuk ditahan hingga
giliran saat ini berakhir, lalu giliran agen baru dimulai dengan payload yang diantrekan. Lihat
[Antrean](/id/concepts/queue) dan [Antrean pengarahan](/id/concepts/queue-steering) untuk perilaku mode
dan batas.

Streaming blok mengirim blok asisten yang selesai segera setelah selesai; ini
**nonaktif secara default** (`agents.defaults.blockStreamingDefault: "off"`).
Sesuaikan batas melalui `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; default ke text_end).
Kontrol pemotongan blok lunak dengan `agents.defaults.blockStreamingChunk` (default ke
800–1200 karakter; mengutamakan jeda paragraf, lalu baris baru; kalimat terakhir).
Gabungkan chunk streaming dengan `agents.defaults.blockStreamingCoalesce` untuk mengurangi
spam satu baris (penggabungan berbasis idle sebelum kirim). Kanal non-Telegram memerlukan
`*.blockStreaming: true` eksplisit untuk mengaktifkan balasan blok.
Ringkasan alat verbose dipancarkan saat alat dimulai (tanpa debounce); Control UI
men-stream output alat melalui event agen jika tersedia.
Detail lebih lanjut: [Streaming + pemotongan chunk](/id/concepts/streaming).

## Referensi model

Referensi model dalam config (misalnya `agents.defaults.model` dan `agents.defaults.models`) diurai dengan membagi pada `/` **pertama**.

- Gunakan `provider/model` saat mengonfigurasi model.
- Jika ID model itu sendiri berisi `/` (gaya OpenRouter), sertakan prefiks penyedia (contoh: `openrouter/moonshotai/kimi-k2`).
- Jika Anda menghilangkan penyedia, OpenClaw mencoba alias terlebih dahulu, lalu kecocokan
  penyedia terkonfigurasi yang unik untuk id model persis tersebut, dan baru setelah itu fallback
  ke penyedia default yang dikonfigurasi. Jika penyedia tersebut tidak lagi mengekspos
  model default yang dikonfigurasi, OpenClaw fallback ke
  penyedia/model terkonfigurasi pertama alih-alih menampilkan default penyedia yang dihapus yang sudah usang.

## Konfigurasi (minimal)

Minimal, atur:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (sangat direkomendasikan)

---

_Berikutnya: [Chat Grup](/id/channels/group-messages)_ 🦞

## Terkait

- [Workspace agen](/id/concepts/agent-workspace)
- [Routing multi-agen](/id/concepts/multi-agent)
- [Manajemen sesi](/id/concepts/session)
