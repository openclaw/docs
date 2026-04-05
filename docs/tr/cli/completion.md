---
read_when:
    - zsh/bash/fish/PowerShell için kabuk tamamlamaları istiyorsunuz
    - Tamamlama betiklerini OpenClaw durumu altında önbelleğe almanız gerekiyor
summary: '`openclaw completion` için CLI referansı (kabuk tamamlama betiklerini oluşturma/yükleme)'
title: completion
x-i18n:
    generated_at: "2026-04-05T13:47:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7bbf140a880bafdb7140149f85465d66d0d46e5a3da6a1e41fb78be2fd2bd4d0
    source_path: cli/completion.md
    workflow: 15
---

# `openclaw completion`

Kabuk tamamlama betiklerini oluşturun ve isteğe bağlı olarak bunları kabuk profilinize yükleyin.

## Kullanım

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## Seçenekler

- `-s, --shell <shell>`: kabuk hedefi (`zsh`, `bash`, `powershell`, `fish`; varsayılan: `zsh`)
- `-i, --install`: kabuk profilinize bir source satırı ekleyerek tamamlamayı yükler
- `--write-state`: tamamlama betiklerini stdout'a yazdırmadan `$OPENCLAW_STATE_DIR/completions` içine yazar
- `-y, --yes`: yükleme onay istemlerini atlar

## Notlar

- `--install`, kabuk profilinize küçük bir "OpenClaw Completion" bloğu yazar ve bunu önbelleğe alınmış betiğe yönlendirir.
- `--install` veya `--write-state` olmadan komut betiği stdout'a yazdırır.
- Tamamlama oluşturma işlemi iç içe alt komutların dahil edilmesi için komut ağaçlarını eager olarak yükler.
