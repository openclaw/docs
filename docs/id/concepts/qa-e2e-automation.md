---
read_when:
    - Memahami bagaimana tumpukan QA saling terhubung
    - Memperluas qa-lab, qa-channel, atau adaptor transport
    - Menambahkan skenario QA berbasis repo
    - Membangun otomatisasi QA dengan realisme lebih tinggi di sekitar dasbor Gateway
summary: 'Ikhtisar tumpukan QA: qa-lab, qa-channel, skenario berbasis repo, jalur transport langsung, adaptor transport, dan pelaporan.'
title: Ikhtisar QA
x-i18n:
    generated_at: "2026-07-01T08:31:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33dc2c7ac1751c8728dda332476cd41cf39c3e9d1582f8c652c2670c2549b34c
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Tumpukan QA privat dimaksudkan untuk menguji OpenClaw dengan cara yang lebih realistis
dan berbentuk kanal dibandingkan satu pengujian unit tunggal.

Bagian saat ini:

- `extensions/qa-channel`: kanal pesan sintetis dengan permukaan DM, kanal, thread,
  reaksi, edit, dan hapus.
- `extensions/qa-lab`: UI debugger dan bus QA untuk mengamati transkrip,
  menyuntikkan pesan masuk, dan mengekspor laporan Markdown.
- `extensions/qa-matrix`, plugin runner mendatang: adaptor transport langsung yang
  menggerakkan kanal nyata di dalam gateway QA turunan.
- `qa/`: aset seed berbasis repo untuk tugas kickoff dan skenario QA baseline.
- [Mantis](/id/concepts/mantis): verifikasi langsung sebelum dan sesudah untuk bug yang
  membutuhkan transport nyata, tangkapan layar browser, status VM, dan bukti PR.

## Permukaan perintah

Setiap alur QA berjalan di bawah `pnpm openclaw qa <subcommand>`. Banyak yang memiliki alias skrip `pnpm qa:*`;
kedua bentuk didukung.

