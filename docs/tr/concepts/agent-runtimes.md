---
read_when:
    - PI, Codex, ACP veya başka bir yerel ajan çalışma zamanı arasında seçim yapıyorsunuz
    - Durum veya yapılandırmadaki sağlayıcı/model/çalışma zamanı etiketleri kafanızı karıştırıyor
    - Yerel bir test koşumu için destek eşdeğerliğini belgeliyorsunuz
summary: OpenClaw model sağlayıcılarını, modelleri, kanalları ve ajan çalışma zamanlarını nasıl ayırır
title: Aracı çalışma zamanları
x-i18n:
    generated_at: "2026-05-07T13:15:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417a3a7e12a881bc33023cc87553dd3536a63ad955d1e93d26f1014032303469
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Bir **ajan çalışma zamanı**, hazırlanmış tek bir model döngüsünün sahibi olan bileşendir: istemi alır, model çıktısını yürütür, yerel araç çağrılarını işler ve tamamlanan turu OpenClaw'a döndürür.

Çalışma zamanları sağlayıcılarla kolayca karıştırılabilir, çünkü ikisi de model yapılandırmasına yakın yerlerde görünür. Bunlar farklı katmanlardır:

| Katman        | Örnekler                              | Ne anlama gelir                                                     |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Sağlayıcı     | `openai`, `anthropic`, `openai-codex` | OpenClaw'ın kimlik doğrulaması yapma, modelleri keşfetme ve model referanslarını adlandırma biçimi. |
| Model         | `gpt-5.5`, `claude-opus-4-6`          | Ajan turu için seçilen model.                                       |
| Ajan çalışma zamanı | `pi`, `codex`, `claude-cli`     | Hazırlanan turu yürüten düşük seviyeli döngü veya arka uç.          |
| Kanal         | Telegram, Discord, Slack, WhatsApp    | Mesajların OpenClaw'a girip çıktığı yer.                            |

Kodda **harness** sözcüğünü de göreceksiniz. Harness, bir ajan çalışma zamanı sağlayan uygulamadır. Örneğin, paketle gelen Codex harness'ı `codex` çalışma zamanını uygular. Genel yapılandırma `agentRuntime.id` kullanır; `openclaw doctor --fix` eski çalışma zamanı ilkesi anahtarlarını bu şekle yeniden yazar.

İki çalışma zamanı ailesi vardır:

- **Gömülü harness'lar**, OpenClaw'ın hazırlanmış ajan döngüsünün içinde çalışır. Bugün bu, yerleşik `pi` çalışma zamanı ile `codex` gibi kayıtlı Plugin harness'larıdır.
- **CLI arka uçları**, model referansını kanonik tutarken yerel bir CLI süreci çalıştırır. Örneğin, `agentRuntime.id: "claude-cli"` ile `anthropic/claude-opus-4-7`, "Anthropic modelini seç, Claude CLI üzerinden yürüt" anlamına gelir. `claude-cli`, gömülü bir harness kimliği değildir ve AgentHarness seçimine geçirilmemelidir.

## Codex yüzeyleri

Karışıklığın çoğu, Codex adını paylaşan birkaç farklı yüzeyden kaynaklanır:

| Yüzey                                           | OpenClaw adı/yapılandırması          | Ne yapar                                                                                                      |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Yerel Codex uygulama sunucusu çalışma zamanı      | `openai/*` model referansları        | OpenAI gömülü ajan turlarını Codex uygulama sunucusu üzerinden çalıştırır. Bu, olağan ChatGPT/Codex abonelik kurulumudur. |
| Codex OAuth kimlik doğrulama profilleri          | `openai-codex` kimlik doğrulama sağlayıcısı | Codex uygulama sunucusu harness'ının tükettiği ChatGPT/Codex abonelik kimlik doğrulamasını saklar.             |
| Codex ACP adaptörü                               | `runtime: "acp"`, `agentId: "codex"` | Codex'i harici ACP/acpx denetim düzlemi üzerinden çalıştırır. Yalnızca ACP/acpx açıkça istendiğinde kullanın. |
| Yerel Codex sohbet denetimi komut kümesi          | `/codex ...`                         | Codex uygulama sunucusu iş parçacıklarını sohbetten bağlar, sürdürür, yönlendirir, durdurur ve inceler.        |
| Ajan dışı yüzeyler için OpenAI Platform API rotası | `openai/*` artı API anahtarı kimlik doğrulaması | Görseller, embeddings, konuşma ve gerçek zamanlı gibi doğrudan OpenAI API'leri için kullanılır.                |

