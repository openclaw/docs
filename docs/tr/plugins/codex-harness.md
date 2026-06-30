---
read_when:
    - Birlikte gelen Codex app-server düzeneğini kullanmak istiyorsunuz
    - Codex harness yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex kullanılan dağıtımların OpenClaw'a geri dönmek yerine başarısız olmasını istiyorsunuz
summary: OpenClaw gömülü ajan turlarını birlikte gelen Codex app-server koşumu üzerinden çalıştırın
title: Codex koşumu
x-i18n:
    generated_at: "2026-06-30T14:23:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1569dca11b6d5a870c2dde58d04046df7829e70a5c59f34b25cf79b209c530e5
    source_path: plugins/codex-harness.md
    workflow: 16
---

Paketle gelen `codex` Plugin'i, OpenClaw'un yerleşik OpenClaw harness'ı yerine
Codex app-server üzerinden gömülü OpenAI agent dönüşleri çalıştırmasını sağlar.

Düşük seviyeli agent oturumunun Codex tarafından yönetilmesini istediğinizde
Codex harness'ını kullanın: yerel iş parçacığı sürdürme, yerel araç devamı,
yerel compaction ve app-server yürütmesi. OpenClaw yine de sohbet kanallarını,
oturum dosyalarını, model seçimini, OpenClaw dinamik araçlarını, onayları, medya
teslimini ve görünür transcript aynasını yönetir.

Normal kurulum `openai/gpt-5.5` gibi kanonik OpenAI model referansları kullanır.
Eski Codex GPT referanslarını yapılandırmayın. OpenAI agent auth sırasını
`auth.order.openai` altına koyun; daha eski eski Codex auth profil kimlikleri ve
eski Codex auth sırası girdileri, `openclaw doctor --fix` tarafından onarılan
eski durumdur.

Etkin OpenClaw sandbox'ı olmadığında OpenClaw, Codex app-server iş parçacıklarını
Codex yerel kod modu etkin halde başlatır, ancak yalnızca kod modu varsayılan
olarak kapalı kalır. Bu, Codex yerel çalışma alanı ve kod yeteneklerini kullanılabilir
tutarken OpenClaw dinamik araçlarının app-server `item/tool/call` köprüsü üzerinden
devam etmesini sağlar. Etkin OpenClaw sandboxing ve kısıtlı araç politikaları,
deneysel sandbox exec-server yoluna açıkça katılmadığınız sürece yerel kod modunu
tamamen devre dışı bırakır.

Bu Codex-yerel özellik,
[OpenClaw kod modu](/tr/reference/code-mode) özelliğinden ayrıdır; bu, farklı bir
`exec` giriş şekline sahip genel OpenClaw çalıştırmaları için isteğe bağlı bir
QuickJS-WASI runtime'dır.

