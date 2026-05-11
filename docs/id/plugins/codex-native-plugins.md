---
read_when:
    - Anda ingin agen OpenClaw mode Codex menggunakan Plugin Codex bawaan
    - Anda sedang memigrasikan Plugin Codex yang dikurasi OpenAI dan dipasang dari sumber
    - Anda sedang memecahkan masalah codexPlugins, inventaris aplikasi, tindakan destruktif, atau diagnostik aplikasi Plugin
summary: Konfigurasikan Plugin Codex asli yang dimigrasikan untuk agen OpenClaw mode Codex
title: Plugin Codex native
x-i18n:
    generated_at: "2026-05-11T20:33:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64e8f552e65b3f1c1c62bc1ba1abfc1bf592d1bdc7fbbe2a484f3eb9955159f0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Dukungan Plugin Codex native memungkinkan agen OpenClaw mode Codex menggunakan kemampuan aplikasi dan Plugin milik Codex
app-server di dalam thread Codex yang sama yang
menangani giliran OpenClaw.

OpenClaw tidak menerjemahkan Plugin Codex menjadi tool dinamis OpenClaw
`codex_plugin_*` sintetis. Panggilan Plugin tetap berada dalam transkrip Codex native, dan
Codex app-server memiliki eksekusi MCP yang didukung aplikasi.

Gunakan halaman ini setelah [harness Codex](/id/plugins/codex-harness) dasar berfungsi.

## Persyaratan

- Runtime agen OpenClaw yang dipilih harus berupa harness Codex native.
- `plugins.entries.codex.enabled` harus true.
- `plugins.entries.codex.config.codexPlugins.enabled` harus true.
- V1 hanya mendukung Plugin `openai-curated` yang diamati migrasi sebagai
  terinstal dari sumber di home Codex sumber.
- Codex app-server target harus dapat melihat marketplace, Plugin, dan inventaris
  aplikasi yang diharapkan.

`codexPlugins` tidak berpengaruh pada eksekusi PI, eksekusi provider OpenAI normal, binding
percakapan ACP, atau harness lain karena jalur tersebut tidak membuat
thread Codex app-server dengan konfigurasi `apps` native.

## Mulai cepat

Pratinjau migrasi dari home Codex sumber:

```bash
openclaw migrate codex --dry-run
```

Terapkan migrasi ketika rencananya sudah terlihat benar:

```bash
openclaw migrate apply codex --yes
```

Migrasi menulis entri `codexPlugins` eksplisit untuk Plugin yang memenuhi syarat dan memanggil
Codex app-server `plugin/install` untuk Plugin yang dipilih. Konfigurasi hasil migrasi yang umum
terlihat seperti ini:

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

Setelah mengubah `codexPlugins`, gunakan `/new`, `/reset`, atau mulai ulang gateway agar
sesi harness Codex mendatang dimulai dengan set aplikasi yang diperbarui.

## Cara kerja penyiapan Plugin native

Integrasi ini memiliki tiga status terpisah:

- Terinstal: Codex memiliki bundel Plugin lokal di runtime app-server target.
- Diaktifkan: konfigurasi OpenClaw bersedia membuat Plugin tersedia untuk giliran
  harness Codex.
- Dapat diakses: Codex app-server mengonfirmasi bahwa entri aplikasi Plugin tersedia
  untuk akun aktif dan dapat dipetakan ke identitas Plugin hasil migrasi.

Migrasi adalah langkah instalasi/kelayakan yang tahan lama. Inventaris aplikasi runtime adalah
pemeriksaan aksesibilitas. Penyiapan sesi harness Codex kemudian menghitung konfigurasi
aplikasi thread yang restriktif untuk aplikasi Plugin yang diaktifkan dan dapat diakses.

Konfigurasi aplikasi thread dihitung ketika OpenClaw membuat sesi harness Codex
atau mengganti binding thread Codex yang sudah usang. Konfigurasi ini tidak dihitung ulang pada setiap giliran.

## Batas dukungan V1

V1 sengaja dibuat sempit:

- Hanya Plugin `openai-curated` yang sudah terinstal di inventaris Codex
  app-server sumber yang memenuhi syarat untuk migrasi.
- Migrasi menulis identitas Plugin eksplisit dengan `marketplaceName` dan
  `pluginName`; migrasi tidak menulis path cache `marketplacePath` lokal.
- `codexPlugins.enabled` adalah sakelar pengaktifan global.
- Tidak ada wildcard `plugins["*"]` dan tidak ada kunci konfigurasi yang memberikan kewenangan
  instalasi arbitrer.
