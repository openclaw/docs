---
read_when:
    - Anda sedang membuat skill kustom baru
    - Anda memerlukan alur kerja awal yang cepat untuk Skills berbasis SKILL.md
    - Anda ingin menggunakan Lokakarya Keterampilan untuk mengusulkan keterampilan agar ditinjau oleh agen
sidebarTitle: Creating skills
summary: Bangun, uji, dan publikasikan Skills ruang kerja SKILL.md kustom untuk agen OpenClaw Anda.
title: Membuat Skills
x-i18n:
    generated_at: "2026-06-27T18:16:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a744e9010c66b8465449d24430520473717edde86711bbb59774519189b9e72
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills mengajarkan agen bagaimana dan kapan menggunakan alat. Setiap skill adalah direktori
yang berisi file `SKILL.md` dengan YAML frontmatter dan instruksi markdown.
OpenClaw memuat Skills dari beberapa root dalam [urutan prioritas](/id/tools/skills#loading-order) yang ditentukan.

## Buat skill pertama Anda

<Steps>
  <Step title="Create the skill directory">
    Skills berada di folder `skills/` workspace Anda. Buat direktori untuk
    skill baru Anda:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Anda dapat mengelompokkan Skills dalam subfolder untuk pengorganisasian — skill tetap
    diberi nama oleh frontmatter `SKILL.md`, bukan path folder:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="Write SKILL.md">
    Buat `SKILL.md` di dalam direktori. Frontmatter mendefinisikan metadata;
    body memberikan instruksi kepada agen.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that prints a greeting.
    ---

    # Hello World

    When the user asks for a greeting, use the `exec` tool to run:

    ```bash
    echo "Hello from your custom skill!"
    ```
    ```

    Aturan penamaan:
    - Gunakan huruf kecil, digit, dan tanda hubung untuk `name`.
    - Selaraskan nama direktori dan `name` frontmatter.
    - `description` ditampilkan kepada agen dan dalam penemuan slash-command —
      pertahankan satu baris dan kurang dari 160 karakter.

  </Step>

  <Step title="Verify the skill loaded">
    ```bash
    openclaw skills list
    ```

    OpenClaw memantau file `SKILL.md` di bawah root Skills secara default. Jika
    pemantau dinonaktifkan atau Anda melanjutkan sesi yang sudah ada, mulai sesi baru
    agar agen menerima daftar yang diperbarui:

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Test it">
    Kirim pesan yang seharusnya memicu skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Atau buka chat dan minta langsung kepada agen. Gunakan `/skill hello-world` untuk
    memanggilnya secara eksplisit berdasarkan nama.

  </Step>
</Steps>

## Referensi SKILL.md

### Kolom wajib

| Kolom         | Deskripsi                                                     |
| ------------- | --------------------------------------------------------------- |
| `name`        | Slug unik yang menggunakan huruf kecil, digit, dan tanda hubung        |
| `description` | Deskripsi satu baris yang ditampilkan kepada agen dan dalam output penemuan |

### Kunci frontmatter opsional

| Kolom                      | Default | Deskripsi                                                                      |
| -------------------------- | ------- | -------------------------------------------------------------------------------- |
| `user-invocable`           | `true`  | Mengekspos skill sebagai slash command pengguna                                         |
| `disable-model-invocation` | `false` | Menjaga skill agar tidak masuk ke prompt sistem agen (tetap berjalan melalui `/skill`)        |
| `command-dispatch`         | —       | Atur ke `tool` untuk merutekan slash command langsung ke alat, melewati model |
| `command-tool`             | —       | Nama alat yang dipanggil saat `command-dispatch: tool` diatur                         |
| `command-arg-mode`         | `raw`   | Untuk dispatch alat, meneruskan string arg mentah ke alat                      |
| `homepage`                 | —       | URL yang ditampilkan sebagai "Situs Web" di UI Skills macOS                                    |

Untuk kolom gating (`requires.bins`, `requires.env`, dll.) lihat
[Skills — Gating](/id/tools/skills#gating).

### Menggunakan `{baseDir}`

Gunakan `{baseDir}` dalam body skill untuk merujuk file di dalam direktori
skill tanpa melakukan hardcode path:

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## Menambahkan aktivasi kondisional

Gate skill Anda agar hanya dimuat ketika dependensinya tersedia:

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Gating options">
    | Kunci | Deskripsi |
    | --- | --- |
    | `requires.bins` | Semua binary harus ada di `PATH` |
    | `requires.anyBins` | Setidaknya satu binary harus ada di `PATH` |
    | `requires.env` | Setiap env var harus ada dalam proses atau config |
    | `requires.config` | Setiap path `openclaw.json` harus bernilai truthy |
    | `os` | Filter platform: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Atur `true` untuk melewati semua gate dan selalu menyertakan skill |

    Referensi lengkap: [Skills — Gating](/id/tools/skills#gating).

  </Accordion>
  <Accordion title="Environment and API keys">
    Hubungkan API key ke entri skill di `openclaw.json`:

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
    Kunci tidak mencapai sandbox — lihat
    [sandboxed env vars](/id/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Ajukan melalui Skill Workshop

Untuk Skills yang disusun agen atau saat Anda menginginkan peninjauan operator sebelum skill
aktif, gunakan proposal [Skill Workshop](/id/tools/skill-workshop) alih-alih menulis
`SKILL.md` secara langsung.

```bash
# Propose a brand-new skill
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal ./PROPOSAL.md

# Propose an update to an existing skill
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Updated greeting skill"
```

Gunakan `--proposal-dir` saat proposal menyertakan file pendukung:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

Direktori harus berisi `PROPOSAL.md`. File pendukung dapat ditempatkan di `assets/`,
`examples/`, `references/`, `scripts/`, atau `templates/`.

Setelah peninjauan:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Lihat [Skill Workshop](/id/tools/skill-workshop) untuk siklus hidup proposal lengkap.

## Menerbitkan ke ClawHub

<Steps>
  <Step title="Ensure your SKILL.md is complete">
    Pastikan `name`, `description`, dan kolom gating `metadata.openclaw` apa pun
    sudah diatur. Tambahkan URL `homepage` jika Anda memiliki halaman proyek.
  </Step>
  <Step title="Install the ClawHub skill">
    Skill ClawHub mendokumentasikan bentuk perintah publikasi saat ini dan metadata
    yang diperlukan:

    ```bash
    openclaw skills install @openclaw/clawhub-publish
    ```

  </Step>
  <Step title="Publish">
    ```bash
    clawhub publish
    ```

    Lihat [ClawHub — Publishing](/id/clawhub/publishing) untuk alur lengkap.

  </Step>
</Steps>

## Praktik terbaik

<Tip>
  - **Ringkas** — instruksikan model tentang *apa* yang harus dilakukan, bukan bagaimana menjadi AI.
  - **Keselamatan dahulu** — jika skill Anda menggunakan `exec`, pastikan prompt tidak mengizinkan
    injeksi perintah sembarang dari input yang tidak tepercaya.
  - **Uji secara lokal** — gunakan `openclaw agent --message "..."` sebelum berbagi.
  - **Gunakan ClawHub** — jelajahi Skills komunitas di [clawhub.ai](https://clawhub.ai)
    sebelum membangun dari awal.
</Tip>

## Terkait

<CardGroup cols={2}>
  <Card title="Skills reference" href="/id/tools/skills" icon="puzzle-piece">
    Urutan pemuatan, gating, allowlist, dan format SKILL.md.
  </Card>
  <Card title="Skill Workshop" href="/id/tools/skill-workshop" icon="flask">
    Antrean proposal untuk Skills yang disusun agen.
  </Card>
  <Card title="Skills config" href="/id/tools/skills-config" icon="gear">
    Skema config `skills.*` lengkap.
  </Card>
  <Card title="ClawHub" href="/id/clawhub" icon="cloud">
    Jelajahi dan terbitkan Skills di registry publik.
  </Card>
  <Card title="Building plugins" href="/id/plugins/building-plugins" icon="plug">
    Plugin dapat mengirimkan Skills bersama alat yang didokumentasikannya.
  </Card>
</CardGroup>
