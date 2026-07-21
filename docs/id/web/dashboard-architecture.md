---
read_when:
    - Mengimplementasikan atau meninjau fitur dasbor sesi (papan)
    - Mengubah hosting widget, bridge widget, atau penyimpanan board
summary: 'Dasbor sesi: arsitektur dan rencana implementasi (desain teknis, pra-GA)'
title: Arsitektur Dasbor
x-i18n:
    generated_at: "2026-07-21T12:38:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a7c5da94ec19add55c6b7b530f0c17509a027e97fb301469ce48f520b325c169
    source_path: web/dashboard-architecture.md
    workflow: 16
---

<Note>
Dokumen desain teknis untuk fitur dasbor sesi, yang ditulis sebelum dan
selama implementasi. Dokumen ini menjadi sumber acuan utama untuk pengembangannya. Saat
fitur dirilis, `/web/dashboard` menjadi halaman yang ditujukan bagi pengguna dan halaman ini tetap
menjadi referensi arsitektur.
</Note>

## Visi

Saat ini, bekerja dengan agen berupa aliran teks. Dasbor mengubahnya menjadi
meja kerja: agen merender widget langsung yang interaktif; pengguna menyematkannya ke
permukaan persisten; obrolan ditambatkan ke samping (atau disembunyikan) dan konten utama adalah
papan. Anda beralih dari "berbicara dengan agen" menjadi "mengoperasikan panel kontrol yang
dibuat agen untuk Anda" tanpa pernah meninggalkan sesi.

Prinsip:

- **Papan adalah salah satu tampilan sesi, bukan objek baru.** Setiap sesi (utas)
  memiliki dua tampilan: transkrip dan papan. Sesi tanpa widget yang disematkan
  adalah obrolan biasa. Sematkan satu widget dan papan pun tersedia. Papan mewarisi
  identitas sesi, kepemilikan agen, penamaan, penyematan, dan siklus hidup. Tidak ada
  `dashboard_create`, registri papan, ataupun model ACL terpisah.
- **Kesetaraan agen.** Segala hal yang dapat dilakukan pengguna pada papan, dapat dilakukan agen
  dengan alat: menambahkan/memperbarui/menghapus widget, mengaturnya, mengelola tab, mengganti
  tab yang terlihat, serta menambatkan atau menyembunyikan obrolan.
- **Native, bukan tersemat.** Papan terdiri dari komponen Lit dalam shell Control UI
  (sistem desain yang sama dengan bagian aplikasi lainnya). Hanya _konten_ widget yang
  diisolasi dalam iframe. Tidak ada bilah URL atau krom peramban.
- **Permukaan agen yang kecil.** Widget dituju berdasarkan nama stabil dan diperbarui
  di tempat. Tata letaknya berupa kisi fleksibel yang memadat otomatis; agen menyatakan ukuran dan
  jangkar, bukan piksel atau koordinat.
- **Kapabilitas, bukan kepercayaan.** Kode widget adalah HTML/JS arbitrer buatan agen
  dalam sandbox yang ketat. Jangkauan (data Gateway, tindakan, jaringan) hanya tersedia melalui
  manifes kapabilitas yang dideklarasikan dan diberikan oleh operator.

## Konsep

