---
read_when:
    - Mengubah runtime agen, bootstrap ruang kerja, atau perilaku sesi
summary: Lingkungan eksekusi agen, kontrak ruang kerja, dan inisialisasi sesi
title: Runtime agen
x-i18n:
    generated_at: "2026-05-06T09:06:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 372cf6a02b35646c24e68d96938bba57721eeec512e17c2d40c8e721e7561bd1
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw menjalankan **runtime agen tertanam tunggal** - satu proses agen per
Gateway, dengan ruang kerja, berkas bootstrap, dan penyimpanan sesinya sendiri. Halaman ini
membahas kontrak runtime tersebut: apa yang harus ada di ruang kerja, berkas mana yang
diinjeksikan, dan bagaimana sesi melakukan bootstrap terhadapnya.

## Ruang Kerja (wajib)

OpenClaw menggunakan satu direktori ruang kerja agen (`agents.defaults.workspace`) sebagai direktori kerja **satu-satunya** (`cwd`) untuk alat dan konteks.

Disarankan: gunakan `openclaw setup` untuk membuat `~/.openclaw/openclaw.json` jika belum ada dan menginisialisasi berkas ruang kerja.

Tata letak ruang kerja lengkap + panduan pencadangan: [Ruang kerja agen](/id/concepts/agent-workspace)

Jika `agents.defaults.sandbox` diaktifkan, sesi non-utama dapat menimpanya dengan
ruang kerja per sesi di bawah `agents.defaults.sandbox.workspaceRoot` (lihat
[Konfigurasi Gateway](/id/gateway/configuration)).

## Berkas bootstrap (diinjeksikan)

Di dalam `agents.defaults.workspace`, OpenClaw mengharapkan berkas yang dapat diedit pengguna berikut:

- `AGENTS.md` - instruksi operasional + "memori"
- `SOUL.md` - persona, batasan, nada
- `TOOLS.md` - catatan alat yang dikelola pengguna (mis. `imsg`, `sag`, konvensi)
- `BOOTSTRAP.md` - ritual sekali jalan pertama kali (dihapus setelah selesai)
- `IDENTITY.md` - nama/vibe/emoji agen
- `USER.md` - profil pengguna + sapaan yang disukai

Pada giliran pertama sesi baru, OpenClaw menginjeksikan isi berkas-berkas ini ke dalam Project Context milik prompt sistem.

Berkas kosong dilewati. Berkas besar dipangkas dan dipotong dengan penanda agar prompt tetap ringkas (baca berkas untuk konten lengkap).

Jika berkas tidak ada, OpenClaw menginjeksikan satu baris penanda "berkas hilang" (dan `openclaw setup` akan membuat templat default yang aman).

`BOOTSTRAP.md` hanya dibuat untuk **ruang kerja yang benar-benar baru** (tidak ada berkas bootstrap lain). Selagi masih tertunda, OpenClaw menyimpannya dalam Project Context dan menambahkan panduan bootstrap prompt sistem untuk ritual awal, alih-alih menyalinnya ke pesan pengguna. Jika Anda menghapusnya setelah menyelesaikan ritual, berkas itu tidak seharusnya dibuat ulang pada restart berikutnya.

Untuk menonaktifkan pembuatan berkas bootstrap sepenuhnya (untuk ruang kerja yang telah diisi sebelumnya), atur:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Alat bawaan

Alat inti (read/exec/edit/write dan alat sistem terkait) selalu tersedia,
tunduk pada kebijakan alat. `apply_patch` bersifat opsional dan dibatasi oleh
`tools.exec.applyPatch`. `TOOLS.md` **tidak** mengontrol alat mana yang ada; itu
adalah panduan tentang bagaimana _Anda_ ingin alat tersebut digunakan.

## Skills

OpenClaw memuat Skills dari lokasi berikut (prioritas tertinggi terlebih dahulu):

- Ruang kerja: `<workspace>/skills`
- Skills agen proyek: `<workspace>/.agents/skills`
- Skills agen pribadi: `~/.agents/skills`
- Terkelola/lokal: `~/.openclaw/skills`
- Bawaan (dikirim bersama instalasi)
- Folder Skills tambahan: `skills.load.extraDirs`

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

Ketika mode antrean adalah `steer`, pesan masuk diinjeksikan ke run saat ini.
Pengarahan yang diantrekan dikirim **setelah giliran asisten saat ini selesai
mengeksekusi panggilan alatnya**, sebelum panggilan LLM berikutnya. Pi menguras semua pesan
pengarahan yang tertunda sekaligus untuk `steer`; `queue` lama menguras satu pesan per
batas model. Pengarahan tidak lagi melewati panggilan alat yang tersisa dari pesan
asisten saat ini.

Ketika mode antrean adalah `followup` atau `collect`, pesan masuk ditahan hingga
giliran saat ini berakhir, lalu giliran agen baru dimulai dengan payload yang diantrekan. Lihat
[Antrean](/id/concepts/queue) dan [Antrean pengarahan](/id/concepts/queue-steering) untuk perilaku mode
dan batas.

Streaming blok mengirim blok asisten yang telah selesai segera setelah selesai; fitur ini
**nonaktif secara default** (`agents.defaults.blockStreamingDefault: "off"`).
Sesuaikan batas melalui `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; default ke text_end).
Kontrol pemotongan blok lunak dengan `agents.defaults.blockStreamingChunk` (default ke
800-1200 karakter; mengutamakan jeda paragraf, lalu baris baru; kalimat terakhir).
Gabungkan chunk yang di-stream dengan `agents.defaults.blockStreamingCoalesce` untuk mengurangi
spam satu baris (penggabungan berbasis idle sebelum pengiriman). Channel non-Telegram memerlukan
`*.blockStreaming: true` eksplisit untuk mengaktifkan balasan blok.
Ringkasan alat verbose dikeluarkan saat alat dimulai (tanpa debounce); Control UI
men-stream output alat melalui event agen saat tersedia.
Detail selengkapnya: [Streaming + pemotongan](/id/concepts/streaming).

## Referensi model

Referensi model dalam konfigurasi (misalnya `agents.defaults.model` dan `agents.defaults.models`) diurai dengan memisahkan pada `/` **pertama**.

- Gunakan `provider/model` saat mengonfigurasi model.
- Jika ID model itu sendiri berisi `/` (gaya OpenRouter), sertakan prefiks provider (contoh: `openrouter/moonshotai/kimi-k2`).
- Jika Anda menghilangkan provider, OpenClaw mencoba alias terlebih dahulu, lalu kecocokan
  provider terkonfigurasi yang unik untuk id model persis tersebut, dan baru kemudian fallback
  ke provider default yang dikonfigurasi. Jika provider tersebut tidak lagi mengekspos model
  default yang dikonfigurasi, OpenClaw fallback ke provider/model terkonfigurasi pertama
  alih-alih menampilkan default provider terhapus yang sudah usang.

## Konfigurasi (minimal)

Minimal, atur:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (sangat disarankan)

---

_Berikutnya: [Chat Grup](/id/channels/group-messages)_ 🦞

## Terkait

- [Ruang kerja agen](/id/concepts/agent-workspace)
- [Perutean multi-agen](/id/concepts/multi-agent)
- [Manajemen sesi](/id/concepts/session)
