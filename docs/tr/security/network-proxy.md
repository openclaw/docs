---
read_when:
    - SSRF ve DNS yeniden bağlama saldırılarına karşı çok katmanlı savunma istiyorsunuz
    - OpenClaw çalışma zamanı trafiği için harici bir ileri proxy yapılandırma
summary: OpenClaw çalışma zamanı HTTP ve WebSocket trafiğini operatör tarafından yönetilen bir filtreleme proxy'si üzerinden yönlendirme
title: Ağ proxy'si
x-i18n:
    generated_at: "2026-05-01T09:04:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9207d349e4410e38631ae7665be19b536e4a4128a4e80dd095e802804dfd66a3
    source_path: security/network-proxy.md
    workflow: 16
---

# Ağ Proxy'si

OpenClaw, çalışma zamanı HTTP ve WebSocket trafiğini operatör tarafından yönetilen bir forward proxy üzerinden yönlendirebilir. Bu, merkezi çıkış denetimi, daha güçlü SSRF koruması ve daha iyi ağ denetlenebilirliği isteyen dağıtımlar için isteğe bağlı katmanlı savunmadır.

OpenClaw bir proxy göndermez, indirmez, başlatmaz, yapılandırmaz veya sertifikalandırmaz. Ortamınıza uygun proxy teknolojisini siz çalıştırırsınız ve OpenClaw normal süreç yerel HTTP ve WebSocket istemcilerini bunun üzerinden yönlendirir.

## Neden Proxy Kullanılmalı?

Proxy, operatörlere giden HTTP ve WebSocket trafiği için tek bir ağ denetim noktası sağlar. Bu, SSRF güçlendirmesi dışında da yararlı olabilir:

- Merkezi politika: ağ kurallarını doğru uygulaması için her uygulama HTTP çağrı noktasına güvenmek yerine tek bir çıkış politikası sürdürün.
- Bağlantı zamanı denetimleri: DNS çözümlemesinden sonra ve proxy yukarı akış bağlantısını açmadan hemen önce hedefi değerlendirin.
- DNS yeniden bağlama savunması: uygulama düzeyindeki DNS denetimi ile gerçek giden bağlantı arasındaki boşluğu azaltın.
- Daha geniş JavaScript kapsamı: sıradan `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch ve benzeri istemcileri aynı yol üzerinden yönlendirin.
- Denetlenebilirlik: çıkış sınırında izin verilen ve reddedilen hedefleri günlüğe kaydedin.
- Operasyonel denetim: OpenClaw'ı yeniden oluşturmadan hedef kurallarını, ağ segmentasyonunu, hız sınırlarını veya giden izin listelerini uygulayın.

Proxy yönlendirme, normal HTTP ve WebSocket çıkışı için süreç düzeyinde bir güvenlik korkuluğudur. Operatörlere desteklenen JavaScript HTTP istemcilerini kendi filtreleme proxy'leri üzerinden yönlendirmek için hata durumunda kapalı bir yol sağlar, ancak işletim sistemi düzeyinde bir ağ sandbox'ı değildir ve OpenClaw'ın proxy'nin hedef politikasını sertifikalandırmasını sağlamaz.

## OpenClaw Trafiği Nasıl Yönlendirir?

`proxy.enabled=true` olduğunda ve bir proxy URL'si yapılandırıldığında, `openclaw gateway run`, `openclaw node run` ve `openclaw agent --local` gibi korumalı çalışma zamanı süreçleri normal HTTP ve WebSocket çıkışını yapılandırılan proxy üzerinden yönlendirir:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Genel sözleşme, bunu uygulamak için kullanılan dahili Node hook'ları değil, yönlendirme davranışıdır. OpenClaw Gateway denetim düzlemi WebSocket istemcileri, Gateway URL'si `localhost` veya `127.0.0.1` ya da `[::1]` gibi gerçek bir loopback IP kullandığında local loopback Gateway RPC trafiği için dar bir doğrudan yol kullanır. Bu denetim düzlemi yolu, operatör proxy'si loopback hedeflerini engellese bile loopback Gateway'lerine ulaşabilmelidir. Normal çalışma zamanı HTTP ve WebSocket istekleri yine de yapılandırılan proxy'yi kullanır.

Dahili olarak OpenClaw, bu özellik için süreç düzeyinde iki yönlendirme hook'u kullanır:

- Undici dispatcher yönlendirmesi `fetch`, undici destekli istemcileri ve kendi undici dispatcher'ını sağlayan aktarımları kapsar.
- `global-agent` yönlendirmesi, `http.request`, `https.request`, `http.get` ve `https.get` üzerine katmanlanan birçok kitaplık dahil olmak üzere Node çekirdeği `node:http` ve `node:https` çağıranlarını kapsar. Yönetilen proxy modu bu global agent'ı zorunlu kılar; böylece açık Node HTTP agent'ları operatör proxy'sini kazara atlayamaz.

Bazı plugin'ler, süreç düzeyinde yönlendirme mevcut olsa bile açık proxy bağlantısı gerektiren özel aktarımlara sahiptir. Örneğin Telegram'ın Bot API aktarımı kendi HTTP/1 undici dispatcher'ını kullanır ve bu nedenle süreç proxy ortamını ve bu sahip özel aktarım yolunda yönetilen `OPENCLAW_PROXY_URL` yedeğini dikkate alır.

Proxy URL'sinin kendisi `http://` kullanmalıdır. HTTPS hedefleri proxy üzerinden HTTP `CONNECT` ile hâlâ desteklenir; bu yalnızca OpenClaw'ın `http://127.0.0.1:3128` gibi düz HTTP forward-proxy dinleyicisi beklediği anlamına gelir.

