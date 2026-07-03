---
read_when:
    - Paketle birlikte gelen Codex app-server test düzeneğini kullanmak istiyorsunuz
    - Codex harness yapılandırma örneklerine ihtiyacınız var
    - Codex’e özel dağıtımların OpenClaw’a geri dönmek yerine başarısız olmasını istiyorsunuz
summary: Paketle birlikte gelen Codex app-server test düzeneği üzerinden OpenClaw gömülü ajan turlarını çalıştırın
title: Codex harness
x-i18n:
    generated_at: "2026-07-03T17:36:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589aed06678207b3349c17dd1997c2d17abd5f4b8747fc18fd858b5a03a2d003
    source_path: plugins/codex-harness.md
    workflow: 16
---

Paketle gelen `codex` Plugin'i, OpenClaw'ın yerleşik OpenClaw çalıştırma düzeneği yerine Codex app-server üzerinden gömülü OpenAI aracı turları çalıştırmasını sağlar.

Düşük seviyeli aracı oturumunu Codex'in yönetmesini istediğinizde Codex çalıştırma düzeneğini kullanın: yerel iş parçacığı sürdürme, yerel araç devamı, yerel Compaction ve app-server yürütmesi. OpenClaw sohbet kanallarını, oturum dosyalarını, model seçimini, OpenClaw dinamik araçlarını, onayları, medya teslimini ve görünür döküm aynasını yönetmeye devam eder.

Normal kurulum, `openai/gpt-5.5` gibi kanonik OpenAI model başvuruları kullanır. Eski Codex GPT başvurularını yapılandırmayın. OpenAI aracı kimlik doğrulama sırasını `auth.order.openai` altına koyun; daha eski eski Codex kimlik doğrulama profil kimlikleri ve eski Codex kimlik doğrulama sıra girdileri, `openclaw doctor --fix` tarafından onarılan eski durumdur.

Etkin bir OpenClaw korumalı alanı yokken OpenClaw, code-mode-only varsayılan olarak kapalı kalırken Codex app-server iş parçacıklarını Codex yerel kod modu etkin şekilde başlatır. Bu, Codex yerel çalışma alanını ve kod yeteneklerini kullanılabilir tutarken OpenClaw dinamik araçlarının app-server `item/tool/call` köprüsü üzerinden devam etmesini sağlar. Etkin OpenClaw korumalı alanı ve kısıtlanmış araç ilkeleri, deneysel korumalı alan exec-server yolunu seçmediğiniz sürece yerel kod modunu tamamen devre dışı bırakır.

Bu Codex yerel özelliği, farklı bir `exec` girdi şekline sahip genel OpenClaw çalıştırmaları için isteğe bağlı bir QuickJS-WASI çalışma zamanı olan [OpenClaw kod modu](/tr/reference/code-mode) özelliğinden ayrıdır.

Daha geniş model/sağlayıcı/çalışma zamanı ayrımı için [Aracı çalışma zamanları](/tr/concepts/agent-runtimes) ile başlayın. Kısa sürüm şudur: `openai/gpt-5.5` model başvurusudur, `codex` çalışma zamanıdır ve Telegram, Discord, Slack veya başka bir kanal iletişim yüzeyi olarak kalır.

## Gereksinimler

- Paketle gelen `codex` Plugin'i kullanılabilir olan OpenClaw.
- Yapılandırmanız `plugins.allow` kullanıyorsa `codex` değerini ekleyin.
- Codex app-server `0.125.0` veya daha yeni. Paketle gelen Plugin, varsayılan olarak uyumlu bir Codex app-server ikili dosyasını yönetir; bu yüzden `PATH` üzerindeki yerel `codex` komutları normal çalıştırma düzeneği başlangıcını etkilemez.
- `openclaw models auth login --provider openai` üzerinden, aracının Codex home dizinindeki bir app-server hesabı üzerinden veya açık bir Codex API anahtarı kimlik doğrulama profili üzerinden Codex kimlik doğrulamasının kullanılabilir olması.

Kimlik doğrulama önceliği, ortam yalıtımı, özel app-server komutları, model keşfi ve tüm yapılandırma alanları için [Codex çalıştırma düzeneği başvurusu](/tr/plugins/codex-harness-reference) bölümüne bakın.

## Hızlı başlangıç

OpenClaw içinde Codex isteyen çoğu kullanıcı şu yolu ister: bir ChatGPT/Codex aboneliğiyle oturum açın, paketle gelen `codex` Plugin'ini etkinleştirin ve kanonik bir `openai/gpt-*` model başvurusu kullanın.

Codex OAuth ile oturum açın:

```bash
openclaw models auth login --provider openai
```

Paketle gelen `codex` Plugin'ini etkinleştirin ve bir OpenAI aracı modeli seçin:

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

Plugin yapılandırmasını değiştirdikten sonra Gateway'i yeniden başlatın. Mevcut bir sohbette zaten oturum varsa, çalışma zamanı değişikliklerini test etmeden önce `/new` veya `/reset` kullanın; böylece sonraki tur çalıştırma düzeneğini güncel yapılandırmadan çözer.

## Yapılandırma

Hızlı başlangıç yapılandırması, minimum uygulanabilir Codex çalıştırma düzeneği yapılandırmasıdır. Codex çalıştırma düzeneği seçeneklerini OpenClaw yapılandırmasında ayarlayın ve CLI'yi yalnızca Codex kimlik doğrulaması için kullanın:

| İhtiyaç                                | Ayar                                                                             | Yer                                |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Çalıştırma düzeneğini etkinleştirme    | `plugins.entries.codex.enabled: true`                                            | OpenClaw yapılandırması            |
| İzin listesine alınmış Plugin kurulumunu koruma | `plugins.allow` içine `codex` ekleyin                                            | OpenClaw yapılandırması            |
| OpenAI aracı turlarını Codex üzerinden yönlendirme | `agents.defaults.model` veya `agents.list[].model` için `openai/gpt-*`           | OpenClaw aracı yapılandırması      |
| ChatGPT/Codex OAuth ile oturum açma    | `openclaw models auth login --provider openai`                                   | CLI kimlik doğrulama profili       |
| Codex çalıştırmaları için API anahtarı yedeği ekleme | `auth.order.openai` içinde abonelik kimlik doğrulamasından sonra listelenen `openai:*` API anahtarı profili | CLI kimlik doğrulama profili + OpenClaw yapılandırması |
| Codex kullanılamadığında kapalı başarısız olma | Sağlayıcı veya model `agentRuntime.id: "codex"`                                  | OpenClaw model/sağlayıcı yapılandırması |
| Doğrudan OpenAI API trafiği kullanma   | Normal OpenAI kimlik doğrulamasıyla sağlayıcı veya model `agentRuntime.id: "openclaw"` | OpenClaw model/sağlayıcı yapılandırması |
| App-server davranışını ayarlama        | `plugins.entries.codex.config.appServer.*`                                       | Codex Plugin yapılandırması        |
| Yerel Codex Plugin uygulamalarını etkinleştirme | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex Plugin yapılandırması        |
| Codex Computer Use etkinleştirme       | `plugins.entries.codex.config.computerUse.*`                                     | Codex Plugin yapılandırması        |

