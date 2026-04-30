---
read_when:
    - macOS/iOS’ta Bonjour keşif sorunlarında hata ayıklama
    - mDNS hizmet türlerini, TXT kayıtlarını veya keşif kullanıcı deneyimini değiştirme
summary: Bonjour/mDNS keşfi + hata ayıklama (Gateway işaretleri, istemciler ve yaygın hata modları)
title: Bonjour keşfi
x-i18n:
    generated_at: "2026-04-30T09:19:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0720451843aae0509949324e51f3a23dc69e366e68de851c595ce76c8ab0eec9
    source_path: gateway/bonjour.md
    workflow: 16
---

# Bonjour / mDNS keşfi

OpenClaw, etkin bir Gateway'i (WebSocket uç noktası) keşfetmek için Bonjour (mDNS / DNS‑SD) kullanır.
Multicast `local.` taraması **yalnızca LAN kolaylığıdır**. Paketle gelen `bonjour`
Plugin'i LAN duyurusunu üstlenir ve varsayılan olarak etkindir. Ağlar arası keşif için
aynı işaret, yapılandırılmış bir geniş alan DNS-SD alan adı üzerinden de yayımlanabilir.
Keşif hâlâ en iyi çaba ilkesine dayanır ve SSH ya da Tailnet tabanlı bağlantının yerini **almaz**.

## Tailscale üzerinden geniş alan Bonjour (Unicast DNS-SD)

Node ve gateway farklı ağlardaysa, multicast mDNS sınırı geçmez.
**Unicast DNS‑SD**'ye ("Geniş Alan Bonjour") Tailscale üzerinden geçerek aynı keşif UX'ini koruyabilirsiniz.

Üst düzey adımlar:

1. Gateway ana makinesinde bir DNS sunucusu çalıştırın (Tailnet üzerinden erişilebilir).
2. `_openclaw-gw._tcp` için DNS‑SD kayıtlarını ayrılmış bir zone altında yayımlayın
   (örnek: `openclaw.internal.`).
3. Seçtiğiniz alan adının istemciler (iOS dahil) için bu DNS sunucusu üzerinden çözülmesi amacıyla Tailscale **split DNS** yapılandırın.

OpenClaw herhangi bir keşif alan adını destekler; `openclaw.internal.` yalnızca bir örnektir.
iOS/Android node'ları hem `local.` hem de yapılandırdığınız geniş alan alan adını tarar.

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

Bu, CoreDNS'i kurar ve şunları yapacak şekilde yapılandırır:

- yalnızca gateway'in Tailscale arayüzlerinde 53 numaralı portu dinler
- seçtiğiniz alan adını (örnek: `openclaw.internal.`) `~/.openclaw/dns/<domain>.db` üzerinden sunar

Tailnet bağlantılı bir makineden doğrulayın:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS ayarları

Tailscale yönetici konsolunda:

- Gateway'in tailnet IP'sine işaret eden bir ad sunucusu ekleyin (UDP/TCP 53).
- Keşif alan adınızın bu ad sunucusunu kullanması için split DNS ekleyin.

İstemciler tailnet DNS'i kabul ettiğinde, iOS node'ları ve CLI keşfi multicast olmadan
keşif alan adınızda `_openclaw-gw._tcp` tarayabilir.

### Gateway dinleyici güvenliği (önerilir)

Gateway WS portu (varsayılan `18789`) varsayılan olarak loopback'e bağlanır. LAN/tailnet
erişimi için açıkça bağlayın ve kimlik doğrulamayı etkin tutun.

Yalnızca tailnet kurulumları için:

- `~/.openclaw/openclaw.json` içinde `gateway.bind: "tailnet"` ayarlayın.
- Gateway'i yeniden başlatın (veya macOS menü çubuğu uygulamasını yeniden başlatın).

## Ne duyurulur

Yalnızca Gateway `_openclaw-gw._tcp` duyurur. LAN multicast duyurusu
paketle gelen `bonjour` Plugin'i tarafından sağlanır; geniş alan DNS-SD yayını ise
Gateway'in sorumluluğunda kalır.

## Servis türleri

