---
read_when:
    - Mengimplementasikan atau meninjau fitur dasbor sesi (papan)
    - Mengubah hosting widget, bridge widget, atau penyimpanan papan
summary: 'Dasbor sesi: arsitektur dan rencana implementasi (desain teknis, pra-GA)'
title: Arsitektur Dasbor
x-i18n:
    generated_at: "2026-07-19T05:24:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 472b6a9268f552f56b7aaa3ceecaa99e15722188f10d703d3321e9d60166904f
    source_path: web/dashboard-architecture.md
    workflow: 16
---

<Note>
Dokumen desain teknis untuk fitur dasbor sesi, ditulis sebelum dan
selama implementasi. Dokumen ini merupakan sumber kebenaran untuk pengembangannya. Saat
fitur dirilis, `/web/dashboard` menjadi halaman yang ditujukan bagi pengguna dan halaman ini tetap
menjadi referensi arsitektur.
</Note>

## Visi

Bekerja dengan agen saat ini berupa aliran teks. Dasbor mengubahnya menjadi
meja kerja: agen merender widget langsung dan interaktif; pengguna menyematkannya ke
permukaan persisten; obrolan ditambatkan ke samping (atau disembunyikan) dan konten utama
adalah papan. Anda beralih dari "berbicara dengan agen" menjadi "mengoperasikan panel kontrol yang
dibuat agen untuk Anda" tanpa pernah meninggalkan sesi.

Prinsip:

- **Papan adalah wajah suatu sesi, bukan objek baru.** Setiap sesi (utas)
  memiliki dua wajah: transkrip dan papan. Sesi tanpa widget yang disematkan
  adalah obrolan biasa. Sematkan satu widget dan papan pun ada. Papan mewarisi
  identitas sesi, kepemilikan agen, penamaan, penyematan, dan siklus hidup. Tidak ada
  `dashboard_create`, tidak ada registri papan, tidak ada model ACL terpisah.
- **Kesetaraan agen.** Segala sesuatu yang dapat dilakukan pengguna pada papan juga dapat dilakukan agen
  dengan alat: menambah/memperbarui/menghapus widget, menatanya, mengelola tab, mengganti
  tab yang terlihat, serta menambatkan atau menyembunyikan obrolan.
- **Native, bukan tersemat.** Papan merupakan komponen Lit dalam shell Control UI
  (sistem desain yang sama dengan bagian aplikasi lainnya). Hanya _konten_ widget yang
  disandbox dalam iframe. Tidak ada bilah URL, tidak ada krom peramban.
- **Permukaan agen yang kecil.** Widget dirujuk dengan nama stabil dan diperbarui
  di tempat. Tata letaknya berupa grid mengalir yang memadat otomatis; agen menyebutkan ukuran dan
  jangkar, bukan piksel atau koordinat.
- **Kapabilitas, bukan kepercayaan.** Kode widget adalah HTML/JS arbitrer yang dibuat agen
  dalam sandbox ketat. Jangkauan (data Gateway, tindakan, jaringan) hanya tersedia melalui
  manifes kapabilitas yang dideklarasikan dan diberikan oleh operator.

## Konsep

| Konsep              | Definisi                                                                                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sesi (utas)         | Sesi Gateway yang sudah ada, dikunci oleh `sessionKey` yang stabil. Dimiliki oleh agen.                                                                     |
| Papan               | Wajah widget dari satu sesi. Ada jika dan hanya jika sesi memiliki widget/tab. Bertahan dari `/new`/`/reset` (terikat pada `sessionKey`, bukan transkrip). |
| Tab                 | Halaman presentasi papan: widget yang ada, penataannya, dan status tambatan obrolan (`left`/`right`/`bottom`/`hidden`). Papan dimulai dengan satu tab implisit. |
| Widget              | Program HTML/JS bernama dan tersandbox yang dimiliki sesi. Dirujuk sebagai `sessionKey` + `name`. Diperbarui di tempat berdasarkan nama.         |
| Manifes kapabilitas | Deklarasi jangkauan per widget: `data` (binding baca), `actions` (verba yang diizinkan), `prompt` (kirim ke sesi), `net` (origin yang diizinkan). |
| Sematkan (widget)   | Memindahkan widget transkrip ke papan sesi (kemudahan pengguna atau argumen alat agen). Melepas sematan akan menghapusnya dari papan.                              |
| Sematkan (sesi)     | Penyematan sesi yang sudah ada di bilah samping. Sesi tersemat yang memiliki papan akan terbuka pada wajah papannya.                                               |

