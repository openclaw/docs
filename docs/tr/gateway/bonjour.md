---
read_when:
    - macOS/iOS'ta Bonjour keşif sorunlarını ayıklama
    - mDNS hizmet türlerini, TXT kayıtlarını veya keşif kullanıcı deneyimini değiştirme
summary: Bonjour/mDNS keşfi + hata ayıklama (Gateway işaretçileri, istemciler ve yaygın hata modları)
title: Bonjour keşfi
x-i18n:
    generated_at: "2026-07-16T16:57:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 42a46dc34e94dc86ee0432b12fcb59b3855371c745d79825a00aa557e1369160
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw, etkin bir gateway'i (WebSocket uç noktası) keşfetmek için Bonjour (mDNS/DNS-SD) kullanabilir. Çok noktaya yayın `local.` taraması **yalnızca LAN'a yönelik bir kolaylıktır**: paketle gelen `bonjour` plugin'i LAN duyurularını yönetir; macOS ana makinelerinde otomatik olarak başlar, Linux, Windows ve konteynerleştirilmiş gateway dağıtımlarında ise isteğe bağlıdır. Aynı işaretçi, ağlar arası keşif için yapılandırılmış bir geniş alan DNS-SD etki alanı üzerinden de yayımlanabilir. Keşif en iyi çaba esasına dayanır ve SSH ya da Tailnet tabanlı bağlantının yerini **almaz**.

## Tailscale üzerinden geniş alan Bonjour (Tek Noktaya Yayın DNS-SD)

Node ile gateway farklı ağlardaysa çok noktaya yayın mDNS bu sınırı aşamaz. Tailscale üzerinden **tek noktaya yayın DNS-SD**'ye ("Wide-Area Bonjour") geçerek aynı keşif kullanıcı deneyimini koruyun:

1. Gateway ana makinesinde Tailnet üzerinden erişilebilen bir DNS sunucusu çalıştırın.
2. Özel bir bölge altında `_openclaw-gw._tcp` için DNS-SD kayıtları yayımlayın (örnek: `openclaw.internal.`).
3. iOS dahil istemcilerde seçtiğiniz etki alanının bu DNS sunucusu üzerinden çözümlenmesi için Tailscale **split DNS** yapılandırmasını yapın.

Yukarıdaki `openclaw.internal.` yalnızca bir örnektir — OpenClaw herhangi bir keşif etki alanını destekler. iOS/Android node'ları hem `local.` hem de yapılandırdığınız geniş alan etki alanını tarar.

### Gateway yapılandırması

