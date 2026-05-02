---
read_when:
    - Birlikte gelen Codex app-server test düzeneğini kullanmak istiyorsunuz
    - Codex çalışma düzeneği yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex dağıtımlarının PI'ye geri dönmek yerine başarısız olmasını istiyorsunuz
summary: OpenClaw gömülü ajan turlarını, birlikte gelen Codex app-server koşumu üzerinden çalıştırın
title: Codex çalışma düzeneği
x-i18n:
    generated_at: "2026-05-02T09:00:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 107f9fc0a3e8ad6a4790fc9eb68276c81d299236f11293014d2ab9bf6e235133
    source_path: plugins/codex-harness.md
    workflow: 16
---

Birlikte gelen `codex` Plugin'i, OpenClaw'ın gömülü ajan turlarını yerleşik PI düzeneği yerine Codex uygulama sunucusu üzerinden çalıştırmasını sağlar.

Codex'in düşük seviyeli ajan oturumunun sahibi olmasını istediğinizde bunu kullanın: model keşfi, yerel iş parçacığı sürdürme, yerel sıkıştırma ve uygulama sunucusu yürütmesi. OpenClaw sohbet kanallarının, oturum dosyalarının, model seçiminin, araçların, onayların, medya tesliminin ve görünür transkript aynasının sahibi olmaya devam eder.

Bir kaynak sohbet turu Codex düzeneği üzerinden çalıştığında, dağıtım `messages.visibleReplies` değerini açıkça yapılandırmamışsa görünür yanıtlar varsayılan olarak OpenClaw `message` aracına gider. Ajan yine de Codex turunu özel olarak tamamlayabilir; yalnızca `message(action="send")` çağırdığında kanala gönderi yapar. Doğrudan sohbet final yanıtlarını eski otomatik teslim yolunda tutmak için `messages.visibleReplies: "automatic"` olarak ayarlayın.

Codex Heartbeat turları da varsayılan olarak `heartbeat_respond` aracını alır; böylece ajan, uyandırmanın sessiz kalması mı yoksa bildirim göndermesi mi gerektiğini, bu kontrol akışını final metnine kodlamadan kaydedebilir.

Kendinizi konumlandırmaya çalışıyorsanız, [Ajan çalışma zamanları](/tr/concepts/agent-runtimes) ile başlayın. Kısa sürüm şudur: `openai/gpt-5.5` model referansıdır, `codex` çalışma zamanıdır ve Telegram, Discord, Slack veya başka bir kanal iletişim yüzeyi olmaya devam eder.

## Hızlı yapılandırma

"OpenClaw içinde Codex" isteyen çoğu kullanıcı şu yolu ister: bir ChatGPT/Codex aboneliğiyle oturum açın, ardından gömülü ajan turlarını yerel Codex uygulama sunucusu çalışma zamanı üzerinden çalıştırın. Model referansı yine kanonik olarak `openai/gpt-*` kalır; abonelik kimlik doğrulaması bir `openai-codex/*` model önekinden değil, Codex hesabından/profilinden gelir.

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
        fallback: "none",
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

Yerel Codex çalışma zamanını kastettiğinizde `openai-codex/gpt-*` kullanmayın. Bu önek, açık "PI üzerinden Codex OAuth" yoludur. Yapılandırma değişiklikleri yeni veya sıfırlanmış oturumlara uygulanır; mevcut oturumlar kaydedilmiş çalışma zamanlarını korur.

## Bu Plugin neyi değiştirir

Birlikte gelen `codex` Plugin'i birkaç ayrı yetenek sağlar:

| Yetenek                           | Nasıl kullanırsınız                                  | Ne yapar                                                                       |
| --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Yerel gömülü çalışma zamanı       | `agentRuntime.id: "codex"`                          | OpenClaw gömülü ajan turlarını Codex uygulama sunucusu üzerinden çalıştırır.   |
| Yerel sohbet denetim komutları    | `/codex bind`, `/codex resume`, `/codex steer`, ... | Codex uygulama sunucusu iş parçacıklarını bir mesajlaşma konuşmasından bağlar ve denetler. |
| Codex uygulama sunucusu sağlayıcısı/kataloğu | `codex` iç bileşenleri, düzenek üzerinden sunulur | Çalışma zamanının uygulama sunucusu modellerini keşfetmesini ve doğrulamasını sağlar. |
| Codex medya anlama yolu           | `codex/*` görüntü modeli uyumluluk yolları          | Desteklenen görüntü anlama modelleri için sınırlı Codex uygulama sunucusu turları çalıştırır. |
| Yerel hook aktarması              | Codex'e özgü olayların etrafındaki Plugin hook'ları | OpenClaw'ın desteklenen Codex'e özgü araç/finalleştirme olaylarını gözlemlemesini/engellemesini sağlar. |

Plugin'i etkinleştirmek bu yetenekleri kullanılabilir hale getirir. Şunları **yapmaz**:

- her OpenAI modeli için Codex kullanmaya başlamak
- `openai-codex/*` model referanslarını yerel çalışma zamanına dönüştürmek
- ACP/acpx'i varsayılan Codex yolu yapmak
- halihazırda bir PI çalışma zamanı kaydetmiş mevcut oturumları anında değiştirmek
- OpenClaw kanal teslimini, oturum dosyalarını, kimlik doğrulama profili depolamasını veya
  ileti yönlendirmesini değiştirmek

Aynı Plugin, yerel `/codex` sohbet denetim komutu yüzeyinin de sahibidir. Plugin etkinse ve kullanıcı sohbetten Codex iş parçacıklarını bağlamayı, sürdürmeyi, yönlendirmeyi, durdurmayı veya incelemeyi isterse ajanlar ACP yerine `/codex ...` kullanmayı tercih etmelidir. ACP, kullanıcı ACP/acpx istediğinde veya ACP Codex bağdaştırıcısını test ettiğinde açık yedek yol olarak kalır.

Yerel Codex turları, OpenClaw Plugin hook'larını genel uyumluluk katmanı olarak korur. Bunlar süreç içi OpenClaw hook'larıdır, Codex `hooks.json` komut hook'ları değildir:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` aynalanmış transkript kayıtları için
- Codex `Stop` aktarması üzerinden `before_agent_finalize`
- `agent_end`

Plugin'ler, OpenClaw aracı yürüttükten sonra ve sonuç Codex'e döndürülmeden önce OpenClaw dinamik araç sonuçlarını yeniden yazmak için çalışma zamanı bağımsız araç sonucu ara katmanı da kaydedebilir. Bu, OpenClaw'a ait transkript araç sonucu yazımlarını dönüştüren herkese açık `tool_result_persist` Plugin kancasından ayrıdır.

Plugin kancası semantiklerinin kendisi için bkz. [Plugin kancaları](/tr/plugins/hooks) ve [Plugin koruma davranışı](/tr/tools/plugin).

