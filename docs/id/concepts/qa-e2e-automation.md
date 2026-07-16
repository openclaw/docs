---
doc-schema-version: 1
read_when:
    - Memahami bagaimana komponen QA saling terintegrasi
    - Memperluas qa-lab, qa-channel, atau adaptor transportasi
    - Menambahkan skenario QA berbasis repositori
    - Membangun otomatisasi QA dengan realisme lebih tinggi di sekitar dasbor Gateway
summary: 'Ikhtisar tumpukan QA: qa-lab, qa-channel, skenario berbasis repositori, jalur transportasi langsung, adaptor transportasi, dan pelaporan.'
title: Ikhtisar QA
x-i18n:
    generated_at: "2026-07-16T18:05:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8dcb506cedb57289f29938eb55b5f11ceedfaabba88364dce8249116010ce859
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Stack QA privat menguji OpenClaw secara realistis dengan bentuk yang menyerupai channel,
yang tidak dapat dilakukan oleh pengujian unit.

Komponen:

- `extensions/qa-channel`: channel pesan sintetis dengan permukaan DM, channel, utas,
  reaksi, pengeditan, dan penghapusan.
- `extensions/qa-lab`: UI debugger, bus QA, profil skenario, dan adaptor
  transport langsung untuk mengamati transkrip, menyuntikkan pesan masuk,
  dan mengekspor laporan Markdown.
- `qa/`: aset seed berbasis repo untuk tugas awal dan skenario QA
  dasar.
- [Mantis](/id/concepts/mantis): verifikasi langsung sebelum/sesudah untuk bug yang
  memerlukan transport nyata, tangkapan layar browser, status VM, dan bukti PR.

## Permukaan perintah

Setiap alur QA berjalan di bawah `pnpm openclaw qa <subcommand>`. Banyak yang memiliki alias skrip
`pnpm qa:*`; kedua bentuk berfungsi.

