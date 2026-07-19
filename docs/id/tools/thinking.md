---
read_when:
    - Menyesuaikan penguraian atau nilai default direktif thinking, fast-mode, atau verbose
summary: Sintaks direktif untuk /think, /fast, /verbose, /trace, dan visibilitas penalaran
title: Tingkat pemikiran
x-i18n:
    generated_at: "2026-07-19T05:38:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bb2a4ed4179e115c184d89ecf3a0a22379d3d0dad4a4838d9c5db851e1334728
    source_path: tools/thinking.md
    workflow: 16
---

## Fungsinya

- Direktif sebaris dalam setiap isi pesan masuk: `/t <level>`, `/think:<level>`, atau `/thinking <level>`.
- Tingkat (alias): `off | minimal | low | medium | high | xhigh | adaptive | max | ultra`, kurang lebih mencerminkan jenjang kata ajaib klasik Anthropic "think" < "think hard" < "think harder" < "ultrathink":
  - minimal ~ "think"
  - low ~ "think hard"
  - medium ~ "think harder"
  - high ~ "ultrathink" (anggaran maksimum)
  - xhigh ~ "ultrathink+" (model GPT-5.2+ dan Codex, serta upaya Anthropic Claude Opus 4.7+)
  - adaptive → pemikiran adaptif yang dikelola penyedia (didukung untuk Claude 4.6 di Anthropic/Bedrock, Anthropic Claude Opus 4.7+, dan pemikiran dinamis Google Gemini)
  - max → penalaran maksimum penyedia (Anthropic Claude Opus 4.7+; Ollama memetakannya ke upaya `think` native tertingginya)
  - ultra → penalaran maksimum penyedia ditambah orkestrasi subagen proaktif ketika model/runtime yang dipilih mendukungnya
  - `x-high`, `x_high`, `extra-high`, `extra high`, dan `extra_high` dipetakan ke `xhigh`.
  - `highest` dipetakan ke `high`.
