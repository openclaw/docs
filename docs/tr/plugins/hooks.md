---
read_when:
    - before_tool_call, before_agent_reply, mesaj kancaları veya yaşam döngüsü kancaları gerektiren bir plugin geliştiriyorsunuz
    - Bir Plugin’den gelen araç çağrılarını engellemeniz, yeniden yazmanız veya onay gerektirecek şekilde yapılandırmanız gerekiyor
    - Dahili hook'lar ile plugin hook'ları arasında karar veriyorsunuz
    - OpenClaw Cron uyandırmalarını harici bir ana makine zamanlayıcısına yansıtıyorsunuz
summary: 'Plugin kancaları: ajan, araç, mesaj, oturum ve Gateway yaşam döngüsü olaylarına müdahale etme'
title: Plugin kancaları
x-i18n:
    generated_at: "2026-07-16T17:21:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9e4e94220bca59b710b7b46c87bb889942c88b0d44f723e7133f271d34d9c929
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin hook'ları, OpenClaw plugin'leri için işlem içi genişletme noktalarıdır: ajan çalıştırmalarını, araç çağrılarını, mesaj akışını, oturum yaşam döngüsünü, alt ajan yönlendirmesini, kurulumları veya Gateway başlatmayı inceleyin ya da değiştirin.

Komut ve Gateway olaylarına tepki veren, operatör tarafından kurulmuş küçük bir
`HOOK.md` betiği için bunun yerine [dahili hook'ları](/tr/automation/hooks) kullanın; örneğin `/new`,
`/reset`, `/stop`, `agent:bootstrap` veya `gateway:startup`.

## Hızlı başlangıç

Plugin girişinden `api.on(...)` ile türü belirlenmiş hook'ları kaydedin:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Araç Ön Kontrolü",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Web araması çalıştır",
            description: `Arama sorgusuna izin ver: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Karar veya değişiklik döndürebilen işleyiciler, azalan
`priority` sırasıyla ardışık olarak çalışır; aynı önceliğe sahip işleyiciler kayıt sırasını korur.
Yalnızca gözlem yapan işleyiciler paralel çalışır ve çalıştırılıp sonucu beklenmeyen gözlem
dağıtımları sonraki olaylarla çakışabilir. Gözlem yan etkilerini sıralamak için önceliği kullanmayın.

`api.on(name, handler, opts?)` şunları kabul eder:

| Seçenek      | Etki                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | Sıralama; daha yüksek olan önce çalışır.                                                                                                                                                                      |
| `timeoutMs` | Hook başına bekleme bütçesi. Süresi dolduğunda OpenClaw, bu işleyiciyi beklemeyi bırakır ve devam eder. İşleyiciyi veya yan etkilerini iptal etmez. Çalıştırıcının varsayılan hook başına zaman aşımını kullanmak için belirtmeyin. |

Operatörler, plugin kodunu yamalamadan hook bütçelerini ayarlayabilir:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "timeoutMs": 30000,
          "timeouts": {
            "before_prompt_build": 90000,
            "agent_end": 60000
          }
        }
      }
    }
  }
}
```

`hooks.timeouts.<hookName>`, `hooks.timeoutMs` değerini; o da
plugin tarafından yazılmış `api.on(..., { timeoutMs })` değerini geçersiz kılar. Her değer,
600000 ms'ye kadar pozitif bir tam sayı olmalıdır. Tek bir plugin'in her yerde daha uzun bir bütçe almaması için yavaş olduğu bilinen
hook'larda hook başına geçersiz kılmaları tercih edin.

Hook geri çağrıları bir iptal sinyali almadığından, zaman aşımına uğrayan bir işleyici promise'ı çalışmaya devam eder.
Hook dağıtımı, söz konusu plugin işi hâlâ devam ederken Gateway
kabulünü serbest bırakabilir. Uzun süren işlerin sahibi olan plugin'ler,
kendi iptal ve kapatma yaşam döngülerini sağlamalıdır.

Giden verileri değiştiren `message_sending` ve `reply_payload_sending` hook'ları,
işleyici başına varsayılan 15 saniyelik süre kullanır. Biri zaman aşımına uğrarsa OpenClaw plugin hatasını günlüğe kaydeder
ve serileştirilmiş teslimat hattının sonuçlanabilmesi için en güncel yükle devam eder.
Teslimattan önce kasıtlı olarak daha yavaş işler yapan plugin'ler için daha büyük bir hook başına bütçe ayarlayın.

`createReplyDispatcher` kullanan kanal plugin'leri de `beforeDeliverOptions: { timeoutMs }` ile veya
`dispatcher.appendBeforeDeliver(handler, { timeoutMs })` kullanarak iş eklerken aşama başına daha büyük bir
pozitif bütçe bildirebilir.
Sahip tarafından bildirilmiş bir bütçe olmadan bu geri çağrılar aynı 15 saniyelik
varsayılanı kullanır; böylece takılı kalan bir geri çağrı serileştirilmiş teslimat hattını elinde tutamaz.

Her hook, ilgili işleyiciyi kaydeden plugin için çözümlenmiş yapılandırma olan `event.context.pluginConfig` değerini alır.
OpenClaw bunu, diğer plugin'lerin gördüğü paylaşılan olay nesnesini
değiştirmeden her işleyiciye ayrı ayrı enjekte eder.

## Hook kataloğu

Hook'lar genişlettikleri yüzeye göre gruplandırılır. **Kalın** adlar bir karar
sonucunu kabul eder (engelleme, iptal, geçersiz kılma veya onay gerektirme); diğerleri
yalnızca gözlem içindir.

**Ajan turu**

| Hook                            | Amaç                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `before_model_resolve`          | Oturum mesajları yüklenmeden önce sağlayıcıyı veya modeli geçersiz kılma                                  |
| `agent_turn_prepare`            | Kuyruğa alınmış plugin turu eklemelerini tüketme ve istem hook'larından önce aynı tura bağlam ekleme      |
| `before_prompt_build`           | Model çağrısından önce dinamik bağlam veya sistem istemi metni ekleme                          |
| `before_agent_start`            | Yalnızca uyumluluk amaçlı birleşik aşama; yukarıdaki iki hook'u tercih edin                            |
| **`before_agent_run`**          | Model gönderiminden önce nihai istemi ve oturum mesajlarını inceleme; çalıştırmayı engelleyebilir |
| **`before_agent_reply`**        | Model turunu yapay bir yanıtla veya sessizlikle kısa devre etme                           |
| **`before_agent_finalize`**     | Doğal nihai yanıtı inceleme ve modelden bir geçiş daha isteme                         |
| `agent_end`                     | Nihai mesajları, başarı durumunu ve çalıştırma süresini gözlemleme                                  |
| `heartbeat_prompt_contribution` | Arka plan izleme ve yaşam döngüsü plugin'leri için yalnızca Heartbeat bağlamı ekleme                  |

**Konuşma gözlemi**

| Hook                                      | Amaç                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `model_call_started` / `model_call_ended` | Temizlenmiş sağlayıcı/model çağrısı meta verileri: zamanlama, sonuç, sınırlandırılmış istek kimliği karmaları. İstem veya yanıt içeriği yoktur. |
| `llm_input`                               | Sağlayıcı girdisi: sistem istemi, istem, geçmiş                                                                     |
| `llm_output`                              | Sağlayıcı çıktısı, kullanım ve mevcut olduğunda çözümlenmiş `contextTokenBudget`                                       |

**Araçlar**

| Hook                       | Amaç                                                   |
| -------------------------- | --------------------------------------------------------- |
| **`before_tool_call`**     | Araç parametrelerini yeniden yazma, yürütmeyi engelleme veya onay gerektirme |
| `after_tool_call`          | Araç sonuçlarını, hataları ve süreyi gözlemleme                |
| `resolve_exec_env`         | `exec` için plugin'e ait ortam değişkenlerine katkıda bulunma   |
| **`tool_result_persist`**  | Bir araç sonucundan üretilen asistan mesajını yeniden yazma |
| **`before_message_write`** | Devam eden bir mesaj yazımını inceleme veya engelleme (nadiren)      |

**Mesajlar ve teslimat**

| Hook                            | Amaç                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| **`inbound_claim`**             | Ajan yönlendirmesinden önce gelen bir mesajı üstlenme (yapay yanıtlar) |
| **`channel_pairing_requested`** | Yeni oluşturulan doğrudan mesaj eşleştirme isteklerini gözlemleme                         |
| `message_received`              | Gelen içeriği, göndereni, ileti dizisini ve meta verileri gözlemleme             |
| **`message_sending`**           | Giden içeriği yeniden yazma veya teslimatı iptal etme                       |
| **`reply_payload_sending`**     | Teslimattan önce normalleştirilmiş yanıt yüklerini değiştirme veya iptal etme        |
| `message_sent`                  | Giden teslimatın başarılı veya başarısız olduğunu gözlemleme                      |
| **`before_dispatch`**           | Kanala devretmeden önce giden bir dağıtımı inceleme veya yeniden yazma    |
| **`reply_dispatch`**            | Nihai yanıt dağıtım ardışık düzenine katılma                  |

**Oturumlar ve Compaction**

| Hook                                     | Amaç                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_start` / `session_end`          | Oturum yaşam döngüsü sınırlarını izleme. `reason`; `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` veya `unknown` değerlerinden biridir. `shutdown`/`restart`, işlem etkin oturumlarla durduğunda veya yeniden başlatıldığında Gateway kapatma sonlandırıcısından tetiklenir; böylece plugin'ler (bellek, transkript depoları), hayalet satırları yeniden başlatmalar arasında açık bırakmak yerine sonlandırabilir. Yavaş bir plugin'in SIGTERM/SIGINT sinyallerini engelleyememesi için sonlandırıcının süresi sınırlandırılmıştır. |
| `before_compaction` / `after_compaction` | Compaction döngülerini gözlemleme veya açıklama ekleme                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `before_reset`                           | Oturum sıfırlama olaylarını gözlemleme (`/reset`, programatik sıfırlamalar)                                                                                                                                                                                                                                                                                                                                                                                                     |

**Alt ajanlar**

- `subagent_spawned` / `subagent_ended` - alt ajan başlatma ve tamamlanmasını gözlemleyin.
- `subagent_delivery_target` - hiçbir çekirdek oturum bağlaması bir rota yansıtamadığında tamamlanma teslimi için uyumluluk kancası.
- `subagent_spawning` - kullanımdan kaldırılmış uyumluluk kancası. Çekirdek artık `subagent_spawned` tetiklenmeden önce kanal oturum bağlama bağdaştırıcıları aracılığıyla `thread: true` alt ajan bağlamalarını hazırlar.
- `subagent_spawned`, OpenClaw alt oturumun yerel modelini başlatmadan önce çözümlediğinde `resolvedModel` ve `resolvedProvider` içerir.
- `subagent_ended`; `targetSessionKey` (kimlik - `subagent_spawned.childSessionKey` ile eşleşir), `targetKind` (`"subagent"` veya `"acp"`), `reason`, isteğe bağlı `outcome` (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` veya `"deleted"`), isteğe bağlı `error`, `runId`, `endedAt`, `accountId` ve `sendFarewell` taşır. `agentId` veya `childSessionKey` **içermez**; eşleşen `subagent_spawned` olayıyla ilişkilendirmek için `targetSessionKey` kullanın.

