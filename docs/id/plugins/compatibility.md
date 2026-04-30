---
read_when:
    - Anda mengelola Plugin OpenClaw
    - Anda melihat peringatan kompatibilitas Plugin
    - Anda sedang merencanakan migrasi SDK Plugin atau manifes
summary: Kontrak kompatibilitas Plugin, metadata penghentian penggunaan, dan ekspektasi migrasi
title: Kompatibilitas Plugin
x-i18n:
    generated_at: "2026-04-30T10:00:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 344dbaac86db7259adc09bc91b7fbe7ba540fc6fdd96cc422918ccf2c34d9cec
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw menjaga kontrak plugin lama tetap terhubung melalui adapter kompatibilitas bernama sebelum menghapusnya. Ini melindungi plugin bawaan dan eksternal yang sudah ada saat kontrak SDK, manifes, penyiapan, konfigurasi, dan runtime agen berkembang.

## Registri kompatibilitas

Kontrak kompatibilitas Plugin dilacak dalam registri inti di
`src/plugins/compat/registry.ts`.

Setiap catatan memiliki:

- kode kompatibilitas yang stabil
- status: `active`, `deprecated`, `removal-pending`, atau `removed`
- pemilik: SDK, konfigurasi, penyiapan, channel, penyedia, eksekusi plugin, runtime agen,
  atau inti
- tanggal pengenalan dan penghentian jika berlaku
- panduan pengganti
- dokumentasi, diagnostik, dan pengujian yang mencakup perilaku lama dan baru

Registri adalah sumber untuk perencanaan maintainer dan pemeriksaan pemeriksa plugin di masa mendatang. Jika perilaku yang berhadapan dengan plugin berubah, tambahkan atau perbarui catatan kompatibilitas dalam perubahan yang sama yang menambahkan adapter.

Kompatibilitas perbaikan dan migrasi doctor dilacak secara terpisah di
`src/commands/doctor/shared/deprecation-compat.ts`. Catatan tersebut mencakup bentuk konfigurasi lama, tata letak ledger instalasi, dan shim perbaikan yang mungkin perlu tetap tersedia setelah jalur kompatibilitas runtime dihapus.

Sweep rilis harus memeriksa kedua registri. Jangan hapus migrasi doctor hanya karena catatan kompatibilitas runtime atau konfigurasi yang sesuai sudah kedaluwarsa; pertama verifikasi bahwa tidak ada jalur peningkatan yang didukung yang masih membutuhkan perbaikan tersebut. Validasi ulang juga setiap anotasi pengganti selama perencanaan rilis karena kepemilikan plugin dan cakupan konfigurasi dapat berubah saat penyedia dan channel keluar dari inti.

## Paket pemeriksa Plugin

Pemeriksa plugin harus berada di luar repo inti OpenClaw sebagai paket/repository terpisah yang didukung oleh kontrak kompatibilitas dan manifes berversi.

CLI hari pertama seharusnya:

```sh
openclaw-plugin-inspector ./my-plugin
```

Itu harus mengeluarkan:

- validasi manifes/skema
- versi kompatibilitas kontrak yang sedang diperiksa
- pemeriksaan metadata instalasi/sumber
- pemeriksaan impor jalur dingin
- peringatan penghentian dan kompatibilitas

Gunakan `--json` untuk keluaran stabil yang dapat dibaca mesin dalam anotasi CI. Inti OpenClaw harus mengekspos kontrak dan fixture yang dapat dikonsumsi pemeriksa, tetapi tidak boleh menerbitkan biner pemeriksa dari paket utama `openclaw`.

### Jalur penerimaan maintainer

Gunakan Blacksmith Testbox untuk jalur penerimaan paket yang dapat diinstal saat memvalidasi pemeriksa eksternal terhadap paket plugin OpenClaw. Jalankan dari checkout OpenClaw yang bersih setelah paket dibangun:

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

Biarkan jalur ini opt-in untuk maintainer karena jalur ini menginstal paket npm eksternal dan dapat memeriksa paket plugin yang dikloning di luar repo. Pelindung repo lokal mencakup peta ekspor SDK, metadata registri kompatibilitas, pengurangan impor SDK yang dihentikan, dan batas impor ekstensi bawaan; bukti pemeriksa Testbox mencakup paket sebagaimana dikonsumsi oleh penulis plugin eksternal.

## Kebijakan penghentian

OpenClaw tidak boleh menghapus kontrak plugin terdokumentasi dalam rilis yang sama yang memperkenalkan penggantinya.

