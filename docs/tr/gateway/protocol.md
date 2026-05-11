---
read_when:
    - Gateway WS istemcilerini uygulama veya güncelleme
    - Protokol uyumsuzluklarında veya bağlantı hatalarında hata ayıklama
    - Protokol şemasını/modellerini yeniden oluşturma
summary: 'Gateway WebSocket protokolü: el sıkışma, çerçeveler, sürümlendirme'
title: Gateway protokolü
x-i18n:
    generated_at: "2026-05-11T20:30:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8db92a8ea464fa3ca1fdc6cc32fdcd7d981c186c9900bb8dc2eeaf1a2d2be05d
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protokolü, OpenClaw için **tek kontrol düzlemi + node taşımasıdır**. Tüm istemciler (CLI, web kullanıcı arayüzü, macOS uygulaması, iOS/Android node'ları, başsız node'lar) WebSocket üzerinden bağlanır ve el sıkışma sırasında **rollerini** + **kapsamlarını** bildirir.

## Taşıma

- JSON yükleri içeren metin çerçeveleriyle WebSocket.
- İlk çerçeve **mutlaka** bir `connect` isteği olmalıdır.
- Bağlantı öncesi çerçeveler 64 KiB ile sınırlandırılır. Başarılı bir el sıkışmadan sonra istemciler `hello-ok.policy.maxPayload` ve `hello-ok.policy.maxBufferedBytes` sınırlarına uymalıdır. Tanılamalar etkinken, aşırı büyük gelen çerçeveler ve yavaş giden arabellekler, gateway etkilenen çerçeveyi kapatmadan veya düşürmeden önce `payload.large` olayları yayar. Bu olaylar boyutları, sınırları, yüzeyleri ve güvenli neden kodlarını tutar. Mesaj gövdesini, ek içeriklerini, ham çerçeve gövdesini, belirteçleri, çerezleri veya gizli değerleri tutmazlar.

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

Gateway başlangıç yan yardımcılarını hâlâ tamamlarken, `connect` isteği `details.reason` değeri `"startup-sidecars"` olarak ayarlanmış ve `retryAfterMs` içeren yeniden denenebilir bir `UNAVAILABLE` hatası döndürebilir. İstemciler bu yanıtı sonlandırıcı bir el sıkışma hatası olarak göstermek yerine genel bağlantı bütçeleri içinde yeniden denemelidir.

`server`, `features`, `snapshot` ve `policy` şema tarafından zorunludur (`src/gateway/protocol/schema/frames.ts`). `auth` da zorunludur ve üzerinde anlaşılan rol/kapsamları bildirir. `pluginSurfaceUrls` isteğe bağlıdır ve `canvas` gibi plugin yüzey adlarını kapsamlı barındırılan URL'lere eşler.

Kapsamlı plugin yüzey URL'lerinin süresi dolabilir. Node'lar, `pluginSurfaceUrls` içinde yeni bir giriş almak için `{ "surface": "canvas" }` ile `node.pluginSurface.refresh` çağırabilir. Deneysel Canvas plugin yeniden düzenlemesi, kullanımdan kaldırılmış `canvasHostUrl`, `canvasCapability` veya `node.canvas.capability.refresh` uyumluluk yolunu desteklemez; güncel yerel istemciler ve gateway'ler plugin yüzeylerini kullanmalıdır.

Cihaz belirteci verilmediğinde, `hello-ok.auth` üzerinde anlaşılan izinleri belirteç alanları olmadan bildirir:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilen aynı süreç arka uç istemcileri (`client.id: "gateway-client"`, `client.mode: "backend"`), paylaşılan gateway belirteci/parolasıyla kimlik doğruladıklarında doğrudan loopback bağlantılarında `device` değerini atlayabilir. Bu yol, dahili kontrol düzlemi RPC'leri için ayrılmıştır ve eski CLI/cihaz eşleştirme temel değerlerinin alt aracı oturum güncellemeleri gibi yerel arka uç çalışmalarını engellemesini önler. Uzak istemciler, tarayıcı kaynaklı istemciler, node istemcileri ve açık cihaz belirteci/cihaz kimliği istemcileri hâlâ normal eşleştirme ve kapsam yükseltme denetimlerini kullanır.

Cihaz belirteci verildiğinde, `hello-ok` ayrıca şunu içerir:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilen önyükleme devri sırasında, `hello-ok.auth` `deviceTokens` içinde ek sınırlı rol girişleri de içerebilir:

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

Yerleşik node/operator önyükleme akışı için birincil node belirteci `scopes: []` olarak kalır ve devredilen operator belirteci önyükleme operator izin listesiyle (`operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`) sınırlı kalır. Önyükleme kapsam denetimleri rol önekli kalır: operator girişleri yalnızca operator isteklerini karşılar ve operator dışı roller hâlâ kendi rol önekleri altındaki kapsamlara ihtiyaç duyar.

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

Yan etkili yöntemler **idempotency anahtarları** gerektirir (şemaya bakın).

## Roller + kapsamlar

Tam operator kapsam modeli, onay zamanı denetimleri ve paylaşılan gizli anlamları için [Operator kapsamları](/tr/gateway/operator-scopes) bölümüne bakın.

### Roller

- `operator` = kontrol düzlemi istemcisi (CLI/kullanıcı arayüzü/otomasyon).
- `node` = yetenek ana makinesi (camera/screen/canvas/system.run).

### Kapsamlar (operator)

