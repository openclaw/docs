---
read_when:
    - Anda memelihara plugin OpenClaw
    - Anda melihat peringatan kompatibilitas plugin
    - Anda sedang merencanakan migrasi SDK Plugin atau manifes
summary: Kontrak kompatibilitas Plugin, metadata penghentian dukungan, dan ekspektasi migrasi
title: Kompatibilitas Plugin
x-i18n:
    generated_at: "2026-07-20T03:51:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1554105e3499dd608237d638174b167d9a78c227fe05668ce1159d466a1f8c10
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw mempertahankan kontrak plugin lama yang terhubung melalui adaptor kompatibilitas
bernama sebelum menghapusnya. Hal ini melindungi plugin bawaan dan eksternal yang ada
sementara kontrak SDK, manifes, penyiapan, konfigurasi, dan runtime agen
berkembang.

## Registri kompatibilitas

Kontrak kompatibilitas plugin dilacak dalam registri inti di
`src/plugins/compat/registry.ts`. Setiap catatan memiliki:

- kode kompatibilitas yang stabil
- status: `active`, `deprecated`, `removal-pending`, atau `removed`
- pemilik: `sdk`, `config`, `setup`, `channel`, `provider`, `plugin-execution`,
  `agent-runtime`, atau `core`
- tanggal pengenalan dan penghentian jika berlaku
- panduan pengganti
- dokumentasi, diagnostik, dan pengujian yang mencakup perilaku lama dan baru

Registri tersebut menjadi sumber untuk perencanaan pengelola dan pemeriksaan
inspektur plugin mendatang. Jika perilaku yang berhadapan dengan plugin berubah, tambahkan atau perbarui
catatan kompatibilitas dalam perubahan yang sama dengan penambahan adaptor.

Kompatibilitas perbaikan dan migrasi Doctor dilacak secara terpisah di
`src/commands/doctor/shared/deprecation-compat.ts`. Catatan tersebut mencakup bentuk
konfigurasi lama, tata letak buku besar instalasi, dan shim perbaikan yang mungkin perlu
tetap tersedia setelah jalur kompatibilitas runtime dihapus.

Pemeriksaan rilis harus memeriksa kedua registri. Jangan menghapus migrasi
Doctor hanya karena catatan kompatibilitas runtime atau konfigurasi yang sesuai
telah kedaluwarsa; verifikasi terlebih dahulu bahwa tidak ada jalur peningkatan yang didukung yang masih memerlukan
perbaikan tersebut. Validasi ulang juga setiap anotasi pengganti selama perencanaan rilis,
karena kepemilikan plugin dan cakupan konfigurasi dapat berubah ketika penyedia
dan kanal dipindahkan keluar dari inti.

## Kebijakan penghentian

OpenClaw tidak boleh menghapus kontrak plugin terdokumentasi dalam rilis yang sama
yang memperkenalkan penggantinya. Urutan migrasi:

1. Tambahkan kontrak baru.
2. Pertahankan perilaku lama yang terhubung melalui adaptor kompatibilitas bernama.
3. Keluarkan diagnostik atau peringatan ketika penulis plugin dapat menindaklanjutinya.
4. Dokumentasikan pengganti dan linimasa.
5. Uji jalur lama dan baru.
6. Tunggu hingga jangka waktu migrasi yang diumumkan berlalu.
7. Hapus hanya dengan persetujuan eksplisit untuk rilis yang mengandung perubahan tidak kompatibel.

Catatan yang dihentikan harus menyertakan tanggal mulai peringatan, pengganti, tautan
dokumentasi, dan tanggal penghapusan akhir tidak lebih dari tiga bulan setelah peringatan
dimulai. Jangan menambahkan jalur kompatibilitas yang dihentikan dengan jangka waktu
penghapusan tanpa batas, kecuali pengelola secara eksplisit memutuskan bahwa itu adalah kompatibilitas
permanen dan menandainya sebagai `active`.

## Area kompatibilitas saat ini

Pemeriksaan Juli 2026 menghapus alias SDK root, manifes, penyedia, runtime,
flag registri, dan konfigurasi web milik plugin yang telah kedaluwarsa. Migrasi Doctor tetap
dilacak secara terpisah agar jalur peningkatan yang didukung masih dapat memperbaiki konfigurasi lama.

Area kompatibilitas bertanggal yang tersisa adalah:

- jangka waktu subjalur SDK bulan Agustus dan September yang tercantum dalam panduan migrasi
- alias hook `api.on("deactivate", ...)` dan `api.on("subagent_spawning", ...)`
- pendaftaran embedding khusus memori dan jembatan penyimpanan sesi beta.5
- alias callback masuk WhatsApp yang dijelaskan di bawah
- penguraian target kanal eksplisit dan `openclaw/plugin-sdk/messaging-targets`
- alias agen Pi tersemat
- alias SDK harness agen yang telah dirilis, yang penghapusannya menunggu keputusan migrasi baru
  yang didokumentasikan secara eksternal

