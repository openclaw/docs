---
read_when:
    - Gömülü ajan çalışma zamanını veya harness kayıt defterini değiştiriyorsunuz.
    - Paketlenmiş veya güvenilen bir Plugin'den bir ajan harness'i kaydediyorsunuz.
    - Codex Plugin'inin model sağlayıcılarıyla nasıl ilişkili olduğunu anlamanız gerekiyor.
sidebarTitle: Agent Harness
summary: Düşük düzey gömülü ajan yürütücüsünün yerini alan Plugin'ler için deneysel SDK yüzeyi
title: Ajan harness Plugin'leri
x-i18n:
    generated_at: "2026-04-26T11:36:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 340fc6207dabc6ffe7ffb9c07ca9e80e76f1034d4978c41279dc826468302181
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

Bir **ajan harness'i**, hazırlanmış tek bir OpenClaw ajan turunun düşük düzey yürütücüsüdür. Bu bir model sağlayıcısı, kanal veya araç kayıt defteri değildir.
Kullanıcıya dönük zihinsel model için bkz. [Ajan çalışma zamanları](/tr/concepts/agent-runtimes).

Bu yüzeyi yalnızca paketlenmiş veya güvenilen yerel Plugin'ler için kullanın. Sözleşme
hâlâ deneyseldir çünkü parametre türleri kasıtlı olarak geçerli gömülü
çalıştırıcıyı yansıtır.

## Ne zaman bir harness kullanılmalı

Bir model ailesinin kendi yerel oturum
çalışma zamanı olduğunda ve normal OpenClaw sağlayıcı taşıması yanlış soyutlama olduğunda ajan harness'i kaydedin.

Örnekler:

- iş parçacıklarının ve Compaction'ın sahibi olan yerel bir coding-agent sunucusu
- yerel plan/akıl yürütme/araç olaylarını akıtması gereken bir yerel CLI veya daemon
- OpenClaw
  oturum dökümüne ek olarak kendi resume id'sine ihtiyaç duyan bir model çalışma zamanı

Yalnızca yeni bir LLM API eklemek için harness kaydetmeyin. Normal HTTP veya
WebSocket model API'leri için bir [sağlayıcı Plugin'i](/tr/plugins/sdk-provider-plugins) oluşturun.

## Çekirdeğin hâlâ sahip olduğu şeyler

Bir harness seçilmeden önce OpenClaw şunları zaten çözmüştür:

- sağlayıcı ve model
- çalışma zamanı auth durumu
- thinking düzeyi ve bağlam bütçesi
- OpenClaw dökümü/oturum dosyası
- çalışma alanı, sandbox ve araç ilkesi
- kanal yanıt geri çağrıları ve akış geri çağrıları
- model geri dönüşü ve canlı model değiştirme ilkesi

Bu ayrım kasıtlıdır. Bir harness hazırlanmış bir denemeyi çalıştırır; sağlayıcı seçmez, kanal teslimatının yerini almaz veya modelleri sessizce değiştirmez.

Hazırlanmış deneme ayrıca, PI ve yerel
harness'ler arasında ortak kalması gereken çalışma zamanı kararları için OpenClaw sahipli bir ilke paketi olan `params.runtimePlan` içerir:

- sağlayıcı farkındalıklı araç şeması ilkesi için `runtimePlan.tools.normalize(...)` ve
  `runtimePlan.tools.logDiagnostics(...)`
- döküm temizleme ve
  araç çağrısı onarım ilkesi için `runtimePlan.transcript.resolvePolicy(...)`
- paylaşılan `NO_REPLY` ve medya
  teslimatı bastırma için `runtimePlan.delivery.isSilentPayload(...)`
- model geri dönüş sınıflandırması için `runtimePlan.outcome.classifyRunResult(...)`
- çözülmüş sağlayıcı/model/harness meta verileri için `runtimePlan.observability`

Harness'ler PI davranışıyla eşleşmesi gereken kararlar için planı kullanabilir, ancak yine de bunu host sahipli deneme durumu olarak ele almalıdır. Bunu değiştirmeyin veya tek bir tur içinde sağlayıcı/model değiştirmek için kullanmayın.

## Bir harness kaydetme

**İçe aktarma:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "Yerel ajan harness'im",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Yerel iş parçacığınızı başlatın veya devam ettirin.
    // params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent ve diğer hazırlanmış deneme alanlarını kullanın.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "Yerel Ajanım",
  description: "Seçili modelleri yerel bir ajan daemon'u üzerinden çalıştırır.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Seçim ilkesi

