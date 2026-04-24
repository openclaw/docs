---
read_when:
    - zsh/bash/fish/PowerShell için kabuk tamamlamaları istiyorsunuz
    - Tamamlama betiklerini OpenClaw durumu altında önbelleğe almanız gerekiyor
summary: '`openclaw completion` için CLI başvurusu (kabuk tamamlama betiklerini oluşturma/yükleme)'
title: Tamamlama
x-i18n:
    generated_at: "2026-04-24T09:01:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d064723b97f09105154197e4ef35b98ccb61e4b775f3fd990b18958f751f713
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
- `-i, --install`: kabuk profilinize bir source satırı ekleyerek tamamlamayı yükle
- `--write-state`: tamamlama betiklerini stdout'a yazdırmadan `$OPENCLAW_STATE_DIR/completions` içine yaz
- `-y, --yes`: yükleme onay istemlerini atla

## Notlar

- `--install`, kabuk profilinize küçük bir "OpenClaw Completion" bloğu yazar ve bunu önbelleğe alınmış betiğe yönlendirir.
- `--install` veya `--write-state` olmadan komut betiği stdout'a yazdırır.
- Tamamlama oluşturma, iç içe alt komutların dahil edilmesi için komut ağaçlarını eager olarak yükler.

## İlgili

- [CLI başvurusu](/tr/cli)
