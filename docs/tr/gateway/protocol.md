---
read_when:
    - Gateway WS istemcilerini uygulama veya güncelleme
    - Protokol uyuşmazlıklarında veya bağlantı hatalarında hata ayıklama
    - Protokol şemasını ve modellerini yeniden oluşturma
summary: 'Gateway WebSocket protokolü: el sıkışma, çerçeveler, sürümleme'
title: Gateway protokolü
x-i18n:
    generated_at: "2026-05-02T20:45:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc8bd6bae485f13bbd0e8762d30abdfab7e2aee635f8ebac1a38798493239798
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protokolü, OpenClaw için **tek kontrol düzlemi + Node taşımasıdır**.
Tüm istemciler (CLI, web UI, macOS uygulaması, iOS/Android Node’ları, başsız
Node’lar) WebSocket üzerinden bağlanır ve el sıkışma sırasında **rollerini** +
**kapsamlarını** bildirir.

## Taşıma

- WebSocket, JSON yükleri içeren metin çerçeveleri.
- İlk çerçeve **mutlaka** bir `connect` isteği olmalıdır.
- Bağlantı öncesi çerçeveler 64 KiB ile sınırlandırılır. Başarılı bir el
  sıkışmadan sonra istemciler `hello-ok.policy.maxPayload` ve
  `hello-ok.policy.maxBufferedBytes` sınırlarını izlemelidir. Tanılama etkinken,
  aşırı büyük gelen çerçeveler ve yavaş giden arabellekler, gateway etkilenen
  çerçeveyi kapatmadan veya düşürmeden önce `payload.large` olayları yayar. Bu
  olaylar boyutları, sınırları, yüzeyleri ve güvenli neden kodlarını tutar. Mesaj
  gövdesini, ek içeriklerini, ham çerçeve gövdesini, token’ları, cookie’leri veya
  gizli değerleri tutmaz.

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

Gateway hâlâ başlangıç sidecar’larını bitirirken, `connect` isteği
`details.reason` değeri `"startup-sidecars"` olarak ayarlanmış ve `retryAfterMs`
içeren yeniden denenebilir bir `UNAVAILABLE` hatası döndürebilir. İstemciler bu
yanıtı terminal bir el sıkışma hatası olarak göstermek yerine genel bağlantı
bütçeleri içinde yeniden denemelidir.

`server`, `features`, `snapshot` ve `policy` şema tarafından zorunlu tutulur
(`src/gateway/protocol/schema/frames.ts`). `auth` da zorunludur ve üzerinde
anlaşılan rol/kapsamları bildirir. `canvasHostUrl` isteğe bağlıdır.

Cihaz token’ı verilmediğinde, `hello-ok.auth` token alanları olmadan üzerinde
anlaşılan izinleri bildirir:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilir aynı süreç arka uç istemcileri (`client.id: "gateway-client"`,
`client.mode: "backend"`), paylaşılan gateway token/parolasıyla kimlik
doğruladıklarında doğrudan loopback bağlantılarında `device` alanını atlayabilir.
Bu yol dahili kontrol düzlemi RPC’leri için ayrılmıştır ve eski CLI/cihaz
eşleştirme taban çizgilerinin alt aracı oturum güncellemeleri gibi yerel arka
uç işlerini engellemesini önler. Uzak istemciler, tarayıcı kökenli istemciler,
Node istemcileri ve açık cihaz token’ı/cihaz kimliği istemcileri normal
eşleştirme ve kapsam yükseltme kontrollerini kullanmaya devam eder.

Cihaz token’ı verildiğinde, `hello-ok` şunu da içerir:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilir bootstrap devri sırasında, `hello-ok.auth` `deviceTokens` içinde ek
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

