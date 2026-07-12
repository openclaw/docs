---
read_when:
    - SSRF ve DNS yeniden bağlama saldırılarına karşı derinlemesine savunma istiyorsunuz
    - OpenClaw çalışma zamanı trafiği için harici bir ileri proxy yapılandırma
summary: OpenClaw çalışma zamanı HTTP ve WebSocket trafiğini operatör tarafından yönetilen bir filtreleme proxy'si üzerinden yönlendirme yöntemi
title: Ağ proxy'si
x-i18n:
    generated_at: "2026-07-12T12:48:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd82684a17a79242891eca69c549c0bfcdd5bde40fa4e791dda7f2b62c473c89
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw, çalışma zamanı HTTP ve WebSocket trafiğini operatör tarafından yönetilen bir ileri vekil sunucu üzerinden yönlendirebilir. Bu, isteğe bağlı bir derinlemesine savunma katmanıdır: merkezi çıkış trafiği denetimi, daha güçlü SSRF koruması ve ağ sınırında hedeflerin denetlenebilirliği sağlar. Vekil sunucu hedefi bağlantı kurulurken, DNS çözümlemesinden sonra ve üst akış bağlantısını açmadan hemen önce değerlendirdiği için, DNS yeniden bağlama saldırısının daha önceki uygulama düzeyindeki DNS denetimi ile gerçek giden bağlantı arasındaki zaman aralığından yararlanma olanağını da daraltır. Tek bir vekil sunucu politikası ayrıca operatörlere OpenClaw'ı yeniden derlemeden hedef kurallarını, ağ segmentasyonunu, hız sınırlarını veya giden trafik izin listelerini uygulayabilecekleri tek bir yer sağlar.

OpenClaw bir vekil sunucu sağlamaz, indirmez, başlatmaz, yapılandırmaz veya onaylamaz. Ortamınıza uygun vekil sunucu teknolojisini siz çalıştırırsınız; OpenClaw kendi HTTP ve WebSocket istemcilerini bunun üzerinden yönlendirir.

## Yapılandırma

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

`proxy.enabled: true` yapılandırmada kalırken URL'yi ortam üzerinden de ayarlayabilirsiniz:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl`, `OPENCLAW_PROXY_URL` değerine göre önceliklidir. `proxy.enabled` değeri `true` olduğu hâlde geçerli bir URL çözümlenemezse korunan komutlar doğrudan ağ erişimine geri dönmek yerine başlangıçta başarısız olur.

| Anahtar              | Tür                                  | Varsayılan     | Notlar                                                                                                                                               |
| -------------------- | ------------------------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.enabled`      | boolean                              | ayarlanmamış   | Yönlendirmeyi etkinleştirmek için `true` olmalıdır.                                                                                                  |
| `proxy.proxyUrl`     | string                               | ayarlanmamış   | `http://` veya `https://` ileri vekil sunucu URL'si. URL'ye gömülü kimlik bilgileri hassas kabul edilir ve anlık görüntülerden/günlüklerden çıkarılır. |
| `proxy.tls.caFile`   | string                               | ayarlanmamış   | Özel bir CA tarafından imzalanmış `https://` vekil sunucu uç noktasını doğrulamak için CA paketi.                                                     |
| `proxy.loopbackMode` | `gateway-only` \| `proxy` \| `block` | `gateway-only` | local loopback atlama davranışını denetler; aşağıya bakın.                                                                                           |

Yönetilen Gateway hizmetlerinde URL'yi ön plan ortam değişkenine bağlı kalmak yerine yeniden kurulumdan sonra da korunması için yapılandırmada saklayın:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

`OPENCLAW_PROXY_URL` ortam değişkeni geri dönüşü, ön plandaki çalıştırmalar için en uygundur. Bunu kurulu bir hizmetle kullanmak için hizmetin kalıcı ortamına (`$OPENCLAW_STATE_DIR/.env`, varsayılan `~/.openclaw/.env`) ekleyin, ardından launchd/systemd/Zamanlanmış Görevler tarafından alınması için yeniden kurun.

### Özel CA kullanan HTTPS vekil sunucu uç noktası

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

