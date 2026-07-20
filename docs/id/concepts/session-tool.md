---
read_when:
    - Anda ingin memahami alat sesi yang tersedia bagi agen
    - Anda ingin mengonfigurasi akses lintas sesi atau pembuatan subagen
    - Anda ingin memeriksa status subagen yang dijalankan
summary: Alat agen untuk status lintas sesi, pengingatan kembali, perpesanan, dan orkestrasi subagen
title: Alat sesi
x-i18n:
    generated_at: "2026-07-20T03:46:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ceaf48addc9fc57afe2f6428cda03ed8b19f4efce93b13b58b7ef493a41c62fe
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw menyediakan alat bagi agen untuk bekerja lintas sesi, memeriksa status, dan mengorkestrasi sub-agen.

## Alat yang tersedia

| Alat                 | Fungsinya                                                                   |
| -------------------- | --------------------------------------------------------------------------- |
| `sessions`           | Memperbarui pengaturan sesi yang terlihat dan mengelola katalog grup sesi global |
| `sessions_list`      | Mencantumkan sesi dengan filter opsional (jenis, label, agen, arsip, pratinjau) |
| `sessions_search`    | Mencari transkrip sesi yang terlihat dan mengembalikan cuplikan yang cocok |
| `sessions_history`   | Membaca transkrip sesi tertentu                                            |
| `sessions_send`      | Menjalankan sesi lain pada Gateway yang sama dan secara opsional menunggu |
| `conversations_list` | Mencantumkan alamat percakapan eksternal yang stabil                        |
| `conversations_send` | Mengirim ke satu percakapan eksternal tertentu tanpa menjalankan sesi lokal |
| `conversations_turn` | Mengirim ke satu percakapan eksternal tertentu dan menunggu balasan terkaitnya |
| `sessions_spawn`     | Membuat sesi sub-agen terisolasi untuk pekerjaan latar belakang            |
| `sessions_yield`     | Mengakhiri giliran saat ini dan menunggu hasil tindak lanjut sub-agen       |
| `subagents`          | Mencantumkan atau membatalkan pekerjaan latar belakang dalam pohon sesi ini |
| `session_status`     | Menampilkan kartu bergaya `/status` dan secara opsional menetapkan penggantian model per sesi |

Alat-alat ini tetap tunduk pada profil alat aktif dan kebijakan izinkan/tolak. `tools.profile: "coding"` mencakup rangkaian lengkap orkestrasi sesi. `tools.profile: "messaging"` mencakup layanan mandiri sesi, penemuan, pengingatan, perpesanan lintas sesi, alat percakapan eksternal, dan siklus pembuatan lengkap (`sessions_spawn`, `sessions_yield`, dan `subagents`). Alat saran tugas khusus UI `spawn_task` dan `dismiss_task` tetap merupakan alat profil pengodean.

Kebijakan grup, penyedia, sandbox, dan per agen masih dapat menghapus alat-alat tersebut setelah tahap profil. Gunakan `/tools` dari sesi yang terdampak untuk memeriksa daftar alat yang berlaku.

## Mencantumkan dan membaca sesi

`sessions_list` mengembalikan baris penemuan yang terfokus: kunci sesi, agen, jenis, kanal, bidang label/judul/pratinjau, hubungan induk dan anak, pembaruan terakhir, status arsip/sematan, versi status, model, jumlah token konteks/total, status proses, dan apakah proses terakhir dibatalkan. Filter berdasarkan `kinds` (larik; nilai yang diterima: `main`, `group`, `cron`, `hook`, `node`, `other`), `label` persis, `agentId` persis, teks `search`, atau keterkinian (`activeMinutes`). Sesi aktif dikembalikan secara default; berikan `archived: true` untuk memeriksa sesi yang diarsipkan sebagai gantinya. Tetapkan `includeDerivedTitles`, `includeLastMessage`, atau `messageLimit` (dibatasi hingga 20) saat Anda memerlukan triase bergaya kotak masuk: judul turunan yang dibatasi oleh visibilitas, cuplikan pratinjau pesan terakhir, atau pesan terbaru yang dibatasi pada setiap baris. Perutean pengiriman, ID sesi internal, waktu/pengaturan per proses, perkiraan biaya, dan jalur transkrip sengaja dihilangkan; gunakan `session_status`, alat percakapan, dan `sessions_history` untuk detail khusus pemilik tersebut. Judul dan pratinjau turunan hanya dihasilkan untuk sesi yang sudah dapat dilihat pemanggil berdasarkan kebijakan visibilitas alat sesi yang dikonfigurasi, sehingga sesi yang tidak terkait tetap tersembunyi. Saat visibilitas dibatasi, `sessions_list` mengembalikan metadata opsional `visibility` yang menunjukkan mode efektif dan peringatan bahwa hasil mungkin dibatasi oleh cakupan.