Yerleşik Node/operatör bootstrap akışı için birincil Node token’ı
`scopes: []` olarak kalır ve devredilen herhangi bir operatör token’ı bootstrap
operatör izin listesiyle (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`) sınırlı kalır. Bootstrap kapsam
kontrolleri rol önekli kalır: operatör girdileri yalnızca operatör isteklerini
karşılar ve operatör olmayan rollerin yine kendi rol önekleri altında kapsamları
olmalıdır.

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

Yan etki oluşturan yöntemler **idempotency key’leri** gerektirir (şemaya bakın).

## Roller + kapsamlar

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

`includeSecrets: true` ile `talk.config`, `operator.talk.secrets`
(veya `operator.admin`) gerektirir.

Plugin tarafından kaydedilen gateway RPC yöntemleri kendi operatör kapsamlarını
isteyebilir, ancak ayrılmış çekirdek yönetici önekleri (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) her zaman `operator.admin` olarak
çözümlenir.

Yöntem kapsamı yalnızca ilk kapıdır. `chat.send` üzerinden ulaşılan bazı slash
komutları bunun üstüne daha sıkı komut düzeyi kontroller uygular. Örneğin,
kalıcı `/config set` ve `/config unset` yazmaları `operator.admin` gerektirir.

`node.pair.approve`, temel yöntem kapsamının üstüne ek bir onay zamanı kapsamı
kontrolüne de sahiptir:

- komutsuz istekler: `operator.pairing`
- exec dışı Node komutları içeren istekler: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which` içeren istekler:
  `operator.pairing` + `operator.admin`

### Yetenekler/komutlar/izinler (Node)

Node’lar bağlantı sırasında yetenek iddialarını bildirir:

- `caps`: üst düzey yetenek kategorileri.
- `commands`: invoke için komut izin listesi.
- `permissions`: ayrıntılı aç/kapat seçenekleri (örn. `screen.record`, `camera.capture`).

Gateway bunları **iddia** olarak ele alır ve sunucu tarafı izin listelerini uygular.

## Varlık

- `system-presence`, cihaz kimliğine göre anahtarlanmış girdiler döndürür.
- Varlık girdileri `deviceId`, `roles` ve `scopes` içerir; böylece UI’lar bir cihaz
  hem **operator** hem de **node** olarak bağlansa bile cihaz başına tek satır gösterebilir.
- `node.list`, isteğe bağlı `lastSeenAtMs` ve `lastSeenReason` alanlarını içerir. Bağlı Node’lar
  mevcut bağlantı zamanlarını `connect` nedeniyle `lastSeenAtMs` olarak bildirir; eşlenmiş Node’lar,
  güvenilir bir Node olayı eşleştirme meta verilerini güncellediğinde kalıcı arka plan varlığı da bildirebilir.

### Node arka plan canlı olayı

Node’lar, eşlenmiş bir Node’un bağlı olarak işaretlenmeden arka plan uyanışı sırasında
canlı olduğunu kaydetmek için `event: "node.presence.alive"` ile `node.event` çağırabilir.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` kapalı bir enum’dur: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` veya `connect`. Bilinmeyen trigger dizeleri,
kalıcılıktan önce gateway tarafından `background` olarak normalleştirilir. Olay yalnızca kimliği
doğrulanmış Node cihaz oturumları için kalıcıdır; cihazsız veya eşlenmemiş oturumlar `handled: false` döndürür.

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
kalıcı varlık saklama olarak değil, onaylanmış bir RPC olarak değerlendirmelidir.

## Yayın olayı kapsamlandırma

Sunucudan itilen WebSocket yayın olayları kapsam kapılıdır; böylece eşleştirme kapsamlı veya yalnızca Node oturumları oturum içeriğini pasif olarak almaz.

- **Chat, aracı ve araç sonucu çerçeveleri** (akışlanan `agent` olayları ve araç çağrısı sonuçları dahil) en az `operator.read` gerektirir. `operator.read` olmayan oturumlar bu çerçeveleri tamamen atlar.
- **Plugin tanımlı `plugin.*` yayınları**, Plugin’in bunları nasıl kaydettiğine bağlı olarak `operator.write` veya `operator.admin` ile kapılanır.
- **Durum ve taşıma olayları** (`heartbeat`, `presence`, `tick`, bağlanma/bağlantı kesme yaşam döngüsü vb.) kısıtlanmadan kalır; böylece taşıma sağlığı her kimliği doğrulanmış oturum tarafından gözlemlenebilir.
- **Bilinmeyen yayın olayı aileleri**, kayıtlı bir işleyici bunları açıkça gevşetmediği sürece varsayılan olarak kapsam kapılıdır (kapalı kalma).

Her istemci bağlantısı kendi istemci başına sıra numarasını tutar; böylece farklı istemciler olay akışının farklı kapsam filtreli alt kümelerini görse bile yayınlar o sokette monoton sıralamayı korur.

## Yaygın RPC yöntem aileleri

Genel WS yüzeyi yukarıdaki el sıkışma/kimlik doğrulama örneklerinden daha
geniştir. Bu oluşturulmuş bir döküm değildir — `hello-ok.features.methods`,
`src/gateway/server-methods-list.ts` ile yüklü Plugin/kanal yöntem dışa
aktarımlarından oluşturulan muhafazakâr bir keşif listesidir. Bunu
`src/gateway/server-methods/*.ts` için tam bir listeleme olarak değil, özellik
keşfi olarak değerlendirin.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health`, önbelleğe alınmış veya yeni yoklanmış gateway sağlık anlık görüntüsünü döndürür.
    - `diagnostics.stability`, yakın tarihli sınırlandırılmış tanılama kararlılığı kaydedicisini döndürür. Olay adları, sayımlar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/Plugin adları ve oturum kimlikleri gibi operasyonel meta verileri tutar. Chat metnini, Webhook gövdelerini, araç çıktılarını, ham istek veya yanıt gövdelerini, token’ları, cookie’leri veya gizli değerleri tutmaz. Operatör okuma kapsamı gereklidir.
    - `status`, `/status` tarzı gateway özetini döndürür; hassas alanlar yalnızca admin kapsamlı operatör istemcileri için dahil edilir.
    - `gateway.identity.get`, relay ve eşleştirme akışları tarafından kullanılan gateway cihaz kimliğini döndürür.
    - `system-presence`, bağlı operatör/Node cihazları için mevcut varlık anlık görüntüsünü döndürür.
    - `system-event`, bir sistem olayı ekler ve varlık bağlamını güncelleyebilir/yayınlayabilir.
    - `last-heartbeat`, en son kalıcı Heartbeat olayını döndürür.
    - `set-heartbeats`, gateway üzerinde Heartbeat işlemeyi açıp kapatır.

  </Accordion>

  <Accordion title="Modeller ve kullanım">
    - `models.list`, çalışma zamanında izin verilen model kataloğunu döndürür. Seçici boyutundaki yapılandırılmış modeller için (`agents.defaults.models` önce, ardından `models.providers.*.models`) `{ "view": "configured" }`, tam katalog için ise `{ "view": "all" }` iletin.
    - `usage.status`, sağlayıcı kullanım pencerelerini/kalan kota özetlerini döndürür.
    - `usage.cost`, bir tarih aralığı için birleştirilmiş maliyet kullanımı özetlerini döndürür.
    - `doctor.memory.status`, etkin varsayılan ajan çalışma alanı için vektör belleği / önbelleğe alınmış embedding hazır olma durumunu döndürür. Yalnızca çağıran açıkça canlı embedding sağlayıcı ping'i istediğinde `{ "probe": true }` veya `{ "deep": true }` iletin.
    - `doctor.memory.remHarness`, uzak kontrol düzlemi istemcileri için sınırlı, salt okunur bir REM harness önizlemesi döndürür. Çalışma alanı yolları, bellek parçacıkları, işlenmiş temellendirilmiş markdown ve derin yükseltme adayları içerebilir; bu nedenle çağıranların `operator.read` yetkisine ihtiyacı vardır.
    - `sessions.usage`, oturum başına kullanım özetlerini döndürür.
    - `sessions.usage.timeseries`, bir oturum için zaman serisi kullanımını döndürür.
    - `sessions.usage.logs`, bir oturum için kullanım günlük girdilerini döndürür.

  </Accordion>

  <Accordion title="Kanallar ve oturum açma yardımcıları">
    - `channels.status`, yerleşik + paketlenmiş kanal/Plugin durum özetlerini döndürür.
    - `channels.logout`, kanal çıkış yapmayı destekliyorsa belirli bir kanal/hesaptan çıkış yapar.
    - `web.login.start`, geçerli QR destekli web kanal sağlayıcısı için QR/web oturum açma akışını başlatır.
    - `web.login.wait`, bu QR/web oturum açma akışının tamamlanmasını bekler ve başarılı olursa kanalı başlatır.
    - `push.test`, kayıtlı bir iOS node'una test APNs push bildirimi gönderir.
    - `voicewake.get`, saklanan uyandırma sözcüğü tetikleyicilerini döndürür.
    - `voicewake.set`, uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayınlar.

  </Accordion>

  <Accordion title="Mesajlaşma ve günlükler">
    - `send`, sohbet çalıştırıcısı dışında kanal/hesap/iş parçacığı hedefli gönderimler için doğrudan dışa teslim RPC'sidir.
    - `logs.tail`, imleç/sınır ve maksimum bayt kontrolleriyle yapılandırılmış Gateway dosya günlüğü kuyruğunu döndürür.

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

  <Accordion title="Gizli değerler, yapılandırma, güncelleme ve sihirbaz">
    - `secrets.reload`, etkin SecretRef'leri yeniden çözer ve çalışma zamanı gizli değer durumunu yalnızca tam başarı durumunda değiştirir.
    - `secrets.resolve`, belirli bir komut/hedef kümesi için komut hedefli gizli değer atamalarını çözer.
    - `config.get`, geçerli yapılandırma anlık görüntüsünü ve hash'i döndürür.
    - `config.set`, doğrulanmış bir yapılandırma yükü yazar.
    - `config.patch`, kısmi bir yapılandırma güncellemesini birleştirir.
    - `config.apply`, tam yapılandırma yükünü doğrular + değiştirir.
    - `config.schema`, Control UI ve CLI araçları tarafından kullanılan canlı yapılandırma şeması yükünü döndürür: şema, `uiHints`, sürüm ve üretim meta verileri; çalışma zamanı yükleyebildiğinde Plugin + kanal şeması meta verileri dahil. Şema, eşleşen alan belgeleri mevcut olduğunda iç içe nesne, wildcard, dizi öğesi ve `anyOf` / `oneOf` / `allOf` bileşim dalları dahil olmak üzere, UI tarafından kullanılan aynı etiketlerden ve yardım metninden türetilmiş alan `title` / `description` meta verilerini içerir.
    - `config.schema.lookup`, bir yapılandırma yolu için yol kapsamlı bir arama yükü döndürür: normalleştirilmiş yol, sığ bir şema düğümü, eşleşen ipucu + `hintPath` ve UI/CLI ayrıntı incelemesi için hemen alt özetler. Arama şeması düğümleri kullanıcıya yönelik belgeleri ve yaygın doğrulama alanlarını (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, sayısal/dize/dizi/nesne sınırları ve `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi bayraklar) korur. Alt özetler `key`, normalleştirilmiş `path`, `type`, `required`, `hasChildren` ve eşleşen `hint` / `hintPath` değerlerini gösterir.
    - `update.run`, Gateway güncelleme akışını çalıştırır ve yeniden başlatmayı yalnızca güncellemenin kendisi başarılı olduğunda zamanlar. Paket yöneticisi güncellemeleri, paket değişiminden sonra ertelemesiz, bekleme süresiz bir güncelleme yeniden başlatmasını zorunlu kılar; böylece eski Gateway süreci değiştirilmiş bir `dist` ağacından tembel yüklemeye devam etmez.
    - `update.status`, kullanılabilir olduğunda yeniden başlatma sonrası çalışan sürüm dahil, en son önbelleğe alınmış güncelleme yeniden başlatma sentinel'ini döndürür.
    - `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`, onboarding sihirbazını WS RPC üzerinden sunar.

  </Accordion>

  <Accordion title="Ajan ve çalışma alanı yardımcıları">
    - `agents.list`, etkin model ve çalışma zamanı meta verileri dahil yapılandırılmış ajan girdilerini döndürür.
    - `agents.create`, `agents.update` ve `agents.delete`, ajan kayıtlarını ve çalışma alanı bağlantılarını yönetir.
    - `agents.files.list`, `agents.files.get` ve `agents.files.set`, bir ajan için sunulan bootstrap çalışma alanı dosyalarını yönetir.
    - `artifacts.list`, `artifacts.get` ve `artifacts.download`, açık bir `sessionKey`, `runId` veya `taskId` kapsamı için transkriptten türetilmiş artifact özetlerini ve indirmeleri sunar. Çalıştırma ve görev sorguları sahip oturumu sunucu tarafında çözer ve yalnızca eşleşen provenansa sahip transkript medyasını döndürür; güvenli olmayan veya yerel URL kaynakları sunucu tarafında getirilmek yerine desteklenmeyen indirmeler döndürür.
    - `agent.identity.get`, bir ajan veya oturum için etkin asistan kimliğini döndürür.
    - `agent.wait`, bir çalıştırmanın bitmesini bekler ve kullanılabilir olduğunda terminal anlık görüntüsünü döndürür.

  </Accordion>

  <Accordion title="Oturum denetimi">
    - `sessions.list`, bir ajan çalışma zamanı arka ucu yapılandırıldığında satır başına `agentRuntime` meta verileri dahil geçerli oturum indeksini döndürür.
    - `sessions.subscribe` ve `sessions.unsubscribe`, geçerli WS istemcisi için oturum değişikliği etkinliği aboneliklerini açıp kapatır.
    - `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`, bir oturum için transkript/mesaj etkinliği aboneliklerini açıp kapatır.
    - `sessions.preview`, belirli oturum anahtarları için sınırlı transkript önizlemeleri döndürür.
    - `sessions.describe`, tam bir oturum anahtarı için bir Gateway oturum satırı döndürür.
    - `sessions.resolve`, bir oturum hedefini çözer veya kanonikleştirir.
    - `sessions.create`, yeni bir oturum girdisi oluşturur.
    - `sessions.send`, mevcut bir oturuma mesaj gönderir.
    - `sessions.steer`, etkin bir oturum için kes ve yönlendir varyantıdır.
    - `sessions.abort`, bir oturum için etkin işi iptal eder. Çağıran `key` ile birlikte isteğe bağlı `runId` iletebilir veya Gateway'in bir oturuma çözebildiği etkin çalıştırmalar için yalnızca `runId` iletebilir.
    - `sessions.patch`, oturum meta verilerini/geçersiz kılmalarını günceller ve çözümlenen kanonik modeli artı etkin `agentRuntime` değerini bildirir.
    - `sessions.reset`, `sessions.delete` ve `sessions.compact`, oturum bakımını gerçekleştirir.
    - `sessions.get`, saklanan tam oturum satırını döndürür.
    - Sohbet yürütmesi hâlâ `chat.history`, `chat.send`, `chat.abort` ve `chat.inject` kullanır. `chat.history`, UI istemcileri için gösterim açısından normalleştirilmiştir: satır içi yönerge etiketleri görünür metinden çıkarılır, düz metin araç çağrısı XML yükleri (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kırpılmış araç çağrısı blokları dahil) ve sızmış ASCII/tam genişlikli model kontrol token'ları çıkarılır, tam `NO_REPLY` / `no_reply` gibi salt sessiz token asistan satırları atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir.

  </Accordion>

  <Accordion title="Cihaz eşleştirme ve cihaz token'ları">
    - `device.pair.list`, bekleyen ve onaylanmış eşleştirilmiş cihazları döndürür.
    - `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`, cihaz eşleştirme kayıtlarını yönetir.
    - `device.token.rotate`, eşleştirilmiş bir cihaz token'ını onaylanmış rolü ve çağıran kapsamı sınırları içinde döndürür.
    - `device.token.revoke`, eşleştirilmiş bir cihaz token'ını onaylanmış rolü ve çağıran kapsamı sınırları içinde iptal eder.

  </Accordion>

  <Accordion title="Node eşleştirme, çağırma ve bekleyen iş">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` ve `node.pair.verify`, node eşleştirmeyi ve bootstrap doğrulamasını kapsar.
    - `node.list` ve `node.describe`, bilinen/bağlı node durumunu döndürür.
    - `node.rename`, eşleştirilmiş bir node etiketini günceller.
    - `node.invoke`, bir komutu bağlı bir node'a iletir.
    - `node.invoke.result`, bir çağırma isteğinin sonucunu döndürür.
    - `node.event`, node kaynaklı etkinlikleri Gateway'e geri taşır.
    - `node.canvas.capability.refresh`, kapsamlı canvas-capability token'larını yeniler.
    - `node.pending.pull` ve `node.pending.ack`, bağlı node kuyruk API'leridir.
    - `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısı kesilmiş node'lar için kalıcı bekleyen işi yönetir.

  </Accordion>

  <Accordion title="Onay aileleri">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve `exec.approval.resolve`, tek seferlik exec onay isteklerini ve bekleyen onay arama/yeniden oynatmayı kapsar.
    - `exec.approval.waitDecision`, bekleyen bir exec onayını bekler ve nihai kararı döndürür (veya zaman aşımında `null`).
    - `exec.approvals.get` ve `exec.approvals.set`, Gateway exec onay ilkesi anlık görüntülerini yönetir.
    - `exec.approvals.node.get` ve `exec.approvals.node.set`, node relay komutları üzerinden node yerel exec onay ilkesini yönetir.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` ve `plugin.approval.resolve`, Plugin tanımlı onay akışlarını kapsar.

  </Accordion>

  <Accordion title="Otomasyon, Skills ve araçlar">
    - Otomasyon: `wake`, anında veya bir sonraki Heartbeat'te uyandırma metni enjeksiyonu zamanlar; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zamanlanmış işi yönetir.
    - Skills ve araçlar: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Yaygın etkinlik aileleri

- `chat`: `chat.inject` ve diğer yalnızca transkript sohbet etkinlikleri gibi UI sohbet güncellemeleri.
- `session.message` ve `session.tool`: abone olunan bir oturum için transkript/etkinlik akışı güncellemeleri.
- `sessions.changed`: oturum indeksi veya meta verileri değişti.
- `presence`: sistem varlık anlık görüntüsü güncellemeleri.
- `tick`: periyodik keepalive / canlılık etkinliği.
- `health`: Gateway sağlık anlık görüntüsü güncellemesi.
- `heartbeat`: Heartbeat etkinlik akışı güncellemesi.
- `cron`: cron çalıştırma/iş değişikliği etkinliği.
- `shutdown`: Gateway kapatma bildirimi.
- `node.pair.requested` / `node.pair.resolved`: node eşleştirme yaşam döngüsü.
- `node.invoke.request`: node çağırma isteği yayını.
- `device.pair.requested` / `device.pair.resolved`: eşleştirilmiş cihaz yaşam döngüsü.
- `voicewake.changed`: uyandırma sözcüğü tetikleyici yapılandırması değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onay yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin onay yaşam döngüsü.

### Node yardımcı yöntemleri

- Node'lar, otomatik izin kontrolleri için geçerli skill çalıştırılabilirleri listesini almak üzere `skills.bins` çağırabilir.

### Operatör yardımcı yöntemleri

- Operatörler, bir ajan için çalışma zamanı komut envanterini almak üzere `commands.list` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan ajan çalışma alanını okumak için bunu atlayın.
  - `scope`, birincil `name` değerinin hangi yüzeyi hedeflediğini denetler:
    - `text`, başındaki `/` olmadan birincil metin komutu belirtecini döndürür
    - `native` ve varsayılan `both` yolu, mevcut olduğunda sağlayıcıya duyarlı yerel adları döndürür
  - `textAliases`, `/model` ve `/m` gibi tam eğik çizgili diğer adları taşır.
  - `nativeName`, mevcut olduğunda sağlayıcıya duyarlı yerel komut adını taşır.
  - `provider` isteğe bağlıdır ve yalnızca yerel adlandırmayı ve yerel Plugin komut kullanılabilirliğini etkiler.
  - `includeArgs=false`, yanıttan serileştirilmiş bağımsız değişken meta verilerini çıkarır.
- Operatörler, bir ajan için çalışma zamanı araç kataloğunu almak üzere `tools.catalog` (`operator.read`) çağırabilir. Yanıt, gruplanmış araçları ve köken meta verilerini içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda Plugin sahibi
  - `optional`: bir Plugin aracının isteğe bağlı olup olmadığı
- Operatörler, bir oturum için çalışma zamanında geçerli araç envanterini almak üzere `tools.effective` (`operator.read`) çağırabilir.
  - `sessionKey` zorunludur.
  - Gateway, çağıranın sağladığı kimlik doğrulama veya teslim bağlamını kabul etmek yerine güvenilir çalışma zamanı bağlamını sunucu tarafındaki oturumdan türetir.
  - Yanıt oturum kapsamındadır ve etkin konuşmanın şu anda kullanabileceği çekirdek, Plugin ve kanal araçları dahil olmak üzere her şeyi yansıtır.
- Operatörler, `/tools/invoke` ile aynı Gateway ilke yolu üzerinden kullanılabilir bir aracı çağırmak için `tools.invoke` (`operator.write`) çağırabilir.
  - `name` zorunludur. `args`, `sessionKey`, `agentId`, `confirm` ve `idempotencyKey` isteğe bağlıdır.
  - Hem `sessionKey` hem de `agentId` varsa, çözümlenen oturum ajanı `agentId` ile eşleşmelidir.
  - Yanıt, `ok`, `toolName`, isteğe bağlı `output` ve türlendirilmiş `error` alanlarını içeren SDK odaklı bir zarftır. Onay veya ilke retleri, Gateway araç ilkesi işlem hattını atlamak yerine yük içinde `ok:false` döndürür.
- Operatörler, bir ajan için görünür Skills envanterini almak üzere `skills.status` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan ajan çalışma alanını okumak için bunu atlayın.
  - Yanıt, ham gizli değerleri açığa çıkarmadan uygunluk, eksik gereksinimler, yapılandırma denetimleri ve temizlenmiş kurulum seçeneklerini içerir.
- Operatörler, ClawHub keşif meta verileri için `skills.search` ve `skills.detail` (`operator.read`) çağırabilir.
- Operatörler, iki modda `skills.install` (`operator.admin`) çağırabilir:
  - ClawHub modu: `{ source: "clawhub", slug, version?, force? }`, varsayılan ajan çalışma alanındaki `skills/` dizinine bir Skills klasörü kurar.
  - Gateway kurucu modu: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`, Gateway ana makinesinde bildirilmiş bir `metadata.openclaw.install` eylemi çalıştırır.
