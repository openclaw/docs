---
read_when:
    - Anda telah menyelesaikan penyiapan inferensi dan ingin Crestodian mengonfigurasi sisanya
    - Anda perlu memeriksa atau memperbaiki OpenClaw menggunakan agen penyiapan lokal
    - Anda sedang merancang atau mengaktifkan mode penyelamatan saluran pesan
summary: Referensi CLI dan model keamanan untuk pembantu penyiapan dan perbaikan Crestodian berbasis inferensi
title: Crestodian
x-i18n:
    generated_at: "2026-07-12T14:03:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af4861a48fb26159cb8e0c29d08ab5c3776283eb5392dcbe08c9a28d01f4abf5
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian Percakapan adalah agen penyiapan lokal, perbaikan, dan konfigurasi OpenClaw. Agen ini hanya dimulai setelah model default efektif menyelesaikan satu giliran nyata. Instalasi baru terlebih dahulu menyiapkan inferensi; konfigurasi yang tidak valid tetap menggunakan jalur doctor klasik.

## Kapan dimulai

Menjalankan `openclaw` tanpa subperintah akan menentukan jalur berdasarkan status konfigurasi:

- Konfigurasi tidak ada, atau ada tetapi tanpa pengaturan yang dibuat pengguna (kosong, atau hanya berisi kunci `$schema`/`meta`): memulai onboarding terpandu dengan verifikasi AI langsung.
- Konfigurasi ada tetapi gagal divalidasi: memulai onboarding klasik, yang melaporkan masalah dan mengarahkan Anda ke `openclaw doctor`.
- Konfigurasi ada dan valid: membuka TUI agen normal. Gateway terkonfigurasi yang dapat dijangkau dan agen defaultnya memiliki model akan langsung membuka UI tersebut tanpa onboarding atau Crestodian. Gunakan `/crestodian` di dalam TUI, atau jalankan `openclaw crestodian` secara langsung, untuk mengakses Crestodian nanti.

Menjalankan `openclaw crestodian` terlebih dahulu menguji model default yang dikonfigurasi secara langsung. Giliran yang berhasil akan memulai Crestodian. Kegagalan interaktif akan membuka penyiapan inferensi terpandu dan menyerahkan kendali kepada Crestodian setelah salah satu kandidat berhasil. Permintaan sekali jalan, JSON, dan permintaan noninteraktif lainnya akan gagal dengan petunjuk untuk menjalankan `openclaw onboard` ketika inferensi tidak tersedia. `openclaw --help` dan `openclaw --version` tetap menggunakan jalur cepat normalnya.

`openclaw` tanpa argumen dalam mode noninteraktif (tanpa TTY) akan keluar dengan pesan singkat alih-alih menampilkan bantuan tingkat akar: pesan tersebut mengarahkan ke onboarding noninteraktif pada instalasi baru atau tidak valid, atau ke `openclaw agent --local ...` ketika konfigurasi valid.

`openclaw onboard --modern` tetap menjadi alias kompatibilitas untuk Crestodian, tetapi menggunakan gerbang inferensi yang sama: inferensi yang berfungsi membuka percakapan, kegagalan interaktif memulai penyiapan inferensi terpandu, dan kegagalan noninteraktif keluar dengan panduan onboarding. `openclaw onboard --classic` membuka wisaya lengkap langkah demi langkah.

## Yang ditampilkan Crestodian

Crestodian interaktif membuka shell TUI yang sama seperti `openclaw tui`, dengan backend percakapan Crestodian. Sapaan awal mencakup:

- validitas konfigurasi dan agen default
- model terverifikasi yang digunakan Crestodian
- keterjangkauan Gateway dari pemeriksaan awal pertama
- tindakan debug berikutnya yang disarankan

Crestodian tidak membuang rahasia ke keluaran atau memuat perintah CLI Plugin hanya untuk memulai.

Gunakan `status` untuk inventaris terperinci: jalur konfigurasi, jalur dokumentasi/sumber, pemeriksaan CLI lokal, keberadaan kunci/token, agen, model, dan detail Gateway.

