---
read_when:
    - Tam CLI başlangıç yönlendirmesi olmadan ilk çalıştırma kurulumunu yapıyorsunuz
    - Varsayılan çalışma alanı yolunu ayarlamak istiyorsunuz
summary: 'CLI referansı: `openclaw setup` (yapılandırmayı + çalışma alanını başlat)'
title: Kurulum
x-i18n:
    generated_at: "2026-04-30T09:14:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68e5c07a6b1769420c2125677f3eda9bd4841c938b4fc62583c5bed2a2596250
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`~/.openclaw/openclaw.json` dosyasını ve aracı çalışma alanını başlatın.

İlgili:

- Başlarken: [Başlarken](/tr/start/getting-started)
- CLI ilk kurulumu: [İlk kurulum (CLI)](/tr/start/wizard)

## Örnekler

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Seçenekler

- `--workspace <dir>`: aracı çalışma alanı dizini (`agents.defaults.workspace` olarak saklanır)
- `--wizard`: ilk kurulumu çalıştır
- `--non-interactive`: ilk kurulumu istemler olmadan çalıştır
- `--mode <local|remote>`: ilk kurulum modu
- `--import-from <provider>`: ilk kurulum sırasında çalıştırılacak geçiş sağlayıcısı
- `--import-source <path>`: `--import-from` için kaynak aracı ana dizini
- `--import-secrets`: ilk kurulum geçişi sırasında desteklenen gizli bilgileri içe aktar
- `--remote-url <url>`: uzak Gateway WebSocket URL’si
- `--remote-token <token>`: uzak Gateway token’ı

İlk kurulumu setup üzerinden çalıştırmak için:

```bash
openclaw setup --wizard
```

Notlar:

- Düz `openclaw setup`, tam ilk kurulum akışı olmadan yapılandırmayı ve çalışma alanını başlatır.
- Herhangi bir ilk kurulum bayrağı mevcut olduğunda ilk kurulum otomatik çalışır (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Hermes durumu algılanırsa etkileşimli ilk kurulum otomatik olarak geçiş önerebilir. İçe aktarmalı ilk kurulum yeni bir setup gerektirir; ilk kurulum dışında deneme çalıştırması planları, yedeklemeler ve üzerine yazma modu için [Geçiş](/tr/cli/migrate) sayfasını kullanın.

## İlgili

- [CLI referansı](/tr/cli)
- [Kurulum genel bakışı](/tr/install)
