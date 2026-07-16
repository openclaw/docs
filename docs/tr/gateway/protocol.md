---
read_when:
    - Gateway WS istemcilerini uygulama veya güncelleme
    - Protokol uyuşmazlıklarında veya bağlantı hatalarında hata ayıklama
    - Protokol şeması/modelleri yeniden oluşturuluyor
summary: 'Gateway WebSocket protokolü: el sıkışma, çerçeveler, sürümleme'
title: Gateway protokolü
x-i18n:
    generated_at: "2026-07-16T17:12:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cc92cfed4cf1bcc7b9499d90eef9f9225a89c0e6a71bb6230bb416f8f6884b5
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protokolü, OpenClaw için tek denetim düzlemi ve Node aktarım mekanizmasıdır.
Operatör ve Node istemcileri (CLI, web kullanıcı arayüzü, macOS uygulaması, iOS/Android Node'ları,
başsız Node'lar) WebSocket üzerinden bağlanır ve el sıkışma sırasında bir **rol** ve **kapsam** bildirir.

## Aktarım ve çerçeveleme

- WebSocket, metin çerçeveleri, JSON yükleri.
- İlk çerçeve **mutlaka** bir `connect` isteği olmalıdır.
- Bağlantı öncesi çerçeveler 64 KiB ile sınırlıdır (`MAX_PREAUTH_PAYLOAD_BYTES`). El sıkışmadan
  sonra `hello-ok.policy.maxPayload` ve
  `hello-ok.policy.maxBufferedBytes` kurallarına uyun. Tanılama etkinleştirildiğinde, aşırı büyük
  gelen çerçeveler ve yavaş giden arabellekler, Gateway çerçeveyi kapatmadan veya
  düşürmeden önce `payload.large` olayları yayınlar. Bu olaylar `surface`, bayt
  boyutları, sınırlar ve güvenli bir neden kodu taşır; mesaj gövdelerini, ek
  içeriklerini, ham çerçeve baytlarını, token'ları, çerezleri veya gizli bilgileri asla taşımaz.

Çerçeve biçimleri:

- İstek: `{type:"req", id, method, params}`
- Yanıt: `{type:"res", id, ok, payload|error}`
- Olay: `{type:"event", event, payload, seq?, stateVersion?}`

Yan etkiye neden olan yöntemler idempotency anahtarları gerektirir (şemaya bakın).

## El sıkışma

Gateway, bağlantı öncesi bir sınama gönderir:

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

İstemci `connect` ile yanıt verir:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
    "maxProtocol": 4,
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

Gateway, `hello-ok` ile yanıt verir:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 4,
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

`server`, `features`, `snapshot`, `policy` ve `auth`,
`HelloOkSchema` (`packages/gateway-protocol/src/schema/frames.ts`) tarafından zorunlu tutulur. `auth`,
herhangi bir cihaz token'ı verilmediğinde bile üzerinde anlaşmaya varılan rolü/kapsamları bildirir
(yukarıdaki biçim). `pluginSurfaceUrls` isteğe bağlıdır ve Plugin yüzey adlarını (ör.
`canvas`) kapsamlı barındırılan URL'lere eşler; süresi dolabileceğinden Node'lar
yeni bir girdi almak için `{ "surface": "canvas" }` ile
`node.pluginSurface.refresh` çağrısı yapar.
Kullanımdan kaldırılmış `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh`
yolu desteklenmez; Plugin yüzeylerini kullanın.
Anlık görüntünün isteğe bağlı `appliedConfigHash` değeri, etkin Gateway çalışma zamanı
tarafından kabul edilen çözümlenmiş kaynak yapılandırma revizyonudur. İstemciler, daha yeni
kaydedilmiş bir yapılandırmanın hâlâ yeniden başlatma gerektirip gerektirmediğini belirlemek için
bunu `config.get.configRevisionHash` ile karşılaştırabilir. `config.get.hash`, yapılandırma
yazma çakışması korumaları tarafından kullanılan ham kök dosya revizyonu olarak kalır.

Gateway başlangıç yardımcı hizmetlerini hâlâ tamamlıyorken `connect`,
`details.reason: "startup-sidecars"` ve `retryAfterMs` ile yeniden denenebilir bir
`UNAVAILABLE` hatası döndürebilir. Bunu kalıcı bir el sıkışma hatası olarak değerlendirmek
yerine bağlantı bütçeniz içinde yeniden deneyin.

Bir cihaz token'ı verildiğinde `hello-ok.auth` bunu ekler:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Yerleşik QR/kurulum kodu önyüklemesi, mobil cihaza devir yoludur. Başarılı bir
temel kurulum kodu bağlantısı, birincil Node token'ı ile sınırlandırılmış bir
operatör token'ı döndürür:

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

Bu operatör devri bilinçli olarak sınırlandırılmıştır: Talk yapılandırmasını
okumaya yönelik `operator.talk.secrets` dahil olmak üzere mobil operatör döngüsünü
ve yerel kurulumu başlatmaya yeterlidir, ancak eşleştirme değiştirme kapsamları ve
`operator.admin` yoktur. Daha geniş eşleştirme/yönetici erişimi, ayrı bir onaylanmış
eşleştirme veya token akışı gerektirir. `hello-ok.auth.deviceTokens` değerini yalnızca önyükleme
kimlik doğrulaması güvenilir bir aktarım üzerinden (`wss://` veya geri döngü/yerel
eşleştirme) çalıştırıldığında kalıcılaştırın.

Güvenilir, aynı süreçteki arka uç istemcileri (`client.id: "gateway-client"`,
`client.mode: "backend"`), paylaşılan Gateway token'ı/parolasıyla kimlik doğrularken doğrudan
geri döngü bağlantılarında `device` değerini atlayabilir. Bu yol, dahili
denetim düzlemi RPC'lerine (ör. alt ajan oturum güncellemeleri) ayrılmıştır ve eski
CLI/cihaz eşleştirme temellerinin yerel arka uç çalışmalarını engellemesini önler. Uzak,
tarayıcı kaynaklı, Node ve açık cihaz token'ı/cihaz kimliği kullanan istemciler yine
normal eşleştirme ve kapsam yükseltme denetimlerinden geçer.

### Çalışan rolü ve kapalı protokol

Bulut çalışanları, Gateway'in sahip olduğu ve ana makine anahtarına sabitlenmiş SSH tüneli
üzerinden ayrılmış bir geri döngü girişini kullanır. Bu giriş yalnızca çalışan kimliğini kabul
eder ve genel kimlik doğrulamasını, Node olaylarını, operatör RPC'lerini veya Plugin yöntemlerini
asla yönlendirmez. Katı bir `connect`, ortama, paket karmasına, sahip dönemine,
RPC kümesi sürümüne, süre sonuna ve null olabilen tek bir oturuma bağlı; depolama konumunda
karmalanmış, kısa ömürlü bir kimlik bilgisini doğrular. Ayrıca geçerli sürümü ve özellik
kümesini ayrı olarak denetler. Başarı durumunda asgari `worker-hello-ok` döndürülür;
özellik anlaşması genel protokol sürümünden bağımsızdır. Üzerinde anlaşmaya varılan bir
`worker.inference.start` çerçevesi 25 MiB'a kadar çıkabilse de çerçeveler 64 KiB'ın altında kalır.
Kapalı izin listesi `worker.heartbeat`, `worker.transcript.commit`, `worker.live-event`,
`worker.inference.start` ve `worker.inference.cancel` öğelerini içerir.

Transkript işlemeleri; sahip dönemi sınırlaması, Gateway'in sahip olduğu bir oturum bağlaması,
temel yaprak karşılaştırma-ve-değiştirme işlemi ve kalıcı sıra yeniden yürütmesi kullanır;
Gateway, normal oturum yazıcısı aracılığıyla transkript girdisi ve üst öğe kimlikleri oluşturur.
Sahiplik ve süre sonu her RPC'de yeniden denetlenir.

### İstemci yetenekleri

Operatör istemcileri, `connect.params.caps` içinde isteğe bağlı yetenekleri bildirebilir:

- `tool-events`: yapılandırılmış araç yaşam döngüsü olaylarını kabul eder.
- `inline-widgets`: barındırılan satır içi pencere öğesi araç sonuçlarını işleyebilir.

İstemci yetenekleri yetkilendirmeyi değil, bağlı istemciyi tanımlar. Ajan araçları gerekli yetenekleri bildirebilir; kaynak istemcinin `caps` değerinde gereksinimlerin tamamı bulunmadıkça Gateway bu araçları dahil etmez. Kanal kaynaklı çalıştırmaların Gateway istemci yetenekleri yoktur; bu nedenle araç politikası bunlara açıkça izin verse bile yetenekle sınırlandırılmış araçlar kullanılamaz.

### Node bağlantısı örneği

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
    "maxProtocol": 4,
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

Node'lar bağlantı sırasında yetenek beyanlarını bildirir:

- `caps`: `camera`, `canvas`, `screen`,
  `location`, `voice`, `talk` gibi üst düzey kategoriler.
- `commands`: çağırma için komut izin listesi.
- `permissions`: ayrıntılı açma/kapatma seçenekleri (ör. `screen.record`, `camera.capture`).

Gateway bunları beyan olarak değerlendirir ve sunucu tarafı izin listelerini uygular.

## Roller ve kapsamlar

Operatör kapsam modelinin tamamı, onay sırasındaki denetimler ve paylaşılan gizli bilgi
semantiği için [Operatör kapsamları](/tr/gateway/operator-scopes) bölümüne bakın.

Roller:

- `operator`: denetim düzlemi istemcisi (CLI/kullanıcı arayüzü/otomasyon).
- `node`: yetenek ana makinesi (kamera/ekran/tuval/system.run).
- `worker`: ayrılmış, kapalı çalışan protokolündeki bulut yürütme ana makinesi.

Operatör kapsamları (`src/gateway/operator-scopes.ts`), tam kapalı küme:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` içeren `talk.config`, `operator.talk.secrets` (veya
`operator.admin`) gerektirir. Gizli bilgiler dahil edildiğinde etkin Talk sağlayıcısının
kimlik bilgisini `talk.resolved.config.apiKey` üzerinden okuyun; `talk.providers.<id>.apiKey`
kaynak biçiminde kalır ve bir SecretRef nesnesi veya sansürlenmiş bir dize olabilir.

Plugin tarafından kaydedilen Gateway RPC yöntemleri kendi operatör kapsamlarını isteyebilir,
ancak şu ayrılmış çekirdek ön ekleri her zaman `operator.admin`
(`src/shared/gateway-method-policy.ts`) olarak çözümlenir: `config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`.

Yöntem kapsamı yalnızca ilk denetimdir. `chat.send` üzerinden ulaşılan bazı eğik
çizgili komutlar daha katı komut düzeyi denetimleri uygular: kalıcı `/config set` ve
`/config unset` yazma işlemleri, daha düşük bir operatör kapsamına zaten sahip olan
Gateway istemcileri için bile `operator.admin` gerektirir.

`node.pair.approve`, bekleyen isteğin bildirdiği `commands`
(`src/infra/node-pairing-authz.ts`) temelinde, temel yöntem kapsamına (`operator.pairing`) ek olarak
onay sırasında ek bir kapsam denetimine sahiptir:

| Bildirilen komutlar                                                                                                           | Gerekli kapsamlar                       |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| yok                                                                                                                           | `operator.pairing`                      |
| olağan komutlar                                                                                                               | `operator.pairing` + `operator.write` |
| `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` veya `system.execApprovals.get/set` içerir | `operator.pairing` + `operator.admin` |

### Yetenekler/komutlar/izinler (Node)

Node'lar bağlantı sırasında yetenek beyanlarını bildirir:

- `caps`: `camera`, `canvas`, `screen`,
  `location`, `voice` ve `talk` gibi üst düzey yetenek kategorileri.
- `commands`: çağırma için komut izin listesi.
- `permissions`: ayrıntılı açma/kapatma seçenekleri (ör. `screen.record`, `camera.capture`).

Gateway bunları **beyanlar** olarak ele alır ve sunucu tarafı izin listelerini uygular.
Bağlı node'lar, başarılı bir bağlantı veya yeniden bağlantı sonrasında `node.pluginTools.update` ile
isteğe bağlı, agent tarafından görülebilen plugin veya MCP aracı tanımlayıcıları yayımlayabilir.
Başsız node ana makineleri, bildirimsel MCP envanteri değişikliklerini uygulamak için yeniden
başlatılır. Bu güncelleme yöntemi tek yayımlama yoludur; plugin aracı tanımlayıcıları
`connect` parametrelerinde kabul edilmez. Her tanımlayıcı, sağlayıcı açısından güvenli
bir araç `name` kullanmalı ve node'un geçerli komut izin listesindeki bir
`command` öğesini adlandırmalıdır. Gateway, eşleştirilmiş node'dan gelen tanımlayıcı
meta verilerine güvenir, onaylanmış komut yüzeyinin dışındaki tanımlayıcıları filtreler,
node bağlantısı kesildiğinde bunları kaldırır ve operatörlerin başka bir node'un kataloğunu
değiştirme girişimlerini reddeder. Node tarafından yayımlanan tanımlayıcıları yok saymak için
`gateway.nodes.pluginTools.enabled: false` ayarını yapın.

Bağlı node ana makineleri, tam Skills değiştirme kataloglarını
`node.skills.update` ile yayımlar. Bu node rolü yöntemi, node Skills yayımlamanın tek
yoludur; Skills, `connect` parametrelerinde kabul edilmez. Her tanımlayıcı
güvenli bir ad, açıklama ve sınırlandırılmış `SKILL.md` içeriği barındırır.
Gateway bu içeriği normal Skills yükleyicisiyle ayrıştırır, node bağlıyken agent Skills
anlık görüntülerine dahil eder ve bağlantı kesildiğinde kaldırır. Node tarafından
yayımlanan Skills'i yok saymak için `gateway.nodes.skills.enabled: false` ayarını yapın.

## Mevcudiyet

- `system-presence`, cihaz kimliğine göre anahtarlanmış ve
  `deviceId`, `roles` ile `scopes` bilgilerini içeren girdiler döndürür; böylece kullanıcı arayüzleri, bir cihaz hem operatör hem de node olarak bağlansa bile cihaz başına bir satır gösterebilir.
- `node.list`, isteğe bağlı `lastSeenAtMs` ve `lastSeenReason` bilgilerini içerir. Bağlı
  node'lar, `connect` nedeni ile geçerli bağlantı zamanını bildirir; eşleştirilmiş node'lar
  ayrıca güvenilir bir node olayı aracılığıyla kalıcı arka plan mevcudiyeti bildirebilir.

Yerel macOS node'ları, sınırlandırılmış giriş boşta kalma süresiyle kimliği doğrulanmış
`node.presence.activity` olayları da gönderebilir. Gateway, etkinlik zaman damgalarını
kendi saatine göre türetir, en güncel bağlı Mac'i `node.list` ve
`node.describe` üzerinden sunar ve `node.presence` güncellemelerini okuma kapsamlı
istemcilere yayınlar. Seçim, gizlilik, model bağlamı ve bildirim yönlendirme davranışı için
[Etkin bilgisayar mevcudiyeti](/nodes/presence) bölümüne bakın.

### Node arka planda canlı olayı

Node'lar, eşleştirilmiş bir node'un arka planda uyanma sırasında canlı olduğunu, onu
bağlı olarak işaretlemeden kaydetmek için `event: "node.presence.alive"` ile `node.event`
çağrısı yapar:

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter'ın iPhone'u\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` kapalı bir enum'dur: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, `connect`. Bilinmeyen değerler
`background` (`src/shared/node-presence.ts`) olarak normalleştirilir. Olay yalnızca
kimliği doğrulanmış node cihaz oturumlarında kalıcı hale getirilir; cihazı olmayan veya
eşleştirilmemiş oturumlar `handled: false` döndürür.

Başarılı Gateway'ler yapılandırılmış bir sonuç döndürür:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Eski Gateway'ler `node.event` için yalnızca `{ "ok": true }` döndürebilir;
bunu kalıcı mevcudiyet kaydı olarak değil, onaylanmış bir RPC olarak değerlendirin.

## Yayın olayı kapsamlandırması

Sunucu tarafından gönderilen yayın olayları kapsamla sınırlandırılır; böylece eşleştirme
kapsamlı veya yalnızca node oturumları, oturum içeriğini pasif olarak almaz
(`src/gateway/server-broadcast.ts`):

- Sohbet, agent ve araç sonucu çerçeveleri (akışla gönderilen `agent` olayları, araç sonucu
  olayları) en az `operator.read` gerektirir. Buna sahip olmayan oturumlar bu
  çerçeveleri tamamen atlar.
- Plugin tarafından tanımlanan `plugin.*` yayınları varsayılan olarak `operator.write` veya
  `operator.admin` ile sınırlandırılır; `plugin.approval.requested` /
  `plugin.approval.resolved` gibi açık girdiler bunun yerine
  `operator.approvals` kullanır.
- Durum/aktarım olayları (`heartbeat`, `presence`, `tick`, bağlantı/bağlantı kesme
  yaşam döngüsü) kısıtlanmadan kalır; böylece aktarım durumu, kimliği doğrulanmış her
  oturum tarafından gözlemlenebilir.
- Bilinmeyen yayın olayı aileleri, kayıtlı bir işleyici açıkça gevşetmediği sürece
  varsayılan olarak kapsamla sınırlandırılır (kapalı kalarak güvenli).

Her istemci bağlantısı kendi istemci başına sıra numarasını tutar; böylece farklı istemciler
olay akışının kapsamla filtrelenmiş farklı alt kümelerini görse bile yayınlar o sokette
tekdüze artan sırada kalır.

## RPC yöntem aileleri

`hello-ok.features.methods`, `src/gateway/server-methods-list.ts` ile yüklenen plugin/kanal yöntemi
dışa aktarımlarından oluşturulan ihtiyatlı bir keşif listesidir; her yöntemin otomatik
oluşturulmuş bir dökümü değildir ve bazı yöntemler (örneğin `push.test`,
`web.login.start`, `web.login.wait`, `sessions.usage`) gerçek ve çağrılabilir
yöntemler olmasına rağmen kasıtlı olarak keşif dışında bırakılır. Bunu
`src/gateway/server-methods/*.ts` öğelerinin tam bir listesi olarak değil, özellik keşfi olarak değerlendirin.

<AccordionGroup>
  <Accordion title="Sistem ve kimlik">
    - `health`, önbelleğe alınmış veya yeni sorgulanmış Gateway sağlık anlık görüntüsünü döndürür.
    - `diagnostics.stability`, yakın zamana ait sınırlandırılmış tanılama kararlılığı kaydedicisini döndürür: olay adları, sayılar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/plugin adları, oturum kimlikleri. Sohbet metni, Webhook gövdeleri, araç çıktıları, ham istek/yanıt gövdeleri, token'lar, çerezler veya gizli bilgiler içermez. `operator.read` gerektirir.
    - `status`, `/status` tarzı Gateway özetini döndürür; hassas alanlar yalnızca yönetici kapsamlı operatör istemcileri içindir.
    - `gateway.identity.get`, aktarma ve eşleştirme akışlarında kullanılan Gateway cihaz kimliğini döndürür.
    - `system-presence`, bağlı operatör/node cihazları için geçerli mevcudiyet anlık görüntüsünü döndürür.
    - `system-event`, bir sistem olayı ekler ve mevcudiyet bağlamını güncelleyebilir/yayınlayabilir.
    - `last-heartbeat`, kalıcılaştırılmış en son Heartbeat olayını döndürür.
    - `set-heartbeats`, Gateway'de Heartbeat işlemeyi açar veya kapatır.
    - `gateway.suspend.prepare`, yalnızca izlenen Gateway işi boşta olduğunda kısa bir işbirlikçi askıya alma kirası oluşturur. `gateway.suspend.status` bu kirayı denetler ve `gateway.suspend.resume` çözülme veya iptal edilmiş bir ana makine işleminden sonra kirayı serbest bırakır.

  </Accordion>

  <Accordion title="Modeller ve kullanım">
    - `models.list`, çalışma zamanında izin verilen model kataloğunu döndürür. Aşağıdaki "`models.list` görünümleri" bölümüne bakın.
    - `usage.status`, sağlayıcı kullanım aralıklarını/kalan kota özetlerini döndürür.
    - `usage.cost`, bir tarih aralığı için toplu maliyet kullanım özetlerini döndürür. Tek bir agent için `agentId`, yapılandırılmış agent'ları toplamak için `agentScope: "all"` iletin.
    - `doctor.memory.status`, etkin varsayılan agent çalışma alanı için vektör belleği / önbelleğe alınmış gömme hazırlığını döndürür. Yalnızca açık bir canlı gömme sağlayıcısı ping'i için `{ "probe": true }` veya `{ "deep": true }` iletin. Dreaming deposu istatistiklerini tek bir agent çalışma alanıyla sınırlandırmak için `{ "agentId": "agent-id" }` iletin; atlanırsa yapılandırılmış Dreaming çalışma alanları toplanır.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` ve `doctor.memory.dedupeDreamDiary` isteğe bağlı `{ "agentId": "agent-id" }` kabul eder; atlanırsa yapılandırılmış varsayılan agent çalışma alanında çalışırlar.
    - `doctor.memory.remHarness`, çalışma alanı yolları, bellek parçacıkları, işlenmiş temellendirilmiş Markdown ve derin yükseltme adayları dahil olmak üzere uzak kontrol düzlemi istemcileri için sınırlandırılmış, salt okunur bir REM deneme düzeni önizlemesi döndürür. `operator.read` gerektirir.
    - `sessions.usage`, oturum başına kullanım özetlerini döndürür. Tek bir agent için `agentId`, yapılandırılmış agent'ları birlikte listelemek için `agentScope: "all"` iletin.
      Her iki kullanım yöntemi de yaz saati uygulamasına duyarlı takvim günü sınırları ve bölümleri için bir IANA `timeZone` ile `mode: "specific"` kabul eder. `utcOffset`, eski istemciler için ve Gateway çalışma zamanı istenen bölgeyi tanımadığında geri dönüş olarak desteklenmeye devam eder.
    - `sessions.usage.timeseries`, bir oturum için zaman serisi kullanımını döndürür.
    - `sessions.usage.logs`, bir oturum için kullanım günlüğü girdilerini döndürür.

  </Accordion>

  <Accordion title="Kanallar ve oturum açma yardımcıları">
    - `channels.status`, yerleşik + paketlenmiş kanal/plugin durum özetlerini döndürür.
    - `channels.logout`, kanalın desteklediği durumlarda belirli bir kanal/hesaptan çıkış yapar.
    - `web.login.start`, geçerli QR özellikli web kanalı sağlayıcısı için bir QR/web oturum açma akışı başlatır.
    - `web.login.wait`, bu akışın tamamlanmasını bekler ve başarılı olduğunda kanalı başlatır.
    - `push.test`, kayıtlı bir iOS node'una test APNs anlık bildirimi gönderir.
    - `voicewake.get`, depolanan uyandırma sözcüğü tetikleyicilerini döndürür.
    - `voicewake.set`, uyandırma sözcüğü tetikleyicilerini günceller ve değişikliği yayınlar.

  </Accordion>

  <Accordion title="Plugin yönetimi">
    - `plugins.list` (`operator.read`), yüklü plugin envanterinin yanı sıra yerel olarak seçilmiş resmî önerileri, tanılamaları ve geçerli yükleme modunun değişikliklere izin verip vermediğini döndürür.
    - `plugins.search` (`operator.read`), yüklenebilir ClawHub kod plugin'i ve paket plugin'i ailelerini arar. Boş olmayan `query` ve 1 ile 100 arasında isteğe bağlı `limit` iletin.
    - `plugins.install` (`operator.admin`), `{ source: "official", pluginId }` ile resmî bir katalog girdisini veya `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }` ile bir ClawHub paketini yükler. ClawHub yüklemeleri Gateway güven, bütünlük ve yükleme ilkesi denetimlerini korur. Başarılı yüklemeler Gateway'in yeniden başlatılmasını gerektirir.
    - `plugins.setEnabled` (`operator.admin`), yüklü bir plugin'in etkinleştirme ilkesini `{ pluginId, enabled }` ile değiştirir. Yanıt; güncellenmiş katalog girdisini, yeniden başlatma meta verilerini ve yuva seçimi uyarılarını içerir.
    - `plugins.uninstall` (`operator.admin`), haricen yüklenmiş bir plugin'i `{ pluginId }` ile kaldırır: yapılandırma başvuruları, yükleme kaydı ve yönetilen dosyalar. Paketlenmiş plugin'ler kaldırılamaz, yalnızca devre dışı bırakılabilir. Yanıt, kaldırma eylemlerini listeler ve her zaman Gateway'in yeniden başlatılmasını gerektirir.

  </Accordion>

  <Accordion title="Mesajlaşma ve günlükler">
    - `send`, sohbet çalıştırıcısı dışındaki kanal/hesap/iş parçacığı hedefli gönderimler için doğrudan giden teslimat RPC'sidir.
    - `logs.tail`, yapılandırılmış Gateway dosya günlüğünün son kısmını imleç/sınır ve azami bayt denetimleriyle döndürür.

  </Accordion>

  <Accordion title="Operatör terminali">
    - `terminal.open`, açıkça belirtilen bir `agentId` veya varsayılan ajan için ana makinede bir PTY başlatır ve çözümlenen ajanı, çalışma dizinini, kabuğu ve yalıtım durumunu döndürür.
    - `terminal.input`, `terminal.resize` ve `terminal.close` yalnızca çağrıyı yapan bağlantının sahip olduğu oturumlar üzerinde çalışır.
    - `terminal.upload`, 16 MiB'a kadar tek bir base64 dosyasını kabul eder, dosyayı oturumun Gateway veya eşleştirilmiş Node ana makinesindeki özel, 24 saatlik geçici bir dizine yerleştirir ve mutlak yolu döndürür. Çağıran tarafın yine de bu yolu yapıştırması veya başka bir şekilde kullanması gerekir; RPC hiçbir zaman terminal girdisi yazmaz veya komut çalıştırmaz.
    - `terminal.data` ve `terminal.exit` olayları yalnızca oturumun sahibi olan bağlantıya aktarılır.
    - Bağlantısı kesilen oturumlar sonlandırılmaz, ayrılır: son çıktı, sunucu tarafındaki sınırlı bir arabellekte birikirken `gateway.terminal.detachedSessionTimeoutSeconds` boyunca yeniden bağlanabilir durumda kalırlar (varsayılan 300; `0`, bağlantı kesildiğinde sonlandırma davranışını geri yükler).
    - `terminal.list`, bağlanılabilir oturumları döndürür; `terminal.attach`, canlı veya ayrılmış bir oturumu çağrıyı yapan bağlantıya yeniden bağlar ve yeniden oynatma arabelleğini döndürür (tmux tarzı devralma — önceki canlı sahip, nedeni `detached` olan `terminal.exit` olayını alır); `terminal.text`, bağlanmadan arabelleği düz metin olarak okur.
    - Her terminal yöntemi `operator.admin` gerektirir; `gateway.terminal.enabled` açıkça true olmalıdır. Tamamen korumalı alan içindeki ajanlar reddedilir ve ajan politikası değişikliği, ayrılmış olanlar dâhil mevcut ve işlemdeki PTY'leri kapatır.

  </Accordion>

  <Accordion title="Talk ve TTS">
    - `talk.catalog`; konuşma, akışlı transkripsiyon ve gerçek zamanlı ses için salt okunur Talk sağlayıcı kataloğunu döndürür: sağlayıcı gizli bilgilerini döndürmeden veya genel yapılandırmayı değiştirmeden standart sağlayıcı kimlikleri, kayıt defteri takma adları, etiketler, yapılandırılmış durum, isteğe bağlı grup düzeyinde `ready` sonucu, kullanıma sunulan model/ses kimlikleri, standart modlar, aktarımlar, beyin stratejileri ve gerçek zamanlı ses/yetenek bayrakları. Geçerli Gateway'ler çalışma zamanı sağlayıcı seçimini uyguladıktan sonra `ready` değerini ayarlar; eski Gateway'lerde bunun bulunmamasını doğrulanmamış olarak değerlendirin.
    - `talk.config`, etkin Talk yapılandırma yükünü döndürür; `includeSecrets`, `operator.talk.secrets` (veya `operator.admin`) gerektirir.
    - `talk.session.create`; `realtime/gateway-relay`, `transcription/gateway-relay` veya `stt-tts/managed-room` için Gateway'in sahip olduğu bir Talk oturumu oluşturur. `stt-tts/managed-room` için `sessionKey` ileten `operator.write` çağıranları, kapsamlı oturum anahtarı görünürlüğü için `spawnedBy` değerini de iletmelidir; kapsamsız `sessionKey` oluşturma ve `brain: "direct-tools"`, `operator.admin` gerektirir.
    - `talk.session.join`, yönetilen oda oturum belirtecini doğrular, gerektiğinde `session.ready` veya `session.replaced` yayar ve hiçbir zaman düz metin belirteci ya da karmasını değil, oda/oturum meta verilerini ve son Talk olaylarını döndürür.
    - `talk.session.appendAudio`, base64 PCM giriş sesini Gateway'in sahip olduğu gerçek zamanlı aktarma ve transkripsiyon oturumlarına ekler.
    - `talk.session.startTurn`, `talk.session.endTurn` ve `talk.session.cancelTurn`, durum temizlenmeden önce eski turu reddederek yönetilen oda turu yaşam döngüsünü yürütür.
    - `talk.session.cancelOutput`, öncelikle Gateway aktarma oturumlarında VAD geçitli araya girme için asistan ses çıkışını durdurur.
    - `talk.session.submitToolResult`, Gateway'in sahip olduğu gerçek zamanlı aktarma oturumunun yaydığı bir sağlayıcı araç çağrısını tamamlar. İstek, sağlayıcı köprüsünün sunduğu tüm eşzamansız tamamlanma sinyallerini bekler; başarısız gönderimler bağlantılı çalıştırmayı etkin tutar ve başarılı bir araç sonucu olayı yaymaz. Ara araç çıktısı için `options: { willContinue: true }` veya sağlayıcı köprüsü engelleme desteği bildirdiğinde ve sonucun başka bir yanıt başlatmaması gerektiğinde `options: { suppressResponse: true }` iletin.
    - `talk.session.steer`, Gateway'in sahip olduğu, ajan destekli Talk oturumundaki etkin çalıştırmaya sesli denetim gönderir: `{ sessionId, text, mode? }`; burada `mode`, `status`, `steer`, `cancel` veya `followup` değerlerinden biridir; belirtilmeyen mod, söylenen metinden sınıflandırılır.
    - `talk.session.close`, Gateway'in sahip olduğu bir aktarma, transkripsiyon veya yönetilen oda oturumunu kapatır ve sonlandırıcı Talk olayları yayar.
    - `talk.mode`, WebChat/Control UI istemcileri için geçerli Talk modu durumunu ayarlar/yayınlar.
    - `talk.client.create`, Gateway yapılandırma, kimlik bilgileri, talimatlar ve araç politikasının sahibi olurken `webrtc` veya `provider-websocket` kullanarak istemcinin sahip olduğu gerçek zamanlı bir sağlayıcı oturumu oluşturur.
    - `talk.client.toolCall`, istemcinin sahip olduğu gerçek zamanlı aktarımların sağlayıcı araç çağrılarını Gateway politikasına iletmesini sağlar. Desteklenen ilk araç `openclaw_agent_consult`'dır; istemciler sağlayıcıya özgü araç sonucunu göndermeden önce bir çalıştırma kimliği alır ve normal sohbet yaşam döngüsü olaylarını bekler.
    - `talk.client.steer`, istemcinin sahip olduğu gerçek zamanlı aktarımlar için etkin çalıştırma sesli denetimini gönderir. Gateway, etkin gömülü çalıştırmayı `sessionKey` üzerinden çözümler ve yönlendirmeyi sessizce yok saymak yerine yapılandırılmış bir kabul/ret sonucu döndürür.
    - `talk.event`; gerçek zamanlı, transkripsiyon, STT/TTS, yönetilen oda, telefon ve toplantı bağdaştırıcıları için tek Talk olay kanalıdır.
    - `talk.speak`, etkin Talk konuşma sağlayıcısı aracılığıyla konuşma sentezler.
    - `tts.status`; TTS etkin durumunu, etkin sağlayıcıyı, yedek sağlayıcıları ve sağlayıcı yapılandırma durumunu döndürür.
    - `tts.providers`, görünür TTS sağlayıcı envanterini döndürür.
    - `tts.enable` ve `tts.disable`, TTS tercihleri durumunu açar veya kapatır.
    - `tts.setProvider`, tercih edilen TTS sağlayıcısını günceller.
    - `tts.convert`, tek seferlik metinden konuşmaya dönüştürme işlemi gerçekleştirir.
    - `tts.speak` (`operator.write`), boş olmayan `text` değerini yapılandırılmış genel TTS sağlayıcı zinciriyle işler ve tek bir klibin tamamını `audioBase64` olarak satır içinde, ayrıca `provider` ve isteğe bağlı `outputFormat`, `mimeType` ve `fileExtension` meta verileriyle döndürür. `tts.convert`'dan farklı olarak Gateway'e yerel bir yol döndürmez; `talk.speak`'dan farklı olarak Talk sağlayıcısı gerektirmez. `messages.tts.maxTextLength` üzerindeki metin `INVALID_REQUEST` döndürür; sentez hataları `UNAVAILABLE` döndürür.

  </Accordion>

  <Accordion title="Gizli bilgiler, yapılandırma, güncelleme ve sihirbaz">
    - `secrets.reload`, etkin SecretRef'leri yeniden çözümler ve çalışma zamanı gizli bilgi durumunu yalnızca tam başarı durumunda değiştirir.
    - `secrets.resolve`, belirli bir komut/hedef kümesi için komut hedefi gizli bilgi atamalarını çözümler.
    - `config.get`; diskteki geçerli yapılandırma anlık görüntüsünü, ham kök dosya `hash` değerini, çözümlenmiş `configRevisionHash` değerini ve etkin Gateway çalışma zamanının kabul ettiği çözümlenmiş revizyon için isteğe bağlı `appliedConfigHash` değerini döndürür.
    - `config.set`, doğrulanmış bir yapılandırma yükü yazar.
    - `config.patch`, kısmi bir yapılandırma güncellemesini birleştirir. Yıkıcı dizi değişimi, etkilenen yolun `replacePaths` içinde bulunmasını gerektirir; dizi girdilerinin altındaki iç içe diziler, `agents.list[].skills` gibi `[]` yollarını kullanır.
    - `config.apply`, yapılandırma yükünün tamamını doğrular ve değiştirir.
    - `config.schema`, Control UI ve CLI araçlarının kullandığı canlı yapılandırma şeması yükünü döndürür: şema, `uiHints`, sürüm, oluşturma meta verileri, yüklenebildiğinde Plugin + kanal şeması meta verileri. Eşleşen alan belgeleri bulunduğunda, iç içe nesne, joker karakter, dizi öğesi ve `anyOf` / `oneOf` / `allOf` bileşim dalları dâhil olmak üzere UI ile aynı etiketlerden/yardım metninden gelen `title` / `description` meta verilerini içerir.
    - `config.schema.lookup`, tek bir yapılandırma yolu için yol kapsamlı bir arama yükü döndürür: normalleştirilmiş yol, sığ bir şema düğümü, eşleşen ipucu + `hintPath`, isteğe bağlı `reloadKind` ve UI/CLI ayrıntılı incelemesi için doğrudan alt öğe özetleri. `reloadKind`, `restart`, `hot` veya `none` (`src/config/schema.ts`) değerlerinden biridir ve istenen yol için Gateway yapılandırma yeniden yükleme planlayıcısını yansıtır. Arama şeması düğümleri, kullanıcıya yönelik belgeleri ve yaygın doğrulama alanlarını (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, sayısal/dize/dizi/nesne sınırları, `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`) korur. Alt öğe özetleri; `key`, normalleştirilmiş `path`, `type`, `required`, `hasChildren`, isteğe bağlı `reloadKind` ile eşleşen `hint` / `hintPath` değerlerini sunar.
    - `update.run`, Gateway güncelleme akışını çalıştırır ve yalnızca güncelleme başarılı olursa yeniden başlatma planlar; oturumu olan çağıranlar `continuationMessage` değerini ekleyebilir, böylece başlangıçta yeniden başlatmayı sürdürme kuyruğu üzerinden bir takip ajan turu sürdürülür. Denetim düzleminden yapılan paket yöneticisi güncellemeleri ve denetimli git çalışma kopyası güncellemeleri, canlı Gateway içindeki paket ağacını değiştirmek veya çalışma kopyası/derleme çıktısını değiştirmek yerine ayrılmış bir yönetilen hizmet devri kullanır. Başlatılan devir `result.reason: "managed-service-handoff-started"` ve `handoff.status: "started"` ile `ok: true` döndürür; kullanılamayan veya başarısız devirler `managed-service-handoff-unavailable` ya da `managed-service-handoff-failed` ile `ok: false`, ayrıca elle kabuk güncellemesi gerektiğinde `handoff.command` döndürür. Kullanılamıyor durumu, OpenClaw'ın systemd için `OPENCLAW_SYSTEMD_UNIT` gibi güvenli bir gözetmen sınırına veya kalıcı hizmet kimliğine sahip olmadığı anlamına gelir. Başlatılmış bir devir sırasında yeniden başlatma belirteci kısa süreliğine `stats.reason: "restart-health-pending"` bildirebilir; sürdürme işlemi, CLI yeniden başlatılmış Gateway'i doğrulayıp son `ok` belirtecini yazana kadar ertelenir.
    - `update.status`, en son güncelleme yeniden başlatma belirtecini yeniler ve mümkün olduğunda yeniden başlatma sonrası çalışan sürüm dâhil olmak üzere döndürür.
    - `wizard.start`, `wizard.next`, `wizard.status` ve `wizard.cancel`, ilk katılım sihirbazını WS RPC üzerinden sunar.

  </Accordion>

  <Accordion title="Ajan ve çalışma alanı yardımcıları">
    - `agents.list`, etkin model ve çalışma zamanı meta verileri dâhil olmak üzere yapılandırılmış ajan girdilerini döndürür.
    - `agents.create`, `agents.update` ve `agents.delete`, ajan kayıtlarını ve çalışma alanı bağlantılarını yönetir.
    - `agents.files.list`, `agents.files.get` ve `agents.files.set`, bir ajan için sunulan önyükleme çalışma alanı dosyalarını yönetir.
    - `audit.activity.list`, sürümlendirilmiş ve yalnızca meta veri içeren etkinlik defterini döndürür; `audit.list`, uyumluluk açısından güvenli çalıştırma/araç RPC'si olarak kalır.
    - `agents.workspace.list` ve `agents.workspace.get` (`operator.read`), [Operatör kapsamları](/tr/gateway/operator-scopes) bölümünde açıklanan güvenilir operatör etki alanındaki istemcilerin bir ajanın çalışma alanı dizininde salt okunur ve sayfalandırılmış biçimde gezinmesini sağlar. İstekler yalnızca çalışma alanına göreli yolları kabul eder; okumalar gerçek yolu çözümlenmiş çalışma alanı köküyle sınırlandırılır (sembolik bağlantı ve sabit bağlantı üzerinden kaçışlar reddedilir), boyut sınırına tabidir ve UTF-8 metin ile yaygın görüntü türleriyle (base64) kısıtlıdır. Yanıtlar ana makinedeki çalışma alanı yolunu açığa çıkarmaz. Bu ad alanında yazma işlemi yoktur.
    - `tasks.list`, `tasks.get` ve `tasks.cancel`, gateway görev defterini SDK ve operatör istemcilerine sunar. Aşağıdaki [Görev defteri RPC'leri](#task-ledger-rpcs) bölümüne bakın.
    - `artifacts.list`, `artifacts.get` ve `artifacts.download`, açıkça belirtilen bir `sessionKey`, `runId` veya `taskId` kapsamı için transkriptlerden türetilmiş yapıt özetlerini ve indirmeleri sunar. Çalıştırma ve görev sorguları, sahip olan oturumu sunucu tarafında çözümler ve yalnızca kaynağı eşleşen transkript medyasını döndürür; güvenli olmayan veya yerel URL kaynakları, sunucu tarafında getirilmek yerine desteklenmeyen indirmeler döndürür.
    - `environments.list` ve `environments.status`, gateway'e özgü ve node ortamı keşfini korur. Yapılandırılmış bulut çalışanları ve önceki profillerin bıraktığı kalıcı kayıtlar; `providerId`, isteğe bağlı `leaseId`, `state`, `ageMs`, isteğe bağlı `idleMs` ve `attachedSessionIds` ile `worker` meta verilerini ekler. Çalışan yaşam döngüsü durumları şunlardır: `requested`, `provisioning`, `bootstrapping`, `ready`, `attached`, `idle`, `draining`, `destroying`, `destroyed`, `failed` ve `orphaned`.
    - `environments.create` (`{ profileId, idempotencyKey }`), yapılandırılmış bir plugin sağlayıcı profilinden çalışan hazırlar; aynı anahtarla yapılan yeniden denemeler kalıcı işlemi yeniden kullanır. `environments.destroy` (`{ environmentId }`), kalıcı bir çalışan ortamının eş etkili biçimde kaldırılmasını ister. Her ikisi de `operator.admin` gerektirir, kontrol düzlemi yazma işlemleridir ve durum yanıtlarında kullanılan ortam özeti biçiminin aynısını döndürür.
    - `agent.identity.get`, bir ajan veya oturum için geçerli asistan kimliğini döndürür.
    - `agent.wait`, bir çalıştırmanın tamamlanmasını bekler ve mevcut olduğunda son durum anlık görüntüsünü döndürür.

  </Accordion>

  <Accordion title="Oturum denetimi">
    - `sessions.list`, bir ajan çalışma zamanı arka ucu yapılandırıldığında satır başına `agentRuntime` meta verileri dâhil olmak üzere geçerli oturum dizinini döndürür. Bulut çalışanı yerleşimi etkinleştirildiğinde veya kalıcı kurtarma durumu mevcut olduğunda, oturum satırları ayrıca kapalı bir `placement` durumu (`local`, `requested`, `provisioning`, `syncing`, `starting`, `active`, `draining`, `reconciling`, `reclaimed` veya `failed`) ile duruma özgü ortam, sahip dönemi, çalışma alanı, paket, ACK imleci veya kurtarma alanlarını içerir.
    - `sessions.subscribe` ve `sessions.unsubscribe`, geçerli WS istemcisi için oturum değişikliği olay aboneliklerini açıp kapatır.
    - `sessions.messages.subscribe` ve `sessions.messages.unsubscribe`, tek bir oturum için transkript/mesaj olay aboneliklerini açıp kapatır. Kalıcı hedef kitlesi tam olarak bu oturumu içeren ve inceleyici bağlaması abone olan istemciyi yetkilendiren onaylara ait temizlenmiş `session.approval` yaşam döngüsü olaylarını da almak için `includeApprovals: true` iletin. Bu durumda abone olma yanıtı, sınırlandırılmış bekleyen `approvalReplay` değerini içerir; `truncated` false olduğunda bu değer belirleyicidir. Katılım tercihi her abone olma çağrısına özeldir ve kalıcı değildir: aynı oturuma `includeApprovals: true` olmadan yeniden abone olmak, mevcut onay aboneliğini kaldırır. Normal oturum okuma yetkisine ek olarak bu katılım tercihi, `operator.admin` veya eşleştirilmiş bir cihazda `operator.approvals` gerektirir.
    - `sessions.preview`, belirli oturum anahtarları için sınırlandırılmış transkript önizlemelerini döndürür.
    - `sessions.describe`, tam olarak eşleşen bir oturum anahtarı için tek bir gateway oturum satırını döndürür.
    - `sessions.resolve`, bir oturum hedefini çözümler veya standartlaştırır.
    - `sessions.create`, yeni bir oturum girdisi oluşturur. İsteğe bağlı `model` ve `thinkingLevel` değerleri, başlangıç modeli ve akıl yürütme geçersiz kılmalarını atomik olarak kalıcılaştırır. `worktree: true`, yönetilen bir çalışma ağacı hazırlar; isteğe bağlı `worktreeBaseRef`/`worktreeName`, temel referansı ve dal adını seçer, `execNode` (`operator.admin`) ise oturum yürütmesini bir node ana makinesine bağlar. Oluşturulan çalışma ağacı sonuçta yinelenir ve oturum satırında (`worktree: { id, branch, repoRoot }`) kalıcılaştırılır. Girdi oluşturulduğu hâlde iç içe başlangıç `chat.send` isteği reddedildiğinde, başarılı sonuç `runStarted: false` ve `runError` değerlerini içerir; istemciler istemi koruyup döndürülen oturum anahtarıyla yeniden deneyebilir.
    - `sessions.dispatch` (`operator.admin`), oturuma ait yönetilen çalışma ağacına sahip mevcut bir yerel OpenClaw oturumunu yapılandırılmış bir bulut çalışanı profiline taşır. `{ key, profileId, agentId? }` iletin. Hiçbir çalışan profili yapılandırılmadığında yöntem mevcut değildir; etkin çalışmaların tamamlanmasını beklemeden önce yerel tur kabulünü kapatır ve yalnızca yerleşim `active` çalışan sahipliğine ulaştıktan sonra döner. Gönderim tek yönlüdür; çalışandan yerele geri çekme bu RPC'nin parçası değildir.
    - `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename` ve `sessions.groups.delete`, gateway'in sahip olduğu özel oturum grubu kataloğunu (adlar + görüntüleme sırası) yönetir. Üyelik, her oturumun `category` alanında kalır; yeniden adlandırma ve silme işlemleri üye oturumlarını sunucu tarafında günceller.
    - `sessions.send`, mevcut bir oturuma mesaj gönderir.
    - `sessions.steer`, etkin bir oturum için kesme ve yönlendirme çeşididir.
    - `sessions.abort`, bir oturumdaki etkin çalışmayı iptal eder. `key` ile isteğe bağlı `runId` değerini veya gateway'in bir oturuma çözümleyebildiği etkin çalıştırmalar için yalnızca `runId` değerini iletin.
    - `sessions.patch`, oturum meta verilerini/geçersiz kılmalarını günceller ve çözümlenen standart model ile etkin `agentRuntime` değerini bildirir.
    - `sessions.reset`, `sessions.delete` ve `sessions.compact`, oturum bakımını gerçekleştirir.
    - `sessions.get`, depolanan oturum satırının tamamını döndürür.
    - Sohbet yürütme işlemi hâlâ `chat.history`, `chat.send`, `chat.abort` ve `chat.inject` kullanır. `chat.history`, UI istemcileri için görüntüleme açısından normalleştirilir: satır içi yönerge etiketleri görünür metinden kaldırılır; düz metin araç çağrısı XML yükleri (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları) ile sızdırılmış ASCII/tam genişlikli model denetim belirteçleri kaldırılır; yalnızca sessiz belirteçlerden oluşan asistan satırları (tam olarak `NO_REPLY` / `no_reply`) atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir.
    - `chat.message.get`, tek bir görünür transkript girdisi için eklemeli, sınırlandırılmış tam mesaj okuyucusudur. `sessionKey`, oturum seçimi ajan kapsamlı olduğunda isteğe bağlı `agentId` ve daha önce `chat.history` aracılığıyla sunulmuş bir transkript `messageId` değeri iletin; depolanan girdi hâlâ kullanılabilir ve aşırı büyük değilse gateway, hafif geçmiş kesme sınırı olmadan aynı görüntüleme açısından normalleştirilmiş izdüşümü döndürür.
    - `chat.toolTitles`, Control UI'da işlenen araç çağrıları için kısa amaç başlıkları döndürür (toplu, sınırlandırılmış girdilerle en fazla 24 öğe). Özellik `gateway.controlUi.toolTitles` aracılığıyla isteğe bağlıdır (varsayılan olarak kapalıdır); devre dışı gateway'ler, istemcilerin sormayı bırakması için model çağrısı yapmadan `{ titles: {}, disabled: true }` yanıtını verir. Etkinleştirildiğinde başlıklar standart yardımcı model yönlendirmesini kullanır: açıkça yapılandırılmış bir `utilityModel` (tüm yardımcı görevlerde olduğu gibi, sınırlandırılmış görev içeriğini seçilen sağlayıcıya gönderebilen bir operatör kararı) veya dolaylı olarak yeni bir dışa veri aktarım hedefi oluşmaması için oturum sağlayıcısının bildirdiği küçük model varsayılanı; boş bir `utilityModel`, bunları tamamen devre dışı bırakır. Başlıklar hiçbir zaman birincil modele geri dönmez. Sonuçlar, araç adı + girdi anahtarıyla ajan başına durum veritabanında önbelleğe alınır; böylece yinelenen görüntülemeler aynı çağrılar için yeniden ücretlendirilmez.
    - `chat.send`, otomatik kesme noktasından önce başlatılan model çağrılarında hızlı modu kullanmak, ardından sonraki yeniden deneme, geri dönüş, araç sonucu veya devam çağrılarını hızlı mod olmadan başlatmak için tek turluk `fastMode: "auto"` değerini kabul eder. Kesme noktası varsayılan olarak 60 saniyedir (`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`) ve `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` ile model başına yapılandırılabilir. Bir `chat.send` çağıranı, bu isteğin kesme noktasını geçersiz kılmak için tek turluk `fastAutoOnSeconds` değeri iletebilir. Yalnızca bu istek için depolanan kuyruk modunu geçersiz kılmak üzere `queueMode` (`steer`, `followup`, `collect` veya `interrupt`) iletin; açık Control UI yönlendirme eylemleri `queueMode: "steer"` kullanır.

  </Accordion>

  <Accordion title="Cihaz eşleştirme ve cihaz belirteçleri">
    - `device.pair.list`, bekleyen ve onaylanmış eşleştirilmiş cihazları döndürür.
    - `device.pair.setupCode`, bir mobil kurulum kodu ve varsayılan olarak PNG QR veri URL'si oluşturur. `operator.admin` gerektirir ve kasıtlı olarak duyurulan keşfin dışında bırakılır. Sonuç; `setupCode`, isteğe bağlı `qrDataUrl`, `gatewayUrl`, gizli olmayan `auth` etiketi ve `urlSource` değerlerini içerir.
    - `device.pair.approve`, `device.pair.reject` ve `device.pair.remove`, cihaz eşleştirme kayıtlarını yönetir.
    - `device.pair.rename`, istemcinin bildirdiği görüntüleme adına tercih edilen ve cihaz onarımından ya da yeniden onaydan sonra da korunan bir operatör etiketi (`{ deviceId, label }`) atar.
    - `device.token.rotate`, eşleştirilmiş bir cihaz belirtecini onaylanmış rolü ve çağıran kapsamı sınırları içinde yeniler.
    - `device.token.revoke`, eşleştirilmiş bir cihaz belirtecini onaylanmış rolü ve çağıran kapsamı sınırları içinde iptal eder.

    Kurulum kodu, kısa ömürlü bir önyükleme kimlik bilgisi içerir. İstemciler bunu
    eşleştirme akışının ötesinde günlüğe kaydetmemeli veya kalıcılaştırmamalıdır.

  </Accordion>

  <Accordion title="Node eşleştirme, çağırma ve bekleyen işler">
    - `node.pair.list`, `node.pair.approve`, `node.pair.reject` ve `node.pair.remove` Node yetenek onaylarını kapsar. `node.pair.request` ve `node.pair.verify`, bağımsız Node eşleştirme deposuyla birlikte 2026.7 sürümünde kaldırıldı; bekleyen istekler, Node bağlantıları sırasında Gateway tarafından oluşturulur.
    - `node.list` ve `node.describe`, bilinen/bağlı Node durumunu döndürür.
    - `node.rename`, eşleştirilmiş bir Node etiketini günceller.
    - `node.invoke`, bir komutu bağlı bir Node'a iletir.
    - `node.invoke.result`, bir çağırma isteğinin sonucunu döndürür.
    - `mcp.tools.call.v1`, yapılandırılmış, Node'a yerel bir MCP aracını çağırmaya yönelik başsız Node ana bilgisayarı komutudur. `node.invoke` üzerinden taşınır, Node'un komutu bildirmesini gerektirir ve eşleştirme onayı ile `gateway.nodes.denyCommands` kapsamına tabi olmaya devam eder.
    - `node.event`, Node kaynaklı olayları gateway'e geri taşır.
    - `node.pluginTools.update`, bağlı Node'un aracı tarafından görülebilen plugin/MCP aracı tanımlayıcılarını değiştirmek için tek yayımlama yoludur; `connect` parametreleri bunları taşımaz.
    - `node.pending.pull` ve `node.pending.ack`, bağlı Node kuyruk API'leridir.
    - `node.pending.enqueue` ve `node.pending.drain`, çevrimdışı/bağlantısı kesilmiş Node'lar için kalıcı bekleyen işleri yönetir.

  </Accordion>

  <Accordion title="Onay aileleri">
    - `approval.get` ve `approval.resolve`, türden bağımsız kalıcı onay yöntemleridir (kapsam `operator.approvals`). `approval.get`, kararlı bir `urlPath` ile temizlenmiş bekleyen veya saklanan nihai projeksiyonu döndürür; `approval.resolve`, standart onay kimliğini, açık bir `kind` değerini ve bir kararı kabul eder, ilk yanıtın kazandığı çözümlemeyi uygular ve her zaman kaydedilen standart sonucu döndürür.
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ve `exec.approval.resolve`, tek seferlik exec onay istekleriyle birlikte bekleyen onay arama/yeniden oynatma işlemlerini kapsar. Bunlar, aynı kalıcı onay kayıt defteri üzerindeki protokol sınırı bağdaştırıcılarıdır.
    - `exec.approval.waitDecision`, bekleyen bir exec onayını bekler ve nihai kararı (veya zaman aşımında `null`) döndürür.
    - `exec.approvals.get` ve `exec.approvals.set`, gateway exec onay ilkesi anlık görüntülerini yönetir.
    - `exec.approvals.node.get` ve `exec.approvals.node.set`, Node aktarma komutları üzerinden Node'a yerel exec onay ilkesini yönetir.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` ve `plugin.approval.resolve`, plugin tarafından tanımlanan onay akışlarını kapsar.

  </Accordion>

  <Accordion title="Otomasyon, Skills ve araçlar">
    - Otomasyon: `wake`, anında veya sonraki Heartbeat'te bir uyandırma metni eklenmesini zamanlar; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zamanlanmış işleri yönetir.
    - `cron.run`, manuel çalıştırmalar için kuyruğa ekleme tarzında bir RPC olarak kalır. Tamamlanma semantiğine ihtiyaç duyan istemciler, döndürülen `runId` değerini okumalı ve `cron.runs` değerini yoklamalıdır.
    - `cron.runs`, istemcilerin aynı işe ait diğer geçmiş girdileriyle yarışmadan kuyruktaki tek bir manuel çalıştırmayı takip edebilmesi için isteğe bağlı, boş olmayan bir `runId` filtresi kabul eder.
    - Skills ve araçlar: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`. Aşağıdaki [Operatör yardımcı yöntemleri](#operator-helper-methods) bölümüne bakın.

  </Accordion>
</AccordionGroup>

### Yaygın olay aileleri

- `chat`: `chat.inject` gibi kullanıcı arayüzü sohbet güncellemeleri ve yalnızca transkripte yönelik diğer sohbet
  olayları. Protokol v4'te delta yükleri `deltaText` taşır; `message`
  kümülatif asistan anlık görüntüsü olarak kalır. Önek olmayan değiştirmeler
  `replace=true` değerini ayarlar ve değiştirme metni olarak `deltaText` kullanır.
- `session.message`, `session.operation`, `session.tool`: abone olunan bir oturum için transkript, devam eden
  oturum işlemi ve olay akışı güncellemeleri.
- `session.approval`: açıkça katılım sağlayan, tam oturum abonesi için temizlenmiş bekleyen ve nihai onay gerçeği.
  Alt onaylar kalıcı üst öğe hedef kitlesini kullanır; olaylar hiçbir zaman transkriptleri değiştirmez veya aracıları uyandırmaz.
- `sessions.changed`: oturum dizini veya meta verileri değişti.
- `presence`: sistem mevcudiyeti anlık görüntüsü güncellemeleri.
- `tick`: periyodik bağlantıyı sürdürme/canlılık olayı.
- `health`: gateway sağlık anlık görüntüsü güncellemesi.
- `heartbeat`: Heartbeat olay akışı güncellemesi.
- `cron`: Cron çalıştırması/işi değişiklik olayı.
- `shutdown`: gateway kapanma bildirimi.
- `node.pair.requested` / `node.pair.resolved`: Node eşleştirme yaşam döngüsü.
- `node.invoke.request`: Node çağırma isteği yayını.
- `device.pair.requested` / `device.pair.resolved`: eşleştirilmiş cihaz yaşam döngüsü.
- `voicewake.changed`: uyandırma sözcüğü tetikleyici yapılandırması değişti.
- `exec.approval.requested` / `exec.approval.resolved`: exec onayı
  yaşam döngüsü.
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin onayı
  yaşam döngüsü.

### Node yardımcı yöntemleri

Node'lar, otomatik izin kontrolleri için geçerli Skill yürütülebilirleri listesini
almak üzere `skills.bins` çağrısını yapabilir.

## Denetim defteri RPC'si

`audit.activity.list`, operatör istemcilerine aracı çalıştırması, araç eylemi ve katılım gerektiren mesaj yaşam döngüsü meta verilerinin
en yeniden eskiye doğru kararlı bir görünümünü sunar. `operator.read` gerektirir.
Sorgular 30 günden eski kayıtları hariç tutar ve paylaşılan SQLite defteri
100,000 kayıtla sınırlıdır. Süresi dolan satırlar Gateway başlatılırken, saatlik bakım sırasında
ve sonraki yazmalarda silinir. Veri modeli ve gizlilik semantiği için
[Denetim geçmişi](/gateway/audit) bölümüne bakın.

- Parametreler: isteğe bağlı tam `agentId`, `sessionKey` veya `runId`; isteğe bağlı `kind`
  (`"agent_run"`, `"tool_action"` veya `"message"`); isteğe bağlı `status`
  (`"started"`, `"succeeded"`, `"failed"`, `"cancelled"`, `"timed_out"`,
  `"blocked"` veya `"unknown"`); isteğe bağlı mesaj `direction` (`"inbound"` veya
  `"outbound"`) ve tam `channel`; isteğe bağlı kapsayıcı `after` / `before`
  Unix-milisaniye sınırları; `1` ile `500` arasında isteğe bağlı `limit`; ve önceki sayfadan isteğe bağlı
  dize `cursor`.
- Sonuç: `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.

Adlandırılmış V1 sonuç birleşimi; aracı çalıştırması, araç eylemi, gelen mesaj
ve giden mesaj için ayrı şemalara sahiptir. `eventType` ayırıcısı sırasıyla
`agent_run`, `tool_action`, `inbound_message` veya `outbound_message` değeridir; `kind` ve
mesaj `direction` filtreleme ve görüntüleme için kullanılabilir durumda kalır. Her olayın
tamsayı bir `schemaVersion: 1` değeri vardır. Mesaj kimliği başvuruları tam olarak
`hmac-sha256:v1:<32 hex key id>:<64 hex digest>` biçimini kullanır; kanal-gönderici aktör
kimliği de aynı biçimi kullanır.

Tüm değişkenler `eventType`, `schemaVersion`, `eventId`, `sequence`,
`sourceSequence`, `occurredAt`, `kind`, `action`, `status`, `actor` ve
`redaction` gerektirir. Değişken alanları şunlardır:

| `eventType`        | Zorunlu alanlar                                                   | İsteğe bağlı alanlar                                                                                                                 |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent_run`        | `agentId`, `runId`; `kind: "agent_run"`                           | `sessionKey`, `sessionId`, `errorCode`                                                                                          |
| `tool_action`      | `agentId`, `runId`; `kind: "tool_action"`                         | `sessionKey`, `sessionId`, `toolCallId`, `toolName`, `errorCode`                                                                |
| `inbound_message`  | `direction: "inbound"`, `channel`, `conversationKind`, `outcome`  | `agentId`, `runId`, `durationMs`, `resultCount`, kimlik başvuruları, `reasonCode`, `errorCode`                                 |
| `outbound_message` | `direction: "outbound"`, `channel`, `conversationKind`, `outcome` | `agentId`, `runId`, `durationMs`, `resultCount`, kimlik başvuruları, `reasonCode`, `deliveryKind`, `failureStage`, `errorCode` |

Kapalı mesaj enum'ları şunlardır:

- `conversationKind`: `direct`, `group`, `channel` veya `unknown`.
- Gelen `outcome`: `completed`, `skipped` veya `failed`; isteğe bağlı
  `reasonCode`: `duplicate`, `reply_operation_active`,
  `reply_operation_aborted`, `fast_abort`, `plugin_bound_handled`,
  `plugin_bound_unavailable`, `plugin_bound_declined`, `plugin_bound_error`,
  `before_dispatch_handled`, `acp_dispatch_completed`, `acp_dispatch_failed`,
  `acp_dispatch_empty` veya `acp_dispatch_aborted`.
- Giden `outcome`: `sent`, `suppressed`, `failed` veya `unknown`; isteğe bağlı
  `reasonCode`: `cancelled_by_message_sending_hook`,
  `cancelled_by_reply_payload_sending_hook`,
  `empty_after_message_sending_hook`, `empty_after_reply_payload_sending_hook`
  veya `no_visible_payload`. Platform kimliği döndürmeyen bir bağdaştırıcı,
  harici yan etkinin gerçekleşmediği kanıtlanamayacağından `unknown` değeridir.
- `deliveryKind`: `text`, `media` veya `other`; `failureStage`:
  `platform_send`, `queue` veya `unknown`.

Nihai alanlar bağımsız olarak isteğe bağlı değil, birbiriyle ilişkilidir:

| Değişken          | Nihai eşleme                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Aracı çalıştırması        | `started` değerinde `errorCode` bulunmaz; başarı dışındaki her tamamlanmış durum, eşleşen `run_*` kodunu gerektirir.                                                                 |
| Araç eylemi      | `started` ve başarılı durumunda `errorCode` bulunmaz; diğer her tamamlanmış durum, eşleşen `tool_*` kodunu gerektirir.                                                       |
| Gelen mesaj  | başarılı = `completed`; engellendi = `skipped`; başarısız = `failed` artı `message_processing_failed`. `reasonCode` mevcut olduğunda bu nihai aileye ait olmalıdır. |
| Giden mesaj | başarılı = `sent`; engellendi = `suppressed` artı `reasonCode`; başarısız = `failed` artı `errorCode` ve `failureStage`; bilinmiyor = `unknown` artı `failureStage`.      |

Her etkinlik olayı; kararlı bir olay kimliği, monoton defter sırası,
kaynak olay sırası, zaman damgası, aktör, eylem, durum, tam sayı
`schemaVersion: 1` ve `redaction: "metadata_only"` içerir. Çalıştırma ve araç kayıtları,
ajan ve çalıştırma kaynağını gerektirir ve oturum kaynağını içerebilir. Mesaj
kayıtları ajan ve çalıştırma kimliklerini içerebilir ancak kasıtlı olarak hiçbir zaman
`sessionKey` veya `sessionId` içermez; bu nedenle `sessionKey` sorgu filtresi
yalnızca çalıştırma ve araç satırlarına uygulanır. Araç olayları, araç çağrısı kimliğini ve araç adını içerebilir.

Mesaj kayıtları `message.inbound.processed` veya
`message.outbound.finished` kullanır ve yön, kanal, konuşma türü,
normalleştirilmiş sonuç ve isteğe bağlı teslimat türü, hata aşaması, süre,
sonuç sayısı, neden kodu ile kuruluma özgü anahtarlanmış
hesap/konuşma/mesaj/hedef takma adlarını ekler. Bu takma adlar
ilişkilendirmeye yardımcı olur ancak anonimleştirme sağlamaz: durum veritabanı bunların anahtarını
içerirken RPC ve CLI dışa aktarımları içermez. Defter; istemleri, mesaj
gövdelerini, araç bağımsız değişkenlerini, araç sonuçlarını, komut çıktısını veya ham hata metnini saklamaz.
Çalıştırma/araç `sessionKey` değerleri ham ilişkilendirme meta verileri olarak kalır ve
platform hesabı veya eş kimliklerini gömebilir; mesaj kayıtları oturum anahtarlarını içermez.

Gelen satırlarda `durationMs`, çekirdek yönlendirmenin terminaline kadar geçen süreyi ölçer ve
`resultCount`, sonlandırılmış kuyruğa alınmış araç, blok ve yanıt yüklerini sayar.
Giden satırlarda `durationMs`, teslimat sahipliğinden onaya,
teslim edilemeyenler kuyruğuna veya uzlaştırmaya kadar olan süreyi (kuyrukta bekleme süresi dâhil) kapsar ve `resultCount`,
tanımlanmış fiziksel platform gönderimlerini sayar. `deliveryKind`, mevcut olduğunda,
kancalar ve işleme sonrasındaki etkin yükü açıklar; engellenmiş veya
çökme nedeniyle belirsiz satırlar bunu içermez.

Mevcut mesaj kapsamı, çekirdek
yönlendirmeye ulaşan kabul edilmiş gelen mesajları ve çekirdek yinelenen/terminal sonuçlarını içerir. Giden kapsam,
paylaşılan kalıcı teslimata ulaşan her özgün mantıksal yanıt yükü için
bir terminal satırı yazar; parçalama ve bağdaştırıcı dallanması `resultCount` içinde toplanır. Kuyruğa alınmış,
yeniden denenebilir veya belirsiz gönderimler yalnızca onay, teslim edilemeyenler
kuyruğu veya uzlaştırma sonrasında kaydedilir. Bu paylaşılan sınırları atlayan
Plugin'e özgü ve doğrudan gönderim yolları henüz kapsanmamaktadır. Sınırlı çalışan kuyruğu azami çaba esaslıdır
ve hata ya da doygunluk durumunda kayıtları düşürebilir; dolayısıyla bu yüzey
kayıpsız bir uyumluluk arşivi değildir.

Kayıt varsayılan olarak açıktır ve
[`audit.enabled`](/tr/gateway/configuration-reference#audit) tarafından denetlenir. Mesaj kaydı
ayrıca `audit.messages` tarafından denetlenir ve varsayılan değeri `"off"`'tür. Kayıt
devre dışı bırakıldığında `audit.activity.list`, daha önce yazılmış kayıtları
süreleri dolana kadar sunmaya devam eder.

Yayımlanan `audit.list` istek, sonuç ve `AuditEvent` şemaları
değişmeden kalır ve yalnızca ajan çalıştırması ile araç eylemi kayıtlarını döndürür. Yeni operatör
istemcileri, Gateway bunu duyurduğunda `audit.activity.list` çağrısını kullanmalıdır. Eski
Gateway'ler, salt okuma kapsamlı bir isteğe `unknown method: audit.activity.list` veya yayımlanan sürümlerde
yetkilendirme yöntem aramasından önce geldiği için `missing scope:
operator.admin` bildirebilir. İkincisini yalnızca yöntem
duyurulmamışsa yöntemin bulunmaması olarak değerlendirin. Ardından istemci, yalnızca filtreleri mesaj türü, yön veya kanal
desteği gerektirmiyorsa `audit.list` çağrısını yeniden deneyebilir.

Metin sorguları ve sınırlı JSON dışa aktarımları için [`openclaw audit`](/tr/cli/audit) kullanın.

## Görev defteri RPC'leri

Operatör istemcileri, görev defteri RPC'leri (`packages/gateway-protocol/src/schema/tasks.ts`) aracılığıyla
Gateway arka plan görev kayıtlarını inceler ve iptal eder. Bunlar,
ham çalışma zamanı durumunu değil, temizlenmiş görev özetlerini döndürür.

- `tasks.list`, `operator.read` gerektirir.
  - Parametreler: isteğe bağlı `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` veya `"timed_out"`) ya da bu durumların bir dizisi,
    isteğe bağlı `agentId`, isteğe bağlı `sessionKey`, `1` ile
    `500` arasında isteğe bağlı `limit` ve isteğe bağlı dize `cursor`.
  - Sonuç: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get`, `operator.read` gerektirir.
  - Parametreler: `{ "taskId": string }`.
  - Sonuç: `{ "task": TaskSummary }`.
  - Eksik görev kimlikleri, Gateway'in bulunamadı hata biçimini döndürür.
- `tasks.cancel`, `operator.write` gerektirir.
  - Parametreler: `{ "taskId": string, "reason"?: string }`.
  - Sonuç: `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found`, defterde eşleşen bir görev bulunup bulunmadığını bildirir. `cancelled`,
    çalışma zamanının iptali kabul edip etmediğini veya kaydedip kaydetmediğini bildirir.

`TaskSummary`; `id`, `status` ve isteğe bağlı meta verileri içerir: `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, zaman damgaları, ilerleme,
terminal özeti ve temizlenmiş hata metni. `agentId`, görevi
yürüten ajanı tanımlar; `sessionKey` ve `ownerKey`, istekte bulunanın ve denetimin
bağlamını korur.

## Operatör yardımcı yöntemleri

- `commands.list` (`operator.read`), bir ajanın çalışma zamanı komut envanterini
  getirir.
  - `agentId` isteğe bağlıdır; varsayılan ajan çalışma alanını okumak için bunu belirtmeyin.
  - `scope`, birincil `name` hedefinin hangi yüzey olacağını denetler: `text`,
    başında `/` bulunmayan birincil metin komutu belirtecini döndürür; `native` ve
    varsayılan `both` yolu, mevcut olduğunda sağlayıcıya duyarlı yerel adları döndürür.
  - `textAliases`, `/model` ve `/m` gibi tam eğik çizgi diğer adlarını taşır.
  - `nativeName`, mevcut olduğunda sağlayıcıya duyarlı yerel komut adını
    taşır.
  - `provider` isteğe bağlıdır ve yalnızca yerel adlandırmayı ve yerel Plugin
    komutlarının kullanılabilirliğini etkiler.
  - `includeArgs=false`, serileştirilmiş bağımsız değişken meta verilerini yanıttan çıkarır.
- `tools.catalog` (`operator.read`), bir ajanın çalışma zamanı araç kataloğunu
  getirir. Yanıt, gruplandırılmış araçları ve kaynak meta verilerini içerir:
  - `source`: `core` veya `plugin`
  - `pluginId`: `source="plugin"` olduğunda Plugin sahibi
  - `optional`: bir Plugin aracının isteğe bağlı olup olmadığı
- `tools.effective` (`operator.read`), bir oturumun çalışma zamanında etkin araç
  envanterini getirir.
  - `sessionKey` gereklidir.
  - Gateway, çağıranın sağladığı kimlik doğrulama veya teslimat bağlamını kabul etmek
    yerine güvenilir çalışma zamanı bağlamını sunucu tarafındaki oturumdan türetir.
  - Yanıt; çekirdek, Plugin, kanal ve önceden keşfedilmiş MCP
    sunucusu araçları dâhil olmak üzere etkin envanterin oturum kapsamlı, sunucu tarafından türetilmiş bir izdüşümüdür.
  - `tools.effective`, MCP için salt okunurdur: sıcak bir oturumun MCP
    kataloğunu nihai araç politikası üzerinden yansıtabilir ancak MCP çalışma zamanları
    oluşturmaz, taşımalara bağlanmaz veya `tools/list` göndermez. Eşleşen sıcak bir katalog
    yoksa yanıt `mcp-not-yet-connected`,
    `mcp-not-yet-listed` veya `mcp-stale-catalog` gibi bir bildirim içerebilir.
  - Etkin araç girdileri `source="core"`, `source="plugin"`,
    `source="channel"` veya `source="mcp"` kullanır.
- `tools.invoke` (`operator.write`), kullanılabilir bir aracı
  `/tools/invoke` ile aynı Gateway politika yolu üzerinden çağırır.
  - `name` gereklidir. `args`, `sessionKey`, `agentId`, `confirm` ve
    `idempotencyKey` isteğe bağlıdır.
  - Hem `sessionKey` hem de `agentId` mevcutsa çözümlenen oturum ajanı
    `agentId` ile eşleşmelidir.
  - `cron`, `gateway` ve `nodes` gibi yalnızca sahibine açık çekirdek sarmalayıcılar,
    `tools.invoke` kendisi `operator.write` olsa da
    sahip/yönetici kimliği (`operator.admin`) gerektirir.
  - Yanıt; `ok`, `toolName`, isteğe bağlı
    `output` ve tür belirtilmiş `error` alanlarını içeren, SDK'ya yönelik bir zarftır. Onay veya politika retleri,
    Gateway araç politikası işlem hattını atlamak yerine yük içinde
    `ok:false` döndürür.
- `skills.status` (`operator.read`), bir ajanın görünür skill envanterini
  getirir.
  - `agentId` isteğe bağlıdır; varsayılan ajan çalışma alanını okumak için bunu belirtmeyin.
  - Yanıt; ham gizli değerleri açığa çıkarmadan uygunluğu, eksik gereksinimleri, yapılandırma denetimlerini
    ve temizlenmiş kurulum seçeneklerini içerir.
- `skills.search` ve `skills.detail` (`operator.read`), ClawHub
  keşif meta verilerini döndürür.
- `skills.upload.begin`, `skills.upload.chunk` ve `skills.upload.commit`
  (`operator.admin`), özel bir skill arşivini kurmadan önce hazırlar. Bu,
  güvenilir istemciler için ayrı bir yönetici yükleme yoludur; normal ClawHub
  skill kurulum akışı değildir ve `skills.install.allowUploadedArchives` etkinleştirilmediği sürece
  varsayılan olarak devre dışıdır.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`,
    söz konusu kısa ada ve zorlama değerine bağlı bir yükleme oluşturur.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })`, baytları
    tam çözümlenmiş konuma ekler.
  - `skills.upload.commit({ uploadId, sha256? })`, son boyutu ve
    SHA-256 değerini doğrular. Tamamlama yalnızca yüklemeyi sonlandırır; skill'i kurmaz.
  - Yüklenen skill arşivleri, `SKILL.md` kökü içeren zip arşivleridir. Arşivin
    iç dizin adı hiçbir zaman kurulum hedefini seçmez.
- `skills.install` (`operator.admin`) üç moda sahiptir:
  - ClawHub modu: `{ source: "clawhub", slug, version?, force? }`, bir
    skill klasörünü varsayılan ajan çalışma alanının `skills/` dizinine kurar.
  - Yükleme modu: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`,
    tamamlanmış bir yüklemeyi varsayılan ajan çalışma alanının
    `skills/<slug>` dizinine kurar. Kısa ad ve zorlama değeri,
    özgün `skills.upload.begin` isteğiyle eşleşmelidir.
    `skills.install.allowUploadedArchives` etkinleştirilmediği sürece reddedilir; bu ayar
    ClawHub kurulumlarını etkilemez.
  - Gateway yükleyici modu: `{ name, installId, timeoutMs? }`, Gateway
    ana makinesinde bildirilmiş bir `metadata.openclaw.install` eylemi çalıştırır. Eski istemciler
    hâlâ `dangerouslyForceUnsafeInstall` gönderebilir; bu alan kullanım dışıdır,
    yalnızca protokol uyumluluğu için kabul edilir ve yok sayılır. Operatörün sahip olduğu
    kurulum kararları için `security.installPolicy` kullanın.
