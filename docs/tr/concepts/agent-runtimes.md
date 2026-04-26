---
read_when:
    - PI, Codex, ACP veya başka bir yerel aracı çalışma zamanı arasında seçim yapıyorsunuz
    - Durum veya yapılandırmadaki sağlayıcı/model/çalışma zamanı etiketleri kafanızı karıştırıyor
    - Yerel bir harness için destek eşitliğini belgeliyorsunuz
summary: OpenClaw'ın model sağlayıcılarını, modelleri, kanalları ve aracı çalışma zamanlarını nasıl ayırdığı
title: Aracı çalışma zamanları
x-i18n:
    generated_at: "2026-04-26T11:27:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: f99e88a47a78c48b2f2408a3feedf15cde66a6bacc4e7bfadb9e47c74f7ce633
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

Bir **aracı çalışma zamanı**, hazırlanmış bir model döngüsüne sahip olan bileşendir: istemi alır, model çıktısını yürütür, yerel araç çağrılarını işler ve tamamlanan dönüşü OpenClaw'a geri döndürür.

Çalışma zamanlarını sağlayıcılarla karıştırmak kolaydır çünkü ikisi de model yapılandırmasının yakınında görünür. Bunlar farklı katmanlardır:

| Katman        | Örnekler                              | Ne anlama gelir                                                   |
| ------------- | ------------------------------------- | ----------------------------------------------------------------- |
| Sağlayıcı     | `openai`, `anthropic`, `openai-codex` | OpenClaw'ın nasıl kimlik doğruladığı, modelleri keşfettiği ve model başvurularını adlandırdığı. |
| Model         | `gpt-5.5`, `claude-opus-4-6`          | Aracı dönüşü için seçilen model.                                  |
| Aracı çalışma zamanı | `pi`, `codex`, `claude-cli`    | Hazırlanmış dönüşü yürüten düşük seviyeli döngü veya arka uç.     |
| Kanal         | Telegram, Discord, Slack, WhatsApp    | Mesajların OpenClaw'a girip çıktığı yer.                          |

