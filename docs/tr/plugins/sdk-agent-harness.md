---
read_when:
    - Gömülü ajan çalışma zamanını veya harness kayıt defterini değiştiriyorsunuz
    - Gömülü veya güvenilir bir plugin’den bir agent harness’ı kaydediyorsunuz
    - Codex plugininin model sağlayıcılarla nasıl ilişkili olduğunu anlamanız gerekir
sidebarTitle: Agent Harness
summary: Plugin’ler için düşük seviyeli gömülü ajan yürütücüsünün yerini alan deneysel SDK yüzeyi
title: Ajan harness Plugin’leri
x-i18n:
    generated_at: "2026-06-28T01:04:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a368ae480c31c86c30786f91e5cf451c3489c681be8ee3955c1c2bd55e4b49e9
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Bir **agent çalıştırma altyapısı**, hazırlanmış tek bir OpenClaw agent turu için alt düzey yürütücüdür. Model sağlayıcı değildir, kanal değildir ve araç kayıt defteri değildir. Kullanıcıya dönük zihinsel model için bkz. [Agent çalışma zamanları](/tr/concepts/agent-runtimes).

Bu yüzeyi yalnızca paketlenmiş veya güvenilir yerel Plugin'ler için kullanın. Sözleşme hâlâ deneyseldir çünkü parametre türleri bilinçli olarak mevcut gömülü çalıştırıcıyı yansıtır.

## Çalıştırma altyapısı ne zaman kullanılır

Bir model ailesinin kendi yerel oturum çalışma zamanı varsa ve normal OpenClaw sağlayıcı taşıması yanlış soyutlama ise bir agent çalıştırma altyapısı kaydedin.

Örnekler:

- iş parçacıklarını ve Compaction'ı sahiplenen yerel bir kodlama agent sunucusu
- yerel plan/akıl yürütme/araç olaylarını akış olarak vermesi gereken yerel bir CLI veya daemon
- OpenClaw oturum dökümüne ek olarak kendi sürdürme kimliğine ihtiyaç duyan bir model çalışma zamanı

