---
read_when:
    - SSRF ve DNS yeniden bağlama saldırılarına karşı katmanlı savunma istiyorsunuz
    - OpenClaw çalışma zamanı trafiği için harici bir ileri proxy yapılandırma
summary: OpenClaw çalışma zamanı HTTP ve WebSocket trafiğini operatör tarafından yönetilen bir filtreleme proxy'si üzerinden yönlendirme
title: Ağ proxy'si
x-i18n:
    generated_at: "2026-05-04T07:08:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc7140c5ced0e7454a6f85d1ea8f3256bbd28cc0cb42eeafe8e5e6439b90e3f0
    source_path: security/network-proxy.md
    workflow: 16
---

# Ağ Proxy'si

OpenClaw, çalışma zamanı HTTP ve WebSocket trafiğini operatör tarafından yönetilen bir ileri proxy üzerinden yönlendirebilir. Bu, merkezi çıkış kontrolü, daha güçlü SSRF koruması ve daha iyi ağ denetlenebilirliği isteyen dağıtımlar için isteğe bağlı katmanlı savunmadır.

OpenClaw bir proxy göndermez, indirmez, başlatmaz, yapılandırmaz veya sertifikalandırmaz. Ortamınıza uyan proxy teknolojisini siz çalıştırırsınız ve OpenClaw normal süreç-yerel HTTP ve WebSocket istemcilerini bunun üzerinden yönlendirir.

## Neden Proxy Kullanmalı?

Proxy, operatörlere giden HTTP ve WebSocket trafiği için tek bir ağ denetim noktası sağlar. Bu, SSRF sertleştirmesi dışında bile yararlı olabilir:

- Merkezi ilke: her uygulama HTTP çağrı noktasının ağ kurallarını doğru uygulamasına güvenmek yerine tek bir çıkış ilkesi sürdürün.
- Bağlantı zamanı kontrolleri: hedefi DNS çözümlemesinden sonra ve proxy yukarı akış bağlantısını açmadan hemen önce değerlendirin.
- DNS yeniden bağlama savunması: uygulama düzeyindeki DNS kontrolü ile gerçek giden bağlantı arasındaki boşluğu azaltın.
- Daha geniş JavaScript kapsamı: sıradan `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch ve benzer istemcileri aynı yoldan yönlendirin.
- Denetlenebilirlik: izin verilen ve reddedilen hedefleri çıkış sınırında günlüğe kaydedin.
- Operasyonel kontrol: OpenClaw'ı yeniden derlemeden hedef kuralları, ağ segmentasyonu, hız sınırları veya giden izin listeleri uygulayın.

Proxy yönlendirmesi, normal HTTP ve WebSocket çıkışı için süreç düzeyinde bir güvenlik rayıdır. Operatörlere desteklenen JavaScript HTTP istemcilerini kendi filtreleme proxy'leri üzerinden yönlendirmek için varsayılan olarak kapalı başarısız olan bir yol sağlar; ancak bu, işletim sistemi düzeyinde bir ağ sanal alanı değildir ve OpenClaw'ın proxy'nin hedef ilkesini sertifikalandırmasını sağlamaz.

## OpenClaw Trafiği Nasıl Yönlendirir?

`proxy.enabled=true` olduğunda ve bir proxy URL'si yapılandırıldığında, `openclaw gateway run`, `openclaw node run` ve `openclaw agent --local` gibi korunan çalışma zamanı süreçleri normal HTTP ve WebSocket çıkışını yapılandırılmış proxy üzerinden yönlendirir:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Genel sözleşme, bunu uygulamak için kullanılan dahili Node kancaları değil, yönlendirme davranışıdır. OpenClaw Gateway denetim düzlemi WebSocket istemcileri, Gateway URL'si `localhost` veya `127.0.0.1` ya da `[::1]` gibi değişmez bir loopback IP kullandığında local loopback Gateway RPC trafiği için dar bir doğrudan yol kullanır. Bu denetim düzlemi yolu, operatör proxy'si loopback hedeflerini engellese bile loopback Gateway'lere ulaşabilmelidir. Normal çalışma zamanı HTTP ve WebSocket istekleri yine yapılandırılmış proxy'yi kullanır.

OpenClaw, bu özellik için dahili olarak iki süreç düzeyinde yönlendirme kancası kullanır:

- Undici dağıtıcı yönlendirmesi `fetch`, undici destekli istemciler ve kendi undici dağıtıcısını sağlayan taşıyıcıları kapsar.
- `global-agent` yönlendirmesi, `http.request`, `https.request`, `http.get` ve `https.get` üzerine katmanlanmış birçok kitaplık dahil olmak üzere Node çekirdek `node:http` ve `node:https` çağıranlarını kapsar. Yönetilen proxy modu, açık Node HTTP ajanlarının operatör proxy'sini yanlışlıkla atlamaması için bu küresel ajanı zorunlu kılar.

Bazı Plugin'ler, süreç düzeyinde yönlendirme mevcut olsa bile açık proxy bağlantılaması gerektiren özel taşıyıcılara sahiptir. Örneğin, Telegram'ın Bot API taşıyıcısı kendi HTTP/1 undici dağıtıcısını kullanır ve bu nedenle sahibine özel taşıyıcı yolunda süreç proxy ortamına ek olarak yönetilen `OPENCLAW_PROXY_URL` yedeğini de dikkate alır.

Proxy URL'sinin kendisi `http://` kullanmalıdır. HTTPS hedefleri proxy üzerinden HTTP `CONNECT` ile hâlâ desteklenir; bu yalnızca OpenClaw'ın `http://127.0.0.1:3128` gibi düz bir HTTP ileri proxy dinleyicisi beklediği anlamına gelir.

