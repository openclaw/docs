---
read_when:
    - Anda memelihara Plugin OpenClaw
    - Anda melihat peringatan kompatibilitas Plugin
    - Anda sedang merencanakan migrasi SDK Plugin atau manifest
summary: Kontrak kompatibilitas Plugin, metadata deprecation, dan ekspektasi migrasi
title: Kompatibilitas Plugin
x-i18n:
    generated_at: "2026-04-26T11:34:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b4e11dc57c29eac72844b91bec75a9d48005bbd3c89a2a9d7a5634ab782e5fc
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw mempertahankan kontrak Plugin lama tetap terhubung melalui adaptor
kompatibilitas bernama sebelum menghapusnya. Ini melindungi Plugin bawaan dan eksternal
yang sudah ada sementara kontrak SDK, manifest, setup, config, dan runtime agen
terus berkembang.

## Registry kompatibilitas

Kontrak kompatibilitas Plugin dilacak dalam registry inti di
`src/plugins/compat/registry.ts`.

Setiap catatan memiliki:

- kode kompatibilitas stabil
- status: `active`, `deprecated`, `removal-pending`, atau `removed`
- pemilik: SDK, config, setup, channel, provider, eksekusi plugin, runtime agen,
  atau core
- tanggal pengenalan dan deprecation bila berlaku
- panduan pengganti
- docs, diagnostik, dan test yang mencakup perilaku lama dan baru

Registry adalah sumber untuk perencanaan maintainer dan pemeriksaan plugin inspector
di masa mendatang. Jika perilaku yang menghadap Plugin berubah, tambahkan atau perbarui catatan
kompatibilitas dalam perubahan yang sama yang menambahkan adaptor.

Kompatibilitas perbaikan dan migrasi Doctor dilacak secara terpisah di
`src/commands/doctor/shared/deprecation-compat.ts`. Catatan tersebut mencakup bentuk config lama,
layout install-ledger, dan shim perbaikan yang mungkin perlu tetap tersedia setelah
jalur kompatibilitas runtime dihapus.

Pemeriksaan rilis sebaiknya memeriksa kedua registry. Jangan hapus migrasi doctor
hanya karena catatan kompatibilitas runtime atau config yang cocok sudah kedaluwarsa; pertama
verifikasi bahwa tidak ada jalur upgrade yang masih didukung dan masih membutuhkan perbaikan tersebut. Juga
validasi ulang setiap anotasi pengganti selama perencanaan rilis karena kepemilikan Plugin
dan jejak config dapat berubah saat provider dan channel berpindah keluar dari
core.

## Paket plugin inspector

Plugin inspector sebaiknya berada di luar repo inti OpenClaw sebagai paket/repository
terpisah yang didukung oleh kontrak kompatibilitas dan manifest yang telah
dibuat versinya.

CLI hari pertama sebaiknya:

```sh
openclaw-plugin-inspector ./my-plugin
```

CLI tersebut sebaiknya mengeluarkan:

- validasi manifest/schema
- versi kompatibilitas kontrak yang sedang diperiksa
- pemeriksaan metadata install/source
- pemeriksaan import jalur dingin
- peringatan deprecation dan kompatibilitas

Gunakan `--json` untuk output stabil yang dapat dibaca mesin dalam anotasi CI. Inti
OpenClaw sebaiknya mengekspos kontrak dan fixture yang dapat dikonsumsi inspector, tetapi
tidak boleh memublikasikan binary inspector dari paket `openclaw` utama.

## Kebijakan deprecation

OpenClaw tidak boleh menghapus kontrak Plugin yang terdokumentasi dalam rilis yang sama
dengan saat penggantinya diperkenalkan.

Urutan migrasinya adalah:

1. Tambahkan kontrak baru.
2. Pertahankan perilaku lama tetap terhubung melalui adaptor kompatibilitas bernama.
3. Keluarkan diagnostik atau peringatan ketika penulis Plugin dapat bertindak.
4. Dokumentasikan pengganti dan linimasanya.
5. Uji jalur lama dan baru.
6. Tunggu selama jendela migrasi yang diumumkan.
7. Hapus hanya dengan persetujuan eksplisit untuk rilis breaking.

Catatan deprecated harus menyertakan tanggal mulai peringatan, pengganti, tautan docs,
dan tanggal penghapusan final tidak lebih dari tiga bulan setelah peringatan dimulai. Jangan
menambahkan jalur kompatibilitas deprecated dengan jendela penghapusan terbuka kecuali
maintainer secara eksplisit memutuskan bahwa itu adalah kompatibilitas permanen dan menandainya `active`
sebagai gantinya.

## Area kompatibilitas saat ini

Catatan kompatibilitas saat ini mencakup:

- import SDK luas lama seperti `openclaw/plugin-sdk/compat`
- bentuk Plugin lama yang hanya hook dan `before_agent_start`
- entrypoint Plugin lama `activate(api)` saat Plugin bermigrasi ke
  `register(api)`
- alias SDK lama seperti `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, builder status `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils`, dan alias tipe `ClawdbotConfig` /
  `OpenClawSchemaType`
- perilaku allowlist dan enablement Plugin bawaan
- metadata manifest env-var provider/channel lama
- hook dan alias tipe Plugin provider lama saat provider berpindah ke
  hook katalog, auth, thinking, replay, dan transport yang eksplisit
- alias runtime lama seperti `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, dan `api.runtime.stt`
- registrasi split memory-plugin lama saat memory plugin berpindah ke
  `registerMemoryCapability`
- helper SDK channel lama untuk schema pesan native, mention gating,
  pemformatan envelope masuk, dan nesting capability persetujuan
- petunjuk aktivasi yang sedang digantikan oleh kepemilikan kontribusi manifest
- fallback runtime `setup-api` saat descriptor setup berpindah ke metadata dingin
  `setup.requiresRuntime: false`
- hook provider `discovery` saat hook katalog provider berpindah ke
  `catalog.run(...)`
- metadata channel `showConfigured` / `showInSetup` saat paket channel berpindah
  ke `openclaw.channel.exposure`
- kunci config runtime-policy lama saat doctor memigrasikan operator ke
  `agentRuntime`
- fallback metadata config channel bawaan yang dihasilkan saat metadata
  `channelConfigs` yang mengutamakan registry mulai hadir
- flag env registry Plugin yang dinonaktifkan dan migrasi instalasi yang dipersistenkan saat
  alur perbaikan memigrasikan operator ke `openclaw plugins registry --refresh` dan
  `openclaw doctor --fix`
- path config web search, web fetch, dan x_search milik Plugin lama saat
  doctor memigrasikannya ke `plugins.entries.<plugin>.config`
- config authored `plugins.installs` lama dan alias load-path Plugin bawaan saat
  metadata instalasi berpindah ke ledger Plugin yang dikelola state

Kode Plugin baru sebaiknya memilih pengganti yang tercantum di registry dan dalam
panduan migrasi khusus. Plugin yang sudah ada dapat terus menggunakan jalur kompatibilitas
sampai docs, diagnostik, dan catatan rilis mengumumkan jendela penghapusan.

## Catatan rilis

Catatan rilis sebaiknya menyertakan deprecation Plugin yang akan datang beserta tanggal target dan
tautan ke docs migrasi. Peringatan itu harus terjadi sebelum jalur kompatibilitas
berpindah ke `removal-pending` atau `removed`.
