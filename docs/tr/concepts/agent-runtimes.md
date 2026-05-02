---
read_when:
    - PI, Codex, ACP veya başka bir yerel ajan çalışma zamanı arasında seçim yapıyorsunuz
    - Durumda veya yapılandırmada sağlayıcı/model/çalışma zamanı etiketleri kafanızı karıştırıyorsa
    - Yerel bir test düzeneği için destek denkliğini belgeliyorsunuz
summary: OpenClaw model sağlayıcılarını, modelleri, kanalları ve ajan çalışma zamanlarını nasıl ayırır
title: Ajan çalışma zamanları
x-i18n:
    generated_at: "2026-05-02T08:51:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: bae2dd55491e5411983da942b2bdc4868d3b2cb5a4eb5d94fbb5a779dc4d679a
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Bir **ajan çalışma zamanı**, hazırlanmış bir model döngüsünü sahiplenen bileşendir: istemi alır, model çıktısını yürütür, yerel araç çağrılarını işler ve tamamlanmış turu OpenClaw'a döndürür.

Çalışma zamanları, sağlayıcılarla kolayca karıştırılabilir çünkü ikisi de model yapılandırmasının yakınında görünür. Bunlar farklı katmanlardır:

| Katman        | Örnekler                              | Ne anlama gelir                                                         |
| ------------- | ------------------------------------- | ----------------------------------------------------------------------- |
| Sağlayıcı     | `openai`, `anthropic`, `openai-codex` | OpenClaw'ın kimlik doğrulaması yapma, modelleri keşfetme ve model referanslarını adlandırma biçimi. |
| Model         | `gpt-5.5`, `claude-opus-4-6`          | Ajan turu için seçilen model.                                           |
| Ajan çalışma zamanı | `pi`, `codex`, `claude-cli`           | Hazırlanmış turu yürüten düşük seviyeli döngü veya arka uç.             |
| Kanal         | Telegram, Discord, Slack, WhatsApp    | Mesajların OpenClaw'a girip çıktığı yer.                                |

Kodda **harness** sözcüğünü de göreceksiniz. Harness, bir ajan çalışma zamanı sağlayan uygulamadır. Örneğin, paketle gelen Codex harness, `codex` çalışma zamanını uygular. Genel yapılandırma `agentRuntime.id` kullanır; `openclaw doctor --fix` eski runtime-policy anahtarlarını bu biçime yeniden yazar.

İki çalışma zamanı ailesi vardır:

- **Gömülü harness'lar**, OpenClaw'ın hazırlanmış ajan döngüsü içinde çalışır. Bugün bu, yerleşik `pi` çalışma zamanı ve `codex` gibi kayıtlı Plugin harness'larıdır.
- **CLI arka uçları**, model referansını kanonik tutarken yerel bir CLI süreci çalıştırır. Örneğin, `agentRuntime.id: "claude-cli"` ile `anthropic/claude-opus-4-7`, "Anthropic modelini seç, Claude CLI üzerinden yürüt" anlamına gelir. `claude-cli` gömülü bir harness kimliği değildir ve AgentHarness seçimine geçirilmemelidir.

## Codex yüzeyleri

Kafa karışıklığının çoğu, Codex adını paylaşan birkaç farklı yüzeyden gelir:

| Yüzey                                               | OpenClaw adı/yapılandırması                 | Ne yapar                                                                                                  |
| --------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Yerel Codex app-server çalışma zamanı               | `openai/*` artı `agentRuntime.id: "codex"`  | Gömülü ajan turunu Codex app-server üzerinden çalıştırır. Bu, olağan ChatGPT/Codex abonelik kurulumudur. |
| Codex OAuth sağlayıcı rotası                        | `openai-codex/*` model referansları         | Normal OpenClaw PI runner üzerinden ChatGPT/Codex aboneliği OAuth kullanır.                              |
| Codex ACP adaptörü                                  | `runtime: "acp"`, `agentId: "codex"`        | Codex'i harici ACP/acpx kontrol düzlemi üzerinden çalıştırır. Yalnızca ACP/acpx açıkça istendiğinde kullanın. |
| Yerel Codex sohbet denetim komut kümesi             | `/codex ...`                                | Codex app-server iş parçacıklarını sohbetten bağlar, sürdürür, yönlendirir, durdurur ve inceler.          |
| GPT/Codex tarzı modeller için OpenAI Platform API rotası | `openai/*` model referansları               | `agentRuntime.id: "codex"` gibi bir çalışma zamanı geçersiz kılması turu çalıştırmadığı sürece OpenAI API anahtarı kimlik doğrulaması kullanır. |