`proxy.tls.caFile`, vekil sunucu uç noktasının kendi TLS sertifikasını doğrular. Bu, hedef MITM güven ayarı, istemci sertifikası veya vekil sunucunun hedef politikasının yerine geçen bir ayar değildir. Bunun yerine `NODE_EXTRA_CA_CERTS` değişkenini yalnızca tüm Node işleminin başlangıçtan itibaren ek bir CA'ya güvenmesi gerektiğinde kullanın (örneğin, her HTTPS hedef sertifikasını yeniden imzalayan kurumsal bir TLS inceleme sistemi) — bu değişken işlem genelinde geçerlidir ve Node başlamadan önce ayarlanmalıdır; dolayısıyla OpenClaw bunu `proxy.tls.caFile` ayarını uyguladığı gibi çalışma sırasında uygulayamaz. HTTPS vekil sunucu uç noktasına güvenmek için `proxy.tls.caFile` kullanmayı tercih edin: tüm işlem yerine yönetilen vekil sunucu yönlendirmesiyle sınırlıdır.

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

## Yönlendirme nasıl çalışır?

`proxy.enabled: true` ve geçerli bir URL ile korunan çalışma zamanı işlemleri (`openclaw gateway run`, `openclaw node run`, `openclaw agent --local`) normal HTTP ve WebSocket çıkış trafiğini vekil sunucu üzerinden yönlendirir:

```text
OpenClaw işlemi
  fetch, node:http, node:https, WebSocket istemcileri  -> operatör vekil sunucusu -> hedef
```

