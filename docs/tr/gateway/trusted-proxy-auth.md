---
read_when:
    - OpenClaw'u kimlik duyarlı bir proxy'nin arkasında çalıştırma
    - OpenClaw'ın önünde OAuth ile Pomerium, Caddy veya nginx kurulumu
    - Ters proxy kurulumlarında WebSocket 1008 yetkisiz hatalarını düzeltme
    - HSTS ve diğer HTTP güvenlik sıkılaştırma üstbilgilerinin nerede ayarlanacağına karar verme
sidebarTitle: Trusted proxy auth
summary: Gateway kimlik doğrulamasını güvenilir bir ters proxy'ye devredin (Pomerium, Caddy, nginx + OAuth)
title: Güvenilir proxy kimlik doğrulaması
x-i18n:
    generated_at: "2026-07-12T12:22:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Güvenlik açısından hassas özellik.** Bu mod, kimlik doğrulamayı tamamen ters proxy'nize devreder. Hatalı yapılandırma, Gateway'inizi yetkisiz erişime açık hâle getirebilir. Etkinleştirmeden önce bu sayfayı dikkatlice okuyun.
</Warning>

## Ne zaman kullanılmalı

- OpenClaw'u **kimlik bilgisine duyarlı bir proxy** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + ileri kimlik doğrulama) arkasında çalıştırıyorsunuz.
- Proxy'niz tüm kimlik doğrulama işlemlerini gerçekleştiriyor ve kullanıcı kimliğini başlıklar aracılığıyla iletiyor.
- Proxy'nin Gateway'e giden tek yol olduğu bir Kubernetes veya konteyner ortamındasınız.
- Tarayıcılar WS yüklerinde belirteç iletemediği için WebSocket `1008 unauthorized` hataları alıyorsunuz.

## Ne zaman KULLANILMAMALI

- Proxy'niz kullanıcıların kimliğini doğrulamıyor (yalnızca TLS sonlandırıcı veya yük dengeleyici olarak çalışıyor).
- Gateway'e proxy'yi atlayan herhangi bir yol var (güvenlik duvarı açıklıkları, dahili ağ erişimi).
- Proxy'nizin iletilen başlıkları doğru şekilde kaldırdığından veya üzerine yazdığından emin değilsiniz.
- Yalnızca kişisel, tek kullanıcılı erişime ihtiyacınız var (bunun yerine Tailscale Serve + local loopback kullanmayı değerlendirin).

## Nasıl çalışır

