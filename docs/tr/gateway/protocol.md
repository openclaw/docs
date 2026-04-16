---
read_when:
    - Gateway WS istemcilerini uygulama veya güncelleme
    - Protokol uyumsuzluklarını veya bağlantı hatalarını hata ayıklama
    - Protokol şemasını/modellerini yeniden oluşturma
summary: 'Gateway WebSocket protokolü: el sıkışma, çerçeveler, sürümleme'
title: Gateway Protokolü
x-i18n:
    generated_at: "2026-04-16T08:53:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 683e61ebe993a2d739bc34860060b0e3eda36b5c57267a2bcc03d177ec612fb3
    source_path: gateway/protocol.md
    workflow: 15
---

# Gateway protokolü (WebSocket)

Gateway WS protokolü, OpenClaw için **tek kontrol düzlemi + düğüm taşımasıdır**.
Tüm istemciler (CLI, web UI, macOS uygulaması, iOS/Android düğümleri, başsız
düğümler) WebSocket üzerinden bağlanır ve el sıkışma sırasında **rol** +
**kapsamlarını** bildirir.

## Taşıma

- WebSocket, JSON yükleri içeren metin çerçeveleri.
- İlk çerçeve **zorunlu olarak** bir `connect` isteği olmalıdır.

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
(`src/gateway/protocol/schema/frames.ts`). `auth` ve `canvasHostUrl` isteğe bağlıdır.

Bir cihaz belirteci verildiğinde, `hello-ok` ayrıca şunu da içerir:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilir önyükleme devri sırasında, `hello-ok.auth` ayrıca `deviceTokens`
içinde ek sınırlı rol girdileri de içerebilir:

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