- Marketplace, bundel Plugin cache, hook, dan file konfigurasi Codex yang tidak didukung
  dipertahankan dalam laporan migrasi untuk peninjauan manual.

## Inventaris aplikasi dan kepemilikan

OpenClaw membaca inventaris aplikasi Codex melalui app-server `app/list`, menyimpannya dalam cache selama
satu jam, dan menyegarkan entri yang usang atau hilang secara asinkron.

Aplikasi Plugin diekspos hanya ketika OpenClaw dapat memetakannya kembali ke Plugin hasil migrasi
melalui kepemilikan yang stabil:

- id aplikasi persis dari detail Plugin
- nama server MCP yang diketahui
- metadata stabil yang unik

Kepemilikan yang hanya berbasis nama tampilan atau ambigu dikecualikan hingga penyegaran inventaris
berikutnya membuktikan kepemilikan.

## Konfigurasi aplikasi thread

OpenClaw menyuntikkan patch `config.apps` yang restriktif untuk thread Codex:
`_default` dinonaktifkan dan hanya aplikasi yang dimiliki oleh Plugin hasil migrasi yang diaktifkan
yang diaktifkan.

OpenClaw menetapkan `destructive_enabled` tingkat aplikasi dari kebijakan global atau
per-Plugin `allow_destructive_actions` yang efektif dan membiarkan Codex menegakkan
metadata tool destruktif dari anotasi tool aplikasi nativenya. Konfigurasi aplikasi `_default`
dinonaktifkan dengan `open_world_enabled: false`. Aplikasi Plugin yang diaktifkan
dikeluarkan dengan `open_world_enabled: true`; OpenClaw tidak mengekspos knob kebijakan
open-world Plugin terpisah dan tidak memelihara daftar penolakan nama tool destruktif
per-Plugin.

Mode persetujuan tool bersifat otomatis secara default untuk aplikasi Plugin sehingga tool baca
non-destruktif dapat berjalan tanpa UI persetujuan dalam thread yang sama. Tool destruktif tetap
dikendalikan oleh kebijakan `destructive_enabled` masing-masing aplikasi.

## Kebijakan tindakan destruktif

Elicitation Plugin destruktif gagal tertutup secara default:

- `allow_destructive_actions` global bernilai default `false`.
- `allow_destructive_actions` per-Plugin mengganti kebijakan global untuk Plugin tersebut.
- Ketika kebijakan bernilai `false`, OpenClaw mengembalikan penolakan deterministik.
- Ketika kebijakan bernilai `true`, OpenClaw hanya menerima otomatis skema aman yang dapat dipetakan ke
  respons persetujuan, seperti field persetujuan boolean.
- Identitas Plugin yang hilang, kepemilikan ambigu, id giliran yang hilang, id giliran yang salah,
  atau skema elicitation yang tidak aman akan ditolak, bukan memunculkan prompt.

## Pemecahan masalah

**`auth_required`:** migrasi menginstal Plugin, tetapi salah satu aplikasinya masih
memerlukan autentikasi. Entri Plugin eksplisit ditulis dalam keadaan nonaktif hingga Anda
mengotorisasi ulang dan mengaktifkannya.

**`marketplace_missing` atau `plugin_missing`:** Codex app-server target
tidak dapat melihat marketplace atau Plugin `openai-curated` yang diharapkan. Jalankan ulang migrasi
terhadap runtime target atau periksa status Plugin Codex app-server.

**`app_inventory_missing` atau `app_inventory_stale`:** kesiapan aplikasi berasal dari
cache kosong atau usang. OpenClaw menjadwalkan penyegaran asinkron dan mengecualikan aplikasi
Plugin hingga kepemilikan dan kesiapan diketahui.

**`app_ownership_ambiguous`:** inventaris aplikasi hanya cocok berdasarkan nama tampilan, sehingga
aplikasi tidak diekspos ke thread Codex.

**Konfigurasi berubah tetapi agen tidak dapat melihat Plugin:** gunakan `/new`, `/reset`, atau
mulai ulang gateway. Binding thread Codex yang ada mempertahankan konfigurasi aplikasi yang
digunakan saat dimulai hingga OpenClaw membuat sesi harness baru atau mengganti
binding yang usang.

**Tindakan destruktif ditolak:** periksa nilai global dan per-Plugin
`allow_destructive_actions`. Bahkan ketika kebijakan bernilai true, skema elicitation
yang tidak aman dan identitas Plugin yang ambigu tetap gagal tertutup.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Referensi harness Codex](/id/plugins/codex-harness-reference)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Referensi konfigurasi](/id/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI migrasi](/id/cli/migrate)