**Yaşam döngüsü**

| Kanca                             | Amaç                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | Plugin'e ait hizmetleri Gateway ile başlatın veya durdurun                                                 |
| `deactivate`                     | `gateway_stop` için kullanımdan kaldırılmış uyumluluk diğer adı; yeni pluginlerde `gateway_stop` kullanın                 |
| `cron_reconciled`                | Başlatma veya yeniden yüklemeden sonra eksiksiz Gateway cron durumuyla mutabakat sağlayın                            |
| `cron_changed`                   | Gateway'e ait cron yaşam döngüsü değişikliklerini gözlemleyin (eklendi, güncellendi, kaldırıldı, başlatıldı, tamamlandı, zamanlandı) |
| **`before_install`**             | Yüklenmiş bir plugin çalışma zamanından hazırlanan skill veya plugin kurulum materyalini inceleyin                         |

### Kanal eşleştirme istekleri

Bir plugin'in, eşleştirilmemiş bir DM göndericisi bekleyen bir eşleştirme
isteği oluşturduktan sonra bir operatörü bilgilendirmesi veya denetim kaydı
yazması gerektiğinde `channel_pairing_requested` kullanın. Kanca, istek oluşturulduğunda
gönderilir; eşleştirme yanıtının kanal üzerinden teslimi, yavaş veya başarısız
kanca işleyicileri nedeniyle geciktirilmez.

