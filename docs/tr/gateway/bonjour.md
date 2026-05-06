---
read_when:
    - macOS/iOS'ta Bonjour keşif sorunlarını giderme
    - mDNS hizmet türlerini, TXT kayıtlarını veya keşif kullanıcı deneyimini değiştirme
summary: Bonjour/mDNS keşfi + hata ayıklama (Gateway işaretleri, istemciler ve yaygın hata modları)
title: Bonjour keşfi
x-i18n:
    generated_at: "2026-05-06T09:11:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7b7d029e6eb6bee90eb96e7ea169ecadf3bda6d969b2450349c5716a950e205
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw, etkin bir Gateway'i (WebSocket uç noktası) keşfetmek için Bonjour (mDNS / DNS-SD) kullanabilir.
Çoklu yayın `local.` taraması **yalnızca LAN'a yönelik bir kolaylıktır**. Paketle gelen `bonjour`
Plugin'i LAN duyurusunun sahibidir. macOS konaklarında otomatik başlar; Linux,
Windows ve kapsayıcıya alınmış Gateway dağıtımlarında isteğe bağlıdır. Ağlar arası keşif için aynı
işaret, yapılandırılmış geniş alan DNS-SD etki alanı üzerinden de yayımlanabilir. Keşif
yine de en iyi çaba esasına dayanır ve SSH ya da Tailnet tabanlı bağlantının yerini **almaz**.

## Tailscale üzerinden geniş alan Bonjour (Unicast DNS-SD)

Node ve Gateway farklı ağlardaysa, çoklu yayın mDNS sınırı geçmez.
Tailscale üzerinden **unicast DNS-SD**'ye ("Geniş Alan Bonjour") geçerek aynı keşif kullanıcı deneyimini koruyabilirsiniz.

Üst düzey adımlar:

1. Gateway konağında bir DNS sunucusu çalıştırın (Tailnet üzerinden erişilebilir).
2. Ayrılmış bir bölge altında `_openclaw-gw._tcp` için DNS-SD kayıtları yayımlayın
   (örnek: `openclaw.internal.`).
3. Seçtiğiniz etki alanının istemciler (iOS dahil) için bu DNS sunucusu üzerinden çözümlenmesi amacıyla Tailscale **bölünmüş DNS** yapılandırın.

OpenClaw herhangi bir keşif etki alanını destekler; `openclaw.internal.` yalnızca bir örnektir.
iOS/Android Node'ları hem `local.` hem de yapılandırılmış geniş alan etki alanınızı tarar.

### Gateway yapılandırması (önerilen)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### Tek seferlik DNS sunucusu kurulumu (Gateway konağı)

```bash
openclaw dns setup --apply
```

Bu, CoreDNS'i kurar ve şunlar için yapılandırır:

- yalnızca Gateway'in Tailscale arayüzlerinde 53 numaralı bağlantı noktasını dinleme
- seçtiğiniz etki alanını (örnek: `openclaw.internal.`) `~/.openclaw/dns/<domain>.db` üzerinden sunma

Tailnet'e bağlı bir makineden doğrulayın:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS ayarları

Tailscale yönetici konsolunda:

- Gateway'in tailnet IP'sini gösteren bir ad sunucusu ekleyin (UDP/TCP 53).
- Keşif etki alanınızın bu ad sunucusunu kullanması için bölünmüş DNS ekleyin.

İstemciler tailnet DNS'i kabul ettikten sonra, iOS Node'ları ve CLI keşfi
çoklu yayın olmadan keşif etki alanınızda `_openclaw-gw._tcp` tarayabilir.

### Gateway dinleyici güvenliği (önerilen)

Gateway WS bağlantı noktası (varsayılan `18789`) varsayılan olarak loopback'e bağlanır. LAN/tailnet
erişimi için açıkça bağlayın ve kimlik doğrulamayı etkin bırakın.

Yalnızca tailnet kurulumları için:

- `~/.openclaw/openclaw.json` içinde `gateway.bind: "tailnet"` ayarlayın.
- Gateway'i yeniden başlatın (veya macOS menü çubuğu uygulamasını yeniden başlatın).

## Ne duyuru yapar

Yalnızca Gateway `_openclaw-gw._tcp` duyurur. LAN çoklu yayın duyurusu,
Plugin etkinleştirildiğinde paketle gelen `bonjour` Plugin'i tarafından sağlanır; geniş alan
DNS-SD yayımlama Gateway'in sorumluluğunda kalır.

