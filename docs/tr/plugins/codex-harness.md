---
read_when:
    - Paketle birlikte gelen Codex app-server düzeneğini kullanmak istiyorsunuz
    - Codex çalıştırma düzeneği yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex dağıtımlarının PI'ye geri dönmek yerine başarısız olmasını istiyorsunuz
summary: Paketle birlikte gelen Codex app-server çalışma düzeneği üzerinden OpenClaw gömülü ajan turlarını çalıştırın
title: Codex düzeneği
x-i18n:
    generated_at: "2026-05-01T09:02:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 740e8fa9e6f4a737dfd250fe26b85865a7f7e40839b41e879e9224a45cbe8d72
    source_path: plugins/codex-harness.md
    workflow: 16
---

Birlikte verilen `codex` Plugin’i, OpenClaw’ın gömülü aracı turlarını yerleşik PI düzeneği yerine Codex app-server üzerinden çalıştırmasına izin verir.

Bunu, düşük seviyeli aracı oturumunun Codex tarafından yönetilmesini istediğinizde kullanın: model keşfi, yerel iş parçacığına devam etme, yerel Compaction ve app-server yürütmesi. OpenClaw sohbet kanallarını, oturum dosyalarını, model seçimini, araçları, onayları, medya teslimini ve görünür transkript aynasını yönetmeye devam eder.

Kendinizi konumlandırmaya çalışıyorsanız
[Aracı çalışma zamanları](/tr/concepts/agent-runtimes) ile başlayın. Kısa sürüm şudur:
`openai/gpt-5.5` model ref’idir, `codex` çalışma zamanıdır ve Telegram, Discord, Slack veya başka bir kanal iletişim yüzeyi olarak kalır.

## Hızlı yapılandırma

