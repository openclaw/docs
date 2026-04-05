---
read_when:
    - Menyesuaikan thinking, parsing atau default mode cepat, atau verbose
summary: Sintaks direktif untuk /think, /fast, /verbose, dan visibilitas reasoning
title: Level Thinking
x-i18n:
    generated_at: "2026-04-05T14:09:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: f60aeb6ab4c7ce858f725f589f54184b29d8c91994d18c8deafa75179b9a62cb
    source_path: tools/thinking.md
    workflow: 15
---

# Level Thinking (/think directives)

## Fungsinya

- Direktif inline dalam body masuk apa pun: `/t <level>`, `/think:<level>`, atau `/thinking <level>`.
- Level (alias): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (anggaran maksimum)
  - xhigh → “ultrathink+” (khusus model GPT-5.2 + Codex)
  - adaptive → anggaran reasoning adaptif yang dikelola provider (didukung untuk keluarga model Anthropic Claude 4.6)
  - `x-high`, `x_high`, `extra-high`, `extra high`, dan `extra_high` dipetakan ke `xhigh`.
  - `highest`, `max` dipetakan ke `high`.
- Catatan provider:
  - Model Anthropic Claude 4.6 default ke `adaptive` saat tidak ada level thinking eksplisit yang disetel.
  - MiniMax (`minimax/*`) pada jalur streaming kompatibel Anthropic default ke `thinking: { type: "disabled" }` kecuali Anda secara eksplisit menetapkan thinking di param model atau param request. Ini menghindari delta `reasoning_content` yang bocor dari format stream Anthropic non-native milik MiniMax.
  - Z.AI (`zai/*`) hanya mendukung thinking biner (`on`/`off`). Level apa pun selain `off` diperlakukan sebagai `on` (dipetakan ke `low`).
  - Moonshot (`moonshot/*`) memetakan `/think off` ke `thinking: { type: "disabled" }` dan level apa pun selain `off` ke `thinking: { type: "enabled" }`. Saat thinking diaktifkan, Moonshot hanya menerima `tool_choice` `auto|none`; OpenClaw menormalkan nilai yang tidak kompatibel menjadi `auto`.

## Urutan resolusi

1. Direktif inline pada pesan (hanya berlaku untuk pesan itu).
2. Override sesi (disetel dengan mengirim pesan yang hanya berisi direktif).
3. Default per agen (`agents.list[].thinkingDefault` di config).
4. Default global (`agents.defaults.thinkingDefault` di config).
5. Fallback: `adaptive` untuk model Anthropic Claude 4.6, `low` untuk model lain yang mendukung reasoning, `off` jika tidak.

## Menetapkan default sesi

- Kirim pesan yang **hanya** berisi direktif (spasi diperbolehkan), misalnya `/think:medium` atau `/t high`.
- Pengaturan ini melekat untuk sesi saat ini (default-nya per-pengirim); dibersihkan oleh `/think:off` atau reset idle sesi.
- Balasan konfirmasi dikirim (`Thinking level set to high.` / `Thinking disabled.`). Jika level tidak valid (misalnya `/thinking big`), perintah ditolak dengan petunjuk dan status sesi dibiarkan tidak berubah.
- Kirim `/think` (atau `/think:`) tanpa argumen untuk melihat level thinking saat ini.

## Penerapan menurut agen

- **Embedded Pi**: level yang diresolusikan diteruskan ke runtime agen Pi in-process.

## Mode cepat (/fast)

- Level: `on|off`.
- Pesan yang hanya berisi direktif mengaktifkan/menonaktifkan override mode cepat sesi dan membalas `Fast mode enabled.` / `Fast mode disabled.`.
- Kirim `/fast` (atau `/fast status`) tanpa mode untuk melihat status mode cepat efektif saat ini.
- OpenClaw meresolusikan mode cepat dalam urutan ini:
  1. `/fast on|off` inline/hanya-direktif
  2. Override sesi
  3. Default per agen (`agents.list[].fastModeDefault`)
  4. Config per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Untuk `openai/*`, mode cepat dipetakan ke pemrosesan prioritas OpenAI dengan mengirim `service_tier=priority` pada request Responses yang didukung.