- Operatörler, iki modda `skills.update` (`operator.admin`) çağırabilir:
  - ClawHub modu, varsayılan ajan çalışma alanında izlenen tek bir slug'ı veya izlenen tüm ClawHub kurulumlarını günceller.
  - Yapılandırma modu, `enabled`, `apiKey` ve `env` gibi `skills.entries.<skillKey>` değerlerini yamalar.

### `models.list` görünümleri

`models.list`, isteğe bağlı bir `view` parametresi kabul eder:

- Atlanmış veya `"default"`: geçerli çalışma zamanı davranışı. `agents.defaults.models` yapılandırılmışsa yanıt izin verilen katalogdur; aksi halde yanıt tam Gateway kataloğudur.
- `"configured"`: seçici boyutunda davranış. `agents.defaults.models` yapılandırılmışsa yine önceliklidir. Aksi halde yanıt açık `models.providers.*.models` girdilerini kullanır ve yalnızca yapılandırılmış model satırı yoksa tam kataloğa geri döner.
- `"all"`: `agents.defaults.models` değerini atlayarak tam Gateway kataloğu. Bunu normal model seçiciler için değil, tanılama ve keşif kullanıcı arayüzleri için kullanın.

## Exec onayları

- Bir exec isteği onay gerektirdiğinde Gateway `exec.approval.requested` yayınlar.
- Operatör istemcileri `exec.approval.resolve` çağırarak çözer (`operator.approvals` kapsamı gerektirir).
- `host=node` için `exec.approval.request`, `systemRunPlan` içermelidir (standart `argv`/`cwd`/`rawCommand`/oturum meta verileri). `systemRunPlan` eksik olan istekler reddedilir.
- Onaydan sonra iletilen `node.invoke system.run` çağrıları, bu standart `systemRunPlan` değerini yetkili komut/cwd/oturum bağlamı olarak yeniden kullanır.
- Bir çağıran, hazırlık ile son onaylanmış `system.run` iletimi arasında `command`, `rawCommand`, `cwd`, `agentId` veya `sessionKey` değerini değiştirirse Gateway, değiştirilmiş yüke güvenmek yerine çalıştırmayı reddeder.