OpenClaw bir harness'i sağlayıcı/model çözümünden sonra seçer:

1. Mevcut bir oturumun kaydedilmiş harness kimliği kazanır; böylece config/env değişiklikleri
   o dökümü başka bir çalışma zamanına sıcak şekilde geçirmez.
2. `OPENCLAW_AGENT_RUNTIME=<id>`, henüz sabitlenmemiş
   oturumlar için bu kimliğe sahip kayıtlı bir harness'i zorlar.
3. `OPENCLAW_AGENT_RUNTIME=pi`, yerleşik PI harness'ini zorlar.
4. `OPENCLAW_AGENT_RUNTIME=auto`, kayıtlı harness'lere çözülmüş sağlayıcı/modeli destekleyip desteklemediklerini sorar.
5. Kayıtlı hiçbir harness eşleşmezse, PI geri dönüşü
   devre dışı bırakılmadıkça OpenClaw PI kullanır.

Plugin harness hataları çalıştırma hataları olarak görünür. `auto` modunda PI geri dönüşü
yalnızca kayıtlı hiçbir Plugin harness'i çözülmüş
sağlayıcı/modeli desteklemediğinde kullanılır. Bir Plugin harness'i bir çalıştırmayı üstlendikten sonra OpenClaw aynı turu PI üzerinden yeniden oynatmaz çünkü bu auth/çalışma zamanı anlamlarını değiştirebilir
veya yan etkileri yineleyebilir.

Seçilen harness kimliği, gömülü bir çalıştırmadan sonra oturum kimliğiyle birlikte kalıcı hale getirilir.
Harness pinleri öncesinde oluşturulmuş eski oturumlar, döküm geçmişine sahip olduklarında PI'ye sabitlenmiş kabul edilir. PI ile yerel bir Plugin harness'i arasında geçiş yaparken yeni/sıfırlanmış bir oturum kullanın. `/status`, varsayılan olmayan `codex` gibi harness kimliklerini `Fast` yanında gösterir; PI, varsayılan uyumluluk yolu olduğu için gizli kalır.
Seçilen harness şaşırtıcıysa `agents/harness` hata ayıklama günlüğünü etkinleştirin ve
gateway'in yapılandırılmış `agent harness selected` kaydını inceleyin. Bu, seçilen harness kimliğini, seçim nedenini, çalışma zamanı/geri dönüş ilkesini ve `auto` modunda her Plugin adayının destek sonucunu içerir.

Paketlenmiş Codex Plugin'i, harness kimliği olarak `codex` kaydeder. Çekirdek bunu
sıradan bir Plugin harness kimliği olarak ele alır; Codex'e özgü takma adlar ortak çalışma zamanı seçicide değil, Plugin'de
veya operatör yapılandırmasında bulunmalıdır.

## Sağlayıcı ve harness eşleştirmesi

Çoğu harness bir sağlayıcı da kaydetmelidir. Sağlayıcı model başvurularını,
auth durumunu, model meta verilerini ve `/model` seçimini OpenClaw'ın geri kalanına görünür kılar. Harness daha sonra `supports(...)` içinde bu sağlayıcıyı üstlenir.

Paketlenmiş Codex Plugin'i bu deseni izler:

- tercih edilen kullanıcı model başvuruları: `openai/gpt-5.5` artı
  `agentRuntime.id: "codex"`
- uyumluluk başvuruları: eski `codex/gpt-*` başvuruları kabul edilmeye devam eder, ancak yeni
  yapılandırmalar bunları normal sağlayıcı/model başvuruları olarak kullanmamalıdır
- harness kimliği: `codex`
- auth: sentetik sağlayıcı kullanılabilirliği, çünkü yerel Codex giriş/oturumunun sahibi Codex harness'idir
- app-server isteği: OpenClaw çıplak model kimliğini Codex'e gönderir ve
  harness'in yerel app-server protokolüyle konuşmasına izin verir

Codex Plugin'i eklemelidir. Düz `openai/gpt-*` başvuruları siz
`agentRuntime.id: "codex"` ile Codex harness'ini zorlamadıkça normal OpenClaw sağlayıcı yolunu kullanmaya devam eder. Eski `codex/gpt-*` başvuruları uyumluluk için yine Codex
sağlayıcısını ve harness'ini seçer.

