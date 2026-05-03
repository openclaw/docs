---
read_when:
    - Gömülü ajan çalışma zamanını veya test düzeneği kayıt defterini değiştiriyorsunuz
    - Paketle gelen veya güvenilir bir Plugin'den ajan çalıştırma düzeneği kaydediyorsunuz
    - Codex Plugin'inin model sağlayıcılarıyla nasıl ilişkili olduğunu anlamanız gerekir
sidebarTitle: Agent Harness
summary: Düşük seviyeli gömülü ajan yürütücüsünün yerini alan Plugin'ler için deneysel SDK yüzeyi
title: Aracı yürütme altyapısı Plugin'leri
x-i18n:
    generated_at: "2026-05-03T09:01:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed416bbb433fc502c60fd8c24d20cd0f862d45472ff2eb0e2484b256b58f1b35
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**Ajan yürütücüsü**, hazırlanmış tek bir OpenClaw ajan dönüşü için düşük seviyeli
çalıştırıcıdır. Bir model sağlayıcı, kanal veya araç kayıt sistemi değildir.
Kullanıcıya dönük zihinsel model için bkz. [Ajan çalışma zamanları](/tr/concepts/agent-runtimes).

Bu yüzeyi yalnızca paketlenmiş veya güvenilir yerel Plugin'ler için kullanın. Sözleşme
hâlâ deneyseldir çünkü parametre türleri bilinçli olarak mevcut gömülü çalıştırıcıyı
yansıtır.

## Yürütücü ne zaman kullanılır?

Bir model ailesinin kendi yerel oturum çalışma zamanı olduğunda ve normal OpenClaw
sağlayıcı aktarımı yanlış soyutlama olduğunda bir ajan yürütücüsü kaydedin.

Örnekler:

- iş parçacıklarını ve Compaction'ı sahiplenen yerel bir kodlama ajanı sunucusu
- yerel plan/akıl yürütme/araç olaylarını akış olarak iletmesi gereken yerel bir CLI veya arka plan süreci
- OpenClaw oturum dökümüne ek olarak kendi sürdürme kimliğine ihtiyaç duyan bir model çalışma zamanı

Yalnızca yeni bir LLM API'si eklemek için yürütücü kaydetmeyin. Normal HTTP veya
WebSocket model API'leri için bir [sağlayıcı plugin](/tr/plugins/sdk-provider-plugins) oluşturun.

## Çekirdeğin hâlâ sahiplendiği şeyler

Bir yürütücü seçilmeden önce OpenClaw şunları zaten çözümlemiştir:

- sağlayıcı ve model
- çalışma zamanı kimlik doğrulama durumu
- düşünme seviyesi ve bağlam bütçesi
- OpenClaw döküm/oturum dosyası
- çalışma alanı, sandbox ve araç ilkesi
- kanal yanıt geri çağrıları ve akış geri çağrıları
- model geri dönüşü ve canlı model değiştirme ilkesi

Bu ayrım bilinçlidir. Bir yürütücü hazırlanmış bir denemeyi çalıştırır; sağlayıcıları
seçmez, kanal teslimini değiştirmez veya modelleri sessizce değiştirmez.

Hazırlanmış deneme ayrıca PI ve yerel yürütücüler arasında ortak kalması gereken
çalışma zamanı kararları için OpenClaw'a ait bir ilke paketi olan `params.runtimePlan`
alanını içerir:

- sağlayıcıya duyarlı araç şema ilkesi için `runtimePlan.tools.normalize(...)` ve
  `runtimePlan.tools.logDiagnostics(...)`
- döküm temizleme ve araç çağrısı onarım ilkesi için `runtimePlan.transcript.resolvePolicy(...)`
- paylaşılan `NO_REPLY` ve medya teslimini bastırma için `runtimePlan.delivery.isSilentPayload(...)`
- model geri dönüş sınıflandırması için `runtimePlan.outcome.classifyRunResult(...)`
- çözümlenmiş sağlayıcı/model/yürütücü meta verileri için `runtimePlan.observability`

Yürütücüler, PI davranışıyla eşleşmesi gereken kararlar için planı kullanabilir, ancak
yine de bunu ana bilgisayara ait deneme durumu olarak ele almalıdır. Bunu değiştirmeyin
veya bir dönüş içinde sağlayıcı/model değiştirmek için kullanmayın.

