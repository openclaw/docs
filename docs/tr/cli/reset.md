---
read_when:
    - CLI yüklü kalırken yerel durumu temizlemek istiyorsunuz
    - Nelerin kaldırılacağını deneme çalıştırmasıyla görmek istiyorsunuz
summary: '`openclaw reset` için CLI başvurusu (yerel durumu/yapılandırmayı sıfırlama)'
title: Sıfırla
x-i18n:
    generated_at: "2026-07-12T12:12:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f18af9c5e187217de4c02f4b55de9a1c94f7246b74056dc660aa172168edcef9
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

Yerel yapılandırmayı/durumu sıfırlar (CLI kurulu kalır).

```bash
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

## Seçenekler

- `--scope <scope>`: `config`, `config+creds+sessions` veya `full`
- `--yes`: onay istemlerini atlar
- `--non-interactive`: istemleri devre dışı bırakır; `--scope` ve `--yes` gerektirir
- `--dry-run`: dosyaları kaldırmadan gerçekleştirilecek işlemleri yazdırır

## Kapsamlar

| Kapsam                  | Kaldırılanlar                                                                                                           | Önce Gateway'i durdurur |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `config`                | yalnızca yapılandırma dosyası                                                                                           | hayır                   |
| `config+creds+sessions` | yapılandırma dosyası, OAuth/kimlik bilgileri dizini ve her aracıya ait oturum dizinleri                                  | evet                    |
| `full`                  | durum dizini (içinde yer alıyorsa yapılandırma/kimlik bilgileri dâhil), çalışma alanı dizinleri ve çalışma alanı tasdikleri | evet                    |

`config+creds+sessions` ve `full`, durumu silmeden önce çalışmakta olan yönetilen Gateway hizmetini durdurur.

## Notlar

- Yerel durumu kaldırmadan önce geri yüklenebilir bir anlık görüntü oluşturmak için ilk olarak `openclaw backup create` komutunu çalıştırın.
- `--scope` olmadan çalıştırıldığında `openclaw reset`, kaldırılacak kapsamı etkileşimli olarak sorar.
- `--non-interactive` yalnızca hem `--scope` hem de `--yes` ayarlandığında geçerlidir.
- `config+creds+sessions` ve `full`, tamamlandığında `Next: openclaw onboard --install-daemon` çıktısını yazdırır.

## İlgili

- [CLI başvurusu](/tr/cli)
