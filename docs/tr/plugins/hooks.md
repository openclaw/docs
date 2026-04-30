---
read_when:
    - before_tool_call, before_agent_reply, mesaj kancaları veya yaşam döngüsü kancaları gerektiren bir Plugin oluşturuyorsunuz
    - Bir Plugin'den gelen araç çağrılarını engellemeniz, yeniden yazmanız veya onay zorunlu kılmanız gerekir
    - Dahili kancalar ile Plugin kancaları arasında karar veriyorsunuz
summary: 'Plugin kancaları: ajan, araç, ileti, oturum ve Gateway yaşam döngüsü olaylarını yakalayın'
title: Plugin kancaları
x-i18n:
    generated_at: "2026-04-30T09:34:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: f600df47c67eb07d85b7b063f1189baf78a49efad727d8cadbd37f66745c4401
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin kancaları, OpenClaw Plugin'leri için süreç içi genişletme noktalarıdır. Bunları,
bir Plugin'in ajan çalıştırmalarını, araç çağrılarını, mesaj akışını,
oturum yaşam döngüsünü, alt ajan yönlendirmesini, kurulumları veya Gateway başlatmasını
incelemesi ya da değiştirmesi gerektiğinde kullanın.

`/new`, `/reset`, `/stop`, `agent:bootstrap` veya `gateway:startup` gibi
komut ve Gateway olayları için operatör tarafından kurulmuş küçük bir
`HOOK.md` betiği istediğinizde bunun yerine [dahili kancaları](/tr/automation/hooks) kullanın.

## Hızlı başlangıç

Plugin girişinizden `api.on(...)` ile tipli Plugin kancalarını kaydedin:

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

Kanca işleyicileri azalan `priority` sırasıyla ardışık çalışır. Aynı öncelikteki kancalar
kayıt sırasını korur.

`api.on(name, handler, opts?)` şunları kabul eder:

- `priority` — işleyici sıralaması (yüksek olan önce çalışır).
- `timeoutMs` — isteğe bağlı kanca başına süre bütçesi. Ayarlandığında, kanca çalıştırıcı bu
  işleyiciyi bütçe dolduktan sonra keser ve yavaş kurulum ya da hatırlama işinin çağıranın yapılandırılmış model
  zaman aşımını tüketmesine izin vermek yerine sonrakiyle devam eder. Kanca çalıştırıcının genel olarak uyguladığı varsayılan gözlem/karar zaman aşımını kullanmak için bunu atlayın.

Her kanca, o işleyiciyi kaydeden Plugin için çözümlenmiş yapılandırma olan `event.context.pluginConfig` alır. Güncel Plugin seçeneklerine ihtiyaç duyan kanca kararları için bunu kullanın; OpenClaw bunu diğer Plugin'ler tarafından görülen paylaşılan olay nesnesini değiştirmeden işleyici başına enjekte eder.

## Kanca kataloğu

Kancalar genişlettikleri yüzeye göre gruplanır. **Kalın** yazılan adlar bir
karar sonucu kabul eder (engelle, iptal et, geçersiz kıl veya onay iste); diğerlerinin tümü
yalnızca gözlem amaçlıdır.

**Ajan turu**

- `before_model_resolve` — oturum mesajları yüklenmeden önce sağlayıcıyı veya modeli geçersiz kıl
- `agent_turn_prepare` — kuyruğa alınmış Plugin tur enjeksiyonlarını tüket ve istem kancalarından önce aynı tura bağlam ekle
- `before_prompt_build` — model çağrısından önce dinamik bağlam veya sistem istemi metni ekle
- `before_agent_start` — yalnızca uyumluluk amaçlı birleşik aşama; yukarıdaki iki kancayı tercih edin
- **`before_agent_reply`** — model turunu sentetik bir yanıtla veya sessizlikle kısa devre yap
- **`before_agent_finalize`** — doğal nihai yanıtı incele ve bir model geçişi daha iste
- `agent_end` — nihai mesajları, başarı durumunu ve çalışma süresini gözlemle
- `heartbeat_prompt_contribution` — arka plan izleyici ve yaşam döngüsü Plugin'leri için yalnızca Heartbeat bağlamı ekle