Proxy etkinken OpenClaw `no_proxy`, `NO_PROXY` ve `GLOBAL_AGENT_NO_PROXY` değerlerini temizler. Bu atlama listeleri hedef tabanlıdır; bu nedenle `localhost` veya `127.0.0.1` değerlerini orada bırakmak, yüksek riskli SSRF hedeflerinin filtreleme proxy'sini atlamasına izin verirdi.

Kapatma sırasında OpenClaw önceki proxy ortamını geri yükler ve önbelleğe alınmış süreç yönlendirme durumunu sıfırlar.

## İlgili Proxy Terimleri

- `proxy.enabled` / `proxy.proxyUrl`: OpenClaw çalışma zamanı çıkışı için giden ileri proxy yönlendirmesi. Bu sayfa bu özelliği belgeler.
- `gateway.auth.mode: "trusted-proxy"`: Gateway erişimi için gelen kimlik farkındalıklı ters proxy kimlik doğrulaması. Bkz. [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).
- `openclaw proxy`: geliştirme ve destek için yerel hata ayıklama proxy'si ve yakalama denetçisi. Bkz. [openclaw proxy](/tr/cli/proxy).
- Kanala veya sağlayıcıya özel proxy ayarları: belirli bir taşıyıcı için sahibine özel geçersiz kılmalar. Hedef çalışma zamanı genelinde merkezi çıkış kontrolüyse yönetilen ağ proxy'sini tercih edin.

## Yapılandırma

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Ayrıca yapılandırmada `proxy.enabled=true` tutarken URL'yi ortam üzerinden de sağlayabilirsiniz:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl`, `OPENCLAW_PROXY_URL` değerinden önceliklidir.

`enabled=true` ise ancak geçerli bir proxy URL'si yapılandırılmamışsa, korunan komutlar doğrudan ağ erişimine geri dönmek yerine başlangıçta başarısız olur.

`openclaw gateway start` ile başlatılan yönetilen gateway hizmetleri için URL'yi yapılandırmada saklamayı tercih edin:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Ortam yedeği ön planda çalıştırmalar için en uygunudur. Bunu kurulu bir hizmetle kullanırsanız, `OPENCLAW_PROXY_URL` değerini `$OPENCLAW_STATE_DIR/.env` veya `~/.openclaw/.env` gibi hizmetin kalıcı ortamına koyun, ardından launchd, systemd veya Scheduled Tasks gateway'i bu değerle başlatsın diye hizmeti yeniden kurun.

