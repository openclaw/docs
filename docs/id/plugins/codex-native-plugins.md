---
read_when:
    - Anda ingin agen OpenClaw mode Codex menggunakan Plugin Codex bawaan
    - Anda sedang memigrasikan Plugin Codex yang dikurasi OpenAI dan diinstal dari sumber
    - Anda sedang memecahkan masalah codexPlugins, inventaris aplikasi, tindakan destruktif, atau diagnostik aplikasi Plugin
summary: Konfigurasikan Plugin Codex native yang dimigrasikan untuk agen OpenClaw mode Codex
title: Plugin Codex native
x-i18n:
    generated_at: "2026-05-10T19:43:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b9116a479ffb68e3566f6113d9ec9d2a3c33df2dd27ff539f2f27110c7b9d9f
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Dukungan Plugin Codex native memungkinkan agen OpenClaw mode Codex menggunakan kemampuan app dan Plugin milik app-server Codex sendiri di dalam thread Codex yang sama yang menangani giliran OpenClaw.

OpenClaw tidak menerjemahkan Plugin Codex menjadi tool dinamis OpenClaw sintetis `codex_plugin_*`. Panggilan Plugin tetap berada dalam transkrip Codex native, dan app-server Codex memiliki eksekusi MCP yang didukung app.

Gunakan halaman ini setelah [harness Codex](/id/plugins/codex-harness) dasar berfungsi.

## Persyaratan

- Runtime agen OpenClaw yang dipilih harus berupa harness Codex native.
- `plugins.entries.codex.enabled` harus bernilai true.
- `plugins.entries.codex.config.codexPlugins.enabled` harus bernilai true.
- V1 hanya mendukung Plugin `openai-curated` yang diamati migration sebagai
  terpasang dari source di home Codex sumber.
- app-server Codex target harus dapat melihat marketplace, Plugin, dan inventaris app yang diharapkan.

`codexPlugins` tidak berpengaruh pada run PI, run provider OpenAI normal, binding percakapan ACP, atau harness lain karena jalur tersebut tidak membuat thread app-server Codex dengan config `apps` native.

## Quickstart

Pratinjau migration dari home Codex sumber:

```bash
openclaw migrate codex --dry-run
```

Terapkan migration saat rencananya sudah benar:

```bash
openclaw migrate apply codex --yes
```

Migration menulis entri `codexPlugins` eksplisit untuk Plugin yang memenuhi syarat dan memanggil `plugin/install` app-server Codex untuk Plugin yang dipilih. Config hasil migration yang umum terlihat seperti ini:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
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

Setelah mengubah `codexPlugins`, gunakan `/new`, `/reset`, atau mulai ulang Gateway agar sesi harness Codex mendatang dimulai dengan kumpulan app yang diperbarui.

## Cara penyiapan Plugin native bekerja

Integrasi memiliki tiga status terpisah:

- Terpasang: Codex memiliki bundle Plugin lokal dalam runtime app-server target.
- Diaktifkan: Config OpenClaw bersedia membuat Plugin tersedia untuk giliran harness Codex.
- Dapat diakses: app-server Codex mengonfirmasi bahwa entri app Plugin tersedia untuk akun aktif dan dapat dipetakan ke identitas Plugin hasil migration.

Migration adalah langkah pemasangan/kelayakan yang tahan lama. Inventaris app runtime adalah pemeriksaan aksesibilitas. Penyiapan sesi harness Codex kemudian menghitung config app thread yang restriktif untuk app Plugin yang diaktifkan dan dapat diakses.

Config app thread dihitung saat OpenClaw membuat sesi harness Codex atau mengganti binding thread Codex yang stale. Ini tidak dihitung ulang pada setiap giliran.

## Batas dukungan V1

V1 sengaja dibuat sempit:

- Hanya Plugin `openai-curated` yang sudah terpasang di inventaris app-server Codex sumber yang memenuhi syarat migration.
- Migration menulis identitas Plugin eksplisit dengan `marketplaceName` dan `pluginName`; ini tidak menulis path cache `marketplacePath` lokal.
- `codexPlugins.enabled` adalah sakelar pengaktifan global.
- Tidak ada wildcard `plugins["*"]` dan tidak ada key config yang memberikan wewenang pemasangan arbitrer.
- Marketplace yang tidak didukung, bundle Plugin cache, hook, dan file config Codex dipertahankan dalam laporan migration untuk peninjauan manual.

