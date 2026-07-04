---
read_when:
    - Paketle birlikte gelen Codex app-server harness'ını kullanmak istiyorsunuz
    - Codex koşumu yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex dağıtımlarının OpenClaw’a geri dönmek yerine başarısız olmasını istiyorsunuz
summary: OpenClaw gömülü ajan turlarını paketlenmiş Codex app-server harness üzerinden çalıştırın
title: Codex koşumu
x-i18n:
    generated_at: "2026-07-04T10:59:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1cf51f87f1ccaab2611926ea6bdba73f53de9a88b44da2395eb5f4c147da188
    source_path: plugins/codex-harness.md
    workflow: 16
---

Paketle gelen `codex` Plugin, OpenClaw'ın yerleşik OpenClaw yürütme katmanı yerine Codex uygulama sunucusu üzerinden gömülü OpenAI ajan dönüşleri çalıştırmasını sağlar.

Düşük düzey ajan oturumunu Codex'in yönetmesini istediğinizde Codex yürütme katmanını kullanın: yerel konu sürdürme, yerel araç devamı, yerel compaction ve uygulama sunucusu yürütmesi. OpenClaw yine de sohbet kanallarını, oturum dosyalarını, model seçimini, OpenClaw dinamik araçlarını, onayları, medya teslimini ve görünür transkript aynasını yönetir.

Normal kurulum `openai/gpt-5.5` gibi kurallı OpenAI model başvuruları kullanır. Eski Codex GPT başvurularını yapılandırmayın. OpenAI ajan kimlik doğrulama sırasını `auth.order.openai` altına koyun; daha eski Codex kimlik doğrulama profil kimlikleri ve eski Codex kimlik doğrulama sırası girdileri, `openclaw doctor --fix` tarafından onarılan eski durumdur.

Etkin bir OpenClaw sanal alanı yokken OpenClaw, Codex yerel kod modunu etkinleştirerek Codex uygulama sunucusu konularını başlatır ve code-mode-only seçeneğini varsayılan olarak kapalı bırakır. Bu, Codex yerel çalışma alanı ve kod yeteneklerini kullanılabilir tutarken OpenClaw dinamik araçlarının uygulama sunucusu `item/tool/call` köprüsü üzerinden devam etmesini sağlar. Etkin OpenClaw sanal alan kullanımı ve kısıtlı araç ilkeleri, deneysel sanal alan exec-server yolunu seçmediğiniz sürece yerel kod modunu tamamen devre dışı bırakır.

Bu Codex'e özgü yerel özellik, farklı bir `exec` girdi şekline sahip genel OpenClaw çalıştırmaları için isteğe bağlı bir QuickJS-WASI çalışma zamanı olan [OpenClaw kod modu](/tr/reference/code-mode) özelliğinden ayrıdır.

Daha geniş model/sağlayıcı/çalışma zamanı ayrımı için [Ajan çalışma zamanları](/tr/concepts/agent-runtimes) ile başlayın. Kısa sürüm şudur: `openai/gpt-5.5` model başvurusudur, `codex` çalışma zamanıdır ve Telegram, Discord, Slack veya başka bir kanal iletişim yüzeyi olarak kalır.

## Gereksinimler

- Paketle gelen `codex` Plugin kullanılabilir olan OpenClaw.
- Yapılandırmanız `plugins.allow` kullanıyorsa `codex` ekleyin.
- Codex uygulama sunucusu `0.125.0` veya daha yeni. Paketle gelen Plugin varsayılan olarak uyumlu bir Codex uygulama sunucusu ikilisini yönetir; bu nedenle `PATH` üzerindeki yerel `codex` komutları normal yürütme katmanı başlangıcını etkilemez.
- `openclaw models auth login --provider openai` üzerinden, ajanın Codex ana dizinindeki bir uygulama sunucusu hesabı üzerinden veya açık bir Codex API anahtarı kimlik doğrulama profili üzerinden kullanılabilir Codex kimlik doğrulaması.

Kimlik doğrulama önceliği, ortam yalıtımı, özel uygulama sunucusu komutları, model keşfi ve tüm yapılandırma alanları için [Codex yürütme katmanı başvurusu](/tr/plugins/codex-harness-reference) bölümüne bakın.

## Hızlı başlangıç

OpenClaw içinde Codex isteyen çoğu kullanıcı şu yolu ister: bir ChatGPT/Codex aboneliğiyle oturum açın, paketle gelen `codex` Plugin'i etkinleştirin ve kurallı bir `openai/gpt-*` model başvurusu kullanın.

Codex OAuth ile oturum açın:

```bash
openclaw models auth login --provider openai
```

Paketle gelen `codex` Plugin'i etkinleştirin ve bir OpenAI ajan modeli seçin:

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

Plugin yapılandırmasını değiştirdikten sonra Gateway'i yeniden başlatın. Mevcut bir sohbetin zaten oturumu varsa, çalışma zamanı değişikliklerini test etmeden önce `/new` veya `/reset` kullanın; böylece sonraki dönüş, yürütme katmanını güncel yapılandırmadan çözümler.

## Konuları Codex Desktop ve CLI ile paylaşın

Varsayılan `appServer.homeScope: "agent"`, her OpenClaw ajanını operatörün yerel Codex durumundan yalıtılmış tutar. Bir sahibin OpenClaw'dan Codex Desktop ve Codex CLI tarafından gösterilen aynı yerel konuları incelemesini ve yönetmesini istemesini sağlamak için kullanıcı Codex ana dizinini seçin:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

Kullanıcı ana dizini modu yalnızca yerel stdio taşımasıyla kullanılabilir. Ayarlandığında `$CODEX_HOME`, aksi halde `~/.codex` kullanır; buna o ana dizinin yerel Codex kimlik doğrulaması, yapılandırması, Plugin'leri ve konu deposu dahildir. OpenClaw bu uygulama sunucusuna bir OpenClaw kimlik doğrulama profili enjekte etmez.

Sahip turları `codex_threads` aracını kazanır. Yerel iş parçacıklarını listeleyebilir, arayabilir, okuyabilir, çatallayabilir,
yeniden adlandırabilir, arşivleyebilir ve geri yükleyebilir. OpenClaw içinde devam etmek
istediğinizde ajandan bir iş parçacığını çatallamasını isteyin; çatal mevcut
OpenClaw oturumuna eklenir ve diğer yerel Codex istemcileri tarafından görünür kalır. Arşivleme,
iş parçacığının başka bir yerde kapatıldığına dair açık onay gerektirir.

