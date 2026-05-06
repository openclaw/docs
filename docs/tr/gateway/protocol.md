---
read_when:
    - Gateway WS istemcilerini uygulama veya güncelleme
    - Protokol uyumsuzluklarında veya bağlantı hatalarında hata ayıklama
    - Protokol şemasını/modellerini yeniden oluşturma
summary: 'Gateway WebSocket protokolü: el sıkışma, çerçeveler, sürümleme'
title: Gateway protokolü
x-i18n:
    generated_at: "2026-05-06T09:15:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a5eb7a84dbe0664fd78271408686a643dbc0579de5b5402fd1a8d33fd59221d
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protokolü, OpenClaw için **tek kontrol düzlemi + Node aktarımıdır**.
Tüm istemciler (CLI, web kullanıcı arayüzü, macOS uygulaması, iOS/Android Node'ları, başsız
Node'lar) WebSocket üzerinden bağlanır ve el sıkışma sırasında **rollerini** + **kapsamlarını**
bildirir.

## Aktarım

- WebSocket, JSON yükleri içeren metin frame'leri.
- İlk frame **mutlaka** bir `connect` isteği olmalıdır.
- Bağlantı öncesi frame'ler 64 KiB ile sınırlandırılır. Başarılı bir el sıkışmadan sonra istemciler,
  `hello-ok.policy.maxPayload` ve
  `hello-ok.policy.maxBufferedBytes` sınırlarına uymalıdır. Tanılama etkinleştirildiğinde,
  aşırı büyük gelen frame'ler ve yavaş giden tamponlar, gateway etkilenen frame'i kapatmadan
  veya düşürmeden önce `payload.large` olayları yayar. Bu olaylar boyutları, sınırları,
  yüzeyleri ve güvenli neden kodlarını tutar. İleti gövdesini, ek içeriklerini, ham frame gövdesini,
  token'ları, çerezleri veya gizli değerleri tutmaz.

## El sıkışma (connect)

Gateway → İstemci (bağlantı öncesi meydan okuma):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

İstemci → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → İstemci:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "auth": {
      "role": "operator",
      "scopes": ["operator.read", "operator.write"]
    },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

Gateway başlangıç yan bileşenlerini tamamlamaya devam ederken, `connect` isteği
`details.reason` değeri `"startup-sidecars"` olarak ayarlanmış ve `retryAfterMs` içeren,
yeniden denenebilir bir `UNAVAILABLE` hatası döndürebilir. İstemciler bu yanıtı terminal
bir el sıkışma hatası olarak göstermemeli, bunun yerine genel bağlantı bütçeleri içinde yeniden denemelidir.

`server`, `features`, `snapshot` ve `policy` alanlarının tümü şema tarafından zorunludur
(`src/gateway/protocol/schema/frames.ts`). `auth` da zorunludur ve anlaşılan rol/kapsamları
bildirir. `canvasHostUrl` isteğe bağlıdır.

Cihaz token'ı verilmediğinde, `hello-ok.auth` anlaşılan izinleri token alanları olmadan bildirir:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilen aynı süreç içi arka uç istemcileri (`client.id: "gateway-client"`,
`client.mode: "backend"`), paylaşılan gateway token'ı/parolasıyla kimlik doğruladıklarında doğrudan
loopback bağlantılarında `device` alanını atlayabilir. Bu yol, iç kontrol düzlemi RPC'leri için
ayrılmıştır ve eski CLI/cihaz eşleştirme taban çizgilerinin alt aracı oturumu güncellemeleri gibi
yerel arka uç işlerini engellemesini önler. Uzak istemciler, tarayıcı kaynaklı istemciler, Node
istemcileri ve açık cihaz-token'ı/cihaz-kimliğine sahip istemciler normal eşleştirme ve kapsam yükseltme
kontrollerini kullanmaya devam eder.

Cihaz token'ı verildiğinde, `hello-ok` ayrıca şunu içerir:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilen önyükleme devri sırasında, `hello-ok.auth` ayrıca `deviceTokens` içinde ek
sınırlı rol girdileri içerebilir:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

Yerleşik Node/operator önyükleme akışı için birincil Node token'ı
`scopes: []` olarak kalır ve devredilen operator token'ı önyükleme operator izin listesiyle
(`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`) sınırlı kalır. Önyükleme kapsam kontrolleri
rol önekli kalır: operator girdileri yalnızca operator isteklerini karşılar ve operator olmayan roller
yine kendi rol önekleri altındaki kapsamlara ihtiyaç duyar.

### Node örneği

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## Frame'leme

- **İstek**: `{type:"req", id, method, params}`
- **Yanıt**: `{type:"res", id, ok, payload|error}`
- **Olay**: `{type:"event", event, payload, seq?, stateVersion?}`

Yan etkili yöntemler **idempotency keys** gerektirir (şemaya bakın).

## Roller + kapsamlar

Tam operator kapsam modeli, onay zamanı kontrolleri ve paylaşılan-gizli anlambilimi için
[Operator kapsamları](/tr/gateway/operator-scopes) bölümüne bakın.

### Roller

- `operator` = kontrol düzlemi istemcisi (CLI/UI/otomasyon).
- `node` = yetenek ana makinesi (kamera/ekran/canvas/system.run).

### Kapsamlar (operator)

Yaygın kapsamlar:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` ile `talk.config`, `operator.talk.secrets`
(veya `operator.admin`) gerektirir.

Plugin tarafından kaydedilen gateway RPC yöntemleri kendi operator kapsamlarını isteyebilir, ancak
ayrılmış çekirdek yönetici önekleri (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) her zaman `operator.admin` kapsamına çözümlenir.

Yöntem kapsamı yalnızca ilk kapıdır. `chat.send` üzerinden ulaşılan bazı slash komutları
bunun üzerine daha sıkı komut düzeyi kontroller uygular. Örneğin, kalıcı
`/config set` ve `/config unset` yazmaları `operator.admin` gerektirir.

`node.pair.approve`, temel yöntem kapsamının üzerine ek bir onay zamanı kapsam kontrolüne de sahiptir:

- komutsuz istekler: `operator.pairing`
- exec olmayan Node komutları içeren istekler: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which` içeren istekler:
  `operator.pairing` + `operator.admin`

