---
read_when:
    - before_tool_call, before_agent_reply, mesaj kancaları veya yaşam döngüsü kancaları gerektiren bir Plugin geliştiriyorsunuz
    - Bir Plugin'den gelen araç çağrılarını engellemeniz, yeniden yazmanız veya onay gerektirmeniz gerekir
    - Dahili kancalar ile Plugin kancaları arasında karar veriyorsunuz
summary: 'Plugin kancaları: ajan, araç, mesaj, oturum ve Gateway yaşam döngüsü olaylarını yakalayın'
title: Plugin kancaları
x-i18n:
    generated_at: "2026-05-06T09:24:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a149e1b343ea2d3f55855c2d02f4a9519337f0450c8a1428d52cd77ab4046a
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin hook'ları, OpenClaw plugin'leri için işlem içi genişletme noktalarıdır. Bunları,
bir Plugin'in ajan çalıştırmalarını, araç çağrılarını, mesaj akışını,
oturum yaşam döngüsünü, alt ajan yönlendirmesini, kurulumları veya Gateway başlatmasını
incelemesi ya da değiştirmesi gerektiğinde kullanın.

`/new`, `/reset`, `/stop`, `agent:bootstrap` veya `gateway:startup` gibi
komut ve Gateway olayları için operatör tarafından kurulmuş küçük bir
`HOOK.md` betiği istediğinizde bunun yerine [dahili hook'ları](/tr/automation/hooks)
kullanın.

## Hızlı başlangıç

Plugin girişinizden `api.on(...)` ile türlendirilmiş Plugin hook'larını kaydedin:

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

Hook işleyicileri azalan `priority` sırasıyla ardışık çalışır. Aynı önceliğe sahip hook'lar
kayıt sırasını korur.

`api.on(name, handler, opts?)` şunları kabul eder:

- `priority` - işleyici sıralaması (yüksek olan önce çalışır).
- `timeoutMs` - isteğe bağlı hook başına bütçe. Ayarlandığında, hook çalıştırıcısı
  yavaş kurulum veya hatırlama işi çağıranın yapılandırılmış model
  zaman aşımını tüketmek yerine, bütçe dolduktan sonra o işleyiciyi iptal eder
  ve bir sonrakine devam eder. Hook çalıştırıcısının genel olarak uyguladığı
  varsayılan gözlem/karar zaman aşımını kullanmak için bunu belirtmeyin.

Operatörler, Plugin kodunu yamalamadan hook bütçeleri de ayarlayabilir:

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
Plugin tarafından yazılmış `api.on(..., { timeoutMs })` değerini geçersiz kılar. Yapılandırılan her değer
pozitif bir tam sayı olmalı ve 600000 milisaniyeden büyük olmamalıdır. Bilinen yavaş hook'lar için
hook başına geçersiz kılmaları tercih edin; böylece tek bir Plugin her yerde daha uzun bütçe
almaz.

Her hook, o işleyiciyi kaydeden Plugin için çözümlenmiş yapılandırma olan
`event.context.pluginConfig` değerini alır. Güncel Plugin seçeneklerine ihtiyaç duyan
hook kararları için bunu kullanın; OpenClaw bunu, diğer Plugin'lerin gördüğü paylaşılan
olay nesnesini değiştirmeden işleyici başına enjekte eder.

## Hook kataloğu

Hook'lar genişlettikleri yüzeye göre gruplanır. **Kalın** adlar bir
karar sonucu (engelle, iptal et, geçersiz kıl veya onay iste) kabul eder; diğerlerinin tümü
yalnızca gözlemdir.

**Ajan turu**

- `before_model_resolve` - oturum mesajları yüklenmeden önce sağlayıcıyı veya modeli geçersiz kıl
- `agent_turn_prepare` - kuyruğa alınmış Plugin tur eklemelerini tüket ve istem hook'larından önce aynı tura bağlam ekle
- `before_prompt_build` - model çağrısından önce dinamik bağlam veya sistem istemi metni ekle
- `before_agent_start` - yalnızca uyumluluk için birleşik aşama; yukarıdaki iki hook'u tercih edin
- **`before_agent_reply`** - model turunu sentetik bir yanıt veya sessizlikle kısa devre yap
- **`before_agent_finalize`** - doğal nihai yanıtı incele ve bir model geçişi daha iste
- `agent_end` - nihai mesajları, başarı durumunu ve çalıştırma süresini gözlemle
- `heartbeat_prompt_contribution` - arka plan izleme ve yaşam döngüsü Plugin'leri için yalnızca Heartbeat bağlamı ekle

**Konuşma gözlemi**

- `model_call_started` / `model_call_ended` - istem veya yanıt içeriği olmadan temizlenmiş sağlayıcı/model çağrısı meta verilerini, zamanlamayı, sonucu ve sınırlı istek kimliği karmalarını gözlemle
- `llm_input` - sağlayıcı girdisini gözlemle (sistem istemi, istem, geçmiş)
- `llm_output` - sağlayıcı çıktısını gözlemle

**Araçlar**

- **`before_tool_call`** - araç parametrelerini yeniden yaz, yürütmeyi engelle veya onay iste
- `after_tool_call` - araç sonuçlarını, hataları ve süreyi gözlemle
- **`tool_result_persist`** - bir araç sonucundan üretilen asistan mesajını yeniden yaz
- **`before_message_write`** - devam eden bir mesaj yazımını incele veya engelle (nadir)

**Mesajlar ve teslimat**

- **`inbound_claim`** - ajan yönlendirmesinden önce gelen bir mesajı sahiplen (sentetik yanıtlar)
- `message_received` - gelen içeriği, göndereni, ileti dizisini ve meta verileri gözlemle
- **`message_sending`** - giden içeriği yeniden yaz veya teslimatı iptal et
- `message_sent` - giden teslimatın başarısını veya başarısızlığını gözlemle
- **`before_dispatch`** - kanal devrinden önce giden bir dispatch'i incele veya yeniden yaz
- **`reply_dispatch`** - nihai yanıt-dispatch işlem hattına katıl

**Oturumlar ve Compaction**

- `session_start` / `session_end` - oturum yaşam döngüsü sınırlarını izle
- `before_compaction` / `after_compaction` - Compaction döngülerini gözlemle veya açıklama ekle
- `before_reset` - oturum sıfırlama olaylarını gözlemle (`/reset`, programatik sıfırlamalar)

**Alt ajanlar**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - alt ajan yönlendirmesini ve tamamlama teslimatını koordine et

**Yaşam döngüsü**

- `gateway_start` / `gateway_stop` - Plugin'e ait hizmetleri Gateway ile başlat veya durdur
- `cron_changed` - Gateway'e ait Cron yaşam döngüsü değişikliklerini gözlemle (eklendi, güncellendi, kaldırıldı, başlatıldı, tamamlandı, zamanlandı)
- **`before_install`** - Skills veya Plugin kurulum taramalarını incele ve isteğe bağlı olarak engelle

## Araç çağrısı ilkesi

`before_tool_call` şunları alır:

- `event.toolName`
- `event.params`
- isteğe bağlı `event.runId`
- isteğe bağlı `event.toolCallId`
- `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (cron güdümlü çalıştırmalarda ayarlanır) ve tanılama `ctx.trace`
  gibi bağlam alanları

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
- `block: false` karar yokmuş gibi değerlendirilir.
- `params`, yürütme için araç parametrelerini yeniden yazar.
- `requireApproval`, ajan çalıştırmasını duraklatır ve Plugin
  onayları üzerinden kullanıcıya sorar. `/approve` komutu hem exec hem de Plugin onaylarını onaylayabilir.
- Daha yüksek öncelikli bir hook onay istemiş olsa bile, daha düşük öncelikli bir `block: true`
  sonradan engelleyebilir.
- `onResolution` çözümlenmiş onay kararını alır - `allow-once`,
  `allow-always`, `deny`, `timeout` veya `cancelled`.

Ana makine düzeyi ilkeye ihtiyaç duyan paketli Plugin'ler
`api.registerTrustedToolPolicy(...)` ile güvenilir araç ilkeleri kaydedebilir. Bunlar sıradan
`before_tool_call` hook'larından ve harici Plugin kararlarından önce çalışır. Bunları yalnızca
çalışma alanı ilkesi, bütçe uygulaması veya ayrılmış iş akışı güvenliği gibi ana makine tarafından güvenilen kapılar
için kullanın. Harici Plugin'ler normal `before_tool_call`
hook'larını kullanmalıdır.

### Araç sonucu kalıcılığı

Araç sonuçları, kullanıcı arayüzü işleme, tanılama,
medya yönlendirme veya Plugin'e ait meta veriler için yapılandırılmış `details` içerebilir. `details` değerini istem içeriği değil,
çalışma zamanı meta verisi olarak ele alın:

- OpenClaw, meta verilerin model bağlamına dönüşmemesi için sağlayıcı yeniden oynatması ve Compaction
  girdisinden önce `toolResult.details` değerini çıkarır.
- Kalıcı oturum girdileri yalnızca sınırlı `details` tutar. Aşırı büyük details,
  kompakt bir özet ve `persistedDetailsTruncated: true` ile değiştirilir.
- `tool_result_persist` ve `before_message_write`, nihai
  kalıcılık sınırından önce çalışır. Hook'lar yine de döndürülen `details` değerlerini küçük tutmalı ve
  istemle ilgili metni yalnızca `details` içine koymaktan kaçınmalıdır; modelin görebileceği araç çıktısını
  `content` içine koyun.

## İstem ve model hook'ları

Yeni Plugin'ler için aşamaya özgü hook'ları kullanın:

- `before_model_resolve`: yalnızca geçerli istemi ve ek
  meta verilerini alır. `providerOverride` veya `modelOverride` döndürün.
- `agent_turn_prepare`: geçerli istemi, hazırlanmış oturum mesajlarını
  ve bu oturum için boşaltılmış tam bir kezlik kuyruğa alınmış eklemeleri alır. `prependContext` veya
  `appendContext` döndürün.
- `before_prompt_build`: geçerli istemi ve oturum mesajlarını alır.
  `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` veya `appendSystemContext` döndürün.
- `heartbeat_prompt_contribution`: yalnızca Heartbeat turları için çalışır ve
  `prependContext` veya `appendContext` döndürür. Kullanıcı tarafından başlatılan turları değiştirmeden
  güncel durumu özetlemesi gereken arka plan izleyicileri için tasarlanmıştır.

`before_agent_start` uyumluluk için kalır. Plugin'inizin eski bir birleşik aşamaya
bağımlı olmaması için yukarıdaki açık hook'ları tercih edin.

OpenClaw etkin çalıştırmayı tanımlayabildiğinde `before_agent_start` ve `agent_end`,
`event.runId` içerir. Aynı değer `ctx.runId` üzerinde de kullanılabilir.
Cron güdümlü çalıştırmalar ayrıca `ctx.jobId` (kaynak cron işi kimliği) sunar; böylece
Plugin hook'ları metrikleri, yan etkileri veya durumu belirli bir zamanlanmış
işe kapsamlayabilir.

Kanal kaynaklı çalıştırmalar için `ctx.messageProvider`, `discord` veya `telegram` gibi
sağlayıcı yüzeyidir; `ctx.channelId` ise OpenClaw oturum anahtarından veya teslimat
meta verilerinden türetebildiğinde konuşma hedef
tanımlayıcısıdır.

`agent_end` bir gözlem hook'udur ve turdan sonra fire-and-forget çalışır. Hook
çalıştırıcısı 30 saniyelik bir zaman aşımı uygular; böylece takılmış bir Plugin veya embedding
uç noktası hook promise'ını sonsuza kadar beklemede bırakamaz. Zaman aşımı günlüğe kaydedilir ve
OpenClaw devam eder; Plugin ayrıca kendi iptal sinyalini kullanmıyorsa, Plugin'e ait ağ
işini iptal etmez.

Ham istemleri, geçmişi, yanıtları, başlıkları, istek
gövdelerini veya sağlayıcı istek kimliklerini almaması gereken sağlayıcı çağrısı telemetrisi
için `model_call_started` ve `model_call_ended` kullanın. Bu hook'lar
`runId`, `callId`, `provider`, `model`, isteğe bağlı `api`/`transport`, terminal
`durationMs`/`outcome` ve OpenClaw sınırlı bir sağlayıcı istek kimliği karması türetebildiğinde
`upstreamRequestIdHash` gibi kararlı meta verileri içerir.

`before_agent_finalize` yalnızca bir harness doğal bir nihai asistan yanıtını kabul etmek üzereyken çalışır.
Bu `/stop` iptal yolu değildir ve kullanıcı bir turu iptal ettiğinde
çalışmaz. Sonlandırmadan önce harness'ten bir model geçişi daha istemek için
`{ action: "revise", reason }`, sonlandırmayı zorlamak için `{ action:
"finalize", reason? }` döndürün veya devam etmek için sonuç belirtmeyin.
Codex yerel `Stop` hook'ları bu hook'a OpenClaw
`before_agent_finalize` kararları olarak aktarılır.

`action: "revise"` döndürürken, Plugin'ler ekstra model geçişini sınırlı ve yeniden oynatmaya güvenli
hale getirmek için `retry` meta verisi ekleyebilir:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction`, harness'e gönderilen revizyon gerekçesine eklenir.
`idempotencyKey`, ana makinenin aynı Plugin isteği için eşdeğer finalize kararları arasında
yeniden denemeleri saymasına olanak tanır ve `maxAttempts`, ana makinenin doğal nihai yanıtla
devam etmeden önce izin vereceği ekstra geçiş sayısını sınırlar.

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

İstem değiştiren hook'lar ve kalıcı sonraki tur eklemeleri, Plugin başına
`plugins.entries.<id>.hooks.allowPromptInjection=false` ile devre dışı bırakılabilir.

### Oturum uzantıları ve sonraki tur eklemeleri

İş akışı Plugin'leri, `api.registerSessionExtension(...)` ile küçük JSON uyumlu oturum durumunu kalıcı hale getirebilir ve bunu Gateway
`sessions.pluginPatch` yöntemi üzerinden güncelleyebilir. Oturum satırları, kayıtlı uzantı durumunu
`pluginExtensions` üzerinden yansıtarak Control UI ve diğer istemcilerin
Plugin iç işleyişini öğrenmeden Plugin'e ait durumu işlemesini sağlar.

Bir Plugin'in kalıcı bağlamı bir sonraki model turuna tam olarak bir kez
ulaştırması gerektiğinde `api.enqueueNextTurnInjection(...)` kullanın. OpenClaw, kuyruğa alınmış eklemeleri istem kancalarından önce boşaltır, süresi dolmuş eklemeleri bırakır ve Plugin başına `idempotencyKey` ile tekilleştirir. Bu, onay sürdürmeleri, ilke özetleri,
arka plan izleyici deltaları ve sonraki turda modele görünmesi gereken ancak kalıcı sistem istemi metnine dönüşmemesi gereken komut devamları için doğru arayüzdür.

Temizleme semantiği sözleşmenin parçasıdır. Oturum uzantısı temizleme ve
çalışma zamanı yaşam döngüsü temizleme geri çağrıları `reset`, `delete`, `disable` veya
`restart` alır. Ana makine, reset/delete/disable için sahip Plugin'in kalıcı oturum uzantısı
durumunu ve bekleyen sonraki tur eklemelerini kaldırır; restart, kalıcı oturum durumunu korurken
temizleme geri çağrıları Plugin'lerin eski çalışma zamanı nesli için zamanlayıcı
işlerini, çalışma bağlamını ve diğer bant dışı kaynakları serbest bırakmasına olanak tanır.

## İleti kancaları

Kanal düzeyi yönlendirme ve teslim ilkesi için ileti kancalarını kullanın:

- `message_received`: gelen içeriği, göndereni, `threadId`, `messageId`,
  `senderId`, isteğe bağlı çalışma/oturum korelasyonunu ve meta verileri gözlemleyin.
- `message_sending`: `content` değerini yeniden yazın veya `{ cancel: true }` döndürün.
- `message_sent`: nihai başarıyı veya hatayı gözlemleyin.

Yalnızca sesli TTS yanıtları için, kanal yükünde görünür metin/açıklama olmasa bile `content` gizli konuşulan dökümü içerebilir. Bu
`content` değerinin yeniden yazılması yalnızca kancaya görünür dökümü günceller; medya açıklaması olarak
işlenmez.

İleti kancası bağlamları, mevcut olduğunda kararlı korelasyon alanlarını sunar:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` ve `ctx.callDepth`. Eski meta verileri okumadan önce
bu birinci sınıf alanları tercih edin.

Kanala özgü meta verileri kullanmadan önce yazılı `threadId` ve `replyToId` alanlarını tercih edin.

Karar kuralları:

- `cancel: true` içeren `message_sending` nihai karardır.
- `cancel: false` içeren `message_sending` karar yok olarak değerlendirilir.
- Yeniden yazılmış `content`, daha sonra gelen bir kanca teslimi iptal etmediği sürece daha düşük öncelikli kancalara devam eder.

## Kurulum kancaları

`before_install`, Skills ve Plugin kurulumları için yerleşik taramadan sonra çalışır.
Kurulumu durdurmak için ek bulgular veya `{ block: true, blockReason }` döndürün.

`block: true` nihai karardır. `block: false` karar yok olarak değerlendirilir.

## Gateway yaşam döngüsü

Gateway'e ait duruma ihtiyaç duyan Plugin hizmetleri için `gateway_start` kullanın. Bağlam,
cron incelemesi ve güncellemeleri için `ctx.config`, `ctx.workspaceDir` ve `ctx.getCron?.()` sunar. Uzun süre çalışan
kaynakları temizlemek için `gateway_stop` kullanın.

Plugin'e ait çalışma zamanı hizmetleri için dahili `gateway:startup` kancasına güvenmeyin.

`cron_changed`, `added`, `updated`, `removed`, `started`, `finished` ve `scheduled` nedenlerini kapsayan yazılı
olay yüküyle gateway'e ait cron yaşam döngüsü olayları için tetiklenir. Olay, mevcut olduğunda `state.nextRunAtMs`, `state.lastRunStatus` ve
`state.lastError` dahil bir `PluginHookGatewayCronJob`
anlık görüntüsü ve `not-requested` | `delivered` | `not-delivered` | `unknown` değerlerinden oluşan bir `PluginHookGatewayCronDeliveryStatus`
taşır. Kaldırılan olaylar, harici zamanlayıcıların
durumu uzlaştırabilmesi için silinen iş anlık görüntüsünü yine de taşır. Harici uyandırma zamanlayıcılarını eşitlerken çalışma zamanı
bağlamından `ctx.getCron?.()` ve `ctx.config` kullanın ve vade denetimleri ile yürütme için
OpenClaw'ı doğruluk kaynağı olarak tutun.

## Yaklaşan kullanımdan kaldırmalar

Kancalara yakın birkaç yüzey kullanımdan kaldırılmıştır ancak hâlâ desteklenir. Bir sonraki ana sürümden önce
geçiş yapın:

- `inbound_claim` ve `message_received` işleyicilerindeki **düz metin kanal zarfları**.
  Düz zarf metnini ayrıştırmak yerine `BodyForAgent` ve yapılandırılmış kullanıcı bağlamı bloklarını okuyun. Bkz.
  [Düz metin kanal zarfları → BodyForAgent](/tr/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** uyumluluk için kalır. Yeni Plugin'ler, birleşik
  aşama yerine `before_model_resolve` ve `before_prompt_build` kullanmalıdır.
- **`before_tool_call` içindeki `onResolution`** artık serbest biçimli bir `string` yerine yazılı
  `PluginApprovalResolution` birleşimini (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) kullanır.

Tam liste için - bellek yeteneği kaydı, sağlayıcı düşünme
profili, harici kimlik doğrulama sağlayıcıları, sağlayıcı keşif türleri, görev çalışma zamanı
erişimcileri ve `command-auth` → `command-status` yeniden adlandırması - bkz.
[Plugin SDK geçişi → Etkin kullanımdan kaldırmalar](/tr/plugins/sdk-migration#active-deprecations).

## İlgili

- [Plugin SDK geçişi](/tr/plugins/sdk-migration) - etkin kullanımdan kaldırmalar ve kaldırma zaman çizelgesi
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints)
- [Dahili kancalar](/tr/automation/hooks)
- [Plugin mimarisi iç işleyişi](/tr/plugins/architecture-internals)
