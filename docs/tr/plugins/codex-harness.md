---
read_when:
    - Birlikte gelen Codex app-server test düzeneğini kullanmak istiyorsunuz
    - Codex harness yapılandırma örneklerine ihtiyacınız var
    - Codex'e özel dağıtımların OpenClaw'a geri dönmek yerine başarısız olmasını istersiniz
summary: Birlikte gelen Codex app-server çalıştırma düzeneği üzerinden OpenClaw gömülü ajan turlarını çalıştırın
title: Codex test düzeneği
x-i18n:
    generated_at: "2026-06-28T00:52:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfa04f53d01aad16dd6ea499ea1c04b1050c80ed12326db6fb4fa88c9c40a68c
    source_path: plugins/codex-harness.md
    workflow: 16
---

Paketle gelen `codex` Plugin, OpenClaw'un yerleşik OpenClaw harness yerine Codex app-server üzerinden gömülü OpenAI agent dönüşleri çalıştırmasını sağlar.

Codex'in düşük düzey agent oturumunu yönetmesini istediğinizde Codex harness kullanın: yerel thread sürdürme, yerel tool devamı, yerel Compaction ve app-server yürütmesi. OpenClaw yine de sohbet kanallarını, oturum dosyalarını, model seçimini, OpenClaw dinamik tool'larını, onayları, medya teslimini ve görünür transcript aynasını yönetir.

Normal kurulum `openai/gpt-5.5` gibi kanonik OpenAI model ref'lerini kullanır. Eski Codex GPT ref'lerini yapılandırmayın. OpenAI agent auth sırasını `auth.order.openai` altına koyun; eski Codex auth profil kimlikleri ve eski Codex auth sıra girdileri `openclaw doctor --fix` tarafından onarılan eski durumdur.

Etkin bir OpenClaw sandbox olmadığında OpenClaw, code-mode-only varsayılan olarak kapalı kalırken Codex app-server thread'lerini Codex yerel kod modu etkin şekilde başlatır. Bu, OpenClaw dinamik tool'ları app-server `item/tool/call` köprüsü üzerinden devam ederken Codex yerel workspace ve kod yeteneklerini kullanılabilir tutar. Etkin OpenClaw sandboxing ve kısıtlı tool ilkeleri, deneysel sandbox exec-server yolunu seçmediğiniz sürece yerel kod modunu tamamen devre dışı bırakır.

Bu Codex-native özellik, farklı bir `exec` girdi şekline sahip genel OpenClaw çalıştırmaları için opt-in QuickJS-WASI runtime olan [OpenClaw kod modundan](/tr/reference/code-mode) ayrıdır.

