---
read_when:
    - Anda telah menyelesaikan penyiapan inferensi dan ingin OpenClaw mengonfigurasi sisanya
    - Anda perlu memeriksa atau memperbaiki OpenClaw dengan agen penyiapan lokal
    - Anda sedang merancang atau mengaktifkan mode penyelamatan saluran pesan
summary: Referensi CLI dan model keamanan untuk alat bantu penyiapan dan perbaikan OpenClaw berbasis inferensi
title: Agen penyiapan OpenClaw
x-i18n:
    generated_at: "2026-07-16T18:02:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cf52eeaf14dd2e2bc388c69a1566d4956d42d27cd28cd74b3f1fbee5a2b2e5f
    source_path: cli/openclaw.md
    workflow: 16
---

# `openclaw setup`

OpenClaw dilengkapi agen sistem bawaan — agen ini berbicara sebagai "OpenClaw" — untuk
penyiapan, perbaikan, dan konfigurasi lokal (sebelumnya disebut Crestodian). Agen ini dimulai hanya setelah model default efektif menyelesaikan giliran nyata.
Instalasi baru menyiapkan inferensi terlebih dahulu; konfigurasi yang tidak valid tetap menggunakan
alur doctor klasik.

## Kapan dimulai

Menjalankan `openclaw` tanpa subperintah akan mengarahkan alur berdasarkan status konfigurasi:

- Konfigurasi tidak ada, atau tersedia tanpa pengaturan yang dibuat pengguna (kosong, atau hanya kunci `$schema`/`meta`): memulai orientasi terpandu dengan verifikasi AI langsung.
- Konfigurasi tersedia tetapi gagal divalidasi: memulai orientasi klasik, yang melaporkan masalah dan mengarahkan Anda ke `openclaw doctor`.
- Konfigurasi tersedia dan valid: membuka TUI agen normal. Gateway terkonfigurasi yang dapat dijangkau dan agen default-nya memiliki model akan langsung membuka UI tersebut
  tanpa orientasi atau OpenClaw. Gunakan `/openclaw` di dalam TUI, atau jalankan
  `openclaw setup` secara langsung, untuk membuka OpenClaw nanti.

Menjalankan `openclaw setup` terlebih dahulu menguji model default yang dikonfigurasi secara langsung. Giliran yang berhasil akan memulai OpenClaw. Kegagalan interaktif membuka penyiapan inferensi terpandu dan menyerahkan kendali ke OpenClaw setelah salah satu kandidat berhasil. Permintaan sekali jalan, JSON, dan permintaan noninteraktif lainnya gagal dengan petunjuk untuk menjalankan `openclaw onboard` ketika inferensi tidak tersedia. `openclaw --help` dan `openclaw --version` tetap menggunakan jalur cepat normalnya.

`openclaw` tanpa argumen dalam mode noninteraktif (tanpa TTY) keluar dengan pesan singkat, bukan mencetak bantuan root: pesan tersebut mengarahkan ke orientasi noninteraktif pada instalasi baru atau tidak valid, atau ke `openclaw agent --local ...` jika konfigurasi valid.

`openclaw onboard --modern` tetap menjadi alias kompatibilitas untuk OpenClaw, tetapi menggunakan gerbang inferensi yang sama: inferensi yang berfungsi membuka obrolan, kegagalan interaktif memulai penyiapan inferensi terpandu, dan kegagalan noninteraktif keluar dengan panduan orientasi. `openclaw onboard --classic` membuka wizard langkah demi langkah lengkap.

## Yang ditampilkan OpenClaw

OpenClaw interaktif membuka shell TUI yang sama dengan `openclaw tui`, dengan backend obrolan OpenClaw. Salam pembuka mencakup:

- validitas konfigurasi dan agen default
- model terverifikasi yang digunakan OpenClaw
- keterjangkauan Gateway dari pemeriksaan awal saat memulai
- tindakan debug berikutnya yang direkomendasikan

