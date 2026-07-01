---
read_when:
    - Gateway WS istemcilerini uygulama veya güncelleme
    - Protokol uyuşmazlıklarını veya bağlantı hatalarını ayıklama
    - Protokol şemasını/modellerini yeniden oluşturma
summary: 'Gateway WebSocket protokolü: el sıkışma, çerçeveler, sürümleme'
title: Gateway protokolü
x-i18n:
    generated_at: "2026-07-01T08:24:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fbfc5db0169f7ac2eacdb882d2afe08c80d5b8d669b6a1cfb2ffd0edbf71d16
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protokolü, OpenClaw için **tek kontrol düzlemi + düğüm aktarımıdır**.
Tüm istemciler (CLI, web kullanıcı arayüzü, macOS uygulaması, iOS/Android düğümleri,
başsız düğümler) WebSocket üzerinden bağlanır ve el sıkışma sırasında
**rollerini** + **kapsamlarını** bildirir.

## Aktarım

- WebSocket, JSON yükleri içeren metin çerçeveleri.
- İlk çerçeve **mutlaka** bir `connect` isteği olmalıdır.
- Bağlantı öncesi çerçeveler 64 KiB ile sınırlıdır. Başarılı bir el sıkışmadan sonra istemciler
  `hello-ok.policy.maxPayload` ve
  `hello-ok.policy.maxBufferedBytes` sınırlarına uymalıdır. Tanılama etkinken,
  aşırı büyük gelen çerçeveler ve yavaş giden arabellekler, Gateway etkilenen
  çerçeveyi kapatmadan veya düşürmeden önce `payload.large` olayları yayar.
  Bu olaylar boyutları, sınırları, yüzeyleri ve güvenli neden kodlarını tutar.
  Mesaj gövdesini, ek içeriklerini, ham çerçeve gövdesini, tokenları, çerezleri
  veya gizli değerleri tutmazlar.

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

Gateway başlangıç yan bileşenlerini hâlâ tamamlıyorken, `connect` isteği
`details.reason` değeri `"startup-sidecars"` olarak ayarlanmış ve `retryAfterMs`
içeren, yeniden denenebilir bir `UNAVAILABLE` hatası döndürebilir. İstemciler
bu yanıtı nihai bir el sıkışma hatası olarak göstermenin yerine, genel bağlantı
bütçeleri içinde yeniden denemelidir.

`server`, `features`, `snapshot` ve `policy` şema tarafından zorunlu tutulur
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` da zorunludur ve
uzlaşılan rolü/kapsamları bildirir. `pluginSurfaceUrls` isteğe bağlıdır ve
`canvas` gibi Plugin yüzey adlarını kapsamlandırılmış barındırılan URL'lere eşler.

Kapsamlandırılmış Plugin yüzey URL'lerinin süresi dolabilir. Düğümler
`{ "surface": "canvas" }` ile `node.pluginSurface.refresh` çağırarak
`pluginSurfaceUrls` içinde taze bir giriş alabilir. Deneysel Canvas Plugin
refaktörü, kullanımdan kaldırılmış `canvasHostUrl`, `canvasCapability` veya
`node.canvas.capability.refresh` uyumluluk yolunu desteklemez; mevcut yerel
istemciler ve Gateway'ler Plugin yüzeylerini kullanmalıdır.

Cihaz tokenı verilmediğinde, `hello-ok.auth` uzlaşılan izinleri token alanları
olmadan bildirir:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilir aynı süreç arka uç istemcileri (`client.id: "gateway-client"`,
`client.mode: "backend"`), paylaşılan Gateway tokenı/parolası ile kimlik
doğruladıklarında doğrudan loopback bağlantılarında `device` alanını atlayabilir.
Bu yol dahili kontrol düzlemi RPC'leri için ayrılmıştır ve eskimiş CLI/cihaz
eşleştirme temellerinin alt ajan oturum güncellemeleri gibi yerel arka uç
işlerini engellemesini önler. Uzak istemciler, tarayıcı kökenli istemciler,
düğüm istemcileri ve açık cihaz-tokenı/cihaz-kimliği istemcileri normal
eşleştirme ve kapsam yükseltme denetimlerini kullanmaya devam eder.

Cihaz tokenı verildiğinde, `hello-ok` ayrıca şunu içerir:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Yerleşik QR/kurulum kodu önyüklemesi taze bir mobil devretme yoludur. Başarılı
bir temel kurulum kodu bağlantısı, birincil düğüm tokenı ve bir sınırlı
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

Operatör devretmesi özellikle sınırlandırılmıştır; böylece QR ile ilk katılım,
`operator.admin` veya `operator.pairing` vermeden mobil operatör döngüsünü
başlatabilir. Yerel istemcinin önyüklemeden sonra ihtiyaç duyduğu Talk
yapılandırmasını okuyabilmesi için `operator.talk.secrets` içerir. Daha geniş
yönetici ve eşleştirme kapsamları ayrı bir onaylı operatör eşleştirmesi veya
token akışı gerektirir. İstemciler `hello-ok.auth.deviceTokens` değerini yalnızca
bağlantı `wss://` veya loopback/yerel eşleştirme gibi güvenilir aktarım üzerinde
önyükleme kimlik doğrulaması kullandığında kalıcı hale getirmelidir.

### Düğüm örneği

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

Yan etkiye sahip yöntemler **idempotency anahtarları** gerektirir (şemaya bakın).

## Roller + kapsamlar

Tam operatör kapsam modeli, onay zamanı denetimleri ve paylaşılan gizli anahtar
semantiği için bkz. [Operatör kapsamları](/tr/gateway/operator-scopes).

### Roller

- `operator` = kontrol düzlemi istemcisi (CLI/kullanıcı arayüzü/otomasyon).
- `node` = yetenek ana makinesi (kamera/ekran/canvas/system.run).

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
Gizli değerler dahil edildiğinde, istemciler etkin Talk sağlayıcısı kimlik
bilgisini `talk.resolved.config.apiKey` alanından okumalıdır; `talk.providers.<id>.apiKey`
kaynak biçimini korur ve bir SecretRef nesnesi ya da maskelenmiş bir dize olabilir.

