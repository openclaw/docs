---
read_when:
    - OpenClaw, Codex, ACP veya başka bir yerel aracı çalışma zamanı arasında seçim yapıyorsunuz
    - Durum veya yapılandırmadaki sağlayıcı/model/çalışma zamanı etiketleri kafanızı karıştırıyor
    - Yerel bir yürütme çerçevesi için destek eşdeğerliğini belgeliyorsunuz
summary: OpenClaw model sağlayıcılarını, modelleri, kanalları ve ajan çalışma zamanlarını nasıl ayırır
title: Ajan çalışma zamanları
x-i18n:
    generated_at: "2026-07-12T11:37:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47634daec4f88afa26ba47f33e1ed54b5768381bedeb7de7730fdb766566da89
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Bir **ajan çalışma zamanı**, hazırlanmış tek bir model döngüsünün sahibidir: istemi alır,
model çıktısını yönlendirir, yerel araç çağrılarını işler ve tamamlanan turu
OpenClaw'a döndürür.

Her ikisi de model yapılandırmasının yakınında göründüğü için çalışma zamanları
sağlayıcılarla kolayca karıştırılabilir. Bunlar farklı katmanlardır:

| Katman         | Örnekler                                     | Anlamı                                                                      |
| -------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| Sağlayıcı      | `anthropic`, `github-copilot`, `openai`      | OpenClaw'ın kimlik doğrulama, model keşfetme ve model referanslarını adlandırma biçimi. |
| Model          | `claude-opus-4-6`, `gpt-5.6-sol`             | Ajan turu için seçilen model.                                                |
| Ajan çalışma zamanı | `claude-cli`, `codex`, `copilot`, `openclaw` | Hazırlanmış turu yürüten alt düzey döngü veya arka uç.                        |
| Kanal          | Discord, Slack, Telegram, WhatsApp           | İletilerin OpenClaw'a girip çıktığı yer.                                     |

Bir **çalıştırma çatısı**, ajan çalışma zamanını sağlayan uygulamadır (kod
terimi). Örneğin, paketle birlikte gelen Codex çalıştırma çatısı `codex` çalışma
zamanını uygular. Genel yapılandırma, sağlayıcı veya model girdilerinde
`agentRuntime.id` kullanır; tüm ajanı kapsayan çalışma zamanı anahtarları eski
kalmıştır ve yok sayılır. `openclaw doctor --fix`, eski tüm ajan çalışma zamanı
sabitlemelerini kaldırır ve eski çalışma zamanı model referanslarını, gerektiğinde
model kapsamlı çalışma zamanı ilkesiyle birlikte standart sağlayıcı/model
referansları olarak yeniden yazar.

İki çalışma zamanı ailesi vardır:

- **Gömülü çalıştırma çatıları**, OpenClaw'ın hazırlanmış ajan döngüsünün içinde
  çalışır: yerleşik `openclaw` çalışma zamanı ile `codex` ve `copilot` gibi
  kayıtlı Plugin çalıştırma çatıları.
- **CLI arka uçları**, model referansını standart biçimde tutarken yerel bir CLI
  işlemi çalıştırır. Örneğin, model kapsamlı `agentRuntime.id: "claude-cli"` ile
  `anthropic/claude-opus-4-8`, "Anthropic modelini seç, Claude CLI üzerinden
  yürüt" anlamına gelir. `claude-cli`, gömülü bir çalıştırma çatısı kimliği
  değildir ve AgentHarness seçimine geçirilmemelidir.

`copilot` çalıştırma çatısı, GitHub Copilot CLI için ayrı ve isteğe bağlı bir
harici Plugin çalıştırma çatısıdır; PI, Codex ve GitHub Copilot ajan çalışma
zamanı arasındaki kullanıcıya yönelik karar için
[GitHub Copilot ajan çalışma zamanı](/tr/plugins/copilot) bölümüne bakın.

## Codex yüzeyleri

Birden fazla yüzey Codex adını paylaşır:

| Yüzey                                           | OpenClaw adı/yapılandırması          | Yaptığı iş                                                                                                                 |
| ----------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Yerel Codex uygulama sunucusu çalışma zamanı    | `openai/*` model referansları         | OpenAI gömülü ajan turlarını Codex uygulama sunucusu üzerinden çalıştırır. Bu, olağan ChatGPT/Codex abonelik kurulumudur.   |
| Codex OAuth kimlik doğrulama profilleri         | `openai` OAuth profilleri             | Codex uygulama sunucusu çalıştırma çatısının kullandığı ChatGPT/Codex abonelik kimlik doğrulamasını saklar.                 |
| Codex ACP bağdaştırıcısı                        | `runtime: "acp"`, `agentId: "codex"` | Codex'i harici ACP/acpx denetim düzlemi üzerinden çalıştırır. Yalnızca ACP/acpx açıkça istendiğinde kullanın.               |
| Yerel Codex sohbet denetimi komut kümesi        | `/codex ...`                         | Codex uygulama sunucusu iş parçacıklarını sohbetten bağlar, sürdürür, yönlendirir, durdurur ve inceler.                     |
| Ajan dışı yüzeyler için OpenAI Platform API yolu | `openai/*` ve API anahtarıyla kimlik doğrulama | Görüntüler, gömmeler, konuşma ve gerçek zamanlı işlevler gibi doğrudan OpenAI API'leri.                           |

Bu yüzeyler kasıtlı olarak birbirinden bağımsızdır. `codex` Plugin'ini
etkinleştirmek, yerel uygulama sunucusu özelliklerini kullanılabilir hâle
getirir; eski Codex yollarının onarımı ve geçerliliğini yitirmiş oturum
sabitlemelerinin temizlenmesi `openclaw doctor --fix` tarafından yönetilir.
Bir ajan modeli için `openai/*` seçmek artık, ajan dışı bir OpenAI API yüzeyi
kullanılmadığı sürece, "bunu Codex üzerinden çalıştır" anlamına gelir.

Yaygın ChatGPT/Codex abonelik kurulumu, kimlik doğrulama için Codex OAuth
kullanır; ancak model referansını `openai/*` olarak tutar ve `codex` çalışma
zamanını seçer:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Bu, OpenClaw'ın bir OpenAI model referansı seçtiği ve ardından gömülü ajan
turunu çalıştırmasını Codex uygulama sunucusu çalışma zamanından istediği
anlamına gelir. "API faturalandırmasını kullan" anlamına gelmez; kanalın, model
sağlayıcı kataloğunun veya OpenClaw oturum deposunun Codex hâline geldiği
anlamına da gelmez.

