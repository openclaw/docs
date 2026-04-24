---
read_when:
    - OpenClaw'ı kimlik farkındalıklı bir proxy arkasında çalıştırma
    - OpenClaw'ın önünde OAuth ile Pomerium, Caddy veya nginx kurma
    - Reverse proxy kurulumlarında WebSocket 1008 yetkisiz hatalarını düzeltme
    - HSTS ve diğer HTTP sağlamlaştırma başlıklarının nerede ayarlanacağına karar verme
summary: Gateway kimlik doğrulamasını güvenilir bir reverse proxy'ye devredin (Pomerium, Caddy, nginx + OAuth)
title: Trusted proxy auth
x-i18n:
    generated_at: "2026-04-24T09:12:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: af406f218fb91c5ae2fed04921670bfc4cd3d06f51b08eec91cddde4521bf771
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

> ⚠️ **Güvenlik açısından hassas özellik.** Bu mod, kimlik doğrulamayı tamamen reverse proxy'nize devreder. Yanlış yapılandırma, Gateway'inizi yetkisiz erişime açabilir. Etkinleştirmeden önce bu sayfayı dikkatle okuyun.

## Ne zaman kullanılmalı

`trusted-proxy` auth modunu şu durumlarda kullanın:

- OpenClaw'ı **kimlik farkındalıklı bir proxy** arkasında çalıştırıyorsanız (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Proxy'niz tüm kimlik doğrulamayı yapıyor ve kullanıcı kimliğini başlıklar üzerinden iletiyorsa
- Proxy'nin Gateway'e giden tek yol olduğu bir Kubernetes veya container ortamındaysanız
- Tarayıcılar WS payload'larında token geçiremediği için WebSocket `1008 unauthorized` hataları alıyorsanız

## Ne zaman KULLANILMAMALI

- Proxy'niz kullanıcıları kimlik doğrulamıyorsa (yalnızca TLS sonlandırıcı veya yük dengeleyici ise)
- Gateway'e proxy'yi atlayan herhangi bir yol varsa (güvenlik duvarı boşlukları, iç ağ erişimi)
- Proxy'nizin iletilen başlıkları doğru şekilde kaldırıp/üzerine yazdığından emin değilseniz
- Yalnızca kişisel tek kullanıcılı erişime ihtiyacınız varsa (daha basit kurulum için Tailscale Serve + local loopback düşünün)

## Nasıl çalışır

1. Reverse proxy'niz kullanıcıları kimlik doğrular (OAuth, OIDC, SAML vb.)
2. Proxy, kimliği doğrulanmış kullanıcı kimliğini içeren bir başlık ekler (ör. `x-forwarded-user: nick@example.com`)
3. OpenClaw, isteğin **güvenilir bir proxy IP**'sinden geldiğini kontrol eder (`gateway.trustedProxies` içinde yapılandırılır)
4. OpenClaw, kullanıcı kimliğini yapılandırılmış başlıktan çıkarır
5. Her şey doğruysa istek yetkilendirilir

## Control UI eşleştirme davranışı

`gateway.auth.mode = "trusted-proxy"` etkin olduğunda ve istek
trusted-proxy denetimlerini geçtiğinde, Control UI WebSocket oturumları cihaz
eşleştirme kimliği olmadan bağlanabilir.

Sonuçları:

- Bu modda Control UI erişimi için eşleştirme artık birincil kapı değildir.
- Reverse proxy auth ilkeniz ve `allowUsers` etkin erişim denetimi haline gelir.
- Gateway girişini yalnızca güvenilir proxy IP'lerine kilitli tutun (`gateway.trustedProxies` + güvenlik duvarı).

## Yapılandırma

