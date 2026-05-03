---
read_when:
    - macOS/iOS’ta Bonjour keşif sorunlarını giderme
    - mDNS hizmet türlerini, TXT kayıtlarını veya keşif kullanıcı deneyimini değiştirme
summary: Bonjour/mDNS keşfi + hata ayıklama (Gateway işaretleri, istemciler ve yaygın arıza modları)
title: Bonjour keşfi
x-i18n:
    generated_at: "2026-05-03T21:31:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2975fea03bc8fe8ccbd57f7a4ca8c15a59fb21b3f92c2b77b9a57ae4ebd5d374
    source_path: gateway/bonjour.md
    workflow: 16
---

# Bonjour / mDNS keşfi

OpenClaw etkin bir Gateway'i (WebSocket uç noktası) keşfetmek için Bonjour (mDNS / DNS-SD) kullanabilir.
Çok noktaya yayın `local.` taraması **yalnızca LAN kolaylığıdır**. Paketle gelen `bonjour`
Plugin'i LAN duyurusunun sahibidir. macOS host'larında otomatik başlar ve
Linux, Windows ve konteynerleştirilmiş Gateway dağıtımlarında isteğe bağlıdır. Ağlar arası keşif için aynı
işaret, yapılandırılmış bir geniş alan DNS-SD etki alanı üzerinden de yayımlanabilir. Keşif
yine de en iyi çaba esaslıdır ve SSH veya Tailnet tabanlı bağlantının yerini **almaz**.

## Tailscale üzerinden geniş alan Bonjour (Tekil Yayın DNS-SD)

Düğüm ve Gateway farklı ağlardaysa, çok noktaya yayın mDNS sınırı
aşmaz. Tailscale üzerinden **tekil yayın DNS‑SD**'ye
("Geniş Alan Bonjour") geçerek aynı keşif kullanıcı deneyimini koruyabilirsiniz.

Üst düzey adımlar:

1. Gateway host'unda bir DNS sunucusu çalıştırın (Tailnet üzerinden erişilebilir).
2. Ayrılmış bir bölge altında `_openclaw-gw._tcp` için DNS‑SD kayıtları yayımlayın
   (örnek: `openclaw.internal.`).
3. Seçtiğiniz etki alanının istemciler (iOS dahil) için bu
   DNS sunucusu üzerinden çözümlenmesi amacıyla Tailscale **bölünmüş DNS** yapılandırın.

OpenClaw herhangi bir keşif etki alanını destekler; `openclaw.internal.` yalnızca bir örnektir.
iOS/Android düğümleri hem `local.` hem de yapılandırdığınız geniş alan etki alanında tarama yapar.

### Gateway yapılandırması (önerilir)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### Tek seferlik DNS sunucusu kurulumu (Gateway host'u)

```bash
openclaw dns setup --apply
```

Bu, CoreDNS'i kurar ve şu şekilde yapılandırır:

- yalnızca Gateway'in Tailscale arayüzlerinde 53 numaralı bağlantı noktasını dinler
- seçtiğiniz etki alanını (örnek: `openclaw.internal.`) `~/.openclaw/dns/<domain>.db` üzerinden sunar

Tailnet'e bağlı bir makineden doğrulayın:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS ayarları

Tailscale yönetici konsolunda:

- Gateway'in tailnet IP'sini işaret eden bir ad sunucusu ekleyin (UDP/TCP 53).
- Keşif etki alanınızın bu ad sunucusunu kullanması için bölünmüş DNS ekleyin.

İstemciler tailnet DNS'i kabul ettikten sonra, iOS düğümleri ve CLI keşfi
çok noktaya yayın olmadan keşif etki alanınızda `_openclaw-gw._tcp` tarayabilir.

### Gateway dinleyici güvenliği (önerilir)

Gateway WS bağlantı noktası (varsayılan `18789`) varsayılan olarak loopback'e bağlanır. LAN/tailnet
erişimi için açıkça bağlayın ve kimlik doğrulamayı etkin tutun.

Yalnızca tailnet kurulumları için:

- `~/.openclaw/openclaw.json` içinde `gateway.bind: "tailnet"` ayarlayın.
- Gateway'i yeniden başlatın (veya macOS menü çubuğu uygulamasını yeniden başlatın).

## Ne duyurulur