## Alur UX

- **Peningkatan:** agen memanggil `show_widget` dalam obrolan mana pun → widget dirender sebaris
  dalam transkrip persis seperti saat ini → mengarahkan kursor menampilkan **Sematkan ke dasbor** → widget
  muncul di papan sesi. Agen dapat meneruskan `pin: true` untuk melakukan hal yang sama.
- **Tampilan papan:** sesi yang memiliki papan mendapatkan tombol pengalih wajah (Obrolan / Dasbor).
  Tampilan papan = strip tab (hanya saat >1 tab) + grid mengalir + panel obrolan tertambat.
  Tambatan obrolan dapat diubah ukurannya, dipindahkan (kiri/kanan/bawah), dan diciutkan persis
  seperti bilah samping. Status tambatan per tab diingat.
- **Seret:** pengguna menyeret widget; grid memadat otomatis (widget mengapung ke atas, tetangga
  mengalir ulang). Mengubah ukuran dengan handel akan menjepret ke tahapan ukuran. Tidak ada penempatan piksel — bagi
  siapa pun.
- **Peringatan pengaturan ulang:** `/new` / `/reset` pada sesi yang memiliki papan meminta
  konfirmasi di UI web ("konteks diatur ulang, dasbor tetap ada") dan mempertahankan
  papan.
- **Bilah samping:** sesi tersemat merender wajah papannya jika memilikinya.
  Papan sesi Beranda adalah "dasbor agen" default.
- **Interaksi** (tiga tingkat, lihat di bawah): peristiwa status senyap, pengiriman
  prompt yang terlihat, dan pemicu otomatisasi.

## Tingkat interaksi

1. **Peristiwa status (default).** Interaksi UI widget yang perlu diketahui model,
   tetapi tidak perlu ditanggapi. `bridge.emitState({...})` menambahkan pemberitahuan
   sesi terstruktur (mekanisme yang sama dengan pemberitahuan aktivitas grup). Tidak ada giliran agen yang
   dimulai; model melihat akumulasi pemberitahuan pada eksekusi berikutnya.
2. **Prompt (percakapan eksplisit).** `bridge.sendPrompt(text)` — memerlukan aktivasi
   pengguna; mengirim pesan pengguna yang terlihat ke dalam sesi (obrolan tertambat
   menampilkannya). Dibatasi lajunya; setiap pengiriman dikonfirmasi pengguna kecuali widget memiliki
   pemberian kapabilitas `prompt`.
3. **Otomatisasi.** `bridge.runAction(name, args)` — menjalankan tindakan yang dideklarasikan
   dalam manifes. Kumpulan verba awal: `cron.trigger` (jalankan tugas Cron yang sudah ada sekarang) dan
   `binding.refresh`. Tugas Cron sudah berjalan dalam sesi eksekusi terisolasi yang terlihat
   dan dapat menggunakan model yang lebih murah: itulah jalur "model kecil menggerakkan widget".
   Tidak ada sesi tersembunyi di mana pun.

## Model dan hosting widget

HTML/JS widget dibuat oleh agen (biasanya melalui `show_widget`), dibungkus
dalam shell dokumen standar (meta CSP, pelapor ukuran, bootstrap bridge), dan
dirender dalam `<iframe sandbox="allow-scripts">` (tidak pernah `allow-same-origin`).

- **Widget sebaris (transkrip)** mempertahankan pipeline dokumen canvas saat ini:
  ditulis di bawah direktori status, disajikan oleh Gateway, dipangkas per cakupan, tanpa
  persetujuan (widget tersebut tidak memiliki kapabilitas secara bawaan — pengiriman prompt dikonfirmasi pengguna).
- **Widget papan** merupakan status sesi: byte berada dalam DB SQLite milik agen
  pemiliknya (`board_widgets`), disajikan oleh rute Gateway inti
  (`/__openclaw__/board/<agentId>/<sessionKey>/<name>/`) yang membaca DB.
  Menyematkan widget transkrip akan menyalin byte. Batas: 256 KB per widget,
  48 widget per papan.
