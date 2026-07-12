---
read_when:
    - Menyesuaikan penguraian atau nilai default direktif thinking, fast-mode, atau verbose
summary: Sintaks direktif untuk /think, /fast, /verbose, /trace, dan visibilitas penalaran
title: Tingkat berpikir
x-i18n:
    generated_at: "2026-07-12T14:48:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75170dd48f83dcb3ebb70eea2b37160208618d0aae23253c82fe88ce3afbc0e2
    source_path: tools/thinking.md
    workflow: 16
---

## Fungsinya

- Direktif sebaris dalam isi pesan masuk apa pun: `/t <level>`, `/think:<level>`, atau `/thinking <level>`.
- Tingkat (alias): `off | minimal | low | medium | high | xhigh | adaptive | max | ultra`, kurang lebih mencerminkan jenjang kata ajaib klasik Anthropic "think" < "think hard" < "think harder" < "ultrathink":
  - minimal ~ "berpikir"
  - low ~ "berpikir keras"
  - medium ~ "berpikir lebih keras"
  - high ~ "ultrathink" (anggaran maksimum)
  - xhigh ~ "ultrathink+" (model GPT-5.2+ dan Codex, serta tingkat upaya Anthropic Claude Opus 4.7+)
  - adaptive → pemikiran adaptif yang dikelola penyedia (didukung untuk Claude 4.6 pada Anthropic/Bedrock, Anthropic Claude Opus 4.7+, dan pemikiran dinamis Google Gemini)
  - max → penalaran maksimum penyedia (Anthropic Claude Opus 4.7+; Ollama memetakan ini ke tingkat upaya `think` native tertingginya)
  - ultra → penalaran maksimum penyedia ditambah orkestrasi subagen proaktif saat model/runtime yang dipilih mendukungnya
  - `x-high`, `x_high`, `extra-high`, `extra high`, dan `extra_high` dipetakan ke `xhigh`.
  - `highest` dipetakan ke `high`.