Crestodian menggunakan penemuan referensi yang sama seperti agen biasa: dalam checkout Git, Crestodian mengarahkan ke `docs/` lokal dan pohon sumber; dalam instalasi npm, Crestodian menggunakan dokumentasi yang dibundel dan menautkan ke [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), dengan panduan untuk memeriksa sumber ketika dokumentasi tidak memadai.

## Contoh

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work" --yes
openclaw crestodian --message "set default model openai/gpt-5.6" --yes
openclaw onboard --modern
```

Di dalam TUI Crestodian:

```text
status
health
doctor
validate config
setup
setup workspace ~/Projects/work
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
configure model provider
set default model openai/gpt-5.6
channels
channel info slack
connect slack
open channel wizard for slack
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Operasi dan persetujuan

Crestodian menggunakan operasi bertipe alih-alih mengedit konfigurasi secara ad hoc.

Operasi hanya-baca langsung dijalankan: menampilkan ikhtisar, mencantumkan agen, mencantumkan Plugin yang terinstal, mencari Plugin ClawHub, menampilkan status model/backend, menjalankan pemeriksaan status/kesehatan, memeriksa keterjangkauan Gateway, menjalankan doctor tanpa perbaikan interaktif, memvalidasi konfigurasi, dan menampilkan jalur log audit.

Memulai penyiapan kanal terpandu (`connect telegram`) juga langsung dijalankan. Wisayanya mengumpulkan jawaban eksplisit dan bertanggung jawab atas penulisan yang dihasilkan.

Operasi persisten memerlukan persetujuan melalui percakapan (atau `--yes` untuk perintah langsung): menulis konfigurasi, `config set`, `config set-ref`, bootstrap penyiapan/onboarding, mengubah model default, memulai/menghentikan/memulai ulang Gateway, membuat agen, dan menginstal Plugin.

Perbaikan doctor tidak tersedia di dalam Crestodian karena dapat menulis ulang penyedia, autentikasi, atau rute inferensi agen default yang menjalankan sesi. Keluar dari Crestodian dan jalankan `openclaw doctor --fix` di terminal. `doctor` hanya-baca tetap tersedia di dalam Crestodian.

Agen baru mewarisi rute inferensi default yang telah diverifikasi langsung. ID agen `crestodian` dicadangkan untuk kustodian virtual berhak istimewa dan tidak dapat dibuat sebagai agen normal.

`config set` dan `config set-ref` tidak dapat mengubah status rute inferensi, termasuk kredensial penyedia inferensi, `auth.*` tingkat atas, katalog model, backend CLI, rute model default/per agen, parameter/peralatan agen, atau `tools.*` tingkat akar. Penulisan mentah di bawah `env.*`, `secrets.*`, `plugins.*`, dan `$include` juga ditolak karena dapat mengganti resolusi kredensial atau aktivasi penyedia. Autentikasi Gateway dan kanal tetap menjadi permukaan konfigurasi normal. Gunakan alur kerja Plugin/kanal bertipe dan `set default model <provider/model>` untuk rute yang sudah dikonfigurasi; perintah tersebut menguji rute secara langsung sebelum menyimpannya. Untuk mengonfigurasi atau memperbaiki akses penyedia/autentikasi, keluar dari Crestodian dan jalankan `openclaw onboard`.

Penghapusan instalasi Plugin ditolak di dalam Crestodian karena menghapus Plugin penyedia dapat menonaktifkan rute inferensi yang menjalankan sesi. Keluar dari Crestodian dan jalankan `openclaw plugins uninstall <id>` dari terminal.

Persetujuan diberikan dengan kata-kata Anda sendiri: balasan yang tidak ambigu ("ya", "tentu", "lanjutkan", "jangan sekarang") ditentukan dari daftar deterministik tertutup. Ketika rute yang dikonfigurasi mendukung panggilan penyelesaian terpisah, balasan lain dapat diklasifikasikan hanya berdasarkan pesan Anda dan proposal yang tertunda—tidak pernah oleh model percakapan itu sendiri, yang tidak dapat menyetujui dirinya sendiri. Balasan yang tidak terklasifikasi atau ambigu membuat proposal tetap tertunda dan percakapan akan bertanya lagi.

