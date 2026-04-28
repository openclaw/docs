---
read_when:
    - OpenClaw'ı kimlik farkındalıklı bir proxy arkasında çalıştırma
    - OpenClaw'ın önüne OAuth ile Pomerium, Caddy veya nginx kurma
    - Reverse proxy kurulumlarında WebSocket 1008 yetkisiz hatalarını düzeltme
    - HSTS ve diğer HTTP sağlamlaştırma üstbilgilerinin nerede ayarlanacağına karar verme
sidebarTitle: Trusted proxy auth
summary: Gateway kimlik doğrulamasını güvenilen bir reverse proxy'ye devretme (Pomerium, Caddy, nginx + OAuth)
title: Güvenilen proxy kimlik doğrulaması
x-i18n:
    generated_at: "2026-04-26T11:32:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64e0f4dee942aedec548135f0408e7773e7b498f8262af13a4d0eff262cae646
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

<Warning>
**Güvenlik açısından hassas özellik.** Bu mod kimlik doğrulamayı tamamen reverse proxy'nize devreder. Yanlış yapılandırma Gateway'inizi yetkisiz erişime açabilir. Etkinleştirmeden önce bu sayfayı dikkatle okuyun.
</Warning>

## Ne zaman kullanılmalı

Şu durumlarda `trusted-proxy` auth modunu kullanın:

- OpenClaw'ı bir **kimlik farkındalıklı proxy** arkasında çalıştırıyorsunuz (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Proxy'niz tüm kimlik doğrulamayı yapıyor ve kullanıcı kimliğini üstbilgiler üzerinden iletiyor.
- Proxy'nin Gateway'e giden tek yol olduğu bir Kubernetes veya kapsayıcı ortamındasınız.
- Tarayıcılar belirteçleri WS yüklerinde geçiremediği için WebSocket `1008 unauthorized` hataları alıyorsunuz.

## Ne zaman KULLANILMAMALI

- Proxy'niz kullanıcı kimliği doğrulaması yapmıyorsa (yalnızca TLS sonlandırıcı veya yük dengeleyici ise).
- Gateway'e proxy'yi atlayan herhangi bir yol varsa (güvenlik duvarı boşlukları, iç ağ erişimi).
- Proxy'nizin iletilen üstbilgileri doğru biçimde temizlediğinden/üzerine yazdığından emin değilseniz.
- Yalnızca kişisel tek kullanıcılı erişime ihtiyacınız varsa (daha basit kurulum için Tailscale Serve + loopback düşünün).

## Nasıl çalışır

