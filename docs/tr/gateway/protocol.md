---
read_when:
    - Gateway WS istemcilerini uygulama veya güncelleme
    - Protokol uyumsuzluklarında veya bağlantı hatalarında hata ayıklama
    - Protokol şeması/modelleri yeniden oluşturuluyor
summary: 'Gateway WebSocket protokolü: el sıkışma, çerçeveler, sürümleme'
title: Gateway protokolü
x-i18n:
    generated_at: "2026-06-28T00:37:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df37fcb4f6a52ef3f6044840a4c1fb1a59bf1d2b880b9f3752490c6eb8a2135f
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protokolü, OpenClaw için **tek kontrol düzlemi + düğüm aktarımıdır**.
Tüm istemciler (CLI, web arayüzü, macOS uygulaması, iOS/Android düğümleri,
başsız düğümler) WebSocket üzerinden bağlanır ve el sıkışma sırasında
**rollerini** + **kapsamlarını** bildirir.

## Aktarım

- WebSocket, JSON yükleri içeren metin çerçeveleri.
- İlk çerçeve **mutlaka** bir `connect` isteği olmalıdır.
- Bağlantı öncesi çerçeveler 64 KiB ile sınırlıdır. Başarılı bir el sıkışmadan sonra istemciler
  `hello-ok.policy.maxPayload` ve
  `hello-ok.policy.maxBufferedBytes` sınırlarına uymalıdır. Tanılama etkinleştirildiğinde,
  aşırı büyük gelen çerçeveler ve yavaş giden arabellekler, gateway etkilenen çerçeveyi
  kapatmadan veya düşürmeden önce `payload.large` olayları yayar. Bu olaylar
  boyutları, sınırları, yüzeyleri ve güvenli neden kodlarını tutar. Mesaj
  gövdesini, ek içeriklerini, ham çerçeve gövdesini, tokenleri, çerezleri veya gizli değerleri tutmaz.

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

Gateway başlangıç yan bileşenlerini tamamlamaya devam ederken, `connect` isteği
`details.reason` değeri `"startup-sidecars"` olarak ayarlanmış ve `retryAfterMs` içeren
yeniden denenebilir bir `UNAVAILABLE` hatası döndürebilir. İstemciler bu yanıtı,
sonlandırıcı bir el sıkışma hatası olarak göstermek yerine genel bağlantı bütçeleri içinde
yeniden denemelidir.

`server`, `features`, `snapshot` ve `policy` şema tarafından zorunlu tutulur
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` da zorunludur ve
anlaşılmış rol/kapsamları bildirir. `pluginSurfaceUrls` isteğe bağlıdır ve `canvas` gibi
plugin yüzeyi adlarını kapsamlı barındırılan URL'lerle eşler.

Kapsamlı plugin yüzeyi URL'lerinin süresi dolabilir. Düğümler, `pluginSurfaceUrls` içinde
taze bir giriş almak için `{ "surface": "canvas" }` ile
`node.pluginSurface.refresh` çağırabilir. Deneysel Canvas plugin yeniden düzenlemesi,
kullanımdan kaldırılmış `canvasHostUrl`, `canvasCapability` veya
`node.canvas.capability.refresh` uyumluluk yolunu desteklemez; güncel yerel istemciler ve
gateway'ler plugin yüzeylerini kullanmalıdır.

Herhangi bir cihaz tokeni verilmediğinde, `hello-ok.auth` token alanları olmadan
anlaşılmış izinleri bildirir:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilen aynı süreç arka uç istemcileri (`client.id: "gateway-client"`,
`client.mode: "backend"`), paylaşılan gateway tokeni/parolasıyla kimlik doğruladıklarında
doğrudan local loopback bağlantılarında `device` alanını atlayabilir. Bu yol dahili
kontrol düzlemi RPC'leri için ayrılmıştır ve eski CLI/cihaz eşleme temel değerlerinin,
alt ajan oturum güncellemeleri gibi yerel arka uç çalışmalarını engellemesini önler. Uzak istemciler,
tarayıcı kökenli istemciler, düğüm istemcileri ve açık cihaz-tokeni/cihaz-kimliği
istemcileri yine normal eşleme ve kapsam yükseltme denetimlerini kullanır.

Bir cihaz tokeni verildiğinde, `hello-ok` ayrıca şunları içerir:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Yerleşik QR/kurulum kodu bootstrap'i taze bir mobil devir yoludur. Başarılı bir
temel kurulum kodu bağlantısı, birincil düğüm tokeni ve bir sınırlı operatör tokeni döndürür:

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

Operatör devri, QR ile başlangıç kurulumunun mobil operatör döngüsünü
`operator.admin` veya `operator.pairing` vermeden başlatabilmesi için özellikle sınırlıdır.
Yerel istemcinin bootstrap sonrasında ihtiyaç duyduğu Talk yapılandırmasını okuyabilmesi için
`operator.talk.secrets` içerir. Daha geniş yönetici ve eşleme kapsamları,
ayrı bir onaylanmış operatör eşlemesi veya token akışı gerektirir. İstemciler
`hello-ok.auth.deviceTokens` değerini yalnızca bağlantı, `wss://` veya
loopback/yerel eşleme gibi güvenilen aktarım üzerinde bootstrap kimlik doğrulaması kullandığında
kalıcı hale getirmelidir.

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

Yan etki oluşturan yöntemler **idempotency keys** gerektirir (şemaya bakın).

## Roller + kapsamlar

Tam operatör kapsam modeli, onay anı denetimleri ve paylaşılan gizli anahtar
semantiği için bkz. [Operatör kapsamları](/tr/gateway/operator-scopes).

### Roller

- `operator` = kontrol düzlemi istemcisi (CLI/UI/otomasyon).
- `node` = yetenek barındırıcısı (camera/screen/canvas/system.run).

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

Plugin tarafından kaydedilen gateway RPC yöntemleri kendi operatör kapsamlarını isteyebilir, ancak
ayrılmış çekirdek yönetici önekleri (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) her zaman `operator.admin` olarak çözülür.

Yöntem kapsamı yalnızca ilk kapıdır. `chat.send` üzerinden ulaşılan bazı eğik çizgi komutları
bunun üzerine daha sıkı komut düzeyi denetimler uygular. Örneğin, kalıcı
`/config set` ve `/config unset` yazmaları `operator.admin` gerektirir.

`node.pair.approve`, temel yöntem kapsamına ek olarak onay anında fazladan bir kapsam denetimine de sahiptir:

