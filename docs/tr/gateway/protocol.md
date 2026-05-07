---
read_when:
    - Gateway WS istemcilerini uygulama veya güncelleme
    - Protokol uyumsuzluklarını veya bağlantı hatalarını ayıklama
    - Protokol şemasını/modellerini yeniden oluşturma
summary: 'Gateway WebSocket protokolü: el sıkışma, çerçeveler, sürümleme'
title: Gateway protokolü
x-i18n:
    generated_at: "2026-05-07T13:18:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75580b3ad8b2a511cf53975b8d734d18db88bcbfe33bd62c360c24333d65d1c6
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protokolü, OpenClaw için **tek kontrol düzlemi + node taşımasıdır**. Tüm istemciler (CLI, web UI, macOS uygulaması, iOS/Android node'ları, başsız node'lar) WebSocket üzerinden bağlanır ve el sıkışma sırasında **rollerini** + **kapsamlarını** bildirir.

## Taşıma

- WebSocket, JSON yükleri içeren metin çerçeveleri.
- İlk çerçeve **mutlaka** bir `connect` isteği olmalıdır.
- Bağlantı öncesi çerçeveler 64 KiB ile sınırlıdır. Başarılı bir el sıkışmadan sonra istemciler `hello-ok.policy.maxPayload` ve `hello-ok.policy.maxBufferedBytes` sınırlarına uymalıdır. Tanılama etkinleştirildiğinde, aşırı büyük gelen çerçeveler ve yavaş giden arabellekler, gateway etkilenen çerçeveyi kapatmadan veya düşürmeden önce `payload.large` olayları yayar. Bu olaylar boyutları, sınırları, yüzeyleri ve güvenli neden kodlarını tutar. İleti gövdesini, ek içeriklerini, ham çerçeve gövdesini, token'ları, çerezleri veya gizli değerleri tutmazlar.

## El Sıkışma (connect)

Gateway → İstemci (bağlantı öncesi sorgu):

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

Gateway hâlâ başlangıç yan bileşenlerini tamamlıyorken, `connect` isteği `details.reason` değeri `"startup-sidecars"` olarak ayarlanmış ve `retryAfterMs` içeren yeniden denenebilir bir `UNAVAILABLE` hatası döndürebilir. İstemciler bu yanıtı sonlandırıcı bir el sıkışma hatası olarak göstermek yerine genel bağlantı bütçeleri içinde yeniden denemelidir.

`server`, `features`, `snapshot` ve `policy` şema tarafından zorunlu tutulur (`src/gateway/protocol/schema/frames.ts`). `auth` da zorunludur ve üzerinde anlaşılmış rol/kapsamları bildirir. `pluginSurfaceUrls` isteğe bağlıdır ve `canvas` gibi Plugin yüzeyi adlarını kapsamlı barındırılan URL'lere eşler.

Kapsamlı Plugin yüzeyi URL'lerinin süresi dolabilir. Node'lar, `pluginSurfaceUrls` içinde yeni bir giriş almak için `{ "surface": "canvas" }` ile `node.pluginSurface.refresh` çağırabilir. Deneysel Canvas Plugin yeniden düzenlemesi, kullanım dışı bırakılmış `canvasHostUrl`, `canvasCapability` veya `node.canvas.capability.refresh` uyumluluk yolunu desteklemez; güncel yerel istemciler ve gateway'ler Plugin yüzeylerini kullanmalıdır.

Cihaz token'ı verilmediğinde, `hello-ok.auth` token alanları olmadan üzerinde anlaşılmış izinleri bildirir:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilir aynı süreç arka uç istemcileri (`client.id: "gateway-client"`, `client.mode: "backend"`), paylaşılan gateway token'ı/parolasıyla kimlik doğruladıklarında doğrudan loopback bağlantılarında `device` alanını atlayabilir. Bu yol, dahili kontrol düzlemi RPC'leri için ayrılmıştır ve eski CLI/cihaz eşleştirme temel değerlerinin alt ajan oturum güncellemeleri gibi yerel arka uç işlerini engellemesini önler. Uzak istemciler, tarayıcı kaynaklı istemciler, node istemcileri ve açık cihaz token'ı/cihaz kimliği istemcileri normal eşleştirme ve kapsam yükseltme kontrollerini kullanmaya devam eder.

Bir cihaz token'ı verildiğinde, `hello-ok` ayrıca şunu içerir:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilir bootstrap devri sırasında, `hello-ok.auth` ayrıca `deviceTokens` içinde ek sınırlı rol girişleri de içerebilir:

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

Yerleşik node/operatör bootstrap akışı için birincil node token'ı `scopes: []` olarak kalır ve devredilen tüm operatör token'ları bootstrap operatör izin listesiyle (`operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`) sınırlı kalır. Bootstrap kapsam kontrolleri rol önekli kalır: operatör girişleri yalnızca operatör isteklerini karşılar ve operatör olmayan roller hâlâ kendi rol önekleri altında kapsamlara ihtiyaç duyar.

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

Yan etki oluşturan yöntemler **idempotency anahtarları** gerektirir (şemaya bakın).

## Roller + kapsamlar

Tam operatör kapsam modeli, onay zamanı kontrolleri ve paylaşılan gizli anahtar semantiği için [Operatör kapsamları](/tr/gateway/operator-scopes) bölümüne bakın.

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

`includeSecrets: true` ile `talk.config`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.

Plugin tarafından kaydedilmiş gateway RPC yöntemleri kendi operatör kapsamlarını isteyebilir, ancak ayrılmış çekirdek yönetici önekleri (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) her zaman `operator.admin` değerine çözümlenir.

