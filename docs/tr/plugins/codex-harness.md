---
read_when:
    - Birlikte gelen Codex app-server düzeneğini kullanmak istiyorsunuz
    - Codex harness yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex dağıtımlarının Pi'ye geri dönmek yerine başarısız olmasını istiyorsunuz
summary: OpenClaw gömülü ajan turlarını paketle birlikte gelen Codex app-server çalışma düzeneği üzerinden çalıştırın
title: Codex çalıştırma altyapısı
x-i18n:
    generated_at: "2026-05-05T01:48:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76302351e7e162e858dd6e3cffca84b3fd54497dd060104da9f90fe4c1a33f9b
    source_path: plugins/codex-harness.md
    workflow: 16
---

Birlikte gelen `codex` Plugin’i, OpenClaw’ın yerleşik PI harness yerine
Codex app-server üzerinden gömülü ajan turlarını çalıştırmasını sağlar.

Düşük seviyeli ajan oturumunu Codex’in yönetmesini istediğinizde bunu kullanın:
model keşfi, yerel iş parçacığına devam etme, yerel Compaction ve app-server
yürütmesi. OpenClaw sohbet kanallarını, oturum dosyalarını, model seçimini,
araçları, onayları, medya teslimini ve görünür döküm aynasını yönetmeye devam
eder.

Bir kaynak sohbet turu Codex harness üzerinden çalıştığında, dağıtım
`messages.visibleReplies` değerini açıkça yapılandırmamışsa görünür yanıtlar
varsayılan olarak OpenClaw `message` aracını kullanır. Ajan Codex turunu yine de
özel olarak bitirebilir; yalnızca `message(action="send")` çağırdığında kanala
gönderi yapar. Doğrudan sohbet son yanıtlarını eski otomatik teslim yolunda
tutmak için `messages.visibleReplies: "automatic"` ayarlayın.

Codex Heartbeat turları da varsayılan olarak `heartbeat_respond` aracını alır;
böylece ajan, bu kontrol akışını son metne kodlamadan uyanmanın sessiz mi
kalması yoksa bildirim mi göndermesi gerektiğini kaydedebilir.

Heartbeat’e özgü inisiyatif rehberliği, Heartbeat turunun kendisinde bir Codex
iş birliği modu geliştirici talimatı olarak gönderilir. Olağan sohbet turları,
normal çalışma zamanı istemlerinde Heartbeat felsefesini taşımak yerine Codex
Default modunu geri yükler.

Kendinizi yönlendirmeye çalışıyorsanız
[Ajan çalışma zamanları](/tr/concepts/agent-runtimes) ile başlayın. Kısa sürüm
şudur: `openai/gpt-5.5` model referansıdır, `codex` çalışma zamanıdır ve
Telegram, Discord, Slack veya başka bir kanal iletişim yüzeyi olarak kalır.

## Hızlı yapılandırma

"OpenClaw içinde Codex" isteyen çoğu kullanıcı şu yolu ister: bir ChatGPT/Codex
aboneliğiyle oturum açın, ardından gömülü ajan turlarını yerel Codex app-server
çalışma zamanı üzerinden çalıştırın. Model referansı yine `openai/gpt-*` olarak
kanonik kalır; abonelik kimlik doğrulaması bir `openai-codex/*` model önekinden
değil, Codex hesabından/profilinden gelir.

Henüz yapmadıysanız önce Codex OAuth ile oturum açın:

```bash
openclaw models auth login --provider openai-codex
```

Ardından birlikte gelen `codex` Plugin’ini etkinleştirin ve Codex çalışma
zamanını zorunlu kılın:

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

Yerel Codex çalışma zamanını kastettiğinizde `openai-codex/gpt-*` kullanmayın.
Bu önek açık "PI üzerinden Codex OAuth" yoludur. Yapılandırma değişiklikleri yeni
veya sıfırlanmış oturumlara uygulanır; mevcut oturumlar kayıtlı çalışma
zamanlarını korur.

## Bu Plugin neleri değiştirir

Birlikte gelen `codex` Plugin’i birkaç ayrı yetenek sağlar:

| Yetenek                           | Nasıl kullanırsınız                                 | Ne yapar                                                                      |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Yerel gömülü çalışma zamanı       | `agentRuntime.id: "codex"`                          | OpenClaw gömülü ajan turlarını Codex app-server üzerinden çalıştırır.         |
| Yerel sohbet denetimi komutları   | `/codex bind`, `/codex resume`, `/codex steer`, ... | Bir mesajlaşma konuşmasından Codex app-server iş parçacıklarını bağlar ve denetler. |
| Codex app-server sağlayıcısı/kataloğu | `codex` iç işleyişi, harness üzerinden sunulur      | Çalışma zamanının app-server modellerini keşfetmesini ve doğrulamasını sağlar. |
| Codex medya anlama yolu           | `codex/*` görüntü modeli uyumluluk yolları          | Desteklenen görüntü anlama modelleri için sınırlı Codex app-server turları çalıştırır. |
| Yerel hook aktarıcısı             | Codex’e yerel olaylar etrafındaki Plugin hook’ları  | OpenClaw’ın desteklenen Codex’e yerel araç/sonlandırma olaylarını gözlemlemesini/engellemesini sağlar. |

Plugin’i etkinleştirmek bu yetenekleri kullanılabilir hale getirir. Şunları
**yapmaz**:

- her OpenAI modeli için Codex kullanmaya başlamaz
- `openai-codex/*` model referanslarını yerel çalışma zamanına dönüştürmez
- ACP/acpx’i varsayılan Codex yolu yapmaz
- zaten bir PI çalışma zamanı kaydetmiş mevcut oturumları anında değiştirmez
- OpenClaw kanal teslimini, oturum dosyalarını, kimlik doğrulama profili
  depolamasını veya ileti yönlendirmesini değiştirmez

Aynı Plugin, yerel `/codex` sohbet denetimi komut yüzeyinin de sahibidir. Plugin
etkinse ve kullanıcı Codex iş parçacıklarını sohbetten bağlamayı, devam
ettirmeyi, yönlendirmeyi, durdurmayı veya incelemeyi isterse ajanlar ACP yerine
`/codex ...` tercih etmelidir. ACP, kullanıcı ACP/acpx istediğinde veya ACP
Codex bağdaştırıcısını test ettiğinde açık yedek olarak kalır.