Penulisan yang diterapkan dicatat dalam `~/.openclaw/audit/crestodian.jsonl`. Penemuan tidak diaudit; hanya operasi dan penulisan yang diterapkan yang diaudit.

Penyiapan kanal dapat berjalan sebagai percakapan yang dihosting hingga mencapai rahasia. TUI Crestodian lokal tidak menerima jawaban wisaya yang sensitif karena masukan percakapan terminal terlihat. TUI menawarkan `open channel wizard` secara langsung, dengan membawa kanal yang dipilih ke wisaya terminal bermasker; Anda juga dapat menjalankan `openclaw channels add --channel <channel>` nanti.

### Beralih ke penyiapan kanal bermasker

Percakapan lokal dapat menyerahkan kendali kepada wisaya kanal bermasker:

```text
open channel wizard for slack
channel info slack
```

`open channel wizard for <channel>` membuka penyiapan kanal bermasker setelah TUI percakapan ditutup. Gunakan `channel info <channel>` terlebih dahulu untuk melihat label kanal, status penyiapan, ringkasan prasyarat, dan tautan dokumentasi.

Crestodian tidak pernah mengubah akses penyedia/autentikasi dari dalam sesinya sendiri: sesi tersebut sudah bergantung pada rute inferensi itu. Untuk penyiapan atau perbaikan penyedia model, `configure model provider` memberikan panduan keluar/onboarding tanpa memulai wisaya atau menulis konfigurasi. Keluar dari Crestodian dan jalankan `openclaw onboard`; onboarding menyiapkan kredensial secara bertahap dan hanya menyimpan rute yang menyelesaikan satu giliran langsung nyata. Mulai kembali Crestodian setelah onboarding berhasil.

## Bootstrap penyiapan

`setup` mengonfigurasi status ruang kerja dan Gateway yang tersisa setelah onboarding terpandu selesai menyiapkan inferensi. Perintah ini hanya menulis melalui operasi konfigurasi bertipe dan terlebih dahulu meminta persetujuan.

```text
setup
setup workspace ~/Projects/work
```

`setup` mempertahankan model efektif yang telah diverifikasi. Perintah ini tidak mengonfigurasi atau mengganti inferensi.

Jika inferensi tidak ada atau pemeriksaan langsungnya gagal, tinggalkan Crestodian dan jalankan `openclaw onboard`. Onboarding terpandu mendeteksi model yang dikonfigurasi, kunci API, dan CLI lokal yang terautentikasi, meminta balasan nyata dari setiap kandidat, dan hanya mempertahankan rute yang berhasil. Crestodian langsung dimulai setelah batas tersebut dan kemudian dapat mengonfigurasi ruang kerja, Gateway, kanal, agen, Plugin, dan fitur opsional lainnya.

Aplikasi macOS melewati seluruh tahapan ini ketika berhasil menjangkau Gateway terkonfigurasi yang agen defaultnya sudah memiliki model terkonfigurasi; aplikasi tersebut membuka UI agen normal.
Untuk Gateway baru atau belum lengkap, aplikasi menjalankan tahapan inferensi melalui metode Gateway `crestodian.setup.detect` dan `crestodian.setup.activate`: detect mencantumkan setiap backend kandidat yang ditemukan, activate menguji satu kandidat secara langsung (penyelesaian nyata "balas dengan OK"), dan hanya mempertahankan status model, kredensial, serta penyedia/runtime yang diperlukan untuk rute tersebut setelah pengujian berhasil. Default ruang kerja dan Gateway tetap ditangani Crestodian. Kandidat yang gagal tidak pernah mengubah konfigurasi; aplikasi secara otomatis menelusuri tahapan tersebut dan akhirnya menawarkan langkah kunci/token manual yang diisi dari Plugin penyedia inferensi teks aktif milik Gateway. Penyedia yang dipilih mengelola model awal dan konfigurasinya, dan kredensial diverifikasi dengan cara yang sama sebelum disimpan.

