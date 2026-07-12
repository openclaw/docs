---
read_when:
    - Anda ingin menyiapkan inferensi, lalu menyelesaikan penyiapan dengan Crestodian
summary: Referensi CLI untuk `openclaw onboard` (orientasi interaktif)
title: Orientasi Awal
x-i18n:
    generated_at: "2026-07-12T14:05:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e9dad7efda492e0d9ef01ef08a1fd8c81272a0d9b3aa3b945917b6878159a06
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Penyiapan terpandu yang mengutamakan penetapan inferensi: proses ini mendeteksi akses AI yang tersedia,
mewajibkan penyelesaian langsung, hanya menyimpan rute yang berfungsi, lalu memulai
Crestodian untuk mengonfigurasi sisanya. `openclaw setup` adalah titik masuk yang sama;
`openclaw setup --baseline` hanya menulis konfigurasi/ruang kerja dasar.

<CardGroup cols={2}>
  <Card title="Pusat orientasi CLI" href="/id/start/wizard" icon="rocket">
    Panduan alur CLI interaktif.
  </Card>
  <Card title="Ikhtisar orientasi" href="/id/start/onboarding-overview" icon="map">
    Cara seluruh proses orientasi OpenClaw saling terhubung.
  </Card>
  <Card title="Referensi penyiapan CLI" href="/id/start/wizard-cli-reference" icon="book">
    Keluaran, mekanisme internal, dan perilaku setiap langkah.
  </Card>
  <Card title="Otomatisasi CLI" href="/id/start/wizard-cli-automation" icon="terminal">
    Flag noninteraktif dan penyiapan berbasis skrip.
  </Card>
  <Card title="Orientasi aplikasi macOS" href="/id/start/onboarding" icon="apple">
    Alur orientasi untuk aplikasi bilah menu macOS.
  </Card>
</CardGroup>

## Contoh

