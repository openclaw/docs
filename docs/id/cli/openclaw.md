---
read_when:
    - Anda telah menyelesaikan penyiapan inferensi dan ingin OpenClaw mengonfigurasi sisanya
    - Anda perlu memeriksa atau memperbaiki OpenClaw dengan agen penyiapan lokal
    - Anda sedang merancang atau mengaktifkan mode penyelamatan saluran pesan
summary: Referensi CLI dan model keamanan untuk pembantu penyiapan dan perbaikan OpenClaw yang didukung inferensi
title: Agen penyiapan OpenClaw
x-i18n:
    generated_at: "2026-07-19T16:20:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 32643eb24cd010c1018908f78d901ebdcac9ef13f7c639e48a5ba7be5913a1d5
    source_path: cli/openclaw.md
    workflow: 16
---

# `openclaw setup`

OpenClaw dilengkapi agen sistem bawaan — agen ini berbicara sebagai "OpenClaw" — untuk
penyiapan, perbaikan, dan konfigurasi lokal (sebelumnya disebut Crestodian). Agen ini hanya dimulai setelah model default efektif menyelesaikan giliran nyata.
Instalasi baru menyiapkan inferensi terlebih dahulu; konfigurasi yang tidak valid tetap menggunakan
alur doctor klasik.

## Kapan dimulai

Menjalankan `openclaw` tanpa subperintah akan mengarahkan alur berdasarkan status konfigurasi:

- Konfigurasi tidak ada, atau ada tanpa pengaturan yang dibuat pengguna (kosong, atau hanya kunci `$schema`/`meta`): memulai onboarding terpandu dengan verifikasi AI langsung.
- Konfigurasi ada tetapi gagal divalidasi: memulai onboarding klasik, yang melaporkan masalah dan mengarahkan Anda ke `openclaw doctor`.
- Konfigurasi ada dan valid: membuka TUI agen normal. Gateway terkonfigurasi yang dapat dijangkau dan agen default-nya memiliki model akan langsung membuka UI tersebut
  tanpa onboarding atau OpenClaw. Gunakan `/openclaw` di dalam TUI, atau jalankan
  `openclaw setup` secara langsung, untuk membuka OpenClaw nanti.

Menjalankan `openclaw setup` terlebih dahulu menguji langsung model default yang dikonfigurasi. Giliran yang berhasil akan memulai OpenClaw. Kegagalan interaktif membuka penyiapan inferensi terpandu dan menyerahkan kendali ke OpenClaw setelah salah satu kandidat berhasil. Permintaan sekali jalan, JSON, dan permintaan noninteraktif lainnya gagal dengan petunjuk untuk menjalankan `openclaw onboard` saat inferensi tidak tersedia. `openclaw --help` dan `openclaw --version` tetap menggunakan jalur cepat normalnya.

`openclaw` tanpa argumen dalam mode noninteraktif (tanpa TTY) keluar dengan pesan singkat alih-alih mencetak bantuan tingkat root: pesan tersebut mengarahkan ke onboarding noninteraktif pada instalasi baru atau tidak valid, atau ke `openclaw agent --local ...` jika konfigurasi valid.

`openclaw onboard --modern` tetap menjadi alias kompatibilitas untuk OpenClaw, tetapi menggunakan gerbang inferensi yang sama: inferensi yang berfungsi membuka percakapan, kegagalan interaktif memulai penyiapan inferensi terpandu, dan kegagalan noninteraktif keluar dengan panduan onboarding. `openclaw onboard --classic` membuka wizard langkah demi langkah lengkap.

## Yang ditampilkan OpenClaw

OpenClaw interaktif membuka shell TUI yang sama seperti `openclaw tui`, dengan backend percakapan OpenClaw. Salam pembuka mencakup:

- validitas konfigurasi dan agen default
- model terverifikasi yang digunakan OpenClaw
- keterjangkauan Gateway dari pemeriksaan awal pertama
- tindakan debug berikutnya yang direkomendasikan

OpenClaw tidak menampilkan seluruh rahasia atau memuat perintah CLI Plugin hanya untuk memulai.

Gunakan `status` untuk inventaris terperinci: jalur konfigurasi, jalur dokumentasi/sumber, pemeriksaan CLI lokal, keberadaan kunci/token, agen, model, dan detail Gateway.

