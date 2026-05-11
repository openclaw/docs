---
read_when:
    - macOS/iOS’ta Bonjour keşif sorunlarını giderme
    - mDNS hizmet türlerini, TXT kayıtlarını veya keşif kullanıcı deneyimini değiştirme
summary: Bonjour/mDNS keşfi + hata ayıklama (Gateway işaretleri, istemciler ve yaygın hata modları)
title: Bonjour keşfi
x-i18n:
    generated_at: "2026-05-11T20:28:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03bd9403591a389c06d3131e4c110d4ccf711eee56cbe9a5c9baed2b6df8fb80
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw, etkin bir Gateway'i (WebSocket uç noktası) keşfetmek için Bonjour (mDNS / DNS-SD) kullanabilir.
Çok noktaya yayın `local.` taraması **yalnızca LAN'a özgü bir kolaylıktır**. Paketle birlikte gelen `bonjour`
Plugin'i LAN duyurusunun sahibidir. macOS ana makinelerinde otomatik başlar ve
Linux, Windows ve konteynerleştirilmiş Gateway dağıtımlarında isteğe bağlıdır. Ağlar arası keşif için aynı
işaret, yapılandırılmış bir geniş alan DNS-SD alanı üzerinden de yayımlanabilir. Keşif
yine de en iyi çaba esaslıdır ve SSH'nin ya da Tailnet tabanlı bağlantının yerine **geçmez**.

## Tailscale üzerinden geniş alan Bonjour (Tekil yayın DNS-SD)

Düğüm ve Gateway farklı ağlardaysa, çok noktaya yayın mDNS bu sınırı aşmaz.
Tailscale üzerinden **tekil yayın DNS-SD**'ye ("Wide-Area Bonjour") geçerek aynı keşif kullanıcı deneyimini koruyabilirsiniz.

Üst düzey adımlar:

1. Gateway ana makinesinde (Tailnet üzerinden erişilebilir) bir DNS sunucusu çalıştırın.
2. `_openclaw-gw._tcp` için DNS-SD kayıtlarını ayrılmış bir zone altında yayımlayın
   (örnek: `openclaw.internal.`).
3. Seçtiğiniz alan adının istemciler (iOS dahil) için bu
   DNS sunucusu üzerinden çözümlenmesi amacıyla Tailscale **split DNS** yapılandırın.

OpenClaw herhangi bir keşif alanını destekler; `openclaw.internal.` yalnızca bir örnektir.
iOS/Android düğümleri hem `local.` hem de yapılandırdığınız geniş alan alan adını tarar.

### Gateway yapılandırması (önerilir)

```json5
{
  gateway: { bind: "tailnet" }, // yalnızca tailnet (önerilir)
  discovery: { wideArea: { enabled: true } }, // geniş alan DNS-SD yayımını etkinleştirir
}
```

### Tek seferlik DNS sunucusu kurulumu (Gateway ana makinesi)

```bash
openclaw dns setup --apply
```

Bu komut CoreDNS'i kurar ve şunlar için yapılandırır:

- yalnızca Gateway'in Tailscale arayüzlerinde 53 numaralı portu dinleme
- seçtiğiniz alan adını (örnek: `openclaw.internal.`) `~/.openclaw/dns/<domain>.db` üzerinden sunma

Tailnet'e bağlı bir makineden doğrulayın:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS ayarları

Tailscale yönetici konsolunda:

- Gateway'in tailnet IP'sini işaret eden bir ad sunucusu ekleyin (UDP/TCP 53).
- Keşif alanınızın bu ad sunucusunu kullanması için split DNS ekleyin.

İstemciler tailnet DNS'i kabul ettiğinde, iOS düğümleri ve CLI keşfi çok noktaya yayın olmadan
keşif alanınızda `_openclaw-gw._tcp` tarayabilir.

### Gateway dinleyici güvenliği (önerilir)

Gateway WS portu (varsayılan `18789`) varsayılan olarak loopback'e bağlanır. LAN/tailnet
erişimi için açıkça bağlayın ve kimlik doğrulamayı etkin tutun.

Yalnızca tailnet kurulumları için:

- `~/.openclaw/openclaw.json` içinde `gateway.bind: "tailnet"` ayarlayın.
- Gateway'i yeniden başlatın (veya macOS menü çubuğu uygulamasını yeniden başlatın).

## Ne duyuru yapar

Yalnızca Gateway `_openclaw-gw._tcp` duyurusu yapar. LAN çok noktaya yayın duyurusu,
Plugin etkin olduğunda paketle birlikte gelen `bonjour` Plugin'i tarafından sağlanır; geniş alan
DNS-SD yayımı ise Gateway'e ait kalır.

