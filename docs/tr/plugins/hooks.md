---
read_when:
    - before_tool_call, before_agent_reply, mesaj kancaları veya yaşam döngüsü kancaları gerektiren bir Plugin oluşturuyorsunuz
    - Bir Plugin tarafından yapılan araç çağrılarını engellemeniz, yeniden yazmanız veya onay gerektirmeniz gerekir.
    - Dahili kancalar ile Plugin kancaları arasında karar veriyorsunuz
summary: 'Plugin kancaları: ajan, araç, mesaj, oturum ve Gateway yaşam döngüsü olaylarını yakalar'
title: Plugin kancaları
x-i18n:
    generated_at: "2026-05-06T17:59:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3741b95bcccdff4e24b4c1f05de54649b48a6c0a2ca1dc4376475eb1823ae185
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin hook’ları, OpenClaw Plugin’leri için süreç içi extension noktalarıdır. Bir Plugin’in agent çalıştırmalarını, araç çağrılarını, mesaj akışını, oturum yaşam döngüsünü, subagent yönlendirmesini, kurulumları veya Gateway başlatmasını incelemesi ya da değiştirmesi gerektiğinde bunları kullanın.

`/new`, `/reset`, `/stop`, `agent:bootstrap` veya `gateway:startup` gibi komut ve Gateway olayları için operatör tarafından kurulmuş küçük bir `HOOK.md` betiği istediğinizde bunun yerine [internal hooks](/tr/automation/hooks) kullanın.

## Hızlı başlangıç

Plugin girişinizden `api.on(...)` ile tipli Plugin hook’ları kaydedin:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Hook işleyicileri azalan `priority` sırasıyla ardışık çalışır. Aynı önceliğe sahip hook’lar kayıt sırasını korur.

`api.on(name, handler, opts?)` şunları kabul eder:

- `priority` - işleyici sıralaması (yüksek olan önce çalışır).
- `timeoutMs` - isteğe bağlı hook başına bütçe. Ayarlandığında, hook çalıştırıcısı bütçe dolduktan sonra o işleyiciyi iptal eder ve yavaş kurulum ya da recall çalışmasının çağıranın yapılandırılmış model zaman aşımını tüketmesine izin vermek yerine bir sonrakine devam eder. Hook çalıştırıcısının genel olarak uyguladığı varsayılan gözlem/karar zaman aşımını kullanmak için bunu atlayın.

Operatörler, Plugin kodunu yamamadan da hook bütçeleri ayarlayabilir:

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

`hooks.timeouts.<hookName>`, `hooks.timeoutMs` değerini geçersiz kılar; o da Plugin yazarlı `api.on(..., { timeoutMs })` değerini geçersiz kılar. Yapılandırılan her değer, 600000 milisaniyeden büyük olmayan pozitif bir tam sayı olmalıdır. Bilinen yavaş hook’lar için hook başına geçersiz kılmaları tercih edin; böylece tek bir Plugin her yerde daha uzun bütçe almaz.

Her hook, o işleyiciyi kaydeden Plugin için çözümlenmiş yapılandırma olan `event.context.pluginConfig` değerini alır. Mevcut Plugin seçeneklerine ihtiyaç duyan hook kararları için bunu kullanın; OpenClaw bunu, diğer Plugin’lerin gördüğü paylaşılan olay nesnesini mutasyona uğratmadan işleyici başına enjekte eder.

## Hook kataloğu

Hook’lar genişlettikleri yüzeye göre gruplandırılır. **Kalın** adlar bir karar sonucu (engelle, iptal et, geçersiz kıl veya onay iste) kabul eder; diğerlerinin tümü yalnızca gözlem amaçlıdır.

**Agent dönüşü**

- `before_model_resolve` - oturum mesajları yüklenmeden önce sağlayıcıyı veya modeli geçersiz kıl
- `agent_turn_prepare` - kuyruğa alınmış Plugin dönüş enjeksiyonlarını tüket ve prompt hook’larından önce aynı dönüş bağlamı ekle
- `before_prompt_build` - model çağrısından önce dinamik bağlam veya sistem prompt metni ekle
- `before_agent_start` - yalnızca uyumluluk için birleşik aşama; yukarıdaki iki hook’u tercih edin
- **`before_agent_run`** - model gönderiminden önce son prompt’u ve oturum mesajlarını incele ve isteğe bağlı olarak çalıştırmayı engelle
- **`before_agent_reply`** - model dönüşünü sentetik bir yanıtla veya sessizlikle kısa devre et
- **`before_agent_finalize`** - doğal son yanıtı incele ve bir model geçişi daha iste
- `agent_end` - son mesajları, başarı durumunu ve çalıştırma süresini gözlemle
- `heartbeat_prompt_contribution` - arka plan izleyicisi ve yaşam döngüsü Plugin’leri için yalnızca Heartbeat bağlamı ekle

