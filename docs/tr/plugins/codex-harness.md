---
read_when:
    - Resmî Codex app-server test altyapısını kullanmak istiyorsunuz
    - Codex harness yapılandırma örneklerine ihtiyacınız var
    - Codex'e özel dağıtımların OpenClaw'a geri dönmek yerine başarısız olmasını istiyorsunuz
summary: Resmî Codex app-server test düzeneği üzerinden OpenClaw gömülü ajan turlarını çalıştırın
title: Codex çalışma çerçevesi
x-i18n:
    generated_at: "2026-07-16T17:37:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f27d934036ca6952ec12bbda3d275d08701a38ac9c79df37fc6040f01b529cd
    source_path: plugins/codex-harness.md
    workflow: 16
---

Resmî `codex` plugin'i, yerleşik OpenClaw koşum takımı yerine Codex
app-server üzerinden gömülü OpenAI ajan turlarını çalıştırır. Düşük seviyeli
ajan oturumunu Codex yönetir: yerel iş parçacığı sürdürme, yerel araç devamı,
yerel Compaction ve app-server yürütmesi. OpenClaw ise sohbet kanallarını,
oturum dosyalarını, model seçimini, OpenClaw dinamik araçlarını, onayları,
medya teslimini ve görünür transkript yansısını yönetmeye devam eder.

`openai/gpt-5.6-sol` gibi standart OpenAI model başvurularını kullanın. Eski
Codex GPT başvurularını yapılandırmayın; OpenAI ajan kimlik doğrulama sırasını
`auth.order.openai` altında belirleyin. Eski Codex kimlik doğrulama profili
kimlikleri ve eski Codex kimlik doğrulama sırası girdileri
`openclaw doctor --fix` tarafından onarılır.

