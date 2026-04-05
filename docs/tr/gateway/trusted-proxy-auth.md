---
read_when:
    - OpenClaw'ı kimlik farkında bir proxy'nin arkasında çalıştırıyorsunuz
    - OpenClaw'ın önüne OAuth ile Pomerium, Caddy veya nginx kuruyorsunuz
    - Ters proxy kurulumlarında WebSocket 1008 yetkisiz hatalarını düzeltiyorsunuz
    - HSTS ve diğer HTTP güçlendirme başlıklarını nerede ayarlayacağınıza karar veriyorsunuz
summary: Gateway kimlik doğrulamasını güvenilen bir ters proxy'ye devredin (Pomerium, Caddy, nginx + OAuth)
title: Trusted Proxy Auth
x-i18n:
    generated_at: "2026-04-05T13:55:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccd39736b43e8744de31566d5597b3fbf40ecb6ba9c8ba9d2343e1ab9bb8cd45
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

# Trusted Proxy Auth

> ⚠️ **Güvenliğe duyarlı özellik.** Bu mod kimlik doğrulamayı tamamen ters proxy'nize devreder. Yanlış yapılandırma, Gateway'inizi yetkisiz erişime açabilir. Etkinleştirmeden önce bu sayfayı dikkatlice okuyun.

## Ne zaman kullanılmalı

Aşağıdaki durumlarda `trusted-proxy` kimlik doğrulama modunu kullanın:

