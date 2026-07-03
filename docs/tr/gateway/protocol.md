---
read_when:
    - Gateway WS istemcilerini uygulama veya güncelleme
    - Protokol uyuşmazlıklarında veya bağlantı hatalarında hata ayıklama
    - Protokol şeması/modelleri yeniden oluşturuluyor
summary: 'Gateway WebSocket protokolü: el sıkışma, çerçeveler, sürümleme'
title: Gateway protokolü
x-i18n:
    generated_at: "2026-07-03T09:55:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b58ef44b15e7359ca919e487bcf94c86601f508500ece000aafd8d1a90fb1cf1
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protokolü, OpenClaw için **tek denetim düzlemi + düğüm taşımasıdır**.
Tüm istemciler (CLI, web UI, macOS uygulaması, iOS/Android düğümleri, başsız
düğümler) WebSocket üzerinden bağlanır ve el sıkışma sırasında **rollerini** +
**kapsamlarını** bildirir.

## Taşıma

- WebSocket, JSON yükleri içeren metin çerçeveleri.
- İlk çerçeve **mutlaka** bir `connect` isteği olmalıdır.
- Bağlantı öncesi çerçeveler 64 KiB ile sınırlandırılır. Başarılı bir el sıkışmadan sonra istemciler
  `hello-ok.policy.maxPayload` ve
  `hello-ok.policy.maxBufferedBytes` sınırlarına uymalıdır. Tanılama etkinleştirildiğinde,
  aşırı büyük gelen çerçeveler ve yavaş giden arabellekler, Gateway etkilenen çerçeveyi kapatmadan
  veya düşürmeden önce `payload.large` olayları yayar. Bu olaylar
  boyutları, sınırları, yüzeyleri ve güvenli neden kodlarını tutar. İleti
  gövdesini, ek içeriklerini, ham çerçeve gövdesini, tokenları, çerezleri veya gizli değerleri tutmazlar.

## El sıkışma (connect)

Gateway → İstemci (bağlantı öncesi sınama):

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
    "maxProtocol": 4,
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
    "protocol": 4,
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

Gateway hâlâ başlangıç sidecar’larını tamamlıyorken `connect` isteği,
`details.reason` değeri `"startup-sidecars"` olarak ayarlanmış ve `retryAfterMs` içeren
yeniden denenebilir bir `UNAVAILABLE` hatası döndürebilir. İstemciler, bunu sonlandırıcı
bir el sıkışma hatası olarak göstermek yerine, genel bağlantı bütçeleri içinde
bu yanıtı yeniden denemelidir.

`server`, `features`, `snapshot` ve `policy` şema tarafından zorunlu tutulur
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` da zorunludur ve
uzlaşılan rol/kapsamları bildirir. `pluginSurfaceUrls` isteğe bağlıdır ve `canvas` gibi
Plugin yüzeyi adlarını kapsamlı barındırılan URL’lere eşler.

Kapsamlı Plugin yüzeyi URL’lerinin süresi dolabilir. Düğümler,
`pluginSurfaceUrls` içinde yeni bir giriş almak için
`node.pluginSurface.refresh` öğesini `{ "surface": "canvas" }` ile çağırabilir.
Deneysel Canvas Plugin yeniden düzenlemesi, kullanımdan kaldırılmış `canvasHostUrl`,
`canvasCapability` veya `node.canvas.capability.refresh` uyumluluk yolunu
desteklemez; güncel yerel istemciler ve gateway’ler Plugin yüzeylerini kullanmalıdır.

Herhangi bir cihaz tokenı verilmediğinde `hello-ok.auth`, token alanları olmadan
uzlaşılan izinleri bildirir:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilir aynı süreç içi arka uç istemcileri (`client.id: "gateway-client"`,
`client.mode: "backend"`), paylaşılan gateway tokenı/parolasıyla kimlik doğrulaması yaptıklarında
doğrudan loopback bağlantılarında `device` alanını atlayabilir. Bu yol, dahili
denetim düzlemi RPC’leri için ayrılmıştır ve eski CLI/cihaz eşleştirme başlangıç değerlerinin
alt ajan oturumu güncellemeleri gibi yerel arka uç işlerini engellemesini önler. Uzak istemciler,
tarayıcı kökenli istemciler, düğüm istemcileri ve açık cihaz-tokenı/cihaz-kimliğine sahip
istemciler normal eşleştirme ve kapsam yükseltme denetimlerini kullanmaya devam eder.

Bir cihaz tokenı verildiğinde `hello-ok` ayrıca şunları içerir:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Yerleşik QR/kurulum kodu bootstrap’i yeni bir mobil devir yoludur. Başarılı
bir temel kurulum kodu bağlantısı, birincil düğüm tokenı ve bir sınırlandırılmış
operatör tokenı döndürür:

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

Operatör devri kasıtlı olarak sınırlandırılmıştır; böylece QR ile katılım,
`operator.admin` veya `operator.pairing` vermeden mobil operatör döngüsünü başlatabilir.
Yerel istemcinin bootstrap sonrasında ihtiyaç duyduğu Talk yapılandırmasını okuyabilmesi için
`operator.talk.secrets` kapsamını içerir. Daha geniş yönetici ve eşleştirme kapsamları,
ayrı bir onaylanmış operatör eşleştirmesi veya token akışı gerektirir. İstemciler,
`hello-ok.auth.deviceTokens` değerini yalnızca bağlantı `wss://` veya
loopback/yerel eşleştirme gibi güvenilir taşıma üzerinde bootstrap kimlik doğrulaması kullandığında
kalıcı olarak saklamalıdır.

### Node örneği

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
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

## Çerçeveleme

- **İstek**: `{type:"req", id, method, params}`
- **Yanıt**: `{type:"res", id, ok, payload|error}`
- **Olay**: `{type:"event", event, payload, seq?, stateVersion?}`

Yan etki oluşturan yöntemler **idempotency anahtarları** gerektirir (şemaya bakın).

## Roller + kapsamlar

Tam operatör kapsam modeli, onay zamanı denetimleri ve paylaşılan gizli
anlamları için bkz. [Operatör kapsamları](/tr/gateway/operator-scopes).

### Roller

- `operator` = denetim düzlemi istemcisi (CLI/UI/otomasyon).
- `node` = yetenek barındırıcısı (kamera/ekran/canvas/system.run).

### Kapsamlar (operatör)

Yaygın kapsamlar:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` ile `talk.config`, `operator.talk.secrets`
(veya `operator.admin`) gerektirir.
Gizli değerler dahil edildiğinde istemciler etkin Talk sağlayıcı kimlik bilgisini
`talk.resolved.config.apiKey` üzerinden okumalıdır; `talk.providers.<id>.apiKey`
kaynak biçimini korur ve bir SecretRef nesnesi veya sansürlenmiş bir dize olabilir.

Plugin tarafından kaydedilen Gateway RPC yöntemleri kendi operatör kapsamlarını isteyebilir, ancak
ayrılmış çekirdek yönetici önekleri (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) her zaman `operator.admin` olarak çözümlenir.

Yöntem kapsamı yalnızca ilk kapıdır. `chat.send` üzerinden ulaşılan bazı eğik çizgi komutları
buna ek olarak daha sıkı komut düzeyi denetimler uygular. Örneğin, kalıcı
`/config set` ve `/config unset` yazmaları `operator.admin` gerektirir.

`node.pair.approve`, temel yöntem kapsamına ek olarak fazladan bir onay zamanı
kapsam denetimine de sahiptir:

- komutsuz istekler: `operator.pairing`
- exec olmayan düğüm komutları içeren istekler: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which` içeren istekler:
  `operator.pairing` + `operator.admin`

