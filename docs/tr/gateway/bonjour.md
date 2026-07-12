---
read_when:
    - macOS/iOS'ta Bonjour keşif sorunlarını ayıklama
    - mDNS hizmet türlerini, TXT kayıtlarını veya keşif kullanıcı deneyimini değiştirme
summary: Bonjour/mDNS keşfi + hata ayıklama (Gateway duyuruları, istemciler ve yaygın hata durumları)
title: Bonjour keşfi
x-i18n:
    generated_at: "2026-07-12T11:41:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0526c9e20dd02d143ae7aa4c8e1e6830763763e95c9a74c4d73332c5e5e155e
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw, etkin bir Gateway'i (WebSocket uç noktası) keşfetmek için Bonjour'u (mDNS/DNS-SD) kullanabilir. Çok noktaya yayın `local.` taraması **yalnızca LAN'a yönelik bir kolaylıktır**: paketle birlikte gelen `bonjour` plugin'i LAN duyurularını yönetir; macOS ana makinelerinde otomatik olarak başlar, Linux, Windows ve konteynerleştirilmiş Gateway dağıtımlarında ise isteğe bağlıdır. Aynı işaret, ağlar arası keşif için yapılandırılmış bir geniş alan DNS-SD etki alanı üzerinden de yayımlanabilir. Keşif en iyi gayret esasına göre çalışır ve SSH ya da Tailnet tabanlı bağlantının **yerini almaz**.

## Tailscale üzerinden geniş alan Bonjour (Tek Noktaya Yayın DNS-SD)

Node ve Gateway farklı ağlardaysa çok noktaya yayın mDNS bu sınırı aşamaz. Tailscale üzerinden **tek noktaya yayın DNS-SD**'ye ("Geniş Alan Bonjour") geçerek aynı keşif kullanıcı deneyimini koruyun:

1. Gateway ana makinesinde, Tailnet üzerinden erişilebilen bir DNS sunucusu çalıştırın.
2. `_openclaw-gw._tcp` için DNS-SD kayıtlarını özel bir bölge altında yayımlayın (örnek: `openclaw.internal.`).
3. Seçtiğiniz etki alanının iOS dahil istemciler için bu DNS sunucusu üzerinden çözümlenmesini sağlamak üzere Tailscale **bölünmüş DNS** yapılandırmasını ayarlayın.

Yukarıdaki `openclaw.internal.` yalnızca bir örnektir — OpenClaw herhangi bir keşif etki alanını destekler. iOS/Android Node'ları hem `local.` hem de yapılandırdığınız geniş alan etki alanını tarar.

### Gateway yapılandırması

