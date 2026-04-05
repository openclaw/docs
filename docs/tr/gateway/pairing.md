---
read_when:
    - macOS UI olmadan düğüm eşleştirme onaylarını uygulama
    - Uzak düğümleri onaylamak için CLI akışları ekleme
    - Gateway protokolünü düğüm yönetimiyle genişletme
summary: iOS ve diğer uzak düğümler için Gateway'e ait düğüm eşleştirmesi (Seçenek B)
title: Gateway-Owned Pairing
x-i18n:
    generated_at: "2026-04-05T13:54:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f90818c84daeb190f27df7413e23362372806f2c4250e4954295fbf6df70233
    source_path: gateway/pairing.md
    workflow: 15
---

# Gateway'e ait eşleştirme (Seçenek B)

Gateway'e ait eşleştirmede, hangi düğümlerin katılmasına izin verildiği konusunda **Gateway** doğruluk kaynağıdır. UI'ler (macOS uygulaması, gelecekteki istemciler) yalnızca bekleyen istekleri onaylayan veya reddeden ön yüzlerdir.

**Önemli:** WS düğümleri `connect` sırasında **cihaz eşleştirmesi** (rol `node`) kullanır.
`node.pair.*`, ayrı bir eşleştirme deposudur ve WS handshake'i engellemez.
Bu akışı yalnızca açıkça `node.pair.*` çağıran istemciler kullanır.

## Kavramlar

- **Bekleyen istek**: bir düğüm katılmak istedi; onay gerektirir.
- **Eşleştirilmiş düğüm**: auth token verilmiş onaylı düğüm.
- **Taşıma**: Gateway WS uç noktası istekleri iletir ancak üyeliğe karar vermez. (Eski TCP bridge desteği kaldırılmıştır.)

## Eşleştirme nasıl çalışır

