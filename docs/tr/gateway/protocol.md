---
read_when:
    - Gateway WebSocket istemcilerini uygulama veya güncelleme
    - Debugging protokol uyuşmazlıkları veya bağlantı hataları
    - Protokol şemasını/modellerini yeniden oluşturma
summary: 'Gateway WebSocket protokolü: el sıkışma, çerçeveler, sürümleme'
title: Gateway protokolü
x-i18n:
    generated_at: "2026-07-03T17:40:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 815ac729824587579d112d665df2060d84d2894b4d46235e210804ca8a07082d
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protokolü, OpenClaw için **tek kontrol düzlemi + node aktarımıdır**. Tüm istemciler (CLI, web kullanıcı arayüzü, macOS uygulaması, iOS/Android node'ları, başsız node'lar) WebSocket üzerinden bağlanır ve el sıkışma sırasında **rollerini** + **kapsamlarını** bildirir.

## Aktarım

- WebSocket, JSON yükleri içeren metin çerçeveleri.
- İlk çerçeve **mutlaka** bir `connect` isteği olmalıdır.
- Bağlantı öncesi çerçeveler 64 KiB ile sınırlıdır. Başarılı bir el sıkışmadan sonra istemciler `hello-ok.policy.maxPayload` ve `hello-ok.policy.maxBufferedBytes` sınırlarına uymalıdır. Tanılama etkinleştirildiğinde, fazla büyük gelen çerçeveler ve yavaş giden arabellekler, Gateway etkilenen çerçeveyi kapatmadan veya düşürmeden önce `payload.large` olayları yayar. Bu olaylar boyutları, sınırları, yüzeyleri ve güvenli neden kodlarını tutar. Mesaj gövdesini, ek içeriklerini, ham çerçeve gövdesini, token'ları, çerezleri veya gizli değerleri tutmazlar.

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

Gateway başlangıç yan bileşenlerini hâlâ tamamlıyorken, `connect` isteği `details.reason` değeri `"startup-sidecars"` olarak ayarlanmış ve `retryAfterMs` içeren yeniden denenebilir bir `UNAVAILABLE` hatası döndürebilir. İstemciler, bunu terminal bir el sıkışma hatası olarak göstermek yerine genel bağlantı bütçeleri içinde bu yanıtı yeniden denemelidir.

`server`, `features`, `snapshot` ve `policy` şema tarafından zorunludur (`packages/gateway-protocol/src/schema/frames.ts`). `auth` da zorunludur ve üzerinde anlaşılan rolü/kapsamları bildirir. `pluginSurfaceUrls` isteğe bağlıdır ve `canvas` gibi Plugin yüzey adlarını kapsamlandırılmış barındırılan URL'lere eşler.

Kapsamlandırılmış Plugin yüzey URL'lerinin süresi dolabilir. Node'lar, `pluginSurfaceUrls` içinde yeni bir giriş almak için `{ "surface": "canvas" }` ile `node.pluginSurface.refresh` çağırabilir. Deneysel Canvas Plugin yeniden düzenlemesi, kullanımdan kaldırılmış `canvasHostUrl`, `canvasCapability` veya `node.canvas.capability.refresh` uyumluluk yolunu desteklemez; mevcut yerel istemciler ve Gateway'ler Plugin yüzeylerini kullanmalıdır.

Cihaz token'ı verilmediğinde, `hello-ok.auth` üzerinde anlaşılan izinleri token alanları olmadan bildirir:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilir aynı süreç arka uç istemcileri (`client.id: "gateway-client"`, `client.mode: "backend"`), paylaşılan Gateway token'ı/parolasıyla kimlik doğruladıklarında doğrudan local loopback bağlantılarında `device` değerini atlayabilir. Bu yol dahili kontrol düzlemi RPC'leri için ayrılmıştır ve eski CLI/cihaz eşleştirme tabanlarının, alt ajan oturumu güncellemeleri gibi yerel arka uç işlerini engellemesini önler. Uzak istemciler, tarayıcı kökenli istemciler, node istemcileri ve açık cihaz-token'ı/cihaz-kimliği istemcileri normal eşleştirme ve kapsam yükseltme kontrollerini kullanmaya devam eder.

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

Yerleşik QR/kurulum kodu önyüklemesi yeni bir mobil devretme yoludur. Başarılı bir taban kurulum kodu bağlantısı, birincil node token'ı ve bir sınırlı operatör token'ı döndürür:

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

Operatör devri kasıtlı olarak sınırlıdır; böylece QR ile kullanıma alma, mobil operatör döngüsünü başlatabilir ve eşleştirme mutasyon kapsamları veya `operator.admin` vermeden yerel kurulumu tamamlayabilir. Yerel istemcinin önyüklemeden sonra ihtiyaç duyduğu Talk yapılandırmasını okuyabilmesi için `operator.talk.secrets` içerir. Daha geniş eşleştirme ve yönetici erişimi ayrı bir onaylı operatör eşleştirmesi veya token akışı gerektirir. İstemciler `hello-ok.auth.deviceTokens` değerini yalnızca bağlantı `wss://` veya loopback/yerel eşleştirme gibi güvenilir aktarımda önyükleme kimlik doğrulaması kullandığında kalıcı olarak saklamalıdır.

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

Yan etkisi olan yöntemler **idempotency anahtarları** gerektirir (bkz. şema).

## Roller + kapsamlar

Tam operatör kapsam modeli, onay zamanı kontrolleri ve paylaşılan gizli anahtar semantiği için bkz. [Operatör kapsamları](/tr/gateway/operator-scopes).

### Roller

- `operator` = kontrol düzlemi istemcisi (CLI/UI/otomasyon).
- `node` = yetenek ana makinesi (camera/screen/canvas/system.run).

### Kapsamlar (operatör)

Yaygın kapsamlar:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` ile `talk.config`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.
Gizli değerler dahil edildiğinde, istemciler etkin Talk sağlayıcısı kimlik bilgisini `talk.resolved.config.apiKey` üzerinden okumalıdır; `talk.providers.<id>.apiKey` kaynak şekilli kalır ve bir SecretRef nesnesi veya redakte edilmiş bir dize olabilir.

Plugin tarafından kaydedilmiş Gateway RPC yöntemleri kendi operatör kapsamlarını isteyebilir, ancak ayrılmış çekirdek yönetici önekleri (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) her zaman `operator.admin` olarak çözümlenir.

Yöntem kapsamı yalnızca ilk kapıdır. `chat.send` üzerinden ulaşılan bazı slash komutları bunun üstünde daha sıkı komut düzeyi kontroller uygular. Örneğin, kalıcı `/config set` ve `/config unset` yazmaları `operator.admin` gerektirir.

`node.pair.approve`, temel yöntem kapsamının üstünde ek bir onay zamanı kapsam denetimine de sahiptir:

- komutsuz istekler: `operator.pairing`
- exec olmayan node komutları içeren istekler: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which` içeren istekler: `operator.pairing` + `operator.admin`

### Yetenekler/komutlar/izinler (node)

Node'lar bağlantı sırasında yetenek iddialarını bildirir:

- `caps`: `camera`, `canvas`, `screen`, `location`, `voice` ve `talk` gibi üst düzey yetenek kategorileri.
- `commands`: çağırma için komut izin listesi.
- `permissions`: ayrıntılı anahtarlar (örn. `screen.record`, `camera.capture`).

