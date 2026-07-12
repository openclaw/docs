---
doc-schema-version: 1
read_when:
    - Menginstal atau mengonfigurasi plugin
    - Memahami aturan penemuan dan pemuatan plugin
    - Bekerja dengan bundel plugin yang kompatibel dengan Codex/Claude
sidebarTitle: Getting Started
summary: Instal, konfigurasikan, dan kelola plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-07-12T14:45:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9de5b54c1c7b8ecf789816aa909ee1538de4295f0503a1ea9eecd535077a7cbc
    source_path: tools/plugin.md
    workflow: 16
---

Plugin memperluas OpenClaw dengan saluran, penyedia model, harness agen, alat,
Skills, percakapan, transkripsi waktu nyata, suara, pemahaman media, pembuatan,
pengambilan web, pencarian web, dan kemampuan runtime lainnya.

Gunakan halaman ini untuk menginstal Plugin, memulai ulang Gateway, memverifikasi
bahwa runtime telah memuatnya, dan menangani kegagalan penyiapan umum. Untuk
contoh yang hanya berisi perintah, lihat
[Kelola Plugin](/id/plugins/manage-plugins). Untuk inventaris yang dihasilkan dari
Plugin bawaan, eksternal resmi, dan khusus sumber, lihat
[Inventaris Plugin](/id/plugins/plugin-inventory).

## Persyaratan

- checkout atau instalasi OpenClaw dengan CLI `openclaw` yang tersedia
- akses jaringan ke sumber yang dipilih (ClawHub, npm, atau host git)
- kredensial khusus Plugin, kunci konfigurasi, atau alat OS yang disebutkan oleh
  dokumentasi penyiapan Plugin tersebut
- izin bagi Gateway yang melayani saluran Anda untuk memuat ulang atau memulai ulang

## Mulai cepat

