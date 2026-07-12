---
read_when:
    - Bonjour keşfinin/duyurusunun uygulanması veya değiştirilmesi
    - Uzak bağlantı modlarını ayarlama (doğrudan veya SSH)
    - Uzak Node'lar için Node keşfi ve eşleştirme tasarımı
summary: Gateway'i bulmak için Node keşfi ve aktarım yöntemleri (Bonjour, Tailscale, SSH)
title: Keşif ve taşıma yöntemleri
x-i18n:
    generated_at: "2026-07-12T12:18:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a3f1a6a1212ab0bc7021e77c88de059edcb8e09eff90d3e1e59451b9b20876b
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw'ın birbiriyle ilişkili ancak birbirinden farklı iki keşif sorunu vardır:

1. **Operatör uzaktan denetimi**: başka bir yerde çalışan Gateway'i denetleyen macOS menü çubuğu uygulaması.
2. **Node eşleştirme**: iOS/Android'in (ve gelecekteki Node'ların) bir Gateway bulması ve güvenli biçimde eşleşmesi.

Tüm ağ keşfi/duyurusu **Node Gateway** (`openclaw gateway`) içinde gerçekleşir; istemciler (Mac uygulaması, iOS) yalnızca tüketicidir.

## Terimler

- **Gateway**: durumu (oturumlar, eşleştirme, Node kayıt defteri) yöneten ve kanalları çalıştıran, uzun süre çalışan tek bir süreç. Çoğu kurulumda ana makine başına bir tane kullanılır; yalıtılmış çoklu Gateway kurulumları da mümkündür.
- **Gateway WS (denetim düzlemi)**: varsayılan olarak `127.0.0.1:18789` adresindeki WebSocket uç noktasıdır; `gateway.bind` aracılığıyla LAN/tailnet'e bağlayın.
- **Doğrudan WS aktarımı**: LAN/tailnet'e yönelik bir Gateway WS uç noktasıdır (SSH kullanılmaz).
- **SSH aktarımı (yedek seçenek)**: `127.0.0.1:18789` adresini SSH üzerinden yönlendirerek uzaktan denetim.
- **Eski TCP köprüsü (kaldırıldı)**: eski Node aktarımıdır (bkz. [Köprü protokolü](/tr/gateway/bridge-protocol)); artık keşif için duyurulmaz ve güncel derlemelerin parçası değildir.

Protokol ayrıntıları: [Gateway protokolü](/tr/gateway/protocol), [Köprü protokolü (eski)](/tr/gateway/bridge-protocol).

## Hem doğrudan bağlantı hem SSH neden var?

- **Doğrudan WS**, aynı ağda ve bir tailnet içinde en iyi kullanıcı deneyimini sağlar: Bonjour aracılığıyla LAN'da otomatik keşif, Gateway tarafından yönetilen eşleştirme belirteçleri ve ACL'ler ve kabuk erişimi gerektirmemesi.
- **SSH**, evrensel yedek seçenektir: SSH erişiminizin olduğu her yerde, birbiriyle ilgisiz ağlar arasında bile çalışır; çok noktaya yayın/mDNS sorunlarından etkilenmez ve SSH dışında yeni bir gelen bağlantı noktası gerektirmez.

## Keşif girdileri

### 1) Bonjour / DNS-SD

Çok noktaya yayın Bonjour, en iyi çaba esasına göre çalışır ve ağlar arasında geçiş yapmaz. OpenClaw ayrıca aynı Gateway işaretinin yapılandırılmış bir geniş alan DNS-SD etki alanı üzerinden taranmasını destekler; böylece keşif, aynı LAN'daki `local.` alanını ve ağlar arası keşif için yapılandırılmış tek noktaya yayın DNS-SD etki alanını kapsayabilir.

Paketle gelen `bonjour` Plugin'i etkinleştirildiğinde **Gateway**, WS uç noktasını Bonjour aracılığıyla duyurur; istemciler tarama yapıp bir "Gateway seçin" listesi gösterir ve ardından seçilen uç noktayı kaydeder.

Sorun giderme ve işaret ayrıntıları: [Bonjour](/tr/gateway/bonjour).

#### Hizmet işareti ayrıntıları

