---
read_when:
    - Gömülü ajan çalışma zamanını veya test düzeneği kayıt defterini değiştiriyorsunuz
    - Paketle birlikte gelen veya güvenilir bir Plugin'den bir ajan yürütme düzeneği kaydediyorsunuz
    - Codex Plugin'inin model sağlayıcılarıyla nasıl ilişkili olduğunu anlamanız gerekir
sidebarTitle: Agent Harness
summary: Düşük seviyeli yerleşik ajan yürütücüsünün yerine geçen Plugin'ler için deneysel SDK yüzeyi
title: Ajan çalışma düzeneği Plugin'leri
x-i18n:
    generated_at: "2026-05-02T09:02:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: b6e55d2df09c3965e1397be72f19dec2a6ed941ac8b7b01be8eee0f9713400dc
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**Ajan çalıştırma iskeleti**, hazırlanmış bir OpenClaw ajan turu için düşük seviyeli yürütücüdür. Bir model sağlayıcısı, kanal veya araç kayıt defteri değildir.
Kullanıcıya dönük zihinsel model için bkz. [Ajan çalışma zamanları](/tr/concepts/agent-runtimes).

Bu yüzeyi yalnızca paketlenmiş veya güvenilir yerel Plugin'ler için kullanın. Sözleşme hâlâ deneyseldir çünkü parametre türleri bilinçli olarak mevcut gömülü çalıştırıcıyı yansıtır.

## Çalıştırma iskeleti ne zaman kullanılmalı

Bir model ailesinin kendi yerel oturum çalışma zamanı varsa ve normal OpenClaw sağlayıcı aktarımı yanlış soyutlama ise bir ajan çalıştırma iskeleti kaydedin.

Örnekler:

- iş parçacıklarını ve Compaction'ı yöneten yerel bir kodlama ajanı sunucusu
- yerel plan/akıl yürütme/araç olaylarını aktarması gereken yerel bir CLI veya daemon
- OpenClaw oturum dökümüne ek olarak kendi sürdürme kimliğine ihtiyaç duyan bir model çalışma zamanı