- `skills.update` (`operator.admin`) iki moda sahiptir:
  - ClawHub modu, varsayılan ajan çalışma alanında izlenen tek bir kısa adı veya izlenen tüm ClawHub kurulumlarını günceller.
  - Yapılandırma modu; `enabled`,
    `apiKey` ve `env` gibi `skills.entries.<skillKey>` değerlerine yama uygular.

### `models.list` görünümleri

`models.list`, isteğe bağlı bir `view` parametresini
(`src/agents/model-catalog-visibility.ts`) kabul eder:

- Atlanmış veya `"default"`: `agents.defaults.models` yapılandırılmışsa
  yanıt, `provider/*` girdileri için dinamik olarak keşfedilen modeller de
  dahil olmak üzere izin verilen katalogdur. Aksi takdirde yanıt, Gateway
  kataloğunun tamamıdır.
- `"configured"`: seçici boyutunda davranış. `agents.defaults.models`
  yapılandırılmışsa, `provider/*` girdileri için sağlayıcı kapsamlı keşif
  de dahil olmak üzere yine önceliklidir. İzin listesi olmadığında yanıt, açık
  `models.providers.<provider>.models` girdilerini kullanır ve yalnızca yapılandırılmış model
  satırı yoksa tam kataloğa geri döner.
- `"provider-config"`: seçici izin listelerinden bağımsız,
  kaynakta tanımlanmış `models.providers.*.models` envanteri. Satırlar, herkese açık model
  yeteneklerini ve rota duyarlı kullanılabilirliği içerir; ancak sağlayıcı uç
  noktalarını, kimlik doğrulama materyallerini ve çalışma zamanı istek
  yapılandırmasını içermez.