Yalnızca Gateway `_openclaw-gw._tcp` duyurur. LAN çok noktaya yayın duyurusu,
Plugin etkinleştirildiğinde paketle gelen `bonjour` Plugin'i tarafından sağlanır; geniş alan
DNS-SD yayımı Gateway'e ait kalır.

## Hizmet türleri

- `_openclaw-gw._tcp` — Gateway aktarım işareti (macOS/iOS/Android düğümleri tarafından kullanılır).

## TXT anahtarları (gizli olmayan ipuçları)

Gateway, kullanıcı arayüzü akışlarını kolaylaştırmak için küçük gizli olmayan ipuçları duyurur:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (yalnızca TLS etkin olduğunda)
- `gatewayTlsSha256=<sha256>` (yalnızca TLS etkin olduğunda ve parmak izi kullanılabilir olduğunda)
- `canvasPort=<port>` (yalnızca canvas host'u etkin olduğunda; şu anda `gatewayPort` ile aynıdır)
- `transport=gateway`
- `tailnetDns=<magicdns>` (yalnızca mDNS tam modu, Tailnet kullanılabilir olduğunda isteğe bağlı ipucu)
- `sshPort=<port>` (yalnızca mDNS tam modu; geniş alan DNS-SD bunu atlayabilir)
- `cliPath=<path>` (yalnızca mDNS tam modu; geniş alan DNS-SD bunu yine de uzak kurulum ipucu olarak yazar)

Güvenlik notları:

- Bonjour/mDNS TXT kayıtları **kimliği doğrulanmamıştır**. İstemciler TXT'yi yetkili yönlendirme olarak ele almamalıdır.
- İstemciler çözümlenen hizmet uç noktasını kullanarak yönlendirme yapmalıdır (SRV + A/AAAA). `lanHost`, `tailnetDns`, `gatewayPort` ve `gatewayTlsSha256` değerlerini yalnızca ipucu olarak ele alın.
- SSH otomatik hedefleme de aynı şekilde yalnızca TXT ipuçlarını değil, çözümlenen hizmet host'unu kullanmalıdır.
- TLS pinleme, duyurulan bir `gatewayTlsSha256` değerinin daha önce depolanmış bir pin'i geçersiz kılmasına asla izin vermemelidir.
- iOS/Android düğümleri, keşif tabanlı doğrudan bağlantıları **yalnızca TLS** olarak ele almalı ve ilk kez görülen bir parmak izine güvenmeden önce açık kullanıcı onayı istemelidir.

## macOS'ta hata ayıklama

Kullanışlı yerleşik araçlar:

- Örnekleri tara:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Bir örneği çözümle (`<instance>` yerine değer girin):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Tarama çalışıyor ancak çözümleme başarısız oluyorsa, genellikle bir LAN politikası veya
mDNS çözümleyici sorunuyla karşılaşıyorsunuzdur.

## Gateway günlüklerinde hata ayıklama

Gateway kayan bir günlük dosyası yazar (başlangıçta
`gateway log file: ...` olarak yazdırılır). `bonjour:` satırlarını, özellikle şunları arayın:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour, geçerli bir DNS etiketi olduğunda duyurulan `.local` host'u için sistem host adını kullanır.
Sistem host adı boşluk, alt çizgi veya başka bir geçersiz DNS etiketi karakteri içeriyorsa
OpenClaw `openclaw.local` değerine geri döner. Açık bir host etiketi gerektiğinde
Gateway'i başlatmadan önce `OPENCLAW_MDNS_HOSTNAME=<name>` ayarlayın.

## iOS düğümünde hata ayıklama

iOS düğümü `_openclaw-gw._tcp` keşfetmek için `NWBrowser` kullanır.

Günlükleri yakalamak için:

- Settings → Gateway → Advanced → **Keşif Hata Ayıklama Günlükleri**
- Settings → Gateway → Advanced → **Keşif Günlükleri** → yeniden üret → **Kopyala**

Günlük, tarayıcı durum geçişlerini ve sonuç kümesi değişikliklerini içerir.

## Bonjour ne zaman etkinleştirilmeli

Bonjour, yerel uygulama ve yakındaki iOS/Android düğümleri genellikle aynı LAN keşfine
güvendiği için macOS host'larında boş yapılandırmalı Gateway başlangıcında otomatik başlar.

Aynı LAN otomatik keşfi Linux, Windows veya başka bir macOS olmayan host'ta yararlıysa
Bonjour'u açıkça etkinleştirin:

```bash
openclaw plugins enable bonjour
```

Etkinleştirildiğinde Bonjour, ne kadar TXT meta verisi yayımlanacağına karar vermek için
`discovery.mdns.mode` kullanır. Varsayılan mod `minimal`'dır; `full` değerini yalnızca yerel istemciler
`cliPath` veya `sshPort` ipuçlarına ihtiyaç duyduğunda kullanın ve Plugin etkinliğini
değiştirmeden LAN çok noktaya yayını bastırmak için `off` kullanın.

## Bonjour ne zaman devre dışı bırakılmalı

LAN çok noktaya yayın duyurusu gereksiz, kullanılamaz veya zararlı olduğunda Bonjour'u devre dışı bırakılmış bırakın.
Yaygın durumlar macOS olmayan sunucular, Docker bridge ağları,
WSL veya mDNS çok noktaya yayını düşüren bir ağ politikasıdır. Bu ortamlarda
Gateway yayımlanan URL'si, SSH, Tailnet veya geniş alan
DNS-SD üzerinden hâlâ erişilebilirdir, ancak LAN otomatik keşfi güvenilir değildir.

Sorun dağıtım kapsamındaysa mevcut ortam geçersiz kılmasını tercih edin:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Bu, Plugin yapılandırmasını değiştirmeden LAN çok noktaya yayın duyurusunu devre dışı bırakır.
Ayar ortam ortadan kalktığında kaybolduğu için Docker imajları, hizmet dosyaları, başlatma betikleri ve tek seferlik
hata ayıklama için güvenlidir.

Bu OpenClaw yapılandırması için paketle gelen LAN keşif Plugin'ini bilerek kapatmak istediğinizde
Plugin yapılandırmasını kullanın:

```bash
openclaw plugins disable bonjour
```

## Docker dikkat noktaları

Paketle gelen Bonjour Plugin'i, `OPENCLAW_DISABLE_BONJOUR` ayarlanmamışsa algılanan
konteynerlerde LAN çok noktaya yayın duyurusunu otomatik devre dışı bırakır. Docker bridge ağları
genellikle konteyner ile LAN arasında mDNS çok noktaya yayını (`224.0.0.251:5353`)
iletmez, bu yüzden konteynerden duyuru yapmak keşfi nadiren çalıştırır.

Önemli dikkat noktaları:

- Bonjour macOS host'larında otomatik başlar ve diğer yerlerde isteğe bağlıdır. Devre dışı
  bırakılması Gateway'i durdurmaz; yalnızca LAN çok noktaya yayın duyurusunu atlar.
- Bonjour'u devre dışı bırakmak `gateway.bind` değerini değiştirmez; Docker hâlâ varsayılan olarak
  `OPENCLAW_GATEWAY_BIND=lan` kullanır, böylece yayımlanan host bağlantı noktası çalışabilir.
- Bonjour'u devre dışı bırakmak geniş alan DNS-SD'yi devre dışı bırakmaz. Gateway ve düğüm aynı LAN'da değilse
  geniş alan keşfi veya Tailnet kullanın.
- Aynı `OPENCLAW_CONFIG_DIR` değerini Docker dışında yeniden kullanmak
  konteyner otomatik devre dışı bırakma politikasını kalıcı hale getirmez.
- `OPENCLAW_DISABLE_BONJOUR=0` değerini yalnızca host ağı, macvlan veya mDNS çok noktaya yayının geçtiği bilinen başka bir
  ağ için ayarlayın; zorla devre dışı bırakmak için `1` olarak ayarlayın.

## Devre dışı Bonjour sorunlarını giderme

Docker kurulumundan sonra bir düğüm Gateway'i artık otomatik keşfetmiyorsa:

1. Gateway'in otomatik, zorla açık veya zorla kapalı modda çalışıp çalışmadığını doğrulayın:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Gateway'in kendisinin yayımlanan bağlantı noktası üzerinden erişilebilir olduğunu doğrulayın:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Bonjour devre dışıyken doğrudan hedef kullanın:
   - Control UI veya yerel araçlar: `http://127.0.0.1:18789`
   - LAN istemcileri: `http://<gateway-host>:18789`
   - Ağlar arası istemciler: Tailnet MagicDNS, Tailnet IP, SSH tüneli veya
     geniş alan DNS-SD

4. Docker içinde Bonjour Plugin'ini bilerek etkinleştirdiyseniz ve
   `OPENCLAW_DISABLE_BONJOUR=0` ile duyurmayı zorladıysanız, host'tan çok noktaya yayını test edin:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Tarama boşsa veya Gateway günlükleri tekrarlanan ciao watchdog
   iptallerini gösteriyorsa, `OPENCLAW_DISABLE_BONJOUR=1` değerine geri dönün ve doğrudan veya
   Tailnet rotası kullanın.

## Yaygın hata modları

- **Bonjour ağlar arasında geçmez**: Tailnet veya SSH kullanın.
- **Çok noktaya yayın engellendi**: bazı Wi‑Fi ağları mDNS'i devre dışı bırakır.
- **Duyurucu probing/announcing durumunda takıldı**: çok noktaya yayını engellenmiş host'lar,
  konteyner bridge'leri, WSL veya arayüz değişimleri ciao duyurucusunu
  duyurulmamış bir durumda bırakabilir. OpenClaw birkaç kez yeniden dener ve ardından duyurucuyu sonsuza kadar yeniden başlatmak yerine
  mevcut Gateway süreci için Bonjour'u devre dışı bırakır.
- **Docker bridge ağı**: Bonjour algılanan konteynerlerde otomatik devre dışı bırakılır.
  `OPENCLAW_DISABLE_BONJOUR=0` değerini yalnızca host, macvlan veya başka bir
  mDNS uyumlu ağ için ayarlayın.
- **Uyku / arayüz değişimi**: macOS mDNS sonuçlarını geçici olarak düşürebilir; yeniden deneyin.
- **Tarama çalışıyor ancak çözümleme başarısız**: makine adlarını basit tutun (emoji veya
  noktalama işaretlerinden kaçının), ardından Gateway'i yeniden başlatın. Hizmet örneği adı
  host adından türediği için aşırı karmaşık adlar bazı çözümleyicileri şaşırtabilir.

## Kaçışlı örnek adları (`\032`)

Bonjour/DNS‑SD, hizmet örneği adlarındaki baytları sıklıkla ondalık `\DDD`
dizileri olarak kaçışlar (örn. boşluklar `\032` olur).

- Bu, protokol düzeyinde normaldir.
- Kullanıcı arayüzleri görüntüleme için çözmelidir (iOS `BonjourEscapes.decode` kullanır).

## Etkinleştirme / devre dışı bırakma / yapılandırma

- macOS host'ları paketle gelen LAN keşif Plugin'ini varsayılan olarak otomatik başlatır.
- `openclaw plugins enable bonjour`, varsayılan olarak etkin olmadığı host'larda paketle gelen LAN keşif Plugin'ini etkinleştirir.
- `openclaw plugins disable bonjour`, paketle gelen Plugin'i devre dışı bırakarak LAN çok noktaya yayın duyurusunu devre dışı bırakır.
- `OPENCLAW_DISABLE_BONJOUR=1`, Plugin yapılandırmasını değiştirmeden LAN çok noktaya yayın duyurusunu devre dışı bırakır; kabul edilen doğru değerler `1`, `true`, `yes` ve `on` değerleridir (eski: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0`, algılanan konteynerlerin içinde dahil olmak üzere LAN çok noktaya yayın duyurusunu zorla açar; kabul edilen yanlış değerler `0`, `false`, `no` ve `off` değerleridir.
- Bonjour Plugin'i etkinleştirildiğinde ve `OPENCLAW_DISABLE_BONJOUR` ayarlanmamış olduğunda, Bonjour normal host'larda duyuru yapar ve algılanan konteynerlerin içinde otomatik devre dışı kalır.
- `~/.openclaw/openclaw.json` içindeki `gateway.bind`, Gateway bağlama modunu denetler.
- `sshPort` duyurulduğunda `OPENCLAW_SSH_PORT` SSH bağlantı noktasını geçersiz kılar (eski: `OPENCLAW_SSH_PORT`).
- mDNS tam modu etkinleştirildiğinde `OPENCLAW_TAILNET_DNS`, TXT içinde bir MagicDNS ipucu yayımlar (eski: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` duyurulan CLI yolunu geçersiz kılar (eski: `OPENCLAW_CLI_PATH`).

## İlgili belgeler

- Keşif politikası ve aktarım seçimi: [Keşif](/tr/gateway/discovery)
- Düğüm eşleştirme + onaylar: [Gateway eşleştirme](/tr/gateway/pairing)
