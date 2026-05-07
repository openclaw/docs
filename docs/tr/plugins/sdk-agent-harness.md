---
read_when:
    - Gömülü ajan çalışma zamanını veya test düzeneği kayıt defterini değiştiriyorsunuz
    - Birlikte gelen veya güvenilir bir Plugin'den bir ajan düzeneği kaydediyorsunuz
    - Codex Plugin ile model sağlayıcıları arasındaki ilişkiyi anlamanız gerekir
sidebarTitle: Agent Harness
summary: Düşük seviyeli gömülü ajan yürütücüsünün yerini alan Plugin'ler için deneysel SDK yüzeyi
title: Ajan çalıştırma düzeneği Plugin'leri
x-i18n:
    generated_at: "2026-05-07T13:23:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: ab47fbedbd429a4c0e72da0057a88be34528b69804fa1e7af795f377c4907f55
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Bir **agent harness**, hazırlanmış tek bir OpenClaw ajan turu için düşük seviyeli yürütücüdür. Model provider değildir, channel değildir ve tool registry değildir.
Kullanıcıya dönük zihinsel model için bkz. [Agent runtimes](/tr/concepts/agent-runtimes).

Bu yüzeyi yalnızca paketlenmiş veya güvenilir yerel plugins için kullanın. Sözleşme
hala deneyseldir çünkü parametre türleri kasıtlı olarak mevcut gömülü runner'ı yansıtır.

## Harness ne zaman kullanılır

Bir model ailesinin kendi yerel session runtime'ı olduğunda ve normal OpenClaw provider taşıması yanlış soyutlama olduğunda bir agent harness kaydedin.

Örnekler:

- thread'leri ve compaction'ı sahiplenen yerel bir coding-agent server
- yerel plan/reasoning/tool event'lerini stream etmesi gereken yerel bir CLI veya daemon
- OpenClaw session transcript'e ek olarak kendi resume id'sine ihtiyaç duyan bir model runtime'ı

Yalnızca yeni bir LLM API eklemek için harness kaydetmeyin. Normal HTTP veya
WebSocket model API'leri için bir [provider plugin](/tr/plugins/sdk-provider-plugins) oluşturun.

## Core hâlâ neleri sahiplenir

Bir harness seçilmeden önce OpenClaw şunları zaten çözmüştür:

- provider ve model
- runtime auth state
- thinking level ve context budget
- OpenClaw transcript/session file
- workspace, sandbox ve tool policy
- channel reply callback'leri ve streaming callback'leri
- model fallback ve live model switching policy

Bu ayrım kasıtlıdır. Bir harness hazırlanmış bir denemeyi çalıştırır; provider seçmez,
channel delivery'nin yerine geçmez veya modelleri sessizce değiştirmez.

Hazırlanmış deneme ayrıca `params.runtimePlan` içerir; bu, PI ve yerel harness'ler arasında paylaşılmış kalması gereken runtime kararları için OpenClaw'ın sahip olduğu bir policy bundle'dır:

- provider-aware tool schema policy için `runtimePlan.tools.normalize(...)` ve
  `runtimePlan.tools.logDiagnostics(...)`
- transcript sanitization ve tool-call repair policy için
  `runtimePlan.transcript.resolvePolicy(...)`
- paylaşılan `NO_REPLY` ve media delivery suppression için
  `runtimePlan.delivery.isSilentPayload(...)`
- model fallback classification için `runtimePlan.outcome.classifyRunResult(...)`
- çözümlenmiş provider/model/harness metadata için `runtimePlan.observability`

Harness'ler, PI davranışıyla eşleşmesi gereken kararlar için planı kullanabilir, ancak
bunu yine de host-owned attempt state olarak ele almalıdır. Onu mutate etmeyin veya bir tur içinde provider/model değiştirmek için kullanmayın.

## Harness kaydetme

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Seçim policy'si

OpenClaw, provider/model çözümlemesinden sonra bir harness seçer:

1. Mevcut bir session'ın kaydedilmiş harness id'si önceliklidir, böylece config/env değişiklikleri o transcript'i başka bir runtime'a hot-switch yapmaz.
2. `OPENCLAW_AGENT_RUNTIME=<id>`, henüz pin'lenmemiş session'lar için bu id'ye sahip kayıtlı bir harness'i zorlar.
3. `OPENCLAW_AGENT_RUNTIME=pi`, built-in PI harness'i zorlar.
4. `OPENCLAW_AGENT_RUNTIME=auto`, kayıtlı harness'lere çözümlenmiş provider/model'i destekleyip desteklemediklerini sorar.
5. Hiçbir kayıtlı harness eşleşmezse, PI fallback devre dışı bırakılmadığı sürece OpenClaw PI kullanır.

