---
read_when:
    - OpenClaw'u kimlik farkında bir proxy arkasında çalıştırma
    - OpenClaw'ın önünde OAuth ile Pomerium, Caddy veya nginx kurma
    - Ters proxy kurulumlarında WebSocket 1008 yetkisiz hatalarını düzeltme
    - HSTS ve diğer HTTP sağlamlaştırma üstbilgilerinin nerede ayarlanacağına karar verme
sidebarTitle: Trusted proxy auth
summary: Gateway kimlik doğrulamasını güvenilen bir ters proxy’ye devredin (Pomerium, Caddy, nginx + OAuth)
title: Güvenilir proxy kimlik doğrulaması
x-i18n:
    generated_at: "2026-06-28T00:39:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 498a8aca666f88201302af3895b11ba43ab9c0b1bff00a262145fc9e21e80fa7
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Güvenlik açısından hassas özellik.** Bu mod, kimlik doğrulamayı tamamen ters proxy’nize devreder. Yanlış yapılandırma, Gateway’inizi yetkisiz erişime açabilir. Etkinleştirmeden önce bu sayfayı dikkatle okuyun.
</Warning>

## Ne zaman kullanılmalı

`trusted-proxy` kimlik doğrulama modunu şu durumlarda kullanın:

- OpenClaw’ı bir **kimlik farkındalıklı proxy** arkasında çalıştırıyorsanız (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Proxy’niz tüm kimlik doğrulamayı yönetiyor ve kullanıcı kimliğini başlıklar aracılığıyla iletiyorsa.
- Proxy’nin Gateway’e giden tek yol olduğu bir Kubernetes veya konteyner ortamındaysanız.
- Tarayıcılar WS yüklerinde token iletemediği için WebSocket `1008 unauthorized` hataları alıyorsanız.

## Ne zaman kullanılmamalı

- Proxy’niz kullanıcıların kimliğini doğrulamıyorsa (yalnızca TLS sonlandırıcı veya yük dengeleyiciyse).
- Gateway’e proxy’yi atlayan herhangi bir yol varsa (güvenlik duvarı açıkları, dahili ağ erişimi).
- Proxy’nizin iletilen başlıkları doğru şekilde kaldırıp kaldırmadığından/üzerine yazıp yazmadığından emin değilseniz.
- Yalnızca kişisel tek kullanıcılı erişime ihtiyacınız varsa (daha basit kurulum için Tailscale Serve + loopback’i değerlendirin).

## Nasıl çalışır

<Steps>
  <Step title="Proxy kullanıcının kimliğini doğrular">
    Ters proxy’niz kullanıcıların kimliğini doğrular (OAuth, OIDC, SAML vb.).
  </Step>
  <Step title="Proxy bir kimlik başlığı ekler">
    Proxy, kimliği doğrulanmış kullanıcı kimliğini içeren bir başlık ekler (örn. `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway güvenilir kaynağı doğrular">
    OpenClaw, isteğin bir **güvenilir proxy IP’sinden** geldiğini denetler (`gateway.trustedProxies` içinde yapılandırılır).
  </Step>
  <Step title="Gateway kimliği çıkarır">
    OpenClaw, kullanıcı kimliğini yapılandırılmış başlıktan çıkarır.
  </Step>
  <Step title="Yetkilendirme">
    Her şey doğrulanırsa istek yetkilendirilir.
  </Step>
</Steps>

## Control UI eşleştirme davranışı

`gateway.auth.mode = "trusted-proxy"` etkin olduğunda ve istek trusted-proxy denetimlerinden geçtiğinde, Control UI WebSocket oturumları cihaz eşleştirme kimliği olmadan bağlanabilir.

Kapsam etkileri:

- Cihazsız Control UI WebSocket oturumları bağlanır ancak varsayılan olarak operatör kapsamı almaz. OpenClaw istenen kapsam listesini `[]` olarak temizler; böylece onaylanmış eşleştirilmiş bir cihaza/token’a bağlı olmayan bir oturum izinleri kendi kendine beyan edemez.
- Başarılı bir WebSocket bağlantısından sonra yöntemler `missing scope` ile başarısız olursa, tarayıcının cihaz kimliği oluşturabilmesi ve eşleştirmeyi tamamlayabilmesi için HTTPS kullanın. Bkz. [Control UI güvenli olmayan HTTP](/tr/web/control-ui#insecure-http).
- Yalnızca acil durum için: `gateway.controlUi.dangerouslyDisableDeviceAuth=true`, cihaz kimliği olmasa bile istenen kapsamları korur. Bu ciddi bir güvenlik düşürmesidir; hızla geri alın. Bkz. [Control UI güvenli olmayan HTTP](/tr/web/control-ui#insecure-http).

Ters proxy kapsam sınırlaması:

- Proxy’niz Control UI WebSocket yükseltme isteğinde `x-openclaw-scopes` gönderirse, OpenClaw oturum kapsamlarını istenen kapsamlar ile beyan edilen kapsamların kesişimiyle sınırlar. Bu başlık kapsam vermez; yalnızca oturumun sahip olabileceklerini daraltır.

Etkiler:

- Bu modda eşleştirme artık Control UI erişimi için birincil kapı değildir.
- Ters proxy kimlik doğrulama ilkeniz ve `allowUsers` etkin erişim denetimi haline gelir.
- Gateway girişini yalnızca güvenilir proxy IP’leriyle kilitli tutun (`gateway.trustedProxies` + güvenlik duvarı).

Özel WebSocket istemcileri Control UI oturumları değildir. `gateway.controlUi.dangerouslyDisableDeviceAuth`, rastgele `client.mode: "backend"` veya CLI biçimli istemcilere kapsam vermez. Özel otomasyon, cihaz kimliği/eşleştirme, ayrılmış doğrudan-yerel `client.id: "gateway-client"` backend yardımcı yolu veya HTTP istek/yanıt yüzeyi daha uygunsa [admin HTTP RPC plugin](/tr/plugins/admin-http-rpc) kullanmalıdır.

## Yapılandırma

```json5
{
  gateway: {
    // Trusted-proxy kimlik doğrulaması varsayılan olarak non-loopback güvenilir proxy kaynağından gelen istekleri bekler
    bind: "lan",

    // KRİTİK: Buraya yalnızca proxy’nizin IP’lerini ekleyin
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Kimliği doğrulanmış kullanıcı kimliğini içeren başlık (zorunlu)
        userHeader: "x-forwarded-user",

        // İsteğe bağlı: bulunması ZORUNLU başlıklar (proxy doğrulaması)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // İsteğe bağlı: belirli kullanıcılarla sınırla (boş = tümüne izin ver)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // İsteğe bağlı: açıkça kabul edildikten sonra aynı ana makinedeki loopback proxy’ye izin ver
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**Önemli çalışma zamanı kuralları**

- Trusted-proxy kimlik doğrulaması, loopback kaynaklı istekleri (`127.0.0.1`, `::1`, loopback CIDR’leri) varsayılan olarak reddeder.
- Aynı ana makinedeki loopback ters proxy’leri, `gateway.auth.trustedProxy.allowLoopback = true` değerini açıkça ayarlamadığınız ve loopback adresini `gateway.trustedProxies` içine eklemediğiniz sürece trusted-proxy kimlik doğrulamasını karşılamaz.
- `allowLoopback`, Gateway ana makinesindeki yerel süreçlere ters proxy ile aynı düzeyde güvenir. Bunu yalnızca Gateway hâlâ doğrudan uzak erişime karşı güvenlik duvarıyla korunuyorsa ve yerel proxy istemci tarafından sağlanan kimlik başlıklarını kaldırıyor veya üzerlerine yazıyorsa etkinleştirin.
- Ters proxy üzerinden gitmeyen dahili Gateway istemcileri trusted-proxy kimlik başlıkları yerine `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` kullanmalıdır.
- Non-loopback Control UI dağıtımları hâlâ açık `gateway.controlUi.allowedOrigins` gerektirir.
- **İletilen başlık kanıtı, yerel doğrudan geri dönüş için loopback yerelliğini geçersiz kılar.** Bir istek loopback üzerinden gelir ancak `Forwarded`, herhangi bir `X-Forwarded-*` veya `X-Real-IP` başlığı kanıtı taşırsa, bu kanıt local-direct parola geri dönüşünü ve cihaz kimliği kapılamasını diskalifiye eder. `allowLoopback: true` ile trusted-proxy kimlik doğrulaması isteği aynı ana makine proxy isteği olarak yine de kabul edebilir; `requiredHeaders` ve `allowUsers` uygulanmaya devam eder.

</Warning>

### Yapılandırma referansı

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Güvenilecek proxy IP adresleri dizisi. Diğer IP’lerden gelen istekler reddedilir.
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
  Kullanıcı kimlikleri izin listesi. Boş olması tüm kimliği doğrulanmış kullanıcılara izin verileceği anlamına gelir.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  Aynı ana makinedeki loopback ters proxy’ler için açıkça etkinleştirilen destek. Varsayılan değer `false`.
</ParamField>

<Warning>
`allowLoopback` değerini yalnızca yerel ters proxy amaçlanan güven sınırı olduğunda etkinleştirin. Gateway’e bağlanabilen herhangi bir yerel süreç proxy kimlik başlıkları göndermeyi deneyebilir; bu nedenle doğrudan Gateway erişimini ana makineye özel tutun ve `x-forwarded-proto` gibi proxy’ye ait başlıkları veya proxy’nizin desteklediği yerlerde imzalı bir doğrulama başlığını zorunlu kılın.
</Warning>

## TLS sonlandırma ve HSTS

Tek bir TLS sonlandırma noktası kullanın ve HSTS’yi orada uygulayın.

<Tabs>
  <Tab title="Proxy TLS sonlandırması (önerilir)">
    Ters proxy’niz `https://control.example.com` için HTTPS’yi yönetiyorsa, bu etki alanı için `Strict-Transport-Security` değerini proxy’de ayarlayın.

    - İnternete açık dağıtımlar için uygundur.
    - Sertifika + HTTP sertleştirme ilkesini tek yerde tutar.
    - OpenClaw proxy arkasında loopback HTTP üzerinde kalabilir.

    Örnek başlık değeri:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS sonlandırması">
    OpenClaw HTTPS’yi doğrudan kendisi sunuyorsa (TLS sonlandıran proxy yoksa), şunu ayarlayın:

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

    `strictTransportSecurity` bir dize başlık değeri kabul eder veya açıkça devre dışı bırakmak için `false`.

  </Tab>
</Tabs>

### Dağıtım rehberi

- Trafiği doğrularken önce kısa bir maksimum yaşla başlayın (örneğin `max-age=300`).
- Uzun ömürlü değerlere (örneğin `max-age=31536000`) yalnızca güven yüksek olduktan sonra yükseltin.
- `includeSubDomains` değerini yalnızca her alt etki alanı HTTPS’ye hazırsa ekleyin.
- Preload’ı yalnızca tüm etki alanı kümeniz için preload gereksinimlerini bilinçli olarak karşılıyorsanız kullanın.
- Yalnızca loopback yerel geliştirme HSTS’den yararlanmaz.

## Proxy kurulum örnekleri

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium kimliği `x-pomerium-claim-email` içinde (veya diğer claim başlıklarında) ve JWT’yi `x-pomerium-jwt-assertion` içinde iletir.

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
    `caddy-security` plugin’ine sahip Caddy, kullanıcıların kimliğini doğrulayabilir ve kimlik başlıklarını iletebilir.

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
  <Accordion title="forward auth ile Traefik">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // Traefik konteyner IP'si
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

OpenClaw, hem `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`) hem de `trusted-proxy` modunun aynı anda etkin olduğu belirsiz yapılandırmaları reddeder. Karma token yapılandırmaları, loopback isteklerinin sessizce yanlış kimlik doğrulama yolunda doğrulanmasına neden olabilir.

Başlangıçta `mixed_trusted_proxy_token` hatası görürseniz:

- trusted-proxy modunu kullanırken paylaşılan token’ı kaldırın veya
- Token tabanlı kimlik doğrulama amaçlıyorsanız `gateway.auth.mode` değerini `"token"` olarak değiştirin.

Loopback trusted-proxy kimlik üstbilgileri hâlâ güvenli kapalı şekilde başarısız olur: aynı ana makinedeki çağıranlar sessizce proxy kullanıcıları olarak kimlik doğrulamasından geçirilmez. Proxy'yi atlayan dahili OpenClaw çağıranları bunun yerine `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` ile kimlik doğrulayabilir. Belirteç yedeği trusted-proxy modunda kasıtlı olarak desteklenmemeye devam eder.

## Operatör kapsamları üstbilgisi

Trusted-proxy kimlik doğrulaması **kimlik taşıyan** bir HTTP modudur, bu yüzden çağıranlar HTTP API isteklerinde isteğe bağlı olarak `x-openclaw-scopes` ile operatör kapsamları bildirebilir.

Not: WebSocket kapsamları Gateway protokol el sıkışması ve cihaz kimliği bağlaması tarafından belirlenir. Control UI WebSocket yükseltme isteklerinde `x-openclaw-scopes` yalnızca görüşülen oturum kapsamları için bir üst sınırdır, bir yetki vermez. trusted-proxy ile WebSocket kapsam davranışı için bkz. [Control UI eşleştirme davranışı](#control-ui-pairing-behavior).

Örnekler:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Davranış:

- Üstbilgi mevcut olduğunda, OpenClaw bildirilen kapsam kümesini uygular.
- Üstbilgi mevcut ama boş olduğunda, istek **hiçbir** operatör kapsamı bildirmez.
- Üstbilgi yoksa, normal kimlik taşıyan HTTP API'leri standart varsayılan operatör kapsam kümesine geri döner.
- Gateway kimlik doğrulamalı **plugin HTTP rotaları** varsayılan olarak daha dardır: `x-openclaw-scopes` yoksa, çalışma zamanı kapsamları `operator.write` kapsamına geri döner.
- Tarayıcı kaynaklı HTTP istekleri, trusted-proxy kimlik doğrulaması başarılı olduktan sonra bile `gateway.controlUi.allowedOrigins` denetiminden (veya bilinçli Host üstbilgisi yedek modundan) geçmelidir.
- Control UI WebSocket oturumlarında, `x-openclaw-scopes` yükseltme isteğinde mevcut olduğunda bir kapsam üst sınırıdır. Boş değer kapsam vermez.

Pratik kural: Bir trusted-proxy isteğinin varsayılanlardan daha dar olmasını istediğinizde veya gateway kimlik doğrulamalı bir plugin rotasının yazma kapsamından daha güçlü bir şeye ihtiyaç duyduğunda `x-openclaw-scopes` değerini açıkça gönderin.

## Güvenlik kontrol listesi

trusted-proxy kimlik doğrulamasını etkinleştirmeden önce şunları doğrulayın:

- [ ] **Proxy tek yoldur**: Gateway bağlantı noktası, proxy'niz dışında her şeye karşı güvenlik duvarıyla kapatılmıştır.
- [ ] **trustedProxies asgaridir**: Tüm alt ağlar değil, yalnızca gerçek proxy IP'leriniz.
- [ ] **Loopback proxy kaynağı bilinçlidir**: `gateway.auth.trustedProxy.allowLoopback` aynı ana makinedeki bir proxy için açıkça etkinleştirilmediği sürece loopback kaynaklı isteklerde trusted-proxy kimlik doğrulaması güvenli kapalı şekilde başarısız olur.
- [ ] **Proxy üstbilgileri temizler**: Proxy'niz istemcilerden gelen `x-forwarded-*` üstbilgilerinin üzerine yazar (ekleme yapmaz).
- [ ] **TLS sonlandırma**: Proxy'niz TLS'yi yönetir; kullanıcılar HTTPS üzerinden bağlanır.
- [ ] **allowedOrigins açıktır**: Loopback dışı Control UI açık `gateway.controlUi.allowedOrigins` kullanır.
- [ ] **allowUsers ayarlanmıştır** (önerilir): Kimliği doğrulanmış herkese izin vermek yerine bilinen kullanıcılarla sınırlandırın.
- [ ] **Karışık belirteç yapılandırması yoktur**: Hem `gateway.auth.token` hem de `gateway.auth.mode: "trusted-proxy"` ayarlamayın.
- [ ] **Yerel parola yedeği özeldir**: Dahili doğrudan çağıranlar için `gateway.auth.password` yapılandırırsanız, proxy dışı uzak istemcilerin doğrudan erişememesi için Gateway bağlantı noktasını güvenlik duvarıyla kapalı tutun.

## Güvenlik denetimi

`openclaw security audit`, trusted-proxy kimlik doğrulamasını **critical** önem derecesinde bir bulgu olarak işaretler. Bu kasıtlıdır — güvenliği proxy kurulumunuza devrettiğinize dair bir hatırlatmadır.

Denetim şunları kontrol eder:

- Temel `gateway.trusted_proxy_auth` uyarısı/kritik hatırlatıcısı
- Eksik `trustedProxies` yapılandırması
- Eksik `userHeader` yapılandırması
- Boş `allowUsers` (kimliği doğrulanmış herhangi bir kullanıcıya izin verir)
- Aynı ana makine proxy kaynakları için etkinleştirilmiş `allowLoopback`
- Açığa çıkarılmış Control UI yüzeylerinde joker karakterli veya eksik tarayıcı kaynak ilkesi

## Sorun giderme

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    İstek `gateway.trustedProxies` içindeki bir IP'den gelmedi. Şunları kontrol edin:

    - Proxy IP'si doğru mu? (Docker konteyner IP'leri değişebilir.)
    - Proxy'nizin önünde bir yük dengeleyici var mı?
    - Gerçek IP'leri bulmak için `docker inspect` veya `kubectl get pods -o wide` kullanın.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw, loopback kaynaklı bir trusted-proxy isteğini reddetti.

    Kontrol edin:

    - Proxy `127.0.0.1` / `::1` üzerinden mi bağlanıyor?
    - Aynı ana makinede loopback ters proxy ile trusted-proxy kimlik doğrulaması kullanmaya mı çalışıyorsunuz?

    Düzeltme:

    - Proxy'den geçmeyen dahili aynı ana makine istemcileri için belirteç/parola kimlik doğrulamasını tercih edin veya
    - Loopback olmayan güvenilir bir proxy adresi üzerinden yönlendirin ve bu IP'yi `gateway.trustedProxies` içinde tutun veya
    - Bilinçli bir aynı ana makine ters proxy için `gateway.auth.trustedProxy.allowLoopback = true` ayarlayın, loopback adresini `gateway.trustedProxies` içinde tutun ve proxy'nin kimlik üstbilgilerini temizlediğinden veya üzerine yazdığından emin olun.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Kullanıcı üstbilgisi boştu veya eksikti. Şunları kontrol edin:

    - Proxy'niz kimlik üstbilgilerini geçirecek şekilde yapılandırılmış mı?
    - Üstbilgi adı doğru mu? (büyük/küçük harfe duyarsızdır, ancak yazım önemlidir)
    - Kullanıcının proxy'de kimliği gerçekten doğrulanmış mı?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Gerekli bir üstbilgi mevcut değildi. Şunları kontrol edin:

    - Bu belirli üstbilgiler için proxy yapılandırmanız.
    - Üstbilgilerin zincirin bir yerinde temizlenip temizlenmediği.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Kullanıcının kimliği doğrulanmış, ancak `allowUsers` içinde değil. Ya kullanıcıyı ekleyin ya da izin listesini kaldırın.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Trusted-proxy kimlik doğrulaması başarılı oldu, ancak tarayıcı `Origin` üstbilgisi Control UI kaynak denetimlerinden geçmedi.

    Kontrol edin:

    - `gateway.controlUi.allowedOrigins` tam tarayıcı kaynağını içeriyor.
    - Bilinçli olarak herkese izin verme davranışı istemediğiniz sürece joker karakterli kaynaklara güvenmiyorsunuz.
    - Host üstbilgisi yedek modunu bilinçli olarak kullanıyorsanız, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bilinçli şekilde ayarlanmış.

  </Accordion>
  <Accordion title="Connection succeeds but methods report missing scope">
    WebSocket bağlanır, ancak `chat.history`, `sessions.list` veya
    `models.list`, `missing scope: operator.read` hatasıyla başarısız olur.

    Yaygın nedenler:

    - Cihazsız Control UI oturumu: trusted-proxy kimlik doğrulaması WebSocket bağlantısını cihaz kimliği olmadan kabul edebilir, ancak OpenClaw tasarım gereği cihazsız oturumlarda kapsamları temizler.
    - Özel arka uç istemcisi: `gateway.controlUi.dangerouslyDisableDeviceAuth` Control UI kapsamındadır ve rastgele arka uç veya CLI biçimli WebSocket istemcilerine kapsam vermez.
    - Aşırı dar `x-openclaw-scopes`: Proxy'niz bu üstbilgiyi Control UI WebSocket yükseltme isteğine ekliyorsa, oturum kapsamları bu kümeyle sınırlandırılır. Boş üstbilgi değeri kapsam vermez.

    Düzeltme:

    - Control UI için HTTPS kullanın, böylece tarayıcı cihaz kimliği oluşturabilir ve eşleştirmeyi tamamlayabilir.
    - Özel otomasyon için cihaz kimliği/eşleştirme, ayrılmış doğrudan yerel `gateway-client` arka uç yardımcı yolu veya [admin HTTP RPC](/tr/plugins/admin-http-rpc) kullanın.
    - `gateway.controlUi.dangerouslyDisableDeviceAuth: true` değerini yalnızca geçici bir Control UI acil durum yolu olarak kullanın.

  </Accordion>
  <Accordion title="WebSocket still failing">
    Proxy'nizin şunları yaptığından emin olun:

    - WebSocket yükseltmelerini destekler (`Upgrade: websocket`, `Connection: upgrade`).
    - Kimlik üstbilgilerini WebSocket yükseltme isteklerinde geçirir (yalnızca HTTP'de değil).
    - WebSocket bağlantıları için ayrı bir kimlik doğrulama yolu yoktur.

  </Accordion>
</AccordionGroup>

## Belirteç kimlik doğrulamasından geçiş

Belirteç kimlik doğrulamasından trusted-proxy'ye geçiyorsanız:

<Steps>
  <Step title="Configure the proxy">
    Proxy'nizi kullanıcıların kimliğini doğrulayacak ve üstbilgileri geçirecek şekilde yapılandırın.
  </Step>
  <Step title="Test the proxy independently">
    Proxy kurulumunu bağımsız olarak test edin (üstbilgilerle curl).
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

- [Yapılandırma](/tr/gateway/configuration) — yapılandırma referansı
- [Uzaktan erişim](/tr/gateway/remote) — diğer uzaktan erişim kalıpları
- [Güvenlik](/tr/gateway/security) — tam güvenlik kılavuzu
- [Tailscale](/tr/gateway/tailscale) — yalnızca tailnet erişimi için daha basit alternatif
