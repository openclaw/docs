---
read_when:
    - '`before_tool_call`, `before_agent_reply`, mesaj kancaları veya yaşam döngüsü kancalarına ihtiyaç duyan bir Plugin oluşturuyorsunuz'
    - Bir Plugin içinden araç çağrılarını engellemeniz, yeniden yazmanız veya bunlar için onay istemeniz gerekiyor
    - Dahili kancalar ile Plugin kancaları arasında karar veriyorsunuz
summary: 'Plugin kancaları: aracı, araç, mesaj, oturum ve Gateway yaşam döngüsü olaylarını yakalayın'
title: Plugin kancaları
x-i18n:
    generated_at: "2026-04-26T11:36:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62d8c21db885abcb70c7aa940e3ce937df09d077587b153015c4c6c5169f4f1d
    source_path: plugins/hooks.md
    workflow: 15
---

Plugin kancaları, OpenClaw Plugin'leri için işlem içi genişletme noktalarıdır. Bir Plugin'in
aracı çalıştırmalarını, araç çağrılarını, mesaj akışını,
oturum yaşam döngüsünü, alt aracı yönlendirmesini, kurulumları veya Gateway başlatmayı incelemesi ya da değiştirmesi gerektiğinde bunları kullanın.

Bunun yerine, `/new`, `/reset`, `/stop`, `agent:bootstrap` veya
`gateway:startup` gibi komut ve Gateway olayları için operatör tarafından yüklenen küçük bir `HOOK.md`
betiği istiyorsanız [internal hooks](/tr/automation/hooks) kullanın.

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

Kanca işleyicileri, azalan `priority` sırasıyla art arda çalışır. Aynı öncelikteki kancalar
kayıt sırasını korur.

## Kanca kataloğu

Kancalar, genişlettikleri yüzeye göre gruplandırılır. **Kalın** yazılan adlar bir
karar sonucu kabul eder (engelleme, iptal, geçersiz kılma veya onay gerektirme); diğerlerinin tümü
yalnızca gözlem içindir.

**Aracı turu**

- `before_model_resolve` — oturum mesajları yüklenmeden önce sağlayıcıyı veya modeli geçersiz kılın
- `before_prompt_build` — model çağrısından önce dinamik bağlam veya sistem istemi metni ekleyin
- `before_agent_start` — yalnızca uyumluluk için birleşik aşama; yukarıdaki iki kancayı tercih edin
- **`before_agent_reply`** — model turunu sentetik bir yanıtla veya sessizlikle kısa devre edin
- **`before_agent_finalize`** — doğal son yanıtı inceleyin ve bir model geçişi daha isteyin
- `agent_end` — son mesajları, başarı durumunu ve çalıştırma süresini gözlemleyin

**Sohbet gözlemi**

- `model_call_started` / `model_call_ended` — istem veya yanıt içeriği olmadan temizlenmiş sağlayıcı/model çağrı meta verilerini, zamanlamayı, sonucu ve sınırlı istek kimliği karmalarını gözlemleyin
- `llm_input` — sağlayıcı girdisini gözlemleyin (sistem istemi, istem, geçmiş)
- `llm_output` — sağlayıcı çıktısını gözlemleyin

**Araçlar**

- **`before_tool_call`** — araç parametrelerini yeniden yazın, yürütmeyi engelleyin veya onay isteyin
- `after_tool_call` — araç sonuçlarını, hataları ve süreyi gözlemleyin
- **`tool_result_persist`** — bir araç sonucundan üretilen yardımcı mesajını yeniden yazın
- **`before_message_write`** — devam eden bir mesaj yazımını inceleyin veya engelleyin (nadir)

**Mesajlar ve teslimat**

- **`inbound_claim`** — aracı yönlendirmesinden önce gelen bir mesajı sahiplenin (sentetik yanıtlar)
- `message_received` — gelen içeriği, göndereni, iş parçacığını ve meta verileri gözlemleyin
- **`message_sending`** — giden içeriği yeniden yazın veya teslimatı iptal edin
- `message_sent` — giden teslimatın başarısını veya başarısızlığını gözlemleyin
- **`before_dispatch`** — kanal devrinden önce giden bir sevkiyatı inceleyin veya yeniden yazın
- **`reply_dispatch`** — son yanıt-sevkiyat işlem hattına katılın

**Oturumlar ve Compaction**

- `session_start` / `session_end` — oturum yaşam döngüsü sınırlarını izleyin
- `before_compaction` / `after_compaction` — Compaction döngülerini gözlemleyin veya not ekleyin
- `before_reset` — oturum sıfırlama olaylarını gözlemleyin (`/reset`, programatik sıfırlamalar)

