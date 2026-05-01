---
read_when:
    - Gateway WS istemcilerini uygulama veya güncelleme
    - Protokol uyuşmazlıklarında veya bağlantı hatalarında hata ayıklama
    - Protokol şemasını/modellerini yeniden oluşturma
summary: 'Gateway WebSocket protokolü: el sıkışma, çerçeveler, sürümleme'
title: Gateway protokolü
x-i18n:
    generated_at: "2026-05-01T09:00:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ea0181fda62326ec835ff1f28ef6079e5afff5ffe3f06e08867bf16fb84f967
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protokolü, OpenClaw için **tek kontrol düzlemi + Node taşımasıdır**. Tüm istemciler (CLI, web kullanıcı arayüzü, macOS uygulaması, iOS/Android Node'ları, başsız Node'lar) WebSocket üzerinden bağlanır ve el sıkışma sırasında **rol** + **kapsam** bilgilerini bildirir.

## Taşıma

- WebSocket, JSON yükleri içeren metin çerçeveleri.
- İlk çerçeve **mutlaka** bir `connect` isteği olmalıdır.
- Bağlantı öncesi çerçeveler 64 KiB ile sınırlandırılır. Başarılı bir el sıkışmadan sonra istemciler `hello-ok.policy.maxPayload` ve `hello-ok.policy.maxBufferedBytes` sınırlarını izlemelidir. Tanılama etkinleştirildiğinde, aşırı büyük gelen çerçeveler ve yavaş giden arabellekler, Gateway etkilenen çerçeveyi kapatmadan veya düşürmeden önce `payload.large` olayları yayar. Bu olaylar boyutları, sınırları, yüzeyleri ve güvenli neden kodlarını tutar. Mesaj gövdesini, ek içeriklerini, ham çerçeve gövdesini, belirteçleri, çerezleri veya gizli değerleri tutmaz.

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

Gateway hâlâ başlangıç yardımcılarını tamamlıyorken, `connect` isteği `details.reason` değeri `"startup-sidecars"` olarak ayarlanmış ve `retryAfterMs` içeren yeniden denenebilir bir `UNAVAILABLE` hatası döndürebilir. İstemciler bu yanıtı nihai bir el sıkışma hatası olarak göstermek yerine genel bağlantı bütçeleri içinde yeniden denemelidir.

`server`, `features`, `snapshot` ve `policy` alanlarının tümü şema tarafından zorunludur (`src/gateway/protocol/schema/frames.ts`). `auth` de zorunludur ve uzlaşılan rol/kapsamları bildirir. `canvasHostUrl` isteğe bağlıdır.

Cihaz belirteci verilmediğinde, `hello-ok.auth` belirteç alanları olmadan uzlaşılan izinleri bildirir:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilen aynı süreç arka uç istemcileri (`client.id: "gateway-client"`, `client.mode: "backend"`), paylaşılan Gateway belirteci/parolasıyla kimlik doğruladıklarında doğrudan local loopback bağlantılarında `device` alanını atlayabilir. Bu yol dahili kontrol düzlemi RPC'leri için ayrılmıştır ve eski CLI/cihaz eşleştirme taban çizgilerinin alt ajan oturum güncellemeleri gibi yerel arka uç çalışmalarını engellemesini önler. Uzak istemciler, tarayıcı kökenli istemciler, Node istemcileri ve açık cihaz belirteci/cihaz kimliği istemcileri normal eşleştirme ve kapsam yükseltme denetimlerini kullanmaya devam eder.

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

Güvenilen bootstrap devir teslimi sırasında, `hello-ok.auth` `deviceTokens` içinde ek sınırlı rol girdileri de içerebilir:

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

Yerleşik Node/operator bootstrap akışı için birincil Node belirteci `scopes: []` olarak kalır ve devredilen operator belirteci bootstrap operator izin listesiyle (`operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`) sınırlı kalır. Bootstrap kapsam denetimleri rol önekli kalır: operator girdileri yalnızca operator isteklerini karşılar ve operator olmayan rollerin hâlâ kendi rol önekleri altında kapsamları olması gerekir.

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

## Çerçeveleme

- **İstek**: `{type:"req", id, method, params}`
- **Yanıt**: `{type:"res", id, ok, payload|error}`
- **Olay**: `{type:"event", event, payload, seq?, stateVersion?}`

Yan etkili yöntemler **idempotency anahtarları** gerektirir (şemaya bakın).

## Roller + kapsamlar

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

Plugin tarafından kaydedilmiş Gateway RPC yöntemleri kendi operator kapsamlarını isteyebilir, ancak ayrılmış çekirdek yönetici önekleri (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) her zaman `operator.admin` olarak çözümlenir.

Yöntem kapsamı yalnızca ilk kapıdır. `chat.send` üzerinden erişilen bazı slash komutları bunun üzerine daha sıkı komut düzeyi denetimler uygular. Örneğin, kalıcı `/config set` ve `/config unset` yazmaları `operator.admin` gerektirir.

`node.pair.approve`, temel yöntem kapsamının üzerine onay zamanında ek bir kapsam denetimine de sahiptir:

- komutsuz istekler: `operator.pairing`
- exec olmayan Node komutları içeren istekler: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which` içeren istekler:
  `operator.pairing` + `operator.admin`

### Yetenekler/komutlar/izinler (Node)

Node'lar bağlantı sırasında yetenek iddialarını bildirir:

- `caps`: üst düzey yetenek kategorileri.
- `commands`: çağırma için komut izin listesi.
- `permissions`: ayrıntılı anahtarlar (örn. `screen.record`, `camera.capture`).

Gateway bunları **iddialar** olarak değerlendirir ve sunucu tarafı izin listelerini uygular.

## Varlık

- `system-presence`, cihaz kimliğine göre anahtarlanmış girdiler döndürür.
- Varlık girdileri `deviceId`, `roles` ve `scopes` içerir; böylece kullanıcı arayüzleri, bir cihaz hem **operator** hem de **node** olarak bağlandığında bile cihaz başına tek satır gösterebilir.
- `node.list` isteğe bağlı `lastSeenAtMs` ve `lastSeenReason` alanlarını içerir. Bağlı Node'lar mevcut bağlantı zamanlarını `connect` nedeniyle `lastSeenAtMs` olarak bildirir; eşlenmiş Node'lar güvenilen bir Node olayı eşleştirme meta verilerini güncellediğinde kalıcı arka plan varlığı da bildirebilir.

### Node arka plan canlı olayı

Node'lar, eşlenmiş bir Node'un arka plan uyanması sırasında bağlı olarak işaretlenmeden canlı olduğunu kaydetmek için `event: "node.presence.alive"` ile `node.event` çağırabilir.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` kapalı bir enum'dur: `background`, `silent_push`, `bg_app_refresh`, `significant_location`, `manual` veya `connect`. Bilinmeyen trigger dizeleri kalıcılıktan önce Gateway tarafından `background` olarak normalleştirilir. Olay yalnızca kimliği doğrulanmış Node cihaz oturumları için kalıcıdır; cihazsız veya eşlenmemiş oturumlar `handled: false` döndürür.

Başarılı Gateway'ler yapılandırılmış bir sonuç döndürür:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Eski Gateway'ler `node.event` için hâlâ `{ "ok": true }` döndürebilir; istemciler bunu kalıcı varlık saklama olarak değil, onaylanmış bir RPC olarak değerlendirmelidir.

## Yayın olayı kapsamlandırması

Sunucu tarafından gönderilen WebSocket yayın olayları kapsamla sınırlandırılır; böylece eşleştirme kapsamlı veya yalnızca Node oturumları oturum içeriğini pasif olarak almaz.

- **Sohbet, ajan ve araç sonucu çerçeveleri** (akışlı `agent` olayları ve araç çağrısı sonuçları dahil) en az `operator.read` gerektirir. `operator.read` olmayan oturumlar bu çerçeveleri tamamen atlar.
- **Plugin tanımlı `plugin.*` yayınları**, Plugin'in bunları nasıl kaydettiğine bağlı olarak `operator.write` veya `operator.admin` ile sınırlandırılır.
- **Durum ve taşıma olayları** (`heartbeat`, `presence`, `tick`, bağlanma/bağlantı kesme yaşam döngüsü vb.) taşıma sağlığının kimliği doğrulanmış her oturum tarafından gözlemlenebilir kalması için kısıtlanmadan kalır.
- **Bilinmeyen yayın olayı aileleri**, kayıtlı bir işleyici bunları açıkça gevşetmedikçe varsayılan olarak kapsamla sınırlandırılır (kapalı hata davranışı).

Her istemci bağlantısı kendi istemci başına sıra numarasını tutar; böylece farklı istemciler olay akışının farklı kapsamla filtrelenmiş alt kümelerini görse bile yayınlar o sokette monoton sıralamayı korur.

## Yaygın RPC yöntem aileleri