Codex destekli OpenAI aracı turları için `openai/gpt-*` model başvurularını kullanın. Abonelik önce/API anahtarı yedeği sıralaması için `auth.order.openai` tercih edin. Mevcut eski Codex kimlik doğrulama profil kimlikleri ve eski Codex kimlik doğrulama sırası yalnızca doctor tarafından yönetilen eski durumdur; yeni eski Codex GPT başvuruları yazmayın.

Codex destekli aracılarda `compaction.model` veya `compaction.provider` ayarlamayın. Codex, kendi yerel app-server iş parçacığı durumu üzerinden Compaction yapar; bu nedenle OpenClaw bu yerel özetleyici geçersiz kılmalarını çalışma zamanında yok sayar ve aracı Codex kullandığında `openclaw doctor --fix` bunları kaldırır.

Lossless, Codex turları etrafında derleme, alım ve bakım için bağlam motoru olarak desteklenmeye devam eder. Bunu `agents.defaults.compaction.provider` üzerinden değil, `plugins.slots.contextEngine: "lossless-claw"` ve `plugins.entries.lossless-claw.config.summaryModel` üzerinden yapılandırın. Codex etkin çalışma zamanı olduğunda `openclaw doctor --fix`, eski `compaction.provider: "lossless-claw"` şeklini Lossless bağlam motoru yuvasına taşır; ancak yerel Codex yine de Compaction işlemini yönetir.

Yerel Codex app-server çalıştırma düzeneği, istem öncesi derleme gerektiren bağlam motorlarını destekler. `codex-cli` dahil genel CLI arka uçları bu ana makine yeteneğini sağlamaz.

Codex destekli aracılar için `/compact`, bağlı iş parçacığında yerel Codex app-server Compaction işlemini başlatır. OpenClaw tamamlanmayı beklemez, OpenClaw zaman aşımı uygulamaz, paylaşılan app-server'ı yeniden başlatmaz veya bir bağlam motoruna ya da genel OpenAI özetleyicisine geri dönmez. Yerel Codex iş parçacığı bağlaması eksik veya bayatsa komut kapalı başarısız olur; böylece operatör Compaction arka uçları arasında sessizce geçiş yapılması yerine gerçek çalışma zamanı sınırını görür.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Bu yapıda her iki profil de `openai/gpt-*` aracı turları için hâlâ Codex üzerinden çalışır. API anahtarı yalnızca bir kimlik doğrulama geri dönüşüdür; OpenClaw'a veya düz OpenAI Responses'a geçme isteği değildir.

Bu sayfanın geri kalanı, kullanıcıların seçmesi gereken yaygın varyantları kapsar: dağıtım şekli, kapalı başarısız yönlendirme, koruyucu onay ilkesi, yerel Codex Plugin'leri ve Computer Use. Tam seçenek listeleri, varsayılanlar, enum'lar, keşif, ortam yalıtımı, zaman aşımları ve app-server taşıma alanları için [Codex çalıştırma düzeneği başvurusu](/tr/plugins/codex-harness-reference) bölümüne bakın.

## Codex çalışma zamanını doğrulama

Codex beklediğiniz sohbette `/status` kullanın. Codex destekli bir OpenAI aracı turu şunu gösterir:

```text
Runtime: OpenAI Codex
```

Ardından Codex app-server durumunu denetleyin:

```text
/codex status
/codex models
```

`/codex status`, app-server bağlantısını, hesabı, hız sınırlarını, MCP sunucularını ve Skills'i raporlar. `/codex models`, çalıştırma düzeneği ve hesap için canlı Codex app-server kataloğunu listeler. `/status` şaşırtıcıysa [Sorun giderme](#troubleshooting) bölümüne bakın.

## Yönlendirme ve model seçimi

Sağlayıcı başvurularını ve çalışma zamanı ilkesini ayrı tutun:

- Codex üzerinden OpenAI aracı turları için `openai/gpt-*` kullanın.
- Yapılandırmada eski Codex GPT başvuruları kullanmayın. Eski başvuruları ve bayat oturum rota sabitlemelerini onarmak için `openclaw doctor --fix` çalıştırın.
- `agentRuntime.id: "codex"` normal OpenAI otomatik modu için isteğe bağlıdır, ancak Codex kullanılamadığında bir dağıtımın kapalı başarısız olması gerektiğinde yararlıdır.
- `agentRuntime.id: "openclaw"`, kasıtlı olduğunda bir sağlayıcıyı veya modeli OpenClaw gömülü çalışma zamanına geçirir.
- `/codex ...`, sohbetten yerel Codex app-server konuşmalarını denetler.
- ACP/acpx ayrı bir harici çalıştırma düzeneği yoludur. Bunu yalnızca kullanıcı ACP/acpx veya harici bir çalıştırma düzeneği bağdaştırıcısı istediğinde kullanın.

Yaygın komut yönlendirmesi:

| Kullanıcı amacı                                      | Kullanım                                                                                              |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Geçerli sohbeti ekleme                               | `/codex bind [--cwd <path>]`                                                                          |
| Mevcut bir Codex iş parçacığını sürdürme             | `/codex resume <thread-id>`                                                                           |
| Codex iş parçacıklarını listeleme veya filtreleme    | `/codex threads [filter]`                                                                             |
| Yerel Codex Plugin'lerini listeleme                  | `/codex plugins list`                                                                                 |
| Yapılandırılmış yerel Codex Plugin'ini etkinleştirme veya devre dışı bırakma | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Eşleştirilmiş bir düğümde mevcut Codex CLI oturumunu ekleme | `/codex sessions --host <node> [filter]`, ardından `/codex resume <session-id> --host <node> --bind here` |
| Yalnızca Codex geri bildirimi gönderme               | `/codex diagnostics [note]`                                                                           |
| ACP/acpx görevi başlatma                             | ACP/acpx oturum komutları, `/codex` değil                                                             |

