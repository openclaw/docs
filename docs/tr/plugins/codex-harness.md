---
read_when:
    - Paketle gelen Codex app-server harness'ını kullanmak istiyorsunuz
    - Codex harness yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex dağıtımlarının PI'ye geri dönmek yerine başarısız olmasını istiyorsunuz
summary: OpenClaw gömülü ajan turlarını paketle gelen Codex uygulama sunucusu koşumu üzerinden çalıştırın
title: Codex çalıştırma altyapısı
x-i18n:
    generated_at: "2026-05-10T19:45:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: a43e58bb97b5216318f8e5a58adb670930d57595f5cc4e85eccb65a9d0d33281
    source_path: plugins/codex-harness.md
    workflow: 16
---

Paketle gelen `codex` Plugin'i, OpenClaw'ın yerleşik PI harness'ı yerine Codex app-server üzerinden gömülü OpenAI ajan dönüşleri çalıştırmasını sağlar.

Düşük seviyeli ajan oturumunu Codex'in yönetmesini istediğinizde Codex harness'ını kullanın: yerel thread sürdürme, yerel araç devamı, yerel compaction ve app-server yürütmesi. OpenClaw sohbet kanallarını, oturum dosyalarını, model seçimini, OpenClaw dinamik araçlarını, onayları, medya teslimini ve görünür döküm aynasını yönetmeye devam eder.

Normal kurulum `openai/gpt-5.5` gibi kanonik OpenAI model refs kullanır. `openai-codex/gpt-*` model refs yapılandırmayın. `openai-codex`, yeni ajan yapılandırması için model sağlayıcı öneki değil, Codex OAuth veya Codex API anahtarı profilleri için auth profili sağlayıcısıdır.

Daha geniş model/sağlayıcı/runtime ayrımı için
[Agent runtimes](/tr/concepts/agent-runtimes) ile başlayın. Kısa sürüm şudur:
`openai/gpt-5.5` model ref, `codex` runtime, Telegram,
Discord, Slack veya başka bir kanal ise iletişim yüzeyidir.

## Gereksinimler

- Paketle gelen `codex` Plugin'i kullanılabilir olan OpenClaw.
- Yapılandırmanız `plugins.allow` kullanıyorsa `codex` ekleyin.
- Codex app-server `0.125.0` veya daha yeni. Paketle gelen Plugin, varsayılan olarak uyumlu bir Codex app-server ikilisini yönetir; bu nedenle `PATH` üzerindeki yerel `codex` komutları normal harness başlatmasını etkilemez.
- `openclaw models auth login --provider openai-codex` üzerinden, ajanın Codex home'unda bir app-server hesabı üzerinden veya açık bir Codex API anahtarı auth profili üzerinden Codex auth kullanılabilir olmalıdır.

Auth önceliği, ortam yalıtımı, özel app-server komutları, model keşfi ve tüm yapılandırma alanları için bkz.
[Codex harness reference](/tr/plugins/codex-harness-reference).

## Hızlı başlangıç

OpenClaw içinde Codex isteyen çoğu kullanıcı şu yolu ister: ChatGPT/Codex aboneliğiyle oturum açın, paketle gelen `codex` Plugin'ini etkinleştirin ve kanonik bir `openai/gpt-*` model ref kullanın.

Codex OAuth ile oturum açın:

```bash
openclaw models auth login --provider openai-codex
```

Paketle gelen `codex` Plugin'ini etkinleştirin ve bir OpenAI ajan modeli seçin:

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

Yapılandırmanız `plugins.allow` kullanıyorsa `codex` öğesini oraya da ekleyin:

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

Plugin yapılandırmasını değiştirdikten sonra gateway'i yeniden başlatın. Mevcut bir sohbetin zaten oturumu varsa runtime değişikliklerini test etmeden önce `/new` veya `/reset` kullanın; böylece sonraki dönüş harness'ı güncel yapılandırmadan çözer.

