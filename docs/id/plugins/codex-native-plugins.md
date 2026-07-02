---
read_when:
    - Anda ingin agen OpenClaw mode Codex menggunakan Plugin Codex native
    - Anda sedang memigrasikan plugin Codex yang dikurasi openai dan diinstal dari sumber
    - Anda sedang memecahkan masalah codexPlugins, inventaris aplikasi, tindakan destruktif, atau diagnostik aplikasi plugin
summary: Konfigurasikan Plugin Codex native yang dimigrasikan untuk agen OpenClaw mode Codex
title: Plugin Codex native
x-i18n:
    generated_at: "2026-07-02T01:16:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 11a883137ba89936cf564a45b22c9e76097af669e2ef6c70c8c710bb2b79d3c0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Dukungan Plugin Codex native memungkinkan agen OpenClaw mode Codex menggunakan
kemampuan aplikasi dan Plugin milik app-server Codex di dalam thread Codex yang sama
yang menangani giliran OpenClaw.

OpenClaw tidak menerjemahkan Plugin Codex menjadi dynamic tools
OpenClaw `codex_plugin_*` sintetis. Panggilan Plugin tetap berada dalam transkrip Codex native, dan
app-server Codex memiliki eksekusi MCP yang didukung aplikasi.

Gunakan halaman ini setelah [harness Codex](/id/plugins/codex-harness) dasar berfungsi.

## Persyaratan

- Runtime agen OpenClaw yang dipilih harus berupa harness Codex native.
- `plugins.entries.codex.enabled` harus true.
- `plugins.entries.codex.config.codexPlugins.enabled` harus true.
- V1 hanya mendukung Plugin `openai-curated` yang diamati migrasi sebagai
  terpasang dari sumber di home Codex sumber.
- App-server Codex target harus dapat melihat marketplace,
  Plugin, dan inventaris aplikasi yang diharapkan.

`codexPlugins` tidak berpengaruh pada proses OpenClaw, proses provider OpenAI normal, binding
percakapan ACP, atau harness lain karena jalur tersebut tidak membuat
thread app-server Codex dengan konfigurasi `apps` native.

