---
read_when:
    - Bonjour keşfini/duyurusunu uygulama veya değiştirme
    - Uzak bağlantı modlarını ayarlama (doğrudan ve SSH)
    - Uzak Node'lar için Node keşfi + eşleştirme tasarlama
summary: Gateway'i bulmaya yönelik Node keşfi ve taşıma yöntemleri (Bonjour, Tailscale, SSH)
title: Keşif ve aktarım yöntemleri
x-i18n:
    generated_at: "2026-05-03T21:32:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41a5ed7a910ae4bbdfa21a81882c3b1af0c16622fa20a5e616b666390dccdc9c
    source_path: gateway/discovery.md
    workflow: 16
---

# Keşif ve taşıma yöntemleri

OpenClaw yüzeyde benzer görünen iki ayrı soruna sahiptir:

1. **Operatör uzaktan kontrolü**: başka bir yerde çalışan bir gateway'i kontrol eden macOS menü çubuğu uygulaması.
2. **Node eşleme**: iOS/Android'in (ve gelecekteki nodeların) bir gateway bulması ve güvenli şekilde eşleşmesi.

Tasarım hedefi, tüm ağ keşfini/duyurusunu **Node Gateway** (`openclaw gateway`) içinde tutmak ve istemcileri (Mac uygulaması, iOS) tüketici olarak bırakmaktır.

## Terimler

- **Gateway**: durumu (oturumlar, eşleme, node kayıt defteri) sahiplenen ve kanalları çalıştıran, tek bir uzun süre çalışan gateway süreci. Çoğu kurulum host başına bir tane kullanır; izole çoklu gateway kurulumları mümkündür.
- **Gateway WS (kontrol düzlemi)**: varsayılan olarak `127.0.0.1:18789` üzerindeki WebSocket uç noktası; `gateway.bind` ile LAN/tailnet'e bağlanabilir.
- **Doğrudan WS taşıması**: LAN/tailnet'e dönük Gateway WS uç noktası (SSH yok).
- **SSH taşıması (yedek)**: `127.0.0.1:18789` değerini SSH üzerinden ileterek uzaktan kontrol.
- **Eski TCP köprüsü (kaldırıldı)**: eski node taşıması (bkz.
  [Köprü protokolü](/tr/gateway/bridge-protocol)); artık keşif için duyurulmaz
  ve güncel derlemelerin parçası değildir.

Protokol ayrıntıları:

- [Gateway protokolü](/tr/gateway/protocol)
- [Köprü protokolü (eski)](/tr/gateway/bridge-protocol)

## Neden hem "doğrudan" hem de SSH'yi koruyoruz?

- **Doğrudan WS**, aynı ağda ve bir tailnet içinde en iyi kullanıcı deneyimidir:
  - Bonjour ile LAN üzerinde otomatik keşif
  - gateway tarafından sahiplenilen eşleme belirteçleri + ACL'ler
  - kabuk erişimi gerekmez; protokol yüzeyi dar ve denetlenebilir kalabilir
- **SSH** evrensel yedek olarak kalır:
  - SSH erişiminizin olduğu her yerde çalışır (ilişkisiz ağlar arasında bile)
  - multicast/mDNS sorunlarına dayanır
  - SSH dışında yeni gelen bağlantı portları gerektirmez

## Keşif girdileri (istemciler gateway'in nerede olduğunu nasıl öğrenir)

### 1) Bonjour / DNS-SD keşfi

Multicast Bonjour en iyi çaba ilkesine göre çalışır ve ağlar arasında geçiş yapmaz. OpenClaw aynı gateway işaretini yapılandırılmış geniş alan DNS-SD alan adı üzerinden de tarayabilir; böylece keşif şunları kapsayabilir:

- aynı LAN üzerindeki `local.`
- ağlar arası keşif için yapılandırılmış unicast DNS-SD alan adı

Hedef yön:

- **gateway**, paketlenen `bonjour` Plugin etkin olduğunda WS uç noktasını Bonjour üzerinden duyurur. Plugin macOS hostlarında otomatik başlar ve başka yerlerde isteğe bağlıdır.
- İstemciler tarama yapar ve bir “gateway seç” listesi gösterir, ardından seçilen uç noktayı saklar.

Sorun giderme ve işaret ayrıntıları: [Bonjour](/tr/gateway/bonjour).

#### Hizmet işareti ayrıntıları

- Hizmet türleri:
  - `_openclaw-gw._tcp` (gateway taşıma işareti)
- TXT anahtarları (gizli olmayan):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (operatör tarafından yapılandırılan görünen ad)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (yalnızca TLS etkin olduğunda)
  - `gatewayTlsSha256=<sha256>` (yalnızca TLS etkin olduğunda ve parmak izi kullanılabilir olduğunda)
  - `canvasPort=<port>` (canvas host portu; canvas host etkin olduğunda şu anda `gatewayPort` ile aynıdır)
  - `tailnetDns=<magicdns>` (isteğe bağlı ipucu; Tailscale kullanılabildiğinde otomatik algılanır)
  - `sshPort=<port>` (yalnızca mDNS tam modu; geniş alan DNS-SD bunu atlayabilir, bu durumda SSH varsayılanları `22` olarak kalır)
  - `cliPath=<path>` (yalnızca mDNS tam modu; geniş alan DNS-SD bunu yine de uzak kurulum ipucu olarak yazar)

Güvenlik notları:

- Bonjour/mDNS TXT kayıtları **kimlik doğrulamasızdır**. İstemciler TXT değerlerini yalnızca kullanıcı deneyimi ipuçları olarak ele almalıdır.
- Yönlendirme (host/port), TXT tarafından sağlanan `lanHost`, `tailnetDns` veya `gatewayPort` yerine **çözümlenen hizmet uç noktasını** (SRV + A/AAAA) tercih etmelidir.
- TLS sabitleme, duyurulan bir `gatewayTlsSha256` değerinin daha önce saklanmış bir sabitlemeyi geçersiz kılmasına asla izin vermemelidir.
- iOS/Android nodeları, seçilen rota güvenli/TLS tabanlı olduğunda, ilk kez sabitleme saklamadan önce açık bir “bu parmak izine güven” onayı (bant dışı doğrulama) gerektirmelidir.

Etkinleştirme/devre dışı bırakma/geçersiz kılma:

- `openclaw plugins enable bonjour`, LAN multicast duyurusunu etkinleştirir.
- `OPENCLAW_DISABLE_BONJOUR=1`, duyuruyu devre dışı bırakır.
- Bonjour Plugin etkin olduğunda ve `OPENCLAW_DISABLE_BONJOUR` ayarlanmamış olduğunda,
  Bonjour normal hostlarda duyuru yapar ve algılanan containerlar içinde otomatik devre dışı kalır.
  Boş yapılandırmalı macOS Gateway başlangıcı Plugin'i otomatik etkinleştirir; Linux,
  Windows ve containerize dağıtımlar açık etkinleştirme gerektirir.
  `0` değerini yalnızca host, macvlan veya başka bir mDNS yetenekli ağda kullanın; zorla devre dışı bırakmak için `1` kullanın.
- `~/.openclaw/openclaw.json` içindeki `gateway.bind`, Gateway bağlama modunu kontrol eder.
- `OPENCLAW_SSH_PORT`, `sshPort` yayımlandığında duyurulan SSH portunu geçersiz kılar.
- `OPENCLAW_TAILNET_DNS`, bir `tailnetDns` ipucu (MagicDNS) yayımlar.
- `OPENCLAW_CLI_PATH`, duyurulan CLI yolunu geçersiz kılar.

### 2) Tailnet (ağlar arası)

London/Vienna tarzı kurulumlarda Bonjour yardımcı olmaz. Önerilen “doğrudan” hedef şudur:

- Tailscale MagicDNS adı (tercih edilir) veya kararlı bir tailnet IP'si.

gateway, Tailscale altında çalıştığını algılayabiliyorsa istemciler için isteğe bağlı bir ipucu olarak `tailnetDns` yayımlar (geniş alan işaretleri dahil).

macOS uygulaması artık gateway keşfi için ham Tailscale IP'leri yerine MagicDNS adlarını tercih eder. Bu, tailnet IP'leri değiştiğinde (örneğin node yeniden başlatmalarından veya CGNAT yeniden atamasından sonra) güvenilirliği artırır, çünkü MagicDNS adları otomatik olarak güncel IP'ye çözülür.

Mobil node eşlemesi için keşif ipuçları, tailnet/genel rotalarda taşıma güvenliğini gevşetmez:

- iOS/Android yine de güvenli bir ilk tailnet/genel bağlantı yolu gerektirir (`wss://` veya Tailscale Serve/Funnel).
- Keşfedilen ham tailnet IP'si bir yönlendirme ipucudur, uzaktaki düz metin `ws://` kullanımına izin değildir.
- Özel LAN doğrudan bağlantı `ws://` desteklenmeye devam eder.
- Mobil nodelar için en basit Tailscale yolunu istiyorsanız, keşif ve kurulum kodunun aynı güvenli MagicDNS uç noktasına çözülmesi için Tailscale Serve kullanın.

### 3) Manuel / SSH hedefi

Doğrudan rota olmadığında (veya doğrudan devre dışı olduğunda), istemciler local loopback gateway portunu ileterek her zaman SSH üzerinden bağlanabilir.

Bkz. [Uzaktan erişim](/tr/gateway/remote).

## Taşıma seçimi (istemci ilkesi)

Önerilen istemci davranışı:

1. Eşlenmiş bir doğrudan uç nokta yapılandırılmış ve erişilebilir durumdaysa onu kullanın.
2. Aksi halde, keşif `local.` veya yapılandırılmış geniş alan alan adı üzerinde bir gateway bulursa tek dokunuşla “Bu gateway'i kullan” seçeneği sunun ve bunu doğrudan uç nokta olarak kaydedin.
3. Aksi halde, bir tailnet DNS/IP yapılandırılmışsa doğrudanı deneyin.
   Tailnet/genel rotalardaki mobil nodelar için doğrudan, uzaktaki düz metin `ws://` değil güvenli bir uç nokta anlamına gelir.
4. Aksi halde, SSH'ye geri dönün.

## Eşleme + kimlik doğrulama (doğrudan taşıma)

gateway, node/istemci kabulü için doğruluk kaynağıdır.

- Eşleme istekleri gateway içinde oluşturulur/onaylanır/reddedilir (bkz. [Gateway eşleme](/tr/gateway/pairing)).
- gateway şunları zorunlu kılar:
  - kimlik doğrulama (belirteç / anahtar çifti)
  - kapsamlar/ACL'ler (gateway her yönteme yönelik ham bir proxy değildir)
  - hız sınırları

## Bileşene göre sorumluluklar

- **Gateway**: keşif işaretlerini duyurur, eşleme kararlarına sahip olur ve WS uç noktasını barındırır.
- **macOS uygulaması**: bir gateway seçmenize yardımcı olur, eşleme istemlerini gösterir ve SSH'yi yalnızca yedek olarak kullanır.
- **iOS/Android nodeları**: kolaylık için Bonjour'u tarar ve eşlenmiş Gateway WS'ye bağlanır.

## İlgili

- [Uzaktan erişim](/tr/gateway/remote)
- [Tailscale](/tr/gateway/tailscale)
- [Bonjour keşfi](/tr/gateway/bonjour)
