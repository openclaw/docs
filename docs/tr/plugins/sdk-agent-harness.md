---
read_when:
    - Gömülü ajan çalışma zamanını veya koşum kayıt defterini değiştiriyorsunuz
    - Birlikte gelen veya güvenilir bir Plugin üzerinden bir ajan çalıştırma düzeneği kaydediyorsunuz
    - Codex Plugin'in model sağlayıcılarıyla nasıl ilişkili olduğunu anlamanız gerekir
sidebarTitle: Agent Harness
summary: Düşük düzeyli gömülü ajan yürütücüsünün yerini alan Plugin'ler için deneysel SDK yüzeyi
title: Ajan çalışma altyapısı Plugin'leri
x-i18n:
    generated_at: "2026-05-10T19:47:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1685af479a8502ac743b0f520f0afae2cdc905524e48b3a84ce95ffe85c8fb49
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Bir **agent harness**, hazırlanmış tek bir OpenClaw agent dönüşü için düşük düzeyli yürütücüdür. Bir model sağlayıcısı, kanal veya araç kayıt defteri değildir.
Kullanıcıya yönelik zihinsel model için bkz. [Agent runtimes](/tr/concepts/agent-runtimes).

Bu yüzeyi yalnızca paketlenmiş veya güvenilir yerel Plugin'ler için kullanın. Parametre türleri kasıtlı olarak mevcut gömülü çalıştırıcıyı yansıttığı için sözleşme hâlâ deneyseldir.

## Harness ne zaman kullanılır

Bir model ailesinin kendi yerel oturum runtime'ı olduğunda ve normal OpenClaw sağlayıcı aktarımı yanlış soyutlama olduğunda bir agent harness kaydedin.

Örnekler:

- thread'leri ve Compaction'ı sahiplenen yerel bir coding-agent sunucusu
- yerel plan/akıl yürütme/araç olaylarını stream etmesi gereken yerel bir CLI veya daemon
- OpenClaw oturum transcript'ine ek olarak kendi resume id'sine ihtiyaç duyan bir model runtime'ı

Yalnızca yeni bir LLM API'si eklemek için harness kaydetmeyin. Normal HTTP veya WebSocket model API'leri için bir [provider plugin](/tr/plugins/sdk-provider-plugins) oluşturun.

## Core hâlâ nelerin sahibi

Bir harness seçilmeden önce OpenClaw şunları zaten çözümlemiştir:

- sağlayıcı ve model
- runtime kimlik doğrulama durumu
- düşünme düzeyi ve bağlam bütçesi
- OpenClaw transcript/oturum dosyası
- çalışma alanı, sandbox ve araç ilkesi
- kanal yanıt callback'leri ve streaming callback'leri
- model fallback ve canlı model değiştirme ilkesi

Bu ayrım kasıtlıdır. Bir harness hazırlanmış bir denemeyi çalıştırır; sağlayıcıları seçmez, kanal teslimatının yerine geçmez veya modelleri sessizce değiştirmez.

Hazırlanmış deneme ayrıca, PI ve yerel harness'ler arasında ortak kalması gereken runtime kararları için OpenClaw'a ait bir ilke paketi olan `params.runtimePlan` içerir:

- sağlayıcı farkındalıklı araç şeması ilkesi için `runtimePlan.tools.normalize(...)` ve
  `runtimePlan.tools.logDiagnostics(...)`
- transcript temizleme ve tool-call onarım ilkesi için `runtimePlan.transcript.resolvePolicy(...)`
- paylaşılan `NO_REPLY` ve medya teslimatı bastırma için `runtimePlan.delivery.isSilentPayload(...)`
- model fallback sınıflandırması için `runtimePlan.outcome.classifyRunResult(...)`
- çözümlenmiş sağlayıcı/model/harness metadata'sı için `runtimePlan.observability`