Catatan registri aktif tanpa tanggal mencakup perilaku yang didukung, bukan utang
penghapusan, termasuk petunjuk aktivasi, pengambilan plugin, pengaktifan plugin bawaan,
dan fallback konfigurasi kanal yang dihasilkan.

### Alias datar callback masuk WhatsApp

Callback runtime WhatsApp mengirimkan `WebInboundMessage`: konteks
bersarang kanonis `event`, `payload`, `quote`, `group`, dan `platform` beserta
alias datar yang dihentikan untuk bidang callback yang telah dirilis. Kode callback baru
harus membaca konteks bersarang. Kode yang membentuk pesan callback bersarang
yang bersih dapat menggunakan `WebInboundCallbackMessage`; listener kompatibilitas yang
masih menyuntikkan pesan pengujian atau plugin datar lama harus menggunakan
`LegacyFlatWebInboundMessage` atau `WebInboundMessageInput`.

Alias datar tetap tersedia hingga **2026-08-30**; jangka waktu tersebut hanya berlaku
untuk akses alias datar, bukan bentuk bersarang, yang merupakan kontrak
runtime kanonis. Anotasi TypeScript `@deprecated` setiap alias datar
menyebutkan pengganti bersarangnya secara tepat. Contoh umum:

- `id`, `timestamp`, dan `isBatched` dipindahkan ke bawah `event`.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location`,
  dan `untrustedStructuredContext` dipindahkan ke bawah `payload`.
- `to`, `chatId`, bidang pengirim/diri sendiri, `sendComposing`, `reply(...)`, dan
  `sendMedia(...)` dipindahkan ke bawah `platform`.
- bidang `replyTo*` dipindahkan ke bawah `quote`; bidang subjek/peserta/sebutan
  grup dipindahkan ke bawah `group`.

`payload.untrustedStructuredContext` diekstrak dari payload penyedia
masuk. Plugin harus memeriksa `label`, `source`, dan `type` sebelum
memperlakukan `payload` miliknya sebagai otoritatif.

### Bidang penerimaan masuk WhatsApp

Pesan callback WhatsApp yang diterima membawa `admission`, sebuah envelope
aman untuk publik bagi keputusan kontrol akses yang menerima pesan tersebut. Kode
callback baru harus membaca fakta penerimaan dari `msg.admission`, bukan dari
bidang penerimaan tingkat atas yang lebih lama.

Bidang tingkat atas tetap tersedia hingga **2026-08-30**. Anotasi
TypeScript `@deprecated` setiap bidang menyebutkan penggantinya:

- `from` dan `conversationId` dipindahkan ke `admission.conversation.id`.
- `accountId` dipindahkan ke `admission.accountId`.
- `accessControlPassed` adalah tampilan kompatibilitas turunan dari
  `admission.ingress.decision === "allow"`; pada pesan yang sudah membawa
  `admission`, penulisan boolean lama tidak menulis ulang graf ingress.
- `chatType` dipindahkan ke `admission.conversation.kind`.

## Paket inspektur plugin

Inspektur plugin harus berada di luar repo inti OpenClaw sebagai
paket/repositori terpisah yang didukung oleh kontrak kompatibilitas dan
manifes berversi. CLI hari pertama harus berupa:

```sh
openclaw-plugin-inspector ./my-plugin
```

CLI tersebut harus menghasilkan validasi manifes/skema, versi kompatibilitas
kontrak yang diperiksa, pemeriksaan metadata instalasi/sumber, pemeriksaan impor
jalur dingin, serta peringatan penghentian/kompatibilitas. Gunakan `--json` untuk output
stabil yang dapat dibaca mesin dalam anotasi CI. Inti OpenClaw harus mengekspos
kontrak dan fixture yang dapat digunakan oleh inspektur, tetapi tidak boleh menerbitkan
biner inspektur dari paket utama `openclaw`.

### Jalur penerimaan pengelola

Gunakan Blacksmith Testbox yang didukung Crabbox untuk jalur penerimaan
paket yang dapat diinstal saat memvalidasi inspektur eksternal terhadap paket plugin
OpenClaw. Jalankan dari checkout OpenClaw yang bersih setelah paket dibangun:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Pertahankan jalur ini sebagai pilihan opsional bagi pengelola, karena jalur ini menginstal paket npm
eksternal dan dapat memeriksa paket plugin yang dikloning di luar repo. Pengaman
repo lokal mencakup peta ekspor SDK, metadata registri kompatibilitas,
pengurangan impor SDK yang dihentikan, dan batas impor ekstensi bawaan;
bukti inspektur Testbox mencakup paket sebagaimana digunakan oleh penulis plugin
eksternal.

## Catatan rilis

Catatan rilis harus menyertakan penghentian plugin mendatang beserta tanggal target
dan tautan ke dokumentasi migrasi, sebelum jalur kompatibilitas berpindah ke
`removal-pending` atau `removed`.