<Steps>
  <Step title="Temukan Plugin">
    Cari paket Plugin publik di [ClawHub](/clawhub):

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub adalah sarana penemuan utama untuk Plugin komunitas. Selama
    transisi peluncuran, spesifikasi paket biasa tanpa prefiks tetap diinstal
    dari npm kecuali cocok dengan id Plugin resmi. Spesifikasi mentah
    `@openclaw/*` yang cocok dengan Plugin bawaan akan diarahkan ke salinan
    bawaan tersebut. Gunakan prefiks sumber eksplisit ketika Anda membutuhkan
    sumber tertentu.

  </Step>

  <Step title="Instal Plugin">
    ```bash
    # Dari ClawHub.
    openclaw plugins install clawhub:<package>

    # Dari npm.
    openclaw plugins install npm:<package>

    # Dari git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # Dari checkout pengembangan lokal.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Perlakukan instalasi Plugin seperti menjalankan kode. Utamakan versi yang
    dipatok untuk instalasi produksi yang dapat direproduksi.

  </Step>

  <Step title="Konfigurasikan dan aktifkan">
    Konfigurasikan pengaturan khusus Plugin di bawah `plugins.entries.<id>.config`.
    Aktifkan Plugin jika belum aktif:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Jika `plugins.allow` ditetapkan, id Plugin yang diinstal harus ada dalam
    daftar tersebut sebelum Plugin dapat dimuat. `openclaw plugins install`
    menambahkan id yang diinstal ke daftar `plugins.allow` yang sudah ada dan
    menghapus id yang sama dari `plugins.deny` agar instalasi eksplisit dapat
    dimuat setelah dimulai ulang.

  </Step>

  <Step title="Biarkan Gateway memuat ulang">
    Menginstal, memperbarui, atau menghapus instalasi kode Plugin memerlukan
    dimulainya ulang Gateway. Gateway terkelola dengan pemuatan ulang konfigurasi
    yang diaktifkan akan mendeteksi perubahan catatan instalasi Plugin dan
    memulai ulang secara otomatis. Jika tidak, mulai ulang sendiri:

    ```bash
    openclaw gateway restart
    ```

    Pengaktifan/penonaktifan memperbarui konfigurasi dan registri dingin.
    Pemeriksaan runtime tetap menjadi bukti paling jelas atas permukaan runtime
    yang aktif.

  </Step>

  <Step title="Verifikasi pendaftaran runtime">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Gunakan `--runtime` untuk membuktikan alat, hook, layanan, metode Gateway,
    atau perintah CLI milik Plugin yang terdaftar. `inspect` biasa hanya
    memeriksa manifes dan registri dingin.

  </Step>
</Steps>

## Konfigurasi

### Pilih sumber instalasi

| Sumber      | Gunakan ketika                                                                  | Contoh                                                         |
| ----------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Anda menginginkan penemuan asli OpenClaw, pemindaian, metadata versi, dan petunjuk instalasi | `openclaw plugins install clawhub:<package>`                   |
| npm         | Anda memerlukan alur kerja registri npm atau dist-tag secara langsung           | `openclaw plugins install npm:<package>`                       |
| git         | Anda memerlukan cabang, tag, atau commit dari suatu repositori                   | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| jalur lokal | Anda sedang mengembangkan atau menguji Plugin pada mesin yang sama               | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Anda sedang menginstal Plugin marketplace yang kompatibel dengan Claude          | `openclaw plugins install <plugin> --marketplace <source>`     |

Spesifikasi paket tanpa prefiks memiliki perilaku kompatibilitas khusus: nama
tanpa prefiks yang cocok dengan id Plugin bawaan menggunakan sumber bawaan
tersebut; nama tanpa prefiks yang cocok dengan id Plugin eksternal resmi
menggunakan katalog paket resmi; spesifikasi tanpa prefiks lainnya diinstal
melalui npm selama transisi peluncuran. Spesifikasi mentah `@openclaw/*` yang
cocok dengan Plugin bawaan juga diarahkan ke salinan bawaan sebelum fallback
ke npm. Gunakan `npm:@openclaw/<plugin>@<version>` untuk secara sengaja
menginstal paket npm eksternal alih-alih salinan bawaan. Gunakan `clawhub:`,
`npm:`, `git:`, atau `npm-pack:` untuk pemilihan sumber deterministik. Lihat
[`openclaw plugins`](/id/cli/plugins#install) untuk kontrak perintah lengkap.

Untuk instalasi npm, spesifikasi yang tidak dipatok dan `@latest` memilih paket
stabil terbaru yang menyatakan kompatibilitas dengan build OpenClaw ini. Jika
rilis terbaru npm saat ini mendeklarasikan `openclaw.compat.pluginApi` atau
`openclaw.install.minHostVersion` yang lebih baru daripada yang didukung build
ini, OpenClaw memindai versi stabil yang lebih lama dan menginstal versi terbaru
yang sesuai. Versi persis dan tag saluran eksplisit seperti `@beta` tetap
dipatok ke paket yang dipilih dan gagal jika tidak kompatibel.

### Kebijakan instalasi operator

Konfigurasikan `security.installPolicy` untuk menjalankan perintah kebijakan
lokal tepercaya sebelum instalasi atau pembaruan Plugin dilanjutkan. Kebijakan
menerima metadata beserta jalur sumber yang telah disiapkan dan dapat
mengizinkan atau memblokir instalasi. Kebijakan ini mencakup jalur instalasi/
pembaruan melalui CLI maupun Gateway. Hook `before_install` Plugin dijalankan
setelahnya, dan hanya dalam proses OpenClaw tempat hook Plugin dimuat, jadi
gunakan `security.installPolicy` untuk keputusan instalasi milik operator.
Flag `--dangerously-force-unsafe-install` yang tidak lagi disarankan diterima
untuk kompatibilitas tetapi tidak melakukan apa pun: flag tersebut tidak
melewati kebijakan instalasi atau daftar larangan dependensi Plugin bawaan
OpenClaw.

Lihat [Konfigurasi Skills](/id/tools/skills-config#operator-install-policy-securityinstallpolicy)
untuk skema eksekusi bersama `security.installPolicy` yang digunakan oleh
Skills dan Plugin.

### Konfigurasikan kebijakan Plugin

Bentuk konfigurasi Plugin yang umum adalah:

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

- `plugins.enabled: false` menonaktifkan semua Plugin dan melewati pekerjaan
  penemuan/pemuatan. Referensi Plugin usang tetap tidak aktif selama ini
  berlaku; aktifkan kembali Plugin sebelum menjalankan pembersihan doctor jika
  Anda ingin id usang dihapus.
- `plugins.deny` lebih diutamakan daripada daftar izin dan pengaktifan per Plugin.
- `plugins.allow` adalah daftar izin eksklusif. Alat milik Plugin di luar daftar
  izin tetap tidak tersedia meskipun `tools.allow` menyertakan `"*"`.
- `plugins.entries.<id>.enabled: false` menonaktifkan satu Plugin sambil
  mempertahankan konfigurasinya.
- `plugins.load.paths` menambahkan file atau direktori Plugin lokal secara
  eksplisit. Jalur lokal yang dikelola oleh `plugins install` harus berupa
  direktori atau arsip Plugin; gunakan `plugins.load.paths` untuk file Plugin
  mandiri.
- Plugin yang berasal dari ruang kerja dinonaktifkan secara default; aktifkan
  atau masukkan secara eksplisit ke daftar izin sebelum menggunakan kode ruang
  kerja lokal.
- Plugin bawaan mengikuti metadata bawaan aktif-secara-default/
  nonaktif-secara-default kecuali konfigurasi menimpanya secara eksplisit.
- `plugins.slots.<slot>` (`memory` atau `contextEngine`) memilih satu Plugin
  untuk kategori eksklusif. Pemilihan slot dihitung sebagai aktivasi eksplisit
  dan memaksa Plugin yang dipilih aktif untuk slot tersebut, meskipun biasanya
  bersifat pilihan. `plugins.deny` dan
  `plugins.entries.<id>.enabled: false` tetap memblokirnya.
- Plugin bawaan yang bersifat pilihan dapat aktif secara otomatis ketika
  konfigurasi menyebut salah satu permukaan miliknya, seperti referensi
  penyedia/model, konfigurasi saluran, backend CLI, atau runtime harness agen.
- Perutean Codex keluarga OpenAI menjaga batas penyedia dan Plugin runtime tetap
  terpisah: referensi model Codex lama merupakan konfigurasi lama yang diperbaiki
  doctor, sedangkan Plugin `codex` bawaan memiliki runtime app-server Codex untuk
  referensi agen `openai/*` kanonis, `agentRuntime.id: "codex"` eksplisit, dan
  referensi `codex/*` lama.

Saat `plugins.allow` tidak ditetapkan dan Plugin nonbawaan ditemukan secara
otomatis dari ruang kerja atau root Plugin global, log startup menampilkan
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
beserta id Plugin yang ditemukan dan, untuk daftar pendek, cuplikan
`plugins.allow` minimal. Jalankan
[`openclaw plugins list --enabled --verbose`](/id/cli/plugins#list) atau
[`openclaw plugins inspect <id>`](/id/cli/plugins#inspect) pada id Plugin yang
tercantum sebelum menyalin Plugin tepercaya ke `openclaw.json`. Pemastian
kepercayaan yang sama berlaku ketika diagnostik menyatakan Plugin dimuat
`without install/load-path provenance`: periksa id Plugin tersebut, lalu
patok di `plugins.allow` atau instal ulang dari sumber tepercaya agar OpenClaw
mencatat asal instalasi.

Jalankan `openclaw doctor` atau `openclaw doctor --fix` ketika validasi
konfigurasi melaporkan id Plugin usang, ketidakcocokan daftar izin/alat, atau
jalur Plugin bawaan lama.

## Memahami format Plugin

OpenClaw mengenali dua format Plugin:

| Format                  | Cara pemuatan                                                                | Gunakan ketika                                                              |
| ----------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Plugin asli OpenClaw    | `openclaw.plugin.json` ditambah modul runtime yang dimuat dalam proses        | Anda menginstal atau membangun kemampuan runtime khusus OpenClaw             |
| Bundel kompatibel       | Tata letak Plugin Codex, Claude, atau Cursor yang dipetakan ke inventaris Plugin OpenClaw | Anda menggunakan kembali Skills, perintah, hook, atau metadata bundel yang kompatibel |

Kedua format muncul di `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable`, dan `openclaw plugins disable`. Lihat
[Bundel Plugin](/id/plugins/bundles) untuk batas kompatibilitas bundel dan
[Membangun Plugin](/id/plugins/building-plugins) untuk pembuatan Plugin asli.

## Hook Plugin

Plugin dapat mendaftarkan hook saat runtime melalui dua API berbeda:

- Hook bertipe `api.on(...)` untuk peristiwa siklus hidup runtime. Ini adalah
  permukaan yang diutamakan untuk middleware, kebijakan, penulisan ulang pesan,
  pembentukan prompt, dan kontrol alat.
- `api.registerHook(...)` untuk sistem hook internal yang dijelaskan di
  [Hook](/id/automation/hooks). Ini terutama untuk efek samping perintah/siklus
  hidup tingkat kasar dan kompatibilitas dengan otomatisasi bergaya HOOK yang
  sudah ada.

Aturan singkat: jika handler memerlukan prioritas, semantik penggabungan, atau
perilaku pemblokiran/pembatalan, gunakan hook bertipe. Jika hanya bereaksi
terhadap `command:new`, `command:reset`, `message:sent`, atau peristiwa tingkat
kasar serupa, `api.registerHook` sudah memadai.

Hook internal yang dikelola Plugin muncul di `openclaw hooks list` dengan
`plugin:<id>`. Anda tidak dapat mengaktifkan atau menonaktifkannya melalui
`openclaw hooks`; aktifkan atau nonaktifkan Plugin sebagai gantinya.

## Verifikasi Gateway aktif

`openclaw plugins list` dan `openclaw plugins inspect` biasa membaca
konfigurasi dingin, manifes, dan status registri. Perintah tersebut tidak
membuktikan bahwa Gateway yang sudah berjalan telah mengimpor kode Plugin yang
sama.

Ketika Plugin tampak terinstal tetapi lalu lintas percakapan aktif tidak
menggunakannya:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Gateway terkelola dimulai ulang secara otomatis setelah perubahan pemasangan, pembaruan, dan
penghapusan Plugin yang mengubah sumber Plugin. Pada pemasangan VPS atau kontainer, pastikan
setiap mulai ulang manual menargetkan proses turunan `openclaw gateway run` sebenarnya yang
melayani saluran Anda, bukan hanya pembungkus atau supervisor.

## Pemecahan masalah

| Gejala                                                         | Pemeriksaan                                                                                                                                    | Perbaikan                                                                                                     |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Plugin muncul di `plugins list`, tetapi hook runtime tidak berjalan | Gunakan `openclaw plugins inspect <id> --runtime --json` dan konfirmasikan Gateway aktif dengan `gateway status --deep --require-rpc`         | Mulai ulang Gateway aktif setelah perubahan pemasangan, pembaruan, konfigurasi, atau sumber                    |
| Diagnostik kepemilikan saluran atau alat duplikat muncul        | Jalankan `openclaw plugins list --enabled --verbose`, periksa setiap Plugin yang dicurigai dengan `--runtime --json`, dan bandingkan kepemilikan saluran/alat | Nonaktifkan salah satu pemilik, hapus pemasangan usang, atau gunakan `preferOver` dalam manifes untuk penggantian yang disengaja |
| Konfigurasi menyatakan suatu Plugin tidak ditemukan             | Periksa [inventaris Plugin](/id/plugins/plugin-inventory) untuk mengetahui apakah Plugin tersebut dibundel, eksternal resmi, atau hanya berupa sumber | Pasang paket eksternal, aktifkan Plugin yang dibundel, atau hapus konfigurasi usang                           |
| Konfigurasi tidak valid selama pemasangan                       | Baca pesan validasi dan jalankan `openclaw doctor --fix` jika pesan tersebut menunjukkan status Plugin yang usang                             | Doctor dapat mengarantina konfigurasi Plugin yang tidak valid dengan menonaktifkan entri dan menghapus muatan yang tidak valid |
| Jalur Plugin diblokir karena kepemilikan atau izin mencurigakan | Periksa diagnostik sebelum galat konfigurasi                                                                                                   | Perbaiki kepemilikan/izin sistem berkas, lalu jalankan `openclaw plugins registry --refresh`                  |
| `OPENCLAW_NIX_MODE=1` memblokir perintah siklus hidup           | Pastikan pemasangan dikelola oleh Nix                                                                                                           | Ubah pemilihan Plugin dalam sumber Nix alih-alih menggunakan perintah pengubah Plugin                         |
| Impor dependensi gagal saat runtime                             | Periksa apakah Plugin dipasang melalui npm/git/ClawHub atau dimuat dari jalur lokal                                                            | Jalankan `openclaw plugins update <id>`, pasang ulang sumber, atau pasang sendiri dependensi Plugin lokal      |

Jika konfigurasi Plugin usang masih menyebutkan Plugin saluran yang tidak lagi dapat ditemukan,
validasi konfigurasi menurunkan kunci saluran tersebut menjadi peringatan, bukan kegagalan
fatal, sehingga Gateway masih dapat dimulai dan melayani semua saluran lainnya. Jalankan
`openclaw doctor --fix` untuk menghapus entri Plugin dan saluran yang usang. Kunci
saluran yang tidak dikenal tanpa bukti Plugin usang tetap menggagalkan validasi agar kesalahan
ketik tetap terlihat.

Untuk penggantian saluran yang disengaja, Plugin yang diutamakan harus mendeklarasikan
`channelConfigs.<channel-id>.preferOver` dengan id Plugin lama atau yang berprioritas
lebih rendah. Jika kedua Plugin diaktifkan secara eksplisit, OpenClaw mempertahankan permintaan
tersebut dan melaporkan diagnostik saluran/alat duplikat alih-alih memilih satu pemilik
secara diam-diam.

Jika paket yang terpasang melaporkan bahwa paket tersebut `requires compiled runtime output for
TypeScript entry ...`, paket tersebut diterbitkan tanpa berkas JavaScript yang
diperlukan OpenClaw saat runtime. Perbarui atau pasang ulang setelah penerbit menyediakan
JavaScript yang telah dikompilasi, atau nonaktifkan/hapus Plugin hingga saat itu.

### Kepemilikan jalur Plugin yang diblokir

Jika diagnostik menyatakan
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
dan validasi kemudian menampilkan `plugin present but blocked`, OpenClaw menemukan
berkas Plugin yang dimiliki oleh pengguna Unix yang berbeda dari pengguna proses yang memuatnya.
Pertahankan konfigurasi Plugin; perbaiki kepemilikan sistem berkas atau jalankan OpenClaw
sebagai pengguna yang sama dengan pemilik direktori status.

Untuk pemasangan Docker, citra resmi berjalan sebagai `node` (uid `1000`), sehingga
direktori konfigurasi dan ruang kerja OpenClaw pada hos yang dipasang menggunakan bind mount biasanya harus
dimiliki oleh uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Jika Anda sengaja menjalankan OpenClaw sebagai root, perbaiki kepemilikan root Plugin
terkelola menjadi milik root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Setelah memperbaiki kepemilikan, jalankan kembali `openclaw doctor --fix` atau
`openclaw plugins registry --refresh` agar registri Plugin yang dipersistenkan
sesuai dengan berkas yang telah diperbaiki.

### Penyiapan alat Plugin yang lambat

Jika giliran agen tampak terhenti saat menyiapkan alat, aktifkan pencatatan jejak
dan periksa baris waktu factory alat Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Cari:

```text
[trace:plugin-tools] factory timings ...
```

Ringkasan mencantumkan total waktu factory dan factory alat Plugin yang paling lambat,
termasuk id Plugin, nama alat yang dideklarasikan, bentuk hasil, serta apakah alat
tersebut opsional. Baris yang lambat dinaikkan menjadi peringatan jika satu factory membutuhkan
waktu setidaknya 1 detik atau total persiapan factory alat Plugin membutuhkan waktu setidaknya 5 detik.

OpenClaw menyimpan hasil factory alat Plugin yang berhasil ke dalam cache untuk resolusi
berulang dengan konteks permintaan efektif yang sama. Kunci cache mencakup
konfigurasi runtime efektif, ruang kerja dan id agen, kebijakan sandbox, pengaturan
peramban, konteks pengiriman, identitas peminta, dan status kepemilikan, sehingga
factory yang bergantung pada bidang tepercaya tersebut dijalankan kembali saat konteks
berubah. Jika waktunya tetap tinggi, Plugin mungkin melakukan pekerjaan berat sebelum
mengembalikan definisi alatnya.

Jika satu Plugin mendominasi waktu tersebut, periksa pendaftaran runtime-nya:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Kemudian perbarui, pasang ulang, atau nonaktifkan Plugin tersebut. Penulis Plugin sebaiknya memindahkan
pemuatan dependensi yang berat ke jalur eksekusi alat, bukan melakukannya
di dalam factory alat.

Untuk root dependensi, validasi metadata paket, catatan registri, perilaku
pemuatan ulang saat memulai, dan pembersihan lama, lihat
[Resolusi dependensi Plugin](/id/plugins/dependency-resolution).

## Terkait

- [Mengelola Plugin](/id/plugins/manage-plugins) - contoh perintah untuk mencantumkan, memasang, memperbarui, menghapus, dan menerbitkan
- [`openclaw plugins`](/id/cli/plugins) - referensi CLI lengkap
- [Inventaris Plugin](/id/plugins/plugin-inventory) - daftar Plugin eksternal dan yang dibundel, yang dihasilkan secara otomatis
- [Referensi Plugin](/id/plugins/reference) - halaman referensi per Plugin yang dihasilkan secara otomatis
- [Plugin komunitas](/id/plugins/community) - penemuan ClawHub dan kebijakan PR dokumentasi
- [Resolusi dependensi Plugin](/id/plugins/dependency-resolution) - root pemasangan, catatan registri, dan batas runtime
- [Membuat Plugin](/id/plugins/building-plugins) - panduan pembuatan Plugin native
- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview) - pendaftaran runtime, hook, dan bidang API
- [Manifes Plugin](/id/plugins/manifest) - manifes dan metadata paket
