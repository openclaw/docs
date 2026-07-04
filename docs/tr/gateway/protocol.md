---
read_when:
    - Gateway WS istemcilerini uygulama veya güncelleme
    - Protokol uyuşmazlıklarında veya bağlantı hatalarında hata ayıklama
    - Protokol şemasını/modellerini yeniden oluşturma
summary: 'Gateway WebSocket protokolü: el sıkışma, çerçeveler, sürümleme'
title: Gateway protokolü
x-i18n:
    generated_at: "2026-07-04T18:14:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 763dd5cba2f1aa0de95243a4996b4da1b4aa32c5c1a4b5b6c112d605e677bd70
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protokolü, OpenClaw için **tek kontrol düzlemi + node aktarımıdır**.
Tüm istemciler (CLI, web UI, macOS uygulaması, iOS/Android node'ları, başsız
node'lar) WebSocket üzerinden bağlanır ve el sıkışma sırasında **rol** + **kapsam**
bildirir.

## Aktarım

- JSON yükleri içeren metin çerçeveleriyle WebSocket.
- İlk çerçeve **mutlaka** bir `connect` isteği olmalıdır.
- Bağlantı öncesi çerçeveler 64 KiB ile sınırlıdır. Başarılı bir el sıkışmadan sonra istemciler
  `hello-ok.policy.maxPayload` ve
  `hello-ok.policy.maxBufferedBytes` sınırlarına uymalıdır. Tanılama etkinleştirildiğinde,
  aşırı büyük gelen çerçeveler ve yavaş giden arabellekler, gateway etkilenen çerçeveyi kapatmadan veya düşürmeden önce `payload.large` olayları yayar. Bu olaylar
  boyutları, sınırları, yüzeyleri ve güvenli neden kodlarını saklar. İleti
  gövdesini, ek içeriklerini, ham çerçeve gövdesini, belirteçleri, çerezleri veya gizli değerleri saklamaz.

## El Sıkışma (connect)

Gateway → İstemci (bağlantı öncesi challenge):

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

Gateway başlangıç sidecar'larını hâlâ tamamlıyorken, `connect` isteği
`details.reason` değeri `"startup-sidecars"` olarak ayarlanmış ve `retryAfterMs` içeren yeniden denenebilir bir `UNAVAILABLE` hatası döndürebilir. İstemciler bu yanıtı terminal
el sıkışma hatası olarak göstermek yerine genel bağlantı bütçeleri içinde yeniden denemelidir.

`server`, `features`, `snapshot` ve `policy` öğelerinin tümü şema tarafından zorunludur
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` da zorunludur ve anlaşılan
rol/kapsamları bildirir. `pluginSurfaceUrls` isteğe bağlıdır ve `canvas` gibi plugin
yüzey adlarını kapsamlandırılmış barındırılan URL'lerle eşler.

Kapsamlandırılmış plugin yüzey URL'lerinin süresi dolabilir. Node'lar, `pluginSurfaceUrls` içinde yeni bir
girdi almak için `{ "surface": "canvas" }` ile
`node.pluginSurface.refresh` çağırabilir. Deneysel Canvas plugin refaktörü, kullanımdan kaldırılmış `canvasHostUrl`, `canvasCapability` veya
`node.canvas.capability.refresh` uyumluluk yolunu desteklemez; mevcut yerel istemciler ve
gateway'ler plugin yüzeylerini kullanmalıdır.

Cihaz belirteci verilmediğinde, `hello-ok.auth` anlaşılan
izinleri belirteç alanları olmadan bildirir:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilen aynı işlem backend istemcileri (`client.id: "gateway-client"`,
`client.mode: "backend"`), paylaşılan gateway belirteci/parolasıyla kimlik doğruladıklarında
doğrudan local loopback bağlantılarında `device` alanını atlayabilir. Bu yol, dahili kontrol düzlemi RPC'leri için ayrılmıştır ve eski CLI/cihaz eşleştirme temel çizgilerinin
subagent oturum güncellemeleri gibi yerel backend çalışmalarını engellemesini önler. Uzak istemciler,
tarayıcı kökenli istemciler, node istemcileri ve açık cihaz belirteci/cihaz kimliği
istemcileri normal eşleştirme ve kapsam yükseltme kontrollerini kullanmaya devam eder.

Cihaz belirteci verildiğinde, `hello-ok` şunu da içerir:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Yerleşik QR/kurulum kodu bootstrap, yeni bir mobil devir yoludur. Başarılı
temel kurulum kodu connect işlemi, birincil node belirteci ve sınırlandırılmış bir
operator belirteci döndürür:

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

Operator devri kasıtlı olarak sınırlandırılmıştır; böylece QR ile onboarding,
mobil operator döngüsünü başlatabilir ve eşleştirme
mutasyon kapsamları veya `operator.admin` vermeden yerel kurulumu tamamlayabilir. Yerel istemcinin bootstrap sonrasında ihtiyaç duyduğu Talk yapılandırmasını okuyabilmesi için `operator.talk.secrets` içerir. Daha geniş
eşleştirme ve admin erişimi, ayrı bir onaylanmış operator eşleştirmesi veya belirteç
akışı gerektirir. İstemciler
`hello-ok.auth.deviceTokens` değerini yalnızca
connect, `wss://` veya loopback/yerel eşleştirme gibi güvenilir aktarımda bootstrap auth kullandığında kalıcı hale getirmelidir.

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

Yan etki oluşturan yöntemler **idempotency key'leri** gerektirir (şemaya bakın).

## Roller + kapsamlar

Tam operator kapsam modeli, onay zamanı kontrolleri ve paylaşılan gizli
anlamları için bkz. [Operator kapsamları](/tr/gateway/operator-scopes).

### Roller

- `operator` = kontrol düzlemi istemcisi (CLI/UI/otomasyon).
- `node` = yetenek barındırıcısı (kamera/ekran/canvas/system.run).

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
Gizliler dahil edildiğinde, istemciler etkin Talk sağlayıcı
kimlik bilgisini `talk.resolved.config.apiKey` alanından okumalıdır; `talk.providers.<id>.apiKey`
kaynak biçiminde kalır ve bir SecretRef nesnesi veya maskelenmiş bir dize olabilir.

Plugin tarafından kaydedilen gateway RPC yöntemleri kendi operator kapsamlarını isteyebilir, ancak
ayrılmış core admin önekleri (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) her zaman `operator.admin` değerine çözümlenir.

Yöntem kapsamı yalnızca ilk kapıdır. `chat.send` üzerinden ulaşılan bazı slash komutları
bunun üzerine daha katı komut düzeyi kontroller uygular. Örneğin, kalıcı
`/config set` ve `/config unset` yazmaları `operator.admin` gerektirir.

`node.pair.approve`, temel yöntem kapsamının üstünde ek bir onay zamanı kapsam kontrolüne de sahiptir:

- komutsuz istekler: `operator.pairing`
- exec olmayan node komutları içeren istekler: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which` içeren istekler:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node'lar connect sırasında yetenek iddialarını bildirir:

- `caps`: `camera`, `canvas`, `screen`,
  `location`, `voice` ve `talk` gibi üst düzey yetenek kategorileri.
- `commands`: invoke için komut izin listesi.
- `permissions`: ayrıntılı anahtarlar (örn. `screen.record`, `camera.capture`).

Gateway bunları **iddia** olarak ele alır ve sunucu tarafı izin listelerini uygular.

## Presence

- `system-presence`, cihaz kimliğine göre anahtarlanmış girdiler döndürür.
- Presence girdileri `deviceId`, `roles` ve `scopes` içerir; böylece UI'lar, cihaz hem **operator** hem **node** olarak bağlansa bile cihaz başına tek satır gösterebilir.
- `node.list`, isteğe bağlı `lastSeenAtMs` ve `lastSeenReason` alanlarını içerir. Bağlı node'lar,
  geçerli bağlantı zamanlarını `connect` nedeniyle `lastSeenAtMs` olarak bildirir; eşleştirilmiş node'lar, güvenilir bir node olayı eşleştirme metaverilerini güncellediğinde
  kalıcı arka plan presence'ı da bildirebilir.

### Node arka plan alive olayı

Node'lar, eşleştirilmiş bir node'un arka plan uyanması sırasında
bağlı olarak işaretlenmeden alive olduğunu kaydetmek için `event: "node.presence.alive"` ile `node.event` çağırabilir.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` kapalı bir enum'dur: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` veya `connect`. Bilinmeyen trigger dizeleri, kalıcılıktan önce
gateway tarafından `background` değerine normalleştirilir. Olay yalnızca kimliği doğrulanmış node
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

Daha eski gateway'ler, `node.event` için hâlâ `{ "ok": true }` döndürebilir; istemciler bunu
kalıcı presence saklama olarak değil, onaylanmış bir RPC olarak ele almalıdır.

## Yayın olayı kapsamlandırması

Sunucu tarafından gönderilen WebSocket yayın olayları, eşleştirme kapsamlı veya yalnızca node oturumlarının oturum içeriğini pasif olarak almaması için kapsam kapılıdır.

- **Sohbet, agent ve tool-result çerçeveleri** (stream edilen `agent` olayları ve tool çağrısı sonuçları dahil) en az `operator.read` gerektirir. `operator.read` olmayan oturumlar bu çerçeveleri tamamen atlar.
- **Plugin tanımlı `plugin.*` yayınları**, plugin'in bunları nasıl kaydettiğine bağlı olarak `operator.write` veya `operator.admin` ile sınırlandırılır.
- **Durum ve aktarım olayları** (`heartbeat`, `presence`, `tick`, connect/disconnect yaşam döngüsü vb.), aktarım sağlığı her kimliği doğrulanmış oturum tarafından gözlemlenebilir kalsın diye kısıtlanmadan kalır.
- **Bilinmeyen yayın olayı aileleri**, kayıtlı bir işleyici bunları açıkça gevşetmediği sürece varsayılan olarak kapsam kapılıdır (fail-closed).

Her istemci bağlantısı kendi istemci başına sıra numarasını tutar; böylece yayınlar, farklı istemciler olay akışının farklı kapsam filtreli alt kümelerini görse bile o sokette monoton sıralamayı korur.

## Yaygın RPC yöntem aileleri

Genel WS yüzeyi, yukarıdaki el sıkışma/auth örneklerinden daha geniştir. Bu
oluşturulmuş bir döküm değildir — `hello-ok.features.methods`, `src/gateway/server-methods-list.ts` ve yüklenen
plugin/channel yöntem dışa aktarımlarından oluşturulan muhafazakâr bir
keşif listesidir. Bunu `src/gateway/server-methods/*.ts` öğelerinin tam
sayımı olarak değil, özellik keşfi olarak ele alın.

  <AccordionGroup>
  <Accordion title="Sistem ve kimlik">
    - `health`, önbelleğe alınmış veya yeni yoklanmış Gateway sağlık anlık görüntüsünü döndürür.
    - `diagnostics.stability`, son döneme ait sınırlandırılmış tanılama kararlılığı kaydedicisini döndürür. Olay adları, sayılar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/Plugin adları ve oturum kimlikleri gibi operasyonel meta verileri tutar. Sohbet metnini, Webhook gövdelerini, araç çıktılarını, ham istek veya yanıt gövdelerini, belirteçleri, çerezleri ya da gizli değerleri tutmaz. Operatör okuma kapsamı gerekir.
    - `status`, `/status` tarzı Gateway özetini döndürür; hassas alanlar yalnızca yönetici kapsamlı operatör istemcileri için dahil edilir.
    - `gateway.identity.get`, aktarma ve eşleştirme akışları tarafından kullanılan Gateway cihaz kimliğini döndürür.
    - `system-presence`, bağlı operatör/Node cihazları için geçerli varlık anlık görüntüsünü döndürür.
    - `system-event`, bir sistem olayı ekler ve varlık bağlamını güncelleyebilir/yayınlayabilir.
    - `last-heartbeat`, kalıcı hale getirilmiş en son Heartbeat olayını döndürür.
    - `set-heartbeats`, Gateway üzerinde Heartbeat işlemeyi açıp kapatır.

  </Accordion>

  <Accordion title="Modeller ve kullanım">
    - `models.list`, çalışma zamanında izin verilen model kataloğunu döndürür. Seçici boyutunda yapılandırılmış modeller için `{ "view": "configured" }` (`agents.defaults.models` önce, ardından `models.providers.*.models`) veya tam katalog için `{ "view": "all" }` iletin.
    - `usage.status`, sağlayıcı kullanım pencerelerini/kalan kota özetlerini döndürür.
    - `usage.cost`, bir tarih aralığı için toplulaştırılmış maliyet kullanımı özetlerini döndürür.
      Bir ajan için `agentId` iletin veya yapılandırılmış ajanları toplulaştırmak için `agentScope: "all"` kullanın.
    - `doctor.memory.status`, etkin varsayılan ajan çalışma alanı için vektör belleği / önbelleğe alınmış gömme hazırlığını döndürür. Yalnızca çağıran taraf açıkça canlı gömme sağlayıcısı ping'i istediğinde `{ "probe": true }` veya `{ "deep": true }` iletin. Dreaming uyumlu istemciler, Dreaming deposu istatistiklerini seçili bir ajan çalışma alanıyla kapsamlamak için ayrıca `{ "agentId": "agent-id" }` iletebilir; `agentId` atlandığında varsayılan ajan yedeği korunur ve yapılandırılmış Dreaming çalışma alanları toplulaştırılır.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` ve `doctor.memory.dedupeDreamDiary`, seçili ajan Dreaming görünümleri/eylemleri için isteğe bağlı `{ "agentId": "agent-id" }` parametrelerini kabul eder. `agentId` atlandığında yapılandırılmış varsayılan ajan çalışma alanında çalışırlar.
    - `doctor.memory.remHarness`, uzak kontrol düzlemi istemcileri için sınırlandırılmış, salt okunur bir REM harness önizlemesi döndürür. Çalışma alanı yollarını, bellek parçacıklarını, işlenmiş temellendirilmiş Markdown'ı ve derin yükseltme adaylarını içerebilir; bu nedenle çağıranların `operator.read` iznine ihtiyacı vardır.
    - `sessions.usage`, oturum başına kullanım özetlerini döndürür. Bir ajan için `agentId` iletin
      veya yapılandırılmış ajanları birlikte listelemek için `agentScope: "all"` kullanın.
    - `sessions.usage.timeseries`, bir oturum için zaman serisi kullanımını döndürür.
    - `sessions.usage.logs`, bir oturum için kullanım günlüğü girdilerini döndürür.

  </Accordion>

  <Accordion title="Kanallar ve oturum açma yardımcıları">
    - `channels.status`, yerleşik + paketlenmiş kanal/Plugin durum özetlerini döndürür.
    - `channels.logout`, kanalın çıkış yapmayı desteklediği belirli bir kanal/hesaptan çıkış yapar.
    - `web.login.start`, geçerli QR destekli web kanalı sağlayıcısı için bir QR/web oturum açma akışı başlatır.
    - `web.login.wait`, bu QR/web oturum açma akışının tamamlanmasını bekler ve başarılı olursa kanalı başlatır.
    - `push.test`, kayıtlı bir iOS Node'una test APNs anlık bildirimi gönderir.
    - `voicewake.get`, depolanan uyandırma sözcüğü tetikleyicilerini döndürür.
    - `voicewake.set`, uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayınlar.

  </Accordion>

  <Accordion title="Mesajlaşma ve günlükler">
    - `send`, sohbet çalıştırıcısı dışında kanal/hesap/iş parçacığı hedefli gönderimler için doğrudan giden teslimat RPC'sidir.
    - `logs.tail`, yapılandırılmış Gateway dosya günlüğü kuyruğunu imleç/sınır ve maksimum bayt kontrolleriyle döndürür.

  </Accordion>

  <Accordion title="Talk ve TTS">
    - `talk.catalog`, konuşma, akışlı transkripsiyon ve gerçek zamanlı ses için salt okunur Talk sağlayıcı kataloğunu döndürür. Sağlayıcı sırlarını döndürmeden veya genel yapılandırmayı değiştirmeden kanonik sağlayıcı kimliklerini, kayıt defteri takma adlarını, etiketleri, yapılandırılmış durumu, isteğe bağlı grup düzeyi `ready` sonucunu, açığa çıkarılan model/ses kimliklerini, kanonik modları, taşıma biçimlerini, beyin stratejilerini ve gerçek zamanlı ses/yetenek bayraklarını içerir. Geçerli Gateway'ler, çalışma zamanı sağlayıcı seçimini uyguladıktan sonra `ready` değerini ayarlar; istemciler, eski Gateway'lerle uyumluluk için bunun yokluğunu doğrulanmamış olarak ele almalıdır.
    - `talk.config`, etkin Talk yapılandırma yükünü döndürür; `includeSecrets`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.
    - `talk.session.create`, `realtime/gateway-relay`, `transcription/gateway-relay` veya `stt-tts/managed-room` için Gateway'in sahibi olduğu bir Talk oturumu oluşturur. `stt-tts/managed-room` için, `sessionKey` ileten `operator.write` çağıranları kapsamlı oturum anahtarı görünürlüğü için `spawnedBy` de iletmelidir; kapsamsız `sessionKey` oluşturma ve `brain: "direct-tools"` için `operator.admin` gerekir.
    - `talk.session.join`, yönetilen oda oturum jetonunu doğrular, gerektiğinde `session.ready` veya `session.replaced` olaylarını yayınlar ve düz metin jeton veya saklanan jeton karması olmadan oda/oturum meta verilerini ve son Talk olaylarını döndürür.
    - `talk.session.appendAudio`, Gateway'in sahibi olduğu gerçek zamanlı aktarma ve transkripsiyon oturumlarına base64 PCM giriş sesini ekler.
    - `talk.session.startTurn`, `talk.session.endTurn` ve `talk.session.cancelTurn`, durum temizlenmeden önce eski dönüş reddiyle yönetilen oda dönüş yaşam döngüsünü yürütür.
    - `talk.session.cancelOutput`, özellikle Gateway aktarma oturumlarında VAD kapılı araya girme için asistan ses çıkışını durdurur.
    - `talk.session.submitToolResult`, Gateway'in sahibi olduğu gerçek zamanlı aktarma oturumu tarafından yayılan sağlayıcı araç çağrısını tamamlar. Nihai sonuç daha sonra gelecekse ara araç çıktısı için `options: { willContinue: true }`, araç sonucunun başka bir gerçek zamanlı asistan yanıtı başlatmadan sağlayıcı çağrısını karşılaması gerektiğinde ise `options: { suppressResponse: true }` iletin.
    - `talk.session.steer`, etkin çalışma ses kontrolünü Gateway'in sahibi olduğu ajan destekli Talk oturumuna gönderir. `{ sessionId, text, mode? }` kabul eder; burada `mode`, `status`, `steer`, `cancel` veya `followup` değerlerinden biridir; atlanan mod konuşulan metinden sınıflandırılır.
    - `talk.session.close`, Gateway'in sahibi olduğu aktarma, transkripsiyon veya yönetilen oda oturumunu kapatır ve son Talk olaylarını yayınlar.
    - `talk.mode`, WebChat/Control UI istemcileri için geçerli Talk modu durumunu ayarlar/yayınlar.
    - `talk.client.create`, Gateway yapılandırma, kimlik bilgileri, yönergeler ve araç politikasının sahibi olurken `webrtc` veya `provider-websocket` kullanarak istemcinin sahibi olduğu gerçek zamanlı sağlayıcı oturumu oluşturur.
    - `talk.client.toolCall`, istemcinin sahibi olduğu gerçek zamanlı taşıma biçimlerinin sağlayıcı araç çağrılarını Gateway politikasına iletmesine olanak tanır. İlk desteklenen araç `openclaw_agent_consult` aracıdır; istemciler bir çalışma kimliği alır ve sağlayıcıya özgü araç sonucunu göndermeden önce normal sohbet yaşam döngüsü olaylarını bekler.
    - `talk.client.steer`, istemcinin sahibi olduğu gerçek zamanlı taşıma biçimleri için etkin çalışma ses kontrolü gönderir. Gateway, `sessionKey` üzerinden etkin gömülü çalışmayı çözer ve yönlendirmeyi sessizce düşürmek yerine yapılandırılmış bir kabul/ret sonucu döndürür.
    - `talk.event`, gerçek zamanlı, transkripsiyon, STT/TTS, yönetilen oda, telefon ve toplantı adaptörleri için tek Talk olay kanalıdır.
    - `talk.speak`, etkin Talk konuşma sağlayıcısı üzerinden konuşma sentezler.
    - `tts.status`, TTS etkin durumunu, etkin sağlayıcıyı, yedek sağlayıcıları ve sağlayıcı yapılandırma durumunu döndürür.
    - `tts.providers`, görünür TTS sağlayıcı envanterini döndürür.
    - `tts.enable` ve `tts.disable`, TTS tercih durumunu açıp kapatır.
    - `tts.setProvider`, tercih edilen TTS sağlayıcısını günceller.
    - `tts.convert`, tek seferlik metinden konuşmaya dönüştürme işlemini çalıştırır.

  </Accordion>

  <Accordion title="Gizli bilgiler, yapılandırma, güncelleme ve sihirbaz">
    - `secrets.reload`, etkin SecretRef'leri yeniden çözer ve çalışma zamanı gizli bilgi durumunu yalnızca tam başarı durumunda değiştirir.
    - `secrets.resolve`, belirli bir komut/hedef kümesi için komut hedefli gizli bilgi atamalarını çözer.
    - `config.get`, geçerli yapılandırma anlık görüntüsünü ve karmasını döndürür.
    - `config.set`, doğrulanmış bir yapılandırma yükü yazar.
    - `config.patch`, kısmi yapılandırma güncellemesini birleştirir. Yıkıcı dizi
      değiştirme, etkilenen yolun `replacePaths` içinde bulunmasını gerektirir; dizi
      girdileri altındaki iç içe diziler `agents.list[].skills` gibi `[]` yollarını kullanır.
    - `config.apply`, tam yapılandırma yükünü doğrular ve değiştirir.
    - `config.schema`, Control UI ve CLI araçları tarafından kullanılan canlı yapılandırma şeması yükünü döndürür: şema, `uiHints`, sürüm ve üretim meta verileri; çalışma zamanı yükleyebildiğinde Plugin + kanal şeması meta verileri dahil. Şema, eşleşen alan dokümantasyonu mevcut olduğunda iç içe nesne, joker karakter, dizi öğesi ve `anyOf` / `oneOf` / `allOf` bileşim dalları dahil olmak üzere UI tarafından kullanılan aynı etiketlerden ve yardım metninden türetilen alan `title` / `description` meta verilerini içerir.
    - `config.schema.lookup`, bir yapılandırma yolu için yol kapsamlı arama yükü döndürür: normalleştirilmiş yol, sığ bir şema düğümü, eşleşen ipucu + `hintPath`, isteğe bağlı `reloadKind` ve UI/CLI ayrıntılarına inme için doğrudan alt özetler. `reloadKind`, `restart`, `hot` veya `none` değerlerinden biridir ve istenen yol için Gateway yapılandırma yeniden yükleme planlayıcısını yansıtır. Arama şeması düğümleri, kullanıcıya yönelik dokümanları ve yaygın doğrulama alanlarını (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, sayısal/dize/dizi/nesne sınırları ve `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi bayraklar) korur. Alt özetler `key`, normalleştirilmiş `path`, `type`, `required`, `hasChildren`, isteğe bağlı `reloadKind` ve eşleşen `hint` / `hintPath` değerlerini açığa çıkarır.
    - `update.run`, Gateway güncelleme akışını çalıştırır ve yalnızca güncellemenin kendisi başarılı olduğunda yeniden başlatma zamanlar; oturumu olan çağıranlar, başlangıcın yeniden başlatma devam kuyruğu üzerinden bir takip ajan dönüşünü sürdürmesi için `continuationMessage` ekleyebilir. Denetim düzleminden gelen paket yöneticisi güncellemeleri ve denetimli git checkout güncellemeleri, canlı Gateway içinde paket ağacını değiştirmek veya checkout/derleme çıktısını mutasyona uğratmak yerine ayrık bir yönetilen hizmet devri kullanır. Başlatılmış bir devir `ok: true` değerini `result.reason: "managed-service-handoff-started"` ve `handoff.status: "started"` ile döndürür; kullanılamayan veya başarısız devirler `managed-service-handoff-unavailable` veya `managed-service-handoff-failed` ile `ok: false` döndürür ve manuel kabuk güncellemesi gerektiğinde `handoff.command` ekler. Kullanılamayan bir devir, OpenClaw'ın systemd için `OPENCLAW_SYSTEMD_UNIT` gibi güvenli bir gözetmen sınırından veya kalıcı hizmet kimliğinden yoksun olduğu anlamına gelir. Başlatılmış bir devir sırasında yeniden başlatma bekçisi kısa süreliğine `stats.reason: "restart-health-pending"` raporlayabilir; CLI yeniden başlatılan Gateway'i doğrulayıp nihai `ok` bekçisini yazana kadar devam işlemi ertelenir.
    - `update.status`, mevcut olduğunda yeniden başlatma sonrası çalışan sürüm dahil en son güncelleme yeniden başlatma bekçisini yeniler ve döndürür.
    - `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`, işe alım sihirbazını WS RPC üzerinden açığa çıkarır.

  </Accordion>

  <Accordion title="Ajan ve çalışma alanı yardımcıları">
    - `agents.list`, etkin model ve çalışma zamanı meta verileri dahil olmak üzere yapılandırılmış ajan girdilerini döndürür.
    - `agents.create`, `agents.update` ve `agents.delete`, ajan kayıtlarını ve çalışma alanı bağlantılarını yönetir.
    - `agents.files.list`, `agents.files.get` ve `agents.files.set`, bir ajan için sunulan önyükleme çalışma alanı dosyalarını yönetir.
    - `tasks.list`, `tasks.get` ve `tasks.cancel`, Gateway görev defterini SDK ve operatör istemcilerine sunar.
    - `artifacts.list`, `artifacts.get` ve `artifacts.download`, açık bir `sessionKey`, `runId` veya `taskId` kapsamı için transkriptten türetilmiş yapıt özetlerini ve indirmelerini sunar. Çalıştırma ve görev sorguları, sahip oturumu sunucu tarafında çözümler ve yalnızca eşleşen kökene sahip transkript medyasını döndürür; güvenli olmayan veya yerel URL kaynakları, sunucu tarafında getirilmek yerine desteklenmeyen indirmeler döndürür.
    - `environments.list` ve `environments.status`, SDK istemcileri için salt okunur Gateway-yerel ve düğüm ortam keşfini sunar.
    - `agent.identity.get`, bir ajan veya oturum için geçerli asistan kimliğini döndürür.
    - `agent.wait`, bir çalıştırmanın bitmesini bekler ve varsa terminal anlık görüntüsünü döndürür.

  </Accordion>

  <Accordion title="Oturum denetimi">
    - `sessions.list`, bir ajan çalışma zamanı arka ucu yapılandırılmışsa satır başına `agentRuntime` meta verileri dahil olmak üzere geçerli oturum dizinini döndürür.
    - `sessions.subscribe` ve `sessions.unsubscribe`, geçerli WS istemcisi için oturum değişikliği olay aboneliklerini açıp kapatır.
    - `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`, tek bir oturum için transkript/ileti olay aboneliklerini açıp kapatır.
    - `sessions.preview`, belirli oturum anahtarları için sınırlı transkript önizlemeleri döndürür.
    - `sessions.describe`, tam oturum anahtarı için bir Gateway oturum satırı döndürür.
    - `sessions.resolve`, bir oturum hedefini çözümler veya kanonikleştirir.
    - `sessions.create`, yeni bir oturum girdisi oluşturur.
    - `sessions.send`, mevcut bir oturuma ileti gönderir.
    - `sessions.steer`, etkin bir oturum için kes ve yönlendir varyantıdır.
    - `sessions.abort`, bir oturum için etkin işi iptal eder. Çağıran, `key` ile isteğe bağlı `runId` geçebilir veya Gateway'in bir oturuma çözümleyebileceği etkin çalıştırmalar için yalnızca `runId` geçebilir.
    - `sessions.patch`, oturum meta verilerini/geçersiz kılmalarını günceller ve çözümlenen kanonik modeli artı geçerli `agentRuntime` değerini bildirir.
    - `sessions.reset`, `sessions.delete` ve `sessions.compact`, oturum bakımını gerçekleştirir.
    - `sessions.get`, tam saklanan oturum satırını döndürür.
    - Sohbet yürütmesi hâlâ `chat.history`, `chat.send`, `chat.abort` ve `chat.inject` kullanır. `chat.history`, UI istemcileri için görüntüye göre normalleştirilir: satır içi yönerge etiketleri görünür metinden çıkarılır, düz metin araç çağrısı XML yükleri (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil) ve sızmış ASCII/tam genişlikli model denetim belirteçleri çıkarılır, tam `NO_REPLY` / `no_reply` gibi yalnızca sessiz belirteç içeren asistan satırları atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir.
    - `chat.message.get`, tek bir görünür transkript girdisi için eklemeli sınırlı tam ileti okuyucusudur. İstemciler `sessionKey`, oturum seçimi ajan kapsamlı olduğunda isteğe bağlı `agentId`, ayrıca daha önce `chat.history` üzerinden sunulmuş bir transkript `messageId` geçirir; Gateway ise saklanan girdi hâlâ kullanılabilir ve aşırı büyük değilse hafif geçmiş kısaltma sınırı olmadan aynı görüntüye göre normalleştirilmiş projeksiyonu döndürür.
    - `chat.send`, otomatik kesme zamanından önce başlatılan model çağrılarında hızlı modu kullanmak, ardından sonraki yeniden deneme, geri dönüş, araç sonucu veya devam çağrılarını hızlı mod olmadan başlatmak için tek turluk `fastMode: "auto"` kabul eder. Kesme varsayılanı 60 saniyedir ve model başına `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` ile yapılandırılabilir. Bir `chat.send` çağırıcısı, o istek için kesmeyi geçersiz kılmak üzere tek turluk `fastAutoOnSeconds` geçebilir.

  </Accordion>

  <Accordion title="Cihaz eşleştirme ve cihaz belirteçleri">
    - `device.pair.list`, bekleyen ve onaylanmış eşleştirilmiş cihazları döndürür.
    - `device.pair.setupCode`, bir mobil kurulum kodu ve varsayılan olarak bir PNG QR veri URL'si oluşturur. `operator.admin` gerektirir ve bilerek duyurulan keşiften çıkarılmıştır. Sonuç `setupCode`, isteğe bağlı `qrDataUrl`, `gatewayUrl`, gizli olmayan `auth` etiketi ve `urlSource` içerir.
    - `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`, cihaz eşleştirme kayıtlarını yönetir.
    - `device.token.rotate`, eşleştirilmiş bir cihaz belirtecini onaylanmış rolü ve çağıran kapsamı sınırları içinde döndürür.
    - `device.token.revoke`, eşleştirilmiş bir cihaz belirtecini onaylanmış rolü ve çağıran kapsamı sınırları içinde iptal eder.

    Kurulum kodu, kısa ömürlü bir önyükleme kimlik bilgisini gömer. İstemciler bunu
    eşleştirme akışının ötesinde günlüğe yazmamalı veya kalıcı olarak saklamamalıdır.

  </Accordion>

  <Accordion title="Düğüm eşleştirme, çağırma ve bekleyen iş">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` ve `node.pair.verify`, düğüm eşleştirmeyi ve önyükleme doğrulamasını kapsar.
    - `node.list` ve `node.describe`, bilinen/bağlı düğüm durumunu döndürür.
    - `node.rename`, eşleştirilmiş bir düğüm etiketini günceller.
    - `node.invoke`, bağlı bir düğüme komut iletir.
    - `node.invoke.result`, bir çağırma isteğinin sonucunu döndürür.
    - `node.event`, düğüm kaynaklı olayları gateway'e geri taşır.
    - `node.pending.pull` ve `node.pending.ack`, bağlı düğüm kuyruğu API'leridir.
    - `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısı kesilmiş düğümler için dayanıklı bekleyen işi yönetir.

  </Accordion>

  <Accordion title="Onay aileleri">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve `exec.approval.resolve`, tek seferlik exec onay isteklerini ve bekleyen onay aramayı/yeniden oynatmayı kapsar.
    - `exec.approval.waitDecision`, bekleyen bir exec onayını bekler ve son kararı döndürür (veya zaman aşımında `null`).
    - `exec.approvals.get` ve `exec.approvals.set`, gateway exec onay ilkesi anlık görüntülerini yönetir.
    - `exec.approvals.node.get` ve `exec.approvals.node.set`, düğüm aktarma komutları üzerinden düğüm-yerel exec onay ilkesini yönetir.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` ve `plugin.approval.resolve`, plugin-tanımlı onay akışlarını kapsar.

  </Accordion>

  <Accordion title="Otomasyon, Skills ve araçlar">
    - Otomasyon: `wake`, anında veya bir sonraki Heartbeat'te uyandırma metni enjeksiyonu zamanlar; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zamanlanmış işi yönetir.
    - `cron.run`, manuel çalıştırmalar için kuyruğa alma tarzı bir RPC olarak kalır. Tamamlanma semantiğine ihtiyaç duyan istemciler, döndürülen `runId` değerini okumalı ve `cron.runs` yoklamalıdır.
    - `cron.runs`, istemcilerin aynı iş için diğer geçmiş girdileriyle yarışmadan kuyruktaki tek bir manuel çalıştırmayı takip edebilmesi için isteğe bağlı boş olmayan bir `runId` filtresi kabul eder.
    - Skills ve araçlar: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Yaygın olay aileleri

- `chat`: `chat.inject` ve diğer yalnızca transkript sohbet olayları gibi UI sohbet güncellemeleri. Protokol v4'te delta yükleri `deltaText` taşır; `message` kümülatif asistan anlık görüntüsü olarak kalır. Önek olmayan değiştirmeler `replace=true` ayarlar ve `deltaText` değerini değiştirme metni olarak kullanır.
- `session.message`, `session.operation` ve `session.tool`: abone olunan bir oturum için transkript, uçuş hâlindeki oturum işlemi ve olay akışı güncellemeleri.
- `sessions.changed`: oturum dizini veya meta veriler değişti.
- `presence`: sistem presence anlık görüntüsü güncellemeleri.
- `tick`: periyodik keepalive / canlılık olayı.
- `health`: gateway sağlık anlık görüntüsü güncellemesi.
- `heartbeat`: heartbeat olay akışı güncellemesi.
- `cron`: cron çalıştırma/iş değişikliği olayı.
- `shutdown`: gateway kapatma bildirimi.
- `node.pair.requested` / `node.pair.resolved`: düğüm eşleştirme yaşam döngüsü.
- `node.invoke.request`: düğüm çağırma isteği yayını.
- `device.pair.requested` / `device.pair.resolved`: eşleştirilmiş cihaz yaşam döngüsü.
- `voicewake.changed`: uyandırma sözcüğü tetikleyici yapılandırması değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onay yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin onay yaşam döngüsü.

### Düğüm yardımcı yöntemleri

- Düğümler, otomatik izin kontrolleri için beceri çalıştırılabilirlerinin geçerli listesini almak üzere `skills.bins` çağırabilir.

### Görev defteri RPC'leri

Operatör istemcileri, Gateway arka plan görev kayıtlarını görev defteri RPC'leri aracılığıyla inceleyebilir ve iptal edebilir. Bu yöntemler ham çalışma zamanı durumu değil, temizlenmiş görev özetleri döndürür.

- `tasks.list`, `operator.read` gerektirir.
  - Parametreler: isteğe bağlı `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` veya `"timed_out"`) ya da bu durumların bir dizisi,
    isteğe bağlı `agentId`, isteğe bağlı `sessionKey`, `1` ile
    `500` arasında isteğe bağlı `limit` ve isteğe bağlı dize `cursor`.
  - Sonuç: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get`, `operator.read` gerektirir.
  - Parametreler: `{ "taskId": string }`.
  - Sonuç: `{ "task": TaskSummary }`.
  - Eksik görev kimlikleri Gateway bulunamadı hata şeklini döndürür.
- `tasks.cancel`, `operator.write` gerektirir.
  - Parametreler: `{ "taskId": string, "reason"?: string }`.
  - Sonuç:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found`, defterde eşleşen bir görev olup olmadığını bildirir. `cancelled`,
    çalışma zamanının iptali kabul edip etmediğini veya kaydedip kaydetmediğini bildirir.

`TaskSummary`, `id`, `status` ve `kind`, `runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, zaman damgaları, ilerleme, terminal özeti ve temizlenmiş hata metni gibi isteğe bağlı meta verileri içerir. `agentId`, görevi yürüten ajanı tanımlar; `sessionKey` ve `ownerKey`, istekte bulunanı ve denetim bağlamını korur.

### Operatör yardımcı yöntemleri

- Operatörler bir aracı için çalışma zamanı komut envanterini almak üzere `commands.list` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan aracı çalışma alanını okumak için atlayın.
  - `scope`, birincil `name` alanının hangi yüzeyi hedeflediğini kontrol eder:
    - `text`, baştaki `/` olmadan birincil metin komutu belirtecini döndürür
    - `native` ve varsayılan `both` yolu, mevcut olduğunda sağlayıcıya duyarlı yerel adları döndürür
  - `textAliases`, `/model` ve `/m` gibi tam eğik çizgi takma adlarını taşır.
  - `nativeName`, varsa sağlayıcıya duyarlı yerel komut adını taşır.
  - `provider` isteğe bağlıdır ve yalnızca yerel adlandırmayı ve yerel plugin komutu kullanılabilirliğini etkiler.
  - `includeArgs=false`, serileştirilmiş argüman meta verilerini yanıttan çıkarır.
- Operatörler bir aracı için çalışma zamanı araç kataloğunu almak üzere `tools.catalog` (`operator.read`) çağırabilir. Yanıt, gruplanmış araçları ve köken meta verilerini içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda plugin sahibi
  - `optional`: bir plugin aracının isteğe bağlı olup olmadığı
- Operatörler bir oturum için çalışma zamanında etkili araç envanterini almak üzere `tools.effective` (`operator.read`) çağırabilir.
  - `sessionKey` zorunludur.
  - Gateway, çağıranın sağladığı kimlik doğrulama veya teslimat bağlamını kabul etmek yerine güvenilir çalışma zamanı bağlamını oturumdan sunucu tarafında türetir.
  - Yanıt, çekirdek, plugin, kanal ve daha önce keşfedilmiş MCP sunucusu araçlarını içeren, etkin envanterin oturum kapsamlı ve sunucu tarafından türetilmiş bir projeksiyonudur.
  - `tools.effective`, MCP için salt okunurdur: sıcak bir oturum MCP kataloğunu nihai araç politikası üzerinden projekte edebilir, ancak MCP çalışma zamanları oluşturmaz, aktarımları bağlamaz veya `tools/list` yayınlamaz. Eşleşen sıcak katalog yoksa yanıt `mcp-not-yet-connected`, `mcp-not-yet-listed` veya `mcp-stale-catalog` gibi bir bildirim içerebilir.
  - Etkili araç girdileri `source="core"`, `source="plugin"`, `source="channel"` veya `source="mcp"` kullanır.
- Operatörler, `/tools/invoke` ile aynı Gateway politikası yolu üzerinden kullanılabilir bir aracı çağırmak için `tools.invoke` (`operator.write`) çağırabilir.
  - `name` zorunludur. `args`, `sessionKey`, `agentId`, `confirm` ve `idempotencyKey` isteğe bağlıdır.
  - Hem `sessionKey` hem de `agentId` mevcutsa çözümlenen oturum aracısı `agentId` ile eşleşmelidir.
  - `cron`, `gateway` ve `nodes` gibi yalnızca sahip çekirdek sarmalayıcıları, `tools.invoke` yönteminin kendisi `operator.write` olsa bile sahip/yönetici kimliği (`operator.admin`) gerektirir.
  - Yanıt, `ok`, `toolName`, isteğe bağlı `output` ve tipli `error` alanları içeren SDK'ya dönük bir zarftır. Onay veya politika retleri, Gateway araç politikası işlem hattını atlamak yerine yük içinde `ok:false` döndürür.
- Operatörler bir aracı için görünür skill envanterini almak üzere `skills.status` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan aracı çalışma alanını okumak için atlayın.
  - Yanıt, ham gizli değerleri açığa çıkarmadan uygunluk, eksik gereksinimler, yapılandırma denetimleri ve temizlenmiş kurulum seçeneklerini içerir.
- Operatörler ClawHub keşif meta verileri için `skills.search` ve `skills.detail` (`operator.read`) çağırabilir.
- Operatörler, yüklemeden önce özel bir skill arşivini hazırlamak için `skills.upload.begin`, `skills.upload.chunk` ve `skills.upload.commit` (`operator.admin`) çağırabilir. Bu, güvenilir istemciler için ayrı bir yönetici yükleme yoludur; normal ClawHub skill kurulum akışı değildir ve `skills.install.allowUploadedArchives` etkinleştirilmediği sürece varsayılan olarak devre dışıdır.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`, bu slug ve force değerine bağlı bir yükleme oluşturur.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })`, baytları tam çözümlenmiş ofsette ekler.
  - `skills.upload.commit({ uploadId, sha256? })`, nihai boyutu ve SHA-256 değerini doğrular. Commit yalnızca yüklemeyi sonlandırır; skill'i kurmaz.
  - Yüklenen skill arşivleri, bir `SKILL.md` kökü içeren zip arşivleridir. Arşivin iç dizin adı kurulum hedefini asla seçmez.
- Operatörler `skills.install` (`operator.admin`) öğesini üç modda çağırabilir:
  - ClawHub modu: `{ source: "clawhub", slug, version?, force? }`, varsayılan aracı çalışma alanındaki `skills/` dizinine bir skill klasörü kurar.
  - Yükleme modu: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`, commit edilmiş bir yüklemeyi varsayılan aracı çalışma alanındaki `skills/<slug>` dizinine kurar. Slug ve force değeri özgün `skills.upload.begin` isteğiyle eşleşmelidir. Bu mod, `skills.install.allowUploadedArchives` etkinleştirilmedikçe reddedilir. Ayar, ClawHub kurulumlarını etkilemez.
  - Gateway kurucu modu: `{ name, installId, timeoutMs? }`, Gateway ana makinesinde bildirilen bir `metadata.openclaw.install` eylemini çalıştırır. Eski istemciler hâlâ `dangerouslyForceUnsafeInstall` gönderebilir; bu alan kullanımdan kaldırılmıştır, yalnızca protokol uyumluluğu için kabul edilir ve yok sayılır. Operatörün sahip olduğu kurulum kararları için `security.installPolicy` kullanın.
