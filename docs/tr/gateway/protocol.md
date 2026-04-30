---
read_when:
    - Gateway WS istemcilerini uygulamak veya güncellemek
    - Protokol uyuşmazlıklarında veya bağlantı hatalarında hata ayıklama
    - Protokol şemasını/modellerini yeniden oluşturma
summary: 'Gateway WebSocket protokolü: el sıkışma, çerçeveler, sürümleme'
title: Gateway protokolü
x-i18n:
    generated_at: "2026-04-30T09:24:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d922e9b4b778c333873e551498b905461f30f944e809555b45669ae2f5c404
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protokolü, OpenClaw için **tek denetim düzlemi + düğüm aktarımı**dır. Tüm istemciler (CLI, web UI, macOS uygulaması, iOS/Android düğümleri, başsız düğümler) WebSocket üzerinden bağlanır ve el sıkışma sırasında **rol** + **kapsam** bilgilerini bildirir.

## Aktarım

- WebSocket, JSON yükleri içeren metin çerçeveleri.
- İlk çerçeve **mutlaka** bir `connect` isteği olmalıdır.
- Bağlantı öncesi çerçeveler 64 KiB ile sınırlıdır. Başarılı bir el sıkışmadan sonra istemciler `hello-ok.policy.maxPayload` ve `hello-ok.policy.maxBufferedBytes` sınırlarına uymalıdır. Tanılama etkinleştirildiğinde, aşırı büyük gelen çerçeveler ve yavaş giden tamponlar, Gateway etkilenen çerçeveyi kapatmadan veya düşürmeden önce `payload.large` olayları yayar. Bu olaylar boyutları, sınırları, yüzeyleri ve güvenli neden kodlarını tutar. Mesaj gövdesini, ek içeriklerini, ham çerçeve gövdesini, token’ları, çerezleri veya gizli değerleri tutmazlar.

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

Gateway başlangıç yan görevlerini hâlâ tamamlarken, `connect` isteği `details.reason` değeri `"startup-sidecars"` olarak ayarlanmış ve `retryAfterMs` içeren yeniden denenebilir bir `UNAVAILABLE` hatası döndürebilir. İstemciler bu yanıtı nihai bir el sıkışma hatası olarak göstermemeli, genel bağlantı bütçeleri içinde yeniden denemelidir.

`server`, `features`, `snapshot` ve `policy` şema tarafından zorunlu kılınır (`src/gateway/protocol/schema/frames.ts`). `auth` da zorunludur ve üzerinde uzlaşılan rol/kapsamları bildirir. `canvasHostUrl` isteğe bağlıdır.

Cihaz token’ı verilmediğinde, `hello-ok.auth` token alanları olmadan üzerinde uzlaşılan izinleri bildirir:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilen aynı işlem backend istemcileri (`client.id: "gateway-client"`, `client.mode: "backend"`), paylaşılan Gateway token’ı/parolası ile kimlik doğruladıklarında doğrudan loopback bağlantılarında `device` alanını atlayabilir. Bu yol dahili denetim düzlemi RPC’leri için ayrılmıştır ve eski CLI/cihaz eşleştirme temel değerlerinin alt ajan oturum güncellemeleri gibi yerel backend çalışmalarını engellemesini önler. Uzak istemciler, tarayıcı kaynaklı istemciler, düğüm istemcileri ve açık cihaz-token’ı/cihaz-kimliği istemcileri normal eşleştirme ve kapsam yükseltme kontrollerini kullanmaya devam eder.

Bir cihaz token’ı verildiğinde, `hello-ok` ayrıca şunu içerir:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilen bootstrap devri sırasında, `hello-ok.auth` `deviceTokens` içinde ek sınırlı rol girdileri de içerebilir:

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

Yerleşik düğüm/operator bootstrap akışı için birincil düğüm token’ı `scopes: []` olarak kalır ve devredilen tüm operator token’ları bootstrap operator izin listesiyle sınırlı kalır (`operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`). Bootstrap kapsam kontrolleri rol önekli kalır: operator girdileri yalnızca operator isteklerini karşılar ve operator olmayan roller hâlâ kendi rol önekleri altında kapsam gerektirir.

### Düğüm örneği

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

Yan etki oluşturan yöntemler **idempotency anahtarları** gerektirir (şemaya bakın).

## Roller + kapsamlar

### Roller

- `operator` = denetim düzlemi istemcisi (CLI/UI/otomasyon).
- `node` = yetenek konağı (camera/screen/canvas/system.run).

### Kapsamlar (operator)

Yaygın kapsamlar:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` ile `talk.config`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.

Plugin tarafından kaydedilen Gateway RPC yöntemleri kendi operator kapsamlarını isteyebilir, ancak ayrılmış çekirdek yönetici önekleri (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) her zaman `operator.admin` olarak çözülür.

Yöntem kapsamı yalnızca ilk kapıdır. `chat.send` üzerinden ulaşılan bazı slash komutları bunun üzerine daha sıkı komut düzeyi kontroller uygular. Örneğin, kalıcı `/config set` ve `/config unset` yazmaları `operator.admin` gerektirir.

`node.pair.approve`, temel yöntem kapsamının üzerine onay zamanında ek bir kapsam kontrolü de uygular:

- komutsuz istekler: `operator.pairing`
- exec olmayan düğüm komutları içeren istekler: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which` içeren istekler: `operator.pairing` + `operator.admin`

