---
read_when:
    - CLI kurulu kalırken yerel durumu silmek istiyorsunuz
    - Nelerin kaldırılacağının bir dry-run çıktısını istiyorsunuz
summary: '`openclaw reset` için CLI başvurusu (yerel durum/yapılandırmayı sıfırlama)'
title: Sıfırla
x-i18n:
    generated_at: "2026-04-24T09:03:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4a4aba32fb44905d079bf2a22e582a3affbe9809eac9af237ce3e48da72b42c
    source_path: cli/reset.md
    workflow: 15
---

# `openclaw reset`

Yerel config/durumu sıfırlayın (CLI kurulu kalır).

Seçenekler:

- `--scope <scope>`: `config`, `config+creds+sessions` veya `full`
- `--yes`: onay istemlerini atla
- `--non-interactive`: istemleri devre dışı bırak; `--scope` ve `--yes` gerektirir
- `--dry-run`: dosyaları kaldırmadan eylemleri yazdır

Örnekler:

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

Notlar:

- Yerel durumu kaldırmadan önce geri yüklenebilir bir anlık görüntü istiyorsanız önce `openclaw backup create` çalıştırın.
- `--scope` değerini atlayırsanız, `openclaw reset` neyin kaldırılacağını seçmek için etkileşimli bir istem kullanır.
- `--non-interactive` yalnızca hem `--scope` hem de `--yes` ayarlı olduğunda geçerlidir.

## İlgili

- [CLI reference](/tr/cli)
