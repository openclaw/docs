---
read_when:
    - Mengubah runtime agen, bootstrap ruang kerja, atau perilaku sesi
summary: Runtime agen, kontrak ruang kerja, dan bootstrap sesi
title: Runtime agen
x-i18n:
    generated_at: "2026-06-27T17:23:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fb4d3f0bb6e8aa2a23d00f5def5eb0ffa152bc75f82a12c40ac7ed00776011c
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw menjalankan **satu runtime agen tertanam** - satu proses agen per
Gateway, dengan workspace, file bootstrap, dan penyimpanan sesinya sendiri. Halaman ini
membahas kontrak runtime tersebut: apa yang harus ada di workspace, file mana yang
diinjeksi, dan bagaimana sesi melakukan bootstrap terhadapnya.

## Workspace (wajib)

OpenClaw menggunakan satu direktori workspace agen (`agents.defaults.workspace`) sebagai **satu-satunya** direktori kerja (`cwd`) agen untuk alat dan konteks.

Disarankan: gunakan `openclaw setup` untuk membuat `~/.openclaw/openclaw.json` jika belum ada dan menginisialisasi file workspace.

Tata letak workspace lengkap + panduan pencadangan: [Workspace agen](/id/concepts/agent-workspace)

Jika `agents.defaults.sandbox` diaktifkan, sesi non-utama dapat menimpanya dengan
workspace per sesi di bawah `agents.defaults.sandbox.workspaceRoot` (lihat
[Konfigurasi Gateway](/id/gateway/configuration)).

## File bootstrap (diinjeksi)

Di dalam `agents.defaults.workspace`, OpenClaw mengharapkan file yang dapat diedit pengguna berikut:

- `AGENTS.md` - instruksi operasi + "memori"
- `SOUL.md` - persona, batasan, nada
- `TOOLS.md` - catatan alat yang dikelola pengguna (mis. `imsg`, `sag`, konvensi)
- `BOOTSTRAP.md` - ritual sekali jalan pertama (dihapus setelah selesai)
- `IDENTITY.md` - nama/vibe/emoji agen
- `USER.md` - profil pengguna + sapaan pilihan

Pada giliran pertama sesi baru, OpenClaw menginjeksi isi file-file ini ke Project Context prompt sistem.

File kosong dilewati. File besar dipangkas dan dipotong dengan penanda agar prompt tetap ramping (baca file untuk konten lengkap).

Jika sebuah file tidak ada, OpenClaw menginjeksi satu baris penanda "file hilang" (dan `openclaw setup` akan membuat templat default yang aman).

`BOOTSTRAP.md` hanya dibuat untuk **workspace yang benar-benar baru** (tidak ada file bootstrap lain). Selama masih tertunda, OpenClaw menyimpannya di Project Context dan menambahkan panduan bootstrap prompt sistem untuk ritual awal alih-alih menyalinnya ke pesan pengguna. Jika Anda menghapusnya setelah menyelesaikan ritual, file tersebut tidak seharusnya dibuat ulang saat restart berikutnya.

Setelah sebuah workspace pernah diamati, OpenClaw juga menyimpan penanda atestasi state-dir untuk jalur workspace tersebut. Jika workspace yang baru saja diatestasi menghilang atau dihapus, startup menolak untuk secara diam-diam menanam ulang `BOOTSTRAP.md`; pulihkan workspace atau gunakan reset onboard penuh agar workspace dan penanda dibersihkan bersama-sama.

Untuk menonaktifkan pembuatan file bootstrap sepenuhnya (untuk workspace yang sudah diisi sebelumnya), tetapkan:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Alat bawaan

Alat inti (read/exec/edit/write dan alat sistem terkait) selalu tersedia,
bergantung pada kebijakan alat. `apply_patch` bersifat opsional dan dikendalikan oleh
`tools.exec.applyPatch`. `TOOLS.md` **tidak** mengontrol alat mana yang ada; itu adalah
panduan tentang bagaimana _Anda_ ingin alat tersebut digunakan.

## Skills

OpenClaw memuat Skills dari lokasi berikut (prioritas tertinggi terlebih dahulu):

