---
read_when:
    - Birlikte gelen Codex uygulama sunucusu test düzenini kullanmak istiyorsunuz
    - Codex harness yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex dağıtımlarının PI'ye geri dönmek yerine başarısız olmasını istiyorsunuz
summary: OpenClaw gömülü ajan turlarını birlikte gelen Codex app-server test düzeneği üzerinden çalıştırın
title: Codex çalıştırma düzeneği
x-i18n:
    generated_at: "2026-05-03T08:58:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83cb442bb2b87fdfe530619e8951bc8f4f5a7d3bfd68ca49eeb16bbdd8b189b4
    source_path: plugins/codex-harness.md
    workflow: 16
---

Paketle birlikte gelen `codex` Plugin'i, OpenClaw'ın yerleşik PI donanımı yerine
Codex app-server üzerinden gömülü ajan dönüşleri çalıştırmasını sağlar.

Bunu, düşük düzeyli ajan oturumunun Codex tarafından yönetilmesini istediğinizde
kullanın: model keşfi, yerel iş parçacığı sürdürme, yerel Compaction ve
app-server yürütmesi. OpenClaw sohbet kanallarını, oturum dosyalarını, model
seçimini, araçları, onayları, medya teslimini ve görünür konuşma dökümü
aynasını yönetmeye devam eder.

Bir kaynak sohbet dönüşü Codex donanımı üzerinden çalıştığında, dağıtım
`messages.visibleReplies` değerini açıkça yapılandırmamışsa görünür yanıtlar
varsayılan olarak OpenClaw `message` aracını kullanır. Ajan yine de Codex
dönüşünü özel olarak tamamlayabilir; yalnızca `message(action="send")` çağrısı
yaptığında kanala gönderi yapar. Doğrudan sohbet son yanıtlarını eski otomatik
teslim yolunda tutmak için `messages.visibleReplies: "automatic"` ayarını yapın.

Codex Heartbeat dönüşleri de varsayılan olarak `heartbeat_respond` aracını alır;
böylece ajan, uyanmanın sessiz kalıp kalmayacağını veya bildirim gönderip
göndermeyeceğini bu kontrol akışını son metne kodlamadan kaydedebilir.

Kendinizi konumlandırmaya çalışıyorsanız
[Ajan çalışma zamanları](/tr/concepts/agent-runtimes) ile başlayın. Kısa sürüm
şudur: `openai/gpt-5.5` model referansıdır, `codex` çalışma zamanıdır ve
Telegram, Discord, Slack veya başka bir kanal iletişim yüzeyi olarak kalır.

## Hızlı yapılandırma

"OpenClaw içinde Codex" isteyen çoğu kullanıcı şu rotayı ister: bir
ChatGPT/Codex aboneliğiyle oturum açmak, ardından gömülü ajan dönüşlerini yerel
Codex app-server çalışma zamanı üzerinden çalıştırmak. Model referansı yine de
`openai/gpt-*` olarak kanonik kalır; abonelik kimlik doğrulaması
`openai-codex/*` model önekinden değil, Codex hesabından/profilinden gelir.

Henüz yapmadıysanız önce Codex OAuth ile oturum açın:

```bash
openclaw models auth login --provider openai-codex
```

Ardından paketle birlikte gelen `codex` Plugin'ini etkinleştirin ve Codex çalışma
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

Yerel Codex çalışma zamanını kastediyorsanız `openai-codex/gpt-*`
kullanmayın. Bu önek açık "PI üzerinden Codex OAuth" rotasıdır. Yapılandırma
değişiklikleri yeni veya sıfırlanmış oturumlara uygulanır; mevcut oturumlar
kaydedilmiş çalışma zamanlarını korur.

## Bu Plugin neyi değiştirir?

Paketle birlikte gelen `codex` Plugin'i birkaç ayrı yetenek sağlar:

| Yetenek                           | Nasıl kullanırsınız                                | Ne yapar                                                                      |
| --------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| Yerel gömülü çalışma zamanı       | `agentRuntime.id: "codex"`                         | OpenClaw gömülü ajan dönüşlerini Codex app-server üzerinden çalıştırır.       |
| Yerel sohbet denetim komutları    | `/codex bind`, `/codex resume`, `/codex steer`, ... | Mesajlaşma konuşmasından Codex app-server iş parçacıklarını bağlar ve yönetir. |
| Codex app-server sağlayıcısı/kataloğu | `codex` iç bileşenleri, donanım üzerinden sunulur | Çalışma zamanının app-server modellerini keşfetmesini ve doğrulamasını sağlar. |
| Codex medya anlama yolu           | `codex/*` görüntü modeli uyumluluk yolları         | Desteklenen görüntü anlama modelleri için sınırlı Codex app-server dönüşleri çalıştırır. |
| Yerel kanca aktarıcısı            | Codex-yerel olayları çevreleyen Plugin kancaları   | OpenClaw'ın desteklenen Codex-yerel araç/sonlandırma olaylarını gözlemlemesini/engellemesini sağlar. |

Plugin'i etkinleştirmek bu yetenekleri kullanılabilir hale getirir. Şunları
**yapmaz**:

- her OpenAI modeli için Codex kullanmaya başlamak
- `openai-codex/*` model referanslarını yerel çalışma zamanına dönüştürmek
- ACP/acpx yolunu varsayılan Codex yolu yapmak
- zaten PI çalışma zamanı kaydetmiş mevcut oturumları anında değiştirmek
- OpenClaw kanal teslimini, oturum dosyalarını, kimlik doğrulama profili
  depolamasını veya mesaj yönlendirmeyi değiştirmek

Aynı Plugin yerel `/codex` sohbet denetim komut yüzeyini de yönetir. Plugin
etkinse ve kullanıcı sohbetten Codex iş parçacıklarını bağlamayı, sürdürmeyi,
yönlendirmeyi, durdurmayı veya incelemeyi isterse ajanlar ACP yerine `/codex ...`
tercih etmelidir. Kullanıcı ACP/acpx istediğinde veya ACP Codex bağdaştırıcısını
test ettiğinde ACP açık geri dönüş seçeneği olarak kalır.