`openclaw --container ...` komutları için OpenClaw, ayarlandığında `OPENCLAW_PROXY_URL` değerini kapsayıcı hedefli alt CLI'ye iletir. URL kapsayıcının içinden erişilebilir olmalıdır; `127.0.0.1` ana makineyi değil, kapsayıcının kendisini ifade eder. OpenClaw, bu güvenlik kontrolünü açıkça geçersiz kılmadığınız sürece kapsayıcı hedefli komutlar için loopback proxy URL'lerini reddeder.

## Proxy Gereksinimleri

Proxy ilkesi güvenlik sınırıdır. OpenClaw proxy'nin doğru hedefleri engellediğini doğrulayamaz.

Proxy'yi şunları yapacak şekilde yapılandırın:

- Yalnızca loopback'e veya özel güvenilir bir arayüze bağlansın.
- Erişimi yalnızca OpenClaw süreci, ana makine, kapsayıcı veya hizmet hesabı kullanabilecek şekilde kısıtlasın.
- Hedefleri kendisi çözümlesin ve DNS çözümlemesinden sonra hedef IP'leri engellesin.
- Hem düz HTTP istekleri hem de HTTPS `CONNECT` tünelleri için bağlantı zamanında ilke uygulasın.
- Loopback, özel, link-local, metadata, multicast, ayrılmış veya dokümantasyon aralıkları için hedef tabanlı atlamaları reddetsin.
- DNS çözümleme yoluna tamamen güvenmediğiniz sürece ana makine adı izin listelerinden kaçınsın.
- İstek gövdelerini, yetkilendirme başlıklarını, çerezleri veya diğer sırları günlüğe kaydetmeden hedefi, kararı, durumu ve nedeni günlüğe kaydetsin.
- Proxy ilkesini sürüm kontrolü altında tutsun ve değişiklikleri güvenlik açısından hassas yapılandırma gibi gözden geçirsin.

## Önerilen Engellenen Hedefler

Bu reddetme listesini herhangi bir ileri proxy, güvenlik duvarı veya çıkış ilkesi için başlangıç noktası olarak kullanın.

OpenClaw uygulama düzeyindeki sınıflandırıcı mantığı `src/infra/net/ssrf.ts` ve `src/shared/net/ip.ts` içinde bulunur. İlgili eşdeğerlik kancaları `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` ve NAT64, 6to4, Teredo, ISATAP ve IPv4 eşlenmiş biçimler için gömülü IPv4 sentinel işlemesidir. Bu dosyalar harici bir proxy ilkesini sürdürürken yararlı referanslardır, ancak OpenClaw bu kuralları proxy'nize otomatik olarak dışa aktarmaz veya orada uygulamaz.

| Aralık veya ana makine                                                               | Engelleme nedeni                                    |
| ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 loopback                                       |
| `::1/128`                                                                            | IPv6 loopback                                       |
| `0.0.0.0/8`, `::/128`                                                                | Belirtilmemiş ve bu-ağ adresleri                    |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918 özel ağları                                 |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local adresler ve yaygın bulut metadata yolları |
| `169.254.169.254`, `metadata.google.internal`                                        | Bulut metadata hizmetleri                           |
| `100.64.0.0/10`                                                                      | Taşıyıcı sınıfı NAT paylaşımlı adres alanı          |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Kıyaslama aralıkları                                |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Özel kullanım ve dokümantasyon aralıkları           |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                           |
| `240.0.0.0/4`                                                                        | Ayrılmış IPv4                                       |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 yerel/özel aralıkları                          |
| `100::/64`, `2001:20::/28`                                                           | IPv6 atma ve ORCHIDv2 aralıkları                    |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Gömülü IPv4 içeren NAT64 önekleri                   |
| `2002::/16`, `2001::/32`                                                             | Gömülü IPv4 içeren 6to4 ve Teredo                   |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4 uyumlu ve IPv4 eşlenmiş IPv6                   |

Bulut sağlayıcınız veya ağ platformunuz ek metadata ana makineleri ya da ayrılmış aralıklar belgeliyorsa, bunları da ekleyin.

## Doğrulama