- Operatörler `skills.update` (`operator.admin`) öğesini iki modda çağırabilir:
  - ClawHub modu, varsayılan aracı çalışma alanındaki izlenen tek bir slug'ı veya izlenen tüm ClawHub kurulumlarını günceller.
  - Yapılandırma modu, `enabled`, `apiKey` ve `env` gibi `skills.entries.<skillKey>` değerlerine yama uygular.

### `models.list` görünümleri

`models.list`, isteğe bağlı bir `view` parametresi kabul eder:

- Atlanmış veya `"default"`: geçerli çalışma zamanı davranışı. `agents.defaults.models` yapılandırılmışsa yanıt, `provider/*` girdileri için dinamik olarak keşfedilmiş modeller dahil olmak üzere izin verilen katalogdur. Aksi halde yanıt, tam Gateway kataloğudur.
- `"configured"`: seçici boyutunda davranış. `agents.defaults.models` yapılandırılmışsa, `provider/*` girdileri için sağlayıcı kapsamlı keşif dahil olmak üzere yine önceliklidir. İzin listesi olmadan yanıt, açık `models.providers.*.models` girdilerini kullanır ve yalnızca yapılandırılmış model satırı yoksa tam kataloğa geri döner.
- `"all"`: `agents.defaults.models` öğesini atlayarak tam Gateway kataloğu. Bunu normal model seçiciler için değil, tanılama ve keşif kullanıcı arayüzleri için kullanın.

