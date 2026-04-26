---
read_when:
    - Gateway WS istemcilerini uygulama veya güncelleme
    - Protokol uyumsuzluklarını veya bağlantı hatalarını ayıklama
    - Protokol şemasını/modellerini yeniden oluşturma
summary: 'Gateway WebSocket protokolü: handshake, çerçeveler, sürümleme'
title: Gateway protokolü
x-i18n:
    generated_at: "2026-04-26T11:30:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01f873c7051f2a462cbefb50331e04edfdcedadeda8b3d7b7320ceb2462edccc
    source_path: gateway/protocol.md
    workflow: 15
---

Gateway WS protokolü, OpenClaw için **tek kontrol düzlemi + Node taşımasıdır**.
Tüm istemciler (CLI, web UI, macOS uygulaması, iOS/Android Node'ları, headless
Node'lar) WebSocket üzerinden bağlanır ve handshake sırasında
**rollerini** + **kapsamlarını** bildirir.

## Taşıma

- WebSocket, JSON payload'lu metin çerçeveleri.
- İlk çerçeve **zorunlu olarak** bir `connect` isteği olmalıdır.
- Bağlantı öncesi çerçeveler 64 KiB ile sınırlıdır. Başarılı bir handshake'ten sonra istemciler
  `hello-ok.policy.maxPayload` ve
  `hello-ok.policy.maxBufferedBytes` sınırlarına uymalıdır. Tanılama etkinken,
  aşırı büyük gelen çerçeveler ve yavaş giden tamponlar, gateway etkilenen çerçeveyi kapatmadan veya düşürmeden önce
  `payload.large` olayları üretir. Bu olaylar
  boyutları, sınırları, yüzeyleri ve güvenli neden kodlarını tutar. Mesaj
  gövdesini, ek içeriklerini, ham çerçeve gövdesini, token'ları, cookie'leri veya secret değerlerini tutmazlar.

## Handshake (`connect`)

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
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot` ve `policy`, şema tarafından zorunlu tutulur
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` isteğe bağlıdır. `auth`,
kullanılabildiğinde pazarlığı yapılan rolü/kapsamları bildirir ve gateway bir
`deviceToken` verirse bunu da içerir.

Device token verilmediğinde `hello-ok.auth`, pazarlığı yapılan
izinleri yine de bildirebilir:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilen aynı süreç içi backend istemcileri (`client.id: "gateway-client"`,
`client.mode: "backend"`), paylaşılan gateway token/password ile
kimlik doğruladıklarında doğrudan loopback bağlantılarında `device` alanını atlayabilir.
Bu yol dahili kontrol düzlemi RPC'leri için ayrılmıştır ve bayat CLI/cihaz eşleştirme temellerinin
subagent oturum güncellemeleri gibi yerel backend işlerini engellemesini önler. Uzak istemciler,
tarayıcı kökenli istemciler, Node istemcileri ve açık device-token/device-identity
istemcileri yine normal eşleştirme ve kapsam yükseltme denetimlerini kullanır.

Bir device token verildiğinde `hello-ok` ayrıca şunu da içerir:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilen bootstrap devri sırasında `hello-ok.auth`,
`deviceTokens` içinde ek sınırlı rol girdileri de içerebilir:

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

Yerleşik Node/operator bootstrap akışı için birincil Node token'ı
`scopes: []` olarak kalır ve devredilen herhangi bir operator token'ı bootstrap
operator allowlist'i ile sınırlı kalır (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap kapsam denetimleri rol önekli
kalmaya devam eder: operator girdileri yalnızca operator isteklerini karşılar ve
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

Yan etki oluşturan yöntemler **idempotency key** gerektirir (şemaya bakın).

## Roller + kapsamlar

### Roller

- `operator` = kontrol düzlemi istemcisi (CLI/UI/otomasyon).
- `node` = yetenek barındırıcısı (camera/screen/canvas/system.run).

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

Plugin kayıtlı gateway RPC yöntemleri kendi operator kapsamlarını isteyebilir, ancak
ayrılmış çekirdek yönetici önekleri (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) her zaman `operator.admin` olarak çözülür.

Yöntem kapsamı yalnızca ilk kapıdır. `chat.send` üzerinden ulaşılan bazı slash komutları
buna ek olarak daha sıkı komut düzeyi denetimleri uygular. Örneğin, kalıcı
`/config set` ve `/config unset` yazmaları `operator.admin` gerektirir.

`node.pair.approve`, temel yöntem kapsamına ek olarak ek bir
onay zamanı kapsam denetimine de sahiptir:

- komutsuz istekler: `operator.pairing`
- exec olmayan Node komutları içeren istekler: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which` içeren istekler:
  `operator.pairing` + `operator.admin`

### Yetenekler/komutlar/izinler (node)

Node'lar bağlantı sırasında yetenek beyanlarını bildirir:

- `caps`: yüksek düzey yetenek kategorileri.
- `commands`: invoke için komut allowlist'i.
- `permissions`: ayrıntılı açma/kapama bayrakları (ör. `screen.record`, `camera.capture`).

Gateway bunları **beyan** olarak ele alır ve sunucu tarafı allowlist'leri uygular.

## Presence

- `system-presence`, cihaz kimliğine göre anahtarlanmış girdiler döndürür.
- Presence girdileri `deviceId`, `roles` ve `scopes` içerir; böylece UI'ler, bir cihaz
  hem **operator** hem de **node** olarak bağlandığında bile cihaz başına tek bir satır gösterebilir.

## Yayın olaylarının kapsamlandırılması

Sunucu tarafından itilen WebSocket yayın olayları kapsamla sınırlandırılır; böylece pairing kapsamlı veya yalnızca node oturumları oturum içeriğini pasif olarak alamaz.

- **Sohbet, ajan ve araç sonucu çerçeveleri** (akış halindeki `agent` olayları ve araç çağrısı sonuçları dâhil) en az `operator.read` gerektirir. `operator.read` olmayan oturumlar bu çerçeveleri tamamen atlar.
- **Plugin tanımlı `plugin.*` yayınları**, plugin'in onları nasıl kaydettiğine bağlı olarak `operator.write` veya `operator.admin` ile sınırlandırılır.
- **Durum ve taşıma olayları** (`heartbeat`, `presence`, `tick`, connect/disconnect yaşam döngüsü vb.) taşıma sağlığı her kimliği doğrulanmış oturum tarafından gözlemlenebilir kalsın diye sınırsız kalır.
- **Bilinmeyen yayın olay aileleri**, kayıtlı bir işleyici bunları açıkça gevşetmedikçe varsayılan olarak kapsamla sınırlandırılır (kapalı hata verir).

Her istemci bağlantısı kendi istemci başına sıra numarasını tutar; böylece yayınlar, farklı istemciler olay akışının kapsamla filtrelenmiş farklı alt kümelerini görse bile o sokette monoton sıralamayı korur.

## Yaygın RPC yöntem aileleri

Genel WS yüzeyi, yukarıdaki handshake/auth örneklerinden daha geniştir. Bu,
üretilmiş bir döküm değildir — `hello-ok.features.methods`, `src/gateway/server-methods-list.ts` ile yüklenmiş
plugin/kanal yöntem export'larından oluşturulan muhafazakâr bir
keşif listesidir. Bunu `src/gateway/server-methods/*.ts` için tam bir
numaralandırma olarak değil, özellik keşfi olarak değerlendirin.

<AccordionGroup>
  <Accordion title="Sistem ve kimlik">
    - `health`, önbelleğe alınmış veya taze yoklanmış gateway sağlık snapshot'ını döndürür.
    - `diagnostics.stability`, son sınırlı tanılama kararlılık kaydedicisini döndürür. Olay adları, sayılar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/plugin adları ve oturum kimlikleri gibi operasyonel metadata'yı tutar. Sohbet metni, Webhook gövdeleri, araç çıktıları, ham istek veya yanıt gövdeleri, token'lar, cookie'ler veya secret değerlerini tutmaz. Operator read kapsamı gerekir.
    - `status`, `/status` tarzı gateway özetini döndürür; hassas alanlar yalnızca admin kapsamlı operator istemcileri için eklenir.
    - `gateway.identity.get`, relay ve eşleştirme akışlarında kullanılan gateway cihaz kimliğini döndürür.
    - `system-presence`, bağlı operator/node cihazları için geçerli presence snapshot'ını döndürür.
    - `system-event`, bir sistem olayı ekler ve presence bağlamını güncelleyebilir/yayınlayabilir.
    - `last-heartbeat`, en son kalıcı Heartbeat olayını döndürür.
    - `set-heartbeats`, gateway üzerinde Heartbeat işlemeyi açar/kapatır.
  </Accordion>

  <Accordion title="Modeller ve kullanım">
    - `models.list`, çalışma anında izin verilen model kataloğunu döndürür.
    - `usage.status`, sağlayıcı kullanım pencerelerini/kalan kota özetlerini döndürür.
    - `usage.cost`, bir tarih aralığı için toplu maliyet kullanım özetlerini döndürür.
    - `doctor.memory.status`, etkin varsayılan ajan çalışma alanı için vektör bellek / embedding hazır olma durumunu döndürür.
    - `sessions.usage`, oturum başına kullanım özetlerini döndürür.
    - `sessions.usage.timeseries`, tek bir oturum için zaman serisi kullanımını döndürür.
    - `sessions.usage.logs`, tek bir oturum için kullanım günlüğü girdilerini döndürür.
  </Accordion>

  <Accordion title="Kanallar ve giriş yardımcıları">
    - `channels.status`, yerleşik + paketlenmiş kanal/plugin durum özetlerini döndürür.
    - `channels.logout`, kanal çıkışı destekliyorsa belirli bir kanal/hesaptan çıkış yapar.
    - `web.login.start`, geçerli QR destekli web kanal sağlayıcısı için bir QR/web giriş akışı başlatır.
    - `web.login.wait`, bu QR/web giriş akışının tamamlanmasını bekler ve başarı durumunda kanalı başlatır.
    - `push.test`, kayıtlı bir iOS Node'una test APNs push gönderir.
    - `voicewake.get`, depolanan uyandırma sözcüğü tetikleyicilerini döndürür.
    - `voicewake.set`, uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayınlar.
  </Accordion>

  <Accordion title="Mesajlaşma ve günlükler">
    - `send`, sohbet çalıştırıcısının dışında kanal/hesap/iş parçacığı hedefli gönderimler için doğrudan giden teslim RPC'sidir.
    - `logs.tail`, imleç/sınır ve en yüksek bayt denetimleriyle yapılandırılmış gateway dosya günlüğü son kısmını döndürür.
  </Accordion>

  <Accordion title="Talk ve TTS">
    - `talk.config`, etkin Talk yapılandırma payload'ını döndürür; `includeSecrets`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.
    - `talk.mode`, WebChat/Control UI istemcileri için geçerli Talk modu durumunu ayarlar/yayınlar.
    - `talk.speak`, etkin Talk konuşma sağlayıcısı üzerinden konuşma sentezler.
    - `tts.status`, TTS etkin durumunu, etkin sağlayıcıyı, fallback sağlayıcıları ve sağlayıcı yapılandırma durumunu döndürür.
    - `tts.providers`, görünür TTS sağlayıcı envanterini döndürür.
    - `tts.enable` ve `tts.disable`, TTS tercih durumunu açar/kapatır.
    - `tts.setProvider`, tercih edilen TTS sağlayıcısını günceller.
    - `tts.convert`, tek seferlik metinden konuşmaya dönüştürme çalıştırır.
  </Accordion>

  <Accordion title="Gizli bilgiler, yapılandırma, güncelleme ve sihirbaz">
    - `secrets.reload`, etkin SecretRef'leri yeniden çözümler ve çalışma zamanı secret durumunu yalnızca tam başarı durumunda değiştirir.
    - `secrets.resolve`, belirli bir komut/hedef kümesi için komut hedefli secret atamalarını çözümler.
    - `config.get`, geçerli yapılandırma snapshot'ını ve hash'ini döndürür.
    - `config.set`, doğrulanmış bir yapılandırma payload'ı yazar.
    - `config.patch`, kısmi bir yapılandırma güncellemesini birleştirir.
    - `config.apply`, tam yapılandırma payload'ını doğrular + değiştirir.
    - `config.schema`, Control UI ve CLI araçları tarafından kullanılan canlı yapılandırma şeması payload'ını döndürür: şema, `uiHints`, sürüm ve üretim metadata'sı; çalışma zamanı bunu yükleyebiliyorsa plugin + kanal şeması metadata'sı da dâhil. Şema, eşleşen alan dokümantasyonu mevcut olduğunda iç içe nesne, wildcard, dizi öğesi ve `anyOf` / `oneOf` / `allOf` bileşim dalları dâhil olmak üzere UI'nin kullandığı etiketler ve yardım metninden türetilen alan `title` / `description` metadata'sını içerir.
    - `config.schema.lookup`, tek bir yapılandırma yolu için yol kapsamlı lookup payload'ı döndürür: normalleştirilmiş yol, sığ bir şema düğümü, eşleşen hint + `hintPath` ve UI/CLI drill-down için anlık alt öğe özetleri. Lookup şema düğümleri kullanıcıya dönük dokümanları ve yaygın doğrulama alanlarını (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, sayısal/dize/dizi/nesne sınırları ve `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi bayraklar) korur. Alt öğe özetleri `key`, normalleştirilmiş `path`, `type`, `required`, `hasChildren` ile eşleşen `hint` / `hintPath` değerlerini açığa çıkarır.
    - `update.run`, gateway güncelleme akışını çalıştırır ve yalnızca güncellemenin kendisi başarılı olduğunda yeniden başlatma planlar.
    - `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`, onboarding sihirbazını WS RPC üzerinden sunar.
  </Accordion>

  <Accordion title="Ajan ve çalışma alanı yardımcıları">
    - `agents.list`, yapılandırılmış ajan girdilerini döndürür.
    - `agents.create`, `agents.update` ve `agents.delete`, ajan kayıtlarını ve çalışma alanı bağlantılarını yönetir.
    - `agents.files.list`, `agents.files.get` ve `agents.files.set`, bir ajan için açığa çıkarılan bootstrap çalışma alanı dosyalarını yönetir.
    - `agent.identity.get`, bir ajan veya oturum için etkin asistan kimliğini döndürür.
    - `agent.wait`, bir çalıştırmanın bitmesini bekler ve kullanılabildiğinde terminal snapshot'ını döndürür.
  </Accordion>

  <Accordion title="Oturum denetimi">
    - `sessions.list`, geçerli oturum dizinini döndürür.
    - `sessions.subscribe` ve `sessions.unsubscribe`, geçerli WS istemcisi için oturum değişikliği olay aboneliklerini açar/kapatır.
    - `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`, tek bir oturum için transkript/mesaj olay aboneliklerini açar/kapatır.
    - `sessions.preview`, belirli oturum anahtarları için sınırlı transkript önizlemeleri döndürür.
    - `sessions.resolve`, bir oturum hedefini çözümler veya kanonikleştirir.
    - `sessions.create`, yeni bir oturum girdisi oluşturur.
    - `sessions.send`, mevcut bir oturuma mesaj gönderir.
    - `sessions.steer`, etkin bir oturum için kes-ve-yönlendir varyantıdır.
    - `sessions.abort`, bir oturum için etkin işi durdurur.
    - `sessions.patch`, oturum metadata'sını/geçersiz kılmalarını günceller.
    - `sessions.reset`, `sessions.delete` ve `sessions.compact`, oturum bakımı yapar.
    - `sessions.get`, tam depolanmış oturum satırını döndürür.
    - Sohbet yürütmesi hâlâ `chat.history`, `chat.send`, `chat.abort` ve `chat.inject` kullanır. `chat.history`, UI istemcileri için görüntüleme-normalleştirilmiştir: satır içi yönerge etiketleri görünür metinden çıkarılır, düz metin araç çağrısı XML payload'ları (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kırpılmış araç çağrısı blokları dâhil) ve sızmış ASCII/tam genişlikli model kontrol token'ları çıkarılır, tam olarak `NO_REPLY` / `no_reply` olan salt sessiz-token asistan satırları atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir.
  </Accordion>

  <Accordion title="Cihaz eşleştirme ve cihaz token'ları">
    - `device.pair.list`, bekleyen ve onaylanmış eşleştirilmiş cihazları döndürür.
    - `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`, cihaz eşleştirme kayıtlarını yönetir.
    - `device.token.rotate`, eşleştirilmiş bir cihaz token'ını onaylı rolü ve çağıran kapsam sınırları içinde döndürür.
    - `device.token.revoke`, eşleştirilmiş bir cihaz token'ını onaylı rolü ve çağıran kapsam sınırları içinde iptal eder.
  </Accordion>

  <Accordion title="Node eşleştirme, invoke ve bekleyen işler">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` ve `node.pair.verify`, Node eşleştirme ve bootstrap doğrulamayı kapsar.
    - `node.list` ve `node.describe`, bilinen/bağlı Node durumunu döndürür.
    - `node.rename`, eşleştirilmiş bir Node etiketini günceller.
    - `node.invoke`, bağlı bir Node'a komut iletir.
    - `node.invoke.result`, bir invoke isteğinin sonucunu döndürür.
    - `node.event`, Node kaynaklı olayları tekrar gateway'e taşır.
    - `node.canvas.capability.refresh`, kapsamlı canvas yetenek token'larını yeniler.
    - `node.pending.pull` ve `node.pending.ack`, bağlı Node kuyruğu API'leridir.
    - `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısı kesik Node'lar için kalıcı bekleyen işleri yönetir.
  </Accordion>

  <Accordion title="Onay aileleri">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve `exec.approval.resolve`, tek seferlik exec onay isteklerini ve bekleyen onay lookup/replay işlemlerini kapsar.
    - `exec.approval.waitDecision`, tek bir bekleyen exec onayı üzerinde bekler ve nihai kararı döndürür (veya zaman aşımında `null`).
    - `exec.approvals.get` ve `exec.approvals.set`, gateway exec onay politikası snapshot'larını yönetir.
    - `exec.approvals.node.get` ve `exec.approvals.node.set`, Node relay komutları aracılığıyla Node-yerel exec onay politikasını yönetir.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` ve `plugin.approval.resolve`, plugin tanımlı onay akışlarını kapsar.
  </Accordion>

  <Accordion title="Otomasyon, Skills ve araçlar">
    - Otomasyon: `wake`, hemen veya bir sonraki Heartbeat için metin enjeksiyonu planlar; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs`, planlanmış işleri yönetir.
    - Skills ve araçlar: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Yaygın olay aileleri

- `chat`: `chat.inject` ve diğer yalnızca transkript olan sohbet
  olayları gibi UI sohbet güncellemeleri.
- `session.message` ve `session.tool`: abone olunmuş bir oturum için
  transkript/olay akışı güncellemeleri.
- `sessions.changed`: oturum dizini veya metadata değişti.
- `presence`: sistem presence snapshot güncellemeleri.
- `tick`: periyodik keepalive / canlılık olayı.
- `health`: gateway sağlık snapshot güncellemesi.
- `heartbeat`: Heartbeat olay akışı güncellemesi.
- `cron`: Cron çalıştırma/iş değişiklik olayı.
- `shutdown`: gateway kapanış bildirimi.
- `node.pair.requested` / `node.pair.resolved`: Node eşleştirme yaşam döngüsü.
- `node.invoke.request`: Node invoke isteği yayını.
- `device.pair.requested` / `device.pair.resolved`: eşleştirilmiş cihaz yaşam döngüsü.
- `voicewake.changed`: uyandırma sözcüğü tetikleyici yapılandırması değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onay
  yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin onay
  yaşam döngüsü.

### Node yardımcı yöntemleri

- Node'lar, otomatik izin denetimleri
  için mevcut Skill çalıştırılabilir dosyaları listesini almak üzere `skills.bins` çağırabilir.

### Operator yardımcı yöntemleri

- Operator'ler, bir ajan için çalışma zamanı
  komut envanterini almak üzere `commands.list` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan ajan çalışma alanını okumak için atlayın.
  - `scope`, birincil `name` hedefinin hangi yüzeyi kullandığını denetler:
    - `text`, başında `/` olmadan birincil metin komut token'ını döndürür
    - `native` ve varsayılan `both` yolu, varsa sağlayıcıya duyarlı yerel adları döndürür
  - `textAliases`, `/model` ve `/m` gibi tam slash takma adlarını taşır.
  - `nativeName`, varsa sağlayıcıya duyarlı yerel komut adını taşır.
  - `provider` isteğe bağlıdır ve yalnızca yerel adlandırmayı ve yerel plugin
    komut kullanılabilirliğini etkiler.
  - `includeArgs=false`, seri hale getirilmiş argüman metadata'sını yanıttan çıkarır.
- Operator'ler, bir
  ajan için çalışma zamanı araç kataloğunu almak üzere `tools.catalog` (`operator.read`) çağırabilir. Yanıt, gruplanmış araçları ve kaynak metadata'sını içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda plugin sahibi
  - `optional`: bir plugin aracının isteğe bağlı olup olmadığı
- Operator'ler, bir oturum için çalışma zamanı açısından etkin araç
  envanterini almak üzere `tools.effective` (`operator.read`) çağırabilir.
  - `sessionKey` zorunludur.
  - Gateway, çağıran tarafından sağlanan auth veya teslim bağlamını kabul etmek yerine
    güvenilir çalışma zamanı bağlamını sunucu tarafında oturumdan türetir.
  - Yanıt oturum kapsamlıdır ve etkin konuşmanın şu anda neyi kullanabildiğini yansıtır;
    çekirdek, plugin ve kanal araçları dâhil.
- Operator'ler, bir ajan için görünür
  Skill envanterini almak üzere `skills.status` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan ajan çalışma alanını okumak için atlayın.
  - Yanıt; uygunluğu, eksik gereksinimleri, yapılandırma denetimlerini ve
    ham secret değerlerini açığa çıkarmadan arındırılmış yükleme seçeneklerini içerir.
- Operator'ler, ClawHub keşif metadata'sı için
  `skills.search` ve `skills.detail` (`operator.read`) çağırabilir.
- Operator'ler, `skills.install` (`operator.admin`) çağrısını iki modda kullanabilir:
  - ClawHub modu: `{ source: "clawhub", slug, version?, force? }`, bir
    Skill klasörünü varsayılan ajan çalışma alanı `skills/` dizinine yükler.
  - Gateway yükleyici modu: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    gateway ana makinesinde beyan edilmiş bir `metadata.openclaw.install` eylemini çalıştırır.
- Operator'ler, `skills.update` (`operator.admin`) çağrısını iki modda kullanabilir:
  - ClawHub modu, varsayılan ajan çalışma alanındaki tek bir izlenen slug'ı veya tüm izlenen ClawHub yüklemelerini günceller.
  - Config modu, `skills.entries.<skillKey>` altındaki `enabled`,
    `apiKey` ve `env` gibi değerleri yamalar.

## Exec onayları

- Bir exec isteği onay gerektirdiğinde gateway, `exec.approval.requested` yayınlar.
- Operator istemcileri `exec.approval.resolve` çağırarak çözümler (`operator.approvals` kapsamı gerekir).
- `host=node` için `exec.approval.request`, `systemRunPlan` içermelidir (kanonik `argv`/`cwd`/`rawCommand`/session metadata). `systemRunPlan` içermeyen istekler reddedilir.
- Onaydan sonra iletilen `node.invoke system.run` çağrıları, yetkili komut/cwd/oturum bağlamı olarak bu kanonik
  `systemRunPlan` değerini yeniden kullanır.
- Çağıran prepare ile son onaylı `system.run` iletimi arasında `command`, `rawCommand`, `cwd`, `agentId` veya
  `sessionKey` değerlerini değiştirirse gateway, değiştirilmiş payload'a güvenmek yerine
  çalıştırmayı reddeder.

## Ajan teslim fallback'i

- `agent` istekleri, giden teslim istemek için `deliver=true` içerebilir.
- `bestEffortDeliver=false`, katı davranışı korur: çözümlenmemiş veya yalnızca dahili teslim hedefleri `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici teslim edilebilir rota çözümlenemediğinde oturum-yalnız yürütmeye fallback'e izin verir (örneğin dahili/webchat oturumları veya belirsiz çok kanallı yapılandırmalar).

## Sürümleme

- `PROTOCOL_VERSION`, `src/gateway/protocol/schema/protocol-schemas.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu uyuşmazlıkları reddeder.
- Şemalar + modeller TypeBox tanımlarından üretilir:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### İstemci sabitleri

`src/gateway/client.ts` içindeki referans istemci şu varsayılanları kullanır. Değerler
protokol v3 boyunca kararlıdır ve üçüncü taraf istemciler için beklenen temeldir.

| Sabit                                     | Varsayılan                                           | Kaynak                                                     |
| ----------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| İstek zaman aşımı (RPC başına)            | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Ön kimlik doğrulama / connect-challenge zaman aşımı | `10_000` ms                               | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| İlk yeniden bağlanma backoff'u            | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                      |
| En yüksek yeniden bağlanma backoff'u      | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Device-token kapanışından sonra hızlı yeniden deneme clamp'i | `250` ms                             | `src/gateway/client.ts`                                    |
| `terminate()` öncesi zorla durdurma bekleme süresi | `250` ms                                   | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| `stopAndWait()` varsayılan zaman aşımı    | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Varsayılan tick aralığı (`hello-ok` öncesi) | `30_000` ms                                        | `src/gateway/client.ts`                                    |
| Tick zaman aşımı kapanışı                 | sessizlik `tickIntervalMs * 2` değerini aştığında kod `4000` | `src/gateway/client.ts`                           |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                          |

Sunucu etkin `policy.tickIntervalMs`, `policy.maxPayload`
ve `policy.maxBufferedBytes` değerlerini `hello-ok` içinde ilan eder; istemciler
handshake öncesi varsayılanlar yerine bu değerlere uymalıdır.

## Auth

- Paylaşımlı secret gateway auth, yapılandırılmış auth moduna bağlı olarak
  `connect.params.auth.token` veya
  `connect.params.auth.password` kullanır.
- Tailscale Serve
  (`gateway.auth.allowTailscale: true`) veya loopback dışı
  `gateway.auth.mode: "trusted-proxy"` gibi kimlik taşıyan modlar, connect auth denetimini
  `connect.params.auth.*` yerine istek başlıklarından karşılar.
- Private-ingress `gateway.auth.mode: "none"`, paylaşımlı secret connect auth'u
  tamamen atlar; bu modu herkese açık/güvenilmeyen girişlerde açığa çıkarmayın.
- Eşleştirmeden sonra Gateway, bağlantı
  rolü + kapsamlarına göre sınırlı bir **device token** verir. Bu token
  `hello-ok.auth.deviceToken` içinde döner ve istemci tarafından sonraki bağlantılar için
  kalıcı olarak saklanmalıdır.
- İstemciler, başarılı her
  bağlantıdan sonra birincil `hello-ok.auth.deviceToken` değerini kalıcı olarak saklamalıdır.
- Bu **depolanmış** device token ile yeniden bağlanırken, bu token için depolanmış
  onaylı kapsam kümesi de yeniden kullanılmalıdır. Bu, zaten verilmiş
  okuma/yoklama/durum erişimini korur ve yeniden bağlanmaların sessizce
  daha dar örtük admin-only kapsama çökmesini önler.
- İstemci tarafı connect auth birleştirmesi (`src/gateway/client.ts`
  içindeki `selectConnectAuth`):
  - `auth.password` bağımsızdır ve ayarlıysa her zaman iletilir.
  - `auth.token` şu öncelik sırasına göre doldurulur: önce açık paylaşımlı token,
    sonra açık bir `deviceToken`, sonra depolanmış cihaz başına token (`deviceId` + `role`
    ile anahtarlanır).
  - `auth.bootstrapToken`, yalnızca yukarıdakilerin hiçbiri bir
    `auth.token` çözümlemediyse gönderilir. Paylaşımlı token veya çözümlenen herhangi bir device token bunu bastırır.
  - Bir kerelik
    `AUTH_TOKEN_MISMATCH` yeniden denemesinde depolanmış device token'ın otomatik yükseltilmesi yalnızca **güvenilir uç noktalar** için geçerlidir —
    loopback veya pinlenmiş `tlsFingerprint` ile `wss://`.
    Pinleme olmadan herkese açık `wss://` buna girmez.
- Ek `hello-ok.auth.deviceTokens` girdileri bootstrap devralma token'larıdır.
  Bunları yalnızca bağlantı, `wss://` veya loopback/yerel eşleştirme gibi
  güvenilir bir taşıma üzerinde bootstrap auth kullandıysa kalıcı olarak saklayın.
- Bir istemci açık bir `deviceToken` veya açık `scopes` sağlarsa, çağıran tarafından istenen
  bu kapsam kümesi yetkili kalır; önbelleğe alınmış kapsamlar yalnızca
  istemci depolanmış cihaz başına token'ı yeniden kullanıyorsa yeniden kullanılır.
- Device token'lar `device.token.rotate` ve
  `device.token.revoke` ile döndürülebilir/iptal edilebilir (`operator.pairing` kapsamı gerekir).
- Token verme, döndürme ve iptal etme işlemleri o cihazın eşleştirme girdisinde
  kaydedilmiş onaylı rol kümesiyle sınırlı kalır; token değişikliği
  eşleştirme onayının hiç vermediği bir cihaz rolünü genişletemez veya hedefleyemez.
- Eşleştirilmiş cihaz token oturumları için cihaz yönetimi, çağıranın ayrıca
  `operator.admin` yetkisi yoksa kendine kapsamlıdır: admin olmayan çağıranlar yalnızca **kendi**
  cihaz girdilerini kaldırabilir/iptal edebilir/döndürebilir.
- `device.token.rotate` ve `device.token.revoke`, hedef operator
  token kapsam kümesini çağıranın geçerli oturum kapsamlarına karşı da denetler.
  Admin olmayan çağıranlar zaten ellerinde olandan daha geniş bir operator token'ı döndüremez veya iptal edemez.
- Auth hataları `error.details.code` ile birlikte kurtarma ipuçları içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilen istemciler önbelleğe alınmış cihaz başına token ile bir sınırlı yeniden deneme yapabilir.
  - Bu yeniden deneme başarısız olursa istemciler otomatik yeniden bağlanma döngülerini durdurmalı ve operatör eylem kılavuzunu göstermelidir.

## Cihaz kimliği + eşleştirme

- Node'lar, bir anahtar çifti fingerprint'inden türetilmiş kararlı bir cihaz kimliği (`device.id`)
  eklemelidir.
- Gateway'ler cihaz + rol başına token verir.
- Yerel otomatik onay
  etkin değilse yeni cihaz kimlikleri için eşleştirme onayı gerekir.
- Eşleştirme otomatik onayı, doğrudan yerel loopback bağlantılarına odaklanır.
- OpenClaw ayrıca güvenilen paylaşımlı secret yardımcı akışları için dar kapsamlı
  bir backend/konteyner-yerel self-connect yoluna sahiptir.
- Aynı ana makinedeki tailnet veya LAN bağlantıları yine de uzak kabul edilir ve
  onay gerektirir.
- WS istemcileri normalde `connect` sırasında `device` kimliği ekler (operator +
  node). Cihazsız tek operator istisnaları açık güven yollarıdır:
  - yalnızca localhost güvensiz HTTP uyumluluğu için `gateway.controlUi.allowInsecureAuth=true`.
  - başarılı `gateway.auth.mode: "trusted-proxy"` operator Control UI auth'u.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (son çare, ciddi güvenlik düşüşü).
  - paylaşılan
    gateway token/password ile kimlik doğrulanmış doğrudan loopback `gateway-client` backend RPC'leri.
- Tüm bağlantılar sunucu tarafından sağlanan `connect.challenge` nonce'unu imzalamalıdır.

### Cihaz auth taşıma tanılaması

Hâlâ challenge öncesi imzalama davranışı kullanan eski istemciler için `connect`, artık
`error.details.reason` içinde kararlı bir değerle `error.details.code` altında
`DEVICE_AUTH_*` ayrıntı kodları döndürür.

Yaygın taşıma hataları:

| Mesaj                       | details.code                     | details.reason           | Anlamı                                             |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | İstemci `device.nonce` alanını atladı (veya boş gönderdi). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | İstemci bayat/yanlış bir nonce ile imzaladı.       |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | İmza payload'ı v2 payload ile eşleşmiyor.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | İmzalı zaman damgası izin verilen kaymanın dışında. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`, genel anahtar fingerprint'i ile eşleşmiyor. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Genel anahtar biçimi/kanonikleştirme başarısız oldu. |

Taşıma hedefi:

- Her zaman `connect.challenge` bekleyin.
- Sunucu nonce'unu içeren v2 payload'ı imzalayın.
- Aynı nonce'u `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza payload'ı, device/client/role/scopes/token/nonce alanlarına ek olarak `platform` ve `deviceFamily` bağlayan `v3`'tür.
- Eski `v2` imzaları uyumluluk için kabul edilmeye devam eder, ancak eşleştirilmiş cihaz
  metadata pinleme yine de yeniden bağlanmada komut politikasını denetler.

## TLS + pinleme

- WS bağlantıları için TLS desteklenir.
- İstemciler isteğe bağlı olarak gateway sertifika fingerprint'ini pinleyebilir (bkz. `gateway.tls`
  yapılandırması artı `gateway.remote.tlsFingerprint` veya CLI `--tls-fingerprint`).

## Kapsam

Bu protokol **tam gateway API'sini** (durum, kanallar, modeller, sohbet,
ajan, oturumlar, Node'lar, onaylar vb.) açığa çıkarır. Tam yüzey
`src/gateway/protocol/schema.ts` içindeki TypeBox şemalarıyla tanımlanır.

## İlgili

- [Bridge protocol](/tr/gateway/bridge-protocol)
- [Gateway runbook](/tr/gateway)