**Konuşma gözlemi**

- `model_call_started` / `model_call_ended` - prompt veya yanıt içeriği olmadan sanitize edilmiş sağlayıcı/model çağrı meta verilerini, zamanlamayı, sonucu ve sınırlı istek kimliği karmalarını gözlemle
- `llm_input` - sağlayıcı girdisini gözlemle (sistem prompt’u, prompt, geçmiş)
- `llm_output` - sağlayıcı çıktısını gözlemle

**Araçlar**

- **`before_tool_call`** - araç parametrelerini yeniden yaz, yürütmeyi engelle veya onay iste
- `after_tool_call` - araç sonuçlarını, hataları ve süreyi gözlemle
- **`tool_result_persist`** - bir araç sonucundan üretilen assistant mesajını yeniden yaz
- **`before_message_write`** - devam eden bir mesaj yazımını incele veya engelle (nadiren)

**Mesajlar ve teslim**

- **`inbound_claim`** - agent yönlendirmesinden önce gelen bir mesajı sahiplen (sentetik yanıtlar)
- `message_received` - gelen içeriği, göndereni, thread’i ve meta verileri gözlemle
- **`message_sending`** - giden içeriği yeniden yaz veya teslimi iptal et
- `message_sent` - giden teslim başarısını veya başarısızlığını gözlemle
- **`before_dispatch`** - kanal devrinden önce giden bir dispatch’i incele veya yeniden yaz
- **`reply_dispatch`** - son yanıt dispatch pipeline’ına katıl

**Oturumlar ve Compaction**

- `session_start` / `session_end` - oturum yaşam döngüsü sınırlarını izle
- `before_compaction` / `after_compaction` - Compaction döngülerini gözlemle veya açıklama ekle
- `before_reset` - oturum sıfırlama olaylarını gözlemle (`/reset`, programatik sıfırlamalar)

**Subagent’lar**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - subagent yönlendirmesini ve tamamlama teslimini koordine et

**Yaşam döngüsü**

- `gateway_start` / `gateway_stop` - Plugin’e ait servisleri Gateway ile başlat veya durdur
- `cron_changed` - Gateway’e ait cron yaşam döngüsü değişikliklerini gözlemle (eklendi, güncellendi, kaldırıldı, başlatıldı, tamamlandı, zamanlandı)
- **`before_install`** - skill veya Plugin kurulum taramalarını incele ve isteğe bağlı olarak engelle

## Araç çağrısı ilkesi

`before_tool_call` şunları alır:

- `event.toolName`
- `event.params`
- isteğe bağlı `event.runId`
- isteğe bağlı `event.toolCallId`
- `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`, `ctx.runId`, `ctx.jobId` (cron güdümlü çalıştırmalarda ayarlanır) ve tanılama `ctx.trace` gibi bağlam alanları

Şunu döndürebilir:

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
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Kurallar:

- `block: true` terminaldir ve daha düşük öncelikli işleyicileri atlar.
- `block: false` karar yok olarak değerlendirilir.
- `params`, yürütme için araç parametrelerini yeniden yazar.
- `requireApproval`, agent çalıştırmasını duraklatır ve Plugin onayları üzerinden kullanıcıya sorar. `/approve` komutu hem exec hem de Plugin onaylarını onaylayabilir.
- Daha düşük öncelikli bir `block: true`, daha yüksek öncelikli bir hook onay istemiş olsa bile hâlâ engelleyebilir.
- `onResolution`, çözümlenen onay kararını alır: `allow-once`, `allow-always`, `deny`, `timeout` veya `cancelled`.

Host düzeyi ilkeye ihtiyaç duyan paketli Plugin’ler, `api.registerTrustedToolPolicy(...)` ile güvenilir araç ilkeleri kaydedebilir. Bunlar sıradan `before_tool_call` hook’larından ve harici Plugin kararlarından önce çalışır. Bunları yalnızca çalışma alanı ilkesi, bütçe zorlaması veya ayrılmış workflow güvenliği gibi host tarafından güvenilen geçitler için kullanın. Harici Plugin’ler normal `before_tool_call` hook’larını kullanmalıdır.

### Araç sonucu kalıcılığı