Sağlayıcı/model çalışma zamanı ilkesi ayarlanmamışken veya `auto` iken, yalnızca `openai/*` öneki
bu koşum takımını hiçbir zaman seçmez. OpenAI, yalnızca istek için yazılmış
bir geçersiz kılma bulunmayan tam bir resmî HTTPS Platform Responses veya
ChatGPT Responses rotasında Codex'i örtük olarak seçebilir. Bkz.
[OpenAI örtük ajan çalışma zamanı](/tr/providers/openai#implicit-agent-runtime).
Platform ile ChatGPT yönlendirmesi bilinmeden önce kimlik doğrulamayı Codex
yönetiyorsa OpenClaw yine de her aday rotanın Codex uyumluluğunu bildirmesini
gerektirir. Yalnızca yerel kimlik doğrulama sahipliği bu rota denetimini hiçbir
zaman atlamaz.

Etkin bir OpenClaw korumalı alanı olmadığında OpenClaw, Codex app-server iş
parçacıklarını Codex yerel kod modu etkin şekilde başlatır (yalnızca kod modu
varsayılan olarak kapalı kalır); böylece yerel çalışma alanı/kod yetenekleri,
app-server `item/tool/call` köprüsü üzerinden yönlendirilen OpenClaw dinamik
araçlarıyla birlikte kullanılabilir. Etkin bir OpenClaw korumalı alanı veya
kısıtlı araç ilkesi, deneysel korumalı alan exec-server yolunu açıkça
etkinleştirmediğiniz sürece yerel kod modunu tamamen devre dışı bırakır.

Varsayılan `tools.exec.host: "auto"` ile ve etkin bir OpenClaw korumalı alanı
olmadığında Codex, eşleştirilmiş Node'larda komut çalıştırmak için
`node_exec` ve `node_process` araçlarını da alır. Yerel kabuk Codex app-server
ana makinesinde ve çalışma alanında kalır (varsayılan stdio dağıtımında
Gateway'e yereldir); `node_exec`, ada veya kimliğe göre bir Node seçer
ve OpenClaw'ın Node onay ilkesini yürürlükte tutar. Sonlu bir çalışma zamanı
izin listesi yerel Kod Modu'nu devre dışı bırakır ve turu yürütme ortamı
olmadan bırakırsa OpenClaw, bunun yerine doğrudan ve korumalı alan olmadan
yürütme için ilke filtreli `exec` ve `process` araçlarını kullanılabilir
tutar.

Codex'e özgü bu özellik, farklı bir `exec` girdi biçimiyle genel
OpenClaw çalıştırmaları için isteğe bağlı bir QuickJS-WASI çalışma zamanı olan
[OpenClaw kod modundan](/tr/reference/code-mode) ayrıdır. Daha geniş
model/sağlayıcı/çalışma zamanı ayrımı için
[Ajan çalışma zamanları](/tr/concepts/agent-runtimes) ile başlayın:
`openai/gpt-5.6-sol` model başvurusudur, `codex` çalışma zamanıdır;
Telegram, Discord, Slack veya başka bir kanal ise iletişim yüzeyidir.

## Gereksinimler

- Resmî `@openclaw/codex` plugin'i kurulu olmalıdır. Yapılandırmanız bir izin
  listesi kullanıyorsa `plugins.allow` içine `codex` ekleyin.
- Codex app-server `0.143.0` veya daha yeni olmalıdır. Plugin varsayılan
  olarak uyumlu bir ikili dosyayı yönetir; dolayısıyla `PATH` üzerindeki
  bir `codex` komutu normal başlatmayı etkilemez.
- `openclaw models auth login --provider openai` üzerinden Codex kimlik doğrulaması, ajanın Codex ana
  dizininde önceden bulunan bir app-server hesabı veya açık bir Codex API
  anahtarı kimlik doğrulama profili gereklidir.

Kimlik doğrulama önceliği, ortam yalıtımı, özel app-server komutları, model
keşfi ve yapılandırma alanlarının tam listesi için
[Codex koşum takımı başvurusuna](/tr/plugins/codex-harness-reference) bakın.

## Hızlı başlangıç

Resmî plugin'i kurun, ardından Codex OAuth ile oturum açın:

```bash
openclaw plugins install @openclaw/codex
openclaw models auth login --provider openai
```

`codex` plugin'ini etkinleştirin ve bir OpenAI ajan modeli seçin:

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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Yapılandırmanız `plugins.allow` kullanıyorsa `codex` öğesini de
buraya ekleyin:

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

Plugin yapılandırmasını değiştirdikten sonra Gateway'i yeniden başlatın. Bir
sohbetin zaten oturumu varsa sonraki turun koşum takımını güncel
yapılandırmadan çözümlemesi için önce `/new` veya
`/reset` çalıştırın.

## İş parçacıklarını Codex Desktop ve CLI ile paylaşma

Varsayılan `appServer.homeScope: "agent"`, her OpenClaw ajanını operatörün yerel Codex
durumundan yalıtır. Bir sahibin Codex Desktop ve Codex CLI tarafından
gösterilen aynı yerel iş parçacıklarını inceleyip yönetebilmesi için kullanıcı
Codex ana dizinini etkinleştirin:

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

Kullanıcı ana dizini modu, yerel yönetilen bir stdio işlemini veya paylaşılan
Unix soketi aktarımını destekler. Ayarlanmışsa `$CODEX_HOME`, aksi
durumda `~/.codex` kullanır; buna söz konusu ana dizinin yerel Codex
kimlik doğrulaması, yapılandırması, plugin'leri ve iş parçacığı deposu dahildir.
OpenClaw bu app-server'a bir OpenClaw kimlik doğrulama profili eklemez.

Sahip turları `codex_threads` aracını edinir: yerel iş parçacıklarını
listeleme, arama, okuma, çatallama, yeniden adlandırma, arşivleme ve geri
yükleme. Bir iş parçacığını OpenClaw'da sürdürmek için çatallayın; çatal,
mevcut OpenClaw oturumuna bağlanır ve diğer yerel Codex istemcileri tarafından
görünür kalır. Arşivleme, iş parçacığının başka bir yerde kapalı olduğunun
açıkça onaylanmasını gerektirir. Gözetim de etkinse transkript alanları ve
değişiklikler için ilgili `supervision.allowRawTranscripts` veya `supervision.allowWriteControls`
etkinleştirmesi gerekir.

Aynı iş parçacığını bağımsız yönetilen stdio App Server'lar üzerinden eşzamanlı
olarak sürdürmeyin veya yazmayın. Codex, canlı yazıcıları ayrı işlemler
arasında değil, tek bir App Server içinde koordine eder. Çatallama, sıradan
kullanıcı ana dizini stdio oturumlarının güvenle birlikte var olmasını sağlar.

Yalnızca `appServer.homeScope: "user"` filo kataloğunu denetlemez. Yerel oturum keşfi
plugin etkinken etkinleştirilir; Codex'i devre dışı bırakmadan OpenClaw kenar
çubuğundan kaldırmak için `sessionCatalog.enabled: false` ayarını kullanın. Katalog ayrı
bir gözetim bağlantısı kullanır; açık `appServer` bağlantı ayarları
olmadığında sıradan koşum takımı ajan kapsamlı kalırken bu bağlantı varsayılan
olarak yönetilen kullanıcı ana dizini stdio kullanır. Açık
`appServer` ayarları her iki yol tarafından da dikkate alınır.
Sıradan koşum takımının da yerel durumu paylaşması gerektiğinde yukarıdaki gibi
`homeScope: "user"` ayarını açıkça belirleyin.

## Codex oturumlarını gözetme

Aynı `codex` plugin'i, Gateway bilgisayarındaki ve bu özelliğin
etkinleştirildiği eşleştirilmiş Node'lardaki arşivlenmemiş Codex oturumlarını
listeleyebilir. Depolanmış veya boşta olan Gateway'e yerel bir oturum, kalıcı
durumdaki sınırlı kullanıcı ve asistan geçmişini yansıtan, modele kilitli bir
Sohbet oluşturabilir. Özel bağlaması yerel anlık görüntü, standart dal ve
sonraki turlar için gözetim bağlantısını kullanırken sıradan Codex oturumları
ajan kapsamlı kalır. İlk standart başlatma, Codex'in anlık görüntü çatalı için
döndürdüğü model ve sağlayıcıyı tam olarak kullanır. Sonraki sürdürmeler seçimi
Codex'in yerel yapılandırmasına bırakır; dış OpenClaw modeli ve geri dönüş
zinciri hiçbir zaman bunun yerini almaz. Depolanmış ve boşta olan satırlar,
başka bir çalıştırıcı bulunmadığı açıkça onaylandıktan sonra arşivlenebilir.
Etkin kaynaklar dal oluşturamaz veya arşivlenemez; mevcut gözetimli bir Sohbet
yine de açılabilir. Eşleştirilmiş Node oturumları yalnızca meta veri olarak
kalır.

Kurulum, dallanma kuralları, eşleştirilmiş Node sınırları, meta veri gösterimi
ve sorun giderme için
[Codex oturumlarını gözetme](/plugins/codex-supervision) sayfasına bakın.

## Yapılandırma

| Gereksinim                                          | Ayar                                                                                             | Konum                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Koşum takımını etkinleştirme                        | `plugins.entries.codex.enabled: true`                                                                               | OpenClaw yapılandırması            |
| Yerel Codex oturum keşfini gizleme                  | `plugins.entries.codex.config.sessionCatalog.enabled: false`                                                                               | Codex plugin yapılandırması        |
| İzin listesindeki plugin kurulumunu koruma          | `plugins.allow` içine `codex` ekleyin                                              | OpenClaw yapılandırması            |
| Uygun OpenAI turlarının Codex'i örtük kullanmasına izin verme | Tam resmî HTTPS Responses/ChatGPT rotası, istek için yazılmış geçersiz kılma yok, çalışma zamanı ayarlanmamış/`auto` | OpenAI sağlayıcı/model yapılandırması |
| ChatGPT/Codex OAuth ile oturum açma                 | `openclaw models auth login --provider openai`                                                                               | CLI kimlik doğrulama profili       |
| Codex çalıştırmaları için API anahtarı yedeği ekleme | `auth.order.openai` içinde abonelik kimlik doğrulamasından sonra listelenen `openai:*` API anahtarı profili | CLI kimlik doğrulama profili + OpenClaw yapılandırması |
| Codex kullanılamadığında kapalı durumda başarısız olma | Sağlayıcı veya model `agentRuntime.id: "codex"`                                                        | OpenClaw model/sağlayıcı yapılandırması |
| Doğrudan OpenAI API trafiği kullanma                | Normal OpenAI kimlik doğrulamasıyla sağlayıcı veya model `agentRuntime.id: "openclaw"`                       | OpenClaw model/sağlayıcı yapılandırması |
| App-server davranışını ayarlama                     | `plugins.entries.codex.config.appServer.*`                                                                               | Codex plugin yapılandırması        |
| Yerel Codex plugin uygulamalarını etkinleştirme     | `plugins.entries.codex.config.codexPlugins.*`                                                                               | Codex plugin yapılandırması        |
| Codex Computer Use'ı etkinleştirme                  | `plugins.entries.codex.config.computerUse.*`                                                                               | Codex plugin yapılandırması        |

Abonelik öncelikli/API anahtarı yedekli sıralama için
`auth.order.openai` tercih edin. Mevcut eski Codex kimlik doğrulama profili
kimlikleri ve eski Codex kimlik doğrulama sırası yalnızca doctor tarafından
işlenen eski durumdur; yeni eski Codex GPT başvuruları yazmayın.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Codex uyumlu etkin bir rota için yukarıdaki her iki profil de aynı Codex
çalıştırması için aday olmaya devam eder. Profil sırası çalışma zamanını değil,
kimlik bilgilerini seçer. Kimlik doğrulama sırasını değiştirmek özel,
Completions, HTTP veya isteğin geçersiz kıldığı bir rotayı Codex uyumlu hâle
getirmez.

### Compaction

Codex destekli ajanlarda `compaction.model` veya `compaction.provider`
ayarlamayın. Codex, yerel app-server iş parçacığı durumu üzerinden Compaction
uygular; bu nedenle OpenClaw çalışma zamanında bu yerel özetleyici geçersiz
kılmalarını yok sayar ve ajan Codex kullandığında `openclaw doctor --fix` bunları
kaldırır.

Lossless, Codex turları çevresindeki birleştirme, veri alımı ve bakım için bir
bağlam motoru olarak desteklenmeye devam eder ve `agents.defaults.compaction.provider` üzerinden
değil, `plugins.slots.contextEngine: "lossless-claw"` ve `plugins.entries.lossless-claw.config.summaryModel` üzerinden yapılandırılır.
Codex etkin çalışma zamanı olduğunda `openclaw doctor --fix`, eski
`compaction.provider: "lossless-claw"` biçimini Lossless bağlam motoru yuvasına taşır; ancak
Compaction'ı yine de yerel Codex yönetir. Yerel app-server koşum takımı,
istem öncesi birleştirme gerektiren bağlam motorlarını destekler;
`codex-cli` dahil genel CLI arka uçları bu ana makine yeteneğini
sağlamaz.

Codex destekli ajanlarda `/compact`, bağlı iş parçacığında yerel Codex
app-server Compaction işlemini başlatır. OpenClaw tamamlanmasını beklemez, bir
OpenClaw zaman aşımı uygulamaz, paylaşılan app-server'ı yeniden başlatmaz veya
bir bağlam motoruna ya da herkese açık OpenAI özetleyicisine geri dönmez.
Yerel Codex iş parçacığı bağlaması eksik veya eskiyse komut, Compaction arka
uçlarını sessizce değiştirmek yerine kapalı durumda başarısız olur.

Bu sayfanın geri kalanı dağıtım biçimini, kapalı durumda başarısız olan
yönlendirmeyi, koruyucu onay ilkesini, yerel Codex plugin'lerini ve Computer
Use'ı ele alır. Seçeneklerin tam listesi, varsayılanlar, numaralandırmalar,
keşif, ortam yalıtımı, zaman aşımları ve app-server aktarım alanları için
[Codex koşum takımı başvurusuna](/tr/plugins/codex-harness-reference) bakın.

## Codex çalışma zamanını doğrulama

Codex'i beklediğiniz sohbette `/status` kullanın. Codex destekli bir OpenAI
ajan turu şunu gösterir:

```text
Çalışma zamanı: OpenAI Codex
```

Ardından Codex app-server durumunu kontrol edin:

```text
/codex status
/codex models
```

`/codex status`; app-server bağlantısını, hesabı, hız sınırlarını, MCP
sunucularını ve becerileri bildirir. `/codex models`, harness ve hesap için
canlı Codex app-server kataloğunu listeler. `/status` beklenmedikse
[Sorun giderme](#troubleshooting) bölümüne bakın.

## Yönlendirme ve model seçimi

Sağlayıcı referanslarını ve çalışma zamanı politikasını ayrı tutun:

- Standart OpenAI model seçimi için `openai/gpt-*` kullanın. Önek tek başına
  hiçbir zaman Codex'i seçmez.
- Çalışma zamanı ayarlanmamışken veya `auto` olduğunda, yalnızca yazılmış bir istek geçersiz kılmasına sahip olmayan tam bir resmî HTTPS Platform Responses
  veya ChatGPT Responses rotası Codex'i örtük olarak seçebilir.
- Yapılandırmada eski Codex GPT referanslarını kullanmayın; eski referansları ve güncelliğini yitirmiş oturum rota sabitlemelerini
  onarmak için `openclaw doctor --fix` çalıştırın.
- `agentRuntime.id: "codex"`, uyumlu bir rota için Codex'i hata durumunda kapalı bir
  gereklilik hâline getirir. Uyumsuz bir etkin rotayı uyumlu hâle getirmez.
- `agentRuntime.id: "openclaw"`, kasıtlı olduğunda bir sağlayıcıyı veya modeli gömülü
  OpenClaw çalışma zamanına dahil eder.
- `/codex ...`, sohbetten yerel Codex app-server konuşmalarını denetler.
- ACP/acpx, ayrı bir haricî harness yoludur. Yalnızca kullanıcı
  ACP/acpx veya haricî bir harness bağdaştırıcısı istediğinde kullanın.

| Kullanıcı amacı                                             | Kullanılacak                                                                                            |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Geçerli sohbeti bağlamak                                   | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| Mevcut bir Codex iş parçacığını sürdürmek                   | `/codex resume <thread-id>`                                                                           |
| Codex iş parçacıklarını listelemek veya filtrelemek         | `/codex threads [filter]`                                                                             |
| Yerel Codex pluginlerini listelemek                         | `/codex plugins list`                                                                                 |
| Yapılandırılmış bir yerel Codex pluginini etkinleştirmek veya devre dışı bırakmak | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Saklanan bir Codex CLI oturumunu eşleştirilmiş Node turu olarak sürdürmek | `/codex sessions --host <node> [filter]`, ardından `/codex resume <session-id> --host <node> --bind here` |
| Bilgisayarlar arasındaki arşivlenmemiş Codex oturumlarını görüntülemek | Codex denetimini etkinleştirin ve **Codex Oturumları** bölümünü açın                                   |
| Bağlı iş parçacığının modelini, hızlı modunu veya izinlerini değiştirmek | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| Etkin turu durdurmak veya yönlendirmek                      | `/codex stop`, `/codex steer <text>`                                                                  |
| Geçerli bağlamayı ayırmak                                  | `/codex detach` (`/codex unbind` diğer adıyla)                                                               |
| Yalnızca Codex geri bildirimi göndermek                     | `/codex diagnostics [note]`                                                                           |
| Bir ACP/acpx görevi başlatmak                               | `/codex` değil, ACP/acpx oturum komutları                                                               |

| Kullanım durumu                                 | Yapılandırma                                                                                                | Doğrulama                               | Notlar                                     |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| Yerel Codex çalışma zamanına uygun OpenAI rotası | Yazılmış istek geçersiz kılması olmayan tam resmî HTTPS Responses/ChatGPT rotası ve etkin `codex` plugini | `/status`, `Runtime: OpenAI Codex` gösterir | Çalışma zamanı ayarlanmamışken/`auto` olduğunda örtük yol |
| Codex kullanılamıyorsa hata durumunda kapalı kalma | Sağlayıcı veya model `agentRuntime.id: "codex"`                                                                | Tur, gömülü geri dönüş yerine başarısız olur | Yalnızca Codex kullanılan dağıtımlar için kullanın |
| OpenClaw üzerinden doğrudan OpenAI API anahtarı trafiği | Sağlayıcı veya model `agentRuntime.id: "openclaw"` ve normal OpenAI kimlik doğrulaması                                      | `/status`, OpenClaw çalışma zamanını gösterir        | Yalnızca OpenClaw kullanımı kasıtlı olduğunda kullanın |
| Eski yapılandırma                              | eski Codex GPT referansları                                                                                 | `openclaw doctor --fix` bunu yeniden yazar     | Yeni yapılandırmayı bu şekilde yazmayın    |
| ACP/acpx Codex bağdaştırıcısı                  | ACP `sessions_spawn({ runtime: "acp" })`                                                                    | ACP görev/oturum durumu                  | Yerel Codex harness'ından ayrıdır           |

`agents.defaults.imageModel` aynı önek ayrımını izler. Normal OpenAI rotası için
`openai/gpt-*`, yalnızca görüntü anlama işleminin sınırlı bir Codex
app-server turu üzerinden çalışması gerektiğinde ise `codex/gpt-*`
kullanın. Doctor, eski Codex GPT referanslarını `openai/gpt-*` olarak
yeniden yazar.

## Dağıtım kalıpları

### Temel Codex dağıtımı

Etkin resmî HTTPS rotası Codex'i örtük olarak seçmeye uygun bir OpenAI modeli
için hızlı başlangıç yapılandırmasını kullanın:

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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

### Karma sağlayıcılı dağıtım

Claude'u varsayılan ajan olarak tutun ve adlandırılmış bir Codex ajanı ekleyin:

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
        model: "openai/gpt-5.6-sol",
      },
    ],
  },
}
```

`main` ajanı normal sağlayıcı yolunu kullanır. `codex` ajanı, etkin OpenAI
rotası uyumlu kaldığında Codex app-server'ı kullanır; bunun hata durumunda
kapalı bir gereklilik olması gerekiyorsa açık model kapsamlı
`agentRuntime.id: "codex"` ekleyin.

### Hata durumunda kapalı Codex dağıtımı

Uygun ve tam resmî bir HTTPS OpenAI rotası, paketlenmiş plugin kullanılabilir
olduğunda Codex'e çözümlenebilir. Yazılı bir hata durumunda kapalı kuralı için
açık çalışma zamanı politikası ekleyin:

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
      model: "openai/gpt-5.6-sol",
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

Codex zorunlu tutulduğunda; etkin rota Codex uyumlu olarak bildirilmemişse,
plugin devre dışıysa, app-server çok eskiyse veya app-server başlatılamıyorsa
OpenClaw erken aşamada başarısız olur.

## App-server politikası

Plugin varsayılan olarak OpenClaw'ın yönettiği Codex ikili dosyasını stdio
taşımasıyla yerel olarak başlatır. Yalnızca kasıtlı olarak farklı bir
yürütülebilir dosya çalıştırmak için `appServer.command` ayarlayın. WebSocket
taşımasını yalnızca başka bir yerde zaten çalışan bir app-server olduğunda
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

Yerel stdio app-server oturumları varsayılan olarak güvenilir yerel operatör
duruşunu kullanır: `approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Yerel Codex gereklilikleri bu örtük YOLO duruşuna izin
vermiyorsa OpenClaw bunun yerine izin verilen koruyucu izinlerini seçer.
Oturum için bir OpenClaw korumalı alanı etkin olduğunda OpenClaw, Codex'in
ana makine tarafındaki korumalı alanına güvenmek yerine o tur için Codex'in
yerel Code Mode özelliğini, kullanıcı MCP sunucularını ve uygulama destekli
plugin yürütmesini devre dışı bırakır. Kabuk erişimi bunun yerine normal
exec/process araçları kullanılabildiğinde `sandbox_exec` ve
`sandbox_process` gibi OpenClaw korumalı alanı destekli dinamik araçlardan
geçer.

