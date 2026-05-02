---
read_when:
    - Gateway WS istemcilerini uygulama veya güncelleme
    - Protokol uyumsuzluklarını veya bağlantı hatalarını ayıklama
    - Protokol şeması/modelleri yeniden oluşturuluyor
summary: 'Gateway WebSocket protokolü: el sıkışma, çerçeveler, sürümleme'
title: Gateway protokolü
x-i18n:
    generated_at: "2026-05-02T08:55:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8295e4e416250e7381393c0aa6a0016719f96552485cf9d56bb3896c9704c4a9
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protokolü, OpenClaw için **tek kontrol düzlemi + node taşımasıdır**.
Tüm istemciler (CLI, web kullanıcı arayüzü, macOS uygulaması, iOS/Android node’ları, başsız
node’lar) WebSocket üzerinden bağlanır ve el sıkışma sırasında **rol** + **kapsamlarını**
bildirir.

## Taşıma

- WebSocket, JSON yükleri içeren metin frame’leri.
- İlk frame **mutlaka** bir `connect` isteği olmalıdır.
- Bağlantı öncesi frame’ler 64 KiB ile sınırlıdır. Başarılı bir el sıkışmadan sonra istemciler
  `hello-ok.policy.maxPayload` ve
  `hello-ok.policy.maxBufferedBytes` sınırlarına uymalıdır. Tanılama etkinleştirildiğinde,
  aşırı büyük gelen frame’ler ve yavaş giden arabellekler, gateway etkilenen frame’i
  kapatmadan veya düşürmeden önce `payload.large` olayları yayar. Bu olaylar
  boyutları, sınırları, yüzeyleri ve güvenli neden kodlarını saklar. Mesaj
  gövdesini, ek içeriklerini, ham frame gövdesini, token’ları, çerezleri veya gizli değerleri
  saklamaz.

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

Gateway başlangıç yardımcılarını hâlâ tamamlıyorken, `connect` isteği
`details.reason` değeri `"startup-sidecars"` olarak ayarlanmış ve `retryAfterMs`
içeren yeniden denenebilir bir `UNAVAILABLE` hatası döndürebilir. İstemciler bu yanıtı
sonlandırıcı bir el sıkışma hatası olarak göstermek yerine genel bağlantı bütçeleri içinde
yeniden denemelidir.

`server`, `features`, `snapshot` ve `policy` şema tarafından zorunludur
(`src/gateway/protocol/schema/frames.ts`). `auth` da zorunludur ve
uzlaşılan rol/kapsamları bildirir. `canvasHostUrl` isteğe bağlıdır.

Hiçbir cihaz token’ı verilmediğinde, `hello-ok.auth` uzlaşılan
izinleri token alanları olmadan bildirir:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilen aynı süreç arka uç istemcileri (`client.id: "gateway-client"`,
`client.mode: "backend"`), paylaşılan gateway token’ı/parolasıyla kimlik doğruladıklarında
doğrudan loopback bağlantılarında `device` öğesini atlayabilir. Bu yol dahili
kontrol düzlemi RPC’leri için ayrılmıştır ve eski CLI/cihaz eşleştirme tabanlarının
alt ajan oturum güncellemeleri gibi yerel arka uç işlerini engellemesini önler. Uzak istemciler,
tarayıcı kökenli istemciler, node istemcileri ve açık cihaz-token’ı/cihaz-kimliği
istemcileri normal eşleştirme ve kapsam yükseltme denetimlerini kullanmaya devam eder.

Bir cihaz token’ı verildiğinde, `hello-ok` şunu da içerir:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilen bootstrap devri sırasında, `hello-ok.auth` `deviceTokens` içinde ek
sınırlandırılmış rol girdileri de içerebilir:

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