<Steps>
  <Step title="Proxy kullanıcının kimliğini doğrular">
    Ters proxy'niz kullanıcıların kimliğini doğrular (OAuth, OIDC, SAML vb.).
  </Step>
  <Step title="Proxy bir kimlik başlığı ekler">
    Proxy, kimliği doğrulanmış kullanıcı kimliğini içeren bir başlık ekler (ör. `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway güvenilir kaynağı doğrular">
    OpenClaw, isteğin **güvenilir bir proxy IP'sinden** (`gateway.trustedProxies`) geldiğini ve Gateway'in kendi loopback veya yerel arayüz adresinden gelmediğini denetler.
  </Step>
  <Step title="Gateway kimliği çıkarır">
    OpenClaw gerekli başlıkları, ardından yapılandırılmış başlıktaki kullanıcı kimliğini okur.
  </Step>
  <Step title="Yetkilendir">
    Tüm denetimler başarılı olursa ve kullanıcı `allowUsers` denetiminden (ayarlandığında) geçerse istek yetkilendirilir.
  </Step>
</Steps>

## Yapılandırma

```json5
{
  gateway: {
    // Güvenilir proxy kimlik doğrulaması, varsayılan olarak proxy'nin kaynak IP'sinin loopback olmamasını bekler
    bind: "lan",

    // KRİTİK: Buraya yalnızca proxy'nizin IP adreslerini ekleyin
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Kimliği doğrulanmış kullanıcı kimliğini içeren başlık (zorunlu)
        userHeader: "x-forwarded-user",

        // İsteğe bağlı: MUTLAKA bulunması gereken başlıklar (proxy doğrulaması)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // İsteğe bağlı: belirli kullanıcılarla sınırla (boş = tümüne izin ver)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // İsteğe bağlı: açıkça etkinleştirildikten sonra aynı ana makinedeki loopback proxy'ye izin ver
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**Çalışma zamanı kuralları, değerlendirme sırasına göre**

1. İsteğin kaynak IP'si `gateway.trustedProxies` içindeki bir değerle eşleşmelidir (CIDR desteklenir); aksi takdirde istek reddedilir (`trusted_proxy_untrusted_source`).
2. Loopback kaynaklı istekler (`127.0.0.1`, `::1`), `gateway.auth.trustedProxy.allowLoopback = true` olmadığı ve loopback adresi `trustedProxies` içinde de bulunmadığı sürece reddedilir (`trusted_proxy_loopback_source`). Bu denetim başlık denetimlerinden önce çalışır; dolayısıyla gerekli başlıklar da eksik olsa bile loopback kaynak bu nedenle başarısız olur.
3. Gateway ana makinesinin kendi yerel ağ arayüzü adreslerinden biriyle eşleşen loopback dışı kaynaklar, sahteciliğe karşı koruma amacıyla reddedilir (`trusted_proxy_local_interface_source`). Arayüz keşfinin kendisi başarısız olursa istek yine reddedilir (`trusted_proxy_local_interface_check_failed`).
4. `requiredHeaders` ve `userHeader` mevcut olmalı ve boş olmamalıdır.
5. `allowUsers` boş değilse çıkarılan kullanıcıyı içermelidir.

**İletilen başlık kanıtı, doğrudan yerel geri dönüş için loopback yerelliğini geçersiz kılar.** Bir istek loopback üzerinden gelir ancak `Forwarded`, herhangi bir `X-Forwarded-*` veya `X-Real-IP` başlığı taşırsa bu kanıt, istek loopback olduğu için güvenilir proxy kimlik doğrulamasında yine başarısız olsa da onu doğrudan yerel parola geri dönüşünden ve cihaz kimliği denetiminden çıkarır.

`allowLoopback`, Gateway ana makinesindeki yerel işlemlere ters proxy ile aynı ölçüde güvenir. Bunu yalnızca Gateway'e doğrudan uzaktan erişim hâlâ güvenlik duvarıyla engelleniyorsa ve yerel proxy, istemcinin sağladığı kimlik başlıklarını kaldırıyor veya üzerlerine yazıyorsa etkinleştirin.

Ters proxy üzerinden geçmeyen dahili Gateway istemcileri, güvenilir proxy kimlik başlıkları yerine `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` kullanmalıdır. Loopback dışında dağıtılan Control UI örnekleri için ayrıca açıkça `gateway.controlUi.allowedOrigins` ayarlanması gerekir.
</Warning>

### Yapılandırma başvurusu

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Güvenilecek proxy IP adresleri (veya CIDR'ler) dizisi. Diğer IP'lerden gelen istekler reddedilir.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  `"trusted-proxy"` olmalıdır.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Kimliği doğrulanmış kullanıcı kimliğini içeren başlığın adı.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  İsteğin güvenilir sayılması için bulunması gereken ek başlıklar.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Kullanıcı kimliklerinin izin listesi. Boş olması, kimliği doğrulanmış tüm kullanıcılara izin verildiği anlamına gelir.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  Aynı ana makinedeki loopback ters proxy'leri için isteğe bağlı destek.
</ParamField>

<Warning>
`allowLoopback` seçeneğini yalnızca yerel ters proxy'nin amaçlanan güven sınırı olduğu durumlarda etkinleştirin. Gateway'e bağlanabilen herhangi bir yerel işlem proxy kimlik başlıkları göndermeyi deneyebilir; bu nedenle doğrudan Gateway erişimini ana makineye özel tutun ve `x-forwarded-proto` gibi proxy'nin sahip olduğu başlıkları veya proxy'niz destekliyorsa imzalı bir doğrulama beyanı başlığını zorunlu kılın.
</Warning>

## Control UI eşleştirme davranışı

`gateway.auth.mode = "trusted-proxy"` etkinken ve istek güvenilir proxy denetimlerinden geçtiğinde, Control UI WebSocket oturumları cihaz eşleştirme kimliği olmadan bağlanabilir.

Kapsamla ilgili sonuçlar:

- Cihazsız Control UI WebSocket oturumları bağlanır ancak varsayılan olarak hiçbir operatör kapsamı almaz. OpenClaw, onaylı ve eşleştirilmiş bir cihaza/birtece bağlı olmayan oturumun kendi izinlerini beyan edememesi için istenen kapsam listesini `[]` olarak temizler.
- Başarılı bir WebSocket bağlantısından sonra yöntemler `missing scope` hatasıyla başarısız olursa tarayıcının cihaz kimliği oluşturabilmesi ve eşleştirmeyi tamamlayabilmesi için HTTPS kullanın. Bkz. [Control UI güvenli olmayan HTTP](/tr/web/control-ui#insecure-http).
- Yalnızca acil durum için: `gateway.controlUi.dangerouslyDisableDeviceAuth=true`, cihaz kimliği olmadığında bile istenen kapsamları korur. Bu, güvenliği ciddi ölçüde düşürür; değişikliği hızla geri alın. Bkz. [Control UI güvenli olmayan HTTP](/tr/web/control-ui#insecure-http).

Ters proxy kapsam sınırlaması: Proxy'niz Control UI WebSocket yükseltme isteğinde `x-openclaw-scopes` gönderirse OpenClaw, oturum kapsamlarını istenen kapsamlarla beyan edilen kapsamların kesişimiyle sınırlar. Bu başlık kapsam vermez; yalnızca oturumun sahip olabileceği kapsamları daraltır.

Sonuçlar:

- Bu modda eşleştirme artık Control UI erişiminin birincil denetimi değildir.
- Ters proxy kimlik doğrulama politikanız ve `allowUsers`, etkin erişim denetimi hâline gelir.
- Gateway girişini yalnızca güvenilir proxy IP'lerine açık tutun (`gateway.trustedProxies` + güvenlik duvarı).

Özel WebSocket istemcileri Control UI oturumları değildir. `gateway.controlUi.dangerouslyDisableDeviceAuth`, rastgele `client.mode: "backend"` veya CLI biçimli istemcilere kapsam vermez. Özel otomasyon; cihaz kimliği/eşleştirme, ayrılmış doğrudan yerel `client.id: "gateway-client"` arka uç yardımcı yolu veya HTTP istek/yanıt yüzeyi daha uygunsa [yönetici HTTP RPC plugin'i](/tr/plugins/admin-http-rpc) kullanmalıdır.

## Operatör kapsamları başlığı

Güvenilir proxy kimlik doğrulaması, kimlik **taşıyan** bir HTTP modudur; bu nedenle çağıranlar HTTP API isteklerinde isteğe bağlı olarak `x-openclaw-scopes` ile operatör kapsamlarını beyan edebilir.

Not: WebSocket kapsamları Gateway protokolü el sıkışması ve cihaz kimliği bağlaması tarafından belirlenir. Control UI WebSocket yükseltme isteklerinde `x-openclaw-scopes`, kapsam vermek yerine yalnızca anlaşmayla belirlenen oturum kapsamlarını sınırlar. Bkz. [Control UI eşleştirme davranışı](#control-ui-pairing-behavior).

Örnekler:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Davranış:

- Başlık mevcut olduğunda OpenClaw, beyan edilen kapsam kümesini dikkate alır.
- Başlık mevcut ancak boş olduğunda istek **hiçbir** operatör kapsamı beyan etmez.
- Başlık bulunmadığında, kimlik taşıyan normal HTTP API'leri standart varsayılan operatör kapsamı kümesine geri döner (`operator.admin`, `operator.read`, `operator.write`, `operator.approvals`, `operator.pairing`, `operator.talk.secrets`).
- Gateway kimlik doğrulamalı **plugin HTTP rotaları** varsayılan olarak daha dardır: `x-openclaw-scopes` bulunmadığında çalışma zamanı kapsamları yalnızca `operator.write` kapsamına geri döner.
- Tarayıcı kaynaklı HTTP istekleri, güvenilir proxy kimlik doğrulaması başarılı olsa bile `gateway.controlUi.allowedOrigins` denetiminden (veya bilinçli olarak seçilmiş Host başlığı geri dönüş modundan) geçmelidir.

Pratik kural: Güvenilir proxy isteğinin varsayılanlardan daha dar olmasını istediğinizde veya Gateway kimlik doğrulamalı bir plugin rotası yazma kapsamından daha güçlü bir kapsama ihtiyaç duyduğunda `x-openclaw-scopes` başlığını açıkça gönderin.

## TLS sonlandırma ve HSTS

Tek bir TLS sonlandırma noktası kullanın ve HSTS'yi orada uygulayın.

<Tabs>
  <Tab title="Proxy TLS sonlandırması (önerilir)">
    Ters proxy'niz `https://control.example.com` için HTTPS'yi yönetiyorsa bu etki alanına ait `Strict-Transport-Security` başlığını proxy'de ayarlayın.

    - İnternete açık dağıtımlar için uygundur.
    - Sertifika ve HTTP sağlamlaştırma politikasını tek yerde tutar.
    - OpenClaw, proxy arkasında loopback HTTP üzerinde kalabilir.

    Örnek başlık değeri:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS sonlandırması">
    OpenClaw doğrudan HTTPS sunuyorsa (TLS sonlandıran bir proxy yoksa) şunu ayarlayın:

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

    `strictTransportSecurity`, dize biçiminde bir başlık değeri veya açıkça devre dışı bırakmak için `false` kabul eder.

  </Tab>
</Tabs>

### Kullanıma alma rehberi

- Trafiği doğrularken önce kısa bir azami süreyle başlayın (örneğin `max-age=300`).
- Yalnızca yeterli güven oluştuğunda uzun süreli değerlere (örneğin `max-age=31536000`) yükseltin.
- `includeSubDomains` seçeneğini yalnızca tüm alt etki alanları HTTPS'ye hazırsa ekleyin.
- Ön yüklemeyi yalnızca tüm etki alanı kümeniz için ön yükleme gereksinimlerini bilinçli olarak karşılıyorsanız kullanın.
- Yalnızca loopback kullanan yerel geliştirme HSTS'den fayda sağlamaz.

## Proxy kurulum örnekleri

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium, kimliği `x-pomerium-claim-email` (veya diğer talep başlıkları) içinde, JWT'yi ise `x-pomerium-jwt-assertion` içinde iletir.

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
    `caddy-security` plugin'iyle kullanılan Caddy, kullanıcıların kimliğini doğrulayabilir ve kimlik başlıklarını iletebilir.

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

    ```caddy
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
    oauth2-proxy, kullanıcıların kimliğini doğrular ve kimlik bilgisini `x-auth-request-email` içinde iletir.

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
  <Accordion title="Traefik with forward auth">
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

Paylaşılan bir token da yapılandırılmışsa (`gateway.auth.token` veya `OPENCLAW_GATEWAY_TOKEN`), Gateway başlatılırken güvenilen proxy kimlik doğrulaması reddedilir. Bu ikisi birbirini dışlar; çünkü paylaşılan bir token, aynı makinedeki çağıranların bu modun zorunlu kılmayı amaçladığı proxy tarafından doğrulanmış kimlikten tamamen farklı bir yolla kimlik doğrulamasına olanak tanır.

Başlatma işlemi `gateway auth mode is trusted-proxy, but a shared token is also configured` benzeri bir hatayla başarısız olursa:

- Güvenilen proxy modunu kullanırken paylaşılan token'ı kaldırın veya
- Token tabanlı kimlik doğrulama kullanmayı amaçlıyorsanız `gateway.auth.mode` değerini `"token"` olarak değiştirin.

local loopback güvenilen proxy kimlik başlıkları yine güvenli biçimde reddedilir: aynı makinedeki çağıranların kimliği sessizce proxy kullanıcısı olarak doğrulanmaz. Proxy'yi atlayan dahili OpenClaw çağıranları bunun yerine `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` ile kimlik doğrulayabilir. Token'a geri dönüş, güvenilen proxy modunda kasıtlı olarak desteklenmez.

## Güvenlik kontrol listesi

Güvenilen proxy kimlik doğrulamasını etkinleştirmeden önce şunları doğrulayın:

- [ ] **Proxy tek erişim yoludur**: Gateway portu, proxy'niz dışındaki her şeye karşı güvenlik duvarıyla korunur.
- [ ] **trustedProxies asgari düzeydedir**: Tüm alt ağlar değil, yalnızca gerçek proxy IP'leriniz belirtilir.
- [ ] **local loopback proxy kaynağı bilinçli olarak seçilmiştir**: Aynı makinedeki bir proxy için `gateway.auth.trustedProxy.allowLoopback` açıkça etkinleştirilmediği sürece, güvenilen proxy kimlik doğrulaması local loopback kaynaklı istekleri güvenli biçimde reddeder.
- [ ] **Proxy başlıkları kaldırır**: Proxy'niz istemcilerden gelen `x-forwarded-*` başlıklarının üzerine yazar; bunlara ekleme yapmaz.
- [ ] **TLS sonlandırma**: TLS işlemlerini proxy'niz yürütür; kullanıcılar HTTPS üzerinden bağlanır.
- [ ] **allowedOrigins açıkça belirtilmiştir**: local loopback dışındaki Denetim Arayüzü, açıkça belirtilmiş `gateway.controlUi.allowedOrigins` kullanır.
- [ ] **allowUsers ayarlanmıştır** (önerilir): Kimliği doğrulanmış herkese izin vermek yerine erişimi bilinen kullanıcılarla sınırlandırın.
- [ ] **Karma token yapılandırması yoktur**: Hem `gateway.auth.token` hem de `gateway.auth.mode: "trusted-proxy"` ayarlamayın.
- [ ] **Yerel parola geri dönüşü özeldir**: Doğrudan bağlanan dahili çağıranlar için `gateway.auth.password` yapılandırırsanız, proxy dışındaki uzak istemcilerin Gateway portuna doğrudan erişememesi için portu güvenlik duvarıyla koruyun.

## Güvenlik denetimi

`openclaw security audit`, güvenilen proxy kimlik doğrulamasını **kritik** önem derecesine sahip bir bulgu olarak işaretler. Bu kasıtlıdır; güvenliği proxy kurulumunuza devrettiğinizi hatırlatır.

Denetim şunları kontrol eder:

- Temel `gateway.trusted_proxy_auth` uyarısı/kritik hatırlatıcısı.
- Eksik `trustedProxies` yapılandırması.
- Eksik `userHeader` yapılandırması.
- Boş `allowUsers` (kimliği doğrulanmış tüm kullanıcılara izin verir).
- Aynı makinedeki proxy kaynakları için etkinleştirilmiş `allowLoopback`.

Denetim Arayüzü kullanıma açıldığında, güvenilen proxy'ye özgü olmayan ayrı bulgular da geçerlidir: joker karakterli veya eksik `gateway.controlUi.allowedOrigins` ve Host başlığı kaynak geri dönüşü.

## Sorun giderme

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    İstek, `gateway.trustedProxies` içindeki bir IP'den gelmedi. Şunları kontrol edin:

    - Proxy IP'si doğru mu? (Docker konteyner IP'leri değişebilir.)
    - Proxy'nizin önünde bir yük dengeleyici var mı?
    - Gerçek IP'leri bulmak için `docker inspect` veya `kubectl get pods -o wide` kullanın.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw, local loopback kaynaklı bir güvenilen proxy isteğini reddetti.

    Şunları kontrol edin:

    - Proxy `127.0.0.1` / `::1` üzerinden mi bağlanıyor?
    - Güvenilen proxy kimlik doğrulamasını aynı makinedeki bir local loopback ters proxy ile mi kullanmaya çalışıyorsunuz?

    Çözüm:

    - Proxy üzerinden geçmeyen, aynı makinedeki dahili istemciler için token/parola kimlik doğrulamasını tercih edin veya
    - Trafiği local loopback olmayan güvenilen bir proxy adresi üzerinden yönlendirin ve bu IP'yi `gateway.trustedProxies` içinde tutun ya da
    - Bilinçli olarak kullanılan, aynı makinedeki bir ters proxy için `gateway.auth.trustedProxy.allowLoopback = true` ayarını yapın, local loopback adresini `gateway.trustedProxies` içinde tutun ve proxy'nin kimlik başlıklarını kaldırdığından veya üzerlerine yazdığından emin olun.

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    İsteğin kaynak IP'si, sahte aynı makine trafiğine karşı bir koruma olarak, proxy yerine Gateway makinesinin local loopback olmayan kendi ağ arayüzü adreslerinden biriyle eşleşti. Bu durum tailnet'lerde veya Docker köprü ağlarında görülebilir. `..._check_failed`, arayüz keşfinin kendisinin hata verdiği ve bu nedenle OpenClaw'un güvenli biçimde reddettiği anlamına gelir.

    Şunları kontrol edin:

    - Gateway makinesindeki bir işlem, proxy'yi atlayarak kimlik başlıklarını doğrudan mı gönderiyor?
    - Proxy, Gateway ile aynı ağ ad alanında ve yerel bir arayüz olarak da görünen bir IP ile mi çalışıyor?

    Çözüm: Proxy trafiğini Gateway makinesi tarafından yerel olarak da bağlanmamış bir adres üzerinden yönlendirin veya `allowLoopback` seçeneğini yalnızca gerçek bir aynı makine proxy kurulumu için kullanın.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Kullanıcı başlığı boştu veya yoktu. Şunları kontrol edin:

    - Proxy'niz kimlik başlıklarını iletecek şekilde yapılandırılmış mı?
    - Başlık adı doğru mu? (Büyük/küçük harfe duyarlı değildir ancak yazımı önemlidir.)
    - Kullanıcının kimliği proxy'de gerçekten doğrulanmış mı?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Gerekli bir başlık mevcut değildi. Şunları kontrol edin:

    - İlgili başlıklara yönelik proxy yapılandırmanızı.
    - Başlıkların zincirin herhangi bir yerinde kaldırılıp kaldırılmadığını.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Kullanıcının kimliği doğrulandı ancak kullanıcı `allowUsers` içinde değil. Kullanıcıyı ekleyin veya izin listesini kaldırın.
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` değeri `"trusted-proxy"` ancak `gateway.trustedProxies` boş veya `gateway.auth.trustedProxy` yapılandırmasının kendisi eksik. Her ikisi de ayarlanana kadar tüm istekler reddedilir.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Güvenilen proxy kimlik doğrulaması başarılı oldu ancak tarayıcının `Origin` başlığı, Denetim Arayüzü kaynak denetimlerinden geçemedi.

    Şunları kontrol edin:

    - `gateway.controlUi.allowedOrigins`, tarayıcının tam kaynağını içeriyor.
    - Bilinçli olarak herkese izin veren davranış istemediğiniz sürece joker karakterli kaynaklara güvenmiyorsunuz.
    - Host başlığı geri dönüş modunu bilinçli olarak kullanıyorsanız `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` ayarı bilinçli biçimde yapılmış.

  </Accordion>
  <Accordion title="Connection succeeds but methods report missing scope">
    WebSocket bağlanıyor ancak `chat.history`, `sessions.list` veya
    `models.list`, `missing scope: operator.read` hatasıyla başarısız oluyor.

    Yaygın nedenler:

    - Cihazsız Denetim Arayüzü oturumu: Güvenilen proxy kimlik doğrulaması, cihaz kimliği olmadan WebSocket bağlantısına izin verebilir ancak OpenClaw tasarım gereği cihazsız oturumların kapsamlarını temizler.
    - Özel arka uç istemcisi: `gateway.controlUi.dangerouslyDisableDeviceAuth`, Denetim Arayüzü kapsamındadır ve rastgele arka uç veya CLI biçimli WebSocket istemcilerine kapsam vermez.
    - Aşırı dar `x-openclaw-scopes`: Proxy'niz bu başlığı Denetim Arayüzü WebSocket yükseltme isteğine eklerse oturum kapsamları bu kümeyle sınırlandırılır. Boş başlık değeri hiçbir kapsam sağlamaz.

    Çözüm:

    - Denetim Arayüzü için tarayıcının cihaz kimliği oluşturabilmesi ve eşleştirmeyi tamamlayabilmesi amacıyla HTTPS kullanın.
    - Özel otomasyon için cihaz kimliği/eşleştirme, ayrılmış doğrudan yerel `gateway-client` arka uç yardımcı yolunu veya [yönetici HTTP RPC'sini](/tr/plugins/admin-http-rpc) kullanın.
    - `gateway.controlUi.dangerouslyDisableDeviceAuth: true` ayarını yalnızca geçici bir Denetim Arayüzü acil erişim yolu olarak kullanın.

  </Accordion>
  <Accordion title="WebSocket still failing">
    Proxy'nizin şunları yaptığından emin olun:

    - WebSocket yükseltmelerini destekler (`Upgrade: websocket`, `Connection: upgrade`).
    - WebSocket yükseltme isteklerinde de kimlik başlıklarını iletir; yalnızca HTTP isteklerinde değil.
    - WebSocket bağlantıları için ayrı bir kimlik doğrulama yolu kullanmaz.

  </Accordion>
</AccordionGroup>

## Token kimlik doğrulamasından geçiş

<Steps>
  <Step title="Configure the proxy">
    Proxy'nizi kullanıcıların kimliğini doğrulayacak ve başlıkları iletecek şekilde yapılandırın.
  </Step>
  <Step title="Test the proxy independently">
    Proxy kurulumunu bağımsız olarak test edin (başlıklarla curl kullanın).
  </Step>
  <Step title="Update OpenClaw config">
    OpenClaw yapılandırmasını güvenilen proxy kimlik doğrulamasıyla güncelleyin.
  </Step>
  <Step title="Restart the Gateway">
    Gateway'i yeniden başlatın.
  </Step>
  <Step title="Test WebSocket">
    Denetim Arayüzü üzerinden WebSocket bağlantılarını test edin.
  </Step>
  <Step title="Audit">
    `openclaw security audit` komutunu çalıştırın ve bulguları inceleyin.
  </Step>
</Steps>

## İlgili konular

- [Yapılandırma](/tr/gateway/configuration) — yapılandırma başvurusu
- [Operatör kapsamları](/tr/gateway/operator-scopes) — roller, kapsamlar ve onay denetimleri
- [Uzak erişim](/tr/gateway/remote) — diğer uzak erişim yöntemleri
- [Güvenlik](/tr/gateway/security) — eksiksiz güvenlik kılavuzu
- [Tailscale](/tr/gateway/tailscale) — yalnızca tailnet erişimi için daha basit bir alternatif