Gateway bunları **iddialar** olarak ele alır ve sunucu tarafı izin listelerini uygular.

## Varlık

- `system-presence`, cihaz kimliğine göre anahtarlanmış girişler döndürür.
- Varlık girişleri `deviceId`, `roles` ve `scopes` içerir; böylece kullanıcı arayüzleri, cihaz hem **operator** hem de **node** olarak bağlansa bile cihaz başına tek bir satır gösterebilir.
- `node.list`, isteğe bağlı `lastSeenAtMs` ve `lastSeenReason` alanlarını içerir. Bağlı node'lar mevcut bağlantı zamanlarını `connect` nedeniyle `lastSeenAtMs` olarak bildirir; eşleştirilmiş node'lar, güvenilir bir node olayı eşleştirme meta verilerini güncellediğinde kalıcı arka plan varlığı da bildirebilir.

### Node arka plan canlı olayı

Node'lar, eşleştirilmiş bir node'un arka plan uyanışı sırasında bağlı olarak işaretlenmeden canlı olduğunu kaydetmek için `event: "node.presence.alive"` ile `node.event` çağırabilir.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` kapalı bir enum'dur: `background`, `silent_push`, `bg_app_refresh`, `significant_location`, `manual` veya `connect`. Bilinmeyen tetikleyici dizeleri, kalıcı hale getirilmeden önce Gateway tarafından `background` olarak normalize edilir. Olay yalnızca kimliği doğrulanmış node cihaz oturumları için kalıcıdır; cihazsız veya eşleştirilmemiş oturumlar `handled: false` döndürür.

Başarılı Gateway'ler yapılandırılmış bir sonuç döndürür:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Daha eski Gateway'ler `node.event` için hâlâ `{ "ok": true }` döndürebilir; istemciler bunu kalıcı varlık saklama olarak değil, onaylanmış bir RPC olarak ele almalıdır.

## Yayın olayı kapsamlandırma

Sunucu tarafından gönderilen WebSocket yayın olayları kapsam denetimlidir; böylece eşleştirme kapsamlı veya yalnızca node oturumları oturum içeriğini pasif olarak almaz.

- **Sohbet, ajan ve araç sonucu çerçeveleri** (akışlı `agent` olayları ve araç çağrısı sonuçları dahil) en az `operator.read` gerektirir. `operator.read` olmayan oturumlar bu çerçeveleri tamamen atlar.
- **Plugin tanımlı `plugin.*` yayınları**, Plugin'in bunları nasıl kaydettiğine bağlı olarak `operator.write` veya `operator.admin` ile sınırlandırılır.
- **Durum ve aktarım olayları** (`heartbeat`, `presence`, `tick`, bağlantı/kesinti yaşam döngüsü vb.) sınırsız kalır; böylece aktarım sağlığı her kimliği doğrulanmış oturum tarafından gözlemlenebilir.
- **Bilinmeyen yayın olayı aileleri**, kayıtlı bir işleyici bunları açıkça gevşetmediği sürece varsayılan olarak kapsam denetimlidir (kapalı hata).

Her istemci bağlantısı kendi istemci başına sıra numarasını tutar; böylece farklı istemciler olay akışının farklı kapsam filtreli alt kümelerini görse bile yayınlar o sokette monoton sıralamayı korur.

## Yaygın RPC yöntem aileleri

Genel WS yüzeyi yukarıdaki el sıkışma/kimlik doğrulama örneklerinden daha geniştir. Bu oluşturulmuş bir döküm değildir; `hello-ok.features.methods`, `src/gateway/server-methods-list.ts` ve yüklenen Plugin/kanal yöntem dışa aktarımlarından oluşturulmuş korumacı bir keşif listesidir. Bunu `src/gateway/server-methods/*.ts` için tam bir listeleme değil, özellik keşfi olarak ele alın.

  <AccordionGroup>
  <Accordion title="Sistem ve kimlik">
    - `health`, önbelleğe alınmış veya yeni yoklanmış Gateway sağlık anlık görüntüsünü döndürür.
    - `diagnostics.stability`, yakın tarihli sınırlı tanılama kararlılığı kaydedicisini döndürür. Olay adları, sayılar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/Plugin adları ve oturum kimlikleri gibi operasyonel meta verileri tutar. Sohbet metnini, Webhook gövdelerini, araç çıktılarını, ham istek veya yanıt gövdelerini, belirteçleri, çerezleri ya da gizli değerleri tutmaz. Operatör okuma kapsamı gerekir.
    - `status`, `/status` tarzı Gateway özetini döndürür; hassas alanlar yalnızca yönetici kapsamlı operatör istemcileri için eklenir.
    - `gateway.identity.get`, aktarma ve eşleştirme akışları tarafından kullanılan Gateway cihaz kimliğini döndürür.
    - `system-presence`, bağlı operatör/Node cihazları için geçerli varlık anlık görüntüsünü döndürür.
    - `system-event`, bir sistem olayı ekler ve varlık bağlamını güncelleyebilir/yayınlayabilir.
    - `last-heartbeat`, en son kalıcılaştırılmış Heartbeat olayını döndürür.
    - `set-heartbeats`, Gateway üzerinde Heartbeat işlemeyi açıp kapatır.

  </Accordion>

  <Accordion title="Modeller ve kullanım">
    - `models.list`, çalışma zamanında izin verilen model kataloğunu döndürür. Seçici boyutunda yapılandırılmış modeller için `{ "view": "configured" }` (`agents.defaults.models` önce, ardından `models.providers.*.models`) veya tam katalog için `{ "view": "all" }` iletin.
    - `usage.status`, sağlayıcı kullanım pencerelerini/kalan kota özetlerini döndürür.
    - `usage.cost`, bir tarih aralığı için toplanmış maliyet kullanımı özetlerini döndürür.
      Tek bir agent için `agentId` iletin veya yapılandırılmış agent'ları toplamak için `agentScope: "all"` kullanın.
    - `doctor.memory.status`, etkin varsayılan agent çalışma alanı için vektör belleği / önbelleğe alınmış embedding hazır olma durumunu döndürür. Yalnızca çağıran taraf açıkça canlı bir embedding sağlayıcısı ping'i istediğinde `{ "probe": true }` veya `{ "deep": true }` iletin. Dreaming uyumlu istemciler, Dreaming depo istatistiklerini seçili bir agent çalışma alanıyla sınırlamak için `{ "agentId": "agent-id" }` de iletebilir; `agentId` değerinin atlanması varsayılan agent geri dönüşünü korur ve yapılandırılmış Dreaming çalışma alanlarını toplar.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` ve `doctor.memory.dedupeDreamDiary`, seçili agent Dreaming görünümleri/eylemleri için isteğe bağlı `{ "agentId": "agent-id" }` parametrelerini kabul eder. `agentId` atlandığında, yapılandırılmış varsayılan agent çalışma alanında çalışırlar.
    - `doctor.memory.remHarness`, uzak denetim düzlemi istemcileri için sınırlı, salt okunur bir REM harness önizlemesi döndürür. Çalışma alanı yollarını, bellek parçalarını, işlenmiş temellendirilmiş markdown'u ve derin yükseltme adaylarını içerebilir; bu nedenle çağıranların `operator.read` iznine ihtiyacı vardır.
    - `sessions.usage`, oturum başına kullanım özetlerini döndürür. Tek bir
      agent için `agentId` iletin veya yapılandırılmış agent'ları birlikte listelemek için `agentScope: "all"` kullanın.
    - `sessions.usage.timeseries`, tek bir oturum için zaman serisi kullanımını döndürür.
    - `sessions.usage.logs`, tek bir oturum için kullanım günlüğü girdilerini döndürür.

  </Accordion>

  <Accordion title="Kanallar ve oturum açma yardımcıları">
    - `channels.status`, yerleşik + paketlenmiş kanal/Plugin durum özetlerini döndürür.
    - `channels.logout`, kanal oturum kapatmayı destekliyorsa belirli bir kanal/hesap oturumunu kapatır.
    - `web.login.start`, mevcut QR destekli web kanal sağlayıcısı için bir QR/web oturum açma akışı başlatır.
    - `web.login.wait`, bu QR/web oturum açma akışının tamamlanmasını bekler ve başarılı olursa kanalı başlatır.
    - `push.test`, kayıtlı bir iOS Node'una test APNs anında iletme bildirimi gönderir.
    - `voicewake.get`, saklanan uyandırma sözcüğü tetikleyicilerini döndürür.
    - `voicewake.set`, uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayınlar.

  </Accordion>

  <Accordion title="Mesajlaşma ve günlükler">
    - `send`, sohbet çalıştırıcısının dışındaki kanal/hesap/iş parçacığı hedefli gönderimler için doğrudan giden teslimat RPC'sidir.
    - `logs.tail`, imleç/sınır ve azami bayt denetimleriyle yapılandırılmış gateway dosya günlüğü kuyruğunu döndürür.

  </Accordion>

  <Accordion title="Talk ve TTS">
    - `talk.catalog`, konuşma, akışlı transkripsiyon ve gerçek zamanlı ses için salt okunur Talk sağlayıcı kataloğunu döndürür. Sağlayıcı gizli bilgilerini döndürmeden veya genel yapılandırmayı değiştirmeden kanonik sağlayıcı kimliklerini, kayıt defteri takma adlarını, etiketleri, yapılandırılmış durumu, isteğe bağlı grup düzeyi `ready` sonucunu, dışa açılan model/ses kimliklerini, kanonik modları, taşıma katmanlarını, beyin stratejilerini ve gerçek zamanlı ses/yetenek bayraklarını içerir. Geçerli Gateway'ler, çalışma zamanı sağlayıcı seçimini uyguladıktan sonra `ready` değerini ayarlar; istemciler, eski Gateway'lerle uyumluluk için bunun yokluğunu doğrulanmamış olarak değerlendirmelidir.
    - `talk.config`, etkili Talk yapılandırma yükünü döndürür; `includeSecrets`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.
    - `talk.session.create`, `realtime/gateway-relay`, `transcription/gateway-relay` veya `stt-tts/managed-room` için Gateway'e ait bir Talk oturumu oluşturur. `stt-tts/managed-room` için, `sessionKey` ileten `operator.write` çağıranları, kapsamlı oturum anahtarı görünürlüğü için `spawnedBy` de iletmelidir; kapsamsız `sessionKey` oluşturma ve `brain: "direct-tools"` `operator.admin` gerektirir.
    - `talk.session.join`, yönetilen oda oturum belirtecini doğrular, gerektiğinde `session.ready` veya `session.replaced` olaylarını yayar ve düz metin belirteç veya saklanan belirteç karması olmadan oda/oturum meta verilerini ve son Talk olaylarını döndürür.
    - `talk.session.appendAudio`, Gateway'e ait gerçek zamanlı aktarma ve transkripsiyon oturumlarına base64 PCM giriş sesi ekler.
    - `talk.session.startTurn`, `talk.session.endTurn` ve `talk.session.cancelTurn`, durum temizlenmeden önce eski sıra reddiyle yönetilen oda sıra yaşam döngüsünü yürütür.
    - `talk.session.cancelOutput`, özellikle Gateway aktarma oturumlarında VAD kapılı araya girme için asistan ses çıkışını durdurur.
    - `talk.session.submitToolResult`, Gateway'e ait gerçek zamanlı aktarma oturumu tarafından yayılan bir sağlayıcı araç çağrısını tamamlar. Sonuç daha sonra gelecek ara araç çıktısı için `options: { willContinue: true }` iletin veya araç sonucunun başka bir gerçek zamanlı asistan yanıtı başlatmadan sağlayıcı çağrısını karşılaması gerektiğinde `options: { suppressResponse: true }` iletin.
    - `talk.session.steer`, etkin çalıştırma ses denetimini Gateway'e ait ajan destekli bir Talk oturumuna gönderir. `{ sessionId, text, mode? }` kabul eder; burada `mode`, `status`, `steer`, `cancel` veya `followup` değeridir; atlanan mod konuşulan metinden sınıflandırılır.
    - `talk.session.close`, Gateway'e ait aktarma, transkripsiyon veya yönetilen oda oturumunu kapatır ve terminal Talk olaylarını yayar.
    - `talk.mode`, WebChat/Control UI istemcileri için geçerli Talk modu durumunu ayarlar/yayınlar.
    - `talk.client.create`, Gateway yapılandırma, kimlik bilgileri, yönergeler ve araç ilkesine sahipken `webrtc` veya `provider-websocket` kullanarak istemciye ait gerçek zamanlı sağlayıcı oturumu oluşturur.
    - `talk.client.toolCall`, istemciye ait gerçek zamanlı taşıma katmanlarının sağlayıcı araç çağrılarını Gateway ilkesine iletmesine izin verir. İlk desteklenen araç `openclaw_agent_consult` aracıdır; istemciler bir çalıştırma kimliği alır ve sağlayıcıya özgü araç sonucunu göndermeden önce normal sohbet yaşam döngüsü olaylarını bekler.
    - `talk.client.steer`, istemciye ait gerçek zamanlı taşıma katmanları için etkin çalıştırma ses denetimi gönderir. Gateway, etkin gömülü çalıştırmayı `sessionKey` üzerinden çözümler ve yönlendirmeyi sessizce yok saymak yerine yapılandırılmış kabul edildi/reddedildi sonucu döndürür.
    - `talk.event`, gerçek zamanlı, transkripsiyon, STT/TTS, yönetilen oda, telefon ve toplantı bağdaştırıcıları için tek Talk olay kanalıdır.
    - `talk.speak`, etkin Talk konuşma sağlayıcısı üzerinden konuşma sentezler.
    - `tts.status`, TTS etkin durumunu, etkin sağlayıcıyı, yedek sağlayıcıları ve sağlayıcı yapılandırma durumunu döndürür.
    - `tts.providers`, görünür TTS sağlayıcı envanterini döndürür.
    - `tts.enable` ve `tts.disable`, TTS tercih durumunu değiştirir.
    - `tts.setProvider`, tercih edilen TTS sağlayıcısını günceller.
    - `tts.convert`, tek seferlik metinden konuşmaya dönüştürme çalıştırır.

  </Accordion>

  <Accordion title="Gizli bilgiler, yapılandırma, güncelleme ve sihirbaz">
    - `secrets.reload`, etkin SecretRef'leri yeniden çözümler ve çalışma zamanı gizli bilgi durumunu yalnızca tam başarı durumunda değiştirir.
    - `secrets.resolve`, belirli bir komut/hedef kümesi için komut hedefli gizli bilgi atamalarını çözümler.
    - `config.get`, geçerli yapılandırma anlık görüntüsünü ve karmasını döndürür.
    - `config.set`, doğrulanmış bir yapılandırma yükü yazar.
    - `config.patch`, kısmi bir yapılandırma güncellemesini birleştirir. Yıkıcı dizi
      değiştirme, etkilenen yolun `replacePaths` içinde olmasını gerektirir; dizi girdilerinin
      altındaki iç içe diziler `agents.list[].skills` gibi `[]` yolları kullanır.
    - `config.apply`, tam yapılandırma yükünü doğrular + değiştirir.
    - `config.schema`, Control UI ve CLI araçları tarafından kullanılan canlı yapılandırma şeması yükünü döndürür: şema, `uiHints`, sürüm ve üretim meta verileri; çalışma zamanı yükleyebildiğinde Plugin + kanal şeması meta verileri dahil. Şema, eşleşen alan dokümantasyonu bulunduğunda iç içe nesne, joker karakter, dizi öğesi ve `anyOf` / `oneOf` / `allOf` bileşim dalları dahil olmak üzere UI tarafından kullanılan aynı etiketlerden ve yardım metninden türetilmiş alan `title` / `description` meta verilerini içerir.
    - `config.schema.lookup`, bir yapılandırma yolu için yol kapsamlı arama yükü döndürür: normalleştirilmiş yol, sığ bir şema düğümü, eşleşen ipucu + `hintPath`, isteğe bağlı `reloadKind` ve UI/CLI ayrıntıya inme için doğrudan alt özetler. `reloadKind`, `restart`, `hot` veya `none` değerlerinden biridir ve istenen yol için Gateway yapılandırma yeniden yükleme planlayıcısını yansıtır. Arama şeması düğümleri kullanıcıya dönük dokümanları ve yaygın doğrulama alanlarını (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, sayısal/dize/dizi/nesne sınırları ve `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi bayraklar) korur. Alt özetler `key`, normalleştirilmiş `path`, `type`, `required`, `hasChildren`, isteğe bağlı `reloadKind` ile eşleşen `hint` / `hintPath` değerlerini dışa açar.
    - `update.run`, gateway güncelleme akışını çalıştırır ve yalnızca güncellemenin kendisi başarılı olduğunda yeniden başlatma zamanlar; oturumu olan çağıranlar, başlangıcın yeniden başlatma devam kuyruğu üzerinden bir takip ajan sırasını sürdürmesi için `continuationMessage` ekleyebilir. Denetim düzleminden gelen paket yöneticisi güncellemeleri ve denetimli git checkout güncellemeleri, canlı Gateway içinde paket ağacını değiştirmek veya checkout/derleme çıktısını mutasyona uğratmak yerine ayrılmış bir yönetilen hizmet devri kullanır. Başlatılmış bir devir, `result.reason: "managed-service-handoff-started"` ve `handoff.status: "started"` ile `ok: true` döndürür; kullanılamayan veya başarısız devirler `managed-service-handoff-unavailable` veya `managed-service-handoff-failed` ile `ok: false` döndürür, elle kabuk güncellemesi gerektiğinde ayrıca `handoff.command` içerir. Kullanılamayan bir devir, OpenClaw'ın systemd için `OPENCLAW_SYSTEMD_UNIT` gibi güvenli bir gözetmen sınırından veya kalıcı hizmet kimliğinden yoksun olduğu anlamına gelir. Başlatılmış devir sırasında yeniden başlatma işaretçisi kısa süreyle `stats.reason: "restart-health-pending"` bildirebilir; devam, CLI yeniden başlatılan Gateway'i doğrulayıp son `ok` işaretçisini yazana kadar geciktirilir.
    - `update.status`, yeniden başlatma sonrası çalışan sürüm mevcut olduğunda dahil olmak üzere en son güncelleme yeniden başlatma işaretçisini yeniler ve döndürür.
    - `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`, ilk kurulum sihirbazını WS RPC üzerinden dışa açar.

  </Accordion>

  <Accordion title="Ajan ve çalışma alanı yardımcıları">
    - `agents.list`, etkili model ve çalışma zamanı meta verileri dahil yapılandırılmış ajan girdilerini döndürür.
    - `agents.create`, `agents.update` ve `agents.delete`, ajan kayıtlarını ve çalışma alanı bağlantılarını yönetir.
    - `agents.files.list`, `agents.files.get` ve `agents.files.set`, bir ajan için sunulan önyükleme çalışma alanı dosyalarını yönetir.
    - `tasks.list`, `tasks.get` ve `tasks.cancel`, Gateway görev defterini SDK ve operatör istemcilerine sunar.
    - `artifacts.list`, `artifacts.get` ve `artifacts.download`, açık bir `sessionKey`, `runId` veya `taskId` kapsamı için transkriptten türetilmiş artifact özetlerini ve indirmeleri sunar. Çalıştırma ve görev sorguları, sahip oturumu sunucu tarafında çözer ve yalnızca eşleşen kökene sahip transkript medyasını döndürür; güvenli olmayan veya yerel URL kaynakları, sunucu tarafında getirmek yerine desteklenmeyen indirmeler döndürür.
    - `environments.list` ve `environments.status`, SDK istemcileri için salt okunur Gateway yerel ve Node ortam keşfini sunar.
    - `agent.identity.get`, bir ajan veya oturum için etkili asistan kimliğini döndürür.
    - `agent.wait`, bir çalıştırmanın bitmesini bekler ve varsa terminal anlık görüntüsünü döndürür.

  </Accordion>

  <Accordion title="Oturum denetimi">
    - `sessions.list`, ajan çalışma zamanı arka ucu yapılandırıldığında satır başına `agentRuntime` meta verileri dahil geçerli oturum dizinini döndürür.
    - `sessions.subscribe` ve `sessions.unsubscribe`, geçerli WS istemcisi için oturum değişikliği olay aboneliklerini açıp kapatır.
    - `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`, bir oturum için transkript/mesaj olay aboneliklerini açıp kapatır.
    - `sessions.preview`, belirli oturum anahtarları için sınırlandırılmış transkript önizlemeleri döndürür.
    - `sessions.describe`, tam bir oturum anahtarı için bir Gateway oturum satırı döndürür.
    - `sessions.resolve`, bir oturum hedefini çözer veya kanonikleştirir.
    - `sessions.create`, yeni bir oturum girdisi oluşturur.
    - `sessions.send`, mevcut bir oturuma mesaj gönderir.
    - `sessions.steer`, etkin bir oturum için kesme-ve-yönlendirme varyantıdır.
    - `sessions.abort`, bir oturum için etkin çalışmayı iptal eder. Çağıran, `key` ve isteğe bağlı `runId` geçirebilir ya da Gateway'in bir oturuma çözebildiği etkin çalıştırmalar için yalnızca `runId` geçirebilir.
    - `sessions.patch`, oturum meta verilerini/geçersiz kılmalarını günceller ve çözümlenmiş kanonik modeli artı etkili `agentRuntime` değerini bildirir.
    - `sessions.reset`, `sessions.delete` ve `sessions.compact`, oturum bakımını gerçekleştirir.
    - `sessions.get`, tam saklanan oturum satırını döndürür.
    - Sohbet yürütmesi hâlâ `chat.history`, `chat.send`, `chat.abort` ve `chat.inject` kullanır. `chat.history`, UI istemcileri için görüntü açısından normalleştirilir: satır içi direktif etiketleri görünür metinden çıkarılır, düz metin araç çağrısı XML yükleri (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil) ve sızmış ASCII/tam genişlikli model denetim belirteçleri çıkarılır, tam `NO_REPLY` / `no_reply` gibi yalnızca sessiz belirteç içeren asistan satırları atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir.
    - `chat.message.get`, tek bir görünür transkript girdisi için eklemeli, sınırlandırılmış tam mesaj okuyucudur. İstemciler `sessionKey`, oturum seçimi ajan kapsamlı olduğunda isteğe bağlı `agentId` ve daha önce `chat.history` üzerinden sunulmuş bir transkript `messageId` geçirir; Gateway, saklanan girdi hâlâ mevcutsa ve aşırı büyük değilse hafif geçmiş kesme sınırı olmadan aynı görüntü-normalleştirilmiş projeksiyonu döndürür.
    - `chat.send`, otomatik kesimden önce başlatılan model çağrıları için hızlı modu kullanmak, ardından daha sonraki yeniden deneme, geri dönüş, araç sonucu veya devam çağrılarını hızlı mod olmadan başlatmak üzere tek turluk `fastMode: "auto"` kabul eder. Kesim varsayılan olarak 60 saniyedir ve model başına `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` ile yapılandırılabilir. Bir `chat.send` çağıranı, o istek için kesimi geçersiz kılmak üzere tek turluk `fastAutoOnSeconds` geçirebilir.

  </Accordion>

  <Accordion title="Cihaz eşleştirme ve cihaz belirteçleri">
    - `device.pair.list`, bekleyen ve onaylanmış eşleştirilmiş cihazları döndürür.
    - `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`, cihaz eşleştirme kayıtlarını yönetir.
    - `device.token.rotate`, eşleştirilmiş bir cihaz belirtecini onaylanmış rolü ve çağıran kapsamı sınırları içinde döndürür.
    - `device.token.revoke`, eşleştirilmiş bir cihaz belirtecini onaylanmış rolü ve çağıran kapsamı sınırları içinde iptal eder.

  </Accordion>

  <Accordion title="Node eşleştirme, çağırma ve bekleyen çalışma">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` ve `node.pair.verify`, Node eşleştirmesini ve önyükleme doğrulamasını kapsar.
    - `node.list` ve `node.describe`, bilinen/bağlı Node durumunu döndürür.
    - `node.rename`, eşleştirilmiş bir Node etiketini günceller.
    - `node.invoke`, bir komutu bağlı bir Node'a iletir.
    - `node.invoke.result`, bir çağırma isteğinin sonucunu döndürür.
    - `node.event`, Node kaynaklı olayları Gateway'e geri taşır.
    - `node.pending.pull` ve `node.pending.ack`, bağlı Node kuyruk API'leridir.
    - `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısı kesilmiş Node'lar için dayanıklı bekleyen çalışmayı yönetir.

  </Accordion>

  <Accordion title="Onay aileleri">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve `exec.approval.resolve`, tek seferlik exec onay isteklerini ve bekleyen onay aramasını/yeniden oynatmayı kapsar.
    - `exec.approval.waitDecision`, bekleyen bir exec onayını bekler ve nihai kararı döndürür (veya zaman aşımında `null`).
    - `exec.approvals.get` ve `exec.approvals.set`, Gateway exec onay politikası anlık görüntülerini yönetir.
    - `exec.approvals.node.get` ve `exec.approvals.node.set`, Node aktarım komutları üzerinden Node yerel exec onay politikasını yönetir.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` ve `plugin.approval.resolve`, Plugin tanımlı onay akışlarını kapsar.

  </Accordion>

  <Accordion title="Otomasyon, Skills ve araçlar">
    - Otomasyon: `wake`, anlık veya bir sonraki Heartbeat'te uyanma metni enjeksiyonu zamanlar; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zamanlanmış çalışmayı yönetir.
    - `cron.run`, manuel çalıştırmalar için kuyruğa ekleme tarzı bir RPC olarak kalır. Tamamlanma semantiğine ihtiyaç duyan istemciler döndürülen `runId` değerini okumalı ve `cron.runs` yoklamalıdır.
    - `cron.runs`, istemcilerin aynı iş için diğer geçmiş girdileriyle yarışmadan kuyruğa alınmış tek bir manuel çalıştırmayı izleyebilmesi için isteğe bağlı, boş olmayan bir `runId` filtresi kabul eder.
    - Skills ve araçlar: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Yaygın olay aileleri

- `chat`: `chat.inject` gibi UI sohbet güncellemeleri ve yalnızca transkript içeren diğer sohbet
  olayları. Protokol v4'te delta yükleri `deltaText` taşır; `message` kümülatif
  asistan anlık görüntüsü olarak kalır. Önek olmayan değiştirmeler `replace=true`
  ayarlar ve değiştirme metni olarak `deltaText` kullanır.
- `session.message`, `session.operation` ve `session.tool`: abone olunan bir
  oturum için transkript, uçuş halindeki oturum işlemi ve olay akışı güncellemeleri.
- `sessions.changed`: oturum dizini veya meta verileri değişti.
- `presence`: sistem varlık anlık görüntüsü güncellemeleri.
- `tick`: periyodik keepalive / canlılık olayı.
- `health`: Gateway sağlık anlık görüntüsü güncellemesi.
- `heartbeat`: Heartbeat olay akışı güncellemesi.
- `cron`: Cron çalıştırma/iş değişikliği olayı.
- `shutdown`: Gateway kapatma bildirimi.
- `node.pair.requested` / `node.pair.resolved`: Node eşleştirme yaşam döngüsü.
- `node.invoke.request`: Node çağırma isteği yayını.
- `device.pair.requested` / `device.pair.resolved`: eşleştirilmiş cihaz yaşam döngüsü.
- `voicewake.changed`: uyandırma sözcüğü tetikleyici yapılandırması değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onay
  yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin onay
  yaşam döngüsü.

### Node yardımcı yöntemleri

- Node'lar, otomatik izin kontrolleri için geçerli Skills çalıştırılabilirleri
  listesini almak üzere `skills.bins` çağırabilir.

### Görev defteri RPC'leri

Operatör istemcileri, görev defteri RPC'leri üzerinden Gateway arka plan görev
kayıtlarını inceleyebilir ve iptal edebilir. Bu yöntemler ham çalışma zamanı
durumu değil, temizlenmiş görev özetleri döndürür.

- `tasks.list`, `operator.read` gerektirir.
  - Parametreler: isteğe bağlı `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` veya `"timed_out"`) ya da bu durumların bir dizisi,
    isteğe bağlı `agentId`, isteğe bağlı `sessionKey`, `1` ile
    `500` arasında isteğe bağlı `limit` ve isteğe bağlı string `cursor`.
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

`TaskSummary`, `id`, `status` ve `kind`, `runtime`, `title`, `agentId`,
`sessionKey`, `childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`,
`parentTaskId`, `sourceId`, zaman damgaları, ilerleme, terminal özeti ve
temizlenmiş hata metni gibi isteğe bağlı meta verileri içerir. `agentId`, görevi
yürüten ajanı tanımlar; `sessionKey` ve `ownerKey`, istekte bulunan ve denetim
bağlamını korur.

### Operatör yardımcı yöntemleri

- Operatörler, bir aracı için çalışma zamanı komut envanterini almak üzere `commands.list` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan aracı çalışma alanını okumak için bunu atlayın.
  - `scope`, birincil `name` değerinin hangi yüzeyi hedeflediğini denetler:
    - `text`, başındaki `/` olmadan birincil metin komutu belirtecini döndürür
    - `native` ve varsayılan `both` yolu, mevcut olduğunda sağlayıcıya duyarlı yerel adları döndürür
  - `textAliases`, `/model` ve `/m` gibi tam eğik çizgi takma adlarını taşır.
  - `nativeName`, mevcut olduğunda sağlayıcıya duyarlı yerel komut adını taşır.
  - `provider` isteğe bağlıdır ve yalnızca yerel adlandırmayı ve yerel plugin komutu kullanılabilirliğini etkiler.
  - `includeArgs=false`, serileştirilmiş bağımsız değişken meta verilerini yanıttan çıkarır.
- Operatörler, bir aracı için çalışma zamanı araç kataloğunu almak üzere `tools.catalog` (`operator.read`) çağırabilir. Yanıt, gruplanmış araçları ve köken meta verilerini içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda plugin sahibi
  - `optional`: bir plugin aracının isteğe bağlı olup olmadığı
- Operatörler, bir oturum için çalışma zamanında etkin araç envanterini almak üzere `tools.effective` (`operator.read`) çağırabilir.
  - `sessionKey` zorunludur.
  - Gateway, çağıranın sağladığı kimlik doğrulama veya teslimat bağlamını kabul etmek yerine güvenilir çalışma zamanı bağlamını oturumdan sunucu tarafında türetir.
  - Yanıt, çekirdek, plugin, kanal ve zaten keşfedilmiş MCP sunucu araçlarını içeren, oturum kapsamlı ve sunucu tarafından türetilmiş bir etkin envanter projeksiyonudur.
  - `tools.effective`, MCP için salt okunurdur: ısınmış bir oturum MCP kataloğunu nihai araç ilkesi üzerinden yansıtabilir, ancak MCP çalışma zamanları oluşturmaz, aktarımları bağlamaz veya `tools/list` yayınlamaz. Eşleşen ısınmış katalog yoksa yanıt `mcp-not-yet-connected`, `mcp-not-yet-listed` veya `mcp-stale-catalog` gibi bir bildirim içerebilir.
  - Etkin araç girdileri `source="core"`, `source="plugin"`, `source="channel"` veya `source="mcp"` kullanır.
- Operatörler, kullanılabilir bir aracı `/tools/invoke` ile aynı gateway ilkesi yolu üzerinden çağırmak için `tools.invoke` (`operator.write`) çağırabilir.
  - `name` zorunludur. `args`, `sessionKey`, `agentId`, `confirm` ve `idempotencyKey` isteğe bağlıdır.
  - Hem `sessionKey` hem de `agentId` varsa çözümlenen oturum aracısı `agentId` ile eşleşmelidir.
  - `cron`, `gateway` ve `nodes` gibi yalnızca sahip çekirdek sarmalayıcıları, `tools.invoke` yönteminin kendisi `operator.write` olsa bile sahip/yönetici kimliği (`operator.admin`) gerektirir.
  - Yanıt, `ok`, `toolName`, isteğe bağlı `output` ve tiplendirilmiş `error` alanlarını içeren SDK odaklı bir zarftır. Onay veya ilke retleri, gateway araç ilkesi işlem hattını atlamak yerine yükte `ok:false` döndürür.
- Operatörler, bir aracı için görünür skill envanterini almak üzere `skills.status` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan aracı çalışma alanını okumak için bunu atlayın.
  - Yanıt; uygunluk, eksik gereksinimler, yapılandırma denetimleri ve ham gizli değerleri açığa çıkarmadan temizlenmiş kurulum seçeneklerini içerir.
- Operatörler, ClawHub keşif meta verileri için `skills.search` ve `skills.detail` (`operator.read`) çağırabilir.
- Operatörler, özel bir skill arşivini kurmadan önce hazırlamak için `skills.upload.begin`, `skills.upload.chunk` ve `skills.upload.commit` (`operator.admin`) çağırabilir. Bu, güvenilir istemciler için ayrı bir yönetici yükleme yoludur; normal ClawHub skill kurulum akışı değildir ve `skills.install.allowUploadedArchives` etkinleştirilmedikçe varsayılan olarak devre dışıdır.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`, bu slug ve force değerine bağlı bir yükleme oluşturur.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })`, baytları tam çözümlenmiş ofsette ekler.
  - `skills.upload.commit({ uploadId, sha256? })`, son boyutu ve SHA-256 değerini doğrular. Commit yalnızca yüklemeyi sonlandırır; skill kurmaz.
  - Yüklenen skill arşivleri, kökünde `SKILL.md` bulunan zip arşivleridir. Arşivin iç dizin adı kurulum hedefini hiçbir zaman seçmez.
- Operatörler `skills.install` (`operator.admin`) çağrısını üç modda yapabilir:
  - ClawHub modu: `{ source: "clawhub", slug, version?, force? }`, varsayılan aracı çalışma alanındaki `skills/` dizinine bir skill klasörü kurar.
  - Yükleme modu: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`, tamamlanmış bir yüklemeyi varsayılan aracı çalışma alanındaki `skills/<slug>` dizinine kurar. Slug ve force değeri, özgün `skills.upload.begin` isteğiyle eşleşmelidir. Bu mod, `skills.install.allowUploadedArchives` etkinleştirilmedikçe reddedilir. Ayar, ClawHub kurulumlarını etkilemez.
  - Gateway yükleyici modu: `{ name, installId, timeoutMs? }`, gateway ana bilgisayarında bildirilmiş bir `metadata.openclaw.install` eylemini çalıştırır. Eski istemciler hâlâ `dangerouslyForceUnsafeInstall` gönderebilir; bu alan kullanımdan kaldırılmıştır, yalnızca protokol uyumluluğu için kabul edilir ve yok sayılır. Operatöre ait kurulum kararları için `security.installPolicy` kullanın.
- Operatörler `skills.update` (`operator.admin`) çağrısını iki modda yapabilir:
  - ClawHub modu, varsayılan aracı çalışma alanında izlenen tek bir slug değerini veya izlenen tüm ClawHub kurulumlarını günceller.
  - Yapılandırma modu, `enabled`, `apiKey` ve `env` gibi `skills.entries.<skillKey>` değerlerini yamalar.

### `models.list` görünümleri

`models.list`, isteğe bağlı bir `view` parametresi kabul eder:

- Atlanmış veya `"default"`: geçerli çalışma zamanı davranışı. `agents.defaults.models` yapılandırılmışsa yanıt, `provider/*` girdileri için dinamik olarak keşfedilen modeller dahil olmak üzere izin verilen katalogdur. Aksi halde yanıt, tam Gateway kataloğudur.
- `"configured"`: seçici boyutunda davranış. `agents.defaults.models` yapılandırılmışsa, `provider/*` girdileri için sağlayıcı kapsamlı keşif dahil yine önceliklidir. İzin listesi yoksa yanıt, açık `models.providers.*.models` girdilerini kullanır ve yalnızca yapılandırılmış model satırı yoksa tam kataloğa geri döner.
- `"all"`: `agents.defaults.models` değerini atlayarak tam Gateway kataloğu. Bunu normal model seçiciler için değil, tanılama ve keşif kullanıcı arayüzleri için kullanın.

## Exec onayları

- Bir exec isteği onay gerektirdiğinde gateway `exec.approval.requested` yayınlar.
- Operatör istemcileri `exec.approval.resolve` çağırarak çözer (`operator.approvals` kapsamı gerektirir).
- `host=node` için `exec.approval.request`, `systemRunPlan` içermelidir (kanonik `argv`/`cwd`/`rawCommand`/oturum meta verileri). `systemRunPlan` eksik olan istekler reddedilir.
- Onaydan sonra iletilen `node.invoke system.run` çağrıları, yetkili komut/cwd/oturum bağlamı olarak bu kanonik `systemRunPlan` değerini yeniden kullanır.
- Bir çağıran, hazırlama ile son onaylı `system.run` iletimi arasında `command`, `rawCommand`, `cwd`, `agentId` veya `sessionKey` değerini değiştirirse gateway, değiştirilmiş yüke güvenmek yerine çalıştırmayı reddeder.

## Aracı teslimat geri dönüşü

- `agent` istekleri, dışa giden teslimat istemek için `deliver=true` içerebilir.
- `bestEffortDeliver=false` katı davranışı korur: çözülemeyen veya yalnızca dahili teslimat hedefleri `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici olarak teslim edilebilir bir rota çözülemediğinde oturumla sınırlı yürütmeye geri dönüşe izin verir (örneğin dahili/webchat oturumları veya belirsiz çok kanallı yapılandırmalar).
- Nihai `agent` sonuçları, teslimat istendiğinde [`openclaw agent --json --deliver`](/tr/cli/agent#json-delivery-status) için belgelenen aynı `sent`, `suppressed`, `partial_failed` ve `failed` durumlarını kullanarak `result.deliveryStatus` içerebilir.

## Sürümleme

- `PROTOCOL_VERSION`, `packages/gateway-protocol/src/version.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu, geçerli protokolünü içermeyen aralıkları reddeder. Geçerli istemciler ve sunucular protokol v4 gerektirir.
- Şemalar + modeller TypeBox tanımlarından üretilir:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### İstemci sabitleri

`src/gateway/client.ts` içindeki referans istemci bu varsayılanları kullanır. Değerler protokol v4 boyunca kararlıdır ve üçüncü taraf istemciler için beklenen temeldir.

| Sabit                                     | Varsayılan                                            | Kaynak                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| İstek zaman aşımı (RPC başına)            | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Ön kimlik doğrulama / bağlanma sınaması zaman aşımı | `15_000` ms                                 | `src/gateway/handshake-timeouts.ts` (config/env eşli sunucu/istemci bütçesini artırabilir) |
| İlk yeniden bağlanma geri çekilmesi       | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| En yüksek yeniden bağlanma geri çekilmesi | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Cihaz belirteci kapanışından sonra hızlı yeniden deneme sınırı | `250` ms                              | `src/gateway/client.ts`                                                                    |
| `terminate()` öncesi zorla durdurma ek süresi | `250` ms                                          | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` varsayılan zaman aşımı    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Varsayılan tick aralığı (`hello-ok` öncesi) | `30_000` ms                                        | `src/gateway/client.ts`                                                                    |
| Tick zaman aşımı kapanışı                 | sessizlik `tickIntervalMs * 2` değerini aştığında kod `4000` | `src/gateway/client.ts`                                                           |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Sunucu, etkin `policy.tickIntervalMs`, `policy.maxPayload` ve `policy.maxBufferedBytes` değerlerini `hello-ok` içinde duyurur; istemciler el sıkışma öncesi varsayılanlar yerine bu değerlere uymalıdır.

## Kimlik Doğrulama

- Shared-secret Gateway kimlik doğrulaması, yapılandırılan auth moduna bağlı olarak `connect.params.auth.token` veya
  `connect.params.auth.password` kullanır.
- Tailscale Serve
  (`gateway.auth.allowTailscale: true`) veya loopback dışı
  `gateway.auth.mode: "trusted-proxy"` gibi kimlik taşıyan modlar, connect auth denetimini
  `connect.params.auth.*` yerine istek başlıklarından karşılar.
- Private-ingress `gateway.auth.mode: "none"`, shared-secret connect auth işlemini
  tamamen atlar; bu modu herkese açık/güvenilmeyen ingress üzerinde açmayın.
- Eşleştirmeden sonra Gateway, bağlantı
  rolü + kapsamlarıyla sınırlı bir **cihaz belirteci** verir. Bu belirteç
  `hello-ok.auth.deviceToken` içinde döndürülür ve gelecekteki connect işlemleri için
  istemci tarafından kalıcı olarak saklanmalıdır.
- İstemciler, başarılı herhangi bir connect işleminden sonra birincil `hello-ok.auth.deviceToken` değerini
  kalıcı olarak saklamalıdır.
- Bu **saklanan** cihaz belirteciyle yeniden bağlanmak, o belirteç için saklanan
  onaylı kapsam kümesini de yeniden kullanmalıdır. Bu, zaten verilmiş olan
  okuma/yoklama/durum erişimini korur ve yeniden bağlantıların sessizce
  daha dar, örtük yalnızca-admin kapsamına düşmesini önler.
- İstemci tarafı connect auth oluşturma (`src/gateway/client.ts` içindeki
  `selectConnectAuth`):
  - `auth.password` bağımsızdır ve ayarlandığında her zaman iletilir.
  - `auth.token` öncelik sırasıyla doldurulur: önce açık shared token,
    sonra açık `deviceToken`, sonra saklanan cihaz başına belirteç (`deviceId` + `role` ile
    anahtarlanır).
  - `auth.bootstrapToken`, yalnızca yukarıdakilerin hiçbiri bir
    `auth.token` çözümlemediğinde gönderilir. Shared token veya çözümlenen herhangi bir cihaz belirteci bunu bastırır.
  - Tek seferlik `AUTH_TOKEN_MISMATCH` yeniden denemesinde saklanan cihaz belirtecinin
    otomatik yükseltilmesi **yalnızca güvenilen uç noktalarla** sınırlıdır —
    loopback veya sabitlenmiş `tlsFingerprint` ile `wss://`. Sabitleme olmadan herkese açık `wss://`
    bu koşulu karşılamaz.
- Yerleşik setup-code bootstrap, birincil node
  `hello-ok.auth.deviceToken` değerini ve güvenilen mobil aktarım için
  `hello-ok.auth.deviceTokens` içinde sınırlı bir operatör belirtecini döndürür. Operatör belirteci,
  yerel Talk yapılandırma okumaları için `operator.talk.secrets` içerir, ancak
  eşleştirme değişiklik kapsamlarını ve `operator.admin` kapsamını hariç tutar.
- Temel olmayan bir setup-code bootstrap onay beklerken, `PAIRING_REQUIRED`
  ayrıntıları `recommendedNextStep: "wait_then_retry"`, `retryable: true` ve
  `pauseReconnect: false` içerir. İstemciler, istek onaylanana veya belirteç geçersiz hale gelene kadar
  aynı bootstrap belirteciyle yeniden bağlanmaya devam etmelidir.
- `hello-ok.auth.deviceTokens` değerini yalnızca connect, `wss://` veya loopback/local pairing gibi
  güvenilen bir taşıma üzerinde bootstrap auth kullandığında kalıcı olarak saklayın.
- Bir istemci **açık** bir `deviceToken` veya açık `scopes` sağlarsa,
  çağıranın istediği kapsam kümesi yetkili olmaya devam eder; önbelleğe alınmış kapsamlar yalnızca
  istemci saklanan cihaz başına belirteci yeniden kullandığında yeniden kullanılır.
- Cihaz belirteçleri `device.token.rotate` ve
  `device.token.revoke` ile döndürülebilir/iptal edilebilir (`operator.pairing` kapsamı gerekir). Bir node veya başka bir operatör dışı rolü döndürmek ya da
  iptal etmek için ayrıca `operator.admin` gerekir.
- `device.token.rotate`, döndürme meta verilerini döndürür. Yedek bearer belirtecini yalnızca
  halihazırda o cihaz belirteciyle kimliği doğrulanmış aynı cihaz çağrıları için yansıtır;
  böylece yalnızca belirteç kullanan istemciler, yeniden bağlanmadan önce yedeklerini kalıcı olarak saklayabilir.
  Shared/admin döndürmeleri bearer belirtecini yansıtmaz.
- Belirteç verme, döndürme ve iptal işlemleri, o cihazın eşleştirme kaydında
  kaydedilen onaylı rol kümesiyle sınırlı kalır; belirteç değişikliği,
  eşleştirme onayının hiç vermediği bir cihaz rolünü genişletemez veya hedefleyemez.
- Eşleştirilmiş cihaz belirteci oturumlarında, çağıranda `operator.admin` da yoksa
  cihaz yönetimi kendi kapsamıyla sınırlıdır: admin olmayan çağıranlar yalnızca
  **kendi** cihaz girdileri için operatör belirtecini yönetebilir. Node ve diğer operatör dışı
  belirteç yönetimi, çağıranın kendi cihazı için bile yalnızca admin'e açıktır.
- `device.token.rotate` ve `device.token.revoke`, hedef operatör
  belirteci kapsam kümesini çağıranın geçerli oturum kapsamlarına göre de denetler. Admin olmayan çağıranlar,
  halihazırda sahip olduklarından daha geniş bir operatör belirtecini döndüremez veya iptal edemez.
- Auth hataları `error.details.code` ile birlikte kurtarma ipuçları içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilen istemciler, önbelleğe alınmış cihaz başına belirteçle sınırlı bir yeniden deneme yapabilir.
  - Bu yeniden deneme başarısız olursa, istemciler otomatik yeniden bağlanma döngülerini durdurmalı ve operatör eylemi yönergelerini göstermelidir.
- `AUTH_SCOPE_MISMATCH`, cihaz belirtecinin tanındığı ancak istenen rol/kapsamları
  kapsamadığı anlamına gelir. İstemciler bunu hatalı belirteç olarak sunmamalıdır;
  operatörden yeniden eşleştirme yapmasını veya daha dar/daha geniş kapsam sözleşmesini onaylamasını istemelidir.

## Cihaz kimliği + eşleştirme

- Node'lar, anahtar çifti parmak izinden türetilmiş kararlı bir cihaz kimliği (`device.id`) içermelidir.
- Gateway'ler cihaz + rol başına belirteç verir.
- local auto-approval etkin değilse yeni cihaz kimlikleri için eşleştirme onayları gerekir.
- Eşleştirme auto-approval, doğrudan local loopback connect işlemlerine odaklanır.
- OpenClaw ayrıca güvenilen shared-secret yardımcı akışları için dar bir backend/container-local self-connect yoluna sahiptir.
- Aynı ana makinedeki tailnet veya LAN connect işlemleri, eşleştirme için yine de remote olarak değerlendirilir ve
  onay gerektirir.
- WS istemcileri normalde `connect` sırasında `device` kimliği içerir (operatör +
  node). Cihazsız operatör için tek istisnalar açık güven yollarıdır:
  - localhost-only insecure HTTP uyumluluğu için `gateway.controlUi.allowInsecureAuth=true`.
  - başarılı `gateway.auth.mode: "trusted-proxy"` operatör Control UI auth.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ciddi güvenlik düşürmesi).
  - ayrılmış dahili yardımcı yol üzerinde direct-loopback `gateway-client` backend RPC'leri.
- Cihaz kimliğini atlamanın kapsam sonuçları vardır. Cihazsız bir operatör
  bağlantısına açık bir güven yolu üzerinden izin verildiğinde, OpenClaw yine de
  o yolun adlandırılmış bir kapsam koruma istisnası yoksa kendiliğinden beyan edilen kapsamları
  boş kümeye temizler. Kapsamla sınırlandırılmış yöntemler daha sonra
  `missing scope` ile başarısız olur.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`, Control UI için
  break-glass kapsam koruma yoludur. Rastgele
  özel backend veya CLI biçimli WebSocket istemcilerine kapsam vermez.
- Ayrılmış direct-loopback `gateway-client` backend yardımcı yolu, kapsamları
  yalnızca dahili local control-plane RPC'leri için korur; özel backend kimlikleri bu
  istisnayı almaz.
- Tüm bağlantılar, sunucunun sağladığı `connect.challenge` nonce değerini imzalamalıdır.

### Cihaz auth geçiş tanılamaları

Hâlâ challenge öncesi imzalama davranışını kullanan eski istemciler için `connect` artık
kararlı bir `error.details.reason` ile `error.details.code` altında
`DEVICE_AUTH_*` ayrıntı kodları döndürür.

Yaygın geçiş hataları:

| İleti                       | details.code                     | details.reason           | Anlam                                              |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | İstemci `device.nonce` değerini atladı (veya boş gönderdi). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | İstemci eski/yanlış nonce ile imzaladı.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | İmza yükü v2 yüküyle eşleşmiyor.                   |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | İmzalı zaman damgası izin verilen sapmanın dışında. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`, açık anahtar parmak iziyle eşleşmiyor. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Açık anahtar biçimi/kanonikleştirme başarısız oldu. |

Geçiş hedefi:

- Her zaman `connect.challenge` bekleyin.
- Sunucu nonce değerini içeren v2 yükünü imzalayın.
- Aynı nonce değerini `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza yükü, device/client/role/scopes/token/nonce alanlarına ek olarak
  `platform` ve `deviceFamily` değerlerini bağlayan `v3` değeridir.
- Eski `v2` imzaları uyumluluk için kabul edilmeye devam eder, ancak eşleştirilmiş cihaz
  meta veri sabitlemesi, yeniden bağlantıda komut politikasını kontrol etmeye devam eder.

## TLS + sabitleme

- WS bağlantıları için TLS desteklenir.
- İstemciler isteğe bağlı olarak gateway sertifika parmak izini sabitleyebilir (`gateway.tls`
  yapılandırması ile `gateway.remote.tlsFingerprint` veya CLI `--tls-fingerprint` bölümüne bakın).

## Kapsam

Bu protokol **tam gateway API'sini** açığa çıkarır (durum, kanallar, modeller, sohbet,
agent, oturumlar, node'lar, onaylar vb.). Tam yüzey,
`packages/gateway-protocol/src/schema.ts` içindeki TypeBox şemaları tarafından tanımlanır.

## İlgili

- [Bridge protokolü](/tr/gateway/bridge-protocol)
- [Gateway runbook](/tr/gateway)
