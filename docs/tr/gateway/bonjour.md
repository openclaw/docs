---
read_when:
    - macOS/iOS üzerinde Bonjour keşif sorunlarında hata ayıklama
    - mDNS hizmet türlerini, TXT kayıtlarını veya keşif UX'ini değiştirme
summary: Bonjour/mDNS keşfi + hata ayıklama (Gateway işaretçileri, istemciler ve yaygın hata modları)
title: Bonjour keşfi
x-i18n:
    generated_at: "2026-04-24T09:07:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62961714a0c9880be457c254e1cfc1701020ea51b89f2582757cddc8b3dd2113
    source_path: gateway/bonjour.md
    workflow: 15
---

# Bonjour / mDNS keşfi

OpenClaw, etkin bir Gateway'i (WebSocket uç noktası) keşfetmek için Bonjour (mDNS / DNS-SD) kullanır.
Çok noktaya yayın `local.` taraması yalnızca **LAN içi bir kolaylıktır**. Paketlenmiş `bonjour`
Plugin'i LAN duyurusunu yönetir ve varsayılan olarak etkindir. Ağlar arası keşif için,
aynı işaretçi yapılandırılmış geniş alan DNS-SD etki alanı üzerinden de yayınlanabilir.
Keşif yine de en iyi çaba esaslıdır ve SSH veya Tailnet tabanlı bağlantının yerine **geçmez**.

## Tailscale üzerinden geniş alan Bonjour (Unicast DNS-SD)

Node ile Gateway farklı ağlardaysa, çok noktaya yayın mDNS bu
sınırı aşmaz. Aynı keşif UX'ini **unicast DNS-SD**
("Geniş Alan Bonjour") ile Tailscale üzerinden koruyabilirsiniz.

Üst düzey adımlar:

1. Gateway ana makinesinde bir DNS sunucusu çalıştırın (Tailnet üzerinden erişilebilir).
2. Ayrılmış bir bölge altında `_openclaw-gw._tcp` için DNS-SD kayıtları yayınlayın
   (örnek: `openclaw.internal.`).
3. Seçtiğiniz etki alanının bu
   DNS sunucusu üzerinden çözülmesi için Tailscale **split DNS** yapılandırın (iOS dahil istemciler için).

OpenClaw herhangi bir keşif etki alanını destekler; `openclaw.internal.` yalnızca bir örnektir.
iOS/Android Node'ları hem `local.` hem de yapılandırılmış geniş alan etki alanınızı tarar.

### Gateway yapılandırması (önerilen)

```json5
{
  gateway: { bind: "tailnet" }, // yalnızca tailnet (önerilen)
  discovery: { wideArea: { enabled: true } }, // geniş alan DNS-SD yayınını etkinleştirir
}
```

### Tek seferlik DNS sunucusu kurulumu (Gateway ana makinesi)

```bash
openclaw dns setup --apply
```

Bu, CoreDNS'i kurar ve şu şekilde yapılandırır:

- yalnızca Gateway'in Tailscale arayüzlerinde 53 numaralı bağlantı noktasında dinler
- seçtiğiniz etki alanını (örnek: `openclaw.internal.`) `~/.openclaw/dns/<domain>.db` üzerinden sunar

Tailnet'e bağlı bir makineden doğrulayın:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS ayarları

Tailscale yönetici konsolunda:

- Gateway'in tailnet IP'sini işaret eden bir ad sunucusu ekleyin (UDP/TCP 53).
- Keşif etki alanınızın o ad sunucusunu kullanması için split DNS ekleyin.

İstemciler tailnet DNS'yi kabul ettikten sonra, iOS Node'ları ve CLI keşfi
çok noktaya yayın olmadan keşif etki alanınızda `_openclaw-gw._tcp` tarayabilir.

### Gateway dinleyici güvenliği (önerilen)

Gateway WS bağlantı noktası (varsayılan `18789`) varsayılan olarak loopback'e bağlanır. LAN/tailnet
erişimi için açıkça bağlayın ve kimlik doğrulamayı etkin tutun.

Yalnızca tailnet kurulumları için:

- `~/.openclaw/openclaw.json` içinde `gateway.bind: "tailnet"` ayarlayın.
- Gateway'i yeniden başlatın (veya macOS menü çubuğu uygulamasını yeniden başlatın).

## Ne duyurulur

Yalnızca Gateway `_openclaw-gw._tcp` duyurur. LAN çok noktaya yayın duyurusu
paketlenmiş `bonjour` Plugin'i tarafından sağlanır; geniş alan DNS-SD yayını ise
Gateway tarafından yönetilmeye devam eder.

## Hizmet türleri

