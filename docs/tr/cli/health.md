---
read_when:
    - Çalışan Gateway'in sağlığını hızlıca kontrol etmek istiyorsunuz
summary: '`openclaw health` için CLI referansı (RPC üzerinden Gateway sağlık anlık görüntüsü)'
title: Sağlık
x-i18n:
    generated_at: "2026-05-10T19:29:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26be7bbbf75c2eca1213fe145fdeeab6fee96798dff457278ac69a20145bf75d
    source_path: cli/health.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw health`

Çalışan Gateway'den sağlık durumunu getirir.

## Seçenekler

| Bayrak           | Varsayılan | Açıklama                                                            |
| ---------------- | ---------- | ------------------------------------------------------------------- |
| `--json`         | `false`    | Metin yerine makine tarafından okunabilir JSON yazdırır.            |
| `--timeout <ms>` | `10000`    | Milisaniye cinsinden bağlantı zaman aşımı.                          |
| `--verbose`      | `false`    | Ayrıntılı günlükleme. Canlı bir yoklamayı zorunlu kılar ve ajan başına çıktıyı genişletir. |
| `--debug`        | `false`    | `--verbose` için takma ad.                                          |

Örnekler:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Notlar:

- Varsayılan `openclaw health`, çalışan Gateway'den sağlık anlık görüntüsünü ister. Gateway'in
  zaten taze ve önbelleğe alınmış bir anlık görüntüsü varsa, bu önbelleğe alınmış yükü döndürebilir ve
  arka planda yenileyebilir.
- `--verbose` canlı bir yoklamayı zorunlu kılar, Gateway bağlantı ayrıntılarını yazdırır ve
  insan tarafından okunabilir çıktıyı yapılandırılmış tüm hesaplar ve ajanlar genelinde genişletir.
- Birden fazla ajan yapılandırıldığında çıktı, ajan başına oturum depolarını içerir.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway sağlık durumu](/tr/gateway/health)
