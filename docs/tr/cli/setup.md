---
read_when:
    - Tam CLI ilk kurulum olmadan ilk çalıştırma kurulumunu yapıyorsunuz
    - Varsayılan çalışma alanı yolunu ayarlamak istiyorsunuz
summary: '`openclaw setup` için CLI başvurusu (yapılandırma + çalışma alanını başlatma)'
title: setup
x-i18n:
    generated_at: "2026-04-05T13:49:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: f538aac341c749043ad959e35f2ed99c844ab8c3500ff59aa159d940bd301792
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

`~/.openclaw/openclaw.json` ve agent çalışma alanını başlatın.

İlgili:

- Başlarken: [Getting started](/start/getting-started)
- CLI ilk kurulumu: [Onboarding (CLI)](/start/wizard)

## Örnekler

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Seçenekler

- `--workspace <dir>`: agent çalışma alanı dizini (`agents.defaults.workspace` olarak depolanır)
- `--wizard`: ilk kurulumu çalıştır
- `--non-interactive`: ilk kurulumu istemler olmadan çalıştır
- `--mode <local|remote>`: ilk kurulum modu
- `--remote-url <url>`: uzak Gateway WebSocket URL'si
- `--remote-token <token>`: uzak Gateway token'ı

`setup` üzerinden ilk kurulumu çalıştırmak için:

```bash
openclaw setup --wizard
```

Notlar:

- Düz `openclaw setup`, tam ilk kurulum akışı olmadan yapılandırma + çalışma alanını başlatır.
- Herhangi bir ilk kurulum bayrağı mevcut olduğunda ilk kurulum otomatik çalışır (`--wizard`, `--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).
