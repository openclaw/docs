---
read_when:
    - before_tool_call, before_agent_reply, mesaj kancaları veya yaşam döngüsü kancaları gerektiren bir Plugin oluşturuyorsunuz
    - Bir Plugin tarafından yapılan araç çağrılarını engellemeniz, yeniden yazmanız veya onay gerektirmeniz gerekir
    - Dahili kancalar ile Plugin kancaları arasında karar veriyorsunuz
summary: 'Plugin hook''ları: agent, araç, mesaj, oturum ve Gateway yaşam döngüsü olaylarını yakalayın'
title: Plugin kancaları
x-i18n:
    generated_at: "2026-05-03T21:36:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c4ed060f1b89917e1f2f46d2da9448cd562edbcd6ce03bc9b1a83da3ed9a591
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin hook'ları, OpenClaw Plugin'leri için işlem içi genişletme noktalarıdır. Bir Plugin'in agent çalıştırmalarını, tool çağrılarını, mesaj akışını, oturum yaşam döngüsünü, subagent yönlendirmesini, kurulumları veya Gateway başlangıcını incelemesi ya da değiştirmesi gerektiğinde bunları kullanın.

`/new`, `/reset`, `/stop`, `agent:bootstrap` veya `gateway:startup` gibi komut ve Gateway olayları için operatör tarafından kurulmuş küçük bir `HOOK.md` betiği istiyorsanız bunun yerine [dahili hook'ları](/tr/automation/hooks) kullanın.

## Hızlı başlangıç

Plugin girişinizden `api.on(...)` ile tiplenmiş Plugin hook'larını kaydedin:

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

Hook işleyicileri azalan `priority` sırasıyla ardışık çalışır. Aynı öncelikteki hook'lar kayıt sırasını korur.

`api.on(name, handler, opts?)` şunları kabul eder:

- `priority` — işleyici sıralaması (daha yüksek önce çalışır).
- `timeoutMs` — hook başına isteğe bağlı süre bütçesi. Ayarlandığında hook çalıştırıcısı, yavaş kurulum veya hatırlama işinin çağıranın yapılandırılmış model zaman aşımını tüketmesine izin vermek yerine, bütçe dolduktan sonra ilgili işleyiciyi durdurur ve sonrakine devam eder. Hook çalıştırıcısının genel olarak uyguladığı varsayılan gözlem/karar zaman aşımını kullanmak için bunu atlayın.

Operatörler Plugin kodunu yamamadan da hook bütçeleri ayarlayabilir:

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

`hooks.timeouts.<hookName>`, `hooks.timeoutMs` değerini geçersiz kılar; o da Plugin tarafından yazılmış `api.on(..., { timeoutMs })` değerini geçersiz kılar. Yapılandırılan her değer, 600000 milisaniyeden büyük olmayan pozitif bir tam sayı olmalıdır. Bilinen yavaş hook'lar için hook başına geçersiz kılmaları tercih edin; böylece tek bir Plugin her yerde daha uzun bütçe almaz.

Her hook, o işleyiciyi kaydeden Plugin için çözümlenmiş yapılandırma olan `event.context.pluginConfig` alır. Mevcut Plugin seçeneklerine ihtiyaç duyan hook kararlarında bunu kullanın; OpenClaw, diğer Plugin'lerin gördüğü paylaşılan olay nesnesini değiştirmeden bunu işleyici başına enjekte eder.

## Hook kataloğu

Hook'lar genişlettikleri yüzeye göre gruplanır. **Kalın** adlar bir karar sonucu (engelleme, iptal, geçersiz kılma veya onay isteme) kabul eder; diğerlerinin tümü yalnızca gözlemdir.

**Agent turu**

- `before_model_resolve` — oturum mesajları yüklenmeden önce sağlayıcıyı veya modeli geçersiz kıl
- `agent_turn_prepare` — sıraya alınmış Plugin turu enjeksiyonlarını tüket ve prompt hook'larından önce aynı tur bağlamı ekle
- `before_prompt_build` — model çağrısından önce dinamik bağlam veya sistem prompt metni ekle
- `before_agent_start` — yalnızca uyumluluk amaçlı birleşik faz; yukarıdaki iki hook'u tercih edin
- **`before_agent_reply`** — model turunu sentetik bir yanıt veya sessizlikle kısa devreye al
- **`before_agent_finalize`** — doğal nihai yanıtı incele ve bir model geçişi daha iste
- `agent_end` — nihai mesajları, başarı durumunu ve çalışma süresini gözlemle
- `heartbeat_prompt_contribution` — arka plan izleyici ve yaşam döngüsü Plugin'leri için yalnızca Heartbeat bağlamı ekle

**Konuşma gözlemi**

- `model_call_started` / `model_call_ended` — prompt veya yanıt içeriği olmadan, temizlenmiş sağlayıcı/model çağrısı üst verilerini, zamanlamayı, sonucu ve sınırlı istek kimliği hash'lerini gözlemle
- `llm_input` — sağlayıcı girişini gözlemle (sistem prompt'u, prompt, geçmiş)
- `llm_output` — sağlayıcı çıktısını gözlemle

**Araçlar**

- **`before_tool_call`** — tool parametrelerini yeniden yaz, yürütmeyi engelle veya onay iste
- `after_tool_call` — tool sonuçlarını, hataları ve süreyi gözlemle
- **`tool_result_persist`** — bir tool sonucundan üretilen asistan mesajını yeniden yaz
- **`before_message_write`** — devam eden bir mesaj yazımını incele veya engelle (nadiren)

**Mesajlar ve teslimat**

- **`inbound_claim`** — agent yönlendirmesinden önce gelen bir mesajı sahiplen (sentetik yanıtlar)
- `message_received` — gelen içeriği, göndereni, iş parçacığını ve üst verileri gözlemle
- **`message_sending`** — giden içeriği yeniden yaz veya teslimatı iptal et
- `message_sent` — giden teslimat başarısını veya başarısızlığını gözlemle
- **`before_dispatch`** — kanal devrinden önce giden bir gönderimi incele veya yeniden yaz
- **`reply_dispatch`** — nihai yanıt gönderim hattına katıl

**Oturumlar ve Compaction**

- `session_start` / `session_end` — oturum yaşam döngüsü sınırlarını takip et
- `before_compaction` / `after_compaction` — Compaction döngülerini gözlemle veya açıklama ekle
- `before_reset` — oturum sıfırlama olaylarını gözlemle (`/reset`, programatik sıfırlamalar)

**Subagent'lar**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — subagent yönlendirmesini ve tamamlama teslimatını koordine et

**Yaşam döngüsü**

- `gateway_start` / `gateway_stop` — Gateway ile Plugin'e ait hizmetleri başlat veya durdur
- `cron_changed` — Gateway'e ait Cron yaşam döngüsü değişikliklerini gözlemle (eklendi, güncellendi, kaldırıldı, başlatıldı, tamamlandı, zamanlandı)
- **`before_install`** — Skill veya Plugin kurulum taramalarını incele ve isteğe bağlı olarak engelle

## Tool çağrısı ilkesi

`before_tool_call` şunları alır:

- `event.toolName`
- `event.params`
- isteğe bağlı `event.runId`
- isteğe bağlı `event.toolCallId`
- `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`, `ctx.runId`, `ctx.jobId` (cron odaklı çalıştırmalarda ayarlanır) ve tanılama amaçlı `ctx.trace` gibi bağlam alanları

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
- `block: false` karar yok gibi değerlendirilir.
- `params`, yürütme için tool parametrelerini yeniden yazar.
- `requireApproval`, agent çalıştırmasını duraklatır ve Plugin onayları üzerinden kullanıcıya sorar. `/approve` komutu hem exec hem de Plugin onaylarını onaylayabilir.
- Daha düşük öncelikli bir `block: true`, daha yüksek öncelikli bir hook onay istemiş olsa bile hâlâ engelleyebilir.
- `onResolution`, çözümlenen onay kararını alır — `allow-once`, `allow-always`, `deny`, `timeout` veya `cancelled`.

Host düzeyi ilkeye ihtiyaç duyan paketli Plugin'ler `api.registerTrustedToolPolicy(...)` ile güvenilir tool ilkeleri kaydedebilir. Bunlar normal `before_tool_call` hook'larından ve harici Plugin kararlarından önce çalışır. Bunları yalnızca çalışma alanı ilkesi, bütçe uygulaması veya ayrılmış iş akışı güvenliği gibi host tarafından güvenilen geçitler için kullanın. Harici Plugin'ler normal `before_tool_call` hook'larını kullanmalıdır.

### Tool sonucu kalıcılığı

Tool sonuçları, UI işleme, tanılama, medya yönlendirme veya Plugin'e ait üst veriler için yapılandırılmış `details` içerebilir. `details` öğesini prompt içeriği değil, çalışma zamanı üst verisi olarak ele alın:

- OpenClaw, üst verinin model bağlamına dönüşmemesi için sağlayıcı yeniden oynatımı ve Compaction girdisinden önce `toolResult.details` öğesini çıkarır.
- Kalıcı oturum girdileri yalnızca sınırlı `details` tutar. Aşırı büyük ayrıntılar kompakt bir özet ve `persistedDetailsTruncated: true` ile değiştirilir.
- `tool_result_persist` ve `before_message_write`, nihai kalıcılık sınırından önce çalışır. Hook'lar yine de döndürülen `details` öğesini küçük tutmalı ve prompt açısından ilgili metni yalnızca `details` içine koymaktan kaçınmalıdır; modelin görebileceği tool çıktısını `content` içine koyun.

## Prompt ve model hook'ları

Yeni Plugin'ler için faza özel hook'ları kullanın:

- `before_model_resolve`: yalnızca mevcut prompt'u ve ek üst verilerini alır. `providerOverride` veya `modelOverride` döndürür.
- `agent_turn_prepare`: mevcut prompt'u, hazırlanmış oturum mesajlarını ve bu oturum için boşaltılmış tam olarak bir kez sıraya alınmış enjeksiyonları alır. `prependContext` veya `appendContext` döndürür.
- `before_prompt_build`: mevcut prompt'u ve oturum mesajlarını alır. `prependContext`, `appendContext`, `systemPrompt`, `prependSystemContext` veya `appendSystemContext` döndürür.
- `heartbeat_prompt_contribution`: yalnızca Heartbeat turlarında çalışır ve `prependContext` veya `appendContext` döndürür. Kullanıcı tarafından başlatılan turları değiştirmeden mevcut durumu özetlemesi gereken arka plan izleyicileri için tasarlanmıştır.

`before_agent_start` uyumluluk için kalır. Plugin'inizin eski birleşik faza bağımlı olmaması için yukarıdaki açık hook'ları tercih edin.

OpenClaw etkin çalıştırmayı tanımlayabildiğinde `before_agent_start` ve `agent_end`, `event.runId` içerir. Aynı değer `ctx.runId` üzerinde de kullanılabilir. Cron odaklı çalıştırmalar ayrıca `ctx.jobId` (kaynak cron işi kimliği) gösterir; böylece Plugin hook'ları metrikleri, yan etkileri veya durumu belirli bir zamanlanmış işe göre kapsamlandırabilir.

Kanal kaynaklı çalıştırmalarda `ctx.messageProvider`, `discord` veya `telegram` gibi sağlayıcı yüzeyidir; `ctx.channelId` ise OpenClaw bunu oturum anahtarından veya teslimat üst verilerinden çıkarabildiğinde konuşma hedefi tanımlayıcısıdır.

`agent_end` bir gözlem hook'udur ve turdan sonra fire-and-forget olarak çalışır. Hook çalıştırıcısı, takılmış bir Plugin'in veya embedding uç noktasının hook promise'ini sonsuza dek beklemede bırakmaması için 30 saniyelik zaman aşımı uygular. Zaman aşımı günlüğe yazılır ve OpenClaw devam eder; Plugin ayrıca kendi abort sinyalini kullanmadığı sürece Plugin'e ait ağ işini iptal etmez.

Ham prompt'ları, geçmişi, yanıtları, üst bilgileri, istek gövdelerini veya sağlayıcı istek kimliklerini almaması gereken sağlayıcı çağrısı telemetrisi için `model_call_started` ve `model_call_ended` kullanın. Bu hook'lar `runId`, `callId`, `provider`, `model`, isteğe bağlı `api`/`transport`, terminal `durationMs`/`outcome` ve OpenClaw sınırlı bir sağlayıcı istek kimliği hash'i türetebildiğinde `upstreamRequestIdHash` gibi kararlı üst verileri içerir.

`before_agent_finalize` yalnızca bir harness doğal bir nihai asistan yanıtını kabul etmek üzereyken çalışır. Bu, `/stop` iptal yolu değildir ve kullanıcı bir turu iptal ettiğinde çalışmaz. Sonlandırmadan önce harness'ten bir model geçişi daha istemek için `{ action: "revise", reason }`, sonlandırmayı zorlamak için `{ action: "finalize", reason? }` döndürün veya devam etmek için sonuç döndürmeyin. Codex yerel `Stop` hook'ları, OpenClaw `before_agent_finalize` kararları olarak bu hook'a aktarılır.

`llm_input`, `llm_output`, `before_agent_finalize` veya `agent_end` gerektiren paketli olmayan Plugin'ler şunu ayarlamalıdır:

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

Prompt'u değiştiren hook'lar ve dayanıklı sonraki tur enjeksiyonları, Plugin başına `plugins.entries.<id>.hooks.allowPromptInjection=false` ile devre dışı bırakılabilir.

### Oturum uzantıları ve sonraki tur enjeksiyonları

İş akışı Plugin'leri `api.registerSessionExtension(...)` ile küçük, JSON uyumlu oturum durumunu kalıcı hale getirebilir ve Gateway `sessions.pluginPatch` yöntemiyle güncelleyebilir. Oturum satırları kayıtlı uzantı durumunu `pluginExtensions` üzerinden yansıtır; böylece Control UI ve diğer istemciler, Plugin iç yapılarını öğrenmeden Plugin'e ait durumu işleyebilir.

`api.enqueueNextTurnInjection(...)` işlevini, bir Plugin’in dayanıklı bağlamı sonraki model turuna tam olarak bir kez ulaştırması gerektiğinde kullanın. OpenClaw, sıraya alınmış eklemeleri prompt hook’larından önce boşaltır, süresi dolmuş eklemeleri bırakır ve Plugin başına `idempotencyKey` ile tekilleştirir. Bu, sonraki turda model tarafından görülebilir olması gereken ancak kalıcı sistem prompt metnine dönüşmemesi gereken onay sürdürmeleri, ilke özetleri, arka plan izleyici deltaları ve komut devamları için doğru dikiştir.

Temizleme semantiği sözleşmenin bir parçasıdır. Oturum extension temizliği ve runtime yaşam döngüsü temizleme callback’leri `reset`, `delete`, `disable` veya `restart` alır. Host, reset/delete/disable için sahip Plugin’in kalıcı oturum extension durumunu ve bekleyen sonraki tur eklemelerini kaldırır; restart, dayanıklı oturum durumunu korurken temizleme callback’leri Plugin’lerin eski runtime nesli için scheduler işlerini, run bağlamını ve diğer bant dışı kaynakları serbest bırakmasına izin verir.

## Mesaj hook’ları

Mesaj hook’larını kanal düzeyi yönlendirme ve teslim ilkesi için kullanın:

- `message_received`: gelen içeriği, göndereni, `threadId`, `messageId`,
  `senderId`, isteğe bağlı run/oturum korelasyonunu ve metadata’yı gözlemleyin.
- `message_sending`: `content` öğesini yeniden yazın veya `{ cancel: true }` döndürün.
- `message_sent`: nihai başarıyı veya hatayı gözlemleyin.

Yalnızca sesli TTS yanıtları için, kanal payload’ında görünür metin/açıklama olmasa bile `content` gizli söylenen transkripti içerebilir. Bu `content` öğesini yeniden yazmak yalnızca hook tarafından görülebilen transkripti günceller; medya açıklaması olarak render edilmez.

Mesaj hook bağlamları, mevcut olduğunda kararlı korelasyon alanlarını açığa çıkarır:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` ve `ctx.callDepth`. Eski metadata’yı okumadan önce bu birinci sınıf alanları tercih edin.

Kanala özgü metadata kullanmadan önce tipli `threadId` ve `replyToId` alanlarını tercih edin.

Karar kuralları:

- `cancel: true` ile `message_sending` terminaldir.
- `cancel: false` ile `message_sending` karar yok olarak ele alınır.
- Daha sonra gelen bir hook teslimi iptal etmediği sürece yeniden yazılmış `content` daha düşük öncelikli hook’lara devam eder.

## Kurulum hook’ları

`before_install`, Skills ve Plugin kurulumları için yerleşik taramadan sonra çalışır. Kurulumu durdurmak için ek bulgular veya `{ block: true, blockReason }` döndürün.

`block: true` terminaldir. `block: false` karar yok olarak ele alınır.

## Gateway yaşam döngüsü

Gateway’e ait duruma ihtiyaç duyan Plugin hizmetleri için `gateway_start` kullanın. Bağlam, Cron incelemesi ve güncellemeleri için `ctx.config`, `ctx.workspaceDir` ve `ctx.getCron?.()` öğelerini açığa çıkarır. Uzun süre çalışan kaynakları temizlemek için `gateway_stop` kullanın.

Plugin’e ait runtime hizmetleri için dahili `gateway:startup` hook’una güvenmeyin.

`cron_changed`, gateway’e ait Cron yaşam döngüsü olayları için `added`, `updated`, `removed`, `started`, `finished` ve `scheduled` nedenlerini kapsayan tipli bir event payload’ı ile tetiklenir. Event, bir `PluginHookGatewayCronJob` anlık görüntüsü (`state.nextRunAtMs`, `state.lastRunStatus` ve mevcut olduğunda `state.lastError` dahil) ile birlikte `not-requested` | `delivered` | `not-delivered` | `unknown` değerlerinden oluşan bir `PluginHookGatewayCronDeliveryStatus` taşır. Kaldırılmış event’ler, dış scheduler’ların durumu uzlaştırabilmesi için silinen iş anlık görüntüsünü yine de taşır. Dış wake scheduler’ları senkronize ederken runtime bağlamından `ctx.getCron?.()` ve `ctx.config` kullanın ve zamanı gelen kontroller ile yürütme için doğruluk kaynağı olarak OpenClaw’ı koruyun.

## Yaklaşan kullanımdan kaldırmalar

Hook’a yakın birkaç yüzey kullanımdan kaldırılmıştır ancak hâlâ desteklenir. Sonraki major sürümden önce geçiş yapın:

- `inbound_claim` ve `message_received` handler’larında **düz metin kanal zarfları**. Düz zarf metnini ayrıştırmak yerine `BodyForAgent` ve yapılandırılmış kullanıcı bağlamı bloklarını okuyun. Bkz.
  [Düz metin kanal zarfları → BodyForAgent](/tr/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** uyumluluk için kalır. Yeni Plugin’ler, birleşik aşama yerine `before_model_resolve` ve `before_prompt_build` kullanmalıdır.
- **`before_tool_call` içinde `onResolution`** artık serbest biçimli bir `string` yerine tipli `PluginApprovalResolution` union’ını (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) kullanır.

Tam liste için — bellek capability kaydı, provider thinking profili, dış auth provider’ları, provider discovery tipleri, task runtime erişimcileri ve `command-auth` → `command-status` yeniden adlandırması — bkz.
[Plugin SDK geçişi → Aktif kullanımdan kaldırmalar](/tr/plugins/sdk-migration#active-deprecations).

## İlgili

- [Plugin SDK geçişi](/tr/plugins/sdk-migration) — aktif kullanımdan kaldırmalar ve kaldırma zaman çizelgesi
- [Plugin geliştirme](/tr/plugins/building-plugins)
- [Plugin SDK genel bakış](/tr/plugins/sdk-overview)
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints)
- [Dahili hook’lar](/tr/automation/hooks)
- [Plugin mimarisi iç yapıları](/tr/plugins/architecture-internals)
