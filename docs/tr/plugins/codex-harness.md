---
read_when:
    - Paketlenmiş Codex uygulama sunucusu düzeneğini kullanmak istiyorsunuz
    - Codex düzeneği yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex kullanılan dağıtımların PI'ye geri dönmek yerine başarısız olmasını istiyorsunuz
summary: OpenClaw gömülü aracı dönüşlerini paketlenmiş Codex app-server harness'i üzerinden çalıştırın
title: Codex düzeneği
x-i18n:
    generated_at: "2026-04-26T11:35:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf54ee2eab64e611e50605e8fef24cc840b3246d0bddc18ae03730a05848e271
    source_path: plugins/codex-harness.md
    workflow: 15
---

Paketlenmiş `codex` Plugin, OpenClaw'ın yerleşik PI düzeneği yerine
Codex uygulama sunucusu üzerinden gömülü ajan dönüşlerini çalıştırmasını sağlar.

Bunu, düşük seviyeli ajan oturumunun Codex tarafından yönetilmesini istediğinizde
kullanın: model keşfi, yerel iş parçacığı sürdürme, yerel Compaction ve uygulama
sunucusu yürütmesi.
OpenClaw ise sohbet kanallarını, oturum dosyalarını, model seçimini, araçları,
onayları, medya teslimini ve görünür transkript yansıtmasını yönetmeye devam eder.

Kendinizi konumlandırmaya çalışıyorsanız,
[Agent runtimes](/tr/concepts/agent-runtimes) ile başlayın. Kısa sürüm şu şekildedir:
`openai/gpt-5.5` model başvurusudur, `codex` çalışma zamanıdır ve Telegram,
Discord, Slack veya başka bir kanal iletişim yüzeyi olarak kalır.

## Bu Plugin neyi değiştirir

Paketlenmiş `codex` Plugin birkaç ayrı yetenek sağlar:

| Yetenek                           | Nasıl kullanılır                                 | Ne yapar                                                                    |
| --------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------- |
| Yerel gömülü çalışma zamanı       | `agentRuntime.id: "codex"`                       | OpenClaw gömülü ajan dönüşlerini Codex uygulama sunucusu üzerinden çalıştırır. |
| Yerel sohbet-kontrol komutları    | `/codex bind`, `/codex resume`, `/codex steer`, ... | Bir mesajlaşma konuşmasından Codex uygulama sunucusu iş parçacıklarını bağlar ve kontrol eder. |
| Codex uygulama sunucusu sağlayıcısı/kataloğu | `codex` iç yapıları, düzenek üzerinden sunulur | Çalışma zamanının uygulama sunucusu modellerini keşfetmesine ve doğrulamasına izin verir. |
| Codex medya-anlama yolu           | `codex/*` görüntü-modeli uyumluluk yolları       | Desteklenen görüntü anlama modelleri için sınırlandırılmış Codex uygulama sunucusu dönüşleri çalıştırır. |
| Yerel kanca aktarma               | Codex-yerel olayları etrafındaki Plugin kancaları | OpenClaw'ın desteklenen Codex-yerel araç/sonlandırma olaylarını gözlemlemesine/engellemesine izin verir. |

Plugin'i etkinleştirmek bu yetenekleri kullanılabilir hale getirir. Şunları **yapmaz**:

- her OpenAI modeli için Codex kullanmaya başlamaz
- `openai-codex/*` model başvurularını yerel çalışma zamanına dönüştürmez
- ACP/acpx'i varsayılan Codex yolu yapmaz
- zaten bir PI çalışma zamanı kaydetmiş mevcut oturumları anında değiştirmez
- OpenClaw kanal teslimini, oturum dosyalarını, auth-profile depolamasını veya
  mesaj yönlendirmesini değiştirmez

Aynı Plugin, yerel `/codex` sohbet-kontrol komut yüzeyinin de sahibidir. Eğer
Plugin etkinse ve kullanıcı sohbetten Codex iş parçacıklarını bağlamak,
sürdürmek, yönlendirmek, durdurmak veya incelemek istiyorsa, ajanlar ACP yerine
`/codex ...` tercih etmelidir. Kullanıcı ACP/acpx istediğinde veya ACP
Codex bağdaştırıcısını test ettiğinde ACP açık geri dönüş seçeneği olarak kalır.

Yerel Codex dönüşleri, herkese açık uyumluluk katmanı olarak OpenClaw Plugin
kancalarını kullanmaya devam eder. Bunlar süreç içi OpenClaw kancalarıdır,
Codex `hooks.json` komut kancaları değildir:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- yansıtılmış transkript kayıtları için `before_message_write`
- Codex `Stop` aktarımı üzerinden `before_agent_finalize`
- `agent_end`

Plugin'ler ayrıca, OpenClaw'ın aracı çalıştırmasından sonra ve sonuç Codex'e
döndürülmeden önce, OpenClaw dinamik araç sonuçlarını yeniden yazmak için
çalışma zamanından bağımsız araç-sonucu ara katmanı kaydedebilir. Bu, OpenClaw
tarafından sahip olunan transkript araç-sonucu yazımlarını dönüştüren herkese
açık `tool_result_persist` Plugin kancasından ayrıdır.

Plugin kancası anlamları için [Plugin hooks](/tr/plugins/hooks)
ve [Plugin guard behavior](/tr/tools/plugin) belgelerine bakın.