- **Pembaruan di tempat:** memancarkan ulang widget dengan `name` yang sama akan mengganti
  byte, menaikkan `revision`, menyiarkan `board.changed`, dan tampilan langsung hanya memuat ulang
  iframe tersebut.
- **Pembekuan byte:** kapabilitas yang diberikan terikat pada sha256 byte widget.
  Mengubah byte mempertahankan pemberian `data`/`net`/`actions` hanya jika revisi
  baru mendeklarasikan subset dari manifes yang diberikan; manifes yang diperluas akan
  meminta ulang persetujuan operator.

### Widget meng-host konten; aplikasi MCP adalah salah satu jenis konten

**Widget adalah primitif OpenClaw**: sel papan bernama, tersemat, berukuran,
dan dimiliki sesi dengan catatan pemberian. Yang dirender di dalamnya adalah
jenis konten:

- `html` — dibuat oleh agen melalui `show_widget`, byte dalam penyimpanan papan.
- `mcp-app` — tampilan aplikasi MCP pihak ketiga (sumber daya `ui://` dari server yang
  dikonfigurasi) yang di-host di dalam sel widget.

Aplikasi MCP tidak mendefinisikan model widget; widget memperoleh kemampuan untuk meng-host
aplikasi tersebut. Identitas, penempatan, penyematan, pemberian, dan API untuk pembuat tetap
milik OpenClaw — sehingga kode `show_widget` tetap seringkas saat ini dan tidak pernah
perlu mengetahui bahwa spesifikasi MCP Apps ada.

Infrastruktur bersama di bawahnya (di sinilah penyederhanaan diterapkan):

- **Satu host sandbox.** Widget `html` dirender melalui pipeline tangguh yang sama
  yang digunakan aplikasi MCP saat dirilis (iframe ganda pada origin sandbox khusus,
  CSP per widget yang dideklarasikan dan didekode secara gagal-tertutup), alih-alih host iframe
  khusus kedua. Proksi menerima HTML berdasarkan nilai, sehingga konten lokal menjadi
  kasus yang alami.
- **Satu model otorisasi.** Jangkauan widget adalah daftar izin yang diberikan,
  apa pun jenisnya: untuk widget `html`, alat host; untuk widget `mcp-app`,
  alat server yang terlihat oleh aplikasi (melalui mekanisme `allowedAppToolNames`
  yang sudah ada, dibuat persisten per widget alih-alih per eksekusi pencetakan).
- **Alat host untuk widget `html`** (diekspos melalui bridge widget, diperiksa
  terhadap pemberian):
  - `openclaw.prompt.send` — tingkat 2; dirutekan melalui komposer yang terlihat,
    dikonfirmasi pengguna kecuali telah diberikan
  - `openclaw.state.emit` — pemberitahuan sesi tingkat 1 (digabungkan, ukurannya dibatasi)
  - `openclaw.data.read` — binding hanya-baca berparameter (kumpulan RPC baca
    yang diizinkan dan sudah ada), diselesaikan di sisi Gateway
  - `openclaw.cron.trigger` — otomatisasi tingkat 3
- **`net` = CSP.** Jangkauan jaringan menggunakan deklarasi CSP per widget
  yang sudah dirilis (origin `connect-src`) — widget cuaca yang memperbarui diri
  mengambil API-nya langsung dari sandbox, tanpa keterlibatan Gateway.
