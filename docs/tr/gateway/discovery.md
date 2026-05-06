---
read_when:
    - Bonjour keşfini/duyurusunu uygulama veya değiştirme
    - Uzak bağlantı modlarını ayarlama (doğrudan ve SSH)
    - Uzak Node'lar için Node keşfi + eşleştirme tasarımı
summary: Gateway'i bulmak için Node keşfi ve taşıma yöntemleri (Bonjour, Tailscale, SSH)
title: Keşif ve aktarımlar
x-i18n:
    generated_at: "2026-05-06T09:12:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f53e1292d9e5b402186c48c777e7e665c790981a64679c783ae8d8a1f170ee1
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw yüzeyde benzer görünen iki ayrı probleme sahiptir:

1. **Operatör uzaktan denetimi**: başka bir yerde çalışan bir gateway'i denetleyen macOS menü çubuğu uygulaması.
2. **Node eşleştirmesi**: iOS/Android'in (ve gelecekteki node'ların) bir gateway bulması ve güvenli şekilde eşleşmesi.

Tasarım hedefi, tüm ağ keşfi/duyurusunu **Node Gateway** (`openclaw gateway`) içinde tutmak ve istemcileri (mac uygulaması, iOS) tüketici olarak bırakmaktır.

## Terimler

- **Gateway**: durumu (oturumlar, eşleştirme, node kayıt defteri) sahiplenen ve kanalları çalıştıran tek bir uzun süre çalışan gateway süreci. Çoğu kurulum ana makine başına bir tane kullanır; yalıtılmış çoklu gateway kurulumları mümkündür.
- **Gateway WS (kontrol düzlemi)**: varsayılan olarak `127.0.0.1:18789` üzerindeki WebSocket uç noktası; `gateway.bind` ile LAN/tailnet'e bağlanabilir.
- **Doğrudan WS aktarımı**: LAN/tailnet'e dönük bir Gateway WS uç noktası (SSH yok).
- **SSH aktarımı (yedek)**: `127.0.0.1:18789` adresini SSH üzerinden ileterek uzaktan denetim.
- **Eski TCP köprüsü (kaldırıldı)**: daha eski node aktarımı (bkz.
  [Köprü protokolü](/tr/gateway/bridge-protocol)); artık keşif için duyurulmaz
  ve güncel derlemelerin parçası değildir.

Protokol ayrıntıları:

- [Gateway protokolü](/tr/gateway/protocol)
- [Köprü protokolü (eski)](/tr/gateway/bridge-protocol)

## Neden hem doğrudanı hem SSH'yi koruyoruz?

- **Doğrudan WS**, aynı ağda ve bir tailnet içinde en iyi UX'i sağlar:
  - Bonjour aracılığıyla LAN'da otomatik keşif
  - gateway tarafından sahiplenilen eşleştirme belirteçleri + ACL'ler
  - kabuk erişimi gerekmez; protokol yüzeyi dar ve denetlenebilir kalabilir
- **SSH** evrensel yedek olarak kalır:
  - SSH erişiminizin olduğu her yerde çalışır (ilişkisiz ağlar arasında bile)
  - multicast/mDNS sorunlarını atlatır
  - SSH dışında yeni gelen bağlantı portları gerektirmez

## Keşif girdileri (istemciler gateway'in nerede olduğunu nasıl öğrenir?)

### 1) Bonjour / DNS-SD keşfi

Multicast Bonjour en iyi çaba esaslıdır ve ağlar arasında geçmez. OpenClaw aynı gateway işaretini yapılandırılmış bir geniş alan DNS-SD etki alanı üzerinden de tarayabilir; böylece keşif şunları kapsayabilir:

- aynı LAN üzerinde `local.`
- ağlar arası keşif için yapılandırılmış bir unicast DNS-SD etki alanı

Hedef yön:

- **gateway**, paketle gelen
  `bonjour` plugin'i etkinleştirildiğinde WS uç noktasını Bonjour üzerinden duyurur. Plugin macOS ana makinelerinde otomatik başlar ve
  diğer yerlerde isteğe bağlıdır.
- İstemciler tarar ve bir "gateway seç" listesi gösterir, ardından seçilen uç noktayı saklar.

Sorun giderme ve işaret ayrıntıları: [Bonjour](/tr/gateway/bonjour).

#### Hizmet işareti ayrıntıları

- Hizmet türleri:
  - `_openclaw-gw._tcp` (gateway aktarım işareti)
- TXT anahtarları (gizli olmayan):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (operatör tarafından yapılandırılmış görünen ad)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (yalnızca TLS etkin olduğunda)
  - `gatewayTlsSha256=<sha256>` (yalnızca TLS etkin olduğunda ve parmak izi kullanılabilir olduğunda)
  - `canvasPort=<port>` (canvas host portu; canvas host etkin olduğunda şu anda `gatewayPort` ile aynıdır)
  - `tailnetDns=<magicdns>` (isteğe bağlı ipucu; Tailscale kullanılabilir olduğunda otomatik algılanır)
  - `sshPort=<port>` (yalnızca mDNS tam modu; geniş alan DNS-SD bunu atlayabilir, bu durumda SSH varsayılanları `22` olarak kalır)
  - `cliPath=<path>` (yalnızca mDNS tam modu; geniş alan DNS-SD bunu yine de uzak kurulum ipucu olarak yazar)

Güvenlik notları:

- Bonjour/mDNS TXT kayıtları **kimlik doğrulamasızdır**. İstemciler TXT değerlerini yalnızca UX ipuçları olarak ele almalıdır.
- Yönlendirme (ana makine/port), TXT tarafından sağlanan `lanHost`, `tailnetDns` veya `gatewayPort` yerine **çözümlenen hizmet uç noktasını** (SRV + A/AAAA) tercih etmelidir.
- TLS sabitleme, duyurulan bir `gatewayTlsSha256` değerinin daha önce saklanmış bir sabitlemeyi geçersiz kılmasına asla izin vermemelidir.
- iOS/Android node'ları, seçilen rota güvenli/TLS tabanlı olduğunda ilk kez sabitleme saklamadan önce açık bir "bu parmak izine güven" onayı (bant dışı doğrulama) gerektirmelidir.

Etkinleştirme/devre dışı bırakma/geçersiz kılma:

- `openclaw plugins enable bonjour` LAN multicast duyurusunu etkinleştirir.
- `OPENCLAW_DISABLE_BONJOUR=1` duyuruyu devre dışı bırakır.
- Bonjour Plugin etkinleştirildiğinde ve `OPENCLAW_DISABLE_BONJOUR` ayarlanmamış olduğunda,
  Bonjour normal ana makinelerde duyuru yapar ve algılanan container'lar içinde otomatik olarak devre dışı kalır.
  Boş yapılandırmalı macOS Gateway başlangıcı plugin'i otomatik olarak etkinleştirir; Linux,
  Windows ve container içindeki dağıtımlar açık etkinleştirme gerektirir.
  `0` değerini yalnızca ana makine, macvlan veya başka bir mDNS uyumlu ağda kullanın; zorla devre dışı bırakmak için `1` kullanın.
- `~/.openclaw/openclaw.json` içindeki `gateway.bind`, Gateway bağlanma modunu denetler.
- `OPENCLAW_SSH_PORT`, `sshPort` yayımlandığında duyurulan SSH portunu geçersiz kılar.
- `OPENCLAW_TAILNET_DNS`, bir `tailnetDns` ipucu (MagicDNS) yayımlar.
- `OPENCLAW_CLI_PATH`, duyurulan CLI yolunu geçersiz kılar.

### 2) Tailnet (ağlar arası)

London/Vienna tarzı kurulumlarda Bonjour yardımcı olmaz. Önerilen "doğrudan" hedef şudur:

- Tailscale MagicDNS adı (tercih edilir) veya kararlı bir tailnet IP'si.

gateway, Tailscale altında çalıştığını algılayabiliyorsa istemciler için (geniş alan işaretleri dahil) isteğe bağlı bir ipucu olarak `tailnetDns` yayımlar.

macOS uygulaması artık gateway keşfi için ham Tailscale IP'leri yerine MagicDNS adlarını tercih eder. Bu, tailnet IP'leri değiştiğinde (örneğin node yeniden başlatmalarından veya CGNAT yeniden atamasından sonra) güvenilirliği artırır, çünkü MagicDNS adları otomatik olarak güncel IP'ye çözümlenir.

Mobil node eşleştirmesi için keşif ipuçları tailnet/genel rotalarda aktarım güvenliğini gevşetmez:

- iOS/Android yine de güvenli bir ilk kez tailnet/genel bağlantı yolu (`wss://` veya Tailscale Serve/Funnel) gerektirir.
- Keşfedilen ham tailnet IP'si bir yönlendirme ipucudur; düz metin uzak `ws://` kullanma izni değildir.
- Özel LAN doğrudan bağlantı `ws://` desteklenmeye devam eder.
- Mobil node'lar için en basit Tailscale yolunu istiyorsanız, keşif ve kurulum kodunun ikisi de aynı güvenli MagicDNS uç noktasına çözümlensin diye Tailscale Serve kullanın.

### 3) Manuel / SSH hedefi

Doğrudan rota olmadığında (veya doğrudan devre dışı olduğunda), istemciler loopback gateway portunu ileterek her zaman SSH üzerinden bağlanabilir.

Bkz. [Uzaktan erişim](/tr/gateway/remote).

## Aktarım seçimi (istemci politikası)

Önerilen istemci davranışı:

1. Eşleştirilmiş bir doğrudan uç nokta yapılandırılmış ve erişilebilir durumdaysa onu kullanın.
2. Aksi halde, keşif `local.` üzerinde veya yapılandırılmış geniş alan etki alanında bir gateway bulursa, tek dokunuşla "Bu gateway'i kullan" seçeneği sunun ve bunu doğrudan uç nokta olarak kaydedin.
3. Aksi halde, bir tailnet DNS/IP yapılandırılmışsa doğrudanı deneyin.
   Tailnet/genel rotalardaki mobil node'lar için doğrudan, düz metin uzak `ws://` değil güvenli bir uç nokta anlamına gelir.
4. Aksi halde, SSH'ye geri dönün.

## Eşleştirme + kimlik doğrulama (doğrudan aktarım)

gateway, node/istemci kabulü için doğruluk kaynağıdır.

- Eşleştirme istekleri gateway içinde oluşturulur/onaylanır/reddedilir (bkz. [Gateway eşleştirmesi](/tr/gateway/pairing)).
- gateway şunları uygular:
  - kimlik doğrulama (belirteç / anahtar çifti)
  - kapsamlar/ACL'ler (gateway her yönteme yönelik ham bir proxy değildir)
  - hız sınırları

## Bileşene göre sorumluluklar

- **Gateway**: keşif işaretlerini duyurur, eşleştirme kararlarını sahiplenir ve WS uç noktasını barındırır.
- **macOS uygulaması**: bir gateway seçmenize yardımcı olur, eşleştirme istemlerini gösterir ve SSH'yi yalnızca yedek olarak kullanır.
- **iOS/Android node'ları**: kolaylık olarak Bonjour'u tarar ve eşleştirilmiş Gateway WS'ye bağlanır.

## İlgili

- [Uzaktan erişim](/tr/gateway/remote)
- [Tailscale](/tr/gateway/tailscale)
- [Bonjour keşfi](/tr/gateway/bonjour)
