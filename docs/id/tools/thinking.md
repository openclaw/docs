---
read_when:
    - Menyesuaikan penguraian atau default direktif thinking, fast-mode, atau verbose
summary: Sintaks direktif untuk /think, /fast, /verbose, /trace, dan visibilitas penalaran
title: Tingkat pemikiran
x-i18n:
    generated_at: "2026-05-10T19:56:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c75e2360a260aaf4571f2da6c7519fb4987e4c8c7947e3dc37f94a0ad260ad55
    source_path: tools/thinking.md
    workflow: 16
---

## Fungsinya

- Direktif inline dalam isi pesan masuk apa pun: `/t <level>`, `/think:<level>`, atau `/thinking <level>`.
- Level (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (anggaran maks)
  - xhigh → "ultrathink+" (model GPT-5.2+ dan Codex, plus upaya Anthropic Claude Opus 4.7)
  - adaptive → pemikiran adaptif yang dikelola penyedia (didukung untuk Claude 4.6 di Anthropic/Bedrock, Anthropic Claude Opus 4.7, dan pemikiran dinamis Google Gemini)
  - max → penalaran maks penyedia (Anthropic Claude Opus 4.7; Ollama memetakannya ke upaya `think` native tertingginya)
  - `x-high`, `x_high`, `extra-high`, `extra high`, dan `extra_high` dipetakan ke `xhigh`.
  - `highest` dipetakan ke `high`.
- Catatan penyedia:
  - Menu dan pemilih pemikiran digerakkan oleh profil penyedia. Plugin penyedia mendeklarasikan set level yang persis untuk model yang dipilih, termasuk label seperti `on` biner.
  - `adaptive`, `xhigh`, dan `max` hanya ditampilkan untuk profil penyedia/model yang mendukungnya. Direktif bertipe untuk level yang tidak didukung ditolak dengan opsi valid model tersebut.
  - Level tidak didukung yang sudah tersimpan dipetakan ulang berdasarkan peringkat profil penyedia. `adaptive` kembali ke `medium` pada model non-adaptif, sedangkan `xhigh` dan `max` kembali ke level non-`off` terbesar yang didukung untuk model yang dipilih.
  - Model Anthropic Claude 4.6 default ke `adaptive` ketika tidak ada level pemikiran eksplisit yang ditetapkan.
  - Anthropic Claude Opus 4.7 tidak default ke pemikiran adaptif. Default upaya API-nya tetap dimiliki penyedia kecuali Anda menetapkan level pemikiran secara eksplisit.
  - Anthropic Claude Opus 4.7 memetakan `/think xhigh` ke pemikiran adaptif plus `output_config.effort: "xhigh"`, karena `/think` adalah direktif pemikiran dan `xhigh` adalah pengaturan upaya Opus 4.7.
  - Anthropic Claude Opus 4.7 juga mengekspos `/think max`; ini dipetakan ke jalur upaya maks yang sama yang dimiliki penyedia.
  - Model Direct DeepSeek V4 mengekspos `/think xhigh|max`; keduanya dipetakan ke DeepSeek `reasoning_effort: "max"` sementara level non-`off` yang lebih rendah dipetakan ke `high`.
  - Model DeepSeek V4 yang dirutekan OpenRouter mengekspos `/think xhigh` dan mengirim nilai `reasoning_effort` yang didukung OpenRouter. Override `max` yang tersimpan kembali ke `xhigh`.
  - Model Ollama yang mampu berpikir mengekspos `/think low|medium|high|max`; `max` dipetakan ke native `think: "high"` karena API native Ollama menerima string upaya `low`, `medium`, dan `high`.
  - Model OpenAI GPT memetakan `/think` melalui dukungan upaya Responses API spesifik model. `/think off` mengirim `reasoning.effort: "none"` hanya ketika model target mendukungnya; jika tidak, OpenClaw menghilangkan payload penalaran yang dinonaktifkan alih-alih mengirim nilai yang tidak didukung.
  - Entri katalog kompatibel OpenAI kustom dapat ikut memakai `/think xhigh` dengan menetapkan `models.providers.<provider>.models[].compat.supportedReasoningEfforts` agar menyertakan `"xhigh"`. Ini menggunakan metadata kompatibilitas yang sama yang memetakan payload upaya penalaran OpenAI keluar, sehingga menu, validasi sesi, CLI agen, dan `llm-task` selaras dengan perilaku transport.
  - Ref OpenRouter Hunter Alpha terkonfigurasi yang basi melewati injeksi penalaran proksi karena rute yang sudah dipensiunkan itu dapat mengembalikan teks jawaban final melalui field penalaran.
  - Google Gemini memetakan `/think adaptive` ke pemikiran dinamis milik penyedia Gemini. Permintaan Gemini 3 menghilangkan `thinkingLevel` tetap, sementara permintaan Gemini 2.5 mengirim `thinkingBudget: -1`; level tetap tetap dipetakan ke `thinkingLevel` atau anggaran Gemini terdekat untuk keluarga model tersebut.
  - MiniMax (`minimax/*`) pada jalur streaming kompatibel Anthropic default ke `thinking: { type: "disabled" }` kecuali Anda secara eksplisit menetapkan pemikiran di parameter model atau parameter permintaan. Ini menghindari delta `reasoning_content` yang bocor dari format stream Anthropic non-native milik MiniMax.
  - Z.AI (`zai/*`) hanya mendukung pemikiran biner (`on`/`off`). Level non-`off` apa pun diperlakukan sebagai `on` (dipetakan ke `low`).
  - Moonshot (`moonshot/*`) memetakan `/think off` ke `thinking: { type: "disabled" }` dan level non-`off` apa pun ke `thinking: { type: "enabled" }`. Ketika pemikiran diaktifkan, Moonshot hanya menerima `tool_choice` `auto|none`; OpenClaw menormalkan nilai yang tidak kompatibel ke `auto`.

## Urutan resolusi

1. Direktif inline pada pesan (hanya berlaku untuk pesan itu).
2. Override sesi (ditetapkan dengan mengirim pesan yang hanya berisi direktif).
3. Default per agen (`agents.list[].thinkingDefault` di config).
4. Default global (`agents.defaults.thinkingDefault` di config).
5. Fallback: default yang dideklarasikan penyedia ketika tersedia; jika tidak, model yang mampu bernalar terselesaikan ke `medium` atau level non-`off` terdekat yang didukung untuk model tersebut, dan model non-penalaran tetap `off`.

## Menetapkan default sesi

- Kirim pesan yang **hanya** berisi direktif (spasi putih diperbolehkan), mis. `/think:medium` atau `/t high`.
- Itu melekat untuk sesi saat ini (secara default per pengirim). Gunakan `/think default` untuk menghapus override sesi dan mewarisi default terkonfigurasi/penyedia; alias mencakup `inherit`, `clear`, `reset`, dan `unpin`.
- `/think off` menyimpan override off eksplisit. Ini menonaktifkan pemikiran sampai Anda mengubah atau menghapus override sesi.
- Balasan konfirmasi dikirim (`Thinking level set to high.` / `Thinking disabled.`). Jika level tidak valid (mis. `/thinking big`), perintah ditolak dengan petunjuk dan status sesi dibiarkan tidak berubah.
- Kirim `/think` (atau `/think:`) tanpa argumen untuk melihat level pemikiran saat ini.

## Penerapan oleh agen

- **Pi tertanam**: level yang terselesaikan diteruskan ke runtime agen Pi dalam proses.
- **Backend Claude CLI**: level non-off diteruskan ke Claude Code sebagai `--effort` saat menggunakan `claude-cli`; lihat [Backend CLI](/id/gateway/cli-backends).

## Mode cepat (/fast)

- Level: `on|off|default`.
- Pesan yang hanya berisi direktif mengalihkan override mode cepat sesi dan membalas `Fast mode enabled.` / `Fast mode disabled.`. Gunakan `/fast default` untuk menghapus override sesi dan mewarisi default terkonfigurasi; alias mencakup `inherit`, `clear`, `reset`, dan `unpin`.
- Kirim `/fast` (atau `/fast status`) tanpa mode untuk melihat status mode cepat efektif saat ini.
- OpenClaw menyelesaikan mode cepat dalam urutan ini:
  1. Override `/fast on|off` inline/hanya-direktif (`/fast default` menghapus lapisan ini)
  2. Override sesi
  3. Default per agen (`agents.list[].fastModeDefault`)
  4. Config per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Untuk `openai/*`, mode cepat dipetakan ke pemrosesan prioritas OpenAI dengan mengirim `service_tier=priority` pada permintaan Responses yang didukung.
- Untuk `openai-codex/*`, mode cepat mengirim flag `service_tier=priority` yang sama pada Codex Responses. OpenClaw mempertahankan satu toggle `/fast` bersama di kedua jalur auth.
- Untuk permintaan langsung publik `anthropic/*`, termasuk lalu lintas terautentikasi OAuth yang dikirim ke `api.anthropic.com`, mode cepat dipetakan ke tingkat layanan Anthropic: `/fast on` menetapkan `service_tier=auto`, `/fast off` menetapkan `service_tier=standard_only`.
- Untuk `minimax/*` pada jalur kompatibel Anthropic, `/fast on` (atau `params.fastMode: true`) menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.
- Parameter model Anthropic `serviceTier` / `service_tier` eksplisit mengesampingkan default mode cepat ketika keduanya ditetapkan. OpenClaw tetap melewati injeksi tingkat layanan Anthropic untuk URL basis proksi non-Anthropic.
- `/status` menampilkan `Fast` hanya ketika mode cepat diaktifkan.

## Direktif verbose (/verbose atau /v)

- Level: `on` (minimal) | `full` | `off` (default).
- Pesan yang hanya berisi direktif mengalihkan verbose sesi dan membalas `Verbose logging enabled.` / `Verbose logging disabled.`; level tidak valid mengembalikan petunjuk tanpa mengubah status.
- `/verbose off` menyimpan override sesi eksplisit; hapus melalui UI Sessions dengan memilih `inherit`.
- Direktif inline hanya memengaruhi pesan itu; default sesi/global berlaku jika tidak ada.
- Kirim `/verbose` (atau `/verbose:`) tanpa argumen untuk melihat level verbose saat ini.
- Ketika verbose aktif, agen yang memancarkan hasil alat terstruktur (Pi, agen JSON lain) mengirim setiap panggilan alat kembali sebagai pesannya sendiri yang hanya metadata, diawali dengan `<emoji> <tool-name>: <arg>` ketika tersedia. Ringkasan alat ini dikirim segera setelah setiap alat mulai (gelembung terpisah), bukan sebagai delta streaming.
- Ringkasan kegagalan alat tetap terlihat dalam mode normal, tetapi sufiks detail error mentah disembunyikan kecuali verbose adalah `on` atau `full`.
- Ketika verbose adalah `full`, output alat juga diteruskan setelah selesai (gelembung terpisah, dipotong hingga panjang aman). Jika Anda mengalihkan `/verbose on|full|off` saat run sedang berlangsung, gelembung alat berikutnya mengikuti pengaturan baru.
- `agents.defaults.toolProgressDetail` mengontrol bentuk ringkasan alat `/verbose` dan baris alat draf progres. Gunakan `"explain"` (default) untuk label manusia ringkas seperti `🛠️ Exec: checking JS syntax`; gunakan `"raw"` ketika Anda juga ingin perintah/detail mentah ditambahkan untuk debugging. `agents.list[].toolProgressDetail` per agen mengesampingkan default.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Direktif trace Plugin (/trace)

- Level: `on` | `off` (default).
- Pesan yang hanya berisi direktif mengalihkan output trace Plugin sesi dan membalas `Plugin trace enabled.` / `Plugin trace disabled.`.
- Direktif inline hanya memengaruhi pesan itu; default sesi/global berlaku jika tidak ada.
- Kirim `/trace` (atau `/trace:`) tanpa argumen untuk melihat level trace saat ini.
- `/trace` lebih sempit daripada `/verbose`: ini hanya mengekspos baris trace/debug milik Plugin seperti ringkasan debug Active Memory.
- Baris trace dapat muncul di `/status` dan sebagai pesan diagnostik lanjutan setelah balasan asisten normal.

## Visibilitas penalaran (/reasoning)

- Level: `on|off|stream`.
- Pesan yang hanya berisi direktif mengalihkan apakah blok pemikiran ditampilkan dalam balasan.
- Ketika diaktifkan, penalaran dikirim sebagai **pesan terpisah** dengan prefiks `Reasoning:`.
- `stream` (khusus Telegram): mengalirkan penalaran ke gelembung draf Telegram saat balasan sedang dibuat, lalu mengirim jawaban final tanpa penalaran.
- Alias: `/reason`.
- Kirim `/reasoning` (atau `/reasoning:`) tanpa argumen untuk melihat level penalaran saat ini.
- Urutan resolusi: direktif inline, lalu override sesi, lalu default per agen (`agents.list[].reasoningDefault`), lalu default global (`agents.defaults.reasoningDefault`), lalu fallback (`off`).

Tag penalaran model lokal yang salah bentuk ditangani secara konservatif. Blok `<think>...</think>` yang tertutup tetap tersembunyi pada balasan normal, dan penalaran yang tidak tertutup setelah teks yang sudah terlihat juga disembunyikan. Jika balasan sepenuhnya dibungkus dalam satu tag pembuka yang tidak tertutup dan jika tidak akan terkirim sebagai teks kosong, OpenClaw menghapus tag pembuka yang salah bentuk dan mengirim teks yang tersisa.

## Terkait

- Dokumentasi mode tinggi ada di [Mode tinggi](/id/tools/elevated).

## Heartbeat

- Isi probe Heartbeat adalah prompt heartbeat yang terkonfigurasi (default: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Direktif inline dalam pesan heartbeat berlaku seperti biasa (tetapi hindari mengubah default sesi dari heartbeat).
- Pengiriman Heartbeat default ke payload final saja. Untuk juga mengirim pesan `Reasoning:` terpisah (ketika tersedia), tetapkan `agents.defaults.heartbeat.includeReasoning: true` atau `agents.list[].heartbeat.includeReasoning: true` per agen.

## UI web chat

- Pemilih pemikiran obrolan web mencerminkan level tersimpan sesi dari penyimpanan/konfigurasi sesi masuk saat halaman dimuat.
- Memilih level lain langsung menulis override sesi melalui `sessions.patch`; ini tidak menunggu pengiriman berikutnya dan bukan override sekali pakai `thinkingOnce`.
- Opsi pertama selalu menjadi pilihan untuk menghapus override. Opsi ini menampilkan `Inherited: <resolved level>` saat sesi mewarisi default efektif non-off, atau `Off` saat pemikiran yang diwarisi dinonaktifkan.
- Pilihan pemilih eksplisit diberi label sebagai override, sambil mempertahankan label penyedia saat tersedia (misalnya `Override: maximum` untuk opsi `max` yang diberi label penyedia).
- Pemilih menggunakan `thinkingLevels` yang dikembalikan oleh baris/default sesi Gateway, dengan `thinkingOptions` dipertahankan sebagai daftar label lama. UI browser tidak menyimpan daftar regex penyedianya sendiri; plugin memiliki set level khusus model.
- `/think:<level>` tetap berfungsi dan memperbarui level sesi tersimpan yang sama, sehingga direktif obrolan dan pemilih tetap sinkron.

## Profil penyedia

- Plugin penyedia dapat mengekspos `resolveThinkingProfile(ctx)` untuk menentukan level yang didukung model dan default-nya.
- Plugin penyedia yang mem-proxy model Claude sebaiknya menggunakan kembali `resolveClaudeThinkingProfile(modelId)` dari `openclaw/plugin-sdk/provider-model-shared` agar katalog Anthropic langsung dan proxy tetap selaras.
- Setiap level profil memiliki `id` kanonis tersimpan (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, atau `max`) dan dapat menyertakan `label` tampilan. Penyedia biner menggunakan `{ id: "low", label: "on" }`.
- Plugin alat yang perlu memvalidasi override pemikiran eksplisit sebaiknya menggunakan `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)`; plugin tersebut tidak boleh menyimpan daftar level penyedia/modelnya sendiri.
- Plugin alat dengan akses ke metadata model kustom yang dikonfigurasi dapat meneruskan `catalog` ke `resolveThinkingPolicy` agar opt-in `compat.supportedReasoningEfforts` tercermin dalam validasi sisi plugin.
- Hook lama yang dipublikasikan (`supportsXHighThinking`, `isBinaryThinking`, dan `resolveDefaultThinkingLevel`) tetap ada sebagai adapter kompatibilitas, tetapi set level kustom baru sebaiknya menggunakan `resolveThinkingProfile`.
- Baris/default Gateway mengekspos `thinkingLevels`, `thinkingOptions`, dan `thinkingDefault` agar klien ACP/obrolan merender id profil dan label yang sama dengan yang digunakan validasi runtime.