Daha geniş model/provider/runtime ayrımı için [Agent runtime'ları](/tr/concepts/agent-runtimes) ile başlayın. Kısa versiyon şudur: `openai/gpt-5.5` model ref'idir, `codex` runtime'dır ve Telegram, Discord, Slack veya başka bir kanal iletişim yüzeyi olarak kalır.

## Gereksinimler

- Paketle gelen `codex` Plugin kullanılabilir olan OpenClaw.
- Yapılandırmanız `plugins.allow` kullanıyorsa `codex` ekleyin.
- Codex app-server `0.125.0` veya daha yenisi. Paketle gelen Plugin varsayılan olarak uyumlu bir Codex app-server ikilisini yönetir, bu nedenle `PATH` üzerindeki yerel `codex` komutları normal harness başlangıcını etkilemez.
- `openclaw models auth login --provider openai` üzerinden, agent'ın Codex home'unda bir app-server hesabı üzerinden veya açık bir Codex API-key auth profili üzerinden kullanılabilir Codex auth.

Auth önceliği, ortam izolasyonu, özel app-server komutları, model keşfi ve tüm yapılandırma alanları için [Codex harness referansı](/tr/plugins/codex-harness-reference) sayfasına bakın.

## Hızlı Başlangıç

OpenClaw içinde Codex isteyen çoğu kullanıcı şu yolu ister: bir ChatGPT/Codex aboneliğiyle oturum açın, paketle gelen `codex` Plugin'i etkinleştirin ve kanonik bir `openai/gpt-*` model ref'i kullanın.

Codex OAuth ile oturum açın:

```bash
openclaw models auth login --provider openai
```

Paketle gelen `codex` Plugin'i etkinleştirin ve bir OpenAI agent modeli seçin:

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

Plugin yapılandırmasını değiştirdikten sonra gateway'i yeniden başlatın. Mevcut bir sohbette zaten oturum varsa, runtime değişikliklerini test etmeden önce `/new` veya `/reset` kullanın ki sonraki dönüş harness'i mevcut yapılandırmadan çözümlesin.

## Yapılandırma

Hızlı başlangıç yapılandırması asgari uygulanabilir Codex harness yapılandırmasıdır. Codex harness seçeneklerini OpenClaw yapılandırmasında ayarlayın ve CLI'yi yalnızca Codex auth için kullanın:

| İhtiyaç                                | Ayarla                                                                           | Yer                                |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Harness'i etkinleştir                  | `plugins.entries.codex.enabled: true`                                            | OpenClaw yapılandırması            |
| İzin listeli Plugin kurulumunu koru    | `plugins.allow` içine `codex` ekleyin                                            | OpenClaw yapılandırması            |
| OpenAI agent dönüşlerini Codex'e yönlendir | `openai/gpt-*` olarak `agents.defaults.model` veya `agents.list[].model`      | OpenClaw agent yapılandırması      |
| ChatGPT/Codex OAuth ile oturum aç      | `openclaw models auth login --provider openai`                                   | CLI auth profili                   |
| Codex çalıştırmaları için API-key yedeği ekle | `auth.order.openai` içinde abonelik auth'tan sonra listelenen `openai:*` API-key profili | CLI auth profili + OpenClaw yapılandırması |
| Codex kullanılamadığında kapalı başarısız ol | Provider veya model `agentRuntime.id: "codex"`                              | OpenClaw model/provider yapılandırması |
| Doğrudan OpenAI API trafiği kullan     | Normal OpenAI auth ile provider veya model `agentRuntime.id: "openclaw"`         | OpenClaw model/provider yapılandırması |
| App-server davranışını ayarla          | `plugins.entries.codex.config.appServer.*`                                       | Codex Plugin yapılandırması        |
| Yerel Codex Plugin uygulamalarını etkinleştir | `plugins.entries.codex.config.codexPlugins.*`                              | Codex Plugin yapılandırması        |
| Codex Computer Use'u etkinleştir       | `plugins.entries.codex.config.computerUse.*`                                     | Codex Plugin yapılandırması        |

Codex destekli OpenAI agent dönüşleri için `openai/gpt-*` model ref'lerini kullanın. Abonelik-öncelikli/API-key-yedek sıralaması için `auth.order.openai` tercih edin. Mevcut eski Codex auth profil kimlikleri ve eski Codex auth sırası yalnızca doctor'a ait eski durumdur; yeni eski Codex GPT ref'leri yazmayın.

Codex destekli agent'larda `compaction.model` veya `compaction.provider` ayarlamayın. Codex kendi yerel app-server thread durumu üzerinden sıkıştırır, bu yüzden OpenClaw runtime'da bu yerel özetleyici override'larını yok sayar ve agent Codex kullandığında `openclaw doctor --fix` bunları kaldırır.

Lossless, Codex dönüşleri etrafında assembly, ingestion ve maintenance için context engine olarak desteklenmeye devam eder. Onu `agents.defaults.compaction.provider` üzerinden değil, `plugins.slots.contextEngine: "lossless-claw"` ve `plugins.entries.lossless-claw.config.summaryModel` üzerinden yapılandırın. Codex etkin runtime olduğunda `openclaw doctor --fix`, eski `compaction.provider: "lossless-claw"` şeklini Lossless context-engine slot'una taşır, ancak yerel Codex yine de Compaction'ı yönetir.

Yerel Codex app-server harness, pre-prompt assembly gerektiren context engine'leri destekler. `codex-cli` dahil genel CLI backend'leri bu host yeteneğini sağlamaz.

Codex destekli agent'lar için `/compact`, bağlı thread üzerinde yerel Codex app-server Compaction başlatır. OpenClaw tamamlanmasını beklemez, OpenClaw timeout uygulamaz, paylaşılan app-server'ı yeniden başlatmaz veya bir context-engine ya da public OpenAI özetleyicisine geri dönmez. Yerel Codex thread bağlaması eksik veya stale ise komut kapalı başarısız olur, böylece operator Compaction backend'lerini sessizce değiştirmek yerine gerçek runtime sınırını görür.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Bu yapıda, her iki profil de `openai/gpt-*` agent dönüşleri için Codex üzerinden çalışmaya devam eder. API key yalnızca bir auth fallback'idir; OpenClaw'a veya düz OpenAI Responses'a geçme isteği değildir.

Bu sayfanın geri kalanı kullanıcıların seçmesi gereken yaygın varyantları kapsar: deployment şekli, fail-closed routing, guardian onay ilkesi, yerel Codex Plugin'leri ve Computer Use. Tam seçenek listeleri, varsayılanlar, enum'lar, keşif, ortam izolasyonu, timeout'lar ve app-server transport alanları için [Codex harness referansı](/tr/plugins/codex-harness-reference) sayfasına bakın.

## Codex runtime'ını doğrulayın

Codex beklediğiniz sohbette `/status` kullanın. Codex destekli bir OpenAI agent dönüşü şunu gösterir:

```text
Runtime: OpenAI Codex
```

Ardından Codex app-server durumunu kontrol edin:

```text
/codex status
/codex models
```

`/codex status` app-server bağlantısını, hesabı, rate limit'leri, MCP sunucularını ve skills'i raporlar. `/codex models`, harness ve hesap için canlı Codex app-server kataloğunu listeler. `/status` şaşırtıcıysa [Sorun giderme](#troubleshooting) bölümüne bakın.

## Yönlendirme ve model seçimi

Provider ref'lerini ve runtime ilkesini ayrı tutun:

- Codex üzerinden OpenAI agent dönüşleri için `openai/gpt-*` kullanın.
- Yapılandırmada eski Codex GPT ref'leri kullanmayın. Eski ref'leri ve stale oturum route pin'lerini onarmak için `openclaw doctor --fix` çalıştırın.
- `agentRuntime.id: "codex"` normal OpenAI otomatik modu için isteğe bağlıdır, ancak bir deployment Codex kullanılamadığında kapalı başarısız olmalıysa kullanışlıdır.
- `agentRuntime.id: "openclaw"`, kasıtlı olduğunda bir provider veya modeli OpenClaw gömülü runtime'ına geçirir.
- `/codex ...`, sohbetten yerel Codex app-server konuşmalarını kontrol eder.
- ACP/acpx ayrı bir harici harness yoludur. Yalnızca kullanıcı ACP/acpx veya harici harness adapter'ı istediğinde kullanın.

Yaygın komut yönlendirme:

| Kullanıcı niyeti                                      | Kullan                                                                                               |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Mevcut sohbeti bağla                                  | `/codex bind [--cwd <path>]`                                                                          |
| Mevcut bir Codex thread'ini sürdür                    | `/codex resume <thread-id>`                                                                           |
| Codex thread'lerini listele veya filtrele             | `/codex threads [filter]`                                                                             |
| Yerel Codex Plugin'lerini listele                     | `/codex plugins list`                                                                                 |
| Yapılandırılmış yerel Codex Plugin'i etkinleştir veya devre dışı bırak | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Eşleştirilmiş bir node üzerinde mevcut Codex CLI oturumunu ekle | `/codex sessions --host <node> [filter]`, ardından `/codex resume <session-id> --host <node> --bind here` |
| Yalnızca Codex geri bildirimi gönder                  | `/codex diagnostics [note]`                                                                           |
| Bir ACP/acpx görevi başlat                            | ACP/acpx oturum komutları, `/codex` değil                                                             |

| Kullanım durumu                                      | Yapılandırma                                                           | Doğrulama                              | Notlar                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------- | --------------------------------------- |
| Yerel Codex çalışma zamanı ile ChatGPT/Codex aboneliği | `openai/gpt-*` ve etkin `codex` plugin                                 | `/status`, `Runtime: OpenAI Codex` gösterir | Önerilen yol                            |
| Codex kullanılamıyorsa güvenli biçimde hata ver      | Sağlayıcı veya model `agentRuntime.id: "codex"`                        | Gömülü geri dönüş yerine tur hata verir | Yalnızca Codex dağıtımları için kullanın |
| OpenAI API anahtarı trafiğini OpenClaw üzerinden yönlendir | Sağlayıcı veya model `agentRuntime.id: "openclaw"` ve normal OpenAI kimlik doğrulaması | `/status`, OpenClaw çalışma zamanını gösterir | Yalnızca OpenClaw bilinçli olarak istendiğinde kullanın |
| Eski yapılandırma                                    | eski Codex GPT referansları                                            | `openclaw doctor --fix` bunu yeniden yazar | Yeni yapılandırmayı bu şekilde yazmayın |
| ACP/acpx Codex bağdaştırıcısı                        | ACP `sessions_spawn({ runtime: "acp" })`                               | ACP görev/oturum durumu                | Yerel Codex harness'ından ayrıdır       |

`agents.defaults.imageModel` aynı önek ayrımını izler. Normal OpenAI rotası için
`openai/gpt-*` kullanın; görüntü anlama yalnızca sınırlı bir Codex uygulama
sunucusu turu üzerinden çalışmalıysa `codex/gpt-*` kullanın. Eski Codex GPT
referanslarını kullanmayın; doctor bu eski öneki `openai/gpt-*` olarak yeniden
yazar.

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

Bu şekil Claude'u varsayılan ajan olarak tutar ve adlandırılmış bir Codex ajanı
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

Bu yapılandırmayla `main` ajanı normal sağlayıcı yolunu kullanır ve `codex`
ajanı Codex uygulama sunucusunu kullanır.

### Güvenli biçimde hata veren Codex dağıtımı

OpenAI ajan turları için `openai/gpt-*`, paketli Plugin kullanılabilir olduğunda
zaten Codex'e çözümlenir. Yazılı bir güvenli hata kuralı istediğinizde açık
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

Codex zorunlu kılındığında, Codex Plugin devre dışıysa, uygulama sunucusu çok
eskiyse veya uygulama sunucusu başlatılamıyorsa OpenClaw erken hata verir.

## Uygulama sunucusu ilkesi

Varsayılan olarak Plugin, OpenClaw'ın yönetilen Codex ikilisini stdio taşımasıyla
yerelde başlatır. `appServer.command` değerini yalnızca bilinçli olarak farklı
bir çalıştırılabilir dosya çalıştırmak istediğinizde ayarlayın. WebSocket
taşımasını yalnızca bir uygulama sunucusu başka bir yerde zaten çalışıyorsa
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

Yerel stdio uygulama sunucusu oturumları, güvenilen yerel operatör duruşunu
varsayar: `approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Yerel Codex gereksinimleri bu örtük YOLO
duruşuna izin vermezse OpenClaw bunun yerine izin verilen koruyucu izinlerini
seçer. Oturum için bir OpenClaw sandbox etkin olduğunda OpenClaw, Codex ana
makine tarafı sandbox'a güvenmek yerine o tur için Codex yerel Code Mode'u,
kullanıcı MCP sunucularını ve uygulama destekli Plugin yürütmesini devre dışı
bırakır. Normal exec/process araçları kullanılabilir olduğunda kabuk erişimi,
`sandbox_exec` ve `sandbox_process` gibi OpenClaw sandbox destekli dinamik
araçlar üzerinden sunulur.

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

Codex uygulama sunucusu oturumları için OpenClaw, `tools.exec.mode: "auto"`
değerini Codex Guardian tarafından incelenen onaylara eşler; yerel gereksinimler
bu değerlere izin verdiğinde bu genellikle `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` ve `sandbox: "workspace-write"` olur.
`tools.exec.mode: "auto"` içinde OpenClaw, eski güvenli olmayan Codex
`approvalPolicy: "never"` veya `sandbox: "danger-full-access"` geçersiz
kılmalarını korumaz; bilinçli olarak onaysız bir Codex duruşu için
`tools.exec.mode: "full"` kullanın. Eski
`plugins.entries.codex.config.appServer.mode: "guardian"` ön ayarı hâlâ çalışır,
ancak `tools.exec.mode: "auto"` normalleştirilmiş OpenClaw yüzeyidir.

Ana makine exec onayları ve ACPX izinleriyle mod düzeyi karşılaştırması için
bkz. [İzin modları](/tr/tools/permission-modes).

Her uygulama sunucusu alanı, kimlik doğrulama sırası, ortam yalıtımı, keşif ve
zaman aşımı davranışı için bkz. [Codex harness referansı](/tr/plugins/codex-harness-reference).

## Komutlar ve tanılama

Paketli Plugin, OpenClaw metin komutlarını destekleyen herhangi bir kanalda
`/codex` komutunu eğik çizgi komutu olarak kaydeder.

Yaygın biçimler:

- `/codex status`, uygulama sunucusu bağlantısını, modelleri, hesabı, hız
  sınırlarını, MCP sunucularını ve Skills'i denetler.
- `/codex models`, canlı Codex uygulama sunucusu modellerini listeler.
- `/codex threads [filter]`, son Codex uygulama sunucusu iş parçacıklarını
  listeler.
- `/codex resume <thread-id>`, geçerli OpenClaw oturumunu mevcut bir Codex iş
  parçacığına bağlar.
- `/codex compact`, Codex uygulama sunucusundan bağlı iş parçacığını sıkıştırmasını
  ister.
- `/codex review`, bağlı iş parçacığı için Codex yerel incelemesini başlatır.
- `/codex diagnostics [note]`, bağlı iş parçacığı için Codex geri bildirimi
  göndermeden önce sorar.
- `/codex account`, hesap ve hız sınırı durumunu gösterir.
- `/codex mcp`, Codex uygulama sunucusu MCP sunucusu durumunu listeler.
- `/codex skills`, Codex uygulama sunucusu Skills'i listeler.

Çoğu destek raporu için hatanın gerçekleştiği konuşmada
`/diagnostics [note]` ile başlayın. Bu, bir Gateway tanılama raporu oluşturur ve
Codex harness oturumları için ilgili Codex geri bildirim paketini göndermek için
onay ister. Gizlilik modeli ve grup sohbeti davranışı için bkz.
[Tanılama dışa aktarımı](/tr/gateway/diagnostics).

`/codex diagnostics [note]` komutunu yalnızca tam Gateway tanılama paketi olmadan
geçerli olarak bağlı iş parçacığı için özel olarak Codex geri bildirim
yüklemesini istediğinizde kullanın.

### Codex iş parçacıklarını yerelde inceleyin

Kötü bir Codex çalışmasını incelemenin en hızlı yolu çoğu zaman yerel Codex iş
parçacığını doğrudan açmaktır:

```bash
codex resume <thread-id>
```

İş parçacığı kimliğini tamamlanmış `/diagnostics` yanıtından,
`/codex binding` komutundan veya `/codex threads [filter]` komutundan alın.

Yükleme mekanikleri ve çalışma zamanı düzeyindeki tanılama sınırları için bkz.
[Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime#codex-feedback-upload).

Kimlik doğrulama şu sırayla seçilir:

1. Ajan için sıralı OpenAI kimlik doğrulama profilleri, tercihen
   `auth.order.openai` altında. Eski Codex kimlik doğrulama profili kimliklerini
   ve eski Codex kimlik doğrulama sırasını taşımak için `openclaw doctor --fix`
   çalıştırın.
2. Bu ajanın Codex home'undaki uygulama sunucusunun mevcut hesabı.
3. Yalnızca yerel stdio uygulama sunucusu başlatmaları için, uygulama sunucusu
   hesabı yoksa ve OpenAI kimlik doğrulaması hâlâ gerekiyorsa önce
   `CODEX_API_KEY`, sonra `OPENAI_API_KEY`.

OpenClaw, ChatGPT aboneliği tarzı bir Codex kimlik doğrulama profili gördüğünde
başlatılan Codex alt sürecinden `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini
kaldırır. Bu, Gateway düzeyindeki API anahtarlarını embedding'ler veya doğrudan
OpenAI modelleri için kullanılabilir tutarken yerel Codex uygulama sunucusu
turlarının yanlışlıkla API üzerinden ücretlendirilmesini önler. Açık Codex API
anahtarı profilleri ve yerel stdio ortam anahtarı geri dönüşü, devralınan alt
süreç ortamı yerine uygulama sunucusu oturum açmasını kullanır. WebSocket
uygulama sunucusu bağlantıları Gateway ortam API anahtarı geri dönüşünü almaz;
açık bir kimlik doğrulama profili veya uzak uygulama sunucusunun kendi hesabını
kullanın.
Yerel Codex plugins yapılandırıldığında OpenClaw, Plugin'e ait uygulamaları Codex
iş parçacığına sunmadan önce bu plugins'i bağlı uygulama sunucusu üzerinden
kurar veya yeniler. `app/list`, uygulama kimlikleri, erişilebilirlik ve meta
veriler için doğruluk kaynağı olmaya devam eder, ancak iş parçacığı başına
etkinleştirme kararının sahibi OpenClaw'dır: ilke listelenmiş erişilebilir bir
uygulamaya izin veriyorsa, `app/list` şu anda bu uygulamayı devre dışı bildirse
bile OpenClaw `thread/start.config.apps[appId].enabled = true` gönderir. Bu yol
bilinmeyen kimlikler için uygulama kurulumu icat etmez; OpenClaw yalnızca
marketplace plugins'ini `plugin/install` ile etkinleştirir ve ardından envanteri
yeniler.

Bir abonelik profili Codex kullanım sınırına ulaşırsa OpenClaw, Codex bir sıfırlama
zamanı bildirdiğinde bunu kaydeder ve aynı Codex çalışması için bir sonraki
sıralı kimlik doğrulama profilini dener. Sıfırlama zamanı geçtiğinde abonelik
profili, seçilen `openai/gpt-*` modeli veya Codex çalışma zamanı değiştirilmeden
yeniden uygun hale gelir.

Yerel stdio uygulama sunucusu başlatmaları için OpenClaw, Codex yapılandırması,
kimlik doğrulama/hesap dosyaları, Plugin önbelleği/verileri ve yerel iş parçacığı
durumu varsayılan olarak operatörün kişisel `~/.codex` dizinini okumayacak veya
yazmayacak şekilde `CODEX_HOME` değerini ajan başına bir dizine ayarlar.
OpenClaw normal süreç `HOME` değerini korur; Codex tarafından çalıştırılan alt
süreçler kullanıcı home yapılandırmasını ve token'larını hâlâ bulabilir ve Codex
paylaşılan `$HOME/.agents/skills` ve `$HOME/.agents/plugins/marketplace.json`
girdilerini keşfedebilir.

Bir dağıtım ek ortam yalıtımı gerektiriyorsa bu değişkenleri
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
`HOME` değerlerini bu listeden kaldırır: `CODEX_HOME` ajan başına kalır ve `HOME`,
alt süreçlerin normal kullanıcı home durumunu kullanabilmesi için devralınmış
kalır.

Codex dinamik araçları varsayılan olarak `searchable` yükleme kullanır. OpenClaw,
Codex'e özgü çalışma alanı işlemlerini yineleyen dinamik araçları sunmaz: `read`,
`write`, `edit`, `apply_patch`, `exec`, `process` ve `update_plan`. Mesajlaşma,
medya, cron, tarayıcı, düğümler, gateway ve `heartbeat_respond` gibi kalan çoğu
OpenClaw entegrasyon aracı, başlangıç model bağlamını daha küçük tutarak
`openclaw` ad alanı altında Codex araç araması üzerinden kullanılabilir. Web araması,
arama etkinleştirildiğinde ve yönetilen sağlayıcı seçilmediğinde varsayılan olarak
Codex'in barındırılan `web_search` aracını kullanır. Yerel barındırılan arama ile
OpenClaw'ın yönetilen `web_search` dinamik aracı birbirini dışlar; böylece yönetilen
arama yerel alan kısıtlamalarını atlayamaz. Barındırılan arama kullanılamadığında,
açıkça devre dışı bırakıldığında veya seçili bir yönetilen sağlayıcıyla değiştirildiğinde
OpenClaw yönetilen aracı kullanır. OpenClaw, Codex'in bağımsız `web.run` uzantısını
devre dışı tutar çünkü üretim app-server trafiği kullanıcı tanımlı `web` ad alanını
reddeder. `tools.web.search.enabled: false`, araçların devre dışı olduğu yalnızca
LLM çalıştırmaları gibi, her iki yolu da devre dışı bırakır. Codex, `"cached"` değerini
bir tercih olarak ele alır ve kısıtlanmamış app-server turları için bunu canlı harici
erişime çözümler. Yerel `allowedDomains` ayarlandığında otomatik yönetilen geri dönüş
kapalı şekilde başarısız olur; böylece izin verilenler listesi atlanamaz. Kalıcı etkin
arama ilkesi değişiklikleri, bir sonraki turdan önce bağlı Codex iş parçacığını döndürür.
Geçici tur başına kısıtlamalar, geçici bir kısıtlı iş parçacığı kullanır ve daha sonra
sürdürme için mevcut bağlamayı korur. `sessions_yield` ve yalnızca mesaj aracı kaynaklı
yanıtlar doğrudan kalır çünkü bunlar tur denetimi sözleşmeleridir. `sessions_spawn`
aranabilir kalır; böylece Codex'in yerel `spawn_agent` yüzeyi birincil Codex alt ajan
yüzeyi olmaya devam ederken açık OpenClaw veya ACP delegasyonu `openclaw` dinamik araç
ad alanı üzerinden hâlâ kullanılabilir. Heartbeat işbirliği talimatları, araç zaten
yüklenmemişse bir Heartbeat turunu bitirmeden önce Codex'e `heartbeat_respond` aramasını
söyler.

`codexDynamicToolsLoading: "direct"` ayarını yalnızca ertelenmiş dinamik araçları
arayamayan özel bir Codex app-server'a bağlanırken veya tam araç yükünde hata ayıklarken
ayarlayın.

Desteklenen üst düzey Codex Plugin alanları:

| Alan                       | Varsayılan     | Anlam                                                                                    |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | OpenClaw dinamik araçlarını doğrudan başlangıç Codex araç bağlamına koymak için `"direct"` kullanın. |
| `codexDynamicToolsExclude` | `[]`           | Codex app-server turlarından çıkarılacak ek OpenClaw dinamik araç adları.                |
| `codexPlugins`             | devre dışı     | Taşınmış kaynak kurulumlu seçkin pluginler için yerel Codex plugin/app desteği.          |

Desteklenen `appServer` alanları:

| Alan                                          | Varsayılan                                            | Anlam                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` Codex'i başlatır; `"websocket"` `url` adresine bağlanır.                                                                                                                                                                                                                                                                                                                             |
| `command`                                     | yönetilen Codex ikilisi                                | stdio taşıması için çalıştırılabilir dosya. Yönetilen ikiliyi kullanmak için ayarlanmamış bırakın; yalnızca açık bir geçersiz kılma için ayarlayın.                                                                                                                                                                                                                                           |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio taşıması için argümanlar.                                                                                                                                                                                                                                                                                                                                                                |
| `url`                                         | ayarlanmamış                                           | WebSocket app-server URL'si.                                                                                                                                                                                                                                                                                                                                                                   |
| `authToken`                                   | ayarlanmamış                                           | WebSocket taşıması için Bearer token. Değişmez bir dizeyi veya `${CODEX_APP_SERVER_TOKEN}` gibi SecretInput'u kabul eder.                                                                                                                                                                                                                                                                      |
| `headers`                                     | `{}`                                                   | Ek WebSocket üstbilgileri. Üstbilgi değerleri, örneğin `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"` gibi değişmez dizeleri veya SecretInput değerlerini kabul eder.                                                                                                                                                                                                         |
| `clearEnv`                                    | `[]`                                                   | OpenClaw devralınan ortamını oluşturduktan sonra başlatılan stdio app-server işleminden kaldırılan ek ortam değişkeni adları. OpenClaw yerel başlatmalar için ajan başına `CODEX_HOME` ve devralınan `HOME` değerini korur.                                                                                                                                                                   |
| `codeModeOnly`                                | `false`                                                | Codex'in yalnızca kod modu araç yüzeyini kullanmayı seçer. OpenClaw dinamik araçları Codex'e kayıtlı kalır, böylece iç içe `tools.*` çağrıları app-server `item/tool/call` köprüsü üzerinden döner.                                                                                                                                                                                            |
| `remoteWorkspaceRoot`                         | ayarlanmamış                                           | Uzak Codex app-server çalışma alanı kökü. Ayarlandığında OpenClaw, yerel çalışma alanı kökünü çözümlenmiş OpenClaw çalışma alanından çıkarır, bu uzak kök altında geçerli cwd sonekini korur ve Codex'e yalnızca son app-server cwd değerini gönderir. cwd çözümlenmiş OpenClaw çalışma alanı kökünün dışındaysa OpenClaw, uzak app-server'a gateway-yerel bir yol göndermek yerine kapalı başarısız olur. |
| `requestTimeoutMs`                            | `60000`                                                | app-server denetim düzlemi çağrıları için zaman aşımı.                                                                                                                                                                                                                                                                                                                                         |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex bir turn kabul ettikten sonra veya turn kapsamlı bir app-server isteğinden sonra, OpenClaw `turn/completed` beklerken kullanılan sessiz pencere.                                                                                                                                                                                                                                           |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Bir araç devrinden, yerel araç tamamlanmasından, araç sonrası ham asistan ilerlemesinden, ham akıl yürütme tamamlanmasından veya akıl yürütme ilerlemesinden sonra OpenClaw `turn/completed` beklerken kullanılan tamamlama boşta kalma ve ilerleme koruması. Araç sonrası sentezin son asistan yayın bütçesinden meşru olarak daha uzun süre sessiz kalabileceği güvenilir veya ağır iş yükleri için bunu kullanın. |
| `mode`                                        | yerel Codex gereksinimleri YOLO'ya izin vermedikçe `"yolo"` | YOLO veya guardian tarafından incelenen yürütme için ön ayar. `danger-full-access`, `never` onayı veya `user` inceleyicisini atlayan yerel stdio gereksinimleri örtük varsayılanı guardian yapar.                                                                                                                                                                                               |
| `approvalPolicy`                              | `"never"` veya izin verilen bir guardian onay ilkesi   | Thread başlatma/sürdürme/turn için gönderilen yerel Codex onay ilkesi. Guardian varsayılanları, izin verildiğinde `"on-request"` değerini tercih eder.                                                                                                                                                                                                                                         |
| `sandbox`                                     | `"danger-full-access"` veya izin verilen bir guardian sandbox | Thread başlatma/sürdürme için gönderilen yerel Codex sandbox modu. Guardian varsayılanları izin verildiğinde `"workspace-write"` değerini, aksi halde `"read-only"` değerini tercih eder. Bir OpenClaw sandbox etkin olduğunda, `danger-full-access` turn'leri OpenClaw sandbox çıkış ayarından türetilen ağ erişimiyle Codex `workspace-write` kullanır.                                      |
| `approvalsReviewer`                           | `"user"` veya izin verilen bir guardian inceleyici     | İzin verildiğinde Codex'in yerel onay istemlerini incelemesine izin vermek için `"auto_review"` kullanın; aksi halde `guardian_subagent` veya `user` kullanın. `guardian_subagent` eski bir alias olarak kalır.                                                                                                                                                                                |
| `serviceTier`                                 | ayarlanmamış                                           | İsteğe bağlı Codex app-server hizmet katmanı. `"priority"` hızlı mod yönlendirmesini etkinleştirir, `"flex"` esnek işlemeyi ister, `null` geçersiz kılmayı temizler ve eski `"fast"` değeri `"priority"` olarak kabul edilir.                                                                                                                                                                  |
| `networkProxy`                                | devre dışı                                             | app-server komutları için Codex izin profili ağ kullanımını seçer. OpenClaw, seçili `permissions.<profile>.network` yapılandırmasını tanımlar ve `sandbox` göndermek yerine `default_permissions` ile bunu seçer.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Yerel Codex yürütmesinin etkin OpenClaw sandbox içinde çalışabilmesi için Codex app-server 0.132.0 veya daha yeni sürümüne OpenClaw sandbox destekli bir Codex ortamı kaydeden önizleme katılımı.                                                                                                                                                                                               |

`appServer.networkProxy` açıktır çünkü Codex sandbox sözleşmesini değiştirir.
Etkinleştirildiğinde OpenClaw, üretilen izin profilinin Codex tarafından yönetilen
ağ kullanımını başlatabilmesi için Codex thread yapılandırmasında
`features.network_proxy.enabled` ve `default_permissions` değerlerini de ayarlar.
Varsayılan olarak OpenClaw, profil gövdesinden çakışmaya dayanıklı bir
`openclaw-network-<fingerprint>` profil adı üretir; `profileName` değerini yalnızca
kararlı bir yerel ad gerektiğinde kullanın.

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
etkinleştirmek üretilen izin profili için workspace tarzı dosya sistemi erişimi
kullanır. Codex tarafından yönetilen ağ zorlaması sandbox'lı ağ kullanımıdır,
bu nedenle tam erişimli bir profil giden trafiği korumaz.
Alan girdileri `allow` veya `deny` kullanır; Unix soketi girdileri Codex'in
`allow` veya `none` değerlerini kullanır.

OpenClaw'ın sahip olduğu dinamik araç çağrıları, `appServer.requestTimeoutMs` değerinden bağımsız olarak sınırlandırılır: Codex `item/tool/call` istekleri varsayılan olarak 90 saniyelik bir OpenClaw watchdog kullanır. Pozitif bir çağrı başına `timeoutMs` argümanı, o belirli araç bütçesini uzatır veya kısaltır. `image_generate` aracı, araç çağrısı kendi zaman aşımını sağlamadığında `agents.defaults.imageGenerationModel.timeoutMs` değerini, aksi halde 120 saniyelik görüntü oluşturma varsayılanını kullanır. Medya anlama `image` aracı, `tools.media.image.timeoutSeconds` değerini veya 60 saniyelik medya varsayılanını kullanır. Görüntü anlama için bu zaman aşımı isteğin kendisine uygulanır ve önceki hazırlık çalışmasıyla azaltılmaz. Dinamik araç bütçeleri 600000 ms ile sınırlandırılır. Zaman aşımında OpenClaw, desteklendiği yerde araç sinyalini durdurur ve oturumu `processing` içinde bırakmak yerine turun devam edebilmesi için Codex'e başarısız bir dinamik araç yanıtı döndürür. Bu watchdog, dış dinamik `item/tool/call` bütçesidir; sağlayıcıya özgü istek zaman aşımları bu çağrının içinde çalışır ve kendi zaman aşımı semantiklerini korur.

Codex bir turu kabul ettikten ve OpenClaw tur kapsamlı bir app-server isteğine yanıt verdikten sonra, harness Codex'in geçerli turda ilerleme kaydetmesini ve sonunda yerel turu `turn/completed` ile bitirmesini bekler. App-server `appServer.turnCompletionIdleTimeoutMs` süresince sessiz kalırsa OpenClaw en iyi çabayla Codex turunu keser, tanısal bir zaman aşımı kaydeder ve OpenClaw oturum hattını serbest bırakır; böylece takip eden sohbet iletileri bayat bir yerel turun arkasında kuyruğa alınmaz. Aynı tur için çoğu terminal olmayan bildirim, Codex turun hâlâ canlı olduğunu kanıtladığı için bu kısa watchdog'u devre dışı bırakır. Araç devirleri daha uzun bir araç sonrası boşta kalma bütçesi kullanır: OpenClaw bir `item/tool/call` yanıtı döndürdükten sonra, `commandExecution` gibi yerel araç öğeleri tamamlandıktan sonra, ham `custom_tool_call_output` tamamlanmalarından sonra ve araç sonrası ham asistan ilerlemesi, ham akıl yürütme tamamlanmaları veya akıl yürütme ilerlemesinden sonra. Koruma, yapılandırıldığında `appServer.postToolRawAssistantCompletionIdleTimeoutMs` değerini kullanır ve aksi halde varsayılan olarak beş dakikaya ayarlanır. Aynı araç sonrası bütçe, Codex bir sonraki geçerli tur olayını yaymadan önceki sessiz sentez penceresi için ilerleme watchdog'unu da uzatır. Hız sınırı güncellemeleri gibi genel app-server bildirimleri tur boşta ilerlemesini sıfırlamaz. Akıl yürütme tamamlanmaları, yorum `agentMessage` tamamlanmaları ve araç öncesi ham akıl yürütme veya asistan ilerlemesi otomatik bir son yanıtla izlenebilir; bu nedenle oturum hattını hemen serbest bırakmak yerine araç sonrası yanıt korumasını kullanırlar. Yalnızca son/yorum dışı tamamlanmış `agentMessage` öğeleri ve araç öncesi ham asistan tamamlanmaları asistan çıktısı serbest bırakmasını kurar: Codex daha sonra `turn/completed` olmadan sessiz kalırsa OpenClaw en iyi çabayla yerel turu keser ve oturum hattını serbest bırakır. Asistan, araç, etkin öğe veya yan etki kanıtı olmayan tur tamamlama boşta zaman aşımları dahil olmak üzere yeniden oynatma açısından güvenli stdio app-server hataları, yeni bir app-server denemesinde bir kez yeniden denenir. Güvenli olmayan zaman aşımları yine de takılmış app-server istemcisini kullanımdan kaldırır ve OpenClaw oturum hattını serbest bırakır. Ayrıca otomatik olarak yeniden oynatılmak yerine bayat yerel thread bağlamasını temizler. Tamamlama izleme zaman aşımları Codex'e özgü zaman aşımı metni gösterir: yeniden oynatma açısından güvenli durumlar yanıtın eksik olabileceğini söylerken, güvenli olmayan durumlar kullanıcıya yeniden denemeden önce geçerli durumu doğrulamasını söyler. Herkese açık zaman aşımı tanıları; son app-server bildirim yöntemi, ham asistan yanıt öğesi id/tür/rolü, etkin istek/öğe sayıları ve kurulu izleme durumu gibi yapısal alanları içerir. Son bildirim ham bir asistan yanıt öğesiyse, sınırlı bir asistan metin önizlemesi de içerir. Ham istem veya araç içeriğini içermezler.

Yerel test için ortam geçersiz kılmaları kullanılabilir kalır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`, `appServer.command` ayarlanmadığında yönetilen ikili dosyayı atlar.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırıldı. Bunun yerine `plugins.entries.codex.config.appServer.mode: "guardian"` kullanın veya tek seferlik yerel test için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın. Tekrarlanabilir dağıtımlar için yapılandırma tercih edilir; çünkü Plugin davranışını Codex harness kurulumunun geri kalanıyla aynı incelenmiş dosyada tutar.

## Yerel Codex Pluginleri

Yerel Codex Plugin desteği, OpenClaw harness turuyla aynı Codex thread'i içinde Codex app-server'ın kendi uygulama ve Plugin yeteneklerini kullanır. OpenClaw, Codex Pluginlerini sentetik `codex_plugin_*` OpenClaw dinamik araçlarına çevirmez.

`codexPlugins` yalnızca yerel Codex harness'ını seçen oturumları etkiler. Yerleşik harness çalıştırmalarında, normal OpenAI sağlayıcı çalıştırmalarında, ACP konuşma bağlamalarında veya diğer harness'larda etkisi yoktur.

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

Thread uygulama yapılandırması, OpenClaw bir Codex harness oturumu kurduğunda veya bayat bir Codex thread bağlamasını değiştirdiğinde hesaplanır. Her turda yeniden hesaplanmaz. `codexPlugins` değiştirildikten sonra, gelecekteki Codex harness oturumlarının güncellenmiş uygulama kümesiyle başlaması için `/new`, `/reset` kullanın veya Gateway'i yeniden başlatın.

Taşıma uygunluğu, uygulama envanteri, yıkıcı eylem politikası, bilgi istemeleri ve yerel Plugin tanıları için [Yerel Codex Pluginleri](/tr/plugins/codex-native-plugins) bölümüne bakın.

OpenAI tarafındaki uygulama ve Plugin erişimi, oturum açmış Codex hesabı ve Business ile Enterprise/Edu çalışma alanları için çalışma alanı uygulama denetimleri tarafından kontrol edilir. OpenAI'nin hesap ve çalışma alanı denetimi genel bakışı için [ChatGPT planınızla Codex'i kullanma](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) bölümüne bakın.

## Bilgisayar Kullanımı

Bilgisayar Kullanımı kendi kurulum kılavuzunda ele alınır:
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use).

Kısa sürüm: OpenClaw masaüstü denetim uygulamasını vendörlemez veya masaüstü eylemlerini kendisi yürütmez. Codex app-server'ı hazırlar, `computer-use` MCP sunucusunun kullanılabilir olduğunu doğrular ve ardından Codex modu turları sırasında yerel MCP araç çağrılarının sahipliğini Codex'e bırakır.

## Çalışma zamanı sınırları

Codex harness yalnızca düşük seviyeli gömülü ajan yürütücüsünü değiştirir.

- OpenClaw dinamik araçları desteklenir. Codex bu araçları yürütmesini OpenClaw'dan ister, bu nedenle OpenClaw yürütme yolunda kalır.
- Codex'e yerel shell, patch, MCP ve yerel uygulama araçları Codex'e aittir. OpenClaw desteklenen relay üzerinden seçili yerel olayları gözlemleyebilir veya engelleyebilir, ancak yerel araç argümanlarını yeniden yazmaz.
- Yerel Compaction Codex'e aittir. OpenClaw kanal geçmişi, arama, `/new`, `/reset` ve gelecekteki model veya harness geçişleri için bir transcript aynası tutar; ancak Codex Compaction'ı OpenClaw veya context-engine özetleyicisiyle değiştirmez.
- Medya oluşturma, medya anlama, TTS, onaylar ve mesajlaşma aracı çıktısı eşleşen OpenClaw sağlayıcı/model ayarları üzerinden devam eder.
- `tool_result_persist`, Codex yerel araç sonucu kayıtlarına değil, OpenClaw'ın sahip olduğu transcript araç sonuçlarına uygulanır.

Hook katmanları, desteklenen V1 yüzeyleri, yerel izin işleme, kuyruk yönlendirme, Codex geri bildirim yükleme mekanikleri ve Compaction ayrıntıları için [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime) bölümüne bakın.

## Sorun giderme

**Codex normal bir `/model` sağlayıcısı olarak görünmüyor:** yeni yapılandırmalar için bu beklenen durumdur. Bir `openai/gpt-*` modeli seçin, `plugins.entries.codex.enabled` değerini etkinleştirin ve `plugins.allow` değerinin `codex` öğesini dışlayıp dışlamadığını kontrol edin.

**OpenClaw, Codex yerine yerleşik harness'ı kullanıyor:** model ref değerinin resmi OpenAI sağlayıcısında `openai/gpt-*` olduğundan ve Codex Plugininin kurulu ve etkin olduğundan emin olun. Test sırasında kesin kanıta ihtiyacınız varsa sağlayıcı veya model `agentRuntime.id: "codex"` değerini ayarlayın. Zorlanan Codex çalışma zamanı, OpenClaw'a geri düşmek yerine başarısız olur.

**OpenAI Codex çalışma zamanı API anahtarı yoluna geri düşüyor:** modeli, çalışma zamanını, seçili sağlayıcıyı ve hatayı gösteren redakte edilmiş bir Gateway alıntısı toplayın. Etkilenen iş arkadaşlarından OpenClaw host'larında bu salt okunur komutu çalıştırmalarını isteyin:

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

Yararlı alıntılar genellikle `openai/gpt-5.5` veya `openai/gpt-5.4`, `Runtime: OpenAI Codex`, `agentRuntime.id` veya `harnessRuntime`, `candidateProvider: "openai"` ve `401`, `Incorrect API key` veya `No API key` sonucunu içerir. Düzeltilmiş bir çalıştırma, düz bir OpenAI API anahtarı hatası yerine OpenAI OAuth yolunu göstermelidir.

**Eski Codex model ref yapılandırması kalmış:** `openclaw doctor --fix` çalıştırın. Doctor eski model ref değerlerini `openai/*` olarak yeniden yazar, bayat oturum ve tüm ajan çalışma zamanı sabitlemelerini kaldırır ve mevcut auth-profile geçersiz kılmalarını korur.

**App-server reddediliyor:** Codex app-server `0.125.0` veya daha yenisini kullanın. Aynı sürüm ön yayımları veya `0.125.0-alpha.2` ya da `0.125.0+custom` gibi build sonekli sürümler reddedilir; çünkü OpenClaw kararlı `0.125.0` protokol tabanını test eder.

**`/codex status` bağlanamıyor:** paketlenen `codex` Plugininin etkin olduğunu, bir izin listesi yapılandırıldığında `plugins.allow` değerinin onu içerdiğini ve özel `appServer.command`, `url`, `authToken` veya başlıkların geçerli olduğunu kontrol edin.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs` değerini düşürün veya keşfi devre dışı bırakın. [Codex harness başvurusu](/tr/plugins/codex-harness-reference#model-discovery) bölümüne bakın.

**WebSocket taşıması hemen başarısız oluyor:** `appServer.url`, `authToken`, başlıkları ve uzak app-server'ın aynı Codex app-server protokol sürümünü konuştuğunu kontrol edin.

**Yerel shell veya patch araçları `Native hook relay unavailable` ile engelleniyor:** Codex thread'i hâlâ OpenClaw'ın artık kayıtlı tutmadığı yerel hook relay id değerini kullanmaya çalışıyor. Bu, ACP arka ucu, sağlayıcı, GitHub veya shell komutu hatası değil; yerel bir Codex hook taşıma sorunudur. Etkilenen sohbette `/new` veya `/reset` ile yeni bir oturum başlatın, ardından zararsız bir komutu yeniden deneyin. Bu bir kez çalışır ama sonraki yerel araç çağrısı tekrar başarısız olursa, `/new` öğesini yalnızca geçici bir geçici çözüm olarak değerlendirin: eski thread'lerin atılması ve yerel hook kayıtlarının yeniden oluşturulması için Codex app-server'ı veya OpenClaw Gateway'i yeniden başlattıktan sonra istemi yeni bir oturuma kopyalayın.

**Codex olmayan bir model yerleşik harness'ı kullanıyor:** sağlayıcı veya model çalışma zamanı politikası onu başka bir harness'a yönlendirmediği sürece bu beklenen durumdur. Düz OpenAI dışı sağlayıcı ref değerleri `auto` modunda normal sağlayıcı yollarında kalır.

**Computer Use yüklü ama araçlar çalışmıyor:** yeni bir oturumdan
`/codex computer-use status` komutunu kontrol edin. Bir araç
`Native hook relay unavailable` bildirirse yukarıdaki yerel kanca rölesi kurtarmasını kullanın. Bkz.
[Codex Computer Use](/tr/plugins/codex-computer-use#troubleshooting).

## İlgili

- [Codex çalıştırma çerçevesi başvurusu](/tr/plugins/codex-harness-reference)
- [Codex çalıştırma çerçevesi çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [Yerel Codex Plugin'leri](/tr/plugins/codex-native-plugins)
- [Codex Computer Use](/tr/plugins/codex-computer-use)
- [Ajan çalışma zamanları](/tr/concepts/agent-runtimes)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [OpenAI Codex yardımı](https://help.openai.com/en/collections/14937394-codex)
- [Ajan çalıştırma çerçevesi Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Plugin kancaları](/tr/plugins/hooks)
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics)
- [Durum](/tr/cli/status)
- [Test etme](/tr/help/testing-live#live-codex-app-server-harness-smoke)