- komutsuz istekler: `operator.pairing`
- exec olmayan düğüm komutları içeren istekler: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which` içeren istekler:
  `operator.pairing` + `operator.admin`

### Yetenekler/komutlar/izinler (düğüm)

Düğümler bağlantı sırasında yetenek iddialarını bildirir:

- `caps`: `camera`, `canvas`, `screen`,
  `location`, `voice` ve `talk` gibi üst düzey yetenek kategorileri.
- `commands`: invoke için komut izin listesi.
- `permissions`: ayrıntılı aç/kapat değerleri (örn. `screen.record`, `camera.capture`).

Gateway bunları **iddia** olarak ele alır ve sunucu tarafı izin listelerini uygular.

## Varlık

- `system-presence`, cihaz kimliğine göre anahtarlanmış girişler döndürür.
- Varlık girişleri `deviceId`, `roles` ve `scopes` içerir; böylece arayüzler, cihaz hem **operator** hem de **node** olarak bağlansa bile cihaz başına tek satır gösterebilir.
- `node.list`, isteğe bağlı `lastSeenAtMs` ve `lastSeenReason` alanlarını içerir. Bağlı düğümler
  mevcut bağlantı zamanlarını `connect` nedeniyle `lastSeenAtMs` olarak bildirir; eşlenmiş düğümler, güvenilen bir düğüm olayı eşleme meta verilerini güncellediğinde
  kalıcı arka plan varlığı da bildirebilir.

### Düğüm arka plan canlı olayı

Düğümler, eşlenmiş bir düğümün arka plan uyanışı sırasında bağlı olarak işaretlenmeden
canlı olduğunu kaydetmek için `event: "node.presence.alive"` ile `node.event` çağırabilir.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` kapalı bir enum'dur: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` veya `connect`. Bilinmeyen trigger dizeleri,
kalıcı hale getirilmeden önce gateway tarafından `background` olarak normalleştirilir. Olay yalnızca kimliği doğrulanmış düğüm
cihaz oturumları için kalıcıdır; cihazsız veya eşlenmemiş oturumlar `handled: false` döndürür.

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
kalıcı varlık kaydı olarak değil, onaylanmış bir RPC olarak ele almalıdır.

## Yayın olayı kapsamlandırması

Sunucu tarafından gönderilen WebSocket yayın olayları kapsam kapılıdır; böylece eşleme kapsamlı veya yalnızca düğüm oturumları oturum içeriğini pasif olarak almaz.

- **Sohbet, ajan ve araç sonucu çerçeveleri** (akışlı `agent` olayları ve araç çağrısı sonuçları dahil) en az `operator.read` gerektirir. `operator.read` olmayan oturumlar bu çerçeveleri tamamen atlar.
- **Plugin tanımlı `plugin.*` yayınları**, plugin'in bunları nasıl kaydettiğine bağlı olarak `operator.write` veya `operator.admin` ile kapılanır.
- **Durum ve aktarım olayları** (`heartbeat`, `presence`, `tick`, bağlanma/bağlantı kesme yaşam döngüsü vb.) sınırsız kalır; böylece aktarım sağlığı her kimliği doğrulanmış oturum tarafından gözlemlenebilir.
- **Bilinmeyen yayın olayı aileleri**, kayıtlı bir işleyici bunları açıkça gevşetmedikçe varsayılan olarak kapsam kapılıdır (kapalı hata).

Her istemci bağlantısı kendi istemci başına sıra numarasını tutar; böylece farklı istemciler olay akışının farklı kapsam filtreli alt kümelerini görse bile yayınlar o sokette monoton sıralamayı korur.

## Yaygın RPC yöntem aileleri