Korumalı alandan kaçışlardan veya ek izinlerden önce Codex yerel otomatik
incelemesi için normalleştirilmiş OpenClaw exec modunu kullanın:

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

Codex app-server oturumlarında `tools.exec.mode: "auto"`, Codex Guardian tarafından
incelenen onaylarla eşleşir: yerel gereklilikler bu değerlere izin verdiğinde
genellikle `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` ve
`sandbox: "workspace-write"`. `tools.exec.mode: "auto"` modunda OpenClaw, eski ve güvenli
olmayan Codex `approvalPolicy: "never"` veya `sandbox: "danger-full-access"` geçersiz
kılmalarını korumaz; kasıtlı bir onaysız Codex duruşu için
`tools.exec.mode: "full"` kullanın. Eski `plugins.entries.codex.config.appServer.mode: "guardian"` ön ayarı hâlâ
çalışır, ancak `tools.exec.mode: "auto"` normalleştirilmiş OpenClaw yüzeyidir.

Ana makine exec onayları ve ACPX izinleriyle mod düzeyinde karşılaştırma için
[İzin modları](/tr/tools/permission-modes) bölümüne bakın. Tüm app-server
alanları, kimlik doğrulama sırası, ortam yalıtımı ve zaman aşımı davranışı
için [Codex harness referansı](/tr/plugins/codex-harness-reference) bölümüne
bakın.

