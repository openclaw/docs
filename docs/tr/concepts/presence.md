---
read_when:
    - Control UI Cihazlar sayfasında canlı durum hatalarını ayıklama
    - Yinelenen veya güncelliğini yitirmiş örnek satırlarını araştırma
    - Gateway WS bağlantısını veya sistem olayı işaretlerini değiştirme
summary: OpenClaw iletişim durumu girdilerinin nasıl üretildiği, birleştirildiği ve görüntülendiği
title: Varlık
x-i18n:
    generated_at: "2026-07-16T16:56:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b50291e26ddc06fac888847c9e94eba5f9351b1b8d06c55fd6bec16a38d0b6a5
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw "presence", aşağıdakilerin hafif ve azami gayret esaslı bir görünümüdür:

- **Gateway**'in kendisi ve
- **Gateway'e bağlı, kullanıcı tarafından görülebilen istemciler** (Mac uygulaması, WebChat, Node'lar vb.)

Presence, canlı bağlantı meta verilerini Control UI'ın **Devices** sayfasında
(**Settings → Devices** altında) ve macOS uygulamasının **Instances** sekmesinde görüntüler.

Bu sayfa Gateway istemci listesini ele alır. En son kullandığınız Mac'i algılamak
ve Node uyarılarını oraya yönlendirmek için
[Etkin bilgisayar presence'ı](/nodes/presence) bölümüne bakın.

## Presence alanları (görüntülenenler)

Presence girdileri, aşağıdakilere benzer alanlara sahip yapılandırılmış nesnelerdir:

- `instanceId` (isteğe bağlıdır ancak önemle önerilir): kararlı istemci kimliği (genellikle `connect.client.instanceId`)
- `host`: kullanıcı dostu ana makine adı
- `ip`: azami gayret esaslı IP adresi
- `version`: istemci sürümü dizesi
- `deviceFamily` / `modelIdentifier`: donanım ipuçları
- `mode`: `ui`, `webchat`, `cli`, `backend`, `node`, `probe`, `test`
- `lastInputSeconds`: biliniyorsa son kullanıcı girişinden bu yana geçen saniye
- `reason`: istemci tarafından sağlanan serbest biçimli dize; Gateway'in kendisi yalnızca `self`, `connect` ve `disconnect` değerlerini yayınlar
- `deviceId`, `roles`, `scopes`: bağlantı el sıkışmasından gelen cihaz kimliği ve rol/kapsam ipuçları
- `ts`: son güncelleme zaman damgası (epoktan bu yana ms)

## Üreticiler (presence'ın kaynakları)

Presence girdileri birden çok kaynak tarafından üretilir ve **birleştirilir**.

### 1) Gateway öz girdisi

Gateway, henüz hiçbir istemci bağlanmadan bile kullanıcı arayüzlerinin Gateway ana
makinesini gösterebilmesi için başlangıçta her zaman bir "öz" girdisi oluşturur.

### 2) WebSocket bağlantısı

Her WS istemcisi bir `connect` isteğiyle başlar. El sıkışma başarıyla tamamlandığında
Gateway, bu bağlantının presence girdisini ekler veya günceller.

#### Geçici kontrol düzlemi bağlantıları neden görünmez?

CLI komutları, arka uç RPC istemcileri ve yoklamalar genellikle kısa süreliğine bağlanır. Bu
hareketliliğin presence TTL süresinin tamamı boyunca tutulmasını önlemek için `cli`, `backend`
veya `probe` modundaki istemciler presence girdilerine **dönüştürülmez**. Test modu istemcileri,
test paketleri bunları gerçek istemcilerin yerine kullandığından izlenmeye devam eder.

### 3) `system-event` işaretleri

İstemciler `system-event` yöntemi aracılığıyla daha zengin periyodik işaretler gönderebilir. Mac
uygulaması bunu ana makine adını, IP'yi ve `lastInputSeconds` değerini bildirmek için kullanır.

### 4) Node bağlantıları (rol: node)

Bir Node, `role: node` ile Gateway WebSocket üzerinden bağlandığında Gateway,
bu Node için bir presence girdisi ekler veya günceller (diğer WS istemcileriyle aynı akış).

## Birleştirme + yinelenenleri kaldırma kuralları (`instanceId` neden önemlidir?)

Presence girdileri, sırasıyla ilk kullanılabilir olan eşleştirilmiş cihaz kimliği,
`connect.client.instanceId` veya son çare olarak bağlantı başına kimlik temelinde, büyük-küçük
harf duyarsız anahtarlanan tek bir bellek içi eşlemde depolanır.

Geçici kontrol düzlemi istemcileri izlemenin tamamen dışında bırakılır (yukarıya
bakın), dolayısıyla bağlantı kimlikleri hiçbir zaman anahtara dönüşmez. Diğer tüm istemcilerde
bağlantı kimliğine geri dönüş, kararlı bir `instanceId` olmadan yeniden bağlanan bir istemcinin
**yinelenen** bir satır olarak görünmesine neden olur.

## TTL ve sınırlı boyut

Presence kasıtlı olarak geçicidir:

- **TTL:** 5 dakikadan eski girdiler budanır
- **Azami girdi:** 200 (önce en eskiler kaldırılır)

Bu, listenin güncel kalmasını sağlar ve sınırsız bellek büyümesini önler.

## Uzak bağlantı/tünel uyarısı (geri döngü IP'leri)

Bir istemci SSH tüneli / yerel port yönlendirmesi üzerinden bağlandığında Gateway,
uzak adresi `127.0.0.1` olarak görebilir. Bu tünel adresinin istemcinin IP'si
olarak kaydedilmesini önlemek için bağlantı işleme, geri döngü adresini girdiye
yazmak yerine yerel olduğu algılanan (geri döngü) istemcilerde `ip` alanını tamamen atlar.

## Tüketiciler

### Control UI Devices sayfası

**Devices** sayfası, `system-presence` verilerini kalıcı eşleştirme ve Node
kayıtlarıyla birleştirir. Gateway öz işaretini ilk sıraya sabitler ve canlı platform,
sürüm, model ve giriş güncelliği meta verileri için eşleşen cihaz veya örnek kimliklerini kullanır.

### macOS Instances sekmesi

macOS uygulaması, `system-presence` çıktısını görüntüler ve son güncellemenin yaşına
göre küçük bir durum göstergesi (Etkin/Boşta/Eski) uygular.

## Hata ayıklama ipuçları

- Ham listeyi görmek için Gateway'de `system-presence` çağrısı yapın.
- Yinelenen girdiler görüyorsanız:
  - istemcilerin el sıkışmada kararlı bir `client.instanceId` gönderdiğini doğrulayın
  - periyodik işaretlerin aynı `instanceId` değerini kullandığını doğrulayın
  - bağlantıdan türetilen girdide `instanceId` alanının eksik olup olmadığını kontrol edin (yinelenen girdiler beklenir)

## İlgili

<CardGroup cols={2}>
  <Card title="Etkin bilgisayar presence'ı" href="/nodes/presence" icon="computer-mouse">
    Fiziksel Mac girişinin etkin bir Node'u nasıl seçtiği ve bağlantı uyarılarını nasıl yönlendirdiği.
  </Card>
  <Card title="Yazıyor göstergeleri" href="/tr/concepts/typing-indicators" icon="ellipsis">
    Yazıyor göstergelerinin ne zaman gönderildiği ve bunların nasıl ayarlanacağı.
  </Card>
  <Card title="Akış ve parçalara ayırma" href="/tr/concepts/streaming" icon="bars-staggered">
    Giden akış, parçalara ayırma ve kanal başına biçimlendirme.
  </Card>
  <Card title="Gateway mimarisi" href="/tr/concepts/architecture" icon="diagram-project">
    Gateway bileşenleri ve presence güncellemelerini yönlendiren WebSocket protokolü.
  </Card>
  <Card title="Gateway protokolü" href="/tr/gateway/protocol" icon="plug">
    `connect`, `system-event` ve `system-presence` için kablo protokolü.
  </Card>
</CardGroup>