Düzenek varsayılan olarak kapalıdır. Yeni yapılandırmalar OpenAI model
başvurularını `openai/gpt-*` olarak kanonik tutmalı ve yerel uygulama sunucusu
yürütmesi istediklerinde açıkça `agentRuntime.id: "codex"` veya
`OPENCLAW_AGENT_RUNTIME=codex` zorlamalıdır. Eski `codex/*` model
başvuruları uyumluluk için hâlâ düzeneği otomatik seçer, ancak çalışma
zamanı destekli eski sağlayıcı önekleri normal model/sağlayıcı seçenekleri
olarak gösterilmez.

Eğer `codex` Plugin etkinse ancak birincil model hâlâ
`openai-codex/*` ise, `openclaw doctor` yolu değiştirmek yerine uyarı verir. Bu
kasıtlıdır: `openai-codex/*`, PI Codex OAuth/abonelik yolu olarak kalır ve
yerel uygulama sunucusu yürütmesi açık bir çalışma zamanı seçimi olarak kalır.

## Yol haritası

Yapılandırmayı değiştirmeden önce bu tabloyu kullanın:

| İstenen davranış                            | Model başvurusu            | Çalışma zamanı yapılandırması          | Plugin gereksinimi          | Beklenen durum etiketi         |
| ------------------------------------------ | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| Normal OpenClaw çalıştırıcısı üzerinden OpenAI API | `openai/gpt-*`             | atlanmış veya `runtime: "pi"`          | OpenAI sağlayıcısı          | `Runtime: OpenClaw Pi Default` |
| PI üzerinden Codex OAuth/abonelik          | `openai-codex/gpt-*`       | atlanmış veya `runtime: "pi"`          | OpenAI Codex OAuth sağlayıcısı | `Runtime: OpenClaw Pi Default` |
| Yerel Codex uygulama sunucusu gömülü dönüşleri | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | `codex` Plugin              | `Runtime: OpenAI Codex`        |
| Temkinli otomatik mod ile karışık sağlayıcılar | sağlayıcıya özgü başvurular | `agentRuntime.id: "auto"`              | İsteğe bağlı Plugin çalışma zamanları | Seçilen çalışma zamanına bağlı |
| Açık Codex ACP bağdaştırıcı oturumu        | ACP istemi/modeline bağlı  | `runtime: "acp"` ile `sessions_spawn`  | sağlıklı `acpx` arka ucu    | ACP görev/oturum durumu        |

Önemli ayrım sağlayıcı ile çalışma zamanı arasındadır:

- `openai-codex/*`, "PI hangi sağlayıcı/auth yolunu kullanmalı?" sorusuna yanıt verir
- `agentRuntime.id: "codex"`, "bu gömülü dönüşü hangi döngü yürütmeli?"
  sorusuna yanıt verir
- `/codex ...`, "bu sohbet hangi yerel Codex konuşmasını bağlamalı
  veya kontrol etmeli?" sorusuna yanıt verir
- ACP, "acpx hangi harici düzenek sürecini başlatmalı?" sorusuna yanıt verir

## Doğru model önekini seçin

OpenAI ailesi yollar öneğe özeldir. PI üzerinden Codex OAuth istediğinizde
`openai-codex/*`; doğrudan OpenAI API erişimi istediğinizde veya yerel Codex
uygulama sunucusu düzeneğini zorlarken `openai/*` kullanın:

| Model başvurusu                               | Çalışma zamanı yolu                          | Şu durumda kullanın                                                        |
| --------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenClaw/PI altyapısı üzerinden OpenAI sağlayıcısı | `OPENAI_API_KEY` ile güncel doğrudan OpenAI Platform API erişimi istiyorsunuz. |
| `openai-codex/gpt-5.5`                        | OpenClaw/PI üzerinden OpenAI Codex OAuth     | Varsayılan PI çalıştırıcısı ile ChatGPT/Codex abonelik kimlik doğrulaması istiyorsunuz. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex uygulama sunucusu düzeneği             | Gömülü ajan dönüşü için yerel Codex uygulama sunucusu yürütmesi istiyorsunuz. |

GPT-5.5 şu anda OpenClaw'da yalnızca abonelik/OAuth ile kullanılabilir.
PI OAuth için `openai-codex/gpt-5.5`, Codex uygulama sunucusu düzeneği için ise
`openai/gpt-5.5` ve `agentRuntime.id: "codex"` kullanın. `openai/gpt-5.5` için
doğrudan API anahtarı erişimi, OpenAI GPT-5.5'i genel API'de etkinleştirdiğinde
desteklenir.

Eski `codex/gpt-*` başvuruları uyumluluk takma adları olarak kabul edilmeye devam eder. Doctor
uyumluluk geçişi, eski birincil çalışma zamanı başvurularını kanonik model
başvurularına yeniden yazar ve çalışma zamanı ilkesini ayrı kaydeder; yalnızca
geri dönüş için kullanılan eski başvurular ise değiştirilmeden bırakılır çünkü
çalışma zamanı tüm ajan kapsayıcısı için yapılandırılır. Yeni PI Codex OAuth
yapılandırmaları `openai-codex/gpt-*`; yeni yerel uygulama sunucusu düzeneği
yapılandırmaları ise `openai/gpt-*` ve `agentRuntime.id: "codex"` kullanmalıdır.