| Perintah                                             | Tujuan                                                                                                                                                                                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Pemeriksaan mandiri QA terbundel tanpa `--qa-profile`; runner profil kematangan berbasis taksonomi dengan `--qa-profile smoke-ci`, `--qa-profile release`, atau `--qa-profile all`.                                                                                                  |
| `qa suite`                                          | Menjalankan skenario berbasis repo terhadap jalur gateway QA. `--runner multipass` menggunakan VM Linux sekali pakai, bukan host.                                                                                                                                         |
| `qa coverage`                                       | Mencetak inventaris cakupan skenario YAML (`--json` untuk keluaran mesin; `--match <query>` untuk menemukan skenario bagi perilaku yang disentuh; `--tools` untuk cakupan fixture alat runtime).                                                                                  |
| `qa parity-report`                                  | Membandingkan dua file `qa-suite-summary.json` untuk gerbang paritas sumbu model, atau menggunakan `--runtime-axis --token-efficiency` untuk menulis laporan paritas runtime Codex-vs-OpenClaw dan efisiensi token.                                                                          |
| `qa confidence-report`                              | Mengklasifikasikan artefak bukti QA berdasarkan manifes menjadi laporan keyakinan tanpa hal yang tidak diketahui.                                                                                                                                                                               |
| `qa confidence-self-test`                           | Menulis canary kontrol negatif ber-seed yang membuktikan gerbang keyakinan mendeteksi penyimpangan.                                                                                                                                                                                   |
| `qa jsonl-replay`                                   | Memutar ulang transkrip JSONL terkurasi melalui harness pemutaran ulang paritas runtime.                                                                                                                                                                                         |
| `qa character-eval`                                 | Menjalankan skenario QA karakter pada beberapa model langsung dengan laporan yang dinilai. Lihat [Pelaporan](#reporting).                                                                                                                                                        |
| `qa manual`                                         | Menjalankan prompt satu kali terhadap jalur penyedia/model yang dipilih.                                                                                                                                                                                                      |
| `qa ui`                                             | Memulai UI debugger QA dan bus QA lokal (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                |
| `qa docker-build-image`                             | Membangun image Docker QA yang telah disiapkan sebelumnya.                                                                                                                                                                                                                                 |
| `qa docker-scaffold`                                | Menulis scaffold docker-compose untuk dasbor QA + jalur gateway.                                                                                                                                                                                                |
| `qa up`                                             | Membangun situs QA, memulai stack berbasis Docker, mencetak URL (alias: `pnpm qa:lab:up`; varian `:fast` menambahkan `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                              |
| `qa aimock`                                         | Memulai hanya server penyedia AIMock.                                                                                                                                                                                                                              |
| `qa mock-openai`                                    | Memulai hanya server penyedia `mock-openai` yang sadar skenario.                                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Mengelola kumpulan kredensial Convex bersama.                                                                                                                                                                                                                           |
| `qa discord`                                        | Jalur transport langsung terhadap channel guild Discord privat yang nyata.                                                                                                                                                                                                   |
| `qa matrix`                                         | Profil Matrix QA Lab terhadap homeserver Tuwunel sekali pakai. Lihat [Jalur smoke Matrix](#matrix-smoke-lanes).                                                                                                                                                      |
| `qa slack`                                          | Jalur transport langsung terhadap channel Slack privat yang nyata.                                                                                                                                                                                                           |
| `qa telegram`                                       | Jalur transport langsung terhadap grup Telegram privat yang nyata.                                                                                                                                                                                                          |
| `qa whatsapp`                                       | Jalur transport langsung terhadap akun WhatsApp Web nyata.                                                                                                                                                                                                             |
| `qa mantis`                                         | Runner verifikasi sebelum/sesudah untuk bug transport langsung, dengan bukti reaksi status Discord, smoke desktop/browser Crabbox, dan smoke Slack-dalam-VNC. Lihat [Mantis](/id/concepts/mantis) dan [Runbook Desktop Slack Mantis](/id/concepts/mantis-slack-desktop-runbook). |

### `qa run` berbasis profil

`qa run` berbasis profil membaca keanggotaan dari `taxonomy.yaml`, lalu mengirimkan
skenario yang telah diresolusi melalui `qa suite`. `--surface` dan `--category` memfilter
profil yang dipilih alih-alih mendefinisikan jalur terpisah. `qa-evidence.json`
yang dihasilkan menyertakan ringkasan kartu skor profil dengan jumlah kategori
terpilih dan ID cakupan yang hilang; entri bukti individual tetap menjadi
sumber kebenaran untuk pengujian, peran cakupan, dan hasil. ID cakupan fitur
taksonomi adalah target bukti yang tepat, bukan alias: cakupan skenario utama
memenuhi ID yang cocok, sedangkan cakupan sekunder tetap bersifat anjuran. ID cakupan menggunakan
bentuk `namespace.behavior` bertitik dengan segmen alfanumerik/hubung huruf kecil;
ID profil, permukaan, dan kategori masih dapat menggunakan ID taksonomi bertanda
hubung atau bertitik yang ada.

Bukti ringkas menghilangkan `execution` per entri dan menetapkan `evidenceMode: "slim"`;
`smoke-ci` secara default menggunakan bentuk ringkas, dan `--evidence-mode full` memulihkan entri lengkap:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Gunakan `smoke-ci` untuk bukti profil deterministik dengan penyedia model tiruan dan
server penyedia lokal Crabline. Gunakan `release` untuk bukti Stable/LTS terhadap
channel langsung. Gunakan `all` hanya untuk proses bukti taksonomi lengkap yang eksplisit; ini
memilih setiap kategori kematangan aktif dan dapat dikirim melalui alur kerja GitHub Actions `QA
Profile Evidence` dengan `qa_profile=all`. Ketika suatu
perintah juga memerlukan profil root OpenClaw, letakkan profil root sebelum
perintah QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Alur operator

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: Dasbor Gateway (UI Kontrol) dengan agen.
- Kanan: QA Lab, yang menampilkan transkrip bergaya Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Perintah tersebut membangun situs QA, memulai jalur gateway berbasis Docker, dan mengekspos
halaman QA Lab tempat operator atau loop otomatisasi dapat memberikan misi QA
kepada agen, mengamati perilaku channel nyata, serta mencatat apa yang berhasil, gagal, atau
tetap terblokir.

Untuk iterasi UI QA Lab yang lebih cepat tanpa membangun ulang image Docker setiap kali,
mulai stack dengan bundel QA Lab yang dipasang melalui bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mempertahankan layanan Docker pada image yang telah dibuat sebelumnya dan
memasang `extensions/qa-lab/web/dist` melalui bind mount ke dalam kontainer `qa-lab`.
`qa:lab:watch` membangun ulang bundel tersebut saat ada perubahan, dan browser memuat ulang
secara otomatis ketika hash aset QA Lab berubah.

### Smoke observabilitas

<Note>
QA observabilitas tetap hanya tersedia dari checkout sumber. Tarball npm sengaja
tidak menyertakan QA Lab (dan `qa-channel`), sehingga jalur rilis Docker
paket tidak menjalankan perintah `qa`. Jalankan perintah ini dari checkout sumber yang telah dibangun saat
mengubah instrumentasi diagnostik.
</Note>

| Alias                                   | Yang dijalankan                                                                                                                         |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | Penerima OpenTelemetry lokal beserta skenario `otel-trace-smoke` dengan `diagnostics-otel` diaktifkan.                                  |
| `pnpm qa:otel:collector-smoke`          | Jalur yang sama di belakang kontainer Docker OpenTelemetry Collector nyata. Gunakan saat mengubah pengawatan endpoint atau kompatibilitas collector/OTLP. |
| `pnpm qa:prometheus:smoke`              | Skenario `docker-prometheus-smoke` dengan `diagnostics-prometheus` diaktifkan.                                                           |
| `pnpm qa:observability:smoke`           | `qa:otel:smoke` diikuti oleh `qa:prometheus:smoke`.                                                                                     |
| `pnpm qa:observability:collector-smoke` | `qa:otel:collector-smoke` diikuti oleh `qa:prometheus:smoke`.                                                                            |

`qa:otel:smoke` memulai penerima OTLP/HTTP lokal, menjalankan giliran agen
kanal QA minimal, lalu memastikan trace, metrik, dan log diekspor. Proses ini
mendekode span trace protobuf yang diekspor dan memeriksa struktur yang sangat
penting bagi rilis: `openclaw.run`, `openclaw.harness.run`, span pemanggilan
model konvensi semantik GenAI terbaru, `openclaw.context.assembled`, dan
`openclaw.message.delivery` semuanya harus ada. Smoke memaksakan
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, sehingga span pemanggilan model
harus menggunakan nama `{gen_ai.operation.name} {gen_ai.request.model}`; pemanggilan model
tidak boleh mengekspor `StreamAbandoned` pada giliran yang berhasil; ID diagnostik
mentah dan atribut `openclaw.content.*` harus tetap berada di luar trace. Prompt skenario
meminta model membalas dengan penanda tetap dan menahan string rahasia
tetap; payload OTLP mentah tidak boleh memuat salah satunya, maupun kunci
sesi QA yang diturunkan dari ID skenario. Proses ini menulis `otel-smoke-summary.json`
di samping artefak rangkaian QA.

`qa:prometheus:smoke` memverifikasi bahwa scrape tanpa autentikasi ditolak, lalu
memeriksa bahwa scrape terautentikasi menyertakan kelompok metrik yang sangat
penting bagi rilis tanpa konten prompt, konten respons, pengidentifikasi diagnostik mentah, token
autentikasi, atau jalur lokal.

### Jalur smoke Matrix

Untuk jalur smoke Matrix dengan transportasi nyata yang tidak memerlukan kredensial
penyedia model, jalankan profil rilis dengan penyedia OpenAI tiruan deterministik:

```bash
pnpm openclaw qa matrix --provider-mode mock-openai --profile release
```

Untuk jalur penyedia frontier langsung, berikan kredensial yang kompatibel dengan OpenAI
secara eksplisit:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile release
```

`pnpm openclaw qa matrix` biasa menjalankan profil `all` lengkap dan tetap
berlanjut setelah kegagalan skenario. Gunakan `--fail-fast` untuk siklus umpan balik
yang lebih singkat atau ulangi `--scenario <id>` untuk memilih skenario individual; ID skenario
eksplisit lebih diprioritaskan daripada `--profile`.

| Profil       | Skenario  | Tujuan                                                                                                                                  |
| ------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `all`        | 93        | Katalog lengkap (default).                                                                                                              |
| `release`    | 2         | Baseline kanal yang sangat penting bagi rilis dan pemuatan ulang daftar izin langsung.                                                   |
| `fast`       | 12        | Cakupan terfokus untuk utas, reaksi, persetujuan, kebijakan, pembatasan bot, dan balasan terenkripsi.                                    |
| `transport`  | 50        | Utas, perutean DM/ruang, bergabung otomatis, persetujuan, reaksi, mulai ulang, kebijakan penyebutan/daftar izin, pengeditan, dan pengurutan multiaktor. |
| `media`      | 7         | Cakupan gambar, gambar yang dihasilkan, suara, lampiran, media yang tidak didukung, dan media terenkripsi.                               |
| `e2ee-smoke` | 8         | Cakupan minimum untuk balasan terenkripsi, utas, bootstrap, pemulihan, mulai ulang, redaksi, dan kegagalan.                              |
| `e2ee-deep`  | 18        | Kehilangan status, pencadangan, pemulihan kunci, kebersihan perangkat, dan verifikasi SAS/QR/DM.                                         |
| `e2ee-cli`   | 9         | `openclaw matrix encryption setup`, kunci pemulihan, multiakun, perjalanan pulang-pergi Gateway, dan perintah verifikasi mandiri melalui harness. |

Keanggotaan profil dan persyaratan kanal berada bersama skenario Matrix
deklaratif di bawah `qa/scenarios/channels/`. Proses menjalankan memilih driver kanal.
Implementasi langsungnya berada di bawah
`extensions/qa-lab/src/live-transports/matrix/scenarios/`.

Adaptor menyediakan homeserver Tuwunel sekali pakai di Docker (image default
`ghcr.io/matrix-construct/tuwunel:v1.5.1`, nama server `matrix-qa.test`,
port `28008`), mendaftarkan pengguna driver, SUT, dan pengamat sementara, menyiapkan
ruang yang diperlukan, serta merekam batas permintaan/respons yang telah disunting. Adaptor kemudian
menjalankan Plugin Matrix nyata di dalam Gateway QA anak yang dibatasi pada transportasi tersebut
(tanpa `qa-channel`) dan membongkar lingkungan.

Opsi umum:

| Flag                     | Default           | Tujuan                                                                               |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------ |
| `--profile <profile>`    | `all`             | Pilih salah satu profil di atas.                                                     |
| `--scenario <id>`        | -                 | Pilih satu skenario; dapat diulang.                                                  |
| `--fail-fast`            | nonaktif          | Berhenti setelah pemeriksaan atau skenario pertama yang gagal.                       |
| `--allow-failures`       | nonaktif          | Tulis artefak tanpa mengembalikan kode keluar gagal untuk kegagalan skenario.         |
| `--provider-mode <mode>` | `live-frontier`   | Gunakan `mock-openai` untuk pengiriman deterministik atau `live-frontier` untuk penyedia langsung. |
| `--model <ref>`          | default penyedia  | Tetapkan referensi `provider/model` utama.                                         |
| `--alt-model <ref>`      | default penyedia  | Tetapkan model alternatif yang digunakan oleh skenario yang beralih model.           |
| `--fast`                 | nonaktif          | Aktifkan mode cepat penyedia jika didukung.                                          |
| `--output-dir <path>`    | dihasilkan        | Pilih direktori laporan; jalur relatif diselesaikan terhadap `--repo-root`.      |
| `--repo-root <path>`     | direktori saat ini | Jalankan dari direktori kerja netral.                                                |
| `--sut-account <id>`     | `sut`             | Pilih ID akun Matrix dalam konfigurasi Gateway anak.                                 |

QA Matrix tidak menyewa kredensial Matrix bersama: adaptor membuat
pengguna sekali pakai secara lokal, sehingga tidak menerima `--credential-source` atau
`--credential-role`. Ganti image homeserver dengan
`OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`; sesuaikan pernyataan negatif tanpa balasan dengan
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (default `8000`, dibatasi hingga batas waktu
skenario aktif). Perintah sekali jalan biasanya memaksakan keluar bersih setelah
artefak selesai ditulis karena handle native kripto Matrix dapat bertahan setelah pembersihan; tetapkan
`OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` hanya untuk harness pengujian langsung yang
memerlukan perintah untuk kembali.

Setiap proses menjalankan menulis artefak QA Lab normal di bawah direktori keluaran
yang dipilih: `qa-suite-report.md`, `qa-suite-summary.json`, `qa-evidence.json`,
dan manifes `matrix-harness-*/matrix-qa-harness.json` yang telah disunting. Jika pembersihan
gagal, jalankan perintah pemulihan `docker compose ... down --remove-orphans`
yang dicetak. Pada runner lambat, tingkatkan jendela tanpa balasan; pada CI cepat, jendela
yang lebih kecil dapat mempersingkat pernyataan negatif.

Skenario tersebut mencakup perilaku transportasi yang tidak dapat dibuktikan oleh pengujian unit secara
menyeluruh: pembatasan penyebutan, kebijakan mengizinkan bot, daftar izin, balasan tingkat atas
dan berutas, perutean DM, penanganan reaksi, penekanan pengeditan masuk, deduplikasi
pemutaran ulang saat mulai ulang, pemulihan dari gangguan homeserver, pengiriman metadata persetujuan,
penanganan media, serta alur bootstrap/pemulihan/verifikasi E2EE Matrix. Profil
CLI E2EE juga menjalankan `openclaw matrix encryption setup` dan
perintah verifikasi melalui homeserver sekali pakai yang sama sebelum memeriksa
balasan Gateway.

`matrix-room-block-streaming` dan `subagent-thread-spawn` tetap tersedia melalui
pemilihan `--scenario` secara eksplisit, tetapi tetap berada di luar profil default `all`.

CI menggunakan permukaan perintah yang sama di
`.github/workflows/qa-live-transports-convex.yml`. Proses terjadwal dan rilis
menjalankan skenario rilis. Pengiriman `matrix_profile=all` manual menyebarkan
profil `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`;
pengiriman terfokus memilih `fast`, `release`, atau `transport` dalam satu tugas.

### Skenario Discord Mantis

Discord juga memiliki skenario khusus Mantis yang ikut serta secara opsional untuk reproduksi bug. Gunakan
`--scenario discord-status-reactions-tool-only` untuk linimasa reaksi status
eksplisit, atau `--scenario discord-thread-reply-filepath-attachment`
untuk membuat utas Discord nyata dan memverifikasi bahwa `message.thread-reply`
mempertahankan lampiran `filePath`. Skenario ini tetap berada di luar jalur
Discord langsung default karena merupakan probe reproduksi sebelum/sesudah, bukan
cakupan smoke yang luas. Alur kerja Mantis untuk lampiran utas juga dapat menambahkan
video saksi Discord Web yang telah masuk jika
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` atau
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` dikonfigurasi dalam lingkungan
QA. Profil penampil tersebut hanya untuk pengambilan visual; keputusan lulus/gagal
tetap berasal dari oracle REST Discord.

Untuk jalur smoke lain dengan transportasi nyata:

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

Jalur tersebut menargetkan kanal nyata yang sudah ada dengan dua bot atau akun (driver +
SUT). Variabel lingkungan yang diperlukan, daftar skenario, artefak keluaran, dan kumpulan
kredensial Convex untuk keempat transportasi tersebut didokumentasikan dalam
[Referensi QA Discord, Slack, Telegram, dan WhatsApp](#discord-slack-telegram-and-whatsapp-qa-reference)
di bawah.

### Runner tugas desktop dan visual Mantis Slack

Untuk proses VM desktop Slack lengkap dengan penyelamatan VNC, jalankan:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Perintah tersebut menyewa mesin desktop/peramban Crabbox, menjalankan lane langsung Slack
di dalam VM, membuka Slack Web di peramban VNC, merekam desktop,
dan menyalin `slack-qa/`, `slack-desktop-smoke.png`, serta
`slack-desktop-smoke.mp4` (ketika perekaman video tersedia) kembali ke
direktori artefak Mantis. Sewa desktop/peramban Crabbox menyediakan alat
perekaman dan paket pembantu peramban/build native sejak awal, sehingga skenario
hanya perlu menginstal fallback pada sewa lama. Mantis melaporkan waktu total dan
per fase dalam `mantis-slack-desktop-smoke-report.md` agar proses yang lambat menunjukkan
apakah waktu digunakan untuk pemanasan sewa, perolehan kredensial, penyiapan jarak jauh, atau
penyalinan artefak. Gunakan kembali `--lease-id <cbx_...>` setelah masuk ke Slack Web
secara manual melalui VNC; sewa yang digunakan kembali juga menjaga cache penyimpanan pnpm Crabbox
tetap siap. `--hydrate-mode source` default melakukan verifikasi dari checkout sumber dan
menjalankan instalasi/build di dalam VM. Gunakan `--hydrate-mode prehydrated` hanya ketika
ruang kerja jarak jauh yang digunakan kembali sudah memiliki `node_modules` dan `dist/` yang telah di-build;
mode tersebut melewati langkah instalasi/build yang mahal dan gagal secara tertutup ketika
ruang kerja belum siap. Dengan `--gateway-setup`, Mantis membiarkan
Gateway Slack OpenClaw persisten tetap berjalan di dalam VM pada port `38973`; tanpa opsi tersebut,
perintah menjalankan lane QA Slack bot-ke-bot normal dan keluar setelah perekaman
artefak.

Untuk membuktikan UI persetujuan Slack native dengan bukti desktop, jalankan mode
checkpoint persetujuan Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Mode ini saling eksklusif dengan `--gateway-setup`. Mode ini menjalankan skenario
persetujuan Slack, menolak ID skenario non-persetujuan, menunggu pada setiap status
persetujuan tertunda dan terselesaikan, merender pesan API Slack yang diamati ke
`approval-checkpoints/<scenario>-pending.png` dan
`approval-checkpoints/<scenario>-resolved.png`, lalu gagal jika ada checkpoint,
bukti pesan, tanda terima, atau tangkapan layar yang dirender yang tidak ada atau
kosong. Sewa CI baru mungkin masih menampilkan proses masuk Slack dalam
`slack-desktop-smoke.png`; gambar checkpoint persetujuan merupakan bukti visual
untuk lane ini.

Proses checkpoint default mempertahankan dua skenario persetujuan Slack standar.
Untuk merekam salah satu rute persetujuan Codex yang bersifat opsional, pilih secara eksplisit dengan
`--scenario slack-codex-approval-exec-native` atau
`--scenario slack-codex-approval-plugin-native`; Mantis menerima keduanya dan menghasilkan
pasangan tangkapan layar tertunda/terselesaikan yang sama. Runner memperpanjang tenggat waktu checkpoint
dan perintah jarak jauhnya untuk setiap rute Codex yang dipilih agar seluruh
urutan persetujuan, penyelesaian agen, dan pembaruan terselesaikan dapat selesai.

Daftar periksa operator, perintah dispatch alur kerja GitHub, kontrak komentar
bukti, tabel keputusan mode hidrasi, interpretasi waktu, dan langkah
penanganan kegagalan tersedia di
[Runbook Desktop Slack Mantis](/id/concepts/mantis-slack-desktop-runbook).

Untuk tugas desktop bergaya agen/CV, jalankan:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.6-luna
```

`visual-task` menyewa atau menggunakan kembali mesin desktop/peramban Crabbox, memulai
`crabbox record --while`, mengendalikan peramban yang terlihat melalui
`visual-driver` bertingkat, mengambil `visual-task.png`, menjalankan `openclaw infer image
describe` terhadap tangkapan layar ketika `--vision-mode image-describe`
dipilih, dan menulis `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json`, serta
`mantis-visual-task-report.md`. Ketika `--expect-text` ditetapkan, prompt visi
meminta putusan JSON terstruktur (`visible`, `evidence`, `reason`)
dan hanya lolos ketika model melaporkan `visible: true` dengan bukti yang
mengutip teks yang diharapkan; respons `visible: false` yang hanya mengutip
teks target tetap gagal dalam pemeriksaan. Gunakan `--vision-mode metadata` untuk
smoke tanpa model yang membuktikan rangkaian desktop, peramban, tangkapan layar, dan video
tanpa memanggil penyedia pemahaman gambar. Rekaman merupakan
artefak wajib untuk `visual-task`; jika Crabbox tidak merekam
`visual-task.mp4` yang tidak kosong, tugas gagal meskipun pengendali visual lolos. Saat
gagal, Mantis mempertahankan sewa untuk VNC kecuali tugas sudah lolos
dan `--keep-lease` tidak ditetapkan.

### Pemeriksaan kesehatan kumpulan kredensial

Sebelum menggunakan kredensial langsung yang dikumpulkan, jalankan:

```bash
pnpm openclaw qa credentials doctor
```

Doctor memeriksa env broker Convex (`OPENCLAW_QA_CONVEX_SITE_URL`,
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`), memvalidasi pengaturan endpoint, hanya melaporkan
status ditetapkan/tidak ada untuk `OPENCLAW_QA_CONVEX_SECRET_CI` dan
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`, serta memverifikasi keterjangkauan admin/daftar
ketika rahasia pengelola tersedia.

## Cakupan skenario kanonis

`taxonomy.yaml` root mendefinisikan ID cakupan semantik. File YAML skenario
di bawah `qa/scenarios/` memetakan setiap skenario ke ID tersebut dan memiliki metadata
eksekusi: `channel` adalah satu-satunya persyaratan kanal, dan `profiles` mendeklarasikan
keanggotaan proses bernama. Pengendali kanal merupakan pilihan implementasi tingkat proses
yang dapat dipertukarkan. Runner TypeScript
mengueri katalog tersebut; runner tidak memelihara inventaris skenario atau cakupan
paralel.

Output statis `qa coverage` melaporkan pemetaan taksonomi-ke-skenario. Bukti
sebenarnya berasal dari `qa-evidence.json`, yang mencatat skenario yang dijalankan,
ID cakupan, kanal, pengendali yang benar-benar digunakan, dan hasilnya. Kanal dan pengendali adalah
dimensi laporan, bukan kosakata ID cakupan tambahan atau sumbu kelayakan
skenario.

Untuk lane VM Linux sekali pakai tanpa memasukkan Docker ke jalur QA, jalankan:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Perintah ini memulai guest Multipass baru, menginstal dependensi, mem-build OpenClaw
di dalam guest, menjalankan `qa suite`, lalu menyalin laporan dan
ringkasan QA normal kembali ke `.artifacts/qa-e2e/...` pada host. Perintah ini menggunakan kembali
perilaku pemilihan skenario yang sama seperti `qa suite` pada host.

Proses suite host dan Multipass menjalankan beberapa skenario terpilih secara
paralel dengan worker Gateway terisolasi secara default. `qa-channel` menggunakan
konkurensi default 4, yang dibatasi oleh jumlah skenario terpilih. Gunakan `--concurrency
<count>` untuk menyesuaikan jumlah worker, atau `--concurrency 1` untuk eksekusi serial.
Gunakan `--pack personal-agent` untuk menjalankan paket benchmark asisten pribadi (10
skenario). Pemilih paket bersifat aditif dengan flag `--scenario` berulang:
skenario eksplisit dijalankan terlebih dahulu, lalu skenario paket dijalankan sesuai urutan paket dengan
duplikat dihapus. Gunakan `--pack observability` untuk memilih skenario
`otel-trace-smoke` dan `docker-prometheus-smoke` secara bersamaan ketika
runner QA khusus sudah menyediakan penyiapan kolektor OpenTelemetry.

Perintah keluar dengan kode bukan nol ketika ada skenario yang gagal. Gunakan `--allow-failures`
ketika Anda menginginkan artefak tanpa kode keluar kegagalan.

Proses langsung meneruskan input autentikasi QA yang didukung dan praktis untuk
guest: kunci penyedia berbasis env, jalur konfigurasi penyedia langsung QA, serta
`CODEX_HOME` jika tersedia. Simpan `--output-dir` di bawah root repo agar
guest dapat menulis kembali melalui ruang kerja yang dipasang.

## Referensi QA Discord, Slack, Telegram, dan WhatsApp

Adaptor Matrix menggunakan lane sekali pakai yang didukung Docker dan didokumentasikan di atas.
Discord, Slack, Telegram, dan WhatsApp berjalan terhadap transport nyata yang
sudah ada, sehingga referensinya tersedia di sini.

### Flag CLI bersama

Lane ini didaftarkan melalui
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` dan
menerima flag yang sama:

| Flag                                  | Default                                            | Deskripsi                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Jalankan hanya skenario ini. Dapat diulang.                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Lokasi penulisan laporan, ringkasan, bukti, artefak khusus transport, dan log output. Jalur relatif diresolusikan terhadap `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                    | Root repositori saat dipanggil dari cwd netral.                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | ID akun sementara di dalam konfigurasi Gateway QA.                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai`, `aimock`, atau `live-frontier`.                                                                                                    |
| `--model <ref>` / `--alt-model <ref>` | default penyedia                                   | Referensi model utama/alternatif.                                                                                                                   |
| `--fast`                              | nonaktif                                                | Mode cepat penyedia jika didukung.                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | Lihat [Kumpulan kredensial Convex](#convex-credential-pool).                                                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` dalam CI, selain itu `maintainer`                 | Peran yang digunakan ketika `--credential-source convex`.                                                                                                    |
| `--allow-failures`                    | nonaktif                                                | Tulis artefak tanpa mengembalikan kode keluar kegagalan ketika skenario gagal.                                                                      |

Setiap lane keluar dengan kode bukan nol jika ada skenario yang gagal. `--allow-failures` menulis
artefak tanpa menetapkan kode keluar kegagalan. Telegram juga menerima
`--list-scenarios` untuk mencetak ID skenario yang tersedia dan keluar; lane lainnya
tidak menyediakan flag tersebut.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Menargetkan satu grup privat Telegram nyata dengan dua bot berbeda (pengendali +
SUT). Bot SUT harus memiliki nama pengguna Telegram; pengamatan bot-ke-bot berfungsi
paling baik ketika kedua bot mengaktifkan **Bot-to-Bot Communication Mode** di
`@BotFather`.

Env wajib ketika `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - ID obrolan numerik (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Profil `release` memilih skenario YAML Telegram yang dipelihara; `all`
menambahkan pemeriksaan stres sesi, penggunaan, rantai balasan, dan streaming yang bersifat opsional. Nilai
`--scenario` eksplisit menggantikan profil.

- `channel-canary`
- `channel-mention-gating`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-tool-only-usage-footer`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Profil `release` selalu mencakup canary, pembatasan mention, balasan
perintah native, pengalamatan perintah, dan balasan grup antarbot. `mock-openai`
juga mencakup pemeriksaan pratinjau akhir panjang yang deterministik.
`telegram-current-session-status-tool` dan
`telegram-tool-only-usage-footer` tetap bersifat opsional: yang pertama hanya stabil
ketika dijalankan langsung setelah canary, dan yang kedua merupakan pembuktian dengan Telegram nyata
atas footer `/usage` pada balasan yang hanya berisi tool. Gunakan `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai` untuk menampilkan pembagian
default/opsional saat ini beserta referensi regresi. Gunakan `--profile all` untuk setiap
skenario adaptor live Telegram.

Artefak keluaran:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - entri bukti untuk pemeriksaan transportasi live,
  termasuk bidang profil, cakupan, penyedia, kanal, artefak, hasil, dan RTT.

Proses Telegram paket menggunakan kontrak kredensial Telegram yang sama. Pengukuran RTT
berulang merupakan bagian dari lane live Telegram paket normal; distribusi RTT
dimasukkan ke dalam `qa-evidence.json` di bawah `result.timing` untuk
pemeriksaan RTT yang dipilih.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Ketika `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ditetapkan, wrapper live paket
menyewa kredensial `kind: "telegram"`, mengekspor env bot grup/driver/SUT yang disewa
ke dalam proses paket yang diinstal, mengirim Heartbeat untuk sewa tersebut, dan melepaskannya
saat penghentian. Wrapper paket secara default menjalankan 20 pemeriksaan RTT
`channel-canary`, dengan batas waktu RTT 30s, dan peran Convex
`maintainer` di luar CI ketika Convex dipilih. Timpa
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`,
atau `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` untuk menyesuaikan pengukuran RTT tanpa
membuat perintah RTT terpisah atau format ringkasan khusus Telegram.

### QA Discord

```bash
pnpm openclaw qa discord
```

Menargetkan satu kanal guild Discord privat nyata dengan dua bot: bot driver
yang dikendalikan oleh harness dan bot SUT yang dimulai oleh Gateway OpenClaw turunan
melalui Plugin Discord bawaan. Memverifikasi penanganan mention kanal, bahwa
bot SUT telah mendaftarkan perintah native `/help` pada Discord, serta
skenario bukti Mantis yang bersifat opsional.

Env wajib ketika `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - harus cocok dengan id pengguna bot SUT
  yang dikembalikan oleh Discord (jika tidak, lane langsung gagal).

Opsional:

- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` memilih kanal suara/stage untuk
  `discord-voice-autojoin`; tanpanya, skenario memilih kanal
  suara/stage pertama yang terlihat oleh bot SUT.

Skenario modul YAML Discord (`qa/scenarios/channels/discord-*.yaml`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - skenario suara opsional. Berjalan sendiri, mengaktifkan
  `channels.discord.voice.autoJoin`, dan memverifikasi bahwa status suara Discord
  bot SUT saat ini adalah kanal suara/stage target. Kredensial Discord Convex
  dapat menyertakan `voiceChannelId` opsional; jika tidak, adaptor runner
  menemukan kanal suara/stage pertama yang terlihat di guild.
- `discord-status-reactions-tool-only` - skenario Mantis opsional. Berjalan
  sendiri karena skenario ini mengalihkan SUT ke balasan guild yang selalu aktif dan hanya berisi tool
  dengan `messages.statusReactions.enabled=true`, lalu merekam linimasa
  reaksi REST beserta artefak visual HTML/PNG. Laporan sebelum/sesudah
  Mantis juga mempertahankan artefak MP4 yang disediakan skenario sebagai `baseline.mp4`
  dan `candidate.mp4`.
- `discord-thread-reply-filepath-attachment` - skenario Mantis opsional; lihat
  [Skenario Mantis Discord](#discord-mantis-scenarios).

Jalankan skenario gabung otomatis suara Discord secara eksplisit:

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
  --model openai/gpt-5.6-luna \
  --alt-model openai/gpt-5.6-luna \
  --fast
```

Artefak keluaran:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - entri bukti untuk pemeriksaan transportasi live.
- `discord-qa-reaction-timelines.json` dan
  `discord-status-reactions-tool-only-timeline.png` ketika skenario reaksi status
  berjalan.

### QA Slack

```bash
pnpm openclaw qa slack
```

Menargetkan satu kanal Slack privat nyata dengan dua bot berbeda: bot driver
yang dikendalikan oleh harness dan bot SUT yang dimulai oleh Gateway OpenClaw turunan
melalui Plugin Slack bawaan.

Env wajib ketika `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opsional:

- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` mengaktifkan titik pemeriksaan persetujuan visual
  untuk Mantis. Adaptor menulis `<scenario>.pending.json` dan
  `<scenario>.resolved.json`, lalu menunggu file `.ack.json` yang cocok.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` menimpa batas waktu
  pengakuan titik pemeriksaan. Default-nya adalah `120000`.

Skenario YAML kanonis yang diekspos melalui adaptor live Slack:

- `thread-follow-up`
- `thread-isolation`

Skenario modul YAML Slack (`qa/scenarios/channels/slack-*.yaml`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-channel-disabled-warning` - probe Slack nyata opsional yang memastikan bahwa
  kanal nonaktif yang dikonfigurasi mengeluarkan peringatan terstruktur tanpa membalas.
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-progress-commentary-true`, `slack-progress-commentary-false`,
  `slack-progress-commentary-omitted`, dan
  `slack-progress-commentary-verbose-dedupe` - probe Slack nyata opsional untuk
  kontrol komentar/progres tool yang independen, default lama saat kunci
  dihilangkan, dan perilaku pengiriman tunggal ketika progres verbose persisten aktif.
- `slack-reaction-glyph-native` - skenario reaksi tool pesan live opsional.
  Menginstruksikan agen untuk meneruskan glif `✅` secara persis dan memastikan Slack menyimpan
  `white_check_mark` untuk bot SUT pada pesan target.
- `slack-chart-presentation-native` - skenario bagan portabel opsional yang
  memverifikasi blok native `data_visualization` dan teks aksesibel secara persis.
- `slack-table-presentation-native` - skenario tabel portabel opsional yang
  memverifikasi blok native `data_table`, baris secara persis, dan teks aksesibel.
- `slack-table-invalid-blocks-fallback` - skenario transportasi langsung opsional
  yang mengirim tabel mentah melebihi batas namun dapat dibaca secara struktural dengan 101 baris data
  beserta header-nya melalui
  jalur pengiriman Slack produksi, membuktikan bahwa Slack sendiri mengembalikan `invalid_blocks`,
  dan memverifikasi bahwa fallback tersimpan dengan pemformatan dinonaktifkan lengkap dan tidak memiliki
  blok data native. Detail skenario hanya menyimpan bukti kode galat, jumlah, dan
  boolean yang aman.
- `slack-approval-exec-native` - skenario persetujuan exec native Slack opsional.
  Meminta persetujuan exec melalui Gateway, memverifikasi bahwa pesan Slack
  memiliki tombol persetujuan native, menyelesaikannya, dan memverifikasi pembaruan Slack
  yang telah diselesaikan.
- `slack-approval-plugin-native` - skenario persetujuan Plugin native Slack
  opsional. Mengaktifkan penerusan persetujuan exec dan Plugin secara bersamaan agar peristiwa
  Plugin tidak ditekan oleh perutean persetujuan exec, lalu memverifikasi jalur
  UI native Slack tertunda/terselesaikan yang sama.
- `slack-codex-approval-exec-native` - skenario persetujuan perintah Codex Guardian
  opsional. Mengaktifkan Plugin Codex dalam mode Guardian, merutekan giliran
  agen Gateway yang berasal dari Slack melalui harness app-server Codex,
  menunggu permintaan persetujuan Plugin native Slack untuk
  `openclaw-codex-app-server`, menyelesaikannya, dan memverifikasi bahwa giliran Codex
  selesai dengan penanda keluaran perintah dan asisten yang diharapkan.
- `slack-codex-approval-plugin-native` - skenario persetujuan file Codex Guardian
  opsional. Menggunakan instruksi `apply_patch` di luar ruang kerja agar Codex mengeluarkan
  rute persetujuan perubahan file app-server, lalu memverifikasi jalur
  persetujuan tertunda/terselesaikan native Slack yang sama, penanda asisten akhir, dan isi file secara
  persis sebelum pembersihan.

Skenario persetujuan Codex memerlukan `openai/*` atau `codex/*` `--model`, kredensial
model live normal, serta autentikasi Codex atau autentikasi kunci API yang diterima oleh Plugin Codex.
Detail skenario mencakup metode app-server Codex, kunci model Codex
yang dipilih, status akhir giliran Codex, dan verifikasi penanda operasi beserta
metadata persetujuan Slack yang telah disunting.

Artefak keluaran:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - entri bukti untuk pemeriksaan transportasi live.
- `approval-checkpoints/` - hanya ketika Mantis menetapkan
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; berisi JSON titik pemeriksaan,
  JSON pengakuan, dan tangkapan layar tertunda/terselesaikan.

#### Menyiapkan ruang kerja Slack

Lane memerlukan dua aplikasi Slack yang berbeda dalam satu ruang kerja, serta sebuah kanal yang
diikuti oleh kedua bot:

- `channelId` - id `Cxxxxxxxxxx` dari kanal yang telah menerima undangan untuk kedua bot.
  Gunakan kanal khusus; lane mengirim postingan pada setiap proses.
- `driverBotToken` - token bot (`xoxb-...`) dari aplikasi **Driver**.
- `sutBotToken` - token bot (`xoxb-...`) dari aplikasi **SUT**, yang harus berupa
  aplikasi Slack terpisah dari driver agar id pengguna bot-nya berbeda.
- `sutAppToken` - token tingkat aplikasi (`xapp-...`) dari aplikasi SUT dengan
  `connections:write`, digunakan oleh Socket Mode agar aplikasi SUT dapat menerima peristiwa.

Utamakan ruang kerja Slack yang didedikasikan untuk QA daripada menggunakan kembali ruang kerja
produksi.

Manifes SUT di bawah sengaja mempersempit instalasi produksi Plugin Slack
bawaan (`extensions/slack/src/setup-shared.ts:12`) hanya pada
izin dan peristiwa yang dicakup oleh rangkaian QA Slack live. Untuk
penyiapan kanal produksi sebagaimana dilihat pengguna, lihat
[Penyiapan cepat kanal Slack](/id/channels/slack#quick-setup); pasangan Driver/SUT QA
sengaja dipisahkan karena lane memerlukan dua id pengguna bot yang berbeda
dalam satu ruang kerja.

**1. Buat aplikasi Driver**

Buka [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ → pilih ruang kerja QA, tempel manifes berikut,
lalu _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Bot driver pengujian untuk lane live Slack QA OpenClaw"
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

Salin _Bot User OAuth Token_ (`xoxb-...`) - token tersebut menjadi
`driverBotToken`. Driver hanya perlu mengirim pesan dan mengidentifikasi
dirinya; tanpa peristiwa dan tanpa Socket Mode.

**2. Buat aplikasi SUT**

Ulangi _Create New App → From a manifest_ di ruang kerja yang sama. Aplikasi QA ini
sengaja menggunakan versi yang lebih sempit dari manifes produksi Plugin Slack
bawaan (`extensions/slack/src/setup-shared.ts:12`): cakupan dan
peristiwa reaksi dihilangkan karena rangkaian QA Slack live belum mencakup
penanganan reaksi.

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

- _Install to Workspace_ → salin _Bot User OAuth Token_ → token tersebut menjadi
  `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → tambahkan
  cakupan `connections:write` → simpan → salin nilai `xapp-...` → nilai tersebut
  menjadi `sutAppToken`.

Pastikan kedua bot memiliki ID pengguna yang berbeda dengan memanggil `auth.test` pada setiap
token. Runtime membedakan driver dan SUT berdasarkan ID pengguna; menggunakan kembali satu aplikasi
untuk keduanya akan langsung menyebabkan pemeriksaan penyebutan gagal.

**3. Buat saluran**

Di ruang kerja QA, buat saluran (misalnya `#openclaw-qa`) dan undang kedua
bot dari dalam saluran:

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Salin ID `Cxxxxxxxxxx` dari _channel info → About → Channel ID_—ID tersebut
menjadi `channelId`. Saluran publik dapat digunakan; jika Anda menggunakan saluran privat,
kedua aplikasi sudah memiliki `groups:history` sehingga pembacaan riwayat oleh harness
tetap berhasil.

**4. Daftarkan kredensial**

Tersedia dua opsi. Gunakan variabel lingkungan untuk debugging pada satu mesin (atur empat
variabel `OPENCLAW_QA_SLACK_*` dan teruskan `--credential-source env`), atau isi
pool Convex bersama agar CI dan pengelola lain dapat menyewanya.

Untuk pool Convex, tulis keempat bidang ke file JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Dengan `OPENCLAW_QA_CONVEX_SITE_URL` dan `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
diekspor di shell Anda, daftarkan dan verifikasi:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Hasil yang diharapkan adalah `count: 1`, `status: "active"`, tanpa bidang `lease`.

**5. Verifikasi secara menyeluruh**

Jalankan lane secara lokal untuk memastikan kedua bot dapat berkomunikasi satu sama lain melalui
broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Proses yang berhasil selesai dalam waktu jauh di bawah 30 detik dan `qa-suite-report.md`
menampilkan `slack-canary` serta `slack-mention-gating` dengan status `pass`. Jika
lane terhenti selama ~90 detik dan keluar dengan `Convex credential pool exhausted
for kind "slack"`, pool kosong atau setiap baris sedang disewa—`qa
credentials list --kind slack --status all --json` akan menunjukkan penyebabnya.

### QA WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Menargetkan dua akun WhatsApp Web khusus: akun driver yang dikendalikan oleh
harness dan akun SUT yang dimulai oleh Gateway OpenClaw turunan melalui
Plugin WhatsApp bawaan.

Variabel lingkungan yang diperlukan saat `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Opsional:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` mengaktifkan skenario grup seperti
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, skenario tindakan/media/jajak pendapat grup,
  dan `whatsapp-group-allowlist-block`.

Skenario YAML WhatsApp (`qa/scenarios/channels/whatsapp-*.yaml`):

- Dasar dan pemeriksaan grup: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`, `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- Perintah native: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Perilaku balasan dan keluaran akhir: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- Tindakan pesan melalui jalur pengguna: `whatsapp-agent-message-action-react` dimulai
  dari DM driver nyata, memungkinkan model memanggil alat `message`, dan
  mengamati reaksi native WhatsApp. `whatsapp-agent-message-action-upload-file`
  menggunakan pendekatan yang sama untuk `message(action=upload-file)` dan mengamati
  media native WhatsApp. `whatsapp-group-agent-message-action-react` dan
  `whatsapp-group-agent-message-action-upload-file` membuktikan tindakan yang terlihat oleh
  pengguna tersebut dalam grup WhatsApp nyata.
- Fan-out grup: `whatsapp-broadcast-group-fanout` dimulai dari satu pesan grup
  WhatsApp yang menyebut bot dan memverifikasi balasan berbeda yang terlihat dari `main`
  dan `qa-second`.
- Aktivasi grup: `whatsapp-group-activation-always` mengubah sesi grup nyata
  menjadi `/activation always`, membuktikan bahwa pesan grup tanpa penyebutan membangunkan
  agen, lalu memulihkan `/activation mention`.
  `whatsapp-group-reply-to-bot-triggers` menyiapkan balasan bot, mengirim balasan
  kutipan native terhadapnya tanpa penyebutan eksplisit, dan memverifikasi bahwa agen
  terbangun dari konteks balasan tersebut.
- Media masuk dan pesan terstruktur: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Skenario ini mengirim peristiwa gambar, audio, dokumen, lokasi, kontak,
  stiker, dan reaksi WhatsApp nyata melalui driver.
- Probe kontrak Gateway langsung: `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-outbound-send-serialization`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Skenario ini sengaja melewati pemberian prompt kepada model
  dan membuktikan kontrak `send`, `poll`, serta
  `message.action` Gateway/saluran yang deterministik.
- Cakupan kontrol akses: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Persetujuan native: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Reaksi status: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

Katalog saat ini berisi 52 skenario. Lane default `live-frontier`
dipertahankan berukuran kecil dengan 8 skenario untuk cakupan smoke yang cepat. Lane default `mock-openai`
menjalankan 39 skenario secara deterministik melalui transport WhatsApp nyata
dengan hanya memalsukan keluaran model; skenario persetujuan dan beberapa pemeriksaan
yang lebih berat/memblokir tetap harus ditentukan secara eksplisit berdasarkan ID skenario.

Driver QA WhatsApp mengamati peristiwa langsung terstruktur (`text`, `media`,
`location`, `reaction`, dan `poll`) serta dapat secara aktif mengirim media, jajak pendapat,
kontak, lokasi, dan stiker. QA Lab mengimpor driver tersebut melalui
permukaan paket `@openclaw/whatsapp/api.js`, bukan dengan mengakses file
runtime WhatsApp privat. Untuk pengamatan grup, `fromJid` adalah JID grup,
sedangkan `participantJid` dan `fromPhoneE164` mengidentifikasi peserta pengirim.
Konten pesan disamarkan secara default. Probe Gateway langsung untuk jajak pendapat, unggah file,
media, jajak pendapat grup, media grup, dan bentuk balasan merupakan pemeriksaan kontrak
transport/API; probe tersebut tidak dianggap sebagai bukti bahwa prompt pengguna membuat
agen memilih tindakan yang sama. Bukti tindakan melalui jalur pengguna berasal dari skenario
seperti `whatsapp-agent-message-action-react` dan
`whatsapp-group-agent-message-action-react`, tempat driver mengirim pesan
WhatsApp biasa dan QA Lab mengamati artefak native WhatsApp yang dihasilkan.
Detail skenario WhatsApp mencakup pendekatan setiap skenario (`user-path`,
`direct-gateway`, atau `native-approval`) agar bukti tidak disalahartikan sebagai
kontrak yang lebih kuat daripada yang benar-benar dibuktikannya.

Artefak keluaran:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json`—entri bukti untuk pemeriksaan transport langsung.

### Pool kredensial Convex

Lane Discord, Slack, Telegram, dan WhatsApp dapat menyewa kredensial dari
pool Convex bersama, alih-alih membaca variabel lingkungan di atas. Teruskan
`--credential-source convex` (atau atur `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`);
QA Lab memperoleh sewa eksklusif, mengirim Heartbeat selama
proses berjalan, dan melepaskannya saat penghentian. Jenis pool adalah `"discord"`, `"slack"`,
`"telegram"`, dan `"whatsapp"`.

Bentuk payload yang divalidasi broker pada `admin/add`:

- Discord (`kind: "discord"`): `{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string,
sutToken: string }`—`groupId` harus berupa string ID obrolan numerik.
- Pengguna nyata Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`—
  hanya untuk bukti Telegram Desktop Mantis. Lane QA Lab generik tidak boleh memperoleh
  jenis ini.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }`—nomor telepon harus berupa string E.164 yang berbeda.

Alur kerja bukti Telegram Desktop Mantis mempertahankan satu sewa Convex
`telegram-user` eksklusif untuk driver CLI TDLib dan saksi Telegram Desktop,
lalu melepaskannya setelah menerbitkan bukti.

Saat PR memerlukan diff visual deterministik, Mantis dapat menggunakan balasan model
tiruan yang sama pada `main` dan pada head PR sementara pemformat atau
lapisan pengiriman Telegram berubah. Default pengambilan disesuaikan untuk komentar PR: kelas
Crabbox standar, rekaman desktop 24fps, GIF gerakan 24fps, dan lebar pratinjau
1920px. Komentar sebelum/sesudah harus menerbitkan bundel bersih yang hanya berisi
GIF yang dimaksud.

Lane Slack juga dapat menggunakan pool. Pemeriksaan bentuk payload Slack saat ini berada
di runner QA Slack, bukan di broker; gunakan `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }`, dengan
ID saluran Slack seperti `Cxxxxxxxxxx`. Lihat
[Menyiapkan ruang kerja Slack](#setting-up-the-slack-workspace) untuk penyediaan
aplikasi dan cakupan.

Variabel lingkungan operasional dan kontrak endpoint broker Convex tersedia di
[Pengujian → Kredensial Telegram bersama melalui Convex](/id/help/testing#shared-telegram-credentials-via-convex-v1)
(nama bagian tersebut dibuat sebelum pool multisaluran; semantik sewa
digunakan bersama oleh semua jenis).

## Seed berbasis repositori

Aset seed tersedia di `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Aset tersebut sengaja disimpan di git agar rencana QA terlihat oleh manusia dan
agen.

`qa-lab` tetap menjadi runner skenario YAML generik. Setiap file YAML skenario merupakan
sumber kebenaran untuk satu proses pengujian dan harus menentukan:

- `title` tingkat teratas
- metadata `scenario`
- metadata kategori, kapabilitas, lane, dan risiko opsional dalam `scenario`
- referensi dokumentasi dan kode dalam `scenario`
- persyaratan Plugin opsional dalam `scenario`
- patch konfigurasi Gateway opsional dalam `scenario`
- `flow` tingkat teratas yang dapat dieksekusi untuk skenario alur, atau
  `scenario.execution.kind` / `scenario.execution.path` untuk skenario Vitest dan
  Playwright

Permukaan runtime yang dapat digunakan kembali dan mendukung `flow` tetap generik dan
lintas aspek. Misalnya, skenario YAML dapat menggabungkan helper sisi transportasi
dengan helper sisi browser yang mengendalikan Control UI tersemat melalui
seam Gateway `browser.request` tanpa menambahkan runner kasus khusus.

File skenario harus dikelompokkan berdasarkan kapabilitas produk, bukan folder
pohon sumber. Pertahankan ID skenario agar tetap stabil saat file dipindahkan; gunakan `docsRefs` dan
`codeRefs` untuk keterlacakan implementasi.

Daftar dasar harus tetap cukup luas untuk mencakup:

- DM dan percakapan kanal
- perilaku utas
- siklus hidup tindakan pesan
- callback cron
- pemanggilan kembali memori
- pergantian model
- serah terima subagen
- pembacaan repo dan pembacaan dokumentasi
- satu tugas build kecil seperti Lobster Invaders

## Jalur mock penyedia

`qa suite` memiliki dua jalur mock penyedia lokal:

- `mock-openai` adalah mock OpenClaw yang memahami skenario. Ini tetap menjadi jalur
  mock deterministik default untuk QA berbasis repo dan gerbang paritas.
- `aimock` memulai server penyedia berbasis AIMock untuk cakupan
  protokol eksperimental, fixture, rekam/putar ulang, dan chaos. Jalur ini bersifat tambahan dan
  tidak menggantikan dispatcher skenario `mock-openai`.

Implementasi jalur penyedia berada di bawah `extensions/qa-lab/src/providers/`.
Setiap penyedia memiliki nilai default, startup server lokal, konfigurasi model gateway,
kebutuhan penyiapan profil autentikasi, dan flag kapabilitas live/mock masing-masing. Kode suite dan
gateway bersama dirutekan melalui registri penyedia alih-alih membuat percabangan berdasarkan
nama penyedia.

## Adaptor transportasi

`qa-lab` menyediakan seam transportasi generik untuk skenario QA YAML. `qa-channel` adalah
default sintetis. `crabline` memulai server lokal yang menyerupai penyedia dan
menjalankan plugin kanal normal OpenClaw terhadap server tersebut. `live` dicadangkan untuk
kredensial penyedia nyata dan kanal eksternal.

Pada tingkat arsitektur, pembagiannya adalah:

- `qa-lab` menangani eksekusi skenario generik, konkurensi worker, penulisan
  artefak, dan pelaporan.
- Adaptor transportasi menangani konfigurasi gateway, kesiapan, pengamatan masuk dan keluar,
  tindakan transportasi, serta status transportasi yang dinormalisasi.
- File skenario YAML di bawah `qa/scenarios/` menentukan proses pengujian; `qa-lab`
  menyediakan permukaan runtime yang dapat digunakan kembali untuk menjalankannya.

### Menambahkan kanal

Menambahkan kanal ke sistem QA YAML memerlukan implementasi kanal
beserta paket skenario yang menguji kontrak kanal tersebut. Untuk cakupan CI
smoke, tambahkan server penyedia lokal Crabline yang sesuai dan ekspos server tersebut
melalui driver `crabline`.

Jangan menambahkan akar perintah QA tingkat atas baru jika host bersama `qa-lab` dapat
menangani alur tersebut.

`qa-lab` menangani mekanisme host bersama:

- akar perintah `openclaw qa`
- startup dan teardown suite
- konkurensi worker
- penulisan artefak
- pembuatan laporan
- eksekusi skenario
- alias kompatibilitas untuk skenario `qa-channel` yang lebih lama

Plugin runner menangani kontrak transportasi:

- cara `openclaw qa <runner>` dipasang di bawah akar bersama `qa`
- cara gateway dikonfigurasi untuk transportasi tersebut
- cara kesiapan diperiksa
- cara peristiwa masuk diinjeksi
- cara pesan keluar diamati
- cara transkrip dan status transportasi yang dinormalisasi diekspos
- cara tindakan yang didukung transportasi dijalankan
- cara reset atau pembersihan khusus transportasi ditangani

Batas adopsi minimum untuk kanal baru:

1. Pertahankan `qa-lab` sebagai pemilik akar bersama `qa`.
2. Implementasikan runner transportasi pada seam host bersama `qa-lab`.
3. Pertahankan mekanisme khusus transportasi di dalam plugin runner atau harness
   kanal.
4. Pasang runner sebagai `openclaw qa <runner>`, bukan mendaftarkan
   perintah akar pesaing. Plugin runner harus mendeklarasikan `qaRunners` di
   `openclaw.plugin.json` dan mengekspor array `qaRunnerCliRegistrations`
   yang sesuai dari `runtime-api.ts`. Jaga agar `runtime-api.ts` tetap ringan; eksekusi CLI lazy dan
   runner harus tetap berada di balik entrypoint terpisah. `adapterFactory`
   opsional mengekspos transportasi ke skenario bersama tanpa mengubah
   katalog skenario perintah yang sudah ada.
5. Buat atau adaptasikan skenario YAML di bawah direktori `qa/scenarios/`
   bertema.
6. Gunakan helper skenario generik untuk skenario baru.
7. Pertahankan alias kompatibilitas yang sudah ada agar tetap berfungsi, kecuali repo sedang melakukan
   migrasi yang disengaja.

Aturan keputusannya ketat:

- Jika perilaku dapat dinyatakan sekali di `qa-lab`, letakkan di `qa-lab`.
- Jika perilaku bergantung pada satu transportasi kanal, pertahankan di plugin
  runner atau harness plugin tersebut.
- Jika suatu skenario memerlukan kapabilitas baru yang dapat digunakan oleh lebih dari satu kanal,
  tambahkan helper generik alih-alih cabang khusus kanal di `suite.ts`.
- Jika suatu perilaku hanya bermakna bagi satu transportasi, pertahankan skenario
  agar khusus transportasi dan nyatakan hal tersebut secara eksplisit dalam kontrak skenario.

### Nama helper skenario

Helper generik yang dianjurkan untuk skenario baru:

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

Alias kompatibilitas tetap tersedia untuk skenario yang sudah ada -
`waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`,
`formatConversationTranscript`, `resetBus` - tetapi penulisan skenario baru
harus menggunakan nama generik. Alias tersebut ada untuk menghindari
migrasi sekaligus, bukan sebagai model untuk ke depannya.

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari lini masa bus yang diamati.
Laporan harus menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

Untuk inventaris skenario yang tersedia - berguna saat memperkirakan pekerjaan tindak lanjut
atau menghubungkan transportasi baru - jalankan `pnpm openclaw qa coverage` (tambahkan `--json`
untuk keluaran yang dapat dibaca mesin). Saat memilih bukti terfokus untuk
perilaku atau jalur file yang disentuh, jalankan `pnpm openclaw qa coverage --match <query>`. Laporan
kecocokan mencari metadata skenario, referensi dokumentasi, referensi kode, ID cakupan,
plugin, dan persyaratan penyedia, lalu mencetak target `qa suite
--scenario ...` yang cocok.

Setiap proses `qa suite` menulis artefak tingkat atas `qa-evidence.json`,
`qa-suite-summary.json`, dan `qa-suite-report.md` untuk kumpulan
skenario yang dipilih. Skenario yang mendeklarasikan `execution.kind: vitest` atau
`execution.kind: playwright` menjalankan jalur pengujian yang sesuai dan juga menulis
log per skenario. Skenario yang mendeklarasikan `execution.kind: script` menjalankan
produsen bukti di `execution.path` melalui `node --import tsx` (dengan
`${outputDir}` dan `${scenarioId}` diperluas di `execution.args`); produsen tersebut
menulis `qa-evidence.json` miliknya sendiri, yang entrinya diimpor ke
keluaran suite dan jalur artefaknya diresolusikan relatif terhadap
`qa-evidence.json` produsen tersebut. Saat `qa suite` dicapai melalui `qa run
--qa-profile`, `qa-evidence.json` yang sama juga menyertakan ringkasan
kartu skor profil untuk kategori taksonomi yang dipilih.

Perlakukan keluaran cakupan sebagai alat bantu penemuan, bukan pengganti gerbang;
skenario yang dipilih masih memerlukan mode penyedia, transportasi live,
Multipass, Testbox, atau jalur rilis yang tepat untuk perilaku yang diuji. Untuk
konteks kartu skor, lihat [Kartu skor kematangan](/id/maturity/scorecard).

Untuk pemeriksaan karakter dan gaya, jalankan skenario yang sama pada beberapa
referensi model live dan tulis laporan Markdown yang dinilai:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.6-luna,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.6-sol,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Perintah tersebut menjalankan proses anak gateway QA lokal, bukan Docker. Skenario
evaluasi karakter harus menetapkan persona melalui `SOUL.md`, lalu menjalankan giliran
pengguna biasa seperti percakapan, bantuan ruang kerja, dan tugas file kecil. Model kandidat
tidak boleh diberi tahu bahwa model tersebut sedang dievaluasi. Perintah tersebut mempertahankan
setiap transkrip lengkap, merekam statistik dasar proses, lalu meminta model penilai dalam
mode cepat dengan penalaran `xhigh` jika didukung untuk memberi peringkat proses berdasarkan
kealamian, nuansa, dan humor. Gunakan `--blind-judge-models` saat membandingkan
penyedia: prompt penilai tetap menerima setiap transkrip dan status proses, tetapi
referensi kandidat diganti dengan label netral seperti `candidate-01`; laporan
memetakan kembali peringkat ke referensi sebenarnya setelah penguraian.

Proses kandidat secara default menggunakan pemikiran `high`, dengan `medium` untuk GPT-5.6 Luna dan
`xhigh` untuk referensi evaluasi OpenAI lama yang mendukungnya. Timpa kandidat tertentu
secara inline dengan `--model provider/model,thinking=<level>`; opsi
inline juga mendukung `fast`, `no-fast`, dan `fast=<bool>`. `--thinking
<level>` tetap menetapkan fallback global, dan bentuk `--model-thinking
<provider/model=level>` yang lebih lama dipertahankan untuk kompatibilitas. Referensi kandidat OpenAI
secara default menggunakan mode cepat agar pemrosesan prioritas digunakan jika didukung oleh penyedia.
Teruskan `--fast` hanya jika Anda ingin memaksa mode cepat aktif untuk
setiap model kandidat. Durasi kandidat dan penilai direkam dalam
laporan untuk analisis benchmark, tetapi prompt penilai secara eksplisit menyatakan agar tidak memberi peringkat
berdasarkan kecepatan. Proses model kandidat dan penilai sama-sama secara default menggunakan konkurensi 16.
Turunkan `--concurrency` atau `--judge-concurrency` saat batas penyedia atau tekanan
gateway lokal membuat proses terlalu bising.

Jika tidak ada `--model` kandidat yang diteruskan, evaluasi karakter secara default menggunakan
`openai/gpt-5.6-luna`, `openai/gpt-5.2`, `openai/gpt-5`,
`anthropic/claude-opus-4-8`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, dan `google/gemini-3.1-pro-preview`. Jika tidak ada
`--judge-model` yang diteruskan, penilai secara default menggunakan
`openai/gpt-5.6-sol,thinking=xhigh,fast` dan
`anthropic/claude-opus-4-8,thinking=high`.

## Dokumentasi terkait

- [Kartu skor kematangan](/id/maturity/scorecard)
- [Paket benchmark agen pribadi](/id/concepts/personal-agent-benchmark-pack)
- [Kanal QA](/id/channels/qa-channel)
- [Pengujian](/id/help/testing)
- [Dasbor](/id/web/dashboard)
