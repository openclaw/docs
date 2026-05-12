---
read_when:
    - macOS/iOS'ta Bonjour keşfi sorunlarında hata ayıklama
    - mDNS hizmet türlerini, TXT kayıtlarını veya keşif kullanıcı deneyimini değiştirme
summary: Bonjour/mDNS keşfi + hata ayıklama (Gateway işaretçileri, istemciler ve yaygın hata modları)
title: Bonjour keşfi
x-i18n:
    generated_at: "2026-05-12T12:50:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05892ee8f0dc880f68f7cf024de9452b8d999ff1af3c7ca9850fb4f2d732af0c
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw, etkin bir Gateway'i (WebSocket uç noktası) keşfetmek için Bonjour (mDNS / DNS-SD) kullanabilir.
Çok noktaya yayın `local.` taraması **yalnızca LAN'a özel bir kolaylıktır**. Paketle gelen `bonjour`
plugin'i LAN duyurusunun sahibidir. macOS ana makinelerinde otomatik başlar ve
Linux, Windows ve container içinde çalışan Gateway dağıtımlarında isteğe bağlıdır. Ağlar arası keşif için aynı
işaret, yapılandırılmış bir geniş alan DNS-SD domain'i üzerinden de yayımlanabilir. Keşif
yine de en iyi çaba esaslıdır ve SSH ya da Tailnet tabanlı bağlantının yerini **almaz**.

## Tailscale üzerinden geniş alan Bonjour (Unicast DNS-SD)

Node ve gateway farklı ağlardaysa, çok noktaya yayın mDNS sınırı
geçmez. Tailscale üzerinden **unicast DNS-SD**'ye
("Wide-Area Bonjour") geçerek aynı keşif kullanıcı deneyimini koruyabilirsiniz.

Üst düzey adımlar:

1. Gateway ana makinesinde (Tailnet üzerinden erişilebilir) bir DNS sunucusu çalıştırın.
2. `_openclaw-gw._tcp` için DNS-SD kayıtlarını ayrılmış bir zone altında yayımlayın
   (örnek: `openclaw.internal.`).
3. Tailscale **split DNS** yapılandırın; böylece seçtiğiniz domain istemciler
   (iOS dahil) için bu DNS sunucusu üzerinden çözümlenir.

OpenClaw herhangi bir keşif domain'ini destekler; `openclaw.internal.` yalnızca bir örnektir.
iOS/Android node'ları hem `local.` hem de yapılandırdığınız geniş alan domain'ini tarar.

### Gateway yapılandırması (önerilir)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### Tek seferlik DNS sunucusu kurulumu (gateway ana makinesi)

```bash
openclaw dns setup --apply
```

Bu, CoreDNS'i kurar ve şu şekilde yapılandırır:

- yalnızca gateway'in Tailscale arayüzlerinde 53 numaralı portu dinler
- seçtiğiniz domain'i (örnek: `openclaw.internal.`) `~/.openclaw/dns/<domain>.db` üzerinden sunar

Tailnet'e bağlı bir makineden doğrulayın:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS ayarları

Tailscale yönetici konsolunda:

- Gateway'in tailnet IP'sini gösteren bir nameserver ekleyin (UDP/TCP 53).
- Keşif domain'inizin bu nameserver'ı kullanması için split DNS ekleyin.

İstemciler tailnet DNS'i kabul ettikten sonra, iOS node'ları ve CLI keşfi
çok noktaya yayın olmadan keşif domain'inizde `_openclaw-gw._tcp` tarayabilir.

### Gateway dinleyici güvenliği (önerilir)

Gateway WS portu (varsayılan `18789`) varsayılan olarak loopback'e bağlanır. LAN/tailnet
erişimi için açıkça bağlayın ve kimlik doğrulamayı etkin tutun.

Yalnızca tailnet kurulumları için:

- `~/.openclaw/openclaw.json` içinde `gateway.bind: "tailnet"` ayarlayın.
- Gateway'i yeniden başlatın (veya macOS menü çubuğu uygulamasını yeniden başlatın).

## Neler duyurulur

Yalnızca Gateway `_openclaw-gw._tcp` duyurur. LAN çok noktaya yayın duyurusu,
plugin etkinleştirildiğinde paketle gelen `bonjour` plugin'i tarafından sağlanır; geniş alan
DNS-SD yayımlaması Gateway'e ait kalır.

