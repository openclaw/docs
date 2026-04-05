---
read_when:
    - Geçerli token'ınızla Control UI'yi açmak istiyorsunuz
    - Bir tarayıcı başlatmadan URL'yi yazdırmak istiyorsunuz
summary: '`openclaw dashboard` için CLI başvurusu (Control UI''yi açar)'
title: dashboard
x-i18n:
    generated_at: "2026-04-05T13:48:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: a34cd109a3803e2910fcb4d32f2588aa205a4933819829ef5598f0780f586c94
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
- SecretRef ile yönetilen token'lar için (çözümlenmiş veya çözümlenmemiş), `dashboard`, dış gizli bilgilerin terminal çıktısında, pano geçmişinde veya tarayıcı başlatma bağımsız değişkenlerinde açığa çıkmasını önlemek için token içermeyen bir URL yazdırır/kopyalar/açar.
- `gateway.auth.token`, SecretRef ile yönetiliyor ancak bu komut yolunda çözümlenmemişse, komut geçersiz bir token yer tutucusu yerleştirmek yerine token içermeyen bir URL ve açık düzeltme yönergeleri yazdırır.
