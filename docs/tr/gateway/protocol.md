---
read_when:
    - Gateway WS istemcilerini uygulama veya güncelleme
    - Protokol uyuşmazlıklarında veya bağlantı hatalarında hata ayıklama
    - Protokol şemasını/modellerini yeniden oluşturma
summary: 'Gateway WebSocket protokolü: el sıkışma, çerçeveler, sürümleme'
title: Gateway protokolü
x-i18n:
    generated_at: "2026-05-03T21:33:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 238706fcecd8ca96394402714cde5b01fb296de8e7b5a5867b1b3cf5b7940689
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protokolü, OpenClaw için **tek kontrol düzlemi + node taşıma katmanıdır**. Tüm istemciler (CLI, web UI, macOS uygulaması, iOS/Android node'ları, headless node'lar) WebSocket üzerinden bağlanır ve el sıkışma sırasında **role** + **scope** bilgilerini bildirir.

## Taşıma

- WebSocket, JSON yükleri içeren metin frame'leri.
- İlk frame **mutlaka** bir `connect` isteği olmalıdır.
- Bağlantı öncesi frame'ler 64 KiB ile sınırlandırılır. Başarılı bir el sıkışmadan sonra istemciler `hello-ok.policy.maxPayload` ve `hello-ok.policy.maxBufferedBytes` sınırlarına uymalıdır. Tanılama etkinleştirildiğinde, aşırı büyük gelen frame'ler ve yavaş giden buffer'lar, gateway etkilenen frame'i kapatmadan veya düşürmeden önce `payload.large` event'leri yayar. Bu event'ler boyutları, sınırları, yüzeyleri ve güvenli neden kodlarını tutar. Mesaj gövdesini, ek içeriklerini, ham frame gövdesini, token'ları, cookie'leri veya gizli değerleri tutmazlar.

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

Gateway başlangıç sidecar'larını tamamlamaya devam ederken, `connect` isteği `details.reason` değeri `"startup-sidecars"` olarak ayarlanmış ve `retryAfterMs` içeren yeniden denenebilir bir `UNAVAILABLE` hatası döndürebilir. İstemciler bu yanıtı nihai bir el sıkışma hatası olarak göstermek yerine, genel bağlantı bütçeleri içinde yeniden denemelidir.

`server`, `features`, `snapshot` ve `policy` şema tarafından zorunlu kılınır (`src/gateway/protocol/schema/frames.ts`). `auth` da zorunludur ve müzakere edilen role/scopes bilgisini raporlar. `canvasHostUrl` isteğe bağlıdır.

Cihaz token'ı verilmediğinde, `hello-ok.auth` token alanları olmadan müzakere edilen izinleri raporlar:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilir aynı süreç backend istemcileri (`client.id: "gateway-client"`, `client.mode: "backend"`), paylaşılan gateway token/parolasıyla kimlik doğruladıklarında doğrudan loopback bağlantılarında `device` alanını atlayabilir. Bu yol dahili kontrol düzlemi RPC'leri için ayrılmıştır ve eski CLI/cihaz eşleştirme baseline'larının subagent oturum güncellemeleri gibi yerel backend çalışmalarını engellemesini önler. Uzak istemciler, tarayıcı kökenli istemciler, node istemcileri ve açık cihaz-token'ı/cihaz-kimliği istemcileri normal eşleştirme ve scope yükseltme kontrollerini kullanmaya devam eder.

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

Güvenilir bootstrap devri sırasında, `hello-ok.auth` `deviceTokens` içinde ek sınırlandırılmış role girdileri de içerebilir:

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

Yerleşik node/operator bootstrap akışı için birincil node token'ı `scopes: []` olarak kalır ve devredilen tüm operator token'ları bootstrap operator izin listesiyle (`operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`) sınırlı kalır. Bootstrap scope kontrolleri role önekiyle kalır: operator girdileri yalnızca operator isteklerini karşılar ve operator olmayan role'ler kendi role önekleri altında scope'lara ihtiyaç duymaya devam eder.

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

## Frameleme

- **İstek**: `{type:"req", id, method, params}`
- **Yanıt**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Yan etki oluşturan yöntemler **idempotency key'leri** gerektirir (şemaya bakın).

## Role'ler + scope'lar

