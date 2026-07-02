---
read_when:
    - Anda ingin Claude Code menggunakan alat MCP OpenClaw Gateway
    - Anda memerlukan izin MCP sementara yang terikat sesi untuk harness eksternal
summary: Referensi CLI untuk `openclaw attach` (meluncurkan Claude Code dengan pemberian izin MCP Gateway bercakupan terbatas)
title: Lampirkan CLI
x-i18n:
    generated_at: "2026-07-02T01:16:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1445c9bbf28e5365d070f69bf8f53e249d70ac6e8690ed68831404d041e41e86
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` meluncurkan Claude Code dengan konfigurasi MCP sementara yang ketat dan terikat
ke satu sesi Gateway.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Opsi:

- `--session <key>` mengikat grant ke sesi Gateway. Default-nya adalah sesi utama.
- `--ttl <ms>` meminta TTL grant positif dalam milidetik. Gateway menerapkan batas atasnya sendiri.
- `--bin <path>` memilih binary Claude Code. Default-nya adalah `claude`.
- `--print-config` menulis `.mcp.json` sementara, mencetak perintah peluncuran dan env, serta membiarkan grant tetap aktif hingga TTL berakhir.

Token bearer diteruskan melalui variabel lingkungan, bukan argv. OpenClaw
meluncurkan Claude Code dengan `--strict-mcp-config --mcp-config <path>` sehingga server
Claude MCP ambient tidak bergabung ke sesi yang dilampirkan. Peluncuran normal mencabut
grant saat proses Claude Code keluar.

Lihat juga: [CLI Gateway](/id/cli/gateway), [CLI MCP](/id/cli/mcp), dan [CLI ACP](/id/cli/acp).