## Komutlar ve tanılama

`codex` plugini, OpenClaw metin komutlarını destekleyen tüm kanallarda
`/codex` komutunu eğik çizgi komutu olarak kaydeder.

Yerel yürütme ve denetim için bir sahip veya `operator.admin` Gateway
istemcisi gerekir: iş parçacıklarını bağlama veya sürdürme, turları gönderme
veya durdurma, model, hızlı mod veya izin durumunu değiştirme, sıkıştırma veya
inceleme ve bir bağlamayı ayırma. Diğer yetkili gönderenler; salt okunur
durum, yardım, hesap, model, iş parçacığı, MCP sunucusu, beceri ve bağlama
inceleme komutlarını kullanmaya devam eder.

Yaygın biçimler:

- `/codex status`; app-server bağlantısını, modelleri, hesabı, hız
  sınırlarını, MCP sunucularını ve becerileri kontrol eder.
- `/codex models`, canlı Codex app-server modellerini listeler.
- `/codex threads [filter]`, son Codex app-server iş parçacıklarını listeler.
- `/codex resume <thread-id>`, geçerli OpenClaw oturumunu mevcut bir Codex iş
  parçacığına bağlar.
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`,
  geçerli sohbeti bağlar.
- `/codex detach` (veya `/codex unbind`), geçerli bağlamayı ayırır.
- `/codex binding`, geçerli bağlamayı açıklar.
- `/codex stop`, etkin turu durdurur; `/codex steer <text>` ise yönlendirir.
- `/codex model <model>`, `/codex fast [on|off|status]` ve
  `/codex permissions [default|yolo|status]`, konuşma başına durumu değiştirir.
- `/codex compact`, Codex app-server'dan bağlı iş parçacığını sıkıştırmasını ister.
- `/codex review`, bağlı iş parçacığı için Codex yerel incelemesini başlatır.
- `/codex diagnostics [note]`, bağlı iş parçacığı için Codex geri bildirimi
  göndermeden önce sorar.
- `/codex account`, hesap ve hız sınırı durumunu gösterir.
- `/codex mcp`, Codex app-server MCP sunucusu durumunu listeler.
- `/codex skills`, Codex app-server becerilerini listeler.
- `/codex plugins list`, `/codex plugins enable <name>` ve
  `/codex plugins disable <name>`, yapılandırılmış yerel Codex pluginlerini yönetir.
- `/codex computer-use [status|install]`, Codex Computer Use özelliğini yönetir.
- `/codex help`, tam komut ağacını listeler.

Çoğu destek bildirimi için hatanın oluştuğu konuşmada `/diagnostics [note]` ile
başlayın. Bu, tek bir Gateway tanılama raporu oluşturur ve Codex çalışma ortamı
oturumları için ilgili Codex geri bildirim paketini göndermek üzere onay ister.
Gizlilik modeli ve grup sohbeti davranışı için
[Tanılama dışa aktarımı](/tr/gateway/diagnostics) bölümüne bakın. `/codex diagnostics [note]`
komutunu yalnızca tam Gateway tanılama paketi olmadan, o anda bağlı olan iş
parçacığına ait Codex geri bildirimini yüklemek istediğinizde kullanın.

### Codex iş parçacıklarını yerel olarak inceleme

Sorunlu bir Codex çalışmasını incelemenin en hızlı yolu çoğunlukla yerel
Codex iş parçacığını doğrudan açmaktır:

```bash
codex resume <thread-id>
```

İş parçacığı kimliğini tamamlanan `/diagnostics` yanıtından, `/codex binding`
veya `/codex threads [filter]` üzerinden alın.

Yükleme işleyişi ve çalışma zamanı düzeyindeki tanılama sınırları için
[Codex çalışma ortamı çalışma zamanı](/tr/plugins/codex-harness-runtime#codex-feedback-upload)
bölümüne bakın.

### Kimlik doğrulama sırası

Varsayılan aracı başına ana dizinde kimlik doğrulama şu sırayla seçilir:

1. Aracı için sıralanmış OpenAI kimlik doğrulama profilleri; tercihen
   `auth.order.openai` altında. Eski Codex kimlik doğrulama profili kimliklerini ve
   eski Codex kimlik doğrulama sırasını taşımak için `openclaw doctor --fix` komutunu çalıştırın.
2. Uygulama sunucusunun, söz konusu aracının Codex ana dizinindeki mevcut hesabı.
3. Yalnızca yerel stdio uygulama sunucusu başlatmaları için, uygulama sunucusu
   hesabı yoksa ve OpenAI kimlik doğrulaması hâlâ gerekiyorsa önce
   `CODEX_API_KEY`, ardından `OPENAI_API_KEY`.

OpenClaw, ChatGPT aboneliği türünde bir Codex kimlik doğrulama profili
gördüğünde başlatılan alt Codex işleminden `CODEX_API_KEY` ve
`OPENAI_API_KEY` değerlerini kaldırır. Bu, Gateway düzeyindeki API anahtarlarını
gömmeler veya doğrudan OpenAI modelleri için kullanılabilir tutarken yerel
Codex uygulama sunucusu dönüşlerinin yanlışlıkla API üzerinden
ücretlendirilmesini önler. Açık Codex API anahtarı profilleri ve yerel stdio
ortam anahtarı geri dönüşü, devralınan alt işlem ortamı yerine uygulama
sunucusu oturum açma mekanizmasını kullanır. WebSocket uygulama sunucusu
bağlantıları Gateway ortamındaki API anahtarı geri dönüşünü almaz; açık bir
kimlik doğrulama profili veya uzak uygulama sunucusunun kendi hesabını kullanın.

Bir abonelik profili Codex kullanım sınırına ulaşırsa OpenClaw, Codex bir
sıfırlama zamanı bildirdiğinde bunu kaydeder ve aynı Codex çalışması için
sıradaki kimlik doğrulama profilini dener. Sıfırlama zamanı geçtiğinde abonelik
profili, seçili `openai/gpt-*` modeli veya Codex çalışma zamanı
değiştirilmeden yeniden kullanılabilir hâle gelir.

Yerel Codex plugin'leri yapılandırıldığında OpenClaw, plugin'e ait uygulamaları
Codex iş parçacığına sunmadan önce bu plugin'leri bağlı uygulama sunucusu
üzerinden kurar veya yeniler. `app/list`, uygulama kimlikleri,
erişilebilirlik ve meta veriler için doğruluk kaynağı olmaya devam eder; ancak
iş parçacığı başına etkinleştirme kararının sahibi OpenClaw'dur: ilke,
listelenen erişilebilir bir uygulamaya izin veriyorsa `app/list` o
uygulamanın şu anda devre dışı olduğunu bildirse bile OpenClaw
`thread/start.config.apps[appId].enabled = true` gönderir. Bu yol, bilinmeyen kimlikler için uygulama
kurulumu oluşturmaz; OpenClaw yalnızca `plugin/install` içeren pazar yeri
plugin'lerini etkinleştirir ve ardından envanteri yeniler.

### Ortam yalıtımı

OpenClaw, yerel stdio uygulama sunucusu başlatmalarında `CODEX_HOME`
değerini aracı başına bir dizine ayarlar; böylece Codex yapılandırması,
kimlik doğrulama/hesap dosyaları, plugin önbelleği/verileri ve yerel iş parçacığı
durumu varsayılan olarak operatörün kişisel `~/.codex` konumunu
okumaz veya bu konuma yazmaz. OpenClaw normal işlem `HOME`
değerini korur; Codex çalışması alt işlemleri kullanıcı ana dizini
yapılandırmasını ve belirteçlerini bulmaya devam edebilir ve Codex, paylaşılan
`$HOME/.agents/skills` ve `$HOME/.agents/plugins/marketplace.json` girdilerini keşfedebilir.
`appServer.homeScope: "user"` kullanıldığında OpenClaw bunun yerine yerel kullanıcı Codex
ana dizinini ve mevcut hesabını, bir OpenClaw kimlik doğrulama profili
eklemeden kullanır.

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

`appServer.clearEnv` yalnızca başlatılan Codex uygulama sunucusu alt işlemini
etkiler. OpenClaw, yerel başlatma normalleştirmesi sırasında
`CODEX_HOME` ve `HOME` değerlerini bu listeden kaldırır:
`CODEX_HOME` seçili aracı veya kullanıcı kapsamını göstermeye devam
eder ve alt işlemlerin normal kullanıcı ana dizini durumunu kullanabilmesi
için `HOME` devralınmaya devam eder.

### Dinamik araçlar ve web araması

Codex dinamik araçları varsayılan olarak `searchable` yüklemesini
kullanır. OpenClaw normalde Codex'in yerel çalışma alanı işlemlerini yineleyen
dinamik araçları sunmaz: `read`, `write`,
`edit`, `apply_patch`, `exec`,
`process`, `update_plan`, `tool_call`,
`tool_describe`, `tool_search` ve `tool_search_code`. Mesajlaşma,
medya, cron, tarayıcı, node'lar, Gateway ve `heartbeat_respond` gibi kalan
OpenClaw entegrasyon araçlarının çoğu, ilk model bağlamını daha küçük tutmak
için `openclaw` ad alanı altındaki Codex araç araması üzerinden
kullanılabilir. Kısıtlı dönüş kabuk geri dönüşü; sonlu bir izin listesi yerel
Code Mode'u devre dışı bıraktığında `exec` ve
`process` için istisnadır; çalışma zamanı izin listeleri ve
`codexDynamicToolsExclude` yine geçerlidir.

OpenClaw `computer` aracı dâhil olmak üzere `catalogMode: "direct-only"`
olarak işaretlenen araçlar bunun yerine `openclaw_direct` ad alanını
kullanır. Codex bu ad alanını `DirectModelOnly` olarak değerlendirir; böylece
bu araçlar, iç içe Code Mode `tools.*` çağrılarından geçmek yerine
normal ve yalnızca kod modu iş parçacıklarında model tarafından doğrudan
görülebilir kalır.

Arama etkinleştirildiğinde ve yönetilen bir sağlayıcı seçilmediğinde web
araması varsayılan olarak Codex'in barındırılan `web_search` aracını
kullanır. Yönetilen aramanın yerel etki alanı kısıtlamalarını aşamaması için
yerel barındırılan arama ile OpenClaw'un yönetilen `web_search` dinamik
aracı birbirini dışlar. OpenClaw; barındırılan arama kullanılamadığında, açıkça
devre dışı bırakıldığında veya seçili bir yönetilen sağlayıcıyla
değiştirildiğinde yönetilen aracı kullanır. OpenClaw, üretim uygulama sunucusu
trafiği kullanıcı tanımlı `web` ad alanını reddettiği için
Codex'in bağımsız `web.run` uzantısını devre dışı tutar.
`tools.web.search.enabled: false`, araçların devre dışı olduğu yalnızca LLM çalışmalarında
olduğu gibi her iki yolu da devre dışı bırakır. Codex, `"cached"`
değerini bir tercih olarak değerlendirir ve bunu kısıtlanmamış uygulama
sunucusu dönüşleri için canlı harici erişime çözümler. İzin listesinin
aşılamaması için yerel `allowedDomains` ayarlandığında otomatik yönetilen
geri dönüş kapalı şekilde başarısız olur. Kalıcı etkin arama ilkesi
değişiklikleri, sonraki dönüşten önce bağlı Codex iş parçacığını değiştirir;
dönüş başına geçici kısıtlamalar ise geçici bir kısıtlı iş parçacığı kullanır
ve daha sonra sürdürmek üzere mevcut bağlamayı korur.

`sessions_yield` ve yalnızca mesaj aracı kaynaklı yanıtlar, bunlar dönüş
denetimi sözleşmeleri olduğu için doğrudan kalır. `sessions_spawn`
aranabilir kalır; böylece Codex'in yerel `spawn_agent` özelliği birincil
Codex alt aracı yüzeyi olmaya devam ederken açık OpenClaw veya ACP
yetkilendirmesi `openclaw` dinamik araç ad alanı üzerinden yine
kullanılabilir. Heartbeat iş birliği talimatları, araç henüz yüklenmemişse
Codex'e bir heartbeat dönüşünü sonlandırmadan önce `heartbeat_respond`
aramasını söyler.

`codexDynamicToolsLoading: "direct"` değerini yalnızca ertelenmiş dinamik araçlarda arama
yapamayan özel bir Codex uygulama sunucusuna bağlanırken veya tam araç yükünde
hata ayıklarken ayarlayın.

### Yapılandırma alanları

Desteklenen üst düzey Codex plugin alanları:

| Alan                       | Varsayılan     | Anlamı                                                                                   |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | OpenClaw dinamik araçlarını doğrudan ilk Codex araç bağlamına koymak için `"direct"` kullanın. |
| `codexDynamicToolsExclude` | `[]`           | Codex uygulama sunucusu dönüşlerinde atlanacak ek OpenClaw dinamik araç adları.           |
| `codexPlugins`             | devre dışı     | Taşınmış, kaynaktan kurulmuş seçkili plugin'ler için yerel Codex plugin/uygulama desteği. |
| `sessionCatalog`           | etkin          | Bu Gateway ve uygun eşleştirilmiş node'larda yerel Codex oturumları için kenar çubuğu keşfi. |
| `supervision`              | devre dışı     | Aracıya yönelik yerel oturum transkripti ve yazma denetimi ilkesi.                        |

Desteklenen `appServer` alanları:

| Alan                                         | Varsayılan                                                | Anlamı                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` Codex'i başlatır; açıkça belirtilen `"unix"` yerel denetim soketine bağlanır; `"websocket"`, `url` hedefine bağlanır.                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"`, sıradan donanım durumu verilerini OpenClaw aracısına göre yalıtır. `"user"`, yerel `$CODEX_HOME` veya `~/.codex` öğesini paylaşan, yerel kimlik doğrulamayı kullanan ve yalnızca sahibin iş parçacığı yönetimine izin veren açık bir katılım seçeneğidir. Kullanıcı kapsamı, yerel standart G/Ç veya Unix aktarımını destekler. Ayrı gözetim bağlantısında ayarlanmamış bir değer, standart G/Ç ya da Unix için `"user"`, WebSocket için `"agent"` olarak çözümlenir.     |
| `command`                                     | yönetilen Codex ikili dosyası                                   | Standart G/Ç aktarımının yürütülebilir dosyası. Yönetilen ikili dosyayı kullanmak için ayarlamadan bırakın; yalnızca açıkça geçersiz kılmak için ayarlayın.                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Standart G/Ç aktarımının bağımsız değişkenleri.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | ayarlanmamış                                                  | WebSocket Uygulama Sunucusu URL'si veya `unix://` URL'si. Açıkça belirtilen boş bir Unix yolu, standart kullanıcı ana dizini denetim soketini seçer.                                                                                                                                                                                                                                                                          |
| `authToken`                                   | ayarlanmamış                                                  | WebSocket aktarımının taşıyıcı belirteci. Değişmez bir dizeyi veya `${CODEX_APP_SERVER_TOKEN}` gibi bir SecretInput değerini kabul eder.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Ek WebSocket üstbilgileri. Üstbilgi değerleri, değişmez dizeleri veya örneğin `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"` gibi SecretInput değerlerini kabul eder.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw devralınan ortamını oluşturduktan sonra başlatılan standart G/Ç uygulama sunucusu işleminden kaldırılan ek ortam değişkeni adları. OpenClaw, yerel başlatmalar için seçilen `CODEX_HOME` ve devralınan `HOME` öğelerini korur.                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | Codex'in yalnızca kod moduna özgü araç yüzeyine katılın. Sıradan OpenClaw dinamik araçları iç içe `tools.*` çağrıları üzerinden kullanılabilir durumda kalır; `openclaw_direct` araçları doğrudan modele görünür kalır.                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | ayarlanmamış                                                  | Uzak Codex uygulama sunucusunun çalışma alanı kökü. Ayarlandığında OpenClaw, çözümlenen OpenClaw çalışma alanından yerel çalışma alanı kökünü çıkarır, bu uzak kök altında geçerli cwd son ekini korur ve Codex'e yalnızca nihai uygulama sunucusu cwd değerini gönderir. cwd, çözümlenen OpenClaw çalışma alanı kökünün dışındaysa OpenClaw, uzak uygulama sunucusuna Gateway'e yerel bir yol göndermek yerine kapalı biçimde başarısız olur. |
| `requestTimeoutMs`                            | `60000`                                                | Uygulama sunucusu denetim düzlemi çağrılarının zaman aşımı.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | OpenClaw `turn/completed` beklerken, Codex'in bir turu kabul etmesinden veya tur kapsamındaki bir uygulama sunucusu isteğinden sonraki sessiz süre.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw `turn/completed` beklerken bir araç devrinden, yerel araç tamamlanmasından, araç sonrası ham asistan ilerlemesinden, ham akıl yürütme tamamlanmasından veya akıl yürütme ilerlemesinden sonra kullanılan tamamlanma-boşta kalma ve ilerleme koruması. Araç sonrası sentezin nihai asistan yayın bütçesinden meşru olarak daha uzun süre sessiz kalabildiği güvenilir veya ağır iş yüklerinde bunu kullanın.                                |
| `mode`                                        | yerel Codex gereksinimleri YOLO'ya izin vermediği sürece `"yolo"` | YOLO veya koruyucu tarafından incelenen yürütme için ön ayar. `danger-full-access`, `never` onayı veya `user` inceleyicisini içermeyen yerel standart G/Ç gereksinimleri, örtük varsayılanı koruyucu yapar.                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` veya izin verilen bir koruyucu onay ilkesi       | İş parçacığını başlatma/sürdürme/tur işlemlerine gönderilen yerel Codex onay ilkesi. Koruyucu varsayılanları, izin verildiğinde `"on-request"` seçeneğini tercih eder.                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` veya izin verilen bir koruyucu korumalı alanı  | İş parçacığını başlatma/sürdürme işlemlerine gönderilen yerel Codex korumalı alan modu. Koruyucu varsayılanları, izin verildiğinde `"workspace-write"`, aksi takdirde `"read-only"` seçeneğini tercih eder. Bir OpenClaw korumalı alanı etkin olduğunda `danger-full-access` turları, OpenClaw korumalı alanının çıkış ayarından türetilen ağ erişimiyle Codex `workspace-write` kullanır.                                                                                     |
| `approvalsReviewer`                           | `"user"` veya izin verilen bir koruyucu inceleyici               | İzin verildiğinde Codex'in yerel onay istemlerini incelemesini sağlamak için `"auto_review"`, aksi takdirde `guardian_subagent` veya `user` kullanın. `guardian_subagent` eski bir takma ad olarak kalır.                                                                                                                                                                                                                              |
| `serviceTier`                                 | ayarlanmamış                                                  | İsteğe bağlı Codex uygulama sunucusu hizmet katmanı. `"priority"` hızlı mod yönlendirmesini etkinleştirir, `"flex"` esnek işlemeyi talep eder, `null` geçersiz kılmayı temizler ve eski `"fast"`, `"priority"` olarak kabul edilir.                                                                                                                                                                                                 |
| `networkProxy`                                | devre dışı                                               | Uygulama sunucusu komutları için Codex izin profili ağ özelliğine katılın. OpenClaw, seçilen `permissions.<profile>.network` yapılandırmasını tanımlar ve `sandbox` göndermek yerine `default_permissions` ile seçer.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Yerel Codex yürütmesinin etkin OpenClaw korumalı alanı içinde çalışabilmesi için desteklenen Codex uygulama sunucusuna OpenClaw korumalı alanı destekli bir Codex ortamı kaydeden önizleme katılım seçeneği.                                                                                                                                                                                                            |