Proxy etkinken OpenClaw `no_proxy`, `NO_PROXY` ve `GLOBAL_AGENT_NO_PROXY` değerlerini temizler. Bu atlama listeleri hedef tabanlıdır; bu nedenle `localhost` veya `127.0.0.1` değerlerini orada bırakmak, yüksek riskli SSRF hedeflerinin filtreleme proxy'sini atlamasına izin verirdi.

Kapanışta OpenClaw önceki proxy ortamını geri yükler ve önbelleğe alınmış süreç yönlendirme durumunu sıfırlar.

## İlgili Proxy Terimleri

- `proxy.enabled` / `proxy.proxyUrl`: OpenClaw çalışma zamanı çıkışı için giden forward-proxy yönlendirmesi. Bu sayfa bu özelliği belgeler.
- `gateway.auth.mode: "trusted-proxy"`: Gateway erişimi için gelen kimlik farkında reverse-proxy kimlik doğrulaması. Bkz. [Güvenilen proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).
- `openclaw proxy`: geliştirme ve destek için yerel hata ayıklama proxy'si ve yakalama inceleyicisi. Bkz. [openclaw proxy](/tr/cli/proxy).
- Kanala veya sağlayıcıya özgü proxy ayarları: belirli bir aktarım için sahip özel geçersiz kılmaları. Amaç çalışma zamanı genelinde merkezi çıkış denetimi olduğunda yönetilen ağ proxy'sini tercih edin.

## Yapılandırma

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

URL'yi ortam üzerinden de sağlayabilirsiniz; yapılandırmada `proxy.enabled=true` tutulur:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl`, `OPENCLAW_PROXY_URL` değerine göre önceliklidir.

`enabled=true` ise ancak geçerli bir proxy URL'si yapılandırılmamışsa, korumalı komutlar doğrudan ağ erişimine geri dönmek yerine başlatmada başarısız olur.

