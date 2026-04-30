---
read_when:
    - Birlikte gelen Codex app-server test düzeneğini kullanmak istiyorsunuz
    - Codex çalıştırma ortamı yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex dağıtımlarının PI'ye geri dönmek yerine başarısız olmasını istiyorsunuz
summary: OpenClaw gömülü ajan turlarını birlikte gelen Codex app-server düzeneği üzerinden çalıştırın
title: Codex çalışma düzeneği
x-i18n:
    generated_at: "2026-04-30T20:05:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 335ec60cbdb76579db833eccb5151ffc5bcd28b370ca2e99587abdb578eeee4f
    source_path: plugins/codex-harness.md
    workflow: 16
---

Birlikte gelen `codex` Plugin'i, OpenClaw'ın gömülü ajan turlarını yerleşik PI çalıştırıcısı yerine Codex uygulama sunucusu üzerinden çalıştırmasını sağlar.

Bunu, düşük seviyeli ajan oturumunu Codex'in yönetmesini istediğinizde kullanın: model keşfi, yerel iş parçacığı sürdürme, yerel Compaction ve uygulama sunucusu yürütmesi. OpenClaw hâlâ sohbet kanallarını, oturum dosyalarını, model seçimini, araçları, onayları, medya teslimini ve görünür döküm yansısını yönetir.

Kendinizi konumlandırmaya çalışıyorsanız
[Ajan çalışma zamanları](/tr/concepts/agent-runtimes) ile başlayın. Kısa sürüm şudur:
`openai/gpt-5.5` model referansıdır, `codex` çalışma zamanıdır ve Telegram,
Discord, Slack veya başka bir kanal iletişim yüzeyi olarak kalır.

## Bu Plugin neyi değiştirir

Birlikte gelen `codex` Plugin'i birkaç ayrı yetenek sağlar:

| Yetenek                           | Nasıl kullanırsınız                                  | Ne yapar                                                                       |
| --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Yerel gömülü çalışma zamanı       | `agentRuntime.id: "codex"`                          | OpenClaw gömülü ajan turlarını Codex uygulama sunucusu üzerinden çalıştırır.   |
| Yerel sohbet denetim komutları    | `/codex bind`, `/codex resume`, `/codex steer`, ... | Mesajlaşma konuşmasından Codex uygulama sunucusu iş parçacıklarını bağlar ve denetler. |
| Codex uygulama sunucusu sağlayıcısı/kataloğu | `codex` iç bileşenleri, çalıştırıcı üzerinden sunulur | Çalışma zamanının uygulama sunucusu modellerini keşfetmesini ve doğrulamasını sağlar. |
| Codex medya anlama yolu           | `codex/*` görüntü modeli uyumluluk yolları          | Desteklenen görüntü anlama modelleri için sınırlı Codex uygulama sunucusu turları çalıştırır. |
| Yerel hook aktarıcısı             | Codex'e yerel olaylar etrafındaki Plugin hook'ları  | OpenClaw'ın desteklenen Codex'e yerel araç/sonlandırma olaylarını gözlemlemesini/engellemesini sağlar. |

Plugin'i etkinleştirmek bu yetenekleri kullanılabilir kılar. Şunları **yapmaz**:

- her OpenAI modeli için Codex kullanmaya başlamak
- `openai-codex/*` model referanslarını yerel çalışma zamanına dönüştürmek
- ACP/acpx'i varsayılan Codex yolu yapmak
- zaten bir PI çalışma zamanı kaydetmiş mevcut oturumları anında değiştirmek
- OpenClaw kanal teslimini, oturum dosyalarını, auth-profile depolamasını veya
  ileti yönlendirmesini değiştirmek

Aynı Plugin, yerel `/codex` sohbet denetim komut yüzeyini de yönetir. Plugin etkinse ve kullanıcı sohbetten Codex iş parçacıklarını bağlamayı, sürdürmeyi, yönlendirmeyi, durdurmayı veya incelemeyi isterse, ajanlar ACP yerine `/codex ...` tercih etmelidir. ACP, kullanıcı ACP/acpx istediğinde veya ACP Codex bağdaştırıcısını test ettiğinde açık geri dönüş olarak kalır.

Yerel Codex turları, OpenClaw Plugin hook'larını genel uyumluluk katmanı olarak tutar. Bunlar süreç içi OpenClaw hook'larıdır, Codex `hooks.json` komut hook'ları değildir:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` yansıtılmış döküm kayıtları için
- Codex `Stop` aktarıcısı üzerinden `before_agent_finalize`
- `agent_end`

Plugin'ler, OpenClaw aracı yürüttükten sonra ve sonuç Codex'e döndürülmeden önce OpenClaw dinamik araç sonuçlarını yeniden yazmak için çalışma zamanından bağımsız araç sonucu ara katman yazılımı da kaydedebilir. Bu, OpenClaw'ın sahip olduğu döküm araç sonucu yazımlarını dönüştüren genel `tool_result_persist` Plugin hook'undan ayrıdır.

