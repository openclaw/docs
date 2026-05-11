---
read_when:
    - Birlikte gelen Codex app-server düzeneğini kullanmak istiyorsunuz
    - Codex çalıştırma düzeneği yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex dağıtımlarının PI'ye geri dönmek yerine başarısız olmasını istiyorsunuz
summary: Paketle gelen Codex app-server test düzeneği üzerinden OpenClaw gömülü ajan turlarını çalıştırın
title: Codex çalıştırma altyapısı
x-i18n:
    generated_at: "2026-05-11T20:33:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37546661dc80d8ce680c379ca2a49919b08ac24a748dc15d1478c1421e81c632
    source_path: plugins/codex-harness.md
    workflow: 16
---

Birlikte gelen `codex` Plugin'i, OpenClaw'ın yerleşik PI harness yerine Codex app-server üzerinden gömülü OpenAI ajan turları çalıştırmasını sağlar.

Codex'in düşük düzeyli ajan oturumunu yönetmesini istediğinizde Codex harness'ı kullanın:
yerel thread sürdürme, yerel araç devam ettirme, yerel Compaction ve
app-server yürütmesi. OpenClaw yine de sohbet kanallarını, oturum dosyalarını, model
seçimini, OpenClaw dinamik araçlarını, onayları, medya teslimini ve görünür
transkript aynasını yönetir.

Normal kurulum `openai/gpt-5.5` gibi kanonik OpenAI model referansları kullanır.
`openai-codex/gpt-*` model referanslarını yapılandırmayın. OpenAI ajan kimlik doğrulama sırasını
`auth.order.openai` altına koyun; eski `openai-codex:*` profilleri ve
`auth.order.openai-codex` girdileri mevcut kurulumlar için desteklenmeye devam eder.

OpenClaw, Codex app-server thread'lerini Codex yerel kod modu ve
yalnızca kod modu etkin olarak başlatır. Bu, ertelenmiş/aranabilir OpenClaw dinamik araçlarını
Codex'in kendi kod yürütme ve araç arama yüzeyinin içinde tutar; Codex'in üzerine
PI tarzı bir araç arama sarmalayıcısı eklemez.

Daha geniş model/sağlayıcı/çalışma zamanı ayrımı için
[Agent runtimes](/tr/concepts/agent-runtimes) ile başlayın. Kısa sürüm şudur:
`openai/gpt-5.5` model referansıdır, `codex` çalışma zamanıdır ve Telegram,
Discord, Slack veya başka bir kanal iletişim yüzeyi olarak kalır.

## Gereksinimler

- Birlikte gelen `codex` Plugin'i kullanılabilir olan OpenClaw.
- Yapılandırmanız `plugins.allow` kullanıyorsa `codex` ekleyin.
- Codex app-server `0.125.0` veya daha yeni. Birlikte gelen Plugin varsayılan olarak uyumlu
  bir Codex app-server ikilisini yönetir; bu nedenle `PATH` üzerindeki yerel `codex` komutları
  normal harness başlatmasını etkilemez.
- Codex kimlik doğrulaması `openclaw models auth login --provider openai-codex` üzerinden,
  ajanın Codex ana dizinindeki bir app-server hesabı üzerinden veya açık bir Codex API anahtarı
  kimlik doğrulama profili üzerinden kullanılabilir olmalıdır.

Kimlik doğrulama önceliği, ortam yalıtımı, özel app-server komutları, model
keşfi ve tüm yapılandırma alanları için
[Codex harness reference](/tr/plugins/codex-harness-reference) bölümüne bakın.

## Hızlı Başlangıç

OpenClaw içinde Codex isteyen çoğu kullanıcı şu yolu ister: bir
ChatGPT/Codex aboneliğiyle oturum açın, birlikte gelen `codex` Plugin'ini etkinleştirin ve
kanonik bir `openai/gpt-*` model referansı kullanın.

Codex OAuth ile oturum açın:

```bash
openclaw models auth login --provider openai-codex
```

Birlikte gelen `codex` Plugin'ini etkinleştirin ve bir OpenAI ajan modeli seçin:

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