### Yetenekler/komutlar/izinler (düğüm)

Düğümler bağlantı sırasında yetenek iddialarını bildirir:

- `caps`: `camera`, `canvas`, `screen`,
  `location`, `voice` ve `talk` gibi üst düzey yetenek kategorileri.
- `commands`: invoke için komut izin listesi.
- `permissions`: ayrıntılı açma/kapama değerleri (ör. `screen.record`, `camera.capture`).

Gateway bunları **iddia** olarak ele alır ve sunucu tarafı izin listelerini uygular.

## Varlık

- `system-presence`, cihaz kimliğine göre anahtarlanmış girdiler döndürür.
- Varlık girdileri `deviceId`, `roles` ve `scopes` içerir; böylece UI’lar, cihaz hem **operator**
  hem de **node** olarak bağlansa bile cihaz başına tek bir satır gösterebilir.
- `node.list`, isteğe bağlı `lastSeenAtMs` ve `lastSeenReason` alanlarını içerir. Bağlı düğümler,
  geçerli bağlantı zamanlarını `connect` nedeniyle `lastSeenAtMs` olarak bildirir; eşleştirilmiş düğümler,
  güvenilir bir düğüm olayı eşleştirme meta verilerini güncellediğinde kalıcı arka plan varlığı da bildirebilir.

### Düğüm arka plan canlı olayı

Düğümler, eşleştirilmiş bir düğümün arka plan uyanışı sırasında bağlı olarak işaretlenmeden
canlı olduğunu kaydetmek için `event: "node.presence.alive"` ile `node.event` çağırabilir.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` kapalı bir enum’dur: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` veya `connect`. Bilinmeyen trigger dizeleri,
kalıcılıktan önce gateway tarafından `background` olarak normalleştirilir. Olay yalnızca kimliği doğrulanmış düğüm
cihaz oturumları için kalıcıdır; cihazsız veya eşleştirilmemiş oturumlar `handled: false` döndürür.

Başarılı gateway’ler yapılandırılmış bir sonuç döndürür:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Daha eski gateway’ler `node.event` için hâlâ `{ "ok": true }` döndürebilir; istemciler bunu
kalıcı varlık saklama olarak değil, onaylanmış bir RPC olarak ele almalıdır.

## Yayın olayı kapsamlandırması

Sunucu tarafından gönderilen WebSocket yayın olayları kapsam kapılıdır; böylece eşleştirme kapsamlı veya yalnızca düğüm oturumları, oturum içeriğini pasif olarak almaz.

- **Sohbet, ajan ve araç sonucu çerçeveleri** (akışlı `agent` olayları ve araç çağrısı sonuçları dahil) en az `operator.read` gerektirir. `operator.read` olmayan oturumlar bu çerçeveleri tamamen atlar.
- **Plugin tanımlı `plugin.*` yayınları**, Plugin’in bunları nasıl kaydettiğine bağlı olarak `operator.write` veya `operator.admin` ile kapılanır.
- **Durum ve taşıma olayları** (`heartbeat`, `presence`, `tick`, bağlantı/bağlantı kesme yaşam döngüsü vb.) sınırsız kalır; böylece taşıma sağlığı her kimliği doğrulanmış oturum tarafından gözlemlenebilir kalır.
- **Bilinmeyen yayın olayı aileleri**, kayıtlı bir işleyici bunları açıkça gevşetmediği sürece varsayılan olarak kapsam kapılıdır (kapalı başarısızlık).

Her istemci bağlantısı kendi istemci başına sıra numarasını tutar; böylece farklı istemciler olay akışının farklı kapsamla filtrelenmiş alt kümelerini görse bile yayınlar o sokette monoton sıralamayı korur.

## Yaygın RPC yöntem aileleri