Plugin tarafından kaydedilen Gateway RPC yöntemleri kendi operatör kapsamlarını
isteyebilir, ancak ayrılmış çekirdek yönetici önekleri (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) her zaman `operator.admin` olarak çözümlenir.

Yöntem kapsamı yalnızca ilk kapıdır. `chat.send` üzerinden ulaşılan bazı eğik
çizgi komutları bunun üzerine daha sıkı komut düzeyi denetimler uygular.
Örneğin, kalıcı `/config set` ve `/config unset` yazmaları `operator.admin`
gerektirir.

`node.pair.approve`, temel yöntem kapsamının üzerine ek bir onay zamanı kapsam
denetimine de sahiptir:

- komutsuz istekler: `operator.pairing`
- exec olmayan düğüm komutları içeren istekler: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which` içeren istekler:
  `operator.pairing` + `operator.admin`

### Yetenekler/komutlar/izinler (düğüm)

Düğümler bağlantı sırasında yetenek iddialarını bildirir:

- `caps`: `camera`, `canvas`, `screen`, `location`, `voice` ve `talk` gibi
  üst düzey yetenek kategorileri.
- `commands`: çağırma için komut izin listesi.
- `permissions`: ayrıntılı anahtarlar (örn. `screen.record`, `camera.capture`).

Gateway bunları **iddia** olarak ele alır ve sunucu tarafı izin listelerini uygular.

## Varlık

- `system-presence`, cihaz kimliğine göre anahtarlanmış girişler döndürür.
- Varlık girişleri `deviceId`, `roles` ve `scopes` içerir; böylece kullanıcı arayüzleri,
  cihaz hem **operator** hem de **node** olarak bağlandığında bile cihaz başına
  tek bir satır gösterebilir.
- `node.list` isteğe bağlı `lastSeenAtMs` ve `lastSeenReason` alanlarını içerir.
  Bağlı düğümler mevcut bağlantı zamanlarını `connect` nedeniyle `lastSeenAtMs`
  olarak bildirir; eşleştirilmiş düğümler, güvenilir bir düğüm olayı eşleştirme
  meta verilerini güncellediğinde kalıcı arka plan varlığı da bildirebilir.

### Düğüm arka plan canlı olayı

Düğümler, eşleştirilmiş bir düğümün arka plan uyanışı sırasında bağlı olarak
işaretlenmeden canlı olduğunu kaydetmek için `event: "node.presence.alive"` ile
`node.event` çağırabilir.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` kapalı bir enum'dur: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` veya `connect`. Bilinmeyen tetikleyici dizeleri
kalıcılıktan önce Gateway tarafından `background` olarak normalleştirilir.
Olay yalnızca kimliği doğrulanmış düğüm cihaz oturumları için kalıcıdır;
cihazsız veya eşleştirilmemiş oturumlar `handled: false` döndürür.

Başarılı Gateway'ler yapılandırılmış bir sonuç döndürür:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Daha eski Gateway'ler `node.event` için hâlâ `{ "ok": true }` döndürebilir;
istemciler bunu kalıcı varlık saklaması olarak değil, onaylanmış bir RPC olarak
ele almalıdır.

## Yayın olayı kapsamlandırması

Sunucunun ittiği WebSocket yayın olayları kapsam kapılıdır; böylece eşleştirme
kapsamlı veya yalnızca düğüm oturumları oturum içeriğini pasif olarak almaz.

- **Sohbet, ajan ve araç sonucu çerçeveleri** (akışla gönderilen `agent`
  olayları ve araç çağrısı sonuçları dahil) en az `operator.read` gerektirir.
  `operator.read` olmayan oturumlar bu çerçeveleri tamamen atlar.
- **Plugin tanımlı `plugin.*` yayınları**, Plugin'in bunları nasıl kaydettiğine
  bağlı olarak `operator.write` veya `operator.admin` ile kapılanır.
- **Durum ve aktarım olayları** (`heartbeat`, `presence`, `tick`,
  bağlantı/bağlantı kesme yaşam döngüsü vb.) kısıtlanmamış kalır; böylece
  aktarım sağlığı her kimliği doğrulanmış oturum tarafından gözlemlenebilir.
- **Bilinmeyen yayın olayı aileleri**, kayıtlı bir işleyici bunları açıkça
  gevşetmediği sürece varsayılan olarak kapsam kapılıdır (kapalı başarısız olur).

Her istemci bağlantısı kendi istemci başına sıra numarasını tutar; böylece
farklı istemciler olay akışının farklı kapsam filtreli alt kümelerini görse bile
yayınlar o soket üzerinde monoton sıralamayı korur.

## Yaygın RPC yöntem aileleri