```typescript
api.on("channel_pairing_requested", async (event) => {
  await notifyOperator({
    text: `Yeni ${event.channel} eşleştirme isteği, gönderen ${event.senderId}: ${event.code}`,
  });
});
```

Kanca yalnızca gözlem amaçlıdır. Eşleştirme yanıtını onaylamaz, reddetmez,
bastırmaz veya yeniden yazmaz. Yük; kanalı, isteğe bağlı `accountId`,
kanal kapsamlı `senderId`, eşleştirme `code` ve kanal meta
verilerini içerir. Eşleştirme kodunu canlı, tek kullanımlık bir onay kimlik
bilgisi olarak değerlendirin ve yalnızca güvenilir bir operatör hedefine
teslim edin. `metadata` değerini, gönderici tarafından sağlanan
güvenilmeyen kimlik metni olarak değerlendirin. Kanca, gelen ileti gövdesini
veya medyayı içermez.

## Çalışma zamanı kancalarında hata ayıklama

Bir ajan turu için sağlayıcıyı veya modeli değiştirmek üzere
`before_model_resolve` kullanın; model çözümlemesinden önce çalışır.
`llm_output` yalnızca bir model denemesi asistan çıktısı ürettikten sonra
çalışır.

Geçerli oturum modelini kanıtlamak için çalışma zamanı kayıtlarını inceleyin,
ardından `openclaw sessions` veya Gateway oturum/durum yüzeylerini kullanın.
Sağlayıcı yüklerinde hata ayıklamak için ham model akış olaylarını bir jsonl
dosyasına yazmak üzere Gateway'i `--raw-stream` ve
`--raw-stream-path <path>` ile başlatın.

## Araç çağrısı politikası

`before_tool_call` şunları alır:

- `event.toolName`
- `event.params`
- isteğe bağlı `event.toolKind` ve `event.toolInputKind`; adları kasıtlı
  olarak aynı olan araçlar için ana makine tarafından belirlenen ayırt ediciler;
  örneğin dış kod modu `exec` çağrıları `toolKind: "code_mode_exec"` kullanır
  ve giriş dili bilindiğinde `toolInputKind: "javascript" | "typescript"` içerir
- isteğe bağlı `event.derivedPaths`; `apply_patch` gibi iyi bilinen
  araç zarfları için ana makine tarafından türetilen, en iyi çabaya dayalı hedef
  yol ipuçlarıdır; bu yollar, aracın gerçekte dokunacağı alanı eksik veya
  olduğundan geniş gösterebilir (örneğin hatalı biçimlendirilmiş veya kısmi
  girdilerde)
- isteğe bağlı `event.runId`
- isteğe bağlı `event.toolCallId`
- `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.toolKind`, `ctx.toolInputKind` ve tanılama
  amaçlı `ctx.trace` gibi bağlam alanları

Şunları döndürebilir:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    /** @deprecated Çözümlenmemiş onaylar her zaman reddedilir. */
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Türü belirlenmiş yaşam döngüsü kancalarının koruma davranışı:

- `block: true` sonlandırıcıdır ve daha düşük öncelikli işleyicileri atlar.
- `block: false` karar verilmemiş olarak değerlendirilir.
- `params` yürütme için araç parametrelerini yeniden yazar.
- `requireApproval` ajan çalışmasını duraklatır ve plugin onayları
  aracılığıyla kullanıcıya sorar. `/approve` hem exec hem de plugin
  onaylarını onaylayabilir. Codex app-server rapor modundaki yerel
  `PreToolUse` aktarımlarında bu işlem, eşleşen app-server onay isteğine
  bırakılır; bkz.
  [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime#hook-boundaries).
- Daha düşük öncelikli bir `block: true`, daha yüksek öncelikli bir kanca
  onay istedikten sonra da engelleme yapabilir.
- `onResolution` çözümlenmiş kararı alır: `allow-once`,
  `allow-always`, `deny`, `timeout` veya
  `cancelled`.

Onay yönlendirmesi, karar davranışı ve isteğe bağlı araçlar veya exec onayları
yerine ne zaman `requireApproval` kullanılacağı hakkında bilgi için
[Plugin izin istekleri](/tr/plugins/plugin-permission-requests) bölümüne bakın.

Ana makine düzeyinde politikaya ihtiyaç duyan pluginler,
`api.registerTrustedToolPolicy(...)` ile güvenilir araç politikaları
kaydedebilir. Bunlar sıradan `before_tool_call` kancalarından ve normal kanca
kararlarından önce çalışır. Önce paketlenmiş güvenilir politikalar, ardından
plugin yükleme sırasına göre kurulu pluginlerin güvenilir politikaları çalışır;
sıradan `before_tool_call` kancaları bunlardan sonra çalışır. Paketlenmiş
pluginler mevcut güvenilir politika yolunu korur. Kurulu pluginler açıkça
etkinleştirilmeli ve her politika kimliğini `contracts.trustedToolPolicies` içinde
bildirmelidir; bildirilmemiş kimlikler kayıt öncesinde reddedilir. Politika
kimlikleri, kaydeden plugin kapsamında olduğundan farklı pluginler aynı yerel
kimliği yeniden kullanabilir. Bu katmanı yalnızca çalışma alanı politikası,
bütçe uygulaması veya ayrılmış iş akışı güvenliği gibi ana makine tarafından
güvenilen kapılar için kullanın.

### Exec ortamı kancası

`resolve_exec_env`, komut çalışmadan önce pluginlerin `exec` araç
çağrılarına ortam değişkenleri eklemesine olanak tanır. Şunları alır:

- `event.sessionKey`
- `event.toolName`, şu anda her zaman `"exec"`
- `event.host`; `"gateway"`, `"sandbox"` veya `"node"` değerlerinden biri
- `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider` ve `ctx.channelId` gibi bağlam alanları

Exec ortamıyla birleştirilecek bir `Record<string, string>` döndürün. İşleyiciler
öncelik sırasına göre çalışır; sonraki sonuçlar aynı anahtar için önceki
sonuçları geçersiz kılar.

Kanca çıktısı, birleştirilmeden önce ana makinenin exec ortam anahtarı
politikasından geçirilerek filtrelenir. `PATH` her zaman çıkarılır
(komut çözümlemesi ve güvenli ikili dosya denetimleri buna bağlıdır). Geçersiz
anahtarlar ve `LD_*`, `DYLD_*`, `NODE_OPTIONS` gibi
tehlikeli ana makine geçersiz kılma anahtarları, proxy değişkenleri
(`HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`,
`NO_PROXY`) ve TLS geçersiz kılma değişkenleri
(`NODE_TLS_REJECT_UNAUTHORIZED`, `SSL_CERT_FILE` ve benzerleri) çıkarılır. Filtrelenen
plugin ortamı, Gateway onay/denetim meta verilerine eklenir ve node-host yürütme
isteklerine iletilir.

### Araç sonucu kalıcılığı

Araç sonuçları; kullanıcı arayüzü oluşturma, tanılama, medya yönlendirme veya
plugin'e ait meta veriler için yapılandırılmış `details` içerebilir.
`details` değerini istem içeriği değil, çalışma zamanı meta verisi
olarak değerlendirin:

- OpenClaw, meta verilerin model bağlamına dönüşmemesi için sağlayıcıda
  yeniden oynatma ve Compaction girdisinden önce `toolResult.details` değerini
  çıkarır.
- Kalıcı oturum girdileri yalnızca sınırlandırılmış `details`
  değerini tutar. Aşırı büyük ayrıntılar, kısa bir özet ve
  `persistedDetailsTruncated: true` ile değiştirilir.
- `tool_result_persist` ve `before_message_write`, son kalıcılık sınırından
  önce çalışır. Döndürülen `details` değerini küçük tutun ve istemle
  ilgili metni yalnızca `details` içine yerleştirmekten kaçının;
  modelin görebileceği araç çıktısını `content` içine yerleştirin.

## İstem ve model kancaları

Yeni pluginler için aşamaya özgü kancaları kullanın:

- `before_model_resolve`: yalnızca geçerli istemi ve ek meta verilerini
  alır. `providerOverride` veya `modelOverride` döndürün.
- `agent_turn_prepare`: geçerli istemi, hazırlanmış oturum iletilerini ve
  bu oturum için boşaltılan tam olarak bir kez kuyruğa alınmış eklemeleri alır.
  `prependContext` veya `appendContext` döndürün.
- `before_prompt_build`: geçerli istemi ve oturum iletilerini alır.
  `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` veya `appendSystemContext` döndürün.
- `heartbeat_prompt_contribution`: yalnızca Heartbeat turlarında çalışır ve
  `prependContext` veya `appendContext` döndürür. Kullanıcı tarafından
  başlatılan turları değiştirmeden geçerli durumu özetlemesi gereken arka plan
  izleyicileri için tasarlanmıştır.

`before_agent_start` uyumluluk amacıyla korunmaktadır. Plugin'in eski birleşik
bir aşamaya bağımlı olmaması için yukarıdaki açık kancaları tercih edin.

`before_agent_run`, istem oluşturulduktan sonra ve isteme özgü görüntü yükleme
ile `llm_input` gözlemi dahil olmak üzere herhangi bir model girdisinden
önce çalışır. Geçerli kullanıcı girdisini `prompt` olarak, yüklenmiş
oturum geçmişini `messages` içinde ve etkin sistem istemini alır. Model
istemi okumadan önce çalışmayı durdurmak için `{ outcome: "block", reason, message? }` döndürün.
`reason` dahilidir; `message` kullanıcıya yönelik yerine geçen
değerdir. Yalnızca `pass` ve `block` sonuçları desteklenir;
desteklenmeyen karar şekilleri güvenli biçimde kapalı kalır.

Bir çalışma engellendiğinde OpenClaw, `message.content` içine yalnızca yerine
geçen metni ve engelleyen plugin kimliği ile zaman damgası gibi hassas olmayan
engelleme meta verilerini depolar. Özgün kullanıcı metni dökümde veya gelecekteki
bağlamda tutulmaz. Dahili engelleme nedenleri hassas kabul edilir ve döküm,
geçmiş, yayın, günlük ve tanılama yüklerinden çıkarılır. Gözlemlenebilirlik;
engelleyici kimliği, sonuç, zaman damgası veya güvenli bir kategori gibi
arındırılmış alanları kullanmalıdır.

OpenClaw etkin çalışmayı tanımlayabildiğinde `before_agent_start` ve
`agent_end`, `event.runId` içerir; aynı değer `ctx.runId`
üzerinde de bulunur. Cron tarafından yürütülen çalışmalar ayrıca ajan turu
bağlamında `ctx.jobId` (kaynak cron işinin kimliği) sunar; böylece
kancalar metrikleri, yan etkileri veya durumu belirli bir zamanlanmış işle
sınırlandırabilir. `ctx.jobId`, `before_tool_call` araç bağlamının bir
parçası değildir.

Kanal kaynaklı çalıştırmalarda, `ctx.channel` ve `ctx.messageProvider`,
`discord` veya `telegram` gibi sağlayıcı yüzeyini tanımlarken `ctx.channelId`,
OpenClaw bunu oturum anahtarından veya teslimat meta verilerinden türetebildiğinde
konuşma hedefi tanımlayıcısıdır.

Gönderen kimliği kullanılabilir olduğunda, agent kanca bağlamları şunları da içerir:

- `ctx.senderId` - kanal kapsamlı gönderen kimliği (ör. Feishu `open_id`, Discord
  kullanıcı kimliği). Çalıştırma, gönderen meta verileri bilinen bir kullanıcı mesajından
  kaynaklandığında doldurulur.
- `ctx.chatId` - taşıma katmanına özgü konuşma tanımlayıcısı (ör. Feishu
  `chat_id`, Telegram `chat_id`). Kaynak kanal yerel bir konuşma
  kimliği sağladığında doldurulur.
- `ctx.channelContext.sender.id` - `ctx.senderId` ile aynı gönderen kimliği;
  plugin'lerin kanala özgü alanlarla genişletebileceği, kanalın sahip olduğu bir nesne altında bulunur.
- `ctx.channelContext.chat.id` - `ctx.chatId` ile aynı konuşma kimliği;
  plugin'lerin kanala özgü alanlarla genişletebileceği, kanalın sahip olduğu bir nesne
  altında bulunur.

Çekirdek yalnızca iç içe `id` alanlarını tanımlar. Gelen yardımcı üzerinden
daha zengin gönderen veya sohbet meta verileri ileten kanal plugin'leri,
`openclaw/plugin-sdk/channel-inbound` içindeki
`PluginHookChannelSenderContext` veya `PluginHookChannelChatContext` öğesini genişletebilir:

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

Kanal plugin'leri bu alanları gelen SDK yardımcısı üzerinden iletir:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Bu alanlar isteğe bağlıdır ve sistem kaynaklı çalıştırmalarda (heartbeat,
cron, exec-event) bulunmaz.