## Hizmet türleri

- `_openclaw-gw._tcp` - gateway aktarım işareti (macOS/iOS/Android node'ları tarafından kullanılır).

## TXT anahtarları (gizli olmayan ipuçları)

Gateway, kullanıcı arayüzü akışlarını kolaylaştırmak için küçük gizli olmayan ipuçları duyurur:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (yalnızca TLS etkin olduğunda)
- `gatewayTlsSha256=<sha256>` (yalnızca TLS etkin olduğunda ve fingerprint kullanılabilir olduğunda)
- `canvasPort=<port>` (yalnızca canvas host etkin olduğunda; şu anda `gatewayPort` ile aynıdır)
- `transport=gateway`
- `tailnetDns=<magicdns>` (yalnızca mDNS full modu, Tailnet kullanılabilir olduğunda isteğe bağlı ipucu)
- `sshPort=<port>` (yalnızca full modu; minimal ve off modlarında atlanır)
- `cliPath=<path>` (yalnızca full modu; minimal ve off modlarında atlanır)

Güvenlik notları:

- Bonjour/mDNS TXT kayıtları **kimliği doğrulanmamıştır**. İstemciler TXT'yi yetkili yönlendirme olarak ele almamalıdır.
- İstemciler, çözümlenen hizmet uç noktasını (SRV + A/AAAA) kullanarak yönlendirme yapmalıdır. `lanHost`, `tailnetDns`, `gatewayPort` ve `gatewayTlsSha256` değerlerini yalnızca ipucu olarak ele alın.
- SSH otomatik hedefleme de TXT'ye özel ipuçlarını değil, çözümlenen hizmet ana makinesini kullanmalıdır.
- TLS pinning, duyurulan bir `gatewayTlsSha256` değerinin daha önce saklanmış bir pin'i geçersiz kılmasına asla izin vermemelidir.
- iOS/Android node'ları keşif tabanlı doğrudan bağlantıları **yalnızca TLS** olarak ele almalı ve ilk kez görülen bir fingerprint'e güvenmeden önce açık kullanıcı onayı gerektirmelidir.

## macOS üzerinde hata ayıklama

Yararlı yerleşik araçlar:

- Örnekleri tara:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Bir örneği çözümle (`<instance>` değerini değiştirin):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Tarama çalışıyor ancak çözümleme başarısız oluyorsa, genellikle bir LAN ilkesi veya
mDNS çözümleyici sorunuyla karşılaşıyorsunuzdur.

## Gateway günlüklerinde hata ayıklama

Gateway dönen bir günlük dosyası yazar (başlangıçta
`gateway log file: ...` olarak yazdırılır). `bonjour:` satırlarını, özellikle şunları arayın:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Watchdog, etkin `probing`, `announcing` ve yeni conflict-rename durumlarını
devam eden durumlar olarak ele alır. Hizmet hiçbir zaman `announced` durumuna ulaşmazsa, OpenClaw sonunda
duyurucuyu yeniden oluşturur ve tekrarlanan hatalardan sonra sonsuza kadar yeniden duyurmak yerine
bu Gateway işlemi için Bonjour'u devre dışı bırakır.

Bonjour, geçerli bir DNS etiketi olduğunda duyurulan `.local` ana makinesi için sistem ana makine adını kullanır.
Sistem ana makine adı boşluk, alt çizgi veya başka bir geçersiz DNS etiketi karakteri içeriyorsa,
OpenClaw `openclaw.local` değerine geri döner. Açık bir ana makine etiketi gerektiğinde
Gateway'i başlatmadan önce `OPENCLAW_MDNS_HOSTNAME=<name>` ayarlayın.

## iOS node üzerinde hata ayıklama

iOS node'u `_openclaw-gw._tcp` keşfetmek için `NWBrowser` kullanır.

Günlükleri yakalamak için:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → yeniden üret → **Copy**

Günlük, tarayıcı durum geçişlerini ve sonuç kümesi değişikliklerini içerir.

## Bonjour ne zaman etkinleştirilmeli

Bonjour, macOS ana makinelerinde boş yapılandırmalı Gateway başlangıcı için otomatik başlar çünkü
yerel uygulama ve yakındaki iOS/Android node'ları genellikle aynı LAN keşfine dayanır.

Aynı LAN otomatik keşfi Linux, Windows veya başka bir macOS dışı ana makinede yararlı olduğunda
Bonjour'u açıkça etkinleştirin:

```bash
openclaw plugins enable bonjour
```

Etkinleştirildiğinde, Bonjour ne kadar TXT metadata yayımlanacağına karar vermek için
`discovery.mdns.mode` kullanır. Aynı mod, geniş alan DNS-SD kayıtlarındaki isteğe bağlı TXT ipuçlarını da kontrol eder.
Varsayılan mod `minimal` değeridir; `full` değerini yalnızca istemciler `cliPath` veya
`sshPort` ipuçlarına ihtiyaç duyduğunda kullanın. Plugin etkinliğini değiştirmeden LAN çok noktaya yayınını
bastırmak için `off` kullanın; `discovery.wideArea.enabled` true olduğunda geniş alan DNS-SD yine de
minimal Gateway işaretini yayımlayabilir.

## Bonjour ne zaman devre dışı bırakılmalı

LAN çok noktaya yayın duyurusu gereksiz, kullanılamaz veya zararlı olduğunda Bonjour'u devre dışı bırakılmış bırakın.
Yaygın durumlar macOS dışı sunucular, Docker bridge ağı,
WSL veya mDNS çok noktaya yayınını düşüren bir ağ ilkesidir. Bu ortamlarda
Gateway yine de yayımlanmış URL'si, SSH, Tailnet veya geniş alan
DNS-SD üzerinden erişilebilir, ancak LAN otomatik keşfi güvenilir değildir.

Sorun dağıtım kapsamındaysa mevcut ortam geçersiz kılmasını tercih edin:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Bu, plugin yapılandırmasını değiştirmeden LAN çok noktaya yayın duyurusunu devre dışı bırakır.
Docker imajları, service dosyaları, başlatma betikleri ve tek seferlik
hata ayıklama için güvenlidir çünkü ayar ortam ortadan kalktığında kaybolur.

Bu OpenClaw yapılandırması için paketle gelen LAN keşif plugin'ini kasıtlı olarak kapatmak istediğinizde
plugin yapılandırmasını kullanın:

```bash
openclaw plugins disable bonjour
```

## Docker incelikleri

Paketle gelen Bonjour plugin'i, `OPENCLAW_DISABLE_BONJOUR` ayarlanmamışken algılanan
container'larda LAN çok noktaya yayın duyurusunu otomatik devre dışı bırakır. Docker bridge ağları
genellikle mDNS çok noktaya yayınını (`224.0.0.251:5353`) container ile LAN arasında
iletmez, bu nedenle container'dan duyuru yapmak keşfi nadiren çalıştırır.

Önemli incelikler:

- Bonjour macOS ana makinelerinde otomatik başlar ve diğer yerlerde isteğe bağlıdır. Devre dışı
  bırakılması Gateway'i durdurmaz; yalnızca LAN çok noktaya yayın duyurusunu atlar.
- Bonjour'u devre dışı bırakmak `gateway.bind` değerini değiştirmez; yayımlanan host portunun çalışabilmesi için Docker hâlâ
  varsayılan olarak `OPENCLAW_GATEWAY_BIND=lan` kullanır.
- Bonjour'u devre dışı bırakmak geniş alan DNS-SD'yi devre dışı bırakmaz. Gateway ve node aynı LAN üzerinde değilse
  geniş alan keşfi veya Tailnet kullanın.
- Aynı `OPENCLAW_CONFIG_DIR` değerini Docker dışında yeniden kullanmak
  container otomatik devre dışı bırakma ilkesini kalıcı hale getirmez.
- `OPENCLAW_DISABLE_BONJOUR=0` değerini yalnızca host networking, macvlan veya
  mDNS çok noktaya yayınının geçtiği bilinen başka bir ağ için ayarlayın; zorla devre dışı bırakmak için `1` olarak ayarlayın.

## Devre dışı Bonjour sorunlarını giderme

Docker kurulumundan sonra bir node Gateway'i artık otomatik keşfetmiyorsa:

1. Gateway'in auto, forced-on veya forced-off modunda çalışıp çalışmadığını doğrulayın:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Gateway'in kendisinin yayımlanan port üzerinden erişilebilir olduğunu doğrulayın:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Bonjour devre dışı olduğunda doğrudan hedef kullanın:
   - Control UI veya yerel araçlar: `http://127.0.0.1:18789`
   - LAN istemcileri: `http://<gateway-host>:18789`
   - Ağlar arası istemciler: Tailnet MagicDNS, Tailnet IP, SSH tüneli veya
     geniş alan DNS-SD

4. Docker içinde Bonjour plugin'ini kasıtlı olarak etkinleştirdiyseniz ve duyuruyu
   `OPENCLAW_DISABLE_BONJOUR=0` ile zorladıysanız, host'tan çok noktaya yayını test edin:

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
  container bridge'leri, WSL veya arayüz değişimleri ciao duyurucusunu
  announced olmayan bir durumda bırakabilir. OpenClaw birkaç kez yeniden dener ve ardından duyurucuyu sonsuza kadar
  yeniden başlatmak yerine geçerli Gateway işlemi için Bonjour'u devre dışı bırakır.
- **Docker bridge ağı**: Bonjour algılanan container'larda otomatik devre dışı bırakılır.
  `OPENCLAW_DISABLE_BONJOUR=0` değerini yalnızca host, macvlan veya başka bir
  mDNS uyumlu ağ için ayarlayın.
- **Uyku / arayüz değişimi**: macOS mDNS sonuçlarını geçici olarak düşürebilir; yeniden deneyin.
- **Tarama çalışıyor ancak çözümleme başarısız**: makine adlarını basit tutun (emoji veya
  noktalama işaretlerinden kaçının), ardından Gateway'i yeniden başlatın. Hizmet örneği adı
  ana makine adından türetilir, bu nedenle aşırı karmaşık adlar bazı çözümleyicileri karıştırabilir.

## Escape edilmiş örnek adları (`\032`)

Bonjour/DNS-SD, hizmet örneği adlarındaki byte'ları çoğu zaman decimal `\DDD`
dizileri olarak escape eder (ör. boşluklar `\032` olur).

- Bu, protokol düzeyinde normaldir.
- Kullanıcı arayüzleri görüntüleme için decode etmelidir (iOS `BonjourEscapes.decode` kullanır).

## Etkinleştirme / devre dışı bırakma / yapılandırma

- macOS ana makineleri, paketle gelen LAN keşif Plugin'ini varsayılan olarak otomatik başlatır.
- `openclaw plugins enable bonjour`, varsayılan olarak etkin olmadığı ana makinelerde paketle gelen LAN keşif Plugin'ini etkinleştirir.
- `openclaw plugins disable bonjour`, paketle gelen Plugin'i devre dışı bırakarak LAN çok noktaya yayın duyurusunu devre dışı bırakır.
- `OPENCLAW_DISABLE_BONJOUR=1`, Plugin yapılandırmasını değiştirmeden LAN çok noktaya yayın duyurusunu devre dışı bırakır; kabul edilen doğru değerler `1`, `true`, `yes` ve `on` değerleridir (eski: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0`, algılanan kapsayıcıların içinde bile LAN çok noktaya yayın duyurusunu açık olmaya zorlar; kabul edilen yanlış değerler `0`, `false`, `no` ve `off` değerleridir.
- Bonjour Plugin'i etkin olduğunda ve `OPENCLAW_DISABLE_BONJOUR` ayarlanmamışsa Bonjour normal ana makinelerde duyuru yapar ve algılanan kapsayıcıların içinde otomatik olarak devre dışı kalır.
- `~/.openclaw/openclaw.json` içindeki `gateway.bind`, Gateway bağlama modunu denetler.
- `sshPort` duyurulduğunda `OPENCLAW_SSH_PORT` SSH bağlantı noktasını geçersiz kılar (eski: `OPENCLAW_SSH_PORT`).
- mDNS tam modu etkinken `OPENCLAW_TAILNET_DNS`, TXT içinde bir MagicDNS ipucu yayımlar (eski: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH`, duyurulan CLI yolunu geçersiz kılar (eski: `OPENCLAW_CLI_PATH`).

## İlgili belgeler

- Keşif ilkesi ve taşıma seçimi: [Keşif](/tr/gateway/discovery)
- Node eşleştirme + onaylar: [Gateway eşleştirme](/tr/gateway/pairing)
