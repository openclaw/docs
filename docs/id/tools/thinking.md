---
read_when:
    - Menyesuaikan parsing atau default direktif thinking, mode cepat, atau verbose
summary: Sintaks direktif untuk /think, /fast, /verbose, /trace, dan visibilitas penalaran
title: Tingkat Berpikir
x-i18n:
    generated_at: "2026-04-21T19:21:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: c77f6f1318c428bbd21725ea5f32f8088506a10cbbf5b5cbca5973c72a5a81f9
    source_path: tools/thinking.md
    workflow: 15
---

# Tingkat Berpikir (direktif `/think`)

## Apa fungsinya

- Direktif inline dalam isi masuk apa pun: `/t <level>`, `/think:<level>`, atau `/thinking <level>`.
- Level (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (anggaran maksimum)
  - xhigh → “ultrathink+” (upaya GPT-5.2 + model Codex dan Anthropic Claude Opus 4.7)
  - adaptive → pemikiran adaptif yang dikelola provider (didukung untuk Claude 4.6 pada Anthropic/Bedrock dan Anthropic Claude Opus 4.7)
  - max → penalaran maksimum provider (saat ini Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high`, dan `extra_high` dipetakan ke `xhigh`.
  - `highest` dipetakan ke `high`.
- Catatan provider:
  - Menu dan pemilih thinking digerakkan oleh profil provider. Plugin provider mendeklarasikan kumpulan level yang tepat untuk model yang dipilih, termasuk label seperti `on` biner.
  - `adaptive`, `xhigh`, dan `max` hanya diiklankan untuk profil provider/model yang mendukungnya. Direktif yang diketik untuk level yang tidak didukung ditolak dengan opsi valid untuk model tersebut.
  - Level tersimpan yang sudah ada tetapi tidak didukung dipetakan ulang menurut peringkat profil provider. `adaptive` kembali ke `medium` pada model non-adaptif, sedangkan `xhigh` dan `max` kembali ke level non-off terbesar yang didukung untuk model yang dipilih.
  - Model Anthropic Claude 4.6 default ke `adaptive` saat tidak ada level thinking eksplisit yang ditetapkan.
  - Anthropic Claude Opus 4.7 tidak default ke adaptive thinking. Default upaya API-nya tetap dimiliki provider kecuali Anda secara eksplisit menetapkan level thinking.
  - Anthropic Claude Opus 4.7 memetakan `/think xhigh` ke adaptive thinking ditambah `output_config.effort: "xhigh"`, karena `/think` adalah direktif thinking dan `xhigh` adalah pengaturan upaya Opus 4.7.
  - Anthropic Claude Opus 4.7 juga mengekspos `/think max`; itu dipetakan ke jalur upaya maksimum milik provider yang sama.
  - Model OpenAI GPT memetakan `/think` melalui dukungan upaya Responses API spesifik model. `/think off` mengirim `reasoning.effort: "none"` hanya ketika model target mendukungnya; jika tidak, OpenClaw menghilangkan payload penalaran nonaktif alih-alih mengirim nilai yang tidak didukung.
  - MiniMax (`minimax/*`) pada jalur streaming kompatibel Anthropic default ke `thinking: { type: "disabled" }` kecuali Anda secara eksplisit menetapkan thinking dalam parameter model atau parameter permintaan. Ini menghindari delta `reasoning_content` yang bocor dari format stream Anthropic non-native milik MiniMax.
  - Z.AI (`zai/*`) hanya mendukung thinking biner (`on`/`off`). Level apa pun selain `off` diperlakukan sebagai `on` (dipetakan ke `low`).
  - Moonshot (`moonshot/*`) memetakan `/think off` ke `thinking: { type: "disabled" }` dan level apa pun selain `off` ke `thinking: { type: "enabled" }`. Saat thinking diaktifkan, Moonshot hanya menerima `tool_choice` `auto|none`; OpenClaw menormalkan nilai yang tidak kompatibel ke `auto`.

## Urutan resolusi

1. Direktif inline pada pesan (hanya berlaku untuk pesan tersebut).
2. Override sesi (ditetapkan dengan mengirim pesan yang hanya berisi direktif).
3. Default per-agent (`agents.list[].thinkingDefault` dalam config).
4. Default global (`agents.defaults.thinkingDefault` dalam config).
5. Fallback: default yang dideklarasikan provider jika tersedia, `low` untuk model katalog lain yang ditandai mampu bernalar, atau `off` jika tidak.

## Menetapkan default sesi

- Kirim pesan yang **hanya** berisi direktif tersebut (spasi diperbolehkan), misalnya `/think:medium` atau `/t high`.
- Ini akan melekat untuk sesi saat ini (default-nya per-pengirim); dibersihkan dengan `/think:off` atau reset idle sesi.
- Balasan konfirmasi dikirim (`Thinking level set to high.` / `Thinking disabled.`). Jika level tidak valid (misalnya `/thinking big`), perintah ditolak dengan petunjuk dan state sesi dibiarkan tidak berubah.
- Kirim `/think` (atau `/think:`) tanpa argumen untuk melihat level thinking saat ini.

## Penerapan oleh agent

- **Pi tersemat**: level yang dihasilkan diteruskan ke runtime agent Pi in-process.

## Mode cepat (`/fast`)

- Level: `on|off`.
- Pesan yang hanya berisi direktif mengalihkan override mode cepat sesi dan membalas `Fast mode enabled.` / `Fast mode disabled.`.
- Kirim `/fast` (atau `/fast status`) tanpa mode untuk melihat state mode cepat efektif saat ini.
- OpenClaw menyelesaikan mode cepat dalam urutan ini:
  1. `/fast on|off` inline/hanya-direktif
  2. Override sesi
  3. Default per-agent (`agents.list[].fastModeDefault`)
  4. Config per-model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Untuk `openai/*`, mode cepat dipetakan ke pemrosesan prioritas OpenAI dengan mengirim `service_tier=priority` pada permintaan Responses yang didukung.
- Untuk `openai-codex/*`, mode cepat mengirim flag `service_tier=priority` yang sama pada Codex Responses. OpenClaw mempertahankan satu toggle `/fast` bersama di kedua jalur auth.
- Untuk permintaan publik langsung `anthropic/*`, termasuk trafik terautentikasi OAuth yang dikirim ke `api.anthropic.com`, mode cepat dipetakan ke service tier Anthropic: `/fast on` menetapkan `service_tier=auto`, `/fast off` menetapkan `service_tier=standard_only`.
- Untuk `minimax/*` pada jalur kompatibel Anthropic, `/fast on` (atau `params.fastMode: true`) menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.
- Parameter model Anthropic `serviceTier` / `service_tier` yang eksplisit menggantikan default mode cepat saat keduanya ditetapkan. OpenClaw tetap melewati penyuntikan service tier Anthropic untuk base URL proxy non-Anthropic.

## Direktif verbose (`/verbose` atau `/v`)

- Level: `on` (minimal) | `full` | `off` (default).
- Pesan yang hanya berisi direktif mengalihkan verbose sesi dan membalas `Verbose logging enabled.` / `Verbose logging disabled.`; level yang tidak valid mengembalikan petunjuk tanpa mengubah state.
- `/verbose off` menyimpan override sesi eksplisit; hapus lewat UI Sessions dengan memilih `inherit`.
- Direktif inline hanya memengaruhi pesan itu; default sesi/global berlaku selain itu.
- Kirim `/verbose` (atau `/verbose:`) tanpa argumen untuk melihat level verbose saat ini.
- Saat verbose aktif, agent yang mengeluarkan hasil tool terstruktur (Pi, agent JSON lain) mengirim kembali setiap pemanggilan tool sebagai pesan khusus metadata tersendiri, diawali dengan `<emoji> <tool-name>: <arg>` bila tersedia (path/perintah). Ringkasan tool ini dikirim segera saat setiap tool dimulai (bubble terpisah), bukan sebagai delta streaming.
- Ringkasan kegagalan tool tetap terlihat dalam mode normal, tetapi sufiks detail error mentah disembunyikan kecuali verbose adalah `on` atau `full`.
- Saat verbose adalah `full`, output tool juga diteruskan setelah selesai (bubble terpisah, dipotong ke panjang yang aman). Jika Anda mengalihkan `/verbose on|full|off` saat run masih berlangsung, bubble tool berikutnya akan mengikuti pengaturan baru.

## Direktif jejak Plugin (`/trace`)

- Level: `on` | `off` (default).
- Pesan yang hanya berisi direktif mengalihkan output jejak Plugin sesi dan membalas `Plugin trace enabled.` / `Plugin trace disabled.`.
- Direktif inline hanya memengaruhi pesan itu; default sesi/global berlaku selain itu.
- Kirim `/trace` (atau `/trace:`) tanpa argumen untuk melihat level jejak saat ini.
- `/trace` lebih sempit daripada `/verbose`: ini hanya mengekspos baris jejak/debug milik Plugin seperti ringkasan debug Active Memory.
- Baris jejak dapat muncul di `/status` dan sebagai pesan diagnostik lanjutan setelah balasan assistant normal.

## Visibilitas penalaran (`/reasoning`)

- Level: `on|off|stream`.
- Pesan yang hanya berisi direktif mengalihkan apakah blok thinking ditampilkan dalam balasan.
- Saat diaktifkan, penalaran dikirim sebagai **pesan terpisah** yang diawali dengan `Reasoning:`.
- `stream` (khusus Telegram): melakukan stream penalaran ke bubble draf Telegram saat balasan sedang dibuat, lalu mengirim jawaban akhir tanpa penalaran.
- Alias: `/reason`.
- Kirim `/reasoning` (atau `/reasoning:`) tanpa argumen untuk melihat level penalaran saat ini.
- Urutan resolusi: direktif inline, lalu override sesi, lalu default per-agent (`agents.list[].reasoningDefault`), lalu fallback (`off`).

## Terkait

- Dokumentasi mode elevated ada di [Elevated mode](/id/tools/elevated).

## Heartbeat

- Isi probe Heartbeat adalah prompt heartbeat yang dikonfigurasi (default: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Direktif inline dalam pesan heartbeat berlaku seperti biasa (tetapi hindari mengubah default sesi dari heartbeat).
- Pengiriman Heartbeat default-nya hanya payload akhir. Untuk juga mengirim pesan `Reasoning:` terpisah (saat tersedia), tetapkan `agents.defaults.heartbeat.includeReasoning: true` atau per-agent `agents.list[].heartbeat.includeReasoning: true`.

## UI chat web

- Pemilih thinking chat web mencerminkan level tersimpan sesi dari penyimpanan/config sesi masuk saat halaman dimuat.
- Memilih level lain langsung menulis override sesi melalui `sessions.patch`; ini tidak menunggu pengiriman berikutnya dan bukan override satu kali `thinkingOnce`.
- Opsi pertama selalu `Default (<resolved level>)`, di mana default teresolusi berasal dari profil thinking provider model sesi aktif.
- Pemilih menggunakan `thinkingOptions` yang dikembalikan oleh baris sesi gateway. UI browser tidak menyimpan daftar regex provider sendiri; Plugin memiliki kumpulan level spesifik model.
- `/think:<level>` tetap berfungsi dan memperbarui level sesi tersimpan yang sama, sehingga direktif chat dan pemilih tetap sinkron.

## Profil provider

- Plugin provider dapat mengekspos `resolveThinkingProfile(ctx)` untuk mendefinisikan level yang didukung model dan default-nya.
- Setiap level profil memiliki `id` kanonis tersimpan (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, atau `max`) dan dapat menyertakan `label` tampilan. Provider biner menggunakan `{ id: "low", label: "on" }`.
- Hook legacy yang dipublikasikan (`supportsXHighThinking`, `isBinaryThinking`, dan `resolveDefaultThinkingLevel`) tetap ada sebagai adaptor kompatibilitas, tetapi kumpulan level kustom baru sebaiknya menggunakan `resolveThinkingProfile`.
- Baris Gateway mengekspos `thinkingOptions` dan `thinkingDefault` agar klien ACP/chat merender profil yang sama dengan yang digunakan validasi runtime.
