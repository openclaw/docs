---
read_when:
    - Bonjour keşfi/yayınlamasını uygulama veya değiştirme
    - Uzak bağlantı modlarını ayarlama (doğrudan veya SSH)
    - Uzak Node'lar için Node keşfi ve eşleştirme tasarlama
summary: Gateway'i bulmak için Node keşfi ve taşıma yöntemleri (Bonjour, Tailscale, SSH)
title: Keşif ve taşıma yöntemleri
x-i18n:
    generated_at: "2026-04-26T11:29:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 615be0f501470772c257beb8e798c522c108b09081a603f44218404277fdf269
    source_path: gateway/discovery.md
    workflow: 15
---

# Keşif ve taşıma yöntemleri

OpenClaw'da yüzeyde benzer görünen ancak aslında farklı olan iki sorun vardır:

1. **Operatör uzaktan kontrolü**: başka bir yerde çalışan bir gateway'i denetleyen macOS menü çubuğu uygulaması.
2. **Node eşleştirme**: iOS/Android'in (ve gelecekteki Node'ların) bir gateway bulması ve güvenli biçimde eşleşmesi.

Tasarım hedefi, tüm ağ keşfi/yayınlamasını **Node Gateway** (`openclaw gateway`) içinde tutmak ve istemcileri (mac uygulaması, iOS) tüketici olarak bırakmaktır.

## Terimler

- **Gateway**: durumu (oturumlar, eşleştirme, Node kayıt defteri) sahiplenen ve kanalları çalıştıran, uzun ömürlü tek bir gateway süreci. Çoğu kurulum ana makine başına bir tane kullanır; yalıtılmış çoklu gateway kurulumları mümkündür.
- **Gateway WS (kontrol düzlemi)**: varsayılan olarak `127.0.0.1:18789` üzerindeki WebSocket uç noktası; `gateway.bind` ile LAN/tailnet'e bağlanabilir.
- **Doğrudan WS taşıması**: LAN/tailnet'e bakan Gateway WS uç noktası (SSH yok).
- **SSH taşıması (fallback)**: `127.0.0.1:18789` portunu SSH üzerinden ileterek uzaktan kontrol.
- **Eski TCP bridge (kaldırıldı)**: eski Node taşıması (bkz.
  [Bridge protocol](/tr/gateway/bridge-protocol)); artık keşif için yayınlanmaz
  ve artık güncel derlemelerin parçası değildir.

Protokol ayrıntıları:

- [Gateway protocol](/tr/gateway/protocol)
- [Bridge protocol (legacy)](/tr/gateway/bridge-protocol)

## Neden hem "direct" hem de SSH'yi koruyoruz

- **Doğrudan WS**, aynı ağda ve bir tailnet içinde en iyi UX'i sağlar:
  - LAN üzerinde Bonjour ile otomatik keşif
  - gateway'in sahip olduğu eşleştirme token'ları + ACL'ler
  - kabuk erişimi gerekmez; protokol yüzeyi sıkı ve denetlenebilir kalabilir
- **SSH**, evrensel fallback olarak kalır:
  - SSH erişiminiz olan her yerde çalışır (hatta ilgisiz ağlar arasında bile)
  - multicast/mDNS sorunlarını atlatır
  - SSH dışında yeni bir gelen port gerektirmez

## Keşif girdileri (istemciler gateway'in nerede olduğunu nasıl öğrenir)

### 1) Bonjour / DNS-SD keşfi

Multicast Bonjour best-effort çalışır ve ağlar arasında geçmez. OpenClaw ayrıca yapılandırılmış bir wide-area DNS-SD alanı üzerinden
aynı gateway beacon'ını tarayabilir; böylece keşif şu kapsamlara yayılabilir:

- aynı LAN üzerindeki `local.`
- ağlar arası keşif için yapılandırılmış bir unicast DNS-SD alanı

Hedef yönü:

- **gateway**, WS uç noktasını Bonjour üzerinden yayınlar.
- İstemciler tarama yapar ve “bir gateway seç” listesi gösterir, ardından seçilen uç noktayı kaydeder.

Sorun giderme ve beacon ayrıntıları: [Bonjour](/tr/gateway/bonjour).

#### Servis beacon ayrıntıları

