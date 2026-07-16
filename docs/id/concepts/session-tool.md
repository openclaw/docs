---
read_when:
    - Anda ingin memahami alat sesi apa saja yang dimiliki agen
    - Anda ingin mengonfigurasi akses lintas sesi atau pembuatan subagen
    - Anda ingin memeriksa status subagen yang dibuat
summary: Alat agen untuk status lintas sesi, pengingatan, perpesanan, dan orkestrasi subagen
title: Alat sesi
x-i18n:
    generated_at: "2026-07-16T18:06:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb0827e2eff6e53d3e7ef6f7d7f0497d8b431fcb23cb4b54c5851229086423cc
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw memberi agen alat untuk bekerja lintas sesi, memeriksa status, dan mengorkestrasi subagen.

## Alat yang tersedia

| Alat               | Fungsinya                                                                |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Mencantumkan sesi dengan filter opsional (jenis, label, agen, arsip, pratinjau)  |
| `sessions_history` | Membaca transkrip sesi tertentu                                   |
| `sessions_send`    | Mengirim pesan ke sesi lain dan secara opsional menunggu                       |
| `sessions_spawn`   | Membuat sesi subagen terisolasi untuk pekerjaan latar belakang                     |
| `sessions_yield`   | Mengakhiri giliran saat ini dan menunggu hasil tindak lanjut subagen               |
| `subagents`        | Mencantumkan status subagen yang dibuat untuk sesi ini                              |
| `session_status`   | Menampilkan kartu bergaya `/status` dan secara opsional menetapkan penggantian model per sesi |

