---
read_when:
    - SSRF ve DNS yeniden bağlama saldırılarına karşı katmanlı savunma istiyorsunuz
    - OpenClaw çalışma zamanı trafiği için harici bir ileri proxy yapılandırma
summary: OpenClaw çalışma zamanı HTTP ve WebSocket trafiğini operatör tarafından yönetilen bir filtreleme proxy'si üzerinden yönlendirme
title: Ağ vekil sunucusu
x-i18n:
    generated_at: "2026-05-05T01:49:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7ab345d172d63e388ff1221535efd19934dcbf3173f95bc69131f9ad672e0df
    source_path: security/network-proxy.md
    workflow: 16
---

# Ağ Proxy'si

OpenClaw, çalışma zamanı HTTP ve WebSocket trafiğini operatör tarafından yönetilen bir ileri proxy üzerinden yönlendirebilir. Bu, merkezi çıkış denetimi, daha güçlü SSRF koruması ve daha iyi ağ denetlenebilirliği isteyen dağıtımlar için isteğe bağlı derinlemesine savunmadır.

OpenClaw bir proxy göndermez, indirmez, başlatmaz, yapılandırmaz veya sertifikalandırmaz. Ortamınıza uyan proxy teknolojisini siz çalıştırırsınız ve OpenClaw normal işlem yerel HTTP ve WebSocket istemcilerini bunun üzerinden yönlendirir.

## Neden Proxy Kullanmalı?

Bir proxy, operatörlere giden HTTP ve WebSocket trafiği için tek bir ağ denetim noktası sağlar. Bu, SSRF güçlendirmesi dışında da yararlı olabilir:

- Merkezi ilke: her uygulama HTTP çağrı noktasının ağ kurallarını doğru uygulamasına güvenmek yerine tek bir çıkış ilkesi sürdürün.
- Bağlanma zamanı denetimleri: hedefi DNS çözümlemesinden sonra ve proxy yukarı akış bağlantısını açmadan hemen önce değerlendirin.
- DNS rebinding savunması: uygulama düzeyi DNS denetimi ile gerçek giden bağlantı arasındaki boşluğu azaltın.
- Daha geniş JavaScript kapsamı: sıradan `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch ve benzeri istemcileri aynı yol üzerinden yönlendirin.
- Denetlenebilirlik: izin verilen ve reddedilen hedefleri çıkış sınırında günlüğe kaydedin.
- Operasyonel denetim: OpenClaw'ı yeniden derlemeden hedef kuralları, ağ segmentasyonu, hız sınırları veya giden izin listeleri uygulayın.

Proxy yönlendirmesi, normal HTTP ve WebSocket çıkışı için işlem düzeyinde bir korkuluktur. Operatörlere desteklenen JavaScript HTTP istemcilerini kendi filtreleme proxy'leri üzerinden yönlendirmek için hata durumunda kapalı kalan bir yol sağlar, ancak işletim sistemi düzeyinde bir ağ sandbox'ı değildir ve OpenClaw'ın proxy'nin hedef ilkesini sertifikalandırmasını sağlamaz.

## OpenClaw Trafiği Nasıl Yönlendirir?

`proxy.enabled=true` olduğunda ve bir proxy URL'si yapılandırıldığında, `openclaw gateway run`, `openclaw node run` ve `openclaw agent --local` gibi korumalı çalışma zamanı işlemleri normal HTTP ve WebSocket çıkışını yapılandırılmış proxy üzerinden yönlendirir:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Genel sözleşme, bunu uygulamak için kullanılan dahili Node kancaları değil, yönlendirme davranışıdır. OpenClaw Gateway denetim düzlemi WebSocket istemcileri, Gateway URL'si `localhost` veya `127.0.0.1` ya da `[::1]` gibi değişmez bir geri döngü IP'si kullandığında local loopback Gateway RPC trafiği için dar bir doğrudan yol kullanır. Bu denetim düzlemi yolu, operatör proxy'si geri döngü hedeflerini engellediğinde bile geri döngü Gateway'lerine ulaşabilmelidir. Normal çalışma zamanı HTTP ve WebSocket istekleri yine de yapılandırılmış proxy'yi kullanır.

Dahili olarak OpenClaw, bu özellik için iki işlem düzeyi yönlendirme kancası kullanır:

- Undici dağıtıcı yönlendirmesi `fetch`, undici destekli istemciler ve kendi undici dağıtıcısını sağlayan aktarımları kapsar.
- `global-agent` yönlendirmesi, `http.request`, `https.request`, `http.get` ve `https.get` üzerine katmanlanan birçok kitaplık dahil olmak üzere Node çekirdeği `node:http` ve `node:https` çağıranlarını kapsar. Yönetilen proxy modu, açık Node HTTP aracıları operatör proxy'sini yanlışlıkla atlamasın diye bu küresel aracıyı zorunlu kılar.

Bazı Plugin'ler, işlem düzeyi yönlendirme var olsa bile açık proxy bağlantısı gerektiren özel aktarımlara sahiptir. Örneğin Telegram'ın Bot API aktarımı kendi HTTP/1 undici dağıtıcısını kullanır ve bu nedenle işlem proxy ortamını ve bu sahip özel aktarım yolundaki yönetilen `OPENCLAW_PROXY_URL` geri dönüşünü dikkate alır.

Proxy URL'sinin kendisi `http://` kullanmalıdır. HTTPS hedefleri, HTTP `CONNECT` ile proxy üzerinden yine desteklenir; bu yalnızca OpenClaw'ın `http://127.0.0.1:3128` gibi düz bir HTTP ileri proxy dinleyicisi beklediği anlamına gelir.