Araç sonuçları UI rendering, tanılama, medya yönlendirme veya Plugin’e ait meta veriler için yapılandırılmış `details` içerebilir. `details` değerini prompt içeriği olarak değil, çalışma zamanı meta verisi olarak ele alın:

- OpenClaw, meta verilerin model bağlamına dönüşmemesi için sağlayıcı replay’i ve Compaction girdisinden önce `toolResult.details` değerini çıkarır.
- Kalıcı oturum girdileri yalnızca sınırlı `details` tutar. Aşırı büyük details, kompakt bir özet ve `persistedDetailsTruncated: true` ile değiştirilir.
- `tool_result_persist` ve `before_message_write`, son kalıcılık sınırından önce çalışır. Hook’lar yine de döndürülen `details` değerlerini küçük tutmalı ve prompt ile ilgili metni yalnızca `details` içine koymaktan kaçınmalıdır; modelin görebileceği araç çıktısını `content` içine koyun.

## Prompt ve model hook’ları

Yeni Plugin’ler için aşamaya özgü hook’ları kullanın:

- `before_model_resolve`: yalnızca mevcut prompt’u ve ek meta verilerini alır. `providerOverride` veya `modelOverride` döndürün.
- `agent_turn_prepare`: mevcut prompt’u, hazırlanmış oturum mesajlarını ve bu oturum için boşaltılmış tam olarak bir kez kuyruğa alınmış enjeksiyonları alır. `prependContext` veya `appendContext` döndürün.
- `before_prompt_build`: mevcut prompt’u ve oturum mesajlarını alır. `prependContext`, `appendContext`, `systemPrompt`, `prependSystemContext` veya `appendSystemContext` döndürün.
- `heartbeat_prompt_contribution`: yalnızca Heartbeat dönüşleri için çalışır ve `prependContext` veya `appendContext` döndürür. Kullanıcı tarafından başlatılan dönüşleri değiştirmeden mevcut durumu özetlemesi gereken arka plan izleyicileri için tasarlanmıştır.

`before_agent_start` uyumluluk için kalır. Plugin’inizin eski birleşik aşamaya bağlı olmaması için yukarıdaki açık hook’ları tercih edin.

`before_agent_run`, prompt oluşturulduktan sonra ve prompt’a yerel görüntü yükleme ile `llm_input` gözlemi dahil herhangi bir model girdisinden önce çalışır. Mevcut kullanıcı girdisini `prompt` olarak, yüklenmiş oturum geçmişini `messages` içinde ve etkin sistem prompt’unu alır. Model prompt’u okuyamadan çalıştırmayı durdurmak için `{ outcome: "block", reason, message? }` döndürün. `reason` iç kullanıma yöneliktir; `message` kullanıcıya gösterilen yerine geçen metindir. Desteklenen tek sonuçlar `pass` ve `block` değerleridir; desteklenmeyen karar biçimleri kapalı hata verir.

Bir çalıştırma engellendiğinde OpenClaw yalnızca yerine geçen metni `message.content` içinde ve engelleyen Plugin kimliği ile zaman damgası gibi hassas olmayan engelleme meta verilerini saklar. Özgün kullanıcı metni transcript’te veya gelecekteki bağlamda tutulmaz. İç engelleme nedenleri hassas kabul edilir ve transcript, geçmiş, yayın, günlük ve tanılama payload’larından çıkarılır. Gözlemlenebilirlik, engelleyen kimliği, sonuç, zaman damgası veya güvenli bir kategori gibi sanitize edilmiş alanları kullanmalıdır.

OpenClaw etkin çalıştırmayı tanımlayabildiğinde `before_agent_start` ve `agent_end`, `event.runId` içerir. Aynı değer `ctx.runId` üzerinde de kullanılabilir. Cron güdümlü çalıştırmalar ayrıca `ctx.jobId` (kaynak cron işi kimliği) sunar; böylece Plugin hook’ları metrikleri, yan etkileri veya durumu belirli bir zamanlanmış işe göre kapsamlandırabilir.

Kanal kaynaklı çalıştırmalar için `ctx.messageProvider`, `discord` veya `telegram` gibi sağlayıcı yüzeyidir; `ctx.channelId` ise OpenClaw’ın oturum anahtarından veya teslim meta verilerinden türetebildiğinde konuşma hedefi tanımlayıcısıdır.

`agent_end` bir gözlem hook’udur ve dönüşten sonra fire-and-forget çalışır. Hook çalıştırıcısı 30 saniyelik zaman aşımı uygular; böylece takılmış bir Plugin veya embedding endpoint’i hook promise’ını sonsuza kadar beklemede bırakamaz. Zaman aşımı günlüğe yazılır ve OpenClaw devam eder; Plugin ayrıca kendi abort sinyalini kullanmıyorsa Plugin’e ait ağ işini iptal etmez.