Bu yüzeyler özellikle birbirinden bağımsızdır. `codex` Plugin'ini etkinleştirmek, yerel uygulama sunucusu özelliklerini kullanılabilir hale getirir; `openclaw doctor --fix`, eski `openai-codex/*` rota onarımını ve eski oturum sabitlemesi temizliğini üstlenir. Bir ajan modeli için `openai/*` seçmek artık, ajan dışı bir OpenAI API yüzeyi kullanılmadığı sürece "bunu Codex üzerinden çalıştır" anlamına gelir.

Yaygın ChatGPT/Codex abonelik kurulumu, kimlik doğrulama için Codex OAuth kullanır, ancak model referansını `openai/*` olarak tutar ve `codex` çalışma zamanını seçer:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Bu, OpenClaw'ın bir OpenAI model referansı seçtiği, ardından Codex uygulama sunucusu çalışma zamanından gömülü ajan turunu çalıştırmasını istediği anlamına gelir. "API faturalandırması kullan" anlamına gelmez ve kanalın, model sağlayıcı kataloğunun veya OpenClaw oturum deposunun Codex'e dönüştüğü anlamına gelmez.

Paketle gelen `codex` Plugin'i etkinleştirildiğinde, doğal dil Codex denetimi ACP yerine yerel `/codex` komut yüzeyini (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) kullanmalıdır. Codex için ACP'yi yalnızca kullanıcı açıkça ACP/acpx istediğinde veya ACP adaptör yolunu test ettiğinde kullanın. Claude Code, Gemini CLI, OpenCode, Cursor ve benzer harici harness'lar hâlâ ACP kullanır.

Ajanlara yönelik karar ağacı şudur:

1. Kullanıcı **Codex bind/control/thread/resume/steer/stop** isterse, paketle gelen `codex` Plugin'i etkin olduğunda yerel `/codex` komut yüzeyini kullanın.
2. Kullanıcı **gömülü çalışma zamanı olarak Codex** isterse veya normal abonelik destekli Codex ajan deneyimini isterse, `openai/<model>` kullanın.
3. Kullanıcı açıkça **bir OpenAI modeli için PI** seçerse, model referansını `openai/<model>` olarak tutun ve `agentRuntime.id: "pi"` ayarlayın. Seçilen bir `openai-codex` kimlik doğrulama profili, PI'ın eski Codex kimlik doğrulama aktarımı üzerinden dahili olarak yönlendirilir.
4. Eski yapılandırma hâlâ **`openai-codex/*` model referansları** içeriyorsa, `openclaw doctor --fix` ile bunu `openai/<model>` olarak onarın.
5. Kullanıcı açıkça **ACP**, **acpx** veya **Codex ACP adaptörü** derse, `runtime: "acp"` ve `agentId: "codex"` ile ACP kullanın.
6. İstek **Claude Code, Gemini CLI, OpenCode, Cursor, Droid veya başka bir harici harness** içinse, yerel alt ajan çalışma zamanı yerine ACP/acpx kullanın.

| Şunu kastediyorsunuz...                  | Şunu kullanın...                              |
| ---------------------------------------- | -------------------------------------------- |
| Codex uygulama sunucusu sohbet/iş parçacığı denetimi | Paketle gelen `codex` Plugin'inden `/codex ...` |
| Codex uygulama sunucusu gömülü ajan çalışma zamanı | `openai/*` ajan model referansları           |
| OpenAI Codex OAuth                       | `openai-codex` kimlik doğrulama profilleri   |
| Claude Code veya başka bir harici harness | ACP/acpx                                     |

