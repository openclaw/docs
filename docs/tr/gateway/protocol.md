---
read_when:
    - Gateway WS istemcilerini uygulama veya güncelleme
    - Protokol uyuşmazlıklarında veya bağlanma hatalarında hata ayıklama
    - Protokol şemasını/modellerini yeniden oluşturma
summary: 'Gateway WebSocket protokolü: el sıkışması, çerçeveler, sürümleme'
title: Gateway protokolü
x-i18n:
    generated_at: "2026-05-10T19:38:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8bca116f2b05387e3c045f94137dff4eafba281ea5f2eabb65e75469cba8e8e
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protokolü, OpenClaw için **tek kontrol düzlemi + Node taşımasıdır**. Tüm istemciler (CLI, web kullanıcı arayüzü, macOS uygulaması, iOS/Android Node'ları, başsız Node'lar) WebSocket üzerinden bağlanır ve el sıkışma sırasında **rollerini** + **kapsamlarını** bildirir.

## Taşıma

- WebSocket, JSON yükleri içeren metin çerçeveleri.
- İlk çerçeve **mutlaka** bir `connect` isteği olmalıdır.
- Bağlantı öncesi çerçeveler 64 KiB ile sınırlıdır. Başarılı bir el sıkışmadan sonra istemciler `hello-ok.policy.maxPayload` ve `hello-ok.policy.maxBufferedBytes` sınırlarına uymalıdır. Tanılama etkinleştirildiğinde, Gateway etkilenen çerçeveyi kapatmadan veya düşürmeden önce, aşırı büyük gelen çerçeveler ve yavaş giden arabellekler `payload.large` olayları yayar. Bu olaylar boyutları, sınırları, yüzeyleri ve güvenli neden kodlarını tutar. İleti gövdesini, ek içeriklerini, ham çerçeve gövdesini, token'ları, çerezleri veya gizli değerleri tutmazlar.

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
    "minProtocol": 4,
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

Gateway başlangıç sidecar'larını hâlâ tamamlıyorken, `connect` isteği `details.reason` değeri `"startup-sidecars"` olarak ayarlanmış ve `retryAfterMs` içeren, yeniden denenebilir bir `UNAVAILABLE` hatası döndürebilir. İstemciler bu yanıtı uç el sıkışma hatası olarak göstermek yerine, genel bağlantı bütçeleri içinde yeniden denemelidir.

`server`, `features`, `snapshot` ve `policy` alanlarının tümü şema tarafından zorunlu tutulur (`src/gateway/protocol/schema/frames.ts`). `auth` da zorunludur ve anlaşılmış rol/kapsamları bildirir. `pluginSurfaceUrls` isteğe bağlıdır ve `canvas` gibi Plugin yüzeyi adlarını kapsamlı barındırılan URL'lere eşler.

Kapsamlı Plugin yüzeyi URL'lerinin süresi dolabilir. Node'lar, `pluginSurfaceUrls` içinde yeni bir giriş almak için `{ "surface": "canvas" }` ile `node.pluginSurface.refresh` çağırabilir. Deneysel Canvas Plugin yeniden düzenlemesi, kullanımdan kaldırılmış `canvasHostUrl`, `canvasCapability` veya `node.canvas.capability.refresh` uyumluluk yolunu desteklemez; mevcut yerel istemciler ve Gateway'ler Plugin yüzeylerini kullanmalıdır.

Cihaz token'ı verilmediğinde, `hello-ok.auth` anlaşılmış izinleri token alanları olmadan bildirir:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilir aynı süreç arka uç istemcileri (`client.id: "gateway-client"`, `client.mode: "backend"`), paylaşılan Gateway token'ı/parolasıyla kimlik doğruladıklarında doğrudan local loopback bağlantılarında `device` alanını atlayabilir. Bu yol, dahili kontrol düzlemi RPC'leri için ayrılmıştır ve eski CLI/cihaz eşleme temel çizgilerinin alt ajan oturum güncellemeleri gibi yerel arka uç çalışmalarını engellemesini önler. Uzak istemciler, tarayıcı kökenli istemciler, Node istemcileri ve açık cihaz-token'ı/cihaz-kimliği istemcileri normal eşleme ve kapsam yükseltme kontrollerini kullanmaya devam eder.

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

Güvenilir bootstrap devir teslimi sırasında, `hello-ok.auth` `deviceTokens` içinde ek sınırlı rol girişleri de içerebilir:

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

Yerleşik Node/operatör bootstrap akışı için birincil Node token'ı `scopes: []` olarak kalır ve devredilen tüm operatör token'ları bootstrap operatör izin listesiyle sınırlı kalır (`operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`). Bootstrap kapsam kontrolleri rol önekli kalır: operatör girişleri yalnızca operatör isteklerini karşılar ve operatör olmayan roller kendi rol önekleri altında kapsam gerektirmeye devam eder.

### Node örneği

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
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

Yan etkisi olan yöntemler **idempotency keys** gerektirir (şemaya bakın).

## Roller + kapsamlar

Tam operatör kapsam modeli, onay zamanı kontrolleri ve paylaşılan sır semantiği için bkz. [Operatör kapsamları](/tr/gateway/operator-scopes).

### Roller

- `operator` = kontrol düzlemi istemcisi (CLI/kullanıcı arayüzü/otomasyon).
- `node` = yetenek sunucusu (camera/screen/canvas/system.run).

### Kapsamlar (operatör)

Yaygın kapsamlar:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` ile `talk.config`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.

Plugin tarafından kaydedilen Gateway RPC yöntemleri kendi operatör kapsamlarını isteyebilir, ancak ayrılmış çekirdek yönetici önekleri (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) her zaman `operator.admin` olarak çözümlenir.

Yöntem kapsamı yalnızca ilk kapıdır. `chat.send` üzerinden ulaşılan bazı eğik çizgi komutları bunun üzerine daha sıkı komut düzeyi kontroller uygular. Örneğin, kalıcı `/config set` ve `/config unset` yazmaları `operator.admin` gerektirir.

`node.pair.approve`, temel yöntem kapsamının üzerine ek bir onay zamanı kapsam kontrolüne de sahiptir:

- komutsuz istekler: `operator.pairing`
- exec olmayan Node komutları içeren istekler: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which` içeren istekler:
  `operator.pairing` + `operator.admin`