## Yürütücü kaydetme

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

OpenClaw, sağlayıcı/model çözümlemesinden sonra bir yürütücü seçer:

1. Mevcut bir oturumun kaydedilmiş yürütücü kimliği kazanır; böylece yapılandırma/ortam değişiklikleri
   o dökümü başka bir çalışma zamanına anında geçirmez.
2. `OPENCLAW_AGENT_RUNTIME=<id>`, zaten sabitlenmemiş oturumlar için o kimliğe sahip
   kayıtlı bir yürütücüyü zorunlu kılar.
3. `OPENCLAW_AGENT_RUNTIME=pi`, yerleşik PI yürütücüsünü zorunlu kılar.
4. `OPENCLAW_AGENT_RUNTIME=auto`, kayıtlı yürütücülere çözümlenmiş sağlayıcı/modeli
   destekleyip desteklemediklerini sorar.
5. Eşleşen kayıtlı yürütücü yoksa, PI geri dönüşü devre dışı bırakılmadığı sürece
   OpenClaw PI kullanır.

Plugin yürütücü hataları çalışma hataları olarak yüzeye çıkar. `auto` modunda PI geri dönüşü,
yalnızca çözümlenmiş sağlayıcı/modeli destekleyen kayıtlı Plugin yürütücüsü yoksa kullanılır.
Bir Plugin yürütücüsü bir çalışmayı sahiplendiğinde OpenClaw aynı dönüşü PI üzerinden
yeniden oynatmaz; çünkü bu, kimlik doğrulama/çalışma zamanı semantiğini değiştirebilir
veya yan etkileri çoğaltabilir.

Seçilen yürütücü kimliği, gömülü bir çalıştırmadan sonra oturum kimliğiyle birlikte kalıcı hale getirilir.
Yürütücü sabitlemeleri öncesinde oluşturulmuş eski oturumlar, döküm geçmişleri olduğunda PI'ye
sabitlenmiş kabul edilir. PI ile yerel Plugin yürütücüsü arasında geçiş yaparken yeni/sıfırlanmış
bir oturum kullanın. `/status`, `Fast` yanında `codex` gibi varsayılan olmayan yürütücü kimliklerini
gösterir; PI varsayılan uyumluluk yolu olduğu için gizli kalır. Seçilen yürütücü şaşırtıcıysa
`agents/harness` hata ayıklama günlüğünü etkinleştirin ve Gateway'in yapılandırılmış
`agent harness selected` kaydını inceleyin. Bu kayıt seçilen yürütücü kimliğini, seçim nedenini,
çalışma zamanı/geri dönüş ilkesini ve `auto` modunda her Plugin adayının destek sonucunu içerir.

Paketlenmiş Codex Plugin'i, yürütücü kimliği olarak `codex` kaydeder. Çekirdek bunu sıradan
bir Plugin yürütücü kimliği olarak ele alır; Codex'e özgü takma adlar paylaşılan çalışma zamanı
seçicide değil, Plugin'de veya operatör yapılandırmasında yer almalıdır.

## Sağlayıcı ve yürütücü eşleştirmesi

Çoğu yürütücü ayrıca bir sağlayıcı kaydetmelidir. Sağlayıcı, model referanslarını, kimlik doğrulama
durumunu, model meta verilerini ve `/model` seçimini OpenClaw'un geri kalanına görünür kılar.
Yürütücü daha sonra `supports(...)` içinde o sağlayıcıyı sahiplenir.

Paketlenmiş Codex Plugin'i bu kalıbı izler:

- tercih edilen kullanıcı model referansları: `openai/gpt-5.5` artı
  `agentRuntime.id: "codex"`
- uyumluluk referansları: eski `codex/gpt-*` referansları kabul edilmeye devam eder, ancak yeni
  yapılandırmalar bunları normal sağlayıcı/model referansları olarak kullanmamalıdır
- yürütücü kimliği: `codex`
- kimlik doğrulama: sentetik sağlayıcı kullanılabilirliği, çünkü Codex yürütücüsü yerel
  Codex oturum açma/oturum durumunu sahiplenir
- uygulama sunucusu isteği: OpenClaw çıplak model kimliğini Codex'e gönderir ve yürütücünün
  yerel uygulama sunucusu protokolüyle konuşmasına izin verir

