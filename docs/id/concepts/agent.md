---
read_when:
    - Mengubah runtime agen, bootstrap ruang kerja, atau perilaku sesi
summary: Runtime agen, kontrak ruang kerja, dan bootstrap sesi
title: Runtime agen
x-i18n:
    generated_at: "2026-07-19T04:52:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 731de7000f261180483570f6eb597f9284ab774ebdeffd5f23019a9431e8750e
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw menyediakan satu **runtime agen tertanam**: loop agen bawaan, pengkabelan
alat, dan penyusunan prompt, yang berbeda dari mendelegasikan giliran ke proses
harness eksternal. Setiap agen yang dikonfigurasi (lihat [Perutean multi-agen](/id/concepts/multi-agent)
untuk menjalankan beberapa agen) memiliki ruang kerja, file bootstrap, dan penyimpanan
sesinya sendiri. Halaman ini membahas kontrak runtime tersebut: apa yang harus
terdapat dalam ruang kerja, file mana yang diinjeksi, dan bagaimana sesi melakukan bootstrap terhadapnya.

## Ruang kerja (wajib)

Setiap agen menggunakan satu direktori ruang kerja (`agents.defaults.workspace`, atau
`agents.list[].workspace` per agen) sebagai **satu-satunya** direktori kerja (`cwd`)
untuk alat dan konteks.

Disarankan: gunakan `openclaw setup` untuk membuat `~/.openclaw/openclaw.json` jika belum ada dan menginisialisasi file ruang kerja.

Tata letak lengkap ruang kerja + panduan pencadangan: [Ruang kerja agen](/id/concepts/agent-workspace)

Jika `agents.defaults.sandbox` diaktifkan, sesi non-utama dapat menggantinya dengan
ruang kerja per sesi di bawah `agents.defaults.sandbox.workspaceRoot` (lihat
[Konfigurasi Gateway](/id/gateway/configuration)).

## File bootstrap (diinjeksi)

Di dalam ruang kerja, OpenClaw mengharapkan file yang dapat diedit pengguna berikut:

| File           | Tujuan                                               |
| -------------- | ---------------------------------------------------- |
| `AGENTS.md`    | Instruksi pengoperasian + "memori"                   |
| `SOUL.md`      | Persona, batasan, nada                                |
| `TOOLS.md`     | Catatan dan konvensi alat yang dikelola pengguna     |
| `IDENTITY.md`  | Nama/nuansa/emoji agen                                |
| `USER.md`      | Profil pengguna + sapaan yang diinginkan             |
| `HEARTBEAT.md` | Instruksi khusus Heartbeat                            |
| `BOOTSTRAP.md` | Ritual sekali saat pertama dijalankan (dihapus setelah selesai) |
| `MEMORY.md`    | File memori jangka panjang akar, jika tersedia       |

Pada giliran pertama sesi baru, OpenClaw menginjeksi isi file-file ini ke dalam Konteks Proyek pada prompt sistem. `MEMORY.md` hanya diinjeksi jika tersedia di akar ruang kerja.

File kosong dilewati. File besar dipangkas dan dipotong dengan penanda agar prompt tetap ringkas (baca file untuk melihat isi lengkap). File yang tidak ditemukan (selain `MEMORY.md`) akan menginjeksi satu baris penanda "file tidak ditemukan"; `openclaw setup` membuat templat bawaan yang aman untuk file tersebut.

`BOOTSTRAP.md` hanya dibuat untuk **ruang kerja yang benar-benar baru** (tidak ada file bootstrap lain). Selama masih tertunda, OpenClaw mempertahankannya dalam Konteks Proyek dan menambahkan panduan bootstrap pada prompt sistem untuk ritual awal, alih-alih menyalinnya ke pesan pengguna. Jika Anda menghapusnya setelah menyelesaikan ritual, file tersebut tidak dibuat ulang pada pemulaian ulang berikutnya.

Setelah ruang kerja diamati, OpenClaw menyimpan status penyiapan dan
atestasinya dalam basis data SQLite bersama di
`~/.openclaw/state/openclaw.sqlite`. Jika ruang kerja yang baru-baru ini diatestasi
menghilang atau dihapus seluruh isinya, proses startup menolak mengisi ulang `BOOTSTRAP.md` secara diam-diam;
pulihkan ruang kerja atau gunakan pengaturan ulang onboarding penuh agar ruang kerja dan
status basis datanya dihapus bersama-sama.

Rilis lama menggunakan JSON ruang kerja dan file sidecar `.attested`. Runtime tidak
membaca file-file tersebut. Jalankan `openclaw doctor --fix` untuk memvalidasinya, mengimpor
statusnya ke SQLite, dan menghapus setiap sumber setelah baris yang diimpor diverifikasi.

Untuk sepenuhnya menonaktifkan pembuatan file bootstrap (untuk ruang kerja yang telah diisi sebelumnya), tetapkan:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Alat bawaan

Alat inti (read/exec/edit/write dan alat sistem terkait) selalu tersedia,
sesuai kebijakan alat. `apply_patch` aktif secara bawaan untuk model OpenAI dan dibatasi oleh
`tools.exec.applyPatch` (`enabled`, `workspaceOnly`, `allowModels`). `TOOLS.md` **tidak** mengontrol alat mana yang tersedia; itu adalah
panduan tentang cara _Anda_ ingin alat tersebut digunakan.

