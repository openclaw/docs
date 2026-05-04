---
read_when:
    - SSRF ve DNS rebinding saldırılarına karşı derinlemesine savunma istiyorsunuz
    - OpenClaw çalışma zamanı trafiği için harici bir ileri proxy yapılandırma
summary: OpenClaw çalışma zamanı HTTP ve WebSocket trafiğini operatör tarafından yönetilen bir filtreleme proxy'si üzerinden yönlendirme
title: Ağ proxy'si
x-i18n:
    generated_at: "2026-05-04T18:24:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: eedbf3bac14800c34c7ca2e3b6879dac360a88d51b5b7449ddf41a4dd471648b
    source_path: security/network-proxy.md
    workflow: 16
---

# Ağ Proxy'si

OpenClaw, çalışma zamanı HTTP ve WebSocket trafiğini operatör tarafından yönetilen bir ileri proxy üzerinden yönlendirebilir. Bu, merkezi çıkış kontrolü, daha güçlü SSRF koruması ve daha iyi ağ denetlenebilirliği isteyen dağıtımlar için isteğe bağlı derinlemesine savunmadır.

OpenClaw bir proxy göndermez, indirmez, başlatmaz, yapılandırmaz veya sertifikalandırmaz. Ortamınıza uyan proxy teknolojisini siz çalıştırırsınız ve OpenClaw normal süreç yerelindeki HTTP ve WebSocket istemcilerini bunun üzerinden yönlendirir.

## Neden Proxy Kullanılmalı?

Proxy, operatörlere giden HTTP ve WebSocket trafiği için tek bir ağ kontrol noktası sağlar. Bu, SSRF güçlendirmesi dışında da yararlı olabilir:

- Merkezi politika: her uygulama HTTP çağrı noktasının ağ kurallarını doğru uygulamasına güvenmek yerine tek bir çıkış politikası sürdürün.
- Bağlantı zamanı denetimleri: hedefi DNS çözümlemesinden sonra ve proxy yukarı akış bağlantısını açmadan hemen önce değerlendirin.
- DNS rebinding savunması: uygulama düzeyindeki DNS denetimi ile gerçek giden bağlantı arasındaki boşluğu azaltın.
- Daha geniş JavaScript kapsamı: sıradan `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch ve benzeri istemcileri aynı yol üzerinden yönlendirin.
- Denetlenebilirlik: izin verilen ve reddedilen hedefleri çıkış sınırında günlüğe kaydedin.
- Operasyonel kontrol: OpenClaw'u yeniden derlemeden hedef kuralları, ağ segmentasyonu, hız sınırları veya giden izin listeleri uygulayın.

Proxy yönlendirmesi, normal HTTP ve WebSocket çıkışı için süreç düzeyinde bir koruma sınırıdır. Operatörlere desteklenen JavaScript HTTP istemcilerini kendi filtreleme proxy'leri üzerinden yönlendirmek için kapalı başarısız olan bir yol sağlar, ancak işletim sistemi düzeyinde bir ağ sanal alanı değildir ve OpenClaw'un proxy'nin hedef politikasını sertifikalandırmasını sağlamaz.

## OpenClaw Trafiği Nasıl Yönlendirir?

`proxy.enabled=true` olduğunda ve bir proxy URL'si yapılandırıldığında, `openclaw gateway run`, `openclaw node run` ve `openclaw agent --local` gibi korumalı çalışma zamanı süreçleri normal HTTP ve WebSocket çıkışını yapılandırılmış proxy üzerinden yönlendirir:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Genel sözleşme, bunu uygulamak için kullanılan dahili Node kancaları değil, yönlendirme davranışıdır. OpenClaw Gateway kontrol düzlemi WebSocket istemcileri, Gateway URL'si `localhost` veya `127.0.0.1` ya da `[::1]` gibi değişmez bir loopback IP kullandığında local loopback Gateway RPC trafiği için dar bir doğrudan yol kullanır. Bu kontrol düzlemi yolu, operatör proxy'si loopback hedeflerini engellese bile loopback Gateway'lere ulaşabilmelidir. Normal çalışma zamanı HTTP ve WebSocket istekleri yine de yapılandırılmış proxy'yi kullanır.

OpenClaw bu özellik için dahili olarak iki süreç düzeyinde yönlendirme kancası kullanır:

- Undici dispatcher yönlendirmesi `fetch`, undici destekli istemciler ve kendi undici dispatcher'ını sağlayan taşıyıcıları kapsar.
- `global-agent` yönlendirmesi, `http.request`, `https.request`, `http.get` ve `https.get` üzerine katmanlanan birçok kitaplık dahil olmak üzere Node çekirdek `node:http` ve `node:https` çağıranlarını kapsar. Yönetilen proxy modu, açık Node HTTP agent'larının operatör proxy'sini yanlışlıkla atlamaması için bu global agent'ı zorunlu kılar.

Bazı plugin'ler, süreç düzeyinde yönlendirme mevcut olsa bile açık proxy bağlantısı gerektiren özel taşıyıcılara sahiptir. Örneğin, Telegram'ın Bot API taşıyıcısı kendi HTTP/1 undici dispatcher'ını kullanır ve bu nedenle ilgili sahip özelindeki taşıyıcı yolunda süreç proxy ortam değişkenlerini ve yönetilen `OPENCLAW_PROXY_URL` yedeğini dikkate alır.

Proxy URL'sinin kendisi `http://` kullanmalıdır. HTTPS hedefleri proxy üzerinden HTTP `CONNECT` ile hâlâ desteklenir; bu yalnızca OpenClaw'un `http://127.0.0.1:3128` gibi düz bir HTTP ileri proxy dinleyicisi beklediği anlamına gelir.