OpenAI ailesi önek ayrımı için [OpenAI](/tr/providers/openai) ve [Model sağlayıcıları](/tr/concepts/model-providers) bölümlerine bakın. Codex çalışma zamanı destek sözleşmesi için [Codex harness](/tr/plugins/codex-harness#v1-support-contract) bölümüne bakın.

## Çalışma zamanı sahipliği

Farklı çalışma zamanları döngünün farklı miktarlarına sahip olur.

| Yüzey                       | OpenClaw PI gömülü                      | Codex uygulama sunucusu                                                     |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Model döngüsü sahibi        | PI gömülü çalıştırıcısı üzerinden OpenClaw | Codex uygulama sunucusu                                                     |
| Kanonik iş parçacığı durumu | OpenClaw dökümü                         | Codex iş parçacığı, artı OpenClaw döküm aynası                              |
| OpenClaw dinamik araçları   | Yerel OpenClaw araç döngüsü             | Codex adaptörü üzerinden köprülenir                                         |
| Yerel kabuk ve dosya araçları | PI/OpenClaw yolu                      | Codex yerel araçları, desteklendiği yerde yerel hook'lar üzerinden köprülenir |
| Bağlam motoru               | Yerel OpenClaw bağlam derlemesi         | OpenClaw, bağlamı Codex turuna derler                                       |
| Compaction                  | OpenClaw veya seçilen bağlam motoru     | Codex yerel compaction, OpenClaw bildirimleri ve ayna bakımıyla             |
| Kanal teslimi               | OpenClaw                                | OpenClaw                                                                    |

Bu sahiplik ayrımı ana tasarım kuralıdır:

- OpenClaw yüzeyin sahibiyse, OpenClaw normal Plugin hook davranışı sağlayabilir.
- Yerel çalışma zamanı yüzeyin sahibiyse, OpenClaw'ın çalışma zamanı olaylarına veya yerel hook'lara ihtiyacı vardır.
- Yerel çalışma zamanı kanonik iş parçacığı durumunun sahibiyse, OpenClaw desteklenmeyen iç yapıları yeniden yazmak yerine bağlamı aynalamalı ve yansıtmalıdır.

## Çalışma zamanı seçimi

OpenClaw, sağlayıcı ve model çözümlemesinden sonra gömülü bir çalışma zamanı seçer:

1. Bir oturumun kaydedilmiş çalışma zamanı kazanır. Yapılandırma değişiklikleri mevcut bir dökümü farklı bir yerel iş parçacığı sistemine anında geçirmez.
2. `OPENCLAW_AGENT_RUNTIME=<id>`, yeni veya sıfırlanmış oturumlar için o çalışma zamanını zorlar.
3. `agents.defaults.agentRuntime.id` veya `agents.list[].agentRuntime.id`; `auto`, `pi`, `codex` gibi kayıtlı bir gömülü harness kimliği veya `claude-cli` gibi desteklenen bir CLI arka uç takma adı ayarlayabilir.
4. `auto` modunda, kayıtlı Plugin çalışma zamanları desteklenen sağlayıcı/model çiftlerini sahiplenebilir.
5. `auto` modunda hiçbir çalışma zamanı bir turu sahiplenmezse, OpenClaw uyumluluk çalışma zamanı olarak PI kullanır. Çalıştırmanın katı olması gerektiğinde açık bir çalışma zamanı kimliği kullanın.

Açık Plugin çalışma zamanları kapalı şekilde başarısız olur. Örneğin, `agentRuntime.id: "codex"` Codex veya açık bir seçim/çalışma zamanı hatası anlamına gelir; hiçbir zaman sessizce PI'a geri yönlendirilmez.

CLI arka uç takma adları, gömülü harness kimliklerinden farklıdır. Tercih edilen Claude CLI biçimi şudur:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      agentRuntime: { id: "claude-cli" },
    },
  },
}
```

`claude-cli/claude-opus-4-7` gibi eski referanslar uyumluluk için desteklenmeye devam eder, ancak yeni yapılandırma sağlayıcı/modeli kanonik tutmalı ve yürütme arka ucunu `agentRuntime.id` içine koymalıdır.

`auto` modu çoğu sağlayıcı için özellikle muhafazakârdır. OpenAI ajan modelleri istisnadır: ayarlanmamış çalışma zamanı ve `auto` ikisi de Codex harness'ına çözümlenir. Açık PI çalışma zamanı yapılandırması, `openai/*` ajan turları için isteğe bağlı bir uyumluluk rotası olarak kalır; seçilen bir `openai-codex` kimlik doğrulama profiliyle eşleştirildiğinde, OpenClaw genel model referansını `openai/*` olarak tutarken PI'ı eski Codex kimlik doğrulama aktarımı üzerinden dahili olarak yönlendirir. Açık yapılandırma içermeyen eski OpenAI PI oturum sabitlemeleri tekrar Codex'e onarılır.

`openclaw doctor`, `codex` Plugin'i etkin olduğu halde yapılandırmada `openai-codex/*` kaldığına dair uyarı verirse, bunu eski rota durumu olarak değerlendirin. Bunu Codex çalışma zamanı ile `openai/*` olarak yeniden yazmak için `openclaw doctor --fix` çalıştırın.

## Uyumluluk sözleşmesi

Bir çalışma zamanı PI değilse, hangi OpenClaw yüzeylerini desteklediğini belgelemelidir. Çalışma zamanı belgeleri için bu şekli kullanın:

| Soru                                  | Neden önemlidir                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Model döngüsünün sahibi kim?          | Yeniden denemelerin, araç devamının ve son yanıt kararlarının nerede gerçekleştiğini belirler.    |
| Kanonik iş parçacığı geçmişinin sahibi kim? | OpenClaw'ın geçmişi düzenleyip düzenleyemeyeceğini veya yalnızca aynalayıp aynalayamayacağını belirler. |
| OpenClaw dinamik araçları çalışıyor mu? | Mesajlaşma, oturumlar, cron ve OpenClaw'a ait araçlar buna dayanır.                                |
| Dinamik araç hook'ları çalışıyor mu?  | Plugin'ler, OpenClaw'a ait araçlar çevresinde `before_tool_call`, `after_tool_call` ve ara katman bekler. |
| Yerel araç hook'ları çalışıyor mu?    | Kabuk, patch ve çalışma zamanına ait araçlar, ilke ve gözlem için yerel hook desteğine ihtiyaç duyar. |
| Bağlam motoru yaşam döngüsü çalışıyor mu? | Bellek ve bağlam Plugin'leri derleme, alma, tur sonrası ve compaction yaşam döngüsüne bağlıdır.    |
| Hangi compaction verisi açığa çıkarılıyor? | Bazı Plugin'ler yalnızca bildirimlere ihtiyaç duyarken, diğerleri tutulan/atılan üst verilere ihtiyaç duyar. |
| Bilinçli olarak desteklenmeyen nedir? | Kullanıcılar, yerel çalışma zamanının daha fazla duruma sahip olduğu yerlerde PI eşdeğerliği varsaymamalıdır. |

Codex runtime destek sözleşmesi
[Codex harness](/tr/plugins/codex-harness#v1-support-contract) içinde belgelenmiştir.

## Durum etiketleri

Durum çıktısı hem `Execution` hem de `Runtime` etiketlerini gösterebilir. Bunları
sağlayıcı adları olarak değil, tanılama bilgileri olarak okuyun.

- `openai/gpt-5.5` gibi bir model başvurusu, seçili sağlayıcıyı/modeli belirtir.
- `codex` gibi bir runtime kimliği, turu hangi döngünün yürüttüğünü belirtir.
- Telegram veya Discord gibi bir kanal etiketi, konuşmanın nerede gerçekleştiğini belirtir.

Runtime yapılandırmasını değiştirdikten sonra bir oturum hâlâ PI gösteriyorsa, `/new`
ile yeni bir oturum başlatın veya mevcut oturumu `/reset` ile temizleyin. Mevcut oturumlar,
bir transkriptin birbiriyle uyumsuz iki yerel oturum sistemi üzerinden yeniden oynatılmaması için
kaydedilmiş runtime bilgilerini korur.

## İlgili

- [Codex harness](/tr/plugins/codex-harness)
- [OpenAI](/tr/providers/openai)
- [Ajan harness Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Ajan döngüsü](/tr/concepts/agent-loop)
- [Modeller](/tr/concepts/models)
- [Durum](/tr/cli/status)