- OpenClaw'ı **kimlik farkında bir proxy**'nin arkasında çalıştırıyorsunuz (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Proxy'niz tüm kimlik doğrulamayı yapıyor ve kullanıcı kimliğini başlıklar üzerinden iletiyor
- Proxy'nin Gateway'e giden tek yol olduğu bir Kubernetes veya kapsayıcı ortamındasınız
- Tarayıcılar WS yüklerinde token iletemediği için WebSocket `1008 unauthorized` hataları alıyorsunuz

## Ne zaman KULLANILMAMALI

- Proxy'niz kullanıcıların kimliğini doğrulamıyorsa (yalnızca bir TLS sonlandırıcı veya yük dengeleyici ise)
- Gateway'e proxy'yi atlayan herhangi bir yol varsa (güvenlik duvarı boşlukları, iç ağ erişimi)
- Proxy'nizin iletilen başlıkları doğru şekilde sıyırdığından/üzerine yazdığından emin değilseniz
- Yalnızca kişisel tek kullanıcılı erişime ihtiyacınız varsa (daha basit kurulum için Tailscale Serve + loopback değerlendirin)

## Nasıl çalışır

1. Ters proxy'niz kullanıcıların kimliğini doğrular (OAuth, OIDC, SAML vb.)
2. Proxy doğrulanmış kullanıcı kimliğini içeren bir başlık ekler (ör. `x-forwarded-user: nick@example.com`)
3. OpenClaw isteğin **güvenilen bir proxy IP'sinden** geldiğini denetler (`gateway.trustedProxies` içinde yapılandırılır)
4. OpenClaw kullanıcı kimliğini yapılandırılmış başlıktan çıkarır
5. Her şey uygunsa isteğe yetki verilir

## Kontrol UI eşleme davranışı

`gateway.auth.mode = "trusted-proxy"` etkin olduğunda ve istek
trusted-proxy denetimlerini geçtiğinde, Kontrol UI WebSocket oturumları cihaz
eşleme kimliği olmadan bağlanabilir.

Sonuçları:

- Bu modda Kontrol UI erişimi için eşleme artık birincil geçit değildir.
- Etkili erişim denetimi ters proxy kimlik doğrulama ilkeniz ve `allowUsers` olur.
- Gateway girişini yalnızca güvenilen proxy IP'lerine kilitli tutun (`gateway.trustedProxies` + güvenlik duvarı).

## Yapılandırma

```json5
{
  gateway: {
    // Trusted-proxy kimlik doğrulaması, loopback olmayan güvenilen bir proxy kaynağından gelen istekleri bekler
    bind: "lan",

    // KRİTİK: Buraya yalnızca proxy'nizin IP(ler)ini ekleyin
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Doğrulanmış kullanıcı kimliğini içeren başlık (zorunlu)
        userHeader: "x-forwarded-user",

        // İsteğe bağlı: MUTLAKA mevcut olması gereken başlıklar (proxy doğrulaması)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // İsteğe bağlı: belirli kullanıcılarla sınırla (boş = tümüne izin ver)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

Önemli çalışma zamanı kuralı:

- Trusted-proxy kimlik doğrulaması, loopback kaynaklı istekleri (`127.0.0.1`, `::1`, loopback CIDR'leri) reddeder.
- Aynı host üzerindeki loopback ters proxy'ler trusted-proxy kimlik doğrulamasını karşılamaz.
- Aynı host üzerindeki loopback proxy kurulumları için bunun yerine token/parola kimlik doğrulaması kullanın veya OpenClaw'ın doğrulayabileceği loopback olmayan güvenilen bir proxy adresi üzerinden yönlendirin.
- Loopback olmayan Kontrol UI dağıtımları yine de açık `gateway.controlUi.allowedOrigins` gerektirir.

### Yapılandırma başvurusu

| Alan                                        | Gerekli | Açıklama                                                                  |
| ------------------------------------------- | ------- | ------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Evet    | Güvenilecek proxy IP adresleri dizisi. Diğer IP'lerden gelen istekler reddedilir. |
| `gateway.auth.mode`                         | Evet    | `"trusted-proxy"` olmalıdır                                               |
| `gateway.auth.trustedProxy.userHeader`      | Evet    | Doğrulanmış kullanıcı kimliğini içeren başlık adı                         |
| `gateway.auth.trustedProxy.requiredHeaders` | Hayır   | İsteğin güvenilir sayılması için mevcut olması gereken ek başlıklar       |
| `gateway.auth.trustedProxy.allowUsers`      | Hayır   | Kullanıcı kimlikleri izin listesi. Boş olması, kimliği doğrulanmış tüm kullanıcılara izin verilmesi anlamına gelir. |

## TLS sonlandırma ve HSTS

Tek bir TLS sonlandırma noktası kullanın ve HSTS'yi orada uygulayın.

### Önerilen desen: proxy TLS sonlandırma

Ters proxy'niz `https://control.example.com` için HTTPS işliyorsa,
o alan adı için `Strict-Transport-Security` başlığını proxy üzerinde ayarlayın.

- İnternete açık dağıtımlar için uygundur.
- Sertifika + HTTP güçlendirme ilkesini tek yerde tutar.
- OpenClaw, proxy arkasında loopback HTTP üzerinde kalabilir.

Örnek başlık değeri:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Gateway TLS sonlandırma

OpenClaw HTTPS'yi doğrudan kendisi sunuyorsa (TLS sonlandıran proxy yoksa), şunu ayarlayın:

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

### Kullanıma alma kılavuzu

- Trafiği doğrularken önce kısa bir max age ile başlayın (örneğin `max-age=300`).
- Güven yüksek olduktan sonra uzun ömürlü değerlere yükseltin (örneğin `max-age=31536000`).
- `includeSubDomains` yalnızca her alt alan HTTPS için hazırsa eklenmelidir.
- preload yalnızca tüm alan adınız için preload gereksinimlerini kasıtlı olarak karşılıyorsanız kullanılmalıdır.
- Yalnızca loopback kullanan yerel geliştirme HSTS'den fayda görmez.

## Proxy kurulum örnekleri

### Pomerium

Pomerium kimliği `x-pomerium-claim-email` (veya diğer claim başlıkları) içinde ve JWT'yi `x-pomerium-jwt-assertion` içinde iletir.

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

`caddy-security` eklentisine sahip Caddy kullanıcıların kimliğini doğrulayabilir ve kimlik başlıkları iletebilir.

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

oauth2-proxy kullanıcıların kimliğini doğrular ve kimliği `x-auth-request-email` içinde iletir.

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
    trustedProxies: ["172.17.0.1"], // Traefik kapsayıcı IP'si
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

OpenClaw, hem `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`) hem de `trusted-proxy` modunun aynı anda etkin olduğu belirsiz yapılandırmaları reddeder. Karma token yapılandırmaları, loopback isteklerinin yanlış kimlik doğrulama yolunda sessizce doğrulanmasına neden olabilir.