```json5
{
  gateway: { bind: "tailnet" }, // yalnızca tailnet (önerilir)
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

`discovery.wideArea.domain`, ayarlanmamışsa yedek olarak `OPENCLAW_WIDE_AREA_DOMAIN` ortam değişkenini de kabul eder.

### Tek seferlik DNS sunucusu kurulumu (gateway ana makinesi, yalnızca macOS)

```bash
openclaw dns setup --apply
```

Bu komut yalnızca macOS içindir ve Homebrew ile çalışan bir Tailscale bağlantısı gerektirir. CoreDNS'i (`brew install coredns`) kurar ve şunları yapacak şekilde yapılandırır:

- yalnızca gateway'in Tailscale arayüzlerinde 53 numaralı bağlantı noktasını dinler
- seçtiğiniz etki alanını (örnek: `openclaw.internal.`) `~/.openclaw/dns/<domain>.db` üzerinden sunar

Hiçbir şey kurmadan planın (etki alanı, bölge dosyası yolu, algılanan Tailnet IP'si, önerilen yapılandırma) önizlemesini görmek için önce `--apply` olmadan çalıştırın.

Tailnet'e bağlı bir makineden doğrulayın:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS ayarları

Tailscale yönetici konsolunda:

- Gateway'in Tailnet IP'sini gösteren bir ad sunucusu ekleyin (UDP/TCP 53).
- Keşif etki alanınızın bu ad sunucusunu kullanması için split DNS ekleyin.

İstemciler Tailnet DNS'i kabul ettikten sonra iOS node'ları ve CLI keşfi, çok noktaya yayın olmadan keşif etki alanınızdaki `_openclaw-gw._tcp` hizmetini tarayabilir.

### Gateway dinleyicisi güvenliği

Gateway WS bağlantı noktası (varsayılan `18789`) varsayılan olarak geri döngü arayüzüne bağlanır. LAN/Tailnet erişimi için bağlantıyı açıkça yapılandırın ve kimlik doğrulamayı etkin tutun. Yalnızca Tailnet kullanılan kurulumlarda `~/.openclaw/openclaw.json` içinde `gateway.bind: "tailnet"` değerini ayarlayın ve gateway'i (veya macOS menü çubuğu uygulamasını) yeniden başlatın.

## Neler duyurulur

Yalnızca gateway `_openclaw-gw._tcp` duyurusu yapar. LAN çok noktaya yayın duyurusu, etkinleştirildiğinde paketle gelen `bonjour` plugin'inden gelir; geniş alan DNS-SD yayını gateway'in sorumluluğunda kalır.

## Hizmet türleri

- `_openclaw-gw._tcp` - macOS/iOS/Android node'larının kullandığı gateway taşıma işaretçisi.

## TXT anahtarları (gizli olmayan ipuçları)

| Anahtar                       | Mevcut olduğu durum                                                            |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | Her zaman.                                                                     |
| `displayName=<friendly name>` | Her zaman.                                                                     |
| `lanHost=<hostname>.local`    | Her zaman.                                                                     |
| `gatewayPort=<port>`          | Her zaman (gateway WS + HTTP).                                                  |
| `transport=gateway`           | Her zaman.                                                                     |
| `gatewayTls=1`                | Yalnızca TLS etkin olduğunda.                                                   |
| `gatewayTlsSha256=<sha256>`   | Yalnızca TLS etkin olduğunda ve bir parmak izi mevcut olduğunda.                |
| `gatewayDirectReachable=1`    | Yalnızca gateway'e doğrudan erişilebildiğinde (yalnızca aktarıcı/proxy yolu üzerinden değil). |
| `canvasPort=<port>`           | Yalnızca canvas ana makinesi etkin olduğunda; şu anda `gatewayPort` ile aynıdır. |
| `tailnetDns=<magicdns>`       | Yalnızca mDNS tam modu; Tailnet mevcut olduğunda isteğe bağlı ipucu.            |
| `sshPort=<port>`              | Yalnızca tam mod; minimal ve kapalı modlarda dahil edilmez.                     |
| `cliPath=<path>`              | Yalnızca tam mod; minimal ve kapalı modlarda dahil edilmez.                     |

Güvenlik notları:

- Bonjour/mDNS TXT kayıtlarının **kimliği doğrulanmaz**. İstemciler TXT'yi yetkili yönlendirme bilgisi olarak değerlendirmemelidir.
- İstemciler, çözümlenen hizmet uç noktasını (SRV + A/AAAA) kullanarak yönlendirme yapmalıdır. `lanHost`, `tailnetDns`, `gatewayPort` ve `gatewayTlsSha256` değerlerini yalnızca ipucu olarak değerlendirin.
- SSH otomatik hedeflemesi de yalnızca TXT ipuçlarını değil, çözümlenen hizmet ana makinesini kullanmalıdır.
- TLS sabitleme, duyurulan bir `gatewayTlsSha256` değerinin daha önce depolanmış bir sabitlemeyi geçersiz kılmasına asla izin vermemelidir.
- iOS/Android node'ları keşif tabanlı doğrudan bağlantıları **yalnızca TLS** olarak değerlendirmeli ve ilk kez karşılaşılan bir parmak izine güvenmeden önce açık kullanıcı onayı istemelidir.

## macOS'ta hata ayıklama

Yerleşik araçlar:

```bash
# Örnekleri tara
dns-sd -B _openclaw-gw._tcp local.

# Bir örneği çözümle (<instance> değerini değiştirin)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

Tarama çalışıyor ancak çözümleme başarısız oluyorsa genellikle bir LAN politikası veya mDNS çözümleyicisi sorunuyla karşılaşıyorsunuzdur.