1. Bir düğüm Gateway WS'ye bağlanır ve eşleştirme ister.
2. Gateway bir **bekleyen istek** depolar ve `node.pair.requested` yayar.
3. İsteği onaylar veya reddedersiniz (CLI veya UI).
4. Onayda Gateway **yeni bir token** verir (yeniden eşleştirmede token'lar döndürülür).
5. Düğüm token'ı kullanarak yeniden bağlanır ve artık “eşleştirilmiştir”.

Bekleyen istekler **5 dakika** sonra otomatik olarak sona erer.

## CLI iş akışı (headless kullanım için uygun)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status`, eşleştirilmiş/bağlı düğümleri ve bunların yeteneklerini gösterir.

## API yüzeyi (gateway protokolü)

Olaylar:

- `node.pair.requested` — yeni bir bekleyen istek oluşturulduğunda yayılır.
- `node.pair.resolved` — bir istek onaylandığında/reddedildiğinde/süresi dolduğunda yayılır.

Yöntemler:

- `node.pair.request` — bekleyen bir istek oluşturur veya yeniden kullanır.
- `node.pair.list` — bekleyen + eşleştirilmiş düğümleri listeler (`operator.pairing`).
- `node.pair.approve` — bekleyen bir isteği onaylar (token verir).
- `node.pair.reject` — bekleyen bir isteği reddeder.
- `node.pair.verify` — `{ nodeId, token }` doğrular.

Notlar:

- `node.pair.request`, düğüm başına idempotent'tir: yinelenen çağrılar aynı
  bekleyen isteği döndürür.
- Aynı bekleyen düğüm için yinelenen istekler ayrıca depolanmış düğüm
  meta verisini ve operatör görünürlüğü için izin listesine alınmış en son bildirilen komut anlık görüntüsünü yeniler.
- Onay **her zaman** yeni bir token üretir; `node.pair.request` içinden hiçbir zaman token döndürülmez.
- İstekler, otomatik onay akışları için ipucu olarak `silent: true` içerebilir.
- `node.pair.approve`, ek onay kapsamlarını zorlamak için bekleyen isteğin bildirilen komutlarını kullanır:
  - komutsuz istek: `operator.pairing`
  - yürütme içermeyen komut isteği: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` isteği:
    `operator.pairing` + `operator.admin`

Önemli:

- Düğüm eşleştirme, bir güven/kimlik akışı ve token verme işlemidir.
- Canlı düğüm komut yüzeyini düğüm başına sabitlemez.
- Canlı düğüm komutları, düğümün bağlanırken bildirdiği komutlardan gelir ve gateway'in genel düğüm komut ilkesi (`gateway.nodes.allowCommands` /
  `denyCommands`) uygulandıktan sonra kullanılabilir olur.
- Düğüm başına `system.run` izin/sor ilkesi,
  eşleştirme kaydında değil, düğüm üzerindeki `exec.approvals.node.*` içinde bulunur.

## Düğüm komut kapılaması (2026.3.31+)

<Warning>
**Uyumsuz değişiklik:** `2026.3.31` sürümünden itibaren, düğüm eşleştirmesi onaylanana kadar düğüm komutları devre dışıdır. Artık yalnızca cihaz eşleştirmesi, bildirilen düğüm komutlarını açığa çıkarmak için yeterli değildir.
</Warning>

Bir düğüm ilk kez bağlandığında, eşleştirme otomatik olarak istenir. Eşleştirme isteği onaylanana kadar, o düğümden gelen tüm bekleyen düğüm komutları filtrelenir ve yürütülmez. Eşleştirme onayıyla güven oluşturulduktan sonra, düğümün bildirdiği komutlar normal komut ilkesine tabi olarak kullanılabilir hâle gelir.

Bu şu anlama gelir:

- Daha önce komutları açığa çıkarmak için yalnızca cihaz eşleştirmesine güvenen düğümlerin artık düğüm eşleştirmesini tamamlaması gerekir.
- Eşleştirme onayından önce kuyruğa alınan komutlar ertelenmez, düşürülür.

## Düğüm olay güven sınırları (2026.3.31+)

<Warning>
**Uyumsuz değişiklik:** Düğüm kaynaklı çalıştırmalar artık azaltılmış güvenilen yüzeyde kalır.
</Warning>

Düğüm kaynaklı özetler ve ilgili oturum olayları, amaçlanan güvenilen yüzeyle sınırlandırılmıştır. Daha önce daha geniş ana makine veya oturum aracı erişimine dayanan bildirim odaklı veya düğüm tetiklemeli akışların ayarlanması gerekebilir. Bu sertleştirme, düğüm olaylarının düğümün güven sınırının izin verdiğinin ötesinde ana makine düzeyi araç erişimine yükselmesini engeller.

## Otomatik onay (macOS uygulaması)

macOS uygulaması, şu durumlarda isteğe bağlı olarak **sessiz onay** denemesi yapabilir:

- istek `silent` olarak işaretlenmişse ve
- uygulama, aynı kullanıcıyı kullanarak gateway ana makinesine bir SSH bağlantısını doğrulayabiliyorsa.

Sessiz onay başarısız olursa, normal “Approve/Reject” istemine geri döner.

## Depolama (yerel, özel)

Eşleştirme durumu Gateway durum dizini altında depolanır (varsayılan `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

`OPENCLAW_STATE_DIR` değerini geçersiz kılarsanız, `nodes/` klasörü de onunla birlikte taşınır.

Güvenlik notları:

- Token'lar gizli değerlerdir; `paired.json` dosyasını hassas kabul edin.
- Bir token'ı döndürmek yeniden onay gerektirir (veya düğüm girdisini silmeyi gerektirir).

## Taşıma davranışı

- Taşıma **durumsuzdur**; üyelik depolamaz.
- Gateway çevrimdışıysa veya eşleştirme devre dışıysa, düğümler eşleştirilemez.
- Gateway uzak moddaysa, eşleştirme yine de uzak Gateway deposuna karşı gerçekleşir.
