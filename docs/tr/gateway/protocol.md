---
read_when:
    - Gateway WS istemcilerini uygulama veya güncelleme
    - Protokol uyumsuzluklarında veya bağlantı hatalarında hata ayıklama
    - Protokol şemasını/modellerini yeniden oluşturma
summary: 'Gateway WebSocket protokolü: el sıkışma, çerçeveler, sürümleme'
title: Gateway protokolü
x-i18n:
    generated_at: "2026-05-03T08:56:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 06f6e1f2188860362bff481e646bd1c4bae4cf8f9a9ccae4fbd5ceea434d2247
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protokolü, OpenClaw için **tek kontrol düzlemi + node aktarımıdır**. Tüm istemciler (CLI, web UI, macOS uygulaması, iOS/Android node'ları, başsız node'lar) WebSocket üzerinden bağlanır ve el sıkışma sırasında **rollerini** + **kapsamlarını** bildirir.

## Aktarım

- WebSocket, JSON yükleriyle metin çerçeveleri.
- İlk çerçeve **mutlaka** bir `connect` isteği olmalıdır.
- Bağlantı öncesi çerçeveler 64 KiB ile sınırlıdır. Başarılı bir el sıkışmadan sonra istemciler `hello-ok.policy.maxPayload` ve `hello-ok.policy.maxBufferedBytes` sınırlarına uymalıdır. Tanılama etkinleştirildiğinde, aşırı büyük gelen çerçeveler ve yavaş giden arabellekler, gateway etkilenen çerçeveyi kapatmadan veya düşürmeden önce `payload.large` olayları yayar. Bu olaylar boyutları, sınırları, yüzeyleri ve güvenli neden kodlarını tutar. İleti gövdesini, ek içeriklerini, ham çerçeve gövdesini, token'ları, çerezleri veya gizli değerleri tutmaz.

## El sıkışma (connect)

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

Gateway başlangıç yan araçlarını hâlâ tamamlarken, `connect` isteği `details.reason` değeri `"startup-sidecars"` olarak ayarlanmış ve `retryAfterMs` içeren yeniden denenebilir bir `UNAVAILABLE` hatası döndürebilir. İstemciler bu yanıtı nihai bir el sıkışma hatası olarak göstermek yerine genel bağlantı bütçeleri içinde yeniden denemelidir.

`server`, `features`, `snapshot` ve `policy` şema tarafından zorunlu kılınır (`src/gateway/protocol/schema/frames.ts`). `auth` de zorunludur ve anlaşmaya varılan rol/kapsamları bildirir. `canvasHostUrl` isteğe bağlıdır.

Hiçbir cihaz token'ı verilmediğinde, `hello-ok.auth` token alanları olmadan anlaşmaya varılan izinleri bildirir:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilen aynı süreç arka uç istemcileri (`client.id: "gateway-client"`, `client.mode: "backend"`), paylaşılan gateway token/parolasıyla kimlik doğruladıklarında doğrudan loopback bağlantılarında `device` alanını atlayabilir. Bu yol dahili kontrol düzlemi RPC'leri için ayrılmıştır ve eski CLI/cihaz eşleştirme temel değerlerinin alt ajan oturumu güncellemeleri gibi yerel arka uç çalışmalarını engellemesini önler. Uzak istemciler, tarayıcı kökenli istemciler, node istemcileri ve açık cihaz token'ı/cihaz kimliği istemcileri normal eşleştirme ve kapsam yükseltme denetimlerini kullanmaya devam eder.

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

Güvenilen bootstrap devir sırasında, `hello-ok.auth` `deviceTokens` içinde ek sınırlı rol girdileri de içerebilir:

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

Yerleşik node/operator bootstrap akışı için birincil node token'ı `scopes: []` olarak kalır ve devredilen tüm operator token'ları bootstrap operator izin listesiyle sınırlı kalır (`operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`). Bootstrap kapsam denetimleri rol önekli kalır: operator girdileri yalnızca operator isteklerini karşılar ve operator olmayan roller yine kendi rol önekleri altındaki kapsamlara ihtiyaç duyar.

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

Yan etkisi olan yöntemler **idempotency keys** gerektirir (şemaya bakın).

## Roller + kapsamlar

Tam operator kapsam modeli, onay zamanı denetimleri ve paylaşılan sır semantiği için bkz. [Operator kapsamları](/tr/gateway/operator-scopes).

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

`includeSecrets: true` ile `talk.config`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.

Plugin tarafından kaydedilen gateway RPC yöntemleri kendi operator kapsamlarını isteyebilir, ancak ayrılmış çekirdek admin önekleri (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) her zaman `operator.admin` olarak çözümlenir.

Yöntem kapsamı yalnızca ilk kapıdır. `chat.send` üzerinden ulaşılan bazı slash komutları bunun üzerine daha sıkı komut düzeyi denetimler uygular. Örneğin, kalıcı `/config set` ve `/config unset` yazmaları `operator.admin` gerektirir.

`node.pair.approve`, temel yöntem kapsamının üzerine onay zamanında ek bir kapsam denetimine de sahiptir:

- komutsuz istekler: `operator.pairing`
- exec olmayan node komutları içeren istekler: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which` içeren istekler: `operator.pairing` + `operator.admin`

### Yetenekler/komutlar/izinler (node)

Node'lar bağlantı sırasında yetenek iddialarını bildirir:

- `caps`: üst düzey yetenek kategorileri.
- `commands`: invoke için komut izin listesi.
- `permissions`: ayrıntılı açma/kapama anahtarları (örn. `screen.record`, `camera.capture`).

Gateway bunları **iddia** olarak ele alır ve sunucu tarafı izin listelerini uygular.

## Varlık durumu

- `system-presence`, cihaz kimliğine göre anahtarlanmış girdiler döndürür.
- Varlık durumu girdileri `deviceId`, `roles` ve `scopes` içerir; böylece UI'lar cihaz hem **operator** hem de **node** olarak bağlansa bile cihaz başına tek bir satır gösterebilir.
- `node.list` isteğe bağlı `lastSeenAtMs` ve `lastSeenReason` alanlarını içerir. Bağlı node'lar geçerli bağlantı zamanlarını `connect` nedeniyle `lastSeenAtMs` olarak bildirir; eşleştirilmiş node'lar ayrıca güvenilen bir node olayı eşleştirme meta verilerini güncellediğinde kalıcı arka plan varlık durumu bildirebilir.

### Node arka plan canlı olayı

Node'lar, eşleştirilmiş bir node'un arka plan uyanışı sırasında bağlı olarak işaretlenmeden canlı olduğunu kaydetmek için `event: "node.presence.alive"` ile `node.event` çağırabilir.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` kapalı bir enum'dur: `background`, `silent_push`, `bg_app_refresh`, `significant_location`, `manual` veya `connect`. Bilinmeyen trigger dizeleri kalıcılıktan önce gateway tarafından `background` olarak normalleştirilir. Olay yalnızca kimliği doğrulanmış node cihaz oturumları için kalıcıdır; cihazsız veya eşleştirilmemiş oturumlar `handled: false` döndürür.

Başarılı gateway'ler yapılandırılmış bir sonuç döndürür:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Daha eski gateway'ler `node.event` için hâlâ `{ "ok": true }` döndürebilir; istemciler bunu kalıcı varlık durumu kalıcılığı olarak değil, onaylanmış bir RPC olarak ele almalıdır.

## Yayın olayı kapsam belirleme

Sunucu tarafından gönderilen WebSocket yayın olayları kapsam kapılıdır; böylece eşleştirme kapsamlı veya yalnızca node oturumları oturum içeriğini pasif olarak almaz.

- **Sohbet, ajan ve araç sonucu çerçeveleri** (akışlı `agent` olayları ve araç çağrısı sonuçları dahil) en az `operator.read` gerektirir. `operator.read` olmayan oturumlar bu çerçeveleri tamamen atlar.
- **Plugin tanımlı `plugin.*` yayınları**, Plugin'in bunları nasıl kaydettiğine bağlı olarak `operator.write` veya `operator.admin` ile kapılanır.
- **Durum ve aktarım olayları** (`heartbeat`, `presence`, `tick`, bağlanma/bağlantı kesme yaşam döngüsü vb.) kısıtlanmadan kalır; böylece aktarım sağlığı her kimliği doğrulanmış oturum tarafından gözlemlenebilir kalır.
- **Bilinmeyen yayın olayı aileleri**, kayıtlı bir işleyici bunları açıkça gevşetmedikçe varsayılan olarak kapsam kapılıdır (kapalı başarısızlık).

Her istemci bağlantısı kendi istemci başına sıra numarasını tutar; böylece farklı istemciler olay akışının farklı kapsam filtreli alt kümelerini görse bile yayınlar o sokette monoton sıralamayı korur.

## Yaygın RPC yöntem aileleri

Genel WS yüzeyi yukarıdaki el sıkışma/kimlik doğrulama örneklerinden daha geniştir. Bu üretilmiş bir döküm değildir — `hello-ok.features.methods`, `src/gateway/server-methods-list.ts` ile yüklenen Plugin/kanal yöntem dışa aktarımlarından oluşturulmuş muhafazakâr bir keşif listesidir. Bunu `src/gateway/server-methods/*.ts` için tam bir listeleme değil, özellik keşfi olarak ele alın.

