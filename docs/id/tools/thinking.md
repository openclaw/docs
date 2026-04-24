---
read_when:
    - Menyesuaikan parsing atau default directive thinking, mode cepat, atau verbose
summary: Sintaks directive untuk /think, /fast, /verbose, /trace, dan visibilitas reasoning
title: Tingkat thinking
x-i18n:
    generated_at: "2026-04-24T09:33:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc251ffa601646bf8672200b416661ae91fb21ff84525eedf6d6c538ff0e36cf
    source_path: tools/thinking.md
    workflow: 15
---

## Apa yang dilakukan

- Directive inline di body masuk apa pun: `/t <level>`, `/think:<level>`, atau `/thinking <level>`.
- Level (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (anggaran maksimum)
  - xhigh → “ultrathink+” (model GPT-5.2+ dan Codex, serta effort Anthropic Claude Opus 4.7)
  - adaptive → thinking adaptif yang dikelola provider (didukung untuk Claude 4.6 di Anthropic/Bedrock dan Anthropic Claude Opus 4.7)
  - max → reasoning maksimum provider (saat ini Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high`, dan `extra_high` dipetakan ke `xhigh`.
  - `highest` dipetakan ke `high`.
- Catatan provider:
  - Menu dan picker thinking digerakkan oleh profil provider. Plugin provider mendeklarasikan himpunan level yang tepat untuk model yang dipilih, termasuk label seperti `on` biner.
  - `adaptive`, `xhigh`, dan `max` hanya diiklankan untuk profil provider/model yang mendukungnya. Directive yang diketik untuk level yang tidak didukung akan ditolak dengan opsi valid untuk model tersebut.
  - Level tersimpan yang tidak didukung dipetakan ulang berdasarkan peringkat profil provider. `adaptive` fallback ke `medium` pada model non-adaptif, sementara `xhigh` dan `max` fallback ke level non-`off` tertinggi yang didukung untuk model yang dipilih.
  - Model Anthropic Claude 4.6 default ke `adaptive` saat tidak ada level thinking eksplisit yang ditetapkan.
  - Anthropic Claude Opus 4.7 tidak default ke thinking adaptif. Default effort API-nya tetap dimiliki provider kecuali Anda secara eksplisit menetapkan level thinking.
  - Anthropic Claude Opus 4.7 memetakan `/think xhigh` ke thinking adaptif plus `output_config.effort: "xhigh"`, karena `/think` adalah directive thinking dan `xhigh` adalah pengaturan effort Opus 4.7.
  - Anthropic Claude Opus 4.7 juga mengekspos `/think max`; ini dipetakan ke jalur effort maksimum milik provider yang sama.
  - Model OpenAI GPT memetakan `/think` melalui dukungan effort Responses API khusus model. `/think off` mengirim `reasoning.effort: "none"` hanya saat model target mendukungnya; jika tidak, OpenClaw menghilangkan payload reasoning yang dinonaktifkan alih-alih mengirim nilai yang tidak didukung.
  - MiniMax (`minimax/*`) pada jalur streaming yang kompatibel dengan Anthropic default ke `thinking: { type: "disabled" }` kecuali Anda secara eksplisit menetapkan thinking di param model atau param permintaan. Ini menghindari delta `reasoning_content` yang bocor dari format stream Anthropic non-native MiniMax.
  - Z.AI (`zai/*`) hanya mendukung thinking biner (`on`/`off`). Level apa pun selain `off` diperlakukan sebagai `on` (dipetakan ke `low`).
  - Moonshot (`moonshot/*`) memetakan `/think off` ke `thinking: { type: "disabled" }` dan level apa pun selain `off` ke `thinking: { type: "enabled" }`. Saat thinking diaktifkan, Moonshot hanya menerima `tool_choice` `auto|none`; OpenClaw menormalkan nilai yang tidak kompatibel ke `auto`.

## Urutan resolusi

1. Directive inline pada pesan (hanya berlaku untuk pesan itu).
2. Override sesi (ditetapkan dengan mengirim pesan yang hanya berisi directive).
3. Default per agen (`agents.list[].thinkingDefault` dalam konfigurasi).
4. Default global (`agents.defaults.thinkingDefault` dalam konfigurasi).
5. Fallback: default yang dideklarasikan provider jika tersedia; jika tidak, model yang mendukung reasoning di-resolve ke `medium` atau level non-`off` terdekat yang didukung untuk model tersebut, dan model non-reasoning tetap `off`.

## Menetapkan default sesi

- Kirim pesan yang **hanya** berisi directive (whitespace diperbolehkan), misalnya `/think:medium` atau `/t high`.
- Ini akan melekat untuk sesi saat ini (default per pengirim); dihapus oleh `/think:off` atau reset idle sesi.
- Balasan konfirmasi dikirim (`Thinking level set to high.` / `Thinking disabled.`). Jika level tidak valid (misalnya `/thinking big`), perintah ditolak dengan petunjuk dan state sesi dibiarkan tidak berubah.
- Kirim `/think` (atau `/think:`) tanpa argumen untuk melihat level thinking saat ini.

## Penerapan oleh agen

- **Pi tertanam**: level yang di-resolve diteruskan ke runtime agen Pi dalam proses.

## Mode cepat (/fast)

- Level: `on|off`.
- Pesan yang hanya berisi directive mengalihkan override mode cepat sesi dan membalas `Fast mode enabled.` / `Fast mode disabled.`.
- Kirim `/fast` (atau `/fast status`) tanpa mode untuk melihat state mode cepat efektif saat ini.
- OpenClaw me-resolve mode cepat dalam urutan ini:
  1. Inline/directive-only `/fast on|off`
  2. Override sesi
  3. Default per agen (`agents.list[].fastModeDefault`)
  4. Konfigurasi per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Untuk `openai/*`, mode cepat dipetakan ke pemrosesan prioritas OpenAI dengan mengirim `service_tier=priority` pada permintaan Responses yang didukung.
- Untuk `openai-codex/*`, mode cepat mengirim flag `service_tier=priority` yang sama pada Codex Responses. OpenClaw mempertahankan satu toggle `/fast` bersama di kedua jalur auth.
- Untuk permintaan `anthropic/*` publik langsung, termasuk trafik terautentikasi OAuth yang dikirim ke `api.anthropic.com`, mode cepat dipetakan ke service tier Anthropic: `/fast on` menetapkan `service_tier=auto`, `/fast off` menetapkan `service_tier=standard_only`.
- Untuk `minimax/*` pada jalur yang kompatibel dengan Anthropic, `/fast on` (atau `params.fastMode: true`) menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.
- Param model Anthropic `serviceTier` / `service_tier` yang eksplisit menggantikan default mode cepat saat keduanya ditetapkan. OpenClaw tetap melewati injeksi service-tier Anthropic untuk base URL proxy non-Anthropic.
- `/status` menampilkan `Fast` hanya saat mode cepat diaktifkan.

## Directive verbose (`/verbose` atau `/v`)

- Level: `on` (minimal) | `full` | `off` (default).
- Pesan yang hanya berisi directive mengalihkan verbose sesi dan membalas `Verbose logging enabled.` / `Verbose logging disabled.`; level yang tidak valid mengembalikan petunjuk tanpa mengubah state.
- `/verbose off` menyimpan override sesi eksplisit; hapus melalui UI Sessions dengan memilih `inherit`.
- Directive inline hanya memengaruhi pesan itu; default sesi/global berlaku untuk selain itu.
- Kirim `/verbose` (atau `/verbose:`) tanpa argumen untuk melihat level verbose saat ini.
- Saat verbose aktif, agen yang mengeluarkan hasil alat terstruktur (Pi, agen JSON lain) mengirim balik setiap pemanggilan alat sebagai pesan hanya-metadata tersendiri, diawali dengan `<emoji> <tool-name>: <arg>` jika tersedia (path/perintah). Ringkasan alat ini dikirim segera saat tiap alat dimulai (bubble terpisah), bukan sebagai delta streaming.
- Ringkasan kegagalan alat tetap terlihat dalam mode normal, tetapi sufiks detail error mentah disembunyikan kecuali verbose adalah `on` atau `full`.
- Saat verbose adalah `full`, output alat juga diteruskan setelah selesai (bubble terpisah, dipotong ke panjang aman). Jika Anda mengalihkan `/verbose on|full|off` saat run sedang berlangsung, bubble alat berikutnya mengikuti pengaturan baru.

## Directive trace Plugin (`/trace`)

- Level: `on` | `off` (default).
- Pesan yang hanya berisi directive mengalihkan output trace Plugin sesi dan membalas `Plugin trace enabled.` / `Plugin trace disabled.`.
- Directive inline hanya memengaruhi pesan itu; default sesi/global berlaku untuk selain itu.
- Kirim `/trace` (atau `/trace:`) tanpa argumen untuk melihat level trace saat ini.
- `/trace` lebih sempit daripada `/verbose`: ini hanya mengekspos baris trace/debug milik Plugin seperti ringkasan debug Active Memory.
- Baris trace dapat muncul di `/status` dan sebagai pesan diagnostik lanjutan setelah balasan asisten normal.

## Visibilitas reasoning (`/reasoning`)

- Level: `on|off|stream`.
- Pesan yang hanya berisi directive mengalihkan apakah blok thinking ditampilkan dalam balasan.
- Saat diaktifkan, reasoning dikirim sebagai **pesan terpisah** yang diawali dengan `Reasoning:`.
- `stream` (khusus Telegram): melakukan streaming reasoning ke bubble draft Telegram saat balasan sedang dihasilkan, lalu mengirim jawaban akhir tanpa reasoning.
- Alias: `/reason`.
- Kirim `/reasoning` (atau `/reasoning:`) tanpa argumen untuk melihat level reasoning saat ini.
- Urutan resolusi: directive inline, lalu override sesi, lalu default per agen (`agents.list[].reasoningDefault`), lalu fallback (`off`).

## Terkait

- Dokumentasi mode elevated ada di [Elevated mode](/id/tools/elevated).

## Heartbeat

- Body probe Heartbeat adalah prompt Heartbeat yang dikonfigurasi (default: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Directive inline dalam pesan Heartbeat berlaku seperti biasa (tetapi hindari mengubah default sesi dari Heartbeat).
- Pengiriman Heartbeat default ke payload akhir saja. Untuk juga mengirim pesan `Reasoning:` terpisah (jika tersedia), tetapkan `agents.defaults.heartbeat.includeReasoning: true` atau per agen `agents.list[].heartbeat.includeReasoning: true`.

## UI chat web

- Pemilih thinking di chat web mencerminkan level tersimpan sesi dari penyimpanan/konfigurasi sesi masuk saat halaman dimuat.
- Memilih level lain langsung menulis override sesi melalui `sessions.patch`; ini tidak menunggu pengiriman berikutnya dan bukan override `thinkingOnce` sekali pakai.
- Opsi pertama selalu `Default (<resolved level>)`, dengan default ter-resolve berasal dari profil thinking provider model sesi aktif ditambah logika fallback yang sama yang digunakan `/status` dan `session_status`.
- Picker menggunakan `thinkingOptions` yang dikembalikan oleh baris sesi gateway. UI browser tidak menyimpan daftar regex provider sendiri; Plugin memiliki himpunan level khusus model.
- `/think:<level>` tetap berfungsi dan memperbarui level sesi tersimpan yang sama, sehingga directive chat dan picker tetap sinkron.

## Profil provider

- Plugin provider dapat mengekspos `resolveThinkingProfile(ctx)` untuk mendefinisikan level dan default yang didukung model.
- Setiap level profil memiliki `id` kanonis tersimpan (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, atau `max`) dan dapat menyertakan `label` tampilan. Provider biner menggunakan `{ id: "low", label: "on" }`.
- Hook legacy yang dipublikasikan (`supportsXHighThinking`, `isBinaryThinking`, dan `resolveDefaultThinkingLevel`) tetap ada sebagai adaptor kompatibilitas, tetapi himpunan level kustom baru sebaiknya menggunakan `resolveThinkingProfile`.
- Baris gateway mengekspos `thinkingOptions` dan `thinkingDefault` agar klien ACP/chat merender profil yang sama dengan yang digunakan validasi runtime.