`ctx.senderExternalId`, eski plugin'ler için kullanımdan kaldırılmış bir kaynak uyumluluğu alanı
olarak kalır. Çekirdek bunu doldurmaz; kanala özgü yeni gönderen
kimlikleri, modül genişletmesi aracılığıyla `ctx.channelContext.sender` altında
yer almalıdır.

`agent_end` bir gözlem kancasıdır. Gateway ve kalıcı harness yolları bunu
turdan sonra beklemeden çalıştırırken, kısa ömürlü tek seferlik CLI yolları,
güvenilen plugin'lerin terminal gözlemlenebilirliğini aktarabilmesi veya durumu
yakalayabilmesi için işlem temizliğinden önce kanca promise'ini bekler. Kanca çalıştırıcısı,
takılı kalan bir plugin'in veya embedding uç noktasının kanca promise'ini sonsuza kadar
beklemede bırakamaması için 30 saniyelik zaman aşımı uygular. Zaman aşımı günlüğe kaydedilir
ve OpenClaw devam eder; plugin kendi iptal sinyalini de kullanmadığı sürece
plugin'in sahip olduğu ağ çalışmasını iptal etmez.

Ham istemleri, geçmişi, yanıtları, üstbilgileri, istek gövdelerini veya sağlayıcı istek
kimliklerini almaması gereken sağlayıcı çağrısı telemetrisi için `model_call_started` ve
`model_call_ended` kullanın. Bu kancalar; `runId`, `callId`,
`provider`, `model`, isteğe bağlı `api`/`transport`,
terminal `durationMs`/`outcome` ve OpenClaw sınırlı bir sağlayıcı
istek kimliği karması türetebildiğinde `upstreamRequestIdHash` gibi kararlı meta verileri içerir.
Çalışma zamanı bağlam penceresi meta verilerini çözümlediğinde, kanca olayı ve bağlam ayrıca
model/yapılandırma/agent sınırlarından sonraki etkin token bütçesi olan
`contextTokenBudget` öğesini ve daha düşük bir sınır uygulandığında
`contextWindowSource` ile `contextWindowReferenceTokens` öğelerini içerir.

`before_agent_finalize` yalnızca bir harness doğal bir nihai assistant yanıtını kabul etmek
üzereyken çalışır. Bu, `/stop` iptal yolu değildir ve kullanıcı bir turu
iptal ettiğinde çalışmaz. Sonlandırmadan önce harness'ten bir model geçişi daha istemek için
`{ action: "revise", reason }`, sonlandırmayı zorlamak için `{ action:
"finalize", reason? }` döndürün veya devam etmek
için sonuç döndürmeyin. İşleyicilerin varsayılan bütçesi 15s'dir; zaman aşımında OpenClaw
hatayı günlüğe kaydeder ve özgün nihai yanıtla devam eder.
Codex'in yerel `Stop` kancaları, OpenClaw
`before_agent_finalize` kararları olarak bu kancaya aktarılır.

`action: "revise"` döndürürken plugin'ler, ek model geçişini sınırlı ve yeniden yürütmeye
karşı güvenli hâle getirmek için `retry` meta verilerini içerebilir:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction`, harness'e gönderilen düzeltme nedenine eklenir.
`idempotencyKey`, ana makinenin eşdeğer sonlandırma kararları genelinde aynı plugin isteğinin
yeniden denemelerini saymasını sağlar ve `maxAttempts`, doğal nihai yanıtla devam etmeden
önce ana makinenin izin vereceği ek geçiş sayısını sınırlar.

Ham konuşma kancalarına (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end` veya `before_agent_run`) ihtiyaç duyan paketle birlikte gelmeyen plugin'ler
şunu ayarlamalıdır:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

İstemi değiştiren kancalar ve kalıcı sonraki tur eklemeleri, plugin başına
`plugins.entries.<id>.hooks.allowPromptInjection=false` ile devre dışı bırakılabilir.

### Oturum uzantıları ve sonraki tur eklemeleri

İş akışı plugin'leri, `api.session.state.registerSessionExtension(...)` ile küçük, JSON uyumlu oturum durumunu
kalıcı hâle getirebilir ve bunu Gateway `sessions.pluginPatch` yöntemi üzerinden
güncelleyebilir. Oturum satırları, kayıtlı uzantı durumunu `pluginExtensions` üzerinden
yansıtarak Control UI ve diğer istemcilerin plugin iç ayrıntılarını öğrenmeden
plugin'e ait durumu oluşturmasına olanak tanır.
`api.registerSessionExtension(...)` hâlâ çalışır ancak
`api.session.state` ad alanı lehine kullanımdan kaldırılmıştır.