## Yapılandırma

Hızlı başlangıç yapılandırması, uygulanabilir en küçük Codex harness yapılandırmasıdır. Codex harness seçeneklerini OpenClaw yapılandırmasında ayarlayın ve CLI'yi yalnızca Codex auth için kullanın:

| İhtiyaç                                | Ayarlanacak değer                                                  | Yer                            |
| -------------------------------------- | ------------------------------------------------------------------ | ------------------------------ |
| Harness'ı etkinleştir                  | `plugins.entries.codex.enabled: true`                              | OpenClaw yapılandırması        |
| Allowlist içeren Plugin kurulumunu koru | `plugins.allow` içine `codex` ekleyin                              | OpenClaw yapılandırması        |
| OpenAI ajan dönüşlerini Codex üzerinden yönlendir | `agents.defaults.model` veya `agents.list[].model` değeri `openai/gpt-*` olsun | OpenClaw ajan yapılandırması   |
| Codex OAuth ile oturum aç              | `openclaw models auth login --provider openai-codex`               | CLI auth profili               |
| Codex kullanılamadığında kapalı başarısız ol | Sağlayıcı veya model `agentRuntime.id: "codex"`                    | OpenClaw model/sağlayıcı yapılandırması |
| Doğrudan OpenAI API trafiği kullan     | Normal OpenAI auth ile sağlayıcı veya model `agentRuntime.id: "pi"` | OpenClaw model/sağlayıcı yapılandırması |
| App-server davranışını ayarla          | `plugins.entries.codex.config.appServer.*`                         | Codex Plugin yapılandırması    |
| Yerel Codex Plugin uygulamalarını etkinleştir | `plugins.entries.codex.config.codexPlugins.*`                      | Codex Plugin yapılandırması    |
| Codex Computer Use'u etkinleştir       | `plugins.entries.codex.config.computerUse.*`                       | Codex Plugin yapılandırması    |

Codex destekli OpenAI ajan dönüşleri için `openai/gpt-*` model refs kullanın.
`openai-codex` yalnızca Codex OAuth ve Codex API anahtarı profilleri için auth profili sağlayıcısı adıdır. Yeni `openai-codex/gpt-*` model refs yazmayın.

Bu sayfanın kalanı kullanıcıların seçmesi gereken yaygın varyantları kapsar:
dağıtım biçimi, kapalı başarısız yönlendirme, guardian onay ilkesi, yerel Codex Plugin'leri ve Computer Use. Tam seçenek listeleri, varsayılanlar, enum'lar, keşif, ortam yalıtımı, zaman aşımları ve app-server transport alanları için bkz.
[Codex harness reference](/tr/plugins/codex-harness-reference).

## Codex runtime'ını doğrulayın

Codex beklediğiniz sohbette `/status` kullanın. Codex destekli bir OpenAI ajan dönüşü şunu gösterir:

```text
Runtime: OpenAI Codex
```

Ardından Codex app-server durumunu kontrol edin:

```text
/codex status
/codex models
```