Herkese açık WS yüzeyi yukarıdaki el sıkışma/kimlik doğrulama örneklerinden
daha geniştir. Bu oluşturulmuş bir döküm değildir — `hello-ok.features.methods`,
`src/gateway/server-methods-list.ts` ile yüklü Plugin/kanal yöntem dışa
aktarımlarından oluşturulmuş tutucu bir keşif listesidir. Bunu
`src/gateway/server-methods/*.ts` için tam bir numaralandırma olarak değil,
özellik keşfi olarak değerlendirin.

  <AccordionGroup>
  <Accordion title="Sistem ve kimlik">
    - `health`, önbelleğe alınmış veya yeni yoklanmış gateway sağlık anlık görüntüsünü döndürür.
    - `diagnostics.stability`, yakın tarihli sınırlandırılmış tanılama kararlılığı kaydedicisini döndürür. Olay adları, sayılar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/plugin adları ve oturum kimlikleri gibi operasyonel meta verileri tutar. Sohbet metnini, webhook gövdelerini, araç çıktılarını, ham istek veya yanıt gövdelerini, tokenları, çerezleri veya gizli değerleri tutmaz. Operatör okuma kapsamı gerekir.
    - `status`, `/status` tarzı gateway özetini döndürür; hassas alanlar yalnızca yönetici kapsamlı operatör istemcileri için dahil edilir.
    - `gateway.identity.get`, relay ve eşleştirme akışları tarafından kullanılan gateway cihaz kimliğini döndürür.
    - `system-presence`, bağlı operatör/node cihazları için geçerli presence anlık görüntüsünü döndürür.
    - `system-event`, bir sistem olayı ekler ve presence bağlamını güncelleyebilir/yayınlayabilir.
    - `last-heartbeat`, en son kalıcı hale getirilmiş heartbeat olayını döndürür.
    - `set-heartbeats`, gateway üzerinde heartbeat işlemeyi açıp kapatır.

  </Accordion>

  <Accordion title="Modeller ve kullanım">
    - `models.list`, çalışma zamanında izin verilen model kataloğunu döndürür. Seçici boyutunda yapılandırılmış modeller için `{ "view": "configured" }` geçirin (`agents.defaults.models` önce, ardından `models.providers.*.models`), tam katalog için `{ "view": "all" }` geçirin.
    - `usage.status`, sağlayıcı kullanım pencerelerini/kalan kota özetlerini döndürür.
    - `usage.cost`, bir tarih aralığı için toplanmış maliyet kullanım özetlerini döndürür.
      Tek bir aracı için `agentId` geçirin veya yapılandırılmış aracıları toplamak için `agentScope: "all"` kullanın.
    - `doctor.memory.status`, aktif varsayılan aracı çalışma alanı için vektör bellek / önbelleğe alınmış embedding hazır olma durumunu döndürür. Yalnızca çağıran açıkça canlı embedding sağlayıcı ping'i istediğinde `{ "probe": true }` veya `{ "deep": true }` geçirin. Dreaming farkında istemciler, Dreaming depo istatistiklerini seçili bir aracı çalışma alanıyla sınırlandırmak için `{ "agentId": "agent-id" }` de geçirebilir; `agentId` atlanırsa varsayılan aracı fallback'i korunur ve yapılandırılmış Dreaming çalışma alanları toplanır.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` ve `doctor.memory.dedupeDreamDiary`, seçili aracı Dreaming görünümleri/eylemleri için isteğe bağlı `{ "agentId": "agent-id" }` parametrelerini kabul eder. `agentId` atlandığında, yapılandırılmış varsayılan aracı çalışma alanında çalışırlar.
    - `doctor.memory.remHarness`, uzaktan control-plane istemcileri için sınırlandırılmış, salt okunur bir REM harness önizlemesi döndürür. Çalışma alanı yollarını, bellek parçalarını, işlenmiş grounded markdown'u ve deep promotion adaylarını içerebilir; bu nedenle çağıranların `operator.read` yetkisine ihtiyacı vardır.
    - `sessions.usage`, oturum başına kullanım özetlerini döndürür. Tek bir aracı için `agentId` geçirin
      veya yapılandırılmış aracıları birlikte listelemek için `agentScope: "all"` kullanın.
    - `sessions.usage.timeseries`, tek bir oturum için zaman serisi kullanımını döndürür.
    - `sessions.usage.logs`, tek bir oturum için kullanım günlüğü girdilerini döndürür.

  </Accordion>

  <Accordion title="Kanallar ve oturum açma yardımcıları">
    - `channels.status`, yerleşik + paketlenmiş kanal/plugin durum özetlerini döndürür.
    - `channels.logout`, kanal oturum kapatmayı destekliyorsa belirli bir kanal/hesaptan oturumu kapatır.
    - `web.login.start`, geçerli QR özellikli web kanal sağlayıcısı için bir QR/web oturum açma akışı başlatır.
    - `web.login.wait`, bu QR/web oturum açma akışının tamamlanmasını bekler ve başarı durumunda kanalı başlatır.
    - `push.test`, kayıtlı bir iOS node'una test APNs push'u gönderir.
    - `voicewake.get`, saklanan uyandırma sözcüğü tetikleyicilerini döndürür.
    - `voicewake.set`, uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayınlar.

  </Accordion>

  <Accordion title="Mesajlaşma ve günlükler">
    - `send`, sohbet çalıştırıcısı dışındaki kanal/hesap/thread hedefli gönderimler için doğrudan giden teslimat RPC'sidir.
    - `logs.tail`, imleç/sınır ve maksimum bayt denetimleriyle yapılandırılmış gateway dosya günlüğü kuyruğunu döndürür.

  </Accordion>

  <Accordion title="Konuşma ve TTS">
    - `talk.catalog`, konuşma, akışlı transkripsiyon ve gerçek zamanlı ses için salt okunur Talk sağlayıcı kataloğunu döndürür. Sağlayıcı gizli bilgilerini döndürmeden veya global yapılandırmayı değiştirmeden sağlayıcı kimliklerini, etiketleri, yapılandırılmış durumu, sunulan model/ses kimliklerini, kanonik modları, aktarımları, beyin stratejilerini ve gerçek zamanlı ses/yetenek bayraklarını içerir.
    - `talk.config`, etkin Talk yapılandırma yükünü döndürür; `includeSecrets`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.
    - `talk.session.create`, `realtime/gateway-relay`, `transcription/gateway-relay` veya `stt-tts/managed-room` için Gateway sahipliğinde bir Talk oturumu oluşturur. `stt-tts/managed-room` için, `sessionKey` geçiren `operator.write` çağıranları, kapsamlı oturum anahtarı görünürlüğü için `spawnedBy` de geçirmelidir; kapsamsız `sessionKey` oluşturma ve `brain: "direct-tools"` `operator.admin` gerektirir.
    - `talk.session.join`, yönetilen oda oturum token'ını doğrular, gerektiğinde `session.ready` veya `session.replaced` olayları yayar ve düz metin token veya saklanan token karması olmadan oda/oturum meta verileri ile son Talk olaylarını döndürür.
    - `talk.session.appendAudio`, Gateway sahipliğindeki gerçek zamanlı relay ve transkripsiyon oturumlarına base64 PCM giriş sesi ekler.
    - `talk.session.startTurn`, `talk.session.endTurn` ve `talk.session.cancelTurn`, durum temizlenmeden önce eski turn reddiyle yönetilen oda turn yaşam döngüsünü yürütür.
    - `talk.session.cancelOutput`, öncelikle Gateway relay oturumlarında VAD kapılı araya girme için asistan ses çıkışını durdurur.
    - `talk.session.submitToolResult`, Gateway sahipliğindeki gerçek zamanlı relay oturumu tarafından yayılan bir sağlayıcı araç çağrısını tamamlar. Nihai bir sonuç takip edecekse ara araç çıktısı için `options: { willContinue: true }` geçirin veya araç sonucu başka bir gerçek zamanlı asistan yanıtı başlatmadan sağlayıcı çağrısını karşılamalıysa `options: { suppressResponse: true }` geçirin.
    - `talk.session.steer`, aktif çalıştırma ses denetimini Gateway sahipliğindeki aracı destekli Talk oturumuna gönderir. `{ sessionId, text, mode? }` kabul eder; burada `mode` `status`, `steer`, `cancel` veya `followup` olur; atlanan mod konuşulan metinden sınıflandırılır.
    - `talk.session.close`, Gateway sahipliğindeki relay, transkripsiyon veya yönetilen oda oturumunu kapatır ve terminal Talk olayları yayar.
    - `talk.mode`, WebChat/Control UI istemcileri için geçerli Talk mod durumunu ayarlar/yayınlar.
    - `talk.client.create`, Gateway yapılandırma, kimlik bilgileri, talimatlar ve araç politikasına sahipken `webrtc` veya `provider-websocket` kullanarak istemci sahipliğinde gerçek zamanlı sağlayıcı oturumu oluşturur.
    - `talk.client.toolCall`, istemci sahipliğindeki gerçek zamanlı aktarımların sağlayıcı araç çağrılarını Gateway politikasına iletmesine izin verir. İlk desteklenen araç `openclaw_agent_consult` aracıdır; istemciler bir çalıştırma kimliği alır ve sağlayıcıya özel araç sonucunu göndermeden önce normal sohbet yaşam döngüsü olaylarını bekler.
    - `talk.client.steer`, istemci sahipliğindeki gerçek zamanlı aktarımlar için aktif çalıştırma ses denetimi gönderir. Gateway, `sessionKey` üzerinden aktif gömülü çalıştırmayı çözer ve yönlendirmeyi sessizce düşürmek yerine yapılandırılmış bir kabul edildi/reddedildi sonucu döndürür.
    - `talk.event`, gerçek zamanlı, transkripsiyon, STT/TTS, yönetilen oda, telefon ve toplantı adaptörleri için tek Talk olay kanalıdır.
    - `talk.speak`, aktif Talk konuşma sağlayıcısı üzerinden konuşma sentezler.
    - `tts.status`, TTS etkin durumunu, aktif sağlayıcıyı, fallback sağlayıcıları ve sağlayıcı yapılandırma durumunu döndürür.
    - `tts.providers`, görünür TTS sağlayıcı envanterini döndürür.
    - `tts.enable` ve `tts.disable`, TTS tercih durumunu açıp kapatır.
    - `tts.setProvider`, tercih edilen TTS sağlayıcısını günceller.
    - `tts.convert`, tek seferlik metinden konuşmaya dönüştürme çalıştırır.

  </Accordion>

  <Accordion title="Gizli bilgiler, yapılandırma, güncelleme ve sihirbaz">
    - `secrets.reload`, aktif SecretRefs'i yeniden çözer ve çalışma zamanı gizli bilgi durumunu yalnızca tam başarı durumunda değiştirir.
    - `secrets.resolve`, belirli bir komut/hedef kümesi için komut hedefli gizli bilgi atamalarını çözer.
    - `config.get`, geçerli yapılandırma anlık görüntüsünü ve karmasını döndürür.
    - `config.set`, doğrulanmış bir yapılandırma yükü yazar.
    - `config.patch`, kısmi bir yapılandırma güncellemesini birleştirir. Yıkıcı dizi
      değişimi, etkilenen yolun `replacePaths` içinde olmasını gerektirir; dizi girdileri
      altındaki iç içe diziler `agents.list[].skills` gibi `[]` yolları kullanır.
    - `config.apply`, tam yapılandırma yükünü doğrular + değiştirir.
    - `config.schema`, Control UI ve CLI araçları tarafından kullanılan canlı yapılandırma şema yükünü döndürür: şema, `uiHints`, sürüm ve üretim meta verileri; çalışma zamanı yükleyebildiğinde plugin + kanal şema meta verileri dahil. Şema, eşleşen alan dokümantasyonu bulunduğunda iç içe nesne, wildcard, dizi öğesi ve `anyOf` / `oneOf` / `allOf` bileşim dalları dahil olmak üzere UI tarafından kullanılan aynı etiketlerden ve yardım metninden türetilmiş alan `title` / `description` meta verilerini içerir.
    - `config.schema.lookup`, tek bir yapılandırma yolu için yol kapsamlı bir arama yükü döndürür: normalleştirilmiş yol, sığ bir şema düğümü, eşleşen ipucu + `hintPath`, isteğe bağlı `reloadKind` ve UI/CLI ayrıntı gezintisi için doğrudan alt özetler. `reloadKind`, `restart`, `hot` veya `none` değerlerinden biridir ve istenen yol için Gateway yapılandırma yeniden yükleme planlayıcısını yansıtır. Arama şema düğümleri kullanıcıya dönük dokümanları ve yaygın doğrulama alanlarını korur (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, sayısal/dize/dizi/nesne sınırları ve `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi bayraklar). Alt özetler `key`, normalleştirilmiş `path`, `type`, `required`, `hasChildren`, isteğe bağlı `reloadKind` ve eşleşen `hint` / `hintPath` değerlerini gösterir.
    - `update.run`, gateway güncelleme akışını çalıştırır ve yalnızca güncellemenin kendisi başarılı olduğunda yeniden başlatma zamanlar; oturumu olan çağıranlar `continuationMessage` dahil edebilir, böylece başlangıç yeniden başlatma devam kuyruğu üzerinden bir takip aracı turn'ünü sürdürür. Control plane'den gelen paket yöneticisi güncellemeleri ve gözetimli git-checkout güncellemeleri, canlı Gateway içinde paket ağacını değiştirmek veya checkout/build çıktısını değiştirmek yerine ayrılmış bir yönetilen hizmet devri kullanır. Başlatılmış bir devir, `result.reason: "managed-service-handoff-started"` ve `handoff.status: "started"` ile `ok: true` döndürür; kullanılamayan veya başarısız devirler, `managed-service-handoff-unavailable` veya `managed-service-handoff-failed` ile `ok: false` ve manuel shell güncellemesi gerektiğinde `handoff.command` döndürür. Kullanılamayan bir devir, OpenClaw'ın systemd için `OPENCLAW_SYSTEMD_UNIT` gibi güvenli bir gözetmen sınırı veya kalıcı hizmet kimliği olmadığı anlamına gelir. Başlatılmış bir devir sırasında yeniden başlatma sentinel'i kısa süreliğine `stats.reason: "restart-health-pending"` bildirebilir; devam, CLI yeniden başlatılan Gateway'i doğrulayıp nihai `ok` sentinel'ini yazana kadar geciktirilir.
    - `update.status`, yeniden başlatma sonrası çalışan sürüm mevcut olduğunda onu da içerecek şekilde en son güncelleme yeniden başlatma sentinel'ini yeniler ve döndürür.
    - `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`, katılım sihirbazını WS RPC üzerinden sunar.

  </Accordion>

  <Accordion title="Aracı ve çalışma alanı yardımcıları">
    - `agents.list`, etkili model ve çalışma zamanı meta verileri dahil yapılandırılmış aracı girdilerini döndürür.
    - `agents.create`, `agents.update` ve `agents.delete`, aracı kayıtlarını ve çalışma alanı bağlantılarını yönetir.
    - `agents.files.list`, `agents.files.get` ve `agents.files.set`, bir aracı için sunulan önyükleme çalışma alanı dosyalarını yönetir.
    - `tasks.list`, `tasks.get` ve `tasks.cancel`, Gateway görev defterini SDK ve operatör istemcilerine sunar.
    - `artifacts.list`, `artifacts.get` ve `artifacts.download`, açık bir `sessionKey`, `runId` veya `taskId` kapsamı için transkriptten türetilmiş yapıt özetlerini ve indirmelerini sunar. Çalıştırma ve görev sorguları, sahip oturumu sunucu tarafında çözümler ve yalnızca eşleşen kökene sahip transkript medyasını döndürür; güvenli olmayan veya yerel URL kaynakları, sunucu tarafında getirmek yerine desteklenmeyen indirmeler döndürür.
    - `environments.list` ve `environments.status`, SDK istemcileri için salt okunur Gateway-yerel ve düğüm ortamı keşfini sunar.
    - `agent.identity.get`, bir aracı veya oturum için etkili asistan kimliğini döndürür.
    - `agent.wait`, bir çalıştırmanın bitmesini bekler ve varsa terminal anlık görüntüsünü döndürür.

  </Accordion>

  <Accordion title="Oturum denetimi">
    - `sessions.list`, bir aracı çalışma zamanı arka ucu yapılandırıldığında satır başına `agentRuntime` meta verileri dahil geçerli oturum dizinini döndürür.
    - `sessions.subscribe` ve `sessions.unsubscribe`, geçerli WS istemcisi için oturum değişikliği olay aboneliklerini açıp kapatır.
    - `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`, bir oturum için transkript/mesaj olay aboneliklerini açıp kapatır.
    - `sessions.preview`, belirli oturum anahtarları için sınırlı transkript önizlemeleri döndürür.
    - `sessions.describe`, tam bir oturum anahtarı için tek bir Gateway oturum satırı döndürür.
    - `sessions.resolve`, bir oturum hedefini çözümler veya kanonikleştirir.
    - `sessions.create`, yeni bir oturum girdisi oluşturur.
    - `sessions.send`, mevcut bir oturuma mesaj gönderir.
    - `sessions.steer`, etkin bir oturum için kes-ve-yönlendir varyantıdır.
    - `sessions.abort`, bir oturum için etkin işi iptal eder. Çağıran, `key` ile isteğe bağlı `runId` geçebilir veya Gateway'in bir oturuma çözümleyebildiği etkin çalıştırmalar için yalnızca `runId` geçebilir.
    - `sessions.patch`, oturum meta verilerini/geçersiz kılmalarını günceller ve çözümlenen kanonik modeli artı etkili `agentRuntime` değerini bildirir.
    - `sessions.reset`, `sessions.delete` ve `sessions.compact`, oturum bakımı gerçekleştirir.
    - `sessions.get`, depolanan tam oturum satırını döndürür.
    - Sohbet yürütmesi hâlâ `chat.history`, `chat.send`, `chat.abort` ve `chat.inject` kullanır. `chat.history`, UI istemcileri için görüntüleme-normalize edilmiştir: satır içi yönerge etiketleri görünür metinden çıkarılır, düz metin araç çağrısı XML yükleri (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil) ve sızan ASCII/tam genişlikli model kontrol belirteçleri çıkarılır, tam `NO_REPLY` / `no_reply` gibi saf sessiz belirteçli asistan satırları atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir.
    - `chat.message.get`, tek bir görünür transkript girdisi için eklemeli sınırlı tam mesaj okuyucusudur. İstemciler `sessionKey`, oturum seçimi aracı kapsamlı olduğunda isteğe bağlı `agentId`, ayrıca daha önce `chat.history` üzerinden sunulmuş bir transkript `messageId` geçer; Gateway, depolanan girdi hâlâ mevcut ve aşırı büyük değilse hafif geçmiş kesme sınırı olmadan aynı görüntüleme-normalize edilmiş projeksiyonu döndürür.
    - `chat.send`, otomatik kesme sınırından önce başlatılan model çağrılarında hızlı modu kullanmak, ardından daha sonraki yeniden deneme, fallback, araç sonucu veya devam çağrılarını hızlı mod olmadan başlatmak için tek turluk `fastMode: "auto"` kabul eder. Kesme sınırı varsayılan olarak 60 saniyedir ve model başına `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` ile yapılandırılabilir. Bir `chat.send` çağırıcısı, bu istek için kesme sınırını geçersiz kılmak üzere tek turluk `fastAutoOnSeconds` geçebilir.

  </Accordion>

  <Accordion title="Cihaz eşleme ve cihaz belirteçleri">
    - `device.pair.list`, bekleyen ve onaylanmış eşlenmiş cihazları döndürür.
    - `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`, cihaz eşleme kayıtlarını yönetir.
    - `device.token.rotate`, eşlenmiş bir cihaz belirtecini onaylanmış rolü ve çağıran kapsamı sınırları içinde döndürür.
    - `device.token.revoke`, eşlenmiş bir cihaz belirtecini onaylanmış rolü ve çağıran kapsamı sınırları içinde iptal eder.

  </Accordion>

  <Accordion title="Düğüm eşleme, çağırma ve bekleyen iş">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` ve `node.pair.verify`, düğüm eşlemeyi ve önyükleme doğrulamasını kapsar.
    - `node.list` ve `node.describe`, bilinen/bağlı düğüm durumunu döndürür.
    - `node.rename`, eşlenmiş bir düğüm etiketini günceller.
    - `node.invoke`, bir komutu bağlı bir düğüme iletir.
    - `node.invoke.result`, bir çağırma isteğinin sonucunu döndürür.
    - `node.event`, düğüm kaynaklı olayları gateway'e geri taşır.
    - `node.pending.pull` ve `node.pending.ack`, bağlı düğüm kuyruk API'leridir.
    - `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısı kesilmiş düğümler için dayanıklı bekleyen işi yönetir.

  </Accordion>

  <Accordion title="Onay aileleri">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve `exec.approval.resolve`, tek seferlik exec onay isteklerini ve bekleyen onay arama/yeniden oynatma işlemlerini kapsar.
    - `exec.approval.waitDecision`, bekleyen bir exec onayını bekler ve son kararı döndürür (veya zaman aşımında `null`).
    - `exec.approvals.get` ve `exec.approvals.set`, gateway exec onay ilkesi anlık görüntülerini yönetir.
    - `exec.approvals.node.get` ve `exec.approvals.node.set`, düğüm aktarma komutları üzerinden düğüm-yerel exec onay ilkesini yönetir.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` ve `plugin.approval.resolve`, Plugin tanımlı onay akışlarını kapsar.

  </Accordion>

  <Accordion title="Otomasyon, Skills ve araçlar">
    - Otomasyon: `wake`, anında veya bir sonraki Heartbeat'te uyanma metni enjeksiyonu zamanlar; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zamanlanmış işi yönetir.
    - `cron.run`, manuel çalıştırmalar için kuyruğa ekleme tarzı bir RPC olarak kalır. Tamamlanma semantiğine ihtiyaç duyan istemciler döndürülen `runId` değerini okumalı ve `cron.runs` yoklamalıdır.
    - `cron.runs`, istemcilerin aynı işin diğer geçmiş girdileriyle yarışmadan kuyruğa alınmış tek bir manuel çalıştırmayı izleyebilmesi için isteğe bağlı, boş olmayan bir `runId` filtresi kabul eder.
    - Skills ve araçlar: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Yaygın olay aileleri

- `chat`: `chat.inject` gibi UI sohbet güncellemeleri ve yalnızca transkript olan diğer sohbet
  olayları. Protokol v4'te delta yükleri `deltaText` taşır; `message` kümülatif
  asistan anlık görüntüsü olarak kalır. Önek olmayan değiştirmeler `replace=true`
  ayarlar ve `deltaText` değerini değiştirme metni olarak kullanır.
- `session.message`, `session.operation` ve `session.tool`: abone olunmuş bir
  oturum için transkript, devam eden oturum işlemi ve olay akışı güncellemeleri.
- `sessions.changed`: oturum dizini veya meta veriler değişti.
- `presence`: sistem varlık anlık görüntüsü güncellemeleri.
- `tick`: periyodik keepalive / canlılık olayı.
- `health`: gateway sağlık anlık görüntüsü güncellemesi.
- `heartbeat`: Heartbeat olay akışı güncellemesi.
- `cron`: Cron çalıştırma/iş değişikliği olayı.
- `shutdown`: gateway kapatma bildirimi.
- `node.pair.requested` / `node.pair.resolved`: düğüm eşleme yaşam döngüsü.
- `node.invoke.request`: düğüm çağırma isteği yayını.
- `device.pair.requested` / `device.pair.resolved`: eşlenmiş cihaz yaşam döngüsü.
- `voicewake.changed`: uyandırma sözcüğü tetikleyici yapılandırması değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onay
  yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin onay
  yaşam döngüsü.

### Düğüm yardımcı yöntemleri

- Düğümler, otomatik izin kontrolleri için geçerli Skills yürütülebilirleri
  listesini almak üzere `skills.bins` çağırabilir.

### Görev defteri RPC'leri

Operatör istemcileri, görev defteri RPC'leri üzerinden Gateway arka plan görev
kayıtlarını inceleyebilir ve iptal edebilir. Bu yöntemler ham çalışma zamanı
durumu değil, temizlenmiş görev özetleri döndürür.

- `tasks.list`, `operator.read` gerektirir.
  - Parametreler: isteğe bağlı `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` veya `"timed_out"`) veya bu durumların bir dizisi,
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
    çalışma zamanının iptali kabul edip etmediğini veya kaydedip kaydetmediğini
    bildirir.

`TaskSummary`; `id`, `status` ve `kind`, `runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, zaman damgaları, ilerleme, terminal özeti ve temizlenmiş hata metni gibi isteğe bağlı meta verileri içerir. `agentId`, görevi yürüten aracıyı tanımlar; `sessionKey` ve `ownerKey`, istekte bulunan ve denetim bağlamını korur.

