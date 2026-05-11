---
read_when:
    - before_tool_call, before_agent_reply, ileti kancaları veya yaşam döngüsü kancaları gerektiren bir Plugin oluşturuyorsunuz
    - Bir Plugin’den gelen araç çağrılarını engellemeniz, yeniden yazmanız veya onay gerektirmeniz gerekir
    - Dahili kancalar ile Plugin kancaları arasında karar veriyorsunuz
summary: 'Plugin kancaları: ajan, araç, mesaj, oturum ve Gateway yaşam döngüsü olaylarına müdahale edin'
title: Plugin kancaları
x-i18n:
    generated_at: "2026-05-11T20:34:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: b363b8ed7452f0d8bdb267d3eaa38f579d6d7cfb7ace2085ac35baf9b253b575
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin kancaları, OpenClaw Plugin'leri için süreç içi genişletme noktalarıdır. Bunları,
bir Plugin'in agent çalıştırmalarını, tool çağrılarını, mesaj akışını,
oturum yaşam döngüsünü, subagent yönlendirmesini, kurulumları veya Gateway
başlatmayı incelemesi ya da değiştirmesi gerektiğinde kullanın.

Komut ve Gateway olayları için operatör tarafından kurulan küçük bir `HOOK.md`
betiği istediğinizde bunun yerine [dahili kancaları](/tr/automation/hooks) kullanın;
örneğin `new`, `/reset`, `/stop`, `agent:bootstrap` veya `gateway:startup`.

## Hızlı başlangıç

Plugin girişinizden `api.on(...)` ile tipli Plugin kancaları kaydedin:

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

Kanca işleyicileri azalan `priority` sırasıyla ardışık çalışır. Aynı öncelikteki
kancalar kayıt sırasını korur.

`api.on(name, handler, opts?)` şunları kabul eder:

- `priority` - işleyici sıralaması (daha yüksek olan önce çalışır).
- `timeoutMs` - isteğe bağlı kanca başına bütçe. Ayarlandığında, kanca çalıştırıcısı
  bütçe dolduktan sonra ilgili işleyiciyi iptal eder ve yavaş kurulumun veya
  hatırlama çalışmasının çağıranın yapılandırılmış model zaman aşımını tüketmesine
  izin vermek yerine bir sonrakine geçer. Bunu atlayarak kanca çalıştırıcısının
  genel olarak uyguladığı varsayılan gözlem/karar zaman aşımını kullanın.

Operatörler Plugin kodunu yamalamadan da kanca bütçeleri ayarlayabilir:

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

`hooks.timeouts.<hookName>`, `hooks.timeoutMs` değerini geçersiz kılar; bu da
Plugin tarafından yazılmış `api.on(..., { timeoutMs })` değerini geçersiz kılar.
Yapılandırılan her değer, 600000 milisaniyeden büyük olmayan pozitif bir tam sayı
olmalıdır. Bir Plugin'in her yerde daha uzun bütçe almaması için bilinen yavaş
kancalarda kanca başına geçersiz kılmaları tercih edin.

Her kanca, o işleyiciyi kaydeden Plugin için çözümlenmiş yapılandırma olan
`event.context.pluginConfig` alır. Güncel Plugin seçeneklerine ihtiyaç duyan
kanca kararları için bunu kullanın; OpenClaw bunu, diğer Plugin'lerin gördüğü
paylaşılan olay nesnesini değiştirmeden işleyici başına enjekte eder.

## Kanca kataloğu

Kancalar genişlettikleri yüzeye göre gruplanır. **Kalın** yazılmış adlar bir
karar sonucu (engelleme, iptal, geçersiz kılma veya onay isteme) kabul eder;
diğerlerinin tümü yalnızca gözlemdir.

**Agent turu**