Başlangıçta `mixed_trusted_proxy_token` hatası görürseniz:

- trusted-proxy modunu kullanırken paylaşılan token'ı kaldırın veya
- token tabanlı kimlik doğrulama istiyorsanız `gateway.auth.mode` değerini `"token"` yapın

Loopback trusted-proxy kimlik doğrulaması da güvenli şekilde kapanır: aynı host üzerindeki çağıranlar sessizce doğrulanmak yerine, güvenilen bir proxy üzerinden yapılandırılmış kimlik başlıklarını sağlamalıdır.

## Operatör kapsamları başlığı

Trusted-proxy kimlik doğrulaması **kimlik taşıyan** bir HTTP modudur, bu nedenle çağıranlar
isteğe bağlı olarak operatör kapsamlarını `x-openclaw-scopes` ile bildirebilir.

Örnekler:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Davranış:

- Başlık mevcut olduğunda, OpenClaw bildirilen kapsam kümesini dikkate alır.
- Başlık mevcut ama boş olduğunda, istek **hiç** operatör kapsamı bildirmez.
- Başlık yoksa, normal kimlik taşıyan HTTP API'leri standart operatör varsayılan kapsam kümesine geri döner.
- Gateway kimlik doğrulamalı **plugin HTTP rotaları** varsayılan olarak daha dardır: `x-openclaw-scopes` yoksa, çalışma zamanı kapsamı `operator.write` değerine geri döner.
- Tarayıcı kaynaklı HTTP istekleri, trusted-proxy kimlik doğrulaması başarılı olduktan sonra bile `gateway.controlUi.allowedOrigins` (veya bilinçli Host-header fallback modu) denetimini geçmek zorundadır.

Pratik kural:

- Bir trusted-proxy isteğinin varsayılanlardan daha dar olmasını istediğinizde veya bir gateway-auth plugin rotası için write kapsamından daha güçlü bir şey gerektiğinde `x-openclaw-scopes` başlığını açıkça gönderin.

## Güvenlik kontrol listesi

Trusted-proxy kimlik doğrulamasını etkinleştirmeden önce şunları doğrulayın:

- [ ] **Proxy tek yoldur**: Gateway portu, proxy'niz dışındaki her şeye karşı güvenlik duvarıyla kapalıdır
- [ ] **trustedProxies minimaldir**: tüm alt ağlar değil, yalnızca gerçek proxy IP'leriniz
- [ ] **Loopback proxy kaynağı yoktur**: trusted-proxy kimlik doğrulaması loopback kaynaklı isteklerde güvenli şekilde kapanır
- [ ] **Proxy başlıkları sıyırır**: proxy'niz istemcilerden gelen `x-forwarded-*` başlıklarının üzerine yazar (sona eklemez)
- [ ] **TLS sonlandırma**: proxy'niz TLS'yi işler; kullanıcılar HTTPS üzerinden bağlanır
- [ ] **allowedOrigins açıktır**: loopback olmayan Kontrol UI açık `gateway.controlUi.allowedOrigins` kullanır
- [ ] **allowUsers ayarlanmıştır** (önerilir): kimliği doğrulanmış herkese izin vermek yerine bilinen kullanıcılarla sınırlandırın
- [ ] **Karma token yapılandırması yoktur**: hem `gateway.auth.token` hem `gateway.auth.mode: "trusted-proxy"` ayarlamayın

## Güvenlik denetimi

`openclaw security audit`, trusted-proxy kimlik doğrulamasını **critical** önem düzeyinde bir bulgu olarak işaretler. Bu kasıtlıdır — güvenliği proxy kurulumunuza devrettiğinizi hatırlatır.

Denetim şunları denetler:

- Temel `gateway.trusted_proxy_auth` warning/critical hatırlatıcısı
- Eksik `trustedProxies` yapılandırması
- Eksik `userHeader` yapılandırması
- Boş `allowUsers` (kimliği doğrulanmış her kullanıcıya izin verir)
- Açığa çıkarılmış Kontrol UI yüzeylerinde joker veya eksik tarayıcı kaynak ilkesi

