---
read_when:
    - SSRF ve DNS yeniden bağlama saldırılarına karşı derinlemesine savunma istiyorsunuz
    - OpenClaw çalışma zamanı trafiği için harici bir ileri proxy yapılandırma
summary: OpenClaw çalışma zamanı HTTP ve WebSocket trafiğini operatör tarafından yönetilen bir filtreleme proxy'si üzerinden yönlendirme yöntemi
title: Ağ proxy'si
x-i18n:
    generated_at: "2026-06-28T01:18:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3fc68d950037922ba3dc983c94a71bac3374750a02ef25f2c046cf782410be68
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw, çalışma zamanı HTTP ve WebSocket trafiğini operatör tarafından yönetilen bir ileri proxy üzerinden yönlendirebilir. Bu, merkezi çıkış kontrolü, daha güçlü SSRF koruması ve daha iyi ağ denetlenebilirliği isteyen dağıtımlar için isteğe bağlı derinlemesine savunmadır.

OpenClaw bir proxy göndermez, indirmez, başlatmaz, yapılandırmaz veya sertifikalandırmaz. Ortamınıza uyan proxy teknolojisini siz çalıştırırsınız ve OpenClaw normal süreç yerel HTTP ve WebSocket istemcilerini bunun üzerinden yönlendirir.

## Neden proxy kullanılır

Proxy, operatörlere giden HTTP ve WebSocket trafiği için tek bir ağ kontrol noktası sağlar. Bu, SSRF güçlendirmesi dışında bile yararlı olabilir:

- Merkezi ilke: ağ kurallarını doğru uygulaması için her uygulama HTTP çağrı noktasına güvenmek yerine tek bir çıkış ilkesi sürdürün.
- Bağlantı anı denetimleri: hedefi DNS çözümlemesinden sonra ve proxy yukarı akış bağlantısını açmadan hemen önce değerlendirin.
- DNS yeniden bağlama savunması: uygulama düzeyi DNS denetimi ile gerçek giden bağlantı arasındaki boşluğu azaltın.
- Daha geniş JavaScript kapsamı: sıradan `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch ve benzer istemcileri aynı yoldan yönlendirin.
- Denetlenebilirlik: izin verilen ve reddedilen hedefleri çıkış sınırında günlüğe kaydedin.
- Operasyonel kontrol: OpenClaw'ı yeniden derlemeden hedef kurallarını, ağ segmentasyonunu, hız sınırlarını veya giden izin listelerini zorunlu kılın.

Proxy yönlendirmesi, normal HTTP ve WebSocket çıkışı için süreç düzeyinde bir korkuluktur. Operatörlere desteklenen JavaScript HTTP istemcilerini kendi filtreleme proxy'leri üzerinden yönlendirmek için hatada kapalı kalan bir yol sağlar, ancak işletim sistemi düzeyinde bir ağ sandbox'ı değildir ve OpenClaw'ın proxy'nin hedef ilkesini sertifikalandırmasını sağlamaz.

## OpenClaw trafiği nasıl yönlendirir

`proxy.enabled=true` olduğunda ve bir proxy URL'si yapılandırıldığında, `openclaw gateway run`, `openclaw node run` ve `openclaw agent --local` gibi korunan çalışma zamanı süreçleri normal HTTP ve WebSocket çıkışını yapılandırılmış proxy üzerinden yönlendirir:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Kamusal sözleşme, bunu uygulamak için kullanılan dahili Node kancaları değil, yönlendirme davranışıdır. OpenClaw Gateway denetim düzlemi WebSocket istemcileri, Gateway URL'si `localhost` veya `127.0.0.1` ya da `[::1]` gibi düz bir loopback IP'si kullandığında local loopback Gateway RPC trafiği için dar bir doğrudan yol kullanır. Bu denetim düzlemi yolu, operatör proxy'si loopback hedeflerini engellese bile loopback Gateway'lere erişebilmelidir. Normal çalışma zamanı HTTP ve WebSocket istekleri yine yapılandırılmış proxy'yi kullanır.

Dahili olarak OpenClaw, bu özellik için süreç düzeyi yönlendirme çalışma zamanı olarak Proxyline'ı kurar. Proxyline, `fetch`, undici destekli istemciler, Node çekirdeği `node:http` / `node:https` çağıranları, yaygın WebSocket istemcileri ve yardımcı tarafından oluşturulan CONNECT tünellerini kapsar. Yönetilen proxy modu, açıkça belirtilen agent'ların operatör proxy'sini yanlışlıkla atlamaması için çağıran tarafından sağlanan Node HTTP agent'larını değiştirir.

Bazı plugin'ler, süreç düzeyi yönlendirme mevcut olsa bile açık proxy bağlantısı gerektiren özel aktarımlara sahiptir. Örneğin Telegram'ın Bot API aktarımı kendi HTTP/1 undici dispatcher'ını kullanır ve bu nedenle süreç proxy ortamını ve o sahipliğe özgü aktarım yolundaki yönetilen `OPENCLAW_PROXY_URL` yedeğini dikkate alır.

Proxy URL'sinin kendisi `http://` veya `https://` kullanabilir. Bu şemalar, OpenClaw'dan proxy uç noktasına bağlantıyı tanımlar:

- `http://proxy.example:3128`: OpenClaw ileri proxy'ye düz bir TCP bağlantısı açar ve HTTPS hedefleri için `CONNECT` dahil HTTP proxy istekleri gönderir.
- `https://proxy.example:8443`: OpenClaw proxy uç noktasına TLS açar, proxy sertifikasını doğrular ve ardından HTTP proxy isteklerini bu TLS oturumu içinde gönderir.

Hedef HTTPS, proxy uç noktası TLS'sinden ayrıdır. Bir HTTPS hedefi için OpenClaw yine proxy'den bir HTTP `CONNECT` tüneli ister ve ardından hedef TLS'yi bu tünel üzerinden başlatır.

Proxy etkinken OpenClaw `no_proxy` ve `NO_PROXY` değerlerini temizler. Bu atlama listeleri hedef tabanlıdır, bu nedenle `localhost` veya `127.0.0.1` değerlerini orada bırakmak yüksek riskli SSRF hedeflerinin filtreleme proxy'sini atlamasına izin verirdi.

Kapanışta OpenClaw önceki proxy ortamını geri yükler ve önbelleğe alınmış süreç yönlendirme durumunu sıfırlar.

## İlgili proxy terimleri

- `proxy.enabled` / `proxy.proxyUrl`: OpenClaw çalışma zamanı çıkışı için giden ileri proxy yönlendirmesi. Bu sayfa bu özelliği belgeler.
- `gateway.auth.mode: "trusted-proxy"`: Gateway erişimi için gelen, kimlik farkındalıklı ters proxy kimlik doğrulaması. Bkz. [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).
- `openclaw proxy`: geliştirme ve destek için yerel hata ayıklama proxy'si ve yakalama inceleyicisi. Bkz. [openclaw proxy](/tr/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: varsayılan katı DNS sabitlemesini ve ana makine adı ilkesini korurken operatör denetimli HTTP(S) ortam proxy'sinin DNS çözmesine izin vermek için `web_fetch` için isteğe bağlı etkinleştirme. Bkz. [Web fetch](/tr/tools/web-fetch#trusted-env-proxy).
- Kanal veya sağlayıcıya özgü proxy ayarları: belirli bir aktarım için sahipliğe özgü geçersiz kılmalar. Amaç çalışma zamanı genelinde merkezi çıkış kontrolü olduğunda yönetilen ağ proxy'sini tercih edin.

## Yapılandırma

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Özel proxy CA'sı olan bir HTTPS proxy uç noktası için:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

URL'yi ortam üzerinden de sağlayabilir, yapılandırmada `proxy.enabled=true` değerini koruyabilirsiniz:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl`, `OPENCLAW_PROXY_URL` değerine göre önceliklidir.

### Gateway Loopback Modu

Yerel Gateway denetim düzlemi istemcileri genellikle `ws://127.0.0.1:18789` gibi bir loopback WebSocket'e bağlanır. Yönetilen proxy etkinken loopback yönetilen proxy istisnalarının nasıl davranacağını seçmek için `proxy.loopbackMode` kullanın:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (varsayılan): OpenClaw, yerel Gateway WebSocket trafiğinin doğrudan bağlanabilmesi için Gateway loopback yetkilisini Proxyline'ın yönetilen atlama ilkesine kaydeder. Etkin Gateway URL'sinin ana makinesi ve bağlantı noktası kaydedildiğinden özel loopback Gateway bağlantı noktaları çalışır. Paketle gelen tarayıcı Plugin'i de OpenClaw tarafından başlatılan yönetilen tarayıcılar için tam yerel CDP hazırlık ve DevTools WebSocket uç noktalarını kaydedebilir ve paketle gelen Ollama bellek embedding sağlayıcısı, tam yapılandırılmış ana makine yerel loopback embedding kaynağı için kendi daha dar korumalı doğrudan yolunu kullanabilir.
- `proxy`: OpenClaw, Gateway veya Ollama loopback atlamalarını kaydetmez, bu nedenle bu loopback trafiği yönetilen proxy üzerinden gönderilir. Proxy uzaktaysa, OpenClaw ana makinesinin loopback hizmeti için onu proxy'nin erişebileceği bir ana makine adına, IP'ye veya tünele eşlemek gibi özel yönlendirme sağlamalıdır. Standart uzak proxy'ler `127.0.0.1` ve `localhost` değerlerini OpenClaw ana makinesinden değil, proxy ana makinesinden çözer.
- `block`: OpenClaw, bir soket açmadan önce Gateway loopback denetim düzlemi bağlantılarını ve korumalı Ollama ana makine yerel embedding loopback bağlantılarını reddeder.

`enabled=true` ise ancak geçerli bir proxy URL'si yapılandırılmamışsa, korunan komutlar doğrudan ağ erişimine geri dönmek yerine başlatmada başarısız olur.

`openclaw gateway start` ile başlatılan yönetilen gateway hizmetleri için URL'yi yapılandırmada saklamayı tercih edin:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Ortam yedeği ön planda çalışan işlemler için en uygundur. Bunu kurulu bir hizmetle kullanıyorsanız, `OPENCLAW_PROXY_URL` değerini `$OPENCLAW_STATE_DIR/.env` veya `~/.openclaw/.env` gibi hizmetin kalıcı ortamına koyun, ardından launchd, systemd veya Scheduled Tasks'ın gateway'i bu değerle başlatması için hizmeti yeniden kurun.

`openclaw --container ...` komutları için OpenClaw, ayarlandığında `OPENCLAW_PROXY_URL` değerini konteyner hedefli alt CLI'ya iletir. URL konteynerin içinden erişilebilir olmalıdır; `127.0.0.1` ana makineyi değil konteynerin kendisini ifade eder. OpenClaw, bu güvenlik denetimini açıkça geçersiz kılmadığınız sürece konteyner hedefli komutlar için loopback proxy URL'lerini reddeder.

## Proxy Gereksinimleri

Proxy ilkesi güvenlik sınırıdır. OpenClaw proxy'nin doğru hedefleri engellediğini doğrulayamaz.

Proxy'yi şu şekilde yapılandırın:

- Yalnızca loopback veya özel güvenilir bir arayüze bağlayın.
- Erişimi yalnızca OpenClaw sürecinin, ana makinesinin, konteynerinin veya hizmet hesabının kullanabileceği şekilde kısıtlayın.
- Hedefleri kendisi çözsün ve DNS çözümlemesinden sonra hedef IP'leri engellesin.
- Hem düz HTTP istekleri hem de HTTPS `CONNECT` tünelleri için ilkeyi bağlantı anında uygulayın.
- Loopback, özel, link-local, metadata, multicast, ayrılmış veya dokümantasyon aralıkları için hedef tabanlı atlamaları reddedin.
- DNS çözümleme yoluna tamamen güvenmediğiniz sürece ana makine adı izin listelerinden kaçının.
- İstek gövdelerini, yetkilendirme başlıklarını, çerezleri veya diğer sırları günlüğe kaydetmeden hedefi, kararı, durumu ve nedeni günlüğe kaydedin.
- Proxy ilkesini sürüm kontrolü altında tutun ve değişiklikleri güvenlik açısından hassas yapılandırma gibi gözden geçirin.

## Önerilen engellenen hedefler

Bu reddetme listesini herhangi bir ileri proxy, güvenlik duvarı veya çıkış ilkesi için başlangıç noktası olarak kullanın.

OpenClaw uygulama düzeyi sınıflandırıcı mantığı `src/infra/net/ssrf.ts` ve `packages/net-policy/src/ip.ts` içinde bulunur. İlgili eşdeğerlik kancaları `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` ve NAT64, 6to4, Teredo, ISATAP ve IPv4 eşlemeli biçimler için gömülü IPv4 sentinel işleme mantığıdır. Bu dosyalar harici bir proxy ilkesi sürdürürken yararlı başvuru kaynaklarıdır, ancak OpenClaw bu kuralları proxy'nizde otomatik olarak dışa aktarmaz veya zorunlu kılmaz.

| Aralık veya ana makine                                                                 | Engelleme nedeni                                                      |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                    | IPv4 geri döngüsü                                                     |
| `::1/128`                                                                              | IPv6 geri döngüsü                                                     |
| `0.0.0.0/8`, `::/128`                                                                  | Belirtilmemiş ve bu ağ adresleri                                      |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                        | RFC1918 özel ağları                                                   |
| `169.254.0.0/16`, `fe80::/10`                                                          | Bağlantı yerel adresleri ve yaygın bulut meta veri yolları            |
| `169.254.169.254`, `metadata.google.internal`                                          | Bulut meta veri hizmetleri                                            |
| `100.64.0.0/10`                                                                        | Taşıyıcı sınıfı NAT paylaşılan adres alanı                            |
| `198.18.0.0/15`, `2001:2::/48`                                                         | Karşılaştırma testi aralıkları                                        |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32`   | Özel kullanım ve dokümantasyon aralıkları                             |
| `224.0.0.0/4`, `ff00::/8`                                                              | Çok noktaya yayın                                                     |
| `240.0.0.0/4`                                                                          | Ayrılmış IPv4                                                         |
| `fc00::/7`, `fec0::/10`                                                                | IPv6 yerel/özel aralıkları                                            |
| `100::/64`, `2001:20::/28`                                                             | IPv6 atma ve ORCHIDv2 aralıkları                                      |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                       | Gömülü IPv4 içeren NAT64 önekleri                                     |
| `2002::/16`, `2001::/32`                                                               | Gömülü IPv4 içeren 6to4 ve Teredo                                     |
| `::/96`, `::ffff:0:0/96`                                                               | IPv4 uyumlu ve IPv4 eşlemeli IPv6                                     |

Bulut sağlayıcınız veya ağ platformunuz ek meta veri ana makineleri ya da ayrılmış aralıklar belgeliyorsa, bunları da ekleyin.

## Doğrulama

Proxy'yi OpenClaw'ı çalıştıran aynı ana makineden, kapsayıcıdan veya hizmet hesabından doğrulayın:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Özel bir CA tarafından imzalanmış HTTPS proxy uç noktası için:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

Varsayılan olarak, özel hedefler sağlanmadığında komut `https://example.com/` adresinin başarılı olduğunu denetler ve proxy'nin ulaşmaması gereken geçici bir geri döngü kanaryası başlatır. Varsayılan reddedilen denetim, proxy 2xx olmayan bir ret yanıtı döndürdüğünde veya kanaryayı bir taşıma hatasıyla engellediğinde geçer; başarılı bir yanıt kanaryaya ulaşırsa başarısız olur. Hiçbir proxy etkinleştirilmemiş ve yapılandırılmamışsa doğrulama bir yapılandırma sorunu bildirir; yapılandırmayı değiştirmeden önce tek seferlik ön denetim için `--proxy-url` kullanın. Dağıtıma özgü beklentileri test etmek için `--allowed-url` ve `--denied-url` kullanın. Doğrudan APNs HTTP/2 tesliminin proxy üzerinden bir CONNECT tüneli açabildiğini ve korumalı alan APNs yanıtı alabildiğini de doğrulamak için `--apns-reachable` ekleyin; yoklama bilerek geçersiz bir sağlayıcı belirteci kullanır, bu nedenle `403 InvalidProviderToken` beklenir ve erişilebilir sayılır. Özel reddedilen hedefler hata durumunda kapalıdır: herhangi bir HTTP yanıtı hedefin proxy üzerinden erişilebilir olduğu anlamına gelir ve herhangi bir taşıma hatası sonuçsuz olarak bildirilir çünkü OpenClaw proxy'nin erişilebilir bir kaynağı engellediğini kanıtlayamaz. Doğrulama hatasında komut 1 koduyla çıkar.

Otomasyon için `--json` kullanın. JSON çıktısı genel sonucu, etkili proxy yapılandırma kaynağını, yapılandırma hatalarını ve her hedef denetimini içerir. Proxy URL kimlik bilgileri metin ve JSON çıktısında gizlenir:

```json
{
  "ok": true,
  "config": {
    "enabled": true,
    "proxyUrl": "http://127.0.0.1:3128/",
    "source": "override",
    "errors": []
  },
  "checks": [
    {
      "kind": "allowed",
      "url": "https://example.com/",
      "ok": true,
      "status": 200
    },
    {
      "kind": "apns",
      "url": "https://api.sandbox.push.apple.com",
      "ok": true,
      "status": 403
    }
  ]
}
```

`curl` ile elle de doğrulayabilirsiniz:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

Genel isteğin başarılı olması gerekir. Geri döngü ve meta veri istekleri proxy tarafından engellenmelidir. `openclaw proxy validate` için yerleşik geri döngü kanaryası, proxy reddi ile erişilebilir bir kaynağı ayırt edebilir. Özel `--denied-url` denetimlerinde bu kanarya yoktur; bu nedenle proxy'niz ayrı olarak doğrulayabileceğiniz dağıtıma özgü bir ret sinyali sunmadıkça hem HTTP yanıtlarını hem de belirsiz taşıma hatalarını doğrulama hatası olarak değerlendirin.

## Proxy CA güveni

Proxy uç noktasının kendisi özel bir CA tarafından imzalanmış sertifika kullandığında yönetilen `proxy.tls.caFile` kullanın:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

Bu CA, proxy uç noktasının TLS doğrulaması için kullanılır. Bir hedef MITM güven ayarı, istemci sertifikası veya proxy'nin hedef politikasının yerine geçen bir ayar değildir.

Yalnızca tüm Node işleminin işlem başlangıcından itibaren ek bir CA'ya güvenmesi gerektiğinde, örneğin kurumsal bir TLS denetim sistemi işlemdeki her HTTPS istemcisi için hedef sertifikaları yeniden imzaladığında `NODE_EXTRA_CA_CERTS` kullanın. `NODE_EXTRA_CA_CERTS` işlem geneline uygulanır ve Node başlamadan önce mevcut olmalıdır. HTTPS proxy uç noktası güveni için `proxy.tls.caFile` tercih edin, çünkü yönetilen proxy yönlendirmesiyle sınırlıdır.

Ardından OpenClaw proxy yönlendirmesini etkinleştirin:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

veya şunu ayarlayın:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

## Sınırlar

- Proxy, işlem yerel JavaScript HTTP ve WebSocket istemcileri için kapsamı iyileştirir, ancak işletim sistemi düzeyinde bir ağ korumalı alanı değildir.
- Gateway geri döngü denetim düzlemi trafiği varsayılan olarak `proxy.loopbackMode: "gateway-only"` üzerinden doğrudan yerel baypasa gider. OpenClaw bu baypası, etkin Gateway geri döngü yetkilisini Proxyline'ın yönetilen baypas politikasına kaydederek uygular. Operatörler, Gateway geri döngü trafiğini yönetilen proxy üzerinden göndermek için `proxy.loopbackMode: "proxy"` veya geri döngü Gateway bağlantılarını reddetmek için `proxy.loopbackMode: "block"` ayarlayabilir. Uzak proxy uyarısı için [Gateway Geri Döngü Modu](#gateway-loopback-mode) bölümüne bakın.
- Ham `net`, `tls` ve `http2` soketleri, yerel eklentiler ve OpenClaw dışı alt işlemler, proxy ortam değişkenlerini devralıp bunlara uymadıkları sürece Node düzeyi proxy yönlendirmesini baypas edebilir. Çatallanan OpenClaw alt CLI'ları yönetilen proxy URL'sini ve `proxy.loopbackMode` durumunu devralır.
- IRC, operatör tarafından yönetilen ileri proxy yönlendirmesinin dışında kalan ham bir TCP/TLS kanalıdır. Tüm çıkış trafiğinin bu ileri proxy üzerinden geçmesini gerektiren dağıtımlarda, doğrudan IRC çıkışı açıkça onaylanmadıkça `channels.irc.enabled=false` ayarlayın.
- Yerel hata ayıklama proxy'si tanılama aracıdır ve proxy istekleri ile CONNECT tünelleri için doğrudan yukarı akış iletimi, yönetilen proxy modu etkinken varsayılan olarak devre dışıdır; doğrudan iletimi yalnızca onaylı yerel tanılamalar için etkinleştirin.
- Kullanıcı yerel WebUI'ları ve yerel model sunucuları gerektiğinde operatör proxy politikasında izin listesine alınmalıdır; OpenClaw bunlar için genel bir yerel ağ baypası sunmaz. Paketlenmiş Ollama bellek gömme sağlayıcısı daha dardır: yönetilen proxy ana makine geri döngüsüne ulaşamadığında ana makine yerel gömmelerin çalışmaya devam etmesi için yalnızca yapılandırılmış `baseUrl` değerinden türetilen tam ana makine yerel geri döngü gömme kaynağı için korumalı bir doğrudan yol kullanabilir. LAN, tailnet, özel ağ ve genel Ollama gömme ana makineleri yine yönetilen proxy yolunu kullanır. `proxy.loopbackMode: "proxy"` bu Ollama geri döngü trafiğini yönetilen proxy üzerinden gönderir ve `proxy.loopbackMode: "block"` bağlantı açmadan önce bunu reddeder.
- Gateway denetim düzlemi proxy baypası bilerek `localhost` ve değişmez geri döngü IP URL'leriyle sınırlıdır. Yerel doğrudan Gateway denetim düzlemi bağlantıları için `ws://127.0.0.1:18789`, `ws://[::1]:18789` veya `ws://localhost:18789` kullanın; diğer ana makine adları sıradan ana makine adı tabanlı trafik gibi yönlendirilir.
- OpenClaw proxy politikanızı incelemez, test etmez veya sertifikalandırmaz.
- Proxy politikası değişikliklerini güvenlik açısından hassas operasyonel değişiklikler olarak ele alın.

| Yüzey                                                       | Yönetilen proxy durumu                                                                                           |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, yaygın WebSocket istemcileri | Yapılandırıldığında yönetilen proxy kancaları üzerinden yönlendirilir.                                           |
| APNs doğrudan HTTP/2                                       | APNs yönetilen CONNECT yardımcısı üzerinden yönlendirilir.                                                       |
| Gateway denetim düzlemi geri döngüsü                       | Yalnızca yapılandırılmış yerel geri döngü Gateway URL'si için doğrudandır.                                      |
| Hata ayıklama proxy'si yukarı akış iletimi                 | Yerel tanılamalar için açıkça etkinleştirilmedikçe yönetilen proxy modu etkinken devre dışıdır.                  |
| IRC                                                         | Ham TCP/TLS; yönetilen HTTP proxy modu tarafından proxy'lenmez. Doğrudan IRC çıkışı onaylanmadıkça devre dışı bırakın. |
| Diğer ham `net`, `tls` veya `http2` istemci çağrıları       | Birleştirilmeden önce ham soket koruması tarafından sınıflandırılmalıdır.                                        |