Herkese açık WS yüzeyi, yukarıdaki el sıkışma/kimlik doğrulama örneklerinden daha geniştir. Bu
üretilmiş bir döküm değildir; `hello-ok.features.methods`, `src/gateway/server-methods-list.ts` ile yüklenmiş
plugin/kanal yöntem dışa aktarımlarından oluşturulan temkinli bir keşif listesidir. Bunu, `src/gateway/server-methods/*.ts` için tam bir
numaralandırma olarak değil, özellik keşfi olarak ele alın.

  <AccordionGroup>
  <Accordion title="Sistem ve kimlik">
    - `health`, önbelleğe alınmış veya yeni yoklanmış Gateway sağlık anlık görüntüsünü döndürür.
    - `diagnostics.stability`, son sınırlı tanılama kararlılığı kaydedicisini döndürür. Olay adları, sayılar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/Plugin adları ve oturum kimlikleri gibi operasyonel meta verileri tutar. Sohbet metnini, webhook gövdelerini, araç çıktılarını, ham istek veya yanıt gövdelerini, tokenları, çerezleri ya da gizli değerleri tutmaz. Operatör okuma kapsamı gerekir.
    - `status`, `/status` tarzı Gateway özetini döndürür; hassas alanlar yalnızca yönetici kapsamlı operatör istemcileri için dahil edilir.
    - `gateway.identity.get`, aktarma ve eşleştirme akışları tarafından kullanılan Gateway cihaz kimliğini döndürür.
    - `system-presence`, bağlı operatör/düğüm cihazları için geçerli varlık anlık görüntüsünü döndürür.
    - `system-event`, bir sistem olayı ekler ve varlık bağlamını güncelleyebilir/yayınlayabilir.
    - `last-heartbeat`, kalıcı hale getirilen en son Heartbeat olayını döndürür.
    - `set-heartbeats`, Gateway üzerinde Heartbeat işlemeyi açıp kapatır.

  </Accordion>

  <Accordion title="Modeller ve kullanım">
    - `models.list`, çalışma zamanında izin verilen model kataloğunu döndürür. Seçici boyutundaki yapılandırılmış modeller için `{ "view": "configured" }` (`agents.defaults.models` önce, ardından `models.providers.*.models`) ya da tam katalog için `{ "view": "all" }` geçirin.
    - `usage.status`, sağlayıcı kullanım pencerelerini/kalan kota özetlerini döndürür.
    - `usage.cost`, bir tarih aralığı için toplulaştırılmış maliyet kullanımı özetlerini döndürür.
      Tek bir ajan için `agentId` ya da yapılandırılmış ajanları toplulaştırmak için `agentScope: "all"` geçirin.
    - `doctor.memory.status`, etkin varsayılan ajan çalışma alanı için vektör belleği / önbelleğe alınmış embedding hazır olma durumunu döndürür. Yalnızca çağıran açıkça canlı bir embedding sağlayıcısı ping'i istediğinde `{ "probe": true }` veya `{ "deep": true }` geçirin. Dreaming farkındalığı olan istemciler, Dreaming depolama istatistiklerini seçili bir ajan çalışma alanıyla sınırlamak için ayrıca `{ "agentId": "agent-id" }` geçirebilir; `agentId` atlandığında varsayılan ajan geri dönüşü korunur ve yapılandırılmış Dreaming çalışma alanları toplulaştırılır.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` ve `doctor.memory.dedupeDreamDiary`, seçili ajan Dreaming görünümleri/eylemleri için isteğe bağlı `{ "agentId": "agent-id" }` parametrelerini kabul eder. `agentId` atlandığında, yapılandırılmış varsayılan ajan çalışma alanı üzerinde çalışırlar.
    - `doctor.memory.remHarness`, uzaktan kontrol düzlemi istemcileri için sınırlı, salt okunur bir REM harness önizlemesi döndürür. Çalışma alanı yollarını, bellek parçacıklarını, işlenmiş grounded markdown'ı ve derin yükseltme adaylarını içerebilir; bu nedenle çağıranların `operator.read` iznine ihtiyacı vardır.
    - `sessions.usage`, oturum başına kullanım özetlerini döndürür. Tek bir
      ajan için `agentId` ya da yapılandırılmış ajanları birlikte listelemek için `agentScope: "all"` geçirin.
    - `sessions.usage.timeseries`, tek bir oturum için zaman serisi kullanımını döndürür.
    - `sessions.usage.logs`, tek bir oturum için kullanım günlüğü girdilerini döndürür.

  </Accordion>

  <Accordion title="Kanallar ve oturum açma yardımcıları">
    - `channels.status`, yerleşik + paketlenmiş kanal/Plugin durum özetlerini döndürür.
    - `channels.logout`, kanalın oturum kapatmayı desteklediği belirli bir kanaldan/hesaptan çıkış yapar.
    - `web.login.start`, geçerli QR özellikli web kanal sağlayıcısı için bir QR/web oturum açma akışı başlatır.
    - `web.login.wait`, bu QR/web oturum açma akışının tamamlanmasını bekler ve başarılı olursa kanalı başlatır.
    - `push.test`, kayıtlı bir iOS düğümüne test APNs push'u gönderir.
    - `voicewake.get`, saklanan uyandırma sözcüğü tetikleyicilerini döndürür.
    - `voicewake.set`, uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayınlar.

  </Accordion>

  <Accordion title="Mesajlaşma ve günlükler">
    - `send`, sohbet çalıştırıcısı dışındaki kanal/hesap/konu hedefli gönderimler için doğrudan giden teslimat RPC'sidir.
    - `logs.tail`, imleç/sınır ve maksimum bayt denetimleriyle yapılandırılmış Gateway dosya günlüğü kuyruğunu döndürür.

  </Accordion>

  <Accordion title="Talk ve TTS">
    - `talk.catalog`, konuşma, akışlı transkripsiyon ve gerçek zamanlı ses için salt okunur Talk sağlayıcı kataloğunu döndürür. Sağlayıcı gizli bilgilerini döndürmeden veya genel yapılandırmayı değiştirmeden sağlayıcı kimliklerini, etiketleri, yapılandırılmış durumu, dışa açılan model/ses kimliklerini, kanonik modları, taşıma katmanlarını, beyin stratejilerini ve gerçek zamanlı ses/yetenek bayraklarını içerir.
    - `talk.config`, etkili Talk yapılandırma yükünü döndürür; `includeSecrets`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.
    - `talk.session.create`, `realtime/gateway-relay`, `transcription/gateway-relay` veya `stt-tts/managed-room` için Gateway'e ait bir Talk oturumu oluşturur. `stt-tts/managed-room` için, `sessionKey` geçiren `operator.write` çağıranları, kapsamlı oturum anahtarı görünürlüğü için `spawnedBy` de geçirmelidir; kapsamsız `sessionKey` oluşturma ve `brain: "direct-tools"` için `operator.admin` gerekir.
    - `talk.session.join`, yönetilen oda oturum tokenını doğrular, gerektiğinde `session.ready` veya `session.replaced` olayları yayar ve düz metin token ya da saklanan token hash'i olmadan oda/oturum meta verilerini ve son Talk olaylarını döndürür.
    - `talk.session.appendAudio`, Gateway'e ait gerçek zamanlı aktarma ve transkripsiyon oturumlarına base64 PCM giriş sesi ekler.
    - `talk.session.startTurn`, `talk.session.endTurn` ve `talk.session.cancelTurn`, durum temizlenmeden önce eski tur reddiyle yönetilen oda tur yaşam döngüsünü yürütür.
    - `talk.session.cancelOutput`, özellikle Gateway aktarma oturumlarında VAD kapılı araya girme için asistan ses çıkışını durdurur.
    - `talk.session.submitToolResult`, Gateway'e ait gerçek zamanlı aktarma oturumu tarafından yayılan bir sağlayıcı araç çağrısını tamamlar. Nihai sonuç daha sonra gelecekse ara araç çıktısı için `options: { willContinue: true }` ya da araç sonucu başka bir gerçek zamanlı asistan yanıtı başlatmadan sağlayıcı çağrısını karşılamalıysa `options: { suppressResponse: true }` geçirin.
    - `talk.session.steer`, etkin çalışma ses denetimini Gateway'e ait ajan destekli bir Talk oturumuna gönderir. `{ sessionId, text, mode? }` kabul eder; burada `mode`, `status`, `steer`, `cancel` veya `followup` olur; atlanan mod konuşulan metinden sınıflandırılır.
    - `talk.session.close`, Gateway'e ait bir aktarma, transkripsiyon veya yönetilen oda oturumunu kapatır ve terminal Talk olayları yayar.
    - `talk.mode`, WebChat/Control UI istemcileri için geçerli Talk modu durumunu ayarlar/yayınlar.
    - `talk.client.create`, Gateway yapılandırmaya, kimlik bilgilerine, talimatlara ve araç politikasına sahipken `webrtc` veya `provider-websocket` kullanarak istemciye ait gerçek zamanlı bir sağlayıcı oturumu oluşturur.
    - `talk.client.toolCall`, istemciye ait gerçek zamanlı taşıma katmanlarının sağlayıcı araç çağrılarını Gateway politikasına iletmesini sağlar. Desteklenen ilk araç `openclaw_agent_consult` aracıdır; istemciler sağlayıcıya özgü araç sonucunu göndermeden önce bir çalışma kimliği alır ve normal sohbet yaşam döngüsü olaylarını bekler.
    - `talk.client.steer`, istemciye ait gerçek zamanlı taşıma katmanları için etkin çalışma ses denetimi gönderir. Gateway, etkin gömülü çalışmayı `sessionKey` üzerinden çözümler ve yönlendirmeyi sessizce yok saymak yerine yapılandırılmış bir kabul/red sonucu döndürür.
    - `talk.event`, gerçek zamanlı, transkripsiyon, STT/TTS, yönetilen oda, telefon ve toplantı adaptörleri için tek Talk olay kanalıdır.
    - `talk.speak`, etkin Talk konuşma sağlayıcısı üzerinden konuşma sentezler.
    - `tts.status`, TTS etkin durumunu, etkin sağlayıcıyı, geri dönüş sağlayıcılarını ve sağlayıcı yapılandırma durumunu döndürür.
    - `tts.providers`, görünür TTS sağlayıcı envanterini döndürür.
    - `tts.enable` ve `tts.disable`, TTS tercihleri durumunu açıp kapatır.
    - `tts.setProvider`, tercih edilen TTS sağlayıcısını günceller.
    - `tts.convert`, tek seferlik metinden konuşmaya dönüştürme çalıştırır.

  </Accordion>

  <Accordion title="Gizli bilgiler, yapılandırma, güncelleme ve sihirbaz">
    - `secrets.reload`, etkin SecretRef'leri yeniden çözümler ve çalışma zamanı gizli bilgi durumunu yalnızca tam başarıda değiştirir.
    - `secrets.resolve`, belirli bir komut/hedef kümesi için komut hedefli gizli bilgi atamalarını çözümler.
    - `config.get`, geçerli yapılandırma anlık görüntüsünü ve hash'i döndürür.
    - `config.set`, doğrulanmış bir yapılandırma yükü yazar.
    - `config.patch`, kısmi bir yapılandırma güncellemesini birleştirir. Yıkıcı dizi
      değiştirme için etkilenen yolun `replacePaths` içinde olması gerekir; dizi girdilerinin altındaki iç içe diziler `agents.list[].skills` gibi `[]` yolları kullanır.
    - `config.apply`, tam yapılandırma yükünü doğrular + değiştirir.
    - `config.schema`, Control UI ve CLI araçları tarafından kullanılan canlı yapılandırma şeması yükünü döndürür: şema, `uiHints`, sürüm ve çalışma zamanı yükleyebildiğinde plugin + kanal şeması meta verileri dahil üretim meta verileri. Şema, eşleşen alan dokümantasyonu bulunduğunda iç içe nesne, joker karakter, dizi öğesi ve `anyOf` / `oneOf` / `allOf` bileşim dalları dahil olmak üzere UI tarafından kullanılan aynı etiketlerden ve yardım metninden türetilen `title` / `description` alan meta verilerini içerir.
    - `config.schema.lookup`, tek bir yapılandırma yolu için yol kapsamlı bir arama yükü döndürür: normalleştirilmiş yol, sığ bir şema düğümü, eşleşen ipucu + `hintPath`, isteğe bağlı `reloadKind` ve UI/CLI ayrıntıya inme için doğrudan alt özetler. `reloadKind`, `restart`, `hot` veya `none` değerlerinden biridir ve istenen yol için Gateway yapılandırma yeniden yükleme planlayıcısını yansıtır. Arama şeması düğümleri kullanıcıya yönelik dokümanları ve yaygın doğrulama alanlarını (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, sayısal/dize/dizi/nesne sınırları ve `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi bayraklar) korur. Alt özetler `key`, normalleştirilmiş `path`, `type`, `required`, `hasChildren`, isteğe bağlı `reloadKind` ve eşleşen `hint` / `hintPath` bilgilerini gösterir.
    - `update.run`, Gateway güncelleme akışını çalıştırır ve yalnızca güncellemenin kendisi başarılı olduğunda yeniden başlatma zamanlar; oturumu olan çağıranlar `continuationMessage` ekleyebilir, böylece başlangıç, yeniden başlatma devam kuyruğu üzerinden bir takip ajan turuyla sürer. Kontrol düzleminden gelen paket yöneticisi güncellemeleri ve denetimli git-checkout güncellemeleri, canlı Gateway içinde paket ağacını değiştirmek veya checkout/derleme çıktısını mutasyona uğratmak yerine ayrılmış bir yönetilen hizmet devri kullanır. Başlatılan bir devir, `result.reason: "managed-service-handoff-started"` ve `handoff.status: "started"` ile `ok: true` döndürür; kullanılamayan veya başarısız devirler `managed-service-handoff-unavailable` veya `managed-service-handoff-failed` ile `ok: false` döndürür ve manuel kabuk güncellemesi gerektiğinde `handoff.command` ekler. Kullanılamayan devir, OpenClaw'ın systemd için `OPENCLAW_SYSTEMD_UNIT` gibi güvenli bir gözetmen sınırı veya kalıcı hizmet kimliğinden yoksun olduğu anlamına gelir. Başlatılmış bir devir sırasında yeniden başlatma işaretçisi kısa süreliğine `stats.reason: "restart-health-pending"` bildirebilir; devam, CLI yeniden başlatılan Gateway'i doğrulayıp son `ok` işaretçisini yazana kadar ertelenir.
    - `update.status`, yeniden başlatma sonrası çalışan sürüm mevcut olduğunda dahil olmak üzere en son güncelleme yeniden başlatma işaretçisini yeniler ve döndürür.
    - `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`, başlangıç sihirbazını WS RPC üzerinden dışa açar.

  </Accordion>

  <Accordion title="Agent ve çalışma alanı yardımcıları">
    - `agents.list`, etkin model ve runtime metadata dahil olmak üzere yapılandırılmış agent girdilerini döndürür.
    - `agents.create`, `agents.update` ve `agents.delete`, agent kayıtlarını ve çalışma alanı bağlantılarını yönetir.
    - `agents.files.list`, `agents.files.get` ve `agents.files.set`, bir agent için kullanıma sunulan bootstrap çalışma alanı dosyalarını yönetir.
    - `tasks.list`, `tasks.get` ve `tasks.cancel`, Gateway görev defterini SDK ve operatör istemcilerine açar.
    - `artifacts.list`, `artifacts.get` ve `artifacts.download`, açık bir `sessionKey`, `runId` veya `taskId` kapsamı için transkriptten türetilmiş artifact özetlerini ve indirmelerini açar. Çalıştırma ve görev sorguları sahip olan oturumu sunucu tarafında çözer ve yalnızca eşleşen provenanslı transkript medyasını döndürür; güvenli olmayan veya yerel URL kaynakları, sunucu tarafında getirmek yerine desteklenmeyen indirmeler döndürür.
    - `environments.list` ve `environments.status`, SDK istemcileri için salt okunur Gateway-yerel ve node ortam keşfini açar.
    - `agent.identity.get`, bir agent veya oturum için etkin asistan kimliğini döndürür.
    - `agent.wait`, bir çalıştırmanın bitmesini bekler ve mevcut olduğunda terminal snapshot'ını döndürür.

  </Accordion>

  <Accordion title="Oturum kontrolü">
    - `sessions.list`, bir agent runtime backend'i yapılandırıldığında satır başına `agentRuntime` metadata dahil olmak üzere geçerli oturum indeksini döndürür.
    - `sessions.subscribe` ve `sessions.unsubscribe`, geçerli WS istemcisi için oturum değişikliği olay aboneliklerini açıp kapatır.
    - `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`, bir oturum için transkript/mesaj olay aboneliklerini açıp kapatır.
    - `sessions.preview`, belirli oturum anahtarları için sınırlı transkript önizlemeleri döndürür.
    - `sessions.describe`, tam bir oturum anahtarı için bir Gateway oturum satırı döndürür.
    - `sessions.resolve`, bir oturum hedefini çözer veya kanonikleştirir.
    - `sessions.create`, yeni bir oturum girdisi oluşturur.
    - `sessions.send`, mevcut bir oturuma mesaj gönderir.
    - `sessions.steer`, etkin bir oturum için kes-ve-yönlendir varyantıdır.
    - `sessions.abort`, bir oturum için etkin işi durdurur. Çağıran taraf, isteğe bağlı `runId` ile birlikte `key` iletebilir veya Gateway'in bir oturuma çözebildiği etkin çalıştırmalar için yalnızca `runId` iletebilir.
    - `sessions.patch`, oturum metadata/override'larını günceller ve çözümlenen kanonik modeli artı etkin `agentRuntime` değerini raporlar.
    - `sessions.reset`, `sessions.delete` ve `sessions.compact`, oturum bakımını gerçekleştirir.
    - `sessions.get`, tam saklanan oturum satırını döndürür.
    - Sohbet yürütmesi hâlâ `chat.history`, `chat.send`, `chat.abort` ve `chat.inject` kullanır. `chat.history`, UI istemcileri için görüntü açısından normalize edilir: satır içi directive tag'leri görünür metinden çıkarılır, düz metin tool-call XML payload'ları (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış tool-call blokları dahil) ve sızmış ASCII/tam genişlikli model kontrol token'ları çıkarılır, tam `NO_REPLY` / `no_reply` gibi saf sessiz-token asistan satırları atlanır ve aşırı büyük satırlar placeholder'larla değiştirilebilir.
    - `chat.message.get`, tek bir görünür transkript girdisi için eklemeli, sınırlı tam-mesaj okuyucusudur. İstemciler `sessionKey`, oturum seçimi agent kapsamlı olduğunda isteğe bağlı `agentId` ve daha önce `chat.history` üzerinden gösterilmiş bir transkript `messageId` iletir; Gateway, saklanan girdi hâlâ mevcutsa ve aşırı büyük değilse hafif history kısaltma sınırı olmadan aynı görüntü-normalize projeksiyonunu döndürür.
    - `chat.send`, otomatik kesme zamanından önce başlatılan model çağrılarında fast mode kullanmak, ardından daha sonra yeniden deneme, fallback, tool-result veya devam çağrılarını fast mode olmadan başlatmak için tek turluk `fastMode: "auto"` kabul eder. Kesme zamanı varsayılan olarak 60 saniyedir ve model başına `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` ile yapılandırılabilir. Bir `chat.send` çağırıcısı, ilgili istek için kesme zamanını geçersiz kılmak üzere tek turluk `fastAutoOnSeconds` iletebilir.

  </Accordion>

  <Accordion title="Cihaz eşleme ve cihaz token'ları">
    - `device.pair.list`, bekleyen ve onaylanmış eşlenmiş cihazları döndürür.
    - `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`, cihaz eşleme kayıtlarını yönetir.
    - `device.token.rotate`, eşlenmiş bir cihaz token'ını onaylanmış rolü ve çağıran kapsam sınırları içinde döndürür.
    - `device.token.revoke`, eşlenmiş bir cihaz token'ını onaylanmış rolü ve çağıran kapsam sınırları içinde iptal eder.

  </Accordion>

  <Accordion title="Node eşleme, çağırma ve bekleyen iş">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` ve `node.pair.verify`, node eşlemeyi ve bootstrap doğrulamasını kapsar.
    - `node.list` ve `node.describe`, bilinen/bağlı node durumunu döndürür.
    - `node.rename`, eşlenmiş bir node etiketini günceller.
    - `node.invoke`, bir komutu bağlı bir node'a iletir.
    - `node.invoke.result`, bir invoke isteğinin sonucunu döndürür.
    - `node.event`, node kaynaklı olayları gateway'e geri taşır.
    - `node.pending.pull` ve `node.pending.ack`, bağlı-node kuyruk API'leridir.
    - `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısı kesilmiş node'lar için dayanıklı bekleyen işleri yönetir.

  </Accordion>

  <Accordion title="Onay aileleri">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve `exec.approval.resolve`, tek seferlik exec onay isteklerini ve bekleyen onay arama/yeniden oynatmayı kapsar.
    - `exec.approval.waitDecision`, bekleyen bir exec onayını bekler ve nihai kararı döndürür (veya zaman aşımında `null`).
    - `exec.approvals.get` ve `exec.approvals.set`, gateway exec onay politikası snapshot'larını yönetir.
    - `exec.approvals.node.get` ve `exec.approvals.node.set`, node relay komutları üzerinden node-yerel exec onay politikasını yönetir.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` ve `plugin.approval.resolve`, Plugin tanımlı onay akışlarını kapsar.

  </Accordion>

  <Accordion title="Otomasyon, Skills ve araçlar">
    - Otomasyon: `wake`, anında veya sonraki Heartbeat'te wake metin enjeksiyonu zamanlar; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zamanlanmış işleri yönetir.
    - `cron.run`, manuel çalıştırmalar için enqueue tarzı bir RPC olarak kalır. Tamamlanma semantiğine ihtiyaç duyan istemciler, döndürülen `runId` değerini okumalı ve `cron.runs` sorgulamalıdır.
    - `cron.runs`, istemcilerin aynı iş için diğer history girdileriyle yarışmadan tek bir kuyruğa alınmış manuel çalıştırmayı takip edebilmesi için isteğe bağlı, boş olmayan bir `runId` filtresi kabul eder.
    - Skills ve araçlar: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Yaygın olay aileleri

- `chat`: `chat.inject` gibi UI sohbet güncellemeleri ve yalnızca transkript içeren diğer sohbet
  olayları. Protocol v4'te delta payload'ları `deltaText` taşır; `message`
  kümülatif asistan snapshot'ı olarak kalır. Prefix olmayan değiştirmeler `replace=true`
  ayarlar ve değiştirme metni olarak `deltaText` kullanır.
- `session.message`, `session.operation` ve `session.tool`: abone olunan bir
  oturum için transkript, devam eden oturum işlemi ve event-stream güncellemeleri.
- `sessions.changed`: oturum indeksi veya metadata değişti.
- `presence`: sistem presence snapshot güncellemeleri.
- `tick`: periyodik keepalive / liveness olayı.
- `health`: gateway health snapshot güncellemesi.
- `heartbeat`: Heartbeat event stream güncellemesi.
- `cron`: Cron çalıştırma/iş değişikliği olayı.
- `shutdown`: gateway kapatma bildirimi.
- `node.pair.requested` / `node.pair.resolved`: node eşleme yaşam döngüsü.
- `node.invoke.request`: node invoke isteği yayını.
- `device.pair.requested` / `device.pair.resolved`: eşlenmiş-cihaz yaşam döngüsü.
- `voicewake.changed`: wake-word tetikleyici yapılandırması değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onay
  yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin onay
  yaşam döngüsü.

### Node yardımcı yöntemleri

- Node'lar, auto-allow kontrolleri için geçerli skill yürütülebilirleri listesini
  almak üzere `skills.bins` çağırabilir.

### Görev defteri RPC'leri

Operatör istemcileri, görev defteri RPC'leri üzerinden Gateway arka plan görev
kayıtlarını inceleyebilir ve iptal edebilir. Bu yöntemler ham runtime durumu
değil, sanitize edilmiş görev özetleri döndürür.

- `tasks.list`, `operator.read` gerektirir.
  - Parametreler: isteğe bağlı `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` veya `"timed_out"`) ya da bu durumlardan oluşan bir dizi,
    isteğe bağlı `agentId`, isteğe bağlı `sessionKey`, `1` ile
    `500` arasında isteğe bağlı `limit` ve isteğe bağlı string `cursor`.
  - Sonuç: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get`, `operator.read` gerektirir.
  - Parametreler: `{ "taskId": string }`.
  - Sonuç: `{ "task": TaskSummary }`.
  - Eksik görev id'leri Gateway not-found hata biçimini döndürür.
- `tasks.cancel`, `operator.write` gerektirir.
  - Parametreler: `{ "taskId": string, "reason"?: string }`.
  - Sonuç:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found`, defterde eşleşen bir görev olup olmadığını bildirir. `cancelled`,
    runtime'ın iptali kabul edip etmediğini veya kaydedip kaydetmediğini bildirir.