- Catatan penyedia:
  - Menu dan pemilih pemikiran digerakkan oleh profil penyedia. Plugin penyedia mendeklarasikan kumpulan tingkat yang tepat untuk model yang dipilih, termasuk label seperti `on` biner.
  - `adaptive`, `xhigh`, `max`, dan `ultra` hanya ditampilkan untuk profil penyedia/model/runtime yang mendukungnya. Direktif bertipe untuk tingkat yang tidak didukung akan ditolak dengan opsi yang valid untuk model tersebut.
  - Tingkat tersimpan yang sudah ada tetapi tidak didukung dipetakan ulang berdasarkan peringkat profil penyedia. `adaptive` kembali ke `medium` pada model nonadaptif, sedangkan `xhigh` dan `max` kembali ke tingkat non-`off` terbesar yang didukung untuk model yang dipilih.
  - Model Anthropic Claude 4.6 menggunakan `adaptive` secara default jika tidak ada tingkat pemikiran eksplisit yang ditetapkan.
  - Anthropic Claude Opus 4.8 dan Opus 4.7 mempertahankan pemikiran dalam keadaan nonaktif kecuali Anda menetapkan tingkat pemikiran secara eksplisit. Nilai default upaya milik penyedia untuk Opus 4.8 adalah `high` setelah pemikiran adaptif diaktifkan.
  - Anthropic Claude Opus 4.7+ memetakan `/think xhigh` ke pemikiran adaptif ditambah `output_config.effort: "xhigh"`, karena `/think` adalah direktif pemikiran dan `xhigh` adalah pengaturan upaya Opus.
  - Anthropic Claude Opus 4.7+ juga menyediakan `/think max`; ini dipetakan ke jalur upaya maksimum milik penyedia yang sama.
  - Model DeepSeek V4 langsung menyediakan `/think xhigh|max`; keduanya dipetakan ke `reasoning_effort: "max"` DeepSeek, sedangkan tingkat non-`off` yang lebih rendah dipetakan ke `high`.
  - Model DeepSeek V4 yang dirutekan melalui OpenRouter menyediakan `/think xhigh` dan mengirim nilai `reasoning.effort` yang didukung OpenRouter, bukan `reasoning_effort` tingkat teratas native DeepSeek. Tingkat non-`off` yang lebih rendah dipetakan ke `high`, dan penggantian `max` yang tersimpan kembali ke `xhigh`.
  - Model Ollama yang mampu berpikir menyediakan `/think low|medium|high|max`; `max` dipetakan ke `think: "high"` native karena API native Ollama menerima string upaya `low`, `medium`, dan `high`.
  - Model OpenAI GPT memetakan `/think` melalui dukungan upaya Responses API khusus model. `/think off` mengirim `reasoning.effort: "none"` hanya saat model target mendukungnya; jika tidak, OpenClaw menghilangkan payload penalaran yang dinonaktifkan alih-alih mengirim nilai yang tidak didukung.
  - GPT-5.6 Sol dan Terra menyediakan `/think ultra` native melalui runtime Codex. GPT-5.6 Luna menyediakan tingkat hingga `max` karena katalog Codex-nya tidak menampilkan Ultra.
  - Runtime OpenClaw tertanam menyediakan `/think ultra` logis untuk GPT-5.6 Sol, Terra, dan Luna. Runtime ini mengirim upaya maksimum penyedia dan menambahkan panduan orkestrasi subagen proaktif dengan cakupan proses.
  - Entri katalog kustom yang kompatibel dengan OpenAI dapat mengaktifkan `/think xhigh` dengan mengatur `models.providers.<provider>.models[].compat.supportedReasoningEfforts` agar menyertakan `"xhigh"`. Ini menggunakan metadata kompatibilitas yang sama dengan yang memetakan payload upaya penalaran OpenAI keluar, sehingga menu, validasi sesi, CLI agen, dan `llm-task` selaras dengan perilaku transportasi.
  - Referensi OpenRouter Hunter Alpha terkonfigurasi yang sudah usang melewati injeksi penalaran proksi karena rute yang telah dihentikan tersebut dapat mengembalikan teks jawaban akhir melalui bidang penalaran.
  - Google Gemini memetakan `/think adaptive` ke pemikiran dinamis milik penyedia Gemini. Permintaan Gemini 3 menghilangkan `thinkingLevel` tetap, sedangkan permintaan Gemini 2.5 mengirim `thinkingBudget: -1`; tingkat tetap masih dipetakan ke `thinkingLevel` atau anggaran Gemini terdekat untuk keluarga model tersebut.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) pada jalur streaming yang kompatibel dengan Anthropic menggunakan `thinking: { type: "disabled" }` secara default, kecuali Anda menetapkan pemikiran secara eksplisit dalam parameter model atau parameter permintaan. Ini mencegah kebocoran delta `reasoning_content` dari format streaming Anthropic non-native milik M2.x. MiniMax-M3 (dan M3.x) dikecualikan: M3 memancarkan blok pemikiran Anthropic yang benar dan mengembalikan konten kosong saat pemikiran dinonaktifkan, sehingga OpenClaw mempertahankan M3 pada jalur pemikiran yang dihilangkan/adaptif milik penyedia.
  - Z.AI (`zai/*`) bersifat biner (`on`/`off`) untuk sebagian besar model GLM. GLM-5.2 adalah pengecualian: model ini menyediakan `/think off|low|high|max`, memetakan `low` dan `high` ke `reasoning_effort: "high"` Z.AI, serta memetakan `max` ke `reasoning_effort: "max"`.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) selalu berpikir. Profilnya hanya menyediakan `on`, dan OpenClaw menghilangkan bidang `thinking` keluar sebagaimana diwajibkan oleh Moonshot. Model `moonshot/*` lainnya memetakan `/think off` ke `thinking: { type: "disabled" }` dan setiap tingkat non-`off` ke `thinking: { type: "enabled" }`. Saat pemikiran diaktifkan, Moonshot hanya menerima `tool_choice` `auto|none`; OpenClaw menormalkan nilai yang tidak kompatibel menjadi `auto`.

## Urutan resolusi

1. Direktif sebaris pada pesan (hanya berlaku untuk pesan tersebut).
2. Penggantian sesi (ditetapkan dengan mengirim pesan yang hanya berisi direktif).
3. Nilai default per agen (`agents.list[].thinkingDefault` dalam konfigurasi).
4. Nilai default global (`agents.defaults.thinkingDefault` dalam konfigurasi).
5. Nilai cadangan: nilai default yang dideklarasikan penyedia jika tersedia; jika tidak, model yang mampu melakukan penalaran menggunakan `medium` atau tingkat non-`off` terdekat yang didukung model tersebut, dan model tanpa penalaran tetap `off`.

## Menetapkan nilai default sesi