- Servis türleri:
  - `_openclaw-gw._tcp` (gateway taşıma beacon'ı)
- TXT anahtarları (gizli değil):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (operatör tarafından yapılandırılmış görünen ad)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (yalnızca TLS etkinken)
  - `gatewayTlsSha256=<sha256>` (yalnızca TLS etkinken ve fingerprint kullanılabiliyorsa)
  - `canvasPort=<port>` (canvas host portu; şu anda canvas host etkinken `gatewayPort` ile aynıdır)
  - `tailnetDns=<magicdns>` (isteğe bağlı ipucu; Tailscale kullanılabiliyorsa otomatik algılanır)
  - `sshPort=<port>` (yalnızca mDNS tam modunda; wide-area DNS-SD bunu atlayabilir, bu durumda SSH varsayılanları `22` olarak kalır)
  - `cliPath=<path>` (yalnızca mDNS tam modunda; wide-area DNS-SD bunu yine uzak kurulum ipucu olarak yazar)

Güvenlik notları:

- Bonjour/mDNS TXT kayıtları **kimliği doğrulanmamıştır**. İstemciler TXT değerlerini yalnızca UX ipucu olarak değerlendirmelidir.
- Yönlendirme (host/port), TXT ile verilen `lanHost`, `tailnetDns` veya `gatewayPort` yerine **çözümlenmiş servis uç noktasını** (SRV + A/AAAA) tercih etmelidir.
- TLS pinning, yayınlanan `gatewayTlsSha256` değerinin daha önce depolanmış bir pin'i geçersiz kılmasına asla izin vermemelidir.
- iOS/Android Node'ları, seçilen rota güvenli/TLS tabanlı olduğunda ilk kez görülen bir pin'i depolamadan önce açık bir “bu fingerprint'e güven” onayı istemelidir (out-of-band doğrulama).

Devre dışı bırakma/geçersiz kılma:

- `OPENCLAW_DISABLE_BONJOUR=1`, yayınlamayı devre dışı bırakır.
- Docker Compose varsayılan olarak `OPENCLAW_DISABLE_BONJOUR=1` kullanır çünkü bridge ağları
  genellikle mDNS multicast'i güvenilir biçimde taşımaz; yalnızca host, macvlan
  veya başka bir mDNS uyumlu ağda `0` kullanın.
- `~/.openclaw/openclaw.json` içindeki `gateway.bind`, Gateway bağlama modunu kontrol eder.
- `OPENCLAW_SSH_PORT`, `sshPort` yayınlandığında reklamı yapılan SSH portunu geçersiz kılar.
- `OPENCLAW_TAILNET_DNS`, `tailnetDns` ipucunu (MagicDNS) yayınlar.
- `OPENCLAW_CLI_PATH`, reklamı yapılan CLI yolunu geçersiz kılar.

### 2) Tailnet (ağlar arası)

London/Vienna tarzı kurulumlar için Bonjour yardımcı olmaz. Önerilen “direct” hedef şudur:

- Tailscale MagicDNS adı (tercih edilir) veya kararlı bir tailnet IP'si.

Gateway, Tailscale altında çalıştığını algılayabiliyorsa istemciler için (wide-area beacon'lar dâhil) isteğe bağlı ipucu olarak `tailnetDns` yayınlar.

macOS uygulaması artık gateway keşfi için ham Tailscale IP'leri yerine MagicDNS adlarını tercih eder. Bu, tailnet IP'leri değiştiğinde (örneğin Node yeniden başlatmalarından veya CGNAT yeniden atamasından sonra) güvenilirliği artırır, çünkü MagicDNS adları otomatik olarak geçerli IP'ye çözülür.

Mobil Node eşleştirmesi için keşif ipuçları, tailnet/public rotalarda taşıma güvenliğini gevşetmez:

- iOS/Android, ilk tailnet/public bağlantı için hâlâ güvenli bir yol gerektirir (`wss://` veya Tailscale Serve/Funnel).
- Keşfedilen ham bir tailnet IP'si, yönlendirme ipucudur; düz metin uzak `ws://` kullanma izni değildir.
- Özel LAN doğrudan bağlantı `ws://` desteklenmeye devam eder.
- Mobil Node'lar için en basit Tailscale yolunu istiyorsanız Tailscale Serve kullanın; böylece hem keşif hem de kurulum kodu aynı güvenli MagicDNS uç noktasına çözülür.

### 3) Elle / SSH hedefi

Doğrudan rota yoksa (veya direct devre dışıysa), istemciler loopback gateway portunu SSH üzerinden ileterek her zaman bağlanabilir.

Bkz. [Remote access](/tr/gateway/remote).

## Taşıma seçimi (istemci politikası)

Önerilen istemci davranışı:

1. Eşleşmiş bir doğrudan uç nokta yapılandırılmış ve erişilebilirse onu kullanın.
2. Aksi hâlde, keşif `local.` üzerinde veya yapılandırılmış wide-area alanında bir gateway bulursa tek dokunuşla “Bu gateway'i kullan” seçeneği sunun ve bunu doğrudan uç nokta olarak kaydedin.
3. Aksi hâlde, bir tailnet DNS/IP yapılandırılmışsa direct deneyin.
   Tailnet/public rotalardaki mobil Node'lar için direct, düz metin uzak `ws://` değil, güvenli bir uç nokta anlamına gelir.
4. Aksi hâlde SSH'ye geri dönün.

## Eşleştirme + auth (doğrudan taşıma)

Node/istemci kabulü için gerçek kaynak gateway'dir.

- Eşleştirme istekleri gateway içinde oluşturulur/onaylanır/reddedilir (bkz. [Gateway pairing](/tr/gateway/pairing)).
- Gateway şunları zorunlu kılar:
  - auth (token / keypair)
  - kapsamlar/ACL'ler (gateway her yönteme açık ham bir proxy değildir)
  - hız sınırları

## Bileşenlere göre sorumluluklar

- **Gateway**: keşif beacon'larını yayınlar, eşleştirme kararlarını sahiplenir ve WS uç noktasını barındırır.
- **macOS uygulaması**: bir gateway seçmenize yardımcı olur, eşleştirme istemlerini gösterir ve yalnızca fallback olarak SSH kullanır.
- **iOS/Android Node'ları**: kolaylık için Bonjour tarar ve eşleşmiş Gateway WS'ye bağlanır.

## İlgili

- [Remote access](/tr/gateway/remote)
- [Tailscale](/tr/gateway/tailscale)
- [Bonjour discovery](/tr/gateway/bonjour)
