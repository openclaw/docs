---
read_when:
    - before_tool_call, before_agent_reply, mesaj kancaları veya yaşam döngüsü kancaları gerektiren bir Plugin oluşturuyorsunuz
    - Bir Plugin'den gelen araç çağrılarını engellemeniz, yeniden yazmanız veya bunlar için onay gerektirmeniz gerekir
    - Dahili kancalar ile Plugin kancaları arasında karar veriyorsunuz
summary: 'Plugin kancaları: ajan, araç, ileti, oturum ve Gateway yaşam döngüsü olaylarını yakalayın'
title: Plugin kancaları
x-i18n:
    generated_at: "2026-05-10T19:45:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: ebdbb743441dfa9eba3d476171c1c8e9d9628d2669aeea0806ede19bafd61f62
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin kancaları, OpenClaw Plugin'leri için süreç içi genişletme noktalarıdır. Bunları,
bir Plugin'in ajan çalışmalarını, araç çağrılarını, ileti akışını,
oturum yaşam döngüsünü, alt ajan yönlendirmesini, kurulumları veya Gateway başlangıcını incelemesi ya da değiştirmesi gerektiğinde kullanın.

`/new`, `/reset`, `/stop`, `agent:bootstrap` veya `gateway:startup` gibi
komut ve Gateway olayları için operatör tarafından kurulmuş küçük bir
`HOOK.md` betiği istediğinizde bunun yerine [dahili kancaları](/tr/automation/hooks) kullanın.

## Hızlı başlangıç

Plugin girişinizden `api.on(...)` ile türlenmiş Plugin kancalarını kaydedin:

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

Kanca işleyicileri azalan `priority` sırasıyla ardışık olarak çalışır. Aynı önceliğe sahip kancalar
kayıt sırasını korur.

`api.on(name, handler, opts?)` şunları kabul eder:

- `priority` - işleyici sıralaması (yüksek olan önce çalışır).
- `timeoutMs` - isteğe bağlı kanca başına süre bütçesi. Ayarlandığında, kanca çalıştırıcısı
  yavaş kurulumun veya hatırlama işinin çağıranın yapılandırılmış model
  zaman aşımını tüketmesine izin vermek yerine, bütçe dolduktan sonra ilgili
  işleyiciyi iptal eder ve sıradakiyle devam eder. Kanca çalıştırıcısının genel olarak
  uyguladığı varsayılan gözlem/karar zaman aşımını kullanmak için bunu atlayın.

Operatörler, Plugin koduna yama yapmadan da kanca bütçeleri ayarlayabilir:

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

`hooks.timeouts.<hookName>`, `hooks.timeoutMs` değerini geçersiz kılar; o da
Plugin tarafından yazılmış `api.on(..., { timeoutMs })` değerini geçersiz kılar. Yapılandırılan her değer,
600000 milisaniyeden büyük olmayan pozitif bir tam sayı olmalıdır. Bir Plugin'in
her yerde daha uzun bütçe almaması için bilinen yavaş kancalarda kanca başına
geçersiz kılmaları tercih edin.

Her kanca, ilgili işleyiciyi kaydeden Plugin için çözümlenmiş yapılandırma olan
`event.context.pluginConfig` değerini alır. Geçerli Plugin seçeneklerini gerektiren
kanca kararları için bunu kullanın; OpenClaw bunu diğer Plugin'lerin gördüğü
paylaşılan olay nesnesini değiştirmeden işleyici başına enjekte eder.

## Kanca kataloğu

Kancalar, genişlettikleri yüzeye göre gruplandırılır. **Kalın** yazılmış adlar
bir karar sonucu (engelleme, iptal, geçersiz kılma veya onay isteme) kabul eder; diğerlerinin tümü
yalnızca gözlem amaçlıdır.

**Ajan turu**

