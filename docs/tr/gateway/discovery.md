---
read_when:
    - Bonjour keşfini/yayınını uygulama veya değiştirme
    - Uzak bağlantı modlarını ayarlama (doğrudan ve SSH)
    - Uzak node'lar için node keşfi + eşleştirme tasarlama
summary: Gateway'i bulmak için node keşfi ve taşımalar (Bonjour, Tailscale, SSH)
title: Keşif ve Taşımalar
x-i18n:
    generated_at: "2026-04-05T13:52:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: e76cca9279ca77b55e30d6e746f6325e5644134ef06b9c58f2cf3d793d092685
    source_path: gateway/discovery.md
    workflow: 15
---

# Keşif ve taşımalar

OpenClaw'ın yüzeyde benzer görünen ama aslında farklı iki problemi vardır:

1. **Operatör uzaktan kontrolü**: başka bir yerde çalışan bir gateway'i denetleyen macOS menü çubuğu uygulaması.
2. **Node eşleştirme**: iOS/Android'in (ve gelecekteki node'ların) bir gateway'i bulup güvenli biçimde eşleştirmesi.

Tasarım hedefi, tüm ağ keşfi/yayınını **Node Gateway** (`openclaw gateway`) içinde tutmak ve istemcileri (mac uygulaması, iOS) tüketici olarak bırakmaktır.

## Terimler

- **Gateway**: duruma sahip olan (oturumlar, eşleştirme, node registry) ve kanalları çalıştıran tek, uzun süre çalışan gateway süreci. Çoğu kurulumda ana makine başına bir tane kullanılır; yalıtılmış çoklu gateway kurulumları mümkündür.
- **Gateway WS (kontrol düzlemi)**: varsayılan olarak `127.0.0.1:18789` üzerindeki WebSocket uç noktası; `gateway.bind` ile LAN/tailnet'e bağlanabilir.
- **Doğrudan WS taşıması**: LAN/tailnet'e bakan bir Gateway WS uç noktası (SSH yok).
- **SSH taşıması (fallback)**: `127.0.0.1:18789` portunu SSH üzerinden yönlendirerek uzaktan kontrol.
- **Eski TCP bridge (kaldırıldı)**: eski node taşıması (bkz.
  [Bridge protocol](/gateway/bridge-protocol)); artık keşif için
  yayınlanmıyor ve mevcut derlemelerin bir parçası değil.

Protokol ayrıntıları:

- [Gateway protocol](/gateway/protocol)
- [Bridge protocol (legacy)](/gateway/bridge-protocol)

## Neden hem "doğrudan" hem de SSH'yi tutuyoruz

- **Doğrudan WS**, aynı ağda ve bir tailnet içinde en iyi UX'i sağlar:
  - Bonjour ile LAN üzerinde otomatik keşif
  - gateway'in sahibi olduğu eşleştirme token'ları + ACL'ler
  - shell erişimi gerekmez; protokol yüzeyi sıkı ve denetlenebilir kalabilir
- **SSH**, evrensel fallback olarak kalır:
  - SSH erişiminiz olan her yerde çalışır (ilişkisiz ağlar arasında bile)
  - multicast/mDNS sorunlarına dayanır
  - SSH dışında yeni bir gelen bağlantı portu gerektirmez

## Keşif girdileri (istemciler gateway'in nerede olduğunu nasıl öğrenir)

### 1) Bonjour / DNS-SD keşfi

Multicast Bonjour en iyi çaba esaslıdır ve ağlar arasında geçmez. OpenClaw ayrıca yapılandırılmış bir wide-area DNS-SD etki alanı üzerinden aynı gateway beacon'ını tarayabilir; böylece keşif şunları kapsayabilir:

- aynı LAN üzerindeki `local.`
- ağlar arası keşif için yapılandırılmış bir unicast DNS-SD etki alanı

Hedef yön:

- **gateway**, WS uç noktasını Bonjour ile yayınlar.
- İstemciler tarama yapar, bir “gateway seç” listesi gösterir ve sonra seçilen uç noktayı saklar.

Sorun giderme ve beacon ayrıntıları: [Bonjour](/gateway/bonjour).

#### Hizmet beacon ayrıntıları

