---
read_when:
    - PI, Codex, ACP veya başka bir yerel ajan çalışma zamanı arasında seçim yapıyorsunuz
    - Durum veya yapılandırmadaki sağlayıcı/model/çalışma zamanı etiketleri kafanızı karıştırıyor
    - Yerel bir harness için destek denkliğini belgeliyorsunuz
summary: OpenClaw model sağlayıcılarını, modelleri, kanalları ve ajan çalışma zamanlarını nasıl ayırır
title: Ajan çalışma zamanları
x-i18n:
    generated_at: "2026-05-10T19:31:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc5493bbcfb9fd60d4060455215780ca752040cc09b1b5a4d05bd84a59ce5a1e
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Bir **aracı çalışma zamanı**, hazırlanmış tek bir model döngüsünün sahibi olan bileşendir: istemi
alır, model çıktısını yürütür, yerel araç çağrılarını işler ve tamamlanan turu
OpenClaw'a döndürür.

Çalışma zamanları sağlayıcılarla kolayca karıştırılabilir çünkü ikisi de model
yapılandırmasının yakınında görünür. Bunlar farklı katmanlardır:

| Katman        | Örnekler                              | Ne anlama gelir                                                    |
| ------------- | ------------------------------------- | ------------------------------------------------------------------ |
| Sağlayıcı     | `openai`, `anthropic`, `openai-codex` | OpenClaw'un kimlik doğrulama, modelleri keşfetme ve model ref'lerini adlandırma biçimi. |
| Model         | `gpt-5.5`, `claude-opus-4-6`          | Aracı turu için seçilen model.                                     |
| Aracı çalışma zamanı | `pi`, `codex`, `claude-cli`           | Hazırlanan turu yürüten düşük seviyeli döngü veya arka uç.         |
| Kanal         | Telegram, Discord, Slack, WhatsApp    | Mesajların OpenClaw'a girip çıktığı yer.                           |

Kodda **çalıştırıcı** sözcüğünü de göreceksiniz. Çalıştırıcı, bir aracı çalışma
zamanı sağlayan uygulamadır. Örneğin, birlikte gelen Codex çalıştırıcısı
`codex` çalışma zamanını uygular. Genel yapılandırma, sağlayıcı veya model
girdilerinde `agentRuntime.id` kullanır; tüm aracı kapsayan çalışma zamanı
anahtarları eskidir ve yok sayılır. `openclaw doctor --fix`, eski tüm aracı
çalışma zamanı sabitlemelerini kaldırır ve eski çalışma zamanı model ref'lerini
kanonik sağlayıcı/model ref'lerine, gerektiğinde model kapsamlı çalışma zamanı
ilkesiyle birlikte yeniden yazar.

İki çalışma zamanı ailesi vardır:

- **Gömülü çalıştırıcılar**, OpenClaw'un hazırlanmış aracı döngüsü içinde çalışır.
  Bugün bu, yerleşik `pi` çalışma zamanı ve `codex` gibi kayıtlı Plugin
  çalıştırıcılarıdır.
- **CLI arka uçları**, model ref'ini kanonik tutarken yerel bir CLI işlemi
  çalıştırır. Örneğin, model kapsamlı `agentRuntime.id: "claude-cli"` ile
  `anthropic/claude-opus-4-7`, "Anthropic modelini seç, Claude CLI üzerinden
  yürüt" anlamına gelir. `claude-cli` gömülü bir çalıştırıcı kimliği değildir
  ve AgentHarness seçimine geçirilmemelidir.

## Codex yüzeyleri

Çoğu karışıklık, birkaç farklı yüzeyin Codex adını paylaşmasından kaynaklanır:

| Yüzey                                           | OpenClaw adı/yapılandırması           | Ne yapar                                                                                                      |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Yerel Codex uygulama sunucusu çalışma zamanı     | `openai/*` model ref'leri            | OpenAI gömülü aracı turlarını Codex uygulama sunucusu üzerinden çalıştırır. Bu, olağan ChatGPT/Codex abonelik kurulumudur. |
| Codex OAuth kimlik doğrulama profilleri          | `openai-codex` kimlik doğrulama sağlayıcısı | Codex uygulama sunucusu çalıştırıcısının kullandığı ChatGPT/Codex abonelik kimlik doğrulamasını saklar.        |
| Codex ACP bağdaştırıcısı                         | `runtime: "acp"`, `agentId: "codex"` | Codex'i harici ACP/acpx denetim düzlemi üzerinden çalıştırır. Yalnızca ACP/acpx açıkça istendiğinde kullanın. |
| Yerel Codex sohbet denetimi komut seti           | `/codex ...`                         | Codex uygulama sunucusu iş parçacıklarını sohbetten bağlar, sürdürür, yönlendirir, durdurur ve inceler.        |
| Aracı olmayan yüzeyler için OpenAI Platform API rotası | `openai/*` artı API anahtarlı kimlik doğrulama | Görseller, gömmeler, konuşma ve realtime gibi doğrudan OpenAI API'leri için kullanılır.                        |

