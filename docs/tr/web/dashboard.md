---
read_when:
    - Pano kimlik doğrulamasını veya dışa açma modlarını değiştirme
summary: Gateway panosu (Kontrol arayüzü) erişimi ve kimlik doğrulaması
title: Pano
x-i18n:
    generated_at: "2026-05-11T20:39:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07e11c1f71e6691ee053192e238a3b48568f81c3180e6b5f8e21b6874417e57e
    source_path: web/dashboard.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Gateway panosu, varsayılan olarak `/` adresinde sunulan tarayıcı Denetim Arayüzüdür
(`gateway.controlUi.basePath` ile geçersiz kılın).

Hızlı açma (yerel Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))
- `gateway.tls.enabled: true` ile WebSocket uç noktası için `https://127.0.0.1:18789/` ve
  `wss://127.0.0.1:18789` kullanın.

Temel başvurular:

- Kullanım ve UI özellikleri için [Denetim Arayüzü](/tr/web/control-ui).
- Serve/Funnel otomasyonu için [Tailscale](/tr/gateway/tailscale).
- Bağlama modları ve güvenlik notları için [Web yüzeyleri](/tr/web).

Kimlik doğrulama, yapılandırılan gateway kimlik doğrulama yolu üzerinden WebSocket el sıkışmasında uygulanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik üst bilgileri
- `gateway.auth.mode: "trusted-proxy"` olduğunda trusted-proxy kimlik üst bilgileri

[Gateway yapılandırması](/tr/gateway/configuration) içinde `gateway.auth` bölümüne bakın.

Güvenlik notu: Denetim Arayüzü bir **yönetici yüzeyidir** (sohbet, yapılandırma, exec onayları).
Bunu herkese açık biçimde erişime açmayın. UI, pano URL token'larını geçerli tarayıcı sekmesi oturumu ve seçilen gateway URL'si için sessionStorage içinde tutar ve yüklemeden sonra bunları URL'den kaldırır.
localhost, Tailscale Serve veya bir SSH tünelini tercih edin.

## Hızlı yol (önerilir)

- Onboarding sonrasında CLI panoyu otomatik açar ve temiz (token içermeyen) bir bağlantı yazdırır.
- İstediğiniz zaman yeniden açın: `openclaw dashboard` (bağlantıyı kopyalar, mümkünse tarayıcıyı açar, headless ise SSH ipucu gösterir).
- Pano ve tarayıcıyla teslim başarısız olursa, `openclaw dashboard` yine de temiz URL'yi yazdırır ve URL fragment anahtarı `token` olarak `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.token` içindeki token'ı kullanmanızı söyler; token
  değerlerini günlüklere yazdırmaz.
- UI shared-secret kimlik doğrulaması isterse, yapılandırılmış token'ı veya
  parolayı Denetim Arayüzü ayarlarına yapıştırın.

## Kimlik doğrulama temelleri (yerel ve uzak)

- **Localhost**: `http://127.0.0.1:18789/` adresini açın.
- **Gateway TLS**: `gateway.tls.enabled: true` olduğunda pano/durum bağlantıları
  `https://`, Denetim Arayüzü WebSocket bağlantıları ise `wss://` kullanır.