- Kirim pesan yang **hanya** berisi direktif (spasi kosong diperbolehkan), misalnya `/think:medium` atau `/t high`.
- Pengaturan tersebut tetap berlaku untuk sesi saat ini (secara default per pengirim). Gunakan `/think default` untuk menghapus penggantian sesi dan mewarisi nilai default konfigurasi/penyedia; aliasnya meliputi `inherit`, `clear`, `reset`, dan `unpin`.
- `/think off` menyimpan penggantian nonaktif secara eksplisit. Ini menonaktifkan pemikiran hingga Anda mengubah atau menghapus penggantian sesi.
- Balasan konfirmasi dikirim (`Tingkat pemikiran ditetapkan ke tinggi.` / `Pemikiran dinonaktifkan.`). Jika tingkat tidak valid (misalnya `/thinking big`), perintah ditolak dengan petunjuk dan status sesi tidak berubah.
- Kirim `/think` (atau `/think:`) tanpa argumen untuk melihat tingkat pemikiran saat ini.

## Penerapan oleh agen

- **OpenClaw tertanam**: tingkat yang telah diresolusi diteruskan ke runtime agen OpenClaw dalam proses.
- **Backend CLI Claude**: tingkat nonaktif konkret diteruskan ke Claude Code sebagai `--effort` saat menggunakan `claude-cli`; `adaptive` menghapus tanda upaya terkonfigurasi dan mendelegasikan upaya efektif ke lingkungan, pengaturan, serta nilai default model Claude Code. Lihat [backend CLI](/id/gateway/cli-backends).

## Mode cepat (/fast)

- Tingkat: `auto|on|off|default`.
- Pesan yang hanya berisi direktif mengalihkan penggantian mode cepat sesi dan membalas `Mode cepat ditetapkan ke otomatis.`, `Mode cepat diaktifkan.`, atau `Mode cepat dinonaktifkan.`. Gunakan `/fast default` untuk menghapus penggantian sesi dan mewarisi nilai default terkonfigurasi; aliasnya meliputi `inherit`, `clear`, `reset`, dan `unpin`.
- Kirim `/fast` (atau `/fast status`) tanpa mode untuk melihat status mode cepat efektif saat ini.
- OpenClaw meresolusi mode cepat dalam urutan berikut:
  1. Penggantian `/fast auto|on|off` sebaris/hanya-direktif (`/fast default` menghapus lapisan ini)
  2. Penggantian sesi
  3. Nilai default per agen (`agents.list[].fastModeDefault`)
  4. Konfigurasi per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Nilai cadangan: `off`
- `auto` mempertahankan mode sesi/konfigurasi sebagai otomatis, tetapi meresolusi setiap panggilan model baru secara independen. Panggilan yang dimulai sebelum batas waktu otomatis mengaktifkan mode cepat; panggilan percobaan ulang, nilai cadangan, hasil alat, atau kelanjutan yang lebih lambat dimulai dengan mode cepat dinonaktifkan. Batas waktu default adalah 60 detik; atur `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` pada model aktif untuk mengubahnya.
- Untuk `openai/*`, mode cepat dipetakan ke pemrosesan prioritas OpenAI dengan mengirim `service_tier=priority` pada permintaan Responses yang didukung.
- Untuk model `openai/*` / `openai-codex/*` yang didukung Codex, mode cepat mengirim tanda `service_tier=priority` yang sama pada Responses Codex. Giliran app-server Codex native menerima tingkat tersebut hanya pada `turn/start` atau saat utas dimulai/dilanjutkan, sehingga `auto` tidak dapat mengubah tingkat satu giliran app-server yang sudah berjalan; pengaturan ini berlaku pada giliran model berikutnya yang dimulai OpenClaw.
- Untuk permintaan publik langsung `anthropic/*`, termasuk lalu lintas yang diautentikasi dengan OAuth dan dikirim ke `api.anthropic.com`, mode cepat dipetakan ke tingkat layanan Anthropic: `/fast on` menetapkan `service_tier=auto`, sedangkan `/fast off` menetapkan `service_tier=standard_only`.
- Untuk `minimax/*` pada jalur yang kompatibel dengan Anthropic, `/fast on` (atau `params.fastMode: true`) menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.
- Parameter model `serviceTier` / `service_tier` Anthropic eksplisit menggantikan nilai default mode cepat ketika keduanya ditetapkan. OpenClaw tetap melewati injeksi tingkat layanan Anthropic untuk URL dasar proksi non-Anthropic.
- `/status` menampilkan `Cepat` saat mode cepat diaktifkan dan `Cepat:otomatis` saat mode terkonfigurasi adalah otomatis.

## Direktif terperinci (/verbose atau /v)

