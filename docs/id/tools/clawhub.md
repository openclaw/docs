---
read_when:
    - Mencari, menginstal, atau memperbarui Skills atau Plugin
    - Menerbitkan Skills atau Plugin ke registri
    - Mengonfigurasi CLI clawhub atau penggantian lingkungannya
sidebarTitle: ClawHub
summary: 'ClawHub: registri publik untuk Skills dan Plugin OpenClaw, alur instalasi bawaan, dan CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-06T09:29:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78ccf1911344d71b3b1c2c94691e15108305348e09db62aaaf1d03d852984acd
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub adalah registri publik untuk **OpenClaw Skills dan Plugin**.

- Gunakan perintah `openclaw` bawaan untuk mencari, menginstal, dan memperbarui Skills, serta untuk menginstal Plugin dari ClawHub.
- Gunakan CLI `clawhub` terpisah untuk alur kerja autentikasi registri, publikasi, penghapusan/pemulihan penghapusan, dan sinkronisasi.

Situs: [clawhub.ai](https://clawhub.ai)

## Mulai cepat

<Steps>
  <Step title="Cari">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Instal">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Gunakan">
    Mulai sesi OpenClaw baru - sesi tersebut akan mengambil skill baru.
  </Step>
  <Step title="Publikasikan (opsional)">
    Untuk alur kerja yang diautentikasi registri (publikasi, sinkronisasi, kelola), instal
    CLI `clawhub` terpisah:

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Alur OpenClaw bawaan

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Perintah `openclaw` bawaan menginstal ke ruang kerja aktif Anda dan
    mempertahankan metadata sumber agar panggilan `update` berikutnya tetap dapat menggunakan ClawHub.

  </Tab>
  <Tab title="Plugin">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` menanyakan katalog Plugin ClawHub dan mencetak nama paket
    yang siap diinstal. Gunakan `clawhub:<package>` saat Anda menginginkan resolusi ClawHub.
    Spesifikasi Plugin mentah yang aman untuk npm diinstal dari npm selama transisi peluncuran:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` juga hanya npm dan berguna saat suatu spesifikasi dapat
    menjadi ambigu:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Instalasi Plugin memvalidasi kompatibilitas `pluginApi` dan
    `minGatewayVersion` yang diiklankan sebelum instalasi arsip berjalan, sehingga
    host yang tidak kompatibel gagal tertutup lebih awal, bukan menginstal paket
    secara parsial. Saat versi paket menerbitkan artefak ClawPack,
    OpenClaw memilih `.tgz` npm-pack unggahan yang persis, memverifikasi header
    digest ClawHub dan byte yang diunduh, serta mencatat jenis artefak, integritas
    npm, shasum npm, nama tarball, dan metadata digest ClawPack untuk pembaruan
    berikutnya. Versi paket lama tanpa metadata ClawPack tetap menggunakan jalur
    verifikasi arsip paket lama.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` hanya menerima keluarga Plugin
yang dapat diinstal. Jika paket ClawHub sebenarnya adalah skill, OpenClaw berhenti dan
mengarahkan Anda ke `openclaw skills install <slug>` sebagai gantinya.

Instalasi Plugin ClawHub anonim juga gagal tertutup untuk paket privat.
Kanal komunitas atau kanal nonresmi lainnya tetap dapat diinstal, tetapi OpenClaw
memberi peringatan agar operator dapat meninjau sumber dan verifikasi sebelum mengaktifkannya.
</Note>

## Apa itu ClawHub

- Registri publik untuk OpenClaw Skills dan Plugin.
- Penyimpanan bundle skill dan metadata berversi.
- Permukaan penemuan untuk pencarian, tag, dan sinyal penggunaan.

Skill biasa adalah bundle file berversi yang mencakup:

- File `SKILL.md` dengan deskripsi utama dan penggunaan.
- Konfigurasi, skrip, atau file pendukung opsional yang digunakan oleh skill.
- Metadata seperti tag, ringkasan, dan persyaratan instalasi.

ClawHub menggunakan metadata untuk mendukung penemuan dan mengekspos kapabilitas skill
dengan aman. Registri melacak sinyal penggunaan (bintang, unduhan) untuk
meningkatkan peringkat dan visibilitas. Setiap publikasi membuat versi semver
baru, dan registri menyimpan riwayat versi agar pengguna dapat mengaudit
perubahan.

## Ruang kerja dan pemuatan skill

CLI `clawhub` terpisah juga menginstal Skills ke `./skills` di bawah
direktori kerja Anda saat ini. Jika ruang kerja OpenClaw dikonfigurasi,
`clawhub` kembali ke ruang kerja tersebut kecuali Anda mengganti `--workdir`
(atau `CLAWHUB_WORKDIR`). OpenClaw memuat Skills ruang kerja dari
`<workspace>/skills` dan mengambilnya pada sesi **berikutnya**.

Jika Anda sudah menggunakan `~/.openclaw/skills` atau Skills bawaan, Skills
ruang kerja akan diprioritaskan. Untuk detail lebih lanjut tentang cara Skills dimuat,
dibagikan, dan digating, lihat [Skills](/id/tools/skills).

## Fitur layanan

| Fitur                    | Catatan                                                             |
| ------------------------ | ------------------------------------------------------------------- |
| Penelusuran publik       | Skills dan konten `SKILL.md`-nya dapat dilihat publik.              |
| Pencarian                | Didukung embedding (pencarian vektor), bukan hanya kata kunci.      |
| Pembuatan versi          | Semver, changelog, dan tag (termasuk `latest`).                     |
| Unduhan                  | Zip per versi.                                                      |
| Bintang dan komentar     | Umpan balik komunitas.                                              |
| Ringkasan pemindaian keamanan | Halaman detail menampilkan status pemindaian terbaru sebelum instalasi atau unduhan. |
| Halaman detail pemindai  | Hasil VirusTotal, ClawScan, dan analisis statis memiliki tautan mendalam. |
| Dasbor pemulihan pemilik | Penerbit dapat melihat konten milik mereka yang ditahan pemindaian dari `/dashboard`. |
| Pemindaian ulang atas permintaan pemilik | Pemilik dapat meminta pemindaian ulang terbatas untuk pemulihan positif palsu. |
| Moderasi                 | Persetujuan dan audit.                                              |
| API ramah CLI            | Cocok untuk otomatisasi dan scripting.                              |

## Keamanan dan moderasi

ClawHub terbuka secara default - siapa pun dapat mengunggah Skills, tetapi akun GitHub
harus **berusia setidaknya satu minggu** untuk menerbitkan. Ini memperlambat
penyalahgunaan tanpa memblokir kontributor yang sah.

<AccordionGroup>
  <Accordion title="Pemindaian keamanan">
    ClawHub menjalankan pemeriksaan keamanan otomatis pada Skills dan rilis Plugin
    yang dipublikasikan. Halaman detail publik merangkum hasil saat ini, dan baris
    pemindai tertaut ke halaman detail khusus untuk VirusTotal, ClawScan, dan analisis
    statis.

    Rilis yang ditahan pemindaian atau diblokir mungkin tidak tersedia di katalog publik dan
    permukaan instalasi, tetapi tetap terlihat oleh pemiliknya di `/dashboard`.

  </Accordion>
  <Accordion title="Pelaporan">
    - Setiap pengguna yang masuk dapat melaporkan skill.
    - Alasan laporan wajib diisi dan dicatat.
    - Setiap pengguna dapat memiliki hingga 20 laporan aktif sekaligus.
    - Skills dengan lebih dari 3 laporan unik disembunyikan otomatis secara default.

  </Accordion>
  <Accordion title="Moderasi">
    - Moderator dapat melihat Skills tersembunyi, menampilkannya kembali, menghapusnya, atau memblokir pengguna.
    - Penyalahgunaan fitur laporan dapat berakibat pemblokiran akun.
    - Tertarik menjadi moderator? Tanyakan di Discord OpenClaw dan hubungi moderator atau maintainer.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Anda hanya memerlukan ini untuk alur kerja yang diautentikasi registri seperti
publikasi/sinkronisasi.

### Opsi global

<ParamField path="--workdir <dir>" type="string">
  Direktori kerja. Default: direktori saat ini; fallback ke ruang kerja OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Direktori Skills, relatif terhadap workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  URL dasar situs (login browser).
</ParamField>
<ParamField path="--registry <url>" type="string">
  URL dasar API registri.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Nonaktifkan prompt (noninteraktif).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  Cetak versi CLI.
</ParamField>

### Perintah

<AccordionGroup>
  <Accordion title="Auth (login / logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Opsi login:

    - `--token <token>` - tempel token API.
    - `--label <label>` - label yang disimpan untuk token login browser (default: `CLI token`).
    - `--no-browser` - jangan buka browser (memerlukan `--token`).

  </Accordion>
  <Accordion title="Pencarian">
    ```bash
    clawhub search "query"
    ```

    Mencari Skills. Untuk penemuan Plugin/paket, gunakan `clawhub package explore`.

    - `--limit <n>` - hasil maksimum.

  </Accordion>
  <Accordion title="Jelajahi / inspeksi Plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` dan `package inspect` adalah permukaan CLI ClawHub untuk penemuan Plugin/paket dan inspeksi metadata. Instalasi OpenClaw bawaan tetap menggunakan `openclaw plugins install clawhub:<package>`.

    Opsi:

    - `--family skill|code-plugin|bundle-plugin` - filter keluarga paket.
    - `--official` - tampilkan hanya paket resmi.
    - `--executes-code` - tampilkan hanya paket yang mengeksekusi kode.
    - `--version <version>` / `--tag <tag>` - inspeksi versi paket tertentu.
    - `--versions`, `--files`, `--file <path>` - inspeksi riwayat paket dan file.
    - `--json` - keluaran yang dapat dibaca mesin.

  </Accordion>
  <Accordion title="Instal / perbarui / daftar">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Opsi:

    - `--version <version>` - instal atau perbarui ke versi tertentu (hanya satu slug pada `update`).
    - `--force` - timpa jika folder sudah ada, atau saat file lokal tidak cocok dengan versi mana pun yang dipublikasikan.
    - `clawhub list` membaca `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Publikasikan Skills">
    ```bash
    clawhub skill publish <path>
    ```

    Opsi:

    - `--slug <slug>` - slug skill.
    - `--name <name>` - nama tampilan.
    - `--version <version>` - versi semver.
    - `--changelog <text>` - teks changelog (boleh kosong).
    - `--tags <tags>` - tag yang dipisahkan koma (default: `latest`).

  </Accordion>
  <Accordion title="Publikasikan Plugin">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` dapat berupa folder lokal, `owner/repo`, `owner/repo@ref`, atau
    URL GitHub.

    Opsi:

    - `--dry-run` - bangun rencana publikasi persis tanpa mengunggah apa pun.
    - `--json` - keluarkan keluaran yang dapat dibaca mesin untuk CI.
    - `--source-repo`, `--source-commit`, `--source-ref` - penggantian opsional saat deteksi otomatis tidak cukup.

  </Accordion>
  <Accordion title="Minta pemindaian ulang">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Perintah pemindaian ulang memerlukan token pemilik yang sudah login dan menargetkan versi skill
    atau rilis Plugin terbaru yang dipublikasikan. Dalam eksekusi noninteraktif, berikan
    `--yes`.

    Respons JSON mencakup jenis target, nama, versi, status pemindaian ulang, dan
    jumlah permintaan tersisa/maksimum untuk versi atau rilis tersebut.

  </Accordion>
  <Accordion title="Hapus / pulihkan penghapusan (pemilik atau admin)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Sinkronisasi (pindai lokal + publikasikan baru atau diperbarui)">
    ```bash
    clawhub sync
    ```

    Opsi:

    - `--root <dir...>` - root pemindaian tambahan.
    - `--all` - unggah semuanya tanpa prompt.
    - `--dry-run` - tampilkan apa yang akan diunggah.
    - `--bump <type>` - `patch|minor|major` untuk pembaruan (default: `patch`).
    - `--changelog <text>` - changelog untuk pembaruan noninteraktif.
    - `--tags <tags>` - tag yang dipisahkan koma (default: `latest`).
    - `--concurrency <n>` - pemeriksaan registri (default: `4`).

  </Accordion>
</AccordionGroup>

## Alur kerja umum

<Tabs>
  <Tab title="Cari">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Cari plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="Instal">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Perbarui semua">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Publikasikan satu skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Sinkronkan banyak skill">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Publikasikan plugin dari GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Metadata paket Plugin

Plugin kode harus menyertakan metadata OpenClaw yang diperlukan di
`package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Paket yang dipublikasikan sebaiknya mengirimkan **JavaScript yang sudah dibangun** dan mengarahkan
`runtimeExtensions` ke keluaran tersebut. Instalasi dari checkout Git masih dapat
kembali menggunakan sumber TypeScript ketika tidak ada file hasil build, tetapi entri runtime
yang sudah dibangun menghindari kompilasi TypeScript saat runtime pada jalur startup, doctor, dan
pemuatan plugin.

## Pemversian, lockfile, dan telemetri

<AccordionGroup>
  <Accordion title="Pemversian dan tag">
    - Setiap publikasi membuat `SkillVersion` **semver** baru.
    - Tag (seperti `latest`) menunjuk ke sebuah versi; memindahkan tag memungkinkan Anda melakukan rollback.
    - Changelog dilampirkan per versi dan dapat kosong saat menyinkronkan atau memublikasikan pembaruan.

  </Accordion>
  <Accordion title="Perubahan lokal vs versi registry">
    Pembaruan membandingkan konten skill lokal dengan versi registry menggunakan
    hash konten. Jika file lokal tidak cocok dengan versi yang sudah dipublikasikan,
    CLI meminta konfirmasi sebelum menimpa (atau memerlukan `--force` dalam
    eksekusi non-interaktif).
  </Accordion>
  <Accordion title="Pemindaian sinkronisasi dan root fallback">
    `clawhub sync` memindai workdir Anda saat ini terlebih dahulu. Jika tidak ada skill yang
    ditemukan, perintah ini kembali ke lokasi legacy yang dikenal (misalnya
    `~/openclaw/skills` dan `~/.openclaw/skills`). Ini dirancang untuk
    menemukan instalasi skill lama tanpa flag tambahan.
  </Accordion>
  <Accordion title="Penyimpanan dan lockfile">
    - Skill yang terinstal dicatat di `.clawhub/lock.json` di bawah workdir Anda.
    - Token autentikasi disimpan dalam file konfigurasi CLI ClawHub (override melalui `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetri (jumlah instalasi)">
    Saat Anda menjalankan `clawhub sync` ketika sudah masuk, CLI mengirim snapshot
    minimal untuk menghitung jumlah instalasi. Anda dapat menonaktifkan ini sepenuhnya:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Variabel lingkungan

| Variabel                      | Efek                                            |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Override URL situs.                             |
| `CLAWHUB_REGISTRY`            | Override URL API registry.                      |
| `CLAWHUB_CONFIG_PATH`         | Override tempat CLI menyimpan token/konfigurasi. |
| `CLAWHUB_WORKDIR`             | Override workdir default.                       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Nonaktifkan telemetri pada `sync`.              |

## Terkait

- [Plugin komunitas](/id/plugins/community)
- [Plugin](/id/tools/plugin)
- [Skills](/id/tools/skills)
