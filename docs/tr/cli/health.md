---
read_when:
    - Çalışan Gateway'in durumunu hızlıca kontrol etmek istiyorsunuz
summary: '`openclaw health` için CLI başvurusu (RPC üzerinden Gateway durum anlık görüntüsü)'
title: Sağlık
x-i18n:
    generated_at: "2026-07-12T12:09:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a26ce5ade9ab56c9751c3dde814c38a1e01e74d91c2fd57e56d3c44ca529d0d8
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Çalışan Gateway'den WebSocket RPC üzerinden bir sistem durumu anlık görüntüsü alın (CLI'dan doğrudan kanal soketleri kullanılmaz).

## Seçenekler

| Bayrak           | Varsayılan | Açıklama                                                                                                  |
| ---------------- | ----------- | --------------------------------------------------------------------------------------------------------- |
| `--json`         | `false`     | Metin yerine makine tarafından okunabilir JSON çıktısı verir.                                             |
| `--timeout <ms>` | `10000`     | Milisaniye cinsinden bağlantı zaman aşımı.                                                                 |
| `--verbose`      | `false`     | Canlı yoklamayı zorunlu kılar ve çıktıyı yapılandırılmış tüm hesapları ve aracıları kapsayacak şekilde genişletir. |
| `--debug`        | `false`     | `--verbose` için takma ad.                                                                                 |

Örnekler:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

## Davranış

- `--verbose` olmadan Gateway, önbelleğe alınmış bir anlık görüntü döndürebilir (en fazla 60 saniye günceldir ve canlı kanal çalışma zamanı durumuyla aynıdır) ve bunu bir sonraki çağıran için arka planda yenileyebilir.
- `--verbose`, canlı yoklamayı (kanal başına hesap yoklamaları) zorunlu kılar, Gateway bağlantı ayrıntılarını yazdırır ve insan tarafından okunabilir çıktıyı yalnızca varsayılan aracı yerine yapılandırılmış tüm hesapları ve aracıları kapsayacak şekilde genişletir.
- `--json` her zaman tam anlık görüntüyü döndürür: kanallar, hesap başına yoklamalar, Plugin yükleme durumu, bağlam motoru karantina durumu, model fiyatlandırma önbelleği durumu, olay döngüsü sistem durumu ve aracı başına oturum depoları.

## İlgili

- [CLI başvurusu](/tr/cli)
- [`openclaw status`](/tr/cli/status) — tam bir sistem durumu anlık görüntüsü olmadan yerel tanılama ve kanal yoklamaları
- [Gateway sistem durumu](/tr/gateway/health)
