---
read_when:
    - Birlikte gelen Codex app-server düzeneğini kullanmak istiyorsunuz
    - Codex harness yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex dağıtımlarının PI'ye geri dönmek yerine başarısız olmasını istiyorsunuz
summary: OpenClaw yerleşik ajan turlarını pakete dahil Codex app-server test düzeneği üzerinden çalıştırın
title: Codex düzeneği
x-i18n:
    generated_at: "2026-05-07T01:53:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 484f32d9b73632827ee0ce3963ddbead784196fb36ff089632d0f622f1cecdf7
    source_path: plugins/codex-harness.md
    workflow: 16
---

Birlikte gelen `codex` plugin’i, OpenClaw’ın yerleşik PI harness yerine Codex app-server üzerinden gömülü ajan turlarını çalıştırmasını sağlar.

Codex’in düşük seviyeli ajan oturumunu sahiplenmesini istediğinizde bunu kullanın: model keşfi, yerel thread sürdürme, yerel compaction ve app-server yürütmesi. OpenClaw sohbet kanallarını, oturum dosyalarını, model seçimini, araçları, onayları, medya teslimini ve görünür transkript aynasını sahiplenmeye devam eder.

Bir kaynak sohbet turu Codex harness üzerinden çalıştığında, dağıtım `messages.visibleReplies` değerini açıkça yapılandırmamışsa görünür yanıtlar varsayılan olarak OpenClaw `message` aracına gider. Ajan yine de Codex turunu özel olarak bitirebilir; yalnızca `message(action="send")` çağırdığında kanala gönderi yapar. Doğrudan sohbet final yanıtlarını eski otomatik teslim yolunda tutmak için `messages.visibleReplies: "automatic"` ayarını yapın.

Codex heartbeat turları da varsayılan olarak `heartbeat_respond` aracını alır; böylece ajan, bu denetim akışını final metnine kodlamadan uyanmanın sessiz kalıp kalmayacağını veya bildirim gönderip göndermeyeceğini kaydedebilir.

Heartbeat’e özgü inisiyatif rehberliği, heartbeat turunun kendisinde Codex işbirliği modu geliştirici talimatı olarak gönderilir. Sıradan sohbet turları, normal çalışma zamanı prompt’larında heartbeat felsefesini taşımak yerine Codex Default modunu geri yükler.

Kendinizi konumlandırmaya çalışıyorsanız [Ajan çalışma zamanları](/tr/concepts/agent-runtimes) ile başlayın. Kısa sürüm şudur: `openai/gpt-5.5` model referansıdır, `codex` çalışma zamanıdır ve Telegram, Discord, Slack veya başka bir kanal iletişim yüzeyi olarak kalır.

## Hızlı yapılandırma

"OpenClaw içinde Codex" isteyen çoğu kullanıcı şu yolu ister: ChatGPT/Codex aboneliğiyle oturum açın, ardından gömülü ajan turlarını yerel Codex app-server çalışma zamanı üzerinden çalıştırın. Model referansı yine `openai/gpt-*` olarak kanonik kalır; abonelik kimlik doğrulaması bir `openai-codex/*` model önekinden değil, Codex hesabından/profilinden gelir.

Henüz yapmadıysanız önce Codex OAuth ile oturum açın:

```bash
openclaw models auth login --provider openai-codex
```

Ardından birlikte gelen `codex` plugin’ini etkinleştirin ve Codex çalışma zamanını zorunlu kılın:

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

Yapılandırmada `openai-codex/gpt-*` kullanmayın. Bu önek, `openclaw doctor --fix` komutunun birincil modeller, fallback’ler, heartbeat/subagent/compaction geçersiz kılmaları, hook’lar, kanal geçersiz kılmaları ve bayat kalıcı oturum rota pin’leri genelinde `openai/gpt-*` olarak yeniden yazdığı eski bir rotadır.

## Bu plugin neyi değiştirir

Birlikte gelen `codex` plugin’i birkaç ayrı yetenek sağlar:

| Yetenek                           | Nasıl kullanırsınız                                  | Ne yapar                                                                      |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Yerel gömülü çalışma zamanı       | `agentRuntime.id: "codex"`                          | OpenClaw gömülü ajan turlarını Codex app-server üzerinden çalıştırır.         |
| Yerel sohbet denetim komutları    | `/codex bind`, `/codex resume`, `/codex steer`, ... | Bir mesajlaşma konuşmasından Codex app-server thread’lerini bağlar ve yönetir. |
| Codex app-server sağlayıcısı/kataloğu | `codex` iç bileşenleri, harness üzerinden sunulur | Çalışma zamanının app-server modellerini keşfetmesini ve doğrulamasını sağlar. |
| Codex medya anlama yolu           | `codex/*` görüntü modeli uyumluluk yolları          | Desteklenen görüntü anlama modelleri için sınırlı Codex app-server turları çalıştırır. |
| Yerel hook aktarma                | Codex’e yerel olaylar etrafında plugin hook’ları    | OpenClaw’ın desteklenen Codex’e yerel araç/finalizasyon olaylarını gözlemlemesini/engellemesini sağlar. |

Plugin’i etkinleştirmek bu yetenekleri kullanılabilir yapar. Şunları **yapmaz**:

- her OpenAI modeli için Codex kullanmaya başlamak
- doctor, Codex’in kurulu, etkin, `codex` harness’ini sağladığını ve OAuth’a hazır olduğunu doğrulamadan `openai-codex/*` model referanslarını yerel çalışma zamanına dönüştürmek
- ACP/acpx yolunu varsayılan Codex yolu yapmak
- zaten bir PI çalışma zamanı kaydetmiş mevcut oturumları anında değiştirmek
- OpenClaw kanal teslimini, oturum dosyalarını, auth-profile depolamasını veya mesaj yönlendirmeyi değiştirmek

Aynı plugin, yerel `/codex` sohbet denetim komut yüzeyini de sahiplenir. Plugin etkinse ve kullanıcı sohbetten Codex thread’lerini bağlamayı, sürdürmeyi, yönlendirmeyi, durdurmayı veya incelemeyi isterse ajanlar ACP yerine `/codex ...` tercih etmelidir. ACP, kullanıcı ACP/acpx istediğinde veya ACP Codex bağdaştırıcısını test ettiğinde açık fallback olarak kalır.