```json5
{
  gateway: {
    // Trusted-proxy auth, local loopback olmayan güvenilir bir proxy kaynağından gelen istekleri bekler
    bind: "lan",

    // KRİTİK: Buraya yalnızca proxy IP(ler)inizi ekleyin
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Kimliği doğrulanmış kullanıcı kimliğini içeren başlık (gerekli)
        userHeader: "x-forwarded-user",

        // İsteğe bağlı: MUTLAKA bulunması gereken başlıklar (proxy doğrulaması)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // İsteğe bağlı: belirli kullanıcılarla sınırla (boş = tümüne izin ver)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

Önemli çalışma zamanı kuralı:

- Trusted-proxy auth, local loopback kaynaklı istekleri reddeder (`127.0.0.1`, `::1`, local loopback CIDR'leri).
- Aynı host üzerindeki local loopback reverse proxy'ler trusted-proxy auth koşulunu **karşılamaz**.
- Aynı host local loopback proxy kurulumları için bunun yerine token/password auth kullanın veya OpenClaw'ın doğrulayabileceği local loopback olmayan güvenilir proxy adresi üzerinden yönlendirin.
- Local loopback olmayan Control UI dağıtımları yine de açık `gateway.controlUi.allowedOrigins` gerektirir.
- **Forwarded-header kanıtı local loopback yerelliğini geçersiz kılar.** Bir istek local loopback üzerinde gelirse ama `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` başlıkları local olmayan bir kaynağı gösteriyorsa, bu kanıt local loopback yerellik iddiasını geçersiz kılar. İstek; eşleştirme, trusted-proxy auth ve Control UI cihaz kimliği geçitlemesi açısından uzak olarak değerlendirilir. Bu, aynı host local loopback proxy'nin iletilen başlık kimliğini trusted-proxy auth'a aklamasını önler.

### Yapılandırma başvurusu

| Alan                                        | Gerekli | Açıklama                                                                  |
| ------------------------------------------- | ------- | ------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Evet    | Güvenilecek proxy IP adresleri dizisi. Diğer IP'lerden gelen istekler reddedilir. |
| `gateway.auth.mode`                         | Evet    | `"trusted-proxy"` olmalıdır                                               |
| `gateway.auth.trustedProxy.userHeader`      | Evet    | Kimliği doğrulanmış kullanıcı kimliğini içeren başlık adı                 |
| `gateway.auth.trustedProxy.requiredHeaders` | Hayır   | İsteğin güvenilir sayılması için bulunması gereken ek başlıklar           |
| `gateway.auth.trustedProxy.allowUsers`      | Hayır   | Kullanıcı kimliği allowlist'i. Boş olması, kimliği doğrulanmış tüm kullanıcılara izin verildiği anlamına gelir. |

## TLS sonlandırma ve HSTS

Tek bir TLS sonlandırma noktası kullanın ve HSTS'yi orada uygulayın.

### Önerilen desen: proxy TLS sonlandırması

Reverse proxy'niz `https://control.example.com` için HTTPS'i yönetiyorsa
`Strict-Transport-Security` başlığını o etki alanı için proxy üzerinde ayarlayın.

- İnternete açık dağıtımlar için uygundur.
- Sertifika + HTTP sağlamlaştırma ilkesini tek yerde tutar.
- OpenClaw, proxy arkasında local loopback HTTP üzerinde kalabilir.

Örnek başlık değeri:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Gateway TLS sonlandırması

OpenClaw HTTPS'i doğrudan kendisi sunuyorsa (TLS sonlandıran proxy yoksa), şunu ayarlayın:

```json5
{
  gateway: {
    tls: { enabled: true },
    http: {
      securityHeaders: {
        strictTransportSecurity: "max-age=31536000; includeSubDomains",
      },
    },
  },
}
```

`strictTransportSecurity`, string bir başlık değeri veya açıkça devre dışı bırakmak için `false` kabul eder.

### Yayına alma yönergeleri

- Trafiği doğrularken önce kısa bir max age ile başlayın (örneğin `max-age=300`).
- Yalnızca güven yüksek olduğunda uzun ömürlü değerlere çıkarın (örneğin `max-age=31536000`).
- Yalnızca her alt etki alanı HTTPS'e hazırsa `includeSubDomains` ekleyin.
- Preload'u yalnızca tüm etki alanı kümeniz için preload gereksinimlerini bilerek karşılıyorsanız kullanın.
- Yalnızca local loopback olan yerel geliştirme HSTS'den fayda görmez.

## Proxy kurulum örnekleri

### Pomerium

Pomerium, kimliği `x-pomerium-claim-email` (veya diğer claim başlıkları) ve JWT'yi `x-pomerium-jwt-assertion` içinde geçirir.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // Pomerium IP'si
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-pomerium-claim-email",
        requiredHeaders: ["x-pomerium-jwt-assertion"],
      },
    },
  },
}
```

Pomerium yapılandırma parçası:

```yaml
routes:
  - from: https://openclaw.example.com
    to: http://openclaw-gateway:18789
    policy:
      - allow:
          or:
            - email:
                is: nick@example.com
    pass_identity_headers: true