Proxy etkinken OpenClaw `no_proxy`, `NO_PROXY` ve `GLOBAL_AGENT_NO_PROXY` değerlerini temizler. Bu atlama listeleri hedef tabanlıdır, bu yüzden `localhost` veya `127.0.0.1` değerlerini orada bırakmak, yüksek riskli SSRF hedeflerinin filtreleme proxy'sini atlamasına izin verir.

Kapatma sırasında OpenClaw önceki proxy ortamını geri yükler ve önbelleğe alınmış süreç yönlendirme durumunu sıfırlar.

## İlgili Proxy Terimleri

- `proxy.enabled` / `proxy.proxyUrl`: OpenClaw çalışma zamanı çıkışı için giden ileri proxy yönlendirmesi. Bu sayfa bu özelliği belgeler.
- `gateway.auth.mode: "trusted-proxy"`: Gateway erişimi için gelen kimlik duyarlı ters proxy kimlik doğrulaması. Bkz. [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).
- `openclaw proxy`: geliştirme ve destek için yerel hata ayıklama proxy'si ve yakalama inceleyicisi. Bkz. [openclaw proxy](/tr/cli/proxy).
- Kanal veya sağlayıcıya özel proxy ayarları: belirli bir taşıyıcı için sahip özelindeki geçersiz kılmalar. Amaç çalışma zamanı genelinde merkezi çıkış kontrolü olduğunda yönetilen ağ proxy'sini tercih edin.

## Yapılandırma

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

URL'yi ortam üzerinden de sağlayabilir ve yapılandırmada `proxy.enabled=true` tutabilirsiniz:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl`, `OPENCLAW_PROXY_URL` üzerinde önceliğe sahiptir.

`enabled=true` ise ancak geçerli bir proxy URL'si yapılandırılmamışsa, korumalı komutlar doğrudan ağ erişimine geri dönmek yerine başlangıçta başarısız olur.

`openclaw gateway start` ile başlatılan yönetilen gateway hizmetleri için URL'yi yapılandırmada saklamayı tercih edin:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Ortam yedeği ön planda çalışan komutlar için en uygunudur. Bunu kurulu bir hizmetle kullanırsanız, `OPENCLAW_PROXY_URL` değerini `$OPENCLAW_STATE_DIR/.env` veya `~/.openclaw/.env` gibi hizmetin kalıcı ortamına koyun, ardından launchd, systemd veya Scheduled Tasks gateway'i bu değerle başlatsın diye hizmeti yeniden kurun.

`openclaw --container ...` komutları için OpenClaw, ayarlı olduğunda `OPENCLAW_PROXY_URL` değerini konteyner hedefli alt CLI'ye iletir. URL konteynerin içinden erişilebilir olmalıdır; `127.0.0.1` ana makineyi değil, konteynerin kendisini ifade eder. OpenClaw, bu güvenlik denetimini açıkça geçersiz kılmadığınız sürece konteyner hedefli komutlar için loopback proxy URL'lerini reddeder.

