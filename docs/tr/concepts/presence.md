---
read_when:
    - Instances sekmesinde hata ayıklarken
    - Yinelenen veya eski instance satırlarını incelerken
    - Ağ geçidi WS connect veya system-event beacon'larını değiştirirken
summary: OpenClaw presence girdilerinin nasıl üretildiği, birleştirildiği ve görüntülendiği
title: Presence
x-i18n:
    generated_at: "2026-04-05T13:51:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: a004a1f87be08699c1b2cba97cad8678ce5e27baa425f59eaa18006fdcff26e7
    source_path: concepts/presence.md
    workflow: 15
---

# Presence

OpenClaw “presence”, şu öğelerin hafif ve en iyi çabayla oluşturulan bir görünümüdür:

- **Ağ Geçidi**'nin kendisi ve
- **Ağ Geçidi'ne bağlı istemciler** (mac uygulaması, WebChat, CLI vb.)

Presence öncelikle macOS uygulamasındaki **Instances** sekmesini oluşturmak ve
operatöre hızlı görünürlük sağlamak için kullanılır.

## Presence alanları (neler görünür)

Presence girdileri şu gibi alanlara sahip yapılandırılmış nesnelerdir:

- `instanceId` (isteğe bağlıdır ama güçlü şekilde önerilir): kararlı istemci kimliği (genellikle `connect.client.instanceId`)
- `host`: insan dostu ana makine adı
- `ip`: en iyi çabayla elde edilen IP adresi
- `version`: istemci sürüm dizesi
- `deviceFamily` / `modelIdentifier`: donanım ipuçları
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: “son kullanıcı girişinden bu yana geçen saniye” (biliniyorsa)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: son güncelleme zaman damgası (epoch'tan beri ms)

## Üreticiler (presence nereden gelir)

Presence girdileri birden çok kaynak tarafından üretilir ve **birleştirilir**.

### 1) Ağ Geçidi self girdisi

Ağ Geçidi, UI'ların herhangi bir istemci bağlanmadan önce bile ağ geçidi ana makinesini göstermesi için başlangıçta her zaman bir “self” girdisi oluşturur.

### 2) WebSocket connect

Her WS istemcisi bir `connect` isteğiyle başlar. Başarılı el sıkışmadan sonra
Ağ Geçidi bu bağlantı için bir presence girdisini upsert eder.

#### Tek seferlik CLI komutları neden görünmez

CLI genellikle kısa süreli, tek seferlik komutlar için bağlanır. Instances listesini gereksiz yere doldurmamak için
`client.mode === "cli"` bir presence girdisine **dönüştürülmez**.

### 3) `system-event` beacon'ları

İstemciler `system-event` yöntemi üzerinden daha zengin, periyodik beacon'lar gönderebilir. mac
uygulaması bunu ana makine adı, IP ve `lastInputSeconds` bildirmek için kullanır.

### 4) Düğüm bağlantıları (`role: node`)

Bir düğüm, Ağ Geçidi WebSocket'i üzerinden `role: node` ile bağlandığında Ağ Geçidi
o düğüm için bir presence girdisini upsert eder (diğer WS istemcileriyle aynı akış).

## Birleştirme + yineleme kaldırma kuralları (`instanceId` neden önemlidir)

Presence girdileri tek bir bellek içi eşlemde saklanır:

- Girdiler bir **presence anahtarı** ile anahtarlanır.
- En iyi anahtar, yeniden başlatmalarda da kalan kararlı bir `instanceId`'dir (`connect.client.instanceId` içinden).
- Anahtarlar büyük/küçük harfe duyarsızdır.

Bir istemci kararlı bir `instanceId` olmadan yeniden bağlanırsa
**yinelenen** bir satır olarak görünebilir.

## TTL ve sınırlı boyut

Presence kasıtlı olarak geçicidir:

- **TTL:** 5 dakikadan eski girdiler budanır
- **Maksimum girdi:** 200 (önce en eskiler düşürülür)

Bu, listenin taze kalmasını sağlar ve sınırsız bellek büyümesini önler.

## Uzak/tünel uyarısı (loopback IP'leri)

Bir istemci SSH tüneli / yerel port yönlendirmesi üzerinden bağlandığında Ağ Geçidi
uzak adresi `127.0.0.1` olarak görebilir. İstemci tarafından bildirilen iyi bir
IP'nin üzerine yazmamak için loopback uzak adresleri yok sayılır.

## Tüketiciler

### macOS Instances sekmesi

macOS uygulaması `system-presence` çıktısını oluşturur ve son güncellemenin yaşına göre
küçük bir durum göstergesi uygular (Active/Idle/Stale).

## Hata ayıklama ipuçları

- Ham listeyi görmek için Ağ Geçidi'ne karşı `system-presence` çağrısı yapın.
- Yinelenenler görüyorsanız:
  - istemcilerin el sıkışmada kararlı bir `client.instanceId` gönderdiğini doğrulayın
  - periyodik beacon'ların aynı `instanceId` değerini kullandığını doğrulayın
  - bağlantıdan türetilen girdide `instanceId` eksik mi kontrol edin (yinelenenler beklenir)