**Alt aracılar**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — alt aracı yönlendirmesini ve tamamlanma teslimatını koordine edin

**Yaşam döngüsü**

- `gateway_start` / `gateway_stop` — Gateway ile birlikte Plugin'e ait hizmetleri başlatın veya durdurun
- **`before_install`** — Skills veya Plugin kurulum taramalarını inceleyin ve isteğe bağlı olarak engelleyin

## Araç çağrısı ilkesi

`before_tool_call` şunları alır:

- `event.toolName`
- `event.params`
- isteğe bağlı `event.runId`
- isteğe bağlı `event.toolCallId`
- `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (Cron tabanlı çalıştırmalarda ayarlanır) ve tanılama için `ctx.trace` gibi bağlam alanları

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

- `block: true` kesindir ve daha düşük öncelikli işleyicileri atlar.
- `block: false` karar yokmuş gibi değerlendirilir.
- `params`, yürütme için araç parametrelerini yeniden yazar.
- `requireApproval`, aracı çalıştırmasını duraklatır ve kullanıcıdan Plugin
  onayları aracılığıyla onay ister. `/approve` komutu hem yürütme hem de Plugin onaylarını onaylayabilir.
- Daha düşük öncelikli bir `block: true`, daha yüksek öncelikli bir kanca
  onay istemiş olsa bile yine de engelleyebilir.
- `onResolution`, çözümlenen onay kararını alır — `allow-once`,
  `allow-always`, `deny`, `timeout` veya `cancelled`.

### Araç sonucu kalıcılığı

Araç sonuçları, UI oluşturma, tanılama,
medya yönlendirme veya Plugin'e ait meta veriler için yapılandırılmış `details` içerebilir. `details` alanını,
istem içeriği değil çalışma zamanı meta verisi olarak değerlendirin:

- OpenClaw, meta verilerin model bağlamı haline gelmemesi için sağlayıcı tekrar oynatımı ve Compaction
  girdisinden önce `toolResult.details` alanını çıkarır.
- Kalıcı oturum girdileri yalnızca sınırlı `details` alanını korur. Aşırı büyük ayrıntılar,
  kısa bir özetle değiştirilir ve `persistedDetailsTruncated: true` ayarlanır.
- `tool_result_persist` ve `before_message_write`, son
  kalıcılık sınırından önce çalışır. Kancalar yine de döndürülen `details` alanını küçük tutmalı ve
  yalnızca `details` içine istem açısından ilgili metin yerleştirmekten kaçınmalıdır; modele görünür araç çıktısını
  `content` içine koyun.

## İstem ve model kancaları

Yeni Plugin'ler için aşamaya özgü kancaları kullanın:

- `before_model_resolve`: yalnızca mevcut istemi ve ek
  meta verilerini alır. `providerOverride` veya `modelOverride` döndürün.
- `before_prompt_build`: mevcut istemi ve oturum mesajlarını alır.
  `prependContext`, `systemPrompt`, `prependSystemContext` veya
  `appendSystemContext` döndürün.

`before_agent_start`, uyumluluk için korunmaktadır. Yukarıdaki açık kancaları tercih edin
böylece Plugin'iniz eski birleşik bir aşamaya bağımlı olmaz.

`before_agent_start` ve `agent_end`, OpenClaw etkin çalıştırmayı
tanımlayabildiğinde `event.runId` içerir. Aynı değer `ctx.runId` üzerinde de kullanılabilir.
Cron tabanlı çalıştırmalar ayrıca `ctx.jobId` (kaynak Cron iş kimliği) alanını da sunar; böylece
Plugin kancaları metrikleri, yan etkileri veya durumu belirli bir zamanlanmış
işe göre kapsamlandırabilir.

Ham istemleri, geçmişi, yanıtları, üstbilgileri, istek
gövdelerini veya sağlayıcı istek kimliklerini almaması gereken sağlayıcı çağrısı telemetrisi
için `model_call_started` ve `model_call_ended` kullanın. Bu kancalar
`runId`, `callId`, `provider`, `model`, isteğe bağlı `api`/`transport`, son durum
`durationMs`/`outcome` ve OpenClaw sınırlı bir sağlayıcı istek kimliği karması türetebildiğinde
`upstreamRequestIdHash` gibi kararlı meta verileri içerir.

`before_agent_finalize`, yalnızca bir harness doğal bir
son yardımcı yanıtını kabul etmek üzereyken çalışır. Bu, `/stop` iptal yolu değildir ve
kullanıcı bir turu iptal ettiğinde çalışmaz. Sonlandırmadan önce harness'tan
bir model geçişi daha istemek için `{ action: "revise", reason }`,
sonlandırmayı zorlamak için `{ action:
"finalize", reason? }` döndürün veya devam etmek için sonuç döndürmeyin.
Codex yerel `Stop` kancaları, OpenClaw
`before_agent_finalize` kararları olarak bu kancaya iletilir.

`llm_input`, `llm_output`,
`before_agent_finalize` veya `agent_end` gerektiren paketlenmemiş olmayan Plugin'ler şunu ayarlamalıdır:

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

İstemi değiştiren kancalar, Plugin başına
`plugins.entries.<id>.hooks.allowPromptInjection=false` ile devre dışı bırakılabilir.

## Mesaj kancaları

Kanal düzeyinde yönlendirme ve teslimat ilkesi için mesaj kancalarını kullanın:

- `message_received`: gelen içeriği, göndereni, `threadId`,
  `messageId`, `senderId`, isteğe bağlı çalıştırma/oturum ilişkisini ve meta verileri gözlemleyin.
- `message_sending`: `content` alanını yeniden yazın veya `{ cancel: true }` döndürün.
- `message_sent`: son başarıyı veya başarısızlığı gözlemleyin.

Yalnızca sesli TTS yanıtlarında, kanal yükünde görünür metin/açıklama olmasa bile
`content`, gizli konuşma dökümünü içerebilir. Bu `content` alanını yeniden yazmak,
yalnızca kancaya görünür dökümü günceller; medya açıklaması olarak işlenmez.

Mesaj kancası bağlamları, kullanılabildiğinde kararlı ilişkilendirme alanlarını açığa çıkarır:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` ve `ctx.callDepth`. Eski meta verileri
okumadan önce bu birinci sınıf alanları tercih edin.

