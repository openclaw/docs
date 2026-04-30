---
read_when:
    - Anda sedang membuat skill kustom baru di ruang kerja Anda
    - Anda membutuhkan alur kerja awal yang cepat untuk Skills berbasis SKILL.md
summary: Buat dan uji Skills ruang kerja kustom dengan SKILL.md
title: Membuat Skills
x-i18n:
    generated_at: "2026-04-30T10:14:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201718f4088f4243b0dabe12fb4fce4b8a7e64df9a4b7d651356ab4ae0dd3579
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills mengajari agen bagaimana dan kapan menggunakan alat. Setiap skill adalah sebuah direktori
yang berisi file `SKILL.md` dengan frontmatter YAML dan instruksi markdown.

Untuk cara skills dimuat dan diprioritaskan, lihat [Skills](/id/tools/skills).

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
    dan isi markdown memuat instruksi untuk agen.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

    Gunakan hyphen-case dengan huruf kecil, digit, dan tanda hubung untuk `name`
    skill. Jaga agar nama folder dan `name` frontmatter tetap selaras.

  </Step>

  <Step title="Tambahkan alat (opsional)">
    Anda dapat mendefinisikan skema alat khusus di frontmatter atau menginstruksikan agen
    untuk menggunakan alat sistem yang sudah ada (seperti `exec` atau `browser`). Skills juga dapat
    dikirim di dalam plugin bersama alat yang didokumentasikannya.

  </Step>

  <Step title="Muat skill">
    Mulai sesi baru agar OpenClaw mengambil skill tersebut:

    ```bash
    # From chat
    /new

    # Or restart the gateway
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

    Atau cukup mengobrol dengan agen dan minta sapaan.

  </Step>
</Steps>

## Referensi metadata skill

Frontmatter YAML mendukung bidang berikut:

| Bidang                              | Wajib | Deskripsi                                                      |
| ----------------------------------- | ----- | -------------------------------------------------------------- |
| `name`                              | Ya    | Pengidentifikasi unik menggunakan huruf kecil, digit, dan tanda hubung |
| `description`                       | Ya    | Deskripsi satu baris yang ditampilkan kepada agen              |
| `metadata.openclaw.os`              | Tidak | Filter OS (`["darwin"]`, `["linux"]`, dll.)                    |
| `metadata.openclaw.requires.bins`   | Tidak | Biner wajib di PATH                                            |
| `metadata.openclaw.requires.config` | Tidak | Kunci konfigurasi wajib                                        |

## Praktik terbaik

- **Ringkas** — instruksikan model tentang _apa_ yang harus dilakukan, bukan bagaimana menjadi AI
- **Utamakan keamanan** — jika skill Anda menggunakan `exec`, pastikan prompt tidak mengizinkan injeksi perintah arbitrer dari input yang tidak tepercaya
- **Uji secara lokal** — gunakan `openclaw agent --message "..."` untuk menguji sebelum membagikan
- **Gunakan ClawHub** — jelajahi dan kontribusikan skills di [ClawHub](https://clawhub.ai)

## Tempat skills berada

| Lokasi                          | Prioritas | Cakupan               |
| ------------------------------- | --------- | --------------------- |
| `\<workspace\>/skills/`         | Tertinggi | Per agen              |
| `\<workspace\>/.agents/skills/` | Tinggi    | Agen per workspace    |
| `~/.agents/skills/`             | Sedang    | Profil agen bersama   |
| `~/.openclaw/skills/`           | Sedang    | Bersama (semua agen)  |
| Bundled (dikirim bersama OpenClaw) | Rendah | Global                |
| `skills.load.extraDirs`         | Terendah  | Folder bersama khusus |

## Terkait

- [Referensi Skills](/id/tools/skills) — aturan pemuatan, prioritas, dan gating
- [Konfigurasi Skills](/id/tools/skills-config) — skema konfigurasi `skills.*`
- [ClawHub](/id/tools/clawhub) — registry skill publik
- [Membangun Plugins](/id/plugins/building-plugins) — plugins dapat mengirim skills