Yerleşik node/operator önyükleme akışında, birincil node belirteci
`scopes: []` olarak kalır ve devredilen herhangi bir operator belirteci
önyükleme operator izin listesiyle sınırlı kalır (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Önyükleme kapsam denetimleri rol
önekli kalır: operator girdileri yalnızca operator isteklerini karşılar ve
operator olmayan roller yine kendi rol önekleri altındaki kapsamlara ihtiyaç duyar.

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

Yan etki oluşturan yöntemler **idempotency key** gerektirir (bkz. şema).

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

`includeSecrets: true` ile `talk.config`, `operator.talk.secrets`
(veya `operator.admin`) gerektirir.

Plugin tarafından kaydedilen Gateway RPC yöntemleri kendi operator kapsamlarını
isteyebilir, ancak ayrılmış çekirdek yönetici önekleri (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) her zaman `operator.admin` olarak çözülür.

Yöntem kapsamı yalnızca ilk geçittir. `chat.send` üzerinden ulaşılan bazı eğik
çizgi komutları bunun üzerine daha sıkı komut düzeyi denetimler uygular. Örneğin,
kalıcı `/config set` ve `/config unset` yazmaları `operator.admin` gerektirir.

`node.pair.approve`, temel yöntem kapsamına ek olarak onay sırasında ek bir
kapsam denetimine de sahiptir:

- komutsuz istekler: `operator.pairing`
- yürütme olmayan node komutları içeren istekler: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which` içeren istekler:
  `operator.pairing` + `operator.admin`

### Yetenekler/komutlar/izinler (`node`)

Node'lar bağlantı sırasında yetenek beyanlarını bildirir:

- `caps`: üst düzey yetenek kategorileri.
- `commands`: çağırma için komut izin listesi.
- `permissions`: ayrıntılı anahtarlar (ör. `screen.record`, `camera.capture`).

Gateway bunları **beyan** olarak ele alır ve sunucu tarafı izin listelerini uygular.

## Varlık durumu

- `system-presence`, cihaz kimliğine göre anahtarlanmış girdiler döndürür.
- Varlık durumu girdileri `deviceId`, `roles` ve `scopes` içerir; böylece UI'lar
  bir cihaz hem **operator** hem de **node** olarak bağlandığında bile cihaz
  başına tek satır gösterebilir.

## Yaygın RPC yöntem aileleri

Bu sayfa oluşturulmuş tam bir döküm değildir, ancak genel WS yüzeyi yukarıdaki
el sıkışma/kimlik doğrulama örneklerinden daha geniştir. Bugün Gateway'in sunduğu
başlıca yöntem aileleri bunlardır.

`hello-ok.features.methods`, `src/gateway/server-methods-list.ts` ile yüklenen
plugin/channel yöntem dışa aktarımlarından oluşturulan temkinli bir keşif
listesidir. Bunu özellik keşfi olarak değerlendirin; `src/gateway/server-methods/*.ts`
içinde uygulanan çağrılabilir her yardımcı işlevin oluşturulmuş bir dökümü olarak değil.

### Sistem ve kimlik

- `health`, önbelleğe alınmış veya yeni yoklanmış gateway sağlık anlık görüntüsünü döndürür.
- `status`, `/status` tarzı gateway özetini döndürür; hassas alanlar yalnızca
  admin kapsamlı operator istemcilerine dahil edilir.
- `gateway.identity.get`, relay ve eşleştirme akışlarında kullanılan gateway cihaz
  kimliğini döndürür.
- `system-presence`, bağlı operator/node cihazları için mevcut varlık durumu anlık
  görüntüsünü döndürür.
- `system-event`, bir sistem olayı ekler ve varlık durumu bağlamını
  güncelleyip yayımlayabilir.
- `last-heartbeat`, en son kalıcı Heartbeat olayını döndürür.
- `set-heartbeats`, gateway üzerinde Heartbeat işleme durumunu açıp kapatır.

### Modeller ve kullanım

- `models.list`, çalışma zamanında izin verilen model kataloğunu döndürür.
- `usage.status`, sağlayıcı kullanım pencereleri/kalan kota özetlerini döndürür.
- `usage.cost`, bir tarih aralığı için birleştirilmiş maliyet kullanım özetlerini döndürür.
- `doctor.memory.status`, etkin varsayılan agent çalışma alanı için
  vektör bellek / embedding hazırlık durumunu döndürür.
- `sessions.usage`, oturum başına kullanım özetlerini döndürür.
- `sessions.usage.timeseries`, tek bir oturum için zaman serisi kullanımını döndürür.
- `sessions.usage.logs`, tek bir oturum için kullanım günlüğü girdilerini döndürür.

### Kanallar ve giriş yardımcıları

- `channels.status`, yerleşik + paketlenmiş channel/plugin durum özetlerini döndürür.
- `channels.logout`, kanal çıkışı desteklediğinde belirli bir channel/account için çıkış yapar.
- `web.login.start`, mevcut QR destekli web channel sağlayıcısı için bir QR/web
  giriş akışı başlatır.
- `web.login.wait`, bu QR/web giriş akışının tamamlanmasını bekler ve başarı
  durumunda channel'ı başlatır.
- `push.test`, kayıtlı bir iOS node'una test APNs bildirimi gönderir.
- `voicewake.get`, depolanan uyandırma sözcüğü tetikleyicilerini döndürür.
- `voicewake.set`, uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayımlar.

### Mesajlaşma ve günlükler

- `send`, chat runner dışında kanal/account/thread hedefli gönderimler için doğrudan
  giden teslim RPC'sidir.
- `logs.tail`, imleç/sınır ve azami bayt denetimleriyle yapılandırılmış gateway
  dosya günlüğü sonunu döndürür.

### Talk ve TTS

- `talk.config`, etkin Talk yapılandırması yükünü döndürür; `includeSecrets`,
  `operator.talk.secrets` (veya `operator.admin`) gerektirir.
- `talk.mode`, WebChat/Control UI istemcileri için mevcut Talk modu durumunu ayarlar/yayımlar.
- `talk.speak`, etkin Talk konuşma sağlayıcısı üzerinden konuşma sentezler.
- `tts.status`, TTS etkin durumunu, etkin sağlayıcıyı, yedek sağlayıcıları
  ve sağlayıcı yapılandırma durumunu döndürür.
- `tts.providers`, görünür TTS sağlayıcı envanterini döndürür.
- `tts.enable` ve `tts.disable`, TTS tercih durumunu açıp kapatır.
- `tts.setProvider`, tercih edilen TTS sağlayıcısını günceller.
- `tts.convert`, tek seferlik metinden konuşmaya dönüştürme çalıştırır.

### Gizli bilgiler, yapılandırma, güncelleme ve sihirbaz

- `secrets.reload`, etkin SecretRef'leri yeniden çözer ve çalışma zamanı gizli bilgi
  durumunu yalnızca tam başarıda değiştirir.
- `secrets.resolve`, belirli bir komut/hedef kümesi için komut hedefli gizli bilgi
  atamalarını çözer.
- `config.get`, mevcut yapılandırma anlık görüntüsünü ve hash değerini döndürür.
- `config.set`, doğrulanmış bir yapılandırma yükü yazar.
- `config.patch`, kısmi bir yapılandırma güncellemesini birleştirir.
- `config.apply`, tam yapılandırma yükünü doğrular + değiştirir.
- `config.schema`, Control UI ve CLI araçları tarafından kullanılan canlı
  yapılandırma şeması yükünü döndürür: şema, `uiHints`, sürüm ve oluşturma
  meta verileri; buna çalışma zamanı yükleyebildiğinde plugin + channel şema
  meta verileri de dahildir. Şema, aynı etiketler ve yardım metninden türetilen
  alan `title` / `description` meta verilerini içerir; buna eşleşen alan
  belgeleri bulunduğunda iç içe nesne, joker karakter, dizi öğesi ve
  `anyOf` / `oneOf` / `allOf` bileşim dalları da dahildir.
- `config.schema.lookup`, tek bir yapılandırma yolu için yol kapsamlı bir arama
  yükü döndürür: normalize edilmiş yol, sığ bir şema düğümü, eşleşen ipucu +
  `hintPath` ve UI/CLI ayrıntılı inceleme için doğrudan alt özetler.
  - Arama şeması düğümleri kullanıcıya yönelik belgeleri ve yaygın doğrulama
    alanlarını korur: `title`, `description`, `type`, `enum`, `const`, `format`,
    `pattern`, sayısal/dize/dizi/nesne sınırları ve
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi boole bayraklar.
  - Alt özetler `key`, normalize edilmiş `path`, `type`, `required`,
    `hasChildren` ve eşleşen `hint` / `hintPath` değerlerini sunar.
- `update.run`, gateway güncelleme akışını çalıştırır ve yalnızca güncellemenin
  kendisi başarılı olduğunda yeniden başlatma zamanlar.
- `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`,
  önyükleme sihirbazını WS RPC üzerinden sunar.

### Mevcut başlıca aileler

#### Agent ve çalışma alanı yardımcıları

- `agents.list`, yapılandırılmış agent girdilerini döndürür.
- `agents.create`, `agents.update` ve `agents.delete`, agent kayıtlarını ve
  çalışma alanı bağlantısını yönetir.
- `agents.files.list`, `agents.files.get` ve `agents.files.set`, bir agent için
  sunulan önyükleme çalışma alanı dosyalarını yönetir.
- `agent.identity.get`, bir agent veya oturum için etkin yardımcı kimliğini döndürür.
- `agent.wait`, bir çalıştırmanın bitmesini bekler ve mevcutsa terminal anlık
  görüntüsünü döndürür.

#### Oturum denetimi

- `sessions.list`, mevcut oturum dizinini döndürür.
- `sessions.subscribe` ve `sessions.unsubscribe`, mevcut WS istemcisi için
  oturum değişikliği olay aboneliklerini açıp kapatır.
- `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`, tek bir
  oturum için transkript/mesaj olay aboneliklerini açıp kapatır.
- `sessions.preview`, belirli oturum anahtarları için sınırlı transkript
  önizlemeleri döndürür.
- `sessions.resolve`, bir oturum hedefini çözümler veya kurallı hale getirir.
- `sessions.create`, yeni bir oturum girdisi oluşturur.
- `sessions.send`, mevcut bir oturuma mesaj gönderir.
- `sessions.steer`, etkin bir oturum için kesip yönlendirme varyantıdır.
- `sessions.abort`, bir oturum için etkin çalışmayı durdurur.
- `sessions.patch`, oturum meta verilerini/geçersiz kılmalarını günceller.
- `sessions.reset`, `sessions.delete` ve `sessions.compact`, oturum bakımı gerçekleştirir.
- `sessions.get`, depolanan tam oturum satırını döndürür.
- sohbet yürütmesi hâlâ `chat.history`, `chat.send`, `chat.abort` ve
  `chat.inject` kullanır.
- `chat.history`, UI istemcileri için görüntülemeye göre normalize edilir:
  satır içi yönerge etiketleri görünür metinden kaldırılır, düz metin araç
  çağrısı XML yükleri (şunlar dahil:
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve
  kesilmiş araç çağrısı blokları) ile sızan ASCII/tam genişlikli model kontrol
  belirteçleri kaldırılır, tam olarak `NO_REPLY` / `no_reply` olan saf sessiz
  belirteçli yardımcı satırları atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir.

#### Cihaz eşleştirme ve cihaz belirteçleri

- `device.pair.list`, bekleyen ve onaylanmış eşleştirilmiş cihazları döndürür.
- `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`,
  cihaz eşleştirme kayıtlarını yönetir.
- `device.token.rotate`, eşleştirilmiş bir cihaz belirtecini onaylanan rolü
  ve kapsam sınırları içinde döndürür.
- `device.token.revoke`, eşleştirilmiş bir cihaz belirtecini geçersiz kılar.

#### Node eşleştirme, çağırma ve bekleyen işler

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` ve `node.pair.verify`, node eşleştirme ve önyükleme
  doğrulamasını kapsar.
- `node.list` ve `node.describe`, bilinen/bağlı node durumunu döndürür.
- `node.rename`, eşleştirilmiş bir node etiketini günceller.
- `node.invoke`, bir komutu bağlı bir node'a iletir.
- `node.invoke.result`, bir çağırma isteğinin sonucunu döndürür.
- `node.event`, node kaynaklı olayları gateway içine geri taşır.
- `node.canvas.capability.refresh`, kapsamlı canvas yetenek belirteçlerini yeniler.
- `node.pending.pull` ve `node.pending.ack`, bağlı node kuyruk API'leridir.
- `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısı kopmuş
  node'lar için kalıcı bekleyen işleri yönetir.

#### Onay aileleri

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve
  `exec.approval.resolve`, tek seferlik exec onay isteklerini ve bekleyen onay
  arama/yeniden oynatma işlemlerini kapsar.
- `exec.approval.waitDecision`, tek bir bekleyen exec onayını bekler ve
  nihai kararı döndürür (veya zaman aşımında `null`).
- `exec.approvals.get` ve `exec.approvals.set`, gateway exec onay
  ilke anlık görüntülerini yönetir.
- `exec.approvals.node.get` ve `exec.approvals.node.set`, node aktarma komutları
  aracılığıyla node yerel exec onay ilkesini yönetir.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` ve `plugin.approval.resolve`,
  Plugin tanımlı onay akışlarını kapsar.

#### Diğer başlıca aileler

- otomasyon:
  - `wake`, hemen veya bir sonraki Heartbeat'te uyandırma metni eklemeyi zamanlar
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- skills/tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Yaygın olay aileleri

- `chat`: `chat.inject` ve diğer yalnızca transkript içeren sohbet olayları gibi
  UI sohbet güncellemeleri.
- `session.message` ve `session.tool`: abone olunan bir oturum için
  transkript/olay akışı güncellemeleri.
- `sessions.changed`: oturum dizini veya meta verileri değişti.
- `presence`: sistem varlık durumu anlık görüntüsü güncellemeleri.
- `tick`: periyodik canlı tutma / canlılık olayı.
- `health`: gateway sağlık anlık görüntüsü güncellemesi.
- `heartbeat`: Heartbeat olay akışı güncellemesi.
- `cron`: Cron çalıştırma/iş değişikliği olayı.
- `shutdown`: gateway kapanma bildirimi.
- `node.pair.requested` / `node.pair.resolved`: node eşleştirme yaşam döngüsü.
- `node.invoke.request`: node çağırma isteği yayını.
- `device.pair.requested` / `device.pair.resolved`: eşleştirilmiş cihaz yaşam döngüsü.
- `voicewake.changed`: uyandırma sözcüğü tetikleyici yapılandırması değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onay
  yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin onay yaşam döngüsü.

### Node yardımcı yöntemleri

- Node'lar, otomatik izin denetimleri için mevcut skill yürütülebilirleri
  listesini almak üzere `skills.bins` çağırabilir.

### Operator yardımcı yöntemleri

- Operator'ler, bir agent için çalışma zamanı komut envanterini almak üzere
  `commands.list` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan agent çalışma alanını okumak için bunu atlayın.
  - `scope`, birincil `name` hedefinin hangi yüzeyi kullandığını denetler:
    - `text`, başında `/` olmadan birincil metin komut belirtecini döndürür
    - `native` ve varsayılan `both` yolu, mevcut olduğunda sağlayıcı farkında native adları döndürür
  - `textAliases`, `/model` ve `/m` gibi tam eğik çizgi takma adlarını taşır.
  - `nativeName`, mevcut olduğunda sağlayıcı farkında native komut adını taşır.
  - `provider` isteğe bağlıdır ve yalnızca native adlandırmayı ve native Plugin
    komut kullanılabilirliğini etkiler.
  - `includeArgs=false`, serileştirilmiş argüman meta verilerini yanıttan çıkarır.
- Operator'ler, bir agent için çalışma zamanı araç kataloğunu almak üzere
  `tools.catalog` (`operator.read`) çağırabilir. Yanıt, gruplanmış araçları ve
  kaynak meta verilerini içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda Plugin sahibi
  - `optional`: bir Plugin aracının isteğe bağlı olup olmadığı
- Operator'ler, bir oturum için çalışma zamanında etkin araç envanterini almak üzere
  `tools.effective` (`operator.read`) çağırabilir.
  - `sessionKey` zorunludur.
  - Gateway, çağıranın sağladığı kimlik doğrulama veya teslim bağlamını kabul etmek yerine
    güvenilir çalışma zamanı bağlamını oturumdan sunucu tarafında türetir.
  - Yanıt oturum kapsamlıdır ve etkin konuşmanın şu anda kullanabildiklerini yansıtır;
    buna core, Plugin ve channel araçları dahildir.
- Operator'ler, bir agent için görünür skill envanterini almak üzere
  `skills.status` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan agent çalışma alanını okumak için bunu atlayın.
  - Yanıt, ham gizli bilgi değerlerini açığa çıkarmadan uygunluk, eksik gereksinimler,
    yapılandırma denetimleri ve arındırılmış kurulum seçeneklerini içerir.
- Operator'ler, ClawHub keşif meta verileri için `skills.search` ve `skills.detail`
  (`operator.read`) çağırabilir.
- Operator'ler, `skills.install` (`operator.admin`) yöntemini iki kipte çağırabilir:
  - ClawHub kipi: `{ source: "clawhub", slug, version?, force? }`, varsayılan
    agent çalışma alanı `skills/` dizinine bir skill klasörü kurar.
  - Gateway kurucu kipi: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    gateway ana bilgisayarında bildirilen bir `metadata.openclaw.install` eylemini çalıştırır.
- Operator'ler, `skills.update` (`operator.admin`) yöntemini iki kipte çağırabilir:
  - ClawHub kipi, varsayılan agent çalışma alanında izlenen bir slug'ı veya tüm
    izlenen ClawHub kurulumlarını günceller.
  - Yapılandırma kipi, `enabled`, `apiKey` ve `env` gibi
    `skills.entries.<skillKey>` değerlerini yamalar.

## Exec onayları

- Bir exec isteği onay gerektirdiğinde, gateway `exec.approval.requested` olayını yayınlar.
- Operator istemcileri `exec.approval.resolve` çağırarak çözüm sağlar
  (`operator.approvals` kapsamı gerekir).
- `host=node` için `exec.approval.request`, `systemRunPlan` içermelidir
  (kurallı `argv`/`cwd`/`rawCommand`/oturum meta verileri). `systemRunPlan`
  eksik olan istekler reddedilir.
- Onaydan sonra iletilen `node.invoke system.run` çağrıları, yetkili
  komut/`cwd`/oturum bağlamı olarak aynı kurallı `systemRunPlan` değerini yeniden kullanır.
- Eğer bir çağıran, hazırlık ile nihai onaylı `system.run` iletimi arasında
  `command`, `rawCommand`, `cwd`, `agentId` veya `sessionKey` değerlerini
  değiştirirse, gateway mutasyona uğramış yüke güvenmek yerine çalıştırmayı reddeder.

## Agent teslim yedeği

- `agent` istekleri, giden teslim istemek için `deliver=true` içerebilir.
- `bestEffortDeliver=false`, sıkı davranışı korur: çözülemeyen veya yalnızca dahili
  teslim hedefleri `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici teslim edilebilir rota çözülemediğinde
  oturumla sınırlı yürütmeye yedeklemeye izin verir
  (örneğin dahili/webchat oturumları veya belirsiz çok kanallı yapılandırmalar).

## Sürümleme

- `PROTOCOL_VERSION`, `src/gateway/protocol/schema/protocol-schemas.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu uyuşmazlıkları reddeder.
- Şemalar + modeller TypeBox tanımlarından oluşturulur:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### İstemci sabitleri

`src/gateway/client.ts` içindeki referans istemci şu varsayılanları kullanır. Bu değerler
protokol v3 boyunca kararlıdır ve üçüncü taraf istemciler için beklenen temel düzeydir.

| Sabit | Varsayılan | Kaynak |
| --- | --- | --- |
| `PROTOCOL_VERSION` | `3` | `src/gateway/protocol/schema/protocol-schemas.ts` |
| İstek zaman aşımı (RPC başına) | `30_000` ms | `src/gateway/client.ts` (`requestTimeoutMs`) |
| Ön kimlik doğrulama / bağlantı sınama zaman aşımı | `10_000` ms | `src/gateway/handshake-timeouts.ts` (sınır `250`–`10_000`) |
| Başlangıç yeniden bağlanma geri çekilmesi | `1_000` ms | `src/gateway/client.ts` (`backoffMs`) |
| Azami yeniden bağlanma geri çekilmesi | `30_000` ms | `src/gateway/client.ts` (`scheduleReconnect`) |
| Cihaz belirteci kapanışından sonra hızlı yeniden deneme sınırı | `250` ms | `src/gateway/client.ts` |
| `terminate()` öncesi zorla durdurma ek süresi | `250` ms | `FORCE_STOP_TERMINATE_GRACE_MS` |
| `stopAndWait()` varsayılan zaman aşımı | `1_000` ms | `STOP_AND_WAIT_TIMEOUT_MS` |
| Varsayılan tick aralığı ( `hello-ok` öncesi ) | `30_000` ms | `src/gateway/client.ts` |
| Tick zaman aşımı kapanışı | sessizlik `tickIntervalMs * 2` değerini aştığında kod `4000` | `src/gateway/client.ts` |
| `MAX_PAYLOAD_BYTES` | `25 * 1024 * 1024` (25 MB) | `src/gateway/server-constants.ts` |

Sunucu, etkin `policy.tickIntervalMs`, `policy.maxPayload` ve
`policy.maxBufferedBytes` değerlerini `hello-ok` içinde bildirir; istemciler el sıkışma
öncesi varsayılanlar yerine bu değerlere uymalıdır.

## Kimlik doğrulama

- Paylaşılan gizli anahtar kullanan gateway kimlik doğrulaması, yapılandırılmış kimlik doğrulama kipine bağlı olarak `connect.params.auth.token` veya
  `connect.params.auth.password` kullanır.
- Tailscale Serve
  (`gateway.auth.allowTailscale: true`) veya loopback olmayan
  `gateway.auth.mode: "trusted-proxy"` gibi kimlik taşıyan kipler, bağlantı kimlik doğrulama denetimini
  `connect.params.auth.*` yerine istek üstbilgilerinden karşılar.
- Özel giriş için `gateway.auth.mode: "none"`, paylaşılan gizli anahtar bağlantı kimlik doğrulamasını tamamen atlar; bu kipi genel/güvenilmeyen girişte açığa çıkarmayın.
- Eşleştirmeden sonra Gateway, bağlantı rolü + kapsamlarına göre sınırlandırılmış bir **cihaz belirteci** verir. Bu belirteç `hello-ok.auth.deviceToken` içinde döndürülür ve istemci tarafından gelecekteki bağlantılar için kalıcı olarak saklanmalıdır.
- İstemciler, başarılı her bağlantıdan sonra birincil `hello-ok.auth.deviceToken` değerini kalıcı olarak saklamalıdır.
- Bu **saklanan** cihaz belirteciyle yeniden bağlanırken, o belirteç için saklanan onaylı kapsam kümesi de yeniden kullanılmalıdır. Bu, daha önce verilmiş okuma/yoklama/durum erişimini korur ve yeniden bağlantıların sessizce daha dar, yalnızca örtük yönetici kapsamına düşmesini önler.
- İstemci tarafı bağlantı kimlik doğrulaması oluşturma (`src/gateway/client.ts` içindeki `selectConnectAuth`):
  - `auth.password` ortogonaldir ve ayarlandığında her zaman iletilir.
  - `auth.token`, öncelik sırasına göre doldurulur: önce açık paylaşılan belirteç,
    ardından açık `deviceToken`, sonra da saklanan cihaz başına belirteç (`deviceId` + `role` ile anahtarlanır).
  - `auth.bootstrapToken`, yalnızca yukarıdakilerin hiçbiri bir `auth.token`
    çözümlemediğinde gönderilir. Paylaşılan bir belirteç veya çözülmüş herhangi bir cihaz belirteci bunu bastırır.
  - Saklanan bir cihaz belirtecinin tek seferlik
    `AUTH_TOKEN_MISMATCH` yeniden denemesinde otomatik yükseltilmesi yalnızca **güvenilir uç noktalar** için geçerlidir —
    loopback veya sabitlenmiş `tlsFingerprint` içeren `wss://`. Sabitleme olmayan genel `wss://`
    buna dahil değildir.
- Ek `hello-ok.auth.deviceTokens` girdileri, önyükleme devri belirteçleridir.
  Bunları yalnızca bağlantı, `wss://` veya loopback/local eşleştirme gibi güvenilir bir taşıma üzerinde önyükleme kimlik doğrulaması kullandıysa kalıcı olarak saklayın.
- Bir istemci açık bir `deviceToken` veya açık `scopes` sağlarsa, çağıran tarafından istenen bu kapsam kümesi belirleyici olmaya devam eder; önbelleğe alınmış kapsamlar yalnızca istemci saklanan cihaz başına belirteci yeniden kullanıyorsa yeniden kullanılır.
- Cihaz belirteçleri `device.token.rotate` ve
  `device.token.revoke` ile döndürülebilir/geçersiz kılınabilir (`operator.pairing` kapsamı gerekir).
- Belirteç verme/döndürme, o cihazın eşleştirme girdisinde kaydedilen onaylı rol kümesiyle sınırlı kalır; bir belirteci döndürmek, cihazı eşleştirme onayının hiç vermediği bir role genişletemez.
- Eşleştirilmiş cihaz belirteci oturumlarında, çağıranın ayrıca `operator.admin` yetkisi yoksa cihaz yönetimi kendine kapsamlıdır: yönetici olmayan çağıranlar yalnızca **kendi** cihaz girdilerini kaldırabilir/geçersiz kılabilir/döndürebilir.
- `device.token.rotate`, istenen operator kapsam kümesini de çağıranın mevcut oturum kapsamlarına göre denetler. Yönetici olmayan çağıranlar, bir belirteci zaten sahip olduklarından daha geniş bir operator kapsam kümesine döndüremez.
- Kimlik doğrulama hataları `error.details.code` ile birlikte kurtarma ipuçları içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilir istemciler, önbelleğe alınmış cihaz başına belirteçle sınırlı tek bir yeniden deneme yapabilir.
  - Bu yeniden deneme başarısız olursa istemciler otomatik yeniden bağlantı döngülerini durdurmalı ve operator eylem yönlendirmesini göstermelidir.

## Cihaz kimliği + eşleştirme

- Node'lar, anahtar çifti parmak izinden türetilmiş kararlı bir cihaz kimliği (`device.id`) içermelidir.
- Gateway'ler cihaz + rol başına belirteç verir.
- Yerel otomatik onay etkin değilse yeni cihaz kimlikleri için eşleştirme onayları gerekir.
- Eşleştirme otomatik onayı, doğrudan yerel local loopback bağlantılarına odaklanır.
- OpenClaw ayrıca güvenilir paylaşılan gizli anahtar yardımcı akışları için dar bir arka uç/container yerel kendi kendine bağlanma yoluna sahiptir.
- Aynı ana makinedeki tailnet veya LAN bağlantıları hâlâ uzak olarak değerlendirilir ve onay gerektirir.
- Tüm WS istemcileri `connect` sırasında `device` kimliği içermelidir (operator + node).
  Control UI bunu yalnızca şu kiplerde atlayabilir:
  - yalnızca localhost güvensiz HTTP uyumluluğu için `gateway.controlUi.allowInsecureAuth=true`.
  - başarılı `gateway.auth.mode: "trusted-proxy"` operator Control UI kimlik doğrulaması.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (acil durum, ciddi güvenlik düşüşü).
- Tüm bağlantılar, sunucunun sağladığı `connect.challenge` nonce değerini imzalamalıdır.

### Cihaz kimlik doğrulama geçiş tanılamaları

Hâlâ challenge öncesi imzalama davranışı kullanan eski istemciler için, `connect` artık
kararlı bir `error.details.reason` altında `error.details.code` içinde `DEVICE_AUTH_*` ayrıntı kodlarını döndürür.

Yaygın geçiş hataları:

| Mesaj | details.code | details.reason | Anlamı |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required` | `DEVICE_AUTH_NONCE_REQUIRED` | `device-nonce-missing` | İstemci `device.nonce` değerini göndermedi (veya boş gönderdi). |
| `device nonce mismatch` | `DEVICE_AUTH_NONCE_MISMATCH` | `device-nonce-mismatch` | İstemci eski/yanlış bir nonce ile imzaladı. |
| `device signature invalid` | `DEVICE_AUTH_SIGNATURE_INVALID` | `device-signature` | İmza yükü v2 yüküyle eşleşmiyor. |
| `device signature expired` | `DEVICE_AUTH_SIGNATURE_EXPIRED` | `device-signature-stale` | İmzalanmış zaman damgası izin verilen sapmanın dışında. |
| `device identity mismatch` | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch` | `device.id`, açık anahtar parmak iziyle eşleşmiyor. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key` | Açık anahtar biçimi/kurallı hale getirme başarısız oldu. |

Geçiş hedefi:

- Her zaman `connect.challenge` bekleyin.
- Sunucu nonce değerini içeren v2 yükünü imzalayın.
- Aynı nonce değerini `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza yükü `v3`'tür; bu, `platform` ve `deviceFamily` alanlarını
  cihaz/istemci/rol/kapsamlar/belirteç/nonce alanlarına ek olarak bağlar.
- Eski `v2` imzaları uyumluluk için kabul edilmeye devam eder, ancak eşleştirilmiş cihaz
  meta veri sabitlemesi yeniden bağlantıda komut ilkesini yine de denetler.

## TLS + sabitleme

- WS bağlantıları için TLS desteklenir.
- İstemciler isteğe bağlı olarak gateway sertifika parmak izini sabitleyebilir
  (bkz. `gateway.tls` yapılandırması ile `gateway.remote.tlsFingerprint` veya CLI `--tls-fingerprint`).

## Kapsam

Bu protokol **tam gateway API'sini** açığa çıkarır (durum, kanallar, modeller, sohbet,
agent, oturumlar, node'lar, onaylar vb.). Kesin yüzey,
`src/gateway/protocol/schema.ts` içindeki TypeBox şemalarıyla tanımlanır.