`TaskSummary`, `id`, `status` ve `kind`, `runtime`, `title`, `agentId`, `sessionKey`,
`childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`,
zaman damgaları, ilerleme, terminal özeti ve sanitize edilmiş hata metni gibi isteğe bağlı
metadata içerir. `agentId`, görevi yürüten agent'ı tanımlar; `sessionKey` ve `ownerKey`,
istek yapan ve kontrol bağlamını korur.

### Operatör yardımcı yöntemleri

- Operatörler, bir aracı için çalışma zamanı komut envanterini almak üzere `commands.list` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan aracı çalışma alanını okumak için atlayın.
  - `scope`, birincil `name` değerinin hangi yüzeyi hedeflediğini denetler:
    - `text`, baştaki `/` olmadan birincil metin komutu belirtecini döndürür
    - `native` ve varsayılan `both` yolu, mevcut olduğunda sağlayıcıya duyarlı yerel adları döndürür
  - `textAliases`, `/model` ve `/m` gibi tam eğik çizgili takma adları taşır.
  - `nativeName`, mevcut olduğunda sağlayıcıya duyarlı yerel komut adını taşır.
  - `provider` isteğe bağlıdır ve yalnızca yerel adlandırmayı ve yerel plugin komutu kullanılabilirliğini etkiler.
  - `includeArgs=false`, serileştirilmiş argüman meta verilerini yanıttan çıkarır.
