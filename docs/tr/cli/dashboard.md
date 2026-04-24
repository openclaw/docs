---
read_when:
    - Geçerli token'ınızla Control UI'yi açmak istiyorsunuz
    - Tarayıcı başlatmadan URL'yi yazdırmak istiyorsunuz
summary: '`openclaw dashboard` için CLI başvurusu (Control UI''yi açın)'
title: Pano
x-i18n:
    generated_at: "2026-04-24T09:02:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0864d9c426832ffb9e2acd9d7cb7fc677d859a5b7588132e993a36a5c5307802
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Geçerli kimlik doğrulamanızı kullanarak Control UI'yi açın.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Notlar:

- `dashboard`, mümkün olduğunda yapılandırılmış `gateway.auth.token` SecretRef'lerini çözümler.
- SecretRef tarafından yönetilen token'lar için (çözülmüş veya çözülmemiş), `dashboard`; harici gizli bilgileri terminal çıktısında, pano geçmişinde veya tarayıcı başlatma bağımsız değişkenlerinde açığa çıkarmamak için token içermeyen bir URL yazdırır/kopyalar/açar.
- `gateway.auth.token` SecretRef tarafından yönetiliyor ancak bu komut yolunda çözümlenemiyorsa komut, geçersiz bir token yer tutucusu gömmek yerine token içermeyen bir URL ve açık bir düzeltme rehberliği yazdırır.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Pano](/tr/web/dashboard)