- Hizmet türü: `_openclaw-gw._tcp` (Gateway aktarım işareti).
- TXT anahtarları (gizli değildir):

  | Anahtar                     | Notlar                                                                                                                                                                              |
  | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `role=gateway`              | Her zaman bulunur.                                                                                                                                                                  |
  | `transport=gateway`         | Her zaman bulunur.                                                                                                                                                                  |
  | `displayName=<name>`        | Operatör tarafından yapılandırılan görünen ad.                                                                                                                                      |
  | `lanHost=<hostname>.local`  | Yalnızca LAN mDNS duyurucusu; geniş alan DNS-SD tarafından yazılmaz.                                                                                                                |
  | `gatewayPort=18789`         | Gateway WS + HTTP bağlantı noktası.                                                                                                                                                 |
  | `gatewayTls=1`              | Yalnızca TLS etkin olduğunda.                                                                                                                                                       |
  | `gatewayTlsSha256=<sha256>` | Yalnızca TLS etkin olduğunda ve parmak izi mevcut olduğunda.                                                                                                                        |
  | `tailnetDns=<magicdns>`     | İsteğe bağlı ipucu; Tailscale kullanılabiliyorsa otomatik olarak algılanır.                                                                                                         |
  | `sshPort=<port>`            | Yalnızca `discovery.mdns.mode="full"` olduğunda bulunur; hem LAN duyurucusunda hem de geniş alan DNS-SD'de varsayılan `"minimal"` modunda atlanır (SSH varsayılanı `22`'dir).         |
  | `cliPath=<path>`            | `sshPort` ile aynı `discovery.mdns.mode="full"` koşuluna bağlıdır; CLI yolu için bir uzak kurulum ipucudur.                                                                          |

  Gelecekteki bir tuval ana makine bağlantı noktası için Plugin keşif sözleşmesinde bir `canvasPort` TXT anahtarı tanımlanmıştır; ancak güncel hiçbir kod yolu değer atamadığından şu anda hiçbir zaman yayımlanmaz.

Güvenlik notları:

- Bonjour/mDNS TXT kayıtlarının **kimliği doğrulanmaz**. İstemciler TXT değerlerini yalnızca kullanıcı deneyimi ipuçları olarak değerlendirmelidir.
- Yönlendirme (ana makine/bağlantı noktası), TXT tarafından sağlanan `lanHost`, `tailnetDns` veya `gatewayPort` yerine **çözümlenmiş hizmet uç noktasını** (SRV + A/AAAA) tercih etmelidir.
- TLS sabitleme, duyurulan bir `gatewayTlsSha256` değerinin daha önce kaydedilmiş bir sabitlemeyi geçersiz kılmasına asla izin vermemelidir.
- Seçilen rota güvenli/TLS tabanlı olduğunda iOS/Android Node'ları, ilk kez görülen bir sabitlemeyi kaydetmeden önce açık bir "bu parmak izine güven" onayı (bant dışı doğrulama) gerektirmelidir.

Etkinleştirme, devre dışı bırakma ve geçersiz kılma:

