---
read_when:
    - Mengubah lingkungan eksekusi agen, inisialisasi ruang kerja, atau perilaku sesi
summary: Runtime agen, kontrak ruang kerja, dan inisialisasi awal sesi
title: Runtime agen
x-i18n:
    generated_at: "2026-04-30T09:42:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d65ee96cece296251d7d3a0512f12d2dfa900db0e5ffc0f37dcddae7ea55ad
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw menjalankan **satu runtime agen tertanam** — satu proses agen per
Gateway, dengan workspace, file bootstrap, dan penyimpanan sesinya sendiri. Halaman ini
membahas kontrak runtime tersebut: apa yang harus ada dalam workspace, file mana yang
disuntikkan, dan bagaimana sesi melakukan bootstrap terhadapnya.

## Workspace (wajib)

OpenClaw menggunakan satu direktori workspace agen (`agents.defaults.workspace`) sebagai direktori kerja (`cwd`) **satu-satunya** milik agen untuk alat dan konteks.

Direkomendasikan: gunakan `openclaw setup` untuk membuat `~/.openclaw/openclaw.json` jika belum ada dan menginisialisasi file workspace.

Tata letak workspace lengkap + panduan pencadangan: [Workspace agen](/id/concepts/agent-workspace)

Jika `agents.defaults.sandbox` diaktifkan, sesi non-utama dapat menimpanya dengan
workspace per sesi di bawah `agents.defaults.sandbox.workspaceRoot` (lihat
[Konfigurasi Gateway](/id/gateway/configuration)).

## File bootstrap (disuntikkan)

Di dalam `agents.defaults.workspace`, OpenClaw mengharapkan file yang dapat diedit pengguna berikut:

- `AGENTS.md` — instruksi operasional + “memori”
- `SOUL.md` — persona, batasan, nada
- `TOOLS.md` — catatan alat yang dikelola pengguna (mis. `imsg`, `sag`, konvensi)
- `BOOTSTRAP.md` — ritual sekali jalan pertama kali (dihapus setelah selesai)
- `IDENTITY.md` — nama/vibe/emoji agen
- `USER.md` — profil pengguna + sapaan yang disukai

Pada giliran pertama sesi baru, OpenClaw menyuntikkan isi file-file ini langsung ke konteks agen.

File kosong dilewati. File besar dipangkas dan dipotong dengan penanda agar prompt tetap ringkas (baca file untuk isi lengkap).

Jika sebuah file hilang, OpenClaw menyuntikkan satu baris penanda “file hilang” (dan `openclaw setup` akan membuat templat default yang aman).

`BOOTSTRAP.md` hanya dibuat untuk **workspace yang benar-benar baru** (tidak ada file bootstrap lain). Jika Anda menghapusnya setelah menyelesaikan ritual, file itu tidak boleh dibuat ulang pada restart berikutnya.

Untuk menonaktifkan pembuatan file bootstrap sepenuhnya (untuk workspace yang sudah diisi sebelumnya), atur:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Alat bawaan

Alat inti (read/exec/edit/write dan alat sistem terkait) selalu tersedia,
sesuai kebijakan alat. `apply_patch` bersifat opsional dan dikendalikan oleh
`tools.exec.applyPatch`. `TOOLS.md` **tidak** mengontrol alat mana yang ada; itu adalah
panduan tentang bagaimana _Anda_ ingin alat tersebut digunakan.

## Skills

OpenClaw memuat skills dari lokasi berikut (prioritas tertinggi terlebih dahulu):

- Workspace: `<workspace>/skills`
- Skill agen proyek: `<workspace>/.agents/skills`
- Skill agen pribadi: `~/.agents/skills`
- Terkelola/lokal: `~/.openclaw/skills`
- Bundel (dikirim bersama instalasi)
- Folder skill tambahan: `skills.load.extraDirs`

Skills dapat dibatasi oleh config/env (lihat `skills` di [Konfigurasi Gateway](/id/gateway/configuration)).

## Batas runtime

Runtime agen tertanam dibangun di atas inti agen Pi (model, alat, dan
pipeline prompt). Manajemen sesi, penemuan, pengabelan alat, dan pengiriman
channel adalah lapisan milik OpenClaw di atas inti tersebut.

## Sesi

Transkrip sesi disimpan sebagai JSONL di:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

ID sesi stabil dan dipilih oleh OpenClaw.
Folder sesi lama dari alat lain tidak dibaca.

## Mengarahkan saat streaming

Ketika mode antrean adalah `steer`, pesan masuk disuntikkan ke run saat ini.
Pengarahan yang diantrekan dikirim **setelah giliran asisten saat ini selesai
mengeksekusi panggilan alatnya**, sebelum panggilan LLM berikutnya. Pi menguras semua pesan
pengarahan tertunda sekaligus untuk `steer`; `queue` lama menguras satu pesan per
batas model. Pengarahan tidak lagi melewati panggilan alat tersisa dari pesan
asisten saat ini.

Ketika mode antrean adalah `followup` atau `collect`, pesan masuk ditahan hingga
giliran saat ini berakhir, lalu giliran agen baru dimulai dengan payload yang diantrekan. Lihat
[Antrean](/id/concepts/queue) dan [Antrean pengarahan](/id/concepts/queue-steering) untuk perilaku mode
dan batas.

Streaming blok mengirim blok asisten yang selesai segera setelah blok tersebut selesai; fitur ini
**mati secara default** (`agents.defaults.blockStreamingDefault: "off"`).
Sesuaikan batas melalui `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; default ke text_end).
Kontrol pemotongan blok lunak dengan `agents.defaults.blockStreamingChunk` (default ke
800–1200 karakter; mengutamakan jeda paragraf, lalu baris baru; kalimat terakhir).
Gabungkan potongan yang di-stream dengan `agents.defaults.blockStreamingCoalesce` untuk mengurangi
spam satu baris (penggabungan berbasis idle sebelum kirim). Channel non-Telegram memerlukan
`*.blockStreaming: true` eksplisit untuk mengaktifkan balasan blok.
Ringkasan alat verbose dikeluarkan saat alat dimulai (tanpa debounce); Control UI
melakukan stream output alat melalui event agen jika tersedia.
Detail selengkapnya: [Streaming + pemotongan](/id/concepts/streaming).

## Referensi model

Referensi model dalam konfigurasi (misalnya `agents.defaults.model` dan `agents.defaults.models`) diurai dengan memisahkan pada `/` **pertama**.

- Gunakan `provider/model` saat mengonfigurasi model.
- Jika ID model itu sendiri berisi `/` (gaya OpenRouter), sertakan prefiks provider (contoh: `openrouter/moonshotai/kimi-k2`).
- Jika Anda menghilangkan provider, OpenClaw mencoba alias terlebih dahulu, lalu kecocokan
  provider-terkonfigurasi yang unik untuk id model persis tersebut, dan baru kemudian fallback
  ke provider default yang dikonfigurasi. Jika provider tersebut tidak lagi mengekspos
  model default yang dikonfigurasi, OpenClaw fallback ke provider/model pertama yang
  dikonfigurasi alih-alih menampilkan default provider yang sudah dihapus dan usang.

## Konfigurasi (minimal)

Minimal, atur:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (sangat direkomendasikan)

---

_Berikutnya: [Chat Grup](/id/channels/group-messages)_ 🦞

## Terkait

- [Workspace agen](/id/concepts/agent-workspace)
- [Perutean multi-agen](/id/concepts/multi-agent)
- [Manajemen sesi](/id/concepts/session)