- Hizmet türleri:
  - `_openclaw-gw._tcp` (gateway taşıma beacon'ı)
- TXT anahtarları (gizli değil):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (operatör tarafından yapılandırılmış görünen ad)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (yalnızca TLS etkin olduğunda)
  - `gatewayTlsSha256=<sha256>` (yalnızca TLS etkin olduğunda ve parmak izi mevcutsa)
  - `canvasPort=<port>` (canvas host portu; şu anda canvas host etkin olduğunda `gatewayPort` ile aynıdır)
  - `tailnetDns=<magicdns>` (isteğe bağlı ipucu; Tailscale kullanılabiliyorsa otomatik algılanır)
  - `sshPort=<port>` (yalnızca mDNS tam modunda; wide-area DNS-SD bunu atlayabilir, bu durumda SSH varsayılanları `22` olarak kalır)
  - `cliPath=<path>` (yalnızca mDNS tam modunda; wide-area DNS-SD bunu yine de uzak kurulum ipucu olarak yazar)

Güvenlik notları:

- Bonjour/mDNS TXT kayıtları **kimliği doğrulanmamıştır**. İstemciler TXT değerlerini yalnızca UX ipuçları olarak ele almalıdır.
- Yönlendirme (host/port) için TXT üzerinden sağlanan `lanHost`, `tailnetDns` veya `gatewayPort` yerine **çözümlenmiş hizmet uç noktası** (SRV + A/AAAA) tercih edilmelidir.
- TLS pinning, yayınlanan bir `gatewayTlsSha256` değerinin daha önce saklanmış bir pini geçersiz kılmasına asla izin vermemelidir.
- iOS/Android node'ları, seçilen rota güvenli/TLS tabanlı olduğunda ilk kez alınan bir pini saklamadan önce açık bir “bu parmak izine güven” onayı istemelidir (bant dışı doğrulama).

Devre dışı bırakma/geçersiz kılma:

- `OPENCLAW_DISABLE_BONJOUR=1`, yayını devre dışı bırakır.
- `~/.openclaw/openclaw.json` içindeki `gateway.bind`, Gateway bind modunu denetler.
- `OPENCLAW_SSH_PORT`, `sshPort` gönderildiğinde yayınlanan SSH portunu geçersiz kılar.
- `OPENCLAW_TAILNET_DNS`, bir `tailnetDns` ipucu (MagicDNS) yayınlar.
- `OPENCLAW_CLI_PATH`, yayınlanan CLI yolunu geçersiz kılar.

### 2) Tailnet (ağlar arası)

Londra/Viyana tarzı kurulumlarda Bonjour yardımcı olmaz. Önerilen “doğrudan” hedef şudur:

- Tailscale MagicDNS adı (tercih edilir) veya sabit bir tailnet IP'si.

Gateway, Tailscale altında çalıştığını algılayabiliyorsa istemciler için (wide-area beacon'lar dahil) isteğe bağlı bir ipucu olarak `tailnetDns` yayınlar.

macOS uygulaması artık gateway keşfi için ham Tailscale IP'leri yerine MagicDNS adlarını tercih eder. Bu, tailnet IP'leri değiştiğinde (örneğin node yeniden başlatmaları veya CGNAT yeniden ataması sonrası) güvenilirliği artırır; çünkü MagicDNS adları her zaman geçerli IP'ye otomatik çözülür.

Mobil node eşleştirmesi için keşif ipuçları tailnet/genel rotalarda taşıma güvenliğini gevşetmez:

- iOS/Android yine de güvenli bir ilk tailnet/genel bağlantı yolu gerektirir (`wss://` veya Tailscale Serve/Funnel).
- Keşfedilmiş bir ham tailnet IP'si bir yönlendirme ipucudur; düz metin uzak `ws://` kullanma izni değildir.
- Özel LAN doğrudan bağlantı `ws://` desteği devam eder.
- Mobil node'lar için en basit Tailscale yolunu istiyorsanız Tailscale Serve kullanın; böylece hem keşif hem de kurulum kodu aynı güvenli MagicDNS uç noktasına çözümlenir.

### 3) El ile / SSH hedefi

Doğrudan bir rota olmadığında (veya doğrudan bağlantı devre dışıysa), istemciler loopback gateway portunu yönlendirerek her zaman SSH ile bağlanabilir.

Bkz. [Remote access](/gateway/remote).

## Taşıma seçimi (istemci politikası)

Önerilen istemci davranışı:

1. Eşleştirilmiş bir doğrudan uç nokta yapılandırılmış ve erişilebilir durumdaysa onu kullanın.
2. Aksi hâlde keşif, `local.` veya yapılandırılmış wide-area etki alanında bir gateway bulursa tek dokunuşla “Bu gateway'i kullan” seçeneği sunun ve bunu doğrudan uç nokta olarak kaydedin.
3. Aksi hâlde bir tailnet DNS/IP yapılandırılmışsa doğrudan bağlantıyı deneyin.
   Tailnet/genel rotalardaki mobil node'lar için doğrudan bağlantı, düz metin uzak `ws://` değil, güvenli bir uç nokta anlamına gelir.
4. Aksi hâlde SSH'ye geri dönün.

## Eşleştirme + auth (doğrudan taşıma)

Node/istemci kabulü için doğruluk kaynağı gateway'dir.

- Eşleştirme istekleri gateway içinde oluşturulur/onaylanır/reddedilir (bkz. [Gateway pairing](/gateway/pairing)).
- Gateway şunları uygular:
  - auth (token / anahtar çifti)
  - kapsamlar/ACL'ler (gateway her yönteme giden ham bir proxy değildir)
  - hız sınırları

## Bileşene göre sorumluluklar

- **Gateway**: keşif beacon'larını yayınlar, eşleştirme kararlarının sahibidir ve WS uç noktasını barındırır.
- **macOS app**: bir gateway seçmenize yardımcı olur, eşleştirme istemlerini gösterir ve SSH'yi yalnızca fallback olarak kullanır.
- **iOS/Android node'ları**: kolaylık için Bonjour'u tarar ve eşleştirilmiş Gateway WS'ye bağlanır.