`openclaw gateway start` ile başlatılan yönetilen Gateway hizmetleri için URL'yi yapılandırmada saklamayı tercih edin:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Ortam yedeği en çok ön plan çalıştırmaları için uygundur. Kurulu bir hizmetle kullanırsanız, `OPENCLAW_PROXY_URL` değerini `$OPENCLAW_STATE_DIR/.env` veya `~/.openclaw/.env` gibi hizmetin kalıcı ortamına koyun, ardından launchd, systemd veya Scheduled Tasks Gateway'i bu değerle başlatsın diye hizmeti yeniden kurun.

`openclaw --container ...` komutları için OpenClaw, ayarlandığında `OPENCLAW_PROXY_URL` değerini container hedefli alt CLI'ye iletir. URL, container içinden erişilebilir olmalıdır; `127.0.0.1` ana bilgisayarı değil container'ın kendisini ifade eder. OpenClaw, bu güvenlik denetimini açıkça geçersiz kılmadığınız sürece container hedefli komutlar için loopback proxy URL'lerini reddeder.

## Proxy Gereksinimleri

Proxy politikası güvenlik sınırıdır. OpenClaw, proxy'nin doğru hedefleri engellediğini doğrulayamaz.

Proxy'yi şu şekilde yapılandırın:

- Yalnızca loopback'e veya özel güvenilir bir arayüze bağlanın.
- Erişimi yalnızca OpenClaw süreci, ana bilgisayar, container veya hizmet hesabı kullanabilecek şekilde kısıtlayın.
- Hedefleri kendisi çözümlesin ve DNS çözümlemesinden sonra hedef IP'leri engellesin.
- Hem düz HTTP istekleri hem de HTTPS `CONNECT` tünelleri için politikayı bağlantı zamanında uygulayın.
- Loopback, özel, link-local, metadata, multicast, ayrılmış veya dokümantasyon aralıkları için hedef tabanlı atlamaları reddedin.
- DNS çözümleme yoluna tamamen güvenmediğiniz sürece ana bilgisayar adı izin listelerinden kaçının.
- İstek gövdelerini, yetkilendirme başlıklarını, çerezleri veya diğer gizli bilgileri günlüğe kaydetmeden hedefi, kararı, durumu ve nedeni günlüğe kaydedin.
- Proxy politikasını sürüm denetimi altında tutun ve değişiklikleri güvenlik açısından hassas yapılandırma gibi gözden geçirin.

## Önerilen Engellenmiş Hedefler

Bu reddetme listesini herhangi bir forward proxy, güvenlik duvarı veya çıkış politikası için başlangıç noktası olarak kullanın.

OpenClaw uygulama düzeyi sınıflandırıcı mantığı `src/infra/net/ssrf.ts` ve `src/shared/net/ip.ts` içinde bulunur. İlgili parite hook'ları `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` ve NAT64, 6to4, Teredo, ISATAP ve IPv4 eşlemeli biçimler için gömülü IPv4 sentinel işlemesidir. Bu dosyalar harici bir proxy politikası sürdürürken yararlı referanslardır, ancak OpenClaw bu kuralları proxy'nize otomatik olarak dışa aktarmaz veya proxy'nizde uygulamaz.

| Aralık veya ana bilgisayar                                                            | Neden engellenmeli                                   |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 loopback                                        |
| `::1/128`                                                                            | IPv6 loopback                                        |
| `0.0.0.0/8`, `::/128`                                                                | Belirtilmemiş ve bu ağ adresleri                     |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918 özel ağlar                                   |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local adresler ve yaygın bulut metadata yolları |
| `169.254.169.254`, `metadata.google.internal`                                        | Bulut metadata hizmetleri                            |
| `100.64.0.0/10`                                                                      | Taşıyıcı sınıfı NAT paylaşımlı adres alanı           |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Kıyaslama aralıkları                                 |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Özel kullanım ve dokümantasyon aralıkları            |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | Ayrılmış IPv4                                        |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 yerel/özel aralıklar                            |
| `100::/64`, `2001:20::/28`                                                           | IPv6 discard ve ORCHIDv2 aralıkları                  |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Gömülü IPv4 içeren NAT64 önekleri                    |
| `2002::/16`, `2001::/32`                                                             | Gömülü IPv4 içeren 6to4 ve Teredo                    |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4 uyumlu ve IPv4 eşlemeli IPv6                    |