OpenClaw tidak menampilkan semua rahasia atau memuat perintah CLI plugin hanya untuk memulai.

Gunakan `status` untuk inventaris terperinci: jalur konfigurasi, jalur dokumentasi/sumber, pemeriksaan CLI lokal, keberadaan kunci/token, agen, model, dan detail Gateway.

OpenClaw menggunakan penemuan referensi yang sama seperti agen biasa: dalam checkout Git, OpenClaw mengarahkan ke `docs/` lokal dan pohon sumber; dalam instalasi npm, OpenClaw menggunakan dokumentasi yang dibundel dan menautkan ke [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), dengan panduan untuk memeriksa sumber jika dokumentasi tidak memadai.

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

Operasi hanya-baca langsung dijalankan: menampilkan ringkasan, mencantumkan agen, mencantumkan plugin yang terinstal, mencari plugin ClawHub, menampilkan status model/backend, menjalankan pemeriksaan status/kesehatan, memeriksa keterjangkauan Gateway, menjalankan doctor tanpa perbaikan interaktif, memvalidasi konfigurasi, dan menampilkan jalur log audit.

Memulai penyiapan kanal terpandu (`connect telegram`) juga langsung dijalankan. Wizard-nya mengumpulkan jawaban eksplisit dan menangani penulisan yang dihasilkan.

Operasi persisten memerlukan persetujuan melalui percakapan (atau `--yes` untuk perintah langsung): menulis konfigurasi, `config set`, `config set-ref`, bootstrap penyiapan/orientasi, mengubah model default, memulai/menghentikan/memulai ulang Gateway, membuat agen, dan menginstal plugin.

Perbaikan doctor tidak tersedia di dalam OpenClaw karena dapat menulis ulang penyedia, autentikasi, atau rute inferensi agen default yang menjalankan sesi. Keluar dari OpenClaw dan jalankan `openclaw doctor --fix` di terminal. `doctor` yang hanya-baca tetap tersedia di dalam OpenClaw.

Agen baru mewarisi rute inferensi default yang telah diverifikasi langsung. ID agen `openclaw` dan `crestodian` disediakan untuk agen sistem dan tidak dapat dibuat sebagai agen normal. ID yang telah dihentikan tetap diblokir agar konfigurasi lama tidak dapat menggunakannya.

`config set` dan `config set-ref` tidak dapat mengubah status rute inferensi,
termasuk kredensial penyedia inferensi, `auth.*` tingkat atas, katalog model,
backend CLI, rute model default/per agen, parameter/alat agen, atau
`tools.*` root. Penulisan mentah di bawah `env.*`, `secrets.*`, `plugins.*`, dan `$include`
juga ditolak karena dapat mengganti resolusi kredensial atau aktivasi
penyedia. Autentikasi Gateway dan kanal tetap menjadi permukaan konfigurasi normal. Gunakan alur kerja plugin/kanal bertipe dan
`set default model <provider/model>` untuk rute yang sudah
dikonfigurasi; rute tersebut diuji secara langsung sebelum disimpan. Untuk mengonfigurasi atau
memperbaiki akses penyedia/autentikasi, keluar dari OpenClaw dan jalankan `openclaw onboard`.

Penghapusan instalasi plugin ditolak di dalam OpenClaw karena menghapus plugin
penyedia dapat menonaktifkan rute inferensi yang menjalankan sesi. Keluar dari OpenClaw
dan jalankan `openclaw plugins uninstall <id>` dari terminal.

Persetujuan diberikan dengan kata-kata Anda sendiri: balasan yang tidak ambigu ("ya", "tentu", "lanjutkan", "jangan sekarang") ditentukan berdasarkan daftar deterministik tertutup. Jika rute yang dikonfigurasi mendukung panggilan penyelesaian terpisah, balasan lain dapat diklasifikasikan hanya berdasarkan pesan Anda dan proposal yang tertunda — tidak pernah oleh model percakapan itu sendiri, yang tidak dapat menyetujui dirinya sendiri. Balasan yang tidak dapat diklasifikasikan atau ambigu membuat proposal tetap tertunda dan percakapan akan bertanya lagi.

