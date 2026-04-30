---
read_when:
    - OpenClaw'ı kimlik farkındalıklı bir ara sunucu arkasında çalıştırma
    - OpenClaw'ın önünde OAuth ile Pomerium, Caddy veya nginx yapılandırma
    - Ters proxy kurulumlarında WebSocket 1008 yetkisiz hatalarını düzeltme
    - HSTS ve diğer HTTP güvenlik sıkılaştırma başlıklarının nerede ayarlanacağına karar verme
sidebarTitle: Trusted proxy auth
summary: Gateway kimlik doğrulamasını güvenilir bir ters proxy'ye devredin (Pomerium, Caddy, nginx + OAuth)
title: Güvenilir proxy kimlik doğrulaması
x-i18n:
    generated_at: "2026-04-30T09:26:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 311498b822d2dbf9833c71ec070ab5cee5b4dd2dfb0eeaad1d758eee367a2df3
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Güvenlik açısından hassas özellik.** Bu mod, kimlik doğrulamayı tamamen ters proxy'nize devreder. Hatalı yapılandırma, Gateway'inizi yetkisiz erişime açabilir. Etkinleştirmeden önce bu sayfayı dikkatle okuyun.
</Warning>

## Ne zaman kullanılır?

`trusted-proxy` kimlik doğrulama modunu şu durumlarda kullanın:

- OpenClaw'ı **kimlik farkındalığı olan bir proxy** arkasında çalıştırıyorsanız (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + ileri kimlik doğrulama).
- Proxy'niz tüm kimlik doğrulamayı işliyor ve kullanıcı kimliğini başlıklar aracılığıyla iletiyorsa.
- Proxy'nin Gateway'e giden tek yol olduğu bir Kubernetes veya konteyner ortamındaysanız.
- Tarayıcılar WS yüklerinde token geçiremediği için WebSocket `1008 unauthorized` hataları alıyorsanız.

## Ne zaman kullanılmamalıdır?

- Proxy'niz kullanıcıların kimliğini doğrulamıyorsa (yalnızca TLS sonlandırıcı veya yük dengeleyiciyse).
- Gateway'e proxy'yi atlayan herhangi bir yol varsa (güvenlik duvarı açıklıkları, dahili ağ erişimi).
- Proxy'nizin iletilen başlıkları doğru şekilde kaldırıp/üzerine yazıp yazmadığından emin değilseniz.
- Yalnızca kişisel tek kullanıcılı erişime ihtiyacınız varsa (daha basit kurulum için Tailscale Serve + loopback seçeneğini değerlendirin).

## Nasıl çalışır?

