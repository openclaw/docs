---
read_when:
    - Anda ingin menyiapkan inferensi, lalu menyelesaikan penyiapan dengan OpenClaw
summary: Referensi CLI untuk `openclaw onboard` (orientasi interaktif)
title: Orientasi Awal
x-i18n:
    generated_at: "2026-07-20T14:04:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eccc133f136c119b832cdf3c492983b1581d1f008b94b3419bcd7ef025043cd2
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Penyiapan terpandu yang menetapkan inferensi terlebih dahulu: penyiapan ini mendeteksi akses AI yang sudah ada,
mewajibkan penyelesaian langsung, hanya menyimpan rute yang berfungsi, lalu memulai
OpenClaw untuk mengonfigurasi sisanya. `openclaw setup` membuka alur ini pada sistem
baru atau setiap kali opsi orientasi tersedia; sistem yang telah dikonfigurasi menggunakan
`openclaw setup` tanpa argumen untuk obrolan agen sistem. `openclaw setup --baseline` hanya
menulis konfigurasi/ruang kerja dasar.

<CardGroup cols={2}>
  <Card title="Pusat orientasi CLI" href="/id/start/wizard" icon="rocket">
    Panduan langkah demi langkah untuk alur CLI interaktif.
  </Card>
  <Card title="Ikhtisar orientasi" href="/id/start/onboarding-overview" icon="map">
    Cara seluruh bagian orientasi OpenClaw bekerja bersama.
  </Card>
  <Card title="Referensi penyiapan CLI" href="/id/start/wizard-cli-reference" icon="book">
    Keluaran, cara kerja internal, dan perilaku setiap langkah.
  </Card>
  <Card title="Otomatisasi CLI" href="/id/start/wizard-cli-automation" icon="terminal">
    Flag noninteraktif dan penyiapan berskrip.
  </Card>
  <Card title="Orientasi aplikasi macOS" href="/id/start/onboarding" icon="apple">
    Alur orientasi untuk aplikasi bilah menu macOS.
  </Card>
</CardGroup>

## Contoh

