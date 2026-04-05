---
read_when:
    - CLI kurulu kalırken yerel durumu temizlemek istiyorsunuz
    - Nelerin kaldırılacağını görmek için bir dry-run istiyorsunuz
summary: '`openclaw reset` için CLI başvurusu (yerel durumu/yapılandırmayı sıfırlama)'
title: reset
x-i18n:
    generated_at: "2026-04-05T13:49:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad464700f948bebe741ec309f25150714f0b280834084d4f531327418a42c79b
    source_path: cli/reset.md
    workflow: 15
---

# `openclaw reset`

Yerel yapılandırmayı/durumu sıfırlayın (CLI kurulu kalır).

Seçenekler:

- `--scope <scope>`: `config`, `config+creds+sessions` veya `full`
- `--yes`: onay istemlerini atla
- `--non-interactive`: istemleri devre dışı bırakır; `--scope` ve `--yes` gerektirir
- `--dry-run`: dosyaları kaldırmadan eylemleri yazdırır

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
- `--scope` belirtilmezse `openclaw reset`, neyin kaldırılacağını seçmek için etkileşimli bir istem kullanır.
- `--non-interactive` yalnızca hem `--scope` hem de `--yes` ayarlandığında geçerlidir.