`appServer.networkProxy`, Codex korumalı alan
sözleşmesini değiştirdiği için açıkça belirtilir. Etkinleştirildiğinde OpenClaw, oluşturulan
izin profilinin Codex tarafından yönetilen ağ özelliğini başlatabilmesi için Codex iş parçacığı yapılandırmasında
`features.network_proxy.enabled` ve `default_permissions` değerlerini de ayarlar. Varsayılan olarak OpenClaw,
profil gövdesinden çakışmaya dayanıklı bir `openclaw-network-<fingerprint>` profil
adı oluşturur; yalnızca kararlı bir yerel ad gerektiğinde `profileName` kullanın.

```json5
{
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
}
```

Normal app-server çalışma zamanı `danger-full-access` olacaksa,
`networkProxy` seçeneğini etkinleştirmek, oluşturulan izin profili için
çalışma alanı tarzı dosya sistemi erişimini kullanır: Codex tarafından yönetilen
ağ uygulaması korumalı alan ağı olduğundan, tam erişimli bir profil giden trafiği
korumaz. Etki alanı girdileri `allow` veya `deny`;
Unix soketi girdileri ise Codex'in `allow` veya `none`
değerlerini kullanır.

### Dinamik araç çağrısı zaman aşımları

OpenClaw'a ait dinamik araç çağrıları `appServer.requestTimeoutMs` değerinden bağımsız
olarak sınırlandırılır: Codex `item/tool/call` istekleri varsayılan olarak
90 saniyelik bir OpenClaw gözetim zamanlayıcısı kullanır. Çağrı başına pozitif
bir `timeoutMs` bağımsız değişkeni, 600000 ms ile sınırlı olmak üzere
söz konusu aracın bütçesini uzatır veya kısaltır. `image_generate` aracı,
araç çağrısı kendi zaman aşımını sağlamadığında `agents.defaults.imageGenerationModel.timeoutMs` değerini;
aksi hâlde görüntü oluşturma için varsayılan 120 saniyeyi kullanır. Medya
anlama aracı `image`, `tools.media.image.timeoutSeconds` değerini veya medya için
varsayılan 60 saniyeyi kullanır; görüntü anlamada bu zaman aşımı isteğin kendisi
için geçerlidir ve önceki hazırlık çalışmaları nedeniyle azaltılmaz. Zaman aşımı
durumunda OpenClaw, desteklendiği yerlerde araç sinyalini iptal eder ve oturumu
`processing` durumunda bırakmak yerine turun devam edebilmesi için Codex'e
başarısız bir dinamik araç yanıtı döndürür. Bu gözetim zamanlayıcısı, dış dinamik
`item/tool/call` bütçesidir; sağlayıcıya özgü istek zaman aşımları bu çağrının
içinde çalışır ve kendi zaman aşımı anlamlarını korur.

