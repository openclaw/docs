---
read_when:
    - PI, Codex, ACP veya başka bir yerel ajan çalışma zamanı arasında seçim yapıyorsunuz
    - Durum veya yapılandırmadaki sağlayıcı/model/çalışma zamanı etiketleri kafanızı karıştırıyor
    - Yerel bir test koşumu için destek eşdeğerliğini belgeliyorsunuz
summary: OpenClaw model sağlayıcılarını, modelleri, kanalları ve ajan çalışma zamanlarını nasıl ayırır
title: Ajan çalışma zamanları
x-i18n:
    generated_at: "2026-05-03T08:55:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cd0e0e8508f88c04db63ebcbbca61d9a023ee661f59ea1ed7a1341b357088c7
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Bir **ajan çalışma zamanı**, hazırlanmış tek bir model döngüsünün sahibi olan bileşendir: istemi
alır, model çıktısını yürütür, yerel araç çağrılarını işler ve tamamlanan turu
OpenClaw'a döndürür.

Çalışma zamanlarını sağlayıcılarla karıştırmak kolaydır, çünkü ikisi de model
yapılandırmasına yakın yerlerde görünür. Bunlar farklı katmanlardır:

| Katman         | Örnekler                              | Ne anlama gelir                                                       |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Sağlayıcı      | `openai`, `anthropic`, `openai-codex` | OpenClaw'ın kimlik doğrulamasını, modelleri keşfetmesini ve model referanslarını adlandırmasını belirler. |
| Model         | `gpt-5.5`, `claude-opus-4-6`          | Ajan turu için seçilen model.                              |
| Ajan çalışma zamanı | `pi`, `codex`, `claude-cli`           | Hazırlanmış turu çalıştıran düşük seviyeli döngü veya arka uç.      |
| Kanal       | Telegram, Discord, Slack, WhatsApp    | Mesajların OpenClaw'a nereden girip çıktığı.                            |

Kodda **koşum** sözcüğünü de göreceksiniz. Koşum, bir ajan çalışma zamanı
sağlayan uygulamadır. Örneğin, birlikte gelen Codex koşumu
`codex` çalışma zamanını uygular. Genel yapılandırma `agentRuntime.id` kullanır; `openclaw
doctor --fix` eski çalışma zamanı ilkesi anahtarlarını bu biçime yeniden yazar.

İki çalışma zamanı ailesi vardır:

- **Gömülü koşumlar** OpenClaw'ın hazırlanmış ajan döngüsünün içinde çalışır. Bugün bu,
  yerleşik `pi` çalışma zamanı ve `codex` gibi kayıtlı Plugin koşumlarıdır.
- **CLI arka uçları**, model referansını kanonik tutarken yerel bir CLI işlemi
  çalıştırır. Örneğin, `agentRuntime.id: "claude-cli"` ile
  `anthropic/claude-opus-4-7`, "Anthropic modelini seç, Claude CLI üzerinden
  çalıştır" anlamına gelir. `claude-cli` gömülü bir koşum kimliği değildir ve
  AgentHarness seçimine geçirilmemelidir.

## Codex yüzeyleri

Karışıklığın çoğu, Codex adını paylaşan birkaç farklı yüzeyden kaynaklanır:

| Yüzey                                              | OpenClaw adı/yapılandırması                       | Ne yapar                                                                                               |
| ---------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Yerel Codex uygulama sunucusu çalışma zamanı                      | `openai/*` ve `agentRuntime.id: "codex"` | Gömülü ajan turunu Codex uygulama sunucusu üzerinden çalıştırır. Bu, olağan ChatGPT/Codex abonelik kurulumudur. |
| Codex OAuth sağlayıcı yolu                           | `openai-codex/*` model referansları                | Normal OpenClaw PI çalıştırıcısı üzerinden ChatGPT/Codex aboneliği OAuth kullanır.                               |
| Codex ACP bağdaştırıcısı                                    | `runtime: "acp"`, `agentId: "codex"`       | Codex'i harici ACP/acpx kontrol düzlemi üzerinden çalıştırır. Yalnızca ACP/acpx açıkça istendiğinde kullanın.        |
| Yerel Codex sohbet denetimi komut kümesi                | `/codex ...`                               | Codex uygulama sunucusu iş parçacıklarını sohbetten bağlar, sürdürür, yönlendirir, durdurur ve inceler.                            |
| GPT/Codex tarzı modeller için OpenAI Platform API yolu | `openai/*` model referansları                      | `agentRuntime.id: "codex"` gibi bir çalışma zamanı geçersiz kılması turu çalıştırmadıkça OpenAI API anahtarı kimlik doğrulaması kullanır.     |