GPT aracı turları için Codex düzeneğini kullanmak üzere model ref’ini
`openai/gpt-*` olarak kanonik tutun, birlikte verilen `codex` Plugin’ini etkinleştirin ve
`agentRuntime.id: "codex"` ayarlayın:

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
        fallback: "none",
      },
    },
  },
}
```

Yapılandırmanız `plugins.allow` kullanıyorsa, `codex` öğesini oraya da ekleyin:

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

Bu yol için `openai-codex/gpt-*` kullanmayın. Bu, ayrıca bir çalışma zamanını zorlamadığınız sürece normal PI çalıştırıcısı üzerinden Codex OAuth’u seçer. Yapılandırma değişiklikleri yeni veya sıfırlanmış oturumlara uygulanır; mevcut oturumlar kaydedilmiş çalışma zamanlarını korur.

## Bu Plugin’in değiştirdikleri

Birlikte verilen `codex` Plugin’i birkaç ayrı yetenek sağlar:

| Yetenek                           | Nasıl kullanırsınız                                 | Ne yapar                                                                      |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Yerel gömülü çalışma zamanı       | `agentRuntime.id: "codex"`                          | OpenClaw gömülü aracı turlarını Codex app-server üzerinden çalıştırır.        |
| Yerel sohbet denetim komutları    | `/codex bind`, `/codex resume`, `/codex steer`, ... | Bir mesajlaşma konuşmasından Codex app-server iş parçacıklarını bağlar ve denetler. |
| Codex app-server sağlayıcı/katalog | `codex` iç işleyişleri, düzenek üzerinden sunulur   | Çalışma zamanının app-server modellerini keşfetmesini ve doğrulamasını sağlar. |
| Codex medya anlama yolu           | `codex/*` görüntü modeli uyumluluk yolları          | Desteklenen görüntü anlama modelleri için sınırlı Codex app-server turları çalıştırır. |
| Yerel kanca aktarıcısı            | Codex’e özgü olayların çevresindeki Plugin kancaları | OpenClaw’ın desteklenen Codex’e özgü araç/sonlandırma olaylarını gözlemlemesini/engellemesini sağlar. |

Plugin’i etkinleştirmek bu yetenekleri kullanılabilir kılar. Şunları **yapmaz**:

- her OpenAI modeli için Codex kullanmaya başlama
- `openai-codex/*` model ref’lerini yerel çalışma zamanına dönüştürme
- ACP/acpx’i varsayılan Codex yolu yapma
- zaten PI çalışma zamanı kaydetmiş mevcut oturumları anında değiştirme
- OpenClaw kanal teslimini, oturum dosyalarını, kimlik doğrulama profili depolamasını veya ileti yönlendirmeyi değiştirme

Aynı Plugin yerel `/codex` sohbet denetim komut yüzeyini de yönetir. Plugin etkinse ve kullanıcı sohbetten Codex iş parçacıklarını bağlamayı, sürdürmeyi, yönlendirmeyi, durdurmayı veya incelemeyi isterse aracılar ACP yerine `/codex ...` tercih etmelidir. ACP, kullanıcı ACP/acpx istediğinde veya ACP Codex bağdaştırıcısını test ettiğinde açık yedek olarak kalır.

Yerel Codex turları, OpenClaw Plugin kancalarını genel uyumluluk katmanı olarak korur. Bunlar süreç içi OpenClaw kancalarıdır, Codex `hooks.json` komut kancaları değildir:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` yansıtılmış transkript kayıtları için
- Codex `Stop` aktarıcısı üzerinden `before_agent_finalize`
- `agent_end`

Plugin’ler, OpenClaw aracı yürüttükten sonra ve sonuç Codex’e döndürülmeden önce OpenClaw dinamik araç sonuçlarını yeniden yazmak için çalışma zamanı nötr araç sonucu ara yazılımı da kaydedebilir. Bu, OpenClaw’a ait transkript araç sonucu yazımlarını dönüştüren genel `tool_result_persist` Plugin kancasından ayrıdır.

Plugin kancası semantiğinin kendisi için [Plugin kancaları](/tr/plugins/hooks) ve [Plugin koruma davranışı](/tr/tools/plugin) sayfalarına bakın.

Düzenek varsayılan olarak kapalıdır. Yeni yapılandırmalar OpenAI model ref’lerini
`openai/gpt-*` olarak kanonik tutmalı ve yerel app-server yürütmesi istediklerinde
`agentRuntime.id: "codex"` veya `OPENCLAW_AGENT_RUNTIME=codex` değerini açıkça zorlamalıdır. Eski `codex/*` model ref’leri uyumluluk için düzeneği hâlâ otomatik seçer, ancak çalışma zamanı destekli eski sağlayıcı önekleri normal model/sağlayıcı seçenekleri olarak gösterilmez.

`codex` Plugin’i etkinse ancak birincil model hâlâ `openai-codex/*` ise, `openclaw doctor` rotayı değiştirmek yerine uyarı verir. Bu kasıtlıdır: `openai-codex/*` PI Codex OAuth/abonelik yolu olarak kalır ve yerel app-server yürütmesi açık bir çalışma zamanı seçimi olarak kalır.

## Rota haritası

Yapılandırmayı değiştirmeden önce bu tabloyu kullanın:

| İstenen davranış                         | Model ref                  | Çalışma zamanı yapılandırması           | Plugin gereksinimi          | Beklenen durum etiketi         |
| ---------------------------------------- | -------------------------- | --------------------------------------- | --------------------------- | ------------------------------ |
| Normal OpenClaw çalıştırıcısı üzerinden OpenAI API | `openai/gpt-*`             | atlanmış veya `runtime: "pi"`           | OpenAI sağlayıcısı          | `Runtime: OpenClaw Pi Default` |
| PI üzerinden Codex OAuth/abonelik        | `openai-codex/gpt-*`       | atlanmış veya `runtime: "pi"`           | OpenAI Codex OAuth sağlayıcısı | `Runtime: OpenClaw Pi Default` |
| Yerel Codex app-server gömülü turları    | `openai/gpt-*`             | `agentRuntime.id: "codex"`              | `codex` Plugin’i            | `Runtime: OpenAI Codex`        |
| Temkinli otomatik modla karışık sağlayıcılar | sağlayıcıya özgü ref’ler   | `agentRuntime.id: "auto"`               | İsteğe bağlı Plugin çalışma zamanları | Seçilen çalışma zamanına bağlı |
| Açık Codex ACP bağdaştırıcı oturumu      | ACP istem/model bağımlı    | `runtime: "acp"` ile `sessions_spawn`   | sağlıklı `acpx` arka ucu    | ACP görev/oturum durumu        |

Önemli ayrım sağlayıcı ile çalışma zamanı arasındadır:

- `openai-codex/*` "PI hangi sağlayıcı/kimlik doğrulama rotasını kullanmalı?" sorusunu yanıtlar
- `agentRuntime.id: "codex"` "bu gömülü turu hangi döngü yürütmeli?" sorusunu yanıtlar
- `/codex ...` "bu sohbet hangi yerel Codex konuşmasını bağlamalı veya denetlemeli?" sorusunu yanıtlar
- ACP "acpx hangi harici düzenek sürecini başlatmalı?" sorusunu yanıtlar

## Doğru model önekini seçin

OpenAI ailesi rotaları öneke özeldir. PI üzerinden Codex OAuth istediğinizde `openai-codex/*` kullanın; doğrudan OpenAI API erişimi istediğinizde veya yerel Codex app-server düzeneğini zorlarken `openai/*` kullanın:

| Model ref                                     | Çalışma zamanı yolu                         | Ne zaman kullanılır                                                        |
| --------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenClaw/PI tesisatı üzerinden OpenAI sağlayıcısı | `OPENAI_API_KEY` ile güncel doğrudan OpenAI Platform API erişimi istediğinizde. |
| `openai-codex/gpt-5.5`                        | OpenClaw/PI üzerinden OpenAI Codex OAuth    | Varsayılan PI çalıştırıcısıyla ChatGPT/Codex abonelik kimlik doğrulaması istediğinizde. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server düzeneği                   | Gömülü aracı turu için yerel Codex app-server yürütmesi istediğinizde.     |

GPT-5.5 şu anda OpenClaw’da yalnızca abonelik/OAuth ile kullanılabilir. PI OAuth için `openai-codex/gpt-5.5` veya Codex app-server düzeneğiyle `openai/gpt-5.5` kullanın. `openai/gpt-5.5` için doğrudan API anahtarı erişimi, OpenAI GPT-5.5’i genel API’de etkinleştirdiğinde desteklenir.

Eski `codex/gpt-*` ref’leri uyumluluk takma adları olarak kabul edilmeye devam eder. Doctor uyumluluk migrasyonu eski birincil çalışma zamanı ref’lerini kanonik model ref’lerine yeniden yazar ve çalışma zamanı politikasını ayrı kaydeder; yalnızca yedek olan eski ref’ler ise değiştirilmeden bırakılır çünkü çalışma zamanı tüm aracı kapsayıcısı için yapılandırılır. Yeni PI Codex OAuth yapılandırmaları `openai-codex/gpt-*` kullanmalıdır; yeni yerel app-server düzeneği yapılandırmaları `openai/gpt-*` artı `agentRuntime.id: "codex"` kullanmalıdır.

`agents.defaults.imageModel` aynı önek ayrımını izler. Görüntü anlama OpenAI Codex OAuth sağlayıcı yolu üzerinden çalışmalıysa `openai-codex/gpt-*` kullanın. Görüntü anlama sınırlı bir Codex app-server turu üzerinden çalışmalıysa `codex/gpt-*` kullanın. Codex app-server modeli görüntü girişi desteği ilan etmelidir; yalnızca metin Codex modelleri medya turu başlamadan önce başarısız olur.

Geçerli oturum için etkin düzeneği doğrulamak üzere `/status` kullanın. Seçim şaşırtıcıysa `agents/harness` alt sistemi için hata ayıklama günlüğünü etkinleştirin ve Gateway’in yapılandırılmış `agent harness selected` kaydını inceleyin. Bu kayıt seçilen düzenek kimliğini, seçim nedenini, çalışma zamanı/yedek politikasını ve `auto` modunda her Plugin adayının destek sonucunu içerir.

### Doctor uyarıları ne anlama gelir

`openclaw doctor`, bunların tümü doğru olduğunda uyarı verir:

- birlikte verilen `codex` Plugin’i etkin veya izinli
- bir aracının birincil modeli `openai-codex/*`
- o aracının etkin çalışma zamanı `codex` değil

Bu uyarı vardır çünkü kullanıcılar genellikle "Codex Plugin etkin" ifadesinin "yerel Codex app-server çalışma zamanı" anlamına gelmesini bekler. OpenClaw bu sıçramayı yapmaz. Uyarı şu anlama gelir:

- PI üzerinden ChatGPT/Codex OAuth amaçladıysanız **değişiklik gerekmez**.
- Yerel app-server yürütmesi amaçladıysanız modeli `openai/<model>` olarak değiştirin ve
  `agentRuntime.id: "codex"` ayarlayın.
- Mevcut oturumlar, çalışma zamanı değişikliğinden sonra hâlâ `/new` veya `/reset` gerektirir,
  çünkü oturum çalışma zamanı sabitlemeleri yapışkandır.

Düzenek seçimi canlı oturum denetimi değildir. Gömülü bir tur çalıştığında OpenClaw, seçilen düzenek kimliğini o oturuma kaydeder ve aynı oturum kimliğindeki sonraki turlar için onu kullanmaya devam eder. Gelecekteki oturumların başka bir düzenek kullanmasını istediğinizde `agentRuntime` yapılandırmasını veya `OPENCLAW_AGENT_RUNTIME` değerini değiştirin; mevcut bir konuşmayı PI ile Codex arasında değiştirmeden önce yeni bir oturum başlatmak için `/new` veya `/reset` kullanın. Bu, bir transkriptin iki uyumsuz yerel oturum sistemi üzerinden yeniden oynatılmasını önler.

Düzenek sabitlemelerinden önce oluşturulan eski oturumlar, transkript geçmişleri olduğunda PI’ye sabitlenmiş kabul edilir. Yapılandırmayı değiştirdikten sonra o konuşmayı Codex’e almak için `/new` veya `/reset` kullanın.

`/status` etkin model çalışma zamanını gösterir. Varsayılan PI düzeneği `Runtime: OpenClaw Pi Default` olarak, Codex app-server düzeneği ise `Runtime: OpenAI Codex` olarak görünür.

## Gereksinimler

- Birlikte verilen `codex` Plugin’i kullanılabilir olan OpenClaw.
- Codex app-server `0.125.0` veya daha yenisi. Birlikte verilen Plugin varsayılan olarak uyumlu bir Codex app-server ikilisini yönetir, bu nedenle `PATH` üzerindeki yerel `codex` komutları normal düzenek başlatmasını etkilemez.
- app-server süreci veya OpenClaw’ın Codex kimlik doğrulama köprüsü için kullanılabilir Codex kimlik doğrulaması. Yerel app-server başlatmaları her aracı için OpenClaw tarafından yönetilen bir Codex home ve yalıtılmış bir alt `HOME` kullanır, bu nedenle varsayılan olarak kişisel `~/.codex` hesabınızı, Skills öğelerinizi, Plugin’lerinizi, yapılandırmanızı, iş parçacığı durumunuzu veya yerel `$HOME/.agents/skills` öğelerini okumaz.

Plugin, daha eski veya sürümlenmemiş app-server el sıkışmalarını engeller. Bu, OpenClaw’ın test edildiği protokol yüzeyinde kalmasını sağlar.

Canlı ve Docker smoke testleri için kimlik doğrulama genellikle Codex CLI hesabından veya bir OpenClaw `openai-codex` kimlik doğrulama profilinden gelir. Yerel stdio app-server başlatmaları, hesap yoksa `CODEX_API_KEY` / `OPENAI_API_KEY` değerlerine de geri dönebilir.

## Diğer modellerin yanına Codex ekleyin

Aynı ajanın Codex ve Codex dışı sağlayıcı modelleri arasında serbestçe geçiş yapması gerekiyorsa `agentRuntime.id: "codex"` değerini genel olarak ayarlamayın. Zorunlu runtime, o ajan veya oturum için her gömülü dönüşe uygulanır. Bu runtime zorunluyken bir Anthropic modeli seçerseniz OpenClaw yine Codex çalıştırma düzeneğini dener ve o dönüşü sessizce PI üzerinden yönlendirmek yerine kapalı şekilde başarısız olur.

Bunun yerine şu yapılardan birini kullanın:

- Codex'i `agentRuntime.id: "codex"` ile ayrılmış bir ajana koyun.
- Normal karma sağlayıcı kullanımı için varsayılan ajanı `agentRuntime.id: "auto"` üzerinde ve PI yedeğiyle tutun.
- Eski `codex/*` başvurularını yalnızca uyumluluk için kullanın. Yeni yapılandırmalar `openai/*` ile açık bir Codex runtime ilkesini tercih etmelidir.

Örneğin bu yapı, varsayılan ajanı normal otomatik seçimde tutar ve ayrı bir Codex ajanı ekler:

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
        fallback: "pi",
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

- Varsayılan `main` ajanı normal sağlayıcı yolunu ve PI uyumluluk yedeğini kullanır.
- `codex` ajanı Codex uygulama sunucusu çalıştırma düzeneğini kullanır.
- Codex, `codex` ajanı için eksik veya desteklenmiyorsa dönüş sessizce PI kullanmak yerine başarısız olur.

## Ajan komutu yönlendirme

Ajanlar kullanıcı isteklerini yalnızca "Codex" sözcüğüne göre değil, niyete göre yönlendirmelidir:

| Kullanıcı şunu ister...                                  | Ajan şunu kullanmalıdır...                        |
| -------------------------------------------------------- | ------------------------------------------------ |
| "Bu sohbeti Codex'e bağla"                               | `/codex bind`                                    |
| "Codex dizisi `<id>` burada sürdür"                      | `/codex resume <id>`                             |
| "Codex dizilerini göster"                                | `/codex threads`                                 |
| "Kötü bir Codex çalıştırması için destek raporu oluştur" | `/diagnostics [note]`                            |
| "Yalnızca bu ekli dizi için Codex geri bildirimi gönder" | `/codex diagnostics [note]`                      |
| "Bu ajan için runtime olarak Codex kullan"               | `agentRuntime.id` için yapılandırma değişikliği  |
| "Normal OpenClaw ile ChatGPT/Codex aboneliğimi kullan"   | `openai-codex/*` model başvuruları               |
| "Codex'i ACP/acpx üzerinden çalıştır"                    | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Bir dizide Claude Code/Gemini/OpenCode/Cursor başlat"   | ACP/acpx, `/codex` değil ve yerel alt ajanlar değil |

OpenClaw, ACP oluşturma rehberliğini ajanlara yalnızca ACP etkinse, dağıtılabiliyorsa ve yüklenmiş bir runtime arka ucu tarafından destekleniyorsa duyurur. ACP kullanılamıyorsa sistem istemi ve Plugin Skills ajana ACP yönlendirmesi öğretmemelidir.

## Yalnızca Codex dağıtımları

Her gömülü ajan dönüşünün Codex kullandığını kanıtlamanız gerektiğinde Codex çalıştırma düzeneğini zorunlu kılın. Açık Plugin runtime'ları varsayılan olarak PI yedeği kullanmaz, bu yüzden `fallback: "none"` isteğe bağlıdır ama çoğu zaman belgelendirme için yararlıdır:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

Ortam geçersiz kılması:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Codex zorunlu olduğunda, Codex Plugin'i devre dışıysa, uygulama sunucusu çok eskiyse veya uygulama sunucusu başlatılamıyorsa OpenClaw erken başarısız olur. `OPENCLAW_AGENT_HARNESS_FALLBACK=pi` değerini yalnızca eksik çalıştırma düzeneği seçimini PI'ın işlemesini bilerek istiyorsanız ayarlayın.

## Ajan başına Codex

Varsayılan ajan normal otomatik seçimi korurken bir ajanı yalnızca Codex yapabilirsiniz:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
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
          fallback: "none",
        },
      },
    ],
  },
}
```

Ajanlar ve modeller arasında geçiş yapmak için normal oturum komutlarını kullanın. `/new` yeni bir OpenClaw oturumu oluşturur ve Codex çalıştırma düzeneği gerektiğinde kendi yardımcı uygulama sunucusu dizisini oluşturur veya sürdürür. `/reset`, o dizi için OpenClaw oturumu bağını temizler ve sonraki dönüşün çalıştırma düzeneğini geçerli yapılandırmadan yeniden çözmesine izin verir.

## Model keşfi

Varsayılan olarak Codex Plugin'i kullanılabilir modeller için uygulama sunucusuna sorar. Keşif başarısız olursa veya zaman aşımına uğrarsa şu modeller için paketlenmiş yedek kataloğu kullanır:

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

Başlatmanın Codex'i yoklamasından kaçınmasını ve yedek kataloğa bağlı kalmasını istediğinizde keşfi devre dışı bırakın:

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

Varsayılan olarak Plugin, OpenClaw'ın yönetilen Codex ikilisini yerel olarak şununla başlatır:

```bash
codex app-server --listen stdio://
```

Yönetilen ikili, paketlenmiş Plugin runtime bağımlılığı olarak bildirilir ve diğer `codex` Plugin bağımlılıklarıyla birlikte hazırlanır. Bu, uygulama sunucusu sürümünü yerelde ayrı olarak kurulu olan herhangi bir Codex CLI yerine paketlenmiş Plugin'e bağlı tutar. `appServer.command` değerini yalnızca farklı bir yürütülebilir dosyayı bilerek çalıştırmak istediğinizde ayarlayın.

Varsayılan olarak OpenClaw yerel Codex çalıştırma düzeneği oturumlarını YOLO modunda başlatır: `approvalPolicy: "never"`, `approvalsReviewer: "user"` ve `sandbox: "danger-full-access"`. Bu, özerk Heartbeat'ler için kullanılan güvenilir yerel operatör duruşudur: Codex, yanıtlayacak kimse yokken yerel onay istemlerinde durmadan kabuk ve ağ araçlarını kullanabilir.

Codex koruyucu tarafından incelenen onayları etkinleştirmek için `appServer.mode:
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

Koruyucu modu Codex'in yerel otomatik inceleme onay yolunu kullanır. Codex sanal alandan çıkmayı, çalışma alanı dışına yazmayı veya ağ erişimi gibi izinler eklemeyi istediğinde Codex bu onay isteğini insan istemi yerine yerel inceleyiciye yönlendirir. İnceleyici Codex'in risk çerçevesini uygular ve belirli isteği onaylar veya reddeder. YOLO modundan daha fazla koruma istediğiniz ama yine de gözetimsiz ajanların ilerleme kaydetmesi gerektiği durumlarda Koruyucu'yu kullanın.

`guardian` ön ayarı `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` ve `sandbox: "workspace-write"` olarak genişler. Tek tek ilke alanları yine de `mode` değerini geçersiz kılar, bu yüzden gelişmiş dağıtımlar ön ayarı açık seçimlerle karıştırabilir. Daha eski `guardian_subagent` inceleyici değeri uyumluluk takma adı olarak hâlâ kabul edilir, ancak yeni yapılandırmalar `auto_review` kullanmalıdır.

Zaten çalışan bir uygulama sunucusu için WebSocket aktarımını kullanın:

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

Stdio uygulama sunucusu başlatmaları varsayılan olarak OpenClaw'ın süreç ortamını devralır, ancak OpenClaw Codex uygulama sunucusu hesap köprüsüne sahiptir ve hem `CODEX_HOME` hem de `HOME` değerlerini o ajanın OpenClaw durumu altında ajan başına dizinlere ayarlar. Codex'in kendi skill yükleyicisi `$CODEX_HOME/skills` ve `$HOME/.agents/skills` konumlarını okur, bu yüzden yerel uygulama sunucusu başlatmaları için iki değer de yalıtılır. Bu, Codex'e özgü Skills, Plugin'ler, yapılandırma, hesaplar ve dizi durumunun operatörün kişisel Codex CLI ana dizininden sızmak yerine OpenClaw ajanı kapsamında kalmasını sağlar.

OpenClaw Plugin'leri ve OpenClaw skill anlık görüntüleri yine de OpenClaw'ın kendi Plugin kayıt defteri ve skill yükleyicisinden geçer. Kişisel Codex CLI varlıkları geçmez. Bir OpenClaw ajanının parçası olması gereken yararlı Codex CLI Skills veya Plugin'leriniz varsa bunların envanterini açıkça çıkarın:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex geçiş sağlayıcısı Skills'i geçerli OpenClaw ajan çalışma alanına kopyalar. Codex yerel Plugin'leri, hook'ları ve yapılandırma dosyaları komut çalıştırabildikleri, MCP sunucuları açığa çıkarabildikleri veya kimlik bilgileri taşıyabildikleri için otomatik olarak etkinleştirilmek yerine manuel inceleme için raporlanır veya arşivlenir.

Kimlik doğrulama şu sırayla seçilir:

1. Ajan için açık bir OpenClaw Codex kimlik doğrulama profili.
2. Uygulama sunucusunun o ajanın Codex ana dizinindeki mevcut hesabı.
3. Yalnızca yerel stdio uygulama sunucusu başlatmaları için, uygulama sunucusu hesabı yoksa ve OpenAI kimlik doğrulaması hâlâ gerekiyorsa `CODEX_API_KEY`, ardından `OPENAI_API_KEY`.

OpenClaw ChatGPT aboneliği tarzı bir Codex kimlik doğrulama profili gördüğünde, oluşturulan Codex alt sürecinden `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini kaldırır. Bu, Gateway düzeyi API anahtarlarını gömmeler veya doğrudan OpenAI modelleri için kullanılabilir tutarken yerel Codex uygulama sunucusu dönüşlerinin yanlışlıkla API üzerinden faturalandırılmasını engeller. Açık Codex API anahtarı profilleri ve yerel stdio ortam anahtarı yedeği, devralınan alt süreç ortamı yerine uygulama sunucusu oturum açmasını kullanır. WebSocket uygulama sunucusu bağlantıları Gateway ortam API anahtarı yedeği almaz; açık bir kimlik doğrulama profili veya uzak uygulama sunucusunun kendi hesabını kullanın.

Bir dağıtım ek ortam yalıtımı gerektiriyorsa bu değişkenleri `appServer.clearEnv` değerine ekleyin:

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

`appServer.clearEnv` yalnızca oluşturulan Codex uygulama sunucusu alt sürecini etkiler.

Desteklenen `appServer` alanları:

| Alan                | Varsayılan                               | Anlam                                                                                                                                                                                                                                |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` Codex'i başlatır; `"websocket"` `url` adresine bağlanır.                                                                                                                                                                   |
| `command`           | yönetilen Codex ikili dosyası            | stdio aktarımı için çalıştırılabilir dosya. Yönetilen ikili dosyayı kullanmak için ayarlanmamış bırakın; yalnızca açık bir geçersiz kılma için ayarlayın.                                                                            |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio aktarımı için argümanlar.                                                                                                                                                                                                      |
| `url`               | ayarlanmamış                             | WebSocket app-server URL'si.                                                                                                                                                                                                         |
| `authToken`         | ayarlanmamış                             | WebSocket aktarımı için Bearer token.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | Ek WebSocket üstbilgileri.                                                                                                                                                                                                           |
| `clearEnv`          | `[]`                                     | OpenClaw devralınan ortamını oluşturduktan sonra başlatılan stdio app-server işleminden kaldırılan ek ortam değişkeni adları. `CODEX_HOME` ve `HOME`, yerel başlatmalarda OpenClaw'ın ajan başına Codex izolasyonu için ayrılmıştır. |
| `requestTimeoutMs`  | `60000`                                  | app-server kontrol düzlemi çağrıları için zaman aşımı.                                                                                                                                                                               |
| `mode`              | `"yolo"`                                 | YOLO veya koruyucu incelemeli yürütme için ön ayar.                                                                                                                                                                                  |
| `approvalPolicy`    | `"never"`                                | İplik başlatma/sürdürme/tur işlemlerine gönderilen yerel Codex onay ilkesi.                                                                                                                                                          |
| `sandbox`           | `"danger-full-access"`                   | İplik başlatma/sürdürme işlemlerine gönderilen yerel Codex sandbox modu.                                                                                                                                                             |
| `approvalsReviewer` | `"user"`                                 | Codex'in yerel onay istemlerini incelemesine izin vermek için `"auto_review"` kullanın. `guardian_subagent` eski bir diğer ad olarak kalır.                                                                                          |
| `serviceTier`       | ayarlanmamış                             | İsteğe bağlı Codex app-server hizmet katmanı: `"fast"`, `"flex"` veya `null`. Geçersiz eski değerler yok sayılır.                                                                                                                    |

OpenClaw'a ait dinamik araç çağrıları `appServer.requestTimeoutMs` değerinden
bağımsız olarak sınırlandırılır: her Codex `item/tool/call` isteği 30 saniye
içinde bir OpenClaw yanıtı almalıdır. Zaman aşımında OpenClaw, desteklenen
yerlerde araç sinyalini iptal eder ve Codex'e başarısız bir dinamik araç yanıtı
döndürür; böylece oturum `processing` durumunda bırakılmak yerine tur devam
edebilir.

OpenClaw bir Codex tur kapsamlı app-server isteğine yanıt verdikten sonra,
test düzeneği Codex'in yerel turu `turn/completed` ile bitirmesini de bekler.
app-server bu yanıttan sonra 60 saniye sessiz kalırsa OpenClaw en iyi çabayla
Codex turunu keser, tanılama zaman aşımını kaydeder ve OpenClaw oturum hattını
serbest bırakır; böylece takip eden sohbet iletileri eskimiş bir yerel turun
arkasında kuyruğa alınmaz.

Yerel test için ortam geçersiz kılmaları kullanılabilir kalır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command` ayarlanmamışsa `OPENCLAW_CODEX_APP_SERVER_BIN` yönetilen
ikili dosyayı atlar.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırıldı. Bunun yerine
`plugins.entries.codex.config.appServer.mode: "guardian"` kullanın veya tek
seferlik yerel test için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın.
Yinelenebilir dağıtımlar için yapılandırma tercih edilir; çünkü Plugin
davranışını Codex test düzeneği kurulumunun geri kalanıyla aynı incelenen
dosyada tutar.

## Bilgisayar kullanımı

Bilgisayar Kullanımı kendi kurulum kılavuzunda ele alınır:
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use).

Kısa sürüm: OpenClaw masaüstü denetim uygulamasını dahil etmez veya masaüstü
eylemlerini kendisi yürütmez. Codex app-server'ı hazırlar, `computer-use` MCP
sunucusunun kullanılabilir olduğunu doğrular ve ardından Codex modu turlarında
yerel MCP araç çağrılarını Codex'in işlemesine izin verir.

Codex marketplace akışı dışında doğrudan TryCua sürücü erişimi için
`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` ile
`cua-driver mcp` kaydedin. Codex'e ait Bilgisayar Kullanımı ile doğrudan MCP
kaydı arasındaki ayrım için [Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use)
bölümüne bakın.

En düşük yapılandırma:

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
        fallback: "none",
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

Bilgisayar Kullanımı macOS'a özeldir ve Codex MCP sunucusu uygulamaları
denetleyebilmeden önce yerel işletim sistemi izinleri gerektirebilir.
`computerUse.enabled` true ise ve MCP sunucusu kullanılamıyorsa Codex modu
turları, yerel Bilgisayar Kullanımı araçları olmadan sessizce çalışmak yerine
iplik başlamadan önce başarısız olur. Marketplace seçenekleri, uzak katalog
sınırları, durum nedenleri ve sorun giderme için
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use) bölümüne bakın.

`computerUse.autoInstall` true olduğunda OpenClaw, Codex henüz yerel bir
marketplace keşfetmediyse standart paketli Codex Desktop marketplace'i
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` konumundan
kaydedebilir. Çalışma zamanı veya Bilgisayar Kullanımı yapılandırmasını
değiştirdikten sonra `/new` veya `/reset` kullanın; böylece mevcut oturumlar
eski bir PI ya da Codex iplik bağını tutmaz.

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

Yalnızca Codex test düzeneği doğrulaması:

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

Koruyucu incelemeli Codex onayları:

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
Codex ipliğine eklendiğinde, sonraki tur o anda seçili OpenAI modelini,
sağlayıcıyı, onay ilkesini, sandbox'ı ve hizmet katmanını app-server'a yeniden
gönderir. `openai/gpt-5.5` modelinden `openai/gpt-5.2` modeline geçmek iplik
bağını korur ancak Codex'ten yeni seçilen modelle devam etmesini ister.

## Codex komutu

Paketli Plugin, `/codex` komutunu yetkili bir slash komutu olarak kaydeder.
Geneldir ve OpenClaw metin komutlarını destekleyen herhangi bir kanalda çalışır.

Yaygın biçimler:

- `/codex status` canlı app-server bağlantısını, modelleri, hesabı, hız sınırlarını, MCP sunucularını ve skills'i gösterir.
- `/codex models` canlı Codex app-server modellerini listeler.
- `/codex threads [filter]` son Codex ipliklerini listeler.
- `/codex resume <thread-id>` mevcut OpenClaw oturumunu var olan bir Codex ipliğine ekler.
- `/codex compact` Codex app-server'dan ekli ipliği sıkıştırmasını ister.
- `/codex review` ekli iplik için Codex yerel incelemesini başlatır.
- `/codex diagnostics [note]` ekli iplik için Codex tanılama geri bildirimi göndermeden önce sorar.
- `/codex computer-use status` yapılandırılmış Bilgisayar Kullanımı Plugin'ini ve MCP sunucusunu denetler.
- `/codex computer-use install` yapılandırılmış Bilgisayar Kullanımı Plugin'ini kurar ve MCP sunucularını yeniden yükler.
- `/codex account` hesap ve hız sınırı durumunu gösterir.
- `/codex mcp` Codex app-server MCP sunucusu durumunu listeler.
- `/codex skills` Codex app-server skills'ini listeler.

### Yaygın hata ayıklama iş akışı

Codex destekli bir ajan Telegram, Discord, Slack veya başka bir kanalda
beklenmedik bir şey yaptığında, sorunun gerçekleştiği konuşmadan başlayın:

1. Gördüğünüz şeyi açıklayan `/diagnostics bad tool choice after image upload`
   veya başka bir kısa not çalıştırın.
2. Tanılama isteğini bir kez onaylayın. Onay yerel Gateway tanılama zip'ini
   oluşturur ve oturum Codex test düzeneğini kullandığı için ilgili Codex geri
   bildirim paketini OpenAI sunucularına da gönderir.
3. Tamamlanan tanılama yanıtını hata raporuna veya destek ipliğine kopyalayın.
   Yerel paket yolunu, gizlilik özetini, OpenClaw oturum kimliklerini, Codex
   iplik kimliklerini ve her Codex ipliği için bir `Inspect locally` satırını
   içerir.
4. Çalıştırmayı kendiniz hata ayıklamak istiyorsanız yazdırılan `Inspect locally`
   komutunu bir terminalde çalıştırın. `codex resume <thread-id>` gibi görünür
   ve yerel Codex ipliğini açar; böylece konuşmayı inceleyebilir, yerel olarak
   sürdürebilir veya Codex'e belirli bir aracı ya da planı neden seçtiğini
   sorabilirsiniz.

`/codex diagnostics [note]` komutunu yalnızca tam OpenClaw Gateway tanılama paketi olmadan, o anda ekli olan iş parçacığı için özellikle Codex geri bildirim yüklemesini istediğinizde kullanın. Çoğu destek raporu için `/diagnostics [note]` daha iyi bir başlangıç noktasıdır, çünkü yerel Gateway durumunu ve Codex iş parçacığı kimliklerini tek bir yanıtta ilişkilendirir. Tam gizlilik modeli ve grup sohbeti davranışı için [Tanılama dışa aktarımı](/tr/gateway/diagnostics) bölümüne bakın.

Çekirdek OpenClaw ayrıca genel Gateway tanılama komutu olarak yalnızca sahiplerin kullanabildiği `/diagnostics [note]` komutunu da sunar. Onay istemi hassas veri ön açıklamasını gösterir, [Tanılama Dışa Aktarımı](/tr/gateway/diagnostics) bağlantısını verir ve her seferinde açık exec onayıyla `openclaw gateway diagnostics export --json` isteğinde bulunur. Tanılamayı tümüne izin veren bir kuralla onaylamayın. Onaydan sonra OpenClaw, yerel paket yolunu ve manifest özetini içeren yapıştırılabilir bir rapor gönderir. Etkin OpenClaw oturumu Codex koşumunu kullandığında, aynı onay ilgili Codex geri bildirim paketlerinin OpenAI sunucularına gönderilmesine de yetki verir. Onay istemi Codex geri bildiriminin gönderileceğini söyler, ancak onaydan önce Codex oturum veya iş parçacığı kimliklerini listelemez.

Bir sahip grup sohbetinde `/diagnostics` komutunu çağırırsa OpenClaw paylaşılan kanalı temiz tutar: grup yalnızca kısa bir bildirim alırken, tanılama ön açıklaması, onay istemleri ve Codex oturum/iş parçacığı kimlikleri özel onay rotası üzerinden sahibine gönderilir. Özel sahip rotası yoksa OpenClaw grup isteğini reddeder ve sahibinden bunu bir DM üzerinden çalıştırmasını ister.

Onaylanan Codex yüklemesi Codex app-server `feedback/upload` çağrısını yapar ve app-server'dan, kullanılabilir olduğunda listelenen her iş parçacığı ve oluşturulmuş Codex alt iş parçacıkları için günlükleri dahil etmesini ister. Yükleme, Codex'in normal geri bildirim yolu üzerinden OpenAI sunucularına gider; o app-server'da Codex geri bildirimi devre dışıysa komut app-server hatasını döndürür. Tamamlanan tanılama yanıtı, gönderilen iş parçacıkları için kanalları, OpenClaw oturum kimliklerini, Codex iş parçacığı kimliklerini ve yerel `codex resume <thread-id>` komutlarını listeler. Onayı reddeder veya yok sayarsanız OpenClaw bu Codex kimliklerini yazdırmaz. Bu yükleme yerel Gateway tanılama dışa aktarımının yerine geçmez.

`/codex resume`, koşumun normal turlarda kullandığı aynı sidecar bağlama dosyasını yazar. Sonraki iletide OpenClaw o Codex iş parçacığını sürdürür, seçili OpenClaw modelini app-server'a geçirir ve genişletilmiş geçmişi etkin tutar.

### CLI'dan bir Codex iş parçacığını inceleyin

Kötü bir Codex çalıştırmasını anlamanın en hızlı yolu çoğu zaman yerel Codex iş parçacığını doğrudan açmaktır:

```sh
codex resume <thread-id>
```

Bunu, bir kanal konuşmasında hata fark ettiğinizde ve sorunlu Codex oturumunu incelemek, yerelde sürdürmek veya Codex'e neden belirli bir araç ya da akıl yürütme seçimi yaptığını sormak istediğinizde kullanın. En kolay yol genellikle önce `/diagnostics [note]` çalıştırmaktır: onayladıktan sonra tamamlanan rapor her Codex iş parçacığını listeler ve örneğin `codex resume <thread-id>` gibi bir `Inspect locally` komutu yazdırır. Bu komutu doğrudan bir terminale kopyalayabilirsiniz.

Geçerli sohbet için `/codex binding` komutundan veya son Codex app-server iş parçacıkları için `/codex threads [filter]` komutundan da bir iş parçacığı kimliği alabilir, ardından kabuğunuzda aynı `codex resume` komutunu çalıştırabilirsiniz.

Komut yüzeyi Codex app-server `0.125.0` veya daha yenisini gerektirir. Gelecekteki veya özel bir app-server bu JSON-RPC yöntemini sunmuyorsa, tekil denetim yöntemleri `unsupported by this Codex app-server` olarak raporlanır.

## Kanca sınırları

Codex koşumunda üç kanca katmanı vardır:

| Katman                                | Sahip                    | Amaç                                                                  |
| ------------------------------------- | ------------------------ | --------------------------------------------------------------------- |
| OpenClaw Plugin kancaları             | OpenClaw                 | PI ve Codex koşumları genelinde ürün/Plugin uyumluluğu.               |
| Codex app-server uzantı ara katmanı   | OpenClaw paketli Plugin'ler | OpenClaw dinamik araçları etrafında tur başına bağdaştırıcı davranışı. |
| Codex yerel kancaları                 | Codex                    | Codex yapılandırmasından düşük düzey Codex yaşam döngüsü ve yerel araç ilkesi. |

OpenClaw, OpenClaw Plugin davranışını yönlendirmek için proje veya genel Codex `hooks.json` dosyalarını kullanmaz. Desteklenen yerel araç ve izin köprüsü için OpenClaw, `PreToolUse`, `PostToolUse`, `PermissionRequest` ve `Stop` için iş parçacığı başına Codex yapılandırması enjekte eder. `SessionStart` ve `UserPromptSubmit` gibi diğer Codex kancaları Codex düzeyi denetimler olarak kalır; v1 sözleşmesinde OpenClaw Plugin kancaları olarak sunulmazlar.

OpenClaw dinamik araçları için OpenClaw, Codex çağrıyı istedikten sonra aracı yürütür; bu nedenle OpenClaw, koşum bağdaştırıcısında sahibi olduğu Plugin ve ara katman davranışını tetikler. Codex'e özgü yerel araçlar için kanonik araç kaydının sahibi Codex'tir. OpenClaw seçili olayları yansıtabilir, ancak Codex bu işlemi app-server veya yerel kanca geri çağrıları üzerinden sunmadıkça yerel Codex iş parçacığını yeniden yazamaz.

Compaction ve LLM yaşam döngüsü izdüşümleri, yerel Codex kanca komutlarından değil Codex app-server bildirimlerinden ve OpenClaw bağdaştırıcı durumundan gelir. OpenClaw'ın `before_compaction`, `after_compaction`, `llm_input` ve `llm_output` olayları bağdaştırıcı düzeyi gözlemlerdir; Codex'in iç isteğinin veya Compaction yüklerinin bayt bayt yakalamaları değildir.

Codex yerel `hook/started` ve `hook/completed` app-server bildirimleri, yörünge ve hata ayıklama için `codex_app_server.hook` ajan olayları olarak yansıtılır. Bunlar OpenClaw Plugin kancalarını çağırmaz.

## V1 destek sözleşmesi

Codex modu, altında farklı bir model çağrısı olan PI değildir. Codex yerel model döngüsünün daha büyük bir bölümünün sahibidir ve OpenClaw Plugin ve oturum yüzeylerini bu sınıra göre uyarlar.

Codex runtime v1'de desteklenir:

| Yüzey                                         | Destek                                  | Neden                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex üzerinden OpenAI model döngüsü          | Desteklenir                             | Codex app-server OpenAI turunun, yerel iş parçacığı sürdürmenin ve yerel araç devamının sahibidir.                                                                                                     |
| OpenClaw kanal yönlendirme ve teslimi         | Desteklenir                             | Telegram, Discord, Slack, WhatsApp, iMessage ve diğer kanallar model runtime'ının dışında kalır.                                                                                                      |
| OpenClaw dinamik araçları                     | Desteklenir                             | Codex, OpenClaw'dan bu araçları yürütmesini ister; bu nedenle OpenClaw yürütme yolunda kalır.                                                                                                        |
| İstem ve bağlam Plugin'leri                   | Desteklenir                             | OpenClaw, iş parçacığını başlatmadan veya sürdürmeden önce istem örtülerini oluşturur ve bağlamı Codex turuna yansıtır.                                                                               |
| Bağlam motoru yaşam döngüsü                   | Desteklenir                             | Birleştirme, içe alma veya tur sonrası bakım ve bağlam motoru Compaction koordinasyonu Codex turları için çalışır.                                                                                   |
| Dinamik araç kancaları                        | Desteklenir                             | `before_tool_call`, `after_tool_call` ve araç sonucu ara katmanı, OpenClaw'ın sahibi olduğu dinamik araçların etrafında çalışır.                                                                      |
| Yaşam döngüsü kancaları                       | Bağdaştırıcı gözlemleri olarak desteklenir | `llm_input`, `llm_output`, `agent_end`, `before_compaction` ve `after_compaction` dürüst Codex modu yükleriyle tetiklenir.                                                                            |
| Son yanıt revizyon kapısı                     | Yerel kanca aktarıcısı üzerinden desteklenir | Codex `Stop`, `before_agent_finalize` öğesine aktarılır; `revise`, sonlandırmadan önce Codex'ten bir model geçişi daha ister.                                                                         |
| Yerel kabuk, yama ve MCP engelleme veya gözlemleme | Yerel kanca aktarıcısı üzerinden desteklenir | Codex `PreToolUse` ve `PostToolUse`, Codex app-server `0.125.0` veya daha yenisindeki MCP yükleri dahil olmak üzere işlenmiş yerel araç yüzeyleri için aktarılır. Engelleme desteklenir; argüman yeniden yazma desteklenmez. |
| Yerel izin ilkesi                             | Yerel kanca aktarıcısı üzerinden desteklenir | Codex `PermissionRequest`, runtime bunu sunduğunda OpenClaw ilkesi üzerinden yönlendirilebilir. OpenClaw karar döndürmezse Codex normal koruyucu veya kullanıcı onay yolundan devam eder.            |
| App-server yörünge yakalama                   | Desteklenir                             | OpenClaw, app-server'a gönderdiği isteği ve aldığı app-server bildirimlerini kaydeder.                                                                                                                |

Codex runtime v1'de desteklenmez:

| Yüzey                                             | V1 sınırı                                                                                                                                     | Gelecek yol                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Yerel araç argümanı mutasyonu                       | Codex yerel araç öncesi kancaları engelleyebilir, ancak OpenClaw Codex'e özgü yerel araç argümanlarını yeniden yazmaz.                                               | Değiştirilecek araç girdisi için Codex kanca/şema desteği gerektirir.                            |
| Düzenlenebilir Codex'e özgü yerel transkript geçmişi            | Codex, kanonik yerel iş parçacığı geçmişine sahiptir. OpenClaw bir aynaya sahiptir ve gelecekteki bağlamı yansıtabilir, ancak desteklenmeyen dahili yapıları değiştirmemelidir. | Yerel iş parçacığı cerrahisi gerekiyorsa açık Codex app-server API'leri ekleyin.                    |
| Codex'e özgü yerel araç kayıtları için `tool_result_persist` | Bu kanca, Codex'e özgü yerel araç kayıtlarını değil, OpenClaw'a ait transkript yazımlarını dönüştürür.                                                           | Dönüştürülmüş kayıtları aynalayabilir, ancak kanonik yeniden yazım Codex desteği gerektirir.              |
| Zengin yerel Compaction meta verisi                     | OpenClaw Compaction başlangıcını ve tamamlanmasını gözlemler, ancak kararlı bir tutuldu/bırakıldı listesi, token farkı veya özet yükü almaz.            | Daha zengin Codex Compaction olayları gerekir.                                                     |
| Compaction müdahalesi                             | Mevcut OpenClaw Compaction kancaları Codex modunda bildirim düzeyindedir.                                                                         | Plugin'lerin yerel Compaction'ı veto etmesi veya yeniden yazması gerekiyorsa Codex ön/son Compaction kancaları ekleyin. |
| Bayt bayt model API isteği yakalama             | OpenClaw app-server isteklerini ve bildirimlerini yakalayabilir, ancak Codex çekirdeği nihai OpenAI API isteğini dahili olarak oluşturur.                      | Bir Codex model isteği izleme olayı veya hata ayıklama API'si gerekir.                                   |

## Araçlar, medya ve Compaction

Codex harness yalnızca düşük düzeyli gömülü ajan yürütücüsünü değiştirir.

OpenClaw yine de araç listesini oluşturur ve harness'ten dinamik araç sonuçlarını
alır. Metin, görüntüler, video, müzik, TTS, onaylar ve mesajlaşma aracı çıktısı
normal OpenClaw teslim yolundan geçmeye devam eder.

Yerel kanca aktarıcısı kasıtlı olarak geneldir, ancak v1 destek sözleşmesi
OpenClaw'ın test ettiği Codex'e özgü yerel araç ve izin yollarıyla sınırlıdır.
Codex çalışma zamanında buna shell, patch ve MCP `PreToolUse`,
`PostToolUse` ve `PermissionRequest` yükleri dahildir. Çalışma zamanı sözleşmesi
adını verene kadar gelecekteki her Codex kanca olayının bir OpenClaw Plugin yüzeyi
olduğunu varsaymayın.

`PermissionRequest` için OpenClaw yalnızca politika karar verdiğinde açık izin
veya ret kararları döndürür. Kararsız sonuç bir izin değildir. Codex bunu kanca
kararı yok olarak değerlendirir ve kendi koruyucusuna veya kullanıcı onayı yoluna
devreder.

Codex MCP araç onayı istemleri, Codex `_meta.codex_approval_kind` değerini
`"mcp_tool_call"` olarak işaretlediğinde OpenClaw'ın Plugin onay akışı üzerinden
yönlendirilir. Codex `request_user_input` istemleri kaynak sohbete geri gönderilir
ve sıradaki bir sonraki takip mesajı, ek bağlam olarak yönlendirilmek yerine bu
yerel sunucu isteğini yanıtlar. Diğer MCP isteme istekleri yine kapalı şekilde
başarısız olur.

Etkin çalışma kuyruğu yönlendirmesi Codex app-server `turn/steer` ile eşlenir.
Varsayılan `messages.queue.mode: "steer"` ile OpenClaw, yapılandırılmış sessiz
pencere boyunca kuyruktaki sohbet mesajlarını toplar ve bunları geliş sırasına
göre tek bir `turn/steer` isteği olarak gönderir. Eski `queue` modu ayrı
`turn/steer` istekleri gönderir. Codex inceleme ve manuel Compaction turları aynı
tur yönlendirmesini reddedebilir; bu durumda seçilen mod geri dönüşe izin
veriyorsa OpenClaw takip kuyruğunu kullanır. Bkz.
[Yönlendirme kuyruğu](/tr/concepts/queue-steering).

Seçilen model Codex harness kullandığında, yerel iş parçacığı Compaction'ı
Codex app-server'a devredilir. OpenClaw kanal geçmişi, arama, `/new`, `/reset`
ve gelecekteki model veya harness geçişi için bir transkript aynası tutar. Ayna,
kullanıcı istemini, son asistan metnini ve app-server bunları yaydığında hafif
Codex akıl yürütme veya plan kayıtlarını içerir. Bugün OpenClaw yalnızca yerel
Compaction başlangıç ve tamamlanma sinyallerini kaydeder. Henüz insan tarafından
okunabilir bir Compaction özeti veya Codex'in Compaction sonrasında hangi
girdileri tuttuğuna dair denetlenebilir bir liste sunmaz.

Kanonik yerel iş parçacığı Codex'e ait olduğundan, `tool_result_persist` şu anda
Codex'e özgü yerel araç sonuç kayıtlarını yeniden yazmaz. Yalnızca OpenClaw,
OpenClaw'a ait bir oturum transkripti araç sonucu yazarken uygulanır.

Medya üretimi PI gerektirmez. Görüntü, video, müzik, PDF, TTS ve medya anlama
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` ve
`messages.tts` gibi eşleşen sağlayıcı/model ayarlarını kullanmaya devam eder.

## Sorun giderme

**Codex normal bir `/model` sağlayıcısı olarak görünmüyor:** yeni yapılandırmalar
için bu beklenir. `agentRuntime.id: "codex"` ile bir `openai/gpt-*` modeli
(veya eski bir `codex/*` referansı) seçin, `plugins.entries.codex.enabled`
öğesini etkinleştirin ve `plugins.allow` öğesinin `codex` değerini dışlayıp
dışlamadığını kontrol edin.

**OpenClaw Codex yerine PI kullanıyor:** `agentRuntime.id: "auto"` hiçbir Codex
harness çalışmayı üstlenmediğinde uyumluluk arka ucu olarak hâlâ PI kullanabilir.
Test sırasında Codex seçimini zorlamak için `agentRuntime.id: "codex"` ayarlayın.
Zorlanan bir Codex çalışma zamanı artık, açıkça `agentRuntime.fallback: "pi"`
ayarlamadığınız sürece PI'ye geri dönmek yerine başarısız olur. Codex app-server
seçildikten sonra hataları ek geri dönüş yapılandırması olmadan doğrudan görünür.

**app-server reddediliyor:** app-server el sıkışmasının `0.125.0` veya daha yeni
sürüm bildirmesi için Codex'i yükseltin. Aynı sürümün ön sürümleri veya
`0.125.0-alpha.2` ya da `0.125.0+custom` gibi derleme sonekli sürümler reddedilir,
çünkü OpenClaw'ın test ettiği kararlı protokol tabanı `0.125.0` sürümüdür.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs` değerini
düşürün veya keşfi devre dışı bırakın.

**WebSocket taşıması hemen başarısız oluyor:** `appServer.url`, `authToken` ve
uzak app-server'ın aynı Codex app-server protokol sürümünü konuştuğunu kontrol
edin.

**Codex olmayan bir model PI kullanıyor:** bu, söz konusu ajan için
`agentRuntime.id: "codex"` zorlamadığınız veya eski bir `codex/*` referansı
seçmediğiniz sürece beklenir. Düz `openai/gpt-*` ve diğer sağlayıcı referansları
`auto` modunda normal sağlayıcı yollarında kalır. `agentRuntime.id: "codex"`
zorlarsanız, o ajan için her gömülü turun Codex tarafından desteklenen bir OpenAI
modeli olması gerekir.

**Computer Use yüklü ancak araçlar çalışmıyor:** yeni bir oturumdan
`/codex computer-use status` öğesini kontrol edin. Bir araç
`Native hook relay unavailable` bildirirse `/new` veya `/reset` kullanın; devam
ederse eski yerel kanca kayıtlarını temizlemek için Gateway'i yeniden başlatın.
`computer-use.list_apps` zaman aşımına uğrarsa Codex Computer Use veya Codex
Desktop'ı yeniden başlatıp tekrar deneyin.

## İlgili

- [Ajan harness Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Ajan çalışma zamanları](/tr/concepts/agent-runtimes)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [Durum](/tr/cli/status)
- [Plugin kancaları](/tr/plugins/hooks)
- [Yapılandırma referansı](/tr/gateway/configuration-reference)
- [Test etme](/tr/help/testing-live#live-codex-app-server-harness-smoke)
