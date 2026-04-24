---
read_when:
    - Bonjour keşfi/duyurusu uygulama veya değiştirme
    - Uzak bağlantı modlarını ayarlama (doğrudan ve SSH)
    - Uzak Node'lar için Node keşfi + eşleştirme tasarlama
summary: Gateway'i bulmak için Node keşfi ve taşımalar (Bonjour, Tailscale, SSH)
title: Keşif ve taşımalar
x-i18n:
    generated_at: "2026-04-24T09:09:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 684e5aeb1f74a90bf8689f8b25830be2c9e497fcdeda390d98f204d7cb4134b8
    source_path: gateway/discovery.md
    workflow: 15
---

# Keşif ve taşımalar

OpenClaw'ın yüzeyde benzer görünen ama aslında farklı olan iki ayrı problemi vardır:

1. **Operatör uzaktan denetimi**: macOS menü çubuğu uygulamasının başka bir yerde çalışan bir Gateway'i denetlemesi.
2. **Node eşleştirme**: iOS/Android (ve gelecekteki Node'lar) için bir Gateway bulma ve güvenli şekilde eşleştirme.

Tasarım hedefi, tüm ağ keşfi/duyurusunu **Node Gateway** (`openclaw gateway`) içinde tutmak ve istemcileri (mac uygulaması, iOS) yalnızca tüketici olarak bırakmaktır.

## Terimler

- **Gateway**: durumu (oturumlar, eşleştirme, Node kayıt defteri) sahiplenen ve kanalları çalıştıran tek, uzun ömürlü Gateway süreci. Kurulumların çoğu ana makine başına bir tane kullanır; yalıtılmış çoklu Gateway kurulumları mümkündür.
- **Gateway WS (kontrol düzlemi)**: varsayılan olarak `127.0.0.1:18789` üzerindeki WebSocket uç noktası; `gateway.bind` ile LAN/tailnet'e bağlanabilir.
- **Doğrudan WS taşıması**: LAN/tailnet'e açık Gateway WS uç noktası (SSH yok).
- **SSH taşıması (yedek)**: `127.0.0.1:18789` bağlantı noktasını SSH üzerinden ileterek uzaktan denetim.
- **Eski TCP köprüsü (kaldırıldı)**: eski Node taşıması (bkz.
  [Köprü protokolü](/tr/gateway/bridge-protocol)); artık
  keşif için duyurulmaz ve güncel derlemelerin parçası değildir.

Protokol ayrıntıları:

- [Gateway protokolü](/tr/gateway/protocol)
- [Köprü protokolü (eski)](/tr/gateway/bridge-protocol)

## Neden hem "doğrudan" hem de SSH kullanıyoruz

- **Doğrudan WS**, aynı ağda ve bir tailnet içinde en iyi UX'tir:
  - Bonjour ile LAN üzerinde otomatik keşif
  - Gateway'in sahip olduğu eşleştirme token'ları + ACL'ler
  - kabuk erişimi gerekmez; protokol yüzeyi dar ve denetlenebilir kalabilir
- **SSH**, evrensel yedek olarak kalır:
  - SSH erişiminiz olan her yerde çalışır (birbiriyle alakasız ağlarda bile)
  - çok noktaya yayın/mDNS sorunlarını aşar
  - SSH dışında yeni gelen bağlantı noktaları gerektirmez

## Keşif girdileri (istemciler Gateway'in nerede olduğunu nasıl öğrenir)

### 1) Bonjour / DNS-SD keşfi

Çok noktaya yayın Bonjour en iyi çaba esaslıdır ve ağları aşmaz. OpenClaw aynı Gateway işaretçisini yapılandırılmış bir geniş alan DNS-SD etki alanı üzerinden de tarayabilir; böylece keşif şu kapsamları içerebilir:

- aynı LAN'da `local.`
- ağlar arası keşif için yapılandırılmış bir unicast DNS-SD etki alanı

Hedef yönü:

- **Gateway**, WS uç noktasını Bonjour üzerinden duyurur.
- İstemciler tarar ve “bir Gateway seç” listesi gösterir, sonra seçilen uç noktayı kaydeder.

Sorun giderme ve işaretçi ayrıntıları: [Bonjour](/tr/gateway/bonjour).

#### Hizmet işaretçisi ayrıntıları

- Hizmet türleri:
  - `_openclaw-gw._tcp` (Gateway taşıma işaretçisi)
- TXT anahtarları (gizli olmayan):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (operatör tarafından yapılandırılan görünen ad)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (yalnızca TLS etkin olduğunda)
  - `gatewayTlsSha256=<sha256>` (yalnızca TLS etkin olduğunda ve parmak izi mevcutsa)
  - `canvasPort=<port>` (canvas ana makinesi bağlantı noktası; canvas ana makinesi etkin olduğunda şu anda `gatewayPort` ile aynıdır)
  - `tailnetDns=<magicdns>` (isteğe bağlı ipucu; Tailscale mevcutsa otomatik algılanır)
  - `sshPort=<port>` (yalnızca mDNS tam modunda; geniş alan DNS-SD bunu atlayabilir, bu durumda SSH varsayılanı `22` olarak kalır)
  - `cliPath=<path>` (yalnızca mDNS tam modunda; geniş alan DNS-SD bunu yine uzak kurulum ipucu olarak yazar)

Güvenlik notları:

- Bonjour/mDNS TXT kayıtları **kimliği doğrulanmamıştır**. İstemciler TXT değerlerini yalnızca UX ipuçları olarak değerlendirmelidir.
- Yönlendirme (ana makine/bağlantı noktası), TXT ile sağlanan `lanHost`, `tailnetDns` veya `gatewayPort` yerine **çözümlenen hizmet uç noktasını** (SRV + A/AAAA) tercih etmelidir.
- TLS pinning, duyurulan `gatewayTlsSha256` değerinin daha önce depolanmış bir pini geçersiz kılmasına asla izin vermemelidir.
- iOS/Android Node'ları, seçilen yol güvenli/TLS tabanlıysa ilk kez görülen bir pini kaydetmeden önce açık bir “bu parmak izine güven” onayı (bant dışı doğrulama) istemelidir.

Devre dışı bırakma/geçersiz kılma:

- `OPENCLAW_DISABLE_BONJOUR=1` duyuruyu devre dışı bırakır.
- `~/.openclaw/openclaw.json` içindeki `gateway.bind`, Gateway bağlama modunu kontrol eder.
- `OPENCLAW_SSH_PORT`, `sshPort` yayımlandığında duyurulan SSH bağlantı noktasını geçersiz kılar.
- `OPENCLAW_TAILNET_DNS`, bir `tailnetDns` ipucu (MagicDNS) yayımlar.
- `OPENCLAW_CLI_PATH`, duyurulan CLI yolunu geçersiz kılar.

### 2) Tailnet (ağlar arası)

Londra/Viyana tarzı kurulumlarda Bonjour yardımcı olmaz. Önerilen “doğrudan” hedef şudur:

- Tailscale MagicDNS adı (tercih edilen) veya kararlı bir tailnet IP'si.

Gateway, Tailscale altında çalıştığını algılayabiliyorsa, istemciler için (geniş alan işaretçileri dahil) isteğe bağlı ipucu olarak `tailnetDns` yayımlar.

macOS uygulaması artık Gateway keşfi için ham Tailscale IP'leri yerine MagicDNS adlarını tercih eder. Bu, tailnet IP'leri değiştiğinde (örneğin Node yeniden başlatmalarından veya CGNAT yeniden atamasından sonra) güvenilirliği artırır; çünkü MagicDNS adları otomatik olarak geçerli IP'ye çözülür.

Mobil Node eşleştirmesi için keşif ipuçları, tailnet/genel yollarda taşıma güvenliğini gevşetmez:

- iOS/Android yine güvenli bir ilk kez tailnet/genel bağlantı yolu gerektirir (`wss://` veya Tailscale Serve/Funnel).
- Keşfedilen ham bir tailnet IP'si, yönlendirme ipucudur; düz metin uzak `ws://` kullanma izni değildir.
- Özel LAN doğrudan bağlantı `ws://` desteklenmeye devam eder.
- Mobil Node'lar için en basit Tailscale yolunu istiyorsanız, keşif ve kurulum kodunun aynı güvenli MagicDNS uç noktasına çözülmesi için Tailscale Serve kullanın.

### 3) El ile / SSH hedefi

Doğrudan yol olmadığında (veya doğrudan yol devre dışı bırakıldığında), istemciler loopback Gateway bağlantı noktasını ileterek her zaman SSH üzerinden bağlanabilir.

Bkz. [Uzaktan erişim](/tr/gateway/remote).

## Taşıma seçimi (istemci politikası)

Önerilen istemci davranışı:

1. Eşleştirilmiş bir doğrudan uç nokta yapılandırılmış ve erişilebilir durumdaysa onu kullanın.
2. Aksi halde, keşif `local.` veya yapılandırılmış geniş alan etki alanında bir Gateway bulursa, tek dokunuşla “Bu Gateway'i kullan” seçeneği sunun ve bunu doğrudan uç nokta olarak kaydedin.
3. Aksi halde, bir tailnet DNS/IP yapılandırılmışsa doğrudan bağlantıyı deneyin.
   Tailnet/genel yollardaki mobil Node'lar için doğrudan bağlantı, düz metin uzak `ws://` değil, güvenli uç nokta anlamına gelir.
4. Aksi halde SSH'ye geri dönün.

## Eşleştirme + kimlik doğrulama (doğrudan taşıma)

Node/istemci kabulü için doğruluk kaynağı Gateway'dir.

- Eşleştirme istekleri Gateway'de oluşturulur/onaylanır/reddedilir (bkz. [Gateway eşleştirme](/tr/gateway/pairing)).
- Gateway şunları uygular:
  - kimlik doğrulama (token / anahtar çifti)
  - kapsamlar/ACL'ler (Gateway her yönteme ham proxy değildir)
  - hız sınırları

## Bileşenlere göre sorumluluklar

- **Gateway**: keşif işaretçilerini duyurur, eşleştirme kararlarının sahibidir ve WS uç noktasını barındırır.
- **macOS uygulaması**: bir Gateway seçmenize yardımcı olur, eşleştirme istemlerini gösterir ve SSH'yi yalnızca yedek olarak kullanır.
- **iOS/Android Node'ları**: kolaylık için Bonjour tarar ve eşleştirilmiş Gateway WS'ye bağlanır.

## İlgili

- [Uzaktan erişim](/tr/gateway/remote)
- [Tailscale](/tr/gateway/tailscale)
- [Bonjour keşfi](/tr/gateway/bonjour)