| Kullanım durumu                                     | Yapılandırma                                                          | Doğrulama                              | Notlar                                      |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------- |
| Yerel Codex çalışma zamanı ile ChatGPT/Codex aboneliği | Etkin `codex` Plugin'iyle birlikte `openai/gpt-*`                     | `/status`, `Runtime: OpenAI Codex` gösterir | Önerilen yol                                |
| Codex kullanılamıyorsa kapalı hata ver               | Sağlayıcı veya model `agentRuntime.id: "codex"`                       | Gömülü fallback yerine tur başarısız olur | Yalnızca Codex dağıtımları için kullanın    |
| Doğrudan OpenAI API anahtarı trafiğini OpenClaw üzerinden yönlendir | Sağlayıcı veya model `agentRuntime.id: "openclaw"` ve normal OpenAI kimlik doğrulaması | `/status`, OpenClaw çalışma zamanını gösterir | Yalnızca OpenClaw bilinçli olarak isteniyorsa kullanın |
| Eski yapılandırma                                    | eski Codex GPT başvuruları                                             | `openclaw doctor --fix` bunu yeniden yazar | Yeni yapılandırmayı bu şekilde yazmayın     |
| ACP/acpx Codex bağdaştırıcısı                        | ACP `sessions_spawn({ runtime: "acp" })`                              | ACP görev/oturum durumu                 | Yerel Codex harness'ından ayrıdır           |

`agents.defaults.imageModel` aynı önek ayrımını izler. Normal OpenAI rotası için
`openai/gpt-*` kullanın; `codex/gpt-*` yalnızca görüntü anlama sınırlı bir Codex
app-server turu üzerinden çalışmalıysa kullanılmalıdır. Eski Codex GPT
başvurularını kullanmayın; doctor bu eski öneki `openai/gpt-*` olarak yeniden
yazar.

## Dağıtım kalıpları

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

Bu şekil Claude'u varsayılan ajan olarak tutar ve adlandırılmış bir Codex ajanı ekler:

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
app-server'ı kullanır.

### Kapalı hata veren Codex dağıtımı

OpenAI ajan turları için, paketlenmiş Plugin kullanılabiliyorsa `openai/gpt-*`
zaten Codex'e çözümlenir. Yazılı bir kapalı hata kuralı istediğinizde açık
çalışma zamanı ilkesi ekleyin:

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

Codex zorunlu kılındığında, Codex Plugin'i devre dışıysa, app-server çok eskiyse
veya app-server başlatılamıyorsa OpenClaw erken başarısız olur.

## App-server ilkesi

Varsayılan olarak Plugin, OpenClaw'ın yönettiği Codex ikilisini yerel olarak
stdio aktarımıyla başlatır. `appServer.command` değerini yalnızca bilinçli olarak
farklı bir yürütülebilir dosya çalıştırmak istediğinizde ayarlayın. WebSocket
aktarımını yalnızca bir app-server başka bir yerde zaten çalışıyorsa kullanın:

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

