---
read_when:
    - Gömülü aracı çalışma zamanını veya harness kayıt defterini değiştiriyorsunuz
    - Paketlenmiş veya güvenilen bir Plugin'den bir aracı harness’ı kaydediyorsunuz
    - Codex Plugin'inin model sağlayıcılarla nasıl ilişkili olduğunu anlamanız gerekiyor
sidebarTitle: Agent Harness
summary: Düşük düzey gömülü aracı yürütücüsünü değiştiren Plugin'ler için deneysel SDK yüzeyi
title: Aracı harness Plugin'leri
x-i18n:
    generated_at: "2026-04-24T09:22:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: af76c2a3ebe54c87920954b58126ee59538c0e6d3d1b4ba44890c1f5079fabc2
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

Bir **aracı harness’ı**, hazırlanmış tek bir OpenClaw aracı dönüşü için düşük düzey yürütücüdür. Bu bir model sağlayıcısı, kanal veya araç kayıt defteri değildir.

Bu yüzeyi yalnızca paketlenmiş veya güvenilen yerel Plugin'ler için kullanın. Sözleşme hâlâ deneyseldir çünkü parametre türleri kasıtlı olarak geçerli gömülü çalıştırıcıyı yansıtır.

## Bir harness ne zaman kullanılır

Bir model ailesinin kendi doğal oturum
çalışma zamanı varsa ve normal OpenClaw sağlayıcı taşıması yanlış soyutlamaysa bir aracı harness’ı kaydedin.

Örnekler:

- iş parçacıklarına ve Compaction'a sahip yerel bir kodlama aracı sunucusu
- doğal plan/muhakeme/araç olaylarını akıtması gereken yerel bir CLI veya daemon
- OpenClaw
  oturum transkriptine ek olarak kendi resume kimliğine ihtiyaç duyan bir model çalışma zamanı

