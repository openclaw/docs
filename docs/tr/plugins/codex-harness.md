---
read_when:
    - Paketle birlikte gelen Codex app-server düzeneğini kullanmak istiyorsunuz
    - Codex test düzeneği yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex dağıtımlarının PI'ye geri dönmek yerine başarısız olmasını istiyorsunuz
summary: OpenClaw yerleşik ajan turlarını birlikte gelen Codex app-server düzeneği üzerinden çalıştırın
title: Codex çalışma düzeneği
x-i18n:
    generated_at: "2026-04-30T09:34:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93abb72e9590aad265e5b6b8691dd16314178c4d255679b4e53da33b792a6e6b
    source_path: plugins/codex-harness.md
    workflow: 16
---

Birlikte gelen `codex` Plugin'i, OpenClaw'ın yerleşik PI koşumu yerine Codex uygulama sunucusu üzerinden gömülü ajan turları çalıştırmasını sağlar.

Bunu, düşük seviyeli ajan oturumunun Codex tarafından yönetilmesini istediğinizde kullanın: model keşfi, yerel iş parçacığı sürdürme, yerel Compaction ve uygulama sunucusu yürütmesi. OpenClaw sohbet kanallarını, oturum dosyalarını, model seçimini, araçları, onayları, medya teslimini ve görünür transkript yansısını yönetmeye devam eder.

Kendinizi konumlandırmaya çalışıyorsanız,
[Agent runtimes](/tr/concepts/agent-runtimes) ile başlayın. Kısa sürüm şudur:
`openai/gpt-5.5` model başvurusu, `codex` çalışma zamanı, Telegram, Discord, Slack veya başka bir kanal ise iletişim yüzeyidir.

## Bu Plugin'in değiştirdikleri

Birlikte gelen `codex` Plugin'i birkaç ayrı yetenek sağlar:

| Yetenek                          | Nasıl kullanırsınız                                 | Ne yapar                                                                      |
| -------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Yerel gömülü çalışma zamanı      | `agentRuntime.id: "codex"`                          | OpenClaw gömülü ajan turlarını Codex uygulama sunucusu üzerinden çalıştırır.  |
| Yerel sohbet denetim komutları   | `/codex bind`, `/codex resume`, `/codex steer`, ... | Bir mesajlaşma konuşmasından Codex uygulama sunucusu iş parçacıklarını bağlar ve denetler. |
| Codex uygulama sunucusu sağlayıcısı/kataloğu | `codex` iç bileşenleri, koşum üzerinden sunulur | Çalışma zamanının uygulama sunucusu modellerini keşfetmesini ve doğrulamasını sağlar. |
| Codex medya anlama yolu          | `codex/*` görüntü modeli uyumluluk yolları          | Desteklenen görüntü anlama modelleri için sınırlı Codex uygulama sunucusu turları çalıştırır. |
| Yerel kanca aktarıcısı           | Codex'e yerel olaylar etrafındaki Plugin kancaları  | OpenClaw'ın desteklenen Codex'e yerel araç/sonlandırma olaylarını gözlemlemesini/engellemesini sağlar. |

Plugin'i etkinleştirmek bu yetenekleri kullanılabilir hale getirir. Şunları **yapmaz**:

- her OpenAI modeli için Codex kullanmaya başlamak
- `openai-codex/*` model başvurularını yerel çalışma zamanına dönüştürmek
- ACP/acpx'i varsayılan Codex yolu yapmak
- zaten PI çalışma zamanı kaydetmiş mevcut oturumları anında değiştirmek
- OpenClaw kanal teslimini, oturum dosyalarını, kimlik doğrulama profili depolamayı veya
  ileti yönlendirmeyi değiştirmek

Aynı Plugin, yerel `/codex` sohbet denetim komut yüzeyini de yönetir. Plugin etkinse ve kullanıcı sohbetten Codex iş parçacıklarını bağlamayı, sürdürmeyi, yönlendirmeyi, durdurmayı veya incelemeyi isterse, ajanlar ACP yerine `/codex ...` tercih etmelidir. ACP, kullanıcı ACP/acpx istediğinde veya ACP Codex bağdaştırıcısını test ettiğinde açık yedek seçenek olarak kalır.