### Operatör yardımcı yöntemleri

- Operatörler, bir agent için çalışma zamanı komut envanterini almak üzere `commands.list` (`operator.read`) çağırabilir.

- Paylaşılan gizli anahtarlı gateway kimlik doğrulaması, yapılandırılmış kimlik doğrulama moduna bağlı olarak `connect.params.auth.token` veya
  `connect.params.auth.password` kullanır.
- Tailscale Serve gibi kimlik taşıyan modlar
  (`gateway.auth.allowTailscale: true`) veya local loopback olmayan
  `gateway.auth.mode: "trusted-proxy"`, connect kimlik doğrulaması denetimini
  `connect.params.auth.*` yerine istek üstbilgilerinden karşılar.
- Özel giriş `gateway.auth.mode: "none"`, paylaşılan gizli anahtarlı connect kimlik doğrulamasını
  tamamen atlar; bu modu genel/güvenilmeyen girişlerde açmayın.
- Eşleştirmeden sonra Gateway, bağlantı
  rolü + kapsamlarıyla sınırlı bir **cihaz belirteci** verir. Bu belirteç
  `hello-ok.auth.deviceToken` içinde döndürülür ve istemci tarafından gelecekteki connect işlemleri için
  kalıcı olarak saklanmalıdır.
- İstemciler, başarılı herhangi bir connect işleminden sonra birincil `hello-ok.auth.deviceToken` değerini kalıcı olarak saklamalıdır.
- Bu **saklanan** cihaz belirteciyle yeniden bağlanmak, o belirteç için saklanan
  onaylı kapsam kümesini de yeniden kullanmalıdır. Bu, daha önce verilmiş
  okuma/yoklama/durum erişimini korur ve yeniden bağlantıların sessizce daha
  dar, örtük yalnızca yönetici kapsamına düşmesini önler.