Yaygın kapsamlar:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` ile `talk.config`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.

Plugin tarafından kaydedilen gateway RPC yöntemleri kendi operator kapsamlarını isteyebilir, ancak ayrılmış çekirdek yönetici önekleri (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) her zaman `operator.admin` olarak çözümlenir.

Yöntem kapsamı yalnızca ilk kapıdır. `chat.send` üzerinden ulaşılan bazı eğik çizgi komutları bunun üzerine daha sıkı komut düzeyi denetimler uygular. Örneğin, kalıcı `/config set` ve `/config unset` yazmaları `operator.admin` gerektirir.

`node.pair.approve` ayrıca temel yöntem kapsamının üzerine ek bir onay zamanı kapsam denetimine sahiptir:

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
- Varlık girişleri `deviceId`, `roles` ve `scopes` içerir; böylece kullanıcı arayüzleri, cihaz hem **operator** hem de **node** olarak bağlandığında bile cihaz başına tek bir satır gösterebilir.
- `node.list`, isteğe bağlı `lastSeenAtMs` ve `lastSeenReason` alanlarını içerir. Bağlı node'lar mevcut bağlantı zamanlarını `connect` nedeniyle `lastSeenAtMs` olarak bildirir; eşleştirilmiş node'lar, güvenilen bir node olayı eşleştirme meta verilerini güncellediğinde kalıcı arka plan varlığı da bildirebilir.

### Node arka plan canlı olayı

Node'lar, eşleştirilmiş bir node'un bağlı olarak işaretlenmeden arka plan uyanışı sırasında canlı olduğunu kaydetmek için `event: "node.presence.alive"` ile `node.event` çağırabilir.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` kapalı bir enum'dur: `background`, `silent_push`, `bg_app_refresh`, `significant_location`, `manual` veya `connect`. Bilinmeyen trigger dizeleri, kalıcı hale getirilmeden önce gateway tarafından `background` olarak normalleştirilir. Olay yalnızca kimliği doğrulanmış node cihaz oturumları için kalıcıdır; cihazsız veya eşleştirilmemiş oturumlar `handled: false` döndürür.

Başarılı gateway'ler yapılandırılmış bir sonuç döndürür:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Daha eski gateway'ler `node.event` için hâlâ `{ "ok": true }` döndürebilir; istemciler bunu kalıcı varlık saklama olarak değil, onaylanmış bir RPC olarak ele almalıdır.

## Yayın olayı kapsamlandırması

Sunucu tarafından itilen WebSocket yayın olayları kapsam kapılıdır; böylece eşleştirme kapsamlı veya yalnızca node oturumları oturum içeriğini pasif olarak almaz.

- **Sohbet, aracı ve araç sonucu çerçeveleri** (akışlı `agent` olayları ve araç çağrısı sonuçları dahil) en az `operator.read` gerektirir. `operator.read` olmayan oturumlar bu çerçeveleri tamamen atlar.
- **Plugin tanımlı `plugin.*` yayınları**, plugin'in bunları nasıl kaydettiğine bağlı olarak `operator.write` veya `operator.admin` ile kapılanır.
- **Durum ve taşıma olayları** (`heartbeat`, `presence`, `tick`, bağlantı/bağlantı kesme yaşam döngüsü vb.) sınırsız kalır; böylece taşıma sağlığı her kimliği doğrulanmış oturum tarafından gözlemlenebilir kalır.
- **Bilinmeyen yayın olayı aileleri**, kayıtlı bir işleyici bunları açıkça gevşetmediği sürece varsayılan olarak kapsam kapılıdır (kapalı başarısızlık).

Her istemci bağlantısı kendi istemci başına sıra numarasını tutar; böylece farklı istemciler olay akışının farklı kapsam filtreli alt kümelerini görse bile yayınlar o sokette monoton sıralamayı korur.

## Yaygın RPC yöntem aileleri

Genel WS yüzeyi yukarıdaki el sıkışma/kimlik doğrulama örneklerinden daha geniştir. Bu üretilmiş bir döküm değildir; `hello-ok.features.methods`, `src/gateway/server-methods-list.ts` ile yüklenen plugin/kanal yöntem dışa aktarımlarından oluşturulan tutucu bir keşif listesidir. Bunu `src/gateway/server-methods/*.ts` için tam bir numaralandırma değil, özellik keşfi olarak değerlendirin.