- `openclaw plugins enable bonjour`, LAN çok noktaya yayın duyurusunu etkinleştirir.
- `openclaw.json` içindeki `discovery.mdns.mode`, mDNS yayınını denetler: `"minimal"` (varsayılan), `"full"` (hem LAN işaretine hem de tüm geniş alan DNS-SD bölgelerine `cliPath`/`sshPort` ekler) veya `"off"` (mDNS'yi devre dışı bırakır).
- `OPENCLAW_DISABLE_BONJOUR=1` duyuruyu zorla devre dışı bırakır; `discovery.mdns.mode="off"` ise bunu bağımsız olarak devre dışı bırakır. `OPENCLAW_DISABLE_BONJOUR=0`, algılanan bir kapsayıcı (Docker, containerd, Kubernetes, LXC) içinde Plugin'in otomatik devre dışı bırakmasını geçersiz kılan açık bir etkinleştirmedir; `discovery.mdns.mode="off"` ayarını geçersiz kılmaz. Paketle gelen `bonjour` Plugin'i macOS ana makinelerinde otomatik olarak başlar (`enabledByDefaultOnPlatforms: ["darwin"]`) ve algılanan kapsayıcıların içinde otomatik olarak devre dışı kalır; Linux, Windows ve diğer kapsayıcılı dağıtımlar açıkça `plugins enable bonjour` komutunun çalıştırılmasını gerektirir.
- `~/.openclaw/openclaw.json` içindeki `gateway.bind`, Gateway bağlama modunu denetler.
- `OPENCLAW_SSH_PORT`, duyurulan SSH bağlantı noktasını geçersiz kılar (yalnızca `discovery.mdns.mode="full"` olduğunda etkili olur).
- `OPENCLAW_TAILNET_DNS`, bir `tailnetDns` ipucu (MagicDNS) yayımlar.
- `OPENCLAW_CLI_PATH`, duyurulan CLI yolunu geçersiz kılar.

### 2) Tailnet (ağlar arası)

Farklı fiziksel ağlardaki Gateway'ler için Bonjour yardımcı olmaz. Önerilen doğrudan hedef, bir Tailscale MagicDNS adı (tercih edilir) veya kararlı bir tailnet IP adresidir.

Gateway, Tailscale altında çalıştığını algılarsa istemciler için isteğe bağlı bir ipucu olarak `tailnetDns` değerini yayımlar (geniş alan işaretleri dâhil). macOS uygulaması, Gateway keşfinde ham Tailscale IP adresleri yerine MagicDNS adlarını tercih eder. MagicDNS otomatik olarak güncel IP adresini çözümlediğinden bu yaklaşım, tailnet IP adresleri değiştiğinde (Node yeniden başlatmaları, CGNAT yeniden ataması) güvenilirliğini korur.

Mobil Node eşleştirmesinde keşif ipuçları, tailnet/genel rotalardaki aktarım güvenliğini hiçbir zaman gevşetmez:

- iOS/Android yine de ilk tailnet/genel bağlantıda güvenli bir bağlantı yolu (`wss://` veya Tailscale Serve/Funnel) gerektirir.
- Keşfedilmiş ham bir tailnet IP adresi, bir yönlendirme ipucudur; uzak `ws://` bağlantısının düz metin olarak kullanılmasına izin vermez.
- Özel LAN'da doğrudan `ws://` bağlantısı desteklenmeye devam eder.
- Mobil Node'larda en basit Tailscale yolu için Tailscale Serve kullanın; böylece hem keşif hem de kurulum aynı güvenli MagicDNS uç noktasına çözümlenir.

### 3) El ile / SSH hedefi

Doğrudan rota olmadığında (veya doğrudan bağlantı devre dışı bırakıldığında), istemciler local loopback Gateway bağlantı noktasını yönlendirerek her zaman SSH üzerinden bağlanabilir. Bkz. [Uzaktan erişim](/tr/gateway/remote).

## Aktarım seçimi (istemci ilkesi)

1. Eşleştirilmiş bir doğrudan uç nokta yapılandırılmış ve erişilebilir durumdaysa onu kullanın.
2. Aksi takdirde keşif, `local.` üzerinde veya yapılandırılmış geniş alan etki alanında bir Gateway bulursa tek dokunuşla "Bu Gateway'i kullan" seçeneğini sunun ve bunu doğrudan uç nokta olarak kaydedin.
3. Aksi takdirde bir tailnet DNS/IP yapılandırılmışsa doğrudan bağlantıyı deneyin. Tailnet/genel rotalardaki mobil Node'lar için doğrudan bağlantı, düz metin uzak `ws://` değil, güvenli bir uç nokta anlamına gelir.
4. Aksi takdirde SSH'ye geri dönün.

## Eşleştirme ve kimlik doğrulama (doğrudan aktarım)

Node/istemci kabulünde doğruluğun kaynağı Gateway'dir:

- Eşleştirme istekleri Gateway'de oluşturulur/onaylanır/reddedilir (bkz. [Gateway eşleştirme](/tr/gateway/pairing)).
- Gateway; kimlik doğrulamayı (belirteç/anahtar çifti), kapsamları/ACL'leri (her yönteme erişim sağlayan ham bir vekil değildir) ve hız sınırlarını uygular.

## Bileşenlere göre sorumluluklar

- **Gateway**: keşif işaretlerini duyurur, eşleştirme kararlarını yönetir ve WS uç noktasını barındırır.
- **macOS uygulaması**: Gateway seçmenize yardımcı olur, eşleştirme istemlerini gösterir ve SSH'yi yalnızca yedek seçenek olarak kullanır.
- **iOS/Android Node'ları**: kolaylık sağlamak için Bonjour'u tarar ve eşleştirilmiş Gateway WS'ye bağlanır.

## İlgili konular

- [Uzaktan erişim](/tr/gateway/remote)
- [Tailscale](/tr/gateway/tailscale)
- [Bonjour keşfi](/tr/gateway/bonjour)