Kodda ayrıca **harness** sözcüğünü de görürsünüz. Harness, bir aracı çalışma zamanı sağlayan uygulamadır. Örneğin, paketlenmiş Codex harness'i `codex` çalışma zamanını uygular. Genel yapılandırma `agentRuntime.id` kullanır; `openclaw
doctor --fix`, eski çalışma zamanı politikası anahtarlarını bu biçime yeniden yazar.

İki çalışma zamanı ailesi vardır:

- **Gömülü harness'ler**, OpenClaw'ın hazırlanmış aracı döngüsü içinde çalışır. Bugün buna yerleşik `pi` çalışma zamanı ve `codex` gibi kayıtlı Plugin harness'leri dahildir.
- **CLI arka uçları**, model başvurusunu kanonik tutarken yerel bir CLI işlemi çalıştırır. Örneğin, `anthropic/claude-opus-4-7` ile `agentRuntime.id: "claude-cli"` şu anlama gelir: "Anthropic modelini seç, Claude CLI üzerinden yürüt." `claude-cli`, gömülü bir harness kimliği değildir ve AgentHarness seçimine verilmemelidir.

## Codex adlı üç farklı şey

Karışıklığın çoğu, üç farklı yüzeyin Codex adını paylaşmasından kaynaklanır:

| Yüzey                                               | OpenClaw adı/yapılandırması            | Ne yapar                                                                                           |
| --------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Codex OAuth sağlayıcı yolu                          | `openai-codex/*` model başvuruları     | Normal OpenClaw PI çalıştırıcısı üzerinden ChatGPT/Codex abonelik OAuth'unu kullanır.            |
| Yerel Codex app-server çalışma zamanı               | `agentRuntime.id: "codex"`             | Gömülü aracı dönüşünü paketlenmiş Codex app-server harness'i üzerinden çalıştırır.               |
| Codex ACP adaptörü                                  | `runtime: "acp"`, `agentId: "codex"`   | Codex'i harici ACP/acpx kontrol düzlemi üzerinden çalıştırır. Yalnızca ACP/acpx açıkça istendiğinde kullanın. |
| Yerel Codex sohbet kontrol komut kümesi             | `/codex ...`                           | Codex app-server iş parçacıklarını sohbetten bağlar, sürdürür, yönlendirir, durdurur ve inceler. |
| GPT/Codex tarzı modeller için OpenAI Platform API yolu | `openai/*` model başvuruları        | `runtime: "codex"` gibi bir çalışma zamanı geçersiz kılması dönüşü çalıştırmadığı sürece OpenAI API anahtarı kimlik doğrulamasını kullanır. |

Bu yüzeyler kasıtlı olarak birbirinden bağımsızdır. `codex` Plugin'ini etkinleştirmek
yerel app-server özelliklerini kullanılabilir yapar; `openai-codex/*` başvurularını `openai/*` olarak yeniden yazmaz, mevcut oturumları değiştirmez ve ACP'yi Codex için varsayılan yapmaz. `openai-codex/*` seçmek, çalışma zamanını ayrıca zorlamadığınız sürece "Codex OAuth sağlayıcı yolunu kullan" anlamına gelir.

Yaygın Codex kurulumu, `codex` çalışma zamanı ile `openai` sağlayıcısını kullanır:

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

Bu, OpenClaw'ın bir OpenAI model başvurusu seçtiği, ardından gömülü aracı dönüşünü çalıştırması için Codex app-server çalışma zamanını kullandığı anlamına gelir. Bu, kanalın, model sağlayıcı kataloğunun veya OpenClaw oturum deposunun Codex haline geldiği anlamına gelmez.

Paketlenmiş `codex` Plugin'i etkin olduğunda, doğal dilde Codex kontrolü ACP yerine yerel `/codex` komut yüzeyini (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) kullanmalıdır. Codex için ACP'yi yalnızca kullanıcı açıkça ACP/acpx istediğinde veya ACP adaptör yolunu test ettiğinde kullanın. Claude Code, Gemini CLI, OpenCode, Cursor ve benzeri harici harness'ler yine ACP kullanır.

Aracı açısından karar ağacı şöyledir:

1. Kullanıcı **Codex bind/control/thread/resume/steer/stop** isterse, paketlenmiş `codex` Plugin'i etkin olduğunda yerel `/codex` komut yüzeyini kullanın.
2. Kullanıcı **gömülü çalışma zamanı olarak Codex** isterse, `agentRuntime.id: "codex"` ile `openai/<model>` kullanın.
3. Kullanıcı **normal OpenClaw çalıştırıcısında Codex OAuth/abonelik kimlik doğrulaması** isterse, `openai-codex/<model>` kullanın ve çalışma zamanını PI olarak bırakın.
4. Kullanıcı açıkça **ACP**, **acpx** veya **Codex ACP adaptörü** diyorsa, `runtime: "acp"` ve `agentId: "codex"` ile ACP kullanın.
5. İstek **Claude Code, Gemini CLI, OpenCode, Cursor, Droid veya başka bir harici harness** içinse, yerel alt aracı çalışma zamanı değil ACP/acpx kullanın.

| Şunu kastediyorsunuz...                 | Şunu kullanın...                               |
| --------------------------------------- | ---------------------------------------------- |
| Codex app-server sohbet/thread kontrolü | paketlenmiş `codex` Plugin'inden `/codex ...` |
| Codex app-server gömülü aracı çalışma zamanı | `agentRuntime.id: "codex"`                |
| PI çalıştırıcısında OpenAI Codex OAuth  | `openai-codex/*` model başvuruları            |
| Claude Code veya başka bir harici harness | ACP/acpx                                    |

OpenAI ailesi önek ayrımı için bkz. [OpenAI](/tr/providers/openai) ve
[Model sağlayıcıları](/tr/concepts/model-providers). Codex çalışma zamanı destek sözleşmesi için bkz. [Codex harness](/tr/plugins/codex-harness#v1-support-contract).

## Çalışma zamanı sahipliği

Farklı çalışma zamanları döngünün farklı miktarlarına sahiptir.

| Yüzey                       | OpenClaw PI gömülü                    | Codex app-server                                                            |
| --------------------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| Model döngüsü sahibi        | PI gömülü çalıştırıcısı üzerinden OpenClaw | Codex app-server                                                       |
| Kanonik iş parçacığı durumu | OpenClaw transkripti                  | Codex iş parçacığı ve OpenClaw transkript aynası                            |
| OpenClaw dinamik araçları   | Yerel OpenClaw araç döngüsü           | Codex adaptörü üzerinden köprülenir                                         |
| Yerel kabuk ve dosya araçları | PI/OpenClaw yolu                    | Desteklenen yerel kancalar üzerinden köprülenen Codex-yerel araçları        |
| Bağlam motoru               | Yerel OpenClaw bağlam birleştirmesi   | Codex dönüşüne yansıtılan OpenClaw projeleri birleştirilmiş bağlamı         |
| Compaction                  | OpenClaw veya seçili bağlam motoru    | OpenClaw bildirimleri ve ayna bakımı ile Codex-yerel Compaction            |
| Kanal teslimi               | OpenClaw                              | OpenClaw                                                                    |

Bu sahiplik ayrımı ana tasarım kuralıdır:

- OpenClaw yüzeye sahipse, OpenClaw normal Plugin kancası davranışı sağlayabilir.
- Yerel çalışma zamanı yüzeye sahipse, OpenClaw'ın çalışma zamanı olaylarına veya yerel kancalara ihtiyacı vardır.
- Yerel çalışma zamanı kanonik iş parçacığı durumuna sahipse, OpenClaw desteklenmeyen iç yapıları yeniden yazmak yerine bağlamı yansıtmalı ve projelendirmelidir.

## Çalışma zamanı seçimi

OpenClaw, sağlayıcı ve model çözümlemesinden sonra gömülü çalışma zamanı seçer:

1. Bir oturumun kaydedilmiş çalışma zamanı kazanır. Yapılandırma değişiklikleri mevcut bir transkripti farklı bir yerel iş parçacığı sistemine sıcak şekilde geçirmez.
2. `OPENCLAW_AGENT_RUNTIME=<id>`, yeni veya sıfırlanmış oturumlar için bu çalışma zamanını zorlar.
3. `agents.defaults.agentRuntime.id` veya `agents.list[].agentRuntime.id`, `auto`, `pi`, `codex` gibi kayıtlı bir gömülü harness kimliği veya `claude-cli` gibi desteklenen bir CLI arka uç takma adı ayarlayabilir.
4. `auto` modunda, kayıtlı Plugin çalışma zamanları desteklenen sağlayıcı/model çiftlerini talep edebilir.
5. `auto` modunda hiçbir çalışma zamanı bir dönüşü talep etmezse ve `fallback: "pi"` ayarlıysa (varsayılan budur), OpenClaw uyumluluk geri dönüşü olarak PI kullanır. Eşleşmeyen `auto` modu seçiminin başarısız olmasını sağlamak için `fallback: "none"` ayarlayın.

Açık Plugin çalışma zamanları varsayılan olarak kapalı başarısız olur. Örneğin,
`runtime: "codex"`, aynı geçersiz kılma kapsamında `fallback: "pi"` ayarlamadığınız sürece Codex veya açık bir seçim hatası anlamına gelir. Bir çalışma zamanı geçersiz kılması daha geniş bir geri dönüş ayarını devralmaz; bu nedenle aracı düzeyinde `runtime: "codex"`, varsayılanlar `fallback: "pi"` kullandı diye sessizce PI'a geri yönlendirilmez.

CLI arka uç takma adları, gömülü harness kimliklerinden farklıdır. Tercih edilen Claude CLI biçimi şöyledir:

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

`claude-cli/claude-opus-4-7` gibi eski başvurular uyumluluk için desteklenmeye devam eder, ancak yeni yapılandırma sağlayıcı/modeli kanonik tutmalı ve yürütme arka ucunu `agentRuntime.id` içine koymalıdır.

`auto` modu kasıtlı olarak tutucudur. Plugin çalışma zamanları anladıkları sağlayıcı/model çiftlerini talep edebilir, ancak Codex Plugin'i `auto` modunda `openai-codex` sağlayıcısını talep etmez. Bu,
`openai-codex/*` yolunu açık PI Codex OAuth yolu olarak korur ve abonelik kimlik doğrulama yapılandırmalarını sessizce yerel app-server harness'ine taşımaktan kaçınır.

`openclaw doctor`, `codex` Plugin'inin etkin olduğu halde
`openai-codex/*` yolunun hâlâ PI üzerinden yönlendirildiği konusunda uyarırsa, bunu bir tanı olarak değerlendirin, geçiş olarak değil. PI Codex OAuth istediğiniz şeyse yapılandırmayı değiştirmeden bırakın. Yalnızca yerel Codex app-server yürütmesi istediğinizde `openai/<model>` artı `agentRuntime.id: "codex"` biçimine geçin.

## Uyumluluk sözleşmesi

Bir çalışma zamanı PI değilse, hangi OpenClaw yüzeylerini desteklediğini belgelemesi gerekir.
Çalışma zamanı belgeleri için şu biçimi kullanın:

| Soru                                  | Neden önemlidir                                                                                |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Model döngüsüne kim sahip?            | Yeniden denemelerin, araç devamının ve son yanıt kararlarının nerede verildiğini belirler.    |
| Kanonik iş parçacığı geçmişine kim sahip? | OpenClaw'ın geçmişi düzenleyip düzenleyemeyeceğini yoksa yalnızca aynalayacağını belirler. |
| OpenClaw dinamik araçları çalışıyor mu? | Mesajlaşma, oturumlar, Cron ve OpenClaw'a ait araçlar buna dayanır.                         |
| Dinamik araç kancaları çalışıyor mu?  | Plugin'ler OpenClaw'a ait araçlar etrafında `before_tool_call`, `after_tool_call` ve middleware bekler. |
| Yerel araç kancaları çalışıyor mu?    | Kabuk, patch ve çalışma zamanına ait araçlar politika ve gözlem için yerel kanca desteği ister. |
| Bağlam motoru yaşam döngüsü çalışıyor mu? | Bellek ve bağlam Plugin'leri assemble, ingest, dönüş sonrası ve Compaction yaşam döngüsüne bağlıdır. |
| Hangi Compaction verileri açığa çıkıyor? | Bazı Plugin'ler yalnızca bildirim isterken diğerleri tutulan/bırakılan meta verilere ihtiyaç duyar. |
| Kasıtlı olarak ne desteklenmiyor?     | Kullanıcılar, yerel çalışma zamanı daha fazla duruma sahip olduğunda PI eşdeğerliği varsaymamalıdır. |

Codex çalışma zamanı destek sözleşmesi
[Codex harness](/tr/plugins/codex-harness#v1-support-contract) içinde belgelenmiştir.

## Durum etiketleri

Durum çıktısı hem `Execution` hem de `Runtime` etiketlerini gösterebilir. Bunları sağlayıcı adları olarak değil, tanılama bilgileri olarak okuyun.

- `openai/gpt-5.5` gibi bir model başvurusu, seçilen sağlayıcıyı/modeli gösterir.
- `codex` gibi bir çalışma zamanı kimliği, dönüşü hangi döngünün yürüttüğünü gösterir.
- Telegram veya Discord gibi bir kanal etiketi, konuşmanın nerede gerçekleştiğini gösterir.

Çalışma zamanı yapılandırmasını değiştirdikten sonra bir oturum hâlâ PI gösteriyorsa, `/new` ile yeni bir oturum başlatın veya `/reset` ile mevcut olanı temizleyin. Mevcut oturumlar kayıtlı çalışma zamanlarını korur; böylece bir transkript birbiriyle uyumsuz iki yerel oturum sistemi üzerinden yeniden oynatılmaz.

## İlgili

- [Codex harness](/tr/plugins/codex-harness)
- [OpenAI](/tr/providers/openai)
- [Aracı harness Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Aracı döngüsü](/tr/concepts/agent-loop)
- [Modeller](/tr/concepts/models)
- [Durum](/tr/cli/status)
