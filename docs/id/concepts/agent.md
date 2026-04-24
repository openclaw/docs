---
read_when:
    - Mengubah runtime agen, bootstrap workspace, atau perilaku sesi
summary: Runtime agen, kontrak workspace, dan bootstrap sesi
title: Runtime agen
x-i18n:
    generated_at: "2026-04-24T09:03:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07fe0ca3c6bc306f95ac024b97b4e6e188c2d30786b936b8bd66a5f3ec012d4e
    source_path: concepts/agent.md
    workflow: 15
---

OpenClaw menjalankan **satu runtime agen tersemat** — satu proses agen per
Gateway, dengan workspace, file bootstrap, dan session store miliknya sendiri. Halaman ini
membahas kontrak runtime tersebut: apa yang harus ada di workspace, file mana yang
disuntikkan, dan bagaimana sesi melakukan bootstrap terhadapnya.

## Workspace (wajib)

OpenClaw menggunakan satu direktori workspace agen (`agents.defaults.workspace`) sebagai **satu-satunya** direktori kerja (`cwd`) agen untuk tool dan konteks.

Disarankan: gunakan `openclaw setup` untuk membuat `~/.openclaw/openclaw.json` jika belum ada dan menginisialisasi file workspace.

Panduan lengkap tata letak workspace + cadangan: [Workspace agen](/id/concepts/agent-workspace)

Jika `agents.defaults.sandbox` diaktifkan, sesi non-main dapat menimpa ini dengan
workspace per sesi di bawah `agents.defaults.sandbox.workspaceRoot` (lihat
[Konfigurasi Gateway](/id/gateway/configuration)).

## File bootstrap (disuntikkan)

Di dalam `agents.defaults.workspace`, OpenClaw mengharapkan file yang dapat diedit pengguna berikut:

- `AGENTS.md` — instruksi operasional + “memori”
- `SOUL.md` — persona, batasan, nada
- `TOOLS.md` — catatan tool yang dipelihara pengguna (mis. `imsg`, `sag`, konvensi)
- `BOOTSTRAP.md` — ritual sekali jalan saat pertama kali dijalankan (dihapus setelah selesai)
- `IDENTITY.md` — nama/vibe/emoji agen
- `USER.md` — profil pengguna + sapaan pilihan

Pada giliran pertama sesi baru, OpenClaw menyuntikkan isi file-file ini langsung ke konteks agen.

File kosong dilewati. File besar dipangkas dan dipotong dengan penanda agar prompt tetap ringkas (baca file untuk konten lengkap).

Jika sebuah file hilang, OpenClaw menyuntikkan satu baris penanda “file hilang” (dan `openclaw setup` akan membuat template default yang aman).

`BOOTSTRAP.md` hanya dibuat untuk **workspace yang benar-benar baru** (tidak ada file bootstrap lain). Jika Anda menghapusnya setelah menyelesaikan ritual, file itu tidak seharusnya dibuat ulang pada restart berikutnya.

Untuk menonaktifkan pembuatan file bootstrap sepenuhnya (untuk workspace yang sudah dipraisi), setel:

```json5
{ agent: { skipBootstrap: true } }
```

## Tool bawaan

Tool inti (read/exec/edit/write dan tool sistem terkait) selalu tersedia,
tergantung kebijakan tool. `apply_patch` bersifat opsional dan digate oleh
`tools.exec.applyPatch`. `TOOLS.md` **tidak** mengontrol tool mana yang ada; file itu
adalah panduan tentang bagaimana _Anda_ ingin tool tersebut digunakan.

## Skills

OpenClaw memuat Skills dari lokasi berikut (prioritas tertinggi terlebih dahulu):

- Workspace: `<workspace>/skills`
- Skills agen proyek: `<workspace>/.agents/skills`
- Skills agen pribadi: `~/.agents/skills`
- Terkelola/lokal: `~/.openclaw/skills`
- Bawaan (dikirim bersama instalasi)
- Folder skill tambahan: `skills.load.extraDirs`

Skills dapat digate oleh config/env (lihat `skills` di [Konfigurasi Gateway](/id/gateway/configuration)).

## Batas runtime

Runtime agen tersemat dibangun di atas inti agen Pi (model, tool, dan
pipeline prompt). Manajemen sesi, penemuan, wiring tool, dan pengiriman channel
adalah lapisan milik OpenClaw di atas inti tersebut.

## Sesi

Transkrip sesi disimpan sebagai JSONL di:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

ID sesi stabil dan dipilih oleh OpenClaw.
Folder sesi lama dari tool lain tidak dibaca.

## Steering saat streaming

Saat mode antrean adalah `steer`, pesan masuk disuntikkan ke eksekusi saat ini.
Steering yang diantrikan dikirim **setelah giliran asisten saat ini selesai
mengeksekusi panggilan tool-nya**, sebelum panggilan LLM berikutnya. Steering tidak lagi melewati
sisa panggilan tool dari pesan asisten saat ini; sebaliknya, steering menyuntikkan pesan yang diantrikan
pada batas model berikutnya.

Saat mode antrean adalah `followup` atau `collect`, pesan masuk ditahan sampai
giliran saat ini berakhir, lalu giliran agen baru dimulai dengan payload yang diantrikan. Lihat
[Queue](/id/concepts/queue) untuk perilaku mode + debounce/cap.

Streaming blok mengirim blok asisten yang telah selesai segera setelah selesai; ini
**nonaktif secara default** (`agents.defaults.blockStreamingDefault: "off"`).
Atur batasnya melalui `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; default ke text_end).
Kontrol pemotongan blok lunak dengan `agents.defaults.blockStreamingChunk` (default ke
800–1200 karakter; mengutamakan jeda paragraf, lalu baris baru; kalimat terakhir).
Gabungkan chunk yang di-stream dengan `agents.defaults.blockStreamingCoalesce` untuk mengurangi
spam satu baris (penggabungan berbasis idle sebelum pengiriman). Channel selain
Telegram memerlukan `*.blockStreaming: true` eksplisit untuk mengaktifkan balasan blok.
Ringkasan tool verbose dikeluarkan saat tool dimulai (tanpa debounce); UI Control
men-stream output tool melalui event agen bila tersedia.
Detail lebih lanjut: [Streaming + chunking](/id/concepts/streaming).

## Ref model

Ref model dalam konfigurasi (misalnya `agents.defaults.model` dan `agents.defaults.models`) diparse dengan memisahkan pada **`/` pertama**.

- Gunakan `provider/model` saat mengonfigurasi model.
- Jika ID model itu sendiri mengandung `/` (gaya OpenRouter), sertakan prefiks provider (contoh: `openrouter/moonshotai/kimi-k2`).
- Jika Anda menghilangkan provider, OpenClaw mencoba alias terlebih dahulu, lalu
  kecocokan provider terkonfigurasi yang unik untuk id model yang tepat, dan baru
  setelah itu kembali ke provider default yang dikonfigurasi. Jika provider tersebut tidak lagi mengekspos
  model default yang dikonfigurasi, OpenClaw akan kembali ke model/provider terkonfigurasi pertama
  alih-alih menampilkan default provider lama yang sudah dihapus.

## Konfigurasi (minimal)

Minimal, setel:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (sangat disarankan)

---

_Berikutnya: [Obrolan Grup](/id/channels/group-messages)_ 🦞

## Terkait

- [Workspace agen](/id/concepts/agent-workspace)
- [Routing multi-agen](/id/concepts/multi-agent)
- [Manajemen sesi](/id/concepts/session)
