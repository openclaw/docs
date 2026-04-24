---
read_when:
    - macOS kullanıcı arayüzü olmadan Node eşleştirme onaylarını uygulama
    - Uzak Node'ları onaylamak için CLI akışları ekleme
    - Gateway protokolünü Node yönetimiyle genişletme
summary: iOS ve diğer uzak Node'lar için Gateway'e ait Node eşleştirmesi (Seçenek B)
title: Gateway'e ait eşleştirme
x-i18n:
    generated_at: "2026-04-24T09:10:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42e1e927db9dd28c8a37881c5b014809e6286ffc00efe6f1a86dd2d55d360c09
    source_path: gateway/pairing.md
    workflow: 15
---

# Gateway'e ait eşleştirme (Seçenek B)

Gateway'e ait eşleştirmede, hangi Node'ların katılmasına izin verildiğinin
doğruluk kaynağı **Gateway**'dir. Kullanıcı arayüzleri (macOS uygulaması, gelecekteki istemciler)
yalnızca bekleyen istekleri onaylayan veya reddeden ön yüzlerdir.

**Önemli:** WS Node'ları `connect` sırasında **cihaz eşleştirmesi**ni (rol `node`) kullanır.
`node.pair.*` ayrı bir eşleştirme deposudur ve WS el sıkışmasını geçitlemez.
Bu akışı yalnızca açıkça `node.pair.*` çağıran istemciler kullanır.

## Kavramlar

- **Bekleyen istek**: bir Node katılmak istedi; onay gerekir.
- **Eşleştirilmiş Node**: kimlik doğrulama belirteci verilmiş onaylı Node.
- **Taşıma**: Gateway WS uç noktası istekleri iletir ancak
  üyeliğe karar vermez. (Eski TCP köprüsü desteği kaldırılmıştır.)

## Eşleştirme nasıl çalışır

1. Bir Node, Gateway WS'ye bağlanır ve eşleştirme ister.
2. Gateway bir **bekleyen istek** saklar ve `node.pair.requested` yayar.
3. İsteği onaylar veya reddedersiniz (CLI veya kullanıcı arayüzü).
4. Onaylandığında, Gateway **yeni bir belirteç** verir (yeniden eşleştirmede belirteçler döndürülür).
5. Node belirteçle yeniden bağlanır ve artık “eşleştirilmiş” olur.

Bekleyen isteklerin süresi **5 dakika** sonra otomatik olarak dolar.

## CLI iş akışı (başsız kullanım dostu)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status`, eşleştirilmiş/bağlı Node'ları ve yeteneklerini gösterir.

## API yüzeyi (gateway protokolü)

Olaylar:

- `node.pair.requested` — yeni bir bekleyen istek oluşturulduğunda yayılır.
- `node.pair.resolved` — bir istek onaylandığında/reddedildiğinde/süresi dolduğunda yayılır.

Yöntemler:

- `node.pair.request` — bekleyen bir istek oluşturur veya yeniden kullanır.
- `node.pair.list` — bekleyen + eşleştirilmiş Node'ları listeler (`operator.pairing`).
- `node.pair.approve` — bekleyen bir isteği onaylar (belirteç verir).
- `node.pair.reject` — bekleyen bir isteği reddeder.
- `node.pair.verify` — `{ nodeId, token }` doğrular.

Notlar:

- `node.pair.request`, Node başına idempotent'tir: yinelenen çağrılar aynı
  bekleyen isteği döndürür.
- Aynı bekleyen Node için yinelenen istekler ayrıca saklanan Node
  üst verilerini ve operatör görünürlüğü için izin verilmiş en son bildirilen komut anlık görüntüsünü yeniler.
- Onay **her zaman** yeni bir belirteç üretir; hiçbir belirteç
  `node.pair.request` tarafından asla döndürülmez.
