---
read_when:
    - Anda ingin agen OpenClaw mode Codex menggunakan Plugin Codex native
    - Anda sedang memigrasikan Plugin Codex yang dikurasi OpenAI dan diinstal dari sumber
    - Anda sedang memecahkan masalah codexPlugins, inventaris aplikasi, tindakan destruktif, atau diagnostik aplikasi Plugin
summary: Konfigurasikan Plugin Codex asli yang dimigrasikan untuk agen OpenClaw mode Codex
title: Plugin Codex native
x-i18n:
    generated_at: "2026-05-12T23:30:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: ddec40cd5f9a74b43d55f327cdcd7088e024392fbafc7f1aa5bd9b136d3ecc13
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Dukungan Plugin Codex native memungkinkan agen OpenClaw mode Codex menggunakan kemampuan aplikasi dan Plugin milik Codex app-server di dalam thread Codex yang sama yang menangani giliran OpenClaw.

OpenClaw tidak menerjemahkan Plugin Codex menjadi alat dinamis OpenClaw `codex_plugin_*` sintetis. Panggilan Plugin tetap berada dalam transkrip Codex native, dan Codex app-server memiliki eksekusi MCP berbasis aplikasi.

Gunakan halaman ini setelah [harness Codex](/id/plugins/codex-harness) dasar berfungsi.

## Persyaratan

- Runtime agen OpenClaw yang dipilih harus berupa harness Codex native.
- `plugins.entries.codex.enabled` harus bernilai true.
- `plugins.entries.codex.config.codexPlugins.enabled` harus bernilai true.
- V1 hanya mendukung Plugin `openai-curated` yang diamati migrasi sebagai
  terinstal dari sumber di home Codex sumber.
- Codex app-server target harus dapat melihat inventaris marketplace,
  Plugin, dan aplikasi yang diharapkan.

`codexPlugins` tidak berpengaruh pada run PI, run penyedia OpenAI normal, binding percakapan ACP, atau harness lain karena jalur-jalur tersebut tidak membuat thread Codex app-server dengan konfigurasi `apps` native.

## Mulai cepat

Pratinjau migrasi dari home Codex sumber:

```bash
openclaw migrate codex --dry-run
```

Gunakan verifikasi aplikasi sumber yang ketat saat Anda ingin migrasi memeriksa aksesibilitas aplikasi sumber sebelum merencanakan aktivasi Plugin native:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Terapkan migrasi saat rencananya sudah sesuai:

```bash
openclaw migrate apply codex --yes
```

Migrasi menulis entri `codexPlugins` eksplisit untuk Plugin yang memenuhi syarat dan memanggil `plugin/install` Codex app-server untuk Plugin yang dipilih. Konfigurasi hasil migrasi yang umum terlihat seperti ini:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Setelah mengubah `codexPlugins`, gunakan `/new`, `/reset`, atau mulai ulang gateway agar sesi harness Codex mendatang dimulai dengan set aplikasi yang diperbarui.

## Cara kerja penyiapan Plugin native

Integrasi memiliki tiga status terpisah:

- Terinstal: Codex memiliki bundel Plugin lokal di runtime app-server target.
- Diaktifkan: konfigurasi OpenClaw bersedia membuat Plugin tersedia untuk giliran harness Codex.
- Dapat diakses: Codex app-server mengonfirmasi bahwa entri aplikasi Plugin tersedia untuk akun aktif dan dapat dipetakan ke identitas Plugin yang dimigrasikan.

Migrasi adalah langkah instalasi/kelayakan yang tahan lama. Selama perencanaan, OpenClaw membaca detail `plugin/read` Codex sumber dan memeriksa bahwa respons akun Codex app-server sumber adalah akun langganan ChatGPT. Respons akun non-ChatGPT atau yang hilang melewati Plugin berbasis aplikasi dengan `codex_subscription_required`. Secara default, migrasi tidak memanggil `app/list` sumber; Plugin sumber berbasis aplikasi yang lolos gerbang akun direncanakan tanpa verifikasi aksesibilitas aplikasi sumber, dan kegagalan transport lookup akun dilewati dengan `codex_account_unavailable`. Dengan `--verify-plugin-apps`, migrasi mengambil snapshot `app/list` sumber baru dan mengharuskan setiap aplikasi yang dimiliki untuk hadir, diaktifkan, dan dapat diakses sebelum merencanakan aktivasi native. Dalam mode tersebut, kegagalan transport lookup akun diteruskan ke gerbang inventaris aplikasi sumber. Inventaris aplikasi runtime adalah pemeriksaan aksesibilitas sesi target setelah migrasi. Penyiapan sesi harness Codex kemudian menghitung konfigurasi aplikasi thread yang restriktif untuk aplikasi Plugin yang diaktifkan dan dapat diakses.