Urutan migrasinya adalah:

1. Tambahkan kontrak baru.
2. Pertahankan perilaku lama tetap terhubung melalui adapter kompatibilitas bernama.
3. Keluarkan diagnostik atau peringatan saat penulis plugin dapat bertindak.
4. Dokumentasikan pengganti dan lini waktunya.
5. Uji jalur lama dan baru.
6. Tunggu hingga jendela migrasi yang diumumkan selesai.
7. Hapus hanya dengan persetujuan rilis breaking yang eksplisit.

Catatan yang dihentikan harus menyertakan tanggal mulai peringatan, pengganti, tautan dokumentasi, dan tanggal penghapusan akhir tidak lebih dari tiga bulan setelah peringatan dimulai. Jangan tambahkan jalur kompatibilitas yang dihentikan dengan jendela penghapusan terbuka kecuali maintainer secara eksplisit memutuskan bahwa itu adalah kompatibilitas permanen dan menandainya sebagai `active`.

## Area kompatibilitas saat ini

Catatan kompatibilitas saat ini mencakup:

- impor SDK luas lama seperti `openclaw/plugin-sdk/compat`
- bentuk plugin lama yang hanya berupa hook dan `before_agent_start`
- entrypoint plugin lama `activate(api)` saat plugin bermigrasi ke
  `register(api)`
- alias SDK lama seperti `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, pembangun status `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils` (digantikan oleh subpath pengujian
  `openclaw/plugin-sdk/*` yang terfokus), dan alias tipe `ClawdbotConfig` /
  `OpenClawSchemaType`
- allowlist plugin bawaan dan perilaku pengaktifan
- metadata manifes env-var penyedia/channel lama
- hook plugin penyedia lama dan alias tipe saat penyedia berpindah ke hook
  katalog, auth, thinking, replay, dan transport yang eksplisit
- alias runtime lama seperti `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt`, dan
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)` yang dihentikan
- pendaftaran terpisah plugin memori lama saat plugin memori berpindah ke
  `registerMemoryCapability`
- helper SDK channel lama untuk skema pesan native, gating mention,
  pemformatan envelope masuk, dan nesting kemampuan persetujuan
- alias kunci rute channel lama dan helper target-terbandingkan saat plugin
  berpindah ke `openclaw/plugin-sdk/channel-route`
- petunjuk aktivasi yang sedang digantikan oleh kepemilikan kontribusi manifes
- pemuatan sidecar startup implisit yang dihentikan untuk plugin yang belum mendeklarasikan
  `activation.onStartup`; maintainer dapat menguji perilaku masa depan yang lebih ketat dengan
  `OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1`
- fallback runtime `setup-api` saat deskriptor penyiapan berpindah ke metadata dingin
  `setup.requiresRuntime: false`
- hook `discovery` penyedia saat hook katalog penyedia berpindah ke
  `catalog.run(...)`
- metadata channel `showConfigured` / `showInSetup` saat paket channel berpindah
  ke `openclaw.channel.exposure`
- kunci konfigurasi runtime-policy lama saat doctor memigrasikan operator ke
  `agentRuntime`
- fallback metadata konfigurasi channel bawaan yang dihasilkan saat metadata
  `channelConfigs` yang mendahulukan registri masuk
- flag env penonaktifan registri plugin persisten dan migrasi instalasi saat
  alur perbaikan memigrasikan operator ke `openclaw plugins registry --refresh` dan
  `openclaw doctor --fix`
- jalur konfigurasi lama milik plugin untuk web search, web fetch, dan x_search saat
  doctor memigrasikannya ke `plugins.entries.<plugin>.config`
- konfigurasi buatan `plugins.installs` lama dan alias jalur muat plugin bawaan
  saat metadata instalasi berpindah ke ledger plugin yang dikelola status

Kode plugin baru sebaiknya mengutamakan pengganti yang tercantum dalam registri dan dalam panduan migrasi spesifik. Plugin yang sudah ada dapat terus menggunakan jalur kompatibilitas sampai dokumentasi, diagnostik, dan catatan rilis mengumumkan jendela penghapusan.

## Catatan rilis

Catatan rilis harus menyertakan penghentian plugin yang akan datang dengan tanggal target dan tautan ke dokumentasi migrasi. Peringatan tersebut harus terjadi sebelum jalur kompatibilitas berpindah ke `removal-pending` atau `removed`.
