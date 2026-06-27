---
read_when:
    - Anda ingin agen OpenClaw mode Codex menggunakan plugin Codex native
    - Anda sedang memigrasikan Plugin Codex pilihan OpenAI yang diinstal dari sumber
    - Anda sedang memecahkan masalah codexPlugins, inventaris aplikasi, tindakan destruktif, atau diagnostik aplikasi plugin
summary: Konfigurasikan plugin Codex native yang dimigrasikan untuk agen OpenClaw mode Codex
title: Plugin Codex native
x-i18n:
    generated_at: "2026-06-27T17:46:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 82d8eb7ca7c10db5220c49426f5e9db5992ee751d48b2ac8c89e93773fc87776
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Dukungan plugin Codex native memungkinkan agen OpenClaw mode Codex menggunakan
kemampuan app dan plugin milik app-server Codex di dalam thread Codex yang sama
yang menangani giliran OpenClaw.

OpenClaw tidak menerjemahkan plugin Codex menjadi tool dinamis OpenClaw
`codex_plugin_*` sintetis. Panggilan plugin tetap berada di transkrip Codex
native, dan app-server Codex memiliki eksekusi MCP yang didukung app.

Gunakan halaman ini setelah [harness Codex](/id/plugins/codex-harness) dasar berfungsi.

## Persyaratan

- Runtime agen OpenClaw yang dipilih harus berupa harness Codex native.
- `plugins.entries.codex.enabled` harus true.
- `plugins.entries.codex.config.codexPlugins.enabled` harus true.
- V1 hanya mendukung plugin `openai-curated` yang diamati migrasi sebagai
  terpasang dari sumber di home Codex sumber.
- App-server Codex target harus dapat melihat marketplace, plugin, dan inventaris
  app yang diharapkan.

`codexPlugins` tidak berpengaruh pada proses OpenClaw, proses provider OpenAI
normal, binding percakapan ACP, atau harness lain karena jalur tersebut tidak
membuat thread app-server Codex dengan konfigurasi `apps` native.