### Yetenekler/komutlar/izinler (düğüm)

Düğümler bağlantı sırasında yetenek iddialarını bildirir:

- `caps`: üst düzey yetenek kategorileri.
- `commands`: çağırma için komut izin listesi.
- `permissions`: ayrıntılı anahtarlar (örn. `screen.record`, `camera.capture`).

Gateway bunları **iddia** olarak ele alır ve sunucu tarafı izin listelerini uygular.

## Varlık

- `system-presence`, cihaz kimliğine göre anahtarlanmış girdiler döndürür.
- Varlık girdileri `deviceId`, `roles` ve `scopes` içerir; böylece UI’lar bir cihaz hem **operator** hem de **node** olarak bağlandığında bile cihaz başına tek satır gösterebilir.
- `node.list`, isteğe bağlı `lastSeenAtMs` ve `lastSeenReason` alanlarını içerir. Bağlı düğümler mevcut bağlantı zamanlarını `connect` nedeniyle `lastSeenAtMs` olarak bildirir; eşleştirilmiş düğümler, güvenilen bir düğüm olayı eşleştirme meta verilerini güncellediğinde kalıcı arka plan varlığı da bildirebilir.

### Düğüm arka plan alive olayı

Düğümler, eşleştirilmiş bir düğümün arka plan uyanışı sırasında bağlı olarak işaretlenmeden canlı olduğunu kaydetmek için `event: "node.presence.alive"` ile `node.event` çağırabilir.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` kapalı bir enum’dur: `background`, `silent_push`, `bg_app_refresh`, `significant_location`, `manual` veya `connect`. Bilinmeyen trigger dizeleri kalıcılıktan önce Gateway tarafından `background` olarak normalleştirilir. Olay yalnızca kimliği doğrulanmış düğüm cihaz oturumları için kalıcıdır; cihazsız veya eşleştirilmemiş oturumlar `handled: false` döndürür.

Başarılı gateway’ler yapılandırılmış bir sonuç döndürür:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Daha eski gateway’ler `node.event` için hâlâ `{ "ok": true }` döndürebilir; istemciler bunu kalıcı varlık saklama olarak değil, onaylanmış bir RPC olarak değerlendirmelidir.

## Yayın olayı kapsamlandırması

Sunucu tarafından gönderilen WebSocket yayın olayları kapsam kapılıdır; böylece eşleştirme kapsamlı veya yalnızca düğüm oturumları oturum içeriğini pasif olarak almaz.

- **Sohbet, ajan ve araç sonucu çerçeveleri** (akışlı `agent` olayları ve araç çağrısı sonuçları dahil) en az `operator.read` gerektirir. `operator.read` olmayan oturumlar bu çerçeveleri tamamen atlar.
- **Plugin tanımlı `plugin.*` yayınları**, Plugin’in onları nasıl kaydettiğine bağlı olarak `operator.write` veya `operator.admin` ile kapılanır.
- **Durum ve aktarım olayları** (`heartbeat`, `presence`, `tick`, bağlantı/bağlantı kesme yaşam döngüsü vb.) sınırsız kalır; böylece aktarım sağlığı her kimliği doğrulanmış oturum tarafından gözlemlenebilir kalır.
- **Bilinmeyen yayın olayı aileleri**, kayıtlı bir işleyici açıkça gevşetmediği sürece varsayılan olarak kapsam kapılıdır (kapalı hata).

Her istemci bağlantısı kendi istemci başına sıra numarasını tutar; böylece farklı istemciler olay akışının farklı kapsam-filtreli alt kümelerini görse bile yayınlar o sokette monoton sıralamayı korur.

## Yaygın RPC yöntem aileleri

Genel WS yüzeyi yukarıdaki el sıkışma/kimlik doğrulama örneklerinden daha geniştir. Bu oluşturulmuş bir döküm değildir — `hello-ok.features.methods`, `src/gateway/server-methods-list.ts` ile yüklü Plugin/kanal yöntem dışa aktarımlarından oluşturulan muhafazakâr bir keşif listesidir. Bunu `src/gateway/server-methods/*.ts` için tam bir numaralandırma değil, özellik keşfi olarak değerlendirin.

<AccordionGroup>
  <Accordion title="Sistem ve kimlik">
    - `health`, önbelleğe alınmış veya yeni yoklanmış Gateway sağlık anlık görüntüsünü döndürür.
    - `diagnostics.stability`, son sınırlı tanılama kararlılığı kaydedicisini döndürür. Olay adları, sayılar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/Plugin adları ve oturum kimlikleri gibi operasyonel meta verileri tutar. Sohbet metnini, webhook gövdelerini, araç çıktılarını, ham istek veya yanıt gövdelerini, token’ları, çerezleri veya gizli değerleri tutmaz. Operator okuma kapsamı gereklidir.
    - `status`, `/status` tarzı Gateway özetini döndürür; hassas alanlar yalnızca admin kapsamlı operator istemcileri için dahil edilir.
    - `gateway.identity.get`, relay ve eşleştirme akışları tarafından kullanılan Gateway cihaz kimliğini döndürür.
    - `system-presence`, bağlı operator/düğüm cihazları için mevcut varlık anlık görüntüsünü döndürür.
    - `system-event`, bir sistem olayı ekler ve varlık bağlamını güncelleyebilir/yayınlayabilir.
    - `last-heartbeat`, son kalıcı heartbeat olayını döndürür.
    - `set-heartbeats`, Gateway üzerinde heartbeat işlemeyi açıp kapatır.

  </Accordion>

  <Accordion title="Modeller ve kullanım">
    - `models.list`, çalışma zamanında izin verilen model kataloğunu döndürür. Seçici boyutundaki yapılandırılmış modeller için `{ "view": "configured" }` iletin (`agents.defaults.models` önce, ardından `models.providers.*.models`), tam katalog için `{ "view": "all" }` iletin.
    - `usage.status`, sağlayıcı kullanım pencerelerini/kalan kota özetlerini döndürür.
    - `usage.cost`, bir tarih aralığı için toplulaştırılmış maliyet kullanım özetlerini döndürür.
    - `doctor.memory.status`, etkin varsayılan ajan çalışma alanı için vektör belleği / önbelleğe alınmış embedding hazır olma durumunu döndürür. Yalnızca çağıran açıkça canlı bir embedding sağlayıcı ping'i istediğinde `{ "probe": true }` veya `{ "deep": true }` iletin.
    - `doctor.memory.remHarness`, uzak kontrol düzlemi istemcileri için sınırlı, salt okunur bir REM harness önizlemesi döndürür. Çalışma alanı yollarını, bellek parçacıklarını, işlenmiş temellendirilmiş markdown'u ve derin yükseltme adaylarını içerebilir; bu nedenle çağıranların `operator.read` iznine ihtiyacı vardır.
    - `sessions.usage`, oturum başına kullanım özetlerini döndürür.
    - `sessions.usage.timeseries`, bir oturum için zaman serisi kullanımını döndürür.
    - `sessions.usage.logs`, bir oturum için kullanım günlüğü girdilerini döndürür.

  </Accordion>

  <Accordion title="Kanallar ve oturum açma yardımcıları">
    - `channels.status`, yerleşik + paketlenmiş kanal/plugin durum özetlerini döndürür.
    - `channels.logout`, kanal oturum kapatmayı destekliyorsa belirli bir kanaldan/hesaptan oturumu kapatır.
    - `web.login.start`, geçerli QR özellikli web kanal sağlayıcısı için QR/web oturum açma akışını başlatır.
    - `web.login.wait`, bu QR/web oturum açma akışının tamamlanmasını bekler ve başarılı olursa kanalı başlatır.
    - `push.test`, kayıtlı bir iOS Node'una test APNs push'u gönderir.
    - `voicewake.get`, saklanan uyandırma sözcüğü tetikleyicilerini döndürür.
    - `voicewake.set`, uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayınlar.

  </Accordion>

  <Accordion title="Mesajlaşma ve günlükler">
    - `send`, sohbet çalıştırıcısı dışında kanal/hesap/ileti dizisi hedefli gönderimler için doğrudan giden teslimat RPC'sidir.
    - `logs.tail`, yapılandırılmış Gateway dosya günlüğü kuyruğunu imleç/sınır ve maksimum bayt kontrolleriyle döndürür.

  </Accordion>

  <Accordion title="Konuşma ve TTS">
    - `talk.config`, etkili Talk yapılandırma payload'unu döndürür; `includeSecrets`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.
    - `talk.mode`, WebChat/Control UI istemcileri için geçerli Talk modu durumunu ayarlar/yayınlar.
    - `talk.speak`, etkin Talk konuşma sağlayıcısı üzerinden konuşma sentezler.
    - `tts.status`, TTS etkin durumunu, etkin sağlayıcıyı, yedek sağlayıcıları ve sağlayıcı yapılandırma durumunu döndürür.
    - `tts.providers`, görünür TTS sağlayıcı envanterini döndürür.
    - `tts.enable` ve `tts.disable`, TTS tercih durumunu açıp kapatır.
    - `tts.setProvider`, tercih edilen TTS sağlayıcısını günceller.
    - `tts.convert`, tek seferlik metinden konuşmaya dönüştürme çalıştırır.

  </Accordion>

  <Accordion title="Sırlar, yapılandırma, güncelleme ve sihirbaz">
    - `secrets.reload`, etkin SecretRef'leri yeniden çözer ve çalışma zamanı secret durumunu yalnızca tam başarıda değiştirir.
    - `secrets.resolve`, belirli bir komut/hedef kümesi için komut hedefli secret atamalarını çözer.
    - `config.get`, geçerli yapılandırma anlık görüntüsünü ve hash'i döndürür.
    - `config.set`, doğrulanmış bir yapılandırma payload'u yazar.
    - `config.patch`, kısmi bir yapılandırma güncellemesini birleştirir.
    - `config.apply`, tam yapılandırma payload'unu doğrular + değiştirir.
    - `config.schema`, Control UI ve CLI araçları tarafından kullanılan canlı yapılandırma şeması payload'unu döndürür: şema, `uiHints`, sürüm ve üretim metadatası; çalışma zamanı yükleyebildiğinde plugin + kanal şeması metadatası dahil. Şema, eşleşen alan dokümantasyonu bulunduğunda iç içe nesne, joker karakter, dizi öğesi ve `anyOf` / `oneOf` / `allOf` bileşim dalları dahil olmak üzere UI tarafından kullanılan aynı etiketlerden ve yardım metninden türetilen alan `title` / `description` metadatasını içerir.
    - `config.schema.lookup`, bir yapılandırma yolu için yol kapsamlı bir arama payload'u döndürür: normalize edilmiş yol, sığ bir şema düğümü, eşleşen ipucu + `hintPath` ve UI/CLI ayrıntıya inme için doğrudan alt özetler. Arama şeması düğümleri kullanıcıya yönelik dokümanları ve yaygın doğrulama alanlarını (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, sayısal/dize/dizi/nesne sınırları ve `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi bayraklar) korur. Alt özetler `key`, normalize edilmiş `path`, `type`, `required`, `hasChildren` ile eşleşen `hint` / `hintPath` değerlerini sunar.
    - `update.run`, Gateway güncelleme akışını çalıştırır ve yalnızca güncellemenin kendisi başarılı olduğunda yeniden başlatma zamanlar.
    - `update.status`, mevcutsa yeniden başlatma sonrası çalışan sürüm dahil, en son önbelleğe alınmış güncelleme yeniden başlatma sentinel'ini döndürür.
    - `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`, başlangıç sihirbazını WS RPC üzerinden sunar.

  </Accordion>

  <Accordion title="Ajan ve çalışma alanı yardımcıları">
    - `agents.list`, etkili model ve çalışma zamanı metadatası dahil yapılandırılmış ajan girdilerini döndürür.
    - `agents.create`, `agents.update` ve `agents.delete`, ajan kayıtlarını ve çalışma alanı bağlantılarını yönetir.
    - `agents.files.list`, `agents.files.get` ve `agents.files.set`, bir ajan için sunulan bootstrap çalışma alanı dosyalarını yönetir.
    - `agent.identity.get`, bir ajan veya oturum için etkili asistan kimliğini döndürür.
    - `agent.wait`, bir çalıştırmanın bitmesini bekler ve mevcutsa son anlık görüntüyü döndürür.

  </Accordion>

  <Accordion title="Oturum kontrolü">
    - `sessions.list`, bir ajan çalışma zamanı backend'i yapılandırıldığında satır başına `agentRuntime` metadatası dahil geçerli oturum dizinini döndürür.
    - `sessions.subscribe` ve `sessions.unsubscribe`, geçerli WS istemcisi için oturum değişikliği olayı aboneliklerini açıp kapatır.
    - `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`, bir oturum için transkript/mesaj olayı aboneliklerini açıp kapatır.
    - `sessions.preview`, belirli oturum anahtarları için sınırlı transkript önizlemeleri döndürür.
    - `sessions.resolve`, bir oturum hedefini çözer veya kanonikleştirir.
    - `sessions.create`, yeni bir oturum girdisi oluşturur.
    - `sessions.send`, mevcut bir oturuma mesaj gönderir.
    - `sessions.steer`, etkin bir oturum için kesme-ve-yönlendirme varyantıdır.
    - `sessions.abort`, bir oturum için etkin işi iptal eder. Çağıran, `key` ile birlikte isteğe bağlı `runId` iletebilir veya Gateway'in bir oturuma çözebildiği etkin çalıştırmalar için yalnızca `runId` iletebilir.
    - `sessions.patch`, oturum metadatasını/geçersiz kılmalarını günceller ve çözümlenen kanonik modeli artı etkili `agentRuntime` değerini raporlar.
    - `sessions.reset`, `sessions.delete` ve `sessions.compact`, oturum bakımını gerçekleştirir.
    - `sessions.get`, saklanan tam oturum satırını döndürür.
    - Sohbet yürütmesi hâlâ `chat.history`, `chat.send`, `chat.abort` ve `chat.inject` kullanır. `chat.history`, UI istemcileri için görüntüleme açısından normalize edilir: satır içi yönerge etiketleri görünür metinden çıkarılır, düz metin araç çağrısı XML payload'ları (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil) ve sızmış ASCII/tam genişlikli model kontrol token'ları çıkarılır, tam `NO_REPLY` / `no_reply` gibi saf sessiz-token asistan satırları atlanır ve çok büyük satırlar yer tutucularla değiştirilebilir.

  </Accordion>

  <Accordion title="Cihaz eşleştirme ve cihaz token'ları">
    - `device.pair.list`, bekleyen ve onaylanmış eşleştirilmiş cihazları döndürür.
    - `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`, cihaz eşleştirme kayıtlarını yönetir.
    - `device.token.rotate`, eşleştirilmiş bir cihaz token'ını onaylanmış rolü ve çağıran kapsamı sınırları içinde döndürür.
    - `device.token.revoke`, eşleştirilmiş bir cihaz token'ını onaylanmış rolü ve çağıran kapsamı sınırları içinde iptal eder.

  </Accordion>

  <Accordion title="Node eşleştirme, çağırma ve bekleyen iş">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` ve `node.pair.verify`, Node eşleştirme ve bootstrap doğrulamasını kapsar.
    - `node.list` ve `node.describe`, bilinen/bağlı Node durumunu döndürür.
    - `node.rename`, eşleştirilmiş bir Node etiketini günceller.
    - `node.invoke`, bağlı bir Node'a komut iletir.
    - `node.invoke.result`, bir çağırma isteği için sonucu döndürür.
    - `node.event`, Node kaynaklı olayları Gateway'e geri taşır.
    - `node.canvas.capability.refresh`, kapsamlı canvas yeteneği token'larını yeniler.
    - `node.pending.pull` ve `node.pending.ack`, bağlı Node kuyruk API'leridir.
    - `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısı kesilmiş Node'lar için kalıcı bekleyen işi yönetir.

  </Accordion>

  <Accordion title="Onay aileleri">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve `exec.approval.resolve`, tek seferlik exec onay isteklerini ve bekleyen onay arama/yeniden oynatmayı kapsar.
    - `exec.approval.waitDecision`, bekleyen bir exec onayını bekler ve nihai kararı döndürür (veya zaman aşımında `null`).
    - `exec.approvals.get` ve `exec.approvals.set`, Gateway exec onay politikası anlık görüntülerini yönetir.
    - `exec.approvals.node.get` ve `exec.approvals.node.set`, Node aktarma komutları üzerinden Node yerel exec onay politikasını yönetir.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` ve `plugin.approval.resolve`, plugin tanımlı onay akışlarını kapsar.

  </Accordion>

  <Accordion title="Otomasyon, skills ve araçlar">
    - Otomasyon: `wake`, anlık veya sonraki heartbeat uyandırma metni enjeksiyonunu zamanlar; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zamanlanmış işi yönetir.
    - Skills ve araçlar: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Yaygın olay aileleri

- `chat`: `chat.inject` gibi UI sohbet güncellemeleri ve diğer yalnızca transkript sohbet
  olayları.
- `session.message` ve `session.tool`: abone olunan bir oturum için transkript/olay akışı
  güncellemeleri.
- `sessions.changed`: oturum dizini veya metadatası değişti.
- `presence`: sistem presence anlık görüntüsü güncellemeleri.
- `tick`: periyodik keepalive / canlılık olayı.
- `health`: Gateway sağlık anlık görüntüsü güncellemesi.
- `heartbeat`: heartbeat olay akışı güncellemesi.
- `cron`: cron çalıştırma/iş değişikliği olayı.
- `shutdown`: Gateway kapatma bildirimi.
- `node.pair.requested` / `node.pair.resolved`: Node eşleştirme yaşam döngüsü.
- `node.invoke.request`: Node çağırma isteği yayını.
- `device.pair.requested` / `device.pair.resolved`: eşleştirilmiş cihaz yaşam döngüsü.
- `voicewake.changed`: uyandırma sözcüğü tetikleyici yapılandırması değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onay
  yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin onay
  yaşam döngüsü.

### Node yardımcı yöntemleri

- Node'lar, otomatik izin kontrolleri için geçerli skill yürütülebilirleri listesini almak üzere `skills.bins` çağırabilir.

### Operatör yardımcı yöntemleri

- Operatörler, bir ajan için çalışma zamanı komut envanterini almak üzere `commands.list` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan ajan çalışma alanını okumak için bunu atlayın.
  - `scope`, birincil `name` değerinin hangi yüzeyi hedeflediğini denetler:
    - `text`, baştaki `/` olmadan birincil metin komutu belirtecini döndürür
    - `native` ve varsayılan `both` yolu, varsa sağlayıcıya duyarlı yerel adları döndürür
  - `textAliases`, `/model` ve `/m` gibi tam slash takma adlarını taşır.
  - `nativeName`, varsa sağlayıcıya duyarlı yerel komut adını taşır.
  - `provider` isteğe bağlıdır ve yalnızca yerel adlandırmayı ve yerel plugin komutu kullanılabilirliğini etkiler.
  - `includeArgs=false`, yanıttan serileştirilmiş argüman meta verilerini çıkarır.
- Operatörler, bir ajan için çalışma zamanı araç kataloğunu almak üzere `tools.catalog` (`operator.read`) çağırabilir. Yanıt, gruplanmış araçları ve köken meta verilerini içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda plugin sahibi
  - `optional`: bir plugin aracının isteğe bağlı olup olmadığı
- Operatörler, bir oturum için çalışma zamanında etkin araç envanterini almak üzere `tools.effective` (`operator.read`) çağırabilir.
  - `sessionKey` zorunludur.
  - Gateway, çağıranın sağladığı kimlik doğrulama veya teslimat bağlamını kabul etmek yerine güvenilir çalışma zamanı bağlamını sunucu tarafında oturumdan türetir.
  - Yanıt oturum kapsamındadır ve çekirdek, plugin ve kanal araçları dahil olmak üzere etkin konuşmanın şu anda kullanabileceklerini yansıtır.
- Operatörler, bir ajan için görünür yetenek envanterini almak üzere `skills.status` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan ajan çalışma alanını okumak için bunu atlayın.
  - Yanıt, ham gizli değerleri açığa çıkarmadan uygunluğu, eksik gereksinimleri, yapılandırma denetimlerini ve temizlenmiş kurulum seçeneklerini içerir.
- Operatörler, ClawHub keşif meta verileri için `skills.search` ve `skills.detail` (`operator.read`) çağırabilir.
- Operatörler, iki modda `skills.install` (`operator.admin`) çağırabilir:
  - ClawHub modu: `{ source: "clawhub", slug, version?, force? }`, varsayılan ajan çalışma alanındaki `skills/` dizinine bir yetenek klasörü kurar.
  - Gateway kurucu modu: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`, Gateway ana makinesinde bildirilmiş bir `metadata.openclaw.install` eylemi çalıştırır.
- Operatörler, iki modda `skills.update` (`operator.admin`) çağırabilir:
  - ClawHub modu, izlenen tek bir slug'ı veya varsayılan ajan çalışma alanındaki tüm izlenen ClawHub kurulumlarını günceller.
  - Yapılandırma modu, `enabled`, `apiKey` ve `env` gibi `skills.entries.<skillKey>` değerlerini yamalar.

### `models.list` görünümleri

`models.list`, isteğe bağlı bir `view` parametresi kabul eder:

- Atlanmış veya `"default"`: geçerli çalışma zamanı davranışı. `agents.defaults.models` yapılandırılmışsa yanıt izin verilen katalogdur; aksi halde yanıt tam Gateway kataloğudur.
- `"configured"`: seçici boyutunda davranış. `agents.defaults.models` yapılandırılmışsa yine önceliklidir. Aksi halde yanıt, açık `models.providers.*.models` girişlerini kullanır ve yalnızca yapılandırılmış model satırları yoksa tam kataloğa geri döner.
- `"all"`: `agents.defaults.models` değerini atlayarak tam Gateway kataloğu. Bunu normal model seçiciler için değil, tanılama ve keşif arayüzleri için kullanın.

## Exec onayları

- Bir exec isteği onay gerektirdiğinde Gateway `exec.approval.requested` yayınlar.
- Operatör istemcileri, `exec.approval.resolve` çağırarak çözümler (`operator.approvals` kapsamı gerekir).
- `host=node` için `exec.approval.request`, `systemRunPlan` içermelidir (kanonik `argv`/`cwd`/`rawCommand`/oturum meta verileri). `systemRunPlan` eksik istekler reddedilir.
- Onaydan sonra iletilen `node.invoke system.run` çağrıları, yetkili komut/cwd/oturum bağlamı olarak bu kanonik `systemRunPlan` değerini yeniden kullanır.
- Bir çağıran, prepare ile nihai onaylı `system.run` iletimi arasında `command`, `rawCommand`, `cwd`, `agentId` veya `sessionKey` değerini değiştirirse Gateway, değiştirilmiş yük verisine güvenmek yerine çalıştırmayı reddeder.

## Ajan teslimat geri dönüşü

- `agent` istekleri, giden teslimat istemek için `deliver=true` içerebilir.
- `bestEffortDeliver=false` katı davranışı korur: çözülemeyen veya yalnızca dahili teslimat hedefleri `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici olarak teslim edilebilir bir rota çözülemediğinde oturumla sınırlı yürütmeye geri dönüşe izin verir (örneğin dahili/webchat oturumları veya belirsiz çok kanallı yapılandırmalar).

## Sürümleme

- `PROTOCOL_VERSION`, `src/gateway/protocol/schema/protocol-schemas.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu uyuşmazlıkları reddeder.
- Şemalar + modeller TypeBox tanımlarından üretilir:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### İstemci sabitleri

`src/gateway/client.ts` içindeki referans istemci bu varsayılanları kullanır. Değerler protocol v3 genelinde kararlıdır ve üçüncü taraf istemciler için beklenen başlangıç temelidir.

| Sabit                                    | Varsayılan                                            | Kaynak                                                                                     |
| ---------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                       | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| İstek zaman aşımı (RPC başına)           | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Ön kimlik doğrulama / connect-challenge zaman aşımı | `15_000` ms                                | `src/gateway/handshake-timeouts.ts` (config/env eşleştirilmiş sunucu/istemci bütçesini artırabilir) |
| İlk yeniden bağlanma backoff'u           | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| En yüksek yeniden bağlanma backoff'u     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Device-token kapanışından sonra hızlı yeniden deneme sınırı | `250` ms                                | `src/gateway/client.ts`                                                                    |
| `terminate()` öncesi zorla durdurma ek süresi | `250` ms                                          | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` varsayılan zaman aşımı   | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Varsayılan tick aralığı (`hello-ok` öncesi) | `30_000` ms                                        | `src/gateway/client.ts`                                                                    |
| Tick zaman aşımı kapanışı                | sessizlik `tickIntervalMs * 2` değerini aştığında kod `4000` | `src/gateway/client.ts`                                                            |
| `MAX_PAYLOAD_BYTES`                      | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Sunucu, etkin `policy.tickIntervalMs`, `policy.maxPayload` ve `policy.maxBufferedBytes` değerlerini `hello-ok` içinde duyurur; istemciler el sıkışma öncesi varsayılanlar yerine bu değerlere uymalıdır.

## Kimlik doğrulama

- Paylaşılan gizli Gateway kimlik doğrulaması, yapılandırılmış kimlik doğrulama moduna bağlı olarak `connect.params.auth.token` veya `connect.params.auth.password` kullanır.
- Tailscale Serve (`gateway.auth.allowTailscale: true`) veya local loopback olmayan `gateway.auth.mode: "trusted-proxy"` gibi kimlik taşıyan modlar, connect kimlik doğrulama denetimini `connect.params.auth.*` yerine istek başlıklarından karşılar.
- Özel giriş `gateway.auth.mode: "none"`, paylaşılan gizli connect kimlik doğrulamasını tamamen atlar; bu modu herkese açık/güvenilmeyen girişlerde açığa çıkarmayın.
- Eşleştirmeden sonra Gateway, bağlantı rolü + kapsamlarıyla sınırlı bir **cihaz belirteci** verir. Bu belirteç `hello-ok.auth.deviceToken` içinde döndürülür ve istemci tarafından gelecekteki bağlantılar için kalıcı hale getirilmelidir.
- İstemciler, başarılı her bağlantıdan sonra birincil `hello-ok.auth.deviceToken` değerini kalıcı hale getirmelidir.
- Bu **saklanan** cihaz belirteciyle yeniden bağlanırken, o belirteç için saklanan onaylı kapsam kümesi de yeniden kullanılmalıdır. Bu, zaten verilmiş olan okuma/yoklama/durum erişimini korur ve yeniden bağlantıların sessizce daha dar bir örtük yalnızca yönetici kapsamına düşmesini önler.
- İstemci tarafı connect kimlik doğrulaması derlemesi (`src/gateway/client.ts` içindeki `selectConnectAuth`):
  - `auth.password` ortogonaldir ve ayarlandığında her zaman iletilir.
  - `auth.token` öncelik sırasına göre doldurulur: önce açık paylaşılan belirteç, ardından açık bir `deviceToken`, ardından saklanan cihaz başına belirteç (`deviceId` + `role` ile anahtarlanır).
  - `auth.bootstrapToken`, yalnızca yukarıdakilerin hiçbiri bir `auth.token` çözmediğinde gönderilir. Paylaşılan belirteç veya çözülen herhangi bir cihaz belirteci bunu bastırır.
  - Tek seferlik `AUTH_TOKEN_MISMATCH` yeniden denemesinde saklanan cihaz belirtecinin otomatik yükseltilmesi yalnızca **güvenilir uç noktalarla** sınırlıdır: loopback veya sabitlenmiş `tlsFingerprint` içeren `wss://`. Sabitleme olmayan herkese açık `wss://` uygun değildir.
- Ek `hello-ok.auth.deviceTokens` girişleri bootstrap devir belirteçleridir. Bunları yalnızca connect, `wss://` veya loopback/yerel eşleştirme gibi güvenilir bir aktarım üzerinde bootstrap kimlik doğrulaması kullandığında kalıcı hale getirin.
- Bir istemci **açık** bir `deviceToken` veya açık `scopes` sağlarsa, çağıranın istediği kapsam kümesi yetkili kalır; önbelleğe alınmış kapsamlar yalnızca istemci saklanan cihaz başına belirteci yeniden kullandığında yeniden kullanılır.
- Cihaz belirteçleri `device.token.rotate` ve `device.token.revoke` ile döndürülebilir/iptal edilebilir (`operator.pairing` kapsamı gerekir).
- `device.token.rotate`, döndürme meta verilerini döndürür. Yedek taşıyıcı belirteci yalnızca aynı cihazdan, zaten o cihaz belirteciyle kimliği doğrulanmış çağrılar için yankılar; böylece yalnızca belirteç kullanan istemciler yeniden bağlanmadan önce yedeklerini kalıcı hale getirebilir. Paylaşılan/yönetici döndürmeleri taşıyıcı belirteci yankılamaz.
- Belirteç verme, döndürme ve iptal etme, o cihazın eşleştirme girişinde kaydedilmiş onaylı rol kümesiyle sınırlı kalır; belirteç mutasyonu, eşleştirme onayının hiç vermediği bir cihaz rolünü genişletemez veya hedefleyemez.
- Eşleştirilmiş cihaz belirteci oturumları için, çağıranda ayrıca `operator.admin` yoksa cihaz yönetimi kendi kapsamındadır: yönetici olmayan çağıranlar yalnızca **kendi** cihaz girişlerini kaldırabilir/iptal edebilir/döndürebilir.
- `device.token.rotate` ve `device.token.revoke`, hedef operatör belirteci kapsam kümesini çağıranın geçerli oturum kapsamlarına göre de denetler. Yönetici olmayan çağıranlar, zaten sahip olduklarından daha geniş bir operatör belirtecini döndüremez veya iptal edemez.
- Kimlik doğrulama hataları, `error.details.code` ve kurtarma ipuçlarını içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilir istemciler, önbelleğe alınmış cihaz başına belirteçle sınırlı bir yeniden deneme girişiminde bulunabilir.
  - Bu yeniden deneme başarısız olursa istemciler otomatik yeniden bağlanma döngülerini durdurmalı ve operatör eylemi yönergesini göstermelidir.

## Cihaz kimliği + eşleştirme

- Node'lar, anahtar çifti parmak izinden türetilen kararlı bir cihaz kimliği (`device.id`) içermelidir.
- Gateway'ler cihaz + rol başına token yayınlar.
- Yerel otomatik onay etkin değilse yeni cihaz kimlikleri için eşleştirme onayları gerekir.
- Eşleştirme otomatik onayı, doğrudan local loopback bağlantılarına odaklanır.
- OpenClaw ayrıca güvenilir paylaşılan gizli yardımcı akışları için dar bir backend/container-local kendi kendine bağlanma yoluna sahiptir.
- Aynı ana bilgisayardaki tailnet veya LAN bağlantıları, eşleştirme için yine uzak olarak değerlendirilir ve onay gerektirir.
- WS istemcileri normalde `connect` sırasında `device` kimliğini içerir (operatör + node). Cihazsız tek operatör istisnaları açık güven yollarıdır:
  - Yalnızca localhost'a yönelik güvensiz HTTP uyumluluğu için `gateway.controlUi.allowInsecureAuth=true`.
  - Başarılı `gateway.auth.mode: "trusted-proxy"` operatör Control UI kimlik doğrulaması.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (son çare, ciddi güvenlik düşüşü).
  - Paylaşılan gateway token/parolasıyla kimliği doğrulanmış direct-loopback `gateway-client` backend RPC'leri.
- Tüm bağlantılar, sunucunun sağladığı `connect.challenge` nonce değerini imzalamalıdır.

### Cihaz kimlik doğrulaması geçiş tanıları

Hala challenge öncesi imzalama davranışını kullanan eski istemciler için `connect` artık kararlı bir `error.details.reason` ile `error.details.code` altında `DEVICE_AUTH_*` ayrıntı kodları döndürür.

Yaygın geçiş hataları:

| Mesaj                       | details.code                     | details.reason           | Anlam                                              |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | İstemci `device.nonce` değerini atladı (veya boş gönderdi). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | İstemci eski/yanlış nonce ile imzaladı.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | İmza yükü v2 yüküyle eşleşmiyor.                   |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | İmzalı zaman damgası izin verilen sapmanın dışında. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`, açık anahtar parmak iziyle eşleşmiyor. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Açık anahtar biçimi/standartlaştırması başarısız oldu. |

Geçiş hedefi:

- Her zaman `connect.challenge` değerini bekleyin.
- Sunucu nonce değerini içeren v2 yükünü imzalayın.
- Aynı nonce değerini `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza yükü, cihaz/istemci/rol/kapsamlar/token/nonce alanlarına ek olarak `platform` ve `deviceFamily` değerlerini de bağlayan `v3` değeridir.
- Eski `v2` imzaları uyumluluk için kabul edilmeye devam eder, ancak eşleştirilmiş cihaz metadata sabitlemesi yeniden bağlantıda komut politikasını denetlemeye devam eder.

## TLS + sabitleme

- WS bağlantıları için TLS desteklenir.
- İstemciler isteğe bağlı olarak gateway sertifika parmak izini sabitleyebilir (`gateway.tls` yapılandırmasına ve `gateway.remote.tlsFingerprint` veya CLI `--tls-fingerprint` değerine bakın).

## Kapsam

Bu protokol **tam gateway API**'sini (durum, kanallar, modeller, sohbet, ajan, oturumlar, node'lar, onaylar vb.) açığa çıkarır. Kesin yüzey, `src/gateway/protocol/schema.ts` içindeki TypeBox şemaları tarafından tanımlanır.

## İlgili

- [Köprü protokolü](/tr/gateway/bridge-protocol)
- [Gateway çalışma kılavuzu](/tr/gateway)