`agents.defaults.imageModel` aynı önek ayrımını izler. Görüntü anlama işlemi
OpenAI Codex OAuth sağlayıcı yolu üzerinden çalışacaksa `openai-codex/gpt-*`
kullanın. Görüntü anlama işlemi sınırlandırılmış bir Codex uygulama sunucusu
dönüşü üzerinden çalışacaksa `codex/gpt-*` kullanın. Codex uygulama sunucusu
modeli görüntü girişi desteği sunduğunu belirtmelidir; yalnızca metin
destekleyen Codex modelleri medya dönüşü başlamadan önce başarısız olur.

Geçerli oturum için etkili düzeneği doğrulamak üzere `/status` kullanın. Seçim
şaşırtıcıysa `agents/harness` alt sistemi için hata ayıklama günlüklerini
etkinleştirin ve ağ geçidinin yapılandırılmış `agent harness selected` kaydını
inceleyin. Bu kayıt seçilen düzenek kimliğini, seçim nedenini, çalışma
zamanı/geri dönüş ilkesini ve `auto` modunda her Plugin adayının destek sonucunu
içerir.

### Doctor uyarıları ne anlama gelir

`openclaw doctor`, aşağıdakilerin tümü doğru olduğunda uyarı verir:

- paketlenmiş `codex` Plugin etkin veya izinli
- bir ajanın birincil modeli `openai-codex/*`
- o ajanın etkili çalışma zamanı `codex` değil

Bu uyarı vardır çünkü kullanıcılar sıkça "Codex Plugin etkin" ifadesinin
"yerel Codex uygulama sunucusu çalışma zamanı" anlamına geldiğini varsayar.
OpenClaw bu sıçramayı yapmaz. Uyarının anlamı şudur:

- PI üzerinden ChatGPT/Codex OAuth amaçladıysanız **hiçbir değişiklik gerekmez**.
- Yerel uygulama sunucusu yürütmesi amaçladıysanız modeli `openai/<model>`
  olarak değiştirin ve `agentRuntime.id: "codex"` ayarlayın.
- Mevcut oturumlar, çalışma zamanı değişikliğinden sonra hâlâ `/new` veya `/reset`
  gerektirir; çünkü oturum çalışma zamanı sabitlemeleri kalıcıdır.

Düzenek seçimi canlı oturum kontrolü değildir. Gömülü bir dönüş çalıştığında
OpenClaw seçilen düzenek kimliğini o oturuma kaydeder ve aynı oturum kimliğindeki
sonraki dönüşlerde de bunu kullanmaya devam eder. Gelecekteki oturumların başka
bir düzenek kullanmasını istediğinizde `agentRuntime` yapılandırmasını veya
`OPENCLAW_AGENT_RUNTIME` değerini değiştirin; mevcut bir konuşmayı PI ile Codex
arasında değiştirmeden önce yeni bir oturum başlatmak için `/new` veya `/reset`
kullanın. Bu, tek bir transkriptin uyumsuz iki yerel oturum sistemi üzerinden
yeniden oynatılmasını önler.

Düzenek sabitlemelerinden önce oluşturulan eski oturumlar, transkript geçmişi
oluştuktan sonra PI'ye sabitlenmiş sayılır. Yapılandırmayı değiştirdikten sonra
o konuşmayı Codex'e geçirmek için `/new` veya `/reset` kullanın.

`/status` etkili model çalışma zamanını gösterir. Varsayılan PI düzeneği
`Runtime: OpenClaw Pi Default`, Codex uygulama sunucusu düzeneği ise
`Runtime: OpenAI Codex` olarak görünür.

## Gereksinimler

- Paketlenmiş `codex` Plugin'i kullanılabilir durumda olan OpenClaw.
- Codex uygulama sunucusu `0.125.0` veya daha yeni bir sürüm. Paketlenmiş Plugin
  varsayılan olarak uyumlu bir Codex uygulama sunucusu ikilisini yönetir; bu nedenle `PATH`
  üzerindeki yerel `codex` komutları normal düzenek başlatmasını etkilemez.
- Codex auth'unun uygulama sunucusu süreci için kullanılabilir olması.

Plugin, daha eski veya sürümü belirlenmemiş uygulama sunucusu el sıkışmalarını
engeller. Bu, OpenClaw'ı test edildiği protokol yüzeyinde tutar.

Canlı ve Docker duman testlerinde auth genellikle `OPENAI_API_KEY` ile,
artı `~/.codex/auth.json` ve `~/.codex/config.toml` gibi isteğe bağlı Codex CLI
dosyalarıyla sağlanır. Yerel Codex uygulama sunucunuzun kullandığı auth
malzemesinin aynısını kullanın.

## En küçük yapılandırma

`openai/gpt-5.5` kullanın, paketlenmiş Plugin'i etkinleştirin ve `codex`
düzeneğini zorlayın:

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

`agents.defaults.model` veya bir ajan modelini
`codex/<model>` olarak ayarlayan eski yapılandırmalar, paketlenmiş `codex`
Plugin'ini hâlâ otomatik etkinleştirir. Yeni yapılandırmalar, yukarıdaki açık
`agentRuntime` girdisiyle birlikte `openai/<model>` kullanımını tercih etmelidir.