```json5
{
  gateway: { bind: "tailnet" }, // yalnızca tailnet (önerilir)
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

`discovery.wideArea.domain`, ayarlanmamışsa yedek olarak `OPENCLAW_WIDE_AREA_DOMAIN` ortam değişkenini de kabul eder.

### Tek seferlik DNS sunucusu kurulumu (Gateway ana makinesi, yalnızca macOS)

```bash
openclaw dns setup --apply
```

Bu komut yalnızca macOS'ta çalışır ve Homebrew ile çalışan bir Tailscale bağlantısı gerektirir. CoreDNS'i (`brew install coredns`) kurar ve şu şekilde yapılandırır:

- yalnızca Gateway'in Tailscale arayüzlerinde 53 numaralı bağlantı noktasını dinler
- seçtiğiniz etki alanını (örnek: `openclaw.internal.`) `~/.openclaw/dns/<domain>.db` dosyasından sunar

Hiçbir şey kurmadan planı (etki alanı, bölge dosyası yolu, algılanan Tailnet IP'si, önerilen yapılandırma) önizlemek için önce `--apply` olmadan çalıştırın.

Tailnet'e bağlı bir makineden doğrulayın:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS ayarları

Tailscale yönetim konsolunda:

- Gateway'in Tailnet IP'sini (UDP/TCP 53) gösteren bir ad sunucusu ekleyin.
- Keşif etki alanınızın bu ad sunucusunu kullanması için bölünmüş DNS ekleyin.

İstemciler Tailnet DNS'ini kabul ettikten sonra iOS Node'ları ve CLI keşfi, çok noktaya yayın olmadan keşif etki alanınızdaki `_openclaw-gw._tcp` kaydını tarayabilir.

### Gateway dinleyici güvenliği

Gateway WS bağlantı noktası (varsayılan `18789`) varsayılan olarak local loopback'e bağlanır. LAN/Tailnet erişimi için bağlantıyı açıkça ayarlayın ve kimlik doğrulamayı etkin tutun. Yalnızca Tailnet kullanan kurulumlarda `~/.openclaw/openclaw.json` içinde `gateway.bind: "tailnet"` ayarını yapın ve Gateway'i (veya macOS menü çubuğu uygulamasını) yeniden başlatın.

## Neler duyurulur

Yalnızca Gateway, `_openclaw-gw._tcp` duyurusunu yapar. LAN çok noktaya yayın duyuruları, etkinleştirildiğinde paketle birlikte gelen `bonjour` plugin'inden gelir; geniş alan DNS-SD yayını Gateway'in sorumluluğunda kalır.

## Hizmet türleri

- `_openclaw-gw._tcp` - macOS/iOS/Android Node'ları tarafından kullanılan Gateway aktarım işareti.

## TXT anahtarları (gizli olmayan ipuçları)

| Anahtar                       | Bulunduğu durum                                                                |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | Her zaman.                                                                     |
| `displayName=<friendly name>` | Her zaman.                                                                     |
| `lanHost=<hostname>.local`    | Her zaman.                                                                     |
| `gatewayPort=<port>`          | Her zaman (Gateway WS + HTTP).                                                 |
| `transport=gateway`           | Her zaman.                                                                     |
| `gatewayTls=1`                | Yalnızca TLS etkin olduğunda.                                                  |
| `gatewayTlsSha256=<sha256>`   | Yalnızca TLS etkin olduğunda ve parmak izi mevcutsa.                           |
| `gatewayDirectReachable=1`    | Yalnızca Gateway'e doğrudan erişilebildiğinde (yalnızca aktarıcı/proxy yolu üzerinden değil). |
| `canvasPort=<port>`           | Yalnızca tuval ana makinesi etkin olduğunda; şu anda `gatewayPort` ile aynıdır. |
| `tailnetDns=<magicdns>`       | Yalnızca mDNS tam modunda; Tailnet kullanılabilir olduğunda isteğe bağlı ipucu. |
| `sshPort=<port>`              | Yalnızca tam modda; minimal ve kapalı modlarda kullanılmaz.                    |
| `cliPath=<path>`              | Yalnızca tam modda; minimal ve kapalı modlarda kullanılmaz.                    |

Güvenlik notları:

- Bonjour/mDNS TXT kayıtlarının **kimliği doğrulanmaz**. İstemciler TXT'yi yetkili yönlendirme kaynağı olarak kabul etmemelidir.
- İstemciler, çözümlenen hizmet uç noktasını (SRV + A/AAAA) kullanarak yönlendirme yapmalıdır. `lanHost`, `tailnetDns`, `gatewayPort` ve `gatewayTlsSha256` değerlerini yalnızca ipucu olarak kabul edin.
- SSH otomatik hedefleme de yalnızca TXT ipuçlarını değil, çözümlenen hizmet ana makinesini kullanmalıdır.
- TLS sabitleme, duyurulan bir `gatewayTlsSha256` değerinin daha önce saklanan sabitlemenin üzerine yazmasına asla izin vermemelidir.
- iOS/Android Node'ları, keşif tabanlı doğrudan bağlantıları **yalnızca TLS** olarak kabul etmeli ve ilk kez görülen bir parmak izine güvenmeden önce açık kullanıcı onayı istemelidir.

## macOS'ta hata ayıklama

Yerleşik araçlar:

```bash
# Örnekleri tara
dns-sd -B _openclaw-gw._tcp local.