- `before_model_resolve` - oturum iletileri yüklenmeden önce sağlayıcıyı veya modeli geçersiz kıl
- `agent_turn_prepare` - kuyruğa alınmış Plugin turu enjeksiyonlarını tüket ve istem kancalarından önce aynı tura bağlam ekle
- `before_prompt_build` - model çağrısından önce dinamik bağlam veya sistem istemi metni ekle
- `before_agent_start` - yalnızca uyumluluk amaçlı birleştirilmiş aşama; yukarıdaki iki kancayı tercih edin
- **`before_agent_run`** - model gönderiminden önce son istemi ve oturum iletilerini incele ve isteğe bağlı olarak çalışmayı engelle
- **`before_agent_reply`** - model turunu sentetik bir yanıtla veya sessizlikle kısa devreye al
- **`before_agent_finalize`** - doğal son yanıtı incele ve bir model geçişi daha iste
- `agent_end` - son iletileri, başarı durumunu ve çalışma süresini gözlemle
- `heartbeat_prompt_contribution` - arka plan izleyicisi ve yaşam döngüsü Plugin'leri için yalnızca Heartbeat bağlamı ekle

**Konuşma gözlemi**

- `model_call_started` / `model_call_ended` - temizlenmiş sağlayıcı/model çağrısı meta verilerini, zamanlamayı, sonucu ve istem ya da yanıt içeriği olmadan sınırlandırılmış istek kimliği karmalarını gözlemle
- `llm_input` - sağlayıcı girdisini (sistem istemi, istem, geçmiş) gözlemle
- `llm_output` - sağlayıcı çıktısını gözlemle

**Araçlar**

- **`before_tool_call`** - araç parametrelerini yeniden yaz, yürütmeyi engelle veya onay iste
- `after_tool_call` - araç sonuçlarını, hataları ve süreyi gözlemle
- **`tool_result_persist`** - bir araç sonucundan üretilen asistan iletisini yeniden yaz
- **`before_message_write`** - devam eden bir ileti yazımını incele veya engelle (nadiren)

**İletiler ve teslimat**

- **`inbound_claim`** - ajan yönlendirmesinden önce gelen bir iletiyi üstlen (sentetik yanıtlar)
- `message_received` - gelen içeriği, göndereni, iş parçacığını ve meta verileri gözlemle
- **`message_sending`** - giden içeriği yeniden yaz veya teslimatı iptal et
- `message_sent` - giden teslimatın başarısını veya hatasını gözlemle
- **`before_dispatch`** - kanal devrine geçmeden önce giden bir sevki incele veya yeniden yaz
- **`reply_dispatch`** - son yanıt sevk hattına katıl

**Oturumlar ve Compaction**

- `session_start` / `session_end` - oturum yaşam döngüsü sınırlarını izle
- `before_compaction` / `after_compaction` - Compaction döngülerini gözlemle veya not ekle
- `before_reset` - oturum sıfırlama olaylarını gözlemle (`/reset`, programatik sıfırlamalar)

**Alt ajanlar**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - alt ajan yönlendirmesini ve tamamlama teslimatını koordine et

**Yaşam döngüsü**

- `gateway_start` / `gateway_stop` - Gateway ile birlikte Plugin'e ait hizmetleri başlat veya durdur
- `cron_changed` - Gateway'e ait cron yaşam döngüsü değişikliklerini gözlemle (eklendi, güncellendi, kaldırıldı, başlatıldı, tamamlandı, zamanlandı)
- **`before_install`** - Skills veya Plugin kurulum taramalarını incele ve isteğe bağlı olarak engelle

## Araç çağrısı ilkesi

`before_tool_call` şunları alır:

- `event.toolName`
- `event.params`
- isteğe bağlı `event.derivedPaths`; `apply_patch` gibi iyi bilinen araç zarfları için
  en iyi çabayla ana makineden türetilmiş hedef yol ipuçları içerir; mevcut olduğunda
  bu yollar eksik olabilir veya aracın gerçekte dokunacağı kapsamı
  olduğundan geniş tahmin edebilir (örneğin, hatalı biçimlendirilmiş veya kısmi girdilerle)