Herkese açık WS yüzeyi yukarıdaki el sıkışma/kimlik doğrulama örneklerinden daha geniştir. Bu, oluşturulmuş bir döküm değildir — `hello-ok.features.methods`, `src/gateway/server-methods-list.ts` ile yüklü Plugin/kanal yöntem dışa aktarımlarından oluşturulan tutucu bir keşif listesidir. Bunu `src/gateway/server-methods/*.ts` için tam bir numaralandırma olarak değil, özellik keşfi olarak değerlendirin.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health`, önbelleğe alınmış veya yeni yoklanmış Gateway sağlık anlık görüntüsünü döndürür.
    - `diagnostics.stability`, son sınırlı tanılama kararlılığı kaydedicisini döndürür. Olay adları, sayılar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/Plugin adları ve oturum kimlikleri gibi operasyonel meta verileri tutar. Sohbet metnini, Webhook gövdelerini, araç çıktılarını, ham istek veya yanıt gövdelerini, belirteçleri, çerezleri ya da gizli değerleri tutmaz. Operator okuma kapsamı gereklidir.
    - `status`, `/status` tarzı Gateway özetini döndürür; hassas alanlar yalnızca admin kapsamlı operator istemcileri için eklenir.
    - `gateway.identity.get`, relay ve eşleştirme akışları tarafından kullanılan Gateway cihaz kimliğini döndürür.
    - `system-presence`, bağlı operator/Node cihazları için geçerli varlık anlık görüntüsünü döndürür.
    - `system-event`, bir sistem olayı ekler ve varlık bağlamını güncelleyebilir/yayınlayabilir.
    - `last-heartbeat`, en son kalıcı Heartbeat olayını döndürür.
    - `set-heartbeats`, Gateway üzerinde Heartbeat işlemeyi açar veya kapatır.

  </Accordion>

  <Accordion title="Modeller ve kullanım">
    - `models.list`, çalışma zamanında izin verilen model kataloğunu döndürür. Seçici boyutundaki yapılandırılmış modeller için (`agents.defaults.models` önce, ardından `models.providers.*.models`) `{ "view": "configured" }`, tam katalog için `{ "view": "all" }` iletin.
    - `usage.status`, sağlayıcı kullanım pencerelerini/kalan kota özetlerini döndürür.
    - `usage.cost`, bir tarih aralığı için toplu maliyet kullanım özetlerini döndürür.
    - `doctor.memory.status`, etkin varsayılan aracı çalışma alanı için vektör belleği / önbelleğe alınmış embedding hazır olma durumunu döndürür. Yalnızca çağıran açıkça canlı embedding sağlayıcısı ping'i istediğinde `{ "probe": true }` veya `{ "deep": true }` iletin.
    - `doctor.memory.remHarness`, uzak kontrol düzlemi istemcileri için sınırlı, salt okunur bir REM harness önizlemesi döndürür. Çalışma alanı yollarını, bellek parçacıklarını, işlenmiş dayanaklı markdown'ı ve derin terfi adaylarını içerebilir; bu nedenle çağıranların `operator.read` yetkisine ihtiyacı vardır.
    - `sessions.usage`, oturum başına kullanım özetlerini döndürür.
    - `sessions.usage.timeseries`, bir oturum için zaman serisi kullanımını döndürür.
    - `sessions.usage.logs`, bir oturum için kullanım günlüğü girdilerini döndürür.

  </Accordion>

  <Accordion title="Kanallar ve oturum açma yardımcıları">
    - `channels.status`, yerleşik + paketlenmiş kanal/plugin durum özetlerini döndürür.
    - `channels.logout`, kanalın oturum kapatmayı desteklediği durumlarda belirli bir kanal/hesap için oturumu kapatır.
    - `web.login.start`, geçerli QR destekli web kanalı sağlayıcısı için bir QR/web oturum açma akışı başlatır.
    - `web.login.wait`, bu QR/web oturum açma akışının tamamlanmasını bekler ve başarılı olursa kanalı başlatır.
    - `push.test`, kayıtlı bir iOS node'una test APNs push'u gönderir.
    - `voicewake.get`, saklanan uyandırma sözcüğü tetikleyicilerini döndürür.
    - `voicewake.set`, uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayınlar.

  </Accordion>

  <Accordion title="Mesajlaşma ve günlükler">
    - `send`, sohbet çalıştırıcısının dışındaki kanal/hesap/iş parçacığı hedefli gönderimler için doğrudan giden teslimat RPC'sidir.
    - `logs.tail`, yapılandırılmış gateway dosya günlüğü kuyruğunu imleç/sınır ve maksimum bayt denetimleriyle döndürür.

  </Accordion>

  <Accordion title="Konuşma ve TTS">
    - `talk.config`, etkin Talk yapılandırma yükünü döndürür; `includeSecrets`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.
    - `talk.mode`, WebChat/Control UI istemcileri için geçerli Talk modu durumunu ayarlar/yayınlar.
    - `talk.speak`, etkin Talk konuşma sağlayıcısı üzerinden konuşma sentezler.
    - `tts.status`, TTS etkin durumunu, etkin sağlayıcıyı, yedek sağlayıcıları ve sağlayıcı yapılandırma durumunu döndürür.
    - `tts.providers`, görünür TTS sağlayıcı envanterini döndürür.
    - `tts.enable` ve `tts.disable`, TTS tercihleri durumunu açıp kapatır.
    - `tts.setProvider`, tercih edilen TTS sağlayıcısını günceller.
    - `tts.convert`, tek seferlik metinden konuşmaya dönüştürme çalıştırır.

  </Accordion>

  <Accordion title="Gizli bilgiler, yapılandırma, güncelleme ve sihirbaz">
    - `secrets.reload`, etkin SecretRef'leri yeniden çözer ve çalışma zamanı gizli bilgi durumunu yalnızca tam başarı durumunda değiştirir.
    - `secrets.resolve`, belirli bir komut/hedef kümesi için komut hedefli gizli bilgi atamalarını çözer.
    - `config.get`, geçerli yapılandırma anlık görüntüsünü ve karmasını döndürür.
    - `config.set`, doğrulanmış bir yapılandırma yükü yazar.
    - `config.patch`, kısmi bir yapılandırma güncellemesini birleştirir.
    - `config.apply`, tam yapılandırma yükünü doğrular + değiştirir.
    - `config.schema`, Control UI ve CLI araçları tarafından kullanılan canlı yapılandırma şeması yükünü döndürür: şema, `uiHints`, sürüm ve üretim meta verileri; çalışma zamanı bunları yükleyebildiğinde plugin + kanal şeması meta verileri dahil. Şema, eşleşen alan belgelendirmesi bulunduğunda iç içe nesne, joker karakter, dizi öğesi ve `anyOf` / `oneOf` / `allOf` bileşim dalları dahil olmak üzere UI tarafından kullanılan aynı etiketlerden ve yardım metninden türetilen alan `title` / `description` meta verilerini içerir.
    - `config.schema.lookup`, bir yapılandırma yolu için yol kapsamlı bir arama yükü döndürür: normalize edilmiş yol, sığ bir şema düğümü, eşleşen ipucu + `hintPath` ve UI/CLI ayrıntı incelemesi için doğrudan alt özetler. Arama şeması düğümleri kullanıcıya yönelik belgeleri ve yaygın doğrulama alanlarını (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, sayısal/dize/dizi/nesne sınırları ve `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi bayraklar) korur. Alt özetler `key`, normalize edilmiş `path`, `type`, `required`, `hasChildren` ile eşleşen `hint` / `hintPath` değerlerini gösterir.
    - `update.run`, gateway güncelleme akışını çalıştırır ve yalnızca güncellemenin kendisi başarılı olduğunda yeniden başlatma zamanlar. Paket yöneticisi güncellemeleri, paket değişiminden sonra eski Gateway sürecinin değiştirilmiş bir `dist` ağacından tembel yükleme yapmayı sürdürmemesi için ertelenmeyen bir güncelleme yeniden başlatmasını zorunlu kılar.
    - `update.status`, kullanılabilir olduğunda yeniden başlatma sonrası çalışan sürüm dahil olmak üzere en son önbelleğe alınmış güncelleme yeniden başlatma işaretçisini döndürür.
    - `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`, WS RPC üzerinden onboarding sihirbazını sunar.

  </Accordion>

  <Accordion title="Aracı ve çalışma alanı yardımcıları">
    - `agents.list`, etkin model ve çalışma zamanı meta verileri dahil olmak üzere yapılandırılmış aracı girdilerini döndürür.
    - `agents.create`, `agents.update` ve `agents.delete`, aracı kayıtlarını ve çalışma alanı bağlantılarını yönetir.
    - `agents.files.list`, `agents.files.get` ve `agents.files.set`, bir aracı için sunulan bootstrap çalışma alanı dosyalarını yönetir.
    - `artifacts.list`, `artifacts.get` ve `artifacts.download`, açık bir `sessionKey`, `runId` veya `taskId` kapsamı için transkriptten türetilmiş yapıt özetlerini ve indirmelerini sunar. Çalıştırma ve görev sorguları, sahip oturumu sunucu tarafında çözer ve yalnızca eşleşen kökene sahip transkript medyasını döndürür; güvenli olmayan veya yerel URL kaynakları, sunucu tarafında getirmek yerine desteklenmeyen indirmeler döndürür.
    - `agent.identity.get`, bir aracı veya oturum için etkin asistan kimliğini döndürür.
    - `agent.wait`, bir çalıştırmanın bitmesini bekler ve kullanılabilir olduğunda terminal anlık görüntüsünü döndürür.

  </Accordion>

  <Accordion title="Oturum denetimi">
    - `sessions.list`, bir aracı çalışma zamanı arka ucu yapılandırıldığında satır başına `agentRuntime` meta verileri dahil olmak üzere geçerli oturum dizinini döndürür.
    - `sessions.subscribe` ve `sessions.unsubscribe`, geçerli WS istemcisi için oturum değişikliği olay aboneliklerini açıp kapatır.
    - `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`, bir oturum için transkript/mesaj olayı aboneliklerini açıp kapatır.
    - `sessions.preview`, belirli oturum anahtarları için sınırlı transkript önizlemeleri döndürür.
    - `sessions.resolve`, bir oturum hedefini çözer veya kanonikleştirir.
    - `sessions.create`, yeni bir oturum girdisi oluşturur.
    - `sessions.send`, mevcut bir oturuma mesaj gönderir.
    - `sessions.steer`, etkin bir oturum için kesme ve yönlendirme varyantıdır.
    - `sessions.abort`, bir oturum için etkin işi iptal eder. Çağıran, `key` ile isteğe bağlı `runId` iletebilir veya Gateway'in bir oturuma çözebildiği etkin çalıştırmalar için yalnızca `runId` iletebilir.
    - `sessions.patch`, oturum meta verilerini/geçersiz kılmalarını günceller ve çözümlenen kanonik modeli artı etkin `agentRuntime` değerini bildirir.
    - `sessions.reset`, `sessions.delete` ve `sessions.compact`, oturum bakımını gerçekleştirir.
    - `sessions.get`, tam saklanan oturum satırını döndürür.
    - Sohbet yürütmesi hâlâ `chat.history`, `chat.send`, `chat.abort` ve `chat.inject` kullanır. `chat.history`, UI istemcileri için görüntüleme açısından normalize edilir: satır içi yönerge etiketleri görünür metinden çıkarılır, düz metin araç çağrısı XML yükleri (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil) ve sızmış ASCII/tam genişlikli model denetim token'ları çıkarılır, tam `NO_REPLY` / `no_reply` gibi yalnızca sessiz token içeren asistan satırları atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir.

  </Accordion>

  <Accordion title="Cihaz eşleştirme ve cihaz token'ları">
    - `device.pair.list`, bekleyen ve onaylanmış eşleştirilmiş cihazları döndürür.
    - `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`, cihaz eşleştirme kayıtlarını yönetir.
    - `device.token.rotate`, eşleştirilmiş bir cihaz token'ını onaylanmış rolü ve çağıran kapsamı sınırları içinde döndürür.
    - `device.token.revoke`, eşleştirilmiş bir cihaz token'ını onaylanmış rolü ve çağıran kapsamı sınırları içinde iptal eder.

  </Accordion>

  <Accordion title="Node eşleştirme, çağırma ve bekleyen iş">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` ve `node.pair.verify`, node eşleştirme ve bootstrap doğrulamasını kapsar.
    - `node.list` ve `node.describe`, bilinen/bağlı node durumunu döndürür.
    - `node.rename`, eşleştirilmiş bir node etiketini günceller.
    - `node.invoke`, bağlı bir node'a komut iletir.
    - `node.invoke.result`, bir invoke isteğinin sonucunu döndürür.
    - `node.event`, node kaynaklı olayları gateway'e geri taşır.
    - `node.canvas.capability.refresh`, kapsamlı canvas yeteneği token'larını yeniler.
    - `node.pending.pull` ve `node.pending.ack`, bağlı node kuyruğu API'leridir.
    - `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısı kesilmiş node'lar için kalıcı bekleyen işi yönetir.

  </Accordion>

  <Accordion title="Onay aileleri">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve `exec.approval.resolve`, tek seferlik exec onayı isteklerini ve bekleyen onay arama/yeniden oynatmasını kapsar.
    - `exec.approval.waitDecision`, bekleyen bir exec onayını bekler ve nihai kararı döndürür (veya zaman aşımında `null`).
    - `exec.approvals.get` ve `exec.approvals.set`, gateway exec onay ilkesi anlık görüntülerini yönetir.
    - `exec.approvals.node.get` ve `exec.approvals.node.set`, node aktarma komutları aracılığıyla node yerel exec onay ilkesini yönetir.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` ve `plugin.approval.resolve`, plugin tanımlı onay akışlarını kapsar.

  </Accordion>

  <Accordion title="Otomasyon, Skills ve araçlar">
    - Otomasyon: `wake`, anlık veya sonraki heartbeat uyandırma metni enjeksiyonu zamanlar; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zamanlanmış işi yönetir.
    - Skills ve araçlar: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Yaygın olay aileleri

- `chat`: `chat.inject` gibi UI sohbet güncellemeleri ve yalnızca transkript içeren diğer sohbet
  olayları.
- `session.message` ve `session.tool`: abone olunmuş bir oturum için transkript/olay akışı
  güncellemeleri.
- `sessions.changed`: oturum dizini veya meta verileri değişti.
- `presence`: sistem varlık anlık görüntüsü güncellemeleri.
- `tick`: periyodik keepalive / canlılık olayı.
- `health`: gateway sağlık anlık görüntüsü güncellemesi.
- `heartbeat`: heartbeat olay akışı güncellemesi.
- `cron`: cron çalıştırması/iş değişikliği olayı.
- `shutdown`: gateway kapatma bildirimi.
- `node.pair.requested` / `node.pair.resolved`: node eşleştirme yaşam döngüsü.
- `node.invoke.request`: node invoke isteği yayını.
- `device.pair.requested` / `device.pair.resolved`: eşleştirilmiş cihaz yaşam döngüsü.
- `voicewake.changed`: uyandırma sözcüğü tetikleyici yapılandırması değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onayı
  yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin onayı
  yaşam döngüsü.

### Node yardımcı yöntemleri

- Node'lar, otomatik izin denetimleri için güncel skill yürütülebilirleri listesini almak üzere `skills.bins` çağırabilir.

### Operatör yardımcı yöntemleri

- Operatörler, bir ajan için çalışma zamanı komut envanterini almak üzere `commands.list` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan ajan çalışma alanını okumak için atlayın.
  - `scope`, birincil `name` hedefinin hangi yüzeyi hedeflediğini kontrol eder:
    - `text`, başındaki `/` olmadan birincil metin komutu belirtecini döndürür
    - `native` ve varsayılan `both` yolu, mevcut olduğunda sağlayıcı farkındalığı olan yerel adları döndürür
  - `textAliases`, `/model` ve `/m` gibi tam eğik çizgili takma adları taşır.
  - `nativeName`, varsa sağlayıcı farkındalığı olan yerel komut adını taşır.
  - `provider` isteğe bağlıdır ve yalnızca yerel adlandırmayı ve yerel Plugin komutu kullanılabilirliğini etkiler.
  - `includeArgs=false`, serileştirilmiş argüman meta verilerini yanıttan çıkarır.
- Operatörler, bir ajan için çalışma zamanı araç kataloğunu almak üzere `tools.catalog` (`operator.read`) çağırabilir. Yanıt, gruplanmış araçları ve kaynak meta verilerini içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda Plugin sahibi
  - `optional`: bir Plugin aracının isteğe bağlı olup olmadığı
- Operatörler, bir oturum için çalışma zamanında etkin araç envanterini almak üzere `tools.effective` (`operator.read`) çağırabilir.
  - `sessionKey` zorunludur.
  - Gateway, çağıranın sağladığı kimlik doğrulama veya teslim bağlamını kabul etmek yerine, güvenilir çalışma zamanı bağlamını sunucu tarafında oturumdan türetir.
  - Yanıt oturum kapsamlıdır ve etkin konuşmanın şu anda kullanabileceği core, Plugin ve kanal araçlarını yansıtır.
- Operatörler, `/tools/invoke` ile aynı Gateway ilkesi yolundan kullanılabilir bir aracı çağırmak için `tools.invoke` (`operator.write`) çağırabilir.
  - `name` zorunludur. `args`, `sessionKey`, `agentId`, `confirm` ve `idempotencyKey` isteğe bağlıdır.
  - Hem `sessionKey` hem de `agentId` mevcutsa, çözümlenen oturum ajanı `agentId` ile eşleşmelidir.
  - Yanıt, `ok`, `toolName`, isteğe bağlı `output` ve türlendirilmiş `error` alanlarıyla SDK'ya yönelik bir zarftır. Onay veya ilke retleri, Gateway araç ilkesi işlem hattını atlamak yerine yük içinde `ok:false` döndürür.
- Operatörler, bir ajan için görünür Skills envanterini almak üzere `skills.status` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan ajan çalışma alanını okumak için atlayın.
  - Yanıt, ham gizli değerleri açığa çıkarmadan uygunluğu, eksik gereksinimleri, yapılandırma kontrollerini ve temizlenmiş kurulum seçeneklerini içerir.
- Operatörler, ClawHub keşif meta verileri için `skills.search` ve `skills.detail` (`operator.read`) çağırabilir.
- Operatörler, `skills.install` (`operator.admin`) komutunu iki modda çağırabilir:
  - ClawHub modu: `{ source: "clawhub", slug, version?, force? }`, varsayılan ajan çalışma alanındaki `skills/` dizinine bir Skills klasörü kurar.
  - Gateway kurucu modu: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`, Gateway ana makinesinde bildirilmiş bir `metadata.openclaw.install` eylemi çalıştırır.