Bulut sağlayıcınız veya ağ platformunuz ek metadata ana bilgisayarları ya da ayrılmış aralıklar belgeliyorsa, bunları da ekleyin.

## Doğrulama

Proxy'yi OpenClaw'ı çalıştıran aynı ana bilgisayardan, container'dan veya hizmet hesabından doğrulayın:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Varsayılan olarak, özel hedef sağlanmadığında komut `https://example.com/` adresinin başarılı olduğunu denetler ve proxy'nin ulaşmaması gereken geçici bir loopback canary başlatır. Varsayılan reddedilen denetim, proxy 2xx olmayan bir reddetme yanıtı döndürdüğünde veya canary'yi bir aktarım hatasıyla engellediğinde geçer; başarılı bir yanıt canary'ye ulaşırsa başarısız olur. Proxy etkinleştirilmemiş ve yapılandırılmamışsa doğrulama bir yapılandırma sorunu bildirir; yapılandırmayı değiştirmeden önce tek seferlik ön denetim için `--proxy-url` kullanın. Dağıtıma özgü beklentileri test etmek için `--allowed-url` ve `--denied-url` kullanın. Özel reddedilen hedefler hata durumunda kapalıdır: herhangi bir HTTP yanıtı, hedefe proxy üzerinden ulaşılabildiği anlamına gelir ve herhangi bir aktarım hatası sonuçsuz olarak bildirilir çünkü OpenClaw proxy'nin ulaşılabilir bir origin'i engellediğini kanıtlayamaz. Doğrulama hatasında komut kod 1 ile çıkar.

Otomasyon için `--json` kullanın. JSON çıktısı genel sonucu, etkin proxy yapılandırma kaynağını, yapılandırma hatalarını ve her hedef denetimini içerir. Proxy URL kimlik bilgileri metin ve JSON çıktısında sansürlenir:

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

`curl` ile manuel olarak da doğrulayabilirsiniz:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

Genel istek başarılı olmalıdır. Loopback ve meta veri istekleri proxy tarafından engellenmelidir. `openclaw proxy validate` için yerleşik loopback kanaryası, proxy reddini erişilebilir bir kaynaktan ayırt edebilir. Özel `--denied-url` kontrollerinde bu kanarya yoktur; bu nedenle proxy’niz ayrı olarak doğrulayabileceğiniz dağıtıma özgü bir red sinyali sunmadığı sürece hem HTTP yanıtlarını hem de belirsiz aktarım hatalarını doğrulama hataları olarak ele alın.

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
- Ham `net`, `tls` ve `http2` soketleri, yerel eklentiler ve alt süreçler, proxy ortam değişkenlerini devralıp bunlara uymadıkları sürece Node düzeyindeki proxy yönlendirmesini atlayabilir.
- Kullanıcı yerel WebUI’leri ve yerel model sunucuları gerektiğinde operatör proxy ilkesinde izin verilenler listesine alınmalıdır; OpenClaw bunlar için genel bir yerel ağ atlaması sunmaz.
- Gateway kontrol düzlemi proxy atlaması, kasıtlı olarak `localhost` ve açık loopback IP URL’leriyle sınırlıdır. Yerel doğrudan Gateway kontrol düzlemi bağlantıları için `ws://127.0.0.1:18789`, `ws://[::1]:18789` veya `ws://localhost:18789` kullanın; diğer ana makine adları sıradan ana makine adı tabanlı trafik gibi yönlendirilir.
- OpenClaw, proxy ilkenizi incelemez, test etmez veya sertifikalandırmaz.
- Proxy ilkesi değişikliklerini güvenlik açısından hassas operasyonel değişiklikler olarak ele alın.
