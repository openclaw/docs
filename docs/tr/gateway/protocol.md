---
read_when:
    - Gateway WS istemcileri uygulanıyor veya güncelleniyor
    - Protokol uyuşmazlıkları veya bağlantı hataları ayıklanıyor
    - Protokol şeması/modelleri yeniden oluşturuluyor
summary: 'Gateway WebSocket protokolü: el sıkışma, çerçeveler, sürümleme'
title: Gateway Protokolü
x-i18n:
    generated_at: "2026-04-22T04:22:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6efa76f5f0faa6c10a8515b0cf457233e48551e3484a605dffaf6459ddff9231
    source_path: gateway/protocol.md
    workflow: 15
---

# Gateway protokolü (WebSocket)

Gateway WS protokolü, OpenClaw için **tek kontrol düzlemi + Node taşımasıdır**.
Tüm istemciler (CLI, web UI, macOS uygulaması, iOS/Android Node'ları, headless
Node'lar) WebSocket üzerinden bağlanır ve el sıkışma sırasında **rollerini** + **kapsamlarını**
bildirir.

## Taşıma

- WebSocket, JSON yükleriyle metin çerçeveleri.
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
mevcut olduğunda müzakere edilen rolü/kapsamları bildirir ve gateway bir tane
yayınladığında `deviceToken` içerir.

Cihaz token'ı yayınlanmadığında, `hello-ok.auth` yine de müzakere edilen
izinleri bildirebilir:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Bir cihaz token'ı yayınlandığında, `hello-ok` ayrıca şunu içerir:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilir bootstrap devretmesi sırasında `hello-ok.auth`, `deviceTokens`
içinde ek sınırlı rol girişleri de içerebilir:

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

Yerleşik node/operator bootstrap akışında, birincil Node token'ı
`scopes: []` olarak kalır ve devredilen tüm operator token'ları bootstrap
operator izin listesiyle sınırlı kalır (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap kapsam denetimleri rol
önekli kalır: operator girişleri yalnızca operator isteklerini karşılar ve
operator olmayan roller yine de kendi rol önekleri altındaki kapsamları gerektirir.

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

Yan etki oluşturan yöntemler **idempotency key** gerektirir (şemaya bakın).

## Roller + kapsamlar

### Roller

- `operator` = kontrol düzlemi istemcisi (CLI/UI/otomasyon).
- `node` = yetenek barındırıcısı (`camera`/`screen`/`canvas`/`system.run`).

### Kapsamlar (`operator`)

Yaygın kapsamlar:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` içinde `includeSecrets: true`, `operator.talk.secrets`
(veya `operator.admin`) gerektirir.

Plugin tarafından kaydedilmiş gateway RPC yöntemleri kendi operator kapsamlarını
isteyebilir, ancak ayrılmış çekirdek yönetici önekleri (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) her zaman `operator.admin` olarak çözülür.

Yöntem kapsamı yalnızca ilk geçittir. `chat.send` üzerinden ulaşılan bazı
slash komutları bunun üzerine daha katı komut düzeyi denetimler uygular. Örneğin
kalıcı `/config set` ve `/config unset` yazmaları `operator.admin` gerektirir.

`node.pair.approve` ayrıca temel yöntem kapsamının üzerinde ek bir onay anı kapsam
denetimine sahiptir:

- komutsuz istekler: `operator.pairing`
- exec olmayan Node komutları içeren istekler: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which` içeren istekler:
  `operator.pairing` + `operator.admin`

### `caps`/`commands`/`permissions` (`node`)

Node'lar bağlantı sırasında yetenek beyanlarını bildirir:

- `caps`: yüksek düzey yetenek kategorileri.
- `commands`: invoke için komut izin listesi.
- `permissions`: ayrıntılı anahtarlar (ör. `screen.record`, `camera.capture`).

Gateway bunları **beyanlar** olarak ele alır ve sunucu tarafı izin listelerini uygular.

## Varlık

- `system-presence`, cihaz kimliğine göre anahtarlanmış girdiler döndürür.
- Presence girdileri `deviceId`, `roles` ve `scopes` içerir; böylece UI'ler bir cihaz
  hem **operator** hem de **node** olarak bağlandığında bile cihaz başına tek satır gösterebilir.

## Yayın olay kapsamlaması

Sunucu tarafından itilen WebSocket yayın olayları kapsam geçidiyle korunur; böylece pairing kapsamlı veya yalnızca Node oturumları oturum içeriğini pasif olarak almaz.

- **Chat, ajan ve araç sonucu çerçeveleri** (akışlı `agent` olayları ve araç çağrısı sonuçları dahil) en az `operator.read` gerektirir. `operator.read` olmayan oturumlar bu çerçeveleri tamamen atlar.
- **Plugin tanımlı `plugin.*` yayınları**, plugin'in bunları nasıl kaydettiğine bağlı olarak `operator.write` veya `operator.admin` ile geçitlenir.
- **Durum ve taşıma olayları** (`heartbeat`, `presence`, `tick`, connect/disconnect yaşam döngüsü vb.) her kimliği doğrulanmış oturum için taşıma sağlığı gözlemlenebilir kalsın diye kısıtlanmaz.
- **Bilinmeyen yayın olay aileleri**, kayıtlı bir işleyici bunu açıkça gevşetmedikçe varsayılan olarak kapsam geçidiyle korunur (başarısızlıkta kapalı).

Her istemci bağlantısı kendi istemci başına sıra numarasını tutar; böylece farklı istemciler olay akışının kapsamla filtrelenmiş farklı alt kümelerini görse bile yayınlar o sokette monoton sıralamayı korur.

## Yaygın RPC yöntem aileleri

Bu sayfa oluşturulmuş tam bir döküm değildir, ancak genel WS yüzeyi yukarıdaki
el sıkışma/kimlik doğrulama örneklerinden daha geniştir. Bunlar Gateway'in bugün
sunduğu başlıca yöntem aileleridir.

`hello-ok.features.methods`, `src/gateway/server-methods-list.ts` ile yüklenmiş
plugin/kanal yöntem dışa aktarımlarından oluşturulmuş muhafazakâr bir keşif listesidir.
Bunu özellik keşfi olarak değerlendirin; `src/gateway/server-methods/*.ts` içinde
uygulanmış çağrılabilir tüm yardımcıların oluşturulmuş bir dökümü olarak değil.

### Sistem ve kimlik

- `health`, önbelleğe alınmış veya yeni yoklanmış gateway sağlık anlık görüntüsünü döndürür.
- `status`, `/status` tarzı gateway özetini döndürür; hassas alanlar
  yalnızca admin kapsamlı operator istemcilerine dahil edilir.
- `gateway.identity.get`, relay ve pairing akışlarında kullanılan gateway cihaz
  kimliğini döndürür.
- `system-presence`, bağlı operator/node cihazları için geçerli presence anlık
  görüntüsünü döndürür.
- `system-event`, bir sistem olayı ekler ve presence bağlamını
  güncelleyebilir/yayınlayabilir.
- `last-heartbeat`, en son kalıcı Heartbeat olayını döndürür.
- `set-heartbeats`, gateway üzerinde Heartbeat işlemeyi açıp kapatır.

### Modeller ve kullanım

- `models.list`, çalışma zamanında izin verilen model kataloğunu döndürür.
- `usage.status`, sağlayıcı kullanım pencerelerini/kalan kota özetlerini döndürür.
- `usage.cost`, bir tarih aralığı için toplu maliyet kullanım özetlerini döndürür.
- `doctor.memory.status`, etkin varsayılan ajan çalışma alanı için vektör bellek / embedding hazır olma durumunu döndürür.
- `sessions.usage`, oturum başına kullanım özetlerini döndürür.
- `sessions.usage.timeseries`, bir oturum için zaman serisi kullanımını döndürür.
- `sessions.usage.logs`, bir oturum için kullanım günlüğü girdilerini döndürür.

### Kanallar ve oturum açma yardımcıları

- `channels.status`, yerleşik + paketlenmiş kanal/plugin durum özetlerini döndürür.
- `channels.logout`, çıkışı destekleyen belirli bir kanal/hesapta çıkış yapar.
- `web.login.start`, geçerli QR özellikli web kanal sağlayıcısı için QR/web oturum açma akışını başlatır.
- `web.login.wait`, bu QR/web oturum açma akışının tamamlanmasını bekler ve
  başarı durumunda kanalı başlatır.
- `push.test`, kayıtlı bir iOS Node'una test APNs bildirimi gönderir.
- `voicewake.get`, depolanan uyandırma sözcüğü tetikleyicilerini döndürür.
- `voicewake.set`, uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayınlar.

### Mesajlaşma ve günlükler

- `send`, sohbet çalıştırıcısı dışında kanal/hesap/thread hedefli
  gönderimler için doğrudan giden teslim RPC'sidir.
- `logs.tail`, yapılandırılmış gateway dosya günlüğü kuyruğunu imleç/sınır ve
  azami bayt denetimleriyle döndürür.

### Talk ve TTS

- `talk.config`, etkin Talk yapılandırma yükünü döndürür; `includeSecrets`
  için `operator.talk.secrets` (veya `operator.admin`) gerekir.
- `talk.mode`, WebChat/Control UI
  istemcileri için geçerli Talk modu durumunu ayarlar/yayınlar.
- `talk.speak`, etkin Talk konuşma sağlayıcısı üzerinden konuşma sentezler.
- `tts.status`, TTS etkin durumunu, etkin sağlayıcıyı, geri dönüş sağlayıcılarını
  ve sağlayıcı yapılandırma durumunu döndürür.
- `tts.providers`, görünür TTS sağlayıcı envanterini döndürür.
- `tts.enable` ve `tts.disable`, TTS tercih durumunu açıp kapatır.
- `tts.setProvider`, tercih edilen TTS sağlayıcısını günceller.
- `tts.convert`, tek seferlik metinden konuşmaya dönüştürme çalıştırır.

### Gizli bilgiler, yapılandırma, güncelleme ve sihirbaz

- `secrets.reload`, etkin SecretRef'leri yeniden çözümler ve çalışma zamanı gizli durumunu
  yalnızca tam başarı durumunda değiştirir.
- `secrets.resolve`, belirli bir komut/hedef kümesi için komut hedefli gizli bilgi
  atamalarını çözümler.
- `config.get`, geçerli yapılandırma anlık görüntüsünü ve hash değerini döndürür.
- `config.set`, doğrulanmış bir yapılandırma yükü yazar.
- `config.patch`, kısmi bir yapılandırma güncellemesini birleştirir.
- `config.apply`, tam yapılandırma yükünü doğrular + değiştirir.
- `config.schema`, Control UI ve
  CLI araçları tarafından kullanılan canlı yapılandırma şeması yükünü döndürür: şema, `uiHints`, sürüm ve
  üretim meta verileri; çalışma zamanı bunları yükleyebildiğinde plugin + kanal şema meta verileri de dahil.
  Şema, UI'nin kullandığı aynı etiketler
  ve yardım metninden türetilmiş alan `title` / `description` meta verilerini içerir; buna
  eşleşen alan belgeleri mevcut olduğunda iç içe nesne, joker karakter, dizi öğesi
  ve `anyOf` / `oneOf` / `allOf` bileşim dalları dahildir.
- `config.schema.lookup`, tek bir yapılandırma
  yolu için yol kapsamlı bir lookup yükü döndürür: normalize edilmiş yol, sığ bir şema düğümü, eşleşen ipucu + `hintPath` ve
  UI/CLI ayrıntı incelemesi için doğrudan alt özetler.
  - Lookup şema düğümleri kullanıcıya dönük belgeleri ve yaygın doğrulama alanlarını korur:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    sayısal/dizge/dizi/nesne sınırları ve
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi boole bayraklar.
  - Alt özetler `key`, normalize edilmiş `path`, `type`, `required`,
    `hasChildren` ile eşleşen `hint` / `hintPath` değerlerini sunar.
- `update.run`, gateway güncelleme akışını çalıştırır ve yalnızca
  güncellemenin kendisi başarılı olduğunda yeniden başlatma zamanlar.
- `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`,
  onboarding sihirbazını WS RPC üzerinden sunar.

### Mevcut büyük aileler

#### Ajan ve çalışma alanı yardımcıları

- `agents.list`, yapılandırılmış ajan girdilerini döndürür.
- `agents.create`, `agents.update` ve `agents.delete`; ajan kayıtlarını ve
  çalışma alanı bağlantılarını yönetir.
- `agents.files.list`, `agents.files.get` ve `agents.files.set`; bir ajan için
  açığa çıkarılan bootstrap çalışma alanı dosyalarını yönetir.
- `agent.identity.get`, bir ajan veya oturum için etkin asistan kimliğini döndürür.
- `agent.wait`, bir çalıştırmanın bitmesini bekler ve mevcut olduğunda terminal anlık görüntüsünü döndürür.

#### Oturum denetimi

- `sessions.list`, geçerli oturum dizinini döndürür.
- `sessions.subscribe` ve `sessions.unsubscribe`, geçerli WS istemcisi için
  oturum değişikliği olay aboneliklerini açıp kapatır.
- `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`,
  bir oturum için transcript/mesaj olay aboneliklerini açıp kapatır.
- `sessions.preview`, belirli oturum anahtarları için sınırlı transcript
  önizlemeleri döndürür.
- `sessions.resolve`, bir oturum hedefini çözümler veya kanonikleştirir.
- `sessions.create`, yeni bir oturum girdisi oluşturur.
- `sessions.send`, mevcut bir oturuma mesaj gönderir.
- `sessions.steer`, etkin bir oturum için kes-ve-yönlendir varyantıdır.
- `sessions.abort`, bir oturum için etkin çalışmayı iptal eder.
- `sessions.patch`, oturum meta verilerini/geçersiz kılmaları günceller.
- `sessions.reset`, `sessions.delete` ve `sessions.compact`; oturum
  bakımını gerçekleştirir.
- `sessions.get`, depolanmış tam oturum satırını döndürür.
- sohbet yürütmesi hâlâ `chat.history`, `chat.send`, `chat.abort` ve
  `chat.inject` kullanır.
- `chat.history`, UI istemcileri için görüntüleme açısından normalize edilir: satır içi yönerge etiketleri
  görünür metinden çıkarılır, düz metin araç çağrısı XML yükleri (şunlar dahil:
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve
  kısaltılmış araç çağrısı blokları) ile sızmış ASCII/tam genişlikte model denetim token'ları
  çıkarılır, tam olarak `NO_REPLY` /
  `no_reply` olan saf sessiz-token asistan satırları atlanır ve
  aşırı büyük satırlar yer tutucularla değiştirilebilir.

#### Cihaz eşleştirme ve cihaz token'ları

- `device.pair.list`, bekleyen ve onaylanmış eşleştirilmiş cihazları döndürür.
- `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`;
  cihaz eşleştirme kayıtlarını yönetir.
- `device.token.rotate`, eşleştirilmiş bir cihaz token'ını onaylı rolü
  ve kapsam sınırları içinde döndürür.
- `device.token.revoke`, eşleştirilmiş bir cihaz token'ını iptal eder.

#### Node eşleştirme, invoke ve bekleyen işler

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` ve `node.pair.verify`; Node eşleştirme ve bootstrap
  doğrulamasını kapsar.
- `node.list` ve `node.describe`, bilinen/bağlı Node durumunu döndürür.
- `node.rename`, eşleştirilmiş bir Node etiketini günceller.
- `node.invoke`, bir komutu bağlı bir Node'a iletir.
- `node.invoke.result`, bir invoke isteği için sonucu döndürür.
- `node.event`, Node kaynaklı olayları gateway'e geri taşır.
- `node.canvas.capability.refresh`, kapsamlı canvas yetenek token'larını yeniler.
- `node.pending.pull` ve `node.pending.ack`, bağlı Node kuyruk API'leridir.
- `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısı kesilmiş Node'lar
  için kalıcı bekleyen işleri yönetir.

#### Onay aileleri

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve
  `exec.approval.resolve`; tek seferlik exec onay isteklerini ve bekleyen
  onay arama/yeniden oynatma işlemlerini kapsar.
- `exec.approval.waitDecision`, bir bekleyen exec onayını bekler ve
  nihai kararı döndürür (veya zaman aşımında `null`).
- `exec.approvals.get` ve `exec.approvals.set`, gateway exec onay
  ilke anlık görüntülerini yönetir.
- `exec.approvals.node.get` ve `exec.approvals.node.set`, Node relay komutları yoluyla
  Node yerel exec onay ilkesini yönetir.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` ve `plugin.approval.resolve`;
  Plugin tanımlı onay akışlarını kapsar.

#### Diğer büyük aileler

- otomasyon:
  - `wake`, anında veya bir sonraki Heartbeat'te metin ekleme için uyandırma planlar
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/araçlar: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Yaygın olay aileleri

- `chat`: `chat.inject` ve diğer yalnızca transcript tabanlı sohbet
  olayları gibi UI sohbet güncellemeleri.
- `session.message` ve `session.tool`: abone olunan bir oturum için
  transcript/olay akışı güncellemeleri.
- `sessions.changed`: oturum dizini veya meta verisi değişti.
- `presence`: sistem varlık anlık görüntüsü güncellemeleri.
- `tick`: periyodik keepalive / canlılık olayı.
- `health`: gateway sağlık anlık görüntüsü güncellemesi.
- `heartbeat`: Heartbeat olay akışı güncellemesi.
- `cron`: Cron çalıştırma/görev değişikliği olayı.
- `shutdown`: gateway kapatma bildirimi.
- `node.pair.requested` / `node.pair.resolved`: Node eşleştirme yaşam döngüsü.
- `node.invoke.request`: Node invoke isteği yayını.
- `device.pair.requested` / `device.pair.resolved`: eşleştirilmiş cihaz yaşam döngüsü.
- `voicewake.changed`: uyandırma sözcüğü tetikleyici yapılandırması değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onay
  yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin onay
  yaşam döngüsü.

### Node yardımcı yöntemleri

- Node'lar, otomatik izin denetimleri için geçerli skill yürütülebilirleri
  listesini almak üzere `skills.bins` çağırabilir.

### Operator yardımcı yöntemleri

- Operator'ler, bir ajan için çalışma zamanı
  komut envanterini almak üzere `commands.list` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan ajan çalışma alanını okumak için bunu atlayın.
  - `scope`, birincil `name` hedefinin hangi yüzeyi kullandığını kontrol eder:
    - `text`, başında `/` olmadan birincil metin komut token'ını döndürür
    - `native` ve varsayılan `both` yolu, mevcut olduğunda sağlayıcı farkındalıklı yerel adları döndürür
  - `textAliases`, `/model` ve `/m` gibi tam slash takma adlarını taşır.
  - `nativeName`, mevcut olduğunda sağlayıcı farkındalıklı yerel komut adını taşır.
  - `provider` isteğe bağlıdır ve yalnızca yerel adlandırmayı ile yerel Plugin
    komut kullanılabilirliğini etkiler.
  - `includeArgs=false`, yanıttan serileştirilmiş bağımsız değişken meta verilerini çıkarır.
- Operator'ler, bir ajan için çalışma zamanı araç kataloğunu almak üzere `tools.catalog` (`operator.read`) çağırabilir.
  Yanıt, gruplandırılmış araçlar ve kaynak meta verileri içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda Plugin sahibi
  - `optional`: bir Plugin aracının isteğe bağlı olup olmadığı
- Operator'ler, bir oturum için çalışma zamanında etkin olan araç
  envanterini almak üzere `tools.effective` (`operator.read`) çağırabilir.
  - `sessionKey` zorunludur.
  - Gateway, çağıranın sağladığı auth veya teslim bağlamını kabul etmek yerine güvenilir çalışma zamanı bağlamını oturumdan sunucu tarafında türetir.
  - Yanıt oturum kapsamlıdır ve etkin konuşmanın şu anda neleri kullanabileceğini yansıtır;
    buna çekirdek, Plugin ve kanal araçları dahildir.
- Operator'ler, bir ajan için görünür
  Skills envanterini almak üzere `skills.status` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan ajan çalışma alanını okumak için bunu atlayın.
  - Yanıt uygunluğu, eksik gereksinimleri, yapılandırma denetimlerini ve
    ham gizli değerleri açığa çıkarmadan temizlenmiş kurulum seçeneklerini içerir.
- Operator'ler, ClawHub keşif meta verileri için
  `skills.search` ve `skills.detail` (`operator.read`) çağırabilir.
- Operator'ler, iki modda `skills.install` (`operator.admin`) çağırabilir:
  - ClawHub modu: `{ source: "clawhub", slug, version?, force? }`, bir
    skill klasörünü varsayılan ajan çalışma alanı `skills/` dizinine kurar.
  - Gateway kurucu modu: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    gateway ana bilgisayarında bildirilmiş bir `metadata.openclaw.install` eylemini çalıştırır.
- Operator'ler, iki modda `skills.update` (`operator.admin`) çağırabilir:
  - ClawHub modu, varsayılan ajan çalışma alanındaki
    bir izlenen slug'ı veya tüm izlenen ClawHub kurulumlarını günceller.
  - Yapılandırma modu, `enabled`,
    `apiKey` ve `env` gibi `skills.entries.<skillKey>` değerlerini yamalar.

## Exec onayları

- Bir exec isteği onay gerektirdiğinde gateway, `exec.approval.requested` yayınlar.
- Operator istemcileri `exec.approval.resolve` çağırarak çözümler (`operator.approvals` kapsamı gerekir).
- `host=node` için `exec.approval.request`, `systemRunPlan` içermelidir (kanonik `argv`/`cwd`/`rawCommand`/oturum meta verileri). `systemRunPlan` eksik istekler reddedilir.
- Onaydan sonra iletilen `node.invoke system.run` çağrıları,
  yetkili komut/cwd/oturum bağlamı olarak bu kanonik
  `systemRunPlan`'ı yeniden kullanır.
- Bir çağıran, hazırlık ile nihai onaylı `system.run` iletimi arasında
  `command`, `rawCommand`, `cwd`, `agentId` veya
  `sessionKey` değerlerini değiştirirse, gateway değiştirilen yüke güvenmek yerine
  çalıştırmayı reddeder.

## Ajan teslim geri dönüşü

- `agent` istekleri, giden teslim istemek için `deliver=true` içerebilir.
- `bestEffortDeliver=false`, katı davranışı korur: çözümlenmemiş veya yalnızca dahili teslim hedefleri `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici teslim edilebilir rota çözümlenemediğinde oturum-yalnızca yürütmeye geri dönüşe izin verir (örneğin dahili/webchat oturumları veya belirsiz çok kanallı yapılandırmalar).

## Sürümleme

- `PROTOCOL_VERSION`, `src/gateway/protocol/schema/protocol-schemas.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu uyuşmazlıkları reddeder.
- Şemalar + modeller, TypeBox tanımlarından üretilir:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### İstemci sabitleri

`src/gateway/client.ts` içindeki referans istemci bu varsayılanları kullanır. Değerler
protokol v3 boyunca kararlıdır ve üçüncü taraf istemciler için beklenen temel çizgidir.

| Sabit                                     | Varsayılan                                           | Kaynak                                                     |
| ----------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| İstek zaman aşımı (RPC başına)            | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Ön kimlik doğrulama / connect-challenge zaman aşımı | `10_000` ms                                  | `src/gateway/handshake-timeouts.ts` (sınır `250`–`10_000`) |
| Başlangıç yeniden bağlanma backoff'u      | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                      |
| Azami yeniden bağlanma backoff'u          | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Device-token kapanışından sonra hızlı yeniden deneme sınırı | `250` ms                              | `src/gateway/client.ts`                                    |
| `terminate()` öncesi zorla durdurma toleransı | `250` ms                                         | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| `stopAndWait()` varsayılan zaman aşımı    | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Varsayılan tick aralığı (`hello-ok` öncesi) | `30_000` ms                                        | `src/gateway/client.ts`                                    |
| Tick zaman aşımı kapanışı                 | sessizlik `tickIntervalMs * 2` değerini aşınca kod `4000` | `src/gateway/client.ts`                                |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                          |

Sunucu, etkin `policy.tickIntervalMs`, `policy.maxPayload`
ve `policy.maxBufferedBytes` değerlerini `hello-ok` içinde bildirir; istemciler
el sıkışma öncesi varsayılanlar yerine bu değerlere uymalıdır.

## Kimlik doğrulama

- Paylaşılan gizli anahtar tabanlı gateway kimlik doğrulaması, yapılandırılmış kimlik doğrulama moduna bağlı olarak `connect.params.auth.token` veya
  `connect.params.auth.password` kullanır.
- Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ya da loopback olmayan
  `gateway.auth.mode: "trusted-proxy"` gibi kimlik taşıyan modlar, connect kimlik doğrulama denetimini
  `connect.params.auth.*` yerine istek başlıklarından karşılar.
- Özel giriş için `gateway.auth.mode: "none"`, paylaşılan gizli anahtar tabanlı connect kimlik doğrulamasını
  tamamen atlar; bu modu herkese açık/güvenilmeyen girişte açığa çıkarmayın.
- Eşleştirmeden sonra Gateway, bağlantı
  rolü + kapsamlarıyla sınırlı bir **device token** yayınlar. Bu, `hello-ok.auth.deviceToken` içinde döner ve
  istemci tarafından gelecekteki bağlantılar için kalıcı olarak saklanmalıdır.
- İstemciler, başarılı her
  bağlantıdan sonra birincil `hello-ok.auth.deviceToken` değerini saklamalıdır.
- Bu **saklanan** device token ile yeniden bağlanırken, o token için saklanan
  onaylı kapsam kümesi de yeniden kullanılmalıdır. Bu, daha önce verilmiş olan
  okuma/probe/status erişimini korur ve yeniden bağlantıların sessizce
  daha dar örtük admin-only kapsamına düşmesini önler.
- İstemci tarafı connect kimlik doğrulama oluşturma (`selectConnectAuth` içinde
  `src/gateway/client.ts`):
  - `auth.password` bağımsızdır ve ayarlandığında her zaman iletilir.
  - `auth.token` öncelik sırasına göre doldurulur: önce açık paylaşılan token,
    sonra açık bir `deviceToken`, sonra da (`deviceId` + `role` ile anahtarlanan)
    saklı cihaz başına token.
  - `auth.bootstrapToken`, yalnızca yukarıdakilerin hiçbiri bir
    `auth.token` çözümlemediğinde gönderilir. Paylaşılan token veya çözümlenen herhangi bir device token bunu bastırır.
  - Tek seferlik `AUTH_TOKEN_MISMATCH` yeniden denemesinde saklı bir device token'ın
    otomatik yükseltilmesi yalnızca **güvenilir uç noktalar** için geçerlidir —
    loopback ya da sabitlenmiş `tlsFingerprint` ile `wss://`. Sabitleme olmadan herkese açık `wss://`
    buna uygun değildir.
- Ek `hello-ok.auth.deviceTokens` girdileri bootstrap devretme token'larıdır.
  Bunları yalnızca bağlantı bootstrap kimlik doğrulamasıyla güvenilir bir taşıma
  üzerinden yapıldıysa saklayın; örneğin `wss://` veya loopback/yerel eşleştirme.
- Bir istemci açık bir `deviceToken` veya açık `scopes` sağlıyorsa, çağıranın
  istediği bu kapsam kümesi belirleyici olmaya devam eder; önbelleğe alınmış kapsamlar yalnızca
  istemci saklı cihaz başına token'ı yeniden kullanıyorsa yeniden kullanılır.
- Device token'lar `device.token.rotate` ve
  `device.token.revoke` ile döndürülebilir/iptal edilebilir (`operator.pairing` kapsamı gerekir).
- Token yayınlama/döndürme, o cihazın eşleştirme girdisinde kaydedilen onaylı rol kümesiyle
  sınırlı kalır; bir token'ı döndürmek, cihazı
  eşleştirme onayının hiç vermediği bir role genişletemez.
- Eşleştirilmiş cihaz token oturumlarında, çağıran ayrıca `operator.admin` yetkisine sahip değilse
  cihaz yönetimi kendine kapsamlıdır: admin olmayan çağıranlar yalnızca
  **kendi** cihaz girdilerini kaldırabilir/iptal edebilir/döndürebilir.
- `device.token.rotate`, istenen operator kapsam kümesini
  çağıranın geçerli oturum kapsamlarıyla da karşılaştırır. Admin olmayan çağıranlar bir token'ı,
  zaten sahip olduklarından daha geniş bir operator kapsam kümesine döndüremez.
- Kimlik doğrulama hataları `error.details.code` ile birlikte kurtarma ipuçları içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilir istemciler, önbelleğe alınmış cihaz başına token ile bir sınırlı yeniden deneme deneyebilir.
  - Bu yeniden deneme başarısız olursa istemciler otomatik yeniden bağlanma döngülerini durdurmalı ve operator eylem rehberliğini göstermelidir.

## Cihaz kimliği + eşleştirme

- Node'lar, bir anahtar çifti parmak izinden türetilmiş kararlı bir cihaz kimliği (`device.id`) içermelidir.
- Gateway'ler token'ları cihaz + rol başına yayınlar.
- Yerel otomatik onay
  etkinleştirilmediyse yeni cihaz kimlikleri için eşleştirme onayı gerekir.
- Eşleştirme otomatik onayı, doğrudan yerel local loopback bağlantılarına odaklanır.
- OpenClaw ayrıca güvenilir paylaşılan gizli anahtar yardımcı akışları için
  dar kapsamlı bir backend/container-yerel kendi kendine bağlantı yoluna sahiptir.
- Aynı ana makinedeki tailnet veya LAN bağlantıları eşleştirme açısından yine de uzak kabul edilir ve
  onay gerektirir.
- Tüm WS istemcileri `connect` sırasında `device` kimliğini içermelidir (operator + node).
  Control UI bunu yalnızca şu modlarda atlayabilir:
  - yalnızca localhost için güvensiz HTTP uyumluluğunda `gateway.controlUi.allowInsecureAuth=true`.
  - başarılı `gateway.auth.mode: "trusted-proxy"` operator Control UI kimlik doğrulaması.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (acil durum, ciddi güvenlik düşüşü).
- Tüm bağlantılar sunucu tarafından sağlanan `connect.challenge` nonce değerini imzalamalıdır.

### Cihaz kimlik doğrulama geçiş tanılamaları

Hâlâ pre-challenge imzalama davranışını kullanan eski istemciler için, `connect` artık
sabit bir `error.details.reason` ile birlikte `error.details.code` altında
`DEVICE_AUTH_*` ayrıntı kodları döndürür.

Yaygın geçiş hataları:

| Mesaj                       | details.code                     | details.reason           | Anlamı                                             |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | İstemci `device.nonce` alanını atladı (veya boş gönderdi). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | İstemci eski/yanlış bir nonce ile imzaladı.        |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | İmza yükü v2 yüküyle eşleşmiyor.                   |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | İmzalanan zaman damgası izin verilen kaymanın dışında. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`, ortak anahtar parmak iziyle eşleşmiyor. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Ortak anahtar biçimi/kanonikleştirme başarısız oldu. |

Geçiş hedefi:

- Her zaman `connect.challenge` bekleyin.
- Sunucu nonce değerini içeren v2 yükünü imzalayın.
- Aynı nonce değerini `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza yükü `v3`'tür; bu, device/client/role/scopes/token/nonce alanlarına ek olarak `platform` ve `deviceFamily` alanlarını da bağlar.
- Eski `v2` imzaları uyumluluk için hâlâ kabul edilir, ancak eşleştirilmiş cihaz
  meta veri sabitlemesi yeniden bağlantıda komut ilkesini yine de kontrol eder.

## TLS + sabitleme

- WS bağlantıları için TLS desteklenir.
- İstemciler isteğe bağlı olarak gateway sertifika parmak izini sabitleyebilir (bkz. `gateway.tls`
  yapılandırması ile `gateway.remote.tlsFingerprint` veya CLI `--tls-fingerprint`).

## Kapsam

Bu protokol **tam gateway API'sini** açığa çıkarır (status, channels, models, chat,
agent, sessions, nodes, approvals vb.). Tam yüzey, `src/gateway/protocol/schema.ts` içindeki
TypeBox şemalarıyla tanımlanır.