## Codex'i diğer modellerle birlikte ekleme

Aynı ajanın Codex ve Codex olmayan sağlayıcı modelleri arasında serbestçe geçiş
yapması gerekiyorsa `agentRuntime.id: "codex"` değerini genel olarak ayarlamayın.
Zorlanmış bir çalışma zamanı, o ajan veya oturum için her gömülü dönüşe
uygulanır. Bu çalışma zamanı zorlanmışken bir Anthropic modeli seçerseniz,
OpenClaw o dönüşü sessizce PI üzerinden yönlendirmek yerine yine Codex
düzeneğini dener ve kapalı şekilde başarısız olur.

Bunun yerine şu yapılardan birini kullanın:

- Codex'i `agentRuntime.id: "codex"` ile ayrılmış bir ajana yerleştirin.
- Normal karışık sağlayıcı kullanımı için varsayılan ajanı `agentRuntime.id: "auto"` ve PI geri dönüşü üzerinde tutun.
- Eski `codex/*` başvurularını yalnızca uyumluluk için kullanın. Yeni yapılandırmalar
  `openai/*` artı açık bir Codex çalışma zamanı ilkesi tercih etmelidir.

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

Bu yapıda:

- Varsayılan `main` ajanı normal sağlayıcı yolunu ve PI uyumluluk geri dönüşünü kullanır.
- `codex` ajanı Codex uygulama sunucusu düzeneğini kullanır.
- `codex` ajanı için Codex eksikse veya desteklenmiyorsa, dönüş
  sessizce PI kullanmak yerine başarısız olur.

## Ajan komut yönlendirmesi

Ajanlar kullanıcı isteklerini yalnızca "Codex" kelimesine göre değil, amaca göre yönlendirmelidir:

| Kullanıcı şunu istiyor...                                | Ajan şunu kullanmalı...                         |
| -------------------------------------------------------- | ----------------------------------------------- |
| "Bu sohbeti Codex'e bağla"                               | `/codex bind`                                   |
| "Codex iş parçacığı `<id>` burada sürdürülsün"           | `/codex resume <id>`                            |
| "Codex iş parçacıklarını göster"                         | `/codex threads`                                |
| "Bu ajan için çalışma zamanı olarak Codex kullan"        | `agentRuntime.id` için yapılandırma değişikliği |
| "Normal OpenClaw ile ChatGPT/Codex aboneliğimi kullan"   | `openai-codex/*` model başvuruları              |
| "Codex'i ACP/acpx üzerinden çalıştır"                    | ACP `sessions_spawn({ runtime: "acp", ... })`   |
| "Bir iş parçacığında Claude Code/Gemini/OpenCode/Cursor başlat" | ACP/acpx, `/codex` değil ve yerel alt-ajanlar değil |

OpenClaw, ACP başlatma rehberliğini ajanlara yalnızca ACP etkinse,
dağıtılabilirse ve yüklenmiş bir çalışma zamanı arka ucu tarafından
destekleniyorsa gösterir. ACP kullanılabilir değilse, sistem istemi ve Plugin
Skills ajanlara ACP yönlendirmesi öğretmemelidir.

## Yalnızca Codex kullanılan dağıtımlar

Her gömülü ajan dönüşünün Codex kullandığını kanıtlamanız gerektiğinde
Codex düzeneğini zorlayın. Açık Plugin çalışma zamanları varsayılan olarak PI
geri dönüşü olmadan gelir, bu yüzden `fallback: "none"` isteğe bağlıdır ancak
çoğu zaman belgelendirme açısından yararlıdır:

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

