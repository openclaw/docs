---
read_when:
    - Menyesuaikan parsing atau default untuk thinking, fast-mode, atau direktif verbose
summary: Sintaks direktif untuk /think, /fast, /verbose, /trace, dan visibilitas penalaran
title: Tingkat berpikir
x-i18n:
    generated_at: "2026-06-27T18:21:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cea488a92c6d2a5371dbe0488199f41a56b44616a2936b077644f8a8324e8129
    source_path: tools/thinking.md
    workflow: 16
---

## Fungsinya

- Direktif inline dalam body masuk apa pun: `/t <level>`, `/think:<level>`, atau `/thinking <level>`.
- Level (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (anggaran maksimum)
  - xhigh → "ultrathink+" (model GPT-5.2+ dan Codex, ditambah upaya Anthropic Claude Opus 4.7+)
  - adaptive → pemikiran adaptif yang dikelola penyedia (didukung untuk Claude 4.6 di Anthropic/Bedrock, Anthropic Claude Opus 4.7+, dan pemikiran dinamis Google Gemini)
  - max → penalaran maksimum penyedia (Anthropic Claude Opus 4.7+; Ollama memetakan ini ke upaya `think` native tertingginya)
  - `x-high`, `x_high`, `extra-high`, `extra high`, dan `extra_high` dipetakan ke `xhigh`.
  - `highest` dipetakan ke `high`.
- Catatan penyedia:
  - Menu dan pemilih pemikiran digerakkan oleh profil penyedia. Plugin penyedia mendeklarasikan set level yang tepat untuk model yang dipilih, termasuk label seperti biner `on`.
  - `adaptive`, `xhigh`, dan `max` hanya ditampilkan untuk profil penyedia/model yang mendukungnya. Direktif bertipe untuk level yang tidak didukung ditolak dengan opsi valid model tersebut.
  - Level tersimpan yang tidak didukung dipetakan ulang berdasarkan peringkat profil penyedia. `adaptive` mundur ke `medium` pada model non-adaptif, sedangkan `xhigh` dan `max` mundur ke level non-off terbesar yang didukung untuk model yang dipilih.
  - Model Anthropic Claude 4.6 default ke `adaptive` saat tidak ada level pemikiran eksplisit yang ditetapkan.
  - Anthropic Claude Opus 4.8 dan Opus 4.7 membiarkan pemikiran mati kecuali Anda secara eksplisit menetapkan level pemikiran. Default upaya milik penyedia Opus 4.8 adalah `high` setelah pemikiran adaptif diaktifkan.
  - Anthropic Claude Opus 4.7+ memetakan `/think xhigh` ke pemikiran adaptif ditambah `output_config.effort: "xhigh"`, karena `/think` adalah direktif pemikiran dan `xhigh` adalah pengaturan upaya Opus.
  - Anthropic Claude Opus 4.7+ juga mengekspos `/think max`; ini dipetakan ke jalur upaya maksimum milik penyedia yang sama.
  - Model Direct DeepSeek V4 mengekspos `/think xhigh|max`; keduanya dipetakan ke DeepSeek `reasoning_effort: "max"` sementara level non-off yang lebih rendah dipetakan ke `high`.
  - Model DeepSeek V4 yang dirutekan OpenRouter mengekspos `/think xhigh` dan mengirim nilai `reasoning_effort` yang didukung OpenRouter. Override `max` tersimpan mundur ke `xhigh`.
  - Model Ollama yang mendukung pemikiran mengekspos `/think low|medium|high|max`; `max` dipetakan ke native `think: "high"` karena API native Ollama menerima string upaya `low`, `medium`, dan `high`.
  - Model OpenAI GPT memetakan `/think` melalui dukungan upaya Responses API yang spesifik per model. `/think off` mengirim `reasoning.effort: "none"` hanya ketika model target mendukungnya; jika tidak, OpenClaw menghilangkan payload penalaran yang dinonaktifkan alih-alih mengirim nilai yang tidak didukung.
  - Entri katalog kustom yang kompatibel dengan OpenAI dapat ikut memakai `/think xhigh` dengan menetapkan `models.providers.<provider>.models[].compat.supportedReasoningEfforts` agar menyertakan `"xhigh"`. Ini memakai metadata compat yang sama yang memetakan payload upaya penalaran OpenAI keluar, sehingga menu, validasi sesi, CLI agen, dan `llm-task` selaras dengan perilaku transport.
  - Referensi OpenRouter Hunter Alpha yang usang dalam konfigurasi melewati injeksi penalaran proxy karena rute yang sudah dihentikan itu dapat mengembalikan teks jawaban final melalui field penalaran.
  - Google Gemini memetakan `/think adaptive` ke pemikiran dinamis milik penyedia Gemini. Permintaan Gemini 3 menghilangkan `thinkingLevel` tetap, sedangkan permintaan Gemini 2.5 mengirim `thinkingBudget: -1`; level tetap tetap dipetakan ke `thinkingLevel` atau anggaran Gemini terdekat untuk keluarga model tersebut.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) pada jalur streaming yang kompatibel dengan Anthropic default ke `thinking: { type: "disabled" }` kecuali Anda secara eksplisit menetapkan pemikiran dalam parameter model atau parameter permintaan. Ini menghindari delta `reasoning_content` yang bocor dari format stream Anthropic non-native M2.x. MiniMax-M3 (dan M3.x) dikecualikan: M3 memancarkan blok pemikiran Anthropic yang benar dan mengembalikan konten kosong saat pemikiran dinonaktifkan, sehingga OpenClaw mempertahankan M3 pada jalur pemikiran yang dihilangkan/adaptif milik penyedia.
  - Z.AI (`zai/*`) bersifat biner (`on`/`off`) untuk sebagian besar model GLM. GLM-5.2 adalah pengecualian: model ini mengekspos `/think off|low|high|max`, memetakan `low` dan `high` ke Z.AI `reasoning_effort: "high"`, dan memetakan `max` ke `reasoning_effort: "max"`.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) selalu berpikir. Profilnya hanya mengekspos `on`, dan OpenClaw menghilangkan field `thinking` keluar sebagaimana diwajibkan oleh Moonshot. Model `moonshot/*` lainnya memetakan `/think off` ke `thinking: { type: "disabled" }` dan level non-`off` apa pun ke `thinking: { type: "enabled" }`. Saat pemikiran diaktifkan, Moonshot hanya menerima `tool_choice` `auto|none`; OpenClaw menormalkan nilai yang tidak kompatibel ke `auto`.