- **Pemberian.** Widget yang tidak mendeklarasikan apa pun langsung dirender (tersandbox,
  `default-src 'none'`, pengiriman prompt dikonfirmasi satu per satu) — tingkat kepercayaan yang sama dengan
  widget obrolan sebaris saat ini. Alat/origin yang dideklarasikan menempatkan widget dalam
  `pending` pada papan: kartu placeholder mencantumkannya dalam bentuk yang mudah dibaca manusia dengan
  sekali ketuk **Izinkan**/**Tolak**. Pemberian berlaku per nama widget; untuk widget `html`,
  pemberian dibekukan berdasarkan byte (sha256), dan byte yang berubah hanya mempertahankan pemberian jika
  deklarasinya menyempit.
- **Shim pembuatan.** Pembungkus dokumen menyuntikkan
  `window.openclaw.sendPrompt/emitState/read/call` sebagai API pembuat yang stabil;
  apakah transportasi di bawahnya merupakan saluran milik kami atau AppBridge adalah
  detail internal yang tidak pernah dilihat pembuat widget. Pelaporan ukuran dan token
  tema melewati bridge yang sama.

### Tampilan transkrip: satu kartu widget

Tampilan sebaris disatukan pada primitif widget. Saat hasil alat membawa UI —
keluaran `show_widget` atau hasil alat MCP dengan sumber daya aplikasi — sistem
mewujudkan **widget sementara bernama otomatis** (dicakup ke sesi, dipangkas) dan
transkrip merender satu kartu widget yang melakukan dispatch berdasarkan jenis konten.
Tampilan otomatis aplikasi MCP tetap persis seperti yang diharapkan spesifikasi (tanpa pekerjaan model tambahan);
di bawahnya, itu memang _adalah_ widget. Hal ini menghapus kasus khusus paralel `mcpApp`
dalam perenderan obrolan (pembatasan permukaan, deduplikasi terpisah), memberi setiap
UI sebaris kemudahan penyematan yang sama, dan menjadikan registri widget sebagai jalur utama
untuk membuka kembali (rekonstruksi melalui pemindaian transkrip tetap menjadi fallback bagi riwayat yang tidak pernah
disematkan). Host mandiri bertiket dan hanya-baca bertumpang tindih dengan papan sebagai
permukaan persisten untuk membuka kembali — kandidat konsolidasi yang akan dievaluasi dalam T6, bukan
diasumsikan.

Komposisi: v1 menggunakan kedekatan grid (widget krom agen di sebelah widget aplikasi pada
satu tab). v2 menambahkan **slot aplikasi yang dikelola host** — HTML widget agen mendeklarasikan
wilayah slot dan host mengomposisikan tampilan aplikasi sebenarnya sebagai sandbox saudara.
Aplikasi tidak pernah dirender di dalam iframe agen: penyarangan akan merusak identitas
bridge dan memungkinkan penimpaan/clickjack pada UI aplikasi yang telah diberikan izin, sehingga slot merupakan
kontrak tata letak, bukan sematan.

### Widget bersumber dari server (aplikasi MCP tersemat)

Dengan host terpadu, menyematkan aplikasi MCP pihak ketiga hanyalah sebuah widget yang
kontennya diambil dari server alih-alih disimpan: `board_widgets` menyimpan
deskriptor (`serverName`, `toolName`, `uiResourceUri`, asal
`toolCallId` + `sessionKey`) alih-alih byte HTML, dan board membuat ulang
sewa tampilan setelah TTL 10 menit giliran chat terlampaui (mengambil ulang sumber daya
`ui://` ketika kedaluwarsa). Tampilan aplikasi MCP sebaris dalam chat mendapatkan
fasilitas **Sematkan ke dasbor** yang sama seperti widget agen. Tampilan yang dibuka
kembali saat ini bersifat hanya-baca sesuai desain; aplikasi tersemat yang harus tetap
interaktif mendapatkan izin permanen atas alat server yang terlihat oleh aplikasi
(daftar izin eksplisit ditampilkan kepada operator saat penyematan), yang dipisahkan
dari proses penerbitan. Sematan tanpa izin tetap hanya-baca — masih berguna untuk dasbor
tampilan. v1 menyematkan ke board sesi asal; penyematan lintas sesi memerlukan broker sewa
dan harus menunggu. Koordinasikan dengan PR terbuka #109807 (`ui/message`
perutean composer, propagasi tema/ukuran).

## Tata letak: grid fleksibel

12 kolom, tinggi baris tetap, **pemadatan otomatis** (gravitasi ke atas, bergeser ke
samping saat diseret — semantik gridstack, diimplementasikan secara native; matematika
grid tetap murni dan bebas DOM). Status tata letak widget per tab: `{ name, w (1-12), h (rows) }` ditambah
urutan. Kosakata agen:

- `size`: `sm` (3×3) · `md` (6×4) · `lg` (8×6) · `xl` (12×8) · `full`
  (tab satu widget)
- `after: <widgetName>` jangkar pengurutan opsional; dihilangkan = tambahkan
- Pengguna bebas menyeret/mengubah ukuran; model urutan+ukuran yang sama dapat dikirim dan dikembalikan tanpa perubahan.

## Model data (DB per agen)

Tabel baru di `agents/<agentId>/agent/openclaw-agent.sqlite`
(**memerlukan peningkatan versi skema DB agen — persetujuan operator diperlukan
sebelum perubahan ini diterapkan**):

```sql
CREATE TABLE board_tabs (
  session_key TEXT NOT NULL,
  tab_id      TEXT NOT NULL,           -- slug
  title       TEXT NOT NULL,
  position    INTEGER NOT NULL,
  chat_dock   TEXT NOT NULL DEFAULT 'right',  -- left|right|bottom|hidden
  created_by  TEXT NOT NULL,           -- 'user' | 'agent'
  PRIMARY KEY (session_key, tab_id)
) STRICT;

CREATE TABLE board_widgets (
  session_key  TEXT NOT NULL,
  name         TEXT NOT NULL,          -- stable widget name
  tab_id       TEXT NOT NULL,
  title        TEXT,
  html         BLOB NOT NULL,          -- wrapped document source
  sha256       TEXT NOT NULL,
  revision     INTEGER NOT NULL,
  size_w       INTEGER NOT NULL,
  size_h       INTEGER NOT NULL,
  position     INTEGER NOT NULL,       -- order within tab (auto-compact input)
  manifest     TEXT NOT NULL DEFAULT '{}',  -- capability manifest JSON
  grant_state  TEXT NOT NULL DEFAULT 'none', -- none|pending|granted|rejected
  granted_sha  TEXT,                   -- byte-frozen grant
  created_by   TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  PRIMARY KEY (session_key, name)
) STRICT;
```

Keberadaan board = baris apa pun untuk `sessionKey`. Menghapus sesi akan menghapus
baris board-nya. `/new`/`/reset` tidak mengubahnya.

## Permukaan protokol

RPC (tabel metode inti, skema typebox di `gateway-protocol`):

- `board.get { sessionKey }` → tab + metadata widget (tanpa byte) — `operator.read`
- `board.update { sessionKey, ops[] }` — CRUD/pengurutan ulang tab, pemindahan/perubahan ukuran/
  penghapusan/pembatalan sematan widget, status dok, fokus-tab — `operator.write`
- `board.widget.put { sessionKey, name, html, manifest, placement }` —
  `operator.write` (jalur alat agen dan jalur penyematan)
- `board.widget.grant { sessionKey, name, decision }` — `operator.approvals`
- `board.event { sessionKey, widget, payload }` — penyerapan peristiwa status tingkat-1 —
  `operator.write`

Peristiwa (di `EVENT_SCOPE_GUARDS`, cakupan baca):

- `board.changed { sessionKey, revision, widget? }` — status tersimpan berubah;
  UI mengambil ulang (dan memuat ulang satu iframe ketika `widget` tersedia).
- `board.command { sessionKey, command }` — pengendalian UI sementara (agen mengalihkan
  tab yang terlihat, mengaktifkan/menonaktifkan dok chat) — pola `ui.command`.

Byte widget disajikan melalui permukaan HTTP terautentikasi, bukan soket.

## Alat agen

Total tiga alat (inti, selalu terdaftar; rendering dibatasi berdasarkan
kapabilitas klien `inline-widgets` seperti saat ini):

- `show_widget { title, widget_code, name?, pin?, size?, tab?, after?,
capabilities? }` — buat/perbarui berdasarkan nama; `pin` menempatkannya di papan.
  Tanpa `name`/`pin`, perilakunya sama persis seperti saat ini (sebaris, sementara).
- `dashboard { action, ... }` — verba pengelolaan papan: `read`, `tab_create`,
  `tab_update`, `tab_delete`, `tabs_reorder`, `widget_move`, `widget_remove`,
  `unpin`, `focus_tab`, `set_chat_dock`.
- Alat `cron` yang ada mencakup tingkat otomatisasi; tidak diperlukan alat baru.

Deskripsi alat menjelaskan kosakata ukuran/jangkar dan model tingkat. Agen
diberi tahu tentang peristiwa tingkat-1 pengguna melalui pemberitahuan sesi, misalnya
`[dashboard] user clicked "Refresh" on widget weather (tab main)`.

## Yang digantikan oleh ini

- **`extensions/workspaces` dihapus.** Eksperimental, `enabledByDefault:
false`, tidak pernah ada dalam rilis stabil (pertama kali muncul dalam versi beta 2026.7.2). Tidak ada
  migrasi; aturan doctor menghapus `<stateDir>/workspaces/` yang usang jika ada.
  Gagasan yang diambil: matematika grid murni, model keamanan bridge (bootstrap port,
  pembatasan binding, batas laju), persetujuan dengan byte yang dibekukan.
- **Hosting widget dipindahkan dari `extensions/canvas` ke inti.** Penyimpanan dokumen canvas,
  pembungkus dokumen, penyajian HTTP, dan alat `show_widget` menjadi bagian inti
  (`src/canvas/`); plugin mempertahankan alat kontrol node-canvas (`canvas`) dan
  A2UI. Pengumuman `pluginSurfaceUrls["canvas"]` dan jalur
  `/__openclaw__/canvas` merupakan kontrak klien native yang telah dirilis dan tetap
  stabil. Sesi Discord mempertahankan varian `show_widget` yang dimiliki Discord.
- **WorkBoard tidak diubah** (integrasinya merupakan program lanjutan).

## Bukan sasaran (program ini)

- Berbagi papan multi-pengguna/ACL (mendatang; akan hadir melalui berbagi sesi).
- Rendering papan native macOS/iOS (mereka mendapatkannya di mana pun mereka menyematkan
  Control UI; jalur widget sebaris tidak berubah).
- Widget data bawaan (kartu sesi/penggunaan/cron) — bridge kapabilitas beserta
  widget buatan agen mencakup v1; registri jenis bawaan dapat ditambahkan nanti.
- WorkBoard di dasbor.

## Rencana implementasi

Worktree independen, dibuat dengan Codex, direview+diintegrasikan secara berurutan. Integrasikan-lalu-perbaiki.

| #   | Cabang                               | Cakupan                                                                                                                                                                              | Bergantung pada                       |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| T1  | `claude/dashboard-remove-workspaces` | Hapus plugin workspace + UI + dokumentasi + kunci i18n; aturan pembersihan doctor                                                                                                              | —                                |
| T2  | `claude/dashboard-canvas-core`       | Promosikan hosting widget + `show_widget` ke inti; plugin canvas mempertahankan alat node; tidak ada perubahan perilaku                                                                                | —                                |
| T3  | `claude/dashboard-domain`            | Tabel DB agen (peningkatan skema), RPC `board.*` + peristiwa, alat `dashboard`, argumen sematkan/nama/manifest `show_widget`, pemberitahuan tingkat-1, reset-mempertahankan-papan                                  | T2                               |
| T4  | `claude/dashboard-ui`                | Tampilan papan + bilah tab + grid pemadatan otomatis yang fleksibel + dok percakapan (kiri/kanan/bawah/tersembunyi) + kontrol penyematan transkrip + tampilan papan di bilah sisi + konfirmasi reset                           | T3 (mock terlebih dahulu melalui fixture pengembangan) |
| T5  | `claude/dashboard-capabilities`      | Penyimpanan/UI pemberian izin + pembekuan byte; pindahkan widget `html` ke host sandbox bersama; alat host (`openclaw.prompt.send/state.emit/data.read/cron.trigger`); CSP `net`; shim pembuatan | T3, T4                           |
| T7  | `claude/dashboard-mcp-apps`          | Jenis konten `mcp-app`: kontrol penyematan pada tampilan aplikasi sebaris, penyimpanan deskriptor, pembuatan ulang/penyegaran lease, pemberian izin alat server yang persisten (menggunakan kembali host MCP Apps yang telah dirilis)                   | T3, T4                           |
| T6  | penyempurnaan                               | E2E langsung pada Gateway sementara (kunci nyata), tangkapan layar, perbaikan, penulisan ulang `/web/dashboard` yang berfokus pada pengguna, review pengaktifan secara default                                                     | semua                              |

Validasi sesuai aturan repo: vitest terfokus secara lokal, pemeriksaan lengkap di
Crabbox/Testbox, `$autoreview` sebelum setiap integrasi, bukti langsung untuk T6.