<AccordionGroup>
  <Accordion title="Sistem ve kimlik">
    - `health`, önbelleğe alınmış veya yeni yoklanmış gateway sağlık anlık görüntüsünü döndürür.
    - `diagnostics.stability`, son sınırlı tanılama kararlılık kaydedicisini döndürür. Olay adları, sayımlar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/plugin adları ve oturum kimlikleri gibi operasyonel meta verileri tutar. Sohbet metnini, webhook gövdelerini, araç çıktılarını, ham istek veya yanıt gövdelerini, belirteçleri, çerezleri veya gizli değerleri tutmaz. Operator okuma kapsamı gereklidir.
    - `status`, `/status` tarzı gateway özetini döndürür; hassas alanlar yalnızca yönetici kapsamlı operator istemcileri için dahil edilir.
    - `gateway.identity.get`, aktarma ve eşleştirme akışları tarafından kullanılan gateway cihaz kimliğini döndürür.
    - `system-presence`, bağlı operator/node cihazları için mevcut varlık anlık görüntüsünü döndürür.
    - `system-event`, bir sistem olayı ekler ve varlık bağlamını güncelleyebilir/yayınlayabilir.
    - `last-heartbeat`, en son kalıcı heartbeat olayını döndürür.
    - `set-heartbeats`, gateway üzerinde heartbeat işlemeyi açar veya kapatır.

  </Accordion>

  <Accordion title="Modeller ve kullanım">
    - `models.list`, çalışma zamanı tarafından izin verilen model kataloğunu döndürür. Seçici boyutunda yapılandırılmış modeller için `{ "view": "configured" }` aktarın (`agents.defaults.models` önce, ardından `models.providers.*.models`), tam katalog için ise `{ "view": "all" }` aktarın.
    - `usage.status`, sağlayıcı kullanım pencerelerini/kalan kota özetlerini döndürür.
    - `usage.cost`, bir tarih aralığı için toplulaştırılmış maliyet kullanım özetlerini döndürür.
    - `doctor.memory.status`, etkin varsayılan ajan çalışma alanı için vektör bellek / önbelleğe alınmış gömme hazırlık durumunu döndürür. Yalnızca çağıran açıkça canlı bir gömme sağlayıcısı ping'i istediğinde `{ "probe": true }` veya `{ "deep": true }` aktarın.
    - `doctor.memory.remHarness`, uzak denetim düzlemi istemcileri için sınırlı, salt okunur bir REM harness önizlemesi döndürür. Çalışma alanı yollarını, bellek parçacıklarını, işlenmiş temellendirilmiş markdown'ı ve derin yükseltme adaylarını içerebilir; bu nedenle çağıranların `operator.read` iznine ihtiyacı vardır.
    - `sessions.usage`, oturum başına kullanım özetlerini döndürür.
    - `sessions.usage.timeseries`, bir oturum için zaman serisi kullanımını döndürür.
    - `sessions.usage.logs`, bir oturum için kullanım günlüğü girdilerini döndürür.

  </Accordion>

  <Accordion title="Kanallar ve oturum açma yardımcıları">
    - `channels.status`, yerleşik + paketlenmiş kanal/Plugin durum özetlerini döndürür.
    - `channels.logout`, kanalın çıkış yapmayı desteklediği belirli bir kanal/hesaptan çıkış yapar.
    - `web.login.start`, geçerli QR destekli web kanal sağlayıcısı için bir QR/web oturum açma akışı başlatır.
    - `web.login.wait`, bu QR/web oturum açma akışının tamamlanmasını bekler ve başarı durumunda kanalı başlatır.
    - `push.test`, kayıtlı bir iOS Node'una test APNs push'u gönderir.
    - `voicewake.get`, saklanan uyandırma sözcüğü tetikleyicilerini döndürür.
    - `voicewake.set`, uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayınlar.

  </Accordion>

  <Accordion title="Mesajlaşma ve günlükler">
    - `send`, sohbet çalıştırıcısı dışındaki kanal/hesap/iş parçacığı hedefli göndermeler için doğrudan giden teslimat RPC'sidir.
    - `logs.tail`, imleç/sınır ve maksimum bayt denetimleriyle yapılandırılmış Gateway dosya günlüğü kuyruğunu döndürür.

  </Accordion>

  <Accordion title="Talk ve TTS">
    - `talk.catalog`, konuşma, akışlı transkripsiyon ve gerçek zamanlı ses için salt okunur Talk sağlayıcı kataloğunu döndürür. Sağlayıcı gizlerini döndürmeden veya genel yapılandırmayı değiştirmeden sağlayıcı kimliklerini, etiketleri, yapılandırılmış durumu, sunulan model/ses kimliklerini, kanonik modları, aktarımları, beyin stratejilerini ve gerçek zamanlı ses/yetenek bayraklarını içerir.
    - `talk.config`, etkili Talk yapılandırma yükünü döndürür; `includeSecrets`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.
    - `talk.session.create`, `realtime/gateway-relay`, `transcription/gateway-relay` veya `stt-tts/managed-room` için Gateway sahipli bir Talk oturumu oluşturur. `brain: "direct-tools"`, `operator.admin` gerektirir.
    - `talk.session.join`, yönetilen oda oturum belirtecini doğrular, gerektiğinde `session.ready` veya `session.replaced` olayları yayar ve düz metin belirteç ya da saklanan belirteç karması olmadan oda/oturum meta verilerini ve son Talk olaylarını döndürür.
    - `talk.session.appendAudio`, Gateway sahipli gerçek zamanlı aktarma ve transkripsiyon oturumlarına base64 PCM giriş sesi ekler.
    - `talk.session.startTurn`, `talk.session.endTurn` ve `talk.session.cancelTurn`, durum temizlenmeden önce bayat tur reddiyle yönetilen oda tur yaşam döngüsünü yürütür.
    - `talk.session.cancelOutput`, ağırlıklı olarak Gateway aktarma oturumlarında VAD kapılı araya girme için asistan ses çıktısını durdurur.
    - `talk.session.submitToolResult`, Gateway sahipli gerçek zamanlı aktarma oturumu tarafından yayımlanan bir sağlayıcı araç çağrısını tamamlar. Nihai sonuç sonradan gelecekse ara araç çıktısı için `options: { willContinue: true }`, araç sonucunun başka bir gerçek zamanlı asistan yanıtı başlatmadan sağlayıcı çağrısını karşılaması gerektiğinde ise `options: { suppressResponse: true }` aktarın.
    - `talk.session.close`, Gateway sahipli bir aktarma, transkripsiyon veya yönetilen oda oturumunu kapatır ve terminal Talk olayları yayar.
    - `talk.mode`, WebChat/Control UI istemcileri için geçerli Talk modu durumunu ayarlar/yayınlar.
    - `talk.client.create`, Gateway yapılandırma, kimlik bilgileri, yönergeler ve araç politikasına sahipken `webrtc` veya `provider-websocket` kullanarak istemci sahipli bir gerçek zamanlı sağlayıcı oturumu oluşturur.
    - `talk.client.toolCall`, istemci sahipli gerçek zamanlı aktarımların sağlayıcı araç çağrılarını Gateway politikasına iletmesine izin verir. Desteklenen ilk araç `openclaw_agent_consult` aracıdır; istemciler bir çalıştırma kimliği alır ve sağlayıcıya özgü araç sonucunu göndermeden önce normal sohbet yaşam döngüsü olaylarını bekler.
    - `talk.event`, gerçek zamanlı, transkripsiyon, STT/TTS, yönetilen oda, telefon ve toplantı bağdaştırıcıları için tek Talk olay kanalıdır.
    - `talk.speak`, etkin Talk konuşma sağlayıcısı üzerinden konuşma sentezler.
    - `tts.status`, TTS etkin durumunu, etkin sağlayıcıyı, yedek sağlayıcıları ve sağlayıcı yapılandırma durumunu döndürür.
    - `tts.providers`, görünür TTS sağlayıcı envanterini döndürür.
    - `tts.enable` ve `tts.disable`, TTS tercihleri durumunu açıp kapatır.
    - `tts.setProvider`, tercih edilen TTS sağlayıcısını günceller.
    - `tts.convert`, tek seferlik metinden konuşmaya dönüştürme çalıştırır.

  </Accordion>

  <Accordion title="Gizler, yapılandırma, güncelleme ve sihirbaz">
    - `secrets.reload`, etkin SecretRef'leri yeniden çözümler ve çalışma zamanı giz durumunu yalnızca tam başarıda değiştirir.
    - `secrets.resolve`, belirli bir komut/hedef kümesi için komut hedefli giz atamalarını çözümler.
    - `config.get`, geçerli yapılandırma anlık görüntüsünü ve karmasını döndürür.
    - `config.set`, doğrulanmış bir yapılandırma yükü yazar.
    - `config.patch`, kısmi bir yapılandırma güncellemesini birleştirir.
    - `config.apply`, tam yapılandırma yükünü doğrular + değiştirir.
    - `config.schema`, Control UI ve CLI araçları tarafından kullanılan canlı yapılandırma şeması yükünü döndürür: şema, `uiHints`, sürüm ve üretim meta verileri; çalışma zamanı yükleyebildiğinde Plugin + kanal şeması meta verileri dahil. Şema, eşleşen alan dokümantasyonu mevcut olduğunda iç içe nesne, joker karakter, dizi öğesi ve `anyOf` / `oneOf` / `allOf` bileşim dalları dahil olmak üzere UI tarafından kullanılan aynı etiketlerden ve yardım metninden türetilen alan `title` / `description` meta verilerini içerir.
    - `config.schema.lookup`, bir yapılandırma yolu için yol kapsamlı bir arama yükü döndürür: normalleştirilmiş yol, sığ bir şema düğümü, eşleşen ipucu + `hintPath` ve UI/CLI ayrıntıya inme için yakın alt öğe özetleri. Arama şeması düğümleri kullanıcıya dönük dokümanları ve yaygın doğrulama alanlarını (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, sayısal/dize/dizi/nesne sınırları ve `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi bayraklar) korur. Alt öğe özetleri `key`, normalleştirilmiş `path`, `type`, `required`, `hasChildren` ile eşleşen `hint` / `hintPath` değerlerini sunar.
    - `update.run`, Gateway güncelleme akışını çalıştırır ve yalnızca güncellemenin kendisi başarılı olduğunda yeniden başlatma zamanlar; oturumu olan çağıranlar `continuationMessage` ekleyebilir, böylece başlangıç, yeniden başlatma devam kuyruğu üzerinden bir takip ajan turunu sürdürür. Paket yöneticisi güncellemeleri, paket değişiminden sonra eski Gateway işleminin değiştirilmiş bir `dist` ağacından tembel yükleme yapmaya devam etmemesi için ertelenmeyen, bekleme süresiz bir güncelleme yeniden başlatmasını zorunlu kılar.
    - `update.status`, varsa yeniden başlatma sonrası çalışan sürüm dahil en son önbelleğe alınmış güncelleme yeniden başlatma işaretçisini döndürür.
    - `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`, katılım sihirbazını WS RPC üzerinden sunar.

  </Accordion>

  <Accordion title="Ajan ve çalışma alanı yardımcıları">
    - `agents.list`, etkili model ve çalışma zamanı meta verileri dahil yapılandırılmış ajan girdilerini döndürür.
    - `agents.create`, `agents.update` ve `agents.delete`, ajan kayıtlarını ve çalışma alanı bağlantılarını yönetir.
    - `agents.files.list`, `agents.files.get` ve `agents.files.set`, bir ajan için sunulan önyükleme çalışma alanı dosyalarını yönetir.
    - `tasks.list`, `tasks.get` ve `tasks.cancel`, Gateway görev defterini SDK ve operatör istemcilerine sunar.
    - `artifacts.list`, `artifacts.get` ve `artifacts.download`, açık bir `sessionKey`, `runId` veya `taskId` kapsamı için transkriptten türetilen yapıt özetlerini ve indirmelerini sunar. Çalıştırma ve görev sorguları, sahip olan oturumu sunucu tarafında çözümler ve yalnızca eşleşen kaynağa sahip transkript medyasını döndürür; güvenli olmayan veya yerel URL kaynakları, sunucu tarafında getirilmek yerine desteklenmeyen indirmeler döndürür.
    - `environments.list` ve `environments.status`, SDK istemcileri için salt okunur Gateway yerel ve Node ortam keşfini sunar.
    - `agent.identity.get`, bir ajan veya oturum için etkili asistan kimliğini döndürür.
    - `agent.wait`, bir çalıştırmanın bitmesini bekler ve varsa terminal anlık görüntüsünü döndürür.

  </Accordion>

  <Accordion title="Oturum denetimi">
    - `sessions.list`, bir ajan çalışma zamanı arka ucu yapılandırıldığında satır başına `agentRuntime` meta verileri dahil geçerli oturum dizinini döndürür.
    - `sessions.subscribe` ve `sessions.unsubscribe`, geçerli WS istemcisi için oturum değişikliği olay aboneliklerini açıp kapatır.
    - `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`, bir oturum için transkript/mesaj olay aboneliklerini açıp kapatır.
    - `sessions.preview`, belirli oturum anahtarları için sınırlı transkript önizlemeleri döndürür.
    - `sessions.describe`, tam bir oturum anahtarı için bir Gateway oturum satırı döndürür.
    - `sessions.resolve`, bir oturum hedefini çözümler veya kanonikleştirir.
    - `sessions.create`, yeni bir oturum girdisi oluşturur.
    - `sessions.send`, mevcut bir oturuma mesaj gönderir.
    - `sessions.steer`, etkin bir oturum için kes ve yönlendir varyantıdır.
    - `sessions.abort`, bir oturum için etkin işi iptal eder. Çağıran `key` ve isteğe bağlı `runId` aktarabilir ya da Gateway'in bir oturuma çözümleyebildiği etkin çalıştırmalar için yalnızca `runId` aktarabilir.
    - `sessions.patch`, oturum meta verilerini/geçersiz kılmalarını günceller ve çözümlenen kanonik modeli artı etkili `agentRuntime` değerini raporlar.
    - `sessions.reset`, `sessions.delete` ve `sessions.compact`, oturum bakımını gerçekleştirir.
    - `sessions.get`, tam saklanan oturum satırını döndürür.
    - Sohbet yürütme hâlâ `chat.history`, `chat.send`, `chat.abort` ve `chat.inject` kullanır. `chat.history`, UI istemcileri için görüntü açısından normalleştirilmiştir: satır içi yönerge etiketleri görünür metinden çıkarılır, düz metin araç çağrısı XML yükleri (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil) ve sızmış ASCII/tam genişlikli model denetim belirteçleri çıkarılır, tam `NO_REPLY` / `no_reply` gibi saf sessiz belirteçli asistan satırları atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir.

  </Accordion>

  <Accordion title="Cihaz eşleme ve cihaz belirteçleri">
    - `device.pair.list`, bekleyen ve onaylanmış eşlenmiş cihazları döndürür.
    - `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`, cihaz eşleme kayıtlarını yönetir.
    - `device.token.rotate`, eşlenmiş bir cihaz belirtecini onaylı rolü ve çağıran kapsamı sınırları içinde döndürür.
    - `device.token.revoke`, eşlenmiş bir cihaz belirtecini onaylı rolü ve çağıran kapsamı sınırları içinde iptal eder.

  </Accordion>

  <Accordion title="Node eşleme, invoke ve bekleyen iş">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` ve `node.pair.verify`, Node eşleme ve önyükleme doğrulamasını kapsar.
    - `node.list` ve `node.describe`, bilinen/bağlı Node durumunu döndürür.
    - `node.rename`, eşlenmiş bir Node etiketini günceller.
    - `node.invoke`, bir komutu bağlı bir Node'a iletir.
    - `node.invoke.result`, bir invoke isteği için sonucu döndürür.
    - `node.event`, Node kaynaklı olayları Gateway'e geri taşır.
    - `node.pending.pull` ve `node.pending.ack`, bağlı Node kuyruk API'leridir.
    - `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısı kesilmiş Node'lar için dayanıklı bekleyen işi yönetir.

  </Accordion>

  <Accordion title="Onay aileleri">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve `exec.approval.resolve`, tek seferlik exec onay isteklerini ve bekleyen onay arama/yeniden oynatma işlemlerini kapsar.
    - `exec.approval.waitDecision`, bekleyen bir exec onayı üzerinde bekler ve nihai kararı döndürür (veya zaman aşımında `null`).
    - `exec.approvals.get` ve `exec.approvals.set`, gateway exec onay ilkesi anlık görüntülerini yönetir.
    - `exec.approvals.node.get` ve `exec.approvals.node.set`, node relay komutları üzerinden node yerelindeki exec onay ilkesini yönetir.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` ve `plugin.approval.resolve`, plugin tanımlı onay akışlarını kapsar.

  </Accordion>

  <Accordion title="Otomasyon, Skills ve araçlar">
    - Otomasyon: `wake`, anında veya bir sonraki Heartbeat ile wake metni eklemeyi zamanlar; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zamanlanmış işleri yönetir.
    - Skills ve araçlar: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Yaygın olay aileleri

- `chat`: `chat.inject` gibi UI sohbet güncellemeleri ve yalnızca transkript içeren diğer sohbet
  olayları.
- `session.message` ve `session.tool`: abone olunan bir oturum için
  transkript/olay akışı güncellemeleri.
- `sessions.changed`: oturum dizini veya meta verileri değişti.
- `presence`: sistem varlık anlık görüntüsü güncellemeleri.
- `tick`: periyodik keepalive / canlılık olayı.
- `health`: gateway sağlık anlık görüntüsü güncellemesi.
- `heartbeat`: Heartbeat olay akışı güncellemesi.
- `cron`: Cron çalıştırma/iş değişikliği olayı.
- `shutdown`: gateway kapanma bildirimi.
- `node.pair.requested` / `node.pair.resolved`: node eşleştirme yaşam döngüsü.
- `node.invoke.request`: node invoke isteği yayını.
- `device.pair.requested` / `device.pair.resolved`: eşleştirilmiş cihaz yaşam döngüsü.
- `voicewake.changed`: wake-word tetikleyici yapılandırması değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onay
  yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin onay
  yaşam döngüsü.

### Node yardımcı yöntemleri

- Node'lar, otomatik izin denetimleri için mevcut skill yürütülebilirleri listesini
  almak üzere `skills.bins` çağırabilir.

### Görev defteri RPC'leri

Operatör istemcileri, görev defteri RPC'leri aracılığıyla Gateway arka plan görev
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
  - Eksik görev kimlikleri Gateway not-found hata biçimini döndürür.
- `tasks.cancel`, `operator.write` gerektirir.
  - Parametreler: `{ "taskId": string, "reason"?: string }`.
  - Sonuç:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found`, defterde eşleşen bir görev olup olmadığını bildirir. `cancelled`,
    çalışma zamanının iptali kabul edip etmediğini veya kaydedip kaydetmediğini bildirir.

`TaskSummary`; `id`, `status` ve `kind`, `runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, zaman damgaları, ilerleme,
terminal özeti ve temizlenmiş hata metni gibi isteğe bağlı meta verileri içerir.

### Operatör yardımcı yöntemleri

- Operatörler, bir agent için çalışma zamanı
  komut envanterini almak üzere `commands.list` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan agent çalışma alanını okumak için atlayın.
  - `scope`, birincil `name` değerinin hangi yüzeyi hedeflediğini denetler:
    - `text`, başında `/` olmadan birincil metin komutu belirtecini döndürür
    - `native` ve varsayılan `both` yolu, mevcut olduğunda sağlayıcı farkındalıklı yerel adları
      döndürür
  - `textAliases`, `/model` ve `/m` gibi tam slash alias'larını taşır.
  - `nativeName`, varsa sağlayıcı farkındalıklı yerel komut adını taşır.
  - `provider` isteğe bağlıdır ve yalnızca yerel adlandırmayı ve yerel plugin
    komut kullanılabilirliğini etkiler.
  - `includeArgs=false`, serileştirilmiş argüman meta verilerini yanıttan çıkarır.
- Operatörler, bir agent için çalışma zamanı araç kataloğunu almak üzere `tools.catalog` (`operator.read`) çağırabilir. Yanıt, gruplanmış araçları ve provenans meta verilerini içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda plugin sahibi
  - `optional`: bir plugin aracının isteğe bağlı olup olmadığı
- Operatörler, bir oturum için çalışma zamanında etkili araç
  envanterini almak üzere `tools.effective` (`operator.read`) çağırabilir.
  - `sessionKey` gereklidir.
  - Gateway, çağıranın sağladığı auth veya teslim bağlamını kabul etmek yerine güvenilir çalışma zamanı bağlamını sunucu tarafındaki oturumdan türetir.
  - Yanıt oturum kapsamındadır ve etkin konuşmanın şu anda kullanabileceği core, plugin ve kanal araçları dahil her şeyi yansıtır.
- Operatörler, `/tools/invoke` ile aynı gateway ilkesi yolu üzerinden kullanılabilir bir aracı çağırmak için `tools.invoke` (`operator.write`) çağırabilir.
  - `name` gereklidir. `args`, `sessionKey`, `agentId`, `confirm` ve
    `idempotencyKey` isteğe bağlıdır.
  - Hem `sessionKey` hem de `agentId` varsa, çözümlenen oturum agent'ı
    `agentId` ile eşleşmelidir.
  - Yanıt, `ok`, `toolName`, isteğe bağlı `output` ve tipli
    `error` alanları içeren SDK'ya dönük bir zarf biçimindedir. Onay veya ilke retleri,
    gateway araç ilkesi işlem hattını atlamak yerine payload içinde `ok:false` döndürür.
- Operatörler, bir agent için görünür
  skill envanterini almak üzere `skills.status` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan agent çalışma alanını okumak için atlayın.
  - Yanıt, ham secret değerlerini göstermeden uygunluk durumunu, eksik gereksinimleri, yapılandırma denetimlerini ve
    temizlenmiş kurulum seçeneklerini içerir.
- Operatörler, ClawHub keşif meta verileri için
  `skills.search` ve `skills.detail` (`operator.read`) çağırabilir.
- Operatörler, bir private skill arşivini
  kurmadan önce hazırlamak için `skills.upload.begin`, `skills.upload.chunk` ve
  `skills.upload.commit` (`operator.admin`) çağırabilir. Bu, güvenilir istemciler için ayrı bir admin upload yoludur;
  normal ClawHub skill kurulum akışı değildir ve
  `skills.install.allowUploadedArchives` etkinleştirilmedikçe varsayılan olarak devre dışıdır.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    bu slug ve force değerine bağlı bir upload oluşturur.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })`, baytları
    tam olarak çözümlenen offset konumuna ekler.
  - `skills.upload.commit({ uploadId, sha256? })`, son boyutu ve
    SHA-256 değerini doğrular. Commit yalnızca upload'u sonlandırır; skill'i kurmaz.
  - Yüklenen skill arşivleri, kökte `SKILL.md` içeren zip arşivleridir. Arşivin
    iç dizin adı hiçbir zaman kurulum hedefini seçmez.
- Operatörler, `skills.install` (`operator.admin`) öğesini üç modda çağırabilir:
  - ClawHub modu: `{ source: "clawhub", slug, version?, force? }`, bir
    skill klasörünü varsayılan agent çalışma alanındaki `skills/` dizinine kurar.
  - Upload modu: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`,
    commit edilmiş bir upload'u varsayılan agent çalışma alanındaki `skills/<slug>`
    dizinine kurar. Slug ve force değeri, özgün
    `skills.upload.begin` isteğiyle eşleşmelidir. Bu mod,
    `skills.install.allowUploadedArchives` etkinleştirilmedikçe reddedilir. Ayar,
    ClawHub kurulumlarını etkilemez.
  - Gateway kurucu modu: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`,
    gateway host üzerinde bildirilmiş bir `metadata.openclaw.install` eylemini çalıştırır.
- Operatörler, `skills.update` (`operator.admin`) öğesini iki modda çağırabilir:
  - ClawHub modu, varsayılan agent çalışma alanındaki izlenen bir slug'ı veya izlenen tüm ClawHub kurulumlarını günceller.
  - Config modu, `enabled`,
    `apiKey` ve `env` gibi `skills.entries.<skillKey>` değerlerini yamalar.

### `models.list` görünümleri

`models.list`, isteğe bağlı bir `view` parametresi kabul eder:

- Atlanmış veya `"default"`: mevcut çalışma zamanı davranışı. `agents.defaults.models` yapılandırıldıysa, yanıt izin verilen katalogdur ve `provider/*` girdileri için dinamik olarak keşfedilen modelleri içerir. Aksi takdirde yanıt tam Gateway kataloğudur.
- `"configured"`: picker boyutunda davranış. `agents.defaults.models` yapılandırıldıysa, `provider/*` girdileri için sağlayıcı kapsamlı keşif dahil hâlâ o kazanır. Bir allowlist olmadan, yanıt açık `models.providers.*.models` girdilerini kullanır ve yalnızca yapılandırılmış model satırı yoksa tam kataloğa geri döner.
- `"all"`: `agents.defaults.models` öğesini atlayarak tam Gateway kataloğu. Bunu normal model picker'ları için değil, tanılama ve keşif UI'leri için kullanın.

## Exec onayları

- Bir exec isteği onay gerektirdiğinde, gateway `exec.approval.requested` yayınlar.
- Operatör istemcileri `exec.approval.resolve` çağırarak çözer (`operator.approvals` kapsamı gerektirir).
- `host=node` için, `exec.approval.request` içinde `systemRunPlan` (kanonik `argv`/`cwd`/`rawCommand`/oturum meta verileri) bulunmalıdır. `systemRunPlan` eksik olan istekler reddedilir.
- Onaydan sonra, iletilen `node.invoke system.run` çağrıları bu kanonik
  `systemRunPlan` değerini yetkili komut/cwd/oturum bağlamı olarak yeniden kullanır.
- Bir çağıran, hazırlama ile onaylanmış son `system.run` iletimi arasında
  `command`, `rawCommand`, `cwd`, `agentId` veya
  `sessionKey` değerini değiştirirse gateway, değiştirilmiş payload'a güvenmek yerine çalıştırmayı reddeder.

## Agent teslimi geri dönüşü

- `agent` istekleri, giden teslimi istemek için `deliver=true` içerebilir.
- `bestEffortDeliver=false` katı davranışı korur: çözümlenemeyen veya yalnızca dahili teslim hedefleri `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici teslim edilebilir bir rota çözümlenemediğinde oturumla sınırlı yürütmeye geri dönüşe izin verir (örneğin dahili/webchat oturumları veya belirsiz çok kanallı yapılandırmalar).
- Nihai `agent` sonuçları, teslim istendiğinde
  [`openclaw agent --json --deliver`](/tr/cli/agent#json-delivery-status) için belgelenen aynı `sent`, `suppressed`, `partial_failed` ve `failed`
  durumlarını kullanarak `result.deliveryStatus` içerebilir.

## Sürümleme

- `PROTOCOL_VERSION`, `src/gateway/protocol/version.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu, mevcut protokolünü
  içermeyen aralıkları reddeder. Native istemciler v3 alt sınırı kullanır; böylece
  eklemeli v4 istemcileri hâlâ v3 gateway'lere erişebilir.
- Şemalar + modeller TypeBox tanımlarından üretilir:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### İstemci sabitleri

`src/gateway/client.ts` içindeki referans istemci bu varsayılanları kullanır. Değerler
protokol v4 boyunca stabildir ve üçüncü taraf istemciler için beklenen temel düzeydir.

| Sabit                                     | Varsayılan                                           | Kaynak                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `3`                                                   | `src/gateway/protocol/version.ts`                                                          |
| İstek zaman aşımı (RPC başına)            | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Ön kimlik doğrulama / connect-challenge zaman aşımı | `15_000` ms                                  | `src/gateway/handshake-timeouts.ts` (config/env eşleştirilmiş sunucu/istemci bütçesini artırabilir) |
| İlk yeniden bağlanma geri çekilmesi       | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Azami yeniden bağlanma geri çekilmesi     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Cihaz belirteci kapanışından sonra hızlı yeniden deneme sınırı | `250` ms                              | `src/gateway/client.ts`                                                                    |
| `terminate()` öncesi zorla durdurma ek süresi | `250` ms                                          | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` varsayılan zaman aşımı    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Varsayılan tik aralığı (`hello-ok` öncesi) | `30_000` ms                                          | `src/gateway/client.ts`                                                                    |
| Tik zaman aşımı kapanışı                  | sessizlik `tickIntervalMs * 2` değerini aştığında code `4000` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Sunucu, etkin `policy.tickIntervalMs`, `policy.maxPayload` ve
`policy.maxBufferedBytes` değerlerini `hello-ok` içinde duyurur; istemciler,
el sıkışma öncesi varsayılanlar yerine bu değerlere uymalıdır.

## Kimlik Doğrulama

- Paylaşılan gizli anahtarlı gateway kimlik doğrulaması, yapılandırılmış kimlik
  doğrulama moduna bağlı olarak `connect.params.auth.token` veya
  `connect.params.auth.password` kullanır.
- Tailscale Serve (`gateway.auth.allowTailscale: true`) veya local loopback
  olmayan `gateway.auth.mode: "trusted-proxy"` gibi kimlik taşıyan modlar,
  bağlantı kimlik doğrulama denetimini `connect.params.auth.*` yerine
  istek üst bilgilerinden karşılar.
- Özel giriş `gateway.auth.mode: "none"`, paylaşılan gizli anahtarlı bağlantı
  kimlik doğrulamasını tamamen atlar; bu modu genel/güvenilmeyen girişlerde
  açığa çıkarmayın.
- Eşleştirmeden sonra Gateway, bağlantı rolü + kapsamlarıyla sınırlı bir
  **cihaz belirteci** verir. Bu belirteç `hello-ok.auth.deviceToken` içinde
  döndürülür ve istemci tarafından gelecekteki bağlantılar için kalıcı olarak
  saklanmalıdır.
- İstemciler, başarılı herhangi bir bağlantıdan sonra birincil
  `hello-ok.auth.deviceToken` değerini kalıcı olarak saklamalıdır.
- Bu **saklanan** cihaz belirteciyle yeniden bağlanmak, o belirteç için saklanan
  onaylanmış kapsam kümesini de yeniden kullanmalıdır. Bu, zaten verilmiş
  okuma/yoklama/durum erişimini korur ve yeniden bağlantıların sessizce daha dar
  örtük yalnızca yönetici kapsamına düşmesini önler.
- İstemci tarafı bağlantı kimlik doğrulaması derlemesi (`src/gateway/client.ts`
  içindeki `selectConnectAuth`):
  - `auth.password` bağımsızdır ve ayarlandığında her zaman iletilir.
  - `auth.token` öncelik sırasına göre doldurulur: önce açık paylaşılan
    belirteç, ardından açık bir `deviceToken`, ardından saklanan cihaz başına
    belirteç (`deviceId` + `role` ile anahtarlanır).
  - `auth.bootstrapToken` yalnızca yukarıdakilerden hiçbiri bir `auth.token`
    çözümlemediğinde gönderilir. Paylaşılan belirteç veya çözümlenmiş herhangi
    bir cihaz belirteci bunu bastırır.
  - Tek seferlik `AUTH_TOKEN_MISMATCH` yeniden denemesinde saklanan bir cihaz
    belirtecinin otomatik yükseltilmesi **yalnızca güvenilir uç noktalarla** sınırlıdır —
    local loopback veya sabitlenmiş `tlsFingerprint` ile `wss://`. Sabitleme
    olmadan genel `wss://` uygun değildir.
- Ek `hello-ok.auth.deviceTokens` girdileri bootstrap aktarım belirteçleridir.
  Bunları yalnızca bağlantı, `wss://` veya loopback/yerel eşleştirme gibi
  güvenilir bir taşıma üzerinde bootstrap kimlik doğrulaması kullandığında
  kalıcı olarak saklayın.
- Bir istemci **açık** `deviceToken` veya açık `scopes` sağlarsa, çağıranın
  istediği kapsam kümesi yetkili kalır; önbelleğe alınmış kapsamlar yalnızca
  istemci saklanan cihaz başına belirteci yeniden kullandığında yeniden kullanılır.
- Cihaz belirteçleri `device.token.rotate` ve `device.token.revoke` ile
  döndürülebilir/iptal edilebilir (`operator.pairing` kapsamı gerekir).
- `device.token.rotate`, döndürme meta verilerini döndürür. Yedek taşıyıcı
  belirteci yalnızca halihazırda o cihaz belirteciyle kimliği doğrulanmış aynı
  cihaz çağrıları için yankılar; böylece yalnızca belirteç kullanan istemciler
  yeniden bağlanmadan önce yedeklerini kalıcı olarak saklayabilir. Paylaşılan/
  yönetici döndürmeleri taşıyıcı belirteci yankılamaz.
- Belirteç verme, döndürme ve iptal işlemleri, o cihazın eşleştirme girdisinde
  kaydedilen onaylı rol kümesiyle sınırlı kalır; belirteç değişikliği,
  eşleştirme onayının hiç vermediği bir cihaz rolünü genişletemez veya hedefleyemez.
- Eşleştirilmiş cihaz belirteci oturumları için, çağıranın `operator.admin`
  yetkisi de yoksa cihaz yönetimi kendi kapsamıyla sınırlıdır: yönetici olmayan
  çağıranlar yalnızca **kendi** cihaz girdilerini kaldırabilir/iptal edebilir/
  döndürebilir.
- `device.token.rotate` ve `device.token.revoke`, hedef operator belirteci kapsam
  kümesini çağıranın geçerli oturum kapsamlarına karşı da denetler. Yönetici
  olmayan çağıranlar, zaten sahip olduklarından daha geniş bir operator
  belirtecini döndüremez veya iptal edemez.
- Kimlik doğrulama hataları `error.details.code` ve kurtarma ipuçlarını içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilir istemciler, önbelleğe alınmış cihaz başına belirteçle sınırlı bir yeniden deneme yapabilir.
  - Bu yeniden deneme başarısız olursa, istemciler otomatik yeniden bağlanma döngülerini durdurmalı ve operator eylem yönlendirmesini göstermelidir.
- `AUTH_SCOPE_MISMATCH`, cihaz belirtecinin tanındığı ancak istenen rolü/kapsamları
  kapsamadığı anlamına gelir. İstemciler bunu kötü bir belirteç olarak sunmamalıdır;
  operator’den yeniden eşleştirme yapmasını veya daha dar/daha geniş kapsam
  sözleşmesini onaylamasını istemelidir.

## Cihaz kimliği + eşleştirme

- Node'lar, anahtar çifti parmak izinden türetilmiş kararlı bir cihaz kimliği
  (`device.id`) içermelidir.
- Gateway'ler cihaz + rol başına belirteç verir.
- Yerel otomatik onay etkin değilse yeni cihaz kimlikleri için eşleştirme
  onayları gerekir.
- Eşleştirme otomatik onayı, doğrudan yerel local loopback bağlantılarına odaklanır.
- OpenClaw ayrıca güvenilir paylaşılan gizli yardımcı akışlar için dar bir
  arka uç/konteyner-yerel kendi kendine bağlantı yoluna sahiptir.
- Aynı ana bilgisayar tailnet veya LAN bağlantıları, eşleştirme için yine de
  uzak olarak değerlendirilir ve onay gerektirir.
- WS istemcileri normalde `connect` sırasında `device` kimliği içerir
  (operator + node). Cihazsız tek operator istisnaları açık güven yollarıdır:
  - localhost'a özel güvensiz HTTP uyumluluğu için `gateway.controlUi.allowInsecureAuth=true`.
  - başarılı `gateway.auth.mode: "trusted-proxy"` operator Control UI kimlik doğrulaması.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (son çare, ciddi güvenlik düşürmesi).
  - paylaşılan gateway belirteci/parolasıyla kimliği doğrulanmış doğrudan-loopback `gateway-client` arka uç RPC'leri.
- Tüm bağlantılar, sunucu tarafından sağlanan `connect.challenge` nonce değerini imzalamalıdır.

### Cihaz kimlik doğrulaması geçiş tanılamaları

Hâlâ challenge öncesi imzalama davranışını kullanan eski istemciler için `connect` artık
kararlı bir `error.details.reason` ile `error.details.code` altında `DEVICE_AUTH_*`
ayrıntı kodları döndürür.

Yaygın geçiş hataları:

| İleti                       | details.code                     | details.reason           | Anlamı                                             |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | İstemci `device.nonce` değerini atladı (veya boş gönderdi). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | İstemci eski/yanlış bir nonce ile imzaladı.         |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | İmza yükü v2 yüküyle eşleşmiyor.                   |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | İmzalanan zaman damgası izin verilen sapmanın dışında. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`, açık anahtar parmak iziyle eşleşmiyor. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Açık anahtar biçimi/kanonikleştirmesi başarısız oldu. |

Geçiş hedefi:

- Her zaman `connect.challenge` bekleyin.
- Sunucu nonce değerini içeren v2 yükünü imzalayın.
- Aynı nonce değerini `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza yükü `v3` değeridir; bu, cihaz/istemci/rol/kapsamlar/
  belirteç/nonce alanlarına ek olarak `platform` ve `deviceFamily` değerlerini bağlar.
- Eski `v2` imzaları uyumluluk için kabul edilmeye devam eder, ancak
  eşleştirilmiş cihaz meta verisi sabitlemesi yeniden bağlantıda komut
  politikasını hâlâ denetler.

## TLS + sabitleme

- TLS, WS bağlantıları için desteklenir.
- İstemciler isteğe bağlı olarak gateway sertifika parmak izini sabitleyebilir
  (`gateway.tls` yapılandırmasına ve `gateway.remote.tlsFingerprint` ya da CLI
  `--tls-fingerprint` değerine bakın).

## Kapsam

Bu protokol **tam gateway API'sini** açığa çıkarır (durum, kanallar, modeller, sohbet,
agent, oturumlar, node'lar, onaylar vb.). Kesin yüzey,
`src/gateway/protocol/schema.ts` içindeki TypeBox şemaları tarafından tanımlanır.

## İlgili

- [Bridge protokolü](/tr/gateway/bridge-protocol)
- [Gateway çalışma kılavuzu](/tr/gateway)