- Operatörler, bir aracı için çalışma zamanı araç kataloğunu almak üzere `tools.catalog` (`operator.read`) çağırabilir. Yanıt, gruplandırılmış araçları ve köken meta verilerini içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda plugin sahibi
  - `optional`: bir plugin aracının isteğe bağlı olup olmadığı
- Operatörler, bir oturum için çalışma zamanında etkin araç envanterini almak üzere `tools.effective` (`operator.read`) çağırabilir.
  - `sessionKey` gereklidir.
  - Gateway, çağıranın sağladığı kimlik doğrulama veya teslim bağlamını kabul etmek yerine güvenilir çalışma zamanı bağlamını sunucu tarafındaki oturumdan türetir.
  - Yanıt; çekirdek, plugin, kanal ve önceden keşfedilmiş MCP sunucu araçları dahil olmak üzere, etkin envanterin oturum kapsamlı ve sunucudan türetilmiş bir projeksiyonudur.
  - `tools.effective`, MCP için salt okunurdur: sıcak bir oturum MCP kataloğunu nihai araç ilkesi üzerinden yansıtabilir, ancak MCP çalışma zamanları oluşturmaz, taşımalara bağlanmaz veya `tools/list` yayımlamaz. Eşleşen sıcak katalog yoksa yanıt `mcp-not-yet-connected`, `mcp-not-yet-listed` veya `mcp-stale-catalog` gibi bir bildirim içerebilir.
  - Etkin araç girdileri `source="core"`, `source="plugin"`, `source="channel"` veya `source="mcp"` kullanır.