## Hizmet türleri

- `_openclaw-gw._tcp` - gateway aktarım işareti (macOS/iOS/Android düğümleri tarafından kullanılır).

## TXT anahtarları (gizli olmayan ipuçları)

Gateway, kullanıcı arayüzü akışlarını kolaylaştırmak için küçük gizli olmayan ipuçları duyurur:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (yalnızca TLS etkin olduğunda)
- `gatewayTlsSha256=<sha256>` (yalnızca TLS etkin olduğunda ve parmak izi mevcut olduğunda)
- `canvasPort=<port>` (yalnızca canvas ana makinesi etkin olduğunda; şu anda `gatewayPort` ile aynı)
- `transport=gateway`
- `tailnetDns=<magicdns>` (yalnızca mDNS tam modu, Tailnet kullanılabilir olduğunda isteğe bağlı ipucu)
- `sshPort=<port>` (yalnızca mDNS tam modu; geniş alan DNS-SD bunu atlayabilir)
- `cliPath=<path>` (yalnızca mDNS tam modu; geniş alan DNS-SD bunu yine de uzaktan kurulum ipucu olarak yazar)

Güvenlik notları:

- Bonjour/mDNS TXT kayıtları **kimlik doğrulamalı değildir**. İstemciler TXT'yi yetkili yönlendirme olarak değerlendirmemelidir.
- İstemciler, çözümlenen hizmet uç noktasını (SRV + A/AAAA) kullanarak yönlendirme yapmalıdır. `lanHost`, `tailnetDns`, `gatewayPort` ve `gatewayTlsSha256` değerlerini yalnızca ipucu olarak ele alın.
- SSH otomatik hedeflemesi de aynı şekilde yalnızca TXT ipuçlarını değil, çözümlenen hizmet ana makinesini kullanmalıdır.
- TLS pinning, duyurulan bir `gatewayTlsSha256` değerinin daha önce saklanan bir pin'i geçersiz kılmasına asla izin vermemelidir.
- iOS/Android düğümleri, keşif tabanlı doğrudan bağlantıları **yalnızca TLS** olarak ele almalı ve ilk kez görülen parmak izine güvenmeden önce açık kullanıcı onayı istemelidir.

## macOS üzerinde hata ayıklama

Kullanışlı yerleşik araçlar:

- Örnekleri tara:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Bir örneği çözümle (`<instance>` değerini değiştirin):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Tarama çalışıyor ama çözümleme başarısız oluyorsa, genellikle bir LAN politikası veya
mDNS çözümleyici sorunuyla karşılaşıyorsunuzdur.

## Gateway günlüklerinde hata ayıklama

Gateway dönen bir günlük dosyası yazar (başlangıçta
`gateway log file: ...` olarak yazdırılır). Özellikle şu `bonjour:` satırlarını arayın:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Watchdog; etkin `probing`, `announcing` ve yeni conflict-rename durumlarını
devam eden durumlar olarak ele alır. Hizmet hiçbir zaman `announced` durumuna ulaşmazsa OpenClaw sonunda
duyurucuyu yeniden oluşturur ve tekrarlanan başarısızlıklardan sonra sonsuza kadar yeniden duyuru yapmak yerine
o Gateway işlemi için Bonjour'u devre dışı bırakır.

Bonjour, geçerli bir DNS etiketi olduğunda duyurulan `.local` ana makinesi için sistem ana makine adını kullanır.
Sistem ana makine adı boşluk, alt çizgi veya başka bir geçersiz DNS etiketi karakteri içeriyorsa,
OpenClaw `openclaw.local` değerine geri döner. Açık bir ana makine etiketi gerektiğinde
Gateway'i başlatmadan önce `OPENCLAW_MDNS_HOSTNAME=<name>` ayarlayın.

## iOS düğümünde hata ayıklama

iOS düğümü `_openclaw-gw._tcp` keşfetmek için `NWBrowser` kullanır.

Günlükleri yakalamak için:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → yeniden üret → **Copy**

Günlük, tarayıcı durum geçişlerini ve sonuç kümesi değişikliklerini içerir.

## Bonjour ne zaman etkinleştirilmeli

Bonjour, macOS ana makinelerinde boş yapılandırmalı Gateway başlangıcı için otomatik başlar çünkü
yerel uygulama ve yakındaki iOS/Android düğümleri genellikle aynı LAN keşfine dayanır.