| Konsep              | Definisi                                                                                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sesi (utas)         | Sesi Gateway yang sudah ada, dikunci dengan `sessionKey` yang stabil. Dimiliki oleh agen.                                                                       |
| Papan               | Tampilan widget dari satu sesi. Ada jika dan hanya jika sesi memiliki widget/tab. Tetap ada setelah `/new`/`/reset` (terhubung ke `sessionKey`, bukan transkrip). |
| Tab                 | Halaman presentasi dari papan: widget mana, pengaturannya, dan status tambatan obrolan (`left`/`right`/`bottom`/`hidden`). Papan dimulai dengan satu tab implisit. |
| Widget              | Program HTML/JS bernama dan tersandbox yang dimiliki sesi. Dituju sebagai `sessionKey` + `name`. Diperbarui di tempat berdasarkan nama.                    |
| Manifes kapabilitas | Deklarasi jangkauan per widget: `data` (pengikatan baca), `actions` (verba yang masuk daftar izin), `prompt` (kirim ke sesi), `net` (origin yang diizinkan). |
| Semat (widget)      | Memindahkan widget transkrip ke papan sesi (fitur interaksi pengguna atau argumen alat agen). Melepas sematan menghapusnya dari papan.                              |
| Semat (sesi)        | Penyematan sesi yang sudah ada pada bilah sisi. Sesi tersemat yang memiliki papan akan terbuka pada tampilan papannya.                                             |

## Alur UX

- **Promosi:** agen memanggil `show_widget` dalam obrolan apa pun → widget dirender sebaris
  dalam transkrip persis seperti saat ini → mengarahkan kursor menampilkan **Sematkan ke dasbor** → widget
  muncul pada papan sesi. Agen dapat meneruskan `pin: true` untuk melakukan hal yang sama.
- **Tampilan papan:** sesi yang memiliki papan mendapatkan pengalih tampilan (Obrolan / Dasbor).
  Tampilan papan = strip tab (hanya jika >1 tab) + kisi fleksibel + panel obrolan tertambat.
  Tambatan obrolan dapat diubah ukurannya, dipindahkan (kiri/kanan/bawah), dan diciutkan persis
  seperti bilah sisi. Status tambatan per tab diingat.
- **Seret:** pengguna menyeret widget; kisi memadat otomatis (widget mengambang ke atas, widget di sekitarnya
  mengalir ulang). Pengubahan ukuran melalui pegangan menyesuaikan ke tahapan ukuran. Tidak ada penempatan berdasarkan piksel — bagi
  siapa pun.
- **Peringatan reset:** `/new` / `/reset` pada sesi yang memiliki papan meminta
  konfirmasi di UI web ("konteks direset, dasbor tetap ada") dan mempertahankan
  papan.
- **Bilah sisi:** sesi tersemat merender tampilan papannya jika tersedia.
  Papan sesi Beranda adalah "dasbor agen" default.
- **Interaksi** (tiga tingkat, lihat di bawah): peristiwa status senyap, pengiriman
  prompt yang terlihat, dan pemicu otomatisasi.

## Tingkat interaksi

1. **Peristiwa status (default).** Interaksi UI widget yang perlu diketahui model
   tetapi tidak perlu ditanggapi. `bridge.emitState({...})` menambahkan pemberitahuan
   sesi terstruktur (mekanisme yang sama dengan pemberitahuan aktivitas grup). Tidak ada giliran agen yang
   dimulai; model melihat pemberitahuan yang terakumulasi pada proses berikutnya.
2. **Prompt (percakapan eksplisit).** `bridge.sendPrompt(text)` — memerlukan aktivasi
   pengguna; mengirim pesan pengguna yang terlihat ke dalam sesi (obrolan tertambat
   menampilkannya). Dibatasi lajunya; setiap pengiriman dikonfirmasi pengguna kecuali widget memiliki
   pemberian kapabilitas `prompt`.
3. **Otomatisasi.** `bridge.runAction(name, args)` — memicu tindakan yang dideklarasikan
   dalam manifes. Kumpulan verba awal: `cron.trigger` (jalankan tugas Cron yang sudah ada sekarang) dan
   `binding.refresh`. Tugas Cron sudah berjalan dalam sesi proses terisolasi yang terlihat
   dan dapat menggunakan model yang lebih murah: itulah jalur "model kecil mendukung widget".
   Tidak ada sesi tersembunyi di mana pun.

## Model dan hosting widget

HTML/JS widget dibuat oleh agen (biasanya melalui `show_widget`), dibungkus
dalam shell dokumen standar (meta CSP, pelapor ukuran, bootstrap jembatan), dan
dirender dalam `<iframe sandbox="allow-scripts">` (tidak pernah `allow-same-origin`).

