---
read_when:
    - SSRF ve DNS yeniden bağlama saldırılarına karşı derinlemesine savunma istiyorsunuz
    - OpenClaw çalışma zamanı trafiği için harici bir ileri proxy yapılandırma
summary: OpenClaw çalışma zamanı HTTP ve WebSocket trafiğini operatör tarafından yönetilen bir filtreleme proxy'si üzerinden yönlendirme
title: Ağ vekil sunucusu
x-i18n:
    generated_at: "2026-04-30T09:45:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4e879f787571410acdda55dcdbb5fd77aef1d24045af5c9208cba51330a70ca
    source_path: security/network-proxy.md
    workflow: 16
---

# Ağ Proxy’si

OpenClaw, çalışma zamanı HTTP ve WebSocket trafiğini operatör tarafından yönetilen bir ileri proxy üzerinden yönlendirebilir. Bu, merkezi çıkış denetimi, daha güçlü SSRF koruması ve daha iyi ağ denetlenebilirliği isteyen dağıtımlar için isteğe bağlı katmanlı savunmadır.

OpenClaw bir proxy göndermez, indirmez, başlatmaz, yapılandırmaz veya sertifikalandırmaz. Ortamınıza uygun proxy teknolojisini siz çalıştırırsınız; OpenClaw da normal süreç içi HTTP ve WebSocket istemcilerini bunun üzerinden yönlendirir.

## Neden Proxy Kullanılır?

Proxy, operatörlere giden HTTP ve WebSocket trafiği için tek bir ağ denetim noktası sağlar. Bu, SSRF sertleştirmesi dışında da yararlı olabilir:

- Merkezi ilke: her uygulama HTTP çağrı noktasının ağ kurallarını doğru uygulamasına güvenmek yerine tek bir çıkış ilkesini sürdürün.
- Bağlantı zamanı kontrolleri: hedefi DNS çözümlemesinden sonra ve proxy yukarı akış bağlantısını açmadan hemen önce değerlendirin.
- DNS rebinding savunması: uygulama düzeyindeki DNS kontrolü ile gerçek giden bağlantı arasındaki boşluğu azaltın.
- Daha geniş JavaScript kapsaması: sıradan `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch ve benzer istemcileri aynı yol üzerinden yönlendirin.
- Denetlenebilirlik: çıkış sınırında izin verilen ve reddedilen hedefleri günlüğe kaydedin.
- Operasyonel denetim: OpenClaw’ı yeniden oluşturmadan hedef kurallarını, ağ segmentasyonunu, hız sınırlarını veya giden izin listelerini uygulayın.

Proxy yönlendirmesi, normal HTTP ve WebSocket çıkışı için süreç düzeyinde bir korkuluktur. Operatörlere, desteklenen JavaScript HTTP istemcilerini kendi filtreleme proxy’leri üzerinden yönlendirmek için hata durumunda kapalı bir yol sağlar; ancak işletim sistemi düzeyinde bir ağ sanal alanı değildir ve OpenClaw’ın proxy’nin hedef ilkesini sertifikalandırmasını sağlamaz.

## OpenClaw Trafiği Nasıl Yönlendirir?

`proxy.enabled=true` olduğunda ve bir proxy URL’si yapılandırıldığında, `openclaw gateway run`, `openclaw node run` ve `openclaw agent --local` gibi korumalı çalışma zamanı süreçleri normal HTTP ve WebSocket çıkışını yapılandırılmış proxy üzerinden yönlendirir:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Genel sözleşme, bunu uygulamak için kullanılan dahili Node kancaları değil, yönlendirme davranışıdır. OpenClaw Gateway denetim düzlemi WebSocket istemcileri, Gateway URL’si `localhost` veya `127.0.0.1` ya da `[::1]` gibi gerçek bir loopback IP kullandığında local loopback Gateway RPC trafiği için dar bir doğrudan yol kullanır. Bu denetim düzlemi yolu, operatör proxy’si loopback hedeflerini engellese bile loopback Gateway’lere ulaşabilmelidir. Normal çalışma zamanı HTTP ve WebSocket istekleri yine de yapılandırılmış proxy’yi kullanır.

OpenClaw, bu özellik için dahili olarak iki süreç düzeyinde yönlendirme kancası kullanır:

- Undici gönderici yönlendirmesi `fetch`, undici destekli istemciler ve kendi undici göndericisini sağlayan aktarımları kapsar.
- `global-agent` yönlendirmesi, `http.request`, `https.request`, `http.get` ve `https.get` üzerine katmanlanan birçok kitaplık dahil olmak üzere Node çekirdeği `node:http` ve `node:https` çağıranlarını kapsar. Yönetilen proxy modu bu global agent’ı zorunlu kılar, böylece açık Node HTTP agent’ları operatör proxy’sini yanlışlıkla atlamaz.

Bazı Plugin’ler, süreç düzeyinde yönlendirme mevcut olsa bile açık proxy bağlantısı gerektiren özel aktarımlara sahiptir. Örneğin, Telegram’ın Bot API aktarımı kendi HTTP/1 undici göndericisini kullanır ve bu nedenle süreç proxy env değerlerine ek olarak o sahiplik alanına özgü aktarım yolunda yönetilen `OPENCLAW_PROXY_URL` yedeğine uyar.

Proxy URL’sinin kendisi `http://` kullanmalıdır. HTTPS hedefleri proxy üzerinden HTTP `CONNECT` ile hâlâ desteklenir; bu yalnızca OpenClaw’ın `http://127.0.0.1:3128` gibi düz bir HTTP ileri proxy dinleyicisi beklediği anlamına gelir.