Aynı LAN otomatik keşfi Linux, Windows veya başka bir macOS olmayan ana makinede yararlı olduğunda
Bonjour'u açıkça etkinleştirin:

```bash
openclaw plugins enable bonjour
```

Etkinleştirildiğinde Bonjour, ne kadar TXT meta verisi yayımlanacağına karar vermek için
`discovery.mdns.mode` kullanır. Varsayılan mod `minimal` değeridir; `full` değerini yalnızca yerel istemcilerin
`cliPath` veya `sshPort` ipuçlarına ihtiyacı olduğunda kullanın ve Plugin etkinliğini değiştirmeden
LAN çok noktaya yayınını bastırmak için `off` kullanın.

## Bonjour ne zaman devre dışı bırakılmalı

LAN çok noktaya yayın duyurusu gereksiz, kullanılamaz veya zararlı olduğunda Bonjour'u devre dışı bırakılmış bırakın.
Yaygın durumlar macOS olmayan sunucular, Docker bridge ağı,
WSL veya mDNS çok noktaya yayınını düşüren bir ağ politikasıdır. Bu ortamlarda
Gateway yayımlanmış URL'si, SSH, Tailnet veya geniş alan
DNS-SD üzerinden hâlâ erişilebilirdir, ancak LAN otomatik keşfi güvenilir değildir.

Sorun dağıtım kapsamlıysa mevcut ortam geçersiz kılmasını tercih edin:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Bu, Plugin yapılandırmasını değiştirmeden LAN çok noktaya yayın duyurusunu devre dışı bırakır.
Ayar ortam ortadan kalktığında kaybolduğu için Docker görüntüleri, hizmet dosyaları, başlatma betikleri ve tek seferlik
hata ayıklama için güvenlidir.

Bu OpenClaw yapılandırması için paketle birlikte gelen LAN
keşif Plugin'ini bilerek kapatmak istediğinizde Plugin yapılandırmasını kullanın:

```bash
openclaw plugins disable bonjour
```

## Docker dikkat edilmesi gerekenler

Paketle birlikte gelen Bonjour Plugin'i, `OPENCLAW_DISABLE_BONJOUR` ayarlanmamışken algılanan
konteynerlerde LAN çok noktaya yayın duyurusunu otomatik devre dışı bırakır. Docker bridge ağları
genellikle mDNS çok noktaya yayınını (`224.0.0.251:5353`) konteyner ile LAN arasında iletmez,
bu yüzden konteynerden duyuru yapmak keşfi nadiren çalıştırır.

Önemli dikkat edilmesi gerekenler:

- Bonjour macOS ana makinelerinde otomatik başlar ve diğer yerlerde isteğe bağlıdır. Devre dışı
  bırakılmış kalması Gateway'i durdurmaz; yalnızca LAN çok noktaya yayın duyurusunu atlar.
- Bonjour'u devre dışı bırakmak `gateway.bind` değerini değiştirmez; Docker hâlâ varsayılan olarak
  `OPENCLAW_GATEWAY_BIND=lan` kullanır, böylece yayımlanan ana makine portu çalışabilir.
- Bonjour'u devre dışı bırakmak geniş alan DNS-SD'yi devre dışı bırakmaz. Gateway ve düğüm aynı LAN'da değilse
  geniş alan keşfini veya Tailnet'i kullanın.
- Aynı `OPENCLAW_CONFIG_DIR` değerini Docker dışında yeniden kullanmak
  konteyner otomatik devre dışı bırakma politikasını kalıcı yapmaz.
- `OPENCLAW_DISABLE_BONJOUR=0` değerini yalnızca host networking, macvlan veya mDNS çok noktaya yayınının geçtiği bilinen başka bir
  ağ için ayarlayın; zorla devre dışı bırakmak için `1` ayarlayın.

## Devre dışı Bonjour sorunlarını giderme

Docker kurulumundan sonra bir düğüm artık Gateway'i otomatik keşfetmiyorsa:

1. Gateway'in auto, forced-on veya forced-off modunda çalışıp çalışmadığını doğrulayın:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Gateway'in kendisinin yayımlanan port üzerinden erişilebilir olduğunu doğrulayın:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Bonjour devre dışıyken doğrudan hedef kullanın:
   - Kontrol kullanıcı arayüzü veya yerel araçlar: `http://127.0.0.1:18789`
   - LAN istemcileri: `http://<gateway-host>:18789`
   - Ağlar arası istemciler: Tailnet MagicDNS, Tailnet IP, SSH tüneli veya
     geniş alan DNS-SD

