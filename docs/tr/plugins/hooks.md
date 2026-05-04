---
read_when:
    - before_tool_call, before_agent_reply, mesaj kancaları veya yaşam döngüsü kancalarına ihtiyaç duyan bir Plugin oluşturuyorsunuz
    - Bir Plugin'den gelen araç çağrılarını engellemeniz, yeniden yazmanız veya onay gerektirmeniz gerekir.
    - Dahili kancalar ile Plugin kancaları arasında karar veriyorsunuz
summary: 'Plugin kancaları: ajan, araç, mesaj, oturum ve Gateway yaşam döngüsü olaylarını yakalayın'
title: Plugin kancaları
x-i18n:
    generated_at: "2026-05-04T18:23:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37c7273036463c87e478db5678822b676c89447caee65f2f3f47a45194d1e37b
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin hook'ları, OpenClaw Plugin'leri için işlem içi genişletme noktalarıdır. Bir Plugin'in agent çalıştırmalarını, araç çağrılarını, mesaj akışını, oturum yaşam döngüsünü, subagent yönlendirmesini, kurulumları veya Gateway başlatmasını incelemesi ya da değiştirmesi gerektiğinde bunları kullanın.

`/new`, `/reset`, `/stop`, `agent:bootstrap` veya `gateway:startup` gibi komut ve Gateway olayları için operatör tarafından kurulmuş küçük bir `HOOK.md` betiği istediğinizde bunun yerine [iç hook'ları](/tr/automation/hooks) kullanın.

## Hızlı başlangıç

Plugin girişinizden `api.on(...)` ile tipli Plugin hook'ları kaydedin:

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

Hook işleyicileri azalan `priority` sırasıyla ardışık çalışır. Aynı önceliğe sahip hook'lar kayıt sırasını korur.

`api.on(name, handler, opts?)` şunları kabul eder:

- `priority` — işleyici sıralaması (daha yüksek olan önce çalışır).
- `timeoutMs` — hook başına isteğe bağlı bütçe. Ayarlandığında hook çalıştırıcısı, yavaş kurulum veya hatırlama işinin çağıranın yapılandırılmış model zaman aşımını tüketmesine izin vermek yerine, bütçe dolduktan sonra bu işleyiciyi sonlandırır ve sonrakiyle devam eder. Hook çalıştırıcısının genel olarak uyguladığı varsayılan gözlem/karar zaman aşımını kullanmak için bunu atlayın.

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

`hooks.timeouts.<hookName>`, `hooks.timeoutMs` değerini geçersiz kılar; bu da Plugin tarafından yazılmış `api.on(..., { timeoutMs })` değerini geçersiz kılar. Yapılandırılan her değer, 600000 milisaniyeden büyük olmayan pozitif bir tam sayı olmalıdır. Bilinen yavaş hook'lar için hook başına geçersiz kılmaları tercih edin; böylece bir Plugin her yerde daha uzun bütçe almaz.

Her hook, o işleyiciyi kaydeden Plugin için çözümlenmiş yapılandırma olan `event.context.pluginConfig` değerini alır. Geçerli Plugin seçeneklerine ihtiyaç duyan hook kararları için bunu kullanın; OpenClaw bunu, diğer Plugin'lerin gördüğü paylaşılan olay nesnesini değiştirmeden her işleyiciye enjekte eder.

## Hook kataloğu

Hook'lar genişlettikleri yüzeye göre gruplanır. **Kalın** adlar bir karar sonucu kabul eder (engelleme, iptal, geçersiz kılma veya onay isteme); diğer tümü yalnızca gözlem amaçlıdır.

**Agent turu**

- `before_model_resolve` — oturum mesajları yüklenmeden önce sağlayıcıyı veya modeli geçersiz kılar
- `agent_turn_prepare` — kuyruğa alınmış Plugin tur enjeksiyonlarını tüketir ve prompt hook'larından önce aynı tur bağlamı ekler
- `before_prompt_build` — model çağrısından önce dinamik bağlam veya sistem prompt metni ekler
- `before_agent_start` — yalnızca uyumluluk amaçlı birleşik faz; yukarıdaki iki hook'u tercih edin
- **`before_agent_reply`** — model turunu sentetik yanıt veya sessizlik ile kısa devreye alır
- **`before_agent_finalize`** — doğal nihai yanıtı inceler ve bir model geçişi daha ister
- `agent_end` — nihai mesajları, başarı durumunu ve çalıştırma süresini gözlemler
- `heartbeat_prompt_contribution` — arka plan izleyici ve yaşam döngüsü Plugin'leri için yalnızca heartbeat bağlamı ekler

**Konuşma gözlemi**

- `model_call_started` / `model_call_ended` — prompt veya yanıt içeriği olmadan temizlenmiş sağlayıcı/model çağrısı meta verilerini, zamanlamayı, sonucu ve sınırlı istek kimliği karmalarını gözlemler
- `llm_input` — sağlayıcı girdisini gözlemler (sistem prompt'u, prompt, geçmiş)
- `llm_output` — sağlayıcı çıktısını gözlemler

**Araçlar**

- **`before_tool_call`** — araç parametrelerini yeniden yazar, yürütmeyi engeller veya onay ister
- `after_tool_call` — araç sonuçlarını, hataları ve süreyi gözlemler
- **`tool_result_persist`** — bir araç sonucundan üretilen assistant mesajını yeniden yazar
- **`before_message_write`** — devam eden bir mesaj yazımını inceler veya engeller (nadir)

**Mesajlar ve teslimat**

- **`inbound_claim`** — agent yönlendirmesinden önce gelen bir mesajı üstlenir (sentetik yanıtlar)
- `message_received` — gelen içeriği, göndereni, thread'i ve meta verileri gözlemler
- **`message_sending`** — giden içeriği yeniden yazar veya teslimatı iptal eder
- `message_sent` — giden teslimat başarısını veya hatasını gözlemler
- **`before_dispatch`** — kanal devrinden önce giden bir dispatch'i inceler veya yeniden yazar
- **`reply_dispatch`** — nihai yanıt dispatch pipeline'ına katılır

**Oturumlar ve Compaction**

- `session_start` / `session_end` — oturum yaşam döngüsü sınırlarını izler
- `before_compaction` / `after_compaction` — Compaction döngülerini gözlemler veya anotasyon ekler
- `before_reset` — oturum sıfırlama olaylarını gözlemler (`/reset`, programatik sıfırlamalar)

**Subagent'lar**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — subagent yönlendirmesini ve tamamlama teslimatını koordine eder

**Yaşam döngüsü**

- `gateway_start` / `gateway_stop` — Plugin'e ait servisleri Gateway ile başlatır veya durdurur
- `cron_changed` — Gateway'e ait Cron yaşam döngüsü değişikliklerini gözlemler (eklendi, güncellendi, kaldırıldı, başlatıldı, tamamlandı, zamanlandı)
- **`before_install`** — skill veya Plugin kurulum taramalarını inceler ve isteğe bağlı olarak engeller

## Araç çağrısı politikası

`before_tool_call` şunları alır:

- `event.toolName`
- `event.params`
- isteğe bağlı `event.runId`
- isteğe bağlı `event.toolCallId`
- `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`, `ctx.runId`, `ctx.jobId` (Cron tarafından tetiklenen çalıştırmalarda ayarlanır) ve tanılama amaçlı `ctx.trace` gibi bağlam alanları

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
- `block: false` karar yok olarak ele alınır.
- `params`, yürütme için araç parametrelerini yeniden yazar.
- `requireApproval`, agent çalıştırmasını duraklatır ve kullanıcıdan Plugin onayları üzerinden onay ister. `/approve` komutu hem exec hem de Plugin onaylarını onaylayabilir.
- Daha düşük öncelikli bir `block: true`, daha yüksek öncelikli bir hook onay istemiş olsa bile hâlâ engelleyebilir.
- `onResolution`, çözümlenmiş onay kararını alır: `allow-once`, `allow-always`, `deny`, `timeout` veya `cancelled`.

Ana bilgisayar düzeyi politikaya ihtiyaç duyan paketli Plugin'ler, `api.registerTrustedToolPolicy(...)` ile güvenilir araç politikaları kaydedebilir. Bunlar sıradan `before_tool_call` hook'larından ve harici Plugin kararlarından önce çalışır. Bunları yalnızca çalışma alanı politikası, bütçe zorlaması veya ayrılmış iş akışı güvenliği gibi ana bilgisayar tarafından güvenilen kapılar için kullanın. Harici Plugin'ler normal `before_tool_call` hook'larını kullanmalıdır.

### Araç sonucu kalıcılığı

Araç sonuçları, UI işleme, tanılama, medya yönlendirme veya Plugin'e ait meta veriler için yapılandırılmış `details` içerebilir. `details` değerini prompt içeriği olarak değil, çalışma zamanı meta verisi olarak ele alın:

- OpenClaw, meta verilerin model bağlamına dönüşmemesi için sağlayıcı yeniden oynatımı ve Compaction girdisinden önce `toolResult.details` değerini çıkarır.
- Kalıcı oturum girdileri yalnızca sınırlı `details` tutar. Aşırı büyük details, kompakt bir özet ve `persistedDetailsTruncated: true` ile değiştirilir.
- `tool_result_persist` ve `before_message_write`, nihai kalıcılık sınırından önce çalışır. Hook'lar yine de döndürülen `details` değerlerini küçük tutmalı ve prompt ile ilgili metni yalnızca `details` içine yerleştirmekten kaçınmalıdır; modelin görebileceği araç çıktısını `content` içine koyun.

## Prompt ve model hook'ları

Yeni Plugin'ler için faza özgü hook'ları kullanın:

- `before_model_resolve`: yalnızca geçerli prompt'u ve ek meta verilerini alır. `providerOverride` veya `modelOverride` döndürün.
- `agent_turn_prepare`: geçerli prompt'u, hazırlanmış oturum mesajlarını ve bu oturum için boşaltılmış tam bir kez kuyruğa alınmış enjeksiyonları alır. `prependContext` veya `appendContext` döndürün.
- `before_prompt_build`: geçerli prompt'u ve oturum mesajlarını alır. `prependContext`, `appendContext`, `systemPrompt`, `prependSystemContext` veya `appendSystemContext` döndürün.
- `heartbeat_prompt_contribution`: yalnızca heartbeat turlarında çalışır ve `prependContext` veya `appendContext` döndürür. Kullanıcı tarafından başlatılan turları değiştirmeden geçerli durumu özetlemesi gereken arka plan izleyicileri için tasarlanmıştır.

`before_agent_start` uyumluluk için kalır. Plugin'inizin eski birleşik bir faza bağımlı olmaması için yukarıdaki açık hook'ları tercih edin.

OpenClaw etkin çalıştırmayı tanımlayabildiğinde `before_agent_start` ve `agent_end`, `event.runId` içerir. Aynı değer `ctx.runId` üzerinde de kullanılabilir. Cron tarafından tetiklenen çalıştırmalar ayrıca `ctx.jobId` değerini de sunar (kaynak Cron iş kimliği); böylece Plugin hook'ları metrikleri, yan etkileri veya durumu belirli bir zamanlanmış işe göre kapsamlandırabilir.

Kanal kaynaklı çalıştırmalar için `ctx.messageProvider`, `discord` veya `telegram` gibi sağlayıcı yüzeyidir; `ctx.channelId` ise OpenClaw'ın oturum anahtarından veya teslimat meta verilerinden türetebildiği durumlarda konuşma hedef tanımlayıcısıdır.

`agent_end` bir gözlem hook'udur ve turdan sonra fire-and-forget çalışır. Hook çalıştırıcısı 30 saniyelik zaman aşımı uygular; böylece takılmış bir Plugin veya embedding uç noktası hook promise'ini sonsuza kadar beklemede bırakamaz. Zaman aşımı günlüğe yazılır ve OpenClaw devam eder; Plugin kendi abort sinyalini de kullanmadıkça Plugin'e ait ağ işini iptal etmez.

Ham prompt'ları, geçmişi, yanıtları, başlıkları, istek gövdelerini veya sağlayıcı istek kimliklerini almaması gereken sağlayıcı çağrısı telemetrisi için `model_call_started` ve `model_call_ended` kullanın. Bu hook'lar `runId`, `callId`, `provider`, `model`, isteğe bağlı `api`/`transport`, terminal `durationMs`/`outcome` ve OpenClaw sınırlı bir sağlayıcı istek kimliği karması türetebildiğinde `upstreamRequestIdHash` gibi kararlı meta veriler içerir.

`before_agent_finalize` yalnızca bir harness doğal nihai assistant yanıtını kabul etmek üzereyken çalışır. Bu, `/stop` iptal yolu değildir ve kullanıcı bir turu iptal ettiğinde çalışmaz. Nihai hale getirmeden önce harness'tan bir model geçişi daha istemek için `{ action: "revise", reason }`, nihai hale getirmeyi zorlamak için `{ action:
"finalize", reason? }` döndürün veya devam etmek için sonuç döndürmeyin. Codex yerel `Stop` hook'ları bu hook'a OpenClaw `before_agent_finalize` kararları olarak aktarılır.

`action: "revise"` döndürürken Plugin'ler, ek model geçişini sınırlı ve yeniden oynatmaya güvenli kılmak için `retry` meta verileri içerebilir:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction`, harness'a gönderilen revizyon nedenine eklenir. `idempotencyKey`, ana bilgisayarın eşdeğer finalize kararları boyunca aynı Plugin isteği için yeniden denemeleri saymasına olanak tanır; `maxAttempts` ise ana bilgisayarın doğal nihai yanıtla devam etmeden önce kaç ek geçişe izin vereceğini sınırlar.

`llm_input`, `llm_output`, `before_agent_finalize` veya `agent_end` değerlerine ihtiyaç duyan paketli olmayan Plugin'ler şunu ayarlamalıdır:

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

Prompt'u değiştiren hook'lar ve kalıcı sonraki tur enjeksiyonları, `plugins.entries.<id>.hooks.allowPromptInjection=false` ile Plugin başına devre dışı bırakılabilir.

### Oturum uzantıları ve sonraki tur enjeksiyonları

İş akışı plugin'leri, `api.registerSessionExtension(...)` ile küçük JSON uyumlu oturum durumunu kalıcı hale getirebilir ve Gateway `sessions.pluginPatch` yöntemi üzerinden güncelleyebilir. Oturum satırları, kayıtlı uzantı durumunu `pluginExtensions` üzerinden yansıtır; böylece Control UI ve diğer istemciler, plugin iç ayrıntılarını öğrenmeden plugin'e ait durumu işleyebilir.

Bir plugin'in dayanıklı bağlamı tam olarak bir kez sonraki model turuna ulaştırması gerektiğinde `api.enqueueNextTurnInjection(...)` kullanın. OpenClaw, kuyruğa alınmış enjeksiyonları istem kancalarından önce boşaltır, süresi dolmuş enjeksiyonları düşürür ve plugin başına `idempotencyKey` ile yinelenenleri kaldırır. Bu, onay sürdürmeleri, ilke özetleri, arka plan izleyici deltaları ve sonraki turda model tarafından görünür olması gereken ancak kalıcı sistem istemi metnine dönüşmemesi gereken komut devamları için doğru bağlantı noktasıdır.

Temizleme semantiği sözleşmenin parçasıdır. Oturum uzantısı temizleme ve çalışma zamanı yaşam döngüsü temizleme geri çağrıları `reset`, `delete`, `disable` veya `restart` alır. Ana makine, reset/delete/disable için sahip plugin'in kalıcı oturum uzantısı durumunu ve bekleyen sonraki tur enjeksiyonlarını kaldırır; restart ise dayanıklı oturum durumunu korur, temizleme geri çağrıları da plugin'lerin eski çalışma zamanı üretimi için zamanlayıcı işleri, çalışma bağlamı ve diğer bant dışı kaynakları serbest bırakmasına olanak tanır.

## İleti kancaları

Kanal düzeyi yönlendirme ve teslim ilkesi için ileti kancalarını kullanın:

- `message_received`: gelen içeriği, göndereni, `threadId`, `messageId`, `senderId`, isteğe bağlı çalıştırma/oturum korelasyonunu ve meta verileri gözlemleyin.
- `message_sending`: `content` değerini yeniden yazın veya `{ cancel: true }` döndürün.
- `message_sent`: son başarıyı veya hatayı gözlemleyin.

Yalnızca sesli TTS yanıtları için `content`, kanal yükünde görünür metin/altyazı olmasa bile gizli konuşulan dökümü içerebilir. Bu `content` değerini yeniden yazmak yalnızca kanca tarafından görülebilen dökümü günceller; medya altyazısı olarak işlenmez.

İleti kancası bağlamları, mevcut olduğunda kararlı korelasyon alanlarını gösterir: `ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`, `ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` ve `ctx.callDepth`. Eski meta verileri okumadan önce bu birinci sınıf alanları tercih edin.

Kanala özgü meta verileri kullanmadan önce tipli `threadId` ve `replyToId` alanlarını tercih edin.

Karar kuralları:

- `cancel: true` içeren `message_sending` kesindir.
- `cancel: false` içeren `message_sending` karar yok olarak değerlendirilir.
- Yeniden yazılmış `content`, daha sonraki bir kanca teslimi iptal etmediği sürece daha düşük öncelikli kancalara devam eder.

## Kurulum kancaları

`before_install`, skill ve plugin kurulumları için yerleşik taramadan sonra çalışır. Kurulumu durdurmak için ek bulgular veya `{ block: true, blockReason }` döndürün.

`block: true` kesindir. `block: false` karar yok olarak değerlendirilir.

## Gateway yaşam döngüsü

Gateway'e ait duruma ihtiyaç duyan plugin hizmetleri için `gateway_start` kullanın. Bağlam, cron incelemesi ve güncellemeleri için `ctx.config`, `ctx.workspaceDir` ve `ctx.getCron?.()` değerlerini gösterir. Uzun süre çalışan kaynakları temizlemek için `gateway_stop` kullanın.

Plugin'e ait çalışma zamanı hizmetleri için dahili `gateway:startup` kancasına güvenmeyin.

`cron_changed`, `added`, `updated`, `removed`, `started`, `finished` ve `scheduled` nedenlerini kapsayan tipli bir olay yüküyle gateway'e ait cron yaşam döngüsü olayları için tetiklenir. Olay, bir `PluginHookGatewayCronJob` anlık görüntüsü (varsa `state.nextRunAtMs`, `state.lastRunStatus` ve `state.lastError` dahil) ile `not-requested` | `delivered` | `not-delivered` | `unknown` değerlerinden oluşan bir `PluginHookGatewayCronDeliveryStatus` taşır. Kaldırılan olaylar, dış zamanlayıcıların durumu uzlaştırabilmesi için silinen iş anlık görüntüsünü taşımaya devam eder. Dış uyandırma zamanlayıcılarını eşitlerken çalışma zamanı bağlamından `ctx.getCron?.()` ve `ctx.config` kullanın ve vade kontrolleri ile yürütme için doğruluk kaynağı olarak OpenClaw'ı koruyun.

## Yaklaşan kullanımdan kaldırmalar

Bazı kanca bitişiği yüzeyler kullanımdan kaldırılmıştır ancak hâlâ desteklenir. Sonraki büyük sürümden önce geçiş yapın:

- **Düz metin kanal zarfları** `inbound_claim` ve `message_received` işleyicilerinde. Düz zarf metnini ayrıştırmak yerine `BodyForAgent` ve yapılandırılmış kullanıcı bağlamı bloklarını okuyun. Bkz. [Düz metin kanal zarfları → BodyForAgent](/tr/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** uyumluluk için kalır. Yeni plugin'ler, birleşik aşama yerine `before_model_resolve` ve `before_prompt_build` kullanmalıdır.
- **`before_tool_call` içindeki `onResolution`** artık serbest biçimli `string` yerine tipli `PluginApprovalResolution` birleşimini (`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`) kullanır.

Tam liste için — bellek yeteneği kaydı, sağlayıcı düşünme profili, dış kimlik doğrulama sağlayıcıları, sağlayıcı keşif tipleri, görev çalışma zamanı erişicileri ve `command-auth` → `command-status` yeniden adlandırması — bkz. [Plugin SDK geçişi → Etkin kullanımdan kaldırmalar](/tr/plugins/sdk-migration#active-deprecations).

## İlgili

- [Plugin SDK geçişi](/tr/plugins/sdk-migration) — etkin kullanımdan kaldırmalar ve kaldırma zaman çizelgesi
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints)
- [Dahili kancalar](/tr/automation/hooks)
- [Plugin mimarisi iç ayrıntıları](/tr/plugins/architecture-internals)
