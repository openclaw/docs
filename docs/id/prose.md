---
read_when:
    - Anda ingin menjalankan atau menulis file alur kerja .prose
    - Anda ingin mengaktifkan plugin OpenProse
    - Anda perlu memahami bagaimana OpenProse dipetakan ke primitif OpenClaw
sidebarTitle: OpenProse
summary: OpenProse adalah format alur kerja yang mengutamakan Markdown untuk sesi AI multiagen. Di OpenClaw, OpenProse disertakan sebagai Plugin dengan perintah garis miring `/prose` dan paket skill.
title: OpenProse
x-i18n:
    generated_at: "2026-07-12T14:35:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse adalah format alur kerja portabel yang mengutamakan Markdown untuk mengorkestrasi sesi AI. Di OpenClaw, format ini disertakan sebagai Plugin yang memasang paket Skills OpenProse dan perintah garis miring `/prose`. Program berada dalam berkas `.prose` dan dapat menjalankan beberapa subagen dengan alur kontrol yang eksplisit.

<CardGroup cols={3}>
  <Card title="Instal" icon="download" href="#install">
    Aktifkan Plugin OpenProse dan mulai ulang Gateway.
  </Card>
  <Card title="Jalankan program" icon="play" href="#slash-command">
    Gunakan `/prose run` untuk menjalankan berkas `.prose` atau program jarak jauh.
  </Card>
  <Card title="Tulis program" icon="pencil" href="#example-parallel-research-and-synthesis">
    Susun alur kerja multiagen dengan langkah paralel dan berurutan.
  </Card>
</CardGroup>

## Instal

<Steps>
  <Step title="Aktifkan Plugin">
    OpenProse disertakan, tetapi dinonaktifkan secara default. Aktifkan:

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

    Anda akan melihat `open-prose` telah diaktifkan. Perintah Skills `/prose` kini tersedia di obrolan.

  </Step>
</Steps>

Dari hasil checkout repositori, Anda dapat memasang Plugin secara langsung:
`openclaw plugins install ./extensions/open-prose`

## Perintah garis miring

OpenProse mendaftarkan `/prose` sebagai perintah Skills yang dapat dijalankan oleh pengguna:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` diubah menjadi `https://p.prose.md/<handle>/<slug>`.
URL langsung diambil apa adanya menggunakan alat `web_fetch`.

Eksekusi jarak jauh tingkat teratas bersifat eksplisit. Impor jarak jauh di dalam program `.prose` merupakan dependensi kode transitif: sebelum OpenProse mengambil target `use` jarak jauh apa pun, OpenProse menampilkan daftar impor yang telah diuraikan dan mengharuskan operator membalas persis `approve remote prose imports` untuk eksekusi tersebut.

## Kemampuannya

- Riset dan sintesis multiagen dengan paralelisme eksplisit.
- Alur kerja yang dapat diulang dan aman melalui persetujuan (tinjauan kode, triase insiden, alur pemrosesan konten).
- Program `.prose` yang dapat digunakan kembali dan dijalankan di berbagai runtime agen yang didukung.

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

| Konsep OpenProse           | Alat OpenClaw                                    |
| ------------------------- | ----------------------------------------------- |
| Buat sesi / Alat tugas    | `sessions_spawn`                                |
| Baca / tulis berkas       | `read` / `write`                                |
| Ambil dari web            | `web_fetch` (`exec` + curl saat POST diperlukan) |

<Warning>
  Jika daftar izin alat Anda memblokir `sessions_spawn`, `read`, `write`, atau `web_fetch`, program OpenProse akan gagal. Periksa [konfigurasi daftar izin alat](/id/gateway/config-tools) Anda.
</Warning>

## Lokasi berkas

OpenProse menyimpan status di bawah `.prose/` dalam ruang kerja Anda:

```text
.prose/
├── .env                      # config (key=value), e.g. OPENPROSE_POSTGRES_URL
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose     # copy of the running program
│       ├── state.md          # execution state
│       ├── bindings/
│       ├── imports/          # nested remote program runs
│       └── agents/
└── agents/                   # project-scoped persistent agents
```

Agen persisten tingkat pengguna (digunakan bersama di berbagai proyek) berada di:

```text
~/.prose/agents/
```

## Backend status

<AccordionGroup>
  <Accordion title="sistem berkas (default)">
    Status ditulis ke `.prose/runs/...` di ruang kerja. Tidak memerlukan dependensi tambahan.
  </Accordion>
  <Accordion title="dalam konteks">
    Status sementara disimpan dalam jendela konteks; pilih dengan `--in-context`. Cocok untuk program kecil dan berumur pendek.
  </Accordion>
  <Accordion title="sqlite (eksperimental)">
    Pilih dengan `--state=sqlite`. Memerlukan biner `sqlite3` di `PATH` (beralih kembali ke sistem berkas jika tidak tersedia); status disimpan di `.prose/runs/{id}/state.db`.
  </Accordion>
  <Accordion title="postgres (eksperimental)">
    Pilih dengan `--state=postgres`. Memerlukan `psql` dan string koneksi dalam `OPENPROSE_POSTGRES_URL` (tetapkan di `.prose/.env`).

    <Warning>
      Kredensial Postgres diteruskan ke log subagen. Gunakan basis data khusus dengan hak akses minimum.
    </Warning>

  </Accordion>
</AccordionGroup>

## Keamanan

Perlakukan berkas `.prose` seperti kode. Tinjau sebelum menjalankannya, termasuk impor `use` jarak jauh. Permintaan `/prose run https://...` tingkat teratas bersifat eksplisit, tetapi impor jarak jauh transitif memerlukan persetujuan untuk setiap eksekusi sebelum diambil atau dijalankan. Gunakan daftar izin alat dan gerbang persetujuan OpenClaw untuk mengendalikan efek samping. Untuk alur kerja deterministik dengan gerbang persetujuan, bandingkan dengan [Lobster](/id/tools/lobster).

## Terkait

<CardGroup cols={2}>
  <Card title="Referensi Skills" href="/id/tools/skills" icon="puzzle-piece">
    Cara paket Skills OpenProse dimuat dan gerbang yang berlaku.
  </Card>
  <Card title="Subagen" href="/id/tools/subagents" icon="users">
    Lapisan koordinasi multiagen bawaan OpenClaw.
  </Card>
  <Card title="Teks ke suara" href="/id/tools/tts" icon="volume-high">
    Tambahkan keluaran audio ke alur kerja Anda.
  </Card>
  <Card title="Perintah garis miring" href="/id/tools/slash-commands" icon="terminal">
    Semua perintah obrolan yang tersedia, termasuk /prose.
  </Card>
</CardGroup>

Situs resmi: [https://www.prose.md](https://www.prose.md)