Bu yüzeyler kasıtlı olarak bağımsızdır. `codex` Plugin'ini etkinleştirmek
yerel uygulama sunucusu özelliklerini kullanılabilir hale getirir; `openai-codex/*`
öğelerini `openai/*` olarak yeniden yazmaz, mevcut oturumları değiştirmez ve
ACP'yi Codex varsayılanı yapmaz. `openai-codex/*` seçmek, ayrıca bir çalışma
zamanını zorlamadığınız sürece "Codex OAuth sağlayıcı yolunu kullan" anlamına gelir.

Yaygın ChatGPT/Codex abonelik kurulumu kimlik doğrulaması için Codex OAuth kullanır, ancak
model referansını `openai/*` olarak tutar ve `codex` çalışma zamanını seçer:

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

Bu, OpenClaw'ın bir OpenAI model referansı seçtiği, ardından Codex uygulama sunucusu
çalışma zamanından gömülü ajan turunu çalıştırmasını istediği anlamına gelir.
"API faturalandırması kullan" anlamına gelmez ve kanalın, model sağlayıcı kataloğunun
veya OpenClaw oturum deposunun Codex'e dönüştüğü anlamına gelmez.

Birlikte gelen `codex` Plugin'i etkinleştirildiğinde, doğal dilde Codex denetimi
ACP yerine yerel `/codex` komut yüzeyini (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) kullanmalıdır. Codex için ACP'yi
yalnızca kullanıcı açıkça ACP/acpx istediğinde veya ACP bağdaştırıcı yolunu
test ettiğinde kullanın. Claude Code, Gemini CLI, OpenCode, Cursor ve benzer
harici koşumlar yine ACP kullanır.

Bu, ajana yönelik karar ağacıdır:

1. Kullanıcı **Codex bağlama/denetim/iş parçacığı/sürdürme/yönlendirme/durdurma** isterse, birlikte gelen `codex` Plugin'i etkinleştirildiğinde
   yerel `/codex` komut yüzeyini kullanın.
2. Kullanıcı **gömülü çalışma zamanı olarak Codex** isterse veya normal
   abonelik destekli Codex ajan deneyimini istiyorsa,
   `agentRuntime.id: "codex"` ile `openai/<model>` kullanın.
3. Kullanıcı **normal OpenClaw çalıştırıcısında Codex OAuth/abonelik kimlik doğrulaması** isterse,
   `openai-codex/<model>` kullanın ve çalışma zamanını PI olarak bırakın.
4. Kullanıcı açıkça **ACP**, **acpx** veya **Codex ACP bağdaştırıcısı** derse,
   `runtime: "acp"` ve `agentId: "codex"` ile ACP kullanın.
5. İstek **Claude Code, Gemini CLI, OpenCode, Cursor, Droid veya başka bir
   harici koşum** içinse, yerel alt ajan çalışma zamanını değil ACP/acpx kullanın.

| Şunu kastediyorsanız...                             | Şunu kullanın...                                       |
| --------------------------------------- | -------------------------------------------- |
| Codex uygulama sunucusu sohbet/iş parçacığı denetimi    | Birlikte gelen `codex` Plugin'inden `/codex ...` |
| Codex uygulama sunucusu gömülü ajan çalışma zamanı | `agentRuntime.id: "codex"`                   |
| PI çalıştırıcısında OpenAI Codex OAuth     | `openai-codex/*` model referansları                  |
| Claude Code veya başka bir harici koşum   | ACP/acpx                                     |