```bash
openclaw onboard
openclaw onboard --tui
openclaw onboard --classic
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard recommendations --json
openclaw onboard recommendations acknowledge
openclaw onboard recommendations acknowledge --retry "<failed-id>"
openclaw onboard recommendations refresh
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`openclaw onboard recommendations` membaca kecocokan rekomendasi aplikasi yang tertunda
dan disimpan selama orientasi. Tambahkan `--json` untuk daftar yang dapat dibaca mesin dan digunakan oleh
bootstrap saat pertama kali dijalankan. Perintah ini tidak memindai ulang aplikasi yang terinstal atau memanggil
model. Keluarannya hanya memuat ID instalasi yang telah divalidasi, sumber, dan tingkat; keluaran ini
sengaja tidak menyertakan teks marketplace yang tidak tepercaya, alasan model, dan label aplikasi
lokal. Setelah penawaran rekomendasi dijawab, perintah mengembalikan
daftar kosong dan orientasi berikutnya melewati langkah tersebut sepenuhnya.
`openclaw onboard recommendations refresh` menghapus penawaran yang tersimpan agar proses
orientasi berikutnya memindai ulang aplikasi yang terinstal dan membuat penawaran baru.

Ruang kerja baru menunda pilihan rekomendasi hingga percakapan bootstrap.
Setelah percakapan tersebut menangani pilihan pengguna,
`openclaw onboard recommendations acknowledge` menandai penawaran yang tersimpan sebagai telah dijawab.
Konfirmasi ini bersifat idempoten. Jika instalasi yang dipilih gagal, teruskan setiap
ID buram yang gagal dengan `--retry <id...>`; kecocokan yang berhasil dan ditolak akan dikonsumsi,
sedangkan kecocokan yang gagal tetap tertunda untuk orientasi berikutnya. ID yang tidak dikenal
menyebabkan kegagalan tanpa mengubah penawaran yang tersimpan. Setelah instalasi skill ClawHub
terputus, target yang sudah ada hanya dianggap berhasil jika
`openclaw skills verify "@owner/slug"` berhasil untuk ID rekomendasi yang sama
dan berkualifikasi penerbit, serta keluaran JSON-nya melaporkan
`openclaw.resolution.source: "installed"`. Verifikasi registri saja bukan
bukti instalasi lokal. Jika tidak, biarkan ID tersebut tertunda dengan `--retry` dan jangan
timpa skill yang sudah ada.

- `--classic`: membuka wizard lengkap langkah demi langkah. Opsi ini tidak dapat digabungkan dengan
  `--non-interactive`; hilangkan `--classic` untuk penyiapan otomatis.
- `--flow quickstart`: membuka wizard klasik dengan prompt minimal dan
  membuat token Gateway secara otomatis.
- `--flow manual` (alias `advanced`): membuka wizard klasik dengan prompt lengkap
  untuk port, pengikatan, dan autentikasi.
- `--flow import`: menjalankan penyedia migrasi yang terdeteksi (misalnya Hermes melalui `--import-from hermes`), menampilkan pratinjau rencana, lalu menerapkannya setelah konfirmasi. Impor hanya dijalankan pada penyiapan OpenClaw baru—atur ulang konfigurasi, kredensial, sesi, dan status ruang kerja terlebih dahulu jika salah satunya sudah ada. Gunakan [`openclaw migrate`](/id/cli/migrate) untuk rencana uji coba, mode penimpaan, laporan, dan pemetaan yang tepat.
- `--remote-url` dan `--remote-token`: mengisi terlebih dahulu langkah Gateway jarak jauh klasik dan mengganti nilai jarak jauh yang tersimpan untuk proses ini. Mengubah URL tidak menggunakan kembali kredensial yang tersimpan kecuali jika Anda juga memberikan token. Token tetap disamarkan dalam prompt dan mengikuti pilihan penyimpanan teks biasa atau SecretRef yang sudah ada pada wizard.
- `--tailscale-reset-on-exit` dan `--no-tailscale-reset-on-exit`: secara eksplisit mengontrol apakah konfigurasi Tailscale Serve atau Funnel diatur ulang saat Gateway berhenti. Menghilangkan keduanya akan mempertahankan pengaturan saat ini selama proses ulang noninteraktif.
- `--modern` adalah alias kompatibilitas untuk asisten penyiapan percakapan OpenClaw.
  Opsi ini menggunakan gerbang inferensi langsung yang sama dengan `openclaw setup` dan
  hanya menerima `--workspace`, `--accept-risk`,
  `--non-interactive`, dan `--json`. Flag penyiapan lainnya ditolak, bukan
  diabaikan secara diam-diam.

## Alur terpandu

`openclaw onboard` tanpa argumen memulai alur terpandu. Alur ini menampilkan pemberitahuan keamanan,
lalu mengajukan satu pertanyaan di awal: **akses penuh** (disarankan—penyiapan mencari
aplikasi AI, kunci, dan runtime lokal secara otomatis) atau **tanyakan dahulu** (penyiapan bertanya
sekali sebelum memeriksa sistem, atau memungkinkan Anda mengonfigurasi secara manual). Pilihan
tersebut disimpan sebagai `wizard.accessMode`. Jika penemuan diizinkan, orientasi
mendeteksi akses AI yang sudah tersedia melalui model yang dikonfigurasi, variabel lingkungan
kunci API, dan CLI lokal yang didukung, lalu menguji kandidat yang direkomendasikan
dengan penyelesaian nyata. Jika kandidat gagal, orientasi secara diam-diam
mencoba kandidat berikutnya yang dapat digunakan dan merangkum semua kandidat yang tidak merespons dalam
satu baris; rute yang berfungsi diumumkan dengan opsi satu penekanan tombol untuk melihat
semua pilihan lainnya.

Jika deteksi otomatis kehabisan pilihan, pemilih penyedia terlebih dahulu menampilkan OpenAI,
Anthropic, xAI (Grok), Google, dan OpenRouter. Pilih **Lainnya…** untuk setiap
penyedia lain yang didukung, yang dikelompokkan berdasarkan penyedia; wilayah, paket, dan metode autentikasi
kemudian muncul dalam menu kedua. Metode masuk melalui peramban atau perangkat yang didukung serta
metode kunci API atau token yang disamarkan menggunakan jalur penyelesaian langsung yang sama. OpenClaw hanya
menyimpan rute model yang terverifikasi dan kredensialnya setelah pengujian berhasil;
kandidat yang gagal tidak mengganti model yang dikonfigurasi atau menyimpan kredensial
yang dicoba. Pilih **Lewati untuk saat ini** untuk keluar tanpa memulai OpenClaw dan
jalankan kembali `openclaw onboard` saat Anda siap. Penyiapan ruang kerja dan Gateway tetap
tidak berubah hingga OpenClaw dimulai.

Dalam mode terpandu, `--workspace <dir>` menyediakan usulan ruang kerja OpenClaw
dan konteks inferensi yang terisolasi. Nilai tersebut tidak disimpan hingga Anda menyetujui
usulan penyiapan OpenClaw. Orientasi klasik dan noninteraktif menyimpan
ruang kerjanya melalui alur penyiapan normal masing-masing.

Setelah inferensi berhasil, orientasi memeriksa memori dari alat AI lokal yang didukung:
memori otomatis Claude Code, memori gabungan Codex, dan berkas memori
Hermes. Jika ditemukan, satu halaman menawarkan untuk menyalinnya ke ruang kerja agen
di bawah `memory/imports/` agar dapat diingat kembali melalui indeks. Tidak ada yang diimpor tanpa
konfirmasi, berkas yang telah diimpor sebelumnya akan dilewati, dan Anda selalu dapat mengimpor
nanti melalui [halaman impor Memori](/id/web/control-ui) di Control UI, yang menyediakan
cakupan khusus memori yang sama. (Proses lengkap [`openclaw migrate`](/id/cli/migrate)
memiliki cakupan lebih luas: proses tersebut juga dapat mengimpor konfigurasi, skill, dan kredensial.) Wizard
klasik menampilkan halaman yang sama setelah menyiapkan ruang kerja.

Setelah inferensi berhasil (dan penawaran impor memori), orientasi terpandu
menerapkan penyiapan standar secara otomatis—ruang kerja, Gateway, dan sesi,
rencana yang sama dengan yang akan diterapkan oleh obrolan percakapan `openclaw setup` saat menerima "ya"—
lalu menawarkan rekomendasi Plugin dan skill berdasarkan aplikasi yang terinstal; nama aplikasi
dicocokkan melalui model yang Anda konfigurasi dan pencarian ClawHub, dan langkah ini dapat
dinonaktifkan dengan [`wizard.appRecommendations`](/id/gateway/configuration-reference#wizard).
Dalam sesi desktop macOS, Linux, atau Windows, alur kemudian membuka dasbor
Control UI yang telah diautentikasi dan menunggu hingga 60 detik agar klien peramban
terhubung. Pada Linux tanpa antarmuka grafis atau melalui SSH, alur mencetak URL dasbor yang menonjol
dan dapat disalin-tempel, termasuk perintah penerusan port SSH untuk Gateway loopback,
lalu menunggu hingga lima menit. Koneksi yang berhasil dilanjutkan dalam peramban;
Gateway yang tidak dapat dijangkau atau batas waktu akan beralih ke jalur keluar terminal yang sama seperti
sebelumnya. Berikan `--tui` untuk melewati penyerahan ke peramban dan memaksa jalur keluar terminal tersebut.
Jika penerapan penyiapan gagal, orientasi beralih ke obrolan percakapan OpenClaw
untuk menyelesaikannya secara interaktif. Kanal, agen,
Plugin, dan fitur opsional lainnya tetap ditangani melalui obrolan OpenClaw: jalankan
`openclaw` dan gunakan `open channel wizard for <channel>` untuk menyerahkan pengumpulan
kredensial kanal kepada wizard terminal tersamarkan. Untuk mengubah penyedia
model atau autentikasinya, keluar dari OpenClaw dan jalankan `openclaw onboard`;
OpenClaw tidak membuka alur penyedia terpandu atau klasik.

Pada instalasi yang telah dikonfigurasi, menjalankan kembali `openclaw onboard` akan memverifikasi model
bawaan saat ini terlebih dahulu, sehingga alur yang sama bertindak sebagai proses verifikasi dan perbaikan—
alur ini tidak menerapkan ulang penyiapan, menginstal ulang, atau memulai ulang layanan Gateway.
Jika pemeriksaan tersebut gagal, model yang dikonfigurasi tidak pernah diganti secara otomatis—
orientasi berhenti dan menanyakan cara melanjutkan. Pemeriksaan berjalan di luar
ruang kerja Anda, sehingga model yang disediakan oleh Plugin ruang kerja dapat gagal di sini meskipun tetap
berfungsi di dalam agen.
Gunakan `openclaw onboard --classic` untuk autentikasi khusus penyedia, kanal, skill,
penyiapan Gateway jarak jauh, impor, atau kontrol Gateway lengkap. Untuk penyiapan dan
perbaikan noninferensi melalui percakapan, jalankan `openclaw setup`; `openclaw onboard
--modern` adalah alias kompatibilitas melalui gerbang inferensi yang sama. Wizard klasik
dapat secara opsional memverifikasi model bawaan dengan penyelesaian langsung, tetapi
OpenClaw tidak akan dimulai hingga pemeriksaan inferensi langsungnya sendiri berhasil.

Dalam terminal interaktif, `openclaw` tanpa argumen (tanpa subperintah) mengarahkan berdasarkan status
konfigurasi:

- Jika berkas konfigurasi aktif tidak ada atau tidak memiliki pengaturan buatan pengguna (kosong atau
  hanya metadata), alur akan memulai orientasi terpandu.
- Jika berkas konfigurasi ada tetapi gagal divalidasi, alur akan memulai jalur
  orientasi klasik dengan panduan `openclaw doctor`. OpenClaw memerlukan
  inferensi yang berfungsi dan tidak digunakan untuk memperbaiki kondisi prainferensi ini.
- Jika berkas konfigurasi valid, alur akan membuka TUI agen normal. Gateway terkonfigurasi yang
  dapat dijangkau serta memiliki agen dan model akan langsung membuka UI tersebut tanpa
  orientasi atau OpenClaw. Pada instalasi yang telah dikonfigurasi, akses OpenClaw dengan
  `/openclaw` di dalam TUI atau `openclaw setup`.

`ws://` teks biasa diterima untuk loopback, literal IP privat, `.local`, dan URL Gateway `*.ts.net` Tailnet. Untuk nama DNS privat tepercaya lainnya, tetapkan `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` di lingkungan proses orientasi.

