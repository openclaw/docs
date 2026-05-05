---
read_when:
    - Pano kimlik doğrulamasını veya erişime açma modlarını değiştirme
summary: Gateway panosuna (Kontrol UI) erişim ve kimlik doğrulama
title: Kontrol Paneli
x-i18n:
    generated_at: "2026-05-05T01:51:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e2086587fee6303221663748c3047886a5beae29862d66e2edf78e02bfe3da1
    source_path: web/dashboard.md
    workflow: 16
---

Gateway panosu, varsayılan olarak `/` adresinde sunulan tarayıcı Kontrol Arayüzüdür
(`gateway.controlUi.basePath` ile geçersiz kılın).

Hızlı açma (yerel Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))
- `gateway.tls.enabled: true` ile WebSocket uç noktası için `https://127.0.0.1:18789/` ve
  `wss://127.0.0.1:18789` kullanın.

Temel başvurular:

- Kullanım ve UI yetenekleri için [Kontrol Arayüzü](/tr/web/control-ui).
- Serve/Funnel otomasyonu için [Tailscale](/tr/gateway/tailscale).
- Bağlama modları ve güvenlik notları için [Web yüzeyleri](/tr/web).

Kimlik doğrulama, yapılandırılmış Gateway kimlik doğrulama yolu üzerinden WebSocket
el sıkışmasında zorunlu tutulur:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik üst bilgileri
- `gateway.auth.mode: "trusted-proxy"` olduğunda güvenilen proxy kimlik üst bilgileri

[Gateway yapılandırması](/tr/gateway/configuration) içinde `gateway.auth` bölümüne bakın.

Güvenlik notu: Kontrol Arayüzü bir **yönetici yüzeyidir** (sohbet, yapılandırma, yürütme onayları).
Bunu herkese açık olarak yayınlamayın. UI, pano URL token'larını geçerli tarayıcı sekmesi oturumu
ve seçili Gateway URL'si için sessionStorage içinde tutar ve yüklemeden sonra bunları URL'den kaldırır.
localhost, Tailscale Serve veya SSH tünelini tercih edin.

## Hızlı yol (önerilir)

- İlk kurulumdan sonra CLI panoyu otomatik açar ve temiz (token içermeyen) bir bağlantı yazdırır.
- İstediğiniz zaman yeniden açın: `openclaw dashboard` (bağlantıyı kopyalar, mümkünse tarayıcıyı açar, başsız ortamda SSH ipucu gösterir).
- Pano ve tarayıcı teslimi başarısız olursa, `openclaw dashboard` yine de temiz URL'yi yazdırır ve
  `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.token` içindeki token'ı URL parça anahtarı `token` olarak
  kullanmanızı söyler; token değerlerini günlüklere yazdırmaz.
- UI paylaşılan gizli anahtar kimlik doğrulaması isterse, yapılandırılmış token'ı veya
  parolayı Kontrol Arayüzü ayarlarına yapıştırın.

## Kimlik doğrulama temelleri (yerel ve uzak)

- **Localhost**: `http://127.0.0.1:18789/` adresini açın.
- **Gateway TLS**: `gateway.tls.enabled: true` olduğunda pano/durum bağlantıları
  `https://`, Kontrol Arayüzü WebSocket bağlantıları ise `wss://` kullanır.
