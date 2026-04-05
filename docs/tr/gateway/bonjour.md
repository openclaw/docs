---
read_when:
    - macOS/iOS üzerinde Bonjour keşif sorunlarını hata ayıklama
    - mDNS hizmet türlerini, TXT kayıtlarını veya keşif UX’ini değiştirme
summary: Bonjour/mDNS keşfi + hata ayıklama (Gateway beacon’ları, istemciler ve yaygın hata modları)
title: Bonjour Keşfi
x-i18n:
    generated_at: "2026-04-05T13:52:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f5a7f3211c74d4d10fdc570fc102b3c949c0ded9409c54995ab8820e5787f02
    source_path: gateway/bonjour.md
    workflow: 15
---

# Bonjour / mDNS keşfi

OpenClaw, etkin bir Gateway’i (WebSocket uç noktası) keşfetmek için Bonjour (mDNS / DNS‑SD) kullanır.
Multicast `local.` taraması yalnızca **LAN için bir kolaylıktır**. Ağlar arası keşif için aynı beacon,
yapılandırılmış bir geniş alan DNS-SD etki alanı üzerinden de yayınlanabilir. Keşif yine de
best-effort olarak çalışır ve SSH veya Tailnet tabanlı bağlantının **yerini almaz**.

## Tailscale üzerinden geniş alan Bonjour (Unicast DNS-SD)

Düğüm ile gateway farklı ağlardaysa, multicast mDNS bu
sınırı geçmez. Aynı keşif UX’ini, Tailscale üzerinden **unicast DNS‑SD**
("Wide‑Area Bonjour") kullanarak sürdürebilirsiniz.

Üst düzey adımlar:

1. Gateway ana bilgisayarında bir DNS sunucusu çalıştırın (Tailnet üzerinden erişilebilir olmalı).
2. Ayrılmış bir bölge altında `_openclaw-gw._tcp` için DNS‑SD kayıtlarını yayınlayın
   (örnek: `openclaw.internal.`).
3. Seçtiğiniz etki alanının istemcilerde (iOS dahil) bu
   DNS sunucusu üzerinden çözülmesi için Tailscale **split DNS** yapılandırın.

OpenClaw her türlü keşif etki alanını destekler; `openclaw.internal.` yalnızca bir örnektir.
iOS/Android düğümleri hem `local.` hem de yapılandırılmış geniş alan etki alanınızı tarar.

### Gateway yapılandırması (önerilir)

```json5
{
  gateway: { bind: "tailnet" }, // yalnızca tailnet (önerilir)
  discovery: { wideArea: { enabled: true } }, // geniş alan DNS-SD yayınını etkinleştirir
}
```

### Tek seferlik DNS sunucusu kurulumu (gateway ana bilgisayarı)

```bash
openclaw dns setup --apply
```

Bu, CoreDNS’i kurar ve şunları yapacak şekilde yapılandırır:

- yalnızca gateway’in Tailscale arayüzlerinde 53 portunu dinlemek
- seçtiğiniz etki alanını (örnek: `openclaw.internal.`), `~/.openclaw/dns/<domain>.db` üzerinden sunmak

Tailnet’e bağlı bir makineden doğrulayın:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS ayarları

Tailscale yönetici konsolunda:

- Gateway’in tailnet IP’sine işaret eden bir nameserver ekleyin (UDP/TCP 53).
- Keşif etki alanınızın bu nameserver’ı kullanması için split DNS ekleyin.

İstemciler tailnet DNS’yi kabul ettikten sonra, iOS düğümleri ve CLI keşfi
multicast olmadan keşif etki alanınızda `_openclaw-gw._tcp` tarayabilir.

### Gateway dinleyici güvenliği (önerilir)

Gateway WS portu (varsayılan `18789`) varsayılan olarak loopback’e bağlanır. LAN/tailnet
erişimi için açıkça bağlayın ve kimlik doğrulamayı etkin tutun.

Yalnızca tailnet kurulumları için:

- `~/.openclaw/openclaw.json` içinde `gateway.bind: "tailnet"` ayarlayın.
- Gateway’i yeniden başlatın (veya macOS menü çubuğu uygulamasını yeniden başlatın).

## Neler yayınlanır

Yalnızca Gateway, `_openclaw-gw._tcp` yayını yapar.

## Hizmet türleri

- `_openclaw-gw._tcp` — gateway taşıma beacon’ı (macOS/iOS/Android düğümleri tarafından kullanılır).

## TXT anahtarları (gizli olmayan ipuçları)