## Exec onayları

- Bir exec isteği onay gerektirdiğinde Gateway `exec.approval.requested` yayınlar.
- Operatör istemcileri `exec.approval.resolve` çağırarak çözer (`operator.approvals` kapsamı gerektirir).
- `host=node` için `exec.approval.request`, `systemRunPlan` içermelidir (kanonik `argv`/`cwd`/`rawCommand`/oturum meta verileri). `systemRunPlan` eksik olan istekler reddedilir.
- Onaydan sonra iletilen `node.invoke system.run` çağrıları, bu kanonik `systemRunPlan` öğesini yetkili komut/cwd/oturum bağlamı olarak yeniden kullanır.
- Bir çağıran, hazırlama ile nihai onaylı `system.run` iletimi arasında `command`, `rawCommand`, `cwd`, `agentId` veya `sessionKey` değerini değiştirirse Gateway, değiştirilen yüke güvenmek yerine çalıştırmayı reddeder.

## Aracı teslimat geri dönüşü

- `agent` istekleri, dışa teslimat istemek için `deliver=true` içerebilir.
- `bestEffortDeliver=false` katı davranışı korur: çözümlenemeyen veya yalnızca dahili teslimat hedefleri `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici olarak teslim edilebilir hiçbir rota çözümlenemediğinde oturumla sınırlı yürütmeye geri dönüşe izin verir (örneğin dahili/webchat oturumları veya belirsiz çok kanallı yapılandırmalar).
- Nihai `agent` sonuçları, teslimat istendiğinde `result.deliveryStatus` içerebilir; [`openclaw agent --json --deliver`](/tr/cli/agent#json-delivery-status) için belgelenen aynı `sent`, `suppressed`, `partial_failed` ve `failed` durumlarını kullanır.

## Sürümleme

- `PROTOCOL_VERSION`, `packages/gateway-protocol/src/version.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu, kendi geçerli protokolünü içermeyen aralıkları reddeder. Geçerli istemciler ve sunucular protokol v4 gerektirir.
- Şemalar + modeller TypeBox tanımlarından oluşturulur:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### İstemci sabitleri