- Tingkat: `on` (minimal) | `full` | `off` (default).
- Pesan yang hanya berisi direktif mengalihkan mode terperinci sesi dan membalas `Pencatatan terperinci diaktifkan.` / `Pencatatan terperinci dinonaktifkan.`; tingkat yang tidak valid mengembalikan petunjuk tanpa mengubah status.
- `/verbose off` menyimpan penggantian sesi eksplisit; hapus melalui UI Sesi dengan memilih `inherit`.
- Pengirim kanal eksternal yang diotorisasi dapat mempertahankan penggantian mode terperinci sesi. Klien gateway/webchat internal memerlukan `operator.admin` untuk mempertahankannya.
- Direktif sebaris hanya memengaruhi pesan tersebut; selain itu, nilai default sesi/global berlaku.
- Kirim `/verbose` (atau `/verbose:`) tanpa argumen untuk melihat tingkat keterperincian saat ini.
- Saat mode terperinci aktif, agen yang memancarkan hasil alat terstruktur mengirim kembali setiap panggilan alat sebagai pesan khusus metadata tersendiri, diawali dengan `<emoji> <tool-name>: <arg>` jika tersedia. Ringkasan alat ini dikirim segera setelah setiap alat dimulai (gelembung terpisah), bukan sebagai delta streaming.
- Ringkasan kegagalan alat tetap terlihat dalam mode normal, tetapi akhiran detail kesalahan mentah disembunyikan kecuali mode terperinci adalah `full`.
- Saat mode terperinci adalah `full`, keluaran alat juga diteruskan setelah selesai (gelembung terpisah, dipotong hingga panjang yang aman). Jika Anda mengalihkan `/verbose on|full|off` ketika proses sedang berjalan, gelembung alat berikutnya mengikuti pengaturan baru.
- `agents.defaults.toolProgressDetail` mengontrol bentuk ringkasan alat `/verbose` dan baris alat draf progres. Gunakan `"explain"` (default) untuk label manusia ringkas seperti `🛠️ Eksekusi: memeriksa sintaks JS`; gunakan `"raw"` jika Anda juga ingin perintah/detail mentah ditambahkan untuk awakutu. `agents.list[].toolProgressDetail` per agen menggantikan nilai default.
  - `explain`: `🛠️ Eksekusi: periksa sintaks JS untuk /tmp/app.js`
  - `raw`: `🛠️ Eksekusi: periksa sintaks JS untuk /tmp/app.js, node --check /tmp/app.js`

## Direktif pelacakan Plugin (/trace)

- Tingkat: `on` | `off` (default).
- Pesan yang hanya berisi direktif mengalihkan keluaran pelacakan Plugin sesi dan membalas `Pelacakan Plugin diaktifkan.` / `Pelacakan Plugin dinonaktifkan.`.
- Direktif sebaris hanya memengaruhi pesan tersebut; selain itu, nilai default sesi/global berlaku.
- Kirim `/trace` (atau `/trace:`) tanpa argumen untuk melihat tingkat pelacakan saat ini.
- `/trace` lebih sempit daripada `/verbose`: direktif ini hanya menampilkan baris pelacakan/awakutu milik Plugin, seperti ringkasan awakutu Active Memory.
- Baris pelacakan dapat muncul dalam `/status` dan sebagai pesan diagnostik tindak lanjut setelah balasan normal asisten.

## Visibilitas penalaran (/reasoning)

- Tingkat: `on|off|stream`.
- Pesan yang hanya berisi direktif mengatur apakah blok pemikiran ditampilkan dalam balasan.
- Jika diaktifkan, penalaran dikirim sebagai **pesan terpisah** yang diawali dengan `Thinking`.
- `stream`: mengalirkan penalaran saat balasan sedang dibuat jika saluran aktif mendukung pratinjau penalaran, lalu mengirim jawaban akhir tanpa penalaran.
- Alias: `/reason`.
- Kirim `/reasoning` (atau `/reasoning:`) tanpa argumen untuk melihat tingkat penalaran saat ini.
- Urutan resolusi: direktif sebaris, lalu penggantian sesi, lalu nilai default per agen (`agents.list[].reasoningDefault`), lalu nilai default global (`agents.defaults.reasoningDefault`), lalu nilai cadangan (`off`).

Tag penalaran model lokal yang salah format ditangani secara konservatif. Blok `<think>...</think>` yang tertutup tetap disembunyikan pada balasan normal, dan penalaran yang tidak tertutup setelah teks yang sudah terlihat juga disembunyikan. Jika balasan sepenuhnya dibungkus dalam satu tag pembuka yang tidak tertutup dan jika tidak ditangani akan dikirim sebagai teks kosong, OpenClaw menghapus tag pembuka yang salah format tersebut dan mengirim teks yang tersisa.