Operatör kurulumu, model öneki örnekleri ve yalnızca Codex yapılandırmaları için bkz.
[Codex Harness](/tr/plugins/codex-harness).

OpenClaw, Codex app-server `0.125.0` veya daha yenisini gerektirir. Codex Plugin'i
app-server initialize handshake'ini denetler ve daha eski veya sürümsüz sunucuları engeller; böylece
OpenClaw yalnızca test edildiği protokol yüzeyine karşı çalışır. `0.125.0`
tabanı, Codex `0.124.0` içinde gelen yerel MCP hook yükü desteğini içerirken
OpenClaw'ı daha yeni test edilmiş kararlı hatta sabitler.

### Araç sonucu middleware'i

Paketlenmiş Plugin'ler, manifest'leri hedeflenen
çalışma zamanı kimliklerini `contracts.agentToolResultMiddleware` içinde bildirdiğinde,
`api.registerAgentToolResultMiddleware(...)` aracılığıyla çalışma zamanı tarafsız araç-sonuç middleware'i ekleyebilir. Bu güvenilen katman, PI veya Codex araç çıktısını tekrar modele beslemeden önce çalışması gereken eşzamansız araç-sonuç dönüşümleri içindir.

Eski paketlenmiş Plugin'ler, Codex app-server'a özgü
middleware için hâlâ `api.registerCodexAppServerExtensionFactory(...)` kullanabilir,
ancak yeni sonuç dönüşümleri çalışma zamanı tarafsız API'yi kullanmalıdır.
Yalnızca Pi'ye özgü `api.registerEmbeddedExtensionFactory(...)` hook'u kaldırılmıştır;
Pi araç-sonuç dönüşümleri çalışma zamanı tarafsız middleware kullanmalıdır.

### Terminal sonuç sınıflandırması

Kendi protokol izdüşümüne sahip yerel harness'ler,
tamamlanmış bir tur görünür yardımcı metni üretmediğinde
`openclaw/plugin-sdk/agent-harness-runtime` içinden
`classifyAgentHarnessTerminalOutcome(...)` kullanabilir. Yardımcı
`empty`, `reasoning-only` veya `planning-only` döndürür; böylece OpenClaw'ın geri dönüş ilkesi farklı bir modelle yeniden denemeye karar verebilir. Bilerek prompt hatalarını, sürmekte olan turları ve
`NO_REPLY` gibi kasıtlı sessiz yanıtları sınıflandırmadan bırakır.

### Yerel Codex harness modu

Paketlenmiş `codex` harness'i, gömülü OpenClaw
ajan turları için yerel Codex modudur. Önce paketlenmiş `codex` Plugin'ini etkinleştirin ve yapılandırmanız kısıtlayıcı bir izin listesi kullanıyorsa `plugins.allow` içine
`codex` ekleyin. Yerel app-server yapılandırmaları `agentRuntime.id: "codex"` ile `openai/gpt-*` kullanmalıdır.
Bunun yerine PI üzerinden Codex OAuth için `openai-codex/*` kullanın. Eski `codex/*`
model başvuruları yerel harness için uyumluluk takma adları olarak kalır.

Bu mod çalıştığında yerel iş parçacığı kimliğinin, resume davranışının,
Compaction'ın ve app-server yürütmesinin sahibi Codex olur. OpenClaw ise hâlâ sohbet kanalının,
görünür döküm aynasının, araç ilkesinin, onayların, medya teslimatının ve oturum
seçiminin sahibidir. Çalıştırmayı yalnızca Codex app-server yolunun üstlenebildiğini kanıtlamanız gerektiğinde
`fallback` geçersiz kılması olmadan `agentRuntime.id: "codex"` kullanın.
Açık Plugin çalışma zamanları zaten varsayılan olarak kapalı kalacak şekilde başarısız olur. PI'nin yalnızca eksik harness seçiminde devralmasını kasıtlı olarak istiyorsanız
yalnızca `fallback: "pi"` ayarlayın. Codex
app-server hataları zaten PI üzerinden yeniden denenmek yerine doğrudan başarısız olur.

## PI geri dönüşünü devre dışı bırakma

Varsayılan olarak OpenClaw, gömülü ajanları `agents.defaults.agentRuntime`
değerini `{ id: "auto", fallback: "pi" }` olarak ayarlayarak çalıştırır. `auto` modunda, kayıtlı Plugin
harness'leri bir sağlayıcı/model çiftini üstlenebilir. Hiçbiri eşleşmezse OpenClaw PI'ye geri döner.