Proxy etkinken OpenClaw `no_proxy`, `NO_PROXY` ve `GLOBAL_AGENT_NO_PROXY` değerlerini temizler. Bu atlama listeleri hedef tabanlıdır; bu nedenle `localhost` veya `127.0.0.1` değerlerini orada bırakmak, yüksek riskli SSRF hedeflerinin filtreleme proxy’sini atlamasına izin verir.

Kapanışta OpenClaw önceki proxy ortamını geri yükler ve önbelleğe alınmış süreç yönlendirme durumunu sıfırlar.

## İlgili Proxy Terimleri

- `proxy.enabled` / `proxy.proxyUrl`: OpenClaw çalışma zamanı çıkışı için giden ileri proxy yönlendirmesi. Bu sayfa bu özelliği belgeler.
- `gateway.auth.mode: "trusted-proxy"`: Gateway erişimi için gelen kimlik farkındalıklı ters proxy kimlik doğrulaması. Bkz. [Güvenilen proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).
- `openclaw proxy`: geliştirme ve destek için yerel hata ayıklama proxy’si ve yakalama inceleyicisi. Bkz. [openclaw proxy](/tr/cli/proxy).
- Kanala veya sağlayıcıya özgü proxy ayarları: belirli bir aktarım için sahiplik alanına özgü geçersiz kılmalar. Amaç çalışma zamanı genelinde merkezi çıkış denetimiyse yönetilen ağ proxy’sini tercih edin.

## Yapılandırma

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