Yöntem kapsamı yalnızca ilk kapıdır. `chat.send` üzerinden ulaşılan bazı eğik çizgi komutları bunun üzerine daha sıkı komut düzeyi kontroller uygular. Örneğin, kalıcı `/config set` ve `/config unset` yazmaları `operator.admin` gerektirir.

`node.pair.approve` ayrıca temel yöntem kapsamının üzerine ek bir onay zamanı kapsam kontrolüne sahiptir:

- komutsuz istekler: `operator.pairing`
- exec olmayan node komutları içeren istekler: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which` içeren istekler: `operator.pairing` + `operator.admin`

### Yetenekler/komutlar/izinler (node)

Node'lar bağlantı sırasında yetenek iddialarını bildirir:

- `caps`: `camera`, `canvas`, `screen`, `location`, `voice` ve `talk` gibi üst düzey yetenek kategorileri.
- `commands`: çağırma için komut izin listesi.
- `permissions`: ayrıntılı açma/kapama değerleri (örn. `screen.record`, `camera.capture`).

Gateway bunları **iddia** olarak ele alır ve sunucu tarafı izin listelerini uygular.

## Varlık

- `system-presence`, cihaz kimliğine göre anahtarlanmış girişler döndürür.
- Varlık girişleri `deviceId`, `roles` ve `scopes` içerir; böylece UI'lar hem **operator** hem de **node** olarak bağlandığında bile cihaz başına tek bir satır gösterebilir.
- `node.list`, isteğe bağlı `lastSeenAtMs` ve `lastSeenReason` alanlarını içerir. Bağlı node'lar geçerli bağlantı zamanlarını `connect` nedeniyle `lastSeenAtMs` olarak bildirir; eşlenmiş node'lar, güvenilir bir node olayı eşleştirme meta verilerini güncellediğinde kalıcı arka plan varlığı da bildirebilir.

### Node arka plan canlı olayı

Node'lar, eşlenmiş bir node'un arka plan uyanışı sırasında bağlı olarak işaretlenmeden canlı olduğunu kaydetmek için `event: "node.presence.alive"` ile `node.event` çağırabilir.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` kapalı bir enum'dur: `background`, `silent_push`, `bg_app_refresh`, `significant_location`, `manual` veya `connect`. Bilinmeyen trigger dizeleri kalıcılaştırmadan önce gateway tarafından `background` olarak normalleştirilir. Olay yalnızca kimliği doğrulanmış node cihaz oturumları için kalıcıdır; cihazsız veya eşlenmemiş oturumlar `handled: false` döndürür.

Başarılı gateway'ler yapılandırılmış bir sonuç döndürür:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Eski gateway'ler `node.event` için hâlâ `{ "ok": true }` döndürebilir; istemciler bunu kalıcı varlık kalıcılaştırması olarak değil, onaylanmış bir RPC olarak ele almalıdır.

## Yayın olayı kapsamlandırması

Sunucu tarafından gönderilen WebSocket yayın olayları kapsam kapılıdır; böylece eşleştirme kapsamlı veya yalnızca node oturumları oturum içeriğini pasif olarak almaz.

- **Sohbet, ajan ve araç sonucu çerçeveleri** (akışlı `agent` olayları ve araç çağrısı sonuçları dahil) en az `operator.read` gerektirir. `operator.read` olmayan oturumlar bu çerçeveleri tamamen atlar.
- **Plugin tanımlı `plugin.*` yayınları**, Plugin'in bunları nasıl kaydettiğine bağlı olarak `operator.write` veya `operator.admin` ile kapılanır.
- **Durum ve taşıma olayları** (`heartbeat`, `presence`, `tick`, bağlantı/bağlantı kesme yaşam döngüsü vb.) sınırsız kalır; böylece taşıma sağlığı her kimliği doğrulanmış oturum tarafından gözlemlenebilir kalır.
- **Bilinmeyen yayın olayı aileleri**, kayıtlı bir işleyici açıkça gevşetmediği sürece varsayılan olarak kapsam kapılıdır (kapalı hata).

Her istemci bağlantısı kendi istemci başına sıra numarasını tutar; böylece farklı istemciler olay akışının farklı kapsam filtreli alt kümelerini görse bile yayınlar o sokette monoton sıralamayı korur.

## Yaygın RPC yöntem aileleri

Genel WS yüzeyi, yukarıdaki el sıkışma/kimlik doğrulama örneklerinden daha geniştir. Bu üretilmiş bir döküm değildir — `hello-ok.features.methods`, yüklenen Plugin/kanal yöntem dışa aktarımlarına ek olarak `src/gateway/server-methods-list.ts` üzerinden oluşturulan tutucu bir keşif listesidir. Bunu `src/gateway/server-methods/*.ts` için tam bir numaralandırma değil, özellik keşfi olarak ele alın.