Plugin harness hataları run failure olarak görünür. `auto` modunda PI fallback yalnızca hiçbir kayıtlı plugin harness çözümlenmiş provider/model'i desteklemediğinde kullanılır. Bir plugin harness bir run'ı claim ettikten sonra OpenClaw aynı turu PI üzerinden tekrar oynatmaz, çünkü bu auth/runtime semantic'lerini değiştirebilir veya side effect'leri çoğaltabilir.

Seçilen harness id'si gömülü bir run'dan sonra session id ile kalıcılaştırılır.
Harness pin'lerinden önce oluşturulmuş legacy session'lar, transcript history'ye sahip olduklarında PI-pinned olarak ele alınır. PI ile yerel plugin harness arasında geçiş yaparken yeni/reset session kullanın. `/status`, `Fast` yanında `codex` gibi default olmayan harness id'lerini gösterir; PI, default compatibility path olduğu için gizli kalır.
Seçilen harness şaşırtıcıysa, `agents/harness` debug logging'i etkinleştirin ve gateway'in structured `agent harness selected` kaydını inceleyin. Bu kayıt seçilen harness id'sini, seçim nedenini, runtime/fallback policy'yi ve `auto` modunda her plugin adayının support result'ını içerir.

Paketlenmiş Codex plugin'i harness id'si olarak `codex` kaydeder. Core bunu sıradan bir plugin harness id'si olarak ele alır; Codex'e özgü alias'lar shared runtime selector'da değil, plugin'de veya operator config'de yer almalıdır.

## Provider ve harness eşleştirmesi

Çoğu harness ayrıca bir provider kaydetmelidir. Provider, model ref'lerini,
auth status'u, model metadata'sını ve `/model` seçimini OpenClaw'ın geri kalanı için görünür kılar. Harness daha sonra `supports(...)` içinde bu provider'ı claim eder.

Paketlenmiş Codex plugin'i bu pattern'i izler:

- tercih edilen user model ref'leri: `openai/gpt-5.5` artı
  `agentRuntime.id: "codex"`
- compatibility ref'leri: legacy `codex/gpt-*` ref'leri kabul edilmeye devam eder, ancak yeni config'ler bunları normal provider/model ref'leri olarak kullanmamalıdır
- harness id: `codex`
- auth: synthetic provider availability, çünkü Codex harness yerel Codex login/session'ını sahiplenir
- app-server request: OpenClaw, çıplak model id'sini Codex'e gönderir ve harness'in yerel app-server protocol ile konuşmasına izin verir

Codex plugin'i additive'dir. Düz `openai/gpt-*` ref'leri, Codex harness'i
`agentRuntime.id: "codex"` ile zorlamadığınız sürece normal OpenClaw provider path'ini kullanmaya devam eder. Daha eski `codex/gpt-*` ref'leri compatibility için hâlâ Codex provider'ı ve harness'i seçer.

Operator kurulumu, model prefix örnekleri ve yalnızca Codex config'leri için bkz.
[Codex Harness](/tr/plugins/codex-harness).

OpenClaw, Codex app-server `0.125.0` veya daha yenisini gerektirir. Codex plugin'i app-server initialize handshake'ini kontrol eder ve eski veya version belirtilmemiş server'ları engeller; böylece OpenClaw yalnızca test edildiği protocol surface'e karşı çalışır. `0.125.0` alt sınırı, Codex `0.124.0` içinde gelen yerel MCP hook payload desteğini içerirken OpenClaw'ı daha yeni test edilmiş stable line'a pin'ler.

### Tool-result middleware

Paketlenmiş plugins, manifest'leri `contracts.agentToolResultMiddleware` içinde hedeflenen runtime id'lerini bildirdiğinde `api.registerAgentToolResultMiddleware(...)` üzerinden runtime-neutral tool-result middleware ekleyebilir. Bu trusted seam, PI veya Codex tool output'u modele geri beslemeden önce çalışması gereken async tool-result transform'ları içindir.

Legacy paketlenmiş plugins, Codex app-server-only middleware için hâlâ
`api.registerCodexAppServerExtensionFactory(...)` kullanabilir, ancak yeni result transform'ları runtime-neutral API'yi kullanmalıdır.
Pi-only `api.registerEmbeddedExtensionFactory(...)` hook'u kaldırılmıştır;
Pi tool-result transform'ları runtime-neutral middleware kullanmalıdır.

### Terminal outcome classification

Kendi protocol projection'ını sahiplenen yerel harness'ler, tamamlanmış bir tur görünür assistant text üretmediğinde
`openclaw/plugin-sdk/agent-harness-runtime` içinden
`classifyAgentHarnessTerminalOutcome(...)` kullanabilir. Helper `empty`, `reasoning-only` veya
`planning-only` döndürür; böylece OpenClaw'ın fallback policy'si farklı bir modelde retry yapılıp yapılmayacağına karar verebilir. Prompt error'larını, in-flight turn'leri ve `NO_REPLY` gibi kasıtlı silent reply'ları özellikle unclassified bırakır.

### Yerel Codex harness modu