## Ajan teslim geri dönüşü

- `agent` istekleri, dışa teslim istemek için `deliver=true` içerebilir.
- `bestEffortDeliver=false` sıkı davranışı korur: çözümlenemeyen veya yalnızca dahili teslim hedefleri `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici olarak teslim edilebilir bir rota çözümlenemediğinde oturumla sınırlı yürütmeye geri dönüşe izin verir (örneğin dahili/webchat oturumları veya belirsiz çok kanallı yapılandırmalar).

## Sürümleme

- `PROTOCOL_VERSION`, `src/gateway/protocol/schema/protocol-schemas.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu uyumsuzlukları reddeder.
- Şemalar ve modeller TypeBox tanımlarından üretilir:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### İstemci sabitleri

`src/gateway/client.ts` içindeki referans istemci bu varsayılanları kullanır. Değerler protokol v3 genelinde kararlıdır ve üçüncü taraf istemciler için beklenen taban çizgisidir.

| Sabit                                     | Varsayılan                                            | Kaynak                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| İstek zaman aşımı (RPC başına)            | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Ön kimlik doğrulama / bağlantı-sınaması zaman aşımı | `15_000` ms                                  | `src/gateway/handshake-timeouts.ts` (config/env eşleştirilmiş sunucu/istemci bütçesini artırabilir) |
| İlk yeniden bağlanma geri çekilmesi       | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| En yüksek yeniden bağlanma geri çekilmesi | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Cihaz belirteci kapanışından sonra hızlı yeniden deneme sınırı | `250` ms                              | `src/gateway/client.ts`                                                                    |
| `terminate()` öncesi zorla durdurma ek süresi | `250` ms                                           | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` varsayılan zaman aşımı    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Varsayılan tick aralığı (`hello-ok` öncesi) | `30_000` ms                                         | `src/gateway/client.ts`                                                                    |
| Tick zaman aşımı kapanışı                 | sessizlik `tickIntervalMs * 2` değerini aştığında kod `4000` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Sunucu, etkili `policy.tickIntervalMs`, `policy.maxPayload` ve `policy.maxBufferedBytes` değerlerini `hello-ok` içinde duyurur; istemciler, el sıkışma öncesi varsayılanlar yerine bu değerlere uymalıdır.

## Kimlik doğrulama

- Paylaşılan gizli Gateway kimlik doğrulaması, yapılandırılmış auth moduna bağlı olarak `connect.params.auth.token` veya
  `connect.params.auth.password` kullanır.
- Tailscale Serve
  (`gateway.auth.allowTailscale: true`) veya non-loopback
  `gateway.auth.mode: "trusted-proxy"` gibi kimlik taşıyan modlar, connect auth kontrolünü
  `connect.params.auth.*` yerine istek başlıklarından karşılar.
- Özel giriş `gateway.auth.mode: "none"`, paylaşılan gizli connect auth işlemini
  tamamen atlar; bu modu herkese açık/güvenilmeyen girişlerde kullanıma açmayın.
- Eşleştirmeden sonra Gateway, bağlantı
  rolü + kapsamlarıyla sınırlı bir **cihaz belirteci** verir. `hello-ok.auth.deviceToken` içinde döndürülür ve
  gelecekteki bağlantılar için istemci tarafından kalıcı olarak saklanmalıdır.
- İstemciler, başarılı herhangi bir connect işleminden sonra birincil `hello-ok.auth.deviceToken` değerini kalıcı olarak saklamalıdır.
- Bu **saklanan** cihaz belirteciyle yeniden bağlanmak, o belirteç için saklanan
  onaylı kapsam kümesini de yeniden kullanmalıdır. Bu, önceden verilmiş
  okuma/yoklama/durum erişimini korur ve yeniden bağlantıların sessizce daha dar
  örtük yalnızca yönetici kapsamına düşmesini önler.
- İstemci tarafı connect auth derlemesi (`selectConnectAuth`,
  `src/gateway/client.ts` içinde):
  - `auth.password` bağımsızdır ve ayarlandığında her zaman iletilir.
  - `auth.token` öncelik sırasına göre doldurulur: önce açık paylaşılan belirteç,
    sonra açık bir `deviceToken`, ardından saklanan cihaz başına belirteç (`deviceId` + `role` ile
    anahtarlanır).
  - `auth.bootstrapToken` yalnızca yukarıdakilerin hiçbiri bir
    `auth.token` çözümlemediğinde gönderilir. Paylaşılan belirteç veya çözümlenen herhangi bir cihaz belirteci bunu bastırır.
  - Tek seferlik `AUTH_TOKEN_MISMATCH` yeniden denemesinde saklanan cihaz belirtecinin
    otomatik yükseltilmesi **yalnızca güvenilir uç noktalarla** sınırlıdır:
    loopback veya sabitlenmiş `tlsFingerprint` ile `wss://`. Sabitleme olmayan herkese açık `wss://`
    uygun sayılmaz.
