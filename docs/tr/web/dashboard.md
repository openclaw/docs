---
read_when:
    - Pano kimlik doğrulamasını veya açığa çıkma modlarını değiştirme
summary: Gateway panosu (Control UI) erişimi ve auth
title: Pano
x-i18n:
    generated_at: "2026-04-24T09:38:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8753e0edf0a04e4c36b76aa6973dcd9d903a98c0b85e498bfcb05e728bb6272b
    source_path: web/dashboard.md
    workflow: 15
---

Gateway panosu, varsayılan olarak `/` üzerinde sunulan tarayıcı Control UI'dır
(`gateway.controlUi.basePath` ile geçersiz kılınabilir).

Hızlı açılış (yerel Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))

Temel başvurular:

- Kullanım ve UI yetenekleri için [Control UI](/tr/web/control-ui).
- Serve/Funnel otomasyonu için [Tailscale](/tr/gateway/tailscale).
- Bind modları ve güvenlik notları için [Web yüzeyleri](/tr/web).

Kimlik doğrulama, yapılandırılmış gateway
auth yolu üzerinden WebSocket el sıkışmasında uygulanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik üst bilgileri
- `gateway.auth.mode: "trusted-proxy"` olduğunda trusted-proxy kimlik üst bilgileri

[Gateway yapılandırması](/tr/gateway/configuration) içindeki `gateway.auth` bölümüne bakın.

Güvenlik notu: Control UI bir **yönetici yüzeyidir** (sohbet, yapılandırma, exec onayları).
Bunu herkese açık şekilde açığa çıkarmayın. UI, pano URL token'larını mevcut tarayıcı sekmesi oturumu
ve seçilen gateway URL'si için sessionStorage içinde tutar ve yüklemeden sonra bunları URL'den çıkarır.
localhost, Tailscale Serve veya SSH tüneli tercih edin.

## Hızlı yol (önerilir)

- Onboarding sonrası CLI panoyu otomatik açar ve temiz (tokensız) bir bağlantı yazdırır.
- İstediğiniz zaman yeniden açın: `openclaw dashboard` (bağlantıyı kopyalar, mümkünse tarayıcıyı açar, headless ise SSH ipucu gösterir).
- UI paylaşılan gizli bilgi auth istemi gösterirse, yapılandırılmış token'ı veya
  parolayı Control UI ayarlarına yapıştırın.

## Auth temelleri (yerel ve uzak)

- **Localhost**: `http://127.0.0.1:18789/` adresini açın.
- **Paylaşılan gizli token kaynağı**: `gateway.auth.token` (veya
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` bunu tek seferlik bootstrap için URL fragment
  aracılığıyla geçebilir ve Control UI bunu localStorage yerine
  mevcut tarayıcı sekmesi oturumu ve seçilen gateway URL'si için sessionStorage içinde tutar.
- `gateway.auth.token` SecretRef ile yönetiliyorsa `openclaw dashboard`
  tasarım gereği tokensız bir URL yazdırır/kopyalar/açar. Bu, harici olarak yönetilen
  token'ların shell log'larında, pano geçmişinde veya tarayıcı başlatma
  argümanlarında açığa çıkmasını önler.
- `gateway.auth.token` bir SecretRef olarak yapılandırılmışsa ve mevcut
  shell'inizde çözümlenmemişse, `openclaw dashboard` yine de tokensız bir URL ile
  uygulanabilir auth kurulum rehberini yazdırır.
- **Paylaşılan gizli parola**: yapılandırılmış `gateway.auth.password` değerini (veya
  `OPENCLAW_GATEWAY_PASSWORD`) kullanın. Pano parolaları yeniden yüklemeler arasında
  kalıcı tutmaz.
- **Kimlik taşıyan modlar**: Tailscale Serve, `gateway.auth.allowTailscale: true` olduğunda kimlik üst bilgileri aracılığıyla Control UI/WebSocket
  auth'u karşılayabilir ve
  `gateway.auth.mode: "trusted-proxy"` olan loopback dışı kimlik farkında ters proxy bunu karşılayabilir.
  Bu modlarda pano,
  WebSocket için yapıştırılmış paylaşılan bir gizli bilgiye ihtiyaç duymaz.
- **Localhost değilse**: Tailscale Serve, loopback dışı paylaşılan gizli bilgi bind'i,
  `gateway.auth.mode: "trusted-proxy"` olan loopback dışı kimlik farkında ters proxy
  veya SSH tüneli kullanın. HTTP API'ler hâlâ
  paylaşılan gizli bilgi auth'u kullanır; özel-ingress
  `gateway.auth.mode: "none"` veya trusted-proxy HTTP auth'u bilerek çalıştırmadığınız sürece. Bkz.
  [Web yüzeyleri](/tr/web).

<a id="if-you-see-unauthorized-1008"></a>

## "unauthorized" / 1008 görürseniz

- Gateway'e erişilebildiğinden emin olun (yerel: `openclaw status`; uzak: SSH tüneli `ssh -N -L 18789:127.0.0.1:18789 user@host`, ardından `http://127.0.0.1:18789/` adresini açın).
- `AUTH_TOKEN_MISMATCH` için istemciler, gateway yeniden deneme ipuçları döndürdüğünde önbellekteki bir cihaz token'ıyla güvenilen tek bir yeniden deneme yapabilir. Bu önbellekli token yeniden denemesi, token'ın önbellekteki onaylanmış kapsamlarını yeniden kullanır; açık `deviceToken` / açık `scopes` çağıranlar istedikleri kapsam kümesini korur. Auth bu yeniden denemeden sonra da başarısız olursa token kaymasını elle çözün.
- Bu yeniden deneme yolu dışında connect auth önceliği şöyledir: önce açık paylaşılan token/parola, sonra açık `deviceToken`, ardından kayıtlı cihaz token'ı, ardından bootstrap token.
- Eşzamansız Tailscale Serve Control UI yolunda, aynı
  `{scope, ip}` için başarısız girişimler başarısız-auth sınırlayıcısı bunları kaydetmeden önce serileştirilir; bu yüzden eşzamanlı ikinci hatalı yeniden deneme zaten `retry later` gösterebilir.
- Token kayması onarım adımları için [Token drift recovery checklist](/tr/cli/devices#token-drift-recovery-checklist) sayfasını izleyin.
- Paylaşılan gizli bilgiyi gateway host'undan alın veya sağlayın:
  - Token: `openclaw config get gateway.auth.token`
  - Parola: yapılandırılmış `gateway.auth.password` veya
    `OPENCLAW_GATEWAY_PASSWORD` değerini çözümleyin
  - SecretRef ile yönetilen token: harici secret sağlayıcısını çözümleyin veya bu shell'de
    `OPENCLAW_GATEWAY_TOKEN` dışa aktarın, ardından `openclaw dashboard`
    komutunu yeniden çalıştırın
  - Yapılandırılmış paylaşılan gizli bilgi yoksa: `openclaw doctor --generate-gateway-token`
- Pano ayarlarında token'ı veya parolayı auth alanına yapıştırın,
  ardından bağlanın.
- UI dil seçici **Overview -> Gateway Access -> Language** altında bulunur.
  Appearance bölümünün değil, erişim kartının bir parçasıdır.

## İlgili

- [Control UI](/tr/web/control-ui)
- [WebChat](/tr/web/webchat)