## Proxy Gereksinimleri

Proxy politikası güvenlik sınırıdır. OpenClaw, proxy'nin doğru hedefleri engellediğini doğrulayamaz.

Proxy'yi şunları yapacak şekilde yapılandırın:

- Yalnızca loopback veya özel güvenilir bir arayüze bağlanın.
- Erişimi yalnızca OpenClaw süreci, ana makine, konteyner veya hizmet hesabı kullanabilecek şekilde kısıtlayın.
- Hedefleri kendisi çözümlesin ve DNS çözümlemesinden sonra hedef IP'leri engellesin.
- Hem düz HTTP istekleri hem de HTTPS `CONNECT` tünelleri için bağlantı zamanında politika uygulasın.
- Loopback, özel, link-local, metadata, multicast, ayrılmış veya dokümantasyon aralıkları için hedef tabanlı atlamaları reddetsin.
- DNS çözümleme yoluna tamamen güvenmediğiniz sürece ana makine adı izin listelerinden kaçının.
- İstek gövdelerini, yetkilendirme başlıklarını, çerezleri veya diğer sırları günlüğe kaydetmeden hedefi, kararı, durumu ve nedeni günlüğe kaydedin.
- Proxy politikasını sürüm kontrolü altında tutun ve değişiklikleri güvenlik açısından hassas yapılandırma gibi gözden geçirin.

## Önerilen Engellenmiş Hedefler

Bu reddetme listesini herhangi bir ileri proxy, güvenlik duvarı veya çıkış politikası için başlangıç noktası olarak kullanın.

OpenClaw uygulama düzeyi sınıflandırıcı mantığı `src/infra/net/ssrf.ts` ve `src/shared/net/ip.ts` içinde bulunur. İlgili eşlik kancaları `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` ve NAT64, 6to4, Teredo, ISATAP ve IPv4 eşlemeli biçimler için gömülü IPv4 sentinel işlemesidir. Bu dosyalar harici bir proxy politikası sürdürürken yararlı referanslardır, ancak OpenClaw bu kuralları proxy'nize otomatik olarak dışa aktarmaz veya orada uygulamaz.

| Aralık veya ana makine                                                               | Engelleme nedeni                                      |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 loopback                                         |
| `::1/128`                                                                            | IPv6 loopback                                         |
| `0.0.0.0/8`, `::/128`                                                                | Belirtilmemiş ve bu-ağ adresleri                      |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918 özel ağları                                   |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local adresler ve yaygın bulut metadata yolları  |
| `169.254.169.254`, `metadata.google.internal`                                        | Bulut metadata hizmetleri                             |
| `100.64.0.0/10`                                                                      | Taşıyıcı sınıfı NAT paylaşımlı adres alanı            |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Karşılaştırma testi aralıkları                        |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Özel kullanım ve dokümantasyon aralıkları             |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                             |
| `240.0.0.0/4`                                                                        | Ayrılmış IPv4                                         |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 yerel/özel aralıkları                            |
| `100::/64`, `2001:20::/28`                                                           | IPv6 discard ve ORCHIDv2 aralıkları                   |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Gömülü IPv4 içeren NAT64 önekleri                     |
| `2002::/16`, `2001::/32`                                                             | Gömülü IPv4 içeren 6to4 ve Teredo                     |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4 uyumlu ve IPv4 eşlemeli IPv6                     |

Bulut sağlayıcınız veya ağ platformunuz ek metadata ana makineleri ya da ayrılmış aralıklar belgeliyorsa, bunları da ekleyin.

## Doğrulama