Plugin hook semantiğinin kendisi için [Plugin hook'ları](/tr/plugins/hooks) ve [Plugin koruma davranışı](/tr/tools/plugin) bölümlerine bakın.

Çalıştırıcı varsayılan olarak kapalıdır. Yeni yapılandırmalar OpenAI model referanslarını `openai/gpt-*` olarak kurallı tutmalı ve yerel uygulama sunucusu yürütmesi istediklerinde açıkça `agentRuntime.id: "codex"` veya `OPENCLAW_AGENT_RUNTIME=codex` zorlamalıdır. Eski `codex/*` model referansları uyumluluk için çalıştırıcıyı hâlâ otomatik seçer, ancak çalışma zamanı destekli eski sağlayıcı önekleri normal model/sağlayıcı seçenekleri olarak gösterilmez.

`codex` Plugin'i etkinse ancak birincil model hâlâ `openai-codex/*` ise, `openclaw doctor` rotayı değiştirmek yerine uyarır. Bu bilinçlidir: `openai-codex/*` PI Codex OAuth/abonelik yolu olarak kalır ve yerel uygulama sunucusu yürütmesi açık bir çalışma zamanı seçimi olarak kalır.

## Rota haritası

Yapılandırmayı değiştirmeden önce bu tabloyu kullanın:

| İstenen davranış                          | Model referansı           | Çalışma zamanı yapılandırması           | Plugin gereksinimi          | Beklenen durum etiketi          |
| ----------------------------------------- | ------------------------- | --------------------------------------- | --------------------------- | ------------------------------- |
| Normal OpenClaw çalıştırıcısı üzerinden OpenAI API | `openai/gpt-*`             | atlanmış veya `runtime: "pi"`           | OpenAI sağlayıcısı          | `Runtime: OpenClaw Pi Default`  |
| PI üzerinden Codex OAuth/abonelik         | `openai-codex/gpt-*`      | atlanmış veya `runtime: "pi"`           | OpenAI Codex OAuth sağlayıcısı | `Runtime: OpenClaw Pi Default` |
| Yerel Codex uygulama sunucusu gömülü turları | `openai/gpt-*`             | `agentRuntime.id: "codex"`              | `codex` Plugin'i            | `Runtime: OpenAI Codex`         |
| Koruyucu otomatik modla karışık sağlayıcılar | sağlayıcıya özgü referanslar | `agentRuntime.id: "auto"`               | İsteğe bağlı Plugin çalışma zamanları | Seçilen çalışma zamanına bağlı |
| Açık Codex ACP bağdaştırıcısı oturumu     | ACP prompt/model bağımlı  | `sessions_spawn` ile `runtime: "acp"`   | sağlıklı `acpx` arka ucu    | ACP görev/oturum durumu         |

Önemli ayrım sağlayıcı ile çalışma zamanı arasındadır:

- `openai-codex/*` "PI hangi sağlayıcı/auth rotasını kullanmalı?" sorusunu yanıtlar
- `agentRuntime.id: "codex"` "bu gömülü turu hangi döngü yürütmeli?"
  sorusunu yanıtlar
- `/codex ...` "bu sohbet hangi yerel Codex konuşmasına bağlanmalı
  veya onu denetlemeli?" sorusunu yanıtlar
- ACP "acpx hangi dış çalıştırıcı sürecini başlatmalı?" sorusunu yanıtlar

## Doğru model önekini seçin

OpenAI ailesi rotaları öneke özgüdür. PI üzerinden Codex OAuth istediğinizde `openai-codex/*` kullanın; doğrudan OpenAI API erişimi istediğinizde veya yerel Codex uygulama sunucusu çalıştırıcısını zorladığınızda `openai/*` kullanın:

| Model referansı                              | Çalışma zamanı yolu                       | Ne zaman kullanılır                                                       |
| -------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                             | OpenClaw/PI tesisatı üzerinden OpenAI sağlayıcısı | `OPENAI_API_KEY` ile güncel doğrudan OpenAI Platform API erişimi istediğinizde. |
| `openai-codex/gpt-5.5`                       | OpenClaw/PI üzerinden OpenAI Codex OAuth  | Varsayılan PI çalıştırıcısıyla ChatGPT/Codex abonelik auth istediğinizde. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex uygulama sunucusu çalıştırıcısı     | Gömülü ajan turu için yerel Codex uygulama sunucusu yürütmesi istediğinizde. |

GPT-5.5 şu anda OpenClaw'da yalnızca abonelik/OAuth ile kullanılabilir. PI OAuth için `openai-codex/gpt-5.5` kullanın veya Codex uygulama sunucusu çalıştırıcısıyla `openai/gpt-5.5` kullanın. `openai/gpt-5.5` için doğrudan API anahtarı erişimi, OpenAI GPT-5.5'i genel API'de etkinleştirdiğinde desteklenir.

Eski `codex/gpt-*` referansları uyumluluk diğer adları olarak kabul edilmeye devam eder. Doctor uyumluluk geçişi, eski birincil çalışma zamanı referanslarını kurallı model referanslarına yeniden yazar ve çalışma zamanı ilkesini ayrı kaydeder; yalnızca geri dönüşte kullanılan eski referanslar ise değişmeden bırakılır, çünkü çalışma zamanı tüm ajan kapsayıcısı için yapılandırılır. Yeni PI Codex OAuth yapılandırmaları `openai-codex/gpt-*` kullanmalıdır; yeni yerel uygulama sunucusu çalıştırıcısı yapılandırmaları `openai/gpt-*` ile birlikte `agentRuntime.id: "codex"` kullanmalıdır.

`agents.defaults.imageModel` aynı önek ayrımını izler. Görüntü anlama OpenAI Codex OAuth sağlayıcı yolu üzerinden çalışmalıysa `openai-codex/gpt-*` kullanın. Görüntü anlama sınırlı bir Codex uygulama sunucusu turu üzerinden çalışmalıysa `codex/gpt-*` kullanın. Codex uygulama sunucusu modeli görüntü girdi desteğini ilan etmelidir; yalnızca metin Codex modelleri medya turu başlamadan önce başarısız olur.

Geçerli oturum için etkili çalıştırıcıyı doğrulamak üzere `/status` kullanın. Seçim şaşırtıcıysa, `agents/harness` alt sistemi için hata ayıklama günlüklerini etkinleştirin ve Gateway'in yapılandırılmış `agent harness selected` kaydını inceleyin. Bu kayıt seçilen çalıştırıcı kimliğini, seçim nedenini, çalışma zamanı/geri dönüş ilkesini ve `auto` modunda her Plugin adayının destek sonucunu içerir.

### Doctor uyarıları ne anlama gelir

`openclaw doctor`, şu koşulların tümü doğru olduğunda uyarır:

- birlikte gelen `codex` Plugin'i etkin veya izinlidir
- bir ajanın birincil modeli `openai-codex/*` şeklindedir
- o ajanın etkili çalışma zamanı `codex` değildir

Bu uyarı, kullanıcıların sık sık "Codex Plugin etkin" ifadesinin "yerel Codex uygulama sunucusu çalışma zamanı" anlamına gelmesini beklemesi nedeniyle vardır. OpenClaw bu sıçramayı yapmaz. Uyarı şu anlama gelir:

- PI üzerinden ChatGPT/Codex OAuth amaçladıysanız **hiçbir değişiklik gerekmez**.
- Yerel uygulama sunucusu yürütmesi amaçladıysanız modeli `openai/<model>` olarak değiştirin ve
  `agentRuntime.id: "codex"` ayarlayın.
- Çalışma zamanı değişikliğinden sonra mevcut oturumlar hâlâ `/new` veya `/reset` gerektirir,
  çünkü oturum çalışma zamanı sabitlemeleri yapışkandır.

Çalıştırıcı seçimi canlı oturum denetimi değildir. Gömülü bir tur çalıştığında OpenClaw seçilen çalıştırıcı kimliğini o oturuma kaydeder ve aynı oturum kimliğindeki sonraki turlarda kullanmaya devam eder. Gelecekteki oturumların başka bir çalıştırıcı kullanmasını istediğinizde `agentRuntime` yapılandırmasını veya `OPENCLAW_AGENT_RUNTIME` değerini değiştirin; mevcut bir konuşmayı PI ile Codex arasında geçirmeden önce yeni bir oturum başlatmak için `/new` veya `/reset` kullanın. Bu, bir dökümün iki uyumsuz yerel oturum sistemi üzerinden yeniden oynatılmasını önler.

Çalıştırıcı sabitlemelerinden önce oluşturulan eski oturumlar, döküm geçmişleri olduğunda PI'ye sabitlenmiş olarak ele alınır. Yapılandırmayı değiştirdikten sonra bu konuşmayı Codex'e geçirmek için `/new` veya `/reset` kullanın.

`/status` etkili model çalışma zamanını gösterir. Varsayılan PI çalıştırıcısı `Runtime: OpenClaw Pi Default` olarak, Codex uygulama sunucusu çalıştırıcısı ise `Runtime: OpenAI Codex` olarak görünür.

## Gereksinimler

- Birlikte gelen `codex` Plugin'i kullanılabilir olan OpenClaw.
- Codex uygulama sunucusu `0.125.0` veya daha yenisi. Birlikte gelen Plugin varsayılan olarak uyumlu bir Codex uygulama sunucusu ikilisini yönetir; bu nedenle `PATH` üzerindeki yerel `codex` komutları normal çalıştırıcı başlangıcını etkilemez.
- Uygulama sunucusu süreci veya OpenClaw'ın Codex auth köprüsü için Codex auth kullanılabilir olmalıdır. Yerel stdio uygulama sunucusu başlatmaları her ajan için OpenClaw tarafından yönetilen bir Codex home ve yalıtılmış bir alt `HOME` kullanır; bu nedenle varsayılan olarak kişisel `~/.codex` hesabınızı, skills, plugin'leri, yapılandırmayı, iş parçacığı durumunu veya yerel `$HOME/.agents/skills` öğelerini okumazlar.

Plugin, daha eski veya sürümsüz uygulama sunucusu el sıkışmalarını engeller. Bu, OpenClaw'ı test edildiği protokol yüzeyinde tutar.

Canlı ve Docker duman testleri için auth genellikle Codex CLI hesabından veya bir OpenClaw `openai-codex` auth profilinden gelir. Yerel stdio uygulama sunucusu başlatmaları, hesap yoksa `CODEX_API_KEY` / `OPENAI_API_KEY` değerlerine de geri dönebilir.

## En küçük yapılandırma

`openai/gpt-5.5` kullanın, birlikte gelen Plugin'i etkinleştirin ve `codex` çalıştırıcısını zorlayın:

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

Aynı aracı Codex ve Codex olmayan sağlayıcı modelleri arasında serbestçe geçiş
yapacaksa `agentRuntime.id: "codex"` değerini küresel olarak ayarlamayın. Zorunlu bir çalışma zamanı,
o aracı veya oturumu için her gömülü dönüşe uygulanır. Bu çalışma zamanı zorunluyken
bir Anthropic modeli seçerseniz OpenClaw yine Codex harness'ını dener ve bu dönüşü
sessizce PI üzerinden yönlendirmek yerine kapalı şekilde başarısız olur.

Bunun yerine şu biçimlerden birini kullanın:

- Codex'i `agentRuntime.id: "codex"` ile ayrılmış bir araca koyun.
- Varsayılan aracı normal karma sağlayıcı kullanımı için `agentRuntime.id: "auto"` ve PI fallback ile tutun.
- Eski `codex/*` başvurularını yalnızca uyumluluk için kullanın. Yeni yapılandırmalar
  `openai/*` ile birlikte açık bir Codex çalışma zamanı politikasını tercih etmelidir.

Örneğin bu, varsayılan aracı normal otomatik seçimde tutar ve
ayrı bir Codex aracı ekler:

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

Bu biçimle:

- Varsayılan `main` aracı normal sağlayıcı yolunu ve PI uyumluluk fallback'ini kullanır.
- `codex` aracı Codex uygulama sunucusu harness'ını kullanır.
- Codex `codex` aracı için eksik veya desteklenmiyorsa dönüş, sessizce PI kullanmak
  yerine başarısız olur.

## Araç komutu yönlendirme

Araçlar kullanıcı isteklerini yalnızca "Codex" sözcüğüne göre değil, amaca göre yönlendirmelidir:

| Kullanıcı şunu ister...                                  | Araç şunu kullanmalıdır...                       |
| -------------------------------------------------------- | ------------------------------------------------ |
| "Bu sohbeti Codex'e bağla"                               | `/codex bind`                                    |
| "Codex iş parçacığı `<id>` burada sürdürülsün"           | `/codex resume <id>`                             |
| "Codex iş parçacıklarını göster"                         | `/codex threads`                                 |
| "Kötü bir Codex çalışması için destek raporu oluştur"    | `/diagnostics [note]`                            |
| "Yalnızca bu ekli iş parçacığı için Codex geri bildirimi gönder" | `/codex diagnostics [note]`                      |
| "Bu araç için çalışma zamanı olarak Codex kullan"        | `agentRuntime.id` için yapılandırma değişikliği  |
| "Normal OpenClaw ile ChatGPT/Codex aboneliğimi kullan"   | `openai-codex/*` model başvuruları              |
| "Codex'i ACP/acpx üzerinden çalıştır"                    | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Claude Code/Gemini/OpenCode/Cursor'ı bir iş parçacığında başlat" | ACP/acpx, `/codex` değil ve yerel alt araçlar değil |

OpenClaw, ACP spawn kılavuzunu araçlara yalnızca ACP etkin,
gönderilebilir ve yüklü bir çalışma zamanı arka ucu tarafından destekleniyorsa duyurur.
ACP kullanılabilir değilse, sistem prompt'u ve Plugin Skills araca ACP
yönlendirmesini öğretmemelidir.

## Yalnızca Codex dağıtımları

Her gömülü araç dönüşünün Codex kullandığını kanıtlamanız gerektiğinde Codex harness'ını
zorunlu kılın. Açık Plugin çalışma zamanları varsayılan olarak PI fallback olmadan gelir, bu yüzden
`fallback: "none"` isteğe bağlıdır ancak çoğu zaman belgelendirme açısından yararlıdır:

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

Codex zorunlu kılındığında, Codex Plugin devre dışıysa, uygulama sunucusu
çok eskiyse veya uygulama sunucusu başlatılamıyorsa OpenClaw erken başarısız olur.
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` değerini yalnızca eksik harness seçimini
bilerek PI'ın işlemesini istiyorsanız ayarlayın.

## Araç bazında Codex

Varsayılan araç normal otomatik seçimi korurken bir aracı yalnızca Codex yapabilirsiniz:

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

Araçlar ve modeller arasında geçiş yapmak için normal oturum komutlarını kullanın.
`/new` yeni bir OpenClaw oturumu oluşturur ve Codex harness'ı gerektiğinde kendi
sidecar uygulama sunucusu iş parçacığını oluşturur veya sürdürür. `/reset`, o iş parçacığı için
OpenClaw oturum bağlamasını temizler ve bir sonraki dönüşün harness'ı geçerli
yapılandırmadan yeniden çözmesine izin verir.

## Model keşfi

Varsayılan olarak Codex Plugin, mevcut modelleri uygulama sunucusundan ister. Keşif
başarısız olur veya zaman aşımına uğrarsa şu modeller için paketlenmiş fallback kataloğunu kullanır:

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

Başlangıcın Codex'i yoklamasını önlemek ve fallback kataloğuna bağlı kalmak
istediğinizde keşfi devre dışı bırakın:

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

Varsayılan olarak Plugin, OpenClaw'ın yönetilen Codex ikilisini yerel olarak şununla başlatır:

```bash
codex app-server --listen stdio://
```

Yönetilen ikili, paketlenmiş bir Plugin çalışma zamanı bağımlılığı olarak bildirilir ve
diğer `codex` Plugin bağımlılıklarıyla birlikte hazırlanır. Bu, uygulama sunucusu
sürümünü yerel olarak kurulu olabilecek ayrı Codex CLI yerine paketlenmiş Plugin'e
bağlı tutar. `appServer.command` değerini yalnızca bilerek farklı bir çalıştırılabilir
dosya çalıştırmak istediğinizde ayarlayın.

Varsayılan olarak OpenClaw, yerel Codex harness oturumlarını YOLO modunda başlatır:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Bu, otonom Heartbeat'ler için kullanılan güvenilir
yerel operatör duruşudur: Codex, yanıtlayacak kimse yokken yerel onay prompt'larında
durmadan shell ve ağ araçlarını kullanabilir.

Codex guardian tarafından incelenen onaylara katılmak için `appServer.mode:
"guardian"` değerini ayarlayın:

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

Guardian modu, Codex'in yerel otomatik inceleme onay yolunu kullanır. Codex
sandbox dışına çıkmayı, çalışma alanı dışına yazmayı veya ağ erişimi gibi izinler
eklemeyi istediğinde, Codex bu onay isteğini insan prompt'u yerine yerel inceleyiciye
yönlendirir. İnceleyici Codex'in risk çerçevesini uygular ve belirli isteği onaylar
veya reddeder. YOLO modundan daha fazla koruma istediğiniz ancak yine de gözetimsiz
araçların ilerlemesini sağlamak zorunda olduğunuzda Guardian kullanın.

`guardian` hazır ayarı `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` ve `sandbox: "workspace-write"` olarak genişler.
Tek tek politika alanları yine de `mode` değerini geçersiz kılar, böylece ileri düzey
dağıtımlar hazır ayarı açık seçimlerle karıştırabilir. Eski `guardian_subagent`
inceleyici değeri uyumluluk takma adı olarak hâlâ kabul edilir, ancak yeni yapılandırmalar
`auto_review` kullanmalıdır.

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

Stdio uygulama sunucusu başlatmaları varsayılan olarak OpenClaw'ın süreç ortamını devralır,
ancak OpenClaw Codex uygulama sunucusu hesap köprüsünü sahiplenir ve hem
`CODEX_HOME` hem de `HOME` değerlerini o aracın OpenClaw durumu altındaki araç bazlı
dizinlere ayarlar. Codex'in kendi Skills yükleyicisi `$CODEX_HOME/skills` ve
`$HOME/.agents/skills` dizinlerini okur, bu nedenle her iki değer de yerel uygulama sunucusu
başlatmaları için yalıtılır. Bu, Codex'e yerel Skills, Plugins, yapılandırma, hesaplar
ve iş parçacığı durumunun operatörün kişisel Codex CLI ana dizininden sızmak yerine
OpenClaw aracına kapsamlanmasını sağlar.

OpenClaw Plugins ve OpenClaw Skills anlık görüntüleri yine OpenClaw'ın kendi
Plugin kayıt defteri ve Skills yükleyicisi üzerinden akar. Kişisel Codex CLI varlıkları
akmaz. Bir OpenClaw aracının parçası olması gereken yararlı Codex CLI Skills veya
Plugins öğeleriniz varsa bunların envanterini açıkça çıkarın:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex geçiş sağlayıcısı Skills öğelerini geçerli OpenClaw aracı çalışma alanına
kopyalar. Codex yerel Plugins, hook'lar ve yapılandırma dosyaları otomatik olarak
etkinleştirilmek yerine manuel inceleme için raporlanır veya arşivlenir, çünkü bunlar
komut çalıştırabilir, MCP sunucuları açığa çıkarabilir veya kimlik bilgileri taşıyabilir.

Kimlik doğrulama şu sırayla seçilir:

1. Araç için açık bir OpenClaw Codex kimlik doğrulama profili.
2. Uygulama sunucusunun o aracın Codex ana dizinindeki mevcut hesabı.
3. Yalnızca yerel stdio uygulama sunucusu başlatmaları için, uygulama sunucusu hesabı
   yoksa ve OpenAI kimlik doğrulaması hâlâ gerekiyorsa `CODEX_API_KEY`, ardından
   `OPENAI_API_KEY`.

OpenClaw, ChatGPT aboneliği tarzı bir Codex kimlik doğrulama profili gördüğünde
oluşturulan Codex alt sürecinden `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini kaldırır.
Bu, Gateway düzeyindeki API anahtarlarını embeddings veya doğrudan OpenAI modelleri için
kullanılabilir tutarken yerel Codex uygulama sunucusu dönüşlerinin yanlışlıkla API üzerinden
faturalandırılmasını engeller. Açık Codex API anahtarı profilleri ve yerel stdio ortam anahtarı
fallback'i, devralınmış alt süreç ortamı yerine uygulama sunucusu oturum açmasını kullanır.
WebSocket uygulama sunucusu bağlantıları Gateway ortam API anahtarı fallback'i almaz;
açık bir kimlik doğrulama profili veya uzak uygulama sunucusunun kendi hesabını kullanın.

Bir dağıtım ek ortam yalıtımına ihtiyaç duyuyorsa bu değişkenleri
`appServer.clearEnv` değerine ekleyin:

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

| Alan                | Varsayılan                              | Anlam                                                                                                                                                                                                                               |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` Codex'i başlatır; `"websocket"` `url`'ye bağlanır.                                                                                                                                                                        |
| `command`           | yönetilen Codex ikilisi                  | stdio taşıması için yürütülebilir dosya. Yönetilen ikiliyi kullanmak için ayarlanmamış bırakın; yalnızca açık bir geçersiz kılma için ayarlayın.                                                                                    |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio taşıması için bağımsız değişkenler.                                                                                                                                                                                           |
| `url`               | ayarlanmamış                             | WebSocket app-server URL'si.                                                                                                                                                                                                        |
| `authToken`         | ayarlanmamış                             | WebSocket taşıması için Bearer token.                                                                                                                                                                                               |
| `headers`           | `{}`                                     | Ek WebSocket üstbilgileri.                                                                                                                                                                                                          |
| `clearEnv`          | `[]`                                     | OpenClaw devralınan ortamını oluşturduktan sonra başlatılan stdio app-server sürecinden kaldırılan ek ortam değişkeni adları. `CODEX_HOME` ve `HOME`, yerel başlatmalarda OpenClaw'ın aracı başına Codex yalıtımı için ayrılmıştır. |
| `requestTimeoutMs`  | `60000`                                  | app-server denetim düzlemi çağrıları için zaman aşımı.                                                                                                                                                                              |
| `mode`              | `"yolo"`                                 | YOLO veya guardian incelemeli yürütme için ön ayar.                                                                                                                                                                                 |
| `approvalPolicy`    | `"never"`                                | İş parçacığı başlatma/sürdürme/turn işlemine gönderilen yerel Codex onay politikası.                                                                                                                                                |
| `sandbox`           | `"danger-full-access"`                   | İş parçacığı başlatma/sürdürme işlemine gönderilen yerel Codex sandbox modu.                                                                                                                                                        |
| `approvalsReviewer` | `"user"`                                 | Codex'in yerel onay istemlerini incelemesine izin vermek için `"auto_review"` kullanın. `guardian_subagent` eski bir takma ad olarak kalır.                                                                                         |
| `serviceTier`       | ayarlanmamış                             | İsteğe bağlı Codex app-server hizmet katmanı: `"fast"`, `"flex"` veya `null`. Geçersiz eski değerler yok sayılır.                                                                                                                   |

OpenClaw'a ait dinamik araç çağrıları `appServer.requestTimeoutMs` değerinden
bağımsız olarak sınırlandırılır: her Codex `item/tool/call` isteği 30 saniye
içinde bir OpenClaw yanıtı almalıdır. Zaman aşımında OpenClaw, desteklendiği
yerlerde araç sinyalini iptal eder ve Codex'e başarısız bir dinamik araç yanıtı
döndürür; böylece oturumu `processing` durumunda bırakmak yerine turn devam
edebilir.

OpenClaw, Codex turn kapsamlı bir app-server isteğine yanıt verdikten sonra,
harness ayrıca Codex'in yerel turn işlemini `turn/completed` ile bitirmesini
bekler. app-server bu yanıttan sonra 60 saniye sessiz kalırsa, OpenClaw en iyi
çabayla Codex turn işlemini keser, tanısal bir zaman aşımı kaydeder ve OpenClaw
oturum şeridini serbest bırakır; böylece takip sohbet mesajları bayat bir yerel
turn arkasında kuyruğa alınmaz.

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
Tekrarlanabilir dağıtımlar için yapılandırma tercih edilir; çünkü Plugin
davranışını Codex harness kurulumunun geri kalanıyla aynı incelenmiş dosyada
tutar.

## Bilgisayar kullanımı

Computer Use kendi kurulum kılavuzunda ele alınır:
[Codex Computer Use](/tr/plugins/codex-computer-use).

Kısa sürüm: OpenClaw masaüstü denetim uygulamasını vendor olarak içermez veya
masaüstü eylemlerini kendisi yürütmez. Codex app-server'ı hazırlar,
`computer-use` MCP sunucusunun kullanılabilir olduğunu doğrular ve ardından
Codex modu turn işlemleri sırasında yerel MCP araç çağrılarını Codex'in
yönetmesine izin verir.

Codex marketplace akışı dışında doğrudan TryCua sürücü erişimi için
`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` ile
`cua-driver mcp` kaydedin. Codex'e ait Computer Use ile doğrudan MCP kaydı
arasındaki ayrım için [Codex Computer Use](/tr/plugins/codex-computer-use)
sayfasına bakın.

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

Computer Use macOS'a özeldir ve Codex MCP sunucusu uygulamaları denetleyebilmeden
önce yerel işletim sistemi izinleri gerektirebilir. `computerUse.enabled` true
ise ve MCP sunucusu kullanılamıyorsa, Codex modu turn işlemleri yerel Computer
Use araçları olmadan sessizce çalışmak yerine iş parçacığı başlamadan önce
başarısız olur. Marketplace seçenekleri, uzak katalog sınırları, durum
nedenleri ve sorun giderme için
[Codex Computer Use](/tr/plugins/codex-computer-use) sayfasına bakın.

`computerUse.autoInstall` true olduğunda, Codex henüz yerel bir marketplace
keşfetmediyse OpenClaw standart paketli Codex Desktop marketplace'ini
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` konumundan
kaydedebilir. Mevcut oturumların eski bir PI veya Codex iş parçacığı bağını
korumaması için runtime veya Computer Use yapılandırmasını değiştirdikten sonra
`/new` veya `/reset` kullanın.

## Yaygın tarifler

Varsayılan stdio taşımasıyla yerel Codex:

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
Codex iş parçacığına bağlı olduğunda, sonraki turn seçili OpenAI modelini,
sağlayıcıyı, onay politikasını, sandbox'ı ve hizmet katmanını app-server'a
yeniden gönderir. `openai/gpt-5.5` modelinden `openai/gpt-5.2` modeline geçmek
iş parçacığı bağını korur ancak Codex'ten yeni seçilen modelle devam etmesini
ister.

## Codex komutu

Paketli Plugin, `/codex` komutunu yetkili bir slash komutu olarak kaydeder.
Geneldir ve OpenClaw metin komutlarını destekleyen herhangi bir kanalda çalışır.

Yaygın biçimler:

- `/codex status` canlı app-server bağlantısını, modelleri, hesabı, hız sınırlarını, MCP sunucularını ve skills öğelerini gösterir.
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
- `/codex skills` Codex app-server skills öğelerini listeler.

### Yaygın hata ayıklama iş akışı

Codex destekli bir aracı Telegram, Discord, Slack veya başka bir kanalda
şaşırtıcı bir şey yaptığında, sorunun yaşandığı konuşmayla başlayın:

1. Gördüğünüzü açıklayan `/diagnostics bad tool choice after image upload` veya
   başka bir kısa not çalıştırın.
2. Tanılama isteğini bir kez onaylayın. Onay, yerel Gateway tanılama zip
   dosyasını oluşturur ve oturum Codex harness kullandığı için ilgili Codex geri
   bildirim paketini de OpenAI sunucularına gönderir.
3. Tamamlanan tanılama yanıtını hata raporuna veya destek iş parçacığına
   kopyalayın. Yerel paket yolunu, gizlilik özetini, OpenClaw oturum
   kimliklerini, Codex iş parçacığı kimliklerini ve her Codex iş parçacığı için
   bir `Inspect locally` satırını içerir.
4. Çalıştırmayı kendiniz hata ayıklamak istiyorsanız, yazdırılan
   `Inspect locally` komutunu bir terminalde çalıştırın. `codex resume <thread-id>`
   gibi görünür ve konuşmayı inceleyebilmeniz, yerel olarak sürdürebilmeniz veya
   Codex'e belirli bir aracı ya da planı neden seçtiğini sorabilmeniz için yerel
   Codex iş parçacığını açar.

`/codex diagnostics [note]` komutunu yalnızca tam OpenClaw Gateway tanılama paketi olmadan, o anda bağlı iş parçacığı için özel olarak Codex geri bildirim yüklemesini istediğinizde kullanın. Çoğu destek raporu için `/diagnostics [note]` daha iyi bir başlangıç noktasıdır çünkü yerel Gateway durumunu ve Codex iş parçacığı kimliklerini tek yanıtta bir araya getirir. Tam gizlilik modeli ve grup sohbeti davranışı için [Tanılama dışa aktarımı](/tr/gateway/diagnostics) bölümüne bakın.

Çekirdek OpenClaw ayrıca genel Gateway tanılama komutu olarak yalnızca sahiplerin kullanabildiği `/diagnostics [note]` komutunu sunar. Onay istemi hassas veri önsözünü gösterir, [Tanılama Dışa Aktarımı](/tr/gateway/diagnostics) bağlantısını verir ve her seferinde açık exec onayı yoluyla `openclaw gateway diagnostics export --json` ister. Tanılamaları tümüne izin veren bir kuralla onaylamayın. Onaydan sonra OpenClaw, yerel paket yolu ve manifest özetiyle birlikte yapıştırılabilir bir rapor gönderir. Etkin OpenClaw oturumu Codex harness'ını kullanıyorsa, aynı onay ilgili Codex geri bildirim paketlerinin OpenAI sunucularına gönderilmesine de izin verir. Onay istemi Codex geri bildiriminin gönderileceğini söyler, ancak onaydan önce Codex oturumu veya iş parçacığı kimliklerini listelemez.

`/diagnostics` bir grup sohbetinde bir sahip tarafından çağrılırsa, OpenClaw paylaşılan kanalı temiz tutar: grup yalnızca kısa bir bildirim alırken tanılama önsözü, onay istemleri ve Codex oturum/iş parçacığı kimlikleri özel onay rotası üzerinden sahibe gönderilir. Özel sahip rotası yoksa OpenClaw grup isteğini reddeder ve sahibin bunu bir DM'den çalıştırmasını ister.

Onaylanan Codex yüklemesi Codex app-server `feedback/upload` çağrısı yapar ve app-server'dan, mümkün olduğunda listelenen her iş parçacığı ve oluşturulmuş Codex alt iş parçacıkları için günlükleri dahil etmesini ister. Yükleme, Codex'in normal geri bildirim yolu üzerinden OpenAI sunucularına gider; bu app-server'da Codex geri bildirimi devre dışıysa komut app-server hatasını döndürür. Tamamlanan tanılama yanıtı, gönderilen iş parçacıkları için kanalları, OpenClaw oturum kimliklerini, Codex iş parçacığı kimliklerini ve yerel `codex resume <thread-id>` komutlarını listeler. Onayı reddeder veya yok sayarsanız OpenClaw bu Codex kimliklerini yazdırmaz. Bu yükleme yerel Gateway tanılama dışa aktarımının yerini almaz.

`/codex resume`, harness'ın normal turlarda kullandığı aynı yan dosya bağlama dosyasını yazar. Bir sonraki mesajda OpenClaw bu Codex iş parçacığını sürdürür, o anda seçili OpenClaw modelini app-server'a geçirir ve genişletilmiş geçmişi etkin tutar.

### CLI'dan bir Codex iş parçacığını inceleme

Kötü bir Codex çalıştırmasını anlamanın en hızlı yolu çoğu zaman yerel Codex iş parçacığını doğrudan açmaktır:

```sh
codex resume <thread-id>
```

Bunu bir kanal konuşmasında hata fark ettiğinizde ve sorunlu Codex oturumunu incelemek, yerelde devam ettirmek veya Codex'e neden belirli bir araç ya da akıl yürütme seçimi yaptığını sormak istediğinizde kullanın. En kolay yol genellikle önce `/diagnostics [note]` çalıştırmaktır: onayladıktan sonra tamamlanan rapor her Codex iş parçacığını listeler ve örneğin `codex resume <thread-id>` gibi bir `Yerelde incele` komutu yazdırır. Bu komutu doğrudan bir terminale kopyalayabilirsiniz.

Geçerli sohbet için `/codex binding` komutundan veya son Codex app-server iş parçacıkları için `/codex threads [filter]` komutundan da bir iş parçacığı kimliği alabilir, ardından kabuğunuzda aynı `codex resume` komutunu çalıştırabilirsiniz.

Komut yüzeyi Codex app-server `0.125.0` veya daha yenisini gerektirir. Gelecekteki ya da özel bir app-server ilgili JSON-RPC yöntemini sunmuyorsa, tekil kontrol yöntemleri `unsupported by this Codex app-server` olarak bildirilir.

## Hook sınırları

Codex harness'ında üç hook katmanı vardır:

| Katman                                | Sahip                    | Amaç                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin hook'ları             | OpenClaw                 | PI ve Codex harness'ları genelinde ürün/Plugin uyumluluğu.          |
| Codex app-server uzantı middleware'i  | OpenClaw paketli Plugin'ler | OpenClaw dinamik araçları çevresinde tur başına adaptör davranışı. |
| Codex yerel hook'ları                 | Codex                    | Codex yapılandırmasından düşük seviyeli Codex yaşam döngüsü ve yerel araç ilkesi. |

OpenClaw, OpenClaw Plugin davranışını yönlendirmek için proje veya global Codex `hooks.json` dosyalarını kullanmaz. Desteklenen yerel araç ve izin köprüsü için OpenClaw, `PreToolUse`, `PostToolUse`, `PermissionRequest` ve `Stop` için iş parçacığı başına Codex yapılandırması enjekte eder. `SessionStart` ve `UserPromptSubmit` gibi diğer Codex hook'ları Codex düzeyi kontroller olarak kalır; v1 sözleşmesinde OpenClaw Plugin hook'ları olarak sunulmazlar.

OpenClaw dinamik araçları için OpenClaw, Codex çağrıyı istedikten sonra aracı çalıştırır; bu nedenle OpenClaw, harness adaptöründe kendisine ait Plugin ve middleware davranışını tetikler. Codex'e yerel araçlar için kanonik araç kaydının sahibi Codex'tir. OpenClaw seçili olayları yansıtabilir, ancak Codex bu işlemi app-server veya yerel hook geri çağrıları üzerinden sunmadıkça yerel Codex iş parçacığını yeniden yazamaz.

Compaction ve LLM yaşam döngüsü projeksiyonları yerel Codex hook komutlarından değil, Codex app-server bildirimlerinden ve OpenClaw adaptör durumundan gelir. OpenClaw'ın `before_compaction`, `after_compaction`, `llm_input` ve `llm_output` olayları adaptör düzeyi gözlemlerdir; Codex'in dahili istek veya compaction yüklerinin bayt bayt yakalanmış halleri değildir.

Codex yerel `hook/started` ve `hook/completed` app-server bildirimleri, izlek ve hata ayıklama için `codex_app_server.hook` ajan olayları olarak projekte edilir. Bunlar OpenClaw Plugin hook'larını çağırmaz.

## V1 destek sözleşmesi

Codex modu, altında farklı bir model çağrısı olan PI değildir. Codex yerel model döngüsünün daha büyük kısmına sahiptir ve OpenClaw Plugin ile oturum yüzeylerini bu sınır çevresinde uyarlar.

Codex runtime v1'de desteklenenler:

| Yüzey                                        | Destek                                  | Neden                                                                                                                                                                                                 |
| -------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex üzerinden OpenAI model döngüsü         | Desteklenir                             | Codex app-server OpenAI turuna, yerel iş parçacığı sürdürmeye ve yerel araç devamına sahiptir.                                                                                                         |
| OpenClaw kanal yönlendirme ve teslim         | Desteklenir                             | Telegram, Discord, Slack, WhatsApp, iMessage ve diğer kanallar model runtime'ının dışında kalır.                                                                                                      |
| OpenClaw dinamik araçları                    | Desteklenir                             | Codex, OpenClaw'dan bu araçları çalıştırmasını ister; bu nedenle OpenClaw yürütme yolunda kalır.                                                                                                      |
| İstem ve bağlam Plugin'leri                  | Desteklenir                             | OpenClaw, iş parçacığını başlatmadan veya sürdürmeden önce istem katmanları oluşturur ve bağlamı Codex turuna projekte eder.                                                                           |
| Bağlam motoru yaşam döngüsü                  | Desteklenir                             | Derleme, alma veya tur sonrası bakım ve bağlam motoru compaction koordinasyonu Codex turları için çalışır.                                                                                            |
| Dinamik araç hook'ları                       | Desteklenir                             | `before_tool_call`, `after_tool_call` ve araç sonucu middleware'i OpenClaw'a ait dinamik araçların çevresinde çalışır.                                                                                |
| Yaşam döngüsü hook'ları                      | Adaptör gözlemleri olarak desteklenir   | `llm_input`, `llm_output`, `agent_end`, `before_compaction` ve `after_compaction` dürüst Codex modu yükleriyle tetiklenir.                                                                            |
| Nihai yanıt revizyon kapısı                  | Yerel hook aktarımı üzerinden desteklenir | Codex `Stop`, `before_agent_finalize` olayına aktarılır; `revise`, sonlandırmadan önce Codex'ten bir model geçişi daha ister.                                                                        |
| Yerel shell, patch ve MCP engelleme veya gözlem | Yerel hook aktarımı üzerinden desteklenir | Codex `PreToolUse` ve `PostToolUse`, Codex app-server `0.125.0` veya daha yenisindeki MCP yükleri dahil olmak üzere taahhüt edilmiş yerel araç yüzeyleri için aktarılır. Engelleme desteklenir; argüman yeniden yazma desteklenmez. |
| Yerel izin ilkesi                            | Yerel hook aktarımı üzerinden desteklenir | Codex `PermissionRequest`, runtime'ın sunduğu yerlerde OpenClaw ilkesi üzerinden yönlendirilebilir. OpenClaw karar döndürmezse Codex normal guardian veya kullanıcı onayı yolundan devam eder.        |
| App-server izlek yakalama                    | Desteklenir                             | OpenClaw, app-server'a gönderdiği isteği ve aldığı app-server bildirimlerini kaydeder.                                                                                                                |

Codex runtime v1'de desteklenmeyenler:

| Yüzey                                             | V1 sınırı                                                                                                                                     | Gelecek yol                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Yerel araç bağımsız değişken mutasyonu                       | Codex yerel araç öncesi kancaları engelleyebilir, ancak OpenClaw Codex'e özgü yerel araç bağımsız değişkenlerini yeniden yazmaz.                                               | Değiştirilecek araç girdisi için Codex kanca/şema desteği gerektirir.                            |
| Düzenlenebilir Codex'e özgü yerel transkript geçmişi            | Kanonik yerel iş parçacığı geçmişinin sahibi Codex'tir. OpenClaw bir aynaya sahiptir ve gelecekteki bağlamı yansıtabilir, ancak desteklenmeyen iç yapıları değiştirmemelidir. | Yerel iş parçacığı cerrahisi gerekiyorsa açık Codex app-server API'leri ekleyin.                    |
| Codex'e özgü yerel araç kayıtları için `tool_result_persist` | Bu kanca, Codex'e özgü yerel araç kayıtlarını değil, OpenClaw'ın sahip olduğu transkript yazmalarını dönüştürür.                                                           | Dönüştürülmüş kayıtları aynalayabilir, ancak kanonik yeniden yazma Codex desteği gerektirir.              |
| Zengin yerel compaction meta verisi                     | OpenClaw compaction başlangıcını ve tamamlanmasını gözlemler, ancak kararlı bir tutuldu/çıkarıldı listesi, token farkı veya özet yükü almaz.            | Daha zengin Codex compaction olayları gerekir.                                                     |
| Compaction müdahalesi                             | Geçerli OpenClaw compaction kancaları Codex modunda bildirim düzeyindedir.                                                                         | Plugin'lerin yerel compaction'ı veto etmesi veya yeniden yazması gerekiyorsa Codex compaction öncesi/sonrası kancaları ekleyin. |
| Model API isteğinin bayt bayt yakalanması             | OpenClaw app-server isteklerini ve bildirimlerini yakalayabilir, ancak Codex çekirdeği nihai OpenAI API isteğini dahili olarak oluşturur.                      | Bir Codex model isteği izleme olayı veya hata ayıklama API'si gerekir.                                   |

## Araçlar, medya ve compaction

Codex harness yalnızca düşük düzeyli gömülü ajan yürütücüsünü değiştirir.

OpenClaw araç listesini oluşturmaya ve harness'tan dinamik araç sonuçları almaya
devam eder. Metin, görseller, video, müzik, TTS, onaylar ve mesajlaşma aracı çıktısı
normal OpenClaw teslimat yolu üzerinden devam eder.

Yerel kanca aktarıcısı kasıtlı olarak geneldir, ancak v1 destek sözleşmesi
OpenClaw'ın test ettiği Codex'e özgü yerel araç ve izin yollarıyla sınırlıdır. Codex
runtime'ında buna shell, patch ve MCP `PreToolUse`,
`PostToolUse` ve `PermissionRequest` yükleri dahildir. Runtime sözleşmesi adını
verene kadar gelecekteki her Codex kanca olayının bir OpenClaw Plugin yüzeyi
olduğunu varsaymayın.

`PermissionRequest` için OpenClaw yalnızca ilke karar verdiğinde açık izin verme
veya reddetme kararları döndürür. Kararsız sonuç izin verme değildir. Codex bunu
kanca kararı yok olarak ele alır ve kendi guardian veya kullanıcı onayı yoluna düşer.

Codex MCP araç onayı istemleri, Codex `_meta.codex_approval_kind` değerini
`"mcp_tool_call"` olarak işaretlediğinde OpenClaw'ın Plugin onay akışı üzerinden
yönlendirilir. Codex `request_user_input` istemleri kaynak sohbete geri gönderilir
ve sıradaki bir sonraki takip mesajı, ek bağlam olarak yönlendirilmek yerine bu
yerel sunucu isteğini yanıtlar. Diğer MCP istem istekleri yine kapalı başarısız olur.

Etkin çalışma kuyruğu yönlendirmesi Codex app-server `turn/steer` üzerine eşlenir.
Varsayılan `messages.queue.mode: "steer"` ile OpenClaw sıraya alınmış sohbet mesajlarını
yapılandırılmış sessizlik penceresi boyunca toplar ve bunları varış sırasıyla tek bir
`turn/steer` isteği olarak gönderir. Eski `queue` modu ayrı `turn/steer` istekleri
gönderir. Codex inceleme ve manuel compaction turları aynı tur yönlendirmesini reddedebilir;
bu durumda OpenClaw, seçili mod geri dönüşe izin verdiğinde takip kuyruğunu kullanır. Bkz.
[Yönlendirme kuyruğu](/tr/concepts/queue-steering).

Seçili model Codex harness kullandığında, yerel iş parçacığı compaction'ı
Codex app-server'a devredilir. OpenClaw kanal geçmişi, arama, `/new`, `/reset` ve
gelecekteki model veya harness değişimleri için bir transkript aynası tutar. Ayna,
app-server bunları yaydığında kullanıcı istemini, son asistan metnini ve hafif
Codex akıl yürütme veya plan kayıtlarını içerir. Bugün OpenClaw yalnızca yerel
compaction başlangıç ve tamamlanma sinyallerini kaydeder. Henüz insan tarafından
okunabilir bir compaction özeti veya Codex'in compaction sonrasında hangi girdileri
tuttuğuna dair denetlenebilir bir liste sunmaz.

Kanonik yerel iş parçacığının sahibi Codex olduğundan, `tool_result_persist` şu anda
Codex'e özgü yerel araç sonucu kayıtlarını yeniden yazmaz. Yalnızca OpenClaw,
OpenClaw'a ait bir oturum transkripti araç sonucu yazarken uygulanır.

Medya üretimi PI gerektirmez. Görsel, video, müzik, PDF, TTS ve medya anlama
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` ve
`messages.tts` gibi eşleşen sağlayıcı/model ayarlarını kullanmaya devam eder.

## Sorun giderme

**Codex normal bir `/model` sağlayıcısı olarak görünmüyor:** bu, yeni
yapılandırmalar için beklenen durumdur. `agentRuntime.id: "codex"` ile bir
`openai/gpt-*` modeli (veya eski bir `codex/*` başvurusu) seçin,
`plugins.entries.codex.enabled` değerini etkinleştirin ve `plugins.allow` değerinin
`codex` öğesini hariç tutup tutmadığını kontrol edin.

**OpenClaw Codex yerine PI kullanıyor:** `agentRuntime.id: "auto"`, çalışmayı hiçbir
Codex harness sahiplenmediğinde uyumluluk arka ucu olarak PI kullanmaya devam edebilir.
Test sırasında Codex seçimini zorlamak için `agentRuntime.id: "codex"` olarak ayarlayın.
Zorlanmış Codex runtime artık PI'ya geri dönmek yerine başarısız olur; bunu yalnızca
açıkça `agentRuntime.fallback: "pi"` ayarlarsanız yapar. Codex app-server seçildikten
sonra, hataları ek geri dönüş yapılandırması olmadan doğrudan yüzeye çıkar.

**app-server reddediliyor:** Codex'i yükseltin; app-server el sıkışması
`0.125.0` veya daha yeni sürümü bildirmelidir. Aynı sürümlü ön sürümler veya
`0.125.0-alpha.2` ya da `0.125.0+custom` gibi derleme sonekli sürümler reddedilir,
çünkü OpenClaw'ın test ettiği kararlı protokol tabanı `0.125.0` sürümüdür.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs` değerini
düşürün veya keşfi devre dışı bırakın.

**WebSocket aktarımı hemen başarısız oluyor:** `appServer.url`, `authToken` ve
uzak app-server'ın aynı Codex app-server protokol sürümünü konuştuğunu kontrol edin.

**Codex olmayan bir model PI kullanıyor:** bu, o ajan için
`agentRuntime.id: "codex"` değerini zorlamadıysanız veya eski bir `codex/*` başvurusu
seçmediyseniz beklenen durumdur. Düz `openai/gpt-*` ve diğer sağlayıcı başvuruları
`auto` modunda normal sağlayıcı yolunda kalır. `agentRuntime.id: "codex"` değerini
zorlarsanız, o ajan için her gömülü turun Codex destekli bir OpenAI modeli olması gerekir.

**Computer Use kurulu ancak araçlar çalışmıyor:** yeni bir oturumdan
`/codex computer-use status` komutunu kontrol edin. Bir araç
`Native hook relay unavailable` bildirirse `/new` veya `/reset` kullanın; devam ederse,
eski yerel kanca kayıtlarını temizlemek için gateway'i yeniden başlatın. `computer-use.list_apps`
zaman aşımına uğrarsa Codex Computer Use veya Codex Desktop'ı yeniden başlatıp tekrar deneyin.

## İlgili

- [Ajan harness Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Ajan runtime'ları](/tr/concepts/agent-runtimes)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [Durum](/tr/cli/status)
- [Plugin kancaları](/tr/plugins/hooks)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [Test etme](/tr/help/testing-live#live-codex-app-server-harness-smoke)