- isteğe bağlı `event.runId`
- isteğe bağlı `event.toolCallId`
- `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (cron güdümlü çalışmalarda ayarlanır) ve tanılama `ctx.trace` gibi bağlam alanları

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

- `block: true` sonlandırıcıdır ve daha düşük öncelikli işleyicileri atlar.
- `block: false` karar yokmuş gibi değerlendirilir.
- `params`, yürütme için araç parametrelerini yeniden yazar.
- `requireApproval`, ajan çalışmasını duraklatır ve kullanıcıya Plugin
  onayları aracılığıyla sorar. `/approve` komutu hem exec hem de Plugin onaylarını onaylayabilir.
- Daha düşük öncelikli bir `block: true`, daha yüksek öncelikli bir kanca
  onay istemiş olsa bile hâlâ engelleyebilir.
- `onResolution`, çözümlenen onay kararını alır: `allow-once`,
  `allow-always`, `deny`, `timeout` veya `cancelled`.

Ana makine düzeyi ilkeye ihtiyaç duyan paketlenmiş Plugin'ler,
`api.registerTrustedToolPolicy(...)` ile güvenilir araç ilkeleri kaydedebilir. Bunlar olağan
`before_tool_call` kancalarından ve harici Plugin kararlarından önce çalışır. Bunları yalnızca
çalışma alanı ilkesi, bütçe yaptırımı veya ayrılmış iş akışı güvenliği gibi
ana makine tarafından güvenilen geçitler için kullanın. Harici Plugin'ler normal `before_tool_call`
kancalarını kullanmalıdır.

### Araç sonucu kalıcılığı

Araç sonuçları, UI oluşturma, tanılama,
medya yönlendirme veya Plugin'e ait meta veriler için yapılandırılmış `details` içerebilir. `details` alanını istem içeriği olarak değil,
çalışma zamanı meta verisi olarak değerlendirin:

- OpenClaw, meta verilerin model bağlamına dönüşmemesi için sağlayıcı yeniden oynatmasından ve Compaction
  girdisinden önce `toolResult.details` alanını çıkarır.
- Kalıcı oturum girdileri yalnızca sınırlandırılmış `details` tutar. Aşırı büyük ayrıntılar,
  kompakt bir özetle ve `persistedDetailsTruncated: true` ile değiştirilir.
- `tool_result_persist` ve `before_message_write`, son
  kalıcılık sınırından önce çalışır. Kancalar yine de döndürülen `details` değerini küçük tutmalı ve
  istemle ilgili metni yalnızca `details` içine koymaktan kaçınmalıdır; model tarafından görülebilir araç çıktısını
  `content` içine koyun.

## İstem ve model kancaları

Yeni Plugin'ler için aşamaya özel kancaları kullanın:

- `before_model_resolve`: yalnızca geçerli istemi ve ek
  meta verilerini alır. `providerOverride` veya `modelOverride` döndürün.
- `agent_turn_prepare`: geçerli istemi, hazırlanmış oturum iletilerini
  ve bu oturum için boşaltılmış tam olarak bir kez kuyruğa alınmış enjeksiyonları alır. `prependContext` veya `appendContext` döndürün.
- `before_prompt_build`: geçerli istemi ve oturum iletilerini alır.
  `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` veya `appendSystemContext` döndürün.
- `heartbeat_prompt_contribution`: yalnızca Heartbeat turlarında çalışır ve
  `prependContext` veya `appendContext` döndürür. Kullanıcı tarafından başlatılan turları değiştirmeden
  geçerli durumu özetlemesi gereken arka plan izleyicileri için tasarlanmıştır.

`before_agent_start` uyumluluk için kalır. Plugin'inizin eski bir birleştirilmiş aşamaya
bağımlı olmaması için yukarıdaki açık kancaları tercih edin.

`before_agent_run`, istem oluşturulduktan sonra ve herhangi bir model girdisinden önce,
istem yerelindeki görüntü yükleme ve `llm_input` gözlemi dahil olmak üzere çalışır. Geçerli
kullanıcı girdisini `prompt` olarak, yüklenmiş oturum geçmişini `messages`
içinde ve etkin sistem istemini alır. Model istemi okuyamadan önce çalışmayı durdurmak için
`{ outcome: "block", reason, message? }` döndürün. `reason` dahili;
`message` kullanıcıya gösterilen ikamedir. Desteklenen tek sonuçlar
`pass` ve `block` değerleridir; desteklenmeyen karar şekilleri kapalı hata verir.

Bir çalışma engellendiğinde, OpenClaw `message.content` içinde yalnızca ikame metni
ve engelleyen Plugin kimliği ile zaman damgası gibi hassas olmayan engelleme meta verilerini depolar.
Özgün kullanıcı metni transkriptte veya gelecekteki bağlamda tutulmaz. Dahili engelleme nedenleri
hassas kabul edilir ve transkript, geçmiş, yayın, günlük ve tanılama yüklerinden
çıkarılır. Gözlemlenebilirlik; engelleyici kimliği, sonuç, zaman damgası veya güvenli
kategori gibi temizlenmiş alanları kullanmalıdır.

`before_agent_start` ve `agent_end`, OpenClaw etkin çalışmayı
tanımlayabildiğinde `event.runId` içerir. Aynı değer `ctx.runId` üzerinde de kullanılabilir.
Cron güdümlü çalışmalar ayrıca `ctx.jobId` değerini (kaynak cron işi kimliği) açığa çıkarır; böylece
Plugin kancaları metrikleri, yan etkileri veya durumu belirli bir zamanlanmış
işe göre kapsamlandırabilir.

Kanal kaynaklı çalışmalarda `ctx.messageProvider`, `discord` veya `telegram` gibi
sağlayıcı yüzeyidir; `ctx.channelId` ise OpenClaw bunu oturum anahtarından veya teslimat
meta verilerinden türetebildiğinde konuşma hedefi
tanımlayıcısıdır.

`agent_end` bir gözlem kancasıdır ve turdan sonra ateşle-ve-unut şeklinde çalışır. Kanca
çalıştırıcısı, takılmış bir Plugin'in veya gömme
uç noktasının kanca sözünü sonsuza kadar beklemede bırakamaması için 30 saniyelik zaman aşımı uygular. Zaman aşımı günlüğe yazılır ve
OpenClaw devam eder; Plugin kendi iptal sinyalini de kullanmadığı sürece
Plugin'e ait ağ işini iptal etmez.

Ham istemleri, geçmişi, yanıtları, başlıkları, istek
gövdelerini veya sağlayıcı istek kimliklerini almaması gereken sağlayıcı çağrısı telemetrisi için
`model_call_started` ve `model_call_ended` kullanın. Bu kancalar `runId`, `callId`, `provider`, `model`, isteğe bağlı `api`/`transport`, terminal
`durationMs`/`outcome` ve OpenClaw sınırlandırılmış bir
sağlayıcı istek kimliği karması türetebildiğinde `upstreamRequestIdHash` gibi kararlı meta verileri içerir.

`before_agent_finalize`, yalnızca bir harness doğal bir nihai asistan yanıtını kabul etmek üzereyken çalışır. Bu, `/stop` iptal yolu değildir ve kullanıcı bir turu durdurduğunda çalışmaz. Sonlandırmadan önce harness'ten bir model geçişi daha istemek için `{ action: "revise", reason }`, sonlandırmayı zorlamak için `{ action: "finalize", reason? }` döndürün veya devam etmek için sonuç döndürmeyin. Codex yerel `Stop` hook'ları, OpenClaw `before_agent_finalize` kararları olarak bu hook'a aktarılır.

`action: "revise"` döndürürken, plugin'ler ek model geçişini sınırlı ve yeniden oynatma açısından güvenli hale getirmek için `retry` metadata'sı ekleyebilir:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction`, harness'e gönderilen revizyon nedenine eklenir. `idempotencyKey`, host'un aynı plugin isteği için eşdeğer sonlandırma kararları boyunca yeniden denemeleri saymasını sağlar ve `maxAttempts`, host'un doğal nihai yanıtla devam etmeden önce kaç ek geçişe izin vereceğini sınırlar.

