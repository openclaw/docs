---
read_when:
    - OpenClaw, Codex, ACP veya başka bir yerel ajan çalışma zamanı arasında seçim yapıyorsunuz
    - Durum veya yapılandırmadaki sağlayıcı/model/çalışma zamanı etiketleri kafanızı karıştırıyor
    - Yerel bir harness için destek eşdeğerliğini belgeliyorsunuz
summary: OpenClaw model sağlayıcılarını, modelleri, kanalları ve ajan çalışma zamanlarını nasıl ayırır
title: Ajan çalışma zamanları
x-i18n:
    generated_at: "2026-06-28T00:26:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb818e682ffb11a073ee0053c0e7b7e2ea60239141aab7f96cd82520ded9d22f
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Bir **ajan çalışma zamanı**, hazırlanmış tek bir model döngüsünün sahibi olan bileşendir: istemi
alır, model çıktısını yürütür, yerel araç çağrılarını işler ve tamamlanan turu
OpenClaw'a döndürür.

Çalışma zamanlarını sağlayıcılarla karıştırmak kolaydır çünkü ikisi de model
yapılandırmasının yakınında görünür. Bunlar farklı katmanlardır:

| Katman        | Örnekler                                     | Ne anlama gelir                                                        |
| ------------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| Sağlayıcı     | `openai`, `anthropic`, `github-copilot`      | OpenClaw'ın kimlik doğrulamasını, modelleri keşfetmesini ve model referanslarını adlandırmasını belirler. |
| Model         | `gpt-5.5`, `claude-opus-4-6`                 | Ajan turu için seçilen model.                                          |
| Ajan çalışma zamanı | `openclaw`, `codex`, `copilot`, `claude-cli` | Hazırlanan turu yürüten düşük seviyeli döngü veya arka uç.             |
| Kanal         | Telegram, Discord, Slack, WhatsApp           | İletilerin OpenClaw'a girip çıktığı yer.                               |

Kodda **harness** sözcüğünü de göreceksiniz. Harness, bir ajan çalışma zamanı
sağlayan uygulamadır. Örneğin, birlikte gelen Codex harness'i `codex` çalışma zamanını
uygular. Genel yapılandırma, sağlayıcı veya model girdilerinde `agentRuntime.id`
kullanır; tüm ajan çalışma zamanı anahtarları legacy'dir ve yok sayılır.
`openclaw doctor --fix`, eski tüm ajan çalışma zamanı sabitlemelerini kaldırır ve
legacy çalışma zamanı model referanslarını kanonik sağlayıcı/model referanslarına ve gerektiğinde model kapsamlı
çalışma zamanı politikasına yeniden yazar.

İki çalışma zamanı ailesi vardır:

- **Gömülü harness'ler**, OpenClaw'ın hazırlanmış ajan döngüsünün içinde çalışır. Bugün bu,
  yerleşik `openclaw` çalışma zamanı ile `codex` ve `copilot` gibi kayıtlı Plugin harness'leridir.
- **CLI arka uçları**, model referansını kanonik tutarken yerel bir CLI süreci çalıştırır.
  Örneğin, model kapsamlı `agentRuntime.id: "claude-cli"` ile
  `anthropic/claude-opus-4-8`, "Anthropic modelini seç, Claude CLI üzerinden yürüt"
  anlamına gelir. `claude-cli` gömülü bir harness kimliği değildir ve AgentHarness seçimine
  geçirilmemelidir.

`copilot` harness'i, GitHub Copilot CLI için ayrı, isteğe bağlı harici bir Plugin harness'idir;
PI, Codex ve GitHub Copilot ajan çalışma zamanı arasındaki kullanıcıya dönük karar için
[GitHub Copilot ajan çalışma zamanı](/tr/plugins/copilot) bölümüne bakın.

## Codex yüzeyleri

Çoğu kafa karışıklığı, Codex adını paylaşan birkaç farklı yüzeyden kaynaklanır:

| Yüzey                                           | OpenClaw adı/yapılandırması           | Ne yapar                                                                                                      |
| ----------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Yerel Codex app-server çalışma zamanı           | `openai/*` model referansları         | OpenAI gömülü ajan turlarını Codex app-server üzerinden çalıştırır. Bu, olağan ChatGPT/Codex abonelik kurulumudur. |
| Codex OAuth kimlik doğrulama profilleri         | `openai` OAuth profilleri             | Codex app-server harness'inin tükettiği ChatGPT/Codex abonelik kimlik doğrulamasını depolar.                  |
| Codex ACP adaptörü                              | `runtime: "acp"`, `agentId: "codex"` | Codex'i harici ACP/acpx kontrol düzlemi üzerinden çalıştırır. Yalnızca ACP/acpx açıkça istendiğinde kullanın. |
| Yerel Codex sohbet denetimi komut seti          | `/codex ...`                          | Codex app-server iş parçacıklarını sohbetten bağlar, sürdürür, yönlendirir, durdurur ve inceler.              |
| Ajan dışı yüzeyler için OpenAI Platform API rotası | `openai/*` artı API anahtarı kimlik doğrulaması | Görseller, embeddings, konuşma ve realtime gibi doğrudan OpenAI API'leri için kullanılır.                     |

Bu yüzeyler bilinçli olarak birbirinden bağımsızdır. `codex` Plugin'ini etkinleştirmek
yerel app-server özelliklerini kullanılabilir yapar; `openclaw doctor --fix` legacy
Codex rota onarımını ve eski oturum sabitleme temizliğini yönetir. Bir ajan modeli için
`openai/*` seçmek artık, ajan dışı bir OpenAI API yüzeyi kullanılmadığı sürece,
"bunu Codex üzerinden çalıştır" anlamına gelir.

Yaygın ChatGPT/Codex abonelik kurulumu, kimlik doğrulama için Codex OAuth kullanır, ancak
model referansını `openai/*` olarak tutar ve `codex` çalışma zamanını seçer:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Bu, OpenClaw'ın bir OpenAI model referansı seçtiği, sonra Codex app-server
çalışma zamanından gömülü ajan turunu çalıştırmasını istediği anlamına gelir. "API faturalandırması kullan"
anlamına gelmez ve kanalın, model sağlayıcı kataloğunun veya OpenClaw oturum deposunun
Codex'e dönüşmesi anlamına gelmez.

Birlikte gelen `codex` Plugin'i etkinleştirildiğinde, doğal dilli Codex denetimi
ACP yerine yerel `/codex` komut yüzeyini (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) kullanmalıdır. Codex için ACP'yi
yalnızca kullanıcı açıkça ACP/acpx isterse veya ACP adaptör yolunu test ediyorsa kullanın.
Claude Code, Gemini CLI, OpenCode, Cursor ve benzer harici harness'ler yine ACP kullanır.

Ajanlara dönük karar ağacı şudur:

1. Kullanıcı **Codex bind/control/thread/resume/steer/stop** isterse, birlikte gelen
   `codex` Plugin'i etkinse yerel `/codex` komut yüzeyini kullanın.
2. Kullanıcı **gömülü çalışma zamanı olarak Codex** isterse veya normal
   abonelik destekli Codex ajan deneyimini istiyorsa `openai/<model>` kullanın.
3. Kullanıcı açıkça **bir OpenAI modeli için OpenClaw** seçerse, model referansını
   `openai/<model>` olarak tutun ve sağlayıcı/model çalışma zamanı politikasını
   `agentRuntime.id: "openclaw"` olarak ayarlayın. Seçili bir `openai` OAuth profili,
   dahili olarak OpenClaw'ın Codex kimlik doğrulama aktarımı üzerinden yönlendirilir.
