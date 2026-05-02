---
read_when:
    - Anda memelihara Plugin OpenClaw
    - Anda melihat peringatan kompatibilitas Plugin
    - Anda sedang merencanakan migrasi SDK Plugin atau manifes
summary: Kontrak kompatibilitas Plugin, metadata penghentian dukungan, dan ekspektasi migrasi
title: Kompatibilitas Plugin
x-i18n:
    generated_at: "2026-05-02T09:26:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: eecf94743cf34c5b773bfa8066164f90b7c8a75667c43f3f1002d32ec1d04902
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw menjaga kontrak plugin lama tetap terhubung melalui adapter kompatibilitas
bernama sebelum menghapusnya. Ini melindungi plugin bawaan dan eksternal yang ada
saat kontrak SDK, manifes, penyiapan, konfigurasi, dan runtime agen
berkembang.

## Registri kompatibilitas

Kontrak kompatibilitas plugin dilacak di registri inti di
`src/plugins/compat/registry.ts`.

Setiap catatan memiliki:

- kode kompatibilitas yang stabil
- status: `active`, `deprecated`, `removal-pending`, atau `removed`
- pemilik: SDK, konfigurasi, penyiapan, channel, provider, eksekusi plugin, runtime agen,
  atau inti
- tanggal pengenalan dan deprekasi jika berlaku
- panduan pengganti
- docs, diagnostik, dan pengujian yang mencakup perilaku lama dan baru

Registri adalah sumber untuk perencanaan maintainer dan pemeriksaan inspektur plugin
di masa mendatang. Jika perilaku yang menghadap plugin berubah, tambahkan atau perbarui catatan kompatibilitas
dalam perubahan yang sama yang menambahkan adapter.

Kompatibilitas perbaikan dan migrasi Doctor dilacak secara terpisah di
`src/commands/doctor/shared/deprecation-compat.ts`. Catatan tersebut mencakup bentuk
konfigurasi lama, tata letak ledger instalasi, dan shim perbaikan yang mungkin perlu tetap
tersedia setelah jalur kompatibilitas runtime dihapus.

Penyisiran rilis harus memeriksa kedua registri. Jangan hapus migrasi doctor
hanya karena catatan kompatibilitas runtime atau konfigurasi yang sesuai telah kedaluwarsa; pertama
verifikasi bahwa tidak ada jalur peningkatan yang didukung yang masih membutuhkan perbaikan tersebut. Juga
validasi ulang setiap anotasi pengganti selama perencanaan rilis karena kepemilikan plugin
dan jejak konfigurasi dapat berubah saat provider dan channel dipindahkan keluar dari
inti.

## Paket inspektur plugin

Inspektur plugin harus berada di luar repo inti OpenClaw sebagai
paket/repositori terpisah yang didukung oleh kontrak kompatibilitas dan manifes
berversi.

CLI hari pertama seharusnya:

```sh
openclaw-plugin-inspector ./my-plugin
```

Itu harus menghasilkan:

- validasi manifes/skema
- versi kompatibilitas kontrak yang sedang diperiksa
- pemeriksaan metadata instalasi/sumber
- pemeriksaan impor cold-path
- peringatan deprekasi dan kompatibilitas

Gunakan `--json` untuk output stabil yang dapat dibaca mesin dalam anotasi CI. Inti OpenClaw
harus mengekspos kontrak dan fixture yang dapat dikonsumsi inspektur, tetapi tidak boleh
menerbitkan biner inspektur dari paket utama `openclaw`.

### Lane penerimaan maintainer

Gunakan Blacksmith Testbox untuk lane penerimaan paket yang dapat diinstal saat memvalidasi
inspektur eksternal terhadap paket plugin OpenClaw. Jalankan dari checkout OpenClaw
yang bersih setelah paket dibangun:

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

Biarkan lane ini opt-in untuk maintainer karena ia menginstal paket npm eksternal
dan dapat memeriksa paket plugin yang dikloning di luar repo. Guard repo lokal
mencakup peta ekspor SDK, metadata registri kompatibilitas, pengurangan impor SDK
yang dideprekasi, dan batas impor ekstensi bawaan; bukti inspektur Testbox
mencakup paket sebagaimana dikonsumsi oleh penulis plugin eksternal.