- Operatörler, `skills.update` (`operator.admin`) komutunu iki modda çağırabilir:
  - ClawHub modu, varsayılan ajan çalışma alanında izlenen tek bir slug'ı veya izlenen tüm ClawHub kurulumlarını günceller.
  - Yapılandırma modu, `enabled`, `apiKey` ve `env` gibi `skills.entries.<skillKey>` değerlerini yamalar.

### `models.list` görünümleri

`models.list`, isteğe bağlı bir `view` parametresini kabul eder:

- Atlanmış veya `"default"`: geçerli çalışma zamanı davranışı. `agents.defaults.models` yapılandırılmışsa yanıt izin verilen katalogdur; aksi halde yanıt tam Gateway kataloğudur.
- `"configured"`: seçici boyutlu davranış. `agents.defaults.models` yapılandırılmışsa yine önceliklidir. Aksi halde yanıt açık `models.providers.*.models` girdilerini kullanır ve yalnızca yapılandırılmış model satırları yoksa tam kataloğa geri döner.
- `"all"`: `agents.defaults.models` değerini atlayarak tam Gateway kataloğu. Bunu normal model seçicileri için değil, tanılama ve keşif kullanıcı arayüzleri için kullanın.

## Exec onayları

- Bir exec isteğinin onaya ihtiyacı olduğunda Gateway `exec.approval.requested` yayınlar.
- Operatör istemcileri `exec.approval.resolve` çağırarak çözer (`operator.approvals` kapsamı gerekir).
- `host=node` için `exec.approval.request`, `systemRunPlan` (kanonik `argv`/`cwd`/`rawCommand`/oturum meta verileri) içermelidir. `systemRunPlan` eksik olan istekler reddedilir.
- Onaydan sonra, iletilen `node.invoke system.run` çağrıları, yetkili komut/cwd/oturum bağlamı olarak bu kanonik `systemRunPlan` değerini yeniden kullanır.
- Bir çağıran, hazırlama ile son onaylanmış `system.run` iletimi arasında `command`, `rawCommand`, `cwd`, `agentId` veya `sessionKey` değerlerini değiştirirse Gateway, değiştirilen yüke güvenmek yerine çalıştırmayı reddeder.

