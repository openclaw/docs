---
read_when:
    - Birlikte gelen Codex app-server koşumunu kullanmak istiyorsunuz
    - Codex harness yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex dağıtımlarının Pi'ye geri dönmek yerine başarısız olmasını istiyorsunuz
summary: OpenClaw gömülü ajan turlarını paketle gelen Codex app-server harness'ı üzerinden çalıştırın
title: Codex bağlayıcısı
x-i18n:
    generated_at: "2026-05-12T08:46:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62023998d817a557bd6434e3ab47f3b99b97fdea93a8984b78b7bd1738a61f92
    source_path: plugins/codex-harness.md
    workflow: 16
---

Paketle gelen `codex` Plugin, OpenClaw’ın yerleşik PI harness yerine
Codex app-server üzerinden gömülü OpenAI ajan dönüşleri çalıştırmasını sağlar.

Codex’in düşük seviyeli ajan oturumunu sahiplenmesini istediğinizde Codex harness kullanın:
yerel ileti dizisi sürdürme, yerel araç devamı, yerel compaction ve
app-server yürütmesi. OpenClaw yine de sohbet kanallarını, oturum dosyalarını, model
seçimini, OpenClaw dinamik araçlarını, onayları, medya teslimini ve görünür
transkript aynasını sahiplenir.

Normal kurulum `openai/gpt-5.5` gibi kanonik OpenAI model ref’lerini kullanır.
`openai-codex/gpt-*` model ref’leri yapılandırmayın. OpenAI ajan kimlik doğrulama sırasını
`auth.order.openai` altına koyun; daha eski `openai-codex:*` profilleri ve
`auth.order.openai-codex` girdileri mevcut kurulumlar için desteklenmeye devam eder.

OpenClaw, Codex app-server ileti dizilerini Codex yerel kod modu ve
yalnızca kod modu etkin olarak başlatır. Bu, ertelenmiş/aranabilir OpenClaw dinamik araçlarını
Codex’in üzerine PI tarzı bir araç arama sarmalayıcısı eklemek yerine
Codex’in kendi kod yürütme ve araç arama yüzeyi içinde tutar.

Daha geniş model/sağlayıcı/çalışma zamanı ayrımı için
[Ajan çalışma zamanları](/tr/concepts/agent-runtimes) ile başlayın. Kısa sürüm şudur:
`openai/gpt-5.5` model ref’tir, `codex` çalışma zamanıdır ve Telegram,
Discord, Slack veya başka bir kanal iletişim yüzeyi olarak kalır.

## Gereksinimler

- Paketle gelen `codex` Plugin’i kullanılabilir olan OpenClaw.
- Yapılandırmanız `plugins.allow` kullanıyorsa `codex` ekleyin.
- Codex app-server `0.125.0` veya daha yeni. Paketle gelen Plugin, varsayılan olarak uyumlu
  bir Codex app-server ikili dosyasını yönetir, bu nedenle `PATH` üzerindeki yerel `codex` komutları
  normal harness başlangıcını etkilemez.
- `openclaw models auth login --provider openai-codex` üzerinden kullanılabilir Codex kimlik doğrulaması,
  ajanın Codex ana dizininde bir app-server hesabı veya açık bir Codex API anahtarı
  kimlik doğrulama profili.

Kimlik doğrulama önceliği, ortam yalıtımı, özel app-server komutları, model
keşfi ve tüm yapılandırma alanları için bkz.
[Codex harness başvurusu](/tr/plugins/codex-harness-reference).

## Hızlı başlangıç

OpenClaw’da Codex isteyen çoğu kullanıcı şu yolu ister: bir
ChatGPT/Codex aboneliğiyle oturum açın, paketle gelen `codex` Plugin’i etkinleştirin ve
kanonik bir `openai/gpt-*` model ref’i kullanın.

Codex OAuth ile oturum açın:

```bash
openclaw models auth login --provider openai-codex
```

Paketle gelen `codex` Plugin’i etkinleştirin ve bir OpenAI ajan modeli seçin:

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

Yapılandırmanız `plugins.allow` kullanıyorsa buraya da `codex` ekleyin:

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