## Terkait

- Dokumentasi mode dengan hak istimewa yang ditingkatkan tersedia di [Mode dengan hak istimewa yang ditingkatkan](/id/tools/elevated).

## Heartbeat

- Isi pemeriksaan Heartbeat adalah perintah Heartbeat yang dikonfigurasi (default: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Direktif sebaris dalam pesan Heartbeat berlaku seperti biasa (tetapi hindari mengubah nilai default sesi melalui Heartbeat).
- Secara default, pengiriman Heartbeat hanya menyertakan muatan akhir. Untuk juga mengirim pesan `Thinking` terpisah (jika tersedia), atur `agents.defaults.heartbeat.includeReasoning: true` atau `agents.list[].heartbeat.includeReasoning: true` per agen.

## UI obrolan web

- Pemilih pemikiran obrolan web mencerminkan tingkat tersimpan sesi dari penyimpanan/konfigurasi sesi masuk saat halaman dimuat.
- Memilih tingkat lain langsung menulis penggantian sesi melalui `sessions.patch`; tindakan ini tidak menunggu pengiriman berikutnya dan bukan penggantian sekali pakai `thinkingOnce`.
- Pengiriman saat perubahan pada pemilih model, penalaran, atau kecepatan masih diterapkan akan menunggu setiap tambalan pemilih yang tertunda; jika perubahan gagal, pesan tetap tidak terkirim agar dapat ditinjau.
- Opsi pertama selalu merupakan pilihan untuk menghapus penggantian. Opsi ini menampilkan `Inherited: <resolved level>`, termasuk `Inherited: Off` saat pemikiran yang diwarisi dinonaktifkan.
- Pilihan pemilih eksplisit menggunakan label tingkat langsungnya sambil mempertahankan label penyedia jika tersedia (misalnya `Maximum` untuk opsi `max` yang diberi label oleh penyedia).
- Pemilih menggunakan `thinkingLevels` yang dikembalikan oleh baris/nilai default sesi Gateway, dengan `thinkingOptions` dipertahankan sebagai daftar label lama. UI peramban tidak menyimpan daftar regex penyedianya sendiri; Plugin memiliki kumpulan tingkat khusus model.
- `/think:<level>` tetap berfungsi dan memperbarui tingkat sesi tersimpan yang sama, sehingga direktif obrolan dan pemilih tetap sinkron.

## Profil penyedia

- Plugin penyedia dapat mengekspos `resolveThinkingProfile(ctx)` untuk menentukan tingkat yang didukung dan nilai default model.
- Plugin penyedia yang memproksi model Claude harus menggunakan kembali `resolveClaudeThinkingProfile(modelId)` dari `openclaw/plugin-sdk/provider-model-shared` agar katalog Anthropic langsung dan katalog proksi tetap selaras.
- Setiap tingkat profil memiliki `id` kanonis tersimpan (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max`, atau `ultra`) dan dapat menyertakan `label` tampilan. Penyedia biner menggunakan `{ id: "low", label: "on" }`.
- Hook profil menerima fakta katalog yang telah digabungkan jika tersedia, termasuk `reasoning`, `compat.thinkingFormat`, dan `compat.supportedReasoningEfforts`. Gunakan fakta tersebut untuk mengekspos profil biner atau khusus hanya jika kontrak permintaan yang dikonfigurasi mendukung muatan yang sesuai.
- Plugin alat yang perlu memvalidasi penggantian pemikiran eksplisit harus menggunakan `api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` bersama `api.runtime.agent.normalizeThinkingLevel(...)`; Plugin tersebut tidak boleh menyimpan daftar tingkat penyedia/modelnya sendiri. Teruskan `agentRuntime` jika alat memiliki jalur eksekusi, seperti proses yang selalu disematkan.
- Plugin alat yang memiliki akses ke metadata model khusus yang dikonfigurasi dapat meneruskan `catalog` ke `resolveThinkingPolicy` agar keikutsertaan `compat.supportedReasoningEfforts` tercermin dalam validasi di sisi Plugin.
- Hook lama yang telah dipublikasikan (`supportsXHighThinking`, `isBinaryThinking`, dan `resolveDefaultThinkingLevel`) tetap tersedia sebagai adaptor kompatibilitas, tetapi kumpulan tingkat khusus baru harus menggunakan `resolveThinkingProfile`.
- Baris/nilai default Gateway mengekspos `thinkingLevels`, `thinkingOptions`, dan `thinkingDefault` agar klien ACP/obrolan merender ID dan label profil yang sama dengan yang digunakan oleh validasi waktu proses.