Bu yüzeyler bilinçli olarak bağımsızdır. `codex` Plugin'ini etkinleştirmek,
yerel uygulama sunucusu özelliklerini kullanılabilir hale getirir; eski
`openai-codex/*` rota onarımı ve eski oturum sabitleme temizliği
`openclaw doctor --fix` tarafından yönetilir. Bir aracı modeli için `openai/*`
seçmek artık aracı olmayan bir OpenAI API yüzeyi kullanılmadığı sürece "bunu
Codex üzerinden çalıştır" anlamına gelir.

Yaygın ChatGPT/Codex abonelik kurulumu kimlik doğrulama için Codex OAuth kullanır,
ancak model ref'ini `openai/*` olarak tutar ve `codex` çalışma zamanını seçer:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Bu, OpenClaw'un bir OpenAI model ref'i seçtiği, ardından gömülü aracı turunu
çalıştırması için Codex uygulama sunucusu çalışma zamanına sorduğu anlamına gelir.
"API faturalandırması kullan" anlamına gelmez ve kanalın, model sağlayıcı
kataloğunun veya OpenClaw oturum deposunun Codex'e dönüştüğü anlamına da gelmez.

Birlikte gelen `codex` Plugin'i etkin olduğunda, doğal dil Codex denetimi ACP
yerine yerel `/codex` komut yüzeyini (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) kullanmalıdır. Codex için ACP'yi
yalnızca kullanıcı açıkça ACP/acpx istediğinde veya ACP bağdaştırıcı yolunu test
ettiğinde kullanın. Claude Code, Gemini CLI, OpenCode, Cursor ve benzer harici
çalıştırıcılar yine ACP kullanır.

Aracıya yönelik karar ağacı şöyledir:

1. Kullanıcı **Codex bind/control/thread/resume/steer/stop** isterse, birlikte
   gelen `codex` Plugin'i etkin olduğunda yerel `/codex` komut yüzeyini kullanın.
2. Kullanıcı **gömülü çalışma zamanı olarak Codex** isterse veya normal abonelik
   destekli Codex aracı deneyimini istiyorsa, `openai/<model>` kullanın.
3. Kullanıcı bir **OpenAI modeli için PI** açıkça seçerse, model ref'ini
   `openai/<model>` olarak tutun ve sağlayıcı/model çalışma zamanı ilkesini
   `agentRuntime.id: "pi"` olarak ayarlayın. Seçili bir `openai-codex` kimlik
   doğrulama profili, içeride PI'nin eski Codex kimlik doğrulama aktarımı
   üzerinden yönlendirilir.
4. Eski yapılandırma hâlâ **`openai-codex/*` model ref'leri** içeriyorsa,
   `openclaw doctor --fix` ile `openai/<model>` olarak onarın; doctor, eski model
   ref'inin ima ettiği yerlerde sağlayıcı/model kapsamlı `agentRuntime.id: "codex"`
   ekleyerek Codex kimlik doğrulama rotasını korur.
5. Kullanıcı açıkça **ACP**, **acpx** veya **Codex ACP bağdaştırıcısı** derse,
   `runtime: "acp"` ve `agentId: "codex"` ile ACP kullanın.
6. İstek **Claude Code, Gemini CLI, OpenCode, Cursor, Droid veya başka bir harici
   çalıştırıcı** içinse, yerel alt aracı çalışma zamanı yerine ACP/acpx kullanın.

| Kastettiğiniz...                         | Kullanılacak...                              |
| --------------------------------------- | -------------------------------------------- |
| Codex uygulama sunucusu sohbet/iş parçacığı denetimi | birlikte gelen `codex` Plugin'inden `/codex ...` |
| Codex uygulama sunucusu gömülü aracı çalışma zamanı | `openai/*` aracı model ref'leri              |
| OpenAI Codex OAuth                      | `openai-codex` kimlik doğrulama profilleri   |
| Claude Code veya başka harici çalıştırıcı | ACP/acpx                                     |