<Steps>
  <Step title="Proxy kullanıcının kimliğini doğrular">
    Ters proxy'niz kullanıcıların kimliğini doğrular (OAuth, OIDC, SAML vb.).
  </Step>
  <Step title="Proxy bir kimlik başlığı ekler">
    Proxy, kimliği doğrulanmış kullanıcı kimliğini içeren bir başlık ekler (ör. `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway güvenilir kaynağı doğrular">
    OpenClaw, isteğin **güvenilir bir proxy IP'sinden** geldiğini denetler (`gateway.trustedProxies` içinde yapılandırılır).
  </Step>
  <Step title="Gateway kimliği çıkarır">
    OpenClaw, kullanıcı kimliğini yapılandırılan başlıktan çıkarır.
  </Step>
  <Step title="Yetkilendir">
    Her şey doğrulanırsa istek yetkilendirilir.
  </Step>
</Steps>

## Control UI eşleştirme davranışı

`gateway.auth.mode = "trusted-proxy"` etkinken ve istek trusted-proxy denetimlerinden geçtiğinde, Control UI WebSocket oturumları cihaz eşleştirme kimliği olmadan bağlanabilir.

Sonuçlar:

- Bu modda eşleştirme artık Control UI erişimi için birincil kapı değildir.
- Ters proxy kimlik doğrulama politikanız ve `allowUsers` fiili erişim denetimi haline gelir.
- Gateway girişini yalnızca güvenilir proxy IP'lerine kilitli tutun (`gateway.trustedProxies` + güvenlik duvarı).

## Yapılandırma

```json5
{
  gateway: {
    // Trusted-proxy auth expects requests from a non-loopback trusted proxy source by default
    bind: "lan",

    // CRITICAL: Only add your proxy's IP(s) here
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header containing authenticated user identity (required)
        userHeader: "x-forwarded-user",

        // Optional: headers that MUST be present (proxy verification)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: restrict to specific users (empty = allow all)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Optional: allow a same-host loopback proxy after explicit opt-in
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**Önemli çalışma zamanı kuralları**

- Trusted-proxy kimlik doğrulaması, varsayılan olarak loopback kaynaklı istekleri (`127.0.0.1`, `::1`, loopback CIDR'leri) reddeder.
- Aynı ana makinedeki loopback ters proxy'ler, siz açıkça `gateway.auth.trustedProxy.allowLoopback = true` ayarlamadıkça ve loopback adresini `gateway.trustedProxies` içine eklemedikçe trusted-proxy kimlik doğrulamasını karşılamaz.
- `allowLoopback`, Gateway ana makinesindeki yerel süreçlere ters proxy ile aynı düzeyde güvenir. Bunu yalnızca Gateway hâlâ doğrudan uzak erişime karşı güvenlik duvarıyla kapatılmışsa ve yerel proxy istemci tarafından sağlanan kimlik başlıklarını kaldırıyor veya üzerine yazıyorsa etkinleştirin.
- Ters proxy üzerinden geçmeyen dahili Gateway istemcileri, trusted-proxy kimlik başlıklarını değil `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` kullanmalıdır.
- Loopback olmayan Control UI dağıtımları hâlâ açık `gateway.controlUi.allowedOrigins` gerektirir.
- **İletilen başlık kanıtı, yerel doğrudan geri dönüş için loopback yerelliğini geçersiz kılar.** Bir istek loopback üzerinden geliyorsa ancak yerel olmayan bir kaynağı işaret eden `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` başlıkları taşıyorsa, bu kanıt yerel doğrudan parola geri dönüşünü ve cihaz kimliği kapılamasını geçersiz kılar. `allowLoopback: true` ile trusted-proxy kimlik doğrulaması isteği aynı ana makine proxy isteği olarak yine de kabul edebilir; `requiredHeaders` ve `allowUsers` uygulanmaya devam eder.

</Warning>

### Yapılandırma başvurusu

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Güvenilecek proxy IP adresleri dizisi. Diğer IP'lerden gelen istekler reddedilir.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  `"trusted-proxy"` olmalıdır.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Kimliği doğrulanmış kullanıcı kimliğini içeren başlık adı.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  İsteğin güvenilir sayılması için bulunması gereken ek başlıklar.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Kullanıcı kimlikleri izin listesi. Boş olması, kimliği doğrulanmış tüm kullanıcılara izin verileceği anlamına gelir.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  Aynı ana makinedeki loopback ters proxy'ler için açık onaylı destek. Varsayılan değer `false` şeklindedir.
</ParamField>

<Warning>
`allowLoopback` seçeneğini yalnızca yerel ters proxy amaçlanan güven sınırı olduğunda etkinleştirin. Gateway'e bağlanabilen herhangi bir yerel süreç proxy kimlik başlıkları göndermeyi deneyebilir; bu nedenle doğrudan Gateway erişimini ana makineye özel tutun ve `x-forwarded-proto` gibi proxy'ye ait başlıklar veya proxy'nizin desteklediği yerde imzalı bir doğrulama başlığı gerektirin.
</Warning>

## TLS sonlandırma ve HSTS

Tek bir TLS sonlandırma noktası kullanın ve HSTS'yi orada uygulayın.

<Tabs>
  <Tab title="Proxy TLS sonlandırması (önerilir)">
    Ters proxy'niz `https://control.example.com` için HTTPS'yi işliyorsa, `Strict-Transport-Security` değerini proxy'de o etki alanı için ayarlayın.

    - İnternete açık dağıtımlar için uygundur.
    - Sertifika + HTTP sıkılaştırma politikasını tek yerde tutar.
    - OpenClaw, proxy'nin arkasında loopback HTTP üzerinde kalabilir.

    Örnek başlık değeri:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS sonlandırması">
    OpenClaw doğrudan HTTPS sunuyorsa (TLS sonlandıran proxy yoksa), şunu ayarlayın:

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

    `strictTransportSecurity` bir dize başlık değeri kabul eder veya açıkça devre dışı bırakmak için `false` kabul eder.

  </Tab>
</Tabs>

### Kullanıma alma yönergeleri

- Trafiği doğrularken önce kısa bir maksimum yaş ile başlayın (örneğin `max-age=300`).
- Uzun ömürlü değerlere (örneğin `max-age=31536000`) yalnızca güven yüksek olduğunda artırın.
- `includeSubDomains` değerini yalnızca her alt etki alanı HTTPS'ye hazırsa ekleyin.
- Preload'u yalnızca tüm etki alanı kümeniz için preload gereksinimlerini bilinçli olarak karşılıyorsanız kullanın.
- Yalnızca loopback yerel geliştirme HSTS'den fayda sağlamaz.

## Proxy kurulum örnekleri

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium, kimliği `x-pomerium-claim-email` içinde (veya diğer talep başlıklarında), JWT'yi ise `x-pomerium-jwt-assertion` içinde iletir.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Pomerium's IP
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
    `caddy-security` Plugin'i ile Caddy kullanıcıların kimliğini doğrulayabilir ve kimlik başlıklarını iletebilir.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Caddy/sidecar proxy IP
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
    oauth2-proxy kullanıcıların kimliğini doğrular ve kimliği `x-auth-request-email` içinde iletir.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP
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
  <Accordion title="İleri kimlik doğrulama ile Traefik">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // Traefik container IP
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

## Karma token yapılandırması

OpenClaw, hem `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`) hem de `trusted-proxy` modunun aynı anda etkin olduğu belirsiz yapılandırmaları reddeder. Karma token yapılandırmaları, loopback isteklerinin yanlış kimlik doğrulama yolunda sessizce kimlik doğrulamasına neden olabilir.

Başlangıçta `mixed_trusted_proxy_token` hatası görürseniz:

- trusted-proxy modunu kullanırken paylaşılan token'ı kaldırın veya
- Token tabanlı kimlik doğrulama istiyorsanız `gateway.auth.mode` değerini `"token"` olarak değiştirin.

Loopback trusted-proxy kimlik başlıkları yine kapalı şekilde başarısız olur: aynı ana makine çağıranları sessizce proxy kullanıcıları olarak doğrulanmaz. Proxy'yi atlayan dahili OpenClaw çağıranları bunun yerine `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` ile kimlik doğrulaması yapabilir. Token geri dönüşü trusted-proxy modunda bilinçli olarak desteklenmemeye devam eder.

## Operatör kapsamları başlığı

Trusted-proxy kimlik doğrulaması **kimlik taşıyan** bir HTTP modudur; bu nedenle çağıranlar isteğe bağlı olarak `x-openclaw-scopes` ile operatör kapsamlarını bildirebilir.

Örnekler:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Davranış:

- Başlık mevcut olduğunda OpenClaw bildirilen kapsam kümesini dikkate alır.
- Başlık mevcut ancak boş olduğunda istek **hiçbir** operatör kapsamı bildirmez.
- Başlık yoksa normal kimlik taşıyan HTTP API'leri standart operatör varsayılan kapsam kümesine geri döner.
- Gateway kimlik doğrulamalı **Plugin HTTP rotaları** varsayılan olarak daha dardır: `x-openclaw-scopes` yoksa çalışma zamanı kapsamları `operator.write` kapsamına geri döner.
- Tarayıcı kökenli HTTP istekleri, trusted-proxy kimlik doğrulaması başarılı olduktan sonra bile `gateway.controlUi.allowedOrigins` değerinden (veya bilinçli Host başlığı geri dönüş modundan) geçmek zorundadır.

Pratik kural: Bir trusted-proxy isteğinin varsayılanlardan daha dar olmasını istediğinizde veya Gateway kimlik doğrulamalı bir Plugin rotasının yazma kapsamından daha güçlü bir şeye ihtiyacı olduğunda `x-openclaw-scopes` değerini açıkça gönderin.

## Güvenlik denetim listesi

trusted-proxy kimlik doğrulamasını etkinleştirmeden önce şunları doğrulayın:

- [ ] **Proxy tek yoldur**: Gateway bağlantı noktası, proxy'niz dışında her şeye karşı güvenlik duvarıyla kapatılmıştır.
- [ ] **trustedProxies minimumdur**: Tüm alt ağlar değil, yalnızca gerçek proxy IP'leriniz.
- [ ] **Loopback proxy kaynağı bilinçlidir**: trusted-proxy kimlik doğrulaması, aynı ana makinedeki bir proxy için `gateway.auth.trustedProxy.allowLoopback` açıkça etkinleştirilmedikçe loopback kaynaklı isteklerde kapalı kalacak şekilde başarısız olur.
- [ ] **Proxy başlıkları temizler**: Proxy'niz istemcilerden gelen `x-forwarded-*` başlıklarının üzerine yazar, ekleme yapmaz.
- [ ] **TLS sonlandırması**: Proxy'niz TLS'i işler; kullanıcılar HTTPS üzerinden bağlanır.
- [ ] **allowedOrigins açıktır**: Loopback olmayan Control UI, açık `gateway.controlUi.allowedOrigins` kullanır.
- [ ] **allowUsers ayarlanmıştır** (önerilir): Kimliği doğrulanmış herkese izin vermek yerine bilinen kullanıcılarla sınırlandırın.
- [ ] **Karışık token yapılandırması yoktur**: Hem `gateway.auth.token` hem de `gateway.auth.mode: "trusted-proxy"` ayarlamayın.
- [ ] **Yerel parola geri dönüşü özeldir**: Dahili doğrudan çağıranlar için `gateway.auth.password` yapılandırırsanız, proxy dışı uzak istemcilerin doğrudan erişememesi için Gateway bağlantı noktasını güvenlik duvarıyla kapalı tutun.

## Güvenlik denetimi

`openclaw security audit`, trusted-proxy kimlik doğrulamasını **kritik** önem derecesine sahip bir bulgu olarak işaretler. Bu bilinçli bir davranıştır; güvenliği proxy kurulumunuza devrettiğinizi hatırlatır.

Denetim şunları kontrol eder:

- Temel `gateway.trusted_proxy_auth` uyarısı/kritik hatırlatıcısı
- Eksik `trustedProxies` yapılandırması
- Eksik `userHeader` yapılandırması
- Boş `allowUsers` (kimliği doğrulanmış herhangi bir kullanıcıya izin verir)
- Aynı ana makine proxy kaynakları için etkin `allowLoopback`
- Açığa çıkarılmış Control UI yüzeylerinde joker karakterli veya eksik tarayıcı kaynak politikası

## Sorun giderme

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    İstek, `gateway.trustedProxies` içindeki bir IP'den gelmedi. Şunları kontrol edin:

    - Proxy IP'si doğru mu? (Docker container IP'leri değişebilir.)
    - Proxy'nizin önünde bir yük dengeleyici var mı?
    - Gerçek IP'leri bulmak için `docker inspect` veya `kubectl get pods -o wide` kullanın.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw, loopback kaynaklı bir trusted-proxy isteğini reddetti.

    Kontrol edin:

    - Proxy `127.0.0.1` / `::1` üzerinden mi bağlanıyor?
    - Aynı ana makinedeki bir loopback ters proxy ile trusted-proxy kimlik doğrulamasını kullanmaya mı çalışıyorsunuz?

    Düzeltme:

    - Proxy üzerinden geçmeyen dahili aynı ana makine istemcileri için token/parola kimlik doğrulamasını tercih edin veya
    - Loopback olmayan güvenilir bir proxy adresi üzerinden yönlendirin ve bu IP'yi `gateway.trustedProxies` içinde tutun veya
    - Bilinçli olarak aynı ana makinede bir ters proxy kullanıyorsanız `gateway.auth.trustedProxy.allowLoopback = true` ayarlayın, loopback adresini `gateway.trustedProxies` içinde tutun ve proxy'nin kimlik başlıklarını temizlediğinden veya üzerine yazdığından emin olun.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Kullanıcı başlığı boştu veya eksikti. Şunları kontrol edin:

    - Proxy'niz kimlik başlıklarını iletecek şekilde yapılandırılmış mı?
    - Başlık adı doğru mu? (büyük/küçük harfe duyarsızdır, ancak yazım önemlidir)
    - Kullanıcının kimliği proxy'de gerçekten doğrulanmış mı?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Gerekli bir başlık mevcut değildi. Şunları kontrol edin:

    - Bu belirli başlıklar için proxy yapılandırmanız.
    - Başlıkların zincirin bir yerinde temizlenip temizlenmediği.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Kullanıcının kimliği doğrulanmış, ancak `allowUsers` içinde değil. Kullanıcıyı ekleyin ya da izin listesini kaldırın.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Trusted-proxy kimlik doğrulaması başarılı oldu, ancak tarayıcı `Origin` başlığı Control UI kaynak kontrollerinden geçmedi.

    Kontrol edin:

    - `gateway.controlUi.allowedOrigins` tam tarayıcı kaynağını içeriyor.
    - Bilinçli olarak herkese izin verme davranışı istemediğiniz sürece joker karakterli kaynaklara güvenmiyorsunuz.
    - Host başlığı geri dönüş modunu bilinçli olarak kullanıyorsanız `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bilinçli olarak ayarlanmıştır.

  </Accordion>
  <Accordion title="WebSocket still failing">
    Proxy'nizin şunları yaptığından emin olun:

    - WebSocket yükseltmelerini destekler (`Upgrade: websocket`, `Connection: upgrade`).
    - WebSocket yükseltme isteklerinde kimlik başlıklarını iletir (yalnızca HTTP'de değil).
    - WebSocket bağlantıları için ayrı bir kimlik doğrulama yolu yoktur.

  </Accordion>
</AccordionGroup>

## Token kimlik doğrulamasından geçiş

Token kimlik doğrulamasından trusted-proxy'ye geçiyorsanız:

<Steps>
  <Step title="Configure the proxy">
    Proxy'nizi kullanıcıların kimliğini doğrulayacak ve başlıkları iletecek şekilde yapılandırın.
  </Step>
  <Step title="Test the proxy independently">
    Proxy kurulumunu bağımsız olarak test edin (başlıklarla curl).
  </Step>
  <Step title="Update OpenClaw config">
    OpenClaw yapılandırmasını trusted-proxy kimlik doğrulamasıyla güncelleyin.
  </Step>
  <Step title="Restart the Gateway">
    Gateway'i yeniden başlatın.
  </Step>
  <Step title="Test WebSocket">
    Control UI'dan WebSocket bağlantılarını test edin.
  </Step>
  <Step title="Audit">
    `openclaw security audit` çalıştırın ve bulguları gözden geçirin.
  </Step>
</Steps>

## İlgili

- [Yapılandırma](/tr/gateway/configuration) — yapılandırma başvurusu
- [Uzak erişim](/tr/gateway/remote) — diğer uzak erişim kalıpları
- [Güvenlik](/tr/gateway/security) — tam güvenlik kılavuzu
- [Tailscale](/tr/gateway/tailscale) — yalnızca tailnet erişimi için daha basit alternatif
