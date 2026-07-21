---
read_when:
    - Anda ingin menyiapkan inferensi, lalu menyelesaikan penyiapan dengan OpenClaw
summary: Referensi CLI untuk `openclaw onboard` (orientasi interaktif)
title: Orientasi Awal
x-i18n:
    generated_at: "2026-07-21T12:41:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 778fc7bc688ec5fd1304f2107306a92188cfdbb61f6e83e3935d03dd40224119
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Penyiapan terpandu yang terlebih dahulu memastikan inferensi: proses ini mendeteksi akses AI yang ada,
mewajibkan penyelesaian langsung, hanya menyimpan rute yang berfungsi, lalu memulai
OpenClaw untuk mengonfigurasi sisanya. `openclaw setup` mengakses alur ini pada sistem
baru atau setiap kali tersedia opsi orientasi; sistem yang telah dikonfigurasi menggunakan
`openclaw setup` tanpa argumen untuk obrolan agen sistem. `openclaw setup --baseline` hanya
menulis konfigurasi dan ruang kerja dasar.

<CardGroup cols={2}>
  <Card title="Pusat orientasi CLI" href="/id/start/wizard" icon="rocket">
    Panduan langkah demi langkah untuk alur CLI interaktif.
  </Card>
  <Card title="Ikhtisar orientasi" href="/id/start/onboarding-overview" icon="map">
    Cara seluruh bagian orientasi OpenClaw bekerja bersama.
  </Card>
  <Card title="Referensi penyiapan CLI" href="/id/start/wizard-cli-reference" icon="book">
    Keluaran, mekanisme internal, dan perilaku setiap langkah.
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

`openclaw onboard recommendations` membaca kecocokan rekomendasi aplikasi tertunda
yang disimpan selama orientasi. Tambahkan `--json` untuk daftar yang dapat dibaca mesin dan digunakan oleh
bootstrap saat pertama kali dijalankan. Perintah ini tidak memindai ulang aplikasi yang terinstal atau memanggil
model. Keluarannya hanya berisi ID instalasi yang telah divalidasi, sumber, dan tingkat; keluaran ini
sengaja tidak menyertakan prosa marketplace yang tidak tepercaya, alasan model, dan label aplikasi
lokal. Setelah tawaran rekomendasi dijawab, perintah mengembalikan
daftar kosong dan proses orientasi berikutnya melewati langkah ini sepenuhnya.
`openclaw onboard recommendations refresh` menghapus tawaran yang tersimpan agar proses
orientasi berikutnya memindai ulang aplikasi yang terinstal dan membuat tawaran baru.

Ruang kerja baru menunda pilihan rekomendasi hingga percakapan bootstrap.
Setelah percakapan tersebut menangani pilihan pengguna,
`openclaw onboard recommendations acknowledge` menandai tawaran yang tersimpan sebagai telah dijawab.
Konfirmasi penerimaan bersifat idempoten. Jika instalasi yang dipilih gagal, teruskan setiap
ID opak yang gagal dengan `--retry <id...>`; kecocokan yang berhasil dan ditolak akan digunakan,
sedangkan kecocokan yang gagal tetap tertunda untuk proses orientasi berikutnya. ID yang tidak dikenal
menyebabkan kegagalan tanpa mengubah tawaran yang tersimpan. Setelah instalasi Skills ClawHub
terhenti, target yang sudah ada hanya dianggap berhasil jika
`openclaw skills verify "@owner/slug"` berhasil untuk
ID rekomendasi yang sama dan berkualifikasi penerbit, serta keluaran JSON-nya melaporkan
`openclaw.resolution.source: "installed"`. Verifikasi registri saja bukan
bukti instalasi lokal. Jika tidak, biarkan ID tersebut tertunda dengan `--retry` dan jangan
menimpa Skills yang sudah ada.

- `--classic`: membuka wizard lengkap langkah demi langkah. Opsi ini tidak dapat digabungkan dengan
  `--non-interactive`; hilangkan `--classic` untuk penyiapan otomatis.
- `--flow quickstart`: membuka wizard klasik dengan prompt minimal dan
  secara otomatis menghasilkan token gateway.