# Bir örneği çözümle (<instance> değerini değiştirin)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

Tarama çalışıyor ancak çözümleme başarısız oluyorsa genellikle bir LAN politikası veya mDNS çözümleyici sorunuyla karşılaşıyorsunuzdur.

## Gateway günlüklerinde hata ayıklama

Gateway, dönüşümlü bir günlük dosyası yazar (başlangıçta `gateway log file: ...` olarak yazdırılır). Özellikle aşağıdaki `bonjour:` satırlarını arayın:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

İzleme mekanizması etkin `probing`, `announcing` ve yakın zamanda gerçekleşen çakışma yeniden adlandırmalarını devam eden durumlar olarak kabul eder. Hizmet hiçbir zaman `announced` durumuna ulaşmazsa OpenClaw duyurucuyu yeniden oluşturur ve yinelenen başarısızlıklardan sonra sonsuza kadar yeniden duyurmak yerine o Gateway işlemi için Bonjour'u devre dışı bırakır.

Bonjour, geçerli bir DNS etiketi olduğunda duyurulan `.local` ana makinesi için sistem ana makine adını kullanır. Sistem ana makine adı boşluk, alt çizgi veya DNS etiketinde geçersiz başka bir karakter içeriyorsa OpenClaw yedek olarak `openclaw.local` kullanır. Açık bir ana makine etiketi gerektiğinde Gateway'i başlatmadan önce `OPENCLAW_MDNS_HOSTNAME=<name>` ayarını yapın.

## iOS Node'unda hata ayıklama

iOS Node'u `_openclaw-gw._tcp` keşfi için `NWBrowser` kullanır.

Günlükleri yakalamak için: Settings -> Gateway -> Advanced -> **Discovery Debug Logs**, ardından Settings -> Gateway -> Advanced -> **Discovery Logs** -> yeniden oluşturun -> **Copy**. Günlük, tarayıcı durumu geçişlerini ve sonuç kümesi değişikliklerini içerir.

## Bonjour ne zaman etkinleştirilmeli

Yerel uygulama ve yakındaki iOS/Android Node'ları genellikle aynı LAN üzerindeki keşfe dayandığından Bonjour, macOS ana makinelerinde boş yapılandırmayla Gateway başlatıldığında otomatik olarak başlar.

Aynı LAN'da otomatik keşif Linux, Windows veya macOS dışındaki başka bir ana makinede yararlı olduğunda açıkça etkinleştirin:

```bash
openclaw plugins enable bonjour
```

Bonjour etkinleştirildiğinde ne kadar TXT meta verisi yayımlanacağını belirlemek için `discovery.mdns.mode` ayarını kullanır; aynı mod, geniş alan DNS-SD kayıtlarındaki isteğe bağlı TXT ipuçlarını da denetler. Modlar:

| Mod                 | Davranış                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` (varsayılan) | Yalnızca temel TXT anahtarları; `sshPort`, `cliPath`, `tailnetDns` değerlerini kullanmaz.                                                                  |
| `full`              | `sshPort`, `cliPath`, `tailnetDns` ekler — istemcilerin bu ipuçlarına ihtiyacı olduğunda kullanın.                                                            |
| `off`               | Plugin etkinliğini değiştirmeden LAN çok noktaya yayınını engeller; `discovery.wideArea.enabled` doğru olduğunda geniş alan DNS-SD minimal işareti yayımlamaya devam edebilir. |

## Bonjour ne zaman devre dışı bırakılmalı

LAN çok noktaya yayın duyurusu gereksiz, kullanılamaz veya zararlı olduğunda Bonjour'u devre dışı bırakın — macOS dışındaki sunucular, Docker köprü ağı, WSL veya mDNS çok noktaya yayınını düşüren ağ politikaları yaygın örneklerdir. Gateway, yayımlanan URL'si, SSH, Tailnet veya geniş alan DNS-SD üzerinden erişilebilir kalır; yalnızca LAN otomatik keşfi güvenilmez olur.

Dağıtım kapsamındaki sorunlar için ortam geçersiz kılmasını kullanın (Docker kalıpları, hizmet dosyaları, başlatma betikleri ve tek seferlik hata ayıklama için güvenlidir — ortam ortadan kalktığında bu ayar da ortadan kalkar):

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Bu OpenClaw yapılandırması için paketle birlikte gelen LAN keşif plugin'ini kasıtlı olarak kapatmak istediğinizde plugin yapılandırmasını kullanın:

```bash
openclaw plugins disable bonjour
```

## Docker'daki dikkat edilmesi gerekenler

Paketle birlikte gelen Bonjour plugin'i, `OPENCLAW_DISABLE_BONJOUR` ayarlanmamışsa algılanan konteynerlerde LAN çok noktaya yayın duyurusunu otomatik olarak devre dışı bırakır. Docker köprü ağları genellikle mDNS çok noktaya yayınını (`224.0.0.251:5353`) konteyner ile LAN arasında iletmez; bu nedenle konteynerden duyuru yapmak nadiren keşfin çalışmasını sağlar.

Dikkat edilmesi gerekenler:

- Bonjour, macOS ana makinelerinde otomatik olarak başlar; diğer ortamlarda isteğe bağlıdır. Devre dışı bırakılması Gateway'i durdurmaz — yalnızca LAN çok noktaya yayın duyurusunu atlar.
- Bonjour'u devre dışı bırakmak `gateway.bind` ayarını değiştirmez; Docker, yayımlanan ana makine bağlantı noktasının çalışması için yine varsayılan olarak `OPENCLAW_GATEWAY_BIND=lan` kullanır.
- Bonjour'u devre dışı bırakmak geniş alan DNS-SD'yi devre dışı bırakmaz. Gateway ve Node aynı LAN üzerinde olmadığında geniş alan keşfini veya Tailnet'i kullanın.
- Aynı `OPENCLAW_CONFIG_DIR` dizinini Docker dışında yeniden kullanmak, konteynerin otomatik devre dışı bırakma politikasını kalıcı hâle getirmez.
- `OPENCLAW_DISABLE_BONJOUR=0` ayarını yalnızca ana makine ağı, macvlan veya mDNS çok noktaya yayınının geçtiği bilinen başka bir ağ için kullanın; zorla devre dışı bırakmak için `1` olarak ayarlayın.

## Devre dışı Bonjour sorunlarını giderme

Docker kurulumundan sonra bir Node artık Gateway'i otomatik olarak keşfetmiyorsa:

1. Gateway'in otomatik, zorla açık veya zorla kapalı modda çalışıp çalışmadığını doğrulayın:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Gateway'in yayımlanan bağlantı noktası üzerinden erişilebilir olduğunu doğrulayın:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Bonjour devre dışıyken doğrudan hedef kullanın:
   - Control UI veya yerel araçlar: `http://127.0.0.1:18789`
   - LAN istemcileri: `http://<gateway-host>:18789`
   - Ağlar arası istemciler: Tailnet MagicDNS, Tailnet IP'si, SSH tüneli veya geniş alan DNS-SD

4. Docker'da Bonjour plugin'ini bilerek etkinleştirdiyseniz ve `OPENCLAW_DISABLE_BONJOUR=0` ile duyurmayı zorladıysanız ana makineden çok noktaya yayını test edin:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Tarama boşsa veya Gateway günlükleri yinelenen ciao izleme mekanizması iptalleri gösteriyorsa `OPENCLAW_DISABLE_BONJOUR=1` ayarını geri yükleyin ve doğrudan ya da Tailnet yolunu kullanın.

## Yaygın hata durumları