Yalnızca yeni bir LLM API eklemek için harness kaydetmeyin. Normal HTTP veya
WebSocket model API’leri için bir [sağlayıcı Plugin'i](/tr/plugins/sdk-provider-plugins) oluşturun.

## Çekirdeğin hâlâ sahip olduğu şeyler

Bir harness seçilmeden önce OpenClaw zaten şunları çözmüştür:

- sağlayıcı ve model
- çalışma zamanı kimlik doğrulama durumu
- düşünme düzeyi ve bağlam bütçesi
- OpenClaw transkripti/oturum dosyası
- çalışma alanı, sandbox ve araç ilkesi
- kanal yanıt geri çağrıları ve akış geri çağrıları
- model geri dönüşü ve canlı model değiştirme ilkesi

Bu ayrım kasıtlıdır. Bir harness hazırlanmış bir denemeyi çalıştırır; sağlayıcı seçmez,
kanal teslimini değiştirmez veya sessizce model değiştirmez.

## Bir harness kaydedin

**İçe aktarma:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "Benim yerel aracı harness’ım",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Doğal iş parçacığınızı başlatın veya sürdürün.
    // params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent ve diğer hazırlanmış deneme alanlarını kullanın.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Seçilen modelleri yerel bir aracı daemon’u üzerinden çalıştırır.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Seçim ilkesi

OpenClaw, sağlayıcı/model çözümlemesinden sonra bir harness seçer:

1. Var olan bir oturumun kaydedilmiş harness kimliği kazanır; böylece yapılandırma/env değişiklikleri
   bu transkripti sıcak biçimde başka bir çalışma zamanına geçirmez.
2. `OPENCLAW_AGENT_RUNTIME=<id>`, henüz sabitlenmemiş oturumlar için bu kimliğe sahip kayıtlı bir harness’ı zorlar.
3. `OPENCLAW_AGENT_RUNTIME=pi`, yerleşik PI harness’ını zorlar.
4. `OPENCLAW_AGENT_RUNTIME=auto`, kayıtlı harness’lara çözülmüş sağlayıcı/modeli destekleyip desteklemediklerini sorar.
5. Kayıtlı hiçbir harness eşleşmezse, PI geri dönüşü devre dışı değilse OpenClaw PI kullanır.

Plugin harness hataları çalıştırma hataları olarak yüzeye çıkar. `auto` kipinde PI geri dönüşü
yalnızca hiçbir kayıtlı Plugin harness’ı çözülmüş
sağlayıcı/modeli desteklemediğinde kullanılır. Bir Plugin harness’ı bir çalıştırmayı sahiplendikten sonra OpenClaw aynı
dönüşü PI üzerinden yeniden oynatmaz; çünkü bu kimlik doğrulama/çalışma zamanı semantiğini
değiştirebilir veya yan etkileri çoğaltabilir.

Seçilen harness kimliği bir gömülü çalıştırmadan sonra oturum kimliğiyle birlikte kalıcılaştırılır.
Harness sabitlemelerinden önce oluşturulmuş eski oturumlar, transkript geçmişine sahip olduklarında
PI’ye sabitlenmiş kabul edilir. PI ile yerel bir Plugin harness’ı arasında geçiş yaparken yeni/sıfırlanmış bir oturum kullanın.
`/status`, `Fast` yanında `codex` gibi varsayılan olmayan harness kimliklerini gösterir; PI gizli kalır çünkü varsayılan uyumluluk yoludur.
Seçilen harness şaşırtıcıysa `agents/harness` hata ayıklama günlüklemesini etkinleştirin ve
Gateway’in yapılandırılmış `agent harness selected` kaydını inceleyin. Bu kayıt,
seçilen harness kimliğini, seçim nedenini, çalışma zamanı/geri dönüş ilkesini ve `auto`
kipinde her Plugin adayının destek sonucunu içerir.

Paketlenmiş Codex Plugin'i `codex` kimliğini harness kimliği olarak kaydeder. Çekirdek bunu
sıradan bir Plugin harness kimliği olarak ele alır; Codex’e özgü takma adlar
paylaşılan çalışma zamanı seçicisinde değil, Plugin veya operatör yapılandırmasında yer almalıdır.

## Sağlayıcı artı harness eşleştirmesi

Çoğu harness ayrıca bir sağlayıcı da kaydetmelidir. Sağlayıcı, model ref’lerini,
kimlik doğrulama durumunu, model meta verilerini ve `/model` seçimini OpenClaw’ın geri kalanına görünür kılar.
Harness daha sonra `supports(...)` içinde bu sağlayıcıyı sahiplenir.

Paketlenmiş Codex Plugin'i bu deseni izler:

- sağlayıcı kimliği: `codex`
- kullanıcı model ref’leri: `openai/gpt-5.5` artı `embeddedHarness.runtime: "codex"`; eski `codex/gpt-*` ref’leri uyumluluk için kabul edilmeye devam eder
- harness kimliği: `codex`
- kimlik doğrulama: sentetik sağlayıcı kullanılabilirliği, çünkü Codex harness’ı
  doğal Codex giriş/oturumuna sahiptir
- app-server isteği: OpenClaw yalın model kimliğini Codex’e gönderir ve
  harness’ın doğal app-server protokolüyle konuşmasına izin verir

Codex Plugin'i eklemelidir. Düz `openai/gpt-*` ref’leri, siz
`embeddedHarness.runtime: "codex"` ile Codex harness’ını zorlamadığınız sürece normal OpenClaw sağlayıcı yolunu kullanmaya devam eder.
Daha eski `codex/gpt-*` ref’leri ise uyumluluk için yine Codex sağlayıcısını ve harness’ını seçer.

Operatör kurulumu, model öneki örnekleri ve yalnızca Codex yapılandırmaları için
[Codex Harness](/tr/plugins/codex-harness) sayfasına bakın.

OpenClaw, Codex app-server `0.118.0` veya daha yenisini gerektirir. Codex Plugin'i
app-server initialize el sıkışmasını kontrol eder ve daha eski veya sürümsüz sunucuları engeller; böylece
OpenClaw yalnızca test edildiği protokol yüzeyine karşı çalışır.

### Codex app-server tool-result ara yazılımı

Paketlenmiş Plugin'ler ayrıca manifestleri `contracts.embeddedExtensionFactories: ["codex-app-server"]` bildirdiğinde
`api.registerCodexAppServerExtensionFactory(...)` aracılığıyla Codex app-server’a özgü `tool_result`
ara yazılımı bağlayabilir. Bu, araç çıktısının OpenClaw transkriptine geri yansıtılmadan önce
doğal Codex harness’ı içinde çalışması gereken eşzamansız araç sonucu dönüşümleri için güvenilen Plugin seam’ıdır.

### Doğal Codex harness kipi

Paketlenmiş `codex` harness’ı, gömülü OpenClaw
aracı dönüşleri için doğal Codex kipidir. Önce paketlenmiş `codex` Plugin'ini etkinleştirin ve yapılandırmanız kısıtlayıcı bir izin listesi kullanıyorsa
`plugins.allow` içine `codex` ekleyin. Doğal app-server yapılandırmaları `openai/gpt-*` ile birlikte
`embeddedHarness.runtime: "codex"` kullanmalıdır.
PI üzerinden Codex OAuth için bunun yerine `openai-codex/*` kullanın. Eski `codex/*`
model ref’leri doğal harness için uyumluluk takma adları olarak kalır.

Bu kip çalıştığında Codex doğal iş parçacığı kimliğini, resume davranışını,
Compaction'ı ve app-server yürütümünü sahiplenir. OpenClaw yine de sohbet kanalını,
görünür transkript yansımasını, araç ilkesini, onayları, medya teslimini ve oturum
seçimini sahiplenir. Yalnızca Codex app-server yolunun çalıştırmayı sahiplenebildiğini
kanıtlamanız gerektiğinde `embeddedHarness.runtime: "codex"` ile birlikte
`embeddedHarness.fallback: "none"` kullanın. Bu yapılandırma yalnızca bir seçim korumasıdır:
Codex app-server hataları zaten PI üzerinden yeniden denenmek yerine doğrudan başarısız olur.

## PI geri dönüşünü devre dışı bırakma

Varsayılan olarak OpenClaw gömülü aracıları `agents.defaults.embeddedHarness`
değerini `{ runtime: "auto", fallback: "pi" }` yaparak çalıştırır. `auto` kipinde kayıtlı Plugin
harness’ları bir sağlayıcı/model çiftini sahiplenebilir. Hiçbiri eşleşmezse OpenClaw PI’ye geri düşer.

Eksik Plugin harness seçimi PI kullanmak yerine başarısız olsun istiyorsanız
`fallback: "none"` ayarlayın. Seçilen Plugin harness hataları zaten sert biçimde başarısız olur. Bu
açık bir `runtime: "pi"` veya `OPENCLAW_AGENT_RUNTIME=pi` ayarını engellemez.

Yalnızca Codex gömülü çalıştırmaları için:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Herhangi bir kayıtlı Plugin harness’ının eşleşen modelleri sahiplenmesini istiyor ama OpenClaw’ın asla sessizce PI’ye geri düşmesini istemiyorsanız
`runtime: "auto"` tutun ve geri dönüşü devre dışı bırakın:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
      }
    }
  }
}
```

Aracı başına geçersiz kılmalar aynı biçimi kullanır:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` yine yapılandırılmış çalışma zamanını geçersiz kılar. PI geri dönüşünü ortamdan devre dışı bırakmak için
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` kullanın.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Geri dönüş devre dışıyken, istenen harness kayıtlı değilse,
çözülmüş sağlayıcı/modeli desteklemiyorsa veya dönüş yan etkileri üretmeden önce başarısız olursa bir oturum erken başarısız olur.
Bu, yalnızca Codex dağıtımları ve Codex app-server yolunun gerçekten kullanımda olduğunu kanıtlaması gereken canlı testler için kasıtlıdır.

Bu ayar yalnızca gömülü aracı harness’ını denetler. Görsel, video, müzik, TTS, PDF veya diğer sağlayıcıya özgü model yönlendirmelerini devre dışı bırakmaz.

## Doğal oturumlar ve transkript yansıması

Bir harness, doğal bir oturum kimliği, iş parçacığı kimliği veya daemon tarafı resume token’ı tutabilir.
Bu bağı açıkça OpenClaw oturumu ile ilişkilendirin ve kullanıcıya görünür yardımcı/araç çıktısını
OpenClaw transkriptine yansıtmaya devam edin.

OpenClaw transkripti şu alanlar için uyumluluk katmanı olarak kalır:

- kanala görünür oturum geçmişi
- transkript arama ve indeksleme
- sonraki bir dönüşte yerleşik PI harness’ına geri geçiş
- genel `/new`, `/reset` ve oturum silme davranışı

Harness’ınız bir yan bağ saklıyorsa sahibi olan OpenClaw oturumu sıfırlandığında OpenClaw’ın
onu temizleyebilmesi için `reset(...)` uygulayın.

## Araç ve medya sonuçları

Çekirdek OpenClaw araç listesini oluşturur ve hazırlanmış denemeye geçirir.
Bir harness dinamik bir araç çağrısı yürüttüğünde araç sonucunu
kanal medyasını kendiniz göndermek yerine harness sonuç biçimi üzerinden geri döndürün.

Bu, metin, görsel, video, müzik, TTS, onay ve mesajlaşma aracı çıktılarının
PI destekli çalıştırmalarla aynı teslim yolunda kalmasını sağlar.

## Geçerli sınırlamalar

- Genel içe aktarma yolu geneldir, ancak bazı deneme/sonuç türü takma adları uyumluluk için
  hâlâ `Pi` adlarını taşır.
- Üçüncü taraf harness kurulumu deneyseldir. Yerel bir oturum çalışma zamanına ihtiyaç duyana kadar
  sağlayıcı Plugin'lerini tercih edin.
- Harness değiştirme dönüşler arasında desteklenir. Doğal araçlar, onaylar, yardımcı metni veya mesaj
  gönderimleri başladıktan sonra bir dönüşün ortasında harness değiştirmeyin.

## İlgili

- [SDK Genel Bakış](/tr/plugins/sdk-overview)
- [Çalışma Zamanı Yardımcıları](/tr/plugins/sdk-runtime)
- [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins)
- [Codex Harness](/tr/plugins/codex-harness)
- [Model Sağlayıcıları](/tr/concepts/model-providers)