Koşum varsayılan olarak kapalıdır. Yeni yapılandırmalar, OpenAI model referanslarını `openai/gpt-*` olarak standart tutmalı ve yerel uygulama sunucusu yürütmesi istediklerinde açıkça `agentRuntime.id: "codex"` ya da `OPENCLAW_AGENT_RUNTIME=codex` zorlamalıdır. Eski `codex/*` model referansları uyumluluk için koşumu hâlâ otomatik seçer, ancak çalışma zamanı destekli eski sağlayıcı önekleri normal model/sağlayıcı seçenekleri olarak gösterilmez.

`codex` Plugin etkinse ancak birincil model hâlâ `openai-codex/*` ise, `openclaw doctor` rotayı değiştirmek yerine uyarır. Bu kasıtlıdır: `openai-codex/*` PI Codex OAuth/abonelik yolu olarak kalır ve yerel uygulama sunucusu yürütmesi açık bir çalışma zamanı seçimi olarak kalır.

## Rota haritası

Yapılandırmayı değiştirmeden önce bu tabloyu kullanın:

| İstenen davranış                                    | Model ref                  | Çalışma zamanı yapılandırması          | Kimlik doğrulama/profil rotası | Beklenen durum etiketi         |
| --------------------------------------------------- | -------------------------- | -------------------------------------- | ------------------------------ | ------------------------------ |
| Yerel Codex çalışma zamanıyla ChatGPT/Codex aboneliği | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth veya Codex hesabı  | `Runtime: OpenAI Codex`        |
| Normal OpenClaw çalıştırıcısı üzerinden OpenAI API  | `openai/gpt-*`             | atlanmış veya `runtime: "pi"`          | OpenAI API anahtarı            | `Runtime: OpenClaw Pi Default` |
| PI üzerinden ChatGPT/Codex aboneliği                | `openai-codex/gpt-*`       | atlanmış veya `runtime: "pi"`          | OpenAI Codex OAuth sağlayıcısı | `Runtime: OpenClaw Pi Default` |
| Koruyucu otomatik modla karma sağlayıcılar          | sağlayıcıya özgü referanslar | `agentRuntime.id: "auto"`            | Seçilen sağlayıcı başına       | Seçilen çalışma zamanına bağlı |
| Açık Codex ACP bağdaştırıcı oturumu                 | ACP prompt/model dependent | `sessions_spawn` with `runtime: "acp"` | ACP arka uç kimlik doğrulaması | ACP görev/oturum durumu        |

Önemli ayrım sağlayıcı ile çalışma zamanı arasındadır:

- `openai-codex/*`, "PI hangi sağlayıcı/kimlik doğrulama rotasını kullanmalı?" sorusunu yanıtlar
- `agentRuntime.id: "codex"`, "bu gömülü turu hangi döngü yürütmeli?" sorusunu yanıtlar
- `/codex ...`, "bu sohbet hangi yerel Codex konuşmasına bağlanmalı veya hangisini denetlemeli?" sorusunu yanıtlar
- ACP, "acpx hangi harici koşum sürecini başlatmalı?" sorusunu yanıtlar

## Doğru model önekini seçin

OpenAI ailesi rotalar öneke özgüdür. Yaygın abonelik artı yerel Codex çalışma zamanı kurulumu için `agentRuntime.id: "codex"` ile `openai/*` kullanın. `openai-codex/*` yalnızca PI üzerinden Codex OAuth'u özellikle istediğinizde kullanın:

| Model ref                                     | Çalışma zamanı yolu                       | Ne zaman kullanılmalı                                                     |
| --------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenClaw/PI tesisatı üzerinden OpenAI sağlayıcısı | `OPENAI_API_KEY` ile güncel doğrudan OpenAI Platform API erişimi istiyorsunuz. |
| `openai-codex/gpt-5.5`                        | OpenClaw/PI üzerinden OpenAI Codex OAuth  | Varsayılan PI çalıştırıcısıyla ChatGPT/Codex abonelik kimlik doğrulaması istiyorsunuz. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex uygulama sunucusu koşumu            | Yerel Codex yürütmesiyle ChatGPT/Codex abonelik kimlik doğrulaması istiyorsunuz. |

GPT-5.5, hesabınız bunları sunduğunda hem doğrudan OpenAI API anahtarı hem de Codex abonelik rotalarında görünebilir. Yerel Codex çalışma zamanı için Codex uygulama sunucusu koşumuyla `openai/gpt-5.5`, PI OAuth için `openai-codex/gpt-5.5` veya doğrudan API anahtarı trafiği için Codex çalışma zamanı geçersiz kılması olmadan `openai/gpt-5.5` kullanın.

Eski `codex/gpt-*` referansları uyumluluk takma adları olarak kabul edilmeye devam eder. Doctor uyumluluk geçişi, eski birincil çalışma zamanı referanslarını standart model referanslarına yeniden yazar ve çalışma zamanı ilkesini ayrı kaydeder; yalnızca geri dönüş amaçlı eski referanslar ise değiştirilmeden bırakılır çünkü çalışma zamanı tüm ajan kapsayıcısı için yapılandırılır. Yeni PI Codex OAuth yapılandırmaları `openai-codex/gpt-*` kullanmalıdır; yeni yerel uygulama sunucusu koşumu yapılandırmaları `agentRuntime.id: "codex"` ile birlikte `openai/gpt-*` kullanmalıdır.

`agents.defaults.imageModel` aynı önek ayrımını izler. Görüntü anlama OpenAI Codex OAuth sağlayıcı yolu üzerinden çalışmalıysa `openai-codex/gpt-*` kullanın. Görüntü anlama sınırlı bir Codex uygulama sunucusu turu üzerinden çalışmalıysa `codex/gpt-*` kullanın. Codex uygulama sunucusu modeli görüntü girdisi desteğini duyurmalıdır; yalnızca metin destekleyen Codex modelleri medya turu başlamadan önce başarısız olur.

Geçerli oturum için etkin koşumu doğrulamak üzere `/status` kullanın. Seçim şaşırtıcıysa, `agents/harness` alt sistemi için hata ayıklama günlüklemesini etkinleştirin ve gateway'in yapılandırılmış `agent harness selected` kaydını inceleyin. Bu kayıt seçilen koşum kimliğini, seçim nedenini, çalışma zamanı/geri dönüş ilkesini ve `auto` modunda her Plugin adayının destek sonucunu içerir.

### Doctor uyarıları ne anlama gelir?

`openclaw doctor`, aşağıdakilerin tümü doğru olduğunda uyarır:

- paketlenen `codex` Plugin etkinleştirilmiş veya izin verilmiştir
- bir ajanın birincil modeli `openai-codex/*` şeklindedir
- o ajanın etkin çalışma zamanı `codex` değildir

Bu uyarı vardır çünkü kullanıcılar sıklıkla "Codex Plugin etkin" ifadesinin "yerel Codex uygulama sunucusu çalışma zamanı" anlamına gelmesini bekler. OpenClaw bu sıçramayı yapmaz. Uyarının anlamı şudur:

- PI üzerinden ChatGPT/Codex OAuth'u amaçladıysanız **değişiklik gerekmez**.
- Yerel uygulama sunucusu yürütmesini amaçladıysanız modeli `openai/<model>` olarak değiştirin ve `agentRuntime.id: "codex"` ayarlayın.
- Mevcut oturumlar, çalışma zamanı değişikliğinden sonra yine de `/new` veya `/reset` gerektirir, çünkü oturum çalışma zamanı sabitlemeleri kalıcıdır.

Koşum seçimi canlı bir oturum denetimi değildir. Gömülü bir tur çalıştığında OpenClaw seçilen koşum kimliğini o oturuma kaydeder ve aynı oturum kimliğindeki sonraki turlarda onu kullanmaya devam eder. Gelecekteki oturumların başka bir koşum kullanmasını istediğinizde `agentRuntime` yapılandırmasını veya `OPENCLAW_AGENT_RUNTIME` değerini değiştirin; mevcut bir konuşmayı PI ile Codex arasında değiştirmeden önce yeni bir oturum başlatmak için `/new` veya `/reset` kullanın. Bu, bir transkriptin iki uyumsuz yerel oturum sistemi üzerinden yeniden oynatılmasını önler.

Koşum sabitlemeleri oluşturulmadan önce yaratılmış eski oturumlar, transkript geçmişleri olduğunda PI'ye sabitlenmiş olarak değerlendirilir. Yapılandırmayı değiştirdikten sonra o konuşmayı Codex'e geçirmek için `/new` veya `/reset` kullanın.

`/status` etkili model çalışma zamanını gösterir. Varsayılan PI harness şu şekilde görünür:
`Runtime: OpenClaw Pi Default`, Codex app-server harness ise şu şekilde görünür:
`Runtime: OpenAI Codex`.

## Gereksinimler

- Paketle gelen `codex` Plugin'i kullanılabilir olan OpenClaw.
- Codex app-server `0.125.0` veya daha yenisi. Paketle gelen Plugin, varsayılan olarak uyumlu bir
  Codex app-server ikilisini yönetir, bu nedenle `PATH` üzerindeki yerel `codex` komutları normal harness başlatmasını
  etkilemez.
- Codex kimlik doğrulaması app-server işlemi veya OpenClaw'ın Codex kimlik doğrulama
  köprüsü için kullanılabilir olmalıdır. Yerel app-server başlatmaları her
  aracı için OpenClaw tarafından yönetilen bir Codex home ve yalıtılmış bir alt `HOME` kullanır; bu nedenle varsayılan olarak kişisel
  `~/.codex` hesabınızı, Skills'lerinizi, Plugin'lerinizi, yapılandırmanızı, iş parçacığı durumunuzu veya yerel
  `$HOME/.agents/skills` dizininizi okumaz.

Plugin, eski veya sürümsüz app-server el sıkışmalarını engeller. Bu, OpenClaw'ı
test edilmiş olduğu protokol yüzeyinde tutar.

Canlı ve Docker smoke testleri için kimlik doğrulaması genellikle Codex CLI hesabından
veya bir OpenClaw `openai-codex` kimlik doğrulama profilinden gelir. Yerel stdio app-server başlatmaları,
hesap yoksa `CODEX_API_KEY` / `OPENAI_API_KEY` değerlerine de geri dönebilir.

## Diğer modellerin yanına Codex ekleyin

Aynı aracı Codex ve Codex dışı sağlayıcı modelleri arasında serbestçe geçiş yapacaksa
`agentRuntime.id: "codex"` değerini genel olarak ayarlamayın. Zorunlu bir çalışma zamanı, o aracı veya oturum için
her gömülü turda uygulanır. Bu çalışma zamanı zorunluyken bir Anthropic modeli seçerseniz,
OpenClaw yine de Codex harness'ını dener ve o turu sessizce PI üzerinden yönlendirmek yerine kapalı şekilde başarısız olur.

Bunun yerine şu yapılardan birini kullanın:

- Codex'i `agentRuntime.id: "codex"` ile ayrılmış bir aracıya koyun.
- Varsayılan aracıyı normal karma sağlayıcı kullanımı için `agentRuntime.id: "auto"` ve PI fallback ile tutun.
- Eski `codex/*` başvurularını yalnızca uyumluluk için kullanın. Yeni yapılandırmalar
  `openai/*` ile birlikte açık bir Codex çalışma zamanı politikasını tercih etmelidir.

Örneğin, bu yapı varsayılan aracıyı normal otomatik seçimde tutar ve
ayrı bir Codex aracısı ekler:

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

- Varsayılan `main` aracısı normal sağlayıcı yolunu ve PI uyumluluk fallback'ini kullanır.
- `codex` aracısı Codex app-server harness'ını kullanır.
- Codex, `codex` aracısı için eksik veya desteklenmiyorsa tur,
  sessizce PI kullanmak yerine başarısız olur.

## Aracı komut yönlendirmesi

Aracılar kullanıcı isteklerini yalnızca "Codex" sözcüğüne göre değil, niyete göre yönlendirmelidir:

| Kullanıcı şunu ister...                                | Aracı şunu kullanmalıdır...                      |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Bu sohbeti Codex'e bağla"                            | `/codex bind`                                    |
| "Codex iş parçacığı `<id>` burada sürdür"              | `/codex resume <id>`                             |
| "Codex iş parçacıklarını göster"                       | `/codex threads`                                 |
| "Kötü bir Codex çalıştırması için destek raporu aç"    | `/diagnostics [note]`                            |
| "Yalnızca bu ekli iş parçacığı için Codex geri bildirimi gönder" | `/codex diagnostics [note]`                      |
| "ChatGPT/Codex aboneliğimi Codex çalışma zamanı ile kullan" | `openai/*` artı `agentRuntime.id: "codex"`       |
| "ChatGPT/Codex aboneliğimi PI üzerinden kullan"        | `openai-codex/*` model başvuruları               |
| "Codex'i ACP/acpx üzerinden çalıştır"                  | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Bir iş parçacığında Claude Code/Gemini/OpenCode/Cursor başlat" | ACP/acpx; `/codex` değil ve yerel alt aracılar değil |

OpenClaw, ACP spawn rehberliğini aracılara yalnızca ACP etkin,
gönderilebilir ve yüklenmiş bir çalışma zamanı backend'i tarafından destekleniyorsa duyurur. ACP kullanılabilir değilse,
sistem istemi ve Plugin Skills aracıya ACP yönlendirmesini öğretmemelidir.

## Yalnızca Codex dağıtımları

Her gömülü aracı turunun Codex kullandığını kanıtlamanız gerektiğinde Codex harness'ını zorunlu kılın.
Açık Plugin çalışma zamanları varsayılan olarak PI fallback olmadan gelir, bu nedenle
`fallback: "none"` isteğe bağlıdır ancak çoğu zaman dokümantasyon olarak yararlıdır:

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
veya app-server başlatılamıyorsa OpenClaw erken başarısız olur. Yalnızca eksik harness seçimini
bilerek PI'ın işlemesini istiyorsanız `OPENCLAW_AGENT_HARNESS_FALLBACK=pi` değerini ayarlayın.