`src/gateway/client.ts` içindeki referans istemci bu varsayılanları kullanır. Değerler protokol v4 genelinde kararlıdır ve üçüncü taraf istemciler için beklenen taban çizgisidir.

| Sabit                                     | Varsayılan                                           | Kaynak                                                                                     |
| ----------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                  | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                  | `packages/gateway-protocol/src/version.ts`                                                 |
| İstek zaman aşımı (RPC başına)            | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Ön kimlik doğrulama / bağlantı-sorgulama zaman aşımı | `15_000` ms                               | `src/gateway/handshake-timeouts.ts` (config/env eşleştirilmiş sunucu/istemci bütçesini artırabilir) |
| İlk yeniden bağlanma geri çekilmesi       | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maksimum yeniden bağlanma geri çekilmesi  | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Cihaz belirteci kapanışından sonra hızlı yeniden deneme sınırı | `250` ms                              | `src/gateway/client.ts`                                                                    |
| `terminate()` öncesi zorla durdurma ek süresi | `250` ms                                         | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` varsayılan zaman aşımı    | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Varsayılan tik aralığı (`hello-ok` öncesi) | `30_000` ms                                        | `src/gateway/client.ts`                                                                    |
| Tik zaman aşımı kapanışı                  | sessizlik `tickIntervalMs * 2` değerini aştığında kod `4000` | `src/gateway/client.ts`                                                            |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                                                          |

Sunucu, etkin `policy.tickIntervalMs`, `policy.maxPayload` ve `policy.maxBufferedBytes` değerlerini `hello-ok` içinde duyurur; istemciler el sıkışma öncesi varsayılanlar yerine bu değerlere uymalıdır.

## Kimlik Doğrulama

- Paylaşılan gizli anahtarlı gateway kimlik doğrulaması, yapılandırılmış kimlik doğrulama moduna bağlı olarak `connect.params.auth.token` veya
  `connect.params.auth.password` kullanır.
- Tailscale Serve gibi kimlik taşıyan modlar
  (`gateway.auth.allowTailscale: true`) veya loopback olmayan
  `gateway.auth.mode: "trusted-proxy"`, bağlanma kimlik doğrulaması denetimini
  `connect.params.auth.*` yerine istek başlıklarından karşılar.
- Özel giriş `gateway.auth.mode: "none"`, paylaşılan gizli anahtarlı bağlanma kimlik doğrulamasını
  tamamen atlar; bu modu herkese açık/güvenilmeyen girişlerde açığa çıkarmayın.
- Eşleştirmeden sonra Gateway, bağlantı rolü + kapsamlarıyla sınırlı bir **cihaz belirteci**
  yayınlar. Bu belirteç `hello-ok.auth.deviceToken` içinde döndürülür ve istemci tarafından
  gelecekteki bağlantılar için kalıcı olarak saklanmalıdır.
- İstemciler, başarılı herhangi bir bağlantıdan sonra birincil `hello-ok.auth.deviceToken` değerini kalıcı olarak saklamalıdır.
- Bu **saklanmış** cihaz belirteciyle yeniden bağlanmak, o belirteç için saklanmış
  onaylı kapsam kümesini de yeniden kullanmalıdır. Bu, daha önce verilmiş olan
  okuma/sondalama/durum erişimini korur ve yeniden bağlantıların sessizce daha dar
  örtük yalnızca yönetici kapsamına düşmesini önler.
- İstemci tarafı bağlanma kimlik doğrulaması derlemesi (`src/gateway/client.ts` içindeki
  `selectConnectAuth`):
  - `auth.password` bağımsızdır ve ayarlandığında her zaman iletilir.
  - `auth.token` öncelik sırasıyla doldurulur: önce açık paylaşılan belirteç,
    sonra açık bir `deviceToken`, ardından saklanmış cihaz başına belirteç (`deviceId` + `role` ile anahtarlanır).
  - `auth.bootstrapToken`, yalnızca yukarıdakilerin hiçbiri bir
    `auth.token` çözemediğinde gönderilir. Paylaşılan belirteç veya çözümlenen herhangi bir cihaz belirteci onu bastırır.
  - Tek seferlik `AUTH_TOKEN_MISMATCH` yeniden denemesinde saklanmış bir cihaz belirtecinin
    otomatik yükseltilmesi **yalnızca güvenilir uç noktalarla** sınırlıdır —
    loopback veya sabitlenmiş `tlsFingerprint` ile `wss://`. Sabitleme olmadan herkese açık `wss://`
    uygun değildir.