```bash
openclaw onboard
openclaw onboard --classic
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

- `--classic`: membuka wizard langkah demi langkah lengkap. Flag ini tidak dapat digabungkan dengan
  `--non-interactive`; hilangkan `--classic` untuk penyiapan otomatis.
- `--flow quickstart`: membuka wizard klasik dengan prompt minimal dan
  membuat token Gateway secara otomatis.
- `--flow manual` (alias `advanced`): membuka wizard klasik dengan prompt lengkap
  untuk port, pengikatan, dan autentikasi.
- `--flow import`: menjalankan penyedia migrasi yang terdeteksi (misalnya Hermes melalui `--import-from hermes`), menampilkan pratinjau rencana, lalu menerapkannya setelah konfirmasi. Impor hanya berjalan pada penyiapan OpenClaw yang baru—atur ulang konfigurasi, kredensial, sesi, dan status ruang kerja terlebih dahulu jika ada. Gunakan [`openclaw migrate`](/id/cli/migrate) untuk rencana uji coba, mode penimpaan, laporan, dan pemetaan yang tepat.
- `--modern` adalah alias kompatibilitas untuk asisten penyiapan percakapan Crestodian.
  Flag ini menggunakan gerbang inferensi langsung yang sama dengan `openclaw crestodian` dan
  hanya menerima `--workspace`, `--accept-risk`,
  `--non-interactive`, dan `--json`. Flag penyiapan lainnya ditolak, bukan
  diabaikan secara diam-diam.

## Alur terpandu

`openclaw onboard` tanpa argumen memulai alur terpandu. Alur ini menampilkan pemberitahuan keamanan,
mendeteksi akses AI yang sudah tersedia melalui model yang dikonfigurasi, variabel lingkungan
kunci API, dan CLI lokal yang didukung, lalu menguji kandidat yang direkomendasikan
dengan penyelesaian nyata. Jika kandidat tersebut gagal, orientasi menampilkan
alasannya dan secara otomatis mencoba kandidat berikutnya yang dapat digunakan.

Jika deteksi otomatis tidak menemukan kandidat yang berfungsi, pilih kandidat lain yang terdeteksi atau masukkan
kunci API penyedia melalui prompt tersamarkan. Kunci manual diuji melalui jalur
penyelesaian langsung yang sama. Orientasi terpandu
tidak menawarkan Crestodian atau opsi keluar tanpa AI sebelum kandidat berhasil. OpenClaw
hanya menyimpan rute model terverifikasi beserta kredensialnya setelah pengujian
berhasil; kandidat yang gagal tidak menggantikan model yang dikonfigurasi atau menyimpan
kredensial yang dicoba. Penyiapan ruang kerja dan Gateway tetap tidak berubah hingga
Crestodian dimulai.

Dalam mode terpandu, `--workspace <dir>` menyediakan ruang kerja yang diusulkan Crestodian
dan konteks inferensi terisolasi. Nilai ini tidak disimpan hingga Anda menyetujui
usulan penyiapan Crestodian. Orientasi klasik dan noninteraktif menyimpan
ruang kerjanya melalui alur penyiapan normal masing-masing.

Setelah inferensi berhasil, orientasi terpandu langsung memulai Crestodian dengan
model terverifikasi. Crestodian kemudian dapat mengonfigurasi ruang kerja, Gateway,
kanal, agen, plugin, dan fitur opsional lainnya. Di dalam Crestodian, gunakan
`open channel wizard for <channel>` untuk menyerahkan pengumpulan kredensial kanal kepada
wizard terminal tersamarkan. Untuk mengubah penyedia model atau autentikasinya,
keluar dari Crestodian dan jalankan `openclaw onboard`; Crestodian tidak membuka alur
penyedia terpandu atau klasik.

Pada instalasi yang telah dikonfigurasi, menjalankan kembali `openclaw onboard` terlebih dahulu memverifikasi
model default saat ini, sehingga alur yang sama berfungsi sebagai proses verifikasi dan perbaikan.
Jika pemeriksaan tersebut gagal, model yang dikonfigurasi tidak pernah diganti secara otomatis—
orientasi berhenti dan menanyakan cara melanjutkan. Pemeriksaan berjalan di luar
ruang kerja Anda, sehingga model yang disediakan oleh plugin ruang kerja dapat gagal di sini meskipun tetap
berfungsi di agen.
Gunakan `openclaw onboard --classic` untuk autentikasi khusus penyedia, kanal, Skills,
penyiapan Gateway jarak jauh, impor, atau kontrol Gateway lengkap. Untuk penyiapan dan
perbaikan noninferensi melalui percakapan, jalankan `openclaw crestodian`; `openclaw onboard
--modern` adalah alias kompatibilitas melalui gerbang inferensi yang sama. Wizard klasik
dapat secara opsional memverifikasi model default dengan penyelesaian langsung, tetapi
Crestodian tidak akan dimulai hingga pemeriksaan inferensi langsungnya sendiri berhasil.

Dalam terminal interaktif, `openclaw` tanpa argumen (tanpa subperintah) menentukan alur berdasarkan status
konfigurasi:

- Jika berkas konfigurasi aktif tidak ada atau tidak memiliki pengaturan buatan pengguna (kosong atau
  hanya metadata), orientasi terpandu dimulai.
- Jika berkas konfigurasi ada tetapi gagal divalidasi, jalur orientasi klasik
  dimulai dengan panduan `openclaw doctor`. Crestodian memerlukan inferensi yang berfungsi
  dan tidak digunakan untuk memperbaiki status prainferensi ini.
- Jika berkas konfigurasi valid, TUI agen normal dibuka. Gateway terkonfigurasi yang
  dapat dijangkau serta memiliki agen dan model akan langsung membuka antarmuka tersebut tanpa
  orientasi atau Crestodian. Pada instalasi yang telah dikonfigurasi, akses Crestodian melalui
  `/crestodian` di dalam TUI atau `openclaw crestodian`.

`ws://` teks biasa diterima untuk local loopback, literal IP privat, `.local`, dan URL gateway Tailnet `*.ts.net`. Untuk nama DNS privat tepercaya lainnya, atur `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` dalam lingkungan proses orientasi.