- `before_model_resolve` - oturum mesajları yüklenmeden önce provider veya modeli geçersiz kıl
- `agent_turn_prepare` - kuyruğa alınmış Plugin turu eklemelerini tüket ve prompt kancalarından önce aynı tur bağlamı ekle
- `before_prompt_build` - model çağrısından önce dinamik bağlam veya system prompt metni ekle
- `before_agent_start` - yalnızca uyumluluk amaçlı birleşik faz; yukarıdaki iki kancayı tercih edin
- **`before_agent_run`** - model gönderiminden önce son prompt'u ve oturum mesajlarını incele ve isteğe bağlı olarak çalıştırmayı engelle
- **`before_agent_reply`** - model turunu sentetik bir yanıt veya sessizlikle kısa devre yap
- **`before_agent_finalize`** - doğal son yanıtı incele ve bir model geçişi daha iste
- `agent_end` - son mesajları, başarı durumunu ve çalıştırma süresini gözlemle
- `heartbeat_prompt_contribution` - arka plan izleyicisi ve yaşam döngüsü Plugin'leri için yalnızca Heartbeat bağlamı ekle

**Konuşma gözlemi**

- `model_call_started` / `model_call_ended` - prompt veya yanıt içeriği olmadan temizlenmiş provider/model çağrısı meta verilerini, zamanlamayı, sonucu ve sınırlandırılmış istek kimliği hash'lerini gözlemle
- `llm_input` - provider girdisini gözlemle (system prompt, prompt, geçmiş)
- `llm_output` - provider çıktısını gözlemle

**Tool'lar**

- **`before_tool_call`** - tool parametrelerini yeniden yaz, yürütmeyi engelle veya onay iste
- `after_tool_call` - tool sonuçlarını, hataları ve süreyi gözlemle
- **`tool_result_persist`** - bir tool sonucundan üretilen assistant mesajını yeniden yaz
- **`before_message_write`** - devam eden bir mesaj yazımını incele veya engelle (nadiren)

**Mesajlar ve teslim**

- **`inbound_claim`** - agent yönlendirmesinden önce gelen bir mesajı sahiplen (sentetik yanıtlar)
- `message_received` - gelen içeriği, göndereni, thread'i ve meta verileri gözlemle
- **`message_sending`** - giden içeriği yeniden yaz veya teslimi iptal et
- `message_sent` - giden teslimin başarısını veya başarısızlığını gözlemle
- **`before_dispatch`** - kanal tesliminden önce giden bir dispatch'i incele veya yeniden yaz
- **`reply_dispatch`** - son yanıt dispatch pipeline'ına katıl

**Oturumlar ve Compaction**

- `session_start` / `session_end` - oturum yaşam döngüsü sınırlarını izle. Olayın `reason` değeri `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` veya `unknown` değerlerinden biridir. `shutdown` ve `restart` değerleri, oturumlar hâlâ etkinken süreç durdurulduğunda veya yeniden başlatıldığında gateway kapatma sonlandırıcısından tetiklenir; böylece aşağı akış Plugin'leri (bellek veya transcript depoları gibi), aksi halde yeniden başlatmalar arasında açık durumda kalacak hayalet satırları sonlandırabilir. Sonlandırıcı sınırlandırılmıştır, bu yüzden yavaş bir Plugin SIGTERM/SIGINT'i engelleyemez.
- `before_compaction` / `after_compaction` - Compaction döngülerini gözlemle veya açıklama ekle
- `before_reset` - oturum sıfırlama olaylarını gözlemle (`/reset`, programatik sıfırlamalar)

**Subagent'lar**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - subagent yönlendirmesini ve tamamlanma teslimini koordine et

**Yaşam döngüsü**

- `gateway_start` / `gateway_stop` - Plugin'e ait servisleri Gateway ile başlat veya durdur
- `cron_changed` - gateway'e ait Cron yaşam döngüsü değişikliklerini gözlemle (eklendi, güncellendi, kaldırıldı, başlatıldı, tamamlandı, zamanlandı)
- **`before_install`** - skill veya Plugin kurulum taramalarını incele ve isteğe bağlı olarak engelle

## Tool çağrısı ilkesi