4. Docker'da Bonjour Plugin'ini bilerek etkinleştirdiyseniz ve
   `OPENCLAW_DISABLE_BONJOUR=0` ile duyuruyu zorladıysanız, ana makineden çok noktaya yayını test edin:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Tarama boşsa veya Gateway günlükleri tekrarlanan ciao watchdog
   iptalleri gösteriyorsa, `OPENCLAW_DISABLE_BONJOUR=1` değerini geri yükleyin ve doğrudan ya da
   Tailnet rotası kullanın.

## Yaygın hata modları

- **Bonjour ağlar arasında geçmez**: Tailnet veya SSH kullanın.
- **Çok noktaya yayın engellendi**: bazı Wi-Fi ağları mDNS'i devre dışı bırakır.
- **Duyurucu probing/announcing durumunda takıldı**: çok noktaya yayını engellenmiş ana makineler,
  konteyner bridge'leri, WSL veya arayüz değişimleri ciao duyurucusunu
  duyurulmamış bir durumda bırakabilir. OpenClaw birkaç kez yeniden dener ve ardından duyurucuyu sonsuza kadar
  yeniden başlatmak yerine mevcut Gateway işlemi için Bonjour'u devre dışı bırakır.
- **Docker bridge ağı**: Bonjour algılanan konteynerlerde otomatik devre dışı kalır.
  `OPENCLAW_DISABLE_BONJOUR=0` değerini yalnızca host, macvlan veya başka bir
  mDNS uyumlu ağ için ayarlayın.
- **Uyku / arayüz değişimi**: macOS mDNS sonuçlarını geçici olarak düşürebilir; yeniden deneyin.
- **Tarama çalışıyor ama çözümleme başarısız**: makine adlarını basit tutun (emojilerden veya
  noktalama işaretlerinden kaçının), ardından Gateway'i yeniden başlatın. Hizmet örneği adı
  ana makine adından türetilir, bu nedenle aşırı karmaşık adlar bazı çözümleyicileri karıştırabilir.

## Kaçışlı örnek adları (`\032`)

Bonjour/DNS-SD çoğu zaman hizmet örneği adlarındaki baytları ondalık `\DDD`
dizileri olarak kaçışlar (örneğin boşluklar `\032` olur).

- Bu, protokol düzeyinde normaldir.
- Kullanıcı arayüzleri gösterim için çözmelidir (iOS `BonjourEscapes.decode` kullanır).

## Etkinleştirme / devre dışı bırakma / yapılandırma

- macOS ana makineleri, birlikte gelen LAN keşif Plugin'ini varsayılan olarak otomatik başlatır.
- `openclaw plugins enable bonjour`, varsayılan olarak etkinleştirilmediği ana makinelerde birlikte gelen LAN keşif Plugin'ini etkinleştirir.
- `openclaw plugins disable bonjour`, birlikte gelen Plugin'i devre dışı bırakarak LAN çok noktaya yayın duyurusunu devre dışı bırakır.
- `OPENCLAW_DISABLE_BONJOUR=1`, Plugin yapılandırmasını değiştirmeden LAN çok noktaya yayın duyurusunu devre dışı bırakır; kabul edilen doğru değerler `1`, `true`, `yes` ve `on` değerleridir (eski: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0`, algılanan kapsayıcıların içinde dahil olmak üzere LAN çok noktaya yayın duyurusunu açık olmaya zorlar; kabul edilen yanlış değerler `0`, `false`, `no` ve `off` değerleridir.
- Bonjour Plugin'i etkinleştirildiğinde ve `OPENCLAW_DISABLE_BONJOUR` ayarlanmadığında Bonjour, normal ana makinelerde duyuru yapar ve algılanan kapsayıcıların içinde otomatik olarak devre dışı kalır.
- `~/.openclaw/openclaw.json` içindeki `gateway.bind`, Gateway bağlanma modunu denetler.
- `OPENCLAW_SSH_PORT`, `sshPort` duyurulduğunda SSH bağlantı noktasını geçersiz kılar (eski: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS`, mDNS tam modu etkinleştirildiğinde TXT içinde bir MagicDNS ipucu yayımlar (eski: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH`, duyurulan CLI yolunu geçersiz kılar (eski: `OPENCLAW_CLI_PATH`).

## İlgili belgeler

- Keşif ilkesi ve aktarım seçimi: [Keşif](/tr/gateway/discovery)
- Node eşleştirme + onaylar: [Gateway eşleştirme](/tr/gateway/pairing)