Aynı iş parçacığını OpenClaw ve başka bir Codex istemcisinden eşzamanlı olarak sürdürmeyin veya yazmayın.
Codex canlı yazıcıları bağımsız Desktop, CLI ve OpenClaw süreçleri arasında değil,
tek bir uygulama sunucusu süreci içinde koordine eder. Çatallama ayrı bir
devam oluşturur ve güvenli birlikte var olma yoludur.

## Yapılandırma

Hızlı başlangıç yapılandırması, en düşük geçerli Codex harness yapılandırmasıdır. Codex
harness seçeneklerini OpenClaw yapılandırmasında ayarlayın ve CLI'yi yalnızca Codex kimlik doğrulaması için kullanın:

| Gereksinim                            | Ayarla                                                                           | Nerede                             |
| ------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Harness'ı etkinleştir                 | `plugins.entries.codex.enabled: true`                                            | OpenClaw yapılandırması            |
| İzin listesine alınmış Plugin kurulumunu koru | `plugins.allow` içine `codex` ekleyin                                            | OpenClaw yapılandırması            |
| OpenAI ajan turlarını Codex üzerinden yönlendir | `agents.defaults.model` veya `agents.list[].model` değerini `openai/gpt-*` olarak ayarlayın | OpenClaw ajan yapılandırması       |
| ChatGPT/Codex OAuth ile oturum aç     | `openclaw models auth login --provider openai`                                   | CLI kimlik doğrulama profili       |
| Codex çalıştırmaları için API anahtarı yedeği ekle | `auth.order.openai` içinde abonelik kimlik doğrulamasından sonra listelenen `openai:*` API anahtarı profili | CLI kimlik doğrulama profili + OpenClaw yapılandırması |
| Codex kullanılamadığında kapalı başarısız ol | Sağlayıcı veya model `agentRuntime.id: "codex"`                                  | OpenClaw model/sağlayıcı yapılandırması |
| Doğrudan OpenAI API trafiği kullan    | Normal OpenAI kimlik doğrulamasıyla sağlayıcı veya model `agentRuntime.id: "openclaw"` | OpenClaw model/sağlayıcı yapılandırması |
| Uygulama sunucusu davranışını ayarla  | `plugins.entries.codex.config.appServer.*`                                       | Codex Plugin yapılandırması        |
| Yerel Codex Plugin uygulamalarını etkinleştir | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex Plugin yapılandırması        |
| Codex Computer Use'u etkinleştir      | `plugins.entries.codex.config.computerUse.*`                                     | Codex Plugin yapılandırması        |

Codex destekli OpenAI ajan turları için `openai/gpt-*` model başvurularını kullanın. Abonelik öncelikli/API anahtarı yedekli sıralama için
`auth.order.openai` tercih edin. Mevcut
eski Codex kimlik doğrulama profili kimlikleri ve eski Codex kimlik doğrulama sırası yalnızca doctor'a ait
eski durumdur; yeni eski Codex GPT başvuruları yazmayın.

Codex destekli ajanlarda `compaction.model` veya `compaction.provider` ayarlamayın.
Codex kendi yerel uygulama sunucusu iş parçacığı durumu üzerinden sıkıştırma yapar, bu nedenle OpenClaw
çalışma zamanında bu yerel özetleyici geçersiz kılmalarını yok sayar ve ajan Codex kullandığında
`openclaw doctor --fix` bunları kaldırır.

Lossless, Codex turları etrafında derleme, alma ve
bakım için bir bağlam motoru olarak desteklenmeye devam eder. Bunu
`agents.defaults.compaction.provider` üzerinden değil,
`plugins.slots.contextEngine: "lossless-claw"` ve
`plugins.entries.lossless-claw.config.summaryModel` üzerinden yapılandırın. `openclaw doctor --fix`, Codex etkin çalışma zamanı olduğunda eski
`compaction.provider: "lossless-claw"` biçimini Lossless bağlam motoru yuvasına
taşır, ancak yerel Codex yine de Compaction'ın sahibidir.

Yerel Codex uygulama sunucusu harness'ı, ön istem derlemesi gerektiren
bağlam motorlarını destekler. `codex-cli` dahil genel CLI arka uçları bu
ana makine yeteneğini sağlamaz.

Codex destekli ajanlar için `/compact`, bağlı iş parçacığında yerel Codex uygulama sunucusu Compaction'ını başlatır.
OpenClaw tamamlanmayı beklemez, bir OpenClaw
zaman aşımı uygulamaz, paylaşılan uygulama sunucusunu yeniden başlatmaz veya bir bağlam motoruna ya da
genel OpenAI özetleyicisine geri dönmez. Yerel Codex iş parçacığı bağı eksik veya
bayatsa, komut kapalı başarısız olur; böylece operatör, Compaction arka uçlarının sessizce değiştirilmesi yerine gerçek çalışma zamanı sınırını görür.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Bu biçimde, her iki profil de `openai/gpt-*` ajan
turları için hâlâ Codex üzerinden çalışır. API anahtarı yalnızca bir kimlik doğrulama yedeğidir; OpenClaw'a veya
düz OpenAI Responses'a geçme isteği değildir.

Bu sayfanın geri kalanı kullanıcıların seçim yapması gereken yaygın varyantları kapsar:
dağıtım biçimi, kapalı başarısız yönlendirme, koruyucu onay politikası, yerel Codex
Plugin'leri ve Computer Use. Tam seçenek listeleri, varsayılanlar, enum'lar, keşif,
ortam yalıtımı, zaman aşımları ve uygulama sunucusu aktarım alanları için bkz.
[Codex harness başvurusu](/tr/plugins/codex-harness-reference).

## Codex çalışma zamanını doğrula

Codex beklediğiniz sohbette `/status` kullanın. Codex destekli bir OpenAI ajan
turu şunu gösterir:

```text
Runtime: OpenAI Codex
```

Ardından Codex uygulama sunucusu durumunu kontrol edin:

```text
/codex status
/codex models
```