Ortam değişkeni geçersiz kılma:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Codex zorlandığında, Codex Plugin devre dışıysa, uygulama sunucusu çok eskiyse
veya uygulama sunucusu başlatılamıyorsa OpenClaw erken başarısız olur.
Yalnızca eksik düzenek seçimini PI'nin işlemesini bilerek istediğinizde
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` ayarlayın.

## Ajan başına Codex

Varsayılan ajan normal otomatik seçimi korurken bir ajanı yalnızca Codex olacak
şekilde ayarlayabilirsiniz:

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

Ajan ve model değiştirmek için normal oturum komutlarını kullanın. `/new` yeni
bir OpenClaw oturumu oluşturur ve Codex düzeneği gerektiğinde yan uygulama
sunucusu iş parçacığını oluşturur veya sürdürür. `/reset`, o iş parçacığı için
OpenClaw oturum bağını temizler ve bir sonraki dönüşün düzeneği yeniden mevcut
yapılandırmadan çözmesine izin verir.

## Model keşfi

Varsayılan olarak Codex Plugin, kullanılabilir modelleri uygulama sunucusundan
ister. Keşif başarısız olursa veya zaman aşımına uğrarsa, şu modeller için
paketlenmiş bir geri dönüş kataloğu kullanır:

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

Başlatmanın Codex'i yoklamasını önlemek ve geri dönüş kataloğuna bağlı kalmak
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

## Uygulama sunucusu bağlantısı ve ilke

Varsayılan olarak Plugin, OpenClaw'ın yönettiği yerel Codex ikilisini şu komutla başlatır:

```bash
codex app-server --listen stdio://
```

Yönetilen ikili, paketlenmiş bir Plugin çalışma zamanı bağımlılığı olarak
tanımlanır ve `codex` Plugin bağımlılıklarının geri kalanıyla birlikte
hazırlanır. Bu, uygulama sunucusu sürümünü yerelde ayrı olarak kurulu olabilecek
herhangi bir Codex CLI yerine paketlenmiş Plugin'e bağlı tutar. `appServer.command`
değerini yalnızca bilerek farklı bir yürütülebilir dosya çalıştırmak
istediğinizde ayarlayın.

Varsayılan olarak OpenClaw, yerel Codex düzenek oturumlarını YOLO modunda başlatır:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Bu, otonom Heartbeat'ler için kullanılan güvenilir
yerel operatör duruşudur: Codex, yanıtlayacak kimse olmayan yerel onay
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

Guardian modu, Codex'in yerel otomatik inceleme onay yolunu kullanır. Codex
kum havuzundan çıkmak, çalışma alanı dışına yazmak veya ağ erişimi gibi izinler
eklemek istediğinde, Codex bu onay isteğini insan istemi yerine yerel
inceleyiciye yönlendirir. İnceleyici, Codex'in risk çerçevesini uygular ve
belirli isteği onaylar veya reddeder. YOLO modundan daha fazla koruma katmanı
istediğiniz ama gözetimsiz ajanların ilerlemeye devam etmesi gerektiği
durumlarda Guardian kullanın.

`guardian` ön ayarı `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` ve `sandbox: "workspace-write"` olarak
genişler. Tekil ilke alanları yine de `mode` değerini geçersiz kılar; bu yüzden
gelişmiş dağıtımlar ön ayarı açık seçimlerle karıştırabilir. Eski
`guardian_subagent` inceleyici değeri hâlâ uyumluluk takma adı olarak kabul edilir,
ancak yeni yapılandırmalar `auto_review` kullanmalıdır.

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

Desteklenen `appServer` alanları:

| Alan                | Varsayılan                               | Anlamı                                                                                                      |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` Codex'i başlatır; `"websocket"` `url` adresine bağlanır.                                         |
| `command`           | yönetilen Codex ikilisi                  | stdio aktarımı için yürütülebilir dosya. Yönetilen ikiliyi kullanmak için bunu ayarsız bırakın; yalnızca açık bir geçersiz kılma için ayarlayın. |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio aktarımı için argümanlar.                                                                             |
| `url`               | ayarsız                                  | WebSocket uygulama sunucusu URL'si.                                                                         |
| `authToken`         | ayarsız                                  | WebSocket aktarımı için Bearer token.                                                                       |
| `headers`           | `{}`                                     | Ek WebSocket başlıkları.                                                                                    |
| `requestTimeoutMs`  | `60000`                                  | Uygulama sunucusu kontrol düzlemi çağrıları için zaman aşımı.                                               |
| `mode`              | `"yolo"`                                 | YOLO veya guardian tarafından incelenen yürütme için ön ayar.                                               |
| `approvalPolicy`    | `"never"`                                | İş parçacığı başlatma/sürdürme/dönüş sırasında gönderilen yerel Codex onay ilkesi.                         |
| `sandbox`           | `"danger-full-access"`                   | İş parçacığı başlatma/sürdürme sırasında gönderilen yerel Codex kum havuzu modu.                           |
| `approvalsReviewer` | `"user"`                                 | Codex'in yerel onay istemlerini incelemesini sağlamak için `"auto_review"` kullanın. `guardian_subagent` eski bir takma ad olarak kalır. |
| `serviceTier`       | ayarsız                                  | İsteğe bağlı Codex uygulama sunucusu hizmet katmanı: `"fast"`, `"flex"` veya `null`. Geçersiz eski değerler yok sayılır. |

