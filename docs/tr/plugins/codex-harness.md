---
read_when:
    - Paketle birlikte gelen Codex app-server test düzeneğini kullanmak istiyorsunuz
    - Codex çalıştırma ortamı yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex dağıtımlarının PI'ye geri dönmek yerine başarısız olmasını istiyorsunuz
summary: OpenClaw gömülü ajan turlarını birlikte gelen Codex app-server test düzeneği üzerinden çalıştırın
title: Codex çalıştırma altyapısı
x-i18n:
    generated_at: "2026-05-02T23:39:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ffa0cbb28422b2ed8d7c0eef6ee0222072c523d170b4b33597bb37bd3fa9700
    source_path: plugins/codex-harness.md
    workflow: 16
---

Paketle gelen `codex` Plugin'i, OpenClaw'ın yerleşik PI harness'ı yerine
Codex app-server üzerinden gömülü ajan turn'leri çalıştırmasını sağlar.

Codex'in düşük seviyeli ajan oturumunu sahiplenmesini istediğinizde bunu kullanın:
model keşfi, yerel thread sürdürme, yerel compaction ve app-server yürütmesi.
OpenClaw yine de sohbet kanallarını, oturum dosyalarını, model seçimini, araçları,
onayları, medya teslimini ve görünür transcript aynasını sahiplenir.

Bir kaynak sohbet turn'ü Codex harness'ı üzerinden çalıştığında, dağıtım açıkça
`messages.visibleReplies` yapılandırmadıysa görünür yanıtlar varsayılan olarak
OpenClaw `message` aracına gider. Ajan yine Codex turn'ünü özel olarak
bitirebilir; kanala yalnızca `message(action="send")` çağırdığında gönderi
yapar. Doğrudan sohbet final yanıtlarını eski otomatik teslim yolunda tutmak için
`messages.visibleReplies: "automatic"` ayarlayın.

Codex Heartbeat turn'leri de varsayılan olarak `heartbeat_respond` aracını alır;
böylece ajan, uyanışın sessiz kalıp kalmaması veya bildirim göndermesi gerekip
gerekmediğini final metnine bu kontrol akışını kodlamadan kaydedebilir.

Kendinizi konumlandırmaya çalışıyorsanız
[Ajan çalışma zamanları](/tr/concepts/agent-runtimes) ile başlayın. Kısa sürüm şudur:
`openai/gpt-5.5` model ref'idir, `codex` çalışma zamanıdır ve Telegram,
Discord, Slack veya başka bir kanal iletişim yüzeyi olarak kalır.

## Hızlı yapılandırma

"OpenClaw içinde Codex" isteyen çoğu kullanıcı şu rotayı ister: bir
ChatGPT/Codex aboneliğiyle oturum açın, ardından gömülü ajan turn'lerini yerel
Codex app-server çalışma zamanı üzerinden çalıştırın. Model ref'i yine
`openai/gpt-*` olarak kanonik kalır; abonelik kimlik doğrulaması bir
`openai-codex/*` model önekinden değil, Codex hesabı/profilinden gelir.

Henüz yapmadıysanız önce Codex OAuth ile oturum açın:

```bash
openclaw models auth login --provider openai-codex
```

Ardından paketle gelen `codex` Plugin'ini etkinleştirin ve Codex çalışma zamanını zorlayın:

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

Yerel Codex çalışma zamanını kastettiğinizde `openai-codex/gpt-*` kullanmayın.
Bu önek açık "PI üzerinden Codex OAuth" rotasıdır. Yapılandırma değişiklikleri
yeni veya sıfırlanmış oturumlara uygulanır; mevcut oturumlar kaydedilmiş çalışma
zamanlarını korur.

## Bu Plugin neyi değiştirir

Paketle gelen `codex` Plugin'i birkaç ayrı yetenek sağlar:

| Yetenek                           | Nasıl kullanırsınız                                | Ne yapar                                                                      |
| --------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| Yerel gömülü çalışma zamanı       | `agentRuntime.id: "codex"`                         | OpenClaw gömülü ajan turn'lerini Codex app-server üzerinden çalıştırır.       |
| Yerel sohbet-kontrol komutları    | `/codex bind`, `/codex resume`, `/codex steer`, ... | Bir mesajlaşma konuşmasından Codex app-server thread'lerini bağlar ve kontrol eder. |
| Codex app-server sağlayıcısı/kataloğu | `codex` iç yapıları, harness üzerinden sunulur  | Çalışma zamanının app-server modellerini keşfetmesini ve doğrulamasını sağlar. |
| Codex medya-anlama yolu           | `codex/*` görüntü-modeli uyumluluk yolları         | Desteklenen görüntü anlama modelleri için sınırlı Codex app-server turn'leri çalıştırır. |
| Yerel hook relay                  | Codex-yerel olaylar etrafında Plugin hook'ları     | OpenClaw'ın desteklenen Codex-yerel araç/finalizasyon olaylarını gözlemlemesini/engellemesini sağlar. |

Plugin'i etkinleştirmek bu yetenekleri kullanılabilir hale getirir. Şunları **yapmaz**:

- her OpenAI modeli için Codex kullanmaya başlamak
- `openai-codex/*` model ref'lerini yerel çalışma zamanına dönüştürmek
- ACP/acpx'i varsayılan Codex yolu yapmak
- zaten PI çalışma zamanı kaydetmiş mevcut oturumları anında değiştirmek
- OpenClaw kanal teslimini, oturum dosyalarını, auth-profile depolamasını veya
  mesaj yönlendirmesini değiştirmek

Aynı Plugin, yerel `/codex` sohbet-kontrol komut yüzeyinin de sahibidir. Plugin
etkinse ve kullanıcı sohbetten Codex thread'lerini bağlamayı, sürdürmeyi,
yönlendirmeyi, durdurmayı veya incelemeyi isterse, ajanlar ACP yerine
`/codex ...` tercih etmelidir. Kullanıcı ACP/acpx istediğinde veya ACP Codex
adaptörünü test ettiğinde ACP açık fallback olarak kalır.

Yerel Codex turn'leri, herkese açık uyumluluk katmanı olarak OpenClaw Plugin
hook'larını korur. Bunlar süreç içi OpenClaw hook'larıdır, Codex `hooks.json`
komut hook'ları değildir:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` aynalanmış transcript kayıtları için
- Codex `Stop` relay üzerinden `before_agent_finalize`
- `agent_end`

Plugin'ler, OpenClaw aracı yürüttükten sonra ve sonuç Codex'e döndürülmeden önce
OpenClaw dinamik araç sonuçlarını yeniden yazmak için çalışma zamanından bağımsız
araç-sonucu middleware'i de kaydedebilir. Bu, OpenClaw'a ait transcript
araç-sonucu yazımlarını dönüştüren herkese açık `tool_result_persist` Plugin
hook'undan ayrıdır.