Plugin yapılandırmasını değiştirdikten sonra gateway'i yeniden başlatın. Mevcut bir sohbetin zaten
oturumu varsa, çalışma zamanı değişikliklerini test etmeden önce `/new` veya `/reset` kullanın; böylece sonraki
tur harness'ı geçerli yapılandırmadan çözer.

## Yapılandırma

Hızlı başlangıç yapılandırması, asgari uygulanabilir Codex harness yapılandırmasıdır. Codex
harness seçeneklerini OpenClaw yapılandırmasında ayarlayın ve CLI'yi yalnızca Codex kimlik doğrulaması için kullanın:

| Gereksinim                            | Ayar                                                                             | Yer                                |
| ------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Harness'ı etkinleştir                 | `plugins.entries.codex.enabled: true`                                            | OpenClaw yapılandırması            |
| İzin listesine alınmış Plugin kurulumunu koru | `plugins.allow` içine `codex` ekleyin                                            | OpenClaw yapılandırması            |
| OpenAI ajan turlarını Codex üzerinden yönlendir | `agents.defaults.model` veya `agents.list[].model` için `openai/gpt-*`           | OpenClaw ajan yapılandırması       |
| Codex OAuth ile oturum aç             | `openclaw models auth login --provider openai-codex`                             | CLI kimlik doğrulama profili       |
| Codex çalıştırmaları için API anahtarı yedeği ekle | `auth.order.openai` içinde abonelik kimlik doğrulamasından sonra listelenen `openai:*` API anahtarı profili | CLI kimlik doğrulama profili + OpenClaw yapılandırması |
| Codex kullanılamadığında kapalı kalacak şekilde başarısız ol | Sağlayıcı veya model `agentRuntime.id: "codex"`                                  | OpenClaw model/sağlayıcı yapılandırması |
| Doğrudan OpenAI API trafiği kullan    | Normal OpenAI kimlik doğrulamasıyla sağlayıcı veya model `agentRuntime.id: "pi"` | OpenClaw model/sağlayıcı yapılandırması |
| App-server davranışını ayarla         | `plugins.entries.codex.config.appServer.*`                                       | Codex Plugin yapılandırması        |
| Yerel Codex Plugin uygulamalarını etkinleştir | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex Plugin yapılandırması        |
| Codex Computer Use'u etkinleştir      | `plugins.entries.codex.config.computerUse.*`                                     | Codex Plugin yapılandırması        |

Codex destekli OpenAI ajan turları için `openai/gpt-*` model referanslarını kullanın. Abonelik öncelikli/API anahtarı yedekli sıralama için
`auth.order.openai` tercih edin. Mevcut
`openai-codex:*` kimlik doğrulama profilleri ve `auth.order.openai-codex` geçerli kalır, ancak
yeni `openai-codex/gpt-*` model referansları yazmayın.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Bu yapıda her iki profil de `openai/gpt-*` ajan turları için Codex üzerinden çalışmaya devam eder.
API anahtarı yalnızca bir kimlik doğrulama yedeğidir; PI'a veya düz OpenAI Responses'a geçme isteği değildir.

Bu sayfanın geri kalanı, kullanıcıların seçmesi gereken yaygın varyantları kapsar:
dağıtım biçimi, kapalı kalacak şekilde başarısız yönlendirme, guardian onay politikası, yerel Codex
Plugin'leri ve Computer Use. Tam seçenek listeleri, varsayılanlar, enum'lar, keşif,
ortam yalıtımı, zaman aşımları ve app-server taşıma alanları için
[Codex harness reference](/tr/plugins/codex-harness-reference) bölümüne bakın.

## Codex çalışma zamanını doğrulayın

Codex beklediğiniz sohbette `/status` kullanın. Codex destekli bir OpenAI ajan
turu şunu gösterir:

```text
Runtime: OpenAI Codex
```

Ardından Codex app-server durumunu kontrol edin:

```text
/codex status
/codex models
```