Supervisi Codex dan fitur Plugin opsional lainnya tetap berada di luar transaksi aktivasi inferensi ini. Konfigurasikan fitur tersebut hanya setelah inferensi berfungsi dan Crestodian telah dimulai; kebijakan Plugin yang sudah ada dan penolakan supervisi eksplisit tetap tidak berubah selama penyiapan inferensi.

## Percakapan AI

Percakapan bebas Crestodian interaktif berjalan melalui loop agen yang sama seperti agen OpenClaw biasa, dibatasi pada satu peralatan otoritas OpenClaw ring-zero, `crestodian`, yang membungkus operasi bertipe. Tindakan baca berjalan bebas, mutasi memerlukan persetujuan percakapan Anda untuk operasi persis tersebut (lihat Operasi dan persetujuan), dan setiap penulisan yang diterapkan diaudit serta divalidasi ulang. Sesi agen dipertahankan, sehingga Crestodian memiliki memori multi-giliran nyata. Jika rute inferensi yang telah diverifikasi kemudian berhenti berfungsi, kembali ke `openclaw onboard` dan perbaiki sebelum melanjutkan.

Host tidak mengurai permintaan bahasa alami menjadi operasi. Pesan bebas—termasuk teks yang tampak seperti perintah dan pertanyaan seperti "mengapa gateway saya berhenti?"—dikirim ke AI, yang dapat memetakan permintaan tersebut ke operasi bertipe melalui peralatan `crestodian`.

Ketika mutasi tertunda, hanya frasa persetujuan atau penolakan yang tidak ambigu dari daftar tertutup yang ditentukan tanpa inferensi. Persetujuan ambigu dikirim ke panggilan penyelesaian terkonfigurasi yang terpisah dan jika tidak memungkinkan akan gagal secara tertutup. Kolom wisaya terstruktur dan navigasi host yang persis adalah kontrol UI, bukan penguraian operasi bahasa alami. Satu pengecualian kebersihan rahasia sangat penting: `config set` yang persis pada jalur sensitif (token, kunci, kata sandi) tidak pernah mencapai model. Host membuat proposal yang telah disamarkan, dan nilainya ditutupi dalam riwayat yang terlihat oleh AI. Utamakan `config set-ref <path> env <ENV_VAR>` untuk rahasia.

Mode pemulihan kanal pesan tidak pernah menggunakan perencana berbantuan model. Pemulihan jarak jauh tetap deterministik agar jalur agen normal yang rusak atau disusupi tidak dapat digunakan sebagai editor konfigurasi.

### Model kepercayaan harness CLI

Runtime tertanam dan harness server aplikasi Codex memberlakukan pembatasan ring-zero secara langsung: proses tersebut membawa daftar peralatan OpenClaw yang diizinkan dengan hanya peralatan `crestodian`. Untuk Codex, OpenClaw juga menonaktifkan lingkungan, eksekusi native, multiagen, tujuan, aplikasi/Plugin, skill/MCP, pencarian web, dan permukaan `request_user_input` untuk proses tersebut. Codex tetap menyuntikkan utilitas native `update_plan` yang inert; utilitas tersebut dapat memperbarui daftar periksa sementara milik model, tetapi tidak dapat menulis berkas atau konfigurasi OpenClaw. Harness CLI tidak menggunakan daftar izin OpenClaw, sehingga Crestodian hanya menerima backend yang kontrak pemilihan peralatannya sendiri dapat membuktikan pembatasan yang sama:

