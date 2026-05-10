---
read_when:
    - Anda sedang membuat keterampilan kustom baru di ruang kerja Anda
    - Anda memerlukan alur kerja awal yang cepat untuk Skills berbasis SKILL.md
summary: Bangun dan uji Skills ruang kerja kustom dengan SKILL.md
title: Membuat Skills
x-i18n:
    generated_at: "2026-05-10T19:54:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: a468a0b21f4e43542b175b8acb8ad8b19dbbea06ce8e0b97c48206bf88a661c5
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills mengajarkan agen bagaimana dan kapan menggunakan alat. Setiap skill adalah sebuah direktori
yang berisi file `SKILL.md` dengan frontmatter YAML dan instruksi markdown.

Untuk cara Skills dimuat dan diprioritaskan, lihat [Skills](/id/tools/skills).

## Buat skill pertama Anda

<Steps>
  <Step title="Create the skill directory">
    Skills berada di workspace Anda. Buat folder baru:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Write SKILL.md">
    Buat `SKILL.md` di dalam direktori tersebut. Frontmatter mendefinisikan metadata,
    dan isi markdown berisi instruksi untuk agen.

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
    skill. Pastikan nama folder dan `name` frontmatter selaras.

  </Step>

  <Step title="Add tools (optional)">
    Anda dapat mendefinisikan skema alat kustom di frontmatter atau menginstruksikan agen
    untuk menggunakan alat sistem yang sudah ada (seperti `exec` atau `browser`). Skills juga dapat
    dikirimkan di dalam plugin bersama alat yang didokumentasikannya.

  </Step>

  <Step title="Load the skill">
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

  <Step title="Test it">
    Kirim pesan yang seharusnya memicu skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Atau cukup mengobrol dengan agen dan meminta sapaan.

  </Step>
</Steps>

## Referensi metadata skill

Frontmatter YAML mendukung bidang berikut:

| Bidang                              | Wajib | Deskripsi                                                       |
| ----------------------------------- | ----- | --------------------------------------------------------------- |
| `name`                              | Ya    | Pengidentifikasi unik menggunakan huruf kecil, digit, dan tanda hubung |
| `description`                       | Ya    | Deskripsi satu baris yang ditampilkan kepada agen               |
| `metadata.openclaw.os`              | Tidak | Filter OS (`["darwin"]`, `["linux"]`, dll.)                     |
| `metadata.openclaw.requires.bins`   | Tidak | Biner wajib di PATH                                             |
| `metadata.openclaw.requires.config` | Tidak | Kunci konfigurasi wajib                                         |

## Praktik terbaik

- **Ringkas** — instruksikan model tentang _apa_ yang harus dilakukan, bukan cara menjadi AI
- **Keselamatan terlebih dahulu** — jika skill Anda menggunakan `exec`, pastikan prompt tidak mengizinkan injeksi perintah arbitrer dari input yang tidak tepercaya
- **Uji secara lokal** — gunakan `openclaw agent --message "..."` untuk menguji sebelum berbagi
- **Gunakan ClawHub** — jelajahi dan kontribusikan skills di [ClawHub](https://clawhub.ai)

## Lokasi Skills

| Lokasi                          | Prioritas | Cakupan               |
| ------------------------------- | --------- | --------------------- |
| `\<workspace\>/skills/`         | Tertinggi | Per agen              |
| `\<workspace\>/.agents/skills/` | Tinggi    | Agen per workspace    |
| `~/.agents/skills/`             | Sedang    | Profil agen bersama   |
| `~/.openclaw/skills/`           | Sedang    | Bersama (semua agen)  |
| Terbundel (dikirimkan bersama OpenClaw) | Rendah | Global                |
| `skills.load.extraDirs`         | Terendah  | Folder bersama kustom |

## Terkait

- [Referensi Skills](/id/tools/skills) — pemuatan, prioritas, dan aturan gating
- [Konfigurasi Skills](/id/tools/skills-config) — skema konfigurasi `skills.*`
- [ClawHub](/id/clawhub) — registri skill publik
- [Membangun Plugin](/id/plugins/building-plugins) — plugin dapat mengirimkan skills