Bu yüzeyler bilinçli olarak bağımsızdır. `codex` Plugin'ini etkinleştirmek yerel app-server özelliklerini kullanılabilir hale getirir; `openai-codex/*` değerini `openai/*` olarak yeniden yazmaz, mevcut oturumları değiştirmez ve ACP'yi Codex varsayılanı yapmaz. `openai-codex/*` seçmek, ayrıca bir çalışma zamanını zorlamadığınız sürece "Codex OAuth sağlayıcı rotasını kullan" anlamına gelir.

Yaygın ChatGPT/Codex abonelik kurulumu, kimlik doğrulaması için Codex OAuth kullanır, ancak model referansını `openai/*` olarak tutar ve `codex` çalışma zamanını seçer:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Bu, OpenClaw'ın bir OpenAI model referansı seçtiği, ardından Codex app-server çalışma zamanından gömülü ajan turunu çalıştırmasını istediği anlamına gelir. "API faturalandırması kullan" anlamına gelmez ve kanalın, model sağlayıcı kataloğunun veya OpenClaw oturum deposunun Codex olduğu anlamına gelmez.

Paketle gelen `codex` Plugin'i etkinleştirildiğinde, doğal dille Codex denetimi ACP yerine yerel `/codex` komut yüzeyini (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) kullanmalıdır. Codex için ACP'yi yalnızca kullanıcı açıkça ACP/acpx istediğinde veya ACP adaptör yolunu test ettiğinde kullanın. Claude Code, Gemini CLI, OpenCode, Cursor ve benzer harici harness'lar ACP kullanmaya devam eder.

Bu, ajana yönelik karar ağacıdır:

1. Kullanıcı **Codex bind/control/thread/resume/steer/stop** isterse, paketle gelen `codex` Plugin'i etkin olduğunda yerel `/codex` komut yüzeyini kullanın.
2. Kullanıcı **gömülü çalışma zamanı olarak Codex** isterse veya normal abonelik destekli Codex ajan deneyimini istiyorsa, `agentRuntime.id: "codex"` ile `openai/<model>` kullanın.
3. Kullanıcı **normal OpenClaw runner üzerinde Codex OAuth/abonelik kimlik doğrulaması** isterse, `openai-codex/<model>` kullanın ve çalışma zamanını PI olarak bırakın.
4. Kullanıcı açıkça **ACP**, **acpx** veya **Codex ACP adaptörü** derse, `runtime: "acp"` ve `agentId: "codex"` ile ACP kullanın.
5. İstek **Claude Code, Gemini CLI, OpenCode, Cursor, Droid veya başka bir harici harness** içinse, yerel alt ajan çalışma zamanı değil ACP/acpx kullanın.

| Kastettiğiniz...                         | Kullanın...                                  |
| ---------------------------------------- | -------------------------------------------- |
| Codex app-server sohbet/iş parçacığı denetimi | Paketle gelen `codex` Plugin'inden `/codex ...` |
| Codex app-server gömülü ajan çalışma zamanı | `agentRuntime.id: "codex"`                   |
| PI runner üzerinde OpenAI Codex OAuth    | `openai-codex/*` model referansları          |
| Claude Code veya başka bir harici harness | ACP/acpx                                     |

