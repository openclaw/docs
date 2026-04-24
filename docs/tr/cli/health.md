---
read_when:
    - Çalışan Gateway’in sağlığını hızlıca kontrol etmek istiyorsunuz
summary: '`openclaw health` için CLI başvurusu (RPC üzerinden Gateway sağlık anlık görüntüsü)'
title: Sağlık
x-i18n:
    generated_at: "2026-04-24T09:02:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf5f5b9c3ec5c08090134764966d2657241ed0ebbd28a9dc7fafde0b8c7216d6
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

Çalışan Gateway’den sağlık bilgisini alın.

Seçenekler:

- `--json`: makine tarafından okunabilir çıktı
- `--timeout <ms>`: milisaniye cinsinden bağlantı zaman aşımı (varsayılan `10000`)
- `--verbose`: ayrıntılı günlükleme
- `--debug`: `--verbose` için takma ad

Örnekler:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Notlar:

- Varsayılan `openclaw health`, çalışan Gateway’den sağlık anlık görüntüsünü ister. Gateway’in zaten yeni bir önbelleklenmiş anlık görüntüsü varsa, bu önbelleklenmiş yükü döndürebilir ve arka planda yenileyebilir.
- `--verbose`, canlı bir probe’u zorlar, Gateway bağlantı ayrıntılarını yazdırır ve insan tarafından okunabilir çıktıyı yapılandırılmış tüm hesaplar ve aracılar için genişletir.
- Çıktı, birden fazla aracı yapılandırıldığında aracı başına oturum depolarını içerir.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway sağlığı](/tr/gateway/health)
