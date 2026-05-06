---
read_when:
    - SSRF ve DNS yeniden bağlama saldırılarına karşı derinlemesine savunma istiyorsunuz
    - OpenClaw çalışma zamanı trafiği için harici bir ileri proxy yapılandırma
summary: OpenClaw çalışma zamanı HTTP ve WebSocket trafiğini operatör tarafından yönetilen bir filtreleme proxy'si üzerinden yönlendirme
title: Ağ proxy'si
x-i18n:
    generated_at: "2026-05-06T18:00:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: aed1cd94ce6a32cd8a3f6c7e579011992af87c1ccc40eb53efaa83b020a6792b
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw, çalışma zamanı HTTP ve WebSocket trafiğini operatör tarafından yönetilen bir forward proxy üzerinden yönlendirebilir. Bu, merkezi çıkış kontrolü, daha güçlü SSRF koruması ve daha iyi ağ denetlenebilirliği isteyen dağıtımlar için isteğe bağlı bir derinlemesine savunma katmanıdır.

OpenClaw bir proxy göndermez, indirmez, başlatmaz, yapılandırmaz veya sertifikalandırmaz. Ortamınıza uyan proxy teknolojisini siz çalıştırırsınız; OpenClaw normal süreç yerelindeki HTTP ve WebSocket istemcilerini bunun üzerinden yönlendirir.

## Neden proxy kullanılır?

Proxy, operatörlere dışa giden HTTP ve WebSocket trafiği için tek bir ağ kontrol noktası sağlar. Bu, SSRF sertleştirmesinin dışında da yararlı olabilir:

- Merkezi ilke: her uygulama HTTP çağrı noktasının ağ kurallarını doğru uygulamasına güvenmek yerine tek bir çıkış ilkesi yönetin.
- Bağlantı zamanı denetimleri: hedefi DNS çözümlemesinden sonra ve proxy yukarı akış bağlantısını açmadan hemen önce değerlendirin.
- DNS rebinding savunması: uygulama düzeyindeki DNS denetimi ile gerçek dışa giden bağlantı arasındaki boşluğu azaltın.
- Daha geniş JavaScript kapsamı: sıradan `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch ve benzer istemcileri aynı yol üzerinden yönlendirin.
- Denetlenebilirlik: izin verilen ve reddedilen hedefleri çıkış sınırında kaydedin.
- Operasyonel kontrol: OpenClaw'u yeniden derlemeden hedef kurallarını, ağ segmentasyonunu, hız sınırlarını veya dışa giden allowlist'leri uygulayın.

Proxy yönlendirme, normal HTTP ve WebSocket çıkışı için süreç düzeyinde bir koruma rayıdır. Operatörlere desteklenen JavaScript HTTP istemcilerini kendi filtreleme proxy'leri üzerinden yönlendirmek için fail-closed bir yol sağlar, ancak OS düzeyinde bir ağ sandbox'ı değildir ve OpenClaw'un proxy'nin hedef ilkesini sertifikalandırmasını sağlamaz.

## OpenClaw trafiği nasıl yönlendirir?

`proxy.enabled=true` olduğunda ve bir proxy URL'si yapılandırıldığında, `openclaw gateway run`, `openclaw node run` ve `openclaw agent --local` gibi korumalı çalışma zamanı süreçleri normal HTTP ve WebSocket çıkışını yapılandırılan proxy üzerinden yönlendirir:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Genel sözleşme, bunu uygulamak için kullanılan dahili Node hook'ları değil, yönlendirme davranışıdır. OpenClaw Gateway kontrol düzlemi WebSocket istemcileri, Gateway URL'si `localhost` veya `127.0.0.1` ya da `[::1]` gibi literal bir loopback IP kullandığında local loopback Gateway RPC trafiği için dar bir doğrudan yol kullanır. Operatör proxy'si loopback hedeflerini engellese bile bu kontrol düzlemi yolunun loopback Gateway'lere erişebilmesi gerekir. Normal çalışma zamanı HTTP ve WebSocket istekleri yine de yapılandırılan proxy'yi kullanır.

Dahili olarak OpenClaw, bu özellik için iki süreç düzeyinde yönlendirme hook'u kullanır:

- Undici dispatcher yönlendirmesi `fetch`, undici destekli istemciler ve kendi undici dispatcher'ını sağlayan taşıyıcıları kapsar.
- `global-agent` yönlendirmesi, `http.request`, `https.request`, `http.get` ve `https.get` üzerine kurulu birçok kitaplık dahil olmak üzere Node core `node:http` ve `node:https` çağıranlarını kapsar. Yönetilen proxy modu, açık Node HTTP agent'larının operatör proxy'sini yanlışlıkla atlamaması için bu global agent'ı zorunlu kılar.

Bazı plugin'ler, süreç düzeyinde yönlendirme olsa bile açık proxy bağlantısı gerektiren özel taşıyıcılara sahiptir. Örneğin, Telegram'ın Bot API taşıyıcısı kendi HTTP/1 undici dispatcher'ını kullanır ve bu nedenle süreç proxy env'sine ek olarak ilgili sahibe özgü taşıyıcı yolunda yönetilen `OPENCLAW_PROXY_URL` yedeğini dikkate alır.

Proxy URL'sinin kendisi `http://` kullanmalıdır. HTTPS hedefleri yine de HTTP `CONNECT` ile proxy üzerinden desteklenir; bu yalnızca OpenClaw'un `http://127.0.0.1:3128` gibi düz bir HTTP forward-proxy dinleyicisi beklediği anlamına gelir.

