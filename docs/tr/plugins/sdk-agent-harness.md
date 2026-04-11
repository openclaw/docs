---
read_when:
    - Gömülü aracı çalışma zamanını veya harness kayıt defterini değiştiriyorsunuz
    - Paketli veya güvenilir bir eklentiden bir aracı harness kaydediyorsunuz
    - Codex eklentisinin model sağlayıcılarıyla nasıl ilişkili olduğunu anlamanız gerekiyor
sidebarTitle: Agent Harness
summary: Düşük seviyeli gömülü aracı yürütücüsünün yerini alan eklentiler için deneysel SDK yüzeyi
title: Aracı Harness Eklentileri
x-i18n:
    generated_at: "2026-04-11T02:46:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43c1f2c087230398b0162ed98449f239c8db1e822e51c7dcd40c54fa6c3374e1
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Aracı Harness Eklentileri

Bir **aracı harness**, hazırlanmış bir OpenClaw aracı dönüşü için düşük seviyeli yürütücüdür. Bir model sağlayıcısı, kanal veya araç kayıt defteri değildir.

Bu yüzeyi yalnızca paketli veya güvenilir yerel eklentiler için kullanın. Parametre türleri bilinçli olarak mevcut gömülü çalıştırıcıyı yansıttığı için sözleşme hâlâ deneyseldir.

## Bir harness ne zaman kullanılmalı

Bir model ailesinin kendi yerel oturum çalışma zamanı varsa ve normal OpenClaw sağlayıcı taşıma katmanı yanlış soyutlamaysa bir aracı harness kaydedin.

Örnekler:

- iş parçacıklarını ve sıkıştırmayı yöneten yerel bir kodlama aracı sunucusu
- yerel plan/muhakeme/araç olaylarını akıtması gereken yerel bir CLI veya daemon
- OpenClaw oturum dökümüne ek olarak kendi resume kimliğine ihtiyaç duyan bir model çalışma zamanı

Yalnızca yeni bir LLM API eklemek için harness kaydetmeyin. Normal HTTP veya WebSocket model API'leri için bir [sağlayıcı eklentisi](/tr/plugins/sdk-provider-plugins) oluşturun.

## Çekirdeğin hâlâ sahip olduğu alanlar

Bir harness seçilmeden önce OpenClaw şunları zaten çözmüştür:

- sağlayıcı ve model
- çalışma zamanı auth durumu
- düşünme seviyesi ve bağlam bütçesi
- OpenClaw dökümü/oturum dosyası
- çalışma alanı, sandbox ve araç ilkesi
- kanal yanıt geri çağrıları ve akış geri çağrıları
- model geri dönüşü ve canlı model değiştirme ilkesi

Bu ayrım kasıtlıdır. Bir harness hazırlanmış bir denemeyi çalıştırır; sağlayıcı seçmez, kanal teslimini değiştirmez veya modelleri sessizce değiştirmez.

## Bir harness kaydetme

**İçe aktarma:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "Yerel aracı harness'im",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Yerel iş parçacığınızı başlatın veya sürdürün.
    // params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent ve hazırlanmış diğer deneme alanlarını kullanın.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "Yerel Aracım",
  description: "Seçili modelleri yerel bir aracı daemon'u üzerinden çalıştırır.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Seçim ilkesi

OpenClaw, sağlayıcı/model çözümlemesinden sonra bir harness seçer:

1. `OPENCLAW_AGENT_RUNTIME=<id>`, bu kimliğe sahip kayıtlı bir harness'i zorlar.
2. `OPENCLAW_AGENT_RUNTIME=pi`, yerleşik PI harness'ini zorlar.
3. `OPENCLAW_AGENT_RUNTIME=auto`, kayıtlı harness'lere çözülmüş sağlayıcı/modeli destekleyip desteklemediklerini sorar.
4. Kayıtlı hiçbir harness eşleşmezse OpenClaw, PI geri dönüşü devre dışı bırakılmadıysa PI kullanır.

Zorlanan eklenti harness hataları çalıştırma hataları olarak görünür. `auto` modunda, seçilen eklenti harness'i bir dönüş yan etkileri üretmeden önce başarısız olursa OpenClaw PI'ye geri dönebilir. Bunun yerine bu geri dönüşün kesin hata olmasını istiyorsanız `OPENCLAW_AGENT_HARNESS_FALLBACK=none` veya `embeddedHarness.fallback: "none"` ayarlayın.

Paketli Codex eklentisi, harness kimliği olarak `codex` kaydeder. Çekirdek bunu sıradan bir eklenti harness kimliği olarak ele alır; Codex'e özgü takma adlar ortak çalışma zamanı seçicisinde değil, eklentide veya operatör yapılandırmasında olmalıdır.

## Sağlayıcı artı harness eşleştirmesi

Çoğu harness aynı zamanda bir sağlayıcı da kaydetmelidir. Sağlayıcı, model referanslarını, auth durumunu, model meta verilerini ve `/model` seçimini OpenClaw'ın geri kalanına görünür kılar. Harness daha sonra `supports(...)` içinde bu sağlayıcıyı sahiplenir.

Paketli Codex eklentisi bu deseni izler:

- sağlayıcı kimliği: `codex`
- kullanıcı model referansları: `codex/gpt-5.4`, `codex/gpt-5.2` veya Codex uygulama sunucusunun döndürdüğü başka bir model
- harness kimliği: `codex`
- auth: sentetik sağlayıcı kullanılabilirliği, çünkü yerel Codex oturum açma/oturumunu Codex harness'i yönetir
- uygulama sunucusu isteği: OpenClaw, yalın model kimliğini Codex'e gönderir ve harness'in yerel uygulama sunucusu protokolüyle konuşmasına izin verir