Yerel testler için ortam değişkeni geçersiz kılmaları kullanılmaya devam eder:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command` ayarsız olduğunda `OPENCLAW_CODEX_APP_SERVER_BIN`,
yönetilen ikiliyi atlar.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırıldı. Bunun yerine
`plugins.entries.codex.config.appServer.mode: "guardian"` veya tek seferlik
yerel test için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın. Tekrarlanabilir
dağıtımlar için yapılandırma tercih edilir çünkü Plugin davranışını Codex
düzeneği kurulumunun geri kalanıyla aynı incelenen dosyada tutar.

## Yaygın tarifler

Varsayılan stdio aktarımı ile yerel Codex:

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

Yalnızca Codex düzeneği doğrulaması:

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
Codex iş parçacığına bağlandığında, sonraki dönüş şu anda seçili olan
OpenAI modelini, sağlayıcıyı, onay ilkesini, kum havuzunu ve hizmet katmanını
yeniden uygulama sunucusuna gönderir. `openai/gpt-5.5` modelinden `openai/gpt-5.2`
modeline geçmek iş parçacığı bağını korur, ancak Codex'ten yeni seçilen modelle
devam etmesini ister.

## Codex komutu

Paketlenmiş Plugin, yetkili bir eğik çizgi komutu olarak `/codex` kaydeder. Bu
geneldir ve OpenClaw metin komutlarını destekleyen her kanalda çalışır.

Yaygın biçimler:

- `/codex status` canlı uygulama sunucusu bağlantısını, modelleri, hesabı, hız sınırlarını, MCP sunucularını ve Skills'i gösterir.
- `/codex models` canlı Codex uygulama sunucusu modellerini listeler.
- `/codex threads [filter]` son Codex iş parçacıklarını listeler.
- `/codex resume <thread-id>` geçerli OpenClaw oturumunu mevcut bir Codex iş parçacığına bağlar.
- `/codex compact` Codex uygulama sunucusundan bağlı iş parçacığını sıkıştırmasını ister.
- `/codex review` bağlı iş parçacığı için Codex yerel incelemesini başlatır.
- `/codex account` hesap ve hız sınırı durumunu gösterir.
- `/codex mcp` Codex uygulama sunucusu MCP sunucu durumunu listeler.
- `/codex skills` Codex uygulama sunucusu Skills listesini gösterir.

`/codex resume`, düzeneğin normal dönüşler için kullandığı aynı yan bağlama
dosyasını yazar. Sonraki mesajda OpenClaw o Codex iş parçacığını sürdürür, şu
anda seçili OpenClaw modelini uygulama sunucusuna geçirir ve genişletilmiş
geçmişi etkin tutar.

Komut yüzeyi için Codex uygulama sunucusu `0.125.0` veya daha yeni sürüm gerekir. Tekil
kontrol yöntemleri, gelecekteki veya özel bir uygulama sunucusu o JSON-RPC
yöntemini sunmuyorsa `unsupported by this Codex app-server` olarak bildirilir.

## Kanca sınırları

Codex düzeneğinin üç kanca katmanı vardır:

| Katman                                | Sahibi                   | Amaç                                                                 |
| ------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| OpenClaw Plugin kancaları             | OpenClaw                 | PI ve Codex düzenekleri arasında ürün/Plugin uyumluluğu.             |
| Codex uygulama sunucusu uzantı ara katmanı | OpenClaw paketlenmiş Plugin'leri | OpenClaw dinamik araçları çevresinde dönüş başına bağdaştırıcı davranışı. |
| Codex yerel kancaları                 | Codex                    | Codex yapılandırmasından düşük seviyeli Codex yaşam döngüsü ve yerel araç ilkesi. |

OpenClaw, OpenClaw Plugin davranışını yönlendirmek için proje veya genel
Codex `hooks.json` dosyalarını kullanmaz. Desteklenen yerel araç ve izin köprüsü için
OpenClaw, iş parçacığı başına Codex yapılandırmasını `PreToolUse`, `PostToolUse`,
`PermissionRequest` ve `Stop` için enjekte eder. `SessionStart` ve
`UserPromptSubmit` gibi diğer Codex kancaları Codex düzeyi denetimler olarak
kalır; v1 sözleşmesinde OpenClaw Plugin kancaları olarak sunulmazlar.

OpenClaw dinamik araçları için Codex çağrıyı istedikten sonra OpenClaw aracı
çalıştırır; bu nedenle OpenClaw, düzenek bağdaştırıcısında sahip olduğu Plugin
ve ara katman davranışını tetikler. Codex-yerel araçlar için kanonik araç
kaydının sahibi Codex'tir. OpenClaw seçilmiş olayları yansıtabilir, ancak Codex
bu işlemi uygulama sunucusu veya yerel kanca geri çağrıları üzerinden sunmadıkça
yerel Codex iş parçacığını yeniden yazamaz.

Compaction ve LLM yaşam döngüsü izdüşümleri, yerel Codex kanca komutlarından
değil, Codex uygulama sunucusu bildirimlerinden ve OpenClaw bağdaştırıcı
durumundan gelir. OpenClaw'ın `before_compaction`, `after_compaction`,
`llm_input` ve `llm_output` olayları bağdaştırıcı düzeyi gözlemlerdir;
Codex'in dahili istek veya sıkıştırma yüklerinin bayt bayt yakalanmış halleri
değildir.

Codex yerel `hook/started` ve `hook/completed` uygulama sunucusu bildirimleri,
izleme ve hata ayıklama için `codex_app_server.hook` ajan olayları olarak
yansıtılır. Bunlar OpenClaw Plugin kancalarını çağırmaz.

## V1 destek sözleşmesi

Codex modu, altında farklı bir model çağrısı olan PI değildir. Yerel model
döngüsünün daha büyük kısmının sahibi Codex'tir ve OpenClaw kendi Plugin ve
oturum yüzeylerini bu sınır etrafında uyarlar.

Codex çalışma zamanı v1'de desteklenenler:

| Yüzey                                        | Destek                                  | Neden                                                                                                                                                                                                    |
| -------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex üzerinden OpenAI model döngüsü         | Desteklenir                             | OpenAI dönüşünün, yerel iş parçacığı sürdürmenin ve yerel araç devamlılığının sahibi Codex uygulama sunucusudur.                                                                                        |
| OpenClaw kanal yönlendirmesi ve teslimi      | Desteklenir                             | Telegram, Discord, Slack, WhatsApp, iMessage ve diğer kanallar model çalışma zamanının dışında kalır.                                                                                                    |
| OpenClaw dinamik araçları                    | Desteklenir                             | Codex bu araçların OpenClaw tarafından çalıştırılmasını ister; bu yüzden yürütme yolunda OpenClaw kalır.                                                                                                 |
| İstem ve bağlam Plugin'leri                  | Desteklenir                             | OpenClaw istem katmanlarını oluşturur ve iş parçacığını başlatmadan veya sürdürmeden önce bağlamı Codex dönüşüne yansıtır.                                                                              |
| Bağlam motoru yaşam döngüsü                  | Desteklenir                             | Birleştirme, alma veya dönüş sonrası bakım ve bağlam motoru Compaction koordinasyonu Codex dönüşleri için çalışır.                                                                                      |
| Dinamik araç kancaları                       | Desteklenir                             | `before_tool_call`, `after_tool_call` ve araç-sonucu ara katmanı, OpenClaw'ın sahip olduğu dinamik araçların etrafında çalışır.                                                                         |
| Yaşam döngüsü kancaları                      | Bağdaştırıcı gözlemleri olarak desteklenir | `llm_input`, `llm_output`, `agent_end`, `before_compaction` ve `after_compaction`, dürüst Codex modu yükleriyle tetiklenir.                                                                             |
| Nihai yanıt düzeltme geçidi                  | Yerel kanca aktarımı üzerinden desteklenir | Codex `Stop`, `before_agent_finalize` öğesine aktarılır; `revise`, sonlandırmadan önce Codex'ten bir model geçişi daha ister.                                                                           |
| Yerel shell, patch ve MCP engelle veya gözlemle | Yerel kanca aktarımı üzerinden desteklenir | Codex `PreToolUse` ve `PostToolUse`, Codex uygulama sunucusu `0.125.0` veya daha yenisinde MCP yükleri dahil işlenmiş yerel araç yüzeyleri için aktarılır. Engelleme desteklenir; argüman yeniden yazımı desteklenmez. |
| Yerel izin ilkesi                            | Yerel kanca aktarımı üzerinden desteklenir | Çalışma zamanı bunu sunduğu yerde Codex `PermissionRequest`, OpenClaw ilkesi üzerinden yönlendirilebilir. OpenClaw karar döndürmezse, Codex normal guardian veya kullanıcı onay yoluyla devam eder.     |
| Uygulama sunucusu yörünge yakalama           | Desteklenir                             | OpenClaw, uygulama sunucusuna gönderdiği isteği ve aldığı uygulama sunucusu bildirimlerini kaydeder.                                                                                                     |

Codex çalışma zamanı v1'de desteklenmeyenler:

| Yüzey                                              | V1 sınırı                                                                                                                                        | Gelecek yol                                                                                |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Yerel araç argümanı değiştirme                     | Codex yerel araç öncesi kancaları engelleyebilir, ancak OpenClaw Codex-yerel araç argümanlarını yeniden yazmaz.                                 | Değiştirilecek araç girdisi için Codex kanca/şema desteği gerekir.                         |
| Düzenlenebilir Codex-yerel transkript geçmişi      | Kanonik yerel iş parçacığı geçmişinin sahibi Codex'tir. OpenClaw bir yansının sahibidir ve gelecekteki bağlamı yansıtabilir, ancak desteklenmeyen iç yapıları değiştirmemelidir. | Yerel iş parçacığı ameliyatı gerekirse açık Codex uygulama sunucusu API'leri ekleyin.     |
| Codex-yerel araç kayıtları için `tool_result_persist` | Bu kanca Codex-yerel araç kayıtlarını değil, OpenClaw'ın sahip olduğu transkript yazımlarını dönüştürür.                                        | Dönüştürülmüş kayıtları yansıtabilir, ancak kanonik yeniden yazım için Codex desteği gerekir. |
| Zengin yerel Compaction üst verisi                 | OpenClaw Compaction başlangıcını ve tamamlanmasını gözlemler, ancak kararlı bir tutulan/atılan listesi, token deltası veya özet yükü almaz.     | Daha zengin Codex Compaction olayları gerekir.                                             |
| Compaction müdahalesi                              | Geçerli OpenClaw Compaction kancaları Codex modunda bildirim düzeyindedir.                                                                       | Plugin'lerin yerel Compaction'ı veto etmesi veya yeniden yazması gerekiyorsa Codex ön/sonrası Compaction kancaları ekleyin. |
| Bayt bayt model API isteği yakalama                | OpenClaw uygulama sunucusu isteklerini ve bildirimlerini yakalayabilir, ancak son OpenAI API isteğini dahili olarak Codex çekirdeği oluşturur.  | Bir Codex model-istek izleme olayı veya hata ayıklama API'si gerekir.                      |

## Araçlar, medya ve Compaction

Codex düzeneği yalnızca düşük seviyeli gömülü ajan yürütücüsünü değiştirir.

OpenClaw yine de araç listesini oluşturur ve düzenekten dinamik araç sonuçlarını
alır. Metin, görseller, video, müzik, TTS, onaylar ve mesajlaşma-aracı çıktısı
normal OpenClaw teslim yolu üzerinden devam eder.

Yerel kanca aktarımı bilerek geneldir, ancak v1 destek sözleşmesi OpenClaw'ın
test ettiği Codex-yerel araç ve izin yollarıyla sınırlıdır. Codex çalışma
zamanında buna shell, patch ve MCP `PreToolUse`, `PostToolUse` ve
`PermissionRequest` yükleri dahildir. Gelecekteki her Codex kanca olayının,
çalışma zamanı sözleşmesi bunu adlandırana kadar bir OpenClaw Plugin yüzeyi
olduğunu varsaymayın.

`PermissionRequest` için OpenClaw yalnızca ilke karar verdiğinde açık izin veya
ret kararları döndürür. Kararsız sonuç izin anlamına gelmez. Codex bunu kanca
kararı yokmuş gibi değerlendirir ve kendi guardian veya kullanıcı onay yoluna düşer.

Codex MCP araç onayı bilgi istemleri, Codex `_meta.codex_approval_kind`
alanını `"mcp_tool_call"` olarak işaretlediğinde OpenClaw'ın Plugin onay akışı
üzerinden yönlendirilir. Codex `request_user_input` istemleri kaynak sohbete geri
gönderilir ve sıradaki takip mesajı ek bağlam olarak yönlendirilmek yerine o
yerel sunucu isteğine yanıt verir. Diğer MCP bilgi istemi istekleri ise yine
kapalı şekilde başarısız olur.

Seçilen model Codex düzeneğini kullandığında, yerel iş parçacığı Compaction işlemi
Codex uygulama sunucusuna devredilir. OpenClaw kanal geçmişi, arama, `/new`,
`/reset` ve gelecekteki model veya düzenek değiştirme için bir transkript yansısı
tutar. Bu yansı; kullanıcı istemini, son asistan metnini ve uygulama sunucusu
bunları yaydığında hafif Codex akıl yürütme veya plan kayıtlarını içerir. Bugün
OpenClaw yalnızca yerel Compaction başlangıç ve tamamlanma sinyallerini kaydeder.
Henüz insan tarafından okunabilir bir Compaction özeti veya Codex'in
Compaction sonrasında hangi girdileri tuttuğuna dair denetlenebilir bir liste
sunmaz.

Kanonik yerel iş parçacığının sahibi Codex olduğu için `tool_result_persist`
şu anda Codex-yerel araç sonuç kayıtlarını yeniden yazmaz. Yalnızca
OpenClaw'ın sahip olduğu bir oturum transkripti araç sonucunu OpenClaw yazarken
uygulanır.

Medya üretimi PI gerektirmez. Görsel, video, müzik, PDF, TTS ve medya anlama
işlemleri `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel` ve `messages.tts` gibi eşleşen sağlayıcı/model ayarlarını kullanmaya
devam eder.

## Sorun giderme

**Codex normal bir `/model` sağlayıcısı olarak görünmüyor:** bu, yeni
yapılandırmalar için beklenen bir durumdur. `agentRuntime.id: "codex"` ile
(veya eski bir `codex/*` başvurusu ile) bir `openai/gpt-*` modeli seçin,
`plugins.entries.codex.enabled` değerini etkinleştirin ve `plugins.allow`
öğesinin `codex` öğesini dışlayıp dışlamadığını kontrol edin.

**OpenClaw, Codex yerine PI kullanıyor:** `agentRuntime.id: "auto"` hâlâ
hiçbir Codex düzeneği çalışmayı üstlenmediğinde uyumluluk arka ucu olarak PI
kullanabilir. Test sırasında Codex seçimini zorlamak için
`agentRuntime.id: "codex"` ayarlayın. Zorlanmış bir Codex çalışma zamanı,
açıkça `agentRuntime.fallback: "pi"` ayarlamadığınız sürece artık PI'ye geri
dönmek yerine başarısız olur. Codex uygulama sunucusu seçildikten sonra, onun
hataları ek geri dönüş yapılandırması olmadan doğrudan görünür.

**Uygulama sunucusu reddediliyor:** uygulama sunucusu el sıkışmasının
`0.125.0` veya daha yeni sürüm bildirmesi için Codex'i yükseltin.
`0.125.0-alpha.2` veya `0.125.0+custom` gibi aynı sürüm ön sürümleri veya
derleme sonekli sürümler reddedilir çünkü OpenClaw'ın test ettiği protokol alt
sınırı kararlı `0.125.0` sürümüdür.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs`
değerini düşürün veya keşfi devre dışı bırakın.

**WebSocket aktarımı hemen başarısız oluyor:** `appServer.url`,
`authToken` değerini ve uzak uygulama sunucusunun aynı Codex uygulama sunucusu
protokol sürümünü konuştuğunu kontrol edin.

**Codex olmayan bir model PI kullanıyor:** bu, o ajan için
`agentRuntime.id: "codex"` zorlamadıysanız veya eski bir `codex/*`
başvurusu seçmediyseniz beklenen bir durumdur. Düz `openai/gpt-*` ve diğer
sağlayıcı başvuruları `auto` modunda normal sağlayıcı yollarında kalır.
`agentRuntime.id: "codex"` zorlarsanız, o ajan için her gömülü dönüşün
Codex tarafından desteklenen bir OpenAI modeli olması gerekir.

## İlgili

- [Agent harness plugins](/tr/plugins/sdk-agent-harness)
- [Agent runtimes](/tr/concepts/agent-runtimes)
- [Model providers](/tr/concepts/model-providers)
- [OpenAI provider](/tr/providers/openai)
- [Status](/tr/cli/status)
- [Plugin hooks](/tr/plugins/hooks)
- [Configuration reference](/tr/gateway/configuration-reference)
- [Testing](/tr/help/testing-live#live-codex-app-server-harness-smoke)