Codex Plugin'i eklemelidir. Düz `openai/gpt-*` referansları, Codex yürütücüsünü
`agentRuntime.id: "codex"` ile zorunlu kılmadığınız sürece normal OpenClaw sağlayıcı yolunu
kullanmaya devam eder. Eski `codex/gpt-*` referansları uyumluluk için hâlâ Codex sağlayıcısını
ve yürütücüsünü seçer.

Operatör kurulumu, model öneki örnekleri ve yalnızca Codex yapılandırmaları için bkz.
[Codex Yürütücüsü](/tr/plugins/codex-harness).

OpenClaw, Codex uygulama sunucusu `0.125.0` veya daha yenisini gerektirir. Codex Plugin'i,
uygulama sunucusu başlatma el sıkışmasını denetler ve eski veya sürümsüz sunucuları engeller;
böylece OpenClaw yalnızca test edildiği protokol yüzeyine karşı çalışır. `0.125.0` alt sınırı,
Codex `0.124.0` içinde gelen yerel MCP kanca yükü desteğini içerirken OpenClaw'u daha yeni
test edilmiş kararlı hatta sabitler.

### Araç sonucu ara yazılımı

Paketlenmiş Plugin'ler, manifestleri `contracts.agentToolResultMiddleware` içinde hedeflenen
çalışma zamanı kimliklerini bildirdiğinde `api.registerAgentToolResultMiddleware(...)` aracılığıyla
çalışma zamanından bağımsız araç sonucu ara yazılımı ekleyebilir. Bu güvenilir ayrım noktası,
PI veya Codex araç çıktısını modele geri beslemeden önce çalışması gereken zaman uyumsuz
araç sonucu dönüşümleri içindir.

Eski paketlenmiş Plugin'ler Codex uygulama sunucusuna özel ara yazılım için hâlâ
`api.registerCodexAppServerExtensionFactory(...)` kullanabilir, ancak yeni sonuç dönüşümleri
çalışma zamanından bağımsız API'yi kullanmalıdır. Yalnızca Pi için olan
`api.registerEmbeddedExtensionFactory(...)` kancası kaldırılmıştır; Pi araç sonucu dönüşümleri
çalışma zamanından bağımsız ara yazılım kullanmalıdır.

### Uç sonuç sınıflandırması

Kendi protokol izdüşümünü sahiplenen yerel yürütücüler, tamamlanmış bir dönüş görünür asistan
metni üretmediğinde `openclaw/plugin-sdk/agent-harness-runtime` içinden
`classifyAgentHarnessTerminalOutcome(...)` kullanabilir. Yardımcı, OpenClaw'un geri dönüş
ilkesinin farklı bir modelde yeniden deneme yapıp yapmayacağına karar verebilmesi için
`empty`, `reasoning-only` veya `planning-only` döndürür. Bilinçli olarak istem hatalarını,
devam eden dönüşleri ve `NO_REPLY` gibi kasıtlı sessiz yanıtları sınıflandırmadan bırakır.

### Yerel Codex yürütücü modu

Paketlenmiş `codex` yürütücüsü, gömülü OpenClaw ajan dönüşleri için yerel Codex modudur.
Önce paketlenmiş `codex` Plugin'ini etkinleştirin ve yapılandırmanız kısıtlayıcı bir izin listesi
kullanıyorsa `plugins.allow` içine `codex` ekleyin. Yerel uygulama sunucusu yapılandırmaları
`agentRuntime.id: "codex"` ile `openai/gpt-*` kullanmalıdır. PI üzerinden Codex OAuth için
`openai-codex/*` kullanın. Eski `codex/*` model referansları yerel yürütücü için uyumluluk
takma adları olarak kalır.

Bu mod çalıştığında Codex yerel iş parçacığı kimliğini, sürdürme davranışını, Compaction'ı ve
uygulama sunucusu yürütmesini sahiplenir. OpenClaw hâlâ sohbet kanalını, görünür döküm aynasını,
araç ilkesini, onayları, medya teslimini ve oturum seçimini sahiplenir. Çalışmayı yalnızca
Codex uygulama sunucusu yolunun sahiplenebileceğini kanıtlamanız gerektiğinde
`agentRuntime.id: "codex"` kullanın. Açık Plugin çalışma zamanları kapalı şekilde başarısız olur;
Codex uygulama sunucusu seçim hataları ve çalışma zamanı hataları PI üzerinden yeniden denenmez.

