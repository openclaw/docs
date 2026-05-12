---
read_when:
    - Birlikte gelen Codex uygulama sunucusu çalıştırma düzeneğini kullanmak istiyorsunuz
    - Codex harness yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex dağıtımlarının PI'ye geri dönmek yerine başarısız olmasını istiyorsunuz
summary: OpenClaw gömülü ajan turlarını, birlikte gelen Codex app-server test düzeneği üzerinden çalıştırın
title: Codex çalıştırma düzeneği
x-i18n:
    generated_at: "2026-05-12T00:59:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 273572d7b7f3b6c57ddd0de38ce467463e9f1f0eab66dc7e2c38fa7679cb0359
    source_path: plugins/codex-harness.md
    workflow: 16
---

Birlikte gelen `codex` Plugin’i, OpenClaw’ın yerleşik PI harness’ı yerine Codex app-server üzerinden gömülü OpenAI agent turn’leri çalıştırmasını sağlar.

Codex’in düşük düzeyli agent oturumunu üstlenmesini istediğinizde Codex harness’ını kullanın:
native thread resume, native tool continuation, native compaction ve app-server execution. OpenClaw yine de sohbet kanallarını, oturum dosyalarını, model seçimini, OpenClaw dynamic tools’u, onayları, medya teslimini ve görünür transcript mirror’ı yönetir.

Normal kurulum `openai/gpt-5.5` gibi kanonik OpenAI model ref’lerini kullanır.
`openai-codex/gpt-*` model ref’lerini yapılandırmayın. OpenAI agent auth sırasını
`auth.order.openai` altına koyun; eski `openai-codex:*` profilleri ve
`auth.order.openai-codex` girdileri mevcut kurulumlar için desteklenmeye devam eder.

OpenClaw, Codex app-server thread’lerini Codex native code mode ve
code-mode-only etkin olarak başlatır. Bu, ertelenmiş/aranabilir OpenClaw dynamic tools’u
Codex’in kendi code execution ve tool-search yüzeyi içinde tutar; Codex’in üstüne
PI tarzı bir tool-search wrapper eklemez.

Daha geniş model/provider/runtime ayrımı için
[Agent runtimes](/tr/concepts/agent-runtimes) ile başlayın. Kısa versiyon şudur:
`openai/gpt-5.5` model ref’idir, `codex` runtime’dır ve Telegram,
Discord, Slack veya başka bir kanal iletişim yüzeyi olarak kalır.

## Gereksinimler

- Birlikte gelen `codex` Plugin’i kullanılabilir durumda olan OpenClaw.
- Yapılandırmanız `plugins.allow` kullanıyorsa `codex` ekleyin.
- Codex app-server `0.125.0` veya daha yeni. Birlikte gelen Plugin varsayılan olarak uyumlu
  bir Codex app-server ikilisini yönetir, bu yüzden `PATH` üzerindeki yerel `codex`
  komutları normal harness başlangıcını etkilemez.
- `openclaw models auth login --provider openai-codex` üzerinden,
  agent’ın Codex home’undaki bir app-server hesabı üzerinden veya açık bir Codex API-key
  auth profili üzerinden Codex auth kullanılabilir olmalıdır.

Auth önceliği, ortam yalıtımı, özel app-server komutları, model
discovery ve tüm yapılandırma alanları için
[Codex harness reference](/tr/plugins/codex-harness-reference) bölümüne bakın.

## Hızlı Başlangıç

OpenClaw’da Codex isteyen çoğu kullanıcı şu yolu ister: bir
ChatGPT/Codex aboneliğiyle oturum açın, birlikte gelen `codex` Plugin’ini etkinleştirin ve
kanonik bir `openai/gpt-*` model ref’i kullanın.

Codex OAuth ile oturum açın:

```bash
openclaw models auth login --provider openai-codex
```

Birlikte gelen `codex` Plugin’ini etkinleştirin ve bir OpenAI agent modeli seçin:

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

Plugin yapılandırmasını değiştirdikten sonra gateway’i yeniden başlatın. Mevcut bir sohbette zaten
oturum varsa, runtime değişikliklerini test etmeden önce `/new` veya `/reset` kullanın; böylece sonraki
turn harness’ı güncel yapılandırmadan çözer.

