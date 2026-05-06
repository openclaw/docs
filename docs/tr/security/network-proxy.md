---
read_when:
    - SSRF ve DNS yeniden bağlama saldırılarına karşı derinlemesine savunma istiyorsanız
    - OpenClaw çalışma zamanı trafiği için harici bir ileri proxy yapılandırma
summary: OpenClaw çalışma zamanı HTTP ve WebSocket trafiğini operatör tarafından yönetilen bir filtreleme proxy’si üzerinden yönlendirme
title: Ağ ara sunucusu
x-i18n:
    generated_at: "2026-05-06T09:31:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: d733c690b5f86ef62fe7a35d38fbfcd07910970bca12ca6f74fdb26c8ec4557b
    source_path: security/network-proxy.md
    workflow: 16
---

# Ağ Proxy'si

OpenClaw, çalışma zamanı HTTP ve WebSocket trafiğini operatör tarafından yönetilen bir ileri proxy üzerinden yönlendirebilir. Bu, merkezi çıkış denetimi, daha güçlü SSRF koruması ve daha iyi ağ denetlenebilirliği isteyen dağıtımlar için isteğe bağlı derinlemesine savunmadır.

OpenClaw bir proxy göndermez, indirmez, başlatmaz, yapılandırmaz veya sertifikalandırmaz. Ortamınıza uyan proxy teknolojisini siz çalıştırırsınız ve OpenClaw normal işlem yerelindeki HTTP ve WebSocket istemcilerini bunun üzerinden yönlendirir.

## Neden Proxy Kullanmalı?

Proxy, operatörlere giden HTTP ve WebSocket trafiği için tek bir ağ denetim noktası verir. Bu, SSRF sertleştirmesi dışında da yararlı olabilir:

- Merkezi ilke: ağ kurallarını doğru uygulaması için her uygulama HTTP çağrı noktasına güvenmek yerine tek bir çıkış ilkesi sürdürün.
- Bağlantı zamanı denetimleri: hedefi DNS çözümlemesinden sonra ve proxy yukarı akış bağlantısını açmadan hemen önce değerlendirin.
- DNS rebinding savunması: uygulama düzeyindeki DNS denetimi ile gerçek giden bağlantı arasındaki boşluğu azaltın.
- Daha geniş JavaScript kapsamı: sıradan `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch ve benzeri istemcileri aynı yoldan yönlendirin.
- Denetlenebilirlik: çıkış sınırında izin verilen ve reddedilen hedefleri günlüğe kaydedin.
- Operasyonel denetim: OpenClaw'ı yeniden derlemeden hedef kuralları, ağ segmentasyonu, hız sınırları veya giden izin listeleri uygulayın.

Proxy yönlendirmesi, normal HTTP ve WebSocket çıkışı için işlem düzeyinde bir koruma hattıdır. Operatörlere desteklenen JavaScript HTTP istemcilerini kendi filtreleme proxy'lerinden yönlendirmek için kapalı kalacak şekilde başarısız olan bir yol sağlar, ancak bir işletim sistemi düzeyinde ağ sandbox'ı değildir ve OpenClaw'ın proxy'nin hedef ilkesini sertifikalandırmasını sağlamaz.

## OpenClaw Trafiği Nasıl Yönlendirir?

`proxy.enabled=true` olduğunda ve bir proxy URL'si yapılandırıldığında, `openclaw gateway run`, `openclaw node run` ve `openclaw agent --local` gibi korumalı çalışma zamanı işlemleri normal HTTP ve WebSocket çıkışını yapılandırılmış proxy üzerinden yönlendirir:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Herkese açık sözleşme, bunu uygulamak için kullanılan dahili Node hook'ları değil, yönlendirme davranışıdır. OpenClaw Gateway denetim düzlemi WebSocket istemcileri, Gateway URL'si `localhost` veya `127.0.0.1` ya da `[::1]` gibi değişmez bir loopback IP kullandığında local loopback Gateway RPC trafiği için dar bir doğrudan yol kullanır. Operatör proxy'si loopback hedefleri engellese bile bu denetim düzlemi yolu loopback Gateway'lere erişebilmelidir. Normal çalışma zamanı HTTP ve WebSocket istekleri yine yapılandırılmış proxy'yi kullanır.

OpenClaw bu özellik için dahili olarak iki işlem düzeyinde yönlendirme hook'u kullanır:

- Undici dispatcher yönlendirmesi `fetch`, undici destekli istemciler ve kendi undici dispatcher'ını sağlayan aktarımları kapsar.
- `global-agent` yönlendirmesi, `http.request`, `https.request`, `http.get` ve `https.get` üzerine katmanlanan birçok kitaplık dahil olmak üzere Node çekirdeği `node:http` ve `node:https` çağıranlarını kapsar. Yönetilen proxy modu bu global agent'ı zorunlu kılar, böylece açık Node HTTP agent'ları yanlışlıkla operatör proxy'sini atlamaz.

Bazı plugin'ler, işlem düzeyinde yönlendirme mevcut olsa bile açık proxy kablolaması gerektiren özel aktarımlara sahiptir. Örneğin Telegram'ın Bot API aktarımı kendi HTTP/1 undici dispatcher'ını kullanır ve bu nedenle o sahipliğe özgü aktarım yolunda işlem proxy ortamını ve yönetilen `OPENCLAW_PROXY_URL` yedeğini dikkate alır.

Proxy URL'sinin kendisi `http://` kullanmalıdır. HTTPS hedefleri proxy üzerinden HTTP `CONNECT` ile hâlâ desteklenir; bu yalnızca OpenClaw'ın `http://127.0.0.1:3128` gibi düz bir HTTP ileri proxy dinleyicisi beklediği anlamına gelir.

