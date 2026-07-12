---
read_when:
    - zsh/bash/fish/PowerShell için kabuk otomatik tamamlamaları istiyorsunuz
    - Tamamlama betiklerini OpenClaw durumunda önbelleğe almanız gerekir
summary: '`openclaw completion` için CLI referansı (kabuk tamamlama betiklerini oluşturma/yükleme)'
title: Tamamlama
x-i18n:
    generated_at: "2026-07-12T12:08:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67cb52a47036745150887c752d18e2dfa84fab2722c27c696142d23080bb2efd
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

Kabuk tamamlama betikleri oluşturun, bunları OpenClaw durumu altında önbelleğe alın ve isteğe bağlı olarak kabuk profilinize yükleyin.

## Kullanım

```bash
openclaw completion                          # zsh betiğini standart çıktıya yazdır
openclaw completion --shell fish             # fish betiğini yazdır
openclaw completion --write-state            # tüm kabukların betiklerini önbelleğe al
openclaw completion --write-state --install  # önbelleğe al, ardından tek adımda yükle
openclaw completion --shell bash --write-state
```

## Seçenekler

- `-s, --shell <shell>`: hedef kabuk (`zsh`, `bash`, `powershell`, `fish`; varsayılan: `zsh`)
- `-i, --install`: önbelleğe alınmış betik için kabuk profilinize bir kaynak satırı ekleyerek tamamlamayı yükler
- `--write-state`: tamamlamа betiklerini standart çıktıya yazdırmadan `$OPENCLAW_STATE_DIR/completions` dizinine (varsayılan `~/.openclaw/completions`) yazar; `--shell` ile yalnızca belirtilen kabuğu, aksi takdirde dördünü de yazar
- `-y, --yes`: yükleme onayı istemlerini atlar (etkileşimsiz)

## Yükleme akışı

`--install`, profilinizi önbelleğe alınmış betiğe yönlendirir; bu nedenle önbelleğin önceden mevcut olması gerekir: mevcut değilse komut başarısız olur ve `openclaw completion --write-state` komutunu çalıştırmanızı söyler. Her ikisini tek adımda gerçekleştirmek için `--write-state --install` seçeneklerini birlikte kullanın. `--shell` olmadan `--install`, kabuğu `$SHELL` değişkeninden algılar (algılayamazsa zsh kullanır).

Yükleme, kabuk profilinize küçük bir `# OpenClaw Completion` bloğu yazar ve eski, yavaş `source <(openclaw completion ...)` satırlarını önbelleğe alınmış kaynak satırıyla değiştirir:

| Kabuk      | Profil                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bash       | `~/.bashrc` (`~/.bashrc` mevcut değilse `~/.bash_profile` kullanılır)                                                                                                                      |
| fish       | `~/.config/fish/config.fish`                                                                                                                                                               |
| powershell | `~/.config/powershell/Microsoft.PowerShell_profile.ps1` (Windows'ta: `Documents/PowerShell/Microsoft.PowerShell_profile.ps1` veya Windows PowerShell için `Documents/WindowsPowerShell/...`) |
| zsh        | `~/.zshrc`                                                                                                                                                                                 |

## Notlar

- `--install` veya `--write-state` olmadan komut, betiği standart çıktıya yazdırır.
- Tamamlama oluşturma işlemi, Plugin CLI komutları dâhil olmak üzere tüm komut ağacını önceden yükler; böylece iç içe alt komutlar da dâhil edilir.
- `openclaw update`, başarılı bir güncellemeden sonra tamamlama önbelleğini otomatik olarak yeniler; `openclaw doctor`, eksik veya güncelliğini yitirmiş tamamlama yapılandırmalarını onarabilir.

## İlgili

- [CLI başvurusu](/tr/cli)