- Yerleşik kurulum kodu bootstrap işlemi, birincil düğüm
  `hello-ok.auth.deviceToken` değerini ve güvenilir mobil devretme için
  `hello-ok.auth.deviceTokens` içinde sınırlı bir operatör belirtecini döndürür. Operatör belirteci,
  yerel Talk yapılandırması okumaları için `operator.talk.secrets` içerir, ancak
  eşleştirme mutasyonu kapsamlarını ve `operator.admin` kapsamını hariç tutar.
- Temel olmayan bir kurulum kodu bootstrap işlemi onay beklerken, `PAIRING_REQUIRED`
  ayrıntıları `recommendedNextStep: "wait_then_retry"`, `retryable: true`
  ve `pauseReconnect: false` içerir. İstemciler, istek onaylanana veya belirteç geçersiz hale gelene kadar
  aynı bootstrap belirteciyle yeniden bağlanmayı sürdürmelidir.
- `hello-ok.auth.deviceTokens` değerini yalnızca bağlantı `wss://` veya loopback/yerel eşleştirme gibi
  güvenilir bir aktarımda bootstrap kimlik doğrulaması kullandığında kalıcı olarak saklayın.
- Bir istemci **açık** bir `deviceToken` veya açık `scopes` sağlarsa, çağıranın istediği
  bu kapsam kümesi yetkili kalır; önbelleğe alınmış kapsamlar yalnızca istemci saklanmış
  cihaz başına belirteci yeniden kullandığında yeniden kullanılır.
