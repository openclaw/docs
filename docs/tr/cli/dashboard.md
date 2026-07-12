---
read_when:
    - Control UI'yi mevcut token'ınızla açmak istiyorsunuz
    - Bir tarayıcı açmadan URL'yi yazdırmak istiyorsunuz
summary: '`openclaw dashboard` için CLI başvurusu (Kontrol Arayüzünü açın)'
title: Gösterge Paneli
x-i18n:
    generated_at: "2026-07-12T12:08:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 349dff4bad7fc6aa622067ed502d7d6800b93ebcfe26d2594e602e06e564993f
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Mevcut kimlik doğrulamanızı kullanarak Denetim Arayüzü'nü açın.

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --yes
```

- `--no-open`: URL'yi yazdırır ancak tarayıcı başlatmaz.
- `--yes`: gerektiğinde sormadan Gateway'i başlatır/yükler.

Notlar:

- Yapılandırılmış `gateway.auth.token` SecretRef'lerini mümkün olduğunda çözümler.
- `gateway.tls.enabled` ayarını izler: TLS etkin Gateway'ler `https://` Denetim Arayüzü URL'lerini yazdırır/açar ve `wss://` üzerinden bağlanır.
- `lan` veya joker karakterli bir `custom` bağlaması için aynı ana makinedeki başlatmalar her zaman loopback kullanır; çünkü joker karakter bir tarayıcı hedefi değildir. Düz metin `tailnet` ve `custom` bağlamaları da tarayıcının güvenli bir bağlama sahip olması için `127.0.0.1` kullanır; TLS etkin belirli ana makineler, sertifika adlarının eşleşmesi için yapılandırılmış adresi korur.
- Komut, belirli bir arayüze bağlama için kimliği doğrulanmış bir loopback URL'si sunmadan önce yapılandırılmış arayüzü yoklar ve bu arayüz ile `127.0.0.1` adresinin aynı Gateway işlemi tarafından yönetildiğini doğrular. Dinleyici sahipliğinin belirsiz olması durumunda güvenli biçimde başarısız olur ve durumla ilgili yönlendirme sağlar.
- SecretRef tarafından yönetilen token'lar için (çözümlenmiş veya çözümlenmemiş), yazdırılan, kopyalanan veya açılan URL hiçbir zaman token'ı içermez; böylece harici gizli bilgiler terminal çıktısına, pano geçmişine veya tarayıcı başlatma bağımsız değişkenlerine sızmaz.
- `gateway.auth.token`, SecretRef tarafından yönetiliyor ancak çözümlenemiyorsa komut, geçersiz bir token yer tutucusu yerine token içermeyen bir URL ve düzeltme yönergeleri yazdırır.
- Token ile kimliği doğrulanmış bir URL'nin panoya veya tarayıcıya iletilmesi başarısız olursa komut, token değerini yazdırmadan `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token` ve `token` URL parçası anahtarını belirten güvenli bir elle kimlik doğrulama ipucu kaydeder.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gösterge paneli](/tr/web/dashboard)
