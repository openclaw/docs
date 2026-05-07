---
read_when:
    - Menyesuaikan penguraian atau nilai bawaan direktif thinking, fast-mode, atau verbose
summary: Sintaksis direktif untuk /think, /fast, /verbose, /trace, dan visibilitas penalaran
title: Tingkat berpikir
x-i18n:
    generated_at: "2026-05-07T13:26:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8890563aa0171d41549f1d1a6af3279babbcba17eb19302753275e9e2ff01980
    source_path: tools/thinking.md
    workflow: 16
---

## Yang dilakukan

- Direktif sebaris di badan masuk apa pun: `/t <level>`, `/think:<level>`, atau `/thinking <level>`.
- Level (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "berpikir"
  - low → "berpikir keras"
  - medium → "berpikir lebih keras"
  - high → "ultrathink" (anggaran maksimum)
  - xhigh → "ultrathink+" (model GPT-5.2+ dan Codex, ditambah upaya Anthropic Claude Opus 4.7)
  - adaptive → pemikiran adaptif yang dikelola penyedia (didukung untuk Claude 4.6 di Anthropic/Bedrock, Anthropic Claude Opus 4.7, dan pemikiran dinamis Google Gemini)
  - max → penalaran maksimum penyedia (Anthropic Claude Opus 4.7; Ollama memetakan ini ke upaya native `think` tertingginya)
  - `x-high`, `x_high`, `extra-high`, `extra high`, dan `extra_high` dipetakan ke `xhigh`.
  - `highest` dipetakan ke `high`.
- Catatan penyedia:
  - Menu dan pemilih thinking digerakkan oleh profil penyedia. Plugin penyedia mendeklarasikan set level yang tepat untuk model yang dipilih, termasuk label seperti biner `on`.
  - `adaptive`, `xhigh`, dan `max` hanya ditampilkan untuk profil penyedia/model yang mendukungnya. Direktif yang diketik untuk level yang tidak didukung ditolak dengan opsi valid model tersebut.
  - Level tersimpan yang tidak lagi didukung dipetakan ulang berdasarkan peringkat profil penyedia. `adaptive` mundur ke `medium` pada model non-adaptif, sementara `xhigh` dan `max` mundur ke level non-`off` terbesar yang didukung untuk model yang dipilih.
  - Model Anthropic Claude 4.6 menggunakan `adaptive` secara default ketika tidak ada level thinking eksplisit yang ditetapkan.
  - Anthropic Claude Opus 4.7 tidak default ke pemikiran adaptif. Default upaya API-nya tetap dimiliki penyedia kecuali Anda menetapkan level thinking secara eksplisit.
  - Anthropic Claude Opus 4.7 memetakan `/think xhigh` ke pemikiran adaptif plus `output_config.effort: "xhigh"`, karena `/think` adalah direktif thinking dan `xhigh` adalah pengaturan upaya Opus 4.7.
  - Anthropic Claude Opus 4.7 juga mengekspos `/think max`; ini dipetakan ke jalur upaya maksimum yang sama yang dimiliki penyedia.
  - Model DeepSeek V4 langsung mengekspos `/think xhigh|max`; keduanya dipetakan ke DeepSeek `reasoning_effort: "max"` sementara level non-`off` yang lebih rendah dipetakan ke `high`.
  - Model DeepSeek V4 yang dirutekan OpenRouter mengekspos `/think xhigh` dan mengirim nilai `reasoning_effort` yang didukung OpenRouter. Override `max` tersimpan mundur ke `xhigh`.
  - Model Ollama yang mendukung thinking mengekspos `/think low|medium|high|max`; `max` dipetakan ke `think: "high"` native karena API native Ollama menerima string upaya `low`, `medium`, dan `high`.
  - Model OpenAI GPT memetakan `/think` melalui dukungan upaya Responses API yang spesifik model. `/think off` mengirim `reasoning.effort: "none"` hanya ketika model target mendukungnya; jika tidak, OpenClaw menghilangkan payload penalaran yang dinonaktifkan alih-alih mengirim nilai yang tidak didukung.
  - Entri katalog kompatibel OpenAI khusus dapat ikut menggunakan `/think xhigh` dengan menetapkan `models.providers.<provider>.models[].compat.supportedReasoningEfforts` agar menyertakan `"xhigh"`. Ini menggunakan metadata kompatibilitas yang sama yang memetakan payload upaya penalaran OpenAI keluar, sehingga menu, validasi sesi, CLI agen, dan `llm-task` selaras dengan perilaku transport.
  - Referensi OpenRouter Hunter Alpha yang dikonfigurasi usang melewati injeksi penalaran proxy karena rute yang sudah dihentikan itu dapat mengembalikan teks jawaban final melalui field penalaran.
  - Google Gemini memetakan `/think adaptive` ke pemikiran dinamis milik penyedia Gemini. Permintaan Gemini 3 menghilangkan `thinkingLevel` tetap, sementara permintaan Gemini 2.5 mengirim `thinkingBudget: -1`; level tetap tetap dipetakan ke `thinkingLevel` atau anggaran Gemini terdekat untuk keluarga model tersebut.
  - MiniMax (`minimax/*`) pada jalur streaming yang kompatibel Anthropic default ke `thinking: { type: "disabled" }` kecuali Anda menetapkan thinking secara eksplisit di parameter model atau parameter permintaan. Ini menghindari kebocoran delta `reasoning_content` dari format stream Anthropic non-native MiniMax.
  - Z.AI (`zai/*`) hanya mendukung thinking biner (`on`/`off`). Level non-`off` apa pun diperlakukan sebagai `on` (dipetakan ke `low`).
  - Moonshot (`moonshot/*`) memetakan `/think off` ke `thinking: { type: "disabled" }` dan level non-`off` apa pun ke `thinking: { type: "enabled" }`. Ketika thinking diaktifkan, Moonshot hanya menerima `tool_choice` `auto|none`; OpenClaw menormalkan nilai yang tidak kompatibel ke `auto`.

## Urutan resolusi

1. Direktif sebaris pada pesan (hanya berlaku untuk pesan tersebut).
2. Override sesi (ditetapkan dengan mengirim pesan yang hanya berisi direktif).
3. Default per agen (`agents.list[].thinkingDefault` di konfigurasi).
4. Default global (`agents.defaults.thinkingDefault` di konfigurasi).
5. Fallback: default yang dideklarasikan penyedia ketika tersedia; jika tidak, model yang mampu bernalar diselesaikan ke `medium` atau level non-`off` terdekat yang didukung untuk model tersebut, dan model yang tidak bernalar tetap `off`.

## Menetapkan default sesi

- Kirim pesan yang **hanya** berisi direktif (spasi diizinkan), misalnya `/think:medium` atau `/t high`.
- Itu berlaku untuk sesi saat ini (defaultnya per pengirim); dihapus oleh `/think:off` atau reset idle sesi.
- Balasan konfirmasi dikirim (`Thinking level set to high.` / `Thinking disabled.`). Jika level tidak valid (misalnya `/thinking big`), perintah ditolak dengan petunjuk dan status sesi dibiarkan tidak berubah.
- Kirim `/think` (atau `/think:`) tanpa argumen untuk melihat level thinking saat ini.

## Penerapan oleh agen

- **Pi tertanam**: level yang diselesaikan diteruskan ke runtime agen Pi dalam proses.
- **Backend CLI Claude**: level non-off diteruskan ke Claude Code sebagai `--effort` ketika menggunakan `claude-cli`; lihat [backend CLI](/id/gateway/cli-backends).

## Mode cepat (/fast)

- Level: `on|off`.
- Pesan yang hanya berisi direktif mengaktifkan atau menonaktifkan override mode cepat sesi dan membalas `Fast mode enabled.` / `Fast mode disabled.`.
- Kirim `/fast` (atau `/fast status`) tanpa mode untuk melihat status mode cepat efektif saat ini.
- OpenClaw menyelesaikan mode cepat dalam urutan ini:
  1. `/fast on|off` sebaris/hanya direktif
  2. Override sesi
  3. Default per agen (`agents.list[].fastModeDefault`)
  4. Konfigurasi per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Untuk `openai/*`, mode cepat dipetakan ke pemrosesan prioritas OpenAI dengan mengirim `service_tier=priority` pada permintaan Responses yang didukung.
- Untuk `openai-codex/*`, mode cepat mengirim flag `service_tier=priority` yang sama pada Responses Codex. OpenClaw mempertahankan satu toggle `/fast` bersama di kedua jalur autentikasi.
- Untuk permintaan publik langsung `anthropic/*`, termasuk lalu lintas terautentikasi OAuth yang dikirim ke `api.anthropic.com`, mode cepat dipetakan ke tingkat layanan Anthropic: `/fast on` menetapkan `service_tier=auto`, `/fast off` menetapkan `service_tier=standard_only`.
- Untuk `minimax/*` pada jalur kompatibel Anthropic, `/fast on` (atau `params.fastMode: true`) menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.
- Parameter model Anthropic `serviceTier` / `service_tier` eksplisit mengoverride default mode cepat ketika keduanya ditetapkan. OpenClaw tetap melewati injeksi tingkat layanan Anthropic untuk URL dasar proxy non-Anthropic.
- `/status` menampilkan `Fast` hanya ketika mode cepat diaktifkan.

## Direktif verbose (/verbose atau /v)

- Level: `on` (minimal) | `full` | `off` (default).
- Pesan yang hanya berisi direktif mengaktifkan atau menonaktifkan verbose sesi dan membalas `Verbose logging enabled.` / `Verbose logging disabled.`; level tidak valid mengembalikan petunjuk tanpa mengubah status.
- `/verbose off` menyimpan override sesi eksplisit; hapus melalui UI Sesi dengan memilih `inherit`.
- Direktif sebaris hanya memengaruhi pesan tersebut; default sesi/global berlaku jika tidak ada.
- Kirim `/verbose` (atau `/verbose:`) tanpa argumen untuk melihat level verbose saat ini.
- Ketika verbose aktif, agen yang memancarkan hasil alat terstruktur (Pi, agen JSON lain) mengirim setiap panggilan alat kembali sebagai pesan metadata-saja miliknya sendiri, diawali dengan `<emoji> <tool-name>: <arg>` ketika tersedia. Ringkasan alat ini dikirim segera setelah setiap alat dimulai (bubble terpisah), bukan sebagai delta streaming.
- Ringkasan kegagalan alat tetap terlihat dalam mode normal, tetapi sufiks detail error mentah disembunyikan kecuali verbose adalah `on` atau `full`.
- Ketika verbose adalah `full`, output alat juga diteruskan setelah selesai (bubble terpisah, dipotong ke panjang aman). Jika Anda mengubah `/verbose on|full|off` saat run sedang berlangsung, bubble alat berikutnya mengikuti pengaturan baru.
- `agents.defaults.toolProgressDetail` mengontrol bentuk ringkasan alat `/verbose` dan baris alat draf progres. Gunakan `"explain"` (default) untuk label manusia ringkas seperti `🛠️ Exec: checking JS syntax`; gunakan `"raw"` ketika Anda juga menginginkan perintah/detail mentah ditambahkan untuk debugging. `agents.list[].toolProgressDetail` per agen mengoverride default.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Direktif jejak Plugin (/trace)

- Level: `on` | `off` (default).
- Pesan yang hanya berisi direktif mengaktifkan atau menonaktifkan output jejak Plugin sesi dan membalas `Plugin trace enabled.` / `Plugin trace disabled.`.
- Direktif sebaris hanya memengaruhi pesan tersebut; default sesi/global berlaku jika tidak ada.
- Kirim `/trace` (atau `/trace:`) tanpa argumen untuk melihat level jejak saat ini.
- `/trace` lebih sempit daripada `/verbose`: ini hanya mengekspos baris jejak/debug milik Plugin seperti ringkasan debug Active Memory.
- Baris jejak dapat muncul di `/status` dan sebagai pesan diagnostik lanjutan setelah balasan asisten normal.

## Visibilitas penalaran (/reasoning)

- Level: `on|off|stream`.
- Pesan yang hanya berisi direktif mengaktifkan atau menonaktifkan apakah blok thinking ditampilkan dalam balasan.
- Ketika diaktifkan, penalaran dikirim sebagai **pesan terpisah** yang diawali dengan `Reasoning:`.
- `stream` (khusus Telegram): mengalirkan penalaran ke bubble draf Telegram saat balasan sedang dibuat, lalu mengirim jawaban final tanpa penalaran.
- Alias: `/reason`.
- Kirim `/reasoning` (atau `/reasoning:`) tanpa argumen untuk melihat level penalaran saat ini.
- Urutan resolusi: direktif sebaris, lalu override sesi, lalu default per agen (`agents.list[].reasoningDefault`), lalu fallback (`off`).

Tag penalaran model lokal yang salah bentuk ditangani secara konservatif. Blok `<think>...</think>` yang tertutup tetap disembunyikan pada balasan normal, dan penalaran yang tidak tertutup setelah teks yang sudah terlihat juga disembunyikan. Jika balasan sepenuhnya dibungkus dalam satu tag pembuka yang tidak tertutup dan jika tidak akan dikirim sebagai teks kosong, OpenClaw menghapus tag pembuka yang salah bentuk dan mengirim teks yang tersisa.

## Terkait

- Dokumentasi mode ditingkatkan ada di [Mode ditingkatkan](/id/tools/elevated).

## Heartbeat

- Badan probe Heartbeat adalah prompt Heartbeat yang dikonfigurasi (default: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Direktif sebaris dalam pesan Heartbeat berlaku seperti biasa (tetapi hindari mengubah default sesi dari Heartbeat).
- Pengiriman Heartbeat default ke payload final saja. Untuk juga mengirim pesan `Reasoning:` terpisah (ketika tersedia), tetapkan `agents.defaults.heartbeat.includeReasoning: true` atau per agen `agents.list[].heartbeat.includeReasoning: true`.

## UI chat web

- Pemilih thinking obrolan web mencerminkan level tersimpan sesi dari penyimpanan/konfigurasi sesi masuk saat halaman dimuat.
- Memilih level lain langsung menulis override sesi melalui `sessions.patch`; ini tidak menunggu pengiriman berikutnya dan bukan override sekali pakai `thinkingOnce`.
- Opsi pertama selalu menjadi pilihan untuk menghapus override. Opsi ini menampilkan `Diwarisi: <resolved level>` saat sesi mewarisi default efektif non-off, atau `Nonaktif` saat thinking yang diwarisi dinonaktifkan.
- Pilihan pemilih eksplisit diberi label sebagai override, sambil mempertahankan label provider bila ada (misalnya `Override: maximum` untuk opsi `max` berlabel provider).
- Pemilih menggunakan `thinkingLevels` yang dikembalikan oleh baris/default sesi gateway, dengan `thinkingOptions` dipertahankan sebagai daftar label legacy. UI browser tidak menyimpan daftar regex provider-nya sendiri; plugin memiliki kumpulan level khusus model.
- `/think:<level>` tetap berfungsi dan memperbarui level sesi tersimpan yang sama, sehingga direktif obrolan dan pemilih tetap sinkron.

## Profil provider

- Plugin provider dapat mengekspos `resolveThinkingProfile(ctx)` untuk mendefinisikan level yang didukung model dan default-nya.
- Plugin provider yang mem-proxy model Claude harus menggunakan kembali `resolveClaudeThinkingProfile(modelId)` dari `openclaw/plugin-sdk/provider-model-shared` agar katalog Anthropic langsung dan proxy tetap selaras.
- Setiap level profil memiliki `id` kanonis tersimpan (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, atau `max`) dan dapat menyertakan `label` tampilan. Provider biner menggunakan `{ id: "low", label: "on" }`.
- Plugin alat yang perlu memvalidasi override thinking eksplisit harus menggunakan `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)`; mereka tidak boleh menyimpan daftar level provider/model sendiri.
- Plugin alat dengan akses ke metadata model kustom yang dikonfigurasi dapat meneruskan `catalog` ke `resolveThinkingPolicy` agar opt-in `compat.supportedReasoningEfforts` tercermin dalam validasi sisi plugin.
- Hook legacy yang dipublikasikan (`supportsXHighThinking`, `isBinaryThinking`, dan `resolveDefaultThinkingLevel`) tetap sebagai adaptor kompatibilitas, tetapi kumpulan level kustom baru harus menggunakan `resolveThinkingProfile`.
- Baris/default Gateway mengekspos `thinkingLevels`, `thinkingOptions`, dan `thinkingDefault` agar klien ACP/obrolan merender id dan label profil yang sama dengan yang digunakan validasi runtime.