| Perintah                                             | Tujuan                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Pemeriksaan mandiri QA bawaan tanpa `--qa-profile`; runner profil kematangan berbasis taksonomi dengan `--qa-profile smoke-ci`, `--qa-profile release`, atau `--qa-profile all`.                                                                                                      |
| `qa suite`                                          | Jalankan skenario berbasis repo terhadap jalur gateway QA. Alias: `pnpm openclaw qa suite --runner multipass` untuk VM Linux sekali pakai.                                                                                                                                  |
| `qa coverage`                                       | Cetak inventaris cakupan skenario YAML (`--json` untuk keluaran mesin).                                                                                                                                                                                               |
| `qa parity-report`                                  | Bandingkan dua berkas `qa-suite-summary.json` dan tulis laporan paritas agentik, atau gunakan `--runtime-axis --token-efficiency` untuk menulis laporan paritas runtime Codex-vs-OpenClaw dan efisiensi token dari satu ringkasan pasangan runtime.                                         |
| `qa character-eval`                                 | Jalankan skenario QA karakter di beberapa model langsung dengan laporan yang dinilai. Lihat [Pelaporan](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Jalankan prompt sekali jalan terhadap jalur penyedia/model yang dipilih.                                                                                                                                                                                                          |
| `qa ui`                                             | Mulai UI debugger QA dan bus QA lokal (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Bangun image Docker QA yang sudah dipra-panggang.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Tulis scaffold docker-compose untuk dasbor QA + jalur gateway.                                                                                                                                                                                                    |
| `qa up`                                             | Bangun situs QA, mulai tumpukan berbasis Docker, cetak URL (alias: `pnpm qa:lab:up`; varian `:fast` menambahkan `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Mulai hanya server penyedia AIMock.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Mulai hanya server penyedia `mock-openai` yang sadar skenario.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Kelola pool kredensial Convex bersama.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Jalur transport langsung terhadap homeserver Tuwunel sekali pakai. Lihat [QA Matrix](/id/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Jalur transport langsung terhadap grup Telegram privat nyata.                                                                                                                                                                                                              |
| `qa discord`                                        | Jalur transport langsung terhadap kanal guild Discord privat nyata.                                                                                                                                                                                                       |
| `qa slack`                                          | Jalur transport langsung terhadap kanal Slack privat nyata.                                                                                                                                                                                                               |
| `qa whatsapp`                                       | Jalur transport langsung terhadap akun WhatsApp Web nyata.                                                                                                                                                                                                                 |
| `qa mantis`                                         | Runner verifikasi sebelum dan sesudah untuk bug transport langsung, dengan bukti reaksi-status Discord, smoke desktop/browser Crabbox, dan smoke Slack-dalam-VNC. Lihat [Mantis](/id/concepts/mantis) dan [Runbook Desktop Slack Mantis](/id/concepts/mantis-slack-desktop-runbook). |

`qa run` berbasis profil membaca keanggotaan dari `taxonomy.yaml`, lalu mendispatch
skenario yang diselesaikan melalui `qa suite`. `--surface` dan
`--category` memfilter profil yang dipilih alih-alih mendefinisikan jalur terpisah.
`qa-evidence.json` yang dihasilkan mencakup ringkasan scorecard profil dengan
jumlah kategori yang dipilih dan ID cakupan yang hilang; entri bukti individual
tetap menjadi sumber kebenaran untuk pengujian, peran cakupan, dan hasil.
ID cakupan fitur taksonomi adalah target bukti yang tepat, bukan alias. Cakupan
skenario primer memenuhi ID yang cocok; cakupan sekunder tetap bersifat saran.
ID cakupan menggunakan bentuk bertitik `namespace.behavior` dengan segmen
alfanumerik/tanda hubung huruf kecil; ID profil, permukaan, dan kategori masih dapat menggunakan
ID taksonomi bertanda hubung atau bertitik yang sudah ada.
Bukti ramping menghilangkan `execution` per entri dan menetapkan `evidenceMode: "slim"`;
`smoke-ci` default ke ramping, dan `--evidence-mode full` memulihkan entri lengkap:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Gunakan `smoke-ci` untuk bukti profil deterministik dengan penyedia model mock dan
server penyedia lokal Crabline. Gunakan `release` untuk bukti Stable/LTS terhadap kanal langsung.
Gunakan `all` hanya untuk eksekusi bukti taksonomi penuh yang eksplisit; ini memilih
setiap kategori kematangan aktif dan dapat didispatch melalui workflow `QA Profile
Evidence` dengan `qa_profile=all`. Ketika sebuah perintah juga memerlukan profil root OpenClaw,
letakkan profil root sebelum perintah QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Alur operator

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: dasbor Gateway (Control UI) dengan agen.
- Kanan: QA Lab, menampilkan transkrip bergaya Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Itu membangun situs QA, memulai jalur gateway berbasis Docker, dan mengekspos halaman
QA Lab tempat operator atau loop otomatisasi dapat memberi agen misi QA,
mengamati perilaku kanal nyata, dan mencatat apa yang berhasil, gagal, atau
tetap terblokir.

Untuk iterasi UI QA Lab lokal yang lebih cepat tanpa membangun ulang image Docker setiap kali,
mulai tumpukan dengan bundel QA Lab yang dipasang dengan bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` menjaga layanan Docker pada image yang sudah dibangun dan melakukan bind mount
`extensions/qa-lab/web/dist` ke dalam kontainer `qa-lab`. `qa:lab:watch`
membangun ulang bundel tersebut saat ada perubahan, dan browser memuat ulang otomatis ketika hash aset QA Lab berubah.

Untuk smoke sinyal OpenTelemetry lokal, jalankan:

```bash
pnpm qa:otel:smoke
```

Skrip tersebut memulai penerima OTLP/HTTP lokal, menjalankan skenario QA `otel-trace-smoke`
dengan plugin `diagnostics-otel` diaktifkan, lalu menegaskan bahwa trace,
metrik, dan log diekspor. Skrip ini mendekode span trace protobuf yang diekspor
dan memeriksa bentuk kritis rilis:
`openclaw.run`, `openclaw.harness.run`, span pemanggilan model konvensi semantik GenAI terbaru,
`openclaw.context.assembled`, dan `openclaw.message.delivery`
harus ada. Smoke memaksa
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, sehingga span pemanggilan model
harus menggunakan nama `{gen_ai.operation.name} {gen_ai.request.model}`;
pemanggilan model tidak boleh mengekspor `StreamAbandoned` pada giliran yang berhasil; ID diagnostik mentah dan
atribut `openclaw.content.*` harus tetap di luar trace. Payload OTLP mentah
tidak boleh berisi sentinel prompt, sentinel respons, atau kunci sesi QA.
Skrip ini menulis `otel-smoke-summary.json` di sebelah artefak suite QA.

Untuk smoke OpenTelemetry yang didukung kolektor, jalankan:

```bash
pnpm qa:otel:collector-smoke
```

Jalur tersebut menempatkan kontainer Docker OpenTelemetry Collector nyata di depan
penerima lokal yang sama. Gunakan ini saat mengubah wiring endpoint, kompatibilitas kolektor,
atau perilaku ekspor OTLP yang dapat tertutup oleh penerima dalam proses.

Untuk smoke scrape Prometheus yang dilindungi, jalankan:

```bash
pnpm qa:prometheus:smoke
```

Alias tersebut menjalankan skenario QA `docker-prometheus-smoke` dengan
`diagnostics-prometheus` diaktifkan, memverifikasi scrape tanpa autentikasi ditolak,
lalu memeriksa bahwa scrape terautentikasi menyertakan keluarga metrik yang kritis
untuk rilis tanpa konten prompt, konten respons, pengidentifikasi diagnostik mentah,
token auth, atau path lokal.

Untuk menjalankan kedua observability smoke secara berurutan, gunakan:

```bash
pnpm qa:observability:smoke
```

Untuk jalur OpenTelemetry berbasis collector ditambah smoke scrape Prometheus yang
dilindungi, gunakan:

```bash
pnpm qa:observability:collector-smoke
```

QA observability tetap hanya untuk checkout sumber. Tarball npm sengaja tidak menyertakan
QA Lab, sehingga jalur rilis Docker paket tidak menjalankan perintah `qa`. Gunakan
`pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke`, atau
`pnpm qa:observability:smoke` dari checkout sumber yang sudah dibangun saat mengubah
instrumentasi diagnostik.

Untuk jalur smoke Matrix dengan transport nyata yang tidak memerlukan kredensial
penyedia model, jalankan profil cepat dengan penyedia OpenAI mock deterministik:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Untuk jalur penyedia live-frontier, berikan kredensial yang kompatibel dengan OpenAI
secara eksplisit:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

Referensi CLI lengkap, katalog profil/skenario, variabel env, dan tata letak artefak untuk jalur ini tersedia di [QA Matrix](/id/concepts/qa-matrix). Sekilas: jalur ini menyediakan homeserver Tuwunel sekali pakai di Docker, mendaftarkan pengguna driver/SUT/observer sementara, menjalankan Plugin Matrix nyata di dalam Gateway QA turunan yang dibatasi ke transport tersebut (tanpa `qa-channel`), lalu menulis laporan Markdown, ringkasan JSON, artefak observed-events, dan log output gabungan di bawah `.artifacts/qa-e2e/matrix-<timestamp>/`.

Skenario mencakup perilaku transport yang tidak dapat dibuktikan unit test secara end to end: penyaringan mention, kebijakan allow-bot, allowlist, balasan tingkat atas dan berutas, perutean DM, penanganan reaksi, penekanan edit masuk, dedupe replay setelah restart, pemulihan gangguan homeserver, pengiriman metadata persetujuan, penanganan media, serta alur bootstrap/pemulihan/verifikasi E2EE Matrix. Profil CLI E2EE juga menjalankan `openclaw matrix encryption setup` dan perintah verifikasi melalui homeserver sekali pakai yang sama sebelum memeriksa balasan Gateway.

Discord juga memiliki skenario opt-in khusus Mantis untuk reproduksi bug. Gunakan
`--scenario discord-status-reactions-tool-only` untuk timeline reaksi status eksplisit,
atau `--scenario discord-thread-reply-filepath-attachment` untuk membuat utas Discord
nyata dan memverifikasi bahwa `message.thread-reply` mempertahankan lampiran
`filePath`. Skenario ini tidak masuk ke jalur live Discord default karena merupakan
probe reproduksi sebelum/sesudah, bukan cakupan smoke yang luas.
Workflow Mantis thread-attachment juga dapat menambahkan video saksi Discord Web yang
sudah login saat `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` atau
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` dikonfigurasi di lingkungan QA.
Profil viewer tersebut hanya untuk tangkapan visual; keputusan lulus/gagal tetap
berasal dari oracle REST Discord.

CI menggunakan permukaan perintah yang sama di `.github/workflows/qa-live-transports-convex.yml`.
Jalankan terjadwal dan manual default mengeksekusi profil Matrix cepat dengan
kredensial live-frontier yang disediakan QA, `--fast`, dan
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Manual `matrix_profile=all` melakukan fan-out
ke lima shard profil.

Untuk jalur smoke Telegram, Discord, Slack, dan WhatsApp dengan transport nyata:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Jalur tersebut menargetkan channel nyata yang sudah ada dengan dua bot atau akun (driver + SUT). Variabel env yang diperlukan, daftar skenario, artefak output, dan pool kredensial Convex didokumentasikan dalam [referensi QA Telegram, Discord, Slack, dan WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) di bawah.

Untuk menjalankan VM desktop Slack penuh dengan penyelamatan VNC, jalankan:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Perintah tersebut menyewa mesin desktop/browser Crabbox, menjalankan jalur live Slack
di dalam VM, membuka Slack Web di browser VNC, menangkap desktop, dan menyalin
`slack-qa/`, `slack-desktop-smoke.png`, dan `slack-desktop-smoke.mp4` saat
tangkapan video tersedia kembali ke direktori artefak Mantis. Sewa desktop/browser
Crabbox menyediakan alat tangkap dan paket pembantu browser/native-build sejak awal,
sehingga skenario hanya perlu menginstal fallback pada sewa yang lebih lama. Mantis
melaporkan waktu total dan per fase di `mantis-slack-desktop-smoke-report.md` sehingga
run yang lambat menunjukkan apakah waktu digunakan untuk pemanasan sewa, akuisisi
kredensial, setup jarak jauh, atau penyalinan artefak. Gunakan kembali
`--lease-id <cbx_...>` setelah login ke Slack Web secara manual melalui VNC;
sewa yang digunakan kembali juga menjaga cache pnpm store Crabbox tetap hangat. Default
`--hydrate-mode source` memverifikasi dari checkout sumber dan menjalankan install/build
di dalam VM. Gunakan `--hydrate-mode prehydrated` hanya saat workspace jarak jauh yang
digunakan kembali sudah memiliki `node_modules` dan `dist/` yang sudah dibangun; mode
tersebut melewati langkah install/build yang mahal dan gagal tertutup saat workspace
belum siap. Dengan `--gateway-setup`, Mantis membiarkan Gateway Slack OpenClaw persisten
berjalan di dalam VM pada port `38973`; tanpanya, perintah menjalankan jalur QA Slack
bot-ke-bot normal dan keluar setelah tangkapan artefak.

Untuk membuktikan UI persetujuan native Slack dengan bukti desktop, jalankan mode
checkpoint persetujuan Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Mode ini saling eksklusif dengan `--gateway-setup`. Mode ini menjalankan skenario
persetujuan Slack, menolak id skenario non-persetujuan, menunggu pada setiap status
persetujuan tertunda dan terselesaikan, merender pesan Slack API yang diamati ke
`approval-checkpoints/<scenario>-pending.png` dan
`approval-checkpoints/<scenario>-resolved.png`, lalu gagal jika ada checkpoint,
bukti pesan, acknowledgment, atau screenshot hasil render yang hilang atau kosong.
Sewa CI dingin masih dapat menampilkan sign-in Slack di `slack-desktop-smoke.png`;
gambar checkpoint persetujuan adalah bukti visual untuk jalur ini.

Checklist operator, perintah dispatch workflow GitHub, kontrak komentar bukti,
tabel keputusan hydrate-mode, interpretasi waktu, dan langkah penanganan kegagalan
tersedia di [Runbook Desktop Slack Mantis](/id/concepts/mantis-slack-desktop-runbook).

Untuk tugas desktop gaya agent/CV, jalankan:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` menyewa atau menggunakan kembali mesin desktop/browser Crabbox, memulai
`crabbox record --while`, mengendalikan browser yang terlihat melalui
`visual-driver` bersarang, menangkap `visual-task.png`, menjalankan
`openclaw infer image describe` terhadap screenshot saat `--vision-mode image-describe`
dipilih, dan menulis `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json`, serta `mantis-visual-task-report.md`.
Saat `--expect-text` diatur, prompt vision meminta verdict JSON terstruktur dan hanya
lulus saat model melaporkan bukti terlihat yang positif; respons negatif yang hanya
mengutip teks target menggagalkan assertion. Gunakan `--vision-mode metadata` untuk
smoke tanpa model yang membuktikan plumbing desktop, browser, screenshot, dan video
tanpa memanggil penyedia pemahaman gambar. Rekaman adalah artefak wajib untuk
`visual-task`; jika Crabbox tidak merekam `visual-task.mp4` yang tidak kosong, tugas
gagal meskipun visual driver lulus. Saat gagal, Mantis mempertahankan sewa untuk VNC
kecuali tugas sudah lulus dan `--keep-lease` tidak diatur.

Sebelum menggunakan kredensial live yang dipool, jalankan:

```bash
pnpm openclaw qa credentials doctor
```

Doctor memeriksa env broker Convex, memvalidasi pengaturan endpoint, dan memverifikasi keterjangkauan admin/list saat secret maintainer ada. Doctor hanya melaporkan status set/missing untuk secret.

## Cakupan transport live

Jalur transport live berbagi satu kontrak alih-alih masing-masing membuat bentuk daftar skenarionya sendiri. `qa-channel` adalah suite perilaku produk sintetis yang luas dan bukan bagian dari matriks cakupan transport live.

Runner transport live harus mengimpor id skenario bersama, helper cakupan
baseline, dan helper pemilihan skenario dari
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Jalur    | Canary | Penyaringan mention | Bot-ke-bot | Blok allowlist | Balasan tingkat atas | Balasan kutipan | Lanjutkan setelah restart | Tindak lanjut utas | Isolasi utas | Observasi reaksi | Perintah bantuan | Pendaftaran perintah native |
| -------- | ------ | ------------------- | ---------- | -------------- | -------------------- | ---------------- | ------------------------- | ------------------ | ------------ | ---------------- | ---------------- | ---------------------------- |
| Matrix   | x      | x                   | x          | x              | x                    |                  | x                         | x                  | x            | x                |                  |                              |
| Telegram | x      | x                   | x          |                |                      |                  |                           |                    |              |                  | x                |                              |
| Discord  | x      | x                   | x          |                |                      |                  |                           |                    |              |                  |                  | x                            |
| Slack    | x      | x                   | x          | x              | x                    |                  | x                         | x                  | x            |                  |                  |                              |
| WhatsApp | x      | x                   |            | x              | x                    | x                | x                         |                    |              | x                | x                |                              |

Ini mempertahankan `qa-channel` sebagai suite perilaku produk yang luas sementara Matrix,
Telegram, dan transport live lainnya berbagi satu checklist kontrak transport yang eksplisit.

Untuk jalur VM Linux sekali pakai tanpa membawa Docker ke path QA, jalankan:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Ini mem-boot guest Multipass baru, menginstal dependensi, membangun OpenClaw
di dalam guest, menjalankan `qa suite`, lalu menyalin laporan QA normal dan
ringkasan kembali ke `.artifacts/qa-e2e/...` pada host.
Ini menggunakan kembali perilaku pemilihan skenario yang sama seperti `qa suite` pada host.
Run suite host dan Multipass mengeksekusi beberapa skenario terpilih secara paralel
dengan worker Gateway terisolasi secara default. `qa-channel` default ke concurrency
4, dibatasi oleh jumlah skenario yang dipilih. Gunakan `--concurrency <count>` untuk
menyetel jumlah worker, atau `--concurrency 1` untuk eksekusi serial.
Gunakan `--pack personal-agent` untuk menjalankan pack benchmark asisten pribadi. Selector
pack bersifat aditif dengan flag `--scenario` berulang: skenario eksplisit berjalan
terlebih dahulu, lalu skenario pack berjalan sesuai urutan pack dengan duplikat dihapus.
Gunakan `--pack observability` saat runner QA kustom sudah menyediakan setup collector
OpenTelemetry dan ingin skenario smoke diagnostik OpenTelemetry serta Prometheus dipilih
bersama.
Perintah keluar non-zero saat ada skenario yang gagal. Gunakan `--allow-failures` saat
Anda menginginkan artefak tanpa kode keluar gagal.
Run live meneruskan input auth QA yang didukung dan praktis untuk guest: key penyedia
berbasis env, path konfigurasi penyedia live QA, dan `CODEX_HOME` saat ada. Pertahankan
`--output-dir` di bawah root repo agar guest dapat menulis balik melalui workspace yang
di-mount.

## Referensi QA Telegram, Discord, Slack, dan WhatsApp

Matrix memiliki [halaman khusus](/id/concepts/qa-matrix) karena jumlah skenarionya dan penyediaan homeserver berbasis Docker. Telegram, Discord, Slack, dan WhatsApp berjalan terhadap transport nyata yang sudah ada, sehingga referensinya berada di sini.

### Flag CLI bersama

Lane ini mendaftar melalui `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` dan menerima flag yang sama:

| Flag                                  | Default                                            | Deskripsi                                                                                                                                                  |
| ------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Jalankan hanya skenario ini. Dapat diulang.                                                                                                                |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Tempat laporan, ringkasan, bukti, artefak khusus transport, dan log keluaran ditulis. Path relatif di-resolve terhadap `--repo-root`.                      |
| `--repo-root <path>`                  | `process.cwd()`                                    | Root repositori saat memanggil dari cwd netral.                                                                                                            |
| `--sut-account <id>`                  | `sut`                                              | ID akun sementara di dalam konfigurasi Gateway QA.                                                                                                         |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` atau `live-frontier` (`live-openai` lama masih berfungsi).                                                                                   |
| `--model <ref>` / `--alt-model <ref>` | default provider                                   | Ref model utama/alternatif.                                                                                                                                |
| `--fast`                              | nonaktif                                           | Mode cepat provider jika didukung.                                                                                                                        |
| `--credential-source <env\|convex>`   | `env`                                              | Lihat [pool kredensial Convex](#convex-credential-pool).                                                                                                   |
| `--credential-role <maintainer\|ci>`  | `ci` di CI, selain itu `maintainer`                | Peran yang digunakan saat `--credential-source convex`.                                                                                                    |

Setiap lane keluar dengan status non-zero pada skenario yang gagal. `--allow-failures` menulis artefak tanpa menetapkan kode keluar gagal.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Menargetkan satu grup Telegram privat nyata dengan dua bot berbeda (driver + SUT). Bot SUT harus memiliki nama pengguna Telegram; pengamatan bot-ke-bot bekerja paling baik saat kedua bot mengaktifkan **Bot-to-Bot Communication Mode** di `@BotFather`.

Env wajib saat `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - id obrolan numerik (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Skenario (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Set default implisit selalu mencakup canary, mention gating, balasan perintah native, pengalamatan perintah, dan balasan grup bot-ke-bot. Default `mock-openai` juga mencakup pemeriksaan deterministik rantai balasan dan streaming pesan final. `telegram-current-session-status-tool` tetap opt-in karena hanya stabil saat di-thread langsung setelah canary, bukan setelah balasan perintah native sembarang. Gunakan `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` untuk mencetak pemisahan default/opsional saat ini dengan ref regresi.

Artefak keluaran:

- `telegram-qa-report.md`
- `qa-evidence.json` - entri bukti untuk pemeriksaan transport live, termasuk field profil, cakupan, provider, channel, artefak, hasil, dan RTT.

Jalankan Telegram paket menggunakan kontrak kredensial Telegram yang sama. Pengukuran RTT berulang adalah bagian dari lane live Telegram paket normal; distribusi RTT dilipat ke dalam `qa-evidence.json` di bawah `result.timing` untuk pemeriksaan RTT yang dipilih.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Saat `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ditetapkan, wrapper live paket menyewa kredensial `kind: "telegram"`, mengekspor env grup/driver/bot SUT yang disewa ke dalam run paket terinstal, mengirim Heartbeat untuk sewa, dan melepasnya saat shutdown. Wrapper paket secara default melakukan 20 pemeriksaan RTT dari `telegram-mentioned-message-reply`, timeout RTT 30 detik, dan peran Convex `maintainer` di luar CI saat Convex dipilih. Override `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`, atau `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` untuk menyetel pengukuran RTT tanpa membuat perintah RTT terpisah atau format ringkasan khusus Telegram.

### QA Discord

```bash
pnpm openclaw qa discord
```

Menargetkan satu channel guild Discord privat nyata dengan dua bot: bot driver yang dikendalikan oleh harness dan bot SUT yang dimulai oleh Gateway OpenClaw anak melalui Plugin Discord terbundel. Memverifikasi penanganan mention channel, bahwa bot SUT telah mendaftarkan perintah native `/help` dengan Discord, dan skenario bukti Mantis opt-in.

Env wajib saat `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - harus cocok dengan id pengguna bot SUT yang dikembalikan oleh Discord (jika tidak, lane gagal cepat).

Opsional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` mempertahankan isi pesan di artefak pesan-teramati.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` memilih channel suara/stage untuk `discord-voice-autojoin`; tanpa ini, skenario memilih channel suara/stage pertama yang terlihat oleh bot SUT.

Skenario (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - skenario suara opt-in. Berjalan sendiri, mengaktifkan `channels.discord.voice.autoJoin`, dan memverifikasi status suara Discord bot SUT saat ini adalah channel suara/stage target. Kredensial Discord Convex dapat menyertakan `voiceChannelId` opsional; jika tidak, runner menemukan channel suara/stage pertama yang terlihat di guild.
- `discord-status-reactions-tool-only` - skenario Mantis opt-in. Berjalan sendiri karena mengalihkan SUT ke balasan guild selalu aktif, khusus tool dengan `messages.statusReactions.enabled=true`, lalu menangkap timeline reaksi REST plus artefak visual HTML/PNG. Laporan sebelum/sesudah Mantis juga mempertahankan artefak MP4 yang disediakan skenario sebagai `baseline.mp4` dan `candidate.mp4`.

Jalankan skenario auto-join suara Discord secara eksplisit:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Jalankan skenario reaksi status Mantis secara eksplisit:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

Artefak keluaran:

- `discord-qa-report.md`
- `qa-evidence.json` - entri bukti untuk pemeriksaan transport live.
- `discord-qa-observed-messages.json` - isi disunting kecuali `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` dan `discord-status-reactions-tool-only-timeline.png` saat skenario reaksi status berjalan.

### QA Slack

```bash
pnpm openclaw qa slack
```

Menargetkan satu channel Slack privat nyata dengan dua bot berbeda: bot driver yang dikendalikan oleh harness dan bot SUT yang dimulai oleh Gateway OpenClaw anak melalui Plugin Slack terbundel.

Env wajib saat `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opsional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` mempertahankan isi pesan di artefak pesan-teramati.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` mengaktifkan checkpoint persetujuan visual untuk Mantis. Runner menulis `<scenario>.pending.json` dan `<scenario>.resolved.json`, lalu menunggu file `.ack.json` yang cocok.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` menimpa timeout acknowledgement checkpoint. Default-nya adalah `120000`.

Skenario (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - skenario persetujuan exec Slack native opt-in. Meminta persetujuan exec melalui Gateway, memverifikasi pesan Slack memiliki tombol persetujuan native, menyelesaikannya, dan memverifikasi pembaruan Slack yang sudah diselesaikan.
- `slack-approval-plugin-native` - skenario persetujuan Plugin Slack native opt-in. Mengaktifkan penerusan persetujuan exec dan Plugin bersama-sama agar event Plugin tidak disupresi oleh routing persetujuan exec, lalu memverifikasi jalur UI Slack native pending/resolved yang sama.

Artefak keluaran:

- `slack-qa-report.md`
- `qa-evidence.json` - entri bukti untuk pemeriksaan transport live.
- `slack-qa-observed-messages.json` - isi disunting kecuali `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - hanya saat Mantis menetapkan `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; berisi JSON checkpoint, JSON acknowledgement, dan screenshot pending/resolved.

#### Menyiapkan workspace Slack

Lane membutuhkan dua aplikasi Slack berbeda dalam satu workspace, plus sebuah channel tempat kedua bot menjadi anggota:

- `channelId` - id `Cxxxxxxxxxx` dari channel yang telah mengundang kedua bot. Gunakan channel khusus; lane memposting pada setiap run.
- `driverBotToken` - token bot (`xoxb-...`) dari aplikasi **Driver**.
- `sutBotToken` - token bot (`xoxb-...`) dari aplikasi **SUT**, yang harus merupakan aplikasi Slack terpisah dari driver agar id pengguna botnya berbeda.
- `sutAppToken` - token tingkat aplikasi (`xapp-...`) dari aplikasi SUT dengan `connections:write`, digunakan oleh Socket Mode agar aplikasi SUT dapat menerima event.

Lebih baik gunakan workspace Slack khusus untuk QA daripada menggunakan ulang workspace produksi.

Manifest SUT di bawah ini sengaja mempersempit instalasi produksi Plugin Slack terbundel (`extensions/slack/src/setup-shared.ts:10`) ke izin dan event yang dicakup oleh suite QA Slack live. Untuk penyiapan channel produksi sebagaimana dilihat pengguna, lihat [penyiapan cepat channel Slack](/id/channels/slack#quick-setup); pasangan Driver/SUT QA sengaja dipisahkan karena lane membutuhkan dua id pengguna bot berbeda dalam satu workspace.

**1. Buat aplikasi Driver**

Buka [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → pilih workspace QA, tempel manifest berikut, lalu _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

Salin _Bot User OAuth Token_ (`xoxb-...`) - itu menjadi `driverBotToken`. Driver hanya perlu memposting pesan dan mengidentifikasi dirinya sendiri; tidak ada event, tidak ada Socket Mode.

**2. Buat aplikasi SUT**

Ulangi _Create New App → From a manifest_ di workspace yang sama. Aplikasi QA ini sengaja memakai versi yang lebih sempit dari manifest produksi Plugin Slack bawaan (`extensions/slack/src/setup-shared.ts:10`): scope dan event reaksi dihilangkan karena suite QA Slack live belum mencakup penanganan reaksi.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

Setelah Slack membuat aplikasi, lakukan dua hal pada halaman pengaturannya:

- _Install to Workspace_ → salin _Bot User OAuth Token_ → itu menjadi `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → tambahkan scope `connections:write` → simpan → salin nilai `xapp-...` → itu menjadi `sutAppToken`.

Verifikasi bahwa kedua bot memiliki user id berbeda dengan memanggil `auth.test` pada setiap token. Runtime membedakan driver dan SUT berdasarkan user id; menggunakan ulang satu aplikasi untuk keduanya akan langsung menggagalkan gating mention.

**3. Buat channel**

Di workspace QA, buat channel (misalnya `#openclaw-qa`) dan undang kedua bot dari dalam channel:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Salin id `Cxxxxxxxxxx` dari _channel info → About → Channel ID_ - itu menjadi `channelId`. Channel publik bisa digunakan; jika Anda memakai channel privat, kedua aplikasi sudah memiliki `groups:history` sehingga pembacaan riwayat oleh harness tetap berhasil.

**4. Daftarkan kredensial**

Ada dua opsi. Gunakan env var untuk debugging di satu mesin (atur empat variabel `OPENCLAW_QA_SLACK_*` dan teruskan `--credential-source env`), atau seed pool Convex bersama agar CI dan maintainer lain dapat menyewanya.

Untuk pool Convex, tulis keempat field ke file JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Dengan `OPENCLAW_QA_CONVEX_SITE_URL` dan `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` diekspor di shell Anda, daftarkan dan verifikasi:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Harapkan `count: 1`, `status: "active"`, tanpa field `lease`.

**5. Verifikasi end to end**

Jalankan lane secara lokal untuk memastikan kedua bot dapat saling berbicara melalui broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Run yang hijau selesai jauh di bawah 30 detik dan `slack-qa-report.md` menampilkan `slack-canary` dan `slack-mention-gating` dengan status `pass`. Jika lane menggantung selama ~90 detik dan keluar dengan `Convex credential pool exhausted for kind "slack"`, berarti pool kosong atau setiap baris sedang disewa - `qa credentials list --kind slack --status all --json` akan memberi tahu yang mana.

### QA WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Menargetkan dua akun WhatsApp Web khusus: akun driver yang dikendalikan oleh
harness dan akun SUT yang dimulai oleh child Gateway OpenClaw melalui
Plugin WhatsApp bawaan.

Env yang wajib saat `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Opsional:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` mengaktifkan skenario grup seperti
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, skenario aksi/media/poll grup, dan
  `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` mempertahankan isi pesan dalam
  artefak observed-message.

Katalog skenario (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Baseline dan gating grup: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- Perintah native: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Perilaku balasan dan output akhir: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- Aksi pesan jalur pengguna: `whatsapp-agent-message-action-react` dimulai dari
  DM driver nyata, membiarkan model memanggil tool `message`, dan mengamati
  reaksi WhatsApp native. `whatsapp-agent-message-action-upload-file` memakai
  postur yang sama untuk `message(action=upload-file)` dan mengamati media
  WhatsApp native. `whatsapp-group-agent-message-action-react` dan
  `whatsapp-group-agent-message-action-upload-file` membuktikan aksi yang
  terlihat pengguna yang sama di grup WhatsApp nyata.
- Fanout grup: `whatsapp-broadcast-group-fanout` dimulai dari satu pesan grup
  WhatsApp yang menyebutkan bot dan memverifikasi balasan terlihat yang berbeda dari `main` dan
  `qa-second`.
- Aktivasi grup: `whatsapp-group-activation-always` mengubah sesi grup nyata
  ke `/activation always`, membuktikan pesan grup tanpa mention membangunkan
  agent, lalu memulihkan `/activation mention`. `whatsapp-group-reply-to-bot-triggers`
  menanam balasan bot, mengirim balasan kutipan native kepadanya tanpa mention
  eksplisit, dan memverifikasi agent bangun dari konteks balasan tersebut.
- Media masuk dan pesan terstruktur: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Ini mengirim event gambar, audio, dokumen, lokasi, kontak, stiker,
  dan reaksi WhatsApp nyata melalui driver.
- Probe kontrak Gateway langsung:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Ini sengaja melewati prompting model dan
  membuktikan kontrak deterministik `send`, `poll`, dan `message.action`
  Gateway/channel.
- Cakupan kontrol akses: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Persetujuan native: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Reaksi status: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

Katalog saat ini berisi 50 skenario. Lane default `live-frontier`
dibuat kecil dengan 10 skenario untuk cakupan smoke yang cepat. Lane default
`mock-openai` menjalankan 44 skenario deterministik melalui transport WhatsApp nyata sambil
hanya memock output model. Skenario persetujuan dan beberapa pemeriksaan yang
lebih berat/memblokir tetap eksplisit berdasarkan id skenario.

Driver QA WhatsApp mengamati event live terstruktur (`text`, `media`,
`location`, `reaction`, dan `poll`) serta dapat secara aktif mengirim media, poll,
kontak, lokasi, dan stiker. QA Lab mengimpor driver tersebut melalui surface paket
`@openclaw/whatsapp/api.js`, bukan menjangkau file runtime WhatsApp privat.
Untuk observasi grup, `fromJid` adalah JID grup sementara
`participantJid` dan `fromPhoneE164` mengidentifikasi pengirim peserta. Konten
pesan disunting secara default. Probe Gateway langsung
poll, upload-file, media, poll grup, media grup, dan reply-shape adalah pemeriksaan kontrak transport/API;
semuanya tidak diperlakukan sebagai bukti bahwa prompt pengguna membuat agent memilih
aksi yang sama. Bukti aksi jalur pengguna berasal dari skenario seperti
`whatsapp-agent-message-action-react` dan
`whatsapp-group-agent-message-action-react`, tempat driver mengirim pesan
WhatsApp normal dan QA Lab mengamati artefak WhatsApp native yang dihasilkan.
Laporan WhatsApp menyertakan postur setiap skenario (`user-path`, `direct-gateway`,
atau `native-approval`) sehingga bukti tidak dapat disalahartikan sebagai kontrak
yang lebih kuat daripada yang benar-benar dibuktikannya.

Artefak output:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - entri bukti untuk pemeriksaan transport live.
- `whatsapp-qa-observed-messages.json` - isi disunting kecuali `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Pool kredensial Convex

Lane Telegram, Discord, Slack, dan WhatsApp dapat menyewa kredensial dari pool Convex bersama alih-alih membaca env var di atas. Teruskan `--credential-source convex` (atau atur `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab memperoleh lease eksklusif, mengirim Heartbeat selama run berlangsung, dan melepaskannya saat shutdown. Jenis pool adalah `"telegram"`, `"discord"`, `"slack"`, dan `"whatsapp"`.

Bentuk payload yang divalidasi broker pada `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` harus berupa string chat-id numerik.
- Pengguna nyata Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - hanya untuk bukti Mantis Telegram Desktop. Lane QA Lab generik tidak boleh memperoleh jenis ini.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - nomor telepon harus berupa string E.164 yang berbeda.

Alur kerja bukti Mantis Telegram Desktop memegang satu lease Convex
`telegram-user` eksklusif untuk driver CLI TDLib dan saksi Telegram Desktop,
lalu melepasnya setelah menerbitkan bukti.

Ketika sebuah PR membutuhkan diff visual deterministik, Mantis dapat menggunakan balasan
model tiruan yang sama di `main` dan di head PR sementara pemformat Telegram atau lapisan
pengiriman berubah. Default tangkapan disetel untuk komentar PR: kelas Crabbox
standar, rekaman desktop 24fps, GIF gerak 24fps, dan lebar pratinjau 1920px.
Komentar sebelum/sesudah harus menerbitkan bundel bersih yang hanya berisi GIF
yang dimaksud.

Lane Slack juga dapat menggunakan pool. Pemeriksaan bentuk payload Slack saat ini berada di runner QA Slack, bukan di broker; gunakan `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, dengan id kanal Slack seperti `Cxxxxxxxxxx`. Lihat [Menyiapkan ruang kerja Slack](#setting-up-the-slack-workspace) untuk penyediaan aplikasi dan scope.

Env var operasional dan kontrak endpoint broker Convex berada di [Pengujian → Kredensial Telegram bersama melalui Convex](/id/help/testing#shared-telegram-credentials-via-convex-v1) (nama bagian tersebut lebih lama daripada pool multi-kanal; semantik lease dibagikan di seluruh jenis).

## Seed berbasis repo

Aset seed berada di `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Ini sengaja ada di git agar rencana QA terlihat oleh manusia dan
agent.

`qa-lab` harus tetap menjadi runner skenario YAML generik. Setiap berkas YAML skenario adalah
sumber kebenaran untuk satu eksekusi pengujian dan harus mendefinisikan:

- `title` tingkat atas
- metadata `scenario`
- metadata kategori, capability, lane, dan risiko opsional di `scenario`
- referensi docs dan kode di `scenario`
- persyaratan plugin opsional di `scenario`
- patch konfigurasi Gateway opsional di `scenario`
- `flow` tingkat atas yang dapat dieksekusi untuk skenario flow, atau `scenario.execution.kind` /
  `scenario.execution.path` untuk skenario Vitest dan Playwright

Permukaan runtime pakai ulang yang mendukung `flow` boleh tetap generik
dan lintas area. Misalnya, skenario YAML dapat menggabungkan helper sisi transport
dengan helper sisi browser yang menggerakkan Control UI tertanam melalui
seam Gateway `browser.request` tanpa menambahkan runner kasus khusus.

Berkas skenario harus dikelompokkan berdasarkan capability produk, bukan folder
pohon sumber. Pertahankan ID skenario tetap stabil saat berkas dipindahkan; gunakan `docsRefs` dan `codeRefs`
untuk keterlacakan implementasi.

Daftar baseline harus tetap cukup luas untuk mencakup:

- chat DM dan kanal
- perilaku thread
- lifecycle tindakan pesan
- callback cron
- recall memori
- pergantian model
- handoff subagent
- pembacaan repo dan pembacaan docs
- satu tugas build kecil seperti Lobster Invaders

## Lane mock penyedia

`qa suite` memiliki dua lane mock penyedia lokal:

- `mock-openai` adalah mock OpenClaw yang sadar skenario. Ini tetap menjadi lane mock
  deterministik default untuk QA berbasis repo dan gerbang paritas.
- `aimock` memulai server penyedia berbasis AIMock untuk cakupan protokol,
  fixture, rekam/putar ulang, dan chaos eksperimental. Ini bersifat tambahan dan tidak
  menggantikan dispatcher skenario `mock-openai`.

Implementasi lane penyedia berada di bawah `extensions/qa-lab/src/providers/`.
Setiap penyedia memiliki default, startup server lokal, konfigurasi model gateway,
kebutuhan staging profil auth, dan flag capability live/mock miliknya sendiri. Kode suite dan
gateway bersama harus merutekan melalui registry penyedia, bukan bercabang berdasarkan
nama penyedia.

## Adapter transport

`qa-lab` memiliki seam transport generik untuk skenario QA YAML. `qa-channel` adalah
default sintetis. `crabline` memulai server lokal berbentuk penyedia dan menjalankan
plugin kanal normal OpenClaw terhadapnya. `live` dicadangkan untuk kredensial
penyedia nyata dan kanal eksternal.

Pada tingkat arsitektur, pemisahannya adalah:

- `qa-lab` memiliki eksekusi skenario generik, concurrency worker, penulisan artefak, dan pelaporan.
- Adapter transport memiliki konfigurasi gateway, kesiapan, observasi inbound dan outbound, tindakan transport, dan status transport ternormalisasi.
- Berkas skenario YAML di bawah `qa/scenarios/` mendefinisikan eksekusi pengujian; `qa-lab` menyediakan permukaan runtime pakai ulang yang mengeksekusinya.

### Menambahkan kanal

Menambahkan kanal ke sistem QA YAML membutuhkan implementasi kanal plus
paket skenario yang menguji kontrak kanal tersebut. Untuk cakupan CI smoke, tambahkan
server penyedia lokal Crabline yang sesuai dan ekspos melalui driver `crabline`.

Jangan tambahkan root perintah QA tingkat atas baru ketika host bersama `qa-lab` dapat memiliki flow tersebut.

`qa-lab` memiliki mekanik host bersama:

- root perintah `openclaw qa`
- startup dan teardown suite
- concurrency worker
- penulisan artefak
- pembuatan laporan
- eksekusi skenario
- alias kompatibilitas untuk skenario `qa-channel` yang lebih lama

Plugin runner memiliki kontrak transport:

- cara `openclaw qa <runner>` dipasang di bawah root `qa` bersama
- cara gateway dikonfigurasi untuk transport tersebut
- cara kesiapan diperiksa
- cara event inbound diinjeksi
- cara pesan outbound diobservasi
- cara transkrip dan status transport ternormalisasi diekspos
- cara tindakan berbasis transport dieksekusi
- cara reset atau pembersihan khusus transport ditangani

Batas adopsi minimum untuk kanal baru:

1. Pertahankan `qa-lab` sebagai pemilik root `qa` bersama.
2. Implementasikan runner transport pada seam host `qa-lab` bersama.
3. Pertahankan mekanik khusus transport di dalam plugin runner atau harness kanal.
4. Pasang runner sebagai `openclaw qa <runner>` alih-alih mendaftarkan perintah root pesaing. Plugin runner harus mendeklarasikan `qaRunners` di `openclaw.plugin.json` dan mengekspor array `qaRunnerCliRegistrations` yang sesuai dari `runtime-api.ts`. Jaga `runtime-api.ts` tetap ringan; CLI lazy dan eksekusi runner harus tetap berada di balik entrypoint terpisah.
5. Tulis atau adaptasi skenario YAML di bawah direktori bertema `qa/scenarios/`.
6. Gunakan helper skenario generik untuk skenario baru.
7. Jaga alias kompatibilitas yang ada tetap berfungsi kecuali repo sedang melakukan migrasi yang disengaja.

Aturan keputusannya ketat:

- Jika perilaku dapat diekspresikan sekali di `qa-lab`, tempatkan di `qa-lab`.
- Jika perilaku bergantung pada satu transport kanal, pertahankan di plugin runner atau harness plugin tersebut.
- Jika sebuah skenario membutuhkan capability baru yang dapat digunakan oleh lebih dari satu kanal, tambahkan helper generik alih-alih cabang khusus kanal di `suite.ts`.
- Jika suatu perilaku hanya bermakna untuk satu transport, pertahankan skenario tetap khusus transport dan buat hal itu eksplisit dalam kontrak skenario.

### Nama helper skenario

Helper generik yang disarankan untuk skenario baru:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Alias kompatibilitas tetap tersedia untuk skenario yang ada - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - tetapi penulisan skenario baru harus menggunakan nama generik. Alias tersebut ada untuk menghindari migrasi serentak, bukan sebagai model ke depan.

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari timeline bus yang diamati.
Laporan harus menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

Untuk inventaris skenario yang tersedia - berguna saat mengukur pekerjaan tindak lanjut atau menyambungkan transport baru - jalankan `pnpm openclaw qa coverage` (tambahkan `--json` untuk output yang dapat dibaca mesin).
Saat memilih bukti terfokus untuk perilaku atau path berkas yang disentuh, jalankan `pnpm openclaw qa coverage --match <query>`.
Laporan kecocokan mencari metadata skenario, referensi docs, referensi kode, ID cakupan, plugin, dan persyaratan penyedia, lalu mencetak target `qa suite --scenario ...` yang cocok.
Setiap eksekusi `qa suite` menulis artefak tingkat atas `qa-evidence.json`,
`qa-suite-summary.json`, dan `qa-suite-report.md` untuk kumpulan
skenario yang dipilih. Skenario yang mendeklarasikan `execution.kind: vitest` atau
`execution.kind: playwright` menjalankan path pengujian yang sesuai dan juga menulis
log per skenario. Skenario yang mendeklarasikan `execution.kind: script` menjalankan
produser bukti di `execution.path` melalui `node --import tsx` (dengan
`${outputDir}` dan `${scenarioId}` diekspansi di `execution.args`); produser
menulis `qa-evidence.json` miliknya sendiri, yang entrinya diimpor ke output
suite dan path artefaknya diselesaikan relatif terhadap
`qa-evidence.json` produser tersebut. Ketika `qa suite` dicapai melalui
`qa run --qa-profile`, `qa-evidence.json` yang sama juga menyertakan ringkasan
scorecard profil untuk kategori taksonomi yang dipilih.
Perlakukan ini sebagai bantuan penemuan, bukan pengganti gerbang; skenario yang dipilih tetap membutuhkan mode penyedia, transport live, Multipass, Testbox, atau lane rilis yang tepat untuk perilaku yang diuji.
Untuk konteks scorecard, lihat [Scorecard kematangan](/id/maturity/scorecard).

Untuk pemeriksaan karakter dan gaya, jalankan skenario yang sama di beberapa ref model live
dan tulis laporan Markdown yang dinilai:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Perintah ini menjalankan proses anak Gateway QA lokal, bukan Docker. Skenario evaluasi karakter harus mengatur persona melalui `SOUL.md`, lalu menjalankan giliran pengguna biasa seperti chat, bantuan workspace, dan tugas file kecil. Model kandidat tidak boleh diberi tahu bahwa model tersebut sedang dievaluasi. Perintah ini mempertahankan setiap transkrip lengkap, mencatat statistik dasar eksekusi, lalu meminta model penilai dalam mode cepat dengan penalaran `xhigh` jika didukung untuk memeringkat eksekusi berdasarkan kewajaran, vibe, dan humor.
Gunakan `--blind-judge-models` saat membandingkan penyedia: prompt penilai tetap mendapatkan setiap transkrip dan status eksekusi, tetapi referensi kandidat diganti dengan label netral seperti `candidate-01`; laporan memetakan peringkat kembali ke referensi asli setelah penguraian.
Eksekusi kandidat secara default menggunakan pemikiran `high`, dengan `medium` untuk GPT-5.5 dan `xhigh` untuk referensi evaluasi OpenAI lama yang mendukungnya. Timpa kandidat tertentu secara inline dengan
`--model provider/model,thinking=<level>`. `--thinking <level>` tetap mengatur fallback global, dan bentuk lama `--model-thinking <provider/model=level>` dipertahankan untuk kompatibilitas.
Referensi kandidat OpenAI secara default menggunakan mode cepat sehingga pemrosesan prioritas digunakan jika penyedia mendukungnya. Tambahkan `,fast`, `,no-fast`, atau `,fast=false` secara inline saat satu kandidat atau penilai memerlukan penimpaan. Berikan `--fast` hanya saat Anda ingin memaksa mode cepat aktif untuk setiap model kandidat. Durasi kandidat dan penilai dicatat dalam laporan untuk analisis benchmark, tetapi prompt penilai secara eksplisit mengatakan untuk tidak memeringkat berdasarkan kecepatan.
Eksekusi model kandidat dan penilai keduanya secara default menggunakan concurrency 16. Turunkan
`--concurrency` atau `--judge-concurrency` saat batas penyedia atau tekanan Gateway lokal membuat eksekusi terlalu berisik.
Saat tidak ada kandidat `--model` yang diberikan, evaluasi karakter secara default menggunakan
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, dan
`google/gemini-3.1-pro-preview` saat tidak ada `--model` yang diberikan.
Saat tidak ada `--judge-model` yang diberikan, penilai secara default menggunakan
`openai/gpt-5.5,thinking=xhigh,fast` dan
`anthropic/claude-opus-4-8,thinking=high`.

## Dokumen terkait

- [Matrix QA](/id/concepts/qa-matrix)
- [Kartu skor kematangan](/id/maturity/scorecard)
- [Paket benchmark agen pribadi](/id/concepts/personal-agent-benchmark-pack)
- [Channel QA](/id/channels/qa-channel)
- [Pengujian](/id/help/testing)
- [Dasbor](/id/web/dashboard)
