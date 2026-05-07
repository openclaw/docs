---
read_when:
    - SSRF ve DNS yeniden bağlama saldırılarına karşı derinlemesine savunma istiyorsunuz
    - OpenClaw çalışma zamanı trafiği için harici bir ileri proxy yapılandırma
summary: OpenClaw çalışma zamanı HTTP ve WebSocket trafiğini operatör tarafından yönetilen filtreleme proxy’si üzerinden yönlendirme
title: Ağ vekil sunucusu
x-i18n:
    generated_at: "2026-05-07T16:23:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22895b7c5521927b7145f55dff9b777e701691f01a6421db0f5b1ff489734775
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw, çalışma zamanı HTTP ve WebSocket trafiğini operatör tarafından yönetilen bir ileri proxy üzerinden yönlendirebilir. Bu, merkezi dışa çıkış denetimi, daha güçlü SSRF koruması ve daha iyi ağ denetlenebilirliği isteyen dağıtımlar için isteğe bağlı derinlemesine savunmadır.

OpenClaw bir proxy sunmaz, indirmez, başlatmaz, yapılandırmaz veya sertifikalandırmaz. Ortamınıza uyan proxy teknolojisini siz çalıştırırsınız ve OpenClaw normal süreç-yerel HTTP ve WebSocket istemcilerini bunun üzerinden yönlendirir.

## Neden proxy kullanılır

Bir proxy, operatörlere giden HTTP ve WebSocket trafiği için tek bir ağ denetim noktası sağlar. Bu, SSRF sertleştirmesi dışında da yararlı olabilir:

- Merkezi ilke: her uygulama HTTP çağrı noktasının ağ kurallarını doğru uygulamasına güvenmek yerine tek bir dışa çıkış ilkesi yönetin.
- Bağlantı zamanı kontrolleri: hedefi DNS çözümlemesinden sonra ve proxy yukarı akış bağlantısını açmadan hemen önce değerlendirin.
- DNS yeniden bağlama savunması: uygulama düzeyindeki DNS kontrolü ile gerçek giden bağlantı arasındaki boşluğu azaltın.
- Daha geniş JavaScript kapsamı: sıradan `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch ve benzeri istemcileri aynı yol üzerinden yönlendirin.
- Denetlenebilirlik: izin verilen ve reddedilen hedefleri dışa çıkış sınırında günlüğe kaydedin.
- Operasyonel denetim: OpenClaw'u yeniden derlemeden hedef kurallarını, ağ segmentasyonunu, hız sınırlarını veya giden izin listelerini uygulayın.

Proxy yönlendirme, normal HTTP ve WebSocket dışa çıkışı için süreç düzeyinde bir korumadır. Operatörlere, desteklenen JavaScript HTTP istemcilerini kendi filtreleme proxy'leri üzerinden yönlendirmek için kapalı hata veren bir yol sağlar; ancak OS düzeyinde bir ağ sandbox'ı değildir ve OpenClaw'un proxy'nin hedef ilkesini sertifikalandırmasını sağlamaz.

## OpenClaw trafiği nasıl yönlendirir

`proxy.enabled=true` olduğunda ve bir proxy URL'si yapılandırıldığında, `openclaw gateway run`, `openclaw node run` ve `openclaw agent --local` gibi korumalı çalışma zamanı süreçleri normal HTTP ve WebSocket dışa çıkışını yapılandırılmış proxy üzerinden yönlendirir:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Genel sözleşme, bunu uygulamak için kullanılan dahili Node hook'ları değil, yönlendirme davranışıdır. OpenClaw Gateway denetim düzlemi WebSocket istemcileri, Gateway URL'si `localhost` veya `127.0.0.1` ya da `[::1]` gibi değişmez bir loopback IP kullandığında local loopback Gateway RPC trafiği için dar bir doğrudan yol kullanır. Bu denetim düzlemi yolu, operatör proxy'si loopback hedeflerini engellese bile loopback Gateway'lere ulaşabilmelidir. Normal çalışma zamanı HTTP ve WebSocket istekleri yine yapılandırılmış proxy'yi kullanır.

Dahili olarak OpenClaw bu özellik için iki süreç düzeyi yönlendirme hook'u kullanır:

- Undici dispatcher yönlendirmesi `fetch`, undici destekli istemciler ve kendi undici dispatcher'ını sağlayan taşıma katmanlarını kapsar.
- `global-agent` yönlendirmesi, `http.request`, `https.request`, `http.get` ve `https.get` üzerine kurulu birçok kütüphane dahil olmak üzere Node çekirdeği `node:http` ve `node:https` çağrılarını kapsar. Yönetilen proxy modu, açık Node HTTP agent'larının operatör proxy'sini yanlışlıkla atlamaması için bu global agent'ı zorunlu kılar.

Bazı plugin'ler, süreç düzeyinde yönlendirme varken bile açık proxy bağlantısı gerektiren özel taşıma katmanlarına sahiptir. Örneğin, Telegram'ın Bot API taşıma katmanı kendi HTTP/1 undici dispatcher'ını kullanır ve bu nedenle o sahipliğe özgü taşıma yolunda süreç proxy env'sine ek olarak yönetilen `OPENCLAW_PROXY_URL` yedeğine uyar.

Proxy URL'sinin kendisi `http://` kullanmalıdır. HTTPS hedefleri proxy üzerinden HTTP `CONNECT` ile yine desteklenir; bu yalnızca OpenClaw'un `http://127.0.0.1:3128` gibi düz bir HTTP ileri-proxy dinleyicisi beklediği anlamına gelir.