## Urutan resolusi

1. Direktif inline pada pesan (hanya berlaku untuk pesan tersebut).
2. Override sesi (ditetapkan dengan mengirim pesan yang hanya berisi direktif).
3. Default per agen (`agents.list[].thinkingDefault` dalam konfigurasi).
4. Default global (`agents.defaults.thinkingDefault` dalam konfigurasi).
5. Fallback: default yang dideklarasikan penyedia jika tersedia; jika tidak, model yang mendukung penalaran diselesaikan ke `medium` atau level non-`off` terdekat yang didukung untuk model tersebut, dan model non-penalaran tetap `off`.

## Menetapkan default sesi

- Kirim pesan yang **hanya** berisi direktif (spasi kosong diperbolehkan), misalnya `/think:medium` atau `/t high`.
- Itu akan melekat untuk sesi saat ini (defaultnya per pengirim). Gunakan `/think default` untuk menghapus override sesi dan mewarisi default yang dikonfigurasi/penyedia; alias mencakup `inherit`, `clear`, `reset`, dan `unpin`.
- `/think off` menyimpan override off eksplisit. Ini menonaktifkan pemikiran hingga Anda mengubah atau menghapus override sesi.
- Balasan konfirmasi dikirim (`Thinking level set to high.` / `Thinking disabled.`). Jika level tidak valid (misalnya `/thinking big`), perintah ditolak dengan petunjuk dan status sesi dibiarkan tidak berubah.
- Kirim `/think` (atau `/think:`) tanpa argumen untuk melihat level pemikiran saat ini.