Akses Codex sisi OpenAI, ketersediaan aplikasi, dan kontrol aplikasi/Plugin workspace
berasal dari akun Codex yang masuk. Untuk akun OpenAI dan model admin,
lihat [Menggunakan Codex dengan paket ChatGPT Anda](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Mulai cepat

Pratinjau migrasi dari home Codex sumber:

```bash
openclaw migrate codex --dry-run
```

Gunakan verifikasi aplikasi sumber yang ketat ketika Anda ingin migrasi memeriksa
aksesibilitas aplikasi sumber sebelum merencanakan aktivasi Plugin native:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Terapkan migrasi ketika rencananya terlihat benar:

```bash
openclaw migrate apply codex --yes
```

Migrasi menulis entri `codexPlugins` eksplisit untuk Plugin yang memenuhi syarat dan memanggil
`plugin/install` app-server Codex untuk Plugin yang dipilih. Konfigurasi hasil migrasi
yang umum terlihat seperti ini:

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

Setelah mengubah `codexPlugins`, percakapan Codex baru mengambil set aplikasi yang diperbarui
secara otomatis. Gunakan `/new` atau `/reset` untuk menyegarkan percakapan saat ini.
Restart Gateway tidak diperlukan untuk perubahan pengaktifan atau penonaktifan Plugin.

## Kelola Plugin dari chat

Gunakan `/codex plugins` ketika Anda ingin memeriksa atau mengubah Plugin Codex native
yang dikonfigurasi dari chat yang sama tempat Anda mengoperasikan harness Codex:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` adalah alias untuk `/codex plugins list`. Output daftar menampilkan
kunci Plugin yang dikonfigurasi, status aktif/nonaktif, nama Plugin Codex, dan marketplace
dari `plugins.entries.codex.config.codexPlugins.plugins`.

`enable` dan `disable` hanya menulis ke konfigurasi OpenClaw di
`~/.openclaw/openclaw.json`; keduanya tidak mengedit `~/.codex/config.toml` atau memasang
Plugin Codex baru. Hanya owner atau klien Gateway dengan cakupan
`operator.admin` yang dapat mengubah status Plugin.

Mengaktifkan Plugin yang dikonfigurasi juga menyalakan switch global
`codexPlugins.enabled`. Jika Plugin ditulis dalam keadaan nonaktif karena
migrasi mengembalikan `auth_required`, otorisasi ulang aplikasi di Codex sebelum mengaktifkannya
di OpenClaw.

## Cara kerja penyiapan Plugin native

Integrasi memiliki tiga status terpisah:

- Terpasang: Codex memiliki bundle Plugin lokal di runtime app-server target.
- Aktif: Konfigurasi OpenClaw bersedia membuat Plugin tersedia untuk giliran
  harness Codex.
- Dapat diakses: app-server Codex mengonfirmasi entri aplikasi Plugin tersedia
  untuk akun aktif dan dapat dipetakan ke identitas Plugin yang dimigrasikan.

Migrasi adalah langkah pemasangan/kelayakan yang persisten. Selama perencanaan, OpenClaw
membaca detail `plugin/read` Codex sumber dan memeriksa bahwa respons akun
app-server Codex sumber adalah akun langganan ChatGPT. Respons akun non-ChatGPT atau
yang hilang melewati Plugin yang didukung aplikasi dengan
`codex_subscription_required`. Secara default, migrasi tidak memanggil
`app/list` sumber; Plugin sumber yang didukung aplikasi yang lolos gerbang akun direncanakan
tanpa verifikasi aksesibilitas aplikasi sumber, dan kegagalan transport lookup akun
dilewati dengan `codex_account_unavailable`. Dengan `--verify-plugin-apps`,
migrasi mengambil snapshot `app/list` sumber yang baru dan mengharuskan setiap aplikasi yang dimiliki
hadir, aktif, dan dapat diakses sebelum merencanakan aktivasi native. Dalam
mode tersebut, kegagalan transport lookup akun diteruskan ke gerbang inventaris aplikasi
sumber. Inventaris aplikasi runtime adalah pemeriksaan aksesibilitas sesi target
setelah migrasi. Penyiapan sesi harness Codex kemudian menghitung konfigurasi aplikasi thread
yang ketat untuk aplikasi Plugin yang aktif dan dapat diakses.

Konfigurasi aplikasi thread dihitung ketika OpenClaw membuat sesi harness Codex
atau mengganti binding thread Codex yang usang. Konfigurasi ini tidak dihitung ulang pada setiap giliran, sehingga
`/codex plugins enable` dan `/codex plugins disable` memengaruhi percakapan Codex
baru. Gunakan `/new` atau `/reset` ketika percakapan saat ini perlu mengambil
set aplikasi yang diperbarui.

## Batas dukungan V1

V1 sengaja dibuat sempit:

- Hanya Plugin `openai-curated` yang sudah terpasang di inventaris app-server Codex
  sumber yang memenuhi syarat migrasi.
- Plugin sumber yang didukung aplikasi harus lolos gerbang langganan saat migrasi.
  `--verify-plugin-apps` menambahkan gerbang inventaris aplikasi sumber. Akun yang dibatasi langganan
  ditambah, dalam mode verifikasi, aplikasi sumber yang tidak dapat diakses, nonaktif, hilang,
  atau kegagalan refresh inventaris aplikasi sumber dilaporkan sebagai item manual yang dilewati
  alih-alih entri konfigurasi aktif. Detail Plugin yang tidak dapat dibaca dilewati
  sebelum gerbang inventaris aplikasi sumber.
- Migrasi menulis identitas Plugin eksplisit dengan `marketplaceName` dan
  `pluginName`; migrasi tidak menulis jalur cache `marketplacePath` lokal.
- `codexPlugins.enabled` adalah switch pengaktifan global.
- Tidak ada wildcard `plugins["*"]` dan tidak ada kunci konfigurasi yang memberikan
  otoritas pemasangan arbitrer.
- Marketplace yang tidak didukung, bundle Plugin yang di-cache, hook, dan file konfigurasi Codex
  dipertahankan dalam laporan migrasi untuk peninjauan manual.

## Inventaris dan kepemilikan aplikasi

OpenClaw membaca inventaris aplikasi Codex melalui `app/list` app-server, menyimpannya dalam cache selama
satu jam, dan menyegarkan entri yang usang atau hilang secara asinkron. Cache ini
hanya berada di memori; memulai ulang CLI atau Gateway menghapusnya, dan OpenClaw membangunnya ulang
dari pembacaan `app/list` berikutnya.

Migrasi dan runtime menggunakan kunci cache terpisah:

- Verifikasi migrasi sumber menggunakan home Codex sumber dan opsi mulai app-server
  sumber. Ini hanya berjalan ketika `--verify-plugin-apps` ditetapkan, dan
  memaksa traversal `app/list` sumber yang baru untuk proses perencanaan tersebut.
- Penyiapan runtime target menggunakan identitas app-server Codex agen target ketika
  membangun konfigurasi aplikasi thread Codex. Aktivasi Plugin membatalkan kunci cache target
  tersebut lalu menyegarkannya paksa setelah `plugin/install`.

Aplikasi Plugin diekspos hanya ketika OpenClaw dapat memetakannya kembali ke Plugin yang dimigrasikan
melalui kepemilikan stabil:

- id aplikasi persis dari detail Plugin
- nama server MCP yang diketahui
- metadata stabil yang unik

Kepemilikan yang hanya berdasarkan nama tampilan atau ambigu dikecualikan hingga refresh inventaris
berikutnya membuktikan kepemilikan.

## Konfigurasi aplikasi thread

OpenClaw menyuntikkan patch `config.apps` yang ketat untuk thread Codex:
`_default` dinonaktifkan dan hanya aplikasi yang dimiliki oleh Plugin hasil migrasi yang aktif
yang diaktifkan.

OpenClaw menetapkan `destructive_enabled` tingkat aplikasi dari kebijakan global atau
per-Plugin `allow_destructive_actions` efektif dan membiarkan Codex menegakkan
metadata tool destruktif dari anotasi tool aplikasi native-nya. `true`,
`"auto"`, dan `"ask"` menetapkan `destructive_enabled: true`; `false` menetapkannya
false. Konfigurasi aplikasi `_default` dinonaktifkan dengan `open_world_enabled: false`.
Aplikasi Plugin yang aktif dikeluarkan dengan `open_world_enabled: true`; OpenClaw tidak
mengekspos kenop kebijakan open-world Plugin terpisah dan tidak memelihara
daftar tolak nama tool destruktif per-Plugin.

Mode persetujuan tool bersifat otomatis secara default untuk aplikasi Plugin sehingga tool baca
non-destruktif dapat berjalan tanpa UI persetujuan dalam thread yang sama. Tool destruktif tetap
dikontrol oleh kebijakan `destructive_enabled` tiap aplikasi.

## Kebijakan tindakan destruktif

Elicitations Plugin destruktif diizinkan secara default untuk Plugin Codex yang dimigrasikan,
sementara skema yang tidak aman dan kepemilikan ambigu tetap gagal tertutup:

- `allow_destructive_actions` global default-nya `true`.
- `allow_destructive_actions` per-Plugin menggantikan kebijakan global untuk Plugin tersebut.
- Ketika kebijakan adalah `false`, OpenClaw mengembalikan penolakan deterministik.
- Ketika kebijakan adalah `true`, OpenClaw hanya menerima otomatis skema aman yang dapat dipetakannya ke
  respons persetujuan, seperti field approve boolean.
- Ketika kebijakan adalah `"auto"`, OpenClaw mengekspos tindakan Plugin destruktif ke
  Codex tetapi mengubah elicitations persetujuan MCP yang terbukti kepemilikannya menjadi persetujuan Plugin
  OpenClaw sebelum mengembalikan respons persetujuan Codex.
- Ketika kebijakan adalah `"ask"`, OpenClaw menggunakan gating tulis/destruktif Codex
  yang sama seperti `"auto"`, menghapus override persetujuan per-tool Codex yang persisten untuk
  aplikasi sebelum thread dimulai, dan hanya menawarkan persetujuan atau penolakan sekali pakai sehingga
  persetujuan persisten tidak dapat menekan prompt tindakan tulis berikutnya.
- Untuk setiap aplikasi yang diterima yang menggunakan `"ask"`, OpenClaw memilih reviewer persetujuan manusia
  Codex untuk aplikasi tersebut sehingga Codex mengirim elicitations persetujuannya ke
  OpenClaw. Aplikasi lain dan persetujuan thread non-aplikasi tetap menggunakan
  reviewer dan kebijakan yang dikonfigurasi.
- Identitas Plugin yang hilang, kepemilikan ambigu, id giliran yang hilang, id giliran yang salah,
  atau skema elicitation yang tidak aman ditolak alih-alih memunculkan prompt.

## Pemecahan masalah

**`auth_required`:** migrasi memasang Plugin, tetapi salah satu aplikasinya masih
memerlukan autentikasi. Entri Plugin eksplisit ditulis dalam keadaan nonaktif hingga Anda
mengotorisasi ulang dan mengaktifkannya.

**`app_inaccessible`, `app_disabled`, atau `app_missing`:**
migrasi tidak memasang Plugin karena inventaris aplikasi Codex sumber tidak
menampilkan semua aplikasi yang dimiliki sebagai hadir, aktif, dan dapat diakses saat
`--verify-plugin-apps` ditetapkan. Otorisasi ulang atau aktifkan aplikasi di Codex, lalu
jalankan ulang migrasi dengan `--verify-plugin-apps`.

**`app_inventory_unavailable`:** migrasi tidak memasang Plugin karena
verifikasi aplikasi sumber yang ketat diminta dan refresh inventaris aplikasi Codex sumber
gagal. Perbaiki akses app-server Codex sumber atau coba lagi tanpa
`--verify-plugin-apps` jika Anda menerima rencana yang lebih cepat berbasis gerbang akun.

**`codex_subscription_required`:** migrasi tidak memasang Plugin yang didukung aplikasi
karena akun app-server Codex sumber tidak masuk dengan akun langganan
ChatGPT. Masuk ke aplikasi Codex dengan autentikasi langganan,
lalu jalankan ulang migrasi.

**`codex_account_unavailable`:** migrasi tidak memasang Plugin yang didukung aplikasi
karena akun app-server Codex sumber tidak dapat dibaca. Perbaiki autentikasi app-server Codex
sumber atau jalankan ulang dengan `--verify-plugin-apps` jika Anda ingin inventaris aplikasi sumber
menentukan kelayakan ketika lookup akun gagal.

**`marketplace_missing` atau `plugin_missing`:** app-server Codex target
tidak dapat melihat marketplace atau Plugin `openai-curated` yang diharapkan. Jalankan ulang migrasi
terhadap runtime target atau periksa status Plugin app-server Codex.

**`app_inventory_missing` atau `app_inventory_stale`:** kesiapan aplikasi berasal dari
cache kosong atau usang. OpenClaw menjadwalkan refresh async dan mengecualikan aplikasi
Plugin hingga kepemilikan dan kesiapan diketahui.

**`app_ownership_ambiguous`:** inventaris aplikasi hanya cocok berdasarkan nama tampilan, sehingga
aplikasi tidak diekspos ke thread Codex.

**Konfigurasi berubah tetapi agen tidak dapat melihat Plugin:** gunakan `/codex plugins
list` untuk mengonfirmasi status yang dikonfigurasi, lalu gunakan `/new` atau `/reset`. Pengikatan thread Codex yang ada mempertahankan konfigurasi aplikasi yang digunakan saat dimulai sampai OpenClaw membuat sesi harness baru atau mengganti pengikatan usang.

**Tindakan destruktif ditolak:** periksa nilai global dan per-Plugin
`allow_destructive_actions`. Bahkan ketika kebijakan bernilai true, `"auto"`, atau
`"ask"`, skema elisitasi yang tidak aman dan identitas Plugin yang ambigu tetap gagal secara tertutup.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Referensi harness Codex](/id/plugins/codex-harness-reference)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Referensi konfigurasi](/id/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrasi CLI](/id/cli/migrate)
