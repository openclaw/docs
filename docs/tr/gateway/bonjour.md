---
read_when:
    - macOS/iOS'te Bonjour keşif sorunlarında hata ayıklama
    - mDNS hizmet türlerini, TXT kayıtlarını veya keşif UX'ini değiştirme
summary: Bonjour/mDNS keşfi + hata ayıklama (Gateway beacon'ları, istemciler ve yaygın hata modları)
title: Bonjour keşfi
x-i18n:
    generated_at: "2026-04-26T11:28:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: b055021bdcd92740934823dea2acf758c6ec991a15c0a315426dc359a7eea093
    source_path: gateway/bonjour.md
    workflow: 15
---

# Bonjour / mDNS keşfi

OpenClaw, etkin bir Gateway'i (WebSocket uç noktası) keşfetmek için Bonjour (mDNS / DNS‑SD) kullanır.
Multicast `local.` taraması **yalnızca LAN içi bir kolaylıktır**. Paketlenmiş `bonjour`
Plugin'i LAN duyurusunun sahibidir ve varsayılan olarak etkindir. Ağlar arası keşif için,
aynı beacon yapılandırılmış bir geniş alan DNS-SD etki alanı üzerinden de yayımlanabilir.
Keşif yine de en iyi çaba düzeyindedir ve SSH veya Tailnet tabanlı bağlantının yerini **almaz**.

## Tailscale üzerinden geniş alan Bonjour (Unicast DNS-SD)

Node ile gateway farklı ağlardaysa, multicast mDNS bu
sınırı geçmez. Aynı keşif UX'ini **unicast DNS‑SD**
("Wide‑Area Bonjour") kullanarak Tailscale üzerinden koruyabilirsiniz.

Üst düzey adımlar:

1. Gateway ana makinesinde bir DNS sunucusu çalıştırın (Tailnet üzerinden erişilebilir olmalı).
2. Adanmış bir zone altında `_openclaw-gw._tcp` için DNS‑SD kayıtlarını yayımlayın
   (örnek: `openclaw.internal.`).
3. Seçtiğiniz etki alanının istemciler için (iOS dahil) bu
   DNS sunucusu üzerinden çözülmesi için Tailscale **split DNS** yapılandırın.

OpenClaw herhangi bir keşif etki alanını destekler; `openclaw.internal.` yalnızca bir örnektir.
iOS/Android Node'ları hem `local.` hem de yapılandırılmış geniş alan etki alanınızı tarar.

### Gateway yapılandırması (önerilen)

```json5
{
  gateway: { bind: "tailnet" }, // yalnızca tailnet (önerilen)
  discovery: { wideArea: { enabled: true } }, // geniş alan DNS-SD yayımlamayı etkinleştirir
}
```

### Tek seferlik DNS sunucusu kurulumu (Gateway ana makinesi)

```bash
openclaw dns setup --apply
```

Bu komut CoreDNS kurar ve şunları yapacak şekilde yapılandırır:

- yalnızca gateway'in Tailscale arayüzlerinde 53 numaralı portu dinlemek
- seçtiğiniz etki alanını (örnek: `openclaw.internal.`) `~/.openclaw/dns/<domain>.db` dosyasından sunmak

Tailnet'e bağlı bir makineden doğrulayın:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS ayarları

Tailscale yönetici konsolunda:

- Gateway'in tailnet IP'sine işaret eden bir ad sunucusu ekleyin (UDP/TCP 53).
- Keşif etki alanınızın bu ad sunucusunu kullanması için split DNS ekleyin.

İstemciler tailnet DNS'i kabul ettiğinde, iOS Node'ları ve CLI keşfi
multicast olmadan keşif etki alanınızda `_openclaw-gw._tcp` tarayabilir.

### Gateway dinleyici güvenliği (önerilen)

Gateway WS portu (varsayılan `18789`) varsayılan olarak loopback'e bağlanır. LAN/tailnet
erişimi için açıkça bind edin ve kimlik doğrulamayı etkin tutun.

Yalnızca tailnet kurulumları için:

- `~/.openclaw/openclaw.json` içinde `gateway.bind: "tailnet"` ayarlayın.
- Gateway'i yeniden başlatın (veya macOS menü çubuğu uygulamasını yeniden başlatın).

## Ne duyuru yapar

Yalnızca Gateway `_openclaw-gw._tcp` duyurusu yapar. LAN multicast duyurusu
paketlenmiş `bonjour` Plugin'i tarafından sağlanır; geniş alan DNS-SD yayımlama ise
Gateway'in sahipliğinde kalır.

## Hizmet türleri

- `_openclaw-gw._tcp` — gateway taşıma beacon'ı (macOS/iOS/Android Node'ları tarafından kullanılır).

## TXT anahtarları (gizli olmayan ipuçları)