Tam operator scope modeli, onay zamanı kontrolleri ve paylaşılan gizli anahtar semantiği için bkz. [Operator scope'ları](/tr/gateway/operator-scopes).

### Role'ler

- `operator` = kontrol düzlemi istemcisi (CLI/UI/otomasyon).
- `node` = capability host (camera/screen/canvas/system.run).

### Scope'lar (operator)

Yaygın scope'lar:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` ile `talk.config`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.

Plugin tarafından kaydedilen gateway RPC yöntemleri kendi operator scope'unu isteyebilir, ancak ayrılmış çekirdek admin önekleri (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) her zaman `operator.admin` olarak çözümlenir.

Yöntem scope'u yalnızca ilk kapıdır. `chat.send` üzerinden ulaşılan bazı slash komutları bunun üzerine daha sıkı komut düzeyi kontroller uygular. Örneğin, kalıcı `/config set` ve `/config unset` yazımları `operator.admin` gerektirir.

`node.pair.approve`, temel yöntem scope'unun üzerine ek bir onay zamanı scope kontrolüne de sahiptir:

- komutsuz istekler: `operator.pairing`
- exec olmayan node komutları içeren istekler: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which` içeren istekler: `operator.pairing` + `operator.admin`

### Cap'ler/komutlar/izinler (node)

Node'lar bağlantı sırasında capability taleplerini bildirir:

- `caps`: üst düzey capability kategorileri.
- `commands`: invoke için komut izin listesi.
- `permissions`: ayrıntılı anahtarlar (örn. `screen.record`, `camera.capture`).

Gateway bunları **talepler** olarak ele alır ve sunucu tarafı izin listelerini uygular.

## Presence

- `system-presence`, cihaz kimliğine göre anahtarlanmış girdiler döndürür.
- Presence girdileri `deviceId`, `roles` ve `scopes` içerir; böylece UI'lar cihaz hem **operator** hem de **node** olarak bağlandığında bile cihaz başına tek bir satır gösterebilir.
- `node.list` isteğe bağlı `lastSeenAtMs` ve `lastSeenReason` alanlarını içerir. Bağlı node'lar mevcut bağlantı zamanlarını `connect` nedeniyle `lastSeenAtMs` olarak raporlar; eşleştirilmiş node'lar, güvenilir bir node event'i eşleştirme metadata'sını güncellediğinde kalıcı arka plan presence'ı da raporlayabilir.

### Node arka plan alive event'i

Node'lar, eşleştirilmiş bir node'un arka plan uyanışı sırasında bağlı olarak işaretlenmeden alive olduğunu kaydetmek için `event: "node.presence.alive"` ile `node.event` çağırabilir.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` kapalı bir enum'dur: `background`, `silent_push`, `bg_app_refresh`, `significant_location`, `manual` veya `connect`. Bilinmeyen trigger dizeleri kalıcılıktan önce gateway tarafından `background` olarak normalize edilir. Event yalnızca kimliği doğrulanmış node cihaz oturumları için kalıcıdır; cihazsız veya eşleştirilmemiş oturumlar `handled: false` döndürür.

Başarılı gateway'ler yapılandırılmış bir sonuç döndürür:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Eski gateway'ler `node.event` için hâlâ `{ "ok": true }` döndürebilir; istemciler bunu kalıcı presence saklama olarak değil, onaylanmış bir RPC olarak ele almalıdır.

## Broadcast event kapsamlandırması

Sunucu tarafından gönderilen WebSocket broadcast event'leri scope ile denetlenir; böylece pairing scope'lu veya yalnızca node oturumları oturum içeriğini pasif olarak almaz.

- **Sohbet, agent ve tool-result frame'leri** (stream edilen `agent` event'leri ve tool call sonuçları dahil) en az `operator.read` gerektirir. `operator.read` olmayan oturumlar bu frame'leri tamamen atlar.
- **Plugin tanımlı `plugin.*` broadcast'leri**, Plugin'in bunları nasıl kaydettiğine bağlı olarak `operator.write` veya `operator.admin` ile sınırlandırılır.
- **Durum ve taşıma event'leri** (`heartbeat`, `presence`, `tick`, bağlantı/bağlantı kesme yaşam döngüsü vb.) kısıtsız kalır; böylece taşıma sağlığı her kimliği doğrulanmış oturum tarafından gözlemlenebilir.
- **Bilinmeyen broadcast event aileleri**, kayıtlı bir işleyici bunları açıkça gevşetmediği sürece varsayılan olarak scope ile denetlenir (fail-closed).

Her istemci bağlantısı kendi istemci başına sıra numarasını tutar; böylece farklı istemciler event akışının farklı scope filtreli alt kümelerini görse bile broadcast'ler o sokette monoton sıralamayı korur.

## Yaygın RPC yöntem aileleri