- Catatan penyedia:
  - Menu dan pemilih pemikiran digerakkan oleh profil penyedia. Plugin penyedia mendeklarasikan kumpulan tingkat yang tepat untuk model yang dipilih, termasuk label seperti `on` biner.
  - `adaptive`, `xhigh`, `max`, dan `ultra` hanya ditawarkan untuk profil penyedia/model/runtime yang mendukungnya. Direktif bertipe untuk tingkat yang tidak didukung ditolak dengan opsi valid model tersebut.
  - Tingkat tersimpan yang tidak lagi didukung dipetakan ulang berdasarkan peringkat profil penyedia. `adaptive` kembali ke `medium` pada model nonadaptif, sedangkan `xhigh` dan `max` kembali ke tingkat nonaktif terbesar yang didukung untuk model yang dipilih.
  - Model Anthropic Claude 4.6 menggunakan `adaptive` secara default ketika tidak ada tingkat pemikiran eksplisit yang ditetapkan.
  - Anthropic Claude Opus 4.8 dan Opus 4.7 mempertahankan pemikiran tetap nonaktif kecuali Anda menetapkan tingkat pemikiran secara eksplisit. Default upaya milik penyedia Opus 4.8 adalah `high` setelah pemikiran adaptif diaktifkan.
  - Anthropic Claude Opus 4.7+ memetakan `/think xhigh` ke pemikiran adaptif ditambah `output_config.effort: "xhigh"`, karena `/think` adalah direktif pemikiran dan `xhigh` adalah pengaturan upaya Opus.
  - Anthropic Claude Opus 4.7+ juga menyediakan `/think max`; ini dipetakan ke jalur upaya maksimum milik penyedia yang sama.
  - Model DeepSeek V4 langsung menyediakan `/think xhigh|max`; keduanya dipetakan ke `reasoning_effort: "max"` DeepSeek, sedangkan tingkat nonaktif yang lebih rendah dipetakan ke `high`.
  - Model DeepSeek V4 yang dirutekan melalui OpenRouter menyediakan `/think xhigh` dan mengirim nilai `reasoning.effort` yang didukung OpenRouter, bukan `reasoning_effort` tingkat atas native DeepSeek. Tingkat nonaktif yang lebih rendah dipetakan ke `high`, dan penggantian tersimpan `max` kembali ke `xhigh`.
  - Model Ollama yang mendukung pemikiran menyediakan `/think low|medium|high|max`; `max` dipetakan ke `think: "high"` native karena API native Ollama menerima string upaya `low`, `medium`, dan `high`.
  - Model OpenAI GPT memetakan `/think` melalui dukungan upaya Responses API khusus model. `/think off` hanya mengirim `reasoning.effort: "none"` ketika model target mendukungnya; jika tidak, OpenClaw menghilangkan payload penalaran yang dinonaktifkan alih-alih mengirim nilai yang tidak didukung.
  - GPT-5.6 Sol dan Terra menyediakan `/think ultra` native melalui runtime Codex. GPT-5.6 Luna menyediakan tingkat hingga `max` karena katalog Codex-nya tidak menawarkan Ultra.
  - Runtime OpenClaw tertanam menyediakan `/think ultra` logis untuk GPT-5.6 Sol, Terra, dan Luna. Runtime ini mengirim upaya maksimum penyedia dan menambahkan panduan orkestrasi subagen proaktif dalam cakupan eksekusi.
  - Entri katalog kustom yang kompatibel dengan OpenAI dapat mengaktifkan `/think xhigh` dengan mengatur `models.providers.<provider>.models[].compat.supportedReasoningEfforts` agar menyertakan `"xhigh"`. Ini menggunakan metadata kompatibilitas yang sama yang memetakan payload upaya penalaran OpenAI keluar, sehingga menu, validasi sesi, CLI agen, dan `llm-task` selaras dengan perilaku transportasi.
  - Referensi OpenRouter Hunter Alpha terkonfigurasi yang sudah usang melewati injeksi penalaran proksi karena rute yang telah dihentikan tersebut dapat mengembalikan teks jawaban akhir melalui bidang penalaran.
  - Google Gemini memetakan `/think adaptive` ke pemikiran dinamis milik penyedia Gemini. Permintaan Gemini 3 menghilangkan `thinkingLevel` tetap, sedangkan permintaan Gemini 2.5 mengirim `thinkingBudget: -1`; tingkat tetap masih dipetakan ke `thinkingLevel` atau anggaran Gemini terdekat untuk keluarga model tersebut.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) pada jalur streaming yang kompatibel dengan Anthropic menggunakan `thinking: { type: "disabled" }` secara default kecuali Anda secara eksplisit menetapkan pemikiran dalam parameter model atau parameter permintaan. Ini mencegah kebocoran delta `reasoning_content` dari format streaming Anthropic non-native milik M2.x. MiniMax-M3 (dan M3.x) dikecualikan: M3 menghasilkan blok pemikiran Anthropic yang semestinya dan mengembalikan konten kosong ketika pemikiran dinonaktifkan, sehingga OpenClaw mempertahankan M3 pada jalur pemikiran adaptif/dihilangkan milik penyedia.
  - Z.AI (`zai/*`) bersifat biner (`on`/`off`) untuk sebagian besar model GLM. GLM-5.2 merupakan pengecualian: model ini menyediakan `/think off|low|high|max`, memetakan `low` dan `high` ke `reasoning_effort: "high"` Z.AI, serta memetakan `max` ke `reasoning_effort: "max"`.
  - Kimi K3 Moonshot API (`moonshot/kimi-k3`) selalu berpikir pada `max`, mengirim `reasoning_effort: "max"`, menghilangkan bidang `thinking` K2 serta penggantian sampling tetap, dan mempertahankan pilihan alat yang didukung K3. Kimi Code K3 (`kimi/k3` dan `kimi/k3[1m]`) menyediakan `/think off|max`: off mengirim `thinking.type: "disabled"`, sedangkan max mengirim pemikiran adaptif dengan upaya maksimum. Referensi Kimi Code saat ini juga mencakup `kimi/kimi-for-coding` dan `kimi/kimi-for-coding-highspeed`. Kimi K2.7 Code (`moonshot/kimi-k2.7-code` dan `moonshot/kimi-k2.7-code-highspeed`) selalu berpikir, hanya menyediakan `on`, serta menghilangkan `thinking` dan `reasoning_effort` keluar. Model `moonshot/*` lainnya memetakan `/think off` ke `thinking: { type: "disabled" }` dan setiap tingkat non-`off` ke `thinking: { type: "enabled" }`. Ketika pemikiran K2 diaktifkan, Moonshot hanya menerima `tool_choice` `auto|none`; OpenClaw menormalkan nilai yang tidak kompatibel menjadi `auto`.

## Urutan resolusi