Yerel Codex turları, herkese açık uyumluluk katmanı olarak OpenClaw plugin hook’larını korur. Bunlar süreç içi OpenClaw hook’larıdır, Codex `hooks.json` komut hook’ları değildir:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` yansıtılmış transkript kayıtları için
- Codex `Stop` aktarımı üzerinden `before_agent_finalize`
- `agent_end`

Plugin’ler ayrıca OpenClaw aracı yürüttükten sonra ve sonuç Codex’e döndürülmeden önce OpenClaw dinamik araç sonuçlarını yeniden yazmak için çalışma zamanı nötr araç sonucu ara katmanı kaydedebilir. Bu, OpenClaw’ın sahip olduğu transkript araç sonucu yazımlarını dönüştüren herkese açık `tool_result_persist` plugin hook’undan ayrıdır.

Plugin hook semantiklerinin kendisi için [Plugin hook’ları](/tr/plugins/hooks) ve [Plugin koruma davranışı](/tr/tools/plugin) bölümlerine bakın.

Harness varsayılan olarak kapalıdır. Yeni yapılandırmalar OpenAI model referanslarını `openai/gpt-*` olarak kanonik tutmalı ve yerel app-server yürütmesi istediklerinde açıkça `agentRuntime.id: "codex"` veya `OPENCLAW_AGENT_RUNTIME=codex` zorunlu kılmalıdır. Eski `codex/*` model referansları uyumluluk için harness’i hâlâ otomatik seçer, ancak çalışma zamanı destekli eski sağlayıcı önekleri normal model/sağlayıcı seçenekleri olarak gösterilmez.

Yapılandırılmış herhangi bir model rotası hâlâ `openai-codex/*` ise `openclaw doctor --fix` bunu `openai/*` olarak yeniden yazar. Eşleşen ajan rotaları için ajan çalışma zamanını yalnızca Codex plugin’i kurulu, etkin, `codex` harness’ini sağlıyor ve kullanılabilir OAuth’a sahipse `codex` olarak ayarlar; aksi halde çalışma zamanını `pi` olarak ayarlar.

## Rota haritası

Yapılandırmayı değiştirmeden önce bu tabloyu kullanın:

| İstenen davranış                                   | Model referansı           | Çalışma zamanı yapılandırması           | Kimlik doğrulama/profil rotası | Beklenen durum etiketi         |
| -------------------------------------------------- | ------------------------- | --------------------------------------- | ------------------------------ | ------------------------------ |
| Yerel Codex çalışma zamanı ile ChatGPT/Codex aboneliği | `openai/gpt-*`             | `agentRuntime.id: "codex"`              | Codex OAuth veya Codex hesabı  | `Runtime: OpenAI Codex`        |
| Normal OpenClaw çalıştırıcısı üzerinden OpenAI API | `openai/gpt-*`             | atlanmış veya `runtime: "pi"`           | OpenAI API anahtarı            | `Runtime: OpenClaw Pi Default` |
| Doctor onarımı gerektiren eski yapılandırma        | `openai-codex/gpt-*`       | `codex` veya `pi` olarak onarılmış      | Mevcut yapılandırılmış kimlik doğrulama | `doctor --fix` sonrası yeniden kontrol edin |
| Tutucu otomatik modlu karma sağlayıcılar           | sağlayıcıya özgü referanslar | `agentRuntime.id: "auto"`             | Seçilen sağlayıcıya göre       | Seçilen çalışma zamanına bağlı |
| Açık Codex ACP bağdaştırıcı oturumu                | ACP prompt/model bağımlı   | `runtime: "acp"` ile `sessions_spawn`   | ACP arka uç kimlik doğrulaması | ACP görev/oturum durumu        |

Önemli ayrım sağlayıcı ile çalışma zamanı arasındadır:

- `openai-codex/*`, doctor’ın yeniden yazdığı eski bir rotadır.
- `agentRuntime.id: "codex"` Codex harness gerektirir ve kullanılamıyorsa kapalı şekilde başarısız olur.
- `agentRuntime.id: "auto"` kayıtlı harness’lerin eşleşen sağlayıcı rotalarını sahiplenmesine izin verir, ancak bir harness o sağlayıcı/model çiftini desteklemediği sürece kanonik OpenAI referansları hâlâ PI tarafından sahiplenilir.
- `/codex ...`, "bu sohbet hangi yerel Codex konuşmasını bağlamalı veya denetlemeli?" sorusunu yanıtlar.
- ACP, "acpx hangi harici harness sürecini başlatmalı?" sorusunu yanıtlar.

## Doğru model önekini seçin

OpenAI ailesi rotaları öneke özeldir. Yaygın abonelik artı yerel Codex çalışma zamanı kurulumu için `agentRuntime.id: "codex"` ile `openai/*` kullanın. `openai-codex/*` değerini doctor’ın yeniden yazması gereken eski yapılandırma olarak ele alın:

| Model referansı                              | Çalışma zamanı yolu                         | Ne zaman kullanılır                                                       |
| -------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                             | OpenClaw/PI tesisatı üzerinden OpenAI sağlayıcısı | `OPENAI_API_KEY` ile güncel doğrudan OpenAI Platform API erişimi istediğinizde. |
| `openai-codex/gpt-5.5`                       | Doctor tarafından onarılan eski rota         | Eski yapılandırmadasınız; yeniden yazmak için `openclaw doctor --fix` çalıştırın. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                    | Yerel Codex yürütmesiyle ChatGPT/Codex abonelik kimlik doğrulaması istediğinizde. |

GPT-5.5, hesabınız bunları sunduğunda hem doğrudan OpenAI API anahtarı hem de Codex abonelik rotalarında görünebilir. Yerel Codex çalışma zamanı için Codex app-server harness ile `openai/gpt-5.5` kullanın veya doğrudan API anahtarı trafiği için Codex çalışma zamanı geçersiz kılması olmadan `openai/gpt-5.5` kullanın.

Eski `codex/gpt-*` referansları uyumluluk takma adları olarak kabul edilmeye devam eder. Doctor uyumluluk geçişi, eski çalışma zamanı referanslarını kanonik model referanslarına yeniden yazar ve çalışma zamanı ilkesini ayrı olarak kaydeder. Yeni yerel app-server harness yapılandırmaları `openai/gpt-*` artı `agentRuntime.id: "codex"` kullanmalıdır.

`agents.defaults.imageModel` aynı önek ayrımını izler. Normal OpenAI rotası için `openai/gpt-*`, görüntü anlama sınırlı bir Codex app-server turu üzerinden çalışacaksa `codex/gpt-*` kullanın. `openai-codex/gpt-*` kullanmayın; doctor bu eski öneki `openai/gpt-*` olarak yeniden yazar. Codex app-server modeli görüntü girdisi desteğini ilan etmelidir; yalnızca metin Codex modelleri medya turu başlamadan önce başarısız olur.

Geçerli oturum için etkili harness’i doğrulamak üzere `/status` kullanın. Seçim şaşırtıcıysa `agents/harness` alt sistemi için hata ayıklama günlüklerini etkinleştirin ve gateway’in yapılandırılmış `agent harness selected` kaydını inceleyin. Bu kayıt seçilen harness kimliğini, seçim nedenini, çalışma zamanı/fallback ilkesini ve `auto` modunda her plugin adayının destek sonucunu içerir.

### Doctor uyarıları ne anlama gelir

`openclaw doctor`, yapılandırılmış model referansları veya kalıcı oturum rota durumu hâlâ `openai-codex/*` kullandığında uyarır. `openclaw doctor --fix` bu rotaları şunlara yeniden yazar:

- `openai/<model>`
- Codex kurulu, etkin, `codex` harness’ini sağlıyor ve kullanılabilir OAuth’a sahipse `agentRuntime.id: "codex"`
- aksi halde `agentRuntime.id: "pi"`

`codex` rotası yerel Codex harness’i zorunlu kılar. `pi` rotası, eski rota temizliğinin bir yan etkisi olarak Codex’i etkinleştirmek veya kurmak yerine ajanı varsayılan OpenClaw çalıştırıcısında tutar.
Doctor ayrıca keşfedilen ajan oturum depoları genelinde bayat kalıcı oturum pin’lerini onarır; böylece eski konuşmalar kaldırılmış rota üzerinde sıkışık kalmaz.

Çalıştırma düzeneği seçimi canlı oturum denetimi değildir. Gömülü bir tur çalıştığında,
OpenClaw o oturumda seçili çalıştırma düzeneği kimliğini kaydeder ve aynı oturum
kimliğindeki sonraki turlarda onu kullanmayı sürdürür. Gelecekteki oturumların
başka bir çalıştırma düzeneği kullanmasını istediğinizde `agentRuntime`
yapılandırmasını veya `OPENCLAW_AGENT_RUNTIME` değerini değiştirin; mevcut bir
konuşmayı PI ile Codex arasında değiştirmeden önce yeni bir oturum başlatmak için
`/new` veya `/reset` kullanın. Bu, bir transkripti iki uyumsuz yerel oturum
sistemi üzerinden yeniden oynatmayı önler.

Çalıştırma düzeneği sabitlemeleri öncesinde oluşturulan eski oturumlar, transkript
geçmişleri olduğunda PI'ye sabitlenmiş kabul edilir. Yapılandırmayı değiştirdikten
sonra o konuşmayı Codex'e geçirmek için `/new` veya `/reset` kullanın.

`/status` etkin model çalışma zamanını gösterir. Varsayılan PI çalıştırma düzeneği
`Runtime: OpenClaw Pi Default` olarak, Codex uygulama sunucusu çalıştırma düzeneği
ise `Runtime: OpenAI Codex` olarak görünür.

## Gereksinimler

- Paketle birlikte gelen `codex` Plugin'i kullanılabilir olan OpenClaw.
- Codex uygulama sunucusu `0.125.0` veya daha yeni. Paketle gelen Plugin,
  varsayılan olarak uyumlu bir Codex uygulama sunucusu ikilisini yönetir; bu
  nedenle `PATH` üzerindeki yerel `codex` komutları normal çalıştırma düzeneği
  başlangıcını etkilemez.
- Uygulama sunucusu süreci veya OpenClaw'un Codex kimlik doğrulama köprüsü için
  kullanılabilir Codex kimlik doğrulaması. Yerel uygulama sunucusu başlatmaları,
  her aracı için OpenClaw tarafından yönetilen bir Codex giriş dizini ve izole
  bir alt `HOME` kullanır; bu nedenle varsayılan olarak kişisel `~/.codex`
  hesabınızı, Skills'i, Plugin'leri, yapılandırmayı, iş parçacığı durumunu veya
  yerel `$HOME/.agents/skills` dizinini okumaz.

Plugin, daha eski veya sürümsüz uygulama sunucusu el sıkışmalarını engeller. Bu,
OpenClaw'un test edildiği protokol yüzeyinde kalmasını sağlar.

Canlı ve Docker smoke testleri için kimlik doğrulama genellikle Codex CLI
hesabından veya bir OpenClaw `openai-codex` kimlik doğrulama profilinden gelir.
Yerel stdio uygulama sunucusu başlatmaları, hesap yoksa `CODEX_API_KEY` /
`OPENAI_API_KEY` değerlerine de geri dönebilir.

## Çalışma alanı başlangıç dosyaları

Codex, yerel proje dokümanı keşfi aracılığıyla `AGENTS.md` dosyasını kendisi
işler. OpenClaw sentetik Codex proje dokümanı dosyaları yazmaz veya persona
dosyaları için Codex geri dönüş dosya adlarına bağımlı olmaz; çünkü Codex geri
dönüşleri yalnızca `AGENTS.md` eksik olduğunda geçerlidir.

OpenClaw çalışma alanı eşdeğerliği için Codex çalıştırma düzeneği diğer başlangıç
dosyalarını (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` ve varsa `MEMORY.md`) çözer ve bunları `thread/start` ve
`thread/resume` üzerinde Codex geliştirici talimatları aracılığıyla iletir. Bu,
`AGENTS.md` dosyasını çoğaltmadan `SOUL.md` ve ilgili çalışma alanı
persona/profil bağlamının yerel Codex davranış biçimlendirme hattında görünür
kalmasını sağlar.

## Codex'i diğer modellerin yanına ekleyin

Aynı aracı Codex ve Codex dışı sağlayıcı modelleri arasında serbestçe geçiş
yapabilmeliyse `agentRuntime.id: "codex"` değerini genel olarak ayarlamayın.
Zorunlu çalışma zamanı, o aracı veya oturum için her gömülü tura uygulanır. Bu
çalışma zamanı zorunluyken bir Anthropic modeli seçerseniz OpenClaw yine Codex
çalıştırma düzeneğini dener ve o turu sessizce PI üzerinden yönlendirmek yerine
kapalı şekilde başarısız olur.

Bunun yerine şu yapılardan birini kullanın:

- Codex'i `agentRuntime.id: "codex"` ile özel bir aracıya koyun.
- Normal karma sağlayıcı kullanımı için varsayılan aracıyı `agentRuntime.id: "auto"` ve PI geri dönüşü üzerinde tutun.
- Eski `codex/*` başvurularını yalnızca uyumluluk için kullanın. Yeni yapılandırmalar
  `openai/*` ve açık bir Codex çalışma zamanı ilkesini tercih etmelidir.

Örneğin, bu yapı varsayılan aracıyı normal otomatik seçimde tutar ve ayrı bir
Codex aracısı ekler:

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

Bu yapıyla:

- Varsayılan `main` aracısı normal sağlayıcı yolunu ve PI uyumluluk geri dönüşünü kullanır.
- `codex` aracısı Codex uygulama sunucusu çalıştırma düzeneğini kullanır.
- `codex` aracısı için Codex eksikse veya desteklenmiyorsa tur sessizce PI
  kullanmak yerine başarısız olur.

## Aracı komut yönlendirmesi

Aracılar kullanıcı isteklerini yalnızca "Codex" kelimesine göre değil, amaca göre yönlendirmelidir:

| Kullanıcı şunu ister...                                | Aracı şunu kullanmalıdır...                       |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Bu sohbeti Codex'e bağla"                             | `/codex bind`                                    |
| "Codex iş parçacığı `<id>` burada sürdür"              | `/codex resume <id>`                             |
| "Codex iş parçacıklarını göster"                       | `/codex threads`                                 |
| "Kötü bir Codex çalışması için destek raporu aç"       | `/diagnostics [note]`                            |
| "Yalnızca bu ekli iş parçacığı için Codex geri bildirimi gönder" | `/codex diagnostics [note]`                      |
| "ChatGPT/Codex aboneliğimi Codex çalışma zamanıyla kullan" | `openai/*` artı `agentRuntime.id: "codex"`       |
| "Eski `openai-codex/*` yapılandırma/oturum sabitlemelerini onar" | `openclaw doctor --fix`                          |
| "Codex'i ACP/acpx üzerinden çalıştır"                  | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Claude Code/Gemini/OpenCode/Cursor'ı bir iş parçacığında başlat" | ACP/acpx, `/codex` değil ve yerel alt aracılar değil |

OpenClaw, aracılara ACP oluşturma rehberliğini yalnızca ACP etkin,
gönderilebilir ve yüklenmiş bir çalışma zamanı arka ucu tarafından destekleniyorsa
duyurur. ACP kullanılabilir değilse sistem istemi ve Plugin Skills, aracıya ACP
yönlendirmesini öğretmemelidir.

## Yalnızca Codex dağıtımları

Her gömülü aracı turunun Codex kullandığını kanıtlamanız gerektiğinde Codex
çalıştırma düzeneğini zorunlu kılın. Açık Plugin çalışma zamanları kapalı şekilde
başarısız olur ve PI üzerinden hiçbir zaman sessizce yeniden denenmez:

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

Codex zorunlu olduğunda, Codex Plugin devre dışıysa, uygulama sunucusu çok eskiyse
veya uygulama sunucusu başlatılamıyorsa OpenClaw erken başarısız olur.

## Aracı başına Codex

Varsayılan aracı normal otomatik seçimi korurken bir aracıyı yalnızca Codex
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

Aracıları ve modelleri değiştirmek için normal oturum komutlarını kullanın. `/new`
yeni bir OpenClaw oturumu oluşturur ve Codex çalıştırma düzeneği gerektiğinde yan
uygulama sunucusu iş parçacığını oluşturur veya sürdürür. `/reset`, o iş
parçacığı için OpenClaw oturum bağlamasını temizler ve sonraki turun çalıştırma
düzeneğini mevcut yapılandırmadan yeniden çözmesine izin verir.

## Model keşfi

Varsayılan olarak Codex Plugin, kullanılabilir modelleri uygulama sunucusundan
ister. Keşif başarısız olursa veya zaman aşımına uğrarsa şu modeller için paketle
gelen geri dönüş kataloğunu kullanır:

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

Başlangıcın Codex'i yoklamaktan kaçınmasını ve geri dönüş kataloğuna bağlı
kalmasını istediğinizde keşfi devre dışı bırakın:

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

## Uygulama sunucusu bağlantısı ve ilkesi

Varsayılan olarak Plugin, OpenClaw'un yönettiği Codex ikilisini yerel olarak şununla başlatır:

```bash
codex app-server --listen stdio://
```

Yönetilen ikili, `codex` Plugin paketiyle gönderilir. Bu, uygulama sunucusu
sürümünü yerelde yüklü olabilecek ayrı Codex CLI yerine paketle gelen Plugin'e
bağlı tutar. Yalnızca özellikle farklı bir yürütülebilir dosya çalıştırmak
istediğinizde `appServer.command` ayarlayın.

Varsayılan olarak OpenClaw, yerel Codex çalıştırma düzeneği oturumlarını YOLO
modunda başlatır: `approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Bu, otonom Heartbeat'ler için kullanılan
güvenilir yerel operatör duruşudur: Codex, yanıtlayacak kimse yokken yerel onay
istemlerinde durmadan kabuk ve ağ araçlarını kullanabilir.

Codex guardian tarafından incelenen onaylara katılmak için `appServer.mode:
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
sandbox dışına çıkmayı, çalışma alanı dışına yazmayı veya ağ erişimi gibi izinler
eklemeyi istediğinde, Codex bu onay isteğini insan istemi yerine yerel inceleyiciye
yönlendirir. İnceleyici Codex'in risk çerçevesini uygular ve belirli isteği
onaylar veya reddeder. YOLO modundan daha fazla koruma istediğinizde ancak yine de
gözetimsiz aracıların ilerleme kaydetmesine ihtiyaç duyduğunuzda Guardian kullanın.

`guardian` ön ayarı `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` ve `sandbox: "workspace-write"` olarak
genişler. Bireysel ilke alanları yine de `mode` değerini geçersiz kılar; bu
nedenle gelişmiş dağıtımlar ön ayarı açık seçimlerle karıştırabilir. Eski
`guardian_subagent` inceleyici değeri hâlâ uyumluluk takma adı olarak kabul
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

Stdio uygulama sunucusu başlatmaları varsayılan olarak OpenClaw'un süreç ortamını
devralır, ancak OpenClaw Codex uygulama sunucusu hesap köprüsüne sahiptir ve hem
`CODEX_HOME` hem de `HOME` değerlerini o aracının OpenClaw durumu altında aracıya
özel dizinlere ayarlar. Codex'in kendi skill yükleyicisi `$CODEX_HOME/skills` ve
`$HOME/.agents/skills` dizinlerini okur; bu nedenle yerel uygulama sunucusu
başlatmaları için her iki değer de izole edilir. Bu, Codex'e yerel Skills'i,
Plugin'leri, yapılandırmayı, hesapları ve iş parçacığı durumunu operatörün kişisel
Codex CLI giriş dizininden sızmak yerine OpenClaw aracısı kapsamına alır.

OpenClaw Plugin'leri ve OpenClaw skill anlık görüntüleri yine de OpenClaw'un kendi
Plugin kayıt defteri ve skill yükleyicisi üzerinden akar. Kişisel Codex CLI
varlıkları akmaz. Bir OpenClaw aracısının parçası olması gereken yararlı Codex CLI
Skills'iniz veya Plugin'leriniz varsa, bunların envanterini açıkça çıkarın:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex geçiş sağlayıcısı Skills'i mevcut OpenClaw aracı çalışma alanına kopyalar.
Codex yerel Plugin'leri, kancaları ve yapılandırma dosyaları otomatik olarak
etkinleştirilmek yerine manuel inceleme için raporlanır veya arşivlenir; çünkü
komut çalıştırabilir, MCP sunucularını açığa çıkarabilir veya kimlik bilgileri
taşıyabilirler.

Kimlik doğrulama şu sırayla seçilir:

1. Aracı için açık bir OpenClaw Codex kimlik doğrulama profili.
2. Uygulama sunucusunun o aracının Codex giriş dizinindeki mevcut hesabı.
3. Yalnızca yerel stdio uygulama sunucusu başlatmaları için, uygulama sunucusu
   hesabı yoksa ve OpenAI kimlik doğrulaması hâlâ gerekliyse `CODEX_API_KEY`,
   ardından `OPENAI_API_KEY`.

OpenClaw, ChatGPT abonelik tarzı bir Codex kimlik doğrulama profili gördüğünde,
oluşturulan Codex alt işleminden `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini
kaldırır. Bu, Gateway düzeyi API anahtarlarının embeddings veya doğrudan OpenAI
modelleri için kullanılabilir kalmasını, yerel Codex uygulama sunucusu turlarının
yanlışlıkla API üzerinden faturalandırılmamasını sağlar. Açık Codex API anahtarı
profilleri ve yerel stdio env-key yedeği, devralınan alt işlem ortamı yerine
uygulama sunucusu oturum açmasını kullanır. WebSocket uygulama sunucusu
bağlantıları Gateway ortam API anahtarı yedeğini almaz; açık bir kimlik doğrulama
profili veya uzak uygulama sunucusunun kendi hesabını kullanın.

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

`appServer.clearEnv` yalnızca oluşturulan Codex uygulama sunucusu alt işlemini etkiler.

Codex dinamik araçları varsayılan olarak `native-first` profilini kullanır. Bu
modda OpenClaw, Codex'e yerel çalışma alanı işlemlerini çoğaltan dinamik araçları
sunmaz: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` ve
`update_plan`. Mesajlaşma, oturumlar, medya, cron, tarayıcı, node'lar, gateway,
`heartbeat_respond` ve `web_search` gibi OpenClaw entegrasyon araçları
kullanılabilir kalır.

Desteklenen üst düzey Codex Plugin alanları:

| Alan                       | Varsayılan       | Anlam                                                                                         |
| -------------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Codex uygulama sunucusuna tam OpenClaw dinamik araç kümesini sunmak için `"openclaw-compat"` kullanın. |
| `codexDynamicToolsExclude` | `[]`             | Codex uygulama sunucusu turlarından çıkarılacak ek OpenClaw dinamik araç adları.              |

Desteklenen `appServer` alanları:

| Alan                | Varsayılan                              | Anlam                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` Codex'i başlatır; `"websocket"` `url` değerine bağlanır.                                                                                                                                                                |
| `command`           | yönetilen Codex ikilisi                  | stdio aktarımı için çalıştırılabilir dosya. Yönetilen ikiliyi kullanmak için ayarlanmamış bırakın; yalnızca açık bir geçersiz kılma için ayarlayın.                                                                              |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio aktarımı için bağımsız değişkenler.                                                                                                                                                                                          |
| `url`               | ayarlanmamış                             | WebSocket uygulama sunucusu URL'si.                                                                                                                                                                                                |
| `authToken`         | ayarlanmamış                             | WebSocket aktarımı için Bearer belirteci.                                                                                                                                                                                          |
| `headers`           | `{}`                                     | Ek WebSocket başlıkları.                                                                                                                                                                                                           |
| `clearEnv`          | `[]`                                     | OpenClaw devralınan ortamını oluşturduktan sonra, oluşturulan stdio uygulama sunucusu işleminden kaldırılan ek ortam değişkeni adları. `CODEX_HOME` ve `HOME`, yerel başlatmalarda OpenClaw'ın ajan başına Codex yalıtımı için ayrılmıştır. |
| `requestTimeoutMs`  | `60000`                                  | Uygulama sunucusu kontrol düzlemi çağrıları için zaman aşımı.                                                                                                                                                                      |
| `mode`              | `"yolo"`                                 | YOLO veya guardian incelemeli yürütme için ön ayar.                                                                                                                                                                                |
| `approvalPolicy`    | `"never"`                                | Konu başlatma/sürdürme/tur işlemlerine gönderilen yerel Codex onay ilkesi.                                                                                                                                                        |
| `sandbox`           | `"danger-full-access"`                   | Konu başlatma/sürdürme işlemlerine gönderilen yerel Codex sandbox modu.                                                                                                                                                           |
| `approvalsReviewer` | `"user"`                                 | Codex'in yerel onay istemlerini incelemesine izin vermek için `"auto_review"` kullanın. `guardian_subagent` eski bir takma ad olarak kalır.                                                                                      |
| `serviceTier`       | ayarlanmamış                             | İsteğe bağlı Codex uygulama sunucusu hizmet katmanı: `"fast"`, `"flex"` veya `null`. Geçersiz eski değerler yok sayılır.                                                                                                          |

OpenClaw'a ait dinamik araç çağrıları `appServer.requestTimeoutMs` değerinden
bağımsız olarak sınırlandırılır: her Codex `item/tool/call` isteği 30 saniye
içinde bir OpenClaw yanıtı almalıdır. Zaman aşımında OpenClaw, desteklenen
yerlerde araç sinyalini iptal eder ve Codex'e başarısız bir dinamik araç yanıtı
döndürür; böylece oturum `processing` durumunda kalmak yerine tur devam edebilir.

OpenClaw, Codex tur kapsamlı bir uygulama sunucusu isteğine yanıt verdikten
sonra, harness ayrıca Codex'in yerel turu `turn/completed` ile bitirmesini bekler.
Uygulama sunucusu bu yanıttan sonra 60 saniye sessiz kalırsa, OpenClaw en iyi
çabayla Codex turunu keser, tanısal bir zaman aşımı kaydeder ve OpenClaw oturum
hattını serbest bırakır; böylece takip eden sohbet mesajları bayat bir yerel
turun arkasında kuyruğa girmez.

Yerel test için ortam geçersiz kılmaları kullanılabilir kalır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`, `appServer.command` ayarlanmamışken yönetilen
ikiliyi atlar.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırıldı. Bunun yerine
`plugins.entries.codex.config.appServer.mode: "guardian"` kullanın veya tek
seferlik yerel test için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın.
Yapılandırma, tekrarlanabilir dağıtımlar için tercih edilir çünkü Plugin
davranışını Codex harness kurulumunun geri kalanıyla aynı incelenen dosyada tutar.

## Bilgisayar kullanımı

Bilgisayar Kullanımı kendi kurulum kılavuzunda ele alınır:
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use).

Kısa sürüm: OpenClaw masaüstü denetim uygulamasını vendora almaz veya masaüstü
eylemlerini kendisi yürütmez. Codex uygulama sunucusunu hazırlar,
`computer-use` MCP sunucusunun kullanılabilir olduğunu doğrular ve sonra Codex
modu turları sırasında yerel MCP araç çağrılarını Codex'in işlemesine izin verir.

Codex marketplace akışı dışında doğrudan TryCua sürücü erişimi için,
`cua-driver mcp` değerini `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`
ile kaydedin. Codex'e ait Bilgisayar Kullanımı ile doğrudan MCP kaydı arasındaki
ayrım için [Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use) bölümüne bakın.

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

Bilgisayar Kullanımı macOS'a özeldir ve Codex MCP sunucusu uygulamaları denetleyebilmeden
önce yerel OS izinleri gerektirebilir. `computerUse.enabled` true ise ve MCP
sunucusu kullanılamıyorsa, Codex modu turları yerel Bilgisayar Kullanımı araçları
olmadan sessizce çalışmak yerine konu başlamadan önce başarısız olur. Marketplace
seçenekleri, uzak katalog sınırları, durum nedenleri ve sorun giderme için
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use) bölümüne bakın.

`computerUse.autoInstall` true olduğunda, Codex henüz yerel bir marketplace
keşfetmemişse OpenClaw standart paketli Codex Desktop marketplace'i
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` konumundan
kaydedebilir. Çalışma zamanı veya Bilgisayar Kullanımı yapılandırmasını
değiştirdikten sonra mevcut oturumların eski bir Pi ya da Codex konu bağını
korumaması için `/new` veya `/reset` kullanın.

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

Guardian incelemeli Codex onayları:

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

Açık başlıklarla uzak uygulama sunucusu:

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
Codex konusuna bağlı olduğunda, sonraki tur seçili OpenAI modelini, sağlayıcıyı,
onay ilkesini, sandbox'ı ve hizmet katmanını uygulama sunucusuna yeniden gönderir.
`openai/gpt-5.5` değerinden `openai/gpt-5.2` değerine geçmek konu bağını korur
ancak Codex'ten yeni seçilen modelle devam etmesini ister.

## Codex komutu

Paketli Plugin, `/codex` komutunu yetkili bir eğik çizgi komutu olarak kaydeder.
Geneldir ve OpenClaw metin komutlarını destekleyen tüm kanallarda çalışır.

Yaygın biçimler:

- `/codex status` canlı uygulama sunucusu bağlantısını, modelleri, hesabı, hız sınırlarını, MCP sunucularını ve skills öğelerini gösterir.
- `/codex models` canlı Codex uygulama sunucusu modellerini listeler.
- `/codex threads [filter]` son Codex iş parçacıklarını listeler.
- `/codex resume <thread-id>` geçerli OpenClaw oturumunu mevcut bir Codex iş parçacığına bağlar.
- `/codex compact` Codex uygulama sunucusundan bağlı iş parçacığını sıkıştırmasını ister.
- `/codex review` bağlı iş parçacığı için Codex yerel incelemesini başlatır.
- `/codex diagnostics [note]` bağlı iş parçacığı için Codex tanılama geri bildirimi göndermeden önce onay ister.
- `/codex computer-use status` yapılandırılmış Computer Use Plugin ve MCP sunucusunu denetler.
- `/codex computer-use install` yapılandırılmış Computer Use Plugin'i yükler ve MCP sunucularını yeniden yükler.
- `/codex account` hesap ve hız sınırı durumunu gösterir.
- `/codex mcp` Codex uygulama sunucusu MCP sunucusu durumunu listeler.
- `/codex skills` Codex uygulama sunucusu skills öğelerini listeler.

Codex bir kullanım sınırı hatası bildirdiğinde, Codex bir değer sağladıysa OpenClaw sonraki
uygulama sunucusu sıfırlama zamanını içerir. Geçerli hesabı ve hız sınırı pencerelerini incelemek için aynı
konuşmada `/codex account` kullanın.

### Yaygın hata ayıklama iş akışı

Codex destekli bir aracı Telegram, Discord, Slack
veya başka bir kanalda şaşırtıcı bir şey yaptığında, sorunun yaşandığı konuşmayla başlayın:

1. `/diagnostics bad tool choice after image upload` komutunu veya gördüğünüz durumu açıklayan başka bir kısa notu
   çalıştırın.
2. Tanılama isteğini bir kez onaylayın. Onay, yerel Gateway
   tanılama zip dosyasını oluşturur ve oturum Codex koşumunu kullandığı için ilgili Codex geri bildirim paketini de OpenAI sunucularına
   gönderir.
3. Tamamlanan tanılama yanıtını hata raporuna veya destek iş parçacığına kopyalayın.
   Bu yanıt yerel paket yolunu, gizlilik özetini, OpenClaw oturum kimliklerini,
   Codex iş parçacığı kimliklerini ve her Codex iş parçacığı için bir `Inspect locally` satırını içerir.
4. Çalıştırmayı kendiniz hata ayıklamak istiyorsanız, yazdırılan `Inspect locally`
   komutunu bir terminalde çalıştırın. Komut `codex resume <thread-id>` biçimindedir ve
   yerel Codex iş parçacığını açar; böylece konuşmayı inceleyebilir, yerelde devam ettirebilir
   veya Codex'e neden belirli bir aracı ya da planı seçtiğini sorabilirsiniz.

`/codex diagnostics [note]` komutunu yalnızca tam OpenClaw
Gateway tanılama paketi olmadan, şu anda bağlı iş parçacığı için özellikle Codex
geri bildirim yüklemesi istediğinizde kullanın. Çoğu destek raporu için `/diagnostics [note]`
daha iyi başlangıç noktasıdır çünkü yerel Gateway durumunu ve Codex
iş parçacığı kimliklerini tek bir yanıtta birbirine bağlar. Tam gizlilik modeli ve grup sohbeti davranışı için [Tanılama dışa aktarımı](/tr/gateway/diagnostics)
sayfasına bakın.

Çekirdek OpenClaw ayrıca genel
Gateway tanılama komutu olarak yalnızca sahiplerin kullanabildiği `/diagnostics [note]` komutunu sunar. Onay istemi hassas veri
giriş açıklamasını gösterir, [Tanılama Dışa Aktarımı](/tr/gateway/diagnostics) bağlantısını verir ve her seferinde açık exec onayı üzerinden
`openclaw gateway diagnostics export --json` ister. Tanılamayı herkese izin veren bir kuralla onaylamayın. Onaydan sonra,
OpenClaw yerel paket yolu ve manifest
özetiyle yapıştırılabilir bir rapor gönderir. Etkin OpenClaw oturumu Codex koşumunu kullanıyorsa, aynı
onay ilgili Codex geri bildirim paketlerinin OpenAI sunucularına gönderilmesini de yetkilendirir. Onay istemi Codex geri bildiriminin gönderileceğini söyler, ancak
onaydan önce Codex oturum veya iş parçacığı kimliklerini listelemez.

`/diagnostics` bir grup sohbetinde bir sahip tarafından çağrılırsa OpenClaw
paylaşılan kanalı temiz tutar: grup yalnızca kısa bir bildirim alırken
tanılama giriş açıklaması, onay istemleri ve Codex oturum/iş parçacığı kimlikleri
özel onay yolu üzerinden sahibine gönderilir. Özel sahip yolu yoksa,
OpenClaw grup isteğini reddeder ve sahibin bunu DM üzerinden çalıştırmasını ister.

Onaylanan Codex yüklemesi Codex uygulama sunucusu `feedback/upload` çağrısını yapar ve
uygulama sunucusundan, kullanılabilir olduğunda listelenen her iş parçacığı ve oluşturulan Codex alt iş parçacıkları için günlükleri eklemesini
ister. Yükleme, Codex'in normal geri bildirim yolu üzerinden OpenAI
sunucularına gider; bu uygulama sunucusunda Codex geri bildirimi devre dışıysa komut
uygulama sunucusu hatasını döndürür. Tamamlanan tanılama yanıtı gönderilen iş parçacıkları için kanalları,
OpenClaw oturum kimliklerini, Codex iş parçacığı kimliklerini ve yerel `codex resume <thread-id>`
komutlarını listeler. Onayı reddeder veya yok sayarsanız,
OpenClaw bu Codex kimliklerini yazdırmaz. Bu yükleme, yerel
Gateway tanılama dışa aktarımının yerini almaz.

`/codex resume`, koşumun normal dönüşlerde kullandığı aynı yan bağlama dosyasını yazar.
Sonraki mesajda OpenClaw bu Codex iş parçacığını sürdürür, şu anda seçili
OpenClaw modelini uygulama sunucusuna geçirir ve genişletilmiş geçmişi
etkin tutar.

### CLI'dan bir Codex iş parçacığını inceleyin

Hatalı bir Codex çalıştırmasını anlamanın en hızlı yolu genellikle yerel Codex
iş parçacığını doğrudan açmaktır:

```sh
codex resume <thread-id>
```

Bunu bir kanal konuşmasında hata fark ettiğinizde ve sorunlu
Codex oturumunu incelemek, yerelde devam ettirmek veya Codex'e neden belirli bir
araç ya da akıl yürütme seçimi yaptığını sormak istediğinizde kullanın. En kolay yol genellikle önce
`/diagnostics [note]` çalıştırmaktır: onayladıktan sonra tamamlanan rapor
her Codex iş parçacığını listeler ve örneğin `codex resume <thread-id>` gibi bir
`Inspect locally` komutu yazdırır. Bu komutu doğrudan terminale kopyalayabilirsiniz.

Geçerli sohbet için `/codex binding` veya son Codex uygulama sunucusu iş parçacıkları için
`/codex threads [filter]` üzerinden de bir iş parçacığı kimliği alabilir, ardından kabuğunuzda aynı
`codex resume` komutunu çalıştırabilirsiniz.

Komut yüzeyi Codex uygulama sunucusu `0.125.0` veya daha yenisini gerektirir. Gelecekteki veya özel bir uygulama sunucusu ilgili JSON-RPC yöntemini sunmuyorsa bireysel
denetim yöntemleri `unsupported by this Codex app-server` olarak bildirilir.

## Hook sınırları

Codex koşumunun üç hook katmanı vardır:

| Katman                                | Sahip                    | Amaç                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin hook'ları             | OpenClaw                 | PI ve Codex koşumları genelinde ürün/Plugin uyumluluğu.             |
| Codex uygulama sunucusu uzantı ara yazılımı | OpenClaw paketli Plugin'ler | OpenClaw dinamik araçları çevresinde dönüş başına adaptör davranışı. |
| Codex yerel hook'ları                 | Codex                    | Codex yapılandırmasından düşük seviyeli Codex yaşam döngüsü ve yerel araç ilkesi. |

OpenClaw, OpenClaw Plugin davranışını yönlendirmek için proje veya genel Codex
`hooks.json` dosyalarını kullanmaz. Desteklenen yerel araç ve izin köprüsü için,
OpenClaw `PreToolUse`, `PostToolUse`,
`PermissionRequest` ve `Stop` için iş parçacığı başına Codex yapılandırması enjekte eder. Codex uygulama sunucusu onayları etkinleştirildiğinde
(`approvalPolicy`, `"never"` değildir), varsayılan enjekte edilen yerel hook yapılandırması
`PermissionRequest` öğesini atlar; böylece Codex'in uygulama sunucusu inceleyicisi ve OpenClaw'ın onay
köprüsü incelemeden sonra gerçek yükseltmeleri ele alır. Operatörler uyumluluk
aktarımına ihtiyaç duyduklarında yine de `nativeHookRelay.events` öğesine açıkça
`permission_request` ekleyebilir. `SessionStart` ve `UserPromptSubmit` gibi diğer Codex hook'ları
Codex düzeyinde denetimler olarak kalır; v1
sözleşmesinde OpenClaw Plugin hook'ları olarak sunulmaz.

OpenClaw dinamik araçları için OpenClaw, Codex çağrıyı istedikten sonra aracı
çalıştırır; bu nedenle OpenClaw sahip olduğu Plugin ve ara yazılım davranışını
koşum adaptöründe tetikler. Codex'e yerel araçlarda, kanonik araç kaydının sahibi Codex'tir.
OpenClaw seçili olayları yansıtabilir, ancak Codex bu işlemi uygulama sunucusu veya yerel hook
geri çağrıları üzerinden sunmadığı sürece yerel Codex
iş parçacığını yeniden yazamaz.

Compaction ve LLM yaşam döngüsü projeksiyonları Codex uygulama sunucusu
bildirimlerinden ve OpenClaw adaptör durumundan gelir; yerel Codex hook komutlarından değil.
OpenClaw'ın `before_compaction`, `after_compaction`, `llm_input` ve
`llm_output` olayları adaptör düzeyindeki gözlemlerdir; Codex'in dahili istek veya Compaction yüklerinin
bayt bayt yakalamaları değildir.

Codex yerel `hook/started` ve `hook/completed` uygulama sunucusu bildirimleri,
trajektori ve hata ayıklama için `codex_app_server.hook` aracı olayları olarak
yansıtılır. Bunlar OpenClaw Plugin hook'larını çağırmaz.

## V1 destek sözleşmesi

Codex modu, altında farklı bir model çağrısı bulunan PI değildir. Codex yerel model döngüsünün daha fazlasına sahiptir ve OpenClaw Plugin ve oturum yüzeylerini
bu sınır çevresinde uyarlar.

Codex çalışma zamanı v1'de desteklenenler:

| Yüzey                                        | Destek                                                                               | Neden                                                                                                                                                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex üzerinden OpenAI model döngüsü          | Desteklenir                                                                          | Codex app-server, OpenAI turunu, yerel iş parçacığı sürdürmeyi ve yerel araç devamını yönetir.                                                                                                             |
| OpenClaw kanal yönlendirme ve teslimi         | Desteklenir                                                                          | Telegram, Discord, Slack, WhatsApp, iMessage ve diğer kanallar model çalışma zamanının dışında kalır.                                                                                                      |
| OpenClaw dinamik araçları                     | Desteklenir                                                                          | Codex, OpenClaw'dan bu araçları yürütmesini ister; böylece OpenClaw yürütme yolunda kalır.                                                                                                                 |
| İstem ve bağlam Plugin'leri                   | Desteklenir                                                                          | OpenClaw, iş parçacığını başlatmadan veya sürdürmeden önce istem katmanlarını oluşturur ve bağlamı Codex turuna yansıtır.                                                                                  |
| Bağlam motoru yaşam döngüsü                   | Desteklenir                                                                          | Birleştirme, içe alma veya tur sonrası bakım ve bağlam motoru Compaction koordinasyonu Codex turları için çalışır.                                                                                        |
| Dinamik araç hook'ları                        | Desteklenir                                                                          | `before_tool_call`, `after_tool_call` ve araç sonucu ara yazılımları OpenClaw'a ait dinamik araçların çevresinde çalışır.                                                                                  |
| Yaşam döngüsü hook'ları                       | Bağdaştırıcı gözlemleri olarak desteklenir                                           | `llm_input`, `llm_output`, `agent_end`, `before_compaction` ve `after_compaction`, dürüst Codex modu yükleriyle tetiklenir.                                                                                |
| Nihai yanıt revizyon kapısı                   | Yerel hook aktarımı üzerinden desteklenir                                            | Codex `Stop`, `before_agent_finalize` öğesine aktarılır; `revise`, sonlandırmadan önce Codex'ten bir model geçişi daha ister.                                                                              |
| Yerel shell, patch ve MCP engelleme veya gözlemleme | Yerel hook aktarımı üzerinden desteklenir                                            | Codex `PreToolUse` ve `PostToolUse`, Codex app-server `0.125.0` veya daha yeni sürümlerde MCP yükleri dahil olmak üzere işlenen yerel araç yüzeyleri için aktarılır. Engelleme desteklenir; argüman yeniden yazma desteklenmez. |
| Yerel izin ilkesi                             | Codex app-server onayları ve uyumluluk yerel hook aktarımı üzerinden desteklenir     | Codex app-server onay istekleri, Codex incelemesinden sonra OpenClaw üzerinden yönlendirilir. `PermissionRequest` yerel hook aktarımı, Codex bunu guardian incelemesinden önce yaydığı için yerel onay modlarında isteğe bağlıdır. |
| App-server iz kaydı yakalama                  | Desteklenir                                                                          | OpenClaw, app-server'a gönderdiği isteği ve aldığı app-server bildirimlerini kaydeder.                                                                                                                     |

Codex çalışma zamanı v1'de desteklenmeyenler:

| Yüzey                                              | V1 sınırı                                                                                                                                       | Gelecek yol                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Yerel araç argümanı mutasyonu                       | Codex yerel araç öncesi hook'ları engelleyebilir, ancak OpenClaw Codex'e yerel araç argümanlarını yeniden yazmaz.                              | Değiştirilen araç girdisi için Codex hook/şema desteği gerekir.                           |
| Düzenlenebilir Codex yerel transkript geçmişi       | Codex kanonik yerel iş parçacığı geçmişine sahiptir. OpenClaw bir yansımaya sahiptir ve gelecekteki bağlamı yansıtabilir, ancak desteklenmeyen iç yapıları değiştirmemelidir. | Yerel iş parçacığı cerrahisi gerekirse açık Codex app-server API'leri ekleyin.            |
| Codex yerel araç kayıtları için `tool_result_persist` | Bu hook, Codex yerel araç kayıtlarını değil, OpenClaw'a ait transkript yazımlarını dönüştürür.                                                  | Dönüştürülmüş kayıtları yansıtabilir, ancak kanonik yeniden yazma için Codex desteği gerekir. |
| Zengin yerel Compaction meta verileri               | OpenClaw, Compaction başlangıcını ve tamamlanmasını gözlemler, ancak kararlı bir tutulan/atılan listesi, token deltası veya özet yükü almaz.    | Daha zengin Codex Compaction olayları gerekir.                                            |
| Compaction müdahalesi                               | Mevcut OpenClaw Compaction hook'ları Codex modunda bildirim düzeyindedir.                                                                       | Plugin'lerin yerel Compaction'ı veto etmesi veya yeniden yazması gerekiyorsa Codex ön/son Compaction hook'ları ekleyin. |
| Bayt bayt model API isteği yakalama                 | OpenClaw app-server isteklerini ve bildirimlerini yakalayabilir, ancak Codex çekirdeği nihai OpenAI API isteğini dahili olarak oluşturur.       | Bir Codex model isteği izleme olayı veya hata ayıklama API'si gerekir.                   |

## Araçlar, medya ve Compaction

Codex harness yalnızca düşük düzeyli gömülü aracı yürütücüsünü değiştirir.

OpenClaw araç listesini oluşturmaya ve dinamik araç sonuçlarını harness'tan almaya devam eder. Metin, görüntüler, video, müzik, TTS, onaylar ve mesajlaşma aracı çıktısı normal OpenClaw teslim yolu üzerinden devam eder.

Yerel hook aktarımı kasıtlı olarak geneldir, ancak v1 destek sözleşmesi OpenClaw'ın test ettiği Codex yerel araç ve izin yollarıyla sınırlıdır. Codex çalışma zamanında bu, shell, patch ve MCP `PreToolUse`, `PostToolUse` ve `PermissionRequest` yüklerini içerir. Çalışma zamanı sözleşmesi adını verene kadar gelecekteki her Codex hook olayının bir OpenClaw Plugin yüzeyi olduğunu varsaymayın.

`PermissionRequest` için OpenClaw yalnızca ilke karar verdiğinde açık izin veya ret kararları döndürür. Kararsız sonuç izin değildir. Codex bunu hook kararı yok olarak ele alır ve kendi guardian veya kullanıcı onayı yoluna düşer. Codex app-server onay modları varsayılan olarak bu yerel hook'u atlar; bu paragraf `permission_request`, `nativeHookRelay.events` içine açıkça dahil edildiğinde veya bir uyumluluk çalışma zamanı bunu yüklediğinde geçerlidir. Bir operatör bir Codex yerel izin isteği için `allow-always` seçtiğinde, OpenClaw bu tam sağlayıcı/oturum/araç girdisi/cwd parmak izini sınırlı bir oturum penceresi için hatırlar. Hatırlanan karar kasıtlı olarak yalnızca tam eşleşmelidir: değişen bir komut, argümanlar, araç yükü veya cwd yeni bir onay oluşturur.

Codex MCP araç onayı istemleri, Codex `_meta.codex_approval_kind` değerini `"mcp_tool_call"` olarak işaretlediğinde OpenClaw'ın Plugin onay akışı üzerinden yönlendirilir. Codex `request_user_input` istemleri kaynak sohbete geri gönderilir ve sıradaki sonraki takip mesajı ekstra bağlam olarak yönlendirilmek yerine bu yerel sunucu isteğini yanıtlar. Diğer MCP isteme istekleri yine kapalı başarısız olur.

Etkin çalışma kuyruğu yönlendirmesi Codex app-server `turn/steer` üzerine eşlenir. Varsayılan `messages.queue.mode: "steer"` ile OpenClaw, kuyruğa alınmış sohbet mesajlarını yapılandırılmış sessiz pencere için toplar ve bunları varış sırasına göre tek bir `turn/steer` isteği olarak gönderir. Eski `queue` modu ayrı `turn/steer` istekleri gönderir. Codex inceleme ve manuel Compaction turları aynı tur yönlendirmesini reddedebilir; bu durumda OpenClaw, seçilen mod geri dönüşe izin verdiğinde takip kuyruğunu kullanır. Bkz. [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

Seçilen model Codex harness kullandığında, yerel iş parçacığı Compaction işlemi Codex app-server'a devredilir. OpenClaw kanal geçmişi, arama, `/new`, `/reset` ve gelecekteki model veya harness geçişleri için bir transkript yansısı tutar. Yansı, kullanıcı istemini, nihai asistan metnini ve app-server bunları yaydığında hafif Codex akıl yürütme veya plan kayıtlarını içerir. Bugün OpenClaw yalnızca yerel Compaction başlangıç ve tamamlama sinyallerini kaydeder. Henüz insan tarafından okunabilir bir Compaction özeti veya Codex'in Compaction sonrasında hangi girdileri tuttuğuna dair denetlenebilir bir liste sunmaz.

Kanonik yerel iş parçacığının sahibi Codex olduğu için `tool_result_persist` şu anda Codex yerel araç sonucu kayıtlarını yeniden yazmaz. Yalnızca OpenClaw, OpenClaw'a ait bir oturum transkripti araç sonucu yazarken uygulanır.

Medya üretimi PI gerektirmez. Görüntü, video, müzik, PDF, TTS ve medya anlama `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` ve `messages.tts` gibi eşleşen sağlayıcı/model ayarlarını kullanmaya devam eder.

## Sorun giderme

**Codex normal bir `/model` sağlayıcısı olarak görünmüyor:** yeni yapılandırmalar için bu beklenir. `agentRuntime.id: "codex"` ile bir `openai/gpt-*` modeli (veya eski bir `codex/*` ref) seçin, `plugins.entries.codex.enabled` öğesini etkinleştirin ve `plugins.allow` öğesinin `codex` değerini hariç tutup tutmadığını kontrol edin.

**OpenClaw, Codex yerine PI kullanıyor:** `agentRuntime.id: "auto"` hâlâ hiçbir Codex harness çalışmayı üstlenmediğinde uyumluluk arka ucu olarak PI kullanabilir. Test sırasında Codex seçimini zorlamak için `agentRuntime.id: "codex"` ayarlayın. Zorlanmış bir Codex çalışma zamanı PI'a geri dönmek yerine başarısız olur. Codex app-server seçildiğinde, hataları doğrudan yüzeye çıkar.

**App-server reddediliyor:** Codex'i yükseltin; app-server el sıkışması `0.125.0` veya daha yeni bir sürüm bildirmelidir. `0.125.0-alpha.2` veya `0.125.0+custom` gibi aynı sürüm ön yayınları veya derleme sonekli sürümler reddedilir; çünkü OpenClaw'ın test ettiği kararlı protokol tabanı `0.125.0` sürümüdür.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs` değerini düşürün veya keşfi devre dışı bırakın.

**WebSocket taşıması hemen başarısız oluyor:** `appServer.url`, `authToken` değerlerini ve uzak app-server'ın aynı Codex app-server protokol sürümünü konuştuğunu kontrol edin.

**Codex olmayan bir model PI kullanıyor:** bu, o aracı için `agentRuntime.id: "codex"` zorlamadığınız veya eski bir `codex/*` ref seçmediğiniz sürece beklenir. Düz `openai/gpt-*` ve diğer sağlayıcı ref'leri `auto` modunda normal sağlayıcı yollarında kalır. `agentRuntime.id: "codex"` zorlarsanız, o aracı için her gömülü turun Codex destekli bir OpenAI modeli olması gerekir.

**Computer Use yüklü ancak araçlar çalışmıyor:** yeni bir oturumdan
`/codex computer-use status` komutunu kontrol edin. Bir araç
`Native hook relay unavailable` bildirirse `/new` veya `/reset` kullanın; sorun sürerse eski native hook kayıtlarını temizlemek için
Gateway'i yeniden başlatın. `computer-use.list_apps`
zaman aşımına uğrarsa Codex Computer Use veya Codex Desktop'ı yeniden başlatıp tekrar deneyin.

## İlgili

- [Ajan harness Pluginleri](/tr/plugins/sdk-agent-harness)
- [Ajan çalışma zamanları](/tr/concepts/agent-runtimes)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [Durum](/tr/cli/status)
- [Plugin hook'ları](/tr/plugins/hooks)
- [Yapılandırma referansı](/tr/gateway/configuration-reference)
- [Test](/tr/help/testing-live#live-codex-app-server-harness-smoke)