Genel WS yüzeyi yukarıdaki el sıkışma/kimlik doğrulama örneklerinden daha geniştir. Bu oluşturulmuş bir döküm değildir — `hello-ok.features.methods`, `src/gateway/server-methods-list.ts` ile yüklenen Plugin/channel yöntem dışa aktarımlarından oluşturulmuş muhafazakâr bir keşif listesidir. Bunu `src/gateway/server-methods/*.ts` için tam bir numaralandırma değil, özellik keşfi olarak ele alın.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health`, önbelleğe alınmış veya yeni yoklanmış gateway sağlık snapshot'ını döndürür.
    - `diagnostics.stability`, yakın zamandaki sınırlandırılmış tanılama kararlılığı kaydedicisini döndürür. Event adları, sayımlar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, channel/Plugin adları ve oturum id'leri gibi operasyonel metadata'yı tutar. Sohbet metnini, webhook gövdelerini, araç çıktılarını, ham istek veya yanıt gövdelerini, token'ları, cookie'leri ya da gizli değerleri tutmaz. Operator read scope'u gereklidir.
    - `status`, `/status` tarzı gateway özetini döndürür; hassas alanlar yalnızca admin scope'lu operator istemcileri için dahil edilir.
    - `gateway.identity.get`, relay ve pairing akışları tarafından kullanılan gateway cihaz kimliğini döndürür.
    - `system-presence`, bağlı operator/node cihazları için mevcut presence snapshot'ını döndürür.
    - `system-event`, bir system event'i ekler ve presence bağlamını güncelleyebilir/broadcast edebilir.
    - `last-heartbeat`, en son kalıcı heartbeat event'ini döndürür.
    - `set-heartbeats`, gateway üzerinde heartbeat işlemeyi açıp kapatır.

  </Accordion>

  <Accordion title="Modeller ve kullanım">
    - `models.list`, çalışma zamanı tarafından izin verilen model kataloğunu döndürür. Seçici boyutunda yapılandırılmış modeller için (`agents.defaults.models` önce, ardından `models.providers.*.models`) `{ "view": "configured" }`, tam katalog için ise `{ "view": "all" }` iletin.
    - `usage.status`, sağlayıcı kullanım pencerelerini/kalan kota özetlerini döndürür.
    - `usage.cost`, bir tarih aralığı için toplu maliyet kullanım özetlerini döndürür.
    - `doctor.memory.status`, etkin varsayılan ajan çalışma alanı için vektör belleği / önbelleğe alınmış embedding hazırlığını döndürür. Yalnızca çağıran taraf açıkça canlı bir embedding sağlayıcı ping'i istediğinde `{ "probe": true }` veya `{ "deep": true }` iletin.
    - `doctor.memory.remHarness`, uzaktan kontrol düzlemi istemcileri için sınırlandırılmış, salt okunur bir REM harness önizlemesi döndürür. Çalışma alanı yollarını, bellek parçacıklarını, işlenmiş temellendirilmiş markdown'u ve derin yükseltme adaylarını içerebilir; bu nedenle çağıranların `operator.read` yetkisine ihtiyacı vardır.
    - `sessions.usage`, oturum başına kullanım özetlerini döndürür.
    - `sessions.usage.timeseries`, tek bir oturum için zaman serisi kullanımını döndürür.
    - `sessions.usage.logs`, tek bir oturum için kullanım günlüğü girdilerini döndürür.

  </Accordion>

  <Accordion title="Kanallar ve oturum açma yardımcıları">
    - `channels.status`, yerleşik + paketlenmiş kanal/Plugin durum özetlerini döndürür.
    - `channels.logout`, kanal oturum kapatmayı desteklediğinde belirli bir kanal/hesap oturumunu kapatır.
    - `web.login.start`, geçerli QR destekli web kanalı sağlayıcısı için bir QR/web oturum açma akışı başlatır.
    - `web.login.wait`, bu QR/web oturum açma akışının tamamlanmasını bekler ve başarı durumunda kanalı başlatır.
    - `push.test`, kayıtlı bir iOS node'una test APNs push bildirimi gönderir.
    - `voicewake.get`, saklanan uyandırma sözcüğü tetikleyicilerini döndürür.
    - `voicewake.set`, uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayınlar.

  </Accordion>

  <Accordion title="Mesajlaşma ve günlükler">
    - `send`, sohbet çalıştırıcısı dışındaki kanal/hesap/iş parçacığı hedefli gönderimler için doğrudan dış teslimat RPC'sidir.
    - `logs.tail`, imleç/sınır ve maksimum bayt denetimleriyle yapılandırılmış Gateway dosya günlüğü kuyruğunu döndürür.

  </Accordion>

  <Accordion title="Talk ve TTS">
    - `talk.config`, etkili Talk yapılandırma yükünü döndürür; `includeSecrets`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.
    - `talk.mode`, WebChat/Control UI istemcileri için geçerli Talk modu durumunu ayarlar/yayınlar.
    - `talk.speak`, etkin Talk konuşma sağlayıcısı üzerinden konuşma sentezler.
    - `tts.status`, TTS etkin durumunu, etkin sağlayıcıyı, yedek sağlayıcıları ve sağlayıcı yapılandırma durumunu döndürür.
    - `tts.providers`, görünür TTS sağlayıcı envanterini döndürür.
    - `tts.enable` ve `tts.disable`, TTS tercihleri durumunu açıp kapatır.
    - `tts.setProvider`, tercih edilen TTS sağlayıcısını günceller.
    - `tts.convert`, tek seferlik metinden konuşmaya dönüştürme çalıştırır.

  </Accordion>

  <Accordion title="Gizli bilgiler, yapılandırma, güncelleme ve sihirbaz">
    - `secrets.reload`, etkin SecretRefs öğelerini yeniden çözümler ve çalışma zamanı gizli bilgi durumunu yalnızca tam başarı durumunda değiştirir.
    - `secrets.resolve`, belirli bir komut/hedef kümesi için komut hedefli gizli bilgi atamalarını çözümler.
    - `config.get`, geçerli yapılandırma anlık görüntüsünü ve karmasını döndürür.
    - `config.set`, doğrulanmış bir yapılandırma yükü yazar.
    - `config.patch`, kısmi bir yapılandırma güncellemesini birleştirir.
    - `config.apply`, tam yapılandırma yükünü doğrular + değiştirir.
    - `config.schema`, Control UI ve CLI araçlarının kullandığı canlı yapılandırma şeması yükünü döndürür: şema, `uiHints`, sürüm ve çalışma zamanı yükleyebildiğinde Plugin + kanal şeması meta verileri dahil üretim meta verileri. Şema, eşleşen alan belgeleri bulunduğunda iç içe nesne, joker karakter, dizi öğesi ve `anyOf` / `oneOf` / `allOf` bileşim dalları dahil olmak üzere UI tarafından kullanılan aynı etiketlerden ve yardım metninden türetilen `title` / `description` meta verilerini içerir.
    - `config.schema.lookup`, tek bir yapılandırma yolu için yol kapsamlı arama yükü döndürür: normalleştirilmiş yol, sığ bir şema node'u, eşleşen ipucu + `hintPath` ve UI/CLI ayrıntılı inceleme için doğrudan alt özetler. Arama şeması node'ları, kullanıcıya yönelik belgeleri ve yaygın doğrulama alanlarını (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, sayısal/dize/dizi/nesne sınırları ve `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi bayraklar) korur. Alt özetler `key`, normalleştirilmiş `path`, `type`, `required`, `hasChildren` ve eşleşen `hint` / `hintPath` değerlerini sunar.
    - `update.run`, Gateway güncelleme akışını çalıştırır ve yalnızca güncellemenin kendisi başarılı olduğunda yeniden başlatma zamanlar; oturumu olan çağıranlar, başlangıcın yeniden başlatma devam kuyruğu üzerinden bir takip ajan turunu sürdürmesi için `continuationMessage` ekleyebilir. Paket yöneticisi güncellemeleri, paket değişiminden sonra ertelemesiz ve bekleme süresiz bir güncelleme yeniden başlatmasını zorunlu kılar; böylece eski Gateway süreci değiştirilmiş bir `dist` ağacından tembel yükleme yapmaya devam etmez.
    - `update.status`, kullanılabilir olduğunda yeniden başlatma sonrası çalışan sürüm dahil en son önbelleğe alınmış güncelleme yeniden başlatma işaretçisini döndürür.
    - `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`, başlangıç sihirbazını WS RPC üzerinden sunar.

  </Accordion>

  <Accordion title="Ajan ve çalışma alanı yardımcıları">
    - `agents.list`, etkili model ve çalışma zamanı meta verileri dahil yapılandırılmış ajan girdilerini döndürür.
    - `agents.create`, `agents.update` ve `agents.delete`, ajan kayıtlarını ve çalışma alanı bağlantılarını yönetir.
    - `agents.files.list`, `agents.files.get` ve `agents.files.set`, bir ajan için sunulan önyükleme çalışma alanı dosyalarını yönetir.
    - `artifacts.list`, `artifacts.get` ve `artifacts.download`, açık bir `sessionKey`, `runId` veya `taskId` kapsamı için transkriptten türetilmiş artifact özetlerini ve indirmelerini sunar. Çalıştırma ve görev sorguları, sahip oturumu sunucu tarafında çözümler ve yalnızca eşleşen kökene sahip transcript medyasını döndürür; güvensiz veya yerel URL kaynakları, sunucu tarafında getirme yapmak yerine desteklenmeyen indirmeler döndürür.
    - `agent.identity.get`, bir ajan veya oturum için etkili asistan kimliğini döndürür.
    - `agent.wait`, bir çalıştırmanın bitmesini bekler ve mevcut olduğunda terminal anlık görüntüsünü döndürür.

  </Accordion>

  <Accordion title="Oturum denetimi">
    - `sessions.list`, bir ajan çalışma zamanı arka ucu yapılandırıldığında satır başına `agentRuntime` meta verileri dahil geçerli oturum dizinini döndürür.
    - `sessions.subscribe` ve `sessions.unsubscribe`, geçerli WS istemcisi için oturum değişikliği olay aboneliklerini açıp kapatır.
    - `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`, tek bir oturum için transcript/mesaj olay aboneliklerini açıp kapatır.
    - `sessions.preview`, belirli oturum anahtarları için sınırlandırılmış transcript önizlemeleri döndürür.
    - `sessions.describe`, tam bir oturum anahtarı için bir Gateway oturum satırı döndürür.
    - `sessions.resolve`, bir oturum hedefini çözümler veya kanonikleştirir.
    - `sessions.create`, yeni bir oturum girdisi oluşturur.
    - `sessions.send`, mevcut bir oturuma mesaj gönderir.
    - `sessions.steer`, etkin bir oturum için kesme-ve-yönlendirme varyantıdır.
    - `sessions.abort`, bir oturum için etkin çalışmayı durdurur. Çağıran taraf `key` ile isteğe bağlı `runId` iletebilir veya Gateway'in bir oturuma çözümleyebileceği etkin çalıştırmalar için yalnızca `runId` iletebilir.
    - `sessions.patch`, oturum meta verilerini/geçersiz kılmalarını günceller ve çözümlenen kanonik modeli artı etkili `agentRuntime` değerini bildirir.
    - `sessions.reset`, `sessions.delete` ve `sessions.compact`, oturum bakımını gerçekleştirir.
    - `sessions.get`, tam saklanan oturum satırını döndürür.
    - Sohbet yürütmesi hâlâ `chat.history`, `chat.send`, `chat.abort` ve `chat.inject` kullanır. `chat.history`, UI istemcileri için görüntü açısından normalleştirilir: satır içi directive etiketleri görünür metinden çıkarılır, düz metin tool-call XML yükleri (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş tool-call blokları dahil) ve sızmış ASCII/tam genişlik model denetim token'ları çıkarılır, tam `NO_REPLY` / `no_reply` gibi saf sessiz token asistan satırları atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir.

  </Accordion>

  <Accordion title="Cihaz eşleştirme ve cihaz token'ları">
    - `device.pair.list`, bekleyen ve onaylanmış eşleştirilmiş cihazları döndürür.
    - `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`, cihaz eşleştirme kayıtlarını yönetir.
    - `device.token.rotate`, eşleştirilmiş bir cihaz token'ını onaylanmış rolü ve çağıran kapsamı sınırları içinde döndürür.
    - `device.token.revoke`, eşleştirilmiş bir cihaz token'ını onaylanmış rolü ve çağıran kapsamı sınırları içinde iptal eder.

  </Accordion>

  <Accordion title="Node eşleştirme, çağırma ve bekleyen iş">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` ve `node.pair.verify`, node eşleştirme ve önyükleme doğrulamasını kapsar.
    - `node.list` ve `node.describe`, bilinen/bağlı node durumunu döndürür.
    - `node.rename`, eşleştirilmiş bir node etiketini günceller.
    - `node.invoke`, bir komutu bağlı bir node'a iletir.
    - `node.invoke.result`, bir çağırma isteğinin sonucunu döndürür.
    - `node.event`, node kaynaklı olayları gateway'e geri taşır.
    - `node.canvas.capability.refresh`, kapsamlı canvas yetenek token'larını yeniler.
    - `node.pending.pull` ve `node.pending.ack`, bağlı node kuyruk API'leridir.
    - `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısı kesilmiş node'lar için kalıcı bekleyen işleri yönetir.

  </Accordion>

  <Accordion title="Onay aileleri">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve `exec.approval.resolve`, tek seferlik exec onay isteklerini ve bekleyen onay arama/yeniden oynatmayı kapsar.
    - `exec.approval.waitDecision`, bekleyen bir exec onayını bekler ve nihai kararı döndürür (veya zaman aşımında `null`).
    - `exec.approvals.get` ve `exec.approvals.set`, gateway exec onay ilkesi anlık görüntülerini yönetir.
    - `exec.approvals.node.get` ve `exec.approvals.node.set`, node relay komutları üzerinden node yerel exec onay ilkesini yönetir.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` ve `plugin.approval.resolve`, Plugin tanımlı onay akışlarını kapsar.

  </Accordion>

  <Accordion title="Otomasyon, skills ve araçlar">
    - Otomasyon: `wake`, anında veya bir sonraki Heartbeat'te uyandırma metni enjeksiyonu zamanlar; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zamanlanmış işleri yönetir.
    - Skills ve araçlar: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Yaygın olay aileleri

- `chat`: `chat.inject` gibi UI sohbet güncellemeleri ve yalnızca transcript olan diğer sohbet
  olayları.
- `session.message` ve `session.tool`: abone olunan bir oturum için transcript/olay akışı güncellemeleri.
- `sessions.changed`: oturum dizini veya meta veriler değişti.
- `presence`: sistem presence anlık görüntüsü güncellemeleri.
- `tick`: periyodik keepalive / canlılık olayı.
- `health`: gateway sağlık anlık görüntüsü güncellemesi.
- `heartbeat`: Heartbeat olay akışı güncellemesi.
- `cron`: Cron çalıştırma/iş değişikliği olayı.
- `shutdown`: gateway kapatma bildirimi.
- `node.pair.requested` / `node.pair.resolved`: node eşleştirme yaşam döngüsü.
- `node.invoke.request`: node çağırma isteği yayını.
- `device.pair.requested` / `device.pair.resolved`: eşleştirilmiş cihaz yaşam döngüsü.
- `voicewake.changed`: uyandırma sözcüğü tetikleyici yapılandırması değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onay
  yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin onay
  yaşam döngüsü.

### Node yardımcı yöntemleri

- Node'lar, otomatik izin denetimleri için geçerli skill yürütülebilirleri listesini almak üzere `skills.bins` çağırabilir.

### Operatör yardımcı yöntemleri

- Operatörler, bir aracı için çalışma zamanı komut envanterini almak üzere `commands.list` (`operator.read`) çağrısını yapabilir.
  - `agentId` isteğe bağlıdır; varsayılan aracı çalışma alanını okumak için bunu atlayın.
  - `scope`, birincil `name` hedefinin hangi yüzey olduğunu denetler:
    - `text`, baştaki `/` olmadan birincil metin komutu belirtecini döndürür
    - `native` ve varsayılan `both` yolu, mevcut olduğunda sağlayıcıya duyarlı yerel adları döndürür
  - `textAliases`, `/model` ve `/m` gibi tam eğik çizgi takma adlarını taşır.
  - `nativeName`, varsa sağlayıcıya duyarlı yerel komut adını taşır.
  - `provider` isteğe bağlıdır ve yalnızca yerel adlandırmayı ve yerel Plugin komutu kullanılabilirliğini etkiler.
  - `includeArgs=false`, serileştirilmiş argüman meta verilerini yanıttan çıkarır.
- Operatörler, bir aracı için çalışma zamanı araç kataloğunu almak üzere `tools.catalog` (`operator.read`) çağrısını yapabilir. Yanıt, gruplanmış araçları ve kaynak meta verilerini içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda Plugin sahibi
  - `optional`: bir Plugin aracının isteğe bağlı olup olmadığı
- Operatörler, bir oturum için çalışma zamanında etkin araç envanterini almak üzere `tools.effective` (`operator.read`) çağrısını yapabilir.
  - `sessionKey` zorunludur.
  - Gateway, çağıranın sağladığı kimlik doğrulama veya teslim bağlamını kabul etmek yerine, güvenilir çalışma zamanı bağlamını oturumdan sunucu tarafında türetir.
  - Yanıt oturum kapsamındadır ve etkin konuşmanın şu anda kullanabileceği core, Plugin ve kanal araçları dahil her şeyi yansıtır.
- Operatörler, `/tools/invoke` ile aynı Gateway ilke yolu üzerinden kullanılabilir bir aracı çağırmak için `tools.invoke` (`operator.write`) çağrısını yapabilir.
  - `name` zorunludur. `args`, `sessionKey`, `agentId`, `confirm` ve
    `idempotencyKey` isteğe bağlıdır.
  - Hem `sessionKey` hem de `agentId` mevcutsa, çözümlenen oturum aracısı `agentId` ile eşleşmelidir.
  - Yanıt, `ok`, `toolName`, isteğe bağlı `output` ve türlendirilmiş `error` alanları içeren SDK odaklı bir zarftır. Onay veya ilke retleri, Gateway araç ilkesi işlem hattını atlamak yerine yük içinde `ok:false` döndürür.
- Operatörler, bir aracı için görünür Skills envanterini almak üzere `skills.status` (`operator.read`) çağrısını yapabilir.
  - `agentId` isteğe bağlıdır; varsayılan aracı çalışma alanını okumak için bunu atlayın.
  - Yanıt; uygunluğu, eksik gereksinimleri, yapılandırma kontrollerini ve ham gizli değerleri açığa çıkarmadan temizlenmiş kurulum seçeneklerini içerir.
- Operatörler, ClawHub keşif meta verileri için `skills.search` ve `skills.detail` (`operator.read`) çağrılarını yapabilir.
- Operatörler, `skills.install` (`operator.admin`) çağrısını iki modda yapabilir:
  - ClawHub modu: `{ source: "clawhub", slug, version?, force? }`, varsayılan aracı çalışma alanı `skills/` dizinine bir skill klasörü kurar.
  - Gateway kurucu modu: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`, Gateway ana makinesinde tanımlanmış bir `metadata.openclaw.install` eylemini çalıştırır.