## Aracı başına Codex

Varsayılan aracı normal otomatik seçimi korurken bir aracı yalnızca Codex olacak şekilde ayarlanabilir:

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

Aracılar ve modeller arasında geçiş yapmak için normal oturum komutlarını kullanın. `/new` yeni bir
OpenClaw oturumu oluşturur ve Codex harness gerektiğinde kendi sidecar app-server
iş parçacığını oluşturur veya sürdürür. `/reset`, o iş parçacığı için OpenClaw oturum bağlamasını temizler
ve sonraki turun harness'ı yeniden geçerli yapılandırmadan çözümlemesine izin verir.

## Model keşfi

Varsayılan olarak Codex Plugin, kullanılabilir modelleri app-server'dan ister. Keşif
başarısız olursa veya zaman aşımına uğrarsa şu modeller için paketle gelen fallback kataloğunu kullanır:

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

Başlatmanın Codex'i yoklamaktan kaçınmasını ve fallback kataloğuna bağlı kalmasını istediğinizde
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

## App-server bağlantısı ve ilkesi

Varsayılan olarak Plugin, OpenClaw'ın yönetilen Codex ikilisini yerel olarak şununla başlatır:

```bash
codex app-server --listen stdio://
```

Yönetilen ikili, `codex` Plugin paketiyle birlikte gönderilir. Bu, app-server sürümünü
yerelde ayrı olarak kurulu olan herhangi bir Codex CLI yerine paketle gelen Plugin'e bağlı tutar.
`appServer.command` değerini yalnızca bilerek farklı bir çalıştırılabilir dosya çalıştırmak istediğinizde ayarlayın.

Varsayılan olarak OpenClaw, yerel Codex harness oturumlarını YOLO modunda başlatır:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Bu, otonom Heartbeat'ler için kullanılan güvenilir yerel operatör duruşudur:
Codex, yanıtlayacak kimse yokken yerel onay istemlerinde durmadan kabuk ve ağ araçlarını kullanabilir.

Codex guardian tarafından gözden geçirilen onaylara katılmak için `appServer.mode:
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

Guardian modu, Codex'in yerel otomatik inceleme onay yolunu kullanır. Codex
sandbox dışına çıkmayı, çalışma alanı dışına yazmayı veya ağ erişimi gibi izinler eklemeyi istediğinde,
Codex bu onay isteğini insan istemi yerine yerel inceleyiciye yönlendirir.
İnceleyici Codex'in risk çerçevesini uygular ve ilgili isteği onaylar veya reddeder.
YOLO modundan daha fazla koruma istediğiniz ancak gözetimsiz aracıların yine de ilerlemesi gerektiğinde Guardian kullanın.

`guardian` ön ayarı `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` ve `sandbox: "workspace-write"` olarak genişler.
Tek tek ilke alanları yine `mode` değerini geçersiz kılar; böylece gelişmiş dağıtımlar ön ayarı
açık seçimlerle karıştırabilir. Eski `guardian_subagent` inceleyici değeri
uyumluluk takma adı olarak hâlâ kabul edilir, ancak yeni yapılandırmalar
`auto_review` kullanmalıdır.

Halihazırda çalışan bir app-server için WebSocket taşımasını kullanın:

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

Stdio app-server başlatmaları varsayılan olarak OpenClaw'ın işlem ortamını devralır,
ancak OpenClaw Codex app-server hesap köprüsünün sahibidir ve hem
`CODEX_HOME` hem de `HOME` değerlerini o aracının OpenClaw durumu altında aracı başına dizinlere ayarlar.
Codex'in kendi skill loader'ı `$CODEX_HOME/skills` ve
`$HOME/.agents/skills` okur; bu nedenle yerel app-server başlatmaları için iki değer de yalıtılmıştır.
Bu, Codex yerel Skills, Plugin'ler, yapılandırma, hesaplar ve iş parçacığı durumunun operatörün
kişisel Codex CLI home'undan sızmak yerine OpenClaw aracısına kapsamlanmasını sağlar.

OpenClaw Plugin'leri ve OpenClaw skill snapshot'ları yine OpenClaw'ın kendi
Plugin registry'si ve skill loader'ı üzerinden akar. Kişisel Codex CLI varlıkları akmaz.
Bir OpenClaw aracısının parçası olması gereken yararlı Codex CLI Skills veya Plugin'leriniz varsa,
bunların envanterini açıkça çıkarın:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex migration provider, Skills'leri geçerli OpenClaw aracı çalışma alanına kopyalar.
Codex yerel Plugin'leri, hook'ları ve yapılandırma dosyaları, komut çalıştırabilecekleri,
MCP sunucuları açığa çıkarabilecekleri veya kimlik bilgileri taşıyabilecekleri için otomatik olarak etkinleştirilmek yerine
manuel inceleme için raporlanır veya arşivlenir.

Kimlik doğrulaması şu sırayla seçilir:

1. Aracı için açık bir OpenClaw Codex kimlik doğrulama profili.
2. App-server'ın o aracının Codex home içindeki mevcut hesabı.
3. Yalnızca yerel stdio app-server başlatmaları için, app-server hesabı yoksa ve OpenAI kimlik doğrulaması
   hâlâ gerekiyorsa `CODEX_API_KEY`, ardından
   `OPENAI_API_KEY`.

OpenClaw, ChatGPT abonelik tarzı bir Codex kimlik doğrulama profili gördüğünde,
oluşturulan Codex alt işleminden `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini kaldırır. Bu,
Gateway düzeyi API anahtarlarını embedding'ler veya doğrudan OpenAI modelleri için kullanılabilir tutarken
yerel Codex app-server turlarının yanlışlıkla API üzerinden ücretlendirilmesini engeller.
Açık Codex API anahtarı profilleri ve yerel stdio ortam anahtarı fallback'i, devralınan alt işlem ortamı yerine
app-server oturum açmasını kullanır. WebSocket app-server bağlantıları
Gateway ortam API anahtarı fallback'ini almaz; açık bir kimlik doğrulama profili veya
uzak app-server'ın kendi hesabını kullanın.

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

`appServer.clearEnv` yalnızca oluşturulan Codex app-server alt işlemini etkiler.

