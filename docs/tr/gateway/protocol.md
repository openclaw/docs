---
read_when:
    - Gateway WS istemcilerini uygulama veya güncelleme
    - Protokol uyumsuzluklarını veya bağlantı hatalarını hata ayıklama
    - Protokol şemasını/modellerini yeniden oluşturma
summary: 'Gateway WebSocket protokolü: el sıkışma, çerçeveler, sürümlendirme'
title: Gateway protokolü
x-i18n:
    generated_at: "2026-04-24T09:10:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf6710cb1c620dc03b75421cab7953c412cb85e68c52fa9b504ea89b7302efb8
    source_path: gateway/protocol.md
    workflow: 15
---

# Gateway protokolü (WebSocket)

Gateway WS protokolü, OpenClaw için **tek denetim düzlemi + Node taşımasıdır**.
Tüm istemciler (CLI, web UI, macOS uygulaması, iOS/Android Node'ları, headless
Node'lar) WebSocket üzerinden bağlanır ve el sıkışma anında
**rol** + **kapsamlarını** bildirir.

## Taşıma

- WebSocket, JSON payload'lu metin çerçeveleri.
- İlk çerçeve **`connect` isteği olmak zorundadır**.
- Bağlantı öncesi çerçeveler 64 KiB ile sınırlandırılır. Başarılı bir el sıkışmadan sonra istemciler
  `hello-ok.policy.maxPayload` ve
  `hello-ok.policy.maxBufferedBytes` sınırlarını izlemelidir. Tanılama etkin olduğunda,
  aşırı büyük gelen çerçeveler ve yavaş giden tamponlar, gateway etkilenen çerçeveyi kapatmadan veya düşürmeden önce `payload.large` olayları yayınlar.
  Bu olaylar boyutları, sınırları, yüzeyleri ve güvenli gerekçe kodlarını tutar. Mesaj
  gövdesini, ek içeriklerini, ham çerçeve gövdesini, token'ları, cookie'leri veya gizli değerleri tutmazlar.

## El sıkışma (`connect`)

Gateway → İstemci (bağlantı öncesi meydan okuma):

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
mevcut olduğunda müzakere edilen rolü/kapsamları bildirir ve gateway bir tane verirse `deviceToken`
de içerir.

Bir device token verilmediğinde, `hello-ok.auth` yine de müzakere edilen
izinleri bildirebilir:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Bir device token verildiğinde, `hello-ok` ayrıca şunu içerir:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Güvenilir bootstrap devri sırasında `hello-ok.auth`, `deviceTokens`
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

Yerleşik Node/operatör bootstrap akışı için, birincil Node token'ı
`scopes: []` olarak kalır ve devredilen herhangi bir operatör token'ı bootstrap
operatör allowlist'i ile sınırlı kalır (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap kapsam denetimleri
rol önekli kalır: operatör girdileri yalnızca operatör isteklerini karşılar ve operatör olmayan
roller kendi rol önekleri altındaki kapsamları yine gerektirir.

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

Yan etkili yöntemler **idempotency key** gerektirir (şemaya bakın).

## Roller + kapsamlar

### Roller

- `operator` = denetim düzlemi istemcisi (CLI/UI/otomasyon).
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

Plugin tarafından kaydedilen Gateway RPC yöntemleri kendi operator kapsamlarını isteyebilir, ancak
ayrılmış çekirdek yönetici önekleri (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) her zaman `operator.admin` olarak çözülür.

Yöntem kapsamı yalnızca ilk geçittir. `chat.send` üzerinden ulaşılan bazı slash komutları
bunun üstünde daha sıkı komut düzeyi denetimleri uygular. Örneğin kalıcı
`/config set` ve `/config unset` yazımları `operator.admin` gerektirir.

`node.pair.approve` ayrıca temel yöntem kapsamının üstünde ek bir onay zamanı kapsam denetimine sahiptir:

- komutsuz istekler: `operator.pairing`
- exec olmayan Node komutları içeren istekler: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which` içeren istekler:
  `operator.pairing` + `operator.admin`

### `caps`/`commands`/`permissions` (node)

Node'lar bağlantı anında yetenek iddialarını bildirir:

- `caps`: üst düzey yetenek kategorileri.
- `commands`: invoke için komut allowlist'i.
- `permissions`: ayrıntılı açma/kapama anahtarları (ör. `screen.record`, `camera.capture`).

Gateway bunları **iddia** olarak değerlendirir ve sunucu tarafı allowlist'leri uygular.

## Presence

- `system-presence`, cihaz kimliğine göre anahtarlanmış girdiler döndürür.
- Presence girdileri `deviceId`, `roles` ve `scopes` içerir; böylece UI'lar, cihaz hem **operator** hem de **node** olarak bağlandığında
  cihaz başına tek bir satır gösterebilir.

## Yayın olay kapsamlaması

Sunucu tarafından itilen WebSocket yayın olayları kapsam geçidiyle korunur; böylece pairing kapsamlı veya yalnızca Node oturumları oturum içeriğini pasif olarak almaz.

- **Sohbet, aracı ve araç-sonucu çerçeveleri** (akışlı `agent` olayları ve araç çağrısı sonuçları dahil) en az `operator.read` gerektirir. `operator.read` olmayan oturumlar bu çerçeveleri tamamen atlar.
- **Plugin tanımlı `plugin.*` yayınları**, Plugin bunları nasıl kaydettiğine bağlı olarak `operator.write` veya `operator.admin` ile geçitlenir.
- **Durum ve taşıma olayları** (`heartbeat`, `presence`, `tick`, bağlanma/ayrılma yaşam döngüsü vb.) sınırsız kalır; böylece taşıma sağlığı kimliği doğrulanmış her oturum için gözlemlenebilir olur.
- **Bilinmeyen yayın olay aileleri**, kayıtlı bir işleyici bunları açıkça gevşetmedikçe varsayılan olarak kapsam geçitlidir (kapalı başarısızlık).

Her istemci bağlantısı kendi istemci başına sıra numarasını tutar; böylece farklı istemciler olay akışının farklı kapsam filtreli alt kümelerini görse bile yayınlar o soket üzerinde monoton sıralamayı korur.

## Yaygın RPC yöntem aileleri

Genel WS yüzeyi, yukarıdaki el sıkışma/kimlik doğrulama örneklerinden daha geniştir. Bu
oluşturulmuş bir döküm değildir — `hello-ok.features.methods`, `src/gateway/server-methods-list.ts` ile yüklenmiş
Plugin/kanal yöntem dışa aktarımlarından oluşturulan temkinli bir
keşif listesidir. Bunu `src/gateway/server-methods/*.ts` için tam
bir numaralandırma değil, özellik keşfi olarak değerlendirin.

<AccordionGroup>
  <Accordion title="Sistem ve kimlik">
    - `health`, önbelleğe alınmış veya yeni probe edilmiş gateway sağlık anlık görüntüsünü döndürür.
    - `diagnostics.stability`, son sınırlı tanılama kararlılık kaydedicisini döndürür. Olay adları, sayılar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/Plugin adları ve oturum kimlikleri gibi işlemsel meta verileri tutar. Sohbet metnini, Webhook gövdelerini, araç çıktılarını, ham istek veya yanıt gövdelerini, token'ları, cookie'leri veya gizli değerleri tutmaz. Operator read kapsamı gereklidir.
    - `status`, `/status` tarzı gateway özetini döndürür; hassas alanlar yalnızca yönetici kapsamlı operator istemcilerine dahil edilir.
    - `gateway.identity.get`, relay ve pairing akışlarında kullanılan gateway cihaz kimliğini döndürür.
    - `system-presence`, bağlı operator/Node cihazları için geçerli presence anlık görüntüsünü döndürür.
    - `system-event`, bir sistem olayı ekler ve presence bağlamını güncelleyebilir/yayınlayabilir.
    - `last-heartbeat`, kalıcılaştırılmış en son Heartbeat olayını döndürür.
    - `set-heartbeats`, gateway üzerinde Heartbeat işlemeyi açıp kapatır.
  </Accordion>

  <Accordion title="Modeller ve kullanım">
    - `models.list`, çalışma zamanında izin verilen model kataloğunu döndürür.
    - `usage.status`, sağlayıcı kullanım pencereleri/kalan kota özetlerini döndürür.
    - `usage.cost`, bir tarih aralığı için toplanmış maliyet kullanım özetlerini döndürür.
    - `doctor.memory.status`, etkin varsayılan aracı çalışma alanı için vektör bellek / gömme hazırlığını döndürür.
    - `sessions.usage`, oturum başına kullanım özetlerini döndürür.
    - `sessions.usage.timeseries`, tek bir oturum için zaman serisi kullanımı döndürür.
    - `sessions.usage.logs`, tek bir oturum için kullanım günlük girdilerini döndürür.
  </Accordion>

  <Accordion title="Kanallar ve giriş yardımcıları">
    - `channels.status`, yerleşik + paketlenmiş kanal/Plugin durum özetlerini döndürür.
    - `channels.logout`, kanal çıkışı destekliyorsa belirli bir kanal/hesaptan çıkış yapar.
    - `web.login.start`, geçerli QR destekli web kanal sağlayıcısı için bir QR/web giriş akışı başlatır.
    - `web.login.wait`, bu QR/web giriş akışının tamamlanmasını bekler ve başarı durumunda kanalı başlatır.
    - `push.test`, kayıtlı bir iOS Node'una test APNs push gönderir.
    - `voicewake.get`, saklanan uyandırma sözcüğü tetikleyicilerini döndürür.
    - `voicewake.set`, uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayınlar.
  </Accordion>

  <Accordion title="Mesajlaşma ve günlükler">
    - `send`, sohbet çalıştırıcısının dışında kanal/hesap/thread hedefli gönderimler için doğrudan giden teslim RPC'sidir.
    - `logs.tail`, imleç/sınır ve azami bayt denetimleriyle yapılandırılmış gateway dosya günlüğü sonunu döndürür.
  </Accordion>

  <Accordion title="Talk ve TTS">
    - `talk.config`, etkin Talk config payload'unu döndürür; `includeSecrets`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.
    - `talk.mode`, WebChat/Control UI istemcileri için geçerli Talk modu durumunu ayarlar/yayınlar.
    - `talk.speak`, etkin Talk konuşma sağlayıcısı üzerinden konuşma sentezler.
    - `tts.status`, TTS etkin durumunu, etkin sağlayıcıyı, fallback sağlayıcıları ve sağlayıcı config durumunu döndürür.
    - `tts.providers`, görünür TTS sağlayıcı envanterini döndürür.
    - `tts.enable` ve `tts.disable`, TTS tercih durumunu açıp kapatır.
    - `tts.setProvider`, tercih edilen TTS sağlayıcısını günceller.
    - `tts.convert`, tek seferlik metinden konuşmaya dönüştürme çalıştırır.
  </Accordion>

  <Accordion title="Gizli bilgiler, config, update ve wizard">
    - `secrets.reload`, etkin SecretRef'leri yeniden çözümler ve çalışma zamanı gizli durumunu yalnızca tam başarıda değiştirir.
    - `secrets.resolve`, belirli bir komut/hedef kümesi için komut hedefli gizli bilgi atamalarını çözümler.
    - `config.get`, geçerli config anlık görüntüsünü ve hash değerini döndürür.
    - `config.set`, doğrulanmış bir config payload'u yazar.
    - `config.patch`, kısmi bir config güncellemesini birleştirir.
    - `config.apply`, tam config payload'unu doğrular + değiştirir.
    - `config.schema`, Control UI ve CLI araçları tarafından kullanılan canlı config şeması payload'unu döndürür: şema, `uiHints`, sürüm ve oluşturma meta verileri; çalışma zamanı yükleyebildiğinde Plugin + kanal şema meta verileri de buna dahildir. Şema; UI tarafından kullanılan aynı etiket ve yardım metninden türetilen alan `title` / `description` meta verilerini içerir; buna eşleşen alan belgeleri mevcut olduğunda iç içe nesne, joker karakter, dizi öğesi ve `anyOf` / `oneOf` / `allOf` bileşim dalları da dahildir.
    - `config.schema.lookup`, tek bir config yolu için yol kapsamlı bir arama payload'u döndürür: normalize edilmiş yol, sığ bir şema düğümü, eşleşen ipucu + `hintPath` ve UI/CLI ayrıntılı gezinmesi için doğrudan alt özetler. Arama şeması düğümleri, kullanıcıya dönük belgeleri ve yaygın doğrulama alanlarını (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, sayısal/string/dizi/nesne sınırları ve `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` gibi bayraklar) korur. Alt özetler `key`, normalize edilmiş `path`, `type`, `required`, `hasChildren` ile eşleşen `hint` / `hintPath` alanlarını sunar.
    - `update.run`, gateway güncelleme akışını çalıştırır ve yalnızca güncellemenin kendisi başarılı olduğunda yeniden başlatma planlar.
    - `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`, onboarding sihirbazını WS RPC üzerinden sunar.
  </Accordion>

  <Accordion title="Aracı ve çalışma alanı yardımcıları">
    - `agents.list`, yapılandırılmış aracı girdilerini döndürür.
    - `agents.create`, `agents.update` ve `agents.delete`, aracı kayıtlarını ve çalışma alanı bağlantılarını yönetir.
    - `agents.files.list`, `agents.files.get` ve `agents.files.set`, bir aracı için sunulan bootstrap çalışma alanı dosyalarını yönetir.
    - `agent.identity.get`, bir aracı veya oturum için etkin asistan kimliğini döndürür.
    - `agent.wait`, bir çalıştırmanın bitmesini bekler ve mevcut olduğunda terminal anlık görüntüsünü döndürür.
  </Accordion>

  <Accordion title="Oturum denetimi">
    - `sessions.list`, geçerli oturum dizinini döndürür.
    - `sessions.subscribe` ve `sessions.unsubscribe`, geçerli WS istemcisi için oturum değişikliği olay aboneliklerini açıp kapatır.
    - `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`, tek bir oturum için transcript/mesaj olay aboneliklerini açıp kapatır.
    - `sessions.preview`, belirli oturum anahtarları için sınırlı transcript önizlemeleri döndürür.
    - `sessions.resolve`, bir oturum hedefini çözümler veya kanonikleştirir.
    - `sessions.create`, yeni bir oturum girdisi oluşturur.
    - `sessions.send`, mevcut bir oturuma mesaj gönderir.
    - `sessions.steer`, etkin bir oturum için kes-ve-yönlendir varyantıdır.
    - `sessions.abort`, bir oturum için etkin çalışmayı iptal eder.
    - `sessions.patch`, oturum meta verilerini/geçersiz kılmalarını günceller.
    - `sessions.reset`, `sessions.delete` ve `sessions.compact`, oturum bakımını gerçekleştirir.
    - `sessions.get`, tam saklanan oturum satırını döndürür.
    - Sohbet yürütmesi hâlâ `chat.history`, `chat.send`, `chat.abort` ve `chat.inject` kullanır. `chat.history`, UI istemcileri için görüntülemeye göre normalize edilir: satır içi yönerge etiketleri görünür metinden çıkarılır, düz metin araç çağrısı XML payload'ları (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil) ile sızan ASCII/tam genişlikte model kontrol token'ları çıkarılır, tam `NO_REPLY` / `no_reply` gibi yalnızca sessiz token içeren asistan satırları atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir.
  </Accordion>

  <Accordion title="Cihaz eşleştirme ve cihaz token'ları">
    - `device.pair.list`, bekleyen ve onaylanmış eşleştirilmiş cihazları döndürür.
    - `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`, cihaz eşleştirme kayıtlarını yönetir.
    - `device.token.rotate`, eşleştirilmiş bir cihaz token'ını onaylanan rol ve kapsam sınırları içinde döndürür.
    - `device.token.revoke`, eşleştirilmiş bir cihaz token'ını iptal eder.
  </Accordion>

  <Accordion title="Node eşleştirme, invoke ve bekleyen işler">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` ve `node.pair.verify`, Node eşleştirmesi ve bootstrap doğrulamasını kapsar.
    - `node.list` ve `node.describe`, bilinen/bağlı Node durumunu döndürür.
    - `node.rename`, eşleştirilmiş bir Node etiketini günceller.
    - `node.invoke`, bağlı bir Node'a komut iletir.
    - `node.invoke.result`, bir invoke isteği için sonucu döndürür.
    - `node.event`, Node kaynaklı olayları tekrar gateway'e taşır.
    - `node.canvas.capability.refresh`, kapsamlı canvas yetenek token'larını yeniler.
    - `node.pending.pull` ve `node.pending.ack`, bağlı Node kuyruk API'leridir.
    - `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısız Node'lar için kalıcı bekleyen işleri yönetir.
  </Accordion>

  <Accordion title="Onay aileleri">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve `exec.approval.resolve`; tek seferlik exec onay isteklerini ve bekleyen onay arama/yeniden oynatmayı kapsar.
    - `exec.approval.waitDecision`, bekleyen tek bir exec onayını bekler ve nihai kararı döndürür (veya zaman aşımında `null`).
    - `exec.approvals.get` ve `exec.approvals.set`, gateway exec onay ilkesi anlık görüntülerini yönetir.
    - `exec.approvals.node.get` ve `exec.approvals.node.set`, Node relay komutları aracılığıyla node-local exec onay ilkesini yönetir.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` ve `plugin.approval.resolve`, Plugin tanımlı onay akışlarını kapsar.
  </Accordion>

  <Accordion title="Otomasyon, Skills ve araçlar">
    - Otomasyon: `wake`, anında veya sonraki Heartbeat için bir uyanma metni ekleme planlar; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` planlanmış işleri yönetir.
    - Skills ve araçlar: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Yaygın olay aileleri

- `chat`: `chat.inject` ve diğer yalnızca transcript içeren sohbet
  olayları gibi UI sohbet güncellemeleri.
- `session.message` ve `session.tool`: abone olunan bir
  oturum için transcript/olay akışı güncellemeleri.
- `sessions.changed`: oturum dizini veya meta verisi değişti.
- `presence`: sistem presence anlık görüntüsü güncellemeleri.
- `tick`: periyodik keepalive / canlılık olayı.
- `health`: gateway sağlık anlık görüntüsü güncellemesi.
- `heartbeat`: Heartbeat olay akışı güncellemesi.
- `cron`: Cron çalıştırma/iş değişikliği olayı.
- `shutdown`: gateway kapanış bildirimi.
- `node.pair.requested` / `node.pair.resolved`: Node eşleştirme yaşam döngüsü.
- `node.invoke.request`: Node invoke istek yayını.
- `device.pair.requested` / `device.pair.resolved`: eşleştirilmiş cihaz yaşam döngüsü.
- `voicewake.changed`: uyandırma sözcüğü tetikleyici config'i değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onay
  yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin onay
  yaşam döngüsü.

### Node yardımcı yöntemleri

- Node'lar, otomatik izin denetimleri için geçerli Skill yürütülebilirleri
  listesini almak üzere `skills.bins` çağırabilir.

### Operator yardımcı yöntemleri

- Operator'ler, bir aracı için çalışma zamanı
  komut envanterini almak üzere `commands.list` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan aracı çalışma alanını okumak için bunu atlayın.
  - `scope`, birincil `name` hedefinin hangi yüzey olacağını denetler:
    - `text`, başındaki `/` olmadan birincil metin komut token'ını döndürür
    - `native` ve varsayılan `both` yolu, mevcut olduğunda sağlayıcıya duyarlı yerel adları döndürür
  - `textAliases`, `/model` ve `/m` gibi tam slash takma adları taşır.
  - `nativeName`, mevcut olduğunda sağlayıcıya duyarlı yerel komut adını taşır.
  - `provider` isteğe bağlıdır ve yalnızca yerel adlandırmayı ve yerel Plugin
    komut kullanılabilirliğini etkiler.
  - `includeArgs=false`, yanıttan serileştirilmiş argüman meta verilerini çıkarır.
- Operator'ler, bir
  aracı için çalışma zamanı araç kataloğunu almak üzere `tools.catalog` (`operator.read`) çağırabilir. Yanıt gruplanmış araçları ve kaynak meta verilerini içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda Plugin sahibi
  - `optional`: bir Plugin aracının isteğe bağlı olup olmadığı
- Operator'ler, bir oturum için çalışma zamanı açısından etkin araç
  envanterini almak üzere `tools.effective` (`operator.read`) çağırabilir.
  - `sessionKey` zorunludur.
  - Gateway, çağıran tarafından sağlanan auth veya teslim bağlamını kabul etmek yerine
    güvenilir çalışma zamanı bağlamını oturumdan sunucu tarafında türetir.
  - Yanıt oturum kapsamlıdır ve etkin konuşmanın şu anda kullanabildiği
    çekirdek, Plugin ve kanal araçları dahil olmak üzere her şeyi yansıtır.
- Operator'ler, bir aracı için görünür
  Skill envanterini almak üzere `skills.status` (`operator.read`) çağırabilir.
  - `agentId` isteğe bağlıdır; varsayılan aracı çalışma alanını okumak için bunu atlayın.
  - Yanıt; ham gizli değerleri açığa çıkarmadan uygunluğu, eksik gereksinimleri, config denetimlerini ve
    sanitize kurulum seçeneklerini içerir.
- Operator'ler, ClawHub keşif meta verileri için `skills.search` ve `skills.detail` (`operator.read`) çağırabilir.
- Operator'ler, iki modda `skills.install` (`operator.admin`) çağırabilir:
  - ClawHub modu: `{ source: "clawhub", slug, version?, force? }`, bir
    Skill klasörünü varsayılan aracı çalışma alanı `skills/` dizinine kurar.
  - Gateway kurucu modu: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    gateway sunucusunda bildirilen bir `metadata.openclaw.install` eylemini çalıştırır.
- Operator'ler, iki modda `skills.update` (`operator.admin`) çağırabilir:
  - ClawHub modu, varsayılan aracı çalışma alanındaki izlenen tek bir slug'ı veya tüm izlenen ClawHub kurulumlarını günceller.
  - Config modu, `enabled`,
    `apiKey` ve `env` gibi `skills.entries.<skillKey>` değerlerini patch eder.

## Exec onayları

- Bir exec isteği onay gerektirdiğinde gateway `exec.approval.requested` yayınlar.
- Operator istemcileri `exec.approval.resolve` çağırarak çözümler (`operator.approvals` kapsamı gerektirir).
- `host=node` için `exec.approval.request`, `systemRunPlan` içermek zorundadır (kanonik `argv`/`cwd`/`rawCommand`/oturum meta verileri). `systemRunPlan` eksik istekler reddedilir.
- Onaydan sonra iletilen `node.invoke system.run` çağrıları, yetkili komut/cwd/oturum bağlamı olarak bu kanonik
  `systemRunPlan` öğesini yeniden kullanır.
- Çağıran, hazırlama ile son onaylı `system.run` iletimi arasında `command`, `rawCommand`, `cwd`, `agentId` veya
  `sessionKey` alanlarını değiştirirse gateway, değiştirilmiş payload'a güvenmek yerine
  çalıştırmayı reddeder.

## Aracı teslim fallback'i

- `agent` istekleri, giden teslim istemek için `deliver=true` içerebilir.
- `bestEffortDeliver=false`, sıkı davranışı korur: çözümlenmemiş veya yalnızca dahili teslim hedefleri `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici teslim edilebilir rota çözümlenemediğinde oturum-yalnız yürütmeye fallback'e izin verir (örneğin dahili/webchat oturumları veya belirsiz çok kanallı config'ler).

## Sürümlendirme

- `PROTOCOL_VERSION`, `src/gateway/protocol/schema/protocol-schemas.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu uyumsuzlukları reddeder.
- Şemalar + modeller TypeBox tanımlarından oluşturulur:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### İstemci sabitleri

`src/gateway/client.ts` içindeki referans istemci bu varsayılanları kullanır. Değerler
protokol v3 boyunca kararlıdır ve üçüncü taraf istemciler için beklenen temel çizgidir.

| Sabit                                     | Varsayılan                                            | Kaynak                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| İstek zaman aşımı (RPC başına)            | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Kimlik doğrulama öncesi / connect-challenge zaman aşımı | `10_000` ms                                | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| İlk yeniden bağlanma backoff'u            | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Azami yeniden bağlanma backoff'u          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Device-token kapanışından sonra hızlı yeniden deneme clamp'i | `250` ms                                   | `src/gateway/client.ts`                                    |
| `terminate()` öncesi force-stop bekleme süresi | `250` ms                                          | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| `stopAndWait()` varsayılan zaman aşımı    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Varsayılan tick aralığı ( `hello-ok` öncesi) | `30_000` ms                                        | `src/gateway/client.ts`                                    |
| Tick-timeout kapanışı                     | sessizlik `tickIntervalMs * 2` değerini aştığında kod `4000` | `src/gateway/client.ts`                              |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Sunucu, etkin `policy.tickIntervalMs`, `policy.maxPayload`
ve `policy.maxBufferedBytes` değerlerini `hello-ok` içinde bildirir; istemciler
el sıkışma öncesi varsayılanlar yerine bu değerlere uymalıdır.

## Kimlik doğrulama

- Paylaşılan gizli anahtar kullanan gateway auth, yapılandırılmış auth moduna bağlı olarak `connect.params.auth.token` veya
  `connect.params.auth.password` kullanır.
- Tailscale Serve
  (`gateway.auth.allowTailscale: true`) veya loopback dışı
  `gateway.auth.mode: "trusted-proxy"` gibi kimlik taşıyan modlar, connect auth kontrolünü
  `connect.params.auth.*` yerine istek başlıklarından karşılar.
- Özel giriş `gateway.auth.mode: "none"`, paylaşılan gizli connect auth'u
  tamamen atlar; bu modu genel/güvenilmeyen girişte dışa açmayın.
- Eşleştirmeden sonra Gateway, bağlantı
  rolü + kapsamlarına göre kapsamlandırılmış bir **device token** verir. Bu, `hello-ok.auth.deviceToken` içinde döndürülür ve istemci tarafından gelecekteki bağlantılar için kalıcılaştırılmalıdır.
- İstemciler, başarılı her bağlantıdan sonra birincil `hello-ok.auth.deviceToken` değerini kalıcılaştırmalıdır.
- Bu **saklanan** device token ile yeniden bağlanırken, o
  token için saklanan onaylı kapsam kümesi de yeniden kullanılmalıdır. Bu, zaten verilmiş okuma/probe/durum erişimini korur ve yeniden bağlantıların sessizce
  daha dar örtük yönetici kapsamına çökmesini önler.
- İstemci tarafı connect auth birleştirme (`selectConnectAuth`,
  `src/gateway/client.ts` içinde):
  - `auth.password` ortogonaldir ve ayarlandığında her zaman iletilir.
  - `auth.token`, öncelik sırasına göre doldurulur: önce açık paylaşılan token,
    sonra açık `deviceToken`, sonra saklanan cihaz başına token (`deviceId` + `role` ile anahtarlanmış).
  - `auth.bootstrapToken`, yalnızca yukarıdakilerin hiçbiri bir
    `auth.token` çözümlemediğinde gönderilir. Paylaşılan token veya çözülmüş herhangi bir device token bunu bastırır.
  - Tek seferlik
    `AUTH_TOKEN_MISMATCH` yeniden denemesinde saklanan bir device token'ın otomatik yükseltilmesi yalnızca **güvenilir uç noktalar** için geçerlidir —
    loopback veya sabitlenmiş `tlsFingerprint` içeren `wss://`. Sabitleme olmadan genel `wss://`
    uygun sayılmaz.
- Ek `hello-ok.auth.deviceTokens` girdileri bootstrap devir token'larıdır.
  Bunları yalnızca bağlantı bootstrap auth kullanmışsa ve taşıma `wss://` veya loopback/yerel eşleştirme gibi güvenilir bir taşıma ise kalıcılaştırın.
- Bir istemci açık bir `deviceToken` veya açık `scopes` sağlarsa, çağıran tarafından istenen kapsam kümesi
  yetkili kalır; önbelleğe alınmış kapsamlar yalnızca istemci cihaz başına saklanan token'ı yeniden kullanıyorsa yeniden kullanılır.
- Device token'ları `device.token.rotate` ve
  `device.token.revoke` ile döndürülebilir/iptal edilebilir (`operator.pairing` kapsamı gerektirir).
- Token verme/döndürme, o cihazın eşleştirme girdisinde kaydedilen onaylı rol kümesine
  bağlı kalır; bir token'ı döndürmek cihazı
  eşleştirme onayının hiç vermediği bir role genişletemez.
- Eşleştirilmiş cihaz token oturumları için cihaz yönetimi, çağıranın
  ayrıca `operator.admin` yetkisi yoksa kendi kapsamıyla sınırlıdır: yönetici olmayan çağıranlar yalnızca **kendi**
  cihaz girdilerini kaldırabilir/iptal edebilir/döndürebilir.
- `device.token.rotate`, istenen operator kapsam kümesini
  çağıranın geçerli oturum kapsamlarıyla da karşılaştırır. Yönetici olmayan çağıranlar, bir token'ı
  zaten sahip olduklarından daha geniş bir operator kapsam kümesine döndüremez.
- Kimlik doğrulama hataları, `error.details.code` ile birlikte kurtarma ipuçları da içerir:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilir istemciler, önbelleğe alınmış cihaz başına token ile bir sınırlı yeniden deneme yapabilir.
  - Bu yeniden deneme başarısız olursa, istemciler otomatik yeniden bağlanma döngülerini durdurmalı ve operatör eylem yönlendirmesini göstermelidir.

## Cihaz kimliği + eşleştirme

- Node'lar, anahtar çifti parmak izinden türetilen kararlı bir cihaz kimliği (`device.id`) içermelidir.
- Gateway'ler cihaz + rol başına token verir.
- Yerel otomatik onay
  etkin değilse yeni cihaz kimlikleri için eşleştirme onayları gerekir.
- Eşleştirme otomatik onayı doğrudan yerel loopback bağlantılarına odaklanır.
- OpenClaw ayrıca, güvenilir paylaşılan gizli yardımcı akışları için dar bir backend/container-local self-connect yoluna sahiptir.
- Aynı sunucudaki tailnet veya LAN bağlantıları, eşleştirme açısından yine de uzak olarak değerlendirilir ve
  onay gerektirir.
- Tüm WS istemcileri, `connect` sırasında `device` kimliğini içermelidir (operator + node).
  Control UI bunu yalnızca şu modlarda atlayabilir:
  - localhost'a özel güvensiz HTTP uyumluluğu için `gateway.controlUi.allowInsecureAuth=true`.
  - başarılı `gateway.auth.mode: "trusted-proxy"` operator Control UI auth.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (acil durum, ciddi güvenlik düşüşü).
- Tüm bağlantılar, sunucu tarafından sağlanan `connect.challenge` nonce değerini imzalamalıdır.

### Cihaz auth taşıma tanılamaları

Hâlâ challenge öncesi imzalama davranışını kullanan eski istemciler için, `connect` artık
`error.details.code` altında kararlı `error.details.reason` ile `DEVICE_AUTH_*` ayrıntı kodları döndürür.

Yaygın taşıma hataları:

| Mesaj                       | details.code                     | details.reason           | Anlamı                                             |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | İstemci `device.nonce` alanını atladı (veya boş gönderdi). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | İstemci eski/yanlış nonce ile imzaladı.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | İmza payload'u v2 payload'u ile eşleşmiyor.        |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | İmzalı zaman damgası izin verilen kaymanın dışında. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`, genel anahtar parmak iziyle eşleşmiyor. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Genel anahtar biçimi/kanonikleştirme başarısız oldu. |

Taşıma hedefi:

- Her zaman `connect.challenge` bekleyin.
- Sunucu nonce'unu içeren v2 payload'unu imzalayın.
- Aynı nonce'u `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza payload'u `v3`'tür; bu, device/client/role/scopes/token/nonce alanlarına ek olarak `platform` ve `deviceFamily` değerlerini bağlar.
- Eski `v2` imzaları uyumluluk için kabul edilmeye devam eder, ancak eşleştirilmiş cihaz
  meta veri sabitlemesi yeniden bağlantıda komut ilkesini yine de denetler.

## TLS + sabitleme

- WS bağlantıları için TLS desteklenir.
- İstemciler isteğe bağlı olarak gateway sertifika parmak izini sabitleyebilir (bkz. `gateway.tls`
  config'i ile birlikte `gateway.remote.tlsFingerprint` veya CLI `--tls-fingerprint`).

## Kapsam

Bu protokol **tam gateway API'sini** açığa çıkarır (durum, kanallar, modeller, sohbet,
aracı, oturumlar, Node'lar, onaylar vb.). Tam yüzey
`src/gateway/protocol/schema.ts` içindeki TypeBox şemaları tarafından tanımlanır.

## İlgili

- [Bridge protocol](/tr/gateway/bridge-protocol)
- [Gateway runbook](/tr/gateway)
