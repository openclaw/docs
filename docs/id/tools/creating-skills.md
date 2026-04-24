---
read_when:
    - Anda sedang membuat Skill kustom baru di workspace Anda
    - Anda memerlukan alur kerja awal cepat untuk Skills berbasis SKILL.md
summary: Bangun dan uji Skills workspace kustom dengan SKILL.md
title: Membuat Skills
x-i18n:
    generated_at: "2026-04-24T09:30:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: df9249e14936c65143580a6618679cf2d79a2960390e5c7afc5dbea1a9a6e045
    source_path: tools/creating-skills.md
    workflow: 15
---

Skills mengajarkan agen cara dan kapan menggunakan alat. Setiap skill adalah direktori
yang berisi file `SKILL.md` dengan frontmatter YAML dan instruksi markdown.

Untuk cara Skills dimuat dan diprioritaskan, lihat [Skills](/id/tools/skills).

## Buat Skill pertama Anda

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

    # Skill Hello World

    Saat pengguna meminta salam, gunakan alat `echo` untuk mengatakan
    "Hello from your custom skill!".
    ```

  </Step>

  <Step title="Tambahkan alat (opsional)">
    Anda dapat mendefinisikan skema alat kustom di frontmatter atau menginstruksikan agen
    untuk menggunakan alat sistem yang sudah ada (seperti `exec` atau `browser`). Skills juga dapat
    dikirim di dalam Plugin bersama alat yang mereka dokumentasikan.

  </Step>

  <Step title="Muat Skill">
    Mulai sesi baru agar OpenClaw memuat Skill:

    ```bash
    # Dari chat
    /new

    # Atau restart gateway
    openclaw gateway restart
    ```

    Verifikasi bahwa Skill dimuat:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Uji">
    Kirim pesan yang seharusnya memicu Skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Atau cukup chat dengan agen dan minta salam.

  </Step>
</Steps>

## Referensi metadata Skill

Frontmatter YAML mendukung field berikut:

| Field                               | Wajib | Deskripsi                                  |
| ----------------------------------- | ----- | ------------------------------------------ |
| `name`                              | Ya    | Pengenal unik (snake_case)                 |
| `description`                       | Ya    | Deskripsi satu baris yang ditampilkan ke agen |
| `metadata.openclaw.os`              | Tidak | Filter OS (`["darwin"]`, `["linux"]`, dll.) |
| `metadata.openclaw.requires.bins`   | Tidak | Biner yang diperlukan di PATH              |
| `metadata.openclaw.requires.config` | Tidak | Kunci konfigurasi yang diperlukan          |

## Praktik terbaik

- **Singkat** — instruksikan model tentang _apa_ yang harus dilakukan, bukan bagaimana menjadi AI
- **Keamanan terlebih dahulu** — jika Skill Anda menggunakan `exec`, pastikan prompt tidak memungkinkan injeksi perintah arbitrer dari input yang tidak tepercaya
- **Uji secara lokal** — gunakan `openclaw agent --message "..."` untuk menguji sebelum membagikan
- **Gunakan ClawHub** — telusuri dan kontribusikan Skills di [ClawHub](https://clawhub.ai)

## Di mana Skills berada

| Lokasi                          | Prioritas | Cakupan                |
| ------------------------------- | --------- | ---------------------- |
| `\<workspace\>/skills/`         | Tertinggi | Per agen               |
| `\<workspace\>/.agents/skills/` | Tinggi    | Per agen workspace     |
| `~/.agents/skills/`             | Sedang    | Profil agen bersama    |
| `~/.openclaw/skills/`           | Sedang    | Bersama (semua agen)   |
| Bundled (dikirim dengan OpenClaw) | Rendah  | Global                 |
| `skills.load.extraDirs`         | Terendah  | Folder bersama kustom  |

## Terkait

- [Referensi Skills](/id/tools/skills) — aturan pemuatan, prioritas, dan gating
- [Konfigurasi Skills](/id/tools/skills-config) — skema konfigurasi `skills.*`
- [ClawHub](/id/tools/clawhub) — registry Skill publik
- [Membangun Plugin](/id/plugins/building-plugins) — Plugin dapat menyertakan Skills