- `_openclaw-gw._tcp` — gateway taşıma işareti (macOS/iOS/Android node'ları tarafından kullanılır).

## TXT anahtarları (gizli olmayan ipuçları)

Gateway, UI akışlarını kolaylaştırmak için küçük gizli olmayan ipuçları duyurur:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (yalnızca TLS etkin olduğunda)
- `gatewayTlsSha256=<sha256>` (yalnızca TLS etkin olduğunda ve parmak izi mevcutsa)
- `canvasPort=<port>` (yalnızca canvas host etkin olduğunda; şu anda `gatewayPort` ile aynıdır)
- `transport=gateway`
- `tailnetDns=<magicdns>` (yalnızca mDNS tam modu, Tailnet kullanılabilir olduğunda isteğe bağlı ipucu)
- `sshPort=<port>` (yalnızca mDNS tam modu; geniş alan DNS-SD bunu atlayabilir)
- `cliPath=<path>` (yalnızca mDNS tam modu; geniş alan DNS-SD bunu yine de uzaktan kurulum ipucu olarak yazar)

Güvenlik notları:

- Bonjour/mDNS TXT kayıtları **kimliği doğrulanmamıştır**. İstemciler TXT'yi yetkili yönlendirme kaynağı olarak görmemelidir.
- İstemciler çözümlenen servis uç noktasını (SRV + A/AAAA) kullanarak yönlendirmelidir. `lanHost`, `tailnetDns`, `gatewayPort` ve `gatewayTlsSha256` değerlerini yalnızca ipucu olarak değerlendirin.
- SSH otomatik hedefleme de benzer şekilde yalnızca TXT ipuçlarını değil, çözümlenen servis ana makinesini kullanmalıdır.
- TLS sabitlemesi, duyurulan bir `gatewayTlsSha256` değerinin daha önce saklanmış bir pini geçersiz kılmasına asla izin vermemelidir.
- iOS/Android node'ları keşif tabanlı doğrudan bağlantıları **yalnızca TLS** olarak ele almalı ve ilk kez görülen bir parmak izine güvenmeden önce açık kullanıcı onayı istemelidir.

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

Tarama çalışıyor ancak çözümleme başarısız oluyorsa, genellikle bir LAN politikası veya
mDNS çözümleyici sorunuyla karşılaşıyorsunuzdur.

## Gateway günlüklerinde hata ayıklama

Gateway dönen bir günlük dosyası yazar (başlangıçta
`gateway log file: ...` olarak yazdırılır). `bonjour:` satırlarını arayın, özellikle:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour, geçerli bir DNS etiketi olduğunda duyurulan `.local` ana makine için sistem ana makine adını kullanır.
Sistem ana makine adı boşluk, alt çizgi veya başka bir geçersiz DNS etiketi karakteri içeriyorsa,
OpenClaw `openclaw.local` değerine geri döner. Açık bir ana makine etiketi gerektiğinde
Gateway'i başlatmadan önce `OPENCLAW_MDNS_HOSTNAME=<name>` ayarlayın.

## iOS node üzerinde hata ayıklama

iOS node'u `_openclaw-gw._tcp` keşfetmek için `NWBrowser` kullanır.

Günlükleri yakalamak için:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → yeniden üret → **Copy**

Günlük, tarayıcı durum geçişlerini ve sonuç kümesi değişikliklerini içerir.

## Bonjour ne zaman devre dışı bırakılır

Bonjour'u yalnızca LAN multicast duyurusu kullanılamadığında veya zararlı olduğunda devre dışı bırakın.
Yaygın durum, Docker bridge ağının, WSL'nin veya mDNS multicast'i düşüren bir
ağ politikasının arkasında çalışan bir Gateway'dir. Bu ortamlarda Gateway
yayımlanmış URL'si, SSH, Tailnet veya geniş alan DNS-SD üzerinden hâlâ erişilebilir,
ancak LAN otomatik keşfi güvenilir değildir.

Sorun dağıtım kapsamındaysa mevcut ortam geçersiz kılmasını tercih edin:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Bu, Plugin yapılandırmasını değiştirmeden LAN multicast duyurusunu devre dışı bırakır.
Ayar ortam ortadan kalktığında kaybolduğu için Docker imajları, servis dosyaları, başlatma betikleri ve tek seferlik
hata ayıklama için güvenlidir.

Plugin yapılandırmasını yalnızca bu OpenClaw yapılandırması için
paketle gelen LAN keşif Plugin'ini kasıtlı olarak kapatmak istediğinizde kullanın:

```bash
openclaw plugins disable bonjour
```

## Docker dikkat noktaları

Paketle gelen Bonjour Plugin'i, `OPENCLAW_DISABLE_BONJOUR` ayarlanmamışken algılanan
container'larda LAN multicast duyurusunu otomatik olarak devre dışı bırakır. Docker bridge ağları
genellikle mDNS multicast'i (`224.0.0.251:5353`) container ile LAN arasında iletmez,
bu nedenle container'dan duyuru yapmak keşfin çalışmasını nadiren sağlar.

Önemli dikkat noktaları:

- Bonjour'u devre dışı bırakmak Gateway'i durdurmaz. Yalnızca LAN multicast
  duyurusunu durdurur.
- Bonjour'u devre dışı bırakmak `gateway.bind` değerini değiştirmez; Docker hâlâ
  yayımlanan ana makine portunun çalışabilmesi için varsayılan olarak `OPENCLAW_GATEWAY_BIND=lan` kullanır.
- Bonjour'u devre dışı bırakmak geniş alan DNS-SD'yi devre dışı bırakmaz. Gateway ve node aynı LAN'da olmadığında
  geniş alan keşfi veya Tailnet kullanın.
- Aynı `OPENCLAW_CONFIG_DIR` değerini Docker dışında yeniden kullanmak
  container otomatik devre dışı bırakma politikasını kalıcı hale getirmez.
- `OPENCLAW_DISABLE_BONJOUR=0` değerini yalnızca host networking, macvlan veya mDNS multicast'in geçtiği bilinen başka bir
  ağ için ayarlayın; zorla devre dışı bırakmak için `1` olarak ayarlayın.

## Devre dışı Bonjour sorunlarını giderme

Bir node Docker kurulumundan sonra Gateway'i artık otomatik keşfetmiyorsa:

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

4. Docker içinde Bonjour'u bilerek
   `OPENCLAW_DISABLE_BONJOUR=0` ile etkinleştirdiyseniz, host üzerinden multicast'i test edin:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Tarama boşsa veya Gateway günlükleri tekrarlanan ciao watchdog
   iptallerini gösteriyorsa, `OPENCLAW_DISABLE_BONJOUR=1` değerini geri yükleyin ve doğrudan ya da
   Tailnet rotası kullanın.

## Yaygın hata modları

- **Bonjour ağları aşmaz**: Tailnet veya SSH kullanın.
- **Multicast engellendi**: bazı Wi‑Fi ağları mDNS'i devre dışı bırakır.
- **Duyurucu probing/announcing durumunda takıldı**: multicast'i engellenmiş host'lar,
  container bridge'leri, WSL veya arayüz değişkenliği ciao duyurucusunu
  duyurulmamış bir durumda bırakabilir. OpenClaw birkaç kez yeniden dener ve ardından duyurucuyu sonsuza kadar yeniden başlatmak yerine
  geçerli Gateway işlemi için Bonjour'u devre dışı bırakır.
- **Docker bridge networking**: Bonjour algılanan container'larda otomatik devre dışı bırakılır.
  `OPENCLAW_DISABLE_BONJOUR=0` değerini yalnızca host, macvlan veya başka bir
  mDNS uyumlu ağ için ayarlayın.
- **Uyku / arayüz değişkenliği**: macOS mDNS sonuçlarını geçici olarak düşürebilir; yeniden deneyin.
- **Tarama çalışıyor ancak çözümleme başarısız**: makine adlarını basit tutun (emoji veya
  noktalama işaretlerinden kaçının), ardından Gateway'i yeniden başlatın. Servis örneği adı
  host adından türetildiği için aşırı karmaşık adlar bazı çözümleyicileri şaşırtabilir.

## Kaçışlı örnek adları (`\032`)

Bonjour/DNS‑SD, servis örneği adlarındaki baytları sık sık ondalık `\DDD`
dizileri olarak kaçışlar (ör. boşluklar `\032` olur).

- Bu, protokol düzeyinde normaldir.
- UI'lar gösterim için çözmelidir (iOS `BonjourEscapes.decode` kullanır).

## Devre dışı bırakma / yapılandırma

- `openclaw plugins disable bonjour`, paketle gelen Plugin'i devre dışı bırakarak LAN multicast duyurusunu devre dışı bırakır.
- `openclaw plugins enable bonjour`, varsayılan LAN keşif Plugin'ini geri yükler.
- `OPENCLAW_DISABLE_BONJOUR=1`, Plugin yapılandırmasını değiştirmeden LAN multicast duyurusunu devre dışı bırakır; kabul edilen truthy değerler `1`, `true`, `yes` ve `on` değerleridir (eski: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0`, algılanan container'ların içinde bile LAN multicast duyurusunu zorla açar; kabul edilen falsy değerler `0`, `false`, `no` ve `off` değerleridir.
- `OPENCLAW_DISABLE_BONJOUR` ayarlanmamışsa, Bonjour normal host'larda duyuru yapar ve algılanan container'ların içinde otomatik devre dışı kalır.
- `~/.openclaw/openclaw.json` içindeki `gateway.bind`, Gateway bind modunu kontrol eder.
- `OPENCLAW_SSH_PORT`, `sshPort` duyurulduğunda SSH portunu geçersiz kılar (eski: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS`, mDNS tam modu etkin olduğunda TXT içinde bir MagicDNS ipucu yayımlar (eski: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH`, duyurulan CLI yolunu geçersiz kılar (eski: `OPENCLAW_CLI_PATH`).

## İlgili dokümanlar

- Keşif politikası ve taşıma seçimi: [Keşif](/tr/gateway/discovery)
- Node eşleştirme + onaylar: [Gateway eşleştirme](/tr/gateway/pairing)