1. Direktif sebaris pada pesan (hanya berlaku untuk pesan tersebut).
2. Penggantian sesi (ditetapkan dengan mengirim pesan yang hanya berisi direktif).
3. Default per agen (`agents.list[].thinkingDefault` dalam konfigurasi).
4. Default global (`agents.defaults.thinkingDefault` dalam konfigurasi).
5. Fallback: default yang dideklarasikan penyedia jika tersedia; jika tidak, model yang mendukung penalaran diresolusikan ke `medium` atau tingkat non-`off` terdekat yang didukung untuk model tersebut, dan model nonpenalaran tetap `off`.

## Menetapkan default sesi

- Kirim pesan yang **hanya** berisi direktif (spasi kosong diperbolehkan), misalnya `/think:medium` atau `/t high`.
- Pengaturan tersebut tetap berlaku untuk sesi saat ini (secara default per pengirim). Gunakan `/think default` untuk menghapus penggantian sesi dan mewarisi default yang dikonfigurasi/penyedia; aliasnya mencakup `inherit`, `clear`, `reset`, dan `unpin`.
- `/think off` menyimpan penggantian nonaktif eksplisit. Ini menonaktifkan pemikiran hingga Anda mengubah atau menghapus penggantian sesi.
- Balasan konfirmasi dikirim (`Thinking level set to high.` / `Thinking disabled.`). Jika tingkat tidak valid (misalnya `/thinking big`), perintah ditolak dengan petunjuk dan status sesi dibiarkan tidak berubah.
- Kirim `/think` (atau `/think:`) tanpa argumen untuk melihat tingkat pemikiran saat ini.

## Penerapan oleh agen

- **OpenClaw tertanam**: tingkat yang diresolusikan diteruskan ke runtime agen OpenClaw dalam proses.
- **Backend CLI Claude**: tingkat nonaktif konkret diteruskan ke Claude Code sebagai `--effort` saat menggunakan `claude-cli`; `adaptive` menghapus flag upaya yang dikonfigurasi dan mendelegasikan upaya efektif ke lingkungan, pengaturan, dan default model Claude Code. Lihat [backend CLI](/id/gateway/cli-backends).

## Mode cepat (/fast)

- Tingkat: `auto|on|off|default`.
- Pesan yang hanya berisi direktif mengaktifkan atau menonaktifkan penggantian mode cepat sesi dan membalas `Fast mode set to auto.`, `Fast mode enabled.`, atau `Fast mode disabled.`. Gunakan `/fast default` untuk menghapus penggantian sesi dan mewarisi default yang dikonfigurasi; aliasnya mencakup `inherit`, `clear`, `reset`, dan `unpin`.
- Kirim `/fast` (atau `/fast status`) tanpa mode untuk melihat status mode cepat efektif saat ini.
- OpenClaw meresolusikan mode cepat dalam urutan berikut:
  1. Penggantian `/fast auto|on|off` sebaris/hanya direktif (`/fast default` menghapus lapisan ini)
  2. Penggantian sesi
  3. Default per agen (`agents.list[].fastModeDefault`)
  4. Konfigurasi per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- `auto` mempertahankan mode sesi/konfigurasi sebagai auto, tetapi meresolusikan setiap panggilan model baru secara independen. Panggilan yang dimulai sebelum batas waktu auto mengaktifkan mode cepat; panggilan percobaan ulang, fallback, hasil alat, atau lanjutan yang lebih kemudian dimulai dengan mode cepat dinonaktifkan. Batas waktu default adalah 60 detik; tetapkan `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` pada model aktif untuk mengubahnya.
- Untuk `openai/*`, mode cepat dipetakan ke pemrosesan prioritas OpenAI dengan mengirim `service_tier=priority` pada permintaan Responses yang didukung.
- Untuk model `openai/*` / `openai-codex/*` berbasis Codex, mode cepat mengirim flag `service_tier=priority` yang sama pada Responses Codex. Giliran app-server Codex native menerima tingkat layanan hanya pada `turn/start` atau saat memulai/melanjutkan utas, sehingga `auto` tidak dapat mengubah tingkat layanan giliran app-server yang sudah berjalan; pengaturan tersebut berlaku pada giliran model berikutnya yang dimulai OpenClaw.
- Untuk permintaan publik langsung `anthropic/*`, termasuk lalu lintas terautentikasi OAuth yang dikirim ke `api.anthropic.com`, mode cepat dipetakan ke tingkat layanan Anthropic: `/fast on` menetapkan `service_tier=auto`, `/fast off` menetapkan `service_tier=standard_only`.
- Untuk `minimax/*` pada jalur yang kompatibel dengan Anthropic, `/fast on` (atau `params.fastMode: true`) menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.
- Parameter model Anthropic `serviceTier` / `service_tier` eksplisit mengesampingkan default mode cepat ketika keduanya ditetapkan. OpenClaw tetap melewati injeksi tingkat layanan Anthropic untuk URL dasar proksi non-Anthropic.
- `/status` menampilkan `Fast` ketika mode cepat diaktifkan dan `Fast:auto` ketika mode yang dikonfigurasi adalah auto.

