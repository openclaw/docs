---
doc-schema-version: 1
read_when:
    - Menginstal atau mengonfigurasi plugin
    - Memahami aturan penemuan dan pemuatan plugin
    - Bekerja dengan bundel plugin yang kompatibel dengan Codex/Claude
sidebarTitle: Getting Started
summary: Instal, konfigurasikan, dan kelola Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-07-19T05:12:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f210dccab059527192eeb0aa2e780dcea243959273938ffaacc867ec96f5085e
    source_path: tools/plugin.md
    workflow: 16
---

Plugin memperluas OpenClaw dengan channel, penyedia model, harness agen, alat,
Skills, ucapan, transkripsi waktu nyata, suara, pemahaman media, generasi,
pengambilan web, pencarian web, dan kemampuan runtime lainnya.

Gunakan halaman ini untuk menginstal plugin, memulai ulang Gateway, memverifikasi bahwa runtime
telah memuatnya, dan menangani kegagalan penyiapan umum. Untuk contoh yang hanya berisi perintah, lihat
[Kelola plugin](/id/plugins/manage-plugins). Untuk inventaris yang dihasilkan bagi
plugin bawaan, eksternal resmi, dan khusus sumber, lihat
[Inventaris plugin](/id/plugins/plugin-inventory).

## Persyaratan

- checkout atau instalasi OpenClaw dengan CLI `openclaw` tersedia
- akses jaringan ke sumber yang dipilih (ClawHub, npm, atau host git)
- kredensial, kunci konfigurasi, atau alat OS khusus plugin yang disebutkan oleh
  dokumentasi penyiapan plugin tersebut
- izin bagi Gateway yang melayani channel Anda untuk memuat ulang atau memulai ulang

## Mulai cepat

<Steps>
  <Step title="Temukan plugin">
    Cari paket plugin publik di [ClawHub](/clawhub):

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub adalah sarana penemuan utama untuk plugin komunitas. Selama
    peralihan peluncuran, spesifikasi paket biasa tanpa awalan tetap diinstal dari npm kecuali
    cocok dengan id plugin resmi. Spesifikasi mentah `@openclaw/*` yang cocok dengan
    plugin bawaan akan mengacu pada salinan bawaan tersebut. Gunakan awalan sumber eksplisit
    saat Anda secara khusus memerlukan satu sumber tertentu.

  </Step>

  <Step title="Instal plugin">
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

    Perlakukan instalasi plugin seperti menjalankan kode. Utamakan versi yang disematkan untuk
    instalasi produksi yang dapat direproduksi. Paket ClawHub dan katalog
    bawaan/resmi OpenClaw merupakan sumber tepercaya. Sumber npm, git,
    jalur/arsip lokal, `npm-pack:`, atau marketplace baru yang arbitrer memerlukan
    `--force` dalam instalasi noninteraktif setelah Anda
    meninjau dan memercayai sumber tersebut.

  </Step>

  <Step title="Konfigurasikan dan aktifkan">
    Konfigurasikan pengaturan khusus plugin di bawah `plugins.entries.<id>.config`.
    Aktifkan plugin jika belum aktif:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Jika `plugins.allow` ditetapkan, id plugin yang diinstal harus ada dalam daftar tersebut
    sebelum plugin dapat dimuat. `openclaw plugins install` menambahkan
    id yang diinstal ke daftar `plugins.allow` yang sudah ada dan menghapus id yang sama dari
    `plugins.deny` agar instalasi eksplisit dapat dimuat setelah dimulai ulang.

  </Step>

  <Step title="Biarkan Gateway memuat ulang">
    Menginstal, memperbarui, atau menghapus instalasi kode plugin memerlukan
    pemulaian ulang Gateway. Gateway terkelola dengan pemuatan ulang konfigurasi diaktifkan akan mendeteksi
    perubahan catatan instalasi plugin dan memulai ulang secara otomatis. Jika tidak, mulai ulang
    sendiri:

    ```bash
    openclaw gateway restart
    ```

    Pengaktifan/penonaktifan memperbarui konfigurasi dan registri dingin. Inspeksi runtime
    tetap menjadi bukti paling jelas mengenai permukaan runtime aktif.

  </Step>

  <Step title="Verifikasi pendaftaran runtime">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Gunakan `--runtime` untuk membuktikan alat, hook, layanan, metode Gateway,
    atau perintah CLI milik plugin yang terdaftar. `inspect` biasa hanya merupakan pemeriksaan
    manifes dingin dan registri.

  </Step>
</Steps>

## Konfigurasi

### Pilih sumber instalasi