Yalnızca yeni bir LLM API'si eklemek için bir çalıştırma altyapısı kaydetmeyin. Normal HTTP veya WebSocket model API'leri için bir [sağlayıcı Plugin'i](/tr/plugins/sdk-provider-plugins) oluşturun.

## Çekirdeğin hâlâ sahip olduğu şeyler

Bir çalıştırma altyapısı seçilmeden önce OpenClaw şunları zaten çözümlemiştir:

- sağlayıcı ve model
- çalışma zamanı kimlik doğrulama durumu
- düşünme düzeyi ve bağlam bütçesi
- OpenClaw döküm/oturum dosyası
- çalışma alanı, sandbox ve araç ilkesi
- kanal yanıt geri çağrıları ve akış geri çağrıları
- model yedeğe düşme ve canlı model değiştirme ilkesi

Bu ayrım bilinçlidir. Bir çalıştırma altyapısı hazırlanmış bir denemeyi çalıştırır; sağlayıcı seçmez, kanal teslimini değiştirmez veya modelleri sessizce değiştirmez.

Hazırlanmış deneme ayrıca OpenClaw'a ait, OpenClaw ve yerel çalıştırma altyapıları arasında ortak kalması gereken çalışma zamanı kararları için bir ilke paketi olan `params.runtimePlan` öğesini içerir:

- sağlayıcıya duyarlı araç şeması ilkesi için `runtimePlan.tools.normalize(...)` ve `runtimePlan.tools.logDiagnostics(...)`
- döküm temizleme ve araç çağrısı onarma ilkesi için `runtimePlan.transcript.resolvePolicy(...)`
- paylaşılan `NO_REPLY` ve medya teslimi bastırma için `runtimePlan.delivery.isSilentPayload(...)`
- model yedeğe düşme sınıflandırması için `runtimePlan.outcome.classifyRunResult(...)`
- çözümlenmiş sağlayıcı/model/çalıştırma altyapısı meta verileri için `runtimePlan.observability`

Çalıştırma altyapıları, OpenClaw davranışıyla eşleşmesi gereken kararlar için planı kullanabilir, ancak yine de bunu ana makineye ait deneme durumu olarak ele almalıdır. Bir tur içinde bunu değiştirmeyin veya sağlayıcı/model değiştirmek için kullanmayın.

## Çalıştırma altyapısı kaydetme

**İçe aktarma:** `openclaw/plugin-sdk/agent-harness`

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

OpenClaw, sağlayıcı/model çözümlemesinden sonra bir çalıştırma altyapısı seçer:

1. Model kapsamlı çalışma zamanı ilkesi kazanır.
2. Ardından sağlayıcı kapsamlı çalışma zamanı ilkesi gelir.
3. `auto`, kayıtlı çalıştırma altyapılarına çözümlenen sağlayıcı/modeli destekleyip desteklemediklerini sorar.
4. Kayıtlı hiçbir çalıştırma altyapısı eşleşmezse OpenClaw gömülü çalışma zamanını kullanır.

Plugin çalıştırma altyapısı hataları çalışma hataları olarak görünür. `auto` modunda gömülü yedek, yalnızca çözümlenen sağlayıcı/modeli destekleyen kayıtlı Plugin çalıştırma altyapısı yoksa kullanılır. Bir Plugin çalıştırma altyapısı bir çalışmayı üstlendikten sonra OpenClaw aynı turu başka bir çalışma zamanı üzerinden yeniden oynatmaz; çünkü bu, kimlik doğrulama/çalışma zamanı anlamlarını değiştirebilir veya yan etkileri çoğaltabilir.

Tüm oturum ve tüm agent çalışma zamanı sabitlemeleri seçim tarafından yok sayılır. Buna eski oturum `agentHarnessId` değerleri, `agents.defaults.agentRuntime`, `agents.list[].agentRuntime` ve `OPENCLAW_AGENT_RUNTIME` dahildir. `/status`, sağlayıcı/model rotasından seçilen etkili çalışma zamanını gösterir. Seçilen çalıştırma altyapısı şaşırtıcıysa `agents/harness` hata ayıklama günlüğünü etkinleştirin ve Gateway'in yapılandırılmış `agent harness selected` kaydını inceleyin. Bu kayıt seçilen çalıştırma altyapısı kimliğini, seçim nedenini, çalışma zamanı/yedek ilkesini ve `auto` modunda her Plugin adayının destek sonucunu içerir.

Paketlenmiş Codex Plugin'i çalıştırma altyapısı kimliği olarak `codex` kaydeder. Çekirdek bunu sıradan bir Plugin çalıştırma altyapısı kimliği olarak ele alır; Codex'e özgü takma adlar paylaşılan çalışma zamanı seçicisinde değil, Plugin'de veya operatör yapılandırmasında yer alır.

## Sağlayıcı ve çalıştırma altyapısı eşleştirmesi

Çoğu çalıştırma altyapısı ayrıca bir sağlayıcı kaydetmelidir. Sağlayıcı; model referanslarını, kimlik doğrulama durumunu, model meta verilerini ve `/model` seçimini OpenClaw'ın geri kalanına görünür kılar. Çalıştırma altyapısı daha sonra `supports(...)` içinde bu sağlayıcıyı üstlenir.

Paketlenmiş Codex Plugin'i bu deseni izler:

- tercih edilen kullanıcı model referansları: `openai/gpt-5.5`
- uyumluluk referansları: eski `codex/gpt-*` referansları kabul edilmeye devam eder, ancak yeni yapılandırmalar bunları normal sağlayıcı/model referansları olarak kullanmamalıdır
- çalıştırma altyapısı kimliği: `codex`
- kimlik doğrulama: sentetik sağlayıcı kullanılabilirliği, çünkü Codex çalıştırma altyapısı yerel Codex oturum açma/oturumunu sahiplenir
- uygulama sunucusu isteği: OpenClaw yalın model kimliğini Codex'e gönderir ve çalıştırma altyapısının yerel uygulama sunucusu protokolüyle konuşmasına izin verir

Codex Plugin'i eklemelidir. Resmi OpenAI sağlayıcısındaki düz `openai/gpt-*` agent referansları varsayılan olarak Codex çalıştırma altyapısını seçer. Eski `codex/gpt-*` referansları uyumluluk için Codex sağlayıcısını ve çalıştırma altyapısını seçmeye devam eder.

Operatör kurulumu, model öneki örnekleri ve yalnızca Codex yapılandırmaları için bkz. [Codex Çalıştırma Altyapısı](/tr/plugins/codex-harness).

OpenClaw, Codex uygulama sunucusu `0.125.0` veya daha yenisini gerektirir. Codex Plugin'i uygulama sunucusu başlatma el sıkışmasını denetler ve OpenClaw'ın yalnızca test edildiği protokol yüzeyine karşı çalışması için daha eski veya sürümsüz sunucuları engeller. `0.125.0` tabanı, Codex `0.124.0` ile gelen yerel MCP kanca yükü desteğini içerirken OpenClaw'ı daha yeni, test edilmiş kararlı hatta sabitler.

### Araç sonucu ara katmanı

Paketlenmiş Plugin'ler ve eşleşen manifest sözleşmeleriyle açıkça etkinleştirilmiş kurulu Plugin'ler, manifestleri `contracts.agentToolResultMiddleware` içinde hedeflenen çalışma zamanı kimliklerini beyan ettiğinde `api.registerAgentToolResultMiddleware(...)` üzerinden çalışma zamanından bağımsız araç sonucu ara katmanı ekleyebilir. Bu güvenilir yüzey, OpenClaw veya Codex araç çıktısını modele geri beslemeden önce çalışması gereken zaman uyumsuz araç sonucu dönüşümleri içindir.

Eski paketlenmiş Plugin'ler Codex uygulama sunucusuna özel ara katman için hâlâ `api.registerCodexAppServerExtensionFactory(...)` kullanabilir, ancak yeni sonuç dönüşümleri çalışma zamanından bağımsız API'yi kullanmalıdır. Yalnızca gömülü çalıştırıcıya ait `api.registerEmbeddedExtensionFactory(...)` kancası kaldırılmıştır; gömülü araç sonucu dönüşümleri çalışma zamanından bağımsız ara katmanı kullanmalıdır.

### Terminal sonuç sınıflandırması

Kendi protokol projeksiyonunu sahiplenen yerel çalıştırma altyapıları, tamamlanmış bir tur görünür asistan metni üretmediğinde `openclaw/plugin-sdk/agent-harness-runtime` içinden `classifyAgentHarnessTerminalOutcome(...)` kullanabilir. Yardımcı `empty`, `reasoning-only` veya `planning-only` döndürür; böylece OpenClaw'ın yedeğe düşme ilkesi farklı bir modelde yeniden deneme yapıp yapmayacağına karar verebilir. `planning-only`, çalıştırma altyapısının açık `planText` alanını gerektirir; OpenClaw bunu asistan düz yazısından çıkarsamaz. Yardımcı bilinçli olarak istem hatalarını, devam eden turları ve `NO_REPLY` gibi kasıtlı sessiz yanıtları sınıflandırmaz.

### Agent sonu yan etkileri

Yerel çalıştırma altyapıları bir denemeyi sonlandırdıktan sonra `openclaw/plugin-sdk/agent-harness-runtime` içinden `runAgentEndSideEffects(...)` çağırmalıdır. Bu, taşınabilir `agent_end` kancasını ve OpenClaw'ın araştırma yakalamasını etkileşimli yanıtları geciktirmeden dağıtır. Yerel, etkileşimsiz çalışmalarda denemenin bu yan etkiler bitmeden çözümlenmemesi gerekiyorsa `awaitAgentEndSideEffects(...)` kullanın. Her iki yardımcı da `runAgentHarnessAgentEndHook(...)` ile aynı `{ event, ctx }` yükünü kabul eder; hataları tamamlanmış deneme sonucunu değiştirmez.

### Kullanıcı girdisi ve araç yüzeyleri

Çalışma zamanı düzeyinde kullanıcı girdisi isteği sunan yerel çalıştırma altyapıları; istemi biçimlendirmek, OpenClaw'ın engelleyici yanıt yolu üzerinden teslim etmek ve seçim/serbest biçimli yanıtları çalışma zamanının yerel yanıt şekline geri normalleştirmek için `openclaw/plugin-sdk/agent-harness-runtime` içindeki kullanıcı girdisi yardımcılarını kullanmalıdır. Yardımcı, kanal/TUI sunumunu tutarlı tutarken her çalıştırma altyapısı kendi protokol ayrıştırmasını ve bekleyen istek yaşam döngüsünü korur.

Pi benzeri kompakt araç yönlendirmesine ihtiyaç duyan yerel çalıştırma altyapıları `openclaw/plugin-sdk/agent-harness-tool-runtime` içinden `createAgentHarnessToolSurfaceRuntime(...)` kullanmalıdır. Bu; araç arama/kod modu denetim seçimini, yerel model yalın varsayılanlarını, çalışma zamanıyla uyumlu şema filtrelemeyi, gizli katalog yürütmesini, dizin hidrasyonunu ve katalog temizliğini sahiplenir. Çalıştırma altyapıları yine de SDK'ya özgü araç dönüştürmesini ve yerel yürütme geri çağrısını sahiplenir.

### Yerel Codex çalıştırma altyapısı modu

Paketlenmiş `codex` çalıştırma altyapısı, gömülü OpenClaw agent turları için yerel Codex modudur. Önce paketlenmiş `codex` Plugin'ini etkinleştirin ve yapılandırmanız kısıtlayıcı bir izin listesi kullanıyorsa `plugins.allow` içine `codex` ekleyin. Yerel uygulama sunucusu yapılandırmaları `openai/gpt-*` kullanmalıdır; OpenAI agent turları varsayılan olarak Codex çalıştırma altyapısını seçer. Eski Codex model referans rotaları `openclaw doctor --fix` ile onarılmalıdır ve eski `codex/*` model referansları yerel çalıştırma altyapısı için uyumluluk takma adları olarak kalır.

Bu mod çalıştığında Codex yerel iş parçacığı kimliğini, sürdürme davranışını, Compaction'ı ve uygulama sunucusu yürütmesini sahiplenir. OpenClaw ise sohbet kanalını, görünür döküm aynasını, araç ilkesini, onayları, medya teslimini ve oturum seçimini sahiplenmeye devam eder. Çalışmayı yalnızca Codex uygulama sunucusu yolunun üstlenebileceğini kanıtlamanız gerektiğinde sağlayıcı/model `agentRuntime.id: "codex"` kullanın. Açık Plugin çalışma zamanları kapalı hata verir; Codex uygulama sunucusu seçim hataları ve çalışma zamanı hataları başka bir çalışma zamanı üzerinden yeniden denenmez.

## Çalışma zamanı katılığı

Varsayılan olarak OpenClaw `auto` sağlayıcı/model çalışma zamanı ilkesini kullanır: kayıtlı Plugin çalıştırma altyapıları bir sağlayıcı/model çiftini üstlenebilir ve hiçbiri eşleşmediğinde gömülü çalışma zamanı turu işler. Resmi OpenAI sağlayıcısındaki OpenAI agent referansları varsayılan olarak Codex'e gider. Eksik çalıştırma altyapısı seçiminin gömülü çalışma zamanına yönlendirmek yerine başarısız olması gerektiğinde `agentRuntime.id: "codex"` gibi açık bir sağlayıcı/model Plugin çalışma zamanı kullanın. Seçilen Plugin çalıştırma altyapısı hataları her zaman sert biçimde başarısız olur. Bu, açık bir sağlayıcı/model `agentRuntime.id: "openclaw"` kullanımını engellemez.

Yalnızca Codex gömülü çalışmaları için:

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

Tek bir kanonik model için CLI arka ucu istiyorsanız çalışma zamanını o model girdisine koyun:

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-8",
      "models": {
        "anthropic/claude-opus-4-8": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

Agent başına geçersiz kılmalar aynı model kapsamlı şekli kullanır:

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

Bunun gibi eski tüm-agent çalışma zamanı örnekleri yok sayılır:

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

Açık bir Plugin runtime ile, istenen koşum kayıtlı değilse, çözümlenen sağlayıcı/modeli desteklemiyorsa veya tur yan etkileri üretmeden önce başarısız olursa oturum erken başarısız olur. Bu, yalnızca Codex dağıtımları ve Codex app-server yolunun gerçekten kullanımda olduğunu kanıtlaması gereken canlı testler için kasıtlıdır.

Bu ayar yalnızca gömülü ajan koşumunu denetler. Görüntü, video, müzik, TTS, PDF veya diğer sağlayıcıya özgü model yönlendirmelerini devre dışı bırakmaz.

## Yerel oturumlar ve transkript yansıtması

Bir koşum yerel bir oturum kimliği, iş parçacığı kimliği veya daemon tarafında sürdürme belirteci tutabilir. Bu bağlantıyı açıkça OpenClaw oturumuyla ilişkilendirilmiş halde tutun ve kullanıcıya görünen asistan/araç çıktısını OpenClaw transkriptine yansıtmaya devam edin.

OpenClaw transkripti şunlar için uyumluluk katmanı olarak kalır:

- kanal tarafından görülebilen oturum geçmişi
- transkript arama ve indeksleme
- sonraki bir turda yerleşik OpenClaw koşumuna geri dönme
- genel `/new`, `/reset` ve oturum silme davranışı

Koşumunuz bir yan bağlantı saklıyorsa, sahibi olan OpenClaw oturumu sıfırlandığında OpenClaw'un bunu temizleyebilmesi için `reset(...)` uygulayın.

## Araç ve medya sonuçları

Çekirdek, OpenClaw araç listesini oluşturur ve hazırlanmış denemeye aktarır. Bir koşum dinamik bir araç çağrısı yürüttüğünde, kanal medyasını kendiniz göndermek yerine araç sonucunu koşum sonuç şekli üzerinden geri döndürün.

Bu, metin, görüntü, video, müzik, TTS, onay ve mesajlaşma aracı çıktılarını OpenClaw destekli çalıştırmalarla aynı teslim yolunda tutar.

## Mevcut sınırlamalar

- Genel içe aktarma yolu geneldir, ancak bazı deneme/sonuç tür takma adları uyumluluk için hâlâ eski adları taşır.
- Üçüncü taraf koşum kurulumu deneyseldir. Yerel bir oturum runtime’ına ihtiyaç duyana kadar sağlayıcı Pluginlerini tercih edin.
- Koşum değiştirme turlar arasında desteklenir. Yerel araçlar, onaylar, asistan metni veya ileti gönderimleri başladıktan sonra bir turun ortasında koşumları değiştirmeyin.

## İlgili

- [SDK’ye Genel Bakış](/tr/plugins/sdk-overview)
- [Runtime Yardımcıları](/tr/plugins/sdk-runtime)
- [Sağlayıcı Pluginleri](/tr/plugins/sdk-provider-plugins)
- [Codex Koşumu](/tr/plugins/codex-harness)
- [Model Sağlayıcıları](/tr/concepts/model-providers)
