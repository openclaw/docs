---
read_when:
    - Anda ingin menjalankan atau menulis file workflow .prose
    - Anda ingin mengaktifkan plugin OpenProse
    - Anda perlu memahami bagaimana OpenProse dipetakan ke primitif OpenClaw
sidebarTitle: OpenProse
summary: OpenProse adalah format alur kerja yang mengutamakan markdown untuk sesi AI multi-agen. Di OpenClaw, format ini dikirimkan sebagai plugin dengan perintah slash /prose dan paket skill.
title: OpenProse
x-i18n:
    generated_at: "2026-06-27T18:01:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde819215f99055c2a83ec32ed6e0700994654ca2d1d9c9dda98b71545f8a012
    source_path: prose.md
    workflow: 16
---

OpenProse adalah format alur kerja portabel yang mengutamakan Markdown untuk mengorkestrasi sesi AI. Di OpenClaw, format ini dikirim sebagai Plugin yang menginstal paket Skills OpenProse dan perintah slash `/prose`. Program berada dalam file `.prose` dan dapat menjalankan beberapa sub-agen dengan alur kontrol eksplisit.

<CardGroup cols={3}>
  <Card title="Instal" icon="download" href="#install">
    Aktifkan Plugin OpenProse dan mulai ulang Gateway.
  </Card>
  <Card title="Jalankan program" icon="play" href="#slash-command">
    Gunakan `/prose run` untuk mengeksekusi file `.prose` atau program jarak jauh.
  </Card>
  <Card title="Tulis program" icon="pencil" href="#example">
    Tulis alur kerja multi-agen dengan langkah paralel dan berurutan.
  </Card>
</CardGroup>

## Instal

<Steps>
  <Step title="Aktifkan Plugin">
    Plugin bawaan dinonaktifkan secara default. Aktifkan OpenProse:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Mulai ulang Gateway">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="Verifikasi">
    ```bash
    openclaw plugins list | grep prose
    ```

    Anda seharusnya melihat `open-prose` dalam keadaan aktif. Perintah Skills `/prose` kini tersedia di chat.

  </Step>
</Steps>

Untuk checkout lokal: `openclaw plugins install ./path/to/local/open-prose-plugin`

## Perintah slash

OpenProse mendaftarkan `/prose` sebagai perintah Skills yang dapat dipanggil pengguna:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` diselesaikan menjadi `https://p.prose.md/<handle>/<slug>`. URL langsung diambil apa adanya menggunakan alat `web_fetch`.

Eksekusi jarak jauh tingkat atas bersifat eksplisit. Impor jarak jauh di dalam program `.prose` adalah dependensi kode transitif: sebelum OpenProse mengambil target `use` jarak jauh apa pun, OpenProse menampilkan daftar impor yang telah diselesaikan dan mewajibkan operator membalas persis `approve remote prose imports` untuk eksekusi tersebut.

## Yang dapat dilakukan

- Riset dan sintesis multi-agen dengan paralelisme eksplisit.
- Alur kerja yang dapat diulang dan aman melalui persetujuan (tinjauan kode, triase insiden, pipeline konten).
- Program `.prose` yang dapat digunakan ulang dan dijalankan di berbagai runtime agen yang didukung.

## Contoh: riset dan sintesis paralel

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
context: { findings, draft }
```

## Pemetaan runtime OpenClaw

Program OpenProse dipetakan ke primitif OpenClaw:

| Konsep OpenProse         | Alat OpenClaw    |
| ------------------------- | ---------------- |
| Spawn session / Task tool | `sessions_spawn` |
| File read / write         | `read` / `write` |
| Web fetch                 | `web_fetch`      |

<Warning>
  Jika daftar izin alat Anda memblokir `sessions_spawn`, `read`, `write`, atau `web_fetch`, program OpenProse akan gagal. Periksa [konfigurasi daftar izin alat](/id/gateway/config-tools) Anda.
</Warning>

## Lokasi file

OpenProse menyimpan status di bawah `.prose/` dalam workspace Anda:

```text
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

Agen persisten tingkat pengguna berada di:

```text
~/.prose/agents/
```

## Backend status

<AccordionGroup>
  <Accordion title="filesystem (default)">
    Status ditulis ke `.prose/runs/...` di workspace. Tidak memerlukan dependensi tambahan.
  </Accordion>
  <Accordion title="in-context">
    Status sementara disimpan di jendela konteks. Cocok untuk program kecil dan berumur pendek.
  </Accordion>
  <Accordion title="sqlite (experimental)">
    Memerlukan biner `sqlite3` di `PATH`.
  </Accordion>
  <Accordion title="postgres (experimental)">
    Memerlukan `psql` dan string koneksi.

    <Warning>
      Kredensial Postgres mengalir ke log sub-agen. Gunakan basis data khusus dengan hak akses paling rendah.
    </Warning>

  </Accordion>
</AccordionGroup>

## Keamanan

Perlakukan file `.prose` seperti kode. Tinjau sebelum dijalankan, termasuk impor `use` jarak jauh. Permintaan tingkat atas `/prose run https://...` bersifat eksplisit, tetapi impor jarak jauh transitif memerlukan persetujuan per eksekusi sebelum diambil atau dieksekusi. Gunakan daftar izin alat dan gerbang persetujuan OpenClaw untuk mengendalikan efek samping. Untuk alur kerja deterministik dengan gerbang persetujuan, bandingkan dengan [Lobster](/id/tools/lobster).

## Terkait

<CardGroup cols={2}>
  <Card title="Referensi Skills" href="/id/tools/skills" icon="puzzle-piece">
    Cara paket Skills OpenProse dimuat dan gerbang apa yang berlaku.
  </Card>
  <Card title="Subagen" href="/id/tools/subagents" icon="users">
    Lapisan koordinasi multi-agen native OpenClaw.
  </Card>
  <Card title="Text-to-speech" href="/id/tools/tts" icon="volume-high">
    Tambahkan keluaran audio ke alur kerja Anda.
  </Card>
  <Card title="Perintah slash" href="/id/tools/slash-commands" icon="terminal">
    Semua perintah chat yang tersedia, termasuk /prose.
  </Card>
</CardGroup>

Situs resmi: [https://www.prose.md](https://www.prose.md)