- Cihaz belirteçleri `device.token.rotate` ve
  `device.token.revoke` ile döndürülebilir/iptal edilebilir (`operator.pairing` kapsamı gerekir). Bir düğüm veya başka bir operatör dışı rolü döndürmek ya da
  iptal etmek ayrıca `operator.admin` gerektirir.
- `device.token.rotate`, döndürme meta verilerini döndürür. Yerine geçen taşıyıcı belirteci yalnızca
  halihazırda o cihaz belirteciyle kimlik doğrulaması yapılmış aynı cihaz çağrıları için yansıtır;
  böylece yalnızca belirteç kullanan istemciler yeniden bağlanmadan önce yenisini kalıcı olarak saklayabilir.
  Paylaşılan/yönetici döndürmeleri taşıyıcı belirteci yansıtmaz.
- Belirteç yayınlama, döndürme ve iptal işlemleri, ilgili cihazın eşleştirme girdisine kaydedilmiş
  onaylı rol kümesiyle sınırlı kalır; belirteç mutasyonu, eşleştirme onayının hiç vermediği
  bir cihaz rolünü genişletemez veya hedefleyemez.
- Eşleştirilmiş cihaz belirteci oturumlarında, çağıranın ayrıca `operator.admin` kapsamı yoksa
  cihaz yönetimi kendi kapsamıyla sınırlıdır: yönetici olmayan çağıranlar yalnızca **kendi**
  cihaz girdileri için operatör belirtecini yönetebilir. Düğüm ve diğer operatör dışı
  belirteç yönetimi, çağıranın kendi cihazı için bile yalnızca yöneticilere açıktır.