Genel WS yüzeyi yukarıdaki el sıkışma/kimlik doğrulama örneklerinden daha geniştir. Bu,
oluşturulmuş bir döküm değildir — `hello-ok.features.methods`, `src/gateway/server-methods-list.ts`
artı yüklenmiş Plugin/kanal yöntemi dışa aktarımlarından oluşturulan korumacı
bir keşif listesidir. Bunu, `src/gateway/server-methods/*.ts` için tam
bir numaralandırma değil, özellik keşfi olarak ele alın.

  <AccordionGroup>
  <Accordion title="Sistem ve kimlik">
    - `health` önbelleğe alınmış veya yeni yoklanmış gateway sağlık anlık görüntüsünü döndürür.
    - `diagnostics.stability` son döneme ait sınırlı tanılama kararlılığı kaydedicisini döndürür. Olay adları, sayılar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/plugin adları ve oturum kimlikleri gibi operasyonel meta verileri tutar. Sohbet metnini, webhook gövdelerini, araç çıktılarını, ham istek veya yanıt gövdelerini, tokenları, çerezleri ya da gizli değerleri tutmaz. Operatör okuma kapsamı gerekir.
    - `status` `/status` tarzı gateway özetini döndürür; hassas alanlar yalnızca yönetici kapsamlı operatör istemcileri için dahil edilir.
    - `gateway.identity.get` aktarma ve eşleştirme akışları tarafından kullanılan gateway cihaz kimliğini döndürür.
    - `system-presence` bağlı operatör/node cihazları için geçerli varlık anlık görüntüsünü döndürür.
    - `system-event` bir sistem olayı ekler ve varlık bağlamını güncelleyebilir/yayınlayabilir.
    - `last-heartbeat` en son kalıcı hale getirilmiş heartbeat olayını döndürür.
    - `set-heartbeats` gateway üzerinde heartbeat işlemeyi açıp kapatır.

  </Accordion>

  <Accordion title="Modeller ve kullanım">
    - `models.list` çalışma zamanında izin verilen model kataloğunu döndürür. Seçici boyutundaki yapılandırılmış modeller için (`agents.defaults.models` önce, ardından `models.providers.*.models`) `{ "view": "configured" }`, tam katalog için `{ "view": "all" }` geçirin.
    - `usage.status` sağlayıcı kullanım pencerelerini/kalan kota özetlerini döndürür.
    - `usage.cost` bir tarih aralığı için birleştirilmiş maliyet kullanım özetlerini döndürür.
      Tek bir agent için `agentId`, yapılandırılmış agentları toplamak için `agentScope: "all"` geçirin.
    - `doctor.memory.status` etkin varsayılan agent çalışma alanı için vektör bellek / önbelleğe alınmış embedding hazır olma durumunu döndürür. Yalnızca çağıran açıkça canlı embedding sağlayıcısı ping'i istediğinde `{ "probe": true }` veya `{ "deep": true }` geçirin. Dreaming uyumlu istemciler, Dreaming depo istatistiklerini seçili bir agent çalışma alanına kapsamlamak için `{ "agentId": "agent-id" }` de geçirebilir; `agentId` atlanırsa varsayılan agent yedeği korunur ve yapılandırılmış Dreaming çalışma alanları birleştirilir.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` ve `doctor.memory.dedupeDreamDiary` seçili-agent Dreaming görünümleri/eylemleri için isteğe bağlı `{ "agentId": "agent-id" }` parametrelerini kabul eder. `agentId` atlandığında, yapılandırılmış varsayılan agent çalışma alanında çalışırlar.
    - `doctor.memory.remHarness` uzak kontrol düzlemi istemcileri için sınırlı, salt okunur bir REM harness önizlemesi döndürür. Çalışma alanı yollarını, bellek parçacıklarını, işlenmiş grounded markdown'u ve derin terfi adaylarını içerebilir; bu nedenle çağıranların `operator.read` yetkisine ihtiyacı vardır.
    - `sessions.usage` oturum başına kullanım özetlerini döndürür. Tek bir
      agent için `agentId`, yapılandırılmış agentları birlikte listelemek için `agentScope: "all"` geçirin.
    - `sessions.usage.timeseries` tek bir oturum için zaman serisi kullanımını döndürür.
    - `sessions.usage.logs` tek bir oturum için kullanım günlüğü girdilerini döndürür.

  </Accordion>

  <Accordion title="Kanallar ve oturum açma yardımcıları">
    - `channels.status` yerleşik + paketli kanal/plugin durum özetlerini döndürür.
    - `channels.logout` kanalın oturum kapatmayı desteklediği belirli bir kanal/hesap oturumunu kapatır.
    - `web.login.start` geçerli QR uyumlu web kanal sağlayıcısı için bir QR/web oturum açma akışı başlatır.
    - `web.login.wait` bu QR/web oturum açma akışının tamamlanmasını bekler ve başarı durumunda kanalı başlatır.
    - `push.test` kayıtlı bir iOS node'una test APNs push'u gönderir.
    - `voicewake.get` depolanmış uyandırma sözcüğü tetikleyicilerini döndürür.
    - `voicewake.set` uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayınlar.

  </Accordion>

  <Accordion title="Mesajlaşma ve günlükler">
    - `send` sohbet çalıştırıcısı dışındaki kanal/hesap/thread hedefli gönderimler için doğrudan giden teslimat RPC'sidir.
    - `logs.tail` imleç/sınır ve maksimum bayt denetimleriyle yapılandırılmış gateway dosya günlüğü kuyruğunu döndürür.

  </Accordion>

  <Accordion title="Talk ve TTS">
    - `talk.catalog` konuşma, akışlı transkripsiyon ve gerçek zamanlı ses için salt okunur Talk sağlayıcı kataloğunu döndürür. Kanonik sağlayıcı kimliklerini, kayıt defteri takma adlarını, etiketleri, yapılandırılmış durumu, isteğe bağlı grup düzeyi `ready` sonucunu, açığa çıkarılan model/ses kimliklerini, kanonik modları, taşımaları, brain stratejilerini ve gerçek zamanlı ses/yetenek bayraklarını içerir; sağlayıcı sırlarını döndürmez veya global yapılandırmayı değiştirmez. Geçerli Gateway'ler çalışma zamanı sağlayıcı seçimi uygulandıktan sonra `ready` ayarlar; istemciler, eski Gateway'lerle uyumluluk için bunun yokluğunu doğrulanmamış olarak ele almalıdır.
    - `talk.config` etkin Talk yapılandırma payload'unu döndürür; `includeSecrets`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.
    - `talk.session.create`, `realtime/gateway-relay`, `transcription/gateway-relay` veya `stt-tts/managed-room` için Gateway sahipli bir Talk oturumu oluşturur. `stt-tts/managed-room` için `sessionKey` geçiren `operator.write` çağıranları, kapsamlı oturum anahtarı görünürlüğü için `spawnedBy` de geçirmelidir; kapsamsız `sessionKey` oluşturma ve `brain: "direct-tools"` `operator.admin` gerektirir.
    - `talk.session.join` bir managed-room oturum tokenını doğrular, gerektiğinde `session.ready` veya `session.replaced` olaylarını yayar ve düz metin token veya depolanmış token hash'i olmadan oda/oturum meta verilerini ve son Talk olaylarını döndürür.
    - `talk.session.appendAudio` Gateway sahipli gerçek zamanlı aktarma ve transkripsiyon oturumlarına base64 PCM giriş sesi ekler.
    - `talk.session.startTurn`, `talk.session.endTurn` ve `talk.session.cancelTurn`, durum temizlenmeden önce eski-turn reddiyle managed-room turn yaşam döngüsünü yürütür.
    - `talk.session.cancelOutput` çoğunlukla Gateway aktarma oturumlarında VAD kapılı araya girme için asistan ses çıktısını durdurur.
    - `talk.session.submitToolResult` Gateway sahipli gerçek zamanlı aktarma oturumu tarafından yayılan bir sağlayıcı araç çağrısını tamamlar. Nihai bir sonuç daha sonra gelecekse ara araç çıktısı için `options: { willContinue: true }`, araç sonucunun başka bir gerçek zamanlı asistan yanıtı başlatmadan sağlayıcı çağrısını karşılaması gerekiyorsa `options: { suppressResponse: true }` geçirin.
    - `talk.session.steer` Gateway sahipli agent destekli bir Talk oturumuna etkin-run ses denetimi gönderir. `{ sessionId, text, mode? }` kabul eder; burada `mode` `status`, `steer`, `cancel` veya `followup` değerlerinden biridir; atlanan mod konuşulan metinden sınıflandırılır.
    - `talk.session.close` Gateway sahipli bir aktarma, transkripsiyon veya managed-room oturumunu kapatır ve terminal Talk olaylarını yayar.
    - `talk.mode` WebChat/Control UI istemcileri için geçerli Talk modu durumunu ayarlar/yayınlar.
    - `talk.client.create`, Gateway yapılandırma, kimlik bilgileri, talimatlar ve araç politikasına sahipken `webrtc` veya `provider-websocket` kullanarak istemci sahipli gerçek zamanlı sağlayıcı oturumu oluşturur.
    - `talk.client.toolCall`, istemci sahipli gerçek zamanlı taşımaların sağlayıcı araç çağrılarını Gateway politikasına iletmesini sağlar. Desteklenen ilk araç `openclaw_agent_consult`'tur; istemciler sağlayıcıya özgü araç sonucunu göndermeden önce bir run kimliği alır ve normal sohbet yaşam döngüsü olaylarını bekler.
    - `talk.client.steer` istemci sahipli gerçek zamanlı taşımalar için etkin-run ses denetimi gönderir. Gateway, etkin gömülü run'ı `sessionKey` üzerinden çözer ve yönlendirmeyi sessizce düşürmek yerine yapılandırılmış kabul edildi/reddedildi sonucu döndürür.
    - `talk.event` gerçek zamanlı, transkripsiyon, STT/TTS, managed-room, telefon ve toplantı adaptörleri için tek Talk olay kanalıdır.
    - `talk.speak` etkin Talk konuşma sağlayıcısı üzerinden konuşma sentezler.
    - `tts.status` TTS etkin durumunu, etkin sağlayıcıyı, yedek sağlayıcıları ve sağlayıcı yapılandırma durumunu döndürür.
    - `tts.providers` görünür TTS sağlayıcı envanterini döndürür.
    - `tts.enable` ve `tts.disable` TTS tercih durumunu açıp kapatır.
    - `tts.setProvider` tercih edilen TTS sağlayıcısını günceller.
    - `tts.convert` tek seferlik metinden konuşmaya dönüştürme çalıştırır.

  </Accordion>

  <Accordion title="Sırlar, yapılandırma, güncelleme ve sihirbaz">
    - `secrets.reload` etkin SecretRef'leri yeniden çözer ve çalışma zamanı sır durumunu yalnızca tam başarı durumunda değiştirir.
    - `secrets.resolve` belirli bir komut/hedef kümesi için komut hedefli sır atamalarını çözer.
    - `config.get` geçerli yapılandırma anlık görüntüsünü ve hash'i döndürür.
    - `config.set` doğrulanmış bir yapılandırma payload'u yazar.
    - `config.patch` kısmi bir yapılandırma güncellemesini birleştirir. Yıkıcı dizi
      değiştirme, etkilenen yolun `replacePaths` içinde olmasını gerektirir; dizi girdileri
      altındaki iç içe diziler `agents.list[].skills` gibi `[]` yollarını kullanır.
    - `config.apply` tam yapılandırma payload'unu doğrular + değiştirir.
    - `config.schema` Control UI ve CLI araçları tarafından kullanılan canlı yapılandırma şeması payload'unu döndürür: şema, `uiHints`, sürüm ve üretim meta verileri; çalışma zamanı bunları yükleyebildiğinde plugin + kanal şema meta verileri de dahil. Şema, eşleşen alan dokümantasyonu bulunduğunda iç içe nesne, wildcard, dizi öğesi ve `anyOf` / `oneOf` / `allOf` bileşim dalları dahil UI tarafından kullanılan aynı etiketlerden ve yardım metninden türetilmiş alan `title` / `description` meta verilerini içerir.
    - `config.schema.lookup` tek bir yapılandırma yolu için yol kapsamlı arama payload'u döndürür: normalleştirilmiş yol, yüzeysel bir şema node'u, eşleşen ipucu + `hintPath`, isteğe bağlı `reloadKind` ve UI/CLI detaya inme için doğrudan alt özetleri. `reloadKind`, `restart`, `hot` veya `none` değerlerinden biridir ve istenen yol için Gateway yapılandırma yeniden yükleme planlayıcısını yansıtır. Arama şema node'ları kullanıcıya dönük dokümanları ve yaygın doğrulama alanlarını (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, sayısal/string/dizi/nesne sınırları ve `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi bayraklar) korur. Alt özetler `key`, normalleştirilmiş `path`, `type`, `required`, `hasChildren`, isteğe bağlı `reloadKind` ve eşleşen `hint` / `hintPath` değerlerini açığa çıkarır.
    - `update.run` gateway güncelleme akışını çalıştırır ve yalnızca güncellemenin kendisi başarılı olduğunda yeniden başlatma zamanlar; oturumu olan çağıranlar `continuationMessage` ekleyebilir, böylece başlatma yeniden başlatma devam kuyruğu üzerinden bir takip agent turn'ü sürdürür. Kontrol düzleminden gelen paket yöneticisi güncellemeleri ve gözetimli git-checkout güncellemeleri, canlı Gateway içinde paket ağacını değiştirmek veya checkout/build çıktısını mutasyona uğratmak yerine ayrılmış bir yönetilen hizmet devrine geçer. Başlatılmış bir devir `result.reason: "managed-service-handoff-started"` ve `handoff.status: "started"` ile `ok: true` döndürür; kullanılamayan veya başarısız devirler `managed-service-handoff-unavailable` ya da `managed-service-handoff-failed` ile `ok: false`, ayrıca manuel shell güncellemesi gerektiğinde `handoff.command` döndürür. Kullanılamayan bir devir, OpenClaw'ın güvenli bir gözetmen sınırından veya systemd için `OPENCLAW_SYSTEMD_UNIT` gibi dayanıklı hizmet kimliğinden yoksun olduğu anlamına gelir. Başlatılmış bir devir sırasında yeniden başlatma sentineli kısa süreyle `stats.reason: "restart-health-pending"` bildirebilir; devam, CLI yeniden başlatılmış Gateway'i doğrulayıp nihai `ok` sentinelini yazana kadar geciktirilir.
    - `update.status` en son güncelleme yeniden başlatma sentinelini yeniler ve döndürür; varsa yeniden başlatma sonrası çalışan sürüm de dahil edilir.
    - `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`, başlangıç sihirbazını WS RPC üzerinden açığa çıkarır.

  </Accordion>

  <Accordion title="Agent and workspace helpers">
    - `agents.list`, etkili model ve runtime metadatası dahil yapılandırılmış agent girdilerini döndürür.
    - `agents.create`, `agents.update` ve `agents.delete`, agent kayıtlarını ve çalışma alanı bağlantılarını yönetir.
    - `agents.files.list`, `agents.files.get` ve `agents.files.set`, bir agent için sunulan bootstrap çalışma alanı dosyalarını yönetir.
    - `tasks.list`, `tasks.get` ve `tasks.cancel`, Gateway görev defterini SDK ve operatör istemcilerine açar.
    - `artifacts.list`, `artifacts.get` ve `artifacts.download`, açık bir `sessionKey`, `runId` veya `taskId` kapsamı için transcript kaynaklı artifact özetlerini ve indirmeleri açar. Run ve görev sorguları, sahip session'ı sunucu tarafında çözümler ve yalnızca eşleşen provenance'a sahip transcript medyasını döndürür; güvenli olmayan veya yerel URL kaynakları sunucu tarafında getirilmek yerine desteklenmeyen indirmeler döndürür.
    - `environments.list` ve `environments.status`, SDK istemcileri için salt okunur Gateway-yerel ve node ortam keşfini açar.
    - `agent.identity.get`, bir agent veya session için etkili assistant kimliğini döndürür.
    - `agent.wait`, bir run'ın bitmesini bekler ve varsa terminal snapshot'ını döndürür.

  </Accordion>

  <Accordion title="Session control">
    - `sessions.list`, bir agent runtime backend'i yapılandırıldığında satır başına `agentRuntime` metadatası dahil geçerli session dizinini döndürür.
    - `sessions.subscribe` ve `sessions.unsubscribe`, geçerli WS istemcisi için session değişikliği olay aboneliklerini açıp kapatır.
    - `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`, tek bir session için transcript/mesaj olay aboneliklerini açıp kapatır.
    - `sessions.preview`, belirli session anahtarları için sınırlandırılmış transcript önizlemeleri döndürür.
    - `sessions.describe`, tam bir session anahtarı için bir Gateway session satırı döndürür.
    - `sessions.resolve`, bir session hedefini çözümler veya kanonikleştirir.
    - `sessions.create`, yeni bir session girdisi oluşturur.
    - `sessions.send`, mevcut bir session'a mesaj gönderir.
    - `sessions.steer`, etkin bir session için interrupt-and-steer varyantıdır.
    - `sessions.abort`, bir session için etkin işi iptal eder. Bir çağıran `key` artı isteğe bağlı `runId` geçirebilir veya Gateway'in bir session'a çözümleyebildiği etkin run'lar için yalnızca `runId` geçirebilir.
    - `sessions.patch`, session metadatasını/override'larını günceller ve çözümlenen kanonik modeli artı etkili `agentRuntime` değerini bildirir.
    - `sessions.reset`, `sessions.delete` ve `sessions.compact`, session bakımını gerçekleştirir.
    - `sessions.get`, depolanan tam session satırını döndürür.
    - Chat yürütmesi hâlâ `chat.history`, `chat.send`, `chat.abort` ve `chat.inject` kullanır. `chat.history`, UI istemcileri için görüntüleme-normalize edilmiştir: inline yönerge etiketleri görünür metinden çıkarılır, düz metin tool-call XML payload'ları (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş tool-call blokları dahil) ve sızan ASCII/tam genişlikli model kontrol token'ları çıkarılır, tam `NO_REPLY` / `no_reply` gibi saf sessiz-token assistant satırları atlanır ve aşırı büyük satırlar placeholder'larla değiştirilebilir.
    - `chat.message.get`, tek bir görünür transcript girdisi için eklemeli sınırlandırılmış tam mesaj okuyucusudur. İstemciler `sessionKey`, session seçimi agent kapsamlı olduğunda isteğe bağlı `agentId` ve daha önce `chat.history` üzerinden sunulmuş bir transcript `messageId` geçirir; Gateway, depolanan girdi hâlâ mevcutsa ve aşırı büyük değilse hafif history kesme sınırı olmadan aynı görüntüleme-normalize edilmiş projection'ı döndürür.
    - `chat.send`, auto cutoff'tan önce başlatılan model çağrılarında fast mode kullanmak, ardından daha sonraki retry, fallback, tool-result veya continuation çağrılarını fast mode olmadan başlatmak için tek turluk `fastMode: "auto"` kabul eder. Cutoff varsayılan olarak 60 saniyedir ve model başına `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` ile yapılandırılabilir. Bir `chat.send` çağıranı, bu istek için cutoff'u override etmek üzere tek turluk `fastAutoOnSeconds` geçirebilir.

  </Accordion>

  <Accordion title="Device pairing and device tokens">
    - `device.pair.list`, bekleyen ve onaylanmış eşleştirilmiş cihazları döndürür.
    - `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`, cihaz eşleştirme kayıtlarını yönetir.
    - `device.token.rotate`, eşleştirilmiş bir cihaz token'ını onaylanmış rolü ve çağıran kapsamı sınırları içinde döndürür.
    - `device.token.revoke`, eşleştirilmiş bir cihaz token'ını onaylanmış rolü ve çağıran kapsamı sınırları içinde iptal eder.

  </Accordion>

  <Accordion title="Node pairing, invoke, and pending work">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` ve `node.pair.verify`, node eşleştirmeyi ve bootstrap doğrulamasını kapsar.
    - `node.list` ve `node.describe`, bilinen/bağlı node durumunu döndürür.
    - `node.rename`, eşleştirilmiş bir node etiketini günceller.
    - `node.invoke`, bağlı bir node'a komut iletir.
    - `node.invoke.result`, bir invoke isteğinin sonucunu döndürür.
    - `node.event`, node kaynaklı olayları gateway'e geri taşır.
    - `node.pending.pull` ve `node.pending.ack`, bağlı-node kuyruk API'leridir.
    - `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısı kesilmiş node'lar için kalıcı bekleyen işleri yönetir.

  </Accordion>

  <Accordion title="Approval families">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve `exec.approval.resolve`, tek seferlik exec onay isteklerini ve bekleyen onay arama/yeniden oynatmayı kapsar.
    - `exec.approval.waitDecision`, bekleyen bir exec onayında bekler ve nihai kararı döndürür (veya zaman aşımında `null`).
    - `exec.approvals.get` ve `exec.approvals.set`, gateway exec onay policy snapshot'larını yönetir.
    - `exec.approvals.node.get` ve `exec.approvals.node.set`, node relay komutları üzerinden node-yerel exec onay policy'sini yönetir.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` ve `plugin.approval.resolve`, plugin tanımlı onay akışlarını kapsar.

  </Accordion>

  <Accordion title="Automation, skills, and tools">
    - Otomasyon: `wake`, anında veya sonraki Heartbeat'te bir uyandırma metni enjeksiyonu zamanlar; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zamanlanmış işi yönetir.
    - `cron.run`, manuel run'lar için enqueue tarzı bir RPC olarak kalır. Tamamlanma semantiğine ihtiyaç duyan istemciler döndürülen `runId` değerini okumalı ve `cron.runs` için polling yapmalıdır.
    - `cron.runs`, istemcilerin aynı job için diğer history girdileriyle yarışmadan kuyruktaki tek bir manuel run'ı izleyebilmesi için isteğe bağlı boş olmayan bir `runId` filtresi kabul eder.
    - Skills ve araçlar: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Yaygın olay aileleri

