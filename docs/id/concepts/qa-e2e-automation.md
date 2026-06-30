---
read_when:
    - Memahami bagaimana rangkaian QA saling terintegrasi
    - Memperluas qa-lab, qa-channel, atau adaptor transport
    - Menambahkan skenario QA yang didukung repo
    - Membangun otomatisasi QA dengan realisme lebih tinggi di sekitar dasbor Gateway
summary: 'Ikhtisar stack QA: qa-lab, qa-channel, skenario berbasis repo, jalur transport langsung, adaptor transport, dan pelaporan.'
title: Ikhtisar QA
x-i18n:
    generated_at: "2026-06-30T14:25:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bffd191f985255f5c830d4e3d1c4ffa250097848195bc58d74104474448e3e1
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Stack QA privat dimaksudkan untuk menguji OpenClaw dengan cara yang lebih realistis
dan berbentuk channel daripada yang bisa dilakukan oleh satu unit test.

Bagian saat ini:

- `extensions/qa-channel`: channel pesan sintetis dengan permukaan DM, channel, thread,
  reaction, edit, dan delete.
- `extensions/qa-lab`: UI debugger dan bus QA untuk mengamati transkrip,
  menyuntikkan pesan masuk, dan mengekspor laporan Markdown.
- `extensions/qa-matrix`, plugin runner masa depan: adapter transport langsung yang
  menggerakkan channel nyata di dalam gateway QA turunan.
- `qa/`: aset seed berbasis repo untuk tugas kickoff dan skenario QA baseline.
- [Mantis](/id/concepts/mantis): verifikasi langsung sebelum dan sesudah untuk bug yang
  membutuhkan transport nyata, tangkapan layar browser, status VM, dan bukti PR.

## Permukaan perintah

Setiap alur QA berjalan di bawah `pnpm openclaw qa <subcommand>`. Banyak yang memiliki alias skrip `pnpm qa:*`;
kedua bentuk didukung.