`/codex status` app-server bağlantısını, hesabı, hız sınırlarını, MCP
sunucularını ve Skills'i bildirir. `/codex models`, harness ve hesap için canlı Codex app-server kataloğunu listeler.
`/status` beklenmedik görünüyorsa
[Sorun giderme](#troubleshooting) bölümüne bakın.

## Yönlendirme ve model seçimi

Sağlayıcı referanslarını ve çalışma zamanı politikasını ayrı tutun:

- Codex üzerinden OpenAI ajan turları için `openai/gpt-*` kullanın.
- Yapılandırmada `openai-codex/gpt-*` kullanmayın. Eski referansları ve bayat oturum rota sabitlemelerini
  onarmak için `openclaw doctor --fix` çalıştırın.
- Normal OpenAI otomatik modu için `agentRuntime.id: "codex"` isteğe bağlıdır, ancak
  bir dağıtımın Codex kullanılamadığında kapalı kalacak şekilde başarısız olması gerektiğinde yararlıdır.
- `agentRuntime.id: "pi"`, amaç bu olduğunda bir sağlayıcıyı veya modeli doğrudan PI davranışına dahil eder.
- `/codex ...`, sohbetten yerel Codex app-server konuşmalarını denetler.
- ACP/acpx ayrı bir harici harness yoludur. Yalnızca kullanıcı ACP/acpx veya harici bir harness adaptörü istediğinde kullanın.

Yaygın komut yönlendirmesi:

| Kullanıcı amacı                 | Kullanım                                |
| ------------------------------- | --------------------------------------- |
| Geçerli sohbeti bağla           | `/codex bind [--cwd <path>]`            |
| Mevcut bir Codex thread'ini sürdür | `/codex resume <thread-id>`             |
| Codex thread'lerini listele veya filtrele | `/codex threads [filter]`               |
| Yalnızca Codex geri bildirimi gönder | `/codex diagnostics [note]`             |
| ACP/acpx görevi başlat          | `/codex` değil, ACP/acpx oturum komutları |

| Kullanım durumu                                      | Yapılandırma                                                     | Doğrulama                               | Notlar                             |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Yerel Codex çalışma zamanı ile ChatGPT/Codex aboneliği | `openai/gpt-*` artı etkin `codex` Plugin'i                      | `/status` `Runtime: OpenAI Codex` gösterir | Önerilen yol                       |
| Codex kullanılamadığında kapalı kalacak şekilde başarısız ol | Sağlayıcı veya model `agentRuntime.id: "codex"`                  | Tur PI yedeği yerine başarısız olur     | Yalnızca Codex dağıtımları için kullanın |
| PI üzerinden doğrudan OpenAI API anahtarı trafiği    | Sağlayıcı veya model `agentRuntime.id: "pi"` ve normal OpenAI kimlik doğrulaması | `/status` PI çalışma zamanını gösterir  | Yalnızca PI amaçlandığında kullanın |
| Eski yapılandırma                                    | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` bunu yeniden yazar | Yeni yapılandırmayı bu şekilde yazmayın |
| ACP/acpx Codex adaptörü                              | ACP `sessions_spawn({ runtime: "acp" })`                         | ACP görev/oturum durumu                 | Yerel Codex harness'tan ayrıdır    |

`agents.defaults.imageModel` aynı önek ayrımını izler. Normal OpenAI rotası için `openai/gpt-*`
kullanın; `codex/gpt-*` değerini yalnızca görüntü anlama
sınırlı bir Codex app-server turu üzerinden çalışmalıysa kullanın.
`openai-codex/gpt-*` kullanmayın; doctor bu eski öneki `openai/gpt-*` olarak yeniden yazar.

## Dağıtım kalıpları

### Temel Codex dağıtımı

Tüm OpenAI ajan turlarının varsayılan olarak Codex kullanması gerektiğinde hızlı başlangıç yapılandırmasını kullanın.

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

Bu yapı, Claude'u varsayılan ajan olarak tutar ve adlandırılmış bir Codex ajanı ekler:

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

### Kapalı kalacak şekilde başarısız olan Codex dağıtımı

OpenAI ajan turları için, birlikte gelen Plugin kullanılabilir olduğunda `openai/gpt-*` zaten Codex'e çözümlenir.
Yazılı bir kapalı kalacak şekilde başarısız olma kuralı istediğinizde açık çalışma zamanı politikası ekleyin:

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

Codex zorunlu kılındığında, Codex Plugin devre dışıysa,
app-server çok eskiyse veya app-server başlatılamıyorsa OpenClaw erken başarısız olur.

## App-server politikası

Varsayılan olarak Plugin, OpenClaw'ın yönettiği Codex ikilisini stdio
taşımasıyla yerel olarak başlatır. `appServer.command` değerini yalnızca bilinçli olarak
farklı bir yürütülebilir dosya çalıştırmak istediğinizde ayarlayın. WebSocket taşımasını yalnızca başka bir yerde zaten
bir app-server çalışıyorsa kullanın:

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

Yerel stdio uygulama sunucusu oturumları varsayılan olarak güvenilir yerel operatör duruşunu kullanır:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Yerel Codex gereksinimleri bu
örtük YOLO duruşuna izin vermiyorsa, OpenClaw bunun yerine izin verilen guardian izinlerini seçer.
Oturum için bir OpenClaw sandbox'ı etkin olduğunda, OpenClaw yerel Codex kod modu turlarının
sandbox uygulanmış çalışma alanının içinde kalması için Codex
`danger-full-access` değerini Codex `workspace-write` değerine daraltır.

Sandbox dışına çıkışlardan veya ek izinlerden önce Codex yerel otomatik incelemesi
istediğinizde guardian modunu kullanın:

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
`sandbox: "workspace-write"` olmak üzere Codex uygulama sunucusu onaylarına genişler.

Her uygulama sunucusu alanı, kimlik doğrulama sırası, ortam yalıtımı, keşif ve
zaman aşımı davranışı için [Codex harness başvurusu](/tr/plugins/codex-harness-reference) bölümüne bakın.

## Komutlar ve tanılama

Paketle gelen Plugin, OpenClaw metin komutlarını destekleyen herhangi bir kanalda
`/codex` komutunu eğik çizgi komutu olarak kaydeder.

Yaygın biçimler:

- `/codex status` uygulama sunucusu bağlantısını, modelleri, hesabı, hız sınırlarını,
  MCP sunucularını ve Skills durumunu denetler.
- `/codex models` canlı Codex uygulama sunucusu modellerini listeler.
- `/codex threads [filter]` son Codex uygulama sunucusu iş parçacıklarını listeler.
- `/codex resume <thread-id>` geçerli OpenClaw oturumunu mevcut bir
  Codex iş parçacığına bağlar.
- `/codex compact` Codex uygulama sunucusundan bağlı iş parçacığını sıkıştırmasını ister.
- `/codex review` bağlı iş parçacığı için Codex yerel incelemesini başlatır.
- `/codex diagnostics [note]` bağlı iş parçacığı için Codex geri bildirimi
  göndermeden önce sorar.
- `/codex account` hesap ve hız sınırı durumunu gösterir.
- `/codex mcp` Codex uygulama sunucusu MCP sunucusu durumunu listeler.
- `/codex skills` Codex uygulama sunucusu Skills öğelerini listeler.

Çoğu destek raporu için hatanın oluştuğu konuşmada `/diagnostics [note]` ile başlayın.
Bu, bir Gateway tanılama raporu oluşturur ve Codex harness oturumları için ilgili Codex
geri bildirim paketini göndermek üzere onay ister. Gizlilik modeli ve grup sohbeti
davranışı için [Tanılama dışa aktarımı](/tr/gateway/diagnostics) bölümüne bakın.

`/codex diagnostics [note]` komutunu yalnızca tam Gateway tanılama paketi olmadan
geçerli bağlı iş parçacığı için özellikle Codex geri bildirim yüklemesini istediğinizde kullanın.

### Codex iş parçacıklarını yerelde inceleyin

Sorunlu bir Codex çalıştırmasını incelemenin en hızlı yolu çoğu zaman yerel Codex
iş parçacığını doğrudan açmaktır:

```bash
codex resume <thread-id>
```

İş parçacığı kimliğini tamamlanan `/diagnostics` yanıtından, `/codex binding` komutundan veya
`/codex threads [filter]` çıktısından alın.

Yükleme işleyişi ve çalışma zamanı düzeyindeki tanılama sınırları için
[Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime#codex-feedback-upload) bölümüne bakın.

Kimlik doğrulama şu sırayla seçilir:

1. Ajan için sıralı OpenAI kimlik doğrulama profilleri, tercihen
   `auth.order.openai` altında. Mevcut `openai-codex:*` profil kimlikleri geçerli kalır.
2. Uygulama sunucusunun o ajanın Codex ana dizinindeki mevcut hesabı.
3. Yalnızca yerel stdio uygulama sunucusu başlatmaları için, uygulama sunucusu hesabı yoksa ve OpenAI kimlik doğrulaması
   hâlâ gerekiyorsa `CODEX_API_KEY`, ardından
   `OPENAI_API_KEY`.

OpenClaw, ChatGPT abonelik tarzı bir Codex kimlik doğrulama profili gördüğünde,
başlatılan Codex alt işleminden `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini kaldırır. Bu,
Gateway düzeyindeki API anahtarlarını embedding'ler veya doğrudan OpenAI modelleri için kullanılabilir tutarken,
yerel Codex uygulama sunucusu turlarının yanlışlıkla API üzerinden faturalandırılmasını engeller.
Açık Codex API anahtarı profilleri ve yerel stdio ortam anahtarı yedeği, devralınan alt işlem ortamı yerine
uygulama sunucusu oturum açmasını kullanır. WebSocket uygulama sunucusu bağlantıları
Gateway ortam API anahtarı yedeğini almaz; açık bir kimlik doğrulama profili veya uzak uygulama sunucusunun kendi hesabını kullanın.

Bir abonelik profili Codex kullanım sınırına ulaşırsa, OpenClaw Codex bildirdiğinde sıfırlama zamanını kaydeder
ve aynı Codex çalıştırması için sıradaki sonraki kimlik doğrulama profilini dener. Sıfırlama zamanı geçtiğinde,
abonelik profili seçili `openai/gpt-*` modelini veya Codex çalışma zamanını değiştirmeden tekrar uygun hale gelir.

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

`appServer.clearEnv` yalnızca başlatılan Codex uygulama sunucusu alt işlemini etkiler.

Codex dinamik araçları varsayılan olarak `searchable` yüklemeyi kullanır. OpenClaw,
Codex'e yerel çalışma alanı işlemlerini yineleyen dinamik araçları açığa çıkarmaz: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` ve `update_plan`. Mesajlaşma, oturumlar, medya, cron, tarayıcı, düğümler,
gateway, `heartbeat_respond` ve `web_search` gibi kalan OpenClaw entegrasyon araçları
`openclaw` ad alanı altında Codex araç araması üzerinden kullanılabilir; bu da ilk model bağlamını
daha küçük tutar.
`sessions_yield` ve yalnızca mesaj aracına yönelik kaynak yanıtları doğrudan kalır çünkü bunlar
tur kontrol sözleşmeleridir. Heartbeat iş birliği yönergeleri, araç zaten yüklü değilken
heartbeat turunu bitirmeden önce Codex'e `heartbeat_respond` aramasını söyler.

`codexDynamicToolsLoading: "direct"` değerini yalnızca ertelenmiş dinamik araçları arayamayan özel bir Codex
uygulama sunucusuna bağlanırken veya tam araç yükünü hata ayıklarken ayarlayın.

Desteklenen üst düzey Codex Plugin alanları:

| Alan                       | Varsayılan     | Anlam                                                                                    |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | OpenClaw dinamik araçlarını doğrudan ilk Codex araç bağlamına koymak için `"direct"` kullanın. |
| `codexDynamicToolsExclude` | `[]`           | Codex uygulama sunucusu turlarından çıkarılacak ek OpenClaw dinamik araç adları.         |
| `codexPlugins`             | devre dışı     | Taşınmış kaynak kurulumlu kürasyonlu plugin'ler için yerel Codex plugin/uygulama desteği. |

Desteklenen `appServer` alanları:

| Alan                          | Varsayılan                                             | Anlam                                                                                                                                                                                                                                   |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` Codex'i başlatır; `"websocket"` `url` değerine bağlanır.                                                                                                                                                                      |
| `command`                     | yönetilen Codex ikilisi                                | stdio aktarımı için çalıştırılabilir dosya. Yönetilen ikiliyi kullanmak için ayarlamadan bırakın; yalnızca açık bir geçersiz kılma için ayarlayın.                                                                                      |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | stdio aktarımı için argümanlar.                                                                                                                                                                                                         |
| `url`                         | ayarlanmamış                                           | WebSocket uygulama sunucusu URL'si.                                                                                                                                                                                                     |
| `authToken`                   | ayarlanmamış                                           | WebSocket aktarımı için Bearer belirteci.                                                                                                                                                                                               |
| `headers`                     | `{}`                                                   | Ek WebSocket üstbilgileri.                                                                                                                                                                                                              |
| `clearEnv`                    | `[]`                                                   | OpenClaw devralınan ortamını oluşturduktan sonra başlatılan stdio uygulama sunucusu işleminden kaldırılan ek ortam değişkeni adları. `CODEX_HOME` ve `HOME`, yerel başlatmalarda OpenClaw'ın ajan başına Codex yalıtımı için ayrılmıştır. |
| `requestTimeoutMs`            | `60000`                                                | Uygulama sunucusu kontrol düzlemi çağrıları için zaman aşımı.                                                                                                                                                                           |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | OpenClaw `turn/completed` için beklerken tur kapsamlı bir Codex uygulama sunucusu isteğinden sonraki sessiz pencere. Yavaş araç sonrası veya yalnızca durum sentezi aşamaları için bunu artırın.                                       |
| `mode`                        | yerel Codex gereksinimleri YOLO'ya izin vermiyorsa `"yolo"` değil | YOLO veya guardian tarafından incelenen yürütme için ön ayar. `danger-full-access`, `never` onayı veya `user` inceleyicisini atlayan yerel stdio gereksinimleri örtük varsayılanı guardian yapar.                                      |
| `approvalPolicy`              | `"never"` veya izin verilen bir guardian onay ilkesi    | İş parçacığı başlatma/sürdürme/tur işlemine gönderilen yerel Codex onay ilkesi. Guardian varsayılanları izin verildiğinde `"on-request"` değerini tercih eder.                                                                         |
| `sandbox`                     | `"danger-full-access"` veya izin verilen bir guardian sandbox'ı | İş parçacığı başlatma/sürdürme işlemine gönderilen yerel Codex sandbox modu. Guardian varsayılanları izin verildiğinde `"workspace-write"` değerini, aksi halde `"read-only"` değerini tercih eder. Bir OpenClaw sandbox'ı etkin olduğunda, `danger-full-access` `"workspace-write"` değerine daraltılır. |
| `approvalsReviewer`           | `"user"` veya izin verilen bir guardian inceleyicisi    | İzin verildiğinde Codex'in yerel onay istemlerini incelemesini sağlamak için `"auto_review"` kullanın; aksi halde `guardian_subagent` veya `user` kullanın. `guardian_subagent` eski bir takma ad olarak kalır.                         |
| `serviceTier`                 | ayarlanmamış                                           | İsteğe bağlı Codex uygulama sunucusu hizmet katmanı. `"priority"` hızlı mod yönlendirmesini etkinleştirir, `"flex"` esnek işlemeyi ister, `null` geçersiz kılmayı temizler ve eski `"fast"` değeri `"priority"` olarak kabul edilir.      |

OpenClaw’a ait dinamik araç çağrıları, `appServer.requestTimeoutMs` değerinden
bağımsız olarak sınırlandırılır: Codex `item/tool/call` istekleri varsayılan
olarak 30 saniyelik bir OpenClaw watchdog kullanır. Pozitif bir çağrı başına
`timeoutMs` bağımsız değişkeni, o araca özgü bütçeyi uzatır veya kısaltır.
`image_generate` aracı ayrıca, araç çağrısı kendi zaman aşımını sağlamadığında
`agents.defaults.imageGenerationModel.timeoutMs` değerini kullanır; medya anlama
`image` aracı ise `tools.media.image.timeoutSeconds` değerini veya 60 saniyelik
medya varsayılanını kullanır. Dinamik araç bütçeleri 600000 ms ile sınırlıdır.
Zaman aşımında OpenClaw, desteklenen yerlerde araç sinyalini iptal eder ve turun
oturumu `processing` durumunda bırakmak yerine devam edebilmesi için Codex’e
başarısız bir dinamik araç yanıtı döndürür.

OpenClaw, Codex tur kapsamlı bir app-server isteğine yanıt verdikten sonra,
harness ayrıca Codex’in yerel turu `turn/completed` ile bitirmesini bekler. Bu
yanıttan sonra app-server `appServer.turnCompletionIdleTimeoutMs` boyunca sessiz
kalırsa OpenClaw, en iyi çabayla Codex turunu keser, tanısal bir zaman aşımı
kaydeder ve takip eden sohbet iletilerinin eski bir yerel turun arkasında
kuyruğa alınmaması için OpenClaw oturum şeridini serbest bırakır. Aynı tur için
`rawResponseItem/completed` dahil herhangi bir terminal olmayan bildirim, bu kısa
watchdog’u devre dışı bırakır; çünkü Codex turun hâlâ canlı olduğunu kanıtlamış
olur. Daha uzun terminal watchdog, gerçekten takılmış turları korumaya devam
eder. Zaman aşımı tanıları, son app-server bildirim yöntemini ve ham asistan
yanıt öğeleri için öğe türünü, rolü, kimliği ve sınırlı bir asistan metni
önizlemesini içerir.

Ortam geçersiz kılmaları yerel test için kullanılabilir kalır:

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

## Yerel Codex Plugin’leri

Yerel Codex Plugin desteği, OpenClaw harness turuyla aynı Codex iş parçacığında
Codex app-server’ın kendi uygulama ve Plugin yeteneklerini kullanır. OpenClaw,
Codex Plugin’lerini sentetik `codex_plugin_*` OpenClaw dinamik araçlarına
çevirmez.

`codexPlugins` yalnızca yerel Codex harness’ı seçen oturumları etkiler. PI
çalıştırmaları, normal OpenAI sağlayıcı çalıştırmaları, ACP konuşma bağlamaları
veya diğer harness’lar üzerinde etkisi yoktur.

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
            allow_destructive_actions: false,
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
oluşturduğunda veya eski bir Codex iş parçacığı bağlamasını değiştirdiğinde
hesaplanır. Her turda yeniden hesaplanmaz. `codexPlugins` değiştirildikten
sonra, gelecekteki Codex harness oturumlarının güncellenmiş uygulama kümesiyle
başlaması için `/new`, `/reset` kullanın veya Gateway’i yeniden başlatın.

Geçiş uygunluğu, uygulama envanteri, yıkıcı eylem politikası, istemeler ve yerel
Plugin tanıları için bkz.
[Yerel Codex Plugin’leri](/tr/plugins/codex-native-plugins).

## Bilgisayar Kullanımı

Bilgisayar Kullanımı kendi kurulum kılavuzunda ele alınır:
[Codex Computer Use](/tr/plugins/codex-computer-use).

Kısa sürüm: OpenClaw masaüstü denetim uygulamasını vendor olarak dahil etmez
veya masaüstü eylemlerini kendisi yürütmez. Codex app-server’ı hazırlar,
`computer-use` MCP sunucusunun kullanılabilir olduğunu doğrular ve ardından
Codex modlu turlar sırasında yerel MCP araç çağrılarının sahipliğini Codex’e
bırakır.

## Çalışma zamanı sınırları

Codex harness yalnızca düşük seviyeli gömülü ajan yürütücüsünü değiştirir.

- OpenClaw dinamik araçları desteklenir. Codex, bu araçları yürütmesini
  OpenClaw’dan ister; bu nedenle OpenClaw yürütme yolunda kalır.
- Codex’e yerel shell, patch, MCP ve yerel uygulama araçlarının sahibi Codex’tir.
  OpenClaw desteklenen relay üzerinden seçili yerel olayları gözlemleyebilir
  veya engelleyebilir, ancak yerel araç bağımsız değişkenlerini yeniden yazmaz.
- Yerel Compaction’ın sahibi Codex’tir. OpenClaw kanal geçmişi, arama, `/new`,
  `/reset` ve gelecekte model veya harness değiştirme için bir transcript
  aynası tutar.
- Medya üretimi, medya anlama, TTS, onaylar ve mesajlaşma aracı çıktısı, eşleşen
  OpenClaw sağlayıcı/model ayarları üzerinden devam eder.
- `tool_result_persist`, Codex’e yerel araç sonucu kayıtlarına değil,
  OpenClaw’a ait transcript araç sonuçlarına uygulanır.

Kanca katmanları, desteklenen V1 yüzeyleri, yerel izin işleme, kuyruk yönlendirme,
Codex geri bildirim yükleme mekanikleri ve Compaction ayrıntıları için bkz.
[Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime).

## Sorun giderme

**Codex normal bir `/model` sağlayıcısı olarak görünmüyor:** bu yeni
yapılandırmalar için beklenir. Bir `openai/gpt-*` modeli seçin,
`plugins.entries.codex.enabled` değerini etkinleştirin ve `plugins.allow`
değerinin `codex` öğesini dışlayıp dışlamadığını kontrol edin.

**OpenClaw, Codex yerine PI kullanıyor:** model referansının resmi OpenAI
sağlayıcısında `openai/gpt-*` olduğundan ve Codex Plugin’inin kurulu ve etkin
olduğundan emin olun. Test sırasında katı kanıta ihtiyacınız varsa sağlayıcı veya
model için `agentRuntime.id: "codex"` ayarlayın. Zorlanmış bir Codex çalışma
zamanı, PI’a geri dönmek yerine başarısız olur.

**Eski `openai-codex/*` yapılandırması kalmış:** `openclaw doctor --fix`
çalıştırın. Doctor, eski model referanslarını `openai/*` olarak yeniden yazar,
eski oturum ve tüm ajan çalışma zamanı sabitlemelerini kaldırır ve mevcut
auth-profile geçersiz kılmalarını korur.

**app-server reddediliyor:** Codex app-server `0.125.0` veya daha yenisini
kullanın. `0.125.0-alpha.2` veya `0.125.0+custom` gibi aynı sürüm ön sürümleri
ya da derleme son ekli sürümler reddedilir; çünkü OpenClaw kararlı `0.125.0`
protokol tabanını test eder.

**`/codex status` bağlanamıyor:** paketle gelen `codex` Plugin’inin etkin
olduğunu, bir izin listesi yapılandırıldıysa `plugins.allow` değerinin onu
içerdiğini ve özel `appServer.command`, `url`, `authToken` veya başlıkların
geçerli olduğunu kontrol edin.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs`
değerini düşürün veya keşfi devre dışı bırakın. Bkz.
[Codex harness başvurusu](/tr/plugins/codex-harness-reference#model-discovery).

**WebSocket taşıması hemen başarısız oluyor:** `appServer.url`, `authToken`,
başlıklar ve uzak app-server’ın aynı Codex app-server protokol sürümünü konuştuğu
kontrol edin.

**Codex olmayan bir model PI kullanıyor:** sağlayıcı veya model çalışma zamanı
politikası onu başka bir harness’a yönlendirmediği sürece bu beklenir. Düz
OpenAI dışı sağlayıcı referansları `auto` modunda normal sağlayıcı yolunda kalır.

**Computer Use kurulu ama araçlar çalışmıyor:** yeni bir oturumdan
`/codex computer-use status` kontrol edin. Bir araç `Native hook relay
unavailable` bildirirse `/new` veya `/reset` kullanın; devam ederse eski yerel
kanca kayıtlarını temizlemek için Gateway’i yeniden başlatın. Bkz.
[Codex Computer Use](/tr/plugins/codex-computer-use#troubleshooting).

## İlgili

- [Codex harness başvurusu](/tr/plugins/codex-harness-reference)
- [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [Yerel Codex Plugin’leri](/tr/plugins/codex-native-plugins)
- [Codex Computer Use](/tr/plugins/codex-computer-use)
- [Ajan çalışma zamanları](/tr/concepts/agent-runtimes)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [Ajan harness Plugin’leri](/tr/plugins/sdk-agent-harness)
- [Plugin kancaları](/tr/plugins/hooks)
- [Tanı dışa aktarımı](/tr/gateway/diagnostics)
- [Durum](/tr/cli/status)
- [Test](/tr/help/testing-live#live-codex-app-server-harness-smoke)
