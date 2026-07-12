---
read_when:
    - Anda mengelola Plugin OpenClaw
    - Anda melihat peringatan kompatibilitas plugin
    - Anda sedang merencanakan migrasi SDK Plugin atau manifes
summary: Kontrak kompatibilitas Plugin, metadata penghentian, dan ekspektasi migrasi
title: Kompatibilitas Plugin
x-i18n:
    generated_at: "2026-07-12T14:26:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f737e40175652cb24327c91d2af9dbf72b1b254011115f5b512a309707711c
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw mempertahankan kontrak Plugin lama yang terhubung melalui adaptor kompatibilitas
bernama sebelum menghapusnya. Ini melindungi Plugin bawaan dan eksternal yang sudah ada
sementara kontrak SDK, manifes, penyiapan, konfigurasi, dan runtime agen
terus berkembang.

## Registri kompatibilitas

Kontrak kompatibilitas Plugin dilacak dalam registri inti di
`src/plugins/compat/registry.ts`. Setiap rekaman memiliki:

- kode kompatibilitas yang stabil
- status: `active`, `deprecated`, `removal-pending`, atau `removed`
- pemilik: `sdk`, `config`, `setup`, `channel`, `provider`, `plugin-execution`,
  `agent-runtime`, atau `core`
- tanggal pengenalan dan penghentian jika berlaku
- panduan pengganti
- dokumentasi, diagnostik, dan pengujian yang mencakup perilaku lama dan baru

Registri tersebut menjadi sumber untuk perencanaan pengelola dan pemeriksaan
inspektur Plugin pada masa mendatang. Jika perilaku yang dihadapi Plugin berubah,
tambahkan atau perbarui rekaman kompatibilitas dalam perubahan yang sama dengan
penambahan adaptor.

Kompatibilitas perbaikan dan migrasi Doctor dilacak secara terpisah di
`src/commands/doctor/shared/deprecation-compat.ts`. Rekaman tersebut mencakup bentuk
konfigurasi lama, tata letak ledger instalasi, dan shim perbaikan yang mungkin perlu
tetap tersedia setelah jalur kompatibilitas runtime dihapus.

Pemeriksaan rilis harus memeriksa kedua registri. Jangan menghapus migrasi Doctor
hanya karena rekaman kompatibilitas runtime atau konfigurasi yang sesuai telah
kedaluwarsa; terlebih dahulu pastikan tidak ada jalur peningkatan yang masih didukung
dan tetap memerlukan perbaikan tersebut. Validasi ulang juga setiap anotasi pengganti
selama perencanaan rilis, karena kepemilikan Plugin dan cakupan konfigurasi dapat
berubah saat penyedia dan kanal dipindahkan keluar dari inti.

## Kebijakan penghentian

OpenClaw tidak boleh menghapus kontrak Plugin yang terdokumentasi dalam rilis yang sama
dengan rilis yang memperkenalkan penggantinya. Urutan migrasi:

1. Tambahkan kontrak baru.
2. Pertahankan perilaku lama yang terhubung melalui adaptor kompatibilitas bernama.
3. Keluarkan diagnostik atau peringatan saat pembuat Plugin dapat bertindak.
4. Dokumentasikan pengganti dan linimasa.
5. Uji jalur lama dan baru.
6. Tunggu hingga jangka waktu migrasi yang diumumkan berakhir.
7. Hapus hanya dengan persetujuan eksplisit untuk rilis yang membawa perubahan tidak kompatibel.

Rekaman yang dihentikan harus menyertakan tanggal mulai peringatan, pengganti, tautan
dokumentasi, dan tanggal penghapusan akhir paling lambat tiga bulan setelah peringatan
dimulai. Jangan menambahkan jalur kompatibilitas yang dihentikan dengan jangka waktu
penghapusan tanpa batas, kecuali pengelola secara eksplisit memutuskan bahwa itu adalah
kompatibilitas permanen dan menandainya sebagai `active`.

## Area kompatibilitas saat ini