Daha geniş model/provider/runtime ayrımı için
[Agent runtime'ları](/tr/concepts/agent-runtimes) ile başlayın. Kısa özet şudur:
`openai/gpt-5.5` model referansıdır, `codex` runtime'dır ve Telegram,
Discord, Slack veya başka bir kanal iletişim yüzeyi olarak kalır.

## Gereksinimler

- Paketle gelen `codex` Plugin'i kullanılabilir olan OpenClaw.
- Yapılandırmanız `plugins.allow` kullanıyorsa `codex` ekleyin.
- Codex app-server `0.125.0` veya daha yeni. Paketle gelen Plugin, varsayılan
  olarak uyumlu bir Codex app-server ikili dosyasını yönetir; bu nedenle `PATH`
  üzerindeki yerel `codex` komutları normal harness başlangıcını etkilemez.
- `openclaw models auth login --provider openai` üzerinden Codex auth,
  agent'ın Codex home dizininde bir app-server hesabı veya açık bir Codex API
  anahtarı auth profili.

Auth önceliği, ortam izolasyonu, özel app-server komutları, model keşfi ve tüm
yapılandırma alanları için
[Codex harness başvurusu](/tr/plugins/codex-harness-reference) sayfasına bakın.

## Hızlı Başlangıç

OpenClaw içinde Codex isteyen çoğu kullanıcı bu yolu ister: bir ChatGPT/Codex
aboneliğiyle oturum açın, paketle gelen `codex` Plugin'ini etkinleştirin ve
kanonik bir `openai/gpt-*` model referansı kullanın.

Codex OAuth ile oturum açın:

```bash
openclaw models auth login --provider openai
```

Paketle gelen `codex` Plugin'ini etkinleştirin ve bir OpenAI agent modeli seçin:

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

Plugin yapılandırmasını değiştirdikten sonra Gateway'i yeniden başlatın. Mevcut
bir sohbetin zaten oturumu varsa, runtime değişikliklerini test etmeden önce
`/new` veya `/reset` kullanın; böylece sonraki dönüş harness'ı güncel
yapılandırmadan çözer.

## Yapılandırma

Hızlı başlangıç yapılandırması, en küçük kullanılabilir Codex harness
yapılandırmasıdır. Codex harness seçeneklerini OpenClaw yapılandırmasında ayarlayın
ve CLI'yi yalnızca Codex auth için kullanın:

| İhtiyaç                                | Ayar                                                                             | Yer                                |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Harness'ı etkinleştirme                | `plugins.entries.codex.enabled: true`                                            | OpenClaw yapılandırması            |
| İzin listeli Plugin kurulumunu koruma  | `plugins.allow` içinde `codex` ekleyin                                           | OpenClaw yapılandırması            |
| OpenAI agent dönüşlerini Codex üzerinden yönlendirme | `agents.defaults.model` veya `agents.list[].model` olarak `openai/gpt-*`         | OpenClaw agent yapılandırması      |
| ChatGPT/Codex OAuth ile oturum açma    | `openclaw models auth login --provider openai`                                   | CLI auth profili                   |
| Codex çalıştırmaları için API anahtarı yedeği ekleme | `auth.order.openai` içinde abonelik auth'tan sonra listelenen `openai:*` API anahtarı profili | CLI auth profili + OpenClaw yapılandırması |
| Codex kullanılamadığında kapalı başarısız olma | Provider veya model `agentRuntime.id: "codex"`                                   | OpenClaw model/provider yapılandırması |
| Doğrudan OpenAI API trafiği kullanma   | Normal OpenAI auth ile Provider veya model `agentRuntime.id: "openclaw"`         | OpenClaw model/provider yapılandırması |
| App-server davranışını ayarlama        | `plugins.entries.codex.config.appServer.*`                                       | Codex Plugin yapılandırması        |
| Yerel Codex Plugin uygulamalarını etkinleştirme | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex Plugin yapılandırması        |
| Codex Computer Use etkinleştirme       | `plugins.entries.codex.config.computerUse.*`                                     | Codex Plugin yapılandırması        |

Codex destekli OpenAI agent dönüşleri için `openai/gpt-*` model referanslarını
kullanın. Abonelik-öncelikli/API-anahtarı-yedekli sıralama için
`auth.order.openai` tercih edin. Mevcut eski Codex auth profil kimlikleri ve
eski Codex auth sırası yalnızca doctor tarafından yönetilen eski durumdur; yeni
eski Codex GPT referansları yazmayın.

Codex destekli agent'larda `compaction.model` veya `compaction.provider`
ayarlamayın. Codex, yerel app-server iş parçacığı durumu üzerinden Compaction
yapar; bu yüzden OpenClaw runtime sırasında bu yerel özetleyici geçersiz kılmalarını
yok sayar ve agent Codex kullandığında `openclaw doctor --fix` bunları kaldırır.

Lossless, Codex dönüşleri etrafında derleme, alım ve bakım için bir bağlam
motoru olarak desteklenmeye devam eder. Bunu `agents.defaults.compaction.provider`
üzerinden değil, `plugins.slots.contextEngine: "lossless-claw"` ve
`plugins.entries.lossless-claw.config.summaryModel` üzerinden yapılandırın.
Codex etkin runtime olduğunda `openclaw doctor --fix`, eski
`compaction.provider: "lossless-claw"` şeklini Lossless bağlam motoru yuvasına
taşır; ancak yerel Codex yine de Compaction'ı yönetir.

Yerel Codex app-server harness'ı, ön-prompt derlemesi gerektiren bağlam
motorlarını destekler. `codex-cli` dahil genel CLI arka uçları bu ana makine
yeteneğini sağlamaz.

Codex destekli agent'lar için `/compact`, bağlı iş parçacığında yerel Codex
app-server Compaction başlatır. OpenClaw tamamlanmasını beklemez, OpenClaw
zaman aşımı uygulamaz, paylaşılan app-server'ı yeniden başlatmaz veya bir bağlam
motoruna ya da herkese açık OpenAI özetleyicisine geri dönmez. Yerel Codex iş
parçacığı bağlaması eksik veya bayatsa komut kapalı başarısız olur; böylece
operatör, Compaction arka uçlarının sessizce değiştirilmesi yerine gerçek
runtime sınırını görür.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Bu şekilde, her iki profil de `openai/gpt-*` agent dönüşleri için yine Codex
üzerinden çalışır. API anahtarı yalnızca bir auth geri dönüşüdür; OpenClaw'a veya
yalın OpenAI Responses'a geçme isteği değildir.

Bu sayfanın geri kalanı, kullanıcıların seçmesi gereken yaygın varyantları
kapsar: dağıtım şekli, kapalı başarısız yönlendirme, guardian onay politikası,
yerel Codex Plugin'leri ve Computer Use. Tam seçenek listeleri, varsayılanlar,
enum'lar, keşif, ortam izolasyonu, zaman aşımları ve app-server taşıma alanları
için [Codex harness başvurusu](/tr/plugins/codex-harness-reference) sayfasına bakın.

## Codex runtime'ını doğrulama

Codex beklediğiniz sohbette `/status` kullanın. Codex destekli bir OpenAI agent
dönüşü şunu gösterir:

```text
Runtime: OpenAI Codex
```

Ardından Codex app-server durumunu kontrol edin:

```text
/codex status
/codex models
```

`/codex status` app-server bağlantısını, hesabı, hız sınırlarını, MCP
sunucularını ve Skills'i raporlar. `/codex models`, harness ve hesap için canlı
Codex app-server kataloğunu listeler. `/status` şaşırtıcıysa
[Sorun Giderme](#troubleshooting) bölümüne bakın.

## Yönlendirme ve model seçimi

Provider referanslarını ve runtime politikasını ayrı tutun:

- Codex üzerinden OpenAI agent dönüşleri için `openai/gpt-*` kullanın.
- Yapılandırmada eski Codex GPT referansları kullanmayın. Eski referansları ve
  bayat oturum rota sabitlemelerini onarmak için `openclaw doctor --fix`
  çalıştırın.
- `agentRuntime.id: "codex"` normal OpenAI otomatik modu için isteğe bağlıdır,
  ancak bir dağıtımın Codex kullanılamadığında kapalı başarısız olması gerektiğinde
  kullanışlıdır.
- `agentRuntime.id: "openclaw"`, bu kasıtlı olduğunda bir provider'ı veya modeli
  OpenClaw gömülü runtime'ına alır.
- `/codex ...`, sohbetten yerel Codex app-server konuşmalarını kontrol eder.
- ACP/acpx ayrı bir harici harness yoludur. Yalnızca kullanıcı ACP/acpx veya
  harici harness adaptörü istediğinde kullanın.

Yaygın komut yönlendirmesi:

| Kullanıcı amacı                                      | Kullanım                                                                                              |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Geçerli sohbeti ekleme                               | `/codex bind [--cwd <path>]`                                                                          |
| Mevcut bir Codex iş parçacığını sürdürme             | `/codex resume <thread-id>`                                                                           |
| Codex iş parçacıklarını listeleme veya filtreleme    | `/codex threads [filter]`                                                                             |
| Yerel Codex Plugin'lerini listeleme                  | `/codex plugins list`                                                                                 |
| Yapılandırılmış bir yerel Codex Plugin'ini etkinleştirme veya devre dışı bırakma | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Eşlenmiş bir node üzerinde mevcut bir Codex CLI oturumu ekleme | `/codex sessions --host <node> [filter]`, ardından `/codex resume <session-id> --host <node> --bind here` |
| Yalnızca Codex geri bildirimi gönderme               | `/codex diagnostics [note]`                                                                           |
| ACP/acpx görevi başlatma                             | `/codex` değil, ACP/acpx oturum komutları                                                            |

| Kullanım durumu                                      | Yapılandırma                                                           | Doğrulama                               | Notlar                                |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| Yerel Codex çalışma zamanı ile ChatGPT/Codex aboneliği | `openai/gpt-*` artı etkinleştirilmiş `codex` Plugin                   | `/status`, `Runtime: OpenAI Codex` gösterir | Önerilen yol                          |
| Codex kullanılamıyorsa kapalı şekilde başarısız ol   | Sağlayıcı veya model `agentRuntime.id: "codex"`                        | Tur, yerleşik geri dönüş yerine başarısız olur | Yalnızca Codex dağıtımları için kullanın |
| Doğrudan OpenAI API anahtarı trafiğini OpenClaw üzerinden geçir | Sağlayıcı veya model `agentRuntime.id: "openclaw"` ve normal OpenAI kimlik doğrulaması | `/status`, OpenClaw çalışma zamanını gösterir | Yalnızca OpenClaw bilinçli olarak istendiğinde kullanın |
| Eski yapılandırma                                    | eski Codex GPT başvuruları                                             | `openclaw doctor --fix` bunu yeniden yazar | Yeni yapılandırmayı bu şekilde yazmayın |
| ACP/acpx Codex bağdaştırıcısı                        | ACP `sessions_spawn({ runtime: "acp" })`                               | ACP görev/oturum durumu                 | Yerel Codex harness'ından ayrıdır     |

`agents.defaults.imageModel` aynı önek ayrımını izler. Normal OpenAI rotası için
`openai/gpt-*`, görüntü anlama işleminin sınırlandırılmış bir Codex uygulama
sunucusu turu üzerinden çalışması gerektiğinde ise yalnızca `codex/gpt-*`
kullanın. Eski Codex GPT başvurularını kullanmayın; doctor bu eski öneki
`openai/gpt-*` olarak yeniden yazar.

## Dağıtım desenleri

### Temel Codex dağıtımı

Tüm OpenAI ajan turlarının varsayılan olarak Codex kullanması gerektiğinde
quickstart yapılandırmasını kullanın.

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
    },
  },
}
```

### Karma sağlayıcı dağıtımı

Bu yapı Claude'u varsayılan ajan olarak tutar ve adlandırılmış bir Codex ajanı
ekler:

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
      model: "anthropic/claude-opus-4-6",
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
      },
    ],
  },
}
```