Yalnızca yeni bir LLM API'si eklemek için bir çalıştırma iskeleti kaydetmeyin. Normal HTTP veya WebSocket model API'leri için bir [sağlayıcı Plugin'i](/tr/plugins/sdk-provider-plugins) oluşturun.

## Çekirdeğin hâlâ sahip oldukları

Bir çalıştırma iskeleti seçilmeden önce OpenClaw şunları zaten çözümlemiş olur:

- sağlayıcı ve model
- çalışma zamanı kimlik doğrulama durumu
- düşünme seviyesi ve bağlam bütçesi
- OpenClaw döküm/oturum dosyası
- çalışma alanı, sandbox ve araç ilkesi
- kanal yanıt geri çağrıları ve akış geri çağrıları
- model geri dönüşü ve canlı model değiştirme ilkesi

Bu ayrım bilinçlidir. Bir çalıştırma iskeleti hazırlanmış bir denemeyi çalıştırır; sağlayıcı seçmez, kanal teslimini değiştirmez veya modelleri sessizce değiştirmez.

Hazırlanmış deneme ayrıca PI ve yerel çalıştırma iskeletleri arasında ortak kalması gereken çalışma zamanı kararları için OpenClaw'a ait bir ilke paketi olan `params.runtimePlan` öğesini de içerir:

- sağlayıcıya duyarlı araç şeması ilkesi için `runtimePlan.tools.normalize(...)` ve
  `runtimePlan.tools.logDiagnostics(...)`
- döküm temizleme ve araç çağrısı onarım ilkesi için `runtimePlan.transcript.resolvePolicy(...)`
- paylaşılan `NO_REPLY` ve medya teslimi bastırma için `runtimePlan.delivery.isSilentPayload(...)`
- model geri dönüş sınıflandırması için `runtimePlan.outcome.classifyRunResult(...)`
- çözümlenmiş sağlayıcı/model/çalıştırma iskeleti meta verileri için `runtimePlan.observability`

Çalıştırma iskeletleri, PI davranışıyla eşleşmesi gereken kararlar için planı kullanabilir, ancak yine de onu ana makineye ait deneme durumu olarak ele almalıdır. Bir tur içinde sağlayıcıları/modelleri değiştirmek için onu mutasyona uğratmayın veya kullanmayın.

## Çalıştırma iskeleti kaydetme

**İçe aktarım:** `openclaw/plugin-sdk/agent-harness`

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

OpenClaw, sağlayıcı/model çözümlemesinden sonra bir çalıştırma iskeleti seçer:

1. Var olan bir oturumun kaydedilmiş çalıştırma iskeleti kimliği önceliklidir; böylece yapılandırma/ortam değişiklikleri o dökümü başka bir çalışma zamanına anında geçirmez.
2. `OPENCLAW_AGENT_RUNTIME=<id>`, henüz sabitlenmemiş oturumlar için bu kimliğe sahip kayıtlı bir çalıştırma iskeletini zorunlu kılar.
3. `OPENCLAW_AGENT_RUNTIME=pi`, yerleşik PI çalıştırma iskeletini zorunlu kılar.
4. `OPENCLAW_AGENT_RUNTIME=auto`, kayıtlı çalıştırma iskeletlerine çözümlenen sağlayıcıyı/modeli destekleyip desteklemediklerini sorar.
5. Kayıtlı hiçbir çalıştırma iskeleti eşleşmezse, PI geri dönüşü devre dışı değilse OpenClaw PI kullanır.

Plugin çalıştırma iskeleti hataları çalıştırma hataları olarak görünür. `auto` modunda PI geri dönüşü yalnızca çözümlenen sağlayıcı/modeli destekleyen kayıtlı bir Plugin çalıştırma iskeleti yoksa kullanılır. Bir Plugin çalıştırma iskeleti bir çalıştırmayı üstlendikten sonra OpenClaw aynı turu PI üzerinden yeniden oynatmaz; çünkü bu, kimlik doğrulama/çalışma zamanı anlamlarını değiştirebilir veya yan etkileri çoğaltabilir.

Seçilen çalıştırma iskeleti kimliği, gömülü bir çalıştırmadan sonra oturum kimliğiyle birlikte kalıcılaştırılır. Çalıştırma iskeleti sabitlemelerinden önce oluşturulan eski oturumlar, döküm geçmişleri olduğunda PI'ya sabitlenmiş olarak ele alınır. PI ile yerel bir Plugin çalıştırma iskeleti arasında geçiş yaparken yeni/sıfırlanmış bir oturum kullanın. `/status`, `Fast` yanında `codex` gibi varsayılan olmayan çalıştırma iskeleti kimliklerini gösterir; PI varsayılan uyumluluk yolu olduğu için gizli kalır.
Seçilen çalıştırma iskeleti şaşırtıcıysa `agents/harness` hata ayıklama günlüğünü etkinleştirin ve Gateway'in yapılandırılmış `agent harness selected` kaydını inceleyin. Bu kayıt, seçilen çalıştırma iskeleti kimliğini, seçim nedenini, çalışma zamanı/geri dönüş ilkesini ve `auto` modunda her Plugin adayının destek sonucunu içerir.

Paketlenmiş Codex Plugin'i, çalıştırma iskeleti kimliği olarak `codex` kaydeder. Çekirdek bunu sıradan bir Plugin çalıştırma iskeleti kimliği olarak ele alır; Codex'e özgü takma adlar paylaşılan çalışma zamanı seçicisinde değil, Plugin'de veya operatör yapılandırmasında yer almalıdır.

## Sağlayıcı ve çalıştırma iskeleti eşleştirmesi

Çoğu çalıştırma iskeleti ayrıca bir sağlayıcı kaydetmelidir. Sağlayıcı; model başvurularını, kimlik doğrulama durumunu, model meta verilerini ve `/model` seçimini OpenClaw'ın geri kalanına görünür kılar. Ardından çalıştırma iskeleti bu sağlayıcıyı `supports(...)` içinde üstlenir.

Paketlenmiş Codex Plugin'i bu kalıbı izler:

- tercih edilen kullanıcı model başvuruları: `openai/gpt-5.5` artı
  `agentRuntime.id: "codex"`
- uyumluluk başvuruları: eski `codex/gpt-*` başvuruları kabul edilmeye devam eder, ancak yeni yapılandırmalar bunları normal sağlayıcı/model başvuruları olarak kullanmamalıdır
- çalıştırma iskeleti kimliği: `codex`
- kimlik doğrulama: sentetik sağlayıcı kullanılabilirliği, çünkü Codex çalıştırma iskeleti yerel Codex oturum açma/oturumunu yönetir
- uygulama sunucusu isteği: OpenClaw yalın model kimliğini Codex'e gönderir ve çalıştırma iskeletinin yerel uygulama sunucusu protokolüyle konuşmasına izin verir

Codex Plugin'i eklemelidir. Düz `openai/gpt-*` başvuruları, Codex çalıştırma iskeletini `agentRuntime.id: "codex"` ile zorunlu kılmadığınız sürece normal OpenClaw sağlayıcı yolunu kullanmaya devam eder. Eski `codex/gpt-*` başvuruları uyumluluk için hâlâ Codex sağlayıcısını ve çalıştırma iskeletini seçer.

Operatör kurulumu, model öneki örnekleri ve yalnızca Codex yapılandırmaları için bkz.
[Codex Harness](/tr/plugins/codex-harness).

OpenClaw, Codex app-server `0.125.0` veya daha yeni bir sürüm gerektirir. Codex Plugin'i,
app-server başlatma el sıkışmasını denetler ve eski ya da sürümsüz sunucuları engeller; böylece
OpenClaw yalnızca test edildiği protokol yüzeyine karşı çalışır. `0.125.0` alt sınırı,
Codex `0.124.0` içinde gelen yerel MCP kanca yükü desteğini içerirken OpenClaw'ı daha yeni,
test edilmiş kararlı hatta sabitler.

### Araç sonucu ara yazılımı

Birlikte gelen Plugin'ler, manifestleri hedeflenen çalışma zamanı kimliklerini
`contracts.agentToolResultMiddleware` içinde bildirdiğinde
`api.registerAgentToolResultMiddleware(...)` aracılığıyla çalışma zamanından bağımsız araç sonucu ara yazılımı ekleyebilir. Bu güvenilir
yüzey, PI veya Codex araç çıktısını modele geri beslemeden önce çalışması gereken zaman uyumsuz araç sonucu dönüşümleri içindir.

Eski birlikte gelen Plugin'ler, yalnızca Codex app-server ara yazılımı için
`api.registerCodexAppServerExtensionFactory(...)` kullanmaya devam edebilir, ancak yeni sonuç dönüşümleri çalışma zamanından bağımsız API'yi kullanmalıdır.
Yalnızca Pi'ye özgü `api.registerEmbeddedExtensionFactory(...)` kancası kaldırıldı;
Pi araç sonucu dönüşümleri çalışma zamanından bağımsız ara yazılım kullanmalıdır.

### Terminal sonuç sınıflandırması

Kendi protokol izdüşümüne sahip yerel harness'lar, tamamlanan bir dönüş görünür
asistan metni üretmediğinde `openclaw/plugin-sdk/agent-harness-runtime` üzerinden
`classifyAgentHarnessTerminalOutcome(...)` kullanabilir. Yardımcı, OpenClaw'ın
geri dönüş politikasının farklı bir modelde yeniden deneme yapıp yapmayacağına karar verebilmesi için
`empty`, `reasoning-only` veya `planning-only` döndürür. İstem hatalarını,
sürmekte olan dönüşleri ve `NO_REPLY` gibi kasıtlı sessiz yanıtları bilerek sınıflandırmaz.

### Yerel Codex harness modu

Birlikte gelen `codex` harness'ı, gömülü OpenClaw ajan dönüşleri için yerel Codex modudur.
Önce birlikte gelen `codex` Plugin'ini etkinleştirin ve yapılandırmanız kısıtlayıcı bir izin listesi kullanıyorsa
`plugins.allow` içine `codex` ekleyin. Yerel app-server yapılandırmaları
`agentRuntime.id: "codex"` ile `openai/gpt-*` kullanmalıdır.
PI üzerinden Codex OAuth için bunun yerine `openai-codex/*` kullanın. Eski `codex/*`
model başvuruları, yerel harness için uyumluluk takma adları olarak kalır.

Bu mod çalıştığında yerel iş parçacığı kimliği, sürdürme davranışı,
Compaction ve app-server yürütmesi Codex tarafından yönetilir. OpenClaw ise sohbet kanalını,
görünür transkript aynasını, araç politikasını, onayları, medya teslimini ve oturum
seçimini yönetmeye devam eder. Yalnızca Codex app-server yolunun çalıştırmayı üstlenebileceğini kanıtlamanız gerektiğinde
`fallback` geçersiz kılması olmadan `agentRuntime.id: "codex"` kullanın.
Açık Plugin çalışma zamanları varsayılan olarak zaten kapalı biçimde başarısız olur. `fallback: "pi"` değerini
yalnızca eksik harness seçimini bilerek PI'nin işlemesini istediğinizde ayarlayın. Codex
app-server hataları zaten PI üzerinden yeniden denemek yerine doğrudan başarısız olur.

## PI geri dönüşünü devre dışı bırakma

Varsayılan olarak OpenClaw, gömülü ajanları `agents.defaults.agentRuntime`
`{ id: "auto", fallback: "pi" }` olarak ayarlanmış şekilde çalıştırır. `auto` modunda, kayıtlı Plugin
harness'ları bir sağlayıcı/model çiftini üstlenebilir. Hiçbiri eşleşmezse OpenClaw PI'ye geri döner.

`auto` modunda, eksik Plugin harness seçiminin PI kullanmak yerine başarısız olmasını istediğinizde
`fallback: "none"` ayarlayın. `agentRuntime.id: "codex"` gibi açık Plugin çalışma zamanları,
aynı yapılandırma veya ortam geçersiz kılma kapsamında `fallback: "pi"` ayarlanmadıkça
varsayılan olarak zaten kapalı biçimde başarısız olur. Seçili Plugin harness hataları her zaman kesin başarısız olur.
Bu, açık bir `agentRuntime.id: "pi"` veya `OPENCLAW_AGENT_RUNTIME=pi` değerini engellemez.

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

Kayıtlı herhangi bir Plugin harness'ının eşleşen modelleri üstlenmesini istiyor ancak
OpenClaw'ın sessizce PI'ye geri dönmesini asla istemiyorsanız `runtime: "auto"` değerini koruyun ve
geri dönüşü devre dışı bırakın:

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

Ajan başına geçersiz kılmalar aynı şekli kullanır:

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

`OPENCLAW_AGENT_RUNTIME` yapılandırılmış çalışma zamanını yine de geçersiz kılar. Ortamdan
PI geri dönüşünü devre dışı bırakmak için `OPENCLAW_AGENT_HARNESS_FALLBACK=none` kullanın.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Geri dönüş devre dışıyken, istenen harness kayıtlı olmadığında, çözümlenen sağlayıcı/modeli
desteklemediğinde veya dönüş yan etkileri üretmeden önce başarısız olduğunda oturum erken başarısız olur.
Bu, yalnızca Codex dağıtımları ve Codex app-server yolunun gerçekten kullanımda olduğunu kanıtlaması gereken
canlı testler için kasıtlıdır.

Bu ayar yalnızca gömülü ajan harness'ını denetler. Görüntü, video, müzik, TTS, PDF veya diğer
sağlayıcıya özgü model yönlendirmelerini devre dışı bırakmaz.

## Yerel oturumlar ve transkript aynası

Bir harness, yerel oturum kimliği, iş parçacığı kimliği veya daemon tarafı sürdürme belirteci tutabilir.
Bu bağı açıkça OpenClaw oturumuyla ilişkilendirin ve kullanıcıya görünür asistan/araç çıktısını
OpenClaw transkriptine aynalamayı sürdürün.

OpenClaw transkripti şunlar için uyumluluk katmanı olarak kalır:

- kanalda görünür oturum geçmişi
- transkript arama ve dizinleme
- sonraki bir dönüşte yerleşik PI harness'ına geri geçme
- genel `/new`, `/reset` ve oturum silme davranışı

Harness'ınız bir yan bağ depoluyorsa, sahip OpenClaw oturumu sıfırlandığında OpenClaw'ın
bunu temizleyebilmesi için `reset(...)` uygulayın.

## Araç ve medya sonuçları

Core, OpenClaw araç listesini oluşturur ve hazırlanmış denemeye aktarır.
Bir test düzeneği dinamik bir araç çağrısı yürüttüğünde, kanal medyasını kendiniz göndermek yerine araç sonucunu
test düzeneği sonuç biçimi üzerinden geri döndürün.

Bu, metin, görüntü, video, müzik, TTS, onay ve mesajlaşma aracı çıktılarını
Pi destekli çalıştırmalarla aynı teslim yolunda tutar.

## Mevcut sınırlamalar

- Genel içe aktarma yolu geneldir, ancak bazı deneme/sonuç tür takma adları uyumluluk için hâlâ
  `Pi` adları taşır.
- Üçüncü taraf test düzeneği kurulumu deneyseldir. Yerel oturum çalışma zamanına ihtiyaç duyana kadar sağlayıcı plugin'lerini
  tercih edin.
- Test düzeneği değiştirme, turlar arasında desteklenir. Yerel araçlar, onaylar, asistan metni veya mesaj
  gönderimleri başladıktan sonra bir turun ortasında test düzeneklerini değiştirmeyin.

## İlgili

- [SDK Genel Bakış](/tr/plugins/sdk-overview)
- [Çalışma Zamanı Yardımcıları](/tr/plugins/sdk-runtime)
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins)
- [Codex Test Düzeneği](/tr/plugins/codex-harness)
- [Model Sağlayıcıları](/tr/concepts/model-providers)