- Ek `hello-ok.auth.deviceTokens` girdileri bootstrap devir belirteçleridir.
  Bunları yalnızca connect, `wss://` veya loopback/local eşleştirme gibi
  güvenilir bir taşıma üzerinde bootstrap auth kullandığında kalıcı olarak saklayın.
- Bir istemci **açık** `deviceToken` veya açık `scopes` sağlarsa, çağıranın talep ettiği
  kapsam kümesi yetkili kalır; önbelleğe alınmış kapsamlar yalnızca
  istemci saklanan cihaz başına belirteci yeniden kullandığında yeniden kullanılır.
- Cihaz belirteçleri `device.token.rotate` ve
  `device.token.revoke` ile döndürülebilir/iptal edilebilir (`operator.pairing` kapsamı gerektirir).
- `device.token.rotate`, döndürme meta verilerini döndürür. Yerine geçen
  taşıyıcı belirteci yalnızca aynı cihazdan gelen ve zaten o cihaz belirteciyle kimliği doğrulanmış
  çağrılar için geri yansıtır; böylece yalnızca belirteç kullanan istemciler yeniden
  bağlanmadan önce yerine geçen değeri kalıcı olarak saklayabilir. Paylaşılan/yönetici döndürmeleri taşıyıcı belirteci geri yansıtmaz.