Ham prompt’ları, geçmişi, yanıtları, başlıkları, istek gövdelerini veya sağlayıcı istek kimliklerini almaması gereken sağlayıcı çağrısı telemetrisi için `model_call_started` ve `model_call_ended` kullanın. Bu hook’lar `runId`, `callId`, `provider`, `model`, isteğe bağlı `api`/`transport`, terminal `durationMs`/`outcome` ve OpenClaw sınırlı bir sağlayıcı istek kimliği karması türetebildiğinde `upstreamRequestIdHash` gibi kararlı meta veriler içerir.

`before_agent_finalize` yalnızca bir harness doğal son assistant yanıtını kabul etmek üzereyken çalışır. Bu, `/stop` iptal yolu değildir ve kullanıcı bir dönüşü iptal ettiğinde çalışmaz. Sonlandırmadan önce harness’ten bir model geçişi daha istemek için `{ action: "revise", reason }`, sonlandırmayı zorlamak için `{ action: "finalize", reason? }` döndürün veya devam etmek için sonuç döndürmeyin. Codex native `Stop` hook’ları bu hook’a OpenClaw `before_agent_finalize` kararları olarak aktarılır.

Plugin’ler `action: "revise"` döndürürken ek model geçişini sınırlı ve replay açısından güvenli hale getirmek için `retry` meta verileri ekleyebilir:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction`, donanıma gönderilen revizyon gerekçesine eklenir.
`idempotencyKey`, ana makinenin eşdeğer finalize kararları genelinde aynı Plugin isteği için yeniden denemeleri saymasına olanak tanır; `maxAttempts` ise ana makinenin doğal nihai yanıtla devam etmeden önce izin vereceği ek geçiş sayısını sınırlar.

Ham konuşma kancalarına (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end` veya `before_agent_run`) ihtiyaç duyan paketlenmemiş Plugin'ler şunu ayarlamalıdır:

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

İstemi değiştiren kancalar ve kalıcı sonraki tur enjeksiyonları, Plugin başına
`plugins.entries.<id>.hooks.allowPromptInjection=false` ile devre dışı bırakılabilir.

### Oturum uzantıları ve sonraki tur enjeksiyonları

İş akışı Plugin'leri, `api.registerSessionExtension(...)` ile küçük JSON uyumlu oturum durumunu kalıcı hale getirebilir ve bunu Gateway `sessions.pluginPatch` yöntemi üzerinden güncelleyebilir. Oturum satırları kayıtlı uzantı durumunu `pluginExtensions` üzerinden yansıtır; böylece Control UI ve diğer istemciler, Plugin iç ayrıntılarını öğrenmeden Plugin'in sahip olduğu durumu işleyebilir.

Bir Plugin'in kalıcı bağlamı bir sonraki model turuna tam olarak bir kez ulaştırması gerektiğinde `api.enqueueNextTurnInjection(...)` kullanın. OpenClaw, kuyruğa alınmış enjeksiyonları istem kancalarından önce boşaltır, süresi dolmuş enjeksiyonları atar ve Plugin başına `idempotencyKey` ile tekilleştirir. Bu, onay sürdürmeleri, ilke özetleri, arka plan izleyici deltaları ve bir sonraki turda model tarafından görülmesi gereken ancak kalıcı sistem istemi metnine dönüşmemesi gereken komut devamları için doğru bağlantı noktasıdır.

Temizleme semantiği sözleşmenin parçasıdır. Oturum uzantısı temizleme ve çalışma zamanı yaşam döngüsü temizleme geri çağrıları `reset`, `delete`, `disable` veya `restart` alır. Ana makine, reset/delete/disable için sahibi olan Plugin'in kalıcı oturum uzantısı durumunu ve bekleyen sonraki tur enjeksiyonlarını kaldırır; restart, kalıcı oturum durumunu korurken temizleme geri çağrıları Plugin'lerin eski çalışma zamanı nesli için zamanlayıcı işlerini, çalışma bağlamını ve diğer bant dışı kaynakları serbest bırakmasına olanak tanır.

## İleti kancaları

Kanal düzeyi yönlendirme ve teslim politikası için ileti kancalarını kullanın:

- `message_received`: gelen içeriği, göndereni, `threadId`, `messageId`,
  `senderId`, isteğe bağlı çalışma/oturum korelasyonunu ve meta verileri gözlemler.