- `"all"`: `agents.defaults.models` atlanarak tam Gateway kataloğu.
  Normal model seçiciler için değil, tanılama/keşif kullanıcı arayüzleri için kullanın.

## Yürütme onayları

- Bir yürütme isteği onay gerektirdiğinde Gateway,
  `exec.approval.requested` yayınını yapar.
- Operatör istemcileri, `exec.approval.resolve` çağrısı yaparak çözümler
  (`operator.approvals` gerektirir).
- `host=node` için `exec.approval.request`, `systemRunPlan`
  (standart `argv`/`cwd`/`rawCommand`/oturum meta verileri) içermelidir.
  `systemRunPlan` içermeyen istekler reddedilir.
- Onaydan sonra iletilen `node.invoke system.run` çağrıları, yetkili
  komut/cwd/oturum bağlamı olarak bu standart `systemRunPlan` değerini yeniden kullanır.
- Bir çağıran, hazırlama ile nihai onaylanmış `system.run`
  iletimi arasında `command`, `rawCommand`, `cwd`,
  `agentId` veya `sessionKey` değerini değiştirirse Gateway, değiştirilmiş
  yüke güvenmek yerine çalıştırmayı reddeder.

## Aracı teslimatı geri dönüşü

- `agent` istekleri, giden teslimatı talep etmek için
  `deliver=true` içerebilir.
