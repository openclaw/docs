---
read_when:
    - Paketle birlikte gelen Codex app-server düzeneğini kullanmak istiyorsunuz
    - Codex çalıştırma düzeneği yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex dağıtımlarının PI'ya geri dönmek yerine başarısız olmasını istiyorsunuz
summary: OpenClaw gömülü aracı dönüşlerini birlikte gelen Codex app-server koşumu üzerinden çalıştırın
title: Codex çalışma düzeneği
x-i18n:
    generated_at: "2026-05-06T09:23:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: a35ab08c1a7327437aadb6c2517bd962071bbb25982718d4c0b043680163ab70
    source_path: plugins/codex-harness.md
    workflow: 16
---

Paketle gelen `codex` Plugin'i, OpenClaw'ın yerleşik PI altyapısı yerine Codex app-server üzerinden gömülü ajan turlarını çalıştırmasını sağlar.

Bunu, düşük seviyeli ajan oturumunun Codex tarafından yönetilmesini istediğinizde kullanın: model keşfi, yerel iş parçacığı sürdürme, yerel Compaction ve app-server yürütmesi. OpenClaw yine de sohbet kanallarını, oturum dosyalarını, model seçimini, araçları, onayları, medya teslimini ve görünür transkript aynasını yönetir.

Bir kaynak sohbet turu Codex altyapısı üzerinden çalıştığında, dağıtım `messages.visibleReplies` ayarını açıkça yapılandırmamışsa görünür yanıtlar varsayılan olarak OpenClaw `message` aracına gider. Ajan Codex turunu yine de özel olarak tamamlayabilir; kanala yalnızca `message(action="send")` çağırdığında gönderi yapar. Doğrudan sohbet final yanıtlarını eski otomatik teslim yolunda tutmak için `messages.visibleReplies: "automatic"` ayarını yapın.

Codex Heartbeat turları da varsayılan olarak `heartbeat_respond` aracını alır; böylece ajan, uyanmanın sessiz mi kalması yoksa bildirim mi göndermesi gerektiğini bu denetim akışını final metnine kodlamadan kaydedebilir.

Heartbeat'e özgü inisiyatif rehberliği, Heartbeat turunun kendisinde Codex iş birliği modu geliştirici talimatı olarak gönderilir. Sıradan sohbet turları, normal çalışma zamanı istemlerinde Heartbeat felsefesini taşımak yerine Codex Varsayılan modunu geri yükler.

Kendinizi konumlandırmaya çalışıyorsanız [Ajan çalışma zamanları](/tr/concepts/agent-runtimes) ile başlayın. Kısa sürüm şudur: `openai/gpt-5.5` model referansıdır, `codex` çalışma zamanıdır ve Telegram, Discord, Slack veya başka bir kanal iletişim yüzeyi olarak kalır.

## Hızlı yapılandırma

"OpenClaw içinde Codex" isteyen çoğu kullanıcı şu yolu ister: Bir ChatGPT/Codex aboneliğiyle oturum açın, ardından gömülü ajan turlarını yerel Codex app-server çalışma zamanı üzerinden çalıştırın. Model referansı yine kanonik olarak `openai/gpt-*` kalır; abonelik kimlik doğrulaması bir `openai-codex/*` model önekinden değil, Codex hesabından/profilinden gelir.

Henüz yapmadıysanız önce Codex OAuth ile oturum açın:

```bash
openclaw models auth login --provider openai-codex
```

Ardından paketle gelen `codex` Plugin'ini etkinleştirin ve Codex çalışma zamanını zorlayın:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
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

Yapılandırmanız `plugins.allow` kullanıyorsa `codex` değerini oraya da ekleyin:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Yapılandırmada `openai-codex/gpt-*` kullanmayın. Bu önek, `openclaw doctor --fix` komutunun birincil modeller, geri dönüşler, Heartbeat/alt ajan/Compaction geçersiz kılmaları, hook'lar, kanal geçersiz kılmaları ve bayat kalıcı oturum rota sabitlemeleri genelinde `openai/gpt-*` olarak yeniden yazdığı eski bir rotadır.

## Bu Plugin'in değiştirdikleri

Paketle gelen `codex` Plugin'i birkaç ayrı yetenek sağlar:

| Yetenek                           | Nasıl kullanırsınız                                | Ne yapar                                                                       |
| --------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------ |
| Yerel gömülü çalışma zamanı       | `agentRuntime.id: "codex"`                         | OpenClaw gömülü ajan turlarını Codex app-server üzerinden çalıştırır.          |
| Yerel sohbet denetim komutları    | `/codex bind`, `/codex resume`, `/codex steer`, ... | Bir mesajlaşma konuşmasından Codex app-server iş parçacıklarını bağlar ve yönetir. |
| Codex app-server sağlayıcı/katalog | `codex` iç bileşenleri, altyapı üzerinden sunulur  | Çalışma zamanının app-server modellerini keşfetmesini ve doğrulamasını sağlar. |
| Codex medya anlama yolu           | `codex/*` görüntü modeli uyumluluk yolları         | Desteklenen görüntü anlama modelleri için sınırlı Codex app-server turları çalıştırır. |
| Yerel hook aktarıcısı             | Codex'e yerel olayların etrafındaki Plugin hook'ları | OpenClaw'ın desteklenen Codex'e yerel araç/finalizasyon olaylarını gözlemlemesini/engellemesini sağlar. |

Plugin'i etkinleştirmek bu yetenekleri kullanılabilir hale getirir. Şunları **yapmaz**:

- her OpenAI modeli için Codex kullanmaya başlamak
- `openai-codex/*` model referanslarını, doctor Codex'in kurulu, etkin, `codex` altyapısını katkı olarak sağladığını ve OAuth'a hazır olduğunu doğrulamadan yerel çalışma zamanına dönüştürmek
- ACP/acpx'i varsayılan Codex yolu yapmak
- zaten bir PI çalışma zamanı kaydetmiş mevcut oturumları anında değiştirmek
- OpenClaw kanal teslimini, oturum dosyalarını, kimlik doğrulama profili depolamasını veya mesaj yönlendirmeyi değiştirmek

Aynı Plugin, yerel `/codex` sohbet denetim komut yüzeyini de yönetir. Plugin etkinse ve kullanıcı sohbetten Codex iş parçacıklarını bağlamayı, sürdürmeyi, yönlendirmeyi, durdurmayı veya incelemeyi isterse ajanlar ACP yerine `/codex ...` tercih etmelidir. ACP, kullanıcı ACP/acpx istediğinde veya ACP Codex adaptörünü test ettiğinde açık geri dönüş olarak kalır.

Yerel Codex turları, genel uyumluluk katmanı olarak OpenClaw Plugin hook'larını korur. Bunlar süreç içi OpenClaw hook'larıdır, Codex `hooks.json` komut hook'ları değildir:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- aynalanmış transkript kayıtları için `before_message_write`
- Codex `Stop` aktarması üzerinden `before_agent_finalize`
- `agent_end`

Plugin'ler ayrıca OpenClaw aracı yürüttükten sonra ve sonuç Codex'e döndürülmeden önce OpenClaw dinamik araç sonuçlarını yeniden yazmak için çalışma zamanı bağımsız araç sonucu ara yazılımı kaydedebilir. Bu, OpenClaw'a ait transkript araç sonucu yazımlarını dönüştüren genel `tool_result_persist` Plugin hook'undan ayrıdır.