Kanala özgü meta verileri kullanmadan önce türlenmiş `threadId` ve `replyToId` alanlarını tercih edin.

Karar kuralları:

- `message_sending` ile `cancel: true` kesindir.
- `message_sending` ile `cancel: false`, karar yokmuş gibi değerlendirilir.
- Yeniden yazılmış `content`, daha sonraki bir kanca teslimatı iptal etmediği sürece
  daha düşük öncelikli kancalara aktarılmaya devam eder.

## Kurulum kancaları

`before_install`, Skills ve Plugin kurulumları için yerleşik taramadan sonra çalışır.
Ek bulgular veya kurulumu durdurmak için `{ block: true, blockReason }` döndürün.

`block: true` kesindir. `block: false`, karar yokmuş gibi değerlendirilir.

## Gateway yaşam döngüsü

Gateway'e ait duruma ihtiyaç duyan Plugin hizmetleri için `gateway_start` kullanın. Bağlam,
Cron inceleme ve güncellemeleri için `ctx.config`, `ctx.workspaceDir` ve `ctx.getCron?.()` alanlarını açığa çıkarır. Uzun süre çalışan kaynakları temizlemek için `gateway_stop` kullanın.

Plugin'e ait çalışma zamanı hizmetleri için dahili `gateway:startup` kancasına güvenmeyin.

## Yaklaşan kullanımdan kaldırmalar

Kanca ile ilişkili birkaç yüzey kullanımdan kaldırılmıştır ancak hâlâ desteklenmektedir. Bir sonraki büyük sürümden önce geçiş yapın:

- **`inbound_claim` ve `message_received`
  işleyicilerindeki düz metin kanal zarfları**. Düz zarf metnini ayrıştırmak yerine `BodyForAgent` ve yapılandırılmış kullanıcı bağlamı bloklarını okuyun. Bkz.
  [Düz metin kanal zarfları → BodyForAgent](/tr/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** uyumluluk için korunmaktadır. Yeni Plugin'ler birleşik
  aşama yerine `before_model_resolve` ve `before_prompt_build` kullanmalıdır.
- **`before_tool_call` içindeki `onResolution`** artık serbest biçimli bir `string`
  yerine türlenmiş `PluginApprovalResolution` birleşimini kullanır
  (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`).

Bellek yeteneği kaydı, sağlayıcı düşünme
profili, harici kimlik doğrulama sağlayıcıları, sağlayıcı keşif türleri, görev çalışma zamanı
erişimcileri ve `command-auth` → `command-status` yeniden adlandırması dahil tam liste için
[Plugin SDK migration → Etkin kullanımdan kaldırmalar](/tr/plugins/sdk-migration#active-deprecations) sayfasına bakın.

## İlgili

- [Plugin SDK migration](/tr/plugins/sdk-migration) — etkin kullanımdan kaldırmalar ve kaldırma zaman çizelgesi
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin SDK genel bakış](/tr/plugins/sdk-overview)
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints)
- [Internal hooks](/tr/automation/hooks)
- [Plugin architecture internals](/tr/plugins/architecture-internals)