- **Shared-secret token kaynağı**: `gateway.auth.token` (veya
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` bunu tek seferlik bootstrap için URL fragment üzerinden iletebilir ve Denetim Arayüzü bunu localStorage yerine geçerli tarayıcı sekmesi oturumu ve seçilen gateway URL'si için sessionStorage içinde tutar.
- `gateway.auth.token` SecretRef tarafından yönetiliyorsa, `openclaw dashboard`
  tasarım gereği token içermeyen bir URL yazdırır/kopyalar/açar. Bu, dışarıdan yönetilen token'ların kabuk günlüklerinde, pano geçmişinde veya tarayıcı başlatma
  argümanlarında açığa çıkmasını önler.
- `gateway.auth.token` SecretRef olarak yapılandırılmışsa ve geçerli kabuğunuzda çözülemiyorsa, `openclaw dashboard` yine token içermeyen bir URL ile birlikte
  uygulanabilir kimlik doğrulama kurulum rehberliği yazdırır.
- **Shared-secret parola**: yapılandırılmış `gateway.auth.password` (veya
  `OPENCLAW_GATEWAY_PASSWORD`) kullanın. Pano parolaları yeniden yüklemeler arasında kalıcı olarak saklamaz.
- **Kimlik taşıyan modlar**: `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve, kimlik üst bilgileriyle Denetim Arayüzü/WebSocket kimlik doğrulamasını karşılayabilir; local loopback olmayan, kimlik farkındalığına sahip bir reverse proxy de
  `gateway.auth.mode: "trusted-proxy"` durumunu karşılayabilir. Bu modlarda pano, WebSocket için yapıştırılmış bir shared secret gerektirmez.
- **Localhost değilse**: Tailscale Serve, local loopback olmayan shared-secret bağlama, `gateway.auth.mode: "trusted-proxy"` ile local loopback olmayan kimlik farkındalığına sahip reverse proxy veya bir SSH tüneli kullanın. HTTP API'leri, özel girişli
  `gateway.auth.mode: "none"` veya trusted-proxy HTTP kimlik doğrulamasını bilerek çalıştırmadığınız sürece yine shared-secret kimlik doğrulaması kullanır. [Web yüzeyleri](/tr/web) bölümüne bakın.

<a id="if-you-see-unauthorized-1008"></a>

## "unauthorized" / 1008 görürseniz

- Gateway'in erişilebilir olduğundan emin olun (yerel: `openclaw status`; uzak: SSH tüneli `ssh -N -L 18789:127.0.0.1:18789 user@host`, ardından `http://127.0.0.1:18789/` adresini açın).
- `AUTH_TOKEN_MISMATCH` için, gateway yeniden deneme ipuçları döndürdüğünde istemciler önbelleğe alınmış cihaz token'ıyla güvenilir bir yeniden deneme yapabilir. Bu önbelleğe alınmış token yeniden denemesi, token'ın önbelleğe alınmış onaylı kapsamlarını yeniden kullanır; açık `deviceToken` / açık `scopes` çağırıcıları istedikleri kapsam kümesini korur. Kimlik doğrulama bu yeniden denemeden sonra hâlâ başarısız olursa, token kaymasını elle giderin.
- `AUTH_SCOPE_MISMATCH` için, cihaz token'ı tanındı ancak panonun istediği kapsamları taşımıyor; paylaşılan gateway token'ını döndürmek yerine yeniden eşleştirin veya istenen kapsam sözleşmesini onaylayın.
- Bu yeniden deneme yolu dışında, bağlantı kimlik doğrulama önceliği önce açık shared token/parola, sonra açık `deviceToken`, sonra saklanan cihaz token'ı, sonra bootstrap token'ıdır.
- Async Tailscale Serve Denetim Arayüzü yolunda, aynı
  `{scope, ip}` için başarısız girişimler failed-auth sınırlayıcı bunları kaydetmeden önce serileştirilir; bu nedenle ikinci eşzamanlı hatalı yeniden deneme zaten `retry later` gösterebilir.
- Token kayması onarım adımları için [Token kayması kurtarma kontrol listesi](/tr/cli/devices#token-drift-recovery-checklist) bölümünü izleyin.
- Shared secret'ı gateway host'undan alın veya sağlayın:
  - Token: `openclaw config get gateway.auth.token`
  - Parola: yapılandırılmış `gateway.auth.password` veya
    `OPENCLAW_GATEWAY_PASSWORD` değerini çözün
  - SecretRef tarafından yönetilen token: dış secret sağlayıcıyı çözün veya bu kabukta
    `OPENCLAW_GATEWAY_TOKEN` dışa aktarın, ardından `openclaw dashboard` komutunu yeniden çalıştırın
  - Yapılandırılmış shared secret yok: `openclaw doctor --generate-gateway-token`
- Pano ayarlarında token'ı veya parolayı kimlik doğrulama alanına yapıştırın,
  ardından bağlanın.
- UI dil seçici **Genel Bakış -> Gateway Erişimi -> Dil** içindedir.
  Görünüm bölümünün değil, erişim kartının parçasıdır.

## İlgili

- [Denetim Arayüzü](/tr/web/control-ui)
- [WebChat](/tr/web/webchat)