`before_tool_call` şunları alır:

- `event.toolName`
- `event.params`
- isteğe bağlı `event.derivedPaths`; `apply_patch` gibi iyi bilinen tool zarfları için
  en iyi çabayla ana makineden türetilmiş hedef yol ipuçları içerir; mevcut olduğunda
  bu yollar eksik olabilir veya tool'un gerçekte dokunacağı alanı olduğundan geniş
  tahmin edebilir (örneğin bozuk veya kısmi girdilerle)
- isteğe bağlı `event.runId`
- isteğe bağlı `event.toolCallId`
- `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`, `ctx.runId`, `ctx.jobId`
  (Cron tarafından çalıştırılan işlerde ayarlanır) gibi bağlam alanları ve tanılama
  `ctx.trace`

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
- `params`, yürütme için tool parametrelerini yeniden yazar.
- `requireApproval`, agent çalıştırmasını duraklatır ve Plugin onayları üzerinden
  kullanıcıya sorar. `/approve` komutu hem exec hem de Plugin onaylarını onaylayabilir.
- Daha düşük öncelikli bir `block: true`, daha yüksek öncelikli bir kanca onay
  istemiş olsa bile hâlâ engelleyebilir.
- `onResolution`, çözümlenen onay kararını alır: `allow-once`,
  `allow-always`, `deny`, `timeout` veya `cancelled`.

Ana makine düzeyinde ilkeye ihtiyaç duyan paketli Plugin'ler
`api.registerTrustedToolPolicy(...)` ile güvenilen tool ilkeleri kaydedebilir.
Bunlar sıradan `before_tool_call` kancalarından ve harici Plugin kararlarından
önce çalışır. Bunları yalnızca çalışma alanı ilkesi, bütçe uygulama veya ayrılmış
iş akışı güvenliği gibi ana makine tarafından güvenilen kapılar için kullanın.
Harici Plugin'ler normal `before_tool_call` kancalarını kullanmalıdır.

### Tool sonucu kalıcılığı

Tool sonuçları, UI rendering, tanılama, medya yönlendirme veya Plugin'e ait
meta veriler için yapılandırılmış `details` içerebilir. `details` değerini prompt
içeriği olarak değil, çalışma zamanı meta verisi olarak ele alın:

- OpenClaw, meta verilerin model bağlamına dönüşmemesi için provider yeniden
  oynatımından ve Compaction girdisinden önce `toolResult.details` değerini çıkarır.
- Kalıcı oturum girdileri yalnızca sınırlandırılmış `details` tutar. Fazla büyük
  details, kompakt bir özet ve `persistedDetailsTruncated: true` ile değiştirilir.
- `tool_result_persist` ve `before_message_write`, son kalıcılık sınırından önce
  çalışır. Kancalar yine de döndürülen `details` değerlerini küçük tutmalı ve
  prompt ile ilgili metni yalnızca `details` içine koymaktan kaçınmalıdır; modelin
  görebileceği tool çıktısını `content` içine koyun.

## Prompt ve model kancaları

Yeni Plugin'ler için faza özgü kancaları kullanın:

- `before_model_resolve`: yalnızca güncel prompt'u ve ek meta verilerini alır.
  `providerOverride` veya `modelOverride` döndürün.
- `agent_turn_prepare`: güncel prompt'u, hazırlanmış oturum mesajlarını ve bu oturum
  için boşaltılmış tam olarak bir kez kullanılan kuyruğa alınmış eklemeleri alır.
  `prependContext` veya `appendContext` döndürün.
- `before_prompt_build`: güncel prompt'u ve oturum mesajlarını alır.
  `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` veya `appendSystemContext` döndürün.
- `heartbeat_prompt_contribution`: yalnızca Heartbeat turları için çalışır ve
  `prependContext` veya `appendContext` döndürür. Kullanıcı tarafından başlatılan
  turları değiştirmeden güncel durumu özetlemesi gereken arka plan izleyicileri
  için tasarlanmıştır.

