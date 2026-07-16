---
read_when:
    - Gömülü ajan çalışma zamanını veya harness kayıt defterini değiştiriyorsunuz
    - Paketle birlikte gelen veya güvenilir bir pluginden bir ajan çalıştırma düzeneği kaydediyorsunuz
    - Codex Plugin'inin model sağlayıcılarıyla nasıl ilişkili olduğunu anlamanız gerekir
sidebarTitle: Agent Harness
summary: Düşük seviyeli gömülü ajan yürütücüsünün yerini alan pluginler için deneysel SDK yüzeyi
title: Ajan çalıştırma altyapısı Pluginleri
x-i18n:
    generated_at: "2026-07-16T17:47:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 862d53022e48b93c98e98162f76460433b76005cba3188342d0977b951044106
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Bir **agent harness'ı**, hazırlanmış tek bir OpenClaw agent turunun düşük seviyeli
yürütücüsüdür. Bir model sağlayıcısı, kanal veya araç kayıt sistemi değildir.
Kullanıcıya yönelik zihinsel model için [Agent çalışma zamanları](/tr/concepts/agent-runtimes) bölümüne bakın.

Bu yüzeyi yalnızca paketlenmiş veya güvenilen yerel plugin'ler için kullanın. Parametre
türleri kasıtlı olarak mevcut gömülü çalıştırıcıyı yansıttığından sözleşme hâlâ
deneyseldir.

## Harness ne zaman kullanılmalı?

Bir model ailesinin kendi yerel oturum çalışma zamanı varsa ve normal OpenClaw
sağlayıcı aktarımı yanlış soyutlamaysa bir agent harness'ı kaydedin:

- iş parçacıklarını ve Compaction'ı yöneten yerel bir kodlama agent'ı sunucusu
- yerel planlama/akıl yürütme/araç olaylarını akışla iletmesi gereken yerel bir CLI veya daemon
- OpenClaw oturum transkriptine ek olarak kendi sürdürme kimliğine ihtiyaç duyan
  bir model çalışma zamanı

Yalnızca yeni bir LLM API'si eklemek için bir harness **kaydetmeyin**. Normal HTTP veya
WebSocket model API'leri için bir [sağlayıcı plugin'i](/tr/plugins/sdk-provider-plugins) oluşturun.

## Çekirdeğin hâlâ yönettiği öğeler

Bir harness seçilmeden önce OpenClaw aşağıdakileri zaten çözümlemiştir:

- sağlayıcı ve model
- harness kimlik doğrulama önyüklemesinin kendisine ait olduğunu bildirmediği sürece çalışma zamanı kimlik doğrulama durumu
- düşünme düzeyi ve bağlam bütçesi
- OpenClaw transkript/oturum dosyası
- çalışma alanı, korumalı alan ve araç ilkesi
- kanal yanıt geri çağırmaları ve akış geri çağırmaları
- model geri dönüşü ve canlı model değiştirme ilkesi

Bir harness hazırlanmış bir denemeyi çalıştırır; sağlayıcıları seçmez, kanal
teslimatının yerine geçmez veya modelleri sessizce değiştirmez.

### Harness'a ait kimlik doğrulama önyüklemesi

Varsayılan olarak çekirdek, bir harness'ı çağırmadan önce sağlayıcı kimlik bilgilerini çözümler.
Kendi yerel çalışma zamanı üzerinden kimlik doğrulaması yapabilen güvenilir bir harness, statik
`AgentHarness` kaydında `authBootstrap: "harness"` ayarını belirleyebilir. Bu durumda çekirdek,
söz konusu harness'ın üstlendiği her deneme için genel sağlayıcı kimlik bilgisi önyüklemesini
ve eksik kimlik bilgisi hatasını atlar.

Çekirdek, uyumlu ve açıkça seçilmiş ya da sıralanmış bir OpenClaw kimlik doğrulama
profili ile kapsamlı deposu mevcut olduğunda bunları yine iletir. Harness, model
isteklerini göndermeden önce bu profili veya yerel kimlik bilgilerini çözümlemeli,
gizli bilgileri deneme kapsamıyla sınırlı tutmalı ve eyleme dönüştürülebilir kimlik
doğrulama hataları sunmalıdır. Bu yeteneği yalnızca bazen kimlik doğrulamayı yöneten
bir harness üzerinde ayarlamayın.