Harness'ler, PI davranışıyla eşleşmesi gereken kararlar için planı kullanabilir, ancak yine de bunu host'a ait deneme durumu olarak ele almalıdır. Bunu mutasyona uğratmayın veya bir dönüş içinde sağlayıcı/model değiştirmek için kullanmayın.

## Harness kaydetme

**İçe aktar:** `openclaw/plugin-sdk/agent-harness`

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

## Seçim ilkesi

OpenClaw, sağlayıcı/model çözümlemesinden sonra bir harness seçer:

1. Model kapsamlı runtime ilkesi kazanır.
2. Sağlayıcı kapsamlı runtime ilkesi sonra gelir.
3. `auto`, kayıtlı harness'lere çözümlenen sağlayıcı/modeli destekleyip desteklemediklerini sorar.
4. Eşleşen kayıtlı harness yoksa OpenClaw, PI fallback devre dışı bırakılmadıkça PI kullanır.

Plugin harness hataları çalıştırma hataları olarak görünür. `auto` modunda PI fallback yalnızca çözümlenen sağlayıcı/modeli destekleyen kayıtlı Plugin harness'i olmadığında kullanılır. Bir Plugin harness'i bir çalıştırmayı üstlendikten sonra OpenClaw aynı dönüşü PI üzerinden yeniden oynatmaz; çünkü bu, kimlik doğrulama/runtime semantiğini değiştirebilir veya yan etkileri yineleyebilir.

Tam oturum ve tam agent runtime pin'leri seçim tarafından yok sayılır. Buna eski oturum `agentHarnessId` değerleri, `agents.defaults.agentRuntime`, `agents.list[].agentRuntime` ve `OPENCLAW_AGENT_RUNTIME` dahildir. `/status`, sağlayıcı/model rotasından seçilen etkin runtime'ı gösterir.
Seçilen harness şaşırtıcıysa `agents/harness` hata ayıklama günlüklerini etkinleştirin ve Gateway'in yapılandırılmış `agent harness selected` kaydını inceleyin. Bu kayıt seçilen harness id'sini, seçim nedenini, runtime/fallback ilkesini ve `auto` modunda her Plugin adayının destek sonucunu içerir.

Paketlenmiş Codex Plugin'i, harness id'si olarak `codex` kaydeder. Core bunu sıradan bir Plugin harness id'si olarak ele alır; Codex'e özgü takma adlar paylaşılan runtime seçicide değil, Plugin'de veya operatör config'inde yer almalıdır.

## Sağlayıcı ve harness eşleştirmesi

Çoğu harness ayrıca bir sağlayıcı da kaydetmelidir. Sağlayıcı, model ref'lerini, kimlik doğrulama durumunu, model metadata'sını ve `/model` seçimini OpenClaw'ın geri kalanına görünür kılar. Harness daha sonra `supports(...)` içinde bu sağlayıcıyı üstlenir.

Paketlenmiş Codex Plugin'i bu kalıbı izler:

- tercih edilen kullanıcı model ref'leri: `openai/gpt-5.5`
- uyumluluk ref'leri: eski `codex/gpt-*` ref'leri kabul edilmeye devam eder, ancak yeni config'ler bunları normal sağlayıcı/model ref'leri olarak kullanmamalıdır
- harness id'si: `codex`
- kimlik doğrulama: sentetik sağlayıcı kullanılabilirliği, çünkü Codex harness'i yerel Codex login/oturumunu sahiplenir
- app-server isteği: OpenClaw, çıplak model id'sini Codex'e gönderir ve harness'in yerel app-server protokolüyle konuşmasına izin verir

Codex Plugin'i katkısaldır. Resmî OpenAI sağlayıcısındaki düz `openai/gpt-*` agent ref'leri varsayılan olarak Codex harness'ini seçer. Eski `codex/gpt-*` ref'leri uyumluluk için hâlâ Codex sağlayıcısını ve harness'ini seçer.

Operatör kurulumu, model öneki örnekleri ve yalnızca Codex config'leri için bkz. [Codex Harness](/tr/plugins/codex-harness).