- `chat`: `chat.inject` gibi UI chat güncellemeleri ve diğer yalnızca transcript chat
  olayları. Protokol v4'te delta payload'ları `deltaText` taşır; `message`
  kümülatif assistant snapshot'ı olarak kalır. Prefix olmayan değiştirmeler `replace=true`
  ayarlar ve değiştirme metni olarak `deltaText` kullanır.
- `session.message`, `session.operation` ve `session.tool`: abone olunan bir
  session için transcript, devam eden session operation'ı ve event-stream
  güncellemeleri.
- `sessions.changed`: session dizini veya metadata değişti.
- `presence`: sistem presence snapshot güncellemeleri.
- `tick`: periyodik keepalive / liveness olayı.
- `health`: gateway health snapshot güncellemesi.
- `heartbeat`: Heartbeat event stream güncellemesi.
- `cron`: Cron run/job değişikliği olayı.
- `shutdown`: gateway kapatma bildirimi.
- `node.pair.requested` / `node.pair.resolved`: node eşleştirme lifecycle'ı.
- `node.invoke.request`: node invoke isteği broadcast'i.
- `device.pair.requested` / `device.pair.resolved`: eşleştirilmiş cihaz lifecycle'ı.
- `voicewake.changed`: wake-word trigger yapılandırması değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onay
  lifecycle'ı.
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin onay
  lifecycle'ı.