Codex dinamik araçları varsayılan olarak `native-first` profilini kullanır. Bu modda,
OpenClaw Codex yerel çalışma alanı işlemlerini çoğaltan dinamik araçları açığa çıkarmaz:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` ve
`update_plan`. Mesajlaşma, oturumlar, medya,
cron, tarayıcı, node'lar, gateway, `heartbeat_respond` ve `web_search` gibi OpenClaw entegrasyon araçları
kullanılabilir kalır.

Desteklenen üst düzey Codex Plugin alanları:

| Alan                       | Varsayılan       | Anlam                                                                                                 |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Tüm OpenClaw dinamik araç kümesini Codex app-server'a açmak için `"openclaw-compat"` kullanın.        |
| `codexDynamicToolsExclude` | `[]`             | Codex app-server turlarından çıkarılacak ek OpenClaw dinamik araç adları.                             |

Desteklenen `appServer` alanları:

| Alan                | Varsayılan                               | Anlam                                                                                                                                                                                                                                      |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` Codex'i başlatır; `"websocket"` `url` adresine bağlanır.                                                                                                                                                                         |
| `command`           | yönetilen Codex ikili dosyası            | stdio taşıması için çalıştırılabilir dosya. Yönetilen ikili dosyayı kullanmak için ayarlamadan bırakın; yalnızca açık bir geçersiz kılma için ayarlayın.                                                                                  |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio taşıması için argümanlar.                                                                                                                                                                                                            |
| `url`               | ayarlanmamış                             | WebSocket app-server URL'si.                                                                                                                                                                                                               |
| `authToken`         | ayarlanmamış                             | WebSocket taşıması için Bearer token.                                                                                                                                                                                                      |
| `headers`           | `{}`                                     | Ek WebSocket üstbilgileri.                                                                                                                                                                                                                 |
| `clearEnv`          | `[]`                                     | OpenClaw devralınan ortamını oluşturduktan sonra başlatılan stdio app-server sürecinden kaldırılan ek ortam değişkeni adları. `CODEX_HOME` ve `HOME`, yerel başlatmalarda OpenClaw'ın ajan başına Codex yalıtımı için ayrılmıştır.       |
| `requestTimeoutMs`  | `60000`                                  | app-server denetim düzlemi çağrıları için zaman aşımı.                                                                                                                                                                                     |
| `mode`              | `"yolo"`                                 | YOLO veya guardian incelemeli yürütme için ön ayar.                                                                                                                                                                                        |
| `approvalPolicy`    | `"never"`                                | Thread başlatma/sürdürme/tur işlemlerine gönderilen yerel Codex onay ilkesi.                                                                                                                                                               |
| `sandbox`           | `"danger-full-access"`                   | Thread başlatma/sürdürme işlemlerine gönderilen yerel Codex sandbox modu.                                                                                                                                                                  |
| `approvalsReviewer` | `"user"`                                 | Codex'in yerel onay istemlerini incelemesine izin vermek için `"auto_review"` kullanın. `guardian_subagent` eski bir takma ad olarak kalır.                                                                                                |
| `serviceTier`       | ayarlanmamış                             | İsteğe bağlı Codex app-server hizmet katmanı: `"fast"`, `"flex"` veya `null`. Geçersiz eski değerler yok sayılır.                                                                                                                          |

OpenClaw'a ait dinamik araç çağrıları `appServer.requestTimeoutMs` değerinden
bağımsız olarak sınırlandırılır: her Codex `item/tool/call` isteği 30 saniye
içinde bir OpenClaw yanıtı almalıdır. Zaman aşımında OpenClaw, desteklendiği
yerlerde araç sinyalini iptal eder ve Codex'e başarısız bir dinamik araç yanıtı
döndürür; böylece oturum `processing` durumunda bırakılmak yerine tur devam
edebilir.

OpenClaw bir Codex tur kapsamlı app-server isteğine yanıt verdikten sonra,
harness ayrıca Codex'in yerel turu `turn/completed` ile bitirmesini bekler. Bu
yanıttan sonra app-server 60 saniye sessiz kalırsa OpenClaw en iyi çabayla Codex
turunu keser, tanılama amaçlı bir zaman aşımı kaydeder ve OpenClaw oturum
şeridini serbest bırakır; böylece sonraki sohbet mesajları bayat bir yerel turun
arkasında kuyruğa alınmaz.

Yerel test için ortam geçersiz kılmaları kullanılabilir olmaya devam eder:

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
Tekrarlanabilir dağıtımlar için yapılandırma tercih edilir, çünkü Plugin
davranışını Codex harness kurulumunun geri kalanıyla aynı incelenmiş dosyada
tutar.

## Bilgisayar kullanımı

Bilgisayar Kullanımı kendi kurulum kılavuzunda ele alınır:
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use).

Kısa sürüm: OpenClaw masaüstü denetim uygulamasını vendörlemez veya masaüstü
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

Kurulum komut yüzeyinden denetlenebilir veya yüklenebilir:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Bilgisayar Kullanımı macOS'a özgüdür ve Codex MCP sunucusunun uygulamaları
denetleyebilmesinden önce yerel işletim sistemi izinleri gerektirebilir.
`computerUse.enabled` true ise ve MCP sunucusu kullanılamıyorsa Codex modu
turları, yerel Bilgisayar Kullanımı araçları olmadan sessizce çalışmak yerine
thread başlamadan önce başarısız olur. Marketplace seçenekleri, uzak katalog
sınırları, durum nedenleri ve sorun giderme için
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use) bölümüne bakın.