| Perintah                                            | Tujuan                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Pemeriksaan mandiri QA bawaan tanpa `--qa-profile`; runner profil maturitas berbasis taksonomi dengan `--qa-profile smoke-ci`, `--qa-profile release`, atau `--qa-profile all`.                                                                                       |
| `qa suite`                                          | Menjalankan skenario berbasis repo terhadap lane gateway QA. Alias: `pnpm openclaw qa suite --runner multipass` untuk VM Linux sekali pakai.                                                                                                                           |
| `qa coverage`                                       | Mencetak inventaris cakupan skenario YAML (`--json` untuk keluaran mesin).                                                                                                                                                                                             |
| `qa parity-report`                                  | Membandingkan dua file `qa-suite-summary.json` dan menulis laporan paritas agentic, atau menggunakan `--runtime-axis --token-efficiency` untuk menulis laporan paritas runtime Codex-vs-OpenClaw dan efisiensi token dari satu ringkasan pasangan runtime.             |
| `qa character-eval`                                 | Menjalankan skenario QA karakter di beberapa model langsung dengan laporan yang dinilai. Lihat [Pelaporan](#reporting).                                                                                                                                                |
| `qa manual`                                         | Menjalankan prompt sekali jalan terhadap lane provider/model yang dipilih.                                                                                                                                                                                              |
| `qa ui`                                             | Memulai UI debugger QA dan bus QA lokal (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                     |
| `qa docker-build-image`                             | Membangun image Docker QA yang sudah dipanggang sebelumnya.                                                                                                                                                                                                             |
| `qa docker-scaffold`                                | Menulis scaffold docker-compose untuk dashboard QA + lane gateway.                                                                                                                                                                                                      |
| `qa up`                                             | Membangun situs QA, memulai stack berbasis Docker, mencetak URL (alias: `pnpm qa:lab:up`; varian `:fast` menambahkan `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                          |
| `qa aimock`                                         | Memulai hanya server provider AIMock.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Memulai hanya server provider `mock-openai` yang sadar skenario.                                                                                                                                                                                                       |
| `qa credentials doctor` / `add` / `list` / `remove` | Mengelola pool kredensial Convex bersama.                                                                                                                                                                                                                              |
| `qa matrix`                                         | Lane transport langsung terhadap homeserver Tuwunel sekali pakai. Lihat [QA Matrix](/id/concepts/qa-matrix).                                                                                                                                                             |
| `qa telegram`                                       | Lane transport langsung terhadap grup privat Telegram nyata.                                                                                                                                                                                                           |
| `qa discord`                                        | Lane transport langsung terhadap channel guild privat Discord nyata.                                                                                                                                                                                                    |
| `qa slack`                                          | Lane transport langsung terhadap channel privat Slack nyata.                                                                                                                                                                                                           |
| `qa whatsapp`                                       | Lane transport langsung terhadap akun WhatsApp Web nyata.                                                                                                                                                                                                              |
| `qa mantis`                                         | Runner verifikasi sebelum dan sesudah untuk bug transport langsung, dengan bukti reaction status Discord, smoke desktop/browser Crabbox, dan smoke Slack-in-VNC. Lihat [Mantis](/id/concepts/mantis) dan [Runbook Mantis Slack Desktop](/id/concepts/mantis-slack-desktop-runbook). |

`qa run` berbasis profil membaca keanggotaan dari `taxonomy.yaml`, lalu mengirimkan
skenario yang diselesaikan melalui `qa suite`. `--surface` dan
`--category` memfilter profil yang dipilih, bukan mendefinisikan lane terpisah.
`qa-evidence.json` yang dihasilkan menyertakan ringkasan scorecard profil dengan
jumlah kategori yang dipilih dan ID cakupan yang hilang; entri bukti individual
tetap menjadi sumber kebenaran untuk pengujian, peran cakupan, dan hasil.
ID cakupan fitur taksonomi adalah target bukti yang tepat, bukan alias. Cakupan
skenario primer memenuhi ID yang cocok; cakupan sekunder tetap bersifat nasihat.
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

Gunakan `smoke-ci` untuk bukti profil deterministik dengan provider model tiruan dan
server provider lokal Crabline. Gunakan `release` untuk bukti Stable/LTS terhadap channel
langsung. Gunakan `all` hanya untuk menjalankan bukti taksonomi lengkap secara eksplisit; ini memilih
setiap kategori maturitas aktif dan dapat dikirim melalui workflow `QA Profile
Evidence` dengan `qa_profile=all`. Ketika sebuah perintah juga membutuhkan profil root OpenClaw,
letakkan profil root sebelum perintah QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Alur operator

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: dashboard Gateway (Control UI) dengan agent.
- Kanan: QA Lab, menampilkan transkrip mirip Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Itu membangun situs QA, memulai lane gateway berbasis Docker, dan mengekspos halaman
QA Lab tempat operator atau loop otomasi dapat memberikan misi QA kepada agent,
mengamati perilaku channel nyata, dan mencatat apa yang berhasil, gagal, atau
tetap terblokir.

Untuk iterasi UI QA Lab lokal yang lebih cepat tanpa membangun ulang image Docker setiap kali,
mulai stack dengan bundle QA Lab yang dipasang melalui bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mempertahankan layanan Docker pada image yang sudah dibangun dan memasang
`extensions/qa-lab/web/dist` ke dalam kontainer `qa-lab` melalui bind mount. `qa:lab:watch`
membangun ulang bundle itu saat ada perubahan, dan browser memuat ulang otomatis saat hash aset QA Lab
berubah.

Untuk smoke sinyal OpenTelemetry lokal, jalankan:

```bash
pnpm qa:otel:smoke
```

Skrip itu memulai receiver OTLP/HTTP lokal, menjalankan skenario QA `otel-trace-smoke`
dengan plugin `diagnostics-otel` diaktifkan, lalu memastikan trace,
metrik, dan log diekspor. Skrip ini mendekode span trace protobuf yang diekspor
dan memeriksa bentuk kritis rilis:
`openclaw.run`, `openclaw.harness.run`, span panggilan model konvensi semantik GenAI terbaru,
`openclaw.context.assembled`, dan `openclaw.message.delivery`
harus ada. Smoke memaksa
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, sehingga span panggilan model
harus menggunakan nama `{gen_ai.operation.name} {gen_ai.request.model}`;
panggilan model tidak boleh mengekspor `StreamAbandoned` pada turn yang berhasil; ID diagnostik mentah dan
atribut `openclaw.content.*` harus tetap berada di luar trace. Payload OTLP mentah
tidak boleh berisi sentinel prompt, sentinel respons, atau kunci sesi QA.
Skrip ini menulis `otel-smoke-summary.json` di sebelah artefak suite QA.

Untuk smoke OpenTelemetry berbasis collector, jalankan:

```bash
pnpm qa:otel:collector-smoke
```

Lane itu menempatkan kontainer Docker OpenTelemetry Collector nyata di depan
receiver lokal yang sama. Gunakan ini saat mengubah wiring endpoint, kompatibilitas
collector, atau perilaku ekspor OTLP yang dapat disamarkan oleh receiver dalam proses.

Untuk smoke scrape Prometheus yang dilindungi, jalankan:

```bash
pnpm qa:prometheus:smoke
```

Alias tersebut menjalankan skenario QA `docker-prometheus-smoke` dengan
`diagnostics-prometheus` diaktifkan, memverifikasi scrape tanpa autentikasi ditolak,
lalu memeriksa bahwa scrape terautentikasi menyertakan keluarga metrik yang
kritis untuk rilis tanpa konten prompt, konten respons, pengenal diagnostik mentah,
token autentikasi, atau jalur lokal.

Untuk menjalankan kedua smoke observabilitas secara berurutan, gunakan:

```bash
pnpm qa:observability:smoke
```

Untuk lane OpenTelemetry berbasis kolektor plus smoke scrape Prometheus
terproteksi, gunakan:

```bash
pnpm qa:observability:collector-smoke
```

QA observabilitas tetap hanya untuk checkout sumber. Tarball npm sengaja
menghilangkan QA Lab, sehingga lane rilis Docker paket tidak menjalankan perintah
`qa`. Gunakan `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke`, atau
`pnpm qa:observability:smoke` dari checkout sumber yang sudah dibangun saat
mengubah instrumentasi diagnostik.

Untuk lane smoke Matrix dengan transport nyata yang tidak memerlukan kredensial
penyedia model, jalankan profil cepat dengan penyedia OpenAI tiruan yang deterministik:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Untuk lane penyedia live-frontier, berikan kredensial yang kompatibel dengan
OpenAI secara eksplisit:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

Referensi CLI lengkap, katalog profil/skenario, variabel env, dan tata letak artefak untuk lane ini ada di [QA Matrix](/id/concepts/qa-matrix). Sekilas: lane ini menyediakan homeserver Tuwunel sekali pakai di Docker, mendaftarkan pengguna driver/SUT/observer sementara, menjalankan Plugin Matrix nyata di dalam Gateway QA turunan yang dibatasi ke transport tersebut (tanpa `qa-channel`), lalu menulis laporan Markdown, ringkasan JSON, artefak observed-events, dan log output gabungan di bawah `.artifacts/qa-e2e/matrix-<timestamp>/`.

Skenario mencakup perilaku transport yang tidak dapat dibuktikan menyeluruh oleh pengujian unit: gating mention, kebijakan allow-bot, allowlist, balasan tingkat atas dan berutas, perutean DM, penanganan reaksi, penekanan edit masuk, dedupe replay setelah mulai ulang, pemulihan dari gangguan homeserver, pengiriman metadata persetujuan, penanganan media, serta alur bootstrap/pemulihan/verifikasi E2EE Matrix. Profil CLI E2EE juga menjalankan `openclaw matrix encryption setup` dan perintah verifikasi melalui homeserver sekali pakai yang sama sebelum memeriksa balasan Gateway.

Discord juga memiliki skenario opt-in khusus Mantis untuk reproduksi bug. Gunakan
`--scenario discord-status-reactions-tool-only` untuk timeline reaksi status
eksplisit, atau `--scenario discord-thread-reply-filepath-attachment` untuk membuat
utas Discord nyata dan memverifikasi bahwa `message.thread-reply` mempertahankan
lampiran `filePath`. Skenario ini tetap berada di luar lane Discord live default
karena merupakan probe repro sebelum/sesudah, bukan cakupan smoke yang luas.
Workflow Mantis lampiran utas juga dapat menambahkan video saksi Discord Web
yang sudah login ketika `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` atau
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` dikonfigurasi di lingkungan QA.
Profil viewer tersebut hanya untuk tangkapan visual; keputusan lulus/gagal
tetap berasal dari oracle REST Discord.

CI menggunakan permukaan perintah yang sama di `.github/workflows/qa-live-transports-convex.yml`.
Jalankan terjadwal dan manual default mengeksekusi profil Matrix cepat dengan
kredensial live-frontier yang disediakan QA, `--fast`, dan
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. `matrix_profile=all` manual
menyebar ke lima shard profil.

Untuk lane smoke Telegram, Discord, Slack, dan WhatsApp dengan transport nyata:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Semuanya menargetkan channel nyata yang sudah ada dengan dua bot atau akun (driver + SUT). Variabel env wajib, daftar skenario, artefak output, dan pool kredensial Convex didokumentasikan dalam [referensi QA Telegram, Discord, Slack, dan WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) di bawah.

Untuk menjalankan VM desktop Slack penuh dengan penyelamatan VNC, jalankan:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Perintah tersebut menyewa mesin desktop/browser Crabbox, menjalankan lane live Slack
di dalam VM, membuka Slack Web di browser VNC, menangkap desktop, dan menyalin
`slack-qa/`, `slack-desktop-smoke.png`, dan `slack-desktop-smoke.mp4`
ketika perekaman video tersedia kembali ke direktori artefak Mantis. Sewa
desktop/browser Crabbox menyediakan alat tangkap dan paket pembantu browser/native-build
sejak awal, sehingga skenario hanya seharusnya memasang fallback pada sewa yang lebih lama.
Mantis melaporkan timing total dan per fase dalam
`mantis-slack-desktop-smoke-report.md` sehingga run yang lambat menunjukkan apakah waktu tersita untuk
pemanasan sewa, pengambilan kredensial, setup jarak jauh, atau penyalinan artefak. Gunakan ulang
`--lease-id <cbx_...>` setelah login ke Slack Web secara manual melalui VNC;
sewa yang digunakan ulang juga menjaga cache store pnpm Crabbox tetap hangat. Default
`--hydrate-mode source` memverifikasi dari checkout sumber dan menjalankan install/build
di dalam VM. Gunakan `--hydrate-mode prehydrated` hanya ketika workspace jarak jauh yang digunakan ulang
sudah memiliki `node_modules` dan `dist/` yang sudah dibangun; mode tersebut melewati
langkah install/build yang mahal dan gagal tertutup ketika workspace belum siap.
Dengan `--gateway-setup`, Mantis meninggalkan Gateway Slack OpenClaw persisten
yang berjalan di dalam VM pada port `38973`; tanpanya, perintah menjalankan lane QA Slack
bot-ke-bot normal dan keluar setelah tangkapan artefak.

Untuk membuktikan UI persetujuan Slack native dengan bukti desktop, jalankan mode checkpoint persetujuan Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Mode ini saling eksklusif dengan `--gateway-setup`. Mode ini menjalankan skenario
persetujuan Slack, menolak id skenario non-persetujuan, menunggu di setiap status
persetujuan tertunda dan terselesaikan, merender pesan Slack API yang diamati ke
`approval-checkpoints/<scenario>-pending.png` dan
`approval-checkpoints/<scenario>-resolved.png`, lalu gagal jika checkpoint,
bukti pesan, acknowledgement, atau screenshot hasil render mana pun hilang atau kosong.
Sewa CI dingin mungkin masih menampilkan sign-in Slack di `slack-desktop-smoke.png`;
gambar checkpoint persetujuan adalah bukti visual untuk lane ini.

Checklist operator, perintah dispatch workflow GitHub, kontrak komentar bukti,
tabel keputusan hydrate-mode, interpretasi timing, dan langkah penanganan kegagalan
ada di [Runbook Desktop Slack Mantis](/id/concepts/mantis-slack-desktop-runbook).

Untuk tugas desktop gaya agen/CV, jalankan:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` menyewa atau menggunakan ulang mesin desktop/browser Crabbox, memulai
`crabbox record --while`, menggerakkan browser yang terlihat melalui
`visual-driver` bersarang, menangkap `visual-task.png`, menjalankan `openclaw infer image describe`
terhadap screenshot ketika `--vision-mode image-describe` dipilih, dan
menulis `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json`, dan `mantis-visual-task-report.md`.
Ketika `--expect-text` disetel, prompt vision meminta verdict JSON terstruktur
dan hanya lulus ketika model melaporkan bukti terlihat yang positif; respons
negatif yang hanya mengutip teks target menggagalkan asersi.
Gunakan `--vision-mode metadata` untuk smoke tanpa model yang membuktikan plumbing desktop,
browser, screenshot, dan video tanpa memanggil penyedia pemahaman gambar.
Perekaman adalah artefak wajib untuk `visual-task`; jika Crabbox tidak merekam
`visual-task.mp4` yang tidak kosong, tugas gagal bahkan ketika visual driver
lulus. Saat gagal, Mantis mempertahankan sewa untuk VNC kecuali tugas sudah
lulus dan `--keep-lease` tidak disetel.

Sebelum menggunakan kredensial live terpool, jalankan:

```bash
pnpm openclaw qa credentials doctor
```

Doctor memeriksa env broker Convex, memvalidasi pengaturan endpoint, dan memverifikasi keterjangkauan admin/list ketika secret maintainer ada. Doctor hanya melaporkan status disetel/hilang untuk secret.

## Cakupan transport live

Lane transport live berbagi satu kontrak alih-alih masing-masing menciptakan bentuk daftar skenarionya sendiri. `qa-channel` adalah suite perilaku produk sintetis yang luas dan bukan bagian dari matriks cakupan transport live.

Runner transport live harus mengimpor id skenario bersama, pembantu cakupan
baseline, dan pembantu pemilihan skenario dari
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Lane     | Canary | Gating mention | Bot-ke-bot | Blokir allowlist | Balasan tingkat atas | Balasan kutipan | Lanjutkan setelah restart | Tindak lanjut utas | Isolasi utas | Observasi reaksi | Perintah bantuan | Registrasi perintah native |
| -------- | ------ | -------------- | ---------- | ---------------- | -------------------- | ---------------- | ------------------------- | ------------------ | ------------ | ---------------- | ---------------- | -------------------------- |
| Matrix   | x      | x              | x          | x                | x                    |                  | x                         | x                  | x            | x                |                  |                            |
| Telegram | x      | x              | x          |                  |                      |                  |                           |                    |              |                  | x                |                            |
| Discord  | x      | x              | x          |                  |                      |                  |                           |                    |              |                  |                  | x                          |
| Slack    | x      | x              | x          | x                | x                    |                  | x                         | x                  | x            |                  |                  |                            |
| WhatsApp | x      | x              |            | x                | x                    | x                | x                         |                    |              | x                | x                |                            |

Ini menjaga `qa-channel` sebagai suite perilaku produk yang luas sementara Matrix,
Telegram, dan transport live lainnya berbagi satu checklist kontrak transport yang eksplisit.

Untuk lane VM Linux sekali pakai tanpa membawa Docker ke jalur QA, jalankan:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Ini mem-boot guest Multipass baru, memasang dependensi, membangun OpenClaw
di dalam guest, menjalankan `qa suite`, lalu menyalin laporan QA normal dan
ringkasan kembali ke `.artifacts/qa-e2e/...` pada host.
Perintah ini menggunakan ulang perilaku pemilihan skenario yang sama seperti `qa suite` pada host.
Run suite host dan Multipass mengeksekusi beberapa skenario terpilih secara paralel
dengan worker Gateway terisolasi secara default. `qa-channel` default ke concurrency
4, dibatasi oleh jumlah skenario yang dipilih. Gunakan `--concurrency <count>` untuk menyesuaikan
jumlah worker, atau `--concurrency 1` untuk eksekusi serial.
Gunakan `--pack personal-agent` untuk menjalankan pack benchmark asisten pribadi. Pemilih
pack bersifat aditif dengan flag `--scenario` berulang: skenario eksplisit
berjalan terlebih dahulu, lalu skenario pack berjalan dalam urutan pack dengan duplikat dihapus.
Gunakan `--pack observability` ketika runner QA kustom sudah menyediakan setup
kolektor OpenTelemetry dan ingin skenario smoke diagnostik OpenTelemetry dan Prometheus
dipilih bersama.
Perintah keluar dengan non-zero ketika skenario mana pun gagal. Gunakan `--allow-failures` ketika
Anda menginginkan artefak tanpa kode keluar gagal.
Run live meneruskan input autentikasi QA yang didukung dan praktis untuk
guest: kunci penyedia berbasis env, jalur konfigurasi penyedia live QA, dan
`CODEX_HOME` ketika ada. Simpan `--output-dir` di bawah root repo agar guest
dapat menulis balik melalui workspace yang di-mount.

## Referensi QA Telegram, Discord, Slack, dan WhatsApp

Matrix memiliki [halaman khusus](/id/concepts/qa-matrix) karena jumlah skenarionya dan penyediaan homeserver yang didukung Docker. Telegram, Discord, Slack, dan WhatsApp berjalan terhadap transport nyata yang sudah ada, jadi referensinya berada di sini.

### Flag CLI bersama

Lane ini mendaftar melalui `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` dan menerima flag yang sama:

| Flag                                  | Default                                            | Deskripsi                                                                                                                                                           |
| ------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Jalankan hanya skenario ini. Dapat diulang.                                                                                                                         |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Tempat laporan, ringkasan, bukti, artefak khusus transport, dan log output ditulis. Path relatif diselesaikan terhadap `--repo-root`.                              |
| `--repo-root <path>`                  | `process.cwd()`                                    | Root repositori saat dipanggil dari cwd netral.                                                                                                                     |
| `--sut-account <id>`                  | `sut`                                              | Id akun sementara di dalam konfigurasi Gateway QA.                                                                                                                  |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` atau `live-frontier` (`live-openai` lama masih berfungsi).                                                                                            |
| `--model <ref>` / `--alt-model <ref>` | default provider                                   | Ref model primer/alternatif.                                                                                                                                        |
| `--fast`                              | nonaktif                                           | Mode cepat provider jika didukung.                                                                                                                                  |
| `--credential-source <env\|convex>`   | `env`                                              | Lihat [pool kredensial Convex](#convex-credential-pool).                                                                                                            |
| `--credential-role <maintainer\|ci>`  | `ci` di CI, selain itu `maintainer`                | Peran yang digunakan saat `--credential-source convex`.                                                                                                             |

Setiap lane keluar dengan non-zero pada skenario apa pun yang gagal. `--allow-failures` menulis artefak tanpa menetapkan kode keluar gagal.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Menargetkan satu grup privat Telegram nyata dengan dua bot berbeda (driver + SUT). Bot SUT harus memiliki nama pengguna Telegram; observasi bot-ke-bot bekerja paling baik saat kedua bot mengaktifkan **Bot-to-Bot Communication Mode** di `@BotFather`.

Env wajib saat `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - id chat numerik (string).
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

Set default implisit selalu mencakup canary, gating mention, balasan perintah native, pengalamatan perintah, dan balasan grup bot-ke-bot. Default `mock-openai` juga menyertakan pemeriksaan deterministik rantai balasan dan streaming pesan akhir. `telegram-current-session-status-tool` tetap opt-in karena hanya stabil saat di-thread langsung setelah canary, bukan setelah balasan perintah native arbitrer. Gunakan `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` untuk mencetak pembagian default/opsional saat ini beserta ref regresi.

Artefak output:

- `telegram-qa-report.md`
- `qa-evidence.json` - entri bukti untuk pemeriksaan transport live, termasuk bidang profil, cakupan, provider, channel, artefak, hasil, dan RTT.

Run Telegram paket menggunakan kontrak kredensial Telegram yang sama. Pengukuran RTT berulang merupakan bagian dari lane live Telegram paket normal; distribusi RTT digabungkan ke dalam `qa-evidence.json` di bawah `result.timing` untuk pemeriksaan RTT yang dipilih.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Saat `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ditetapkan, wrapper live paket menyewa kredensial `kind: "telegram"`, mengekspor env grup/driver/bot SUT yang disewa ke run paket terpasang, melakukan Heartbeat pada sewa, dan melepaskannya saat shutdown. Wrapper paket default ke 20 pemeriksaan RTT dari `telegram-mentioned-message-reply`, timeout RTT 30 detik, dan peran Convex `maintainer` di luar CI saat Convex dipilih. Timpa `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`, atau `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` untuk menyetel pengukuran RTT tanpa membuat perintah RTT terpisah atau format ringkasan khusus Telegram.

### QA Discord

```bash
pnpm openclaw qa discord
```

Menargetkan satu channel guild privat Discord nyata dengan dua bot: bot driver yang dikontrol oleh harness dan bot SUT yang dimulai oleh Gateway OpenClaw anak melalui Plugin Discord bawaan. Memverifikasi penanganan mention channel, bahwa bot SUT telah mendaftarkan perintah native `/help` dengan Discord, dan skenario bukti Mantis opt-in.

Env wajib saat `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - harus cocok dengan id pengguna bot SUT yang dikembalikan oleh Discord (jika tidak, lane gagal cepat).

Opsional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` mempertahankan isi pesan dalam artefak pesan yang diamati.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` memilih channel voice/stage untuk `discord-voice-autojoin`; tanpa ini, skenario memilih channel voice/stage pertama yang terlihat oleh bot SUT.

Skenario (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - skenario voice opt-in. Berjalan sendiri, mengaktifkan `channels.discord.voice.autoJoin`, dan memverifikasi bahwa status voice Discord bot SUT saat ini adalah channel voice/stage target. Kredensial Convex Discord dapat menyertakan `voiceChannelId` opsional; jika tidak, runner menemukan channel voice/stage pertama yang terlihat di guild.
- `discord-status-reactions-tool-only` - skenario Mantis opt-in. Berjalan sendiri karena mengalihkan SUT ke balasan guild selalu-aktif, hanya-tool dengan `messages.statusReactions.enabled=true`, lalu menangkap timeline reaksi REST serta artefak visual HTML/PNG. Laporan sebelum/sesudah Mantis juga mempertahankan artefak MP4 yang disediakan skenario sebagai `baseline.mp4` dan `candidate.mp4`.

Jalankan skenario auto-join voice Discord secara eksplisit:

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

Artefak output:

- `discord-qa-report.md`
- `qa-evidence.json` - entri bukti untuk pemeriksaan transport live.
- `discord-qa-observed-messages.json` - isi disamarkan kecuali `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` dan `discord-status-reactions-tool-only-timeline.png` saat skenario reaksi status berjalan.

### QA Slack

```bash
pnpm openclaw qa slack
```

Menargetkan satu channel privat Slack nyata dengan dua bot berbeda: bot driver yang dikontrol oleh harness dan bot SUT yang dimulai oleh Gateway OpenClaw anak melalui Plugin Slack bawaan.

Env wajib saat `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opsional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` mempertahankan isi pesan dalam artefak pesan yang diamati.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` mengaktifkan checkpoint persetujuan visual untuk Mantis. Runner menulis `<scenario>.pending.json` dan `<scenario>.resolved.json`, lalu menunggu file `.ack.json` yang cocok.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` menimpa timeout pengakuan checkpoint. Default-nya adalah `120000`.

Skenario (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - skenario persetujuan exec Slack native opt-in. Meminta persetujuan exec melalui Gateway, memverifikasi pesan Slack memiliki tombol persetujuan native, menyelesaikannya, dan memverifikasi pembaruan Slack yang terselesaikan.
- `slack-approval-plugin-native` - skenario persetujuan Plugin Slack native opt-in. Mengaktifkan penerusan persetujuan exec dan Plugin bersama-sama agar peristiwa Plugin tidak ditekan oleh routing persetujuan exec, lalu memverifikasi jalur UI Slack native tertunda/terselesaikan yang sama.

Artefak output:

- `slack-qa-report.md`
- `qa-evidence.json` - entri bukti untuk pemeriksaan transport live.
- `slack-qa-observed-messages.json` - isi disamarkan kecuali `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - hanya saat Mantis menetapkan `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; berisi JSON checkpoint, JSON pengakuan, dan tangkapan layar tertunda/terselesaikan.

#### Menyiapkan workspace Slack

Lane memerlukan dua aplikasi Slack berbeda dalam satu workspace, plus channel tempat kedua bot menjadi anggota:

- `channelId` - id `Cxxxxxxxxxx` dari channel yang telah mengundang kedua bot. Gunakan channel khusus; lane memposting pada setiap run.
- `driverBotToken` - token bot (`xoxb-...`) dari aplikasi **Driver**.
- `sutBotToken` - token bot (`xoxb-...`) dari aplikasi **SUT**, yang harus berupa aplikasi Slack terpisah dari driver agar id pengguna botnya berbeda.
- `sutAppToken` - token level aplikasi (`xapp-...`) dari aplikasi SUT dengan `connections:write`, digunakan oleh Socket Mode agar aplikasi SUT dapat menerima peristiwa.

Lebih baik gunakan workspace Slack khusus untuk QA daripada memakai ulang workspace produksi.

Manifest SUT di bawah ini sengaja mempersempit pemasangan produksi Plugin Slack bawaan (`extensions/slack/src/setup-shared.ts:10`) ke izin dan peristiwa yang dicakup oleh suite QA Slack live. Untuk penyiapan channel produksi sebagaimana dilihat pengguna, lihat [penyiapan cepat channel Slack](/id/channels/slack#quick-setup); pasangan Driver/SUT QA sengaja terpisah karena lane memerlukan dua id pengguna bot berbeda dalam satu workspace.

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

Salin _Bot User OAuth Token_ (`xoxb-...`) - itu menjadi `driverBotToken`. Driver hanya perlu memposting pesan dan mengidentifikasi dirinya sendiri; tidak ada peristiwa, tidak ada Socket Mode.

**2. Buat aplikasi SUT**

Ulangi _Create New App → From a manifest_ di workspace yang sama. Aplikasi QA ini sengaja menggunakan versi yang lebih sempit dari manifest produksi Plugin Slack bawaan (`extensions/slack/src/setup-shared.ts:10`): cakupan dan peristiwa reaction dihilangkan karena suite QA Slack langsung belum mencakup penanganan reaction.

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

Setelah Slack membuat aplikasi, lakukan dua hal di halaman pengaturannya:

- _Install to Workspace_ → salin _Bot User OAuth Token_ → itu menjadi `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → tambahkan cakupan `connections:write` → simpan → salin nilai `xapp-...` → itu menjadi `sutAppToken`.

Verifikasi kedua bot memiliki id pengguna yang berbeda dengan memanggil `auth.test` pada setiap token. Runtime membedakan driver dan SUT berdasarkan id pengguna; menggunakan ulang satu aplikasi untuk keduanya akan langsung menggagalkan gerbang mention.

**3. Buat channel**

Di workspace QA, buat channel (mis. `#openclaw-qa`) dan undang kedua bot dari dalam channel:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Salin id `Cxxxxxxxxxx` dari _channel info → About → Channel ID_ - itu menjadi `channelId`. Channel publik berfungsi; jika Anda menggunakan channel privat, kedua aplikasi sudah memiliki `groups:history` sehingga pembacaan riwayat harness tetap berhasil.

**4. Daftarkan kredensial**

Dua opsi. Gunakan env vars untuk debugging satu mesin (atur empat variabel `OPENCLAW_QA_SLACK_*` dan teruskan `--credential-source env`), atau seed pool Convex bersama agar CI dan maintainer lain dapat menyewanya.

Untuk pool Convex, tulis empat field ke file JSON:

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

**5. Verifikasi ujung ke ujung**

Jalankan lane secara lokal untuk mengonfirmasi kedua bot dapat saling berbicara melalui broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Run hijau selesai dalam jauh kurang dari 30 detik dan `slack-qa-report.md` menampilkan `slack-canary` dan `slack-mention-gating` dengan status `pass`. Jika lane tertahan selama ~90 detik dan keluar dengan `Convex credential pool exhausted for kind "slack"`, berarti pool kosong atau setiap baris sedang disewa - `qa credentials list --kind slack --status all --json` akan memberi tahu yang mana.

### QA WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Menargetkan dua akun WhatsApp Web khusus: akun driver yang dikendalikan oleh
harness dan akun SUT yang dimulai oleh Gateway OpenClaw anak melalui
Plugin WhatsApp bawaan.

Env wajib saat `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Opsional:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` mengaktifkan skenario grup seperti
  `whatsapp-mention-gating` dan `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` mempertahankan isi pesan dalam
  artefak pesan yang diamati.

Katalog skenario (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Baseline dan gerbang grup: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`.
- Perintah native: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Perilaku balasan dan output akhir: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`.
- Media masuk dan pesan terstruktur: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`. Ini mengirim peristiwa gambar, audio,
  dokumen, lokasi, kontak, dan stiker WhatsApp nyata melalui driver.
- Cakupan Gateway keluar dan tindakan pesan:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-message-actions`.
- Cakupan kontrol akses: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Persetujuan native: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Reaction status: `whatsapp-status-reactions`.

Katalog saat ini berisi 36 skenario. Lane default `live-frontier`
dibuat kecil dengan 10 skenario untuk cakupan smoke yang cepat. Lane default
`mock-openai` menjalankan 31 skenario deterministik melalui transport WhatsApp nyata sambil
hanya memock output model. Skenario persetujuan dan beberapa pemeriksaan yang lebih berat/memblokir
tetap eksplisit berdasarkan id skenario.

Driver QA WhatsApp mengamati peristiwa langsung terstruktur (`text`, `media`,
`location`, `reaction`, dan `poll`) dan dapat secara aktif mengirim media, poll,
kontak, lokasi, dan stiker. QA Lab mengimpor driver itu melalui permukaan paket
`@openclaw/whatsapp/api.js` alih-alih menjangkau file runtime WhatsApp privat.
Konten pesan disunting secara default. Cakupan poll keluar dan upload-file
berjalan melalui panggilan Gateway `poll` dan `message.action` yang deterministik
alih-alih invocation tool hanya berbasis prompt model.

Artefak output:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - entri bukti untuk pemeriksaan transport langsung.
- `whatsapp-qa-observed-messages.json` - isi disunting kecuali `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Pool kredensial Convex

Lane Telegram, Discord, Slack, dan WhatsApp dapat menyewa kredensial dari pool Convex bersama alih-alih membaca env vars di atas. Teruskan `--credential-source convex` (atau atur `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab memperoleh lease eksklusif, mengirim Heartbeat selama run berlangsung, dan melepasnya saat shutdown. Jenis pool adalah `"telegram"`, `"discord"`, `"slack"`, dan `"whatsapp"`.

Bentuk payload yang divalidasi broker pada `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` harus berupa string chat-id numerik.
- Pengguna nyata Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - hanya bukti Mantis Telegram Desktop. Lane QA Lab generik tidak boleh memperoleh jenis ini.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - nomor telepon harus berupa string E.164 yang berbeda.

Workflow bukti Mantis Telegram Desktop menahan satu lease Convex
`telegram-user` eksklusif untuk driver CLI TDLib dan saksi Telegram Desktop,
lalu melepasnya setelah menerbitkan bukti.

Saat PR membutuhkan diff visual deterministik, Mantis dapat menggunakan balasan model mock yang sama
di `main` dan pada head PR saat formatter Telegram atau lapisan delivery
berubah. Default capture disetel untuk komentar PR: kelas Crabbox standar,
rekaman desktop 24fps, GIF gerakan 24fps, dan lebar pratinjau 1920px.
Komentar sebelum/sesudah harus menerbitkan bundle bersih yang hanya berisi
GIF yang dimaksud.

Lane Slack juga dapat menggunakan pool. Pemeriksaan bentuk payload Slack saat ini berada di runner QA Slack, bukan di broker; gunakan `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, dengan id channel Slack seperti `Cxxxxxxxxxx`. Lihat [Menyiapkan workspace Slack](#setting-up-the-slack-workspace) untuk provisioning aplikasi dan cakupan.

Env vars operasional dan kontrak endpoint broker Convex ada di [Pengujian → Kredensial Telegram bersama melalui Convex](/id/help/testing#shared-telegram-credentials-via-convex-v1) (nama bagian mendahului pool multi-channel; semantik lease dibagi lintas jenis).

## Seed berbasis repo

Aset seed berada di `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Ini sengaja ada di git agar rencana QA terlihat oleh manusia maupun
agent.

`qa-lab` harus tetap menjadi runner skenario YAML generik. Setiap file YAML skenario adalah
sumber kebenaran untuk satu run pengujian dan harus mendefinisikan:

- `title` tingkat atas
- metadata `scenario`
- metadata kategori, capability, lane, dan risiko opsional di `scenario`
- referensi docs dan code di `scenario`
- kebutuhan Plugin opsional di `scenario`
- patch config Gateway opsional di `scenario`
- `flow` tingkat atas yang dapat dieksekusi untuk skenario flow, atau `scenario.execution.kind` /
  `scenario.execution.path` untuk skenario Vitest dan Playwright

Permukaan runtime pakai ulang yang mendukung `flow` boleh tetap generik
dan lintas-fungsi. Misalnya, skenario YAML dapat menggabungkan helper sisi transport
dengan helper sisi browser yang mengendalikan Control UI tersemat melalui
seam Gateway `browser.request` tanpa menambahkan runner kasus khusus.

File skenario sebaiknya dikelompokkan berdasarkan kapabilitas produk, bukan folder
pohon sumber. Jaga ID skenario tetap stabil saat file dipindahkan; gunakan `docsRefs` dan `codeRefs`
untuk keterlacakan implementasi.

Daftar baseline sebaiknya tetap cukup luas untuk mencakup:

- Chat DM dan kanal
- perilaku thread
- siklus hidup tindakan pesan
- callback cron
- pemanggilan ulang memori
- pergantian model
- serah terima subagent
- pembacaan repo dan pembacaan docs
- satu tugas build kecil seperti Lobster Invaders

## Lane mock provider

`qa suite` memiliki dua lane mock provider lokal:

- `mock-openai` adalah mock OpenClaw yang sadar skenario. Ini tetap menjadi lane
  mock deterministik default untuk QA berbasis repo dan gate paritas.
- `aimock` memulai server provider berbasis AIMock untuk cakupan protokol,
  fixture, rekam/putar ulang, dan chaos eksperimental. Ini bersifat aditif dan tidak
  menggantikan dispatcher skenario `mock-openai`.

Implementasi lane provider berada di bawah `extensions/qa-lab/src/providers/`.
Setiap provider memiliki default, startup server lokal, konfigurasi model gateway,
kebutuhan staging profil auth, dan flag kapabilitas live/mock-nya sendiri. Kode suite dan
gateway bersama sebaiknya merutekan melalui registry provider, bukan bercabang berdasarkan
nama provider.

## Adapter transport

`qa-lab` memiliki seam transport generik untuk skenario QA YAML. `qa-channel` adalah
default sintetis. `crabline` memulai server lokal berbentuk provider dan menjalankan
Plugin kanal normal OpenClaw terhadapnya. `live` dicadangkan untuk kredensial provider nyata
dan kanal eksternal.

Pada tingkat arsitektur, pemisahannya adalah:

- `qa-lab` memiliki eksekusi skenario generik, konkurensi worker, penulisan artefak, dan pelaporan.
- Adapter transport memiliki konfigurasi gateway, kesiapan, observasi masuk dan keluar, tindakan transport, dan status transport ternormalisasi.
- File skenario YAML di bawah `qa/scenarios/` mendefinisikan test run; `qa-lab` menyediakan permukaan runtime pakai ulang yang mengeksekusinya.

### Menambahkan kanal

Menambahkan kanal ke sistem QA YAML memerlukan implementasi kanal ditambah
paket skenario yang menguji kontrak kanal. Untuk cakupan CI smoke, tambahkan
server provider lokal Crabline yang cocok dan ekspos melalui driver `crabline`.

Jangan tambahkan root perintah QA tingkat atas baru saat host bersama `qa-lab` dapat memiliki alur tersebut.

`qa-lab` memiliki mekanisme host bersama:

- root perintah `openclaw qa`
- startup dan teardown suite
- konkurensi worker
- penulisan artefak
- pembuatan laporan
- eksekusi skenario
- alias kompatibilitas untuk skenario `qa-channel` lama

Plugin runner memiliki kontrak transport:

- bagaimana `openclaw qa <runner>` dipasang di bawah root `qa` bersama
- bagaimana gateway dikonfigurasi untuk transport tersebut
- bagaimana kesiapan diperiksa
- bagaimana event masuk diinjeksi
- bagaimana pesan keluar diamati
- bagaimana transkrip dan status transport ternormalisasi diekspos
- bagaimana tindakan berbasis transport dieksekusi
- bagaimana reset atau pembersihan khusus transport ditangani

Batas minimum adopsi untuk kanal baru:

1. Pertahankan `qa-lab` sebagai pemilik root `qa` bersama.
2. Implementasikan runner transport pada seam host `qa-lab` bersama.
3. Simpan mekanisme khusus transport di dalam Plugin runner atau harness kanal.
4. Pasang runner sebagai `openclaw qa <runner>`, bukan mendaftarkan perintah root yang bersaing. Plugin runner sebaiknya mendeklarasikan `qaRunners` di `openclaw.plugin.json` dan mengekspor array `qaRunnerCliRegistrations` yang cocok dari `runtime-api.ts`. Jaga `runtime-api.ts` tetap ringan; CLI malas dan eksekusi runner sebaiknya tetap berada di balik entrypoint terpisah.
5. Tulis atau adaptasi skenario YAML di bawah direktori bertema `qa/scenarios/`.
6. Gunakan helper skenario generik untuk skenario baru.
7. Pertahankan alias kompatibilitas yang ada tetap berfungsi kecuali repo sedang melakukan migrasi yang disengaja.

Aturan keputusannya ketat:

- Jika perilaku dapat diekspresikan sekali di `qa-lab`, letakkan di `qa-lab`.
- Jika perilaku bergantung pada satu transport kanal, simpan di Plugin runner atau harness Plugin tersebut.
- Jika sebuah skenario membutuhkan kapabilitas baru yang dapat digunakan lebih dari satu kanal, tambahkan helper generik, bukan cabang khusus kanal di `suite.ts`.
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

Alias kompatibilitas tetap tersedia untuk skenario yang ada - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - tetapi penulisan skenario baru sebaiknya menggunakan nama generik. Alias ada untuk menghindari migrasi satu waktu besar, bukan sebagai model ke depan.

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari linimasa bus yang diamati.
Laporan sebaiknya menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

Untuk inventaris skenario yang tersedia - berguna saat mengukur pekerjaan tindak lanjut atau memasang transport baru - jalankan `pnpm openclaw qa coverage` (tambahkan `--json` untuk output yang dapat dibaca mesin).
Saat memilih bukti terfokus untuk perilaku atau path file yang disentuh, jalankan `pnpm openclaw qa coverage --match <query>`.
Laporan pencocokan mencari metadata skenario, referensi docs, referensi kode, ID cakupan, Plugin, dan persyaratan provider, lalu mencetak target `qa suite --scenario ...` yang cocok.
Setiap run `qa suite` menulis artefak tingkat atas `qa-evidence.json`,
`qa-suite-summary.json`, dan `qa-suite-report.md` untuk kumpulan
skenario yang dipilih. Skenario yang mendeklarasikan `execution.kind: vitest` atau
`execution.kind: playwright` menjalankan path test yang cocok dan juga menulis
log per skenario. Skenario yang mendeklarasikan `execution.kind: script` menjalankan
produsen bukti di `execution.path` melalui `node --import tsx` (dengan
`${outputDir}` dan `${scenarioId}` diperluas di `execution.args`); produsen
menulis `qa-evidence.json` miliknya sendiri, yang entrinya diimpor ke output
suite dan path artefaknya diresolusikan relatif terhadap `qa-evidence.json`
produsen tersebut. Saat `qa suite` dicapai melalui
`qa run --qa-profile`, `qa-evidence.json` yang sama juga menyertakan ringkasan
kartu skor profil untuk kategori taksonomi yang dipilih.
Perlakukan ini sebagai alat bantu penemuan, bukan pengganti gate; skenario yang dipilih tetap membutuhkan mode provider, transport live, Multipass, Testbox, atau lane rilis yang tepat untuk perilaku yang diuji.
Untuk konteks kartu skor, lihat [Kartu skor kematangan](/id/maturity/scorecard).

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

Perintah tersebut menjalankan proses anak gateway QA lokal, bukan Docker. Skenario eval karakter
sebaiknya menetapkan persona melalui `SOUL.md`, lalu menjalankan giliran pengguna biasa
seperti chat, bantuan workspace, dan tugas file kecil. Model kandidat sebaiknya
tidak diberi tahu bahwa model tersebut sedang dievaluasi. Perintah mempertahankan setiap
transkrip penuh, mencatat statistik run dasar, lalu meminta model juri dalam mode cepat dengan
reasoning `xhigh` jika didukung untuk memeringkat run berdasarkan kewajaran, vibe, dan humor.
Gunakan `--blind-judge-models` saat membandingkan provider: prompt juri tetap mendapatkan
setiap transkrip dan status run, tetapi ref kandidat diganti dengan
label netral seperti `candidate-01`; laporan memetakan peringkat kembali ke ref nyata setelah
parsing.
Run kandidat default ke thinking `high`, dengan `medium` untuk GPT-5.5 dan `xhigh`
untuk ref eval OpenAI lama yang mendukungnya. Timpa kandidat tertentu secara inline dengan
`--model provider/model,thinking=<level>`. `--thinking <level>` masih menetapkan
fallback global, dan bentuk lama `--model-thinking <provider/model=level>` tetap
dipertahankan untuk kompatibilitas.
Ref kandidat OpenAI default ke mode cepat agar pemrosesan prioritas digunakan jika
provider mendukungnya. Tambahkan `,fast`, `,no-fast`, atau `,fast=false` secara inline saat satu
kandidat atau juri membutuhkan override. Berikan `--fast` hanya saat Anda ingin
memaksa mode cepat aktif untuk setiap model kandidat. Durasi kandidat dan juri
dicatat dalam laporan untuk analisis benchmark, tetapi prompt juri secara eksplisit mengatakan
untuk tidak memeringkat berdasarkan kecepatan.
Run model kandidat dan juri sama-sama default ke konkurensi 16. Turunkan
`--concurrency` atau `--judge-concurrency` saat batas provider atau tekanan gateway
lokal membuat run terlalu berisik.
Saat tidak ada kandidat `--model` yang diberikan, eval karakter default ke
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, dan
`google/gemini-3.1-pro-preview` saat tidak ada `--model` yang diberikan.
Saat tidak ada `--judge-model` yang diberikan, juri default ke
`openai/gpt-5.5,thinking=xhigh,fast` dan
`anthropic/claude-opus-4-8,thinking=high`.

## Docs terkait

- [Matriks QA](/id/concepts/qa-matrix)
- [Kartu skor kematangan](/id/maturity/scorecard)
- [Paket benchmark agen pribadi](/id/concepts/personal-agent-benchmark-pack)
- [Kanal QA](/id/channels/qa-channel)
- [Pengujian](/id/help/testing)
- [Dasbor](/id/web/dashboard)