Paketlenmiş `codex` harness, gömülü OpenClaw agent turn'leri için yerel Codex modudur. Önce paketlenmiş `codex` plugin'ini etkinleştirin ve config'iniz restrictive allowlist kullanıyorsa `plugins.allow` içine `codex` ekleyin. Yerel app-server config'leri `openai/gpt-*` kullanmalıdır; OpenAI agent turn'leri default olarak Codex harness'i seçer. Legacy `openai-codex/*` route'ları
`openclaw doctor --fix` ile onarılmalıdır ve legacy `codex/*` model ref'leri yerel harness için compatibility alias'ları olarak kalır.

Bu mod çalıştığında Codex yerel thread id'sini, resume behavior'ı,
compaction'ı ve app-server execution'ı sahiplenir. OpenClaw hâlâ chat channel'ı,
visible transcript mirror'ı, tool policy'yi, approvals'ı, media delivery'yi ve session selection'ı sahiplenir. Yalnızca Codex app-server path'inin run'ı claim edebileceğini kanıtlamanız gerektiğinde `agentRuntime.id: "codex"` kullanın. Explicit plugin runtime'ları fail closed davranır;
Codex app-server selection failure'ları ve runtime failure'ları PI üzerinden retry edilmez.

## Runtime strictness

Varsayılan olarak OpenClaw, embedded agent'ları OpenClaw Pi ile çalıştırır. `auto` modunda,
kayıtlı plugin harness'ler bir provider/model pair'i claim edebilir ve hiçbiri eşleşmediğinde turu PI işler. Eksik harness selection'ın PI üzerinden route edilmek yerine fail etmesi gerektiğinde
`agentRuntime.id: "codex"` gibi explicit plugin runtime kullanın. Seçilen plugin harness failure'ları her zaman hard fail olur. Bu, explicit `agentRuntime.id: "pi"` veya
`OPENCLAW_AGENT_RUNTIME=pi` kullanımını engellemez.

Yalnızca Codex embedded run'ları için:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

Herhangi bir kayıtlı plugin harness'in eşleşen modelleri claim etmesini ve aksi halde PI kullanılmasını istiyorsanız `id: "auto"` ayarlayın:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto"
      }
    }
  }
}
```

Per-agent override'lar aynı shape'i kullanır:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": { "id": "auto" }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": { "id": "codex" }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` hâlâ configured runtime'ı override eder.

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Explicit plugin runtime ile, istenen harness kayıtlı olmadığında, çözümlenmiş provider/model'i desteklemediğinde veya turn side effect'leri üretmeden önce failure verdiğinde session erken fail eder. Bu, Codex-only deployment'lar ve Codex app-server path'inin gerçekten kullanımda olduğunu kanıtlaması gereken live test'ler için kasıtlıdır.

Bu ayar yalnızca embedded agent harness'i kontrol eder. Image, video, music, TTS, PDF veya diğer provider-specific model routing'i devre dışı bırakmaz.

## Yerel sessions ve transcript mirror

Bir harness yerel session id, thread id veya daemon-side resume token tutabilir.
Bu binding'i OpenClaw session ile açıkça ilişkilendirin ve user-visible assistant/tool output'u OpenClaw transcript'e mirror etmeye devam edin.

OpenClaw transcript, şunlar için compatibility layer olarak kalır:

- channel-visible session history
- transcript search ve indexing
- sonraki bir turda built-in PI harness'e geri geçiş
- generic `/new`, `/reset` ve session deletion behavior

Harness'iniz bir sidecar binding saklıyorsa, owning OpenClaw session reset edildiğinde OpenClaw'ın bunu temizleyebilmesi için `reset(...)` implement edin.

## Tool ve media results

Core, OpenClaw tool list'i oluşturur ve hazırlanmış denemeye geçirir.
Bir harness dynamic tool call yürüttüğünde, channel media'yı kendiniz göndermek yerine tool result'ı harness result shape üzerinden geri döndürün.

Bu, text, image, video, music, TTS, approval ve messaging-tool output'larını PI-backed run'larla aynı delivery path üzerinde tutar.

## Mevcut sınırlamalar

- Genel içe aktarma yolu geneldir, ancak bazı deneme/sonuç tür takma adları uyumluluk için hâlâ `Pi` adlarını taşır.
- Üçüncü taraf harness kurulumu deneyseldir. Yerel oturum çalışma zamanına ihtiyaç duyana kadar sağlayıcı Plugin'lerini tercih edin.
- Harness değiştirme, turlar arasında desteklenir. Yerel araçlar, onaylar, asistan metni veya mesaj gönderimleri başladıktan sonra bir turun ortasında harness değiştirmeyin.

## İlgili

- [SDK Genel Bakış](/tr/plugins/sdk-overview)
- [Çalışma Zamanı Yardımcıları](/tr/plugins/sdk-runtime)
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins)
- [Codex Harness](/tr/plugins/codex-harness)
- [Model Sağlayıcıları](/tr/concepts/model-providers)