- Backend yang dapat dipilih, termasuk Claude Code, diluncurkan dengan pilihan alat native kosong dan satu alat MCP, `crestodian`. Konfigurasi MCP yang dihasilkan Claude diterapkan dengan `--strict-mcp-config`, sehingga tidak ada server MCP lain yang dimuat.
- Backend yang menyatakan tidak memiliki alat native menerima server MCP Crestodian khusus yang sama.
- Backend alat native yang selalu aktif atau tidak diketahui akan gagal secara tertutup sebelum inferensi; backend tersebut tidak dapat menghosting sesi Crestodian.

Hanya sesi Crestodian yang mendapatkan server MCP crestodian; operasi agen normal tidak pernah melihat alat ini. Oleh karena itu, backend CLI yang dapat dipilih/tanpa alat native dan model dengan kunci API memberlakukan loop satu alat secara harfiah. Model app-server Codex memberlakukan satu alat otoritas OpenClaw ditambah utilitas perencanaan native yang inert. Dalam ketiga kasus tersebut, penulisan penyiapan tetap dibatasi dalam kontrak persetujuan Crestodian yang diaudit.

Gemini CLI tetap tersedia untuk agen normal, tetapi tidak dapat memberlakukan pemeriksaan tanpa alat yang diwajibkan oleh gerbang inferensi, sehingga tidak dapat menghosting Crestodian.

## Beralih ke agen

Gunakan pemilih berbahasa alami untuk keluar dari Crestodian dan membuka TUI normal:

```text
bicara dengan agen
bicara dengan agen kerja
beralih ke agen utama
```

`openclaw tui`, `openclaw chat`, dan `openclaw terminal` langsung membuka TUI agen normal; perintah tersebut tidak memulai Crestodian. Setelah beralih ke TUI normal, `/crestodian` akan kembali ke Crestodian, secara opsional dengan permintaan lanjutan:

```text
/crestodian
/crestodian restart gateway
```

## Mode pemulihan pesan

Mode pemulihan pesan adalah titik masuk saluran pesan untuk Crestodian: gunakan mode ini ketika agen normal Anda tidak berfungsi, tetapi saluran tepercaya (misalnya WhatsApp) masih menerima perintah.

Ini adalah penangan perintah darurat deterministik, bukan agen Crestodian percakapan. Penangan ini tidak mem-bootstrap penyiapan baru atau melonggarkan gerbang inferensi untuk percakapan Crestodian.

Perintah yang didukung: `/crestodian <request>`. Pemulihan hanya menerima tata bahasa perintah yang diketik secara persis—bahasa alami ditolak dengan petunjuk, tidak pernah ditebak menjadi suatu operasi, dan model tidak pernah digunakan.

```text
Anda, dalam DM pemilik tepercaya: /crestodian status
OpenClaw: Mode pemulihan Crestodian. Gateway dapat dijangkau: tidak. Konfigurasi valid: tidak.
Anda: /crestodian restart gateway
OpenClaw: Rencana: mulai ulang Gateway. Balas /crestodian yes untuk menerapkan.
Anda: /crestodian yes
OpenClaw: Diterapkan. Entri audit ditulis.
```