URL’yi ortam üzerinden de sağlayabilir, yapılandırmada `proxy.enabled=true` değerini koruyabilirsiniz:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl`, `OPENCLAW_PROXY_URL` değerinden önceliklidir.

`enabled=true` ise ancak geçerli bir proxy URL’si yapılandırılmamışsa, korumalı komutlar doğrudan ağ erişimine geri dönmek yerine başlangıçta başarısız olur.

`openclaw gateway start` ile başlatılan yönetilen Gateway hizmetleri için URL’yi yapılandırmada saklamayı tercih edin:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Ortam yedeği ön planda çalıştırmalar için en uygunudur. Bunu yüklü bir hizmetle kullanırsanız, `OPENCLAW_PROXY_URL` değerini `$OPENCLAW_STATE_DIR/.env` veya `~/.openclaw/.env` gibi hizmetin kalıcı ortamına koyun, ardından launchd, systemd veya Scheduled Tasks’ın gateway’i bu değerle başlatması için hizmeti yeniden yükleyin.

`openclaw --container ...` komutları için OpenClaw, ayarlı olduğunda `OPENCLAW_PROXY_URL` değerini container hedefli alt CLI’ye iletir. URL container içinden erişilebilir olmalıdır; `127.0.0.1` ana makineyi değil container’ın kendisini ifade eder. OpenClaw, bu güvenlik kontrolünü açıkça geçersiz kılmadığınız sürece container hedefli komutlar için loopback proxy URL’lerini reddeder.

## Proxy Gereksinimleri

Proxy ilkesi güvenlik sınırıdır. OpenClaw, proxy’nin doğru hedefleri engellediğini doğrulayamaz.

Proxy’yi şu şekilde yapılandırın:

- Yalnızca loopback’e veya özel güvenilen bir arayüze bağlansın.
- Erişimi, yalnızca OpenClaw süreci, ana makine, container veya hizmet hesabı kullanabilecek şekilde kısıtlasın.
- Hedefleri kendisi çözümlesin ve DNS çözümlemesinden sonra hedef IP’leri engellesin.
- Hem düz HTTP istekleri hem de HTTPS `CONNECT` tünelleri için ilkeyi bağlantı zamanında uygulasın.
- Loopback, özel, link-local, metadata, multicast, ayrılmış veya dokümantasyon aralıkları için hedef tabanlı atlamaları reddetsin.
- DNS çözümleme yoluna tamamen güvenmiyorsanız ana makine adı izin listelerinden kaçının.
- İstek gövdelerini, yetkilendirme üst bilgilerini, çerezleri veya diğer sırları günlüğe kaydetmeden hedefi, kararı, durumu ve nedeni günlüğe kaydetsin.
- Proxy ilkesini sürüm denetiminde tutun ve değişiklikleri güvenlik açısından hassas yapılandırma gibi inceleyin.

## Önerilen Engellenen Hedefler

Bu reddetme listesini herhangi bir ileri proxy, güvenlik duvarı veya çıkış ilkesi için başlangıç noktası olarak kullanın.

OpenClaw uygulama düzeyindeki sınıflandırıcı mantığı `src/infra/net/ssrf.ts` ve `src/shared/net/ip.ts` içinde bulunur. İlgili parite kancaları `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` ve NAT64, 6to4, Teredo, ISATAP ve IPv4 eşlemeli biçimler için gömülü IPv4 sentinel işlemedir. Bu dosyalar, harici bir proxy ilkesini sürdürürken yararlı başvuru kaynaklarıdır; ancak OpenClaw bu kuralları proxy’nize otomatik olarak dışa aktarmaz veya orada uygulamaz.

| Aralık veya ana makine                                                                 | Engelleme nedeni                                      |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 loopback                                        |
| `::1/128`                                                                            | IPv6 loopback                                        |
| `0.0.0.0/8`, `::/128`                                                                | Belirtilmemiş ve bu ağ adresleri                     |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918 özel ağları                                  |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local adresler ve yaygın bulut metadata yolları |
| `169.254.169.254`, `metadata.google.internal`                                        | Bulut metadata hizmetleri                            |
| `100.64.0.0/10`                                                                      | Operatör sınıfı NAT paylaşımlı adres alanı           |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Karşılaştırma testi aralıkları                       |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Özel kullanım ve dokümantasyon aralıkları            |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | Ayrılmış IPv4                                        |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 yerel/özel aralıkları                           |
| `100::/64`, `2001:20::/28`                                                           | IPv6 discard ve ORCHIDv2 aralıkları                  |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Gömülü IPv4 içeren NAT64 önekleri                    |
| `2002::/16`, `2001::/32`                                                             | Gömülü IPv4 içeren 6to4 ve Teredo                    |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4 uyumlu ve IPv4 eşlemeli IPv6                    |

Bulut sağlayıcınız veya ağ platformunuz ek metadata ana makineleri ya da ayrılmış aralıklar belgeliyorsa, bunları da ekleyin.

## Doğrulama

Proxy’yi OpenClaw’ı çalıştıran aynı ana makineden, container’dan veya hizmet hesabından doğrulayın:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

Genel istek başarılı olmalıdır. Loopback ve metadata istekleri proxy’de başarısız olmalıdır.

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

- Proxy, süreç içi JavaScript HTTP ve WebSocket istemcileri için kapsamı iyileştirir; ancak işletim sistemi düzeyinde bir ağ sanal alanı değildir.
- Ham `net`, `tls` ve `http2` soketleri, yerel eklentiler ve alt süreçler, proxy ortam değişkenlerini devralıp bunlara uymadıkları sürece Node düzeyindeki proxy yönlendirmesini atlayabilir.
- Kullanıcı yerel WebUI’leri ve yerel model sunucuları, gerektiğinde operatör proxy ilkesinde izin listesine alınmalıdır; OpenClaw bunlar için genel bir yerel ağ atlaması sunmaz.
- Gateway denetim düzlemi proxy atlaması kasıtlı olarak `localhost` ve gerçek loopback IP URL’leriyle sınırlıdır. Yerel doğrudan Gateway denetim düzlemi bağlantıları için `ws://127.0.0.1:18789`, `ws://[::1]:18789` veya `ws://localhost:18789` kullanın; diğer ana makine adları sıradan ana makine adı tabanlı trafik gibi yönlendirilir.
- OpenClaw proxy ilkenizi incelemez, test etmez veya sertifikalandırmaz.
- Proxy ilkesi değişikliklerini güvenlik açısından hassas operasyonel değişiklikler olarak ele alın.