## Atur ulang

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` menghapus status sebelum menjalankan penyiapan. `--reset-scope` mengontrol seberapa banyak yang dihapus: `config` (hanya konfigurasi), `config+creds+sessions` (bawaan ketika `--reset` diberikan tanpa cakupan), atau `full` (juga mengatur ulang ruang kerja). Pengaturan ulang ruang kerja hanya terjadi dengan `--reset-scope full`.

## Lokal

Orientasi interaktif menggunakan lokal wizard CLI untuk teks penyiapan tetap. Orientasi menggunakan nilai pertama yang tidak kosong dalam urutan berikut:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Bahasa Inggris sebagai cadangan

Lokal wizard yang didukung adalah `en`, `zh-CN`, dan `zh-TW`. Nilai lokal dapat menggunakan garis bawah atau bentuk sufiks POSIX seperti `zh_CN.UTF-8`. Nama produk, nama perintah, kunci konfigurasi, URL, ID penyedia, ID model, dan label Plugin/kanal tetap dipertahankan secara literal.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
OPENCLAW_LOCALE=en openclaw onboard # Penggantian eksplisit ke bahasa Inggris
```

## Penyiapan noninteraktif

`--non-interactive` memerlukan `--accept-risk` (mengakui bahwa agen sangat kuat dan akses sistem penuh berisiko). `--mode` secara default menggunakan `local`.

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` bersifat opsional; jika dihilangkan, proses onboarding memeriksa `CUSTOM_API_KEY` di lingkungan. OpenClaw secara otomatis menandai ID model penglihatan umum (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral, dan yang serupa) sebagai model yang mendukung gambar. Teruskan `--custom-image-input` untuk ID penglihatan kustom yang tidak dikenal, atau `--custom-text-input` untuk memaksakan metadata khusus teks. Gunakan `--custom-compatibility openai-responses` untuk endpoint yang kompatibel dengan OpenAI yang mendukung `/v1/responses` tetapi tidak mendukung `/v1/chat/completions`; nilai yang valid adalah `openai` (default), `openai-responses`, `anthropic`.

LM Studio juga memiliki flag kunci khusus penyedia:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Ollama noninteraktif:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` secara default menggunakan `http://127.0.0.1:11434`. `--custom-model-id` bersifat opsional; jika dihilangkan, proses onboarding menggunakan default yang disarankan Ollama. ID model cloud seperti `kimi-k2.5:cloud` juga berfungsi di sini.

