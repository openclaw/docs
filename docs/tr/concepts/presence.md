---
read_when:
    - Instances sekmesinde hata ayıklama
    - Yinelenen veya eski örnek satırlarını araştırma
    - Gateway WS bağlantısını veya sistem olay işaretçilerini değiştirme
summary: OpenClaw varlık girdilerinin nasıl üretildiği, birleştirildiği ve görüntülendiği
title: Varlık durumu
x-i18n:
    generated_at: "2026-04-24T09:06:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f33a7d4a3d5e5555c68a7503b3a4f75c12db94d260e5546cfc26ca8a12de0f9
    source_path: concepts/presence.md
    workflow: 15
---

OpenClaw “varlık durumu”, şu öğelerin hafif ve en iyi çabayla sunulan bir görünümüdür:

- **Gateway**'in kendisi, ve
- **Gateway'e bağlı istemciler** (mac uygulaması, WebChat, CLI vb.)

Varlık durumu öncelikle macOS uygulamasının **Instances** sekmesini oluşturmak ve
operatöre hızlı görünürlük sağlamak için kullanılır.

## Varlık durumu alanları (gösterilenler)

Varlık durumu girdileri şu alanlara sahip yapılandırılmış nesnelerdir:

- `instanceId` (isteğe bağlı ama şiddetle önerilir): kararlı istemci kimliği (genellikle `connect.client.instanceId`)
- `host`: insan dostu ana makine adı
- `ip`: en iyi çabayla IP adresi
- `version`: istemci sürüm dizesi
- `deviceFamily` / `modelIdentifier`: donanım ipuçları
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: “son kullanıcı girişinden bu yana geçen saniye” (biliniyorsa)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: son güncelleme zaman damgası (epoch'tan beri ms)

## Üreticiler (varlık durumunun geldiği yerler)

Varlık durumu girdileri birden çok kaynak tarafından üretilir ve **birleştirilir**.

### 1) Gateway kendi girdisi

Gateway, kullanıcı arayüzlerinin herhangi bir istemci bağlanmadan önce bile gateway ana makinesini göstermesi için
başlangıçta her zaman bir “self” girdisi oluşturur.

### 2) WebSocket bağlantısı

Her WS istemcisi bir `connect` isteğiyle başlar. Başarılı el sıkışmadan sonra
Gateway, bu bağlantı için bir varlık durumu girdisini upsert eder.

#### Tek seferlik CLI komutları neden görünmez

CLI genellikle kısa, tek seferlik komutlar için bağlanır. Instances listesini
spamlememek için `client.mode === "cli"` bir varlık durumu girdisine dönüştürülmez.

### 3) `system-event` işaretçileri

İstemciler `system-event` yöntemi üzerinden daha zengin periyodik işaretçiler gönderebilir. mac
uygulaması bunu ana makine adını, IP'yi ve `lastInputSeconds` değerini bildirmek için kullanır.

### 4) Node bağlantıları (rol: node)

Bir Node, Gateway WebSocket üzerinden `role: node` ile bağlandığında, Gateway
o Node için bir varlık durumu girdisini upsert eder (diğer WS istemcileriyle aynı akış).

## Birleştirme + tekilleştirme kuralları (`instanceId` neden önemlidir)

Varlık durumu girdileri tek bir bellek içi eşlemde saklanır:

- Girdiler bir **varlık durumu anahtarı** ile anahtarlanır.
- En iyi anahtar, yeniden başlatmalardan sağ çıkan kararlı bir `instanceId` değeridir (`connect.client.instanceId` içinden).
- Anahtarlar büyük/küçük harfe duyarsızdır.

Bir istemci kararlı bir `instanceId` olmadan yeniden bağlanırsa,
**yinelenen** bir satır olarak görünebilir.

## TTL ve sınırlı boyut

Varlık durumu bilinçli olarak geçicidir:

- **TTL:** 5 dakikadan eski girdiler temizlenir
- **Maksimum girdi:** 200 (önce en eski olanlar silinir)

Bu, listenin taze kalmasını sağlar ve sınırsız bellek büyümesini önler.

## Uzak/tünel uyarısı (loopback IP'leri)

Bir istemci SSH tüneli / yerel port yönlendirmesi üzerinden bağlandığında, Gateway
uzak adresi `127.0.0.1` olarak görebilir. İstemcinin bildirdiği iyi bir
IP'nin üzerine yazmayı önlemek için loopback uzak adresleri yok sayılır.

## Tüketiciler

### macOS Instances sekmesi

macOS uygulaması `system-presence` çıktısını işler ve son güncellemenin yaşına göre
küçük bir durum göstergesi uygular (Etkin/Boşta/Eski).

## Hata ayıklama ipuçları

- Ham listeyi görmek için Gateway'e karşı `system-presence` çağrısı yapın.
- Yinelenen kayıtlar görürseniz:
  - istemcilerin el sıkışmada kararlı bir `client.instanceId` gönderdiğini doğrulayın
  - periyodik işaretçilerin aynı `instanceId` değerini kullandığını doğrulayın
  - bağlantıdan türetilen girdide `instanceId` eksik olup olmadığını kontrol edin (yinelenmeler beklenir)

## İlgili

- [Yazıyor göstergeleri](/tr/concepts/typing-indicators)
- [Akış ve parçalama](/tr/concepts/streaming)
