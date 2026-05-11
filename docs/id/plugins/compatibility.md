---
read_when:
    - Anda mengelola Plugin OpenClaw
    - Anda melihat peringatan kompatibilitas Plugin
    - Anda merencanakan migrasi SDK Plugin atau manifes
summary: Kontrak kompatibilitas Plugin, metadata penghentian, dan ekspektasi migrasi
title: Kompatibilitas Plugin
x-i18n:
    generated_at: "2026-05-11T20:33:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1afd37697f55721ca8419256a6e8187c398d4b20fb11a65776b755050dd5368b
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw menjaga kontrak Plugin lama tetap terhubung melalui adapter kompatibilitas
bernama sebelum menghapusnya. Ini melindungi Plugin bawaan dan eksternal yang
sudah ada sementara kontrak SDK, manifes, setup, konfigurasi, dan runtime agen
berkembang.

## Registri kompatibilitas

Kontrak kompatibilitas Plugin dilacak dalam registri inti di
`src/plugins/compat/registry.ts`.

Setiap rekaman memiliki:

- kode kompatibilitas yang stabil
- status: `active`, `deprecated`, `removal-pending`, atau `removed`
- pemilik: SDK, konfigurasi, setup, channel, penyedia, eksekusi Plugin, runtime agen,
  atau inti
- tanggal pengenalan dan deprekasi jika berlaku
- panduan pengganti
- dokumentasi, diagnostik, dan pengujian yang mencakup perilaku lama dan baru

Registri ini adalah sumber untuk perencanaan pemelihara dan pemeriksaan
inspektur Plugin di masa depan. Jika perilaku yang menghadap Plugin berubah,
tambahkan atau perbarui rekaman kompatibilitas dalam perubahan yang sama yang
menambahkan adapternya.

Kompatibilitas perbaikan dan migrasi Doctor dilacak terpisah di
`src/commands/doctor/shared/deprecation-compat.ts`. Rekaman tersebut mencakup
bentuk konfigurasi lama, tata letak ledger instalasi, dan shim perbaikan yang
mungkin perlu tetap tersedia setelah jalur kompatibilitas runtime dihapus.

Sweep rilis harus memeriksa kedua registri. Jangan hapus migrasi Doctor hanya
karena rekaman kompatibilitas runtime atau konfigurasi yang cocok sudah
kedaluwarsa; verifikasi dahulu bahwa tidak ada jalur upgrade yang didukung yang
masih membutuhkan perbaikan tersebut. Validasi ulang juga setiap anotasi
pengganti selama perencanaan rilis karena kepemilikan Plugin dan jejak
konfigurasi dapat berubah saat penyedia dan channel keluar dari inti.

## Paket inspektur Plugin

Inspektur Plugin harus berada di luar repo inti OpenClaw sebagai
paket/repositori terpisah yang didukung oleh kontrak kompatibilitas dan manifes
berversi.

CLI hari pertama seharusnya:

```sh
openclaw-plugin-inspector ./my-plugin
```

Itu harus menghasilkan:

- validasi manifes/skema
- versi kompatibilitas kontrak yang diperiksa
- pemeriksaan metadata instalasi/sumber
- pemeriksaan impor jalur dingin
- peringatan deprekasi dan kompatibilitas

Gunakan `--json` untuk output stabil yang dapat dibaca mesin dalam anotasi CI.
Inti OpenClaw harus mengekspos kontrak dan fixture yang dapat dikonsumsi
inspektur, tetapi tidak boleh memublikasikan biner inspektur dari paket utama
`openclaw`.

### Lane penerimaan pemelihara

Gunakan Blacksmith Testbox yang didukung Crabbox untuk lane penerimaan paket yang
dapat diinstal saat memvalidasi inspektur eksternal terhadap paket Plugin
OpenClaw. Jalankan dari checkout OpenClaw yang bersih setelah paket dibangun:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Biarkan lane ini bersifat opt-in bagi pemelihara karena memasang paket npm
eksternal dan dapat memeriksa paket Plugin yang dikloning di luar repo. Guard
repo lokal mencakup peta ekspor SDK, metadata registri kompatibilitas,
pengurangan impor SDK yang deprecated, dan batas impor ekstensi bawaan; bukti
inspektur Testbox mencakup paket sebagaimana dikonsumsi oleh penulis Plugin
eksternal.

## Kebijakan deprekasi