- Untuk `openai-codex/*`, mode cepat mengirim flag `service_tier=priority` yang sama pada Codex Responses. OpenClaw mempertahankan satu toggle `/fast` bersama di kedua jalur auth.
- Untuk request `anthropic/*` publik langsung, termasuk traffic terautentikasi OAuth yang dikirim ke `api.anthropic.com`, mode cepat dipetakan ke service tier Anthropic: `/fast on` menetapkan `service_tier=auto`, `/fast off` menetapkan `service_tier=standard_only`.
- Untuk `minimax/*` pada jalur kompatibel Anthropic, `/fast on` (atau `params.fastMode: true`) menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.
- Param model Anthropic `serviceTier` / `service_tier` yang eksplisit menimpa default mode cepat saat keduanya disetel. OpenClaw tetap melewati injeksi service tier Anthropic untuk URL dasar proxy non-Anthropic.

## Direktif verbose (/verbose atau /v)

- Level: `on` (minimal) | `full` | `off` (default).
- Pesan yang hanya berisi direktif mengaktifkan verbose sesi dan membalas `Verbose logging enabled.` / `Verbose logging disabled.`; level yang tidak valid mengembalikan petunjuk tanpa mengubah status.
- `/verbose off` menyimpan override sesi eksplisit; hapus melalui UI Sessions dengan memilih `inherit`.
- Direktif inline hanya memengaruhi pesan itu; default sesi/global berlaku dalam kondisi lain.
- Kirim `/verbose` (atau `/verbose:`) tanpa argumen untuk melihat level verbose saat ini.
- Saat verbose aktif, agen yang mengeluarkan hasil tool terstruktur (Pi, agen JSON lainnya) mengirim setiap panggilan tool kembali sebagai pesan khusus metadata tersendiri, diawali dengan `<emoji> <tool-name>: <arg>` jika tersedia (path/perintah). Ringkasan tool ini dikirim segera saat setiap tool dimulai (bubble terpisah), bukan sebagai delta streaming.
- Ringkasan kegagalan tool tetap terlihat dalam mode normal, tetapi sufiks detail error mentah disembunyikan kecuali verbose adalah `on` atau `full`.
- Saat verbose adalah `full`, output tool juga diteruskan setelah selesai (bubble terpisah, dipotong ke panjang aman). Jika Anda mengubah `/verbose on|full|off` saat eksekusi sedang berlangsung, bubble tool berikutnya akan mengikuti pengaturan baru.

## Visibilitas reasoning (/reasoning)

- Level: `on|off|stream`.
- Pesan yang hanya berisi direktif mengaktifkan/menonaktifkan apakah blok thinking ditampilkan dalam balasan.
- Saat diaktifkan, reasoning dikirim sebagai **pesan terpisah** yang diawali dengan `Reasoning:`.
- `stream` (khusus Telegram): men-stream reasoning ke bubble draft Telegram saat balasan sedang dihasilkan, lalu mengirim jawaban akhir tanpa reasoning.
- Alias: `/reason`.
- Kirim `/reasoning` (atau `/reasoning:`) tanpa argumen untuk melihat level reasoning saat ini.
- Urutan resolusi: direktif inline, lalu override sesi, lalu default per agen (`agents.list[].reasoningDefault`), lalu fallback (`off`).

## Terkait

- Dokumen mode elevated ada di [Elevated mode](/tools/elevated).

## Heartbeat

- Body probe heartbeat adalah prompt heartbeat yang dikonfigurasi (default: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Direktif inline dalam pesan heartbeat berlaku seperti biasa (tetapi hindari mengubah default sesi dari heartbeat).
- Pengiriman heartbeat default hanya payload akhir. Untuk juga mengirim pesan `Reasoning:` terpisah (jika tersedia), setel `agents.defaults.heartbeat.includeReasoning: true` atau per agen `agents.list[].heartbeat.includeReasoning: true`.

## UI chat web

- Pemilih thinking di chat web mencerminkan level tersimpan sesi dari penyimpanan/config sesi masuk saat halaman dimuat.
- Memilih level lain langsung menulis override sesi melalui `sessions.patch`; tidak menunggu pengiriman berikutnya dan bukan override `thinkingOnce` sekali pakai.
- Opsi pertama selalu `Default (<resolved level>)`, di mana default yang diresolusikan berasal dari model sesi aktif: `adaptive` untuk Claude 4.6 pada Anthropic/Bedrock, `low` untuk model lain yang mendukung reasoning, `off` jika tidak.
- Pemilih tetap sadar provider:
  - sebagian besar provider menampilkan `off | minimal | low | medium | high | adaptive`
  - Z.AI menampilkan biner `off | on`
- `/think:<level>` tetap berfungsi dan memperbarui level sesi tersimpan yang sama, sehingga direktif chat dan pemilih tetap sinkron.
