---
read_when:
    - Anda memelihara Plugin OpenClaw
    - Anda melihat peringatan kompatibilitas plugin
    - Anda sedang merencanakan migrasi SDK Plugin atau manifes
summary: Kontrak kompatibilitas Plugin, metadata deprecasi, dan ekspektasi migrasi
title: Kompatibilitas Plugin
x-i18n:
    generated_at: "2026-06-27T17:47:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e17881c393e3649cb6accb13996d83a855f434735da2e84738f823ac4eba0f5
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw menjaga kontrak Plugin lama tetap terhubung melalui adaptor
kompatibilitas bernama sebelum menghapusnya. Ini melindungi Plugin bawaan dan
eksternal yang sudah ada sementara kontrak SDK, manifes, penyiapan, konfigurasi,
dan runtime agen berkembang.

## Registri kompatibilitas

Kontrak kompatibilitas Plugin dilacak dalam registri inti di
`src/plugins/compat/registry.ts`.

Setiap rekaman memiliki:

- kode kompatibilitas stabil
- status: `active`, `deprecated`, `removal-pending`, atau `removed`
- pemilik: SDK, konfigurasi, penyiapan, kanal, penyedia, eksekusi Plugin, runtime agen,
  atau inti
- tanggal pengenalan dan deprekasi bila berlaku
- panduan pengganti
- dokumentasi, diagnostik, dan pengujian yang mencakup perilaku lama dan baru

Registri adalah sumber untuk perencanaan pengelola dan pemeriksaan pemeriksa
Plugin di masa mendatang. Jika perilaku yang menghadap Plugin berubah, tambahkan
atau perbarui rekaman kompatibilitas dalam perubahan yang sama dengan yang
menambahkan adaptor.

Kompatibilitas perbaikan dan migrasi Doctor dilacak secara terpisah di
`src/commands/doctor/shared/deprecation-compat.ts`. Rekaman tersebut mencakup
bentuk konfigurasi lama, tata letak ledger instalasi, dan shim perbaikan yang
mungkin perlu tetap tersedia setelah jalur kompatibilitas runtime dihapus.

Penyapuan rilis harus memeriksa kedua registri. Jangan hapus migrasi doctor
hanya karena rekaman kompatibilitas runtime atau konfigurasi yang sesuai sudah
kedaluwarsa; verifikasi terlebih dahulu bahwa tidak ada jalur peningkatan yang
didukung yang masih membutuhkan perbaikan tersebut. Validasi ulang juga setiap
anotasi pengganti selama perencanaan rilis karena kepemilikan Plugin dan jejak
konfigurasi dapat berubah saat penyedia dan kanal dipindahkan keluar dari inti.

## Paket pemeriksa Plugin

Pemeriksa Plugin sebaiknya berada di luar repo inti OpenClaw sebagai
paket/repositori terpisah yang didukung oleh kontrak kompatibilitas dan manifes
berversi.

CLI hari pertama sebaiknya adalah:

```sh
openclaw-plugin-inspector ./my-plugin
```

Itu harus menghasilkan:

- validasi manifes/skema
- versi kompatibilitas kontrak yang diperiksa
- pemeriksaan metadata instalasi/sumber
- pemeriksaan impor jalur dingin
- peringatan deprekasi dan kompatibilitas

Gunakan `--json` untuk keluaran stabil yang dapat dibaca mesin dalam anotasi CI.
Inti OpenClaw harus mengekspos kontrak dan fixture yang dapat dikonsumsi
pemeriksa, tetapi tidak boleh menerbitkan biner pemeriksa dari paket utama
`openclaw`.

### Jalur penerimaan pengelola

Gunakan Blacksmith Testbox yang didukung Crabbox untuk jalur penerimaan paket
yang dapat diinstal saat memvalidasi pemeriksa eksternal terhadap paket Plugin
OpenClaw. Jalankan dari checkout OpenClaw yang bersih setelah paket dibangun:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Pertahankan jalur ini sebagai opt-in untuk pengelola karena jalur ini
menginstal paket npm eksternal dan dapat memeriksa paket Plugin yang dikloning
di luar repo. Penjaga repo lokal mencakup peta ekspor SDK, metadata registri
kompatibilitas, pengurangan impor SDK yang dideprekasi, dan batas impor ekstensi
bawaan; bukti pemeriksa Testbox mencakup paket sebagaimana dikonsumsi penulis
Plugin eksternal.

