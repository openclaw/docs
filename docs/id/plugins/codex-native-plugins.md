---
read_when:
    - Anda ingin agen OpenClaw dalam mode Codex menggunakan plugin native Codex
    - Anda sedang memigrasikan plugin Codex pilihan OpenAI yang diinstal dari sumber
    - Anda sedang mengonfigurasi Plugin Codex direktori ruang kerja yang sudah ada
    - Anda sedang memecahkan masalah codexPlugins, inventaris aplikasi, tindakan destruktif, atau diagnostik aplikasi plugin
summary: Konfigurasikan plugin Codex native untuk agen OpenClaw mode Codex
title: Plugin Codex native
x-i18n:
    generated_at: "2026-07-12T14:25:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b1cfa39838d4dbd1f33a1e5b7f52faec4b033f9fa98ef5c029003177c2e27e5
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Dukungan Plugin Codex native memungkinkan agen OpenClaw dalam mode Codex menggunakan kemampuan aplikasi dan Plugin milik app-server Codex di dalam utas Codex yang sama yang menangani giliran OpenClaw. Panggilan Plugin tetap berada dalam transkrip Codex native; app-server Codex menangani eksekusi MCP yang didukung aplikasi. OpenClaw tidak menerjemahkan Plugin Codex menjadi alat dinamis OpenClaw sintetis `codex_plugin_*`.

Gunakan halaman ini setelah [harness Codex](/id/plugins/codex-harness) dasar berfungsi.

## Persyaratan

- Runtime agen harus berupa harness Codex native.
- `plugins.entries.codex.enabled` bernilai `true`.
- `plugins.entries.codex.config.codexPlugins.enabled` bernilai `true`.
- App-server Codex target dapat melihat inventaris marketplace, Plugin, dan aplikasi yang diharapkan.
- Migrasi hanya mendukung Plugin `openai-curated` yang teramati terinstal dari sumber di direktori home Codex sumber.
- Plugin `workspace-directory` yang dikonfigurasi secara manual memerlukan app-server Codex yang `plugin/list`-nya menerima `marketplaceKinds` dan ringkasan workspace tanpa path-nya menyertakan `remotePluginId`. Plugin harus sudah terinstal dan diaktifkan, serta aplikasi yang dimilikinya harus dapat diakses di `app/list`.

`codexPlugins` tidak berpengaruh pada proses yang menggunakan penyedia OpenClaw, pengikatan percakapan ACP, atau harness lain karena jalur tersebut tidak pernah membuat utas app-server Codex dengan konfigurasi `apps` native.

Akun Codex, ketersediaan aplikasi, dan kontrol aplikasi/Plugin workspace di sisi OpenAI berasal dari akun Codex yang telah masuk. Lihat [Menggunakan Codex dengan paket ChatGPT Anda](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) untuk model akun dan administrasi OpenAI.

## Mulai cepat

Pratinjau migrasi dari direktori home Codex sumber:

```bash
openclaw migrate codex --dry-run
```

Tambahkan `--verify-plugin-apps` agar migrasi memanggil `app/list` sumber dan mewajibkan setiap aplikasi yang dimiliki tersedia, diaktifkan, serta dapat diakses sebelum merencanakan aktivasi native:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Terapkan migrasi setelah rencananya terlihat benar:

```bash
openclaw migrate apply codex --yes
```

Migrasi menulis entri `codexPlugins` eksplisit untuk Plugin yang memenuhi syarat dan memanggil `plugin/install` app-server Codex untuk Plugin yang dipilih. Konfigurasi hasil migrasi terlihat seperti ini:

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

