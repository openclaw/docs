---
read_when:
    - Tam CLI ilk katılımını kullanmadan ilk çalıştırma kurulumunu yapıyorsunuz
    - Varsayılan çalışma alanı yolunu ayarlamak istiyorsunuz
summary: '`openclaw setup` için CLI başvurusu (yapılandırmayı + çalışma alanını başlatma)'
title: Kurulum
x-i18n:
    generated_at: "2026-04-24T09:03:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 650b0faf99ef1bc24ec6514661093a9a2ba7edead2e2622b863d51553c44f267
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

`~/.openclaw/openclaw.json` ve aracı çalışma alanını başlatın.

İlgili:

- Başlangıç: [Başlangıç](/tr/start/getting-started)
- CLI ilk katılımı: [İlk katılım (CLI)](/tr/start/wizard)

## Örnekler

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Seçenekler

- `--workspace <dir>`: aracı çalışma alanı dizini (`agents.defaults.workspace` olarak saklanır)
- `--wizard`: ilk katılımı çalıştır
- `--non-interactive`: ilk katılımı istemler olmadan çalıştır
- `--mode <local|remote>`: ilk katılım modu
- `--remote-url <url>`: uzak Gateway WebSocket URL'si
- `--remote-token <token>`: uzak Gateway belirteci

Kurulum üzerinden ilk katılımı çalıştırmak için:

```bash
openclaw setup --wizard
```

Notlar:

- Düz `openclaw setup`, tam ilk katılım akışı olmadan yapılandırma + çalışma alanını başlatır.
- Herhangi bir ilk katılım bayrağı mevcut olduğunda ilk katılım otomatik çalışır (`--wizard`, `--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).

## İlgili

- [CLI başvurusu](/tr/cli)
- [Kurulum genel bakışı](/tr/install)