Codex eklentisi eklemelidir. Düz `openai/gpt-*` referansları OpenAI sağlayıcı referansları olarak kalır ve normal OpenClaw sağlayıcı yolunu kullanmaya devam eder. Codex tarafından yönetilen auth, Codex model keşfi, yerel iş parçacıkları ve Codex uygulama sunucusu yürütmesini istediğinizde `codex/gpt-*` seçin. `/model`, OpenAI sağlayıcı kimlik bilgileri gerektirmeden Codex uygulama sunucusunun döndürdüğü Codex modelleri arasında geçiş yapabilir.

Operatör kurulumu, model öneki örnekleri ve yalnızca Codex yapılandırmaları için [Codex Harness](/tr/plugins/codex-harness) bölümüne bakın.

OpenClaw, Codex uygulama sunucusu `0.118.0` veya daha yenisini gerektirir. Codex eklentisi, uygulama sunucusu initialize el sıkışmasını denetler ve OpenClaw'ın yalnızca test edilmiş protokol yüzeyiyle çalışması için daha eski veya sürümsüz sunucuları engeller.

## PI geri dönüşünü devre dışı bırakma

Varsayılan olarak OpenClaw, gömülü araçları `agents.defaults.embeddedHarness` değeri `{ runtime: "auto", fallback: "pi" }` olacak şekilde çalıştırır. `auto` modunda kayıtlı eklenti harness'leri bir sağlayıcı/model çiftini sahiplenebilir. Hiçbiri eşleşmezse veya otomatik seçilen bir eklenti harness'i çıktı üretmeden önce başarısız olursa OpenClaw PI'ye geri döner.

Bir eklenti harness'inin kullanılan tek çalışma zamanı olduğunu kanıtlamanız gerekiyorsa `fallback: "none"` ayarlayın. Bu, otomatik PI geri dönüşünü devre dışı bırakır; açık `runtime: "pi"` veya `OPENCLAW_AGENT_RUNTIME=pi` kullanımını engellemez.

Yalnızca Codex gömülü çalıştırmaları için:

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Kayıtlı herhangi bir eklenti harness'inin eşleşen modelleri sahiplenmesini istiyor ama OpenClaw'ın asla sessizce PI'ye geri dönmesini istemiyorsanız `runtime: "auto"` değerini koruyun ve geri dönüşü devre dışı bırakın:

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
        "model": "codex/gpt-5.4",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` yine de yapılandırılmış çalışma zamanını geçersiz kılar. Ortamdan PI geri dönüşünü devre dışı bırakmak için `OPENCLAW_AGENT_HARNESS_FALLBACK=none` kullanın.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Geri dönüş devre dışı bırakıldığında, istenen harness kayıtlı değilse, çözülmüş sağlayıcı/modeli desteklemiyorsa veya dönüş yan etkileri üretmeden önce başarısız oluyorsa oturum erken başarısız olur. Bu, yalnızca Codex dağıtımları ve Codex uygulama sunucusu yolunun gerçekten kullanımda olduğunu kanıtlaması gereken canlı testler için kasıtlıdır.

Bu ayar yalnızca gömülü aracı harness'ini kontrol eder. Görüntü, video, müzik, TTS, PDF veya diğer sağlayıcıya özgü model yönlendirmelerini devre dışı bırakmaz.

## Yerel oturumlar ve döküm aynalama

Bir harness, yerel bir oturum kimliği, iş parçacığı kimliği veya daemon taraflı resume tokenı tutabilir.
Bu bağı açıkça OpenClaw oturumuyla ilişkilendirin ve kullanıcıya görünen asistan/araç çıktısını OpenClaw dökümüne aynalamaya devam edin.

OpenClaw dökümü şu alanlar için uyumluluk katmanı olmaya devam eder:

- kanal tarafından görünen oturum geçmişi
- döküm arama ve dizinleme
- daha sonraki bir dönüşte yerleşik PI harness'ine geri dönme
- genel `/new`, `/reset` ve oturum silme davranışı

Harness'iniz bir yan bağ saklıyorsa, sahip olan OpenClaw oturumu sıfırlandığında OpenClaw'ın bunu temizleyebilmesi için `reset(...)` uygulayın.

## Araç ve medya sonuçları

Çekirdek, OpenClaw araç listesini oluşturur ve bunu hazırlanmış denemeye geçirir.
Bir harness dinamik bir araç çağrısı yürüttüğünde, kanal medyasını kendiniz göndermek yerine araç sonucunu harness sonuç şekli üzerinden geri döndürün.

Bu, metin, görüntü, video, müzik, TTS, onay ve mesajlaşma aracı çıktılarının PI destekli çalıştırmalarla aynı teslim yolunda kalmasını sağlar.

## Geçerli sınırlamalar

- Genel içe aktarma yolu geneldir, ancak bazı deneme/sonuç türü takma adları uyumluluk için hâlâ `Pi` adlarını taşır.
- Üçüncü taraf harness kurulumu deneyseldir. Yerel bir oturum çalışma zamanına ihtiyaç duyana kadar sağlayıcı eklentilerini tercih edin.
- Dönüşler arasında harness değiştirme desteklenir. Yerel araçlar, onaylar, asistan metni veya mesaj gönderimleri başladıktan sonra bir dönüşün ortasında harness değiştirmeyin.

## İlgili

- [SDK Overview](/tr/plugins/sdk-overview)
- [Runtime Helpers](/tr/plugins/sdk-runtime)
- [Provider Plugins](/tr/plugins/sdk-provider-plugins)
- [Codex Harness](/tr/plugins/codex-harness)
- [Model Providers](/tr/concepts/model-providers)