Yerel Codex turları, public uyumluluk katmanı olarak OpenClaw Plugin hook’larını
korur. Bunlar süreç içi OpenClaw hook’larıdır, Codex `hooks.json` komut
hook’ları değildir:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` aynalanmış döküm kayıtları için
- Codex `Stop` aktarıcısı üzerinden `before_agent_finalize`
- `agent_end`

Plugin’ler ayrıca, OpenClaw aracı yürüttükten sonra ve sonuç Codex’e
döndürülmeden önce OpenClaw dinamik araç sonuçlarını yeniden yazmak için çalışma
zamanından bağımsız araç sonucu ara katmanı kaydedebilir. Bu, OpenClaw’a ait
döküm araç sonucu yazımlarını dönüştüren public `tool_result_persist` Plugin
hook’undan ayrıdır.

Plugin hook semantiklerinin kendisi için bkz. [Plugin hook’ları](/tr/plugins/hooks)
ve [Plugin koruma davranışı](/tr/tools/plugin).

Harness varsayılan olarak kapalıdır. Yeni yapılandırmalar OpenAI model
referanslarını `openai/gpt-*` olarak kanonik tutmalı ve yerel app-server
yürütmesi istediklerinde açıkça `agentRuntime.id: "codex"` veya
`OPENCLAW_AGENT_RUNTIME=codex` zorlamalıdır. Eski `codex/*` model referansları
uyumluluk için harness’i hâlâ otomatik seçer, ancak çalışma zamanı destekli eski
sağlayıcı önekleri normal model/sağlayıcı seçenekleri olarak gösterilmez.

`codex` Plugin’i etkinse ancak birincil model hâlâ `openai-codex/*` ise
`openclaw doctor` rotayı değiştirmek yerine uyarır. Bu bilinçlidir:
`openai-codex/*` PI Codex OAuth/abonelik yolu olarak kalır ve yerel app-server
yürütmesi açık bir çalışma zamanı seçimi olmaya devam eder.

## Rota haritası

Yapılandırmayı değiştirmeden önce bu tabloyu kullanın:

| İstenen davranış                                  | Model referansı          | Çalışma zamanı yapılandırması       | Kimlik doğrulama/profil rotası | Beklenen durum etiketi         |
| ------------------------------------------------- | ------------------------ | ----------------------------------- | ------------------------------ | ------------------------------ |
| Yerel Codex çalışma zamanıyla ChatGPT/Codex aboneliği | `openai/gpt-*`           | `agentRuntime.id: "codex"`          | Codex OAuth veya Codex hesabı  | `Runtime: OpenAI Codex`        |
| Normal OpenClaw çalıştırıcısı üzerinden OpenAI API | `openai/gpt-*`           | atlanmış veya `runtime: "pi"`       | OpenAI API anahtarı            | `Runtime: OpenClaw Pi Default` |
| PI üzerinden ChatGPT/Codex aboneliği              | `openai-codex/gpt-*`     | atlanmış veya `runtime: "pi"`       | OpenAI Codex OAuth sağlayıcısı | `Runtime: OpenClaw Pi Default` |
| Tutucu otomatik modla karma sağlayıcılar          | sağlayıcıya özgü referanslar | `agentRuntime.id: "auto"`        | Seçilen sağlayıcı başına       | Seçilen çalışma zamanına bağlıdır |
| Açık Codex ACP bağdaştırıcı oturumu               | ACP istemine/modeline bağlı | `sessions_spawn` ile `runtime: "acp"` | ACP backend kimlik doğrulaması | ACP görev/oturum durumu        |

Önemli ayrım sağlayıcı ile çalışma zamanı arasındadır:

- `openai-codex/*`, "PI hangi sağlayıcı/kimlik doğrulama rotasını kullanmalı?"
  sorusunu yanıtlar.
- `agentRuntime.id: "codex"`, "bu gömülü turu hangi döngü yürütmeli?" sorusunu
  yanıtlar.
- `/codex ...`, "bu sohbet hangi yerel Codex konuşmasını bağlamalı veya
  denetlemeli?" sorusunu yanıtlar.
- ACP, "acpx hangi dış harness sürecini başlatmalı?" sorusunu yanıtlar.

## Doğru model önekini seçin

OpenAI ailesi rotaları öneke özgüdür. Yaygın abonelik artı yerel Codex çalışma
zamanı kurulumu için `agentRuntime.id: "codex"` ile `openai/*` kullanın. Yalnızca
bilinçli olarak PI üzerinden Codex OAuth istediğinizde `openai-codex/*`
kullanın:

| Model referansı                              | Çalışma zamanı yolu                         | Ne zaman kullanılır                                                       |
| -------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                             | OpenClaw/PI tesisatı üzerinden OpenAI sağlayıcısı | `OPENAI_API_KEY` ile mevcut doğrudan OpenAI Platform API erişimi istediğinizde. |
| `openai-codex/gpt-5.5`                       | OpenClaw/PI üzerinden OpenAI Codex OAuth    | Varsayılan PI çalıştırıcısıyla ChatGPT/Codex abonelik kimlik doğrulaması istediğinizde. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                    | Yerel Codex yürütmesiyle ChatGPT/Codex abonelik kimlik doğrulaması istediğinizde. |

GPT-5.5, hesabınız bunları sunduğunda hem doğrudan OpenAI API anahtarı hem de
Codex abonelik rotalarında görünebilir. Yerel Codex çalışma zamanı için Codex
app-server harness ile `openai/gpt-5.5`, PI OAuth için `openai-codex/gpt-5.5`
veya doğrudan API anahtarı trafiği için Codex çalışma zamanı override’ı olmadan
`openai/gpt-5.5` kullanın.

Eski `codex/gpt-*` referansları uyumluluk takma adları olarak kabul edilmeye
devam eder. Doctor uyumluluk migration’ı eski birincil çalışma zamanı
referanslarını kanonik model referanslarına yeniden yazar ve çalışma zamanı
politikasını ayrı kaydeder; yalnızca yedek eski referanslar ise değişmeden
bırakılır çünkü çalışma zamanı tüm ajan kapsayıcısı için yapılandırılır. Yeni PI
Codex OAuth yapılandırmaları `openai-codex/gpt-*`; yeni yerel app-server harness
yapılandırmaları `openai/gpt-*` artı `agentRuntime.id: "codex"` kullanmalıdır.

`agents.defaults.imageModel` aynı önek ayrımını izler. Görüntü anlama OpenAI
Codex OAuth sağlayıcı yolu üzerinden çalışmalıysa `openai-codex/gpt-*` kullanın.
Görüntü anlama sınırlı bir Codex app-server turu üzerinden çalışmalıysa
`codex/gpt-*` kullanın. Codex app-server modeli görüntü girişi desteğini ilan
etmelidir; yalnızca metin Codex modelleri medya turu başlamadan önce başarısız
olur.

Geçerli oturum için etkin harness’i doğrulamak üzere `/status` kullanın. Seçim
şaşırtıcıysa `agents/harness` alt sistemi için hata ayıklama günlüğünü
etkinleştirin ve Gateway’in yapılandırılmış `agent harness selected` kaydını
inceleyin. Bu kayıt seçilen harness kimliğini, seçim nedenini, çalışma
zamanı/yedek politikasını ve `auto` modunda her Plugin adayının destek sonucunu
içerir.

### Doctor uyarıları ne anlama gelir

`openclaw doctor`, bunların tümü doğru olduğunda uyarır:

- birlikte gelen `codex` Plugin’i etkinleştirilmiş veya izin verilmiştir
- bir ajanın birincil modeli `openai-codex/*` değeridir
- o ajanın etkin çalışma zamanı `codex` değildir

Bu uyarı vardır çünkü kullanıcılar genellikle "Codex Plugin etkin" ifadesinin
"yerel Codex app-server çalışma zamanı" anlamına gelmesini bekler. OpenClaw bu
sıçramayı yapmaz. Uyarının anlamı şudur:

- PI üzerinden ChatGPT/Codex OAuth amaçladıysanız **değişiklik gerekmez**.
- Yerel app-server yürütmesini amaçladıysanız modeli `openai/<model>` olarak
  değiştirin ve `agentRuntime.id: "codex"` ayarlayın.
- Oturum çalışma zamanı pin’leri kalıcı olduğundan mevcut oturumlar çalışma
  zamanı değişikliğinden sonra hâlâ `/new` veya `/reset` gerektirir.

Harness seçimi canlı oturum denetimi değildir. Bir gömülü tur çalıştığında
OpenClaw seçilen harness kimliğini o oturuma kaydeder ve aynı oturum kimliğinde
sonraki turlar için onu kullanmayı sürdürür. Gelecekteki oturumların başka bir
harness kullanmasını istediğinizde `agentRuntime` yapılandırmasını veya
`OPENCLAW_AGENT_RUNTIME` değerini değiştirin; mevcut bir konuşmayı PI ile Codex
arasında değiştirmeden önce yeni bir oturum başlatmak için `/new` veya `/reset`
kullanın. Bu, bir dökümün iki uyumsuz yerel oturum sistemi üzerinden yeniden
oynatılmasını önler.

Transkript geçmişi olduğunda, harness sabitlemelerinden önce oluşturulmuş eski oturumlar PI-sabitlenmiş olarak değerlendirilir. Yapılandırmayı değiştirdikten sonra bu konuşmayı Codex'e dahil etmek için `/new` veya `/reset` kullanın.

`/status` geçerli model çalışma zamanını gösterir. Varsayılan PI harness'ı `Runtime: OpenClaw Pi Default` olarak, Codex uygulama sunucusu harness'ı ise `Runtime: OpenAI Codex` olarak görünür.

## Gereksinimler

- Paketle gelen `codex` Plugin'i kullanılabilir durumda olan OpenClaw.
- Codex uygulama sunucusu `0.125.0` veya daha yeni. Paketle gelen Plugin varsayılan olarak uyumlu bir Codex uygulama sunucusu ikili dosyasını yönetir; bu yüzden `PATH` üzerindeki yerel `codex` komutları normal harness başlatmasını etkilemez.
- Uygulama sunucusu süreci veya OpenClaw'ın Codex kimlik doğrulama köprüsü için Codex kimlik doğrulamasının mevcut olması. Yerel uygulama sunucusu başlatmaları, her ajan için OpenClaw tarafından yönetilen bir Codex ana dizini ve yalıtılmış bir alt `HOME` kullanır; bu nedenle varsayılan olarak kişisel `~/.codex` hesabınızı, becerilerinizi, Plugin'lerinizi, yapılandırmanızı, iş parçacığı durumunuzu veya yerel `$HOME/.agents/skills` dizininizi okumaz.

Plugin, daha eski veya sürümsüz uygulama sunucusu el sıkışmalarını engeller. Bu, OpenClaw'ın test edildiği protokol yüzeyinde kalmasını sağlar.

Canlı ve Docker smoke testleri için kimlik doğrulama genellikle Codex CLI hesabından veya bir OpenClaw `openai-codex` kimlik doğrulama profilinden gelir. Yerel stdio uygulama sunucusu başlatmaları, hesap yoksa `CODEX_API_KEY` / `OPENAI_API_KEY` üzerine de geri dönebilir.

## Çalışma alanı bootstrap dosyaları

Codex, yerel proje dokümanı keşfi aracılığıyla `AGENTS.md` dosyasını kendisi işler. OpenClaw sentetik Codex proje dokümanı dosyaları yazmaz veya persona dosyaları için Codex geri dönüş dosya adlarına bağımlı olmaz; çünkü Codex geri dönüşleri yalnızca `AGENTS.md` eksik olduğunda geçerlidir.

OpenClaw çalışma alanı denkliği için Codex harness'ı diğer bootstrap dosyalarını (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` ve varsa `MEMORY.md`) çözümler ve bunları `thread/start` ve `thread/resume` üzerinde Codex yapılandırma talimatları aracılığıyla iletir. Bu, `AGENTS.md` dosyasını çoğaltmadan `SOUL.md` ve ilgili çalışma alanı persona/profil bağlamının görünür kalmasını sağlar.

## Codex'i diğer modellerin yanına ekleme

Aynı ajan Codex ve Codex dışı sağlayıcı modeller arasında serbestçe geçiş yapacaksa `agentRuntime.id: "codex"` değerini genel olarak ayarlamayın. Zorunlu bir çalışma zamanı, o ajan veya oturum için her gömülü dönüşe uygulanır. Bu çalışma zamanı zorunluyken bir Anthropic modeli seçerseniz OpenClaw yine Codex harness'ını dener ve bu dönüşü sessizce PI üzerinden yönlendirmek yerine kapalı şekilde başarısız olur.

Bunun yerine şu biçimlerden birini kullanın:

- Codex'i `agentRuntime.id: "codex"` ile ayrılmış bir ajana koyun.
- Normal karma sağlayıcı kullanımı için varsayılan ajanı `agentRuntime.id: "auto"` ve PI geri dönüşü üzerinde tutun.
- Eski `codex/*` referanslarını yalnızca uyumluluk için kullanın. Yeni yapılandırmalar `openai/*` ve açık bir Codex çalışma zamanı politikasını tercih etmelidir.

Örneğin, bu varsayılan ajanı normal otomatik seçimde tutar ve ayrı bir Codex ajanı ekler:

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

Bu biçimle:

- Varsayılan `main` ajanı normal sağlayıcı yolunu ve PI uyumluluk geri dönüşünü kullanır.
- `codex` ajanı Codex uygulama sunucusu harness'ını kullanır.
- Codex, `codex` ajanı için eksikse veya desteklenmiyorsa dönüş, PI'ı sessizce kullanmak yerine başarısız olur.

## Ajan komut yönlendirmesi

Ajanlar kullanıcı isteklerini yalnızca "Codex" sözcüğüne göre değil, niyete göre yönlendirmelidir:

| Kullanıcı şunu ister...                                | Ajan şunu kullanmalı...                           |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Bu sohbeti Codex'e bağla"                             | `/codex bind`                                    |
| "Codex iş parçacığı `<id>` burada sürdür"              | `/codex resume <id>`                             |
| "Codex iş parçacıklarını göster"                       | `/codex threads`                                 |
| "Kötü bir Codex çalışması için destek raporu oluştur"  | `/diagnostics [note]`                            |
| "Yalnızca bu ekli iş parçacığı için Codex geri bildirimi gönder" | `/codex diagnostics [note]`                      |
| "ChatGPT/Codex aboneliğimi Codex çalışma zamanı ile kullan" | `openai/*` artı `agentRuntime.id: "codex"`       |
| "ChatGPT/Codex aboneliğimi PI üzerinden kullan"        | `openai-codex/*` model referansları              |
| "Codex'i ACP/acpx üzerinden çalıştır"                  | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Claude Code/Gemini/OpenCode/Cursor'ı bir iş parçacığında başlat" | ACP/acpx, `/codex` değil ve yerel alt ajanlar değil |

OpenClaw, ACP oluşturma rehberliğini ajanlara yalnızca ACP etkin, gönderilebilir ve yüklenmiş bir çalışma zamanı arka ucu tarafından destekleniyorsa duyurur. ACP mevcut değilse sistem istemi ve Plugin Skills ajana ACP yönlendirmesini öğretmemelidir.

## Yalnızca Codex dağıtımları

Her gömülü ajan dönüşünün Codex kullandığını kanıtlamanız gerektiğinde Codex harness'ını zorunlu kılın. Açık Plugin çalışma zamanları kapalı şekilde başarısız olur ve PI üzerinden sessizce yeniden denenmez:

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

Codex zorunlu kılındığında, Codex Plugin'i devre dışıysa, uygulama sunucusu çok eskiyse veya uygulama sunucusu başlatılamıyorsa OpenClaw erken başarısız olur.

## Ajan başına Codex

Varsayılan ajan normal otomatik seçimi korurken bir ajanı yalnızca Codex yapabilirsiniz:

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

Ajanlar ve modeller arasında geçiş yapmak için normal oturum komutlarını kullanın. `/new` yeni bir OpenClaw oturumu oluşturur ve Codex harness'ı gerektiğinde kendi sidecar uygulama sunucusu iş parçacığını oluşturur veya sürdürür. `/reset`, o iş parçacığı için OpenClaw oturum bağlamasını temizler ve bir sonraki dönüşün harness'ı yeniden mevcut yapılandırmadan çözümlemesine izin verir.

## Model keşfi

Varsayılan olarak Codex Plugin'i, kullanılabilir modelleri uygulama sunucusundan ister. Keşif başarısız olursa veya zaman aşımına uğrarsa, şu modeller için paketle gelen geri dönüş kataloğunu kullanır:

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

Başlatmanın Codex'i yoklamasını önlemek ve geri dönüş kataloğuna bağlı kalmasını istediğinizde keşfi devre dışı bırakın:

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

## Uygulama sunucusu bağlantısı ve politika

Varsayılan olarak Plugin, OpenClaw'ın yönettiği Codex ikili dosyasını yerelde şununla başlatır:

```bash
codex app-server --listen stdio://
```

Yönetilen ikili dosya `codex` Plugin paketiyle birlikte gönderilir. Bu, uygulama sunucusu sürümünü yerelde kurulu olan ayrı Codex CLI hangisiyse onun yerine paketle gelen Plugin'e bağlı tutar. `appServer.command` değerini yalnızca bilinçli olarak farklı bir yürütülebilir dosya çalıştırmak istediğinizde ayarlayın.

Varsayılan olarak OpenClaw yerel Codex harness oturumlarını YOLO modunda başlatır: `approvalPolicy: "never"`, `approvalsReviewer: "user"` ve `sandbox: "danger-full-access"`. Bu, otonom Heartbeat'ler için kullanılan güvenilir yerel operatör duruşudur: Codex, yanıtlayacak kimse olmadığında yerel onay istemlerinde durmadan kabuk ve ağ araçlarını kullanabilir.

Codex guardian-incelemeli onaylarına katılmak için `appServer.mode:
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

Guardian modu, Codex'in yerel otomatik inceleme onay yolunu kullanır. Codex sandbox dışına çıkmayı, çalışma alanı dışına yazmayı veya ağ erişimi gibi izinler eklemeyi istediğinde, Codex bu onay isteğini bir insan istemi yerine yerel inceleyiciye yönlendirir. İnceleyici Codex'in risk çerçevesini uygular ve belirli isteği onaylar veya reddeder. YOLO modundan daha fazla koruma istediğinizde, ancak gözetimsiz ajanların yine de ilerleme kaydetmesi gerektiğinde Guardian kullanın.

`guardian` ön ayarı `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` ve `sandbox: "workspace-write"` olarak genişler. Tekil politika alanları yine de `mode` değerini geçersiz kılar; bu nedenle gelişmiş dağıtımlar ön ayarı açık seçimlerle karıştırabilir. Daha eski `guardian_subagent` inceleyici değeri hâlâ uyumluluk takma adı olarak kabul edilir, ancak yeni yapılandırmalar `auto_review` kullanmalıdır.

Halihazırda çalışan bir uygulama sunucusu için WebSocket aktarımını kullanın:

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

Stdio uygulama sunucusu başlatmaları varsayılan olarak OpenClaw'ın süreç ortamını devralır, ancak OpenClaw Codex uygulama sunucusu hesap köprüsüne sahip olur ve hem `CODEX_HOME` hem de `HOME` değerlerini o ajanın OpenClaw durumu altındaki ajan başına dizinlere ayarlar. Codex'in kendi beceri yükleyicisi `$CODEX_HOME/skills` ve `$HOME/.agents/skills` dizinlerini okur; bu nedenle yerel uygulama sunucusu başlatmaları için iki değer de yalıtılır. Bu, Codex'e özgü becerilerin, Plugin'lerin, yapılandırmanın, hesapların ve iş parçacığı durumunun operatörün kişisel Codex CLI ana dizininden sızmak yerine OpenClaw ajanıyla kapsamlanmasını sağlar.

OpenClaw Plugin'leri ve OpenClaw beceri anlık görüntüleri yine de OpenClaw'ın kendi Plugin kayıt defteri ve beceri yükleyicisi üzerinden akar. Kişisel Codex CLI varlıkları akmaz. Bir OpenClaw ajanının parçası olması gereken kullanışlı Codex CLI becerileriniz veya Plugin'leriniz varsa bunların envanterini açıkça çıkarın:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex geçiş sağlayıcısı becerileri mevcut OpenClaw ajan çalışma alanına kopyalar. Codex yerel Plugin'leri, hook'ları ve yapılandırma dosyaları otomatik olarak etkinleştirilmek yerine manuel inceleme için raporlanır veya arşivlenir; çünkü komut çalıştırabilir, MCP sunucularını açığa çıkarabilir veya kimlik bilgileri taşıyabilirler.

Kimlik doğrulama şu sırayla seçilir:

1. Ajan için açık bir OpenClaw Codex kimlik doğrulama profili.
2. Uygulama sunucusunun o ajanın Codex ana dizinindeki mevcut hesabı.
3. Yalnızca yerel stdio uygulama sunucusu başlatmaları için, uygulama sunucusu hesabı yoksa ve OpenAI kimlik doğrulaması hâlâ gerekiyorsa `CODEX_API_KEY`, ardından `OPENAI_API_KEY`.

OpenClaw, ChatGPT aboneliği tarzı bir Codex kimlik doğrulama profili gördüğünde oluşturulan Codex alt sürecinden `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini kaldırır. Bu, Gateway düzeyi API anahtarlarını gömmeler veya doğrudan OpenAI modelleri için kullanılabilir tutarken yerel Codex uygulama sunucusu dönüşlerinin yanlışlıkla API üzerinden faturalandırılmasını önler. Açık Codex API anahtarı profilleri ve yerel stdio ortam anahtarı geri dönüşü, devralınan alt süreç ortamı yerine uygulama sunucusu oturum açmasını kullanır. WebSocket uygulama sunucusu bağlantıları Gateway ortam API anahtarı geri dönüşünü almaz; açık bir kimlik doğrulama profili veya uzak uygulama sunucusunun kendi hesabını kullanın.

Bir dağıtım ek ortam yalıtımına ihtiyaç duyuyorsa bu değişkenleri `appServer.clearEnv` içine ekleyin:

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
OpenClaw, Codex'e özgü çalışma alanı işlemlerini yineleyen dinamik araçları
sunmaz: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` ve
`update_plan`. Mesajlaşma, oturumlar, medya, Cron, tarayıcı, düğümler, Gateway,
`heartbeat_respond` ve `web_search` gibi OpenClaw entegrasyon araçları
kullanılabilir kalır.

Desteklenen üst düzey Codex Plugin alanları:

| Alan                       | Varsayılan       | Anlam                                                                                       |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Codex app-server'a eksiksiz OpenClaw dinamik araç setini sunmak için `"openclaw-compat"` kullanın. |
| `codexDynamicToolsExclude` | `[]`             | Codex app-server turlarından çıkarılacak ek OpenClaw dinamik araç adları.                   |

Desteklenen `appServer` alanları:

| Alan                | Varsayılan                              | Anlam                                                                                                                                                                                                                              |
| ------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                              | `"stdio"` Codex'i başlatır; `"websocket"` `url` adresine bağlanır.                                                                                                                                                                 |
| `command`           | yönetilen Codex ikilisi                | stdio aktarımı için çalıştırılabilir dosya. Yönetilen ikiliyi kullanmak için ayarlanmamış bırakın; yalnızca açık bir geçersiz kılma için ayarlayın.                                                                                |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio aktarımı için bağımsız değişkenler.                                                                                                                                                                                          |
| `url`               | ayarlanmamış                           | WebSocket app-server URL'si.                                                                                                                                                                                                       |
| `authToken`         | ayarlanmamış                           | WebSocket aktarımı için Bearer belirteci.                                                                                                                                                                                          |
| `headers`           | `{}`                                   | Ek WebSocket üst bilgileri.                                                                                                                                                                                                        |
| `clearEnv`          | `[]`                                   | OpenClaw devralınan ortamını oluşturduktan sonra başlatılan stdio app-server sürecinden kaldırılan ek ortam değişkeni adları. `CODEX_HOME` ve `HOME`, yerel başlatmalarda OpenClaw'ın ajan başına Codex izolasyonu için ayrılmıştır. |
| `requestTimeoutMs`  | `60000`                                | app-server kontrol düzlemi çağrıları için zaman aşımı.                                                                                                                                                                             |
| `mode`              | `"yolo"`                               | YOLO veya guardian tarafından gözden geçirilmiş yürütme için ön ayar.                                                                                                                                                              |
| `approvalPolicy`    | `"never"`                              | İş parçacığı başlatma/sürdürme/tur işlemine gönderilen yerel Codex onay ilkesi.                                                                                                                                                    |
| `sandbox`           | `"danger-full-access"`                 | İş parçacığı başlatma/sürdürme işlemine gönderilen yerel Codex sandbox modu.                                                                                                                                                       |
| `approvalsReviewer` | `"user"`                               | Codex'in yerel onay istemlerini gözden geçirmesine izin vermek için `"auto_review"` kullanın. `guardian_subagent` eski bir diğer ad olarak kalır.                                                                                  |
| `serviceTier`       | ayarlanmamış                           | İsteğe bağlı Codex app-server hizmet katmanı: `"fast"`, `"flex"` veya `null`. Geçersiz eski değerler yok sayılır.                                                                                                                  |

OpenClaw'a ait dinamik araç çağrıları, `appServer.requestTimeoutMs` değerinden
bağımsız olarak sınırlandırılır: her Codex `item/tool/call` isteği 30 saniye
içinde bir OpenClaw yanıtı almalıdır. Zaman aşımında OpenClaw, desteklendiği
yerlerde araç sinyalini iptal eder ve Codex'e başarısız bir dinamik araç yanıtı
döndürür; böylece tur, oturumu `processing` durumunda bırakmak yerine devam
edebilir.

OpenClaw, Codex tur kapsamlı bir app-server isteğine yanıt verdikten sonra,
harness ayrıca Codex'in yerel turu `turn/completed` ile bitirmesini bekler. Bu
yanıttan sonra app-server 60 saniye boyunca sessiz kalırsa OpenClaw, en iyi
çabayla Codex turunu keser, tanılama amaçlı bir zaman aşımı kaydeder ve takip
sohbet mesajlarının bayat bir yerel turun arkasında kuyruğa alınmaması için
OpenClaw oturum yolunu serbest bırakır.

Yerel test için ortam geçersiz kılmaları kullanılabilir kalır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command` ayarlanmamışsa `OPENCLAW_CODEX_APP_SERVER_BIN` yönetilen
ikiliyi atlar.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırıldı. Bunun yerine
`plugins.entries.codex.config.appServer.mode: "guardian"` kullanın veya tek
seferlik yerel test için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın.
Tekrarlanabilir dağıtımlar için yapılandırma tercih edilir; çünkü Plugin
davranışını Codex harness kurulumunun geri kalanıyla aynı gözden geçirilmiş
dosyada tutar.

## Bilgisayar kullanımı

Bilgisayar Kullanımı kendi kurulum kılavuzunda ele alınır:
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use).

Kısa sürüm: OpenClaw, masaüstü denetim uygulamasını vendor olarak dahil etmez
veya masaüstü eylemlerini kendisi yürütmez. Codex app-server'ı hazırlar,
`computer-use` MCP sunucusunun kullanılabilir olduğunu doğrular ve ardından
Codex modu turlarında yerel MCP araç çağrılarını Codex'in işlemesine izin verir.

Codex marketplace akışı dışında doğrudan TryCua sürücü erişimi için
`cua-driver mcp` öğesini `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`
ile kaydedin. Codex'e ait Bilgisayar Kullanımı ile doğrudan MCP kaydı arasındaki
ayrım için [Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use) bölümüne
bakın.

Minimum yapılandırma:

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

Bilgisayar Kullanımı macOS'a özgüdür ve Codex MCP sunucusu uygulamaları denetleyebilmeden
önce yerel işletim sistemi izinleri gerektirebilir. `computerUse.enabled` true
ise ve MCP sunucusu kullanılamıyorsa Codex modu turları, yerel Bilgisayar
Kullanımı araçları olmadan sessizce çalışmak yerine iş parçacığı başlamadan önce
başarısız olur. Marketplace seçenekleri, uzak katalog sınırları, durum nedenleri
ve sorun giderme için [Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use)
bölümüne bakın.

`computerUse.autoInstall` true olduğunda OpenClaw, Codex henüz yerel bir
marketplace keşfetmediyse standart paketlenmiş Codex Desktop marketplace'ini
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` konumundan
kaydedebilir. Mevcut oturumların eski bir PI veya Codex iş parçacığı bağlamasını
tutmaması için runtime veya Bilgisayar Kullanımı yapılandırmasını değiştirdikten
sonra `/new` veya `/reset` kullanın.

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

Guardian tarafından gözden geçirilmiş Codex onayları:

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

Açık üst bilgilerle uzak app-server:

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

Model değiştirme OpenClaw denetiminde kalır. Bir OpenClaw oturumu mevcut bir
Codex iş parçacığına ekliyken, sonraki tur o anda seçili OpenAI modelini,
sağlayıcıyı, onay ilkesini, sandbox'ı ve hizmet katmanını app-server'a tekrar
gönderir. `openai/gpt-5.5` modelinden `openai/gpt-5.2` modeline geçmek iş
parçacığı bağlamasını korur ancak Codex'ten yeni seçilen modelle devam etmesini
ister.

## Codex komutu

Paketlenmiş Plugin, `/codex` komutunu yetkili bir eğik çizgi komutu olarak
kaydeder. Geneldir ve OpenClaw metin komutlarını destekleyen herhangi bir
kanalda çalışır.

Yaygın biçimler:

- `/codex status` canlı app-server bağlantısını, modelleri, hesabı, hız sınırlarını, MCP sunucularını ve skills'i gösterir.
- `/codex models` canlı Codex app-server modellerini listeler.
- `/codex threads [filter]` son Codex iş parçacıklarını listeler.
- `/codex resume <thread-id>` geçerli OpenClaw oturumunu mevcut bir Codex iş parçacığına bağlar.
- `/codex compact` Codex app-server'dan bağlı iş parçacığını sıkıştırmasını ister.
- `/codex review` bağlı iş parçacığı için Codex yerel incelemesini başlatır.
- `/codex diagnostics [note]` bağlı iş parçacığı için Codex tanılama geri bildirimi göndermeden önce sorar.
- `/codex computer-use status` yapılandırılmış Computer Use Plugin'ini ve MCP sunucusunu denetler.
- `/codex computer-use install` yapılandırılmış Computer Use Plugin'ini kurar ve MCP sunucularını yeniden yükler.
- `/codex account` hesap ve hız sınırı durumunu gösterir.
- `/codex mcp` Codex app-server MCP sunucusu durumunu listeler.
- `/codex skills` Codex app-server skills'ini listeler.

Codex bir kullanım sınırı hatası bildirdiğinde, Codex sağlamışsa OpenClaw bir sonraki
app-server sıfırlama zamanını dahil eder. Geçerli hesap ve hız sınırı pencerelerini
incelemek için aynı konuşmada `/codex account` kullanın.

### Yaygın hata ayıklama iş akışı

Codex destekli bir ajan Telegram, Discord, Slack
veya başka bir kanalda şaşırtıcı bir şey yaptığında, sorunun yaşandığı konuşmadan başlayın:

1. `/diagnostics bad tool choice after image upload` komutunu veya gördüğünüz şeyi
   açıklayan başka bir kısa notu çalıştırın.
2. Tanılama isteğini bir kez onaylayın. Onay, yerel Gateway
   tanılama zip'ini oluşturur ve oturum Codex harness'ı kullandığı için ilgili
   Codex geri bildirim paketini de OpenAI sunucularına gönderir.
3. Tamamlanan tanılama yanıtını hata raporuna veya destek iş parçacığına kopyalayın.
   Bu yanıt yerel paket yolunu, gizlilik özetini, OpenClaw oturum kimliklerini,
   Codex iş parçacığı kimliklerini ve her Codex iş parçacığı için bir `Inspect locally` satırını içerir.
4. Çalıştırmayı kendiniz hata ayıklamak istiyorsanız, yazdırılan `Inspect locally`
   komutunu bir terminalde çalıştırın. `codex resume <thread-id>` gibi görünür ve
   yerel Codex iş parçacığını açar; böylece konuşmayı inceleyebilir, yerelde sürdürebilir
   veya Codex'e belirli bir aracı ya da planı neden seçtiğini sorabilirsiniz.

`/codex diagnostics [note]` komutunu yalnızca tam OpenClaw
Gateway tanılama paketi olmadan, o anda bağlı iş parçacığı için özellikle Codex
geri bildirim yüklemesini istediğinizde kullanın. Çoğu destek raporu için `/diagnostics [note]`
daha iyi başlangıç noktasıdır çünkü yerel Gateway durumunu ve Codex
iş parçacığı kimliklerini tek yanıtta birbirine bağlar. Tam gizlilik modeli ve grup sohbeti davranışı için
[Tanılama dışa aktarımı](/tr/gateway/diagnostics) bölümüne bakın.

Çekirdek OpenClaw ayrıca genel Gateway tanılama komutu olarak yalnızca sahiplerin kullanabildiği
`/diagnostics [note]` komutunu sunar. Onay istemi hassas veri
ön bilgisini gösterir, [Tanılama Dışa Aktarımı](/tr/gateway/diagnostics) bağlantısını verir ve
her seferinde açık exec onayı aracılığıyla
`openclaw gateway diagnostics export --json` ister. Tanılamayı allow-all kuralıyla onaylamayın. Onaydan sonra,
OpenClaw yerel paket yolu ve manifest özetiyle yapıştırılabilir bir rapor gönderir.
Etkin OpenClaw oturumu Codex harness'ını kullanıyorsa, aynı onay
ilgili Codex geri bildirim paketlerinin OpenAI sunucularına gönderilmesine de yetki verir.
Onay istemi Codex geri bildiriminin gönderileceğini söyler, ancak
onaydan önce Codex oturum veya iş parçacığı kimliklerini listelemez.

`/diagnostics` bir grup sohbetinde bir sahip tarafından çağrılırsa, OpenClaw
paylaşılan kanalı temiz tutar: grup yalnızca kısa bir bildirim alırken
tanılama ön bilgisi, onay istemleri ve Codex oturum/iş parçacığı kimlikleri
özel onay yolu üzerinden sahibe gönderilir. Özel sahip yolu yoksa,
OpenClaw grup isteğini reddeder ve sahibin bunu DM'den çalıştırmasını ister.

Onaylanan Codex yüklemesi Codex app-server `feedback/upload` çağrısını yapar ve
app-server'dan, kullanılabilir olduğunda listelenen her iş parçacığı ve oluşturulan Codex alt iş parçacıkları için
günlükleri dahil etmesini ister. Yükleme, Codex'in normal geri bildirim yolu üzerinden OpenAI
sunucularına gider; ilgili app-server'da Codex geri bildirimi devre dışıysa komut
app-server hatasını döndürür. Tamamlanan tanılama yanıtı, gönderilen iş parçacıkları için kanalları,
OpenClaw oturum kimliklerini, Codex iş parçacığı kimliklerini ve yerel `codex resume <thread-id>`
komutlarını listeler. Onayı reddeder veya yok sayarsanız,
OpenClaw bu Codex kimliklerini yazdırmaz. Bu yükleme yerel
Gateway tanılama dışa aktarımının yerini almaz.

`/codex resume`, harness'ın normal dönüşler için kullandığı aynı sidecar bağlama dosyasını yazar.
Bir sonraki mesajda OpenClaw bu Codex iş parçacığını sürdürür, o anda seçili
OpenClaw modelini app-server'a geçirir ve genişletilmiş geçmişi
etkin tutar.

### CLI'dan bir Codex iş parçacığını inceleme

Kötü bir Codex çalıştırmasını anlamanın en hızlı yolu çoğu zaman yerel Codex
iş parçacığını doğrudan açmaktır:

```sh
codex resume <thread-id>
```

Bunu bir kanal konuşmasında bir hata fark ettiğinizde ve sorunlu Codex oturumunu
incelemek, yerelde sürdürmek veya Codex'e belirli bir araç ya da akıl yürütme seçimini
neden yaptığını sormak istediğinizde kullanın. En kolay yol genellikle önce
`/diagnostics [note]` çalıştırmaktır: onayladıktan sonra tamamlanan rapor
her Codex iş parçacığını listeler ve örneğin `codex resume <thread-id>` gibi
bir `Inspect locally` komutu yazdırır. Bu komutu doğrudan terminale kopyalayabilirsiniz.

Ayrıca geçerli sohbet için `/codex binding` veya son Codex app-server iş parçacıkları için
`/codex threads [filter]` komutundan bir iş parçacığı kimliği alabilir, ardından kabuğunuzda aynı
`codex resume` komutunu çalıştırabilirsiniz.

Komut yüzeyi Codex app-server `0.125.0` veya daha yenisini gerektirir. Gelecekteki
veya özel bir app-server ilgili JSON-RPC yöntemini sunmuyorsa, tekil
denetim yöntemleri `unsupported by this Codex app-server` olarak bildirilir.

## Kanca sınırları

Codex harness'ında üç kanca katmanı vardır:

| Katman                                | Sahip                    | Amaç                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------ |
| OpenClaw Plugin kancaları             | OpenClaw                 | PI ve Codex harness'ları genelinde ürün/Plugin uyumluluğu.         |
| Codex app-server uzantı ara yazılımı  | OpenClaw paket Plugin'leri | OpenClaw dinamik araçları etrafında dönüş başına adaptör davranışı. |
| Codex yerel kancaları                 | Codex                    | Codex yapılandırmasından düşük düzey Codex yaşam döngüsü ve yerel araç ilkesi. |

OpenClaw, OpenClaw Plugin davranışını yönlendirmek için proje veya genel Codex
`hooks.json` dosyalarını kullanmaz. Desteklenen yerel araç ve izin köprüsü için
OpenClaw, `PreToolUse`, `PostToolUse`,
`PermissionRequest` ve `Stop` için iş parçacığı başına Codex yapılandırması enjekte eder.
`SessionStart` ve `UserPromptSubmit` gibi diğer Codex kancaları Codex düzeyi denetimler olarak kalır;
v1 sözleşmesinde OpenClaw Plugin kancaları olarak sunulmazlar.

OpenClaw dinamik araçları için OpenClaw, Codex çağrıyı istedikten sonra aracı çalıştırır;
bu nedenle OpenClaw, harness adaptöründe sahibi olduğu Plugin ve ara yazılım davranışını tetikler.
Codex'e yerel araçlarda kanonik araç kaydının sahibi Codex'tir.
OpenClaw seçili olayları yansıtabilir, ancak Codex bu işlemi app-server veya yerel kanca
geri çağrıları üzerinden sunmadıkça yerel Codex iş parçacığını yeniden yazamaz.

Compaction ve LLM yaşam döngüsü izdüşümleri, yerel Codex kanca komutlarından değil,
Codex app-server bildirimlerinden ve OpenClaw adaptör durumundan gelir.
OpenClaw'ın `before_compaction`, `after_compaction`, `llm_input` ve
`llm_output` olayları adaptör düzeyi gözlemlerdir; Codex'in dahili isteğinin veya
sıkıştırma payload'larının bayt bayt yakalanmış halleri değildir.

Codex yerel `hook/started` ve `hook/completed` app-server bildirimleri,
yörünge ve hata ayıklama için `codex_app_server.hook` ajan olayları olarak yansıtılır.
Bunlar OpenClaw Plugin kancalarını çağırmaz.

## V1 destek sözleşmesi

Codex modu, altında farklı bir model çağrısı olan PI değildir. Codex, yerel model döngüsünün daha fazlasına
sahiptir ve OpenClaw kendi Plugin ve oturum yüzeylerini
bu sınır etrafında uyarlar.

Codex runtime v1'de desteklenir:

| Yüzey                                         | Destek                                  | Neden                                                                                                                                                                                              |
| --------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex üzerinden OpenAI model döngüsü          | Desteklenir                             | Codex app-server, OpenAI dönüşüne, yerel iş parçacığı sürdürmeye ve yerel araç devamına sahiptir.                                                                                                  |
| OpenClaw kanal yönlendirme ve teslim          | Desteklenir                             | Telegram, Discord, Slack, WhatsApp, iMessage ve diğer kanallar model runtime'ının dışında kalır.                                                                                                   |
| OpenClaw dinamik araçları                     | Desteklenir                             | Codex, OpenClaw'dan bu araçları çalıştırmasını ister; bu nedenle OpenClaw yürütme yolunda kalır.                                                                                                   |
| İstem ve bağlam Plugin'leri                   | Desteklenir                             | OpenClaw, iş parçacığını başlatmadan veya sürdürmeden önce istem katmanlarını oluşturur ve bağlamı Codex dönüşüne yansıtır.                                                                         |
| Bağlam motoru yaşam döngüsü                   | Desteklenir                             | Birleştirme, ingest veya dönüş sonrası bakım ve bağlam motoru sıkıştırma koordinasyonu Codex dönüşleri için çalışır.                                                                               |
| Dinamik araç kancaları                        | Desteklenir                             | `before_tool_call`, `after_tool_call` ve araç sonucu ara yazılımı OpenClaw'a ait dinamik araçların etrafında çalışır.                                                                              |
| Yaşam döngüsü kancaları                       | Adaptör gözlemleri olarak desteklenir   | `llm_input`, `llm_output`, `agent_end`, `before_compaction` ve `after_compaction` dürüst Codex modu payload'larıyla tetiklenir.                                                                     |
| Son yanıt revizyon geçidi                     | Yerel kanca aktarımı üzerinden desteklenir | Codex `Stop`, `before_agent_finalize` öğesine aktarılır; `revise`, sonlandırmadan önce Codex'ten bir model geçişi daha ister.                                                                       |
| Yerel shell, patch ve MCP engelleme veya gözlem | Yerel kanca aktarımı üzerinden desteklenir | Codex `PreToolUse` ve `PostToolUse`, Codex app-server `0.125.0` veya daha yenisindeki MCP payload'ları dahil olmak üzere kaydedilmiş yerel araç yüzeyleri için aktarılır. Engelleme desteklenir; argüman yeniden yazımı desteklenmez. |
| Yerel izin ilkesi                             | Yerel kanca aktarımı üzerinden desteklenir | Codex `PermissionRequest`, runtime bunu sunduğunda OpenClaw ilkesi üzerinden yönlendirilebilir. OpenClaw karar döndürmezse Codex normal koruyucu veya kullanıcı onay yolundan devam eder.          |
| App-server yörünge yakalama                   | Desteklenir                             | OpenClaw, app-server'a gönderdiği isteği ve aldığı app-server bildirimlerini kaydeder.                                                                                                             |

Codex runtime v1'de desteklenmez:

| Yüzey                                             | V1 sınırı                                                                                                                                     | Gelecek yol                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Yerel araç argümanı mutasyonu                       | Codex yerel araç öncesi hook'ları engelleyebilir, ancak OpenClaw Codex'e özgü araç argümanlarını yeniden yazmaz.                                               | Değiştirilecek araç girdisi için Codex hook/şema desteği gerektirir.                            |
| Düzenlenebilir Codex yerel transkript geçmişi            | Kanonik yerel iş parçacığı geçmişinin sahibi Codex'tir. OpenClaw bir aynaya sahiptir ve gelecekteki bağlamı yansıtabilir, ancak desteklenmeyen iç yapıları mutasyona uğratmamalıdır. | Yerel iş parçacığı müdahalesi gerekiyorsa açık Codex app-server API'leri ekleyin.                    |
| Codex'e özgü araç kayıtları için `tool_result_persist` | Bu hook, Codex'e özgü araç kayıtlarını değil, OpenClaw'ın sahip olduğu transkript yazımlarını dönüştürür.                                                           | Dönüştürülmüş kayıtları aynalayabilir, ancak kanonik yeniden yazma Codex desteği gerektirir.              |
| Zengin yerel Compaction meta verileri                     | OpenClaw Compaction başlangıcını ve tamamlanmasını gözlemler, ancak kararlı bir tutulan/bırakılan listesi, token deltası veya özet yükü almaz.            | Daha zengin Codex Compaction olayları gerekir.                                                     |
| Compaction müdahalesi                             | Mevcut OpenClaw Compaction hook'ları Codex modunda bildirim düzeyindedir.                                                                         | Plugin'lerin yerel Compaction'ı veto etmesi veya yeniden yazması gerekiyorsa Codex Compaction öncesi/sonrası hook'ları ekleyin. |
| Bayt bayt model API isteği yakalama             | OpenClaw app-server isteklerini ve bildirimlerini yakalayabilir, ancak Codex çekirdeği son OpenAI API isteğini dahili olarak oluşturur.                      | Bir Codex model isteği izleme olayı veya hata ayıklama API'si gerekir.                                   |

## Araçlar, medya ve Compaction

Codex harness yalnızca düşük düzeyli gömülü aracı yürütücüsünü değiştirir.

OpenClaw araç listesini oluşturmaya ve harness'tan dinamik araç sonuçları almaya devam eder. Metin, görseller, video, müzik, TTS, onaylar ve mesajlaşma aracı çıktıları normal OpenClaw teslimat yolundan devam eder.

Yerel hook aktarımı özellikle geneldir, ancak v1 destek sözleşmesi OpenClaw'ın test ettiği Codex'e özgü araç ve izin yollarıyla sınırlıdır. Codex çalışma zamanında buna shell, patch ve MCP `PreToolUse`, `PostToolUse` ve `PermissionRequest` yükleri dahildir. Çalışma zamanı sözleşmesi adını koyana kadar gelecekteki her Codex hook olayının bir OpenClaw Plugin yüzeyi olduğunu varsaymayın.

`PermissionRequest` için OpenClaw yalnızca politika karar verdiğinde açık izin verme veya reddetme kararları döndürür. Kararsız sonuç izin verme değildir. Codex bunu hook kararı yok olarak ele alır ve kendi koruyucusuna veya kullanıcı onayı yoluna düşer.

Codex MCP araç onayı elicitation'ları, Codex `_meta.codex_approval_kind` değerini `"mcp_tool_call"` olarak işaretlediğinde OpenClaw'ın Plugin onay akışı üzerinden yönlendirilir. Codex `request_user_input` istemleri kaynak sohbete geri gönderilir ve sıradaki bir sonraki takip mesajı, ek bağlam olarak yönlendirilmek yerine bu yerel sunucu isteğini yanıtlar. Diğer MCP elicitation istekleri kapalı şekilde başarısız olur.

Etkin çalışma kuyruk yönlendirmesi Codex app-server `turn/steer` üzerine eşlenir. Varsayılan `messages.queue.mode: "steer"` ile OpenClaw, kuyruğa alınan sohbet mesajlarını yapılandırılmış sessiz pencere boyunca toplar ve geliş sırasına göre tek bir `turn/steer` isteği olarak gönderir. Eski `queue` modu ayrı `turn/steer` istekleri gönderir. Codex inceleme ve manuel Compaction dönüşleri aynı dönüş yönlendirmesini reddedebilir; bu durumda OpenClaw, seçilen mod geri dönüşe izin verdiğinde takip kuyruğunu kullanır. Bkz. [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

Seçilen model Codex harness kullandığında, yerel iş parçacığı Compaction'ı Codex app-server'a devredilir. OpenClaw kanal geçmişi, arama, `/new`, `/reset` ve gelecekteki model ya da harness geçişleri için bir transkript aynası tutar. Ayna, kullanıcı istemini, son asistan metnini ve app-server bunları yaydığında hafif Codex akıl yürütme veya plan kayıtlarını içerir. Bugün OpenClaw yalnızca yerel Compaction başlangıç ve tamamlama sinyallerini kaydeder. Henüz insan tarafından okunabilir bir Compaction özeti veya Codex'in Compaction sonrasında hangi girdileri tuttuğuna dair denetlenebilir bir liste sunmaz.

Kanonik yerel iş parçacığının sahibi Codex olduğu için `tool_result_persist` şu anda Codex'e özgü araç sonuç kayıtlarını yeniden yazmaz. Yalnızca OpenClaw, OpenClaw'ın sahip olduğu bir oturum transkripti araç sonucu yazarken uygulanır.

Medya üretimi Pi gerektirmez. Görsel, video, müzik, PDF, TTS ve medya anlama; `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` ve `messages.tts` gibi eşleşen sağlayıcı/model ayarlarını kullanmaya devam eder.

## Sorun giderme

**Codex normal bir `/model` sağlayıcısı olarak görünmüyor:** bu yeni yapılandırmalar için beklenen durumdur. `agentRuntime.id: "codex"` ile bir `openai/gpt-*` modeli (veya eski bir `codex/*` ref'i) seçin, `plugins.entries.codex.enabled` öğesini etkinleştirin ve `plugins.allow` değerinin `codex` öğesini hariç tutup tutmadığını kontrol edin.

**OpenClaw Codex yerine Pi kullanıyor:** `agentRuntime.id: "auto"`, çalışmayı hiçbir Codex harness üstlenmediğinde uyumluluk arka ucu olarak hâlâ Pi kullanabilir. Test sırasında Codex seçimini zorlamak için `agentRuntime.id: "codex"` ayarlayın. Zorlanmış Codex çalışma zamanı, Pi'ye geri dönmek yerine başarısız olur. Codex app-server seçildikten sonra hataları doğrudan yüzeye çıkar.

**app-server reddediliyor:** Codex'i yükseltin ki app-server el sıkışması `0.125.0` veya daha yeni sürümü raporlasın. `0.125.0-alpha.2` veya `0.125.0+custom` gibi aynı sürüm ön sürümleri ya da yapı sonekli sürümler reddedilir, çünkü OpenClaw'ın test ettiği kararlı protokol tabanı `0.125.0` sürümüdür.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs` değerini düşürün veya keşfi devre dışı bırakın.

**WebSocket taşıması hemen başarısız oluyor:** `appServer.url`, `authToken` ve uzak app-server'ın aynı Codex app-server protokol sürümünü konuştuğunu kontrol edin.

**Codex olmayan bir model Pi kullanıyor:** o aracı için `agentRuntime.id: "codex"` zorlamadıysanız veya eski bir `codex/*` ref'i seçmediyseniz bu beklenen durumdur. Düz `openai/gpt-*` ve diğer sağlayıcı ref'leri `auto` modunda normal sağlayıcı yollarında kalır. `agentRuntime.id: "codex"` zorlarsanız, o aracının her gömülü dönüşü Codex tarafından desteklenen bir OpenAI modeli olmalıdır.

**Computer Use kurulu ama araçlar çalışmıyor:** yeni bir oturumdan `/codex computer-use status` komutunu kontrol edin. Bir araç `Native hook relay unavailable` raporlarsa `/new` veya `/reset` kullanın; devam ederse, eski yerel hook kayıtlarını temizlemek için gateway'i yeniden başlatın. `computer-use.list_apps` zaman aşımına uğrarsa Codex Computer Use veya Codex Desktop'ı yeniden başlatıp tekrar deneyin.

## İlgili

- [Aracı harness Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Aracı çalışma zamanları](/tr/concepts/agent-runtimes)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [Durum](/tr/cli/status)
- [Plugin hook'ları](/tr/plugins/hooks)
- [Yapılandırma referansı](/tr/gateway/configuration-reference)
- [Test etme](/tr/help/testing-live#live-codex-app-server-harness-smoke)