- İstemci tarafı connect kimlik doğrulaması oluşturma (`selectConnectAuth`,
  `src/gateway/client.ts` içinde):
  - `auth.password` bağımsızdır ve ayarlandığında her zaman iletilir.
  - `auth.token` öncelik sırasına göre doldurulur: önce açık paylaşılan belirteç,
    sonra açık bir `deviceToken`, ardından saklanan cihaz başına belirteç
    (`deviceId` + `role` ile anahtarlanır).
  - `auth.bootstrapToken`, yalnızca yukarıdakilerden hiçbiri bir
    `auth.token` çözemediğinde gönderilir. Paylaşılan belirteç veya çözümlenen herhangi bir cihaz belirteci bunu bastırır.
  - Tek seferlik `AUTH_TOKEN_MISMATCH` yeniden denemesinde saklanan cihaz belirtecinin otomatik yükseltilmesi
    **yalnızca güvenilir uç noktalarla** sınırlıdır —
    loopback veya sabitlenmiş `tlsFingerprint` ile `wss://`. Sabitleme olmayan genel `wss://`
    uygun değildir.
- Yerleşik kurulum kodu bootstrap, güvenilir mobil devretme için birincil Node
  `hello-ok.auth.deviceToken` değerini ve
  `hello-ok.auth.deviceTokens` içinde sınırlandırılmış bir operatör belirteci döndürür. Operatör belirteci,
  yerel Talk yapılandırması okumaları için `operator.talk.secrets` içerir ve
  `operator.admin` ile `operator.pairing` değerlerini hariç tutar.