- `--flow manual` (alias `advanced`): membuka wizard klasik dengan prompt lengkap
  untuk port, pengikatan, dan autentikasi.
- `--flow import`: menjalankan penyedia migrasi yang terdeteksi (misalnya Hermes melalui `--import-from hermes`), menampilkan pratinjau rencana, lalu menerapkannya setelah konfirmasi. Saat impor interaktif menyediakan model default, orientasi mewajibkan rute tersebut berhasil menyelesaikan penyelesaian langsung sebelum melewati penyiapan penyedia; rute impor yang gagal akan kembali ke konfigurasi penyedia. Impor hanya dijalankan pada penyiapan OpenClaw baru—atur ulang konfigurasi, kredensial, sesi, dan status ruang kerja terlebih dahulu jika salah satunya sudah ada. Gunakan [`openclaw migrate`](/id/cli/migrate) untuk rencana uji coba, mode penimpaan, laporan, dan pemetaan yang tepat.
- `--remote-url` dan `--remote-token`: mengisi terlebih dahulu langkah Gateway jarak jauh klasik dan mengganti nilai jarak jauh yang tersimpan untuk proses ini. Mengubah URL tidak menggunakan kembali kredensial yang tersimpan kecuali Anda juga meneruskan token. Token tetap disamarkan dalam prompt dan mengikuti pilihan penyimpanan teks biasa atau SecretRef yang sudah ada pada wizard.
- `--tailscale-reset-on-exit` dan `--no-tailscale-reset-on-exit`: secara eksplisit mengontrol apakah konfigurasi Tailscale Serve atau Funnel diatur ulang saat Gateway berhenti. Menghilangkan keduanya akan mempertahankan pengaturan saat ini selama proses noninteraktif dijalankan ulang.
- `--modern` adalah alias kompatibilitas untuk asisten penyiapan percakapan OpenClaw.
  Alias ini menggunakan gerbang inferensi langsung yang sama seperti `openclaw setup` dan
  hanya menerima `--workspace`, `--accept-risk`,
  `--non-interactive`, dan `--json`. Flag penyiapan lain ditolak, bukan
  diabaikan secara diam-diam.

## Alur terpandu

`openclaw onboard` tanpa argumen memulai alur terpandu. Alur ini menampilkan pemberitahuan keamanan,
lalu langsung mengajukan satu pertanyaan: **akses penuh** (disarankan—penyiapan secara otomatis mencari
aplikasi AI, kunci, dan runtime lokal) atau **tanya dahulu** (penyiapan bertanya
sekali sebelum memeriksa sistem, atau memungkinkan Anda mengonfigurasi secara manual). Pilihan tersebut
disimpan sebagai `wizard.accessMode`. Jika penemuan diizinkan, orientasi
mendeteksi akses AI yang sudah tersedia melalui model yang dikonfigurasi, variabel lingkungan
kunci API, dan CLI lokal yang didukung, lalu menguji kandidat yang direkomendasikan
dengan penyelesaian nyata. Jika kandidat gagal, orientasi secara diam-diam
mencoba kandidat berikutnya yang dapat digunakan dan merangkum semua kandidat yang tidak merespons dalam
satu baris; rute yang berfungsi diumumkan dengan opsi satu kali tekan tombol untuk melihat
semua pilihan lain.

Jika deteksi otomatis telah mencoba semua opsi, pemilih penyedia menampilkan OpenAI,
Anthropic, xAI (Grok), Google, dan OpenRouter terlebih dahulu. Pilih **Lainnya…** untuk setiap
penyedia lain yang didukung, yang dikelompokkan berdasarkan penyedia; wilayah, paket, dan metode autentikasi
kemudian muncul di menu kedua. Proses masuk melalui browser atau perangkat yang didukung dan metode
kunci API atau token yang disamarkan menggunakan jalur penyelesaian langsung yang sama. OpenClaw hanya
menyimpan rute model yang telah diverifikasi dan kredensialnya setelah pengujian berhasil;
kandidat yang gagal tidak mengganti model yang dikonfigurasi atau menyimpan kredensial
yang dicoba. Pilih **Lewati untuk saat ini** untuk keluar tanpa memulai OpenClaw dan
jalankan kembali `openclaw onboard` saat Anda siap. Penyiapan ruang kerja dan Gateway tetap
tidak berubah hingga OpenClaw dimulai.