- **Paylaşılan gizli token kaynağı**: `gateway.auth.token` (veya
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` bunu tek seferlik başlangıç için URL parçası üzerinden
  geçirebilir ve Kontrol Arayüzü bunu localStorage yerine geçerli tarayıcı sekmesi oturumu
  ve seçili Gateway URL'si için sessionStorage içinde tutar.
- `gateway.auth.token` SecretRef ile yönetiliyorsa, `openclaw dashboard`
  tasarım gereği token içermeyen bir URL yazdırır/kopyalar/açar. Bu, harici olarak yönetilen
  token'ların kabuk günlüklerinde, pano geçmişinde veya tarayıcı başlatma bağımsız değişkenlerinde
  açığa çıkmasını önler.
- `gateway.auth.token` SecretRef olarak yapılandırılmışsa ve geçerli kabuğunuzda çözümlenmemişse,
  `openclaw dashboard` yine de token içermeyen bir URL ile uygulanabilir kimlik doğrulama kurulum
  rehberliği yazdırır.
- **Paylaşılan gizli parola**: yapılandırılmış `gateway.auth.password` değerini (veya
  `OPENCLAW_GATEWAY_PASSWORD`) kullanın. Pano, parolaları yeniden yüklemeler arasında kalıcı tutmaz.
- **Kimlik taşıyan modlar**: Tailscale Serve, `gateway.auth.allowTailscale: true` olduğunda
  kimlik üst bilgileri üzerinden Kontrol Arayüzü/WebSocket kimlik doğrulamasını karşılayabilir ve
  local loopback olmayan, kimlik farkında bir ters proxy
  `gateway.auth.mode: "trusted-proxy"` değerini karşılayabilir. Bu modlarda pano,
  WebSocket için yapıştırılmış bir paylaşılan gizli anahtara ihtiyaç duymaz.
- **Localhost değilse**: Tailscale Serve, local loopback olmayan paylaşılan gizli anahtar bağlaması,
  `gateway.auth.mode: "trusted-proxy"` kullanan local loopback olmayan kimlik farkında bir ters proxy
  veya SSH tüneli kullanın. HTTP API'leri, özellikle özel giriş
  `gateway.auth.mode: "none"` veya trusted-proxy HTTP kimlik doğrulaması çalıştırmadığınız sürece
  paylaşılan gizli anahtar kimlik doğrulamasını kullanmaya devam eder. Bkz.
  [Web yüzeyleri](/tr/web).

<a id="if-you-see-unauthorized-1008"></a>

## "unauthorized" / 1008 görürseniz

- Gateway'in erişilebilir olduğundan emin olun (yerel: `openclaw status`; uzak: SSH tüneli `ssh -N -L 18789:127.0.0.1:18789 user@host`, ardından `http://127.0.0.1:18789/` adresini açın).
- `AUTH_TOKEN_MISMATCH` için, Gateway yeniden deneme ipuçları döndürdüğünde istemciler önbelleğe alınmış cihaz token'ıyla güvenilen tek bir yeniden deneme yapabilir. Bu önbelleğe alınmış token yeniden denemesi, token'ın önbelleğe alınmış onaylı kapsamlarını yeniden kullanır; açık `deviceToken` / açık `scopes` çağırıcıları kendi istedikleri kapsam kümesini korur. Bu yeniden denemeden sonra kimlik doğrulama hâlâ başarısız olursa, token sapmasını elle çözün.
- Bu yeniden deneme yolu dışında, bağlantı kimlik doğrulaması önceliği önce açık paylaşılan token/parola, sonra açık `deviceToken`, sonra saklanan cihaz token'ı, sonra başlangıç token'ıdır.
- Eşzamansız Tailscale Serve Kontrol Arayüzü yolunda, aynı
  `{scope, ip}` için başarısız girişimler, başarısız kimlik doğrulama sınırlayıcısı bunları kaydetmeden önce serileştirilir; bu nedenle
  ikinci eşzamanlı hatalı yeniden deneme zaten `retry later` gösterebilir.
- Token sapması onarım adımları için [Token sapması kurtarma kontrol listesi](/tr/cli/devices#token-drift-recovery-checklist) bölümünü izleyin.
- Paylaşılan gizli anahtarı Gateway ana makinesinden alın veya sağlayın:
  - Token: `openclaw config get gateway.auth.token`
  - Parola: yapılandırılmış `gateway.auth.password` veya
    `OPENCLAW_GATEWAY_PASSWORD` değerini çözümleyin
  - SecretRef ile yönetilen token: harici gizli anahtar sağlayıcısını çözümleyin veya
    bu kabukta `OPENCLAW_GATEWAY_TOKEN` dışa aktarın, ardından `openclaw dashboard` komutunu yeniden çalıştırın
  - Paylaşılan gizli anahtar yapılandırılmamış: `openclaw doctor --generate-gateway-token`
- Pano ayarlarında token'ı veya parolayı kimlik doğrulama alanına yapıştırın,
  ardından bağlanın.
- UI dil seçici **Genel Bakış -> Gateway Erişimi -> Dil** içindedir.
  Görünüm bölümünün değil, erişim kartının parçasıdır.

## İlgili

- [Kontrol Arayüzü](/tr/web/control-ui)
- [WebChat](/tr/web/webchat)