```

### OAuth ile Caddy

`caddy-security` plugin'li Caddy kullanıcıları kimlik doğrulayabilir ve kimlik başlıkları geçirebilir.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // Caddy/sidecar proxy IP'si
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

Caddyfile parçası:

```
openclaw.example.com {
    authenticate with oauth2_provider
    authorize with policy1

    reverse_proxy openclaw:18789 {
        header_up X-Forwarded-User {http.auth.user.email}
    }
}
```

### nginx + oauth2-proxy

oauth2-proxy kullanıcıları kimlik doğrular ve kimliği `x-auth-request-email` içinde geçirir.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP'si
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-auth-request-email",
      },
    },
  },
}
```

nginx yapılandırma parçası:

```nginx
location / {
    auth_request /oauth2/auth;
    auth_request_set $user $upstream_http_x_auth_request_email;

    proxy_pass http://openclaw:18789;
    proxy_set_header X-Auth-Request-Email $user;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Forward Auth ile Traefik

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // Traefik container IP'si
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

## Karma token yapılandırması

OpenClaw, aynı anda hem `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`) hem de `trusted-proxy` modu etkin olduğunda belirsiz yapılandırmaları reddeder. Karma token yapılandırmaları, local loopback isteklerinin yanlış auth yolunda sessizce kimlik doğrulamasına neden olabilir.

Başlangıçta `mixed_trusted_proxy_token` hatası görürseniz:

- Trusted-proxy modu kullanırken paylaşılan token'ı kaldırın, veya
- Token tabanlı auth istiyorsanız `gateway.auth.mode` değerini `"token"` olarak değiştirin.

Loopback trusted-proxy auth da kapalı başarısız olur: aynı host çağıranları, sessizce kimlik doğrulanmak yerine yapılandırılmış kimlik başlıklarını güvenilir proxy üzerinden sağlamalıdır.

## Operatör kapsamları başlığı

Trusted-proxy auth, **kimlik taşıyan** bir HTTP modudur; bu nedenle çağıranlar
isteğe bağlı olarak `x-openclaw-scopes` ile operatör kapsamlarını bildirebilir.

Örnekler:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Davranış:

- Başlık mevcut olduğunda OpenClaw bildirilen kapsam kümesini dikkate alır.
- Başlık mevcut ama boş olduğunda istek **hiç** operatör kapsamı bildirmez.
- Başlık yoksa normal kimlik taşıyan HTTP API'leri standart operatör varsayılan kapsam kümesine geri düşer.
- Gateway-auth **plugin HTTP route**'ları varsayılan olarak daha dardır: `x-openclaw-scopes` yoksa bunların çalışma zamanı kapsamı `operator.write` değerine geri düşer.
- Tarayıcı kaynaklı HTTP istekleri, trusted-proxy auth başarılı olduktan sonra bile yine de `gateway.controlUi.allowedOrigins` (veya bilinçli Host-header fallback modu) denetiminden geçmelidir.

Pratik kural:

- Trusted-proxy isteğinin varsayılanlardan daha dar olmasını istediğinizde veya bir gateway-auth plugin route'unun write kapsamından daha güçlü bir şeye ihtiyacı olduğunda `x-openclaw-scopes` başlığını açıkça gönderin.

## Güvenlik kontrol listesi

Trusted-proxy auth'u etkinleştirmeden önce şunları doğrulayın:

- [ ] **Proxy tek yol**: Gateway portu, proxy dışında her şeye karşı güvenlik duvarıyla kapalı
- [ ] **trustedProxies minimal**: tüm alt ağlar değil, yalnızca gerçek proxy IP'leriniz
- [ ] **Loopback proxy kaynağı yok**: trusted-proxy auth, local loopback kaynaklı isteklerde kapalı başarısız olur
- [ ] **Proxy başlıkları temizler**: proxy'niz istemcilerden gelen `x-forwarded-*` başlıklarını eklemek yerine üzerine yazar
- [ ] **TLS sonlandırma**: proxy'niz TLS'i yönetir; kullanıcılar HTTPS üzerinden bağlanır
- [ ] **allowedOrigins açık**: local loopback olmayan Control UI, açık `gateway.controlUi.allowedOrigins` kullanır
- [ ] **allowUsers ayarlı** (önerilir): kimliği doğrulanmış herkese izin vermek yerine bilinen kullanıcılarla sınırlandırın
- [ ] **Karma token yapılandırması yok**: hem `gateway.auth.token` hem de `gateway.auth.mode: "trusted-proxy"` ayarlamayın

## Güvenlik denetimi

`openclaw security audit`, trusted-proxy auth'u **kritik** şiddette bir bulgu olarak işaretler. Bu kasıtlıdır — güvenliği proxy kurulumunuza devrettiğinizi hatırlatır.

Denetimin kontrol ettikleri:

- Temel `gateway.trusted_proxy_auth` uyarısı/kritik hatırlatma
- Eksik `trustedProxies` yapılandırması
- Eksik `userHeader` yapılandırması
- Boş `allowUsers` (kimliği doğrulanmış herhangi bir kullanıcıya izin verir)
- Açığa çıkan Control UI yüzeylerinde joker karakterli veya eksik tarayıcı kaynak ilkesi

## Sorun giderme

### "trusted_proxy_untrusted_source"

İstek, `gateway.trustedProxies` içindeki bir IP'den gelmedi. Şunları kontrol edin:

- Proxy IP'si doğru mu? (Docker container IP'leri değişebilir)
- Proxy'nizin önünde bir yük dengeleyici var mı?
- Gerçek IP'leri bulmak için `docker inspect` veya `kubectl get pods -o wide` kullanın

### "trusted_proxy_loopback_source"

OpenClaw, local loopback kaynaklı bir trusted-proxy isteğini reddetti.

Şunları kontrol edin:

- Proxy `127.0.0.1` / `::1` üzerinden mi bağlanıyor?
- Trusted-proxy auth'u aynı host local loopback reverse proxy ile mi kullanmaya çalışıyorsunuz?

Düzeltme:

- Aynı host local loopback proxy kurulumları için token/password auth kullanın, veya
- Local loopback olmayan güvenilir bir proxy adresi üzerinden yönlendirin ve o IP'yi `gateway.trustedProxies` içinde tutun.

### "trusted_proxy_user_missing"

Kullanıcı başlığı boştu veya eksikti. Şunları kontrol edin:

- Proxy'niz kimlik başlıklarını iletecek şekilde yapılandırılmış mı?
- Başlık adı doğru mu? (büyük/küçük harf duyarsızdır, ama yazım önemlidir)
- Kullanıcı gerçekten proxy üzerinde kimlik doğrulamış mı?

### "trusted*proxy_missing_header*\*"

Gerekli bir başlık mevcut değildi. Şunları kontrol edin:

- Proxy yapılandırmanızda o belirli başlıklar
- Başlıkların zincirin bir yerinde kaldırılıp kaldırılmadığı

### "trusted_proxy_user_not_allowed"

Kullanıcı kimlik doğrulamış, ancak `allowUsers` içinde değil. Ya ekleyin ya da allowlist'i kaldırın.

### "trusted_proxy_origin_not_allowed"

Trusted-proxy auth başarılı oldu, ancak tarayıcı `Origin` başlığı Control UI kaynak denetimlerini geçemedi.

Şunları kontrol edin:

- `gateway.controlUi.allowedOrigins` tam tarayıcı kaynağını içeriyor mu
- Bilerek herkese izin verme davranışı istemiyorsanız joker kaynaklara güvenmiyor musunuz
- Bilerek Host-header fallback modu kullanıyorsanız, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` alanı bilinçli olarak ayarlanmış mı