Dalam mode terpandu, `--workspace <dir>` menyediakan ruang kerja yang diusulkan OpenClaw
dan konteks inferensi yang terisolasi. Nilai ini tidak disimpan hingga Anda menyetujui
usulan penyiapan OpenClaw. Orientasi klasik dan noninteraktif menyimpan
ruang kerjanya melalui alur penyiapan normal masing-masing. Saat dijalankan ulang dengan daftar agen
yang sudah ada, orientasi mempertahankan ruang kerja armada yang dikonfigurasi: wizard klasik
menampilkan kedua jalur dan mewajibkan konfirmasi eksplisit sebelum memindahkannya,
sedangkan penyiapan noninteraktif menampilkan peringatan dan mempertahankan nilai saat ini.

Setelah inferensi berhasil, orientasi memeriksa memori dari alat AI lokal
yang didukung: memori otomatis Claude Code, memori terkonsolidasi Codex, dan berkas memori
Hermes. Jika ditemukan, satu halaman menawarkan untuk menyalinnya ke ruang kerja agen
di bawah `memory/imports/` agar dapat diingat kembali melalui indeks. Tidak ada yang diimpor tanpa
konfirmasi, berkas yang sebelumnya telah diimpor akan dilewati, dan Anda selalu dapat mengimpornya
nanti dari [halaman impor Memori](/id/web/control-ui) di Control UI, yang menawarkan
cakupan khusus memori yang sama. (Proses [`openclaw migrate`](/id/cli/migrate) lengkap memiliki
cakupan lebih luas: proses tersebut juga dapat mengimpor konfigurasi, Skills, dan kredensial.) Wizard
klasik menampilkan halaman yang sama setelah menyiapkan ruang kerja.