## Inventaris app dan kepemilikan

OpenClaw membaca inventaris app Codex melalui `app/list` app-server, menyimpannya dalam cache selama satu jam, dan menyegarkan entri yang stale atau hilang secara asinkron.

App Plugin hanya diekspos saat OpenClaw dapat memetakannya kembali ke Plugin hasil migration melalui kepemilikan yang stabil:

- id app persis dari detail Plugin
- nama server MCP yang diketahui
- metadata stabil yang unik

Kepemilikan yang hanya berdasarkan nama tampilan atau ambigu dikecualikan sampai penyegaran inventaris berikutnya membuktikan kepemilikan.

## Config app thread

OpenClaw menyuntikkan patch `config.apps` restriktif untuk thread Codex:
`_default` dinonaktifkan dan hanya app yang dimiliki oleh Plugin hasil migration yang diaktifkan yang diaktifkan.

OpenClaw menetapkan `destructive_enabled` tingkat app dari kebijakan global efektif atau per-Plugin `allow_destructive_actions` dan membiarkan Codex menegakkan metadata tool destruktif dari anotasi tool app native-nya. Config app `_default` dinonaktifkan dengan `open_world_enabled: false`. App Plugin yang diaktifkan dipancarkan dengan `open_world_enabled: true`; OpenClaw tidak mengekspos knob kebijakan open-world Plugin terpisah dan tidak memelihara daftar tolak nama tool destruktif per-Plugin.

Mode persetujuan tool diprompt secara default untuk app Plugin karena OpenClaw tidak memiliki UI elisitasi app interaktif dalam jalur thread yang sama ini.

## Kebijakan tindakan destruktif

Elisitasi Plugin destruktif gagal tertutup secara default:

- `allow_destructive_actions` global default ke `false`.
- `allow_destructive_actions` per-Plugin mengganti kebijakan global untuk Plugin tersebut.
- Saat kebijakan bernilai `false`, OpenClaw mengembalikan penolakan deterministik.
- Saat kebijakan bernilai `true`, OpenClaw hanya menerima otomatis skema aman yang dapat dipetakannya ke respons persetujuan, seperti field persetujuan boolean.
- Identitas Plugin yang hilang, kepemilikan ambigu, id giliran yang hilang, id giliran yang salah, atau skema elisitasi yang tidak aman akan ditolak alih-alih diprompt.

## Pemecahan masalah

**`auth_required`:** migration memasang Plugin, tetapi salah satu app-nya masih memerlukan autentikasi. Entri Plugin eksplisit ditulis dalam keadaan nonaktif sampai Anda mengotorisasi ulang dan mengaktifkannya.

**`marketplace_missing` atau `plugin_missing`:** app-server Codex target tidak dapat melihat marketplace atau Plugin `openai-curated` yang diharapkan. Jalankan ulang migration terhadap runtime target atau periksa status Plugin app-server Codex.

**`app_inventory_missing` atau `app_inventory_stale`:** kesiapan app berasal dari cache kosong atau stale. OpenClaw menjadwalkan penyegaran async dan mengecualikan app Plugin sampai kepemilikan dan kesiapan diketahui.

**`app_ownership_ambiguous`:** inventaris app hanya cocok berdasarkan nama tampilan, jadi app tidak diekspos ke thread Codex.

**Config berubah tetapi agen tidak dapat melihat Plugin:** gunakan `/new`, `/reset`, atau mulai ulang Gateway. Binding thread Codex yang sudah ada mempertahankan config app awalnya sampai OpenClaw membuat sesi harness baru atau mengganti binding yang stale.

**Tindakan destruktif ditolak:** periksa nilai `allow_destructive_actions` global dan per-Plugin. Meski kebijakan bernilai true, skema elisitasi yang tidak aman dan identitas Plugin yang ambigu tetap gagal tertutup.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Referensi harness Codex](/id/plugins/codex-harness-reference)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Referensi konfigurasi](/id/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI migration](/id/cli/migrate)