Plugin yapılandırmasını değiştirdikten sonra gateway’i yeniden başlatın. Mevcut bir sohbetin zaten
oturumu varsa, çalışma zamanı değişikliklerini test etmeden önce `/new` veya `/reset` kullanın;
böylece sonraki dönüş harness’i geçerli yapılandırmadan çözer.

## Yapılandırma

Hızlı başlangıç yapılandırması, minimum uygulanabilir Codex harness yapılandırmasıdır. Codex
harness seçeneklerini OpenClaw yapılandırmasında ayarlayın ve CLI’yi yalnızca Codex kimlik doğrulaması için kullanın:

| İhtiyaç                                | Ayar                                                                             | Yer                                |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Harness’i etkinleştir                  | `plugins.entries.codex.enabled: true`                                            | OpenClaw yapılandırması            |
| İzin listeli Plugin kurulumunu koru    | `plugins.allow` içine `codex` ekle                                               | OpenClaw yapılandırması            |
| OpenAI ajan dönüşlerini Codex üzerinden yönlendir | `agents.defaults.model` veya `agents.list[].model` değerini `openai/gpt-*` yap | OpenClaw ajan yapılandırması       |
| Codex OAuth ile oturum aç              | `openclaw models auth login --provider openai-codex`                             | CLI kimlik doğrulama profili       |
| Codex çalıştırmaları için API anahtarı yedeği ekle | `auth.order.openai` içinde abonelik kimlik doğrulamasından sonra listelenen `openai:*` API anahtarı profili | CLI kimlik doğrulama profili + OpenClaw yapılandırması |
| Codex kullanılamadığında kapalı başarısız ol | Sağlayıcı veya model `agentRuntime.id: "codex"`                                 | OpenClaw model/sağlayıcı yapılandırması |
| Doğrudan OpenAI API trafiği kullan     | Normal OpenAI kimlik doğrulamasıyla sağlayıcı veya model `agentRuntime.id: "pi"` | OpenClaw model/sağlayıcı yapılandırması |
| App-server davranışını ayarla          | `plugins.entries.codex.config.appServer.*`                                       | Codex Plugin yapılandırması        |
| Yerel Codex Plugin uygulamalarını etkinleştir | `plugins.entries.codex.config.codexPlugins.*`                                  | Codex Plugin yapılandırması        |
| Codex Computer Use’ı etkinleştir       | `plugins.entries.codex.config.computerUse.*`                                     | Codex Plugin yapılandırması        |

Codex destekli OpenAI ajan dönüşleri için `openai/gpt-*` model ref’lerini kullanın. Abonelik öncelikli/API anahtarı yedekli sıralama için
`auth.order.openai` tercih edin. Mevcut
`openai-codex:*` kimlik doğrulama profilleri ve `auth.order.openai-codex` geçerli kalır, ancak
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

Bu biçimde, her iki profil de `openai/gpt-*` ajan dönüşleri için yine Codex üzerinden çalışır.
API anahtarı yalnızca bir kimlik doğrulama yedeğidir; PI’ye veya
düz OpenAI Responses’a geçme isteği değildir.

Bu sayfanın geri kalanı kullanıcıların seçmesi gereken yaygın varyantları kapsar:
dağıtım biçimi, kapalı başarısız yönlendirme, koruyucu onay politikası, yerel Codex
Plugin’leri ve Computer Use. Tam seçenek listeleri, varsayılanlar, enum’lar, keşif,
ortam yalıtımı, zaman aşımları ve app-server taşıma alanları için bkz.
[Codex harness başvurusu](/tr/plugins/codex-harness-reference).

## Codex çalışma zamanını doğrulama