OpenClaw, Codex app-server `0.125.0` veya daha yenisini gerektirir. Codex Plugin'i app-server initialize handshake'ini denetler ve eski ya da sürümsüz sunucuları engeller; böylece OpenClaw yalnızca test edilmiş olduğu protokol yüzeyine karşı çalışır. `0.125.0` alt sınırı, Codex `0.124.0` içinde gelen yerel MCP hook payload desteğini içerirken OpenClaw'ı daha yeni test edilmiş kararlı hatta pin'ler.

### Araç sonucu middleware'i

Paketlenmiş Plugin'ler, manifest'leri `contracts.agentToolResultMiddleware` içinde hedeflenen runtime id'lerini bildirdiğinde `api.registerAgentToolResultMiddleware(...)` aracılığıyla runtime'dan bağımsız araç sonucu middleware'i ekleyebilir. Bu güvenilir seam, PI veya Codex araç çıktısını modele geri beslemeden önce çalışması gereken async araç sonucu dönüşümleri içindir.

Eski paketlenmiş Plugin'ler, Codex app-server'a özel middleware için hâlâ `api.registerCodexAppServerExtensionFactory(...)` kullanabilir, ancak yeni sonuç dönüşümleri runtime'dan bağımsız API'yi kullanmalıdır.
Yalnızca Pi'ye özel `api.registerEmbeddedExtensionFactory(...)` hook'u kaldırılmıştır; Pi araç sonucu dönüşümleri runtime'dan bağımsız middleware kullanmalıdır.

### Terminal sonuç sınıflandırması

Kendi protokol projeksiyonunu sahiplenen yerel harness'ler, tamamlanmış bir dönüş görünür asistan metni üretmediğinde `openclaw/plugin-sdk/agent-harness-runtime` içinden `classifyAgentHarnessTerminalOutcome(...)` kullanabilir. Yardımcı `empty`, `reasoning-only` veya `planning-only` döndürür; böylece OpenClaw'ın fallback ilkesi farklı bir modelde yeniden deneme yapıp yapmayacağına karar verebilir. Prompt hatalarını, devam eden dönüşleri ve `NO_REPLY` gibi kasıtlı sessiz yanıtları kasıtlı olarak sınıflandırmaz.

### Yerel Codex harness modu

Paketlenmiş `codex` harness'i, gömülü OpenClaw agent dönüşleri için yerel Codex modudur. Önce paketlenmiş `codex` Plugin'ini etkinleştirin ve config'iniz kısıtlayıcı bir allowlist kullanıyorsa `plugins.allow` içine `codex` ekleyin. Yerel app-server config'leri `openai/gpt-*` kullanmalıdır; OpenAI agent dönüşleri varsayılan olarak Codex harness'ini seçer. Eski `openai-codex/*` rotaları `openclaw doctor --fix` ile onarılmalıdır ve eski `codex/*` model ref'leri yerel harness için uyumluluk takma adları olarak kalır.

Bu mod çalıştığında Codex yerel thread id'sini, resume davranışını, Compaction'ı ve app-server yürütmesini sahiplenir. OpenClaw hâlâ chat kanalının, görünür transcript yansısının, araç ilkesinin, onayların, medya teslimatının ve oturum seçiminin sahibidir. Çalıştırmayı yalnızca Codex app-server yolunun üstlenebildiğini kanıtlamanız gerektiğinde sağlayıcı/model `agentRuntime.id: "codex"` kullanın. Açık Plugin runtime'ları kapalı hata verir; Codex app-server seçim hataları ve runtime hataları PI üzerinden yeniden denenmez.

## Runtime katılığı

