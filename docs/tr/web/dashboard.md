---
read_when:
    - Pano kimlik doğrulamasını veya erişime açma modlarını değiştirirken
summary: Gateway panosu (Control UI) erişimi ve kimlik doğrulaması
title: Pano
x-i18n:
    generated_at: "2026-04-05T14:14:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 316e082ae4759f710b457487351e30c53b34c7c2b4bf84ad7b091a50538af5cc
    source_path: web/dashboard.md
    workflow: 15
---

# Pano (Control UI)

Gateway panosu, varsayılan olarak `/` altında sunulan tarayıcı tabanlı Control UI'dır
(`gateway.controlUi.basePath` ile geçersiz kılınabilir).

Hızlı açma (yerel Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))

Temel başvurular:

- Kullanım ve UI yetenekleri için [Control UI](/web/control-ui).
- Serve/Funnel otomasyonu için [Tailscale](/tr/gateway/tailscale).
- Bind modları ve güvenlik notları için [Web surfaces](/web).

Kimlik doğrulama, yapılandırılmış gateway kimlik doğrulama yolu üzerinden WebSocket
el sıkışmasında uygulanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik üst bilgileri
- `gateway.auth.mode: "trusted-proxy"` olduğunda trusted-proxy kimlik üst bilgileri

Bkz. [Gateway configuration](/tr/gateway/configuration) içindeki `gateway.auth`.

Güvenlik notu: Control UI bir **yönetici yüzeyidir** (sohbet, yapılandırma, exec onayları).
Bunu herkese açık şekilde erişime açmayın. UI, pano URL belirteçlerini mevcut tarayıcı sekmesi oturumu
ve seçilen gateway URL'si için `sessionStorage` içinde tutar ve yüklendikten sonra bunları URL'den kaldırır.
localhost, Tailscale Serve veya SSH tüneli tercih edin.

## Hızlı yol (önerilen)

- İlk kurulumdan sonra CLI panoyu otomatik olarak açar ve temiz (belirteç içermeyen) bir bağlantı yazdırır.
- İstediğiniz zaman yeniden açın: `openclaw dashboard` (bağlantıyı kopyalar, mümkünse tarayıcıyı açar, headless ise SSH ipucu gösterir).
- UI paylaşılan gizli anahtar kimlik doğrulaması isterse yapılandırılmış token'ı veya
  parolayı Control UI ayarlarına yapıştırın.

## Kimlik doğrulama temelleri (yerel ve uzak)

- **Localhost**: `http://127.0.0.1:18789/` adresini açın.
- **Paylaşılan gizli token kaynağı**: `gateway.auth.token` (veya
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` bunu tek seferlik önyükleme
  için URL fragment üzerinden iletebilir ve Control UI bunu `localStorage`
  yerine mevcut tarayıcı sekmesi oturumu ve seçilen gateway URL'si için `sessionStorage`
  içinde tutar.
- `gateway.auth.token` SecretRef tarafından yönetiliyorsa `openclaw dashboard`
  tasarım gereği belirteç içermeyen bir URL yazdırır/kopyalar/açar. Bu, harici olarak
  yönetilen token'ların kabuk günlüklerinde, pano geçmişinde veya tarayıcı başlatma
  argümanlarında açığa çıkmasını önler.
- `gateway.auth.token` bir SecretRef olarak yapılandırılmışsa ve mevcut
  shell'inizde çözümlenmemişse `openclaw dashboard` yine de belirteç içermeyen bir URL ile
  birlikte uygulanabilir kimlik doğrulama kurulum yönergeleri yazdırır.
- **Paylaşılan gizli parola**: yapılandırılmış `gateway.auth.password` değerini (veya
  `OPENCLAW_GATEWAY_PASSWORD`) kullanın. Pano, parolaları sayfa yenilemeleri arasında kalıcı olarak saklamaz.
- **Kimlik taşıyan modlar**: `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve,
  kimlik üst bilgileri üzerinden Control UI/WebSocket kimlik doğrulamasını karşılayabilir ve
  loopback olmayan, kimlik farkındalığına sahip bir reverse proxy
  `gateway.auth.mode: "trusted-proxy"` yapılandırmasında bunu karşılayabilir. Bu modlarda
  pano, WebSocket için yapıştırılmış bir paylaşılan gizli anahtara ihtiyaç duymaz.
- **Localhost değilse**: Tailscale Serve, loopback olmayan paylaşılan gizli anahtar bind'i,
  `gateway.auth.mode: "trusted-proxy"` ile loopback olmayan kimlik farkındalığına sahip bir reverse proxy
  veya bir SSH tüneli kullanın. HTTP API'leri, siz özel olarak private-ingress
  `gateway.auth.mode: "none"` veya trusted-proxy HTTP kimlik doğrulamasını çalıştırmadığınız sürece
  yine paylaşılan gizli anahtar kimlik doğrulamasını kullanır. Bkz.
  [Web surfaces](/web).

<a id="if-you-see-unauthorized-1008"></a>

## "unauthorized" / 1008 görürseniz

- Gateway'e erişilebildiğinden emin olun (yerel: `openclaw status`; uzak: SSH tüneli `ssh -N -L 18789:127.0.0.1:18789 user@host` ardından `http://127.0.0.1:18789/` adresini açın).
- `AUTH_TOKEN_MISMATCH` için istemciler, gateway yeniden deneme ipuçları döndürdüğünde önbelleğe alınmış bir cihaz token'ıyla bir güvenilir yeniden deneme yapabilir. Bu önbelleğe alınmış token yeniden denemesi, token'ın önbelleğe alınmış onaylı kapsamlarını yeniden kullanır; açık `deviceToken` / açık `scopes` çağıranları ise istedikleri kapsam kümesini korur. Kimlik doğrulama bu yeniden denemeden sonra da başarısız olursa token kaymasını el ile çözün.
- Bu yeniden deneme yolunun dışında connect kimlik doğrulama önceliği nettir: önce açık paylaşılan token/parola, sonra açık `deviceToken`, ardından depolanmış cihaz token'ı, en son önyükleme token'ı.
- Eşzamansız Tailscale Serve Control UI yolunda, aynı
  `{scope, ip}` için başarısız denemeler, başarısız kimlik doğrulama sınırlayıcısı bunları kaydetmeden önce serileştirilir; bu nedenle eşzamanlı ikinci kötü yeniden deneme zaten `retry later` gösterebilir.
- Token kayması onarım adımları için [Token drift recovery checklist](/cli/devices#token-drift-recovery-checklist) bölümünü izleyin.
- Paylaşılan gizli anahtarı gateway ana makinesinden alın veya sağlayın:
  - Token: `openclaw config get gateway.auth.token`
  - Parola: yapılandırılmış `gateway.auth.password` veya
    `OPENCLAW_GATEWAY_PASSWORD` değerini çözümleyin
  - SecretRef tarafından yönetilen token: harici gizli anahtar sağlayıcısını çözümleyin veya
    bu shell'de `OPENCLAW_GATEWAY_TOKEN` dışa aktarın, ardından `openclaw dashboard`
    komutunu yeniden çalıştırın
  - Yapılandırılmış paylaşılan gizli anahtar yoksa: `openclaw doctor --generate-gateway-token`
- Pano ayarlarında token'ı veya parolayı kimlik doğrulama alanına yapıştırın,
  ardından bağlanın.