OpenClaw, işlem düzeyindeki yönlendirme çalışma zamanı olarak dahili biçimde [Proxyline](https://github.com/openclaw/proxyline) kurar. `fetch`, undici tabanlı istemciler, `node:http`/`node:https`, yaygın WebSocket istemcileri ve yardımcılar tarafından oluşturulan `CONNECT` tünellerini kapsar; ayrıca çağıranın sağladığı Node HTTP aracılarının yerine geçerek açıkça belirtilen aracıların (`axios`, `got`, `node-fetch` ve benzeri Node aracısı tabanlı istemciler dâhil) vekil sunucuyu sessizce atlayamamasını sağlar.

Vekil sunucu URL şeması, OpenClaw'dan vekil sunucuya olan bağlantı adımını tanımlar; son hedefe olan bağlantıyı değil:

- `http://proxy.example:3128` — vekil sunucuya düz TCP; OpenClaw, HTTPS hedefleri için `CONNECT` dâhil HTTP vekil sunucu istekleri gönderir.
- `https://proxy.example:8443` — OpenClaw vekil sunucunun kendisine TLS bağlantısı açar (vekil sunucunun sertifikasını doğrulayarak), ardından bu oturum içinde HTTP vekil sunucu istekleri gönderir.

Hedef TLS, vekil sunucu uç noktası TLS'sinden bağımsızdır: OpenClaw, bir HTTPS hedefi için her zaman vekil sunucudan bir `CONNECT` tüneli ister ve hedef TLS bağlantısını bu tünel üzerinden başlatır.

Vekil sunucu etkinken OpenClaw, `no_proxy`/`NO_PROXY` değişkenlerini temizler. Bu atlama listeleri hedef tabanlıdır; `localhost` veya `127.0.0.1` değerlerini burada bırakmak, SSRF hedeflerinin vekil sunucuyu tamamen atlamasına olanak tanır. OpenClaw kapanırken önceki vekil sunucu ortamını geri yükler ve önbelleğe alınmış yönlendirme durumunu sıfırlar.

Bazı Plugin'ler, işlem düzeyinde yönlendirme etkin olsa bile kendi vekil sunucu bağlantısına ihtiyaç duyan özel bir aktarım mekanizmasına sahiptir. Telegram'ın Bot API istemcisi kendi HTTP/1 undici dağıtıcısını kullanır ve işlem vekil sunucu ortam değişkenleriyle birlikte `OPENCLAW_PROXY_URL` geri dönüşünü ayrıca dikkate alır.

### Gateway local loopback modu

Yerel Gateway denetim düzlemi istemcileri normalde `ws://127.0.0.1:18789` gibi bir local loopback WebSocket'e bağlanır. `proxy.loopbackMode`, bu trafiğin yönetilen vekil sunucuyu atlayıp atlamayacağını denetler:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy veya block
```

| Mod                      | Davranış                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway-only` (varsayılan) | OpenClaw etkin Gateway local loopback yetkili adresini doğrudan bağlantı istisnası olarak kaydeder; böylece yerel Gateway WebSocket trafiği vekil sunucu olmadan bağlanır. İstisna tam olarak yapılandırılmış ana bilgisayarı/bağlantı noktasını hedeflediğinden özel local loopback bağlantı noktaları çalışır. Paketle gelen tarayıcı Plugin'i, OpenClaw tarafından başlatılan yönetilen tarayıcıların tam yerel CDP hazırlık ve DevTools WebSocket URL'leri için aynı türde bir istisna kaydeder; paketle gelen Ollama bellek gömme sağlayıcısıysa tam olarak yapılandırılmış ana bilgisayar yerel local loopback gömme kaynağı için daha dar ve korumalı bir doğrudan yola sahiptir. |
| `proxy`                  | Hiçbir local loopback istisnası kaydedilmez; Gateway ve Ollama local loopback trafiği vekil sunucu üzerinden gider. Uzak bir vekil sunucu, OpenClaw ana bilgisayarının local loopback hizmetine geri yönlendirme yapabilmelidir (örneğin erişilebilir bir ana bilgisayar adı, IP veya tünel üzerinden) — standart bir uzak vekil sunucu `127.0.0.1`/`localhost` adresini OpenClaw ana bilgisayarına göre değil, kendisine göre çözümler.                                                                                                                                                                                        |
| `block`                  | OpenClaw, bir soket açmadan önce Gateway local loopback denetim düzlemi bağlantılarını ve korumalı Ollama local loopback gömme bağlantılarını reddeder.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

Gateway denetim düzlemi atlaması `localhost` ve değişmez local loopback IP URL'leriyle sınırlıdır — `ws://127.0.0.1:18789`, `ws://[::1]:18789` veya `ws://localhost:18789` kullanın. Diğer ana bilgisayar adları sıradan trafik gibi yönlendirilir.

### Kapsayıcılar

`openclaw --container ...` komutlarında OpenClaw, ayarlanmışsa `OPENCLAW_PROXY_URL` değerini kapsayıcıyı hedefleyen alt CLI'ye iletir. URL'ye kapsayıcının içinden erişilebilmelidir — buradaki `127.0.0.1` ana bilgisayarı değil, kapsayıcının kendisini ifade eder. Denetimi açıkça geçersiz kılmak için `OPENCLAW_CONTAINER_ALLOW_LOOPBACK_PROXY_URL=1` ayarlamadığınız sürece OpenClaw, kapsayıcıyı hedefleyen komutlarda local loopback vekil sunucu URL'lerini reddeder.

## İlgili vekil sunucu terimleri

- `proxy.enabled` / `proxy.proxyUrl` — çalışma zamanı çıkış trafiği için giden ileri vekil sunucu yönlendirmesi. Bu sayfa.
- `gateway.auth.mode: "trusted-proxy"` — Gateway erişimi için gelen, kimlik duyarlı ters vekil sunucu kimlik doğrulaması. Bkz. [Güvenilir vekil sunucu kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).
- `openclaw proxy` — geliştirme ve destek için yerel hata ayıklama vekil sunucusu ve yakalama inceleyicisi. Bkz. [openclaw proxy](/tr/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy` — varsayılan olarak katı DNS sabitlemesini ve ana bilgisayar adı politikasını korurken `web_fetch` aracının, DNS'i operatör denetimindeki bir HTTP(S) ortam vekil sunucusunun çözmesine izin vermek için isteğe bağlı ayar. Bkz. [Web getirme](/tr/tools/web-fetch#trusted-env-proxy).
- Kanala veya sağlayıcıya özgü vekil sunucu ayarları — tek bir aktarım için sahip bileşene özgü geçersiz kılmalar. Çalışma zamanı genelinde merkezi çıkış trafiği denetimi için yönetilen ağ vekil sunucusunu tercih edin.

## Vekil sunucuyu doğrulama

Vekil sunucunun hedef politikası gerçek güvenlik sınırıdır; OpenClaw, vekil sunucunuzun doğru hedefleri engellediğini doğrulayamaz. Şu şekilde yapılandırın:

- Yalnızca local loopback veya özel ve güvenilir bir arabirime bağlayın; yalnızca OpenClaw işlemi/ana bilgisayarı/kapsayıcısı/hizmet hesabı tarafından erişilebilir olsun.
- Hedefleri kendisi çözümlesin ve hem düz HTTP hem de HTTPS `CONNECT` tünelleri için bağlantı sırasında, DNS çözümlemesinden sonra IP'ye göre engellesin.
- local loopback, özel, bağlantı yerel, meta veri, çok noktaya yayın, ayrılmış ve belgeleme aralıklarına yönelik hedef tabanlı atlamaları reddetsin.
- DNS çözümleme yoluna tamamen güvenmediğiniz sürece ana bilgisayar adı izin listelerinden kaçının.
- Hedefi, kararı, durumu ve nedeni günlüğe kaydedin — istek gövdelerini, yetkilendirme üstbilgilerini, çerezleri veya diğer sırları asla kaydetmeyin.
- Politikayı sürüm denetimi altında tutun ve değişiklikleri güvenlik açısından hassas olarak inceleyin.

OpenClaw'ı çalıştıran aynı ana bilgisayardan/kapsayıcıdan/hizmet hesabından doğrulayın:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Özel CA kullanan bir HTTPS vekil sunucu uç noktasıyla:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

| Bayrak                   | Amaç                                                                      |
| ------------------------ | ------------------------------------------------------------------------- |
| `--proxy-url <url>`      | Yapılandırmayı/ortamı çözümlemek yerine bu URL'yi doğrular.                |
| `--proxy-ca-file <path>` | Bir HTTPS proxy uç noktası için CA paketi.                                 |
| `--allowed-url <url>`    | Başarılı olması beklenen hedef (tekrarlanabilir).                          |
| `--denied-url <url>`     | Engellenmesi beklenen hedef (tekrarlanabilir).                             |
| `--apns-reachable`       | Proxy'nin doğrudan sandbox APNs HTTP/2 sondasını tünelleyebildiğini de doğrular. |
| `--apns-authority <url>` | `--apns-reachable` ile sınanan APNs yetkili adresini geçersiz kılar.       |
| `--timeout-ms <ms>`      | İstek başına zaman aşımı.                                                  |
| `--json`                 | Makine tarafından okunabilir çıktı.                                       |

`proxy.enabled`, `true` değilse ve `--proxy-url` verilmemişse komut doğrulama yapmak yerine bir yapılandırma sorunu bildirir; yapılandırmayı değiştirmeden önce tek seferlik bir ön kontrol için `--proxy-url` iletin.

`--allowed-url`/`--denied-url` olmadan varsayılan kontroller şunlardır: `https://example.com/` başarılı olmalı ve proxy'nin erişmemesi gereken geçici bir local loopback kanarya sunucusu engellenmelidir. local loopback kontrolü bir aktarım hatasında veya kanaryanın her çalıştırmaya özgü belirtecini içermeyen 2xx dışı bir yanıtta başarılı olur; belirtecin bulunmadığı bir 2xx yanıtında (kanarya dışındaki bir kaynaktan gelen beklenmedik başarı) ve özellikle eşleşen belirteci taşıyan herhangi bir yanıtta başarısız olur; çünkü bu, proxy'nin reddetmesi gereken bir local loopback hedefini gerçekten ilettiğini kanıtlar. Özel `--denied-url` hedeflerinde böyle bir kanarya belirteci yoktur; bu nedenle kapalı durumda başarısız olurlar: herhangi bir HTTP yanıtı erişilebilir sayılır (başarısızlık) ve bir aktarım hatası, engellendiği kanıtlanmış kabul edilmek yerine sonuçsuz olarak bildirilir; çünkü OpenClaw, proxy'nizin erişilebilir bir kaynağı reddettiğini mi yoksa başka bir şeyin mi ters gittiğini doğrulayamaz. `--apns-reachable` kasıtlı olarak geçersiz bir sağlayıcı belirteci gönderir; dolayısıyla `403 InvalidProviderToken` yanıtı, tünelin Apple'a ulaştığının kanıtı sayılır. Komut, herhangi bir doğrulama hatasında `1` koduyla çıkar; proxy URL kimlik bilgileri hem metin hem de JSON çıktısında gizlenir.

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
    { "kind": "allowed", "url": "https://example.com/", "ok": true, "status": 200 },
    { "kind": "apns", "url": "https://api.sandbox.push.apple.com", "ok": true, "status": 403 }
  ]
}
```

Manuel `curl` kontrolü (genel istek başarılı olmalı; local loopback ve meta veri istekleri proxy'nin kendisi tarafından engellenmelidir — tek başına `curl`, `openclaw proxy validate` komutunun yerleşik kanaryasının yapabildiği gibi bir proxy reddini erişilemeyen bir kaynaktan ayırt edemez):

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

## Engellenmesi önerilen hedefler

Herhangi bir ileri proxy, güvenlik duvarı veya dışarı çıkış ilkesi için başlangıç engelleme listesi. OpenClaw'ın kendi SSRF sınıflandırıcısı `src/infra/net/ssrf.ts` ve `packages/net-policy/src/ip.ts` dosyalarında bulunur (`BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, RFC 2544 kıyaslama ön eki ve NAT64/6to4/Teredo/ISATAP/IPv4 eşlemeli biçimler için gömülü IPv4 işleme) — bunlar yararlı referanslardır ancak OpenClaw, harici proxy'nizde bu kuralları dışa aktarmaz veya uygulamaz.