## Atur ulang

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` menghapus status sebelum menjalankan penyiapan. `--reset-scope` mengontrol cakupannya: `config` (hanya konfigurasi), `config+creds+sessions` (default saat `--reset` diberikan tanpa cakupan), atau `full` (juga mengatur ulang ruang kerja). Pengaturan ulang ruang kerja hanya dilakukan dengan `--reset-scope full`.

## Lokal

Orientasi interaktif menggunakan lokal wizard CLI untuk teks penyiapan tetap. Urutan penentuan:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Cadangan bahasa Inggris

Lokal wizard yang didukung adalah `en`, `zh-CN`, dan `zh-TW`. Nilai lokal dapat menggunakan garis bawah atau bentuk akhiran POSIX seperti `zh_CN.UTF-8`. Nama produk, nama perintah, kunci konfigurasi, URL, ID penyedia, ID model, serta label plugin/kanal tetap apa adanya.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

## Penyiapan noninteraktif

`--non-interactive` memerlukan `--accept-risk` (mengakui bahwa agen sangat berdaya dan akses sistem penuh mengandung risiko). Nilai default `--mode` adalah `local`.

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

`--custom-api-key` bersifat opsional; jika dihilangkan, orientasi memeriksa `CUSTOM_API_KEY` dalam lingkungan. OpenClaw secara otomatis menandai ID model visi umum (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral, dan yang serupa) sebagai model yang mendukung gambar. Berikan `--custom-image-input` untuk ID visi kustom yang tidak dikenal, atau `--custom-text-input` untuk memaksakan metadata khusus teks. Gunakan `--custom-compatibility openai-responses` untuk titik akhir yang kompatibel dengan OpenAI dan mendukung `/v1/responses` tetapi tidak mendukung `/v1/chat/completions`; nilai yang valid adalah `openai` (default), `openai-responses`, `anthropic`.

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

Nilai default `--custom-base-url` adalah `http://127.0.0.1:11434`. `--custom-model-id` bersifat opsional; jika dihilangkan, orientasi menggunakan default yang disarankan Ollama. ID model cloud seperti `kimi-k2.5:cloud` juga berfungsi di sini.

Simpan kunci penyedia sebagai referensi, bukan sebagai teks biasa:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Dengan `--secret-input-mode ref`, orientasi menulis referensi yang didukung lingkungan, bukan nilai kunci teks biasa: untuk penyedia yang didukung profil autentikasi, nilai yang ditulis adalah `keyRef: { source: "env", provider: "default", id: <envVar> }`; untuk penyedia kustom, `models.providers.<id>.apiKey` ditulis dengan cara yang sama (misalnya `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`). Kontrak: atur variabel lingkungan penyedia dalam lingkungan proses orientasi (misalnya `OPENAI_API_KEY`) dan jangan sekaligus memberikan flag kunci sebaris kecuali variabel lingkungan tersebut telah diatur—nilai flag tanpa variabel lingkungan yang sesuai akan langsung gagal disertai panduan.

### Autentikasi Gateway (noninteraktif)

- `--gateway-auth token --gateway-token <token>` menyimpan token teks biasa. `token` adalah mode autentikasi default.
- `--gateway-auth token --gateway-token-ref-env <name>` menyimpan `gateway.auth.token` sebagai SecretRef lingkungan. Memerlukan variabel lingkungan yang tidak kosong dengan nama tersebut dalam lingkungan proses orientasi.
- `--gateway-token` dan `--gateway-token-ref-env` tidak dapat digunakan bersamaan.
- Dengan `--install-daemon`: `gateway.auth.token` yang dikelola SecretRef divalidasi tetapi tidak disimpan sebagai teks biasa yang telah diurai dalam metadata lingkungan layanan supervisor; jika referensi tidak dapat diurai, instalasi gagal secara tertutup disertai panduan perbaikan. Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi sementara `gateway.auth.mode` belum diatur, instalasi diblokir hingga mode diatur secara eksplisit.
- Orientasi lokal menulis `gateway.mode="local"` ke dalam konfigurasi. Berkas konfigurasi berikutnya yang tidak memiliki `gateway.mode` menunjukkan kerusakan konfigurasi atau pengeditan manual yang belum selesai, bukan pintasan mode lokal yang valid.
- Orientasi lokal memasang plugin yang dapat diunduh dan diperlukan oleh jalur penyiapan yang dipilih (misalnya plugin runtime Codex atau Copilot untuk pilihan autentikasi tersebut). Orientasi jarak jauh hanya menulis informasi koneksi untuk Gateway jarak jauh—orientasi ini tidak pernah memasang paket plugin lokal.
- `--allow-unconfigured` adalah jalan keluar terpisah untuk `openclaw gateway run`; flag ini tidak memungkinkan orientasi melewati `gateway.mode`.

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