OpenClaw menggunakan penemuan referensi yang sama seperti agen biasa: dalam checkout Git, OpenClaw mengarahkan ke `docs/` lokal dan pohon sumber; dalam instalasi npm, OpenClaw menggunakan dokumentasi yang disertakan dan menautkan ke [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), dengan panduan untuk memeriksa sumber ketika dokumentasi tidak memadai.

## Contoh

```bash
openclaw
openclaw setup
openclaw setup --json
openclaw setup --message "models"
openclaw setup --message "validate config"
openclaw setup --message "setup workspace ~/Projects/work" --yes
openclaw setup --message "set default model openai/gpt-5.6" --yes
openclaw onboard --modern
```

Di dalam TUI OpenClaw:

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

OpenClaw menggunakan operasi bertipe alih-alih mengedit konfigurasi secara ad hoc.

Operasi hanya-baca langsung dijalankan: menampilkan ringkasan, mencantumkan agen, mencantumkan Plugin yang terinstal, mencari Plugin ClawHub, menampilkan status model/backend, menjalankan pemeriksaan status/kesehatan, memeriksa keterjangkauan Gateway, menjalankan doctor tanpa perbaikan interaktif, memvalidasi konfigurasi, dan menampilkan jalur log audit.

Memulai penyiapan saluran terpandu (`connect telegram`) juga langsung dijalankan. Wizard-nya mengumpulkan jawaban eksplisit dan mengelola penulisan yang dihasilkan.

Operasi persisten memerlukan persetujuan melalui percakapan (atau `--yes` untuk perintah langsung): menulis konfigurasi, `config set`, `config set-ref`, bootstrap penyiapan/onboarding, mengubah model default, memulai/menghentikan/memulai ulang Gateway, membuat agen, dan menginstal Plugin.

Perbaikan doctor tidak tersedia di dalam OpenClaw karena dapat menulis ulang rute inferensi penyedia, autentikasi, atau agen default yang mendukung sesi. Keluar dari OpenClaw dan jalankan `openclaw doctor --fix` di terminal. `doctor` hanya-baca tetap tersedia di dalam OpenClaw.

Agen baru mewarisi rute inferensi default yang telah diverifikasi langsung. ID agen `openclaw` dan `crestodian` dicadangkan untuk agen sistem dan tidak dapat dibuat sebagai agen normal. ID yang telah dihentikan tetap diblokir agar konfigurasi lama tidak dapat menggunakannya.

`config set` dan `config set-ref` dapat mengubah pengaturan apa pun yang dapat diubah pengguna,
dengan daftar penolakan singkat khusus manusia: `$include`, `auth.*`, `env.*`, `models.*`,
dan `secrets.*` tetap ditolak karena memuat materi kredensial,
penyertaan konfigurasi alternatif, atau definisi penyedia/katalog yang digunakan untuk
perutean inferensi. Perutean inferensi itu sendiri juga dilindungi: rute model default
(bidang model/parameter/runtime `agents.defaults`) dan bidang perutean
agen yang mendukung rute default aktif ditolak, demikian pula bidang
identitas/topologi agen (`id`, `agentDir`, `default`). Bidang perutean untuk
agen lain tetap dapat ditulis setelah mendapat persetujuan. Autentikasi Gateway dan saluran tetap menjadi
permukaan konfigurasi normal. Gunakan `set default model <provider/model>` untuk
rute yang telah dikonfigurasi; perintah ini menguji rute secara langsung sebelum menyimpannya. Untuk
mengonfigurasi atau memperbaiki akses penyedia/autentikasi, keluar dari OpenClaw dan jalankan
`openclaw onboard`.

Penulisan `plugins.entries.<id>.*` (mengaktifkan/menonaktifkan/mengonfigurasi Plugin yang terinstal)
diizinkan kecuali Plugin tersebut mendukung rute inferensi aktif. Sumber instalasi Plugin
dan kebijakan pemuatan mempertahankan batas kepercayaannya dalam alur kerja
instalasi Plugin bertipe. Penghapusan instalasi Plugin yang mendukung rute
ditolak karena alasan yang sama; keluar dari OpenClaw dan jalankan
`openclaw plugins uninstall <id>` dari terminal.

