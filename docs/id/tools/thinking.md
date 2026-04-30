---
read_when:
    - Menyesuaikan penguraian atau default untuk direktif thinking, fast-mode, atau verbose
summary: Sintaks direktif untuk /think, /fast, /verbose, /trace, dan visibilitas penalaran
title: Tingkat berpikir
x-i18n:
    generated_at: "2026-04-30T16:31:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9adf065e46cb64e4c2149b95ecd69ed887a17e2eff5a5569894defa3e7217b7
    source_path: tools/thinking.md
    workflow: 16
---

## Apa fungsinya

- Direktif inline dalam body masuk apa pun: `/t <level>`, `/think:<level>`, atau `/thinking <level>`.
- Level (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (anggaran maksimum)
  - xhigh → “ultrathink+” (model GPT-5.2+ dan Codex, ditambah effort Anthropic Claude Opus 4.7)
  - adaptive → pemikiran adaptif yang dikelola penyedia (didukung untuk Claude 4.6 di Anthropic/Bedrock, Anthropic Claude Opus 4.7, dan pemikiran dinamis Google Gemini)
  - max → penalaran maksimum penyedia (Anthropic Claude Opus 4.7; Ollama memetakannya ke effort `think` native tertingginya)
  - `x-high`, `x_high`, `extra-high`, `extra high`, dan `extra_high` dipetakan ke `xhigh`.
  - `highest` dipetakan ke `high`.
- Catatan penyedia:
  - Menu dan pemilih berpikir digerakkan oleh profil penyedia. Plugin penyedia mendeklarasikan kumpulan level persis untuk model yang dipilih, termasuk label seperti `on` biner.
  - `adaptive`, `xhigh`, dan `max` hanya diiklankan untuk profil penyedia/model yang mendukungnya. Direktif yang diketik untuk level yang tidak didukung ditolak dengan opsi valid model tersebut.
  - Level tidak didukung tersimpan yang ada dipetakan ulang berdasarkan peringkat profil penyedia. `adaptive` kembali ke `medium` pada model non-adaptif, sedangkan `xhigh` dan `max` kembali ke level non-`off` terbesar yang didukung untuk model yang dipilih.
  - Model Anthropic Claude 4.6 secara default menggunakan `adaptive` ketika tidak ada level berpikir eksplisit yang ditetapkan.
  - Anthropic Claude Opus 4.7 tidak secara default menggunakan pemikiran adaptif. Default effort API-nya tetap dimiliki penyedia kecuali Anda menetapkan level berpikir secara eksplisit.
  - Anthropic Claude Opus 4.7 memetakan `/think xhigh` ke pemikiran adaptif ditambah `output_config.effort: "xhigh"`, karena `/think` adalah direktif berpikir dan `xhigh` adalah pengaturan effort Opus 4.7.
  - Anthropic Claude Opus 4.7 juga mengekspos `/think max`; ini dipetakan ke jalur effort maksimum milik penyedia yang sama.
  - Model DeepSeek V4 mengekspos `/think xhigh|max`; keduanya dipetakan ke DeepSeek `reasoning_effort: "max"` sementara level non-`off` yang lebih rendah dipetakan ke `high`.
  - Model Ollama yang mendukung berpikir mengekspos `/think low|medium|high|max`; `max` dipetakan ke native `think: "high"` karena API native Ollama menerima string effort `low`, `medium`, dan `high`.
  - Model GPT OpenAI memetakan `/think` melalui dukungan effort Responses API khusus model. `/think off` mengirim `reasoning.effort: "none"` hanya ketika model target mendukungnya; jika tidak, OpenClaw menghilangkan payload penalaran yang dinonaktifkan alih-alih mengirim nilai yang tidak didukung.
  - Entri katalog kustom yang kompatibel dengan OpenAI dapat mengaktifkan `/think xhigh` dengan mengatur `models.providers.<provider>.models[].compat.supportedReasoningEfforts` agar menyertakan `"xhigh"`. Ini menggunakan metadata compat yang sama yang memetakan payload effort penalaran OpenAI keluar, sehingga menu, validasi sesi, CLI agen, dan `llm-task` selaras dengan perilaku transport.
  - Ref OpenRouter Hunter Alpha terkonfigurasi yang usang melewati injeksi penalaran proxy karena rute yang sudah dihentikan itu dapat mengembalikan teks jawaban akhir melalui field penalaran.
  - Google Gemini memetakan `/think adaptive` ke pemikiran dinamis milik penyedia Gemini. Permintaan Gemini 3 menghilangkan `thinkingLevel` tetap, sedangkan permintaan Gemini 2.5 mengirim `thinkingBudget: -1`; level tetap tetap dipetakan ke `thinkingLevel` atau anggaran Gemini terdekat untuk keluarga model tersebut.
  - MiniMax (`minimax/*`) pada jalur streaming yang kompatibel dengan Anthropic secara default menggunakan `thinking: { type: "disabled" }` kecuali Anda menetapkan berpikir secara eksplisit dalam parameter model atau parameter permintaan. Ini menghindari delta `reasoning_content` yang bocor dari format stream Anthropic non-native MiniMax.
  - Z.AI (`zai/*`) hanya mendukung berpikir biner (`on`/`off`). Level non-`off` apa pun diperlakukan sebagai `on` (dipetakan ke `low`).
  - Moonshot (`moonshot/*`) memetakan `/think off` ke `thinking: { type: "disabled" }` dan level non-`off` apa pun ke `thinking: { type: "enabled" }`. Saat berpikir diaktifkan, Moonshot hanya menerima `tool_choice` `auto|none`; OpenClaw menormalkan nilai yang tidak kompatibel ke `auto`.

## Urutan resolusi

1. Direktif inline pada pesan (hanya berlaku untuk pesan tersebut).
2. Override sesi (diatur dengan mengirim pesan yang hanya berisi direktif).
3. Default per agen (`agents.list[].thinkingDefault` dalam konfigurasi).
4. Default global (`agents.defaults.thinkingDefault` dalam konfigurasi).
5. Fallback: default yang dideklarasikan penyedia saat tersedia; jika tidak, model yang mendukung penalaran diselesaikan ke `medium` atau level non-`off` terdekat yang didukung untuk model tersebut, dan model non-penalaran tetap `off`.

## Mengatur default sesi

- Kirim pesan yang **hanya** berisi direktif (spasi kosong diperbolehkan), misalnya `/think:medium` atau `/t high`.
- Itu bertahan untuk sesi saat ini (secara default per-pengirim); dibersihkan oleh `/think:off` atau reset idle sesi.
- Balasan konfirmasi dikirim (`Thinking level set to high.` / `Thinking disabled.`). Jika level tidak valid (misalnya `/thinking big`), perintah ditolak dengan petunjuk dan status sesi dibiarkan tidak berubah.
- Kirim `/think` (atau `/think:`) tanpa argumen untuk melihat level berpikir saat ini.

## Penerapan oleh agen

- **Pi tertanam**: level yang diselesaikan diteruskan ke runtime agen Pi dalam proses.

## Mode cepat (/fast)

- Level: `on|off`.
- Pesan yang hanya berisi direktif mengalihkan override mode cepat sesi dan membalas `Fast mode enabled.` / `Fast mode disabled.`.
- Kirim `/fast` (atau `/fast status`) tanpa mode untuk melihat status mode cepat efektif saat ini.
- OpenClaw menyelesaikan mode cepat dalam urutan ini:
  1. Inline/hanya-direktif `/fast on|off`
  2. Override sesi
  3. Default per agen (`agents.list[].fastModeDefault`)
  4. Konfigurasi per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Untuk `openai/*`, mode cepat dipetakan ke pemrosesan prioritas OpenAI dengan mengirim `service_tier=priority` pada permintaan Responses yang didukung.
- Untuk `openai-codex/*`, mode cepat mengirim flag `service_tier=priority` yang sama pada Codex Responses. OpenClaw mempertahankan satu toggle `/fast` bersama di kedua jalur auth.
- Untuk permintaan publik langsung `anthropic/*`, termasuk traffic terautentikasi OAuth yang dikirim ke `api.anthropic.com`, mode cepat dipetakan ke tier layanan Anthropic: `/fast on` menetapkan `service_tier=auto`, `/fast off` menetapkan `service_tier=standard_only`.
- Untuk `minimax/*` pada jalur yang kompatibel dengan Anthropic, `/fast on` (atau `params.fastMode: true`) menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.
- Parameter model Anthropic `serviceTier` / `service_tier` eksplisit mengoverride default mode cepat ketika keduanya ditetapkan. OpenClaw tetap melewati injeksi tier layanan Anthropic untuk URL basis proxy non-Anthropic.
- `/status` menampilkan `Fast` hanya ketika mode cepat diaktifkan.

## Direktif verbose (/verbose atau /v)

- Level: `on` (minimal) | `full` | `off` (default).
- Pesan yang hanya berisi direktif mengalihkan verbose sesi dan membalas `Verbose logging enabled.` / `Verbose logging disabled.`; level tidak valid mengembalikan petunjuk tanpa mengubah status.
- `/verbose off` menyimpan override sesi eksplisit; bersihkan melalui UI Sessions dengan memilih `inherit`.
- Direktif inline hanya memengaruhi pesan tersebut; default sesi/global berlaku selain itu.
- Kirim `/verbose` (atau `/verbose:`) tanpa argumen untuk melihat level verbose saat ini.
- Saat verbose aktif, agen yang memancarkan hasil tool terstruktur (Pi, agen JSON lain) mengirim setiap panggilan tool kembali sebagai pesan khusus metadata tersendiri, diawali dengan `<emoji> <tool-name>: <arg>` jika tersedia (path/command). Ringkasan tool ini dikirim segera ketika setiap tool dimulai (bubble terpisah), bukan sebagai delta streaming.
- Ringkasan kegagalan tool tetap terlihat dalam mode normal, tetapi sufiks detail error mentah disembunyikan kecuali verbose adalah `on` atau `full`.
- Saat verbose adalah `full`, output tool juga diteruskan setelah selesai (bubble terpisah, dipotong ke panjang aman). Jika Anda mengalihkan `/verbose on|full|off` saat run sedang berjalan, bubble tool berikutnya mengikuti pengaturan baru.

## Direktif trace Plugin (/trace)

- Level: `on` | `off` (default).
- Pesan yang hanya berisi direktif mengalihkan output trace Plugin sesi dan membalas `Plugin trace enabled.` / `Plugin trace disabled.`.
- Direktif inline hanya memengaruhi pesan tersebut; default sesi/global berlaku selain itu.
- Kirim `/trace` (atau `/trace:`) tanpa argumen untuk melihat level trace saat ini.
- `/trace` lebih sempit daripada `/verbose`: ini hanya mengekspos baris trace/debug milik Plugin seperti ringkasan debug Active Memory.
- Baris trace dapat muncul di `/status` dan sebagai pesan diagnostik lanjutan setelah balasan asisten normal.

## Visibilitas penalaran (/reasoning)

- Level: `on|off|stream`.
- Pesan yang hanya berisi direktif mengalihkan apakah blok berpikir ditampilkan dalam balasan.
- Saat diaktifkan, penalaran dikirim sebagai **pesan terpisah** yang diawali dengan `Reasoning:`.
- `stream` (hanya Telegram): melakukan streaming penalaran ke bubble draf Telegram saat balasan sedang dibuat, lalu mengirim jawaban akhir tanpa penalaran.
- Alias: `/reason`.
- Kirim `/reasoning` (atau `/reasoning:`) tanpa argumen untuk melihat level penalaran saat ini.
- Urutan resolusi: direktif inline, lalu override sesi, lalu default per agen (`agents.list[].reasoningDefault`), lalu fallback (`off`).

Tag penalaran model lokal yang malformasi ditangani secara konservatif. Blok `<think>...</think>` tertutup tetap disembunyikan pada balasan normal, dan penalaran yang tidak tertutup setelah teks yang sudah terlihat juga disembunyikan. Jika balasan sepenuhnya dibungkus dalam satu tag pembuka yang tidak tertutup dan jika tidak akan terkirim sebagai teks kosong, OpenClaw menghapus tag pembuka yang malformasi dan mengirim teks yang tersisa.

## Terkait

- Dokumentasi mode elevated ada di [Mode elevated](/id/tools/elevated).

## Heartbeat

- Body probe Heartbeat adalah prompt Heartbeat yang dikonfigurasi (default: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Direktif inline dalam pesan Heartbeat berlaku seperti biasa (tetapi hindari mengubah default sesi dari Heartbeat).
- Pengiriman Heartbeat secara default hanya menggunakan payload final. Untuk juga mengirim pesan `Reasoning:` terpisah (jika tersedia), tetapkan `agents.defaults.heartbeat.includeReasoning: true` atau per agen `agents.list[].heartbeat.includeReasoning: true`.

## UI chat web

- Pemilih berpikir chat web mencerminkan level tersimpan sesi dari penyimpanan sesi masuk/konfigurasi saat halaman dimuat.
- Memilih level lain langsung menulis override sesi melalui `sessions.patch`; ini tidak menunggu pengiriman berikutnya dan bukan override satu kali `thinkingOnce`.
- Opsi pertama selalu `Default (<resolved level>)`, dengan default yang diselesaikan berasal dari profil berpikir penyedia model sesi aktif ditambah logika fallback yang sama yang digunakan `/status` dan `session_status`.
- Pemilih menggunakan `thinkingLevels` yang dikembalikan oleh baris/default sesi Gateway, dengan `thinkingOptions` dipertahankan sebagai daftar label legacy. UI browser tidak menyimpan daftar regex penyedia sendiri; Plugin memiliki kumpulan level khusus model.
- `/think:<level>` tetap berfungsi dan memperbarui level sesi tersimpan yang sama, sehingga direktif chat dan pemilih tetap sinkron.

## Profil penyedia

- Plugin penyedia dapat mengekspos `resolveThinkingProfile(ctx)` untuk menentukan level yang didukung model dan default-nya.
- Plugin penyedia yang mem-proxy model Claude harus menggunakan kembali `resolveClaudeThinkingProfile(modelId)` dari `openclaw/plugin-sdk/provider-model-shared` agar katalog Anthropic langsung dan proxy tetap selaras.
- Setiap level profil memiliki `id` kanonis tersimpan (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, atau `max`) dan dapat menyertakan `label` tampilan. Penyedia biner menggunakan `{ id: "low", label: "on" }`.
- Plugin alat yang perlu memvalidasi override thinking eksplisit harus menggunakan `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)`; mereka tidak boleh menyimpan daftar level penyedia/model sendiri.
- Plugin alat dengan akses ke metadata model kustom yang dikonfigurasi dapat meneruskan `catalog` ke `resolveThinkingPolicy` agar opt-in `compat.supportedReasoningEfforts` tercermin dalam validasi sisi plugin.
- Hook warisan yang dipublikasikan (`supportsXHighThinking`, `isBinaryThinking`, dan `resolveDefaultThinkingLevel`) tetap ada sebagai adaptor kompatibilitas, tetapi kumpulan level kustom baru harus menggunakan `resolveThinkingProfile`.
- Baris/default Gateway mengekspos `thinkingLevels`, `thinkingOptions`, dan `thinkingDefault` agar klien ACP/chat merender id dan label profil yang sama dengan yang digunakan validasi runtime.