### Yetenekler/komutlar/izinler (Node)

Node'lar bağlantı sırasında yetenek iddialarını bildirir:

- `caps`: `camera`, `canvas`, `screen`, `location`, `voice` ve `talk` gibi üst düzey yetenek kategorileri.
- `commands`: çağırma için komut izin listesi.
- `permissions`: ayrıntılı anahtarlar (ör. `screen.record`, `camera.capture`).

Gateway bunları **iddia** olarak değerlendirir ve sunucu tarafı izin listelerini uygular.

## Varlık

- `system-presence`, cihaz kimliğine göre anahtarlanmış girişler döndürür.
- Varlık girişleri `deviceId`, `roles` ve `scopes` içerir; böylece kullanıcı arayüzleri, hem **operator** hem de **node** olarak bağlandığında bile cihaz başına tek satır gösterebilir.
- `node.list` isteğe bağlı `lastSeenAtMs` ve `lastSeenReason` alanlarını içerir. Bağlı Node'lar mevcut bağlantı zamanlarını `connect` nedeniyle `lastSeenAtMs` olarak bildirir; eşlenmiş Node'lar, güvenilir bir Node olayı eşleme meta verilerini güncellediğinde kalıcı arka plan varlığı da bildirebilir.

### Node arka plan canlı olayı

