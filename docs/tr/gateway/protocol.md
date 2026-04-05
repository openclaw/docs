---
read_when:
    - Gateway WS istemcilerini uygularken veya güncellerken
    - Protokol uyumsuzluklarını veya bağlantı hatalarını hata ayıklarken
    - Protokol şemasını/modellerini yeniden üretirken
summary: 'Gateway WebSocket protokolü: el sıkışma, çerçeveler, sürümleme'
title: Gateway Protocol
x-i18n:
    generated_at: "2026-04-05T13:55:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: c37f5b686562dda3ba3516ac6982ad87b2f01d8148233284e9917099c6e96d87
    source_path: gateway/protocol.md
    workflow: 15
---

# Gateway protokolü (WebSocket)

Gateway WS protokolü, OpenClaw için **tek denetim düzlemi + düğüm taşımasıdır**. Tüm istemciler (CLI, web UI, macOS uygulaması, iOS/Android düğümleri, başsız düğümler) WebSocket üzerinden bağlanır ve el sıkışma sırasında **rollerini** + **kapsamlarını** bildirir.

## Taşıma

- WebSocket, JSON yükleri içeren metin çerçeveleri.
- İlk çerçeve **zorunlu olarak** bir `connect` isteği olmalıdır.

## El sıkışma (`connect`)

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
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

Bir cihaz token'ı verildiğinde `hello-ok` ayrıca şunları içerir:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilen bootstrap devir teslimi sırasında `hello-ok.auth`, `deviceTokens` içinde ek sınırlı rol girdileri de içerebilir:

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