Gateway, UI akışlarını kolaylaştırmak için küçük, gizli olmayan ipuçları duyurur:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (yalnızca TLS etkin olduğunda)
- `gatewayTlsSha256=<sha256>` (yalnızca TLS etkin olduğunda ve parmak izi mevcut olduğunda)
- `canvasPort=<port>` (yalnızca canvas host etkin olduğunda; şu anda `gatewayPort` ile aynıdır)
- `transport=gateway`
- `tailnetDns=<magicdns>` (yalnızca mDNS tam modunda; Tailnet mevcut olduğunda isteğe bağlı ipucu)
- `sshPort=<port>` (yalnızca mDNS tam modunda; geniş alan DNS-SD bunu atlayabilir)
- `cliPath=<path>` (yalnızca mDNS tam modunda; geniş alan DNS-SD bunu yine uzak kurulum ipucu olarak yazar)

Güvenlik notları:

- Bonjour/mDNS TXT kayıtları **kimliği doğrulanmamış**tır. İstemciler TXT'yi yetkili yönlendirme olarak görmemelidir.
- İstemciler, çözülmüş hizmet uç noktasını (SRV + A/AAAA) kullanarak yönlendirme yapmalıdır. `lanHost`, `tailnetDns`, `gatewayPort` ve `gatewayTlsSha256` değerlerini yalnızca ipucu olarak değerlendirin.
- SSH otomatik hedefleme de benzer şekilde yalnızca TXT ipuçlarını değil, çözülmüş hizmet ana makinesini kullanmalıdır.
- TLS pinning, duyurulan bir `gatewayTlsSha256` değerinin daha önce saklanmış bir pini geçersiz kılmasına asla izin vermemelidir.
- iOS/Android Node'ları, keşif tabanlı doğrudan bağlantıları **yalnızca TLS** olarak değerlendirmeli ve ilk kez görülen bir parmak izine güvenmeden önce açık kullanıcı onayı istemelidir.

## macOS'te hata ayıklama

Yararlı yerleşik araçlar:

- Örnekleri tara:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Bir örneği çözümle (`<instance>` yerine gerçek adı koyun):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Tarama çalışıyor ama çözümleme başarısız oluyorsa, genellikle bir LAN ilkesi veya
mDNS çözümleyici sorunuyla karşı karşıyasınızdır.

## Gateway günlüklerinde hata ayıklama

Gateway, dönen bir günlük dosyası yazar (başlangıçta
`gateway log file: ...` olarak yazdırılır). Özellikle `bonjour:` satırlarını arayın:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

## iOS Node'unda hata ayıklama

iOS Node'u, `_openclaw-gw._tcp` keşfi için `NWBrowser` kullanır.

Günlükleri almak için:

- Ayarlar → Gateway → Gelişmiş → **Discovery Debug Logs**
- Ayarlar → Gateway → Gelişmiş → **Discovery Logs** → yeniden üret → **Copy**

Günlük, tarayıcı durum geçişlerini ve sonuç kümesi değişikliklerini içerir.

## Bonjour ne zaman devre dışı bırakılmalı

Bonjour'u yalnızca LAN multicast duyurusu kullanılamadığında veya zararlı olduğunda devre dışı bırakın.
Yaygın durum, Docker bridge ağı, WSL arkasında çalışan bir Gateway veya
mDNS multicast'i düşüren bir ağ ilkesidir. Bu ortamlarda Gateway hâlâ
yayımlanan URL'si, SSH, Tailnet veya geniş alan DNS-SD üzerinden erişilebilir,
ancak LAN otomatik keşfi güvenilir değildir.

Sorun dağıtıma özgüyse mevcut ortam değişkeni geçersiz kılmasını tercih edin:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Bu, Plugin yapılandırmasını değiştirmeden LAN multicast duyurusunu devre dışı bırakır.
Bu ayar ortamla birlikte kaybolduğu için Docker imajları, hizmet dosyaları, başlatma betikleri ve tek seferlik
hata ayıklama için güvenlidir.

Yalnızca, o OpenClaw yapılandırması için
paketlenmiş LAN keşif Plugin'ini kasıtlı olarak kapatmak istiyorsanız Plugin yapılandırmasını kullanın:

```bash
openclaw plugins disable bonjour
```

## Docker ile ilgili dikkat edilmesi gerekenler

Paketlenmiş Docker Compose, varsayılan olarak Gateway hizmeti için `OPENCLAW_DISABLE_BONJOUR=1`
ayarını yapar. Docker bridge ağları genellikle mDNS multicast trafiğini
(`224.0.0.251:5353`) kapsayıcı ile LAN arasında iletmez; bu nedenle Bonjour'u açık bırakmak,
keşfi çalıştırmadan tekrarlanan ciao `probing` veya `announcing` hataları
üretebilir.

Önemli dikkat noktaları:

- Bonjour'u devre dışı bırakmak Gateway'i durdurmaz. Yalnızca LAN multicast
  duyurusunu durdurur.
- Bonjour'u devre dışı bırakmak `gateway.bind` değerini değiştirmez; Docker hâlâ
  varsayılan olarak `OPENCLAW_GATEWAY_BIND=lan` kullanır, böylece yayımlanan ana makine portu çalışabilir.
- Bonjour'u devre dışı bırakmak geniş alan DNS-SD'yi devre dışı bırakmaz. Gateway ve Node aynı LAN üzerinde değilse
  geniş alan keşfi veya Tailnet kullanın.