4. Legacy yapılandırma hâlâ **legacy Codex model referansları** içeriyorsa,
   `openclaw doctor --fix` ile bunu `openai/<model>` olarak onarın; doctor, eski model
   referansının ima ettiği yerlerde sağlayıcı/model kapsamlı `agentRuntime.id: "codex"`
   ekleyerek Codex kimlik doğrulama rotasını korur.
   Legacy **`codex-cli/*` model referansları** aynı `openai/<model>` Codex
   app-server rotasına onarılır; OpenClaw artık birlikte gelen bir Codex CLI arka ucu tutmaz.
5. Kullanıcı açıkça **ACP**, **acpx** veya **Codex ACP adaptörü** derse,
   `runtime: "acp"` ve `agentId: "codex"` ile ACP kullanın.
6. İstek **Claude Code, Gemini CLI, OpenCode, Cursor, Droid veya başka bir harici harness**
   içinse, yerel alt ajan çalışma zamanı değil ACP/acpx kullanın.

| Kastettiğiniz...                         | Kullanılacak...                              |
| ---------------------------------------- | -------------------------------------------- |
| Codex app-server sohbet/iş parçacığı denetimi | Birlikte gelen `codex` Plugin'inden `/codex ...` |
| Codex app-server gömülü ajan çalışma zamanı | `openai/*` ajan model referansları           |
| OpenAI Codex OAuth                       | `openai` OAuth profilleri                    |
| Claude Code veya başka bir harici harness | ACP/acpx                                     |