## Hizmet türleri

- `_openclaw-gw._tcp` - Gateway taşıma işareti (macOS/iOS/Android Node'ları tarafından kullanılır).

## TXT anahtarları (gizli olmayan ipuçları)

Gateway, kullanıcı arayüzü akışlarını kolaylaştırmak için küçük gizli olmayan ipuçları duyurur:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (yalnızca TLS etkin olduğunda)
- `gatewayTlsSha256=<sha256>` (yalnızca TLS etkin olduğunda ve parmak izi kullanılabilir olduğunda)
- `canvasPort=<port>` (yalnızca tuval konağı etkin olduğunda; şu anda `gatewayPort` ile aynıdır)
- `transport=gateway`
- `tailnetDns=<magicdns>` (yalnızca mDNS tam modu, Tailnet kullanılabilir olduğunda isteğe bağlı ipucu)
- `sshPort=<port>` (yalnızca mDNS tam modu; geniş alan DNS-SD bunu atlayabilir)
- `cliPath=<path>` (yalnızca mDNS tam modu; geniş alan DNS-SD bunu yine de uzak kurulum ipucu olarak yazar)

Güvenlik notları:

- Bonjour/mDNS TXT kayıtları **kimlik doğrulamalı değildir**. İstemciler TXT'yi yetkili yönlendirme olarak görmemelidir.
- İstemciler, çözümlenen hizmet uç noktasını (SRV + A/AAAA) kullanarak yönlendirme yapmalıdır. `lanHost`, `tailnetDns`, `gatewayPort` ve `gatewayTlsSha256` değerlerini yalnızca ipucu olarak ele alın.
- SSH otomatik hedefleme de aynı şekilde yalnızca TXT ipuçlarını değil, çözümlenen hizmet konağını kullanmalıdır.
- TLS sabitleme, duyurulan bir `gatewayTlsSha256` değerinin daha önce saklanmış bir sabitlemeyi geçersiz kılmasına asla izin vermemelidir.
- iOS/Android Node'ları, keşfe dayalı doğrudan bağlantıları **yalnızca TLS** olarak ele almalı ve ilk kez görülen bir parmak izine güvenmeden önce açık kullanıcı onayı istemelidir.

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

Tarama çalışıyor ancak çözümleme başarısız oluyorsa, genellikle bir LAN ilkesi veya
mDNS çözümleyici sorunu yaşıyorsunuzdur.

## Gateway günlüklerinde hata ayıklama

Gateway, değişimli bir günlük dosyası yazar (başlangıçta
`gateway log file: ...` olarak yazdırılır). Özellikle şu `bonjour:` satırlarını arayın:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour, geçerli bir DNS etiketi olduğunda duyurulan `.local` konağı için sistem ana makine adını kullanır.
Sistem ana makine adı boşluk, alt çizgi veya başka bir geçersiz DNS etiketi karakteri içeriyorsa,
OpenClaw `openclaw.local` değerine geri döner. Açık bir konak etiketi gerektiğinde
Gateway'i başlatmadan önce `OPENCLAW_MDNS_HOSTNAME=<name>` ayarlayın.

## iOS Node üzerinde hata ayıklama

iOS Node'u `_openclaw-gw._tcp` keşfetmek için `NWBrowser` kullanır.

Günlükleri yakalamak için:

- Ayarlar → Gateway → Gelişmiş → **Keşif Hata Ayıklama Günlükleri**
- Ayarlar → Gateway → Gelişmiş → **Keşif Günlükleri** → yeniden üret → **Kopyala**

Günlük, tarayıcı durum geçişlerini ve sonuç kümesi değişikliklerini içerir.

## Bonjour ne zaman etkinleştirilmeli

Bonjour, macOS konaklarında boş yapılandırmalı Gateway başlangıcı için otomatik başlar çünkü
yerel uygulama ve yakındaki iOS/Android Node'ları genellikle aynı LAN keşfine güvenir.

Aynı LAN otomatik keşfi Linux, Windows veya başka bir macOS dışı konakta yararlı olduğunda
Bonjour'u açıkça etkinleştirin:

```bash
openclaw plugins enable bonjour
```

Etkinleştirildiğinde Bonjour, ne kadar TXT meta verisi yayımlayacağına karar vermek için
`discovery.mdns.mode` kullanır. Varsayılan mod `minimal` olur; `full` modunu yalnızca yerel istemciler
`cliPath` veya `sshPort` ipuçlarına ihtiyaç duyduğunda kullanın ve Plugin etkinliğini
değiştirmeden LAN çoklu yayını bastırmak için `off` kullanın.

## Bonjour ne zaman devre dışı bırakılmalı

LAN çoklu yayın duyurusu gereksiz, kullanılamaz veya zararlı olduğunda Bonjour'u devre dışı bırakılmış halde bırakın.
Yaygın durumlar macOS dışı sunucular, Docker köprü ağları,
WSL veya mDNS çoklu yayını düşüren bir ağ ilkesidir. Bu ortamlarda
Gateway yayımlanmış URL'si, SSH, Tailnet veya geniş alan
DNS-SD üzerinden hâlâ erişilebilir, ancak LAN otomatik keşfi güvenilir değildir.

Sorun dağıtım kapsamlı olduğunda mevcut ortam geçersiz kılmasını tercih edin:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Bu, Plugin yapılandırmasını değiştirmeden LAN çoklu yayın duyurusunu devre dışı bırakır.
Ayar ortamla birlikte kaybolduğu için Docker görüntüleri, hizmet dosyaları, başlatma betikleri ve tek seferlik
hata ayıklama için güvenlidir.

Bu OpenClaw yapılandırması için paketle gelen LAN keşif Plugin'ini bilerek kapatmak istediğinizde
Plugin yapılandırmasını kullanın:

```bash
openclaw plugins disable bonjour
```

## Docker dikkat edilmesi gerekenler

Paketle gelen Bonjour Plugin'i, `OPENCLAW_DISABLE_BONJOUR` ayarlanmamışsa algılanan
kapsayıcılarda LAN çoklu yayın duyurusunu otomatik devre dışı bırakır. Docker köprü ağları
genellikle mDNS çoklu yayını (`224.0.0.251:5353`) kapsayıcı ile LAN arasında
iletmez; bu nedenle kapsayıcıdan yapılan duyuru nadiren keşfi çalışır hale getirir.

Önemli dikkat edilmesi gerekenler:

- Bonjour macOS konaklarında otomatik başlar ve diğer yerlerde isteğe bağlıdır. Devre dışı
  bırakılmış halde kalması Gateway'i durdurmaz; yalnızca LAN çoklu yayın duyurusunu atlar.
- Bonjour'u devre dışı bırakmak `gateway.bind` değerini değiştirmez; Docker yayımlanmış konak bağlantı noktasının çalışabilmesi için
  hâlâ varsayılan olarak `OPENCLAW_GATEWAY_BIND=lan` kullanır.
- Bonjour'u devre dışı bırakmak geniş alan DNS-SD'yi devre dışı bırakmaz. Gateway ve Node aynı LAN üzerinde olmadığında geniş alan keşfi
  veya Tailnet kullanın.
- Aynı `OPENCLAW_CONFIG_DIR` değerini Docker dışında yeniden kullanmak,
  kapsayıcı otomatik devre dışı bırakma ilkesini kalıcı hale getirmez.
- `OPENCLAW_DISABLE_BONJOUR=0` değerini yalnızca konak ağı, macvlan veya
  mDNS çoklu yayının geçtiği bilinen başka bir ağ için ayarlayın; zorla devre dışı bırakmak için `1` olarak ayarlayın.

## Devre dışı Bonjour sorunlarını giderme

Docker kurulumundan sonra bir Node artık Gateway'i otomatik keşfetmiyorsa:

1. Gateway'in otomatik, zorla açık veya zorla kapalı modda çalışıp çalışmadığını doğrulayın:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Gateway'in kendisinin yayımlanmış bağlantı noktası üzerinden erişilebilir olduğunu doğrulayın:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Bonjour devre dışıyken doğrudan hedef kullanın:
   - Denetim kullanıcı arayüzü veya yerel araçlar: `http://127.0.0.1:18789`
   - LAN istemcileri: `http://<gateway-host>:18789`
   - Ağlar arası istemciler: Tailnet MagicDNS, Tailnet IP, SSH tüneli veya
     geniş alan DNS-SD

4. Docker içinde Bonjour Plugin'ini kasıtlı olarak etkinleştirdiyseniz ve duyuruyu
   `OPENCLAW_DISABLE_BONJOUR=0` ile zorladıysanız, çoklu yayını konaktan test edin:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Tarama boşsa veya Gateway günlükleri tekrarlanan ciao watchdog
   iptallerini gösteriyorsa, `OPENCLAW_DISABLE_BONJOUR=1` değerini geri yükleyin ve doğrudan ya da
   Tailnet rotası kullanın.

## Yaygın hata modları

- **Bonjour ağları aşmaz**: Tailnet veya SSH kullanın.
- **Çoklu yayın engellendi**: bazı Wi-Fi ağları mDNS'i devre dışı bırakır.
- **Duyurucu yoklama/duyurma durumunda takıldı**: çoklu yayını engellenmiş konaklar,
  kapsayıcı köprüleri, WSL veya arayüz değişimi ciao duyurucusunu
  duyurulmamış bir durumda bırakabilir. OpenClaw birkaç kez yeniden dener ve ardından duyurucuyu sonsuza kadar yeniden başlatmak yerine
  geçerli Gateway işlemi için Bonjour'u devre dışı bırakır.
- **Docker köprü ağı**: Bonjour algılanan kapsayıcılarda otomatik devre dışı bırakılır.
  `OPENCLAW_DISABLE_BONJOUR=0` değerini yalnızca konak, macvlan veya başka bir
  mDNS özellikli ağ için ayarlayın.
- **Uyku / arayüz değişimi**: macOS geçici olarak mDNS sonuçlarını düşürebilir; yeniden deneyin.
- **Tarama çalışıyor ancak çözümleme başarısız**: makine adlarını basit tutun (emoji veya
  noktalama işaretlerinden kaçının), ardından Gateway'i yeniden başlatın. Hizmet örneği adı
  konak adından türetilir; bu nedenle aşırı karmaşık adlar bazı çözümleyicileri karıştırabilir.

## Kaçışlı örnek adları (`\032`)

Bonjour/DNS-SD, hizmet örneği adlarındaki baytları sık sık ondalık `\DDD`
dizileri olarak kaçışlar (örneğin boşluklar `\032` olur).

- Bu, protokol düzeyinde normaldir.
- Kullanıcı arayüzleri gösterim için kod çözmelidir (iOS `BonjourEscapes.decode` kullanır).

## Etkinleştirme / devre dışı bırakma / yapılandırma

- macOS konakları, paketle gelen LAN keşif Plugin'ini varsayılan olarak otomatik başlatır.
- `openclaw plugins enable bonjour`, varsayılan olarak etkin olmadığı konaklarda paketle gelen LAN keşif Plugin'ini etkinleştirir.
- `openclaw plugins disable bonjour`, paketle gelen Plugin'i devre dışı bırakarak LAN çoklu yayın duyurusunu devre dışı bırakır.
- `OPENCLAW_DISABLE_BONJOUR=1`, Plugin yapılandırmasını değiştirmeden LAN çoklu yayın duyurusunu devre dışı bırakır; kabul edilen doğru değerler `1`, `true`, `yes` ve `on` olur (eski: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0`, algılanan kapsayıcıların içi dahil LAN çoklu yayın duyurusunu zorla açar; kabul edilen yanlış değerler `0`, `false`, `no` ve `off` olur.
- Bonjour Plugin'i etkin olduğunda ve `OPENCLAW_DISABLE_BONJOUR` ayarlanmamışsa, Bonjour normal konaklarda duyuru yapar ve algılanan kapsayıcıların içinde otomatik devre dışı kalır.
- `~/.openclaw/openclaw.json` içindeki `gateway.bind`, Gateway bağlama modunu denetler.
- `OPENCLAW_SSH_PORT`, `sshPort` duyurulduğunda SSH bağlantı noktasını geçersiz kılar (eski: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS`, mDNS tam modu etkin olduğunda TXT içinde bir MagicDNS ipucu yayımlar (eski: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH`, duyurulan CLI yolunu geçersiz kılar (eski: `OPENCLAW_CLI_PATH`).

## İlgili belgeler

- Keşif ilkesi ve taşıma seçimi: [Keşif](/tr/gateway/discovery)
- Node eşleştirme + onaylar: [Gateway eşleştirme](/tr/gateway/pairing)
