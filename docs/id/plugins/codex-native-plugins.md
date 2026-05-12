---
read_when:
    - Anda ingin agen OpenClaw mode Codex menggunakan Plugin Codex native
    - Anda sedang memigrasikan plugin Codex hasil kurasi OpenAI yang diinstal dari sumber
    - Anda sedang memecahkan masalah codexPlugins, inventaris aplikasi, tindakan destruktif, atau diagnostik aplikasi Plugin
summary: Konfigurasikan Plugin Codex native yang dimigrasikan untuk agen OpenClaw mode Codex
title: Plugin Codex asli
x-i18n:
    generated_at: "2026-05-12T00:59:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4cc1c7b6a97c6eb27eb10a7b14261ecfd398eff58fbd26cc2979a31e6f6a6c4
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Dukungan plugin Codex native memungkinkan agen OpenClaw mode Codex menggunakan kemampuan aplikasi dan plugin milik Codex app-server sendiri di dalam thread Codex yang sama yang menangani giliran OpenClaw.

OpenClaw tidak menerjemahkan plugin Codex menjadi alat dinamis OpenClaw `codex_plugin_*` sintetis. Panggilan plugin tetap berada di transkrip Codex native, dan Codex app-server memiliki eksekusi MCP yang didukung aplikasi.

Gunakan halaman ini setelah [Codex harness](/id/plugins/codex-harness) dasar berfungsi.

## Persyaratan

- Runtime agen OpenClaw yang dipilih harus berupa Codex harness native.
- `plugins.entries.codex.enabled` harus true.
- `plugins.entries.codex.config.codexPlugins.enabled` harus true.
- V1 hanya mendukung plugin `openai-curated` yang diamati migrasi sebagai terpasang dari sumber di home Codex sumber.
- Codex app-server target harus dapat melihat marketplace, plugin, dan inventaris aplikasi yang diharapkan.

`codexPlugins` tidak berpengaruh pada eksekusi PI, eksekusi provider OpenAI normal, pengikatan percakapan ACP, atau harness lain karena jalur tersebut tidak membuat thread Codex app-server dengan konfigurasi `apps` native.

## Mulai cepat

Pratinjau migrasi dari home Codex sumber:

```bash
openclaw migrate codex --dry-run
```

Terapkan migrasi saat rencananya sudah terlihat benar:

```bash
openclaw migrate apply codex --yes
```

Migrasi menulis entri `codexPlugins` eksplisit untuk plugin yang memenuhi syarat dan memanggil `plugin/install` Codex app-server untuk plugin yang dipilih. Konfigurasi hasil migrasi yang umum terlihat seperti ini:

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

Setelah mengubah `codexPlugins`, gunakan `/new`, `/reset`, atau mulai ulang gateway agar sesi Codex harness berikutnya dimulai dengan set aplikasi yang diperbarui.

## Cara kerja penyiapan plugin native

Integrasi memiliki tiga status terpisah:

- Terpasang: Codex memiliki bundel plugin lokal di runtime app-server target.
- Diaktifkan: Konfigurasi OpenClaw bersedia membuat plugin tersedia untuk giliran Codex harness.
- Dapat diakses: Codex app-server mengonfirmasi bahwa entri aplikasi plugin tersedia untuk akun aktif dan dapat dipetakan ke identitas plugin hasil migrasi.

Migrasi adalah langkah instalasi/kelayakan yang tahan lama. Inventaris aplikasi runtime adalah pemeriksaan aksesibilitas. Penyiapan sesi Codex harness kemudian menghitung konfigurasi aplikasi thread yang membatasi untuk aplikasi plugin yang diaktifkan dan dapat diakses.

Konfigurasi aplikasi thread dihitung saat OpenClaw membuat sesi Codex harness atau mengganti pengikatan thread Codex yang usang. Konfigurasi ini tidak dihitung ulang pada setiap giliran.

## Batas dukungan V1

V1 sengaja dibuat sempit:

- Hanya plugin `openai-curated` yang sudah terpasang di inventaris Codex app-server sumber yang memenuhi syarat untuk migrasi.
- Migrasi menulis identitas plugin eksplisit dengan `marketplaceName` dan `pluginName`; migrasi tidak menulis jalur cache `marketplacePath` lokal.
- `codexPlugins.enabled` adalah sakelar pengaktifan global.
- Tidak ada wildcard `plugins["*"]` dan tidak ada kunci konfigurasi yang memberikan kewenangan instalasi arbitrer.
- Marketplace yang tidak didukung, bundel plugin yang di-cache, hook, dan file konfigurasi Codex dipertahankan dalam laporan migrasi untuk peninjauan manual.