Proxy etkinken OpenClaw `no_proxy`, `NO_PROXY` ve `GLOBAL_AGENT_NO_PROXY` değerlerini temizler. Bu atlama listeleri hedef tabanlıdır, bu nedenle orada `localhost` veya `127.0.0.1` bırakmak, yüksek riskli SSRF hedeflerinin filtreleme proxy'sini atlamasına izin verirdi.

Kapanışta OpenClaw önceki proxy ortamını geri yükler ve önbelleğe alınmış işlem yönlendirme durumunu sıfırlar.

## İlgili Proxy Terimleri

- `proxy.enabled` / `proxy.proxyUrl`: OpenClaw çalışma zamanı çıkışı için giden ileri proxy yönlendirmesi. Bu sayfa bu özelliği belgeler.
- `gateway.auth.mode: "trusted-proxy"`: Gateway erişimi için gelen kimlik duyarlı ters proxy kimlik doğrulaması. Bkz. [Güvenilen proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).
- `openclaw proxy`: geliştirme ve destek için yerel hata ayıklama proxy'si ve yakalama denetleyicisi. Bkz. [openclaw proxy](/tr/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: varsayılan katı DNS sabitlemesini ve ana makine adı ilkesini korurken `web_fetch` için operatör denetimli bir HTTP(S) ortam proxy'sinin DNS çözümlemesine izin vermek üzere isteğe bağlı katılım. Bkz. [Web getirme](/tr/tools/web-fetch#trusted-env-proxy).
- Kanal veya sağlayıcıya özel proxy ayarları: belirli bir aktarım için sahip özel geçersiz kılmaları. Amaç çalışma zamanı genelinde merkezi çıkış denetimiyse yönetilen ağ proxy'sini tercih edin.

## Yapılandırma

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

URL'yi ortam üzerinden de sağlayabilir, yapılandırmada `proxy.enabled=true` tutabilirsiniz:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl`, `OPENCLAW_PROXY_URL` değerine göre önceliklidir.

`enabled=true` ise ancak geçerli bir proxy URL'si yapılandırılmamışsa, korumalı komutlar doğrudan ağ erişimine geri dönmek yerine başlatma sırasında başarısız olur.

`openclaw gateway start` ile başlatılan yönetilen gateway hizmetleri için URL'yi yapılandırmada saklamayı tercih edin:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Ortam geri dönüşü ön planda çalıştırmalar için en uygunudur. Bunu kurulu bir hizmetle kullanırsanız `OPENCLAW_PROXY_URL` değerini `$OPENCLAW_STATE_DIR/.env` veya `~/.openclaw/.env` gibi hizmetin kalıcı ortamına koyun, ardından launchd, systemd veya Scheduled Tasks Gateway'i bu değerle başlatsın diye hizmeti yeniden kurun.

`openclaw --container ...` komutları için OpenClaw, ayarlandığında `OPENCLAW_PROXY_URL` değerini konteyner hedefli alt CLI'ya iletir. URL'ye konteynerin içinden ulaşılabilir olmalıdır; `127.0.0.1` ana makineyi değil konteynerin kendisini ifade eder. OpenClaw, bu güvenlik denetimini açıkça geçersiz kılmadığınız sürece konteyner hedefli komutlar için geri döngü proxy URL'lerini reddeder.

## Proxy Gereksinimleri

Proxy ilkesi güvenlik sınırıdır. OpenClaw, proxy'nin doğru hedefleri engellediğini doğrulayamaz.

Proxy'yi şu şekilde yapılandırın:

- Yalnızca geri döngüye veya özel güvenilen bir arayüze bağlanın.
- Erişimi yalnızca OpenClaw işlemi, ana makine, konteyner veya hizmet hesabı kullanabilecek şekilde kısıtlayın.
- Hedefleri kendisi çözümlesin ve DNS çözümlemesinden sonra hedef IP'leri engellesin.
- Hem düz HTTP istekleri hem de HTTPS `CONNECT` tünelleri için ilkeyi bağlanma zamanında uygulasın.
- Geri döngü, özel, link-local, metadata, çok noktaya yayın, ayrılmış veya belgeleme aralıkları için hedef tabanlı atlamaları reddetsin.
- DNS çözümleme yoluna tamamen güvenmediğiniz sürece ana makine adı izin listelerinden kaçının.
- İstek gövdelerini, yetkilendirme üstbilgilerini, çerezleri veya diğer sırları günlüğe kaydetmeden hedefi, kararı, durumu ve nedeni günlüğe kaydedin.
- Proxy ilkesini sürüm denetimi altında tutun ve değişiklikleri güvenlik duyarlı yapılandırma gibi gözden geçirin.

## Önerilen Engellenmiş Hedefler

Bu ret listesini herhangi bir ileri proxy, güvenlik duvarı veya çıkış ilkesi için başlangıç noktası olarak kullanın.

OpenClaw uygulama düzeyi sınıflandırıcı mantığı `src/infra/net/ssrf.ts` ve `src/shared/net/ip.ts` içinde bulunur. İlgili eşlik kancaları `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` ve NAT64, 6to4, Teredo, ISATAP ve IPv4 eşlenmiş biçimler için gömülü IPv4 sentinel işlemesidir. Bu dosyalar harici bir proxy ilkesi sürdürürken yararlı başvuru kaynaklarıdır, ancak OpenClaw bu kuralları proxy'nize otomatik olarak dışa aktarmaz veya orada uygulamaz.

| Aralık veya ana makine                                                              | Neden engellenmeli                                  |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 geri döngü                                      |
| `::1/128`                                                                            | IPv6 geri döngü                                      |
| `0.0.0.0/8`, `::/128`                                                                | Belirtilmemiş ve bu ağ adresleri                     |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918 özel ağları                                  |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local adresleri ve yaygın bulut metadata yolları |
| `169.254.169.254`, `metadata.google.internal`                                        | Bulut metadata hizmetleri                            |
| `100.64.0.0/10`                                                                      | Taşıyıcı sınıfı NAT paylaşılan adres alanı           |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Kıyaslama aralıkları                                 |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Özel kullanım ve belgeleme aralıkları                |
| `224.0.0.0/4`, `ff00::/8`                                                            | Çok noktaya yayın                                    |
| `240.0.0.0/4`                                                                        | Ayrılmış IPv4                                        |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 yerel/özel aralıkları                           |
| `100::/64`, `2001:20::/28`                                                           | IPv6 discard ve ORCHIDv2 aralıkları                  |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Gömülü IPv4 içeren NAT64 önekleri                    |
| `2002::/16`, `2001::/32`                                                             | Gömülü IPv4 içeren 6to4 ve Teredo                    |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4 uyumlu ve IPv4 eşlenmiş IPv6                    |

Bulut sağlayıcınız veya ağ platformunuz ek metadata ana makineleri ya da ayrılmış aralıklar belgeliyorsa onları da ekleyin.

## Doğrulama

Proxy'yi OpenClaw'ı çalıştıran aynı ana makineden, konteynerden veya hizmet hesabından doğrulayın:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Varsayılan olarak, özel hedefler sağlanmadığında komut `https://example.com/` adresinin başarılı olduğunu denetler ve proxy'nin ulaşmaması gereken geçici bir geri döngü canary'si başlatır. Varsayılan reddedilen denetim, proxy 2xx olmayan bir ret yanıtı döndürdüğünde veya canary'yi bir aktarım hatasıyla engellediğinde başarılı olur; başarılı bir yanıt canary'ye ulaşırsa başarısız olur. Hiçbir proxy etkinleştirilmemiş ve yapılandırılmamışsa doğrulama bir yapılandırma sorunu bildirir; yapılandırmayı değiştirmeden önce tek seferlik bir ön denetim için `--proxy-url` kullanın. Dağıtıma özel beklentileri test etmek için `--allowed-url` ve `--denied-url` kullanın. Doğrudan APNs HTTP/2 teslimatının proxy üzerinden bir CONNECT tüneli açabildiğini ve sandbox APNs yanıtı alabildiğini de doğrulamak için `--apns-reachable` ekleyin; yoklama kasıtlı olarak geçersiz bir sağlayıcı belirteci kullanır, bu nedenle `403 InvalidProviderToken` beklenir ve ulaşılabilir sayılır. Özel reddedilen hedefler hata durumunda kapalıdır: herhangi bir HTTP yanıtı hedefin proxy üzerinden ulaşılabilir olduğu anlamına gelir ve herhangi bir aktarım hatası sonuçsuz olarak bildirilir çünkü OpenClaw proxy'nin ulaşılabilir bir kaynağı engellediğini kanıtlayamaz. Doğrulama başarısız olduğunda komut kod 1 ile çıkar.

Otomasyon için `--json` kullanın. JSON çıktısı genel sonucu, geçerli proxy yapılandırma kaynağını, varsa yapılandırma hatalarını ve her hedef denetimini içerir. Proxy URL kimlik bilgileri metin ve JSON çıktısında gizlenir:

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

Ayrıca `curl` ile elle doğrulayabilirsiniz:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

Genel isteğin başarılı olması gerekir. loopback ve metadata istekleri proxy tarafından engellenmelidir. `openclaw proxy validate` için, yerleşik loopback canary bir proxy reddini erişilebilir bir kaynaktan ayırt edebilir. Özel `--denied-url` denetimlerinde bu canary yoktur; bu nedenle proxy'niz ayrı olarak doğrulayabileceğiniz dağıtıma özgü bir ret sinyali sunmadığı sürece hem HTTP yanıtlarını hem de belirsiz taşıma hatalarını doğrulama hataları olarak değerlendirin.

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
- Ham `net`, `tls` ve `http2` soketleri, yerel eklentiler ve alt süreçler, proxy ortam değişkenlerini devralıp bunlara uymadıkları sürece Node düzeyindeki proxy yönlendirmesini atlayabilir.
- IRC, operatör tarafından yönetilen ileri proxy yönlendirmesinin dışında kalan ham bir TCP/TLS kanalıdır. Tüm çıkış trafiğinin bu ileri proxy üzerinden geçmesini gerektiren dağıtımlarda, doğrudan IRC çıkışı açıkça onaylanmadığı sürece `channels.irc.enabled=false` ayarlayın.
- Yerel hata ayıklama proxy'si tanılama aracıdır ve yönetilen proxy modu etkinken proxy istekleri ve CONNECT tünelleri için doğrudan üst akış yönlendirmesi varsayılan olarak devre dışıdır; doğrudan yönlendirmeyi yalnızca onaylanmış yerel tanılamalar için etkinleştirin.
- Kullanıcının yerel WebUI'leri ve yerel model sunucuları gerektiğinde operatör proxy politikasında izin verilenler listesine alınmalıdır; OpenClaw bunlar için genel bir yerel ağ atlaması sunmaz.
- Gateway kontrol düzlemi proxy atlaması kasıtlı olarak `localhost` ve gerçek loopback IP URL'leriyle sınırlıdır. Yerel doğrudan Gateway kontrol düzlemi bağlantıları için `ws://127.0.0.1:18789`, `ws://[::1]:18789` veya `ws://localhost:18789` kullanın; diğer ana makine adları sıradan ana makine adı tabanlı trafik gibi yönlendirilir.
- OpenClaw proxy politikanızı incelemez, test etmez veya sertifikalandırmaz.
- Proxy politikası değişikliklerini güvenlik açısından hassas operasyonel değişiklikler olarak değerlendirin.
