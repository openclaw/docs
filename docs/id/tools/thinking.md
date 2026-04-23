---
read_when:
    - Menyesuaikan parsing atau default direktif tingkat pemikiran, mode cepat, atau verbose
summary: Sintaks direktif untuk /think, /fast, /verbose, /trace, dan visibilitas penalaran
title: Tingkat Pemikiran
x-i18n:
    generated_at: "2026-04-23T13:58:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4efe899f7b47244745a105583b3239effa7975fadd06bd7bcad6327afcc91207
    source_path: tools/thinking.md
    workflow: 15
---

# Tingkat Pemikiran (direktif `/think`)

## Apa yang dilakukan

- Direktif inline di isi pesan masuk mana pun: `/t <level>`, `/think:<level>`, atau `/thinking <level>`.
- Tingkat (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “pikir”
  - low → “pikir keras”
  - medium → “pikir lebih keras”
  - high → “ultrathink” (anggaran maksimum)
  - xhigh → “ultrathink+” (upaya GPT-5.2 + model Codex dan Anthropic Claude Opus 4.7)
  - adaptive → pemikiran adaptif yang dikelola provider (didukung untuk Claude 4.6 di Anthropic/Bedrock dan Anthropic Claude Opus 4.7)
  - max → penalaran maksimum provider (saat ini Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high`, dan `extra_high` dipetakan ke `xhigh`.
  - `highest` dipetakan ke `high`.
- Catatan provider:
  - Menu dan pemilih pemikiran digerakkan oleh profil provider. Plugin provider mendeklarasikan kumpulan tingkat yang tepat untuk model yang dipilih, termasuk label seperti `on` biner.
  - `adaptive`, `xhigh`, dan `max` hanya diiklankan untuk profil provider/model yang mendukungnya. Direktif bertipe untuk tingkat yang tidak didukung ditolak dengan opsi valid untuk model tersebut.
  - Tingkat tersimpan yang tidak didukung akan dipetakan ulang berdasarkan peringkat profil provider. `adaptive` akan fallback ke `medium` pada model non-adaptif, sementara `xhigh` dan `max` akan fallback ke tingkat non-`off` terbesar yang didukung untuk model yang dipilih.
  - Model Anthropic Claude 4.6 default ke `adaptive` saat tidak ada tingkat pemikiran eksplisit yang disetel.
  - Anthropic Claude Opus 4.7 tidak default ke pemikiran adaptif. Default upaya API-nya tetap dimiliki provider kecuali Anda secara eksplisit menetapkan tingkat pemikiran.
  - Anthropic Claude Opus 4.7 memetakan `/think xhigh` ke pemikiran adaptif plus `output_config.effort: "xhigh"`, karena `/think` adalah direktif pemikiran dan `xhigh` adalah pengaturan upaya Opus 4.7.
  - Anthropic Claude Opus 4.7 juga mengekspos `/think max`; ini dipetakan ke jalur upaya maksimum yang sama milik provider.
  - Model OpenAI GPT memetakan `/think` melalui dukungan upaya Responses API spesifik model. `/think off` mengirim `reasoning.effort: "none"` hanya ketika model target mendukungnya; jika tidak, OpenClaw menghilangkan payload reasoning yang dinonaktifkan alih-alih mengirim nilai yang tidak didukung.
  - MiniMax (`minimax/*`) pada jalur streaming yang kompatibel dengan Anthropic default ke `thinking: { type: "disabled" }` kecuali Anda secara eksplisit menetapkan thinking di parameter model atau parameter request. Ini mencegah delta `reasoning_content` bocor dari format stream Anthropic non-native MiniMax.
  - Z.AI (`zai/*`) hanya mendukung thinking biner (`on`/`off`). Tingkat apa pun selain `off` diperlakukan sebagai `on` (dipetakan ke `low`).
  - Moonshot (`moonshot/*`) memetakan `/think off` ke `thinking: { type: "disabled" }` dan tingkat apa pun selain `off` ke `thinking: { type: "enabled" }`. Saat thinking diaktifkan, Moonshot hanya menerima `tool_choice` `auto|none`; OpenClaw menormalkan nilai yang tidak kompatibel ke `auto`.

## Urutan resolusi

1. Direktif inline pada pesan (hanya berlaku untuk pesan itu).
2. Override sesi (disetel dengan mengirim pesan yang hanya berisi direktif).
3. Default per-agent (`agents.list[].thinkingDefault` di config).
4. Default global (`agents.defaults.thinkingDefault` di config).
5. Fallback: default yang dideklarasikan provider bila tersedia; jika tidak, model yang mampu bernalar akan diresolusikan ke `medium` atau tingkat non-`off` terdekat yang didukung untuk model tersebut, dan model non-penalaran tetap `off`.

## Menyetel default sesi

- Kirim pesan yang **hanya** berisi direktif (spasi diperbolehkan), misalnya `/think:medium` atau `/t high`.
- Ini akan tetap berlaku untuk sesi saat ini (default-nya per-pengirim); dibersihkan oleh `/think:off` atau reset idle sesi.
- Balasan konfirmasi dikirim (`Thinking level set to high.` / `Thinking disabled.`). Jika tingkat tidak valid (misalnya `/thinking big`), perintah ditolak dengan petunjuk dan status sesi dibiarkan tidak berubah.
- Kirim `/think` (atau `/think:`) tanpa argumen untuk melihat tingkat pemikiran saat ini.

## Penerapan per agent

- **Embedded Pi**: tingkat yang diresolusikan diteruskan ke runtime agent Pi in-process.

## Mode cepat (/fast)

- Tingkat: `on|off`.
- Pesan yang hanya berisi direktif mengaktifkan override mode cepat sesi dan membalas `Fast mode enabled.` / `Fast mode disabled.`.
- Kirim `/fast` (atau `/fast status`) tanpa mode untuk melihat status mode cepat efektif saat ini.
- OpenClaw menyelesaikan mode cepat dalam urutan ini:
  1. Inline/pesan khusus direktif `/fast on|off`
  2. Override sesi
  3. Default per-agent (`agents.list[].fastModeDefault`)
  4. Config per-model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Untuk `openai/*`, mode cepat dipetakan ke pemrosesan prioritas OpenAI dengan mengirim `service_tier=priority` pada request Responses yang didukung.
- Untuk `openai-codex/*`, mode cepat mengirim flag `service_tier=priority` yang sama pada Codex Responses. OpenClaw mempertahankan satu toggle `/fast` bersama untuk kedua jalur autentikasi.
- Untuk request publik langsung `anthropic/*`, termasuk traffic terautentikasi OAuth yang dikirim ke `api.anthropic.com`, mode cepat dipetakan ke tingkat layanan Anthropic: `/fast on` menyetel `service_tier=auto`, `/fast off` menyetel `service_tier=standard_only`.
- Untuk `minimax/*` pada jalur yang kompatibel dengan Anthropic, `/fast on` (atau `params.fastMode: true`) menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.
- Parameter model Anthropic `serviceTier` / `service_tier` yang eksplisit menimpa default mode cepat saat keduanya disetel. OpenClaw tetap melewati injeksi tingkat layanan Anthropic untuk base URL proxy non-Anthropic.
- `/status` menampilkan `Fast` hanya saat mode cepat diaktifkan.

## Direktif verbose (`/verbose` atau `/v`)

- Tingkat: `on` (minimal) | `full` | `off` (default).
- Pesan yang hanya berisi direktif mengaktifkan verbose sesi dan membalas `Verbose logging enabled.` / `Verbose logging disabled.`; tingkat yang tidak valid mengembalikan petunjuk tanpa mengubah status.
- `/verbose off` menyimpan override sesi eksplisit; hapus melalui UI Sessions dengan memilih `inherit`.
- Direktif inline hanya memengaruhi pesan itu; default sesi/global berlaku dalam kondisi lain.
- Kirim `/verbose` (atau `/verbose:`) tanpa argumen untuk melihat tingkat verbose saat ini.
- Saat verbose aktif, agent yang mengeluarkan hasil tool terstruktur (Pi, agent JSON lain) mengirim kembali setiap pemanggilan tool sebagai pesan khusus metadata tersendiri, diawali dengan `<emoji> <tool-name>: <arg>` bila tersedia (path/command). Ringkasan tool ini dikirim segera saat tiap tool dimulai (bubble terpisah), bukan sebagai delta streaming.
- Ringkasan kegagalan tool tetap terlihat dalam mode normal, tetapi sufiks detail error mentah disembunyikan kecuali verbose `on` atau `full`.
- Saat verbose `full`, output tool juga diteruskan setelah selesai (bubble terpisah, dipotong ke panjang aman). Jika Anda mengubah `/verbose on|full|off` saat run sedang berlangsung, bubble tool berikutnya akan mengikuti pengaturan baru.

## Direktif trace plugin (`/trace`)

- Tingkat: `on` | `off` (default).
- Pesan yang hanya berisi direktif mengaktifkan output trace plugin sesi dan membalas `Plugin trace enabled.` / `Plugin trace disabled.`.
- Direktif inline hanya memengaruhi pesan itu; default sesi/global berlaku dalam kondisi lain.
- Kirim `/trace` (atau `/trace:`) tanpa argumen untuk melihat tingkat trace saat ini.
- `/trace` lebih sempit daripada `/verbose`: ini hanya mengekspos baris trace/debug milik plugin seperti ringkasan debug Active Memory.
- Baris trace dapat muncul di `/status` dan sebagai pesan diagnostik lanjutan setelah balasan asisten normal.

## Visibilitas penalaran (`/reasoning`)

- Tingkat: `on|off|stream`.
- Pesan yang hanya berisi direktif mengaktifkan apakah blok thinking ditampilkan dalam balasan.
- Saat diaktifkan, penalaran dikirim sebagai **pesan terpisah** dengan prefiks `Reasoning:`.
- `stream` (khusus Telegram): men-stream penalaran ke bubble draf Telegram saat balasan sedang dibuat, lalu mengirim jawaban akhir tanpa penalaran.
- Alias: `/reason`.
- Kirim `/reasoning` (atau `/reasoning:`) tanpa argumen untuk melihat tingkat penalaran saat ini.
- Urutan resolusi: direktif inline, lalu override sesi, lalu default per-agent (`agents.list[].reasoningDefault`), lalu fallback (`off`).

## Terkait

- Dokumentasi mode elevated ada di [Elevated mode](/id/tools/elevated).

## Heartbeat

- Isi probe Heartbeat adalah prompt heartbeat yang dikonfigurasi (default: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Direktif inline dalam pesan heartbeat berlaku seperti biasa (tetapi hindari mengubah default sesi dari heartbeat).
- Pengiriman Heartbeat default ke payload akhir saja. Untuk juga mengirim pesan `Reasoning:` terpisah (bila tersedia), setel `agents.defaults.heartbeat.includeReasoning: true` atau per-agent `agents.list[].heartbeat.includeReasoning: true`.

## UI web chat

- Pemilih thinking web chat mencerminkan tingkat tersimpan sesi dari inbound session store/config saat halaman dimuat.
- Memilih tingkat lain langsung menulis override sesi melalui `sessions.patch`; ini tidak menunggu pengiriman berikutnya dan bukan override `thinkingOnce` sekali pakai.
- Opsi pertama selalu `Default (<resolved level>)`, dengan default teresolusikan berasal dari profil thinking provider model sesi aktif plus logika fallback yang sama yang digunakan `/status` dan `session_status`.
- Pemilih menggunakan `thinkingOptions` yang dikembalikan oleh baris sesi gateway. UI browser tidak menyimpan daftar regex provider sendiri; plugin memiliki kumpulan tingkat spesifik model.
- `/think:<level>` tetap berfungsi dan memperbarui tingkat sesi tersimpan yang sama, sehingga direktif chat dan pemilih tetap sinkron.

## Profil provider

- Plugin provider dapat mengekspos `resolveThinkingProfile(ctx)` untuk menentukan tingkat dan default model yang didukung.
- Setiap tingkat profil memiliki `id` kanonis tersimpan (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, atau `max`) dan dapat menyertakan `label` tampilan. Provider biner menggunakan `{ id: "low", label: "on" }`.
- Hook lama yang dipublikasikan (`supportsXHighThinking`, `isBinaryThinking`, dan `resolveDefaultThinkingLevel`) tetap ada sebagai adaptor kompatibilitas, tetapi kumpulan tingkat kustom baru sebaiknya menggunakan `resolveThinkingProfile`.
- Baris gateway mengekspos `thinkingOptions` dan `thinkingDefault` sehingga klien ACP/chat merender profil yang sama dengan yang digunakan validasi runtime.