## Penerapan oleh agen

- **OpenClaw tersemat**: level yang diselesaikan diteruskan ke runtime agen OpenClaw dalam proses.
- **Backend Claude CLI**: level non-off diteruskan ke Claude Code sebagai `--effort` saat memakai `claude-cli`; lihat [backend CLI](/id/gateway/cli-backends).

## Mode cepat (/fast)

- Level: `auto|on|off|default`.
- Pesan yang hanya berisi direktif mengaktifkan/menonaktifkan override mode cepat sesi dan membalas `Fast mode set to auto.`, `Fast mode enabled.`, atau `Fast mode disabled.`. Gunakan `/fast default` untuk menghapus override sesi dan mewarisi default yang dikonfigurasi; alias mencakup `inherit`, `clear`, `reset`, dan `unpin`.
- Kirim `/fast` (atau `/fast status`) tanpa mode untuk melihat status mode cepat efektif saat ini.
- OpenClaw menyelesaikan mode cepat dalam urutan ini:
  1. Override inline/hanya-direktif `/fast auto|on|off` (`/fast default` menghapus lapisan ini)
  2. Override sesi
  3. Default per agen (`agents.list[].fastModeDefault`)
  4. Konfigurasi per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- `auto` mempertahankan mode sesi/konfigurasi sebagai auto tetapi menyelesaikan setiap panggilan model baru secara independen. Panggilan yang dimulai sebelum batas auto mengaktifkan mode cepat; panggilan retry, fallback, hasil-tool, atau lanjutan yang lebih belakangan dimulai dengan mode cepat dinonaktifkan. Batas defaultnya 60 detik; tetapkan `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` pada model aktif untuk mengubahnya.
- Untuk `openai/*`, mode cepat dipetakan ke pemrosesan prioritas OpenAI dengan mengirim `service_tier=priority` pada permintaan Responses yang didukung.
- Untuk model `openai/*` / `openai-codex/*` yang didukung Codex, mode cepat mengirim flag `service_tier=priority` yang sama pada Codex Responses. Giliran app-server Codex native menerima tier hanya pada `turn/start` atau mulai/lanjutkan thread, jadi `auto` tidak dapat mengubah tier satu giliran app-server yang sudah berjalan; ini berlaku pada giliran model berikutnya yang dimulai OpenClaw.
- Untuk permintaan publik langsung `anthropic/*`, termasuk traffic terautentikasi OAuth yang dikirim ke `api.anthropic.com`, mode cepat dipetakan ke tier layanan Anthropic: `/fast on` menetapkan `service_tier=auto`, `/fast off` menetapkan `service_tier=standard_only`.
- Untuk `minimax/*` pada jalur yang kompatibel dengan Anthropic, `/fast on` (atau `params.fastMode: true`) menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.
- Parameter model Anthropic `serviceTier` / `service_tier` eksplisit mengoverride default mode cepat saat keduanya ditetapkan. OpenClaw tetap melewati injeksi tier layanan Anthropic untuk URL basis proxy non-Anthropic.
- `/status` menampilkan `Fast` saat mode cepat diaktifkan dan `Fast:auto` saat mode yang dikonfigurasi adalah auto.

## Direktif verbose (/verbose atau /v)