- İstekler, otomatik onay akışları için ipucu olarak `silent: true` içerebilir.
- `node.pair.approve`, ek onay kapsamlarını zorlamak için bekleyen isteğin bildirilen komutlarını kullanır:
  - komutsuz istek: `operator.pairing`
  - exec olmayan komut isteği: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` isteği:
    `operator.pairing` + `operator.admin`

Önemli:

- Node eşleştirmesi bir güven/kimlik akışı artı belirteç verme işlemidir.
- Canlı Node komut yüzeyini Node başına sabitlemez.
- Canlı Node komutları, Gateway'in genel Node komut ilkesi (`gateway.nodes.allowCommands` /
  `denyCommands`) uygulandıktan sonra Node'un bağlanırken bildirdiklerinden gelir.
- Node başına `system.run` izin/sor ilkesi, eşleştirme kaydında değil,
  Node üzerinde `exec.approvals.node.*` altında yaşar.

## Node komut geçitlemesi (2026.3.31+)

<Warning>
**Uyumsuz değişiklik:** `2026.3.31` sürümünden itibaren, Node komutları Node eşleştirmesi onaylanana kadar devre dışıdır. Cihaz eşleştirmesi tek başına artık bildirilen Node komutlarını açmak için yeterli değildir.
</Warning>

Bir Node ilk kez bağlandığında, eşleştirme otomatik olarak istenir. Eşleştirme isteği onaylanana kadar, o Node'dan gelen tüm bekleyen Node komutları filtrelenir ve yürütülmez. Eşleştirme onayıyla güven kurulduktan sonra, Node'un bildirdiği komutlar normal komut ilkesine tabi olarak kullanılabilir hale gelir.

Bu şu anlama gelir:

- Daha önce komutları açmak için yalnızca cihaz eşleştirmesine güvenen Node'ların artık Node eşleştirmesini tamamlaması gerekir.
- Eşleştirme onayından önce kuyruğa alınan komutlar ertelenmez, düşürülür.

## Node olay güven sınırları (2026.3.31+)

<Warning>
**Uyumsuz değişiklik:** Node kaynaklı çalıştırmalar artık azaltılmış güvenilir bir yüzeyde kalır.
</Warning>

Node kaynaklı özetler ve ilgili oturum olayları, amaçlanan güvenilir yüzeyle sınırlıdır. Daha önce daha geniş ana makine veya oturum araç erişimine dayanan bildirim güdümlü veya Node tetiklemeli akışların ayarlanması gerekebilir. Bu sağlamlaştırma, Node olaylarının Node'un güven sınırının izin verdiğinin ötesinde ana makine düzeyinde araç erişimine yükselmesini engeller.

## Otomatik onay (macOS uygulaması)

macOS uygulaması, şu durumlarda isteğe bağlı olarak **sessiz onay** deneyebilir:

- istek `silent` olarak işaretlenmişse ve
- uygulama aynı kullanıcıyı kullanarak gateway ana makinesine bir SSH bağlantısını doğrulayabiliyorsa.

Sessiz onay başarısız olursa, normal “Approve/Reject” istemine geri döner.

## Üst veri yükseltme otomatik onayı

Zaten eşleştirilmiş bir cihaz yalnızca hassas olmayan üst veri
değişiklikleriyle (örneğin görünen ad veya istemci platformu ipuçları) yeniden bağlandığında,
OpenClaw bunu bir `metadata-upgrade` olarak değerlendirir. Sessiz otomatik onay dardır:
yalnızca loopback üzerinden paylaşılan belirteç veya parolaya zaten sahip olduğunu kanıtlamış güvenilir yerel CLI/yardımcı yeniden bağlanmalarına uygulanır.
Tarayıcı/Control UI istemcileri ve uzak istemciler yine açık yeniden onay akışını kullanır.
Kapsam yükseltmeleri (okumadan yazma/yöneticiye) ve açık anahtar değişiklikleri **metadata-upgrade**
otomatik onayı için uygun değildir — bunlar açık yeniden onay istekleri olarak kalır.

## QR eşleştirme yardımcıları

`/pair qr`, mobil ve
tarayıcı istemcilerinin doğrudan tarayabilmesi için eşleştirme payload'ını yapılandırılmış medya olarak oluşturur.

Bir cihazı silmek, o
cihaz kimliği için eski bekleyen eşleştirme isteklerini de temizler; böylece `nodes pending`, iptalden sonra yetim satırlar göstermez.

## Yerellik ve yönlendirilmiş başlıklar

Gateway eşleştirmesi, bir bağlantıyı yalnızca ham soket
ve yukarı akış proxy kanıtı aynı fikirdeyse loopback olarak değerlendirir. Bir istek loopback üzerinden gelirse ancak
yerel olmayan bir kaynağa işaret eden `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` başlıkları taşıyorsa,
bu yönlendirilmiş başlık kanıtı loopback yerellik iddiasını geçersiz kılar.
Eşleştirme yolu o zaman isteği sessizce aynı ana makine bağlantısı gibi değerlendirmek yerine
açık onay gerektirir. Operatör kimlik doğrulamasındaki eşdeğer kural için
bkz. [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth).

## Depolama (yerel, özel)

Eşleştirme durumu, Gateway durum dizini altında saklanır (varsayılan `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

`OPENCLAW_STATE_DIR` geçersiz kılınırsa, `nodes/` klasörü onunla birlikte taşınır.

Güvenlik notları:

- Belirteçler gizli değerlerdir; `paired.json` dosyasını hassas kabul edin.
- Bir belirteci döndürmek yeniden onay gerektirir (veya Node girdisinin silinmesini).

## Taşıma davranışı

- Taşıma **durumsuzdur**; üyelik saklamaz.
- Gateway çevrimdışıysa veya eşleştirme devre dışıysa, Node'lar eşleştirilemez.
- Gateway uzak moddaysa, eşleştirme yine uzak Gateway'in deposuna karşı yapılır.

## İlgili

- [Kanal eşleştirme](/tr/channels/pairing)
- [Node'lar](/tr/nodes)
- [Devices CLI](/tr/cli/devices)