### Node helper yöntemleri

- Node'lar, auto-allow kontrolleri için geçerli skill çalıştırılabilirleri listesini
  almak üzere `skills.bins` çağırabilir.

### Görev defteri RPC'leri

Operatör istemcileri, Gateway arka plan görev kayıtlarını görev defteri RPC'leri
üzerinden inceleyebilir ve iptal edebilir. Bu yöntemler ham runtime durumu değil,
sanitize edilmiş görev özetleri döndürür.

- `tasks.list`, `operator.read` gerektirir.
  - Parametreler: isteğe bağlı `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` veya `"timed_out"`) ya da bu durumların bir dizisi,
    isteğe bağlı `agentId`, isteğe bağlı `sessionKey`, `1` ile
    `500` arasında isteğe bağlı `limit` ve isteğe bağlı string `cursor`.
  - Sonuç: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get`, `operator.read` gerektirir.
  - Parametreler: `{ "taskId": string }`.
  - Sonuç: `{ "task": TaskSummary }`.
  - Eksik görev id'leri Gateway not-found hata şeklini döndürür.
- `tasks.cancel`, `operator.write` gerektirir.
  - Parametreler: `{ "taskId": string, "reason"?: string }`.
  - Sonuç:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found`, defterde eşleşen bir görev olup olmadığını bildirir. `cancelled`,
    runtime'ın iptali kabul edip etmediğini veya kaydedip kaydetmediğini bildirir.

`TaskSummary`, `id`, `status` ve `kind`, `runtime`, `title`, `agentId`,
`sessionKey`, `childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`,
`parentTaskId`, `sourceId`, timestamp'ler, ilerleme, terminal özeti ve sanitize
edilmiş hata metni gibi isteğe bağlı metadataları içerir. `agentId`, görevi
yürüten agent'ı tanımlar; `sessionKey` ve `ownerKey`, requester ve control
bağlamını korur.

### Operatör helper yöntemleri