- Level: `on` (minimal) | `full` | `off` (default).
- Pesan yang hanya berisi direktif mengaktifkan/menonaktifkan verbose sesi dan membalas `Verbose logging enabled.` / `Verbose logging disabled.`; level tidak valid mengembalikan petunjuk tanpa mengubah status.
- `/verbose off` menyimpan override sesi eksplisit; hapus melalui UI Sesi dengan memilih `inherit`.
- Pengirim kanal eksternal yang berwenang dapat mempertahankan override verbose sesi. Klien gateway/webchat internal memerlukan `operator.admin` untuk mempertahankannya.
- Direktif inline hanya memengaruhi pesan tersebut; default sesi/global berlaku selain itu.
- Kirim `/verbose` (atau `/verbose:`) tanpa argumen untuk melihat level verbose saat ini.
- Saat verbose aktif, agen yang memancarkan hasil tool terstruktur mengirim setiap panggilan tool kembali sebagai pesan khusus metadata tersendiri, diawali dengan `<emoji> <tool-name>: <arg>` jika tersedia. Ringkasan tool ini dikirim segera setelah setiap tool dimulai (gelembung terpisah), bukan sebagai delta streaming.
- Ringkasan kegagalan tool tetap terlihat dalam mode normal, tetapi sufiks detail error mentah disembunyikan kecuali verbose adalah `full`.
- Saat verbose adalah `full`, output tool juga diteruskan setelah selesai (gelembung terpisah, dipotong ke panjang aman). Jika Anda mengalihkan `/verbose on|full|off` saat sebuah run sedang berjalan, gelembung tool berikutnya mengikuti pengaturan baru.
- `agents.defaults.toolProgressDetail` mengontrol bentuk ringkasan tool `/verbose` dan baris tool draf progres. Gunakan `"explain"` (default) untuk label manusia ringkas seperti `🛠️ Exec: checking JS syntax`; gunakan `"raw"` saat Anda juga menginginkan perintah/detail mentah ditambahkan untuk debugging. `agents.list[].toolProgressDetail` per agen mengoverride default.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Direktif trace Plugin (/trace)

- Level: `on` | `off` (default).
- Pesan yang hanya berisi direktif mengaktifkan/menonaktifkan output trace Plugin sesi dan membalas `Plugin trace enabled.` / `Plugin trace disabled.`.
- Direktif inline hanya memengaruhi pesan tersebut; default sesi/global berlaku selain itu.
- Kirim `/trace` (atau `/trace:`) tanpa argumen untuk melihat level trace saat ini.
- `/trace` lebih sempit daripada `/verbose`: ini hanya mengekspos baris trace/debug milik Plugin seperti ringkasan debug Active Memory.
- Baris trace dapat muncul di `/status` dan sebagai pesan diagnostik susulan setelah balasan asisten normal.

## Visibilitas penalaran (/reasoning)

- Level: `on|off|stream`.
- Pesan yang hanya berisi direktif mengaktifkan/menonaktifkan apakah blok pemikiran ditampilkan dalam balasan.
- Saat diaktifkan, penalaran dikirim sebagai **pesan terpisah** yang diawali dengan `Thinking`.
- `stream`: men-stream penalaran saat balasan sedang dibuat ketika kanal aktif mendukung pratinjau penalaran, lalu mengirim jawaban final tanpa penalaran.
- Alias: `/reason`.
- Kirim `/reasoning` (atau `/reasoning:`) tanpa argumen untuk melihat level penalaran saat ini.
- Urutan resolusi: direktif inline, lalu override sesi, lalu default per agen (`agents.list[].reasoningDefault`), lalu default global (`agents.defaults.reasoningDefault`), lalu fallback (`off`).

Tag penalaran model lokal yang tidak valid ditangani secara konservatif. Blok `<think>...</think>` yang tertutup tetap disembunyikan pada balasan normal, dan penalaran yang tidak tertutup setelah teks yang sudah terlihat juga disembunyikan. Jika balasan sepenuhnya dibungkus dalam satu tag pembuka yang tidak tertutup dan jika tidak demikian akan dikirim sebagai teks kosong, OpenClaw menghapus tag pembuka yang tidak valid dan mengirimkan teks yang tersisa.