## Gateway günlüklerinde hata ayıklama

Gateway, sürekli yenilenen bir günlük dosyasına yazar (başlangıçta `gateway log file: ...` olarak yazdırılır). Özellikle aşağıdakiler olmak üzere `bonjour:` satırlarını arayın:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao netmask assertion ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`

OpenClaw her Bonjour hizmetini bir kez başlatır; yoklama, yeniden deneme, ad çakışması çözümleme ve arayüz değişikliklerinde yeniden yayımlama işlemlerini mDNS yanıtlayıcısına bırakır. Bu, olağan ağ dalgalanmaları sırasında çakışan yayınlama girişimlerini önler. Yinelenen dahili kendi kendine yoklama iletileri, gateway günlüğünü doldurmamaları için bastırılır.

Aynı ana makineden birden fazla OpenClaw gateway'i duyuru yaptığında Bonjour, hizmet örneği adlarını benzersiz tutmak için `(2)` veya `(3)` gibi son ekler ekleyebilir. Bu son ekler normal çakışma çözümlemesidir ve yinelenen OCM gözetimine işaret etmez.

Bonjour, geçerli bir DNS etiketi olduğunda duyurulan `.local` ana makinesi için sistem ana makine adını kullanır. Sistem ana makine adı boşluk, alt çizgi veya DNS etiketinde geçersiz başka bir karakter içeriyorsa OpenClaw `openclaw.local` değerine geri döner. Açık bir ana makine etiketi gerektiğinde gateway'i başlatmadan önce `OPENCLAW_MDNS_HOSTNAME=<name>` değerini ayarlayın.

## iOS node'unda hata ayıklama

iOS node'u `_openclaw-gw._tcp` hizmetini keşfetmek için `NWBrowser` kullanır.

Günlükleri yakalamak için: Settings -> Gateway -> Advanced -> **Discovery Debug Logs**, ardından Settings -> Gateway -> Advanced -> **Discovery Logs** -> yeniden oluşturun -> **Copy**. Günlük, tarayıcı durumu geçişlerini ve sonuç kümesi değişikliklerini içerir.

## Bonjour ne zaman etkinleştirilmeli

Yerel uygulama ile yakındaki iOS/Android node'ları genellikle aynı LAN üzerindeki keşfe dayandığından, Bonjour macOS ana makinelerinde boş yapılandırmayla gateway başlatıldığında otomatik olarak başlar.

Linux, Windows veya macOS dışındaki başka bir ana makinede aynı LAN üzerinde otomatik keşif yararlı olduğunda bunu açıkça etkinleştirin:

```bash
openclaw plugins enable bonjour
```

Bonjour etkinleştirildiğinde ne kadar TXT meta verisi yayımlanacağını belirlemek için `discovery.mdns.mode` kullanır; aynı mod, geniş alan DNS-SD kayıtlarındaki isteğe bağlı TXT ipuçlarını da denetler. Modlar:

| Mod                 | Davranış                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` (varsayılan) | Yalnızca temel TXT anahtarları; `sshPort`, `cliPath`, `tailnetDns` dahil edilmez.                                                                                                 |
| `full`              | `sshPort`, `cliPath`, `tailnetDns` ekler — istemcilerin bu ipuçlarına ihtiyacı olduğunda kullanın.                                                                                  |
| `off`               | Plugin etkinliğini değiştirmeden LAN çok noktaya yayınını engeller; `discovery.wideArea.enabled` true olduğunda geniş alan DNS-SD yine de minimal işaretçiyi yayımlayabilir. |

## Bonjour ne zaman devre dışı bırakılmalı

LAN çok noktaya yayın duyurusu gereksiz, kullanılamaz veya zararlı olduğunda Bonjour'u devre dışı bırakın — yaygın örnekler macOS dışı sunucular, Docker köprü ağı, WSL veya mDNS çok noktaya yayınını düşüren bir ağ politikasıdır. Gateway yayımlanan URL'si, SSH, Tailnet veya geniş alan DNS-SD üzerinden erişilebilir kalır; yalnızca LAN otomatik keşfi güvenilmez olur.