- `device.token.rotate` ve `device.token.revoke`, hedef operatör
  belirteci kapsam kümesini çağıranın mevcut oturum kapsamlarına karşı da denetler. Yönetici olmayan çağıranlar,
  zaten sahip olduklarından daha geniş bir operatör belirtecini döndüremez veya iptal edemez.
- Kimlik doğrulama hataları `error.details.code` ve kurtarma ipuçları içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilir istemciler, önbelleğe alınmış cihaz başına belirteçle bir sınırlı yeniden deneme yapabilir.
  - Bu yeniden deneme başarısız olursa, istemciler otomatik yeniden bağlanma döngülerini durdurmalı ve operatör eylemi rehberliğini göstermelidir.
- `AUTH_SCOPE_MISMATCH`, cihaz belirtecinin tanındığı ancak istenen rol/kapsamları kapsamadığı anlamına gelir.
  İstemciler bunu hatalı belirteç olarak sunmamalıdır;
  operatörden yeniden eşleştirme yapmasını veya daha dar/daha geniş kapsam sözleşmesini onaylamasını istemelidir.

## Cihaz kimliği + eşleştirme

- Düğümler, anahtar çifti parmak izinden türetilmiş kararlı bir cihaz kimliği (`device.id`) içermelidir.
- Gateway'ler cihaz + rol başına belirteç yayınlar.
- Yerel otomatik onay etkinleştirilmemişse yeni cihaz kimlikleri için eşleştirme onayları gerekir.
- Eşleştirme otomatik onayı, doğrudan local loopback bağlantılarına odaklanır.
- OpenClaw ayrıca güvenilir paylaşılan gizli anahtar yardımcı akışları için dar bir backend/konteyner yerel kendi kendine bağlanma yoluna sahiptir.
- Aynı ana bilgisayar tailnet veya LAN bağlantıları eşleştirme için hâlâ uzak olarak değerlendirilir ve
  onay gerektirir.