Migrasi tetap terbatas pada `openai-curated`. Untuk menggunakan Plugin `workspace-directory` yang sudah ada, tambahkan secara manual menggunakan `summary.id` persis yang dilengkapi kualifikasi marketplace dan dikembalikan oleh `plugin/list`. Misalnya, jika Codex mengembalikan `example-plugin@workspace-directory`, konfigurasikan nilai lengkap tersebut, bukan nama tampilannya:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            plugins: {
              "example-plugin": {
                enabled: true,
                marketplaceName: "workspace-directory",
                pluginName: "example-plugin@workspace-directory",
              },
            },
          },
        },
      },
    },
  },
}
```

OpenClaw tidak memanggil `plugin/install` atau memulai autentikasi untuk Plugin `workspace-directory`. Instal, aktifkan, dan autentikasikan Plugin tersebut di Codex sebelum menambahkan atau mengaktifkan kebijakan OpenClaw. OpenClaw tetap menyembunyikan aplikasi ketika respons tidak menyertakan bukti kesiapan aplikasi, marketplace persis, ID Plugin, atau ID detail. Jika Codex menolak permintaan `plugin/list` workspace eksplisit, OpenClaw melaporkan `marketplace_missing` untuk setiap Plugin workspace yang diaktifkan dan tetap menyediakan Plugin terkurasi yang ditemukan secara independen.

Setelah perubahan `codexPlugins`, percakapan Codex baru otomatis menggunakan kumpulan aplikasi yang diperbarui. Jalankan `/new` atau `/reset` untuk menyegarkan percakapan saat ini. Gateway tidak perlu dimulai ulang untuk perubahan pengaktifan atau penonaktifan Plugin.

## Mengelola Plugin dari obrolan

`/codex plugins` memeriksa atau mengubah Plugin Codex native yang dikonfigurasi dari obrolan yang sama tempat Anda mengoperasikan harness Codex:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` adalah alias untuk `/codex plugins list`. Daftar tersebut menampilkan kunci, status aktif/nonaktif, nama Plugin Codex, dan marketplace setiap Plugin yang dikonfigurasi dari `plugins.entries.codex.config.codexPlugins.plugins`.

`enable`/`disable` hanya menulis ke `~/.openclaw/openclaw.json`; perintah tersebut tidak pernah mengedit `~/.codex/config.toml` atau menginstal Plugin Codex baru. Hanya pemilik atau klien Gateway dengan cakupan `operator.admin` yang dapat menjalankannya.

Mengaktifkan Plugin yang dikonfigurasi juga mengaktifkan sakelar global `codexPlugins.enabled`. Jika Plugin terkurasi ditulis sebagai nonaktif karena migrasi mengembalikan `auth_required`, otorisasi ulang aplikasi di Codex sebelum mengaktifkannya di OpenClaw. Untuk entri `workspace-directory`, mengaktifkannya di sini hanya mengubah kebijakan OpenClaw; Plugin dan aplikasi harus sudah aktif di Codex.

## Cara kerja penyiapan Plugin native

Integrasi ini melacak tiga status:

| Status       | Arti                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Terinstal    | Codex memiliki bundel Plugin dalam runtime app-server target.                                                                        |
| Diaktifkan   | Codex melaporkan bahwa Plugin diaktifkan, dan konfigurasi OpenClaw mengizinkannya untuk giliran harness Codex.                       |
| Dapat diakses | App-server Codex mengonfirmasi bahwa entri aplikasi Plugin tersedia untuk akun aktif dan dipetakan ke identitas Plugin terkonfigurasi. |

Untuk Plugin `openai-curated`, migrasi merupakan langkah instalasi/kelayakan yang persisten:

- Selama perencanaan, OpenClaw membaca detail `plugin/read` Codex sumber dan memeriksa bahwa akun app-server Codex sumber merupakan akun langganan ChatGPT. Respons akun non-ChatGPT atau yang tidak ada menyebabkan Plugin yang didukung aplikasi dilewati dengan `codex_subscription_required`.
- Secara default, migrasi melewati panggilan `app/list` sumber: Plugin sumber yang didukung aplikasi dan lolos pemeriksaan akun direncanakan tanpa verifikasi aksesibilitas aplikasi sumber, sedangkan kegagalan transport pencarian akun menyebabkan Plugin dilewati dengan `codex_account_unavailable`.
- Dengan `--verify-plugin-apps`, migrasi mengambil snapshot `app/list` sumber terbaru dan mewajibkan setiap aplikasi yang dimiliki tersedia, diaktifkan, serta dapat diakses sebelum merencanakan aktivasi native. Kegagalan transport pencarian akun kemudian diteruskan ke pemeriksaan inventaris aplikasi sumber, bukan langsung menyebabkan Plugin dilewati.

