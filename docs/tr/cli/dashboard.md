---
read_when:
    - Kontrol kullanıcı arayüzünü mevcut belirtecinizle açmak istiyorsunuz
    - Bir tarayıcı başlatmadan URL'yi yazdırmak istiyorsunuz
summary: '`openclaw dashboard` için CLI başvurusu (Denetim Kullanıcı Arayüzü''nü açın)'
title: Kontrol Paneli
x-i18n:
    generated_at: "2026-05-05T01:44:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51b3326b3884013ebcf570b417e66efe62ea89dcdedb5ab3173f39fb021de89f
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Geçerli kimlik doğrulamanızı kullanarak Kontrol UI'sını açın.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Notlar:

- `dashboard`, mümkün olduğunda yapılandırılmış `gateway.auth.token` SecretRef'lerini çözer.
- `dashboard`, `gateway.tls.enabled` ayarını izler: TLS etkin Gateway'ler
  `https://` Kontrol UI URL'lerini yazdırır/açar ve `wss://` üzerinden bağlanır.
- Belirteçle kimliği doğrulanmış bir dashboard URL'si için pano/tarayıcı iletimi başarısız olursa,
  `dashboard`, belirteç
  değerini yazdırmadan `OPENCLAW_GATEWAY_TOKEN`,
  `gateway.auth.token` ve parça anahtarı `token` adlarını içeren güvenli bir manuel kimlik doğrulama ipucu kaydeder.
- SecretRef tarafından yönetilen belirteçler için (çözülmüş veya çözülmemiş), `dashboard` dış sırların terminal çıktısında, pano geçmişinde veya tarayıcı başlatma argümanlarında açığa çıkmasını önlemek için belirteçsiz bir URL yazdırır/kopyalar/açar.
- `gateway.auth.token` SecretRef tarafından yönetiliyorsa ancak bu komut yolunda çözülemiyorsa, komut geçersiz bir belirteç yer tutucusu gömmek yerine belirteçsiz bir URL ve açık düzeltme rehberliği yazdırır.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Dashboard](/tr/web/dashboard)