## Inventaris aplikasi dan kepemilikan

OpenClaw membaca inventaris aplikasi Codex melalui `app/list` app-server, menyimpannya dalam cache selama satu jam, dan menyegarkan entri yang usang atau hilang secara asinkron.

Aplikasi plugin hanya diekspos ketika OpenClaw dapat memetakannya kembali ke plugin hasil migrasi melalui kepemilikan yang stabil:

- id aplikasi tepat dari detail plugin
- nama server MCP yang diketahui
- metadata stabil yang unik

Kepemilikan yang hanya berdasarkan nama tampilan atau ambigu dikecualikan hingga penyegaran inventaris berikutnya membuktikan kepemilikan.

## Konfigurasi aplikasi thread

OpenClaw menyuntikkan patch `config.apps` yang membatasi untuk thread Codex:
`_default` dinonaktifkan dan hanya aplikasi yang dimiliki oleh plugin hasil migrasi yang diaktifkan yang diaktifkan.

OpenClaw menetapkan `destructive_enabled` tingkat aplikasi dari kebijakan `allow_destructive_actions` global atau per plugin yang efektif dan membiarkan Codex menerapkan metadata alat destruktif dari anotasi alat aplikasi nativenya. Konfigurasi aplikasi `_default` dinonaktifkan dengan `open_world_enabled: false`. Aplikasi plugin yang diaktifkan dikeluarkan dengan `open_world_enabled: true`; OpenClaw tidak mengekspos kenop kebijakan open-world plugin terpisah dan tidak memelihara daftar penolakan nama alat destruktif per plugin.

Mode persetujuan alat bersifat otomatis secara default untuk aplikasi plugin sehingga alat baca non-destruktif dapat berjalan tanpa UI persetujuan dalam thread yang sama. Alat destruktif tetap dikendalikan oleh kebijakan `destructive_enabled` masing-masing aplikasi.

## Kebijakan tindakan destruktif

Elisitasi plugin destruktif diizinkan secara default untuk plugin Codex hasil migrasi, sementara skema yang tidak aman dan kepemilikan ambigu tetap gagal tertutup:

- `allow_destructive_actions` global secara default bernilai `true`.
- `allow_destructive_actions` per plugin menggantikan kebijakan global untuk plugin tersebut.
- Saat kebijakan bernilai `false`, OpenClaw mengembalikan penolakan deterministik.
- Saat kebijakan bernilai `true`, OpenClaw hanya menerima otomatis skema aman yang dapat dipetakannya ke respons persetujuan, seperti bidang persetujuan boolean.
- Identitas plugin yang hilang, kepemilikan ambigu, id giliran yang hilang, id giliran yang salah, atau skema elisitasi yang tidak aman akan ditolak alih-alih meminta konfirmasi.

## Pemecahan masalah

**`auth_required`:** migrasi memasang plugin, tetapi salah satu aplikasinya masih memerlukan autentikasi. Entri plugin eksplisit ditulis dalam keadaan nonaktif hingga Anda mengotorisasi ulang dan mengaktifkannya.

**`marketplace_missing` atau `plugin_missing`:** Codex app-server target tidak dapat melihat marketplace atau plugin `openai-curated` yang diharapkan. Jalankan ulang migrasi terhadap runtime target atau periksa status plugin Codex app-server.

**`app_inventory_missing` atau `app_inventory_stale`:** kesiapan aplikasi berasal dari cache kosong atau usang. OpenClaw menjadwalkan penyegaran async dan mengecualikan aplikasi plugin hingga kepemilikan dan kesiapan diketahui.

**`app_ownership_ambiguous`:** inventaris aplikasi hanya cocok berdasarkan nama tampilan, sehingga aplikasi tidak diekspos ke thread Codex.

**Konfigurasi berubah tetapi agen tidak dapat melihat plugin:** gunakan `/new`, `/reset`, atau mulai ulang gateway. Pengikatan thread Codex yang sudah ada mempertahankan konfigurasi aplikasi yang digunakan saat dimulai hingga OpenClaw membuat sesi harness baru atau mengganti pengikatan yang usang.

**Tindakan destruktif ditolak:** periksa nilai `allow_destructive_actions` global dan per plugin. Bahkan ketika kebijakan bernilai true, skema elisitasi yang tidak aman dan identitas plugin ambigu tetap gagal tertutup.

## Terkait

- [Codex harness](/id/plugins/codex-harness)
- [Referensi Codex harness](/id/plugins/codex-harness-reference)
- [Runtime Codex harness](/id/plugins/codex-harness-runtime)
- [Referensi konfigurasi](/id/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI migrasi](/id/cli/migrate)