## Kebijakan deprekasi

OpenClaw tidak boleh menghapus kontrak Plugin terdokumentasi dalam rilis yang
sama dengan rilis yang memperkenalkan penggantinya.

Urutan migrasinya adalah:

1. Tambahkan kontrak baru.
2. Pertahankan perilaku lama tetap terhubung melalui adaptor kompatibilitas bernama.
3. Keluarkan diagnostik atau peringatan saat penulis Plugin dapat bertindak.
4. Dokumentasikan pengganti dan lini waktunya.
5. Uji jalur lama dan baru.
6. Tunggu melewati jendela migrasi yang diumumkan.
7. Hapus hanya dengan persetujuan rilis pemutus yang eksplisit.

Rekaman yang dideprekasi harus menyertakan tanggal mulai peringatan, pengganti,
tautan dokumentasi, dan tanggal penghapusan final tidak lebih dari tiga bulan
setelah peringatan dimulai. Jangan tambahkan jalur kompatibilitas yang
dideprekasi dengan jendela penghapusan terbuka kecuali pengelola secara
eksplisit memutuskan bahwa itu adalah kompatibilitas permanen dan menandainya
sebagai `active`.

## Area kompatibilitas saat ini

Rekaman kompatibilitas saat ini mencakup:

- impor SDK luas lama seperti `openclaw/plugin-sdk/compat`
- bentuk Plugin lama yang hanya hook dan `before_agent_start`
- nama hook pembersihan `api.on("deactivate", ...)` lama saat Plugin bermigrasi ke
  `gateway_stop`
- entrypoint Plugin `activate(api)` lama saat Plugin bermigrasi ke
  `register(api)`
