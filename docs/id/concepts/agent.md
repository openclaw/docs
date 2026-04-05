---
read_when:
    - Mengubah runtime agen, bootstrap workspace, atau perilaku sesi
summary: Runtime agen, kontrak workspace, dan bootstrap sesi
title: Runtime Agen
x-i18n:
    generated_at: "2026-04-05T13:50:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2ff39f4114f009e5b1f86894ea4bb29b1c9512563b70d063f09ca7cde5e8948
    source_path: concepts/agent.md
    workflow: 15
---

# Runtime Agen

OpenClaw menjalankan satu runtime agen tertanam.

## Workspace (wajib)

OpenClaw menggunakan satu direktori workspace agen (`agents.defaults.workspace`) sebagai **satu-satunya** direktori kerja (`cwd`) agen untuk alat dan konteks.

Direkomendasikan: gunakan `openclaw setup` untuk membuat `~/.openclaw/openclaw.json` jika belum ada dan menginisialisasi file workspace.

Tata letak workspace lengkap + panduan pencadangan: [Workspace agen](/concepts/agent-workspace)

Jika `agents.defaults.sandbox` diaktifkan, sesi non-utama dapat mengganti ini dengan
workspace per sesi di bawah `agents.defaults.sandbox.workspaceRoot` (lihat
[Konfigurasi gateway](/gateway/configuration)).

## File bootstrap (disuntikkan)

Di dalam `agents.defaults.workspace`, OpenClaw mengharapkan file yang dapat diedit pengguna berikut:

- `AGENTS.md` — instruksi operasi + “memori”
- `SOUL.md` — persona, batasan, nada
- `TOOLS.md` — catatan alat yang dikelola pengguna (misalnya `imsg`, `sag`, konvensi)
- `BOOTSTRAP.md` — ritual satu kali saat pertama dijalankan (dihapus setelah selesai)
- `IDENTITY.md` — nama/vibe/emoji agen
- `USER.md` — profil pengguna + sapaan yang disukai

Pada giliran pertama sesi baru, OpenClaw menyuntikkan isi file-file ini langsung ke konteks agen.

File kosong dilewati. File besar dipangkas dan dipotong dengan penanda agar prompt tetap ringkas (baca file untuk konten lengkap).

Jika sebuah file tidak ada, OpenClaw menyuntikkan satu baris penanda “file tidak ada” (dan `openclaw setup` akan membuat templat default yang aman).

`BOOTSTRAP.md` hanya dibuat untuk **workspace yang benar-benar baru** (tidak ada file bootstrap lain). Jika Anda menghapusnya setelah menyelesaikan ritual, file itu tidak akan dibuat ulang pada restart berikutnya.

Untuk menonaktifkan pembuatan file bootstrap sepenuhnya (untuk workspace yang sudah disiapkan sebelumnya), setel:

```json5
{ agent: { skipBootstrap: true } }
```

## Alat bawaan

Alat inti (read/exec/edit/write dan alat sistem terkait) selalu tersedia,
bergantung pada kebijakan alat. `apply_patch` bersifat opsional dan dikendalikan oleh
`tools.exec.applyPatch`. `TOOLS.md` **tidak** mengontrol alat mana yang ada; file itu adalah
panduan untuk bagaimana _Anda_ ingin alat tersebut digunakan.

## Skills

OpenClaw memuat Skills dari lokasi berikut (prioritas tertinggi lebih dulu):

- Workspace: `<workspace>/skills`
- Skills agen proyek: `<workspace>/.agents/skills`
- Skills agen pribadi: `~/.agents/skills`
- Terkelola/lokal: `~/.openclaw/skills`
- Bawaan (disertakan bersama instalasi)
- Folder skill tambahan: `skills.load.extraDirs`

Skills dapat dibatasi oleh konfigurasi/env (lihat `skills` di [Konfigurasi gateway](/gateway/configuration)).

## Batasan runtime

Runtime agen tertanam dibangun di atas inti agen Pi (model, alat, dan
pipeline prompt). Manajemen sesi, penemuan, pengkabelan alat, dan pengiriman
channel adalah lapisan milik OpenClaw di atas inti tersebut.

## Sesi

Transkrip sesi disimpan sebagai JSONL di:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

ID sesi stabil dan dipilih oleh OpenClaw.
Folder sesi lama dari alat lain tidak dibaca.

## Pengarahan saat streaming

Ketika mode antrean adalah `steer`, pesan masuk disuntikkan ke proses yang sedang berjalan.
Pengarahan yang diantrikan dikirimkan **setelah giliran asisten saat ini selesai
mengeksekusi pemanggilan alatnya**, sebelum pemanggilan LLM berikutnya. Pengarahan tidak lagi melewati
sisa pemanggilan alat dari pesan asisten saat ini; melainkan menyuntikkan pesan
yang diantrikan pada batas model berikutnya.

Ketika mode antrean adalah `followup` atau `collect`, pesan masuk ditahan hingga
giliran saat ini berakhir, lalu giliran agen baru dimulai dengan payload yang diantrikan. Lihat
[Antrean](/concepts/queue) untuk perilaku mode + debounce/cap.

Pengiriman streaming blok mengirim blok asisten yang sudah selesai segera setelah selesai; fitur ini
**nonaktif secara default** (`agents.defaults.blockStreamingDefault: "off"`).
Atur batasnya melalui `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; defaultnya `text_end`).
Kontrol pemotongan lunak blok dengan `agents.defaults.blockStreamingChunk` (defaultnya
800–1200 karakter; mengutamakan pemisah paragraf, lalu baris baru; kalimat terakhir).
Gabungkan potongan yang di-streaming dengan `agents.defaults.blockStreamingCoalesce` untuk mengurangi
spam satu baris (penggabungan berbasis jeda sebelum pengiriman). Channel non-Telegram memerlukan
`*.blockStreaming: true` eksplisit untuk mengaktifkan balasan blok.
Ringkasan alat verbose dikirim saat alat dimulai (tanpa debounce); UI Control
mengalirkan output alat melalui event agen jika tersedia.
Detail lebih lanjut: [Streaming + chunking](/concepts/streaming).

## Referensi model

Referensi model dalam konfigurasi (misalnya `agents.defaults.model` dan `agents.defaults.models`) diurai dengan memisahkan pada **`/` pertama**.

- Gunakan `provider/model` saat mengonfigurasi model.
- Jika ID model itu sendiri berisi `/` (gaya OpenRouter), sertakan prefiks provider (contoh: `openrouter/moonshotai/kimi-k2`).
- Jika Anda menghilangkan provider, OpenClaw terlebih dahulu mencoba alias, lalu
  kecocokan provider yang dikonfigurasi dan unik untuk id model yang persis sama, dan baru setelah itu kembali ke
  provider default yang dikonfigurasi. Jika provider itu tidak lagi mengekspos model default yang
  dikonfigurasi, OpenClaw akan kembali ke provider/model pertama yang dikonfigurasi
  alih-alih menampilkan default provider lama yang sudah dihapus.

## Konfigurasi (minimal)

Minimal, setel:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (sangat direkomendasikan)

---

_Berikutnya: [Obrolan Grup](/id/channels/group-messages)_ 🦞