Konfigurasi aplikasi thread dihitung saat OpenClaw membuat sesi harness Codex atau mengganti binding thread Codex yang usang. Konfigurasi ini tidak dihitung ulang pada setiap giliran.

## Batas dukungan V1

V1 sengaja dibuat sempit:

- Hanya Plugin `openai-curated` yang sudah terinstal di inventaris Codex app-server sumber yang memenuhi syarat migrasi.
- Plugin sumber berbasis aplikasi harus lolos gerbang langganan saat migrasi.
  `--verify-plugin-apps` menambahkan gerbang inventaris aplikasi sumber. Akun yang dibatasi langganan ditambah, dalam mode verifikasi, aplikasi sumber yang tidak dapat diakses, dinonaktifkan, hilang, atau kegagalan refresh inventaris aplikasi sumber dilaporkan sebagai item manual yang dilewati alih-alih entri konfigurasi yang diaktifkan. Detail Plugin yang tidak dapat dibaca dilewati sebelum gerbang inventaris aplikasi sumber.
- Migrasi menulis identitas Plugin eksplisit dengan `marketplaceName` dan
  `pluginName`; migrasi tidak menulis jalur cache `marketplacePath` lokal.
- `codexPlugins.enabled` adalah sakelar pengaktifan global.
- Tidak ada wildcard `plugins["*"]` dan tidak ada kunci konfigurasi yang memberikan otoritas instalasi arbitrer.
- Marketplace yang tidak didukung, bundel Plugin yang di-cache, hook, dan file konfigurasi Codex dipertahankan dalam laporan migrasi untuk peninjauan manual.

## Inventaris dan kepemilikan aplikasi

OpenClaw membaca inventaris aplikasi Codex melalui `app/list` app-server, menyimpannya dalam cache selama satu jam, dan me-refresh entri yang usang atau hilang secara asinkron. Cache hanya berada di memori; memulai ulang CLI atau gateway menghapusnya, dan OpenClaw membangunnya kembali dari pembacaan `app/list` berikutnya.

Migrasi dan runtime menggunakan kunci cache terpisah:

- Verifikasi migrasi sumber menggunakan home Codex sumber dan opsi start app-server sumber. Ini hanya berjalan saat `--verify-plugin-apps` disetel, dan memaksa traversal `app/list` sumber yang baru untuk run perencanaan tersebut.
- Penyiapan runtime target menggunakan identitas Codex app-server milik agen target saat membangun konfigurasi aplikasi thread Codex. Aktivasi Plugin membatalkan kunci cache target tersebut lalu memaksa refresh setelah `plugin/install`.

Aplikasi Plugin hanya diekspos saat OpenClaw dapat memetakannya kembali ke Plugin yang dimigrasikan melalui kepemilikan yang stabil:

- id aplikasi persis dari detail Plugin
- nama server MCP yang dikenal
- metadata stabil yang unik

Kepemilikan yang hanya cocok berdasarkan nama tampilan atau ambigu dikecualikan hingga refresh inventaris berikutnya membuktikan kepemilikan.

## Konfigurasi aplikasi thread

OpenClaw menyuntikkan patch `config.apps` restriktif untuk thread Codex:
`_default` dinonaktifkan dan hanya aplikasi yang dimiliki oleh Plugin hasil migrasi yang diaktifkan yang diaktifkan.

OpenClaw menetapkan `destructive_enabled` tingkat aplikasi dari kebijakan global efektif atau per-Plugin `allow_destructive_actions` dan membiarkan Codex menegakkan metadata alat destruktif dari anotasi alat aplikasi native miliknya. Konfigurasi aplikasi `_default` dinonaktifkan dengan `open_world_enabled: false`. Aplikasi Plugin yang diaktifkan dipancarkan dengan `open_world_enabled: true`; OpenClaw tidak mengekspos knob kebijakan open-world Plugin terpisah dan tidak memelihara daftar penolakan nama alat destruktif per-Plugin.