Proxy'yi OpenClaw'ı çalıştıran aynı ana makineden, kapsayıcıdan veya hizmet hesabından doğrulayın:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Varsayılan olarak, özel hedef sağlanmadığında komut `https://example.com/` adresinin başarılı olduğunu kontrol eder ve proxy'nin ulaşmaması gereken geçici bir loopback kanaryası başlatır. Varsayılan reddedilen kontrol, proxy 2xx olmayan bir red yanıtı döndürdüğünde veya kanaryayı bir taşıma hatasıyla engellediğinde geçer; başarılı bir yanıt kanaryaya ulaşırsa başarısız olur. Hiçbir proxy etkinleştirilmemiş ve yapılandırılmamışsa doğrulama bir yapılandırma sorunu bildirir; yapılandırmayı değiştirmeden önce tek seferlik ön kontrol için `--proxy-url` kullanın. Dağıtıma özel beklentileri test etmek için `--allowed-url` ve `--denied-url` kullanın. Özel reddedilen hedefler varsayılan olarak kapalı başarısız olur: herhangi bir HTTP yanıtı hedefin proxy üzerinden erişilebilir olduğu anlamına gelir ve herhangi bir taşıma hatası sonuçsuz olarak bildirilir, çünkü OpenClaw proxy'nin erişilebilir bir kaynağı engellediğini kanıtlayamaz. Doğrulama başarısız olduğunda komut 1 koduyla çıkar.

Otomasyon için `--json` kullanın. JSON çıktısı genel sonucu, etkin proxy yapılandırma kaynağını, yapılandırma hatalarını ve her hedef kontrolünü içerir. Proxy URL kimlik bilgileri metin ve JSON çıktısında redakte edilir:

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

Genel istek başarılı olmalıdır. Geri döngü ve meta veri istekleri proxy tarafından engellenmelidir. `openclaw proxy validate` için yerleşik geri döngü kanaryası, bir proxy reddini erişilebilir bir kaynaktan ayırt edebilir. Özel `--denied-url` denetimlerinde bu kanarya yoktur; bu nedenle proxy'niz ayrı olarak doğrulayabileceğiniz dağıtıma özgü bir red sinyali sunmuyorsa hem HTTP yanıtlarını hem de belirsiz aktarım hatalarını doğrulama hatası olarak değerlendirin.

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

- Proxy, süreç içi JavaScript HTTP ve WebSocket istemcileri için kapsamı iyileştirir, ancak işletim sistemi düzeyinde bir ağ sanal alanı değildir.
- Ham `net`, `tls` ve `http2` soketleri, yerel eklentiler ve alt süreçler, proxy ortam değişkenlerini devralıp bunlara uymadıkları sürece Node düzeyindeki proxy yönlendirmesini atlayabilir.
- IRC, operatör tarafından yönetilen ileri proxy yönlendirmesinin dışında kalan ham bir TCP/TLS kanalıdır. Tüm dış trafiğin bu ileri proxy üzerinden geçmesini gerektiren dağıtımlarda, doğrudan IRC dış trafiği açıkça onaylanmadıkça `channels.irc.enabled=false` ayarlayın.
- Yerel hata ayıklama proxy'si tanılama aracıdır ve proxy istekleri ile CONNECT tünelleri için doğrudan yukarı akış iletimi, yönetilen proxy modu etkinken varsayılan olarak devre dışıdır; doğrudan iletimi yalnızca onaylı yerel tanılamalar için etkinleştirin.
- Kullanıcı yerel WebUI'leri ve yerel model sunucuları gerektiğinde operatör proxy politikasında izin listesine eklenmelidir; OpenClaw bunlar için genel bir yerel ağ atlaması sunmaz.
- Gateway denetim düzlemi proxy atlaması özellikle `localhost` ve değişmez geri döngü IP URL'leriyle sınırlıdır. Yerel doğrudan Gateway denetim düzlemi bağlantıları için `ws://127.0.0.1:18789`, `ws://[::1]:18789` veya `ws://localhost:18789` kullanın; diğer ana makine adları sıradan ana makine adına dayalı trafik gibi yönlendirilir.
- OpenClaw proxy politikanızı incelemez, test etmez veya sertifikalandırmaz.
- Proxy politikası değişikliklerini güvenlik açısından hassas operasyonel değişiklikler olarak değerlendirin.