<AccordionGroup>
  <Accordion title="Sistem ve kimlik">
    - `health`, önbelleğe alınmış veya yeni yoklanmış gateway sağlık anlık görüntüsünü döndürür.
    - `diagnostics.stability`, son sınırlı tanılama kararlılık kaydedicisini döndürür. Olay adları, sayımlar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/Plugin adları ve oturum kimlikleri gibi operasyonel meta verileri tutar. Sohbet metnini, webhook gövdelerini, araç çıktılarını, ham istek veya yanıt gövdelerini, token'ları, çerezleri veya gizli değerleri tutmaz. Operator okuma kapsamı gereklidir.
    - `status`, `/status` tarzı gateway özetini döndürür; hassas alanlar yalnızca admin kapsamlı operator istemcileri için dahil edilir.
    - `gateway.identity.get`, relay ve eşleştirme akışları tarafından kullanılan gateway cihaz kimliğini döndürür.
    - `system-presence`, bağlı operator/node cihazları için geçerli varlık durumu anlık görüntüsünü döndürür.
    - `system-event`, bir sistem olayı ekler ve varlık durumu bağlamını güncelleyebilir/yayınlayabilir.
    - `last-heartbeat`, en son kalıcı heartbeat olayını döndürür.
    - `set-heartbeats`, gateway üzerinde heartbeat işlemeyi açıp kapatır.

  </Accordion>

  <Accordion title="Modeller ve kullanım">
    - `models.list`, çalışma zamanı tarafından izin verilen model kataloğunu döndürür. Seçici boyutunda yapılandırılmış modeller için (`agents.defaults.models` önce, ardından `models.providers.*.models`) `{ "view": "configured" }` geçin veya tam katalog için `{ "view": "all" }` geçin.
    - `usage.status`, sağlayıcı kullanım pencerelerini/kalan kota özetlerini döndürür.
    - `usage.cost`, bir tarih aralığı için toplu maliyet kullanım özetlerini döndürür.
    - `doctor.memory.status`, etkin varsayılan aracı çalışma alanı için vektör belleği / önbelleğe alınmış embedding hazırlığını döndürür. Yalnızca çağıran açıkça canlı embedding sağlayıcısı ping'i istediğinde `{ "probe": true }` veya `{ "deep": true }` geçin.
    - `doctor.memory.remHarness`, uzak kontrol düzlemi istemcileri için sınırlandırılmış, salt okunur bir REM harness önizlemesi döndürür. Çalışma alanı yollarını, bellek parçalarını, işlenmiş temellendirilmiş Markdown'ı ve derin yükseltme adaylarını içerebilir; bu nedenle çağıranların `operator.read` gerekir.
    - `sessions.usage`, oturum başına kullanım özetlerini döndürür.
    - `sessions.usage.timeseries`, bir oturum için zaman serisi kullanımını döndürür.
    - `sessions.usage.logs`, bir oturum için kullanım günlük girdilerini döndürür.

  </Accordion>

  <Accordion title="Kanallar ve oturum açma yardımcıları">
    - `channels.status`, yerleşik + paketli kanal/Plugin durum özetlerini döndürür.
    - `channels.logout`, kanal oturum kapatmayı desteklediğinde belirli bir kanal/hesap oturumunu kapatır.
    - `web.login.start`, geçerli QR destekli web kanalı sağlayıcısı için QR/web oturum açma akışını başlatır.
    - `web.login.wait`, bu QR/web oturum açma akışının tamamlanmasını bekler ve başarı durumunda kanalı başlatır.
    - `push.test`, kayıtlı bir iOS Node'una test APNs push'u gönderir.
    - `voicewake.get`, saklanan uyandırma sözcüğü tetikleyicilerini döndürür.
    - `voicewake.set`, uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayınlar.

  </Accordion>

  <Accordion title="Mesajlaşma ve günlükler">
    - `send`, sohbet çalıştırıcısının dışındaki kanal/hesap/iş parçacığı hedefli gönderimler için doğrudan giden teslim RPC'sidir.
    - `logs.tail`, yapılandırılmış Gateway dosya günlüğü kuyruğunu imleç/sınır ve en fazla bayt denetimleriyle döndürür.

  </Accordion>

  <Accordion title="Konuşma ve TTS">
    - `talk.config`, etkin Talk yapılandırma yükünü döndürür; `includeSecrets`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.
    - `talk.mode`, WebChat/Control UI istemcileri için geçerli Talk modu durumunu ayarlar/yayınlar.
    - `talk.speak`, etkin Talk konuşma sağlayıcısı üzerinden konuşma sentezler.
    - `tts.status`, TTS etkin durumunu, etkin sağlayıcıyı, yedek sağlayıcıları ve sağlayıcı yapılandırma durumunu döndürür.
    - `tts.providers`, görünür TTS sağlayıcı envanterini döndürür.
    - `tts.enable` ve `tts.disable`, TTS tercih durumunu değiştirir.
    - `tts.setProvider`, tercih edilen TTS sağlayıcısını günceller.
    - `tts.convert`, tek seferlik metinden konuşmaya dönüştürme çalıştırır.

  </Accordion>

  <Accordion title="Sırlar, yapılandırma, güncelleme ve sihirbaz">
    - `secrets.reload`, etkin SecretRef'leri yeniden çözümler ve çalışma zamanı sır durumunu yalnızca tam başarıda değiştirir.
    - `secrets.resolve`, belirli bir komut/hedef kümesi için komut hedefli sır atamalarını çözümler.
    - `config.get`, geçerli yapılandırma anlık görüntüsünü ve karmasını döndürür.
    - `config.set`, doğrulanmış bir yapılandırma yükü yazar.
    - `config.patch`, kısmi bir yapılandırma güncellemesini birleştirir.
    - `config.apply`, tam yapılandırma yükünü doğrular + değiştirir.
    - `config.schema`, Control UI ve CLI araçlarının kullandığı canlı yapılandırma şema yükünü döndürür: şema, `uiHints`, sürüm ve oluşturma meta verileri; çalışma zamanı yükleyebildiğinde Plugin + kanal şema meta verileri de dahil. Şema, eşleşen alan dokümantasyonu bulunduğunda iç içe nesne, joker karakter, dizi öğesi ve `anyOf` / `oneOf` / `allOf` bileşim dalları dahil olmak üzere UI tarafından kullanılan aynı etiketlerden ve yardım metninden türetilmiş `title` / `description` meta verilerini içerir.
    - `config.schema.lookup`, bir yapılandırma yolu için yol kapsamlı bir arama yükü döndürür: normalleştirilmiş yol, sığ bir şema düğümü, eşleşen ipucu + `hintPath` ve UI/CLI ayrıntı incelemesi için doğrudan alt özetler. Arama şema düğümleri, kullanıcıya dönük dokümanları ve yaygın doğrulama alanlarını (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, sayısal/dize/dizi/nesne sınırları ve `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi bayraklar) korur. Alt özetler `key`, normalleştirilmiş `path`, `type`, `required`, `hasChildren` ile eşleşen `hint` / `hintPath` değerlerini gösterir.
    - `update.run`, Gateway güncelleme akışını çalıştırır ve yalnızca güncellemenin kendisi başarılı olduğunda yeniden başlatma planlar. Paket yöneticisi güncellemeleri, paket değişiminden sonra ertelenmeyen, bekleme süresi olmayan bir güncelleme yeniden başlatmasını zorlar; böylece eski Gateway süreci değiştirilmiş bir `dist` ağacından tembel yükleme yapmayı sürdürmez.
    - `update.status`, varsa yeniden başlatma sonrası çalışan sürüm dahil olmak üzere en son önbelleğe alınmış güncelleme yeniden başlatma işaretçisini döndürür.
    - `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`, başlangıç sihirbazını WS RPC üzerinden sunar.

  </Accordion>

  <Accordion title="Aracı ve çalışma alanı yardımcıları">
    - `agents.list`, etkin model ve çalışma zamanı meta verileri dahil olmak üzere yapılandırılmış aracı girdilerini döndürür.
    - `agents.create`, `agents.update` ve `agents.delete`, aracı kayıtlarını ve çalışma alanı bağlantılarını yönetir.
    - `agents.files.list`, `agents.files.get` ve `agents.files.set`, bir aracı için sunulan bootstrap çalışma alanı dosyalarını yönetir.
    - `artifacts.list`, `artifacts.get` ve `artifacts.download`, açık bir `sessionKey`, `runId` veya `taskId` kapsamı için transkriptten türetilmiş yapıt özetlerini ve indirmeleri sunar. Çalıştırma ve görev sorguları, sahibi olan oturumu sunucu tarafında çözümler ve yalnızca eşleşen kökene sahip transkript medyasını döndürür; güvenli olmayan veya yerel URL kaynakları, sunucu tarafında getirilmek yerine desteklenmeyen indirmeler döndürür.
    - `agent.identity.get`, bir aracı veya oturum için etkin asistan kimliğini döndürür.
    - `agent.wait`, bir çalıştırmanın bitmesini bekler ve varsa son anlık görüntüyü döndürür.

  </Accordion>

  <Accordion title="Oturum denetimi">
    - `sessions.list`, bir aracı çalışma zamanı arka ucu yapılandırıldığında satır başına `agentRuntime` meta verileri dahil olmak üzere geçerli oturum dizinini döndürür.
    - `sessions.subscribe` ve `sessions.unsubscribe`, geçerli WS istemcisi için oturum değişikliği etkinlik aboneliklerini değiştirir.
    - `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`, bir oturum için transkript/mesaj etkinliği aboneliklerini değiştirir.
    - `sessions.preview`, belirli oturum anahtarları için sınırlandırılmış transkript önizlemeleri döndürür.
    - `sessions.describe`, tam bir oturum anahtarı için bir Gateway oturum satırı döndürür.
    - `sessions.resolve`, bir oturum hedefini çözümler veya kanonikleştirir.
    - `sessions.create`, yeni bir oturum girdisi oluşturur.
    - `sessions.send`, mevcut bir oturuma mesaj gönderir.
    - `sessions.steer`, etkin bir oturum için kes ve yönlendir varyantıdır.
    - `sessions.abort`, bir oturum için etkin işi iptal eder. Çağıran `key` ile isteğe bağlı `runId` geçebilir veya Gateway'in bir oturuma çözümleyebildiği etkin çalıştırmalar için yalnızca `runId` geçebilir.
    - `sessions.patch`, oturum meta verilerini/geçersiz kılmalarını günceller ve çözülmüş kanonik modeli artı etkin `agentRuntime` değerini bildirir.
    - `sessions.reset`, `sessions.delete` ve `sessions.compact`, oturum bakımını gerçekleştirir.
    - `sessions.get`, tam saklanan oturum satırını döndürür.
    - Sohbet yürütme hâlâ `chat.history`, `chat.send`, `chat.abort` ve `chat.inject` kullanır. `chat.history`, UI istemcileri için görüntüleme açısından normalleştirilir: satır içi yönerge etiketleri görünür metinden çıkarılır, düz metin araç çağrısı XML yükleri (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil) ve sızmış ASCII/tam genişlikli model denetim belirteçleri çıkarılır, tam `NO_REPLY` / `no_reply` gibi saf sessiz belirteç asistan satırları atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir.

  </Accordion>

  <Accordion title="Cihaz eşleştirme ve cihaz belirteçleri">
    - `device.pair.list`, bekleyen ve onaylanmış eşleştirilmiş cihazları döndürür.
    - `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`, cihaz eşleştirme kayıtlarını yönetir.
    - `device.token.rotate`, eşleştirilmiş bir cihaz belirtecini onaylı rolü ve çağıran kapsamı sınırları içinde döndürür.
    - `device.token.revoke`, eşleştirilmiş bir cihaz belirtecini onaylı rolü ve çağıran kapsamı sınırları içinde iptal eder.

  </Accordion>

  <Accordion title="Node eşleştirme, çağırma ve bekleyen iş">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` ve `node.pair.verify`, Node eşleştirmeyi ve bootstrap doğrulamasını kapsar.
    - `node.list` ve `node.describe`, bilinen/bağlı Node durumunu döndürür.
    - `node.rename`, eşleştirilmiş bir Node etiketini günceller.
    - `node.invoke`, bir komutu bağlı bir Node'a iletir.
    - `node.invoke.result`, bir çağırma isteğinin sonucunu döndürür.
    - `node.event`, Node kaynaklı etkinlikleri Gateway'e geri taşır.
    - `node.canvas.capability.refresh`, kapsamlı canvas yetenek belirteçlerini yeniler.
    - `node.pending.pull` ve `node.pending.ack`, bağlı Node kuyruk API'leridir.
    - `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısı kesilmiş Node'lar için dayanıklı bekleyen işi yönetir.

  </Accordion>

  <Accordion title="Onay aileleri">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve `exec.approval.resolve`, tek seferlik exec onay isteklerini ve bekleyen onay arama/yeniden oynatmayı kapsar.
    - `exec.approval.waitDecision`, bekleyen bir exec onayını bekler ve nihai kararı döndürür (veya zaman aşımında `null`).
    - `exec.approvals.get` ve `exec.approvals.set`, Gateway exec onay ilkesi anlık görüntülerini yönetir.
    - `exec.approvals.node.get` ve `exec.approvals.node.set`, Node aktarma komutları aracılığıyla Node yerel exec onay ilkesini yönetir.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` ve `plugin.approval.resolve`, Plugin tanımlı onay akışlarını kapsar.

  </Accordion>

  <Accordion title="Otomasyon, Skills ve araçlar">
    - Otomasyon: `wake`, anında veya bir sonraki Heartbeat'te uyandırma metni enjeksiyonu planlar; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zamanlanmış işleri yönetir.
    - Skills ve araçlar: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Yaygın etkinlik aileleri

- `chat`: `chat.inject` ve diğer yalnızca transkript sohbet etkinlikleri gibi UI sohbet güncellemeleri.
- `session.message` ve `session.tool`: abone olunan bir oturum için transkript/etkinlik akışı güncellemeleri.
- `sessions.changed`: oturum dizini veya meta veriler değişti.
- `presence`: sistem varlık anlık görüntüsü güncellemeleri.
- `tick`: periyodik keepalive / canlılık etkinliği.
- `health`: Gateway sağlık anlık görüntüsü güncellemesi.
- `heartbeat`: Heartbeat etkinlik akışı güncellemesi.
- `cron`: Cron çalıştırma/iş değişikliği etkinliği.
- `shutdown`: Gateway kapatma bildirimi.
- `node.pair.requested` / `node.pair.resolved`: Node eşleştirme yaşam döngüsü.
- `node.invoke.request`: Node çağırma isteği yayını.
- `device.pair.requested` / `device.pair.resolved`: eşleştirilmiş cihaz yaşam döngüsü.
- `voicewake.changed`: uyandırma sözcüğü tetikleyici yapılandırması değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onay yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin onay yaşam döngüsü.

### Node yardımcı yöntemleri

- Node'lar, otomatik izin denetimleri için geçerli beceri yürütülebilirleri listesini almak üzere `skills.bins` çağırabilir.

### Operatör yardımcı yöntemleri

- Operatörler, bir agent için çalışma zamanı komut envanterini almak üzere `commands.list` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan agent çalışma alanını okumak için bunu atlayın.
  - `scope`, birincil `name` değerinin hangi yüzeyi hedeflediğini denetler:
    - `text`, başında `/` olmadan birincil metin komutu belirtecini döndürür
    - `native` ve varsayılan `both` yolu, mevcut olduğunda sağlayıcıya duyarlı yerel adları döndürür
  - `textAliases`, `/model` ve `/m` gibi tam slash takma adlarını taşır.
  - `nativeName`, mevcut olduğunda sağlayıcıya duyarlı yerel komut adını taşır.
  - `provider` isteğe bağlıdır ve yalnızca yerel adlandırmayı ve yerel Plugin komutu kullanılabilirliğini etkiler.
  - `includeArgs=false`, serileştirilmiş argüman meta verilerini yanıttan çıkarır.
- Operatörler, bir agent için çalışma zamanı araç kataloğunu almak üzere `tools.catalog` (`operator.read`) çağırabilir. Yanıt, gruplanmış araçları ve kaynak meta verilerini içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda Plugin sahibi
  - `optional`: bir Plugin aracının isteğe bağlı olup olmadığı
- Operatörler, bir oturum için çalışma zamanında etkin araç envanterini almak üzere `tools.effective` (`operator.read`) çağırabilir.
  - `sessionKey` zorunludur.
  - Gateway, çağıranın sağladığı kimlik doğrulama veya teslim bağlamını kabul etmek yerine güvenilir çalışma zamanı bağlamını oturumdan sunucu tarafında türetir.
  - Yanıt oturum kapsamlıdır ve etkin konuşmanın şu anda kullanabileceği çekirdek, Plugin ve kanal araçları dahil olmak üzere her şeyi yansıtır.
- Operatörler, kullanılabilir bir aracı `/tools/invoke` ile aynı Gateway ilkesi yolu üzerinden çağırmak için `tools.invoke` (`operator.write`) çağırabilir.
  - `name` zorunludur. `args`, `sessionKey`, `agentId`, `confirm` ve `idempotencyKey` isteğe bağlıdır.
  - Hem `sessionKey` hem de `agentId` mevcutsa, çözümlenen oturum agent değeri `agentId` ile eşleşmelidir.
  - Yanıt, `ok`, `toolName`, isteğe bağlı `output` ve tipli `error` alanlarını içeren SDK odaklı bir zarftır. Onay veya ilke reddi, Gateway araç ilkesi işlem hattını atlamak yerine yükte `ok:false` döndürür.
- Operatörler, bir agent için görünür Skills envanterini almak üzere `skills.status` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan agent çalışma alanını okumak için bunu atlayın.
  - Yanıt; uygunluk, eksik gereksinimler, yapılandırma denetimleri ve ham gizli değerleri açığa çıkarmadan temizlenmiş kurulum seçeneklerini içerir.
- Operatörler, ClawHub keşif meta verileri için `skills.search` ve `skills.detail` (`operator.read`) çağırabilir.
- Operatörler, `skills.install` (`operator.admin`) çağrısını iki modda yapabilir:
  - ClawHub modu: `{ source: "clawhub", slug, version?, force? }`, varsayılan agent çalışma alanındaki `skills/` dizinine bir skill klasörü kurar.
  - Gateway kurucu modu: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`, Gateway ana makinesinde bildirilmiş bir `metadata.openclaw.install` eylemi çalıştırır.
- Operatörler, `skills.update` (`operator.admin`) çağrısını iki modda yapabilir:
  - ClawHub modu, varsayılan agent çalışma alanındaki izlenen tek bir slug değerini veya izlenen tüm ClawHub kurulumlarını günceller.
  - Yapılandırma modu, `enabled`, `apiKey` ve `env` gibi `skills.entries.<skillKey>` değerlerini yamalar.

### `models.list` görünümleri

`models.list`, isteğe bağlı bir `view` parametresi kabul eder:

- Atlanmış veya `"default"`: geçerli çalışma zamanı davranışı. `agents.defaults.models` yapılandırılmışsa, yanıt izin verilen katalogdur; aksi takdirde yanıt tam Gateway kataloğudur.
- `"configured"`: seçici boyutunda davranış. `agents.defaults.models` yapılandırılmışsa, yine öncelikli olur. Aksi takdirde yanıt açık `models.providers.*.models` girdilerini kullanır ve yalnızca yapılandırılmış model satırı olmadığında tam kataloğa geri döner.
- `"all"`: tam Gateway kataloğu, `agents.defaults.models` değerini atlar. Bunu normal model seçiciler için değil, tanılama ve keşif kullanıcı arayüzleri için kullanın.

## Çalıştırma onayları

- Bir exec isteği onay gerektirdiğinde, Gateway `exec.approval.requested` yayınlar.
- Operatör istemcileri `exec.approval.resolve` çağırarak çözer (`operator.approvals` kapsamı gerektirir).
- `host=node` için, `exec.approval.request` `systemRunPlan` içermelidir (standart `argv`/`cwd`/`rawCommand`/oturum meta verileri). `systemRunPlan` eksik olan istekler reddedilir.
- Onaydan sonra iletilen `node.invoke system.run` çağrıları, yetkili komut/cwd/oturum bağlamı olarak bu standart `systemRunPlan` değerini yeniden kullanır.
- Bir çağıran, hazırlama ile son onaylı `system.run` iletimi arasında `command`, `rawCommand`, `cwd`, `agentId` veya `sessionKey` değerini değiştirirse, Gateway değiştirilen yüke güvenmek yerine çalıştırmayı reddeder.

## Agent teslimi için geri dönüş

- `agent` istekleri, dışa teslim istemek için `deliver=true` içerebilir.
- `bestEffortDeliver=false` katı davranışı korur: çözümlenmemiş veya yalnızca dahili teslim hedefleri `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici teslim edilebilir bir rota çözümlenemediğinde oturumla sınırlı yürütmeye geri dönüşe izin verir (örneğin dahili/webchat oturumları veya belirsiz çok kanallı yapılandırmalar).

## Sürümleme

- `PROTOCOL_VERSION`, `src/gateway/protocol/schema/protocol-schemas.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu uyumsuzlukları reddeder.
- Şemalar + modeller TypeBox tanımlarından üretilir:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### İstemci sabitleri

`src/gateway/client.ts` içindeki referans istemci bu varsayılanları kullanır. Değerler protokol v3 genelinde kararlıdır ve üçüncü taraf istemciler için beklenen temeldir.

| Sabit                                     | Varsayılan                                            | Kaynak                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| İstek zaman aşımı (RPC başına)            | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Ön kimlik doğrulama / bağlanma-sınama zaman aşımı | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env eşleşen sunucu/istemci bütçesini artırabilir) |
| İlk yeniden bağlanma geri çekilmesi       | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| En yüksek yeniden bağlanma geri çekilmesi | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Aygıt belirteci kapanışından sonra hızlı yeniden deneme sınırı | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` öncesi zorla durdurma ek süresi | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` varsayılan zaman aşımı    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Varsayılan tick aralığı (`hello-ok` öncesi) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Tick zaman aşımı kapanışı                 | sessizlik `tickIntervalMs * 2` değerini aştığında kod `4000` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Sunucu, etkin `policy.tickIntervalMs`, `policy.maxPayload` ve `policy.maxBufferedBytes` değerlerini `hello-ok` içinde duyurur; istemciler, el sıkışma öncesi varsayılanlar yerine bu değerlere uymalıdır.

## Kimlik doğrulama

- Paylaşılan gizli anahtarlı Gateway kimlik doğrulaması, yapılandırılmış kimlik
  doğrulama moduna bağlı olarak `connect.params.auth.token` veya
  `connect.params.auth.password` kullanır.
- Tailscale Serve (`gateway.auth.allowTailscale: true`) veya non-loopback
  `gateway.auth.mode: "trusted-proxy"` gibi kimlik taşıyan modlar, `connect`
  kimlik doğrulaması denetimini `connect.params.auth.*` yerine istek
  üstbilgilerinden karşılar.
- Private-ingress `gateway.auth.mode: "none"`, paylaşılan gizli anahtarlı
  `connect` kimlik doğrulamasını tamamen atlar; bu modu herkese açık/güvenilmeyen
  girişte açığa çıkarmayın.
- Eşleştirmeden sonra Gateway, bağlantı rolü + kapsamlarıyla sınırlı bir
  **cihaz tokenı** verir. Bu token `hello-ok.auth.deviceToken` içinde döndürülür
  ve gelecekteki bağlantılar için istemci tarafından kalıcılaştırılmalıdır.
- İstemciler, başarılı herhangi bir bağlantıdan sonra birincil
  `hello-ok.auth.deviceToken` değerini kalıcılaştırmalıdır.
- Bu **saklanan** cihaz tokenıyla yeniden bağlanmak, o token için saklanan
  onaylanmış kapsam kümesini de yeniden kullanmalıdır. Bu, daha önce verilmiş
  okuma/yoklama/durum erişimini korur ve yeniden bağlantıların sessizce daha dar
  bir örtük yalnızca-yönetici kapsamına düşmesini önler.
- İstemci tarafı `connect` kimlik doğrulaması oluşturma (`src/gateway/client.ts`
  içindeki `selectConnectAuth`):
  - `auth.password` bağımsızdır ve ayarlandığında her zaman iletilir.
  - `auth.token` öncelik sırasına göre doldurulur: önce açık paylaşılan token,
    sonra açık bir `deviceToken`, sonra saklanan cihaz başına token (`deviceId` +
    `role` ile anahtarlanır).
  - `auth.bootstrapToken` yalnızca yukarıdakilerin hiçbiri bir `auth.token`
    çözümlemediğinde gönderilir. Paylaşılan token veya çözümlenen herhangi bir
    cihaz tokenı bunu bastırır.
  - Tek seferlik `AUTH_TOKEN_MISMATCH` yeniden denemesinde saklanan cihaz
    tokenının otomatik yükseltilmesi **yalnızca güvenilir uç noktalarla**
    sınırlıdır: loopback veya sabitlenmiş `tlsFingerprint` ile `wss://`. Sabitleme
    olmayan herkese açık `wss://` buna uygun değildir.
- Ek `hello-ok.auth.deviceTokens` girdileri bootstrap devir tokenlarıdır. Bunları
  yalnızca bağlantı, `wss://` veya loopback/local eşleştirme gibi güvenilir bir
  taşıma üzerinde bootstrap kimlik doğrulaması kullandığında kalıcılaştırın.
- Bir istemci **açık** `deviceToken` veya açık `scopes` sağlarsa, çağıranın
  istediği kapsam kümesi yetkili kalır; önbelleğe alınmış kapsamlar yalnızca
  istemci saklanan cihaz başına tokenı yeniden kullandığında yeniden kullanılır.
- Cihaz tokenları `device.token.rotate` ve `device.token.revoke` ile
  döndürülebilir/iptal edilebilir (`operator.pairing` kapsamı gerekir).
- `device.token.rotate` döndürme meta verisi döndürür. Yedek taşıyıcı tokenı,
  yalnızca aynı cihazdan yapılan ve zaten o cihaz tokenıyla kimliği doğrulanmış
  çağrılar için yankılar; böylece yalnızca token kullanan istemciler yeniden
  bağlanmadan önce yedeklerini kalıcılaştırabilir. Paylaşılan/yönetici
  döndürmeleri taşıyıcı tokenı yankılamaz.
- Token verme, döndürme ve iptal etme, o cihazın eşleştirme girdisinde kaydedilen
  onaylanmış rol kümesiyle sınırlı kalır; token mutasyonu, eşleştirme onayının hiç
  vermediği bir cihaz rolünü genişletemez veya hedefleyemez.
- Eşleştirilmiş cihaz token oturumlarında, çağıranda ayrıca `operator.admin`
  yoksa cihaz yönetimi kendi kapsamıyla sınırlıdır: yönetici olmayan çağıranlar
  yalnızca **kendi** cihaz girdilerini kaldırabilir/iptal edebilir/döndürebilir.
- `device.token.rotate` ve `device.token.revoke`, hedef operatör token kapsam
  kümesini çağıranın geçerli oturum kapsamlarına karşı da denetler. Yönetici
  olmayan çağıranlar, zaten sahip olduklarından daha geniş bir operatör tokenını
  döndüremez veya iptal edemez.
- Kimlik doğrulama hataları `error.details.code` ile birlikte kurtarma ipuçları
  içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilir istemciler, önbelleğe alınmış cihaz başına tokenla sınırlı tek bir
    yeniden deneme girişiminde bulunabilir.
  - Bu yeniden deneme başarısız olursa, istemciler otomatik yeniden bağlanma
    döngülerini durdurmalı ve operatör eylemi yönergesini göstermelidir.

## Cihaz kimliği + eşleştirme

- Node'lar, anahtar çifti parmak izinden türetilmiş kararlı bir cihaz kimliği
  (`device.id`) içermelidir.
- Gateway'ler cihaz + rol başına token verir.
- local otomatik onay etkin değilse yeni cihaz kimlikleri için eşleştirme
  onayları gerekir.
- Eşleştirme otomatik onayı, doğrudan local loopback bağlantılarına odaklanır.
- OpenClaw ayrıca güvenilir paylaşılan gizli anahtarlı yardımcı akışları için dar
  bir backend/kapsayıcı-local kendi kendine bağlantı yoluna sahiptir.
- Aynı ana makinedeki tailnet veya LAN bağlantıları, eşleştirme için yine de uzak
  kabul edilir ve onay gerektirir.
- WS istemcileri normalde `connect` sırasında `device` kimliği içerir (operatör +
  node). Tek cihazsız operatör istisnaları açık güven yollarıdır:
  - localhost-only güvensiz HTTP uyumluluğu için `gateway.controlUi.allowInsecureAuth=true`.
  - başarılı `gateway.auth.mode: "trusted-proxy"` operatör Control UI kimlik doğrulaması.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (son çare, ciddi güvenlik düşürmesi).
  - paylaşılan Gateway tokenı/parolasıyla kimliği doğrulanmış direct-loopback
    `gateway-client` backend RPC'leri.
- Tüm bağlantılar, sunucunun sağladığı `connect.challenge` nonce değerini
  imzalamalıdır.

### Cihaz kimlik doğrulaması geçiş tanıları

Hala challenge öncesi imzalama davranışını kullanan eski istemciler için `connect`
artık `error.details.code` altında kararlı bir `error.details.reason` ile
`DEVICE_AUTH_*` ayrıntı kodları döndürür.

Yaygın geçiş hataları:

| İleti                       | details.code                     | details.reason           | Anlam                                              |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | İstemci `device.nonce` değerini atladı (veya boş gönderdi). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | İstemci eski/yanlış nonce ile imzaladı.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | İmza yükü v2 yüküyle eşleşmiyor.                   |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | İmzalı zaman damgası izin verilen sapmanın dışında. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`, açık anahtar parmak iziyle eşleşmiyor. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Açık anahtar biçimi/standartlaştırması başarısız oldu. |

Geçiş hedefi:

- Her zaman `connect.challenge` için bekleyin.
- Sunucu nonce değerini içeren v2 yükünü imzalayın.
- Aynı nonce değerini `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza yükü `v3` değeridir; bu, cihaz/istemci/rol/kapsamlar/token/nonce
  alanlarına ek olarak `platform` ve `deviceFamily` değerlerini bağlar.
- Eski `v2` imzaları uyumluluk için kabul edilmeye devam eder, ancak eşleştirilmiş
  cihaz meta verisi sabitlemesi yeniden bağlantıda komut politikasını denetlemeye
  devam eder.

## TLS + sabitleme

- WS bağlantıları için TLS desteklenir.
- İstemciler isteğe bağlı olarak Gateway sertifika parmak izini sabitleyebilir
  (`gateway.tls` yapılandırmasına ve `gateway.remote.tlsFingerprint` veya CLI
  `--tls-fingerprint` seçeneğine bakın).

## Kapsam

Bu protokol **tam Gateway API** yüzeyini açığa çıkarır (durum, kanallar,
modeller, sohbet, ajan, oturumlar, node'lar, onaylar vb.). Tam yüzey
`src/gateway/protocol/schema.ts` içindeki TypeBox şemaları tarafından tanımlanır.

## İlgili

- [Köprü protokolü](/tr/gateway/bridge-protocol)
- [Gateway çalışma kitabı](/tr/gateway)