- Temel olmayan bir kurulum kodu bootstrap onay beklerken, `PAIRING_REQUIRED`
  ayrıntıları `recommendedNextStep: "wait_then_retry"`, `retryable: true`
  ve `pauseReconnect: false` içerir. İstemciler, istek onaylanana veya belirteç geçersiz hale gelene kadar
  aynı bootstrap belirteciyle yeniden bağlanmaya devam etmelidir.
- `hello-ok.auth.deviceTokens` değerini yalnızca connect işlemi
  `wss://` veya loopback/yerel eşleştirme gibi güvenilir bir aktarımda bootstrap kimlik doğrulaması kullandığında kalıcı olarak saklayın.
- Bir istemci **açık** bir `deviceToken` veya açık `scopes` sağlarsa,
  çağıranın istediği kapsam kümesi yetkili kalır; önbelleğe alınmış kapsamlar yalnızca
  istemci saklanan cihaz başına belirteci yeniden kullandığında yeniden kullanılır.
- Cihaz belirteçleri `device.token.rotate` ve
  `device.token.revoke` ile döndürülebilir/iptal edilebilir (`operator.pairing` kapsamı gerekir). Bir Node veya başka operatör olmayan rolü döndürmek ya da
  iptal etmek ayrıca `operator.admin` gerektirir.