- `message_sending`: `content` değerini yeniden yazar veya `{ cancel: true }` döndürür.
- `message_sent`: nihai başarıyı veya hatayı gözlemler.

Yalnızca sesli TTS yanıtlarında, kanal yükünde görünür metin/açıklama olmasa bile `content` gizli konuşulan dökümü içerebilir. Bu `content` değerinin yeniden yazılması yalnızca kanca tarafından görülebilen dökümü günceller; medya açıklaması olarak işlenmez.

İleti kancası bağlamları, mevcut olduğunda kararlı korelasyon alanlarını sunar:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` ve `ctx.callDepth`. Eski meta verileri okumadan önce bu birinci sınıf alanları tercih edin.

Kanala özgü meta verileri kullanmadan önce tipli `threadId` ve `replyToId` alanlarını tercih edin.

Karar kuralları:

- `cancel: true` içeren `message_sending` sonlandırıcıdır.
- `cancel: false` içeren `message_sending` karar yok olarak değerlendirilir.
- Yeniden yazılan `content`, daha sonraki bir kanca teslimi iptal etmedikçe daha düşük öncelikli kancalara devam eder.

## Kurulum kancaları

`before_install`, Skills ve Plugin kurulumları için yerleşik taramadan sonra çalışır.
Ek bulgular veya kurulumu durdurmak için `{ block: true, blockReason }` döndürün.

`block: true` sonlandırıcıdır. `block: false` karar yok olarak değerlendirilir.

## Gateway yaşam döngüsü

Gateway'in sahip olduğu duruma ihtiyaç duyan Plugin hizmetleri için `gateway_start` kullanın. Bağlam, Cron incelemesi ve güncellemeleri için `ctx.config`, `ctx.workspaceDir` ve `ctx.getCron?.()` sunar. Uzun süre çalışan kaynakları temizlemek için `gateway_stop` kullanın.

Plugin'e ait çalışma zamanı hizmetleri için dahili `gateway:startup` kancasına güvenmeyin.

`cron_changed`, Gateway'e ait Cron yaşam döngüsü olayları için `added`, `updated`, `removed`, `started`, `finished` ve `scheduled` gerekçelerini kapsayan tipli bir olay yüküyle tetiklenir. Olay, bir `PluginHookGatewayCronJob` anlık görüntüsü (`state.nextRunAtMs`, `state.lastRunStatus` ve varsa `state.lastError` dahil) ve `not-requested` | `delivered` | `not-delivered` | `unknown` değerlerinden oluşan bir `PluginHookGatewayCronDeliveryStatus` taşır. Kaldırılan olaylar da silinen iş anlık görüntüsünü taşır; böylece harici zamanlayıcılar durumu uzlaştırabilir. Harici uyandırma zamanlayıcılarını eşitlerken çalışma zamanı bağlamından `ctx.getCron?.()` ve `ctx.config` kullanın; vade denetimleri ve yürütme için OpenClaw'ı doğruluk kaynağı olarak tutun.

## Yaklaşan kullanımdan kaldırmalar

Kanca bitişiğindeki bazı yüzeyler kullanımdan kaldırıldı ancak hâlâ destekleniyor. Bir sonraki büyük sürümden önce geçiş yapın:

- `inbound_claim` ve `message_received` işleyicilerindeki **düz metin kanal zarfları**. Düz zarf metnini ayrıştırmak yerine `BodyForAgent` ve yapılandırılmış kullanıcı bağlamı bloklarını okuyun. Bkz.
  [Düz metin kanal zarfları → BodyForAgent](/tr/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** uyumluluk için kalır. Yeni Plugin'ler birleşik faz yerine `before_model_resolve` ve `before_prompt_build` kullanmalıdır.
- **`before_tool_call` içindeki `onResolution`** artık serbest biçimli bir `string` yerine tipli `PluginApprovalResolution` birleşimini (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) kullanır.

Tam liste için - bellek yeteneği kaydı, sağlayıcı düşünme profili, harici kimlik doğrulama sağlayıcıları, sağlayıcı keşif tipleri, görev çalışma zamanı erişimcileri ve `command-auth` → `command-status` yeniden adlandırması - bkz.
[Plugin SDK geçişi → Etkin kullanımdan kaldırmalar](/tr/plugins/sdk-migration#active-deprecations).

## İlgili

- [Plugin SDK geçişi](/tr/plugins/sdk-migration) - etkin kullanımdan kaldırmalar ve kaldırma zaman çizelgesi
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints)
- [Dahili kancalar](/tr/automation/hooks)
- [Plugin mimarisi iç ayrıntıları](/tr/plugins/architecture-internals)