## Yapılandırma

Hızlı başlangıç yapılandırması, minimum uygulanabilir Codex harness yapılandırmasıdır. Codex
harness seçeneklerini OpenClaw yapılandırmasında ayarlayın ve CLI’yı yalnızca Codex auth için kullanın:

| Gereksinim                            | Ayarlanacak değer                                                                 | Konum                              |
| ------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------- |
| Harness’ı etkinleştirme               | `plugins.entries.codex.enabled: true`                                             | OpenClaw yapılandırması            |
| İzin listeli Plugin kurulumunu tutma  | `plugins.allow` içinde `codex` ekleyin                                            | OpenClaw yapılandırması            |
| OpenAI agent turn’lerini Codex’e yönlendirme | `agents.defaults.model` veya `agents.list[].model` olarak `openai/gpt-*`    | OpenClaw agent yapılandırması      |
| Codex OAuth ile oturum açma           | `openclaw models auth login --provider openai-codex`                              | CLI auth profili                   |
| Codex çalıştırmaları için API-key yedeği ekleme | `auth.order.openai` içinde abonelik auth sonrasında listelenen `openai:*` API-key profili | CLI auth profili + OpenClaw yapılandırması |
| Codex kullanılamadığında kapalı hata verme | Provider veya model `agentRuntime.id: "codex"`                               | OpenClaw model/provider yapılandırması |
| Doğrudan OpenAI API trafiği kullanma  | Normal OpenAI auth ile Provider veya model `agentRuntime.id: "pi"`                | OpenClaw model/provider yapılandırması |
| App-server davranışını ayarlama       | `plugins.entries.codex.config.appServer.*`                                        | Codex Plugin yapılandırması        |
| Native Codex Plugin uygulamalarını etkinleştirme | `plugins.entries.codex.config.codexPlugins.*`                              | Codex Plugin yapılandırması        |
| Codex Computer Use’u etkinleştirme    | `plugins.entries.codex.config.computerUse.*`                                      | Codex Plugin yapılandırması        |

Codex destekli OpenAI agent turn’leri için `openai/gpt-*` model ref’lerini kullanın.
Abonelik öncelikli/API-key yedekli sıralama için `auth.order.openai` tercih edin. Mevcut
`openai-codex:*` auth profilleri ve `auth.order.openai-codex` geçerli kalır, ancak
yeni `openai-codex/gpt-*` model ref’leri yazmayın.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Bu biçimde, her iki profil de `openai/gpt-*` agent turn’leri için Codex üzerinden çalışmaya devam eder.
API anahtarı yalnızca bir auth fallback’tir; PI’a veya düz OpenAI Responses’a geçme isteği değildir.

Bu sayfanın geri kalanı kullanıcıların seçmesi gereken yaygın varyantları kapsar:
dağıtım biçimi, kapalı hata veren yönlendirme, guardian onay ilkesi, native Codex
plugins ve Computer Use. Tam seçenek listeleri, varsayılanlar, enum’lar, discovery,
ortam yalıtımı, zaman aşımları ve app-server transport alanları için
[Codex harness reference](/tr/plugins/codex-harness-reference) bölümüne bakın.

## Codex runtime’ını doğrulama

Codex beklediğiniz sohbette `/status` kullanın. Codex destekli bir OpenAI agent
turn’ü şunu gösterir:

```text
Runtime: OpenAI Codex
```

Ardından Codex app-server durumunu denetleyin:

```text
/codex status
/codex models
```