## Direktif verbose (/verbose atau /v)

- Level: `on` (minimal) | `full` | `off` (default).
- Pesan yang hanya berisi direktif mengalihkan mode verbose sesi dan membalas `Verbose logging enabled.` / `Verbose logging disabled.`; level yang tidak valid mengembalikan petunjuk tanpa mengubah status.
- `/verbose off` menyimpan penggantian eksplisit untuk sesi; hapus melalui UI Sessions dengan memilih `inherit`.
- Pengirim kanal eksternal yang diotorisasi dapat mempertahankan penggantian mode verbose sesi. Klien gateway/webchat internal memerlukan `operator.admin` untuk mempertahankannya.
- Direktif sebaris hanya memengaruhi pesan tersebut; jika tidak, default sesi/global akan berlaku.
- Kirim `/verbose` (atau `/verbose:`) tanpa argumen untuk melihat level verbose saat ini.
- Saat mode verbose aktif, agen yang menghasilkan hasil alat terstruktur mengirim kembali setiap pemanggilan alat sebagai pesan khusus metadata tersendiri, diawali dengan `<emoji> <tool-name>: <arg>` jika tersedia. Ringkasan alat ini dikirim segera setelah setiap alat dimulai (gelembung terpisah), bukan sebagai delta streaming.
- Ringkasan kegagalan alat tetap terlihat dalam mode normal, tetapi sufiks detail kesalahan mentah disembunyikan kecuali mode verbose adalah `full`.
- Saat mode verbose adalah `full`, keluaran alat juga diteruskan setelah selesai (gelembung terpisah, dipotong hingga panjang yang aman). Jika Anda mengalihkan `/verbose on|full|off` saat proses sedang berjalan, gelembung alat berikutnya akan mengikuti pengaturan baru.
- `agents.defaults.toolProgressDetail` mengontrol bentuk ringkasan alat `/verbose` dan baris alat pada draf progres. Gunakan `"explain"` (default) untuk label ringkas yang mudah dipahami seperti `🛠️ Exec: checking JS syntax`; gunakan `"raw"` jika Anda juga ingin perintah/detail mentah ditambahkan untuk debugging. `agents.list[].toolProgressDetail` per agen menggantikan default.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Direktif pelacakan Plugin (/trace)

- Level: `on` | `off` (default).
- Pesan yang hanya berisi direktif mengalihkan keluaran pelacakan Plugin sesi dan membalas `Plugin trace enabled.` / `Plugin trace disabled.`.
- Direktif sebaris hanya memengaruhi pesan tersebut; jika tidak, default sesi/global akan berlaku.
- Kirim `/trace` (atau `/trace:`) tanpa argumen untuk melihat level pelacakan saat ini.
- `/trace` lebih terbatas daripada `/verbose`: ini hanya menampilkan baris pelacakan/debug milik Plugin, seperti ringkasan debug Active Memory.
- Baris pelacakan dapat muncul di `/status` dan sebagai pesan diagnostik lanjutan setelah balasan asisten normal.

## Visibilitas penalaran (/reasoning)

- Level: `on|off|stream`.
- Pesan yang hanya berisi direktif mengalihkan apakah blok pemikiran ditampilkan dalam balasan.
- Saat diaktifkan, penalaran dikirim sebagai **pesan terpisah** yang diawali dengan `Thinking`.
- `stream`: mengalirkan penalaran saat balasan sedang dibuat jika kanal aktif mendukung pratinjau penalaran, lalu mengirim jawaban akhir tanpa penalaran.
- Alias: `/reason`.
- Kirim `/reasoning` (atau `/reasoning:`) tanpa argumen untuk melihat level penalaran saat ini.
- Urutan resolusi: direktif sebaris, lalu penggantian sesi, kemudian default per agen (`agents.list[].reasoningDefault`), lalu default global (`agents.defaults.reasoningDefault`), kemudian fallback (`off`).

Tag penalaran model lokal yang salah format ditangani secara konservatif. Blok `<think>...</think>` yang tertutup tetap disembunyikan pada balasan normal, dan penalaran yang tidak tertutup setelah teks yang sudah terlihat juga disembunyikan. Jika balasan sepenuhnya dibungkus dalam satu tag pembuka yang tidak tertutup dan jika tidak ditangani akan dikirim sebagai teks kosong, OpenClaw menghapus tag pembuka yang salah format tersebut dan mengirimkan teks sisanya.

