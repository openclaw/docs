---
read_when:
    - Çalışan Gateway'in durumunu hızlıca kontrol etmek istiyorsunuz
summary: '`openclaw health` için CLI referansı (RPC aracılığıyla Gateway sağlık durumu anlık görüntüsü)'
title: Sağlık
x-i18n:
    generated_at: "2026-05-06T09:05:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 443684af04efce2c54a6679e13b0bff0a5c1869f85d60fae0e853aed0a362226
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Çalışan Gateway'den sağlık durumunu alır.

Seçenekler:

- `--json`: makine tarafından okunabilir çıktı
- `--timeout <ms>`: milisaniye cinsinden bağlantı zaman aşımı (varsayılan `10000`)
- `--verbose`: ayrıntılı günlük kaydı
- `--debug`: `--verbose` için diğer ad

Örnekler:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Notlar:

- Varsayılan `openclaw health`, çalışan gateway'den sağlık anlık görüntüsünü ister. Gateway'de
  zaten yeni bir önbelleğe alınmış anlık görüntü varsa, bu önbelleğe alınmış yükü döndürebilir ve
  arka planda yenileyebilir.
- `--verbose` canlı bir yoklamayı zorunlu kılar, gateway bağlantı ayrıntılarını yazdırır ve
  insan tarafından okunabilir çıktıyı yapılandırılmış tüm hesaplar ve aracılar genelinde genişletir.
- Çıktı, birden fazla aracı yapılandırıldığında aracı başına oturum depolarını içerir.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway sağlığı](/tr/gateway/health)