| Sumber      | Gunakan saat                                                                    | Contoh                                                         |
| ----------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Anda menginginkan penemuan, pemindaian, metadata versi, dan petunjuk instalasi yang native untuk OpenClaw | `openclaw plugins install clawhub:<package>`                   |
| npm         | Anda memerlukan alur kerja registri npm atau dist-tag secara langsung           | `openclaw plugins install npm:<package>`                       |
| git         | Anda memerlukan branch, tag, atau commit dari repositori                         | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| jalur lokal | Anda sedang mengembangkan atau menguji plugin pada mesin yang sama               | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Anda menginstal plugin marketplace yang kompatibel dengan Claude                 | `openclaw plugins install <plugin> --marketplace <source>`     |

Spesifikasi paket tanpa awalan memiliki perilaku kompatibilitas khusus: nama tanpa awalan yang
cocok dengan id plugin bawaan menggunakan sumber bawaan tersebut; nama tanpa awalan yang cocok
dengan id plugin eksternal resmi menggunakan katalog paket resmi; spesifikasi tanpa awalan lainnya
diinstal melalui npm selama peralihan peluncuran. Spesifikasi mentah `@openclaw/*`
yang cocok dengan plugin bawaan juga mengacu pada salinan bawaan sebelum fallback
npm. Gunakan `npm:@openclaw/<plugin>@<version>` untuk secara sengaja menginstal
paket npm eksternal alih-alih salinan bawaan. Gunakan `clawhub:`, `npm:`,
`git:`, atau `npm-pack:` untuk pemilihan sumber yang deterministik. Lihat
[`openclaw plugins`](/id/cli/plugins#install) untuk kontrak perintah lengkap.

Untuk instalasi npm, spesifikasi yang tidak disematkan dan `@latest` memilih paket stabil
terbaru yang menyatakan kompatibilitas dengan build OpenClaw ini. Jika rilis terbaru
npm saat ini menyatakan `openclaw.compat.pluginApi` atau
`openclaw.install.minHostVersion` yang lebih baru daripada yang didukung build ini, OpenClaw memindai
versi stabil yang lebih lama dan menginstal versi terbaru yang sesuai. Versi persis
dan tag channel eksplisit seperti `@beta` tetap disematkan ke paket yang dipilih
dan gagal jika tidak kompatibel.

### Kebijakan instalasi operator

Konfigurasikan `security.installPolicy` untuk menjalankan perintah kebijakan lokal tepercaya
sebelum instalasi atau pembaruan plugin dilanjutkan. Kebijakan menerima metadata beserta
jalur sumber yang telah dipersiapkan dan dapat mengizinkan atau memblokir instalasi. Kebijakan ini mencakup jalur
instalasi/pembaruan berbasis CLI maupun Gateway. Hook `before_install` plugin berjalan
kemudian, dan hanya dalam proses OpenClaw tempat hook plugin dimuat, jadi gunakan
`security.installPolicy` untuk keputusan instalasi milik operator sebagai gantinya. Flag
`--dangerously-force-unsafe-install` yang sudah tidak digunakan lagi diterima untuk
kompatibilitas tetapi tidak melakukan apa pun: flag tersebut tidak melewati kebijakan instalasi atau daftar larangan
dependensi plugin bawaan OpenClaw.

Lihat [Konfigurasi Skills](/id/tools/skills-config#operator-install-policy-securityinstallpolicy)
untuk skema exec `security.installPolicy` bersama yang digunakan oleh Skills dan
plugin.

### Konfigurasikan kebijakan plugin

Bentuk konfigurasi plugin yang umum adalah:

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

- `plugins.enabled: false` menonaktifkan semua plugin dan melewati pekerjaan penemuan/pemuatan.
  Referensi plugin usang tetap tidak aktif selama ini berlaku; aktifkan kembali
  plugin sebelum menjalankan pembersihan doctor jika Anda ingin id usang dihapus.
- `plugins.deny` mengalahkan daftar izin dan pengaktifan per plugin.
- `plugins.allow` adalah daftar izin eksklusif. Alat milik plugin di luar
  daftar izin tetap tidak tersedia meskipun `tools.allow` menyertakan `"*"`.
- `plugins.entries.<id>.enabled: false` menonaktifkan satu plugin sekaligus mempertahankan
  konfigurasinya.
- `plugins.load.paths` menambahkan file atau direktori plugin lokal secara eksplisit.
  Jalur lokal `plugins install` terkelola harus berupa direktori plugin atau
  arsip; gunakan `plugins.load.paths` untuk file plugin mandiri.
- Plugin yang berasal dari workspace dinonaktifkan secara default; aktifkan atau
  tambahkan secara eksplisit ke daftar izin sebelum menggunakan kode workspace lokal.
- Plugin bawaan mengikuti metadata aktif-secara-default/nonaktif-secara-default bawaannya
  kecuali konfigurasi secara eksplisit menimpanya.
- `plugins.slots.<slot>` (`memory` atau `contextEngine`) memilih satu plugin untuk
  kategori eksklusif. Pemilihan slot dihitung sebagai aktivasi eksplisit dan
  memaksa plugin terpilih aktif untuk slot tersebut, meskipun seharusnya
  bersifat opt-in. `plugins.deny` dan `plugins.entries.<id>.enabled: false` tetap
  memblokirnya.
- Plugin bawaan opt-in dapat aktif otomatis ketika konfigurasi menyebutkan salah satu
  permukaan miliknya, seperti referensi penyedia/model, konfigurasi channel, backend CLI,
  atau runtime harness agen.
- Perutean Codex keluarga OpenAI menjaga batas plugin penyedia dan runtime
  tetap terpisah: referensi model Codex lama merupakan konfigurasi lama yang diperbaiki doctor,
  sementara plugin bawaan `codex` memiliki runtime app-server Codex untuk
  referensi agen `openai/*` kanonis, `agentRuntime.id: "codex"` eksplisit, dan
  referensi lama `codex/*`.

Saat `plugins.allow` tidak ditetapkan dan plugin nonbawaan ditemukan secara otomatis dari
workspace atau root plugin global, log startup mencatat
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
dengan id plugin yang ditemukan dan, untuk daftar singkat, cuplikan minimal `plugins.allow`.
Jalankan [`openclaw plugins list --enabled --verbose`](/id/cli/plugins#list)
atau [`openclaw plugins inspect <id>`](/id/cli/plugins#inspect) pada id
plugin yang tercantum sebelum menyalin plugin tepercaya ke `openclaw.json`. Penyematan
kepercayaan yang sama berlaku saat diagnostik menyatakan bahwa plugin dimuat
`without install/load-path provenance`: periksa id plugin tersebut, lalu sematkan di
`plugins.allow` atau instal ulang dari sumber tepercaya agar OpenClaw mencatat asal-usul
instalasi.

Jalankan `openclaw doctor` atau `openclaw doctor --fix` saat validasi konfigurasi
melaporkan id plugin usang, ketidakcocokan daftar izin/alat, atau jalur plugin bawaan
lama.

## Memahami format plugin

OpenClaw mengenali dua format plugin:

| Format                 | Cara memuatnya                                                                | Gunakan saat                                                            |
| ---------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Plugin OpenClaw native | `openclaw.plugin.json` ditambah modul runtime yang dimuat dalam proses            | Anda menginstal atau membangun kemampuan runtime khusus OpenClaw        |
| Bundel kompatibel      | Tata letak plugin Codex, Claude, atau Cursor yang dipetakan ke inventaris plugin OpenClaw | Anda menggunakan kembali Skills, perintah, hook, atau metadata bundel yang kompatibel |

Kedua format muncul di `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable`, dan `openclaw plugins disable`. Lihat
[Bundel plugin](/id/plugins/bundles) untuk batas kompatibilitas bundel dan
[Membangun plugin](/id/plugins/building-plugins) untuk pembuatan plugin native.

## Hook plugin

Plugin dapat mendaftarkan hook saat runtime melalui dua API yang berbeda:

- Hook bertipe `api.on(...)` untuk peristiwa siklus hidup runtime. Ini adalah
  permukaan yang diutamakan untuk middleware, kebijakan, penulisan ulang pesan, pembentukan
  prompt, dan kontrol alat.
- `api.registerHook(...)` untuk sistem hook internal yang dijelaskan dalam
  [Hook](/id/automation/hooks). Ini terutama untuk efek samping perintah/siklus hidup
  tingkat kasar dan kompatibilitas dengan otomatisasi bergaya HOOK yang ada.

Aturan singkat: jika handler memerlukan prioritas, semantik penggabungan, atau
perilaku blokir/batal, gunakan hook bertipe. Jika hanya bereaksi terhadap `command:new`,
`command:reset`, `message:sent`, atau peristiwa tingkat kasar serupa, `api.registerHook`
sudah memadai.

Hook internal yang dikelola plugin muncul di `openclaw hooks list` dengan
`plugin:<id>`. Anda tidak dapat mengaktifkan atau menonaktifkannya melalui `openclaw hooks`;
aktifkan atau nonaktifkan pluginnya sebagai gantinya.

## Verifikasi Gateway aktif

`openclaw plugins list` dan `openclaw plugins inspect` biasa membaca konfigurasi dingin,
manifes, dan status registri. Keduanya tidak membuktikan bahwa Gateway yang sudah berjalan
telah mengimpor kode plugin yang sama.

Saat sebuah plugin tampak terinstal tetapi lalu lintas percakapan langsung tidak menggunakannya:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Gateway terkelola dimulai ulang secara otomatis setelah perubahan penginstalan, pembaruan, dan
penghapusan plugin yang mengubah sumber plugin. Pada penginstalan VPS atau kontainer, pastikan
setiap mulai ulang manual menargetkan proses anak `openclaw gateway run` sebenarnya yang
melayani saluran Anda, bukan hanya pembungkus atau supervisor.

## Pemecahan masalah

| Gejala                                                        | Pemeriksaan                                                                                                                                      | Perbaikan                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Plugin muncul di `plugins list` tetapi hook runtime tidak berjalan  | Gunakan `openclaw plugins inspect <id> --runtime --json` dan konfirmasikan Gateway aktif dengan `gateway status --deep --require-rpc`             | Mulai ulang Gateway langsung setelah perubahan penginstalan, pembaruan, konfigurasi, atau sumber                               |
| Diagnostik kepemilikan saluran atau alat duplikat muncul         | Jalankan `openclaw plugins list --enabled --verbose`, periksa setiap plugin yang dicurigai dengan `--runtime --json`, dan bandingkan kepemilikan saluran/alat | Nonaktifkan salah satu pemilik, hapus penginstalan usang, atau gunakan `preferOver` manifes untuk penggantian yang disengaja      |
| Konfigurasi menyatakan sebuah plugin tidak ditemukan                                | Periksa [Inventaris plugin](/id/plugins/plugin-inventory) untuk mengetahui apakah plugin tersebut merupakan bawaan, eksternal resmi, atau hanya sumber                           | Instal paket eksternal, aktifkan plugin bawaan, atau hapus konfigurasi usang                         |
| Konfigurasi tidak valid selama penginstalan                               | Baca pesan validasi dan jalankan `openclaw doctor --fix` jika pesan tersebut menunjuk ke status plugin yang usang                                             | Doctor dapat mengarantina konfigurasi plugin yang tidak valid dengan menonaktifkan entri dan menghapus muatan yang tidak valid     |
| Jalur plugin diblokir karena kepemilikan atau izin yang mencurigakan | Periksa diagnostik sebelum galat konfigurasi                                                                                             | Perbaiki kepemilikan/izin sistem berkas, lalu jalankan `openclaw plugins registry --refresh`                    |
| `OPENCLAW_NIX_MODE=1` memblokir perintah siklus hidup                | Pastikan penginstalan dikelola oleh Nix                                                                                                      | Ubah pilihan plugin dalam sumber Nix alih-alih menggunakan perintah pengubah plugin                      |
| Impor dependensi gagal saat runtime                             | Periksa apakah plugin diinstal melalui npm/git/ClawHub atau dimuat dari jalur lokal                                                 | Jalankan `openclaw plugins update <id>`, instal ulang sumber, atau instal sendiri dependensi plugin lokal |

Saat plugin terkelola yang diaktifkan gagal memverifikasi muatan selama
startup Gateway, OpenClaw mengarantina akar plugin terinstal tersebut hanya untuk proses boot itu dan
tetap melayani plugin lainnya. `openclaw status --all`, `openclaw health`,
dan `openclaw doctor` melaporkannya sebagai `configured-unavailable`. Perbaiki atau instal ulang
plugin tersebut, lalu mulai ulang Gateway. Penggantian eksplisit `plugins.load.paths` yang sehat
dengan id plugin yang sama tidak dikarantina akibat penginstalan rusak yang usang.

Saat konfigurasi plugin usang masih menyebut plugin saluran yang tidak lagi dapat ditemukan,
validasi konfigurasi menurunkan kunci saluran tersebut menjadi peringatan, bukan kegagalan fatal,
sehingga startup Gateway tetap dapat melayani setiap saluran lainnya. Jalankan
`openclaw doctor --fix` untuk menghapus entri plugin dan saluran yang usang. Kunci
saluran yang tidak dikenal tanpa bukti plugin usang tetap menggagalkan validasi agar kesalahan ketik
tetap terlihat.

Untuk penggantian saluran yang disengaja, plugin yang diutamakan harus mendeklarasikan
`channelConfigs.<channel-id>.preferOver` dengan id plugin lama atau berprioritas lebih rendah.
Jika kedua plugin diaktifkan secara eksplisit, OpenClaw mempertahankan permintaan tersebut
dan melaporkan diagnostik saluran/alat duplikat alih-alih memilih satu pemilik
secara diam-diam.

Jika sebuah paket terinstal melaporkan bahwa paket tersebut `requires compiled runtime output for
TypeScript entry ...`, paket itu diterbitkan tanpa berkas JavaScript
yang dibutuhkan OpenClaw saat runtime. Perbarui atau instal ulang setelah penerbit menyediakan
JavaScript yang telah dikompilasi, atau nonaktifkan/hapus plugin tersebut hingga saat itu.

### Kepemilikan jalur plugin yang diblokir

Jika diagnostik menyatakan
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
dan validasi dilanjutkan dengan `plugin present but blocked`, OpenClaw menemukan
berkas plugin yang dimiliki oleh pengguna Unix yang berbeda dari proses yang memuatnya.
Biarkan konfigurasi plugin tetap tersedia; perbaiki kepemilikan sistem berkas atau jalankan OpenClaw
sebagai pengguna yang sama dengan pemilik direktori status.

Untuk penginstalan Docker, citra resmi berjalan sebagai `node` (uid `1000`), sehingga
direktori konfigurasi dan ruang kerja OpenClaw yang dipasang dengan bind mount dari host biasanya harus
dimiliki oleh uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Jika Anda sengaja menjalankan OpenClaw sebagai root, perbaiki akar plugin terkelola agar
dimiliki oleh root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Setelah memperbaiki kepemilikan, jalankan kembali `openclaw doctor --fix` atau
`openclaw plugins registry --refresh` agar registri plugin yang tersimpan
sesuai dengan berkas yang telah diperbaiki.

### Penyiapan alat plugin yang lambat

Jika giliran agen tampak macet saat menyiapkan alat, aktifkan pencatatan jejak
dan periksa baris waktu pabrik alat plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Cari:

```text
[trace:plugin-tools] waktu pabrik ...
```

Ringkasan mencantumkan total waktu pabrik dan pabrik alat plugin yang paling lambat,
termasuk id plugin, nama alat yang dideklarasikan, bentuk hasil, dan apakah alat tersebut
opsional. Baris lambat dinaikkan menjadi peringatan saat satu pabrik memerlukan waktu
setidaknya 1s atau total persiapan pabrik alat plugin memerlukan waktu setidaknya 5s.

OpenClaw menyimpan hasil pabrik alat plugin yang berhasil dalam cache untuk resolusi
berulang dengan konteks permintaan efektif yang sama. Kunci cache mencakup
konfigurasi runtime efektif, ruang kerja dan id agen, kebijakan sandbox, pengaturan
peramban, konteks pengiriman, identitas peminta, dan status kepemilikan, sehingga
pabrik yang bergantung pada bidang tepercaya tersebut dijalankan kembali saat konteks
berubah. Jika waktunya tetap tinggi, plugin mungkin melakukan pekerjaan mahal sebelum
mengembalikan definisi alatnya.

Jika satu plugin mendominasi waktu tersebut, periksa pendaftaran runtime-nya:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Kemudian perbarui, instal ulang, atau nonaktifkan plugin tersebut. Penulis plugin sebaiknya memindahkan
pemuatan dependensi yang mahal ke belakang jalur eksekusi alat alih-alih melakukannya
di dalam pabrik alat.

Untuk akar dependensi, validasi metadata paket, catatan registri, perilaku pemuatan ulang
saat startup, dan pembersihan lama, lihat
[Resolusi dependensi plugin](/id/plugins/dependency-resolution).

## Terkait

- [Kelola plugin](/id/plugins/manage-plugins) - contoh perintah untuk mencantumkan, menginstal, memperbarui, menghapus, dan menerbitkan
- [`openclaw plugins`](/id/cli/plugins) - referensi CLI lengkap
- [Inventaris plugin](/id/plugins/plugin-inventory) - daftar plugin bawaan dan eksternal yang dihasilkan
- [Referensi plugin](/id/plugins/reference) - halaman referensi per plugin yang dihasilkan
- [Plugin komunitas](/id/plugins/community) - penemuan ClawHub dan kebijakan PR dokumentasi
- [Resolusi dependensi plugin](/id/plugins/dependency-resolution) - akar penginstalan, catatan registri, dan batas runtime
- [Membangun plugin](/id/plugins/building-plugins) - panduan pembuatan plugin native
- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview) - pendaftaran runtime, hook, dan bidang API
- [Manifes plugin](/id/plugins/manifest) - metadata manifes dan paket