`/codex status` app-server bağlantısını, hesabı, rate limit’leri, MCP
servers’ı ve skills’i bildirir. `/codex models`, harness ve hesap için canlı Codex app-server kataloğunu listeler. `/status` beklenmedikse
[Sorun Giderme](#troubleshooting) bölümüne bakın.

## Yönlendirme ve model seçimi

Provider ref’lerini ve runtime ilkesini ayrı tutun:

- Codex üzerinden OpenAI agent turn’leri için `openai/gpt-*` kullanın.
- Yapılandırmada `openai-codex/gpt-*` kullanmayın. Eski ref’leri ve bayat session route pin’lerini
  onarmak için `openclaw doctor --fix` çalıştırın.
- `agentRuntime.id: "codex"` normal OpenAI otomatik modu için isteğe bağlıdır, ancak bir
  dağıtım Codex kullanılamadığında kapalı hata vermeliyse kullanışlıdır.
- `agentRuntime.id: "pi"` bir provider’ı veya modeli, bu amaçlandığında doğrudan PI davranışına alır.
- `/codex ...` sohbetten native Codex app-server konuşmalarını denetler.
- ACP/acpx ayrı bir external harness yoludur. Bunu yalnızca kullanıcı ACP/acpx veya external harness adapter istediğinde kullanın.

Yaygın komut yönlendirmesi:

| Kullanıcı amacı                   | Kullanılacak                             |
| --------------------------------- | ---------------------------------------- |
| Geçerli sohbeti ekleme            | `/codex bind [--cwd <path>]`             |
| Mevcut bir Codex thread’ini sürdürme | `/codex resume <thread-id>`           |
| Codex thread’lerini listeleme veya filtreleme | `/codex threads [filter]`      |
| Yalnızca Codex feedback gönderme  | `/codex diagnostics [note]`              |
| ACP/acpx görevi başlatma          | `/codex` değil, ACP/acpx oturum komutları |

| Kullanım durumu                                      | Yapılandırma                                                    | Doğrulama                               | Notlar                              |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Native Codex runtime ile ChatGPT/Codex aboneliği     | `openai/gpt-*` artı etkin `codex` Plugin’i                       | `/status`, `Runtime: OpenAI Codex` gösterir | Önerilen yol                       |
| Codex kullanılamadığında kapalı hata verme           | Provider veya model `agentRuntime.id: "codex"`                   | Turn, PI fallback yerine hata verir     | Codex-only dağıtımlar için kullanın |
| PI üzerinden doğrudan OpenAI API-key trafiği         | Provider veya model `agentRuntime.id: "pi"` ve normal OpenAI auth | `/status` PI runtime gösterir           | Yalnızca PI amaçlandığında kullanın |
| Eski yapılandırma                                    | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` bunu yeniden yazar | Yeni yapılandırmayı bu şekilde yazmayın |
| ACP/acpx Codex adapter                               | ACP `sessions_spawn({ runtime: "acp" })`                         | ACP task/session durumu                 | Native Codex harness’tan ayrıdır   |

`agents.defaults.imageModel` aynı prefix ayrımını izler. Normal OpenAI yolu için
`openai/gpt-*` kullanın; image understanding’in sınırlı bir Codex app-server turn’ü üzerinden
çalışması gerektiğinde yalnızca `codex/gpt-*` kullanın. `openai-codex/gpt-*`
kullanmayın; doctor bu eski prefix’i `openai/gpt-*` olarak yeniden yazar.

## Dağıtım desenleri

### Temel Codex dağıtımı

Tüm OpenAI agent turn’leri varsayılan olarak Codex kullanmalıysa hızlı başlangıç yapılandırmasını kullanın.

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

### Karma provider dağıtımı

Bu biçim Claude’u varsayılan agent olarak tutar ve adlandırılmış bir Codex agent ekler:

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

Bu yapılandırmayla `main` agent normal provider yolunu, `codex` agent ise Codex app-server’ı kullanır.

### Kapalı hata veren Codex dağıtımı

OpenAI agent turn’leri için `openai/gpt-*`, birlikte gelen Plugin kullanılabilir olduğunda zaten Codex’e çözümlenir. Yazılı bir kapalı hata kuralı istediğinizde açık runtime ilkesi ekleyin:

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

Codex zorunlu kılındığında, Codex Plugin’i devre dışıysa, app-server çok eskiyse veya app-server başlatılamıyorsa OpenClaw erken hata verir.

## App-server ilkesi

Varsayılan olarak Plugin, OpenClaw’ın yönettiği Codex ikilisini stdio
transport ile yerel olarak başlatır. `appServer.command` değerini yalnızca bilinçli olarak farklı bir
çalıştırılabilir dosya çalıştırmak istediğinizde ayarlayın. WebSocket transport’u yalnızca başka bir yerde zaten
çalışan bir app-server varsa kullanın:

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

Yerel stdio app-server oturumları, varsayılan olarak güvenilir yerel operatör yaklaşımını kullanır:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Yerel Codex gereksinimleri bu
örtük YOLO yaklaşımına izin vermiyorsa OpenClaw bunun yerine izin verilen guardian izinlerini seçer.
Oturum için bir OpenClaw sandbox'ı etkin olduğunda OpenClaw, yerel Codex kod modu dönüşlerinin
sandbox uygulanmış çalışma alanı içinde kalması için Codex
`danger-full-access` değerini Codex `workspace-write` değerine daraltır.

Sandbox dışına çıkmadan veya ek izinler almadan önce Codex yerel otomatik incelemesi istediğinizde guardian modunu kullanın:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Guardian modu, yerel gereksinimler bu değerlere izin verdiğinde genellikle
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` ve
`sandbox: "workspace-write"` değerleriyle Codex app-server onaylarına genişler.

Her app-server alanı, kimlik doğrulama sırası, ortam yalıtımı, keşif ve
zaman aşımı davranışı için [Codex harness başvurusu](/tr/plugins/codex-harness-reference) sayfasına bakın.

## Komutlar ve tanılama

Paketle gelen Plugin, OpenClaw metin komutlarını destekleyen herhangi bir kanalda
`/codex` komutunu slash command olarak kaydeder.

Yaygın biçimler:

- `/codex status` app-server bağlantısını, modelleri, hesabı, hız sınırlarını,
  MCP sunucularını ve skills'i denetler.
- `/codex models` canlı Codex app-server modellerini listeler.
- `/codex threads [filter]` son Codex app-server iş parçacıklarını listeler.
- `/codex resume <thread-id>` geçerli OpenClaw oturumunu mevcut bir
  Codex iş parçacığına ekler.
- `/codex compact` Codex app-server'dan ekli iş parçacığını sıkıştırmasını ister.
- `/codex review` ekli iş parçacığı için Codex yerel incelemesini başlatır.
- `/codex diagnostics [note]` ekli iş parçacığı için Codex geri bildirimi
  göndermeden önce sorar.
- `/codex account` hesap ve hız sınırı durumunu gösterir.
- `/codex mcp` Codex app-server MCP sunucusu durumunu listeler.
- `/codex skills` Codex app-server skills'ini listeler.

Çoğu destek raporu için hatanın gerçekleştiği konuşmada `/diagnostics [note]`
ile başlayın. Bu, bir Gateway tanılama raporu oluşturur ve Codex harness
oturumları için ilgili Codex geri bildirim paketini göndermek üzere onay ister.
Gizlilik modeli ve grup sohbeti davranışı için [Tanılama dışa aktarımı](/tr/gateway/diagnostics)
sayfasına bakın.

`/codex diagnostics [note]` komutunu yalnızca tam Gateway tanılama paketi olmadan,
özellikle geçerli olarak ekli iş parçacığı için Codex geri bildirimi yüklemesini
istediğinizde kullanın.

### Codex iş parçacıklarını yerelde inceleme

Sorunlu bir Codex çalıştırmasını incelemenin en hızlı yolu çoğu zaman yerel Codex
iş parçacığını doğrudan açmaktır:

```bash
codex resume <thread-id>
```

İş parçacığı kimliğini tamamlanmış `/diagnostics` yanıtından, `/codex binding` komutundan veya
`/codex threads [filter]` komutundan alın.

Yükleme mekanikleri ve çalışma zamanı düzeyindeki tanılama sınırları için
[Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime#codex-feedback-upload) sayfasına bakın.

Kimlik doğrulama şu sırayla seçilir:

1. Aracı için sıralanmış OpenAI kimlik doğrulama profilleri, tercihen
   `auth.order.openai` altında. Mevcut `openai-codex:*` profil kimlikleri geçerli kalır.
2. Bu aracının Codex home içindeki app-server'ın mevcut hesabı.
3. Yalnızca yerel stdio app-server başlatmaları için, app-server hesabı yoksa ve OpenAI kimlik doğrulaması
   hâlâ gerekiyorsa önce `CODEX_API_KEY`, sonra
   `OPENAI_API_KEY`.

OpenClaw, ChatGPT abonelik tarzı bir Codex kimlik doğrulama profili gördüğünde,
oluşturulan Codex alt sürecinden `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini kaldırır. Bu,
Gateway düzeyindeki API anahtarlarını embeddings veya doğrudan OpenAI modelleri
için kullanılabilir tutarken yerel Codex app-server dönüşlerinin yanlışlıkla API
üzerinden ücretlendirilmesini engeller. Açık Codex API anahtarı profilleri ve
yerel stdio ortam anahtarı fallback'i, devralınan alt süreç ortamı yerine
app-server oturum açmasını kullanır. WebSocket app-server bağlantıları Gateway
ortam API anahtarı fallback'ini almaz; açık bir kimlik doğrulama profili veya
uzak app-server'ın kendi hesabını kullanın.

Bir abonelik profili Codex kullanım sınırına ulaşırsa OpenClaw, Codex bildirdiğinde
sıfırlanma zamanını kaydeder ve aynı Codex çalıştırması için bir sonraki sıralı
kimlik doğrulama profilini dener. Sıfırlanma zamanı geçtiğinde abonelik profili,
seçili `openai/gpt-*` modeli veya Codex çalışma zamanı değiştirilmeden yeniden
uygun hâle gelir.

Bir dağıtım ek ortam yalıtımı gerektiriyorsa bu değişkenleri
`appServer.clearEnv` alanına ekleyin:

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

Codex dinamik araçları varsayılan olarak `searchable` yüklemeyi kullanır. OpenClaw,
Codex'in yerel çalışma alanı işlemlerini yineleyen dinamik araçları kullanıma sunmaz:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` ve `update_plan`. Mesajlaşma,
oturumlar, medya, cron, tarayıcı, nodes, gateway, `heartbeat_respond` ve
`web_search` gibi kalan OpenClaw entegrasyon araçları, `openclaw` ad alanı altında
Codex araç araması üzerinden kullanılabilir; böylece başlangıç modeli bağlamı
daha küçük kalır.
`sessions_yield` ve yalnızca mesaj aracı kaynak yanıtları doğrudan kalır çünkü bunlar
dönüş denetimi sözleşmeleridir. Heartbeat iş birliği talimatları, araç zaten
yüklenmemişse Codex'e heartbeat dönüşünü bitirmeden önce `heartbeat_respond`
aramasını söyler.

`codexDynamicToolsLoading: "direct"` değerini yalnızca ertelenmiş dinamik araçları
arayamayan özel bir Codex app-server'a bağlanırken veya tam araç yükünü hata ayıklarken ayarlayın.

Desteklenen üst düzey Codex Plugin alanları:

| Alan                       | Varsayılan     | Anlam                                                                                    |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | OpenClaw dinamik araçlarını doğrudan ilk Codex araç bağlamına koymak için `"direct"` kullanın. |
| `codexDynamicToolsExclude` | `[]`           | Codex app-server dönüşlerinden çıkarılacak ek OpenClaw dinamik araç adları.              |
| `codexPlugins`             | devre dışı     | Taşınmış kaynak kurulumlu seçilmiş Plugin'ler için yerel Codex Plugin/uygulama desteği.  |

Desteklenen `appServer` alanları:

| Alan                          | Varsayılan                                            | Anlam                                                                                                                                                                                                                                  |
| ----------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                             | `"stdio"` Codex'i oluşturur; `"websocket"` `url` adresine bağlanır.                                                                                                                                                                    |
| `command`                     | yönetilen Codex ikilisi                               | stdio transport için yürütülebilir dosya. Yönetilen ikiliyi kullanmak için ayarlamadan bırakın; yalnızca açık bir override için ayarlayın.                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`              | stdio transport için argümanlar.                                                                                                                                                                                                       |
| `url`                         | ayarlanmamış                                          | WebSocket app-server URL'si.                                                                                                                                                                                                           |
| `authToken`                   | ayarlanmamış                                          | WebSocket transport için Bearer token.                                                                                                                                                                                                 |
| `headers`                     | `{}`                                                  | Ek WebSocket başlıkları.                                                                                                                                                                                                               |
| `clearEnv`                    | `[]`                                                  | OpenClaw devralınan ortamını oluşturduktan sonra oluşturulan stdio app-server sürecinden kaldırılan ek ortam değişkeni adları. `CODEX_HOME` ve `HOME`, yerel başlatmalarda OpenClaw'ın aracı başına Codex yalıtımı için ayrılmıştır. |
| `requestTimeoutMs`            | `60000`                                               | app-server control-plane çağrıları için zaman aşımı.                                                                                                                                                                                   |
| `turnCompletionIdleTimeoutMs` | `60000`                                               | OpenClaw `turn/completed` için beklerken dönüş kapsamlı Codex app-server isteğinden sonraki sessiz pencere. Yavaş araç sonrası veya yalnızca durum sentezi aşamaları için bunu artırın.                                                |
| `mode`                        | yerel Codex gereksinimleri YOLO'ya izin vermediği sürece `"yolo"` | YOLO veya guardian tarafından incelenen yürütme için preset. `danger-full-access`, `never` onayı veya `user` reviewer içermeyen yerel stdio gereksinimleri, örtük varsayılanı guardian yapar.                                         |
| `approvalPolicy`              | `"never"` veya izin verilen bir guardian onay politikası | İş parçacığı başlatma/sürdürme/dönüş için gönderilen yerel Codex onay politikası. Guardian varsayılanları izin verildiğinde `"on-request"` değerini tercih eder.                                                                       |
| `sandbox`                     | `"danger-full-access"` veya izin verilen bir guardian sandbox'ı | İş parçacığı başlatma/sürdürme için gönderilen yerel Codex sandbox modu. Guardian varsayılanları izin verildiğinde `"workspace-write"` değerini, aksi hâlde `"read-only"` değerini tercih eder. Bir OpenClaw sandbox'ı etkin olduğunda `danger-full-access`, `"workspace-write"` değerine daraltılır. |
| `approvalsReviewer`           | `"user"` veya izin verilen bir guardian reviewer       | İzin verildiğinde Codex'in yerel onay istemlerini incelemesine izin vermek için `"auto_review"` kullanın; aksi hâlde `guardian_subagent` veya `user`. `guardian_subagent` eski bir alias olarak kalır.                                |
| `serviceTier`                 | ayarlanmamış                                          | İsteğe bağlı Codex app-server hizmet katmanı. `"priority"` hızlı mod yönlendirmeyi etkinleştirir, `"flex"` esnek işleme ister, `null` override'ı temizler ve eski `"fast"` değeri `"priority"` olarak kabul edilir.                     |

OpenClaw'ın sahip olduğu dinamik araç çağrıları, `appServer.requestTimeoutMs` değerinden bağımsız olarak sınırlandırılır: Codex `item/tool/call` istekleri varsayılan olarak 30 saniyelik bir OpenClaw watchdog kullanır. Pozitif bir çağrı başına `timeoutMs` argümanı, ilgili araca ait bütçeyi uzatır veya kısaltır. `image_generate` aracı, araç çağrısı kendi zaman aşımını sağlamadığında `agents.defaults.imageGenerationModel.timeoutMs` değerini de kullanır ve medya anlama `image` aracı `tools.media.image.timeoutSeconds` değerini veya 60 saniyelik medya varsayılanını kullanır. Dinamik araç bütçeleri 600000 ms ile sınırlandırılır. Zaman aşımında OpenClaw, desteklendiği yerlerde araç sinyalini iptal eder ve Codex'e başarısız bir dinamik araç yanıtı döndürür; böylece oturum `processing` durumunda kalmak yerine tur devam edebilir.

OpenClaw bir Codex tur kapsamlı uygulama sunucusu isteğine yanıt verdikten sonra, harness ayrıca Codex'in yerel turu `turn/completed` ile bitirmesini bekler. Uygulama sunucusu bu yanıttan sonra `appServer.turnCompletionIdleTimeoutMs` süresi boyunca sessiz kalırsa OpenClaw, en iyi çabayla Codex turunu keser, bir tanılama zaman aşımı kaydeder ve takip eden sohbet mesajlarının bayat bir yerel turun arkasında kuyruğa alınmaması için OpenClaw oturum hattını serbest bırakır. Aynı tur için `rawResponseItem/completed` dahil olmak üzere herhangi bir terminal olmayan bildirim, bu kısa watchdog'u devre dışı bırakır çünkü Codex turun hâlâ canlı olduğunu kanıtlamıştır; daha uzun terminal watchdog gerçekten takılı kalan turları korumaya devam eder. Zaman aşımı tanılamaları son uygulama sunucusu bildirim yöntemini ve ham asistan yanıt öğeleri için öğe türünü, rolü, kimliği ve sınırlandırılmış bir asistan metin önizlemesini içerir.

Ortam geçersiz kılmaları yerel test için kullanılabilir kalır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`, `appServer.command` ayarlanmadığında yönetilen ikiliyi atlar.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırıldı. Bunun yerine `plugins.entries.codex.config.appServer.mode: "guardian"` kullanın veya tek seferlik yerel test için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın. Yapılandırma, tekrarlanabilir dağıtımlar için tercih edilir çünkü Plugin davranışını Codex harness kurulumunun geri kalanıyla aynı incelenmiş dosyada tutar.

## Yerel Codex Plugin'leri

Yerel Codex Plugin desteği, OpenClaw harness turuyla aynı Codex iş parçacığında Codex uygulama sunucusunun kendi uygulama ve Plugin yeteneklerini kullanır. OpenClaw, Codex Plugin'lerini sentetik `codex_plugin_*` OpenClaw dinamik araçlarına çevirmez.

`codexPlugins` yalnızca yerel Codex harness'ını seçen oturumları etkiler. PI çalıştırmalarında, normal OpenAI sağlayıcı çalıştırmalarında, ACP konuşma bağlamalarında veya diğer harness'larda etkisi yoktur.

Asgari taşınmış yapılandırma:

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

İş parçacığı uygulama yapılandırması, OpenClaw bir Codex harness oturumu kurduğunda veya bayat bir Codex iş parçacığı bağlamasını değiştirdiğinde hesaplanır. Her turda yeniden hesaplanmaz. `codexPlugins` değiştirildikten sonra, gelecekteki Codex harness oturumlarının güncellenmiş uygulama kümesiyle başlaması için `/new`, `/reset` kullanın veya Gateway'i yeniden başlatın.

Geçiş uygunluğu, uygulama envanteri, yıkıcı eylem politikası, bilgi istemeleri ve yerel Plugin tanılamaları için bkz. [Yerel Codex Plugin'leri](/tr/plugins/codex-native-plugins).

## Computer Use

Computer Use kendi kurulum kılavuzunda ele alınır:
[Codex Computer Use](/tr/plugins/codex-computer-use).

Kısa hali: OpenClaw masaüstü denetim uygulamasını vendor olarak paketlemez veya masaüstü eylemlerini kendisi yürütmez. Codex uygulama sunucusunu hazırlar, `computer-use` MCP sunucusunun kullanılabilir olduğunu doğrular ve ardından Codex modundaki turlar sırasında yerel MCP araç çağrılarının sahibi olmayı Codex'e bırakır.

## Çalışma zamanı sınırları

Codex harness yalnızca düşük seviyeli gömülü ajan yürütücüsünü değiştirir.

- OpenClaw dinamik araçları desteklenir. Codex, OpenClaw'dan bu araçları yürütmesini ister; bu nedenle OpenClaw yürütme yolunda kalır.
- Codex'e yerel shell, patch, MCP ve yerel uygulama araçlarının sahibi Codex'tir. OpenClaw desteklenen röle aracılığıyla seçili yerel olayları gözlemleyebilir veya engelleyebilir, ancak yerel araç argümanlarını yeniden yazmaz.
- Yerel Compaction'ın sahibi Codex'tir. OpenClaw kanal geçmişi, arama, `/new`, `/reset` ve gelecekteki model veya harness değişimi için bir transkript aynası tutar.
- Medya üretimi, medya anlama, TTS, onaylar ve mesajlaşma aracı çıktısı, eşleşen OpenClaw sağlayıcı/model ayarları üzerinden devam eder.
- `tool_result_persist`, Codex'e yerel araç sonucu kayıtlarına değil, OpenClaw'a ait transkript araç sonuçlarına uygulanır.

Kanca katmanları, desteklenen V1 yüzeyleri, yerel izin işleme, kuyruk yönlendirme, Codex geri bildirim yükleme mekanikleri ve Compaction ayrıntıları için bkz. [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime).

## Sorun giderme

**Codex normal bir `/model` sağlayıcısı olarak görünmüyor:** bu, yeni yapılandırmalar için beklenen durumdur. Bir `openai/gpt-*` modeli seçin, `plugins.entries.codex.enabled` değerini etkinleştirin ve `plugins.allow` değerinin `codex` öğesini dışlayıp dışlamadığını kontrol edin.

**OpenClaw, Codex yerine PI kullanıyor:** model ref'inin resmi OpenAI sağlayıcısında `openai/gpt-*` olduğundan ve Codex Plugin'inin kurulu ve etkin olduğundan emin olun. Test sırasında katı kanıt gerekiyorsa sağlayıcı veya model `agentRuntime.id: "codex"` ayarını yapın. Zorunlu Codex çalışma zamanı PI'ya geri dönmek yerine başarısız olur.

**Eski `openai-codex/*` yapılandırması kalmış:** `openclaw doctor --fix` çalıştırın. Doctor eski model ref'lerini `openai/*` olarak yeniden yazar, bayat oturum ve tüm ajan çalışma zamanı pinlerini kaldırır ve mevcut kimlik doğrulama profili geçersiz kılmalarını korur.

**Uygulama sunucusu reddediliyor:** Codex uygulama sunucusu `0.125.0` veya daha yenisini kullanın. `0.125.0-alpha.2` veya `0.125.0+custom` gibi aynı sürüm ön sürümleri ya da derleme sonekli sürümler reddedilir çünkü OpenClaw kararlı `0.125.0` protokol tabanını test eder.

**`/codex status` bağlanamıyor:** paketlenmiş `codex` Plugin'inin etkin olduğunu, izin listesi yapılandırıldığında `plugins.allow` değerinin onu içerdiğini ve özel `appServer.command`, `url`, `authToken` veya üstbilgilerin geçerli olduğunu kontrol edin.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs` değerini düşürün veya keşfi devre dışı bırakın. Bkz. [Codex harness başvurusu](/tr/plugins/codex-harness-reference#model-discovery).

**WebSocket aktarımı hemen başarısız oluyor:** `appServer.url`, `authToken`, üstbilgiler ve uzak uygulama sunucusunun aynı Codex uygulama sunucusu protokol sürümünü konuştuğunu kontrol edin.

**Codex olmayan bir model PI kullanıyor:** sağlayıcı veya model çalışma zamanı politikası onu başka bir harness'a yönlendirmediği sürece bu beklenen durumdur. Düz OpenAI olmayan sağlayıcı ref'leri `auto` modunda kendi normal sağlayıcı yolunda kalır.

**Computer Use kurulu ama araçlar çalışmıyor:** yeni bir oturumdan `/codex computer-use status` kontrol edin. Bir araç `Native hook relay unavailable` bildirirse `/new` veya `/reset` kullanın; devam ederse bayat yerel kanca kayıtlarını temizlemek için Gateway'i yeniden başlatın. Bkz. [Codex Computer Use](/tr/plugins/codex-computer-use#troubleshooting).

## İlgili

- [Codex harness başvurusu](/tr/plugins/codex-harness-reference)
- [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [Yerel Codex Plugin'leri](/tr/plugins/codex-native-plugins)
- [Codex Computer Use](/tr/plugins/codex-computer-use)
- [Ajan çalışma zamanları](/tr/concepts/agent-runtimes)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [Ajan harness Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Plugin kancaları](/tr/plugins/hooks)
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics)
- [Durum](/tr/cli/status)
- [Test](/tr/help/testing-live#live-codex-app-server-harness-smoke)