- Aynı `OPENCLAW_CONFIG_DIR` dizinini Docker dışında yeniden kullanmak,
  ortam hâlâ `OPENCLAW_DISABLE_BONJOUR` ayarlamadıkça Compose varsayılanını devralmaz.
- `OPENCLAW_DISABLE_BONJOUR=0` değerini yalnızca host networking, macvlan veya
  mDNS multicast'in geçtiği bilinen başka bir ağ için ayarlayın.

## Devre dışı bırakılmış Bonjour için sorun giderme

Docker kurulumu sonrasında bir Node artık Gateway'i otomatik keşfetmiyorsa:

1. Gateway'in LAN duyurusunu kasıtlı olarak bastırıp bastırmadığını doğrulayın:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Gateway'in kendisine yayımlanan port üzerinden erişilebildiğini doğrulayın:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Bonjour devre dışıyken doğrudan hedef kullanın:
   - Control UI veya yerel araçlar: `http://127.0.0.1:18789`
   - LAN istemcileri: `http://<gateway-host>:18789`
   - Ağlar arası istemciler: Tailnet MagicDNS, Tailnet IP, SSH tüneli veya
     geniş alan DNS-SD

4. Docker içinde kasıtlı olarak
   `OPENCLAW_DISABLE_BONJOUR=0` ile Bonjour'u etkinleştirdiyseniz, host üzerinden multicast'i test edin:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Tarama boşsa veya Gateway günlüklerinde tekrarlanan ciao watchdog
   iptalleri görünüyorsa, `OPENCLAW_DISABLE_BONJOUR=1` ayarını geri getirin ve doğrudan veya
   Tailnet rotası kullanın.

## Yaygın hata modları

- **Bonjour ağlar arası geçmez**: Tailnet veya SSH kullanın.
- **Multicast engellenmiş**: bazı Wi‑Fi ağları mDNS'i devre dışı bırakır.
- **Duyurucu probing/announcing durumunda takılı kalır**: multicast'i engelleyen
  host'lar, kapsayıcı bridge'leri, WSL veya arayüz dalgalanmaları ciao duyurucusunu
  duyuru yapılmamış bir durumda bırakabilir. OpenClaw birkaç kez yeniden dener ve ardından duyurucuyu sonsuza kadar yeniden başlatmak yerine
  mevcut Gateway süreci için Bonjour'u devre dışı bırakır.
- **Docker bridge ağı**: paketlenmiş Docker Compose varsayılan olarak Bonjour'u
  `OPENCLAW_DISABLE_BONJOUR=1` ile devre dışı bırakır. Bunu yalnızca host,
  macvlan veya mDNS destekli başka bir ağ için `0` yapın.
- **Uyku / arayüz dalgalanması**: macOS mDNS sonuçlarını geçici olarak düşürebilir; yeniden deneyin.
- **Tarama çalışıyor ama çözümleme başarısız**: makine adlarını basit tutun (emoji veya
  noktalama kullanmayın), sonra Gateway'i yeniden başlatın. Hizmet örneği adı host adından türetilir, bu yüzden
  aşırı karmaşık adlar bazı çözümleyicileri şaşırtabilir.

## Kaçışlı örnek adları (`\032`)

Bonjour/DNS‑SD, hizmet örneği adlarındaki baytları sıkça ondalık `\DDD`
dizileri olarak kaçışlar (ör. boşluklar `\032` olur).

- Bu, protokol düzeyinde normaldir.
- UI'lar görüntüleme için bunu çözmelidir (iOS `BonjourEscapes.decode` kullanır).

## Devre dışı bırakma / yapılandırma

- `openclaw plugins disable bonjour`, paketlenmiş Plugin'i devre dışı bırakarak LAN multicast duyurusunu devre dışı bırakır.
- `openclaw plugins enable bonjour`, varsayılan LAN keşif Plugin'ini geri yükler.
- `OPENCLAW_DISABLE_BONJOUR=1`, Plugin yapılandırmasını değiştirmeden LAN multicast duyurusunu devre dışı bırakır; kabul edilen truthy değerler `1`, `true`, `yes` ve `on` şeklindedir (eski: `OPENCLAW_DISABLE_BONJOUR`).
- Docker Compose, bridge ağı için varsayılan olarak `OPENCLAW_DISABLE_BONJOUR=1` ayarlar; yalnızca mDNS multicast mevcut olduğunda `OPENCLAW_DISABLE_BONJOUR=0` ile geçersiz kılın.
- `~/.openclaw/openclaw.json` içindeki `gateway.bind`, Gateway bind modunu denetler.
- `OPENCLAW_SSH_PORT`, `sshPort` duyurulduğunda SSH portunu geçersiz kılar (eski: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS`, mDNS tam modu etkin olduğunda TXT içinde bir MagicDNS ipucu yayımlar (eski: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH`, duyurulan CLI yolunu geçersiz kılar (eski: `OPENCLAW_CLI_PATH`).

## İlgili belgeler

- Keşif ilkesi ve taşıma seçimi: [Keşif](/tr/gateway/discovery)
- Node eşleştirme + onaylar: [Gateway eşleştirmesi](/tr/gateway/pairing)