`/codex status` app-server bağlantısını, hesabı, hız sınırlarını, MCP sunucularını ve skills durumunu bildirir. `/codex models`, harness ve hesap için canlı Codex app-server kataloğunu listeler. `/status` beklenmedik görünüyorsa bkz.
[Sorun giderme](#troubleshooting).

## Yönlendirme ve model seçimi

Sağlayıcı refs ile runtime ilkesini ayrı tutun:

- Codex üzerinden OpenAI ajan dönüşleri için `openai/gpt-*` kullanın.
- Yapılandırmada `openai-codex/gpt-*` kullanmayın. Eski refs ve bayat oturum rota pin'lerini onarmak için `openclaw doctor --fix` çalıştırın.
- Normal OpenAI otomatik modu için `agentRuntime.id: "codex"` isteğe bağlıdır, ancak bir dağıtımın Codex kullanılamadığında kapalı başarısız olması gerektiğinde kullanışlıdır.
- `agentRuntime.id: "pi"`, niyet bu olduğunda bir sağlayıcıyı veya modeli doğrudan PI davranışına geçirir.
- `/codex ...` sohbetten yerel Codex app-server konuşmalarını denetler.
- ACP/acpx ayrı bir dış harness yoludur. Yalnızca kullanıcı ACP/acpx veya dış harness bağdaştırıcısı istediğinde kullanın.

Yaygın komut yönlendirmesi:

| Kullanıcı amacı                 | Kullanım                                |
| ------------------------------- | --------------------------------------- |
| Geçerli sohbeti bağla           | `/codex bind [--cwd <path>]`            |
| Mevcut bir Codex thread'ini sürdür | `/codex resume <thread-id>`             |
| Codex thread'lerini listele veya filtrele | `/codex threads [filter]`               |
| Yalnızca Codex geri bildirimi gönder | `/codex diagnostics [note]`             |
| ACP/acpx görevi başlat          | ACP/acpx oturum komutları, `/codex` değil |

| Kullanım durumu                                      | Yapılandırma                                                     | Doğrulama                              | Notlar                             |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Yerel Codex runtime ile ChatGPT/Codex aboneliği      | `openai/gpt-*` ve etkin `codex` Plugin'i                         | `/status` `Runtime: OpenAI Codex` gösterir | Önerilen yol                       |
| Codex kullanılamadığında kapalı başarısız ol         | Sağlayıcı veya model `agentRuntime.id: "codex"`                   | PI fallback yerine dönüş başarısız olur | Yalnızca Codex dağıtımları için kullanın |
| PI üzerinden doğrudan OpenAI API anahtarı trafiği    | Sağlayıcı veya model `agentRuntime.id: "pi"` ve normal OpenAI auth | `/status` PI runtime gösterir          | Yalnızca PI amaçlandığında kullanın |
| Eski yapılandırma                                    | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` bunu yeniden yazar | Yeni yapılandırmayı bu şekilde yazmayın |
| ACP/acpx Codex bağdaştırıcısı                        | ACP `sessions_spawn({ runtime: "acp" })`                         | ACP görev/oturum durumu                | Yerel Codex harness'tan ayrıdır    |

`agents.defaults.imageModel` aynı önek ayrımını izler. Normal OpenAI rotası için `openai/gpt-*`, görüntü anlama sınırlı bir Codex app-server dönüşü üzerinden çalışmalıysa yalnızca `codex/gpt-*` kullanın. `openai-codex/gpt-*` kullanmayın; doctor bu eski öneki `openai/gpt-*` olarak yeniden yazar.

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

Bu biçim Claude'u varsayılan ajan olarak tutar ve adlandırılmış bir Codex ajanı ekler:

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

Bu yapılandırmayla `main` ajanı normal sağlayıcı yolunu kullanır ve `codex` ajanı Codex app-server kullanır.

### Kapalı başarısız Codex dağıtımı

OpenAI ajan dönüşleri için, paketle gelen Plugin kullanılabilir olduğunda `openai/gpt-*` zaten Codex'e çözümlenir. Yazılı bir kapalı başarısız kural istediğinizde açık runtime ilkesi ekleyin:

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

Codex zorlandığında, Codex Plugin'i devre dışıysa, app-server çok eskiyse veya app-server başlatılamıyorsa OpenClaw erken başarısız olur.

## App-server ilkesi

Varsayılan olarak Plugin, OpenClaw'ın yönettiği Codex ikilisini stdio transport ile yerel olarak başlatır. `appServer.command` değerini yalnızca bilerek farklı bir yürütülebilir dosya çalıştırmak istediğinizde ayarlayın. WebSocket transport'u yalnızca bir app-server zaten başka bir yerde çalışıyorsa kullanın:

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

Yerel stdio app-server oturumları varsayılan olarak güvenilen yerel operatör duruşunu kullanır:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Yerel Codex gereksinimleri bu örtük YOLO duruşuna izin vermiyorsa OpenClaw bunun yerine izin verilen guardian yetkilerini seçer.

Sandbox kaçışlarından veya ek izinlerden önce Codex yerel otomatik incelemesi istediğinizde guardian modunu kullanın:

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
`sandbox: "workspace-write"` olacak şekilde Codex app-server onaylarına genişler.

Her app-server alanı, auth sırası, ortam yalıtımı, keşif ve zaman aşımı davranışı için bkz. [Codex harness reference](/tr/plugins/codex-harness-reference).

## Komutlar ve tanılama

Paketle gelen Plugin, OpenClaw metin komutlarını destekleyen herhangi bir kanalda `/codex` komutunu slash command olarak kaydeder.

Yaygın biçimler:

- `/codex status` app-server bağlantısını, modelleri, hesabı, oran sınırlarını,
  MCP sunucularını ve Skills’i denetler.
- `/codex models` canlı Codex app-server modellerini listeler.
- `/codex threads [filter]` son Codex app-server iş parçacıklarını listeler.
- `/codex resume <thread-id>` geçerli OpenClaw oturumunu mevcut bir Codex iş
  parçacığına bağlar.
- `/codex compact` Codex app-server’dan bağlı iş parçacığını sıkıştırmasını ister.
- `/codex review` bağlı iş parçacığı için Codex yerel incelemesini başlatır.
- `/codex diagnostics [note]` bağlı iş parçacığı için Codex geri bildirimi
  göndermeden önce sorar.
- `/codex account` hesap ve oran sınırı durumunu gösterir.
- `/codex mcp` Codex app-server MCP sunucusu durumunu listeler.
- `/codex skills` Codex app-server Skills’ini listeler.

Çoğu destek raporu için, hatanın gerçekleştiği konuşmada `/diagnostics [note]`
ile başlayın. Bu, bir Gateway tanılama raporu oluşturur ve Codex harness
oturumları için ilgili Codex geri bildirim paketini göndermek üzere onay ister.
Gizlilik modeli ve grup sohbeti davranışı için [Tanılama dışa aktarımı](/tr/gateway/diagnostics)
bölümüne bakın.

`/codex diagnostics [note]` komutunu yalnızca tam Gateway tanılama paketi olmadan
geçerli olarak bağlı iş parçacığı için özellikle Codex geri bildirimi yüklemesi
istediğinizde kullanın.

### Codex iş parçacıklarını yerelde inceleme

Kötü bir Codex çalışmasını incelemenin en hızlı yolu genellikle yerel Codex iş
parçacığını doğrudan açmaktır:

```bash
codex resume <thread-id>
```

İş parçacığı kimliğini tamamlanan `/diagnostics` yanıtından, `/codex binding`
komutundan veya `/codex threads [filter]` komutundan alın.

Yükleme mekanikleri ve çalışma zamanı düzeyindeki tanılama sınırları için
[Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime#codex-feedback-upload)
bölümüne bakın.

Kimlik doğrulama şu sırayla seçilir:

1. Aracı için açık bir OpenClaw Codex kimlik doğrulama profili.
2. Bu aracının Codex ana dizinindeki app-server’ın mevcut hesabı.
3. Yalnızca yerel stdio app-server başlatmaları için, app-server hesabı yoksa ve
   OpenAI kimlik doğrulaması hâlâ gerekiyorsa `CODEX_API_KEY`, ardından
   `OPENAI_API_KEY`.

OpenClaw bir ChatGPT abonelik tarzı Codex kimlik doğrulama profili gördüğünde,
oluşturulan Codex alt sürecinden `CODEX_API_KEY` ve `OPENAI_API_KEY`
değişkenlerini kaldırır. Bu, Gateway düzeyindeki API anahtarlarının embedding’ler
veya doğrudan OpenAI modelleri için kullanılabilir kalmasını sağlarken yerel
Codex app-server dönüşlerinin yanlışlıkla API üzerinden ücretlendirilmesini
önler. Açık Codex API anahtarı profilleri ve yerel stdio env anahtarı yedeği,
miras alınan alt süreç ortamı yerine app-server oturum açmasını kullanır.
WebSocket app-server bağlantıları Gateway env API anahtarı yedeğini almaz; açık
bir kimlik doğrulama profili veya uzak app-server’ın kendi hesabını kullanın.

Bir dağıtım ek ortam yalıtımı gerektiriyorsa, bu değişkenleri `appServer.clearEnv`
öğesine ekleyin:

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

Codex dinamik araçları varsayılan olarak `searchable` yüklemeyi kullanır.
OpenClaw, Codex’e özgü çalışma alanı işlemlerini çoğaltan dinamik araçları
sunmaz: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` ve
`update_plan`. Mesajlaşma, oturumlar, medya, cron, tarayıcı, düğümler, gateway,
`heartbeat_respond` ve `web_search` gibi kalan OpenClaw entegrasyon araçları,
ilk model bağlamını daha küçük tutarak `openclaw` ad alanı altında Codex araç
araması aracılığıyla kullanılabilir.
`sessions_yield` ve yalnızca mesaj aracı kaynak yanıtları doğrudan kalır çünkü
bunlar dönüş denetimi sözleşmeleridir. Heartbeat iş birliği yönergeleri, araç
zaten yüklenmemişse bir heartbeat dönüşünü bitirmeden önce Codex’e
`heartbeat_respond` aramasını söyler.

`codexDynamicToolsLoading: "direct"` değerini yalnızca ertelenmiş dinamik
araçlarda arama yapamayan özel bir Codex app-server’a bağlanırken veya tam araç
yükünü hata ayıklarken ayarlayın.

Desteklenen üst düzey Codex Plugin alanları:

| Alan                       | Varsayılan    | Anlam                                                                                    |
| -------------------------- | ------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | OpenClaw dinamik araçlarını doğrudan ilk Codex araç bağlamına koymak için `"direct"` kullanın. |
| `codexDynamicToolsExclude` | `[]`          | Codex app-server dönüşlerinden çıkarılacak ek OpenClaw dinamik araç adları.              |
| `codexPlugins`             | devre dışı    | Taşınmış, kaynaktan yüklenmiş küratörlü plugin’ler için yerel Codex plugin/app desteği.  |

Desteklenen `appServer` alanları:

| Alan                          | Varsayılan                                            | Anlam                                                                                                                                                                                                                                  |
| ----------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                             | `"stdio"` Codex’i oluşturur; `"websocket"` `url` adresine bağlanır.                                                                                                                                                                    |
| `command`                     | yönetilen Codex ikilisi                              | stdio transport için çalıştırılabilir dosya. Yönetilen ikiliyi kullanmak için ayarsız bırakın; yalnızca açık bir geçersiz kılma için ayarlayın.                                                                                       |
| `args`                        | `["app-server", "--listen", "stdio://"]`              | stdio transport için argümanlar.                                                                                                                                                                                                       |
| `url`                         | ayarsız                                               | WebSocket app-server URL’si.                                                                                                                                                                                                           |
| `authToken`                   | ayarsız                                               | WebSocket transport için Bearer token.                                                                                                                                                                                                 |
| `headers`                     | `{}`                                                  | Ek WebSocket başlıkları.                                                                                                                                                                                                               |
| `clearEnv`                    | `[]`                                                  | OpenClaw miras alınan ortamını oluşturduktan sonra oluşturulan stdio app-server sürecinden kaldırılan ek ortam değişkeni adları. `CODEX_HOME` ve `HOME`, yerel başlatmalarda OpenClaw’ın aracı başına Codex yalıtımı için ayrılmıştır. |
| `requestTimeoutMs`            | `60000`                                               | app-server denetim düzlemi çağrıları için zaman aşımı.                                                                                                                                                                                 |
| `turnCompletionIdleTimeoutMs` | `60000`                                               | OpenClaw `turn/completed` beklerken, dönüş kapsamlı bir Codex app-server isteğinden sonraki sessiz pencere. Bunu yavaş araç sonrası veya yalnızca durum sentezi aşamaları için yükseltin.                                             |
| `mode`                        | yerel Codex gereksinimleri YOLO’ya izin vermediği sürece `"yolo"` | YOLO veya guardian tarafından incelenen yürütme için ön ayar. `danger-full-access`, `never` onayı veya `user` inceleyicisini atlayan yerel stdio gereksinimleri örtük varsayılanı guardian yapar.                                     |
| `approvalPolicy`              | `"never"` veya izin verilen bir guardian onay politikası | İş parçacığı başlatma/sürdürme/dönüş için gönderilen yerel Codex onay politikası. Guardian varsayılanları izin verildiğinde `"on-request"` tercih eder.                                                                               |
| `sandbox`                     | `"danger-full-access"` veya izin verilen bir guardian sandbox | İş parçacığı başlatma/sürdürme için gönderilen yerel Codex sandbox modu. Guardian varsayılanları izin verildiğinde `"workspace-write"` tercih eder, aksi halde `"read-only"`.                                                         |
| `approvalsReviewer`           | `"user"` veya izin verilen bir guardian inceleyici    | İzin verildiğinde Codex’in yerel onay istemlerini incelemesine izin vermek için `"auto_review"` kullanın, aksi halde `guardian_subagent` veya `user`. `guardian_subagent` eski bir takma ad olarak kalır.                             |
| `serviceTier`                 | ayarsız                                               | İsteğe bağlı Codex app-server hizmet katmanı. `"priority"` hızlı mod yönlendirmeyi etkinleştirir, `"flex"` flex işlemeyi ister, `null` geçersiz kılmayı temizler ve eski `"fast"` `"priority"` olarak kabul edilir.                    |

OpenClaw’ın sahip olduğu dinamik araç çağrıları `appServer.requestTimeoutMs`
değerinden bağımsız olarak sınırlandırılır: Codex `item/tool/call` istekleri
varsayılan olarak 30 saniyelik bir OpenClaw watchdog kullanır. Pozitif bir çağrı
başı `timeoutMs` argümanı, bu belirli araç bütçesini uzatır veya kısaltır.
`image_generate` aracı, araç çağrısı kendi zaman aşımını sağlamadığında
`agents.defaults.imageGenerationModel.timeoutMs` değerini de kullanır ve medya
anlama `image` aracı `tools.media.image.timeoutSeconds` değerini veya 60
saniyelik medya varsayılanını kullanır. Dinamik araç bütçeleri 600000 ms ile
sınırlıdır. Zaman aşımında OpenClaw, desteklendiği yerde araç sinyalini iptal
eder ve Codex’e başarısız bir dinamik araç yanıtı döndürür; böylece oturum
`processing` durumunda bırakılmak yerine dönüş devam edebilir.

OpenClaw bir Codex dönüş kapsamlı app-server isteğine yanıt verdikten sonra,
harness ayrıca Codex’in yerel dönüşü `turn/completed` ile bitirmesini bekler.
app-server bu yanıttan sonra `appServer.turnCompletionIdleTimeoutMs` süresince
sessiz kalırsa, OpenClaw en iyi çabayla Codex dönüşünü keser, bir tanılama zaman
aşımı kaydeder ve takip sohbet mesajlarının eski bir yerel dönüşün arkasında
kuyruğa alınmaması için OpenClaw oturum şeridini serbest bırakır. Aynı dönüş
için `rawResponseItem/completed` dahil herhangi bir terminal olmayan bildirim,
Codex dönüşün hâlâ canlı olduğunu kanıtladığı için bu kısa watchdog’u devre dışı
bırakır; daha uzun terminal watchdog gerçekten takılmış dönüşleri korumaya devam
eder. Zaman aşımı tanılamaları son app-server bildirim yöntemini ve ham assistant
yanıt öğeleri için öğe türünü, rolü, kimliği ve sınırlandırılmış assistant metni
önizlemesini içerir.

Yerel test için ortam geçersiz kılmaları kullanılabilir kalır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`, `appServer.command` ayarsız olduğunda yönetilen
ikiliyi atlar.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırıldı. Bunun yerine
`plugins.entries.codex.config.appServer.mode: "guardian"` kullanın veya tek seferlik
yerel test için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın. Config,
Plugin davranışını Codex harness kurulumunun geri kalanıyla aynı incelenmiş
dosyada tuttuğu için tekrarlanabilir dağıtımlar için tercih edilir.

## Yerel Codex Plugin'leri

Yerel Codex Plugin desteği, OpenClaw harness dönüşüyle aynı Codex iş parçacığında
Codex app-server'ın kendi uygulama ve Plugin yeteneklerini kullanır. OpenClaw,
Codex Plugin'lerini sentetik `codex_plugin_*` OpenClaw dinamik araçlarına
çevirmez.

`codexPlugins` yalnızca yerel Codex harness'ını seçen oturumları etkiler. PI
çalıştırmaları, normal OpenAI sağlayıcı çalıştırmaları, ACP konuşma bağlamaları
veya diğer harness'lar üzerinde etkisi yoktur.

En küçük geçirilmiş config:

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

İş parçacığı uygulama config'i, OpenClaw bir Codex harness oturumu kurduğunda
veya eskimiş bir Codex iş parçacığı bağlamasını değiştirdiğinde hesaplanır. Her
dönüşte yeniden hesaplanmaz. `codexPlugins` değiştirildikten sonra, gelecekteki
Codex harness oturumlarının güncellenmiş uygulama kümesiyle başlaması için
`/new`, `/reset` kullanın veya gateway'i yeniden başlatın.

Geçiş uygunluğu, uygulama envanteri, yıkıcı eylem politikası, bilgi istemleri ve
yerel Plugin tanıları için bkz.
[Yerel Codex Plugin'leri](/tr/plugins/codex-native-plugins).

## Bilgisayar Kullanımı

Bilgisayar Kullanımı kendi kurulum kılavuzunda ele alınır:
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use).

Kısa sürüm: OpenClaw, masaüstü denetim uygulamasını vendor etmez veya masaüstü
eylemlerini kendisi yürütmez. Codex app-server'ı hazırlar, `computer-use` MCP
sunucusunun kullanılabilir olduğunu doğrular ve ardından Codex modu dönüşleri
sırasında yerel MCP araç çağrılarını Codex'e bırakır.

## Çalışma zamanı sınırları

Codex harness yalnızca düşük seviyeli gömülü aracı yürütücüsünü değiştirir.

- OpenClaw dinamik araçları desteklenir. Codex, OpenClaw'dan bu araçları
  yürütmesini ister; bu nedenle OpenClaw yürütme yolunda kalır.
- Codex'e yerel shell, patch, MCP ve yerel uygulama araçları Codex tarafından
  sahiplenilir. OpenClaw, desteklenen aktarma üzerinden seçili yerel olayları
  gözlemleyebilir veya engelleyebilir, ancak yerel araç argümanlarını yeniden yazmaz.
- Yerel Compaction Codex'e aittir. OpenClaw; kanal geçmişi, arama, `/new`,
  `/reset` ve gelecekteki model veya harness geçişleri için bir döküm aynası tutar.
- Medya üretimi, medya anlama, TTS, onaylar ve mesajlaşma aracı çıktısı, eşleşen
  OpenClaw sağlayıcı/model ayarları üzerinden devam eder.
- `tool_result_persist`, Codex'e yerel araç sonuç kayıtlarına değil,
  OpenClaw'a ait döküm araç sonuçlarına uygulanır.

Hook katmanları, desteklenen V1 yüzeyleri, yerel izin işleme, kuyruk yönlendirme,
Codex geri bildirim yükleme mekanikleri ve Compaction ayrıntıları için bkz.
[Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime).

## Sorun giderme

**Codex normal bir `/model` sağlayıcısı olarak görünmüyor:** bu, yeni
config'ler için beklenen durumdur. Bir `openai/gpt-*` modeli seçin,
`plugins.entries.codex.enabled` etkinleştirin ve `plugins.allow` öğesinin
`codex` öğesini hariç tutup tutmadığını kontrol edin.

**OpenClaw, Codex yerine PI kullanıyor:** model ref'inin resmi OpenAI
sağlayıcısında `openai/gpt-*` olduğundan ve Codex Plugin'inin kurulu ve etkin
olduğundan emin olun. Test sırasında kesin kanıta ihtiyacınız varsa sağlayıcı
veya model için `agentRuntime.id: "codex"` ayarlayın. Zorunlu Codex çalışma
zamanı, PI'a geri dönmek yerine başarısız olur.

**Eski `openai-codex/*` config'i kalmış:** `openclaw doctor --fix` çalıştırın.
Doctor, eski model ref'lerini `openai/*` olarak yeniden yazar, eskimiş oturum ve
tüm aracı çalışma zamanı pin'lerini kaldırır ve mevcut auth-profile
geçersiz kılmalarını korur.

**app-server reddediliyor:** Codex app-server `0.125.0` veya daha yenisini
kullanın. Aynı sürüm prerelease'leri veya `0.125.0-alpha.2` ya da
`0.125.0+custom` gibi build sonekli sürümler reddedilir, çünkü OpenClaw kararlı
`0.125.0` protokol tabanını test eder.

**`/codex status` bağlanamıyor:** paketlenen `codex` Plugin'inin etkin
olduğunu, bir izin listesi yapılandırılmışsa `plugins.allow` öğesinin onu
içerdiğini ve özel `appServer.command`, `url`, `authToken` veya başlıkların
geçerli olduğunu kontrol edin.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs`
değerini düşürün veya keşfi devre dışı bırakın. Bkz.
[Codex harness referansı](/tr/plugins/codex-harness-reference#model-discovery).

**WebSocket aktarımı hemen başarısız oluyor:** `appServer.url`, `authToken`,
başlıkları ve uzak app-server'ın aynı Codex app-server protokol sürümünü
konuştuğunu kontrol edin.

**Codex olmayan bir model PI kullanıyor:** sağlayıcı veya model çalışma zamanı
politikası onu başka bir harness'a yönlendirmediği sürece bu beklenen durumdur.
Düz Codex olmayan sağlayıcı ref'leri, `auto` modunda normal sağlayıcı yolunda
kalır.

**Bilgisayar Kullanımı kurulu ama araçlar çalışmıyor:** yeni bir oturumdan
`/codex computer-use status` kontrol edin. Bir araç `Native hook relay unavailable`
bildirirse `/new` veya `/reset` kullanın; sorun devam ederse eskimiş yerel hook
kayıtlarını temizlemek için gateway'i yeniden başlatın. Bkz.
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use#troubleshooting).

## İlgili

- [Codex harness referansı](/tr/plugins/codex-harness-reference)
- [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [Yerel Codex Plugin'leri](/tr/plugins/codex-native-plugins)
- [Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use)
- [Aracı çalışma zamanları](/tr/concepts/agent-runtimes)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [Aracı harness Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Plugin hook'ları](/tr/plugins/hooks)
- [Tanı dışa aktarma](/tr/gateway/diagnostics)
- [Durum](/tr/cli/status)
- [Test](/tr/help/testing-live#live-codex-app-server-harness-smoke)