Proxy'yi OpenClaw'u çalıştıran aynı ana makineden, konteynerden veya hizmet hesabından doğrulayın:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Varsayılan olarak, özel hedefler sağlanmadığında komut `https://example.com/` adresinin başarılı olduğunu denetler ve proxy'nin ulaşmaması gereken geçici bir loopback canary başlatır. Varsayılan reddedilen denetim, proxy 2xx olmayan bir reddetme yanıtı döndürdüğünde veya canary'yi bir taşıma hatasıyla engellediğinde başarılı olur; başarılı bir yanıt canary'ye ulaşırsa başarısız olur. Hiçbir proxy etkinleştirilmemiş ve yapılandırılmamışsa doğrulama bir yapılandırma sorunu bildirir; yapılandırmayı değiştirmeden önce tek seferlik ön kontrol için `--proxy-url` kullanın. Dağıtıma özel beklentileri test etmek için `--allowed-url` ve `--denied-url` kullanın. Proxy üzerinden doğrudan APNs HTTP/2 teslimatının bir CONNECT tüneli açabildiğini ve sandbox APNs yanıtı alabildiğini de doğrulamak için `--apns-reachable` ekleyin; prob kasıtlı olarak geçersiz bir sağlayıcı token'ı kullanır, bu nedenle `403 InvalidProviderToken` beklenir ve erişilebilir sayılır. Özel reddedilen hedefler kapalı başarısızdır: herhangi bir HTTP yanıtı hedefe proxy üzerinden ulaşılabildiği anlamına gelir ve herhangi bir taşıma hatası sonuçsuz olarak raporlanır çünkü OpenClaw, proxy'nin erişilebilir bir kaynağı engellediğini kanıtlayamaz. Doğrulama başarısız olduğunda komut kod 1 ile çıkar.

Otomasyon için `--json` kullanın. JSON çıktısı genel sonucu, etkili proxy yapılandırma kaynağını, varsa yapılandırma hatalarını ve her hedef denetimini içerir. Proxy URL kimlik bilgileri metin ve JSON çıktısında redakte edilir:

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

`curl` ile el ile de doğrulayabilirsiniz:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

Genel istek başarılı olmalıdır. Geri döngü ve meta veri istekleri proxy tarafından engellenmelidir. `openclaw proxy validate` için yerleşik geri döngü kanaryası, proxy reddini erişilebilir bir kaynaktan ayırt edebilir. Özel `--denied-url` denetimlerinde bu kanarya yoktur; bu nedenle proxy'niz ayrı olarak doğrulayabileceğiniz dağıtıma özgü bir ret sinyali sunmadığı sürece hem HTTP yanıtlarını hem de belirsiz aktarım hatalarını doğrulama hatası olarak değerlendirin.

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

- Proxy, süreç yerelindeki JavaScript HTTP ve WebSocket istemcileri için kapsamı iyileştirir, ancak işletim sistemi düzeyinde bir ağ sanal alanı değildir.
- Ham `net`, `tls` ve `http2` soketleri, yerel eklentiler ve alt süreçler, proxy ortam değişkenlerini devralıp bunlara uymadıkları sürece Node düzeyindeki proxy yönlendirmesini atlayabilir.
- IRC, operatör tarafından yönetilen ileri proxy yönlendirmesinin dışında kalan ham bir TCP/TLS kanalıdır. Tüm çıkış trafiğinin bu ileri proxy üzerinden geçmesini gerektiren dağıtımlarda, doğrudan IRC çıkış trafiği açıkça onaylanmadıkça `channels.irc.enabled=false` ayarlayın.
- Yerel hata ayıklama proxy'si tanılama aracıdır ve proxy istekleri ile CONNECT tünelleri için doğrudan üst kaynağa iletimi, yönetilen proxy modu etkinken varsayılan olarak devre dışıdır; doğrudan iletimi yalnızca onaylı yerel tanılamalar için etkinleştirin.
- Kullanıcı yerel WebUI'leri ve yerel model sunucuları gerektiğinde operatör proxy politikasında izin listesine alınmalıdır; OpenClaw bunlar için genel bir yerel ağ atlama yolu sunmaz.
- Gateway denetim düzlemi proxy atlaması kasıtlı olarak `localhost` ve değişmez geri döngü IP URL'leriyle sınırlıdır. Yerel doğrudan Gateway denetim düzlemi bağlantıları için `ws://127.0.0.1:18789`, `ws://[::1]:18789` veya `ws://localhost:18789` kullanın; diğer ana makine adları sıradan ana makine adına dayalı trafik gibi yönlendirilir.
- OpenClaw proxy politikanızı incelemez, test etmez veya sertifikalandırmaz.
- Proxy politikası değişikliklerini güvenlik açısından hassas operasyonel değişiklikler olarak değerlendirin.