## Ajan teslim geri dönüşü

- `agent` istekleri, giden teslim istemek için `deliver=true` içerebilir.
- `bestEffortDeliver=false` katı davranışı korur: çözümlenemeyen veya yalnızca dahili teslim hedefleri `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici olarak teslim edilebilir bir rota çözümlenemediğinde oturumla sınırlı yürütmeye geri dönüşe izin verir (örneğin dahili/webchat oturumları veya belirsiz çok kanallı yapılandırmalar).

## Sürümleme

- `PROTOCOL_VERSION`, `src/gateway/protocol/schema/protocol-schemas.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu uyumsuzlukları reddeder.
- Şemalar + modeller TypeBox tanımlarından oluşturulur:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### İstemci sabitleri

`src/gateway/client.ts` içindeki referans istemci bu varsayılanları kullanır. Değerler protokol v3 boyunca kararlıdır ve üçüncü taraf istemciler için beklenen temel çizgidir.

| Sabit                                     | Varsayılan                                            | Kaynak                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| İstek zaman aşımı (RPC başına)            | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Ön kimlik doğrulama / bağlantı-sınaması zaman aşımı | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env eşleştirilmiş sunucu/istemci bütçesini artırabilir) |
| İlk yeniden bağlanma geri çekilmesi       | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| En fazla yeniden bağlanma geri çekilmesi  | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Cihaz belirteci kapanışından sonra hızlı yeniden deneme sınırı | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` öncesi zorla durdurma ek süresi | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` varsayılan zaman aşımı    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Varsayılan tick aralığı (`hello-ok` öncesi) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Tick zaman aşımı kapanışı                 | sessizlik `tickIntervalMs * 2` değerini aştığında kod `4000` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Sunucu etkin `policy.tickIntervalMs`, `policy.maxPayload` ve
`policy.maxBufferedBytes` değerlerini `hello-ok` içinde duyurur; istemciler
el sıkışma öncesi varsayılanlar yerine bu değerlere uymalıdır.

