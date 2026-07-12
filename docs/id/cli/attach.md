---
read_when:
    - Anda ingin Claude Code menggunakan alat MCP Gateway OpenClaw
    - Anda memerlukan izin MCP sementara yang terikat pada sesi untuk harness eksternal
summary: Referensi CLI untuk `openclaw attach` (jalankan Claude Code dengan pemberian akses MCP Gateway yang terbatas cakupannya)
title: Lampirkan CLI
x-i18n:
    generated_at: "2026-07-12T14:04:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0d8ac60724adef1439af09179806af537b8f2925f06b3715850e4dd3b83b080f
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` menjalankan Claude Code dengan konfigurasi MCP sementara yang ketat dan terikat pada satu sesi Gateway.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Opsi:

- `--session <key>` mengikat pemberian akses ke sesi Gateway. Nilai bawaannya adalah sesi utama.
- `--ttl <ms>` meminta TTL pemberian akses bernilai positif dalam milidetik. Gateway menerapkan batas maksimumnya sendiri.
- `--bin <path>` memilih biner Claude Code. Nilai bawaan: `claude`.
- `--print-config` menulis `.mcp.json` sementara, mencetak perintah peluncuran dan variabel lingkungan, serta membiarkan pemberian akses tetap aktif hingga TTL berakhir (opsi ini tidak menjalankan Claude Code atau mencabut pemberian akses).

Token bearer diteruskan melalui variabel lingkungan, bukan argv. OpenClaw menjalankan Claude Code dengan `--strict-mcp-config --mcp-config <path>` agar server MCP Claude dari lingkungan sekitar tidak bergabung ke sesi yang dilampirkan. Peluncuran normal (tanpa `--print-config`) mencabut pemberian akses saat proses Claude Code berakhir.

Lihat juga: [CLI Gateway](/id/cli/gateway), [CLI MCP](/id/cli/mcp), dan [CLI ACP](/id/cli/acp).