Proxy etkinken OpenClaw `no_proxy`, `NO_PROXY` ve `GLOBAL_AGENT_NO_PROXY` değerlerini temizler. Bu baypas listeleri hedef tabanlıdır, bu nedenle `localhost` veya `127.0.0.1` değerlerini orada bırakmak yüksek riskli SSRF hedeflerinin filtreleme proxy'sini atlamasına izin verir.

Kapatma sırasında OpenClaw önceki proxy ortamını geri yükler ve önbelleğe alınmış süreç yönlendirme durumunu sıfırlar.

## İlgili proxy terimleri

- `proxy.enabled` / `proxy.proxyUrl`: OpenClaw çalışma zamanı dışa çıkışı için giden ileri-proxy yönlendirmesi. Bu sayfa bu özelliği belgeler.
- `gateway.auth.mode: "trusted-proxy"`: Gateway erişimi için gelen kimlik duyarlı ters-proxy kimlik doğrulaması. Bkz. [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).
- `openclaw proxy`: geliştirme ve destek için yerel hata ayıklama proxy'si ve yakalama inceleyicisi. Bkz. [openclaw proxy](/tr/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: varsayılan katı DNS pinleme ve ana makine adı ilkesini korurken `web_fetch` için operatör denetimli HTTP(S) env proxy'sinin DNS çözümlemesine izin veren katılım seçeneği. Bkz. [Web fetch](/tr/tools/web-fetch#trusted-env-proxy).
- Kanal veya sağlayıcıya özgü proxy ayarları: belirli bir taşıma katmanı için sahipliğe özgü geçersiz kılmalar. Amaç çalışma zamanı genelinde merkezi dışa çıkış denetimi olduğunda yönetilen ağ proxy'sini tercih edin.

## Yapılandırma

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

URL'yi ortam üzerinden de sağlayabilir, yapılandırmada `proxy.enabled=true` değerini koruyabilirsiniz:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl`, `OPENCLAW_PROXY_URL` değerine göre önceliklidir.

### Gateway Loopback Modu

Yerel Gateway denetim düzlemi istemcileri genellikle `ws://127.0.0.1:18789` gibi bir loopback WebSocket'e bağlanır. Yönetilen proxy etkinken bu trafiğin nasıl davranacağını seçmek için `proxy.loopbackMode` kullanın:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (varsayılan): OpenClaw, yerel Gateway WebSocket trafiğinin doğrudan bağlanabilmesi için Gateway loopback yetkilisini etkin `global-agent` `NO_PROXY` denetleyicisine kaydeder. Etkin Gateway URL'sinin ana makinesi ve portu kaydedildiği için özel loopback Gateway portları çalışır.
- `proxy`: OpenClaw bir Gateway loopback `NO_PROXY` yetkilisi kaydetmez, bu nedenle yerel Gateway trafiği yönetilen proxy üzerinden gönderilir. Proxy uzaktaysa, OpenClaw ana makinesinin loopback hizmeti için proxy'den erişilebilir bir ana makine adına, IP'ye veya tünele eşleme gibi özel yönlendirme sağlamalıdır. Standart uzak proxy'ler `127.0.0.1` ve `localhost` değerlerini OpenClaw ana makinesinden değil, proxy ana makinesinden çözümler.
- `block`: OpenClaw, bir soket açmadan önce loopback Gateway denetim düzlemi bağlantılarını reddeder.

`enabled=true` ise ancak geçerli bir proxy URL'si yapılandırılmamışsa, korumalı komutlar doğrudan ağ erişimine geri dönmek yerine başlatmada başarısız olur.

`openclaw gateway start` ile başlatılan yönetilen gateway hizmetleri için URL'yi yapılandırmada saklamayı tercih edin:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Ortam yedeği ön planda çalışan komutlar için en uygunudur. Bunu kurulu bir hizmetle kullanırsanız, `OPENCLAW_PROXY_URL` değerini `$OPENCLAW_STATE_DIR/.env` veya `~/.openclaw/.env` gibi hizmetin kalıcı ortamına koyun, ardından launchd, systemd veya Scheduled Tasks gateway'i bu değerle başlatsın diye hizmeti yeniden kurun.

`openclaw --container ...` komutları için OpenClaw, ayarlandığında `OPENCLAW_PROXY_URL` değerini container hedefli alt CLI'ya iletir. URL container içinden erişilebilir olmalıdır; `127.0.0.1` ana makineyi değil, container'ın kendisini ifade eder. OpenClaw, bu güvenlik kontrolünü açıkça geçersiz kılmadığınız sürece container hedefli komutlar için loopback proxy URL'lerini reddeder.

## Proxy Gereksinimleri

Proxy ilkesi güvenlik sınırıdır. OpenClaw, proxy'nin doğru hedefleri engellediğini doğrulayamaz.

Proxy'yi şu şekilde yapılandırın:

- Yalnızca loopback'e veya özel güvenilir bir arayüze bağlansın.
- Erişimi yalnızca OpenClaw süreci, ana makinesi, container'ı veya hizmet hesabı kullanabilecek şekilde kısıtlasın.
- Hedefleri kendisi çözümlesin ve DNS çözümlemesinden sonra hedef IP'leri engellesin.
- Hem düz HTTP istekleri hem de HTTPS `CONNECT` tünelleri için bağlantı zamanında ilke uygulasın.
- Loopback, özel, link-local, metadata, multicast, ayrılmış veya dokümantasyon aralıkları için hedef tabanlı baypasları reddetsin.
- DNS çözümleme yoluna tamamen güvenmediğiniz sürece ana makine adı izin listelerinden kaçının.
- İstek gövdelerini, authorization başlıklarını, çerezleri veya diğer gizli bilgileri günlüğe kaydetmeden hedefi, kararı, durumu ve nedeni günlüğe kaydedin.
- Proxy ilkesini sürüm denetimi altında tutun ve değişiklikleri güvenlik açısından hassas yapılandırma gibi inceleyin.

## Önerilen engellenen hedefler

Bu engelleme listesini herhangi bir ileri proxy, güvenlik duvarı veya dışa çıkış ilkesi için başlangıç noktası olarak kullanın.

OpenClaw uygulama düzeyi sınıflandırıcı mantığı `src/infra/net/ssrf.ts` ve `src/shared/net/ip.ts` içinde yer alır. İlgili eşdeğerlik hook'ları `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` ve NAT64, 6to4, Teredo, ISATAP ve IPv4-mapped biçimleri için gömülü IPv4 sentinel işlemesidir. Bu dosyalar harici bir proxy ilkesi sürdürürken yararlı referanslardır; ancak OpenClaw bu kuralları proxy'nize otomatik olarak dışa aktarmaz veya orada uygulamaz.

| Aralık veya ana makine                                                              | Neden engellenmeli                                         |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 loopback                                        |
| `::1/128`                                                                            | IPv6 loopback                                        |
| `0.0.0.0/8`, `::/128`                                                                | Belirtilmemiş ve bu-ağ adresleri               |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918 özel ağları                             |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local adresler ve yaygın bulut metadata yolları |
| `169.254.169.254`, `metadata.google.internal`                                        | Bulut metadata hizmetleri                              |
| `100.64.0.0/10`                                                                      | Taşıyıcı sınıfı NAT paylaşımlı adres alanı               |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Karşılaştırma testi aralıkları                                  |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Özel kullanım ve dokümantasyon aralıkları                 |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | Ayrılmış IPv4                                        |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 yerel/özel aralıkları                            |
| `100::/64`, `2001:20::/28`                                                           | IPv6 discard ve ORCHIDv2 aralıkları                     |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Gömülü IPv4 içeren NAT64 önekleri                    |
| `2002::/16`, `2001::/32`                                                             | Gömülü IPv4 içeren 6to4 ve Teredo                   |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4 uyumlu ve IPv4-mapped IPv6                 |

Bulut sağlayıcınız veya ağ platformunuz ek metadata ana makineleri ya da ayrılmış aralıklar belgeliyorsa, bunları da ekleyin.

## Doğrulama

Proxy'yi OpenClaw'u çalıştıran aynı ana makineden, container'dan veya hizmet hesabından doğrulayın:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Varsayılan olarak, özel hedefler sağlanmadığında komut `https://example.com/` adresinin başarılı olduğunu denetler ve proxy'nin ulaşmaması gereken geçici bir loopback kanaryası başlatır. Varsayılan reddedilen denetim, proxy 2xx olmayan bir ret yanıtı döndürdüğünde veya kanaryayı bir taşıma hatasıyla engellediğinde başarılı olur; başarılı bir yanıt kanaryaya ulaşırsa başarısız olur. Hiçbir proxy etkinleştirilmemiş ve yapılandırılmamışsa doğrulama bir yapılandırma sorunu bildirir; yapılandırmayı değiştirmeden önce tek seferlik ön kontrol için `--proxy-url` kullanın. Dağıtıma özgü beklentileri test etmek için `--allowed-url` ve `--denied-url` kullanın. Doğrudan APNs HTTP/2 tesliminin proxy üzerinden bir CONNECT tüneli açabildiğini ve bir sandbox APNs yanıtı alabildiğini de doğrulamak için `--apns-reachable` ekleyin; yoklama bilerek geçersiz bir sağlayıcı belirteci kullanır, bu nedenle `403 InvalidProviderToken` beklenir ve erişilebilir sayılır. Özel reddedilen hedefler kapalı başarısız olur: herhangi bir HTTP yanıtı, hedefin proxy üzerinden erişilebilir olduğu anlamına gelir ve herhangi bir taşıma hatası sonuçsuz olarak bildirilir çünkü OpenClaw proxy'nin erişilebilir bir kaynağı engellediğini kanıtlayamaz. Doğrulama başarısız olduğunda komut 1 koduyla çıkar.

Otomasyon için `--json` kullanın. JSON çıktısı genel sonucu, geçerli proxy yapılandırma kaynağını, tüm yapılandırma hatalarını ve her hedef denetimini içerir. Proxy URL kimlik bilgileri metin ve JSON çıktısında gizlenir:

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

Genel istek başarılı olmalıdır. Loopback ve metadata istekleri proxy tarafından engellenmelidir. `openclaw proxy validate` için yerleşik loopback kanaryası bir proxy reddi ile erişilebilir bir kaynak arasında ayrım yapabilir. Özel `--denied-url` denetimlerinde bu kanarya yoktur, bu nedenle proxy'niz ayrı olarak doğrulayabileceğiniz dağıtıma özgü bir ret sinyali sunmadıkça hem HTTP yanıtlarını hem de belirsiz taşıma hatalarını doğrulama hatası olarak ele alın.

Ardından OpenClaw proxy yönlendirmesini etkinleştirin:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

veya şunu ayarlayın:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## Sınırlar

- Proxy, süreç içi JavaScript HTTP ve WebSocket istemcileri için kapsamı iyileştirir, ancak OS düzeyinde bir ağ sandbox'ı değildir.
- Gateway loopback denetim düzlemi trafiği varsayılan olarak `proxy.loopbackMode: "gateway-only"` üzerinden doğrudan yerel baypasa gider. OpenClaw bu baypası, yönetilen `global-agent` `NO_PROXY` denetleyicisine etkin Gateway loopback yetkilisini kaydederek uygular. Operatörler Gateway loopback trafiğini yönetilen proxy üzerinden göndermek için `proxy.loopbackMode: "proxy"` ayarlayabilir veya loopback Gateway bağlantılarını reddetmek için `proxy.loopbackMode: "block"` ayarlayabilir. Uzak proxy uyarısı için [Gateway Loopback Modu](#gateway-loopback-mode) bölümüne bakın.
- Ham `net`, `tls` ve `http2` soketleri, yerel eklentiler ve OpenClaw dışı alt süreçler, proxy ortam değişkenlerini devralıp bunlara uymadıkları sürece Node düzeyindeki proxy yönlendirmesini baypas edebilir. Fork edilen OpenClaw alt CLI'ları yönetilen proxy URL'sini ve `proxy.loopbackMode` durumunu devralır.
- IRC, operatör tarafından yönetilen ileri proxy yönlendirmesinin dışında kalan ham bir TCP/TLS kanalıdır. Tüm çıkışın bu ileri proxy üzerinden geçmesini gerektiren dağıtımlarda, doğrudan IRC çıkışı açıkça onaylanmadıkça `channels.irc.enabled=false` ayarlayın.
- Yerel debug proxy tanılama aracıdır ve proxy istekleri ile CONNECT tünelleri için doğrudan yukarı akış iletimi, yönetilen proxy modu etkinken varsayılan olarak devre dışıdır; doğrudan iletimi yalnızca onaylanmış yerel tanılamalar için etkinleştirin.
- Kullanıcının yerel WebUI'ları ve yerel model sunucuları gerektiğinde operatör proxy politikasında izin listesine alınmalıdır; OpenClaw bunlar için genel bir yerel ağ baypası sunmaz.
- Gateway denetim düzlemi proxy baypası bilerek `localhost` ve düz loopback IP URL'leriyle sınırlıdır. Yerel doğrudan Gateway denetim düzlemi bağlantıları için `ws://127.0.0.1:18789`, `ws://[::1]:18789` veya `ws://localhost:18789` kullanın; diğer ana makine adları sıradan ana makine adına dayalı trafik gibi yönlendirilir.
- OpenClaw proxy politikanızı incelemez, test etmez veya sertifikalandırmaz.
- Proxy politikası değişikliklerini güvenlik açısından hassas operasyonel değişiklikler olarak ele alın.

| Yüzey                                                       | Yönetilen proxy durumu                                                                              |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, yaygın WebSocket istemcileri | Yapılandırıldığında yönetilen proxy kancaları üzerinden yönlendirilir.                              |
| APNs doğrudan HTTP/2                                       | APNs yönetilen CONNECT yardımcısı üzerinden yönlendirilir.                                          |
| Gateway denetim düzlemi loopback                           | Yalnızca yapılandırılmış yerel loopback Gateway URL'si için doğrudan.                               |
| Debug proxy yukarı akış iletimi                            | Yerel tanılamalar için açıkça etkinleştirilmedikçe yönetilen proxy modu etkinken devre dışıdır.     |
| IRC                                                         | Ham TCP/TLS; yönetilen HTTP proxy modu tarafından proxy'lenmez. Doğrudan IRC çıkışı onaylanmadıkça devre dışı bırakın. |
| Diğer ham `net`, `tls` veya `http2` istemci çağrıları       | Yayına alınmadan önce ham soket koruması tarafından sınıflandırılmalıdır.                           |