Codex bir turu kabul ettikten ve OpenClaw tur kapsamlı bir app-server isteğine
yanıt verdikten sonra donanım, Codex'in geçerli turda ilerleme kaydetmesini ve
sonunda yerel turu `turn/completed` ile tamamlamasını bekler. app-server
`appServer.turnCompletionIdleTimeoutMs` boyunca sessiz kalırsa OpenClaw, Codex turunu elinden
geldiğince keser, tanılama amaçlı bir zaman aşımı kaydeder ve takip eden sohbet
mesajlarının eski bir yerel turun arkasında kuyruğa alınmaması için OpenClaw
oturum hattını serbest bırakır. Aynı turdaki terminal olmayan bildirimlerin çoğu,
Codex turun hâlâ etkin olduğunu kanıtladığı için bu kısa gözetim zamanlayıcısını
devre dışı bırakır.

Araç devirleri daha uzun bir araç sonrası boşta kalma bütçesi kullanır: OpenClaw
bir `item/tool/call` yanıtı döndürdükten, `commandExecution` gibi yerel araç
öğeleri tamamlandıktan, ham `custom_tool_call_output` tamamlamalarından ve araç sonrası
ham asistan ilerlemesi, ham akıl yürütme tamamlamaları veya akıl yürütme
ilerlemesinden sonra. Koruma, yapılandırılmışsa `appServer.postToolRawAssistantCompletionIdleTimeoutMs` değerini
kullanır; aksi hâlde varsayılan olarak beş dakika kullanır. Aynı bütçe, Codex'in
bir sonraki geçerli tur olayını yayımlamasından önceki sessiz sentez penceresi
için ilerleme gözetim zamanlayıcısını da uzatır. Hız sınırı güncellemeleri gibi
genel app-server bildirimleri, tur boşta kalma ilerlemesini sıfırlamaz. Akıl
yürütme tamamlamalarını, açıklama `agentMessage` tamamlamalarını ve araç
öncesi ham akıl yürütme veya asistan ilerlemesini otomatik bir nihai yanıt
izleyebileceğinden bunlar oturum hattını hemen serbest bırakmak yerine ilerleme
sonrası yanıt korumasını kullanır.