OpenAI ailesi önek ayrımı için bkz. [OpenAI](/tr/providers/openai) ve
[Model sağlayıcıları](/tr/concepts/model-providers). Codex çalışma zamanı destek
sözleşmesi için bkz. [Codex çalıştırıcısı çalışma zamanı](/tr/plugins/codex-harness-runtime#v1-support-contract).

## Çalışma zamanı sahipliği

Farklı çalışma zamanları döngünün farklı miktarlarına sahip olur.

| Yüzey                       | OpenClaw PI gömülü                       | Codex uygulama sunucusu                                                     |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Model döngüsü sahibi        | PI gömülü çalıştırıcısı üzerinden OpenClaw | Codex uygulama sunucusu                                                     |
| Kanonik iş parçacığı durumu | OpenClaw transcript                     | Codex iş parçacığı, artı OpenClaw transcript aynası                         |
| OpenClaw dinamik araçları   | Yerel OpenClaw araç döngüsü             | Codex bağdaştırıcısı üzerinden köprülenir                                   |
| Yerel kabuk ve dosya araçları | PI/OpenClaw yolu                        | Desteklendiği yerlerde yerel hook'lar üzerinden köprülenen Codex yerel araçları |
| Bağlam motoru               | Yerel OpenClaw bağlam derlemesi         | OpenClaw, bağlamı Codex turuna derleyip yansıtır                            |
| Compaction                  | OpenClaw veya seçili bağlam motoru      | OpenClaw bildirimleri ve ayna bakımıyla Codex yerel compaction              |
| Kanal teslimi               | OpenClaw                                | OpenClaw                                                                    |

Bu sahiplik ayrımı ana tasarım kuralıdır:

- Yüzeye OpenClaw sahipse, OpenClaw normal Plugin hook davranışı sağlayabilir.
- Yüzeye yerel çalışma zamanı sahipse, OpenClaw'un çalışma zamanı olaylarına veya yerel hook'lara ihtiyacı vardır.
- Kanonik iş parçacığı durumuna yerel çalışma zamanı sahipse, OpenClaw desteklenmeyen iç yapıları yeniden yazmamalı, aynalamalı ve bağlamı yansıtmalıdır.

## Çalışma zamanı seçimi

OpenClaw, sağlayıcı ve model çözümlemesinden sonra gömülü bir çalışma zamanı seçer:

1. Model kapsamlı çalışma zamanı ilkesi önceliklidir. Bu, yapılandırılmış bir
   sağlayıcı model girdisinde veya `agents.defaults.models["provider/model"].agentRuntime` /
   `agents.list[].models["provider/model"].agentRuntime` içinde bulunabilir.
2. Ardından `models.providers.<provider>.agentRuntime` konumundaki sağlayıcı
   kapsamlı çalışma zamanı ilkesi gelir.
3. `auto` modunda kayıtlı Plugin çalışma zamanları, desteklenen sağlayıcı/model
   çiftlerini üstlenebilir.
4. `auto` modunda hiçbir çalışma zamanı bir turu üstlenmezse, OpenClaw uyumluluk
   çalışma zamanı olarak PI'yi kullanır. Çalıştırmanın katı olması gerekiyorsa
   açık bir çalışma zamanı kimliği kullanın.

Tüm oturum ve tüm aracı çalışma zamanı sabitlemeleri yok sayılır. Buna
`OPENCLAW_AGENT_RUNTIME`, oturum `agentHarnessId`/`agentRuntimeOverride` durumu,
`agents.defaults.agentRuntime` ve `agents.list[].agentRuntime` dahildir. Eski tüm
aracı çalışma zamanı yapılandırmasını kaldırmak ve OpenClaw'un amacı
koruyabildiği yerlerde eski çalışma zamanı model ref'lerini dönüştürmek için
`openclaw doctor --fix` çalıştırın.

Açık sağlayıcı/model Plugin çalışma zamanları kapalı hata verir. Örneğin, bir
sağlayıcı veya model üzerindeki `agentRuntime.id: "codex"`, Codex ya da açık bir
seçim/çalışma zamanı hatası anlamına gelir; asla sessizce PI'ye geri
yönlendirilmez.

CLI arka uç takma adları gömülü çalıştırıcı kimliklerinden farklıdır. Tercih
edilen Claude CLI biçimi şudur:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

`claude-cli/claude-opus-4-7` gibi eski ref'ler uyumluluk için desteklenmeye devam
eder, ancak yeni yapılandırma sağlayıcı/modeli kanonik tutmalı ve yürütme arka
ucunu sağlayıcı/model çalışma zamanı ilkesine koymalıdır.

`auto` modu çoğu sağlayıcı için bilinçli olarak muhafazakârdır. OpenAI aracı
modelleri istisnadır: ayarlanmamış çalışma zamanı ve `auto` ikisi de Codex
çalıştırıcısına çözümlenir. Açık PI çalışma zamanı yapılandırması, `openai/*`
aracı turları için tercihli bir uyumluluk rotası olmaya devam eder; seçili bir
`openai-codex` kimlik doğrulama profiliyle eşleştirildiğinde OpenClaw, genel
model ref'ini `openai/*` olarak tutarken PI'yi içeride eski Codex kimlik doğrulama
aktarımı üzerinden yönlendirir. Eski OpenAI PI oturum sabitlemeleri çalışma
zamanı seçimi tarafından yok sayılır ve `openclaw doctor --fix` ile temizlenebilir.

`openclaw doctor`, `openai-codex/*` yapılandırmada kalırken `codex` Plugin'inin
etkin olduğunu uyarırsa, bunu eski rota durumu olarak ele alın. Codex çalışma
zamanıyla `openai/*` olarak yeniden yazmak için `openclaw doctor --fix` çalıştırın.

## Uyumluluk sözleşmesi

Bir çalışma zamanı PI olmadığında, hangi OpenClaw yüzeylerini desteklediğini
belgelemelidir. Çalışma zamanı belgeleri için bu şekli kullanın:

| Soru                                   | Neden önemli                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Model döngüsünün sahibi kim?           | Yeniden denemelerin, araç devamının ve nihai yanıt kararlarının nerede gerçekleşeceğini belirler. |
| Kanonik iş parçacığı geçmişinin sahibi kim? | OpenClaw’ın geçmişi düzenleyip düzenleyemeyeceğini ya da yalnızca yansıtıp yansıtamayacağını belirler. |
| OpenClaw dinamik araçları çalışıyor mu? | Mesajlaşma, oturumlar, Cron ve OpenClaw’a ait araçlar buna dayanır.                               |
| Dinamik araç hook’ları çalışıyor mu?   | Plugin’ler, OpenClaw’a ait araçlar etrafında `before_tool_call`, `after_tool_call` ve middleware bekler. |
| Yerel araç hook’ları çalışıyor mu?     | Shell, patch ve çalışma zamanına ait araçlar, ilke ve gözlem için yerel hook desteğine ihtiyaç duyar. |
| Bağlam motoru yaşam döngüsü çalışıyor mu? | Bellek ve bağlam Plugin’leri assemble, ingest, after-turn ve Compaction yaşam döngüsüne bağlıdır. |
| Hangi Compaction verileri sunuluyor?   | Bazı Plugin’ler yalnızca bildirimlere ihtiyaç duyarken, diğerleri tutulan/atılan metadata’ya ihtiyaç duyar. |
| Bilerek desteklenmeyenler nelerdir?    | Kullanıcılar, yerel çalışma zamanı daha fazla duruma sahip olduğunda PI eşdeğerliği varsaymamalıdır. |

Codex çalışma zamanı destek sözleşmesi
[Codex harness runtime](/tr/plugins/codex-harness-runtime#v1-support-contract) içinde belgelenmiştir.

## Durum etiketleri

Durum çıktısı hem `Execution` hem de `Runtime` etiketlerini gösterebilir. Bunları
sağlayıcı adları olarak değil, tanılama bilgileri olarak okuyun.

- `openai/gpt-5.5` gibi bir model ref’i seçilen sağlayıcı/modeli belirtir.
- `codex` gibi bir çalışma zamanı kimliği, turu hangi döngünün yürüttüğünü belirtir.
- Telegram veya Discord gibi bir kanal etiketi, konuşmanın nerede gerçekleştiğini belirtir.

Bir çalışma hâlâ beklenmeyen bir çalışma zamanı gösteriyorsa, önce seçilen sağlayıcı/model
çalışma zamanı ilkesini inceleyin. Eski oturum çalışma zamanı sabitlemeleri artık yönlendirmeyi belirlemez.

## İlgili

- [Codex harness](/tr/plugins/codex-harness)
- [Codex harness runtime](/tr/plugins/codex-harness-runtime)
- [OpenAI](/tr/providers/openai)
- [Ajan harness Plugin’leri](/tr/plugins/sdk-agent-harness)
- [Ajan döngüsü](/tr/concepts/agent-loop)
- [Modeller](/tr/concepts/models)
- [Durum](/tr/cli/status)
