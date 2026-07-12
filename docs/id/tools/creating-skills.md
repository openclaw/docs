---
read_when:
    - Anda sedang membuat skill kustom baru
    - Anda memerlukan alur kerja awal yang praktis untuk Skills berbasis SKILL.md
    - Anda ingin menggunakan Skill Workshop untuk mengusulkan sebuah skill agar ditinjau oleh agen
sidebarTitle: Creating skills
summary: Buat, uji, dan publikasikan Skills ruang kerja SKILL.md khusus untuk agen OpenClaw Anda.
title: Membuat Skills
x-i18n:
    generated_at: "2026-07-12T14:43:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills mengajarkan kepada agen cara dan waktu menggunakan alat. Setiap skill adalah direktori
yang berisi file `SKILL.md` dengan frontmatter YAML dan instruksi markdown.
OpenClaw memuat skill dari beberapa root dalam [urutan prioritas](/id/tools/skills#loading-order) yang telah ditentukan.

## Buat skill pertama Anda

<Steps>
  <Step title="Buat direktori skill">
    Skills berada di folder `skills/` ruang kerja Anda:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Anda dapat mengelompokkan skill dalam subfolder agar lebih teratur — nama skill tetap
    ditentukan oleh frontmatter `SKILL.md`, bukan jalur folder:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # nama skill tetap "hello-world", dipanggil sebagai /hello-world
    ```

  </Step>

  <Step title="Tulis SKILL.md">
    Frontmatter menentukan metadata; isi dokumen memberikan instruksi kepada agen.

    ```markdown
    ---
    name: hello-world
    description: Skill sederhana yang mencetak sapaan.
    ---

    # Halo Dunia

    Saat pengguna meminta sapaan, gunakan alat `exec` untuk menjalankan:

    ```bash
    echo "Halo dari skill khusus Anda!"
    ```
    ```

    Aturan penamaan:
    - Gunakan huruf kecil, angka, dan tanda hubung untuk `name`.
    - Pastikan nama direktori dan `name` pada frontmatter selaras.
    - `description` ditampilkan kepada agen dan dalam penemuan perintah garis miring —
      pertahankan dalam satu baris dan kurang dari 160 karakter.

  </Step>

  <Step title="Verifikasi bahwa skill telah dimuat">
    ```bash
    openclaw skills list
    ```

    Secara default, OpenClaw memantau file `SKILL.md` di bawah root skill. Jika
    pemantau dinonaktifkan atau Anda melanjutkan sesi yang sudah ada, mulai sesi
    baru agar agen menerima daftar yang telah diperbarui:

    ```bash
    # Dari obrolan — arsipkan sesi saat ini dan mulai sesi baru
    /new

    # Atau mulai ulang Gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Uji">
    ```bash
    openclaw agent --message "beri saya sapaan"
    ```

    Atau buka obrolan dan tanyakan langsung kepada agen. Gunakan `/skill hello-world` untuk
    memanggilnya secara eksplisit berdasarkan nama.

  </Step>
</Steps>

## Referensi SKILL.md

### Kolom wajib

| Kolom         | Deskripsi                                                         |
| ------------- | ----------------------------------------------------------------- |
| `name`        | Slug unik yang menggunakan huruf kecil, angka, dan tanda hubung    |
| `description` | Deskripsi satu baris yang ditampilkan kepada agen dan dalam keluaran penemuan |

### Kunci frontmatter opsional

| Kolom                      | Default | Deskripsi                                                                                |
| -------------------------- | ------- | ---------------------------------------------------------------------------------------- |
| `user-invocable`           | `true`  | Tampilkan skill sebagai perintah garis miring pengguna                                   |
| `disable-model-invocation` | `false` | Jangan sertakan skill dalam prompt sistem agen (tetap berjalan melalui `/skill`)          |
| `command-dispatch`         | —       | Atur ke `tool` untuk merutekan perintah garis miring langsung ke alat tanpa melalui model |
| `command-tool`             | —       | Nama alat yang dipanggil saat `command-dispatch: tool` ditetapkan                         |
| `command-arg-mode`         | `raw`   | Untuk pengiriman ke alat, meneruskan string argumen mentah ke alat                        |
| `homepage`                 | —       | URL yang ditampilkan sebagai "Website" pada UI Skills macOS                               |

Untuk kolom pembatasan (`requires.bins`, `requires.env`, dan sebagainya), lihat
[Skills — Pembatasan](/id/tools/skills#gating).

### Menggunakan `{baseDir}`

Referensikan file di dalam direktori skill tanpa menuliskan jalur secara permanen —
agen mencocokkan `{baseDir}` dengan direktori skill itu sendiri:

```markdown
Jalankan skrip pembantu di `{baseDir}/scripts/run.sh`.
```

## Menambahkan aktivasi bersyarat

Batasi skill Anda agar hanya dimuat ketika dependensinya tersedia:

```markdown
---
name: gemini-search
description: Lakukan pencarian menggunakan Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Opsi pembatasan">
    | Kunci | Deskripsi |
    | --- | --- |
    | `requires.bins` | Semua biner harus tersedia di `PATH` |
    | `requires.anyBins` | Setidaknya satu biner harus tersedia di `PATH` |
    | `requires.env` | Setiap variabel lingkungan harus tersedia dalam proses atau konfigurasi |
    | `requires.config` | Setiap jalur `openclaw.json` harus bernilai benar |
    | `os` | Filter platform: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Atur ke `true` untuk melewati semua pembatasan dan selalu menyertakan skill |

    Referensi lengkap: [Skills — Pembatasan](/id/tools/skills#gating).

  </Accordion>
  <Accordion title="Lingkungan dan kunci API">
    Hubungkan kunci API ke entri skill dalam `openclaw.json`:

    ```json5
    {
      skills: {
        entries: {
          "gemini-search": {
            enabled: true,
            apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
          },
        },
      },
    }
    ```

    Kunci disuntikkan ke proses host hanya untuk giliran agen tersebut.
    Kunci tersebut tidak diteruskan ke sandbox — lihat
    [variabel lingkungan dalam sandbox](/id/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Ajukan melalui Skill Workshop

Untuk skill yang disusun agen atau ketika Anda menginginkan peninjauan operator sebelum skill
diaktifkan, gunakan proposal [Skill Workshop](/id/tools/skill-workshop), bukan menulis
`SKILL.md` secara langsung.

```bash
# Ajukan skill yang benar-benar baru
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "Skill sederhana yang mencetak sapaan." \
  --proposal ./PROPOSAL.md

# Ajukan pembaruan untuk skill yang sudah ada
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Skill sapaan yang diperbarui"
```

Gunakan `--proposal-dir` ketika proposal menyertakan file pendukung:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "Skill sederhana yang mencetak sapaan." \
  --proposal-dir ./hello-world-proposal/
```

Direktori harus berisi `PROPOSAL.md` pada root-nya. File pendukung ditempatkan di bawah
`assets/`, `examples/`, `references/`, `scripts/`, atau `templates/`.

Setelah peninjauan:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Lihat [Skill Workshop](/id/tools/skill-workshop) untuk siklus hidup proposal lengkap.

## Menerbitkan ke ClawHub

<Steps>
  <Step title="Pastikan SKILL.md Anda lengkap">
    Pastikan `name`, `description`, dan semua kolom pembatasan `metadata.openclaw`
    telah ditetapkan. Tambahkan URL `homepage` jika Anda memiliki halaman proyek.
  </Step>
  <Step title="Instal CLI ClawHub mandiri dan masuk">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="Terbitkan">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    Tambahkan `--version <version>` atau `--owner <owner>` untuk mengganti versi
    yang disimpulkan atau menerbitkan di bawah pemilik tertentu. Lihat
    [ClawHub — Penerbitan](/id/clawhub/publishing) dan
    [CLI ClawHub](/id/clawhub/cli) untuk alur lengkap, cakupan pemilik, dan perintah
    pemeliharaan lainnya (`clawhub sync`, `clawhub skill rename`, ...).

  </Step>
</Steps>

## Praktik terbaik

<Tip>
  - **Buat ringkas** — beri tahu model tentang *apa* yang harus dilakukan, bukan cara menjadi AI.
  - **Utamakan keamanan** — jika skill Anda menggunakan `exec`, pastikan prompt tidak mengizinkan
    injeksi perintah arbitrer dari masukan yang tidak tepercaya.
  - **Uji secara lokal** — gunakan `openclaw agent --message "..."` sebelum membagikannya.
  - **Gunakan ClawHub** — telusuri skill komunitas di [clawhub.ai](https://clawhub.ai)
    sebelum membangun dari awal.
</Tip>

## Terkait

<CardGroup cols={2}>
  <Card title="Referensi Skills" href="/id/tools/skills" icon="puzzle-piece">
    Urutan pemuatan, pembatasan, daftar izin, dan format SKILL.md.
  </Card>
  <Card title="Skill Workshop" href="/id/tools/skill-workshop" icon="flask">
    Antrean proposal untuk skill yang disusun agen.
  </Card>
  <Card title="Konfigurasi Skills" href="/id/tools/skills-config" icon="gear">
    Skema konfigurasi `skills.*` lengkap.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Telusuri dan terbitkan skill pada registri publik.
  </Card>
  <Card title="Membangun plugin" href="/id/plugins/building-plugins" icon="plug">
    Plugin dapat menyertakan skill bersama alat yang didokumentasikannya.
  </Card>
</CardGroup>