- Belirteç verme, döndürme ve iptal işlemleri, ilgili cihazın eşleştirme girdisinde
  kaydedilmiş onaylı rol kümesiyle sınırlı kalır; belirteç değişikliği,
  eşleştirme onayının hiç vermediği bir cihaz rolünü genişletemez veya hedefleyemez.
- Eşleştirilmiş cihaz belirteci oturumlarında cihaz yönetimi, çağıranın
  `operator.admin` yetkisi de yoksa kendi kapsamıyla sınırlıdır: yönetici olmayan çağıranlar yalnızca
  **kendi** cihaz girdilerini kaldırabilir/iptal edebilir/döndürebilir.
- `device.token.rotate` ve `device.token.revoke`, hedef operator
  belirteç kapsam kümesini çağıranın geçerli oturum kapsamlarına karşı da kontrol eder. Yönetici olmayan çağıranlar,
  zaten sahip olduklarından daha geniş bir operator belirtecini döndüremez veya iptal edemez.
- Auth hataları `error.details.code` ve kurtarma ipuçları içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilir istemciler, önbelleğe alınmış cihaz başına belirteçle tek bir sınırlı yeniden deneme yapabilir.
  - Bu yeniden deneme başarısız olursa, istemciler otomatik yeniden bağlanma döngülerini durdurmalı ve operator eylem rehberliğini göstermelidir.