- Operatörler, bir ajan için çalışma zamanı komut envanterini almak üzere `commands.list` (`operator.read`) çağrısı yapabilir.
  - `agentId` isteğe bağlıdır; varsayılan ajan çalışma alanını okumak için atlayın.
  - `scope`, birincil `name` hedefinin hangi yüzeye yönelik olduğunu denetler:
    - `text`, başındaki `/` olmadan birincil metin komutu belirtecini döndürür
    - `native` ve varsayılan `both` yolu, mevcut olduğunda sağlayıcıya duyarlı yerel adları döndürür
  - `textAliases`, `/model` ve `/m` gibi tam slash takma adlarını taşır.
  - `nativeName`, mevcut olduğunda sağlayıcıya duyarlı yerel komut adını taşır.
  - `provider` isteğe bağlıdır ve yalnızca yerel adlandırmayı ve yerel plugin komutu kullanılabilirliğini etkiler.
  - `includeArgs=false`, yanıttan serileştirilmiş argüman meta verilerini atlar.
- Operatörler, bir ajan için çalışma zamanı araç kataloğunu almak üzere `tools.catalog` (`operator.read`) çağrısı yapabilir. Yanıt, gruplanmış araçları ve kaynak meta verilerini içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda plugin sahibi
  - `optional`: bir plugin aracının isteğe bağlı olup olmadığı
- Operatörler, bir oturum için çalışma zamanında geçerli araç envanterini almak üzere `tools.effective` (`operator.read`) çağrısı yapabilir.
  - `sessionKey` zorunludur.
  - Gateway, çağıranın sağladığı kimlik doğrulama veya teslimat bağlamını kabul etmek yerine güvenilir çalışma zamanı bağlamını sunucu tarafındaki oturumdan türetir.
  - Yanıt; çekirdek, plugin, kanal ve zaten keşfedilmiş MCP sunucu araçlarını içeren, oturum kapsamlı ve sunucudan türetilmiş bir etkin envanter projeksiyonudur.
  - `tools.effective`, MCP için salt okunurdur: sıcak bir oturum MCP kataloğunu nihai araç politikası üzerinden yansıtabilir, ancak MCP çalışma zamanları oluşturmaz, taşımalara bağlanmaz veya `tools/list` yayınlamaz. Eşleşen sıcak katalog yoksa yanıt `mcp-not-yet-connected`, `mcp-not-yet-listed` veya `mcp-stale-catalog` gibi bir bildirim içerebilir.
  - Geçerli araç girdileri `source="core"`, `source="plugin"`, `source="channel"` veya `source="mcp"` kullanır.
- Operatörler, `/tools/invoke` ile aynı Gateway politika yolu üzerinden kullanılabilir bir aracı çağırmak için `tools.invoke` (`operator.write`) çağrısı yapabilir.
  - `name` zorunludur. `args`, `sessionKey`, `agentId`, `confirm` ve `idempotencyKey` isteğe bağlıdır.
  - Hem `sessionKey` hem de `agentId` mevcutsa çözümlenen oturum ajanı `agentId` ile eşleşmelidir.
  - `cron`, `gateway` ve `nodes` gibi yalnızca sahibin kullanabildiği çekirdek sarmalayıcılar, `tools.invoke` yönteminin kendisi `operator.write` olsa bile sahip/yönetici kimliği (`operator.admin`) gerektirir.
  - Yanıt; `ok`, `toolName`, isteğe bağlı `output` ve tiplenmiş `error` alanları içeren SDK odaklı bir zarftır. Onay veya politika retleri, Gateway araç politikası hattını atlamak yerine yük içinde `ok:false` döndürür.
- Operatörler, bir ajan için görünür beceri envanterini almak üzere `skills.status` (`operator.read`) çağrısı yapabilir.
  - `agentId` isteğe bağlıdır; varsayılan ajan çalışma alanını okumak için atlayın.
  - Yanıt; ham gizli değerleri açığa çıkarmadan uygunluğu, eksik gereksinimleri, yapılandırma kontrollerini ve temizlenmiş kurulum seçeneklerini içerir.
- Operatörler, ClawHub keşif meta verileri için `skills.search` ve `skills.detail` (`operator.read`) çağrısı yapabilir.
- Operatörler, kurmadan önce özel bir beceri arşivini hazırlamak için `skills.upload.begin`, `skills.upload.chunk` ve `skills.upload.commit` (`operator.admin`) çağrıları yapabilir. Bu, güvenilir istemciler için ayrı bir yönetici yükleme yoludur; normal ClawHub beceri kurulum akışı değildir ve `skills.install.allowUploadedArchives` etkinleştirilmedikçe varsayılan olarak devre dışıdır.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`, bu slug ve force değerine bağlı bir yükleme oluşturur.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })`, baytları tam çözümlenmiş ofsette sona ekler.
  - `skills.upload.commit({ uploadId, sha256? })`, nihai boyutu ve SHA-256 değerini doğrular. Commit yalnızca yüklemeyi sonlandırır; beceriyi kurmaz.
  - Yüklenen beceri arşivleri, kökte `SKILL.md` içeren zip arşivleridir. Arşivin dahili dizin adı kurulum hedefini asla seçmez.