Codex beklediğiniz sohbette `/status` kullanın. Codex destekli bir OpenAI ajan
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
sunucularını ve skills’i raporlar. `/codex models`, harness ve hesap için canlı Codex app-server kataloğunu listeler.
`/status` şaşırtıcıysa bkz.
[Sorun giderme](#troubleshooting).

## Yönlendirme ve model seçimi

Sağlayıcı ref’lerini ve çalışma zamanı politikasını ayrı tutun:

- Codex üzerinden OpenAI ajan dönüşleri için `openai/gpt-*` kullanın.
- Yapılandırmada `openai-codex/gpt-*` kullanmayın. Eski ref’leri ve bayat oturum rota sabitlemelerini
  onarmak için `openclaw doctor --fix` çalıştırın.
- `agentRuntime.id: "codex"` normal OpenAI otomatik modu için isteğe bağlıdır, ancak
  bir dağıtımın Codex kullanılamadığında kapalı başarısız olması gerektiğinde kullanışlıdır.
- `agentRuntime.id: "pi"`, kasıtlı olduğunda bir sağlayıcıyı veya modeli doğrudan PI davranışına geçirir.
- `/codex ...`, sohbetten yerel Codex app-server konuşmalarını denetler.
- ACP/acpx ayrı bir harici harness yoludur. Bunu yalnızca kullanıcı ACP/acpx veya
  harici bir harness bağdaştırıcısı istediğinde kullanın.

Yaygın komut yönlendirme:

| Kullanıcı amacı                 | Kullanılacak                            |
| ------------------------------- | --------------------------------------- |
| Geçerli sohbeti ekle            | `/codex bind [--cwd <path>]`            |
| Mevcut bir Codex ileti dizisini sürdür | `/codex resume <thread-id>`       |
| Codex ileti dizilerini listele veya filtrele | `/codex threads [filter]`     |
| Yalnızca Codex geri bildirimi gönder | `/codex diagnostics [note]`       |
| Bir ACP/acpx görevi başlat      | ACP/acpx oturum komutları, `/codex` değil |

| Kullanım durumu                                      | Yapılandırma                                                     | Doğrulama                               | Notlar                              |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Yerel Codex çalışma zamanı ile ChatGPT/Codex aboneliği | `openai/gpt-*` artı etkin `codex` Plugin’i                     | `/status` şunu gösterir: `Runtime: OpenAI Codex` | Önerilen yol                       |
| Codex kullanılamadığında kapalı başarısız ol         | Sağlayıcı veya model `agentRuntime.id: "codex"`                  | Dönüş PI yedeği yerine başarısız olur   | Yalnızca Codex dağıtımları için kullanın |
| PI üzerinden doğrudan OpenAI API anahtarı trafiği    | Sağlayıcı veya model `agentRuntime.id: "pi"` ve normal OpenAI kimlik doğrulaması | `/status` PI çalışma zamanını gösterir | Yalnızca PI kasıtlı olduğunda kullanın |
| Eski yapılandırma                                    | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` bunu yeniden yazar | Yeni yapılandırmayı bu şekilde yazmayın |
| ACP/acpx Codex bağdaştırıcısı                        | ACP `sessions_spawn({ runtime: "acp" })`                         | ACP görev/oturum durumu                 | Yerel Codex harness’ten ayrıdır |

`agents.defaults.imageModel` aynı prefix ayrımını izler. Normal OpenAI rotası için `openai/gpt-*`
kullanın ve `codex/gpt-*` yalnızca görüntü anlamanın
sınırlı bir Codex app-server dönüşü üzerinden çalışması gerektiğinde kullanın.
`openai-codex/gpt-*` kullanmayın; doctor bu eski prefix’i `openai/gpt-*` olarak yeniden yazar.

## Dağıtım kalıpları

### Temel Codex dağıtımı

Tüm OpenAI ajan dönüşlerinin varsayılan olarak Codex kullanması gerektiğinde hızlı başlangıç yapılandırmasını kullanın.

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

Bu biçim Claude’u varsayılan ajan olarak tutar ve adlandırılmış bir Codex ajanı ekler:

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

Bu yapılandırmayla `main` ajanı normal sağlayıcı yolunu kullanır ve
`codex` ajanı Codex app-server kullanır.

### Kapalı başarısız Codex dağıtımı

OpenAI ajan dönüşleri için `openai/gpt-*`, paketle gelen Plugin kullanılabilir olduğunda zaten Codex’e çözümlenir.
Yazılı bir kapalı başarısız kuralı istediğinizde açık çalışma zamanı politikası ekleyin:

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

Codex zorlandığında, Codex Plugin devre dışıysa, app-server çok eskiyse veya
app-server başlatılamıyorsa OpenClaw erken başarısız olur.

## App-server politikası

Varsayılan olarak Plugin, OpenClaw’ın yönettiği Codex ikili dosyasını yerel olarak stdio
taşımasıyla başlatır. `appServer.command` değerini yalnızca kasıtlı olarak
farklı bir yürütülebilir dosya çalıştırmak istediğinizde ayarlayın. WebSocket taşımasını yalnızca bir app-server
başka bir yerde zaten çalışıyorsa kullanın:

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

Yerel stdio uygulama sunucusu oturumları, varsayılan olarak güvenilen yerel operatör duruşunu kullanır:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Yerel Codex gereksinimleri bu örtük YOLO
duruşuna izin vermiyorsa, OpenClaw bunun yerine izin verilen koruyucu izinleri
seçer. Oturum için bir OpenClaw sandbox'ı etkin olduğunda, OpenClaw yerel Codex
kod modu turlarının sandbox uygulanmış çalışma alanının içinde kalması için
Codex `danger-full-access` değerini Codex `workspace-write` değerine daraltır.

Sandbox dışına çıkışlardan veya ek izinlerden önce Codex yerel otomatik
incelemesi istediğinizde koruyucu modu kullanın:

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

Koruyucu mod, yerel gereksinimler bu değerlere izin verdiğinde genellikle
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` ve
`sandbox: "workspace-write"` olarak Codex uygulama sunucusu onaylarına genişler.

Her uygulama sunucusu alanı, kimlik doğrulama sırası, ortam yalıtımı, keşif ve
zaman aşımı davranışı için bkz. [Codex harness başvurusu](/tr/plugins/codex-harness-reference).

## Komutlar ve tanılama

Paketlenen Plugin, OpenClaw metin komutlarını destekleyen her kanalda eğik çizgi
komutu olarak `/codex` komutunu kaydeder.

Yaygın biçimler:

- `/codex status` uygulama sunucusu bağlantısını, modelleri, hesabı, oran sınırlarını,
  MCP sunucularını ve Skills'i denetler.
- `/codex models` canlı Codex uygulama sunucusu modellerini listeler.
- `/codex threads [filter]` son Codex uygulama sunucusu iş parçacıklarını listeler.
- `/codex resume <thread-id>` geçerli OpenClaw oturumunu mevcut bir Codex iş
  parçacığına bağlar.
- `/codex compact` Codex uygulama sunucusundan bağlı iş parçacığını sıkıştırmasını ister.
- `/codex review` bağlı iş parçacığı için Codex yerel incelemesini başlatır.
- `/codex diagnostics [note]` bağlı iş parçacığı için Codex geri bildirimi
  göndermeden önce onay ister.
- `/codex account` hesap ve oran sınırı durumunu gösterir.
- `/codex mcp` Codex uygulama sunucusu MCP sunucusu durumunu listeler.
- `/codex skills` Codex uygulama sunucusu Skills'ini listeler.

Çoğu destek raporu için, hatanın gerçekleştiği konuşmada `/diagnostics [note]`
ile başlayın. Bu, bir Gateway tanılama raporu oluşturur ve Codex harness
oturumları için ilgili Codex geri bildirim paketini göndermek üzere onay ister.
Gizlilik modeli ve grup sohbeti davranışı için bkz.
[Tanılama dışa aktarımı](/tr/gateway/diagnostics).

Tam Gateway tanılama paketi olmadan yalnızca şu anda bağlı iş parçacığı için
Codex geri bildirimi yüklemesini özellikle istediğinizde `/codex diagnostics [note]`
komutunu kullanın.

### Codex iş parçacıklarını yerel olarak inceleyin

Sorunlu bir Codex çalıştırmasını incelemenin en hızlı yolu çoğu zaman yerel
Codex iş parçacığını doğrudan açmaktır:

```bash
codex resume <thread-id>
```

İş parçacığı kimliğini tamamlanan `/diagnostics` yanıtından, `/codex binding`
komutundan veya `/codex threads [filter]` çıktısından alın.

Yükleme mekaniği ve çalışma zamanı düzeyindeki tanılama sınırları için bkz.
[Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime#codex-feedback-upload).

Kimlik doğrulama şu sırayla seçilir:

1. Aracı için sıralı OpenAI kimlik doğrulama profilleri; tercihen
   `auth.order.openai` altında. Mevcut `openai-codex:*` profil kimlikleri geçerli kalır.
2. Bu aracının Codex ana dizinindeki uygulama sunucusunun mevcut hesabı.
3. Yalnızca yerel stdio uygulama sunucusu başlatmaları için, uygulama sunucusu
   hesabı yoksa ve OpenAI kimlik doğrulaması hâlâ gerekiyorsa önce
   `CODEX_API_KEY`, ardından `OPENAI_API_KEY`.

OpenClaw bir ChatGPT abonelik tarzı Codex kimlik doğrulama profili gördüğünde,
oluşturulan Codex alt sürecinden `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini
kaldırır. Bu, Gateway düzeyindeki API anahtarlarını embedding'ler veya doğrudan
OpenAI modelleri için kullanılabilir tutarken yerel Codex uygulama sunucusu
turlarının yanlışlıkla API üzerinden ücretlendirilmesini engeller. Açık Codex
API anahtarı profilleri ve yerel stdio ortam anahtarı geri dönüşü, devralınan
alt süreç ortamı yerine uygulama sunucusu oturum açmasını kullanır. WebSocket
uygulama sunucusu bağlantıları Gateway ortam API anahtarı geri dönüşünü almaz;
açık bir kimlik doğrulama profili veya uzak uygulama sunucusunun kendi hesabını
kullanın.

Bir abonelik profili Codex kullanım sınırına ulaşırsa, Codex bir sıfırlama
zamanı bildirdiğinde OpenClaw bunu kaydeder ve aynı Codex çalıştırması için
sonraki sıralı kimlik doğrulama profilini dener. Sıfırlama zamanı geçtiğinde,
abonelik profili seçili `openai/gpt-*` modeli veya Codex çalışma zamanı
değişmeden yeniden uygun hâle gelir.

Bir dağıtım ek ortam yalıtımı gerektiriyorsa, bu değişkenleri `appServer.clearEnv`
alanına ekleyin:

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

Codex dinamik araçları varsayılan olarak `searchable` yüklemeyi kullanır.
OpenClaw, Codex'e özgü çalışma alanı işlemlerini yineleyen dinamik araçları
sunmaz: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` ve
`update_plan`. Mesajlaşma, oturumlar, medya, cron, tarayıcı, düğümler, gateway,
`heartbeat_respond` ve `web_search` gibi kalan OpenClaw entegrasyon araçları,
ilk model bağlamını daha küçük tutmak için `openclaw` ad alanı altında Codex
araç araması üzerinden kullanılabilir.
`sessions_yield` ve yalnızca mesaj aracı kaynak yanıtları doğrudan kalır; çünkü
bunlar tur denetimi sözleşmeleridir. Heartbeat iş birliği yönergeleri, araç
zaten yüklenmemişse Codex'e bir Heartbeat turunu bitirmeden önce
`heartbeat_respond` aramasını söyler.

`codexDynamicToolsLoading: "direct"` değerini yalnızca ertelenmiş dinamik
araçlarda arama yapamayan özel bir Codex uygulama sunucusuna bağlanırken veya
tam araç yükünü ayıklarken ayarlayın.

Desteklenen üst düzey Codex Plugin alanları:

| Alan                       | Varsayılan    | Anlam                                                                                    |
| -------------------------- | ------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | OpenClaw dinamik araçlarını doğrudan ilk Codex araç bağlamına koymak için `"direct"` kullanın. |
| `codexDynamicToolsExclude` | `[]`          | Codex uygulama sunucusu turlarından çıkarılacak ek OpenClaw dinamik araç adları.         |
| `codexPlugins`             | devre dışı    | Taşınmış, kaynaktan yüklenen kürasyonlu Plugin'ler için yerel Codex Plugin/uygulama desteği. |

Desteklenen `appServer` alanları:

| Alan                          | Varsayılan                                             | Anlam                                                                                                                                                                                                                                   |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` Codex'i oluşturur; `"websocket"` `url` değerine bağlanır.                                                                                                                                                                     |
| `command`                     | yönetilen Codex ikilisi                                | stdio taşıması için çalıştırılabilir dosya. Yönetilen ikiliyi kullanmak için boş bırakın; yalnızca açık bir geçersiz kılma için ayarlayın.                                                                                              |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | stdio taşıması için argümanlar.                                                                                                                                                                                                         |
| `url`                         | ayarlanmamış                                           | WebSocket uygulama sunucusu URL'si.                                                                                                                                                                                                     |
| `authToken`                   | ayarlanmamış                                           | WebSocket taşıması için bearer token.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | Ek WebSocket başlıkları.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | OpenClaw devralınan ortamını oluşturduktan sonra oluşturulan stdio uygulama sunucusu sürecinden kaldırılan ek ortam değişkeni adları. `CODEX_HOME` ve `HOME`, yerel başlatmalarda OpenClaw'ın aracı başına Codex yalıtımı için ayrılmıştır. |
| `requestTimeoutMs`            | `60000`                                                | Uygulama sunucusu denetim düzlemi çağrıları için zaman aşımı.                                                                                                                                                                           |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | OpenClaw `turn/completed` beklerken tur kapsamlı bir Codex uygulama sunucusu isteğinden sonraki sessiz pencere. Yavaş araç sonrası veya yalnızca durum sentezi aşamaları için bunu artırın.                                             |
| `mode`                        | yerel Codex gereksinimleri YOLO'ya izin vermedikçe `"yolo"` | YOLO veya koruyucu incelemeli yürütme için ön ayar. `danger-full-access`, `never` onayı veya `user` inceleyicisini atlayan yerel stdio gereksinimleri örtük varsayılanı koruyucu yapar.                                                  |
| `approvalPolicy`              | `"never"` veya izin verilen bir koruyucu onay ilkesi   | İş parçacığı başlatma/sürdürme/tur işlemlerine gönderilen yerel Codex onay ilkesi. Koruyucu varsayılanları, izin verildiğinde `"on-request"` değerini tercih eder.                                                                      |
| `sandbox`                     | `"danger-full-access"` veya izin verilen bir koruyucu sandbox | İş parçacığı başlatma/sürdürme işlemlerine gönderilen yerel Codex sandbox modu. Koruyucu varsayılanları izin verildiğinde `"workspace-write"` değerini, aksi takdirde `"read-only"` değerini tercih eder. Bir OpenClaw sandbox'ı etkin olduğunda, `danger-full-access` `"workspace-write"` değerine daraltılır. |
| `approvalsReviewer`           | `"user"` veya izin verilen bir koruyucu inceleyici     | İzin verildiğinde Codex'in yerel onay istemlerini incelemesini sağlamak için `"auto_review"` kullanın; aksi takdirde `guardian_subagent` veya `user`. `guardian_subagent` eski bir takma ad olarak kalır.                                |
| `serviceTier`                 | ayarlanmamış                                           | İsteğe bağlı Codex uygulama sunucusu hizmet katmanı. `"priority"` hızlı mod yönlendirmesini etkinleştirir, `"flex"` flex işlemeyi ister, `null` geçersiz kılmayı temizler ve eski `"fast"` değeri `"priority"` olarak kabul edilir.      |

OpenClaw'a ait dinamik araç çağrıları, `appServer.requestTimeoutMs` değerinden bağımsız olarak sınırlandırılır: Codex `item/tool/call` istekleri varsayılan olarak 30 saniyelik bir OpenClaw bekçi zamanlayıcısı kullanır. Pozitif bir çağrı başına `timeoutMs` argümanı, ilgili aracın bütçesini uzatır veya kısaltır. `image_generate` aracı, araç çağrısı kendi zaman aşımını sağlamadığında `agents.defaults.imageGenerationModel.timeoutMs` değerini de kullanır; medya anlama `image` aracı ise `tools.media.image.timeoutSeconds` değerini veya 60 saniyelik medya varsayılanını kullanır. Dinamik araç bütçeleri 600000 ms ile sınırlandırılır. Zaman aşımında OpenClaw, desteklendiğinde araç sinyalini iptal eder ve Codex'e başarısız bir dinamik araç yanıtı döndürür; böylece oturumu `processing` durumunda bırakmak yerine tur devam edebilir.

OpenClaw, Codex tur kapsamlı bir app-server isteğine yanıt verdikten sonra harness, Codex'in yerel turu `turn/completed` ile bitirmesini de bekler. App-server bu yanıttan sonra `appServer.turnCompletionIdleTimeoutMs` süresince sessiz kalırsa OpenClaw, en iyi çabayla Codex turunu kesintiye uğratır, tanılama zaman aşımı kaydeder ve takip eden sohbet iletilerinin bayat bir yerel turun arkasında kuyruğa alınmaması için OpenClaw oturum hattını serbest bırakır. Aynı tura ait `rawResponseItem/completed` dahil herhangi bir terminal olmayan bildirim, bu kısa bekçi zamanlayıcısını devre dışı bırakır; çünkü Codex turun hâlâ canlı olduğunu kanıtlamıştır. Daha uzun terminal bekçi zamanlayıcısı, gerçekten takılmış turları korumaya devam eder. Hız sınırı güncellemeleri gibi genel app-server bildirimleri, tur boşta ilerlemesini sıfırlamaz. Codex tamamlanmış bir `agentMessage` öğesi yayıp ardından `turn/completed` olmadan sessiz kaldığında OpenClaw, asistan çıktısını fiilen tamamlanmış kabul eder, en iyi çabayla yerel Codex turunu kesintiye uğratır ve oturum hattını serbest bırakır. Zaman aşımı tanılamaları son app-server bildirim yöntemini ve ham asistan yanıt öğeleri için öğe türünü, rolü, id'yi ve sınırlandırılmış bir asistan metni önizlemesini içerir.

Ortam geçersiz kılmaları yerel test için kullanılabilir kalır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`, `appServer.command` ayarlanmamışken yönetilen ikiliyi atlar.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırıldı. Bunun yerine `plugins.entries.codex.config.appServer.mode: "guardian"` kullanın veya tek seferlik yerel test için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın. Tekrarlanabilir dağıtımlar için yapılandırma tercih edilir; çünkü Plugin davranışını Codex harness kurulumunun geri kalanıyla aynı gözden geçirilmiş dosyada tutar.

## Yerel Codex Plugin'leri

Yerel Codex Plugin desteği, OpenClaw harness turuyla aynı Codex iş parçacığında Codex app-server'ın kendi uygulama ve Plugin yeteneklerini kullanır. OpenClaw, Codex Plugin'lerini sentetik `codex_plugin_*` OpenClaw dinamik araçlarına çevirmez.

`codexPlugins` yalnızca yerel Codex harness'i seçen oturumları etkiler. PI çalıştırmaları, normal OpenAI sağlayıcı çalıştırmaları, ACP konuşma bağları veya diğer harness'ler üzerinde etkisi yoktur.

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

İş parçacığı uygulama yapılandırması, OpenClaw bir Codex harness oturumu kurduğunda veya bayat bir Codex iş parçacığı bağını değiştirdiğinde hesaplanır. Her turda yeniden hesaplanmaz. `codexPlugins` değiştirildikten sonra gelecekteki Codex harness oturumlarının güncellenmiş uygulama kümesiyle başlaması için `/new`, `/reset` kullanın veya gateway'i yeniden başlatın.

Geçiş uygunluğu, uygulama envanteri, yıkıcı eylem ilkesi, bilgi istemleri ve yerel Plugin tanılamaları için bkz.
[Yerel Codex Plugin'leri](/tr/plugins/codex-native-plugins).

## Bilgisayar Kullanımı

Bilgisayar Kullanımı kendi kurulum kılavuzunda ele alınır:
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use).

Kısa sürüm: OpenClaw masaüstü denetim uygulamasını bünyesine katmaz veya masaüstü eylemlerini kendisi yürütmez. Codex app-server'ı hazırlar, `computer-use` MCP sunucusunun kullanılabilir olduğunu doğrular ve ardından Codex modu turları sırasında yerel MCP araç çağrılarını Codex'e bırakır.

## Çalışma zamanı sınırları

Codex harness yalnızca düşük düzeyli gömülü aracı yürütücüsünü değiştirir.

- OpenClaw dinamik araçları desteklenir. Codex, OpenClaw'dan bu araçları yürütmesini ister; bu nedenle OpenClaw yürütme yolunda kalır.
- Codex'e yerel shell, patch, MCP ve yerel uygulama araçları Codex'e aittir. OpenClaw, desteklenen relay üzerinden seçili yerel olayları gözlemleyebilir veya engelleyebilir, ancak yerel araç argümanlarını yeniden yazmaz.
- Yerel Compaction Codex'e aittir. OpenClaw kanal geçmişi, arama, `/new`, `/reset` ve gelecekteki model veya harness geçişleri için bir transkript yansısı tutar.
- Medya üretimi, medya anlama, TTS, onaylar ve mesajlaşma aracı çıktısı eşleşen OpenClaw sağlayıcı/model ayarları üzerinden devam eder.
- `tool_result_persist`, Codex'e yerel araç sonucu kayıtlarına değil, OpenClaw'a ait transkript araç sonuçlarına uygulanır.

Kanca katmanları, desteklenen V1 yüzeyleri, yerel izin işleme, kuyruk yönlendirme, Codex geri bildirim yükleme mekaniği ve Compaction ayrıntıları için bkz.
[Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime).

## Sorun giderme

**Codex normal bir `/model` sağlayıcısı olarak görünmüyor:** bu yeni yapılandırmalar için beklenen durumdur. Bir `openai/gpt-*` modeli seçin, `plugins.entries.codex.enabled` değerini etkinleştirin ve `plugins.allow` değerinin `codex` öğesini dışlayıp dışlamadığını kontrol edin.

**OpenClaw, Codex yerine PI kullanıyor:** model ref değerinin resmi OpenAI sağlayıcısında `openai/gpt-*` olduğundan ve Codex Plugin'inin yüklü ve etkin olduğundan emin olun. Test sırasında kesin kanıta ihtiyacınız varsa sağlayıcı veya model `agentRuntime.id: "codex"` ayarlayın. Zorlanmış bir Codex çalışma zamanı, PI'ye geri dönmek yerine başarısız olur.

**Eski `openai-codex/*` yapılandırması kalmış:** `openclaw doctor --fix` çalıştırın. Doctor eski model ref'lerini `openai/*` olarak yeniden yazar, bayat oturum ve tüm aracı çalışma zamanı sabitlemelerini kaldırır ve mevcut auth-profile geçersiz kılmalarını korur.

**App-server reddediliyor:** Codex app-server `0.125.0` veya daha yenisini kullanın. `0.125.0-alpha.2` ya da `0.125.0+custom` gibi aynı sürüm ön sürümleri veya build sonekli sürümler reddedilir; çünkü OpenClaw kararlı `0.125.0` protokol tabanını test eder.

**`/codex status` bağlanamıyor:** birlikte gelen `codex` Plugin'inin etkin olduğunu, bir allowlist yapılandırılmışsa `plugins.allow` değerinin bunu içerdiğini ve tüm özel `appServer.command`, `url`, `authToken` veya header değerlerinin geçerli olduğunu kontrol edin.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs` değerini düşürün veya keşfi devre dışı bırakın. Bkz.
[Codex harness başvurusu](/tr/plugins/codex-harness-reference#model-discovery).

**WebSocket aktarımı hemen başarısız oluyor:** `appServer.url`, `authToken`, header değerlerini ve uzak app-server'ın aynı Codex app-server protokol sürümünü konuştuğunu kontrol edin.

**Codex dışı bir model PI kullanıyor:** sağlayıcı veya model çalışma zamanı ilkesi onu başka bir harness'e yönlendirmedikçe bu beklenen durumdur. Düz Codex dışı sağlayıcı ref'leri `auto` modunda normal sağlayıcı yolunda kalır.

**Bilgisayar Kullanımı yüklü ama araçlar çalışmıyor:** yeni bir oturumdan `/codex computer-use status` kontrol edin. Bir araç `Native hook relay unavailable` bildirirse `/new` veya `/reset` kullanın; devam ederse bayat yerel kanca kayıtlarını temizlemek için gateway'i yeniden başlatın. Bkz.
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use#troubleshooting).

## İlgili

- [Codex harness başvurusu](/tr/plugins/codex-harness-reference)
- [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [Yerel Codex Plugin'leri](/tr/plugins/codex-native-plugins)
- [Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use)
- [Aracı çalışma zamanları](/tr/concepts/agent-runtimes)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [Aracı harness Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Plugin kancaları](/tr/plugins/hooks)
- [Tanılamaları dışa aktarma](/tr/gateway/diagnostics)
- [Durum](/tr/cli/status)
- [Test Etme](/tr/help/testing-live#live-codex-app-server-harness-smoke)