Yalnızca tamamlanmış nihai/açıklama dışı `agentMessage` öğeleri ve araç
öncesi ham asistan tamamlamaları asistan çıktısı serbest bırakma mekanizmasını
devreye alır: Codex daha sonra `turn/completed` olmadan sessiz kalırsa
OpenClaw, yerel turu elinden geldiğince keser ve oturum hattını serbest bırakır.
Başka bir tur gözetimi bu serbest bırakma yarışını kazanırsa OpenClaw; etkin
yerel istek, öğe veya dinamik araç tamamlaması kalmadığında, asistan çıktısı
serbest bırakma mekanizması hâlâ en son tamamlanan öğeye ait olduğunda ve daha
sonraki bir öğe tamamlanmadığında tamamlanmış nihai asistan öğesini yine kabul
eder. Bu, turu yeniden oynatmadan tamamlanmış araç çalışmasından sonraki nihai
yanıtı koruyabilir. Kısmi asistan deltaları, önceki eski yanıtlar ve sonraki boş
tamamlamalar uygun değildir.

Asistan, araç, etkin öğe veya yan etki kanıtı bulunmayan tur tamamlama boşta
kalma zaman aşımları dâhil olmak üzere yeniden oynatılması güvenli stdio
app-server hataları, yeni bir app-server denemesinde bir kez yeniden denenir.
Güvenli olmayan zaman aşımları yine takılı kalan app-server istemcisini kullanımdan
kaldırır ve OpenClaw oturum hattını serbest bırakır; ayrıca otomatik olarak
yeniden oynatmak yerine eski yerel iş parçacığı bağlamasını temizler. Tamamlama
gözetimi zaman aşımları Codex'e özgü zaman aşımı metni gösterir: yeniden
oynatılması güvenli durumlar yanıtın eksik olabileceğini belirtirken güvenli
olmayan durumlar kullanıcıya yeniden denemeden önce mevcut durumu doğrulamasını
söyler. Genel zaman aşımı tanılamaları; son app-server bildirim yöntemi, ham
asistan yanıt öğesinin kimliği/türü/rolü, etkin istek/öğe sayıları ve devredeki
gözetim durumu gibi yapısal alanları içerir. Son bildirim ham bir asistan yanıt
öğesiyse sınırlı bir asistan metni önizlemesi de içerir. Ham istem veya araç
içeriğini içermez.

### Yerel test ortamı geçersiz kılmaları

- `OPENCLAW_CODEX_APP_SERVER_BIN`, `appServer.command` ayarlanmamışsa
  yönetilen ikili dosyayı atlar.
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırıldı. Bunun yerine `plugins.entries.codex.config.appServer.mode: "guardian"` veya tek
seferlik yerel testler için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın. Yapılandırma, Plugin
davranışını Codex donanım kurulumunun geri kalanıyla aynı incelenmiş dosyada
tuttuğundan tekrarlanabilir dağıtımlar için tercih edilir.

## Yerel Codex Plugin'leri

Yerel Codex Plugin desteği, OpenClaw donanım turuyla aynı Codex iş parçacığında
Codex app-server'ın kendi uygulama ve Plugin yeteneklerini kullanır. OpenClaw,
Codex Plugin'lerini yapay `codex_plugin_*` OpenClaw dinamik araçlarına
dönüştürmez.

`codexPlugins` yalnızca yerel Codex donanımını seçen oturumları etkiler.
Yerleşik donanım çalıştırmaları, normal OpenAI sağlayıcı çalıştırmaları, ACP
konuşma bağlamaları veya diğer donanımlar üzerinde etkisi yoktur.

Taşınmış asgari yapılandırma:

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

İş parçacığı uygulama yapılandırması, OpenClaw bir Codex donanım oturumu
oluşturduğunda veya eski bir Codex iş parçacığı bağlamasını değiştirdiğinde
hesaplanır; her turda yeniden hesaplanmaz. `codexPlugins` değiştirildikten
sonra gelecekteki Codex donanım oturumlarının güncellenmiş uygulama kümesiyle
başlaması için `/new`, `/reset` kullanın veya Gateway'i
yeniden başlatın.