Varsayılan olarak OpenClaw `auto` sağlayıcı/model runtime ilkesi kullanır: kayıtlı Plugin harness'leri bir sağlayıcı/model çiftini üstlenebilir ve hiçbiri eşleşmediğinde PI dönüşü işler. Resmî OpenAI sağlayıcısındaki OpenAI agent ref'leri varsayılan olarak Codex'e gider. Eksik harness seçiminin PI üzerinden yönlendirme yapmak yerine başarısız olması gerektiğinde `agentRuntime.id: "codex"` gibi açık bir sağlayıcı/model Plugin runtime'ı kullanın. Seçilen Plugin harness hataları her zaman kesin olarak başarısız olur. Bu, açık bir sağlayıcı/model `agentRuntime.id: "pi"` değerini engellemez.

Yalnızca Codex gömülü çalıştırmaları için:

```json
{
  "models": {
    "providers": {
      "openai": {
        "agentRuntime": {
          "id": "codex"
        }
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5"
    }
  }
}
```

Tek bir kanonik model için CLI backend istiyorsanız runtime'ı o model girdisine koyun:

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-7",
      "models": {
        "anthropic/claude-opus-4-7": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

Agent başına override'lar aynı model kapsamlı şekli kullanır:

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "models": {
          "openai/gpt-5.5": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

Bunun gibi eski tam agent runtime örnekleri yok sayılır:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

Açık bir Plugin runtime'ı ile, istenen harness kayıtlı olmadığında, çözümlenen sağlayıcı/modeli desteklemediğinde veya dönüş yan etkileri üretmeden önce başarısız olduğunda oturum erken başarısız olur. Bu, yalnızca Codex dağıtımları ve Codex app-server yolunun gerçekten kullanımda olduğunu kanıtlaması gereken canlı testler için kasıtlıdır.

Bu ayar yalnızca gömülü agent harness'ini denetler. Görsel, video, müzik, TTS, PDF veya sağlayıcıya özgü diğer model yönlendirmelerini devre dışı bırakmaz.

## Yerel oturumlar ve transcript yansısı

Bir harness yerel oturum id'si, thread id'si veya daemon tarafı resume token'ı tutabilir. Bu bağı açıkça OpenClaw oturumuyla ilişkilendirilmiş tutun ve kullanıcı tarafından görülebilen asistan/araç çıktısını OpenClaw transcript'ine yansıtmaya devam edin.

OpenClaw transcript'i şunlar için uyumluluk katmanı olarak kalır:

- kanalda görünür oturum geçmişi
- transcript arama ve indeksleme
- daha sonraki bir dönüşte yerleşik PI harness'ine geri dönme
- genel `/new`, `/reset` ve oturum silme davranışı

Harness'iniz bir sidecar bağı saklıyorsa `reset(...)` uygulayın ki sahip olan OpenClaw oturumu sıfırlandığında OpenClaw bunu temizleyebilsin.

## Araç ve medya sonuçları

Core, OpenClaw araç listesini oluşturur ve hazırlanmış denemeye geçirir. Bir harness dinamik bir araç çağrısı yürüttüğünde, kanal medyasını kendiniz göndermek yerine araç sonucunu harness sonuç şekli üzerinden geri döndürün.

Bu, metin, görsel, video, müzik, TTS, onay ve mesajlaşma aracı çıktılarını PI destekli çalıştırmalarla aynı teslimat yolunda tutar.

## Mevcut sınırlamalar

- Genel import yolu generic'tir, ancak bazı deneme/sonuç tür takma adları uyumluluk için hâlâ `Pi` adları taşır.
- Üçüncü taraf harness kurulumu deneyseldir. Yerel bir oturum runtime'ına ihtiyaç duyana kadar provider plugin'leri tercih edin.
- Harness değiştirme dönüşler arasında desteklenir. Yerel araçlar, onaylar, asistan metni veya mesaj gönderimleri başladıktan sonra bir dönüşün ortasında harness değiştirmeyin.

## İlgili

- [SDK Genel Bakışı](/tr/plugins/sdk-overview)
- [Çalışma Zamanı Yardımcıları](/tr/plugins/sdk-runtime)
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins)
- [Codex Çalıştırma Altyapısı](/tr/plugins/codex-harness)
- [Model Sağlayıcıları](/tr/concepts/model-providers)