## Terkait

- Dokumentasi mode elevated tersedia di [Mode elevated](/id/tools/elevated).

## Heartbeat

- Isi pemeriksaan Heartbeat adalah prompt Heartbeat yang dikonfigurasi (default: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Direktif sebaris dalam pesan Heartbeat berlaku seperti biasa (tetapi hindari mengubah default sesi melalui Heartbeat).
- Pengiriman Heartbeat secara default hanya mengirim payload akhir. Untuk turut mengirim pesan `Thinking` secara terpisah (jika tersedia), atur `agents.defaults.heartbeat.includeReasoning: true` atau `agents.list[].heartbeat.includeReasoning: true` per agen.

## UI obrolan web

- Pemilih pemikiran pada obrolan web mencerminkan level sesi yang tersimpan dari penyimpanan/konfigurasi sesi masuk saat halaman dimuat.
- Memilih level lain akan segera menulis penggantian sesi melalui `sessions.patch`; tindakan ini tidak menunggu pengiriman berikutnya dan bukan penggantian `thinkingOnce` sekali pakai.
- Pengiriman saat perubahan pemilih model, penalaran, atau kecepatan masih diterapkan akan menunggu setiap patch pemilih yang tertunda; jika perubahan gagal, pesan tetap tidak terkirim agar dapat ditinjau.
- Opsi pertama selalu merupakan pilihan untuk menghapus penggantian. Opsi ini menampilkan `Inherited: <resolved level>`, termasuk `Inherited: Off` ketika pemikiran yang diwarisi dinonaktifkan.
- Pilihan pemilih eksplisit menggunakan label levelnya secara langsung sambil mempertahankan label penyedia jika ada (misalnya `Maximum` untuk opsi `max` yang memiliki label penyedia).
- Pemilih menggunakan `thinkingLevels` yang dikembalikan oleh baris/default sesi Gateway, dengan `thinkingOptions` dipertahankan sebagai daftar label lama. UI browser tidak menyimpan daftar regex penyedianya sendiri; Plugin memiliki kumpulan level khusus model.
- `/think:<level>` tetap berfungsi dan memperbarui level sesi tersimpan yang sama, sehingga direktif obrolan dan pemilih tetap sinkron.

## Profil penyedia

- Plugin penyedia dapat mengekspos `resolveThinkingProfile(ctx)` untuk menentukan level yang didukung model dan defaultnya.
- Plugin penyedia yang memproksi model Claude harus menggunakan kembali `resolveClaudeThinkingProfile(modelId)` dari `openclaw/plugin-sdk/provider-model-shared` agar katalog Anthropic langsung dan katalog proksi tetap selaras.
- Setiap level profil memiliki `id` kanonis yang tersimpan (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max`, atau `ultra`) dan dapat menyertakan `label` tampilan. Penyedia biner menggunakan `{ id: "low", label: "on" }`.
- Hook profil menerima fakta katalog gabungan jika tersedia, termasuk `reasoning`, `compat.thinkingFormat`, dan `compat.supportedReasoningEfforts`. Gunakan fakta tersebut untuk mengekspos profil biner atau kustom hanya jika kontrak permintaan yang dikonfigurasi mendukung payload yang sesuai.
- Plugin alat yang perlu memvalidasi penggantian pemikiran eksplisit harus menggunakan `api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` bersama `api.runtime.agent.normalizeThinkingLevel(...)`; Plugin tersebut tidak boleh menyimpan daftar level penyedia/modelnya sendiri. Teruskan `agentRuntime` jika alat memiliki jalur eksekusi, seperti proses yang selalu disematkan.
- Plugin alat yang memiliki akses ke metadata model kustom terkonfigurasi dapat meneruskan `catalog` ke `resolveThinkingPolicy` agar keikutsertaan `compat.supportedReasoningEfforts` tercermin dalam validasi di sisi Plugin.
- Hook lama yang telah dipublikasikan (`supportsXHighThinking`, `isBinaryThinking`, dan `resolveDefaultThinkingLevel`) tetap tersedia sebagai adaptor kompatibilitas, tetapi kumpulan level kustom baru harus menggunakan `resolveThinkingProfile`.
- Baris/default Gateway mengekspos `thinkingLevels`, `thinkingOptions`, dan `thinkingDefault` agar klien ACP/obrolan merender ID dan label profil yang sama dengan yang digunakan oleh validasi runtime.