Proxy etkin durumdayken OpenClaw `no_proxy`, `NO_PROXY` ve `GLOBAL_AGENT_NO_PROXY` değerlerini temizler. Bu atlama listeleri hedef tabanlıdır, bu nedenle `localhost` veya `127.0.0.1` değerlerini orada bırakmak yüksek riskli SSRF hedeflerinin filtreleme proxy'sini atlamasına izin verir.

Kapanışta OpenClaw önceki proxy ortamını geri yükler ve önbelleğe alınmış işlem yönlendirme durumunu sıfırlar.

## İlgili Proxy Terimleri

- `proxy.enabled` / `proxy.proxyUrl`: OpenClaw çalışma zamanı çıkışı için giden ileri proxy yönlendirmesi. Bu sayfa bu özelliği belgeler.
- `gateway.auth.mode: "trusted-proxy"`: Gateway erişimi için gelen, kimlik farkındalığı olan ters proxy kimlik doğrulaması. Bkz. [Güvenilen proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).
- `openclaw proxy`: geliştirme ve destek için yerel hata ayıklama proxy'si ve yakalama inceleyicisi. Bkz. [openclaw proxy](/tr/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: varsayılan katı DNS sabitlemesini ve ana makine adı ilkesini korurken `web_fetch` için operatör denetimli HTTP(S) ortam proxy'sinin DNS çözümlemesine izin veren açık katılım. Bkz. [Web fetch](/tr/tools/web-fetch#trusted-env-proxy).
- Kanal veya sağlayıcıya özgü proxy ayarları: belirli bir aktarım için sahipliğe özgü geçersiz kılmalar. Amaç çalışma zamanı genelinde merkezi çıkış denetimiyse yönetilen ağ proxy'sini tercih edin.

## Yapılandırma

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

`proxy.enabled=true` değerini yapılandırmada tutarken URL'yi ortam üzerinden de sağlayabilirsiniz:

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

- `gateway-only` (varsayılan): OpenClaw, local Gateway WebSocket trafiğinin doğrudan bağlanabilmesi için Gateway loopback yetkisini etkin `global-agent` `NO_PROXY` denetleyicisine kaydeder. Özel loopback Gateway portları çalışır çünkü etkin Gateway URL'sinin ana makinesi ve portu kaydedilir.
- `proxy`: OpenClaw bir Gateway loopback `NO_PROXY` yetkisi kaydetmez, bu nedenle local Gateway trafiği yönetilen proxy üzerinden gönderilir. Proxy uzaktaysa, OpenClaw ana makinesinin loopback hizmeti için onu proxy'nin erişebileceği bir ana makine adına, IP'ye veya tünele eşleme gibi özel yönlendirme sağlamalıdır. Standart uzak proxy'ler `127.0.0.1` ve `localhost` değerlerini OpenClaw ana makinesinden değil, proxy ana makinesinden çözümler.
- `block`: OpenClaw, bir soket açmadan önce loopback Gateway denetim düzlemi bağlantılarını reddeder.

`enabled=true` olduğu halde geçerli bir proxy URL'si yapılandırılmamışsa, korumalı komutlar doğrudan ağ erişimine geri dönmek yerine başlatma sırasında başarısız olur.

`openclaw gateway start` ile başlatılan yönetilen gateway hizmetleri için URL'yi yapılandırmada saklamayı tercih edin:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Ortam yedeği ön planda çalıştırmalar için en uygunudur. Bunu kurulu bir hizmetle kullanırsanız, `OPENCLAW_PROXY_URL` değerini `$OPENCLAW_STATE_DIR/.env` veya `~/.openclaw/.env` gibi hizmetin kalıcı ortamına koyun, ardından launchd, systemd veya Scheduled Tasks'ın gateway'i bu değerle başlatması için hizmeti yeniden kurun.

`openclaw --container ...` komutları için OpenClaw, ayarlanmış olduğunda `OPENCLAW_PROXY_URL` değerini container hedefli alt CLI'ye iletir. URL'ye container içinden erişilebilir olmalıdır; `127.0.0.1` ana makineyi değil container'ın kendisini ifade eder. OpenClaw, bu güvenlik denetimini açıkça geçersiz kılmadığınız sürece container hedefli komutlar için loopback proxy URL'lerini reddeder.

## Proxy Gereksinimleri

Proxy ilkesi güvenlik sınırıdır. OpenClaw, proxy'nin doğru hedefleri engellediğini doğrulayamaz.

Proxy'yi şunlar için yapılandırın:

- Yalnızca loopback veya özel güvenilen bir arayüze bağlanın.
- Erişimi yalnızca OpenClaw işlemi, ana makinesi, container'ı veya hizmet hesabı kullanabilecek şekilde kısıtlayın.
- Hedefleri kendisi çözümlesin ve DNS çözümlemesinden sonra hedef IP'leri engellesin.
- Hem düz HTTP istekleri hem de HTTPS `CONNECT` tünelleri için bağlantı zamanında ilke uygulayın.
- Loopback, özel, link-local, metadata, multicast, ayrılmış veya dokümantasyon aralıkları için hedef tabanlı atlamaları reddedin.
- DNS çözümleme yoluna tamamen güvenmiyorsanız ana makine adı izin listelerinden kaçının.
- İstek gövdelerini, yetkilendirme üst bilgilerini, çerezleri veya diğer gizli değerleri günlüğe kaydetmeden hedefi, kararı, durumu ve nedeni günlüğe kaydedin.
- Proxy ilkesini sürüm denetimi altında tutun ve değişiklikleri güvenlik açısından hassas yapılandırma gibi inceleyin.

## Önerilen Engellenmiş Hedefler

Bu reddetme listesini herhangi bir ileri proxy, güvenlik duvarı veya çıkış ilkesi için başlangıç noktası olarak kullanın.

OpenClaw uygulama düzeyindeki sınıflandırıcı mantığı `src/infra/net/ssrf.ts` ve `src/shared/net/ip.ts` içinde bulunur. İlgili eşdeğerlik hook'ları `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` ve NAT64, 6to4, Teredo, ISATAP ve IPv4 eşlenmiş biçimleri için yerleşik IPv4 sentinel işlemedir. Bu dosyalar harici bir proxy ilkesi sürdürürken yararlı başvuru kaynaklarıdır, ancak OpenClaw bu kuralları proxy'nizde otomatik olarak dışa aktarmaz veya uygulamaz.

| Aralık veya ana makine                                                              | Neden engellenmeli                                      |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                | IPv4 loopback                                           |
| `::1/128`                                                                          | IPv6 loopback                                           |
| `0.0.0.0/8`, `::/128`                                                              | Belirtilmemiş ve bu-ağ adresleri                        |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                    | RFC1918 özel ağları                                     |
| `169.254.0.0/16`, `fe80::/10`                                                      | Link-local adresleri ve yaygın bulut metadata yolları   |
| `169.254.169.254`, `metadata.google.internal`                                      | Bulut metadata hizmetleri                               |
| `100.64.0.0/10`                                                                    | Taşıyıcı sınıfı NAT paylaşılan adres alanı              |
| `198.18.0.0/15`, `2001:2::/48`                                                     | Kıyaslama aralıkları                                    |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Özel kullanım ve dokümantasyon aralıkları               |
| `224.0.0.0/4`, `ff00::/8`                                                          | Multicast                                               |
| `240.0.0.0/4`                                                                      | Ayrılmış IPv4                                           |
| `fc00::/7`, `fec0::/10`                                                            | IPv6 yerel/özel aralıkları                              |
| `100::/64`, `2001:20::/28`                                                         | IPv6 discard ve ORCHIDv2 aralıkları                     |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                   | Yerleşik IPv4 içeren NAT64 önekleri                     |
| `2002::/16`, `2001::/32`                                                           | Yerleşik IPv4 içeren 6to4 ve Teredo                     |
| `::/96`, `::ffff:0:0/96`                                                           | IPv4 uyumlu ve IPv4 eşlenmiş IPv6                       |

Bulut sağlayıcınız veya ağ platformunuz ek metadata ana makineleri ya da ayrılmış aralıklar belgeliyorsa, bunları da ekleyin.

## Doğrulama

Proxy'yi OpenClaw'ı çalıştıran aynı ana makineden, container'dan veya hizmet hesabından doğrulayın:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Varsayılan olarak, özel hedef sağlanmadığında komut `https://example.com/` adresinin başarılı olduğunu denetler ve proxy'nin ulaşmaması gereken geçici bir loopback kanaryası başlatır. Varsayılan reddedilen denetim, proxy 2xx olmayan bir red yanıtı döndürdüğünde veya kanaryayı bir aktarım hatasıyla engellediğinde başarılı olur; başarılı bir yanıt kanaryaya ulaşırsa başarısız olur. Hiçbir proxy etkinleştirilmemiş ve yapılandırılmamışsa doğrulama bir yapılandırma sorunu bildirir; yapılandırmayı değiştirmeden önce tek seferlik bir ön denetim için `--proxy-url` kullanın. Dağıtıma özgü beklentileri test etmek için `--allowed-url` ve `--denied-url` kullanın. Proxy üzerinden CONNECT tüneli açıp sandbox APNs yanıtı alarak doğrudan APNs HTTP/2 tesliminin doğrulanması için `--apns-reachable` ekleyin; sonda kasıtlı olarak geçersiz bir provider token kullanır, bu yüzden `403 InvalidProviderToken` beklenir ve ulaşılabilir sayılır. Özel reddedilen hedefler kapalı hata verir: herhangi bir HTTP yanıtı, hedefin proxy üzerinden ulaşılabilir olduğu anlamına gelir ve herhangi bir aktarım hatası belirsiz olarak bildirilir çünkü OpenClaw, proxy'nin ulaşılabilir bir origin'i engellediğini kanıtlayamaz. Doğrulama hatasında komut 1 koduyla çıkar.

Otomasyon için `--json` kullanın. JSON çıktısı genel sonucu, geçerli proxy yapılandırma kaynağını, yapılandırma hatalarını ve her hedef denetimini içerir. Proxy URL kimlik bilgileri metin ve JSON çıktısında gizlenir:

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

Genel istek başarılı olmalıdır. Loopback ve metadata istekleri proxy tarafından engellenmelidir. `openclaw proxy validate` için yerleşik loopback kanaryası, proxy reddi ile ulaşılabilir bir origin'i ayırt edebilir. Özel `--denied-url` denetimlerinde bu kanarya yoktur, bu yüzden proxy'niz ayrı olarak doğrulayabileceğiniz dağıtıma özgü bir red sinyali sunmadıkça hem HTTP yanıtlarını hem de belirsiz aktarım hatalarını doğrulama hatası olarak ele alın.

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

- Proxy, süreç yerelindeki JavaScript HTTP ve WebSocket istemcileri için kapsamı iyileştirir, ancak işletim sistemi düzeyinde bir ağ sandbox'ı değildir.
- Gateway loopback denetim düzlemi trafiği varsayılan olarak `proxy.loopbackMode: "gateway-only"` üzerinden doğrudan yerel atlamaya ayarlanır. OpenClaw bu atlamayı, etkin Gateway loopback yetkilisini yönetilen `global-agent` `NO_PROXY` denetleyicisine kaydederek uygular. Operatörler, Gateway loopback trafiğini yönetilen proxy üzerinden göndermek için `proxy.loopbackMode: "proxy"` değerini veya loopback Gateway bağlantılarını reddetmek için `proxy.loopbackMode: "block"` değerini ayarlayabilir. Uzak proxy uyarısı için [Gateway Loopback Modu](#gateway-loopback-mode) bölümüne bakın.
- Ham `net`, `tls` ve `http2` soketleri, native addon'lar ve OpenClaw dışı alt süreçler, proxy ortam değişkenlerini devralıp bunlara uymadıkça Node düzeyindeki proxy yönlendirmesini atlayabilir. Fork edilmiş OpenClaw alt CLI'ları yönetilen proxy URL'sini ve `proxy.loopbackMode` durumunu devralır.
- IRC, operatör tarafından yönetilen ileri proxy yönlendirmesinin dışında kalan ham bir TCP/TLS kanalıdır. Tüm çıkış trafiğinin bu ileri proxy üzerinden geçmesini gerektiren dağıtımlarda, doğrudan IRC çıkışı açıkça onaylanmadıkça `channels.irc.enabled=false` ayarlayın.
- Yerel debug proxy'si tanılama aracıdır ve proxy istekleri ile CONNECT tünelleri için doğrudan upstream iletimi, yönetilen proxy modu etkinken varsayılan olarak devre dışıdır; doğrudan iletimi yalnızca onaylı yerel tanılamalar için etkinleştirin.
- Kullanıcı yerel WebUI'ları ve yerel model sunucuları gerektiğinde operatör proxy ilkesinde izin listesine alınmalıdır; OpenClaw bunlar için genel bir yerel ağ atlaması sunmaz.
- Gateway denetim düzlemi proxy atlaması kasıtlı olarak `localhost` ve düz loopback IP URL'leriyle sınırlıdır. Yerel doğrudan Gateway denetim düzlemi bağlantıları için `ws://127.0.0.1:18789`, `ws://[::1]:18789` veya `ws://localhost:18789` kullanın; diğer hostname'ler sıradan hostname tabanlı trafik gibi yönlendirilir.
- OpenClaw proxy ilkenizi incelemez, test etmez veya sertifikalandırmaz.
- Proxy ilkesi değişikliklerini güvenlik açısından hassas operasyonel değişiklikler olarak ele alın.