Simpan kunci penyedia sebagai referensi, bukan sebagai teks biasa:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Dengan `--secret-input-mode ref`, proses onboarding menulis referensi yang didukung variabel lingkungan, bukan nilai kunci dalam teks biasa: untuk penyedia yang didukung profil autentikasi, proses ini menulis `keyRef: { source: "env", provider: "default", id: <envVar> }`; untuk penyedia kustom, proses ini menulis `models.providers.<id>.apiKey` dengan cara yang sama (misalnya `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`). Kontrak: tetapkan variabel lingkungan penyedia di lingkungan proses onboarding (misalnya `OPENAI_API_KEY`) dan jangan sekaligus meneruskan flag kunci sebaris kecuali variabel lingkungan tersebut telah ditetapkan—nilai flag tanpa variabel lingkungan yang sesuai akan segera gagal disertai panduan.

### Autentikasi Gateway (noninteraktif)

- `--gateway-auth token --gateway-token <token>` menyimpan token dalam teks biasa. `token` adalah mode autentikasi default.
- `--gateway-auth token --gateway-token-ref-env <name>` menyimpan `gateway.auth.token` sebagai SecretRef variabel lingkungan. Memerlukan variabel lingkungan yang tidak kosong dengan nama tersebut di lingkungan proses onboarding.
- `--gateway-token` dan `--gateway-token-ref-env` tidak dapat digunakan bersamaan.
- Dengan `--install-daemon`: `gateway.auth.token` yang dikelola SecretRef divalidasi, tetapi tidak dipertahankan sebagai teks biasa yang telah diuraikan dalam metadata lingkungan layanan supervisor; jika referensinya tidak dapat diuraikan, instalasi akan gagal secara tertutup disertai panduan perbaikan. Jika `gateway.auth.token` dan `gateway.auth.password` dikonfigurasi sekaligus dan `gateway.auth.mode` tidak ditetapkan, instalasi diblokir hingga mode ditetapkan secara eksplisit.
- Onboarding lokal menulis `gateway.mode="local"` ke dalam konfigurasi. Jika kemudian file konfigurasi tidak memiliki `gateway.mode`, hal itu menunjukkan kerusakan konfigurasi atau pengeditan manual yang tidak lengkap, bukan pintasan mode lokal yang valid.
- Onboarding lokal menginstal plugin yang dapat diunduh dan diperlukan oleh jalur penyiapan yang dipilih (misalnya plugin runtime Codex atau Copilot untuk pilihan autentikasi tersebut). Onboarding jarak jauh hanya menulis informasi koneksi untuk Gateway jarak jauh—proses ini tidak pernah menginstal paket plugin lokal.
- `--allow-unconfigured` adalah jalan keluar `openclaw gateway run` yang terpisah; opsi ini tidak memungkinkan onboarding melewati `gateway.mode`.