Setelah inferensi berhasil (dan tawaran impor memori), orientasi terpandu
menerapkan penyiapan standar secara otomatis—ruang kerja, Gateway, dan sesi,
yaitu rencana yang sama dengan yang akan diterapkan obrolan percakapan `openclaw setup` saat menjawab "ya"—
lalu menawarkan rekomendasi Plugin dan Skills berdasarkan aplikasi yang terinstal; nama aplikasi
dicocokkan melalui model yang Anda konfigurasi dan pencarian ClawHub, dan langkah ini dapat
dinonaktifkan dengan [`wizard.appRecommendations`](/id/gateway/configuration-reference#wizard).
Dalam sesi desktop macOS, Linux, atau Windows, orientasi kemudian membuka dasbor
Control UI yang telah diautentikasi dan menunggu hingga 60 detik agar klien browser
terhubung. Pada Linux tanpa antarmuka grafis atau melalui SSH, orientasi mencetak URL dasbor
yang jelas dan dapat disalin-tempel, termasuk perintah penerusan port SSH untuk Gateway loopback,
dan menunggu hingga lima menit. Koneksi yang berhasil dilanjutkan di browser;
Gateway yang tidak dapat dijangkau atau batas waktu akan kembali ke jalur keluar terminal yang sama seperti
sebelumnya. Teruskan `--tui` untuk melewati pengalihan ke browser dan memaksa penggunaan jalur keluar terminal tersebut.
Jika penerapan penyiapan gagal, orientasi kembali ke obrolan percakapan OpenClaw
untuk menyelesaikannya secara interaktif. Kanal, agen,
Plugin, dan fitur opsional lainnya tetap ditangani melalui obrolan OpenClaw: jalankan
`openclaw` dan gunakan `open channel wizard for <channel>` untuk menyerahkan pengumpulan
kredensial kanal kepada wizard terminal yang disamarkan. Untuk mengubah penyedia
model atau autentikasinya, keluar dari OpenClaw dan jalankan `openclaw onboard`;
OpenClaw tidak membuka alur penyedia terpandu atau klasik.

Pada instalasi yang telah dikonfigurasi, menjalankan `openclaw onboard` lagi akan memverifikasi
model default saat ini terlebih dahulu, sehingga alur yang sama berfungsi sebagai proses verifikasi dan perbaikan—
alur ini tidak menerapkan ulang penyiapan, menginstal ulang, atau memulai ulang layanan Gateway.
Jika pemeriksaan tersebut gagal, model yang dikonfigurasi tidak pernah diganti secara otomatis—
orientasi berhenti dan menanyakan cara melanjutkan. Pemeriksaan dijalankan di luar
ruang kerja Anda, sehingga model yang disediakan oleh Plugin ruang kerja dapat gagal di sini meskipun tetap
berfungsi di agen.
Gunakan `openclaw onboard --classic` untuk autentikasi khusus penyedia, kanal, Skills,
penyiapan Gateway jarak jauh, impor, atau kontrol Gateway lengkap. Untuk
penyiapan dan perbaikan noninferensi berbasis percakapan, jalankan `openclaw setup`; `openclaw onboard
--modern` adalah alias kompatibilitas melalui gerbang inferensi yang sama. Wizard
klasik dapat secara opsional memverifikasi model default dengan penyelesaian langsung, tetapi
OpenClaw tidak akan dimulai hingga pemeriksaan inferensi langsungnya sendiri berhasil.

Dalam terminal interaktif, `openclaw` tanpa argumen (tanpa subperintah) merutekan berdasarkan status
konfigurasi:

- Jika berkas konfigurasi aktif tidak ada atau tidak memiliki pengaturan yang dibuat (kosong atau
  hanya berisi metadata), orientasi terpandu akan dimulai.
- Jika berkas konfigurasi ada tetapi gagal divalidasi, jalur orientasi
  klasik akan dimulai dengan panduan `openclaw doctor`. OpenClaw memerlukan
  inferensi yang berfungsi dan tidak digunakan untuk memperbaiki status prainferensi ini.
- Jika berkas konfigurasi valid, TUI agen normal akan dibuka. Gateway
  terkonfigurasi yang dapat dijangkau serta memiliki agen dan model akan langsung membuka UI tersebut tanpa
  orientasi atau OpenClaw. Pada instalasi yang telah dikonfigurasi, akses OpenClaw dengan
  `/openclaw` di dalam TUI atau `openclaw setup`.

`ws://` teks biasa diterima untuk loopback, literal IP privat, `.local`, dan URL gateway `*.ts.net` Tailnet. Untuk nama DNS privat tepercaya lainnya, tetapkan `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` di lingkungan proses orientasi.

## Atur ulang

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` menghapus status sebelum menjalankan penyiapan. `--reset-scope` mengontrol seberapa banyak yang dihapus: `config` (hanya konfigurasi), `config+creds+sessions` (default saat `--reset` diteruskan tanpa cakupan), atau `full` (juga mengatur ulang ruang kerja). Pengaturan ulang ruang kerja hanya dilakukan dengan `--reset-scope full`.

## Lokal

Orientasi interaktif menggunakan lokal wizard CLI untuk teks penyiapan tetap. Orientasi menggunakan nilai pertama yang tidak kosong dalam urutan berikut:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Fallback bahasa Inggris

Lokal wizard yang didukung adalah `en`, `zh-CN`, dan `zh-TW`. Nilai lokal dapat menggunakan bentuk garis bawah atau akhiran POSIX seperti `zh_CN.UTF-8`. Nama produk, nama perintah, kunci konfigurasi, URL, ID penyedia, ID model, serta label plugin/saluran tetap dipertahankan secara literal.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
OPENCLAW_LOCALE=en openclaw onboard # Penggantian eksplisit ke bahasa Inggris
```

## Penyiapan noninteraktif

`--non-interactive` memerlukan `--accept-risk` (menyatakan pemahaman bahwa agen sangat canggih dan akses sistem penuh berisiko). `--mode` secara default bernilai `local`.

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

`--custom-api-key` bersifat opsional; jika dihilangkan, onboarding memeriksa `CUSTOM_API_KEY` di lingkungan. OpenClaw secara otomatis menandai ID model visi umum (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral, dan yang serupa) sebagai model yang mendukung gambar. Teruskan `--custom-image-input` untuk ID visi kustom yang tidak dikenal, atau `--custom-text-input` untuk memaksakan metadata khusus teks. Gunakan `--custom-compatibility openai-responses` untuk endpoint yang kompatibel dengan OpenAI dan mendukung `/v1/responses`, tetapi tidak mendukung `/v1/chat/completions`; nilai yang valid adalah `openai` (default), `openai-responses`, `anthropic`.

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

`--custom-base-url` secara default bernilai `http://127.0.0.1:11434`. `--custom-model-id` bersifat opsional; jika dihilangkan, onboarding menggunakan default yang disarankan Ollama. ID model cloud seperti `kimi-k2.5:cloud` juga dapat digunakan di sini.

Simpan kunci penyedia sebagai referensi, bukan teks biasa:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Dengan `--secret-input-mode ref`, onboarding menulis referensi yang didukung variabel lingkungan, bukan nilai kunci dalam teks biasa: untuk penyedia yang didukung profil autentikasi, tindakan ini menulis `keyRef: { source: "env", provider: "default", id: <envVar> }`; untuk penyedia kustom, tindakan ini menulis `models.providers.<id>.apiKey` dengan cara yang sama (misalnya `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`). Kontrak: tetapkan variabel lingkungan penyedia dalam lingkungan proses onboarding (misalnya `OPENAI_API_KEY`) dan jangan turut meneruskan flag kunci inline kecuali variabel lingkungan tersebut telah ditetapkan—nilai flag tanpa variabel lingkungan yang sesuai akan langsung gagal dengan panduan.

### Autentikasi Gateway (noninteraktif)

- `--gateway-auth token --gateway-token <token>` menyimpan token dalam teks biasa. `token` adalah mode autentikasi default.
- `--gateway-auth token --gateway-token-ref-env <name>` menyimpan `gateway.auth.token` sebagai SecretRef lingkungan. Memerlukan variabel lingkungan tidak kosong dengan nama tersebut dalam lingkungan proses onboarding.
- `--gateway-token` dan `--gateway-token-ref-env` tidak dapat digunakan bersamaan.
- Dengan `--install-daemon`: `gateway.auth.token` yang dikelola SecretRef divalidasi, tetapi tidak disimpan sebagai teks biasa yang telah diselesaikan dalam metadata lingkungan layanan supervisor; jika referensi tidak dapat diselesaikan, instalasi akan ditutup secara aman dan gagal disertai panduan perbaikan. Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum ditetapkan, instalasi diblokir hingga mode ditetapkan secara eksplisit.
- Onboarding lokal menulis `gateway.mode="local"` ke dalam konfigurasi. Jika berkas konfigurasi selanjutnya tidak memiliki `gateway.mode`, hal tersebut menunjukkan kerusakan konfigurasi atau pengeditan manual yang tidak lengkap, bukan pintasan mode lokal yang valid.
- Onboarding lokal menginstal plugin yang dapat diunduh dan diperlukan oleh jalur penyiapan yang dipilih (misalnya plugin runtime Codex atau Copilot untuk pilihan autentikasi tersebut). Onboarding jarak jauh hanya menulis informasi koneksi untuk Gateway jarak jauh—onboarding ini tidak pernah menginstal paket plugin lokal.
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

### Kesehatan gateway lokal

- Kecuali Anda meneruskan `--skip-health`, onboarding menunggu hingga gateway lokal dapat dijangkau sebelum berhasil keluar.
- `--install-daemon` terlebih dahulu memulai jalur instalasi gateway terkelola. Tanpa opsi ini, gateway lokal harus sudah berjalan (misalnya `openclaw gateway run`).
- `--skip-health` melewati penantian jika dalam otomatisasi Anda hanya menginginkan penulisan konfigurasi/ruang kerja/bootstrap.
- `--skip-bootstrap` menetapkan `agents.defaults.skipBootstrap: true` dan melewati pembuatan `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, dan `BOOTSTRAP.md`.
- Pada Windows native, `--install-daemon` terlebih dahulu mencoba Scheduled Tasks dan beralih ke item login folder Startup per pengguna jika pembuatan tugas ditolak.

### Mode referensi interaktif

- Pilih **Gunakan referensi rahasia** ketika diminta, lalu pilih **Variabel lingkungan** atau penyedia rahasia yang telah dikonfigurasi (`file` atau `exec`).
- Onboarding menjalankan validasi prapemeriksaan cepat sebelum menyimpan referensi dan memungkinkan Anda mencoba lagi jika gagal.

### Pilihan endpoint Z.AI

<Note>
`--auth-choice zai-api-key` secara otomatis mendeteksi endpoint dan model Z.AI terbaik untuk kunci Anda: endpoint Coding Plan memprioritaskan `zai/glm-5.2` (beralih ke `glm-5.1` jika tidak tersedia); endpoint API umum secara default menggunakan `zai/glm-5.1`. Untuk memaksakan endpoint Coding Plan, pilih langsung `zai-coding-global` atau `zai-coding-cn`.
</Note>

```bash
# Pemilihan endpoint tanpa prompt
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

Kontrol instalasi daemon: `--no-install-daemon` / `--skip-daemon` (alias; melewati instalasi layanan gateway), `--daemon-runtime <node>`.

Skills: `--node-manager <npm|pnpm|bun>` (default `npm`), `--skip-skills`.

Penyiapan UI dan hook: `--skip-ui` (melewati prompt Control UI/TUI), `--skip-hooks` (melewati penyiapan webhook/hook), `--skip-channels`, `--skip-search`.

Output: `--suppress-gateway-token-output` menyembunyikan output Gateway/UI yang memuat token (petunjuk token, URL login otomatis dengan token yang disematkan, dan peluncuran Control UI secara otomatis)—berguna di terminal bersama dan CI.

<Note>
`--json` tidak menyiratkan mode noninteraktif dalam onboarding terpandu atau klasik.
Dengan `--modern`, JSON merupakan ikhtisar OpenClaw sekali jalan dan proses keluar setelah
satu hasil tersebut. Gunakan `--non-interactive` untuk skrip lainnya.
</Note>

## Prapemfilteran penyedia

Ketika pilihan autentikasi menyiratkan penyedia yang diprioritaskan, onboarding melakukan prapemfilteran pada pemilih model default dan daftar yang diizinkan agar hanya menampilkan model penyedia tersebut. Filter juga mencocokkan penyedia lain yang dimiliki oleh plugin yang sama, yang mencakup varian coding-plan seperti `volcengine`/`volcengine-plan` dan `byteplus`/`byteplus-plan`. Jika filter penyedia yang diprioritaskan tidak menghasilkan model yang dimuat, onboarding beralih ke katalog tanpa filter agar pemilih tidak kosong.

## Tindak lanjut pencarian web

Beberapa penyedia pencarian web memicu prompt tindak lanjut khusus penyedia selama onboarding:

- **Grok** dapat menawarkan penyiapan `x_search` opsional dengan autentikasi xAI yang sama dan pilihan model `x_search`.
- **Kimi** dapat meminta wilayah API Moonshot (`api.moonshot.ai` atau `api.moonshot.cn`) dan model pencarian web Kimi default.

## Perilaku lainnya

- Perilaku cakupan DM onboarding lokal: [Referensi penyiapan CLI](/id/start/wizard-cli-reference#outputs-and-internals).
- Chat pertama tercepat: `openclaw dashboard` (Control UI, tanpa penyiapan saluran).
- Penyedia kustom: hubungkan endpoint apa pun yang kompatibel dengan OpenAI atau Anthropic, termasuk penyedia terkelola yang tidak tercantum. Gunakan kompatibilitas **Tidak diketahui** untuk mendeteksi secara otomatis melalui pemeriksaan langsung.
- Jika status Hermes terdeteksi, onboarding menawarkan alur migrasi (lihat `--flow import` di atas).

## Perintah tindak lanjut umum

Gunakan `openclaw configure` nanti untuk perubahan tertarget tanpa inferensi dan `openclaw
channels add` untuk penyiapan khusus saluran. Untuk perubahan penyedia model atau rute autentikasi,
jalankan `openclaw onboard` sebagai gantinya.

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