Persetujuan diberikan dengan kata-kata Anda sendiri: balasan yang tidak ambigu ("ya", "tentu", "lanjutkan", "jangan sekarang") ditentukan dari daftar deterministik tertutup. Ketika rute yang dikonfigurasi mendukung panggilan penyelesaian terpisah, balasan lain dapat diklasifikasikan hanya berdasarkan pesan Anda dan usulan yang tertunda — tidak pernah oleh model percakapan itu sendiri, yang tidak dapat menyetujui dirinya sendiri. Balasan yang tidak terklasifikasi atau ambigu membuat usulan tetap tertunda dan percakapan akan bertanya kembali.

### Riwayat perubahan

Halaman Tanya OpenClaw dapat menampilkan operasi agen sistem terbaru yang diterapkan, migrasi Doctor,
penulisan konfigurasi melalui Pengaturan dan CLI, serta pengeditan manual pada
`openclaw.json`. Jurnal konfigurasi mendeteksi pengeditan eksternal saat Gateway
sedang memantau, selama penulisan milik OpenClaw, atau saat startup berikutnya setelah
pengeditan offline.

Riwayat disimpan dalam tabel `diagnostic_events` pada basis data bersama
`~/.openclaw/state/openclaw.sqlite`, di bawah cakupan `system-agent-audit`
dan `config-audit`. Setiap cakupan mempertahankan 50,000 catatan terbarunya.
Operasi penemuan dan hanya-baca tidak disertakan. Rahasia tidak pernah muncul dalam
riwayat perubahan; catatan jurnal konfigurasi berisi jalur yang berubah, bukan nilai
konfigurasi, dan perbandingan nilai menggunakan sidik jari yang dilindungi.

Penyiapan saluran dapat dijalankan sebagai percakapan yang dihosting sampai mencapai rahasia. TUI
OpenClaw lokal tidak menerima jawaban wizard yang sensitif karena masukan
percakapan terminal terlihat. TUI langsung menawarkan `open channel wizard`, dengan membawa
saluran yang dipilih ke wizard terminal tersamarkan; Anda juga dapat menjalankan
`openclaw channels add --channel <channel>` nanti.

### Beralih ke penyiapan saluran tersamarkan

Percakapan lokal dapat menyerahkan kendali ke wizard saluran tersamarkan:

```text
open channel wizard for slack
channel info slack
```

`open channel wizard for <channel>` membuka penyiapan saluran tersamarkan setelah TUI
percakapan ditutup. Gunakan `channel info <channel>` terlebih dahulu untuk melihat label saluran, status
penyiapan, ringkasan prasyarat, dan tautan dokumentasi.

OpenClaw tidak pernah mengubah akses penyedia/autentikasi dari dalam sesinya sendiri:
sesi tersebut sudah bergantung pada rute inferensi itu. Untuk penyiapan atau
perbaikan penyedia model, `configure model provider` mengembalikan panduan keluar/onboarding tanpa
memulai wizard atau menulis konfigurasi. Keluar dari OpenClaw dan jalankan `openclaw
onboard`; onboarding menyiapkan kredensial dan hanya menyimpan rute yang
berhasil menyelesaikan giliran langsung yang nyata. Mulai kembali OpenClaw setelah onboarding berhasil.

## Bootstrap penyiapan

`setup` mengonfigurasi status ruang kerja dan Gateway yang tersisa setelah onboarding terpandu berhasil menyiapkan inferensi. Perintah ini hanya menulis melalui operasi konfigurasi bertipe dan meminta persetujuan terlebih dahulu.

```text
setup
setup workspace ~/Projects/work
```

`setup` mempertahankan model efektif yang telah diverifikasi. Perintah ini tidak mengonfigurasi atau
mengganti inferensi.

Jika inferensi tidak ada atau pemeriksaan langsungnya gagal, keluar dari OpenClaw dan jalankan `openclaw onboard`. Onboarding terpandu mendeteksi model yang dikonfigurasi, kunci API, dan CLI lokal yang terautentikasi, meminta balasan nyata dari setiap kandidat, dan hanya menyimpan rute yang berhasil. OpenClaw langsung dimulai setelah batas tersebut dan kemudian dapat mengonfigurasi ruang kerja, Gateway, saluran, agen, Plugin, dan fitur opsional lainnya.

