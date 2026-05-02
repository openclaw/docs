---
read_when:
    - Mencari, menginstal, atau memperbarui Skills atau Plugin
    - Mempublikasikan Skills atau Plugin ke registri
    - Mengonfigurasi CLI clawhub atau pengesampingan lingkungannya
sidebarTitle: ClawHub
summary: 'ClawHub: registri publik untuk Skills dan Plugin OpenClaw, alur instalasi native, dan CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T21:01:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd422cb3e7e53fcc6d2b8a557ebc569debb0b470d5fcf141d90499c03fb4d7b3
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub adalah registri publik untuk **Skills dan Plugin OpenClaw**.

- Gunakan perintah native `openclaw` untuk mencari, memasang, dan memperbarui Skills, serta memasang Plugin dari ClawHub.
- Gunakan CLI `clawhub` terpisah untuk alur kerja autentikasi registri, publish, delete/undelete, dan sinkronisasi.

Situs: [clawhub.ai](https://clawhub.ai)

## Mulai cepat

<Steps>
  <Step title="Cari">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Pasang">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Gunakan">
    Mulai sesi OpenClaw baru — sesi tersebut akan memuat Skills baru.
  </Step>
  <Step title="Publish (opsional)">
    Untuk alur kerja yang terautentikasi registri (publish, sinkronisasi, kelola), pasang
    CLI `clawhub` terpisah:

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Alur native OpenClaw

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Perintah native `openclaw` memasang ke workspace aktif Anda dan
    mempertahankan metadata sumber agar pemanggilan `update` berikutnya tetap dapat menggunakan ClawHub.

  </Tab>
  <Tab title="Plugin">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` mengueri katalog Plugin ClawHub dan mencetak nama
    paket yang siap dipasang. Gunakan `clawhub:<package>` saat Anda menginginkan resolusi ClawHub.
    Spesifikasi Plugin polos yang aman untuk npm dipasang dari npm selama cutover peluncuran:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` juga hanya npm dan berguna saat sebuah spesifikasi bisa
    ambigu:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Pemasangan Plugin memvalidasi kompatibilitas `pluginApi` dan
    `minGatewayVersion` yang diiklankan sebelum pemasangan arsip berjalan, sehingga
    host yang tidak kompatibel gagal tertutup lebih awal alih-alih memasang
    paket secara parsial. Saat sebuah versi paket menerbitkan artefak ClawPack,
    OpenClaw memilih npm-pack `.tgz` yang diunggah secara persis, memverifikasi header
    digest ClawHub dan byte yang diunduh, serta mencatat jenis artefak, integritas
    npm, shasum npm, nama tarball, dan metadata digest ClawPack untuk pembaruan
    berikutnya. Versi paket lama tanpa metadata ClawPack masih menggunakan
    jalur verifikasi arsip paket lama.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` hanya menerima famili Plugin yang
dapat dipasang. Jika sebuah paket ClawHub sebenarnya adalah Skills, OpenClaw berhenti dan
mengarahkan Anda ke `openclaw skills install <slug>` sebagai gantinya.

Pemasangan Plugin ClawHub anonim juga gagal tertutup untuk paket privat.
Kanal komunitas atau kanal non-resmi lainnya masih dapat dipasang, tetapi OpenClaw
memberi peringatan agar operator dapat meninjau sumber dan verifikasi sebelum mengaktifkannya.
</Note>

## Apa itu ClawHub

- Registri publik untuk Skills dan Plugin OpenClaw.
- Penyimpanan berversi untuk bundel dan metadata Skills.
- Permukaan discovery untuk pencarian, tag, dan sinyal penggunaan.

Skills umum adalah bundel file berversi yang mencakup:

- File `SKILL.md` dengan deskripsi utama dan penggunaan.
- Konfigurasi, skrip, atau file pendukung opsional yang digunakan oleh Skills.
- Metadata seperti tag, ringkasan, dan persyaratan pemasangan.

ClawHub menggunakan metadata untuk mendukung discovery dan mengekspos kemampuan Skills
secara aman. Registri melacak sinyal penggunaan (bintang, unduhan) untuk
meningkatkan peringkat dan visibilitas. Setiap publish membuat versi semver
baru, dan registri menyimpan riwayat versi sehingga pengguna dapat mengaudit
perubahan.

## Workspace dan pemuatan Skills

CLI `clawhub` terpisah juga memasang Skills ke `./skills` di bawah
direktori kerja Anda saat ini. Jika workspace OpenClaw dikonfigurasi,
`clawhub` menggunakan workspace tersebut sebagai fallback kecuali Anda menimpa `--workdir`
(atau `CLAWHUB_WORKDIR`). OpenClaw memuat Skills workspace dari
`<workspace>/skills` dan mengambilnya pada sesi **berikutnya**.

Jika Anda sudah menggunakan `~/.openclaw/skills` atau Skills bawaan, Skills
workspace lebih diprioritaskan. Untuk detail selengkapnya tentang bagaimana Skills dimuat,
dibagikan, dan digate, lihat [Skills](/id/tools/skills).

## Fitur layanan

| Fitur                    | Catatan                                                              |
| ------------------------ | -------------------------------------------------------------------- |
| Penelusuran publik       | Skills dan konten `SKILL.md`-nya dapat dilihat publik.               |
| Pencarian                | Didukung embedding (pencarian vektor), bukan hanya kata kunci.       |
| Versioning               | Semver, changelog, dan tag (termasuk `latest`).                      |
| Unduhan                  | Zip per versi.                                                       |
| Bintang dan komentar     | Umpan balik komunitas.                                               |
| Ringkasan pemindaian keamanan | Halaman detail menampilkan status pemindaian terbaru sebelum pemasangan atau unduhan. |
| Halaman detail pemindai  | Hasil VirusTotal, ClawScan, dan analisis statis memiliki tautan dalam. |
| Dasbor pemulihan pemilik | Publisher dapat melihat konten miliknya yang ditahan pemindaian dari `/dashboard`. |
| Pemindaian ulang atas permintaan pemilik | Pemilik dapat meminta pemindaian ulang terbatas untuk pemulihan false-positive. |
| Moderasi                 | Persetujuan dan audit.                                               |
| API ramah CLI            | Cocok untuk otomasi dan scripting.                                   |

## Keamanan dan moderasi

ClawHub terbuka secara default — siapa pun dapat mengunggah Skills, tetapi akun GitHub
harus berumur **setidaknya satu minggu** untuk publish. Ini memperlambat
penyalahgunaan tanpa memblokir kontributor yang sah.

<AccordionGroup>
  <Accordion title="Pemindaian keamanan">
    ClawHub menjalankan pemeriksaan keamanan otomatis pada Skills dan rilis Plugin
    yang dipublikasikan. Halaman detail publik merangkum hasil saat ini, dan baris
    pemindai menaut ke halaman detail khusus untuk VirusTotal, ClawScan, dan analisis
    statis.

    Rilis yang ditahan pemindaian atau diblokir mungkin tidak tersedia di katalog publik dan
    permukaan pemasangan, tetapi tetap terlihat oleh pemiliknya di `/dashboard`.

  </Accordion>
  <Accordion title="Pelaporan">
    - Setiap pengguna yang masuk dapat melaporkan Skills.
    - Alasan laporan wajib diisi dan dicatat.
    - Setiap pengguna dapat memiliki hingga 20 laporan aktif sekaligus.
    - Skills dengan lebih dari 3 laporan unik secara default disembunyikan otomatis.

  </Accordion>
  <Accordion title="Moderasi">
    - Moderator dapat melihat Skills tersembunyi, menampilkannya kembali, menghapusnya, atau memblokir pengguna.
    - Penyalahgunaan fitur laporan dapat mengakibatkan pemblokiran akun.
    - Tertarik menjadi moderator? Tanyakan di Discord OpenClaw dan hubungi moderator atau maintainer.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Anda hanya membutuhkan ini untuk alur kerja yang terautentikasi registri seperti
publish/sinkronisasi.

### Opsi global

<ParamField path="--workdir <dir>" type="string">
  Direktori kerja. Default: direktori saat ini; fallback ke workspace OpenClaw.
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
  Nonaktifkan prompt (non-interaktif).
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

    - `--token <token>` — tempel token API.
    - `--label <label>` — label yang disimpan untuk token login browser (default: `CLI token`).
    - `--no-browser` — jangan buka browser (memerlukan `--token`).

  </Accordion>
  <Accordion title="Cari">
    ```bash
    clawhub search "query"
    ```

    Mencari Skills. Untuk discovery Plugin/paket, gunakan `clawhub package explore`.

    - `--limit <n>` — hasil maksimum.

  </Accordion>
  <Accordion title="Telusuri / inspeksi Plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` dan `package inspect` adalah permukaan CLI ClawHub untuk discovery Plugin/paket dan inspeksi metadata. Pemasangan native OpenClaw tetap menggunakan `openclaw plugins install clawhub:<package>`.

    Opsi:

    - `--family skill|code-plugin|bundle-plugin` — filter famili paket.
    - `--official` — tampilkan hanya paket resmi.
    - `--executes-code` — tampilkan hanya paket yang menjalankan kode.
    - `--version <version>` / `--tag <tag>` — inspeksi versi paket tertentu.
    - `--versions`, `--files`, `--file <path>` — inspeksi riwayat dan file paket.
    - `--json` — output yang dapat dibaca mesin.

  </Accordion>
  <Accordion title="Pasang / perbarui / daftar">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Opsi:

    - `--version <version>` — pasang atau perbarui ke versi tertentu (hanya satu slug pada `update`).
    - `--force` — timpa jika folder sudah ada, atau saat file lokal tidak cocok dengan versi yang dipublikasikan mana pun.
    - `clawhub list` membaca `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Publish Skills">
    ```bash
    clawhub skill publish <path>
    ```

    Opsi:

    - `--slug <slug>` — slug Skills.
    - `--name <name>` — nama tampilan.
    - `--version <version>` — versi semver.
    - `--changelog <text>` — teks changelog (dapat kosong).
    - `--tags <tags>` — tag yang dipisahkan koma (default: `latest`).

  </Accordion>
  <Accordion title="Publish Plugin">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` dapat berupa folder lokal, `owner/repo`, `owner/repo@ref`, atau
    URL GitHub.

    Opsi:

    - `--dry-run` — bangun rencana publish yang persis tanpa mengunggah apa pun.
    - `--json` — keluarkan output yang dapat dibaca mesin untuk CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — override opsional saat deteksi otomatis tidak cukup.

  </Accordion>
  <Accordion title="Minta pemindaian ulang">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Perintah pemindaian ulang memerlukan token pemilik yang sudah login dan menargetkan versi
    Skills yang dipublikasikan terbaru atau rilis Plugin. Dalam eksekusi non-interaktif, berikan
    `--yes`.

    Respons JSON menyertakan jenis target, nama, versi, status pemindaian ulang, dan
    jumlah permintaan tersisa/maksimum untuk versi atau rilis tersebut.

  </Accordion>
  <Accordion title="Delete / undelete (pemilik atau admin)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Sinkronisasi (pindai lokal + publish baru atau diperbarui)">
    ```bash
    clawhub sync
    ```

    Opsi:

    - `--root <dir...>` — root pemindaian tambahan.
    - `--all` — unggah semuanya tanpa prompt.
    - `--dry-run` — tampilkan apa yang akan diunggah.
    - `--bump <type>` — `patch|minor|major` untuk pembaruan (default: `patch`).
    - `--changelog <text>` — changelog untuk pembaruan non-interaktif.
    - `--tags <tags>` — tag yang dipisahkan koma (default: `latest`).
    - `--concurrency <n>` — pemeriksaan registri (default: `4`).

  </Accordion>
</AccordionGroup>

## Alur kerja umum

<Tabs>
  <Tab title="Cari">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Temukan Plugin">
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
  <Tab title="Publikasikan Plugin dari GitHub">
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
`runtimeExtensions` ke keluaran tersebut. Instalasi dari checkout Git masih dapat melakukan fallback
ke sumber TypeScript saat tidak ada berkas hasil build, tetapi entri runtime yang sudah dibangun
menghindari kompilasi TypeScript saat runtime di jalur startup, doctor, dan
pemuatan Plugin.

## Pembuatan versi, lockfile, dan telemetri

<AccordionGroup>
  <Accordion title="Pembuatan versi dan tag">
    - Setiap publikasi membuat `SkillVersion` **semver** baru.
    - Tag (seperti `latest`) menunjuk ke sebuah versi; memindahkan tag memungkinkan Anda melakukan rollback.
    - Changelog dilampirkan per versi dan dapat kosong saat menyinkronkan atau memublikasikan pembaruan.

  </Accordion>
  <Accordion title="Perubahan lokal vs versi registry">
    Pembaruan membandingkan konten skill lokal dengan versi registry menggunakan
    hash konten. Jika berkas lokal tidak cocok dengan versi yang sudah dipublikasikan,
    CLI akan meminta konfirmasi sebelum menimpa (atau memerlukan `--force` dalam
    proses non-interaktif).
  </Accordion>
  <Accordion title="Pemindaian sinkronisasi dan root fallback">
    `clawhub sync` memindai workdir Anda saat ini terlebih dahulu. Jika tidak ada skill yang
    ditemukan, perintah ini melakukan fallback ke lokasi lama yang dikenal (misalnya
    `~/openclaw/skills` dan `~/.openclaw/skills`). Ini dirancang untuk
    menemukan instalasi skill lama tanpa flag tambahan.
  </Accordion>
  <Accordion title="Penyimpanan dan lockfile">
    - Skill yang diinstal dicatat di `.clawhub/lock.json` di bawah workdir Anda.
    - Token auth disimpan di berkas konfigurasi CLI ClawHub (timpa melalui `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetri (jumlah instalasi)">
    Saat Anda menjalankan `clawhub sync` dalam keadaan login, CLI mengirim snapshot
    minimal untuk menghitung jumlah instalasi. Anda dapat menonaktifkan ini sepenuhnya:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Variabel lingkungan

| Variabel                      | Efek                                            |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Timpa URL situs.                                |
| `CLAWHUB_REGISTRY`            | Timpa URL API registry.                         |
| `CLAWHUB_CONFIG_PATH`         | Timpa lokasi CLI menyimpan token/konfigurasi.   |
| `CLAWHUB_WORKDIR`             | Timpa workdir default.                          |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Nonaktifkan telemetri pada `sync`.              |

## Terkait

- [Plugin komunitas](/id/plugins/community)
- [Plugin](/id/tools/plugin)
- [Skills](/id/tools/skills)