Plugin hook semantiğinin kendisi için [Plugin hook'ları](/tr/plugins/hooks) ve
[Plugin guard davranışı](/tr/tools/plugin) bölümlerine bakın.

Harness varsayılan olarak kapalıdır. Yeni yapılandırmalar OpenAI model ref'lerini
`openai/gpt-*` olarak kanonik tutmalı ve yerel app-server yürütmesi istediklerinde
açıkça `agentRuntime.id: "codex"` veya `OPENCLAW_AGENT_RUNTIME=codex` zorlamalıdır.
Eski `codex/*` model ref'leri uyumluluk için hâlâ harness'ı otomatik seçer, ancak
çalışma zamanı destekli eski sağlayıcı önekleri normal model/sağlayıcı seçenekleri
olarak gösterilmez.

`codex` Plugin'i etkinse ancak birincil model hâlâ `openai-codex/*` ise,
`openclaw doctor` rotayı değiştirmek yerine uyarır. Bu kasıtlıdır:
`openai-codex/*` PI Codex OAuth/abonelik yolu olarak kalır ve yerel app-server
yürütmesi açık bir çalışma zamanı seçimi olarak kalır.

## Rota haritası

Yapılandırmayı değiştirmeden önce bu tabloyu kullanın:

| İstenen davranış                                  | Model ref'i                | Çalışma zamanı yapılandırması          | Auth/profil rotası          | Beklenen durum etiketi         |
| ------------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| Yerel Codex çalışma zamanıyla ChatGPT/Codex aboneliği | `openai/gpt-*`          | `agentRuntime.id: "codex"`             | Codex OAuth veya Codex hesabı | `Runtime: OpenAI Codex`      |
| Normal OpenClaw runner üzerinden OpenAI API       | `openai/gpt-*`             | atlanmış veya `runtime: "pi"`          | OpenAI API key              | `Runtime: OpenClaw Pi Default` |
| PI üzerinden ChatGPT/Codex aboneliği              | `openai-codex/gpt-*`       | atlanmış veya `runtime: "pi"`          | OpenAI Codex OAuth provider | `Runtime: OpenClaw Pi Default` |
| Muhafazakar otomatik modla karma sağlayıcılar     | sağlayıcıya özgü ref'ler   | `agentRuntime.id: "auto"`              | Seçilen sağlayıcı başına    | Seçilen çalışma zamanına bağlı |
| Açık Codex ACP adaptör oturumu                    | ACP prompt/model dependent | `sessions_spawn` ile `runtime: "acp"`  | ACP backend auth            | ACP görev/oturum durumu        |

Önemli ayrım sağlayıcı ile çalışma zamanı arasındadır:

- `openai-codex/*` "PI hangi sağlayıcı/auth rotasını kullanmalı?" sorusunu yanıtlar
- `agentRuntime.id: "codex"` "bu gömülü turn'ü hangi loop yürütmeli?"
  sorusunu yanıtlar
- `/codex ...` "bu sohbet hangi yerel Codex konuşmasını bağlamalı veya kontrol
  etmeli?" sorusunu yanıtlar
- ACP "acpx hangi harici harness sürecini başlatmalı?" sorusunu yanıtlar

## Doğru model önekini seçin

OpenAI ailesi rotaları öneke özgüdür. Yaygın abonelik artı yerel Codex çalışma
zamanı kurulumu için `agentRuntime.id: "codex"` ile `openai/*` kullanın.
`openai-codex/*` değerini yalnızca PI üzerinden Codex OAuth'u kasıtlı olarak
istediğinizde kullanın:

| Model ref'i                                   | Çalışma zamanı yolu                         | Ne zaman kullanılır                                                       |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenClaw/PI plumbing üzerinden OpenAI provider | `OPENAI_API_KEY` ile güncel doğrudan OpenAI Platform API erişimi istediğinizde. |
| `openai-codex/gpt-5.5`                        | OpenClaw/PI üzerinden OpenAI Codex OAuth     | Varsayılan PI runner ile ChatGPT/Codex abonelik auth'u istediğinizde.     |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness'ı                   | Yerel Codex yürütmesiyle ChatGPT/Codex abonelik auth'u istediğinizde.     |

GPT-5.5, hesabınız bunları sunduğunda hem doğrudan OpenAI API-key hem de Codex
abonelik rotalarında görünebilir. Yerel Codex çalışma zamanı için Codex
app-server harness'ı ile `openai/gpt-5.5`, PI OAuth için
`openai-codex/gpt-5.5` veya doğrudan API-key trafiği için Codex çalışma zamanı
override'ı olmadan `openai/gpt-5.5` kullanın.

Eski `codex/gpt-*` ref'leri uyumluluk takma adları olarak kabul edilmeye devam
eder. Doctor uyumluluk migrasyonu, eski birincil çalışma zamanı ref'lerini
kanonik model ref'lerine yeniden yazar ve çalışma zamanı politikasını ayrı
kaydeder; yalnızca fallback olan eski ref'ler ise değiştirilmeden bırakılır,
çünkü çalışma zamanı tüm ajan container'ı için yapılandırılır. Yeni PI Codex
OAuth yapılandırmaları `openai-codex/gpt-*` kullanmalıdır; yeni yerel app-server
harness yapılandırmaları `openai/gpt-*` artı `agentRuntime.id: "codex"` kullanmalıdır.

`agents.defaults.imageModel` aynı önek ayrımını izler. Görüntü anlama OpenAI
Codex OAuth sağlayıcı yolu üzerinden çalışacaksa `openai-codex/gpt-*` kullanın.
Görüntü anlama sınırlı bir Codex app-server turn'ü üzerinden çalışacaksa
`codex/gpt-*` kullanın. Codex app-server modeli görüntü girişi desteği ilan
etmelidir; yalnızca metin Codex modelleri medya turn'ü başlamadan önce başarısız olur.

Geçerli oturum için etkili harness'ı doğrulamak üzere `/status` kullanın. Seçim
şaşırtıcıysa `agents/harness` alt sistemi için debug logging'i etkinleştirin ve
gateway'in yapılandırılmış `agent harness selected` kaydını inceleyin. Bu kayıt
seçilen harness id'sini, seçim nedenini, çalışma zamanı/fallback politikasını ve
`auto` modunda her Plugin adayının destek sonucunu içerir.

### Doctor uyarıları ne anlama gelir

`openclaw doctor`, bunların tümü doğru olduğunda uyarır:

- paketle gelen `codex` Plugin'i etkinleştirilmiş veya izin verilmiş
- bir ajanın birincil modeli `openai-codex/*`
- o ajanın etkili çalışma zamanı `codex` değil

Bu uyarı, kullanıcıların sık sık "Codex Plugin etkin" ifadesinin "yerel Codex
app-server çalışma zamanı" anlamına geldiğini varsayması nedeniyle vardır.
OpenClaw bu sıçramayı yapmaz. Uyarının anlamı şudur:

- PI üzerinden ChatGPT/Codex OAuth amaçladıysanız **hiçbir değişiklik gerekmez**.
- Yerel app-server yürütmesi amaçladıysanız modeli `openai/<model>` olarak
  değiştirin ve `agentRuntime.id: "codex"` ayarlayın.
- Çalışma zamanı değişikliğinden sonra mevcut oturumlar yine `/new` veya
  `/reset` gerektirir, çünkü oturum çalışma zamanı pin'leri yapışkandır.

Harness seçimi canlı bir oturum kontrolü değildir. Gömülü bir turn çalıştığında,
OpenClaw seçilen harness id'sini o oturuma kaydeder ve aynı oturum id'sinde
sonraki turn'ler için onu kullanmaya devam eder. Gelecekteki oturumların başka
bir harness kullanmasını istediğinizde `agentRuntime` yapılandırmasını veya
`OPENCLAW_AGENT_RUNTIME` değerini değiştirin; mevcut bir konuşmayı PI ile Codex
arasında değiştirmeden önce yeni bir oturum başlatmak için `/new` veya `/reset`
kullanın. Bu, bir transcript'i iki uyumsuz yerel oturum sistemi üzerinden yeniden
oynatmayı önler.

Harness pin'lerinden önce oluşturulan eski oturumlar, transcript geçmişleri
olduktan sonra PI-pinned kabul edilir. Yapılandırmayı değiştirdikten sonra o
konuşmayı Codex'e geçirmek için `/new` veya `/reset` kullanın.

`/status`, etkili model çalışma zamanını gösterir. Varsayılan PI harness
`Runtime: OpenClaw Pi Default` olarak, Codex app-server harness ise
`Runtime: OpenAI Codex` olarak görünür.

## Gereksinimler

- Paketle gelen `codex` Plugin kullanılabilir olan OpenClaw.
- Codex app-server `0.125.0` veya daha yeni. Paketle gelen Plugin varsayılan olarak uyumlu bir
  Codex app-server ikilisini yönetir; bu yüzden `PATH` üzerindeki yerel `codex` komutları
  normal harness başlangıcını etkilemez.
- App-server süreci veya OpenClaw'ın Codex kimlik doğrulama köprüsü için Codex kimlik doğrulaması
  kullanılabilir olmalıdır. Yerel app-server başlatmaları, her ajan için OpenClaw tarafından yönetilen
  bir Codex ana dizini ve yalıtılmış bir alt `HOME` kullanır; bu nedenle varsayılan olarak kişisel
  `~/.codex` hesabınızı, Skills, plugins, yapılandırmanızı, thread durumunuzu veya yerel
  `$HOME/.agents/skills` dizininizi okumaz.

Plugin, daha eski veya sürümlendirilmemiş app-server el sıkışmalarını engeller. Bu, OpenClaw'ı
test edildiği protokol yüzeyinde tutar.

Canlı ve Docker smoke testleri için kimlik doğrulaması genellikle Codex CLI hesabından
veya bir OpenClaw `openai-codex` kimlik doğrulama profilinden gelir. Yerel stdio app-server başlatmaları,
hesap yoksa `CODEX_API_KEY` / `OPENAI_API_KEY` değerlerine de geri dönebilir.

## Çalışma alanı bootstrap dosyaları

Codex, yerel proje dokümanı keşfi aracılığıyla `AGENTS.md` dosyasını kendisi işler. OpenClaw,
sentetik Codex proje dokümanı dosyaları yazmaz veya persona dosyaları için Codex fallback
dosya adlarına bağlı değildir; çünkü Codex fallback değerleri yalnızca
`AGENTS.md` eksik olduğunda uygulanır.

OpenClaw çalışma alanı eşdeğerliği için Codex harness, diğer bootstrap
dosyalarını (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` ve mevcut olduğunda `MEMORY.md`) çözer ve bunları `thread/start` ve
`thread/resume` üzerinde Codex yapılandırma talimatları aracılığıyla iletir. Bu,
`AGENTS.md` çoğaltılmadan `SOUL.md` ve ilgili çalışma alanı persona/profil bağlamının
görünür kalmasını sağlar.

## Codex'i diğer modellerin yanına ekleme

Aynı ajanın Codex ve Codex olmayan sağlayıcı modelleri arasında serbestçe geçiş yapması gerekiyorsa
`agentRuntime.id: "codex"` değerini global olarak ayarlamayın. Zorlanmış bir runtime, o ajan veya oturum için
her gömülü dönüşe uygulanır. Bu runtime zorlanmışken bir Anthropic modeli seçerseniz
OpenClaw yine Codex harness'i denemeye çalışır ve bu dönüşü sessizce PI üzerinden yönlendirmek yerine
kapalı şekilde başarısız olur.

Bunun yerine şu yapılardan birini kullanın:

- Codex'i `agentRuntime.id: "codex"` ile özel bir ajana koyun.
- Normal karma sağlayıcı kullanımı için varsayılan ajanı `agentRuntime.id: "auto"` ve PI fallback üzerinde tutun.
- Eski `codex/*` referanslarını yalnızca uyumluluk için kullanın. Yeni yapılandırmalar
  `openai/*` ile birlikte açık bir Codex runtime politikasını tercih etmelidir.

Örneğin, bu varsayılan ajanı normal otomatik seçimde tutar ve
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

- Varsayılan `main` ajan, normal sağlayıcı yolunu ve PI uyumluluk fallback yolunu kullanır.
- `codex` ajanı Codex app-server harness'i kullanır.
- Codex, `codex` ajanı için eksik veya desteklenmiyorsa dönüş
  sessizce PI kullanmak yerine başarısız olur.

## Ajan komut yönlendirmesi

Ajanlar kullanıcı isteklerini yalnızca "Codex" sözcüğüne göre değil, niyete göre yönlendirmelidir:

| Kullanıcı şunu ister...                                | Ajan şunu kullanmalıdır...                       |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Bu sohbeti Codex'e bağla"                             | `/codex bind`                                    |
| "Codex thread `<id>` değerini burada sürdür"           | `/codex resume <id>`                             |
| "Codex thread'lerini göster"                           | `/codex threads`                                 |
| "Kötü bir Codex çalıştırması için destek raporu aç"    | `/diagnostics [note]`                            |
| "Yalnızca bu ekli thread için Codex geri bildirimi gönder" | `/codex diagnostics [note]`                  |
| "Codex runtime ile ChatGPT/Codex aboneliğimi kullan"   | `openai/*` artı `agentRuntime.id: "codex"`       |
| "PI üzerinden ChatGPT/Codex aboneliğimi kullan"        | `openai-codex/*` model referansları             |
| "Codex'i ACP/acpx üzerinden çalıştır"                  | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Bir thread içinde Claude Code/Gemini/OpenCode/Cursor başlat" | ACP/acpx, `/codex` değil ve yerel alt ajanlar değil |

OpenClaw, ACP spawn rehberliğini ajanlara yalnızca ACP etkinleştirilmiş,
dağıtılabilir ve yüklenmiş bir runtime backend tarafından desteklenmiş olduğunda duyurur.
ACP kullanılabilir değilse sistem prompt'u ve Plugin Skills, ajana ACP
yönlendirmesini öğretmemelidir.

## Yalnızca Codex dağıtımları

Her gömülü ajan dönüşünün Codex kullandığını kanıtlamanız gerektiğinde Codex harness'i zorlayın.
Açık Plugin runtime'ları varsayılan olarak PI fallback kullanmaz, bu yüzden
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

Codex zorlandığında, Codex Plugin devre dışıysa, app-server çok eskiyse
veya app-server başlatılamıyorsa OpenClaw erken başarısız olur. PI'nin
eksik harness seçimini işlemesini bilinçli olarak istiyorsanız yalnızca
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` ayarlayın.

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

Ajanlar ve modeller arasında geçiş yapmak için normal oturum komutlarını kullanın. `/new`, yeni bir
OpenClaw oturumu oluşturur ve Codex harness, gerektiğinde sidecar app-server
thread'ini oluşturur veya sürdürür. `/reset`, o thread için OpenClaw oturum bağını temizler
ve sonraki dönüşün harness'i mevcut yapılandırmadan yeniden çözmesine izin verir.

## Model keşfi

Varsayılan olarak Codex Plugin, kullanılabilir modelleri app-server'a sorar. Keşif
başarısız olur veya zaman aşımına uğrarsa, şu modeller için paketle gelen fallback kataloğunu kullanır:

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

Başlangıcın Codex'i yoklamaktan kaçınmasını ve fallback kataloğuna bağlı kalmasını
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

## App-server bağlantısı ve politikası

Varsayılan olarak Plugin, OpenClaw'ın yönetilen Codex ikilisini yerelde şu şekilde başlatır:

```bash
codex app-server --listen stdio://
```

Yönetilen ikili, `codex` Plugin paketiyle birlikte gönderilir. Bu, app-server sürümünü
yerelde kurulu olabilecek ayrı Codex CLI yerine paketle gelen Plugin'e bağlı tutar.
`appServer.command` değerini yalnızca bilinçli olarak farklı bir çalıştırılabilir dosya
çalıştırmak istediğinizde ayarlayın.

Varsayılan olarak OpenClaw, yerel Codex harness oturumlarını YOLO modunda başlatır:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Bu, otonom Heartbeat'ler için kullanılan güvenilir
yerel operatör duruşudur: Codex, yanıtlayacak kimsenin bulunmadığı yerel onay prompt'larında
durmadan kabuk ve ağ araçlarını kullanabilir.

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
sandbox dışına çıkmayı, çalışma alanı dışına yazmayı veya ağ erişimi gibi izinler eklemeyi istediğinde
Codex bu onay isteğini insan prompt'u yerine yerel inceleyiciye yönlendirir. İnceleyici,
Codex'in risk çerçevesini uygular ve belirli isteği onaylar veya reddeder.
YOLO modundan daha fazla koruma istediğiniz ancak gözetimsiz ajanların yine de ilerlemesi gerektiği
durumlarda Guardian kullanın.

`guardian` ön ayarı `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` ve `sandbox: "workspace-write"` değerlerine genişler.
Tekil politika alanları yine `mode` değerini geçersiz kılar; bu yüzden gelişmiş dağıtımlar
ön ayarı açık seçimlerle karıştırabilir. Daha eski `guardian_subagent` inceleyici değeri
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
ancak OpenClaw Codex app-server hesap köprüsünün sahibidir ve hem
`CODEX_HOME` hem de `HOME` değerlerini ilgili ajanın OpenClaw durumu altında ajan başına dizinlere ayarlar.
Codex'in kendi skill loader'ı `$CODEX_HOME/skills` ve
`$HOME/.agents/skills` dizinlerini okur; bu nedenle yerel app-server
başlatmaları için iki değer de yalıtılmıştır. Bu, Codex'e özgü Skills, plugins,
yapılandırma, hesaplar ve thread durumunun operatörün kişisel Codex CLI ana dizininden
sızmak yerine OpenClaw ajanı kapsamına alınmasını sağlar.

OpenClaw plugins ve OpenClaw Skill anlık görüntüleri yine OpenClaw'ın kendi
Plugin registry'si ve skill loader'ı üzerinden akar. Kişisel Codex CLI varlıkları akmaz.
Bir OpenClaw ajanının parçası olması gereken yararlı Codex CLI Skills veya plugins varsa
bunları açıkça envantere alın:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex migration sağlayıcısı Skills'i mevcut OpenClaw ajan çalışma alanına kopyalar.
Codex yerel plugins, hooks ve yapılandırma dosyaları otomatik etkinleştirilmek yerine
manuel inceleme için raporlanır veya arşivlenir; çünkü komut çalıştırabilir,
MCP sunucuları açığa çıkarabilir veya kimlik bilgileri taşıyabilirler.

Kimlik doğrulama şu sırayla seçilir:

1. Ajan için açık bir OpenClaw Codex kimlik doğrulama profili.
2. App-server'ın o ajanın Codex ana dizinindeki mevcut hesabı.
3. Yalnızca yerel stdio app-server başlatmaları için, app-server hesabı yoksa ve OpenAI kimlik doğrulaması
   hâlâ gerekiyorsa `CODEX_API_KEY`, ardından
   `OPENAI_API_KEY`.

OpenClaw, ChatGPT abonelik tarzı bir Codex kimlik doğrulama profili gördüğünde
başlatılan Codex alt sürecinden `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini kaldırır. Bu,
Gateway düzeyindeki API anahtarlarının embeddings veya doğrudan OpenAI modelleri için kullanılabilir kalmasını,
ancak yerel Codex app-server dönüşlerinin kazara API üzerinden ücretlendirilmemesini sağlar.
Açık Codex API-key profilleri ve yerel stdio env-key fallback, devralınan alt süreç ortamı yerine
app-server oturum açmasını kullanır. WebSocket app-server bağlantıları
Gateway env API-key fallback almaz; açık bir kimlik doğrulama profili veya
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

`appServer.clearEnv` yalnızca oluşturulan Codex app-server alt sürecini etkiler.

Codex dinamik araçları varsayılan olarak `native-first` profilini kullanır. Bu modda,
OpenClaw Codex'e özgü çalışma alanı işlemlerini çoğaltan dinamik araçları
sunmaz: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` ve
`update_plan`. Mesajlaşma, oturumlar, medya, cron, tarayıcı, düğümler, gateway,
`heartbeat_respond` ve `web_search` gibi OpenClaw entegrasyon araçları
kullanılabilir kalır.

Desteklenen üst düzey Codex Plugin alanları:

| Alan                       | Varsayılan      | Anlam                                                                                         |
| -------------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | OpenClaw dinamik araç kümesinin tamamını Codex app-server'a sunmak için `"openclaw-compat"` kullanın. |
| `codexDynamicToolsExclude` | `[]`             | Codex app-server dönüşlerinden çıkarılacak ek OpenClaw dinamik araç adları.                   |

Desteklenen `appServer` alanları:

| Alan                | Varsayılan                               | Anlam                                                                                                                                                                                                                                  |
| ------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` Codex'i başlatır; `"websocket"` `url` adresine bağlanır.                                                                                                                                                                     |
| `command`           | yönetilen Codex ikilisi                  | stdio taşıması için çalıştırılabilir dosya. Yönetilen ikiliyi kullanmak için ayarsız bırakın; yalnızca açık bir geçersiz kılma için ayarlayın.                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio taşıması için argümanlar.                                                                                                                                                                                                        |
| `url`               | ayarsız                                  | WebSocket app-server URL'si.                                                                                                                                                                                                           |
| `authToken`         | ayarsız                                  | WebSocket taşıması için Bearer token.                                                                                                                                                                                                  |
| `headers`           | `{}`                                     | Ek WebSocket üst bilgileri.                                                                                                                                                                                                            |
| `clearEnv`          | `[]`                                     | OpenClaw devralınan ortamını oluşturduktan sonra, oluşturulan stdio app-server sürecinden kaldırılan ek ortam değişkeni adları. `CODEX_HOME` ve `HOME`, yerel başlatmalarda OpenClaw'ın ajan başına Codex izolasyonu için ayrılmıştır. |
| `requestTimeoutMs`  | `60000`                                  | app-server control-plane çağrıları için zaman aşımı.                                                                                                                                                                                   |
| `mode`              | `"yolo"`                                 | YOLO veya guardian tarafından incelenen yürütme için ön ayar.                                                                                                                                                                          |
| `approvalPolicy`    | `"never"`                                | İş parçacığı başlatma/sürdürme/dönüş için gönderilen yerel Codex onay ilkesi.                                                                                                                                                         |
| `sandbox`           | `"danger-full-access"`                   | İş parçacığı başlatma/sürdürme için gönderilen yerel Codex sandbox modu.                                                                                                                                                              |
| `approvalsReviewer` | `"user"`                                 | Codex'in yerel onay istemlerini incelemesine izin vermek için `"auto_review"` kullanın. `guardian_subagent` eski bir takma ad olarak kalır.                                                                                            |
| `serviceTier`       | ayarsız                                  | İsteğe bağlı Codex app-server hizmet katmanı: `"fast"`, `"flex"` veya `null`. Geçersiz eski değerler yok sayılır.                                                                                                                     |

OpenClaw'a ait dinamik araç çağrıları, `appServer.requestTimeoutMs` değerinden
bağımsız olarak sınırlandırılır: her Codex `item/tool/call` isteği 30 saniye
içinde bir OpenClaw yanıtı almalıdır. Zaman aşımında, OpenClaw desteklendiği
yerlerde araç sinyalini iptal eder ve Codex'e başarısız bir dinamik araç yanıtı
döndürür; böylece dönüş, oturumu `processing` durumunda bırakmak yerine devam
edebilir.

OpenClaw, Codex dönüş kapsamlı bir app-server isteğine yanıt verdikten sonra,
harness ayrıca Codex'in yerel dönüşü `turn/completed` ile bitirmesini bekler.
app-server bu yanıttan sonra 60 saniye boyunca sessiz kalırsa, OpenClaw en iyi
çabayla Codex dönüşünü kesintiye uğratır, tanısal bir zaman aşımı kaydeder ve
takip sohbet mesajlarının eski bir yerel dönüşün arkasında kuyruğa girmemesi
için OpenClaw oturum yolunu serbest bırakır.

Yerel test için ortam geçersiz kılmaları kullanılabilir kalır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`, `appServer.command` ayarsız olduğunda yönetilen
ikiliyi atlar.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırıldı. Bunun yerine
`plugins.entries.codex.config.appServer.mode: "guardian"` kullanın veya tek
seferlik yerel test için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın.
Yapılandırma, Plugin davranışını Codex harness kurulumunun geri kalanıyla aynı
incelenmiş dosyada tuttuğu için tekrarlanabilir dağıtımlarda tercih edilir.

## Bilgisayar kullanımı

Bilgisayar Kullanımı kendi kurulum kılavuzunda ele alınır:
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use).

Kısa hali: OpenClaw masaüstü denetim uygulamasını kendi içine almaz veya
masaüstü eylemlerini kendisi yürütmez. Codex app-server'ı hazırlar,
`computer-use` MCP sunucusunun kullanılabilir olduğunu doğrular ve ardından
Codex modlu dönüşler sırasında yerel MCP araç çağrılarını Codex'in işlemesine
izin verir.

Codex marketplace akışı dışında doğrudan TryCua sürücü erişimi için
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
`computerUse.enabled` true ise ve MCP sunucusu kullanılamıyorsa, Codex modlu
dönüşler yerel Bilgisayar Kullanımı araçları olmadan sessizce çalışmak yerine
iş parçacığı başlamadan önce başarısız olur. Marketplace seçenekleri, uzak
katalog sınırları, durum nedenleri ve sorun giderme için
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use) bölümüne bakın.

`computerUse.autoInstall` true olduğunda, Codex henüz yerel bir marketplace
keşfetmemişse OpenClaw standart paketlenmiş Codex Desktop marketplace'ini
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` konumundan
kaydedebilir. Mevcut oturumların eski bir PI veya Codex iş parçacığı bağlamasını
korumaması için runtime veya Bilgisayar Kullanımı yapılandırmasını değiştirdikten
sonra `/new` veya `/reset` kullanın.

## Yaygın tarifler

Varsayılan stdio taşımalı yerel Codex:

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

Açık üst bilgili uzak app-server:

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
Codex iş parçacığına eklendiğinde, sonraki dönüş o anda seçili OpenAI modelini,
sağlayıcıyı, onay ilkesini, sandbox'ı ve hizmet katmanını app-server'a yeniden
gönderir. `openai/gpt-5.5` modelinden `openai/gpt-5.2` modeline geçmek iş
parçacığı bağlamasını korur, ancak Codex'ten yeni seçilen modelle devam etmesini
ister.

## Codex komutu

Paketlenmiş Plugin, `/codex` değerini yetkili bir eğik çizgi komutu olarak
kaydeder. Geneldir ve OpenClaw metin komutlarını destekleyen her kanalda çalışır.

Yaygın biçimler:

- `/codex status` canlı app-server bağlantısını, modelleri, hesabı, hız sınırlarını, MCP sunucularını ve skills öğelerini gösterir.
- `/codex models` canlı Codex app-server modellerini listeler.
- `/codex threads [filter]` son Codex thread’lerini listeler.
- `/codex resume <thread-id>` geçerli OpenClaw oturumunu mevcut bir Codex thread’ine bağlar.
- `/codex compact` Codex app-server’dan bağlı thread’i compact etmesini ister.
- `/codex review` bağlı thread için Codex yerel incelemesini başlatır.
- `/codex diagnostics [note]` bağlı thread için Codex tanılama geri bildirimi göndermeden önce onay ister.
- `/codex computer-use status` yapılandırılmış Computer Use Plugin’ini ve MCP sunucusunu denetler.
- `/codex computer-use install` yapılandırılmış Computer Use Plugin’ini yükler ve MCP sunucularını yeniden yükler.
- `/codex account` hesap ve hız sınırı durumunu gösterir.
- `/codex mcp` Codex app-server MCP sunucu durumunu listeler.
- `/codex skills` Codex app-server skills öğelerini listeler.

### Yaygın hata ayıklama iş akışı

Codex destekli bir ajan Telegram, Discord, Slack’te veya başka bir kanalda
beklenmedik bir şey yaptığında, sorunun yaşandığı konuşmadan başlayın:

1. `/diagnostics bad tool choice after image upload` komutunu veya gördüğünüz şeyi
   açıklayan başka bir kısa notu çalıştırın.
2. Tanılama isteğini bir kez onaylayın. Onay, yerel Gateway tanılama zip’ini
   oluşturur ve oturum Codex harness kullandığı için ilgili Codex geri bildirim
   paketini OpenAI sunucularına da gönderir.
3. Tamamlanan tanılama yanıtını hata raporuna veya destek thread’ine kopyalayın.
   Bu yanıt yerel paket yolunu, gizlilik özetini, OpenClaw oturum kimliklerini,
   Codex thread kimliklerini ve her Codex thread’i için bir `Inspect locally`
   satırını içerir.
4. Çalıştırmayı kendiniz hata ayıklamak istiyorsanız, yazdırılan `Inspect locally`
   komutunu bir terminalde çalıştırın. `codex resume <thread-id>` gibi görünür ve
   yerel Codex thread’ini açar; böylece konuşmayı inceleyebilir, yerelde devam
   ettirebilir veya Codex’e neden belirli bir aracı ya da planı seçtiğini
   sorabilirsiniz.

`/codex diagnostics [note]` komutunu yalnızca tam OpenClaw Gateway tanılama
paketi olmadan, geçerli olarak bağlı thread için özellikle Codex geri bildirim
yüklemesi istediğinizde kullanın. Çoğu destek raporu için `/diagnostics [note]`
daha iyi başlangıç noktasıdır çünkü yerel Gateway durumunu ve Codex thread
kimliklerini tek yanıtta birbirine bağlar. Tam gizlilik modeli ve grup sohbeti
davranışı için [Tanılama dışa aktarma](/tr/gateway/diagnostics) bölümüne bakın.

Çekirdek OpenClaw ayrıca genel Gateway tanılama komutu olarak yalnızca sahiplerin
kullanabildiği `/diagnostics [note]` komutunu sunar. Onay istemi hassas veri
önsözünü gösterir, [Tanılama Dışa Aktarma](/tr/gateway/diagnostics) bağlantısını
verir ve her seferinde açık exec onayı üzerinden
`openclaw gateway diagnostics export --json` ister. Tanılamayı tümüne izin veren
bir kuralla onaylamayın. Onaydan sonra OpenClaw, yerel paket yolu ve manifest
özetiyle yapıştırılabilir bir rapor gönderir. Etkin OpenClaw oturumu Codex
harness kullandığında, aynı onay ilgili Codex geri bildirim paketlerinin OpenAI
sunucularına gönderilmesine de izin verir. Onay istemi Codex geri bildiriminin
gönderileceğini söyler, ancak onaydan önce Codex oturum veya thread kimliklerini
listelemez.

`/diagnostics` bir grup sohbetinde bir sahip tarafından çağrılırsa OpenClaw
paylaşılan kanalı temiz tutar: grup yalnızca kısa bir bildirim alırken tanılama
önsözü, onay istemleri ve Codex oturum/thread kimlikleri özel onay rotası
üzerinden sahibe gönderilir. Özel sahip rotası yoksa OpenClaw grup isteğini
reddeder ve sahibin bunu bir DM’den çalıştırmasını ister.

Onaylanan Codex yüklemesi Codex app-server `feedback/upload` çağrısı yapar ve
app-server’dan, kullanılabilir olduğunda listelenen her thread ve oluşturulan
Codex alt thread’leri için günlükleri eklemesini ister. Yükleme Codex’in normal
geri bildirim yolu üzerinden OpenAI sunucularına gider; o app-server’da Codex
geri bildirimi devre dışıysa komut app-server hatasını döndürür. Tamamlanan
tanılama yanıtı gönderilen thread’ler için kanalları, OpenClaw oturum kimliklerini,
Codex thread kimliklerini ve yerel `codex resume <thread-id>` komutlarını listeler.
Onayı reddeder veya yok sayarsanız OpenClaw bu Codex kimliklerini yazdırmaz. Bu
yükleme yerel Gateway tanılama dışa aktarımının yerine geçmez.

`/codex resume`, harness’ın normal turlar için kullandığı aynı sidecar bağlama
dosyasını yazar. Bir sonraki mesajda OpenClaw bu Codex thread’ini sürdürür,
geçerli olarak seçili OpenClaw modelini app-server’a iletir ve genişletilmiş
geçmişi etkin tutar.

### CLI’dan bir Codex thread’ini inceleme

Kötü bir Codex çalıştırmasını anlamanın en hızlı yolu çoğu zaman yerel Codex
thread’ini doğrudan açmaktır:

```sh
codex resume <thread-id>
```

Bunu bir kanal konuşmasında hata fark ettiğinizde ve sorunlu Codex oturumunu
incelemek, yerelde devam ettirmek veya Codex’e neden belirli bir araç ya da
akıl yürütme seçimi yaptığını sormak istediğinizde kullanın. En kolay yol
genellikle önce `/diagnostics [note]` çalıştırmaktır: onayladıktan sonra
tamamlanan rapor her Codex thread’ini listeler ve örneğin
`codex resume <thread-id>` şeklinde bir `Inspect locally` komutu yazdırır. Bu
komutu doğrudan bir terminale kopyalayabilirsiniz.

Geçerli sohbet için `/codex binding` komutundan veya son Codex app-server
thread’leri için `/codex threads [filter]` komutundan da bir thread kimliği alıp
ardından kabuğunuzda aynı `codex resume` komutunu çalıştırabilirsiniz.

Komut yüzeyi Codex app-server `0.125.0` veya daha yenisini gerektirir. Gelecekteki
veya özel bir app-server ilgili JSON-RPC yöntemini sunmuyorsa tekil denetim
yöntemleri `unsupported by this Codex app-server` olarak raporlanır.

## Hook sınırları

Codex harness üç hook katmanına sahiptir:

| Katman                                | Sahip                    | Amaç                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin hook’ları             | OpenClaw                 | PI ve Codex harness’ları genelinde ürün/Plugin uyumluluğu.          |
| Codex app-server extension middleware | OpenClaw paketli Plugin’ler | OpenClaw dinamik araçları çevresinde tur başına adaptör davranışı. |
| Codex yerel hook’ları                 | Codex                    | Codex yapılandırmasından düşük düzey Codex yaşam döngüsü ve yerel araç ilkesi. |

OpenClaw, OpenClaw Plugin davranışını yönlendirmek için proje veya genel Codex
`hooks.json` dosyalarını kullanmaz. Desteklenen yerel araç ve izin köprüsü için
OpenClaw, `PreToolUse`, `PostToolUse`, `PermissionRequest` ve `Stop` için thread
başına Codex yapılandırması enjekte eder. `SessionStart` ve `UserPromptSubmit`
gibi diğer Codex hook’ları Codex düzeyi denetimler olarak kalır; v1 sözleşmesinde
OpenClaw Plugin hook’ları olarak sunulmazlar.

OpenClaw dinamik araçları için OpenClaw, Codex çağrıyı istedikten sonra aracı
çalıştırır; bu nedenle OpenClaw, sahip olduğu Plugin ve middleware davranışını
harness adaptöründe tetikler. Codex yerel araçları için kanonik araç kaydının
sahibi Codex’tir. OpenClaw seçili olayları yansıtabilir, ancak Codex bu işlemi
app-server veya yerel hook callback’leri üzerinden sunmadığı sürece yerel Codex
thread’ini yeniden yazamaz.

Compaction ve LLM yaşam döngüsü projeksiyonları yerel Codex hook komutlarından
değil, Codex app-server bildirimlerinden ve OpenClaw adaptör durumundan gelir.
OpenClaw’ın `before_compaction`, `after_compaction`, `llm_input` ve `llm_output`
olayları adaptör düzeyi gözlemlerdir; Codex’in dahili istek veya Compaction
yüklerinin bayt bayt yakalanmış halleri değildir.

Codex yerel `hook/started` ve `hook/completed` app-server bildirimleri, yörünge ve
hata ayıklama için `codex_app_server.hook` ajan olayları olarak yansıtılır.
Bunlar OpenClaw Plugin hook’larını çağırmaz.

## V1 destek sözleşmesi

Codex modu, altında farklı bir model çağrısı bulunan PI değildir. Codex yerel
model döngüsünün daha fazlasına sahiptir ve OpenClaw Plugin ve oturum yüzeylerini
bu sınırın etrafında uyarlar.

Codex runtime v1’de desteklenenler:

| Yüzey                                         | Destek                                  | Neden                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex üzerinden OpenAI model döngüsü          | Desteklenir                             | Codex app-server OpenAI turuna, yerel thread sürdürmeye ve yerel araç devamına sahiptir.                                                                                                             |
| OpenClaw kanal yönlendirme ve teslim          | Desteklenir                             | Telegram, Discord, Slack, WhatsApp, iMessage ve diğer kanallar model runtime dışında kalır.                                                                                                          |
| OpenClaw dinamik araçları                     | Desteklenir                             | Codex bu araçları çalıştırmasını OpenClaw’dan ister, bu nedenle OpenClaw yürütme yolunda kalır.                                                                                                      |
| Prompt ve bağlam Plugin’leri                  | Desteklenir                             | OpenClaw prompt katmanları oluşturur ve thread’i başlatmadan veya sürdürmeden önce bağlamı Codex turuna projekte eder.                                                                               |
| Bağlam motoru yaşam döngüsü                   | Desteklenir                             | Birleştirme, içe alma veya tur sonrası bakım ve bağlam motoru Compaction koordinasyonu Codex turları için çalışır.                                                                                  |
| Dinamik araç hook’ları                        | Desteklenir                             | `before_tool_call`, `after_tool_call` ve araç sonucu middleware’i OpenClaw’a ait dinamik araçların çevresinde çalışır.                                                                               |
| Yaşam döngüsü hook’ları                       | Adaptör gözlemleri olarak desteklenir   | `llm_input`, `llm_output`, `agent_end`, `before_compaction` ve `after_compaction` dürüst Codex modu yükleriyle tetiklenir.                                                                           |
| Son yanıt revizyon kapısı                     | Yerel hook aktarımı üzerinden desteklenir | Codex `Stop`, `before_agent_finalize` öğesine aktarılır; `revise`, sonlandırmadan önce Codex’ten bir model geçişi daha ister.                                                                       |
| Yerel shell, patch ve MCP engelleme veya gözlem | Yerel hook aktarımı üzerinden desteklenir | Codex `PreToolUse` ve `PostToolUse`, Codex app-server `0.125.0` veya daha yenisindeki MCP yükleri dahil olmak üzere commit edilmiş yerel araç yüzeyleri için aktarılır. Engelleme desteklenir; argüman yeniden yazma desteklenmez. |
| Yerel izin ilkesi                             | Yerel hook aktarımı üzerinden desteklenir | Codex `PermissionRequest`, runtime bunu sunduğunda OpenClaw ilkesi üzerinden yönlendirilebilir. OpenClaw karar döndürmezse Codex normal guardian veya kullanıcı onay yolundan devam eder.           |
| App-server yörünge yakalama                   | Desteklenir                             | OpenClaw app-server’a gönderdiği isteği ve aldığı app-server bildirimlerini kaydeder.                                                                                                                |

Codex runtime v1’de desteklenmeyenler:

| Yüzey                                             | V1 sınırı                                                                                                                                     | Gelecek yol                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Yerel araç argümanı mutasyonu                       | Codex yerel ön araç hook'ları engelleyebilir, ancak OpenClaw Codex'e özgü yerel araç argümanlarını yeniden yazmaz.                                               | Değiştirilecek araç girdisi için Codex hook/şema desteği gerekir.                            |
| Düzenlenebilir Codex yerel transcript geçmişi            | Codex kurallı yerel thread geçmişinin sahibidir. OpenClaw bir yansının sahibidir ve gelecekteki bağlamı yansıtabilir, ancak desteklenmeyen iç yapıları mutasyona uğratmamalıdır. | Yerel thread üzerinde cerrahi müdahale gerekiyorsa açık Codex app-server API'leri ekleyin.                    |
| Codex yerel araç kayıtları için `tool_result_persist` | Bu hook, Codex yerel araç kayıtlarını değil, OpenClaw'a ait transcript yazımlarını dönüştürür.                                                           | Dönüştürülmüş kayıtlar yansıtılabilir, ancak kurallı yeniden yazma Codex desteği gerektirir.              |
| Zengin yerel compaction meta verileri                     | OpenClaw compaction başlangıcını ve tamamlanmasını gözlemler, ancak kararlı bir tutulan/bırakılan listesi, token deltası veya özet payload'u almaz.            | Daha zengin Codex compaction olayları gerekir.                                                     |
| Compaction müdahalesi                             | Mevcut OpenClaw compaction hook'ları Codex modunda bildirim düzeyindedir.                                                                         | Plugin'lerin yerel compaction'ı veto etmesi veya yeniden yazması gerekiyorsa Codex ön/son compaction hook'ları ekleyin. |
| Model API isteğinin bayt bayt yakalanması             | OpenClaw app-server isteklerini ve bildirimlerini yakalayabilir, ancak Codex çekirdeği nihai OpenAI API isteğini dahili olarak oluşturur.                      | Codex model isteği izleme olayı veya debug API'si gerekir.                                   |

## Araçlar, medya ve compaction

Codex harness yalnızca düşük düzeyli gömülü agent yürütücüsünü değiştirir.

OpenClaw araç listesini oluşturmaya ve harness'tan dinamik araç sonuçları almaya devam eder. Metin, görüntüler, video, müzik, TTS, onaylar ve mesajlaşma aracı çıktısı normal OpenClaw teslim yolundan geçmeye devam eder.

Yerel hook aktarımı bilinçli olarak geneldir, ancak v1 destek sözleşmesi OpenClaw'ın test ettiği Codex yerel araç ve izin yollarıyla sınırlıdır. Codex çalışma zamanında buna shell, patch ve MCP `PreToolUse`, `PostToolUse` ve `PermissionRequest` payload'ları dahildir. Çalışma zamanı sözleşmesi adını koyana kadar gelecekteki her Codex hook olayının bir OpenClaw Plugin yüzeyi olduğunu varsaymayın.

`PermissionRequest` için OpenClaw yalnızca politika karar verdiğinde açık allow veya deny kararları döndürür. Karar yok sonucu allow değildir. Codex bunu hook kararı yok olarak ele alır ve kendi koruyucusuna veya kullanıcı onayı yoluna düşer.

Codex MCP araç onayı istemleri, Codex `_meta.codex_approval_kind` değerini `"mcp_tool_call"` olarak işaretlediğinde OpenClaw'ın Plugin onay akışından yönlendirilir. Codex `request_user_input` istemleri kaynak sohbete geri gönderilir ve sıradaki bir sonraki takip mesajı, ek bağlam olarak yönlendirilmek yerine bu yerel sunucu isteğini yanıtlar. Diğer MCP istem istekleri hâlâ kapalı şekilde başarısız olur.

Etkin çalışma kuyruğu yönlendirmesi Codex app-server `turn/steer` üzerine eşlenir. Varsayılan `messages.queue.mode: "steer"` ile OpenClaw, yapılandırılmış sessiz pencere için kuyruğa alınan sohbet mesajlarını gruplar ve bunları varış sırasına göre tek bir `turn/steer` isteği olarak gönderir. Eski `queue` modu ayrı `turn/steer` istekleri gönderir. Codex review ve manuel compaction turları aynı tur yönlendirmesini reddedebilir; bu durumda OpenClaw, seçilen mod geri dönüşe izin veriyorsa followup kuyruğunu kullanır. Bkz. [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

Seçilen model Codex harness kullandığında yerel thread compaction, Codex app-server'a devredilir. OpenClaw kanal geçmişi, arama, `/new`, `/reset` ve gelecekte model veya harness değiştirme için bir transcript yansısı tutar. Yansı, kullanıcı istemini, nihai assistant metnini ve app-server bunları yaydığında hafif Codex reasoning veya plan kayıtlarını içerir. Bugün OpenClaw yalnızca yerel compaction başlangıç ve tamamlanma sinyallerini kaydeder. Henüz insan tarafından okunabilir bir compaction özeti veya Codex'in compaction sonrasında hangi girişleri tuttuğuna dair denetlenebilir bir liste sunmaz.

Codex kurallı yerel thread'in sahibi olduğundan, `tool_result_persist` şu anda Codex yerel araç sonucu kayıtlarını yeniden yazmaz. Yalnızca OpenClaw, OpenClaw'a ait bir oturum transcript araç sonucu yazarken uygulanır.

Medya üretimi PI gerektirmez. Görüntü, video, müzik, PDF, TTS ve medya anlama; `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` ve `messages.tts` gibi eşleşen sağlayıcı/model ayarlarını kullanmaya devam eder.

## Sorun giderme

**Codex normal bir `/model` sağlayıcısı olarak görünmüyor:** yeni yapılandırmalar için bu beklenen bir durumdur. `agentRuntime.id: "codex"` ile bir `openai/gpt-*` modeli (veya eski bir `codex/*` ref) seçin, `plugins.entries.codex.enabled` değerini etkinleştirin ve `plugins.allow` öğesinin `codex` öğesini hariç tutup tutmadığını kontrol edin.

**OpenClaw Codex yerine PI kullanıyor:** `agentRuntime.id: "auto"`, çalışmayı hiçbir Codex harness üstlenmediğinde uyumluluk backend'i olarak hâlâ PI kullanabilir. Test sırasında Codex seçimini zorlamak için `agentRuntime.id: "codex"` ayarlayın. Zorunlu bir Codex çalışma zamanı artık, açıkça `agentRuntime.fallback: "pi"` ayarlamadığınız sürece PI'ye geri dönmek yerine başarısız olur. Codex app-server seçildikten sonra, hataları ek geri dönüş yapılandırması olmadan doğrudan görünür.

**App-server reddediliyor:** Codex'i yükseltin, böylece app-server el sıkışması `0.125.0` veya daha yeni sürümü bildirir. `0.125.0-alpha.2` veya `0.125.0+custom` gibi aynı sürümlü ön sürümler veya build sonekli sürümler reddedilir, çünkü OpenClaw'ın test ettiği kararlı protokol alt sınırı `0.125.0` değeridir.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs` değerini düşürün veya keşfi devre dışı bırakın.

**WebSocket taşıması hemen başarısız oluyor:** `appServer.url`, `authToken` ve uzak app-server'ın aynı Codex app-server protokol sürümünü konuştuğunu kontrol edin.

**Codex olmayan bir model PI kullanıyor:** bu, o agent için `agentRuntime.id: "codex"` zorlamadığınız veya eski bir `codex/*` ref seçmediğiniz sürece beklenen bir durumdur. Düz `openai/gpt-*` ve diğer sağlayıcı ref'leri `auto` modunda normal sağlayıcı yolunda kalır. `agentRuntime.id: "codex"` zorlarsanız, o agent için her gömülü turun Codex destekli bir OpenAI modeli olması gerekir.

**Computer Use yüklü ancak araçlar çalışmıyor:** yeni bir oturumdan `/codex computer-use status` değerini kontrol edin. Bir araç `Native hook relay unavailable` bildirirse `/new` veya `/reset` kullanın; devam ederse eski yerel hook kayıtlarını temizlemek için Gateway'i yeniden başlatın. `computer-use.list_apps` zaman aşımına uğrarsa Codex Computer Use veya Codex Desktop'ı yeniden başlatın ve tekrar deneyin.

## İlgili

- [Agent harness Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Agent çalışma zamanları](/tr/concepts/agent-runtimes)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [Durum](/tr/cli/status)
- [Plugin hook'ları](/tr/plugins/hooks)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [Test etme](/tr/help/testing-live#live-codex-app-server-harness-smoke)