Yerel stdio app-server oturumları varsayılan olarak güvenilen yerel operatör
duruşunu kullanır: `approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Yerel Codex gereksinimleri bu örtük YOLO
duruşuna izin vermiyorsa OpenClaw bunun yerine izin verilen guardian izinlerini
seçer. Oturum için bir OpenClaw sandbox'ı etkin olduğunda OpenClaw, Codex
ana makine tarafı sandbox'ına güvenmek yerine o tur için Codex yerel Code Mode'u,
kullanıcı MCP sunucularını ve uygulama destekli Plugin yürütmesini devre dışı
bırakır. Kabuk erişimi, normal exec/process araçları kullanılabilir olduğunda
`sandbox_exec` ve `sandbox_process` gibi OpenClaw sandbox destekli dinamik
araçlar üzerinden sunulur.

Sandbox dışına çıkışlar veya ek izinlerden önce Codex yerel otomatik incelemesi
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

Codex app-server oturumları için OpenClaw, `tools.exec.mode: "auto"` değerini
Codex Guardian tarafından incelenen onaylara eşler; yerel gereksinimler bu
değerlere izin verdiğinde genellikle `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` ve `sandbox: "workspace-write"` kullanılır.
`tools.exec.mode: "auto"` içinde OpenClaw, eski güvenli olmayan Codex
`approvalPolicy: "never"` veya `sandbox: "danger-full-access"` geçersiz
kılmalarını korumaz; bilinçli bir onaysız Codex duruşu için
`tools.exec.mode: "full"` kullanın. Eski
`plugins.entries.codex.config.appServer.mode: "guardian"` ön ayarı hâlâ çalışır,
ancak `tools.exec.mode: "auto"` normalleştirilmiş OpenClaw yüzeyidir.

Ana makine exec onayları ve ACPX izinleriyle mod düzeyi karşılaştırma için
bkz. [İzin modları](/tr/tools/permission-modes).

Her app-server alanı, kimlik doğrulama sırası, ortam yalıtımı, keşif ve zaman
aşımı davranışı için bkz. [Codex harness başvurusu](/tr/plugins/codex-harness-reference).

## Komutlar ve tanılama

Paketlenmiş Plugin, OpenClaw metin komutlarını destekleyen herhangi bir kanalda
`/codex` komutunu slash command olarak kaydeder.

Yerel yürütme ve denetim bir sahip ya da `operator.admin` Gateway istemcisi
gerektirir. Buna iş parçacıklarını bağlama veya sürdürme, turları gönderme veya
durdurma, model, hızlı mod ya da izin durumunu değiştirme, sıkıştırma veya
inceleme ve bir bağı ayırma dahildir. Diğer yetkili göndericiler salt okunur
durum, yardım, hesap, model, iş parçacığı, MCP sunucusu, skill ve bağ inceleme
komutlarını korur.

Yaygın biçimler:

- `/codex status`, app-server bağlantısını, modelleri, hesabı, hız sınırlarını,
  MCP sunucularını ve skills'i denetler.
- `/codex models`, canlı Codex app-server modellerini listeler.
- `/codex threads [filter]`, son Codex app-server iş parçacıklarını listeler.
- `/codex resume <thread-id>`, geçerli OpenClaw oturumunu mevcut bir Codex iş
  parçacığına bağlar.
- `/codex compact`, Codex app-server'dan bağlı iş parçacığını sıkıştırmasını ister.
- `/codex review`, bağlı iş parçacığı için Codex yerel incelemesini başlatır.
- `/codex diagnostics [note]`, bağlı iş parçacığı için Codex geri bildirimi
  göndermeden önce sorar.
- `/codex account`, hesap ve hız sınırı durumunu gösterir.
- `/codex mcp`, Codex app-server MCP sunucusu durumunu listeler.
- `/codex skills`, Codex app-server skills'ini listeler.

Çoğu destek raporu için hatanın gerçekleştiği konuşmada `/diagnostics [note]`
ile başlayın. Bu, bir Gateway tanılama raporu oluşturur ve Codex harness
oturumları için ilgili Codex geri bildirim paketini göndermek üzere onay ister.
Gizlilik modeli ve grup sohbeti davranışı için bkz.
[Tanılama dışa aktarımı](/tr/gateway/diagnostics).

`/codex diagnostics [note]` komutunu yalnızca tam Gateway tanılama paketi
olmadan, o anda bağlı iş parçacığı için özellikle Codex geri bildirimi yüklemesi
istediğinizde kullanın.

### Codex iş parçacıklarını yerel olarak inceleme

Kötü bir Codex çalıştırmasını incelemenin en hızlı yolu çoğu zaman yerel Codex
iş parçacığını doğrudan açmaktır:

```bash
codex resume <thread-id>
```

İş parçacığı kimliğini tamamlanmış `/diagnostics` yanıtından, `/codex binding`
komutundan veya `/codex threads [filter]` çıktısından alın.

Yükleme mekanikleri ve çalışma zamanı düzeyindeki tanılama sınırları için bkz.
[Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime#codex-feedback-upload).

Kimlik doğrulama şu sırayla seçilir:

1. Ajan için sıralı OpenAI kimlik doğrulama profilleri; tercihen
   `auth.order.openai` altında. Daha eski eski Codex kimlik doğrulama profil
   kimliklerini ve eski Codex kimlik doğrulama sırasını taşımak için
   `openclaw doctor --fix` çalıştırın.
2. Bu ajanın Codex home dizinindeki app-server'ın mevcut hesabı.
3. Yalnızca yerel stdio app-server başlatmaları için, app-server hesabı yoksa ve
   OpenAI kimlik doğrulaması hâlâ gerekiyorsa `CODEX_API_KEY`, ardından
   `OPENAI_API_KEY`.

OpenClaw, ChatGPT aboneliği tarzında bir Codex kimlik doğrulama profili
gördüğünde, oluşturulan Codex alt işleminden `CODEX_API_KEY` ve `OPENAI_API_KEY`
değerlerini kaldırır. Bu, Gateway düzeyi API anahtarlarını embeddings veya
doğrudan OpenAI modelleri için kullanılabilir tutarken, yerel Codex app-server
turlarının yanlışlıkla API üzerinden ücretlendirilmesini engeller. Açık Codex
API anahtarı profilleri ve yerel stdio env-key fallback, devralınan alt işlem
ortamı yerine app-server oturum açmasını kullanır. WebSocket app-server
bağlantıları Gateway ortam API anahtarı fallback'i almaz; açık bir kimlik
doğrulama profili veya uzak app-server'ın kendi hesabını kullanın.
Yerel Codex Plugin'leri yapılandırıldığında OpenClaw, Plugin'e ait uygulamaları
Codex iş parçacığına sunmadan önce bu Plugin'leri bağlı app-server üzerinden
kurar veya yeniler. `app/list`, uygulama kimlikleri, erişilebilirlik ve meta
veriler için doğruluk kaynağı olmaya devam eder; ancak iş parçacığı başına
etkinleştirme kararının sahibi OpenClaw'dır: ilke listelenen erişilebilir bir
uygulamaya izin veriyorsa, `app/list` o uygulamayı şu anda devre dışı bildirse
bile OpenClaw `thread/start.config.apps[appId].enabled = true` gönderir. Bu yol,
bilinmeyen kimlikler için uygulama kurulumu icat etmez; OpenClaw yalnızca
marketplace Plugin'lerini `plugin/install` ile etkinleştirir ve ardından
envanteri yeniler.

Bir abonelik profili Codex kullanım sınırına takılırsa OpenClaw, Codex
bildirdiğinde sıfırlama zamanını kaydeder ve aynı Codex çalıştırması için sıradaki
kimlik doğrulama profilini dener. Sıfırlama zamanı geçtiğinde abonelik profili,
seçili `openai/gpt-*` modeli veya Codex çalışma zamanı değiştirilmeden yeniden
uygun hale gelir.

Yerel stdio app-server başlatmaları için OpenClaw, Codex yapılandırması,
kimlik doğrulama/hesap dosyaları, Plugin önbelleği/verileri ve yerel iş parçacığı
durumu varsayılan olarak operatörün kişisel `~/.codex` dizinini okuyup yazmasın
diye `CODEX_HOME` değerini ajan başına bir dizine ayarlar. OpenClaw normal işlem
`HOME` değerini korur; Codex tarafından çalıştırılan alt işlemler kullanıcı home
yapılandırmasını ve token'ları yine de bulabilir ve Codex paylaşılan
`$HOME/.agents/skills` ve `$HOME/.agents/plugins/marketplace.json` girdilerini
keşfedebilir.

Bir dağıtım ek ortam yalıtımı gerektiriyorsa bu değişkenleri `appServer.clearEnv`
değerine ekleyin:

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
OpenClaw, yerel başlatma normalleştirmesi sırasında `CODEX_HOME` ve `HOME`
değerlerini bu listeden kaldırır: `CODEX_HOME` ajan başına kalır, `HOME` ise alt
işlemlerin normal kullanıcı home durumunu kullanabilmesi için devralınmış kalır.

Codex dinamik araçları varsayılan olarak `searchable` yüklemeyi kullanır. OpenClaw, Codex’e özgü çalışma alanı işlemlerini çoğaltan dinamik araçları sunmaz: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` ve `update_plan`. Mesajlaşma, medya, Cron, tarayıcı, düğümler, Gateway ve `heartbeat_respond` gibi kalan çoğu OpenClaw entegrasyon aracı, `openclaw` ad alanı altında Codex araç araması üzerinden kullanılabilir; bu da başlangıç model bağlamını daha küçük tutar. Web araması, arama etkinleştirildiğinde ve yönetilen bir sağlayıcı seçilmediğinde varsayılan olarak Codex’in barındırılan `web_search` aracını kullanır. Yerel barındırılan arama ile OpenClaw’ın yönetilen `web_search` dinamik aracı birbirini dışlar; böylece yönetilen arama yerel alan adı kısıtlamalarını atlayamaz. Barındırılan arama kullanılamadığında, açıkça devre dışı bırakıldığında veya seçili bir yönetilen sağlayıcıyla değiştirildiğinde OpenClaw yönetilen aracı kullanır. OpenClaw, Codex’in bağımsız `web.run` uzantısını devre dışı tutar çünkü üretim uygulama sunucusu trafiği, kullanıcı tanımlı `web` ad alanını reddeder. `tools.web.search.enabled: false`, araçları devre dışı bırakılmış yalnızca LLM çalıştırmaları gibi her iki yolu da devre dışı bırakır. Codex, `"cached"` değerini bir tercih olarak ele alır ve kısıtlanmamış uygulama sunucusu turları için bunu canlı dış erişime çözümler. Yerel `allowedDomains` ayarlandığında otomatik yönetilen geri dönüş kapalı şekilde başarısız olur; böylece izin listesi atlanamaz. Kalıcı etkili arama politikası değişiklikleri, bir sonraki turdan önce bağlı Codex iş parçacığını döndürür. Geçici tur başına kısıtlamalar, geçici bir kısıtlı iş parçacığı kullanır ve daha sonra sürdürme için mevcut bağlamayı korur. `sessions_yield` ve yalnızca mesaj aracı kaynak yanıtları doğrudan kalır çünkü bunlar tur denetimi sözleşmeleridir. `sessions_spawn` aranabilir kalır; böylece Codex’in yerel `spawn_agent` yüzeyi birincil Codex alt ajan yüzeyi olmaya devam ederken, açık OpenClaw veya ACP delegasyonu `openclaw` dinamik araç ad alanı üzerinden hâlâ kullanılabilir. Heartbeat iş birliği talimatları, araç zaten yüklenmemişse bir Heartbeat turunu bitirmeden önce Codex’e `heartbeat_respond` aramasını söyler.