## Çalışma zamanı katılığı

Varsayılan olarak OpenClaw, gömülü ajanları OpenClaw Pi ile çalıştırır. `auto` modunda kayıtlı
Plugin yürütücüleri bir sağlayıcı/model çiftini sahiplenebilir ve hiçbir eşleşme olmadığında dönüşü
PI işler. Eksik yürütücü seçiminin PI üzerinden yönlendirilmek yerine başarısız olması gerektiğinde
`agentRuntime.id: "codex"` gibi açık bir Plugin çalışma zamanı kullanın. Seçilen Plugin yürütücü
hataları her zaman kesin başarısız olur. Bu, açık `agentRuntime.id: "pi"` veya
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

Eşleşen modelleri herhangi bir kayıtlı Plugin yürütücüsünün sahiplenmesini ve aksi durumda PI
kullanılmasını istiyorsanız `id: "auto"` ayarlayın:

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

Ajan başına geçersiz kılmalar aynı yapıyı kullanır:

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

`OPENCLAW_AGENT_RUNTIME` hâlâ yapılandırılmış çalışma zamanını geçersiz kılar.

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Açık bir Plugin çalışma zamanı ile, istenen yürütücü kayıtlı olmadığında, çözümlenmiş
sağlayıcı/modeli desteklemediğinde veya dönüş yan etkileri üretmeden önce başarısız olduğunda
bir oturum erken başarısız olur. Bu, yalnızca Codex dağıtımları ve Codex uygulama sunucusu
yolunun gerçekten kullanımda olduğunu kanıtlaması gereken canlı testler için bilinçlidir.

Bu ayar yalnızca gömülü ajan yürütücüsünü denetler. Görsel, video, müzik, TTS, PDF veya diğer
sağlayıcıya özgü model yönlendirmelerini devre dışı bırakmaz.

## Yerel oturumlar ve döküm aynası

Bir yürütücü yerel bir oturum kimliği, iş parçacığı kimliği veya arka plan süreci tarafı sürdürme
belirteci tutabilir. Bu bağı açıkça OpenClaw oturumuyla ilişkilendirin ve kullanıcıya görünür
asistan/araç çıktısını OpenClaw dökümüne aynalamayı sürdürün.

OpenClaw dökümü aşağıdakiler için uyumluluk katmanı olarak kalır:

- kanalda görünür oturum geçmişi
- döküm arama ve dizinleme
- sonraki bir dönüşte yerleşik PI yürütücüsüne geri geçme
- genel `/new`, `/reset` ve oturum silme davranışı

Yürütücünüz bir yan bağ tutuyorsa, OpenClaw'un sahip olan OpenClaw oturumu sıfırlandığında
bunu temizleyebilmesi için `reset(...)` uygulayın.

## Araç ve medya sonuçları

Çekirdek OpenClaw araç listesini oluşturur ve hazırlanmış denemeye geçirir. Bir yürütücü dinamik
bir araç çağrısı yürüttüğünde, kanal medyasını kendiniz göndermek yerine araç sonucunu yürütücü
sonuç şekli üzerinden geri döndürün.

Bu, metin, görsel, video, müzik, TTS, onay ve mesajlaşma aracı çıktılarını PI destekli
çalıştırmalarla aynı teslim yolunda tutar.

## Mevcut sınırlamalar

- Herkese açık içe aktarma yolu geneldir, ancak bazı girişim/sonuç tür takma adları uyumluluk için hâlâ `Pi` adlarını taşır.
- Üçüncü taraf koşum kurulumu deneyseldir. Yerel oturum çalışma zamanına ihtiyaç duyana kadar sağlayıcı Plugin'lerini tercih edin.
- Koşum değiştirme, dönüşler arasında desteklenir. Yerel araçlar, onaylar, asistan metni veya ileti gönderimleri başladıktan sonra bir dönüşün ortasında koşumları değiştirmeyin.

## İlgili

- [SDK Genel Bakış](/tr/plugins/sdk-overview)
- [Çalışma Zamanı Yardımcıları](/tr/plugins/sdk-runtime)
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins)
- [Codex Koşumu](/tr/plugins/codex-harness)
- [Model Sağlayıcıları](/tr/concepts/model-providers)