Yerel Codex dönüşleri, OpenClaw Plugin kancalarını genel uyumluluk katmanı olarak
korur. Bunlar süreç içi OpenClaw kancalarıdır, Codex `hooks.json` komut kancaları
değildir:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` yansıtılmış konuşma dökümü kayıtları için
- Codex `Stop` aktarıcısı üzerinden `before_agent_finalize`
- `agent_end`

Plugin'ler, OpenClaw aracı yürüttükten sonra ve sonuç Codex'e döndürülmeden önce
OpenClaw dinamik araç sonuçlarını yeniden yazmak için çalışma zamanından bağımsız
araç sonucu ara katmanı da kaydedebilir. Bu, OpenClaw'a ait konuşma dökümü araç
sonucu yazımlarını dönüştüren genel `tool_result_persist` Plugin kancasından
ayrıdır.

Plugin kanca semantiklerinin kendisi için [Plugin kancaları](/tr/plugins/hooks)
ve [Plugin koruma davranışı](/tr/tools/plugin) bölümlerine bakın.

Donanım varsayılan olarak kapalıdır. Yeni yapılandırmalar OpenAI model
referanslarını `openai/gpt-*` olarak kanonik tutmalı ve yerel app-server yürütmesi
istediklerinde açıkça `agentRuntime.id: "codex"` veya
`OPENCLAW_AGENT_RUNTIME=codex` zorunlu kılmalıdır. Eski `codex/*` model
referansları uyumluluk için donanımı hâlâ otomatik seçer, ancak çalışma zamanı
destekli eski sağlayıcı önekleri normal model/sağlayıcı seçenekleri olarak
gösterilmez.

`codex` Plugin'i etkinse ancak birincil model hâlâ `openai-codex/*` ise
`openclaw doctor` rotayı değiştirmek yerine uyarı verir. Bu kasıtlıdır:
`openai-codex/*` PI Codex OAuth/abonelik yolu olarak kalır ve yerel app-server
yürütmesi açık bir çalışma zamanı seçimi olmaya devam eder.

## Rota haritası

Yapılandırmayı değiştirmeden önce bu tabloyu kullanın:

| İstenen davranış                                   | Model referansı          | Çalışma zamanı yapılandırması          | Kimlik doğrulama/profil rotası | Beklenen durum etiketi         |
| -------------------------------------------------- | ------------------------ | -------------------------------------- | ------------------------------ | ------------------------------ |
| Yerel Codex çalışma zamanı ile ChatGPT/Codex aboneliği | `openai/gpt-*`           | `agentRuntime.id: "codex"`             | Codex OAuth veya Codex hesabı  | `Runtime: OpenAI Codex`        |
| Normal OpenClaw çalıştırıcısı üzerinden OpenAI API | `openai/gpt-*`           | atlanmış veya `runtime: "pi"`          | OpenAI API anahtarı            | `Runtime: OpenClaw Pi Default` |
| PI üzerinden ChatGPT/Codex aboneliği               | `openai-codex/gpt-*`     | atlanmış veya `runtime: "pi"`          | OpenAI Codex OAuth sağlayıcısı | `Runtime: OpenClaw Pi Default` |
| Tutucu otomatik modla karışık sağlayıcılar         | sağlayıcıya özgü referanslar | `agentRuntime.id: "auto"`           | Seçilen sağlayıcı başına       | Seçilen çalışma zamanına bağlı |
| Açık Codex ACP bağdaştırıcısı oturumu              | ACP istemine/modele bağlı | `sessions_spawn` ile `runtime: "acp"` | ACP arka uç kimlik doğrulaması | ACP görev/oturum durumu        |

Önemli ayrım sağlayıcı ile çalışma zamanı arasındadır:

- `openai-codex/*`, "PI hangi sağlayıcı/kimlik doğrulama rotasını kullansın?"
  sorusunu yanıtlar
- `agentRuntime.id: "codex"`, "bu gömülü dönüşü hangi döngü yürütsün?"
  sorusunu yanıtlar
- `/codex ...`, "bu sohbet hangi yerel Codex konuşmasını bağlasın veya
  yönetsin?" sorusunu yanıtlar
- ACP, "acpx hangi harici donanım sürecini başlatsın?" sorusunu yanıtlar

## Doğru model önekini seçin

OpenAI ailesi rotaları öneke özgüdür. Yaygın abonelik artı yerel Codex çalışma
zamanı kurulumu için `agentRuntime.id: "codex"` ile `openai/*` kullanın.
`openai-codex/*` yalnızca PI üzerinden Codex OAuth istediğinizde kullanın:

| Model referansı                              | Çalışma zamanı yolu                         | Ne zaman kullanılır                                                        |
| -------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                             | OpenClaw/PI tesisatı üzerinden OpenAI sağlayıcısı | `OPENAI_API_KEY` ile mevcut doğrudan OpenAI Platform API erişimi istediğinizde. |
| `openai-codex/gpt-5.5`                       | OpenClaw/PI üzerinden OpenAI Codex OAuth    | Varsayılan PI çalıştırıcısıyla ChatGPT/Codex abonelik kimlik doğrulaması istediğinizde. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server donanımı                  | Yerel Codex yürütmesiyle ChatGPT/Codex abonelik kimlik doğrulaması istediğinizde. |

Hesabınız bunları sunduğunda GPT-5.5 hem doğrudan OpenAI API anahtarı hem de
Codex abonelik rotalarında görünebilir. Yerel Codex çalışma zamanı için Codex
app-server donanımıyla `openai/gpt-5.5`, PI OAuth için `openai-codex/gpt-5.5`
veya doğrudan API anahtarlı trafik için Codex çalışma zamanı geçersiz kılması
olmadan `openai/gpt-5.5` kullanın.

Eski `codex/gpt-*` referansları uyumluluk takma adları olarak kabul edilmeye
devam eder. Doctor uyumluluk geçişi eski birincil çalışma zamanı referanslarını
kanonik model referanslarına yeniden yazar ve çalışma zamanı ilkesini ayrı
kaydeder; yalnızca geri dönüş amaçlı eski referanslar ise değiştirilmeden
bırakılır çünkü çalışma zamanı tüm ajan kapsayıcısı için yapılandırılır. Yeni PI
Codex OAuth yapılandırmaları `openai-codex/gpt-*` kullanmalıdır; yeni yerel
app-server donanımı yapılandırmaları `openai/gpt-*` artı
`agentRuntime.id: "codex"` kullanmalıdır.

`agents.defaults.imageModel` aynı önek ayrımını izler. Görüntü anlama OpenAI
Codex OAuth sağlayıcı yolu üzerinden çalışmalıysa `openai-codex/gpt-*` kullanın.
Görüntü anlama sınırlı bir Codex app-server dönüşü üzerinden çalışmalıysa
`codex/gpt-*` kullanın. Codex app-server modeli görüntü girdisi desteğini ilan
etmelidir; yalnızca metinli Codex modelleri medya dönüşü başlamadan önce hata
verir.

Geçerli oturum için etkili donanımı doğrulamak üzere `/status` kullanın. Seçim
şaşırtıcıysa `agents/harness` alt sistemi için hata ayıklama günlüğünü
etkinleştirin ve Gateway'in yapılandırılmış `agent harness selected` kaydını
inceleyin. Bu kayıt seçilen donanım kimliğini, seçim nedenini,
çalışma zamanı/geri dönüş ilkesini ve `auto` modunda her Plugin adayının destek
sonucunu içerir.

### Doctor uyarıları ne anlama gelir?

`openclaw doctor`, bunların tümü doğru olduğunda uyarı verir:

- paketle birlikte gelen `codex` Plugin'i etkinleştirilmiş veya izin verilmişse
- bir ajanın birincil modeli `openai-codex/*` ise
- o ajanın etkili çalışma zamanı `codex` değilse

Bu uyarı, kullanıcılar çoğu zaman "Codex Plugin etkin" ifadesinin "yerel Codex
app-server çalışma zamanı" anlamına geldiğini beklediği için vardır. OpenClaw bu
sıçramayı yapmaz. Uyarı şu anlama gelir:

- PI üzerinden ChatGPT/Codex OAuth amaçladıysanız **değişiklik gerekmez**.
- Yerel app-server yürütmesini amaçladıysanız modeli `openai/<model>` olarak
  değiştirin ve `agentRuntime.id: "codex"` ayarlayın.
- Çalışma zamanı değişikliğinden sonra mevcut oturumlar yine de `/new` veya
  `/reset` gerektirir, çünkü oturum çalışma zamanı sabitlemeleri kalıcıdır.

Donanım seçimi canlı oturum denetimi değildir. Bir gömülü dönüş çalıştığında,
OpenClaw seçilen donanım kimliğini o oturuma kaydeder ve aynı oturum kimliğindeki
sonraki dönüşlerde onu kullanmayı sürdürür. Gelecekteki oturumların başka bir
donanım kullanmasını istediğinizde `agentRuntime` yapılandırmasını veya
`OPENCLAW_AGENT_RUNTIME` değerini değiştirin; mevcut bir konuşmayı PI ile Codex
arasında değiştirmeden önce yeni bir oturum başlatmak için `/new` veya `/reset`
kullanın. Bu, tek bir konuşma dökümünün iki uyumsuz yerel oturum sistemi
üzerinden yeniden oynatılmasını önler.

Donanım sabitlemelerinden önce oluşturulmuş eski oturumlar, konuşma dökümü
geçmişleri olduğunda PI'ye sabitlenmiş kabul edilir. Yapılandırmayı
değiştirdikten sonra o konuşmayı Codex'e almak için `/new` veya `/reset`
kullanın.

`/status`, etkin model çalışma zamanını gösterir. Varsayılan PI harness
`Runtime: OpenClaw Pi Default` olarak, Codex app-server harness ise
`Runtime: OpenAI Codex` olarak görünür.

## Gereksinimler

- Birlikte gelen `codex` Plugin'i kullanılabilir olan OpenClaw.
- Codex app-server `0.125.0` veya daha yenisi. Birlikte gelen Plugin, varsayılan olarak uyumlu bir
  Codex app-server ikili dosyasını yönetir; bu nedenle `PATH` üzerindeki yerel `codex` komutları
  normal harness başlangıcını etkilemez.
- App-server sürecinde veya OpenClaw'ın Codex kimlik doğrulama köprüsünde Codex kimlik doğrulaması
  kullanılabilir olmalıdır. Yerel app-server başlatmaları, her ajan için OpenClaw tarafından yönetilen bir Codex home
  ve izole bir alt `HOME` kullanır; bu nedenle varsayılan olarak kişisel
  `~/.codex` hesabınızı, Skills'lerinizi, Plugin'lerinizi, yapılandırmanızı, thread durumunuzu veya yerel
  `$HOME/.agents/skills` öğelerini okumaz.

Plugin, eski veya sürümlenmemiş app-server el sıkışmalarını engeller. Bu, OpenClaw'ın test edildiği
protokol yüzeyinde kalmasını sağlar.

Canlı ve Docker smoke testleri için kimlik doğrulaması genellikle Codex CLI hesabından
veya bir OpenClaw `openai-codex` kimlik doğrulama profilinden gelir. Yerel stdio app-server başlatmaları,
hesap olmadığında `CODEX_API_KEY` / `OPENAI_API_KEY` değerlerine de geri dönebilir.

## Çalışma alanı bootstrap dosyaları

Codex, yerel proje-belgesi keşfi aracılığıyla `AGENTS.md` dosyasını kendisi işler. OpenClaw,
sentetik Codex proje-belgesi dosyaları yazmaz veya persona dosyaları için Codex yedek
dosya adlarına bağlı kalmaz; çünkü Codex yedekleri yalnızca
`AGENTS.md` eksik olduğunda geçerlidir.

OpenClaw çalışma alanı eşliği için Codex harness, diğer bootstrap
dosyalarını (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` ve varsa `MEMORY.md`) çözer ve bunları `thread/start` ve
`thread/resume` üzerinde Codex yapılandırma talimatları aracılığıyla iletir. Bu,
`AGENTS.md` dosyasını çoğaltmadan `SOUL.md` ve ilgili çalışma alanı persona/profil bağlamının
görünür kalmasını sağlar.

## Diğer modellerin yanına Codex ekleme

Aynı ajanın Codex ve Codex olmayan sağlayıcı modelleri arasında serbestçe geçiş yapması gerekiyorsa
`agentRuntime.id: "codex"` değerini global olarak ayarlamayın. Zorunlu bir çalışma zamanı, o ajan veya oturum için her
gömülü dönüşe uygulanır. Bu çalışma zamanı zorunluyken bir Anthropic modeli seçerseniz,
OpenClaw yine de Codex harness'i dener ve o dönüşü sessizce PI üzerinden yönlendirmek yerine kapalı şekilde başarısız olur.

Bunun yerine şu yapılardan birini kullanın:

- Codex'i `agentRuntime.id: "codex"` ile ayrılmış bir ajana koyun.
- Varsayılan ajanı normal karma sağlayıcı kullanımı için `agentRuntime.id: "auto"` ve PI fallback üzerinde tutun.
- Eski `codex/*` referanslarını yalnızca uyumluluk için kullanın. Yeni yapılandırmalar
  `openai/*` ve açık bir Codex çalışma zamanı ilkesini tercih etmelidir.

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

- Varsayılan `main` ajanı normal sağlayıcı yolunu ve PI uyumluluk fallback'ini kullanır.
- `codex` ajanı Codex app-server harness'i kullanır.
- Codex `codex` ajanı için eksik veya desteklenmiyorsa, dönüş
  sessizce PI kullanmak yerine başarısız olur.

## Ajan komut yönlendirmesi

Ajanlar, kullanıcı isteklerini yalnızca "Codex" kelimesine göre değil, niyete göre yönlendirmelidir:

| Kullanıcı şunu ister...                                | Ajan şunu kullanmalıdır...                        |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Bu sohbeti Codex'e bağla"                             | `/codex bind`                                    |
| "Codex thread'i `<id>` burada sürdür"                  | `/codex resume <id>`                             |
| "Codex thread'lerini göster"                           | `/codex threads`                                 |
| "Kötü bir Codex çalıştırması için destek raporu oluştur" | `/diagnostics [note]`                            |
| "Yalnızca bu ekli thread için Codex geri bildirimi gönder" | `/codex diagnostics [note]`                      |
| "ChatGPT/Codex aboneliğimi Codex çalışma zamanı ile kullan" | `openai/*` artı `agentRuntime.id: "codex"`       |
| "ChatGPT/Codex aboneliğimi PI üzerinden kullan"        | `openai-codex/*` model refs                      |
| "Codex'i ACP/acpx üzerinden çalıştır"                  | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Claude Code/Gemini/OpenCode/Cursor'ı bir thread içinde başlat" | ACP/acpx, `/codex` değil ve yerel alt ajanlar değil |

OpenClaw, ACP spawn rehberliğini ajanlara yalnızca ACP etkin,
dağıtılabilir ve yüklenmiş bir çalışma zamanı backend'i tarafından destekleniyorsa duyurur. ACP kullanılamıyorsa,
sistem prompt'u ve Plugin Skills'leri ajana ACP yönlendirmesi öğretmemelidir.

## Yalnızca Codex dağıtımları

Her gömülü ajan dönüşünün Codex kullandığını kanıtlamanız gerektiğinde Codex harness'i zorunlu kılın.
Açık Plugin çalışma zamanları kapalı şekilde başarısız olur ve PI üzerinden asla sessizce yeniden denenmez:

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

Ortam override'ı:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Codex zorunlu kılındığında, Codex Plugin devre dışıysa, app-server çok eskiyse
veya app-server başlatılamıyorsa OpenClaw erken başarısız olur.

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

Ajanlar ve modeller arasında geçiş yapmak için normal oturum komutlarını kullanın. `/new` yeni bir
OpenClaw oturumu oluşturur ve Codex harness, gerektiğinde yan app-server
thread'ini oluşturur veya sürdürür. `/reset`, o thread için OpenClaw oturum bağlamasını temizler
ve sonraki dönüşün harness'i mevcut yapılandırmadan yeniden çözmesine izin verir.

## Model keşfi

Varsayılan olarak Codex Plugin, kullanılabilir modelleri app-server'dan ister. Keşif
başarısız olursa veya zaman aşımına uğrarsa, şu modeller için birlikte gelen fallback kataloğunu kullanır:

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

Başlangıcın Codex'i yoklamaktan kaçınmasını ve fallback kataloğuna bağlı kalmasını istediğinizde
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

Varsayılan olarak Plugin, OpenClaw'ın yönettiği Codex ikili dosyasını yerel olarak şununla başlatır:

```bash
codex app-server --listen stdio://
```

Yönetilen ikili dosya `codex` Plugin paketiyle birlikte gönderilir. Bu, app-server sürümünü
yerel olarak kurulmuş olabilecek ayrı Codex CLI yerine birlikte gelen Plugin'e bağlı tutar.
`appServer.command` değerini yalnızca kasıtlı olarak farklı bir çalıştırılabilir dosya kullanmak istediğinizde ayarlayın.

Varsayılan olarak OpenClaw, yerel Codex harness oturumlarını YOLO modunda başlatır:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Bu, otonom Heartbeat'ler için kullanılan güvenilir yerel operatör duruşudur:
Codex, yanıtlayacak kimsenin olmadığı yerel onay prompt'larında durmadan shell ve ağ araçlarını kullanabilir.

Codex guardian tarafından incelenen onaylara dahil olmak için `appServer.mode:
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
Codex bu onay isteğini insan prompt'u yerine yerel inceleyiciye yönlendirir.
İnceleyici, Codex'in risk çerçevesini uygular ve belirli isteği onaylar veya reddeder.
YOLO modundan daha fazla koruma istediğiniz ancak yine de gözetimsiz ajanların ilerleme kaydetmesine ihtiyaç duyduğunuzda Guardian kullanın.

`guardian` ön ayarı `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` ve `sandbox: "workspace-write"` değerlerine genişler.
Tekil ilke alanları yine de `mode` değerini override eder; böylece gelişmiş dağıtımlar ön ayarı
açık seçimlerle karıştırabilir. Eski `guardian_subagent` inceleyici değeri
uyumluluk takma adı olarak hâlâ kabul edilir, ancak yeni yapılandırmalar
`auto_review` kullanmalıdır.

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

Stdio app-server başlatmaları varsayılan olarak OpenClaw'ın süreç ortamını devralır,
ancak OpenClaw, Codex app-server hesap köprüsünün sahibidir ve hem
`CODEX_HOME` hem de `HOME` değerlerini o ajanın OpenClaw durumu altındaki ajan başına dizinlere ayarlar.
Codex'in kendi skill yükleyicisi `$CODEX_HOME/skills` ve
`$HOME/.agents/skills` öğelerini okur; bu nedenle yerel app-server
başlatmaları için her iki değer de izole edilir. Bu, Codex'e özgü Skills'lerin, Plugin'lerin, yapılandırmanın, hesapların ve thread
durumunun operatörün kişisel Codex CLI home'undan sızmak yerine OpenClaw ajanı kapsamında kalmasını sağlar.

OpenClaw Plugin'leri ve OpenClaw skill snapshot'ları yine de OpenClaw'ın kendi
Plugin registry'si ve skill yükleyicisi üzerinden akar. Kişisel Codex CLI varlıkları akmaz. Bir OpenClaw ajanının parçası olması gereken
yararlı Codex CLI Skills'leriniz veya Plugin'leriniz varsa, bunları açıkça envantere alın:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex migration sağlayıcısı Skills'leri mevcut OpenClaw ajan
çalışma alanına kopyalar. Codex yerel Plugin'leri, hook'ları ve yapılandırma dosyaları otomatik olarak etkinleştirilmek yerine
manuel inceleme için raporlanır veya arşivlenir; çünkü komut çalıştırabilir,
MCP sunucuları açabilir veya kimlik bilgileri taşıyabilirler.

Kimlik doğrulaması şu sırayla seçilir:

1. Ajan için açık bir OpenClaw Codex kimlik doğrulama profili.
2. O ajanın Codex home'undaki app-server'ın mevcut hesabı.
3. Yalnızca yerel stdio app-server başlatmaları için, app-server hesabı yoksa ve OpenAI kimlik doğrulaması
   hâlâ gerekiyorsa önce `CODEX_API_KEY`, sonra
   `OPENAI_API_KEY`.

OpenClaw, ChatGPT aboneliği tarzı bir Codex kimlik doğrulama profili gördüğünde,
başlatılan Codex alt sürecinden `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini kaldırır. Bu,
Gateway düzeyindeki API anahtarlarını embeddings veya doğrudan OpenAI modelleri için kullanılabilir tutarken
yerel Codex app-server dönüşlerinin yanlışlıkla API üzerinden ücretlendirilmesini önler.
Açık Codex API anahtarı profilleri ve yerel stdio env-key fallback, devralınan alt süreç env yerine app-server
oturum açmasını kullanır. WebSocket app-server bağlantıları
Gateway env API anahtarı fallback'i almaz; açık bir kimlik doğrulama profili veya uzak
app-server'ın kendi hesabını kullanın.

Bir dağıtım ek ortam izolasyonuna ihtiyaç duyarsa, bu değişkenleri
`appServer.clearEnv` öğesine ekleyin:

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
OpenClaw, Codex’e özgü çalışma alanı işlemlerini yineleyen dinamik araçları
sunmaz: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` ve
`update_plan`. Mesajlaşma, oturumlar, medya, cron, tarayıcı, düğümler, gateway,
`heartbeat_respond` ve `web_search` gibi OpenClaw entegrasyon araçları
kullanılabilir kalır.

Desteklenen üst düzey Codex plugin alanları:

| Alan                       | Varsayılan       | Anlam                                                                                              |
| -------------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Codex app-server’a tam OpenClaw dinamik araç setini sunmak için `"openclaw-compat"` kullanın.      |
| `codexDynamicToolsExclude` | `[]`             | Codex app-server turlarından çıkarılacak ek OpenClaw dinamik araç adları.                          |

Desteklenen `appServer` alanları:

| Alan                | Varsayılan                               | Anlam                                                                                                                                                                                                                                          |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` Codex’i başlatır; `"websocket"` `url` adresine bağlanır.                                                                                                                                                                             |
| `command`           | yönetilen Codex ikilisi                  | stdio transport için çalıştırılabilir dosya. Yönetilen ikiliyi kullanmak için ayarlanmamış bırakın; yalnızca açık bir geçersiz kılma için ayarlayın.                                                                                          |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio transport için argümanlar.                                                                                                                                                                                                               |
| `url`               | ayarlanmamış                             | WebSocket app-server URL’si.                                                                                                                                                                                                                   |
| `authToken`         | ayarlanmamış                             | WebSocket transport için Bearer token.                                                                                                                                                                                                         |
| `headers`           | `{}`                                     | Ek WebSocket başlıkları.                                                                                                                                                                                                                       |
| `clearEnv`          | `[]`                                     | OpenClaw devralınan ortamını oluşturduktan sonra başlatılan stdio app-server sürecinden kaldırılan ek ortam değişkeni adları. Yerel başlatmalarda OpenClaw’ın ajan başına Codex yalıtımı için `CODEX_HOME` ve `HOME` ayrılmıştır.              |
| `requestTimeoutMs`  | `60000`                                  | app-server denetim düzlemi çağrıları için zaman aşımı.                                                                                                                                                                                         |
| `mode`              | `"yolo"`                                 | YOLO veya guardian tarafından incelenen yürütme için ön ayar.                                                                                                                                                                                  |
| `approvalPolicy`    | `"never"`                                | İş parçacığı başlatma/sürdürme/tur için gönderilen yerel Codex onay ilkesi.                                                                                                                                                                   |
| `sandbox`           | `"danger-full-access"`                   | İş parçacığı başlatma/sürdürme için gönderilen yerel Codex sandbox modu.                                                                                                                                                                      |
| `approvalsReviewer` | `"user"`                                 | Codex’in yerel onay istemlerini incelemesine izin vermek için `"auto_review"` kullanın. `guardian_subagent` eski bir takma ad olarak kalır.                                                                                                    |
| `serviceTier`       | ayarlanmamış                             | İsteğe bağlı Codex app-server hizmet katmanı: `"fast"`, `"flex"` veya `null`. Geçersiz eski değerler yok sayılır.                                                                                                                             |

OpenClaw’a ait dinamik araç çağrıları `appServer.requestTimeoutMs` değerinden
bağımsız olarak sınırlandırılır: her Codex `item/tool/call` isteği 30 saniye
içinde bir OpenClaw yanıtı almalıdır. Zaman aşımında OpenClaw, desteklendiği
yerlerde araç sinyalini iptal eder ve Codex’e başarısız bir dinamik araç yanıtı
döndürür; böylece oturumu `processing` durumunda bırakmak yerine tur devam
edebilir.

OpenClaw, Codex tur kapsamlı bir app-server isteğine yanıt verdikten sonra,
harness ayrıca Codex’in yerel turu `turn/completed` ile bitirmesini bekler. Bu
yanıttan sonra app-server 60 saniye boyunca sessiz kalırsa OpenClaw, en iyi
çabayla Codex turunu keser, tanılama amaçlı bir zaman aşımı kaydeder ve takip
sohbet iletilerinin bayat bir yerel turun arkasında kuyruğa alınmaması için
OpenClaw oturum şeridini serbest bırakır.

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
Yinelenebilir dağıtımlar için yapılandırma tercih edilir, çünkü plugin
davranışını Codex harness kurulumunun geri kalanıyla aynı incelenen dosyada
tutar.

## Bilgisayar kullanımı

Computer Use kendi kurulum kılavuzunda ele alınır:
[Codex Computer Use](/tr/plugins/codex-computer-use).

Kısa sürüm: OpenClaw masaüstü denetim uygulamasını vendorizasyonla dahil etmez
veya masaüstü eylemlerini kendisi yürütmez. Codex app-server’ı hazırlar,
`computer-use` MCP sunucusunun kullanılabilir olduğunu doğrular ve ardından
Codex modu turları sırasında yerel MCP araç çağrılarını Codex’in işlemesine izin
verir.

Codex marketplace akışının dışında doğrudan TryCua sürücü erişimi için
`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` ile
`cua-driver mcp` kaydedin. Codex’e ait Computer Use ile doğrudan MCP kaydı
arasındaki ayrım için [Codex Computer Use](/tr/plugins/codex-computer-use)
bölümüne bakın.

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

Kurulum komut yüzeyinden denetlenebilir veya kurulabilir:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use macOS’e özeldir ve Codex MCP sunucusunun uygulamaları denetleyebilmesi
için yerel işletim sistemi izinleri gerektirebilir. `computerUse.enabled` true
ise ve MCP sunucusu kullanılamıyorsa, Codex modu turları yerel Computer Use
araçları olmadan sessizce çalışmak yerine iş parçacığı başlamadan önce başarısız
olur. Marketplace seçenekleri, uzak katalog sınırları, durum nedenleri ve sorun
giderme için [Codex Computer Use](/tr/plugins/codex-computer-use) bölümüne bakın.

`computerUse.autoInstall` true olduğunda, Codex henüz yerel bir marketplace
keşfetmemişse OpenClaw standart paketli Codex Desktop marketplace’ini
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` konumundan
kaydedebilir. Çalışma zamanı veya Computer Use yapılandırmasını değiştirdikten
sonra mevcut oturumların eski bir PI ya da Codex iş parçacığı bağlamasını
korumaması için `/new` veya `/reset` kullanın.

## Yaygın tarifler

Varsayılan stdio transport ile yerel Codex:

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

Açık başlıklarla uzak app-server:

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
Codex iş parçacığına eklendiğinde, sonraki tur geçerli olarak seçilmiş OpenAI
modelini, sağlayıcıyı, onay ilkesini, sandbox’ı ve hizmet katmanını app-server’a
yeniden gönderir. `openai/gpt-5.5` modelinden `openai/gpt-5.2` modeline geçmek,
iş parçacığı bağlamasını korur ancak Codex’ten yeni seçilen modelle devam
etmesini ister.

## Codex komutu

Paketli plugin, `/codex` komutunu yetkili bir eğik çizgi komutu olarak kaydeder.
Geneldir ve OpenClaw metin komutlarını destekleyen her kanalda çalışır.

Yaygın biçimler:

- `/codex status` canlı app-server bağlantısını, modelleri, hesabı, oran sınırlarını, MCP sunucularını ve Skills’i gösterir.
- `/codex models` canlı Codex app-server modellerini listeler.
- `/codex threads [filter]` son Codex iş parçacıklarını listeler.
- `/codex resume <thread-id>` geçerli OpenClaw oturumunu mevcut bir Codex iş parçacığına ekler.
- `/codex compact` Codex app-server’dan ekli iş parçacığını sıkıştırmasını ister.
- `/codex review` ekli iş parçacığı için Codex yerel incelemesini başlatır.
- `/codex diagnostics [note]` ekli iş parçacığı için Codex tanılama geri bildirimi göndermeden önce sorar.
- `/codex computer-use status` yapılandırılmış Computer Use plugin’ini ve MCP sunucusunu denetler.
- `/codex computer-use install` yapılandırılmış Computer Use plugin’ini kurar ve MCP sunucularını yeniden yükler.
- `/codex account` hesap ve oran sınırı durumunu gösterir.
- `/codex mcp` Codex app-server MCP sunucusu durumunu listeler.
- `/codex skills` Codex app-server Skills’i listeler.

### Yaygın hata ayıklama iş akışı

Codex destekli bir ajan Telegram, Discord, Slack veya başka bir kanalda
beklenmedik bir şey yaptığında, sorunun gerçekleştiği konuşmayla başlayın:

1. Gördüğünüz şeyi açıklayan `/diagnostics bad tool choice after image upload` komutunu veya başka bir kısa notu çalıştırın.
2. diagnostics isteğini bir kez onaylayın. Onay, yerel Gateway diagnostics zip dosyasını oluşturur ve oturum Codex harness kullandığı için ilgili Codex geri bildirim paketini de OpenAI sunucularına gönderir.
3. Tamamlanan diagnostics yanıtını hata raporuna veya destek ileti dizisine kopyalayın. Bu yanıt yerel paket yolunu, gizlilik özetini, OpenClaw oturum kimliklerini, Codex ileti dizisi kimliklerini ve her Codex ileti dizisi için bir `Inspect locally` satırını içerir.
4. Çalıştırmayı kendiniz hata ayıklamak istiyorsanız, yazdırılan `Inspect locally` komutunu bir terminalde çalıştırın. Komut `codex resume <thread-id>` gibi görünür ve konuşmayı inceleyebilmeniz, yerelde sürdürebilmeniz veya Codex'e neden belirli bir aracı ya da planı seçtiğini sorabilmeniz için yerel Codex ileti dizisini açar.

`/codex diagnostics [note]` komutunu yalnızca tam OpenClaw Gateway diagnostics paketi olmadan, şu anda bağlı ileti dizisi için özellikle Codex geri bildirim yüklemesini istediğinizde kullanın. Çoğu destek raporu için `/diagnostics [note]` daha iyi bir başlangıç noktasıdır çünkü yerel Gateway durumunu ve Codex ileti dizisi kimliklerini tek yanıtta birbirine bağlar. Tam gizlilik modeli ve grup sohbeti davranışı için [Diagnostics export](/tr/gateway/diagnostics) bölümüne bakın.

Çekirdek OpenClaw ayrıca genel Gateway diagnostics komutu olarak yalnızca sahiplerin kullanabildiği `/diagnostics [note]` komutunu sunar. Onay istemi hassas veri ön bilgisini gösterir, [Diagnostics Export](/tr/gateway/diagnostics) bağlantısını verir ve her seferinde açık exec onayı üzerinden `openclaw gateway diagnostics export --json` ister. Diagnostics için tümüne izin veren bir kuralla onay vermeyin. Onaydan sonra OpenClaw, yerel paket yolunu ve manifest özetini içeren yapıştırılabilir bir rapor gönderir. Etkin OpenClaw oturumu Codex harness kullanıyorsa, aynı onay ilgili Codex geri bildirim paketlerinin OpenAI sunucularına gönderilmesine de yetki verir. Onay istemi Codex geri bildiriminin gönderileceğini söyler, ancak onaydan önce Codex oturum veya ileti dizisi kimliklerini listelemez.

`/diagnostics` bir grup sohbetinde bir sahip tarafından çağrılırsa OpenClaw paylaşılan kanalı temiz tutar: grup yalnızca kısa bir bildirim alırken diagnostics ön bilgisi, onay istemleri ve Codex oturum/ileti dizisi kimlikleri özel onay rotası üzerinden sahibe gönderilir. Özel sahip rotası yoksa OpenClaw grup isteğini reddeder ve sahibin bunu bir DM üzerinden çalıştırmasını ister.

Onaylanmış Codex yüklemesi Codex app-server `feedback/upload` çağrısını yapar ve app-server'dan, mevcut olduğunda listelenen her ileti dizisi ve oluşturulan Codex alt ileti dizileri için günlükleri dahil etmesini ister. Yükleme, Codex'in normal geri bildirim yolu üzerinden OpenAI sunucularına gider; ilgili app-server'da Codex geri bildirimi devre dışıysa komut app-server hatasını döndürür. Tamamlanan diagnostics yanıtı, gönderilen ileti dizileri için kanalları, OpenClaw oturum kimliklerini, Codex ileti dizisi kimliklerini ve yerel `codex resume <thread-id>` komutlarını listeler. Onayı reddeder veya yok sayarsanız OpenClaw bu Codex kimliklerini yazdırmaz. Bu yükleme yerel Gateway diagnostics dışa aktarımının yerine geçmez.

`/codex resume`, harness'ın normal dönüşlerde kullandığı aynı sidecar bağlama dosyasını yazar. Bir sonraki mesajda OpenClaw bu Codex ileti dizisini sürdürür, o anda seçili OpenClaw modelini app-server'a geçirir ve genişletilmiş geçmişi etkin tutar.

### CLI'dan bir Codex ileti dizisini inceleme

Hatalı bir Codex çalıştırmasını anlamanın en hızlı yolu çoğu zaman yerel Codex ileti dizisini doğrudan açmaktır:

```sh
codex resume <thread-id>
```

Bunu bir kanal konuşmasında hata fark ettiğinizde ve sorunlu Codex oturumunu incelemek, yerelde sürdürmek veya Codex'e neden belirli bir araç ya da akıl yürütme seçimi yaptığını sormak istediğinizde kullanın. En kolay yol genellikle önce `/diagnostics [note]` çalıştırmaktır: onayladıktan sonra tamamlanan rapor her Codex ileti dizisini listeler ve örneğin `codex resume <thread-id>` şeklinde bir `Inspect locally` komutu yazdırır. Bu komutu doğrudan bir terminale kopyalayabilirsiniz.

Ayrıca mevcut sohbet için `/codex binding` veya son Codex app-server ileti dizileri için `/codex threads [filter]` üzerinden bir ileti dizisi kimliği alabilir, ardından kabuğunuzda aynı `codex resume` komutunu çalıştırabilirsiniz.

Komut yüzeyi Codex app-server `0.125.0` veya daha yenisini gerektirir. Gelecekteki veya özel bir app-server ilgili JSON-RPC yöntemini sunmuyorsa, tekil kontrol yöntemleri `unsupported by this Codex app-server` olarak bildirilir.

## Hook sınırları

Codex harness üç hook katmanına sahiptir:

| Katman                                | Sahip                    | Amaç                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin hook'ları             | OpenClaw                 | PI ve Codex harness'ları genelinde ürün/Plugin uyumluluğu.          |
| Codex app-server uzantı ara yazılımı  | OpenClaw paketli Plugin'leri | OpenClaw dinamik araçları etrafında dönüş başına adaptör davranışı. |
| Codex yerel hook'ları                 | Codex                    | Codex yapılandırmasından düşük seviyeli Codex yaşam döngüsü ve yerel araç politikası. |

OpenClaw, OpenClaw Plugin davranışını yönlendirmek için proje veya global Codex `hooks.json` dosyalarını kullanmaz. Desteklenen yerel araç ve izin köprüsü için OpenClaw, `PreToolUse`, `PostToolUse`, `PermissionRequest` ve `Stop` için ileti dizisi başına Codex yapılandırması enjekte eder. `SessionStart` ve `UserPromptSubmit` gibi diğer Codex hook'ları Codex düzeyi denetimler olarak kalır; v1 sözleşmesinde OpenClaw Plugin hook'ları olarak sunulmazlar.

OpenClaw dinamik araçları için OpenClaw, Codex çağrıyı istedikten sonra aracı yürütür; bu nedenle OpenClaw, sahip olduğu Plugin ve ara yazılım davranışını harness adaptöründe tetikler. Codex yerel araçları için kanonik araç kaydına Codex sahip olur. OpenClaw seçili olayları yansıtabilir, ancak Codex bu işlemi app-server veya yerel hook geri çağrıları üzerinden sunmadıkça yerel Codex ileti dizisini yeniden yazamaz.

Compaction ve LLM yaşam döngüsü projeksiyonları, yerel Codex hook komutlarından değil Codex app-server bildirimlerinden ve OpenClaw adaptör durumundan gelir. OpenClaw'ın `before_compaction`, `after_compaction`, `llm_input` ve `llm_output` olayları adaptör düzeyi gözlemlerdir; Codex'in dahili istek veya Compaction yüklerinin bayt bayt yakalamaları değildir.

Codex yerel `hook/started` ve `hook/completed` app-server bildirimleri, yörünge ve hata ayıklama için `codex_app_server.hook` ajan olayları olarak projekte edilir. Bunlar OpenClaw Plugin hook'larını çağırmaz.

## V1 destek sözleşmesi

Codex modu, altında farklı bir model çağrısı olan PI değildir. Codex yerel model döngüsünün daha büyük bir bölümüne sahiptir ve OpenClaw Plugin ile oturum yüzeylerini bu sınırın etrafında uyarlar.

Codex runtime v1'de desteklenenler:

| Yüzey                                         | Destek                                  | Neden                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex üzerinden OpenAI model döngüsü          | Desteklenir                             | Codex app-server OpenAI dönüşüne, yerel ileti dizisi sürdürmeye ve yerel araç devamına sahiptir.                                                                                                      |
| OpenClaw kanal yönlendirme ve teslim          | Desteklenir                             | Telegram, Discord, Slack, WhatsApp, iMessage ve diğer kanallar model runtime dışında kalır.                                                                                                           |
| OpenClaw dinamik araçları                     | Desteklenir                             | Codex bu araçları yürütmesini OpenClaw'dan ister, bu nedenle OpenClaw yürütme yolunda kalır.                                                                                                          |
| İstem ve bağlam Plugin'leri                   | Desteklenir                             | OpenClaw istem kaplamaları oluşturur ve ileti dizisini başlatmadan veya sürdürmeden önce bağlamı Codex dönüşüne projekte eder.                                                                        |
| Bağlam motoru yaşam döngüsü                   | Desteklenir                             | Birleştirme, alma veya dönüş sonrası bakım ve bağlam motoru Compaction koordinasyonu Codex dönüşleri için çalışır.                                                                                    |
| Dinamik araç hook'ları                        | Desteklenir                             | `before_tool_call`, `after_tool_call` ve araç sonucu ara yazılımı OpenClaw sahipliğindeki dinamik araçların etrafında çalışır.                                                                        |
| Yaşam döngüsü hook'ları                       | Adaptör gözlemleri olarak desteklenir   | `llm_input`, `llm_output`, `agent_end`, `before_compaction` ve `after_compaction` dürüst Codex modu yükleriyle tetiklenir.                                                                            |
| Son yanıt revizyon kapısı                     | Yerel hook relay üzerinden desteklenir  | Codex `Stop`, `before_agent_finalize` öğesine iletilir; `revise`, sonlandırmadan önce Codex'ten bir model geçişi daha ister.                                                                          |
| Yerel shell, patch ve MCP engelleme veya gözlemleme | Yerel hook relay üzerinden desteklenir | Codex `PreToolUse` ve `PostToolUse`, Codex app-server `0.125.0` veya daha yeni sürümlerde MCP yükleri dahil olmak üzere taahhüt edilmiş yerel araç yüzeyleri için iletilir. Engelleme desteklenir; argüman yeniden yazma desteklenmez. |
| Yerel izin politikası                         | Yerel hook relay üzerinden desteklenir  | Codex `PermissionRequest`, runtime bunu sunduğunda OpenClaw politikası üzerinden yönlendirilebilir. OpenClaw bir karar döndürmezse Codex normal guardian veya kullanıcı onay yolu üzerinden devam eder. |
| App-server yörünge yakalama                   | Desteklenir                             | OpenClaw, app-server'a gönderdiği isteği ve aldığı app-server bildirimlerini kaydeder.                                                                                                                |

Codex runtime v1'de desteklenmeyenler:

| Yüzey                                               | V1 sınırı                                                                                                                                       | Gelecek yol                                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Yerel araç argümanı mutasyonu                       | Codex yerel araç öncesi hook'ları engelleyebilir, ancak OpenClaw Codex'e özgü yerel araç argümanlarını yeniden yazmaz.                         | Değiştirilecek araç girdisi için Codex hook/şema desteği gerektirir.                      |
| Düzenlenebilir Codex yerel transcript geçmişi       | Kanonik yerel thread geçmişinin sahibi Codex'tir. OpenClaw bir yansımaya sahiptir ve gelecekteki bağlamı yansıtabilir, ancak desteklenmeyen iç yapılarda mutasyon yapmamalıdır. | Yerel thread düzenlemesi gerekiyorsa açık Codex app-server API'leri ekleyin.              |
| Codex yerel araç kayıtları için `tool_result_persist` | Bu hook, Codex yerel araç kayıtlarını değil, OpenClaw'ın sahip olduğu transcript yazımlarını dönüştürür.                                        | Dönüştürülmüş kayıtlar yansıtılabilir, ancak kanonik yeniden yazım Codex desteği gerektirir. |
| Zengin yerel Compaction meta verileri               | OpenClaw Compaction başlangıcını ve tamamlanmasını gözlemler, ancak kararlı bir tutulan/bırakılan listesi, token deltası veya özet yükü almaz.  | Daha zengin Codex Compaction olayları gerekir.                                            |
| Compaction müdahalesi                               | Mevcut OpenClaw Compaction hook'ları Codex modunda bildirim düzeyindedir.                                                                      | Plugin'lerin yerel Compaction'ı veto etmesi veya yeniden yazması gerekiyorsa Codex Compaction öncesi/sonrası hook'ları ekleyin. |
| Bayt bayt model API isteği yakalama                 | OpenClaw app-server isteklerini ve bildirimlerini yakalayabilir, ancak son OpenAI API isteğini Codex çekirdeği dahili olarak oluşturur.         | Codex model isteği izleme olayı veya hata ayıklama API'si gerekir.                       |

## Araçlar, medya ve Compaction

Codex harness yalnızca düşük düzeyli gömülü ajan yürütücüsünü değiştirir.

OpenClaw araç listesini oluşturmaya ve harness'ten dinamik araç sonuçları almaya devam eder. Metin, görseller, video, müzik, TTS, onaylar ve mesajlaşma aracı çıktısı normal OpenClaw teslim yolundan geçmeye devam eder.

Yerel hook relay'i bilinçli olarak geneldir, ancak v1 destek sözleşmesi OpenClaw'ın test ettiği Codex yerel araç ve izin yollarıyla sınırlıdır. Codex çalışma zamanında buna shell, patch ve MCP `PreToolUse`, `PostToolUse` ve `PermissionRequest` yükleri dahildir. Çalışma zamanı sözleşmesi adını koyana kadar gelecekteki her Codex hook olayının bir OpenClaw Plugin yüzeyi olduğunu varsaymayın.

`PermissionRequest` için OpenClaw yalnızca politika karar verdiğinde açık izin veya ret kararları döndürür. Kararsız sonuç izin değildir. Codex bunu hook kararı yok olarak değerlendirir ve kendi guardian veya kullanıcı onayı yoluna düşer.

Codex MCP araç onayı elicitation'ları, Codex `_meta.codex_approval_kind` alanını `"mcp_tool_call"` olarak işaretlediğinde OpenClaw'ın Plugin onay akışından yönlendirilir. Codex `request_user_input` istemleri kaynak sohbete geri gönderilir ve sıradaki bir sonraki takip mesajı, ek bağlam olarak yönlendirilmek yerine bu yerel sunucu isteğini yanıtlar. Diğer MCP elicitation istekleri kapalı şekilde başarısız olmaya devam eder.

Etkin çalışma kuyruğu yönlendirmesi Codex app-server `turn/steer` üzerine eşlenir. Varsayılan `messages.queue.mode: "steer"` ile OpenClaw, kuyruktaki sohbet mesajlarını yapılandırılmış sessiz pencere boyunca toplar ve varış sırasıyla tek bir `turn/steer` isteği olarak gönderir. Eski `queue` modu ayrı `turn/steer` istekleri gönderir. Codex inceleme ve manuel Compaction turn'leri aynı turn yönlendirmesini reddedebilir; bu durumda OpenClaw, seçilen mod fallback'e izin verdiğinde takip kuyruğunu kullanır. Bkz. [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

Seçilen model Codex harness kullandığında, yerel thread Compaction'ı Codex app-server'a devredilir. OpenClaw kanal geçmişi, arama, `/new`, `/reset` ve gelecekte model ya da harness değiştirme için bir transcript yansıması tutar. Yansıma, app-server bunları yaydığında kullanıcı istemini, son asistan metnini ve hafif Codex akıl yürütme ya da plan kayıtlarını içerir. Bugün OpenClaw yalnızca yerel Compaction başlangıç ve tamamlama sinyallerini kaydeder. Henüz insan tarafından okunabilir bir Compaction özeti veya Compaction sonrası Codex'in hangi girdileri tuttuğuna dair denetlenebilir bir liste sunmaz.

Kanonik yerel thread'in sahibi Codex olduğundan, `tool_result_persist` şu anda Codex yerel araç sonucu kayıtlarını yeniden yazmaz. Yalnızca OpenClaw, OpenClaw'ın sahip olduğu bir oturum transcript araç sonucu yazarken uygulanır.

Medya üretimi PI gerektirmez. Görsel, video, müzik, PDF, TTS ve medya anlama; `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` ve `messages.tts` gibi eşleşen sağlayıcı/model ayarlarını kullanmaya devam eder.

## Sorun giderme

**Codex normal bir `/model` sağlayıcısı olarak görünmüyor:** yeni yapılandırmalar için bu beklenen bir durumdur. `agentRuntime.id: "codex"` ile bir `openai/gpt-*` modeli (veya eski bir `codex/*` ref'i) seçin, `plugins.entries.codex.enabled` değerini etkinleştirin ve `plugins.allow` listesinin `codex` değerini dışlayıp dışlamadığını kontrol edin.

**OpenClaw Codex yerine PI kullanıyor:** `agentRuntime.id: "auto"`, hiçbir Codex harness çalışmayı üstlenmediğinde uyumluluk arka ucu olarak PI kullanmaya devam edebilir. Test sırasında Codex seçimini zorlamak için `agentRuntime.id: "codex"` ayarlayın. Zorlanmış Codex çalışma zamanı PI'ya geri dönmek yerine başarısız olur. Codex app-server seçildikten sonra hataları doğrudan görünür.

**App-server reddediliyor:** Codex'i, app-server handshake'inin `0.125.0` veya daha yeni sürüm bildireceği şekilde yükseltin. `0.125.0-alpha.2` veya `0.125.0+custom` gibi aynı sürüm prerelease ya da build sonekli sürümler reddedilir, çünkü OpenClaw'ın test ettiği kararlı protokol tabanı `0.125.0` sürümüdür.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs` değerini düşürün veya keşfi devre dışı bırakın.

**WebSocket taşıması hemen başarısız oluyor:** `appServer.url`, `authToken` ve uzak app-server'ın aynı Codex app-server protokol sürümünü konuştuğunu kontrol edin.

**Codex olmayan bir model PI kullanıyor:** bu, ilgili ajan için `agentRuntime.id: "codex"` zorlanmadıkça veya eski bir `codex/*` ref'i seçilmedikçe beklenen durumdur. Düz `openai/gpt-*` ve diğer sağlayıcı ref'leri `auto` modunda normal sağlayıcı yollarında kalır. `agentRuntime.id: "codex"` değerini zorlarsanız, o ajan için her gömülü turn Codex destekli bir OpenAI modeli olmalıdır.

**Computer Use kurulu ancak araçlar çalışmıyor:** yeni bir oturumdan `/codex computer-use status` komutunu kontrol edin. Bir araç `Native hook relay unavailable` bildirirse `/new` veya `/reset` kullanın; devam ederse eski yerel hook kayıtlarını temizlemek için gateway'i yeniden başlatın. `computer-use.list_apps` zaman aşımına uğrarsa Codex Computer Use veya Codex Desktop'ı yeniden başlatıp tekrar deneyin.

## İlgili

- [Ajan harness Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Ajan çalışma zamanları](/tr/concepts/agent-runtimes)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [Durum](/tr/cli/status)
- [Plugin hook'ları](/tr/plugins/hooks)
- [Yapılandırma referansı](/tr/gateway/configuration-reference)
- [Test etme](/tr/help/testing-live#live-codex-app-server-harness-smoke)