## Sorun giderme

### "trusted_proxy_untrusted_source"

İstek `gateway.trustedProxies` içindeki bir IP'den gelmedi. Şunları denetleyin:

- Proxy IP'si doğru mu? (Docker kapsayıcı IP'leri değişebilir)
- Proxy'nizin önünde bir yük dengeleyici var mı?
- Gerçek IP'leri bulmak için `docker inspect` veya `kubectl get pods -o wide` kullanın

### "trusted_proxy_loopback_source"

OpenClaw, loopback kaynaklı bir trusted-proxy isteğini reddetti.

Şunları denetleyin:

- Proxy `127.0.0.1` / `::1` üzerinden mi bağlanıyor?
- trusted-proxy kimlik doğrulamasını aynı host üzerindeki bir loopback ters proxy ile kullanmaya mı çalışıyorsunuz?

Düzeltme:

- Aynı host üzerindeki loopback proxy kurulumları için token/parola kimlik doğrulaması kullanın veya
- Loopback olmayan güvenilen bir proxy adresi üzerinden yönlendirin ve bu IP'yi `gateway.trustedProxies` içinde tutun.

### "trusted_proxy_user_missing"

Kullanıcı başlığı boştu veya eksikti. Şunları denetleyin:

- Proxy'niz kimlik başlıklarını iletecek şekilde yapılandırılmış mı?
- Başlık adı doğru mu? (büyük/küçük harf duyarsızdır ama yazım önemlidir)
- Kullanıcı gerçekten proxy üzerinde kimliği doğrulanmış mı?

### "trusted*proxy_missing_header*\*"

Gerekli bir başlık mevcut değildi. Şunları denetleyin:

- Bu belirli başlıklar için proxy yapılandırmanız
- Başlıkların zincirin bir yerinde sıyrılıp sıyrılmadığı

### "trusted_proxy_user_not_allowed"

Kullanıcının kimliği doğrulanmış ama `allowUsers` içinde değil. Ya ekleyin ya da izin listesini kaldırın.

### "trusted_proxy_origin_not_allowed"

Trusted-proxy kimlik doğrulaması başarılı oldu, ancak tarayıcı `Origin` başlığı Kontrol UI kaynak denetimlerini geçemedi.

Şunları denetleyin:

- `gateway.controlUi.allowedOrigins`, tam tarayıcı kaynağını içeriyor mu
- Bilerek herkese izin verme davranışı istemiyorsanız joker kaynaklara güvenmiyor olmanız
- Bilerek Host-header fallback modu kullanıyorsanız `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` değerinin açıkça ayarlanmış olması

### WebSocket hâlâ başarısız oluyor

Proxy'nizin şunları yaptığından emin olun:

- WebSocket yükseltmelerini desteklemesi (`Upgrade: websocket`, `Connection: upgrade`)
- Kimlik başlıklarını WebSocket yükseltme isteklerinde de iletmesi (yalnızca HTTP'de değil)
- WebSocket bağlantıları için ayrı bir kimlik doğrulama yoluna sahip olmaması

## Token kimlik doğrulamasından geçiş

Token kimlik doğrulamasından trusted-proxy'ye geçiyorsanız:

1. Proxy'nizi kullanıcı kimliği doğrulayacak ve başlıkları iletecek şekilde yapılandırın
2. Proxy kurulumunu bağımsız olarak test edin (başlıklarla `curl`)
3. OpenClaw yapılandırmasını trusted-proxy kimlik doğrulamasıyla güncelleyin
4. Gateway'i yeniden başlatın
5. Kontrol UI'dan WebSocket bağlantılarını test edin
6. `openclaw security audit` çalıştırın ve bulguları gözden geçirin

## İlgili

- [Security](/gateway/security) — tam güvenlik kılavuzu
- [Configuration](/gateway/configuration) — yapılandırma başvurusu
- [Remote Access](/gateway/remote) — diğer uzak erişim kalıpları
- [Tailscale](/gateway/tailscale) — yalnızca tailnet erişimi için daha basit alternatif