`sessions_history` mengambil transkrip percakapan untuk sesi tertentu. Secara default, hasil alat dikecualikan; berikan `includeTools: true` untuk melihatnya. Gunakan `limit` untuk bagian terbaru yang dibatasi. Berikan `offset: 0` saat Anda memerlukan metadata paginasi, lalu berikan nilai `nextOffset` yang dikembalikan untuk menelusuri mundur jendela transkrip OpenClaw yang lebih lama tanpa membaca berkas transkrip mentah. Halaman dengan offset eksplisit tidak menggabungkan impor fallback CLI eksternal; gunakan tampilan bagian terbaru default (tanpa `offset`) saat Anda memerlukan riwayat tampilan gabungan tersebut.

Tampilan yang dikembalikan sengaja dibatasi dan difilter demi keamanan:

- teks asisten dinormalisasi sebelum dipanggil kembali:
  - tag pemikiran dihapus
  - blok kerangka `<relevant-memories>` / `<relevant_memories>` dihapus
  - blok payload XML pemanggilan alat berbentuk teks biasa seperti `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, dan `<function_calls>...</function_calls>` dihapus, termasuk payload terpotong yang tidak pernah ditutup dengan benar
  - kerangka pemanggilan/hasil alat yang diturunkan seperti `[Tool Call: ...]`, `[Tool Result ...]`, dan `[Historical context ...]` dihapus
  - token kontrol model yang bocor seperti `<|assistant|>`, token ASCII `<|...|>` lainnya, dan varian lebar penuh `<｜...｜>` dihapus
  - XML pemanggilan alat MiniMax yang cacat seperti `<invoke ...>` / `</minimax:tool_call>` dihapus
- teks yang menyerupai kredensial/token disunting sebelum dikembalikan
- blok teks panjang dipotong
- riwayat yang sangat besar dapat membuang baris lama atau mengganti baris yang terlalu besar dengan `[sessions_history omitted: message too large]`
- alat melaporkan penanda ringkasan seperti `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted`, `bytes`, dan metadata paginasi

Gunakan **kunci sesi** yang dikembalikan (seperti `"main"`) dengan `sessions_history`, `sessions_send`, dan `session_status`. Alat sasaran tersebut juga dapat menemukan ID sesi yang diketahui, tetapi `sessions_list` tidak mengekspos ID internal.

Jika Anda memerlukan transkrip mentah yang tepat, periksa baris transkrip SQLite yang tercakup alih-alih menganggap `sessions_history` sebagai hasil ekspor tanpa filter.

Gunakan [`sessions_search`](/id/concepts/session-search) untuk pengingatan teks lengkap yang tepat di seluruh teks transkrip pengguna dan asisten yang terlihat. Hasilnya menyertakan `sessionKey` untuk pemanggilan `sessions_history` lanjutan; pemfilteran visibilitas, penyuntingan cuplikan, dan batas keluaran sama dengan batas riwayat.

## Mengelola pengaturan dan grup sesi

Alat `sessions` yang dibatasi bagi pemilik mengekspos dua permukaan layanan mandiri terbatas:

- `action: "patch"` mengubah sesi saat ini secara default, atau sesi lain yang terlihat dan dipilih melalui `sessionKey`. Alat ini dapat menetapkan label, ikon bilah samping, status sematan/arsip, model, dan tingkat pemikiran. Alat ini tidak mengekspos tindakan atur ulang, hapus, atau pemadatan.
- `group_list`, `group_set`, `group_rename`, dan `group_delete` mengelola katalog grup sesi global yang berurutan. `group_set` mengganti daftar nama berurutan alih-alih memperbarui satu entri.

Pembaruan model yang dipilih agen tetap dapat dibatalkan sampai pilihan tersebut menyelesaikan proses yang berhasil. Jika model yang dipilih dipastikan tidak dapat digunakan karena kegagalan autentikasi, penagihan, atau model tidak ditemukan, OpenClaw memulihkan model sebelumnya dan menulis catatan sistem yang terlihat. Kegagalan sementara akibat batas laju, kelebihan beban, batas waktu, jaringan, dan server tidak membatalkan pilihan.

## Sesi versus percakapan

**Sesi** adalah konteks model lokal. **Percakapan** adalah alamat eksternal tertentu seperti satu rekan, kanal, atau utas. Keduanya tertaut, tetapi tidak dapat saling menggantikan: pesan langsung dapat berbagi satu sesi `main` sekaligus mempertahankan alamat percakapan terpisah.

`conversations_list` mengembalikan nilai `conversationRef` buram untuk agen aktif. Dengan `channel` eksplisit, Gateway juga menyegarkan alamat dari direktori lokal kanal tersebut, seperti rekan Reef yang disetujui; gunakan `query` untuk menemukan rekan tertentu di luar halaman hasil saat ini. Penemuan mengatalogkan alamat tanpa membuat sesi konteks model; sesi pendukung hanya dibuat ketika pengiriman atau konteks masuk memerlukannya. Penemuan dan pengiriman percakapan hanya tersedia bagi pemilik karena menggunakan kredensial kanal Gateway. Gunakan `conversations_send` untuk pengiriman tanpa menunggu hasil. Gunakan `conversations_turn` ketika balasan jarak jauh termasuk dalam giliran model saat ini: Gateway mencadangkan satu ID pesan transportasi, menyimpan operasi pengiriman dan maksud antrean sebelum I/O transportasi, serta mengembalikan balasan terkait dari alat alih-alih memulai giliran agen lokal kedua. Operasi pengiriman berada di luar transkrip model; balasan yang ditangkap hanya disimpan sebagai artefak sampingan sementara hasil alat memiliki konteks model. Jika Gateway dimulai ulang setelah pengantrean, pengiriman dapat dipulihkan, tetapi balasan berikutnya mengikuti pengiriman masuk biasa karena penunggu lokal proses telah hilang. Pesan masuk yang tidak diminta selalu berlanjut melalui jalur pengiriman kanal normal.

Gunakan alat bersama `message` ketika Anda sudah memiliki sasaran kanal mentah yang eksplisit atau memerlukan tindakan khusus kanal. Referensi percakapan dicakup untuk agen aktif dan harus diperoleh melalui `conversations_list`, bukan dibuat dari kunci sesi.

Dalam Mode Kode, alat percakapan menggunakan kembali kontrak keluaran Gateway persisnya. Satu sel `exec` dapat mencantumkan alamat, memilih `conversationRef` yang dikembalikan, dan memanggil `conversations_send` atau `conversations_turn`; kebijakan alat dan persetujuan normal tetap berlaku untuk pemanggilan bertingkat.

## Mengirim pesan lintas sesi

`sessions_send` menjalankan sesi lain pada Gateway yang sama dan secara opsional menunggu respons. `sessionKey`, `label`, atau `agentId` memilih konteks model lokal, bukan tujuan eksternal. Balasan yang dihasilkan masih dapat diumumkan melalui konteks pengiriman pemohon atau sasaran yang telah ditetapkan; perilaku yang ada tersebut tidak berubah. Untuk pengiriman eksternal yang tepat, gunakan alat percakapan atau `message` dengan kanal dan sasaran eksplisit.

- **Kirim tanpa menunggu hasil:** tetapkan `timeoutSeconds: 0` untuk memasukkan ke antrean dan segera kembali.
- **Tunggu balasan:** tetapkan batas waktu dan dapatkan respons secara langsung.

Sesi obrolan yang dicakup oleh utas, seperti kunci yang berakhiran `:thread:<id>`, bukan sasaran `sessions_send` yang valid. Gunakan kunci sesi kanal induk untuk koordinasi antaragen agar pesan yang dirutekan oleh alat tidak muncul di dalam utas aktif yang ditujukan kepada manusia.

Pesan dan balasan tindak lanjut A2A ditandai sebagai data antarsesi dalam prompt penerima (`[Inter-session message ... isUser=false]`) dan dalam asal-usul transkrip. Agen penerima harus memperlakukannya sebagai data yang dirutekan oleh alat, bukan sebagai instruksi langsung yang ditulis pengguna akhir.

Setelah sasaran merespons, OpenClaw dapat menjalankan **siklus balasan kembali** tempat para agen mengirim pesan secara bergantian hingga batas bawaan. Agen sasaran dapat membalas `REPLY_SKIP` untuk berhenti lebih awal.

Berikan `watch: true` untuk juga mendaftarkan pengirim sebagai pemantau perubahan status sasaran: ketika aktor lain kemudian mengirim pesan langsung dari manusia ke sasaran atau mengubah tujuannya, pengirim menerima pemberitahuan sistem yang menunjuk ke `session_status` `changesSince`. Pendaftaran terjadi setelah pengiriman berhasil, menyasar sesi yang benar-benar menerima pesan, dan dimulai pada versi statusnya saat ini, sehingga hanya perubahan berikutnya yang menghasilkan pemberitahuan. Hasil melaporkan `watched: true` ketika pendaftaran berhasil. Lihat [Kesadaran status sesi](/id/concepts/session-state).

## Bantuan status dan orkestrasi

`session_status` adalah alat ringan yang setara dengan `/status` untuk sesi saat ini atau sesi lain yang terlihat. Alat ini melaporkan penggunaan, waktu, status model/runtime, dan konteks tugas latar belakang yang tertaut jika ada. Seperti `/status`, alat ini dapat mengisi kembali penghitung token/cache yang jarang dari entri penggunaan transkrip terbaru, dan `model=default` menghapus penggantian per sesi. Gunakan `sessionKey="current"` untuk sesi pemanggil saat ini; label klien yang terlihat seperti `openclaw-tui` bukanlah kunci sesi.

Jika metadata rute tersedia, `session_status` juga menyertakan blok JSON `Route context` yang terlihat dan bidang terstruktur `details` yang sesuai. Bidang-bidang ini membedakan kunci sesi dari rute yang saat ini menangani eksekusi langsung:

- `origin` adalah tempat sesi dibuat, atau penyedia yang disimpulkan dari prefiks kunci sesi yang dapat menerima pengiriman ketika status lama tidak memiliki metadata asal yang tersimpan.
- `active` adalah rute eksekusi langsung saat ini. Ini hanya dilaporkan untuk sesi langsung atau sesi saat ini yang sedang ditangani.
- `deliveryContext` adalah rute pengiriman persisten yang tersimpan pada sesi, yang dapat digunakan kembali oleh OpenClaw untuk pengiriman berikutnya meskipun permukaan aktif berbeda.

## Perubahan status sesi

OpenClaw menyimpan log sinyal persisten tentang perubahan material pada status sesi (pesan langsung manusia ke sesi yang dipantau, hasil eksekusi turunan, perubahan tujuan, Compaction). Baris `sessions_list` dan `session_status` mengekspos `stateVersion` sesi, dan `session_status` menerima `changesSince: <version>` untuk mengembalikan peristiwa bertipe setelah versi tersebut, dengan pensinyalan `historyGap` yang tepat ketika versi yang diminta mendahului riwayat yang dipertahankan. Pemantau — induk pemunculan secara otomatis, `sessions_send watch: true` secara eksplisit — menerima satu pemberitahuan status kedaluwarsa yang digabungkan ketika aktor lain mengubah sesi yang dipantau.

Peristiwa perubahan status menghilangkan ID sesi/agen yang berulang dan hanya mengekspos bidang muatan yang berguna bagi model (`outcome`, `channel`, atau `turns`). Ringkasan peristiwa dan pengidentifikasi aktor/eksekusi tetap tersedia untuk rekonsiliasi.

Lihat [Kesadaran status sesi](/id/concepts/session-state) untuk model lengkap: jenis peristiwa, pendaftaran pemantau, protokol pemberitahuan anti-spam, alur rekonsiliasi, dan batasan saat ini.

`sessions_yield` sengaja mengakhiri giliran saat ini agar pesan berikutnya dapat berupa peristiwa tindak lanjut yang Anda tunggu. Gunakan ini setelah memunculkan subagen jika Anda ingin hasil penyelesaian tiba sebagai pesan berikutnya alih-alih membuat perulangan polling.

`subagents` adalah tampilan pohon sesi atas eksekusi subagen native dan buku besar tugas latar belakang bersama. `action: "list"` melaporkan subagen aktif/terkini serta tugas ACP, CLI/media, dan cron yang tercakup. `action: "cancel"` menerima `taskId` yang dikembalikan dan hanya dapat menghentikan pekerjaan di dalam pohon sesi yang dikendalikan pemanggil; subagen daun tidak dapat membatalkan tugas sesi lain.

## Memunculkan subagen

`sessions_spawn` secara default membuat sesi terisolasi untuk tugas latar belakang. Operasi ini selalu nonblokir; operasi segera mengembalikan `runId` dan `childSessionKey`. Eksekusi subagen native menerima tugas yang didelegasikan dalam pesan `[Subagent Task]` pertama yang terlihat di sesi turunan, sementara prompt sistem hanya membawa aturan runtime subagen dan konteks perutean.

Opsi utama:

- `runtime: "subagent"` (default) atau `"acp"` untuk agen harness eksternal.
- Penimpaan `model` dan `thinking` untuk sesi turunan.
- `thread: true` untuk mengikat pemunculan ke utas obrolan (Discord, Slack, dll.).
- `sandbox: "require"` untuk memberlakukan sandboxing pada turunan.
- `context: "fork"` untuk subagen native ketika turunan memerlukan transkrip pemohon saat ini; hilangkan opsi ini atau gunakan `context: "isolated"` untuk turunan yang bersih. `context: "fork"` hanya valid dengan `runtime: "subagent"`. Subagen native yang terikat ke utas secara default menggunakan `context: "fork"`, kecuali jika `threadBindings.defaultSpawnContext` menentukan sebaliknya.
- `visible: true` untuk membuat sesi dasbor persisten alih-alih sesi subagen tersembunyi. Pemunculan yang terlihat mendukung model eksplisit, direktori kerja, percabangan transkrip agen yang sama, dan [worktree terkelola](/id/concepts/managed-worktrees) opsional; lihat [Subagen](/id/tools/subagents#tool-parameters) untuk batas kompatibilitas yang tepat.

Subagen daun default tidak mendapatkan alat sesi. Ketika `maxSpawnDepth >= 2`, subagen orkestrator kedalaman-1 juga menerima `sessions_spawn`, `subagents`, `sessions_list`, dan `sessions_history` agar dapat mengelola turunannya sendiri. Eksekusi daun tetap tidak mendapatkan alat orkestrasi rekursif.

Setelah selesai, langkah pengumuman mengirimkan hasil ke kanal pemohon. Pengiriman penyelesaian mempertahankan perutean utas/topik terikat jika tersedia, dan jika asal penyelesaian hanya mengidentifikasi kanal, OpenClaw tetap dapat menggunakan kembali rute tersimpan sesi pemohon (`lastChannel` / `lastTo`) untuk pengiriman langsung.

Untuk perilaku khusus ACP, lihat [Agen ACP](/id/tools/acp-agents).

## Visibilitas

Alat sesi dicakup untuk membatasi apa yang dapat dilihat agen:

| Tingkat   | Cakupan                                                      |
| ------- | ---------------------------------------------------------- |
| `self`  | Hanya sesi saat ini                                   |
| `tree`  | Saat ini + yang dimunculkan; pembacaan mencakup grup agen yang sama yang dipantau |
| `agent` | Semua sesi untuk agen ini                                |
| `all`   | Semua sesi (lintas agen jika dikonfigurasi)                   |

Default-nya adalah `tree`. Sesi dalam sandbox dibatasi ke `tree` terlepas dari konfigurasi.
Dengan `session.dmScope: "main"` default, aktivitas grup membuat sesi grup
agen yang sama yang dipantau dapat dibaca dari sesi utama.

## Bacaan lebih lanjut

- [Pengelolaan Sesi](/id/concepts/session): perutean, siklus hidup, pemeliharaan
- [Subagen](/id/tools/subagents): siklus hidup dan pengiriman sesi turunan
- [Agen ACP](/id/tools/acp-agents): pemunculan harness eksternal
- [Multiagen](/id/concepts/multi-agent): arsitektur multiagen
- [Konfigurasi Gateway](/id/gateway/configuration): opsi konfigurasi alat sesi

## Terkait

- [Pengelolaan sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