### WebSocket hâlâ başarısız oluyor

Proxy'nizin şunları yaptığından emin olun:

- WebSocket yükseltmelerini desteklemesi (`Upgrade: websocket`, `Connection: upgrade`)
- Kimlik başlıklarını WebSocket yükseltme isteklerinde de geçirmesi (yalnızca HTTP'de değil)
- WebSocket bağlantıları için ayrı bir auth yoluna sahip olmaması

## Token auth'dan geçiş

Token auth'dan trusted-proxy'ye geçiyorsanız:

1. Proxy'nizi kullanıcıları kimlik doğrulayacak ve başlıkları geçirecek şekilde yapılandırın
2. Proxy kurulumunu bağımsız olarak test edin (başlıklarla curl)
3. OpenClaw yapılandırmasını trusted-proxy auth ile güncelleyin
4. Gateway'i yeniden başlatın
5. Control UI'den WebSocket bağlantılarını test edin
6. `openclaw security audit` çalıştırın ve bulguları inceleyin

## İlgili

- [Security](/tr/gateway/security) — tam güvenlik kılavuzu
- [Configuration](/tr/gateway/configuration) — yapılandırma başvurusu
- [Remote Access](/tr/gateway/remote) — diğer uzak erişim desenleri
- [Tailscale](/tr/gateway/tailscale) — yalnızca tailnet erişimi için daha basit alternatif