<Steps>
  <Step title="Proxy kullanıcıyı kimlik doğrular">
    Reverse proxy'niz kullanıcıları kimlik doğrular (OAuth, OIDC, SAML vb.).
  </Step>
  <Step title="Proxy bir kimlik üstbilgisi ekler">
    Proxy, kimliği doğrulanmış kullanıcı kimliğini içeren bir üstbilgi ekler (örn. `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway güvenilen kaynağı doğrular">
    OpenClaw isteğin **güvenilen bir proxy IP**'sinden geldiğini denetler (`gateway.trustedProxies` içinde yapılandırılır).
  </Step>
  <Step title="Gateway kimliği çıkarır">
    OpenClaw, yapılandırılmış üstbilgiden kullanıcı kimliğini çıkarır.
  </Step>
  <Step title="Yetkilendirme">
    Her şey doğruysa istek yetkilendirilir.
  </Step>
</Steps>

## Control UI eşleştirme davranışı

`gateway.auth.mode = "trusted-proxy"` etkin olduğunda ve istek trusted-proxy denetimlerini geçtiğinde, Control UI WebSocket oturumları cihaz eşleştirme kimliği olmadan bağlanabilir.

Sonuçları:

- Eşleştirme artık bu modda Control UI erişimi için birincil geçit değildir.
- Reverse proxy auth ilkeniz ve `allowUsers`, fiili erişim denetimi haline gelir.
- Gateway girişini yalnızca güvenilen proxy IP'lerine kilitli tutun (`gateway.trustedProxies` + güvenlik duvarı).

## Yapılandırma

```json5
{
  gateway: {
    // Trusted-proxy auth, loopback olmayan güvenilen bir proxy kaynağından gelen istekleri bekler
    bind: "lan",

    // KRİTİK: Buraya yalnızca proxy'nizin IP'lerini ekleyin
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Kimliği doğrulanmış kullanıcı kimliğini içeren üstbilgi (gerekli)
        userHeader: "x-forwarded-user",

        // İsteğe bağlı: MUTLAKA mevcut olması gereken üstbilgiler (proxy doğrulaması)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // İsteğe bağlı: belirli kullanıcılarla sınırla (boş = herkese izin ver)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

<Warning>
**Önemli çalışma zamanı kuralları**

- Trusted-proxy auth, loopback kaynaklı istekleri reddeder (`127.0.0.1`, `::1`, loopback CIDR'leri).
- Aynı host üzerindeki loopback reverse proxy'ler trusted-proxy auth'u karşılamaz.
- Aynı host loopback proxy kurulumları için bunun yerine token/password auth kullanın veya OpenClaw'ın doğrulayabileceği loopback olmayan güvenilen bir proxy adresi üzerinden yönlendirin.
- Loopback olmayan Control UI dağıtımları yine de açık `gateway.controlUi.allowedOrigins` gerektirir.
- **Forwarded-header kanıtı, loopback yerelliğini geçersiz kılar.** Bir istek loopback üzerinden gelirse ama yerel olmayan bir kökeni işaret eden `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` üstbilgileri taşıyorsa, bu kanıt loopback yerellik iddiasını geçersiz kılar. İstek eşleştirme, trusted-proxy auth ve Control UI cihaz-kimliği geçitlemesi açısından uzak kabul edilir. Bu, aynı host üzerindeki bir loopback proxy'nin iletilen üstbilgi kimliğini trusted-proxy auth içine aklamasını önler.

</Warning>

### Yapılandırma başvurusu

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Güvenilecek proxy IP adresleri dizisi. Diğer IP'lerden gelen istekler reddedilir.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  `"trusted-proxy"` olmalıdır.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Kimliği doğrulanmış kullanıcı kimliğini içeren üstbilgi adı.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  İsteğin güvenilir sayılması için mevcut olması gereken ek üstbilgiler.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Kullanıcı kimlikleri için izin listesi. Boş olması, kimliği doğrulanmış tüm kullanıcılara izin vermek anlamına gelir.
</ParamField>

## TLS sonlandırma ve HSTS

Tek bir TLS sonlandırma noktası kullanın ve HSTS'yi orada uygulayın.

<Tabs>
  <Tab title="Proxy TLS sonlandırma (önerilen)">
    Reverse proxy'niz `https://control.example.com` için HTTPS işliyorsa, `Strict-Transport-Security` üstbilgisini o alan adı için proxy üzerinde ayarlayın.

    - İnternete açık dağıtımlar için uygundur.
    - Sertifika + HTTP sağlamlaştırma ilkesini tek yerde tutar.
    - OpenClaw proxy arkasında loopback HTTP üzerinde kalabilir.

    Örnek üstbilgi değeri:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS sonlandırma">
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

    `strictTransportSecurity`, bir dizge üstbilgi değeri veya açıkça devre dışı bırakmak için `false` kabul eder.

  </Tab>
</Tabs>

### Dağıtım rehberliği

- Trafiği doğrularken önce kısa bir max age ile başlayın (örneğin `max-age=300`).
- Yalnızca güven yüksek olduktan sonra uzun ömürlü değerlere çıkarın (örneğin `max-age=31536000`).
- `includeSubDomains` değerini yalnızca her alt alan HTTPS'ye hazırsa ekleyin.
- Preload'u yalnızca tam alan kümeniz için preload gereksinimlerini bilinçli olarak karşılıyorsanız kullanın.
- Yalnızca loopback yerel geliştirme HSTS'den fayda sağlamaz.

## Proxy kurulum örnekleri

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium, kimliği `x-pomerium-claim-email` (veya diğer claim üstbilgileri) içinde ve bir JWT'yi `x-pomerium-jwt-assertion` içinde geçirir.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Pomerium'un IP'si
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

    Pomerium yapılandırma parçacığı:

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

  </Accordion>
  <Accordion title="OAuth ile Caddy">
    `caddy-security` Plugin'i ile Caddy kullanıcıları kimlik doğrulayabilir ve kimlik üstbilgileri geçirebilir.

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

    Caddyfile parçacığı:

    ```
    openclaw.example.com {
        authenticate with oauth2_provider
        authorize with policy1

        reverse_proxy openclaw:18789 {
            header_up X-Forwarded-User {http.auth.user.email}
        }
    }
    ```

  </Accordion>
  <Accordion title="nginx + oauth2-proxy">
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

    nginx yapılandırma parçacığı:

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

  </Accordion>
  <Accordion title="Forward auth ile Traefik">
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
  </Accordion>
</AccordionGroup>

## Karışık token yapılandırması

OpenClaw, hem `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`) hem de `trusted-proxy` modunun aynı anda etkin olduğu belirsiz yapılandırmaları reddeder. Karışık token yapılandırmaları, loopback isteklerinin sessizce yanlış auth yolu üzerinden kimlik doğrulaması yapmasına neden olabilir.

Başlangıçta `mixed_trusted_proxy_token` hatası görürseniz:

- Trusted-proxy modu kullanırken paylaşılan token'ı kaldırın veya
- Token tabanlı auth kullanmak istiyorsanız `gateway.auth.mode` değerini `"token"` olarak değiştirin.

Loopback trusted-proxy auth da kapalı kalacak şekilde başarısız olur: aynı host üzerindeki çağıranlar, sessizce kimlik doğrulanmak yerine yapılandırılmış kimlik üstbilgilerini güvenilen bir proxy üzerinden iletmelidir.

## Operator kapsamları üstbilgisi

Trusted-proxy auth, **kimlik taşıyan** bir HTTP modudur; bu nedenle çağıranlar operator kapsamlarını isteğe bağlı olarak `x-openclaw-scopes` ile bildirebilir.

Örnekler:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Davranış:

- Üstbilgi varsa, OpenClaw bildirilen kapsam kümesine uyar.
- Üstbilgi varsa ama boşsa, istek **hiçbir** operator kapsamı bildirmez.
- Üstbilgi yoksa, normal kimlik taşıyan HTTP API'leri standart varsayılan operator kapsam kümesine geri döner.
- Gateway-auth **Plugin HTTP rotaları** varsayılan olarak daha dardır: `x-openclaw-scopes` yoksa, bunların çalışma zamanı kapsamı `operator.write` değerine geri döner.
- Tarayıcı kökenli HTTP istekleri, trusted-proxy auth başarılı olduktan sonra bile yine `gateway.controlUi.allowedOrigins` (veya bilinçli Host-header geri dönüş modu) denetiminden geçmek zorundadır.

Pratik kural: Bir trusted-proxy isteğinin varsayılanlardan daha dar olmasını istediğinizde veya gateway-auth Plugin rotasının write kapsamından daha güçlü bir şeye ihtiyaç duyduğu durumlarda `x-openclaw-scopes` değerini açıkça gönderin.

## Güvenlik denetim listesi

Trusted-proxy auth'u etkinleştirmeden önce şunları doğrulayın:

- [ ] **Proxy tek yol**: Gateway portu, proxy'niz dışında her şeye karşı güvenlik duvarıyla kapatılmış.
- [ ] **trustedProxies minimum**: Tüm alt ağlar değil, yalnızca gerçek proxy IP'leriniz.
- [ ] **Loopback proxy kaynağı yok**: trusted-proxy auth, loopback kaynaklı isteklerde kapalı kalacak şekilde başarısız olur.
- [ ] **Proxy üstbilgileri temizliyor**: Proxy'niz istemcilerden gelen `x-forwarded-*` üstbilgilerinin üzerine yazar (eklemez).
- [ ] **TLS sonlandırma**: Proxy'niz TLS'i işler; kullanıcılar HTTPS üzerinden bağlanır.
- [ ] **allowedOrigins açık**: Loopback olmayan Control UI açık `gateway.controlUi.allowedOrigins` kullanır.
- [ ] **allowUsers ayarlı** (önerilen): Kimliği doğrulanmış herkese izin vermek yerine bilinen kullanıcılarla sınırlandırın.
- [ ] **Karışık token yapılandırması yok**: Hem `gateway.auth.token` hem de `gateway.auth.mode: "trusted-proxy"` ayarlamayın.

## Güvenlik denetimi

`openclaw security audit`, trusted-proxy auth'u **kritik** önem düzeyinde bir bulgu olarak işaretler. Bu kasıtlıdır — güvenliği proxy kurulumunuza devrettiğinizi hatırlatır.

Denetimin denetlediği şeyler:

- Temel `gateway.trusted_proxy_auth` uyarısı/kritik hatırlatma
- Eksik `trustedProxies` yapılandırması
- Eksik `userHeader` yapılandırması
- Boş `allowUsers` (kimliği doğrulanmış her kullanıcıya izin verir)
- Açığa açık Control UI yüzeylerinde joker karakterli veya eksik tarayıcı-köken ilkesi

## Sorun giderme

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    İstek, `gateway.trustedProxies` içindeki bir IP'den gelmedi. Şunları denetleyin:

    - Proxy IP'si doğru mu? (Docker kapsayıcı IP'leri değişebilir.)
    - Proxy'nizin önünde bir yük dengeleyici var mı?
    - Gerçek IP'leri bulmak için `docker inspect` veya `kubectl get pods -o wide` kullanın.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw, loopback kaynaklı bir trusted-proxy isteğini reddetti.

    Şunları denetleyin:

    - Proxy `127.0.0.1` / `::1` üzerinden mi bağlanıyor?
    - Trusted-proxy auth'u aynı host üzerindeki loopback reverse proxy ile mi kullanmaya çalışıyorsunuz?

    Düzeltme:

    - Aynı host loopback proxy kurulumları için token/password auth kullanın veya
    - Loopback olmayan güvenilen bir proxy adresi üzerinden yönlendirin ve bu IP'yi `gateway.trustedProxies` içinde tutun.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Kullanıcı üstbilgisi boştu veya eksikti. Şunları denetleyin:

    - Proxy'niz kimlik üstbilgilerini geçecek şekilde yapılandırılmış mı?
    - Üstbilgi adı doğru mu? (Büyük/küçük harfe duyarlı değil, ama yazım önemlidir)
    - Kullanıcı gerçekten proxy'de kimlik doğrulamasından geçmiş mi?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Gerekli bir üstbilgi mevcut değildi. Şunları denetleyin:

    - Proxy yapılandırmanızı, özellikle o üstbilgiler için.
    - Üstbilgilerin zincirin bir yerinde temizlenip temizlenmediğini.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Kullanıcı kimlik doğrulamasından geçti ama `allowUsers` içinde değil. Ya ekleyin ya da izin listesini kaldırın.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Trusted-proxy auth başarılı oldu, ancak tarayıcı `Origin` üstbilgisi Control UI köken denetimlerinden geçmedi.

    Şunları denetleyin:

    - `gateway.controlUi.allowedOrigins`, tam tarayıcı kökenini içeriyor.
    - Bilinçli olarak herkese izin veren bir davranış istemiyorsanız joker karakterli kökenlere güvenmiyorsunuz.
    - Bilinçli olarak Host-header geri dönüş modunu kullanıyorsanız, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` açıkça ayarlanmış.

  </Accordion>
  <Accordion title="WebSocket hâlâ başarısız">
    Proxy'nizin şunları yaptığından emin olun:

    - WebSocket yükseltmelerini destekliyor (`Upgrade: websocket`, `Connection: upgrade`).
    - Kimlik üstbilgilerini WebSocket yükseltme isteklerinde de geçiriyor (yalnızca HTTP'de değil).
    - WebSocket bağlantıları için ayrı bir auth yolu bulunmuyor.

  </Accordion>
</AccordionGroup>

## Token auth'tan geçiş

Token auth'tan trusted-proxy'ye geçiyorsanız:

<Steps>
  <Step title="Proxy'yi yapılandırın">
    Proxy'nizi kullanıcıları kimlik doğrulayacak ve üstbilgileri geçecek şekilde yapılandırın.
  </Step>
  <Step title="Proxy'yi bağımsız olarak test edin">
    Proxy kurulumunu bağımsız olarak test edin (`curl` ve üstbilgilerle).
  </Step>
  <Step title="OpenClaw yapılandırmasını güncelleyin">
    OpenClaw yapılandırmasını trusted-proxy auth ile güncelleyin.
  </Step>
  <Step title="Gateway'i yeniden başlatın">
    Gateway'i yeniden başlatın.
  </Step>
  <Step title="WebSocket'i test edin">
    Control UI'dan WebSocket bağlantılarını test edin.
  </Step>
  <Step title="Denetleyin">
    `openclaw security audit` çalıştırın ve bulguları inceleyin.
  </Step>
</Steps>

## İlgili

- [Yapılandırma](/tr/gateway/configuration) — yapılandırma başvurusu
- [Uzak erişim](/tr/gateway/remote) — diğer uzak erişim kalıpları
- [Güvenlik](/tr/gateway/security) — tam güvenlik kılavuzu
- [Tailscale](/tr/gateway/tailscale) — yalnızca tailnet erişimi için daha basit alternatif