Alat-alat ini tetap tunduk pada profil alat aktif serta kebijakan izinkan/tolak. `tools.profile: "coding"` mencakup rangkaian lengkap orkestrasi sesi, termasuk `sessions_spawn`, `sessions_yield`, dan `subagents`. `tools.profile: "messaging"` mencakup alat perpesanan lintas sesi (`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), tetapi tidak mencakup pembuatan subagen. Untuk mempertahankan profil perpesanan dan tetap mengizinkan delegasi native, tambahkan:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Kebijakan grup, penyedia, sandbox, dan per agen tetap dapat menghapus alat-alat tersebut setelah tahap profil. Gunakan `/tools` dari sesi yang terdampak untuk memeriksa daftar alat efektif.

## Mencantumkan dan membaca sesi

`sessions_list` mengembalikan sesi beserta kunci, agentId, jenis, kanal, model, jumlah token, dan stempel waktunya. Filter berdasarkan `kinds` (larik; nilai yang diterima: `main`, `group`, `cron`, `hook`, `node`, `other`), `label` yang persis, `agentId` yang persis, teks `search`, atau kebaruan (`activeMinutes`). Sesi aktif dikembalikan secara default; berikan `archived: true` untuk memeriksa sesi yang diarsipkan. Baris mencakup status `pinned` dan `archived`. Tetapkan `includeDerivedTitles`, `includeLastMessage`, atau `messageLimit` (dibatasi hingga 20) saat Anda memerlukan triase bergaya kotak masuk: judul turunan yang dibatasi cakupan visibilitas, cuplikan pratinjau pesan terakhir, atau pesan terbaru yang dibatasi pada setiap baris. Judul dan pratinjau turunan hanya dibuat untuk sesi yang sudah dapat dilihat pemanggil berdasarkan kebijakan visibilitas alat sesi yang dikonfigurasi, sehingga sesi yang tidak terkait tetap tersembunyi. Saat visibilitas dibatasi, `sessions_list` mengembalikan metadata `visibility` opsional yang menunjukkan mode efektif dan peringatan bahwa hasil mungkin dibatasi cakupan.

`sessions_history` mengambil transkrip percakapan untuk sesi tertentu. Secara default, hasil alat tidak disertakan; berikan `includeTools: true` untuk melihatnya. Gunakan `limit` untuk bagian akhir terbaru yang dibatasi. Berikan `offset: 0` saat Anda memerlukan metadata paginasi, lalu berikan nilai `nextOffset` yang dikembalikan untuk menelusuri mundur jendela transkrip OpenClaw yang lebih lama tanpa membaca berkas transkrip mentah. Halaman offset eksplisit tidak menggabungkan impor fallback CLI eksternal; gunakan tampilan bagian akhir terbaru default (tanpa `offset`) saat Anda memerlukan riwayat tampilan gabungan tersebut.

Tampilan yang dikembalikan sengaja dibatasi dan difilter demi keamanan:

- teks asisten dinormalisasi sebelum dipanggil kembali:
  - tag pemikiran dihapus
  - blok perancah `<relevant-memories>` / `<relevant_memories>` dihapus
  - blok payload XML pemanggilan alat teks biasa seperti `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, dan `<function_calls>...</function_calls>` dihapus, termasuk payload terpotong yang tidak pernah ditutup dengan benar
  - perancah pemanggilan/hasil alat yang diturunkan seperti `[Tool Call: ...]`, `[Tool Result ...]`, dan `[Historical context ...]` dihapus
  - token kontrol model yang bocor seperti `<|assistant|>`, token ASCII `<|...|>` lainnya, dan varian lebar penuh `<｜...｜>` dihapus
  - XML pemanggilan alat MiniMax yang cacat seperti `<invoke ...>` / `</minimax:tool_call>` dihapus
- teks menyerupai kredensial/token disamarkan sebelum dikembalikan
- blok teks panjang dipotong
- riwayat yang sangat besar dapat menghapus baris lama atau mengganti baris yang terlalu besar dengan `[sessions_history omitted: message too large]`
- alat melaporkan penanda ringkasan seperti `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted`, `bytes`, dan metadata paginasi

Kedua alat menerima **kunci sesi** (seperti `"main"`) atau **ID sesi** dari pemanggilan daftar sebelumnya.

Jika Anda memerlukan transkrip mentah yang persis, periksa baris transkrip SQLite yang dibatasi cakupan alih-alih memperlakukan `sessions_history` sebagai hasil curah tanpa filter.

## Mengirim pesan lintas sesi

`sessions_send` mengirimkan pesan ke sesi lain dan secara opsional menunggu respons:

- **Kirim tanpa menunggu:** tetapkan `timeoutSeconds: 0` untuk memasukkan ke antrean dan segera kembali.
- **Tunggu balasan:** tetapkan batas waktu dan dapatkan respons secara langsung.

Sesi obrolan yang dibatasi cakupan utas, seperti kunci yang berakhiran `:thread:<id>`, bukan target `sessions_send` yang valid. Gunakan kunci sesi kanal induk untuk koordinasi antaragen agar pesan yang dirutekan melalui alat tidak muncul di dalam utas aktif yang terlihat oleh manusia.

Pesan dan balasan tindak lanjut A2A ditandai sebagai data antarsesi dalam prompt penerima (`[Inter-session message ... isUser=false]`) dan dalam asal-usul transkrip. Agen penerima harus memperlakukannya sebagai data yang dirutekan melalui alat, bukan sebagai instruksi yang ditulis langsung oleh pengguna akhir.

Setelah target merespons, OpenClaw dapat menjalankan **siklus balas kembali** tempat agen saling bergantian mengirim pesan (hingga `session.agentToAgent.maxPingPongTurns`, rentang 0-20, default 5). Agen target dapat membalas `REPLY_SKIP` untuk berhenti lebih awal.

Berikan `watch: true` untuk juga mendaftarkan pengirim sebagai pemantau perubahan status target: ketika aktor lain kemudian mengirim pesan manusia langsung kepada target atau mengubah tujuannya, pengirim menerima pemberitahuan sistem yang menunjuk ke `session_status` `changesSince`. Pendaftaran terjadi setelah pengiriman berhasil, menargetkan sesi yang benar-benar menerima pesan, dan dimulai pada versi status saat ini, sehingga hanya perubahan berikutnya yang menghasilkan pemberitahuan. Hasil melaporkan `watched: true` saat pendaftaran berhasil. Lihat [Kesadaran status sesi](/concepts/session-state).

## Pembantu status dan orkestrasi

`session_status` adalah alat ringan yang setara dengan `/status` untuk sesi saat ini atau sesi lain yang terlihat. Alat ini melaporkan penggunaan, waktu, status model/runtime, dan konteks tugas latar belakang tertaut jika ada. Seperti `/status`, alat ini dapat mengisi kembali penghitung token/cache yang jarang dari entri penggunaan transkrip terbaru, dan `model=default` menghapus penggantian per sesi. Gunakan `sessionKey="current"` untuk sesi pemanggil saat ini; label klien yang terlihat seperti `openclaw-tui` bukan kunci sesi.

Saat metadata rute tersedia, `session_status` juga menyertakan blok JSON `Route context` yang terlihat dan bidang terstruktur `details` yang sesuai. Bidang-bidang ini membedakan kunci sesi dari rute yang saat ini menangani proses aktif:

- `origin` adalah tempat sesi dibuat, atau penyedia yang disimpulkan dari prefiks kunci sesi yang dapat dikirimi ketika status lama tidak memiliki metadata asal tersimpan.
- `active` adalah rute proses aktif saat ini. Ini hanya dilaporkan untuk sesi aktif atau sesi saat ini yang sedang ditangani.
- `deliveryContext` adalah rute pengiriman persisten yang disimpan pada sesi, yang dapat digunakan kembali oleh OpenClaw untuk pengiriman berikutnya meskipun permukaan aktif berbeda.

## Perubahan status sesi

OpenClaw menyimpan log sinyal persisten tentang perubahan material pada status sesi (pesan manusia langsung ke sesi yang dipantau, hasil proses anak, perubahan tujuan, Compaction). Baris `sessions_list` dan `session_status` mengekspos `stateVersion` sesi, dan `session_status` menerima `changesSince: <version>` untuk mengembalikan peristiwa bertipe setelah versi tersebut, dengan `historyGap` yang persis menandakan saat versi yang diminta lebih lama daripada riwayat yang dipertahankan. Pemantau — induk pembuat secara otomatis, `sessions_send watch: true` secara eksplisit — menerima satu pemberitahuan status kedaluwarsa yang digabungkan ketika aktor lain mengubah sesi yang dipantau.

Lihat [Kesadaran status sesi](/concepts/session-state) untuk model lengkap: jenis peristiwa, pendaftaran pemantau, protokol pemberitahuan antispam, alur rekonsiliasi, dan batas saat ini.

`sessions_yield` sengaja mengakhiri giliran saat ini agar pesan berikutnya dapat berupa peristiwa tindak lanjut yang Anda tunggu. Gunakan setelah membuat subagen jika Anda ingin hasil penyelesaian tiba sebagai pesan berikutnya alih-alih membuat siklus polling.

`subagents` adalah pembantu visibilitas untuk subagen OpenClaw yang telah dibuat. Alat ini mendukung `action: "list"` untuk memeriksa proses aktif/terbaru.

## Membuat subagen

`sessions_spawn` secara default membuat sesi terisolasi untuk tugas latar belakang. Alat ini selalu nonblokir; alat segera kembali dengan `runId` dan `childSessionKey`. Proses subagen native menerima tugas yang didelegasikan dalam pesan `[Subagent Task]` pertama yang terlihat pada sesi anak, sedangkan prompt sistem hanya memuat aturan runtime subagen dan konteks perutean.

Opsi utama:

- `runtime: "subagent"` (default) atau `"acp"` untuk agen harness eksternal.
- Penggantian `model` dan `thinking` untuk sesi anak.
- `thread: true` untuk mengikat pembuatan ke utas obrolan (Discord, Slack, dll.).
- `sandbox: "require"` untuk memberlakukan sandbox pada sesi anak.
- `context: "fork"` untuk subagen native saat anak memerlukan transkrip pemohon saat ini; hilangkan atau gunakan `context: "isolated"` untuk anak yang bersih. `context: "fork"` hanya valid dengan `runtime: "subagent"`. Subagen native yang terikat utas secara default menggunakan `context: "fork"` kecuali `threadBindings.defaultSpawnContext` menentukan sebaliknya.

Subagen daun default tidak mendapatkan alat sesi. Ketika `maxSpawnDepth >= 2`, subagen orkestrator kedalaman-1 juga menerima `sessions_spawn`, `subagents`, `sessions_list`, dan `sessions_history` agar dapat mengelola anaknya sendiri. Proses daun tetap tidak mendapatkan alat orkestrasi rekursif.

Setelah selesai, langkah pengumuman memposting hasil ke kanal pemohon. Pengiriman penyelesaian mempertahankan perutean utas/topik terikat jika tersedia, dan jika asal penyelesaian hanya mengidentifikasi kanal, OpenClaw tetap dapat menggunakan kembali rute tersimpan sesi pemohon (`lastChannel` / `lastTo`) untuk pengiriman langsung.

Untuk perilaku khusus ACP, lihat [Agen ACP](/id/tools/acp-agents).

## Visibilitas

Alat sesi dibatasi cakupannya untuk membatasi apa yang dapat dilihat agen:

| Tingkat   | Cakupan                                    |
| ------- | ---------------------------------------- |
| `self`  | Hanya sesi saat ini                 |
| `tree`  | Sesi saat ini + subagen yang dibuat     |
| `agent` | Semua sesi untuk agen ini              |
| `all`   | Semua sesi (lintas agen jika dikonfigurasi) |

Default-nya adalah `tree`. Sesi dalam sandbox dibatasi ke `tree` terlepas dari konfigurasi.

## Bacaan lebih lanjut

- [Pengelolaan Sesi](/id/concepts/session): perutean, siklus hidup, pemeliharaan
- [Subagen](/id/tools/subagents): siklus hidup dan pengiriman sesi anak
- [Agen ACP](/id/tools/acp-agents): pemunculan harness eksternal
- [Multiagen](/id/concepts/multi-agent): arsitektur multiagen
- [Konfigurasi Gateway](/id/gateway/configuration): opsi konfigurasi alat sesi

## Terkait

- [Pengelolaan sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
