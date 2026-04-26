---
read_when:
    - Mencari, menginstal, atau memperbarui Skills atau plugin
    - Mempublikasikan Skills atau plugin ke registri
    - Mengonfigurasi CLI clawhub atau penggantian lingkungan-nya
sidebarTitle: ClawHub
summary: 'ClawHub: registri publik untuk Skills dan plugin OpenClaw, alur instalasi native, dan CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-26T11:39:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e002bb56b643bfdfb5715ac3632d854df182475be632ebe36c46d04008cf6e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub adalah registri publik untuk **Skills dan plugin OpenClaw**.

- Gunakan perintah native `openclaw` untuk mencari, menginstal, dan memperbarui Skills, serta untuk menginstal plugin dari ClawHub.
- Gunakan CLI `clawhub` terpisah untuk autentikasi registri, publikasi, hapus/pulihkan, dan alur sinkronisasi.

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
    Mulai sesi OpenClaw baru — sesi tersebut akan mengambil skill baru.
  </Step>
  <Step title="Publikasikan (opsional)">
    Untuk alur kerja yang diautentikasi registri (publikasi, sinkronisasi, kelola), instal
    CLI `clawhub` terpisah:

    ```bash
    npm i -g clawhub
    # atau
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

    Perintah native `openclaw` menginstal ke workspace aktif Anda dan
    menyimpan metadata sumber agar pemanggilan `update` berikutnya tetap dapat menggunakan ClawHub.

  </Tab>
  <Tab title="Plugin">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    Spesifikasi plugin bare yang aman untuk npm juga dicoba terhadap ClawHub sebelum npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Instalasi plugin memvalidasi kompatibilitas `pluginApi` dan
    `minGatewayVersion` yang diiklankan sebelum proses instalasi arsip berjalan, sehingga
    host yang tidak kompatibel gagal tertutup lebih awal alih-alih menginstal
    paket secara parsial.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` hanya menerima keluarga plugin
yang dapat diinstal. Jika sebuah paket ClawHub sebenarnya adalah skill, OpenClaw akan berhenti dan
mengarahkan Anda ke `openclaw skills install <slug>` sebagai gantinya.

Instalasi plugin ClawHub anonim juga gagal tertutup untuk paket privat.
Kanal komunitas atau kanal tidak resmi lainnya tetap dapat menginstal, tetapi OpenClaw
memberi peringatan agar operator dapat meninjau sumber dan verifikasi sebelum
mengaktifkannya.
</Note>

## Apa itu ClawHub

- Registri publik untuk Skills dan plugin OpenClaw.
- Penyimpanan berversi untuk bundel skill dan metadata.
- Permukaan penemuan untuk pencarian, tag, dan sinyal penggunaan.

Skill pada umumnya adalah bundel file berversi yang mencakup:

- File `SKILL.md` dengan deskripsi utama dan penggunaan.
- Konfigurasi, skrip, atau file pendukung opsional yang digunakan oleh skill.
- Metadata seperti tag, ringkasan, dan persyaratan instalasi.

ClawHub menggunakan metadata untuk mendukung penemuan dan mengekspos
kemampuan skill dengan aman. Registri melacak sinyal penggunaan (bintang, unduhan) untuk
meningkatkan peringkat dan visibilitas. Setiap publikasi membuat versi
semver baru, dan registri menyimpan riwayat versi agar pengguna dapat mengaudit
perubahan.

## Workspace dan pemuatan skill

CLI `clawhub` terpisah juga menginstal skill ke `./skills` di bawah
direktori kerja Anda saat ini. Jika workspace OpenClaw dikonfigurasi,
`clawhub` akan menggunakan workspace tersebut kecuali Anda menimpa `--workdir`
(atau `CLAWHUB_WORKDIR`). OpenClaw memuat skill workspace dari
`<workspace>/skills` dan mengambilnya pada sesi **berikutnya**.

Jika Anda sudah menggunakan `~/.openclaw/skills` atau skill bawaan,
skill workspace didahulukan. Untuk detail lebih lanjut tentang cara skill dimuat,
dibagikan, dan dibatasi, lihat [Skills](/id/tools/skills).

## Fitur layanan

| Fitur              | Catatan                                                     |
| ------------------ | ----------------------------------------------------------- |
| Penjelajahan publik | Skills dan konten `SKILL.md`-nya dapat dilihat secara publik. |
| Pencarian          | Didukung embedding (pencarian vektor), bukan hanya kata kunci. |
| Pembuatan versi    | Semver, changelog, dan tag (termasuk `latest`).             |
| Unduhan            | Zip per versi.                                              |
| Bintang dan komentar | Umpan balik komunitas.                                    |
| Moderasi           | Persetujuan dan audit.                                      |
| API ramah CLI      | Cocok untuk otomatisasi dan skrip.                          |

## Keamanan dan moderasi

ClawHub secara default terbuka — siapa pun dapat mengunggah skill, tetapi akun GitHub
harus **berusia setidaknya satu minggu** untuk memublikasikan. Ini memperlambat
penyalahgunaan tanpa menghalangi kontributor yang sah.

<AccordionGroup>
  <Accordion title="Pelaporan">
    - Setiap pengguna yang sudah masuk dapat melaporkan skill.
    - Alasan pelaporan wajib diisi dan dicatat.
    - Setiap pengguna dapat memiliki hingga 20 laporan aktif dalam satu waktu.
    - Skill dengan lebih dari 3 laporan unik disembunyikan otomatis secara default.
  </Accordion>
  <Accordion title="Moderasi">
    - Moderator dapat melihat skill tersembunyi, menampilkannya kembali, menghapusnya, atau memblokir pengguna.
    - Penyalahgunaan fitur pelaporan dapat berujung pada pemblokiran akun.
    - Tertarik menjadi moderator? Tanyakan di Discord OpenClaw dan hubungi moderator atau maintainer.
  </Accordion>