Yerleşik node/operator bootstrap akışı için birincil node token’ı
`scopes: []` olarak kalır ve devredilen tüm operator token’ları bootstrap
operator izin listesiyle (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`) sınırlı kalır. Bootstrap kapsam denetimleri
rol önekli kalır: operator girdileri yalnızca operator isteklerini karşılar ve operator olmayan
rollerin yine kendi rol önekleri altında kapsamları olması gerekir.

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
- **Olay**: `{type:"event", event, payload, seq?, stateVersion?}`

Yan etki oluşturan yöntemler **idempotency key** gerektirir (şemaya bakın).

## Roller + kapsamlar

### Roller

- `operator` = kontrol düzlemi istemcisi (CLI/UI/otomasyon).
- `node` = yetenek ana makinesi (camera/screen/canvas/system.run).

### Kapsamlar (operator)

Yaygın kapsamlar:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` ile `talk.config`, `operator.talk.secrets`
(veya `operator.admin`) gerektirir.

Plugin tarafından kaydedilen gateway RPC yöntemleri kendi operator kapsamlarını isteyebilir, ancak
ayrılmış çekirdek yönetici önekleri (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) her zaman `operator.admin` olarak çözümlenir.

Yöntem kapsamı yalnızca ilk kapıdır. `chat.send` üzerinden erişilen bazı slash komutları
bunun üstüne daha sıkı komut düzeyi denetimleri uygular. Örneğin kalıcı
`/config set` ve `/config unset` yazmaları `operator.admin` gerektirir.

`node.pair.approve`, temel yöntem kapsamının üstünde ek bir onay zamanı
kapsam denetimine de sahiptir:

- komutsuz istekler: `operator.pairing`
- exec olmayan node komutları içeren istekler: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which` içeren istekler:
  `operator.pairing` + `operator.admin`

### Yetenekler/komutlar/izinler (node)

Node’lar bağlantı zamanında yetenek iddialarını bildirir:

- `caps`: üst düzey yetenek kategorileri.
- `commands`: invoke için komut izin listesi.
- `permissions`: ayrıntılı anahtarlar (örn. `screen.record`, `camera.capture`).

Gateway bunları **iddia** olarak ele alır ve sunucu tarafı izin listelerini uygular.

## Varlık

- `system-presence`, cihaz kimliğine göre anahtarlanan girdiler döndürür.
- Varlık girdileri `deviceId`, `roles` ve `scopes` içerir; böylece kullanıcı arayüzleri, bir cihaz hem **operator** hem de **node** olarak bağlansa bile cihaz başına tek satır gösterebilir.
- `node.list`, isteğe bağlı `lastSeenAtMs` ve `lastSeenReason` alanlarını içerir. Bağlı node’lar
  mevcut bağlantı zamanlarını `connect` nedeniyle `lastSeenAtMs` olarak bildirir; eşleştirilmiş node’lar, güvenilen bir node olayı eşleştirme meta verilerini güncellediğinde
  kalıcı arka plan varlığı da bildirebilir.

### Node arka plan alive olayı

Node’lar, eşleştirilmiş bir node’un arka plan uyanışı sırasında
bağlı olarak işaretlenmeden canlı olduğunu kaydetmek için `event: "node.presence.alive"` ile `node.event` çağırabilir.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` kapalı bir enum’dur: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` veya `connect`. Bilinmeyen trigger dizeleri kalıcılığa yazılmadan önce
gateway tarafından `background` olarak normalleştirilir. Olay yalnızca kimliği doğrulanmış node
cihaz oturumları için kalıcıdır; cihazsız veya eşleştirilmemiş oturumlar `handled: false` döndürür.

Başarılı gateway’ler yapılandırılmış bir sonuç döndürür:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Daha eski gateway’ler `node.event` için hâlâ `{ "ok": true }` döndürebilir; istemciler bunu
kalıcı varlık saklaması olarak değil, onaylanmış bir RPC olarak ele almalıdır.

## Yayın olayı kapsamlandırması

Sunucu tarafından itilen WebSocket yayın olayları kapsam kapılıdır; böylece eşleştirme kapsamlı veya yalnızca node oturumları oturum içeriğini pasif olarak almaz.

- **Sohbet, ajan ve araç sonucu frame’leri** (stream edilen `agent` olayları ve araç çağrısı sonuçları dahil) en az `operator.read` gerektirir. `operator.read` olmayan oturumlar bu frame’leri tamamen atlar.
- **Plugin tanımlı `plugin.*` yayınları**, Plugin’in bunları nasıl kaydettiğine bağlı olarak `operator.write` veya `operator.admin` ile kapılanır.
- **Durum ve taşıma olayları** (`heartbeat`, `presence`, `tick`, connect/disconnect yaşam döngüsü vb.) kısıtlanmadan kalır; böylece taşıma sağlığı her kimliği doğrulanmış oturum tarafından gözlemlenebilir.
- **Bilinmeyen yayın olayı aileleri**, kayıtlı bir işleyici bunları açıkça gevşetmedikçe varsayılan olarak kapsam kapılıdır (kapalı hata).

Her istemci bağlantısı kendi istemci başına sıra numarasını korur; böylece farklı istemciler olay akışının farklı kapsam filtreli alt kümelerini görse bile yayınlar o sokette monoton sıralamayı korur.

## Yaygın RPC yöntem aileleri

Genel WS yüzeyi yukarıdaki el sıkışma/kimlik doğrulama örneklerinden daha geniştir. Bu
üretilmiş bir döküm değildir; `hello-ok.features.methods`, `src/gateway/server-methods-list.ts`
ile yüklenen Plugin/kanal yöntem dışa aktarımlarından oluşturulmuş muhafazakâr
bir keşif listesidir. Bunu `src/gateway/server-methods/*.ts` öğesinin tam
numaralandırması olarak değil, özellik keşfi olarak ele alın.

<AccordionGroup>
  <Accordion title="Sistem ve kimlik">
    - `health`, önbelleğe alınmış veya yeni yoklanmış gateway sağlık anlık görüntüsünü döndürür.
    - `diagnostics.stability`, yakın zamandaki sınırlandırılmış tanılama kararlılığı kaydedicisini döndürür. Olay adları, sayımlar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/Plugin adları ve oturum kimlikleri gibi operasyonel meta verileri saklar. Sohbet metnini, webhook gövdelerini, araç çıktılarını, ham istek veya yanıt gövdelerini, token’ları, çerezleri ya da gizli değerleri saklamaz. Operator okuma kapsamı gereklidir.
    - `status`, `/status` tarzı gateway özetini döndürür; hassas alanlar yalnızca yönetici kapsamlı operator istemcileri için dahil edilir.
    - `gateway.identity.get`, relay ve eşleştirme akışları tarafından kullanılan gateway cihaz kimliğini döndürür.
    - `system-presence`, bağlı operator/node cihazları için mevcut varlık anlık görüntüsünü döndürür.
    - `system-event`, bir sistem olayı ekler ve varlık bağlamını güncelleyebilir/yayınlayabilir.
    - `last-heartbeat`, kalıcı hale getirilmiş en son heartbeat olayını döndürür.
    - `set-heartbeats`, gateway üzerinde heartbeat işlemeyi açıp kapatır.

  </Accordion>

  <Accordion title="Modeller ve kullanım">
    - `models.list`, çalışma zamanında izin verilen model kataloğunu döndürür. Seçici boyutundaki yapılandırılmış modeller için (`agents.defaults.models` önce, ardından `models.providers.*.models`) `{ "view": "configured" }`, tam katalog için `{ "view": "all" }` iletin.
    - `usage.status`, sağlayıcı kullanım pencerelerini/kalan kota özetlerini döndürür.
    - `usage.cost`, bir tarih aralığı için birleştirilmiş maliyet kullanım özetlerini döndürür.
    - `doctor.memory.status`, etkin varsayılan aracı çalışma alanı için vektör belleği / önbelleğe alınmış embedding hazırlığını döndürür. Yalnızca çağıran taraf açıkça canlı bir embedding sağlayıcısı ping'i istediğinde `{ "probe": true }` veya `{ "deep": true }` iletin.
    - `doctor.memory.remHarness`, uzak kontrol düzlemi istemcileri için sınırlı, salt okunur bir REM harness önizlemesi döndürür. Çalışma alanı yollarını, bellek parçacıklarını, işlenmiş temellendirilmiş markdown'u ve derin yükseltme adaylarını içerebilir; bu nedenle çağıranların `operator.read` yetkisine ihtiyacı vardır.
    - `sessions.usage`, oturum başına kullanım özetlerini döndürür.
    - `sessions.usage.timeseries`, tek bir oturum için zaman serisi kullanımını döndürür.
    - `sessions.usage.logs`, tek bir oturum için kullanım günlüğü girdilerini döndürür.

  </Accordion>

  <Accordion title="Kanallar ve oturum açma yardımcıları">
    - `channels.status`, yerleşik + birlikte gelen kanal/Plugin durum özetlerini döndürür.
    - `channels.logout`, kanalın çıkışı desteklediği durumlarda belirli bir kanal/hesap oturumunu kapatır.
    - `web.login.start`, geçerli QR destekli web kanal sağlayıcısı için bir QR/web oturum açma akışı başlatır.
    - `web.login.wait`, bu QR/web oturum açma akışının tamamlanmasını bekler ve başarılı olursa kanalı başlatır.
    - `push.test`, kayıtlı bir iOS Node'una test APNs push'u gönderir.
    - `voicewake.get`, saklanan uyandırma sözcüğü tetikleyicilerini döndürür.
    - `voicewake.set`, uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayınlar.

  </Accordion>

  <Accordion title="Mesajlaşma ve günlükler">
    - `send`, sohbet çalıştırıcısı dışındaki kanal/hesap/konu hedefli gönderimler için doğrudan giden teslimat RPC'sidir.
    - `logs.tail`, imleç/sınır ve maksimum bayt denetimleriyle yapılandırılmış gateway dosya günlüğü kuyruğunu döndürür.

  </Accordion>

  <Accordion title="Talk ve TTS">
    - `talk.config`, etkin Talk yapılandırma yükünü döndürür; `includeSecrets`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.
    - `talk.mode`, WebChat/Control UI istemcileri için geçerli Talk modu durumunu ayarlar/yayınlar.
    - `talk.speak`, etkin Talk konuşma sağlayıcısı üzerinden konuşma sentezler.
    - `tts.status`, TTS etkin durumunu, etkin sağlayıcıyı, yedek sağlayıcıları ve sağlayıcı yapılandırma durumunu döndürür.
    - `tts.providers`, görünür TTS sağlayıcı envanterini döndürür.
    - `tts.enable` ve `tts.disable`, TTS tercih durumunu değiştirir.
    - `tts.setProvider`, tercih edilen TTS sağlayıcısını günceller.
    - `tts.convert`, tek seferlik metinden konuşmaya dönüştürme işlemi çalıştırır.

  </Accordion>

  <Accordion title="Gizli değerler, yapılandırma, güncelleme ve sihirbaz">
    - `secrets.reload`, etkin SecretRef'leri yeniden çözümler ve çalışma zamanı gizli değer durumunu yalnızca tam başarı durumunda değiştirir.
    - `secrets.resolve`, belirli bir komut/hedef kümesi için komut hedefli gizli değer atamalarını çözümler.
    - `config.get`, geçerli yapılandırma anlık görüntüsünü ve hash'i döndürür.
    - `config.set`, doğrulanmış bir yapılandırma yükü yazar.
    - `config.patch`, kısmi bir yapılandırma güncellemesini birleştirir.
    - `config.apply`, tam yapılandırma yükünü doğrular + değiştirir.
    - `config.schema`, Control UI ve CLI araçlarının kullandığı canlı yapılandırma şeması yükünü döndürür: şema, `uiHints`, sürüm ve üretim meta verileri; çalışma zamanı yükleyebildiğinde Plugin + kanal şeması meta verileri dahil. Şema, eşleşen alan belgeleri mevcut olduğunda iç içe nesne, joker karakter, dizi öğesi ve `anyOf` / `oneOf` / `allOf` bileşim dalları dahil olmak üzere UI tarafından kullanılan aynı etiketlerden ve yardım metninden türetilmiş `title` / `description` meta verilerini içerir.
    - `config.schema.lookup`, tek bir yapılandırma yolu için yol kapsamlı bir arama yükü döndürür: normalleştirilmiş yol, sığ bir şema düğümü, eşleşen ipucu + `hintPath` ve UI/CLI ayrıntıya inme için doğrudan alt özetler. Arama şeması düğümleri kullanıcıya dönük belgeleri ve yaygın doğrulama alanlarını (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, sayısal/dize/dizi/nesne sınırları ve `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi bayraklar) korur. Alt özetler `key`, normalleştirilmiş `path`, `type`, `required`, `hasChildren` ile eşleşen `hint` / `hintPath` değerlerini gösterir.
    - `update.run`, gateway güncelleme akışını çalıştırır ve yalnızca güncellemenin kendisi başarılı olduğunda yeniden başlatma zamanlar. Paket yöneticisi güncellemeleri, paket değişiminden sonra eski Gateway sürecinin değiştirilmiş bir `dist` ağacından tembel yükleme yapmayı sürdürmemesi için ertelenmeyen, soğuma süresi olmayan bir güncelleme yeniden başlatmasını zorunlu kılar.
    - `update.status`, mevcut olduğunda yeniden başlatma sonrası çalışan sürüm dahil en son önbelleğe alınmış güncelleme yeniden başlatma sentinel'ini döndürür.
    - `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`, başlangıç sihirbazını WS RPC üzerinden sunar.

  </Accordion>

  <Accordion title="Aracı ve çalışma alanı yardımcıları">
    - `agents.list`, etkin model ve çalışma zamanı meta verileri dahil yapılandırılmış aracı girdilerini döndürür.
    - `agents.create`, `agents.update` ve `agents.delete`, aracı kayıtlarını ve çalışma alanı bağlantılarını yönetir.
    - `agents.files.list`, `agents.files.get` ve `agents.files.set`, bir aracı için sunulan başlangıç çalışma alanı dosyalarını yönetir.
    - `artifacts.list`, `artifacts.get` ve `artifacts.download`, açık bir `sessionKey`, `runId` veya `taskId` kapsamı için transkriptten türetilmiş artifact özetlerini ve indirmelerini sunar. Çalıştırma ve görev sorguları, sahip olan oturumu sunucu tarafında çözümler ve yalnızca eşleşen kökene sahip transkript medyasını döndürür; güvenli olmayan veya yerel URL kaynakları, sunucu tarafında getirmek yerine desteklenmeyen indirmeler döndürür.
    - `agent.identity.get`, bir aracı veya oturum için etkin asistan kimliğini döndürür.
    - `agent.wait`, bir çalıştırmanın bitmesini bekler ve mevcut olduğunda terminal anlık görüntüsünü döndürür.

  </Accordion>

  <Accordion title="Oturum denetimi">
    - `sessions.list`, bir aracı çalışma zamanı arka ucu yapılandırıldığında satır başına `agentRuntime` meta verileri dahil geçerli oturum indeksini döndürür.
    - `sessions.subscribe` ve `sessions.unsubscribe`, geçerli WS istemcisi için oturum değişikliği olay aboneliklerini açar/kapatır.
    - `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`, tek bir oturum için transkript/mesaj olayı aboneliklerini açar/kapatır.
    - `sessions.preview`, belirli oturum anahtarları için sınırlı transkript önizlemeleri döndürür.
    - `sessions.resolve`, bir oturum hedefini çözümler veya kanonikleştirir.
    - `sessions.create`, yeni bir oturum girdisi oluşturur.
    - `sessions.send`, mevcut bir oturuma mesaj gönderir.
    - `sessions.steer`, etkin bir oturum için kesme ve yönlendirme varyantıdır.
    - `sessions.abort`, bir oturum için etkin işi iptal eder. Çağıran taraf `key` ile isteğe bağlı `runId` geçebilir veya Gateway'in bir oturuma çözümleyebildiği etkin çalıştırmalar için yalnızca `runId` geçebilir.
    - `sessions.patch`, oturum meta verilerini/geçersiz kılmalarını günceller ve çözümlenmiş kanonik modeli ve etkin `agentRuntime` değerini raporlar.
    - `sessions.reset`, `sessions.delete` ve `sessions.compact`, oturum bakımını gerçekleştirir.
    - `sessions.get`, tam saklanan oturum satırını döndürür.
    - Sohbet yürütmesi hâlâ `chat.history`, `chat.send`, `chat.abort` ve `chat.inject` kullanır. `chat.history`, UI istemcileri için görüntü açısından normalleştirilir: satır içi yönerge etiketleri görünür metinden çıkarılır, düz metin tool-call XML yükleri (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş tool-call blokları dahil) ve sızmış ASCII/tam genişlikli model denetim token'ları çıkarılır, tam `NO_REPLY` / `no_reply` gibi yalnızca sessiz token içeren asistan satırları atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir.

  </Accordion>

  <Accordion title="Cihaz eşleme ve cihaz token'ları">
    - `device.pair.list`, bekleyen ve onaylanmış eşlenmiş cihazları döndürür.
    - `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`, cihaz eşleme kayıtlarını yönetir.
    - `device.token.rotate`, eşlenmiş bir cihaz token'ını onaylanmış rol ve çağıran kapsamı sınırları içinde döndürür.
    - `device.token.revoke`, eşlenmiş bir cihaz token'ını onaylanmış rol ve çağıran kapsamı sınırları içinde iptal eder.

  </Accordion>

  <Accordion title="Node eşleme, çağırma ve bekleyen iş">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` ve `node.pair.verify`, Node eşleme ve başlangıç doğrulamasını kapsar.
    - `node.list` ve `node.describe`, bilinen/bağlı Node durumunu döndürür.
    - `node.rename`, eşlenmiş bir Node etiketini günceller.
    - `node.invoke`, bir komutu bağlı bir Node'a iletir.
    - `node.invoke.result`, bir çağırma isteğinin sonucunu döndürür.
    - `node.event`, Node kaynaklı olayları gateway'e geri taşır.
    - `node.canvas.capability.refresh`, kapsamlı canvas-capability token'larını yeniler.
    - `node.pending.pull` ve `node.pending.ack`, bağlı Node kuyruğu API'leridir.
    - `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısı kesilmiş Node'lar için dayanıklı bekleyen işleri yönetir.

  </Accordion>

  <Accordion title="Onay aileleri">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve `exec.approval.resolve`, tek seferlik exec onay isteklerini ve bekleyen onay arama/yeniden oynatmayı kapsar.
    - `exec.approval.waitDecision`, bekleyen bir exec onayını bekler ve nihai kararı (veya zaman aşımında `null`) döndürür.
    - `exec.approvals.get` ve `exec.approvals.set`, gateway exec onay ilkesi anlık görüntülerini yönetir.
    - `exec.approvals.node.get` ve `exec.approvals.node.set`, Node geçiş komutları üzerinden Node yerel exec onay ilkesini yönetir.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` ve `plugin.approval.resolve`, Plugin tanımlı onay akışlarını kapsar.

  </Accordion>

  <Accordion title="Otomasyon, Skills ve araçlar">
    - Otomasyon: `wake`, anında veya sonraki Heartbeat uyandırma metni enjeksiyonu zamanlar; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zamanlanmış işi yönetir.
    - Skills ve araçlar: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Yaygın olay aileleri

- `chat`: `chat.inject` ve diğer yalnızca transkript sohbet olayları gibi UI sohbet güncellemeleri.
- `session.message` ve `session.tool`: abone olunan bir oturum için transkript/olay akışı güncellemeleri.
- `sessions.changed`: oturum indeksi veya meta verileri değişti.
- `presence`: sistem varlık anlık görüntüsü güncellemeleri.
- `tick`: periyodik keepalive / canlılık olayı.
- `health`: gateway sağlık anlık görüntüsü güncellemesi.
- `heartbeat`: Heartbeat olay akışı güncellemesi.
- `cron`: Cron çalıştırma/iş değişikliği olayı.
- `shutdown`: gateway kapatma bildirimi.
- `node.pair.requested` / `node.pair.resolved`: Node eşleme yaşam döngüsü.
- `node.invoke.request`: Node çağırma isteği yayını.
- `device.pair.requested` / `device.pair.resolved`: eşlenmiş cihaz yaşam döngüsü.
- `voicewake.changed`: uyandırma sözcüğü tetikleyici yapılandırması değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onay yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin onay yaşam döngüsü.

### Node yardımcı yöntemleri

- Node'lar, otomatik izin denetimleri için geçerli Skills yürütülebilirleri listesini almak üzere `skills.bins` çağırabilir.

### Operatör yardımcı yöntemleri

- Operatörler, bir ajan için çalışma zamanı komut envanterini almak üzere `commands.list` (`operator.read`) çağrısı yapabilir.
  - `agentId` isteğe bağlıdır; varsayılan ajan çalışma alanını okumak için bunu atlayın.
  - `scope`, birincil `name` hedefinin hangi yüzeye yönelik olduğunu denetler:
    - `text`, başındaki `/` olmadan birincil metin komutu belirtecini döndürür
    - `native` ve varsayılan `both` yolu, mevcut olduğunda sağlayıcıya duyarlı yerel adları döndürür
  - `textAliases`, `/model` ve `/m` gibi tam slash alias değerlerini taşır.
  - `nativeName`, mevcut olduğunda sağlayıcıya duyarlı yerel komut adını taşır.
  - `provider` isteğe bağlıdır ve yalnızca yerel adlandırmayı ve yerel Plugin komutu kullanılabilirliğini etkiler.
  - `includeArgs=false`, serileştirilmiş argüman meta verilerini yanıttan çıkarır.
- Operatörler, bir ajan için çalışma zamanı araç kataloğunu almak üzere `tools.catalog` (`operator.read`) çağrısı yapabilir. Yanıt, gruplandırılmış araçları ve kaynak meta verilerini içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda Plugin sahibi
  - `optional`: bir Plugin aracının isteğe bağlı olup olmadığı
- Operatörler, bir oturum için çalışma zamanında etkin araç envanterini almak üzere `tools.effective` (`operator.read`) çağrısı yapabilir.
  - `sessionKey` zorunludur.
  - Gateway, çağıran tarafından sağlanan kimlik doğrulama veya teslim bağlamını kabul etmek yerine güvenilir çalışma zamanı bağlamını oturumdan sunucu tarafında türetir.
  - Yanıt oturum kapsamlıdır ve etkin konuşmanın şu anda kullanabileceği core, Plugin ve kanal araçları dahil olmak üzere mevcut durumu yansıtır.
- Operatörler, `/tools/invoke` ile aynı Gateway ilke yolu üzerinden kullanılabilir bir aracı çağırmak için `tools.invoke` (`operator.write`) çağrısı yapabilir.
  - `name` zorunludur. `args`, `sessionKey`, `agentId`, `confirm` ve `idempotencyKey` isteğe bağlıdır.
  - Hem `sessionKey` hem de `agentId` mevcutsa çözümlenen oturum ajanı `agentId` ile eşleşmelidir.
  - Yanıt, `ok`, `toolName`, isteğe bağlı `output` ve türlendirilmiş `error` alanları içeren SDK'ya yönelik bir zarftır. Onay veya ilke reddi durumları, Gateway araç ilkesi ardışık düzenini atlamak yerine yükte `ok:false` döndürür.
- Operatörler, bir ajan için görünür Skills envanterini almak üzere `skills.status` (`operator.read`) çağrısı yapabilir.
  - `agentId` isteğe bağlıdır; varsayılan ajan çalışma alanını okumak için bunu atlayın.
  - Yanıt, ham gizli değerleri açığa çıkarmadan uygunluk, eksik gereksinimler, yapılandırma kontrolleri ve sanitize edilmiş kurulum seçeneklerini içerir.
- Operatörler, ClawHub keşif meta verileri için `skills.search` ve `skills.detail` (`operator.read`) çağrısı yapabilir.
- Operatörler, iki modda `skills.install` (`operator.admin`) çağrısı yapabilir:
  - ClawHub modu: `{ source: "clawhub", slug, version?, force? }`, varsayılan ajan çalışma alanındaki `skills/` dizinine bir Skills klasörü kurar.
  - Gateway yükleyici modu: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`, Gateway ana makinesinde bildirilen bir `metadata.openclaw.install` eylemini çalıştırır.
- Operatörler, iki modda `skills.update` (`operator.admin`) çağrısı yapabilir:
  - ClawHub modu, varsayılan ajan çalışma alanında izlenen tek bir slug'ı veya izlenen tüm ClawHub kurulumlarını günceller.
  - Yapılandırma modu, `enabled`, `apiKey` ve `env` gibi `skills.entries.<skillKey>` değerlerini yamalar.

### `models.list` görünümleri

`models.list`, isteğe bağlı bir `view` parametresi kabul eder:

- Atlanmış veya `"default"`: geçerli çalışma zamanı davranışı. `agents.defaults.models` yapılandırılmışsa yanıt izin verilen katalogdur; aksi halde yanıt tam Gateway kataloğudur.
- `"configured"`: seçim aracı boyutunda davranış. `agents.defaults.models` yapılandırılmışsa yine önceliklidir. Aksi halde yanıt açık `models.providers.*.models` girdilerini kullanır ve yalnızca yapılandırılmış model satırı yoksa tam kataloğa geri döner.
- `"all"`: `agents.defaults.models` değerini atlayarak tam Gateway kataloğu. Bunu normal model seçim araçları için değil, tanılama ve keşif kullanıcı arayüzleri için kullanın.

## Exec onayları

- Bir exec isteği onay gerektirdiğinde Gateway `exec.approval.requested` yayınlar.
- Operatör istemcileri `exec.approval.resolve` çağırarak çözer (`operator.approvals` kapsamı gerektirir).
- `host=node` için `exec.approval.request`, `systemRunPlan` içermelidir (kanonik `argv`/`cwd`/`rawCommand`/oturum meta verileri). `systemRunPlan` eksik olan istekler reddedilir.
- Onaydan sonra iletilen `node.invoke system.run` çağrıları, bu kanonik `systemRunPlan` değerini yetkili komut/cwd/oturum bağlamı olarak yeniden kullanır.
- Bir çağıran, hazırlama ile son onaylanmış `system.run` iletimi arasında `command`, `rawCommand`, `cwd`, `agentId` veya `sessionKey` değerlerini değiştirirse Gateway, değiştirilen yüke güvenmek yerine çalıştırmayı reddeder.

## Ajan teslimi geri dönüşü

- `agent` istekleri, dışa teslim istemek için `deliver=true` içerebilir.
- `bestEffortDeliver=false` katı davranışı korur: çözümlenmemiş veya yalnızca dahili teslim hedefleri `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici olarak teslim edilebilir bir rota çözümlenemediğinde oturumla sınırlı yürütmeye geri dönüşe izin verir (örneğin dahili/webchat oturumları veya belirsiz çok kanallı yapılandırmalar).

## Sürümleme

- `PROTOCOL_VERSION`, `src/gateway/protocol/schema/protocol-schemas.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu uyumsuzlukları reddeder.
- Şemalar + modeller TypeBox tanımlarından üretilir:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### İstemci sabitleri

`src/gateway/client.ts` içindeki referans istemci bu varsayılanları kullanır. Değerler protokol v3 genelinde kararlıdır ve üçüncü taraf istemciler için beklenen temel değerdir.

| Sabit                                     | Varsayılan                                            | Kaynak                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| İstek zaman aşımı (RPC başına)            | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Ön kimlik doğrulama / connect-challenge zaman aşımı | `15_000` ms                                | `src/gateway/handshake-timeouts.ts` (yapılandırma/env eşleştirilmiş sunucu/istemci bütçesini artırabilir) |
| İlk yeniden bağlanma geri çekilmesi       | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Azami yeniden bağlanma geri çekilmesi     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Cihaz belirteci kapanışından sonra hızlı yeniden deneme sınırı | `250` ms                              | `src/gateway/client.ts`                                                                    |
| `terminate()` öncesi zorunlu durdurma ek süresi | `250` ms                                         | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` varsayılan zaman aşımı    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Varsayılan tick aralığı (`hello-ok` öncesi) | `30_000` ms                                         | `src/gateway/client.ts`                                                                    |
| Tick zaman aşımı kapanışı                 | sessizlik `tickIntervalMs * 2` değerini aştığında kod `4000` | `src/gateway/client.ts`                                                             |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Sunucu, etkin `policy.tickIntervalMs`, `policy.maxPayload` ve `policy.maxBufferedBytes` değerlerini `hello-ok` içinde duyurur; istemciler el sıkışma öncesi varsayılanlar yerine bu değerlere uymalıdır.

## Kimlik doğrulama

- Paylaşılan gizli Gateway kimlik doğrulaması, yapılandırılmış kimlik doğrulama moduna bağlı olarak `connect.params.auth.token` veya
  `connect.params.auth.password` kullanır.
- Tailscale Serve gibi kimlik taşıyan modlar
  (`gateway.auth.allowTailscale: true`) veya local loopback olmayan
  `gateway.auth.mode: "trusted-proxy"`, bağlantı kimlik doğrulama denetimini
  `connect.params.auth.*` yerine istek üstbilgilerinden karşılar.
- Özel giriş `gateway.auth.mode: "none"`, paylaşılan gizli bağlantı kimlik
  doğrulamasını tamamen atlar; bu modu herkese açık/güvenilmeyen girişlerde
  açığa çıkarmayın.
- Eşleştirmeden sonra Gateway, bağlantı rolü + kapsamlarıyla sınırlı bir
  **cihaz token'ı** verir. Bu token `hello-ok.auth.deviceToken` içinde döndürülür
  ve gelecekteki bağlantılar için istemci tarafından kalıcı olarak saklanmalıdır.
- İstemciler, başarılı her bağlantıdan sonra birincil `hello-ok.auth.deviceToken`
  değerini kalıcı olarak saklamalıdır.
- Bu **saklanan** cihaz token'ı ile yeniden bağlanmak, o token için saklanan
  onaylı kapsam kümesini de yeniden kullanmalıdır. Bu, daha önce verilmiş olan
  okuma/yoklama/durum erişimini korur ve yeniden bağlantıların sessizce daha dar
  bir örtük yalnızca-yönetici kapsamına düşmesini önler.
- İstemci tarafı bağlantı kimlik doğrulama derlemesi (`selectConnectAuth`,
  `src/gateway/client.ts` içinde):
  - `auth.password` bağımsızdır ve ayarlandığında her zaman iletilir.
  - `auth.token` öncelik sırasına göre doldurulur: önce açık paylaşılan token,
    ardından açık bir `deviceToken`, ardından saklanan cihaz başına token
    (`deviceId` + `role` ile anahtarlanmış).
  - `auth.bootstrapToken` yalnızca yukarıdakilerden hiçbiri bir `auth.token`
    çözümlemediğinde gönderilir. Paylaşılan token veya çözümlenmiş herhangi bir
    cihaz token'ı bunu bastırır.
  - Tek seferlik `AUTH_TOKEN_MISMATCH` yeniden denemesinde saklanan cihaz token'ının
    otomatik yükseltilmesi **yalnızca güvenilir uç noktalarla** sınırlıdır:
    loopback veya sabitlenmiş `tlsFingerprint` ile `wss://`. Sabitleme olmadan
    herkese açık `wss://` bu koşulu karşılamaz.
- Ek `hello-ok.auth.deviceTokens` girdileri bootstrap devir token'larıdır.
  Bunları yalnızca bağlantı, `wss://` veya loopback/yerel eşleştirme gibi
  güvenilir bir aktarım üzerinde bootstrap kimlik doğrulaması kullandığında
  kalıcı olarak saklayın.
- Bir istemci **açık** bir `deviceToken` veya açık `scopes` sağlarsa, çağıranın
  istediği bu kapsam kümesi yetkili kalır; önbelleğe alınmış kapsamlar yalnızca
  istemci saklanan cihaz başına token'ı yeniden kullandığında yeniden kullanılır.
- Cihaz token'ları `device.token.rotate` ve `device.token.revoke` aracılığıyla
  döndürülebilir/iptal edilebilir (`operator.pairing` kapsamı gerektirir).
- `device.token.rotate`, döndürme meta verilerini döndürür. Yedek taşıyıcı token'ı
  yalnızca zaten o cihaz token'ı ile kimliği doğrulanmış aynı cihaz çağrıları için
  yankılar; böylece yalnızca-token kullanan istemciler yeniden bağlanmadan önce
  yedeklerini kalıcı olarak saklayabilir. Paylaşılan/yönetici döndürmeleri taşıyıcı
  token'ı yankılamaz.
- Token verme, döndürme ve iptal etme işlemleri, ilgili cihazın eşleştirme
  girdisinde kaydedilen onaylı rol kümesiyle sınırlı kalır; token değişikliği,
  eşleştirme onayının hiç vermediği bir cihaz rolünü genişletemez veya hedefleyemez.
- Eşleştirilmiş cihaz token oturumlarında, çağıranın ayrıca `operator.admin`
  yetkisi yoksa cihaz yönetimi kendi kapsamıyla sınırlıdır: yönetici olmayan
  çağıranlar yalnızca **kendi** cihaz girdilerini kaldırabilir/iptal edebilir/döndürebilir.
- `device.token.rotate` ve `device.token.revoke`, hedef operatör token kapsam
  kümesini çağıranın geçerli oturum kapsamlarına göre de denetler. Yönetici
  olmayan çağıranlar, zaten sahip olduklarından daha geniş bir operatör token'ını
  döndüremez veya iptal edemez.
- Kimlik doğrulama hataları `error.details.code` ve kurtarma ipuçlarını içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilir istemciler, önbelleğe alınmış cihaz başına token ile sınırlı tek bir yeniden deneme yapabilir.
  - Bu yeniden deneme başarısız olursa, istemciler otomatik yeniden bağlantı döngülerini durdurmalı ve operatör eylem rehberliğini göstermelidir.

## Cihaz kimliği + eşleştirme

- Node'lar, anahtar çifti parmak izinden türetilen kararlı bir cihaz kimliği
  (`device.id`) içermelidir.
- Gateway'ler cihaz + rol başına token verir.
- Yerel otomatik onay etkin değilse yeni cihaz kimlikleri için eşleştirme onayları gerekir.
- Eşleştirme otomatik onayı, doğrudan local loopback bağlantılarına odaklanır.
- OpenClaw ayrıca güvenilir paylaşılan gizli yardımcı akışları için dar bir
  arka uç/kapsayıcı-yerel kendi kendine bağlantı yoluna sahiptir.
- Aynı ana makine tailnet veya LAN bağlantıları eşleştirme için yine de uzak
  olarak ele alınır ve onay gerektirir.
- WS istemcileri normalde `connect` sırasında `device` kimliğini içerir (operatör +
  node). Cihazsız operatör istisnaları yalnızca açık güven yollarıdır:
  - Yalnızca localhost güvensiz HTTP uyumluluğu için `gateway.controlUi.allowInsecureAuth=true`.
  - Başarılı `gateway.auth.mode: "trusted-proxy"` operatör Control UI kimlik doğrulaması.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (acil durum, ciddi güvenlik düşüşü).
  - Paylaşılan Gateway token'ı/parolasıyla kimliği doğrulanmış doğrudan-loopback
    `gateway-client` arka uç RPC'leri.
- Tüm bağlantılar, sunucunun sağladığı `connect.challenge` tek kullanımlık değerini imzalamalıdır.

### Cihaz kimlik doğrulama geçiş tanıları

Hâlâ zorlama öncesi imzalama davranışını kullanan eski istemciler için `connect` artık
kararlı bir `error.details.reason` ile `error.details.code` altında `DEVICE_AUTH_*`
ayrıntı kodları döndürür.

Yaygın geçiş hataları:

| Mesaj                       | details.code                     | details.reason           | Anlam                                              |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | İstemci `device.nonce` değerini atladı (veya boş gönderdi). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | İstemci eski/yanlış tek kullanımlık değerle imzaladı. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | İmza yükü v2 yüküyle eşleşmiyor.                  |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | İmzalanan zaman damgası izin verilen sapmanın dışında. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`, genel anahtar parmak iziyle eşleşmiyor. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Genel anahtar biçimi/kanonikleştirmesi başarısız oldu. |

Geçiş hedefi:

- Her zaman `connect.challenge` değerini bekleyin.
- Sunucu tek kullanımlık değerini içeren v2 yükünü imzalayın.
- Aynı tek kullanımlık değeri `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza yükü `v3` olup, cihaz/istemci/rol/kapsamlar/token/tek kullanımlık değer
  alanlarına ek olarak `platform` ve `deviceFamily` değerlerini bağlar.
- Eski `v2` imzaları uyumluluk için kabul edilmeye devam eder, ancak yeniden
  bağlantıda komut politikasını eşleştirilmiş cihaz meta verisi sabitlemesi denetlemeye devam eder.

## TLS + sabitleme

- WS bağlantıları için TLS desteklenir.
- İstemciler isteğe bağlı olarak Gateway sertifika parmak izini sabitleyebilir
  (`gateway.tls` yapılandırmasına ve `gateway.remote.tlsFingerprint` veya CLI
  `--tls-fingerprint` seçeneğine bakın).

## Kapsam

Bu protokol **tam Gateway API'sini** açığa çıkarır (durum, kanallar, modeller,
sohbet, ajan, oturumlar, node'lar, onaylar vb.). Kesin yüzey,
`src/gateway/protocol/schema.ts` içindeki TypeBox şemalarıyla tanımlanır.

## İlgili

- [Köprü protokolü](/tr/gateway/bridge-protocol)
- [Gateway işletim kılavuzu](/tr/gateway)