`codexDynamicToolsLoading: "direct"` değerini yalnızca ertelenmiş dinamik araçları arayamayan özel bir Codex uygulama sunucusuna bağlanırken veya tam araç yükünü hata ayıklarken ayarlayın.

Desteklenen üst düzey Codex Plugin alanları:

| Alan                       | Varsayılan     | Anlam                                                                                   |
| -------------------------- | -------------- | --------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | OpenClaw dinamik araçlarını doğrudan başlangıç Codex araç bağlamına koymak için `"direct"` kullanın. |
| `codexDynamicToolsExclude` | `[]`           | Codex uygulama sunucusu turlarından çıkarılacak ek OpenClaw dinamik araç adları.        |
| `codexPlugins`             | devre dışı     | Taşınmış, kaynak kurulumlu küratörlü Plugin’ler için yerel Codex Plugin/uygulama desteği. |

Desteklenen `appServer` alanları:

| Alan                                          | Varsayılan                                            | Anlam                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` Codex'i başlatır; `"websocket"` `url` adresine bağlanır.                                                                                                                                                                                                                                                                                                                            |
| `command`                                     | yönetilen Codex ikilisi                               | stdio aktarımı için yürütülebilir dosya. Yönetilen ikiliyi kullanmak için ayarlamadan bırakın; yalnızca açık bir geçersiz kılma için ayarlayın.                                                                                                                                                                                                                                                |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio aktarımı için argümanlar.                                                                                                                                                                                                                                                                                                                                                                |
| `url`                                         | ayarlanmamış                                          | WebSocket app-server URL'si.                                                                                                                                                                                                                                                                                                                                                                   |
| `authToken`                                   | ayarlanmamış                                          | WebSocket aktarımı için Bearer tokenı. Değişmez bir dizeyi veya `${CODEX_APP_SERVER_TOKEN}` gibi SecretInput değerini kabul eder.                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Ek WebSocket üst bilgileri. Üst bilgi değerleri, değişmez dizeleri veya örneğin `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"` gibi SecretInput değerlerini kabul eder.                                                                                                                                                                                                       |
| `clearEnv`                                    | `[]`                                                   | OpenClaw devralınan ortamını oluşturduktan sonra başlatılan stdio app-server işleminden kaldırılan ek ortam değişkeni adları. OpenClaw, yerel başlatmalar için aracı başına `CODEX_HOME` ve devralınan `HOME` değerini korur.                                                                                                                                                                  |
| `codeModeOnly`                                | `false`                                                | Codex'in yalnızca kod modu araç yüzeyine dahil olun. OpenClaw dinamik araçları Codex ile kayıtlı kalır, böylece iç içe `tools.*` çağrıları app-server `item/tool/call` köprüsü üzerinden döner.                                                                                                                                                                                                 |
| `remoteWorkspaceRoot`                         | ayarlanmamış                                          | Uzak Codex app-server çalışma alanı kökü. Ayarlandığında OpenClaw, yerel çalışma alanı kökünü çözümlenen OpenClaw çalışma alanından çıkarır, bu uzak kök altında mevcut cwd sonekini korur ve yalnızca son app-server cwd değerini Codex'e gönderir. cwd çözümlenen OpenClaw çalışma alanı kökünün dışındaysa OpenClaw, uzak app-server'a gateway-yerel bir yol göndermek yerine kapalı durumda başarısız olur. |
| `requestTimeoutMs`                            | `60000`                                                | app-server kontrol düzlemi çağrıları için zaman aşımı.                                                                                                                                                                                                                                                                                                                                         |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex bir dönüşü kabul ettikten sonra veya dönüş kapsamlı bir app-server isteğinden sonra OpenClaw `turn/completed` beklerken kullanılan sessiz pencere.                                                                                                                                                                                                                                        |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw `turn/completed` beklerken araç devri, yerel araç tamamlanması, araç sonrası ham asistan ilerlemesi, ham akıl yürütme tamamlanması veya akıl yürütme ilerlemesinden sonra kullanılan tamamlama-boşta ve ilerleme koruması. Bunu, araç sonrası sentezin son asistan yayın bütçesinden daha uzun süre meşru şekilde sessiz kalabileceği güvenilir veya ağır iş yükleri için kullanın.    |
| `mode`                                        | yerel Codex gereksinimleri YOLO'ya izin vermediği sürece `"yolo"` | YOLO veya guardian tarafından incelenen yürütme için ön ayar. `danger-full-access`, `never` onayı veya `user` inceleyicisini atlayan yerel stdio gereksinimleri örtük varsayılanı guardian yapar.                                                                                                                                                                                               |
| `approvalPolicy`                              | `"never"` veya izin verilen bir guardian onay ilkesi   | İş parçacığı başlatma/sürdürme/dönüş için gönderilen yerel Codex onay ilkesi. Guardian varsayılanları, izin verildiğinde `"on-request"` değerini tercih eder.                                                                                                                                                                                                                                  |
| `sandbox`                                     | `"danger-full-access"` veya izin verilen bir guardian sandbox | İş parçacığı başlatma/sürdürme için gönderilen yerel Codex sandbox modu. Guardian varsayılanları, izin verildiğinde `"workspace-write"` değerini, aksi halde `"read-only"` değerini tercih eder. Bir OpenClaw sandbox'ı etkinken, `danger-full-access` dönüşleri OpenClaw sandbox çıkış ayarından türetilen ağ erişimiyle Codex `workspace-write` kullanır.                                  |
| `approvalsReviewer`                           | `"user"` veya izin verilen bir guardian inceleyici     | İzin verildiğinde Codex'in yerel onay istemlerini incelemesine izin vermek için `"auto_review"` kullanın; aksi halde `guardian_subagent` veya `user` kullanın. `guardian_subagent` eski bir takma ad olarak kalır.                                                                                                                                                                             |
| `serviceTier`                                 | ayarlanmamış                                          | İsteğe bağlı Codex app-server hizmet katmanı. `"priority"` hızlı mod yönlendirmesini etkinleştirir, `"flex"` flex işlemeyi ister, `null` geçersiz kılmayı temizler ve eski `"fast"` değeri `"priority"` olarak kabul edilir.                                                                                                                                                                  |
| `networkProxy`                                | devre dışı                                            | app-server komutları için Codex izin profili ağ kullanımına dahil olun. OpenClaw, seçilen `permissions.<profile>.network` yapılandırmasını tanımlar ve `sandbox` göndermek yerine `default_permissions` ile seçer.                                                                                                                                                                            |
| `experimental.sandboxExecServer`              | `false`                                                | Yerel Codex yürütmesinin etkin OpenClaw sandbox'ı içinde çalışabilmesi için Codex app-server 0.132.0 veya daha yenisiyle OpenClaw sandbox destekli Codex ortamı kaydeden önizleme isteğe bağlı katılımı.                                                                                                                                                                                       |