### Doğrulanmış kurulum çalışma zamanı yapıtları

İlk çalıştırma kurulumunda çıkarım sağlayabilen yerel bir harness, yoklamayı
tamamlayan uygulamayı tasdik etmelidir.
`params.captureRuntimeArtifact` doğru olduğunda kararlı bir kimlik ve içerik parmak izi içeren
opak bir `result.runtimeArtifact` döndürün. Farklı bir harness yüklemeden veya ilgisiz
plugin'leri taramadan bu bağlamayı yeniden denetleyen eşleşen bir
`runtimeArtifact.validate(...)` yeteneği kaydedin.

Doğrulanmış OpenClaw sürdürmeleri ayrıca `params.expectedRuntimeArtifact` iletir.
Harness bunu edindiği tam yerel süreçle karşılaştırmalı ve farklı olmaları durumunda
yerel bir iş parçacığını başlatmadan veya sürdürmeden önce başarısız olmalıdır. Normal
agent turları her iki alanı da içermez; böylece içerik karmalama normal isteklerin
kritik yolunun dışında kalır. Uzak/WebSocket harness'larının katılabilmesi için bir
sunucu tasdik sözleşmesi gerekir; yalnızca bir sürüm dizesi yapıt kimliği değildir.

Hazırlanmış deneme ayrıca OpenClaw ve yerel harness'lar arasında ortak kalması gereken
çalışma zamanı kararlarına yönelik OpenClaw'a ait bir ilke paketi olan
`params.runtimePlan` öğesini içerir:

- sağlayıcıya duyarlı araç şeması ilkesi için `runtimePlan.tools.normalize(...)` ve `runtimePlan.tools.logDiagnostics(...)`
- transkript temizleme ve araç çağrısı onarım ilkesi için `runtimePlan.transcript.resolvePolicy(...)`
- paylaşılan `NO_REPLY` ve medya teslimatını engelleme için `runtimePlan.delivery.isSilentPayload(...)`
- model geri dönüşü sınıflandırması için `runtimePlan.outcome.classifyRunResult(...)`
- çözümlenmiş sağlayıcı/model/harness meta verileri için `runtimePlan.observability`

Harness'lar, OpenClaw davranışıyla eşleşmesi gereken kararlar için planı kullanabilir;
ancak bunu ana makineye ait deneme durumu olarak değerlendirin: değiştirmeyin veya
bir tur içinde sağlayıcıları/modelleri değiştirmek için kullanmayın.

### İstek aktarımı sözleşmesi

`supports(ctx)`, çözümlenmiş model aktarımını `ctx.modelProvider` içinde alır.
Gizli bilgi içermeyen, sağlayıcıya ait iki olgu seçilen rotayı açıklar:

- `runtimePolicy.compatibleIds`, sağlayıcının söz konusu somut rotayla
  uyumlu olduğunu bildirdiği çalışma zamanı kimliklerini listeler. İlkenin bulunmaması,
  sağlayıcının rota düzeyinde uyumluluk bildirmediği anlamına gelir; desteğin
  varsayılması için izin değildir.
- `requestTransportOverrides: "none"`, yazılmış bir sağlayıcı/model isteği
  geçersiz kılmasının yeniden üretilmesinin gerekmediği anlamına gelir.
  `"present"`, yazılmış üst bilgilerin, kimlik doğrulama aktarımının,
  proxy'nin, TLS'nin, yerel hizmetin, özel ağ davranışının veya istek
  parametrelerinin mevcut olduğu anlamına gelir. Bu olgu söz konusu değerleri açığa çıkarmaz.

Harness hazırlanmış aktarımı yeniden üretemiyorsa `{ supported: false, reason }` döndürün.
Seçimden sonra ham yapılandırmayı okuyarak destek çıkarımı yapmayın. Kimlik doğrulama
hazırlığı birden fazla yeniden deneme rotası oluşturduğunda, gönderimden önce tek bir
harness bunların tümünü desteklemelidir. Hiçbir plugin tam kümeyi yönetemiyorsa örtük
seçim OpenClaw'ı kullanır; açık veya kalıcı plugin seçimi güvenli biçimde başarısız olur.