Ham konuşma hook'larına (`before_model_resolve`, `before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`, `agent_end` veya `before_agent_run`) ihtiyaç duyan paketle birlikte gelmeyen plugin'ler şunu ayarlamalıdır:

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

Prompt'u değiştiren hook'lar ve kalıcı sonraki tur enjeksiyonları, plugin başına `plugins.entries.<id>.hooks.allowPromptInjection=false` ile devre dışı bırakılabilir.

### Oturum uzantıları ve sonraki tur enjeksiyonları

Workflow plugin'leri, `api.registerSessionExtension(...)` ile küçük JSON uyumlu oturum durumunu kalıcı hale getirebilir ve bunu Gateway `sessions.pluginPatch` yöntemi üzerinden güncelleyebilir. Oturum satırları kayıtlı uzantı durumunu `pluginExtensions` üzerinden yansıtır; böylece Control UI ve diğer istemciler, plugin iç ayrıntılarını öğrenmeden plugin'e ait durumu render edebilir.

Bir plugin'in kalıcı bağlamı sonraki model turuna tam olarak bir kez ulaştırması gerektiğinde `api.enqueueNextTurnInjection(...)` kullanın. OpenClaw, prompt hook'larından önce kuyruğa alınmış enjeksiyonları boşaltır, süresi dolmuş enjeksiyonları düşürür ve plugin başına `idempotencyKey` ile tekilleştirir. Bu; onay devamları, ilke özetleri, arka plan izleyici deltaları ve bir sonraki turda modele görünmesi gereken ancak kalıcı sistem prompt metnine dönüşmemesi gereken komut devamları için doğru bağlantı noktasıdır.