OpenAI ailesi önek ayrımı için [OpenAI](/tr/providers/openai) ve
[Model sağlayıcıları](/tr/concepts/model-providers) bölümlerine bakın. Codex çalışma zamanı destek
sözleşmesi için [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime#v1-support-contract)
bölümüne bakın.

## Çalışma zamanı sahipliği

Farklı çalışma zamanları döngünün farklı miktarlarına sahiptir.

| Yüzey                       | OpenClaw gömülü                                | Codex app-server                                                             |
| --------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------- |
| Model döngüsü sahibi        | OpenClaw gömülü çalıştırıcısı üzerinden OpenClaw | Codex app-server                                                             |
| Kanonik iş parçacığı durumu | OpenClaw transkripti                           | Codex iş parçacığı, artı OpenClaw transkript yansısı                         |
| OpenClaw dinamik araçları   | Yerel OpenClaw araç döngüsü                    | Codex adaptörü üzerinden köprülenir                                          |
| Yerel kabuk ve dosya araçları | OpenClaw yolu                                | Desteklendiğinde yerel kancalar üzerinden köprülenen Codex yerel araçları    |
| Bağlam motoru               | Yerel OpenClaw bağlam derlemesi                | OpenClaw, bağlamı Codex turuna derleyerek aktarır                            |
| Compaction                  | OpenClaw veya seçili bağlam motoru             | OpenClaw bildirimleri ve yansı bakımıyla Codex yerel sıkıştırması            |
| Kanal teslimi               | OpenClaw                                       | OpenClaw                                                                     |

Bu sahiplik ayrımı ana tasarım kuralıdır:

- Yüzeye OpenClaw sahipse, OpenClaw normal Plugin kancası davranışı sağlayabilir.
- Yüzeye yerel çalışma zamanı sahipse, OpenClaw çalışma zamanı olaylarına veya yerel kancalara ihtiyaç duyar.
- Kanonik iş parçacığı durumuna yerel çalışma zamanı sahipse, OpenClaw desteklenmeyen iç yapıları yeniden yazmak yerine bağlamı yansıtmalı ve projelendirmelidir.

## Çalışma zamanı seçimi

OpenClaw, sağlayıcı ve model çözümlemesinden sonra gömülü bir çalışma zamanı seçer:

1. Model kapsamlı çalışma zamanı politikası kazanır. Bu, yapılandırılmış sağlayıcı
   model girdisinde veya `agents.defaults.models["provider/model"].agentRuntime` /
   `agents.list[].models["provider/model"].agentRuntime` içinde bulunabilir. `agents.defaults.models["vllm/*"].agentRuntime`
   gibi bir sağlayıcı wildcard'ı, tam model politikasından sonra uygulanır; böylece dinamik olarak keşfedilen
   sağlayıcı modeller, tam model başına istisnaları geçersiz kılmadan tek bir çalışma zamanını paylaşabilir.
2. Sağlayıcı kapsamlı çalışma zamanı politikası sonra
   `models.providers.<provider>.agentRuntime` konumunda gelir.
3. `auto` modunda, kayıtlı Plugin çalışma zamanları desteklenen sağlayıcı/model
   çiftlerini üstlenebilir.
4. `auto` modunda hiçbir çalışma zamanı bir turu üstlenmezse, OpenClaw uyumluluk
   çalışma zamanı olarak `openclaw` kullanır. Çalıştırmanın katı olması gerekiyorsa açık bir çalışma zamanı kimliği kullanın.

Tüm oturum ve tüm ajan çalışma zamanı sabitlemeleri yok sayılır. Buna
`OPENCLAW_AGENT_RUNTIME`, oturum `agentHarnessId`/`agentRuntimeOverride` durumu,
`agents.defaults.agentRuntime` ve `agents.list[].agentRuntime` dahildir.
Eski tüm ajan çalışma zamanı yapılandırmasını kaldırmak ve OpenClaw'ın niyeti koruyabildiği yerlerde
legacy çalışma zamanı model referanslarını dönüştürmek için `openclaw doctor --fix` çalıştırın.

Açık sağlayıcı/model Plugin çalışma zamanları kapalı hata verir. Örneğin,
bir sağlayıcı veya model üzerinde `agentRuntime.id: "codex"`, Codex ya da açık bir
seçim/çalışma zamanı hatası anlamına gelir; hiçbir zaman sessizce OpenClaw'a geri yönlendirilmez.

CLI arka uç takma adları, gömülü harness kimliklerinden farklıdır. Tercih edilen
Claude CLI biçimi şudur:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-8",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

`claude-cli/claude-opus-4-7` gibi legacy referanslar uyumluluk için desteklenmeye devam eder,
ancak yeni yapılandırma sağlayıcı/modeli kanonik tutmalı ve yürütme arka ucunu
sağlayıcı/model çalışma zamanı politikasına koymalıdır.

Legacy `codex-cli/*` referansları farklıdır: doctor bunları `openai/*` olarak taşır;
böylece bir Codex CLI arka ucunu korumak yerine Codex app-server harness'i üzerinden çalışırlar.

`auto` modu çoğu sağlayıcı için bilinçli olarak muhafazakârdır. OpenAI ajan
modelleri istisnadır: ayarlanmamış çalışma zamanı ve `auto` ikisi de Codex
harness'ine çözümlenir. Açık OpenClaw çalışma zamanı yapılandırması, `openai/*` ajan turları için
isteğe bağlı bir uyumluluk rotası olarak kalır; seçili bir `openai` OAuth profiliyle eşleştirildiğinde,
OpenClaw bu yolu dahili olarak Codex kimlik doğrulama aktarımı üzerinden yönlendirirken
genel model referansını `openai/*` olarak tutar. Eski OpenAI çalışma zamanı oturum sabitlemeleri
çalışma zamanı seçimi tarafından yok sayılır ve `openclaw doctor --fix` ile temizlenebilir.

`openclaw doctor`, eski Codex model referansları yapılandırmada kalırken `codex` Plugin'inin etkin olduğu konusunda uyarırsa bunu eski rota durumu olarak ele alın. Codex çalışma zamanı ile `openai/*` olarak yeniden yazmak için `openclaw doctor --fix` komutunu çalıştırın.

## GitHub Copilot ajan çalışma zamanı

Harici `@openclaw/copilot` Plugin'i, GitHub Copilot CLI (`@github/copilot-sdk`) tarafından desteklenen isteğe bağlı `copilot` çalışma zamanını kaydeder. Standart abonelik `github-copilot` sağlayıcısını üstlenir ve `auto` tarafından **asla** seçilmez. `agentRuntime.id` aracılığıyla model başına veya sağlayıcı başına etkinleştirin:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/gpt-5.5",
      models: {
        "github-copilot/gpt-5.5": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

Harness; sağlayıcısını, çalışma zamanını, CLI oturum anahtarını ve kimlik doğrulama profili ön ekini `extensions/copilot/doctor-contract-api.ts` içinde üstlenir ve `openclaw doctor` bunu otomatik olarak yükler. Yapılandırma, kimlik doğrulama, transkript yansıtma, Compaction, bildirime dayalı doctor sözleşmesi ve daha geniş PI ile Codex ile Copilot SDK kararı için bkz. [GitHub Copilot ajan çalışma zamanı](/tr/plugins/copilot).

## Uyumluluk sözleşmesi

Bir çalışma zamanı OpenClaw olmadığında, hangi OpenClaw yüzeylerini desteklediğini belgelemelidir. Çalışma zamanı dokümanları için bu şekli kullanın:

| Soru                                   | Neden önemlidir                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Model döngüsünün sahibi kimdir?        | Yeniden denemelerin, araç devamının ve nihai yanıt kararlarının nerede gerçekleşeceğini belirler.        |
| Standart iş parçacığı geçmişinin sahibi kimdir? | OpenClaw'ın geçmişi düzenleyip düzenleyemeyeceğini veya yalnızca yansıtıp yansıtamayacağını belirler.    |
| OpenClaw dinamik araçları çalışıyor mu? | Mesajlaşma, oturumlar, cron ve OpenClaw'a ait araçlar buna dayanır.                                      |
| Dinamik araç kancaları çalışıyor mu?   | Plugin'ler, OpenClaw'a ait araçların etrafında `before_tool_call`, `after_tool_call` ve ara katman bekler. |
| Yerel araç kancaları çalışıyor mu?     | Shell, patch ve çalışma zamanına ait araçlar; politika ve gözlem için yerel kanca desteğine ihtiyaç duyar. |
| Bağlam motoru yaşam döngüsü çalışıyor mu? | Bellek ve bağlam Plugin'leri; assemble, ingest, after-turn ve Compaction yaşam döngüsüne bağlıdır.        |
| Hangi Compaction verileri açığa çıkarılır? | Bazı Plugin'ler yalnızca bildirimlere ihtiyaç duyarken diğerleri tutulan/bırakılan meta verilere ihtiyaç duyar. |
| Bilerek ne desteklenmiyor?             | Kullanıcılar, yerel çalışma zamanının daha fazla duruma sahip olduğu yerlerde OpenClaw eşdeğerliği varsaymamalıdır. |

Codex çalışma zamanı destek sözleşmesi
[Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime#v1-support-contract) içinde belgelenmiştir.

## Durum etiketleri

Durum çıktısı hem `Execution` hem de `Runtime` etiketlerini gösterebilir. Bunları sağlayıcı adları olarak değil, tanılama bilgileri olarak okuyun.

- `openai/gpt-5.5` gibi bir model referansı, seçilen sağlayıcıyı/modeli bildirir.
- `codex` gibi bir çalışma zamanı kimliği, turu hangi döngünün yürüttüğünü bildirir.
- Telegram veya Discord gibi bir kanal etiketi, konuşmanın nerede gerçekleştiğini bildirir.

Bir çalışma hâlâ beklenmeyen bir çalışma zamanı gösteriyorsa önce seçilen sağlayıcı/model çalışma zamanı politikasını inceleyin. Eski oturum çalışma zamanı sabitlemeleri artık yönlendirmeye karar vermez.

## İlgili

- [Codex harness](/tr/plugins/codex-harness)
- [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [GitHub Copilot ajan çalışma zamanı](/tr/plugins/copilot)
- [OpenAI](/tr/providers/openai)
- [Ajan harness Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Ajan döngüsü](/tr/concepts/agent-loop)
- [Modeller](/tr/concepts/models)
- [Durum](/tr/cli/status)