<AccordionGroup>
  <Accordion title="Sistem ve kimlik">
    - `health`, önbelleğe alınmış veya yeni yoklanmış gateway sağlık anlık görüntüsünü döndürür.
    - `diagnostics.stability`, son sınırlı tanılama kararlılığı kaydedicisini döndürür. Olay adları, sayılar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/Plugin adları ve oturum kimlikleri gibi operasyonel meta verileri tutar. Sohbet metnini, webhook gövdelerini, araç çıktılarını, ham istek veya yanıt gövdelerini, token'ları, çerezleri veya gizli değerleri tutmaz. Operatör okuma kapsamı gereklidir.
    - `status`, `/status` tarzı gateway özetini döndürür; hassas alanlar yalnızca yönetici kapsamlı operatör istemcileri için dahil edilir.
    - `gateway.identity.get`, relay ve eşleştirme akışları tarafından kullanılan gateway cihaz kimliğini döndürür.
    - `system-presence`, bağlı operatör/node cihazları için geçerli varlık anlık görüntüsünü döndürür.
    - `system-event`, bir sistem olayı ekler ve varlık bağlamını güncelleyebilir/yayınlayabilir.
    - `last-heartbeat`, en son kalıcılaştırılmış Heartbeat olayını döndürür.
    - `set-heartbeats`, gateway üzerinde Heartbeat işlemeyi açıp kapatır.

  </Accordion>

  <Accordion title="Modeller ve kullanım">
    - `models.list`, çalışma zamanında izin verilen model kataloğunu döndürür. Seçici boyutundaki yapılandırılmış modeller için (`agents.defaults.models` önce, ardından `models.providers.*.models`) `{ "view": "configured" }` iletin veya tam katalog için `{ "view": "all" }` iletin.
    - `usage.status`, sağlayıcı kullanım pencerelerini/kalan kota özetlerini döndürür.
    - `usage.cost`, bir tarih aralığı için toplu maliyet kullanım özetlerini döndürür.
    - `doctor.memory.status`, etkin varsayılan ajan çalışma alanı için vektör belleği / önbelleğe alınmış embedding hazırlığını döndürür. Yalnızca çağıran açıkça canlı bir embedding sağlayıcısı ping'i istediğinde `{ "probe": true }` veya `{ "deep": true }` iletin.
    - `doctor.memory.remHarness`, uzaktan kontrol düzlemi istemcileri için sınırlı, salt okunur bir REM harness önizlemesi döndürür. Çalışma alanı yollarını, bellek parçacıklarını, işlenmiş dayanaklı markdown'u ve derin terfi adaylarını içerebilir; bu nedenle çağıranların `operator.read` iznine ihtiyacı vardır.
    - `sessions.usage`, oturum başına kullanım özetlerini döndürür.
    - `sessions.usage.timeseries`, bir oturum için zaman serisi kullanımını döndürür.
    - `sessions.usage.logs`, bir oturum için kullanım günlüğü girdilerini döndürür.

  </Accordion>

  <Accordion title="Kanallar ve oturum açma yardımcıları">
    - `channels.status`, yerleşik + paketlenmiş kanal/plugin durum özetlerini döndürür.
    - `channels.logout`, kanalın oturumu kapatmayı desteklediği belirli bir kanal/hesap için oturumu kapatır.
    - `web.login.start`, geçerli QR destekli web kanalı sağlayıcısı için bir QR/web oturum açma akışı başlatır.
    - `web.login.wait`, bu QR/web oturum açma akışının tamamlanmasını bekler ve başarı durumunda kanalı başlatır.
    - `push.test`, kayıtlı bir iOS Node'una test APNs push bildirimi gönderir.
    - `voicewake.get`, saklanan uyandırma sözcüğü tetikleyicilerini döndürür.
    - `voicewake.set`, uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayınlar.

  </Accordion>

  <Accordion title="Mesajlaşma ve günlükler">
    - `send`, sohbet çalıştırıcısının dışında kanal/hesap/konu hedefli gönderimler için doğrudan giden teslimat RPC'sidir.
    - `logs.tail`, imleç/sınır ve maksimum bayt denetimleriyle yapılandırılmış gateway dosya günlüğü kuyruğunu döndürür.

  </Accordion>

  <Accordion title="Konuşma ve TTS">
    - `talk.catalog`, konuşma, akışlı transkripsiyon ve gerçek zamanlı ses için salt okunur Talk sağlayıcı kataloğunu döndürür. Sağlayıcı kimliklerini, etiketleri, yapılandırılmış durumu, açığa çıkarılmış model/ses kimliklerini, kanonik modları, aktarımları, beyin stratejilerini ve gerçek zamanlı ses/yetenek bayraklarını içerir; sağlayıcı sırlarını döndürmez veya genel yapılandırmayı değiştirmez.
    - `talk.config`, etkili Talk yapılandırma yükünü döndürür; `includeSecrets`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.
    - `talk.session.create`, `realtime/gateway-relay`, `transcription/gateway-relay` veya `stt-tts/managed-room` için Gateway'in sahip olduğu bir Talk oturumu oluşturur. `brain: "direct-tools"` için `operator.admin` gerekir.
    - `talk.session.join`, yönetilen oda oturum belirtecini doğrular, gerektiğinde `session.ready` veya `session.replaced` olaylarını yayar ve düz metin belirteci ya da saklanan belirteç karması olmadan oda/oturum meta verilerini ve son Talk olaylarını döndürür.
    - `talk.session.appendAudio`, Gateway'in sahip olduğu gerçek zamanlı relay ve transkripsiyon oturumlarına base64 PCM giriş sesi ekler.
    - `talk.session.startTurn`, `talk.session.endTurn` ve `talk.session.cancelTurn`, durum temizlenmeden önce eski tur reddiyle yönetilen oda tur yaşam döngüsünü yürütür.
    - `talk.session.cancelOutput`, öncelikle Gateway relay oturumlarında VAD kapılı araya girme için asistan ses çıkışını durdurur.
    - `talk.session.submitToolResult`, Gateway'in sahip olduğu gerçek zamanlı relay oturumu tarafından yayılan bir sağlayıcı araç çağrısını tamamlar.
    - `talk.session.close`, Gateway'in sahip olduğu relay, transkripsiyon veya yönetilen oda oturumunu kapatır ve son Talk olaylarını yayar.
    - `talk.mode`, WebChat/Control UI istemcileri için geçerli Talk modu durumunu ayarlar/yayınlar.
    - `talk.client.create`, Gateway yapılandırma, kimlik bilgileri, talimatlar ve araç politikasına sahipken `webrtc` veya `provider-websocket` kullanarak istemcinin sahip olduğu gerçek zamanlı sağlayıcı oturumu oluşturur.
    - `talk.client.toolCall`, istemcinin sahip olduğu gerçek zamanlı aktarımların sağlayıcı araç çağrılarını Gateway politikasına iletmesine olanak tanır. Desteklenen ilk araç `openclaw_agent_consult` aracıdır; istemciler sağlayıcıya özgü araç sonucunu göndermeden önce bir çalıştırma kimliği alır ve normal sohbet yaşam döngüsü olaylarını bekler.
    - `talk.event`, gerçek zamanlı, transkripsiyon, STT/TTS, yönetilen oda, telefon ve toplantı bağdaştırıcıları için tek Talk olay kanalıdır.
    - `talk.speak`, etkin Talk konuşma sağlayıcısı üzerinden konuşma sentezler.
    - `tts.status`, TTS etkin durumunu, etkin sağlayıcıyı, yedek sağlayıcıları ve sağlayıcı yapılandırma durumunu döndürür.
    - `tts.providers`, görünür TTS sağlayıcı envanterini döndürür.
    - `tts.enable` ve `tts.disable`, TTS tercihleri durumunu açıp kapatır.
    - `tts.setProvider`, tercih edilen TTS sağlayıcısını günceller.
    - `tts.convert`, tek seferlik metinden konuşmaya dönüştürme çalıştırır.

  </Accordion>

  <Accordion title="Sırlar, yapılandırma, güncelleme ve sihirbaz">
    - `secrets.reload`, etkin SecretRef'leri yeniden çözümler ve çalışma zamanı sır durumunu yalnızca tam başarı durumunda değiştirir.
    - `secrets.resolve`, belirli bir komut/hedef kümesi için komut hedefli sır atamalarını çözümler.
    - `config.get`, geçerli yapılandırma anlık görüntüsünü ve karmayı döndürür.
    - `config.set`, doğrulanmış bir yapılandırma yükü yazar.
    - `config.patch`, kısmi bir yapılandırma güncellemesini birleştirir.
    - `config.apply`, tam yapılandırma yükünü doğrular + değiştirir.
    - `config.schema`, Control UI ve CLI araçlarının kullandığı canlı yapılandırma şeması yükünü döndürür: şema, `uiHints`, sürüm ve oluşturma meta verileri; çalışma zamanı yükleyebildiğinde plugin + kanal şeması meta verileri dahil. Şema, eşleşen alan dokümantasyonu bulunduğunda iç içe nesne, joker karakter, dizi öğesi ve `anyOf` / `oneOf` / `allOf` bileşim dalları dahil olmak üzere UI tarafından kullanılan aynı etiketlerden ve yardım metninden türetilen alan `title` / `description` meta verilerini içerir.
    - `config.schema.lookup`, bir yapılandırma yolu için yol kapsamlı bir arama yükü döndürür: normalleştirilmiş yol, sığ bir şema düğümü, eşleşen ipucu + `hintPath` ve UI/CLI ayrıntıya inme için doğrudan alt özetler. Arama şeması düğümleri kullanıcıya dönük dokümanları ve yaygın doğrulama alanlarını (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, sayısal/dize/dizi/nesne sınırları ve `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi bayraklar) korur. Alt özetler `key`, normalleştirilmiş `path`, `type`, `required`, `hasChildren` ile eşleşen `hint` / `hintPath` değerlerini açığa çıkarır.
    - `update.run`, gateway güncelleme akışını çalıştırır ve yalnızca güncellemenin kendisi başarılı olduğunda yeniden başlatma zamanlar; oturumu olan çağıranlar `continuationMessage` ekleyebilir, böylece başlangıç yeniden başlatma devam kuyruğu üzerinden bir takip ajan turunu sürdürür. Paket yöneticisi güncellemeleri, paket değişimi sonrasında eski Gateway sürecinin değiştirilmiş bir `dist` ağacından tembel yükleme yapmayı sürdürmemesi için ertelenmeyen, bekleme süresiz bir güncelleme yeniden başlatmasını zorunlu kılar.
    - `update.status`, kullanılabiliyorsa yeniden başlatma sonrası çalışan sürüm dahil olmak üzere en son önbelleğe alınmış güncelleme yeniden başlatma işaretçisini döndürür.
    - `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`, işe alıştırma sihirbazını WS RPC üzerinden açığa çıkarır.

  </Accordion>

  <Accordion title="Ajan ve çalışma alanı yardımcıları">
    - `agents.list`, etkili model ve çalışma zamanı meta verileri dahil olmak üzere yapılandırılmış ajan girdilerini döndürür.
    - `agents.create`, `agents.update` ve `agents.delete`, ajan kayıtlarını ve çalışma alanı bağlantılarını yönetir.
    - `agents.files.list`, `agents.files.get` ve `agents.files.set`, bir ajan için açığa çıkarılan önyükleme çalışma alanı dosyalarını yönetir.
    - `artifacts.list`, `artifacts.get` ve `artifacts.download`, açık bir `sessionKey`, `runId` veya `taskId` kapsamı için transkriptten türetilmiş yapıt özetlerini ve indirmeleri açığa çıkarır. Çalıştırma ve görev sorguları, sahip oturumu sunucu tarafında çözümler ve yalnızca eşleşen kökene sahip transkript medyasını döndürür; güvenli olmayan veya yerel URL kaynakları, sunucu tarafında getirilmek yerine desteklenmeyen indirmeler döndürür.
    - `environments.list` ve `environments.status`, SDK istemcileri için salt okunur Gateway yerel ve Node ortam keşfini açığa çıkarır.
    - `agent.identity.get`, bir ajan veya oturum için etkili asistan kimliğini döndürür.
    - `agent.wait`, bir çalıştırmanın bitmesini bekler ve kullanılabiliyorsa son anlık görüntüyü döndürür.

  </Accordion>

  <Accordion title="Oturum denetimi">
    - `sessions.list`, bir ajan çalışma zamanı arka ucu yapılandırıldığında satır başına `agentRuntime` meta verileri dahil olmak üzere geçerli oturum dizinini döndürür.
    - `sessions.subscribe` ve `sessions.unsubscribe`, geçerli WS istemcisi için oturum değişikliği olay aboneliklerini açıp kapatır.
    - `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`, bir oturum için transkript/mesaj olay aboneliklerini açıp kapatır.
    - `sessions.preview`, belirli oturum anahtarları için sınırlı transkript önizlemeleri döndürür.
    - `sessions.describe`, tam bir oturum anahtarı için bir Gateway oturum satırı döndürür.
    - `sessions.resolve`, bir oturum hedefini çözümler veya kanonikleştirir.
    - `sessions.create`, yeni bir oturum girdisi oluşturur.
    - `sessions.send`, mevcut bir oturuma mesaj gönderir.
    - `sessions.steer`, etkin bir oturum için kesme ve yönlendirme varyantıdır.
    - `sessions.abort`, bir oturum için etkin işi iptal eder. Çağıran, `key` artı isteğe bağlı `runId` iletebilir veya Gateway'in bir oturuma çözümleyebildiği etkin çalıştırmalar için yalnızca `runId` iletebilir.
    - `sessions.patch`, oturum meta verilerini/geçersiz kılmalarını günceller ve çözümlenen kanonik modeli artı etkili `agentRuntime` değerini bildirir.
    - `sessions.reset`, `sessions.delete` ve `sessions.compact`, oturum bakımını gerçekleştirir.
    - `sessions.get`, saklanan tam oturum satırını döndürür.
    - Sohbet yürütmesi hâlâ `chat.history`, `chat.send`, `chat.abort` ve `chat.inject` kullanır. `chat.history`, UI istemcileri için görüntü normalleştirmelidir: satır içi yönerge etiketleri görünür metinden kaldırılır, düz metin araç çağrısı XML yükleri (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil) ve sızmış ASCII/tam genişlikli model denetim belirteçleri kaldırılır, tam `NO_REPLY` / `no_reply` gibi saf sessiz belirteçli asistan satırları atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir.

  </Accordion>

  <Accordion title="Cihaz eşleştirme ve cihaz belirteçleri">
    - `device.pair.list`, bekleyen ve onaylanmış eşleştirilmiş cihazları döndürür.
    - `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`, cihaz eşleştirme kayıtlarını yönetir.
    - `device.token.rotate`, eşleştirilmiş bir cihaz belirtecini onaylanmış rolü ve çağıran kapsamı sınırları içinde döndürür.
    - `device.token.revoke`, eşleştirilmiş bir cihaz belirtecini onaylanmış rolü ve çağıran kapsamı sınırları içinde iptal eder.

  </Accordion>

  <Accordion title="Node eşleştirme, çağırma ve bekleyen iş">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` ve `node.pair.verify`, Node eşleştirmeyi ve önyükleme doğrulamasını kapsar.
    - `node.list` ve `node.describe`, bilinen/bağlı Node durumunu döndürür.
    - `node.rename`, eşleştirilmiş bir Node etiketini günceller.
    - `node.invoke`, bağlı bir Node'a komut iletir.
    - `node.invoke.result`, bir çağırma isteği için sonucu döndürür.
    - `node.event`, Node kaynaklı olayları gateway'e geri taşır.
    - `node.pending.pull` ve `node.pending.ack`, bağlı Node kuyruğu API'leridir.
    - `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısı kesilmiş Node'lar için dayanıklı bekleyen işi yönetir.

  </Accordion>

  <Accordion title="Onay aileleri">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve `exec.approval.resolve`, tek seferlik exec onay isteklerini ve bekleyen onay arama/yeniden oynatmayı kapsar.
    - `exec.approval.waitDecision`, bekleyen bir exec onayını bekler ve son kararı döndürür (veya zaman aşımında `null`).
    - `exec.approvals.get` ve `exec.approvals.set`, gateway exec onay ilkesi anlık görüntülerini yönetir.
    - `exec.approvals.node.get` ve `exec.approvals.node.set`, node relay komutları üzerinden node yerel exec onay ilkesini yönetir.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` ve `plugin.approval.resolve`, Plugin tarafından tanımlanan onay akışlarını kapsar.

  </Accordion>

  <Accordion title="Otomasyon, Skills ve araçlar">
    - Otomasyon: `wake`, anında veya bir sonraki Heartbeat'te wake metin enjeksiyonu zamanlar; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zamanlanmış işleri yönetir.
    - Skills ve araçlar: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Yaygın olay aileleri

- `chat`: `chat.inject` gibi UI sohbet güncellemeleri ve diğer yalnızca transkript
  sohbet olayları.
- `session.message` ve `session.tool`: abone olunan bir oturum için
  transkript/olay akışı güncellemeleri.
- `sessions.changed`: oturum dizini veya meta veriler değişti.
- `presence`: sistem varlık anlık görüntüsü güncellemeleri.
- `tick`: periyodik keepalive / canlılık olayı.
- `health`: gateway sağlık anlık görüntüsü güncellemesi.
- `heartbeat`: Heartbeat olay akışı güncellemesi.
- `cron`: Cron çalıştırma/iş değişikliği olayı.
- `shutdown`: gateway kapatma bildirimi.
- `node.pair.requested` / `node.pair.resolved`: node eşleştirme yaşam döngüsü.
- `node.invoke.request`: node çağırma isteği yayını.
- `device.pair.requested` / `device.pair.resolved`: eşleştirilmiş cihaz yaşam döngüsü.
- `voicewake.changed`: wake-word tetikleyici yapılandırması değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onay
  yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin onayı
  yaşam döngüsü.

### Node yardımcı yöntemleri

- Node'lar, otomatik izin kontrolleri için geçerli skill yürütülebilirleri listesini
  almak üzere `skills.bins` çağırabilir.

### Operatör yardımcı yöntemleri

- Operatörler, bir agent için çalışma zamanı komut envanterini almak üzere
  `commands.list` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan agent çalışma alanını okumak için atlayın.
  - `scope`, birincil `name` hedefinin hangi yüzeyi hedeflediğini denetler:
    - `text`, başındaki `/` olmadan birincil metin komutu belirtecini döndürür
    - `native` ve varsayılan `both` yolu, mevcut olduğunda sağlayıcıya duyarlı yerel adları
      döndürür
  - `textAliases`, `/model` ve `/m` gibi tam slash takma adlarını taşır.
  - `nativeName`, varsa sağlayıcıya duyarlı yerel komut adını taşır.
  - `provider` isteğe bağlıdır ve yalnızca yerel adlandırmayı ve yerel Plugin
    komut kullanılabilirliğini etkiler.
  - `includeArgs=false`, yanıttan serileştirilmiş argüman meta verilerini çıkarır.
- Operatörler, bir agent için çalışma zamanı araç kataloğunu almak üzere
  `tools.catalog` (`operator.read`) çağırabilir. Yanıt, gruplanmış araçları ve köken meta verilerini içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda Plugin sahibi
  - `optional`: bir Plugin aracının isteğe bağlı olup olmadığı
- Operatörler, bir oturum için çalışma zamanında etkin araç
  envanterini almak üzere `tools.effective` (`operator.read`) çağırabilir.
  - `sessionKey` zorunludur.
  - Gateway, çağıranın sağladığı auth veya teslim bağlamını kabul etmek yerine güvenilir çalışma zamanı bağlamını oturumdan sunucu tarafında türetir.
  - Yanıt oturum kapsamlıdır ve etkin konuşmanın şu anda kullanabileceği şeyleri yansıtır;
    core, Plugin ve kanal araçları dahil.
- Operatörler, `/tools/invoke` ile aynı gateway ilkesi yolu üzerinden kullanılabilir bir aracı çağırmak için
  `tools.invoke` (`operator.write`) çağırabilir.
  - `name` zorunludur. `args`, `sessionKey`, `agentId`, `confirm` ve
    `idempotencyKey` isteğe bağlıdır.
  - Hem `sessionKey` hem `agentId` varsa, çözümlenen oturum agent'ı
    `agentId` ile eşleşmelidir.
  - Yanıt, `ok`, `toolName`, isteğe bağlı `output` ve tipli
    `error` alanlarını içeren SDK'ya dönük bir zarftır. Onay veya ilke retleri, gateway araç ilkesi işlem hattını
    atlamak yerine payload içinde `ok:false` döndürür.
- Operatörler, bir agent için görünür
  skill envanterini almak üzere `skills.status` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan agent çalışma alanını okumak için atlayın.
  - Yanıt, ham gizli değerleri açığa çıkarmadan uygunluğu, eksik gereksinimleri, yapılandırma kontrollerini ve
    temizlenmiş kurulum seçeneklerini içerir.
- Operatörler, ClawHub keşif meta verileri için `skills.search` ve `skills.detail` (`operator.read`) çağırabilir.
- Operatörler, `skills.install` (`operator.admin`) yöntemini iki modda çağırabilir:
  - ClawHub modu: `{ source: "clawhub", slug, version?, force? }`, varsayılan agent çalışma alanındaki
    `skills/` dizinine bir skill klasörü kurar.
  - Gateway kurucu modu: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`,
    gateway ana makinesinde bildirilmiş bir `metadata.openclaw.install` eylemini çalıştırır.
- Operatörler, `skills.update` (`operator.admin`) yöntemini iki modda çağırabilir:
  - ClawHub modu, varsayılan agent çalışma alanında izlenen bir slug'ı veya izlenen tüm ClawHub kurulumlarını
    günceller.
  - Yapılandırma modu, `enabled`,
    `apiKey` ve `env` gibi `skills.entries.<skillKey>` değerlerini yamalar.

### `models.list` görünümleri

`models.list`, isteğe bağlı bir `view` parametresi kabul eder:

- Atlanmış veya `"default"`: geçerli çalışma zamanı davranışı. `agents.defaults.models` yapılandırılmışsa yanıt izin verilen katalogdur; aksi takdirde yanıt tam Gateway kataloğudur.
- `"configured"`: seçici boyutunda davranış. `agents.defaults.models` yapılandırılmışsa yine önceliklidir. Aksi takdirde yanıt açık `models.providers.*.models` girdilerini kullanır ve yalnızca yapılandırılmış model satırları yoksa tam kataloğa geri döner.
- `"all"`: `agents.defaults.models` değerini atlayarak tam Gateway kataloğu. Bunu normal model seçiciler için değil, tanılama ve keşif UI'leri için kullanın.

## Exec onayları

- Bir exec isteği onay gerektirdiğinde gateway `exec.approval.requested` yayını yapar.
- Operatör istemcileri `exec.approval.resolve` çağırarak çözümler (`operator.approvals` kapsamı gerektirir).
- `host=node` için `exec.approval.request`, `systemRunPlan` içermelidir (kanonik `argv`/`cwd`/`rawCommand`/oturum meta verileri). `systemRunPlan` eksik olan istekler reddedilir.
- Onaydan sonra iletilen `node.invoke system.run` çağrıları, bu kanonik
  `systemRunPlan` değerini yetkili komut/cwd/oturum bağlamı olarak yeniden kullanır.
- Bir çağıran, hazırlama ile son onaylı `system.run` iletimi arasında `command`, `rawCommand`, `cwd`, `agentId` veya
  `sessionKey` değerini değiştirirse,
  gateway değiştirilen payload'a güvenmek yerine çalıştırmayı reddeder.

## Agent teslim geri dönüşü

- `agent` istekleri, dışa dönük teslim istemek için `deliver=true` içerebilir.
- `bestEffortDeliver=false` katı davranışı korur: çözümlenemeyen veya yalnızca dahili teslim hedefleri `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici teslim edilebilir rota çözümlenemediğinde oturumla sınırlı yürütmeye geri dönüşe izin verir (örneğin dahili/webchat oturumları veya belirsiz çok kanallı yapılandırmalar).

## Sürümleme

- `PROTOCOL_VERSION`, `src/gateway/protocol/version.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu uyumsuzlukları reddeder.
- Şemalar + modeller TypeBox tanımlarından üretilir:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### İstemci sabitleri

`src/gateway/client.ts` içindeki referans istemci bu varsayılanları kullanır. Değerler
protokol v4 boyunca kararlıdır ve üçüncü taraf istemciler için beklenen taban çizgidir.

| Sabit                                     | Varsayılan                                            | Kaynak                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| İstek zaman aşımı (RPC başına)            | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Ön kimlik doğrulama / connect-challenge zaman aşımı | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env eşleştirilmiş sunucu/istemci bütçesini artırabilir) |
| İlk yeniden bağlanma backoff'u            | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maksimum yeniden bağlanma backoff'u       | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Cihaz token'ı kapanışından sonra hızlı yeniden deneme sınırı | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` öncesi force-stop ek süresi | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` varsayılan zaman aşımı    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Varsayılan tick aralığı (`hello-ok` öncesi) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Tick zaman aşımı kapanışı                 | sessizlik `tickIntervalMs * 2` değerini aştığında kod `4000` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Sunucu, etkin `policy.tickIntervalMs`, `policy.maxPayload` ve
`policy.maxBufferedBytes` değerlerini `hello-ok` içinde duyurur; istemciler el sıkışma öncesi varsayılanlar yerine
bu değerlere uymalıdır.

## Auth

- Paylaşılan gizli Gateway kimlik doğrulaması, yapılandırılmış kimlik doğrulama moduna bağlı olarak `connect.params.auth.token` veya
  `connect.params.auth.password` kullanır.
- Tailscale Serve
  (`gateway.auth.allowTailscale: true`) veya local loopback olmayan
  `gateway.auth.mode: "trusted-proxy"` gibi kimlik taşıyan modlar, connect kimlik doğrulama denetimini `connect.params.auth.*` yerine
  istek üstbilgilerinden karşılar.
- Özel giriş `gateway.auth.mode: "none"`, paylaşılan gizli connect kimlik doğrulamasını
  tamamen atlar; bu modu herkese açık/güvenilmeyen girişlerde açmayın.
- Eşleştirmeden sonra Gateway, bağlantı
  rolü + kapsamlarıyla sınırlı bir **cihaz token'ı** verir. `hello-ok.auth.deviceToken` içinde döndürülür ve istemci tarafından gelecekteki bağlantılar için
  kalıcı olarak saklanmalıdır.
- İstemciler, başarılı her connect işleminden sonra birincil `hello-ok.auth.deviceToken` değerini kalıcı olarak saklamalıdır.
- Bu **saklanan** cihaz token'ıyla yeniden bağlanmak, o token için saklanan
  onaylanmış kapsam kümesini de yeniden kullanmalıdır. Bu, daha önce verilmiş olan okuma/yoklama/durum erişimini korur
  ve yeniden bağlantıların sessizce daha dar, örtük yalnızca-admin kapsamına
  düşmesini önler.
- İstemci tarafı connect kimlik doğrulaması oluşturma (`selectConnectAuth`, 
  `src/gateway/client.ts` içinde):
  - `auth.password` bağımsızdır ve ayarlandığında her zaman iletilir.
  - `auth.token` öncelik sırasına göre doldurulur: önce açık paylaşılan token,
    sonra açık bir `deviceToken`, ardından saklanan cihaz başına token (`deviceId` + `role` ile
    anahtarlanır).
  - `auth.bootstrapToken` yalnızca yukarıdakilerin hiçbiri bir
    `auth.token` çözümlemediğinde gönderilir. Paylaşılan token veya çözümlenen herhangi bir cihaz token'ı bunu baskılar.
  - Tek seferlik
    `AUTH_TOKEN_MISMATCH` yeniden denemesinde saklanan cihaz token'ının otomatik yükseltilmesi **yalnızca güvenilir uç noktalarla** sınırlıdır —
    loopback veya sabitlenmiş `tlsFingerprint` bulunan `wss://`. Sabitleme olmayan herkese açık `wss://`
    uygun sayılmaz.
- Ek `hello-ok.auth.deviceTokens` girdileri bootstrap devretme token'larıdır.
  Bunları yalnızca connect, `wss://` veya loopback/yerel eşleştirme gibi güvenilir bir taşıma üzerinde bootstrap kimlik doğrulaması kullandığında
  kalıcı olarak saklayın.
- Bir istemci **açık** bir `deviceToken` veya açık `scopes` sağlarsa, bu
  çağıranın istediği kapsam kümesi yetkili kalır; önbelleğe alınmış kapsamlar yalnızca
  istemci saklanan cihaz başına token'ı yeniden kullandığında
  yeniden kullanılır.
- Cihaz token'ları `device.token.rotate` ve
  `device.token.revoke` aracılığıyla döndürülebilir/iptal edilebilir (`operator.pairing` kapsamı gerektirir).
- `device.token.rotate`, döndürme meta verilerini döndürür. Yedek
  taşıyıcı token'ı yalnızca zaten o cihaz token'ıyla kimliği doğrulanmış
  aynı cihaz çağrıları için yankılar; böylece yalnızca token kullanan istemciler yeniden bağlanmadan önce
  yedeklerini kalıcı olarak saklayabilir. Paylaşılan/admin döndürmeleri taşıyıcı token'ı yankılamaz.
- Token verme, döndürme ve iptal etme, o cihazın eşleştirme girdisinde kaydedilen
  onaylanmış rol kümesiyle sınırlı kalır; token mutasyonu, eşleştirme onayının hiç vermediği
  bir cihaz rolünü genişletemez veya hedefleyemez.
- Eşleştirilmiş cihaz token oturumları için, çağıranda `operator.admin` da yoksa
  cihaz yönetimi kendi kapsamındadır: admin olmayan çağıranlar yalnızca **kendi**
  cihaz girdilerini kaldırabilir/iptal edebilir/döndürebilir.
- `device.token.rotate` ve `device.token.revoke`, hedef operatör
  token kapsam kümesini çağıranın geçerli oturum kapsamlarına karşı da denetler. Admin olmayan çağıranlar,
  zaten sahip olduklarından daha geniş bir operatör token'ını döndüremez veya iptal edemez.
- Kimlik doğrulama hataları, `error.details.code` ile kurtarma ipuçlarını içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilir istemciler, önbelleğe alınmış cihaz başına token ile sınırlı bir yeniden deneme yapmayı deneyebilir.
  - Bu yeniden deneme başarısız olursa, istemciler otomatik yeniden bağlanma döngülerini durdurmalı ve operatör eylem kılavuzunu göstermelidir.

## Cihaz kimliği + eşleştirme

- Node'lar, bir anahtar çifti parmak izinden türetilmiş kararlı bir cihaz kimliği (`device.id`) içermelidir.
- Gateway'ler cihaz + rol başına token verir.
- Yerel otomatik onay etkin değilse yeni cihaz kimlikleri için eşleştirme onayları gereklidir.
- Eşleştirme otomatik onayı, doğrudan local loopback bağlantılarına odaklanır.
- OpenClaw ayrıca güvenilir paylaşılan gizli yardımcı akışlar için dar bir backend/konteyner-yerel kendi kendine bağlanma yoluna sahiptir.
- Aynı ana makinedeki tailnet veya LAN bağlantıları eşleştirme açısından hâlâ uzak kabul edilir ve
  onay gerektirir.
- WS istemcileri normalde `connect` sırasında `device` kimliğini içerir (operatör +
  node). Cihazsız tek operatör istisnaları açık güven yollarıdır:
  - localhost'a özel güvensiz HTTP uyumluluğu için `gateway.controlUi.allowInsecureAuth=true`.
  - başarılı `gateway.auth.mode: "trusted-proxy"` operatör Control UI kimlik doğrulaması.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (acil durum, ciddi güvenlik düşürmesi).
  - paylaşılan
    Gateway token'ı/parolasıyla kimliği doğrulanmış doğrudan-loopback `gateway-client` backend RPC'leri.
- Tüm bağlantılar, sunucunun sağladığı `connect.challenge` nonce değerini imzalamalıdır.

### Cihaz kimlik doğrulaması geçiş tanılamaları

Hâlâ challenge öncesi imzalama davranışını kullanan eski istemciler için `connect` artık
`error.details.code` altında kararlı bir `error.details.reason` ile `DEVICE_AUTH_*` ayrıntı kodları döndürür.

Yaygın geçiş hataları:

| İleti                       | details.code                     | details.reason           | Anlam                                              |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | İstemci `device.nonce` değerini atladı (veya boş gönderdi). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | İstemci eski/yanlış nonce ile imzaladı.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | İmza yükü v2 yüküyle eşleşmiyor.                   |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | İmzalanmış zaman damgası izin verilen sapmanın dışında. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`, açık anahtar parmak iziyle eşleşmiyor. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Açık anahtar biçimi/kanonikleştirme başarısız oldu. |

Geçiş hedefi:

- Her zaman `connect.challenge` için bekleyin.
- Sunucu nonce'unu içeren v2 yükünü imzalayın.
- Aynı nonce'u `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza yükü `v3`'tür; bu, cihaz/istemci/rol/kapsamlar/token/nonce alanlarına ek olarak `platform` ve `deviceFamily`
  değerlerini bağlar.
- Eski `v2` imzaları uyumluluk için kabul edilmeye devam eder, ancak eşleştirilmiş cihaz
  meta veri sabitlemesi yeniden bağlantıda komut politikasını hâlâ denetler.

## TLS + sabitleme

- WS bağlantıları için TLS desteklenir.
- İstemciler isteğe bağlı olarak Gateway sertifika parmak izini sabitleyebilir (`gateway.tls`
  yapılandırmasına ve `gateway.remote.tlsFingerprint` veya CLI `--tls-fingerprint` değerine bakın).

## Kapsam

Bu protokol **tam gateway API'sini** açığa çıkarır (durum, kanallar, modeller, sohbet,
ajan, oturumlar, node'lar, onaylar vb.). Kesin yüzey
`src/gateway/protocol/schema.ts` içindeki TypeBox şemalarıyla tanımlanır.

## İlgili

- [Bridge protokolü](/tr/gateway/bridge-protocol)
- [Gateway çalıştırma kitabı](/tr/gateway)