</AccordionGroup>

## CLI ClawHub

Anda hanya memerlukan ini untuk alur kerja yang diautentikasi registri seperti
publikasi/sinkronisasi.

### Opsi global

<ParamField path="--workdir <dir>" type="string">
  Direktori kerja. Default: direktori saat ini; menggunakan workspace OpenClaw jika tersedia.
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
  <Accordion title="Autentikasi (login / logout / whoami)">
    ```bash
    clawhub login              # alur browser
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

    - `--limit <n>` — hasil maksimum.

  </Accordion>
  <Accordion title="Instal / perbarui / daftar">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Opsi:

    - `--version <version>` — instal atau perbarui ke versi tertentu (hanya satu slug pada `update`).
    - `--force` — timpa jika folder sudah ada, atau saat file lokal tidak cocok dengan versi apa pun yang dipublikasikan.
    - `clawhub list` membaca `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Publikasikan skill">
    ```bash
    clawhub skill publish <path>
    ```

    Opsi:

    - `--slug <slug>` — slug skill.
    - `--name <name>` — nama tampilan.
    - `--version <version>` — versi semver.
    - `--changelog <text>` — teks changelog (boleh kosong).
    - `--tags <tags>` — tag dipisahkan koma (default: `latest`).

  </Accordion>
  <Accordion title="Publikasikan plugin">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` dapat berupa folder lokal, `owner/repo`, `owner/repo@ref`, atau
    URL GitHub.

    Opsi:

    - `--dry-run` — bangun rencana publikasi yang tepat tanpa mengunggah apa pun.
    - `--json` — hasilkan output yang dapat dibaca mesin untuk CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — penimpaan opsional saat deteksi otomatis tidak cukup.

  </Accordion>
  <Accordion title="Hapus / pulihkan (pemilik atau admin)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Sinkronisasi (pindai lokal + publikasikan yang baru atau diperbarui)">
    ```bash
    clawhub sync
    ```

    Opsi:

    - `--root <dir...>` — root pemindaian tambahan.
    - `--all` — unggah semuanya tanpa prompt.
    - `--dry-run` — tampilkan apa yang akan diunggah.
    - `--bump <type>` — `patch|minor|major` untuk pembaruan (default: `patch`).
    - `--changelog <text>` — changelog untuk pembaruan non-interaktif.
    - `--tags <tags>` — tag dipisahkan koma (default: `latest`).
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

### Metadata paket plugin

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
`runtimeExtensions` ke output tersebut. Instalasi dari checkout Git masih dapat
menggunakan fallback ke source TypeScript saat tidak ada file hasil build, tetapi entri runtime
yang sudah dibangun menghindari kompilasi TypeScript saat runtime pada jalur startup, doctor, dan
pemuatan plugin.

## Pembuatan versi, lockfile, dan telemetri

<AccordionGroup>
  <Accordion title="Pembuatan versi dan tag">
    - Setiap publikasi membuat `SkillVersion` **semver** baru.
    - Tag (seperti `latest`) menunjuk ke sebuah versi; memindahkan tag memungkinkan Anda melakukan rollback.
    - Changelog dilampirkan per versi dan dapat kosong saat sinkronisasi atau memublikasikan pembaruan.
  </Accordion>
  <Accordion title="Perubahan lokal vs versi registri">
    Pembaruan membandingkan konten skill lokal dengan versi registri menggunakan
    hash konten. Jika file lokal tidak cocok dengan versi yang dipublikasikan mana pun, CLI
    akan meminta konfirmasi sebelum menimpa (atau memerlukan `--force` pada
    proses non-interaktif).
  </Accordion>
  <Accordion title="Pemindaian sinkronisasi dan root fallback">
    `clawhub sync` memindai workdir Anda saat ini terlebih dahulu. Jika tidak ada skill
    ditemukan, perintah ini akan menggunakan lokasi lama yang dikenal sebagai fallback (misalnya
    `~/openclaw/skills` dan `~/.openclaw/skills`). Ini dirancang untuk
    menemukan instalasi skill lama tanpa flag tambahan.
  </Accordion>
  <Accordion title="Penyimpanan dan lockfile">
    - Skill yang terinstal dicatat dalam `.clawhub/lock.json` di bawah workdir Anda.
    - Token autentikasi disimpan di file konfigurasi CLI ClawHub (timpa melalui `CLAWHUB_CONFIG_PATH`).
  </Accordion>
  <Accordion title="Telemetri (jumlah instalasi)">
    Saat Anda menjalankan `clawhub sync` dalam keadaan login, CLI mengirim snapshot minimal
    untuk menghitung jumlah instalasi. Anda dapat menonaktifkan ini sepenuhnya:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Variabel lingkungan

| Variabel                      | Efek                                            |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Timpa URL situs.                                |
| `CLAWHUB_REGISTRY`            | Timpa URL API registri.                         |
| `CLAWHUB_CONFIG_PATH`         | Timpa lokasi CLI menyimpan token/konfigurasi.   |
| `CLAWHUB_WORKDIR`             | Timpa workdir default.                          |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Nonaktifkan telemetri pada `sync`.              |

## Terkait

- [Plugin komunitas](/id/plugins/community)
- [Plugin](/id/tools/plugin)
- [Skills](/id/tools/skills)