- alias SDK lama seperti `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, pembangun status
  `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils` (diganti oleh
  subjalur pengujian `openclaw/plugin-sdk/*` yang terfokus), dan alias tipe
  `ClawdbotConfig` / `OpenClawSchemaType`
- allowlist Plugin bawaan dan perilaku pengaktifan
- metadata manifes env-var penyedia/kanal lama
- hook Plugin penyedia lama dan alias tipe sementara penyedia pindah ke hook
  katalog, auth, thinking, replay, dan transport eksplisit
- alias runtime lama seperti `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt`, dan
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
  yang dideprekasi
- field callback datar WhatsApp `WebInboundMessage` seperti `body`, `chatId`,
  `reply(...)`, dan `mediaPath` sementara konsumen callback bermigrasi ke konteks
  `event`, `payload`, `quote`, `group`, dan `platform`
  `WebInboundCallbackMessage` bersarang
- field penerimaan tingkat atas WhatsApp `WebInboundMessage` seperti `from`,
  `conversationId`, `accountId`, `accessControlPassed`, dan `chatType` sementara
  konsumen callback bermigrasi ke envelope `admission`
- pendaftaran terpisah Plugin memori lama sementara Plugin memori pindah ke
  `registerMemoryCapability`
- pendaftaran penyedia embedding khusus memori lama sementara penyedia embedding
  pindah ke `api.registerEmbeddingProvider(...)` dan
  `contracts.embeddingProviders`
- helper SDK kanal lama untuk skema pesan native, gating mention,
  pemformatan envelope masuk, dan nesting kapabilitas persetujuan
- alias helper kunci rute kanal dan target-sebanding lama sementara Plugin
  pindah ke `openclaw/plugin-sdk/channel-route`
- petunjuk aktivasi yang sedang digantikan oleh kepemilikan kontribusi manifes
- fallback runtime `setup-api` sementara deskriptor penyiapan pindah ke metadata
  dingin `setup.requiresRuntime: false`
- hook `discovery` penyedia sementara hook katalog penyedia pindah ke
  `catalog.run(...)`
- metadata kanal `showConfigured` / `showInSetup` sementara paket kanal pindah
  ke `openclaw.channel.exposure`
- kunci konfigurasi runtime-policy lama sementara doctor memigrasikan operator ke
  `agentRuntime`
- fallback metadata konfigurasi kanal bawaan yang dihasilkan sementara metadata
  `channelConfigs` yang mendahulukan registri diterapkan
- flag env penonaktifan registri Plugin persisten dan migrasi instalasi sementara
  alur perbaikan memigrasikan operator ke `openclaw plugins registry --refresh` dan
  `openclaw doctor --fix`
- jalur konfigurasi pencarian web, pengambilan web, dan x_search milik Plugin
  lama sementara doctor memigrasikannya ke `plugins.entries.<plugin>.config`
- konfigurasi `plugins.installs` lama yang ditulis pengguna dan alias jalur muat
  Plugin bawaan sementara metadata instalasi pindah ke ledger Plugin yang
  dikelola state

Kode Plugin baru sebaiknya memilih pengganti yang tercantum dalam registri dan
dalam panduan migrasi spesifik. Plugin yang sudah ada dapat terus menggunakan
jalur kompatibilitas sampai dokumentasi, diagnostik, dan catatan rilis
mengumumkan jendela penghapusan.

### Alias Datar Callback Masuk WhatsApp

Callback runtime WhatsApp mengirimkan `WebInboundMessage`: konteks bersarang
kanonis `event`, `payload`, `quote`, `group`, dan `platform` ditambah alias datar
yang dideprekasi untuk field callback yang sudah dikirimkan. Kode callback baru
sebaiknya membaca konteks bersarang. Kode yang membangun pesan callback
bersarang bersih dapat menggunakan `WebInboundCallbackMessage`; listener
kompatibilitas yang masih menyuntikkan pesan pengujian atau Plugin datar lama
sebaiknya menggunakan `LegacyFlatWebInboundMessage` atau
`WebInboundMessageInput`.

Alias datar tetap tersedia hingga **2026-08-30**. Jendela penghapusan tersebut
hanya berlaku untuk akses alias datar; bentuk callback bersarang adalah kontrak
runtime kanonis. Anotasi TypeScript `@deprecated` pada setiap alias datar
menyebutkan pengganti bersarangnya yang tepat. Contoh umum:

- `id`, `timestamp`, dan `isBatched` pindah ke bawah `event`.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location`, dan
  `untrustedStructuredContext` pindah ke bawah `payload`.
- `to`, `chatId`, field pengirim/diri sendiri, `sendComposing`, `reply(...)`, dan
  `sendMedia(...)` pindah ke bawah `platform`.
- field `replyTo*` pindah ke bawah `quote`, dan field subjek/peserta/mention
  grup pindah ke bawah `group`.

`payload.untrustedStructuredContext` diekstrak dari payload penyedia masuk.
Plugin harus memeriksa `label`, `source`, dan `type` sebelum memperlakukan
`payload`-nya sebagai otoritatif.

### Field Penerimaan Masuk WhatsApp

Pesan callback WhatsApp yang diterima kini membawa `admission`, envelope yang
aman untuk publik bagi keputusan kontrol akses yang menerima pesan tersebut.
Kode callback baru sebaiknya membaca fakta penerimaan dari `msg.admission`,
bukan dari field penerimaan tingkat atas yang lebih lama.

Field tingkat atas tetap tersedia hingga **2026-08-30**. Anotasi TypeScript
`@deprecated` menyebutkan setiap penggantinya:

- `from` dan `conversationId` pindah ke `admission.conversation.id`.
- `accountId` pindah ke `admission.accountId`.
- `accessControlPassed` adalah tampilan kompatibilitas turunan dari
  `admission.ingress.decision === "allow"`; pada pesan yang sudah membawa
  `admission`, menulis boolean lama tidak menulis ulang grafik ingress.
- `chatType` pindah ke `admission.conversation.kind`.

## Catatan rilis

Catatan rilis harus menyertakan deprekasi Plugin yang akan datang dengan tanggal
target dan tautan ke dokumentasi migrasi. Peringatan tersebut perlu terjadi
sebelum jalur kompatibilitas berpindah ke `removal-pending` atau `removed`.