Bu yapılandırmayla `main` ajanı normal sağlayıcı yolunu, `codex` ajanı ise Codex
uygulama sunucusunu kullanır.

### Kapalı başarısız Codex dağıtımı

OpenAI ajan turları için, birlikte gelen Plugin kullanılabilir olduğunda
`openai/gpt-*` zaten Codex'e çözümlenir. Yazılı bir kapalı başarısızlık kuralı
istediğinizde açık çalışma zamanı ilkesi ekleyin:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
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

Codex zorunlu kılındığında, Codex Plugin devre dışıysa, uygulama sunucusu çok
eskiyse veya uygulama sunucusu başlatılamıyorsa OpenClaw erken başarısız olur.

## Uygulama sunucusu ilkesi

Varsayılan olarak Plugin, OpenClaw'un yönettiği Codex ikilisini stdio taşımasıyla
yerel olarak başlatır. `appServer.command` değerini yalnızca bilinçli olarak
farklı bir yürütülebilir dosya çalıştırmak istediğinizde ayarlayın. WebSocket
taşımasını yalnızca bir uygulama sunucusu zaten başka bir yerde çalışıyorsa
kullanın:

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
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

Yerel stdio uygulama sunucusu oturumları, varsayılan olarak güvenilir yerel
operatör duruşunu kullanır: `approvalPolicy: "never"`,
`approvalsReviewer: "user"` ve `sandbox: "danger-full-access"`. Yerel Codex
gereksinimleri bu örtük sınırsız izin duruşuna izin vermezse, OpenClaw bunun
yerine izin verilen koruyucu izinlerini seçer. Oturum için bir OpenClaw sandbox'ı
etkinken, OpenClaw o turda Codex ana tarafı sandbox'ına güvenmek yerine Codex
yerel Code Mode'u, kullanıcı MCP sunucularını ve uygulama destekli Plugin
yürütmesini devre dışı bırakır. Kabuk erişimi, normal exec/process araçları
kullanılabilir olduğunda `sandbox_exec` ve `sandbox_process` gibi OpenClaw
sandbox destekli dinamik araçlar üzerinden sunulur.

Sandbox kaçışlarından veya ek izinlerden önce Codex yerel otomatik incelemesi
istediğinizde normalleştirilmiş OpenClaw exec modunu kullanın:

```json5
{
  tools: {
    exec: {
      mode: "auto",
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

Codex uygulama sunucusu oturumları için OpenClaw, yerel gereksinimler bu
değerlere izin verdiğinde `tools.exec.mode: "auto"` değerini genellikle
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` ve
`sandbox: "workspace-write"` olan Codex Guardian incelemeli onaylara eşler.
`tools.exec.mode: "auto"` içinde OpenClaw eski güvenli olmayan Codex
`approvalPolicy: "never"` veya `sandbox: "danger-full-access"` geçersiz
kılmalarını korumaz; bilinçli bir onaysız Codex duruşu için
`tools.exec.mode: "full"` kullanın. Eski
`plugins.entries.codex.config.appServer.mode: "guardian"` ön ayarı hâlâ çalışır,
ancak `tools.exec.mode: "auto"` normalleştirilmiş OpenClaw yüzeyidir.

Ana makine exec onayları ve ACPX izinleriyle mod düzeyi karşılaştırma için
bkz. [İzin modları](/tr/tools/permission-modes).

Her uygulama sunucusu alanı, kimlik doğrulama sırası, ortam yalıtımı, keşif ve
zaman aşımı davranışı için bkz. [Codex harness başvurusu](/tr/plugins/codex-harness-reference).

## Komutlar ve tanılama

Birlikte gelen Plugin, OpenClaw metin komutlarını destekleyen herhangi bir
kanalda `/codex` değerini slash komutu olarak kaydeder.

Yerel yürütme ve denetim için bir sahip veya `operator.admin` Gateway istemcisi
gerekir. Buna iş parçacıklarını bağlama veya sürdürme, tur gönderme veya
durdurma, model, hızlı mod ya da izin durumunu değiştirme, sıkıştırma veya
inceleme ve bir bağlamayı ayırma dahildir. Diğer yetkili göndericiler salt okunur
durum, yardım, hesap, model, iş parçacığı, MCP sunucusu, skill ve bağlama
inceleme komutlarını korur.

Yaygın biçimler:

- `/codex status` uygulama sunucusu bağlantısını, modelleri, hesabı, hız
  sınırlarını, MCP sunucularını ve skill'leri denetler.
- `/codex models` canlı Codex uygulama sunucusu modellerini listeler.
- `/codex threads [filter]` son Codex uygulama sunucusu iş parçacıklarını listeler.
- `/codex resume <thread-id>` geçerli OpenClaw oturumunu mevcut bir Codex iş
  parçacığına bağlar.
- `/codex compact` Codex uygulama sunucusundan bağlı iş parçacığını sıkıştırmasını ister.
- `/codex review` bağlı iş parçacığı için Codex yerel incelemesini başlatır.
- `/codex diagnostics [note]` bağlı iş parçacığı için Codex geri bildirimi
  göndermeden önce sorar.
- `/codex account` hesap ve hız sınırı durumunu gösterir.
- `/codex mcp` Codex uygulama sunucusu MCP sunucusu durumunu listeler.
- `/codex skills` Codex uygulama sunucusu skill'lerini listeler.

Çoğu destek raporu için, hatanın gerçekleştiği konuşmada
`/diagnostics [note]` ile başlayın. Bu, bir Gateway tanılama raporu oluşturur ve
Codex harness oturumları için ilgili Codex geri bildirim paketini göndermek için
onay ister. Gizlilik modeli ve grup sohbeti davranışı için bkz.
[Tanılama dışa aktarma](/tr/gateway/diagnostics).

Yalnızca tam Gateway tanılama paketi olmadan, şu anda bağlı iş parçacığı için
özel olarak Codex geri bildirim yüklemesini istediğinizde
`/codex diagnostics [note]` kullanın.

### Codex iş parçacıklarını yerel olarak inceleyin

Sorunlu bir Codex çalıştırmasını incelemenin en hızlı yolu çoğu zaman yerel
Codex iş parçacığını doğrudan açmaktır:

```bash
codex resume <thread-id>
```

İş parçacığı kimliğini tamamlanan `/diagnostics` yanıtından, `/codex binding`
komutundan veya `/codex threads [filter]` komutundan alın.