`appServer.networkProxy`, Codex sandbox sözleşmesini değiştirdiği için açıktır.
Etkinleştirildiğinde OpenClaw, oluşturulan izin profilinin Codex tarafından
yönetilen ağ kullanımını başlatabilmesi için Codex iş parçacığı yapılandırmasında
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

Normal app-server çalışma zamanı `danger-full-access` olacaksa `networkProxy`
etkinleştirmek, oluşturulan izin profili için çalışma alanı tarzı dosya sistemi
erişimi kullanır. Codex tarafından yönetilen ağ uygulaması sandbox'lı ağ
kullanımıdır; bu nedenle tam erişimli bir profil giden trafiği korumaz.
Alan girdileri `allow` veya `deny` kullanır; Unix soket girdileri Codex'in
`allow` veya `none` değerlerini kullanır.

OpenClaw'a ait dinamik araç çağrıları `appServer.requestTimeoutMs` değerinden bağımsız olarak sınırlandırılır: Codex `item/tool/call` istekleri varsayılan olarak 90 saniyelik bir OpenClaw watchdog kullanır. Pozitif bir çağrı başına `timeoutMs` argümanı, ilgili aracın bütçesini uzatır veya kısaltır. `image_generate` aracı, araç çağrısı kendi zaman aşımını sağlamadığında `agents.defaults.imageGenerationModel.timeoutMs` değerini, aksi halde 120 saniyelik görüntü oluşturma varsayılanını kullanır. Medya anlama `image` aracı `tools.media.image.timeoutSeconds` değerini veya 60 saniyelik medya varsayılanını kullanır. Görüntü anlama için bu zaman aşımı isteğin kendisine uygulanır ve önceki hazırlık çalışması nedeniyle azaltılmaz. Dinamik araç bütçeleri 600000 ms ile sınırlıdır. Zaman aşımında OpenClaw, desteklendiği yerde araç sinyalini iptal eder ve Codex'e başarısız bir dinamik araç yanıtı döndürür; böylece oturum `processing` durumunda bırakılmak yerine tur devam edebilir. Bu watchdog, dış dinamik `item/tool/call` bütçesidir; sağlayıcıya özgü istek zaman aşımları bu çağrının içinde çalışır ve kendi zaman aşımı semantiklerini korur.