## Kimlik doğrulama

- Paylaşılan gizli Gateway kimlik doğrulaması, yapılandırılmış kimlik doğrulama moduna bağlı olarak `connect.params.auth.token` veya
  `connect.params.auth.password` kullanır.
- Tailscale Serve (`gateway.auth.allowTailscale: true`) veya geri döngü olmayan
  `gateway.auth.mode: "trusted-proxy"` gibi kimlik taşıyan modlar, bağlantı kimlik doğrulaması denetimini
  `connect.params.auth.*` yerine istek üstbilgilerinden karşılar.
- Özel giriş `gateway.auth.mode: "none"`, paylaşılan gizli bağlantı kimlik doğrulamasını
  tamamen atlar; bu modu herkese açık/güvenilmeyen girişlerde açığa çıkarmayın.
- Eşleştirmeden sonra Gateway, bağlantı rolü + kapsamlarıyla sınırlı bir **cihaz belirteci** verir.
  Bu belirteç `hello-ok.auth.deviceToken` içinde döndürülür ve istemci tarafından gelecekteki bağlantılar için
  kalıcı olarak saklanmalıdır.
- İstemciler, başarılı herhangi bir bağlantıdan sonra birincil `hello-ok.auth.deviceToken` değerini kalıcı olarak saklamalıdır.
- Bu **saklanan** cihaz belirteciyle yeniden bağlanmak, o belirteç için saklanan
  onaylanmış kapsam kümesini de yeniden kullanmalıdır. Bu, daha önce verilmiş
  okuma/yoklama/durum erişimini korur ve yeniden bağlantıların sessizce daha dar
  bir örtük yalnızca yönetici kapsamına daralmasını önler.