- WS istemcileri normalde `connect` sırasında `device` kimliği içerir (operatör +
  düğüm). Cihazsız operatör için tek istisnalar açık güven yollarıdır:
  - Yalnızca localhost güvenli olmayan HTTP uyumluluğu için `gateway.controlUi.allowInsecureAuth=true`.
  - Başarılı `gateway.auth.mode: "trusted-proxy"` operatör Control UI kimlik doğrulaması.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (acil durum, ciddi güvenlik düşüşü).
  - Ayrılmış dahili yardımcı yoldaki direct-loopback `gateway-client` backend RPC'leri.
- Cihaz kimliğini atlamanın kapsam sonuçları vardır. Cihazsız bir operatör
  bağlantısına açık bir güven yolu üzerinden izin verildiğinde bile OpenClaw, bu yolun adlandırılmış
  bir kapsam koruma istisnası yoksa kendi beyan ettiği kapsamları boş kümeye temizler.
  Kapsam kapılı yöntemler daha sonra `missing scope` ile başarısız olur.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`, Control UI
  acil durum kapsam koruma yoludur. Rastgele özel backend veya CLI biçimli WebSocket istemcilerine
  kapsam vermez.
- Ayrılmış direct-loopback `gateway-client` backend yardımcı yolu, kapsamları yalnızca dahili yerel
  kontrol düzlemi RPC'leri için korur; özel backend kimlikleri bu istisnayı almaz.
- Tüm bağlantılar, sunucunun sağladığı `connect.challenge` nonce değerini imzalamalıdır.

### Cihaz kimlik doğrulaması geçiş tanıları

Hâlâ challenge öncesi imzalama davranışı kullanan eski istemciler için, `connect` artık
kararlı bir `error.details.reason` ile `error.details.code` altında `DEVICE_AUTH_*` ayrıntı kodları döndürür.

Yaygın geçiş hataları:

| İleti                       | details.code                     | details.reason           | Anlam                                              |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | İstemci `device.nonce` atladı (veya boş gönderdi). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | İstemci eski/yanlış bir nonce ile imzaladı.        |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | İmza yükü v2 yüküyle eşleşmiyor.                   |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | İmzalanmış zaman damgası izin verilen sapmanın dışında. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`, açık anahtar parmak iziyle eşleşmiyor. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Açık anahtar biçimi/kanonikleştirmesi başarısız oldu. |

Geçiş hedefi:

- Her zaman `connect.challenge` için bekleyin.
- Sunucu nonce değerini içeren v2 yükünü imzalayın.
- Aynı nonce değerini `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza yükü `v3` değeridir; bu, cihaz/istemci/rol/kapsamlar/belirteç/nonce alanlarına ek olarak `platform` ve `deviceFamily`
  değerlerini de bağlar.
- Eski `v2` imzaları uyumluluk için kabul edilmeye devam eder, ancak eşleştirilmiş cihaz
  meta verisi sabitlemesi yeniden bağlantıda komut politikasını hâlâ kontrol eder.

## TLS + sabitleme

- TLS, WS bağlantıları için desteklenir.
- İstemciler isteğe bağlı olarak gateway sertifika parmak izini sabitleyebilir (`gateway.tls`
  yapılandırmasına ve `gateway.remote.tlsFingerprint` veya CLI `--tls-fingerprint` değerine bakın).

## Kapsam

Bu protokol **tam gateway API'sini** açığa çıkarır (durum, kanallar, modeller, sohbet,
ajan, oturumlar, düğümler, onaylar vb.). Tam yüzey
`packages/gateway-protocol/src/schema.ts` içindeki TypeBox şemaları tarafından tanımlanır.

## İlgili

- [Köprü protokolü](/tr/gateway/bridge-protocol)
- [Gateway çalışma kitabı](/tr/gateway)