```bash
export OPENAI_API_KEY="your-provider-key"
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

### Kesehatan Gateway lokal

- Kecuali Anda meneruskan `--skip-health`, proses onboarding menunggu Gateway lokal dapat dijangkau sebelum berhasil keluar.
- `--install-daemon` terlebih dahulu memulai jalur instalasi Gateway terkelola. Tanpa opsi ini, Gateway lokal harus sudah berjalan (misalnya `openclaw gateway run`).
- `--skip-health` melewati penantian jika Anda hanya menginginkan penulisan konfigurasi/ruang kerja/bootstrap dalam otomatisasi.
- `--skip-bootstrap` menetapkan `agents.defaults.skipBootstrap: true` dan melewati pembuatan `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, dan `BOOTSTRAP.md`.
- Pada Windows native, `--install-daemon` mencoba Scheduled Tasks terlebih dahulu dan beralih ke item login folder Startup per pengguna jika pembuatan tugas ditolak.

### Mode referensi interaktif

- Pilih **Use secret reference** saat diminta, lalu pilih **Environment variable** atau penyedia rahasia yang dikonfigurasi (`file` atau `exec`).
- Proses onboarding menjalankan validasi prapemeriksaan cepat sebelum menyimpan referensi dan memungkinkan Anda mencoba lagi jika gagal.

### Pilihan endpoint Z.AI

<Note>
`--auth-choice zai-api-key` secara otomatis mendeteksi endpoint dan model Z.AI terbaik untuk kunci Anda: endpoint Coding Plan mengutamakan `zai/glm-5.2` (beralih ke `glm-5.1` jika tidak tersedia); endpoint API umum secara default menggunakan `zai/glm-5.1`. Untuk memaksakan endpoint Coding Plan, pilih langsung `zai-coding-global` atau `zai-coding-cn`.
</Note>