Penulisan yang diterapkan dicatat dalam `~/.openclaw/audit/system-agent.jsonl`. Penemuan tidak diaudit; hanya operasi dan penulisan yang diterapkan yang diaudit.

Penyiapan kanal dapat dijalankan sebagai percakapan terhosting hingga mencapai rahasia. TUI
OpenClaw lokal tidak menerima jawaban wizard yang sensitif karena input obrolan
terminal terlihat. TUI langsung menawarkan `open channel wizard`, dengan membawa
kanal yang dipilih ke wizard terminal yang disamarkan; Anda juga dapat menjalankan
`openclaw channels add --channel <channel>` nanti.

### Beralih ke penyiapan kanal yang disamarkan

Obrolan lokal dapat menyerahkan kendali ke wizard kanal yang disamarkan:

```text
open channel wizard for slack
channel info slack
```

`open channel wizard for <channel>` membuka penyiapan kanal yang disamarkan setelah TUI
obrolan ditutup. Gunakan `channel info <channel>` terlebih dahulu untuk melihat label kanal, status
penyiapan, ringkasan prasyarat, dan tautan dokumentasi.

OpenClaw tidak pernah mengubah akses penyedia/autentikasi dari dalam sesinya sendiri:
sesi tersebut sudah bergantung pada rute inferensi itu. Untuk penyiapan atau
perbaikan penyedia model, `configure model provider` mengembalikan panduan keluar/orientasi tanpa
memulai wizard atau menulis konfigurasi. Keluar dari OpenClaw dan jalankan `openclaw
onboard`; orientasi menyiapkan kredensial dan hanya menyimpan rute yang
berhasil menyelesaikan giliran nyata secara langsung. Mulai kembali OpenClaw setelah orientasi berhasil.

## Bootstrap penyiapan

`setup` mengonfigurasi ruang kerja dan status Gateway yang tersisa setelah orientasi terpandu selesai menyiapkan inferensi. Perintah ini hanya menulis melalui operasi konfigurasi bertipe dan terlebih dahulu meminta persetujuan.

```text
setup
setup workspace ~/Projects/work
```

`setup` mempertahankan model efektif yang telah diverifikasi. Perintah ini tidak mengonfigurasi atau
mengganti inferensi.

Jika inferensi tidak tersedia atau pemeriksaan langsungnya gagal, keluar dari OpenClaw dan jalankan `openclaw onboard`. Orientasi terpandu mendeteksi model yang dikonfigurasi, kunci API, dan CLI lokal yang terautentikasi, meminta balasan nyata dari setiap kandidat, dan hanya menyimpan rute yang berhasil. OpenClaw langsung dimulai setelah batas tersebut dan kemudian dapat mengonfigurasi ruang kerja, Gateway, kanal, agen, plugin, dan fitur opsional lainnya.

Aplikasi macOS melewati seluruh tahapan ini ketika mencapai Gateway terkonfigurasi
yang agen default-nya sudah memiliki model terkonfigurasi; aplikasi membuka UI
agen normal.
Untuk Gateway baru atau belum lengkap, aplikasi menjalankan tahapan inferensi melalui
metode Gateway `openclaw.setup.detect` dan `openclaw.setup.activate`:
detect mencantumkan setiap backend kandidat yang ditemukan, activate menguji satu
kandidat secara langsung (penyelesaian nyata "balas dengan OK"), dan hanya menyimpan model,
kredensial, serta status penyedia/runtime yang diperlukan untuk rute tersebut setelah pengujian berhasil. Default ruang kerja dan Gateway tetap ditangani OpenClaw. Kandidat yang gagal
tidak pernah mengubah konfigurasi; aplikasi secara otomatis menelusuri tahapan berikutnya dan akhirnya
menawarkan langkah kunci/token manual yang diisi berdasarkan plugin penyedia
inferensi teks aktif milik Gateway. Penyedia yang dipilih memiliki model awal
dan konfigurasinya, dan kredensial diverifikasi dengan cara yang sama sebelum disimpan.