Plugin hook semantiğinin kendisi için [Plugin hook'ları](/tr/plugins/hooks) ve [Plugin koruma davranışı](/tr/tools/plugin) bölümlerine bakın.

Altyapı varsayılan olarak kapalıdır. Yeni yapılandırmalar OpenAI model referanslarını kanonik olarak `openai/gpt-*` şeklinde tutmalı ve yerel app-server yürütmesi istediklerinde `agentRuntime.id: "codex"` veya `OPENCLAW_AGENT_RUNTIME=codex` değerini açıkça zorlamalıdır. Eski `codex/*` model referansları uyumluluk için altyapıyı hâlâ otomatik seçer, ancak çalışma zamanı destekli eski sağlayıcı önekleri normal model/sağlayıcı seçenekleri olarak gösterilmez.

Yapılandırılmış herhangi bir model rotası hâlâ `openai-codex/*` ise `openclaw doctor --fix` bunu `openai/*` olarak yeniden yazar. Eşleşen ajan rotaları için ajan çalışma zamanını yalnızca Codex Plugin'i kuruluysa, etkinse, `codex` altyapısını katkı olarak sağlıyorsa ve kullanılabilir OAuth'a sahipse `codex` olarak ayarlar; aksi halde çalışma zamanını `pi` olarak ayarlar.

## Rota haritası

Yapılandırmayı değiştirmeden önce bu tabloyu kullanın:

| İstenen davranış                                  | Model referansı          | Çalışma zamanı yapılandırması           | Kimlik doğrulama/profil rotası | Beklenen durum etiketi          |
| ------------------------------------------------- | ------------------------ | --------------------------------------- | ------------------------------ | ------------------------------- |
| Yerel Codex çalışma zamanıyla ChatGPT/Codex aboneliği | `openai/gpt-*`           | `agentRuntime.id: "codex"`              | Codex OAuth veya Codex hesabı  | `Runtime: OpenAI Codex`         |
| Normal OpenClaw çalıştırıcısı üzerinden OpenAI API | `openai/gpt-*`           | atlanmış veya `runtime: "pi"`           | OpenAI API anahtarı            | `Runtime: OpenClaw Pi Default`  |
| Doctor onarımı gerektiren eski yapılandırma       | `openai-codex/gpt-*`     | `codex` veya `pi` olarak onarılır       | Mevcut yapılandırılmış auth    | `doctor --fix` sonrasında yeniden kontrol edin |
| Koruyucu otomatik modla karışık sağlayıcılar      | sağlayıcıya özgü referanslar | `agentRuntime.id: "auto"`            | Seçilen sağlayıcı başına       | Seçilen çalışma zamanına bağlıdır |
| Açık Codex ACP adaptör oturumu                    | ACP istemine/modeline bağlı | `sessions_spawn` ile `runtime: "acp"` | ACP arka uç auth               | ACP görev/oturum durumu         |

Önemli ayrım sağlayıcı ile çalışma zamanı arasındadır:

- `openai-codex/*`, doctor'ın yeniden yazdığı eski bir rotadır.
- `agentRuntime.id: "codex"` Codex altyapısını gerektirir ve kullanılamıyorsa kapalı şekilde başarısız olur.
- `agentRuntime.id: "auto"` kayıtlı altyapıların eşleşen sağlayıcı rotalarını sahiplenmesine izin verir, ancak kanonik OpenAI referansları bir altyapı bu sağlayıcı/model çiftini desteklemediği sürece yine PI tarafından yönetilir.
- `/codex ...`, "bu sohbet hangi yerel Codex konuşmasına bağlanmalı veya onu denetlemeli?" sorusunu yanıtlar.
- ACP, "acpx hangi harici altyapı sürecini başlatmalı?" sorusunu yanıtlar.

## Doğru model önekini seçin

OpenAI ailesi rotalar öneke özeldir. Yaygın abonelik artı yerel Codex çalışma zamanı kurulumu için `agentRuntime.id: "codex"` ile `openai/*` kullanın. `openai-codex/*` değerini doctor'ın yeniden yazması gereken eski yapılandırma olarak değerlendirin:

| Model referansı                                | Çalışma zamanı yolu                         | Ne zaman kullanılır                                                        |
| ---------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                               | OpenClaw/PI tesisatı üzerinden OpenAI sağlayıcısı | `OPENAI_API_KEY` ile güncel doğrudan OpenAI Platform API erişimi istiyorsunuz. |
| `openai-codex/gpt-5.5`                         | Doctor tarafından onarılan eski rota        | Eski yapılandırmadasınız; yeniden yazmak için `openclaw doctor --fix` çalıştırın. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"`  | Codex app-server altyapısı                  | Yerel Codex yürütmesiyle ChatGPT/Codex abonelik auth'u istiyorsunuz.       |

GPT-5.5, hesabınız bunları sunduğunda hem doğrudan OpenAI API anahtarı hem de Codex aboneliği rotalarında görünebilir. Yerel Codex çalışma zamanı için Codex app-server altyapısıyla `openai/gpt-5.5` kullanın veya doğrudan API anahtarı trafiği için Codex çalışma zamanı geçersiz kılması olmadan `openai/gpt-5.5` kullanın.

Eski `codex/gpt-*` referansları uyumluluk takma adları olarak kabul edilmeye devam eder. Doctor uyumluluk geçişi, eski çalışma zamanı referanslarını kanonik model referanslarına yeniden yazar ve çalışma zamanı ilkesini ayrı olarak kaydeder. Yeni yerel app-server altyapı yapılandırmaları `openai/gpt-*` artı `agentRuntime.id: "codex"` kullanmalıdır.

`agents.defaults.imageModel` aynı önek ayrımını izler. Normal OpenAI rotası için `openai/gpt-*`, görüntü anlama sınırlı bir Codex app-server turu üzerinden çalışmalıysa `codex/gpt-*` kullanın. `openai-codex/gpt-*` kullanmayın; doctor bu eski öneki `openai/gpt-*` olarak yeniden yazar. Codex app-server modelinin görüntü girdisi desteğini duyurması gerekir; yalnızca metin destekli Codex modelleri medya turu başlamadan önce başarısız olur.

Geçerli oturum için etkin altyapıyı doğrulamak üzere `/status` kullanın. Seçim şaşırtıcıysa `agents/harness` alt sistemi için debug günlüklemeyi etkinleştirin ve Gateway'in yapılandırılmış `agent harness selected` kaydını inceleyin. Bu kayıt seçilen altyapı kimliğini, seçim nedenini, çalışma zamanı/geri dönüş ilkesini ve `auto` modunda her Plugin adayının destek sonucunu içerir.

### Doctor uyarılarının anlamı

`openclaw doctor`, yapılandırılmış model referansları veya kalıcı oturum rota durumu hâlâ `openai-codex/*` kullanıyorsa uyarır. `openclaw doctor --fix` bu rotaları şunlara yeniden yazar:

- `openai/<model>`
- Codex kurulu, etkin, `codex` altyapısını katkı olarak sağlıyor ve kullanılabilir OAuth'a sahipse `agentRuntime.id: "codex"`
- aksi halde `agentRuntime.id: "pi"`

`codex` rotası yerel Codex altyapısını zorlar. `pi` rotası, eski rota temizliğinin yan etkisi olarak Codex'i etkinleştirmek veya kurmak yerine ajanı varsayılan OpenClaw çalıştırıcısında tutar.
Doctor ayrıca keşfedilen ajan oturum depoları genelindeki bayat kalıcı oturum sabitlemelerini onarır; böylece eski konuşmalar kaldırılmış rotada takılı kalmaz.

Harness seçimi canlı oturum denetimi değildir. Gömülü bir tur çalıştığında,
OpenClaw seçilen harness kimliğini o oturuma kaydeder ve aynı oturum kimliğindeki
sonraki turlarda onu kullanmaya devam eder. Gelecekteki oturumların başka bir
harness kullanmasını istediğinizde `agentRuntime` yapılandırmasını veya
`OPENCLAW_AGENT_RUNTIME` değerini değiştirin; mevcut bir konuşmayı PI ile Codex
arasında değiştirmeden önce yeni bir oturum başlatmak için `/new` veya `/reset`
kullanın. Bu, bir transkripti birbiriyle uyumsuz iki yerel oturum sistemi
üzerinden yeniden oynatmayı önler.

Harness sabitlemeleri eklenmeden önce oluşturulan eski oturumlar, transkript
geçmişleri olduğunda PI'ye sabitlenmiş kabul edilir. Yapılandırmayı
değiştirdikten sonra o konuşmayı Codex'e geçirmek için `/new` veya `/reset`
kullanın.

`/status` etkin model runtime'ını gösterir. Varsayılan PI harness'i
`Runtime: OpenClaw Pi Default` olarak görünür ve Codex uygulama sunucusu harness'i
`Runtime: OpenAI Codex` olarak görünür.

## Gereksinimler

- Paketle gelen `codex` Plugin'i kullanılabilir durumda olan OpenClaw.
- Codex uygulama sunucusu `0.125.0` veya daha yenisi. Paketle gelen Plugin,
  varsayılan olarak uyumlu bir Codex uygulama sunucusu ikilisini yönetir; bu
  nedenle `PATH` üzerindeki yerel `codex` komutları normal harness başlatmasını
  etkilemez.
- Uygulama sunucusu süreci veya OpenClaw'ın Codex kimlik doğrulama köprüsü için
  Codex kimlik doğrulaması kullanılabilir olmalıdır. Yerel uygulama sunucusu
  başlatmaları her agent için OpenClaw tarafından yönetilen bir Codex ana dizini
  ve yalıtılmış bir alt `HOME` kullanır; bu yüzden varsayılan olarak kişisel
  `~/.codex` hesabınızı, skills öğelerinizi, plugins öğelerinizi,
  yapılandırmanızı, ileti dizisi durumunuzu veya yerel `$HOME/.agents/skills`
  değerini okumaz.

Plugin, eski veya sürümsüz uygulama sunucusu el sıkışmalarını engeller. Bu,
OpenClaw'ın test edildiği protokol yüzeyinde kalmasını sağlar.

Canlı ve Docker smoke testleri için kimlik doğrulaması genellikle Codex CLI
hesabından veya bir OpenClaw `openai-codex` kimlik doğrulama profilinden gelir.
Yerel stdio uygulama sunucusu başlatmaları, hesap yoksa `CODEX_API_KEY` /
`OPENAI_API_KEY` değerlerine de geri dönebilir.

## Çalışma Alanı Bootstrap Dosyaları

Codex, yerel proje dokümanı keşfi üzerinden `AGENTS.md` dosyasını kendisi işler.
OpenClaw, sentetik Codex proje dokümanı dosyaları yazmaz veya persona dosyaları
için Codex yedek dosya adlarına bağımlı olmaz; çünkü Codex yedekleri yalnızca
`AGENTS.md` eksik olduğunda uygulanır.

OpenClaw çalışma alanı eşliği için Codex harness'i diğer bootstrap dosyalarını
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` ve varsa `MEMORY.md`) çözümler ve bunları `thread/start` ve
`thread/resume` üzerinde Codex geliştirici talimatları aracılığıyla iletir. Bu,
`SOUL.md` ve ilgili çalışma alanı persona/profil bağlamını, `AGENTS.md`
dosyasını çoğaltmadan yerel Codex davranış şekillendirme hattında görünür tutar.

## Codex'i Diğer Modellerin Yanına Ekleyin

Aynı agent Codex ile Codex dışı sağlayıcı modelleri arasında serbestçe
geçiş yapacaksa `agentRuntime.id: "codex"` değerini genel olarak ayarlamayın.
Zorunlu runtime, o agent veya oturum için her gömülü tura uygulanır. Bu runtime
zorunlu iken bir Anthropic modeli seçerseniz OpenClaw yine Codex harness'ini
denemeye devam eder ve o turu sessizce PI üzerinden yönlendirmek yerine kapalı
şekilde başarısız olur.

Bunun yerine şu biçimlerden birini kullanın:

- Codex'i `agentRuntime.id: "codex"` ile ayrılmış bir agent üzerine koyun.
- Normal karma sağlayıcı kullanımı için varsayılan agent'ı `agentRuntime.id: "auto"` ve PI geri dönüşü üzerinde tutun.
- Eski `codex/*` başvurularını yalnızca uyumluluk için kullanın. Yeni yapılandırmalar `openai/*` artı açık bir Codex runtime politikasını tercih etmelidir.

Örneğin bu, varsayılan agent'ı normal otomatik seçimde tutar ve ayrı bir Codex
agent'ı ekler:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Bu biçimde:

- Varsayılan `main` agent normal sağlayıcı yolunu ve PI uyumluluk geri dönüşünü kullanır.
- `codex` agent Codex uygulama sunucusu harness'ini kullanır.
- Codex `codex` agent için eksikse veya desteklenmiyorsa tur, sessizce PI kullanmak yerine başarısız olur.

## Agent Komut Yönlendirmesi

Agent'lar kullanıcı isteklerini yalnızca "Codex" sözcüğüne göre değil, niyete göre yönlendirmelidir:

| Kullanıcı şunu ister...                                | Agent şunu kullanmalıdır...                       |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Bu sohbeti Codex'e bağla"                             | `/codex bind`                                    |
| "Codex ileti dizisi `<id>` değerini burada sürdür"     | `/codex resume <id>`                             |
| "Codex ileti dizilerini göster"                        | `/codex threads`                                 |
| "Kötü bir Codex çalıştırması için destek raporu aç"    | `/diagnostics [note]`                            |
| "Yalnızca bu ekli ileti dizisi için Codex geri bildirimi gönder" | `/codex diagnostics [note]`                      |
| "ChatGPT/Codex aboneliğimi Codex runtime ile kullan"   | `openai/*` artı `agentRuntime.id: "codex"`       |
| "Eski `openai-codex/*` yapılandırma/oturum sabitlemelerini onar" | `openclaw doctor --fix`                          |
| "Codex'i ACP/acpx üzerinden çalıştır"                  | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Claude Code/Gemini/OpenCode/Cursor'ı bir ileti dizisinde başlat" | ACP/acpx, `/codex` değil ve yerel alt agent'lar değil |

OpenClaw, ACP oluşturma rehberliğini agent'lara yalnızca ACP etkin,
gönderilebilir ve yüklenmiş bir runtime arka ucu tarafından destekleniyorsa
duyurur. ACP kullanılamıyorsa sistem istemi ve Plugin skills öğeleri agent'a ACP
yönlendirmesini öğretmemelidir.

## Yalnızca Codex Dağıtımları

Her gömülü agent turunun Codex kullandığını kanıtlamanız gerektiğinde Codex
harness'ini zorunlu kılın. Açık Plugin runtime'ları kapalı şekilde başarısız
olur ve hiçbir zaman sessizce PI üzerinden yeniden denenmez:

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

Ortam geçersiz kılması:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Codex zorunlu olduğunda OpenClaw, Codex Plugin devre dışıysa, uygulama sunucusu
çok eskiyse veya uygulama sunucusu başlatılamıyorsa erken başarısız olur.

## Agent Başına Codex

Varsayılan agent normal otomatik seçimi korurken bir agent'ı yalnızca Codex
yapabilirsiniz:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Agent'lar ve modeller arasında geçiş yapmak için normal oturum komutlarını
kullanın. `/new` yeni bir OpenClaw oturumu oluşturur ve Codex harness'i
gerektiğinde yan uygulama sunucusu ileti dizisini oluşturur veya sürdürür.
`/reset`, o ileti dizisi için OpenClaw oturum bağlamasını temizler ve sonraki
turun harness'i mevcut yapılandırmadan yeniden çözümlemesini sağlar.

## Model Keşfi

Varsayılan olarak Codex Plugin, kullanılabilir modelleri uygulama sunucusuna
sorar. Keşif başarısız olursa veya zaman aşımına uğrarsa şu modeller için
paketle gelen yedek kataloğu kullanır:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Keşfi `plugins.entries.codex.config.discovery` altında ayarlayabilirsiniz:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Başlatmanın Codex'i yoklamamasını ve yedek kataloğa bağlı kalmasını istediğinizde
keşfi devre dışı bırakın:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Uygulama Sunucusu Bağlantısı ve Politikası

Varsayılan olarak Plugin, OpenClaw'ın yönetilen Codex ikilisini yerel olarak
şununla başlatır:

```bash
codex app-server --listen stdio://
```

Yönetilen ikili, `codex` Plugin paketiyle birlikte gönderilir. Bu, uygulama
sunucusu sürümünü yerelde kurulu olan ayrı Codex CLI hangisi olursa olsun ona
değil, paketle gelen Plugin'e bağlı tutar. `appServer.command` değerini yalnızca
bilerek farklı bir yürütülebilir dosya çalıştırmak istediğinizde ayarlayın.

Varsayılan olarak OpenClaw, yerel Codex harness oturumlarını YOLO modunda
başlatır: `approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Bu, otonom Heartbeat'ler için kullanılan
güvenilir yerel operatör duruşudur: Codex, yanıtlayacak kimse olmadığında yerel
onay istemlerinde durmadan kabuk ve ağ araçlarını kullanabilir.

Codex koruyucu incelemeli onaylara geçmek için `appServer.mode:
"guardian"` ayarlayın:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Guardian modu Codex'in yerel otomatik inceleme onay yolunu kullanır. Codex
sandbox dışına çıkmayı, çalışma alanı dışına yazmayı veya ağ erişimi gibi
izinler eklemeyi istediğinde, Codex bu onay isteğini bir insan istemi yerine
yerel inceleyiciye yönlendirir. İnceleyici Codex'in risk çerçevesini uygular ve
belirli isteği onaylar veya reddeder. YOLO modundan daha fazla güvenlik
önlemi istediğiniz ama yine de gözetimsiz agent'ların ilerlemesi gerektiğinde
Guardian kullanın.

`guardian` ön ayarı `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` ve `sandbox: "workspace-write"` değerlerine
genişler. Tekil politika alanları yine de `mode` değerini geçersiz kılar; bu
sayede ileri düzey dağıtımlar ön ayarı açık seçimlerle karıştırabilir. Eski
`guardian_subagent` inceleyici değeri uyumluluk takma adı olarak hâlâ kabul
edilir, ancak yeni yapılandırmalar `auto_review` kullanmalıdır.

Zaten çalışan bir uygulama sunucusu için WebSocket taşımasını kullanın:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Stdio uygulama sunucusu başlatmaları varsayılan olarak OpenClaw'ın süreç
ortamını devralır, ancak OpenClaw Codex uygulama sunucusu hesap köprüsünün
sahibidir ve hem `CODEX_HOME` hem de `HOME` değerlerini o agent'ın OpenClaw
durumu altındaki agent başına dizinlere ayarlar. Codex'in kendi skill yükleyicisi
`$CODEX_HOME/skills` ve `$HOME/.agents/skills` değerlerini okur; bu yüzden iki
değer de yerel uygulama sunucusu başlatmaları için yalıtılır. Bu, Codex'e özgü
skills öğelerini, plugins öğelerini, yapılandırmayı, hesapları ve ileti dizisi
durumunu operatörün kişisel Codex CLI ana dizininden sızdırmak yerine OpenClaw
agent kapsamında tutar.

OpenClaw plugins öğeleri ve OpenClaw skill anlık görüntüleri yine OpenClaw'ın
kendi Plugin kayıt defteri ve skill yükleyicisi üzerinden akar. Kişisel Codex
CLI varlıkları akmaz. Bir OpenClaw agent'ın parçası olması gereken kullanışlı
Codex CLI skills veya plugins öğeleriniz varsa bunları açıkça envantere alın:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex taşıma sağlayıcısı skills öğelerini geçerli OpenClaw agent çalışma alanına
kopyalar. Codex yerel plugins öğeleri, hook'ları ve yapılandırma dosyaları
otomatik olarak etkinleştirilmek yerine manuel inceleme için raporlanır veya
arşivlenir; çünkü bunlar komut çalıştırabilir, MCP sunucuları açığa çıkarabilir
veya kimlik bilgileri taşıyabilir.

Kimlik doğrulaması şu sırayla seçilir:

1. Agent için açık bir OpenClaw Codex kimlik doğrulama profili.
2. Uygulama sunucusunun o agent'ın Codex ana dizinindeki mevcut hesabı.
3. Yalnızca yerel stdio uygulama sunucusu başlatmaları için, uygulama sunucusu hesabı yoksa ve OpenAI kimlik doğrulaması hâlâ gerekiyorsa önce `CODEX_API_KEY`, ardından
   `OPENAI_API_KEY`.

OpenClaw, ChatGPT aboneliği tarzında bir Codex kimlik doğrulama profili gördüğünde, başlatılan Codex alt sürecinden
`CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini kaldırır. Bu, Gateway düzeyi API anahtarlarını embeddings veya doğrudan OpenAI modelleri için kullanılabilir tutarken, yerel Codex app-server turlarının yanlışlıkla API üzerinden ücretlendirilmesini engeller.
Açık Codex API anahtarı profilleri ve yerel stdio env-key yedeği, devralınan alt süreç env yerine app-server oturum açmayı kullanır. WebSocket app-server bağlantıları Gateway env API anahtarı yedeğini almaz; açık bir kimlik doğrulama profili veya uzak app-server'ın kendi hesabını kullanın.

Bir dağıtım ek ortam yalıtımı gerektiriyorsa, bu değişkenleri
`appServer.clearEnv` içine ekleyin:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` yalnızca başlatılan Codex app-server alt sürecini etkiler.

Codex dinamik araçları varsayılan olarak `native-first` profilini kullanır. Bu modda,
OpenClaw, Codex'in yerel çalışma alanı işlemlerini yineleyen dinamik araçları sunmaz: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` ve
`update_plan`. Mesajlaşma, oturumlar, medya,
cron, tarayıcı, düğümler, gateway, `heartbeat_respond` ve `web_search` gibi OpenClaw entegrasyon araçları kullanılabilir kalır.

Desteklenen üst düzey Codex plugin alanları:

| Alan                       | Varsayılan       | Anlam                                                                                     |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Tam OpenClaw dinamik araç setini Codex app-server'a sunmak için `"openclaw-compat"` kullanın. |
| `codexDynamicToolsExclude` | `[]`             | Codex app-server turlarından çıkarılacak ek OpenClaw dinamik araç adları.                 |

Desteklenen `appServer` alanları:

| Alan                | Varsayılan                               | Anlam                                                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` Codex'i başlatır; `"websocket"` `url` değerine bağlanır.                                                                                                                                                                    |
| `command`           | yönetilen Codex ikilisi                  | stdio aktarımı için yürütülebilir dosya. Yönetilen ikiliyi kullanmak için ayarsız bırakın; yalnızca açık bir geçersiz kılma için ayarlayın.                                                                                          |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio aktarımı için bağımsız değişkenler.                                                                                                                                                                                            |
| `url`               | ayarsız                                  | WebSocket app-server URL'si.                                                                                                                                                                                                         |
| `authToken`         | ayarsız                                  | WebSocket aktarımı için Bearer token.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | Ek WebSocket başlıkları.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | OpenClaw devralınan ortamını oluşturduktan sonra başlatılan stdio app-server sürecinden kaldırılan ek ortam değişkeni adları. `CODEX_HOME` ve `HOME`, yerel başlatmalarda OpenClaw'ın ajan başına Codex yalıtımı için ayrılmıştır. |
| `requestTimeoutMs`  | `60000`                                  | app-server control-plane çağrıları için zaman aşımı.                                                                                                                                                                                 |
| `mode`              | `"yolo"`                                 | YOLO veya guardian tarafından incelenen yürütme için ön ayar.                                                                                                                                                                        |
| `approvalPolicy`    | `"never"`                                | Thread başlatma/sürdürme/tur işlemine gönderilen yerel Codex onay politikası.                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | Thread başlatma/sürdürme işlemine gönderilen yerel Codex sandbox modu.                                                                                                                                                              |
| `approvalsReviewer` | `"user"`                                 | Codex'in yerel onay istemlerini incelemesine izin vermek için `"auto_review"` kullanın. `guardian_subagent` eski bir takma ad olarak kalır.                                                                                          |
| `serviceTier`       | ayarsız                                  | İsteğe bağlı Codex app-server hizmet katmanı: `"fast"`, `"flex"` veya `null`. Geçersiz eski değerler yok sayılır.                                                                                                                    |

OpenClaw'a ait dinamik araç çağrıları
`appServer.requestTimeoutMs` değerinden bağımsız olarak sınırlandırılır: Her Codex `item/tool/call` isteği 30 saniye içinde bir OpenClaw yanıtı almalıdır. Zaman aşımında OpenClaw, desteklendiği yerlerde araç sinyalini iptal eder ve Codex'e başarısız bir dinamik araç yanıtı döndürür; böylece tur, oturumu `processing` durumunda bırakmak yerine devam edebilir.

OpenClaw, Codex tur kapsamlı bir app-server isteğine yanıt verdikten sonra, harness ayrıca Codex'in yerel turu `turn/completed` ile bitirmesini bekler. app-server bu yanıttan sonra 60 saniye sessiz kalırsa, OpenClaw elinden geldiğince Codex turunu keser, tanılama amaçlı bir zaman aşımı kaydeder ve OpenClaw oturum yolunu serbest bırakır; böylece takip sohbet mesajları eski bir yerel turun arkasında kuyruğa alınmaz.

Ortam geçersiz kılmaları yerel test için kullanılabilir kalır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`, `appServer.command` ayarsız olduğunda yönetilen ikiliyi atlar.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırıldı. Bunun yerine
`plugins.entries.codex.config.appServer.mode: "guardian"` kullanın veya tek seferlik yerel test için
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın. Yapılandırma, tekrarlanabilir dağıtımlar için tercih edilir çünkü plugin davranışını Codex harness kurulumunun geri kalanıyla aynı incelenen dosyada tutar.

## Bilgisayar kullanımı

Bilgisayar Kullanımı kendi kurulum kılavuzunda ele alınır:
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use).

Kısa versiyon: OpenClaw, masaüstü denetim uygulamasını vendörlemez veya masaüstü eylemlerini kendisi yürütmez. Codex app-server'ı hazırlar, `computer-use` MCP sunucusunun kullanılabilir olduğunu doğrular ve ardından Codex modu turları sırasında yerel MCP araç çağrılarını Codex'in işlemesine izin verir.

Codex marketplace akışı dışında doğrudan TryCua sürücü erişimi için
`cua-driver mcp` öğesini `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` ile kaydedin.
Codex'e ait Bilgisayar Kullanımı ile doğrudan MCP kaydı arasındaki ayrım için [Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use) bölümüne bakın.

En küçük yapılandırma:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
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

Kurulum komut yüzeyinden denetlenebilir veya yüklenebilir:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Bilgisayar Kullanımı macOS'a özeldir ve Codex MCP sunucusunun uygulamaları denetleyebilmesinden önce yerel işletim sistemi izinleri gerektirebilir. `computerUse.enabled` true ise ve MCP sunucusu kullanılamıyorsa, Codex modu turları yerel Bilgisayar Kullanımı araçları olmadan sessizce çalışmak yerine thread başlamadan önce başarısız olur. Marketplace seçenekleri, uzak katalog sınırları, durum nedenleri ve sorun giderme için
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use) bölümüne bakın.

`computerUse.autoInstall` true olduğunda, Codex henüz yerel bir marketplace keşfetmemişse OpenClaw standart paketli Codex Desktop marketplace'i
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` konumundan kaydedebilir. Mevcut oturumların eski bir PI veya Codex thread bağlamasını korumaması için runtime veya Bilgisayar Kullanımı yapılandırmasını değiştirdikten sonra `/new` veya `/reset` kullanın.

## Yaygın tarifler

Varsayılan stdio aktarımıyla yerel Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Yalnızca Codex harness doğrulaması:

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
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Guardian tarafından incelenen Codex onayları:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Açık başlıklara sahip uzak app-server:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

Model değiştirme OpenClaw denetiminde kalır. Bir OpenClaw oturumu mevcut bir Codex thread'ine bağlandığında, sonraki tur şu anda seçili
OpenAI modelini, sağlayıcıyı, onay politikasını, sandbox'ı ve hizmet katmanını app-server'a tekrar gönderir. `openai/gpt-5.5` modelinden `openai/gpt-5.2` modeline geçmek thread bağlamasını korur ancak Codex'ten yeni seçilen modelle devam etmesini ister.

## Codex komutu

Paketli plugin, `/codex` komutunu yetkilendirilmiş bir slash command olarak kaydeder. Geneldir ve OpenClaw metin komutlarını destekleyen herhangi bir kanalda çalışır.

Yaygın biçimler:

- `/codex status` canlı uygulama sunucusu bağlantısını, modelleri, hesabı, hız sınırlarını, MCP sunucularını ve skills öğelerini gösterir.
- `/codex models` canlı Codex uygulama sunucusu modellerini listeler.
- `/codex threads [filter]` son Codex iş parçacıklarını listeler.
- `/codex resume <thread-id>` geçerli OpenClaw oturumunu mevcut bir Codex iş parçacığına bağlar.
- `/codex compact` Codex uygulama sunucusundan bağlı iş parçacığını compact etmesini ister.
- `/codex review` bağlı iş parçacığı için Codex yerel incelemesini başlatır.
- `/codex diagnostics [note]` bağlı iş parçacığı için Codex tanılama geri bildirimi göndermeden önce sorar.
- `/codex computer-use status` yapılandırılmış Computer Use Plugin'ini ve MCP sunucusunu denetler.
- `/codex computer-use install` yapılandırılmış Computer Use Plugin'ini yükler ve MCP sunucularını yeniden yükler.
- `/codex account` hesap ve hız sınırı durumunu gösterir.
- `/codex mcp` Codex uygulama sunucusu MCP sunucusu durumunu listeler.
- `/codex skills` Codex uygulama sunucusu skills öğelerini listeler.

Codex bir kullanım sınırı hatası bildirdiğinde, Codex sağlamışsa OpenClaw sonraki
uygulama sunucusu sıfırlama zamanını ekler. Geçerli hesabı ve hız sınırı
pencerelerini incelemek için aynı konuşmada `/codex account` kullanın.

### Yaygın hata ayıklama iş akışı

Codex destekli bir aracı Telegram, Discord, Slack veya başka bir kanalda
beklenmeyen bir şey yaptığında, sorunun yaşandığı konuşmadan başlayın:

1. `/diagnostics bad tool choice after image upload` komutunu veya gördüğünüz şeyi
   açıklayan başka kısa bir notu çalıştırın.
2. Tanılama isteğini bir kez onaylayın. Onay, yerel Gateway tanılama zip dosyasını
   oluşturur ve oturum Codex donanımını kullandığı için ilgili Codex geri bildirim
   paketini de OpenAI sunucularına gönderir.
3. Tamamlanan tanılama yanıtını hata raporuna veya destek iş parçacığına kopyalayın.
   Bu yanıt yerel paket yolunu, gizlilik özetini, OpenClaw oturum kimliklerini,
   Codex iş parçacığı kimliklerini ve her Codex iş parçacığı için bir `Inspect locally` satırını içerir.
4. Çalıştırmayı kendiniz hata ayıklamak istiyorsanız, yazdırılan `Inspect locally`
   komutunu bir terminalde çalıştırın. Komut `codex resume <thread-id>` gibi görünür ve
   yerel Codex iş parçacığını açar; böylece konuşmayı inceleyebilir, yerelde sürdürebilir
   veya Codex'e belirli bir aracı ya da planı neden seçtiğini sorabilirsiniz.

`/codex diagnostics [note]` komutunu yalnızca tam OpenClaw Gateway tanılama paketi
olmadan, o anda bağlı iş parçacığı için Codex geri bildirim yüklemesini özellikle
istediğinizde kullanın. Çoğu destek raporu için `/diagnostics [note]` daha iyi
başlangıç noktasıdır çünkü yerel Gateway durumunu ve Codex iş parçacığı kimliklerini
tek bir yanıtta birbirine bağlar. Tam gizlilik modeli ve grup sohbeti davranışı için
[Tanılama dışa aktarma](/tr/gateway/diagnostics) bölümüne bakın.

Çekirdek OpenClaw ayrıca genel Gateway tanılama komutu olarak yalnızca sahiplerin
kullanabildiği `/diagnostics [note]` komutunu sunar. Onay istemi hassas veri
önsözünü gösterir, [Tanılama Dışa Aktarma](/tr/gateway/diagnostics) bağlantısı verir ve
her seferinde açık yürütme onayıyla `openclaw gateway diagnostics export --json`
isteğinde bulunur. Tanılamayı tümüne izin ver kuralıyla onaylamayın. Onaydan sonra
OpenClaw, yerel paket yolu ve bildirim özetiyle yapıştırılabilir bir rapor gönderir.
Etkin OpenClaw oturumu Codex donanımını kullanıyorsa, aynı onay ilgili Codex geri
bildirim paketlerinin OpenAI sunucularına gönderilmesine de yetki verir. Onay istemi
Codex geri bildiriminin gönderileceğini söyler, ancak onaydan önce Codex oturum veya
iş parçacığı kimliklerini listelemez.

`/diagnostics` bir grup sohbetinde bir sahip tarafından çağrılırsa, OpenClaw paylaşılan
kanalı temiz tutar: grup yalnızca kısa bir bildirim alırken tanılama önsözü, onay
istemleri ve Codex oturum/iş parçacığı kimlikleri özel onay rotası üzerinden sahibe
gönderilir. Özel sahip rotası yoksa, OpenClaw grup isteğini reddeder ve sahibin bunu
DM üzerinden çalıştırmasını ister.

Onaylanan Codex yüklemesi, Codex uygulama sunucusu `feedback/upload` çağrısını yapar ve
uygulama sunucusundan mümkün olduğunda listelenen her iş parçacığı ve oluşturulan Codex
alt iş parçacıkları için günlükleri eklemesini ister. Yükleme, Codex'in normal geri
bildirim yolu üzerinden OpenAI sunucularına gider; bu uygulama sunucusunda Codex geri
bildirimi devre dışıysa komut uygulama sunucusu hatasını döndürür. Tamamlanan tanılama
yanıtı gönderilen iş parçacıkları için kanalları, OpenClaw oturum kimliklerini, Codex
iş parçacığı kimliklerini ve yerel `codex resume <thread-id>` komutlarını listeler.
Onayı reddeder veya yok sayarsanız, OpenClaw bu Codex kimliklerini yazdırmaz. Bu yükleme
yerel Gateway tanılama dışa aktarımının yerine geçmez.

`/codex resume`, donanımın normal dönüşler için kullandığı aynı yardımcı bağlama dosyasını
yazar. Sonraki mesajda OpenClaw bu Codex iş parçacığını sürdürür, o anda seçili OpenClaw
modelini uygulama sunucusuna geçirir ve genişletilmiş geçmişi etkin tutar.

### CLI üzerinden bir Codex iş parçacığını inceleme

Kötü bir Codex çalıştırmasını anlamanın en hızlı yolu çoğu zaman yerel Codex iş parçacığını
doğrudan açmaktır:

```sh
codex resume <thread-id>
```

Bir kanal konuşmasında hata fark ettiğinizde ve sorunlu Codex oturumunu incelemek, yerelde
sürdürmek veya Codex'e belirli bir araç ya da akıl yürütme seçimini neden yaptığını sormak
istediğinizde bunu kullanın. En kolay yol genellikle önce `/diagnostics [note]` çalıştırmaktır:
onayladıktan sonra tamamlanan rapor her Codex iş parçacığını listeler ve örneğin
`codex resume <thread-id>` biçiminde bir `Inspect locally` komutu yazdırır. Bu komutu doğrudan
bir terminale kopyalayabilirsiniz.

Geçerli sohbet için `/codex binding` komutundan veya son Codex uygulama sunucusu iş parçacıkları
için `/codex threads [filter]` komutundan da bir iş parçacığı kimliği alabilir, ardından aynı
`codex resume` komutunu kabuğunuzda çalıştırabilirsiniz.

Komut yüzeyi Codex uygulama sunucusu `0.125.0` veya daha yenisini gerektirir. Gelecekteki veya
özel bir uygulama sunucusu ilgili JSON-RPC yöntemini sunmuyorsa, ayrı denetim yöntemleri
`unsupported by this Codex app-server` olarak bildirilir.

## Hook sınırları

Codex donanımının üç hook katmanı vardır:

| Katman                                | Sahip                    | Amaç                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin hook'ları             | OpenClaw                 | PI ve Codex donanımları arasında ürün/Plugin uyumluluğu.            |
| Codex uygulama sunucusu uzantı ara katmanı | OpenClaw paketli Plugin'leri | OpenClaw dinamik araçları çevresinde dönüş başına bağdaştırıcı davranışı. |
| Codex yerel hook'ları                 | Codex                    | Codex yapılandırmasından düşük düzey Codex yaşam döngüsü ve yerel araç ilkesi. |

OpenClaw, OpenClaw Plugin davranışını yönlendirmek için proje veya genel Codex `hooks.json`
dosyalarını kullanmaz. Desteklenen yerel araç ve izin köprüsü için OpenClaw, `PreToolUse`,
`PostToolUse`, `PermissionRequest` ve `Stop` için iş parçacığı başına Codex yapılandırması
enjekte eder. `SessionStart` ve `UserPromptSubmit` gibi diğer Codex hook'ları Codex düzeyinde
denetimler olarak kalır; v1 sözleşmesinde OpenClaw Plugin hook'ları olarak sunulmazlar.

OpenClaw dinamik araçları için OpenClaw, Codex çağrıyı istedikten sonra aracı yürütür; bu yüzden
OpenClaw, donanım bağdaştırıcısında sahibi olduğu Plugin ve ara katman davranışını tetikler.
Codex'e özgü yerel araçlar için kanonik araç kaydının sahibi Codex'tir. OpenClaw seçili olayları
yansıtabilir, ancak Codex bu işlemi uygulama sunucusu veya yerel hook geri çağrıları üzerinden
sunmadıkça yerel Codex iş parçacığını yeniden yazamaz.

Compaction ve LLM yaşam döngüsü projeksiyonları yerel Codex hook komutlarından değil, Codex
uygulama sunucusu bildirimlerinden ve OpenClaw bağdaştırıcı durumundan gelir. OpenClaw'ın
`before_compaction`, `after_compaction`, `llm_input` ve `llm_output` olayları bağdaştırıcı
düzeyi gözlemlerdir; Codex'in dahili isteğinin veya Compaction yüklerinin bayt bayt yakalamaları değildir.

Codex yerel `hook/started` ve `hook/completed` uygulama sunucusu bildirimleri, rota ve hata
ayıklama için `codex_app_server.hook` aracı olayları olarak projekte edilir. Bunlar OpenClaw
Plugin hook'larını çağırmaz.

## V1 destek sözleşmesi

Codex modu, altında farklı bir model çağrısı olan PI değildir. Codex yerel model döngüsünün daha
fazlasına sahiptir ve OpenClaw kendi Plugin ve oturum yüzeylerini bu sınırın çevresinde uyarlar.

Codex çalışma zamanı v1'de desteklenenler:

| Yüzey                                         | Destek                                  | Neden                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex üzerinden OpenAI model döngüsü          | Desteklenir                             | Codex uygulama sunucusu OpenAI dönüşüne, yerel iş parçacığı sürdürmeye ve yerel araç devamına sahiptir.                                                                                                |
| OpenClaw kanal yönlendirme ve teslim          | Desteklenir                             | Telegram, Discord, Slack, WhatsApp, iMessage ve diğer kanallar model çalışma zamanının dışında kalır.                                                                                                  |
| OpenClaw dinamik araçları                     | Desteklenir                             | Codex bu araçları OpenClaw'dan yürütmesini ister, bu yüzden OpenClaw yürütme yolunda kalır.                                                                                                            |
| İstem ve bağlam Plugin'leri                   | Desteklenir                             | OpenClaw istem katmanları oluşturur ve iş parçacığını başlatmadan veya sürdürmeden önce bağlamı Codex dönüşüne projekte eder.                                                                           |
| Bağlam motoru yaşam döngüsü                   | Desteklenir                             | Birleştirme, alma veya dönüş sonrası bakım ve bağlam motoru Compaction koordinasyonu Codex dönüşleri için çalışır.                                                                                     |
| Dinamik araç hook'ları                        | Desteklenir                             | `before_tool_call`, `after_tool_call` ve araç sonucu ara katmanı OpenClaw'ın sahibi olduğu dinamik araçlar etrafında çalışır.                                                                          |
| Yaşam döngüsü hook'ları                       | Bağdaştırıcı gözlemleri olarak desteklenir | `llm_input`, `llm_output`, `agent_end`, `before_compaction` ve `after_compaction` dürüst Codex modu yükleriyle tetiklenir.                                                                             |
| Son yanıt revizyon kapısı                     | Yerel hook aktarması üzerinden desteklenir | Codex `Stop`, `before_agent_finalize` öğesine aktarılır; `revise`, sonlandırmadan önce Codex'ten bir model geçişi daha ister.                                                                          |
| Yerel kabuk, yama ve MCP engelleme veya gözlemleme | Yerel hook aktarması üzerinden desteklenir | Codex `PreToolUse` ve `PostToolUse`, Codex uygulama sunucusu `0.125.0` veya daha yenisindeki MCP yükleri dahil olmak üzere kesinleşmiş yerel araç yüzeyleri için aktarılır. Engelleme desteklenir; argüman yeniden yazma desteklenmez. |
| Yerel izin ilkesi                             | Yerel hook aktarması üzerinden desteklenir | Codex `PermissionRequest`, çalışma zamanı bunu sunduğunda OpenClaw ilkesi üzerinden yönlendirilebilir. OpenClaw karar döndürmezse Codex normal koruyucu veya kullanıcı onayı yolundan devam eder.       |
| Uygulama sunucusu rota yakalama               | Desteklenir                             | OpenClaw uygulama sunucusuna gönderdiği isteği ve aldığı uygulama sunucusu bildirimlerini kaydeder.                                                                                                    |

Codex çalışma zamanı v1'de desteklenmeyenler:

| Yüzey                                             | V1 sınırı                                                                                                                                     | Gelecek yol                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Yerel araç argümanı mutasyonu                       | Codex yerel araç öncesi hook'ları engelleyebilir, ancak OpenClaw Codex'e özgü araç argümanlarını yeniden yazmaz.                                               | Yedek araç girdisi için Codex hook/şema desteği gerekir.                            |
| Düzenlenebilir Codex'e özgü yerel transcript geçmişi            | Codex kanonik yerel thread geçmişinin sahibidir. OpenClaw bir yansımaya sahiptir ve gelecekteki bağlamı yansıtabilir, ancak desteklenmeyen dahili yapıları değiştirmemelidir. | Yerel thread cerrahisi gerekiyorsa açık Codex uygulama sunucusu API'leri ekleyin.                    |
| Codex'e özgü yerel araç kayıtları için `tool_result_persist` | Bu hook, Codex'e özgü yerel araç kayıtlarını değil, OpenClaw'a ait transcript yazımlarını dönüştürür.                                                           | Dönüştürülmüş kayıtları yansıtabilir, ancak kanonik yeniden yazma Codex desteği gerektirir.              |
| Zengin yerel compaction metadata'sı                     | OpenClaw compaction başlangıcını ve tamamlanmasını gözlemler, ancak kararlı bir tutulan/bırakılan listesi, token deltası veya özet payload'u almaz.            | Daha zengin Codex compaction olayları gerekir.                                                     |
| Compaction müdahalesi                             | Mevcut OpenClaw compaction hook'ları Codex modunda bildirim düzeyindedir.                                                                         | Plugin'lerin yerel compaction'ı veto etmesi veya yeniden yazması gerekiyorsa Codex compaction öncesi/sonrası hook'ları ekleyin. |
| Model API isteğinin bayt bayt yakalanması             | OpenClaw uygulama sunucusu isteklerini ve bildirimlerini yakalayabilir, ancak Codex core son OpenAI API isteğini dahili olarak oluşturur.                      | Codex model isteği izleme olayı veya hata ayıklama API'si gerekir.                                   |

## Araçlar, medya ve compaction

Codex harness yalnızca düşük düzeyli gömülü agent yürütücüsünü değiştirir.

OpenClaw yine araç listesini oluşturur ve harness'ten dinamik araç sonuçlarını
alır. Metin, görseller, video, müzik, TTS, onaylar ve mesajlaşma aracı çıktısı
normal OpenClaw teslim yolundan geçmeye devam eder.

Yerel hook relay kasıtlı olarak geneldir, ancak v1 destek sözleşmesi
OpenClaw'ın test ettiği Codex'e özgü yerel araç ve izin yollarıyla sınırlıdır. Codex
runtime'ında buna shell, patch ve MCP `PreToolUse`,
`PostToolUse` ve `PermissionRequest` payload'ları dahildir. Runtime sözleşmesi
adını verene kadar gelecekteki her Codex hook olayının bir OpenClaw Plugin yüzeyi
olduğunu varsaymayın.

`PermissionRequest` için OpenClaw yalnızca ilke karar verdiğinde açık allow veya deny
kararları döndürür. Kararsız sonuç allow değildir. Codex bunu hook kararı yok
olarak ele alır ve kendi koruyucu veya kullanıcı onayı yoluna düşer.

Codex MCP araç onayı elicitation'ları, Codex `_meta.codex_approval_kind` değerini
`"mcp_tool_call"` olarak işaretlediğinde OpenClaw'ın Plugin onay akışına yönlendirilir.
Codex `request_user_input` istemleri kaynak sohbete geri gönderilir ve sonraki
kuyruğa alınmış takip mesajı, ekstra bağlam olarak yönlendirilmek yerine bu yerel
sunucu isteğini yanıtlar. Diğer MCP elicitation istekleri yine kapalı şekilde başarısız olur.

Etkin çalışma kuyruğu yönlendirmesi Codex uygulama sunucusu `turn/steer` üzerine eşlenir.
Varsayılan `messages.queue.mode: "steer"` ile OpenClaw kuyruğa alınmış sohbet mesajlarını
yapılandırılmış sessiz pencere boyunca toplar ve bunları geliş sırasıyla tek bir
`turn/steer` isteği olarak gönderir. Eski `queue` modu ayrı `turn/steer` istekleri gönderir.
Codex review ve manuel compaction turn'leri aynı turn yönlendirmesini reddedebilir; bu durumda
seçilen mod fallback'e izin verdiğinde OpenClaw followup kuyruğunu kullanır. Bkz.
[Yönlendirme kuyruğu](/tr/concepts/queue-steering).

Seçilen model Codex harness kullandığında, yerel thread compaction'ı
Codex uygulama sunucusuna devredilir. OpenClaw kanal geçmişi, arama, `/new`,
`/reset` ve gelecekteki model veya harness değişimi için bir transcript yansıması tutar.
Yansıma, uygulama sunucusu yaydığında kullanıcı istemini, son assistant metnini ve hafif Codex
akıl yürütme veya plan kayıtlarını içerir. Bugün OpenClaw yalnızca yerel compaction
başlangıç ve tamamlanma sinyallerini kaydeder. Henüz insan tarafından okunabilir bir
compaction özeti veya Codex'in compaction sonrasında hangi girdileri tuttuğuna dair denetlenebilir
bir liste sunmaz.

Codex kanonik yerel thread'in sahibi olduğundan `tool_result_persist` şu anda
Codex'e özgü yerel araç sonuç kayıtlarını yeniden yazmaz. Yalnızca OpenClaw,
OpenClaw'a ait bir oturum transcript araç sonucu yazarken uygulanır.

Medya üretimi PI gerektirmez. Görsel, video, müzik, PDF, TTS ve medya anlama
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` ve
`messages.tts` gibi eşleşen provider/model ayarlarını kullanmaya devam eder.

## Sorun giderme

**Codex normal bir `/model` provider olarak görünmüyor:** bu yeni yapılandırmalar için
beklenen bir durumdur. `agentRuntime.id: "codex"` değerine sahip bir `openai/gpt-*` modeli
(veya eski bir `codex/*` ref'i) seçin, `plugins.entries.codex.enabled` etkinleştirin ve
`plugins.allow` değerinin `codex` öğesini dışlayıp dışlamadığını kontrol edin.

**OpenClaw Codex yerine PI kullanıyor:** `agentRuntime.id: "auto"`, çalışmayı hiçbir Codex harness
üstlenmediğinde uyumluluk backend'i olarak PI kullanmaya devam edebilir. Test sırasında Codex seçimini
zorlamak için `agentRuntime.id: "codex"` ayarlayın. Zorlanmış Codex runtime, PI'a fallback yapmak yerine
başarısız olur. Codex uygulama sunucusu seçildikten sonra, hataları doğrudan görünür.

**Uygulama sunucusu reddediliyor:** Codex'i, uygulama sunucusu handshake'i
`0.125.0` veya daha yeni sürümü raporlayacak şekilde yükseltin. Aynı sürüm prerelease'leri veya
`0.125.0-alpha.2` ya da `0.125.0+custom` gibi build sonekli sürümler reddedilir çünkü
kararlı `0.125.0` protokol tabanı OpenClaw'ın test ettiği düzeydir.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs` değerini düşürün
veya keşfi devre dışı bırakın.

**WebSocket aktarımı hemen başarısız oluyor:** `appServer.url`, `authToken`
ve uzak uygulama sunucusunun aynı Codex uygulama sunucusu protokol sürümünü konuştuğunu kontrol edin.

**Codex olmayan bir model PI kullanıyor:** o agent için `agentRuntime.id: "codex"` zorlamadıysanız
veya eski bir `codex/*` ref'i seçmediyseniz bu beklenen bir durumdur. Düz `openai/gpt-*` ve diğer
provider ref'leri `auto` modunda normal provider yolunda kalır. `agentRuntime.id: "codex"` zorlarsanız,
o agent için her gömülü turn Codex destekli bir OpenAI modeli olmalıdır.

**Computer Use kurulu ama araçlar çalışmıyor:** yeni bir oturumdan
`/codex computer-use status` komutunu kontrol edin. Bir araç
`Native hook relay unavailable` rapor ederse `/new` veya `/reset` kullanın; devam ederse,
eski yerel hook kayıtlarını temizlemek için gateway'i yeniden başlatın. `computer-use.list_apps`
zaman aşımına uğrarsa Codex Computer Use veya Codex Desktop'ı yeniden başlatıp tekrar deneyin.

## İlgili

- [Agent harness Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Agent runtime'ları](/tr/concepts/agent-runtimes)
- [Model provider'ları](/tr/concepts/model-providers)
- [OpenAI provider](/tr/providers/openai)
- [Durum](/tr/cli/status)
- [Plugin hook'ları](/tr/plugins/hooks)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [Test etme](/tr/help/testing-live#live-codex-app-server-harness-smoke)