- Operatörler, `/tools/invoke` ile aynı gateway ilkesi yolu üzerinden kullanılabilir bir aracı çağırmak için `tools.invoke` (`operator.write`) çağırabilir.
  - `name` gereklidir. `args`, `sessionKey`, `agentId`, `confirm` ve `idempotencyKey` isteğe bağlıdır.
  - Hem `sessionKey` hem de `agentId` mevcutsa, çözümlenen oturum aracısı `agentId` ile eşleşmelidir.
  - `cron`, `gateway` ve `nodes` gibi yalnızca sahibin kullanabildiği çekirdek sarmalayıcılar, `tools.invoke` yönteminin kendisi `operator.write` olsa bile sahip/yönetici kimliği (`operator.admin`) gerektirir.
  - Yanıt, `ok`, `toolName`, isteğe bağlı `output` ve türlendirilmiş `error` alanları içeren SDK'ya yönelik bir zarftır. Onay veya ilke retleri, gateway araç ilkesi işlem hattını atlamak yerine yükte `ok:false` döndürür.
- Operatörler, bir aracı için görünür beceri envanterini almak üzere `skills.status` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan aracı çalışma alanını okumak için atlayın.
  - Yanıt, ham gizli değerleri açığa çıkarmadan uygunluk, eksik gereksinimler, yapılandırma denetimleri ve sterilize edilmiş kurulum seçeneklerini içerir.
- Operatörler, ClawHub keşif meta verileri için `skills.search` ve `skills.detail` (`operator.read`) çağırabilir.
- Operatörler, özel bir beceri arşivini kurmadan önce hazırlamak için `skills.upload.begin`, `skills.upload.chunk` ve `skills.upload.commit` (`operator.admin`) çağırabilir. Bu, güvenilir istemciler için ayrı bir yönetici yükleme yoludur, normal ClawHub beceri kurulum akışı değildir ve `skills.install.allowUploadedArchives` etkinleştirilmedikçe varsayılan olarak devre dışıdır.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`, bu slug ve force değerine bağlı bir yükleme oluşturur.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })`, baytları tam çözülmüş ofsette ekler.
  - `skills.upload.commit({ uploadId, sha256? })`, nihai boyutu ve SHA-256 değerini doğrular. Commit yalnızca yüklemeyi sonlandırır; beceriyi kurmaz.
  - Yüklenen beceri arşivleri, kökte `SKILL.md` içeren zip arşivleridir. Arşivin iç dizin adı kurulum hedefini asla seçmez.