Bir plugin'in sonraki model turuna tam olarak bir kez ulaşacak kalıcı bağlama ihtiyacı
olduğunda `api.session.workflow.enqueueNextTurnInjection(...)` kullanın
(üst düzey `api.enqueueNextTurnInjection(...)`, aynı davranışa sahip kullanımdan kaldırılmış bir takma addır).
OpenClaw, istem kancalarından önce kuyruğa alınmış eklemeleri tüketir, süresi dolmuş
eklemeleri bırakır ve plugin başına `idempotencyKey` değerine göre yinelenenleri kaldırır.
Bu; onay devamları, politika özetleri, arka plan izleyici farkları ve sonraki turda modele
görünmesi gereken ancak kalıcı sistem istemi metnine dönüşmemesi gereken komut devamları için
doğru bağlantı noktasıdır.

Temizleme semantiği sözleşmenin bir parçasıdır. Oturum uzantısı temizleme ve çalışma zamanı
yaşam döngüsü temizleme geri çağrıları `reset`, `delete`,
`disable` veya `restart` alır. Ana makine; sıfırlama/silme/devre dışı
bırakma işlemlerinde sahip plugin'in kalıcı oturum uzantısı durumunu ve bekleyen sonraki tur
eklemelerini kaldırır; yeniden başlatma kalıcı oturum durumunu korurken temizleme geri
çağrıları plugin'lerin eski çalışma zamanı nesli için zamanlayıcı işlerini, çalışma
bağlamını ve diğer bant dışı kaynakları serbest bırakmasına olanak tanır.

## Mesaj kancaları

Kanal düzeyinde yönlendirme ve teslimat politikası için mesaj kancalarını kullanın:

- `message_received`: gelen içeriği, göndereni, `threadId`,
  `messageId`, `senderId`, isteğe bağlı çalıştırma/oturum korelasyonunu
  ve meta verileri gözlemler.
- `message_sending`: `content` öğesini yeniden yazar veya
  `{ cancel: true }` döndürür.
- `reply_payload_sending`: normalleştirilmiş `ReplyPayload` nesnelerini
  (`presentation`, `delivery`, medya başvuruları ve metin dâhil) yeniden yazar
  veya `{ cancel: true }` döndürür.
- `message_sent`: nihai başarıyı veya başarısızlığı gözlemler.

Yalnızca ses içeren TTS yanıtlarında, kanal yükünde görünür metin/açıklama bulunmasa bile
`content` gizli seslendirilmiş dökümü içerebilir.
Bu `content` öğesinin yeniden yazılması yalnızca kancada görünen dökümü günceller;
medya açıklaması olarak oluşturulmaz.

`reply_payload_sending` olayları, en iyi çabayla oluşturulan canlı tur başına model/kullanım/bağlam
anlık görüntüsü olan `usageState` öğesini içerebilir. Kalıcı teslimat, kurtarılan
yeniden oynatma ve kesin çalıştırma korelasyonu olmayan yanıtlar bunu içermez.

