---
read_when:
    - Gateway WS istemcilerini uygulama veya güncelleme
    - Protokol uyuşmazlıklarını veya bağlantı başarısızlıklarını hata ayıklama
    - Protokol şemasını/modellerini yeniden oluşturma
summary: 'Gateway WebSocket protokolü: el sıkışma, çerçeveler, sürümleme'
title: Gateway Protokolü
x-i18n:
    generated_at: "2026-04-17T08:52:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f0eebcfdd8c926c90b4753a6d96c59e3134ddb91740f65478f11eb75be85e41
    source_path: gateway/protocol.md
    workflow: 15
---

# Gateway protokolü (WebSocket)

Gateway WS protokolü, OpenClaw için **tek denetim düzlemi + düğüm taşımasıdır**.
Tüm istemciler (CLI, web UI, macOS uygulaması, iOS/Android düğümleri, başsız
düğümler) WebSocket üzerinden bağlanır ve el sıkışma sırasında **rollerini** +
**kapsamlarını** bildirir.

## Taşıma

- WebSocket, JSON yükleri içeren metin çerçeveleri.
- İlk çerçeve **mutlaka** bir `connect` isteği olmalıdır.

## El sıkışma (`connect`)

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
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot` ve `policy` şema tarafından zorunludur
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` isteğe bağlıdır. `auth`,
mevcut olduğunda uzlaşılan rolü/kapsamları bildirir ve Gateway bir `deviceToken`
verdiğinde bunu da içerir.

Bir cihaz token'ı verilmediğinde, `hello-ok.auth` yine de uzlaşılan
izinleri bildirebilir:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Bir cihaz token'ı verildiğinde, `hello-ok` ayrıca şunları da içerir:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilir önyükleme devri sırasında, `hello-ok.auth` `deviceTokens` içinde ek
sınırlı rol girdileri de içerebilir:

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