Dağıtım kapsamındaki sorunlar için ortam geçersiz kılmasını kullanın (Docker imajları, hizmet dosyaları, başlatma betikleri ve tek seferlik hata ayıklama için güvenlidir — ortam ortadan kalktığında bu ayar da kaybolur):

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Bu OpenClaw yapılandırmasında paketle gelen LAN keşif plugin'ini kasıtlı olarak kapatmak istediğinizde plugin yapılandırmasını kullanın:

```bash
openclaw plugins disable bonjour
```

## Docker ile ilgili dikkat edilmesi gerekenler

Paketle gelen Bonjour plugin'i, `OPENCLAW_DISABLE_BONJOUR` ayarlanmamışsa algılanan konteynerlerde LAN çok noktaya yayın duyurusunu otomatik olarak devre dışı bırakır. Docker köprü ağları genellikle konteyner ile LAN arasında mDNS çok noktaya yayınını (`224.0.0.251:5353`) iletmez; bu nedenle konteynerden duyuru yapmak keşfin çalışmasını nadiren sağlar.

Dikkat edilmesi gerekenler:

- Bonjour, macOS ana makinelerinde otomatik olarak başlar ve diğer ortamlarda isteğe bağlıdır. Devre dışı bırakılması gateway'i durdurmaz — yalnızca LAN çok noktaya yayın duyurusunu atlar.
- Bonjour'u devre dışı bırakmak `gateway.bind` değerini değiştirmez; yayımlanan ana makine bağlantı noktasının çalışması için Docker varsayılan olarak `OPENCLAW_GATEWAY_BIND=lan` değerini kullanmaya devam eder.
- Bonjour'u devre dışı bırakmak geniş alan DNS-SD'yi devre dışı bırakmaz. Gateway ile node aynı LAN üzerinde olmadığında geniş alan keşfini veya Tailnet'i kullanın.
- Aynı `OPENCLAW_CONFIG_DIR` değerini Docker dışında yeniden kullanmak, konteynerin otomatik devre dışı bırakma politikasını kalıcı hâle getirmez.
- Yalnızca ana makine ağı, macvlan veya mDNS çok noktaya yayınının geçtiği bilinen başka bir ağ için `OPENCLAW_DISABLE_BONJOUR=0` değerini ayarlayın; zorla devre dışı bırakmak için `1` olarak ayarlayın.

## Devre dışı Bonjour sorunlarını giderme

Docker kurulumundan sonra bir node gateway'i artık otomatik olarak keşfetmiyorsa:

1. Gateway'in otomatik, zorla açık veya zorla kapalı modda çalışıp çalışmadığını doğrulayın:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Gateway'in yayımlanan bağlantı noktası üzerinden erişilebilir olduğunu doğrulayın:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Bonjour devre dışı olduğunda doğrudan hedef kullanın:
   - Control UI veya yerel araçlar: `http://127.0.0.1:18789`
   - LAN istemcileri: `http://<gateway-host>:18789`
   - Ağlar arası istemciler: Tailnet MagicDNS, Tailnet IP'si, SSH tüneli veya geniş alan DNS-SD

4. Docker'da Bonjour plugin'ini bilinçli olarak etkinleştirdiyseniz ve `OPENCLAW_DISABLE_BONJOUR=0` ile duyuruyu zorladıysanız ana makineden çok noktaya yayını test edin:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Tarama sonucu boşsa veya Gateway günlükleri yinelenen ciao yoklama hataları gösteriyorsa `OPENCLAW_DISABLE_BONJOUR=1` değerini geri yükleyin ve doğrudan ya da Tailnet rotası kullanın.

## Yaygın hata modları

