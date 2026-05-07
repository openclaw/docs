---
read_when:
    - Paketle birlikte gelen Codex uygulama sunucusu test koşumunu kullanmak istiyorsunuz
    - Codex çalışma düzeneği yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex dağıtımlarının Pi'ye geri dönmek yerine başarısız olmasını istiyorsunuz
summary: Birlikte gelen Codex app-server test düzeneği üzerinden OpenClaw gömülü ajan turlarını çalıştırın
title: Codex çalışma düzeneği
x-i18n:
    generated_at: "2026-05-07T13:23:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9bc5e78b1c6737dad7037ef77cfa9f16d480f02671363591509696d232e2d52e
    source_path: plugins/codex-harness.md
    workflow: 16
---

Birlikte gelen `codex` Plugin'i, OpenClaw'ın gömülü ajan turlarını yerleşik PI çalıştırma düzeneği yerine
Codex app-server üzerinden çalıştırmasını sağlar.

Bunu, düşük düzeyli ajan oturumunu Codex'in yönetmesini istediğinizde kullanın:
model keşfi, yerel ileti dizisi sürdürme, yerel compaction ve app-server yürütmesi.
OpenClaw sohbet kanallarını, oturum dosyalarını, model seçimini, araçları,
onayları, medya teslimini ve görünür konuşma dökümü yansısını yönetmeye devam eder.

Bir kaynak sohbet turu Codex çalıştırma düzeneği üzerinden çalıştığında, dağıtım
`messages.visibleReplies` değerini açıkça yapılandırmadıysa görünür yanıtlar varsayılan olarak
OpenClaw `message` aracını kullanır. Ajan yine de Codex turunu özel olarak
tamamlayabilir; kanala yalnızca `message(action="send")` çağırdığında gönderi yapar.
Eski otomatik teslim yolunda doğrudan sohbet son yanıtlarını korumak için
`messages.visibleReplies: "automatic"` ayarlayın.

Codex heartbeat turları da varsayılan olarak `heartbeat_respond` aracını alır; böylece
ajan, uyanmanın sessiz kalıp kalmaması veya bildirim göndermesi gerekip gerekmediğini bu
denetim akışını son metne kodlamadan kaydedebilir.

Heartbeat'e özgü inisiyatif rehberliği, heartbeat turunun kendisinde bir Codex işbirliği modu
geliştirici talimatı olarak gönderilir. Olağan sohbet turları, normal çalışma zamanı
istemlerinde heartbeat felsefesini taşımak yerine Codex Default modunu geri yükler.

Kendinizi konumlandırmaya çalışıyorsanız
[Agent çalışma zamanları](/tr/concepts/agent-runtimes) ile başlayın. Kısa sürüm şudur:
`openai/gpt-5.5` model başvurusudur, `codex` çalışma zamanıdır ve Telegram,
Discord, Slack veya başka bir kanal iletişim yüzeyi olarak kalır.

## Hızlı yapılandırma

"OpenClaw içinde Codex" isteyen çoğu kullanıcı şu yolu ister: Bir ChatGPT/Codex
aboneliğiyle oturum açın, ardından gömülü ajan turlarını yerel Codex app-server
çalışma zamanı üzerinden çalıştırın. Model başvurusu yine `openai/gpt-*` olarak
standart kalır; abonelik kimlik doğrulaması bir `openai-codex/*` model ön ekinden
değil, Codex hesabından/profilinden gelir.

Henüz yapmadıysanız önce Codex OAuth ile oturum açın:

```bash
openclaw models auth login --provider openai-codex
```

Ardından birlikte gelen `codex` Plugin'ini etkinleştirin ve Codex çalışma zamanını zorunlu kılın:

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

Yapılandırmanız `plugins.allow` kullanıyorsa `codex` öğesini oraya da ekleyin:

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

Yapılandırmada `openai-codex/gpt-*` kullanmayın. Bu ön ek, `openclaw doctor --fix`
tarafından birincil modeller, yedekler, heartbeat/alt ajan/compaction geçersiz kılmaları,
hook'lar, kanal geçersiz kılmaları ve eskimiş kalıcı oturum rota sabitlemeleri genelinde
`openai/gpt-*` olarak yeniden yazılan eski bir yoldur.

## Bu Plugin neyi değiştirir

Birlikte gelen `codex` Plugin'i birkaç ayrı yetenek sağlar:

| Yetenek                           | Nasıl kullanırsınız                                  | Ne yapar                                                                       |
| --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Yerel gömülü çalışma zamanı       | `agentRuntime.id: "codex"`                          | OpenClaw gömülü ajan turlarını Codex app-server üzerinden çalıştırır.          |
| Yerel sohbet denetim komutları    | `/codex bind`, `/codex resume`, `/codex steer`, ... | Mesajlaşma konuşmasından Codex app-server ileti dizilerini bağlar ve yönetir.  |
| Codex app-server sağlayıcısı/kataloğu | `codex` iç işleyişi, çalıştırma düzeneği üzerinden sunulur | Çalışma zamanının app-server modellerini keşfetmesini ve doğrulamasını sağlar. |
| Codex medya anlama yolu           | `codex/*` görüntü modeli uyumluluk yolları          | Desteklenen görüntü anlama modelleri için sınırlı Codex app-server turları çalıştırır. |
| Yerel hook aktarımı               | Codex'e yerel olaylar çevresinde Plugin hook'ları   | OpenClaw'ın desteklenen Codex'e yerel araç/sonlandırma olaylarını gözlemlemesini/engellemesini sağlar. |

Plugin'i etkinleştirmek bu yetenekleri kullanılabilir hale getirir. Şunları **yapmaz**:

- görüntüler, embedding'ler, konuşma veya gerçek zamanlı gibi doğrudan OpenAI API anahtarı yüzeylerini değiştirme
- `openclaw doctor --fix` olmadan `openai-codex/*` model başvurularını dönüştürme
- ACP/acpx'i varsayılan Codex yolu yapma
- zaten PI çalışma zamanı kaydetmiş mevcut oturumları anında değiştirme
- OpenClaw kanal teslimini, oturum dosyalarını, kimlik doğrulama profili depolamasını veya mesaj yönlendirmeyi değiştirme

Aynı Plugin, yerel `/codex` sohbet denetim komut yüzeyini de yönetir. Plugin
etkinse ve kullanıcı sohbetten Codex ileti dizilerini bağlama, sürdürme, yönlendirme,
durdurma veya inceleme isterse ajanlar ACP yerine `/codex ...` tercih etmelidir. ACP,
kullanıcı ACP/acpx istediğinde veya ACP Codex bağdaştırıcısını test ettiğinde açık
yedek olarak kalır.

Yerel Codex turları, genel uyumluluk katmanı olarak OpenClaw Plugin hook'larını korur.
Bunlar süreç içi OpenClaw hook'larıdır, Codex `hooks.json` komut hook'ları değildir:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- yansıtılmış konuşma dökümü kayıtları için `before_message_write`
- Codex `Stop` aktarımı üzerinden `before_agent_finalize`
- `agent_end`

Plugin'ler ayrıca, OpenClaw aracı çalıştırdıktan sonra ve sonuç Codex'e
döndürülmeden önce OpenClaw dinamik araç sonuçlarını yeniden yazmak için çalışma
zamanından bağımsız araç sonucu ara yazılımı kaydedebilir. Bu, OpenClaw'a ait
konuşma dökümü araç sonucu yazımlarını dönüştüren genel `tool_result_persist`
Plugin hook'undan ayrıdır.