Codex bir turu kabul ettikten ve OpenClaw tur kapsamlı bir app-server isteğine yanıt verdikten sonra harness, Codex'in mevcut turda ilerleme kaydetmesini ve sonunda yerel turu `turn/completed` ile bitirmesini bekler. App-server `appServer.turnCompletionIdleTimeoutMs` boyunca sessiz kalırsa OpenClaw en iyi çabayla Codex turunu keser, tanılama amaçlı bir zaman aşımı kaydeder ve takip eden sohbet iletilerinin eski bir yerel turun arkasında kuyruğa alınmaması için OpenClaw oturum hattını serbest bırakır. Aynı tur için çoğu terminal olmayan bildirim, Codex turun hâlâ canlı olduğunu kanıtladığı için bu kısa watchdog'u devreden çıkarır. Araç devirleri daha uzun bir araç sonrası boşta kalma bütçesi kullanır: OpenClaw bir `item/tool/call` yanıtı döndürdükten sonra, `commandExecution` gibi yerel araç öğeleri tamamlandıktan sonra, ham `custom_tool_call_output` tamamlanmalarından sonra ve araç sonrası ham asistan ilerlemesi, ham reasoning tamamlanmaları veya reasoning ilerlemesinden sonra. Koruma, yapılandırıldığında `appServer.postToolRawAssistantCompletionIdleTimeoutMs` değerini kullanır ve aksi halde varsayılan olarak beş dakika kullanır. Aynı araç sonrası bütçe, Codex bir sonraki mevcut tur olayını yaymadan önceki sessiz sentez penceresi için ilerleme watchdog'unu da uzatır. Hız sınırı güncellemeleri gibi genel app-server bildirimleri tur-boşta ilerlemesini sıfırlamaz. Reasoning tamamlanmaları, commentary `agentMessage` tamamlanmaları ve araç öncesi ham reasoning veya asistan ilerlemesi otomatik bir son yanıtla takip edilebilir; bu nedenle oturum hattını hemen serbest bırakmak yerine araç sonrası yanıt korumasını kullanırlar. Yalnızca son/commentary olmayan tamamlanmış `agentMessage` öğeleri ve araç öncesi ham asistan tamamlanmaları asistan-çıktısı serbest bırakmasını kurar: Codex daha sonra `turn/completed` olmadan sessiz kalırsa OpenClaw en iyi çabayla yerel turu keser ve oturum hattını serbest bırakır. Başka bir tur izlemesi bu serbest bırakma yarışını kazanırsa OpenClaw, hiçbir yerel istek, öğe veya dinamik araç tamamlanması etkin kalmadığında ve asistan-çıktısı serbest bırakması hâlâ en son tamamlanan öğeye ait olduğunda, daha sonra öğe tamamlanması yoksa tamamlanan son asistan öğesini yine de kabul eder. Bu, tamamlanan araç çalışmasından sonra turu yeniden oynatmadan son yanıtı koruyabilir. Kısmi asistan deltaları, eski önceki yanıtlar ve boş sonraki tamamlanmalar uygun değildir. Asistan, araç, etkin öğe veya yan etki kanıtı olmayan tur tamamlama boşta kalma zaman aşımları dahil yeniden oynatma açısından güvenli stdio app-server hataları, yeni bir app-server denemesinde bir kez yeniden denenir. Güvenli olmayan zaman aşımları takılı kalan app-server istemcisini yine de emekliye ayırır ve OpenClaw oturum hattını serbest bırakır. Ayrıca otomatik olarak yeniden oynatılmak yerine eski yerel thread bağlamasını temizler. Tamamlama-izleme zaman aşımları Codex'e özgü zaman aşımı metni gösterir: yeniden oynatma açısından güvenli durumlar yanıtın eksik olabileceğini söylerken, güvenli olmayan durumlar kullanıcıya yeniden denemeden önce mevcut durumu doğrulamasını söyler. Genel zaman aşımı tanılamaları son app-server bildirim yöntemi, ham asistan yanıt öğesi id/tür/rol, etkin istek/öğe sayıları ve kurulmuş izleme durumu gibi yapısal alanları içerir. Son bildirim ham asistan yanıt öğesiyse sınırlı bir asistan metin önizlemesi de içerirler. Ham prompt veya araç içeriği içermezler.