Paketle birlikte gelen `codex` Plugin'i etkinleştirildiğinde, doğal dille Codex
denetimi için ACP yerine yerel `/codex` komut yüzeyini (`/codex bind`,
`/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) kullanın.
Codex için ACP'yi yalnızca kullanıcı ACP/acpx'i açıkça istediğinde veya ACP
bağdaştırıcı yolunu test ederken kullanın. Claude Code, Gemini CLI, OpenCode,
Cursor ve benzeri harici çalıştırma çatıları ACP kullanmaya devam eder.

Karar ağacı:

1. **Codex bağlama/denetim/iş parçacığı/sürdürme/yönlendirme/durdurma** -> paketle birlikte gelen `codex` Plugin'i etkinleştirildiğinde yerel `/codex` komut yüzeyi.
2. **Gömülü çalışma zamanı olarak Codex** veya abonelik destekli olağan Codex ajan deneyimi -> `openai/<model>`.
3. **Bir OpenAI modeli için OpenClaw'ın açıkça seçilmesi** -> model referansını `openai/<model>` olarak tutun ve sağlayıcı/model çalışma zamanı ilkesini `agentRuntime.id: "openclaw"` olarak ayarlayın. Seçili bir `openai` OAuth profili, OpenClaw'ın Codex kimlik doğrulama aktarımı üzerinden dâhili olarak yönlendirilir.
4. **Yapılandırmadaki eski Codex model referansları** -> `openclaw doctor --fix` ile `openai/<model>` biçimine onarın; doctor, eski model referansının gerektirdiği yerlerde sağlayıcı/model kapsamlı `agentRuntime.id: "codex"` ekleyerek Codex kimlik doğrulama yolunu korur. Eski **`codex-cli/*`** model referansları da aynı `openai/<model>` Codex uygulama sunucusu yoluna onarılır; OpenClaw artık paketle birlikte gelen bir Codex CLI arka ucunu korumaz.
5. **ACP, acpx veya Codex ACP bağdaştırıcısı açıkça istendiğinde** -> `runtime: "acp"` ve `agentId: "codex"`.
6. **Claude Code, Gemini CLI, OpenCode, Cursor, Droid veya başka bir harici çalıştırma çatısı** -> yerel alt ajan çalışma zamanı değil, ACP/acpx.

| Kastettiğiniz...                              | Kullanın...                                           |
| --------------------------------------------- | ----------------------------------------------------- |
| Codex uygulama sunucusu sohbet/iş parçacığı denetimi | Paketle birlikte gelen `codex` Plugin'indeki `/codex ...` |
| Codex uygulama sunucusu gömülü ajan çalışma zamanı | `openai/*` ajan modeli referansları                    |
| OpenAI Codex OAuth                            | `openai` OAuth profilleri                              |
| Claude Code veya başka bir harici çalıştırma çatısı | ACP/acpx                                               |

OpenAI ailesi ön eklerinin ayrımı için [OpenAI](/tr/providers/openai) ve
[Model sağlayıcıları](/tr/concepts/model-providers) bölümlerine bakın. Codex çalışma
zamanı destek sözleşmesi için
[Codex çalıştırma çatısı çalışma zamanı](/tr/plugins/codex-harness-runtime#v1-support-contract)
bölümüne bakın.

## Çalışma zamanı sahipliği

Farklı çalışma zamanları, döngünün farklı bölümlerine sahip olur:

| Yüzey                       | OpenClaw gömülü                                  | Codex uygulama sunucusu                                                     |
| --------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------- |
| Model döngüsünün sahibi     | OpenClaw gömülü çalıştırıcısı aracılığıyla OpenClaw | Codex uygulama sunucusu                                                   |
| Standart iş parçacığı durumu | OpenClaw dökümü                                 | Codex iş parçacığı ve OpenClaw döküm yansısı                                |
| OpenClaw dinamik araçları   | Yerel OpenClaw araç döngüsü                      | Codex bağdaştırıcısı üzerinden köprülenir                                   |
| Yerel kabuk ve dosya araçları | OpenClaw yolu                                  | Desteklendiği yerlerde yerel kancalar üzerinden köprülenen Codex yerel araçları |
| Bağlam motoru               | Yerel OpenClaw bağlam derlemesi                  | OpenClaw, derlenmiş bağlamı Codex turuna aktarır                            |
| Compaction                  | OpenClaw veya seçili bağlam motoru               | OpenClaw bildirimleri ve yansı bakımıyla Codex yerel sıkıştırması           |
| Kanal teslimi               | OpenClaw                                         | OpenClaw                                                                    |

Tasarım kuralı: OpenClaw yüzeyin sahibiyse normal Plugin kancası davranışı
sağlayabilir. Yerel çalışma zamanı yüzeyin sahibiyse OpenClaw'ın çalışma zamanı
olaylarına veya yerel kancalara ihtiyacı vardır. Yerel çalışma zamanı standart
iş parçacığı durumunun sahibiyse OpenClaw, desteklenmeyen iç yapıları yeniden
yazmak yerine bağlamı yansıtır ve yansıtır.

## Çalışma zamanı seçimi

OpenClaw, sağlayıcı ve model çözümlemesinden sonra gömülü çalışma zamanını şu
sırayla çözümler:

1. **Model kapsamlı çalışma zamanı ilkesi** önceliklidir. Bu, yapılandırılmış bir
   sağlayıcı model girdisinde veya `agents.defaults.models["provider/model"].agentRuntime`
   / `agents.list[].models["provider/model"].agentRuntime` içinde bulunur.
   `agents.defaults.models["vllm/*"].agentRuntime` gibi bir sağlayıcı joker
   karakteri, tam model ilkesinden sonra uygulanır; böylece dinamik olarak
   keşfedilen sağlayıcı modelleri, model başına tam istisnaları geçersiz
   kılmadan tek bir çalışma zamanını paylaşabilir.
2. **Sağlayıcı kapsamlı çalışma zamanı ilkesi**: `models.providers.<provider>.agentRuntime`.
3. **`auto` modu**: kayıtlı Plugin çalışma zamanları, desteklenen sağlayıcı/model çiftlerini üstlenebilir.
4. `auto` modunda hiçbir şey turu üstlenmezse OpenClaw, uyumluluk çalışma zamanı
   olarak `openclaw`a geri döner. Çalıştırmanın katı olması gerektiğinde açık
   bir çalışma zamanı kimliği kullanın.

Tüm oturumu ve tüm ajanı kapsayan çalışma zamanı sabitlemeleri yok sayılır:
`OPENCLAW_AGENT_RUNTIME`, oturum `agentHarnessId`/`agentRuntimeOverride` durumu,
`agents.defaults.agentRuntime` ve `agents.list[].agentRuntime`. Geçerliliğini
yitirmiş tüm ajan çalışma zamanı yapılandırmasını kaldırmak ve amacın
korunabildiği eski çalışma zamanı model referanslarını dönüştürmek için
`openclaw doctor --fix` komutunu çalıştırın.

Açık sağlayıcı/model Plugin çalışma zamanları kapalı biçimde başarısız olur:
bir sağlayıcı veya modeldeki `agentRuntime.id: "codex"`, Codex ya da açık bir
seçim/çalışma zamanı hatası anlamına gelir; hiçbir zaman sessizce OpenClaw'a
geri yönlendirilmez. Eşleşmeyen bir turu OpenClaw'a yalnızca `auto`
yönlendirebilir.

CLI arka uç takma adları, gömülü çalıştırma çatısı kimliklerinden farklıdır.
Tercih edilen Claude CLI biçimi:

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

`claude-cli/claude-opus-4-7` gibi eski referanslar uyumluluk için desteklenmeye
devam eder; ancak yeni yapılandırma sağlayıcı/model referansını standart
biçimde tutmalı ve yürütme arka ucunu sağlayıcı/model çalışma zamanı ilkesine
yerleştirmelidir.

Eski `codex-cli/*` referansları farklıdır: doctor, bir Codex CLI arka ucunu
korumak yerine bunları Codex uygulama sunucusu çalıştırma çatısı üzerinden
çalışacak şekilde `openai/*` biçimine geçirir.

`auto` modu çoğu sağlayıcı için kasıtlı olarak tutucudur. OpenAI ajan modelleri
istisnadır: ayarlanmamış çalışma zamanı ve `auto`, ikisi de Codex çalıştırma
çatısına çözümlenir. Açık OpenClaw çalışma zamanı yapılandırması, `openai/*`
ajan turları için isteğe bağlı bir uyumluluk yolu olmaya devam eder; seçili bir
`openai` OAuth profiliyle eşleştirildiğinde OpenClaw, genel model referansını
`openai/*` olarak tutarken bu yolu Codex kimlik doğrulama aktarımı üzerinden
dâhili olarak yönlendirir. Geçerliliğini yitirmiş OpenAI çalışma zamanı oturum
sabitlemeleri, çalışma zamanı seçimi tarafından yok sayılır ve
`openclaw doctor --fix` ile temizlenebilir.

`openclaw doctor`, yapılandırmada eski Codex model referansları kalırken `codex`
Plugin'inin etkin olduğu konusunda uyarırsa bunu eski yol durumu olarak
değerlendirin ve Codex çalışma zamanıyla birlikte `openai/*` biçimine yeniden
yazmak için `openclaw doctor --fix` komutunu çalıştırın.

## GitHub Copilot ajan çalışma zamanı

Harici `@openclaw/copilot` plugini, GitHub Copilot CLI (`@github/copilot-sdk`) tarafından desteklenen ve isteğe bağlı etkinleştirilen bir `copilot` çalışma zamanı kaydeder. Standart abonelik sağlayıcısı `github-copilot` üzerinde hak iddia eder ve `auto` tarafından **asla** seçilmez. `agentRuntime.id` aracılığıyla model veya sağlayıcı bazında etkinleştirin:

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

Çalıştırma altyapısı; sağlayıcısını, çalışma zamanını, CLI oturum anahtarını ve kimlik doğrulama profili önekini `extensions/copilot/doctor-contract-api.ts` içinde tanımlar; `openclaw doctor` bunu otomatik olarak yükler. Yapılandırma, kimlik doğrulama, transkript yansıtma, Compaction, bildirimsel doctor sözleşmesi ve daha kapsamlı PI ile Codex ile Copilot SDK karşılaştırmalı kararı için [GitHub Copilot ajan çalışma zamanı](/tr/plugins/copilot) bölümüne bakın.

## Uyumluluk sözleşmesi

Bir çalışma zamanı OpenClaw değilse belgelerinde hangi OpenClaw yüzeylerini desteklediği belirtilmelidir:

| Soru                                         | Neden önemlidir                                                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Model döngüsünün sahibi kimdir?              | Yeniden denemelerin, araç devamlarının ve nihai yanıt kararlarının nerede gerçekleştiğini belirler.                 |
| Standart ileti dizisi geçmişinin sahibi kimdir? | OpenClaw'ın geçmişi düzenleyip düzenleyemeyeceğini veya yalnızca yansıtıp yansıtamayacağını belirler.             |
| OpenClaw dinamik araçları çalışıyor mu?      | Mesajlaşma, oturumlar, cron ve OpenClaw'a ait araçlar buna dayanır.                                                 |
| Dinamik araç kancaları çalışıyor mu?         | Pluginler, OpenClaw'a ait araçların çevresinde `before_tool_call`, `after_tool_call` ve ara katman yazılımı bekler. |
| Yerel araç kancaları çalışıyor mu?           | Kabuk, yama ve çalışma zamanına ait araçlar, politika ve gözlem için yerel kanca desteğine ihtiyaç duyar.           |
| Bağlam motoru yaşam döngüsü çalışıyor mu?    | Bellek ve bağlam pluginleri; derleme, alma, tur sonrası ve Compaction yaşam döngüsüne bağlıdır.                     |
| Hangi Compaction verileri sunuluyor?         | Bazı pluginler yalnızca bildirimlere, diğerleri ise tutulan/atılan meta verilere ihtiyaç duyar.                     |
| Neler kasıtlı olarak desteklenmiyor?         | Yerel çalışma zamanı daha fazla durumun sahibiyken kullanıcılar OpenClaw ile eşdeğer olduğunu varsaymamalıdır.      |

Codex çalışma zamanı destek sözleşmesi [Codex çalıştırma altyapısı çalışma zamanı](/tr/plugins/codex-harness-runtime#v1-support-contract) bölümünde belgelenmiştir.

## Durum etiketleri

Durum çıktısı hem `Execution` hem de `Runtime` etiketlerini gösterebilir. Bunları sağlayıcı adları olarak değil, tanılama bilgileri olarak okuyun:

- `openai/gpt-5.6-sol` gibi bir model başvurusu, seçilen sağlayıcı/modeldir.
- `codex` gibi bir çalışma zamanı kimliği, turu yürüten döngüdür.
- Telegram veya Discord gibi bir kanal etiketi, konuşmanın gerçekleştiği yerdir.

Bir çalıştırmada beklenmeyen bir çalışma zamanı görünüyorsa önce seçilen sağlayıcı/model çalışma zamanı politikasını inceleyin. Eski oturum çalışma zamanı sabitlemeleri artık yönlendirmeyi belirlemez.

## İlgili

- [Codex çalıştırma altyapısı](/tr/plugins/codex-harness)
- [Codex çalıştırma altyapısı çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [GitHub Copilot ajan çalışma zamanı](/tr/plugins/copilot)
- [OpenAI](/tr/providers/openai)
- [Ajan çalıştırma altyapısı pluginleri](/tr/plugins/sdk-agent-harness)
- [Ajan döngüsü](/tr/concepts/agent-loop)
- [Modeller](/tr/concepts/models)
- [Durum](/tr/cli/status)
