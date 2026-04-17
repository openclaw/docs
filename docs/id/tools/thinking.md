---
read_when:
    - Menyesuaikan penguraian atau nilai default untuk direktif tingkat penalaran, mode cepat, atau verbose
summary: Sintaks direktif untuk /think, /fast, /verbose, /trace, dan visibilitas penalaran
title: Tingkat Penalaran
x-i18n:
    generated_at: "2026-04-17T09:14:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1cb44a7bf75546e5a8c3204e12f3297221449b881161d173dea4983da3921649
    source_path: tools/thinking.md
    workflow: 15
---

# Tingkat Penalaran (direktif `/think`)

## Apa fungsinya

- Direktif inline di badan pesan masuk apa pun: `/t <level>`, `/think:<level>`, atau `/thinking <level>`.
- Level (alias): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → “pikir”
  - low → “pikir keras”
  - medium → “pikir lebih keras”
  - high → “ultrathink” (anggaran maksimum)
  - xhigh → “ultrathink+” (GPT-5.2 + model Codex dan effort Anthropic Claude Opus 4.7)
  - adaptive → penalaran adaptif yang dikelola penyedia (didukung untuk Anthropic Claude 4.6 dan Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high`, dan `extra_high` dipetakan ke `xhigh`.
  - `highest`, `max` dipetakan ke `high`.
- Catatan penyedia:
  - Model Anthropic Claude 4.6 default ke `adaptive` saat tidak ada tingkat penalaran eksplisit yang ditetapkan.
  - Anthropic Claude Opus 4.7 tidak default ke penalaran adaptif. Default effort API-nya tetap dimiliki penyedia kecuali Anda menetapkan tingkat penalaran secara eksplisit.
  - Anthropic Claude Opus 4.7 memetakan `/think xhigh` ke penalaran adaptif plus `output_config.effort: "xhigh"`, karena `/think` adalah direktif penalaran dan `xhigh` adalah pengaturan effort Opus 4.7.
  - MiniMax (`minimax/*`) pada path streaming yang kompatibel dengan Anthropic default ke `thinking: { type: "disabled" }` kecuali Anda secara eksplisit menetapkan thinking di parameter model atau parameter permintaan. Ini menghindari delta `reasoning_content` yang bocor dari format stream Anthropic non-native milik MiniMax.
  - Z.AI (`zai/*`) hanya mendukung penalaran biner (`on`/`off`). Level apa pun selain `off` diperlakukan sebagai `on` (dipetakan ke `low`).
  - Moonshot (`moonshot/*`) memetakan `/think off` ke `thinking: { type: "disabled" }` dan level apa pun selain `off` ke `thinking: { type: "enabled" }`. Saat penalaran diaktifkan, Moonshot hanya menerima `tool_choice` `auto|none`; OpenClaw menormalkan nilai yang tidak kompatibel ke `auto`.

## Urutan resolusi

1. Direktif inline pada pesan (hanya berlaku untuk pesan itu).
2. Override sesi (ditetapkan dengan mengirim pesan yang hanya berisi direktif).
3. Default per agen (`agents.list[].thinkingDefault` dalam config).
4. Default global (`agents.defaults.thinkingDefault` dalam config).
5. Fallback: `adaptive` untuk model Anthropic Claude 4.6, `off` untuk Anthropic Claude Opus 4.7 kecuali dikonfigurasi secara eksplisit, `low` untuk model lain yang mendukung penalaran, `off` jika tidak.

## Menetapkan default sesi

- Kirim pesan yang **hanya** berisi direktif tersebut (spasi diperbolehkan), misalnya `/think:medium` atau `/t high`.
- Ini akan tetap berlaku untuk sesi saat ini (default-nya per pengirim); dihapus dengan `/think:off` atau reset idle sesi.
- Balasan konfirmasi akan dikirim (`Thinking level set to high.` / `Thinking disabled.`). Jika level tidak valid (misalnya `/thinking big`), perintah ditolak dengan petunjuk dan status sesi dibiarkan tidak berubah.
- Kirim `/think` (atau `/think:`) tanpa argumen untuk melihat tingkat penalaran saat ini.

## Penerapan per agen

- **Embedded Pi**: level yang dihasilkan diteruskan ke runtime agen Pi dalam proses.

## Mode cepat (`/fast`)

- Level: `on|off`.
- Pesan yang hanya berisi direktif akan mengaktifkan override mode cepat sesi dan membalas `Fast mode enabled.` / `Fast mode disabled.`.
- Kirim `/fast` (atau `/fast status`) tanpa mode untuk melihat status mode cepat efektif saat ini.
- OpenClaw menyelesaikan mode cepat dalam urutan ini:
  1. `/fast on|off` inline/hanya-direktif
  2. Override sesi
  3. Default per agen (`agents.list[].fastModeDefault`)
  4. Config per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Untuk `openai/*`, mode cepat dipetakan ke pemrosesan prioritas OpenAI dengan mengirim `service_tier=priority` pada permintaan Responses yang didukung.
- Untuk `openai-codex/*`, mode cepat mengirim flag `service_tier=priority` yang sama pada Codex Responses. OpenClaw mempertahankan satu tombol `/fast` bersama di kedua jalur auth.
- Untuk permintaan `anthropic/*` publik langsung, termasuk trafik yang diautentikasi OAuth yang dikirim ke `api.anthropic.com`, mode cepat dipetakan ke service tier Anthropic: `/fast on` menetapkan `service_tier=auto`, `/fast off` menetapkan `service_tier=standard_only`.
- Untuk `minimax/*` pada path yang kompatibel dengan Anthropic, `/fast on` (atau `params.fastMode: true`) menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.
- Parameter model Anthropic `serviceTier` / `service_tier` yang eksplisit mengesampingkan default mode cepat saat keduanya ditetapkan. OpenClaw tetap melewati injeksi service tier Anthropic untuk base URL proxy non-Anthropic.

## Direktif verbose (`/verbose` atau `/v`)

- Level: `on` (minimal) | `full` | `off` (default).
- Pesan yang hanya berisi direktif mengaktifkan verbose sesi dan membalas `Verbose logging enabled.` / `Verbose logging disabled.`; level yang tidak valid mengembalikan petunjuk tanpa mengubah status.
- `/verbose off` menyimpan override sesi eksplisit; hapus melalui UI Sessions dengan memilih `inherit`.
- Direktif inline hanya berlaku untuk pesan itu; default sesi/global berlaku di luar itu.
- Kirim `/verbose` (atau `/verbose:`) tanpa argumen untuk melihat level verbose saat ini.
- Saat verbose aktif, agen yang mengeluarkan hasil tool terstruktur (Pi, agen JSON lainnya) mengirim setiap pemanggilan tool kembali sebagai pesan khusus metadata tersendiri, diawali dengan `<emoji> <tool-name>: <arg>` jika tersedia (path/perintah). Ringkasan tool ini dikirim segera saat setiap tool dimulai (gelembung terpisah), bukan sebagai delta streaming.
- Ringkasan kegagalan tool tetap terlihat dalam mode normal, tetapi sufiks detail error mentah disembunyikan kecuali verbose bernilai `on` atau `full`.
- Saat verbose bernilai `full`, output tool juga diteruskan setelah selesai (gelembung terpisah, dipotong ke panjang aman). Jika Anda mengubah `/verbose on|full|off` saat proses sedang berjalan, gelembung tool berikutnya akan mengikuti pengaturan baru.

## Direktif trace Plugin (`/trace`)

- Level: `on` | `off` (default).
- Pesan yang hanya berisi direktif mengaktifkan output trace Plugin sesi dan membalas `Plugin trace enabled.` / `Plugin trace disabled.`.
- Direktif inline hanya berlaku untuk pesan itu; default sesi/global berlaku di luar itu.
- Kirim `/trace` (atau `/trace:`) tanpa argumen untuk melihat level trace saat ini.
- `/trace` lebih sempit daripada `/verbose`: ini hanya mengekspos baris trace/debug milik plugin seperti ringkasan debug Active Memory.
- Baris trace dapat muncul di `/status` dan sebagai pesan diagnostik lanjutan setelah balasan asisten normal.

## Visibilitas penalaran (`/reasoning`)

- Level: `on|off|stream`.
- Pesan yang hanya berisi direktif mengaktifkan apakah blok penalaran ditampilkan dalam balasan.
- Saat diaktifkan, penalaran dikirim sebagai **pesan terpisah** yang diawali dengan `Reasoning:`.
- `stream` (khusus Telegram): men-stream penalaran ke gelembung draf Telegram saat balasan sedang dibuat, lalu mengirim jawaban akhir tanpa penalaran.
- Alias: `/reason`.
- Kirim `/reasoning` (atau `/reasoning:`) tanpa argumen untuk melihat level penalaran saat ini.
- Urutan resolusi: direktif inline, lalu override sesi, lalu default per agen (`agents.list[].reasoningDefault`), lalu fallback (`off`).

## Terkait

- Dokumentasi mode elevated ada di [Elevated mode](/id/tools/elevated).

## Heartbeat

- Isi probe Heartbeat adalah prompt heartbeat yang dikonfigurasi (default: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Direktif inline dalam pesan heartbeat berlaku seperti biasa (tetapi hindari mengubah default sesi dari heartbeat).
- Pengiriman Heartbeat default ke payload akhir saja. Untuk juga mengirim pesan `Reasoning:` terpisah (jika tersedia), tetapkan `agents.defaults.heartbeat.includeReasoning: true` atau per agen `agents.list[].heartbeat.includeReasoning: true`.

## UI chat web

- Pemilih penalaran di chat web mencerminkan level tersimpan sesi dari penyimpanan/config sesi masuk saat halaman dimuat.
- Memilih level lain langsung menulis override sesi melalui `sessions.patch`; ini tidak menunggu pengiriman berikutnya dan bukan override sekali pakai `thinkingOnce`.
- Opsi pertama selalu `Default (<resolved level>)`, dengan default hasil resolusi berasal dari model sesi aktif: `adaptive` untuk Claude 4.6 di Anthropic, `off` untuk Anthropic Claude Opus 4.7 kecuali dikonfigurasi, `low` untuk model lain yang mendukung penalaran, `off` jika tidak.
- Pemilih tetap sadar penyedia:
  - sebagian besar penyedia menampilkan `off | minimal | low | medium | high | adaptive`
  - Anthropic Claude Opus 4.7 menampilkan `off | minimal | low | medium | high | xhigh | adaptive`
  - Z.AI menampilkan biner `off | on`
- `/think:<level>` tetap berfungsi dan memperbarui level sesi tersimpan yang sama, sehingga direktif chat dan pemilih tetap sinkron.