### Yetenekler/komutlar/izinler (Node)

Node'lar bağlantı sırasında yetenek iddialarını bildirir:

- `caps`: `camera`, `canvas`, `screen`,
  `location`, `voice` ve `talk` gibi üst düzey yetenek kategorileri.
- `commands`: invoke için komut izin listesi.
- `permissions`: ayrıntılı anahtarlar (örn. `screen.record`, `camera.capture`).

Gateway bunları **iddia** olarak ele alır ve sunucu tarafı izin listelerini uygular.

## Varlık

- `system-presence`, cihaz kimliğine göre anahtarlanmış girdiler döndürür.
- Varlık girdileri `deviceId`, `roles` ve `scopes` içerir; böylece kullanıcı arayüzleri, cihaz hem
  **operator** hem de **node** olarak bağlansa bile cihaz başına tek bir satır gösterebilir.
- `node.list`, isteğe bağlı `lastSeenAtMs` ve `lastSeenReason` alanlarını içerir. Bağlı Node'lar,
  mevcut bağlantı zamanlarını `connect` nedeniyle `lastSeenAtMs` olarak bildirir; eşleştirilmiş Node'lar,
  güvenilen bir Node olayı eşleştirme meta verilerini güncellediğinde kalıcı arka plan varlığını da bildirebilir.

### Node arka plan canlı olayı

Node'lar, eşleştirilmiş bir Node'un arka plan uyanışı sırasında bağlı olarak işaretlenmeden
canlı olduğunu kaydetmek için `event: "node.presence.alive"` ile `node.event` çağırabilir.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` kapalı bir enum'dur: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` veya `connect`. Bilinmeyen trigger dizeleri kalıcılıktan önce
gateway tarafından `background` olarak normalleştirilir. Olay yalnızca kimliği doğrulanmış Node
cihaz oturumları için kalıcıdır; cihazsız veya eşleştirilmemiş oturumlar `handled: false` döndürür.

Başarılı gateway'ler yapılandırılmış bir sonuç döndürür:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Daha eski gateway'ler `node.event` için hâlâ `{ "ok": true }` döndürebilir; istemciler bunu
kalıcı varlık saklama olarak değil, onaylanmış bir RPC olarak ele almalıdır.

## Yayın olayı kapsamlandırması

Sunucu tarafından gönderilen WebSocket yayın olayları kapsam geçitlidir; böylece eşleştirme kapsamlı veya yalnızca Node oturumları, oturum içeriğini pasif olarak almaz.

- **Sohbet, aracı ve araç-sonucu frame'leri** (stream edilen `agent` olayları ve araç çağrısı sonuçları dahil) en az `operator.read` gerektirir. `operator.read` olmayan oturumlar bu frame'leri tamamen atlar.
- **Plugin tanımlı `plugin.*` yayınları**, Plugin'in bunları nasıl kaydettiğine bağlı olarak `operator.write` veya `operator.admin` ile geçitlenir.
- **Durum ve aktarım olayları** (`heartbeat`, `presence`, `tick`, bağlanma/bağlantı kesme yaşam döngüsü vb.) kısıtlanmadan kalır; böylece aktarım sağlığı her kimliği doğrulanmış oturum tarafından gözlemlenebilir kalır.
- **Bilinmeyen yayın olayı aileleri**, kayıtlı bir işleyici bunları açıkça gevşetmediği sürece varsayılan olarak kapsam geçitlidir (kapalı başarısızlık).

Her istemci bağlantısı kendi istemci başına sıra numarasını tutar; böylece farklı istemciler olay akışının farklı kapsam filtreli alt kümelerini görse bile yayınlar o sokette monoton sıralamayı korur.

## Yaygın RPC yöntemi aileleri

Genel WS yüzeyi yukarıdaki el sıkışma/kimlik doğrulama örneklerinden daha geniştir. Bu,
üretilmiş bir döküm değildir — `hello-ok.features.methods`, `src/gateway/server-methods-list.ts`
ve yüklenen Plugin/kanal yöntem dışa aktarımlarından oluşturulan muhafazakar bir keşif listesidir.
Bunu `src/gateway/server-methods/*.ts` için tam bir numaralandırma değil, özellik keşfi olarak ele alın.