- Operatörler, `skills.update` (`operator.admin`) çağrısını iki modda yapabilir:
  - ClawHub modu, varsayılan aracı çalışma alanında izlenen tek bir slug'ı veya izlenen tüm ClawHub kurulumlarını günceller.
  - Yapılandırma modu, `enabled`, `apiKey` ve `env` gibi `skills.entries.<skillKey>` değerlerine yama uygular.

### `models.list` görünümleri

`models.list`, isteğe bağlı bir `view` parametresi kabul eder:

- Atlanmış veya `"default"`: geçerli çalışma zamanı davranışı. `agents.defaults.models` yapılandırılmışsa yanıt izin verilen katalogdur; aksi halde yanıt tam Gateway kataloğudur.
- `"configured"`: seçici boyutunda davranış. `agents.defaults.models` yapılandırılmışsa yine önceliklidir. Aksi halde yanıt açık `models.providers.*.models` girdilerini kullanır ve yalnızca yapılandırılmış model satırı yoksa tam kataloğa geri döner.
- `"all"`: tam Gateway kataloğu; `agents.defaults.models` ayarını atlar. Bunu normal model seçicileri için değil, tanılama ve keşif kullanıcı arayüzleri için kullanın.

## Exec onayları

- Bir exec isteği onay gerektirdiğinde Gateway `exec.approval.requested` yayınını yapar.
- Operatör istemcileri, `exec.approval.resolve` çağrısını yaparak çözer (`operator.approvals` kapsamı gerektirir).
- `host=node` için `exec.approval.request`, `systemRunPlan` içermelidir (kanonik `argv`/`cwd`/`rawCommand`/oturum meta verileri). `systemRunPlan` eksik olan istekler reddedilir.
- Onaydan sonra, iletilen `node.invoke system.run` çağrıları bu kanonik
  `systemRunPlan` değerini yetkili komut/cwd/oturum bağlamı olarak yeniden kullanır.
