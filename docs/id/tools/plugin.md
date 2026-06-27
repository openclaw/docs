---
doc-schema-version: 1
read_when:
    - Menginstal atau mengonfigurasi Plugin
    - Memahami aturan penemuan dan pemuatan Plugin
    - Bekerja dengan bundle plugin yang kompatibel dengan Codex/Claude
sidebarTitle: Getting Started
summary: Instal, konfigurasikan, dan kelola Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-06-27T18:20:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61e0ddb164baba368fbf57883e7a72eddadc28cb100ed6c4f11977c55576513
    source_path: tools/plugin.md
    workflow: 16
---

Plugin memperluas OpenClaw dengan channel, penyedia model, harness agen, alat,
Skills, ucapan, transkripsi realtime, suara, pemahaman media, pembuatan,
pengambilan web, pencarian web, dan kapabilitas runtime lainnya.

Gunakan halaman ini saat Anda ingin memasang Plugin, memulai ulang Gateway, memverifikasi
bahwa runtime telah memuatnya, dan menangani kegagalan penyiapan umum. Untuk contoh
khusus perintah, lihat [Kelola Plugin](/id/plugins/manage-plugins). Untuk inventaris lengkap yang dihasilkan
untuk Plugin bawaan, eksternal resmi, dan khusus sumber, lihat
[Inventaris Plugin](/id/plugins/plugin-inventory).

## Persyaratan

Sebelum memasang Plugin, pastikan Anda memiliki:

- checkout atau instalasi OpenClaw dengan CLI `openclaw` yang tersedia
- akses jaringan ke sumber yang dipilih, seperti ClawHub, npm, atau host git
- kredensial, kunci konfigurasi, atau alat sistem operasi khusus Plugin apa pun yang disebutkan
  oleh dokumentasi penyiapan Plugin tersebut
- izin bagi Gateway yang melayani channel Anda untuk memuat ulang atau memulai ulang

## Mulai cepat