Proxy etkinken OpenClaw `no_proxy`, `NO_PROXY` ve `GLOBAL_AGENT_NO_PROXY` değerlerini temizler. Bu atlama listeleri hedef tabanlıdır; bu nedenle `localhost` veya `127.0.0.1` değerlerini orada bırakmak, yüksek riskli SSRF hedeflerinin filtreleme proxy'sini atlamasına izin verir.

Kapatma sırasında OpenClaw önceki proxy ortamını geri yükler ve önbelleğe alınmış süreç yönlendirme durumunu sıfırlar.

## İlgili proxy terimleri

- `proxy.enabled` / `proxy.proxyUrl`: OpenClaw çalışma zamanı çıkışı için dışa giden forward-proxy yönlendirmesi. Bu sayfa bu özelliği belgeler.
- `gateway.auth.mode: "trusted-proxy"`: Gateway erişimi için içe gelen kimlik farkındalıklı reverse-proxy kimlik doğrulaması. Bkz. [Güvenilen proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).
- `openclaw proxy`: geliştirme ve destek için yerel hata ayıklama proxy'si ve yakalama denetleyicisi. Bkz. [openclaw proxy](/tr/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: varsayılan sıkı DNS pinning ve ana makine adı ilkesini korurken, `web_fetch` için operatör kontrollü bir HTTP(S) env proxy'sinin DNS çözümlemesine izin veren opt-in. Bkz. [Web fetch](/tr/tools/web-fetch#trusted-env-proxy).
- Kanal veya sağlayıcıya özgü proxy ayarları: belirli bir taşıyıcı için sahibe özgü geçersiz kılmalar. Amaç çalışma zamanı genelinde merkezi çıkış kontrolüyse yönetilen ağ proxy'sini tercih edin.

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

Yerel Gateway kontrol düzlemi istemcileri genellikle `ws://127.0.0.1:18789` gibi bir loopback WebSocket'e bağlanır. Yönetilen proxy etkinken bu trafiğin nasıl davranacağını seçmek için `proxy.loopbackMode` kullanın:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (varsayılan): OpenClaw, yerel Gateway WebSocket trafiğinin doğrudan bağlanabilmesi için Gateway loopback authority'sini etkin `global-agent` `NO_PROXY` denetleyicisine kaydeder. Özel loopback Gateway portları çalışır çünkü etkin Gateway URL'sinin host ve port'u kaydedilir.
- `proxy`: OpenClaw bir Gateway loopback `NO_PROXY` authority'si kaydetmez; bu nedenle yerel Gateway trafiği yönetilen proxy üzerinden gönderilir. Proxy uzaksa, OpenClaw host'unun loopback hizmeti için proxy tarafından erişilebilir bir host adına, IP'ye veya tünele eşleme gibi özel yönlendirme sağlamalıdır. Standart uzak proxy'ler `127.0.0.1` ve `localhost` değerlerini OpenClaw host'undan değil, proxy host'undan çözümler.
- `block`: OpenClaw, soket açmadan önce loopback Gateway kontrol düzlemi bağlantılarını reddeder.

`enabled=true` ise ancak geçerli bir proxy URL'si yapılandırılmamışsa, korumalı komutlar doğrudan ağ erişimine geri dönmek yerine başlatmada başarısız olur.

`openclaw gateway start` ile başlatılan yönetilen gateway hizmetleri için URL'yi yapılandırmada saklamayı tercih edin:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Ortam yedeği ön plan çalıştırmaları için en uygundur. Bunu kurulu bir hizmetle kullanırsanız, `OPENCLAW_PROXY_URL` değerini `$OPENCLAW_STATE_DIR/.env` veya `~/.openclaw/.env` gibi hizmetin kalıcı ortamına koyun, ardından launchd, systemd veya Scheduled Tasks'ın gateway'i bu değerle başlatması için hizmeti yeniden kurun.

`openclaw --container ...` komutları için OpenClaw, ayarlandığında `OPENCLAW_PROXY_URL` değerini konteyner hedefli alt CLI'ye iletir. URL konteynerin içinden erişilebilir olmalıdır; `127.0.0.1` host'u değil, konteynerin kendisini ifade eder. OpenClaw, bu güvenlik denetimini açıkça geçersiz kılmadığınız sürece konteyner hedefli komutlar için loopback proxy URL'lerini reddeder.

## Proxy Gereksinimleri

Proxy ilkesi güvenlik sınırıdır. OpenClaw proxy'nin doğru hedefleri engellediğini doğrulayamaz.

Proxy'yi şunları yapacak şekilde yapılandırın:

- Yalnızca loopback'e veya özel güvenilen bir arabirime bind edin.
- Erişimi yalnızca OpenClaw süreci, host'u, konteyneri veya hizmet hesabı kullanabilecek şekilde kısıtlayın.
- Hedefleri kendisi çözümlesin ve DNS çözümlemesinden sonra hedef IP'leri engellesin.
- Hem düz HTTP istekleri hem de HTTPS `CONNECT` tünelleri için bağlantı zamanında ilke uygulasın.
- Loopback, özel, link-local, metadata, multicast, ayrılmış veya dokümantasyon aralıkları için hedef tabanlı atlamaları reddetsin.
- DNS çözümleme yoluna tamamen güvenmediğiniz sürece host adı allowlist'lerinden kaçının.
- İstek gövdelerini, authorization başlıklarını, çerezleri veya diğer gizli bilgileri kaydetmeden hedefi, kararı, durumu ve nedeni kaydetsin.
- Proxy ilkesini sürüm kontrolünde tutun ve değişiklikleri güvenlik açısından hassas yapılandırma gibi gözden geçirin.

## Önerilen engellenen hedefler

Bu denylist'i herhangi bir forward proxy, güvenlik duvarı veya çıkış ilkesi için başlangıç noktası olarak kullanın.

OpenClaw uygulama düzeyindeki sınıflandırıcı mantığı `src/infra/net/ssrf.ts` ve `src/shared/net/ip.ts` içinde bulunur. İlgili parity hook'ları `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` ve NAT64, 6to4, Teredo, ISATAP ve IPv4-mapped biçimleri için gömülü IPv4 sentinel işlemesidir. Bu dosyalar harici bir proxy ilkesini sürdürürken yararlı referanslardır, ancak OpenClaw bu kuralları proxy'nize otomatik olarak dışa aktarmaz veya orada uygulamaz.

| Aralık veya host                                                                      | Neden engellenmeli                                      |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 loopback                                           |
| `::1/128`                                                                            | IPv6 loopback                                           |
| `0.0.0.0/8`, `::/128`                                                                | Belirtilmemiş ve bu-ağ adresleri                        |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918 özel ağları                                     |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local adresler ve yaygın bulut metadata yolları    |
| `169.254.169.254`, `metadata.google.internal`                                        | Bulut metadata hizmetleri                               |
| `100.64.0.0/10`                                                                      | Carrier-grade NAT paylaşımlı adres alanı                |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Benchmarking aralıkları                                 |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Özel kullanım ve dokümantasyon aralıkları               |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                               |
| `240.0.0.0/4`                                                                        | Ayrılmış IPv4                                           |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 yerel/özel aralıkları                              |
| `100::/64`, `2001:20::/28`                                                           | IPv6 discard ve ORCHIDv2 aralıkları                     |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Gömülü IPv4 içeren NAT64 önekleri                       |
| `2002::/16`, `2001::/32`                                                             | Gömülü IPv4 içeren 6to4 ve Teredo                       |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-compatible ve IPv4-mapped IPv6                     |

Bulut sağlayıcınız veya ağ platformunuz ek metadata host'ları ya da ayrılmış aralıklar belgeliyorsa, bunları da ekleyin.

## Doğrulama

Proxy'yi OpenClaw'u çalıştıran aynı host, konteyner veya hizmet hesabından doğrulayın:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Varsayılan olarak, özel hedefler sağlanmadığında komut `https://example.com/` adresinin başarılı olduğunu denetler ve proxy’nin erişmemesi gereken geçici bir geri döngü kanaryası başlatır. Varsayılan reddedilen denetim, proxy 2xx olmayan bir ret yanıtı döndürdüğünde veya kanaryayı bir taşıma hatasıyla engellediğinde başarılı olur; başarılı bir yanıt kanaryaya ulaşırsa başarısız olur. Hiçbir proxy etkinleştirilmemiş ve yapılandırılmamışsa doğrulama bir yapılandırma sorunu bildirir; yapılandırmayı değiştirmeden önce tek seferlik ön kontrol için `--proxy-url` kullanın. Dağıtıma özgü beklentileri test etmek için `--allowed-url` ve `--denied-url` kullanın. Doğrudan APNs HTTP/2 tesliminin proxy üzerinden bir CONNECT tüneli açabildiğini ve sandbox APNs yanıtı alabildiğini de doğrulamak için `--apns-reachable` ekleyin; yoklama kasıtlı olarak geçersiz bir sağlayıcı belirteci kullanır, bu nedenle `403 InvalidProviderToken` beklenir ve erişilebilir sayılır. Özel reddedilen hedefler kapalı hata davranışına sahiptir: herhangi bir HTTP yanıtı, hedefe proxy üzerinden erişilebildiği anlamına gelir ve herhangi bir taşıma hatası, OpenClaw proxy’nin erişilebilir bir kaynağı engellediğini kanıtlayamadığı için sonuçsuz olarak bildirilir. Doğrulama hatasında komut 1 koduyla çıkar.

Otomasyon için `--json` kullanın. JSON çıktısı genel sonucu, etkin proxy yapılandırma kaynağını, varsa yapılandırma hatalarını ve her hedef denetimini içerir. Proxy URL kimlik bilgileri metin ve JSON çıktısında gizlenir:

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

Genel istek başarılı olmalıdır. Geri döngü ve meta veri istekleri proxy tarafından engellenmelidir. `openclaw proxy validate` için yerleşik geri döngü kanaryası, bir proxy reddini erişilebilir bir kaynaktan ayırt edebilir. Özel `--denied-url` denetimlerinde bu kanarya yoktur, bu nedenle proxy’niz ayrıca doğrulayabileceğiniz dağıtıma özgü bir ret sinyali sunmadıkça hem HTTP yanıtlarını hem de belirsiz taşıma hatalarını doğrulama hataları olarak ele alın.

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

- Proxy, süreç yerelindeki JavaScript HTTP ve WebSocket istemcileri için kapsamı iyileştirir, ancak işletim sistemi düzeyinde bir ağ korumalı alanı değildir.
- Gateway geri döngü denetim düzlemi trafiği varsayılan olarak `proxy.loopbackMode: "gateway-only"` aracılığıyla doğrudan yerel atlamayı kullanır. OpenClaw bu atlamayı, etkin Gateway geri döngü yetkilisini yönetilen `global-agent` `NO_PROXY` denetleyicisine kaydederek uygular. Operatörler Gateway geri döngü trafiğini yönetilen proxy üzerinden göndermek için `proxy.loopbackMode: "proxy"` veya geri döngü Gateway bağlantılarını reddetmek için `proxy.loopbackMode: "block"` ayarlayabilir. Uzak proxy uyarısı için [Gateway Geri Döngü Modu](#gateway-loopback-mode) bölümüne bakın.
- Ham `net`, `tls` ve `http2` soketleri, yerel eklentiler ve OpenClaw dışı alt süreçler, proxy ortam değişkenlerini devralıp bunlara uymadıkları sürece Node düzeyinde proxy yönlendirmesini atlayabilir. Çatallanan OpenClaw alt CLI’ları yönetilen proxy URL’sini ve `proxy.loopbackMode` durumunu devralır.
- IRC, operatör tarafından yönetilen ileri proxy yönlendirmesinin dışında kalan ham bir TCP/TLS kanalıdır. Tüm çıkış trafiğinin bu ileri proxy üzerinden geçmesini gerektiren dağıtımlarda, doğrudan IRC çıkışı açıkça onaylanmadıkça `channels.irc.enabled=false` ayarlayın.
- Yerel hata ayıklama proxy’si tanılama aracıdır ve proxy istekleri ile CONNECT tünelleri için doğrudan üst akış iletimi, yönetilen proxy modu etkinken varsayılan olarak devre dışıdır; doğrudan iletimi yalnızca onaylanmış yerel tanılamalar için etkinleştirin.
- Kullanıcıya ait yerel WebUI’ler ve yerel model sunucuları gerektiğinde operatör proxy ilkesinde izin verilenler listesine eklenmelidir; OpenClaw bunlar için genel bir yerel ağ atlaması sunmaz.
- Gateway denetim düzlemi proxy atlaması kasıtlı olarak `localhost` ve değişmez geri döngü IP URL’leriyle sınırlıdır. Yerel doğrudan Gateway denetim düzlemi bağlantıları için `ws://127.0.0.1:18789`, `ws://[::1]:18789` veya `ws://localhost:18789` kullanın; diğer ana makine adları sıradan ana makine adına dayalı trafik gibi yönlendirilir.
- OpenClaw proxy ilkenizi incelemez, test etmez veya sertifikalandırmaz.
- Proxy ilkesi değişikliklerini güvenlik açısından hassas operasyonel değişiklikler olarak ele alın.
