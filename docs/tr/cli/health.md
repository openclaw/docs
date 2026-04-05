---
read_when:
    - Çalışan Gateway'in sağlığını hızlıca kontrol etmek istediğinizde
summary: '`openclaw health` için CLI başvurusu (RPC üzerinden gateway sağlık anlık görüntüsü)'
title: health
x-i18n:
    generated_at: "2026-04-05T13:48:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ed2b9ceefee6159cabaae9172d2d88174626456e7503d5d2bcd142634188ff0
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

Çalışan Gateway'den sağlık bilgisini alın.

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

- Varsayılan `openclaw health`, çalışan gateway'den sağlık anlık görüntüsünü ister. Gateway'in
  zaten yeni bir önbelleklenmiş anlık görüntüsü varsa, bu önbelleklenmiş yükü döndürebilir ve
  arka planda yenileyebilir.
- `--verbose`, canlı probe'u zorlar, gateway bağlantı ayrıntılarını yazdırır ve
  insan tarafından okunabilir çıktıyı yapılandırılmış tüm hesaplar ve agent'lar için genişletir.
- Çıktı, birden fazla agent yapılandırıldığında agent başına oturum depolarını içerir.