- **Bonjour ağlar arasında çalışmaz**: Tailnet veya SSH kullanın.
- **Çok noktaya yayın engellendi**: bazı Wi-Fi ağları mDNS'yi devre dışı bırakır.
- **Duyurucu yoklama/duyuru aşamasında takıldı**: çok noktaya yayının engellendiği ana makineler, kapsayıcı köprüleri, WSL veya arayüz değişimleri, yanıtlayıcıyı duyurulmamış durumda bırakabilir. Gateway; doğrudan, SSH, Tailnet veya geniş alan DNS-SD yolları üzerinden erişilebilir durumda kalır; çok noktaya yayın kullanılamadığında LAN Bonjour'u `discovery.mdns.mode: "off"` veya `OPENCLAW_DISABLE_BONJOUR=1` ile devre dışı bırakın.
- **Docker köprü ağı**: Bonjour, algılanan kapsayıcılarda otomatik olarak devre dışı bırakılır. `OPENCLAW_DISABLE_BONJOUR=0` değerini yalnızca ana makine, macvlan veya mDNS özellikli başka bir ağ için ayarlayın.
- **Uyku/arayüz değişimi**: macOS, mDNS sonuçlarını geçici olarak kaybedebilir; yeniden deneyin.
- **Göz atma çalışıyor ancak çözümleme başarısız oluyor**: makine adlarını basit tutun (emoji veya noktalama işaretlerinden kaçının), ardından Gateway'i yeniden başlatın. Hizmet örneği adı ana makine adından türetildiği için aşırı karmaşık adlar bazı çözümleyicilerin kafasını karıştırabilir.

## Kaçış dizisi uygulanmış örnek adları (`\032`)

Bonjour/DNS-SD, hizmet örneği adlarındaki baytları çoğunlukla ondalık `\DDD` dizileri olarak kaçış dizisine dönüştürür (boşluklar `\032` olur). Bu, protokol düzeyinde normaldir; kullanıcı arayüzleri görüntüleme için bunları çözmelidir (iOS, `BonjourEscapes.decode` kullanır).

## Etkinleştirme / devre dışı bırakma / yapılandırma

| Ayar                                                | Etki                                                                              |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | Varsayılan olarak etkinleştirilmediği ana makinelerde paketle gelen LAN keşif Plugin'ini etkinleştirir. |
| `openclaw plugins disable bonjour`                   | Paketle gelen Plugin'i devre dışı bırakarak LAN çok noktaya yayın duyurularını devre dışı bırakır. |
| `OPENCLAW_DISABLE_BONJOUR=1` (veya `true`/`yes`/`on`)  | Plugin yapılandırmasını değiştirmeden LAN çok noktaya yayın duyurularını devre dışı bırakır. |
| `OPENCLAW_DISABLE_BONJOUR=0` (veya `false`/`no`/`off`) | Algılanan kapsayıcıların içi de dâhil olmak üzere LAN çok noktaya yayın duyurularını zorla etkinleştirir. |
| `discovery.mdns.mode`                                | `off` \| `minimal` (varsayılan) \| `full` — yukarıdaki modlara bakın. |
| `gateway.bind`                                       | `~/.openclaw/openclaw.json` içindeki Gateway bağlama modunu denetler. |
| `OPENCLAW_SSH_PORT`                                  | `sshPort` duyurulduğunda SSH bağlantı noktasını geçersiz kılar (tam mod). |
| `OPENCLAW_TAILNET_DNS`                               | mDNS tam modu etkinleştirildiğinde TXT içinde bir MagicDNS ipucu yayımlar. |
| `OPENCLAW_CLI_PATH`                                  | Duyurulan CLI yolunu geçersiz kılar (tam mod). |

macOS ana makineleri, paketle gelen LAN keşif Plugin'ini varsayılan olarak otomatik başlatır. Bonjour Plugin'i etkinleştirildiğinde ve `OPENCLAW_DISABLE_BONJOUR` ayarlanmadığında Bonjour, normal ana makinelerde duyuru yapar ve algılanan kapsayıcıların (Docker, Fly.io makineleri ve yaygın kapsayıcı çalışma zamanları) içinde otomatik olarak devre dışı kalır.

## İlgili belgeler

- Keşif politikası ve aktarım seçimi: [Keşif](/tr/gateway/discovery)
- Node eşleştirme + onaylar: [Gateway eşleştirme](/tr/gateway/pairing)