OpenAI ailesi önek ayrımı için [OpenAI](/tr/providers/openai) ve [Model sağlayıcıları](/tr/concepts/model-providers) bölümlerine bakın. Codex çalışma zamanı destek sözleşmesi için [Codex harness](/tr/plugins/codex-harness#v1-support-contract) bölümüne bakın.

## Çalışma zamanı sahipliği

Farklı çalışma zamanları döngünün farklı miktarlarına sahip olur.

| Yüzey                       | OpenClaw PI gömülü                      | Codex app-server                                                            |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Model döngüsü sahibi        | PI gömülü runner üzerinden OpenClaw     | Codex app-server                                                            |
| Kanonik iş parçacığı durumu | OpenClaw transkripti                    | Codex iş parçacığı ve OpenClaw transkript yansısı                           |
| OpenClaw dinamik araçları   | Yerel OpenClaw araç döngüsü             | Codex adaptörü üzerinden köprülenir                                         |
| Yerel kabuk ve dosya araçları | PI/OpenClaw yolu                        | Desteklendiğinde yerel hook'lar üzerinden köprülenen Codex yerel araçları   |
| Bağlam motoru               | Yerel OpenClaw bağlam derlemesi         | OpenClaw, bağlamı Codex turuna projeler                                     |
| Compaction                  | OpenClaw veya seçili bağlam motoru      | OpenClaw bildirimleri ve yansı bakımıyla Codex yerel compaction             |
| Kanal teslimi               | OpenClaw                                | OpenClaw                                                                    |

Bu sahiplik ayrımı ana tasarım kuralıdır:

- Yüzey OpenClaw'a aitse, OpenClaw normal Plugin hook davranışı sağlayabilir.
- Yerel çalışma zamanı yüzeye sahipse, OpenClaw'ın çalışma zamanı olaylarına veya yerel hook'lara ihtiyacı vardır.
- Yerel çalışma zamanı kanonik iş parçacığı durumuna sahipse, OpenClaw desteklenmeyen iç yapıları yeniden yazmak yerine bağlamı yansıtmalı ve projelendirmelidir.

## Çalışma zamanı seçimi

OpenClaw, sağlayıcı ve model çözümlemesinden sonra gömülü bir çalışma zamanı seçer:

1. Bir oturumun kayıtlı çalışma zamanı kazanır. Yapılandırma değişiklikleri mevcut bir transkripti farklı bir yerel iş parçacığı sistemine anında geçirmez.
2. `OPENCLAW_AGENT_RUNTIME=<id>`, yeni veya sıfırlanmış oturumlar için bu çalışma zamanını zorlar.
3. `agents.defaults.agentRuntime.id` veya `agents.list[].agentRuntime.id`; `auto`, `pi`, `codex` gibi kayıtlı bir gömülü harness kimliği veya `claude-cli` gibi desteklenen bir CLI arka uç takma adı ayarlayabilir.
4. `auto` modunda, kayıtlı Plugin çalışma zamanları desteklenen sağlayıcı/model çiftlerini sahiplenebilir.
5. `auto` modunda hiçbir çalışma zamanı bir turu sahiplenmezse ve `fallback: "pi"` ayarlıysa (varsayılan), OpenClaw uyumluluk yedeği olarak PI kullanır. Eşleşmeyen `auto` modu seçiminin bunun yerine başarısız olmasını sağlamak için `fallback: "none"` ayarlayın.

Açık Plugin çalışma zamanları varsayılan olarak kapalı başarısız olur. Örneğin, `agentRuntime.id: "codex"` aynı geçersiz kılma kapsamında `fallback: "pi"` ayarlamadığınız sürece Codex veya açık bir seçim hatası anlamına gelir. Bir çalışma zamanı geçersiz kılması daha geniş bir yedek ayarını devralmaz; bu nedenle ajan düzeyinde `agentRuntime.id: "codex"`, varsayılanlar `fallback: "pi"` kullandı diye sessizce PI'a geri yönlendirilmez.

CLI arka uç takma adları gömülü harness kimliklerinden farklıdır. Tercih edilen Claude CLI biçimi şudur:

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

`auto` modu bilinçli olarak muhafazakardır. Plugin çalışma zamanları anladıkları sağlayıcı/model çiftlerini sahiplenebilir, ancak Codex Plugin'i `auto` modunda `openai-codex` sağlayıcısını sahiplenmez. Bu, `openai-codex/*` değerini açık PI Codex OAuth rotası olarak tutar ve abonelik kimlik doğrulamalı yapılandırmaları sessizce yerel app-server harness'ına taşımayı önler.

`openclaw doctor`, `codex` Plugin'i etkinken `openai-codex/*` değerinin hâlâ PI üzerinden yönlendiği konusunda uyarırsa, bunu bir tanı olarak değerlendirin, geçiş olarak değil. İstediğiniz şey PI Codex OAuth ise yapılandırmayı değiştirmeden bırakın. Yerel Codex app-server yürütmesi istediğinizde yalnızca `openai/<model>` artı `agentRuntime.id: "codex"` biçimine geçin.

## Uyumluluk sözleşmesi

Bir çalışma zamanı PI değilse, desteklediği OpenClaw yüzeylerini belgelemelidir. Çalışma zamanı belgeleri için bu biçimi kullanın:

| Soru                                   | Neden önemlidir                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Model döngüsünün sahibi kimdir?        | Yeniden denemelerin, araç devamının ve nihai yanıt kararlarının nerede gerçekleşeceğini belirler. |
| Kanonik ileti dizisi geçmişinin sahibi kimdir? | OpenClaw’ın geçmişi düzenleyip düzenleyemeyeceğini veya yalnızca yansıtıp yansıtamayacağını belirler. |
| OpenClaw dinamik araçları çalışıyor mu? | Mesajlaşma, oturumlar, cron ve OpenClaw’a ait araçlar buna dayanır.                               |
| Dinamik araç kancaları çalışıyor mu?   | Plugin’ler, OpenClaw’a ait araçlar etrafında `before_tool_call`, `after_tool_call` ve ara yazılım bekler. |
| Yerel araç kancaları çalışıyor mu?     | Kabuk, yama ve çalışma zamanına ait araçlar, politika ve gözlem için yerel kanca desteğine ihtiyaç duyar. |
| Bağlam motoru yaşam döngüsü çalışıyor mu? | Bellek ve bağlam plugin’leri derleme, içe alma, dönüş sonrası ve compaction yaşam döngüsüne bağlıdır. |
| Hangi compaction verileri açığa çıkarılır? | Bazı plugin’ler yalnızca bildirimlere ihtiyaç duyarken, diğerleri tutulan/bırakılan meta verilere ihtiyaç duyar. |
| Bilerek desteklenmeyen nedir?          | Yerel çalışma zamanı daha fazla duruma sahip olduğunda kullanıcılar PI eşdeğerliği varsaymamalıdır. |

Codex çalışma zamanı destek sözleşmesi
[Codex harness](/tr/plugins/codex-harness#v1-support-contract) içinde belgelenmiştir.

## Durum etiketleri

Durum çıktısı hem `Execution` hem de `Runtime` etiketlerini gösterebilir. Bunları
sağlayıcı adları olarak değil, tanılama bilgileri olarak okuyun.

- `openai/gpt-5.5` gibi bir model başvurusu, seçili sağlayıcıyı/modeli belirtir.
- `codex` gibi bir çalışma zamanı kimliği, dönüşü hangi döngünün yürüttüğünü belirtir.
- Telegram veya Discord gibi bir kanal etiketi, konuşmanın nerede gerçekleştiğini belirtir.

Çalışma zamanı yapılandırmasını değiştirdikten sonra bir oturum hâlâ PI gösteriyorsa,
`/new` ile yeni bir oturum başlatın veya geçerli oturumu `/reset` ile temizleyin. Mevcut oturumlar,
bir transkriptin uyumsuz iki yerel oturum sistemi üzerinden yeniden oynatılmaması için
kaydedilmiş çalışma zamanlarını korur.

## İlgili

- [Codex harness](/tr/plugins/codex-harness)
- [OpenAI](/tr/providers/openai)
- [Aracı harness plugin’leri](/tr/plugins/sdk-agent-harness)
- [Aracı döngüsü](/tr/concepts/agent-loop)
- [Modeller](/tr/concepts/models)
- [Durum](/tr/cli/status)