Mesaj kancası bağlamları, kullanılabilir olduğunda şu kararlı korelasyon alanlarını sunar:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`,
`ctx.trace`, `ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` ve
`ctx.callDepth`. Gelen ve `before_dispatch` bağlamları, kanalın görünürlük filtresi
uygulanmış alıntılanan mesaj verileri olduğunda yanıt meta verilerini de sunar:
`replyToId`, `replyToIdFull`, `replyToBody`, `replyToSender` ve
`replyToIsQuote`. Eski meta verileri okumadan önce bu birinci sınıf alanları tercih edin.

Kanala özgü meta verileri kullanmadan önce türü belirlenmiş `threadId` ve
`replyToId` alanlarını tercih edin.

Karar kuralları:

- `message_sending`, `cancel: true` ile terminaldir.
- `message_sending`, `cancel: false` ile karar yokmuş gibi değerlendirilir.
- Yeniden yazılan `content`, sonraki bir kanca teslimatı iptal etmediği
  sürece daha düşük öncelikli kancalara devam eder.
- `reply_payload_sending`, yük normalleştirmesinden sonra ve kaynak kanala geri
  yönlendirilen yanıtlar dâhil olmak üzere kanal teslimatından önce çalışır.
  İşleyiciler sıralı çalışır ve her işleyici, daha yüksek öncelikli işleyicilerin ürettiği
  en güncel yükü görür.
- `reply_payload_sending` yükleri, `trustedLocalMedia` gibi çalışma zamanı güven
  işaretlerini sunmaz; plugin'ler yük biçimini düzenleyebilir ancak yerel medya güveni veremez.
- `message_sending`, iptalle birlikte `cancelReason` ve sınırlı
  `metadata` döndürebilir. Yeni mesaj yaşam döngüsü API'leri bunu
  `cancelled_by_message_sending_hook` nedenli engellenmiş teslimat sonucu olarak sunar; eski doğrudan teslimat,
  uyumluluk için boş bir sonuç dizisi döndürmeye devam eder.
- `message_sent` yalnızca gözlem içindir. İşleyici hataları günlüğe
  kaydedilir ve teslimat sonucunu değiştirmez.

## Kurulum kancaları

Operatöre ait izin verme/engelleme kararları için `security.installPolicy` kullanın. Bu politika,
OpenClaw yapılandırmasından çalışır, CLI kurulum ve güncelleme yollarını kapsar ve
etkinleştirilmiş ancak kullanılamaz olduğunda kapalı biçimde başarısız olur.

`before_install` bir plugin çalışma zamanı yaşam döngüsü kancasıdır. Yalnızca plugin
kancalarının zaten yüklendiği OpenClaw işleminde, örneğin Gateway destekli kurulum akışlarında,
`security.installPolicy` sonrasında çalışır. Plugin'e ait gözlemler, uyarılar ve uyumluluk
denetimleri için kullanışlıdır ancak kurulumlarda birincil kurumsal veya ana makine güvenlik
sınırı değildir. `builtinScan` alanı uyumluluk için olay yükünde kalır ancak OpenClaw
artık kurulum zamanında yerleşik tehlikeli kod engellemesi çalıştırmadığından boş bir
`ok` sonucudur. Bu işlemde kurulumu durdurmak için ek bulgular veya
`{ block: true, blockReason }` döndürün.

`block: true` terminaldir. `block: false` karar yokmuş gibi değerlendirilir.
İşleyici hataları kurulumu kapalı biçimde başarısız olacak şekilde engeller.

## Gateway yaşam döngüsü

Genel plugin hizmetlerini başlatmak için `gateway_start`, uzun süre çalışan kaynakları
temizlemek için `gateway_stop` kullanın. `gateway_start` çalışırken cron zamanlayıcısı
hâlâ yükleniyor olabilir; bu nedenle onu harici bir cron yansıtması için temel sinyal olarak
kullanmayın.

Plugin'e ait çalışma zamanı hizmetleri için dahili `gateway:startup` kancasına güvenmeyin.

`cron_reconciled`, Gateway cron zamanlayıcısı ve çıkış sırasındaki izleyicileri kalıcı
durumlarını uzlaştırdıktan sonra tetiklenir. Hem ilk başlangıçta hem de yapılandırma yeniden
yüklemesi sırasında zamanlayıcı değiştirildiğinde tetiklenir. Olay, `reason`
(`startup` veya `reload`) ve etkin `enabled` durumunu bildirir.
Devre dışı bırakılan cron yine de `enabled: false` ile olay yayar ve harici bir yansıtmanın
eski uyandırmaları temizlemesine olanak tanır. Uzlaştırmayı tamamlayan tam zamanlayıcı örneği
için `ctx.getCron?.()` kullanın; sonraki bir yeniden yükleme bu geri çağrıyı başka hedefe
yönlendirmez. `ctx.abortSignal` aynı zamanlayıcı anlık görüntüsüne sahiptir. Gateway, daha
yeni bir zamanlayıcı devreye alınır alınmaz veya kapatma başladığında bunu iptal eder. Bunu
her kalıcı yan etkiye iletin ve iptal edildikten sonra anlık görüntüyü kabul etmeyin.
Bu, plugin etkinleştirme sinyali değil, zamanlayıcı yaşam döngüsü sinyalidir: yalnızca plugin'i
etkileyen bir çalışırken yeniden yükleme bunu yeniden oynatmaz. Yeni etkinleştirilen bir
tüketici, ilk temel durumunu sonraki zamanlayıcı değişiminde veya Gateway başlangıcında alır.

Diğer gözlem kancaları gibi, `gateway_start` ve `cron_reconciled` geri çağrıları
çakışabilir. Her iki işleyici de plugin başlatmasını paylaşıyorsa geri çağrı sırasına
bağlı kalmak yerine bunları plugin'e özgü bir hazır olma promise'iyle koordine edin.

`cron_changed`, `added`, `updated`, `removed`, `started`, `finished`
ve `scheduled` nedenlerini kapsayan türü belirlenmiş bir olay yüküyle Gateway tarafından yönetilen Cron yaşam döngüsü olaylarında tetiklenir. Olay, bir `PluginHookGatewayCronJob`
anlık görüntüsünün (mevcut olduklarında `state.nextRunAtMs`, `state.lastRunStatus` ve
`state.lastError` dâhil) yanı sıra `not-requested` | `delivered` | `not-delivered` | `unknown`
değerlerinden oluşan bir `PluginHookGatewayCronDeliveryStatus` taşır. Kaldırma olayları
işlem sonrasıdır: yalnızca kalıcı silme başarılı olduktan sonra tetiklenir ve
harici zamanlayıcıların durumu uzlaştırabilmesi için silinen iş anlık görüntüsünü taşımaya devam eder.

Bir `scheduled` olayı işlem sonrasıdır: yalnızca başarılı bir kalıcı
yazma, mevcut bir işin etkin `nextRunAtMs` değerini değiştirdikten sonra tetiklenir; bu işin
açık `added`, `updated` veya `removed` yaşam döngüsü olayı buna dâhil değildir. Üst düzey
`event.nextRunAtMs`, kaydedilmiş bir sonraki uyanma zamanıdır; mevcut değilse işin
bir sonraki uyanma zamanı yoktur. Bu olayları sıralı bir değişiklik
günlüğü olarak değil, uzlaştırma ipuçları olarak değerlendirin. Bunları, `cron_reconciled` tarafından
en son yakalanan zamanlayıcıyı yeniden okumaya yönelik birleştirilebilir ipuçları olarak kullanın; zamanlayıcıyı bir `cron_changed` bağlamından
devralmayın. Zamanı gelen görevlerin denetlenmesi ve yürütülmesi için doğruluk kaynağı olarak OpenClaw'ı
koruyun.

### Güvenli harici Cron yansıtması

Cron olay değişikliklerini iletmek yerine eksiksiz bir uyanma anlık görüntüsünü yansıtın.
Harici bağdaştırıcının `replaceAll` işlemi atomik ve eş etkili olmalı ve yalnızca
ana makine anlık görüntüyü kalıcı olarak kabul ettikten sonra sonuçlanmalıdır. Ayrıca
sağlanan iptal sinyaline uymalıdır: sinyal kalıcı kabulden önce iptal edilirse
bağdaştırıcı bu anlık görüntüyü kabul etmemelidir.

Bu düzen, aynı anda yalnızca bir güncel durum çalışanının yürütülmesini sağlar. Yalnızca `cron_reconciled`
bir zamanlayıcı örneğini devralır; `cron_changed` ise yalnızca bu çalışandan
yetkili örneği yeniden okumasını ister; böylece geç gelen bir ipucu eski bir zamanlayıcıyı geri yükleyemez.
Daha yeni bir revizyon, etkin ana makine denemesini eski bir anlık görüntüyü kabul edemeden
iptal eder.

```typescript
import { setTimeout as sleep } from "node:timers/promises";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";

type ExternalWake = { jobId: string; runAtMs: number };

type ExternalWakeHost = {
  replaceAll(wakes: readonly ExternalWake[], options: { signal: AbortSignal }): Promise<void>;
  close(): Promise<void>;
};

type CronReader = {
  list(options: { includeDisabled: true }): Promise<
    Array<{
      id: string;
      enabled?: boolean;
      state?: { nextRunAtMs?: number };
    }>
  >;
};