- Workspace: `<workspace>/skills`
- Skills agen proyek: `<workspace>/.agents/skills`
- Skills agen pribadi: `~/.agents/skills`
- Terkelola/lokal: `~/.openclaw/skills`
- Bundled (dikirim bersama instalasi)
- Folder skill tambahan: `skills.load.extraDirs`

Root skill dapat berisi folder berkelompok seperti
`<workspace>/skills/personal/foo/SKILL.md`; skill tetap diekspos dengan nama
frontmatter datarnya, misalnya `foo`.

Skills dapat dibatasi oleh config/env (lihat `skills` di [Konfigurasi Gateway](/id/gateway/configuration)).

## Batas runtime

Runtime agen tertanam dimiliki oleh OpenClaw: penemuan model, perangkaian alat,
perakitan prompt, manajemen sesi, dan pengiriman channel berbagi satu permukaan
runtime terintegrasi.

## Sesi

Transkrip sesi disimpan sebagai JSONL di:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

ID sesi stabil dan dipilih oleh OpenClaw.
Folder sesi lama dari alat lain tidak dibaca.

## Mengarahkan saat streaming

Prompt masuk yang tiba di tengah run diarahkan ke run saat ini secara default.
Pengarahan dikirim **setelah giliran assistant saat ini selesai mengeksekusi
tool call-nya**, sebelum panggilan LLM berikutnya, dan tidak lagi melewati tool call yang tersisa
dari pesan assistant saat ini.

`/queue steer` adalah perilaku active-run default. `/queue followup` dan
`/queue collect` membuat pesan menunggu giliran berikutnya alih-alih diarahkan.
`/queue interrupt` membatalkan run aktif sebagai gantinya. Lihat [Antrean](/id/concepts/queue)
dan [Antrean pengarahan](/id/concepts/queue-steering) untuk perilaku antrean dan batas.

Streaming blok mengirim blok assistant yang selesai segera setelah selesai; fitur ini
**nonaktif secara default** (`agents.defaults.blockStreamingDefault: "off"`).
Atur batas melalui `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; default ke text_end).
Kontrol pemotongan blok lunak dengan `agents.defaults.blockStreamingChunk` (default ke
800-1200 karakter; lebih memilih jeda paragraf, lalu baris baru; kalimat terakhir).
Gabungkan chunk yang di-stream dengan `agents.defaults.blockStreamingCoalesce` untuk mengurangi
spam satu baris (penggabungan berbasis idle sebelum pengiriman). Channel non-Telegram memerlukan
`*.blockStreaming: true` eksplisit untuk mengaktifkan balasan blok.
Ringkasan alat verbose dipancarkan saat alat dimulai (tanpa debounce); Control UI
men-stream output alat melalui event agen jika tersedia.
Detail lebih lanjut: [Streaming + pemotongan](/id/concepts/streaming).

## Ref model

Ref model dalam config (misalnya `agents.defaults.model` dan `agents.defaults.models`) di-parse dengan memisahkan pada `/` **pertama**.

- Gunakan `provider/model` saat mengonfigurasi model.
- Jika ID model itu sendiri berisi `/` (gaya OpenRouter), sertakan prefiks provider (contoh: `openrouter/moonshotai/kimi-k2`).
- Jika Anda menghilangkan provider, OpenClaw mencoba alias terlebih dahulu, lalu kecocokan
  configured-provider unik untuk id model persis tersebut, dan baru setelah itu fallback
  ke provider default yang dikonfigurasi. Jika provider tersebut tidak lagi mengekspos
  model default yang dikonfigurasi, OpenClaw fallback ke provider/model pertama yang dikonfigurasi
  alih-alih menampilkan default provider lama yang telah dihapus.

## Konfigurasi (minimal)

Minimal, tetapkan:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (sangat disarankan)

---

_Berikutnya: [Obrolan Grup](/id/channels/group-messages)_ 🦞

## Terkait

- [Workspace agen](/id/concepts/agent-workspace)
- [Routing multi-agen](/id/concepts/multi-agent)
- [Manajemen sesi](/id/concepts/session)