## Kebijakan deprekasi

OpenClaw tidak boleh menghapus kontrak plugin terdokumentasi dalam rilis yang sama
yang memperkenalkan penggantinya.

Urutan migrasinya adalah:

1. Tambahkan kontrak baru.
2. Pertahankan perilaku lama yang terhubung melalui adapter kompatibilitas bernama.
3. Keluarkan diagnostik atau peringatan saat penulis plugin dapat bertindak.
4. Dokumentasikan pengganti dan linimasa.
5. Uji jalur lama dan baru.
6. Tunggu selama jendela migrasi yang diumumkan.
7. Hapus hanya dengan persetujuan rilis breaking yang eksplisit.

Catatan yang dideprekasi harus menyertakan tanggal mulai peringatan, pengganti, tautan docs,
dan tanggal penghapusan akhir tidak lebih dari tiga bulan setelah peringatan dimulai. Jangan
tambahkan jalur kompatibilitas yang dideprekasi dengan jendela penghapusan terbuka kecuali
maintainer secara eksplisit memutuskan bahwa itu adalah kompatibilitas permanen dan menandainya sebagai `active`
sebagai gantinya.

## Area kompatibilitas saat ini

Catatan kompatibilitas saat ini mencakup:

- impor SDK luas lama seperti `openclaw/plugin-sdk/compat`
- bentuk plugin lama yang hanya hook dan `before_agent_start`
- entrypoint plugin lama `activate(api)` sementara plugin bermigrasi ke
  `register(api)`
- alias SDK lama seperti `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, pembuat status `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils` (digantikan oleh subpath pengujian
  `openclaw/plugin-sdk/*` yang terfokus), dan alias tipe `ClawdbotConfig` /
  `OpenClawSchemaType`
- allowlist plugin bawaan dan perilaku pengaktifan
- metadata manifes env-var provider/channel lama
- hook plugin provider lama dan alias tipe sementara provider pindah ke
  hook katalog, auth, thinking, replay, dan transport eksplisit
- alias runtime lama seperti `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt`, dan
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)` yang dideprekasi
- registrasi pemisahan plugin memori lama sementara plugin memori pindah ke
  `registerMemoryCapability`
- helper SDK channel lama untuk skema pesan native, gating mention,
  pemformatan amplop inbound, dan nesting kapabilitas persetujuan
- kunci route channel lama dan alias helper comparable-target sementara plugin
  pindah ke `openclaw/plugin-sdk/channel-route`
- hint aktivasi yang sedang digantikan oleh kepemilikan kontribusi manifes
- fallback runtime `setup-api` sementara deskriptor penyiapan pindah ke metadata cold
  `setup.requiresRuntime: false`
- hook `discovery` provider sementara hook katalog provider pindah ke
  `catalog.run(...)`
- metadata channel `showConfigured` / `showInSetup` sementara paket channel pindah
  ke `openclaw.channel.exposure`
- kunci konfigurasi runtime-policy lama sementara doctor memigrasikan operator ke
  `agentRuntime`
- fallback metadata konfigurasi channel bawaan yang dihasilkan sementara metadata
  `channelConfigs` yang registry-first mendarat
- flag env penonaktifan registri plugin persisten dan migrasi instalasi sementara
  alur perbaikan memigrasikan operator ke `openclaw plugins registry --refresh` dan
  `openclaw doctor --fix`
- jalur konfigurasi web search, web fetch, dan x_search milik plugin lama sementara
  doctor memigrasikannya ke `plugins.entries.<plugin>.config`
- konfigurasi `plugins.installs` lama yang ditulis pengguna dan alias load-path plugin bawaan
  sementara metadata instalasi pindah ke ledger plugin yang dikelola state

Kode plugin baru harus memilih pengganti yang tercantum di registri dan di
panduan migrasi spesifik. Plugin yang ada dapat terus menggunakan jalur kompatibilitas
hingga docs, diagnostik, dan catatan rilis mengumumkan jendela penghapusan.

## Catatan rilis

Catatan rilis harus menyertakan deprekasi plugin mendatang dengan tanggal target dan
tautan ke docs migrasi. Peringatan tersebut perlu terjadi sebelum jalur kompatibilitas
berpindah ke `removal-pending` atau `removed`.
