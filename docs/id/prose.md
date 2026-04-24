---
read_when:
    - Anda ingin menjalankan atau menulis alur kerja `.prose`
    - Anda ingin mengaktifkan Plugin OpenProse
    - Anda perlu memahami penyimpanan status
summary: 'OpenProse: alur kerja `.prose`, perintah slash, dan status di OpenClaw'
title: OpenProse
x-i18n:
    generated_at: "2026-04-24T09:21:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1d6f3aa64c403daedaeaa2d7934b8474c0756fe09eed09efd1efeef62413e9e
    source_path: prose.md
    workflow: 15
---

OpenProse adalah format alur kerja portable dan markdown-first untuk mengorkestrasi sesi AI. Di OpenClaw, OpenProse dikirim sebagai Plugin yang menginstal paket skill OpenProse plus perintah slash `/prose`. Program berada dalam file `.prose` dan dapat men-spawn beberapa sub-agen dengan alur kontrol yang eksplisit.

Situs resmi: [https://www.prose.md](https://www.prose.md)

## Apa yang dapat dilakukan

- Riset + sintesis multi-agen dengan paralelisme yang eksplisit.
- Alur kerja berulang yang aman-persetujuan (code review, triase insiden, pipeline konten).
- Program `.prose` yang dapat digunakan ulang dan dijalankan di runtime agen yang didukung.

## Instal + aktifkan

Plugin bawaan nonaktif secara default. Aktifkan OpenProse:

```bash
openclaw plugins enable open-prose
```

Mulai ulang Gateway setelah mengaktifkan Plugin.

Checkout dev/lokal: `openclaw plugins install ./path/to/local/open-prose-plugin`

Dokumentasi terkait: [Plugins](/id/tools/plugin), [Manifest Plugin](/id/plugins/manifest), [Skills](/id/tools/skills).

## Perintah slash

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
# Riset + sintesis dengan dua agen berjalan paralel.

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

OpenProse menyimpan status di bawah `.prose/` dalam workspace Anda:

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

## Mode status

OpenProse mendukung beberapa backend status:

- **filesystem** (default): `.prose/runs/...`
- **in-context**: sementara, untuk program kecil
- **sqlite** (eksperimental): memerlukan binary `sqlite3`
- **postgres** (eksperimental): memerlukan `psql` dan connection string

Catatan:

- sqlite/postgres bersifat opt-in dan eksperimental.
- Kredensial postgres mengalir ke log subagen; gunakan DB khusus dengan hak minimum yang diperlukan.

## Program remote

`/prose run <handle/slug>` diselesaikan ke `https://p.prose.md/<handle>/<slug>`.
URL langsung diambil apa adanya. Ini menggunakan tool `web_fetch` (atau `exec` untuk POST).

## Pemetaan runtime OpenClaw

Program OpenProse dipetakan ke primitif OpenClaw:

| Konsep OpenProse           | Tool OpenClaw    |
| -------------------------- | ---------------- |
| Spawn session / Task tool  | `sessions_spawn` |
| File read/write            | `read` / `write` |
| Web fetch                  | `web_fetch`      |

Jika allowlist tool Anda memblokir tool-tool ini, program OpenProse akan gagal. Lihat [Konfigurasi Skills](/id/tools/skills-config).

## Keamanan + persetujuan

Perlakukan file `.prose` seperti kode. Tinjau sebelum dijalankan. Gunakan allowlist tool dan gerbang persetujuan OpenClaw untuk mengendalikan efek samping.

Untuk alur kerja deterministik dengan gerbang persetujuan, bandingkan dengan [Lobster](/id/tools/lobster).

## Terkait

- [Text-to-speech](/id/tools/tts)
- [Pemformatan Markdown](/id/concepts/markdown-formatting)