- Bir çağıran, hazırlama ile son onaylı `system.run` iletimi arasında `command`, `rawCommand`, `cwd`, `agentId` veya
  `sessionKey` değerini değiştirirse Gateway, değiştirilmiş yüke güvenmek yerine çalıştırmayı reddeder.

## Aracı teslim geri dönüşü

- `agent` istekleri, dışa teslim istemek için `deliver=true` içerebilir.
- `bestEffortDeliver=false` katı davranışı korur: çözülemeyen veya yalnızca dahili teslim hedefleri `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici teslim edilebilir bir rota çözülemediğinde oturumla sınırlı yürütmeye geri dönüşe izin verir (örneğin dahili/web sohbet oturumları veya belirsiz çok kanallı yapılandırmalar).

## Sürümleme

- `PROTOCOL_VERSION`, `src/gateway/protocol/schema/protocol-schemas.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu uyumsuzlukları reddeder.
- Şemalar + modeller TypeBox tanımlarından oluşturulur:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### İstemci sabitleri

`src/gateway/client.ts` içindeki referans istemci bu varsayılanları kullanır. Değerler
protokol v3 boyunca kararlıdır ve üçüncü taraf istemciler için beklenen temel çizgidir.

| Sabit                                     | Varsayılan                                            | Kaynak                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| İstek zaman aşımı (RPC başına)            | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Ön kimlik doğrulama / bağlantı meydan okuması zaman aşımı | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env eşleştirilmiş sunucu/istemci bütçesini artırabilir) |
| İlk yeniden bağlanma geri çekilmesi       | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maksimum yeniden bağlanma geri çekilmesi  | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Cihaz belirteci kapanışı sonrası hızlı yeniden deneme sınırı | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` öncesi zorla durdurma ek süresi | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` varsayılan zaman aşımı    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Varsayılan tik aralığı (`hello-ok` öncesi) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Tik zaman aşımı kapanışı                  | sessizlik `tickIntervalMs * 2` değerini aştığında kod `4000` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Sunucu, etkin `policy.tickIntervalMs`, `policy.maxPayload` ve `policy.maxBufferedBytes`
değerlerini `hello-ok` içinde duyurur; istemciler el sıkışma öncesi varsayılanlar yerine
bu değerlere uymalıdır.