- **Bonjour ağlar arasında çalışmaz**: Tailnet veya SSH kullanın.
- **Multicast engellenmiş**: bazı Wi-Fi ağları mDNS'yi devre dışı bırakır.
- **Yayıncı yoklama/duyuru aşamasında takılı kalmış**: multicast'in engellendiği ana makineler, konteyner köprüleri, WSL veya arayüz değişimleri, ciao yayıncısını duyuru yapılmamış durumda bırakabilir. OpenClaw birkaç kez yeniden dener, ardından yayıncıyı sürekli yeniden başlatmak yerine geçerli Gateway işlemi için Bonjour'u devre dışı bırakır.
- **Docker köprü ağı**: Bonjour, algılanan konteynerlerde otomatik olarak devre dışı bırakılır. `OPENCLAW_DISABLE_BONJOUR=0` ayarını yalnızca ana makine, macvlan veya mDNS destekli başka bir ağ için belirleyin.
- **Uyku/arayüz değişimleri**: macOS, mDNS sonuçlarını geçici olarak kaybedebilir; yeniden deneyin.
- **Tarama çalışıyor ancak çözümleme başarısız oluyor**: makine adlarını basit tutun (emoji veya noktalama işaretlerinden kaçının), ardından Gateway'i yeniden başlatın. Hizmet örneği adı, ana makine adından türetildiğinden aşırı karmaşık adlar bazı çözümleyicilerin kafasını karıştırabilir.

## Kaçış dizili örnek adları (`\032`)

Bonjour/DNS-SD, hizmet örneği adlarındaki baytları çoğunlukla ondalık `\DDD` dizileriyle kaçış dizisine dönüştürür (boşluklar `\032` olur). Bu, protokol düzeyinde normaldir; kullanıcı arayüzleri görüntüleme amacıyla kodu çözmelidir (iOS, `BonjourEscapes.decode` kullanır).

## Etkinleştirme / devre dışı bırakma / yapılandırma

| Ayar                                                | Etki                                                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `openclaw plugins enable bonjour`                    | Varsayılan olarak etkin olmadığı ana makinelerde paketle gelen LAN keşif Plugin'ini etkinleştirir.           |
| `openclaw plugins disable bonjour`                   | Paketle gelen Plugin'i devre dışı bırakarak LAN multicast duyurusunu devre dışı bırakır.                     |
| `OPENCLAW_DISABLE_BONJOUR=1` (veya `true`/`yes`/`on`)  | Plugin yapılandırmasını değiştirmeden LAN multicast duyurusunu devre dışı bırakır.                           |
| `OPENCLAW_DISABLE_BONJOUR=0` (veya `false`/`no`/`off`) | Algılanan konteynerlerin içi de dâhil olmak üzere LAN multicast duyurusunu zorunlu olarak etkinleştirir.      |
| `discovery.mdns.mode`                                | `off` \| `minimal` (varsayılan) \| `full` — yukarıdaki modlara bakın.                                        |
| `gateway.bind`                                       | `~/.openclaw/openclaw.json` içindeki Gateway bağlama modunu denetler.                                        |
| `OPENCLAW_SSH_PORT`                                  | `sshPort` duyurulduğunda SSH bağlantı noktasını geçersiz kılar (tam mod).                                    |
| `OPENCLAW_TAILNET_DNS`                               | mDNS tam modu etkinleştirildiğinde TXT içinde bir MagicDNS ipucu yayımlar.                                   |
| `OPENCLAW_CLI_PATH`                                  | Duyurulan CLI yolunu geçersiz kılar (tam mod).                                                               |

macOS ana makineleri, paketle gelen LAN keşif Plugin'ini varsayılan olarak otomatik başlatır. Bonjour Plugin'i etkinleştirildiğinde ve `OPENCLAW_DISABLE_BONJOUR` ayarlanmamış olduğunda Bonjour, normal ana makinelerde duyuru yapar ve algılanan konteynerlerin (Docker, Fly.io makineleri ve yaygın konteyner çalışma zamanları) içinde otomatik olarak devre dışı bırakılır.

## İlgili belgeler

- Keşif politikası ve aktarım seçimi: [Keşif](/tr/gateway/discovery)
- Node eşleştirme + onaylar: [Gateway eşleştirme](/tr/gateway/pairing)
