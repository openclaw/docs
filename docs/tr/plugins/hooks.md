---
read_when:
    - before_tool_call, before_agent_reply, ileti kancaları veya yaşam döngüsü kancaları gerektiren bir Plugin oluşturuyorsunuz
    - Bir Plugin tarafından yapılan araç çağrılarını engellemeniz, yeniden yazmanız veya onay gerektirmeniz gerekir
    - Dahili hook’lar ile plugin hook’ları arasında karar veriyorsunuz
summary: 'Plugin kancaları: ajan, araç, ileti, oturum ve Gateway yaşam döngüsü olaylarını yakalayın'
title: Plugin kancaları
x-i18n:
    generated_at: "2026-06-28T00:54:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c2db0963c85d15fd391fb575f981992ffd6d77c098bd78cac08be390caea931
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin hook'ları, OpenClaw Plugin'leri için süreç içi genişletme noktalarıdır. Bir Plugin'in ajan çalıştırmalarını, araç çağrılarını, mesaj akışını, oturum yaşam döngüsünü, alt ajan yönlendirmesini, kurulumları veya Gateway başlatmasını incelemesi ya da değiştirmesi gerektiğinde bunları kullanın.

`/new`, `/reset`, `/stop`, `agent:bootstrap` veya `gateway:startup` gibi komut ve Gateway olayları için operatör tarafından kurulmuş küçük bir `HOOK.md` betiği istediğinizde bunun yerine [dahili hook'ları](/tr/automation/hooks) kullanın.

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

- `priority` - işleyici sıralaması (daha yüksek olan önce çalışır).
- `timeoutMs` - isteğe bağlı hook başına bütçe. Ayarlandığında, hook çalıştırıcısı bütçe dolduktan sonra o işleyiciyi iptal eder ve yavaş kurulum ya da hatırlama işinin çağıranın yapılandırılmış model zaman aşımını tüketmesine izin vermek yerine sonrakiyle devam eder. Hook çalıştırıcısının genel olarak uyguladığı varsayılan gözlem/karar zaman aşımını kullanmak için bunu atlayın.

Operatörler Plugin kodunu yamamadan hook bütçeleri de ayarlayabilir:

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

`hooks.timeouts.<hookName>`, `hooks.timeoutMs` değerini geçersiz kılar; o da Plugin tarafından yazılmış `api.on(..., { timeoutMs })` değerini geçersiz kılar. Yapılandırılan her değer, 600000 milisaniyeden büyük olmayan pozitif bir tam sayı olmalıdır. Bilinen yavaş hook'lar için hook başına geçersiz kılmaları tercih edin; böylece bir Plugin her yerde daha uzun bütçe almaz.

Her hook, o işleyiciyi kaydeden Plugin için çözümlenmiş yapılandırma olan `event.context.pluginConfig` değerini alır. Geçerli Plugin seçeneklerine ihtiyaç duyan hook kararları için bunu kullanın; OpenClaw bunu diğer Plugin'lerin gördüğü paylaşılan olay nesnesini değiştirmeden her işleyici için enjekte eder.

## Hook kataloğu

Hook'lar genişlettikleri yüzeye göre gruplanır. **Kalın** adlar bir karar sonucu (engelleme, iptal, geçersiz kılma veya onay isteme) kabul eder; diğerlerinin tümü yalnızca gözlem içindir.

**Ajan turu**

- `before_model_resolve` - oturum mesajları yüklenmeden önce sağlayıcıyı veya modeli geçersiz kılın
- `agent_turn_prepare` - kuyruğa alınmış Plugin tur enjeksiyonlarını tüketin ve istem hook'larından önce aynı tura bağlam ekleyin
- `before_prompt_build` - model çağrısından önce dinamik bağlam veya sistem istemi metni ekleyin
- `before_agent_start` - yalnızca uyumluluk amaçlı birleşik aşama; yukarıdaki iki hook'u tercih edin
- **`before_agent_run`** - model gönderiminden önce son istemi ve oturum mesajlarını inceleyin ve isteğe bağlı olarak çalıştırmayı engelleyin
- **`before_agent_reply`** - model turunu sentetik bir yanıtla veya sessizlikle kısa devre edin
- **`before_agent_finalize`** - doğal son yanıtı inceleyin ve bir model geçişi daha isteyin
- `agent_end` - son mesajları, başarı durumunu ve çalıştırma süresini gözlemleyin
- `heartbeat_prompt_contribution` - arka plan izleyici ve yaşam döngüsü Plugin'leri için yalnızca Heartbeat bağlamı ekleyin

**Konuşma gözlemi**

- `model_call_started` / `model_call_ended` - istem veya yanıt içeriği olmadan temizlenmiş sağlayıcı/model çağrısı meta verilerini, zamanlamayı, sonucu ve sınırlı istek kimliği hash'lerini gözlemleyin
- `llm_input` - sağlayıcı girdisini (sistem istemi, istem, geçmiş) gözlemleyin
- `llm_output` - sağlayıcı çıktısını, kullanımı ve mevcut olduğunda çözümlenmiş `contextTokenBudget` değerini gözlemleyin

**Araçlar**

- **`before_tool_call`** - araç parametrelerini yeniden yazın, yürütmeyi engelleyin veya onay isteyin
- `after_tool_call` - araç sonuçlarını, hataları ve süreyi gözlemleyin
- `resolve_exec_env` - Plugin'in sahip olduğu ortam değişkenlerini `exec` için katkıda bulunun
- **`tool_result_persist`** - araç sonucundan üretilen asistan mesajını yeniden yazın
- **`before_message_write`** - devam eden bir mesaj yazımını inceleyin veya engelleyin (nadir)

**Mesajlar ve teslim**

- **`inbound_claim`** - ajan yönlendirmesinden önce gelen bir mesajı sahiplenin (sentetik yanıtlar)
- `message_received` — gelen içeriği, göndereni, iş parçacığını ve meta verileri gözlemleyin
- **`message_sending`** — giden içeriği yeniden yazın veya teslimatı iptal edin
- **`reply_payload_sending`** — teslimattan önce normalleştirilmiş yanıt yüklerini değiştirin veya iptal edin
- `message_sent` — giden teslimat başarısını veya hatasını gözlemleyin
- **`before_dispatch`** - kanal devrinden önce giden bir dispatch'i inceleyin veya yeniden yazın
- **`reply_dispatch`** - son yanıt dispatch hattına katılın

**Oturumlar ve Compaction**

- `session_start` / `session_end` - oturum yaşam döngüsü sınırlarını takip edin. Olayın `reason` değeri `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` veya `unknown` değerlerinden biridir. `shutdown` ve `restart` değerleri, oturumlar hâlâ etkinken süreç durdurulduğunda veya yeniden başlatıldığında Gateway kapatma sonlandırıcısından tetiklenir; böylece aşağı akış Plugin'leri (bellek veya transkript depoları gibi), aksi halde yeniden başlatmalar arasında açık durumda kalacak hayalet satırları sonlandırabilir. Sonlandırıcı sınırlıdır, bu nedenle yavaş bir Plugin SIGTERM/SIGINT'i engelleyemez.
- `before_compaction` / `after_compaction` - Compaction döngülerini gözlemleyin veya açıklama ekleyin
- `before_reset` - oturum sıfırlama olaylarını gözlemleyin (`/reset`, programatik sıfırlamalar)

**Alt ajanlar**

- `subagent_spawned` / `subagent_ended` - alt ajan başlatmayı ve tamamlanmayı gözlemleyin.
- `subagent_delivery_target` - çekirdek oturum bağlaması bir rota yansıtamadığında tamamlama teslimi için uyumluluk hook'u.
- `subagent_spawning` - kullanımdan kaldırılmış uyumluluk hook'u. Çekirdek artık `subagent_spawned` tetiklenmeden önce kanal oturum bağlama bağdaştırıcıları üzerinden `thread: true` alt ajan bağlamalarını hazırlar.
- `subagent_spawned`, OpenClaw başlatmadan önce alt oturumun yerel modelini çözdüğünde `resolvedModel` ve `resolvedProvider` içerir.
- `subagent_ended`, `targetSessionKey` (kimlik — bu, `subagent_spawned.childSessionKey` ile eşleşir), `targetKind` (`"subagent"` veya `"acp"`), `reason`, isteğe bağlı `outcome` (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` veya `"deleted"`), isteğe bağlı `error`, `runId`, `endedAt`, `accountId` ve `sendFarewell` taşır. `agentId` veya `childSessionKey` içermez; karşılık gelen `subagent_spawned` olayıyla ilişkilendirmek için `targetSessionKey` kullanın.

**Yaşam döngüsü**

- `gateway_start` / `gateway_stop` - Gateway ile Plugin'in sahip olduğu hizmetleri başlatın veya durdurun
- `deactivate` - `gateway_stop` için kullanımdan kaldırılmış uyumluluk takma adı; yeni Plugin'lerde `gateway_stop` kullanın
- `cron_changed` - Gateway'in sahip olduğu Cron yaşam döngüsü değişikliklerini gözlemleyin (eklendi, güncellendi, kaldırıldı, başlatıldı, tamamlandı, zamanlandı)
- **`before_install`** - yüklenmiş bir Plugin çalışma zamanından hazırlanmış Skills veya Plugin kurulum malzemesini inceleyin

## Çalışma zamanı hook'larında hata ayıklama

Bir Plugin'in bir ajan turu için sağlayıcıyı veya modeli değiştirmesi gerektiğinde `before_model_resolve` kullanın. Bu, model çözümlemesinden önce çalışır; `llm_output` yalnızca bir model denemesi asistan çıktısı ürettikten sonra çalışır.

Etkili oturum modelinin kanıtı için çalışma zamanı kayıtlarını inceleyin, ardından `openclaw sessions` veya Gateway oturum/durum yüzeylerini kullanın. Sağlayıcı yüklerinde hata ayıklarken Gateway'i `--raw-stream` ve `--raw-stream-path <path>` ile başlatın; bu bayraklar ham model akış olaylarını bir jsonl dosyasına yazar.

## Araç çağrısı ilkesi

`before_tool_call` şunları alır:

- `event.toolName`
- `event.params`
- isteğe bağlı `event.toolKind` ve `event.toolInputKind`; bilerek aynı adları paylaşan araçlar için host tarafından yetkili ayırt ediciler. Örneğin, dış kod modu `exec` çağrıları `toolKind: "code_mode_exec"` kullanır ve giriş dili bilindiğinde `toolInputKind: "javascript" | "typescript"` içerir
- isteğe bağlı `event.derivedPaths`; `apply_patch` gibi iyi bilinen araç zarfları için host tarafından en iyi çabayla türetilmiş hedef yol ipuçlarını içerir. Mevcut olduğunda bu yollar eksik olabilir veya aracın gerçekten dokunacağı şeyi fazla yaklaşık gösterebilir (örneğin hatalı biçimlendirilmiş veya kısmi girdilerle)
- isteğe bağlı `event.runId`
- isteğe bağlı `event.toolCallId`
- `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`, `ctx.runId`, `ctx.jobId` (Cron tarafından sürülen çalıştırmalarda ayarlanır), `ctx.toolKind`, `ctx.toolInputKind` ve tanılama `ctx.trace` gibi bağlam alanları

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
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Tipli yaşam döngüsü hook'ları için hook koruma davranışı:

- `block: true` terminaldir ve daha düşük öncelikli işleyicileri atlar.
- `block: false` karar yok olarak değerlendirilir.
- `params`, yürütme için araç parametrelerini yeniden yazar.
- `requireApproval`, ajan çalıştırmasını duraklatır ve Plugin onayları üzerinden kullanıcıya sorar. `/approve` komutu hem exec hem de Plugin onaylarını onaylayabilir. Codex app-server report-mode yerel `PreToolUse` aktarımlarında bu, eşleşen app-server onay isteğine ertelenir; bkz. [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime#hook-boundaries).
- Daha düşük öncelikli bir `block: true`, daha yüksek öncelikli bir hook onay istemiş olsa bile hâlâ engelleyebilir.
- `onResolution`, çözümlenmiş onay kararını alır - `allow-once`, `allow-always`, `deny`, `timeout` veya `cancelled`.

Onay yönlendirme, karar davranışı ve `requireApproval` öğesinin isteğe bağlı araçlar veya exec onayları yerine ne zaman kullanılacağı için [Plugin izin istekleri](/tr/plugins/plugin-permission-requests) sayfasına bakın.

Host düzeyinde ilkeye ihtiyaç duyan Plugin'ler, `api.registerTrustedToolPolicy(...)` ile güvenilir araç ilkeleri kaydedebilir. Bunlar sıradan `before_tool_call` hook'larından ve normal hook kararlarından önce çalışır. Paketlenmiş güvenilir ilkeler önce çalışır; kurulu Plugin güvenilir ilkeleri ardından Plugin yükleme sırasında çalışır; sıradan `before_tool_call` hook'ları bunlardan sonra çalışır. Paketlenmiş Plugin'ler mevcut güvenilir ilke yolunu korur. Kurulu Plugin'ler açıkça etkinleştirilmeli ve her ilke kimliğini `contracts.trustedToolPolicies` içinde bildirmelidir; bildirilmemiş kimlikler kayıttan önce reddedilir. İlke kimlikleri kaydeden Plugin'e kapsamlanır, bu nedenle farklı Plugin'ler aynı yerel kimliği yeniden kullanabilir. Bu katmanı yalnızca çalışma alanı ilkesi, bütçe zorlaması veya ayrılmış iş akışı güvenliği gibi host tarafından güvenilen kapılar için kullanın.

### Exec ortamı hook'u

`resolve_exec_env`, temel exec ortamı oluşturulduktan ve komut çalışmadan önce Plugin'lerin `exec` araç çağrılarına ortam değişkenleri katkıda bulunmasını sağlar. Şunları alır:

- `event.sessionKey`
- `event.toolName`, şu anda her zaman `"exec"`
- `event.host`, `"gateway"`, `"sandbox"` veya `"node"` değerlerinden biri
- `ctx.agentId`, `ctx.sessionKey`, `ctx.messageProvider` ve `ctx.channelId` gibi bağlam alanları

Exec ortamına birleştirmek için bir `Record<string, string>` döndürün. İşleyiciler öncelik sırasıyla çalışır ve sonraki hook sonuçları aynı anahtar için önceki hook sonuçlarını geçersiz kılar.

Hook çıktısı birleştirilmeden önce host exec ortam anahtarı ilkesi üzerinden filtrelenir. Geçersiz anahtarlar, `PATH` ve `LD_*`, `DYLD_*`, `NODE_OPTIONS`, proxy değişkenleri ve TLS override değişkenleri gibi tehlikeli host override anahtarları atılır. Filtrelenmiş plugin env, gateway onay/denetim meta verilerine eklenir ve node-host yürütme isteklerine iletilir.

### Araç sonucu kalıcılığı

Araç sonuçları UI işleme, tanılama, medya yönlendirme veya plugin sahipli meta veriler için yapılandırılmış `details` içerebilir. `details` alanını prompt içeriği olarak değil, runtime meta verisi olarak ele alın:

- OpenClaw, meta verilerin model bağlamına dönüşmemesi için provider yeniden oynatmasından ve compaction girdisinden önce `toolResult.details` alanını çıkarır.
- Kalıcı session girdileri yalnızca sınırlandırılmış `details` tutar. Aşırı büyük ayrıntılar kompakt bir özet ve `persistedDetailsTruncated: true` ile değiştirilir.
- `tool_result_persist` ve `before_message_write`, son kalıcılık sınırından önce çalışır. Hook'lar yine de döndürülen `details` alanını küçük tutmalı ve prompt ile ilgili metni yalnızca `details` içine koymaktan kaçınmalıdır; modelin görebileceği araç çıktısını `content` içine koyun.

## Prompt ve model hook'ları

Yeni plugin'ler için faza özgü hook'ları kullanın:

- `before_model_resolve`: yalnızca geçerli prompt ve ek meta verilerini alır. `providerOverride` veya `modelOverride` döndürün.
- `agent_turn_prepare`: geçerli prompt'u, hazırlanmış session mesajlarını ve bu session için boşaltılmış tam olarak bir kez kuyruğa alınmış enjeksiyonları alır. `prependContext` veya `appendContext` döndürün.
- `before_prompt_build`: geçerli prompt'u ve session mesajlarını alır. `prependContext`, `appendContext`, `systemPrompt`, `prependSystemContext` veya `appendSystemContext` döndürün.
- `heartbeat_prompt_contribution`: yalnızca heartbeat turn'leri için çalışır ve `prependContext` veya `appendContext` döndürür. Kullanıcı tarafından başlatılan turn'leri değiştirmeden geçerli durumu özetlemesi gereken arka plan izleyicileri için tasarlanmıştır.

`before_agent_start` uyumluluk için kalır. Plugin'inizin eski birleşik bir faza bağımlı olmaması için yukarıdaki açık hook'ları tercih edin.

`before_agent_run`, prompt oluşturulduktan sonra ve prompt'a yerel görüntü yükleme ile `llm_input` gözlemi dahil olmak üzere herhangi bir model girdisinden önce çalışır. Geçerli kullanıcı girdisini `prompt` olarak, yüklenmiş session geçmişini `messages` içinde ve etkin sistem prompt'unu alır. Model prompt'u okuyamadan çalıştırmayı durdurmak için `{ outcome: "block", reason, message? }` döndürün. `reason` içseldir; `message` kullanıcıya gösterilen değişim metnidir. Desteklenen tek sonuçlar `pass` ve `block` değerleridir; desteklenmeyen karar şekilleri güvenli şekilde kapalı başarısız olur.

Bir çalışma engellendiğinde OpenClaw, `message.content` içinde yalnızca değişim metnini ve engelleyen plugin id'si ile zaman damgası gibi hassas olmayan engelleme meta verilerini saklar. Özgün kullanıcı metni transcript'te veya gelecekteki bağlamda tutulmaz. İç engelleme nedenleri hassas kabul edilir ve transcript, geçmiş, broadcast, log ve tanılama payload'larından hariç tutulur. Observability; engelleyici id'si, sonuç, zaman damgası veya güvenli kategori gibi arındırılmış alanları kullanmalıdır.

`before_agent_start` ve `agent_end`, OpenClaw etkin çalışmayı belirleyebildiğinde `event.runId` içerir. Aynı değer `ctx.runId` üzerinde de kullanılabilir. Cron tarafından yürütülen çalışmalar ayrıca `ctx.jobId` değerini (kaynak cron işi id'si) açığa çıkarır; böylece plugin hook'ları metrikleri, yan etkileri veya durumu belirli bir zamanlanmış işe kapsamlayabilir.

Kanal kaynaklı çalışmalarda `ctx.channel` ve `ctx.messageProvider`, `discord` veya `telegram` gibi provider yüzeyini tanımlar; `ctx.channelId` ise OpenClaw bunu session anahtarından veya teslim meta verilerinden türetebildiğinde konuşma hedef tanımlayıcısıdır.

Gönderen kimliği kullanılabilir olduğunda agent hook bağlamları ayrıca şunları içerir:

- `ctx.senderId` — kanal kapsamlı gönderen ID'si (ör. Feishu `open_id`, Discord kullanıcı ID'si). Çalışma, bilinen gönderen meta verilerine sahip bir kullanıcı mesajından kaynaklandığında doldurulur.
- `ctx.chatId` — taşıma yerel konuşma tanımlayıcısı (ör. Feishu `chat_id`, Telegram `chat_id`). Kaynak kanal yerel bir konuşma ID'si sağladığında doldurulur.
- `ctx.channelContext.sender.id` — `ctx.senderId` ile aynı gönderen ID'si; plugin'lerin kanala özgü alanlarla genişletebileceği, kanal sahipli bir nesnenin altında bulunur.
- `ctx.channelContext.chat.id` — `ctx.chatId` ile aynı konuşma ID'si; plugin'lerin kanala özgü alanlarla genişletebileceği, kanal sahipli bir nesnenin altında bulunur.

Core yalnızca iç içe `id` alanlarını tanımlar. Inbound helper üzerinden daha zengin gönderen veya sohbet meta verileri geçiren kanal plugin'leri, `openclaw/plugin-sdk/channel-inbound` üzerinden `PluginHookChannelSenderContext` veya `PluginHookChannelChatContext` öğesini genişletebilir:

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

Kanal plugin'leri bu alanları inbound SDK helper üzerinden geçirir:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Bu alanlar isteğe bağlıdır ve sistem kaynaklı çalışmalarda (heartbeat, cron, exec-event) bulunmaz.

`ctx.senderExternalId`, eski plugin'ler için kullanımdan kaldırılmış bir kaynak uyumluluğu alanı olarak kalır. Core bunu doldurmaz; yeni kanala özgü gönderen kimlikleri, modül genişletme yoluyla `ctx.channelContext.sender` altında yaşamalıdır.

`agent_end` bir gözlem hook'udur. Gateway ve kalıcı harness yolları bunu turn'den sonra fire-and-forget çalıştırırken, kısa ömürlü tek seferlik CLI yolları process cleanup'tan önce hook promise'ini bekler; böylece güvenilir plugin'ler terminal observability verilerini aktarabilir veya durum yakalayabilir. Hook runner 30 saniyelik zaman aşımı uygular; böylece takılmış bir plugin veya embedding endpoint'i hook promise'ini sonsuza dek beklemede bırakamaz. Zaman aşımı loglanır ve OpenClaw devam eder; plugin kendi abort sinyalini de kullanmadığı sürece plugin sahipli ağ işini iptal etmez.

Ham prompt'ları, geçmişi, yanıtları, header'ları, istek gövdelerini veya provider istek ID'lerini almaması gereken provider-call telemetrisi için `model_call_started` ve `model_call_ended` kullanın. Bu hook'lar `runId`, `callId`, `provider`, `model`, isteğe bağlı `api`/`transport`, terminal `durationMs`/`outcome` ve OpenClaw sınırlandırılmış bir provider request-id hash'i türetebildiğinde `upstreamRequestIdHash` gibi kararlı meta verileri içerir. Runtime context-window meta verilerini çözdüğünde hook event'i ve bağlamı ayrıca model/config/agent sınırlarından sonraki etkin token bütçesi olan `contextTokenBudget` değerini ve daha düşük bir sınır uygulandığında `contextWindowSource` ile `contextWindowReferenceTokens` değerlerini içerir.

`before_agent_finalize` yalnızca bir harness doğal bir son assistant yanıtını kabul etmek üzereyken çalışır. Bu, `/stop` iptal yolu değildir ve kullanıcı bir turn'ü durdurduğunda çalışmaz. Harness'ten sonlandırmadan önce bir model geçişi daha istemek için `{ action: "revise", reason }`, sonlandırmayı zorlamak için `{ action:
"finalize", reason? }` döndürün veya devam etmek için sonuç döndürmeyin. Codex yerel `Stop` hook'ları bu hook'a OpenClaw `before_agent_finalize` kararları olarak aktarılır.

`action: "revise"` döndürürken plugin'ler, ekstra model geçişini sınırlandırılmış ve yeniden oynatmaya güvenli yapmak için `retry` meta verilerini ekleyebilir:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction`, harness'e gönderilen revizyon nedenine eklenir. `idempotencyKey`, host'un eşdeğer finalize kararları arasında aynı plugin isteği için retry saymasını sağlar ve `maxAttempts`, host'un doğal son yanıtla devam etmeden önce kaç ekstra geçişe izin vereceğini sınırlar.

Ham konuşma hook'larına (`before_model_resolve`, `before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`, `agent_end` veya `before_agent_run`) ihtiyaç duyan paketlenmemiş plugin'ler şunu ayarlamalıdır:

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

Prompt'u değiştiren hook'lar ve kalıcı sonraki turn enjeksiyonları, plugin başına `plugins.entries.<id>.hooks.allowPromptInjection=false` ile devre dışı bırakılabilir.

### Session genişletmeleri ve sonraki turn enjeksiyonları

Workflow plugin'leri, `api.registerSessionExtension(...)` ile küçük JSON uyumlu session durumu kalıcılaştırabilir ve bunu Gateway `sessions.pluginPatch` yöntemi üzerinden güncelleyebilir. Session satırları kayıtlı genişletme durumunu `pluginExtensions` üzerinden projekte eder; böylece Control UI ve diğer istemciler, plugin iç detaylarını öğrenmeden plugin sahipli durumu işleyebilir.

Bir plugin'in kalıcı bağlamı tam olarak bir kez sonraki model turn'üne ulaştırması gerektiğinde `api.enqueueNextTurnInjection(...)` kullanın. OpenClaw kuyruğa alınmış enjeksiyonları prompt hook'larından önce boşaltır, süresi dolmuş enjeksiyonları atar ve plugin başına `idempotencyKey` ile tekilleştirir. Onay devamları, ilke özetleri, arka plan izleyici deltaları ve sonraki turn'de modele görünmesi gereken ancak kalıcı sistem prompt metnine dönüşmemesi gereken komut devamları için doğru seam budur.

Cleanup semantiği sözleşmenin bir parçasıdır. Session genişletme cleanup ve runtime yaşam döngüsü cleanup callback'leri `reset`, `delete`, `disable` veya `restart` alır. Host, reset/delete/disable için sahip plugin'in kalıcı session genişletme durumunu ve bekleyen sonraki turn enjeksiyonlarını kaldırır; restart kalıcı session durumunu tutarken cleanup callback'leri plugin'lerin eski runtime nesli için scheduler işlerini, çalışma bağlamını ve diğer out-of-band kaynakları serbest bırakmasına olanak tanır.

## Mesaj hook'ları

Kanal düzeyi yönlendirme ve teslim ilkesi için mesaj hook'larını kullanın:

- `message_received`: gelen içeriği, göndereni, `threadId`, `messageId`, `senderId`, isteğe bağlı çalışma/session korelasyonunu ve meta verileri gözlemler.
- `message_sending`: `content` değerini yeniden yazar veya `{ cancel: true }` döndürür.
- `reply_payload_sending`: normalleştirilmiş `ReplyPayload` nesnelerini (`presentation`, `delivery`, medya ref'leri ve metin dahil) yeniden yazar veya `{ cancel: true }` döndürür.
- `message_sent`: son başarıyı veya hatayı gözlemler.

Yalnızca sesli TTS yanıtları için, kanal payload'ında görünür metin/açıklama olmasa bile `content` gizli konuşulan transcript'i içerebilir. Bu `content` değerini yeniden yazmak yalnızca hook tarafından görülebilen transcript'i günceller; medya açıklaması olarak işlenmez.

`reply_payload_sending` event'leri, mümkün olan en iyi canlı turn başına model/kullanım/bağlam snapshot'ı olan `usageState` içerebilir. Kalıcı teslim, kurtarılmış yeniden oynatma ve kesin çalışma korelasyonu olmayan yanıtlar bunu atlar.

Mesaj hook bağlamları kullanılabilir olduğunda kararlı korelasyon alanlarını açığa çıkarır:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` ve `ctx.callDepth`. Inbound ve `before_dispatch` bağlamları, kanal görünürlük filtreli alıntılanmış mesaj verisine sahip olduğunda yanıt meta verilerini de açığa çıkarır: `replyToId`, `replyToIdFull`, `replyToBody`, `replyToSender` ve `replyToIsQuote`. Eski meta verileri okumadan önce bu birinci sınıf alanları tercih edin.

Kanala özgü meta verileri kullanmadan önce yazılmış `threadId` ve `replyToId` alanlarını tercih edin.

Karar kuralları:

- `cancel: true` ile `message_sending` terminaldir.
- `cancel: false` ile `message_sending` karar yok olarak değerlendirilir.
- Yeniden yazılan `content`, daha sonra gelen bir hook teslimatı iptal etmediği sürece daha düşük öncelikli hook'lara devam eder.
- `reply_payload_sending`, yük normalleştirmesinden sonra ve kanal teslimatından önce çalışır; kaynak kanala geri yönlendirilen yanıtlar buna dahildir. İşleyiciler sıralı çalışır ve her işleyici, daha yüksek öncelikli işleyiciler tarafından üretilen en son yükü görür.
- `reply_payload_sending` yükleri, `trustedLocalMedia` gibi çalışma zamanı güven işaretlerini açığa çıkarmaz; plugin'ler yük şeklini düzenleyebilir ancak yerel medya güveni veremez.
- `message_sending`, bir iptalle birlikte `cancelReason` ve sınırlı `metadata` döndürebilir. Yeni ileti yaşam döngüsü API'leri bunu `cancelled_by_message_sending_hook` nedeni ile bastırılmış teslimat sonucu olarak açığa çıkarır; eski doğrudan teslimat, uyumluluk için boş sonuç dizisi döndürmeye devam eder.
- `message_sent` yalnızca gözlem amaçlıdır. İşleyici hataları günlüğe kaydedilir ve teslimat sonucunu değiştirmez.

## Kurulum hook'ları

Operatörün sahip olduğu izin verme/engelleme kararları için `security.installPolicy` kullanın. Bu ilke OpenClaw yapılandırmasından çalışır, CLI kurulum ve güncelleme yollarını kapsar ve etkinleştirilmiş ama kullanılamaz durumdaysa kapalı hata verir.

`before_install`, bir plugin çalışma zamanı yaşam döngüsü hook'udur. Yalnızca plugin hook'larının zaten yüklenmiş olduğu OpenClaw sürecinde, örneğin Gateway destekli kurulum akışlarında, `security.installPolicy` sonrasında çalışır. Plugin'e ait gözlemler, uyarılar ve uyumluluk denetimleri için kullanışlıdır, ancak kurulumlar için birincil kurumsal veya ana makine güvenlik sınırı değildir. `builtinScan` alanı uyumluluk için olay yükünde kalır, ancak OpenClaw artık yerleşik kurulum zamanı tehlikeli kod engellemesi çalıştırmadığından bu alan boş bir `ok` sonucudur. Bu süreçte kurulumu durdurmak için ek bulgular veya `{ block: true, blockReason }` döndürün.

`block: true` terminaldir. `block: false` karar yok olarak değerlendirilir. İşleyici hataları kurulumu kapalı hata vererek engeller.

## Gateway yaşam döngüsü

Gateway'in sahip olduğu duruma ihtiyaç duyan plugin hizmetleri için `gateway_start` kullanın. Bağlam, cron incelemesi ve güncellemeleri için `ctx.config`, `ctx.workspaceDir` ve `ctx.getCron?.()` alanlarını açığa çıkarır. Uzun süre çalışan kaynakları temizlemek için `gateway_stop` kullanın.

Plugin'e ait çalışma zamanı hizmetleri için dahili `gateway:startup` hook'una güvenmeyin.

`cron_changed`, `added`, `updated`, `removed`, `started`, `finished` ve `scheduled` nedenlerini kapsayan tipli olay yüküyle Gateway'e ait cron yaşam döngüsü olayları için tetiklenir. Olay, bir `PluginHookGatewayCronJob` anlık görüntüsü (`state.nextRunAtMs`, `state.lastRunStatus` ve varsa `state.lastError` dahil) ve `not-requested` | `delivered` | `not-delivered` | `unknown` değerlerinden oluşan bir `PluginHookGatewayCronDeliveryStatus` taşır. Kaldırılmış olaylar, dış zamanlayıcıların durumu uzlaştırabilmesi için silinen iş anlık görüntüsünü yine de taşır. Dış uyandırma zamanlayıcılarını eşitlerken çalışma zamanı bağlamından `ctx.getCron?.()` ve `ctx.config` kullanın ve vade denetimleri ile yürütme için OpenClaw'ı doğruluk kaynağı olarak tutun.

## Yaklaşan kullanımdan kaldırmalar

Hook'larla ilişkili birkaç yüzey kullanımdan kaldırılmıştır ancak hâlâ desteklenmektedir. Bir sonraki majör sürümden önce geçiş yapın:

- `inbound_claim` ve `message_received` işleyicilerindeki **düz metin kanal zarfları**. Düz zarf metnini ayrıştırmak yerine `BodyForAgent` ve yapılandırılmış kullanıcı bağlamı bloklarını okuyun. Bkz. [Düz metin kanal zarfları → BodyForAgent](/tr/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** uyumluluk için kalır. Yeni plugin'ler birleşik faz yerine `before_model_resolve` ve `before_prompt_build` kullanmalıdır.
- **`subagent_spawning`** eski plugin'lerle uyumluluk için kalır, ancak yeni plugin'ler buradan thread yönlendirmesi döndürmemelidir. Core, `subagent_spawned` tetiklenmeden önce kanal oturum bağlama adaptörleri üzerinden `thread: true` subagent bağlamalarını hazırlar.
- **`deactivate`**, 2026-08-16 sonrasına kadar kullanımdan kaldırılmış bir temizleme uyumluluk takma adı olarak kalır. Yeni plugin'ler `gateway_stop` kullanmalıdır.
- **`before_tool_call` içindeki `onResolution`** artık serbest biçimli bir `string` yerine tipli `PluginApprovalResolution` birleşimini (`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`) kullanır.

Tam liste için - bellek yeteneği kaydı, sağlayıcı düşünme profili, harici kimlik doğrulama sağlayıcıları, sağlayıcı keşif tipleri, görev çalışma zamanı erişimcileri ve `command-auth` → `command-status` yeniden adlandırması - bkz. [Plugin SDK geçişi → Aktif kullanımdan kaldırmalar](/tr/plugins/sdk-migration#active-deprecations).

## İlgili

- [Plugin SDK geçişi](/tr/plugins/sdk-migration) - aktif kullanımdan kaldırmalar ve kaldırma zaman çizelgesi
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
- [Plugin giriş noktaları](/tr/plugins/sdk-entrypoints)
- [Dahili hook'lar](/tr/automation/hooks)
- [Plugin mimarisi iç işleyişi](/tr/plugins/architecture-internals)