<AccordionGroup>
  <Accordion title="Sistem ve kimlik">
    - `health` önbelleğe alınmış veya yeni yoklanmış gateway sağlık anlık görüntüsünü döndürür.
    - `diagnostics.stability` son sınırlı tanılama kararlılık kaydedicisini döndürür. Olay adları, sayılar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/Plugin adları ve oturum kimlikleri gibi operasyonel meta verileri tutar. Sohbet metnini, webhook gövdelerini, araç çıktılarını, ham istek veya yanıt gövdelerini, token'ları, çerezleri ya da gizli değerleri tutmaz. Operator okuma kapsamı gereklidir.
    - `status` `/status` tarzı gateway özetini döndürür; hassas alanlar yalnızca yönetici kapsamlı operator istemcileri için dahil edilir.
    - `gateway.identity.get`, relay ve eşleştirme akışları tarafından kullanılan gateway cihaz kimliğini döndürür.
    - `system-presence` bağlı operator/Node cihazları için mevcut varlık anlık görüntüsünü döndürür.
    - `system-event` bir sistem olayı ekler ve varlık bağlamını güncelleyebilir/yayınlayabilir.
    - `last-heartbeat` son kalıcı heartbeat olayını döndürür.
    - `set-heartbeats` gateway üzerinde heartbeat işlemeyi açıp kapatır.

  </Accordion>

  <Accordion title="Modeller ve kullanım">
    - `models.list` çalışma zamanında izin verilen model kataloğunu döndürür. Seçici boyutundaki yapılandırılmış modeller için `{ "view": "configured" }` değerini geçirin (`agents.defaults.models` önce, ardından `models.providers.*.models`), tam katalog için `{ "view": "all" }` değerini geçirin.
    - `usage.status` sağlayıcı kullanım pencerelerini/kalan kota özetlerini döndürür.
    - `usage.cost` bir tarih aralığı için birleştirilmiş maliyet kullanımı özetlerini döndürür.
    - `doctor.memory.status` etkin varsayılan ajan çalışma alanı için vektör bellek / önbelleğe alınmış embedding hazırlığını döndürür. `{ "probe": true }` veya `{ "deep": true }` değerini yalnızca çağıran taraf açıkça canlı bir embedding sağlayıcısı ping'i istediğinde geçirin.
    - `doctor.memory.remHarness` uzaktan kontrol düzlemi istemcileri için sınırlı, salt okunur bir REM harness önizlemesi döndürür. Çalışma alanı yolları, bellek parçacıkları, işlenmiş temellendirilmiş markdown ve derin yükseltme adayları içerebilir; bu nedenle çağıranların `operator.read` iznine ihtiyacı vardır.
    - `sessions.usage` oturum başına kullanım özetlerini döndürür.
    - `sessions.usage.timeseries` tek bir oturum için zaman serisi kullanımını döndürür.
    - `sessions.usage.logs` tek bir oturum için kullanım günlüğü girdilerini döndürür.

  </Accordion>

  <Accordion title="Kanallar ve oturum açma yardımcıları">
    - `channels.status` yerleşik + paketlenmiş kanal/Plugin durum özetlerini döndürür.
    - `channels.logout` kanalın oturumu kapatmayı desteklediği durumlarda belirli bir kanal/hesaptan oturumu kapatır.
    - `web.login.start` geçerli QR özellikli web kanal sağlayıcısı için bir QR/web oturum açma akışı başlatır.
    - `web.login.wait` bu QR/web oturum açma akışının tamamlanmasını bekler ve başarı durumunda kanalı başlatır.
    - `push.test` kayıtlı bir iOS Node'una test APNs push bildirimi gönderir.
    - `voicewake.get` saklanan uyandırma sözcüğü tetikleyicilerini döndürür.
    - `voicewake.set` uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayınlar.

  </Accordion>

  <Accordion title="Mesajlaşma ve günlükler">
    - `send`, sohbet çalıştırıcısının dışındaki kanal/hesap/konu hedefli gönderimler için doğrudan giden teslimat RPC'sidir.
    - `logs.tail` imleç/sınır ve en fazla bayt kontrolleriyle yapılandırılmış Gateway dosya günlüğü kuyruğunu döndürür.

  </Accordion>

  <Accordion title="Talk ve TTS">
    - `talk.catalog` konuşma, akışlı transkripsiyon ve gerçek zamanlı ses için salt okunur Talk sağlayıcı kataloğunu döndürür. Sağlayıcı kimliklerini, etiketleri, yapılandırılmış durumu, açığa çıkarılmış model/ses kimliklerini, kanonik modları, taşıma türlerini, beyin stratejilerini ve gerçek zamanlı ses/yetenek bayraklarını içerir; sağlayıcı sırlarını döndürmez veya global yapılandırmayı değiştirmez.
    - `talk.config` etkin Talk yapılandırma yükünü döndürür; `includeSecrets`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.
    - `talk.session.create`, `realtime/gateway-relay`, `transcription/gateway-relay` veya `stt-tts/managed-room` için Gateway sahipliğinde bir Talk oturumu oluşturur. `brain: "direct-tools"`, `operator.admin` gerektirir.
    - `talk.session.join` bir yönetilen oda oturum belirtecini doğrular, gerektiğinde `session.ready` veya `session.replaced` olayları yayar ve düz metin belirteç veya saklanan belirteç karması olmadan oda/oturum meta verileri ile son Talk olaylarını döndürür.
    - `talk.session.appendAudio` Gateway sahipliğindeki gerçek zamanlı röle ve transkripsiyon oturumlarına base64 PCM giriş sesi ekler.
    - `talk.session.startTurn`, `talk.session.endTurn` ve `talk.session.cancelTurn`, durum temizlenmeden önce eski sıra reddiyle yönetilen oda sıra yaşam döngüsünü yürütür.
    - `talk.session.cancelOutput`, esas olarak Gateway röle oturumlarında VAD kapılı araya girme için asistan ses çıkışını durdurur.
    - `talk.session.submitToolResult`, Gateway sahipliğindeki gerçek zamanlı röle oturumu tarafından yayılan bir sağlayıcı araç çağrısını tamamlar.
    - `talk.session.close`, Gateway sahipliğindeki bir röle, transkripsiyon veya yönetilen oda oturumunu kapatır ve sonlandırıcı Talk olayları yayar.
    - `talk.mode`, WebChat/Control UI istemcileri için geçerli Talk modu durumunu ayarlar/yayınlar.
    - `talk.client.create`, Gateway yapılandırma, kimlik bilgileri, talimatlar ve araç ilkesine sahipken `webrtc` veya `provider-websocket` kullanarak istemci sahipliğinde gerçek zamanlı bir sağlayıcı oturumu oluşturur.
    - `talk.client.toolCall`, istemci sahipliğindeki gerçek zamanlı taşıma katmanlarının sağlayıcı araç çağrılarını Gateway ilkesine iletmesini sağlar. Desteklenen ilk araç `openclaw_agent_consult` aracıdır; istemciler bir çalıştırma kimliği alır ve sağlayıcıya özgü araç sonucunu göndermeden önce normal sohbet yaşam döngüsü olaylarını bekler.
    - `talk.event`, gerçek zamanlı, transkripsiyon, STT/TTS, yönetilen oda, telefon ve toplantı bağdaştırıcıları için tek Talk olay kanalıdır.
    - `talk.speak`, etkin Talk konuşma sağlayıcısı üzerinden konuşma sentezler.
    - `tts.status` TTS etkin durumunu, etkin sağlayıcıyı, yedek sağlayıcıları ve sağlayıcı yapılandırma durumunu döndürür.
    - `tts.providers` görünür TTS sağlayıcı envanterini döndürür.
    - `tts.enable` ve `tts.disable` TTS tercih durumunu açıp kapatır.
    - `tts.setProvider` tercih edilen TTS sağlayıcısını günceller.
    - `tts.convert` tek seferlik metinden konuşmaya dönüştürme çalıştırır.

  </Accordion>

  <Accordion title="Sırlar, yapılandırma, güncelleme ve sihirbaz">
    - `secrets.reload` etkin SecretRef'leri yeniden çözümler ve çalışma zamanı sır durumunu yalnızca tam başarı durumunda değiştirir.
    - `secrets.resolve` belirli bir komut/hedef kümesi için komut hedefli sır atamalarını çözümler.
    - `config.get` geçerli yapılandırma anlık görüntüsünü ve karmasını döndürür.
    - `config.set` doğrulanmış bir yapılandırma yükü yazar.
    - `config.patch` kısmi bir yapılandırma güncellemesini birleştirir.
    - `config.apply` tam yapılandırma yükünü doğrular + değiştirir.
    - `config.schema` Control UI ve CLI araçlarının kullandığı canlı yapılandırma şeması yükünü döndürür: şema, `uiHints`, sürüm ve üretim meta verileri; çalışma zamanı bunları yükleyebildiğinde Plugin + kanal şema meta verileri dahil. Şema, eşleşen alan belgeleri bulunduğunda iç içe nesne, joker karakter, dizi öğesi ve `anyOf` / `oneOf` / `allOf` bileşim dalları dahil olmak üzere UI tarafından kullanılan aynı etiketlerden ve yardım metninden türetilmiş alan `title` / `description` meta verilerini içerir.
    - `config.schema.lookup` tek bir yapılandırma yolu için yol kapsamlı bir arama yükü döndürür: normalleştirilmiş yol, sığ bir şema düğümü, eşleşen ipucu + `hintPath` ve UI/CLI ayrıntılı incelemesi için doğrudan alt özetleri. Arama şeması düğümleri kullanıcıya yönelik belgeleri ve yaygın doğrulama alanlarını (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, sayısal/dize/dizi/nesne sınırları ve `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi bayraklar) korur. Alt özetler `key`, normalleştirilmiş `path`, `type`, `required`, `hasChildren` ve eşleşen `hint` / `hintPath` değerlerini açığa çıkarır.
    - `update.run` Gateway güncelleme akışını çalıştırır ve yalnızca güncellemenin kendisi başarılı olduğunda yeniden başlatma zamanlar; oturumu olan çağıranlar, başlangıcın yeniden başlatma devam kuyruğu üzerinden bir takip ajan sırasını sürdürmesi için `continuationMessage` ekleyebilir. Paket yöneticisi güncellemeleri, paket değişiminden sonra eski Gateway sürecinin değiştirilmiş bir `dist` ağacından tembel yükleme yapmaya devam etmemesi için ertelenmeyen, bekleme süresiz bir güncelleme yeniden başlatmasını zorlar.
    - `update.status` varsa yeniden başlatma sonrası çalışan sürüm dahil olmak üzere en son önbelleğe alınmış güncelleme yeniden başlatma sentinel'ini döndürür.
    - `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel` ilk kullanım sihirbazını WS RPC üzerinden açığa çıkarır.

  </Accordion>

  <Accordion title="Ajan ve çalışma alanı yardımcıları">
    - `agents.list` etkin model ve çalışma zamanı meta verileri dahil yapılandırılmış ajan girdilerini döndürür.
    - `agents.create`, `agents.update` ve `agents.delete` ajan kayıtlarını ve çalışma alanı bağlantılarını yönetir.
    - `agents.files.list`, `agents.files.get` ve `agents.files.set` bir ajan için açığa çıkarılan bootstrap çalışma alanı dosyalarını yönetir.
    - `artifacts.list`, `artifacts.get` ve `artifacts.download`, açık bir `sessionKey`, `runId` veya `taskId` kapsamı için transkriptten türetilmiş yapıt özetlerini ve indirmeleri açığa çıkarır. Çalıştırma ve görev sorguları sahip oturumu sunucu tarafında çözümler ve yalnızca eşleşen kökene sahip transkript medyasını döndürür; güvenli olmayan veya yerel URL kaynakları, sunucu tarafında getirmek yerine desteklenmeyen indirmeler döndürür.
    - `environments.list` ve `environments.status` SDK istemcileri için salt okunur Gateway yerel ve Node ortam keşfini açığa çıkarır.
    - `agent.identity.get` bir ajan veya oturum için etkin asistan kimliğini döndürür.
    - `agent.wait` bir çalıştırmanın bitmesini bekler ve varsa son anlık görüntüyü döndürür.

  </Accordion>

  <Accordion title="Oturum kontrolü">
    - `sessions.list` bir ajan çalışma zamanı arka ucu yapılandırıldığında satır başına `agentRuntime` meta verileri dahil geçerli oturum dizinini döndürür.
    - `sessions.subscribe` ve `sessions.unsubscribe` geçerli WS istemcisi için oturum değişikliği olay aboneliklerini açıp kapatır.
    - `sessions.messages.subscribe` ve `sessions.messages.unsubscribe` tek bir oturum için transkript/mesaj olay aboneliklerini açıp kapatır.
    - `sessions.preview` belirli oturum anahtarları için sınırlı transkript önizlemeleri döndürür.
    - `sessions.describe` tam bir oturum anahtarı için bir Gateway oturum satırı döndürür.
    - `sessions.resolve` bir oturum hedefini çözümler veya kanonikleştirir.
    - `sessions.create` yeni bir oturum girdisi oluşturur.
    - `sessions.send` mevcut bir oturuma mesaj gönderir.
    - `sessions.steer` etkin bir oturum için kes ve yönlendir çeşididir.
    - `sessions.abort` bir oturum için etkin işi iptal eder. Çağıran, `key` ile isteğe bağlı `runId` geçebilir veya Gateway'in bir oturuma çözümleyebileceği etkin çalıştırmalar için yalnızca `runId` geçebilir.
    - `sessions.patch` oturum meta verilerini/geçersiz kılmalarını günceller ve çözümlenen kanonik modeli artı etkin `agentRuntime` değerini bildirir.
    - `sessions.reset`, `sessions.delete` ve `sessions.compact` oturum bakımını gerçekleştirir.
    - `sessions.get` tam saklanan oturum satırını döndürür.
    - Sohbet yürütmesi hâlâ `chat.history`, `chat.send`, `chat.abort` ve `chat.inject` kullanır. `chat.history`, UI istemcileri için görüntü normalleştirmelidir: satır içi yönerge etiketleri görünür metinden çıkarılır, düz metin araç çağrısı XML yükleri (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil) ve sızan ASCII/tam genişlikli model kontrol belirteçleri çıkarılır, tam `NO_REPLY` / `no_reply` gibi saf sessiz belirteç asistan satırları atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir.

  </Accordion>

  <Accordion title="Cihaz eşleştirme ve cihaz belirteçleri">
    - `device.pair.list` bekleyen ve onaylanmış eşleştirilmiş cihazları döndürür.
    - `device.pair.approve`, `device.pair.reject` ve `device.pair.remove` cihaz eşleştirme kayıtlarını yönetir.
    - `device.token.rotate` eşleştirilmiş bir cihaz belirtecini onaylı rolü ve çağıran kapsamı sınırları içinde döndürür.
    - `device.token.revoke` eşleştirilmiş bir cihaz belirtecini onaylı rolü ve çağıran kapsamı sınırları içinde iptal eder.

  </Accordion>

  <Accordion title="Node eşleştirme, çağırma ve bekleyen iş">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` ve `node.pair.verify` Node eşleştirmeyi ve bootstrap doğrulamasını kapsar.
    - `node.list` ve `node.describe` bilinen/bağlı Node durumunu döndürür.
    - `node.rename` eşleştirilmiş bir Node etiketini günceller.
    - `node.invoke` bağlı bir Node'a komut iletir.
    - `node.invoke.result` bir çağırma isteğinin sonucunu döndürür.
    - `node.event` Node kaynaklı olayları Gateway'e geri taşır.
    - `node.canvas.capability.refresh` kapsamlı canvas yeteneği belirteçlerini yeniler.
    - `node.pending.pull` ve `node.pending.ack` bağlı Node kuyruk API'leridir.
    - `node.pending.enqueue` ve `node.pending.drain` çevrimdışı/bağlantısı kesilmiş Node'lar için dayanıklı bekleyen işi yönetir.

  </Accordion>

  <Accordion title="Onay aileleri">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve `exec.approval.resolve`, tek seferlik exec onay isteklerini ve bekleyen onay arama/yeniden oynatma işlemlerini kapsar.
    - `exec.approval.waitDecision`, bekleyen bir exec onayını bekler ve son kararı döndürür (veya zaman aşımında `null`).
    - `exec.approvals.get` ve `exec.approvals.set`, Gateway exec onay politikası anlık görüntülerini yönetir.
    - `exec.approvals.node.get` ve `exec.approvals.node.set`, node relay komutları üzerinden node-local exec onay politikasını yönetir.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` ve `plugin.approval.resolve`, Plugin tanımlı onay akışlarını kapsar.

  </Accordion>

  <Accordion title="Otomasyon, Skills ve araçlar">
    - Otomasyon: `wake`, anında veya sonraki Heartbeat'te wake metni enjeksiyonu zamanlar; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zamanlanmış işi yönetir.
    - Skills ve araçlar: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Yaygın olay aileleri

- `chat`: `chat.inject` gibi UI sohbet güncellemeleri ve diğer yalnızca döküm olan sohbet
  olayları.
- `session.message` ve `session.tool`: abone olunmuş bir oturum için döküm/olay akışı
  güncellemeleri.
- `sessions.changed`: oturum dizini veya meta veriler değişti.
- `presence`: sistem varlık anlık görüntüsü güncellemeleri.
- `tick`: periyodik keepalive / canlılık olayı.
- `health`: Gateway sağlık anlık görüntüsü güncellemesi.
- `heartbeat`: Heartbeat olay akışı güncellemesi.
- `cron`: Cron çalıştırma/iş değişikliği olayı.
- `shutdown`: Gateway kapatma bildirimi.
- `node.pair.requested` / `node.pair.resolved`: Node eşleştirme yaşam döngüsü.
- `node.invoke.request`: Node invoke istek yayını.
- `device.pair.requested` / `device.pair.resolved`: eşleştirilmiş cihaz yaşam döngüsü.
- `voicewake.changed`: uyandırma sözcüğü tetikleyici yapılandırması değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onay
  yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin onay
  yaşam döngüsü.

### Node yardımcı yöntemleri

- Node'lar, otomatik izin kontrolleri için geçerli skill yürütülebilirleri listesini almak üzere `skills.bins` çağırabilir.

### Operatör yardımcı yöntemleri

- Operatörler, bir aracı için çalışma zamanı komut envanterini almak üzere `commands.list` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan aracı çalışma alanını okumak için atlayın.
  - `scope`, birincil `name` hedefinin hangi yüzeye yöneldiğini denetler:
    - `text`, başındaki `/` olmadan birincil metin komutu belirtecini döndürür
    - `native` ve varsayılan `both` yolu, kullanılabilir olduğunda sağlayıcıya duyarlı yerel adları döndürür
  - `textAliases`, `/model` ve `/m` gibi tam eğik çizgi alias'larını taşır.
  - `nativeName`, varsa sağlayıcıya duyarlı yerel komut adını taşır.
  - `provider` isteğe bağlıdır ve yalnızca yerel adlandırmayı ve yerel Plugin komutu kullanılabilirliğini etkiler.
  - `includeArgs=false`, serileştirilmiş argüman meta verilerini yanıttan çıkarır.
- Operatörler, bir aracı için çalışma zamanı araç kataloğunu almak üzere `tools.catalog` (`operator.read`) çağırabilir. Yanıt, gruplanmış araçları ve köken meta verilerini içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda Plugin sahibi
  - `optional`: bir Plugin aracının isteğe bağlı olup olmadığı
- Operatörler, bir oturum için çalışma zamanında etkili araç envanterini almak üzere `tools.effective` (`operator.read`) çağırabilir.
  - `sessionKey` zorunludur.
  - Gateway, çağıranın sağladığı kimlik doğrulama veya teslim bağlamını kabul etmek yerine güvenilir çalışma zamanı bağlamını oturumdan sunucu tarafında türetir.
  - Yanıt oturum kapsamlıdır ve aktif konuşmanın şu anda kullanabileceği core, Plugin ve kanal araçları dahil olmak üzere neyi kullanabileceğini yansıtır.
- Operatörler, `/tools/invoke` ile aynı Gateway politika yolu üzerinden kullanılabilir bir aracı invoke etmek için `tools.invoke` (`operator.write`) çağırabilir.
  - `name` zorunludur. `args`, `sessionKey`, `agentId`, `confirm` ve
    `idempotencyKey` isteğe bağlıdır.
  - Hem `sessionKey` hem de `agentId` varsa, çözümlenen oturum aracısı `agentId` ile eşleşmelidir.
  - Yanıt, `ok`, `toolName`, isteğe bağlı `output` ve türlendirilmiş `error` alanlarıyla SDK'ya dönük bir zarftır. Onay veya politika retleri, Gateway araç politikası hattını atlamak yerine payload içinde `ok:false` döndürür.
- Operatörler, bir aracı için görünür skill envanterini almak üzere `skills.status` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan aracı çalışma alanını okumak için atlayın.
  - Yanıt; uygunluğu, eksik gereksinimleri, yapılandırma kontrollerini ve ham gizli değerleri açığa çıkarmadan sanitize edilmiş kurulum seçeneklerini içerir.
- Operatörler, ClawHub keşif meta verileri için `skills.search` ve `skills.detail` (`operator.read`) çağırabilir.
- Operatörler, `skills.install` (`operator.admin`) öğesini iki modda çağırabilir:
  - ClawHub modu: `{ source: "clawhub", slug, version?, force? }`, varsayılan aracı çalışma alanındaki `skills/` dizinine bir skill klasörü kurar.
  - Gateway yükleyici modu: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`, Gateway ana makinesinde bildirilen bir `metadata.openclaw.install` eylemi çalıştırır.
- Operatörler, `skills.update` (`operator.admin`) öğesini iki modda çağırabilir:
  - ClawHub modu, varsayılan aracı çalışma alanında izlenen bir slug'ı veya izlenen tüm ClawHub kurulumlarını günceller.
  - Yapılandırma modu, `enabled`,
    `apiKey` ve `env` gibi `skills.entries.<skillKey>` değerlerine yama uygular.

### `models.list` görünümleri

`models.list`, isteğe bağlı bir `view` parametresi kabul eder:

- Atlanmış veya `"default"`: geçerli çalışma zamanı davranışı. `agents.defaults.models` yapılandırılmışsa yanıt izin verilen katalogdur; aksi takdirde yanıt tam Gateway kataloğudur.
- `"configured"`: seçici boyutunda davranış. `agents.defaults.models` yapılandırılmışsa yine önceliklidir. Aksi takdirde yanıt açık `models.providers.*.models` girdilerini kullanır ve yalnızca yapılandırılmış model satırı yoksa tam kataloğa geri döner.
- `"all"`: `agents.defaults.models` öğesini atlayarak tam Gateway kataloğu. Bunu normal model seçiciler için değil, tanılama ve keşif UI'ları için kullanın.

## Exec onayları

- Bir exec isteği onay gerektirdiğinde Gateway `exec.approval.requested` yayınlar.
- Operatör istemcileri `exec.approval.resolve` çağırarak çözümler (`operator.approvals` kapsamı gerektirir).
- `host=node` için `exec.approval.request`, `systemRunPlan` içermelidir (kanonik `argv`/`cwd`/`rawCommand`/oturum meta verileri). `systemRunPlan` eksik olan istekler reddedilir.
- Onaydan sonra iletilen `node.invoke system.run` çağrıları, yetkili komut/cwd/oturum bağlamı olarak bu kanonik
  `systemRunPlan` öğesini yeniden kullanır.
- Bir çağıran, hazırlama ile son onaylı `system.run` iletimi arasında `command`, `rawCommand`, `cwd`, `agentId` veya
  `sessionKey` öğesini değiştirirse Gateway, değiştirilmiş payload'a güvenmek yerine çalıştırmayı reddeder.

## Aracı teslim fallback'i

- `agent` istekleri, giden teslim istemek için `deliver=true` içerebilir.
- `bestEffortDeliver=false` katı davranışı korur: çözümlenemeyen veya yalnızca dahili teslim hedefleri `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici teslim edilebilir bir rota çözümlenemediğinde oturumla sınırlı yürütmeye fallback yapılmasına izin verir (örneğin dahili/webchat oturumları veya belirsiz çok kanallı yapılandırmalar).

## Sürümleme

- `PROTOCOL_VERSION`, `src/gateway/protocol/schema/protocol-schemas.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu uyumsuzlukları reddeder.
- Şemalar + modeller TypeBox tanımlarından üretilir:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### İstemci sabitleri

`src/gateway/client.ts` içindeki referans istemci bu varsayılanları kullanır. Değerler
protokol v3 boyunca stabildir ve üçüncü taraf istemciler için beklenen temel değerdir.

| Sabit                                     | Varsayılan                                            | Kaynak                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| İstek zaman aşımı (RPC başına)            | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Ön kimlik doğrulama / bağlantı-sınaması zaman aşımı | `15_000` ms                                | `src/gateway/handshake-timeouts.ts` (yapılandırma/env, eşleştirilmiş sunucu/istemci bütçesini artırabilir) |
| İlk yeniden bağlanma backoff'u            | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maksimum yeniden bağlanma backoff'u       | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Cihaz token'ı kapanışından sonra hızlı yeniden deneme clamp'i | `250` ms                               | `src/gateway/client.ts`                                                                    |
| `terminate()` öncesi zorla durdurma bekleme süresi | `250` ms                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` varsayılan zaman aşımı    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Varsayılan tick aralığı (`hello-ok` öncesi) | `30_000` ms                                         | `src/gateway/client.ts`                                                                    |
| Tick zaman aşımı kapanışı                 | sessizlik `tickIntervalMs * 2` değerini aştığında kod `4000` | `src/gateway/client.ts`                                                            |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Sunucu, etkili `policy.tickIntervalMs`, `policy.maxPayload` ve
`policy.maxBufferedBytes` değerlerini `hello-ok` içinde duyurur; istemciler
el sıkışma öncesi varsayılanlar yerine bu değerlere uymalıdır.

## Kimlik doğrulama

- Paylaşılan gizli anahtarlı gateway kimlik doğrulaması, yapılandırılan kimlik doğrulama moduna bağlı olarak `connect.params.auth.token` veya
  `connect.params.auth.password` kullanır.
- Tailscale Serve (`gateway.auth.allowTailscale: true`) veya loopback dışı
  `gateway.auth.mode: "trusted-proxy"` gibi kimlik taşıyan modlar, bağlantı kimlik doğrulama denetimini
  `connect.params.auth.*` yerine istek başlıklarından karşılar.
- Özel giriş `gateway.auth.mode: "none"`, paylaşılan gizli anahtarlı bağlantı kimlik doğrulamasını
  tamamen atlar; bu modu herkese açık/güvenilmeyen girişlerde açığa çıkarmayın.
- Eşleştirmeden sonra Gateway, bağlantı rolü + kapsamlarıyla sınırlı bir **cihaz belirteci**
  verir. `hello-ok.auth.deviceToken` içinde döndürülür ve gelecekteki bağlantılar için
  istemci tarafından kalıcı hale getirilmelidir.
- İstemciler, başarılı her bağlantıdan sonra birincil `hello-ok.auth.deviceToken` değerini
  kalıcı hale getirmelidir.
- Bu **depolanmış** cihaz belirteciyle yeniden bağlanmak, o belirteç için depolanmış
  onaylı kapsam kümesini de yeniden kullanmalıdır. Bu, önceden verilmiş okuma/yoklama/durum erişimini
  korur ve yeniden bağlantıların sessizce daha dar, örtük yalnızca-yönetici kapsamına
  düşmesini önler.
- İstemci tarafı bağlantı kimlik doğrulaması oluşturma (`src/gateway/client.ts` içindeki
  `selectConnectAuth`):
  - `auth.password` bağımsızdır ve ayarlandığında her zaman iletilir.
  - `auth.token` öncelik sırasına göre doldurulur: önce açık paylaşılan belirteç,
    ardından açık bir `deviceToken`, ardından depolanmış cihaz başına belirteç (`deviceId` + `role` ile anahtarlanır).
  - `auth.bootstrapToken` yalnızca yukarıdakilerin hiçbiri bir `auth.token` olarak çözümlenmediğinde gönderilir.
    Paylaşılan belirteç veya çözümlenmiş herhangi bir cihaz belirteci bunu bastırır.
  - Tek seferlik `AUTH_TOKEN_MISMATCH` yeniden denemesinde depolanmış cihaz belirtecinin otomatik yükseltilmesi
    **yalnızca güvenilir uç noktalarla** sınırlandırılmıştır: loopback veya sabitlenmiş
    `tlsFingerprint` bulunan `wss://`. Sabitleme olmadan herkese açık `wss://`
    uygun sayılmaz.
- Ek `hello-ok.auth.deviceTokens` girdileri önyükleme devir belirteçleridir.
  Bunları yalnızca bağlantı `wss://` veya loopback/local eşleştirme gibi güvenilir bir taşıma üzerinde
  önyükleme kimlik doğrulaması kullandığında kalıcı hale getirin.
- Bir istemci **açık** bir `deviceToken` veya açık `scopes` sağlıyorsa, çağıranın istediği
  bu kapsam kümesi yetkili kalır; önbelleğe alınmış kapsamlar yalnızca istemci
  depolanmış cihaz başına belirteci yeniden kullanırken yeniden kullanılır.
- Cihaz belirteçleri `device.token.rotate` ve `device.token.revoke` ile döndürülebilir/iptal edilebilir
  (`operator.pairing` kapsamı gerektirir).
- `device.token.rotate`, döndürme meta verilerini döndürür. Yedek taşıyıcı belirteci yalnızca
  zaten o cihaz belirteciyle kimliği doğrulanmış aynı cihaz çağrıları için yankılar; böylece
  yalnızca belirteç kullanan istemciler yeniden bağlanmadan önce yedek belirteçlerini kalıcı hale getirebilir.
  Paylaşılan/yönetici döndürmeleri taşıyıcı belirteci yankılamaz.
- Belirteç verme, döndürme ve iptal işlemleri, o cihazın eşleştirme girdisinde kaydedilmiş
  onaylı rol kümesiyle sınırlı kalır; belirteç mutasyonu, eşleştirme onayının hiç vermediği
  bir cihaz rolünü genişletemez veya hedefleyemez.
- Eşleştirilmiş cihaz belirteci oturumlarında, çağıranın `operator.admin` yetkisi de yoksa
  cihaz yönetimi kendi kapsamıyla sınırlıdır: yönetici olmayan çağıranlar yalnızca **kendi**
  cihaz girdilerini kaldırabilir/iptal edebilir/döndürebilir.
- `device.token.rotate` ve `device.token.revoke`, hedef operatör belirteci kapsam kümesini
  çağıranın geçerli oturum kapsamlarına karşı da denetler. Yönetici olmayan çağıranlar,
  zaten sahip olduklarından daha geniş bir operatör belirtecini döndüremez veya iptal edemez.
- Kimlik doğrulama hataları `error.details.code` ile birlikte kurtarma ipuçları içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilir istemciler, önbelleğe alınmış cihaz başına belirteçle sınırlı bir yeniden deneme yapabilir.
  - Bu yeniden deneme başarısız olursa, istemciler otomatik yeniden bağlanma döngülerini durdurmalı ve operatör eylem rehberliğini göstermelidir.

## Cihaz kimliği + eşleştirme

- Node'lar, anahtar çifti parmak izinden türetilen kararlı bir cihaz kimliği (`device.id`) içermelidir.
- Gateway'ler cihaz + rol başına belirteç verir.
- Yerel otomatik onay etkin değilse yeni cihaz kimlikleri için eşleştirme onayları gereklidir.
- Eşleştirme otomatik onayı, doğrudan local loopback bağlantılarına odaklanır.
- OpenClaw ayrıca güvenilir paylaşılan gizli anahtarlı yardımcı akışlar için dar bir backend/konteyner-yerel kendine bağlanma yoluna sahiptir.
- Aynı ana bilgisayardaki tailnet veya LAN bağlantıları, eşleştirme açısından yine de uzak olarak değerlendirilir ve
  onay gerektirir.
- WS istemcileri normalde `connect` sırasında `device` kimliği içerir (operatör +
  node). Cihazsız tek operatör istisnaları açık güven yollarıdır:
  - localhost'a özel güvensiz HTTP uyumluluğu için `gateway.controlUi.allowInsecureAuth=true`.
  - başarılı `gateway.auth.mode: "trusted-proxy"` operatör Denetim UI kimlik doğrulaması.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (acil durum, ciddi güvenlik düşürmesi).
  - paylaşılan gateway belirteci/parolasıyla kimliği doğrulanmış doğrudan-loopback `gateway-client` backend RPC'leri.
- Tüm bağlantılar, sunucunun sağladığı `connect.challenge` tek kullanımlık değerini imzalamalıdır.

### Cihaz kimlik doğrulaması geçiş tanılamaları

Hala challenge öncesi imzalama davranışı kullanan eski istemciler için `connect` artık
`error.details.code` altında kararlı bir `error.details.reason` ile `DEVICE_AUTH_*` ayrıntı kodları döndürür.

Yaygın geçiş hataları:

| İleti                       | details.code                     | details.reason           | Anlamı                                             |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | İstemci `device.nonce` atladı (veya boş gönderdi). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | İstemci eski/yanlış tek kullanımlık değerle imzaladı. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | İmza yükü v2 yüküyle eşleşmiyor.                   |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | İmzalı zaman damgası izin verilen sapmanın dışında. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`, açık anahtar parmak iziyle eşleşmiyor. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Açık anahtar biçimi/standartlaştırma başarısız oldu. |

Geçiş hedefi:

- Her zaman `connect.challenge` bekleyin.
- Sunucu tek kullanımlık değerini içeren v2 yükünü imzalayın.
- Aynı tek kullanımlık değeri `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza yükü `v3` değeridir; bu, cihaz/istemci/rol/kapsamlar/belirteç/tek kullanımlık değer alanlarına ek olarak
  `platform` ve `deviceFamily` alanlarını bağlar.
- Eski `v2` imzaları uyumluluk için kabul edilmeye devam eder, ancak eşleştirilmiş cihaz
  meta veri sabitlemesi yeniden bağlantıda komut politikasını yine de denetler.

## TLS + sabitleme

- WS bağlantıları için TLS desteklenir.
- İstemciler isteğe bağlı olarak gateway sertifika parmak izini sabitleyebilir (`gateway.tls`
  yapılandırmasına ve `gateway.remote.tlsFingerprint` ya da CLI `--tls-fingerprint` değerine bakın).

## Kapsam

Bu protokol **tam gateway API**'sini açığa çıkarır (durum, kanallar, modeller, sohbet,
ajan, oturumlar, node'lar, onaylar vb.). Kesin yüzey, `src/gateway/protocol/schema.ts` içindeki
TypeBox şemalarıyla tanımlanır.

## İlgili

- [Köprü protokolü](/tr/gateway/bridge-protocol)
- [Gateway çalıştırma kılavuzu](/tr/gateway)