Aplikasi macOS melewati seluruh tahapan ini saat terhubung ke Gateway terkonfigurasi
yang agen default-nya sudah memiliki model terkonfigurasi; aplikasi membuka UI agen
normal.
Untuk Gateway baru atau belum lengkap, aplikasi menjalankan tahapan inferensi melalui
metode Gateway `openclaw.setup.detect` dan `openclaw.setup.activate`:
detect mencantumkan setiap backend kandidat yang ditemukan, activate menguji langsung satu
kandidat (penyelesaian nyata "reply with OK"), dan hanya menyimpan model,
kredensial, serta status penyedia/runtime yang diperlukan untuk rute tersebut setelah pengujian berhasil. Default ruang kerja dan Gateway tetap diserahkan kepada OpenClaw. Kandidat yang gagal
tidak pernah mengubah konfigurasi; aplikasi secara otomatis menelusuri tahapan berikutnya dan akhirnya
menawarkan langkah kunci/token manual yang diisi dari Plugin penyedia
inferensi teks aktif milik Gateway. Penyedia yang dipilih memiliki model
awal dan konfigurasinya, dan kredensial diverifikasi dengan cara yang sama sebelum disimpan.

Supervisi Codex dan fitur Plugin opsional lainnya tetap berada di luar
transaksi aktivasi inferensi ini. Konfigurasikan hanya setelah inferensi
berfungsi dan OpenClaw telah dimulai; kebijakan Plugin yang ada dan
penolakan supervisi eksplisit tetap tidak berubah selama penyiapan inferensi.

## Percakapan AI

Percakapan bebas dalam OpenClaw interaktif berjalan melalui loop agen yang sama seperti agen OpenClaw biasa, dibatasi pada satu alat otoritas OpenClaw ring-zero, `openclaw`, yang membungkus operasi bertipe. Tindakan baca berjalan bebas, mutasi memerlukan persetujuan Anda melalui percakapan untuk operasi tersebut secara persis (lihat Operasi dan persetujuan), dan setiap penulisan yang diterapkan diaudit serta divalidasi ulang. Sesi agen dipertahankan, sehingga OpenClaw memiliki memori multi-giliran yang nyata. Jika rute inferensi terverifikasi kemudian berhenti berfungsi, kembali ke `openclaw onboard` dan perbaiki sebelum melanjutkan.

Host tidak mengurai permintaan bahasa alami menjadi operasi. Pesan bebas
— termasuk teks yang tampak seperti perintah dan pertanyaan seperti "mengapa
gateway saya berhenti?" — dikirim ke AI, yang dapat memetakan permintaan ke operasi bertipe
melalui alat `openclaw`.

Saat mutasi tertunda, hanya frasa persetujuan atau penolakan yang tidak ambigu dari
daftar tertutup yang diselesaikan tanpa inferensi. Persetujuan yang ambigu diteruskan ke
panggilan penyelesaian terkonfigurasi yang terpisah dan jika tidak, akan gagal secara tertutup. Kolom
wizard terstruktur dan navigasi host yang persis merupakan kontrol UI, bukan penguraian operasi
bahasa alami. Satu pengecualian terkait kebersihan rahasia sangat penting: `config set`
yang persis pada jalur sensitif (token, kunci, kata sandi) tidak pernah diteruskan
ke model. Host membuat proposal yang telah disunting, dan nilainya disamarkan dalam
riwayat yang terlihat oleh AI. Utamakan `config set-ref <path> env <ENV_VAR>` untuk rahasia.

Mode pemulihan saluran pesan tidak pernah menggunakan perencana berbantuan model. Pemulihan jarak jauh tetap deterministik sehingga jalur agen normal yang rusak atau disusupi tidak dapat digunakan sebagai editor konfigurasi.

### Model kepercayaan harness CLI

Runtime tersemat dan harness app-server Codex memberlakukan pembatasan ring-zero
secara langsung: proses membawa daftar izin alat OpenClaw yang hanya berisi
alat `openclaw`. Untuk Codex, OpenClaw juga menonaktifkan lingkungan, eksekusi
native, multi-agent, tujuan, aplikasi/plugin, skill/MCP, pencarian web, dan
permukaan `request_user_input` untuk proses tersebut. Codex tetap menyuntikkan utilitas native
`update_plan` yang inert; utilitas ini dapat memperbarui daftar periksa sementara milik model, tetapi tidak dapat menulis file
atau konfigurasi OpenClaw. Harness CLI tidak menggunakan daftar izin OpenClaw,
sehingga OpenClaw hanya menerima backend yang kontrak pemilihan alatnya sendiri dapat membuktikan
pembatasan yang sama:

- Backend yang dapat dipilih, termasuk Claude Code, diluncurkan dengan pemilihan alat native
  kosong dan satu alat MCP, `openclaw`. Konfigurasi MCP yang dihasilkan Claude
  diterapkan dengan `--strict-mcp-config`, sehingga tidak ada server MCP lain yang dimuat.
- Backend yang menyatakan tidak memiliki alat native menerima server MCP OpenClaw
  khusus yang sama.
- Backend dengan alat native yang selalu aktif atau tidak diketahui gagal secara tertutup sebelum inferensi;
  backend tersebut tidak dapat menghosting sesi OpenClaw.

Hanya sesi OpenClaw yang mendapatkan server MCP openclaw; proses agen normal
tidak pernah melihat alat ini. Oleh karena itu, backend CLI yang dapat dipilih/tanpa alat native dan model
dengan kunci API memberlakukan perulangan satu alat secara literal. Model app-server Codex memberlakukan
satu alat otoritas OpenClaw ditambah utilitas perencanaan native yang inert. Dalam ketiga
kasus tersebut, penulisan penyiapan tetap terbatas pada kontrak persetujuan OpenClaw
yang diaudit.

Gemini CLI tetap tersedia untuk agen normal, tetapi tidak dapat memberlakukan
probe tanpa alat yang diwajibkan oleh gerbang inferensi, sehingga tidak dapat menghosting OpenClaw.

## Beralih ke agen

Gunakan pemilih bahasa alami untuk keluar dari OpenClaw dan membuka TUI normal:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat`, dan `openclaw terminal` membuka TUI agen normal secara langsung; perintah tersebut tidak memulai OpenClaw. Setelah beralih ke TUI normal, `/openclaw` kembali ke OpenClaw, secara opsional dengan permintaan lanjutan:

```text
/openclaw
/openclaw restart gateway
```

## Mode pemulihan pesan

Mode pemulihan pesan adalah titik masuk saluran pesan untuk OpenClaw: gunakan saat agen normal Anda tidak berfungsi, tetapi saluran tepercaya (misalnya WhatsApp) masih menerima perintah.

Ini adalah penangan perintah darurat deterministik, bukan agen OpenClaw
percakapan. Penangan ini tidak memulai penyiapan baru atau melonggarkan gerbang inferensi
untuk percakapan OpenClaw.

Perintah yang didukung: `/openclaw <request>`. Pemulihan hanya menerima tata bahasa perintah yang diketik secara persis — bahasa alami ditolak dengan petunjuk, tidak pernah ditebak menjadi operasi, dan model tidak pernah digunakan.

```text
Anda, dalam DM pemilik tepercaya: /openclaw status
OpenClaw: Mode pemulihan OpenClaw. Gateway dapat dijangkau: tidak. Konfigurasi valid: tidak.
Anda: /openclaw restart gateway
OpenClaw: Rencana: mulai ulang Gateway. Balas /openclaw yes untuk menerapkan.
Anda: /openclaw yes
OpenClaw: Diterapkan. Entri audit ditulis.
```

Pembuatan agen juga dapat dimasukkan ke antrean secara lokal atau melalui pemulihan:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/openclaw create agent work workspace ~/Projects/work
```

Pembuatan agen hanya boleh menentukan model default saat ini yang telah diverifikasi secara langsung. Hilangkan
model untuk mewarisi rute tersebut.

Pemulihan jarak jauh adalah permukaan admin dan harus diperlakukan seperti perbaikan konfigurasi jarak jauh, bukan percakapan normal.

Kontrak keamanan untuk pemulihan jarak jauh:

- Dinonaktifkan ketika sandboxing aktif untuk agen/sesi; OpenClaw menolak pemulihan jarak jauh dan mengarahkan ke perbaikan CLI lokal.
- Status efektif default adalah `auto`: izinkan pemulihan jarak jauh hanya dalam operasi YOLO tepercaya, saat runtime sudah memiliki otoritas lokal tanpa sandbox (`tools.exec.security` diresolusi menjadi `full` dan `tools.exec.ask` diresolusi menjadi `off`, dengan mode sandbox `off`).
- Memerlukan identitas pemilik eksplisit; tidak boleh ada aturan pengirim wildcard, kebijakan grup terbuka, Webhook tanpa autentikasi, atau saluran anonim.
- Secara default hanya DM pemilik; pemulihan grup/saluran memerlukan persetujuan eksplisit.
- Pencarian dan daftar Plugin bersifat hanya-baca. Penginstalan Plugin selalu hanya dapat dilakukan secara lokal (diblokir dalam pemulihan, bahkan ketika diaktifkan dalam kondisi lain) karena mengunduh kode yang dapat dieksekusi. Penghapusan instalasi Plugin ditolak dalam OpenClaw lokal maupun pemulihan; jalankan `openclaw plugins uninstall <id>` dari terminal.
- Pemulihan jarak jauh tidak dapat membuka TUI lokal atau beralih ke sesi agen interaktif; gunakan `openclaw` lokal untuk penyerahan ke agen.
- Penulisan persisten tetap memerlukan persetujuan, bahkan dalam mode pemulihan.
- Persetujuan tertunda hanya dapat digunakan satu kali. Setiap perintah pemulihan yang lebih baru untuk akun, saluran, dan pengirim yang sama mencabut rencana sebelumnya; eksekusi yang gagal juga menghabiskan persetujuan, jadi kirim ulang perintah untuk mencoba lagi.
- Setiap operasi pemulihan yang diterapkan diaudit. Pemulihan saluran pesan mencatat metadata saluran, akun, pengirim, dan alamat sumber; operasi yang mengubah konfigurasi juga mencatat hash konfigurasi sebelum dan sesudah.
- Rahasia tidak pernah ditampilkan kembali. Pemeriksaan SecretRef melaporkan ketersediaan, bukan nilai.
- Jika Gateway aktif, pemulihan mengutamakan operasi bertipe Gateway; jika Gateway tidak aktif, pemulihan hanya menggunakan permukaan perbaikan lokal minimal yang tidak bergantung pada perulangan agen normal.

Bentuk konfigurasi:

```jsonc
{
  "systemAgent": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`: `"auto"` (default) mengizinkan pemulihan hanya ketika runtime efektif adalah YOLO dan sandboxing dinonaktifkan; `false` tidak pernah mengizinkan pemulihan saluran pesan; `true` secara eksplisit mengizinkan pemulihan ketika pemeriksaan pemilik/saluran lolos (tetap tunduk pada penolakan sandboxing).
- `ownerDmOnly`: batasi pemulihan ke pesan langsung pemilik. Default `true`.
- `pendingTtlMinutes`: durasi penulisan pemulihan tertunda tetap terbuka untuk persetujuan `/openclaw yes` sebelum kedaluwarsa. Default `15`.

`openclaw doctor --fix` memigrasikan blok konfigurasi lama `crestodian` ke
`systemAgent`. Runtime hanya membaca blok kanonis.

Pemulihan jarak jauh dicakup oleh jalur Docker:

```bash
pnpm test:docker:system-agent-rescue
```

Pengujian singkat permukaan perintah saluran langsung yang memerlukan persetujuan eksplisit memeriksa `/openclaw status` beserta proses persetujuan persisten bolak-balik melalui penangan pemulihan:

```bash
pnpm test:live:system-agent-rescue-channel
```

Penyiapan sekali jalan dalam paket yang dibatasi gerbang inferensi dicakup oleh:

```bash
pnpm test:docker:system-agent-first-run
```

Jalur CLI dalam paket tersebut dimulai dengan direktori status kosong dan membuktikan bahwa OpenClaw
gagal secara tertutup tanpa inferensi. Jalur tersebut kemudian menguji dan mengaktifkan Claude palsu melalui
modul aktivasi dalam paket. Hanya setelah itu permintaan yang tidak persis mencapai
perencana dan diresolusi menjadi penyiapan bertipe, diikuti oleh perintah sekali jalan yang membuat
agen tambahan, mengonfigurasi Discord melalui pengaktifan Plugin beserta token
SecretRef, memvalidasi konfigurasi, dan memeriksa log audit. Jalur ini merupakan bukti pendukung
gerbang/operasi; jalur ini tidak menjalankan orientasi interaktif atau percakapan
agen/alat/persetujuan OpenClaw. Skenario QA Lab berikut mengalihkan
ke jalur Docker yang sama:

```bash
pnpm openclaw qa suite --scenario system-agent-ring-zero-setup
```

## Terkait

- [Referensi CLI](/id/cli)
- [Doctor](/id/cli/doctor)
- [TUI](/id/cli/tui)
- [Sandbox](/id/cli/sandbox)
- [Keamanan](/id/cli/security)