- **Widget sebaris (transkrip)** mempertahankan pipeline dokumen canvas saat ini:
  ditulis di bawah direktori status, dilayani oleh Gateway, dipangkas per cakupan, tanpa
  persetujuan (widget tersebut secara konstruksi tidak memiliki kapabilitas — pengiriman prompt dikonfirmasi pengguna).
- **Widget papan** adalah status sesi: bita berada di DB SQLite milik agen
  (`board_widgets`), dilayani oleh rute Gateway inti
  (`/__openclaw__/board/<agentId>/<sessionKey>/<name>/`) yang membaca DB.
  Menyematkan widget transkrip akan menyalin bitanya. Batas: 256 KB per widget,
  48 widget per papan.
- **Pembaruan di tempat:** memancarkan ulang widget dengan `name` yang sama akan mengganti
  bita, menaikkan `revision`, menyiarkan `board.changed`, dan tampilan aktif hanya memuat ulang
  iframe tersebut.
- **Pembekuan bita:** kapabilitas yang diberikan terikat pada sha256 dari bita
  widget. Mengubah bita mempertahankan pemberian `data`/`net`/`actions` hanya jika revisi
  baru mendeklarasikan subset dari manifes yang diberikan; manifes yang diperluas akan
  meminta persetujuan operator kembali.

### Widget menghosting konten; aplikasi MCP adalah salah satu jenis konten

**Widget adalah primitif OpenClaw**: sel papan bernama, tersemat, berukuran,
dimiliki sesi, dengan catatan pemberian. Yang dirender di dalamnya adalah suatu
jenis konten:

- `html` — dibuat agen melalui `show_widget`, bita dalam penyimpanan papan.
- `mcp-app` — tampilan aplikasi MCP pihak ketiga (sumber daya `ui://` dari server yang
  dikonfigurasi) yang dihosting di dalam sel widget.

Aplikasi MCP tidak mendefinisikan model widget; widget memperoleh kemampuan untuk menghosting
aplikasi tersebut. Identitas, penempatan, penyematan, pemberian, dan API untuk pembuat tetap
milik OpenClaw — sehingga kode `show_widget` tetap sesingkat saat ini dan tidak pernah
perlu mengetahui bahwa spesifikasi MCP Apps tersedia.

Infrastruktur bersama di bawahnya (di sinilah penyederhanaan diterapkan):

- **Satu host sandbox.** Widget `html` dirender melalui pipeline tangguh yang sama
  dengan yang digunakan MCP Apps saat dirilis (iframe ganda pada origin sandbox khusus,
  CSP per widget yang dideklarasikan dan didekode dengan mekanisme gagal-tertutup), bukan melalui host iframe khusus
  kedua. Proksi menerima HTML berdasarkan nilai, sehingga konten lokal adalah
  kasus alami.
- **Satu model otorisasi.** Jangkauan widget adalah daftar izin yang diberikan,
  apa pun jenisnya: untuk widget `html`, alat host; untuk widget `mcp-app`,
  alat server yang terlihat oleh aplikasi (melalui mekanisme `allowedAppToolNames`
  yang sudah ada, dibuat persisten per widget alih-alih per proses pencetakan).
- **Alat host untuk widget `html`** (diekspos melalui jembatan widget, diperiksa
  terhadap pemberian):
  - `openclaw.prompt.send` — tingkat 2; dirutekan melalui komposer yang terlihat,
    dikonfirmasi pengguna kecuali telah diberikan
  - `openclaw.state.emit` — pemberitahuan sesi tingkat 1 (digabungkan, dibatasi ukurannya)
  - `openclaw.data.read` — pengikatan hanya-baca berparameter (kumpulan
    RPC baca yang sudah ada dan masuk daftar izin), diselesaikan di sisi Gateway
  - `openclaw.cron.trigger` — otomatisasi tingkat 3