- `device.token.rotate`, döndürme meta verilerini döndürür. Yedek
  taşıyıcı belirteci yalnızca aynı cihaz belirteciyle zaten kimliği doğrulanmış
  aynı cihaz çağrıları için yankılar; böylece yalnızca belirteç kullanan istemciler yeniden bağlanmadan önce
  yedeklerini kalıcı olarak saklayabilir. Paylaşılan/yönetici döndürmeleri taşıyıcı belirteci yankılamaz.
- Belirteç verme, döndürme ve iptal işlemleri, o cihazın eşleştirme girdisinde kaydedilen
  onaylı rol kümesiyle sınırlı kalır; belirteç mutasyonu,
  eşleştirme onayının hiç vermediği bir cihaz rolünü genişletemez veya hedefleyemez.
- Eşleştirilmiş cihaz belirteci oturumları için cihaz yönetimi, çağıranda
  `operator.admin` yoksa kendisiyle sınırlıdır: yönetici olmayan çağıranlar yalnızca
  **kendi** cihaz girdileri için operatör belirtecini yönetebilir. Node ve diğer operatör olmayan
  belirteç yönetimi, çağıranın kendi cihazı için bile yalnızca yöneticilere açıktır.
- `device.token.rotate` ve `device.token.revoke`, hedef operatör
  belirteci kapsam kümesini çağıranın geçerli oturum kapsamlarına göre de denetler. Yönetici olmayan çağıranlar,
  halihazırda sahip olduklarından daha geniş bir operatör belirtecini döndüremez veya iptal edemez.