Ortam geçersiz kılmaları yerel test için kullanılabilir kalır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`, `appServer.command` ayarlanmamışsa yönetilen ikiliyi atlar.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırıldı. Bunun yerine `plugins.entries.codex.config.appServer.mode: "guardian"` kullanın veya tek seferlik yerel test için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın. Yapılandırma, tekrarlanabilir dağıtımlar için tercih edilir çünkü Plugin davranışını Codex harness kurulumunun geri kalanıyla aynı incelenen dosyada tutar.

## Yerel Codex Plugin'leri

Yerel Codex Plugin desteği, OpenClaw harness turuyla aynı Codex thread'inde Codex app-server'ın kendi uygulama ve Plugin yeteneklerini kullanır. OpenClaw, Codex Plugin'lerini sentetik `codex_plugin_*` OpenClaw dinamik araçlarına çevirmez.

`codexPlugins` yalnızca yerel Codex harness'ı seçen oturumları etkiler. Yerleşik harness çalıştırmalarına, normal OpenAI sağlayıcı çalıştırmalarına, ACP konuşma bağlamalarına veya diğer harness'lara etkisi yoktur.

En küçük taşınmış yapılandırma:

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

Thread uygulama yapılandırması, OpenClaw bir Codex harness oturumu kurduğunda veya eski bir Codex thread bağlamasını değiştirdiğinde hesaplanır. Her turda yeniden hesaplanmaz. `codexPlugins` değiştirildikten sonra, gelecekteki Codex harness oturumlarının güncellenmiş uygulama kümesiyle başlaması için `/new`, `/reset` kullanın veya Gateway'i yeniden başlatın.

Geçiş uygunluğu, uygulama envanteri, yıkıcı eylem ilkesi, elicitation'lar ve yerel Plugin tanılamaları için bkz. [Yerel Codex Plugin'leri](/tr/plugins/codex-native-plugins).

OpenAI tarafındaki uygulama ve Plugin erişimi, oturum açmış Codex hesabı ve Business ile Enterprise/Edu çalışma alanları için çalışma alanı uygulama denetimleri tarafından kontrol edilir. OpenAI'nin hesap ve çalışma alanı denetimi genel bakışı için bkz. [ChatGPT planınızla Codex kullanma](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Computer Use

Computer Use kendi kurulum rehberinde ele alınır:
[Codex Computer Use](/tr/plugins/codex-computer-use).

Kısa sürüm: OpenClaw masaüstü denetimi uygulamasını vendor etmez veya masaüstü eylemlerini kendisi yürütmez. Codex app-server'ı hazırlar, `computer-use` MCP sunucusunun kullanılabilir olduğunu doğrular ve ardından Codex modu turlarında yerel MCP araç çağrılarını Codex'in sahiplenmesine izin verir.

## Çalışma zamanı sınırları

Codex harness yalnızca düşük seviyeli gömülü agent yürütücüsünü değiştirir.

- OpenClaw dinamik araçları desteklenir. Codex, OpenClaw'dan bu araçları yürütmesini ister; bu nedenle OpenClaw yürütme yolunda kalır.
- Codex'e yerel shell, patch, MCP ve yerel uygulama araçları Codex'e aittir. OpenClaw, desteklenen relay üzerinden seçili yerel olayları gözlemleyebilir veya engelleyebilir, ancak yerel araç argümanlarını yeniden yazmaz.
- Codex yerel compaction'a sahiptir. OpenClaw kanal geçmişi, arama, `/new`, `/reset` ve gelecekteki model veya harness değiştirme için bir transcript aynası tutar, ancak Codex compaction'ını bir OpenClaw veya context-engine özetleyicisiyle değiştirmez.
- Medya oluşturma, medya anlama, TTS, onaylar ve mesajlaşma-aracı çıktısı eşleşen OpenClaw sağlayıcı/model ayarları üzerinden devam eder.
- `tool_result_persist`, Codex'e yerel araç sonuç kayıtlarına değil, OpenClaw'a ait transcript araç sonuçlarına uygulanır.

Hook katmanları, desteklenen V1 yüzeyleri, yerel izin işleme, kuyruk yönlendirme, Codex geri bildirim yükleme mekanikleri ve compaction ayrıntıları için bkz. [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime).

## Sorun giderme

**Codex normal bir `/model` sağlayıcısı olarak görünmüyor:** yeni yapılandırmalar için bu beklenen durumdur. Bir `openai/gpt-*` modeli seçin, `plugins.entries.codex.enabled` değerini etkinleştirin ve `plugins.allow` değerinin `codex` öğesini dışlayıp dışlamadığını kontrol edin.

**OpenClaw Codex yerine yerleşik harness'ı kullanıyor:** model ref'in resmi OpenAI sağlayıcısında `openai/gpt-*` olduğundan ve Codex Plugin'inin kurulu ve etkin olduğundan emin olun. Test sırasında kesin kanıta ihtiyacınız varsa sağlayıcı veya model için `agentRuntime.id: "codex"` ayarlayın. Zorlanmış bir Codex runtime'ı OpenClaw'a geri dönmek yerine başarısız olur.

**OpenAI Codex runtime API-key yoluna geri dönüyor:** modeli, runtime'ı, seçili sağlayıcıyı ve hatayı gösteren redakte edilmiş bir Gateway alıntısı toplayın. Etkilenen işbirlikçilerden bu salt okunur komutu OpenClaw ana makinelerinde çalıştırmalarını isteyin:

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

Yararlı alıntılar genellikle `openai/gpt-5.5` veya `openai/gpt-5.4`, `Runtime: OpenAI Codex`, `agentRuntime.id` veya `harnessRuntime`, `candidateProvider: "openai"` ve bir `401`, `Incorrect API key` ya da `No API key` sonucu içerir. Düzeltilmiş bir çalıştırma, düz OpenAI API-key hatası yerine OpenAI OAuth yolunu göstermelidir.

**Eski Codex model ref'leri yapılandırması kalıyor:** `openclaw doctor --fix` çalıştırın. Doctor eski model ref'lerini `openai/*` olarak yeniden yazar, eski oturum ve tüm agent runtime pinlerini kaldırır ve mevcut auth-profile geçersiz kılmalarını korur.

**App-server reddediliyor:** Codex app-server `0.125.0` veya daha yenisini kullanın. Aynı sürüm prerelease'leri veya `0.125.0-alpha.2` ya da `0.125.0+custom` gibi derleme sonekli sürümler reddedilir çünkü OpenClaw kararlı `0.125.0` protokol tabanını test eder.

**`/codex status` bağlanamıyor:** paketlenmiş `codex` Plugin'inin etkin olduğunu, bir izin listesi yapılandırıldığında `plugins.allow` değerinin onu içerdiğini ve özel `appServer.command`, `url`, `authToken` veya başlıkların geçerli olduğunu kontrol edin.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs` değerini düşürün veya keşfi devre dışı bırakın. Bkz. [Codex harness başvurusu](/tr/plugins/codex-harness-reference#model-discovery).

**WebSocket taşıması hemen başarısız oluyor:** `appServer.url`, `authToken`, başlıkları ve uzak app-server'ın aynı Codex app-server protokol sürümünü konuştuğunu kontrol edin.

**Yerel shell veya yama araçları `Native hook relay unavailable` ile engelleniyor:**
Codex iş parçacığı hâlâ OpenClaw'ın artık kayıtlı tutmadığı bir yerel hook relay kimliğini kullanmaya çalışıyor. Bu, bir ACP backend, sağlayıcı, GitHub veya shell komutu hatası değil; yerel Codex hook aktarımı sorunudur. Etkilenen sohbette `/new` veya `/reset` ile yeni bir oturum başlatın, ardından zararsız bir komutu yeniden deneyin. Bu bir kez çalışır ancak sonraki yerel araç çağrısı yeniden başarısız olursa, `/new` komutunu yalnızca geçici bir geçici çözüm olarak değerlendirin: eski iş parçacıklarının düşürülmesi ve yerel hook kayıtlarının yeniden oluşturulması için Codex app-server veya OpenClaw Gateway yeniden başlatıldıktan sonra istemi yeni bir oturuma kopyalayın.

**Codex olmayan bir model yerleşik harness kullanıyor:** sağlayıcı veya model çalışma zamanı ilkesi onu başka bir harness'e yönlendirmediği sürece bu beklenen bir durumdur. Düz non-OpenAI sağlayıcı başvuruları `auto` modunda normal sağlayıcı yollarında kalır.

**Computer Use yüklü ancak araçlar çalışmıyor:** yeni bir oturumdan `/codex computer-use status` komutunu kontrol edin. Bir araç `Native hook relay unavailable` bildirirse, yukarıdaki yerel hook relay kurtarmasını kullanın. Bkz. [Codex Computer Use](/tr/plugins/codex-computer-use#troubleshooting).

## İlgili

- [Codex harness başvurusu](/tr/plugins/codex-harness-reference)
- [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [Yerel Codex Plugin'leri](/tr/plugins/codex-native-plugins)
- [Codex Computer Use](/tr/plugins/codex-computer-use)
- [Ajan çalışma zamanları](/tr/concepts/agent-runtimes)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [OpenAI Codex yardımı](https://help.openai.com/en/collections/14937394-codex)
- [Ajan harness Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Plugin hook'ları](/tr/plugins/hooks)
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics)
- [Durum](/tr/cli/status)
- [Test etme](/tr/help/testing-live#live-codex-app-server-harness-smoke)