Supervisi Codex dan fitur plugin opsional lainnya tetap berada di luar
transaksi aktivasi inferensi ini. Konfigurasikan fitur tersebut hanya setelah inferensi
berfungsi dan OpenClaw telah dimulai; kebijakan plugin yang ada dan pilihan eksplisit untuk
tidak menggunakan supervisi tetap tidak diubah selama penyiapan inferensi.

## Percakapan AI

Percakapan bebas dalam OpenClaw interaktif berjalan melalui loop agen yang sama seperti agen OpenClaw biasa, dibatasi pada satu alat otoritas ring-zero OpenClaw, `openclaw`, yang membungkus operasi bertipe. Tindakan baca berjalan bebas, mutasi memerlukan persetujuan Anda melalui percakapan untuk operasi yang tepat tersebut (lihat Operasi dan persetujuan), dan setiap penulisan yang diterapkan diaudit serta divalidasi ulang. Sesi agen tetap tersimpan, sehingga OpenClaw memiliki memori multi-giliran yang nyata. Jika rute inferensi yang telah diverifikasi kemudian berhenti berfungsi, kembali ke `openclaw onboard` dan perbaiki sebelum melanjutkan.

Host tidak mengurai permintaan bahasa alami menjadi operasi. Pesan bebas
— termasuk teks yang menyerupai perintah dan pertanyaan seperti "mengapa
gateway saya berhenti?" — diteruskan ke AI, yang dapat memetakan permintaan ke operasi bertipe
melalui alat `openclaw`.

Saat mutasi tertunda, hanya frasa persetujuan atau penolakan yang tidak ambigu dari
daftar tertutup yang ditentukan tanpa inferensi. Persetujuan ambigu diteruskan ke
panggilan penyelesaian terpisah yang dikonfigurasi dan selain itu gagal secara tertutup. Kolom
wizard terstruktur dan navigasi host yang tepat adalah kontrol UI, bukan penguraian operasi
bahasa alami. Satu pengecualian kebersihan rahasia sangat penting: `config set` yang
persis pada jalur sensitif (token, kunci, kata sandi) tidak pernah diteruskan
ke model. Host membuat proposal yang telah disunting, dan nilainya disamarkan dalam
riwayat yang terlihat oleh AI. Utamakan `config set-ref <path> env <ENV_VAR>` untuk rahasia.

Mode pemulihan kanal pesan tidak pernah menggunakan perencana berbantuan model. Pemulihan jarak jauh tetap deterministik agar jalur agen normal yang rusak atau disusupi tidak dapat digunakan sebagai editor konfigurasi.

### Model kepercayaan harness CLI

Runtime tertanam dan harness app-server Codex memberlakukan pembatasan ring-zero
secara langsung: proses menjalankan daftar izin alat OpenClaw yang hanya berisi
alat `openclaw`. Untuk Codex, OpenClaw juga menonaktifkan lingkungan, eksekusi
native, multiagen, sasaran, aplikasi/plugin, skill/MCP, pencarian web, dan
permukaan `request_user_input` untuk proses tersebut. Codex tetap menyuntikkan utilitas
native `update_plan` yang inert; utilitas ini dapat memperbarui daftar periksa
sementara milik model, tetapi tidak dapat menulis file atau konfigurasi OpenClaw.
Harness CLI tidak menggunakan daftar izin OpenClaw, sehingga OpenClaw hanya
mengizinkan backend yang kontrak pemilihan alatnya sendiri dapat membuktikan
pembatasan yang sama:

- Backend yang dapat dipilih, termasuk Claude Code, diluncurkan dengan
  pilihan alat native kosong dan satu alat MCP, `openclaw`. Konfigurasi MCP
  Claude yang dihasilkan diterapkan dengan `--strict-mcp-config`, sehingga tidak ada
  server MCP lain yang dimuat.
- Backend yang menyatakan tidak memiliki alat native menerima server MCP
  OpenClaw khusus yang sama.
- Backend dengan alat native yang selalu aktif atau tidak diketahui gagal
  secara tertutup sebelum inferensi; backend tersebut tidak dapat menghosting
  sesi OpenClaw.

Hanya sesi OpenClaw yang mendapatkan server MCP openclaw; proses agen normal
tidak pernah melihat alat ini. Karena itu, backend CLI yang dapat dipilih/tanpa
alat native dan model kunci API memberlakukan loop satu alat secara harfiah.
Model app-server Codex memberlakukan satu alat otoritas OpenClaw ditambah utilitas
perencanaan native yang inert. Dalam ketiga kasus tersebut, penulisan penyiapan
tetap terbatas pada kontrak persetujuan OpenClaw yang diaudit.

Gemini CLI tetap tersedia untuk agen normal, tetapi tidak dapat memberlakukan
probe tanpa alat yang diwajibkan oleh gerbang inferensi, sehingga tidak dapat
menghosting OpenClaw.

## Beralih ke agen

Gunakan pemilih bahasa alami untuk keluar dari OpenClaw dan membuka TUI normal:

```text
bicara dengan agen
bicara dengan agen kerja
beralih ke agen utama
```

`openclaw tui`, `openclaw chat`, dan `openclaw terminal` membuka TUI agen normal secara langsung; perintah tersebut tidak memulai OpenClaw. Setelah beralih ke TUI normal, `/openclaw` kembali ke OpenClaw, secara opsional dengan permintaan lanjutan:

```text
/openclaw
/openclaw mulai ulang gateway
```

## Mode pemulihan pesan

Mode pemulihan pesan adalah titik masuk saluran pesan untuk OpenClaw: gunakan
mode ini ketika agen normal tidak berfungsi tetapi saluran tepercaya (misalnya
WhatsApp) masih menerima perintah.

Ini adalah penangan perintah darurat deterministik, bukan agen OpenClaw
percakapan. Penangan ini tidak mem-bootstrap penyiapan baru atau melonggarkan
gerbang inferensi untuk percakapan OpenClaw.

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

Pembuatan agen hanya boleh menyebut model default yang saat ini telah
diverifikasi secara langsung. Hilangkan model untuk mewarisi rute tersebut.

Pemulihan jarak jauh adalah permukaan admin dan harus diperlakukan seperti
perbaikan konfigurasi jarak jauh, bukan percakapan normal.

Kontrak keamanan untuk pemulihan jarak jauh:

- Dinonaktifkan ketika sandboxing aktif untuk agen/sesi; OpenClaw menolak pemulihan jarak jauh dan mengarahkan ke perbaikan CLI lokal.
- Keadaan efektif default adalah `auto`: izinkan pemulihan jarak jauh hanya dalam operasi YOLO tepercaya, saat runtime telah memiliki otoritas lokal tanpa sandbox (`tools.exec.security` ditetapkan menjadi `full` dan `tools.exec.ask` ditetapkan menjadi `off`, dengan mode sandbox `off`).
- Memerlukan identitas pemilik eksplisit; tidak ada aturan pengirim wildcard, kebijakan grup terbuka, webhook tanpa autentikasi, atau saluran anonim.
- Secara default hanya DM pemilik; pemulihan grup/saluran memerlukan pengaktifan eksplisit.
- Pencarian dan daftar plugin bersifat hanya baca. Penginstalan plugin selalu hanya lokal (diblokir dalam pemulihan, bahkan ketika diaktifkan dalam kondisi lain) karena mengunduh kode yang dapat dieksekusi. Penghapusan instalasi plugin ditolak baik di OpenClaw lokal maupun pemulihan; jalankan `openclaw plugins uninstall <id>` dari terminal.
- Pemulihan jarak jauh tidak dapat membuka TUI lokal atau beralih ke sesi agen interaktif; gunakan `openclaw` lokal untuk serah terima agen.
- Penulisan persisten tetap memerlukan persetujuan, bahkan dalam mode pemulihan.
- Persetujuan tertunda hanya dapat digunakan sekali. Perintah pemulihan yang lebih baru untuk akun, saluran, dan pengirim yang sama mencabut rencana sebelumnya; eksekusi yang gagal juga menghabiskan persetujuan, jadi kirim ulang perintah untuk mencoba lagi.
- Setiap operasi pemulihan yang diterapkan diaudit. Pemulihan saluran pesan mencatat metadata saluran, akun, pengirim, dan alamat sumber; operasi yang mengubah konfigurasi juga mencatat hash konfigurasi sebelum dan sesudahnya.
- Rahasia tidak pernah ditampilkan kembali. Pemeriksaan SecretRef melaporkan ketersediaan, bukan nilai.
- Jika Gateway aktif, pemulihan mengutamakan operasi bertipe Gateway; jika tidak aktif, pemulihan hanya menggunakan permukaan perbaikan lokal minimal yang tidak bergantung pada loop agen normal.

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

- `enabled`: `"auto"` (default) mengizinkan pemulihan hanya ketika runtime efektif adalah YOLO dan sandboxing nonaktif; `false` tidak pernah mengizinkan pemulihan saluran pesan; `true` secara eksplisit mengizinkan pemulihan ketika pemeriksaan pemilik/saluran berhasil (tetap tunduk pada penolakan sandboxing).
- `ownerDmOnly`: batasi pemulihan pada pesan langsung pemilik. Default `true`.
- `pendingTtlMinutes`: durasi penulisan pemulihan tertunda tetap terbuka untuk persetujuan `/openclaw yes` sebelum kedaluwarsa. Default `15`.

`openclaw doctor --fix` memigrasikan blok konfigurasi lama `crestodian` ke
`systemAgent`. Runtime hanya membaca blok kanonis.

Pemulihan jarak jauh dicakup oleh lane Docker:

```bash
pnpm test:docker:system-agent-rescue
```

Smoke opsional untuk permukaan perintah saluran langsung memeriksa `/openclaw status` beserta alur persetujuan persisten pergi-pulang melalui penangan pemulihan:

```bash
pnpm test:live:system-agent-rescue-channel
```

Penyiapan sekali jalan terpaket yang dibatasi inferensi dicakup oleh:

```bash
pnpm test:docker:system-agent-first-run
```

Lane CLI terpaket tersebut dimulai dengan direktori status kosong dan
membuktikan bahwa OpenClaw gagal secara tertutup tanpa inferensi. Selanjutnya,
lane tersebut menguji dan mengaktifkan Claude palsu melalui modul aktivasi
terpaket. Hanya setelah itu permintaan samar mencapai perencana dan diselesaikan
menjadi penyiapan bertipe, lalu diikuti perintah sekali jalan yang membuat agen
tambahan, mengonfigurasi Discord melalui pengaktifan plugin beserta SecretRef
token, memvalidasi konfigurasi, dan memeriksa log audit. Lane ini adalah bukti
pendukung gerbang/operasi; lane ini tidak menjalankan onboarding interaktif atau
percakapan agen/alat/persetujuan OpenClaw. Skenario QA Lab di bawah ini
mengalihkan ke lane Docker yang sama:

```bash
pnpm openclaw qa suite --scenario system-agent-ring-zero-setup
```

## Terkait

- [Referensi CLI](/id/cli)
- [Doctor](/id/cli/doctor)
- [TUI](/id/cli/tui)
- [Sandbox](/id/cli/sandbox)
- [Keamanan](/id/cli/security)