| Aralık veya ana makine                                                                | Engelleme nedeni                                         |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                   | IPv4 local loopback                                      |
| `::1/128`                                                                             | IPv6 local loopback                                      |
| `0.0.0.0/8`, `::/128`                                                                 | Belirtilmemiş / bu ağ adresleri                           |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                       | RFC 1918 özel ağları                                     |
| `169.254.0.0/16`, `fe80::/10`                                                         | Yaygın bulut meta verisi yolları dâhil bağlantı yerel    |
| `169.254.169.254`, `metadata.google.internal`                                         | Bulut meta verisi hizmetleri                             |
| `100.64.0.0/10`                                                                       | Operatör sınıfı NAT paylaşımlı adres alanı                |
| `198.18.0.0/15`, `2001:2::/48`                                                        | Kıyaslama aralıkları                                     |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32`  | Özel kullanım ve belgelendirme aralıkları                |
| `224.0.0.0/4`, `ff00::/8`                                                             | Çok noktaya yayın                                        |
| `240.0.0.0/4`                                                                         | Ayrılmış IPv4                                            |
| `fc00::/7`, `fec0::/10`                                                               | IPv6 yerel/özel aralıkları                               |
| `100::/64`, `2001:20::/28`                                                            | IPv6 atma ve ORCHIDv2 aralıkları                         |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                      | Gömülü IPv4 içeren NAT64 ön ekleri                       |
| `2002::/16`, `2001::/32`                                                              | Gömülü IPv4 içeren 6to4 ve Teredo                        |
| `::/96`, `::ffff:0:0/96`                                                              | IPv4 uyumlu ve IPv4 eşlemeli IPv6                        |

Bulut sağlayıcınızın veya ağ platformunuzun belgelediği diğer meta veri ana makinelerini ya da ayrılmış aralıkları ekleyin.

## Sınırlar

| Yüzey                                                       | Yönetilen proxy durumu                                                                                                                                                        |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, yaygın WebSocket istemcileri | Yapılandırıldığında yönetilen proxy kancaları üzerinden yönlendirilir.                                                                                                    |
| APNs doğrudan HTTP/2                                        | APNs tarafından yönetilen `CONNECT` yardımcısı üzerinden yönlendirilir.                                                                                                       |
| Gateway denetim düzlemi local loopback                      | Yalnızca tam olarak yapılandırılmış yerel local loopback Gateway URL'si için doğrudandır.                                                                                      |
| Hata ayıklama proxy'sinin yukarı akış iletimi               | Yerel tanılama için açıkça etkinleştirilmediği sürece yönetilen proxy modu etkinken devre dışıdır.                                                                             |
| IRC                                                         | Ham TCP/TLS; yönetilen HTTP proxy modu tarafından proxy'lenmez. Dağıtımınız tüm dışarı çıkışların ileri proxy üzerinden gerçekleşmesini gerektiriyorsa `channels.irc.enabled: false` ayarını yapın. |
| Diğer ham `net`, `tls` veya `http2` istemci çağrıları       | Birleştirilmeden önce ham soket koruması tarafından sınıflandırılmalıdır.                                                                                                     |

- Bu, JavaScript HTTP/WebSocket istemcileri için süreç düzeyinde kapsama sağlar; işletim sistemi düzeyinde bir ağ sandbox'ı değildir.
- Ham `net`, `tls`, `http2` soketleri, yerel eklentiler ve OpenClaw dışı alt süreçler, proxy ortam değişkenlerini devralıp bunlara uymadıkları sürece Node düzeyindeki yönlendirmeyi atlayabilir. Çatallanmış OpenClaw alt CLI'ları, yönetilen proxy URL'sini ve `proxy.loopbackMode` durumunu devralır.
- Kullanıcıya ait yerel WebUI'lar ve yerel model sunucuları, genel bir yerel ağ atlaması kapsamında değildir — gerekirse bunları operatör proxy ilkesindeki izin listesine ekleyin. Bunun istisnası, paketle gelen Ollama bellek gömme sağlayıcısının korumalı doğrudan yoludur; bu yol, yapılandırılmış `baseUrl` değerindeki tam ana makine yerel local loopback kaynağıyla sınırlıdır; LAN, tailnet, özel ağ ve genel Ollama ana makineleri yönetilen proxy'yi kullanmaya devam eder.
- Yerel hata ayıklama proxy'sinin doğrudan yukarı akış iletimi (proxy istekleri ve `CONNECT` tünelleri için), yönetilen proxy modu etkinken varsayılan olarak devre dışıdır; bunu yalnızca onaylanmış yerel tanılamalar için etkinleştirin.
- OpenClaw, proxy ilkenizi incelemez, test etmez veya onaylamaz. Proxy ilkesi değişikliklerini güvenlik açısından hassas operasyonel değişiklikler olarak değerlendirin.