- Operatörler, `skills.install` (`operator.admin`) çağrısını üç modda yapabilir:
  - ClawHub modu: `{ source: "clawhub", slug, version?, force? }`, varsayılan aracı çalışma alanındaki `skills/` dizinine bir beceri klasörü kurar.
  - Yükleme modu: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`, commit edilmiş bir yüklemeyi varsayılan aracı çalışma alanındaki `skills/<slug>` dizinine kurar. Slug ve force değeri özgün `skills.upload.begin` isteğiyle eşleşmelidir. Bu mod, `skills.install.allowUploadedArchives` etkinleştirilmedikçe reddedilir. Ayar, ClawHub kurulumlarını etkilemez.
  - Gateway kurucu modu: `{ name, installId, timeoutMs? }`, gateway ana makinesinde bildirilmiş bir `metadata.openclaw.install` eylemini çalıştırır. Eski istemciler hâlâ `dangerouslyForceUnsafeInstall` gönderebilir; bu alan kullanımdan kaldırılmıştır, yalnızca protokol uyumluluğu için kabul edilir ve yok sayılır. Operatör sahipli kurulum kararları için `security.installPolicy` kullanın.
- Operatörler, `skills.update` (`operator.admin`) çağrısını iki modda yapabilir:
  - ClawHub modu, varsayılan aracı çalışma alanında izlenen bir slug'ı veya izlenen tüm ClawHub kurulumlarını günceller.
  - Yapılandırma modu, `enabled`, `apiKey` ve `env` gibi `skills.entries.<skillKey>` değerlerine yama uygular.

### `models.list` görünümleri

`models.list`, isteğe bağlı bir `view` parametresi kabul eder:

- Atlanmış veya `"default"`: mevcut çalışma zamanı davranışı. `agents.defaults.models` yapılandırılmışsa yanıt, `provider/*` girdileri için dinamik olarak keşfedilen modeller dahil olmak üzere izin verilen katalogdur. Aksi halde yanıt tam Gateway kataloğudur.
- `"configured"`: seçici boyutunda davranış. `agents.defaults.models` yapılandırılmışsa, `provider/*` girdileri için sağlayıcı kapsamlı keşif dahil olmak üzere yine öncelikli olur. İzin listesi yoksa yanıt açık `models.providers.*.models` girdilerini kullanır ve yalnızca yapılandırılmış model satırı yoksa tam kataloğa geri döner.
- `"all"`: `agents.defaults.models` değerini atlayarak tam Gateway kataloğu. Bunu normal model seçiciler için değil, tanılama ve keşif arayüzleri için kullanın.

## Exec onayları

- Bir exec isteği onay gerektirdiğinde, gateway `exec.approval.requested` yayımlar.
- Operatör istemcileri `exec.approval.resolve` çağırarak çözer (`operator.approvals` kapsamı gerekir).
- `host=node` için `exec.approval.request`, `systemRunPlan` (kanonik `argv`/`cwd`/`rawCommand`/oturum meta verileri) içermelidir. `systemRunPlan` eksik olan istekler reddedilir.
- Onaydan sonra, iletilen `node.invoke system.run` çağrıları yetkili komut/cwd/oturum bağlamı olarak bu kanonik `systemRunPlan` değerini yeniden kullanır.
- Bir çağıran, hazırlama ile nihai onaylı `system.run` iletimi arasında `command`, `rawCommand`, `cwd`, `agentId` veya `sessionKey` değerini değiştirirse gateway, değiştirilmiş yüke güvenmek yerine çalıştırmayı reddeder.

## Aracı teslim geri dönüşü

- `agent` istekleri, dışa teslim istemek için `deliver=true` içerebilir.
- `bestEffortDeliver=false` katı davranışı korur: çözümlenemeyen veya yalnızca dahili teslim hedefleri `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici olarak teslim edilebilir bir rota çözümlenemediğinde oturumla sınırlı yürütmeye geri dönüşe izin verir (örneğin dahili/webchat oturumları veya belirsiz çok kanallı yapılandırmalar).
- Nihai `agent` sonuçları, teslim istendiğinde `result.deliveryStatus` içerebilir; bu, [`openclaw agent --json --deliver`](/tr/cli/agent#json-delivery-status) için belgelenen aynı `sent`, `suppressed`, `partial_failed` ve `failed` durumlarını kullanır.

## Sürümleme

- `PROTOCOL_VERSION`, `packages/gateway-protocol/src/version.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu, geçerli protokolünü içermeyen aralıkları reddeder. Geçerli istemciler ve sunucular protokol v4 gerektirir.
- Şemalar + modeller TypeBox tanımlarından üretilir:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### İstemci sabitleri

`src/gateway/client.ts` içindeki referans istemci bu varsayılanları kullanır. Değerler protokol v4 genelinde kararlıdır ve üçüncü taraf istemciler için beklenen başlangıç değerleridir.

| Sabit                                     | Varsayılan                                            | Kaynak                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| İstek zaman aşımı (RPC başına)            | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Ön kimlik doğrulama / bağlantı-sınama zaman aşımı | `15_000` ms                                  | `src/gateway/handshake-timeouts.ts` (config/env eşleşmiş sunucu/istemci bütçesini artırabilir) |
| İlk yeniden bağlanma geri çekilmesi       | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| En fazla yeniden bağlanma geri çekilmesi  | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Cihaz belirteci kapanışından sonra hızlı yeniden deneme sıkıştırması | `250` ms                         | `src/gateway/client.ts`                                                                    |
| `terminate()` öncesi zorla durdurma ek süresi | `250` ms                                          | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` varsayılan zaman aşımı    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Varsayılan tick aralığı (`hello-ok` öncesi) | `30_000` ms                                         | `src/gateway/client.ts`                                                                    |
| Tick zaman aşımı kapanışı                 | sessizlik `tickIntervalMs * 2` değerini aştığında kod `4000` | `src/gateway/client.ts`                                                           |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Sunucu, etkin `policy.tickIntervalMs`, `policy.maxPayload` ve `policy.maxBufferedBytes` değerlerini `hello-ok` içinde duyurur; istemciler, el sıkışma öncesi varsayılanlar yerine bu değerlere uymalıdır.

## Kimlik doğrulama

- Paylaşılan gizli Gateway kimlik doğrulaması, yapılandırılmış kimlik doğrulama moduna bağlı olarak `connect.params.auth.token` veya
  `connect.params.auth.password` kullanır.
- Tailscale Serve
  (`gateway.auth.allowTailscale: true`) gibi kimlik taşıyan modlar veya yerel loopback olmayan
  `gateway.auth.mode: "trusted-proxy"`, bağlantı kimlik doğrulama denetimini
  `connect.params.auth.*` yerine istek başlıklarından karşılar.
- Özel giriş `gateway.auth.mode: "none"`, paylaşılan gizli bağlantı kimlik doğrulamasını
  tamamen atlar; bu modu genel/güvenilmeyen girişte açığa çıkarmayın.
- Eşleştirmeden sonra Gateway, bağlantı rolü + kapsamlarla sınırlı bir **cihaz belirteci**
  verir. Bu belirteç `hello-ok.auth.deviceToken` içinde döndürülür ve istemci tarafından
  gelecekteki bağlantılar için kalıcı olarak saklanmalıdır.
- İstemciler, başarılı herhangi bir bağlantıdan sonra birincil `hello-ok.auth.deviceToken` değerini kalıcı olarak saklamalıdır.
- Bu **saklanan** cihaz belirteciyle yeniden bağlanmak, o belirteç için saklanan
  onaylı kapsam kümesini de yeniden kullanmalıdır. Bu, zaten verilmiş olan okuma/sonda/durum erişimini
  korur ve yeniden bağlantıların sessizce daha dar, örtük yalnızca yönetici kapsamına
  düşmesini önler.
- İstemci tarafı bağlantı kimlik doğrulaması derlemesi (`src/gateway/client.ts` içindeki
  `selectConnectAuth`):
  - `auth.password` bağımsızdır ve ayarlandığında her zaman iletilir.
  - `auth.token` öncelik sırasıyla doldurulur: önce açık paylaşılan belirteç,
    sonra açık bir `deviceToken`, ardından saklanan cihaz başına belirteç (`deviceId` + `role` ile anahtarlanır).
  - `auth.bootstrapToken`, yalnızca yukarıdakilerden hiçbiri bir
    `auth.token` çözümlemediğinde gönderilir. Paylaşılan belirteç veya çözümlenen herhangi bir cihaz belirteci bunu bastırır.
  - Tek seferlik `AUTH_TOKEN_MISMATCH` yeniden denemesinde saklanan cihaz belirtecinin otomatik yükseltilmesi,
    **yalnızca güvenilen uç noktalarla** sınırlıdır —
    loopback veya sabitlenmiş `tlsFingerprint` ile `wss://`. Sabitleme olmadan genel `wss://`
    uygun değildir.
- Yerleşik kurulum kodu önyüklemesi, güvenilen mobil aktarım için birincil düğüm
  `hello-ok.auth.deviceToken` değerini ve
  `hello-ok.auth.deviceTokens` içinde sınırlandırılmış bir operatör belirtecini döndürür. Operatör belirteci,
  yerel Talk yapılandırması okumaları için `operator.talk.secrets` içerir ve
  `operator.admin` ile `operator.pairing` kapsamlarını hariç tutar.
- Temel olmayan bir kurulum kodu önyüklemesi onay beklerken, `PAIRING_REQUIRED`
  ayrıntıları `recommendedNextStep: "wait_then_retry"`, `retryable: true`
  ve `pauseReconnect: false` içerir. İstemciler, istek onaylanana veya belirteç geçersiz olana kadar
  aynı önyükleme belirteciyle yeniden bağlanmayı sürdürmelidir.
- `hello-ok.auth.deviceTokens` değerini yalnızca bağlantı,
  `wss://` veya loopback/yerel eşleştirme gibi güvenilen bir taşıma üzerinde önyükleme kimlik doğrulaması kullandığında kalıcı olarak saklayın.
- Bir istemci **açık** bir `deviceToken` veya açık `scopes` sağlarsa,
  çağıranın istediği kapsam kümesi yetkili kalır; önbelleğe alınmış kapsamlar yalnızca
  istemci saklanan cihaz başına belirteci yeniden kullandığında yeniden kullanılır.
- Cihaz belirteçleri `device.token.rotate` ve
  `device.token.revoke` üzerinden döndürülebilir/iptal edilebilir (`operator.pairing` kapsamı gerektirir). Bir düğümün veya
  başka bir operatör olmayan rolün döndürülmesi ya da iptal edilmesi ayrıca `operator.admin` gerektirir.
- `device.token.rotate`, döndürme meta verilerini döndürür. Yedek
  taşıyıcı belirteci yalnızca aynı cihazdan gelen ve zaten
  o cihaz belirteciyle kimliği doğrulanmış çağrılar için yansıtır; böylece yalnızca belirteç kullanan istemciler,
  yeniden bağlanmadan önce yedeklerini kalıcı olarak saklayabilir. Paylaşılan/yönetici döndürmeleri taşıyıcı belirteci yansıtmaz.
- Belirteç verme, döndürme ve iptal işlemleri, o cihazın eşleştirme girdisinde
  kaydedilen onaylı rol kümesiyle sınırlı kalır; belirteç mutasyonu,
  eşleştirme onayının hiç vermediği bir cihaz rolünü genişletemez veya hedefleyemez.
- Eşleştirilmiş cihaz belirteci oturumlarında, çağıranda `operator.admin` da yoksa
  cihaz yönetimi kendi kapsamıyla sınırlıdır: yönetici olmayan çağıranlar yalnızca
  **kendi** cihaz girdileri için operatör belirtecini yönetebilir. Düğüm ve diğer operatör olmayan
  belirteç yönetimi, çağıranın kendi cihazı için bile yalnızca yöneticilere açıktır.
- `device.token.rotate` ve `device.token.revoke`, hedef operatör
  belirteci kapsam kümesini çağıranın mevcut oturum kapsamlarına göre de denetler. Yönetici olmayan çağıranlar,
  ellerinde bulunan kapsamdan daha geniş bir operatör belirtecini döndüremez veya iptal edemez.
- Kimlik doğrulama hataları `error.details.code` ile kurtarma ipuçlarını içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilen istemciler, önbelleğe alınmış cihaz başına belirteçle bir sınırlı yeniden deneme yapmayı deneyebilir.
  - Bu yeniden deneme başarısız olursa, istemciler otomatik yeniden bağlantı döngülerini durdurmalı ve operatör eylemi yönlendirmesini göstermelidir.
- `AUTH_SCOPE_MISMATCH`, cihaz belirtecinin tanındığı ancak
  istenen rol/kapsamları kapsamadığı anlamına gelir. İstemciler bunu kötü bir belirteç olarak sunmamalıdır;
  operatörden yeniden eşleştirme yapmasını veya daha dar/daha geniş kapsam sözleşmesini onaylamasını isteyin.

## Cihaz kimliği + eşleştirme

- Düğümler, anahtar çifti parmak izinden türetilmiş kararlı bir cihaz kimliği (`device.id`) içermelidir.
- Gateway’ler cihaz + rol başına belirteç verir.
- Yerel otomatik onay etkin değilse yeni cihaz kimlikleri için eşleştirme onayları gerekir.
- Eşleştirme otomatik onayı, doğrudan yerel loopback bağlantılarını merkeze alır.
- OpenClaw ayrıca güvenilen paylaşılan gizli yardımcı akışlar için dar bir arka uç/kapsayıcı yerel kendi kendine bağlantı yoluna sahiptir.
- Aynı ana makine tailnet veya LAN bağlantıları eşleştirme için yine de uzak kabul edilir ve
  onay gerektirir.
- WS istemcileri normalde `connect` sırasında `device` kimliğini içerir (operatör +
  düğüm). Cihazsız operatör için tek istisnalar açık güven yollarıdır:
  - localhost’a özel güvensiz HTTP uyumluluğu için `gateway.controlUi.allowInsecureAuth=true`.
  - başarılı `gateway.auth.mode: "trusted-proxy"` operatör Control UI kimlik doğrulaması.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (acil durum, ciddi güvenlik düşürmesi).
  - ayrılmış dahili yardımcı yolunda doğrudan loopback `gateway-client` arka uç RPC’leri.
- Cihaz kimliğini atlamanın kapsam sonuçları vardır. Cihazsız bir operatör
  bağlantısına açık bir güven yolu üzerinden izin verildiğinde, OpenClaw yine de
  o yolun adlandırılmış bir kapsam koruma istisnası yoksa
  kendi beyan edilen kapsamları boş kümeye temizler. Kapsam kapılı yöntemler daha sonra
  `missing scope` ile başarısız olur.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`, Control UI
  için acil durum kapsam koruma yoludur. Rastgele
  özel arka uç veya CLI biçimli WebSocket istemcilerine kapsam vermez.
- Ayrılmış doğrudan loopback `gateway-client` arka uç yardımcı yolu, kapsamları
  yalnızca dahili yerel denetim düzlemi RPC’leri için korur; özel arka uç kimlikleri bu
  istisnayı almaz.
- Tüm bağlantılar, sunucunun sağladığı `connect.challenge` nonce değerini imzalamalıdır.

### Cihaz kimlik doğrulaması geçiş tanılamaları

Hâlâ zorluk öncesi imzalama davranışı kullanan eski istemciler için `connect` artık
kararlı bir `error.details.reason` ile `error.details.code` altında
`DEVICE_AUTH_*` ayrıntı kodları döndürür.

Yaygın geçiş hataları:

| İleti                       | details.code                     | details.reason           | Anlamı                                             |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | İstemci `device.nonce` değerini atladı (veya boş gönderdi). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | İstemci eski/yanlış bir nonce ile imzaladı.        |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | İmza yükü v2 yüküyle eşleşmiyor.                  |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | İmzalı zaman damgası izin verilen sapmanın dışında. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`, genel anahtar parmak iziyle eşleşmiyor. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Genel anahtar biçimi/standartlaştırması başarısız oldu. |

Geçiş hedefi:

- Her zaman `connect.challenge` değerini bekleyin.
- Sunucu nonce değerini içeren v2 yükünü imzalayın.
- Aynı nonce değerini `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza yükü `v3`’tür; bu, cihaz/istemci/rol/kapsamlar/belirteç/nonce alanlarına ek olarak
  `platform` ve `deviceFamily` değerlerini bağlar.
- Eski `v2` imzaları uyumluluk için kabul edilmeye devam eder, ancak eşleştirilmiş cihaz
  meta veri sabitlemesi yeniden bağlantıda komut politikasını denetlemeye devam eder.

## TLS + sabitleme

- TLS, WS bağlantıları için desteklenir.
- İstemciler isteğe bağlı olarak Gateway sertifika parmak izini sabitleyebilir (`gateway.tls`
  yapılandırmasına ek olarak `gateway.remote.tlsFingerprint` veya CLI `--tls-fingerprint`).

## Kapsam

Bu protokol **tam Gateway API’sini** açığa çıkarır (durum, kanallar, modeller, sohbet,
ajan, oturumlar, düğümler, onaylar vb.). Tam yüzey,
`packages/gateway-protocol/src/schema.ts` içindeki TypeBox şemalarıyla tanımlanır.

## İlgili

- [Köprü protokolü](/tr/gateway/bridge-protocol)
- [Gateway çalışma kitabı](/tr/gateway)
