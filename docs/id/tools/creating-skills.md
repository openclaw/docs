---
read_when:
    - Anda sedang membuat skill kustom baru di workspace Anda
    - Anda memerlukan alur kerja awal cepat untuk skill berbasis SKILL.md
summary: Bangun dan uji Skills workspace kustom dengan SKILL.md
title: Membuat Skills
x-i18n:
    generated_at: "2026-04-05T14:07:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 747cebc5191b96311d1d6760bede1785a099acd7633a0b88de6b7882b57e1db6
    source_path: tools/creating-skills.md
    workflow: 15
---

# Membuat Skills

Skills mengajarkan agen bagaimana dan kapan menggunakan tool. Setiap skill adalah direktori
yang berisi file `SKILL.md` dengan frontmatter YAML dan instruksi markdown.

Untuk cara Skills dimuat dan diprioritaskan, lihat [Skills](/tools/skills).

## Buat skill pertama Anda

<Steps>
  <Step title="Buat direktori skill">
    Skills berada di workspace Anda. Buat folder baru:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Tulis SKILL.md">
    Buat `SKILL.md` di dalam direktori tersebut. Frontmatter mendefinisikan metadata,
    dan body markdown berisi instruksi untuk agen.

    ```markdown
    ---
    name: hello_world
    description: Skill sederhana yang menyapa.
    ---

    # Hello World Skill

    Saat pengguna meminta sapaan, gunakan tool `echo` untuk mengatakan
    "Hello from your custom skill!".
    ```

  </Step>

  <Step title="Tambahkan tools (opsional)">
    Anda dapat mendefinisikan schema tool kustom di frontmatter atau menginstruksikan agen
    untuk menggunakan tool sistem yang sudah ada (seperti `exec` atau `browser`). Skills juga dapat
    dikirim di dalam plugin bersama tool yang mereka dokumentasikan.

  </Step>

  <Step title="Muat skill">
    Mulai sesi baru agar OpenClaw mengambil skill tersebut:

    ```bash
    # Dari chat
    /new

    # Atau restart gateway
    openclaw gateway restart
    ```

    Verifikasi bahwa skill telah dimuat:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Uji">
    Kirim pesan yang seharusnya memicu skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Atau cukup chat dengan agen dan minta sapaan.

  </Step>
</Steps>

## Referensi metadata skill

Frontmatter YAML mendukung field berikut:

| Field                               | Wajib | Deskripsi                                  |
| ----------------------------------- | ----- | ------------------------------------------ |
| `name`                              | Ya    | Pengenal unik (snake_case)                 |
| `description`                       | Ya    | Deskripsi satu baris yang ditampilkan ke agen |
| `metadata.openclaw.os`              | Tidak | Filter OS (`["darwin"]`, `["linux"]`, dll.) |
| `metadata.openclaw.requires.bins`   | Tidak | Biner yang diperlukan di PATH              |
| `metadata.openclaw.requires.config` | Tidak | Kunci config yang diperlukan               |

## Praktik terbaik

- **Ringkaslah** — instruksikan model tentang _apa_ yang harus dilakukan, bukan bagaimana menjadi AI
- **Utamakan keamanan** — jika skill Anda menggunakan `exec`, pastikan prompt tidak memungkinkan injeksi perintah arbitrer dari input yang tidak tepercaya
- **Uji secara lokal** — gunakan `openclaw agent --message "..."` untuk menguji sebelum membagikan
- **Gunakan ClawHub** — telusuri dan kontribusikan Skills di [ClawHub](https://clawhub.ai)

## Tempat Skills berada

| Location                        | Prioritas | Cakupan              |
| ------------------------------- | --------- | -------------------- |
| `\<workspace\>/skills/`         | Tertinggi | Per-agen             |
| `\<workspace\>/.agents/skills/` | Tinggi    | Agen per-workspace   |
| `~/.agents/skills/`             | Sedang    | Profil agen bersama  |
| `~/.openclaw/skills/`           | Sedang    | Bersama (semua agen) |
| Bundled (dikirim bersama OpenClaw) | Rendah | Global               |
| `skills.load.extraDirs`         | Terendah  | Folder bersama kustom |

## Terkait

- [Referensi Skills](/tools/skills) — aturan pemuatan, prioritas, dan gating
- [Config Skills](/tools/skills-config) — schema config `skills.*`
- [ClawHub](/tools/clawhub) — registri skill publik
- [Building Plugins](/id/plugins/building-plugins) — plugin dapat mengirim Skills