- `bestEffortDeliver=false` (varsayılan) katı davranışı korur: çözümlenemeyen
  veya yalnızca dahili teslimat hedefleri `INVALID_REQUEST` döndürür.
- `bestEffortDeliver=true`, harici olarak teslim edilebilir bir rota
  çözümlenemediğinde (örneğin dahili/web sohbeti oturumlarında veya belirsiz çok
  kanallı yapılandırmalarda) yalnızca oturum yürütmesine geri dönüşe izin verir.
- Nihai `agent` sonuçları, teslimat talep edildiğinde
  [`openclaw agent --json --deliver`](/tr/cli/agent#json-delivery-status) için belgelenen aynı
  `sent`, `suppressed`, `partial_failed` ve
  `failed` durumlarını kullanarak `result.deliveryStatus` içerebilir.

## Sürüm oluşturma

- `PROTOCOL_VERSION`, `MIN_CLIENT_PROTOCOL_VERSION`,
  `MIN_NODE_PROTOCOL_VERSION` ve `MIN_PROBE_PROTOCOL_VERSION`,
  `packages/gateway-protocol/src/version.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir. Operatör
  ve kullanıcı arayüzü istemcileri, geçerli protokolü bu aralığa dahil etmelidir;
  mevcut istemciler ve sunucular protokol v4'ü çalıştırır.
- Hem `role: "node"` hem de `client.mode: "node"` özelliklerine sahip
  kimliği doğrulanmış istemciler, N-1 Node protokolünü (şu anda v3) kullanabilir.
  Hafif yeniden başlatma yoklamaları aynı N-1 aralığını kullanır. Cihaz kimlik
  doğrulaması, eşleştirme, kapsamlar, komut politikası ve yürütme onayları bu
  uyumluluk aralığından etkilenmez. Plugin tarafından yönetilen Node yetenekleri
  ve komutları, barındırılan yüzeyleri N-1 sözleşmesinin parçası olmadığından
  Node geçerli protokole yükseltilene kadar sunulmaz.
- Şemalar ve modeller TypeBox tanımlarından oluşturulur:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### İstemci sabitleri

Referans istemci uygulaması `packages/gateway-client/src/` içinde bulunur
(OpenClaw bunu ince `src/gateway/client.ts` cephesi üzerinden sarmalar). Bu
varsayılanlar protokol v4 boyunca kararlıdır ve üçüncü taraf istemciler için
beklenen temel değerlerdir.

| Sabit                                     | Varsayılan                                            | Kaynak                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| İstek zaman aşımı (RPC başına)            | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`requestTimeoutMs`)                                                              |
| Ön kimlik doğrulama / bağlantı sınaması zaman aşımı | `15_000` ms                                           | `packages/gateway-client/src/timeouts.ts` (`OPENCLAW_HANDSHAKE_TIMEOUT_MS` ortam değişkeni, eşleştirilmiş sunucu/istemci bütçesini artırabilir) |
| İlk yeniden bağlanma geri çekilmesi       | `1_000` ms                                            | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Azami yeniden bağlanma geri çekilmesi     | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Cihaz belirteci kapanışından sonra hızlı yeniden deneme sınırı | `250` ms                                              | `packages/gateway-client/src/client.ts`                                                                                   |
| `terminate()` öncesi zorla durdurma ek süresi | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| `stopAndWait()` varsayılan zaman aşımı | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| Varsayılan tik aralığı (`hello-ok` öncesi) | `30_000` ms                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| Tik zaman aşımı kapanışı                  | sessizlik `tickIntervalMs * 2` değerini aştığında kod `4000` | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

Sunucu, geçerli `policy.tickIntervalMs`, `policy.maxPayload` ve
`policy.maxBufferedBytes` değerlerini `hello-ok` içinde bildirir; istemciler,
el sıkışma öncesi varsayılanlar yerine bu değerlere uymalıdır.

Referans istemci, bekleyen her isteğin bir son tarihi olduğunda sonlu isteklerin
kendi yapılandırılmış son tarihlerini yönetmesine izin verir. Sonlu bir
`timeoutMs` değeri olmayan bir `expectFinal` isteği, `timeoutMs: null`
içeren herhangi bir istek veya sonlu ve sınırsız isteklerin bir karışımı, tik
gözetleyicisini etkin tutar. Gelen olaylar ve yanıtlar tik zaman aşımı eşiğini
aşacak kadar sessiz kalırsa istemci, soketi `4000` koduyla kapatır,
bekleyen her isteği reddeder ve yeniden bağlanır. Yeniden bağlandıktan sonra
reddedilen istekleri yeniden yürütmez.

## Kimlik doğrulama

- Paylaşılan gizli anahtar kullanan Gateway kimlik doğrulaması, yapılandırılan
  `gateway.auth.mode` (`"none" | "token" | "password" | "trusted-proxy"`) değerine bağlı olarak `connect.params.auth.token` veya
  `connect.params.auth.password` kullanır.
- Tailscale Serve (`gateway.auth.allowTailscale: true`) veya geri döngü dışı
  `gateway.auth.mode: "trusted-proxy"` gibi kimlik taşıyan modlar, bağlanma kimlik doğrulaması
  denetimini `connect.params.auth.*` yerine istek üstbilgileriyle karşılar.
- Özel giriş `gateway.auth.mode: "none"`, paylaşılan gizli anahtarlı bağlanma kimlik doğrulamasını
  tamamen atlar; bu modu genel/güvenilmeyen girişte kullanıma açmayın.
- Eşleştirmeden sonra Gateway, bağlantı rolü + kapsamlarıyla sınırlı bir cihaz
  belirteci oluşturur ve bunu `hello-ok.auth.deviceToken` içinde döndürür. İstemciler,
  başarılı her bağlantıdan sonra bu belirteci kalıcı olarak saklamalıdır.
- Saklanan bu cihaz belirteciyle yeniden bağlanırken, belirteç için saklanan
  onaylanmış kapsam kümesi de yeniden kullanılmalıdır. Bu, önceden verilmiş
  okuma/yoklama/durum erişimini korur ve yeniden bağlantıların sessizce daha dar,
  örtük ve yalnızca yöneticiye özgü bir kapsama indirgenmesini önler.
- İstemci tarafında bağlanma kimlik doğrulamasının oluşturulması (`packages/gateway-client/src/client.ts`
  içindeki `selectConnectAuth`):
  - `auth.password` bağımsızdır ve ayarlandığında her zaman iletilir.
  - `auth.token` şu öncelik sırasıyla doldurulur: önce açıkça belirtilen paylaşılan
    belirteç, ardından açıkça belirtilen bir `deviceToken`, son olarak da cihaz başına
    saklanan belirteç (`deviceId` + `role` anahtarıyla).
  - `auth.bootstrapToken`, yalnızca yukarıdakilerin hiçbiri
    `auth.token` değerini çözümlemediğinde gönderilir. Paylaşılan bir belirteç veya
    çözümlenen herhangi bir cihaz belirteci bunu engeller.
  - Tek seferlik `AUTH_TOKEN_MISMATCH` yeniden denemesinde saklanan bir cihaz
    belirtecinin otomatik olarak yükseltilmesi yalnızca güvenilir uç noktalarla sınırlıdır:
    geri döngü veya sabitlenmiş bir `tlsFingerprint` içeren `wss://`.
    Sabitleme olmadan genel `wss://` uygun değildir.
- Yerleşik kurulum koduyla önyükleme, güvenilir mobil devretme için birincil Node
  `hello-ok.auth.deviceToken` değerini ve `hello-ok.auth.deviceTokens` içinde sınırlandırılmış bir operatör
  belirtecini döndürür. Operatör belirteci, yerel Talk yapılandırma okumaları için
  `operator.talk.secrets` kapsamını içerir ancak eşleştirme değişikliği kapsamlarını ve
  `operator.admin` kapsamını içermez.
- Temel olmayan bir kurulum koduyla önyükleme onay beklerken
  `PAIRING_REQUIRED` ayrıntıları `recommendedNextStep: "wait_then_retry"`,
  `retryable: true` ve `pauseReconnect: false` değerlerini içerir. İstek onaylanana
  veya belirteç geçersiz hâle gelene kadar aynı önyükleme belirteciyle yeniden
  bağlanmaya devam edin.
- `hello-ok.auth.deviceTokens` değerini yalnızca bağlantı, `wss://` veya
  geri döngü/yerel eşleştirme gibi güvenilir bir aktarım üzerinden önyükleme kimlik
  doğrulaması kullandığında kalıcı olarak saklayın.
- Bir istemci açıkça bir `deviceToken` veya `scopes` sağlarsa,
  çağıranın istediği bu kapsam kümesi geçerliliğini korur; önbelleğe alınan kapsamlar
  yalnızca istemci, cihaz başına saklanan belirteci yeniden kullandığında yeniden
  kullanılır.
- Cihaz belirteçleri `device.token.rotate` ve `device.token.revoke` aracılığıyla
  döndürülebilir/iptal edilebilir (`operator.pairing` gerekir). Bir Node veya
  operatör dışındaki başka bir rolü döndürmek ya da iptal etmek için ayrıca
  `operator.admin` gerekir.
- `device.token.rotate`, döndürme meta verilerini döndürür. Yeni taşıyıcı belirteci,
  yalnızca aynı cihazdan yapılan ve hâlihazırda o cihaz belirteciyle doğrulanmış
  çağrılarda yineler; böylece yalnızca belirteç kullanan istemciler yeniden
  bağlanmadan önce yeni belirteçlerini kalıcı olarak saklayabilir. Paylaşılan/yönetici
  döndürmelerinde taşıyıcı belirteç yinelenmez.
- Belirteç oluşturma, döndürme ve iptal etme işlemleri, ilgili cihazın eşleştirme
  girdisinde kayıtlı onaylanmış rol kümesiyle sınırlı kalır; belirteç değişikliği,
  eşleştirme onayının hiç vermediği bir cihaz rolünü kapsama alamaz veya hedefleyemez.
- Eşleştirilmiş cihaz belirteci oturumlarında, çağıran ayrıca
  `operator.admin` kapsamına sahip değilse cihaz yönetimi kendi cihazıyla sınırlıdır:
  yönetici olmayan çağıranlar yalnızca kendi cihaz girdilerinin operatör belirtecini
  yönetebilir. Node ve operatör dışındaki diğer belirteçlerin yönetimi, çağıranın
  kendi cihazı için bile yalnızca yöneticiye açıktır.
- `device.token.rotate` ve `device.token.revoke`, hedef operatör belirtecinin
  kapsam kümesini çağıranın mevcut oturum kapsamlarıyla da karşılaştırır.
  Yönetici olmayan çağıranlar, hâlihazırda sahip olduklarından daha geniş kapsamlı
  bir operatör belirtecini döndüremez veya iptal edemez.
- Kimlik doğrulama hataları, `error.details.code` ile birlikte kurtarma ipuçları içerir:
  - `error.details.canRetryWithDeviceToken` (boole)
  - `error.details.recommendedNextStep`: `retry_with_device_token`,
    `update_auth_configuration`, `update_auth_credentials`,
    `wait_then_retry` veya `review_auth_configuration`
    değerlerinden biri (`packages/gateway-protocol/src/connect-error-details.ts`).
- `AUTH_TOKEN_MISMATCH` için istemci davranışı:
  - Güvenilir istemciler, önbelleğe alınmış cihaz başına belirteçle bir kez
    sınırlandırılmış yeniden deneme girişiminde bulunabilir.
  - Bu yeniden deneme başarısız olursa otomatik yeniden bağlanma döngülerini
    durdurun ve operatörün yapması gereken işlemlere ilişkin yönlendirmeyi gösterin.
- `AUTH_SCOPE_MISMATCH`, cihaz belirtecinin tanındığı ancak istenen rolü/kapsamları
  kapsamadığı anlamına gelir. Bunu hatalı bir belirteç olarak sunmayın; operatörden
  yeniden eşleştirme yapmasını veya daha dar/geniş kapsam sözleşmesini onaylamasını
  isteyin.

## Cihaz kimliği ve eşleştirme

- Node'lar, anahtar çifti parmak izinden türetilen kararlı bir cihaz kimliği
  (`device.id`) içermelidir.
- Gateway'ler cihaz + rol başına belirteç oluşturur.
- Yerel otomatik onay etkinleştirilmediği sürece yeni cihaz kimlikleri için
  eşleştirme onayı gerekir.
- Eşleştirmeyi otomatik onaylama, doğrudan yerel geri döngü bağlantılarını
  temel alır.
- OpenClaw ayrıca güvenilir paylaşılan gizli anahtar yardımcı akışları için dar
  kapsamlı bir arka uç/kapsayıcı içi kendi kendine bağlantı yoluna sahiptir.
- Aynı ana makinedeki tailnet veya LAN bağlantıları eşleştirme açısından yine
  uzak olarak değerlendirilir ve onay gerektirir.
- WS istemcileri normalde `connect` sırasında `device`
  kimliğini içerir (operatör + Node). Cihazsız operatör için tek istisnalar,
  açıkça belirtilen şu güven yollarıdır:
  - Yalnızca localhost'a özgü güvenli olmayan HTTP uyumluluğu için
    `gateway.controlUi.allowInsecureAuth=true`.
  - Başarılı `gateway.auth.mode: "trusted-proxy"` operatör Control UI kimlik doğrulaması.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (acil durum, ciddi
    güvenlik düşürmesi).
  - Ayrılmış dahili yardımcı yolundaki doğrudan geri döngülü `gateway-client`
    arka uç RPC'leri.
- Cihaz kimliğinin atlanmasının kapsamla ilgili sonuçları vardır. Açık bir güven
  yolu üzerinden cihazsız operatör bağlantısına izin verildiğinde OpenClaw, ilgili
  yol için adlandırılmış bir kapsam koruma istisnası yoksa istemcinin kendi bildirdiği
  kapsamları yine de boş kümeye temizler. Kapsamla sınırlandırılmış yöntemler daha
  sonra `missing scope` hatasıyla başarısız olur.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`, bir Control UI
  acil durum kapsam koruma yoludur. Rastgele özel arka uç veya CLI biçimli WebSocket
  istemcilerine kapsam vermez.
- Ayrılmış doğrudan geri döngülü `gateway-client` arka uç yardımcı yolu,
  kapsamları yalnızca dahili yerel denetim düzlemi RPC'leri için korur; özel arka uç
  kimlikleri bu istisnadan yararlanmaz.
- Tüm bağlantılar, sunucunun sağladığı `connect.challenge` nonce değerini imzalamalıdır.

### Cihaz kimlik doğrulaması geçiş tanılamaları

Hâlâ doğrulama öncesi imzalama davranışını kullanan eski istemciler için `connect`,
kararlı bir `error.details.reason` ile `error.details.code` altında `DEVICE_AUTH_*`
ayrıntı kodlarını döndürür.

Yaygın geçiş hataları:

| İleti                       | details.code                     | details.reason           | Anlamı                                             |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | İstemci `device.nonce` değerini atladı (veya boş gönderdi). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | İstemci eski/yanlış bir nonce ile imzaladı.        |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | İmza yükü, v2 yüküyle eşleşmiyor.                  |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | İmzalanan zaman damgası, izin verilen sapmanın dışında. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`, genel anahtar parmak iziyle eşleşmiyor. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Genel anahtar biçimi/standartlaştırması başarısız oldu. |

Geçiş hedefi:

- Her zaman `connect.challenge` değerini bekleyin.
- Sunucu nonce değerini içeren v2 yükünü imzalayın.
- Aynı nonce değerini `connect.params.device.nonce` içinde gönderin.
- Tercih edilen imza yükü `v3`
  (`packages/gateway-client/src/device-auth.ts` içindeki `buildDeviceAuthPayloadV3`) olup
  cihaz/istemci/rol/kapsamlar/belirteç/nonce alanlarına ek olarak
  `platform` ve `deviceFamily` değerlerini de bağlar.
- Eski `v2` imzaları uyumluluk için kabul edilmeye devam eder,
  ancak eşleştirilmiş cihaz meta verilerinin sabitlenmesi, yeniden bağlantıda komut
  politikasını denetlemeye devam eder.

## TLS ve sabitleme

- WS bağlantıları için TLS desteklenir (`gateway.tls` yapılandırması).
- İstemciler isteğe bağlı olarak `gateway.remote.tlsFingerprint` veya CLI
  `--tls-fingerprint` aracılığıyla Gateway sertifikası parmak izini sabitleyebilir.

## Kapsam

Bu protokol Gateway API'sinin tamamını kullanıma açar: durum, kanallar, modeller,
sohbet, aracı, oturumlar, Node'lar, onaylar ve daha fazlası. Tam yüzey,
`packages/gateway-protocol/src/schema.ts` üzerinden yeniden dışa aktarılan TypeBox şemalarıyla tanımlanır.

## İlgili

- [Köprü protokolü](/tr/gateway/bridge-protocol)
- [Gateway operasyon kılavuzu](/tr/gateway)