Yerel Codex turları, genel uyumluluk katmanı olarak OpenClaw Plugin kancalarını korur. Bunlar işlem içi OpenClaw kancalarıdır; Codex `hooks.json` komut kancaları değildir:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` yansıtılmış transkript kayıtları için
- `before_agent_finalize` Codex `Stop` aktarıcısı üzerinden
- `agent_end`

Plugin'ler ayrıca OpenClaw aracı çalıştırdıktan sonra ve sonuç Codex'e döndürülmeden önce OpenClaw dinamik araç sonuçlarını yeniden yazmak için çalışma zamanından bağımsız araç sonucu ara yazılımı kaydedebilir. Bu, OpenClaw'a ait transkript araç sonucu yazımlarını dönüştüren genel `tool_result_persist` Plugin kancasından ayrıdır.

Plugin kancası anlamları için [Plugin hooks](/tr/plugins/hooks)
ve [Plugin guard behavior](/tr/tools/plugin) sayfalarına bakın.

Koşum varsayılan olarak kapalıdır. Yeni yapılandırmalar OpenAI model başvurularını `openai/gpt-*` biçiminde kurallı tutmalı ve yerel uygulama sunucusu yürütmesi istediklerinde açıkça `agentRuntime.id: "codex"` veya `OPENCLAW_AGENT_RUNTIME=codex` zorlamalıdır. Eski `codex/*` model başvuruları uyumluluk için koşumu hâlâ otomatik seçer, ancak çalışma zamanı destekli eski sağlayıcı önekleri normal model/sağlayıcı seçenekleri olarak gösterilmez.

`codex` Plugin'i etkinse ancak birincil model hâlâ `openai-codex/*` ise, `openclaw doctor` rotayı değiştirmek yerine uyarır. Bu kasıtlıdır: `openai-codex/*`, PI Codex OAuth/abonelik yolu olarak kalır ve yerel uygulama sunucusu yürütmesi açık bir çalışma zamanı seçimi olarak kalır.

## Rota haritası

Yapılandırmayı değiştirmeden önce bu tabloyu kullanın:

| İstenen davranış                            | Model başvurusu          | Çalışma zamanı yapılandırması          | Plugin gereksinimi          | Beklenen durum etiketi          |
| ------------------------------------------- | ------------------------ | -------------------------------------- | --------------------------- | ------------------------------- |
| Normal OpenClaw çalıştırıcısı üzerinden OpenAI API | `openai/gpt-*`       | atlanmış veya `runtime: "pi"`          | OpenAI sağlayıcısı          | `Runtime: OpenClaw Pi Default`  |
| PI üzerinden Codex OAuth/abonelik           | `openai-codex/gpt-*`     | atlanmış veya `runtime: "pi"`          | OpenAI Codex OAuth sağlayıcısı | `Runtime: OpenClaw Pi Default` |
| Yerel Codex uygulama sunucusu gömülü turları | `openai/gpt-*`          | `agentRuntime.id: "codex"`             | `codex` Plugin'i            | `Runtime: OpenAI Codex`         |
| Tutucu otomatik modla karma sağlayıcılar    | sağlayıcıya özgü başvurular | `agentRuntime.id: "auto"`           | İsteğe bağlı Plugin çalışma zamanları | Seçilen çalışma zamanına bağlı |
| Açık Codex ACP bağdaştırıcı oturumu         | ACP istemi/modeline bağlı | `sessions_spawn` ile `runtime: "acp"` | sağlıklı `acpx` arka ucu     | ACP görev/oturum durumu         |

Önemli ayrım sağlayıcı ile çalışma zamanı arasındadır:

- `openai-codex/*`, "PI hangi sağlayıcı/kimlik doğrulama rotasını kullanmalı?" sorusunu yanıtlar
- `agentRuntime.id: "codex"`, "bu gömülü turu hangi döngü yürütmeli?" sorusunu yanıtlar
- `/codex ...`, "bu sohbet hangi yerel Codex konuşmasına bağlanmalı veya onu denetlemeli?" sorusunu yanıtlar
- ACP, "acpx hangi harici koşum sürecini başlatmalı?" sorusunu yanıtlar

## Doğru model önekini seçin

OpenAI ailesi rotaları öneke özeldir. PI üzerinden Codex OAuth istediğinizde `openai-codex/*` kullanın; doğrudan OpenAI API erişimi istediğinizde veya yerel Codex uygulama sunucusu koşumunu zorladığınızda `openai/*` kullanın:

| Model başvurusu                              | Çalışma zamanı yolu                        | Ne zaman kullanılır                                                        |
| -------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                             | OpenClaw/PI tesisatı üzerinden OpenAI sağlayıcısı | `OPENAI_API_KEY` ile mevcut doğrudan OpenAI Platform API erişimi istiyorsunuz. |
| `openai-codex/gpt-5.5`                       | OpenClaw/PI üzerinden OpenAI Codex OAuth   | Varsayılan PI çalıştırıcısıyla ChatGPT/Codex abonelik kimlik doğrulaması istiyorsunuz. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex uygulama sunucusu koşumu            | Gömülü ajan turu için yerel Codex uygulama sunucusu yürütmesi istiyorsunuz. |

GPT-5.5 şu anda OpenClaw'da yalnızca abonelik/OAuth ile kullanılabilir. PI OAuth için `openai-codex/gpt-5.5` kullanın veya Codex uygulama sunucusu koşumuyla `openai/gpt-5.5` kullanın. `openai/gpt-5.5` için doğrudan API anahtarı erişimi, OpenAI GPT-5.5'i genel API'de etkinleştirdiğinde desteklenir.

Eski `codex/gpt-*` başvuruları uyumluluk takma adları olarak kabul edilmeye devam eder. Doctor uyumluluk geçişi, eski birincil çalışma zamanı başvurularını kurallı model başvurularına yeniden yazar ve çalışma zamanı ilkesini ayrı kaydeder; yalnızca yedek eski başvurular ise değişmeden bırakılır, çünkü çalışma zamanı tüm ajan kapsayıcısı için yapılandırılır. Yeni PI Codex OAuth yapılandırmaları `openai-codex/gpt-*` kullanmalıdır; yeni yerel uygulama sunucusu koşumu yapılandırmaları `openai/gpt-*` artı `agentRuntime.id: "codex"` kullanmalıdır.

`agents.defaults.imageModel` aynı önek ayrımını izler. Görüntü anlama OpenAI Codex OAuth sağlayıcı yolu üzerinden çalışmalıysa `openai-codex/gpt-*` kullanın. Görüntü anlama sınırlı bir Codex uygulama sunucusu turu üzerinden çalışmalıysa `codex/gpt-*` kullanın. Codex uygulama sunucusu modeli görüntü girişi desteği bildirmelidir; yalnızca metin destekleyen Codex modelleri medya turu başlamadan önce başarısız olur.

Geçerli oturum için etkin koşumu doğrulamak üzere `/status` kullanın. Seçim şaşırtıcıysa, `agents/harness` alt sistemi için hata ayıklama günlüğünü etkinleştirin ve Gateway'in yapılandırılmış `agent harness selected` kaydını inceleyin. Bu kayıt seçilen koşum kimliğini, seçim nedenini, çalışma zamanı/yedek ilkesini ve `auto` modunda her Plugin adayının destek sonucunu içerir.

### Doctor uyarıları ne anlama gelir

`openclaw doctor`, aşağıdakilerin tümü doğru olduğunda uyarır:

- birlikte gelen `codex` Plugin'i etkin veya izinlidir
- bir ajanın birincil modeli `openai-codex/*`'dır
- o ajanın etkin çalışma zamanı `codex` değildir

Bu uyarı vardır çünkü kullanıcılar çoğu zaman "Codex Plugin'i etkin" ifadesinin "yerel Codex uygulama sunucusu çalışma zamanı" anlamına gelmesini bekler. OpenClaw bu sıçramayı yapmaz. Uyarının anlamı şudur:

- PI üzerinden ChatGPT/Codex OAuth amaçladıysanız **değişiklik gerekmez**.
- Yerel uygulama sunucusu yürütmesi amaçladıysanız modeli `openai/<model>` olarak değiştirin ve
  `agentRuntime.id: "codex"` ayarlayın.
- Çalışma zamanı değişikliğinden sonra mevcut oturumlar hâlâ `/new` veya `/reset` gerektirir,
  çünkü oturum çalışma zamanı sabitlemeleri yapışkandır.

Koşum seçimi canlı oturum denetimi değildir. Gömülü bir tur çalıştığında, OpenClaw seçilen koşum kimliğini o oturuma kaydeder ve aynı oturum kimliğindeki sonraki turlar için onu kullanmaya devam eder. Gelecekteki oturumların başka bir koşum kullanmasını istediğinizde `agentRuntime` yapılandırmasını veya `OPENCLAW_AGENT_RUNTIME` değerini değiştirin; mevcut bir konuşmayı PI ile Codex arasında değiştirmeden önce yeni bir oturum başlatmak için `/new` veya `/reset` kullanın. Bu, tek bir transkriptin iki uyumsuz yerel oturum sistemi üzerinden yeniden oynatılmasını önler.

Koşum sabitlemelerinden önce oluşturulmuş eski oturumlar, transkript geçmişleri olduğunda PI sabitlenmiş olarak değerlendirilir. Yapılandırmayı değiştirdikten sonra bu konuşmayı Codex'e almak için `/new` veya `/reset` kullanın.

`/status` etkin model çalışma zamanını gösterir. Varsayılan PI koşumu `Runtime: OpenClaw Pi Default` olarak, Codex uygulama sunucusu koşumu ise `Runtime: OpenAI Codex` olarak görünür.

## Gereksinimler

- Birlikte gelen `codex` Plugin'i kullanılabilir olan OpenClaw.
- Codex uygulama sunucusu `0.125.0` veya daha yeni. Birlikte gelen Plugin varsayılan olarak uyumlu bir Codex uygulama sunucusu ikilisini yönetir, bu nedenle `PATH` üzerindeki yerel `codex` komutları normal koşum başlatmasını etkilemez.
- Uygulama sunucusu süreci veya OpenClaw'ın Codex kimlik doğrulama köprüsü için Codex kimlik doğrulaması kullanılabilir olmalıdır.

Plugin, daha eski veya sürümsüz uygulama sunucusu el sıkışmalarını engeller. Bu, OpenClaw'ı test edilmiş olduğu protokol yüzeyinde tutar.

Canlı ve Docker duman testleri için kimlik doğrulama genellikle Codex CLI hesabından veya bir OpenClaw `openai-codex` kimlik doğrulama profilinden gelir. Yerel stdio uygulama sunucusu başlatmaları, hesap yoksa `CODEX_API_KEY` / `OPENAI_API_KEY` değerlerine de geri dönebilir.

## En küçük yapılandırma

`openai/gpt-5.5` kullanın, birlikte gelen Plugin'i etkinleştirin ve `codex` koşumunu zorlayın:

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

Yapılandırmanız `plugins.allow` kullanıyorsa, `codex` değerini oraya da ekleyin:

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

`agents.defaults.model` veya bir ajan modelini `codex/<model>` olarak ayarlayan eski yapılandırmalar, birlikte gelen `codex` Plugin'ini hâlâ otomatik etkinleştirir. Yeni yapılandırmalar yukarıdaki açık `agentRuntime` girdisiyle birlikte `openai/<model>` tercih etmelidir.

## Codex'i diğer modellerin yanına ekleyin

Aynı ajan Codex ve Codex dışı sağlayıcı modelleri arasında serbestçe geçiş yapacaksa `agentRuntime.id: "codex"` değerini genel olarak ayarlamayın. Zorlanmış çalışma zamanı, o ajan veya oturum için her gömülü tura uygulanır. Bu çalışma zamanı zorlanmışken bir Anthropic modeli seçerseniz, OpenClaw yine Codex koşumunu dener ve o turu sessizce PI üzerinden yönlendirmek yerine kapalı biçimde başarısız olur.

Bunun yerine şu yapılardan birini kullanın:

- Codex'i `agentRuntime.id: "codex"` olan ayrılmış bir ajana koyun.
- Varsayılan ajanı `agentRuntime.id: "auto"` üzerinde ve normal karma
  sağlayıcı kullanımı için PI geri dönüşüyle tutun.
- Eski `codex/*` başvurularını yalnızca uyumluluk için kullanın. Yeni yapılandırmalar
  `openai/*` ile açık bir Codex çalışma zamanı politikasını tercih etmelidir.

Örneğin, bu yapı varsayılan ajanı normal otomatik seçimde tutar ve
ayrı bir Codex ajanı ekler:

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

- Varsayılan `main` ajanı normal sağlayıcı yolunu ve PI uyumluluk geri dönüşünü kullanır.
- `codex` ajanı Codex app-server bağlayıcısını kullanır.
- Codex eksikse veya `codex` ajanı için desteklenmiyorsa, tur sessizce PI
  kullanmak yerine başarısız olur.

## Ajan komut yönlendirmesi

Ajanlar kullanıcı isteklerini yalnızca "Codex" sözcüğüne göre değil, amaca göre yönlendirmelidir:

| Kullanıcı şunu ister...                                  | Ajan şunu kullanmalıdır...                       |
| -------------------------------------------------------- | ------------------------------------------------ |
| "Bu sohbeti Codex'e bağla"                               | `/codex bind`                                    |
| "Codex iş parçacığı `<id>` burada sürdürülsün"           | `/codex resume <id>`                             |
| "Codex iş parçacıklarını göster"                         | `/codex threads`                                 |
| "Kötü bir Codex çalıştırması için destek raporu oluştur" | `/diagnostics [note]`                            |
| "Yalnızca bu ekli iş parçacığı için Codex geri bildirimi gönder" | `/codex diagnostics [note]`                      |
| "Bu ajan için çalışma zamanı olarak Codex kullan"        | `agentRuntime.id` için yapılandırma değişikliği  |
| "Normal OpenClaw ile ChatGPT/Codex aboneliğimi kullan"   | `openai-codex/*` model başvuruları              |
| "Codex'i ACP/acpx üzerinden çalıştır"                    | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Bir iş parçacığında Claude Code/Gemini/OpenCode/Cursor başlat" | ACP/acpx, `/codex` değil ve yerel alt ajanlar değil |

OpenClaw, ACP oluşturma kılavuzunu ajanlara yalnızca ACP etkinleştirildiğinde,
gönderilebilir olduğunda ve yüklenmiş bir çalışma zamanı arka ucu tarafından desteklendiğinde
duyurur. ACP kullanılamıyorsa, sistem istemi ve Plugin Skills ajana ACP
yönlendirmesini öğretmemelidir.

## Yalnızca Codex dağıtımları

Her gömülü ajan turunun Codex kullandığını kanıtlamanız gerektiğinde Codex bağlayıcısını
zorunlu kılın. Açık Plugin çalışma zamanları varsayılan olarak PI geri dönüşü kullanmaz, bu nedenle
`fallback: "none"` isteğe bağlıdır ancak çoğu zaman dokümantasyon olarak kullanışlıdır:

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

Codex zorunlu kılındığında, Codex Plugin devre dışıysa, app-server çok eskiyse
veya app-server başlatılamıyorsa OpenClaw erken başarısız olur.
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` ayarını yalnızca eksik bağlayıcı seçimini
bilerek PI'ın işlemesini istiyorsanız belirleyin.

## Ajan başına Codex

Varsayılan ajan normal otomatik seçimi korurken bir ajanı yalnızca Codex kullanacak
hale getirebilirsiniz:

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

Ajanlar ve modeller arasında geçiş yapmak için normal oturum komutlarını kullanın. `/new` yeni bir
OpenClaw oturumu oluşturur ve Codex bağlayıcısı gerektiğinde yan app-server
iş parçacığını oluşturur veya sürdürür. `/reset`, bu iş parçacığı için OpenClaw oturum bağlamasını
temizler ve bir sonraki turun bağlayıcıyı geçerli yapılandırmadan yeniden çözmesine izin verir.

## Model keşfi

Varsayılan olarak Codex Plugin, kullanılabilir modeller için app-server'a sorar. Keşif başarısız olursa
veya zaman aşımına uğrarsa, şunlar için paketlenmiş bir geri dönüş kataloğu kullanır:

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

Başlatmanın Codex'i yoklamaktan kaçınmasını ve yedek katalogla kalmasını istediğinizde keşfi devre dışı bırakın:

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

## App-server bağlantısı ve ilkesi

Varsayılan olarak Plugin, OpenClaw'ın yönetilen Codex ikilisini yerel olarak şununla başlatır:

```bash
codex app-server --listen stdio://
```

Yönetilen ikili, paketlenmiş bir Plugin çalışma zamanı bağımlılığı olarak bildirilir ve `codex` Plugin bağımlılıklarının geri kalanıyla birlikte hazırlanır. Bu, app-server sürümünü yerel olarak kurulu olabilecek ayrı bir Codex CLI yerine paketlenmiş Plugin'e bağlı tutar. `appServer.command` ayarını yalnızca bilerek farklı bir yürütülebilir dosya çalıştırmak istediğinizde yapın.

Varsayılan olarak OpenClaw, yerel Codex harness oturumlarını YOLO modunda başlatır: `approvalPolicy: "never"`, `approvalsReviewer: "user"` ve `sandbox: "danger-full-access"`. Bu, otonom heartbeat'ler için kullanılan güvenilir yerel operatör duruşudur: Codex, yanıtlayacak kimse olmadığında yerel onay istemlerinde durmadan kabuk ve ağ araçlarını kullanabilir.

Codex guardian tarafından incelenen onaylara dahil olmak için `appServer.mode:
"guardian"` ayarını yapın:

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

Guardian modu, Codex'in yerel otomatik inceleme onay yolunu kullanır. Codex sandbox dışına çıkmayı, çalışma alanı dışına yazmayı veya ağ erişimi gibi izinler eklemeyi istediğinde, Codex bu onay isteğini insan istemi yerine yerel inceleyiciye yönlendirir. İnceleyici, Codex'in risk çerçevesini uygular ve belirli isteği onaylar veya reddeder. YOLO modundan daha fazla koruma istediğinizde, ancak gözetimsiz ajanların yine de ilerleme kaydetmesi gerektiğinde Guardian kullanın.

`guardian` ön ayarı `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` ve `sandbox: "workspace-write"` olarak genişler. Tek tek ilke alanları yine de `mode` değerini geçersiz kılar, böylece gelişmiş dağıtımlar ön ayarı açık seçimlerle karıştırabilir. Daha eski `guardian_subagent` inceleyici değeri uyumluluk diğer adı olarak hâlâ kabul edilir, ancak yeni yapılandırmalar `auto_review` kullanmalıdır.

Zaten çalışmakta olan bir app-server için WebSocket aktarımını kullanın:

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

Stdio app-server başlatmaları varsayılan olarak OpenClaw'ın süreç ortamını devralır, ancak Codex app-server hesap köprüsünün sahibi OpenClaw'dır. Kimlik doğrulama şu sırayla seçilir:

1. Ajan için açık bir OpenClaw Codex kimlik doğrulama profili.
2. Yerel Codex CLI ChatGPT oturumu gibi app-server'ın mevcut hesabı.
3. Yalnızca yerel stdio app-server başlatmaları için, app-server hesabı yoksa ve OpenAI kimlik doğrulaması hâlâ gerekiyorsa önce `CODEX_API_KEY`, ardından `OPENAI_API_KEY`.

OpenClaw, ChatGPT abonelik stili bir Codex kimlik doğrulama profili gördüğünde, oluşturulan Codex alt sürecinden `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini kaldırır. Bu, Gateway düzeyi API anahtarlarını embeddings veya doğrudan OpenAI modelleri için kullanılabilir tutarken yerel Codex app-server turlarının yanlışlıkla API üzerinden ücretlendirilmesini önler. Açık Codex API anahtarı profilleri ve yerel stdio ortam anahtarı yedeği, devralınan alt süreç ortamı yerine app-server oturum açmasını kullanır. WebSocket app-server bağlantıları Gateway ortam API anahtarı yedeğini almaz; açık bir kimlik doğrulama profili veya uzak app-server'ın kendi hesabını kullanın.

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

Desteklenen `appServer` alanları:

| Alan                | Varsayılan                              | Anlam                                                                                                                                          |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` Codex'i başlatır; `"websocket"` `url` adresine bağlanır.                                                                             |
| `command`           | yönetilen Codex ikilisi                  | stdio aktarımı için yürütülebilir dosya. Yönetilen ikiliyi kullanmak için ayarlanmamış bırakın; yalnızca açık bir geçersiz kılma için ayarlayın. |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio aktarımı için bağımsız değişkenler.                                                                                                      |
| `url`               | ayarlanmamış                             | WebSocket app-server URL'si.                                                                                                                   |
| `authToken`         | ayarlanmamış                             | WebSocket aktarımı için Bearer belirteci.                                                                                                      |
| `headers`           | `{}`                                     | Ek WebSocket üst bilgileri.                                                                                                                    |
| `clearEnv`          | `[]`                                     | OpenClaw devralınan ortamını oluşturduktan sonra başlatılan stdio app-server sürecinden kaldırılan ek ortam değişkeni adları.                  |
| `requestTimeoutMs`  | `60000`                                  | app-server kontrol düzlemi çağrıları için zaman aşımı.                                                                                         |
| `mode`              | `"yolo"`                                 | YOLO veya guardian tarafından incelenen yürütme için ön ayar.                                                                                  |
| `approvalPolicy`    | `"never"`                                | İş parçacığı başlatma/sürdürme/tur için gönderilen yerel Codex onay ilkesi.                                                                    |
| `sandbox`           | `"danger-full-access"`                   | İş parçacığı başlatma/sürdürme için gönderilen yerel Codex sandbox modu.                                                                       |
| `approvalsReviewer` | `"user"`                                 | Codex'in yerel onay istemlerini incelemesine izin vermek için `"auto_review"` kullanın. `guardian_subagent` eski bir diğer ad olarak kalır.    |
| `serviceTier`       | ayarlanmamış                             | İsteğe bağlı Codex app-server hizmet katmanı: `"fast"`, `"flex"` veya `null`. Geçersiz eski değerler yok sayılır.                              |

OpenClaw'a ait dinamik araç çağrıları `appServer.requestTimeoutMs` değerinden
bağımsız olarak sınırlandırılır: her Codex `item/tool/call` isteği 30 saniye
içinde bir OpenClaw yanıtı almalıdır. Zaman aşımında OpenClaw, desteklendiği
yerlerde araç sinyalini iptal eder ve Codex'e başarısız bir dinamik araç yanıtı
döndürür; böylece oturumu `processing` durumunda bırakmak yerine turun devam
etmesi sağlanır.

OpenClaw, Codex tur kapsamlı bir app-server isteğine yanıt verdikten sonra,
harness ayrıca Codex'in yerel turu `turn/completed` ile bitirmesini bekler. Bu
yanıttan sonra app-server 60 saniye sessiz kalırsa OpenClaw en iyi çabayla
Codex turunu keser, tanısal bir zaman aşımı kaydeder ve OpenClaw oturum şeridini
serbest bırakır; böylece takip eden sohbet iletileri eski bir yerel turun
arkasında kuyruğa alınmaz.

Ortam geçersiz kılmaları yerel testler için kullanılabilir kalır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`, `appServer.command` ayarlanmamış olduğunda
yönetilen ikiliyi atlar.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırıldı. Bunun yerine
`plugins.entries.codex.config.appServer.mode: "guardian"` kullanın veya tek
seferlik yerel test için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın.
Yapılandırma, Plugin davranışını Codex harness kurulumunun geri kalanıyla aynı
incelenen dosyada tuttuğu için tekrarlanabilir dağıtımlarda tercih edilir.

## Bilgisayar kullanımı

Bilgisayar Kullanımı kendi kurulum kılavuzunda ele alınır:
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use).

Kısa sürüm: OpenClaw masaüstü denetim uygulamasını vendorlama yapmaz veya
masaüstü eylemlerini kendisi yürütmez. Codex app-server'ı hazırlar,
`computer-use` MCP sunucusunun kullanılabilir olduğunu doğrular ve ardından
Codex modu turları sırasında yerel MCP araç çağrılarını Codex'in yönetmesine
izin verir.

Codex marketplace akışı dışında doğrudan TryCua sürücü erişimi için
`cua-driver mcp` öğesini `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`
ile kaydedin. Codex'e ait Bilgisayar Kullanımı ile doğrudan MCP kaydı
arasındaki ayrım için [Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use)
sayfasına bakın.

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

Kurulum komut yüzeyinden denetlenebilir veya yüklenebilir:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Bilgisayar Kullanımı macOS'a özgüdür ve Codex MCP sunucusu uygulamaları
denetleyebilmeden önce yerel işletim sistemi izinleri gerektirebilir.
`computerUse.enabled` true ise ve MCP sunucusu kullanılamıyorsa, Codex modu
turları yerel Bilgisayar Kullanımı araçları olmadan sessizce çalışmak yerine iş
parçacığı başlamadan önce başarısız olur. Marketplace seçenekleri, uzak katalog
sınırları, durum nedenleri ve sorun giderme için
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use) sayfasına bakın.

`computerUse.autoInstall` true olduğunda, Codex henüz yerel bir marketplace
keşfetmediyse OpenClaw standart paketlenmiş Codex Desktop marketplace'ini
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`
konumundan kaydedebilir. Mevcut oturumların eski bir PI veya Codex iş parçacığı
bağını korumaması için çalışma zamanı ya da Bilgisayar Kullanımı yapılandırmasını
değiştirdikten sonra `/new` veya `/reset` kullanın.

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
Codex iş parçacığına bağlandığında, sonraki tur şu anda seçili OpenAI modelini,
sağlayıcıyı, onay ilkesini, sandbox'ı ve hizmet katmanını app-server'a yeniden
gönderir. `openai/gpt-5.5` modelinden `openai/gpt-5.2` modeline geçmek iş
parçacığı bağını korur, ancak Codex'ten yeni seçilen modelle devam etmesini
ister.

## Codex komutu

Paketlenmiş Plugin, `/codex` komutunu yetkili bir eğik çizgi komutu olarak
kaydeder. Geneldir ve OpenClaw metin komutlarını destekleyen tüm kanallarda
çalışır.

Yaygın biçimler:

- `/codex status` canlı app-server bağlantısını, modelleri, hesabı, hız sınırlarını, MCP sunucularını ve Skills öğelerini gösterir.
- `/codex models` canlı Codex app-server modellerini listeler.
- `/codex threads [filter]` son Codex iş parçacıklarını listeler.
- `/codex resume <thread-id>` geçerli OpenClaw oturumunu mevcut bir Codex iş parçacığına bağlar.
- `/codex compact` Codex app-server'dan bağlı iş parçacığını sıkıştırmasını ister.
- `/codex review` bağlı iş parçacığı için Codex yerel incelemesini başlatır.
- `/codex diagnostics [note]` bağlı iş parçacığı için Codex tanılama geri bildirimi göndermeden önce sorar.
- `/codex computer-use status` yapılandırılan Bilgisayar Kullanımı Plugin'ini ve MCP sunucusunu denetler.
- `/codex computer-use install` yapılandırılan Bilgisayar Kullanımı Plugin'ini yükler ve MCP sunucularını yeniden yükler.
- `/codex account` hesap ve hız sınırı durumunu gösterir.
- `/codex mcp` Codex app-server MCP sunucu durumunu listeler.
- `/codex skills` Codex app-server skills öğelerini listeler.

### Yaygın hata ayıklama iş akışı

Codex destekli bir agent Telegram, Discord, Slack veya başka bir kanalda
beklenmedik bir şey yaptığında, sorunun gerçekleştiği konuşmayla başlayın:

1. `/diagnostics bad tool choice after image upload` komutunu veya gördüğünüzü
   açıklayan başka bir kısa notu çalıştırın.
2. Tanılama isteğini bir kez onaylayın. Onay, yerel Gateway tanılama zip dosyasını
   oluşturur ve oturum Codex harness kullandığı için ilgili Codex geri bildirim
   paketini OpenAI sunucularına da gönderir.
3. Tamamlanan tanılama yanıtını hata raporuna veya destek iş parçacığına kopyalayın.
   Yerel paket yolunu, gizlilik özetini, OpenClaw oturum kimliklerini, Codex iş
   parçacığı kimliklerini ve her Codex iş parçacığı için bir `Inspect locally`
   satırını içerir.
4. Çalıştırmayı kendiniz hata ayıklamak istiyorsanız, yazdırılan `Inspect locally`
   komutunu bir terminalde çalıştırın. `codex resume <thread-id>` gibi görünür ve
   konuşmayı inceleyebilmeniz, yerelde sürdürebilmeniz veya Codex'e neden belirli
   bir aracı ya da planı seçtiğini sorabilmeniz için yerel Codex iş parçacığını
   açar.

`/codex diagnostics [note]` komutunu yalnızca tam OpenClaw Gateway tanılama
paketi olmadan, geçerli olarak bağlı iş parçacığı için özellikle Codex geri
bildirim yüklemesini istediğinizde kullanın. Çoğu destek raporu için
`/diagnostics [note]` daha iyi bir başlangıç noktasıdır; çünkü yerel Gateway
durumunu ve Codex iş parçacığı kimliklerini tek bir yanıtta bir araya getirir.
Tam gizlilik modeli ve grup sohbeti davranışı için
[Tanılama dışa aktarma](/tr/gateway/diagnostics) sayfasına bakın.

Çekirdek OpenClaw ayrıca genel Gateway tanılama komutu olarak yalnızca sahibin
kullanabildiği `/diagnostics [note]` komutunu sunar. Onay istemi hassas veri
önsözünü gösterir, [Tanılama Dışa Aktarma](/tr/gateway/diagnostics) sayfasına
bağlantı verir ve her seferinde açık exec onayıyla
`openclaw gateway diagnostics export --json` ister. Tanılamaları tümüne izin
veren bir kuralla onaylamayın. Onaydan sonra OpenClaw, yerel paket yolu ve
manifest özetiyle yapıştırılabilir bir rapor gönderir. Etkin OpenClaw oturumu
Codex harness kullanıyorsa, aynı onay ilgili Codex geri bildirim paketlerinin
OpenAI sunucularına gönderilmesini de yetkilendirir. Onay istemi Codex geri
bildiriminin gönderileceğini söyler, ancak onaydan önce Codex oturum veya iş
parçacığı kimliklerini listelemez.

`/diagnostics` bir grup sohbetinde bir sahip tarafından çağrılırsa, OpenClaw
paylaşılan kanalı temiz tutar: grup yalnızca kısa bir bildirim alırken,
tanılama önsözü, onay istemleri ve Codex oturum/iş parçacığı kimlikleri özel
onay yolu üzerinden sahibe gönderilir. Özel sahip yolu yoksa OpenClaw grup
isteğini reddeder ve sahibinden bunu bir DM üzerinden çalıştırmasını ister.

Onaylanmış Codex yüklemesi Codex uygulama sunucusundaki `feedback/upload` çağrısını yapar ve
uygulama sunucusundan, mevcut olduğunda listelenen her iş parçacığı ve oluşturulmuş Codex alt iş parçacıkları için günlükleri dahil etmesini ister. Yükleme, Codex'in normal geri bildirim yolu üzerinden OpenAI
sunucularına gider; Codex geri bildirimi o uygulama sunucusunda devre dışıysa komut
uygulama sunucusu hatasını döndürür. Tamamlanan tanılama yanıtı, gönderilen iş parçacıkları için kanalları,
OpenClaw oturum kimliklerini, Codex iş parçacığı kimliklerini ve yerel `codex resume <thread-id>`
komutlarını listeler. Onayı reddeder veya yok sayarsanız,
OpenClaw bu Codex kimliklerini yazdırmaz. Bu yükleme yerel
Gateway tanılama dışa aktarımının yerine geçmez.

`/codex resume`, harness'ın normal dönüşler için kullandığı aynı yan bağlama dosyasını yazar.
Sonraki iletide OpenClaw bu Codex iş parçacığını sürdürür, o anda seçili
OpenClaw modelini uygulama sunucusuna geçirir ve genişletilmiş geçmişi
etkin tutar.

### CLI'dan bir Codex iş parçacığını inceleme

Kötü bir Codex çalıştırmasını anlamanın en hızlı yolu çoğu zaman yerel Codex
iş parçacığını doğrudan açmaktır:

```sh
codex resume <thread-id>
```

Bunu bir kanal konuşmasında hata fark ettiğinizde ve sorunlu
Codex oturumunu incelemek, yerelde sürdürmek ya da Codex'e neden belirli bir
araç veya muhakeme seçimi yaptığını sormak istediğinizde kullanın. En kolay yol genellikle önce
`/diagnostics [note]` çalıştırmaktır: onay verdikten sonra tamamlanan rapor
her Codex iş parçacığını listeler ve örneğin
`codex resume <thread-id>` gibi bir `Inspect locally` komutu yazdırır. Bu komutu doğrudan terminale kopyalayabilirsiniz.

Geçerli sohbet için `/codex binding` komutundan veya son Codex uygulama sunucusu iş parçacıkları için
`/codex threads [filter]` komutundan da bir iş parçacığı kimliği alabilir, ardından kabuğunuzda aynı
`codex resume` komutunu çalıştırabilirsiniz.

Komut yüzeyi Codex uygulama sunucusu `0.125.0` veya daha yeni bir sürüm gerektirir. Gelecekteki veya özel bir uygulama sunucusu ilgili JSON-RPC yöntemini sunmuyorsa, tekil
denetim yöntemleri `unsupported by this Codex app-server` olarak bildirilir.

## Hook sınırları

Codex harness'ında üç hook katmanı vardır:

| Katman                                | Sahip                    | Amaç                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin hook'ları             | OpenClaw                 | PI ve Codex harness'ları genelinde ürün/Plugin uyumluluğu.          |
| Codex uygulama sunucusu uzantı ara katmanı | OpenClaw paketli Plugin'leri | OpenClaw dinamik araçları çevresinde dönüş başına bağdaştırıcı davranışı. |
| Codex yerel hook'ları                 | Codex                    | Codex yapılandırmasından düşük seviyeli Codex yaşam döngüsü ve yerel araç ilkesi. |

OpenClaw, OpenClaw Plugin davranışını yönlendirmek için proje veya genel Codex `hooks.json` dosyalarını kullanmaz. Desteklenen yerel araç ve izin köprüsü için
OpenClaw, `PreToolUse`, `PostToolUse`,
`PermissionRequest` ve `Stop` için iş parçacığı başına Codex yapılandırması enjekte eder. `SessionStart` ve
`UserPromptSubmit` gibi diğer Codex hook'ları Codex düzeyi denetimler olarak kalır; v1 sözleşmesinde
OpenClaw Plugin hook'ları olarak sunulmazlar.

OpenClaw dinamik araçları için OpenClaw, Codex çağrı istediğinde aracı yürütür; bu nedenle OpenClaw, harness bağdaştırıcısında sahip olduğu Plugin ve ara katman davranışını tetikler. Codex-yerel araçlar için kanonik araç kaydının sahibi Codex'tir.
OpenClaw seçili olayları yansıtabilir, ancak Codex bu işlemi uygulama sunucusu veya yerel hook
geri çağrıları üzerinden sunmadığı sürece yerel Codex iş parçacığını yeniden yazamaz.

Compaction ve LLM yaşam döngüsü projeksiyonları yerel Codex hook komutlarından değil, Codex uygulama sunucusu
bildirimlerinden ve OpenClaw bağdaştırıcı durumundan gelir.
OpenClaw'ın `before_compaction`, `after_compaction`, `llm_input` ve
`llm_output` olayları, Codex'in dahili isteğinin veya Compaction yüklerinin bayt bayt yakalamaları değil, bağdaştırıcı düzeyinde gözlemlerdir.

Codex yerel `hook/started` ve `hook/completed` uygulama sunucusu bildirimleri,
yörünge ve hata ayıklama için `codex_app_server.hook` aracı olayları olarak yansıtılır.
Bunlar OpenClaw Plugin hook'larını çağırmaz.

## V1 destek sözleşmesi

Codex modu, altında farklı bir model çağrısı bulunan PI değildir. Codex, yerel model döngüsünün daha fazlasına sahiptir ve OpenClaw, Plugin ve oturum yüzeylerini
bu sınırın çevresinde uyarlar.

Codex çalışma zamanı v1'de desteklenenler:

| Yüzey                                        | Destek                                  | Neden                                                                                                                                                                                                 |
| -------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex üzerinden OpenAI model döngüsü         | Desteklenir                             | Codex uygulama sunucusu OpenAI dönüşünün, yerel iş parçacığı sürdürmenin ve yerel araç devamının sahibidir.                                                                                            |
| OpenClaw kanal yönlendirme ve teslimi        | Desteklenir                             | Telegram, Discord, Slack, WhatsApp, iMessage ve diğer kanallar model çalışma zamanının dışında kalır.                                                                                                  |
| OpenClaw dinamik araçları                    | Desteklenir                             | Codex, OpenClaw'dan bu araçları yürütmesini ister; bu nedenle OpenClaw yürütme yolunda kalır.                                                                                                          |
| İstem ve bağlam Plugin'leri                  | Desteklenir                             | OpenClaw istem katmanlarını oluşturur ve iş parçacığını başlatmadan veya sürdürmeden önce bağlamı Codex dönüşüne yansıtır.                                                                             |
| Bağlam motoru yaşam döngüsü                  | Desteklenir                             | Birleştirme, alım veya dönüş sonrası bakım ve bağlam motoru Compaction koordinasyonu Codex dönüşleri için çalışır.                                                                                    |
| Dinamik araç hook'ları                       | Desteklenir                             | `before_tool_call`, `after_tool_call` ve araç sonucu ara katmanı OpenClaw'a ait dinamik araçların çevresinde çalışır.                                                                                  |
| Yaşam döngüsü hook'ları                      | Bağdaştırıcı gözlemleri olarak desteklenir | `llm_input`, `llm_output`, `agent_end`, `before_compaction` ve `after_compaction` gerçekçi Codex modu yükleriyle tetiklenir.                                                                           |
| Son yanıt düzeltme kapısı                    | Yerel hook rölesi üzerinden desteklenir | Codex `Stop`, `before_agent_finalize` öğesine iletilir; `revise`, sonlandırmadan önce Codex'ten bir model geçişi daha ister.                                                                           |
| Yerel kabuk, patch ve MCP engelleme veya gözlemleme | Yerel hook rölesi üzerinden desteklenir | Codex `PreToolUse` ve `PostToolUse`, Codex uygulama sunucusu `0.125.0` veya daha yenisindeki MCP yükleri dahil olmak üzere kabul edilmiş yerel araç yüzeyleri için iletilir. Engelleme desteklenir; argüman yeniden yazma desteklenmez. |
| Yerel izin ilkesi                            | Yerel hook rölesi üzerinden desteklenir | Codex `PermissionRequest`, çalışma zamanı sunduğu yerde OpenClaw ilkesinden geçirilebilir. OpenClaw karar döndürmezse Codex normal koruyucu veya kullanıcı onayı yolundan devam eder.                |
| Uygulama sunucusu yörünge yakalama           | Desteklenir                             | OpenClaw, uygulama sunucusuna gönderdiği isteği ve aldığı uygulama sunucusu bildirimlerini kaydeder.                                                                                                  |

Codex çalışma zamanı v1'de desteklenmeyenler:

| Yüzey                                              | V1 sınırı                                                                                                                                        | Gelecek yol                                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Yerel araç argümanı mutasyonu                      | Codex yerel araç öncesi hook'ları engelleyebilir, ancak OpenClaw Codex-yerel araç argümanlarını yeniden yazmaz.                                 | Yerine geçen araç girdisi için Codex hook/şema desteği gerektirir.                           |
| Düzenlenebilir Codex-yerel transkript geçmişi      | Kanonik yerel iş parçacığı geçmişinin sahibi Codex'tir. OpenClaw bir yansıtmanın sahibidir ve gelecek bağlamı yansıtabilir, ancak desteklenmeyen dahili öğeleri değiştirmemelidir. | Yerel iş parçacığı cerrahisi gerekiyorsa açık Codex uygulama sunucusu API'leri ekleyin.      |
| Codex-yerel araç kayıtları için `tool_result_persist` | Bu hook, Codex-yerel araç kayıtlarını değil, OpenClaw'a ait transkript yazımlarını dönüştürür.                                                   | Dönüştürülmüş kayıtları yansıtabilir, ancak kanonik yeniden yazma Codex desteği gerektirir.  |
| Zengin yerel Compaction meta verisi                | OpenClaw Compaction başlangıcını ve tamamlanmasını gözlemler, ancak kararlı bir tutulan/atılan listesi, token deltası veya özet yükü almaz.      | Daha zengin Codex Compaction olayları gerekir.                                               |
| Compaction müdahalesi                              | Geçerli OpenClaw Compaction hook'ları Codex modunda bildirim düzeyindedir.                                                                       | Plugin'lerin yerel Compaction'ı veto etmesi veya yeniden yazması gerekiyorsa Codex ön/son Compaction hook'ları ekleyin. |
| Bayt bayt model API isteği yakalama                | OpenClaw uygulama sunucusu isteklerini ve bildirimlerini yakalayabilir, ancak Codex çekirdeği son OpenAI API isteğini dahili olarak oluşturur.   | Codex model isteği izleme olayı veya hata ayıklama API'si gerekir.                           |

## Araçlar, medya ve Compaction

Codex harness'ı yalnızca düşük seviyeli gömülü aracı yürütücüsünü değiştirir.

OpenClaw yine de araç listesini oluşturur ve harness'tan dinamik araç sonuçlarını alır. Metin, görseller, video, müzik, TTS, onaylar ve mesajlaşma aracı çıktısı
normal OpenClaw teslim yolundan devam eder.

Yerel hook rölesi bilerek geneldir, ancak v1 destek sözleşmesi
OpenClaw'ın test ettiği Codex-yerel araç ve izin yollarıyla sınırlıdır. Codex çalışma zamanında bu, kabuk, patch ve MCP `PreToolUse`,
`PostToolUse` ve `PermissionRequest` yüklerini içerir. Çalışma zamanı sözleşmesi adını koyana kadar gelecekteki her Codex hook olayının bir OpenClaw Plugin yüzeyi olduğunu varsaymayın.

`PermissionRequest` için OpenClaw yalnızca ilke karar verdiğinde açık izin veya ret kararları döndürür. Kararsız sonuç izin değildir. Codex bunu hook kararı yok olarak ele alır ve kendi koruyucu veya kullanıcı onayı yoluna düşürür.

Codex MCP araç onayı elicitation'ları, Codex `_meta.codex_approval_kind` değerini
`"mcp_tool_call"` olarak işaretlediğinde OpenClaw'ın Plugin onay akışı üzerinden yönlendirilir. Codex `request_user_input` istemleri
kaynak sohbete geri gönderilir ve sıradaki bir sonraki takip iletisi, ek bağlam olarak yönlendirilmek yerine bu yerel
sunucu isteğini yanıtlar. Diğer MCP elicitation istekleri yine kapalı başarısız olur.

Etkin çalıştırma kuyruğu yönlendirmesi, Codex app-server `turn/steer` ile eşleşir. Varsayılan `messages.queue.mode: "steer"` ile OpenClaw, kuyruğa alınan sohbet mesajlarını yapılandırılmış sessizlik penceresi boyunca toplu hale getirir ve bunları varış sırasına göre tek bir `turn/steer` isteği olarak gönderir. Eski `queue` modu ayrı `turn/steer` istekleri gönderir. Codex inceleme ve manuel compaction turn'leri aynı turn yönlendirmesini reddedebilir; bu durumda OpenClaw, seçilen mod geri dönüşe izin verdiğinde takip kuyruğunu kullanır. Bkz. [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

Seçilen model Codex harness kullandığında, yerel thread compaction Codex app-server'a devredilir. OpenClaw kanal geçmişi, arama, `/new`, `/reset` ve gelecekteki model veya harness geçişleri için bir transcript aynası tutar. Ayna; kullanıcı istemini, son asistan metnini ve app-server bunları yaydığında hafif Codex akıl yürütme veya plan kayıtlarını içerir. Bugün OpenClaw yalnızca yerel compaction başlangıç ve tamamlanma sinyallerini kaydeder. Henüz insan tarafından okunabilir bir compaction özeti veya Codex'in compaction sonrasında hangi girdileri tuttuğuna dair denetlenebilir bir liste sunmaz.

Kanonik yerel thread'in sahibi Codex olduğundan, `tool_result_persist` şu anda Codex-yerel araç sonucu kayıtlarını yeniden yazmaz. Yalnızca OpenClaw, OpenClaw'a ait bir oturum transcript araç sonucu yazarken uygulanır.

Medya oluşturma PI gerektirmez. Görsel, video, müzik, PDF, TTS ve medya anlama; `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` ve `messages.tts` gibi eşleşen sağlayıcı/model ayarlarını kullanmaya devam eder.

## Sorun giderme

**Codex normal bir `/model` sağlayıcısı olarak görünmüyor:** yeni yapılandırmalar için bu beklenen bir durumdur. `agentRuntime.id: "codex"` ile bir `openai/gpt-*` modeli (veya eski bir `codex/*` ref'i) seçin, `plugins.entries.codex.enabled` etkinleştirin ve `plugins.allow` değerinin `codex` öğesini hariç tutup tutmadığını kontrol edin.

**OpenClaw Codex yerine PI kullanıyor:** `agentRuntime.id: "auto"`, hiçbir Codex harness çalıştırmayı sahiplenmediğinde uyumluluk arka ucu olarak hâlâ PI kullanabilir. Test ederken Codex seçimini zorlamak için `agentRuntime.id: "codex"` ayarlayın. Zorlanmış Codex runtime, siz açıkça `agentRuntime.fallback: "pi"` ayarlamadıkça artık PI'ye geri dönmek yerine başarısız olur. Codex app-server seçildikten sonra, hataları ek geri dönüş yapılandırması olmadan doğrudan görünür.

**app-server reddediliyor:** Codex'i yükselterek app-server el sıkışmasının `0.125.0` veya daha yeni sürümü bildirmesini sağlayın. Aynı sürüm ön sürümleri veya `0.125.0-alpha.2` ya da `0.125.0+custom` gibi derleme sonekli sürümler reddedilir, çünkü OpenClaw'ın test ettiği kararlı `0.125.0` protokol tabanıdır.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs` değerini düşürün veya keşfi devre dışı bırakın.

**WebSocket taşıması hemen başarısız oluyor:** `appServer.url`, `authToken` ve uzak app-server'ın aynı Codex app-server protokol sürümünü konuştuğunu kontrol edin.

**Codex olmayan bir model PI kullanıyor:** bu, o ajan için `agentRuntime.id: "codex"` zorlamadıysanız veya eski bir `codex/*` ref'i seçmediyseniz beklenen bir durumdur. Düz `openai/gpt-*` ve diğer sağlayıcı ref'leri `auto` modunda normal sağlayıcı yollarında kalır. `agentRuntime.id: "codex"` zorlarsanız, o ajan için her gömülü turn Codex destekli bir OpenAI modeli olmalıdır.

**Computer Use kurulu ancak araçlar çalışmıyor:** yeni bir oturumdan `/codex computer-use status` kontrol edin. Bir araç `Native hook relay unavailable` bildirirse `/new` veya `/reset` kullanın; devam ederse, eski yerel hook kayıtlarını temizlemek için gateway'i yeniden başlatın. `computer-use.list_apps` zaman aşımına uğrarsa Codex Computer Use veya Codex Desktop'ı yeniden başlatıp yeniden deneyin.

## İlgili

- [Ajan harness Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Ajan runtime'ları](/tr/concepts/agent-runtimes)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [Durum](/tr/cli/status)
- [Plugin hook'ları](/tr/plugins/hooks)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [Test etme](/tr/help/testing-live#live-codex-app-server-harness-smoke)