- `_openclaw-gw._tcp` — Gateway taşıma işaretçisi (macOS/iOS/Android Node'ları tarafından kullanılır).

## TXT anahtarları (gizli olmayan ipuçları)

Gateway, UI akışlarını kolaylaştırmak için küçük ve gizli olmayan ipuçları duyurur:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (yalnızca TLS etkinse)
- `gatewayTlsSha256=<sha256>` (yalnızca TLS etkinse ve parmak izi kullanılabiliyorsa)
- `canvasPort=<port>` (yalnızca canvas ana makinesi etkinse; şu anda `gatewayPort` ile aynıdır)
- `transport=gateway`
- `tailnetDns=<magicdns>` (yalnızca mDNS tam modunda, Tailnet mevcutsa isteğe bağlı ipucu)
- `sshPort=<port>` (yalnızca mDNS tam modunda; geniş alan DNS-SD bunu atlayabilir)
- `cliPath=<path>` (yalnızca mDNS tam modunda; geniş alan DNS-SD bunu yine uzak kurulum ipucu olarak yazar)

Güvenlik notları:

- Bonjour/mDNS TXT kayıtları **kimliği doğrulanmamıştır**. İstemciler TXT'yi yetkili yönlendirme olarak görmemelidir.
- İstemciler, çözümlenen hizmet uç noktasını (SRV + A/AAAA) kullanarak yönlendirme yapmalıdır. `lanHost`, `tailnetDns`, `gatewayPort` ve `gatewayTlsSha256` değerlerini yalnızca ipucu olarak değerlendirin.
- SSH otomatik hedefleme de yalnızca TXT ipuçlarıyla değil, çözümlenen hizmet ana makinesiyle yapılmalıdır.
- TLS pinning, duyurulan `gatewayTlsSha256` değerinin daha önce depolanmış pini geçersiz kılmasına asla izin vermemelidir.
- iOS/Android Node'ları, keşif tabanlı doğrudan bağlantıları **yalnızca TLS** olarak değerlendirmeli ve ilk kez görülen bir parmak izine güvenmeden önce açık kullanıcı onayı istemelidir.

## macOS'ta hata ayıklama

Yararlı yerleşik araçlar:

- Örnekleri tara:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Bir örneği çözümle (`<instance>` yerine koyun):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Tarama çalışıyor ama çözümleme başarısız oluyorsa, genellikle bir LAN politikası veya
mDNS çözümleyici sorunuyla karşılaşıyorsunuzdur.

## Gateway günlüklerinde hata ayıklama

Gateway dönen bir günlük dosyası yazar (başlangıçta
`gateway log file: ...` olarak yazdırılır). Özellikle `bonjour:` satırlarını arayın:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## iOS Node'unda hata ayıklama

iOS Node'u, `_openclaw-gw._tcp` keşfi için `NWBrowser` kullanır.

Günlükleri yakalamak için:

- Ayarlar → Gateway → Gelişmiş → **Discovery Debug Logs**
- Ayarlar → Gateway → Gelişmiş → **Discovery Logs** → yeniden üret → **Copy**

Günlük, tarayıcı durum geçişlerini ve sonuç kümesi değişikliklerini içerir.

## Yaygın hata modları

- **Bonjour ağları aşmaz**: Tailnet veya SSH kullanın.
- **Çok noktaya yayın engellenmiş**: bazı Wi‑Fi ağları mDNS'i devre dışı bırakır.
- **Uyku / arayüz dalgalanması**: macOS mDNS sonuçlarını geçici olarak düşürebilir; yeniden deneyin.
- **Tarama çalışıyor ama çözümleme başarısız**: makine adlarını basit tutun (emoji veya
  noktalama işaretlerinden kaçının), ardından Gateway'i yeniden başlatın. Hizmet örneği adı
  ana makine adından türetilir; bu yüzden aşırı karmaşık adlar bazı çözümleyicileri şaşırtabilir.

## Kaçışlı örnek adları (`\032`)

Bonjour/DNS-SD, hizmet örneği adlarındaki baytları genellikle ondalık `\DDD`
dizileri olarak kaçışlar (ör. boşluklar `\032` olur).

- Bu, protokol düzeyinde normaldir.
- UI'ler görüntüleme için bunları çözmelidir (iOS `BonjourEscapes.decode` kullanır).

## Devre dışı bırakma / yapılandırma

- `openclaw plugins disable bonjour`, paketlenmiş Plugin'i devre dışı bırakarak LAN çok noktaya yayın duyurusunu devre dışı bırakır.
- `openclaw plugins enable bonjour`, varsayılan LAN keşif Plugin'ini geri getirir.
- `OPENCLAW_DISABLE_BONJOUR=1`, Plugin yapılandırmasını değiştirmeden LAN çok noktaya yayın duyurusunu devre dışı bırakır; kabul edilen doğru değerleri `1`, `true`, `yes` ve `on` şeklindedir (eski: `OPENCLAW_DISABLE_BONJOUR`).
- `~/.openclaw/openclaw.json` içindeki `gateway.bind`, Gateway bağlama modunu kontrol eder.
- `OPENCLAW_SSH_PORT`, `sshPort` duyurulduğunda SSH bağlantı noktasını geçersiz kılar (eski: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS`, mDNS tam modu etkin olduğunda TXT içinde MagicDNS ipucu yayınlar (eski: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH`, duyurulan CLI yolunu geçersiz kılar (eski: `OPENCLAW_CLI_PATH`).

## İlgili belgeler

- Keşif politikası ve taşıma seçimi: [Keşif](/tr/gateway/discovery)
- Node eşleştirme + onaylar: [Gateway eşleştirme](/tr/gateway/pairing)