Node'lar, eşlenmiş bir Node'un arka plan uyanışı sırasında bağlı olarak işaretlenmeden canlı olduğunu kaydetmek için `event: "node.presence.alive"` ile `node.event` çağırabilir.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` kapalı bir enum'dur: `background`, `silent_push`, `bg_app_refresh`, `significant_location`, `manual` veya `connect`. Bilinmeyen trigger dizeleri, kalıcılık öncesinde Gateway tarafından `background` olarak normalleştirilir. Olay yalnızca kimliği doğrulanmış Node cihaz oturumları için kalıcıdır; cihazsız veya eşlenmemiş oturumlar `handled: false` döndürür.

Başarılı Gateway'ler yapılandırılmış bir sonuç döndürür:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Daha eski Gateway'ler `node.event` için hâlâ `{ "ok": true }` döndürebilir; istemciler bunu kalıcı varlık kaydı olarak değil, onaylanmış bir RPC olarak değerlendirmelidir.

## Yayın olayı kapsamlandırması

Sunucu tarafından iletilen WebSocket yayın olayları kapsam kapılıdır; böylece eşleme kapsamlı veya yalnızca Node oturumları oturum içeriğini pasif olarak almaz.

- **Sohbet, ajan ve araç sonucu çerçeveleri** (akışlı `agent` olayları ve araç çağrısı sonuçları dahil) en az `operator.read` gerektirir. `operator.read` olmayan oturumlar bu çerçeveleri tamamen atlar.
- **Plugin tanımlı `plugin.*` yayınları**, Plugin'in bunları nasıl kaydettiğine bağlı olarak `operator.write` veya `operator.admin` ile kapılanır.
- **Durum ve taşıma olayları** (`heartbeat`, `presence`, `tick`, bağlanma/bağlantıyı kesme yaşam döngüsü vb.) sınırsız kalır; böylece taşıma sağlığı her kimliği doğrulanmış oturum tarafından gözlemlenebilir kalır.
- **Bilinmeyen yayın olayı aileleri**, kayıtlı bir işleyici bunları açıkça gevşetmedikçe varsayılan olarak kapsam kapılıdır (kapalı hata).

Her istemci bağlantısı kendi istemci başına sıra numarasını tutar; böylece farklı istemciler olay akışının farklı kapsam-filtreli alt kümelerini görse bile yayınlar o sokette monoton sıralamayı korur.

## Yaygın RPC yöntemi aileleri

Genel WS yüzeyi yukarıdaki el sıkışma/kimlik doğrulama örneklerinden daha geniştir. Bu, oluşturulmuş bir döküm değildir — `hello-ok.features.methods`, `src/gateway/server-methods-list.ts` ile yüklenen Plugin/kanal yöntem dışa aktarımlarından oluşturulan muhafazakâr bir keşif listesidir. Bunu `src/gateway/server-methods/*.ts` dosyalarının tam bir dökümü olarak değil, özellik keşfi olarak değerlendirin.

<AccordionGroup>
  <Accordion title="Sistem ve kimlik">
    - `health`, önbelleğe alınmış veya yeni sorgulanmış Gateway sağlık anlık görüntüsünü döndürür.
    - `diagnostics.stability`, son sınırlı tanılama kararlılığı kaydedicisini döndürür. Olay adları, sayılar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/Plugin adları ve oturum kimlikleri gibi operasyonel meta verileri tutar. Sohbet metnini, Webhook gövdelerini, araç çıktılarını, ham istek veya yanıt gövdelerini, token'ları, çerezleri ya da gizli değerleri tutmaz. Operatör okuma kapsamı gereklidir.
    - `status`, `/status` tarzı Gateway özetini döndürür; hassas alanlar yalnızca yönetici kapsamlı operatör istemcileri için dahil edilir.
    - `gateway.identity.get`, relay ve eşleme akışları tarafından kullanılan Gateway cihaz kimliğini döndürür.
    - `system-presence`, bağlı operatör/Node cihazları için mevcut varlık anlık görüntüsünü döndürür.
    - `system-event`, bir sistem olayı ekler ve varlık bağlamını güncelleyebilir/yayınlayabilir.
    - `last-heartbeat`, en son kalıcı Heartbeat olayını döndürür.
    - `set-heartbeats`, Gateway üzerinde Heartbeat işlemeyi açıp kapatır.

  </Accordion>

  <Accordion title="Modeller ve kullanım">
    - `models.list`, çalışma zamanı tarafından izin verilen model kataloğunu döndürür. Seçici boyutunda yapılandırılmış modeller için (`agents.defaults.models` önce, ardından `models.providers.*.models`) `{ "view": "configured" }` iletin veya tam katalog için `{ "view": "all" }` iletin.
    - `usage.status`, sağlayıcı kullanım pencerelerini/kalan kota özetlerini döndürür.
    - `usage.cost`, bir tarih aralığı için toplu maliyet kullanım özetlerini döndürür.
    - `doctor.memory.status`, etkin varsayılan aracı çalışma alanı için vektör belleği / önbelleğe alınmış gömme hazırlığını döndürür. Yalnızca çağıran açıkça canlı bir gömme sağlayıcısı pingi istediğinde `{ "probe": true }` veya `{ "deep": true }` iletin.
    - `doctor.memory.remHarness`, uzak denetim düzlemi istemcileri için sınırlı, salt okunur bir REM harness önizlemesi döndürür. Çalışma alanı yollarını, bellek parçacıklarını, işlenmiş temellendirilmiş markdown’u ve derin yükseltme adaylarını içerebilir; bu nedenle çağıranların `operator.read` iznine ihtiyacı vardır.
    - `sessions.usage`, oturum başına kullanım özetlerini döndürür.
    - `sessions.usage.timeseries`, tek bir oturum için zaman serisi kullanımını döndürür.
    - `sessions.usage.logs`, tek bir oturum için kullanım günlüğü girdilerini döndürür.

  </Accordion>

  <Accordion title="Kanallar ve oturum açma yardımcıları">
    - `channels.status`, yerleşik + paketlenmiş kanal/plugin durum özetlerini döndürür.
    - `channels.logout`, kanalın oturum kapatmayı desteklediği belirli bir kanal/hesap için oturumu kapatır.
    - `web.login.start`, mevcut QR destekli web kanalı sağlayıcısı için bir QR/web oturum açma akışı başlatır.
    - `web.login.wait`, bu QR/web oturum açma akışının tamamlanmasını bekler ve başarı durumunda kanalı başlatır.
    - `push.test`, kayıtlı bir iOS node’una test APNs push’u gönderir.
    - `voicewake.get`, saklanan uyandırma sözcüğü tetikleyicilerini döndürür.
    - `voicewake.set`, uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayınlar.

  </Accordion>

  <Accordion title="Mesajlaşma ve günlükler">
    - `send`, sohbet çalıştırıcısı dışında kanal/hesap/iş parçacığı hedefli gönderimler için doğrudan giden teslimat RPC’sidir.
    - `logs.tail`, imleç/sınır ve maksimum bayt denetimleriyle yapılandırılmış gateway dosya günlüğü kuyruğunu döndürür.

  </Accordion>

  <Accordion title="Talk ve TTS">
    - `talk.catalog`, konuşma, akışlı transkripsiyon ve gerçek zamanlı ses için salt okunur Talk sağlayıcı kataloğunu döndürür. Sağlayıcı kimliklerini, etiketleri, yapılandırılma durumunu, açığa çıkarılan model/ses kimliklerini, kanonik modları, aktarımları, beyin stratejilerini ve gerçek zamanlı ses/yetenek bayraklarını içerir; sağlayıcı sırlarını döndürmez veya genel yapılandırmayı değiştirmez.
    - `talk.config`, geçerli Talk yapılandırma yükünü döndürür; `includeSecrets`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.
    - `talk.session.create`, `realtime/gateway-relay`, `transcription/gateway-relay` veya `stt-tts/managed-room` için Gateway sahipliğinde bir Talk oturumu oluşturur. `brain: "direct-tools"`, `operator.admin` gerektirir.
    - `talk.session.join`, yönetilen oda oturum belirtecini doğrular, gerektiğinde `session.ready` veya `session.replaced` olaylarını yayar ve düz metin belirteci ya da saklanan belirteç karması olmadan oda/oturum meta verilerini ve son Talk olaylarını döndürür.
    - `talk.session.appendAudio`, Gateway sahipliğindeki gerçek zamanlı relay ve transkripsiyon oturumlarına base64 PCM giriş sesini ekler.
    - `talk.session.startTurn`, `talk.session.endTurn` ve `talk.session.cancelTurn`, durum temizlenmeden önce eski tur reddiyle yönetilen oda tur yaşam döngüsünü yürütür.
    - `talk.session.cancelOutput`, öncelikle Gateway relay oturumlarında VAD kapılı araya girme için asistan ses çıkışını durdurur.
    - `talk.session.submitToolResult`, Gateway sahipliğindeki gerçek zamanlı relay oturumu tarafından yayılan bir sağlayıcı araç çağrısını tamamlar. Nihai bir sonuç daha sonra gelecekse ara araç çıktısı için `options: { willContinue: true }` iletin veya araç sonucunun başka bir gerçek zamanlı asistan yanıtı başlatmadan sağlayıcı çağrısını karşılaması gerekiyorsa `options: { suppressResponse: true }` iletin.
    - `talk.session.close`, Gateway sahipliğindeki relay, transkripsiyon veya yönetilen oda oturumunu kapatır ve sonlandırıcı Talk olaylarını yayar.
    - `talk.mode`, WebChat/Control UI istemcileri için mevcut Talk modu durumunu ayarlar/yayınlar.
    - `talk.client.create`, Gateway yapılandırma, kimlik bilgileri, talimatlar ve araç politikasının sahibi olurken `webrtc` veya `provider-websocket` kullanarak istemci sahipliğinde gerçek zamanlı bir sağlayıcı oturumu oluşturur.
    - `talk.client.toolCall`, istemci sahipliğindeki gerçek zamanlı aktarımların sağlayıcı araç çağrılarını Gateway politikasına iletmesini sağlar. İlk desteklenen araç `openclaw_agent_consult`’tur; istemciler bir çalıştırma kimliği alır ve sağlayıcıya özgü araç sonucunu göndermeden önce normal sohbet yaşam döngüsü olaylarını bekler.
    - `talk.event`, gerçek zamanlı, transkripsiyon, STT/TTS, yönetilen oda, telefon ve toplantı adaptörleri için tek Talk olay kanalıdır.
    - `talk.speak`, etkin Talk konuşma sağlayıcısı üzerinden konuşma sentezler.
    - `tts.status`, TTS etkin durumunu, etkin sağlayıcıyı, yedek sağlayıcıları ve sağlayıcı yapılandırma durumunu döndürür.
    - `tts.providers`, görünür TTS sağlayıcı envanterini döndürür.
    - `tts.enable` ve `tts.disable`, TTS tercih durumunu açıp kapatır.
    - `tts.setProvider`, tercih edilen TTS sağlayıcısını günceller.
    - `tts.convert`, tek seferlik metinden konuşmaya dönüştürme çalıştırır.

  </Accordion>

  <Accordion title="Sırlar, yapılandırma, güncelleme ve sihirbaz">
    - `secrets.reload`, etkin SecretRef’leri yeniden çözümler ve yalnızca tam başarı durumunda çalışma zamanı sır durumunu değiştirir.
    - `secrets.resolve`, belirli bir komut/hedef kümesi için komut hedefli sır atamalarını çözümler.
    - `config.get`, mevcut yapılandırma anlık görüntüsünü ve karmasını döndürür.
    - `config.set`, doğrulanmış bir yapılandırma yükü yazar.
    - `config.patch`, kısmi bir yapılandırma güncellemesini birleştirir.
    - `config.apply`, tam yapılandırma yükünü doğrular + değiştirir.
    - `config.schema`, Control UI ve CLI araçları tarafından kullanılan canlı yapılandırma şeması yükünü döndürür: şema, `uiHints`, sürüm ve üretim meta verileri; çalışma zamanı yükleyebildiğinde plugin + kanal şeması meta verileri de dahil. Şema, eşleşen alan belgeleri mevcut olduğunda iç içe nesne, joker karakter, dizi öğesi ve `anyOf` / `oneOf` / `allOf` bileşim dalları dahil olmak üzere UI tarafından kullanılan aynı etiketlerden ve yardım metninden türetilmiş alan `title` / `description` meta verilerini içerir.
    - `config.schema.lookup`, tek bir yapılandırma yolu için yol kapsamlı bir arama yükü döndürür: normalleştirilmiş yol, sığ bir şema düğümü, eşleşen ipucu + `hintPath` ve UI/CLI ayrıntı incelemesi için anlık alt özetler. Arama şeması düğümleri kullanıcıya dönük belgeleri ve ortak doğrulama alanlarını (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, sayısal/dize/dizi/nesne sınırları ve `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi bayraklar) korur. Alt özetler `key`, normalleştirilmiş `path`, `type`, `required`, `hasChildren` ile eşleşen `hint` / `hintPath` değerlerini açığa çıkarır.
    - `update.run`, gateway güncelleme akışını çalıştırır ve yalnızca güncellemenin kendisi başarılı olduğunda yeniden başlatma zamanlar; oturumu olan çağıranlar `continuationMessage` ekleyebilir, böylece başlangıç yeniden başlatma devam kuyruğu üzerinden bir takip aracı turunu sürdürür. Paket yöneticisi güncellemeleri, paket değişiminden sonra ertelenmeyen, soğuma süresi olmayan bir güncelleme yeniden başlatmasını zorunlu kılar; böylece eski Gateway süreci değiştirilmiş bir `dist` ağacından tembel yükleme yapmaya devam etmez.
    - `update.status`, mevcut olduğunda yeniden başlatma sonrası çalışan sürüm dahil en son önbelleğe alınmış güncelleme yeniden başlatma sentinel’ini döndürür.
    - `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`, katılım sihirbazını WS RPC üzerinden açığa çıkarır.

  </Accordion>

  <Accordion title="Aracı ve çalışma alanı yardımcıları">
    - `agents.list`, etkili model ve çalışma zamanı meta verileri dahil yapılandırılmış aracı girdilerini döndürür.
    - `agents.create`, `agents.update` ve `agents.delete`, aracı kayıtlarını ve çalışma alanı bağlantılarını yönetir.
    - `agents.files.list`, `agents.files.get` ve `agents.files.set`, bir aracı için açığa çıkarılan önyükleme çalışma alanı dosyalarını yönetir.
    - `tasks.list`, `tasks.get` ve `tasks.cancel`, Gateway görev defterini SDK ve operatör istemcilerine açığa çıkarır.
    - `artifacts.list`, `artifacts.get` ve `artifacts.download`, açık bir `sessionKey`, `runId` veya `taskId` kapsamı için transkriptten türetilmiş artefakt özetlerini ve indirmeleri açığa çıkarır. Çalıştırma ve görev sorguları, sahip olan oturumu sunucu tarafında çözümler ve yalnızca eşleşen kaynak kökenine sahip transkript medyasını döndürür; güvenli olmayan veya yerel URL kaynakları, sunucu tarafında getirilmek yerine desteklenmeyen indirmeler döndürür.
    - `environments.list` ve `environments.status`, SDK istemcileri için salt okunur Gateway yerel ve node ortamı keşfini açığa çıkarır.
    - `agent.identity.get`, bir aracı veya oturum için etkili asistan kimliğini döndürür.
    - `agent.wait`, bir çalıştırmanın bitmesini bekler ve mevcut olduğunda son anlık görüntüyü döndürür.

  </Accordion>

  <Accordion title="Oturum denetimi">
    - `sessions.list`, bir aracı çalışma zamanı arka ucu yapılandırıldığında satır başına `agentRuntime` meta verileri dahil mevcut oturum dizinini döndürür.
    - `sessions.subscribe` ve `sessions.unsubscribe`, mevcut WS istemcisi için oturum değişikliği olay aboneliklerini açıp kapatır.
    - `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`, tek bir oturum için transkript/mesaj olay aboneliklerini açıp kapatır.
    - `sessions.preview`, belirli oturum anahtarları için sınırlı transkript önizlemeleri döndürür.
    - `sessions.describe`, tam bir oturum anahtarı için tek bir Gateway oturum satırı döndürür.
    - `sessions.resolve`, bir oturum hedefini çözümler veya kanonikleştirir.
    - `sessions.create`, yeni bir oturum girdisi oluşturur.
    - `sessions.send`, mevcut bir oturuma mesaj gönderir.
    - `sessions.steer`, etkin bir oturum için kes ve yönlendir varyantıdır.
    - `sessions.abort`, bir oturum için etkin işi iptal eder. Çağıran `key` ve isteğe bağlı `runId` iletebilir veya Gateway’in bir oturuma çözümleyebildiği etkin çalıştırmalar için yalnızca `runId` iletebilir.
    - `sessions.patch`, oturum meta verilerini/geçersiz kılmalarını günceller ve çözümlenen kanonik modeli artı etkili `agentRuntime` değerini bildirir.
    - `sessions.reset`, `sessions.delete` ve `sessions.compact`, oturum bakımını gerçekleştirir.
    - `sessions.get`, tam saklanan oturum satırını döndürür.
    - Sohbet yürütmesi hâlâ `chat.history`, `chat.send`, `chat.abort` ve `chat.inject` kullanır. `chat.history`, UI istemcileri için görüntü-normalize edilmiştir: satır içi yönerge etiketleri görünür metinden çıkarılır, düz metin araç çağrısı XML yükleri (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil) ve sızmış ASCII/tam genişlikli model denetim belirteçleri çıkarılır, tam `NO_REPLY` / `no_reply` gibi saf sessiz belirteç asistan satırları atlanır ve çok büyük satırlar yer tutucularla değiştirilebilir.

  </Accordion>

  <Accordion title="Cihaz eşleme ve cihaz belirteçleri">
    - `device.pair.list`, bekleyen ve onaylanmış eşlenmiş cihazları döndürür.
    - `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`, cihaz eşleme kayıtlarını yönetir.
    - `device.token.rotate`, eşlenmiş bir cihaz belirtecini onaylanmış rolü ve çağıran kapsamı sınırları içinde döndürür.
    - `device.token.revoke`, eşlenmiş bir cihaz belirtecini onaylanmış rolü ve çağıran kapsamı sınırları içinde iptal eder.

  </Accordion>

  <Accordion title="Node eşleme, çağırma ve bekleyen iş">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` ve `node.pair.verify`, node eşlemeyi ve önyükleme doğrulamasını kapsar.
    - `node.list` ve `node.describe`, bilinen/bağlı node durumunu döndürür.
    - `node.rename`, eşlenmiş bir node etiketini günceller.
    - `node.invoke`, bir komutu bağlı bir node’a iletir.
    - `node.invoke.result`, bir çağırma isteğinin sonucunu döndürür.
    - `node.event`, node kaynaklı olayları gateway’e geri taşır.
    - `node.pending.pull` ve `node.pending.ack`, bağlı node kuyruğu API’leridir.
    - `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısı kesilmiş node’lar için dayanıklı bekleyen işi yönetir.

  </Accordion>

  <Accordion title="Onay aileleri">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve `exec.approval.resolve`, tek seferlik exec onay isteklerini ve bekleyen onay arama/yeniden oynatma işlemlerini kapsar.
    - `exec.approval.waitDecision`, bekleyen bir exec onayını bekler ve nihai kararı döndürür (veya zaman aşımında `null`).
    - `exec.approvals.get` ve `exec.approvals.set`, gateway exec onay ilkesi anlık görüntülerini yönetir.
    - `exec.approvals.node.get` ve `exec.approvals.node.set`, node relay komutları üzerinden node-yerel exec onay ilkesini yönetir.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` ve `plugin.approval.resolve`, plugin tarafından tanımlanan onay akışlarını kapsar.

  </Accordion>

  <Accordion title="Otomasyon, Skills ve araçlar">
    - Otomasyon: `wake`, anında veya bir sonraki Heartbeat sırasında wake metin enjeksiyonu planlar; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zamanlanmış işleri yönetir.
    - Skills ve araçlar: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Yaygın olay aileleri

- `chat`: `chat.inject` gibi UI sohbet güncellemeleri ve diğer yalnızca transkript
  sohbet olayları.
- `session.message` ve `session.tool`: abone olunan bir oturum için
  transkript/olay akışı güncellemeleri.
- `sessions.changed`: oturum dizini veya meta verileri değişti.
- `presence`: sistem presence anlık görüntüsü güncellemeleri.
- `tick`: periyodik keepalive / canlılık olayı.
- `health`: Gateway sağlık anlık görüntüsü güncellemesi.
- `heartbeat`: Heartbeat olay akışı güncellemesi.
- `cron`: Cron çalıştırma/iş değişikliği olayı.
- `shutdown`: Gateway kapanma bildirimi.
- `node.pair.requested` / `node.pair.resolved`: node eşleştirme yaşam döngüsü.
- `node.invoke.request`: node invoke isteği yayını.
- `device.pair.requested` / `device.pair.resolved`: eşleştirilmiş cihaz yaşam döngüsü.
- `voicewake.changed`: uyandırma sözcüğü tetikleyici yapılandırması değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onay
  yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin onay
  yaşam döngüsü.

### Node yardımcı yöntemleri

- Node’lar, otomatik izin kontrolleri için geçerli skill yürütülebilirleri
  listesini almak üzere `skills.bins` çağırabilir.

### Görev defteri RPC’leri

Operatör istemcileri, görev defteri RPC’leri aracılığıyla Gateway arka plan görev
kayıtlarını inceleyebilir ve iptal edebilir. Bu yöntemler ham çalışma zamanı
durumu değil, arındırılmış görev özetleri döndürür.

- `tasks.list`, `operator.read` gerektirir.
  - Parametreler: isteğe bağlı `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` veya `"timed_out"`) ya da bu durumların bir dizisi,
    isteğe bağlı `agentId`, isteğe bağlı `sessionKey`, `1` ile
    `500` arasında isteğe bağlı `limit` ve isteğe bağlı string `cursor`.
  - Sonuç: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get`, `operator.read` gerektirir.
  - Parametreler: `{ "taskId": string }`.
  - Sonuç: `{ "task": TaskSummary }`.
  - Eksik görev kimlikleri Gateway not-found hata şeklini döndürür.
- `tasks.cancel`, `operator.write` gerektirir.
  - Parametreler: `{ "taskId": string, "reason"?: string }`.
  - Sonuç:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found`, defterde eşleşen bir görev olup olmadığını bildirir. `cancelled`,
    çalışma zamanının iptali kabul edip etmediğini veya kaydedip kaydetmediğini
    bildirir.

`TaskSummary`, `id`, `status` ve `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, zaman damgaları, ilerleme,
terminal özeti ve arındırılmış hata metni gibi isteğe bağlı meta verileri içerir.

### Operatör yardımcı yöntemleri

- Operatörler, bir ajan için çalışma zamanı komut envanterini almak üzere `commands.list` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan ajan çalışma alanını okumak için atlayın.
  - `scope`, birincil `name` alanının hangi yüzeyi hedeflediğini denetler:
    - `text`, başındaki `/` olmadan birincil metin komutu belirtecini döndürür
    - `native` ve varsayılan `both` yolu, mevcut olduğunda sağlayıcıya duyarlı yerel adları döndürür
  - `textAliases`, `/model` ve `/m` gibi tam slash takma adlarını taşır.
  - `nativeName`, varsa sağlayıcıya duyarlı yerel komut adını taşır.
  - `provider` isteğe bağlıdır ve yalnızca yerel adlandırmayı ve yerel Plugin komutu kullanılabilirliğini etkiler.
  - `includeArgs=false`, yanıttan serileştirilmiş argüman meta verilerini çıkarır.
- Operatörler, bir ajan için çalışma zamanı araç kataloğunu almak üzere `tools.catalog` (`operator.read`) çağırabilir. Yanıt, gruplanmış araçları ve kaynak meta verilerini içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda Plugin sahibi
  - `optional`: bir Plugin aracının isteğe bağlı olup olmadığı
- Operatörler, bir oturum için çalışma zamanında etkili araç envanterini almak üzere `tools.effective` (`operator.read`) çağırabilir.
  - `sessionKey` zorunludur.
  - Gateway, çağıranın sağladığı kimlik doğrulama veya teslim bağlamını kabul etmek yerine güvenilir çalışma zamanı bağlamını oturumdan sunucu tarafında türetir.
  - Yanıt oturum kapsamındadır ve etkin konuşmanın şu anda kullanabildiği çekirdek, Plugin ve kanal araçlarını yansıtır.
- Operatörler, `/tools/invoke` ile aynı Gateway ilke yolundan kullanılabilir bir aracı çağırmak üzere `tools.invoke` (`operator.write`) çağırabilir.
  - `name` zorunludur. `args`, `sessionKey`, `agentId`, `confirm` ve `idempotencyKey` isteğe bağlıdır.
  - Hem `sessionKey` hem de `agentId` varsa, çözümlenen oturum ajanı `agentId` ile eşleşmelidir.
  - Yanıt, `ok`, `toolName`, isteğe bağlı `output` ve tiplendirilmiş `error` alanlarını içeren SDK'ya dönük bir zarftır. Onay veya ilke reddetmeleri, Gateway araç ilke işlem hattını atlamak yerine yük içinde `ok:false` döndürür.
- Operatörler, bir ajan için görünür skill envanterini almak üzere `skills.status` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan ajan çalışma alanını okumak için atlayın.
  - Yanıt, ham gizli değerleri açığa çıkarmadan uygunluk, eksik gereksinimler, yapılandırma kontrolleri ve temizlenmiş kurulum seçenekleri içerir.
- Operatörler, ClawHub keşif meta verileri için `skills.search` ve `skills.detail` (`operator.read`) çağırabilir.
- Operatörler, özel bir skill arşivini kurmadan önce hazırlamak için `skills.upload.begin`, `skills.upload.chunk` ve `skills.upload.commit` (`operator.admin`) çağırabilir. Bu, güvenilir istemciler için ayrı bir yönetici yükleme yoludur; normal ClawHub skill kurulum akışı değildir ve `skills.install.allowUploadedArchives` etkinleştirilmedikçe varsayılan olarak devre dışıdır.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`, bu slug ve force değerine bağlı bir yükleme oluşturur.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })`, baytları tam kodu çözülmüş ofsete ekler.
  - `skills.upload.commit({ uploadId, sha256? })`, son boyutu ve SHA-256'yı doğrular. Commit yalnızca yüklemeyi sonlandırır; skill'i kurmaz.
  - Yüklenen skill arşivleri, kökte `SKILL.md` içeren zip arşivleridir. Arşivin iç dizin adı hiçbir zaman kurulum hedefini seçmez.
- Operatörler, `skills.install` (`operator.admin`) komutunu üç modda çağırabilir:
  - ClawHub modu: `{ source: "clawhub", slug, version?, force? }`, varsayılan ajan çalışma alanındaki `skills/` dizinine bir skill klasörü kurar.
  - Yükleme modu: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`, commit edilmiş bir yüklemeyi varsayılan ajan çalışma alanındaki `skills/<slug>` dizinine kurar. Slug ve force değeri, özgün `skills.upload.begin` isteğiyle eşleşmelidir. Bu mod, `skills.install.allowUploadedArchives` etkin değilse reddedilir. Ayar, ClawHub kurulumlarını etkilemez.
  - Gateway kurucu modu: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`, Gateway ana makinesinde bildirilmiş bir `metadata.openclaw.install` eylemini çalıştırır.
- Operatörler, `skills.update` (`operator.admin`) komutunu iki modda çağırabilir:
  - ClawHub modu, varsayılan ajan çalışma alanında izlenen bir slug'ı veya izlenen tüm ClawHub kurulumlarını günceller.
  - Yapılandırma modu, `enabled`, `apiKey` ve `env` gibi `skills.entries.<skillKey>` değerlerini yamalar.

### `models.list` görünümleri

`models.list`, isteğe bağlı bir `view` parametresi kabul eder:

- Atlanmış veya `"default"`: geçerli çalışma zamanı davranışı. `agents.defaults.models` yapılandırılmışsa yanıt, `provider/*` girdileri için dinamik olarak keşfedilen modeller dahil olmak üzere izin verilen katalogdur. Aksi halde yanıt tam Gateway kataloğudur.
- `"configured"`: seçici boyutunda davranış. `agents.defaults.models` yapılandırılmışsa, `provider/*` girdileri için sağlayıcı kapsamlı keşif dahil olmak üzere yine önceliklidir. İzin listesi olmadan yanıt, açık `models.providers.*.models` girdilerini kullanır ve yalnızca yapılandırılmış model satırı olmadığında tam kataloğa geri döner.
- `"all"`: `agents.defaults.models` değerini atlayarak tam Gateway kataloğu. Bunu normal model seçiciler için değil, tanılama ve keşif kullanıcı arayüzleri için kullanın.

## Exec onayları

- Bir exec isteği onay gerektirdiğinde Gateway `exec.approval.requested` yayınlar.
- Operatör istemcileri, `exec.approval.resolve` çağırarak çözer (`operator.approvals` kapsamı gerektirir).
- `host=node` için `exec.approval.request`, `systemRunPlan` içermelidir (kanonik `argv`/`cwd`/`rawCommand`/oturum meta verileri). `systemRunPlan` eksik olan istekler reddedilir.
- Onaydan sonra, iletilen `node.invoke system.run` çağrıları, bu kanonik `systemRunPlan` değerini yetkili komut/cwd/oturum bağlamı olarak yeniden kullanır.
- Bir çağıran, hazırlama ile son onaylı `system.run` iletimi arasında `command`, `rawCommand`, `cwd`, `agentId` veya `sessionKey` değerini değiştirirse Gateway, değiştirilmiş yüke güvenmek yerine çalıştırmayı reddeder.

## Ajan teslim geri dönüşü

- `agent` istekleri, dışa giden teslimi istemek için `deliver=true` içerebilir.
- `bestEffortDeliver=false` katı davranışı korur: çözümlenemeyen veya yalnızca dahili teslim hedefleri `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici olarak teslim edilebilir bir rota çözümlenemediğinde oturumla sınırlı yürütmeye geri dönüşe izin verir (örneğin dahili/webchat oturumları veya belirsiz çok kanallı yapılandırmalar).
- Nihai `agent` sonuçları, teslim istendiğinde `result.deliveryStatus` içerebilir; bu, [`openclaw agent --json --deliver`](/tr/cli/agent#json-delivery-status) için belgelenen aynı `sent`, `suppressed`, `partial_failed` ve `failed` durumlarını kullanır.

## Sürümleme

- `PROTOCOL_VERSION`, `src/gateway/protocol/version.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu uyumsuzlukları reddeder.
- Şemalar + modeller TypeBox tanımlarından oluşturulur:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### İstemci sabitleri

`src/gateway/client.ts` içindeki referans istemci bu varsayılanları kullanır. Değerler protokol v4 boyunca kararlıdır ve üçüncü taraf istemciler için beklenen temel çizgidir.

| Sabit                                     | Varsayılan                                            | Kaynak                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| İstek zaman aşımı (RPC başına)            | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Ön kimlik doğrulama / connect-challenge zaman aşımı | `15_000` ms                                  | `src/gateway/handshake-timeouts.ts` (yapılandırma/env eşleşen sunucu/istemci bütçesini artırabilir) |
| İlk yeniden bağlanma geri çekilmesi       | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| En yüksek yeniden bağlanma geri çekilmesi | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Aygıt belirteci kapatmasından sonra hızlı yeniden deneme sınırı | `250` ms                         | `src/gateway/client.ts`                                                                    |
| `terminate()` öncesi zorla durdurma ek süresi | `250` ms                                           | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` varsayılan zaman aşımı    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Varsayılan tik aralığı (`hello-ok` öncesi) | `30_000` ms                                          | `src/gateway/client.ts`                                                                    |
| Tik zaman aşımı kapatması                 | sessizlik `tickIntervalMs * 2` değerini aştığında kod `4000` | `src/gateway/client.ts`                                                            |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Sunucu, etkin `policy.tickIntervalMs`, `policy.maxPayload`
ve `policy.maxBufferedBytes` değerlerini `hello-ok` içinde bildirir; istemciler
el sıkışma öncesi varsayılanlar yerine bu değerlere uymalıdır.

## Kimlik Doğrulama

- Paylaşılan gizli anahtar Gateway kimlik doğrulaması, yapılandırılmış kimlik
  doğrulama moduna bağlı olarak `connect.params.auth.token` veya
  `connect.params.auth.password` kullanır.
- Tailscale Serve (`gateway.auth.allowTailscale: true`) veya local loopback olmayan
  `gateway.auth.mode: "trusted-proxy"` gibi kimlik taşıyan modlar, bağlantı
  kimlik doğrulaması denetimini `connect.params.auth.*` yerine istek
  başlıklarından karşılar.
- Özel giriş `gateway.auth.mode: "none"`, paylaşılan gizli anahtar bağlantı
  kimlik doğrulamasını tamamen atlar; bu modu herkese açık/güvenilmeyen girişte
  kullanıma açmayın.
- Eşleştirmeden sonra Gateway, bağlantı rolü + kapsamlarına bağlı bir **aygıt
  belirteci** verir. Bu belirteç `hello-ok.auth.deviceToken` içinde döndürülür
  ve istemci tarafından gelecekteki bağlantılar için kalıcı olarak saklanmalıdır.
- İstemciler, başarılı herhangi bir bağlantıdan sonra birincil
  `hello-ok.auth.deviceToken` değerini kalıcı olarak saklamalıdır.
- Bu **saklanan** aygıt belirteciyle yeniden bağlanma, o belirteç için saklanan
  onaylı kapsam kümesini de yeniden kullanmalıdır. Bu, zaten verilmiş
  okuma/yoklama/durum erişimini korur ve yeniden bağlantıların sessizce daha dar,
  örtük yalnızca-yönetici kapsamına daralmasını önler.
- İstemci tarafı bağlantı kimlik doğrulaması derlemesi (`src/gateway/client.ts`
  içindeki `selectConnectAuth`):
  - `auth.password` bağımsızdır ve ayarlandığında her zaman iletilir.
  - `auth.token` öncelik sırasına göre doldurulur: önce açık paylaşılan belirteç,
    ardından açık `deviceToken`, ardından saklanan aygıt başına belirteç
    (`deviceId` + `role` ile anahtarlanmış).
  - `auth.bootstrapToken`, yalnızca yukarıdakilerden hiçbiri bir `auth.token`
    çözemediğinde gönderilir. Paylaşılan belirteç veya çözülen herhangi bir
    aygıt belirteci bunu bastırır.
  - Tek seferlik `AUTH_TOKEN_MISMATCH` yeniden denemesinde saklanan bir aygıt
    belirtecinin otomatik yükseltilmesi yalnızca **güvenilen uç noktalarla**
    sınırlıdır: loopback veya sabitlenmiş `tlsFingerprint` ile `wss://`. Sabitleme
    olmayan herkese açık `wss://` uygun sayılmaz.
- Ek `hello-ok.auth.deviceTokens` girdileri bootstrap devretme belirteçleridir.
  Bunları yalnızca bağlantı, `wss://` veya loopback/yerel eşleştirme gibi
  güvenilen bir aktarım üzerinde bootstrap kimlik doğrulaması kullandığında
  kalıcı olarak saklayın.
- Bir istemci **açık** `deviceToken` veya açık `scopes` sağlarsa, çağıranın
  istediği bu kapsam kümesi yetkili olmaya devam eder; önbelleğe alınan
  kapsamlar yalnızca istemci saklanan aygıt başına belirteci yeniden
  kullandığında yeniden kullanılır.
- Aygıt belirteçleri `device.token.rotate` ve `device.token.revoke` ile
  döndürülebilir/iptal edilebilir (`operator.pairing` kapsamı gerekir).
- `device.token.rotate` döndürme meta verisi döndürür. Yedek taşıyıcı belirteci
  yalnızca zaten o aygıt belirteciyle kimliği doğrulanmış aynı aygıt çağrıları
  için yansıtır; böylece yalnızca belirteç kullanan istemciler yeniden
  bağlanmadan önce yedeklerini kalıcı olarak saklayabilir. Paylaşılan/yönetici
  döndürmeleri taşıyıcı belirteci yansıtmaz.
- Belirteç verilmesi, döndürülmesi ve iptali, o aygıtın eşleştirme girdisinde
  kayıtlı onaylı rol kümesiyle sınırlı kalır; belirteç değişikliği, eşleştirme
  onayının hiç vermediği bir aygıt rolünü genişletemez veya hedefleyemez.
- Eşleştirilmiş aygıt belirteci oturumlarında, çağıranda `operator.admin` da
  yoksa aygıt yönetimi kendi kapsamıyla sınırlıdır: yönetici olmayan çağıranlar
  yalnızca **kendi** aygıt girdilerini kaldırabilir/iptal edebilir/döndürebilir.
- `device.token.rotate` ve `device.token.revoke`, hedef operatör belirteci kapsam
  kümesini çağıranın geçerli oturum kapsamlarına karşı da denetler. Yönetici
  olmayan çağıranlar, halihazırda sahip olduklarından daha geniş bir operatör
  belirtecini döndüremez veya iptal edemez.
- Kimlik doğrulama hataları, kurtarma ipuçlarıyla birlikte `error.details.code`
  içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilen istemciler, önbelleğe alınmış aygıt başına belirteçle sınırlı bir
    yeniden deneme yapabilir.
  - Bu yeniden deneme başarısız olursa, istemciler otomatik yeniden bağlanma
    döngülerini durdurmalı ve operatör eylemi rehberliğini göstermelidir.

## Aygıt kimliği + eşleştirme

- Node'lar, anahtar çifti parmak izinden türetilen kararlı bir aygıt kimliği
  (`device.id`) içermelidir.
- Gateway'ler aygıt + rol başına belirteç verir.
- Yerel otomatik onay etkin değilse yeni aygıt kimlikleri için eşleştirme
  onayları gerekir.
- Eşleştirme otomatik onayı, doğrudan local loopback bağlantıları etrafında
  merkezlenir.
- OpenClaw ayrıca güvenilen paylaşılan gizli anahtar yardımcı akışları için dar
  bir arka uç/konteyner-yerel kendi kendine bağlanma yoluna sahiptir.
- Aynı ana bilgisayar tailnet veya LAN bağlantıları, eşleştirme açısından hâlâ
  uzak olarak ele alınır ve onay gerektirir.
- WS istemcileri normalde `connect` sırasında `device` kimliği içerir (operatör +
  node). Tek aygıtsız operatör istisnaları açık güven yollarıdır:
  - localhost'a özel güvenli olmayan HTTP uyumluluğu için `gateway.controlUi.allowInsecureAuth=true`.
  - başarılı `gateway.auth.mode: "trusted-proxy"` operatör Control UI kimlik doğrulaması.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (son çare, ciddi güvenlik düşürmesi).
  - paylaşılan Gateway belirteci/parolasıyla kimliği doğrulanmış doğrudan-loopback
    `gateway-client` arka uç RPC'leri.
- Tüm bağlantılar, sunucu tarafından sağlanan `connect.challenge` nonce değerini
  imzalamalıdır.

### Aygıt kimlik doğrulaması geçiş tanılamaları

Hâlâ challenge öncesi imzalama davranışı kullanan eski istemciler için `connect`
artık kararlı bir `error.details.reason` ile `error.details.code` altında
`DEVICE_AUTH_*` ayrıntı kodları döndürür.

Yaygın geçiş hataları:

| İleti                       | details.code                     | details.reason           | Anlam                                              |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | İstemci `device.nonce` değerini atladı (veya boş gönderdi). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | İstemci eski/yanlış bir nonce ile imzaladı.        |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | İmza yükü v2 yüküyle eşleşmiyor.                  |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | İmzalı zaman damgası izin verilen sapmanın dışında. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`, açık anahtar parmak iziyle eşleşmiyor. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Açık anahtar biçimi/kanonikleştirmesi başarısız oldu. |

Geçiş hedefi:

- Her zaman `connect.challenge` bekleyin.
- Sunucu nonce değerini içeren v2 yükünü imzalayın.
- Aynı nonce değerini `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza yükü `v3` değeridir; bu, aygıt/istemci/rol/kapsamlar/belirteç/nonce
  alanlarına ek olarak `platform` ve `deviceFamily` değerlerini bağlar.
- Eski `v2` imzaları uyumluluk için kabul edilmeye devam eder, ancak eşleştirilmiş
  aygıt meta verisi sabitlemesi yeniden bağlanmada komut politikasını hâlâ
  denetler.

## TLS + sabitleme

- TLS, WS bağlantıları için desteklenir.
- İstemciler isteğe bağlı olarak Gateway sertifika parmak izini sabitleyebilir
  (`gateway.tls` yapılandırmasına ek olarak `gateway.remote.tlsFingerprint`
  veya CLI `--tls-fingerprint` bölümüne bakın).

## Kapsam

Bu protokol **tam Gateway API**'sini açığa çıkarır (durum, kanallar, modeller, sohbet,
ajan, oturumlar, node'lar, onaylar vb.). Kesin yüzey
`src/gateway/protocol/schema.ts` içindeki TypeBox şemaları tarafından tanımlanır.

## İlgili

- [Bridge protokolü](/tr/gateway/bridge-protocol)
- [Gateway çalışma kitabı](/tr/gateway)