`/codex status` uygulama sunucusu bağlantısını, hesabı, hız sınırlarını, MCP
sunucularını ve Skills'i raporlar. `/codex models`, harness ve hesap için canlı Codex uygulama sunucusu kataloğunu
listeler. `/status` beklenmedik görünüyorsa bkz.
[Sorun giderme](#troubleshooting).

## Yönlendirme ve model seçimi

Sağlayıcı başvurularını ve çalışma zamanı politikasını ayrı tutun:

- Codex üzerinden OpenAI ajan turları için `openai/gpt-*` kullanın.
- Yapılandırmada eski Codex GPT başvuruları kullanmayın. Eski başvuruları ve bayat oturum rota sabitlemelerini
  onarmak için `openclaw doctor --fix` çalıştırın.
- `agentRuntime.id: "codex"` normal OpenAI otomatik modu için isteğe bağlıdır, ancak
  Codex kullanılamadığında bir dağıtımın kapalı başarısız olması gerektiğinde kullanışlıdır.
- `agentRuntime.id: "openclaw"`, kasıtlı olduğunda bir sağlayıcıyı veya modeli OpenClaw
  gömülü çalışma zamanına geçirir.
- `/codex ...` sohbetten yerel Codex uygulama sunucusu konuşmalarını denetler.
- ACP/acpx ayrı bir harici harness yoludur. Yalnızca kullanıcı ACP/acpx veya harici bir harness bağdaştırıcısı istediğinde kullanın.

Yaygın komut yönlendirmesi:

| Kullanıcı amacı                                      | Kullanım                                                                                              |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Geçerli sohbeti bağla                               | `/codex bind [--cwd <path>]`                                                                          |
| Var olan bir Codex iş parçacığını sürdür             | `/codex resume <thread-id>`                                                                           |
| Codex iş parçacıklarını listele veya filtrele        | `/codex threads [filter]`                                                                             |
| Yerel Codex Pluginlerini listele                     | `/codex plugins list`                                                                                 |
| Yapılandırılmış bir yerel Codex Pluginini etkinleştir veya devre dışı bırak | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Eşleştirilmiş bir düğümde var olan bir Codex CLI oturumunu bağla | `/codex sessions --host <node> [filter]`, ardından `/codex resume <session-id> --host <node> --bind here` |
| Yalnızca Codex geri bildirimi gönder                | `/codex diagnostics [note]`                                                                           |
| Bir ACP/acpx görevi başlat                          | ACP/acpx oturum komutları, `/codex` değil                                                             |

| Kullanım durumu                                     | Yapılandırma                                                          | Doğrulama                              | Notlar                                |
| --------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------- | ------------------------------------- |
| Yerel Codex çalışma zamanı ile ChatGPT/Codex aboneliği | `openai/gpt-*` ve etkinleştirilmiş `codex` plugini                    | `/status`, `Runtime: OpenAI Codex` gösterir | Önerilen yol                          |
| Codex kullanılamıyorsa hata durumunda kapalı kal    | Sağlayıcı veya model `agentRuntime.id: "codex"`                       | Yerleşik yedeğe düşmek yerine tur başarısız olur | Yalnızca Codex dağıtımları için kullanın |
| Doğrudan OpenAI API anahtarı trafiğini OpenClaw üzerinden geçir | Sağlayıcı veya model `agentRuntime.id: "openclaw"` ve normal OpenAI kimlik doğrulaması | `/status`, OpenClaw çalışma zamanını gösterir | Yalnızca OpenClaw özellikle isteniyorsa kullanın |
| Eski yapılandırma                                   | eski Codex GPT başvuruları                                            | `openclaw doctor --fix` bunu yeniden yazar | Yeni yapılandırmayı bu şekilde yazmayın |
| ACP/acpx Codex bağdaştırıcısı                       | ACP `sessions_spawn({ runtime: "acp" })`                              | ACP görev/oturum durumu                | Yerel Codex koşumundan ayrıdır        |

`agents.defaults.imageModel` aynı önek ayrımını izler. Normal OpenAI rotası için
`openai/gpt-*` kullanın; görüntü anlama yalnızca sınırlandırılmış bir Codex
uygulama sunucusu turundan geçmeliyse `codex/gpt-*` kullanın. Eski Codex GPT
başvurularını kullanmayın; doctor bu eski öneki `openai/gpt-*` olarak yeniden
yazar.

## Dağıtım desenleri

### Temel Codex dağıtımı

Tüm OpenAI ajan turlarının varsayılan olarak Codex kullanması gerektiğinde hızlı
başlangıç yapılandırmasını kullanın.

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

Bu yapılandırmayla `main` ajanı normal sağlayıcı yolunu kullanır ve `codex`
ajanı Codex uygulama sunucusunu kullanır.

### Hata durumunda kapalı Codex dağıtımı

OpenAI ajan turları için, paketlenmiş plugin kullanılabiliyorsa `openai/gpt-*`
zaten Codex'e çözümlenir. Yazılı bir hata durumunda kapalı kalma kuralı
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

Codex zorunlu kılındığında, Codex plugini devre dışıysa, uygulama sunucusu çok
eskiyse veya uygulama sunucusu başlatılamıyorsa OpenClaw erken başarısız olur.

## Uygulama sunucusu ilkesi

Varsayılan olarak plugin, OpenClaw'ın yönettiği Codex ikilisini stdio taşımasıyla
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

Yerel stdio uygulama sunucusu oturumları varsayılan olarak güvenilir yerel
operatör duruşunu kullanır: `approvalPolicy: "never"`,
`approvalsReviewer: "user"` ve `sandbox: "danger-full-access"`. Yerel Codex
gereksinimleri bu örtük tam erişim duruşuna izin vermiyorsa, OpenClaw bunun
yerine izin verilen koruyucu izinlerini seçer. Oturum için bir OpenClaw sandbox
etkinken, OpenClaw o turda Codex ana makine tarafı sandbox kullanımına güvenmek
yerine Codex yerel Code Mode'u, kullanıcı MCP sunucularını ve uygulama destekli
plugin yürütmeyi devre dışı bırakır. Kabuk erişimi, normal exec/process araçları
kullanılabilir olduğunda `sandbox_exec` ve `sandbox_process` gibi OpenClaw
sandbox destekli dinamik araçlar üzerinden sunulur.

Sandbox kaçışlarından veya ek izinlerden önce Codex yerel otomatik incelemesini
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
bu değerlere izin verdiğinde genellikle `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` ve `sandbox: "workspace-write"` olur.
`tools.exec.mode: "auto"` içinde OpenClaw eski güvensiz Codex
`approvalPolicy: "never"` veya `sandbox: "danger-full-access"` geçersiz
kılmalarını korumaz; bilinçli olarak onaysız bir Codex duruşu için
`tools.exec.mode: "full"` kullanın. Eski
`plugins.entries.codex.config.appServer.mode: "guardian"` ön ayarı hâlâ çalışır,
ancak `tools.exec.mode: "auto"` normalleştirilmiş OpenClaw yüzeyidir.

Ana makine exec onayları ve ACPX izinleriyle mod düzeyi karşılaştırma için
bkz. [İzin modları](/tr/tools/permission-modes).

Her uygulama sunucusu alanı, kimlik doğrulama sırası, ortam yalıtımı, keşif ve
zaman aşımı davranışı için bkz. [Codex koşumu başvurusu](/tr/plugins/codex-harness-reference).

## Komutlar ve tanılama

Paketlenmiş plugin, OpenClaw metin komutlarını destekleyen herhangi bir kanalda
`/codex` komutunu slash komutu olarak kaydeder.

Yerel yürütme ve denetim için bir sahip veya `operator.admin` Gateway istemcisi
gerekir. Buna iş parçacıklarını bağlama veya sürdürme, turları gönderme veya
durdurma, model, hızlı mod ya da izin durumunu değiştirme, sıkıştırma veya
inceleme ve bir bağı ayırma dahildir. Diğer yetkili gönderenler salt okunur
durum, yardım, hesap, model, iş parçacığı, MCP sunucusu, beceri ve bağ inceleme
komutlarını kullanmaya devam eder.

Yaygın biçimler:

- `/codex status`, uygulama sunucusu bağlantısını, modelleri, hesabı, hız
  sınırlarını, MCP sunucularını ve becerileri denetler.
- `/codex models`, canlı Codex uygulama sunucusu modellerini listeler.
- `/codex threads [filter]`, son Codex uygulama sunucusu iş parçacıklarını listeler.
- `/codex resume <thread-id>`, geçerli OpenClaw oturumunu var olan bir Codex iş
  parçacığına bağlar.
- `/codex compact`, Codex uygulama sunucusundan bağlı iş parçacığını sıkıştırmasını ister.
- `/codex review`, bağlı iş parçacığı için Codex yerel incelemesini başlatır.
- `/codex diagnostics [note]`, bağlı iş parçacığı için Codex geri bildirimi
  göndermeden önce sorar.
- `/codex account`, hesap ve hız sınırı durumunu gösterir.
- `/codex mcp`, Codex uygulama sunucusu MCP sunucusu durumunu listeler.
- `/codex skills`, Codex uygulama sunucusu becerilerini listeler.

Çoğu destek raporu için, hatanın gerçekleştiği konuşmada `/diagnostics [note]`
ile başlayın. Bu, bir Gateway tanılama raporu oluşturur ve Codex koşumu
oturumları için ilgili Codex geri bildirim paketini göndermek üzere onay ister.
Gizlilik modeli ve grup sohbeti davranışı için bkz.
[Tanılama dışa aktarımı](/tr/gateway/diagnostics).

`/codex diagnostics [note]` komutunu yalnızca tam Gateway tanılama paketi
olmadan, özellikle o anda bağlı iş parçacığı için Codex geri bildirimi
yüklemesini istediğinizde kullanın.

### Codex iş parçacıklarını yerel olarak inceleme

Kötü bir Codex çalıştırmasını incelemenin en hızlı yolu çoğu zaman yerel Codex
iş parçacığını doğrudan açmaktır:

```bash
codex resume <thread-id>
```

İş parçacığı kimliğini tamamlanan `/diagnostics` yanıtından, `/codex binding`
çıktısından veya `/codex threads [filter]` komutundan alın.

Yükleme mekanikleri ve çalışma zamanı düzeyindeki tanılama sınırları için bkz.
[Codex koşumu çalışma zamanı](/tr/plugins/codex-harness-runtime#codex-feedback-upload).

Varsayılan ajan başına ana dizinde kimlik doğrulama şu sırayla seçilir:

1. Ajan için sıralı OpenAI kimlik doğrulama profilleri, tercihen
   `auth.order.openai` altında. Eski Codex kimlik doğrulama profili
   kimliklerini ve eski Codex kimlik doğrulama sırasını taşımak için
   `openclaw doctor --fix` çalıştırın.
2. Bu ajanın Codex ana dizinindeki uygulama sunucusunun mevcut hesabı.
3. Yalnızca yerel stdio uygulama sunucusu başlatmaları için, uygulama sunucusu
   hesabı yoksa ve OpenAI kimlik doğrulaması hâlâ gerekiyorsa önce
   `CODEX_API_KEY`, sonra `OPENAI_API_KEY`.

OpenClaw ChatGPT aboneliği tarzı bir Codex kimlik doğrulama profili gördüğünde,
oluşturulan Codex alt sürecinden `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini
kaldırır. Bu, Gateway düzeyi API anahtarlarının embeddings veya doğrudan OpenAI
modelleri için kullanılabilir kalmasını sağlarken yerel Codex uygulama sunucusu
turlarının yanlışlıkla API üzerinden ücretlendirilmesini engeller. Açık Codex
API anahtarı profilleri ve yerel stdio ortam anahtarı yedeği, devralınmış alt
süreç ortamı yerine uygulama sunucusu oturum açmasını kullanır. WebSocket
uygulama sunucusu bağlantıları Gateway ortam API anahtarı yedeğini almaz; açık
bir kimlik doğrulama profili veya uzak uygulama sunucusunun kendi hesabını
kullanın.
Yerel Codex pluginleri yapılandırıldığında, OpenClaw plugin sahibi uygulamaları
Codex iş parçacığına sunmadan önce bu pluginleri bağlı uygulama sunucusu
üzerinden yükler veya yeniler. `app/list`, uygulama kimlikleri, erişilebilirlik
ve meta veriler için doğruluk kaynağı olmaya devam eder, ancak iş parçacığı
başına etkinleştirme kararının sahibi OpenClaw'dır: ilke listelenmiş
erişilebilir bir uygulamaya izin veriyorsa, `app/list` şu anda o uygulamayı devre
dışı bildiriyor olsa bile OpenClaw
`thread/start.config.apps[appId].enabled = true` gönderir. Bu yol bilinmeyen
kimlikler için uygulama kurulumu uydurmaz; OpenClaw yalnızca marketplace
pluginlerini `plugin/install` ile etkinleştirir ve ardından envanteri yeniler.

Bir abonelik profili Codex kullanım sınırına ulaşırsa, Codex bir sıfırlama
zamanı bildirdiğinde OpenClaw bunu kaydeder ve aynı Codex çalıştırması için
sonraki sıralı kimlik doğrulama profilini dener. Sıfırlama zamanı geçtiğinde,
seçilen `openai/gpt-*` modeli veya Codex çalışma zamanı değiştirilmeden abonelik
profili yeniden uygun hale gelir.

Yerel stdio app-server başlatmaları için OpenClaw, Codex yapılandırması, auth/hesap dosyaları, Plugin önbelleği/verileri ve yerel iş parçacığı durumunun varsayılan olarak operatörün kişisel `~/.codex` dizinini okumaması veya yazmaması için `CODEX_HOME` değerini ajan başına bir dizine ayarlar. OpenClaw normal süreç `HOME` değerini korur; Codex tarafından çalıştırılan alt süreçler kullanıcı ana dizini yapılandırmasını ve tokenları hâlâ bulabilir, Codex ayrıca paylaşılan `$HOME/.agents/skills` ve `$HOME/.agents/plugins/marketplace.json` girdilerini keşfedebilir. `appServer.homeScope: "user"` ile OpenClaw bunun yerine yerel kullanıcı Codex ana dizinini ve mevcut hesabını, bir OpenClaw auth profili enjekte etmeden kullanır.

Bir dağıtım ek ortam yalıtımı gerektiriyorsa, bu değişkenleri `appServer.clearEnv` öğesine ekleyin:

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

`appServer.clearEnv` yalnızca oluşturulan Codex app-server alt sürecini etkiler. OpenClaw, yerel başlatma normalleştirmesi sırasında `CODEX_HOME` ve `HOME` değerlerini bu listeden kaldırır: `CODEX_HOME` seçili ajan veya kullanıcı kapsamını göstermeye devam eder ve `HOME` devralınmış kalır, böylece alt süreçler normal kullanıcı ana dizini durumunu kullanabilir.

Codex dinamik araçları varsayılan olarak `searchable` yüklemeyi kullanır. OpenClaw, Codex'e özgü çalışma alanı işlemlerini yineleyen dinamik araçları açığa çıkarmaz: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` ve `update_plan`. Mesajlaşma, medya, Cron, tarayıcı, düğümler, Gateway ve `heartbeat_respond` gibi kalan çoğu OpenClaw entegrasyon aracı, başlangıç model bağlamını daha küçük tutmak için Codex araç araması aracılığıyla `openclaw` ad alanı altında kullanılabilir. Arama etkinleştirildiğinde ve yönetilen bir sağlayıcı seçilmediğinde web araması varsayılan olarak Codex'in barındırılan `web_search` aracını kullanır. Yerel barındırılan arama ile OpenClaw'ın yönetilen `web_search` dinamik aracı birbirini dışlar; böylece yönetilen arama yerel alan kısıtlamalarını atlayamaz. OpenClaw, barındırılan arama kullanılamadığında, açıkça devre dışı bırakıldığında veya seçili bir yönetilen sağlayıcıyla değiştirildiğinde yönetilen aracı kullanır. OpenClaw, Codex'in bağımsız `web.run` uzantısını devre dışı tutar çünkü üretim app-server trafiği, kullanıcı tanımlı `web` ad alanını reddeder. `tools.web.search.enabled: false`, araçları devre dışı bırakılmış yalnızca LLM çalıştırmaları gibi her iki yolu da devre dışı bırakır. Codex, `"cached"` değerini bir tercih olarak ele alır ve kısıtlanmamış app-server turları için bunu canlı harici erişime çözer. Yerel `allowedDomains` ayarlandığında otomatik yönetilen geri dönüş kapalı şekilde başarısız olur; böylece izin listesi atlanamaz. Kalıcı etkili arama ilkesi değişiklikleri, bir sonraki turdan önce bağlı Codex iş parçacığını döndürür. Geçici tur başına kısıtlamalar geçici bir kısıtlı iş parçacığı kullanır ve daha sonra devam etmek üzere mevcut bağlamayı korur. `sessions_yield` ve yalnızca mesaj aracı kaynak yanıtları doğrudan kalır çünkü bunlar tur denetimi sözleşmeleridir. `sessions_spawn` aranabilir kalır; böylece Codex'in yerel `spawn_agent` öğesi birincil Codex alt ajan yüzeyi olmaya devam ederken, açık OpenClaw veya ACP yetkilendirmesi `openclaw` dinamik araç ad alanı üzerinden hâlâ kullanılabilir. Heartbeat iş birliği talimatları, araç zaten yüklenmemişse Codex'e bir Heartbeat turunu bitirmeden önce `heartbeat_respond` aramasını söyler.

`codexDynamicToolsLoading: "direct"` değerini yalnızca ertelenmiş dinamik araçları arayamayan özel bir Codex app-server'a bağlanırken veya tam araç yükünü hata ayıklarken ayarlayın.

Desteklenen üst düzey Codex Plugin alanları:

| Alan                       | Varsayılan     | Anlam                                                                                                           |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | OpenClaw dinamik araçlarını doğrudan başlangıç Codex araç bağlamına koymak için `"direct"` kullanın.             |
| `codexDynamicToolsExclude` | `[]`           | Codex app-server turlarından çıkarılacak ek OpenClaw dinamik araç adları.                                        |
| `codexPlugins`             | devre dışı     | Taşınmış, kaynak kurulumlu derlenmiş Pluginler için yerel Codex Plugin/uygulama desteği.                         |

Desteklenen `appServer` alanları:

| Alan                                          | Varsayılan                                            | Anlam                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` Codex'i başlatır; `"websocket"` `url` adresine bağlanır.                                                                                                                                                                                                                                                                                                                                         |
| `homeScope`                                   | `"agent"`                                              | `"agent"` Codex durumunu her OpenClaw ajanı için yalıtır. `"user"` yerel `$CODEX_HOME` veya `~/.codex` dizinini paylaşır, yerel kimlik doğrulamayı kullanır ve yalnızca sahip tarafından kullanılabilen iş parçacığı yönetimini etkinleştirir. Kullanıcı kapsamı stdio gerektirir.                                                                                                                          |
| `command`                                     | yönetilen Codex ikili dosyası                          | stdio aktarımı için çalıştırılabilir dosya. Yönetilen ikili dosyayı kullanmak için boş bırakın; yalnızca açık bir geçersiz kılma için ayarlayın.                                                                                                                                                                                                                                                           |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio aktarımı için bağımsız değişkenler.                                                                                                                                                                                                                                                                                                                                                                   |
| `url`                                         | ayarlanmamış                                           | WebSocket app-server URL'si.                                                                                                                                                                                                                                                                                                                                                                                |
| `authToken`                                   | ayarlanmamış                                           | WebSocket aktarımı için Bearer belirteci. Düz bir dizeyi veya `${CODEX_APP_SERVER_TOKEN}` gibi SecretInput değerini kabul eder.                                                                                                                                                                                                                                                                             |
| `headers`                                     | `{}`                                                   | Ek WebSocket başlıkları. Başlık değerleri düz dizeleri veya SecretInput değerlerini kabul eder; örneğin `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                                     |
| `clearEnv`                                    | `[]`                                                   | OpenClaw devralınan ortamını oluşturduktan sonra başlatılan stdio app-server işleminden kaldırılan ek ortam değişkeni adları. OpenClaw, yerel başlatmalar için seçili `CODEX_HOME` değerini ve devralınan `HOME` değerini korur.                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | Codex'in yalnızca kod modu araç yüzeyini kullanmayı seçer. OpenClaw dinamik araçları Codex'e kayıtlı kalır; böylece iç içe `tools.*` çağrıları app-server `item/tool/call` köprüsü üzerinden döner.                                                                                                                                                                                                          |
| `remoteWorkspaceRoot`                         | ayarlanmamış                                           | Uzak Codex app-server çalışma alanı kökü. Ayarlandığında OpenClaw, yerel çalışma alanı kökünü çözümlenen OpenClaw çalışma alanından çıkarır, geçerli cwd sonekini bu uzak kök altında korur ve Codex'e yalnızca son app-server cwd değerini gönderir. cwd çözümlenen OpenClaw çalışma alanı kökünün dışındaysa OpenClaw, uzak app-server'a gateway-yerel bir yol göndermek yerine kapalı kalarak başarısız olur. |
| `requestTimeoutMs`                            | `60000`                                                | app-server denetim düzlemi çağrıları için zaman aşımı.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex bir turu kabul ettikten sonra veya tur kapsamlı bir app-server isteğinden sonra OpenClaw `turn/completed` beklerken kullanılan sessiz pencere.                                                                                                                                                                                                                                                        |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw `turn/completed` beklerken araç devri, yerel araç tamamlanması, araç sonrası ham asistan ilerlemesi, ham akıl yürütme tamamlanması veya akıl yürütme ilerlemesinden sonra kullanılan tamamlama-boşta ve ilerleme koruması. Araç sonrası sentezin son asistan yayın bütçesinden meşru şekilde daha uzun süre sessiz kalabileceği güvenilir veya ağır iş yükleri için bunu kullanın.                 |
| `mode`                                        | yerel Codex gereksinimleri YOLO'ya izin vermedikçe `"yolo"` | YOLO veya guardian tarafından incelenen yürütme için ön ayar. `danger-full-access`, `never` onayı veya `user` inceleyicisini atlayan yerel stdio gereksinimleri örtük varsayılanı guardian yapar.                                                                                                                                                                                                            |
| `approvalPolicy`                              | `"never"` veya izin verilen bir guardian onay ilkesi    | İş parçacığı başlatma/sürdürme/tur için gönderilen yerel Codex onay ilkesi. Guardian varsayılanları, izin verildiğinde `"on-request"` değerini tercih eder.                                                                                                                                                                                                                                                 |
| `sandbox`                                     | `"danger-full-access"` veya izin verilen bir guardian sandbox | İş parçacığı başlatma/sürdürme için gönderilen yerel Codex sandbox modu. Guardian varsayılanları, izin verildiğinde `"workspace-write"` değerini, aksi halde `"read-only"` değerini tercih eder. Bir OpenClaw sandbox etkin olduğunda, `danger-full-access` turları OpenClaw sandbox çıkış ayarından türetilen ağ erişimiyle Codex `workspace-write` kullanır.                                            |
| `approvalsReviewer`                           | `"user"` veya izin verilen bir guardian inceleyicisi    | İzin verildiğinde Codex'in yerel onay istemlerini incelemesine izin vermek için `"auto_review"` kullanın; aksi halde `guardian_subagent` veya `user`. `guardian_subagent` eski bir takma ad olarak kalır.                                                                                                                                                                                                    |
| `serviceTier`                                 | ayarlanmamış                                           | İsteğe bağlı Codex app-server hizmet katmanı. `"priority"` hızlı mod yönlendirmesini etkinleştirir, `"flex"` esnek işlemeyi ister, `null` geçersiz kılmayı temizler ve eski `"fast"` değeri `"priority"` olarak kabul edilir.                                                                                                                                                                               |
| `networkProxy`                                | devre dışı                                             | app-server komutları için Codex izin profili ağını kullanmayı seçer. OpenClaw, seçili `permissions.<profile>.network` yapılandırmasını tanımlar ve `sandbox` göndermek yerine bunu `default_permissions` ile seçer.                                                                                                                                                                                        |
| `experimental.sandboxExecServer`              | `false`                                                | Yerel Codex yürütmesinin etkin OpenClaw sandbox içinde çalışabilmesi için Codex app-server 0.132.0 veya daha yeni sürümlere OpenClaw sandbox destekli bir Codex ortamı kaydeden önizleme katılımı.                                                                                                                                                                                                           |

`appServer.networkProxy` açıktır çünkü Codex sandbox sözleşmesini değiştirir.
Etkinleştirildiğinde OpenClaw, oluşturulan izin profilinin Codex tarafından
yönetilen ağı başlatabilmesi için Codex iş parçacığı yapılandırmasında
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

Normal uygulama sunucusu çalışma zamanı `danger-full-access` olacaksa,
`networkProxy` etkinleştirildiğinde oluşturulan izin profili için çalışma alanı
tarzı dosya sistemi erişimi kullanılır. Codex tarafından yönetilen ağ yaptırımı
korumalı ağdır, bu nedenle tam erişimli bir profil dışa giden trafiği korumaz.
Alan adı girdileri `allow` veya `deny` kullanır; Unix soketi girdileri Codex'in
`allow` veya `none` değerlerini kullanır.

OpenClaw'a ait dinamik araç çağrıları `appServer.requestTimeoutMs` değerinden
bağımsız olarak sınırlandırılır: Codex `item/tool/call` istekleri varsayılan
olarak 90 saniyelik bir OpenClaw bekçi süresi kullanır. Pozitif bir çağrı başına
`timeoutMs` argümanı, ilgili aracın bütçesini uzatır veya kısaltır.
`image_generate` aracı, araç çağrısı kendi zaman aşımını sağlamadığında
`agents.defaults.imageGenerationModel.timeoutMs` değerini, aksi halde 120
saniyelik görüntü oluşturma varsayılanını kullanır. Medya anlama `image` aracı
`tools.media.image.timeoutSeconds` değerini veya 60 saniyelik medya
varsayılanını kullanır. Görüntü anlama için bu zaman aşımı isteğin kendisine
uygulanır ve daha önceki hazırlık çalışmaları tarafından azaltılmaz. Dinamik
araç bütçeleri 600000 ms ile sınırlandırılır. Zaman aşımında OpenClaw,
desteklendiği yerde araç sinyalini iptal eder ve oturumu `processing`
durumunda bırakmak yerine turun devam edebilmesi için Codex'e başarısız bir
dinamik araç yanıtı döndürür. Bu bekçi süresi dış dinamik `item/tool/call`
bütçesidir; sağlayıcıya özgü istek zaman aşımları bu çağrının içinde çalışır ve
kendi zaman aşımı semantiklerini korur.

Codex bir turu kabul ettikten ve OpenClaw tur kapsamlı bir uygulama sunucusu
isteğine yanıt verdikten sonra harness, Codex'in geçerli turda ilerleme
kaydetmesini ve sonunda yerel turu `turn/completed` ile bitirmesini bekler.
Uygulama sunucusu `appServer.turnCompletionIdleTimeoutMs` boyunca sessiz kalırsa
OpenClaw en iyi çabayla Codex turunu keser, tanılama zaman aşımını kaydeder ve
OpenClaw oturum şeridini serbest bırakır; böylece takip eden sohbet iletileri
eskimiş bir yerel turun arkasında kuyruğa alınmaz. Aynı tur için terminal
olmayan çoğu bildirim bu kısa bekçiyi devre dışı bırakır, çünkü Codex turun hala
canlı olduğunu kanıtlamıştır. Araç devirleri daha uzun bir araç sonrası boşta
kalma bütçesi kullanır: OpenClaw bir `item/tool/call` yanıtı döndürdükten sonra,
`commandExecution` gibi yerel araç öğeleri tamamlandıktan sonra, ham
`custom_tool_call_output` tamamlamalarından sonra ve araç sonrası ham asistan
ilerlemesi, ham akıl yürütme tamamlamaları veya akıl yürütme ilerlemesinden
sonra. Koruma, yapılandırıldığında
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` değerini kullanır ve
aksi halde varsayılan olarak beş dakikadır. Aynı araç sonrası bütçe, Codex bir
sonraki geçerli tur olayını yayımlamadan önceki sessiz sentez penceresi için
ilerleme bekçisini de uzatır. Hız sınırı güncellemeleri gibi genel uygulama
sunucusu bildirimleri tur-boşta ilerlemesini sıfırlamaz. Akıl yürütme
tamamlamaları, commentary `agentMessage` tamamlamaları ve araç öncesi ham akıl
yürütme veya asistan ilerlemesini otomatik bir son yanıt izleyebilir; bu nedenle
oturum şeridini hemen serbest bırakmak yerine ilerleme sonrası yanıt korumasını
kullanırlar. Yalnızca son/commentary olmayan tamamlanmış `agentMessage` öğeleri
ve araç öncesi ham asistan tamamlamaları asistan çıktısı serbest bırakmasını
kurar: Codex daha sonra `turn/completed` olmadan sessiz kalırsa OpenClaw en iyi
çabayla yerel turu keser ve oturum şeridini serbest bırakır. Başka bir tur
izleyicisi bu serbest bırakma yarışını kazanırsa OpenClaw, yerel istek, öğe veya
dinamik araç tamamlaması aktif kalmadığında ve asistan çıktısı serbest bırakması
hala en son tamamlanan öğeye ait olduğunda, daha sonra tamamlanan öğe yoksa
tamamlanmış son asistan öğesini yine de kabul eder. Bu, turu yeniden oynatmadan
tamamlanmış araç çalışmasından sonra son yanıtı koruyabilir. Kısmi asistan
deltaları, eskimiş önceki yanıtlar ve boş sonraki tamamlamalar uygun değildir.
Asistan, araç, aktif öğe veya yan etki kanıtı olmadan tur tamamlama boşta zaman
aşımları dahil yeniden oynatmaya güvenli stdio uygulama sunucusu hataları,
yeni bir uygulama sunucusu denemesinde bir kez yeniden denenir. Güvensiz zaman
aşımları yine de takılı uygulama sunucusu istemcisini emekliye ayırır ve
OpenClaw oturum şeridini serbest bırakır. Ayrıca otomatik olarak yeniden
oynatılmak yerine eskimiş yerel iş parçacığı bağını temizlerler. Tamamlama
izleme zaman aşımları Codex'e özgü zaman aşımı metni gösterir: yeniden
oynatmaya güvenli durumlar yanıtın eksik olabileceğini söylerken güvensiz
durumlar kullanıcıya yeniden denemeden önce geçerli durumu doğrulamasını söyler.
Genel zaman aşımı tanılamaları son uygulama sunucusu bildirim yöntemi, ham
asistan yanıt öğesi kimliği/türü/rolü, aktif istek/öğe sayıları ve kurulu izleme
durumu gibi yapısal alanlar içerir. Son bildirim ham asistan yanıt öğesi
olduğunda sınırlı bir asistan metin önizlemesi de içerirler. Ham prompt veya
araç içeriği içermezler.

Yerel test için ortam geçersiz kılmaları kullanılabilir durumda kalır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`, `appServer.command` ayarlanmamışsa yönetilen
ikiliyi atlar.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırıldı. Bunun yerine
`plugins.entries.codex.config.appServer.mode: "guardian"` kullanın veya tek
seferlik yerel test için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın.
Yinelenebilir dağıtımlar için yapılandırma tercih edilir, çünkü Plugin davranışını
Codex harness kurulumunun geri kalanıyla aynı gözden geçirilmiş dosyada tutar.

## Yerel Codex Plugin'leri

Yerel Codex Plugin desteği, OpenClaw harness turuyla aynı Codex iş parçacığında
Codex uygulama sunucusunun kendi uygulama ve Plugin yeteneklerini kullanır.
OpenClaw, Codex Plugin'lerini sentetik `codex_plugin_*` OpenClaw dinamik
araçlarına çevirmez.

`codexPlugins` yalnızca yerel Codex harness'ını seçen oturumları etkiler. Yerleşik
harness çalıştırmalarında, normal OpenAI sağlayıcı çalıştırmalarında, ACP
konuşma bağlarında veya diğer harness'larda etkisi yoktur.

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

OpenClaw bir Codex harness oturumu kurduğunda veya eskimiş bir Codex iş parçacığı
bağını değiştirdiğinde iş parçacığı uygulama yapılandırması hesaplanır. Her
turda yeniden hesaplanmaz. `codexPlugins` değiştirildikten sonra, gelecekteki
Codex harness oturumlarının güncellenmiş uygulama kümesiyle başlaması için
`/new`, `/reset` kullanın veya gateway'i yeniden başlatın.

Taşıma uygunluğu, uygulama envanteri, yıkıcı eylem politikası, elicitations ve
yerel Plugin tanılamaları için bkz.
[Yerel Codex Plugin'leri](/tr/plugins/codex-native-plugins).

OpenAI tarafı uygulama ve Plugin erişimi, oturum açılmış Codex hesabı ve Business
ile Enterprise/Edu çalışma alanları için çalışma alanı uygulama kontrolleri
tarafından denetlenir. OpenAI'nin hesap ve çalışma alanı kontrolü genel bakışı
için bkz.
[Codex'i ChatGPT planınızla kullanma](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Bilgisayar Kullanımı

Bilgisayar Kullanımı kendi kurulum rehberinde ele alınır:
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use).

Kısa sürüm: OpenClaw masaüstü kontrol uygulamasını vendor etmez veya masaüstü
eylemlerini kendisi yürütmez. Codex uygulama sunucusunu hazırlar,
`computer-use` MCP sunucusunun kullanılabilir olduğunu doğrular ve ardından
Codex modu turlarında yerel MCP araç çağrılarını Codex'in üstlenmesine izin
verir.

## Çalışma zamanı sınırları

Codex harness yalnızca düşük seviyeli gömülü aracı yürütücüsünü değiştirir.

- OpenClaw dinamik araçları desteklenir. Codex, OpenClaw'dan bu araçları
  yürütmesini ister; böylece OpenClaw yürütme yolunda kalır.
- Codex'e yerel shell, patch, MCP ve yerel uygulama araçlarının sahibi Codex'tir.
  OpenClaw desteklenen relay üzerinden seçili yerel olayları gözlemleyebilir
  veya engelleyebilir, ancak yerel araç argümanlarını yeniden yazmaz.
- Yerel Compaction'ın sahibi Codex'tir. OpenClaw kanal geçmişi, arama, `/new`,
  `/reset` ve gelecekte model veya harness değiştirme için bir transkript aynası
  tutar, ancak Codex Compaction'ı bir OpenClaw veya bağlam motoru özetleyicisiyle
  değiştirmez.
- Medya oluşturma, medya anlama, TTS, onaylar ve mesajlaşma aracı çıktısı
  eşleşen OpenClaw sağlayıcı/model ayarları üzerinden devam eder.
- `tool_result_persist`, Codex'e yerel araç sonuç kayıtlarına değil, OpenClaw'a
  ait transkript araç sonuçlarına uygulanır.

Hook katmanları, desteklenen V1 yüzeyleri, yerel izin işleme, kuyruk
yönlendirme, Codex geri bildirim yükleme mekaniği ve Compaction ayrıntıları
için bkz. [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime).

## Sorun giderme

**Codex normal bir `/model` sağlayıcısı olarak görünmüyor:** yeni
yapılandırmalar için bu beklenen bir durumdur. Bir `openai/gpt-*` modeli seçin,
`plugins.entries.codex.enabled` değerini etkinleştirin ve `plugins.allow`
değerinin `codex` öğesini dışlayıp dışlamadığını kontrol edin.

**OpenClaw, Codex yerine yerleşik harness'ı kullanıyor:** model ref değerinin
resmi OpenAI sağlayıcısında `openai/gpt-*` olduğundan ve Codex Plugin'inin
yüklü ve etkin olduğundan emin olun. Test sırasında kesin kanıta ihtiyacınız
varsa sağlayıcı veya model `agentRuntime.id: "codex"` değerini ayarlayın.
Zorlanmış Codex çalışma zamanı, OpenClaw'a geri dönmek yerine başarısız olur.

**OpenAI Codex çalışma zamanı API anahtarı yoluna geri dönüyor:** modeli,
çalışma zamanını, seçili sağlayıcıyı ve hatayı gösteren redakte edilmiş bir
gateway alıntısı toplayın. Etkilenen iş arkadaşlarından OpenClaw ana
makinelerinde bu salt okunur komutu çalıştırmalarını isteyin:

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

**Eski Codex model ref yapılandırması kalıyor:** `openclaw doctor --fix`
çalıştırın. Doctor eski model ref değerlerini `openai/*` olarak yeniden yazar,
eskimiş oturum ve tüm aracı çalışma zamanı pin'lerini kaldırır ve mevcut kimlik
doğrulama profili geçersiz kılmalarını korur.

**Uygulama sunucusu reddediliyor:** Codex uygulama sunucusu `0.125.0` veya daha
yenisini kullanın. `0.125.0-alpha.2` veya `0.125.0+custom` gibi aynı sürüm ön
sürümleri veya build sonekli sürümler reddedilir, çünkü OpenClaw kararlı
`0.125.0` protokol tabanını test eder.

**`/codex status` bağlanamıyor:** paketlenmiş `codex` Plugin'inin etkin
olduğunu, allowlist yapılandırılmışsa `plugins.allow` değerinin onu içerdiğini
ve özel `appServer.command`, `url`, `authToken` veya header değerlerinin geçerli
olduğunu kontrol edin.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs`
değerini düşürün veya keşfi devre dışı bırakın. Bkz.
[Codex harness başvurusu](/tr/plugins/codex-harness-reference#model-discovery).

**WebSocket taşıması hemen başarısız oluyor:** `appServer.url`, `authToken`,
header değerlerini ve uzak uygulama sunucusunun aynı Codex uygulama sunucusu
protokol sürümünü konuştuğunu kontrol edin.

**Yerel kabuk veya yama araçları `Native hook relay unavailable` ile engellendi:**
Codex iş parçacığı hâlâ OpenClaw’ın artık kayıtlı tutmadığı bir yerel hook relay kimliğini kullanmaya çalışıyor. Bu, ACP backend, sağlayıcı, GitHub veya kabuk komutu hatası değil, yerel Codex hook aktarımı sorunudur. Etkilenen sohbette `/new` veya `/reset` ile yeni bir oturum başlatın, ardından zararsız bir komutu yeniden deneyin. Bu bir kez çalışır ancak sonraki yerel araç çağrısı yeniden başarısız olursa, `/new` komutunu yalnızca geçici bir çözüm olarak değerlendirin: Codex app-server veya OpenClaw Gateway yeniden başlatıldıktan sonra istemi yeni bir oturuma kopyalayın; böylece eski iş parçacıkları atılır ve yerel hook kayıtları yeniden oluşturulur.

**Codex olmayan bir model yerleşik harness kullanıyor:** sağlayıcı veya model runtime ilkesi onu başka bir harness’e yönlendirmedikçe bu beklenen bir durumdur. Düz OpenAI olmayan sağlayıcı başvuruları, `auto` modunda normal sağlayıcı yollarında kalır.

**Computer Use yüklü ancak araçlar çalışmıyor:** yeni bir oturumdan `/codex computer-use status` komutunu kontrol edin. Bir araç `Native hook relay unavailable` bildirirse yukarıdaki yerel hook relay kurtarma adımlarını kullanın. Bkz. [Codex Computer Use](/tr/plugins/codex-computer-use#troubleshooting).

## İlgili

- [Codex harness başvurusu](/tr/plugins/codex-harness-reference)
- [Codex harness runtime](/tr/plugins/codex-harness-runtime)
- [Yerel Codex Plugin’leri](/tr/plugins/codex-native-plugins)
- [Codex Computer Use](/tr/plugins/codex-computer-use)
- [Ajan runtime’ları](/tr/concepts/agent-runtimes)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [OpenAI Codex yardımı](https://help.openai.com/en/collections/14937394-codex)
- [Ajan harness Plugin’leri](/tr/plugins/sdk-agent-harness)
- [Plugin hook’ları](/tr/plugins/hooks)
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics)
- [Durum](/tr/cli/status)
- [Test Etme](/tr/help/testing-live#live-codex-app-server-harness-smoke)