Pembuatan agen juga dapat dimasukkan ke antrean secara lokal atau melalui pemulihan:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/crestodian create agent work workspace ~/Projects/work
```

Pembuatan agen hanya boleh menyebutkan model default saat ini yang telah diverifikasi langsung. Hilangkan model untuk mewarisi rute tersebut.

Pemulihan jarak jauh adalah permukaan admin dan harus diperlakukan seperti perbaikan konfigurasi jarak jauh, bukan percakapan normal.

Kontrak keamanan untuk pemulihan jarak jauh:

- Dinonaktifkan ketika sandbox aktif untuk agen/sesi; Crestodian menolak pemulihan jarak jauh dan mengarahkan ke perbaikan CLI lokal.
- Status efektif default adalah `auto`: izinkan pemulihan jarak jauh hanya dalam operasi YOLO tepercaya, ketika runtime sudah memiliki otoritas lokal tanpa sandbox (`tools.exec.security` ditetapkan menjadi `full` dan `tools.exec.ask` ditetapkan menjadi `off`, dengan mode sandbox `off`).
- Memerlukan identitas pemilik eksplisit; tidak boleh ada aturan pengirim wildcard, kebijakan grup terbuka, Webhook tanpa autentikasi, atau saluran anonim.
- Secara default hanya DM pemilik; pemulihan grup/saluran memerlukan persetujuan eksplisit.
- Pencarian dan daftar Plugin bersifat hanya baca. Instalasi Plugin selalu hanya dapat dilakukan secara lokal (diblokir dalam pemulihan, meskipun diaktifkan dengan cara lain) karena mengunduh kode yang dapat dieksekusi. Penghapusan instalasi Plugin ditolak baik dalam Crestodian lokal maupun pemulihan; jalankan `openclaw plugins uninstall <id>` dari terminal.
- Pemulihan jarak jauh tidak dapat membuka TUI lokal atau beralih ke sesi agen interaktif; gunakan `openclaw` lokal untuk serah terima ke agen.
- Penulisan persisten tetap memerlukan persetujuan, bahkan dalam mode pemulihan.
- Setiap operasi pemulihan yang diterapkan diaudit. Pemulihan saluran pesan mencatat metadata saluran, akun, pengirim, dan alamat sumber; operasi yang mengubah konfigurasi juga mencatat hash konfigurasi sebelum dan sesudah.
- Rahasia tidak pernah ditampilkan kembali. Pemeriksaan SecretRef melaporkan ketersediaan, bukan nilai.
- Jika Gateway aktif, pemulihan mengutamakan operasi bertipe Gateway; jika tidak aktif, pemulihan hanya menggunakan permukaan perbaikan lokal minimal yang tidak bergantung pada loop agen normal.

Bentuk konfigurasi:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`: `"auto"` (default) mengizinkan pemulihan hanya ketika runtime efektif berada dalam mode YOLO dan sandbox dinonaktifkan; `false` tidak pernah mengizinkan pemulihan saluran pesan; `true` secara eksplisit mengizinkan pemulihan ketika pemeriksaan pemilik/saluran lolos (tetap tunduk pada penolakan akibat sandbox).
- `ownerDmOnly`: membatasi pemulihan hanya pada pesan langsung pemilik. Default `true`.
- `pendingTtlMinutes`: durasi penulisan pemulihan yang tertunda tetap terbuka untuk persetujuan `/crestodian yes` sebelum kedaluwarsa. Default `15`.

Pemulihan jarak jauh dicakup oleh jalur Docker:

```bash
pnpm test:docker:crestodian-rescue
```

Pemeriksaan singkat permukaan perintah saluran langsung yang bersifat opsional memeriksa `/crestodian status` beserta siklus persetujuan persisten melalui penangan pemulihan:

```bash
pnpm test:live:crestodian-rescue-channel
```

Penyiapan sekali jalan dalam paket yang dibatasi oleh inferensi dicakup oleh:

```bash
pnpm test:docker:crestodian-first-run
```

Jalur CLI dalam paket tersebut dimulai dengan direktori status kosong dan membuktikan bahwa Crestodian gagal secara tertutup tanpa inferensi. Jalur tersebut kemudian menguji dan mengaktifkan Claude palsu melalui modul aktivasi dalam paket. Hanya setelah itu permintaan samar mencapai perencana dan diubah menjadi penyiapan bertipe, diikuti perintah sekali jalan yang membuat agen tambahan, mengonfigurasi Discord melalui pengaktifan Plugin beserta SecretRef token, memvalidasi konfigurasi, dan memeriksa log audit. Jalur ini merupakan bukti pendukung gerbang/operasi; jalur ini tidak menguji orientasi interaktif atau percakapan agen/alat/persetujuan Crestodian. Skenario QA Lab di bawah mengarahkan ke jalur Docker yang sama:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Terkait

- [Referensi CLI](/id/cli)
- [Doctor](/id/cli/doctor)
- [TUI](/id/cli/tui)
- [Sandbox](/id/cli/sandbox)
- [Keamanan](/id/cli/security)