Plugin hook semantiğinin kendisi için [Plugin hook'ları](/tr/plugins/hooks)
ve [Plugin koruma davranışı](/tr/tools/plugin) bölümlerine bakın.

OpenAI ajan model başvuruları varsayılan olarak çalıştırma düzeneğini kullanır. Yeni
yapılandırmalar OpenAI model başvurularını `openai/gpt-*` olarak standart tutmalıdır;
`agentRuntime.id: "codex"` hâlâ geçerlidir ancak OpenAI ajan turları için artık gerekli
değildir. Eski `codex/*` model başvuruları uyumluluk için çalıştırma düzeneğini hâlâ
otomatik seçer, ancak çalışma zamanı destekli eski sağlayıcı ön ekleri normal
model/sağlayıcı seçenekleri olarak gösterilmez.

Yapılandırılmış herhangi bir model rotası hâlâ `openai-codex/*` ise
`openclaw doctor --fix` bunu `openai/*` olarak yeniden yazar. Eşleşen ajan rotaları için
ajan çalışma zamanını `codex` olarak ayarlar ve mevcut `openai-codex` kimlik doğrulama
profili geçersiz kılmalarını korur.

## Rota haritası

Yapılandırmayı değiştirmeden önce bu tabloyu kullanın:

| İstenen davranış                                      | Model başvurusu           | Çalışma zamanı yapılandırması             | Kimlik doğrulama/profil rotası | Beklenen durum etiketi      |
| ----------------------------------------------------- | ------------------------- | ----------------------------------------- | ------------------------------ | --------------------------- |
| Yerel Codex çalışma zamanı ile ChatGPT/Codex aboneliği | `openai/gpt-*`            | atlanmış veya `agentRuntime.id: "codex"`  | Codex OAuth veya Codex hesabı  | `Runtime: OpenAI Codex`     |
| Ajan modelleri için OpenAI API anahtarı kimlik doğrulaması | `openai/gpt-*`        | atlanmış veya `agentRuntime.id: "codex"`  | `openai-codex` API anahtarı profili | `Runtime: OpenAI Codex` |
| Doctor onarımı gerektiren eski yapılandırma            | `openai-codex/gpt-*`      | `codex` olarak onarılır                   | Mevcut yapılandırılmış kimlik doğrulama | `doctor --fix` sonrası yeniden kontrol edin |
| Koruyucu otomatik modlu karma sağlayıcılar             | sağlayıcıya özgü başvurular | `agentRuntime.id: "auto"`               | Seçili sağlayıcı başına        | Seçili çalışma zamanına bağlıdır |
| Açık Codex ACP bağdaştırıcı oturumu                    | ACP istemine/modeline bağlı | `sessions_spawn` ile `runtime: "acp"`   | ACP arka uç kimlik doğrulaması | ACP görev/oturum durumu     |

Önemli ayrım sağlayıcı ile çalışma zamanı arasındadır:

- `openai-codex/*`, doctor tarafından yeniden yazılan eski bir rotadır.
- `agentRuntime.id: "codex"` Codex çalıştırma düzeneğini gerektirir ve kullanılamıyorsa kapalı şekilde başarısız olur.
- `agentRuntime.id: "auto"` kayıtlı çalıştırma düzeneklerinin eşleşen sağlayıcı rotalarını sahiplenmesine izin verir; OpenAI ajan başvuruları PI yerine Codex'e çözümlenir.
- `/codex ...`, "bu sohbet hangi yerel Codex konuşmasını bağlamalı veya denetlemeli?" sorusunu yanıtlar.
- ACP, "acpx hangi harici çalıştırma düzeneği sürecini başlatmalı?" sorusunu yanıtlar.

## Doğru model ön ekini seçin

OpenAI ailesi rotaları ön eke özeldir. Yaygın abonelik artı yerel Codex çalışma zamanı
kurulumu için `openai/*` kullanın.
`openai-codex/*` öğesini doctor tarafından yeniden yazılması gereken eski yapılandırma olarak değerlendirin:

| Model başvurusu                                  | Çalışma zamanı yolu                       | Ne zaman kullanılır                                                |
| ------------------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------ |
| `openai/gpt-5.4`                                 | Ajan turları için Codex app-server çalıştırma düzeneği | OpenAI ajan modellerini Codex üzerinden istiyorsunuz.              |
| `openai-codex/gpt-5.5`                           | Doctor tarafından onarılan eski rota       | Eski yapılandırmadasınız; yeniden yazmak için `openclaw doctor --fix` çalıştırın. |
| `openai/gpt-5.5` + `openai-codex` API anahtarı profili | Codex app-server çalıştırma düzeneği | Bir OpenAI ajan modeli için API anahtarı kimlik doğrulaması istiyorsunuz. |

GPT-5.5, hesabınız bunları sunduğunda hem doğrudan OpenAI API anahtarı hem de Codex
abonelik rotalarında görünebilir. Yerel Codex çalışma zamanı için Codex app-server
çalıştırma düzeneğiyle `openai/gpt-5.5` kullanın veya doğrudan API anahtarı trafiği
için Codex çalışma zamanı geçersiz kılması olmadan `openai/gpt-5.5` kullanın.

Eski `codex/gpt-*` başvuruları uyumluluk takma adları olarak kabul edilmeye devam eder.
Doctor uyumluluk geçişi, eski çalışma zamanı başvurularını standart model başvuruları
olarak yeniden yazar ve çalışma zamanı politikasını ayrıca kaydeder. Yeni yerel
app-server çalıştırma düzeneği yapılandırmaları `openai/gpt-*` artı
`agentRuntime.id: "codex"` kullanmalıdır.

`agents.defaults.imageModel` aynı ön ek ayrımını izler. Normal OpenAI rotası için
`openai/gpt-*`, görüntü anlama sınırlı bir Codex app-server turu üzerinden çalışmalıysa
`codex/gpt-*` kullanın. `openai-codex/gpt-*` kullanmayın; doctor bu eski ön eki
`openai/gpt-*` olarak yeniden yazar. Codex app-server modeli görüntü girişi desteği
ilan etmelidir; yalnızca metin destekleyen Codex modelleri medya turu başlamadan önce
başarısız olur.

Geçerli oturumun etkin çalıştırma düzeneğini doğrulamak için `/status` kullanın. Seçim
şaşırtıcıysa `agents/harness` alt sistemi için hata ayıklama günlüklerini etkinleştirin
ve Gateway'in yapılandırılmış `agent harness selected` kaydını inceleyin. Bu kayıt,
seçili çalıştırma düzeneği kimliğini, seçim nedenini, çalışma zamanı/yedek politikasını
ve `auto` modunda her Plugin adayının destek sonucunu içerir.

### Doctor uyarıları ne anlama gelir

`openclaw doctor`, yapılandırılmış model başvuruları veya kalıcı oturum rota durumu
hâlâ `openai-codex/*` kullandığında uyarır. `openclaw doctor --fix` bu rotaları şunlara
yeniden yazar:

- `openai/<model>`
- `agentRuntime.id: "codex"`

`codex` rotası yerel Codex çalıştırma düzeneğini zorunlu kılar. OpenAI ajan modeli
turları için PI çalışma zamanı yapılandırmasına izin verilmez.
Doctor ayrıca, eski konuşmalar kaldırılan rotada sıkışıp kalmasın diye keşfedilen
ajan oturum depolarındaki eskimiş kalıcı oturum sabitlemelerini onarır.

Çalıştırma düzeneği seçimi canlı oturum denetimi değildir. Gömülü bir tur çalıştığında,
OpenClaw seçili çalıştırma düzeneği kimliğini o oturuma kaydeder ve aynı oturum kimliğindeki
sonraki turlarda bunu kullanmaya devam eder. Gelecekteki oturumların başka bir
çalıştırma düzeneği kullanmasını istediğinizde `agentRuntime` yapılandırmasını veya
`OPENCLAW_AGENT_RUNTIME` değerini değiştirin; mevcut bir konuşmayı PI ile Codex arasında
değiştirmeden önce yeni bir oturum başlatmak için `/new` veya `/reset` kullanın. Bu,
bir konuşma dökümünün iki uyumsuz yerel oturum sistemi üzerinden yeniden oynatılmasını
önler.

Çalıştırma düzeneği sabitlemeleri oluşturulmadan önce oluşturulan eski oturumlar,
konuşma dökümü geçmişleri olduğunda PI'ye sabitlenmiş kabul edilir. Yapılandırmayı
değiştirdikten sonra o konuşmayı Codex'e geçirmek için `/new` veya `/reset` kullanın.

`/status` etkin model çalışma zamanını gösterir. Varsayılan PI çalıştırma düzeneği
`Runtime: OpenClaw Pi Default` olarak, Codex app-server çalıştırma düzeneği ise
`Runtime: OpenAI Codex` olarak görünür.

## Gereksinimler

- Birlikte gelen `codex` Plugin'i kullanılabilir olan OpenClaw.
- Codex app-server `0.125.0` veya daha yeni. Birlikte gelen Plugin varsayılan olarak uyumlu bir Codex app-server ikili dosyasını yönetir; bu nedenle `PATH` üzerindeki yerel `codex` komutları normal harness başlangıcını etkilemez.
- App-server süreci veya OpenClaw'ın Codex kimlik doğrulama köprüsü için Codex kimlik doğrulamasının kullanılabilir olması. Yerel app-server başlatmaları her agent için OpenClaw tarafından yönetilen bir Codex ana dizini ve yalıtılmış bir alt `HOME` kullanır; bu yüzden varsayılan olarak kişisel `~/.codex` hesabınızı, skills, plugins, yapılandırmayı, thread durumunu veya yerel `$HOME/.agents/skills` dizinini okumaz.

Plugin, eski veya sürümsüz app-server el sıkışmalarını engeller. Bu, OpenClaw'ın test edildiği protokol yüzeyinde kalmasını sağlar.

Canlı ve Docker smoke testleri için kimlik doğrulama genellikle Codex CLI hesabından veya bir OpenClaw `openai-codex` kimlik doğrulama profilinden gelir. Yerel stdio app-server başlatmaları, hesap yoksa `CODEX_API_KEY` / `OPENAI_API_KEY` değerlerine de geri dönebilir.

## Çalışma alanı önyükleme dosyaları

Codex, yerel proje belgesi keşfi aracılığıyla `AGENTS.md` dosyasını kendisi işler. OpenClaw sentetik Codex proje belgesi dosyaları yazmaz veya persona dosyaları için Codex geri dönüş dosya adlarına bağlı değildir; çünkü Codex geri dönüşleri yalnızca `AGENTS.md` eksik olduğunda uygulanır.

OpenClaw çalışma alanı eşdeğerliği için Codex harness, diğer önyükleme dosyalarını (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` ve varsa `MEMORY.md`) çözer ve bunları `thread/start` ve `thread/resume` üzerinde Codex geliştirici yönergeleri aracılığıyla iletir. Bu, `AGENTS.md` dosyasını çoğaltmadan `SOUL.md` ve ilgili çalışma alanı persona/profil bağlamını yerel Codex davranış şekillendirme hattında görünür tutar.

## Diğer modellerin yanına Codex ekleyin

Aynı agent Codex ve Codex dışı provider modelleri arasında serbestçe geçiş yapacaksa `agentRuntime.id: "codex"` değerini global olarak ayarlamayın. Zorlanmış bir runtime, o agent veya oturum için gömülü her turn'e uygulanır. Bu runtime zorlanmışken bir Anthropic modeli seçerseniz OpenClaw yine Codex harness'ı dener ve o turn'ü sessizce PI üzerinden yönlendirmek yerine kapalı biçimde başarısız olur.

Bunun yerine şu yapılardan birini kullanın:

- Codex'i `agentRuntime.id: "codex"` ile ayrılmış bir agent üzerine koyun.
- Varsayılan agent'ı `agentRuntime.id: "auto"` üzerinde ve normal karma provider kullanımı için PI geri dönüşüyle tutun.
- Eski `codex/*` ref'lerini yalnızca uyumluluk için kullanın. Yeni yapılandırmalar `openai/*` ile açık bir Codex runtime politikasını tercih etmelidir.

Örneğin bu yapı, varsayılan agent'ı normal otomatik seçimde tutar ve ayrı bir Codex agent ekler:

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

- Varsayılan `main` agent, normal provider yolunu ve PI uyumluluk geri dönüşünü kullanır.
- `codex` agent, Codex app-server harness'ını kullanır.
- `codex` agent için Codex eksikse veya desteklenmiyorsa turn, sessizce PI kullanmak yerine başarısız olur.

## Agent komut yönlendirme

Agent'lar kullanıcı isteklerini yalnızca "Codex" kelimesine göre değil, amaca göre yönlendirmelidir:

| Kullanıcı şunu ister...                                | Agent şunu kullanmalıdır...                       |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Bu chat'i Codex'e bağla"                              | `/codex bind`                                    |
| "Codex thread `<id>` burada sürdür"                    | `/codex resume <id>`                             |
| "Codex thread'lerini göster"                           | `/codex threads`                                 |
| "Kötü bir Codex çalıştırması için destek raporu oluştur" | `/diagnostics [note]`                          |
| "Yalnızca bu ekli thread için Codex geri bildirimi gönder" | `/codex diagnostics [note]`                  |
| "ChatGPT/Codex aboneliğimi Codex runtime ile kullan"   | `openai/*`                                       |
| "Eski `openai-codex/*` yapılandırma/oturum pin'lerini onar" | `openclaw doctor --fix`                    |
| "Codex'i ACP/acpx üzerinden çalıştır"                  | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Bir thread içinde Claude Code/Gemini/OpenCode/Cursor başlat" | ACP/acpx, `/codex` değil ve yerel sub-agent'lar değil |

OpenClaw, ACP spawn yönlendirmesini agent'lara yalnızca ACP etkin, dispatch edilebilir ve yüklenmiş bir runtime backend tarafından destekleniyorsa duyurur. ACP kullanılabilir değilse sistem prompt'u ve Plugin skills, agent'a ACP yönlendirmesini öğretmemelidir.

## Yalnızca Codex dağıtımları

Her gömülü agent turn'ünün Codex kullandığını kanıtlamanız gerektiğinde Codex harness'ını zorlayın. Açık Plugin runtime'ları kapalı biçimde başarısız olur ve PI üzerinden asla sessizce yeniden denenmez:

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

Codex zorlandığında, Codex Plugin devre dışıysa, app-server çok eskiyse veya app-server başlatılamıyorsa OpenClaw erken başarısız olur.

## Agent başına Codex

Varsayılan agent normal otomatik seçimi korurken bir agent'ı yalnızca Codex yapabilirsiniz:

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

Agent'lar ve modeller arasında geçiş yapmak için normal oturum komutlarını kullanın. `/new` yeni bir OpenClaw oturumu oluşturur ve Codex harness gerektiğinde kendi sidecar app-server thread'ini oluşturur veya sürdürür. `/reset`, ilgili thread için OpenClaw oturum bağlamasını temizler ve bir sonraki turn'ün harness'ı mevcut yapılandırmadan yeniden çözmesini sağlar.

## Model keşfi

Varsayılan olarak Codex Plugin, app-server'dan kullanılabilir modelleri ister. Keşif başarısız olursa veya zaman aşımına uğrarsa şu modeller için birlikte gelen geri dönüş kataloğunu kullanır:

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

Başlangıcın Codex'i yoklamaktan kaçınmasını ve geri dönüş kataloğuna bağlı kalmasını istediğinizde keşfi devre dışı bırakın:

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

## App-server bağlantısı ve politikası

Varsayılan olarak Plugin, OpenClaw tarafından yönetilen Codex ikili dosyasını yerel olarak şununla başlatır:

```bash
codex app-server --listen stdio://
```

Yönetilen ikili dosya `codex` Plugin paketiyle gönderilir. Bu, app-server sürümünü yerelde ayrıca kurulu olabilecek Codex CLI yerine birlikte gelen Plugin'e bağlı tutar. `appServer.command` değerini yalnızca bilerek farklı bir çalıştırılabilir dosya kullanmak istediğinizde ayarlayın.

Varsayılan olarak OpenClaw, yerel Codex harness oturumlarını YOLO modunda başlatır: `approvalPolicy: "never"`, `approvalsReviewer: "user"` ve `sandbox: "danger-full-access"`. Bu, otonom Heartbeat'ler için kullanılan güvenilen yerel operatör duruşudur: Codex, yanıtlayacak kimsenin bulunmadığı yerel onay prompt'larında durmadan shell ve network araçlarını kullanabilir.

Codex guardian tarafından incelenen onaylara katılmak için `appServer.mode: "guardian"` ayarlayın:

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

Guardian modu, Codex'in yerel otomatik inceleme onay yolunu kullanır. Codex sandbox dışına çıkmayı, çalışma alanı dışına yazmayı veya network erişimi gibi izinler eklemeyi istediğinde, bu onay isteğini insan prompt'u yerine yerel inceleyiciye yönlendirir. İnceleyici, Codex'in risk çerçevesini uygular ve belirli isteği onaylar ya da reddeder. YOLO modundan daha fazla koruma istediğiniz ama yine de unattended agent'ların ilerleme kaydetmesine ihtiyaç duyduğunuzda Guardian kullanın.

`guardian` hazır ayarı `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` ve `sandbox: "workspace-write"` değerlerine genişler. Tekil politika alanları yine de `mode` değerini geçersiz kılar; böylece gelişmiş dağıtımlar hazır ayarı açık seçimlerle karıştırabilir. Eski `guardian_subagent` inceleyici değeri hâlâ uyumluluk alias'ı olarak kabul edilir, ancak yeni yapılandırmalar `auto_review` kullanmalıdır.

Zaten çalışan bir app-server için WebSocket taşımasını kullanın:

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

Stdio app-server başlatmaları varsayılan olarak OpenClaw'ın süreç ortamını devralır, ancak OpenClaw Codex app-server hesap köprüsüne sahip olur ve hem `CODEX_HOME` hem de `HOME` değerlerini o agent'ın OpenClaw durumu altındaki agent başına dizinlere ayarlar. Codex'in kendi skill yükleyicisi `$CODEX_HOME/skills` ve `$HOME/.agents/skills` dizinlerini okur; bu nedenle yerel app-server başlatmaları için her iki değer de yalıtılır. Bu, Codex'e özgü skills, plugins, yapılandırma, hesaplar ve thread durumunun operatörün kişisel Codex CLI ana dizininden sızmak yerine OpenClaw agent kapsamında kalmasını sağlar.

OpenClaw Plugin'leri ve OpenClaw skill snapshot'ları yine de OpenClaw'ın kendi Plugin registry'si ve skill yükleyicisi üzerinden akar. Kişisel Codex CLI varlıkları akmaz. Bir OpenClaw agent'ın parçası olması gereken yararlı Codex CLI skills veya plugins varsa bunları açıkça envantere alın:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex migration provider, skills'i mevcut OpenClaw agent çalışma alanına kopyalar. Codex yerel plugins, hooks ve yapılandırma dosyaları otomatik olarak etkinleştirilmek yerine manuel inceleme için raporlanır veya arşivlenir; çünkü bunlar komutlar çalıştırabilir, MCP sunucuları açığa çıkarabilir veya kimlik bilgileri taşıyabilir.

Kimlik doğrulama şu sırayla seçilir:

1. Agent için açık bir OpenClaw Codex kimlik doğrulama profili.
2. App-server'ın o agent'ın Codex ana dizinindeki mevcut hesabı.
3. Yalnızca yerel stdio app-server başlatmaları için, app-server hesabı yoksa ve OpenAI kimlik doğrulaması hâlâ gerekiyorsa önce `CODEX_API_KEY`, sonra `OPENAI_API_KEY`.

OpenClaw ChatGPT aboneliği tarzında bir Codex kimlik doğrulama profili gördüğünde, başlatılan Codex alt sürecinden `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini kaldırır. Bu, Gateway düzeyi API anahtarlarını embeddings veya doğrudan OpenAI modelleri için kullanılabilir tutarken, yerel Codex app-server turn'lerinin yanlışlıkla API üzerinden ücretlendirilmesini önler. Açık Codex API anahtarı profilleri ve yerel stdio env-key geri dönüşü, devralınmış alt süreç ortamı yerine app-server oturum açmasını kullanır. WebSocket app-server bağlantıları Gateway env API-key geri dönüşünü almaz; açık bir kimlik doğrulama profili veya uzak app-server'ın kendi hesabını kullanın.

Bir dağıtımın ek ortam yalıtımına ihtiyacı varsa bu değişkenleri `appServer.clearEnv` değerine ekleyin:

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

Codex dinamik araçları varsayılan olarak `native-first` profilini kullanır. Bu modda
OpenClaw, Codex'e özgü çalışma alanı işlemlerinin kopyası olan dinamik araçları
açığa çıkarmaz: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` ve
`update_plan`. Mesajlaşma, oturumlar, medya, Cron, tarayıcı, node'lar, Gateway,
`heartbeat_respond` ve `web_search` gibi OpenClaw entegrasyon araçları
kullanılabilir kalır.

Desteklenen üst düzey Codex Plugin alanları:

| Alan                       | Varsayılan       | Anlam                                                                                           |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Tüm OpenClaw dinamik araç setini Codex app-server'a açığa çıkarmak için `"openclaw-compat"` kullanın. |
| `codexDynamicToolsExclude` | `[]`             | Codex app-server turlarından çıkarılacak ek OpenClaw dinamik araç adları.                       |

Desteklenen `appServer` alanları:

| Alan                          | Varsayılan                               | Anlam                                                                                                                                                                                                                               |
| ----------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                | `"stdio"` Codex'i başlatır; `"websocket"` `url`'ye bağlanır.                                                                                                                                                                       |
| `command`                     | yönetilen Codex ikili dosyası            | stdio aktarımı için yürütülebilir dosya. Yönetilen ikili dosyayı kullanmak için ayarlanmamış bırakın; yalnızca açık bir geçersiz kılma için ayarlayın.                                                                              |
| `args`                        | `["app-server", "--listen", "stdio://"]` | stdio aktarımı için argümanlar.                                                                                                                                                                                                    |
| `url`                         | ayarlanmamış                             | WebSocket app-server URL'si.                                                                                                                                                                                                       |
| `authToken`                   | ayarlanmamış                             | WebSocket aktarımı için Bearer token.                                                                                                                                                                                              |
| `headers`                     | `{}`                                     | Ek WebSocket üstbilgileri.                                                                                                                                                                                                         |
| `clearEnv`                    | `[]`                                     | OpenClaw devralınan ortamını oluşturduktan sonra başlatılan stdio app-server işleminden kaldırılan ek ortam değişkeni adları. `CODEX_HOME` ve `HOME`, yerel başlatmalarda OpenClaw'ın ajan başına Codex yalıtımı için ayrılmıştır. |
| `requestTimeoutMs`            | `60000`                                  | app-server kontrol düzlemi çağrıları için zaman aşımı.                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                  | OpenClaw `turn/completed` beklerken tur kapsamlı Codex app-server isteğinden sonra sessiz pencere. Yavaş araç sonrası veya yalnızca durum sentezi aşamaları için bunu yükseltin.                                                   |
| `mode`                        | `"yolo"`                                 | YOLO veya guardian incelemeli yürütme için ön ayar.                                                                                                                                                                                |
| `approvalPolicy`              | `"never"`                                | İş parçacığı başlatma/sürdürme/tur işlemine gönderilen yerel Codex onay ilkesi.                                                                                                                                                    |
| `sandbox`                     | `"danger-full-access"`                   | İş parçacığı başlatma/sürdürme işlemine gönderilen yerel Codex sandbox modu.                                                                                                                                                       |
| `approvalsReviewer`           | `"user"`                                 | Codex'in yerel onay istemlerini incelemesine izin vermek için `"auto_review"` kullanın. `guardian_subagent` eski bir takma ad olarak kalır.                                                                                        |
| `serviceTier`                 | ayarlanmamış                             | İsteğe bağlı Codex app-server hizmet katmanı: `"fast"`, `"flex"` veya `null`. Geçersiz eski değerler yok sayılır.                                                                                                                  |

OpenClaw'a ait dinamik araç çağrıları `appServer.requestTimeoutMs` değerinden
bağımsız olarak sınırlandırılır: her Codex `item/tool/call` isteği 30 saniye
içinde bir OpenClaw yanıtı almalıdır. Zaman aşımında OpenClaw, desteklendiği
yerlerde araç sinyalini iptal eder ve oturumu `processing` içinde bırakmak
yerine turun devam edebilmesi için Codex'e başarısız bir dinamik araç yanıtı
döndürür.

OpenClaw bir Codex tur kapsamlı app-server isteğine yanıt verdikten sonra,
harness ayrıca Codex'in yerel turu `turn/completed` ile bitirmesini bekler.
app-server bu yanıttan sonra `appServer.turnCompletionIdleTimeoutMs` boyunca
sessiz kalırsa OpenClaw en iyi çabayla Codex turunu keser, tanılama amaçlı bir
zaman aşımı kaydeder ve sonraki sohbet mesajlarının bayat bir yerel turun
arkasında kuyruğa alınmaması için OpenClaw oturum şeridini serbest bırakır. Aynı
tur için `rawResponseItem/completed` dahil herhangi bir terminal olmayan bildirim,
Codex turun hâlâ canlı olduğunu kanıtladığı için bu kısa bekçi zamanlayıcısını
devre dışı bırakır; daha uzun terminal bekçi zamanlayıcısı gerçekten takılmış
turları korumaya devam eder. Zaman aşımı tanılamaları, son app-server bildirim
yöntemini ve ham asistan yanıt öğeleri için öğe türünü, rolü, kimliği ve
sınırlandırılmış bir asistan metni önizlemesini içerir.

Yerel test için ortam geçersiz kılmaları kullanılabilir kalır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`, `appServer.command` ayarlanmamış olduğunda
yönetilen ikili dosyayı atlar.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırıldı. Bunun yerine
`plugins.entries.codex.config.appServer.mode: "guardian"` kullanın veya tek
seferlik yerel test için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın.
Yinelenebilir dağıtımlar için config tercih edilir, çünkü Plugin davranışını
Codex harness kurulumunun geri kalanıyla aynı incelenmiş dosyada tutar.

## Bilgisayar kullanımı

Computer Use kendi kurulum kılavuzunda ele alınır:
[Codex Computer Use](/tr/plugins/codex-computer-use).

Kısa sürüm: OpenClaw masaüstü denetim uygulamasını vendor etmez veya masaüstü
eylemlerini kendisi yürütmez. Codex app-server'ı hazırlar, `computer-use` MCP
sunucusunun kullanılabilir olduğunu doğrular ve ardından Codex modlu turlar
sırasında yerel MCP araç çağrılarını Codex'in işlemesine izin verir.

Codex marketplace akışı dışında doğrudan TryCua sürücü erişimi için
`cua-driver mcp`'yi `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`
ile kaydedin. Codex'e ait Computer Use ile doğrudan MCP kaydı arasındaki ayrım
için [Codex Computer Use](/tr/plugins/codex-computer-use) bölümüne bakın.

Minimal config:

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

Computer Use macOS'a özeldir ve Codex MCP sunucusunun uygulamaları denetleyebilmesi
için yerel işletim sistemi izinleri gerekebilir. `computerUse.enabled` true ise
ve MCP sunucusu kullanılamıyorsa Codex modlu turlar, yerel Computer Use araçları
olmadan sessizce çalışmak yerine iş parçacığı başlamadan önce başarısız olur.
Marketplace seçenekleri, uzak katalog sınırları, durum nedenleri ve sorun giderme
için [Codex Computer Use](/tr/plugins/codex-computer-use) bölümüne bakın.

`computerUse.autoInstall` true olduğunda, Codex henüz yerel bir marketplace
keşfetmemişse OpenClaw standart paketlenmiş Codex Desktop marketplace'ini
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` konumundan
kaydedebilir. Mevcut oturumların eski bir PI veya Codex iş parçacığı bağlamasını
korumaması için runtime veya Computer Use config değiştikten sonra `/new` ya da
`/reset` kullanın.

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

Açık üstbilgilerle uzak app-server:

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
Codex iş parçacığına eklendiğinde, sonraki tur seçili OpenAI modelini, sağlayıcıyı,
onay ilkesini, sandbox'ı ve hizmet katmanını app-server'a yeniden gönderir.
`openai/gpt-5.5` modelinden `openai/gpt-5.2` modeline geçmek iş parçacığı
bağlamasını korur ancak Codex'ten yeni seçilen modelle devam etmesini ister.

## Codex komutu

Paketlenmiş Plugin, `/codex` komutunu yetkili bir slash command olarak kaydeder.
Geneldir ve OpenClaw metin komutlarını destekleyen herhangi bir kanalda çalışır.

Yaygın biçimler:

- `/codex status` canlı app-server bağlantısını, modelleri, hesabı, hız sınırlarını, MCP sunucularını ve skills değerlerini gösterir.
- `/codex models` canlı Codex app-server modellerini listeler.
- `/codex threads [filter]` son Codex iş parçacıklarını listeler.
- `/codex resume <thread-id>` mevcut OpenClaw oturumunu var olan bir Codex iş parçacığına bağlar.
- `/codex compact` Codex app-server'dan bağlı iş parçacığını compact etmesini ister.
- `/codex review` bağlı iş parçacığı için Codex yerel incelemesini başlatır.
- `/codex diagnostics [note]` bağlı iş parçacığı için Codex tanılama geri bildirimi göndermeden önce sorar.
- `/codex computer-use status` yapılandırılmış Computer Use plugin'ini ve MCP sunucusunu kontrol eder.
- `/codex computer-use install` yapılandırılmış Computer Use plugin'ini yükler ve MCP sunucularını yeniden yükler.
- `/codex account` hesap ve hız sınırı durumunu gösterir.
- `/codex mcp` Codex app-server MCP sunucusu durumunu listeler.
- `/codex skills` Codex app-server skills değerlerini listeler.

Codex bir kullanım sınırı hatası bildirdiğinde, Codex sağlamışsa OpenClaw bir sonraki
app-server sıfırlama zamanını içerir. Geçerli hesap ve hız sınırı pencerelerini incelemek için aynı
konuşmada `/codex account` kullanın.

### Yaygın hata ayıklama iş akışı

Codex destekli bir agent Telegram, Discord, Slack
veya başka bir kanalda beklenmedik bir şey yaptığında, sorunun yaşandığı konuşmadan başlayın:

1. `/diagnostics bad tool choice after image upload` komutunu veya gördüğünüz şeyi açıklayan başka kısa bir notu
   çalıştırın.
2. Tanılama isteğini bir kez onaylayın. Onay, yerel Gateway
   tanılama zip dosyasını oluşturur ve oturum Codex harness kullandığı için ilgili
   Codex geri bildirim paketini OpenAI sunucularına da gönderir.
3. Tamamlanan tanılama yanıtını hata raporuna veya destek iş parçacığına kopyalayın.
   Bu yanıtta yerel paket yolu, gizlilik özeti, OpenClaw oturum kimlikleri,
   Codex iş parçacığı kimlikleri ve her Codex iş parçacığı için bir `Inspect locally` satırı bulunur.
4. Çalıştırmayı kendiniz hata ayıklamak isterseniz, yazdırılan `Inspect locally`
   komutunu bir terminalde çalıştırın. `codex resume <thread-id>` gibi görünür ve
   yerel Codex iş parçacığını açar; böylece konuşmayı inceleyebilir, yerelde sürdürebilir
   veya Codex'e belirli bir aracı ya da planı neden seçtiğini sorabilirsiniz.

`/codex diagnostics [note]` komutunu yalnızca tam OpenClaw
Gateway tanılama paketi olmadan, o anda bağlı iş parçacığı için özel olarak Codex
geri bildirim yüklemesi istediğinizde kullanın. Çoğu destek raporu için `/diagnostics [note]`,
yerel Gateway durumunu ve Codex iş parçacığı kimliklerini tek bir yanıtta birbirine bağladığı için
daha iyi başlangıç noktasıdır. Tam gizlilik modeli ve grup sohbeti davranışı için
[Tanılama dışa aktarma](/tr/gateway/diagnostics) bölümüne bakın.

Core OpenClaw ayrıca genel Gateway tanılama komutu olarak yalnızca owner kullanımına açık
`/diagnostics [note]` komutunu sunar. Onay istemi hassas veri
önsözünü gösterir, [Diagnostics Export](/tr/gateway/diagnostics) bağlantısı verir ve
her seferinde açık exec onayı üzerinden `openclaw gateway diagnostics export --json`
ister. Tanılamayı allow-all kuralıyla onaylamayın. Onaydan sonra
OpenClaw, yerel paket yolu ve manifest özetiyle yapıştırılabilir bir rapor gönderir.
Etkin OpenClaw oturumu Codex harness kullanıyorsa, aynı
onay ilgili Codex geri bildirim paketlerinin OpenAI sunucularına gönderilmesine de
izin verir. Onay istemi Codex geri bildiriminin gönderileceğini söyler, ancak
onaydan önce Codex oturum veya iş parçacığı kimliklerini listelemez.

`/diagnostics` bir grup sohbetinde bir owner tarafından çağrılırsa, OpenClaw
paylaşılan kanalı temiz tutar: grup yalnızca kısa bir bildirim alırken
tanılama önsözü, onay istemleri ve Codex oturum/iş parçacığı kimlikleri
özel onay yolu üzerinden owner'a gönderilir. Özel owner yolu yoksa
OpenClaw grup isteğini reddeder ve owner'dan bunu bir DM üzerinden çalıştırmasını ister.

Onaylanan Codex yüklemesi Codex app-server `feedback/upload` çağrısını yapar ve
app-server'dan, mümkün olduğunda listelenen her iş parçacığı ve oluşturulan Codex alt iş parçacıkları için
günlükleri dahil etmesini ister. Yükleme, Codex'in normal geri bildirim yolu üzerinden OpenAI
sunucularına gider; Codex geri bildirimi bu app-server'da devre dışıysa komut
app-server hatasını döndürür. Tamamlanan tanılama yanıtı, gönderilen iş parçacıkları için
kanalları, OpenClaw oturum kimliklerini, Codex iş parçacığı kimliklerini ve yerel
`codex resume <thread-id>` komutlarını listeler. Onayı reddeder veya yok sayarsanız
OpenClaw bu Codex kimliklerini yazdırmaz. Bu yükleme yerel
Gateway tanılama dışa aktarımının yerine geçmez.

`/codex resume`, harness'ın normal dönüşler için kullandığı aynı sidecar bağlama dosyasını
yazar. Sonraki mesajda OpenClaw bu Codex iş parçacığını sürdürür, o anda
seçili OpenClaw modelini app-server'a geçirir ve genişletilmiş geçmişi
etkin tutar.

### CLI'dan bir Codex iş parçacığını inceleme

Hatalı bir Codex çalıştırmasını anlamanın en hızlı yolu çoğu zaman yerel Codex
iş parçacığını doğrudan açmaktır:

```sh
codex resume <thread-id>
```

Bunu, bir kanal konuşmasında hata fark ettiğinizde ve sorunlu Codex oturumunu
incelemek, yerelde sürdürmek veya Codex'e neden belirli bir araç ya da muhakeme
seçimi yaptığını sormak istediğinizde kullanın. En kolay yol genellikle önce
`/diagnostics [note]` çalıştırmaktır: onayladıktan sonra tamamlanan rapor her Codex
iş parçacığını listeler ve örneğin `codex resume <thread-id>` şeklinde bir
`Inspect locally` komutu yazdırır. Bu komutu doğrudan bir terminale kopyalayabilirsiniz.

Geçerli sohbet için `/codex binding` veya son Codex app-server iş parçacıkları için
`/codex threads [filter]` üzerinden de bir iş parçacığı kimliği alabilir, ardından kabuğunuzda aynı
`codex resume` komutunu çalıştırabilirsiniz.

Komut yüzeyi Codex app-server `0.125.0` veya daha yenisini gerektirir. Bir
gelecek veya özel app-server ilgili JSON-RPC yöntemini sunmuyorsa, tek tek
kontrol yöntemleri `unsupported by this Codex app-server` olarak bildirilir.

## Hook sınırları

Codex harness'ın üç hook katmanı vardır:

| Katman                                | Owner                    | Amaç                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw plugin hook'ları             | OpenClaw                 | PI ve Codex harness'ları genelinde ürün/plugin uyumluluğu.          |
| Codex app-server uzantı middleware'i  | OpenClaw bundled plugins | OpenClaw dinamik araçları etrafında tur başına bağdaştırıcı davranışı. |
| Codex yerel hook'ları                 | Codex                    | Codex config'inden düşük seviyeli Codex yaşam döngüsü ve yerel araç ilkesi. |

OpenClaw, OpenClaw plugin davranışını yönlendirmek için proje veya global Codex
`hooks.json` dosyalarını kullanmaz. Desteklenen yerel araç ve izin köprüsü için
OpenClaw, `PreToolUse`, `PostToolUse`, `PermissionRequest` ve `Stop` için
iş parçacığı başına Codex config enjekte eder. Codex app-server onayları etkin olduğunda
(`approvalPolicy` `"never"` değilse), varsayılan enjekte edilen yerel hook config'i
`PermissionRequest` değerini atlar; böylece Codex'in app-server inceleyicisi ve OpenClaw'ın onay
köprüsü, incelemeden sonra gerçek yükseltmeleri işler. Operatörler, uyumluluk
aktarımı gerektiğinde `nativeHookRelay.events` içine açıkça
`permission_request` ekleyebilir. `SessionStart` ve `UserPromptSubmit` gibi diğer Codex hook'ları
Codex düzeyinde kontroller olarak kalır; v1 sözleşmesinde OpenClaw plugin hook'ları olarak
sunulmazlar.

OpenClaw dinamik araçları için OpenClaw, Codex çağrıyı istedikten sonra aracı
çalıştırır; bu nedenle OpenClaw, sahip olduğu plugin ve middleware davranışını
harness bağdaştırıcısında tetikler. Codex yerel araçları için kanonik araç kaydının sahibi Codex'tir.
OpenClaw seçili olayları yansıtabilir, ancak Codex bu işlemi app-server veya yerel hook
geri çağrıları üzerinden sunmadığı sürece yerel Codex iş parçacığını
yeniden yazamaz.

Compaction ve LLM yaşam döngüsü projeksiyonları, yerel Codex hook komutlarından değil
Codex app-server bildirimlerinden ve OpenClaw bağdaştırıcı durumundan gelir.
OpenClaw'ın `before_compaction`, `after_compaction`, `llm_input` ve
`llm_output` olayları, Codex'in dahili isteği veya compaction payload'larının
bayt bayt yakalanmış halleri değil, bağdaştırıcı düzeyinde gözlemlerdir.

Codex yerel `hook/started` ve `hook/completed` app-server bildirimleri,
trajectory ve hata ayıklama için `codex_app_server.hook` agent olayları olarak
yansıtılır. Bunlar OpenClaw plugin hook'larını çağırmaz.

## V1 destek sözleşmesi

Codex modu, altında farklı bir model çağrısı olan PI değildir. Codex, yerel model
döngüsünün daha büyük bir kısmına sahiptir ve OpenClaw plugin ve oturum yüzeylerini
bu sınır etrafında uyarlar.

Codex runtime v1'de desteklenenler:

| Yüzey                                        | Destek                                                                               | Neden                                                                                                                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex üzerinden OpenAI model döngüsü          | Desteklenir                                                                          | Codex uygulama sunucusu OpenAI turunu, yerel iş parçacığı sürdürmeyi ve yerel araç devamını yönetir.                                                                                                                |
| OpenClaw kanal yönlendirme ve teslim          | Desteklenir                                                                          | Telegram, Discord, Slack, WhatsApp, iMessage ve diğer kanallar model çalışma zamanının dışında kalır.                                                                                                                |
| OpenClaw dinamik araçları                     | Desteklenir                                                                          | Codex, OpenClaw'dan bu araçları yürütmesini ister; bu nedenle OpenClaw yürütme yolunda kalır.                                                                                                                       |
| İstem ve bağlam Plugin'leri                   | Desteklenir                                                                          | OpenClaw, iş parçacığını başlatmadan veya sürdürmeden önce istem katmanlarını oluşturur ve bağlamı Codex turuna yansıtır.                                                                                            |
| Bağlam motoru yaşam döngüsü                   | Desteklenir                                                                          | Birleştirme, içe alma veya tur sonrası bakım ve bağlam motoru Compaction koordinasyonu Codex turları için çalışır.                                                                                                  |
| Dinamik araç kancaları                        | Desteklenir                                                                          | `before_tool_call`, `after_tool_call` ve araç sonucu ara katmanı OpenClaw'a ait dinamik araçların çevresinde çalışır.                                                                                               |
| Yaşam döngüsü kancaları                       | Bağdaştırıcı gözlemleri olarak desteklenir                                           | `llm_input`, `llm_output`, `agent_end`, `before_compaction` ve `after_compaction` dürüst Codex modu yükleriyle tetiklenir.                                                                                          |
| Son yanıt revizyon kapısı                     | Yerel kanca rölesi üzerinden desteklenir                                             | Codex `Stop`, `before_agent_finalize` öğesine iletilir; `revise`, sonlandırmadan önce Codex'ten bir model geçişi daha ister.                                                                                        |
| Yerel kabuk, yama ve MCP engelleme veya gözlem | Yerel kanca rölesi üzerinden desteklenir                                             | Codex `PreToolUse` ve `PostToolUse`, Codex uygulama sunucusu `0.125.0` veya daha yeni sürümlerde MCP yükleri dahil olmak üzere işlenmiş yerel araç yüzeyleri için iletilir. Engelleme desteklenir; argüman yeniden yazma desteklenmez. |
| Yerel izin ilkesi                             | Codex uygulama sunucusu onayları ve uyumluluk yerel kanca rölesi üzerinden desteklenir | Codex uygulama sunucusu onay istekleri, Codex incelemesinden sonra OpenClaw üzerinden yönlendirilir. `PermissionRequest` yerel kanca rölesi, Codex bunu koruyucu incelemesinden önce yaydığı için yerel onay modlarında isteğe bağlıdır. |
| Uygulama sunucusu yörünge yakalama            | Desteklenir                                                                          | OpenClaw, uygulama sunucusuna gönderdiği isteği ve aldığı uygulama sunucusu bildirimlerini kaydeder.                                                                                                                |

Codex çalışma zamanı v1'de desteklenmeyenler:

| Yüzey                                               | V1 sınırı                                                                                                                                       | Gelecek yol                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Yerel araç argüman mutasyonu                        | Codex yerel araç öncesi kancaları engelleyebilir, ancak OpenClaw Codex'e yerel araç argümanlarını yeniden yazmaz.                              | Değiştirilecek araç girdisi için Codex kanca/şema desteği gerekir.                       |
| Düzenlenebilir Codex yerel transkript geçmişi       | Codex kanonik yerel iş parçacığı geçmişine sahiptir. OpenClaw bir yansımaya sahiptir ve gelecekteki bağlamı yansıtabilir, ancak desteklenmeyen iç öğeleri mutasyona uğratmamalıdır. | Yerel iş parçacığı cerrahisi gerekiyorsa açık Codex uygulama sunucusu API'leri ekleyin. |
| Codex yerel araç kayıtları için `tool_result_persist` | Bu kanca, Codex yerel araç kayıtlarını değil, OpenClaw'a ait transkript yazımlarını dönüştürür.                                                  | Dönüştürülmüş kayıtlar yansıtılabilir, ancak kanonik yeniden yazma Codex desteği gerektirir. |
| Zengin yerel Compaction meta verileri               | OpenClaw Compaction başlangıcını ve tamamlanmasını gözlemler, ancak kararlı bir tutulan/bırakılan listesi, token deltası veya özet yükü almaz. | Daha zengin Codex Compaction olayları gerekir.                                            |
| Compaction müdahalesi                               | Geçerli OpenClaw Compaction kancaları Codex modunda bildirim düzeyindedir.                                                                       | Plugin'lerin yerel Compaction'ı veto etmesi veya yeniden yazması gerekiyorsa Codex Compaction öncesi/sonrası kancaları ekleyin. |
| Bayt bayt model API isteği yakalama                 | OpenClaw uygulama sunucusu isteklerini ve bildirimlerini yakalayabilir, ancak Codex çekirdeği son OpenAI API isteğini dahili olarak oluşturur. | Bir Codex model isteği izleme olayı veya hata ayıklama API'si gerekir.                    |

## Araçlar, medya ve Compaction

Codex koşumu yalnızca düşük düzeyli gömülü ajan yürütücüsünü değiştirir.

OpenClaw hâlâ araç listesini oluşturur ve koşumdan dinamik araç sonuçlarını alır. Metin, görseller, video, müzik, TTS, onaylar ve mesajlaşma aracı çıktısı normal OpenClaw teslim yolu üzerinden devam eder.

Yerel kanca rölesi bilerek geneldir, ancak v1 destek sözleşmesi OpenClaw'ın test ettiği Codex yerel araç ve izin yollarıyla sınırlıdır. Codex çalışma zamanında buna kabuk, yama ve MCP `PreToolUse`, `PostToolUse` ve `PermissionRequest` yükleri dahildir. Çalışma zamanı sözleşmesi adını koyana kadar gelecekteki her Codex kanca olayının bir OpenClaw Plugin yüzeyi olduğunu varsaymayın.

`PermissionRequest` için OpenClaw yalnızca ilke karar verdiğinde açık izin veya ret kararları döndürür. Kararsız sonuç izin değildir. Codex bunu kanca kararı yok olarak ele alır ve kendi koruyucu veya kullanıcı onayı yoluna düşer. Codex uygulama sunucusu onay modları varsayılan olarak bu yerel kancayı atlar; bu paragraf `permission_request` açıkça `nativeHookRelay.events` içine dahil edildiğinde veya bir uyumluluk çalışma zamanı bunu yüklediğinde geçerlidir. Bir operatör Codex yerel izin isteği için `allow-always` seçtiğinde, OpenClaw bu kesin sağlayıcı/oturum/araç girdisi/cwd parmak izini sınırlı bir oturum penceresi için hatırlar. Hatırlanan karar bilerek yalnızca tam eşleşmelidir: değişmiş bir komut, argümanlar, araç yükü veya cwd yeni bir onay oluşturur.

Codex MCP araç onayı istemleri, Codex `_meta.codex_approval_kind` öğesini `"mcp_tool_call"` olarak işaretlediğinde OpenClaw'ın Plugin onay akışı üzerinden yönlendirilir. Codex `request_user_input` istemleri kaynak sohbete geri gönderilir ve sonraki kuyruğa alınmış takip mesajı, ek bağlam olarak yönlendirilmek yerine bu yerel sunucu isteğini yanıtlar. Diğer MCP istem istekleri kapalı şekilde başarısız olur.

Etkin çalışma kuyruğu yönlendirmesi Codex uygulama sunucusu `turn/steer` üzerine eşlenir. Varsayılan `messages.queue.mode: "steer"` ile OpenClaw, kuyruktaki sohbet mesajlarını yapılandırılmış sessizlik penceresi için toplar ve bunları varış sırasına göre tek bir `turn/steer` isteği olarak gönderir. Eski `queue` modu ayrı `turn/steer` istekleri gönderir. Codex incelemesi ve manuel Compaction turları aynı tur yönlendirmesini reddedebilir; bu durumda OpenClaw, seçilen mod geri dönüşe izin verdiğinde takip kuyruğunu kullanır. Bkz. [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

Seçilen model Codex koşumunu kullandığında, yerel iş parçacığı Compaction'ı Codex uygulama sunucusuna devredilir. OpenClaw kanal geçmişi, arama, `/new`, `/reset` ve gelecekteki model veya koşum değiştirme için bir transkript yansıması tutar. Yansıma, uygulama sunucusu yaydığında kullanıcı istemini, son asistan metnini ve hafif Codex akıl yürütme veya plan kayıtlarını içerir. Bugün OpenClaw yalnızca yerel Compaction başlangıç ve tamamlanma sinyallerini kaydeder. Henüz insan tarafından okunabilir bir Compaction özeti veya Codex'in Compaction sonrasında hangi girdileri tuttuğuna dair denetlenebilir bir liste sunmaz.

Codex kanonik yerel iş parçacığına sahip olduğundan, `tool_result_persist` şu anda Codex yerel araç sonucu kayıtlarını yeniden yazmaz. Yalnızca OpenClaw, OpenClaw'a ait bir oturum transkripti araç sonucu yazarken uygulanır.

Medya üretimi Pi gerektirmez. Görsel, video, müzik, PDF, TTS ve medya anlama; `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` ve `messages.tts` gibi eşleşen sağlayıcı/model ayarlarını kullanmaya devam eder.

## Sorun giderme

**Codex normal bir `/model` sağlayıcısı olarak görünmüyor:** bu yeni yapılandırmalar için beklenir. `agentRuntime.id: "codex"` ile bir `openai/gpt-*` modeli (veya eski bir `codex/*` başvurusu) seçin, `plugins.entries.codex.enabled` öğesini etkinleştirin ve `plugins.allow` öğesinin `codex` öğesini dışlayıp dışlamadığını kontrol edin.

**OpenClaw Codex yerine Pi kullanıyor:** `agentRuntime.id: "auto"`, çalışmayı hiçbir Codex koşumu üstlenmediğinde uyumluluk arka ucu olarak Pi kullanmaya devam edebilir. Test sırasında Codex seçimini zorlamak için `agentRuntime.id: "codex"` ayarlayın. Zorlanmış Codex çalışma zamanı Pi'ye geri dönmek yerine başarısız olur. Codex uygulama sunucusu seçildikten sonra hataları doğrudan görünür.

**Uygulama sunucusu reddediliyor:** Codex'i, uygulama sunucusu el sıkışması `0.125.0` veya daha yeni sürüm bildirecek şekilde yükseltin. `0.125.0-alpha.2` veya `0.125.0+custom` gibi aynı sürüm ön yayınları veya derleme son ekli sürümler reddedilir, çünkü OpenClaw'ın test ettiği kararlı `0.125.0` protokol tabanıdır.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs` değerini düşürün veya keşfi devre dışı bırakın.

**WebSocket aktarımı hemen başarısız oluyor:** `appServer.url`, `authToken` ve uzak uygulama sunucusunun aynı Codex uygulama sunucusu protokol sürümünü konuştuğunu kontrol edin.

**Codex olmayan bir model Pi kullanıyor:** bu, ilgili ajan için `agentRuntime.id: "codex"` değerini zorlamadığınız veya eski bir `codex/*` başvurusu seçmediğiniz sürece beklenir. Düz `openai/gpt-*` ve diğer sağlayıcı başvuruları `auto` modunda normal sağlayıcı yollarında kalır. `agentRuntime.id: "codex"` değerini zorlarsanız, o ajan için her gömülü turun Codex destekli bir OpenAI modeli olması gerekir.

**Computer Use yüklü ancak araçlar çalışmıyor:** yeni bir oturumdan
`/codex computer-use status` komutunu kontrol edin. Bir araç
`Native hook relay unavailable` bildirirse `/new` veya `/reset` kullanın; sorun devam ederse eski native hook kayıtlarını temizlemek için
Gateway'i yeniden başlatın. `computer-use.list_apps`
zaman aşımına uğrarsa Codex Computer Use veya Codex Desktop'ı yeniden başlatıp tekrar deneyin.

## İlgili

- [Ajan harness Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Ajan çalışma zamanları](/tr/concepts/agent-runtimes)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [Durum](/tr/cli/status)
- [Plugin hook'ları](/tr/plugins/hooks)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [Test etme](/tr/help/testing-live#live-codex-app-server-harness-smoke)