Taşıma uygunluğu, uygulama envanteri, yıkıcı eylem politikası, bilgi istemleri
ve yerel Plugin tanılamaları için
[Yerel Codex Plugin'leri](/tr/plugins/codex-native-plugins) bölümüne bakın.

OpenAI tarafındaki uygulama ve Plugin erişimi, oturum açılmış Codex hesabı ve
Business ile Enterprise/Edu çalışma alanlarında çalışma alanı uygulama
denetimleri tarafından kontrol edilir. OpenAI'ın hesap ve çalışma alanı denetimi
genel bakışı için
[Codex'i ChatGPT planınızla kullanma](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
bölümüne bakın.

## Bilgisayar Kullanımı

Bilgisayar Kullanımı için ayrı bir kurulum kılavuzu vardır:
[Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use).

Kısaca: OpenClaw, masaüstü denetim uygulamasını paketlemez veya masaüstü
eylemlerini kendisi yürütmez. Codex app-server'ı hazırlar, `computer-use`
MCP sunucusunun kullanılabilir olduğunu doğrular ve ardından Codex modu
turlarında yerel MCP araç çağrılarının denetimini Codex'e bırakır.

## Çalışma zamanı sınırları

Codex donanımı yalnızca düşük seviyeli gömülü aracı yürütücüsünü değiştirir.

- OpenClaw dinamik araçları desteklenir. Codex bu araçları
  yürütmesini OpenClaw'dan ister; dolayısıyla OpenClaw yürütme yolunda kalır.
- Codex'e özgü kabuk, yama, MCP ve yerel uygulama araçları
  Codex'e aittir. OpenClaw, desteklenen aktarım üzerinden seçili yerel olayları
  gözlemleyebilir veya engelleyebilir ancak yerel araç bağımsız değişkenlerini
  yeniden yazmaz.
- Yerel Compaction Codex'e aittir. OpenClaw; kanal geçmişi,
  arama, `/new`, `/reset` ve gelecekteki model veya
  donanım geçişleri için bir transkript yansısı tutar ancak Codex Compaction'ını
  bir OpenClaw veya bağlam motoru özetleyicisiyle değiştirmez.
- Medya oluşturma, medya anlama, TTS, onaylar ve mesajlaşma
  aracı çıktısı, eşleşen OpenClaw sağlayıcı/model ayarları üzerinden devam eder.
- `tool_result_persist`, Codex'e özgü araç sonucu kayıtlarına
  değil, OpenClaw'a ait transkript araç sonuçlarına uygulanır.

Kanca katmanları, desteklenen V1 yüzeyleri, yerel izin işleme, kuyruk
yönlendirme, Codex geri bildirim yükleme mekanizmaları ve Compaction ayrıntıları
için [Codex donanım çalışma zamanı](/tr/plugins/codex-harness-runtime) bölümüne
bakın.

## Sorun giderme

**Codex normal bir `/model` sağlayıcısı olarak görünmüyor:** yeni
yapılandırmalar için bu beklenen bir durumdur. Bir `openai/gpt-*` modeli
seçin, `plugins.entries.codex.enabled` seçeneğini etkinleştirin ve `plugins.allow`
değerinin `codex` değerini hariç tutup tutmadığını kontrol edin.

**OpenClaw, Codex yerine yerleşik donanımı kullanıyor:** etkin rotanın tam olarak
resmî bir HTTPS Platform Responses veya ChatGPT Responses rotası olduğunu,
yazılmış bir istek geçersiz kılması içermediğini ve Codex Plugin'inin kurulup
etkinleştirildiğini doğrulayın. Yalnızca `openai/gpt-*` ön eki yeterli
değildir. Test sırasında kesin kanıt için sağlayıcı veya model
`agentRuntime.id: "codex"` değerini ayarlayın; zorunlu Codex, rota veya donanım uyumsuz
olduğunda geri dönüş yapmak yerine başarısız olur.

**OpenAI Codex çalışma zamanı API anahtarı yoluna geri dönüyor:** modeli, çalışma
zamanını, seçilen sağlayıcıyı ve hatayı gösteren, hassas verileri çıkarılmış bir
Gateway alıntısı toplayın. Etkilenen iş arkadaşlarından OpenClaw ana
bilgisayarlarında bu salt okunur komutu çalıştırmalarını isteyin:

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

Yararlı alıntılar genellikle `openai/gpt-5.6-sol` veya `openai/gpt-5.6-luna`,
`Runtime: OpenAI Codex`, `agentRuntime.id` veya `harnessRuntime`,
`candidateProvider: "openai"` ve bir `401`, `Incorrect API key` veya
`No API key` sonucu içerir. Düzeltilmiş bir çalıştırma, düz OpenAI API
anahtarı hatası yerine OpenAI OAuth yolunu göstermelidir.

**Eski Codex model başvuruları yapılandırmada kalıyor:** `openclaw doctor --fix`
komutunu çalıştırın. Doctor, eski model başvurularını `openai/*` olarak
yeniden yazar, eski oturum ve tüm aracı kapsayan çalışma zamanı sabitlemelerini
kaldırır ve mevcut kimlik doğrulama profili geçersiz kılmalarını korur.

**app-server reddediliyor:** Codex app-server `0.143.0` veya daha yeni
bir sürüm kullanın. `0.143.0-alpha.2` veya `0.143.0+custom` gibi aynı sürümün
ön sürümleri ya da derleme son eki içeren sürümleri reddedilir; çünkü OpenClaw,
kararlı `0.143.0` protokol alt sınırını test eder.

**`/codex status` bağlanamıyor:** `codex` plugininin
etkinleştirildiğini, bir izin listesi yapılandırılmışsa `plugins.allow` öğesinin
bu plugini içerdiğini ve tüm özel `appServer.command`, `url`, `authToken` veya
üst bilgilerin geçerli olduğunu denetleyin.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs` değerini düşürün
veya keşfi devre dışı bırakın.
Bkz. [Codex harness başvurusu](/tr/plugins/codex-harness-reference#model-discovery).

**WebSocket aktarımı hemen başarısız oluyor:** `appServer.url`,
`authToken` ve üst bilgileri denetleyin; ayrıca uzaktaki app-server'ın aynı Codex
app-server protokol sürümünü kullandığından emin olun.

**Yerel kabuk veya yama araçları `Native hook relay
unavailable` ile engelleniyor:** Codex iş parçacığı, OpenClaw'un artık kayıtlı
tutmadığı bir yerel hook aktarım kimliğini kullanmaya çalışmaya devam ediyor.
Bu, bir ACP arka ucu, sağlayıcı, GitHub veya kabuk komutu
hatası değil, yerel bir Codex hook aktarımı sorunudur. Etkilenen sohbette `/new` veya `/reset` ile
yeni bir oturum başlatın, ardından zararsız bir komutu yeniden deneyin. Bu bir kez çalışır ancak sonraki yerel araç
çağrısı yine başarısız olursa `/new` seçeneğini yalnızca geçici bir çözüm olarak değerlendirin: eski iş parçacıklarının
kaldırılması ve yerel hook kayıtlarının
yeniden oluşturulması için Codex app-server'ı veya OpenClaw Gateway'i yeniden başlattıktan sonra istemi
yeni bir oturuma kopyalayın.

**Codex araç çağrıları çok fazla kısa ömürlü hook işlemi oluşturuyor:** `plugins.entries.codex.config.appServer.loopDetectionPreToolUseRelay: false`
değerini ayarlayın
ve gateway'i yeniden başlatın. Bu, yalnızca OpenClaw döngü algılama için kullanılan Codex `PreToolUse` alt işlemini
ve onun ilke yok işaretçisini devre dışı bırakır. Gerekli
`before_tool_call` ve güvenilir araç ilkesi aktarımları etkin kalır.

**Codex olmayan bir model yerleşik harness'ı kullanıyor:** sağlayıcı
veya model çalışma zamanı ilkesi onu başka bir harness'a yönlendirmediği sürece bu beklenen bir durumdur. Sade, OpenAI dışı
sağlayıcı başvuruları `auto` modunda normal sağlayıcı yollarında kalır.

**Computer Use yüklü ancak araçlar çalışmıyor:** yeni bir oturumdan
`/codex computer-use status` öğesini denetleyin. Bir araç
`Native hook relay unavailable` bildirirse yukarıdaki yerel hook aktarımı kurtarma adımlarını uygulayın.
Bkz. [Codex Computer Use](/tr/plugins/codex-computer-use#troubleshooting).

## İlgili

- [Codex harness başvurusu](/tr/plugins/codex-harness-reference)
- [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [Codex gözetimi](/plugins/codex-supervision)
- [Yerel Codex pluginleri](/tr/plugins/codex-native-plugins)
- [Codex Computer Use](/tr/plugins/codex-computer-use)
- [Ajan çalışma zamanları](/tr/concepts/agent-runtimes)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [OpenAI Codex yardımı](https://help.openai.com/en/collections/14937394-codex)
- [Ajan harness pluginleri](/tr/plugins/sdk-agent-harness)
- [Plugin hook'ları](/tr/plugins/hooks)
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics)
- [Durum](/tr/cli/status)
- [Test](/tr/help/testing-live#live-codex-app-server-harness-smoke)