## Harness kaydetme

**İçe aktarma:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    const routeSupportsHarness =
      ctx.modelProvider?.runtimePolicy?.compatibleIds.includes("my-harness") === true;
    const canReproduceRequest = ctx.modelProvider?.requestTransportOverrides !== "present";
    return ctx.provider === "my-provider" && routeSupportsHarness && canReproduceRequest
      ? { supported: true, priority: 100 }
      : { supported: false, reason: "effective route is not harness-compatible" };
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

`authBootstrap` bu genel örnekte kasıtlı olarak yoktur. Yalnızca harness yukarıdaki
sözleşmeyi karşılıyorsa `authBootstrap: "harness"` ekleyin.

### Yetkilendirilmiş yürütme

Bir harness sahibi, Codex destekli bir konuşmayı sürdüren ses aktarımı gibi mevcut
model kilitli bir oturumu yürütmesi gereken güvenilir plugin'lerin kimliklerini
`delegatedExecutionPluginIds` olarak ayarlayabilir. Bu, çekirdek izin listesi değil, sahibin
statik onayıdır. Kapsamı dar tutun.

Yetkilendirilenler yalnızca iş kabulü ve gömülü yürütme elde eder. OpenClaw tam olarak
depolanmış oturum anahtarını, depo yolunu ve oturum kimliğini; `modelSelectionLocked:
true`;
ve eşleşen `agentHarnessId` ile `agentHarnessRuntimeOverride` değerlerini gerektirir.
Çalıştırma daha sonra harness sahibinin kapsamına alınır. Oturum oluşturma, yama
uygulama, sıfırlama, silme, arşivleme ve Gateway değişikliği yalnızca sahibin
yetkisinde kalır.

## Seçim ilkesi

OpenClaw, sağlayıcı/model çözümlemesinden sonra bir harness seçer:

1. Model kapsamlı çalışma zamanı ilkesi önceliklidir.
2. Ardından sağlayıcı kapsamlı çalışma zamanı ilkesi gelir.
3. `auto`, kayıtlı harness'lara çözümlenmiş etkin
   rotayı destekleyip desteklemediklerini sorar. Sağlayıcı/model önekleri tek başına
   hiçbir zaman bir harness seçmez.
4. Kayıtlı hiçbir harness eşleşmezse OpenClaw gömülü çalışma zamanını kullanır.

Plugin harness hataları çalıştırma hataları olarak sunulur. `auto` modunda,
gömülü geri dönüş yalnızca kayıtlı hiçbir plugin harness'ı çözümlenmiş
sağlayıcıyı/modeli desteklemediğinde uygulanır. Bir plugin harness'ı çalıştırmayı
üstlendikten sonra OpenClaw aynı turu başka bir çalışma zamanı üzerinden yeniden
oynatmaz; çünkü bu işlem kimlik doğrulama/çalışma zamanı anlamını değiştirebilir veya
yan etkileri çoğaltabilir.

Yapılandırılmış çalışma zamanı ilkesi, istenen çalışma zamanı konusunda belirleyici
olmaya devam eder. Kalıcı bir oturum `agentHarnessId`, rota/kimlik doğrulama hazırlığı
hâlâ beklemedeyken yerel transkriptinin sahipliğini korur. Bunların hiçbiri uyumsuz bir
rotayı uyumlu hâle getirmez: hazırlanmış olgular mevcut olduğunda seçilen veya sabitlenen
harness bunları desteklemeli, aksi hâlde çalıştırma güvenli biçimde başarısız olmalıdır.
`/status`, ilkeden, kalıcı sahiplikten ve rota desteğinden seçilen etkin çalışma
zamanını gösterir. Hazırlanmış durum açıktır: eksik `runtimePolicy`, mevcut aktarım
alanlarından çıkarılmak yerine bildirilmemiş olarak kalır.
Harness'a ait kimlik doğrulama birden fazla fiziksel rotayı çözümlenmemiş bıraktığında,
hazırlanmış destek olgusu bunların uyumlu çalışma zamanı kimliklerinin kesişimidir ve
herhangi bir adayda istek geçersiz kılmaları varsa bunu bildirir. Bu nedenle bildirilmemiş
tek bir aday yerel uyumluluğu boş bırakır; `preparedAuth.source: "harness"` bir kimlik doğrulama
sahibidir, rota desteği çıkarımı yapma izni değildir.

