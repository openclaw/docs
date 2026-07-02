---
read_when:
    - Claude Code'un OpenClaw Gateway MCP araçlarını kullanmasını istiyorsunuz
    - Geçici, oturuma bağlı bir MCP iznine ihtiyacınız var
summary: '`openclaw attach` için CLI referansı (Claude Code’u kapsamı belirlenmiş bir Gateway MCP izniyle başlatma)'
title: CLI'yi bağla
x-i18n:
    generated_at: "2026-07-02T01:11:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1445c9bbf28e5365d070f69bf8f53e249d70ac6e8690ed68831404d041e41e86
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach`, tek bir Gateway oturumuna bağlı katı bir geçici MCP yapılandırmasıyla Claude Code'u başlatır.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Seçenekler:

- `--session <key>` izni bir Gateway oturumuna bağlar. Varsayılan olarak ana oturumu kullanır.
- `--ttl <ms>` milisaniye cinsinden pozitif bir izin TTL'si ister. Gateway kendi üst sınırını uygular.
- `--bin <path>` Claude Code ikilisini seçer. Varsayılan değer `claude` şeklindedir.
- `--print-config` geçici `.mcp.json` dosyasını yazar, başlatma komutunu ve env değerlerini yazdırır ve izni TTL süresi dolana kadar etkin bırakır.

Taşıyıcı token, argv üzerinden değil ortam değişkenleri üzerinden aktarılır. OpenClaw, Claude Code'u `--strict-mcp-config --mcp-config <path>` ile başlatır; böylece ortamdaki Claude MCP sunucuları ekli oturuma katılmaz. Normal başlatmalar, Claude Code süreci çıktığında izni iptal eder.

Ayrıca bkz.: [Gateway CLI](/tr/cli/gateway), [MCP CLI](/tr/cli/mcp) ve [ACP CLI](/tr/cli/acp).
