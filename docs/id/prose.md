---
read_when:
    - Anda ingin menjalankan atau menulis alur kerja `.prose`
    - Anda ingin mengaktifkan plugin OpenProse
    - Anda perlu memahami penyimpanan state
summary: 'OpenProse: alur kerja `.prose`, slash command, dan state di OpenClaw'
title: OpenProse
x-i18n:
    generated_at: "2026-04-05T14:02:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95f86ed3029c5599b6a6bed1f75b2e10c8808cf7ffa5e33dbfb1801a7f65f405
    source_path: prose.md
    workflow: 15
---

# OpenProse

OpenProse adalah format alur kerja portabel yang mengutamakan markdown untuk mengorkestrasi sesi AI. Di OpenClaw, OpenProse dikirim sebagai plugin yang memasang paket skill OpenProse plus slash command `/prose`. Program berada di file `.prose` dan dapat memunculkan beberapa sub-agen dengan alur kontrol eksplisit.

Situs resmi: [https://www.prose.md](https://www.prose.md)

## Yang dapat dilakukan

- Riset + sintesis multi-agen dengan paralelisme eksplisit.
- Alur kerja yang dapat diulang dan aman terhadap persetujuan (review kode, triase insiden, pipeline konten).
- Program `.prose` yang dapat digunakan ulang dan dijalankan di berbagai runtime agen yang didukung.

## Pasang + aktifkan

Plugin bawaan dinonaktifkan secara default. Aktifkan OpenProse:

```bash
openclaw plugins enable open-prose
```

Mulai ulang Gateway setelah mengaktifkan plugin.

Checkout dev/lokal: `openclaw plugins install ./path/to/local/open-prose-plugin`

Dokumentasi terkait: [Plugins](/tools/plugin), [manifest plugin](/plugins/manifest), [Skills](/tools/skills).

## Slash command

OpenProse mendaftarkan `/prose` sebagai perintah skill yang dapat dipanggil pengguna. Perintah ini dirutekan ke instruksi VM OpenProse dan menggunakan tool OpenClaw di balik layar.

Perintah umum:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## Contoh: file `.prose` sederhana

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

## Lokasi file

OpenProse menyimpan state di bawah `.prose/` dalam workspace Anda:

```
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

```
~/.prose/agents/
```

## Mode state

OpenProse mendukung beberapa backend state:

- **filesystem** (default): `.prose/runs/...`
- **in-context**: sementara, untuk program kecil
- **sqlite** (eksperimental): memerlukan biner `sqlite3`
- **postgres** (eksperimental): memerlukan `psql` dan connection string

Catatan:

- sqlite/postgres bersifat opt-in dan eksperimental.
- Kredensial postgres mengalir ke log subagent; gunakan DB khusus dengan hak minimum.

## Program remote

`/prose run <handle/slug>` di-resolve ke `https://p.prose.md/<handle>/<slug>`.
URL langsung di-fetch apa adanya. Ini menggunakan tool `web_fetch` (atau `exec` untuk POST).

## Pemetaan runtime OpenClaw

Program OpenProse dipetakan ke primitif OpenClaw:

| Konsep OpenProse          | Tool OpenClaw    |
| ------------------------- | ---------------- |
| Memunculkan sesi / Task tool | `sessions_spawn` |
| Baca/tulis file           | `read` / `write` |
| Web fetch                 | `web_fetch`      |

Jika allowlist tool Anda memblokir tool tersebut, program OpenProse akan gagal. Lihat [konfigurasi Skills](/tools/skills-config).

## Keamanan + persetujuan

Perlakukan file `.prose` seperti kode. Tinjau sebelum menjalankan. Gunakan allowlist tool dan gerbang persetujuan OpenClaw untuk mengontrol efek samping.

Untuk alur kerja deterministik dengan gerbang persetujuan, bandingkan dengan [Lobster](/tools/lobster).