Untuk Plugin `workspace-directory`, penyiapan dilakukan di luar OpenClaw. OpenClaw hanya mengkueri marketplace tersebut ketika setidaknya satu entri workspace aktif dikonfigurasi, menyelesaikan setiap Plugin berdasarkan `summary.id` persis, dan menggunakan kembali pemeriksaan kepemilikan `plugin/read` serta kesiapan `app/list` yang ada. Plugin yang belum terinstal, dinonaktifkan, tidak dapat diakses, atau belum diautentikasi tidak menampilkan aplikasi apa pun; OpenClaw tidak mencoba melakukan instalasi atau autentikasi.

Inventaris aplikasi runtime merupakan pemeriksaan aksesibilitas sesi target untuk Plugin terkurasi hasil migrasi dan Plugin workspace yang dikonfigurasi secara manual. Penyiapan sesi harness Codex menghitung konfigurasi aplikasi utas yang restriktif dari aplikasi Plugin yang diaktifkan dan dapat diakses; konfigurasi ini tidak dihitung ulang pada setiap giliran, sehingga `/codex plugins enable`/`disable` hanya memengaruhi percakapan Codex baru. Gunakan `/new` atau `/reset` agar perubahan diterapkan pada percakapan saat ini.

## Batas dukungan V1

- Hanya Plugin `openai-curated` yang sudah terinstal dalam inventaris app-server Codex sumber yang memenuhi syarat untuk migrasi.
- Runtime juga mendukung entri `workspace-directory` eksplisit pada versi app-server yang `plugin/list`-nya mengimplementasikan `marketplaceKinds` dan mengembalikan `remotePluginId` untuk ringkasan workspace tanpa path. Entri tersebut harus menggunakan `summary.id` persis yang dilengkapi kualifikasi marketplace dan harus sudah terinstal, diaktifkan, serta aplikasinya dapat diakses. Permintaan daftar workspace yang ditolak menghasilkan diagnostik `marketplace_missing` per Plugin yang sudah ada; tidak adanya bukti marketplace, Plugin, detail, atau aplikasi menyebabkan aplikasi workspace tidak ditampilkan. Inventaris terkurasi dari permintaan daftar default tetap dapat digunakan.
- Plugin sumber yang didukung aplikasi harus lolos pemeriksaan langganan saat migrasi. `--verify-plugin-apps` menambahkan pemeriksaan inventaris aplikasi sumber. Akun yang dibatasi pemeriksaan langganan serta, dalam mode verifikasi, aplikasi sumber yang tidak dapat diakses, dinonaktifkan, atau tidak ada maupun kegagalan penyegaran inventaris aplikasi dilaporkan sebagai item manual yang dilewati, bukan sebagai entri konfigurasi aktif. Detail Plugin yang tidak dapat dibaca dilewati sebelum pemeriksaan inventaris aplikasi.
- Migrasi menulis identitas Plugin eksplisit (`marketplaceName` dan `pluginName`); migrasi tidak menulis path cache `marketplacePath` lokal.
- `codexPlugins.enabled` adalah satu-satunya sakelar pengaktifan global; tidak ada wildcard `plugins["*"]` atau kunci konfigurasi yang memberikan kewenangan instalasi arbitrer.
- Marketplace non-terkurasi, bundel Plugin yang disimpan dalam cache, hook, dan berkas konfigurasi Codex dipertahankan dalam laporan migrasi untuk peninjauan manual, bukan diaktifkan secara otomatis. Runtime menerima entri `workspace-directory` yang dikonfigurasi secara manual; marketplace lain tetap tidak didukung.

## Inventaris dan kepemilikan aplikasi