## Cihaz kimliği + eşleştirme

- Node'lar, anahtar çifti parmak izinden türetilmiş kararlı bir cihaz kimliği (`device.id`) içermelidir.
- Gateway'ler, cihaz + rol başına belirteç verir.
- Yerel otomatik onay etkin değilse yeni cihaz ID'leri için eşleştirme onayları gerekir.
- Eşleştirme otomatik onayı, doğrudan local loopback bağlantılarına odaklanır.
- OpenClaw ayrıca güvenilir paylaşılan gizli yardımcı akışları için dar kapsamlı bir backend/container-local kendi kendine bağlanma yoluna sahiptir.
- Aynı makinedeki tailnet veya LAN bağlantıları, eşleştirme açısından yine uzak kabul edilir ve onay gerektirir.
- WS istemcileri normalde `connect` sırasında `device` kimliği içerir (operator +
  node). Cihazsız tek operator istisnaları açık güven yollarıdır:
  - Yalnızca localhost güvensiz HTTP uyumluluğu için `gateway.controlUi.allowInsecureAuth=true`.
  - Başarılı `gateway.auth.mode: "trusted-proxy"` operator Control UI auth.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (son çare, ciddi güvenlik düşüşü).
  - Paylaşılan gateway belirteci/parolasıyla kimliği doğrulanan doğrudan-loopback `gateway-client` backend RPC'leri.