- **`net` = CSP.** Jangkauan jaringan menggunakan deklarasi CSP per widget
  yang sudah dirilis (`connect-src` origin) — widget cuaca yang memperbarui diri
  mengambil API-nya langsung dari sandbox, tanpa keterlibatan Gateway.
- **Pemberian.** Widget yang tidak mendeklarasikan apa pun langsung dirender (tersandbox,
  `default-src 'none'`, pengiriman prompt dikonfirmasi satu per satu) — tingkat kepercayaan yang sama dengan
  widget obrolan sebaris saat ini. Alat/origin yang dideklarasikan menempatkan widget dalam
  `pending` pada papan: kartu placeholder mencantumkannya dalam bentuk yang mudah dibaca manusia dengan
  sekali ketuk **Izinkan**/**Tolak**. Pemberian berlaku per nama widget; untuk widget `html`
  pemberian tersebut dibekukan berdasarkan bita (sha256), dan bita yang berubah mempertahankan pemberian hanya jika
  deklarasinya menyusut.
- **Shim pembuatan.** Pembungkus dokumen menyuntikkan `window.openclaw.prompt`,
  `window.openclaw.state`, `window.openclaw.data`, dan `window.openclaw.cron`
  sebagai API pembuat yang stabil. Panggilan dasbor berbagi satu saluran permintaan yang terikat
  pada tiket tampilan; pelaporan ukuran dan token tema tetap menjadi notifikasi host
  yang terpisah.

### Deklarasi kapabilitas Plugin

Plugin yang diaktifkan dapat memperluas host widget melalui `dashboard.dataBindings`
dan `dashboard.actionVerbs` dalam `openclaw.plugin.json`. ID lokal Plugin menjadi
nama pemberian yang diawali dengan ID Plugin, seperti `workboard.cards.list` dan
`workboard.dispatch`; `%` dan `.` dalam segmen ID Plugin di-escape agar
pemisahan Plugin/ID lokal yang berbeda tidak dapat mewarisi pemberian persisten yang sama. Selama
pendaftaran Plugin, OpenClaw memverifikasi bahwa setiap pengikatan menargetkan RPC
yang didaftarkan oleh Plugin yang sama dengan `operator.read` dan setiap tindakan menargetkan RPC
dengan `operator.write`; deklarasi yang tidak valid menggagalkan pemuatan Plugin. Registri yang telah divalidasi
hanya dibangun ulang saat terjadi perubahan siklus hidup Plugin, sementara pemberian widget
tetap berlaku per widget serta terikat pada bita dan revisi.

### Residual yang dimodelkan: saluran data WebRTC

CSP sandbox memancarkan direktif `webrtc 'block'` yang diusulkan, tetapi
[kumpulan direktif CSP Chromium saat ini](https://chromium.googlesource.com/chromium/src/+/main/services/network/public/mojom/content_security_policy.mojom#95)
tidak mengimplementasikannya. Oleh karena itu, widget yang dapat diprogram dapat menggunakan saluran data WebRTC
untuk lalu lintas keluar dalam Chromium saat ini. Residual yang sama sudah disertakan
untuk widget obrolan sebaris dan host MCP Apps pada `main`.

**Kompromi yang diterima:** OpenClaw tidak membatasi widget yang dapat diprogram berdasarkan
residu ini. Konten widget memperoleh akses ke data sensitif OpenClaw hanya melalui
kapabilitas `data:read` yang diberikan oleh operator dan dibekukan per byte, sementara
Permissions Policy sandbox memblokir akses kamera dan mikrofon. Pelindung API DOM
merupakan pertahanan berlapis dengan upaya terbaik, bukan batas keamanan, dan termasuk dalam
penguatan lanjutan.

### Tampilan transkrip: satu kartu widget

Tampilan sebaris disatukan pada primitif widget. Saat hasil alat membawa UI —
keluaran `show_widget` atau hasil alat MCP dengan sumber daya aplikasi — sistem
mewujudkan **widget sementara dengan nama otomatis** (cakupan sesi, dipangkas), dan
transkrip merender satu kartu widget yang menentukan perilaku berdasarkan jenis konten.
Tampilan otomatis aplikasi MCP tetap persis seperti yang diharapkan spesifikasi (tanpa kerja model tambahan);
di baliknya, tampilan tersebut memang merupakan widget. Hal ini menghapus kasus khusus
`mcpApp` paralel dalam rendering obrolan (pembatasan permukaan, deduplikasi terpisah),
memberikan sarana penyematan yang sama kepada setiap UI sebaris, dan menjadikan registri
widget sebagai jalur utama untuk membuka kembali (rekonstruksi melalui pemindaian transkrip
tetap menjadi fallback untuk riwayat yang tidak pernah disematkan). Host mandiri hanya-baca
dengan tiket tumpang tindih dengan board sebagai permukaan persisten untuk membuka kembali —
kandidat konsolidasi yang akan dievaluasi dalam T6, bukan diasumsikan.

Komposisi: v1 menggunakan kedekatan kisi (widget chrome agen di sebelah widget aplikasi pada
satu tab). v2 menambahkan **slot aplikasi yang dikelola host** — HTML widget agen mendeklarasikan
wilayah slot dan host mengomposisikan tampilan aplikasi sebenarnya sebagai sandbox saudara.
Aplikasi tidak pernah dirender di dalam iframe agen: penyarangan akan merusak identitas
bridge dan memungkinkan overlay/clickjack pada UI aplikasi yang telah diberi izin, sehingga
slot tersebut merupakan kontrak tata letak, bukan sematan.

### Widget yang bersumber dari server (aplikasi MCP yang disematkan)

Dengan host terpadu, menyematkan aplikasi MCP pihak ketiga hanyalah widget yang
kontennya diambil dari server alih-alih disimpan: `board_widgets` menyimpan
deskriptor (`serverName`, `toolName`, `uiResourceUri`, `toolCallId`
asal + `sessionKey`) alih-alih byte HTML, dan board mencetak ulang lease
tampilan setelah TTL 10 menit giliran obrolan berakhir (mengambil ulang sumber daya
`ui://` saat kedaluwarsa). Tampilan aplikasi MCP sebaris dalam obrolan mendapatkan
sarana **Sematkan ke dasbor** yang sama seperti widget agen. Tampilan yang dibuka kembali
saat ini hanya-baca secara sengaja; aplikasi tersemat yang harus tetap interaktif mendapatkan
grant tahan lama atas alat server yang terlihat oleh aplikasi (daftar izin eksplisit
ditampilkan kepada operator saat penyematan), yang dipisahkan dari proses pencetakan.
Sematan tanpa grant tetap hanya-baca — masih berguna untuk dasbor tampilan. v1 menyematkan
ke board sesi asal; penyematan lintas sesi memerlukan broker lease dan harus menunggu.
Koordinasikan dengan PR terbuka #109807 (perutean composer `ui/message`,
propagasi tema/ukuran).

### Integrasi WorkBoard

Program integrasi WorkBoard mempertahankan kepemilikan kartu dan board oleh plugin sembari menghubungkan kembali kartu yang dikirim ke board sesinya melalui `sessionKey` dan `runId` yang sudah ada, mengekspos feed dan pengiriman WorkBoard melalui binding dan tindakan yang dideklarasikan plugin, serta mengomposisikan hasil tersebut dengan jenis widget `html` dan `mcp-app` yang sudah ada alih-alih memperkenalkan jenis widget khusus WorkBoard.

## Tata letak: kisi fleksibel

12 kolom, tinggi baris tetap, **pemadatan otomatis** (gravitasi ke atas, bergeser saat
diseret — semantik gridstack, diimplementasikan secara native; matematika kisi tetap murni
dan bebas DOM). Status tata letak widget per tab: `{ name, w (1-12), h (rows) }` ditambah
urutan. Kosakata agen:

- `size`: `sm` (3×3) · `md` (6×4) · `lg` (8×6) · `xl` (12×8) · `full`
  (tab satu widget)
- `after: <widgetName>` jangkar pengurutan opsional; jika dihilangkan = tambahkan di akhir
- Pengguna bebas menyeret/mengubah ukuran; model urutan+ukuran yang sama dapat dipertukarkan dua arah.

## Model data (DB per agen)

Tabel baru dalam `agents/<agentId>/agent/openclaw-agent.sqlite`
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
baris board-nya. `/new`/`/reset` tidak menyentuhnya.

## Permukaan protokol

RPC (tabel metode inti, skema typebox dalam `gateway-protocol`):

- `board.get { sessionKey }` → tab + metadata widget (tanpa byte) — `operator.read`
- `board.update { sessionKey, ops[] }` — CRUD/pengurutan ulang tab, pemindahan/perubahan ukuran/
  penghapusan/pelepasan sematan widget, status dock, fokus tab — `operator.write`
- `board.widget.put { sessionKey, name, html, manifest, placement }` —
  `operator.write` (jalur alat agen dan jalur penyematan)
- `board.widget.grant { sessionKey, name, decision }` — `operator.approvals`
- `board.event { ticket, payload }` — penerimaan peristiwa status tingkat-1 yang terikat tiket;
  bentuk host tepercaya warisan `{ sessionKey, widget, payload }` tetap dipertahankan —
  `operator.write`
- `board.prompt.authorize { ticket }` — mengembalikan apakah pengiriman prompt yang terlihat
  masih memerlukan konfirmasi per klik — `operator.read`
- `board.data.read { ticket, bindingId, params? }` — resolusi binding baca inti
  atau plugin aktif yang masuk daftar izin di sisi gateway — `operator.read`
- `board.action { ticket, action, ... }` — pengiriman otomatisasi dengan grant yang tepat
  melalui jalur jalankan-sekarang cron yang sudah ada atau verba tindakan tervalidasi milik
  plugin aktif — `operator.write`

Peristiwa (dalam `EVENT_SCOPE_GUARDS`, cakupan baca):

- `board.changed { sessionKey, revision, widget? }` — status persisten berubah;
  UI mengambil ulang (dan memuat ulang satu iframe saat `widget` tersedia).
- `board.command { sessionKey, command }` — pengendalian UI sementara (agen mengganti
  tab yang terlihat, mengalihkan dock obrolan) — pola `ui.command`.

Byte widget disajikan melalui permukaan HTTP terautentikasi, bukan soket.

## Alat agen

Total tiga alat (inti, selalu terdaftar; rendering dibatasi berdasarkan kapabilitas
klien `inline-widgets` seperti saat ini):

- `show_widget { title, widget_code, name?, pin?, size?, tab?, after?,
capabilities? }` — buat/perbarui berdasarkan nama; `pin` menempatkannya pada board.
  Tanpa `name`/`pin`, perilakunya persis seperti saat ini (sebaris, sementara).
- `dashboard { action, ... }` — verba pengelolaan board: `read`, `tab_create`,
  `tab_update`, `tab_delete`, `tabs_reorder`, `widget_move`, `widget_remove`,
  `unpin`, `focus_tab`, `set_chat_dock`.
- Alat `cron` yang sudah ada mencakup tingkat otomatisasi; tidak diperlukan alat baru.

Deskripsi alat mengajarkan kosakata ukuran/jangkar dan model tingkat. Agen
diberi tahu tentang peristiwa tingkat-1 pengguna melalui pemberitahuan sesi, misalnya
`[dashboard] user clicked "Refresh" on widget weather (tab main)`.

## Yang digantikan oleh ini

- **`extensions/workspaces` dihapus.** Bersifat eksperimental, `enabledByDefault:
false`, tidak pernah ada dalam rilis stabil (pertama kali muncul dalam versi beta 2026.7.2). Tidak ada
  migrasi; aturan doctor menghapus `<stateDir>/workspaces/` usang jika ada.
  Gagasan yang diambil: matematika kisi murni, model keamanan bridge (bootstrap port,
  pembatasan binding, batas laju), persetujuan yang dibekukan per byte.
- **Hosting widget dipindahkan dari `extensions/canvas` ke inti.** Penyimpanan dokumen
  canvas, pembungkus dokumen, penyajian HTTP, dan alat `show_widget` menjadi bagian inti
  (`src/canvas/`); plugin mempertahankan alat kontrol node-canvas (`canvas`) dan
  A2UI. Pengiklanan `pluginSurfaceUrls["canvas"]` dan jalur
  `/__openclaw__/canvas` merupakan kontrak klien native yang telah dirilis dan tetap
  stabil. Sesi Discord mempertahankan varian `show_widget` milik Discord.

## Di luar sasaran (program ini)

- Berbagi board multi-pengguna/ACL (mendatang; akan hadir melalui berbagi sesi).
- Rendering board native macOS/iOS (tersedia di mana pun Control UI
  disematkan; jalur widget sebaris tidak berubah).
- Widget data bawaan (kartu sesi/penggunaan/cron) — bridge kapabilitas ditambah
  widget buatan agen mencakup v1; registri jenis bawaan dapat ditambahkan nanti.

## Rencana implementasi

Worktree independen, dibuat dengan Codex, direview+diterapkan secara berurutan. Terapkan-lalu-perbaiki.

| #   | Branch                               | Cakupan                                                                                                                                                                              | Bergantung pada                       |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| T1  | `claude/dashboard-remove-workspaces` | Hapus plugin workspaces + UI + dokumentasi + kunci i18n; aturan pembersihan doctor                                                                                                              | —                                |
| T2  | `claude/dashboard-canvas-core`       | Promosikan hosting widget + `show_widget` ke inti; plugin canvas mempertahankan alat node; tanpa perubahan perilaku                                                                                | —                                |
| T3  | `claude/dashboard-domain`            | Tabel DB agen (peningkatan skema), RPC + peristiwa `board.*`, alat `dashboard`, argumen sematkan/nama/manifest `show_widget`, pemberitahuan tingkat-1, reset-mempertahankan-board                                  | T2                               |
| T4  | `claude/dashboard-ui`                | Tampilan board + bilah tab + kisi fleksibel dengan pemadatan otomatis + dock obrolan (kiri/kanan/bawah/tersembunyi) + sarana penyematan transkrip + tampilan board bilah samping + konfirmasi reset                           | T3 (mock terlebih dahulu melalui fixture pengembangan) |
| T5  | `claude/dashboard-capabilities`      | Penyimpanan/UI grant + pembekuan per byte; pindahkan widget `html` ke host sandbox bersama; alat host (`openclaw.prompt.send/state.emit/data.read/cron.trigger`); CSP `net`; shim penulisan | T3, T4                           |
| T7  | `claude/dashboard-mcp-apps`          | Jenis konten `mcp-app`: sarana penyematan pada tampilan aplikasi sebaris, penyimpanan deskriptor, pencetakan ulang/penyegaran lease, grant alat server tahan lama (menggunakan kembali host MCP Apps yang telah dirilis)                   | T3, T4                           |
| T6  | penyempurnaan                               | E2E langsung pada gateway sementara (kunci nyata), tangkapan layar, perbaikan, penulisan ulang `/web/dashboard` yang berfokus pada pengguna, review pengaktifan secara default                                                     | semua                              |

Validasi sesuai aturan repo: vitest terfokus secara lokal, pemeriksaan lengkap pada
Crabbox/Testbox, `$autoreview` sebelum setiap penerapan, bukti langsung untuk T6.