`auto` modunda, eksik Plugin harness
seçiminin PI kullanmak yerine başarısız olmasını istiyorsanız `fallback: "none"` ayarlayın. `runtime: "codex"` gibi açık Plugin çalışma zamanları, aynı yapılandırma veya ortam geçersiz kılma kapsamında `fallback: "pi"` ayarlanmadıkça zaten varsayılan olarak kapalı kalacak şekilde başarısız olur. Seçili Plugin harness
hataları her zaman sert şekilde başarısız olur. Bu, açık `runtime: "pi"` veya
`OPENCLAW_AGENT_RUNTIME=pi` kullanımını engellemez.

Yalnızca Codex gömülü çalıştırmaları için:

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

Kayıtlı herhangi bir Plugin harness'inin eşleşen modelleri üstlenmesini ama OpenClaw'ın hiçbir zaman sessizce PI'ye geri dönmemesini istiyorsanız,
`runtime: "auto"` durumunu koruyun ve geri dönüşü devre dışı bırakın:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "none"
      }
    }
  }
}
```

Ajan başına geçersiz kılmalar aynı biçimi kullanır:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": {
          "id": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME`, yapılandırılmış çalışma zamanının üzerine yine yazar. Ortamdan PI geri dönüşünü devre dışı bırakmak için
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` kullanın.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Geri dönüş devre dışıyken, istenen harness kayıtlı değilse,
çözülmüş sağlayıcı/modeli desteklemiyorsa veya
tur yan etkileri üretmeden önce başarısız olursa bir oturum erken başarısız olur. Bu, yalnızca Codex dağıtımları ve
Codex app-server yolunun gerçekten kullanımda olduğunu kanıtlaması gereken canlı testler için kasıtlıdır.

Bu ayar yalnızca gömülü ajan harness'ini denetler. Görsel, video, müzik, TTS, PDF veya diğer sağlayıcıya özgü model yönlendirmesini devre dışı bırakmaz.

## Yerel oturumlar ve döküm aynası

Bir harness yerel bir oturum kimliği, iş parçacığı kimliği veya daemon taraflı resume belirteci tutabilir.
Bu bağlamayı OpenClaw oturumuyla açıkça ilişkilendirin ve
kullanıcı tarafından görülebilen yardımcı/araç çıktısını OpenClaw dökümüne aynalamaya devam edin.

OpenClaw dökümü şu amaçlar için uyumluluk katmanı olarak kalır:

- kanal tarafından görülebilen oturum geçmişi
- döküm araması ve indeksleme
- daha sonraki bir turda yerleşik PI harness'ine geri dönme
- genel `/new`, `/reset` ve oturum silme davranışı

Harness'iniz bir sidecar bağlama saklıyorsa, sahip olan OpenClaw oturumu sıfırlandığında OpenClaw'ın bunu temizleyebilmesi için `reset(...)` uygulayın.

## Araç ve medya sonuçları

Çekirdek, OpenClaw araç listesini oluşturur ve bunu hazırlanmış denemeye geçirir.
Bir harness dinamik bir araç çağrısı yürüttüğünde, araç sonucunu kanal medyasını kendiniz göndermek yerine
harness sonuç biçimi üzerinden geri döndürün.

Bu, metin, görsel, video, müzik, TTS, onay ve mesajlaşma aracı çıktılarının
PI destekli çalıştırmalarla aynı teslimat yolunda kalmasını sağlar.

## Geçerli sınırlamalar

- Genel içe aktarma yolu geneldir, ancak bazı deneme/sonuç tür takma adları
  uyumluluk için hâlâ `Pi` adları taşır.
- Üçüncü taraf harness kurulumu deneyseldir. Yerel oturum çalışma zamanına ihtiyaç duyana kadar
  sağlayıcı Plugin'lerini tercih edin.
- Turlar arasında harness değiştirme desteklenir. Yerel araçlar, onaylar, yardımcı metni veya mesaj
  gönderimleri başladıktan sonra bir turun ortasında harness değiştirmeyin.

## İlgili

- [SDK'ye genel bakış](/tr/plugins/sdk-overview)
- [Çalışma zamanı yardımcıları](/tr/plugins/sdk-runtime)
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins)
- [Codex Harness](/tr/plugins/codex-harness)
- [Model sağlayıcıları](/tr/concepts/model-providers)