`computerUse.autoInstall` true olduğunda, Codex henüz yerel bir marketplace
keşfetmediyse OpenClaw standart paketli Codex Desktop marketplace'i
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` konumundan
kaydedebilir. Çalışma zamanı veya Bilgisayar Kullanımı yapılandırmasını
değiştirdikten sonra mevcut oturumların eski bir PI ya da Codex thread
bağlantısını tutmaması için `/new` veya `/reset` kullanın.

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
Codex thread'ine eklendiğinde, sonraki tur o anda seçili OpenAI modelini,
sağlayıcıyı, onay ilkesini, sandbox'ı ve hizmet katmanını app-server'a yeniden
gönderir. `openai/gpt-5.5` modelinden `openai/gpt-5.2` modeline geçmek thread
bağlantısını korur ancak Codex'ten yeni seçilen modelle devam etmesini ister.

## Codex komutu

Paketli Plugin, `/codex` komutunu yetkili bir eğik çizgi komutu olarak
kaydeder. Geneldir ve OpenClaw metin komutlarını destekleyen tüm kanallarda
çalışır.

Yaygın biçimler:

- `/codex status` canlı app-server bağlantısını, modelleri, hesabı, hız sınırlarını, MCP sunucularını ve skills durumunu gösterir.
- `/codex models` canlı Codex app-server modellerini listeler.
- `/codex threads [filter]` son Codex thread'lerini listeler.
- `/codex resume <thread-id>` geçerli OpenClaw oturumunu mevcut bir Codex thread'ine ekler.
- `/codex compact` Codex app-server'dan ekli thread'i compact etmesini ister.
- `/codex review` ekli thread için yerel Codex incelemesini başlatır.
- `/codex diagnostics [note]` ekli thread için Codex tanılama geri bildirimi göndermeden önce sorar.
- `/codex computer-use status` yapılandırılmış Bilgisayar Kullanımı Plugin'ini ve MCP sunucusunu denetler.
- `/codex computer-use install` yapılandırılmış Bilgisayar Kullanımı Plugin'ini yükler ve MCP sunucularını yeniden yükler.
- `/codex account` hesap ve hız sınırı durumunu gösterir.
- `/codex mcp` Codex app-server MCP sunucusu durumunu listeler.
- `/codex skills` Codex app-server skills listesini gösterir.

### Yaygın hata ayıklama iş akışı

Codex destekli bir ajan Telegram, Discord, Slack veya başka bir kanalda
şaşırtıcı bir şey yaptığında, sorunun yaşandığı konuşmayla başlayın:

1. Gördüklerinizi açıklayan `/diagnostics bad tool choice after image upload` veya başka kısa bir not çalıştırın.
2. Tanılama isteğini bir kez onaylayın. Onay, yerel Gateway tanılama zip dosyasını oluşturur ve oturum Codex harness kullandığı için ilgili Codex geri bildirim paketini de OpenAI sunucularına gönderir.
3. Tamamlanan tanılama yanıtını hata raporuna veya destek ileti dizisine kopyalayın. Yanıt yerel paket yolunu, gizlilik özetini, OpenClaw oturum kimliklerini, Codex ileti dizisi kimliklerini ve her Codex ileti dizisi için bir `Inspect locally` satırını içerir.
4. Çalıştırmayı kendiniz hata ayıklamak isterseniz, yazdırılan `Inspect locally` komutunu bir terminalde çalıştırın. Komut `codex resume <thread-id>` gibi görünür ve yerel Codex ileti dizisini açar; böylece konuşmayı inceleyebilir, yerelde sürdürebilir veya Codex'e neden belirli bir aracı ya da planı seçtiğini sorabilirsiniz.

`/codex diagnostics [note]` komutunu yalnızca tam OpenClaw Gateway tanılama paketi olmadan, şu anda bağlı olan ileti dizisi için Codex geri bildirim yüklemesini özellikle istediğinizde kullanın. Çoğu destek raporu için `/diagnostics [note]` daha iyi bir başlangıç noktasıdır; çünkü yerel Gateway durumunu ve Codex ileti dizisi kimliklerini tek bir yanıtta bir araya getirir. Tam gizlilik modeli ve grup sohbeti davranışı için [Tanılama dışa aktarımı](/tr/gateway/diagnostics) bölümüne bakın.

Çekirdek OpenClaw ayrıca genel Gateway tanılama komutu olarak yalnızca sahiplerin kullanabildiği `/diagnostics [note]` komutunu da sunar. Bu komutun onay istemi hassas veri önsözünü gösterir, [Tanılama Dışa Aktarımı](/tr/gateway/diagnostics) sayfasına bağlantı verir ve her seferinde açık exec onayı üzerinden `openclaw gateway diagnostics export --json` ister. Tanılamayı tümüne izin veren bir kuralla onaylamayın. Onaydan sonra OpenClaw, yerel paket yolu ve manifest özetiyle birlikte yapıştırılabilir bir rapor gönderir. Etkin OpenClaw oturumu Codex harness kullanıyorsa, aynı onay ilgili Codex geri bildirim paketlerinin OpenAI sunucularına gönderilmesine de yetki verir. Onay istemi Codex geri bildiriminin gönderileceğini söyler, ancak onaydan önce Codex oturum veya ileti dizisi kimliklerini listelemez.

`/diagnostics` bir grup sohbetinde bir sahip tarafından çağrılırsa, OpenClaw paylaşılan kanalı temiz tutar: grup yalnızca kısa bir bildirim alırken tanılama önsözü, onay istemleri ve Codex oturum/ileti dizisi kimlikleri özel onay yolu üzerinden sahibe gönderilir. Özel sahip yolu yoksa, OpenClaw grup isteğini reddeder ve sahibin bunu bir DM üzerinden çalıştırmasını ister.

Onaylanan Codex yüklemesi, Codex app-server `feedback/upload` çağrısı yapar ve app-server'dan, mümkün olduğunda listelenen her ileti dizisi ve oluşturulan Codex alt ileti dizileri için günlükleri eklemesini ister. Yükleme, Codex'in normal geri bildirim yolu üzerinden OpenAI sunucularına gider; bu app-server'da Codex geri bildirimi devre dışıysa komut app-server hatasını döndürür. Tamamlanan tanılama yanıtı, gönderilen ileti dizileri için kanalları, OpenClaw oturum kimliklerini, Codex ileti dizisi kimliklerini ve yerel `codex resume <thread-id>` komutlarını listeler. Onayı reddeder veya yok sayarsanız, OpenClaw bu Codex kimliklerini yazdırmaz. Bu yükleme yerel Gateway tanılama dışa aktarımının yerine geçmez.

`/codex resume`, harness'ın normal dönüşler için kullandığı aynı sidecar bağlama dosyasını yazar. Bir sonraki iletide OpenClaw bu Codex ileti dizisini sürdürür, şu anda seçili OpenClaw modelini app-server'a geçirir ve genişletilmiş geçmişi etkin tutar.

### CLI'dan bir Codex ileti dizisini inceleme

Kötü bir Codex çalıştırmasını anlamanın en hızlı yolu çoğu zaman yerel Codex ileti dizisini doğrudan açmaktır:

```sh
codex resume <thread-id>
```

Bunu, bir kanal konuşmasında hata fark ettiğinizde ve sorunlu Codex oturumunu incelemek, yerelde sürdürmek veya Codex'e neden belirli bir araç ya da akıl yürütme seçimi yaptığını sormak istediğinizde kullanın. En kolay yol genellikle önce `/diagnostics [note]` çalıştırmaktır: onayladıktan sonra tamamlanan rapor her Codex ileti dizisini listeler ve örneğin `codex resume <thread-id>` gibi bir `Inspect locally` komutu yazdırır. Bu komutu doğrudan bir terminale kopyalayabilirsiniz.

Geçerli sohbet için `/codex binding` komutundan veya son Codex app-server ileti dizileri için `/codex threads [filter]` komutundan da bir ileti dizisi kimliği alabilir, ardından kabuğunuzda aynı `codex resume` komutunu çalıştırabilirsiniz.

Komut yüzeyi Codex app-server `0.125.0` veya daha yenisini gerektirir. Gelecekteki veya özel bir app-server ilgili JSON-RPC yöntemini sunmuyorsa, tek tek denetim yöntemleri `unsupported by this Codex app-server` olarak raporlanır.

## Kanca sınırları

Codex harness üç kanca katmanına sahiptir:

| Katman                                | Sahip                    | Amaç                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin kancaları             | OpenClaw                 | PI ve Codex harness'ları genelinde ürün/Plugin uyumluluğu.          |
| Codex app-server uzantı ara katmanı   | OpenClaw paket Plugin'leri | OpenClaw dinamik araçları etrafında dönüş başına adaptör davranışı. |
| Codex yerel kancaları                 | Codex                    | Codex yapılandırmasından düşük düzeyli Codex yaşam döngüsü ve yerel araç ilkesi. |

OpenClaw, OpenClaw Plugin davranışını yönlendirmek için proje veya genel Codex `hooks.json` dosyalarını kullanmaz. Desteklenen yerel araç ve izin köprüsü için OpenClaw, `PreToolUse`, `PostToolUse`, `PermissionRequest` ve `Stop` için ileti dizisi başına Codex yapılandırması enjekte eder. `SessionStart` ve `UserPromptSubmit` gibi diğer Codex kancaları Codex düzeyi denetimler olarak kalır; bunlar v1 sözleşmesinde OpenClaw Plugin kancaları olarak sunulmaz.

OpenClaw dinamik araçları için OpenClaw, Codex çağrıyı istedikten sonra aracı yürütür; bu yüzden OpenClaw sahip olduğu Plugin ve ara katman davranışını harness adaptöründe tetikler. Codex yerel araçları için kanonik araç kaydının sahibi Codex'tir. OpenClaw seçili olayları yansıtabilir, ancak Codex bu işlemi app-server veya yerel kanca geri çağrıları üzerinden sunmadıkça yerel Codex ileti dizisini yeniden yazamaz.

Compaction ve LLM yaşam döngüsü projeksiyonları, yerel Codex kanca komutlarından değil Codex app-server bildirimlerinden ve OpenClaw adaptör durumundan gelir. OpenClaw'ın `before_compaction`, `after_compaction`, `llm_input` ve `llm_output` olayları adaptör düzeyi gözlemlerdir; Codex'in iç isteğinin veya Compaction yüklerinin bayt bayt yakalanmış hali değildir.

Codex yerel `hook/started` ve `hook/completed` app-server bildirimleri, yörünge ve hata ayıklama için `codex_app_server.hook` aracı olayları olarak projekte edilir. Bunlar OpenClaw Plugin kancalarını çağırmaz.

## V1 destek sözleşmesi

Codex modu, altında farklı bir model çağrısı olan PI değildir. Codex yerel model döngüsünün daha büyük bir kısmına sahiptir ve OpenClaw Plugin ve oturum yüzeylerini bu sınırın etrafında uyarlar.

Codex runtime v1'de desteklenenler:

| Yüzey                                         | Destek                                  | Neden                                                                                                                                                                                                |
| --------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex üzerinden OpenAI model döngüsü          | Desteklenir                             | Codex app-server, OpenAI dönüşünün, yerel ileti dizisi sürdürmenin ve yerel araç devamının sahibidir.                                                                                                 |
| OpenClaw kanal yönlendirme ve teslimi         | Desteklenir                             | Telegram, Discord, Slack, WhatsApp, iMessage ve diğer kanallar model runtime dışında kalır.                                                                                                           |
| OpenClaw dinamik araçları                     | Desteklenir                             | Codex, OpenClaw'dan bu araçları yürütmesini ister; bu nedenle OpenClaw yürütme yolunda kalır.                                                                                                         |
| İstem ve bağlam Plugin'leri                   | Desteklenir                             | OpenClaw istem katmanları oluşturur ve ileti dizisini başlatmadan veya sürdürmeden önce bağlamı Codex dönüşüne projekte eder.                                                                         |
| Bağlam motoru yaşam döngüsü                   | Desteklenir                             | Codex dönüşleri için birleştirme, içe alma veya dönüş sonrası bakım ve bağlam motoru Compaction koordinasyonu çalışır.                                                                                |
| Dinamik araç kancaları                        | Desteklenir                             | `before_tool_call`, `after_tool_call` ve araç sonucu ara katmanı, OpenClaw'ın sahip olduğu dinamik araçların etrafında çalışır.                                                                       |
| Yaşam döngüsü kancaları                       | Adaptör gözlemleri olarak desteklenir   | `llm_input`, `llm_output`, `agent_end`, `before_compaction` ve `after_compaction` dürüst Codex modu yükleriyle tetiklenir.                                                                            |
| Son yanıt revizyon kapısı                     | Yerel kanca aktarımı üzerinden desteklenir | Codex `Stop`, `before_agent_finalize` içine aktarılır; `revise`, sonlandırmadan önce Codex'ten bir model geçişi daha ister.                                                                        |
| Yerel kabuk, yama ve MCP engelleme veya gözlem | Yerel kanca aktarımı üzerinden desteklenir | Codex `PreToolUse` ve `PostToolUse`, Codex app-server `0.125.0` veya daha yenisindeki MCP yükleri dahil olmak üzere taahhüt edilmiş yerel araç yüzeyleri için aktarılır. Engelleme desteklenir; bağımsız değişken yeniden yazımı desteklenmez. |
| Yerel izin ilkesi                             | Yerel kanca aktarımı üzerinden desteklenir | Runtime sunduğunda Codex `PermissionRequest`, OpenClaw ilkesi üzerinden yönlendirilebilir. OpenClaw karar döndürmezse Codex normal koruyucu veya kullanıcı onayı yolu üzerinden devam eder.          |
| App-server yörünge yakalama                   | Desteklenir                             | OpenClaw, app-server'a gönderdiği isteği ve aldığı app-server bildirimlerini kaydeder.                                                                                                                |

Codex runtime v1'de desteklenmeyenler:

| Yüzey                                               | V1 sınırı                                                                                                                                           | Gelecek yol                                                                                          |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Yerel araç bağımsız değişkeni mutasyonu             | Codex yerel ön araç hook'ları engelleyebilir, ancak OpenClaw Codex'e özgü yerel araç bağımsız değişkenlerini yeniden yazmaz.                       | Yedek araç girdisi için Codex hook/şema desteği gerektirir.                                          |
| Düzenlenebilir Codex'e özgü yerel transcript geçmişi | Standart yerel iş parçacığı geçmişi Codex'e aittir. OpenClaw bir yansıtmanın sahibidir ve gelecekteki bağlamı yansıtabilir, ancak desteklenmeyen iç yapıları değiştirmemelidir. | Yerel iş parçacığı müdahalesi gerekiyorsa açık Codex uygulama sunucusu API'leri ekleyin.             |
| Codex'e özgü yerel araç kayıtları için `tool_result_persist` | Bu hook OpenClaw'a ait transcript yazımlarını dönüştürür, Codex'e özgü yerel araç kayıtlarını değil.                                              | Dönüştürülmüş kayıtları yansıtabilir, ancak standart yeniden yazma Codex desteği gerektirir.         |
| Zengin yerel Compaction meta verileri               | OpenClaw Compaction başlangıcını ve tamamlanmasını gözlemler, ancak kararlı bir tutulan/bırakılan listesi, token deltası veya özet yükü almaz.     | Daha zengin Codex Compaction olayları gerektirir.                                                    |
| Compaction müdahalesi                               | Mevcut OpenClaw Compaction hook'ları Codex modunda bildirim düzeyindedir.                                                                          | Plugin'lerin yerel Compaction'ı veto etmesi veya yeniden yazması gerekiyorsa Codex ön/son Compaction hook'ları ekleyin. |
| Bayt bayt model API isteği yakalama                 | OpenClaw uygulama sunucusu isteklerini ve bildirimlerini yakalayabilir, ancak son OpenAI API isteğini Codex çekirdeği dahili olarak oluşturur.     | Bir Codex model isteği izleme olayı veya hata ayıklama API'si gerektirir.                            |

## Araçlar, medya ve Compaction

Codex koşum takımı yalnızca düşük düzeyli gömülü ajan yürütücüsünü değiştirir.

OpenClaw araç listesini oluşturmaya ve koşum takımından dinamik araç sonuçları almaya devam eder. Metin, görseller, video, müzik, TTS, onaylar ve mesajlaşma aracı çıktısı normal OpenClaw teslim yolundan geçmeye devam eder.

Yerel hook aktarımı kasıtlı olarak geneldir, ancak v1 destek sözleşmesi OpenClaw'ın test ettiği Codex'e özgü yerel araç ve izin yollarıyla sınırlıdır. Codex çalışma zamanında buna shell, patch ve MCP `PreToolUse`, `PostToolUse` ve `PermissionRequest` yükleri dahildir. Çalışma zamanı sözleşmesi adını vermeden her gelecekteki Codex hook olayının bir OpenClaw Plugin yüzeyi olduğunu varsaymayın.

`PermissionRequest` için OpenClaw yalnızca ilke karar verdiğinde açık izin veya reddetme kararları döndürür. Kararsız sonuç izin değildir. Codex bunu hook kararı yok olarak ele alır ve kendi koruyucusuna veya kullanıcı onayı yoluna düşer.

Codex MCP araç onayı istemleri, Codex `_meta.codex_approval_kind` değerini `"mcp_tool_call"` olarak işaretlediğinde OpenClaw'ın Plugin onay akışından yönlendirilir. Codex `request_user_input` istemleri kaynak sohbete geri gönderilir ve sıradaki sonraki takip mesajı, ekstra bağlam olarak yönlendirilmek yerine bu yerel sunucu isteğini yanıtlar. Diğer MCP isteme istekleri yine kapalı şekilde başarısız olur.

Etkin çalışma kuyruğu yönlendirmesi Codex uygulama sunucusu `turn/steer` üzerine eşlenir. Varsayılan `messages.queue.mode: "steer"` ile OpenClaw kuyruğa alınmış sohbet mesajlarını yapılandırılmış sessiz pencere boyunca toplar ve varış sırasıyla tek bir `turn/steer` isteği olarak gönderir. Eski `queue` modu ayrı `turn/steer` istekleri gönderir. Codex review ve manuel Compaction dönüşleri aynı dönüş yönlendirmesini reddedebilir; bu durumda OpenClaw, seçili mod geri dönüşe izin verdiğinde takip kuyruğunu kullanır. Bkz. [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

Seçili model Codex koşum takımını kullandığında, yerel iş parçacığı Compaction'ı Codex uygulama sunucusuna devredilir. OpenClaw kanal geçmişi, arama, `/new`, `/reset` ve gelecekteki model ya da koşum takımı geçişleri için bir transcript yansıtması tutar. Yansıtma, uygulama sunucusu bunları yaydığında kullanıcı istemini, son asistan metnini ve hafif Codex akıl yürütme ya da plan kayıtlarını içerir. Bugün OpenClaw yalnızca yerel Compaction başlangıç ve tamamlanma sinyallerini kaydeder. Henüz insan tarafından okunabilir bir Compaction özeti veya Codex'in Compaction sonrasında hangi girdileri tuttuğuna dair denetlenebilir bir liste sunmaz.

Standart yerel iş parçacığı Codex'e ait olduğundan, `tool_result_persist` şu anda Codex'e özgü yerel araç sonuç kayıtlarını yeniden yazmaz. Yalnızca OpenClaw, OpenClaw'a ait bir oturum transcript araç sonucu yazarken uygulanır.

Medya üretimi PI gerektirmez. Görsel, video, müzik, PDF, TTS ve medya anlama `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` ve `messages.tts` gibi eşleşen sağlayıcı/model ayarlarını kullanmaya devam eder.

## Sorun giderme

**Codex normal bir `/model` sağlayıcısı olarak görünmüyor:** bu yeni yapılandırmalar için beklenen bir durumdur. `agentRuntime.id: "codex"` ile bir `openai/gpt-*` modeli (veya eski bir `codex/*` başvurusu) seçin, `plugins.entries.codex.enabled` değerini etkinleştirin ve `plugins.allow` öğesinin `codex` değerini hariç tutup tutmadığını kontrol edin.

**OpenClaw Codex yerine PI kullanıyor:** `agentRuntime.id: "auto"`, hiçbir Codex koşum takımı çalışmayı üstlenmediğinde uyumluluk arka ucu olarak hâlâ PI kullanabilir. Test sırasında Codex seçimini zorlamak için `agentRuntime.id: "codex"` ayarlayın. Zorlanmış bir Codex çalışma zamanı artık açıkça `agentRuntime.fallback: "pi"` ayarlamadığınız sürece PI'ye geri dönmek yerine başarısız olur. Codex uygulama sunucusu seçildikten sonra hataları ek geri dönüş yapılandırması olmadan doğrudan görünür.

**Uygulama sunucusu reddediliyor:** uygulama sunucusu el sıkışması `0.125.0` veya daha yeni bir sürüm raporlayacak şekilde Codex'i yükseltin. `0.125.0-alpha.2` veya `0.125.0+custom` gibi aynı sürüm ön sürümleri ya da derleme sonekli sürümler reddedilir, çünkü OpenClaw'ın test ettiği kararlı `0.125.0` protokol alt sınırıdır.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs` değerini düşürün veya keşfi devre dışı bırakın.

**WebSocket taşıması hemen başarısız oluyor:** `appServer.url`, `authToken` değerlerini ve uzak uygulama sunucusunun aynı Codex uygulama sunucusu protokol sürümünü konuştuğunu kontrol edin.

**Codex olmayan bir model PI kullanıyor:** bu, söz konusu ajan için `agentRuntime.id: "codex"` zorlamadığınız veya eski bir `codex/*` başvurusu seçmediğiniz sürece beklenen bir durumdur. Düz `openai/gpt-*` ve diğer sağlayıcı başvuruları `auto` modunda normal sağlayıcı yollarında kalır. `agentRuntime.id: "codex"` zorlarsanız, o ajanın her gömülü dönüşü Codex tarafından desteklenen bir OpenAI modeli olmalıdır.

**Computer Use yüklü ancak araçlar çalışmıyor:** yeni bir oturumdan `/codex computer-use status` değerini kontrol edin. Bir araç `Native hook relay unavailable` bildirirse `/new` veya `/reset` kullanın; sorun sürerse eski yerel hook kayıtlarını temizlemek için gateway'i yeniden başlatın. `computer-use.list_apps` zaman aşımına uğrarsa Codex Computer Use veya Codex Desktop'ı yeniden başlatıp tekrar deneyin.

## İlgili

- [Ajan koşum takımı Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Ajan çalışma zamanları](/tr/concepts/agent-runtimes)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [Durum](/tr/cli/status)
- [Plugin hook'ları](/tr/plugins/hooks)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [Test](/tr/help/testing-live#live-codex-app-server-harness-smoke)