- Operatörler, `skills.install` (`operator.admin`) çağrısını üç modda yapabilir:
  - ClawHub modu: `{ source: "clawhub", slug, version?, force? }`, varsayılan ajan çalışma alanındaki `skills/` dizinine bir beceri klasörü kurar.
  - Yükleme modu: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`, commit edilmiş bir yüklemeyi varsayılan ajan çalışma alanındaki `skills/<slug>` dizinine kurar. Slug ve force değeri özgün `skills.upload.begin` isteğiyle eşleşmelidir. Bu mod, `skills.install.allowUploadedArchives` etkinleştirilmedikçe reddedilir. Ayar, ClawHub kurulumlarını etkilemez.
  - Gateway kurucu modu: `{ name, installId, timeoutMs? }`, Gateway ana makinesinde tanımlanmış bir `metadata.openclaw.install` eylemini çalıştırır. Eski istemciler hâlâ `dangerouslyForceUnsafeInstall` gönderebilir; bu alan kullanımdan kaldırılmıştır, yalnızca protokol uyumluluğu için kabul edilir ve yok sayılır. Operatöre ait kurulum kararları için `security.installPolicy` kullanın.
- Operatörler, `skills.update` (`operator.admin`) çağrısını iki modda yapabilir:
  - ClawHub modu, varsayılan ajan çalışma alanında izlenen tek bir slug'ı veya izlenen tüm ClawHub kurulumlarını günceller.
  - Yapılandırma modu, `enabled`, `apiKey` ve `env` gibi `skills.entries.<skillKey>` değerlerine yama uygular.

### `models.list` görünümleri

`models.list`, isteğe bağlı bir `view` parametresini kabul eder:

- Atlanmış veya `"default"`: geçerli çalışma zamanı davranışı. `agents.defaults.models` yapılandırılmışsa yanıt, `provider/*` girdileri için dinamik olarak keşfedilen modeller dahil izin verilen katalogdur. Aksi takdirde yanıt tam Gateway kataloğudur.
- `"configured"`: seçici boyutunda davranış. `agents.defaults.models` yapılandırılmışsa, `provider/*` girdileri için sağlayıcı kapsamlı keşif dahil olmak üzere yine öncelik ondadır. İzin listesi olmadan yanıt açık `models.providers.*.models` girdilerini kullanır ve yalnızca yapılandırılmış model satırı olmadığında tam kataloğa geri döner.
- `"all"`: `agents.defaults.models` öğesini atlayarak tam Gateway kataloğu. Bunu normal model seçicileri için değil, tanılama ve keşif arayüzleri için kullanın.

## Exec onayları

- Bir exec isteği onay gerektirdiğinde Gateway `exec.approval.requested` yayınlar.
- Operatör istemcileri `exec.approval.resolve` çağrısı yaparak çözer (`operator.approvals` kapsamı gerektirir).
- `host=node` için `exec.approval.request`, `systemRunPlan` içermelidir (kanonik `argv`/`cwd`/`rawCommand`/oturum meta verileri). `systemRunPlan` eksik istekler reddedilir.
- Onaydan sonra, iletilen `node.invoke system.run` çağrıları bu kanonik `systemRunPlan` değerini yetkili komut/cwd/oturum bağlamı olarak yeniden kullanır.
- Bir çağıran, hazırlama ile nihai onaylı `system.run` iletimi arasında `command`, `rawCommand`, `cwd`, `agentId` veya `sessionKey` değerini değiştirirse Gateway, değiştirilmiş yüke güvenmek yerine çalıştırmayı reddeder.

## Ajan teslimatı geri dönüşü

- `agent` istekleri, dışa giden teslimat istemek için `deliver=true` içerebilir.
- `bestEffortDeliver=false` katı davranışı korur: çözümlenemeyen veya yalnızca dahili teslimat hedefleri `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici teslim edilebilir bir rota çözümlenemediğinde oturumla sınırlı yürütmeye geri dönüşe izin verir (örneğin dahili/webchat oturumları veya belirsiz çok kanallı yapılandırmalar).
- Nihai `agent` sonuçları, teslimat istendiğinde [`openclaw agent --json --deliver`](/tr/cli/agent#json-delivery-status) için belgelenen aynı `sent`, `suppressed`, `partial_failed` ve `failed` durumlarını kullanarak `result.deliveryStatus` içerebilir.

## Sürümleme

- `PROTOCOL_VERSION`, `packages/gateway-protocol/src/version.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu, geçerli protokolünü içermeyen aralıkları reddeder. Geçerli istemciler ve sunucular protokol v4 gerektirir.
- Şemalar + modeller TypeBox tanımlarından oluşturulur:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### İstemci sabitleri

`src/gateway/client.ts` içindeki referans istemci bu varsayılanları kullanır. Değerler protokol v4 genelinde kararlıdır ve üçüncü taraf istemciler için beklenen başlangıç çizgisidir.

| Sabit                                     | Varsayılan                                            | Kaynak                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| İstek zaman aşımı (RPC başına)            | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Ön kimlik doğrulama / bağlantı sorgusu zaman aşımı | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env eşleştirilmiş sunucu/istemci bütçesini artırabilir) |
| İlk yeniden bağlanma geri çekilmesi       | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maksimum yeniden bağlanma geri çekilmesi  | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Cihaz belirteci kapanışından sonra hızlı yeniden deneme sınırı | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` öncesi zorla durdurma ek süresi | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` varsayılan zaman aşımı    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Varsayılan tick aralığı (`hello-ok` öncesi) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Tick zaman aşımı kapanışı                 | sessizlik `tickIntervalMs * 2` değerini aştığında kod `4000` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Sunucu, etkili `policy.tickIntervalMs`, `policy.maxPayload` ve `policy.maxBufferedBytes` değerlerini `hello-ok` içinde duyurur; istemciler el sıkışma öncesi varsayılanlar yerine bu değerlere uymalıdır.

## Kimlik doğrulama

- Paylaşılan gizli anahtarlı Gateway kimlik doğrulaması, yapılandırılmış kimlik doğrulama moduna bağlı olarak `connect.params.auth.token` veya
  `connect.params.auth.password` kullanır.
- Tailscale Serve gibi kimlik taşıyan modlar
  (`gateway.auth.allowTailscale: true`) veya local loopback olmayan
  `gateway.auth.mode: "trusted-proxy"`, connect kimlik doğrulama denetimini
  `connect.params.auth.*` yerine istek başlıklarından karşılar.
- Özel giriş `gateway.auth.mode: "none"`, paylaşılan gizli anahtarlı connect kimlik doğrulamasını
  tamamen atlar; bu modu herkese açık/güvenilmeyen girişlerde açığa çıkarmayın.
- Eşleştirmeden sonra Gateway, bağlantı
  rolü + kapsamlarıyla sınırlı bir **cihaz belirteci** verir. Bu belirteç
  `hello-ok.auth.deviceToken` içinde döndürülür ve istemci tarafından gelecekteki bağlantılar için
  kalıcı olarak saklanmalıdır.
- İstemciler, başarılı herhangi bir bağlantıdan sonra birincil `hello-ok.auth.deviceToken` değerini kalıcı olarak saklamalıdır.
- Bu **saklanan** cihaz belirteciyle yeniden bağlanmak, o belirteç için saklanan
  onaylı kapsam kümesini de yeniden kullanmalıdır. Bu, zaten verilmiş olan okuma/sondalama/durum erişimini
  korur ve yeniden bağlantıların sessizce daha dar, örtük yalnızca yönetici kapsamına
  düşmesini önler.
- İstemci tarafı connect kimlik doğrulaması derlemesi (`selectConnectAuth`,
  `src/gateway/client.ts` içinde):
  - `auth.password` bağımsızdır ve ayarlandığında her zaman iletilir.
  - `auth.token` öncelik sırasına göre doldurulur: önce açık paylaşılan belirteç,
    ardından açık bir `deviceToken`, ardından saklanan cihaz başına belirteç
    (`deviceId` + `role` ile anahtarlanır).
  - `auth.bootstrapToken` yalnızca yukarıdakilerden hiçbiri bir
    `auth.token` çözümlemediğinde gönderilir. Paylaşılan belirteç veya çözülmüş herhangi bir cihaz belirteci bunu baskılar.
  - Tek seferlik `AUTH_TOKEN_MISMATCH` yeniden denemesinde saklanan cihaz belirtecinin
    otomatik yükseltilmesi **yalnızca güvenilir uç noktalarla** sınırlıdır:
    loopback veya sabitlenmiş `tlsFingerprint` ile `wss://`. Sabitleme olmadan herkese açık `wss://`
    uygun değildir.
- Yerleşik kurulum kodu bootstrap'i, güvenilir mobil devretme için birincil node
  `hello-ok.auth.deviceToken` değerini ve
  `hello-ok.auth.deviceTokens` içinde sınırlı bir operatör belirtecini döndürür. Operatör belirteci,
  yerel Talk yapılandırması okumaları için `operator.talk.secrets` içerir ve
  `operator.admin` ile `operator.pairing` kapsamlarını hariç tutar.
- Temel olmayan bir kurulum kodu bootstrap'i onay beklerken, `PAIRING_REQUIRED`
  ayrıntıları `recommendedNextStep: "wait_then_retry"`, `retryable: true`
  ve `pauseReconnect: false` içerir. İstemciler, istek onaylanana veya belirteç geçersiz hale gelene kadar aynı
  bootstrap belirteciyle yeniden bağlanmayı sürdürmelidir.
- `hello-ok.auth.deviceTokens` değerini yalnızca bağlantı, `wss://` veya loopback/yerel eşleştirme gibi
  güvenilir bir taşıma üzerinde bootstrap kimlik doğrulaması kullandığında kalıcı olarak saklayın.
- Bir istemci **açık** bir `deviceToken` veya açık `scopes` sağlarsa,
  çağıranın istediği kapsam kümesi belirleyici kalır; önbelleğe alınmış kapsamlar yalnızca
  istemci saklanan cihaz başına belirteci yeniden kullandığında yeniden kullanılır.
- Cihaz belirteçleri `device.token.rotate` ve
  `device.token.revoke` ile döndürülebilir/iptal edilebilir (`operator.pairing` kapsamı gerekir). Bir node veya
  operatör dışı başka bir rolü döndürmek ya da iptal etmek ayrıca `operator.admin` gerektirir.
- `device.token.rotate`, döndürme meta verilerini döndürür. Yedek taşıyıcı belirteci yalnızca
  zaten o cihaz belirteciyle kimliği doğrulanmış aynı cihaz çağrıları için yankılar;
  böylece yalnızca belirteç kullanan istemciler yeniden bağlanmadan önce yedeklerini kalıcı olarak saklayabilir.
  Paylaşılan/yönetici döndürmeleri taşıyıcı belirteci yankılamaz.
- Belirteç verilmesi, döndürülmesi ve iptali, o cihazın eşleştirme kaydında
  kaydedilen onaylı rol kümesiyle sınırlı kalır; belirteç mutasyonu,
  eşleştirme onayının hiç vermediği bir cihaz rolünü genişletemez veya hedefleyemez.
- Eşleştirilmiş cihaz belirteci oturumlarında, çağıranda ayrıca `operator.admin` yoksa
  cihaz yönetimi kendi kapsamıyla sınırlıdır: yönetici olmayan çağıranlar yalnızca
  **kendi** cihaz girdileri için operatör belirtecini yönetebilir. Node ve diğer operatör dışı
  belirteç yönetimi, çağıranın kendi cihazı için bile yalnızca yöneticilere açıktır.
- `device.token.rotate` ve `device.token.revoke`, hedef operatör
  belirteci kapsam kümesini çağıranın geçerli oturum kapsamlarına göre de denetler. Yönetici olmayan çağıranlar,
  zaten sahip olduklarından daha geniş bir operatör belirtecini döndüremez veya iptal edemez.
- Kimlik doğrulama hataları `error.details.code` ve kurtarma ipuçlarını içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilir istemciler, önbelleğe alınmış cihaz başına belirteçle sınırlı bir yeniden deneme yapabilir.
  - Bu yeniden deneme başarısız olursa, istemciler otomatik yeniden bağlantı döngülerini durdurmalı ve operatör eylem kılavuzunu göstermelidir.
- `AUTH_SCOPE_MISMATCH`, cihaz belirtecinin tanındığı ancak istenen rol/kapsamları
  kapsamadığı anlamına gelir. İstemciler bunu hatalı belirteç olarak sunmamalı;
  operatörden yeniden eşleştirme yapmasını veya daha dar/geniş kapsam sözleşmesini onaylamasını istemelidir.

## Cihaz kimliği + eşleştirme

- Node'lar, anahtar çifti parmak izinden türetilmiş kararlı bir cihaz kimliği (`device.id`) içermelidir.
- Gateway'ler cihaz + rol başına belirteç verir.
- Yerel otomatik onay etkin değilse yeni cihaz kimlikleri için eşleştirme onayları gerekir.
- Eşleştirme otomatik onayı doğrudan local loopback bağlantıları merkezlidir.
- OpenClaw ayrıca güvenilir paylaşılan gizli anahtarlı yardımcı akışlar için dar bir arka uç/konteyner-yerel kendi kendine bağlantı yoluna sahiptir.
- Aynı ana makinedeki tailnet veya LAN bağlantıları eşleştirme için hâlâ uzak kabul edilir ve onay gerektirir.
- WS istemcileri normalde `connect` sırasında `device` kimliği içerir (operatör +
  node). Cihazsız operatör istisnaları yalnızca açık güven yollarıdır:
  - Yalnızca localhost için güvenli olmayan HTTP uyumluluğu amacıyla `gateway.controlUi.allowInsecureAuth=true`.
  - Başarılı `gateway.auth.mode: "trusted-proxy"` operatör Control UI kimlik doğrulaması.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (acil durum, ciddi güvenlik düşürmesi).
  - Ayrılmış dahili yardımcı yolunda doğrudan-loopback `gateway-client` arka uç RPC'leri.
- Cihaz kimliğini atlamanın kapsam sonuçları vardır. Cihazsız bir operatör
  bağlantısına açık bir güven yolu üzerinden izin verildiğinde, OpenClaw yine de
  o yolun adlandırılmış bir kapsam-koruma istisnası yoksa kendi beyan ettiği kapsamları
  boş kümeye temizler. Kapsam kapılı yöntemler daha sonra `missing scope` ile başarısız olur.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`, Control UI için
  acil durum kapsam-koruma yoludur. Rastgele özel arka uç veya CLI biçimli WebSocket istemcilerine kapsam vermez.
- Ayrılmış doğrudan-loopback `gateway-client` arka uç yardımcı yolu,
  kapsamları yalnızca dahili yerel kontrol düzlemi RPC'leri için korur; özel arka uç kimlikleri
  bu istisnayı almaz.
- Tüm bağlantılar, sunucunun sağladığı `connect.challenge` nonce değerini imzalamalıdır.

### Cihaz kimlik doğrulaması geçiş tanılamaları

Hâlâ challenge öncesi imzalama davranışını kullanan eski istemciler için `connect` artık
kararlı bir `error.details.reason` ile `error.details.code` altında
`DEVICE_AUTH_*` ayrıntı kodları döndürür.

Yaygın geçiş hataları:

| İleti                       | details.code                     | details.reason           | Anlam                                              |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | İstemci `device.nonce` değerini atladı (veya boş gönderdi). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | İstemci eski/yanlış bir nonce ile imzaladı.        |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | İmza yükü v2 yüküyle eşleşmiyor.                  |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | İmzalı zaman damgası izin verilen sapmanın dışında. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`, açık anahtar parmak iziyle eşleşmiyor. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Açık anahtar biçimi/kurallılaştırması başarısız oldu. |

Geçiş hedefi:

- Her zaman `connect.challenge` için bekleyin.
- Sunucu nonce değerini içeren v2 yükünü imzalayın.
- Aynı nonce değerini `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza yükü, cihaz/istemci/rol/kapsamlar/belirteç/nonce alanlarına ek olarak
  `platform` ve `deviceFamily` değerlerini bağlayan `v3` değeridir.
- Eski `v2` imzaları uyumluluk için kabul edilmeye devam eder, ancak eşleştirilmiş cihaz
  meta verisi sabitlemesi yeniden bağlantıda komut politikasını hâlâ kontrol eder.

## TLS + sabitleme

- TLS, WS bağlantıları için desteklenir.
- İstemciler isteğe bağlı olarak Gateway sertifika parmak izini sabitleyebilir (`gateway.tls`
  yapılandırmasına ve `gateway.remote.tlsFingerprint` veya CLI `--tls-fingerprint` seçeneğine bakın).

## Kapsam

Bu protokol **tam Gateway API'sini** (durum, kanallar, modeller, sohbet,
ajan, oturumlar, node'lar, onaylar vb.) açığa çıkarır. Kesin yüzey,
`packages/gateway-protocol/src/schema.ts` içindeki TypeBox şemalarıyla tanımlanır.

## İlgili

- [Köprü protokolü](/tr/gateway/bridge-protocol)
- [Gateway runbook'u](/tr/gateway)