Registri saat ini melacak sekitar 70 kode kompatibilitas di seluruh area berikut.
Kode Plugin baru harus menggunakan pengganti di setiap area dan dalam panduan migrasi
terkait; Plugin yang sudah ada dapat terus menggunakan jalur kompatibilitas hingga
dokumentasi, diagnostik, dan catatan rilis mengumumkan jangka waktu penghapusan.

- impor SDK luas lama seperti `openclaw/plugin-sdk/compat`
- bentuk Plugin lama yang hanya menggunakan hook dan `before_agent_start`
- nama hook pembersihan lama `api.on("deactivate", ...)` selama Plugin
  bermigrasi ke `gateway_stop`
- titik masuk Plugin lama `activate(api)` selama Plugin bermigrasi ke
  `register(api)`
- alias SDK lama seperti `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, pembuat status
  `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils` (digantikan
  oleh subjalur pengujian `openclaw/plugin-sdk/*` yang terfokus), serta alias tipe
  `ClawdbotConfig` / `OpenClawSchemaType`
- daftar izin dan perilaku pengaktifan Plugin bawaan
- metadata manifes variabel lingkungan penyedia/kanal lama
- hook Plugin penyedia dan alias tipe lama selama penyedia berpindah ke
  hook katalog, autentikasi, penalaran, pemutaran ulang, dan transportasi yang eksplisit
- alias runtime lama seperti `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt`, serta
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
  yang dihentikan
- kolom panggilan balik datar `WebInboundMessage` WhatsApp (lihat di bawah)
- kolom penerimaan tingkat atas `WebInboundMessage` WhatsApp (lihat di bawah)
- pendaftaran terpisah Plugin memori lama selama Plugin memori berpindah ke
  `registerMemoryCapability`
- pendaftaran penyedia embedding khusus memori lama selama penyedia embedding
  berpindah ke `api.registerEmbeddingProvider(...)` dan
  `contracts.embeddingProviders`
- pembantu SDK kanal lama untuk skema pesan native, pembatasan penyebutan,
  pemformatan amplop masuk, dan penyarangan kapabilitas persetujuan
- alias pembantu kunci rute kanal dan target sebanding lama selama
  Plugin berpindah ke `openclaw/plugin-sdk/channel-route`
- petunjuk aktivasi yang digantikan oleh kepemilikan kontribusi manifes
- fallback runtime `setup-api` selama deskriptor penyiapan berpindah ke metadata
  jalur dingin `setup.requiresRuntime: false`
- hook `discovery` penyedia selama hook katalog penyedia berpindah ke
  `catalog.run(...)`
- metadata kanal `showConfigured` / `showInSetup` selama paket kanal
  berpindah ke `openclaw.channel.exposure`
- kunci konfigurasi kebijakan runtime lama selama Doctor memigrasikan operator ke
  `agentRuntime`
- fallback metadata konfigurasi kanal bawaan yang dihasilkan selama metadata
  `channelConfigs` berbasis registri diterapkan
- tanda lingkungan migrasi instalasi dan penonaktifan registri Plugin yang dipertahankan
  selama alur perbaikan memigrasikan operator ke `openclaw plugins registry --refresh`
  dan `openclaw doctor --fix`
- jalur konfigurasi pencarian web, pengambilan web, dan x_search lama milik Plugin
  selama Doctor memigrasikannya ke `plugins.entries.<plugin>.config`
- konfigurasi buatan `plugins.installs` lama dan alias jalur pemuatan Plugin bawaan
  selama metadata instalasi berpindah ke ledger Plugin yang dikelola oleh status

### Alias datar panggilan balik masuk WhatsApp

Panggilan balik runtime WhatsApp mengirimkan `WebInboundMessage`: konteks bertingkat
kanonis `event`, `payload`, `quote`, `group`, dan `platform`, beserta alias datar
yang dihentikan untuk kolom panggilan balik yang telah dirilis. Kode panggilan balik
baru harus membaca konteks bertingkat. Kode yang membuat pesan panggilan balik
bertingkat yang bersih dapat menggunakan `WebInboundCallbackMessage`; pendengar
kompatibilitas yang masih menyisipkan pesan pengujian atau Plugin datar lama harus
menggunakan `LegacyFlatWebInboundMessage` atau `WebInboundMessageInput`.

Alias datar tetap tersedia hingga **2026-08-30**; jangka waktu tersebut hanya berlaku
untuk akses alias datar, bukan bentuk bertingkat, yang merupakan kontrak runtime
kanonis. Anotasi TypeScript `@deprecated` setiap alias datar menyebutkan pengganti
bertingkatnya secara tepat. Contoh umum:

- `id`, `timestamp`, dan `isBatched` berpindah ke dalam `event`.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location`,
  dan `untrustedStructuredContext` berpindah ke dalam `payload`.
- `to`, `chatId`, kolom pengirim/diri sendiri, `sendComposing`, `reply(...)`, dan
  `sendMedia(...)` berpindah ke dalam `platform`.
- Kolom `replyTo*` berpindah ke dalam `quote`; kolom subjek/peserta/penyebutan grup
  berpindah ke dalam `group`.

`payload.untrustedStructuredContext` diekstrak dari payload penyedia yang masuk.
Plugin harus memeriksa `label`, `source`, dan `type` sebelum memperlakukan `payload`
di dalamnya sebagai sumber otoritatif.

### Kolom penerimaan masuk WhatsApp

Pesan panggilan balik WhatsApp yang diterima membawa `admission`, yaitu amplop yang
aman untuk publik bagi keputusan kontrol akses yang menerima pesan tersebut. Kode
panggilan balik baru harus membaca fakta penerimaan dari `msg.admission`, bukan dari
kolom penerimaan tingkat atas yang lebih lama.

Kolom tingkat atas tetap tersedia hingga **2026-08-30**. Anotasi TypeScript
`@deprecated` setiap kolom menyebutkan penggantinya:

- `from` dan `conversationId` berpindah ke `admission.conversation.id`.
- `accountId` berpindah ke `admission.accountId`.
- `accessControlPassed` adalah tampilan kompatibilitas turunan dari
  `admission.ingress.decision === "allow"`; pada pesan yang sudah membawa
  `admission`, penulisan boolean lama tidak menulis ulang graf ingress.
- `chatType` berpindah ke `admission.conversation.kind`.

## Paket inspektur Plugin

Inspektur Plugin harus berada di luar repositori inti OpenClaw sebagai
paket/repositori terpisah yang didukung oleh kontrak kompatibilitas dan manifes
berversi. CLI pada hari pertama harus berupa:

```sh
openclaw-plugin-inspector ./my-plugin
```

CLI tersebut harus menghasilkan validasi manifes/skema, versi kompatibilitas kontrak
yang diperiksa, pemeriksaan metadata instalasi/sumber, pemeriksaan impor jalur dingin,
serta peringatan penghentian/kompatibilitas. Gunakan `--json` untuk keluaran stabil
yang dapat dibaca mesin dalam anotasi CI. Inti OpenClaw harus mengekspos kontrak dan
fixture yang dapat digunakan inspektur, tetapi tidak boleh memublikasikan biner
inspektur dari paket utama `openclaw`.

### Jalur penerimaan pengelola

Gunakan Blacksmith Testbox yang didukung Crabbox untuk jalur penerimaan paket yang
dapat diinstal saat memvalidasi inspektur eksternal terhadap paket Plugin OpenClaw.
Jalankan dari checkout OpenClaw yang bersih setelah paket dibangun:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Pertahankan jalur ini sebagai pilihan khusus pengelola, karena jalur tersebut
menginstal paket npm eksternal dan dapat memeriksa paket Plugin yang dikloning di luar
repositori. Penjaga repositori lokal mencakup peta ekspor SDK, metadata registri
kompatibilitas, pengurangan impor SDK yang dihentikan, dan batas impor ekstensi bawaan;
bukti inspektur Testbox mencakup paket sebagaimana digunakan oleh pembuat Plugin
eksternal.

## Catatan rilis

Catatan rilis harus menyertakan penghentian Plugin yang akan datang beserta tanggal
target dan tautan ke dokumentasi migrasi, sebelum jalur kompatibilitas berpindah ke
`removal-pending` atau `removed`.