## Kimlik doğrulama

- Paylaşılan gizli Gateway kimlik doğrulaması, yapılandırılmış kimlik doğrulama moduna bağlı olarak `connect.params.auth.token` veya
  `connect.params.auth.password` kullanır.
- Tailscale Serve gibi kimlik taşıyan modlar
  (`gateway.auth.allowTailscale: true`) veya loopback olmayan
  `gateway.auth.mode: "trusted-proxy"`, bağlantı kimlik doğrulaması denetimini
  `connect.params.auth.*` yerine istek üstbilgilerinden karşılar.
- Özel giriş `gateway.auth.mode: "none"`, paylaşılan gizli bağlantı kimlik doğrulamasını
  tamamen atlar; bu modu herkese açık/güvenilmeyen girişlerde kullanıma açmayın.
- Eşleştirmeden sonra Gateway, bağlantı rolü + kapsamlarıyla sınırlı bir **cihaz token’ı** verir.
  `hello-ok.auth.deviceToken` içinde döndürülür ve gelecekteki bağlantılar için
  istemci tarafından kalıcı olarak saklanmalıdır.
- İstemciler, başarılı her bağlantıdan sonra birincil `hello-ok.auth.deviceToken` değerini kalıcı olarak saklamalıdır.
- Bu **saklanan** cihaz token’ıyla yeniden bağlanmak, o token için saklanan
  onaylı kapsam kümesini de yeniden kullanmalıdır. Bu, zaten verilmiş olan
  okuma/yoklama/durum erişimini korur ve yeniden bağlantıların sessizce daha dar
  örtük yalnızca-yönetici kapsamına düşmesini önler.