Yerleşik düğüm/operatör önyükleme akışında, birincil düğüm token'ı
`scopes: []` olarak kalır ve devredilen herhangi bir operatör token'ı
önyükleme operatörü izin listesiyle sınırlı kalır (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Önyükleme kapsam denetimleri rol
önekli kalır: operatör girdileri yalnızca operatör isteklerini karşılar ve
operatör dışı roller yine de kendi rol önekleri altındaki kapsamları gerektirir.

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

Yan etki oluşturan yöntemler **idempotency key** gerektirir (şemaya bakın).

## Roller + kapsamlar

### Roller

- `operator` = denetim düzlemi istemcisi (CLI/UI/otomasyon).
- `node` = yetenek barındırıcısı (kamera/ekran/canvas/system.run).

### Kapsamlar (`operator`)

Yaygın kapsamlar:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` ile `talk.config`, `operator.talk.secrets`
(veya `operator.admin`) gerektirir.

Plugin tarafından kaydedilen Gateway RPC yöntemleri kendi operatör kapsamlarını
isteyebilir, ancak ayrılmış çekirdek yönetici önekleri (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) her zaman `operator.admin` olarak çözülür.

Yöntem kapsamı yalnızca ilk geçittir. `chat.send` üzerinden ulaşılan bazı
slash komutları bunun üzerinde daha sıkı komut düzeyi denetimleri uygular. Örneğin,
kalıcı `/config set` ve `/config unset` yazmaları `operator.admin` gerektirir.

`node.pair.approve`, temel yöntem kapsamına ek olarak onay sırasında ek bir
kapsam denetimi de içerir:

- komutsuz istekler: `operator.pairing`
- exec olmayan düğüm komutları içeren istekler: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which` içeren istekler:
  `operator.pairing` + `operator.admin`

### Yetenekler/komutlar/izinler (`node`)

Düğümler bağlantı sırasında yetenek iddialarını bildirir:

- `caps`: üst düzey yetenek kategorileri.
- `commands`: invoke için komut izin listesi.
- `permissions`: ayrıntılı anahtarlar (ör. `screen.record`, `camera.capture`).

Gateway bunları **iddialar** olarak ele alır ve sunucu tarafı izin listelerini uygular.

## Varlık durumu

- `system-presence`, cihaz kimliğine göre anahtarlanmış girdiler döndürür.
- Varlık durumu girdileri `deviceId`, `roles` ve `scopes` içerir; böylece UI'lar,
  hem **operator** hem de **node** olarak bağlanan bir cihaz için tek satır gösterebilir.

## Yaygın RPC yöntem aileleri

Bu sayfa, oluşturulmuş tam bir döküm değildir; ancak genel WS yüzeyi yukarıdaki
el sıkışma/yetkilendirme örneklerinden daha geniştir. Bunlar, Gateway'in bugün
sunduğu başlıca yöntem aileleridir.

`hello-ok.features.methods`, `src/gateway/server-methods-list.ts` ile yüklenmiş
plugin/kanal yöntem dışa aktarımlarından oluşturulan temkinli bir keşif listesidir.
Bunu özellik keşfi olarak değerlendirin; `src/gateway/server-methods/*.ts` içinde
uygulanan her çağrılabilir yardımcı için oluşturulmuş bir döküm olarak değil.

### Sistem ve kimlik

- `health`, önbelleğe alınmış veya yeni yoklanmış Gateway sağlık anlık görüntüsünü döndürür.
- `status`, `/status` tarzı Gateway özetini döndürür; hassas alanlar yalnızca
  admin kapsamlı operatör istemcilerine dahil edilir.
- `gateway.identity.get`, relay ve eşleştirme akışlarında kullanılan Gateway cihaz kimliğini döndürür.
- `system-presence`, bağlı operatör/düğüm cihazları için geçerli varlık durumu anlık görüntüsünü döndürür.
- `system-event`, bir sistem olayı ekler ve varlık durumu bağlamını güncelleyip/yayınlayabilir.
- `last-heartbeat`, kalıcı hale getirilen en son Heartbeat olayını döndürür.
- `set-heartbeats`, Gateway üzerinde Heartbeat işlemeyi açıp kapatır.

### Modeller ve kullanım

- `models.list`, çalışma zamanında izin verilen model kataloğunu döndürür.
- `usage.status`, sağlayıcı kullanım pencereleri/kalan kota özetlerini döndürür.
- `usage.cost`, bir tarih aralığı için toplu maliyet kullanımı özetlerini döndürür.
- `doctor.memory.status`, etkin varsayılan aracı çalışma alanı için
  vektör belleği / embedding hazırlık durumunu döndürür.
- `sessions.usage`, oturum başına kullanım özetlerini döndürür.
- `sessions.usage.timeseries`, bir oturum için zaman serisi kullanımını döndürür.
- `sessions.usage.logs`, bir oturum için kullanım günlük girdilerini döndürür.

### Kanallar ve giriş yardımcıları

- `channels.status`, yerleşik + paketlenmiş kanal/plugin durum özetlerini döndürür.
- `channels.logout`, çıkışı destekleyen kanallarda belirli bir kanal/hesap oturumunu kapatır.
- `web.login.start`, mevcut QR destekli web kanal sağlayıcısı için bir QR/web giriş akışı başlatır.
- `web.login.wait`, bu QR/web giriş akışının tamamlanmasını bekler ve başarılı olursa
  kanalı başlatır.
- `push.test`, kayıtlı bir iOS düğümüne test APNs bildirimi gönderir.
- `voicewake.get`, depolanan uyandırma sözcüğü tetikleyicilerini döndürür.
- `voicewake.set`, uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayınlar.

### Mesajlaşma ve günlükler

- `send`, sohbet çalıştırıcısı dışındaki kanal/hesap/iş parçacığı hedefli
  gönderimler için doğrudan giden teslim RPC'sidir.
- `logs.tail`, yapılandırılmış Gateway dosya günlüğü kuyruğunu imleç/sınır ve
  en fazla bayt denetimleriyle döndürür.

### Talk ve TTS

- `talk.config`, etkin Talk yapılandırma yükünü döndürür; `includeSecrets`,
  `operator.talk.secrets` (veya `operator.admin`) gerektirir.
- `talk.mode`, WebChat/Control UI istemcileri için geçerli Talk modu durumunu ayarlar/yayınlar.
- `talk.speak`, etkin Talk konuşma sağlayıcısı üzerinden konuşma sentezler.
- `tts.status`, TTS etkinlik durumu, etkin sağlayıcı, yedek sağlayıcılar
  ve sağlayıcı yapılandırma durumunu döndürür.
- `tts.providers`, görünür TTS sağlayıcı envanterini döndürür.
- `tts.enable` ve `tts.disable`, TTS tercih durumunu açıp kapatır.
- `tts.setProvider`, tercih edilen TTS sağlayıcısını günceller.
- `tts.convert`, tek seferlik metinden konuşmaya dönüştürme çalıştırır.

### Gizli anahtarlar, yapılandırma, güncelleme ve sihirbaz

- `secrets.reload`, etkin SecretRef'leri yeniden çözümler ve çalışma zamanı gizli durumunu
  yalnızca tam başarı durumunda değiştirir.
- `secrets.resolve`, belirli bir komut/hedef kümesi için komut hedefli gizli anahtar atamalarını çözümler.
- `config.get`, geçerli yapılandırma anlık görüntüsünü ve hash'ini döndürür.
- `config.set`, doğrulanmış bir yapılandırma yükü yazar.
- `config.patch`, kısmi bir yapılandırma güncellemesini birleştirir.
- `config.apply`, tam yapılandırma yükünü doğrular + değiştirir.
- `config.schema`, Control UI ve CLI araçları tarafından kullanılan canlı yapılandırma
  şeması yükünü döndürür: şema, `uiHints`, sürüm ve üretim meta verileri; çalışma zamanı
  yükleyebildiğinde plugin + kanal şema meta verileri de buna dahildir. Şema,
  UI tarafından kullanılan etiketler ve yardım metniyle aynı kaynaklardan türetilen
  alan `title` / `description` meta verilerini içerir; buna eşleşen alan
  belgeleri bulunduğunda iç içe nesne, joker karakter, dizi öğesi ve
  `anyOf` / `oneOf` / `allOf` bileşim dalları da dahildir.
- `config.schema.lookup`, tek bir yapılandırma yolu için yol kapsamlı arama yükü döndürür:
  normalleştirilmiş yol, sığ bir şema düğümü, eşleşen ipucu + `hintPath` ve
  UI/CLI ayrıntı incelemesi için doğrudan alt öğe özetleri.
  - Arama şeması düğümleri kullanıcıya yönelik belgeleri ve yaygın doğrulama alanlarını korur:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    sayısal/dize/dizi/nesne sınırları ve
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi boolean bayraklar.
  - Alt öğe özetleri `key`, normalleştirilmiş `path`, `type`, `required`,
    `hasChildren` ve eşleşen `hint` / `hintPath` alanlarını sunar.
- `update.run`, Gateway güncelleme akışını çalıştırır ve yalnızca
  güncellemenin kendisi başarılı olduğunda yeniden başlatma planlar.
- `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`,
  ilk kurulum sihirbazını WS RPC üzerinden sunar.

### Mevcut başlıca aileler

#### Aracı ve çalışma alanı yardımcıları

- `agents.list`, yapılandırılmış aracı girdilerini döndürür.
- `agents.create`, `agents.update` ve `agents.delete`, aracı kayıtlarını ve
  çalışma alanı bağlantılarını yönetir.
- `agents.files.list`, `agents.files.get` ve `agents.files.set`, bir aracı için
  sunulan önyükleme çalışma alanı dosyalarını yönetir.
- `agent.identity.get`, bir aracı veya oturum için etkin asistan kimliğini döndürür.
- `agent.wait`, bir çalışmanın tamamlanmasını bekler ve mevcut olduğunda son durum anlık görüntüsünü döndürür.

#### Oturum denetimi

- `sessions.list`, geçerli oturum dizinini döndürür.
- `sessions.subscribe` ve `sessions.unsubscribe`, geçerli WS istemcisi için
  oturum değişikliği olay aboneliklerini açıp kapatır.
- `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`,
  tek bir oturum için transcript/mesaj olay aboneliklerini açıp kapatır.
- `sessions.preview`, belirli oturum anahtarları için sınırlı transcript
  önizlemeleri döndürür.
- `sessions.resolve`, bir oturum hedefini çözümler veya kanonik hale getirir.
- `sessions.create`, yeni bir oturum girdisi oluşturur.
- `sessions.send`, mevcut bir oturuma mesaj gönderir.
- `sessions.steer`, etkin bir oturum için kesip yönlendirme varyantıdır.
- `sessions.abort`, bir oturum için etkin çalışmayı durdurur.
- `sessions.patch`, oturum meta verilerini/geçersiz kılmalarını günceller.
- `sessions.reset`, `sessions.delete` ve `sessions.compact`, oturum
  bakım işlemlerini gerçekleştirir.
- `sessions.get`, depolanan tam oturum satırını döndürür.
- sohbet yürütme hâlâ `chat.history`, `chat.send`, `chat.abort` ve
  `chat.inject` kullanır.
- `chat.history`, UI istemcileri için görüntüleme-normalleştirilmiştir: satır içi yönerge etiketleri
  görünür metinden çıkarılır, düz metin araç-çağrısı XML yükleri (şunlar dahil:
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve
  kısaltılmış araç-çağrısı blokları) ile sızmış ASCII/tam genişlikte model denetim belirteçleri
  çıkarılır, tam olarak `NO_REPLY` /
  `no_reply` olan salt sessiz-belirteç asistan satırları atlanır ve
  aşırı büyük satırlar yer tutucularla değiştirilebilir.

#### Cihaz eşleştirme ve cihaz token'ları

- `device.pair.list`, bekleyen ve onaylanmış eşleştirilmiş cihazları döndürür.
- `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`,
  cihaz eşleştirme kayıtlarını yönetir.
- `device.token.rotate`, eşleştirilmiş bir cihaz token'ını onaylı rolü
  ve kapsam sınırları içinde döndürür.
- `device.token.revoke`, eşleştirilmiş bir cihaz token'ını geçersiz kılar.

#### Düğüm eşleştirme, invoke ve bekleyen işler

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` ve `node.pair.verify`, düğüm eşleştirme ve önyükleme
  doğrulamasını kapsar.
- `node.list` ve `node.describe`, bilinen/bağlı düğüm durumunu döndürür.
- `node.rename`, eşleştirilmiş bir düğüm etiketini günceller.
- `node.invoke`, bir komutu bağlı bir düğüme iletir.
- `node.invoke.result`, bir invoke isteği için sonucu döndürür.
- `node.event`, düğüm kaynaklı olayları tekrar Gateway'e taşır.
- `node.canvas.capability.refresh`, kapsamlı canvas yetenek token'larını yeniler.
- `node.pending.pull` ve `node.pending.ack`, bağlı düğüm kuyruk API'leridir.
- `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısı kesilmiş
  düğümler için kalıcı bekleyen işleri yönetir.

#### Onay aileleri

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve
  `exec.approval.resolve`, tek seferlik exec onay isteklerini ve bekleyen
  onay arama/yeniden oynatma akışlarını kapsar.
- `exec.approval.waitDecision`, bekleyen bir exec onayında karar bekler ve
  son kararı döndürür (veya zaman aşımında `null`).
- `exec.approvals.get` ve `exec.approvals.set`, Gateway exec onay
  ilkesi anlık görüntülerini yönetir.
- `exec.approvals.node.get` ve `exec.approvals.node.set`, düğüm yerel exec
  onay ilkesini düğüm relay komutları aracılığıyla yönetir.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` ve `plugin.approval.resolve`,
  Plugin tanımlı onay akışlarını kapsar.

#### Diğer başlıca aileler

- otomasyon:
  - `wake`, hemen veya bir sonraki Heartbeat sırasında uyandırma metni eklemeyi zamanlar
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/araçlar: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Yaygın olay aileleri

- `chat`: `chat.inject` ve diğer yalnızca transcript içeren sohbet
  olayları gibi UI sohbet güncellemeleri.
- `session.message` ve `session.tool`: abone olunmuş bir oturum için transcript/olay akışı güncellemeleri.
- `sessions.changed`: oturum dizini veya meta veriler değişti.
- `presence`: sistem varlık durumu anlık görüntüsü güncellemeleri.
- `tick`: periyodik keepalive / canlılık olayı.
- `health`: Gateway sağlık anlık görüntüsü güncellemesi.
- `heartbeat`: Heartbeat olay akışı güncellemesi.
- `cron`: Cron çalıştırma/iş değişikliği olayı.
- `shutdown`: Gateway kapanma bildirimi.
- `node.pair.requested` / `node.pair.resolved`: düğüm eşleştirme yaşam döngüsü.
- `node.invoke.request`: düğüm invoke istek yayını.
- `device.pair.requested` / `device.pair.resolved`: eşleştirilmiş cihaz yaşam döngüsü.
- `voicewake.changed`: uyandırma sözcüğü tetikleyici yapılandırması değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onay
  yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin onayı
  yaşam döngüsü.

### Düğüm yardımcı yöntemleri

- Düğümler, otomatik izin denetimleri için geçerli skill çalıştırılabilirleri listesini
  almak üzere `skills.bins` çağırabilir.

### Operatör yardımcı yöntemleri

- Operatörler, bir aracı için çalışma zamanı komut envanterini almak üzere
  `commands.list` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan aracı çalışma alanını okumak için bunu atlayın.
  - `scope`, birincil `name` hedefinin hangi yüzeyi kullandığını denetler:
    - `text`, başında `/` olmadan birincil metin komut belirtecini döndürür
    - `native` ve varsayılan `both` yolu, mevcut olduğunda sağlayıcıya duyarlı doğal adları döndürür
  - `textAliases`, `/model` ve `/m` gibi tam slash takma adlarını taşır.
  - `nativeName`, mevcut olduğunda sağlayıcıya duyarlı doğal komut adını taşır.
  - `provider` isteğe bağlıdır ve yalnızca doğal adlandırma ile doğal Plugin
    komut kullanılabilirliğini etkiler.
  - `includeArgs=false`, yanıttan serileştirilmiş argüman meta verilerini çıkarır.
- Operatörler, bir aracı için çalışma zamanı araç kataloğunu almak üzere
  `tools.catalog` (`operator.read`) çağırabilir. Yanıt, gruplanmış araçları ve kaynak meta verilerini içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda Plugin sahibi
  - `optional`: bir Plugin aracının isteğe bağlı olup olmadığı
- Operatörler, bir oturum için çalışma zamanında etkin araç
  envanterini almak üzere `tools.effective` (`operator.read`) çağırabilir.
  - `sessionKey` gereklidir.
  - Gateway, çağıran tarafından sağlanan
    yetkilendirme veya teslim bağlamını kabul etmek yerine güvenilir çalışma zamanı bağlamını oturumdan sunucu tarafında türetir.
  - Yanıt oturum kapsamlıdır ve etkin konuşmanın şu anda kullanabildiklerini yansıtır;
    buna çekirdek, Plugin ve kanal araçları dahildir.
- Operatörler, bir aracı için görünür skill envanterini almak üzere
  `skills.status` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan aracı çalışma alanını okumak için bunu atlayın.
  - Yanıt; uygunluk, eksik gereksinimler, yapılandırma denetimleri ve
    ham gizli değerleri açığa çıkarmadan temizlenmiş kurulum seçeneklerini içerir.
- Operatörler, ClawHub keşif meta verileri için
  `skills.search` ve `skills.detail` (`operator.read`) çağırabilir.
- Operatörler, `skills.install` (`operator.admin`) yöntemini iki kipte çağırabilir:
  - ClawHub kipi: `{ source: "clawhub", slug, version?, force? }`, bir
    skill klasörünü varsayılan aracı çalışma alanı `skills/` dizinine kurar.
  - Gateway kurucu kipi: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    Gateway ana bilgisayarında bildirilen bir `metadata.openclaw.install` eylemini çalıştırır.
- Operatörler, `skills.update` (`operator.admin`) yöntemini iki kipte çağırabilir:
  - ClawHub kipi, varsayılan aracı çalışma alanında izlenen tek bir slug'ı
    veya tüm izlenen ClawHub kurulumlarını günceller.
  - Config kipi, `enabled`,
    `apiKey` ve `env` gibi `skills.entries.<skillKey>` değerlerini yamalar.

## Exec onayları

- Bir exec isteği onay gerektirdiğinde, Gateway `exec.approval.requested` yayınlar.
- Operatör istemcileri `exec.approval.resolve` çağırarak çözümleme yapar (`operator.approvals` kapsamı gerektirir).
- `host=node` için `exec.approval.request`, `systemRunPlan` içermelidir (kanonik `argv`/`cwd`/`rawCommand`/oturum meta verileri). `systemRunPlan` içermeyen istekler reddedilir.
- Onaydan sonra, iletilen `node.invoke system.run` çağrıları yetkili
  komut/cwd/oturum bağlamı olarak bu kanonik `systemRunPlan`'ı yeniden kullanır.
- Bir çağıran, hazırlık ile son onaylanmış `system.run` iletimi arasında
  `command`, `rawCommand`, `cwd`, `agentId` veya
  `sessionKey` değerlerini değiştirirse, Gateway değiştirilmiş yüke güvenmek yerine
  çalıştırmayı reddeder.

## Aracı teslim yedeği

- `agent` istekleri, giden teslim talep etmek için `deliver=true` içerebilir.
- `bestEffortDeliver=false`, katı davranışı korur: çözümlenmemiş veya yalnızca dahili teslim hedefleri `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici teslim edilebilir rota çözümlenemediğinde
  oturumla sınırlı yürütmeye yedek geçişe izin verir (örneğin dahili/webchat oturumları veya belirsiz çok kanallı yapılandırmalar).

## Sürümleme

- `PROTOCOL_VERSION`, `src/gateway/protocol/schema/protocol-schemas.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu uyuşmazlıkları reddeder.
- Şemalar + modeller TypeBox tanımlarından oluşturulur:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### İstemci sabitleri

`src/gateway/client.ts` içindeki referans istemci bu varsayılanları kullanır. Değerler
protokol v3 boyunca kararlıdır ve üçüncü taraf istemciler için beklenen taban çizgisidir.

| Sabit | Varsayılan | Kaynak |
| --- | --- | --- |
| `PROTOCOL_VERSION` | `3` | `src/gateway/protocol/schema/protocol-schemas.ts` |
| İstek zaman aşımı (RPC başına) | `30_000` ms | `src/gateway/client.ts` (`requestTimeoutMs`) |
| Ön yetkilendirme / connect-challenge zaman aşımı | `10_000` ms | `src/gateway/handshake-timeouts.ts` (sıkıştırma `250`–`10_000`) |
| İlk yeniden bağlanma backoff'u | `1_000` ms | `src/gateway/client.ts` (`backoffMs`) |
| En büyük yeniden bağlanma backoff'u | `30_000` ms | `src/gateway/client.ts` (`scheduleReconnect`) |
| Cihaz token'ı kapanışından sonra hızlı yeniden deneme sıkıştırması | `250` ms | `src/gateway/client.ts` |
| `terminate()` öncesi zorla durdurma bekleme süresi | `250` ms | `FORCE_STOP_TERMINATE_GRACE_MS` |
| `stopAndWait()` varsayılan zaman aşımı | `1_000` ms | `STOP_AND_WAIT_TIMEOUT_MS` |
| Varsayılan tick aralığı (önce `hello-ok`) | `30_000` ms | `src/gateway/client.ts` |
| Tick zaman aşımı kapanışı | sessizlik `tickIntervalMs * 2` değerini aştığında kod `4000` | `src/gateway/client.ts` |
| `MAX_PAYLOAD_BYTES` | `25 * 1024 * 1024` (25 MB) | `src/gateway/server-constants.ts` |

Sunucu, etkin `policy.tickIntervalMs`, `policy.maxPayload` ve `policy.maxBufferedBytes`
değerlerini `hello-ok` içinde bildirir; istemciler el sıkışma öncesi varsayılanlar yerine
bu değerlere uymalıdır.

## Yetkilendirme

- Paylaşılan gizli anahtar kullanan Gateway yetkilendirmesi, yapılandırılmış yetkilendirme kipine bağlı olarak `connect.params.auth.token` veya
  `connect.params.auth.password` kullanır.
- Tailscale Serve
  (`gateway.auth.allowTailscale: true`) veya loopback olmayan
  `gateway.auth.mode: "trusted-proxy"` gibi kimlik taşıyan kipler, bağlanma yetkilendirme denetimini
  `connect.params.auth.*` yerine istek üstbilgilerinden karşılar.
- Özel girişte `gateway.auth.mode: "none"`, paylaşılan gizli anahtar bağlantı yetkilendirmesini tamamen atlar; bu kipi herkese açık/güvenilmeyen girişlerde açığa çıkarmayın.
- Eşleştirmeden sonra Gateway, bağlantı rolü + kapsamlarına göre sınırlanmış bir **cihaz token'ı** verir. Bu değer `hello-ok.auth.deviceToken` içinde döndürülür ve istemci tarafından gelecekteki bağlantılar için kalıcı olarak saklanmalıdır.
- İstemciler, başarılı her bağlantıdan sonra birincil `hello-ok.auth.deviceToken` değerini kalıcı olarak saklamalıdır.
- Saklanan bu **cihaz token'ı** ile yeniden bağlanırken, bu token için saklanan onaylı kapsam kümesi de yeniden kullanılmalıdır. Bu, zaten verilmiş okuma/yoklama/durum erişimini korur ve yeniden bağlantıların sessizce daha dar, örtük bir yalnızca yönetici kapsamına düşmesini önler.
- İstemci tarafı bağlantı yetkilendirme derlemesi (`src/gateway/client.ts` içindeki `selectConnectAuth`):
  - `auth.password` ortogonaldir ve ayarlandığında her zaman iletilir.
  - `auth.token` şu öncelik sırasına göre doldurulur: önce açık paylaşılan token,
    sonra açık bir `deviceToken`, sonra ise saklanan cihaz başına token (`deviceId` + `role` ile anahtarlanır).
  - `auth.bootstrapToken`, yalnızca yukarıdakilerin hiçbiri bir
    `auth.token` çözümlemediğinde gönderilir. Paylaşılan bir token veya çözümlemiş herhangi bir cihaz token'ı bunu bastırır.
  - Tek seferlik `AUTH_TOKEN_MISMATCH` yeniden denemesinde saklanan bir cihaz token'ının otomatik olarak yükseltilmesi yalnızca **güvenilir uç noktalar** için geçerlidir —
    loopback veya sabitlenmiş `tlsFingerprint` içeren `wss://`. Sabitleme olmadan herkese açık `wss://`
    buna dahil değildir.
- Ek `hello-ok.auth.deviceTokens` girdileri, önyükleme devri token'larıdır.
  Bunları yalnızca bağlantı, `wss://` veya loopback/yerel eşleştirme gibi güvenilir bir taşıma üzerinde önyükleme yetkilendirmesi kullandığında kalıcı olarak saklayın.
- Bir istemci açık bir `deviceToken` veya açık `scopes` sağlarsa, çağıranın istediği bu kapsam kümesi belirleyici olmaya devam eder; önbelleğe alınmış kapsamlar yalnızca istemci saklanan cihaz başına token'ı yeniden kullanıyorsa yeniden kullanılır.
- Cihaz token'ları `device.token.rotate` ve
  `device.token.revoke` ile döndürülebilir/geçersiz kılınabilir (`operator.pairing` kapsamı gerektirir).
- Token verme/döndürme, o cihazın eşleştirme girdisinde kaydedilen onaylı rol kümesiyle sınırlı kalır; bir token'ı döndürmek, cihazı eşleştirme onayının hiç vermediği bir role genişletemez.
- Eşleştirilmiş cihaz token oturumları için cihaz yönetimi, çağıranın ayrıca `operator.admin` yetkisi yoksa kendisiyle sınırlıdır: yönetici olmayan çağıranlar yalnızca **kendi** cihaz girdilerini kaldırabilir/geçersiz kılabilir/döndürebilir.
- `device.token.rotate`, istenen operatör kapsam kümesini de çağıranın mevcut oturum kapsamlarına göre denetler. Yönetici olmayan çağıranlar, bir token'ı hâlihazırda sahip olduklarından daha geniş bir operatör kapsam kümesine döndüremez.
- Yetkilendirme hataları `error.details.code` ile birlikte kurtarma ipuçları içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilir istemciler, önbelleğe alınmış cihaz başına bir token ile sınırlı tek bir yeniden deneme yapabilir.
  - Bu yeniden deneme başarısız olursa, istemciler otomatik yeniden bağlanma döngülerini durdurmalı ve operatör eylemi yönlendirmesini göstermelidir.

## Cihaz kimliği + eşleştirme

- Düğümler, anahtar çifti parmak izinden türetilmiş kararlı bir cihaz kimliği (`device.id`) içermelidir.
- Gateway'ler cihaz + rol başına token verir.
- Yerel otomatik onay etkin değilse, yeni cihaz kimlikleri için eşleştirme onayları gerekir.
- Eşleştirme otomatik onayı, doğrudan yerel local loopback bağlantılarına odaklanır.
- OpenClaw ayrıca güvenilir paylaşılan gizli anahtar yardımcı akışları için dar bir arka uç/kapsayıcı yerel self-connect yoluna sahiptir.
- Aynı ana makinedeki tailnet veya LAN bağlantıları yine de uzak kabul edilir ve eşleştirme onayı gerektirir.
- Tüm WS istemcileri `connect` sırasında `device` kimliği içermelidir (`operator` + `node`).
  Control UI bunu yalnızca şu kiplerde atlayabilir:
  - yalnızca localhost üzerinde güvensiz HTTP uyumluluğu için `gateway.controlUi.allowInsecureAuth=true`.
  - başarılı `gateway.auth.mode: "trusted-proxy"` operatör Control UI yetkilendirmesi.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (acil durum, ciddi güvenlik düşüşü).
- Tüm bağlantılar, sunucu tarafından sağlanan `connect.challenge` nonce değerini imzalamalıdır.

### Cihaz yetkilendirme geçiş tanılamaları

Hâlâ challenge öncesi imzalama davranışını kullanan eski istemciler için, `connect` artık
`error.details.code` altında kararlı bir `error.details.reason` ile `DEVICE_AUTH_*` ayrıntı kodları döndürür.

Yaygın geçiş hataları:

| Mesaj | details.code | details.reason | Anlamı |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required` | `DEVICE_AUTH_NONCE_REQUIRED` | `device-nonce-missing` | İstemci `device.nonce` değerini atladı (veya boş gönderdi). |
| `device nonce mismatch` | `DEVICE_AUTH_NONCE_MISMATCH` | `device-nonce-mismatch` | İstemci eski/yanlış bir nonce ile imzaladı. |
| `device signature invalid` | `DEVICE_AUTH_SIGNATURE_INVALID` | `device-signature` | İmza yükü v2 yüküyle eşleşmiyor. |
| `device signature expired` | `DEVICE_AUTH_SIGNATURE_EXPIRED` | `device-signature-stale` | İmzalanmış zaman damgası izin verilen kaymanın dışında. |
| `device identity mismatch` | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch` | `device.id`, açık anahtar parmak iziyle eşleşmiyor. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key` | Açık anahtar biçimi/kanonikleştirmesi başarısız oldu. |

Geçiş hedefi:

- Her zaman `connect.challenge` bekleyin.
- Sunucu nonce değerini içeren v2 yükünü imzalayın.
- Aynı nonce değerini `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza yükü `v3` sürümüdür; bu sürüm cihaz/istemci/rol/kapsam/token/nonce alanlarına ek olarak `platform` ve `deviceFamily` alanlarını da bağlar.
- Eski `v2` imzaları uyumluluk için kabul edilmeye devam eder, ancak eşleştirilmiş cihaz meta veri sabitlemesi yeniden bağlanmada komut ilkesini denetlemeye devam eder.

## TLS + sabitleme

- WS bağlantıları için TLS desteklenir.
- İstemciler isteğe bağlı olarak Gateway sertifika parmak izini sabitleyebilir (`gateway.tls`
  yapılandırması ile birlikte `gateway.remote.tlsFingerprint` veya CLI `--tls-fingerprint` seçeneğine bakın).

## Kapsam

Bu protokol **tam Gateway API**'sini açığa çıkarır (durum, kanallar, modeller, sohbet,
aracı, oturumlar, düğümler, onaylar vb.). Kesin yüzey, `src/gateway/protocol/schema.ts` içindeki
TypeBox şemaları tarafından tanımlanır.