```bash
# Pemilihan endpoint tanpa perintah interaktif
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Pilihan endpoint Z.AI lainnya: zai-coding-cn, zai-global, zai-cn
```

Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Flag noninteraktif tambahan

Autentikasi model berbasis token (digunakan dengan `--auth-choice token`):

| Flag                            | Deskripsi                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | ID penyedia token yang menerbitkan token                                                                                         |
| `--token <token>`               | Nilai token untuk autentikasi model                                                                                        |
| `--token-profile-id <id>`       | ID profil autentikasi (default `<provider>:manual`; beberapa alur milik penyedia menggunakan defaultnya sendiri, seperti `anthropic:default`) |
| `--token-expires-in <duration>` | Durasi kedaluwarsa token opsional (misalnya `365d`, `12h`)                                                                         |

Cloudflare AI Gateway: `--cloudflare-ai-gateway-account-id <id>`, `--cloudflare-ai-gateway-gateway-id <id>`.

Kontrol instalasi daemon: `--no-install-daemon` / `--skip-daemon` (alias; melewati instalasi layanan Gateway), `--daemon-runtime <node>`.

Skills: `--node-manager <npm|pnpm|bun>` (default `npm`), `--skip-skills`.

Penyiapan UI dan hook: `--skip-ui` (melewati perintah Control UI/TUI), `--skip-hooks` (melewati penyiapan webhook/hook), `--skip-channels`, `--skip-search`.

Keluaran: `--suppress-gateway-token-output` menyembunyikan keluaran Gateway/UI yang memuat token (petunjuk token, URL login otomatis dengan token tertanam, dan peluncuran Control UI secara otomatis)—berguna di terminal bersama dan CI.

<Note>
`--json` tidak menyiratkan mode noninteraktif dalam onboarding terpandu atau klasik.
Dengan `--modern`, JSON merupakan ikhtisar OpenClaw sekali jalan dan keluar setelah
satu hasil tersebut. Gunakan `--non-interactive` untuk skrip lain.
</Note>

## Prapemfilteran penyedia

Saat pilihan autentikasi menyiratkan penyedia yang diutamakan, proses onboarding terlebih dahulu memfilter pemilih model default dan daftar izin agar hanya menampilkan model penyedia tersebut. Filter ini juga mencocokkan penyedia lain yang dimiliki plugin yang sama, sehingga mencakup varian coding-plan seperti `volcengine`/`volcengine-plan` dan `byteplus`/`byteplus-plan`. Jika filter penyedia yang diutamakan tidak menghasilkan model yang dimuat, proses onboarding kembali menggunakan katalog tanpa filter alih-alih membiarkan pemilih kosong.

## Tindak lanjut pencarian web

Beberapa penyedia pencarian web memicu perintah tindak lanjut khusus penyedia selama onboarding:

- **Grok** dapat menawarkan penyiapan `x_search` opsional dengan autentikasi xAI yang sama dan pilihan model `x_search`.
- **Kimi** dapat meminta wilayah API Moonshot (`api.moonshot.ai` atau `api.moonshot.cn`) dan model pencarian web Kimi default.

## Perilaku lainnya

- Perilaku cakupan DM onboarding lokal: [Referensi penyiapan CLI](/id/start/wizard-cli-reference#outputs-and-internals).
- Obrolan pertama tercepat: `openclaw dashboard` (Control UI, tanpa penyiapan kanal).
- Penyedia kustom: hubungkan endpoint apa pun yang kompatibel dengan OpenAI atau Anthropic, termasuk penyedia terhosting yang tidak tercantum. Gunakan kompatibilitas **Unknown** untuk melakukan deteksi otomatis melalui pemeriksaan langsung.
- Jika status Hermes terdeteksi, proses onboarding menawarkan alur migrasi (lihat `--flow import` di atas).

## Perintah tindak lanjut umum

Gunakan `openclaw configure` nanti untuk perubahan tertarget yang tidak melibatkan inferensi dan `openclaw
channels add` untuk penyiapan khusus kanal. Untuk perubahan penyedia model atau rute autentikasi,
jalankan `openclaw onboard` sebagai gantinya.

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