- İstemci tarafı bağlantı kimlik doğrulaması birleştirme (`selectConnectAuth` içinde
  `src/gateway/client.ts`):
  - `auth.password` bağımsızdır ve ayarlandığında her zaman iletilir.
  - `auth.token` öncelik sırasıyla doldurulur: önce açık paylaşılan token,
    sonra açık bir `deviceToken`, ardından saklanan cihaz başına token (`deviceId` + `role` ile anahtarlanır).
  - `auth.bootstrapToken` yalnızca yukarıdakilerin hiçbiri bir `auth.token`
    çözemediğinde gönderilir. Paylaşılan token veya çözümlenen herhangi bir cihaz token’ı bunu bastırır.
  - Tek seferlik `AUTH_TOKEN_MISMATCH` yeniden denemesinde saklanan cihaz token’ının
    otomatik yükseltilmesi **yalnızca güvenilir uç noktalarla** sınırlıdır:
    loopback veya sabitlenmiş `tlsFingerprint` ile `wss://`. Sabitleme olmadan herkese açık `wss://`
    uygun sayılmaz.
- Ek `hello-ok.auth.deviceTokens` girdileri önyükleme devretme token’larıdır.
  Bunları yalnızca bağlantı `wss://` veya loopback/yerel eşleştirme gibi güvenilir bir aktarımda
  önyükleme kimlik doğrulaması kullandığında kalıcı olarak saklayın.
- Bir istemci **açık** `deviceToken` veya açık `scopes` sağlarsa,
  çağıranın istediği kapsam kümesi yetkili kalır; önbelleğe alınmış kapsamlar yalnızca
  istemci saklanan cihaz başına token’ı yeniden kullandığında yeniden kullanılır.