Temizleme semantiği sözleşmenin parçasıdır. Oturum uzantısı temizleme ve runtime yaşam döngüsü temizleme callback'leri `reset`, `delete`, `disable` veya `restart` alır. Host, reset/delete/disable için sahip plugin'in kalıcı oturum uzantısı durumunu ve bekleyen sonraki tur enjeksiyonlarını kaldırır; restart kalıcı oturum durumunu korurken temizleme callback'leri plugin'lerin eski runtime üretimi için scheduler işlerini, çalışma bağlamını ve diğer bant dışı kaynakları serbest bırakmasına izin verir.

## Mesaj hook'ları

Kanal düzeyi yönlendirme ve teslim ilkesi için mesaj hook'larını kullanın:

- `message_received`: gelen içeriği, göndereni, `threadId`, `messageId`, `senderId`, isteğe bağlı run/session korelasyonunu ve metadata'yı gözlemleyin.
- `message_sending`: `content` değerini yeniden yazın veya `{ cancel: true }` döndürün.
- `message_sent`: nihai başarıyı veya hatayı gözlemleyin.

Yalnızca sesli TTS yanıtları için `content`, kanal payload'unda görünür metin/başlık olmasa bile gizli konuşulan transkripti içerebilir. Bu `content` değerini yeniden yazmak yalnızca hook tarafından görülebilen transkripti günceller; medya başlığı olarak render edilmez.

Mesaj hook bağlamları, mevcut olduğunda kararlı korelasyon alanlarını açığa çıkarır: `ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`, `ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` ve `ctx.callDepth`. Eski metadata'yı okumadan önce bu birinci sınıf alanları tercih edin.

Kanala özgü metadata kullanmadan önce tipli `threadId` ve `replyToId` alanlarını tercih edin.

Karar kuralları:

- `cancel: true` ile `message_sending` terminaldir.
- `cancel: false` ile `message_sending` karar yok olarak değerlendirilir.
- Yeniden yazılmış `content`, daha sonra bir hook teslimi iptal etmedikçe daha düşük öncelikli hook'lara devam eder.
- `message_sending`, bir iptalle birlikte `cancelReason` ve sınırlı `metadata` döndürebilir. Yeni mesaj yaşam döngüsü API'leri bunu `cancelled_by_message_sending_hook` nedeniyle bastırılmış teslim sonucu olarak açığa çıkarır; eski doğrudan teslim, uyumluluk için boş sonuç dizisi döndürmeye devam eder.
- `message_sent` yalnızca gözlem amaçlıdır. Handler hataları loglanır ve teslim sonucunu değiştirmez.

## Kurulum hook'ları

`before_install`, skill ve plugin kurulumları için yerleşik taramadan sonra çalışır. Kurulumu durdurmak için ek bulgular veya `{ block: true, blockReason }` döndürün.

`block: true` terminaldir. `block: false` karar yok olarak değerlendirilir.

## Gateway yaşam döngüsü

Gateway'e ait duruma ihtiyaç duyan plugin servisleri için `gateway_start` kullanın. Bağlam, cron incelemesi ve güncellemeleri için `ctx.config`, `ctx.workspaceDir` ve `ctx.getCron?.()` değerlerini açığa çıkarır. Uzun süre çalışan kaynakları temizlemek için `gateway_stop` kullanın.

Plugin'e ait runtime servisleri için dahili `gateway:startup` hook'una güvenmeyin.

`cron_changed`, Gateway'e ait cron yaşam döngüsü olayları için `added`, `updated`, `removed`, `started`, `finished` ve `scheduled` nedenlerini kapsayan tipli bir olay payload'u ile tetiklenir. Olay, bir `PluginHookGatewayCronJob` anlık görüntüsü (`state.nextRunAtMs`, `state.lastRunStatus` ve mevcutsa `state.lastError` dahil) ve `not-requested` | `delivered` | `not-delivered` | `unknown` değerlerinden oluşan bir `PluginHookGatewayCronDeliveryStatus` taşır. Kaldırılan olaylar hâlâ silinen iş anlık görüntüsünü taşır; böylece harici scheduler'lar durumu uzlaştırabilir. Harici uyandırma scheduler'larını senkronize ederken runtime bağlamından `ctx.getCron?.()` ve `ctx.config` kullanın ve vade kontrolleri ile yürütme için doğruluk kaynağı olarak OpenClaw'ı tutun.

## Yaklaşan kullanımdan kaldırmalar

Hook'a bitişik bazı yüzeyler kullanımdan kaldırıldı ancak hâlâ destekleniyor. Bir sonraki büyük sürümden önce geçiş yapın:

- `inbound_claim` ve `message_received` handler'larında **düz metin kanal zarfları**. Düz zarf metnini ayrıştırmak yerine `BodyForAgent` ve yapılandırılmış kullanıcı bağlamı bloklarını okuyun. Bkz. [Düz metin kanal zarfları → BodyForAgent](/tr/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** uyumluluk için kalır. Yeni plugin'ler birleşik aşama yerine `before_model_resolve` ve `before_prompt_build` kullanmalıdır.
- **`before_tool_call` içindeki `onResolution`** artık serbest biçimli `string` yerine tipli `PluginApprovalResolution` union'ını (`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`) kullanır.

Tam liste için - bellek yeteneği kaydı, provider thinking profili, harici auth provider'ları, provider keşif tipleri, görev runtime erişicileri ve `command-auth` → `command-status` yeniden adlandırması - bkz. [Plugin SDK geçişi → Etkin kullanımdan kaldırmalar](/tr/plugins/sdk-migration#active-deprecations).

## İlgili

- [Plugin SDK geçişi](/tr/plugins/sdk-migration) - etkin kullanımdan kaldırmalar ve kaldırma zaman çizelgesi
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints)
- [Dahili hook'lar](/tr/automation/hooks)
- [Plugin mimarisi iç ayrıntıları](/tr/plugins/architecture-internals)
