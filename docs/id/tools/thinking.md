---
read_when:
    - Menyesuaikan penguraian atau nilai bawaan direktif `thinking`, `fast-mode`, atau `verbose`
summary: Sintaks direktif untuk /think, /fast, /verbose, /trace, dan visibilitas penalaran
title: Tingkat berpikir
x-i18n:
    generated_at: "2026-05-04T18:24:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcd1cd76ca5d0b08656e0629df656ad8aa037201d8de68093b3e46eb0708f811
    source_path: tools/thinking.md
    workflow: 16
---

## Apa yang dilakukan

- Arahan inline dalam isi masuk apa pun: `/t <level>`, `/think:<level>`, atau `/thinking <level>`.
- Level (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “berpikir”
  - low → “berpikir keras”
  - medium → “berpikir lebih keras”
  - high → “ultrathink” (anggaran maks)
  - xhigh → “ultrathink+” (model GPT-5.2+ dan Codex, ditambah upaya Anthropic Claude Opus 4.7)
  - adaptive → pemikiran adaptif yang dikelola penyedia (didukung untuk Claude 4.6 di Anthropic/Bedrock, Anthropic Claude Opus 4.7, dan pemikiran dinamis Google Gemini)
  - max → penalaran maks penyedia (Anthropic Claude Opus 4.7; Ollama memetakan ini ke upaya native `think` tertingginya)
  - `x-high`, `x_high`, `extra-high`, `extra high`, dan `extra_high` dipetakan ke `xhigh`.
  - `highest` dipetakan ke `high`.
- Catatan penyedia:
  - Menu dan pemilih pemikiran digerakkan oleh profil penyedia. Plugin penyedia mendeklarasikan set level persis untuk model yang dipilih, termasuk label seperti biner `on`.
  - `adaptive`, `xhigh`, dan `max` hanya ditampilkan untuk profil penyedia/model yang mendukungnya. Arahan yang diketik untuk level yang tidak didukung ditolak dengan opsi valid model tersebut.
  - Level tidak didukung yang tersimpan sebelumnya dipetakan ulang berdasarkan peringkat profil penyedia. `adaptive` kembali ke `medium` pada model non-adaptif, sedangkan `xhigh` dan `max` kembali ke level non-`off` terbesar yang didukung untuk model yang dipilih.
  - Model Anthropic Claude 4.6 default ke `adaptive` saat tidak ada level pemikiran eksplisit yang ditetapkan.
  - Anthropic Claude Opus 4.7 tidak default ke pemikiran adaptif. Default upaya API-nya tetap dimiliki penyedia kecuali Anda secara eksplisit menetapkan level pemikiran.
  - Anthropic Claude Opus 4.7 memetakan `/think xhigh` ke pemikiran adaptif ditambah `output_config.effort: "xhigh"`, karena `/think` adalah arahan pemikiran dan `xhigh` adalah pengaturan upaya Opus 4.7.
  - Anthropic Claude Opus 4.7 juga mengekspos `/think max`; ini dipetakan ke jalur upaya maks yang sama milik penyedia.
  - Model DeepSeek V4 mengekspos `/think xhigh|max`; keduanya dipetakan ke DeepSeek `reasoning_effort: "max"` sedangkan level non-`off` yang lebih rendah dipetakan ke `high`.
  - Model Ollama yang mampu berpikir mengekspos `/think low|medium|high|max`; `max` dipetakan ke native `think: "high"` karena API native Ollama menerima string upaya `low`, `medium`, dan `high`.
  - Model OpenAI GPT memetakan `/think` melalui dukungan upaya Responses API khusus model. `/think off` mengirim `reasoning.effort: "none"` hanya saat model target mendukungnya; jika tidak, OpenClaw menghilangkan payload penalaran yang dinonaktifkan alih-alih mengirim nilai yang tidak didukung.
  - Entri katalog kustom yang kompatibel dengan OpenAI dapat ikut memakai `/think xhigh` dengan menetapkan `models.providers.<provider>.models[].compat.supportedReasoningEfforts` agar menyertakan `"xhigh"`. Ini menggunakan metadata kompat yang sama yang memetakan payload upaya penalaran OpenAI keluar, sehingga menu, validasi sesi, CLI agen, dan `llm-task` selaras dengan perilaku transport.
  - Ref OpenRouter Hunter Alpha terkonfigurasi yang usang melewati injeksi penalaran proxy karena rute yang sudah dihentikan itu dapat mengembalikan teks jawaban akhir melalui field penalaran.
  - Google Gemini memetakan `/think adaptive` ke pemikiran dinamis milik penyedia Gemini. Permintaan Gemini 3 menghilangkan `thinkingLevel` tetap, sedangkan permintaan Gemini 2.5 mengirim `thinkingBudget: -1`; level tetap tetap dipetakan ke `thinkingLevel` atau anggaran Gemini terdekat untuk keluarga model tersebut.
  - MiniMax (`minimax/*`) pada jalur streaming yang kompatibel dengan Anthropic default ke `thinking: { type: "disabled" }` kecuali Anda secara eksplisit menetapkan pemikiran di parameter model atau parameter permintaan. Ini menghindari delta `reasoning_content` yang bocor dari format stream Anthropic non-native milik MiniMax.
  - Z.AI (`zai/*`) hanya mendukung pemikiran biner (`on`/`off`). Level non-`off` apa pun diperlakukan sebagai `on` (dipetakan ke `low`).
  - Moonshot (`moonshot/*`) memetakan `/think off` ke `thinking: { type: "disabled" }` dan level non-`off` apa pun ke `thinking: { type: "enabled" }`. Saat pemikiran diaktifkan, Moonshot hanya menerima `tool_choice` `auto|none`; OpenClaw menormalkan nilai yang tidak kompatibel menjadi `auto`.

## Urutan resolusi

1. Arahan inline pada pesan (berlaku hanya untuk pesan itu).
2. Override sesi (ditetapkan dengan mengirim pesan yang hanya berisi arahan).
3. Default per agen (`agents.list[].thinkingDefault` dalam konfigurasi).
4. Default global (`agents.defaults.thinkingDefault` dalam konfigurasi).
5. Fallback: default yang dideklarasikan penyedia saat tersedia; jika tidak, model yang mampu bernalar diselesaikan ke `medium` atau level non-`off` terdekat yang didukung untuk model tersebut, dan model non-penalaran tetap `off`.

## Menetapkan default sesi

- Kirim pesan yang **hanya** berisi arahan (spasi kosong diperbolehkan), misalnya `/think:medium` atau `/t high`.
- Itu berlaku untuk sesi saat ini (default per pengirim); dihapus oleh `/think:off` atau reset sesi menganggur.
- Balasan konfirmasi dikirim (`Thinking level set to high.` / `Thinking disabled.`). Jika level tidak valid (misalnya `/thinking big`), perintah ditolak dengan petunjuk dan status sesi dibiarkan tidak berubah.
- Kirim `/think` (atau `/think:`) tanpa argumen untuk melihat level pemikiran saat ini.

## Penerapan berdasarkan agen

- **Pi tertanam**: level yang diselesaikan diteruskan ke runtime agen Pi dalam proses.
- **Backend Claude CLI**: level non-off diteruskan ke Claude Code sebagai `--effort` saat menggunakan `claude-cli`; lihat [Backend CLI](/id/gateway/cli-backends).

## Mode cepat (/fast)

- Level: `on|off`.
- Pesan yang hanya berisi arahan mengaktifkan/menonaktifkan override mode cepat sesi dan membalas `Fast mode enabled.` / `Fast mode disabled.`.
- Kirim `/fast` (atau `/fast status`) tanpa mode untuk melihat status mode cepat efektif saat ini.
- OpenClaw menyelesaikan mode cepat dalam urutan ini:
  1. Inline/hanya-arahan `/fast on|off`
  2. Override sesi
  3. Default per agen (`agents.list[].fastModeDefault`)
  4. Konfigurasi per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Untuk `openai/*`, mode cepat dipetakan ke pemrosesan prioritas OpenAI dengan mengirim `service_tier=priority` pada permintaan Responses yang didukung.
- Untuk `openai-codex/*`, mode cepat mengirim flag `service_tier=priority` yang sama pada Codex Responses. OpenClaw mempertahankan satu toggle `/fast` bersama di kedua jalur autentikasi.
- Untuk permintaan publik langsung `anthropic/*`, termasuk lalu lintas terautentikasi OAuth yang dikirim ke `api.anthropic.com`, mode cepat dipetakan ke tingkat layanan Anthropic: `/fast on` menetapkan `service_tier=auto`, `/fast off` menetapkan `service_tier=standard_only`.
- Untuk `minimax/*` pada jalur yang kompatibel dengan Anthropic, `/fast on` (atau `params.fastMode: true`) menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.
- Parameter model Anthropic `serviceTier` / `service_tier` eksplisit meng-override default mode cepat saat keduanya ditetapkan. OpenClaw tetap melewati injeksi tingkat layanan Anthropic untuk URL dasar proxy non-Anthropic.
- `/status` menampilkan `Fast` hanya saat mode cepat diaktifkan.

## Arahan verbose (/verbose atau /v)

- Level: `on` (minimal) | `full` | `off` (default).
- Pesan yang hanya berisi arahan mengaktifkan/menonaktifkan verbose sesi dan membalas `Verbose logging enabled.` / `Verbose logging disabled.`; level tidak valid mengembalikan petunjuk tanpa mengubah status.
- `/verbose off` menyimpan override sesi eksplisit; hapus melalui UI Sesi dengan memilih `inherit`.
- Arahan inline hanya memengaruhi pesan itu; default sesi/global berlaku selain itu.
- Kirim `/verbose` (atau `/verbose:`) tanpa argumen untuk melihat level verbose saat ini.
- Saat verbose aktif, agen yang memancarkan hasil alat terstruktur (Pi, agen JSON lain) mengirim setiap panggilan alat kembali sebagai pesan metadata-saja miliknya sendiri, diawali dengan `<emoji> <tool-name>: <arg>` saat tersedia. Ringkasan alat ini dikirim segera saat setiap alat dimulai (bubble terpisah), bukan sebagai delta streaming.
- Ringkasan kegagalan alat tetap terlihat dalam mode normal, tetapi sufiks detail kesalahan mentah disembunyikan kecuali verbose adalah `on` atau `full`.
- Saat verbose adalah `full`, output alat juga diteruskan setelah selesai (bubble terpisah, dipotong ke panjang aman). Jika Anda mengalihkan `/verbose on|full|off` saat run sedang berjalan, bubble alat berikutnya mengikuti pengaturan baru.
- `agents.defaults.toolProgressDetail` mengontrol bentuk ringkasan alat `/verbose` dan baris alat draft progres. Gunakan `"explain"` (default) untuk label manusia ringkas seperti `🛠️ Exec: checking JS syntax`; gunakan `"raw"` saat Anda juga menginginkan perintah/detail mentah ditambahkan untuk debugging. `agents.list[].toolProgressDetail` per agen meng-override default.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Arahan trace Plugin (/trace)

- Level: `on` | `off` (default).
- Pesan yang hanya berisi arahan mengaktifkan/menonaktifkan output trace Plugin sesi dan membalas `Plugin trace enabled.` / `Plugin trace disabled.`.
- Arahan inline hanya memengaruhi pesan itu; default sesi/global berlaku selain itu.
- Kirim `/trace` (atau `/trace:`) tanpa argumen untuk melihat level trace saat ini.
- `/trace` lebih sempit daripada `/verbose`: ini hanya mengekspos baris trace/debug milik Plugin seperti ringkasan debug Active Memory.
- Baris trace dapat muncul di `/status` dan sebagai pesan diagnostik lanjutan setelah balasan asisten normal.

## Visibilitas penalaran (/reasoning)

- Level: `on|off|stream`.
- Pesan yang hanya berisi arahan mengaktifkan/menonaktifkan apakah blok pemikiran ditampilkan dalam balasan.
- Saat diaktifkan, penalaran dikirim sebagai **pesan terpisah** dengan prefiks `Reasoning:`.
- `stream` (khusus Telegram): mengalirkan penalaran ke bubble draft Telegram saat balasan sedang dibuat, lalu mengirim jawaban akhir tanpa penalaran.
- Alias: `/reason`.
- Kirim `/reasoning` (atau `/reasoning:`) tanpa argumen untuk melihat level penalaran saat ini.
- Urutan resolusi: arahan inline, lalu override sesi, lalu default per agen (`agents.list[].reasoningDefault`), lalu fallback (`off`).

Tag penalaran model lokal yang salah bentuk ditangani secara konservatif. Blok `<think>...</think>` tertutup tetap tersembunyi pada balasan normal, dan penalaran yang tidak tertutup setelah teks yang sudah terlihat juga disembunyikan. Jika balasan sepenuhnya dibungkus dalam satu tag pembuka yang tidak tertutup dan jika tidak akan dikirim sebagai teks kosong, OpenClaw menghapus tag pembuka yang salah bentuk dan mengirim teks yang tersisa.

## Terkait

- Dokumentasi mode tinggi tersedia di [Mode tinggi](/id/tools/elevated).

## Heartbeat

- Isi probe Heartbeat adalah prompt heartbeat yang dikonfigurasi (default: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Arahan inline dalam pesan heartbeat berlaku seperti biasa (tetapi hindari mengubah default sesi dari heartbeat).
- Pengiriman Heartbeat default hanya ke payload akhir. Untuk juga mengirim pesan `Reasoning:` terpisah (saat tersedia), tetapkan `agents.defaults.heartbeat.includeReasoning: true` atau per agen `agents.list[].heartbeat.includeReasoning: true`.

## UI chat web

- Pemilih pemikiran chat web mencerminkan level tersimpan sesi dari penyimpanan/konfigurasi sesi masuk saat halaman dimuat.
- Memilih level lain langsung menulis override sesi melalui `sessions.patch`; ini tidak menunggu pengiriman berikutnya dan bukan override sekali pakai `thinkingOnce`.
- Opsi pertama selalu `Default (<resolved level>)`, dengan default terselesaikan berasal dari profil pemikiran penyedia model sesi aktif ditambah logika fallback yang sama yang digunakan `/status` dan `session_status`.
- Pemilih menggunakan `thinkingLevels` yang dikembalikan oleh baris/default sesi Gateway, dengan `thinkingOptions` dipertahankan sebagai daftar label lama. UI browser tidak menyimpan daftar regex penyedianya sendiri; Plugin memiliki set level khusus model.
- `/think:<level>` tetap berfungsi dan memperbarui level sesi tersimpan yang sama, sehingga arahan chat dan pemilih tetap sinkron.

## Profil penyedia

- Plugin penyedia dapat mengekspos `resolveThinkingProfile(ctx)` untuk mendefinisikan tingkat yang didukung model dan bawaannya.
- Plugin penyedia yang memproksikan model Claude sebaiknya menggunakan kembali `resolveClaudeThinkingProfile(modelId)` dari `openclaw/plugin-sdk/provider-model-shared` agar katalog Anthropic langsung dan proksi tetap selaras.
- Setiap tingkat profil memiliki `id` kanonis yang disimpan (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, atau `max`) dan dapat menyertakan `label` tampilan. Penyedia biner menggunakan `{ id: "low", label: "on" }`.
- Plugin alat yang perlu memvalidasi penggantian berpikir eksplisit sebaiknya menggunakan `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)`; mereka tidak sebaiknya menyimpan daftar tingkat penyedia/model sendiri.
- Plugin alat dengan akses ke metadata model kustom yang dikonfigurasi dapat meneruskan `catalog` ke `resolveThinkingPolicy` agar opt-in `compat.supportedReasoningEfforts` tercermin dalam validasi sisi Plugin.
- Hook lama yang dipublikasikan (`supportsXHighThinking`, `isBinaryThinking`, dan `resolveDefaultThinkingLevel`) tetap ada sebagai adaptor kompatibilitas, tetapi set tingkat kustom baru sebaiknya menggunakan `resolveThinkingProfile`.
- Baris/bawaan Gateway mengekspos `thinkingLevels`, `thinkingOptions`, dan `thinkingDefault` agar klien ACP/chat merender id dan label profil yang sama dengan yang digunakan validasi runtime.