## Skills

OpenClaw memuat skill dari lokasi berikut (prioritas tertinggi terlebih dahulu):

- Ruang kerja: `<workspace>/skills`
- Skill agen proyek: `<workspace>/.agents/skills`
- Skill agen pribadi: `~/.agents/skills`
- Terkelola/lokal: `~/.openclaw/skills`
- Dibundel (disertakan bersama instalasi)
- Folder skill tambahan: `skills.load.extraDirs`

Akar skill dapat berisi folder yang dikelompokkan seperti
`<workspace>/skills/personal/foo/SKILL.md`; skill tersebut tetap diekspos melalui nama frontmatter
datarnya, misalnya `foo`.

Skill dapat dibatasi oleh konfigurasi/variabel lingkungan (lihat `skills` dalam [Konfigurasi Gateway](/id/gateway/configuration)).

## Batas runtime

Runtime agen tertanam dimiliki oleh OpenClaw: penemuan model, pengkabelan alat,
penyusunan prompt, pengelolaan sesi, dan pengiriman saluran berbagi satu
permukaan runtime yang terintegrasi.

## Sesi

Baris sesi disimpan dalam basis data SQLite per agen:

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

File JSONL transkrip masih dapat berada di bawah
`~/.openclaw/agents/<agentId>/sessions/` sebagai masukan migrasi lama, arsip yang dihapus atau
diatur ulang, impor, ekspor, dan artefak dukungan. Riwayat agen aktif
disimpan di SQLite bersama baris sesi. ID sesi bersifat stabil dan dipilih oleh
OpenClaw. OpenClaw tidak membaca folder sesi dari alat lain.

## Pengarahan saat streaming

Prompt masuk yang tiba di tengah proses diarahkan ke proses saat ini secara bawaan.
Pengarahan dikirimkan **setelah giliran asisten saat ini selesai menjalankan
panggilan alatnya**, sebelum panggilan LLM berikutnya, dan tidak lagi melewati panggilan alat
yang tersisa dari pesan asisten saat ini.

`/queue steer` adalah perilaku bawaan untuk proses aktif. `/queue followup` dan
`/queue collect` membuat pesan menunggu giliran berikutnya alih-alih mengarahkan.
`/queue interrupt` membatalkan proses aktif. Lihat [Antrean](/id/concepts/queue)
dan [Antrean pengarahan](/id/concepts/queue-steering) untuk perilaku antrean dan batas.

Streaming blok mengirim blok asisten yang telah selesai segera setelah blok tersebut selesai; fitur ini
**nonaktif secara bawaan** (`agents.defaults.blockStreamingDefault: "off"`).
Sesuaikan batas melalui `agents.defaults.blockStreamingBreak` (`text_end` dibandingkan dengan `message_end`; nilai bawaannya `text_end`).
Kontrol pemotongan blok lunak dengan `agents.defaults.blockStreamingChunk` (nilai bawaan
800-1200 karakter; mengutamakan pemisah paragraf, kemudian baris baru; kalimat sebagai pilihan terakhir).
Gabungkan potongan yang di-streaming dengan `agents.defaults.blockStreamingCoalesce` untuk mengurangi
spam satu baris (penggabungan berbasis waktu diam sebelum dikirim). Saluran selain Telegram memerlukan
`*.streaming.block.enabled: true` eksplisit untuk mengaktifkan balasan blok (QQ Bot
sebaliknya melakukan streaming balasan blok kecuali `channels.qqbot.streaming.mode` bernilai `"off"`).
Ringkasan alat mendetail dikeluarkan saat alat dimulai (tanpa debounce); UI Kontrol
melakukan streaming keluaran alat melalui peristiwa agen jika tersedia.
Detail selengkapnya: [Streaming + pemotongan](/id/concepts/streaming).

## Referensi model

Referensi model dalam konfigurasi (misalnya `agents.defaults.model` dan `agents.defaults.models`) diurai dengan memisahkannya pada `/` **pertama**.

- Gunakan `provider/model` saat mengonfigurasi model.
- Jika ID model itu sendiri berisi `/` (gaya OpenRouter), sertakan prefiks penyedia (contoh: `openrouter/moonshotai/kimi-k2`).
- Jika penyedia tidak dicantumkan, OpenClaw mencoba alias terlebih dahulu, kemudian kecocokan
  penyedia yang dikonfigurasi secara unik untuk ID model persis tersebut, dan baru setelah itu kembali
  ke penyedia bawaan yang dikonfigurasi. Jika penyedia tersebut tidak lagi menyediakan
  model bawaan yang dikonfigurasi, OpenClaw kembali ke penyedia/model pertama yang
  dikonfigurasi alih-alih menampilkan nilai bawaan penyedia yang telah dihapus dan sudah usang.

## Konfigurasi (minimal)

Setidaknya, tetapkan:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (sangat disarankan)

## Terkait

- [Ruang kerja agen](/id/concepts/agent-workspace)
- [Perutean multi-agen](/id/concepts/multi-agent)
- [Pengelolaan sesi](/id/concepts/session)
- [Obrolan grup](/id/channels/group-messages)