- Tüm bağlantılar, sunucunun sağladığı `connect.challenge` nonce değerini imzalamalıdır.

### Cihaz auth geçiş tanılamaları

Hâlâ challenge öncesi imzalama davranışını kullanan eski istemciler için `connect` artık
kararlı bir `error.details.reason` ile `error.details.code` altında
`DEVICE_AUTH_*` ayrıntı kodları döndürür.

Yaygın geçiş hataları:

| Mesaj                       | details.code                     | details.reason           | Anlam                                              |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | İstemci `device.nonce` değerini atladı (veya boş gönderdi). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | İstemci eski/yanlış nonce ile imzaladı.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | İmza yükü v2 yüküyle eşleşmiyor.                   |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | İmzalı zaman damgası izin verilen sapmanın dışında. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`, ortak anahtar parmak iziyle eşleşmiyor. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Ortak anahtar biçimi/kanonikleştirmesi başarısız oldu. |

Geçiş hedefi:

- Her zaman `connect.challenge` bekleyin.
- Sunucu nonce değerini içeren v2 yükünü imzalayın.
- Aynı nonce değerini `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza yükü `v3` olur; bu yük device/client/role/scopes/token/nonce alanlarına ek olarak
  `platform` ve `deviceFamily` değerlerini bağlar.
- Eski `v2` imzaları uyumluluk için kabul edilmeye devam eder, ancak eşleştirilmiş cihaz
  meta veri sabitlemesi yeniden bağlantıda komut politikasını yine de kontrol eder.

## TLS + sabitleme

- WS bağlantıları için TLS desteklenir.
- İstemciler isteğe bağlı olarak gateway sertifika parmak izini sabitleyebilir (`gateway.tls`
  yapılandırmasına ve `gateway.remote.tlsFingerprint` veya CLI `--tls-fingerprint` değerine bakın).

## Kapsam

Bu protokol **tam gateway API'sini** (durum, kanallar, modeller, sohbet,
agent, oturumlar, node'lar, onaylar vb.) kullanıma açar. Tam yüzey,
`src/gateway/protocol/schema.ts` içindeki TypeBox şemaları tarafından tanımlanır.

## İlgili

- [Köprü protokolü](/tr/gateway/bridge-protocol)
- [Gateway runbook](/tr/gateway)
