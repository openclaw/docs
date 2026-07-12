---
read_when:
    - Claude Code'un OpenClaw Gateway MCP araçlarını kullanmasını istiyorsunuz
    - Harici bir test düzeneği için oturuma bağlı geçici bir MCP iznine ihtiyacınız var
summary: '`openclaw attach` için CLI başvurusu (Claude Code''u kapsamı belirlenmiş bir Gateway MCP izniyle başlatma)'
title: CLI'yi Bağlama
x-i18n:
    generated_at: "2026-07-12T12:09:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0d8ac60724adef1439af09179806af537b8f2925f06b3715850e4dd3b83b080f
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach`, tek bir Gateway oturumuna bağlı, katı bir geçici MCP yapılandırmasıyla Claude Code'u başlatır.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Seçenekler:

- `--session <key>`, izni bir Gateway oturumuna bağlar. Varsayılan olarak ana oturumu kullanır.
- `--ttl <ms>`, milisaniye cinsinden pozitif bir izin TTL'si talep eder. Gateway kendi üst sınırını uygular.
- `--bin <path>`, Claude Code ikili dosyasını seçer. Varsayılan: `claude`.
- `--print-config`, geçici `.mcp.json` dosyasını yazar, başlatma komutunu ve ortam değişkenlerini görüntüler ve izni TTL süresi dolana kadar etkin bırakır (Claude Code'u başlatmaz veya izni iptal etmez).

Bearer token, argv üzerinden değil, ortam değişkenleri aracılığıyla iletilir. OpenClaw, ortamdaki Claude MCP sunucularının eklenen oturuma katılmaması için Claude Code'u `--strict-mcp-config --mcp-config <path>` ile başlatır. Normal başlatmalar (`--print-config` olmadan), Claude Code işlemi sonlandığında izni iptal eder.

Ayrıca bkz.: [Gateway CLI](/tr/cli/gateway), [MCP CLI](/tr/cli/mcp) ve [ACP CLI](/tr/cli/acp).