OpenClaw membaca inventaris aplikasi Codex melalui `app/list` app-server, menyimpannya dalam cache memori selama satu jam, dan menyegarkan entri yang kedaluwarsa atau tidak ada secara asinkron. Cache bersifat lokal untuk proses; memulai ulang CLI atau Gateway akan menghapusnya, dan OpenClaw membangunnya kembali dari pembacaan `app/list` berikutnya.

Migrasi dan runtime menggunakan kunci cache terpisah:

- Verifikasi migrasi sumber menggunakan direktori home dan opsi mulai Codex sumber. Verifikasi hanya berjalan dengan `--verify-plugin-apps` dan memaksa penelusuran `app/list` sumber terbaru untuk proses perencanaan tersebut.
- Penyiapan runtime target menggunakan identitas app-server Codex milik agen target saat membangun konfigurasi aplikasi utas. Aktivasi Plugin terkurasi membatalkan kunci cache target tersebut, lalu memaksanya disegarkan setelah `plugin/install`. Penyiapan `workspace-directory` tidak pernah menjalankan jalur aktivasi ini.

Aplikasi Plugin hanya ditampilkan ketika OpenClaw dapat memetakannya kembali ke Plugin yang dikonfigurasi melalui kepemilikan stabil: ID aplikasi persis dari detail Plugin, nama server MCP yang diketahui, atau metadata stabil yang unik. Kepemilikan yang hanya berdasarkan nama tampilan atau bersifat ambigu dikecualikan hingga penyegaran inventaris berikutnya membuktikan kepemilikan.

## Aplikasi akun yang terhubung