Seçilen harness şaşırtıcıysa `agents/harness` hata ayıklama günlük kaydını etkinleştirin
ve Gateway'in yapılandırılmış `agent harness selected` kaydını inceleyin: seçilen harness
kimliğini, seçim nedenini, çalışma zamanı/geri dönüş ilkesini ve `auto`
modunda her plugin adayının destek sonucunu içerir.

Paketlenmiş Codex plugin'i, harness kimliği olarak `codex` kaydını yapar.
Çekirdek bunu sıradan bir plugin harness kimliği olarak değerlendirir; Codex'e özgü
takma adlar paylaşılan çalışma zamanı seçicisinde değil, plugin'de veya operatör
yapılandırmasında yer alır.

## Sağlayıcı ile harness eşleştirmesi

Çoğu harness ayrıca bir sağlayıcı kaydetmelidir. Sağlayıcı, model referanslarını,
kimlik doğrulama durumunu, model meta verilerini ve `/model` seçimini
OpenClaw'ın geri kalanı için görünür hâle getirir. Ardından harness,
`supports(...)` içinde bu sağlayıcıyı üstlenir.

Paketlenmiş Codex plugin'i bu düzeni izler:

- tercih edilen kullanıcı model referansları: `openai/gpt-5.6-sol`
- uyumluluk referansları: eski `codex/gpt-*` referansları kabul edilmeye
  devam eder, ancak yeni yapılandırmalar bunları normal sağlayıcı/model referansları olarak kullanmamalıdır
- harness kimliği: `codex`
- kimlik doğrulama: Codex harness'ı yerel Codex oturum açma/oturumunu
  yönettiğinden sentetik sağlayıcı kullanılabilirliği
- uygulama sunucusu isteği: OpenClaw yalın model kimliğini Codex'e gönderir ve
  harness'ın yerel uygulama sunucusu protokolüyle iletişim kurmasına izin verir