<Steps>
  <Step title="Temukan Plugin">
    Cari paket Plugin publik di [ClawHub](/id/clawhub):

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub adalah permukaan penemuan utama untuk Plugin komunitas. Selama
    peralihan peluncuran, spesifikasi paket bare biasa masih dipasang dari npm kecuali
    cocok dengan id Plugin resmi. Spesifikasi paket mentah `@openclaw/*` yang cocok
    dengan Plugin bawaan menggunakan salinan bawaan dari build OpenClaw saat ini. Gunakan
    prefiks eksplisit saat Anda memerlukan satu sumber tertentu.

  </Step>

  <Step title="Pasang Plugin">
    ```bash
    # From ClawHub.
    openclaw plugins install clawhub:<package>

    # From npm.
    openclaw plugins install npm:<package>

    # From git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # From a local development checkout.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Perlakukan pemasangan Plugin seperti menjalankan kode. Utamakan versi yang dipin saat Anda
    memerlukan instalasi produksi yang dapat direproduksi.

  </Step>

  <Step title="Konfigurasikan dan aktifkan">
    Konfigurasikan pengaturan khusus Plugin di bawah `plugins.entries.<id>.config`.
    Aktifkan Plugin saat belum aktif:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Jika konfigurasi Anda menggunakan daftar `plugins.allow` yang restriktif, id Plugin yang dipasang
    harus ada di sana sebelum Plugin dapat dimuat.
    `openclaw plugins install` menambahkan id yang dipasang ke daftar
    `plugins.allow` yang sudah ada dan menghapus id yang sama dari `plugins.deny` sehingga
    pemasangan eksplisit dapat dimuat setelah mulai ulang.

  </Step>

  <Step title="Biarkan Gateway memuat ulang">
    Memasang, memperbarui, atau menghapus instalasi kode Plugin memerlukan mulai ulang Gateway.
    Saat Gateway terkelola sudah berjalan dengan pemuatan ulang konfigurasi
    diaktifkan, OpenClaw mendeteksi catatan pemasangan Plugin yang berubah dan memulai ulang
    Gateway secara otomatis. Jika Gateway tidak terkelola atau pemuatan ulang dinonaktifkan,
    mulai ulang sendiri:

    ```bash
    openclaw gateway restart
    ```

    Operasi aktifkan dan nonaktifkan memperbarui konfigurasi dan menyegarkan registry dingin.
    Inspeksi runtime tetap menjadi jalur verifikasi paling jelas untuk permukaan runtime
    live.

  </Step>

  <Step title="Verifikasi pendaftaran runtime">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Gunakan `--runtime` saat Anda perlu membuktikan alat, hook, layanan,
    metode Gateway, atau perintah CLI milik Plugin yang terdaftar. `inspect` biasa adalah
    pemeriksaan manifes dingin dan registry.

  </Step>
</Steps>

## Konfigurasi

### Pilih sumber instalasi

| Sumber      | Gunakan saat                                                                       | Contoh                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Anda menginginkan penemuan native OpenClaw, pemindaian, metadata versi, dan petunjuk instalasi | `openclaw plugins install clawhub:<package>`                   |
| npm         | Anda memerlukan registry npm langsung atau alur kerja dist-tag                             | `openclaw plugins install npm:<package>`                       |
| git         | Anda memerlukan branch, tag, atau commit dari repositori                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| path lokal  | Anda sedang mengembangkan atau menguji Plugin pada mesin yang sama                     | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Anda sedang memasang Plugin marketplace yang kompatibel dengan Claude                      | `openclaw plugins install <plugin> --marketplace <source>`     |

Spesifikasi paket bare memiliki perilaku kompatibilitas khusus. Jika nama bare cocok dengan
id Plugin bawaan, OpenClaw menggunakan sumber bawaan tersebut. Jika cocok dengan
id Plugin eksternal resmi, OpenClaw menggunakan katalog paket resmi. Spesifikasi
paket bare biasa lainnya dipasang melalui npm selama peralihan peluncuran. Spesifikasi paket mentah
`@openclaw/*` yang cocok dengan Plugin bawaan juga diselesaikan ke
salinan bawaan sebelum fallback npm. Gunakan `npm:@openclaw/<plugin>@<version>` saat
Anda secara sengaja menginginkan paket npm eksternal alih-alih salinan bawaan
milik image. Gunakan `clawhub:`, `npm:`, `git:`, atau `npm-pack:` saat Anda memerlukan
pemilihan sumber deterministik. Lihat [`openclaw plugins`](/id/cli/plugins#install)
untuk kontrak perintah lengkap.

Untuk instalasi npm, spesifikasi paket yang tidak dipin dan `@latest` memilih paket
stabil terbaru yang mengiklankan kompatibilitas dengan build OpenClaw ini. Jika rilis
latest npm saat ini mendeklarasikan `openclaw.compat.pluginApi` atau
`openclaw.install.minHostVersion` yang lebih baru, OpenClaw memindai versi paket stabil yang lebih lama
dan memasang versi terbaru yang sesuai. Versi persis dan tag channel eksplisit
seperti `@beta` tetap dipin ke paket yang dipilih dan gagal saat tidak kompatibel.

### Kebijakan instalasi operator

Konfigurasikan `security.installPolicy` untuk menjalankan perintah kebijakan lokal tepercaya sebelum
pemasangan atau pembaruan Plugin dilanjutkan. Kebijakan menerima metadata plus path
sumber yang telah dipersiapkan dan dapat mengizinkan atau memblokir instalasi. Ini mencakup jalur
pemasangan/pembaruan Plugin berbasis CLI dan Gateway. Hook `before_install` Plugin berjalan kemudian hanya dalam
proses OpenClaw tempat hook Plugin dimuat, jadi gunakan `security.installPolicy`
untuk keputusan instalasi milik operator. Flag yang tidak digunakan lagi
`--dangerously-force-unsafe-install` diterima untuk kompatibilitas tetapi tidak
melewati kebijakan instalasi atau denylist dependensi Plugin bawaan OpenClaw.

Lihat [Konfigurasi Skills](/id/tools/skills-config#operator-install-policy-securityinstallpolicy)
untuk skema exec `security.installPolicy` bersama yang digunakan oleh Skills dan
Plugin.

### Konfigurasikan kebijakan Plugin

Bentuk konfigurasi Plugin umum adalah:

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    slots: { memory: "memory-core" },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

Aturan kebijakan utama:

- `plugins.enabled: false` menonaktifkan semua Plugin dan melewati pekerjaan penemuan/pemuatan
  Plugin. Referensi Plugin usang tidak aktif selama ini aktif; aktifkan kembali
  Plugin sebelum menjalankan pembersihan doctor saat Anda ingin id usang dihapus.
- `plugins.deny` menang atas allow dan pengaktifan per Plugin.
- `plugins.allow` adalah allowlist eksklusif. Alat milik Plugin di luar
  allowlist tetap tidak tersedia, bahkan saat `tools.allow` menyertakan `"*"`.
- `plugins.entries.<id>.enabled: false` menonaktifkan satu Plugin sambil mempertahankan
  konfigurasinya.
- `plugins.load.paths` menambahkan file atau direktori Plugin lokal eksplisit. Path lokal
  `plugins install` terkelola harus berupa direktori atau arsip Plugin; gunakan
  `plugins.load.paths` untuk file Plugin mandiri.
- Plugin asal workspace dinonaktifkan secara default; aktifkan atau
  allowlist secara eksplisit sebelum menggunakan kode workspace lokal.
- Plugin bawaan mengikuti metadata default-on/default-off bawaannya kecuali
  konfigurasi secara eksplisit menimpanya.
- `plugins.slots.<slot>` memilih satu Plugin untuk kategori eksklusif seperti
  mesin memori dan konteks. Pemilihan slot memaksa Plugin yang dipilih aktif
  untuk slot tersebut dengan dihitung sebagai aktivasi eksplisit; ini dapat dimuat bahkan saat
  sebaliknya bersifat opt-in. `plugins.deny` dan
  `plugins.entries.<id>.enabled: false` tetap memblokirnya.
- Plugin bawaan opt-in dapat aktif otomatis saat konfigurasi menyebut salah satu
  permukaan miliknya, seperti ref penyedia/model, konfigurasi channel, backend CLI, atau runtime
  harness agen.
- Routing Codex keluarga OpenAI menjaga batas Plugin penyedia dan runtime
  tetap terpisah: ref model Codex lama adalah konfigurasi legacy yang diperbaiki oleh doctor, sementara Plugin
  `codex` bawaan memiliki runtime server aplikasi Codex untuk ref agen `openai/*`
  kanonis, `agentRuntime.id: "codex"` eksplisit, dan ref `codex/*` legacy.

Saat `plugins.allow` tidak ditetapkan dan Plugin non-bawaan ditemukan otomatis dari
workspace atau root Plugin global, log startup menampilkan
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`.
Peringatan menyertakan id Plugin yang ditemukan dan, untuk daftar pendek, snippet
`plugins.allow` minimal. Jalankan
[`openclaw plugins list --enabled --verbose`](/id/cli/plugins#list) atau
[`openclaw plugins inspect <id>`](/id/cli/plugins#inspect) dengan id Plugin yang tercantum
sebelum menyalin Plugin tepercaya ke `openclaw.json`. Panduan trust-pinning yang sama
berlaku saat diagnostik mengatakan sebuah Plugin dimuat
`without install/load-path provenance`: inspeksi id Plugin tersebut, lalu pin id
tepercaya di `plugins.allow` atau pasang ulang dari sumber tepercaya agar OpenClaw
mencatat provenance instalasi.

Jalankan `openclaw doctor` atau `openclaw doctor --fix` saat validasi konfigurasi melaporkan
id Plugin usang, ketidakcocokan allowlist/alat, atau path Plugin bawaan legacy.

## Pahami format Plugin

OpenClaw mengenali dua format Plugin:

| Format                 | Cara memuatnya                                                                 | Gunakan saat                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Plugin OpenClaw native | `openclaw.plugin.json` plus modul runtime yang dimuat dalam proses               | Anda memasang atau membangun kapabilitas runtime khusus OpenClaw  |
| Bundle kompatibel      | Tata letak Plugin Codex, Claude, atau Cursor yang dipetakan ke inventaris Plugin OpenClaw | Anda menggunakan kembali Skills, perintah, hook, atau metadata bundle yang kompatibel |

Kedua format muncul di `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable`, dan `openclaw plugins disable`. Lihat
[Bundle Plugin](/id/plugins/bundles) untuk batas kompatibilitas bundle dan
[Membangun Plugin](/id/plugins/building-plugins) untuk penulisan Plugin native.

## Hook Plugin

Plugin dapat mendaftarkan hook saat runtime, tetapi ada dua API berbeda dengan
tugas berbeda.

- Gunakan hook bertipe melalui `api.on(...)` untuk hook lifecycle runtime. Ini adalah
  permukaan yang disarankan untuk middleware, kebijakan, penulisan ulang pesan, pembentukan prompt,
  dan kontrol alat.
- Gunakan `api.registerHook(...)` hanya saat Anda ingin berpartisipasi dalam sistem
  hook internal yang dijelaskan di [Hook](/id/automation/hooks). Ini terutama untuk efek samping
  perintah/lifecycle kasar dan kompatibilitas dengan otomatisasi gaya HOOK yang ada.

Aturan cepat:

- Jika handler membutuhkan prioritas, semantik penggabungan, atau perilaku blokir/batalkan, gunakan
  hook Plugin bertipe.
- Jika handler hanya bereaksi terhadap `command:new`, `command:reset`, `message:sent`,
  atau peristiwa kasar serupa, `api.registerHook(...)` sudah cukup.

Hook internal yang dikelola Plugin muncul di `openclaw hooks list` dengan
`plugin:<id>`. Anda tidak dapat mengaktifkan atau menonaktifkannya melalui `openclaw hooks`;
aktifkan atau nonaktifkan Pluginnya sebagai gantinya.

## Verifikasi Gateway aktif

`openclaw plugins list` dan `openclaw plugins inspect` biasa membaca status
konfigurasi, manifes, dan registri statis. Keduanya tidak membuktikan bahwa
Gateway yang sudah berjalan telah mengimpor kode Plugin yang sama.

Saat sebuah Plugin tampak terinstal tetapi lalu lintas chat langsung tidak
menggunakannya:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Gateway terkelola dimulai ulang secara otomatis setelah perubahan instalasi,
pembaruan, dan penghapusan Plugin yang mengubah sumber Plugin. Pada instalasi
VPS atau container, pastikan restart manual menargetkan child
`openclaw gateway run` yang sebenarnya melayani kanal Anda, bukan hanya wrapper
atau supervisor.

## Pemecahan masalah

| Gejala                                                         | Periksa                                                                                                                                    | Perbaikan                                                                                               |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Plugin muncul di `plugins list` tetapi hook runtime tidak berjalan | Gunakan `openclaw plugins inspect <id> --runtime --json` dan konfirmasi Gateway aktif dengan `gateway status --deep --require-rpc`         | Mulai ulang Gateway langsung setelah perubahan instalasi, pembaruan, konfigurasi, atau sumber           |
| Diagnostik kepemilikan kanal atau alat duplikat muncul         | Jalankan `openclaw plugins list --enabled --verbose`, inspeksi setiap Plugin yang dicurigai dengan `--runtime --json`, dan bandingkan kepemilikan kanal/alat | Nonaktifkan salah satu pemilik, hapus instalasi lama, atau gunakan manifes `preferOver` untuk penggantian yang disengaja |
| Konfigurasi menyatakan sebuah Plugin hilang                    | Periksa [Inventaris Plugin](/id/plugins/plugin-inventory) untuk mengetahui apakah Plugin tersebut bundled, eksternal resmi, atau hanya sumber | Instal paket eksternal, aktifkan Plugin bundled, atau hapus konfigurasi lama                            |
| Konfigurasi tidak valid selama instalasi                       | Baca pesan validasi dan jalankan `openclaw doctor --fix` saat pesan tersebut menunjuk ke status Plugin lama                                | Doctor dapat mengarantina konfigurasi Plugin yang tidak valid dengan menonaktifkan entri dan menghapus payload yang tidak valid |
| Jalur Plugin diblokir karena kepemilikan atau izin yang mencurigakan | Inspeksi diagnostik sebelum galat konfigurasi                                                                                              | Perbaiki kepemilikan/izin filesystem, lalu jalankan `openclaw plugins registry --refresh`               |
| `OPENCLAW_NIX_MODE=1` memblokir perintah siklus hidup          | Konfirmasi bahwa instalasi dikelola oleh Nix                                                                                               | Ubah pilihan Plugin di sumber Nix, bukan menggunakan perintah mutator Plugin                            |
| Impor dependensi gagal saat runtime                            | Periksa apakah Plugin diinstal melalui npm/git/ClawHub atau dimuat dari jalur lokal                                                        | Jalankan `openclaw plugins update <id>`, instal ulang sumber, atau instal sendiri dependensi Plugin lokal |

Saat konfigurasi Plugin lama masih menamai Plugin kanal yang tidak lagi dapat
ditemukan, startup Gateway melewati kanal yang didukung Plugin tersebut alih-alih
memblokir semua kanal lain. Jalankan `openclaw doctor --fix` untuk menghapus
entri Plugin dan kanal lama. Kunci kanal tidak dikenal tanpa bukti Plugin lama
tetap menggagalkan validasi agar salah ketik tetap terlihat.

Untuk penggantian kanal yang disengaja, Plugin pilihan sebaiknya mendeklarasikan
`channelConfigs.<channel-id>.preferOver` dengan id Plugin lama atau yang
berprioritas lebih rendah. Jika kedua Plugin diaktifkan secara eksplisit,
OpenClaw mempertahankan permintaan tersebut dan melaporkan diagnostik kanal atau
alat duplikat alih-alih diam-diam memilih satu pemilik.

Jika paket terinstal melaporkan bahwa paket tersebut `requires compiled runtime output for
TypeScript entry ...`, paket tersebut dipublikasikan tanpa file JavaScript yang
dibutuhkan OpenClaw saat runtime. Perbarui atau instal ulang setelah penerbit
mengirim JavaScript terkompilasi, atau nonaktifkan/hapus instalasi Plugin sampai
saat itu.

### Kepemilikan jalur Plugin yang diblokir

Jika diagnostik Plugin menyatakan
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
dan validasi konfigurasi diikuti dengan `plugin present but blocked`, OpenClaw
menemukan file Plugin yang dimiliki oleh pengguna Unix berbeda dari proses yang
memuatnya. Biarkan konfigurasi Plugin tetap ada; perbaiki kepemilikan filesystem
atau jalankan OpenClaw sebagai pengguna yang sama dengan pemilik direktori status.

Untuk instalasi Docker, image resmi berjalan sebagai `node` (uid `1000`), jadi
direktori konfigurasi dan workspace OpenClaw yang di-bind mount dari host
biasanya seharusnya dimiliki oleh uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Jika Anda sengaja menjalankan OpenClaw sebagai root, perbaiki root Plugin
terkelola menjadi kepemilikan root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Setelah memperbaiki kepemilikan, jalankan ulang `openclaw doctor --fix` atau
`openclaw plugins registry --refresh` agar registri Plugin yang dipertahankan
sesuai dengan file yang telah diperbaiki.

### Penyiapan alat Plugin yang lambat

Jika giliran agen tampak macet saat menyiapkan alat, aktifkan pencatatan log
trace dan periksa baris waktu factory alat Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Cari:

```text
[trace:plugin-tools] factory timings ...
```

Ringkasan mencantumkan total waktu factory dan factory alat Plugin paling
lambat, termasuk id Plugin, nama alat yang dideklarasikan, bentuk hasil, dan
apakah alat tersebut opsional. Baris lambat dipromosikan menjadi peringatan saat
satu factory membutuhkan setidaknya 1 detik atau total persiapan factory alat
Plugin membutuhkan setidaknya 5 detik.

OpenClaw menyimpan cache hasil factory alat Plugin yang berhasil untuk resolusi
berulang dengan konteks permintaan efektif yang sama. Kunci cache mencakup
konfigurasi runtime efektif, workspace, id agen/sesi, kebijakan sandbox,
pengaturan browser, konteks pengiriman, identitas peminta, dan status
kepemilikan, sehingga factory yang bergantung pada field tepercaya tersebut
dijalankan ulang saat konteks berubah. Jika waktu tetap tinggi, Plugin mungkin
melakukan pekerjaan mahal sebelum mengembalikan definisi alatnya.

Jika satu Plugin mendominasi waktu, inspeksi registrasi runtime-nya:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Lalu perbarui, instal ulang, atau nonaktifkan Plugin tersebut. Penulis Plugin
sebaiknya memindahkan pemuatan dependensi yang mahal ke balik jalur eksekusi
alat, bukan melakukannya di dalam factory alat.

Untuk root dependensi, validasi metadata paket, catatan registri, perilaku
reload startup, dan pembersihan legacy, lihat
[Resolusi dependensi Plugin](/id/plugins/dependency-resolution).

## Terkait

- [Kelola Plugin](/id/plugins/manage-plugins) - contoh perintah untuk daftar, instalasi, pembaruan, penghapusan instalasi, dan publikasi
- [`openclaw plugins`](/id/cli/plugins) - referensi CLI lengkap
- [Inventaris Plugin](/id/plugins/plugin-inventory) - daftar Plugin bundled dan eksternal yang dihasilkan
- [Referensi Plugin](/id/plugins/reference) - halaman referensi per Plugin yang dihasilkan
- [Plugin komunitas](/id/plugins/community) - penemuan ClawHub dan kebijakan PR dokumentasi
- [Resolusi dependensi Plugin](/id/plugins/dependency-resolution) - root instalasi, catatan registri, dan batas runtime
- [Membangun Plugin](/id/plugins/building-plugins) - panduan penulisan Plugin native
- [Ringkasan Plugin SDK](/id/plugins/sdk-overview) - registrasi runtime, hook, dan field API
- [Manifes Plugin](/id/plugins/manifest) - manifes dan metadata paket