Agen yang dioperasikan pemilik dapat memilih untuk menggunakan setiap aplikasi yang sudah terhubung ke akun Codex mereka tanpa memerlukan paket Plugin yang cocok:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
          },
        },
      },
    },
  },
}
```

`allow_all_plugins: true` mengambil snapshot `app/list` lengkap saat utas Codex native baru dibuat dan hanya mengizinkan aplikasi yang ditandai dapat diakses oleh akun tersebut. Opsi ini tidak menginstal, mengautentikasi, atau mengaktifkan aplikasi secara global. Utas yang sudah ada mempertahankan kumpulan aplikasi tersimpannya; gunakan `/new`, `/reset`, atau mulai ulang Gateway agar aplikasi yang baru terhubung atau dicabut diterapkan.

Aplikasi akun mewarisi nilai global `codexPlugins.allow_destructive_actions`, yang menerima `true`, `false`, `"auto"`, atau `"ask"`. Kebijakan eksplisit per Plugin menggantikan kebijakan global untuk ID aplikasi yang tumpang tindih. Kegagalan inventaris ditutup secara aman dan tidak beralih ke default tanpa batasan.

## Konfigurasi aplikasi utas

OpenClaw menyuntikkan patch `config.apps` yang restriktif untuk utas Codex:
`_default` dinonaktifkan, dan hanya aplikasi milik plugin terkonfigurasi yang diaktifkan atau
aplikasi akun yang dapat diakses dan diizinkan oleh `allow_all_plugins` yang diaktifkan.

`destructive_enabled` pada setiap aplikasi berasal dari kebijakan efektif global atau
per-plugin `allow_destructive_actions`; `true`, `"auto"`, dan `"ask"`
semuanya menetapkan `destructive_enabled: true`, sedangkan `false` menetapkannya ke `false`. Codex tetap
menerapkan metadata alat destruktif dari anotasi alat aplikasi native-nya.
`_default` dinonaktifkan dengan `open_world_enabled: false`; aplikasi plugin yang diaktifkan
mendapatkan `open_world_enabled: true`. OpenClaw tidak menyediakan kenop kebijakan
dunia-terbuka terpisah pada tingkat plugin dan tidak memelihara daftar penolakan nama
alat destruktif per-plugin.

Mode persetujuan alat secara default bersifat otomatis untuk aplikasi yang diizinkan, sehingga alat
baca non-destruktif berjalan tanpa permintaan persetujuan dalam utas yang sama. Alat destruktif tetap
dikendalikan oleh kebijakan `destructive_enabled` setiap aplikasi.

## Kebijakan tindakan destruktif

Permintaan konfirmasi destruktif dari plugin secara default diizinkan untuk plugin Codex
yang dikonfigurasi, sedangkan skema yang tidak aman dan kepemilikan yang ambigu ditolak secara aman:

- `allow_destructive_actions` global secara default bernilai `true`.
- `allow_destructive_actions` per-plugin menggantikan kebijakan global untuk
  plugin tersebut.
- `false`: OpenClaw mengembalikan penolakan deterministik.
- `true`: OpenClaw menerima secara otomatis hanya skema aman yang dapat dipetakannya ke respons
  persetujuan, seperti bidang persetujuan boolean.
- `"auto"`: OpenClaw mengekspos tindakan plugin destruktif kepada Codex, lalu
  mengubah permintaan konfirmasi persetujuan MCP dengan kepemilikan yang telah terbukti menjadi persetujuan
  plugin OpenClaw sebelum mengembalikan respons persetujuan Codex.
- `"ask"`: OpenClaw menggunakan pembatasan penulisan/destruktif Codex yang sama seperti
  `"auto"`, menghapus penggantian persetujuan per-alat Codex yang persisten untuk aplikasi
  sebelum utas dimulai, dan hanya menawarkan persetujuan atau penolakan sekali pakai agar
  persetujuan persisten tidak dapat meniadakan permintaan tindakan tulis berikutnya. Untuk setiap
  aplikasi yang diizinkan dan menggunakan `"ask"`, OpenClaw memilih peninjau persetujuan manusia
  Codex untuk aplikasi tersebut agar Codex mengirimkan permintaan konfirmasi persetujuannya ke
  OpenClaw; aplikasi lain dan persetujuan utas non-aplikasi tetap menggunakan peninjau dan
  kebijakan yang dikonfigurasi.
- Identitas plugin yang tidak ada, kepemilikan ambigu, id giliran yang tidak ada atau tidak cocok,
  maupun skema permintaan konfirmasi yang tidak aman akan ditolak alih-alih memunculkan permintaan.

## Pemecahan masalah

| Kode                                              | Arti                                                                                                                              | Perbaikan                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | Migrasi memasang plugin, tetapi salah satu aplikasinya masih memerlukan autentikasi. Entri ditulis dalam keadaan dinonaktifkan hingga Anda mengotorisasi ulang. | Otorisasi ulang aplikasi di Codex, lalu aktifkan plugin di OpenClaw.                                                      |
| `app_inaccessible`, `app_disabled`, `app_missing` | Dengan `--verify-plugin-apps`, inventaris aplikasi Codex sumber tidak menunjukkan semua aplikasi milik plugin sebagai tersedia, diaktifkan, dan dapat diakses.         | Otorisasi ulang atau aktifkan aplikasi di Codex, lalu jalankan kembali migrasi dengan `--verify-plugin-apps`.                              |
| `app_inventory_unavailable`                       | Verifikasi ketat aplikasi sumber diminta, tetapi penyegaran inventaris aplikasi Codex sumber gagal.                                      | Perbaiki akses server aplikasi Codex sumber, atau coba lagi tanpa `--verify-plugin-apps` untuk menerima rencana berbasis pembatasan akun yang lebih cepat.   |
| `codex_subscription_required`                     | Akun server aplikasi Codex sumber bukan akun langganan ChatGPT.                                                          | Masuk ke aplikasi Codex dengan autentikasi langganan, lalu jalankan kembali migrasi.                                                  |
| `codex_account_unavailable`                       | Akun server aplikasi Codex sumber tidak dapat dibaca.                                                                               | Perbaiki autentikasi server aplikasi Codex sumber, atau jalankan kembali dengan `--verify-plugin-apps` agar inventaris aplikasi sumber menentukan kelayakan. |
| `marketplace_missing`, `plugin_missing`           | Marketplace atau plugin yang tepat tidak tersedia; permintaan katalog ruang kerja eksplisit mungkin telah ditolak; aplikasi ruang kerja ditolak secara aman.  | Verifikasi kontrak server aplikasi yang kompatibel dan ID tepat yang dijelaskan di bawah.                                                |
| `plugin_detail_unavailable`                       | OpenClaw tidak dapat membaca detail kepemilikan plugin.                                                                                    | Periksa respons `plugin/list` dan `plugin/read` dari server aplikasi target.                                             |
| `plugin_disabled`                                 | Codex melaporkan bahwa plugin terpasang tetapi dinonaktifkan.                                                                                     | Aktivasi terkurasi mungkin dapat memperbaikinya; aktifkan plugin ruang kerja di Codex sebelum mencoba lagi.                                  |
| `plugin_activation_failed`                        | Aktivasi plugin tidak selesai.                                                                                                  | Gunakan diagnostik terlampir untuk membedakan kegagalan marketplace, autentikasi, penyegaran, atau kesiapan ruang kerja.                |
| `app_inventory_missing`, `app_inventory_stale`    | Kesiapan aplikasi berasal dari cache kosong atau kedaluwarsa.                                                                                     | OpenClaw menjadwalkan penyegaran asinkron secara otomatis; aplikasi plugin tetap dikecualikan hingga kepemilikan dan kesiapan diketahui.  |
| `app_ownership_ambiguous`                         | Inventaris aplikasi hanya cocok berdasarkan nama tampilan.                                                                                          | Aplikasi tetap disembunyikan dari utas Codex hingga penyegaran berikutnya membuktikan kepemilikan.                                     |

**Plugin ruang kerja terpasang tetapi tidak terlihat:** pastikan hasil
`plugin/list` ruang kerja melaporkan ID terkonfigurasi yang tepat sebagai terpasang dan diaktifkan,
lalu pastikan `app/list` melaporkan setiap aplikasi milik plugin dapat diakses untuk akun Codex
yang sama. OpenClaw dapat mengaktifkan aplikasi yang dapat diakses untuk utas meskipun
inventaris akun saat ini melaporkan aplikasi tersebut dinonaktifkan. Jika Anda mengubah status tersebut setelah Gateway menyimpan inventaris
aplikasi dalam cache, tunggu penyegaran cache satu jam atau mulai ulang Gateway, lalu gunakan
`/new` atau `/reset`. OpenClaw tidak memperbaiki atau mengautentikasi plugin ruang kerja.
Jika permintaan daftar ruang kerja eksplisit ditolak, setiap entri ruang kerja yang diaktifkan
melaporkan `marketplace_missing`; entri terkurasi yang tidak terkait tetap diproses
dari respons daftar default.

Untuk `plugin_detail_unavailable`, ringkasan ruang kerja tanpa jalur harus menyertakan
`remotePluginId`; OpenClaw tetap menyembunyikan aplikasi milik plugin ketika pemilih tersebut atau
hasil `plugin/read` berikutnya tidak tersedia. Untuk
`plugin_activation_failed`, plugin terkurasi dapat melaporkan kegagalan marketplace, autentikasi, atau
penyegaran pascapemasangan. Plugin ruang kerja melaporkan kode ini ketika belum
aktif; pasang, aktifkan, dan autentikasikan di luar OpenClaw.

**Konfigurasi berubah tetapi agen tidak dapat melihat plugin:** jalankan `/codex plugins
list` untuk memastikan status yang dikonfigurasi, lalu `/new` atau `/reset`. Pengikatan
utas Codex yang ada mempertahankan konfigurasi aplikasi yang digunakan saat dimulai hingga OpenClaw
membuat sesi harness baru atau mengganti pengikatan yang kedaluwarsa.

**Tindakan destruktif ditolak:** periksa nilai global dan per-plugin
`allow_destructive_actions`. Bahkan dengan `true`, `"auto"`, atau `"ask"`,
skema permintaan konfirmasi yang tidak aman dan identitas plugin yang ambigu tetap ditolak secara aman.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Referensi harness Codex](/id/plugins/codex-harness-reference)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Referensi konfigurasi](/id/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI migrasi](/id/cli/migrate)