Codex plugin'i eklemelidir. Çalışma zamanı ilkesi ayarlanmamışsa veya
`auto` ise OpenAI, Codex'i yalnızca sağlayıcıya ait rota sözleşmesi
`codex` uyumluluğunu bildirdiğinde seçebilir: yazılmış istek geçersiz
kılması bulunmayan, tam olarak resmî HTTPS Platform Responses veya ChatGPT Responses
rotası. Tek başına `openai/*` öneki hiçbir zaman Codex'i seçmez. Özel uç
noktalar, Completions bağdaştırıcıları ve yazılmış istek davranışı OpenClaw'da kalır.
Düz metin kullanan resmî HTTP uç noktaları reddedilir. Eski `codex/gpt-*`
referansları uyumluluk girdileri olarak kalır. Bkz.
[OpenAI örtük agent çalışma zamanı](/tr/providers/openai#implicit-agent-runtime).

Operatör kurulumu, model öneki örnekleri ve yalnızca Codex'e yönelik yapılandırmalar için
[Codex Harness](/tr/plugins/codex-harness) bölümüne bakın.

Codex plugin'i, [Codex Harness](/tr/plugins/codex-harness) bölümünde belgelenen en düşük
uygulama sunucusu sürümünü zorunlu kılar. Başlatma el sıkışmasını denetler ve eski veya
sürümsüz sunucuları engeller; böylece OpenClaw yalnızca test ettiği protokol yüzeyiyle
çalışır.

### Araç sonucu ara katman yazılımı

Paketlenmiş plugin'ler ve eşleşen manifest sözleşmelerine sahip, açıkça etkinleştirilmiş
kurulu plugin'ler, manifest'leri hedeflenen çalışma zamanı kimliklerini
`contracts.agentToolResultMiddleware` içinde bildirdiğinde `api.registerAgentToolResultMiddleware(...)` üzerinden çalışma zamanından
bağımsız araç sonucu ara katman yazılımı ekleyebilir. Bu güvenilir bağlantı noktası,
OpenClaw veya Codex araç çıktısını modele geri vermeden önce çalışması gereken eşzamansız
araç sonucu dönüşümleri içindir.

Eski paketlenmiş plugin'ler, yalnızca Codex app-server
ara yazılımı için hâlâ `api.registerCodexAppServerExtensionFactory(...)` kullanabilir; ancak yeni sonuç
dönüşümleri çalışma zamanından bağımsız API'yi kullanmalıdır. Yalnızca gömülü
çalıştırıcıya yönelik `api.registerEmbeddedExtensionFactory(...)` kancası kaldırılmıştır; gömülü araç
sonucu dönüşümleri çalışma zamanından bağımsız ara yazılım kullanmalıdır.

### Terminal sonucu sınıflandırması

Kendi protokol projeksiyonunu yöneten yerel donanımlar, tamamlanan bir turda
görünür asistan metni üretilmediğinde `openclaw/plugin-sdk/agent-harness-runtime` içindeki
`classifyAgentHarnessTerminalOutcome(...)` yardımcısını kullanabilir. Yardımcı `empty`,
`reasoning-only` veya `planning-only` döndürür; böylece OpenClaw'ın geri
dönüş politikası farklı bir modelle yeniden denenip denenmeyeceğine karar
verebilir. `planning-only`, donanımın açık `planText` alanını
gerektirir; OpenClaw bunu asistan metninden çıkarmaz. Yardımcı; istem
hatalarını, devam eden turları ve `NO_REPLY` gibi kasıtlı sessiz
yanıtları bilinçli olarak sınıflandırmadan bırakır.

### Aracı sonlandırma yan etkileri

Yerel donanımlar, bir denemeyi sonlandırdıktan sonra `openclaw/plugin-sdk/agent-harness-runtime`
içindeki `runAgentEndSideEffects(...)` yardımcısını çağırmalıdır. Bu yardımcı, etkileşimli
yanıtları geciktirmeden taşınabilir `agent_end` kancasını ve OpenClaw'ın
araştırma yakalamasını tetikler. Denemenin bu yan etkiler tamamlanmadan
sonuçlanmaması gereken yerel, etkileşimsiz çalıştırmalar için
`awaitAgentEndSideEffects(...)` kullanın. Her iki yardımcı da `runAgentHarnessAgentEndHook(...)` ile aynı
`{ event, ctx }` yükünü kabul eder; hataları tamamlanan denemenin sonucunu
değiştirmez.

### Kullanıcı girdisi ve araç yüzeyleri

Çalışma zamanı düzeyinde kullanıcı girdisi isteği sunan yerel donanımlar;
istemi biçimlendirmek, OpenClaw'ın engelleyici yanıt yolu üzerinden iletmek ve
seçimli/serbest biçimli yanıtları çalışma zamanının yerel yanıt şekline geri
dönüştürmek için `openclaw/plugin-sdk/agent-harness-runtime` içindeki kullanıcı girdisi yardımcılarını
kullanmalıdır. Her donanım kendi protokol ayrıştırmasını ve bekleyen istek
yaşam döngüsünü yönetirken yardımcı, kanal/TUI sunumunu tutarlı tutar.

Pi benzeri kompakt araç yönlendirmesine ihtiyaç duyan yerel donanımlar,
`openclaw/plugin-sdk/agent-harness-tool-runtime` içindeki `createAgentHarnessToolSurfaceRuntime(...)` yardımcısını kullanmalıdır.
Bu yardımcı; araç arama/kod modu denetimi seçimini, yerel model için yalın
varsayılanları, çalışma zamanıyla uyumlu şema filtrelemeyi, gizli katalog
yürütmeyi, dizin hazırlamayı ve katalog temizliğini yönetir. Donanımlar,
SDK'larına özgü araç dönüştürmesini ve yerel yürütme geri çağrısını yine
kendileri yönetir.

### Yerel Codex donanım modu

Paketlenmiş `codex` donanımı, gömülü OpenClaw aracı turları için
yerel Codex modudur. Önce paketlenmiş `codex` plugin'ini etkinleştirin
ve yapılandırmanız kısıtlayıcı bir izin listesi kullanıyorsa
`plugins.allow` içine `codex` ekleyin. Yerel app-server
yapılandırmaları `openai/gpt-*` kullanmalıdır; OpenAI aracı turları Codex
donanımını yalnızca etkin rota Codex uyumluluğunu bildirdiğinde seçer. Eski
Codex model başvuruları `openclaw doctor --fix` ile düzeltilmelidir ve eski
`codex/*` model başvuruları yerel donanım için uyumluluk takma adları
olarak kalır.

Bu mod çalıştığında yerel iş parçacığı kimliğini, sürdürme davranışını,
Compaction'ı ve app-server yürütmesini Codex yönetir. OpenClaw ise sohbet
kanalını, görünür transkript yansısını, araç politikasını, onayları, medya
teslimini ve oturum seçimini yönetmeye devam eder. Çalıştırmayı yalnızca Codex
app-server yolunun üstlenebildiğini kanıtlamanız gerektiğinde sağlayıcı/model
olarak `agentRuntime.id: "codex"` kullanın. Açıkça seçilen plugin çalışma zamanları
kapalı biçimde başarısız olur; Codex app-server seçim hataları ve çalışma
zamanı hataları başka bir çalışma zamanı üzerinden yeniden denenmez.

## Çalışma zamanı katılığı

OpenClaw varsayılan olarak `auto` sağlayıcı/model çalışma zamanı
politikasını kullanır: kayıtlı plugin donanımları uyumlu etkin rotaları
üstlenebilir ve hiçbiri eşleşmediğinde turu gömülü çalışma zamanı işler.
Yalnızca bir sağlayıcı/model ön eki hiçbir zaman donanım seçmez. Eksik donanım
seçiminin gömülü çalışma zamanına yönlendirilmek yerine başarısız olması
gerekiyorsa `agentRuntime.id: "codex"` gibi açık bir sağlayıcı/model plugin çalışma
zamanı kullanın. Açık seçim, uyumsuz bir rotayı uyumlu hâle getirmez. Seçilen
plugin donanımındaki hatalar her zaman kesin başarısızlıkla sonuçlanır. Bu,
açık bir sağlayıcı/model `agentRuntime.id: "openclaw"` kullanımını engellemez.

Yalnızca Codex kullanan gömülü çalıştırmalar için:

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
      "model": "openai/gpt-5.6-sol"
    }
  }
}
```

Tek bir kanonik model için CLI arka ucu istiyorsanız çalışma zamanını ilgili
model girdisine yerleştirin:

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

Aracı başına geçersiz kılmalar aynı model kapsamlı şekli kullanır:

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.6-sol",
        "models": {
          "openai/gpt-5.6-sol": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

Bunun gibi eski tüm aracı çalışma zamanı örnekleri yok sayılır:

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

Açık bir plugin çalışma zamanı kullanıldığında, istenen donanım kayıtlı değilse,
çözümlenen sağlayıcı/modeli desteklemiyorsa veya tur yan etkileri üretmeden
önce başarısız olursa oturum erken başarısız olur. Bu davranış, yalnızca Codex
kullanan dağıtımlar ve Codex app-server yolunun gerçekten kullanıldığını
kanıtlaması gereken canlı testler için kasıtlıdır.

Bu ayar yalnızca gömülü aracı donanımını denetler. Görüntü, video, müzik, TTS,
PDF veya sağlayıcıya özgü diğer model yönlendirmelerini devre dışı bırakmaz.

## Yerel oturumlar ve transkript yansısı

Bir donanım yerel bir oturum kimliğini, iş parçacığı kimliğini veya daemon
tarafı sürdürme belirtecini saklayabilir. Bu bağı açıkça OpenClaw oturumuyla
ilişkili tutun ve kullanıcı tarafından görülebilen asistan/araç çıktısını
OpenClaw transkriptine yansıtmaya devam edin.

OpenClaw transkripti aşağıdakiler için uyumluluk katmanı olmayı sürdürür:

- kanalda görünür oturum geçmişi
- transkript araması ve dizine ekleme
- sonraki bir turda yerleşik OpenClaw donanımına geri geçme
- genel `/new`, `/reset` ve oturum silme davranışı

Donanımınız bir yan dosya bağı saklıyorsa OpenClaw'ın, sahibi olan OpenClaw
oturumu sıfırlandığında bu bağı temizleyebilmesi için `reset(...)`
uygulayın.

## Araç ve medya sonuçları

Çekirdek, OpenClaw araç listesini oluşturur ve hazırlanmış denemeye aktarır.
Bir donanım dinamik bir araç çağrısı yürüttüğünde kanal medyasını kendiniz
göndermek yerine araç sonucunu donanım sonuç şekli üzerinden geri döndürün.

Bu, metin, görüntü, video, müzik, TTS, onay ve mesajlaşma aracı çıktılarını
OpenClaw destekli çalıştırmalarla aynı teslimat yolunda tutar.

### Terminal araç sonuçları

`AgentHarnessAttemptParams.observeToolTerminal`, ana bilgisayarın yönettiği terminal sonuç biriktiricisidir.
OpenClaw dinamik araçlarını veya yerel araçları yürüten bir donanım, deneme
sonucu sonlandırılmadan önce her araç tek bir terminal sonucuna ulaştığında
bunu çağırmalıdır. Araç yürütmeyen donanımların bunu çağırması gerekmez.

Yürütme sınırındaki olguları bildirin:

- Varsa protokol çağrı kimliğini, kanonik araç adını ve hazırlama veya kanca
  yeniden yazımlarından sonra araca gerçekten ulaşan bağımsız değişkenleri aktarın.
- Doğrulama, onay veya başka bir koruma çağrıyı araç uygulaması başlamadan
  önce durdurduysa `executionStarted: false` ayarlayın. Gönderimin gerçekleşmiş olma
  ihtimali varsa tutucu biçimde `true` bildirin.
- `outcome: "success"` veya `outcome: "failure"` bildirin. Görüntüleme metninden
  hata çıkarımı yapmak yerine çalışma zamanında bulunan yapılandırılmış hata
  alanlarını ekleyin.
- `nativeMutation` değerini yalnızca OpenClaw araç tanımı kullanmayan yerel
  araçlar için kullanın. Protokolün yönettiği değişiklik ve yeniden oynatma
  olgularını burada sağlayın; OpenClaw'ın değişiklik sınıflandırıcısını donanıma
  kopyalamayın.

Geri çağrı, ilgili çağrı için kanonik çözümlemeyi döndürür.
`lastToolError` değerini `AgentHarnessAttemptResult` içine taşıyın ve paralel durum
türetmek yerine donanım projeksiyonunda onun yürütme, bağımsız değişken ve yan
etki olgularını kullanın. Ana bilgisayar, çözümlenmemiş bir değiştirici hatayı
ilgisiz başarılı araçlar boyunca korur ve yalnızca eşleşen eylem başarıyla
tamamlandıktan sonra temizler.

Geri çağrı, eski deneysel donanımlarla kaynak uyumluluğu için isteğe bağlı
olmayı sürdürür. İsteğe bağlı olması, araç yürüten bir donanım için göz ardı
edilebileceği anlamına gelmez: terminal raporları olmadan OpenClaw, sessiz
Heartbeat tamamlanması dâhil olmak üzere daha sonraki araç çağrıları boyunca
değiştirici araç hatasının doğruluğunu koruyamaz.

## Mevcut sınırlamalar

- Herkese açık içe aktarma yolu geneldir ancak bazı deneme/sonuç türü takma
  adları uyumluluk için hâlâ eski adları taşır.
- Üçüncü taraf donanım kurulumu deneyseldir. Yerel bir oturum çalışma zamanına
  ihtiyaç duyana kadar sağlayıcı plugin'lerini tercih edin.
- Donanımlar arasında turlar boyunca geçiş desteklenir. Yerel araçlar,
  onaylar, asistan metni veya mesaj gönderimleri başladıktan sonra turun
  ortasında donanım değiştirmeyin.

## İlgili

- [SDK'ya Genel Bakış](/tr/plugins/sdk-overview)
- [Çalışma Zamanı Yardımcıları](/tr/plugins/sdk-runtime)
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins)
- [Codex Donanımı](/tr/plugins/codex-harness)
- [Model Sağlayıcıları](/tr/concepts/model-providers)