OpenClaw tidak boleh menghapus kontrak Plugin terdokumentasi dalam rilis yang
sama yang memperkenalkan penggantinya.

Urutan migrasinya adalah:

1. Tambahkan kontrak baru.
2. Pertahankan perilaku lama tetap terhubung melalui adapter kompatibilitas bernama.
3. Keluarkan diagnostik atau peringatan saat penulis Plugin dapat bertindak.
4. Dokumentasikan pengganti dan linimasanya.
5. Uji jalur lama dan baru.
6. Tunggu sepanjang jendela migrasi yang diumumkan.
7. Hapus hanya dengan persetujuan rilis pemutus kompatibilitas yang eksplisit.

Rekaman deprecated harus menyertakan tanggal mulai peringatan, pengganti, tautan
dokumentasi, dan tanggal penghapusan final tidak lebih dari tiga bulan setelah
peringatan dimulai. Jangan tambahkan jalur kompatibilitas deprecated dengan
jendela penghapusan terbuka kecuali pemelihara secara eksplisit memutuskan bahwa
itu adalah kompatibilitas permanen dan menandainya sebagai `active`.

## Area kompatibilitas saat ini

Rekaman kompatibilitas saat ini mencakup:

- impor SDK luas lama seperti `openclaw/plugin-sdk/compat`
- bentuk Plugin lama yang hanya berupa hook dan `before_agent_start`
- entrypoint Plugin `activate(api)` lama sementara Plugin bermigrasi ke
  `register(api)`
- alias SDK lama seperti `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, builder status
  `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils` (diganti
  oleh subpath pengujian `openclaw/plugin-sdk/*` yang terfokus), dan alias tipe
  `ClawdbotConfig` / `OpenClawSchemaType`
- allowlist Plugin bawaan dan perilaku enablement
- metadata manifes env-var penyedia/channel lama
- hook dan alias tipe Plugin penyedia lama sementara penyedia berpindah ke hook
  katalog, auth, thinking, replay, dan transport yang eksplisit
- alias runtime lama seperti `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt`, dan
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
  yang deprecated
- pendaftaran terbagi Plugin memori lama sementara Plugin memori berpindah ke
  `registerMemoryCapability`
- helper SDK channel lama untuk skema pesan native, gating mention,
  pemformatan envelope inbound, dan nesting kapabilitas persetujuan
- alias helper kunci rute channel dan target sebanding lama sementara Plugin
  berpindah ke `openclaw/plugin-sdk/channel-route`
- petunjuk aktivasi yang sedang diganti oleh kepemilikan kontribusi manifes
- fallback runtime `setup-api` sementara deskriptor setup berpindah ke metadata
  dingin `setup.requiresRuntime: false`
- hook `discovery` penyedia sementara hook katalog penyedia berpindah ke
  `catalog.run(...)`
- metadata channel `showConfigured` / `showInSetup` sementara paket channel
  berpindah ke `openclaw.channel.exposure`
- kunci konfigurasi runtime-policy lama sementara Doctor memigrasikan operator ke
  `agentRuntime`
- fallback metadata konfigurasi channel bawaan yang dihasilkan sementara metadata
  `channelConfigs` yang mengutamakan registri masuk
- flag env penonaktifan registri Plugin persisten dan migrasi instalasi sementara
  alur perbaikan memigrasikan operator ke `openclaw plugins registry --refresh`
  dan `openclaw doctor --fix`
- jalur konfigurasi pencarian web, fetch web, dan x_search milik Plugin lama
  sementara Doctor memigrasikannya ke `plugins.entries.<plugin>.config`
- konfigurasi buatan `plugins.installs` lama dan alias jalur muat Plugin bawaan
  sementara metadata instalasi berpindah ke ledger Plugin yang dikelola state

Kode Plugin baru harus memilih pengganti yang tercantum dalam registri dan dalam
panduan migrasi spesifik. Plugin yang sudah ada dapat terus menggunakan jalur
kompatibilitas sampai dokumentasi, diagnostik, dan catatan rilis mengumumkan
jendela penghapusan.

## Catatan rilis

Catatan rilis harus menyertakan deprekasi Plugin mendatang dengan tanggal target
dan tautan ke dokumentasi migrasi. Peringatan tersebut perlu terjadi sebelum
jalur kompatibilitas berpindah ke `removal-pending` atau `removed`.