**Konuşma gözlemi**

- `model_call_started` / `model_call_ended` — istem veya yanıt içeriği olmadan temizlenmiş sağlayıcı/model çağrısı meta verilerini, zamanlamayı, sonucu ve sınırlı istek kimliği karmalarını gözlemle
- `llm_input` — sağlayıcı girdisini gözlemle (sistem istemi, istem, geçmiş)
- `llm_output` — sağlayıcı çıktısını gözlemle

**Araçlar**

- **`before_tool_call`** — araç parametrelerini yeniden yaz, yürütmeyi engelle veya onay iste
- `after_tool_call` — araç sonuçlarını, hataları ve süreyi gözlemle
- **`tool_result_persist`** — bir araç sonucundan üretilen asistan mesajını yeniden yaz
- **`before_message_write`** — devam eden bir mesaj yazımını incele veya engelle (nadir)

**Mesajlar ve teslimat**

- **`inbound_claim`** — ajan yönlendirmesinden önce gelen bir mesajı sahiplen (sentetik yanıtlar)
- `message_received` — gelen içeriği, göndereni, iş parçacığını ve meta verileri gözlemle
- **`message_sending`** — giden içeriği yeniden yaz veya teslimatı iptal et
- `message_sent` — giden teslimat başarısını veya başarısızlığını gözlemle
- **`before_dispatch`** — kanal devrinden önce giden bir gönderimi incele veya yeniden yaz
- **`reply_dispatch`** — nihai yanıt gönderim hattına katıl

**Oturumlar ve Compaction**

- `session_start` / `session_end` — oturum yaşam döngüsü sınırlarını izle
- `before_compaction` / `after_compaction` — Compaction döngülerini gözlemle veya açıklama ekle
- `before_reset` — oturum sıfırlama olaylarını gözlemle (`/reset`, programatik sıfırlamalar)

**Alt ajanlar**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — alt ajan yönlendirmesini ve tamamlama teslimatını koordine et

**Yaşam döngüsü**

- `gateway_start` / `gateway_stop` — Gateway ile Plugin'e ait hizmetleri başlat veya durdur
- `cron_changed` — Gateway'e ait Cron yaşam döngüsü değişikliklerini gözlemle (eklendi, güncellendi, kaldırıldı, başlatıldı, tamamlandı, zamanlandı)
- **`before_install`** — Skills veya Plugin kurulum taramalarını incele ve isteğe bağlı olarak engelle

## Araç çağrısı politikası

`before_tool_call` şunları alır:

- `event.toolName`
- `event.params`
- isteğe bağlı `event.runId`
- isteğe bağlı `event.toolCallId`
- `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (Cron güdümlü çalıştırmalarda ayarlanır) ve tanılama amaçlı `ctx.trace` gibi bağlam alanları

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
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Kurallar:

- `block: true` sonlandırıcıdır ve daha düşük öncelikli işleyicileri atlar.
- `block: false` karar yok gibi ele alınır.
- `params`, yürütme için araç parametrelerini yeniden yazar.
- `requireApproval`, ajan çalıştırmasını duraklatır ve Plugin onayları üzerinden kullanıcıya sorar. `/approve` komutu hem exec hem de Plugin onaylarını onaylayabilir.
- Daha yüksek öncelikli bir kanca onay istemiş olsa bile daha düşük öncelikli `block: true` yine de engelleyebilir.
- `onResolution`, çözümlenmiş onay kararını alır: `allow-once`,
  `allow-always`, `deny`, `timeout` veya `cancelled`.

Ana makine düzeyinde politikaya ihtiyaç duyan paketli Plugin'ler
`api.registerTrustedToolPolicy(...)` ile güvenilir araç politikaları kaydedebilir. Bunlar sıradan
`before_tool_call` kancalarından ve harici Plugin kararlarından önce çalışır. Bunları yalnızca
çalışma alanı politikası, bütçe uygulaması veya ayrılmış iş akışı güvenliği gibi ana makinece güvenilen kapılar için kullanın. Harici Plugin'ler normal `before_tool_call`
kancalarını kullanmalıdır.

### Araç sonucu kalıcılığı

Araç sonuçları, UI işlemesi, tanılama,
medya yönlendirme veya Plugin'e ait meta veriler için yapılandırılmış `details` içerebilir. `details` alanını istem içeriği olarak değil,
çalışma zamanı meta verisi olarak ele alın:

- OpenClaw, meta verilerin model bağlamına dönüşmemesi için sağlayıcı yeniden oynatımı ve Compaction girdisinden önce `toolResult.details` alanını çıkarır.
- Kalıcı oturum girdileri yalnızca sınırlı `details` tutar. Aşırı büyük ayrıntılar
  kompakt bir özet ve `persistedDetailsTruncated: true` ile değiştirilir.
- `tool_result_persist` ve `before_message_write`, nihai kalıcılık sınırından önce çalışır. Kancalar yine de döndürülen `details` değerlerini küçük tutmalı ve istemle ilgili metni yalnızca `details` içine koymaktan kaçınmalıdır; model tarafından görülebilir araç çıktısını `content` içine koyun.

## İstem ve model kancaları

Yeni Plugin'ler için aşamaya özgü kancaları kullanın:

- `before_model_resolve`: yalnızca geçerli istemi ve ek meta verilerini alır. `providerOverride` veya `modelOverride` döndürün.
- `agent_turn_prepare`: geçerli istemi, hazırlanmış oturum mesajlarını
  ve bu oturum için boşaltılmış tam bir kez kuyruğa alınmış enjeksiyonları alır. `prependContext` veya `appendContext` döndürün.
- `before_prompt_build`: geçerli istemi ve oturum mesajlarını alır.
  `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` veya `appendSystemContext` döndürün.
- `heartbeat_prompt_contribution`: yalnızca Heartbeat turlarında çalışır ve
  `prependContext` veya `appendContext` döndürür. Kullanıcı tarafından başlatılan turları değiştirmeden mevcut durumu özetlemesi gereken arka plan izleyicileri için tasarlanmıştır.

`before_agent_start` uyumluluk için kalır. Plugin'inizin eski bir birleşik aşamaya bağımlı olmaması için yukarıdaki açık kancaları tercih edin.

OpenClaw etkin çalıştırmayı tanımlayabildiğinde `before_agent_start` ve `agent_end` `event.runId` içerir. Aynı değer `ctx.runId` üzerinde de kullanılabilir.
Cron güdümlü çalıştırmalar ayrıca `ctx.jobId` (kaynak Cron işinin kimliği) sağlar; böylece
Plugin kancaları metrikleri, yan etkileri veya durumu belirli bir zamanlanmış işe göre kapsamlayabilir.

`agent_end` bir gözlem kancasıdır ve turdan sonra başlatılıp beklenmeden çalışır. Bir takılmış Plugin veya embedding uç noktası kanca promise'ını sonsuza kadar beklemede bırakamasın diye kanca çalıştırıcı 30 saniyelik zaman aşımı uygular. Zaman aşımı günlüğe yazılır ve OpenClaw devam eder; Plugin kendi iptal sinyalini de kullanmadığı sürece Plugin'e ait ağ işini iptal etmez.

Ham istemleri, geçmişi, yanıtları, başlıkları, istek gövdelerini veya sağlayıcı istek kimliklerini almaması gereken sağlayıcı çağrısı telemetrisi için `model_call_started` ve `model_call_ended` kullanın. Bu kancalar `runId`, `callId`, `provider`, `model`, isteğe bağlı `api`/`transport`, terminal `durationMs`/`outcome` ve OpenClaw sınırlı bir sağlayıcı istek kimliği karması türetebildiğinde `upstreamRequestIdHash` gibi kararlı meta verileri içerir.

`before_agent_finalize` yalnızca bir harness doğal nihai asistan yanıtını kabul etmek üzereyken çalışır. Bu, `/stop` iptal yolu değildir ve kullanıcı bir turu iptal ettiğinde çalışmaz. Sonlandırmadan önce harness'tan bir model geçişi daha istemek için `{ action: "revise", reason }`, sonlandırmayı zorlamak için `{ action:
"finalize", reason? }` döndürün veya devam etmek için sonuç döndürmeyin.
Codex yerel `Stop` kancaları bu kancaya OpenClaw
`before_agent_finalize` kararları olarak aktarılır.

`llm_input`, `llm_output`,
`before_agent_finalize` veya `agent_end` gerektiren paketli olmayan Plugin'ler şunu ayarlamalıdır:

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

İstemi değiştiren kancalar ve kalıcı sonraki tur enjeksiyonları Plugin başına
`plugins.entries.<id>.hooks.allowPromptInjection=false` ile devre dışı bırakılabilir.

### Oturum uzantıları ve sonraki tur enjeksiyonları

İş akışı Plugin'leri, küçük JSON uyumlu oturum durumunu
`api.registerSessionExtension(...)` ile kalıcılaştırabilir ve Gateway
`sessions.pluginPatch` yöntemi üzerinden güncelleyebilir. Oturum satırları kayıtlı uzantı durumunu
`pluginExtensions` üzerinden yansıtır; böylece Control UI ve diğer istemciler
Plugin iç yapılarını öğrenmeden Plugin'e ait durumu işleyebilir.

Bir Plugin'in kalıcı bağlamı sonraki model turuna tam bir kez ulaştırması gerektiğinde `api.enqueueNextTurnInjection(...)` kullanın. OpenClaw istem kancalarından önce kuyruğa alınmış enjeksiyonları boşaltır, süresi dolmuş enjeksiyonları atar ve Plugin başına `idempotencyKey` ile tekilleştirir. Bu; onay sürdürmeleri, politika özetleri,
arka plan izleyici deltaları ve sonraki turda model tarafından görülmesi gereken ancak kalıcı sistem istemi metnine dönüşmemesi gereken komut devamları için doğru dikiştir.

Temizleme semantiği sözleşmenin parçasıdır. Oturum uzantısı temizliği ve
çalışma zamanı yaşam döngüsü temizleme geri çağrıları `reset`, `delete`, `disable` veya
`restart` alır. Ana makine, sahip Plugin'in kalıcı oturum uzantısı durumunu
ve bekleyen sonraki tur enjeksiyonlarını reset/delete/disable için kaldırır; restart, kalıcı oturum durumunu korurken temizleme geri çağrıları Plugin'lerin eski çalışma zamanı nesli için zamanlayıcı işlerini, çalıştırma bağlamını ve diğer bant dışı kaynakları serbest bırakmasına olanak tanır.

## Mesaj kancaları

Kanal düzeyi yönlendirme ve teslimat politikası için mesaj kancalarını kullanın:

- `message_received`: gelen içeriği, göndereni, `threadId`, `messageId`,
  `senderId`, isteğe bağlı çalıştırma/oturum korelasyonunu ve meta verileri gözlemle.
- `message_sending`: `content` değerini yeniden yaz veya `{ cancel: true }` döndür.
- `message_sent`: nihai başarıyı veya başarısızlığı gözlemle.

Yalnızca sesli TTS yanıtlarında, kanal yükünde görünür metin/açıklama olmasa bile `content` gizli konuşma transkriptini içerebilir. Bu `content` değerinin yeniden yazılması yalnızca hook tarafından görülebilen transkripti günceller; medya açıklaması olarak işlenmez.

Mesaj hook bağlamları, kullanılabilir olduğunda kararlı ilişkilendirme alanlarını açığa çıkarır: `ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`, `ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` ve `ctx.callDepth`. Eski meta verileri okumadan önce bu birinci sınıf alanları tercih edin.

Kanala özgü meta verileri kullanmadan önce tipli `threadId` ve `replyToId` alanlarını tercih edin.

Karar kuralları:

- `message_sending` ile `cancel: true` terminaldir.
- `message_sending` ile `cancel: false` karar yok olarak değerlendirilir.
- Yeniden yazılmış `content`, sonraki bir hook teslimatı iptal etmediği sürece daha düşük öncelikli hook’lara devam eder.

## Hook’ları yükleme

`before_install`, skill ve plugin kurulumları için yerleşik taramadan sonra çalışır. Ek bulgular döndürün veya kurulumu durdurmak için `{ block: true, blockReason }` döndürün.

`block: true` terminaldir. `block: false` karar yok olarak değerlendirilir.

## Gateway yaşam döngüsü

Gateway’e ait duruma ihtiyaç duyan plugin servisleri için `gateway_start` kullanın. Bağlam, cron incelemesi ve güncellemeleri için `ctx.config`, `ctx.workspaceDir` ve `ctx.getCron?.()` alanlarını açığa çıkarır. Uzun süre çalışan kaynakları temizlemek için `gateway_stop` kullanın.

Plugin’e ait çalışma zamanı servisleri için dahili `gateway:startup` hook’una güvenmeyin.

`cron_changed`, `added`, `updated`, `removed`, `started`, `finished` ve `scheduled` nedenlerini kapsayan tipli bir olay yüküyle gateway’e ait cron yaşam döngüsü olayları için tetiklenir. Olay, bir `PluginHookGatewayCronJob` anlık görüntüsü (`state.nextRunAtMs`, `state.lastRunStatus` ve mevcut olduğunda `state.lastError` dahil) ile `not-requested` | `delivered` | `not-delivered` | `unknown` değerlerinden oluşan bir `PluginHookGatewayCronDeliveryStatus` taşır. Kaldırılan olaylar hâlâ silinen iş anlık görüntüsünü taşır; böylece harici zamanlayıcılar durumu uzlaştırabilir. Harici uyandırma zamanlayıcılarını eşitlerken çalışma zamanı bağlamından `ctx.getCron?.()` ve `ctx.config` kullanın ve vade kontrolleri ile yürütme için doğruluk kaynağı olarak OpenClaw’ı koruyun.

## Yaklaşan kullanımdan kaldırmalar

Hook ile ilişkili birkaç yüzey kullanımdan kaldırılmıştır ancak hâlâ desteklenir. Bir sonraki majör sürümden önce geçiş yapın:

- `inbound_claim` ve `message_received` işleyicilerindeki **düz metin kanal zarfları**. Düz zarf metnini ayrıştırmak yerine `BodyForAgent` ve yapılandırılmış kullanıcı bağlamı bloklarını okuyun. Bkz. [Düz metin kanal zarfları → BodyForAgent](/tr/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** uyumluluk için kalır. Yeni plugin’ler, birleşik aşama yerine `before_model_resolve` ve `before_prompt_build` kullanmalıdır.
- **`before_tool_call` içindeki `onResolution`** artık serbest biçimli bir `string` yerine tipli `PluginApprovalResolution` birleşimini (`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`) kullanır.

Tam liste için — bellek yeteneği kaydı, sağlayıcı düşünme profili, harici kimlik doğrulama sağlayıcıları, sağlayıcı keşif tipleri, görev çalışma zamanı erişimcileri ve `command-auth` → `command-status` yeniden adlandırması — bkz. [Plugin SDK geçişi → Etkin kullanımdan kaldırmalar](/tr/plugins/sdk-migration#active-deprecations).

## İlgili

- [Plugin SDK geçişi](/tr/plugins/sdk-migration) — etkin kullanımdan kaldırmalar ve kaldırma zaman çizelgesi
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints)
- [Dahili hook’lar](/tr/automation/hooks)
- [Plugin mimarisi iç yapıları](/tr/plugins/architecture-internals)