`before_agent_start` uyumluluk için kalır. Plugin'inizin eski birleşik bir faza
bağımlı olmaması için yukarıdaki açık kancaları tercih edin.

`before_agent_run`, prompt oluşturma sonrasında ve prompt'a yerel görüntü yükleme
ile `llm_input` gözlemi dahil olmak üzere herhangi bir model girdisinden önce
çalışır. Güncel kullanıcı girdisini `prompt` olarak, yüklenmiş oturum geçmişini
`messages` içinde ve etkin system prompt'u alır. Modelin prompt'u okuyabilmesinden
önce çalıştırmayı durdurmak için `{ outcome: "block", reason, message? }` döndürün.
`reason` dahilidir; `message` kullanıcıya gösterilen ikamedir. Desteklenen tek
sonuçlar `pass` ve `block` değerleridir; desteklenmeyen karar şekilleri kapalı
başarısız olur.

Bir çalıştırma engellendiğinde, OpenClaw yalnızca ikame metni `message.content`
içinde ve engelleyen Plugin kimliği ile zaman damgası gibi hassas olmayan engel
meta verilerini depolar. Özgün kullanıcı metni transcript'te veya gelecekteki
bağlamda tutulmaz. Dahili engel nedenleri hassas kabul edilir ve transcript,
geçmiş, yayın, günlük ve tanılama payload'larından çıkarılır. Gözlemlenebilirlik
engelleyici kimliği, sonuç, zaman damgası veya güvenli bir kategori gibi temizlenmiş
alanları kullanmalıdır.

OpenClaw etkin çalıştırmayı tanımlayabildiğinde `before_agent_start` ve `agent_end`
`event.runId` içerir. Aynı değer `ctx.runId` üzerinde de kullanılabilir. Cron
tarafından çalıştırılan işler ayrıca `ctx.jobId` (kaynak Cron iş kimliği) gösterir;
böylece Plugin kancaları metrikleri, yan etkileri veya durumu belirli bir
zamanlanmış işe göre kapsamlandırabilir.

Kanal kaynaklı çalıştırmalarda `ctx.messageProvider`, `discord` veya `telegram`
gibi provider yüzeyidir; `ctx.channelId` ise OpenClaw'ın oturum anahtarından veya
teslim meta verilerinden türetebildiği durumlarda konuşma hedefi tanımlayıcısıdır.

`agent_end` bir gözlem kancasıdır ve turdan sonra fire-and-forget şeklinde çalışır.
Kanca çalıştırıcısı, takılmış bir Plugin'in veya embedding endpoint'inin kanca
promise'ini sonsuza dek beklemede bırakmaması için 30 saniyelik zaman aşımı uygular.
Zaman aşımı günlüğe yazılır ve OpenClaw devam eder; Plugin kendi abort signal'ını
da kullanmadığı sürece Plugin'e ait ağ çalışmasını iptal etmez.

`model_call_started` ve `model_call_ended`, ham istemleri, geçmişi, yanıtları, başlıkları, istek gövdelerini veya provider istek kimliklerini almaması gereken provider çağrısı telemetrisi için kullanın. Bu hook'lar `runId`, `callId`, `provider`, `model`, isteğe bağlı `api`/`transport`, terminal `durationMs`/`outcome` ve OpenClaw sınırlı bir provider request-id hash'i türetebildiğinde `upstreamRequestIdHash` gibi kararlı meta veriler içerir.

`before_agent_finalize` yalnızca bir harness doğal bir son asistan yanıtını kabul etmek üzereyken çalışır. Bu, `/stop` iptal yolu değildir ve kullanıcı bir turu iptal ettiğinde çalışmaz. Sonlandırmadan önce harness'ten bir model geçişi daha istemek için `{ action: "revise", reason }`, sonlandırmayı zorlamak için `{ action: "finalize", reason? }` döndürün veya devam etmek için sonucu atlayın. Codex native `Stop` hook'ları, OpenClaw `before_agent_finalize` kararları olarak bu hook'a aktarılır.