- Kecuali Anda memberikan `--skip-health`, orientasi menunggu gateway lokal dapat dijangkau sebelum berhasil keluar.
- `--install-daemon` terlebih dahulu memulai jalur instalasi gateway terkelola. Tanpa flag ini, gateway lokal harus sudah berjalan (misalnya `openclaw gateway run`).
- `--skip-health` melewati penantian jika Anda hanya menginginkan penulisan konfigurasi/ruang kerja/bootstrap dalam otomatisasi.
- `--skip-bootstrap` mengatur `agents.defaults.skipBootstrap: true` dan melewati pembuatan `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, dan `BOOTSTRAP.md`.
- Pada Windows native, `--install-daemon` mencoba Scheduled Tasks terlebih dahulu dan beralih ke item masuk folder Startup per pengguna jika pembuatan tugas ditolak.

### Mode referensi interaktif

- Pilih **Gunakan referensi rahasia** saat diminta, lalu pilih **Variabel lingkungan** atau penyedia rahasia yang telah dikonfigurasi (`file` atau `exec`).
- Orientasi menjalankan validasi awal cepat sebelum menyimpan referensi dan memungkinkan Anda mencoba lagi jika gagal.

### Pilihan titik akhir Z.AI

<Note>
`--auth-choice zai-api-key` secara otomatis mendeteksi endpoint dan model Z.AI terbaik untuk kunci Anda: endpoint Coding Plan mengutamakan `zai/glm-5.2` (beralih ke `glm-5.1` jika tidak tersedia); endpoint API umum menggunakan `zai/glm-5.1` secara default. Untuk memaksakan penggunaan endpoint Coding Plan, pilih langsung `zai-coding-global` atau `zai-coding-cn`.
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

| Flag                            | Deskripsi                                                                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--token-provider <id>`         | ID penyedia token yang menerbitkan token                                                                                                         |
| `--token <token>`               | Nilai token untuk autentikasi model                                                                                                              |
| `--token-profile-id <id>`       | ID profil autentikasi (default `<provider>:manual`; beberapa alur milik penyedia menggunakan defaultnya sendiri, seperti `anthropic:default`)    |
| `--token-expires-in <duration>` | Durasi kedaluwarsa token opsional (misalnya `365d`, `12h`)                                                                                       |

Cloudflare AI Gateway: `--cloudflare-ai-gateway-account-id <id>`, `--cloudflare-ai-gateway-gateway-id <id>`.

Kontrol pemasangan daemon: `--no-install-daemon` / `--skip-daemon` (alias; lewati pemasangan layanan Gateway), `--daemon-runtime <node|bun>`.

Skills: `--node-manager <npm|pnpm|bun>` (default `npm`), `--skip-skills`.

Penyiapan UI dan hook: `--skip-ui` (lewati perintah interaktif Control UI/TUI), `--skip-hooks` (lewati penyiapan webhook/hook), `--skip-channels`, `--skip-search`.

Keluaran: `--suppress-gateway-token-output` menyembunyikan keluaran Gateway/UI yang memuat token (petunjuk token, URL masuk otomatis dengan token tertanam, dan peluncuran otomatis Control UI) - berguna di terminal bersama dan CI.

<Note>
`--json` tidak menyiratkan mode noninteraktif dalam onboarding terpandu atau klasik.
Dengan `--modern`, JSON merupakan ringkasan Crestodian sekali jalan dan proses berakhir setelah
hasil tunggal tersebut. Gunakan `--non-interactive` untuk skrip lainnya.
</Note>

## Prapemfilteran penyedia

Ketika pilihan autentikasi menyiratkan penyedia yang diutamakan, onboarding memfilter terlebih dahulu pemilih model default dan daftar yang diizinkan agar hanya menampilkan model penyedia tersebut. Filter juga mencocokkan penyedia lain yang dimiliki oleh plugin yang sama, yang mencakup varian paket pengodean seperti `volcengine`/`volcengine-plan` dan `byteplus`/`byteplus-plan`. Jika filter penyedia yang diutamakan tidak menghasilkan model yang telah dimuat, onboarding beralih ke katalog tanpa filter alih-alih membiarkan pemilih kosong.

## Tindak lanjut pencarian web

Beberapa penyedia pencarian web memicu perintah interaktif tindak lanjut khusus penyedia selama onboarding:

- **Grok** dapat menawarkan penyiapan `x_search` opsional dengan autentikasi xAI yang sama dan pilihan model `x_search`.
- **Kimi** dapat menanyakan wilayah API Moonshot (`api.moonshot.ai` dibandingkan dengan `api.moonshot.cn`) dan model pencarian web Kimi default.

## Perilaku lainnya

- Perilaku cakupan DM onboarding lokal: [Referensi penyiapan CLI](/id/start/wizard-cli-reference#outputs-and-internals).
- Obrolan pertama tercepat: `openclaw dashboard` (Control UI, tanpa penyiapan saluran).
- Penyedia khusus: hubungkan endpoint apa pun yang kompatibel dengan OpenAI atau Anthropic, termasuk penyedia terhos yang tidak tercantum. Gunakan kompatibilitas **Tidak diketahui** untuk mendeteksi secara otomatis melalui pemeriksaan langsung.
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