- Cihaz token’ları `device.token.rotate` ve
  `device.token.revoke` aracılığıyla döndürülebilir/iptal edilebilir (`operator.pairing` kapsamı gerekir).
- `device.token.rotate` döndürme meta verilerini döndürür. Yerine geçen
  taşıyıcı token’ı yalnızca aynı cihaz token’ıyla zaten kimliği doğrulanmış
  aynı-cihaz çağrıları için yineler; böylece yalnızca-token kullanan istemciler
  yeniden bağlanmadan önce yedeklerini kalıcı olarak saklayabilir. Paylaşılan/yönetici döndürmeleri taşıyıcı token’ı yinelemez.
- Token verme, döndürme ve iptal işlemleri, o cihazın eşleştirme girdisinde
  kaydedilmiş onaylı rol kümesiyle sınırlı kalır; token değişikliği, eşleştirme onayının
  hiç vermediği bir cihaz rolünü genişletemez veya hedefleyemez.
- Eşleştirilmiş-cihaz token oturumları için, çağıranda ayrıca `operator.admin` yoksa
  cihaz yönetimi kendisiyle sınırlıdır: yönetici olmayan çağıranlar yalnızca **kendi**
  cihaz girdilerini kaldırabilir/iptal edebilir/döndürebilir.
- `device.token.rotate` ve `device.token.revoke`, hedef operatör
  token kapsam kümesini çağıranın geçerli oturum kapsamlarına karşı da denetler. Yönetici olmayan çağıranlar,
  halihazırda sahip olduklarından daha geniş bir operatör token’ını döndüremez veya iptal edemez.
- Kimlik doğrulama hataları `error.details.code` ile birlikte kurtarma ipuçları içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilir istemciler, önbelleğe alınmış cihaz başına token ile sınırlı bir yeniden deneme girişiminde bulunabilir.
  - Bu yeniden deneme başarısız olursa istemciler otomatik yeniden bağlanma döngülerini durdurmalı ve operatör eylem rehberliğini göstermelidir.

## Cihaz kimliği + eşleştirme

- Node’lar, anahtar çifti parmak izinden türetilmiş kararlı bir cihaz kimliği (`device.id`) içermelidir.
- Gateway’ler cihaz + rol başına token verir.
- Yerel otomatik onay etkin değilse yeni cihaz kimlikleri için eşleştirme onayları gerekir.
- Eşleştirme otomatik onayı, doğrudan local loopback bağlantıları etrafında şekillenir.
- OpenClaw ayrıca güvenilir paylaşılan gizli yardımcı akışları için dar bir arka uç/konteyner-yerel kendi kendine bağlanma yoluna sahiptir.
- Aynı ana makine tailnet veya LAN bağlantıları, eşleştirme açısından hâlâ uzak kabul edilir ve onay gerektirir.
- WS istemcileri normalde `connect` sırasında `device` kimliği içerir (operatör +
  node). Cihazsız tek operatör istisnaları açık güven yollarıdır:
  - Yalnızca localhost güvenli olmayan HTTP uyumluluğu için `gateway.controlUi.allowInsecureAuth=true`.
  - Başarılı `gateway.auth.mode: "trusted-proxy"` operatör Control UI kimlik doğrulaması.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (acil durum, ciddi güvenlik düşürmesi).
  - Paylaşılan Gateway token’ı/parolasıyla kimliği doğrulanmış doğrudan-loopback `gateway-client` arka uç RPC’leri.
- Tüm bağlantılar, sunucunun sağladığı `connect.challenge` nonce değerini imzalamalıdır.

### Cihaz kimlik doğrulaması geçiş tanılamaları

Hâlâ zorlama öncesi imzalama davranışını kullanan eski istemciler için `connect` artık
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
- Sunucu nonce’unu içeren v2 yükünü imzalayın.
- Aynı nonce’u `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza yükü `v3` değeridir; bu, cihaz/istemci/rol/kapsam/token/nonce alanlarına ek olarak
  `platform` ve `deviceFamily` değerlerini bağlar.
- Eski `v2` imzaları uyumluluk için kabul edilmeye devam eder, ancak eşleştirilmiş-cihaz
  meta veri sabitlemesi yeniden bağlantıda komut ilkesini kontrol etmeye devam eder.

## TLS + sabitleme

- TLS, WS bağlantıları için desteklenir.
- İstemciler isteğe bağlı olarak Gateway sertifika parmak izini sabitleyebilir (`gateway.tls`
  yapılandırmasına ve `gateway.remote.tlsFingerprint` veya CLI `--tls-fingerprint` değerine bakın).

## Kapsam

Bu protokol **tam Gateway API’sini** açığa çıkarır (durum, kanallar, modeller, sohbet,
ajan, oturumlar, node’lar, onaylar vb.). Tam yüzey
`src/gateway/protocol/schema.ts` içindeki TypeBox şemaları tarafından tanımlanır.

## İlgili

- [Köprü protokolü](/tr/gateway/bridge-protocol)
- [Gateway çalışma kitabı](/tr/gateway)