Mode persetujuan alat bersifat otomatis secara default untuk aplikasi Plugin sehingga alat baca non-destruktif dapat berjalan tanpa UI persetujuan dalam thread yang sama. Alat destruktif tetap dikendalikan oleh kebijakan `destructive_enabled` setiap aplikasi.

## Kebijakan tindakan destruktif

Elisitasi Plugin destruktif diizinkan secara default untuk Plugin Codex yang dimigrasikan, sementara skema yang tidak aman dan kepemilikan ambigu tetap gagal tertutup:

- `allow_destructive_actions` global default ke `true`.
- `allow_destructive_actions` per-Plugin menimpa kebijakan global untuk Plugin tersebut.
- Saat kebijakan bernilai `false`, OpenClaw mengembalikan penolakan deterministik.
- Saat kebijakan bernilai `true`, OpenClaw hanya menerima otomatis skema aman yang dapat dipetakannya ke respons persetujuan, seperti field approve boolean.
- Identitas Plugin yang hilang, kepemilikan ambigu, id giliran yang hilang, id giliran yang salah, atau skema elisitasi yang tidak aman akan ditolak alih-alih meminta prompt.

## Pemecahan masalah

**`auth_required`:** migrasi menginstal Plugin, tetapi salah satu aplikasinya masih membutuhkan autentikasi. Entri Plugin eksplisit ditulis dalam keadaan dinonaktifkan hingga Anda mengotorisasi ulang dan mengaktifkannya.

**`app_inaccessible`, `app_disabled`, atau `app_missing`:**
migrasi tidak menginstal Plugin karena inventaris aplikasi Codex sumber tidak menunjukkan semua aplikasi yang dimiliki sebagai hadir, diaktifkan, dan dapat diakses saat `--verify-plugin-apps` disetel. Otorisasi ulang atau aktifkan aplikasi di Codex, lalu jalankan ulang migrasi dengan `--verify-plugin-apps`.

**`app_inventory_unavailable`:** migrasi tidak menginstal Plugin karena verifikasi aplikasi sumber yang ketat diminta dan refresh inventaris aplikasi Codex sumber gagal. Perbaiki akses Codex app-server sumber atau coba lagi tanpa `--verify-plugin-apps` jika Anda menerima rencana yang lebih cepat dengan gerbang akun.

**`codex_subscription_required`:** migrasi tidak menginstal Plugin berbasis aplikasi karena akun Codex app-server sumber tidak login dengan akun langganan ChatGPT. Login ke aplikasi Codex dengan auth langganan, lalu jalankan ulang migrasi.

**`codex_account_unavailable`:** migrasi tidak menginstal Plugin berbasis aplikasi karena akun Codex app-server sumber tidak dapat dibaca. Perbaiki auth Codex app-server sumber atau jalankan ulang dengan `--verify-plugin-apps` jika Anda ingin inventaris aplikasi sumber menentukan kelayakan saat lookup akun gagal.

**`marketplace_missing` atau `plugin_missing`:** Codex app-server target tidak dapat melihat marketplace atau Plugin `openai-curated` yang diharapkan. Jalankan ulang migrasi terhadap runtime target atau periksa status Plugin Codex app-server.

**`app_inventory_missing` atau `app_inventory_stale`:** kesiapan aplikasi berasal dari cache kosong atau usang. OpenClaw menjadwalkan refresh asinkron dan mengecualikan aplikasi Plugin hingga kepemilikan dan kesiapan diketahui.

**`app_ownership_ambiguous`:** inventaris aplikasi hanya cocok berdasarkan nama tampilan, sehingga aplikasi tidak diekspos ke thread Codex.

**Konfigurasi berubah tetapi agen tidak dapat melihat Plugin:** gunakan `/new`, `/reset`, atau mulai ulang gateway. Binding thread Codex yang ada mempertahankan konfigurasi aplikasi yang digunakan saat mulai hingga OpenClaw membuat sesi harness baru atau mengganti binding yang usang.

**Tindakan destruktif ditolak:** periksa nilai `allow_destructive_actions` global dan per-Plugin. Bahkan saat kebijakan bernilai true, skema elisitasi yang tidak aman dan identitas Plugin ambigu tetap gagal tertutup.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Referensi harness Codex](/id/plugins/codex-harness-reference)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Referensi konfigurasi](/id/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI migrasi](/id/cli/migrate)