`action: "revise"` döndürürken, plugin'ler ek model geçişini sınırlı ve yeniden oynatma açısından güvenli hale getirmek için `retry` meta verisi ekleyebilir:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction`, harness'e gönderilen revizyon gerekçesine eklenir. `idempotencyKey`, host'un eşdeğer finalize kararları genelinde aynı plugin isteği için yeniden denemeleri saymasına olanak tanır ve `maxAttempts`, host'un doğal son yanıtla devam etmeden önce kaç ek geçişe izin vereceğini sınırlar.

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

İstemi değiştiren hook'lar ve kalıcı sonraki tur enjeksiyonları, `plugins.entries.<id>.hooks.allowPromptInjection=false` ile plugin başına devre dışı bırakılabilir.

### Oturum uzantıları ve sonraki tur enjeksiyonları

Workflow plugin'leri, küçük JSON uyumlu oturum durumunu `api.registerSessionExtension(...)` ile kalıcı hale getirebilir ve Gateway `sessions.pluginPatch` yöntemi üzerinden güncelleyebilir. Oturum satırları, kayıtlı uzantı durumunu `pluginExtensions` üzerinden yansıtarak Control UI ve diğer istemcilerin plugin iç yapılarını öğrenmeden plugin'e ait durumu işlemesini sağlar.

Bir plugin'in kalıcı bağlamı tam olarak bir kez sonraki model turuna ulaştırması gerektiğinde `api.enqueueNextTurnInjection(...)` kullanın. OpenClaw, sıraya alınmış enjeksiyonları istem hook'larından önce boşaltır, süresi dolan enjeksiyonları bırakır ve plugin başına `idempotencyKey` ile yinelenenleri kaldırır. Bu, onay sürdürmeleri, ilke özetleri, arka plan izleyici deltaları ve sonraki turda model tarafından görünür olması gereken ancak kalıcı sistem istemi metnine dönüşmemesi gereken komut devamları için doğru kesişim noktasıdır.

Temizleme semantiği sözleşmenin parçasıdır. Oturum uzantısı temizliği ve runtime lifecycle temizleme callback'leri `reset`, `delete`, `disable` veya `restart` alır. Host, reset/delete/disable için sahip plugin'in kalıcı oturum uzantısı durumunu ve bekleyen sonraki tur enjeksiyonlarını kaldırır; restart, kalıcı oturum durumunu korurken temizleme callback'leri plugin'lerin eski runtime nesli için scheduler işlerini, çalışma bağlamını ve diğer bant dışı kaynakları serbest bırakmasına olanak tanır.

## Mesaj hook'ları

Mesaj hook'larını kanal düzeyi yönlendirme ve teslim ilkesi için kullanın:

- `message_received`: gelen içeriği, göndereni, `threadId`, `messageId`, `senderId`, isteğe bağlı run/session korelasyonunu ve meta veriyi gözlemleyin.
- `message_sending`: `content` öğesini yeniden yazın veya `{ cancel: true }` döndürün.
- `message_sent`: nihai başarıyı veya başarısızlığı gözlemleyin.

Yalnızca sesli TTS yanıtları için, kanal payload'ında görünür metin/açıklama olmasa bile `content` gizli konuşulan transkripti içerebilir. Bu `content` öğesinin yeniden yazılması yalnızca hook tarafından görülebilen transkripti günceller; medya açıklaması olarak işlenmez.

Mesaj hook bağlamları, mevcut olduğunda kararlı korelasyon alanlarını açığa çıkarır: `ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`, `ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` ve `ctx.callDepth`. Eski meta veriyi okumadan önce bu birinci sınıf alanları tercih edin.

Kanala özgü meta veriyi kullanmadan önce tipli `threadId` ve `replyToId` alanlarını tercih edin.

Karar kuralları:

- `cancel: true` içeren `message_sending` terminaldir.
- `cancel: false` içeren `message_sending` karar yok olarak ele alınır.
- Yeniden yazılan `content`, daha sonra bir hook teslimatı iptal etmediği sürece daha düşük öncelikli hook'lara devam eder.
- `message_sending`, iptalle birlikte `cancelReason` ve sınırlı `metadata` döndürebilir. Yeni mesaj lifecycle API'leri bunu `cancelled_by_message_sending_hook` gerekçesiyle bastırılmış teslim sonucu olarak açığa çıkarır; eski doğrudan teslim, uyumluluk için boş sonuç dizisi döndürmeye devam eder.
- `message_sent` yalnızca gözlem amaçlıdır. Handler hataları günlüğe kaydedilir ve teslim sonucunu değiştirmez.

## Kurulum hook'ları

`before_install`, skill ve plugin kurulumları için yerleşik taramadan sonra çalışır. Ek bulgular veya kurulumu durdurmak için `{ block: true, blockReason }` döndürün.

`block: true` terminaldir. `block: false` karar yok olarak ele alınır.

## Gateway lifecycle

Gateway'e ait duruma ihtiyaç duyan plugin servisleri için `gateway_start` kullanın. Bağlam, cron inceleme ve güncellemeleri için `ctx.config`, `ctx.workspaceDir` ve `ctx.getCron?.()` alanlarını açığa çıkarır. Uzun süre çalışan kaynakları temizlemek için `gateway_stop` kullanın.

Plugin'e ait runtime servisleri için dahili `gateway:startup` hook'una güvenmeyin.

`cron_changed`, `added`, `updated`, `removed`, `started`, `finished` ve `scheduled` gerekçelerini kapsayan tipli bir event payload'ı ile gateway'e ait cron lifecycle olayları için tetiklenir. Olay, bir `PluginHookGatewayCronJob` snapshot'ı (`state.nextRunAtMs`, `state.lastRunStatus` ve mevcut olduğunda `state.lastError` dahil) ve `not-requested` | `delivered` | `not-delivered` | `unknown` değerlerinden oluşan bir `PluginHookGatewayCronDeliveryStatus` taşır. Kaldırılan olaylar da silinen iş snapshot'ını taşır, böylece harici scheduler'lar durumu uzlaştırabilir. Harici uyandırma scheduler'larını eşitlerken runtime bağlamından `ctx.getCron?.()` ve `ctx.config` kullanın ve vade denetimleri ile yürütme için OpenClaw'ı doğruluk kaynağı olarak tutun.

## Yaklaşan kullanımdan kaldırmalar

Hook'a yakın birkaç yüzey kullanımdan kaldırılmıştır ancak hâlâ desteklenmektedir. Bir sonraki majör sürümden önce geçiş yapın:

- `inbound_claim` ve `message_received` handler'larındaki **düz metin kanal zarfları**. Düz zarf metnini ayrıştırmak yerine `BodyForAgent` ve yapılandırılmış kullanıcı bağlamı bloklarını okuyun. Bkz. [Düz metin kanal zarfları → BodyForAgent](/tr/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** uyumluluk için kalır. Yeni plugin'ler, birleşik aşama yerine `before_model_resolve` ve `before_prompt_build` kullanmalıdır.
- **`before_tool_call` içindeki `onResolution`** artık serbest biçimli `string` yerine tipli `PluginApprovalResolution` birleşimini (`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`) kullanır.

Tam liste için - memory capability registration, provider thinking profile, external auth providers, provider discovery types, task runtime accessors ve `command-auth` → `command-status` yeniden adlandırması - bkz. [Plugin SDK geçişi → Aktif kullanımdan kaldırmalar](/tr/plugins/sdk-migration#active-deprecations).

## İlgili

- [Plugin SDK geçişi](/tr/plugins/sdk-migration) - aktif kullanımdan kaldırmalar ve kaldırma zaman çizelgesi
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints)
- [Dahili hook'lar](/tr/automation/hooks)
- [Plugin mimarisi iç yapıları](/tr/plugins/architecture-internals)