- İstemci tarafı bağlantı kimlik doğrulaması derleme işlemi (`src/gateway/client.ts` içindeki
  `selectConnectAuth`):
  - `auth.password` bağımsızdır ve ayarlandığında her zaman iletilir.
  - `auth.token` öncelik sırasına göre doldurulur: önce açık paylaşılan belirteç,
    ardından açık bir `deviceToken`, ardından saklanan cihaz başına belirteç (`deviceId` + `role` ile anahtarlanır).
  - `auth.bootstrapToken` yalnızca yukarıdakilerin hiçbiri bir `auth.token`
    çözemediğinde gönderilir. Paylaşılan belirteç veya çözümlenen herhangi bir cihaz belirteci bunu bastırır.
  - Tek seferlik `AUTH_TOKEN_MISMATCH` yeniden denemesinde saklanan bir cihaz belirtecinin
    otomatik yükseltilmesi **yalnızca güvenilir uç noktalarla** sınırlıdır —
    loopback veya sabitlenmiş bir `tlsFingerprint` ile `wss://`. Sabitleme olmadan herkese açık `wss://`
    uygun değildir.
- Ek `hello-ok.auth.deviceTokens` girdileri önyükleme devir belirteçleridir.
  Bunları yalnızca bağlantı, `wss://` veya loopback/yerel eşleştirme gibi güvenilir bir taşıma üzerinde
  önyükleme kimlik doğrulaması kullandığında kalıcı olarak saklayın.
- Bir istemci **açık** bir `deviceToken` veya açık `scopes` sağlarsa, çağıranın istediği
  kapsam kümesi yetkili kalır; önbelleğe alınmış kapsamlar yalnızca istemci saklanan cihaz başına belirteci
  yeniden kullandığında yeniden kullanılır.
- Cihaz belirteçleri `device.token.rotate` ve
  `device.token.revoke` aracılığıyla döndürülebilir/iptal edilebilir (`operator.pairing` kapsamı gerekir).
- `device.token.rotate` döndürme meta verisi döndürür. Yedek taşıyıcı belirteci yalnızca aynı cihazdan yapılan
  ve zaten o cihaz belirteciyle kimliği doğrulanmış çağrılar için tekrarlar; böylece yalnızca belirteç kullanan
  istemciler yeniden bağlanmadan önce yedeklerini kalıcı olarak saklayabilir. Paylaşılan/yönetici döndürmeleri
  taşıyıcı belirteci tekrar etmez.
