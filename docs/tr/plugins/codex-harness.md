---
read_when:
    - Paketle birlikte gelen Codex app-server test düzeneğini kullanmak istiyorsunuz
    - Codex yürütme düzeneği yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex dağıtımlarının PI'ye geri dönmek yerine başarısız olmasını istiyorsunuz
summary: OpenClaw gömülü ajan turlarını paketle birlikte gelen Codex app-server test düzeneği üzerinden çalıştırın
title: Codex çalıştırma ortamı
x-i18n:
    generated_at: "2026-05-03T21:36:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5187e54e2dc94e511c0243227f741d3486669f595c2b15cf239b1c03ea466c8
    source_path: plugins/codex-harness.md
    workflow: 16
---

`codex` paket Plugin'i, OpenClaw'un gömülü ajan dönüşlerini yerleşik PI harness'i yerine Codex app-server üzerinden çalıştırmasını sağlar.

Codex'in düşük seviyeli ajan oturumuna sahip olmasını istediğinizde bunu kullanın: model keşfi, yerel thread sürdürme, yerel compaction ve app-server yürütmesi. OpenClaw chat kanallarına, oturum dosyalarına, model seçimine, araçlara, onaylara, medya teslimine ve görünür transkript aynasına sahip olmaya devam eder.

Bir kaynak chat dönüşü Codex harness'i üzerinden çalıştığında, dağıtım `messages.visibleReplies` değerini açıkça yapılandırmadıysa görünür yanıtlar varsayılan olarak OpenClaw `message` aracına gider. Ajan Codex dönüşünü yine de özel olarak bitirebilir; kanala yalnızca `message(action="send")` çağırdığında gönderi yapar. Doğrudan chat final yanıtlarını eski otomatik teslim yolunda tutmak için `messages.visibleReplies: "automatic"` ayarlayın.

Codex heartbeat dönüşleri ayrıca varsayılan olarak `heartbeat_respond` aracını alır; böylece ajan, uyandırmanın sessiz kalıp kalmaması ya da bildirim gönderip göndermemesi gerektiğini bu kontrol akışını final metnine kodlamadan kaydedebilir.

Heartbeat'e özel inisiyatif rehberliği, heartbeat dönüşünün kendisinde Codex iş birliği modu developer instruction olarak gönderilir. Sıradan chat dönüşleri, normal runtime prompt'larında heartbeat felsefesini taşımak yerine Codex Default modunu geri yükler.