OpenAI ailesi ön ek ayrımı için [OpenAI](/tr/providers/openai) ve
[Model sağlayıcıları](/tr/concepts/model-providers) bölümlerine bakın. Codex çalışma zamanı destek
sözleşmesi için [Codex koşumu](/tr/plugins/codex-harness#v1-support-contract) bölümüne bakın.

## Çalışma zamanı sahipliği

Farklı çalışma zamanları döngünün farklı miktarlarına sahip olur.

| Yüzey                     | OpenClaw PI gömülü                    | Codex uygulama sunucusu                                                            |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Model döngüsü sahibi            | PI gömülü çalıştırıcısı üzerinden OpenClaw | Codex uygulama sunucusu                                                            |
| Kanonik iş parçacığı durumu      | OpenClaw transkripti                     | Codex iş parçacığı, ayrıca OpenClaw transkript aynası                               |
| OpenClaw dinamik araçları      | Yerel OpenClaw araç döngüsü               | Codex bağdaştırıcısı üzerinden köprülenir                                           |
| Yerel kabuk ve dosya araçları | PI/OpenClaw yolu                        | Desteklendiği yerlerde yerel kancalar üzerinden köprülenen Codex-yerel araçlar            |
| Bağlam motoru              | Yerel OpenClaw bağlam derlemesi        | OpenClaw, bağlamı Codex turuna derler                     |
| Compaction                  | OpenClaw veya seçilen bağlam motoru     | OpenClaw bildirimleri ve ayna bakımı ile Codex-yerel Compaction |
| Kanal teslimi            | OpenClaw                                | OpenClaw                                                                    |

Bu sahiplik ayrımı ana tasarım kuralıdır:

- Yüzeye OpenClaw sahipse, OpenClaw normal Plugin kancası davranışı sağlayabilir.
- Yüzeye yerel çalışma zamanı sahipse, OpenClaw'ın çalışma zamanı olaylarına veya yerel kancalara ihtiyacı vardır.
- Kanonik iş parçacığı durumuna yerel çalışma zamanı sahipse, OpenClaw desteklenmeyen iç yapıları yeniden yazmamalı; aynalamalı ve bağlamı yansıtmalıdır.

## Çalışma zamanı seçimi

OpenClaw, sağlayıcı ve model çözümlemesinden sonra gömülü bir çalışma zamanı seçer:

1. Bir oturumun kaydedilmiş çalışma zamanı önceliklidir. Yapılandırma değişiklikleri
   mevcut bir transkripti farklı bir yerel iş parçacığı sistemine anında geçirmez.
2. `OPENCLAW_AGENT_RUNTIME=<id>` yeni veya sıfırlanmış oturumlar için bu çalışma zamanını zorlar.
3. `agents.defaults.agentRuntime.id` veya `agents.list[].agentRuntime.id`;
   `auto`, `pi`, `codex` gibi kayıtlı bir gömülü koşum kimliği ya da
   `claude-cli` gibi desteklenen bir CLI arka uç takma adı ayarlayabilir.
4. `auto` modunda, kayıtlı Plugin çalışma zamanları destekledikleri sağlayıcı/model
   çiftlerini üstlenebilir.
5. `auto` modunda hiçbir çalışma zamanı bir turu üstlenmezse, OpenClaw
   uyumluluk çalışma zamanı olarak PI kullanır. Çalıştırmanın katı olması
   gerekiyorsa açık bir çalışma zamanı kimliği kullanın.

Açık Plugin çalışma zamanları kapalı şekilde başarısız olur. Örneğin, `agentRuntime.id: "codex"`
Codex ya da açık bir seçim/çalışma zamanı hatası anlamına gelir; hiçbir zaman sessizce
PI'a geri yönlendirilmez.

CLI arka uç takma adları, gömülü koşum kimliklerinden farklıdır. Tercih edilen
Claude CLI biçimi şudur:

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

`claude-cli/claude-opus-4-7` gibi eski referanslar uyumluluk için desteklenmeye
devam eder, ancak yeni yapılandırma sağlayıcı/model bilgisini kanonik tutmalı ve
yürütme arka ucunu `agentRuntime.id` içine koymalıdır.

`auto` modu kasıtlı olarak muhafazakardır. Plugin çalışma zamanları anladıkları
sağlayıcı/model çiftlerini üstlenebilir, ancak Codex Plugin'i `auto` modunda
`openai-codex` sağlayıcısını üstlenmez. Bu, `openai-codex/*` değerlerini açık
PI Codex OAuth yolu olarak tutar ve abonelik kimlik doğrulamalı yapılandırmaları
sessizce yerel uygulama sunucusu koşumuna taşımayı önler.

`openclaw doctor`, `codex` Plugin'i etkinleştirilmişken `openai-codex/*`
hâlâ PI üzerinden yönlendiriliyorsa uyarı verirse, bunu bir tanılama olarak
değerlendirin, bir geçiş olarak değil. İstediğiniz şey PI Codex OAuth ise
yapılandırmayı değiştirmeden tutun. Yerel Codex uygulama sunucusu yürütmesi
istediğinizde yalnızca `openai/<model>` ve `agentRuntime.id: "codex"` seçeneğine geçin.

## Uyumluluk sözleşmesi

Bir çalışma zamanı PI değilse, hangi OpenClaw yüzeylerini desteklediğini belgelemelidir.
Çalışma zamanı belgeleri için bu biçimi kullanın:

| Soru                               | Neden önemlidir                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Model döngüsünün sahibi kim?               | Yeniden denemelerin, araç devamının ve son yanıt kararlarının nerede gerçekleşeceğini belirler.                   |
| Kanonik iş parçacığı geçmişinin sahibi kim?     | OpenClaw'ın geçmişi düzenleyip düzenleyemeyeceğini ya da yalnızca aynalayıp aynalayamayacağını belirler.                                   |
| OpenClaw dinamik araçları çalışıyor mu?        | Mesajlaşma, oturumlar, Cron ve OpenClaw'a ait araçlar buna dayanır.                                 |
| Dinamik araç kancaları çalışıyor mu?            | Plugin'ler, OpenClaw'a ait araçlar etrafında `before_tool_call`, `after_tool_call` ve ara katman bekler. |
| Yerel araç kancaları çalışıyor mu?             | Kabuk, yama ve çalışma zamanına ait araçlar ilke ve gözlem için yerel kanca desteğine ihtiyaç duyar.        |
| Bağlam motoru yaşam döngüsü çalışıyor mu? | Bellek ve bağlam Plugin'leri derleme, içe alma, tur sonrası ve Compaction yaşam döngüsüne bağlıdır.      |
| Hangi Compaction verileri açığa çıkarılır?       | Bazı Plugin'ler yalnızca bildirimlere ihtiyaç duyarken, diğerleri tutulan/bırakılan üst verilere ihtiyaç duyar.                    |
| Kasıtlı olarak ne desteklenmiyor?     | Kullanıcılar, yerel çalışma zamanının daha fazla duruma sahip olduğu yerlerde PI eşdeğerliği varsaymamalıdır.                  |

Codex çalışma zamanı destek sözleşmesi
[Codex koşumu](/tr/plugins/codex-harness#v1-support-contract) içinde belgelenmiştir.

## Durum etiketleri

Durum çıktısı hem `Execution` hem de `Runtime` etiketlerini gösterebilir. Bunları
sağlayıcı adları olarak değil, tanılama bilgileri olarak okuyun.

- `openai/gpt-5.5` gibi bir model başvurusu, seçili sağlayıcı/modeli belirtir.
- `codex` gibi bir çalışma zamanı kimliği, turu hangi döngünün yürüttüğünü belirtir.
- Telegram veya Discord gibi bir kanal etiketi, konuşmanın nerede gerçekleştiğini belirtir.

Bir oturum, çalışma zamanı yapılandırmasını değiştirdikten sonra hâlâ PI gösteriyorsa, `/new`
ile yeni bir oturum başlatın veya mevcut oturumu `/reset` ile temizleyin. Mevcut oturumlar,
bir dökümün iki uyumsuz yerel oturum sistemi üzerinden yeniden oynatılmaması için kayıtlı
çalışma zamanlarını korur.

## İlgili

- [Codex harness](/tr/plugins/codex-harness)
- [OpenAI](/tr/providers/openai)
- [Aracı harness Pluginleri](/tr/plugins/sdk-agent-harness)
- [Aracı döngüsü](/tr/concepts/agent-loop)
- [Modeller](/tr/concepts/models)
- [Durum](/tr/cli/status)