Gateway, UI akışlarını kolaylaştırmak için küçük gizli olmayan ipuçları yayınlar:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (yalnızca TLS etkin olduğunda)
- `gatewayTlsSha256=<sha256>` (yalnızca TLS etkinse ve parmak izi mevcutsa)
- `canvasPort=<port>` (yalnızca canvas host etkin olduğunda; şu anda `gatewayPort` ile aynı)
- `transport=gateway`
- `tailnetDns=<magicdns>` (Tailnet mevcut olduğunda isteğe bağlı ipucu)
- `sshPort=<port>` (yalnızca mDNS full modunda; geniş alan DNS-SD bunu atlayabilir)
- `cliPath=<path>` (yalnızca mDNS full modunda; geniş alan DNS-SD bunu yine de uzak kurulum ipucu olarak yazar)

Güvenlik notları:

- Bonjour/mDNS TXT kayıtları **kimliği doğrulanmamış** kayıtlardır. İstemciler TXT’yi yetkili yönlendirme olarak değerlendirmemelidir.
- İstemciler, çözümlenen hizmet uç noktasını (SRV + A/AAAA) kullanarak yönlendirme yapmalıdır. `lanHost`, `tailnetDns`, `gatewayPort` ve `gatewayTlsSha256` değerlerini yalnızca ipucu olarak değerlendirin.
- SSH otomatik hedefleme de aynı şekilde yalnızca TXT ipuçlarını değil, çözümlenen hizmet ana bilgisayarını kullanmalıdır.
- TLS sabitlemesi, yayınlanan bir `gatewayTlsSha256` değerinin daha önce depolanmış bir sabitlemeyi geçersiz kılmasına asla izin vermemelidir.
- iOS/Android düğümleri, keşif tabanlı doğrudan bağlantıları **yalnızca TLS** olarak değerlendirmeli ve ilk kez görülen bir parmak izine güvenmeden önce açık kullanıcı onayı istemelidir.

## macOS üzerinde hata ayıklama

Yararlı yerleşik araçlar:

- Örnekleri tara:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Bir örneği çözümle (`<instance>` yerine kendi değerinizi yazın):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Tarama çalışıyor ama çözümleme başarısız oluyorsa, genellikle bir LAN ilkesi veya
mDNS çözümleyici sorunu yaşıyorsunuzdur.

## Gateway günlüklerinde hata ayıklama

Gateway, dönen bir günlük dosyası yazar (başlangıçta
`gateway log file: ...` olarak yazdırılır). Özellikle şu `bonjour:` satırlarını arayın:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## iOS düğümünde hata ayıklama

iOS düğümü, `_openclaw-gw._tcp` keşfi için `NWBrowser` kullanır.

Günlükleri yakalamak için:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → yeniden üretin → **Copy**

Günlük; tarayıcı durum geçişlerini ve sonuç kümesi değişikliklerini içerir.

## Yaygın hata modları

- **Bonjour ağlar arasında çalışmaz**: Tailnet veya SSH kullanın.
- **Multicast engellenmiş**: bazı Wi‑Fi ağları mDNS’yi devre dışı bırakır.
- **Uyku / arayüz değişimi**: macOS mDNS sonuçlarını geçici olarak düşürebilir; yeniden deneyin.
- **Tarama çalışıyor ama çözümleme başarısız**: makine adlarını basit tutun (emoji veya
  noktalama işaretlerinden kaçının), ardından Gateway’i yeniden başlatın. Hizmet örneği adı
  ana bilgisayar adından türetildiği için, aşırı karmaşık adlar bazı çözümleyicilerin kafasını karıştırabilir.

## Escape edilmiş örnek adları (`\032`)

Bonjour/DNS‑SD, hizmet örneği adlarındaki baytları genellikle ondalık `\DDD`
dizileri olarak escape eder (örneğin boşluklar `\032` olur).

- Bu, protokol düzeyinde normaldir.
- UI’ler görüntüleme için bunu çözmelidir (iOS `BonjourEscapes.decode` kullanır).

## Devre dışı bırakma / yapılandırma

- `OPENCLAW_DISABLE_BONJOUR=1`, yayını devre dışı bırakır (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `~/.openclaw/openclaw.json` içindeki `gateway.bind`, Gateway bağlama modunu denetler.
- `OPENCLAW_SSH_PORT`, `sshPort` yayınlandığında SSH portunu geçersiz kılar (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS`, TXT içinde bir MagicDNS ipucu yayınlar (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH`, yayınlanan CLI yolunu geçersiz kılar (legacy: `OPENCLAW_CLI_PATH`).

## İlgili belgeler

- Keşif ilkesi ve taşıma seçimi: [Discovery](/gateway/discovery)
- Düğüm eşleştirme + onaylar: [Gateway pairing](/gateway/pairing)