Akses Codex sisi OpenAI, ketersediaan app, dan kontrol app/plugin workspace
berasal dari akun Codex yang masuk. Untuk model akun dan admin OpenAI, lihat
[Menggunakan Codex dengan paket ChatGPT Anda](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Mulai cepat

Pratinjau migrasi dari home Codex sumber:

```bash
openclaw migrate codex --dry-run
```

Gunakan verifikasi app sumber yang ketat saat Anda ingin migrasi memeriksa
aksesibilitas app sumber sebelum merencanakan aktivasi plugin native:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Terapkan migrasi saat rencananya terlihat benar:

```bash
openclaw migrate apply codex --yes
```

Migrasi menulis entri `codexPlugins` eksplisit untuk plugin yang memenuhi syarat
dan memanggil `plugin/install` app-server Codex untuk plugin yang dipilih.
Konfigurasi hasil migrasi yang umum terlihat seperti ini:

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

Setelah mengubah `codexPlugins`, percakapan Codex baru akan mengambil set app
yang diperbarui secara otomatis. Gunakan `/new` atau `/reset` untuk menyegarkan
percakapan saat ini. Restart gateway tidak diperlukan untuk perubahan aktivasi
atau penonaktifan plugin.

## Kelola plugin dari chat

Gunakan `/codex plugins` saat Anda ingin memeriksa atau mengubah plugin Codex
native yang dikonfigurasi dari chat yang sama tempat Anda mengoperasikan harness
Codex:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` adalah alias untuk `/codex plugins list`. Output daftar
menampilkan key plugin yang dikonfigurasi, status aktif/nonaktif, nama plugin
Codex, dan marketplace dari `plugins.entries.codex.config.codexPlugins.plugins`.

`enable` dan `disable` hanya menulis ke konfigurasi OpenClaw di
`~/.openclaw/openclaw.json`; keduanya tidak mengedit `~/.codex/config.toml` atau
memasang plugin Codex baru. Hanya pemilik atau klien gateway dengan cakupan
`operator.admin` yang dapat mengubah status plugin.

Mengaktifkan plugin yang dikonfigurasi juga menyalakan switch global
`codexPlugins.enabled`. Jika plugin ditulis dalam keadaan nonaktif karena
migrasi mengembalikan `auth_required`, otorisasi ulang app di Codex sebelum
mengaktifkannya di OpenClaw.

## Cara kerja penyiapan plugin native

Integrasi memiliki tiga status terpisah:

- Terpasang: Codex memiliki bundle plugin lokal di runtime app-server target.
- Aktif: Konfigurasi OpenClaw bersedia membuat plugin tersedia untuk giliran
  harness Codex.
- Dapat diakses: App-server Codex mengonfirmasi entri app plugin tersedia untuk
  akun aktif dan dapat dipetakan ke identitas plugin yang dimigrasikan.

Migrasi adalah langkah pemasangan/kelayakan yang tahan lama. Selama perencanaan,
OpenClaw membaca detail `plugin/read` Codex sumber dan memeriksa bahwa respons
akun app-server Codex sumber adalah akun langganan ChatGPT. Respons akun non-ChatGPT
atau yang hilang melewati plugin yang didukung app dengan
`codex_subscription_required`. Secara default, migrasi tidak memanggil `app/list`
sumber; plugin sumber yang didukung app dan lulus gate akun direncanakan tanpa
verifikasi aksesibilitas app sumber, dan kegagalan transport pencarian akun
dilewati dengan `codex_account_unavailable`. Dengan `--verify-plugin-apps`,
migrasi mengambil snapshot `app/list` sumber yang baru dan mengharuskan setiap
app yang dimiliki ada, aktif, dan dapat diakses sebelum merencanakan aktivasi
native. Dalam mode tersebut, kegagalan transport pencarian akun jatuh ke gate
inventaris app sumber. Inventaris app runtime adalah pemeriksaan aksesibilitas
sesi target setelah migrasi. Penyiapan sesi harness Codex lalu menghitung
konfigurasi app thread yang restriktif untuk app plugin yang aktif dan dapat
diakses.

Konfigurasi app thread dihitung saat OpenClaw membuat sesi harness Codex atau
mengganti binding thread Codex yang stale. Konfigurasi ini tidak dihitung ulang
pada setiap giliran, jadi `/codex plugins enable` dan `/codex plugins disable`
memengaruhi percakapan Codex baru. Gunakan `/new` atau `/reset` saat percakapan
saat ini harus mengambil set app yang diperbarui.

## Batas dukungan V1

V1 sengaja dibuat sempit:

- Hanya plugin `openai-curated` yang sudah terpasang di inventaris app-server
  Codex sumber yang memenuhi syarat migrasi.
- Plugin sumber yang didukung app harus lulus gate langganan pada waktu migrasi.
  `--verify-plugin-apps` menambahkan gate inventaris app sumber. Akun yang
  terkena gate langganan plus, dalam mode verifikasi, app sumber yang tidak
  dapat diakses, nonaktif, hilang, atau kegagalan refresh inventaris app sumber
  dilaporkan sebagai item manual yang dilewati, bukan entri konfigurasi yang
  aktif. Detail plugin yang tidak dapat dibaca dilewati sebelum gate inventaris
  app sumber.
- Migrasi menulis identitas plugin eksplisit dengan `marketplaceName` dan
  `pluginName`; migrasi tidak menulis path cache `marketplacePath` lokal.
- `codexPlugins.enabled` adalah switch aktivasi global.
- Tidak ada wildcard `plugins["*"]` dan tidak ada key konfigurasi yang memberikan
  otoritas pemasangan arbitrer.
- Marketplace yang tidak didukung, bundle plugin yang di-cache, hook, dan file
  konfigurasi Codex dipertahankan dalam laporan migrasi untuk peninjauan manual.

## Inventaris app dan kepemilikan

OpenClaw membaca inventaris app Codex melalui `app/list` app-server, menyimpannya
di cache selama satu jam, dan menyegarkan entri yang stale atau hilang secara
asinkron. Cache hanya berada di memori; merestart CLI atau gateway akan
menghapusnya, dan OpenClaw membangunnya ulang dari pembacaan `app/list` berikutnya.

Migrasi dan runtime menggunakan key cache terpisah:

- Verifikasi migrasi sumber menggunakan home Codex sumber dan opsi start
  app-server sumber. Ini hanya berjalan saat `--verify-plugin-apps` ditetapkan,
  dan memaksa traversal `app/list` sumber yang baru untuk proses perencanaan itu.
- Penyiapan runtime target menggunakan identitas app-server Codex agen target
  saat membangun konfigurasi app thread Codex. Aktivasi plugin membatalkan key
  cache target tersebut lalu me-refresh paksa setelah `plugin/install`.

App plugin hanya diekspos saat OpenClaw dapat memetakannya kembali ke plugin
yang dimigrasikan melalui kepemilikan stabil:

- id app yang persis dari detail plugin
- nama server MCP yang diketahui
- metadata stabil yang unik

Kepemilikan yang hanya berdasarkan nama tampilan atau ambigu dikecualikan
hingga refresh inventaris berikutnya membuktikan kepemilikan.

## Konfigurasi app thread

OpenClaw menyuntikkan patch `config.apps` yang restriktif untuk thread Codex:
`_default` dinonaktifkan dan hanya app yang dimiliki plugin hasil migrasi yang
aktif yang diaktifkan.

OpenClaw menetapkan `destructive_enabled` tingkat app dari kebijakan global atau
per-plugin `allow_destructive_actions` yang efektif dan membiarkan Codex
menegakkan metadata tool destruktif dari anotasi tool app native-nya. `true`,
`"auto"`, dan `"always"` menetapkan `destructive_enabled: true`; `false`
menetapkannya false. Konfigurasi app `_default` dinonaktifkan dengan
`open_world_enabled: false`. App plugin yang aktif dikeluarkan dengan
`open_world_enabled: true`; OpenClaw tidak mengekspos knob kebijakan open-world
plugin terpisah dan tidak memelihara daftar tolak nama tool destruktif per plugin.

Mode persetujuan tool otomatis secara default untuk app plugin sehingga tool baca
non-destruktif dapat berjalan tanpa UI persetujuan dalam thread yang sama. Tool
destruktif tetap dikontrol oleh kebijakan `destructive_enabled` setiap app.

## Kebijakan tindakan destruktif

Elisitasi plugin destruktif diizinkan secara default untuk plugin Codex hasil
migrasi, sementara skema yang tidak aman dan kepemilikan ambigu tetap gagal
tertutup:

- `allow_destructive_actions` global default ke `true`.
- `allow_destructive_actions` per-plugin menimpa kebijakan global untuk plugin
  tersebut.
- Saat kebijakan bernilai `false`, OpenClaw mengembalikan penolakan deterministik.
- Saat kebijakan bernilai `true`, OpenClaw hanya menerima otomatis skema aman
  yang dapat dipetakannya ke respons persetujuan, seperti field persetujuan
  boolean.
- Saat kebijakan bernilai `"auto"`, OpenClaw mengekspos tindakan plugin
  destruktif ke Codex tetapi mengubah elisitasi persetujuan MCP dengan
  kepemilikan terbukti menjadi persetujuan plugin OpenClaw sebelum mengembalikan
  respons persetujuan Codex.
- Saat kebijakan bernilai `"always"`, OpenClaw menggunakan gating tulis/destruktif
  Codex yang sama seperti `"auto"`, menghapus override persetujuan per-tool
  Codex yang tahan lama untuk app sebelum thread dimulai, dan hanya menawarkan
  persetujuan atau penolakan sekali pakai agar persetujuan tahan lama tidak dapat
  menekan prompt tindakan tulis berikutnya.
- Identitas plugin yang hilang, kepemilikan ambigu, id giliran yang hilang, id
  giliran yang salah, atau skema elisitasi yang tidak aman akan ditolak, bukan
  memunculkan prompt.

## Pemecahan masalah

**`auth_required`:** migrasi memasang plugin, tetapi salah satu app-nya masih
memerlukan autentikasi. Entri plugin eksplisit ditulis dalam keadaan nonaktif
hingga Anda mengotorisasi ulang dan mengaktifkannya.

**`app_inaccessible`, `app_disabled`, atau `app_missing`:**
migrasi tidak memasang plugin karena inventaris app Codex sumber tidak
menunjukkan semua app yang dimiliki sebagai ada, aktif, dan dapat diakses saat
`--verify-plugin-apps` ditetapkan. Otorisasi ulang atau aktifkan app di Codex,
lalu jalankan ulang migrasi dengan `--verify-plugin-apps`.

**`app_inventory_unavailable`:** migrasi tidak memasang plugin karena verifikasi
app sumber yang ketat diminta dan refresh inventaris app Codex sumber gagal.
Perbaiki akses app-server Codex sumber atau coba lagi tanpa
`--verify-plugin-apps` jika Anda menerima rencana yang lebih cepat berbasis gate
akun.

**`codex_subscription_required`:** migrasi tidak memasang plugin yang didukung
app karena akun app-server Codex sumber tidak masuk dengan akun langganan
ChatGPT. Masuk ke app Codex dengan auth langganan, lalu jalankan ulang migrasi.

**`codex_account_unavailable`:** migrasi tidak memasang plugin yang didukung app
karena akun app-server Codex sumber tidak dapat dibaca. Perbaiki auth app-server
Codex sumber atau jalankan ulang dengan `--verify-plugin-apps` jika Anda ingin
inventaris app sumber menentukan kelayakan saat pencarian akun gagal.

**`marketplace_missing` atau `plugin_missing`:** app-server Codex target tidak
dapat melihat marketplace atau plugin `openai-curated` yang diharapkan. Jalankan
ulang migrasi terhadap runtime target atau periksa status plugin app-server Codex.

**`app_inventory_missing` atau `app_inventory_stale`:** kesiapan app berasal dari
cache kosong atau stale. OpenClaw menjadwalkan refresh async dan mengecualikan
app plugin hingga kepemilikan dan kesiapan diketahui.

**`app_ownership_ambiguous`:** inventaris app hanya cocok berdasarkan nama
tampilan, sehingga app tidak diekspos ke thread Codex.

**Konfigurasi berubah tetapi agen tidak dapat melihat plugin:** gunakan
`/codex plugins list` untuk mengonfirmasi status yang dikonfigurasi, lalu gunakan
`/new` atau `/reset`. Binding thread Codex yang ada mempertahankan konfigurasi
app yang digunakan saat dimulai hingga OpenClaw membuat sesi harness baru atau
mengganti binding yang stale.

**Tindakan destruktif ditolak:** periksa nilai `allow_destructive_actions` global dan per-Plugin. Bahkan ketika kebijakan bernilai true, `"auto"`, atau `"always"`, skema elisitasi yang tidak aman dan identitas Plugin yang ambigu tetap gagal tertutup.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Referensi harness Codex](/id/plugins/codex-harness-reference)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Referensi konfigurasi](/id/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrasi CLI](/id/cli/migrate)
