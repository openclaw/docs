---
read_when:
    - Bonjour keşif/duyuru işlevini uygulama veya değiştirme
    - Uzaktan bağlantı modlarını ayarlama (doğrudan veya SSH)
    - Uzak Node'lar için Node keşfi + eşleştirme tasarlama
summary: Gateway'i bulmak için Node keşfi ve taşıma yöntemleri (Bonjour, Tailscale, SSH)
title: Keşif ve taşıma katmanları
x-i18n:
    generated_at: "2026-04-30T09:21:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: c396e6e07808e2571c6d7f539922b94443adbf39339027e6e962596c6f13deaa
    source_path: gateway/discovery.md
    workflow: 16
---

# Keşif ve taşımalar

OpenClaw, yüzeyde benzer görünen iki ayrı soruna sahiptir:

1. **Operatör uzaktan kontrolü**: başka bir yerde çalışan bir Gateway'i kontrol eden macOS menü çubuğu uygulaması.
2. **Node eşleştirme**: iOS/Android'in (ve gelecekteki Node'ların) bir Gateway bulması ve güvenli şekilde eşleşmesi.

Tasarım hedefi, tüm ağ keşfi/duyurusunu **Node Gateway** (`openclaw gateway`) içinde tutmak ve istemcileri (Mac uygulaması, iOS) tüketici olarak tutmaktır.

## Terimler

- **Gateway**: durumu (oturumlar, eşleştirme, Node kayıt defteri) sahiplenen ve kanalları çalıştıran tek, uzun ömürlü bir Gateway süreci. Çoğu kurulumda ana bilgisayar başına bir tane kullanılır; yalıtılmış çoklu Gateway kurulumları mümkündür.
- **Gateway WS (kontrol düzlemi)**: varsayılan olarak `127.0.0.1:18789` üzerindeki WebSocket uç noktası; `gateway.bind` aracılığıyla LAN/tailnet üzerine bağlanabilir.
- **Doğrudan WS taşıması**: LAN/tailnet'e açık bir Gateway WS uç noktası (SSH yok).
- **SSH taşıması (geri dönüş)**: `127.0.0.1:18789` adresini SSH üzerinden ileterek uzaktan kontrol.
- **Eski TCP köprüsü (kaldırıldı)**: daha eski Node taşıması (bkz.
  [Köprü protokolü](/tr/gateway/bridge-protocol)); artık keşif için duyurulmaz ve artık mevcut derlemelerin parçası değildir.

Protokol ayrıntıları:

- [Gateway protokolü](/tr/gateway/protocol)
- [Köprü protokolü (eski)](/tr/gateway/bridge-protocol)

## Neden hem "doğrudan" hem de SSH kullanıyoruz

- **Doğrudan WS**, aynı ağda ve bir tailnet içinde en iyi kullanıcı deneyimini sağlar:
  - LAN üzerinde Bonjour ile otomatik keşif
  - Gateway tarafından sahip olunan eşleştirme token'ları + ACL'ler
  - kabuk erişimi gerekmez; protokol yüzeyi dar ve denetlenebilir kalabilir
- **SSH**, evrensel geri dönüş yolu olmaya devam eder:
  - SSH erişiminizin olduğu her yerde çalışır (ilişkisiz ağlar arasında bile)
  - multicast/mDNS sorunlarına dayanıklıdır
  - SSH dışında yeni gelen bağlantı noktaları gerektirmez

## Keşif girdileri (istemciler Gateway'in nerede olduğunu nasıl öğrenir)

### 1) Bonjour / DNS-SD keşfi

Multicast Bonjour en iyi çaba esasına dayanır ve ağlar arasında geçiş yapmaz. OpenClaw, aynı Gateway işaretini yapılandırılmış bir geniş alan DNS-SD alan adı üzerinden de tarayabilir; böylece keşif şunları kapsayabilir:

- aynı LAN üzerinde `local.`
- ağlar arası keşif için yapılandırılmış bir unicast DNS-SD alan adı

Hedef yön:

- **Gateway**, WS uç noktasını Bonjour üzerinden duyurur.
- İstemciler tarama yapar ve “bir Gateway seç” listesi gösterir, ardından seçilen uç noktayı saklar.

Sorun giderme ve işaret ayrıntıları: [Bonjour](/tr/gateway/bonjour).

#### Servis işareti ayrıntıları

- Servis türleri:
  - `_openclaw-gw._tcp` (Gateway taşıma işareti)
- TXT anahtarları (gizli olmayan):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (operatör tarafından yapılandırılmış görünen ad)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (yalnızca TLS etkin olduğunda)
  - `gatewayTlsSha256=<sha256>` (yalnızca TLS etkin olduğunda ve parmak izi mevcut olduğunda)
  - `canvasPort=<port>` (canvas ana bilgisayar bağlantı noktası; canvas ana bilgisayarı etkin olduğunda şu anda `gatewayPort` ile aynıdır)
  - `tailnetDns=<magicdns>` (isteğe bağlı ipucu; Tailscale kullanılabilir olduğunda otomatik algılanır)
  - `sshPort=<port>` (yalnızca mDNS tam modu; geniş alan DNS-SD bunu atlayabilir, bu durumda SSH varsayılanları `22` olarak kalır)
  - `cliPath=<path>` (yalnızca mDNS tam modu; geniş alan DNS-SD bunu yine de uzaktan kurulum ipucu olarak yazar)

Güvenlik notları:

- Bonjour/mDNS TXT kayıtları **kimliği doğrulanmamış** kayıtlardır. İstemciler TXT değerlerini yalnızca kullanıcı deneyimi ipuçları olarak ele almalıdır.
- Yönlendirme (ana bilgisayar/bağlantı noktası), TXT tarafından sağlanan `lanHost`, `tailnetDns` veya `gatewayPort` yerine **çözümlenmiş servis uç noktasını** (SRV + A/AAAA) tercih etmelidir.
- TLS pinleme, duyurulan bir `gatewayTlsSha256` değerinin daha önce saklanan bir pini geçersiz kılmasına asla izin vermemelidir.
- iOS/Android Node'ları, seçilen rota güvenli/TLS tabanlı olduğunda ilk kez pin saklamadan önce açık bir “bu parmak izine güven” onayı (bant dışı doğrulama) gerektirmelidir.

Devre dışı bırakma/geçersiz kılma:

- `OPENCLAW_DISABLE_BONJOUR=1` duyuruyu devre dışı bırakır.
- `OPENCLAW_DISABLE_BONJOUR` ayarlanmamış olduğunda Bonjour normal ana bilgisayarlarda duyuru yapar
  ve algılanan kapsayıcıların içinde kendini otomatik olarak devre dışı bırakır. `0` değerini yalnızca ana bilgisayarda, macvlan'da
  veya mDNS yeteneğine sahip başka bir ağda kullanın; zorla devre dışı bırakmak için `1` kullanın.
- `~/.openclaw/openclaw.json` içindeki `gateway.bind`, Gateway bağlama modunu denetler.
- `OPENCLAW_SSH_PORT`, `sshPort` yayımlandığında duyurulan SSH bağlantı noktasını geçersiz kılar.
- `OPENCLAW_TAILNET_DNS`, bir `tailnetDns` ipucu (MagicDNS) yayımlar.
- `OPENCLAW_CLI_PATH`, duyurulan CLI yolunu geçersiz kılar.

### 2) Tailnet (ağlar arası)

Londra/Viyana tarzı kurulumlar için Bonjour yardımcı olmaz. Önerilen “doğrudan” hedef şudur:

- Tailscale MagicDNS adı (tercih edilir) veya kararlı bir tailnet IP'si.

Gateway, Tailscale altında çalıştığını algılayabiliyorsa istemciler için (geniş alan işaretleri dahil) isteğe bağlı bir ipucu olarak `tailnetDns` yayımlar.

macOS uygulaması artık Gateway keşfi için ham Tailscale IP'leri yerine MagicDNS adlarını tercih eder. Bu, tailnet IP'leri değiştiğinde (örneğin Node yeniden başlatmalarından veya CGNAT yeniden atamasından sonra) güvenilirliği artırır; çünkü MagicDNS adları otomatik olarak geçerli IP'ye çözümlenir.

Mobil Node eşleştirme için keşif ipuçları, tailnet/genel rotalarda taşıma güvenliğini gevşetmez:

- iOS/Android hâlâ güvenli bir ilk kez tailnet/genel bağlantı yolu (`wss://` veya Tailscale Serve/Funnel) gerektirir.
- Keşfedilen ham bir tailnet IP'si bir yönlendirme ipucudur; uzak düz metin `ws://` kullanımına izin değildir.
- Özel LAN doğrudan bağlantı `ws://` desteklenmeye devam eder.
- Mobil Node'lar için en basit Tailscale yolunu istiyorsanız keşif ve kurulum kodunun aynı güvenli MagicDNS uç noktasına çözümlenmesi için Tailscale Serve kullanın.

### 3) Manuel / SSH hedefi

Doğrudan rota olmadığında (veya doğrudan devre dışı olduğunda), istemciler loopback Gateway bağlantı noktasını ileterek her zaman SSH üzerinden bağlanabilir.

Bkz. [Uzaktan erişim](/tr/gateway/remote).

## Taşıma seçimi (istemci ilkesi)

Önerilen istemci davranışı:

1. Eşleştirilmiş bir doğrudan uç nokta yapılandırılmış ve erişilebilirse bunu kullanın.
2. Aksi takdirde, keşif `local.` üzerinde veya yapılandırılmış geniş alan alan adında bir Gateway bulursa tek dokunuşla “Bu Gateway'i kullan” seçeneği sunun ve doğrudan uç nokta olarak kaydedin.
3. Aksi takdirde, bir tailnet DNS/IP yapılandırılmışsa doğrudan bağlantıyı deneyin.
   Tailnet/genel rotalardaki mobil Node'lar için doğrudan, düz metin uzak `ws://` değil, güvenli bir uç nokta anlamına gelir.
4. Aksi takdirde SSH'ye geri dönün.

## Eşleştirme + kimlik doğrulama (doğrudan taşıma)

Gateway, Node/istemci kabulü için doğruluk kaynağıdır.

- Eşleştirme istekleri Gateway içinde oluşturulur/onaylanır/reddedilir (bkz. [Gateway eşleştirme](/tr/gateway/pairing)).
- Gateway şunları uygular:
  - kimlik doğrulama (token / anahtar çifti)
  - kapsamlar/ACL'ler (Gateway her yönteme açık ham bir proxy değildir)
  - hız sınırları

## Bileşene göre sorumluluklar

- **Gateway**: keşif işaretlerini duyurur, eşleştirme kararlarına sahip olur ve WS uç noktasını barındırır.
- **macOS uygulaması**: bir Gateway seçmenize yardımcı olur, eşleştirme istemlerini gösterir ve SSH'yi yalnızca geri dönüş olarak kullanır.
- **iOS/Android Node'ları**: kolaylık için Bonjour'u tarar ve eşleştirilmiş Gateway WS'ye bağlanır.

## İlgili

- [Uzaktan erişim](/tr/gateway/remote)
- [Tailscale](/tr/gateway/tailscale)
- [Bonjour keşfi](/tr/gateway/bonjour)