Yerleşik düğüm/operatör bootstrap akışı için birincil düğüm token'ı
`scopes: []` olarak kalır ve devredilen herhangi bir operatör token'ı bootstrap
operatör izin listesiyle sınırlı kalır (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap kapsam denetimleri
rol önekli kalır: operatör girdileri yalnızca operatör isteklerini karşılar ve
operatör olmayan rollerin kendi rol önekleri altında yine kapsamları olması gerekir.

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

Yan etki oluşturan yöntemler **idempotency key** gerektirir (bkz. şema).

## Roller + kapsamlar

### Roller

- `operator` = denetim düzlemi istemcisi (CLI/UI/otomasyon).
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

Plugin kaydıyla eklenen gateway RPC yöntemleri kendi operatör kapsamını isteyebilir, ancak
ayrılmış çekirdek yönetici önekleri (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) her zaman `operator.admin` olarak çözülür.

Yöntem kapsamı yalnızca ilk geçittir. Bazı slash komutları
`chat.send` üzerinden ulaşıldığında bunun üzerine daha katı komut düzeyi denetimleri uygular. Örneğin kalıcı
`/config set` ve `/config unset` yazmaları `operator.admin` gerektirir.

`node.pair.approve` ayrıca temel yöntem kapsamına ek olarak ek bir onay zamanı kapsam denetimi içerir:

- komutsuz istekler: `operator.pairing`
- `exec` olmayan düğüm komutlu istekler: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which` içeren istekler:
  `operator.pairing` + `operator.admin`

### `caps`/`commands`/`permissions` (`node`)

Düğümler bağlantı anında yetenek beyanlarını bildirir:

- `caps`: üst düzey yetenek kategorileri.
- `commands`: `invoke` için komut izin listesi.
- `permissions`: ayrıntılı açma/kapama anahtarları (ör. `screen.record`, `camera.capture`).

Gateway bunları **beyan** olarak değerlendirir ve sunucu tarafı izin listeleri uygular.

## Presence

- `system-presence`, cihaz kimliğine göre anahtarlanmış girdiler döndürür.
- Presence girdileri `deviceId`, `roles` ve `scopes` içerir; böylece kullanıcı arayüzleri bir cihaz hem **operator** hem de **node** olarak bağlandığında bile cihaz başına tek satır gösterebilir.

## Yaygın RPC yöntem aileleri

Bu sayfa oluşturulmuş tam bir döküm değildir, ancak genel WS yüzeyi yukarıdaki el sıkışma/kimlik doğrulama örneklerinden daha geniştir. Bunlar Gateway'in bugün sunduğu başlıca yöntem aileleridir.

`hello-ok.features.methods`, `src/gateway/server-methods-list.ts` ile yüklenen plugin/kanal yöntem dışa aktarımlarından oluşturulan muhafazakâr bir keşif listesidir.
Bunu özellik keşfi olarak değerlendirin; `src/gateway/server-methods/*.ts` içinde uygulanan her çağrılabilir yardımcı işlevin oluşturulmuş tam dökümü olarak değil.

### Sistem ve kimlik

- `health`, önbelleğe alınmış veya yeni yoklanmış gateway sağlık anlık görüntüsünü döndürür.
- `status`, `/status` benzeri gateway özetini döndürür; hassas alanlar yalnızca
  yönetici kapsamlı operator istemcilerine dahil edilir.
- `gateway.identity.get`, relay ve eşleştirme akışlarında kullanılan gateway cihaz kimliğini döndürür.
- `system-presence`, bağlı operator/node cihazları için geçerli presence anlık görüntüsünü döndürür.
- `system-event`, bir sistem olayı ekler ve presence bağlamını güncelleyebilir/yayınlayabilir.
- `last-heartbeat`, en son kalıcılaştırılmış heartbeat olayını döndürür.
- `set-heartbeats`, gateway üzerinde heartbeat işlemeyi açar/kapatır.

### Modeller ve kullanım

- `models.list`, çalışma zamanında izin verilen model kataloğunu döndürür.
- `usage.status`, sağlayıcı kullanım pencerelerini/kalan kota özetlerini döndürür.
- `usage.cost`, bir tarih aralığı için birleştirilmiş maliyet kullanım özetlerini döndürür.
- `doctor.memory.status`, etkin varsayılan ajan çalışma alanı için vektör bellek / embedding hazırlığını döndürür.
- `sessions.usage`, oturum başına kullanım özetlerini döndürür.
- `sessions.usage.timeseries`, tek bir oturum için zaman serisi kullanımını döndürür.
- `sessions.usage.logs`, tek bir oturum için kullanım günlüğü girdilerini döndürür.

### Kanallar ve giriş yardımcıları

- `channels.status`, yerleşik + paketlenmiş kanal/plugin durum özetlerini döndürür.
- `channels.logout`, kanal çıkışı destekliyorsa belirli bir kanal/hesap için oturumu kapatır.
- `web.login.start`, mevcut QR destekli web kanal sağlayıcısı için bir QR/web giriş akışı başlatır.
- `web.login.wait`, bu QR/web giriş akışının tamamlanmasını bekler ve başarı durumunda kanalı başlatır.
- `push.test`, kayıtlı bir iOS düğümüne test APNs push'u gönderir.
- `voicewake.get`, depolanan uyandırma kelimesi tetikleyicilerini döndürür.
- `voicewake.set`, uyandırma kelimesi tetikleyicilerini günceller ve değişikliği yayınlar.

### Mesajlaşma ve günlükler

- `send`, sohbet çalıştırıcısı dışındaki kanal/hesap/konu hedefli gönderimler için doğrudan giden teslim RPC'sidir.
- `logs.tail`, imleç/sınır ve en fazla bayt denetimleriyle yapılandırılmış gateway dosya günlüğü sonunu döndürür.

### Talk ve TTS

- `talk.config`, etkin Talk yapılandırma yükünü döndürür; `includeSecrets`,
  `operator.talk.secrets` (veya `operator.admin`) gerektirir.
- `talk.mode`, WebChat/Control UI istemcileri için geçerli Talk modu durumunu ayarlar/yayınlar.
- `talk.speak`, etkin Talk konuşma sağlayıcısı üzerinden konuşma sentezler.
- `tts.status`, TTS etkin durumunu, etkin sağlayıcıyı, yedek sağlayıcıları
  ve sağlayıcı yapılandırma durumunu döndürür.
- `tts.providers`, görünür TTS sağlayıcı envanterini döndürür.
- `tts.enable` ve `tts.disable`, TTS tercih durumunu açar/kapatır.
- `tts.setProvider`, tercih edilen TTS sağlayıcısını günceller.
- `tts.convert`, tek seferlik metinden konuşmaya dönüşüm çalıştırır.

### Secrets, yapılandırma, update ve wizard

- `secrets.reload`, etkin SecretRef'leri yeniden çözümler ve çalışma zamanı secret durumunu
  yalnızca tam başarıda değiştirir.
- `secrets.resolve`, belirli bir komut/hedef kümesi için komut hedefli secret atamalarını çözümler.
- `config.get`, geçerli yapılandırma anlık görüntüsünü ve hash'ini döndürür.
- `config.set`, doğrulanmış bir yapılandırma yükü yazar.
- `config.patch`, kısmi bir yapılandırma güncellemesini birleştirir.
- `config.apply`, tam yapılandırma yükünü doğrular + değiştirir.
- `config.schema`, Control UI ve
  CLI araçları tarafından kullanılan canlı yapılandırma şeması yükünü döndürür: şema, `uiHints`, sürüm ve üretim meta verisi,
  buna çalışma zamanı yükleyebildiğinde plugin + kanal şeması meta verisi de dahildir. Şema,
  kullanıcı arayüzü tarafından kullanılan aynı etiketlerden ve yardım metninden türetilen alan `title` / `description` meta verisini içerir;
  buna eşleşen alan belgeleri mevcut olduğunda iç içe nesne, joker karakter, dizi öğesi
  ve `anyOf` / `oneOf` / `allOf` bileşim dalları da dahildir.
- `config.schema.lookup`, tek bir yapılandırma
  yolu için yol kapsamlı bir arama yükü döndürür: normalized yol, sığ bir şema düğümü, eşleşen `hint` + `hintPath` ve
  UI/CLI ayrıntılı inceleme için hemen alt çocuk özetleri.
  - Arama şema düğümleri kullanıcıya dönük belgeleri ve yaygın doğrulama alanlarını korur:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    sayısal/string/dizi/nesne sınırları ve
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi boolean bayraklar.
  - Çocuk özetleri `key`, normalized `path`, `type`, `required`,
    `hasChildren` ile eşleşen `hint` / `hintPath` değerlerini gösterir.
- `update.run`, gateway update akışını çalıştırır ve yalnızca
  update işleminin kendisi başarılıysa yeniden başlatma zamanlar.
- `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`,
  onboarding wizard'ını WS RPC üzerinden sunar.

### Mevcut büyük aileler

#### Ajan ve çalışma alanı yardımcıları

- `agents.list`, yapılandırılmış ajan girdilerini döndürür.
- `agents.create`, `agents.update` ve `agents.delete`, ajan kayıtlarını ve çalışma alanı bağlantılarını yönetir.
- `agents.files.list`, `agents.files.get` ve `agents.files.set`, bir ajan için açılan bootstrap çalışma alanı dosyalarını yönetir.
- `agent.identity.get`, bir ajan veya
  oturum için etkin asistan kimliğini döndürür.
- `agent.wait`, bir çalıştırmanın bitmesini bekler ve mevcutsa son durum anlık görüntüsünü döndürür.

#### Oturum denetimi

- `sessions.list`, geçerli oturum dizinini döndürür.
- `sessions.subscribe` ve `sessions.unsubscribe`, geçerli WS istemcisi için
  oturum değişikliği olay aboneliklerini açar/kapatır.
- `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`,
  tek bir oturum için transcript/mesaj olay aboneliklerini açar/kapatır.
- `sessions.preview`, belirli oturum anahtarları için sınırlı transcript önizlemeleri döndürür.
- `sessions.resolve`, bir oturum hedefini çözümler veya kanonikleştirir.
- `sessions.create`, yeni bir oturum girdisi oluşturur.
- `sessions.send`, mevcut bir oturuma mesaj gönderir.
- `sessions.steer`, etkin bir oturum için kes-ve-yönlendir varyantıdır.
- `sessions.abort`, bir oturum için etkin işleri durdurur.
- `sessions.patch`, oturum meta verilerini/override'larını günceller.
- `sessions.reset`, `sessions.delete` ve `sessions.compact`, oturum bakım işlemlerini yürütür.
- `sessions.get`, depolanan tam oturum satırını döndürür.
- sohbet yürütmesi yine de `chat.history`, `chat.send`, `chat.abort` ve
  `chat.inject` kullanır.
- `chat.history`, UI istemcileri için gösterim-normalized'dir: satır içi directive etiketleri görünür metinden kaldırılır,
  düz metin tool-call XML yükleri (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve
  kırpılmış tool-call blokları dahil) ve sızdırılmış ASCII/tam genişlikte model kontrol token'ları
  kaldırılır, tam olarak `NO_REPLY` /
  `no_reply` gibi yalnızca sessiz token içeren asistan satırları atlanır ve
  aşırı büyük satırlar yer tutucularla değiştirilebilir.

#### Cihaz eşleştirme ve cihaz token'ları

- `device.pair.list`, bekleyen ve onaylanmış eşleştirilmiş cihazları döndürür.
- `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`,
  cihaz eşleştirme kayıtlarını yönetir.
- `device.token.rotate`, onaylanmış rol ve kapsam sınırları içinde eşleştirilmiş bir cihaz token'ını döndürür.
- `device.token.revoke`, eşleştirilmiş bir cihaz token'ını iptal eder.

#### Düğüm eşleştirme, invoke ve bekleyen işler

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` ve `node.pair.verify`, düğüm eşleştirme ve bootstrap doğrulamayı kapsar.
- `node.list` ve `node.describe`, bilinen/bağlı düğüm durumunu döndürür.
- `node.rename`, eşleştirilmiş bir düğüm etiketini günceller.
- `node.invoke`, bir komutu bağlı bir düğüme iletir.
- `node.invoke.result`, bir invoke isteğinin sonucunu döndürür.
- `node.event`, düğüm kaynaklı olayları tekrar gateway'e taşır.
- `node.canvas.capability.refresh`, kapsamlı canvas yetenek token'larını yeniler.
- `node.pending.pull` ve `node.pending.ack`, bağlı düğüm kuyruk API'leridir.
- `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısız düğümler için kalıcı bekleyen işleri yönetir.

#### Onay aileleri

- `exec.approval.request` ve `exec.approval.resolve`, tek seferlik exec
  onay isteklerini kapsar.
- `exec.approval.waitDecision`, tek bir bekleyen exec onayını bekler ve
  son kararı döndürür (veya zaman aşımında `null`).
- `exec.approvals.get` ve `exec.approvals.set`, gateway exec onay
  ilke anlık görüntülerini yönetir.
- `exec.approvals.node.get` ve `exec.approvals.node.set`, düğüm yerel exec
  onay ilkesini düğüm relay komutları üzerinden yönetir.
- `plugin.approval.request`, `plugin.approval.waitDecision` ve
  `plugin.approval.resolve`, plugin tanımlı onay akışlarını kapsar.

#### Diğer büyük aileler

- otomasyon:
  - `wake`, anında veya sonraki heartbeat için metin ekleme zamanlar
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- skills/tools: `skills.*`, `tools.catalog`, `tools.effective`

### Yaygın olay aileleri

- `chat`: `chat.inject` ve diğer yalnızca transcript sohbet olayları gibi UI sohbet güncellemeleri.
- `session.message` ve `session.tool`: abone olunan bir oturum için transcript/olay akışı güncellemeleri.
- `sessions.changed`: oturum dizini veya meta veri değişti.
- `presence`: sistem presence anlık görüntüsü güncellemeleri.
- `tick`: periyodik keepalive / canlılık olayı.
- `health`: gateway sağlık anlık görüntüsü güncellemesi.
- `heartbeat`: heartbeat olay akışı güncellemesi.
- `cron`: cron çalıştırması/iş değişikliği olayı.
- `shutdown`: gateway kapanış bildirimi.
- `node.pair.requested` / `node.pair.resolved`: düğüm eşleştirme yaşam döngüsü.
- `node.invoke.request`: düğüm invoke isteği yayını.
- `device.pair.requested` / `device.pair.resolved`: eşleştirilmiş cihaz yaşam döngüsü.
- `voicewake.changed`: uyandırma kelimesi tetikleyici yapılandırması değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onay
  yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin onay
  yaşam döngüsü.

### Düğüm yardımcı yöntemleri

- Düğümler, otomatik izin denetimleri için geçerli skill çalıştırılabilir dosyaları listesini almak üzere `skills.bins` çağırabilir.

### Operatör yardımcı yöntemleri

- Operatörler, bir ajanın çalışma zamanı tool kataloğunu almak için `tools.catalog` (`operator.read`) çağırabilir.
  Yanıt gruplanmış tools ve kaynak meta verisi içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda plugin sahibi
  - `optional`: bir plugin tool'unun isteğe bağlı olup olmadığı
- Operatörler, bir oturum için çalışma zamanında etkin tool
  envanterini almak üzere `tools.effective` (`operator.read`) çağırabilir.
  - `sessionKey` gereklidir.
  - Gateway, çağıranın sağladığı
    kimlik doğrulama veya teslim bağlamını kabul etmek yerine güvenilir çalışma zamanı bağlamını oturumdan sunucu tarafında türetir.
  - Yanıt oturum kapsamlıdır ve etkin konuşmanın şu anda kullanabileceği şeyi yansıtır;
    buna çekirdek, plugin ve kanal tools da dahildir.
- Operatörler, bir ajan için görünür
  skill envanterini almak üzere `skills.status` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan ajan çalışma alanını okumak için bunu atlayın.
  - Yanıt uygunluk, eksik gereksinimler, yapılandırma denetimleri ve
    ham secret değerlerini açığa çıkarmadan temizlenmiş kurulum seçenekleri içerir.
- Operatörler, ClawHub keşif meta verisi için `skills.search` ve `skills.detail` (`operator.read`) çağırabilir.
- Operatörler, `skills.install` (`operator.admin`) yöntemini iki modda çağırabilir:
  - ClawHub modu: `{ source: "clawhub", slug, version?, force? }`, bir
    skill klasörünü varsayılan ajan çalışma alanı `skills/` dizinine kurar.
  - Gateway installer modu: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    gateway ana makinesinde tanımlanmış bir `metadata.openclaw.install` eylemi çalıştırır.
- Operatörler, `skills.update` (`operator.admin`) yöntemini iki modda çağırabilir:
  - ClawHub modu, varsayılan ajan çalışma alanındaki bir izlenen slug'ı veya tüm izlenen ClawHub kurulumlarını günceller.
  - Yapılandırma modu, `skills.entries.<skillKey>` değerlerini (`enabled`,
    `apiKey` ve `env` gibi) patch eder.

## Exec onayları

- Bir exec isteği onay gerektirdiğinde gateway `exec.approval.requested` yayınlar.
- Operatör istemcileri `exec.approval.resolve` çağırarak çözümler (`operator.approvals` kapsamı gerekir).
- `host=node` için `exec.approval.request`, `systemRunPlan` içermelidir (kanonik `argv`/`cwd`/`rawCommand`/oturum meta verisi). `systemRunPlan` eksik istekler reddedilir.
- Onaydan sonra iletilen `node.invoke system.run` çağrıları, bu kanonik
  `systemRunPlan` değerini yetkili komut/cwd/oturum bağlamı olarak yeniden kullanır.
- Bir çağıran hazırlık ile son onaylı `system.run` iletimi arasında `command`, `rawCommand`, `cwd`, `agentId` veya
  `sessionKey` değerlerini değiştirirse gateway, değiştirilen yüke güvenmek yerine çalıştırmayı reddeder.

## Ajan teslim geri dönüşü

- `agent` istekleri giden teslim istemek için `deliver=true` içerebilir.
- `bestEffortDeliver=false`, katı davranışı korur: çözümlenmemiş veya yalnızca dahili teslim hedefleri `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici teslim edilebilir bir rota çözümlenemediğinde oturum-only yürütmeye geri dönüşe izin verir (örneğin dahili/webchat oturumları veya belirsiz çok kanallı yapılandırmalar).

## Sürümleme

- `PROTOCOL_VERSION`, `src/gateway/protocol/schema.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu uyumsuzlukları reddeder.
- Şemalar + modeller TypeBox tanımlarından üretilir:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## Kimlik doğrulama

- Paylaşılan secret gateway kimlik doğrulaması, yapılandırılmış auth moduna bağlı olarak `connect.params.auth.token` veya
  `connect.params.auth.password` kullanır.
- Tailscale Serve
  (`gateway.auth.allowTailscale: true`) veya loopback dışı
  `gateway.auth.mode: "trusted-proxy"` gibi kimlik taşıyan modlar, `connect.params.auth.*` yerine
  istek başlıklarından gelen bağlantı auth denetimini karşılar.
- Özel giriş `gateway.auth.mode: "none"`, paylaşılan secret bağlantı auth'unu
  tamamen atlar; bu modu genel/güvenilmeyen girişte açmayın.
- Eşleştirmeden sonra Gateway, bağlantı
  rolü + kapsamlarına sınırlı bir **cihaz token'ı** verir. Bu, `hello-ok.auth.deviceToken` içinde döner ve istemci tarafından gelecekteki bağlantılar için kalıcılaştırılmalıdır.
- İstemciler, başarılı herhangi bir bağlantıdan sonra birincil `hello-ok.auth.deviceToken` değerini kalıcılaştırmalıdır.
- Bu **depolanan** cihaz token'ıyla yeniden bağlanma, o token için depolanan
  onaylı kapsam kümesini de yeniden kullanmalıdır. Bu, zaten verilmiş okuma/yoklama/status erişimini korur ve yeniden bağlantıların
  daha dar örtük bir yönetici-only kapsama sessizce düşmesini önler.
- Normal bağlantı auth önceliği şu şekildedir: önce açık paylaşılan token/parola, sonra
  açık `deviceToken`, sonra cihaz başına depolanan token, sonra bootstrap token.
- Ek `hello-ok.auth.deviceTokens` girdileri bootstrap devir token'larıdır.
  Bunları yalnızca bağlantı `wss://` veya loopback/yerel eşleştirme gibi güvenilir bir taşıma üzerinde bootstrap auth kullandıysa kalıcılaştırın.
- Bir istemci **açık** bir `deviceToken` veya açık `scopes` sağlarsa bu
  çağıranın istediği kapsam kümesi yetkili kalır; önbelleğe alınmış kapsamlar yalnızca istemci depolanan cihaz başına token'ı yeniden kullanıyorsa yeniden kullanılır.
- Cihaz token'ları `device.token.rotate` ve
  `device.token.revoke` ile döndürülebilir/iptal edilebilir (`operator.pairing` kapsamı gerekir).
- Token verme/döndürme, o cihazın eşleştirme girdisinde
  kaydedilmiş onaylı rol kümesine sınırlı kalır; bir token'ı döndürmek cihazı eşleştirme onayının hiç vermediği bir
  role genişletemez.
- Eşleştirilmiş cihaz token oturumları için, çağıranın ayrıca `operator.admin` kapsamı yoksa cihaz yönetimi öz-kapsamlıdır:
  yönetici olmayan çağıranlar yalnızca **kendi** cihaz girdilerini kaldırabilir/iptal edebilir/döndürebilir.
- `device.token.rotate`, istenen operatör kapsam kümesini çağıranın
  geçerli oturum kapsamlarına göre de denetler. Yönetici olmayan çağıranlar bir token'ı hâlihazırda sahip olduklarından daha geniş bir operatör kapsam kümesine döndüremez.
- Kimlik doğrulama hataları `error.details.code` ile birlikte kurtarma ipuçları içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilen istemciler, önbelleğe alınmış cihaz başına token ile bir sınırlı yeniden deneme yapabilir.
  - Bu yeniden deneme başarısız olursa istemciler otomatik yeniden bağlanma döngülerini durdurmalı ve operatör eylem rehberliği göstermelidir.

## Cihaz kimliği + eşleştirme

- Düğümler, bir anahtar çifti fingerprint'inden türetilmiş kararlı bir cihaz kimliği (`device.id`) içermelidir.
- Gateway'ler cihaz + rol başına token verir.
- Yerel otomatik onay etkin değilse yeni cihaz kimlikleri için eşleştirme onayı gerekir.
- Eşleştirme otomatik onayı doğrudan yerel loopback bağlantıları etrafında merkezlenmiştir.
- OpenClaw ayrıca güvenilen paylaşılan secret yardımcı akışları için dar bir backend/container yerel self-connect yoluna da sahiptir.
- Aynı ana makine üzerindeki tailnet veya LAN bağlantıları hâlâ uzak kabul edilir ve eşleştirme için onay gerektirir.
- Tüm WS istemcileri `connect` sırasında `device` kimliği içermelidir (`operator` + `node`).
  Control UI bunu yalnızca şu modlarda atlayabilir:
  - localhost-only güvensiz HTTP uyumluluğu için `gateway.controlUi.allowInsecureAuth=true`.
  - başarılı `gateway.auth.mode: "trusted-proxy"` operator Control UI auth.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (acil durum cam kırma, ciddi güvenlik düşüşü).
- Tüm bağlantılar sunucu tarafından sağlanan `connect.challenge` nonce'unu imzalamalıdır.

### Cihaz kimlik doğrulama geçiş tanılamaları

Hâlâ challenge öncesi imzalama davranışını kullanan eski istemciler için `connect`,
şimdi `error.details.reason` altında kararlı bir `error.details.reason` ile `error.details.code` içinde
`DEVICE_AUTH_*` ayrıntı kodları döndürür.

Yaygın geçiş hataları:

| Mesaj                       | details.code                     | details.reason           | Anlamı                                            |
| --------------------------- | -------------------------------- | ------------------------ | ------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | İstemci `device.nonce` değerini atladı (veya boş gönderdi). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | İstemci eski/yanlış nonce ile imzaladı.           |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | İmza yükü v2 yüküyle eşleşmiyor.                  |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | İmzalanan zaman damgası izin verilen sapmanın dışında. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`, genel anahtar fingerprint'iyle eşleşmiyor. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Genel anahtar biçimi/kanonikleştirmesi başarısız oldu. |

Geçiş hedefi:

- Her zaman `connect.challenge` bekleyin.
- Sunucu nonce'unu içeren v2 yükünü imzalayın.
- Aynı nonce'u `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza yükü, device/client/role/scopes/token/nonce alanlarına ek olarak `platform` ve `deviceFamily` bağlayan `v3`'tür.
- Eski `v2` imzaları uyumluluk için kabul edilmeye devam eder, ancak eşleştirilmiş cihaz
  meta veri sabitleme yine de yeniden bağlantıda komut ilkesini denetler.

## TLS + sabitleme

- WS bağlantıları için TLS desteklenir.
- İstemciler isteğe bağlı olarak gateway sertifika fingerprint'ini sabitleyebilir (bkz. `gateway.tls`
  yapılandırması ile `gateway.remote.tlsFingerprint` veya CLI `--tls-fingerprint`).

## Kapsam

Bu protokol **tam gateway API'sini** açar (status, channels, models, chat,
agent, sessions, nodes, approvals, vb.). Tam yüzey `src/gateway/protocol/schema.ts` içindeki
TypeBox şemaları tarafından tanımlanır.