Yükleme mekanikleri ve çalışma zamanı düzeyindeki tanılama sınırları için bkz.
[Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime#codex-feedback-upload).

Kimlik doğrulama şu sırayla seçilir:

1. Ajan için sıralı OpenAI kimlik doğrulama profilleri, tercihen
   `auth.order.openai` altında. Daha eski eski Codex kimlik doğrulama profili
   kimliklerini ve eski Codex kimlik doğrulama sırasını taşımak için
   `openclaw doctor --fix` çalıştırın.
2. Bu ajanın Codex ana dizinindeki uygulama sunucusunun mevcut hesabı.
3. Yalnızca yerel stdio uygulama sunucusu başlatmaları için, uygulama sunucusu
   hesabı yoksa ve OpenAI kimlik doğrulaması hâlâ gerekiyorsa önce
   `CODEX_API_KEY`, sonra `OPENAI_API_KEY`.

OpenClaw bir ChatGPT aboneliği tarzı Codex kimlik doğrulama profili gördüğünde,
başlatılan Codex alt sürecinden `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini
kaldırır. Bu, Gateway düzeyi API anahtarlarını embeddings veya doğrudan OpenAI
modelleri için kullanılabilir tutarken yerel Codex uygulama sunucusu turlarının
yanlışlıkla API üzerinden faturalandırılmasını önler. Açık Codex API anahtarı
profilleri ve yerel stdio env anahtarı geri dönüşü, devralınan alt süreç ortamı
yerine uygulama sunucusu oturum açmasını kullanır. WebSocket uygulama sunucusu
bağlantıları Gateway env API anahtarı geri dönüşünü almaz; açık bir kimlik
doğrulama profili veya uzak uygulama sunucusunun kendi hesabını kullanın.
Yerel Codex Plugin'leri yapılandırıldığında, OpenClaw Plugin sahibi uygulamaları
Codex iş parçacığına sunmadan önce bu Plugin'leri bağlı uygulama sunucusu
üzerinden kurar veya yeniler. `app/list`, uygulama kimlikleri, erişilebilirlik ve
metadata için doğruluk kaynağı olarak kalır, ancak iş parçacığı başına
etkinleştirme kararının sahibi OpenClaw'dur: ilke, listelenen erişilebilir bir
uygulamaya izin veriyorsa, `app/list` o uygulamayı şu anda devre dışı bildirse
bile OpenClaw `thread/start.config.apps[appId].enabled = true` gönderir. Bu yol
bilinmeyen kimlikler için uygulama kurulumu uydurmaz; OpenClaw yalnızca
marketplace Plugin'lerini `plugin/install` ile etkinleştirir ve ardından
envanteri yeniler.

Bir abonelik profili Codex kullanım sınırına ulaşırsa, Codex bir sıfırlama
zamanı bildirdiğinde OpenClaw bunu kaydeder ve aynı Codex çalıştırması için
sıradaki kimlik doğrulama profilini dener. Sıfırlama zamanı geçtiğinde abonelik
profili, seçili `openai/gpt-*` modelini veya Codex çalışma zamanını değiştirmeden
yeniden uygun olur.

Yerel stdio uygulama sunucusu başlatmaları için OpenClaw, Codex yapılandırması,
kimlik doğrulama/hesap dosyaları, Plugin önbelleği/verileri ve yerel iş parçacığı
durumu varsayılan olarak operatörün kişisel `~/.codex` konumunu okumayacak veya
yazmayacak şekilde `CODEX_HOME` değerini ajan başına bir dizine ayarlar.
OpenClaw normal süreç `HOME` değerini korur; Codex tarafından çalıştırılan alt
süreçler hâlâ kullanıcı ana dizini yapılandırmasını ve token'ları bulabilir ve
Codex paylaşılan `$HOME/.agents/skills` ve
`$HOME/.agents/plugins/marketplace.json` girişlerini keşfedebilir.

Bir dağıtım ek ortam yalıtımı gerektiriyorsa, bu değişkenleri
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

`appServer.clearEnv` yalnızca başlatılan Codex uygulama sunucusu alt sürecini
etkiler. OpenClaw, yerel başlatma normalleştirmesi sırasında `CODEX_HOME` ve
`HOME` değerlerini bu listeden kaldırır: `CODEX_HOME` ajan başına kalır ve
`HOME` devralınmış kalır, böylece alt süreçler normal kullanıcı ana dizini
durumunu kullanabilir.

Codex dinamik araçları varsayılan olarak `searchable` yüklemeyi kullanır. OpenClaw,
Codex’e özgü çalışma alanı işlemlerini yineleyen dinamik araçları sunmaz:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` ve `update_plan`.
Mesajlaşma, medya, cron, tarayıcı, düğümler, gateway ve `heartbeat_respond`
gibi kalan OpenClaw entegrasyon araçlarının çoğu, başlangıç model bağlamını daha
küçük tutarak `openclaw` ad alanı altında Codex araç araması üzerinden
kullanılabilir. Arama etkinleştirildiğinde ve yönetilen bir sağlayıcı
seçilmediğinde web araması varsayılan olarak Codex’in barındırılan `web_search`
aracını kullanır. Yerel barındırılan arama ile OpenClaw’ın yönetilen
`web_search` dinamik aracı birbirini dışlar; böylece yönetilen arama yerel alan
adı kısıtlamalarını aşamaz. OpenClaw, barındırılan arama kullanılamadığında,
açıkça devre dışı bırakıldığında veya seçilen bir yönetilen sağlayıcıyla
değiştirildiğinde yönetilen aracı kullanır. OpenClaw, Codex’in bağımsız `web.run`
uzantısını devre dışı tutar çünkü üretim uygulama sunucusu trafiği, kullanıcı
tanımlı `web` ad alanını reddeder. `tools.web.search.enabled: false`, araçların
devre dışı bırakıldığı yalnızca LLM çalıştırmaları gibi her iki yolu da devre
dışı bırakır. Codex, `"cached"` değerini bir tercih olarak ele alır ve
kısıtlanmamış uygulama sunucusu turları için bunu canlı harici erişime çözer.
Yerel `allowedDomains` ayarlandığında otomatik yönetilen geri dönüş kapalı
başarısız olur, böylece izin listesi aşılamaz. Kalıcı etkili arama ilkesi
değişiklikleri, sonraki turdan önce bağlı Codex iş parçacığını döndürür. Tur
başına geçici kısıtlamalar, geçici bir kısıtlı iş parçacığı kullanır ve daha
sonra sürdürme için mevcut bağlantıyı korur. `sessions_yield` ve yalnızca mesaj
aracı kaynak yanıtları doğrudan kalır çünkü bunlar tur denetimi sözleşmeleridir.
`sessions_spawn` aranabilir kalır; böylece Codex’in yerel `spawn_agent` yüzeyi
birincil Codex alt ajan yüzeyi olmaya devam ederken, açık OpenClaw veya ACP
delegasyonu yine de `openclaw` dinamik araç ad alanı üzerinden kullanılabilir.
Heartbeat iş birliği yönergeleri, araç zaten yüklenmemişse Codex’e bir Heartbeat
turunu sonlandırmadan önce `heartbeat_respond` için arama yapmasını söyler.

`codexDynamicToolsLoading: "direct"` değerini yalnızca ertelenmiş dinamik
araçları arayamayan özel bir Codex uygulama sunucusuna bağlanırken veya tam araç
yükünde hata ayıklarken ayarlayın.

Desteklenen üst düzey Codex Plugin alanları:

| Alan                       | Varsayılan     | Anlam                                                                                         |
| -------------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | OpenClaw dinamik araçlarını doğrudan başlangıç Codex araç bağlamına koymak için `"direct"` kullanın. |
| `codexDynamicToolsExclude` | `[]`           | Codex uygulama sunucusu turlarından çıkarılacak ek OpenClaw dinamik araç adları.              |
| `codexPlugins`             | devre dışı     | Taşınmış, kaynaktan kurulmuş küratörlü pluginler için yerel Codex plugin/uygulama desteği.    |

Desteklenen `appServer` alanları:

| Alan                                          | Varsayılan                                             | Anlamı                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` Codex'i başlatır; `"websocket"` `url`'ye bağlanır.                                                                                                                                                                                                                                                                                                                                   |
| `command`                                     | yönetilen Codex ikili dosyası                          | stdio aktarımı için yürütülebilir dosya. Yönetilen ikili dosyayı kullanmak için ayarlamadan bırakın; yalnızca açık bir geçersiz kılma için ayarlayın.                                                                                                                                                                                                                                           |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio aktarımı için bağımsız değişkenler.                                                                                                                                                                                                                                                                                                                                                       |
| `url`                                         | ayarlanmamış                                           | WebSocket app-server URL'si.                                                                                                                                                                                                                                                                                                                                                                   |
| `authToken`                                   | ayarlanmamış                                           | WebSocket aktarımı için Bearer belirteci. Değişmez bir dizeyi veya `${CODEX_APP_SERVER_TOKEN}` gibi SecretInput kabul eder.                                                                                                                                                                                                                                                                     |
| `headers`                                     | `{}`                                                   | Ek WebSocket üstbilgileri. Üstbilgi değerleri, örneğin `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"` gibi değişmez dizeleri veya SecretInput değerlerini kabul eder.                                                                                                                                                                                                         |
| `clearEnv`                                    | `[]`                                                   | OpenClaw devralınan ortamını oluşturduktan sonra başlatılan stdio app-server sürecinden kaldırılan ek ortam değişkeni adları. OpenClaw, yerel başlatmalar için aracı başına `CODEX_HOME` ve devralınan `HOME` değerini korur.                                                                                                                                                                  |
| `codeModeOnly`                                | `false`                                                | Codex'in yalnızca kod modu araç yüzeyine dahil olmayı sağlar. OpenClaw dinamik araçları Codex'e kayıtlı kalır, böylece iç içe `tools.*` çağrıları app-server `item/tool/call` köprüsü üzerinden döner.                                                                                                                                                                                          |
| `remoteWorkspaceRoot`                         | ayarlanmamış                                           | Uzak Codex app-server çalışma alanı kökü. Ayarlandığında OpenClaw, yerel çalışma alanı kökünü çözümlenmiş OpenClaw çalışma alanından çıkarır, geçerli cwd sonekini bu uzak kök altında korur ve Codex'e yalnızca nihai app-server cwd değerini gönderir. cwd çözümlenmiş OpenClaw çalışma alanı kökünün dışındaysa OpenClaw, uzak app-server'a gateway-yerel bir yol göndermek yerine güvenli biçimde reddeder. |
| `requestTimeoutMs`                            | `60000`                                                | app-server denetim düzlemi çağrıları için zaman aşımı.                                                                                                                                                                                                                                                                                                                                         |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex bir turu kabul ettikten sonra veya OpenClaw `turn/completed` beklerken tur kapsamlı bir app-server isteğinden sonra sessiz pencere.                                                                                                                                                                                                                                                       |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw `turn/completed` beklerken araç devri, yerel araç tamamlama, araç sonrası ham asistan ilerlemesi, ham akıl yürütme tamamlama veya akıl yürütme ilerlemesinden sonra kullanılan tamamlama-boşta ve ilerleme koruması. Araç sonrası sentezin nihai asistan yayın bütçesinden meşru biçimde daha uzun süre sessiz kalabildiği güvenilen veya ağır iş yükleri için bunu kullanın.          |
| `mode`                                        | yerel Codex gereksinimleri YOLO'ya izin vermedikçe `"yolo"` | YOLO veya guardian tarafından incelenen yürütme için ön ayar. `danger-full-access`, `never` onayı veya `user` inceleyicisini atlayan yerel stdio gereksinimleri, örtük varsayılanı guardian yapar.                                                                                                                                                                                               |
| `approvalPolicy`                              | `"never"` veya izin verilen bir guardian onay ilkesi    | İş parçacığı başlatma/sürdürme/tur için gönderilen yerel Codex onay ilkesi. Guardian varsayılanları, izin verildiğinde `"on-request"` değerini tercih eder.                                                                                                                                                                                                                                     |
| `sandbox`                                     | `"danger-full-access"` veya izin verilen bir guardian sandbox | İş parçacığı başlatma/sürdürme için gönderilen yerel Codex sandbox modu. Guardian varsayılanları, izin verildiğinde `"workspace-write"` değerini, aksi halde `"read-only"` değerini tercih eder. Bir OpenClaw sandbox etkin olduğunda, `danger-full-access` turları OpenClaw sandbox çıkış ayarından türetilen ağ erişimiyle Codex `workspace-write` kullanır.                                  |
| `approvalsReviewer`                           | `"user"` veya izin verilen bir guardian inceleyici      | İzin verildiğinde Codex'in yerel onay istemlerini incelemesine izin vermek için `"auto_review"` kullanın; aksi halde `guardian_subagent` veya `user`. `guardian_subagent` eski bir takma ad olarak kalır.                                                                                                                                                                                       |
| `serviceTier`                                 | ayarlanmamış                                           | İsteğe bağlı Codex app-server hizmet katmanı. `"priority"` hızlı mod yönlendirmeyi etkinleştirir, `"flex"` esnek işlemeyi ister, `null` geçersiz kılmayı temizler ve eski `"fast"` değeri `"priority"` olarak kabul edilir.                                                                                                                                                                    |
| `networkProxy`                                | devre dışı                                             | app-server komutları için Codex izin profili ağ kullanımına dahil olmayı sağlar. OpenClaw, `sandbox` göndermek yerine seçili `permissions.<profile>.network` yapılandırmasını tanımlar ve bunu `default_permissions` ile seçer.                                                                                                                                                                |
| `experimental.sandboxExecServer`              | `false`                                                | Yerel Codex yürütmesinin etkin OpenClaw sandbox içinde çalışabilmesi için OpenClaw sandbox destekli bir Codex ortamını Codex app-server 0.132.0 veya daha yenisine kaydeden önizleme dahil etme seçeneği.                                                                                                                                                                                       |

`appServer.networkProxy` açıktır çünkü Codex sandbox sözleşmesini değiştirir.
Etkinleştirildiğinde OpenClaw, oluşturulan izin profilinin Codex yönetimli ağ
kullanımını başlatabilmesi için Codex iş parçacığı yapılandırmasında
`features.network_proxy.enabled` ve `default_permissions` değerlerini de ayarlar.
Varsayılan olarak OpenClaw, profil gövdesinden çakışmaya dayanıklı bir
`openclaw-network-<fingerprint>` profil adı oluşturur; `profileName` değerini
yalnızca kararlı bir yerel ad gerektiğinde kullanın.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

Normal app-server çalışma zamanı `danger-full-access` olacaksa, `networkProxy`
etkinleştirmek oluşturulan izin profili için çalışma alanı tarzı dosya sistemi
erişimi kullanır. Codex yönetimli ağ zorlaması sandbox uygulanmış ağ kullanımıdır,
bu yüzden tam erişimli bir profil giden trafiği korumaz.
Etki alanı girdileri `allow` veya `deny` kullanır; Unix soketi girdileri Codex'in
`allow` veya `none` değerlerini kullanır.

OpenClaw'a ait dinamik araç çağrıları `appServer.requestTimeoutMs` değerinden
bağımsız olarak sınırlandırılır: Codex `item/tool/call` istekleri varsayılan
olarak 90 saniyelik bir OpenClaw watchdog kullanır. Pozitif bir çağrı başına
`timeoutMs` argümanı, o belirli araç bütçesini uzatır veya kısaltır.
`image_generate` aracı, araç çağrısı kendi zaman aşımını sağlamadığında
`agents.defaults.imageGenerationModel.timeoutMs` değerini, aksi halde 120
saniyelik görüntü üretimi varsayılanını kullanır. Medya anlama `image` aracı
`tools.media.image.timeoutSeconds` değerini veya 60 saniyelik medya
varsayılanını kullanır. Görüntü anlama için bu zaman aşımı isteğin kendisine
uygulanır ve daha önceki hazırlık çalışması nedeniyle azaltılmaz. Dinamik araç
bütçeleri 600000 ms ile sınırlandırılır. Zaman aşımında OpenClaw, desteklenen
yerlerde araç sinyalini iptal eder ve oturumu `processing` durumunda bırakmak
yerine turun devam edebilmesi için Codex'e başarısız bir dinamik araç yanıtı
döndürür. Bu watchdog, dış dinamik `item/tool/call` bütçesidir; sağlayıcıya
özgü istek zaman aşımları bu çağrının içinde çalışır ve kendi zaman aşımı
semantiklerini korur.

Codex bir turu kabul ettikten ve OpenClaw tur kapsamlı bir app-server isteğine
yanıt verdikten sonra, harness Codex'in mevcut turda ilerleme kaydetmesini ve
sonunda yerel turu `turn/completed` ile bitirmesini bekler. App-server
`appServer.turnCompletionIdleTimeoutMs` süresince sessiz kalırsa, OpenClaw
elinden geldiğince Codex turunu keser, tanısal bir zaman aşımı kaydeder ve
sonraki sohbet iletilerinin eski bir yerel turun arkasında kuyruğa alınmaması
için OpenClaw oturum şeridini serbest bırakır. Aynı tur için terminal olmayan
bildirimlerin çoğu bu kısa watchdog'u devre dışı bırakır, çünkü Codex turun hâlâ
canlı olduğunu kanıtlamıştır. Araç devirleri daha uzun bir araç sonrası boşta
kalma bütçesi kullanır: OpenClaw bir `item/tool/call` yanıtı döndürdükten sonra,
`commandExecution` gibi yerel araç öğeleri tamamlandıktan sonra, ham
`custom_tool_call_output` tamamlamalarından sonra ve araç sonrası ham assistant
ilerlemesinden, ham akıl yürütme tamamlamalarından veya akıl yürütme
ilerlemesinden sonra. Koruma, yapılandırıldığında
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` değerini kullanır ve
aksi halde varsayılan olarak beş dakikadır. Aynı araç sonrası bütçe, Codex bir
sonraki mevcut tur olayını yaymadan önceki sessiz sentez penceresi için ilerleme
watchdog'unu da uzatır. Hız sınırı güncellemeleri gibi genel app-server
bildirimleri tur-boşta ilerlemesini sıfırlamaz. Akıl yürütme tamamlamaları,
yorum `agentMessage` tamamlamaları ve araç öncesi ham akıl yürütme veya
assistant ilerlemesi otomatik bir son yanıtla takip edilebilir; bu nedenle
oturum şeridini hemen serbest bırakmak yerine ilerleme sonrası yanıt korumasını
kullanırlar. Yalnızca son/yorum dışı tamamlanmış `agentMessage` öğeleri ve araç
öncesi ham assistant tamamlamaları assistant-çıktısı serbest bırakmasını
kurar: Codex ardından `turn/completed` olmadan sessiz kalırsa, OpenClaw elinden
geldiğince yerel turu keser ve oturum şeridini serbest bırakır. Assistant, araç,
etkin öğe veya yan etki kanıtı olmayan tur-tamamlama boşta kalma zaman aşımları
dahil yeniden oynatma açısından güvenli stdio app-server hataları, yeni bir
app-server denemesinde bir kez yeniden denenir. Güvenli olmayan zaman aşımları
takılmış app-server istemcisini yine de emekliye ayırır ve OpenClaw oturum
şeridini serbest bırakır. Ayrıca otomatik olarak yeniden oynatılmak yerine eski
yerel iş parçacığı bağını temizlerler. Tamamlama-izleme zaman aşımları Codex'e
özgü zaman aşımı metni gösterir: yeniden oynatma açısından güvenli durumlar
yanıtın eksik olabileceğini söylerken, güvenli olmayan durumlar kullanıcıya
yeniden denemeden önce mevcut durumu doğrulamasını söyler. Genel zaman aşımı
tanıları, son app-server bildirim yöntemi, ham assistant yanıt öğesi
id/tür/rolü, etkin istek/öğe sayıları ve kurulmuş izleme durumu gibi yapısal
alanlar içerir. Son bildirim ham bir assistant yanıt öğesiyse, sınırlı bir
assistant metin önizlemesi de içerirler. Ham istem veya araç içeriği içermezler.

Ortam geçersiz kılmaları yerel test için kullanılabilir kalır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`, `appServer.command` ayarlanmamışsa yönetilen
ikili dosyayı atlar.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırıldı. Bunun yerine
`plugins.entries.codex.config.appServer.mode: "guardian"` kullanın veya tek
seferlik yerel test için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın.
Yinelenebilir dağıtımlar için yapılandırma tercih edilir, çünkü Plugin
davranışını Codex harness kurulumunun geri kalanıyla aynı gözden geçirilmiş
dosyada tutar.

## Yerel Codex Plugin'leri

Yerel Codex Plugin desteği, OpenClaw harness turuyla aynı Codex iş parçacığında
Codex app-server'ın kendi uygulama ve Plugin yeteneklerini kullanır. OpenClaw,
Codex Plugin'lerini sentetik `codex_plugin_*` OpenClaw dinamik araçlarına
çevirmez.

`codexPlugins` yalnızca yerel Codex harness'ını seçen oturumları etkiler.
Yerleşik harness çalıştırmalarında, normal OpenAI sağlayıcı çalıştırmalarında,
ACP konuşma bağlarında veya diğer harness'larda etkisi yoktur.

En küçük geçirilmiş yapılandırma:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

İş parçacığı uygulama yapılandırması, OpenClaw bir Codex harness oturumu
kurduğunda veya eski bir Codex iş parçacığı bağını değiştirdiğinde hesaplanır.
Her turda yeniden hesaplanmaz. `codexPlugins` değiştirildikten sonra, gelecekteki
Codex harness oturumlarının güncellenmiş uygulama setiyle başlaması için `/new`,
`/reset` kullanın veya gateway'i yeniden başlatın.

Geçiş uygunluğu, uygulama envanteri, yıkıcı eylem ilkesi, elicitations ve yerel
Plugin tanıları için bkz. [Yerel Codex Plugin'leri](/tr/plugins/codex-native-plugins).

OpenAI tarafındaki uygulama ve Plugin erişimi, oturum açmış Codex hesabı ve
Business ile Enterprise/Edu çalışma alanları için çalışma alanı uygulama
denetimleri tarafından kontrol edilir. OpenAI'nin hesap ve çalışma alanı denetim
genel bakışı için bkz.
[Codex'i ChatGPT planınızla kullanma](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Bilgisayar Kullanımı

Bilgisayar Kullanımı kendi kurulum kılavuzunda ele alınır:
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use).

Kısa sürüm: OpenClaw masaüstü denetim uygulamasını vendor etmez veya masaüstü
eylemlerini kendisi yürütmez. Codex app-server'ı hazırlar, `computer-use` MCP
sunucusunun kullanılabilir olduğunu doğrular ve ardından Codex modu turları
sırasında yerel MCP araç çağrılarını Codex'in yönetmesine izin verir.

## Çalışma zamanı sınırları

Codex harness yalnızca düşük seviyeli gömülü agent yürütücüsünü değiştirir.

- OpenClaw dinamik araçları desteklenir. Codex, OpenClaw'dan bu araçları
  yürütmesini ister; bu nedenle OpenClaw yürütme yolunda kalır.
- Codex'e yerel shell, patch, MCP ve yerel uygulama araçları Codex'e aittir.
  OpenClaw, desteklenen relay üzerinden seçili yerel olayları gözlemleyebilir
  veya engelleyebilir, ancak yerel araç argümanlarını yeniden yazmaz.
- Yerel compaction Codex'e aittir. OpenClaw kanal geçmişi, arama, `/new`,
  `/reset` ve gelecekteki model veya harness geçişleri için bir transcript
  aynası tutar, ancak Codex Compaction'ını OpenClaw veya context-engine
  özetleyicisiyle değiştirmez.
- Medya üretimi, medya anlama, TTS, onaylar ve mesajlaşma aracı çıktısı eşleşen
  OpenClaw sağlayıcı/model ayarları üzerinden devam eder.
- `tool_result_persist`, Codex'e yerel araç sonuç kayıtlarına değil,
  OpenClaw'a ait transcript araç sonuçlarına uygulanır.

Hook katmanları, desteklenen V1 yüzeyleri, yerel izin işleme, kuyruk
yönlendirme, Codex geri bildirim yükleme mekanikleri ve Compaction ayrıntıları
için bkz. [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime).

## Sorun giderme

**Codex normal bir `/model` sağlayıcısı olarak görünmüyor:** bu yeni
yapılandırmalar için beklenen durumdur. Bir `openai/gpt-*` modeli seçin,
`plugins.entries.codex.enabled` öğesini etkinleştirin ve `plugins.allow`
değerinin `codex` öğesini dışlayıp dışlamadığını kontrol edin.

**OpenClaw, Codex yerine yerleşik harness'ı kullanıyor:** model ref değerinin
resmi OpenAI sağlayıcısında `openai/gpt-*` olduğundan ve Codex Plugin'inin
kurulu ve etkin olduğundan emin olun. Test sırasında kesin kanıt gerekiyorsa,
sağlayıcı veya model `agentRuntime.id: "codex"` değerini ayarlayın. Zorlanmış
bir Codex runtime, OpenClaw'a geri dönmek yerine başarısız olur.

**OpenAI Codex runtime API anahtarı yoluna geri dönüyor:** modeli, runtime'ı,
seçilen sağlayıcıyı ve hatayı gösteren redakte edilmiş bir gateway alıntısı
toplayın. Etkilenen ortaklardan OpenClaw host'larında bu salt okunur komutu
çalıştırmalarını isteyin:

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

Yararlı alıntılar genellikle `openai/gpt-5.5` veya `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` veya `harnessRuntime`,
`candidateProvider: "openai"` ve bir `401`, `Incorrect API key` veya
`No API key` sonucu içerir. Düzeltilmiş bir çalıştırma, düz bir OpenAI API
anahtarı hatası yerine OpenAI OAuth yolunu göstermelidir.

**Eski Codex model refs yapılandırması kalıyor:** `openclaw doctor --fix`
çalıştırın. Doctor eski model refs değerlerini `openai/*` olarak yeniden yazar,
eski oturum ve tüm-agent runtime pin'lerini kaldırır ve mevcut auth-profile
geçersiz kılmalarını korur.

**App-server reddediliyor:** Codex app-server `0.125.0` veya daha yenisini
kullanın. `0.125.0-alpha.2` veya `0.125.0+custom` gibi aynı sürüm ön
sürümleri veya build ekli sürümler reddedilir, çünkü OpenClaw kararlı
`0.125.0` protokol tabanını test eder.

**`/codex status` bağlanamıyor:** paketli `codex` Plugin'inin etkin olduğunu,
bir allowlist yapılandırılmışsa `plugins.allow` değerinin onu içerdiğini ve özel
`appServer.command`, `url`, `authToken` veya header değerlerinin geçerli
olduğunu kontrol edin.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs`
değerini düşürün veya keşfi devre dışı bırakın. Bkz.
[Codex harness başvurusu](/tr/plugins/codex-harness-reference#model-discovery).

**WebSocket aktarımı hemen başarısız oluyor:** `appServer.url`, `authToken`,
header değerlerini ve uzak app-server'ın aynı Codex app-server protokol sürümünü
konuştuğunu kontrol edin.

**Yerel shell veya patch araçları `Native hook relay unavailable` ile
engelleniyor:** Codex iş parçacığı hâlâ OpenClaw'ın artık kayıtlı tutmadığı
yerel bir hook relay id kullanmaya çalışıyor. Bu yerel bir Codex hook aktarım
sorunudur; ACP backend, sağlayıcı, GitHub veya shell komutu hatası değildir.
Etkilenen sohbette `/new` veya `/reset` ile yeni bir oturum başlatın, ardından
zararsız bir komutu yeniden deneyin. Bu bir kez çalışıp bir sonraki yerel araç
çağrısı yine başarısız olursa, `/new` öğesini yalnızca geçici bir çözüm olarak
ele alın: eski iş parçacıklarının bırakılması ve yerel hook kayıtlarının yeniden
oluşturulması için Codex app-server veya OpenClaw Gateway yeniden başlatıldıktan
sonra istemi yeni bir oturuma kopyalayın.

**Codex olmayan bir model yerleşik harness'ı kullanıyor:** sağlayıcı veya model
runtime ilkesi onu başka bir harness'a yönlendirmedikçe bu beklenen durumdur.
Düz OpenAI dışı sağlayıcı refs değerleri `auto` modunda normal sağlayıcı
yollarında kalır.

**Bilgisayar Kullanımı yüklü ama araçlar çalışmıyor:** yeni bir oturumdan
`/codex computer-use status` komutunu kontrol edin. Bir araç
`Native hook relay unavailable` bildirirse yukarıdaki yerel hook relay kurtarmasını kullanın. Bkz.
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use#troubleshooting).

## İlgili

- [Codex harness başvurusu](/tr/plugins/codex-harness-reference)
- [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [Yerel Codex Plugin'leri](/tr/plugins/codex-native-plugins)
- [Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use)
- [Ajan çalışma zamanları](/tr/concepts/agent-runtimes)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [OpenAI Codex yardımı](https://help.openai.com/en/collections/14937394-codex)
- [Ajan harness Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Plugin hook'ları](/tr/plugins/hooks)
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics)
- [Durum](/tr/cli/status)
- [Test etme](/tr/help/testing-live#live-codex-app-server-harness-smoke)