export function registerCronProjection(api: OpenClawPluginApi, host: ExternalWakeHost) {
  const lifecycle = new AbortController();
  let cron: CronReader | undefined;
  let enabled = false;
  let hasBaseline = false;
  let reconciliationSignal: AbortSignal | undefined;
  let requestedRevision = 0;
  let appliedRevision = 0;
  let worker = Promise.resolve();
  let activeAttempt: AbortController | undefined;

  const projectLatest = async () => {
    let retryMs = 1_000;

    while (!lifecycle.signal.aborted && appliedRevision < requestedRevision) {
      const ownerSignal = reconciliationSignal;
      if (!ownerSignal || ownerSignal.aborted) {
        return;
      }
      const targetRevision = requestedRevision;
      const attempt = new AbortController();
      const signal = AbortSignal.any([lifecycle.signal, ownerSignal, attempt.signal]);
      activeAttempt = attempt;

      try {
        const jobs = enabled && cron ? await cron.list({ includeDisabled: true }) : [];
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        const wakes = jobs
          .flatMap((job): ExternalWake[] => {
            const runAtMs = job.enabled === false ? undefined : job.state?.nextRunAtMs;
            return runAtMs === undefined ? [] : [{ jobId: job.id, runAtMs }];
          })
          .sort((a, b) => a.runAtMs - b.runAtMs || a.jobId.localeCompare(b.jobId));

        await host.replaceAll(wakes, { signal });
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        appliedRevision = targetRevision;
        retryMs = 1_000;
      } catch {
        if (lifecycle.signal.aborted || ownerSignal.aborted) {
          return;
        }
        if (attempt.signal.aborted) {
          continue;
        }
        api.logger.warn(`external cron projection failed; retrying in ${retryMs}ms`);
        try {
          await sleep(retryMs, undefined, { signal });
        } catch {
          if (lifecycle.signal.aborted) {
            return;
          }
          if (attempt.signal.aborted) {
            continue;
          }
        }
        retryMs = Math.min(retryMs * 2, 30_000);
      } finally {
        if (activeAttempt === attempt) {
          activeAttempt = undefined;
        }
      }
    }
  };

  const requestProjection = () => {
    const targetRevision = ++requestedRevision;
    activeAttempt?.abort();
    worker = worker.then(async () => {
      if (!lifecycle.signal.aborted && appliedRevision < targetRevision) {
        await projectLatest();
      }
    });
    return worker;
  };

  api.on("cron_reconciled", (event, ctx) => {
    const reconciledCron = ctx.getCron?.();
    if (event.enabled && !reconciledCron) {
      api.logger.warn("cron reconciliation did not expose a scheduler");
      return;
    }
    cron = reconciledCron;
    enabled = event.enabled;
    hasBaseline = true;
    reconciliationSignal = ctx.abortSignal;
    return requestProjection();
  });

  api.on("cron_changed", () => {
    if (hasBaseline) {
      return requestProjection();
    }
  });

  api.on("gateway_stop", async () => {
    lifecycle.abort();
    await worker;
    await host.close();
  });
}
```

`cron_reconciled`, `enabled: false` bildirdiğinde aynı yol
`replaceAll([])` çağrısını yapar ve eski harici uyanmaları temizler. Bu örnekteki
yeniden deneme/geri çekilme, işlem yereldir ve çalışma zamanı bağdaştırıcısı hatalarını geçici kabul eder; yeniden
denenemeyen yapılandırmayı kayıttan önce doğrulayın. OpenClaw, Plugin kanca etkileri için bir
giden kutusu sağlamaz. İşlem kalıcı kabulden önce sonlanırsa
bir sonraki Gateway başlangıcı, yeni bir yetkili `cron_reconciled` anlık görüntüsü yayımlar.
`gateway_stop`, devam eden ana makine çalışmalarını iptal eder, çalışanın tamamlanmasını bekler ve ardından
bağdaştırıcıyı kapatır.

## Yaklaşan kullanımdan kaldırmalar

Kancalarla ilişkili birkaç yüzey kullanımdan kaldırılmıştır ancak hâlâ desteklenmektedir.
Bir sonraki ana sürümden önce geçiş yapın:

- **Düz metin kanal zarfları**, `inbound_claim` ve `message_received`
  işleyicilerinde. Düz zarf metnini ayrıştırmak yerine `BodyForAgent` ve yapılandırılmış kullanıcı bağlamı bloklarını
  okuyun. Bkz.
  [Düz metin kanal zarfları → BodyForAgent](/tr/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`**, uyumluluk amacıyla korunmaktadır. Yeni Plugin'ler birleşik
  aşama yerine `before_model_resolve` ve `before_prompt_build` kullanmalıdır.
- **`subagent_spawning`**, eski Plugin'lerle uyumluluk amacıyla korunmaktadır ancak
  yeni Plugin'ler buradan ileti dizisi yönlendirmesi döndürmemelidir. Çekirdek,
  `subagent_spawned` tetiklenmeden önce kanal oturum bağlama bağdaştırıcıları aracılığıyla
  `thread: true` alt ajan bağlamalarını hazırlar.
- **`deactivate`**, 2026-08-16 sonrasına kadar kullanımdan kaldırılmış bir temizleme uyumluluğu diğer adı olarak
  korunmaktadır. Yeni Plugin'ler `gateway_stop` kullanmalıdır.
- **`before_tool_call` içindeki `onResolution`**, artık serbest biçimli bir `string` yerine türü belirlenmiş
  `PluginApprovalResolution` birleşimini (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) kullanır.
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`**, üst düzey uyumluluk diğer adları
  olarak korunmaktadır. Yeni Plugin'ler
  `api.session.state.registerSessionExtension(...)` ve
  `api.session.workflow.enqueueNextTurnInjection(...)` kullanmalıdır.

Tam liste — bellek yeteneği kaydı, sağlayıcı düşünme
profili, harici kimlik doğrulama sağlayıcıları, sağlayıcı keşif türleri, görev çalışma zamanı
erişimcileri ve `command-auth` → `command-status` yeniden adlandırması — için bkz.
[Plugin SDK geçişi → Etkin kullanımdan kaldırmalar](/tr/plugins/sdk-migration#active-deprecations).

## İlgili

- [Plugin SDK geçişi](/tr/plugins/sdk-migration) - etkin kullanımdan kaldırmalar ve kaldırma zaman çizelgesi
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin SDK'ya genel bakış](/tr/plugins/sdk-overview)
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints)
- [Dâhilî kancalar](/tr/automation/hooks)
- [Plugin mimarisi iç işleyişi](/tr/plugins/architecture-internals)