## Terkait

- Dokumentasi mode tinggi tersedia di [Mode tinggi](/id/tools/elevated).

## Heartbeat

- Isi probe Heartbeat adalah prompt heartbeat yang dikonfigurasi (default: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Arahan inline dalam pesan heartbeat berlaku seperti biasa (tetapi hindari mengubah default sesi dari heartbeat).
- Pengiriman Heartbeat secara default hanya mengirim payload akhir. Untuk juga mengirim pesan `Thinking` terpisah (jika tersedia), atur `agents.defaults.heartbeat.includeReasoning: true` atau per agen `agents.list[].heartbeat.includeReasoning: true`.

## UI obrolan web

- Pemilih pemikiran obrolan web mencerminkan level tersimpan sesi dari penyimpanan/konfigurasi sesi masuk saat halaman dimuat.
- Memilih level lain langsung menulis override sesi melalui `sessions.patch`; ini tidak menunggu pengiriman berikutnya dan bukan override sekali pakai `thinkingOnce`.
- Opsi pertama selalu merupakan pilihan untuk menghapus override. Opsi ini menampilkan `Inherited: <resolved level>`, termasuk `Inherited: Off` saat pemikiran terwarisi dinonaktifkan.
- Pilihan pemilih eksplisit menggunakan label level langsungnya sambil mempertahankan label penyedia jika ada (misalnya `Maximum` untuk opsi `max` berlabel penyedia).
- Pemilih menggunakan `thinkingLevels` yang dikembalikan oleh baris/default sesi Gateway, dengan `thinkingOptions` dipertahankan sebagai daftar label lama. UI browser tidak menyimpan daftar regex penyedianya sendiri; plugins memiliki kumpulan level khusus model.
- `/think:<level>` tetap berfungsi dan memperbarui level sesi tersimpan yang sama, sehingga arahan obrolan dan pemilih tetap sinkron.

## Profil penyedia

- Plugin penyedia dapat mengekspos `resolveThinkingProfile(ctx)` untuk menentukan level yang didukung model dan defaultnya.
- Plugin penyedia yang mem-proxy model Claude sebaiknya menggunakan kembali `resolveClaudeThinkingProfile(modelId)` dari `openclaw/plugin-sdk/provider-model-shared` agar katalog Anthropic langsung dan proxy tetap selaras.
- Setiap level profil memiliki `id` kanonis tersimpan (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, atau `max`) dan dapat menyertakan `label` tampilan. Penyedia biner menggunakan `{ id: "low", label: "on" }`.
- Hook profil menerima fakta katalog gabungan saat tersedia, termasuk `reasoning`, `compat.thinkingFormat`, dan `compat.supportedReasoningEfforts`. Gunakan fakta tersebut untuk mengekspos profil biner atau kustom hanya saat kontrak permintaan yang dikonfigurasi mendukung payload yang sesuai.
- Plugin alat yang perlu memvalidasi override pemikiran eksplisit sebaiknya menggunakan `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)`; plugin tersebut tidak boleh menyimpan daftar level penyedia/modelnya sendiri.
- Plugin alat dengan akses ke metadata model kustom yang dikonfigurasi dapat meneruskan `catalog` ke `resolveThinkingPolicy` agar opt-in `compat.supportedReasoningEfforts` tercermin dalam validasi sisi plugin.
- Hook lama yang dipublikasikan (`supportsXHighThinking`, `isBinaryThinking`, dan `resolveDefaultThinkingLevel`) tetap ada sebagai adaptor kompatibilitas, tetapi kumpulan level kustom baru sebaiknya menggunakan `resolveThinkingProfile`.
- Baris/default Gateway mengekspos `thinkingLevels`, `thinkingOptions`, dan `thinkingDefault` agar klien ACP/obrolan merender id dan label profil yang sama dengan yang digunakan validasi runtime.