- Belirteç verme, döndürme ve iptal işlemleri, ilgili cihazın eşleştirme girdisinde
  kaydedilmiş onaylı rol kümesiyle sınırlı kalır; belirteç mutasyonu, eşleştirme onayının hiç vermediği
  bir cihaz rolünü genişletemez veya hedefleyemez.
- Eşleştirilmiş cihaz belirteci oturumlarında, çağıranda ayrıca `operator.admin` yoksa
  cihaz yönetimi kendi kendine kapsamlıdır: yönetici olmayan çağıranlar yalnızca **kendi** cihaz girdilerini
  kaldırabilir/iptal edebilir/döndürebilir.
- `device.token.rotate` ve `device.token.revoke`, hedef operatör belirteci kapsam kümesini
  çağıranın geçerli oturum kapsamlarına göre de denetler. Yönetici olmayan çağıranlar
  halihazırda sahip olduklarından daha geniş bir operatör belirtecini döndüremez veya iptal edemez.
- Kimlik doğrulama hataları `error.details.code` ve kurtarma ipuçlarını içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilir istemciler, önbelleğe alınmış cihaz başına belirteçle bir sınırlı yeniden deneme yapmayı deneyebilir.
  - Bu yeniden deneme başarısız olursa, istemciler otomatik yeniden bağlanma döngülerini durdurmalı ve operatör eylemi rehberliğini göstermelidir.

## Cihaz kimliği + eşleştirme

- Node'lar, anahtar çifti parmak izinden türetilen kararlı bir cihaz kimliği (`device.id`) içermelidir.
- Gateway'ler cihaz + rol başına belirteç verir.
- Yerel otomatik onay etkin değilse yeni cihaz kimlikleri için eşleştirme onayları gerekir.
- Eşleştirme otomatik onayı, doğrudan local loopback bağlantıları etrafında merkezlenir.
- OpenClaw ayrıca güvenilir paylaşılan gizli yardımcı akışları için dar bir arka uç/kapsayıcı yerel kendi kendine bağlantı yoluna sahiptir.
- Aynı ana makine tailnet veya LAN bağlantıları eşleştirme açısından yine uzak kabul edilir ve
  onay gerektirir.
- WS istemcileri normalde `connect` sırasında `device` kimliğini içerir (operatör +
  node). Cihazsız tek operatör istisnaları açık güven yollarıdır:
  - localhost'a özel güvensiz HTTP uyumluluğu için `gateway.controlUi.allowInsecureAuth=true`.
  - başarılı `gateway.auth.mode: "trusted-proxy"` operatör Control UI kimlik doğrulaması.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (acil durum, ciddi güvenlik düşürmesi).
  - paylaşılan Gateway belirteci/parolasıyla kimliği doğrulanmış doğrudan loopback `gateway-client` arka uç RPC'leri.
- Tüm bağlantılar, sunucunun sağladığı `connect.challenge` nonce değerini imzalamalıdır.

### Cihaz kimlik doğrulaması geçiş tanıları

Hâlâ zorluk öncesi imzalama davranışını kullanan eski istemciler için `connect` artık
`error.details.code` altında kararlı bir `error.details.reason` ile `DEVICE_AUTH_*` ayrıntı kodları döndürür.

Yaygın geçiş hataları:

| Mesaj                       | details.code                     | details.reason           | Anlam                                              |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | İstemci `device.nonce` değerini atladı (veya boş gönderdi). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | İstemci eski/yanlış bir nonce ile imzaladı.        |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | İmza yükü v2 yüküyle eşleşmiyor.                   |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | İmzalı zaman damgası izin verilen sapmanın dışında. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`, açık anahtar parmak iziyle eşleşmiyor. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Açık anahtar biçimi/kanonikleştirme başarısız oldu. |

Geçiş hedefi:

- Her zaman `connect.challenge` değerini bekleyin.
- Sunucu nonce değerini içeren v2 yükünü imzalayın.
- Aynı nonce değerini `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza yükü `v3` değeridir; bu, cihaz/istemci/rol/kapsamlar/belirteç/nonce alanlarına ek olarak
  `platform` ve `deviceFamily` değerlerini bağlar.
- Eski `v2` imzaları uyumluluk için kabul edilmeye devam eder, ancak eşleştirilmiş cihaz
  meta veri sabitlemesi yeniden bağlantıda komut ilkesini yine denetler.

## TLS + sabitleme

- TLS, WS bağlantıları için desteklenir.
- İstemciler isteğe bağlı olarak Gateway sertifika parmak izini sabitleyebilir (`gateway.tls`
  yapılandırmasına ek olarak `gateway.remote.tlsFingerprint` veya CLI `--tls-fingerprint` bölümüne bakın).

## Kapsam

Bu protokol **tam Gateway API'sini** açığa çıkarır (durum, kanallar, modeller, sohbet,
aracı, oturumlar, node'lar, onaylar vb.). Tam yüzey
`src/gateway/protocol/schema.ts` içindeki TypeBox şemaları tarafından tanımlanır.

## İlgili

- [Köprü protokolü](/tr/gateway/bridge-protocol)
- [Gateway çalışma kılavuzu](/tr/gateway)
