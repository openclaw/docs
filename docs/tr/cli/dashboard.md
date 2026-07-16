---
read_when:
    - Mevcut tokeninizle Kontrol Arayüzü'nü açmak istiyorsunuz
    - Tarayıcı başlatmadan URL'yi yazdırmak istiyorsunuz
summary: '`openclaw dashboard` için CLI başvurusu (Control UI''ı açma)'
title: Gösterge Paneli
x-i18n:
    generated_at: "2026-07-16T16:47:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 168605e1e58827020b4d247afd513880335273e489995549377bc2dc1f8a3b25
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Mevcut kimlik doğrulamanızı kullanarak Denetim Arayüzü'nü açın.

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --json
openclaw dashboard --yes
```

- `--no-open`: URL'yi yazdırır ancak tarayıcı başlatmaz.
- `--json`: tarayıcı açmadan, panoyu kullanmadan, istem göstermeden veya Gateway'i başlatmadan makine tarafından okunabilir tek bir bağlantı nesnesi yazdırır.
- `--yes`: gerektiğinde istem göstermeden Gateway'i başlatır/kurar.

## Makine tarafından okunabilir çıktı

Çözümlenmiş Denetim Arayüzü URL'sine ihtiyaç duyan masaüstü entegrasyonları ve betikler için `--json` kullanın:

```bash
openclaw dashboard --json
```

Yanıt; `url`, `httpUrl`, `wsUrl`, `port` ve `tokenIncluded` içerir. Gateway hazır değilse komut, `{"ok":false,"reason":"..."}` döndürür ve sıfırdan farklı bir kodla çıkar. SecretRef tarafından yönetilen belirteçler hiçbir zaman `url` içine eklenmez.

Notlar:

- Yapılandırılmış `gateway.auth.token` SecretRef'lerini mümkün olduğunda çözümler.
- `gateway.tls.enabled` ayarını izler: TLS etkin Gateway'ler, `https://` Denetim Arayüzü URL'lerini yazdırır/açar ve `wss://` üzerinden bağlanır.
- `lan` veya joker karakterli bir `custom` bağlaması için, joker karakter bir tarayıcı hedefi olmadığından aynı ana makinedeki başlatmalar her zaman geri döngü arabirimini kullanır. Düz metin `tailnet` ve `custom` bağlamaları da tarayıcının güvenli bir bağlama sahip olması için `127.0.0.1` kullanır; TLS etkin belirli ana makineler, sertifika adlarının eşleşmesi için yapılandırılmış adresi korur.
- Belirli bir arabirim bağlaması için kimliği doğrulanmış bir geri döngü URL'sini teslim etmeden önce komut, yapılandırılmış arabirimi yoklar ve bu arabirim ile `127.0.0.1` öğesinin aynı Gateway işlemi tarafından sahiplenildiğini doğrular. Dinleyici sahipliği belirsizse durum yönergeleri sunularak güvenli biçimde başarısız olunur.
- SecretRef tarafından yönetilen belirteçlerde (çözümlenmiş veya çözümlenmemiş), yazdırılan/kopyalanan/açılan URL hiçbir zaman belirteci içermez; böylece harici gizli değerler terminal çıktısına, pano geçmişine veya tarayıcı başlatma bağımsız değişkenlerine sızmaz.
- `gateway.auth.token` SecretRef tarafından yönetiliyor ancak çözümlenemiyorsa komut, geçersiz bir belirteç yer tutucusu yerine belirteç içermeyen bir URL ve düzeltme yönergeleri yazdırır.
- Belirteçle kimliği doğrulanmış bir URL'nin panoya/tarayıcıya teslimi başarısız olursa komut, belirteç değerini yazdırmadan `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token` ve URL parçası anahtarı `token` adlarını belirten güvenli bir manuel kimlik doğrulama ipucu günlüğe kaydeder.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Kontrol Paneli](/tr/web/dashboard)