Kendinizi konumlandırmaya çalışıyorsanız [Ajan runtime'ları](/tr/concepts/agent-runtimes) ile başlayın. Kısa sürüm şudur: `openai/gpt-5.5` model ref'idir, `codex` runtime'dır ve Telegram, Discord, Slack veya başka bir kanal iletişim yüzeyi olarak kalır.

## Hızlı config

"OpenClaw içinde Codex" isteyen çoğu kullanıcı şu rotayı ister: bir ChatGPT/Codex aboneliğiyle oturum açın, ardından gömülü ajan dönüşlerini yerel Codex app-server runtime'ı üzerinden çalıştırın. Model ref'i yine `openai/gpt-*` olarak canonical kalır; abonelik auth'u bir `openai-codex/*` model prefix'inden değil, Codex account/profile'dan gelir.

Henüz yapmadıysanız önce Codex OAuth ile oturum açın:

```bash
openclaw models auth login --provider openai-codex
```

Ardından paket `codex` Plugin'ini etkinleştirin ve Codex runtime'ını zorunlu kılın:

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

Config'iniz `plugins.allow` kullanıyorsa `codex` değerini oraya da ekleyin:

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

Yerel Codex runtime'ını kastettiğinizde `openai-codex/gpt-*` kullanmayın. Bu prefix açık "PI üzerinden Codex OAuth" rotasıdır. Config değişiklikleri yeni veya sıfırlanmış oturumlara uygulanır; mevcut oturumlar kaydedilmiş runtime'larını korur.

## Bu Plugin neyi değiştirir

Paket `codex` Plugin'i birkaç ayrı yetenek sağlar:

| Yetenek                           | Nasıl kullanırsınız                                  | Ne yapar                                                                      |
| --------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| Yerel gömülü runtime              | `agentRuntime.id: "codex"`                           | OpenClaw gömülü ajan dönüşlerini Codex app-server üzerinden çalıştırır.       |
| Yerel chat-kontrol komutları      | `/codex bind`, `/codex resume`, `/codex steer`, ...  | Bir mesajlaşma konuşmasından Codex app-server thread'lerini bağlar ve yönetir. |
| Codex app-server provider/catalog | `codex` internals, harness üzerinden yüzeye çıkarılır | Runtime'ın app-server modellerini keşfetmesini ve doğrulamasını sağlar.       |
| Codex medya-anlama yolu           | `codex/*` image-model uyumluluk yolları              | Desteklenen görüntü anlama modelleri için sınırlı Codex app-server dönüşleri çalıştırır. |
| Yerel hook relay                  | Codex-native event'lerin etrafındaki Plugin hook'ları | OpenClaw'un desteklenen Codex-native araç/finalization event'lerini gözlemlemesini/engellemesini sağlar. |

Plugin'i etkinleştirmek bu yetenekleri kullanılabilir hale getirir. Şunları **yapmaz**:

- her OpenAI modeli için Codex kullanmaya başlamak
- `openai-codex/*` model ref'lerini yerel runtime'a dönüştürmek
- ACP/acpx'i varsayılan Codex yolu yapmak
- zaten PI runtime'ı kaydetmiş mevcut oturumları hot-switch etmek
- OpenClaw kanal teslimini, oturum dosyalarını, auth-profile depolamasını veya message routing'i değiştirmek

Aynı Plugin, yerel `/codex` chat-kontrol komut yüzeyine de sahiptir. Plugin etkinse ve kullanıcı chat'ten Codex thread'lerini bağlamayı, sürdürmeyi, yönlendirmeyi, durdurmayı veya incelemeyi isterse ajanlar ACP yerine `/codex ...` tercih etmelidir. ACP, kullanıcı ACP/acpx istediğinde veya ACP Codex adapter'ını test ettiğinde açık fallback olarak kalır.

Yerel Codex dönüşleri, OpenClaw Plugin hook'larını genel uyumluluk katmanı olarak tutar. Bunlar süreç içi OpenClaw hook'larıdır, Codex `hooks.json` komut hook'ları değildir:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- mirrored transcript kayıtları için `before_message_write`
- Codex `Stop` relay üzerinden `before_agent_finalize`
- `agent_end`

Plugin'ler ayrıca OpenClaw dynamic tool sonuçlarını, OpenClaw aracı çalıştırdıktan sonra ve sonuç Codex'e döndürülmeden önce yeniden yazmak için runtime-neutral tool-result middleware kaydedebilir. Bu, OpenClaw'un sahip olduğu transcript tool-result yazımlarını dönüştüren genel `tool_result_persist` Plugin hook'undan ayrıdır.

Plugin hook semantiklerinin kendisi için [Plugin hook'ları](/tr/plugins/hooks) ve [Plugin guard davranışı](/tr/tools/plugin) sayfalarına bakın.

Harness varsayılan olarak kapalıdır. Yeni config'ler OpenAI model ref'lerini `openai/gpt-*` olarak canonical tutmalı ve yerel app-server yürütmesi istediklerinde açıkça `agentRuntime.id: "codex"` veya `OPENCLAW_AGENT_RUNTIME=codex` zorlamalıdır. Eski `codex/*` model ref'leri uyumluluk için harness'i hâlâ otomatik seçer, ancak runtime-backed eski provider prefix'leri normal model/provider seçenekleri olarak gösterilmez.

`codex` Plugin'i etkinse ama birincil model hâlâ `openai-codex/*` ise `openclaw doctor` rotayı değiştirmek yerine uyarı verir. Bu kasıtlıdır: `openai-codex/*` PI Codex OAuth/abonelik yolu olarak kalır ve yerel app-server yürütmesi açık bir runtime seçimi olarak kalır.

## Rota haritası

Config değiştirmeden önce bu tabloyu kullanın:

| İstenen davranış                                  | Model ref                  | Runtime config                         | Auth/profile rotası          | Beklenen durum etiketi         |
| ------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| Yerel Codex runtime ile ChatGPT/Codex aboneliği   | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth veya Codex account | `Runtime: OpenAI Codex`        |
| Normal OpenClaw runner üzerinden OpenAI API       | `openai/gpt-*`             | omitted or `runtime: "pi"`             | OpenAI API anahtarı          | `Runtime: OpenClaw Pi Default` |
| PI üzerinden ChatGPT/Codex aboneliği              | `openai-codex/gpt-*`       | omitted or `runtime: "pi"`             | OpenAI Codex OAuth provider  | `Runtime: OpenClaw Pi Default` |
| Muhafazakar auto modla karışık provider'lar       | provider-specific refs     | `agentRuntime.id: "auto"`              | Seçilen provider başına      | Seçilen runtime'a bağlıdır     |
| Açık Codex ACP adapter oturumu                    | ACP prompt/model dependent | `sessions_spawn` with `runtime: "acp"` | ACP backend auth             | ACP task/session durumu        |

Önemli ayrım provider ile runtime arasındadır:

- `openai-codex/*` "PI hangi provider/auth rotasını kullanmalı?" sorusunu yanıtlar.
- `agentRuntime.id: "codex"` "bu gömülü dönüşü hangi loop yürütmeli?" sorusunu yanıtlar.
- `/codex ...` "bu chat hangi yerel Codex konuşmasına bağlanmalı veya onu kontrol etmeli?" sorusunu yanıtlar.
- ACP "acpx hangi harici harness sürecini başlatmalı?" sorusunu yanıtlar.

## Doğru model prefix'ini seçin

OpenAI ailesi rotalar prefix'e özeldir. Yaygın abonelik artı yerel Codex runtime kurulumu için `agentRuntime.id: "codex"` ile `openai/*` kullanın. `openai-codex/*` değerini yalnızca PI üzerinden Codex OAuth'u kasıtlı olarak istediğinizde kullanın:

| Model ref                                     | Runtime yolu                                | Ne zaman kullanılır                                                        |
| --------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenClaw/PI plumbing üzerinden OpenAI provider | `OPENAI_API_KEY` ile mevcut doğrudan OpenAI Platform API erişimi istediğinizde. |
| `openai-codex/gpt-5.5`                        | OpenClaw/PI üzerinden OpenAI Codex OAuth    | Varsayılan PI runner ile ChatGPT/Codex abonelik auth'u istediğinizde.       |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                    | Yerel Codex yürütmesiyle ChatGPT/Codex abonelik auth'u istediğinizde.       |

GPT-5.5, account'unuz bunları sunuyorsa hem doğrudan OpenAI API-key hem de Codex abonelik rotalarında görünebilir. Yerel Codex runtime için Codex app-server harness'iyle `openai/gpt-5.5`, PI OAuth için `openai-codex/gpt-5.5`, doğrudan API-key trafiği için Codex runtime override'ı olmadan `openai/gpt-5.5` kullanın.

Eski `codex/gpt-*` ref'leri uyumluluk alias'ları olarak kabul edilmeye devam eder. Doctor uyumluluk migration'ı eski birincil runtime ref'lerini canonical model ref'lerine yeniden yazar ve runtime politikasını ayrı kaydeder; fallback-only eski ref'ler ise değiştirilmeden bırakılır çünkü runtime tüm ajan container'ı için yapılandırılır. Yeni PI Codex OAuth config'leri `openai-codex/gpt-*` kullanmalıdır; yeni yerel app-server harness config'leri `openai/gpt-*` artı `agentRuntime.id: "codex"` kullanmalıdır.

`agents.defaults.imageModel` aynı prefix ayrımını izler. Görüntü anlama OpenAI Codex OAuth provider yolu üzerinden çalışmalıysa `openai-codex/gpt-*` kullanın. Görüntü anlama sınırlı bir Codex app-server dönüşü üzerinden çalışmalıysa `codex/gpt-*` kullanın. Codex app-server modelinin image input desteği duyurması gerekir; text-only Codex modelleri medya dönüşü başlamadan önce başarısız olur.

Geçerli oturum için etkin harness'i doğrulamak üzere `/status` kullanın. Seçim şaşırtıcıysa `agents/harness` alt sistemi için debug logging'i etkinleştirin ve Gateway'in structured `agent harness selected` kaydını inceleyin. Bu kayıt seçilen harness id'sini, seçim nedenini, runtime/fallback politikasını ve `auto` modunda her Plugin adayının destek sonucunu içerir.

### Doctor uyarıları ne anlama gelir

`openclaw doctor`, aşağıdakilerin tümü doğru olduğunda uyarı verir:

- paket `codex` Plugin'i etkinleştirilmiş veya izin verilmişse
- bir ajanın birincil modeli `openai-codex/*` ise
- o ajanın etkin runtime'ı `codex` değilse

Bu uyarı, kullanıcıların sık sık "Codex Plugin etkin" ifadesinin "yerel Codex app-server runtime" anlamına gelmesini beklemesi nedeniyle vardır. OpenClaw bu sıçramayı yapmaz. Uyarının anlamı şudur:

- PI üzerinden ChatGPT/Codex OAuth'u amaçladıysanız **değişiklik gerekmez**.
- Yerel app-server yürütmesini amaçladıysanız modeli `openai/<model>` olarak değiştirin ve `agentRuntime.id: "codex"` ayarlayın.
- Runtime değişikliğinden sonra mevcut oturumların yine de `/new` veya `/reset` alması gerekir, çünkü oturum runtime pin'leri yapışkandır.

Harness seçimi canlı bir oturum kontrolü değildir. Gömülü bir dönüş çalıştığında OpenClaw seçilen harness id'sini o oturuma kaydeder ve aynı oturum id'sindeki sonraki dönüşlerde onu kullanmayı sürdürür. Gelecekteki oturumların başka bir harness kullanmasını istediğinizde `agentRuntime` config'ini veya `OPENCLAW_AGENT_RUNTIME` değerini değiştirin; mevcut bir konuşmayı PI ile Codex arasında değiştirmeden önce yeni bir oturum başlatmak için `/new` veya `/reset` kullanın. Bu, bir transkriptin iki uyumsuz yerel oturum sistemi üzerinden yeniden oynatılmasını önler.

Geçmiş dökümü olan, harness sabitlemelerinden önce oluşturulmuş eski oturumlar PI-sabitlenmiş olarak değerlendirilir. Yapılandırmayı değiştirdikten sonra bu konuşmayı Codex'e dahil etmek için `/new` veya `/reset` kullanın.

`/status` etkin model çalışma zamanını gösterir. Varsayılan PI harness'ı `Runtime: OpenClaw Pi Default` olarak, Codex app-server harness'ı ise `Runtime: OpenAI Codex` olarak görünür.

## Gereksinimler

- Paketle gelen `codex` plugin'i kullanılabilir durumda olan OpenClaw.
- Codex app-server `0.125.0` veya daha yenisi. Paketle gelen plugin varsayılan olarak uyumlu bir Codex app-server ikilisini yönetir, bu nedenle `PATH` üzerindeki yerel `codex` komutları normal harness başlangıcını etkilemez.
- App-server süreci veya OpenClaw'ın Codex kimlik doğrulama köprüsü için Codex kimlik doğrulamasının mevcut olması. Yerel app-server başlatmaları her agent için OpenClaw tarafından yönetilen bir Codex ana dizini ve yalıtılmış bir alt `HOME` kullanır; bu nedenle varsayılan olarak kişisel `~/.codex` hesabınızı, Skills'lerinizi, plugin'lerinizi, yapılandırmanızı, thread durumunuzu veya yerel `$HOME/.agents/skills` dizininizi okumaz.

Plugin, daha eski veya sürümsüz app-server el sıkışmalarını engeller. Bu, OpenClaw'ı test edildiği protokol yüzeyinde tutar.

Canlı ve Docker smoke testleri için kimlik doğrulama genellikle Codex CLI hesabından veya bir OpenClaw `openai-codex` kimlik doğrulama profilinden gelir. Yerel stdio app-server başlatmaları, hesap yoksa `CODEX_API_KEY` / `OPENAI_API_KEY` değerlerine de geri düşebilir.

## Çalışma alanı başlangıç dosyaları

Codex, `AGENTS.md` dosyasını yerel proje belgesi keşfi üzerinden kendisi işler. OpenClaw sentetik Codex proje belgesi dosyaları yazmaz veya persona dosyaları için Codex geri dönüş dosya adlarına bağlı kalmaz; çünkü Codex geri dönüşleri yalnızca `AGENTS.md` eksik olduğunda uygulanır.

OpenClaw çalışma alanı eşdeğerliği için Codex harness'ı diğer başlangıç dosyalarını (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` ve varsa `MEMORY.md`) çözer ve bunları `thread/start` ile `thread/resume` üzerinde Codex yapılandırma talimatları üzerinden iletir. Bu, `AGENTS.md` dosyasını çoğaltmadan `SOUL.md` ve ilişkili çalışma alanı persona/profil bağlamının görünür kalmasını sağlar.

## Codex'i diğer modellerin yanına ekleme

Aynı agent Codex ve Codex dışı sağlayıcı modelleri arasında serbestçe geçiş yapacaksa `agentRuntime.id: "codex"` değerini genel olarak ayarlamayın. Zorunlu bir çalışma zamanı, o agent veya oturum için her gömülü dönüşe uygulanır. Bu çalışma zamanı zorlanmışken bir Anthropic modeli seçerseniz OpenClaw yine Codex harness'ını dener ve o dönüşü sessizce PI üzerinden yönlendirmek yerine kapalı şekilde başarısız olur.

Bunun yerine şu yapılardan birini kullanın:

- Codex'i `agentRuntime.id: "codex"` ile ayrılmış bir agent üzerine koyun.
- Varsayılan agent'ı normal karma sağlayıcı kullanımı için `agentRuntime.id: "auto"` ve PI geri dönüşünde tutun.
- Eski `codex/*` başvurularını yalnızca uyumluluk için kullanın. Yeni yapılandırmalar `openai/*` ile birlikte açık bir Codex çalışma zamanı ilkesini tercih etmelidir.

Örneğin bu, varsayılan agent'ı normal otomatik seçimde tutar ve ayrı bir Codex agent'ı ekler:

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

- Varsayılan `main` agent normal sağlayıcı yolunu ve PI uyumluluk geri dönüşünü kullanır.
- `codex` agent Codex app-server harness'ını kullanır.
- Codex `codex` agent için eksik veya desteklenmiyor ise dönüş sessizce PI kullanmak yerine başarısız olur.

## Agent komut yönlendirme

Agent'lar kullanıcı isteklerini yalnızca "Codex" sözcüğüne göre değil, amaca göre yönlendirmelidir:

| Kullanıcı şunu ister...                                | Agent şunu kullanmalıdır...                       |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Bu sohbeti Codex'e bağla"                             | `/codex bind`                                    |
| "Codex thread'i `<id>` burada sürdür"                  | `/codex resume <id>`                             |
| "Codex thread'lerini göster"                           | `/codex threads`                                 |
| "Kötü bir Codex çalışması için destek raporu oluştur"  | `/diagnostics [note]`                            |
| "Yalnızca bu ekli thread için Codex geri bildirimi gönder" | `/codex diagnostics [note]`                  |
| "ChatGPT/Codex aboneliğimi Codex çalışma zamanı ile kullan" | `openai/*` artı `agentRuntime.id: "codex"`  |
| "ChatGPT/Codex aboneliğimi PI üzerinden kullan"        | `openai-codex/*` model başvuruları               |
| "Codex'i ACP/acpx üzerinden çalıştır"                  | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Claude Code/Gemini/OpenCode/Cursor'ı bir thread içinde başlat" | ACP/acpx, `/codex` değil ve yerel alt agent'lar değil |

OpenClaw, agent'lara ACP spawn rehberliğini yalnızca ACP etkin, gönderilebilir ve yüklü bir çalışma zamanı arka ucu tarafından destekleniyorsa duyurur. ACP kullanılamıyorsa sistem prompt'u ve plugin Skills'leri agent'a ACP yönlendirmesini öğretmemelidir.

## Yalnızca Codex dağıtımları

Her gömülü agent dönüşünün Codex kullandığını kanıtlamanız gerektiğinde Codex harness'ını zorlayın. Açık plugin çalışma zamanları kapalı şekilde başarısız olur ve PI üzerinden asla sessizce yeniden denenmez:

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

Codex zorlandığında OpenClaw, Codex plugin'i devre dışıysa, app-server çok eskiyse veya app-server başlatılamıyorsa erken başarısız olur.

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

Agent'lar ve modeller arasında geçiş yapmak için normal oturum komutlarını kullanın. `/new` yeni bir OpenClaw oturumu oluşturur ve Codex harness'ı gerektiğinde kendi sidecar app-server thread'ini oluşturur veya sürdürür. `/reset`, o thread için OpenClaw oturum bağlamasını temizler ve sonraki dönüşün harness'ı geçerli yapılandırmadan yeniden çözmesini sağlar.

## Model keşfi

Varsayılan olarak Codex plugin'i kullanılabilir modelleri app-server'dan ister. Keşif başarısız olur veya zaman aşımına uğrarsa, şu modeller için paketle gelen geri dönüş kataloğunu kullanır:

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

Başlangıcın Codex'i yoklamasını istemeyip geri dönüş kataloğuna bağlı kalmasını istediğinizde keşfi devre dışı bırakın:

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

## App-server bağlantısı ve ilke

Varsayılan olarak plugin, OpenClaw'ın yönettiği Codex ikilisini yerel olarak şu komutla başlatır:

```bash
codex app-server --listen stdio://
```

Yönetilen ikili, `codex` plugin paketiyle birlikte gelir. Bu, app-server sürümünü yerelde yüklü olabilecek ayrı Codex CLI yerine paketle gelen plugin'e bağlı tutar. `appServer.command` değerini yalnızca bilinçli olarak farklı bir yürütülebilir dosya çalıştırmak istediğinizde ayarlayın.

Varsayılan olarak OpenClaw yerel Codex harness oturumlarını YOLO modunda başlatır: `approvalPolicy: "never"`, `approvalsReviewer: "user"` ve `sandbox: "danger-full-access"`. Bu, otonom Heartbeat'ler için kullanılan güvenilir yerel operatör duruşudur: Codex, cevaplayacak kimse yokken yerel onay prompt'larında durmadan shell ve ağ araçlarını kullanabilir.

Codex guardian incelemeli onaylara katılmak için `appServer.mode: "guardian"` ayarlayın:

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

Guardian modu Codex'in yerel otomatik inceleme onay yolunu kullanır. Codex sandbox dışına çıkmayı, çalışma alanı dışına yazmayı veya ağ erişimi gibi izinler eklemeyi istediğinde Codex bu onay isteğini bir insan prompt'u yerine yerel inceleyiciye yönlendirir. İnceleyici Codex'in risk çerçevesini uygular ve belirli isteği onaylar veya reddeder. YOLO modundan daha fazla koruma istediğiniz, ancak gözetimsiz agent'ların yine de ilerleme kaydetmesine ihtiyaç duyduğunuz durumlarda Guardian kullanın.

`guardian` ön ayarı `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` ve `sandbox: "workspace-write"` değerlerine genişler. Tekil ilke alanları yine de `mode` değerini geçersiz kılar; bu nedenle ileri dağıtımlar ön ayarı açık seçimlerle karıştırabilir. Eski `guardian_subagent` inceleyici değeri uyumluluk takma adı olarak hâlâ kabul edilir, ancak yeni yapılandırmalar `auto_review` kullanmalıdır.

Zaten çalışan bir app-server için WebSocket aktarımını kullanın:

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

Stdio app-server başlatmaları varsayılan olarak OpenClaw'ın süreç ortamını devralır, ancak OpenClaw Codex app-server hesap köprüsünün sahibidir ve hem `CODEX_HOME` hem de `HOME` değerlerini o agent'ın OpenClaw durumu altındaki agent başına dizinlere ayarlar. Codex'in kendi skill yükleyicisi `$CODEX_HOME/skills` ve `$HOME/.agents/skills` dizinlerini okur; bu nedenle yerel app-server başlatmaları için iki değer de yalıtılır. Bu, Codex'e özgü Skills'lerin, plugin'lerin, yapılandırmanın, hesapların ve thread durumunun operatörün kişisel Codex CLI ana dizininden sızmak yerine OpenClaw agent kapsamında kalmasını sağlar.

OpenClaw plugin'leri ve OpenClaw skill anlık görüntüleri yine de OpenClaw'ın kendi plugin kayıt defteri ve skill yükleyicisi üzerinden akar. Kişisel Codex CLI varlıkları akmaz. Bir OpenClaw agent'ın parçası olması gereken yararlı Codex CLI Skills'leriniz veya plugin'leriniz varsa bunları açıkça envantere alın:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex migration sağlayıcısı Skills'leri geçerli OpenClaw agent çalışma alanına kopyalar. Codex yerel plugin'leri, hook'ları ve yapılandırma dosyaları otomatik olarak etkinleştirilmek yerine manuel inceleme için raporlanır veya arşivlenir; çünkü komut yürütebilir, MCP sunucuları açabilir veya kimlik bilgileri taşıyabilirler.

Kimlik doğrulama şu sırayla seçilir:

1. Agent için açık bir OpenClaw Codex kimlik doğrulama profili.
2. App-server'ın o agent'ın Codex ana dizinindeki mevcut hesabı.
3. Yalnızca yerel stdio app-server başlatmaları için, app-server hesabı yoksa ve OpenAI kimlik doğrulaması hâlâ gerekiyorsa önce `CODEX_API_KEY`, sonra `OPENAI_API_KEY`.

OpenClaw ChatGPT aboneliği tarzı bir Codex kimlik doğrulama profili gördüğünde, oluşturulan Codex alt sürecinden `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini kaldırır. Bu, Gateway düzeyi API anahtarlarını embedding'ler veya doğrudan OpenAI modelleri için kullanılabilir tutarken yerel Codex app-server dönüşlerinin yanlışlıkla API üzerinden ücretlendirilmesini önler. Açık Codex API anahtarı profilleri ve yerel stdio ortam anahtarı geri dönüşü, devralınan alt süreç ortamı yerine app-server oturum açmasını kullanır. WebSocket app-server bağlantıları Gateway ortam API anahtarı geri dönüşü almaz; açık bir kimlik doğrulama profili veya uzak app-server'ın kendi hesabını kullanın.

Bir dağıtım ek ortam yalıtımı gerektiriyorsa, bu değişkenleri `appServer.clearEnv` içine ekleyin:

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

`appServer.clearEnv` yalnızca oluşturulan Codex app-server alt sürecini etkiler.

Codex dinamik araçları varsayılan olarak `native-first` profilini kullanır. Bu modda,
OpenClaw, Codex'e özgü çalışma alanı işlemlerini yineleyen dinamik araçları
sunmaz: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` ve
`update_plan`. Mesajlaşma, oturumlar, medya, cron, tarayıcı, düğümler, gateway,
`heartbeat_respond` ve `web_search` gibi OpenClaw entegrasyon araçları kullanılabilir
kalmaya devam eder.

Desteklenen üst düzey Codex Plugin alanları:

| Alan                       | Varsayılan       | Anlamı                                                                                   |
| -------------------------- | ---------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Codex app-server'a tam OpenClaw dinamik araç kümesini sunmak için `"openclaw-compat"` kullanın. |
| `codexDynamicToolsExclude` | `[]`             | Codex app-server dönüşlerinden çıkarılacak ek OpenClaw dinamik araç adları.              |

Desteklenen `appServer` alanları:

| Alan                | Varsayılan                               | Anlamı                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` Codex'i başlatır; `"websocket"` `url` adresine bağlanır.                                                                                                                                                                  |
| `command`           | yönetilen Codex ikilisi                  | stdio aktarımı için yürütülebilir dosya. Yönetilen ikiliyi kullanmak için boş bırakın; yalnızca açık bir geçersiz kılma için ayarlayın.                                                                                             |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio aktarımı için bağımsız değişkenler.                                                                                                                                                                                           |
| `url`               | ayarlanmamış                             | WebSocket app-server URL'si.                                                                                                                                                                                                        |
| `authToken`         | ayarlanmamış                             | WebSocket aktarımı için Bearer belirteci.                                                                                                                                                                                           |
| `headers`           | `{}`                                     | Ek WebSocket üstbilgileri.                                                                                                                                                                                                          |
| `clearEnv`          | `[]`                                     | OpenClaw devralınan ortamını oluşturduktan sonra oluşturulan stdio app-server sürecinden kaldırılan ek ortam değişkeni adları. `CODEX_HOME` ve `HOME`, yerel başlatmalarda OpenClaw'ın ajan başına Codex yalıtımı için ayrılmıştır. |
| `requestTimeoutMs`  | `60000`                                  | app-server kontrol düzlemi çağrıları için zaman aşımı.                                                                                                                                                                              |
| `mode`              | `"yolo"`                                 | YOLO veya guardian tarafından incelenen yürütme için ön ayar.                                                                                                                                                                       |
| `approvalPolicy`    | `"never"`                                | İş parçacığı başlatma/sürdürme/dönüşüne gönderilen yerel Codex onay ilkesi.                                                                                                                                                         |
| `sandbox`           | `"danger-full-access"`                   | İş parçacığı başlatma/sürdürmeye gönderilen yerel Codex sandbox modu.                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | Codex'in yerel onay istemlerini incelemesine izin vermek için `"auto_review"` kullanın. `guardian_subagent` eski bir diğer ad olarak kalır.                                                                                         |
| `serviceTier`       | ayarlanmamış                             | İsteğe bağlı Codex app-server hizmet katmanı: `"fast"`, `"flex"` veya `null`. Geçersiz eski değerler yok sayılır.                                                                                                                   |

OpenClaw'a ait dinamik araç çağrıları `appServer.requestTimeoutMs` değerinden
bağımsız olarak sınırlandırılır: Her Codex `item/tool/call` isteği 30 saniye
içinde bir OpenClaw yanıtı almalıdır. Zaman aşımında OpenClaw, desteklendiği
yerlerde araç sinyalini iptal eder ve Codex'e başarısız bir dinamik araç yanıtı
döndürür; böylece oturumu `processing` durumunda bırakmak yerine dönüş devam
edebilir.

OpenClaw, Codex dönüş kapsamlı bir app-server isteğine yanıt verdikten sonra
harness ayrıca Codex'in yerel dönüşü `turn/completed` ile bitirmesini bekler.
app-server bu yanıttan sonra 60 saniye sessiz kalırsa OpenClaw en iyi çabayla
Codex dönüşünü keser, tanılama zaman aşımı kaydeder ve takip sohbet mesajlarının
eskimiş bir yerel dönüşün arkasında sıraya alınmaması için OpenClaw oturum
kulvarını serbest bırakır.

Yerel testler için ortam geçersiz kılmaları kullanılabilir kalır:

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
Yinelenebilir dağıtımlar için config tercih edilir; çünkü Plugin davranışını
Codex harness kurulumunun geri kalanıyla aynı incelenmiş dosyada tutar.

## Bilgisayar kullanımı

Bilgisayar Kullanımı kendi kurulum kılavuzunda ele alınır:
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use).

Kısa sürüm: OpenClaw masaüstü denetim uygulamasını vendor olarak dahil etmez
veya masaüstü eylemlerini kendisi yürütmez. Codex app-server'ı hazırlar,
`computer-use` MCP sunucusunun kullanılabilir olduğunu doğrular ve ardından
Codex modundaki dönüşler sırasında yerel MCP araç çağrılarını Codex'in işlemesine
izin verir.

Codex marketplace akışı dışında doğrudan TryCua sürücü erişimi için
`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` ile
`cua-driver mcp` kaydedin. Codex'e ait Bilgisayar Kullanımı ile doğrudan MCP
kaydı arasındaki ayrım için [Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use)
bölümüne bakın.

En küçük config:

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

Kurulum komut yüzeyinden denetlenebilir veya kurulabilir:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Bilgisayar Kullanımı macOS'a özgüdür ve Codex MCP sunucusu uygulamaları
denetleyebilmeden önce yerel işletim sistemi izinleri gerektirebilir.
`computerUse.enabled` true ise ve MCP sunucusu kullanılamıyorsa, Codex modundaki
dönüşler yerel Bilgisayar Kullanımı araçları olmadan sessizce çalışmak yerine
iş parçacığı başlamadan önce başarısız olur. Marketplace seçenekleri, uzak
katalog sınırları, durum nedenleri ve sorun giderme için
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use) bölümüne bakın.

`computerUse.autoInstall` true olduğunda OpenClaw, Codex henüz yerel bir
marketplace keşfetmediyse standart paketlenmiş Codex Desktop marketplace'i
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` konumundan
kaydedebilir. Runtime veya Bilgisayar Kullanımı config değiştirildikten sonra
mevcut oturumların eski bir PI veya Codex iş parçacığı bağlamasını korumaması
için `/new` veya `/reset` kullanın.

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

Açık üstbilgilere sahip uzak app-server:

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
Codex iş parçacığına bağlı olduğunda, sonraki dönüş o anda seçili OpenAI
modelini, sağlayıcıyı, onay ilkesini, sandbox'ı ve hizmet katmanını yeniden
app-server'a gönderir. `openai/gpt-5.5` modelinden `openai/gpt-5.2` modeline
geçmek iş parçacığı bağlamasını korur ancak Codex'ten yeni seçilen modelle
devam etmesini ister.

## Codex komutu

Paketlenmiş Plugin, `/codex` komutunu yetkili bir slash komutu olarak kaydeder.
Geneldir ve OpenClaw metin komutlarını destekleyen tüm kanallarda çalışır.

Yaygın biçimler:

- `/codex status` canlı app-server bağlantısını, modelleri, hesabı, hız sınırlarını, MCP sunucularını ve Skills'i gösterir.
- `/codex models` canlı Codex app-server modellerini listeler.
- `/codex threads [filter]` son Codex iş parçacıklarını listeler.
- `/codex resume <thread-id>` mevcut OpenClaw oturumunu var olan bir Codex iş parçacığına bağlar.
- `/codex compact` Codex app-server'dan bağlı iş parçacığını sıkıştırmasını ister.
- `/codex review` bağlı iş parçacığı için Codex yerel incelemesini başlatır.
- `/codex diagnostics [note]` bağlı iş parçacığı için Codex tanılama geri bildirimi göndermeden önce sorar.
- `/codex computer-use status` yapılandırılmış Computer Use Plugin'ini ve MCP sunucusunu denetler.
- `/codex computer-use install` yapılandırılmış Computer Use Plugin'ini kurar ve MCP sunucularını yeniden yükler.
- `/codex account` hesap ve hız sınırı durumunu gösterir.
- `/codex mcp` Codex app-server MCP sunucusu durumunu listeler.
- `/codex skills` Codex app-server Skills'ini listeler.

### Yaygın hata ayıklama iş akışı

Codex destekli bir agent Telegram, Discord, Slack veya başka bir kanalda
beklenmedik bir şey yaptığında, sorunun gerçekleştiği konuşmayla başlayın:

1. `/diagnostics bad tool choice after image upload` komutunu veya gördüğünüz şeyi
   açıklayan başka kısa bir not çalıştırın.
2. Tanılama isteğini bir kez onaylayın. Onay, yerel Gateway tanılama zip dosyasını
   oluşturur ve oturum Codex harness'ını kullandığı için ilgili Codex geri bildirim
   paketini OpenAI sunucularına da gönderir.
3. Tamamlanan tanılama yanıtını hata raporuna veya destek iş parçacığına kopyalayın.
   Bu yanıtta yerel paket yolu, gizlilik özeti, OpenClaw oturum kimlikleri,
   Codex iş parçacığı kimlikleri ve her Codex iş parçacığı için bir `Inspect locally`
   satırı bulunur.
4. Çalışmayı kendiniz hata ayıklamak istiyorsanız, yazdırılan `Inspect locally`
   komutunu bir terminalde çalıştırın. `codex resume <thread-id>` gibi görünür ve
   konuşmayı inceleyebilmeniz, yerel olarak sürdürebilmeniz veya Codex'e belirli
   bir aracı ya da planı neden seçtiğini sorabilmeniz için yerel Codex iş parçacığını
   açar.

`/codex diagnostics [note]` komutunu yalnızca tam OpenClaw Gateway tanılama paketi
olmadan, şu anda bağlı iş parçacığı için özellikle Codex geri bildirim yüklemesini
istediğinizde kullanın. Çoğu destek raporu için `/diagnostics [note]` daha iyi bir
başlangıç noktasıdır, çünkü yerel Gateway durumunu ve Codex iş parçacığı kimliklerini
tek bir yanıtta bir araya getirir. Tam gizlilik modeli ve grup sohbeti davranışı için
[Tanılama dışa aktarımı](/tr/gateway/diagnostics) bölümüne bakın.

Çekirdek OpenClaw ayrıca genel Gateway tanılama komutu olarak yalnızca sahiplerin
kullanabildiği `/diagnostics [note]` komutunu sunar. Onay istemi hassas veri
önsözünü gösterir, [Diagnostics Export](/tr/gateway/diagnostics) bağlantısını verir ve
her seferinde açık exec onayıyla `openclaw gateway diagnostics export --json`
isteğinde bulunur. Tanılamaları allow-all kuralıyla onaylamayın. Onaydan sonra
OpenClaw, yerel paket yolu ve manifest özeti içeren yapıştırılabilir bir rapor
gönderir. Etkin OpenClaw oturumu Codex harness'ını kullanıyorsa, aynı onay ilgili
Codex geri bildirim paketlerinin OpenAI sunucularına gönderilmesine de izin verir.
Onay istemi Codex geri bildiriminin gönderileceğini söyler, ancak onaydan önce
Codex oturum veya iş parçacığı kimliklerini listelemez.

`/diagnostics` bir grup sohbetinde bir sahip tarafından çağrılırsa, OpenClaw paylaşılan
kanalı temiz tutar: grup yalnızca kısa bir bildirim alırken tanılama önsözü, onay
istemleri ve Codex oturum/iş parçacığı kimlikleri özel onay rotası üzerinden sahibe
gönderilir. Özel sahip rotası yoksa OpenClaw grup isteğini reddeder ve sahibin bunu
bir DM üzerinden çalıştırmasını ister.

Onaylanan Codex yüklemesi Codex app-server `feedback/upload` çağrısını yapar ve
app-server'dan kullanılabilir olduğunda listelenen her iş parçacığı ve oluşturulmuş
Codex alt iş parçacıkları için günlükleri eklemesini ister. Yükleme, Codex'in normal
geri bildirim yolu üzerinden OpenAI sunucularına gider; o app-server'da Codex geri
bildirimi devre dışıysa komut app-server hatasını döndürür. Tamamlanan tanılama yanıtı
gönderilen iş parçacıkları için kanalları, OpenClaw oturum kimliklerini, Codex iş
parçacığı kimliklerini ve yerel `codex resume <thread-id>` komutlarını listeler. Onayı
reddeder veya yok sayarsanız, OpenClaw bu Codex kimliklerini yazdırmaz. Bu yükleme
yerel Gateway tanılama dışa aktarımının yerine geçmez.

`/codex resume`, harness'ın normal turlarda kullandığı aynı sidecar bağlama dosyasını
yazar. Bir sonraki mesajda OpenClaw bu Codex iş parçacığını sürdürür, şu anda seçili
OpenClaw modelini app-server'a iletir ve genişletilmiş geçmişi etkin tutar.

### CLI'den bir Codex iş parçacığını inceleme

Kötü bir Codex çalışmasını anlamanın en hızlı yolu çoğu zaman yerel Codex iş parçacığını
doğrudan açmaktır:

```sh
codex resume <thread-id>
```

Bunu bir kanal konuşmasında hata fark ettiğinizde ve sorunlu Codex oturumunu incelemek,
yerel olarak sürdürmek veya Codex'e belirli bir araç ya da akıl yürütme seçimini neden
yaptığını sormak istediğinizde kullanın. En kolay yol genellikle önce
`/diagnostics [note]` çalıştırmaktır: onayladıktan sonra tamamlanan rapor her Codex iş
parçacığını listeler ve örneğin `codex resume <thread-id>` gibi bir `Inspect locally`
komutu yazdırır. Bu komutu doğrudan bir terminale kopyalayabilirsiniz.

Mevcut sohbet için `/codex binding` üzerinden veya son Codex app-server iş parçacıkları
için `/codex threads [filter]` üzerinden bir iş parçacığı kimliği alıp ardından
shell'inizde aynı `codex resume` komutunu da çalıştırabilirsiniz.

Komut yüzeyi Codex app-server `0.125.0` veya daha yenisini gerektirir. Bir gelecek
veya özel app-server ilgili JSON-RPC yöntemini sunmuyorsa, tek tek denetim yöntemleri
`unsupported by this Codex app-server` olarak raporlanır.

## Kanca sınırları

Codex harness'ında üç kanca katmanı vardır:

| Katman                                | Sahip                    | Amaç                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------ |
| OpenClaw Plugin kancaları             | OpenClaw                 | PI ve Codex harness'ları arasında ürün/Plugin uyumluluğu.          |
| Codex app-server extension ara katmanı | OpenClaw paketli Plugin'leri | OpenClaw dinamik araçları etrafında tur başına adaptör davranışı. |
| Codex yerel kancaları                 | Codex                    | Codex yapılandırmasından düşük düzeyli Codex yaşam döngüsü ve yerel araç ilkesi. |

OpenClaw, OpenClaw Plugin davranışını yönlendirmek için proje veya global Codex
`hooks.json` dosyalarını kullanmaz. Desteklenen yerel araç ve izin köprüsü için
OpenClaw, `PreToolUse`, `PostToolUse`, `PermissionRequest` ve `Stop` için iş parçacığı
başına Codex yapılandırması enjekte eder. `SessionStart` ve `UserPromptSubmit` gibi
diğer Codex kancaları Codex düzeyi denetimler olarak kalır; v1 sözleşmesinde OpenClaw
Plugin kancaları olarak sunulmazlar.

OpenClaw dinamik araçları için OpenClaw aracı, Codex çağrıyı istedikten sonra çalıştırır;
bu nedenle OpenClaw sahip olduğu Plugin ve ara katman davranışını harness adaptöründe
tetikler. Codex'e yerel araçlarda kanonik araç kaydının sahibi Codex'tir. OpenClaw seçili
olayları yansıtabilir, ancak Codex bu işlemi app-server veya yerel kanca geri çağrıları
üzerinden sunmadıkça yerel Codex iş parçacığını yeniden yazamaz.

Compaction ve LLM yaşam döngüsü izdüşümleri, yerel Codex kanca komutlarından değil,
Codex app-server bildirimlerinden ve OpenClaw adaptör durumundan gelir. OpenClaw'ın
`before_compaction`, `after_compaction`, `llm_input` ve `llm_output` olayları adaptör
düzeyi gözlemlerdir; Codex'in dahili istek veya Compaction yüklerinin bayt bayt
yakalamaları değildir.

Codex yerel `hook/started` ve `hook/completed` app-server bildirimleri, yörünge ve hata
ayıklama için `codex_app_server.hook` agent olayları olarak yansıtılır. OpenClaw Plugin
kancalarını çağırmazlar.

## V1 destek sözleşmesi

Codex modu, altında farklı bir model çağrısı bulunan PI değildir. Codex yerel model
döngüsünün daha büyük bir kısmına sahiptir ve OpenClaw Plugin ve oturum yüzeylerini bu
sınır etrafında uyarlar.

Codex runtime v1'de desteklenir:

| Yüzey                                         | Destek                                  | Neden                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Codex üzerinden OpenAI model döngüsü          | Desteklenir                             | Codex app-server OpenAI turuna, yerel iş parçacığı sürdürmeye ve yerel araç devamına sahiptir.                                                                                                        |
| OpenClaw kanal yönlendirme ve teslimi         | Desteklenir                             | Telegram, Discord, Slack, WhatsApp, iMessage ve diğer kanallar model runtime'ının dışında kalır.                                                                                                      |
| OpenClaw dinamik araçları                     | Desteklenir                             | Codex OpenClaw'dan bu araçları çalıştırmasını ister, bu yüzden OpenClaw yürütme yolunda kalır.                                                                                                       |
| İstem ve bağlam Plugin'leri                   | Desteklenir                             | OpenClaw istem kaplamaları oluşturur ve iş parçacığını başlatmadan veya sürdürmeden önce bağlamı Codex turuna yansıtır.                                                                               |
| Bağlam motoru yaşam döngüsü                   | Desteklenir                             | Birleştirme, alma veya tur sonrası bakım ve bağlam motoru Compaction koordinasyonu Codex turları için çalışır.                                                                                       |
| Dinamik araç kancaları                        | Desteklenir                             | `before_tool_call`, `after_tool_call` ve araç sonucu ara katmanı OpenClaw'ın sahip olduğu dinamik araçların etrafında çalışır.                                                                         |
| Yaşam döngüsü kancaları                       | Adaptör gözlemleri olarak desteklenir   | `llm_input`, `llm_output`, `agent_end`, `before_compaction` ve `after_compaction` dürüst Codex modu yükleriyle tetiklenir.                                                                            |
| Son yanıt revizyon kapısı                     | Yerel kanca aktarımı üzerinden desteklenir | Codex `Stop`, `before_agent_finalize` içine aktarılır; `revise`, sonlandırmadan önce Codex'ten bir model geçişi daha ister.                                                                          |
| Yerel shell, patch ve MCP engelleme veya gözlemleme | Yerel kanca aktarımı üzerinden desteklenir | Codex `PreToolUse` ve `PostToolUse`, Codex app-server `0.125.0` veya daha yenisindeki MCP yükleri dahil olmak üzere taahhüt edilmiş yerel araç yüzeyleri için aktarılır. Engelleme desteklenir; argüman yeniden yazma desteklenmez. |
| Yerel izin ilkesi                             | Yerel kanca aktarımı üzerinden desteklenir | Codex `PermissionRequest`, runtime bunu sunduğunda OpenClaw ilkesi üzerinden yönlendirilebilir. OpenClaw karar döndürmezse Codex normal koruyucu veya kullanıcı onayı yolundan devam eder.             |
| App-server yörünge yakalama                   | Desteklenir                             | OpenClaw app-server'a gönderdiği isteği ve aldığı app-server bildirimlerini kaydeder.                                                                                                                 |

Codex runtime v1'de desteklenmez:

| Yüzey                                              | V1 sınırı                                                                                                                                           | Gelecekteki yol                                                                                  |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Yerel araç argümanı mutasyonu                      | Codex yerel araç öncesi hook'ları engelleyebilir, ancak OpenClaw Codex-yerel araç argümanlarını yeniden yazmaz.                                   | Yerine geçen araç girdisi için Codex hook/şema desteği gerektirir.                               |
| Düzenlenebilir Codex-yerel transkript geçmişi      | Codex, kanonik yerel iş parçacığı geçmişinin sahibidir. OpenClaw bir yansının sahibidir ve gelecekteki bağlamı yansıtabilir, ancak desteklenmeyen dahili alanları değiştirmemelidir. | Yerel iş parçacığı cerrahisi gerekiyorsa açık Codex app-server API'leri ekleyin.                 |
| Codex-yerel araç kayıtları için `tool_result_persist` | Bu hook, Codex-yerel araç kayıtlarını değil, OpenClaw'a ait transkript yazımlarını dönüştürür.                                                     | Dönüştürülmüş kayıtları yansıtabilir, ancak kanonik yeniden yazım Codex desteği gerektirir.      |
| Zengin yerel Compaction meta verileri              | OpenClaw, Compaction başlangıcını ve tamamlanmasını gözlemler, ancak kararlı bir tutulan/bırakılan listesi, token deltası veya özet yükü almaz.    | Daha zengin Codex Compaction olayları gerektirir.                                                |
| Compaction müdahalesi                              | Mevcut OpenClaw Compaction hook'ları Codex modunda bildirim düzeyindedir.                                                                          | Plugin'lerin yerel Compaction'ı veto etmesi veya yeniden yazması gerekiyorsa Codex ön/son Compaction hook'ları ekleyin. |
| Bayt bayt model API isteği yakalama                | OpenClaw app-server isteklerini ve bildirimlerini yakalayabilir, ancak Codex çekirdeği son OpenAI API isteğini dahili olarak oluşturur.           | Bir Codex model-isteği izleme olayı veya hata ayıklama API'si gerektirir.                       |

## Araçlar, medya ve Compaction

Codex harness yalnızca düşük düzeyli gömülü ajan yürütücüsünü değiştirir.

OpenClaw araç listesini oluşturmaya ve harness'ten dinamik araç sonuçlarını almaya devam eder. Metin, görseller, video, müzik, TTS, onaylar ve mesajlaşma aracı çıktısı normal OpenClaw teslim yolundan geçmeye devam eder.

Yerel hook relay bilerek geneldir, ancak v1 destek sözleşmesi OpenClaw'ın test ettiği Codex-yerel araç ve izin yollarıyla sınırlıdır. Codex runtime'da buna shell, patch ve MCP `PreToolUse`, `PostToolUse` ve `PermissionRequest` yükleri dahildir. Runtime sözleşmesi adını vermedikçe, gelecekteki her Codex hook olayının bir OpenClaw Plugin yüzeyi olduğunu varsaymayın.

`PermissionRequest` için OpenClaw yalnızca ilke karar verdiğinde açık izin ver veya reddet kararları döndürür. Kararsız sonuç izin değildir. Codex bunu hook kararı yok olarak ele alır ve kendi guardian veya kullanıcı onayı yoluna düşer.

Codex MCP araç onayı istemleri, Codex `_meta.codex_approval_kind` değerini `"mcp_tool_call"` olarak işaretlediğinde OpenClaw'ın Plugin onay akışından yönlendirilir. Codex `request_user_input` istemleri kaynak sohbete geri gönderilir ve sıradaki bir sonraki takip mesajı, ekstra bağlam olarak yönlendirilmek yerine bu yerel sunucu isteğini yanıtlar. Diğer MCP istem istekleri kapalı şekilde başarısız olur.

Etkin çalıştırma kuyruğu yönlendirmesi Codex app-server `turn/steer` üzerine eşlenir. Varsayılan `messages.queue.mode: "steer"` ile OpenClaw, yapılandırılmış sessizlik penceresi için kuyruğa alınmış sohbet mesajlarını toplu hale getirir ve varış sırasına göre tek bir `turn/steer` isteği olarak gönderir. Eski `queue` modu ayrı `turn/steer` istekleri gönderir. Codex inceleme ve manuel Compaction turları aynı tur yönlendirmesini reddedebilir; bu durumda OpenClaw, seçili mod geri dönüşe izin verdiğinde takip kuyruğunu kullanır. Bkz. [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

Seçili model Codex harness kullandığında, yerel iş parçacığı Compaction işlemi Codex app-server'a devredilir. OpenClaw kanal geçmişi, arama, `/new`, `/reset` ve gelecekteki model veya harness değişimi için bir transkript yansısı tutar. Yansı, app-server bunları yaydığında kullanıcı istemini, son asistan metnini ve hafif Codex akıl yürütme veya plan kayıtlarını içerir. Bugün OpenClaw yalnızca yerel Compaction başlangıç ve tamamlanma sinyallerini kaydeder. Henüz insan tarafından okunabilir bir Compaction özeti veya Codex'in Compaction sonrasında hangi girdileri tuttuğunu gösteren denetlenebilir bir liste sunmaz.

Codex kanonik yerel iş parçacığının sahibi olduğu için `tool_result_persist` şu anda Codex-yerel araç sonuç kayıtlarını yeniden yazmaz. Yalnızca OpenClaw, OpenClaw'a ait bir oturum transkripti araç sonucu yazarken uygulanır.

Medya üretimi PI gerektirmez. Görsel, video, müzik, PDF, TTS ve medya anlama; `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` ve `messages.tts` gibi eşleşen sağlayıcı/model ayarlarını kullanmaya devam eder.

## Sorun giderme

**Codex normal bir `/model` sağlayıcısı olarak görünmüyor:** yeni yapılandırmalar için bu beklenen bir durumdur. `agentRuntime.id: "codex"` ile bir `openai/gpt-*` modeli (veya eski bir `codex/*` ref'i) seçin, `plugins.entries.codex.enabled` değerini etkinleştirin ve `plugins.allow` değerinin `codex` öğesini hariç tutup tutmadığını kontrol edin.

**OpenClaw Codex yerine PI kullanıyor:** hiçbir Codex harness çalıştırmayı üstlenmediğinde `agentRuntime.id: "auto"` uyumluluk arka ucu olarak PI kullanmaya devam edebilir. Test ederken Codex seçimini zorlamak için `agentRuntime.id: "codex"` ayarlayın. Zorlanmış bir Codex runtime, PI'a geri dönmek yerine başarısız olur. Codex app-server seçildikten sonra hataları doğrudan görünür.

**app-server reddediliyor:** app-server el sıkışmasının `0.125.0` veya daha yeni sürümü raporlaması için Codex'i yükseltin. Aynı sürüm ön sürümleri veya `0.125.0-alpha.2` ya da `0.125.0+custom` gibi build sonekli sürümler reddedilir, çünkü OpenClaw'ın test ettiği kararlı `0.125.0` protokol tabanıdır.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs` değerini düşürün veya keşfi devre dışı bırakın.

**WebSocket taşıması hemen başarısız oluyor:** `appServer.url`, `authToken` değerlerini ve uzak app-server'ın aynı Codex app-server protokol sürümünü konuştuğunu kontrol edin.

**Codex olmayan bir model PI kullanıyor:** bu, o ajan için `agentRuntime.id: "codex"` değerini zorlamadıysanız veya eski bir `codex/*` ref'i seçmediyseniz beklenen bir durumdur. Düz `openai/gpt-*` ve diğer sağlayıcı ref'leri `auto` modunda normal sağlayıcı yollarında kalır. `agentRuntime.id: "codex"` değerini zorlarsanız, o ajan için her gömülü tur Codex tarafından desteklenen bir OpenAI modeli olmalıdır.

**Computer Use kurulu ancak araçlar çalışmıyor:** yeni bir oturumdan `/codex computer-use status` komutunu kontrol edin. Bir araç `Native hook relay unavailable` bildirirse `/new` veya `/reset` kullanın; devam ederse eski yerel hook kayıtlarını temizlemek için Gateway'i yeniden başlatın. `computer-use.list_apps` zaman aşımına uğrarsa Codex Computer Use veya Codex Desktop'ı yeniden başlatıp tekrar deneyin.

## İlgili

- [Ajan harness Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Ajan runtime'ları](/tr/concepts/agent-runtimes)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [Durum](/tr/cli/status)
- [Plugin hook'ları](/tr/plugins/hooks)
- [Yapılandırma referansı](/tr/gateway/configuration-reference)
- [Test etme](/tr/help/testing-live#live-codex-app-server-harness-smoke)