- Kimlik doğrulama hataları `error.details.code` ve kurtarma ipuçları içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilir istemciler, önbelleğe alınmış cihaz başına belirteçle sınırlı bir yeniden deneme girişiminde bulunabilir.
  - Bu yeniden deneme başarısız olursa istemciler otomatik yeniden bağlanma döngülerini durdurmalı ve operatör eylem rehberliğini göstermelidir.
- `AUTH_SCOPE_MISMATCH`, cihaz belirtecinin tanındığı ancak istenen rol/kapsamları
  kapsamadığı anlamına gelir. İstemciler bunu bozuk bir belirteç olarak sunmamalı;
  operatörden yeniden eşleştirme yapmasını veya daha dar/daha geniş kapsam sözleşmesini onaylamasını istemelidir.

## Cihaz kimliği + eşleştirme

- Node'lar, anahtar çifti parmak izinden türetilmiş kararlı bir cihaz kimliği (`device.id`) içermelidir.
- Gateway'ler cihaz + rol başına belirteç verir.
- Yerel otomatik onay etkin değilse yeni cihaz kimlikleri için eşleştirme onayları gerekir.
- Eşleştirme otomatik onayı doğrudan local loopback connect işlemlerine odaklanır.
- OpenClaw ayrıca güvenilir paylaşılan gizli anahtarlı yardımcı akışlar için
  dar bir arka uç/kapsayıcı-yerel kendi kendine connect yoluna sahiptir.
- Aynı ana makine tailnet veya LAN connect işlemleri, eşleştirme için yine de uzak olarak değerlendirilir ve
  onay gerektirir.
- WS istemcileri normalde `connect` sırasında `device` kimliği içerir (operatör +
  Node). Cihazsız operatör istisnaları yalnızca açık güven yollarıdır:
  - localhost'a özel güvensiz HTTP uyumluluğu için `gateway.controlUi.allowInsecureAuth=true`.
  - başarılı `gateway.auth.mode: "trusted-proxy"` operatör Control UI kimlik doğrulaması.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (acil durum, ciddi güvenlik düşürmesi).
  - ayrılmış dahili yardımcı yolunda doğrudan-loopback `gateway-client` arka uç RPC'leri.
- Cihaz kimliğinin atlanmasının kapsam sonuçları vardır. Cihazsız operatör
  bağlantısına açık bir güven yolu üzerinden izin verildiğinde, OpenClaw yine de
  bu yolun adlandırılmış bir kapsam koruma istisnası yoksa kendi beyan edilen
  kapsamları boş kümeye temizler. Kapsam kapılı yöntemler daha sonra
  `missing scope` ile başarısız olur.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`, Control UI
  acil durum kapsam koruma yoludur. Rastgele
  özel arka uç veya CLI biçimli WebSocket istemcilerine kapsam vermez.
- Ayrılmış doğrudan-loopback `gateway-client` arka uç yardımcı yolu,
  kapsamları yalnızca dahili yerel denetim düzlemi RPC'leri için korur; özel arka uç kimlikleri
  bu istisnayı almaz.
- Tüm bağlantılar, sunucu tarafından sağlanan `connect.challenge` nonce değerini imzalamalıdır.

### Cihaz kimlik doğrulaması geçiş tanılamaları

Hala challenge öncesi imzalama davranışı kullanan eski istemciler için `connect` artık
`error.details.code` altında, kararlı bir `error.details.reason` ile `DEVICE_AUTH_*` ayrıntı kodları döndürür.

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
- Tercih edilen imza yükü `v3` değeridir; bu, cihaz/istemci/rol/kapsam/belirteç/nonce alanlarına ek olarak
  `platform` ve `deviceFamily` değerlerini de bağlar.
- Eski `v2` imzaları uyumluluk için kabul edilmeye devam eder, ancak eşleştirilmiş cihaz
  meta veri sabitlemesi yeniden bağlantıda komut politikasını denetlemeye devam eder.

## TLS + sabitleme

- TLS, WS bağlantıları için desteklenir.
- İstemciler isteğe bağlı olarak gateway sertifika parmak izini sabitleyebilir (`gateway.tls`
  yapılandırmasına ve `gateway.remote.tlsFingerprint` ya da CLI `--tls-fingerprint` değerine bakın).

## Kapsam

Bu protokol **tam gateway API'sini** açığa çıkarır (durum, kanallar, modeller, sohbet,
aracı, oturumlar, Node'lar, onaylar vb.). Kesin yüzey,
`packages/gateway-protocol/src/schema.ts` içindeki TypeBox şemalarıyla tanımlanır.

## İlgili

- [Bridge protokolü](/tr/gateway/bridge-protocol)
- [Gateway runbook](/tr/gateway)
