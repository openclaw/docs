---
read_when:
    - Model yedek davranışını veya seçim kullanıcı deneyimini değiştirme
    - “model is not allowed” hatasının veya güncelliğini yitirmiş varsayılan sağlayıcıya geri dönüşün hata ayıklaması
    - models.json birleştirme/gizli bilgi davranışı üzerinde çalışma
sidebarTitle: Models CLI
summary: OpenClaw'un sağlayıcı/model referanslarını, yapılandırma anahtarlarını ve `/model` sohbet komutunu nasıl çözümlediği
title: Modeller CLI'si
x-i18n:
    generated_at: "2026-07-16T16:55:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 20a5e4861bdafa1f5ff549fc54968051b653611f1ef05e836df855638a7aa967
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Model yük devretme" href="/tr/concepts/model-failover">
    Kimlik doğrulama profili rotasyonu, bekleme süreleri ve bunların geri dönüşlerle etkileşimi.
  </Card>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers">
    Hızlı sağlayıcı genel bakışı ve örnekler.
  </Card>
  <Card title="Models CLI başvurusu" href="/tr/cli/models">
    Eksiksiz `openclaw models` komut ve bayrak başvurusu.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/config-agents#agent-defaults">
    Model yapılandırma anahtarları, varsayılanlar ve örnekler.
  </Card>
</CardGroup>

Bir model başvurusu (`provider/model`), düşük seviyeli agent çalışma zamanını değil, bir sağlayıcı ve model seçer. Çalışma zamanı ilkesi ayarlanmamışken veya `auto` olduğunda, OpenAI'ın sağlayıcıya ait yönlendirme ilkesi, yalnızca yazılmış bir istek geçersiz kılması bulunmayan, tam ve resmî bir HTTPS Platform Responses ya da ChatGPT Responses rotası için Codex'i seçebilir; yalnızca `openai/*` öneki Codex'i hiçbir zaman seçmez. Completions bağdaştırıcıları, özel uç noktalar ve yazılmış istek davranışı OpenClaw üzerinde kalır. Düz metinli resmî HTTP uç noktaları reddedilir. Bkz. [OpenAI örtük agent çalışma zamanı](/tr/providers/openai#implicit-agent-runtime).

Abonelik Copilot başvuruları (`github-copilot/*`) haricî GitHub Copilot agent çalışma zamanı plugin'ini kullanacak şekilde etkinleştirilebilir, ancak bu yol her zaman açıktır (`auto` tarafından hiçbir zaman seçilmez). Çalışma zamanı geçersiz kılmaları agent veya oturumun tamamına değil, sağlayıcı/model ilkesine ait olmalıdır. Çalışma zamanı seçimi faturalandırmayı belirlemez: OpenAI API anahtarı ile ChatGPT/Codex abonelik kimlik bilgileri ayrı kalır. Bkz. [Agent çalışma zamanları](/tr/concepts/agent-runtimes) ve [GitHub Copilot agent çalışma zamanı](/tr/plugins/copilot).

## Seçim sırası

<Steps>
  <Step title="Birincil model">
    `agents.defaults.model.primary` (veya düz dize olarak `agents.defaults.model`).
  </Step>
  <Step title="Geri dönüşler">
    `agents.defaults.model.fallbacks`, sırayla denenir.
  </Step>
  <Step title="Kimlik doğrulama yük devretmesi">
    OpenClaw bir sonraki geri dönüş modeline geçmeden önce sağlayıcı içinde kimlik doğrulama profili rotasyonu gerçekleşir.
  </Step>
</Steps>

İlgili model yapılandırma yüzeyleri:

- `agents.defaults.models`, OpenClaw'un kullanabileceği modellerin izin listesi/kataloğudur ve takma adları da içerir. Her birini ayrı ayrı listelemeden bir sağlayıcıdan keşfedilen tüm modellere izin vermek için `provider/*` girdilerini kullanın.
- `agents.defaults.utilityModel`; oluşturulan pano oturumu başlıkları, desteklenen kanal ileti dizisi/konu başlıkları ve ilerleme anlatımı gibi kısa dâhilî görevler için isteğe bağlı, daha düşük maliyetli bir modeldir. Agent başına `agents.list[].utilityModel` bunu geçersiz kılar. Ayarlanmadığında OpenClaw, varsa birincil sağlayıcının bildirdiği küçük model varsayılanını (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`), aksi hâlde agent'ın birincil modelini kullanır; yardımcı yönlendirmeyi devre dışı bırakmak için bunu boş bir dizeye ayarlayın. Yardımcı görevler ayrı model çağrılarıdır ve seçilen model sağlayıcısına sınırlandırılmış görev içeriği gönderebilir.
- `agents.defaults.imageModel` yalnızca birincil model görüntüleri kabul edemediğinde kullanılır.
- `agents.defaults.pdfModel`, `pdf` aracı tarafından kullanılır. Ayarlanmadığında araç önce `imageModel` değerine, ardından çözümlenen oturum/varsayılan modele geri döner.
- `agents.defaults.imageGenerationModel`, `musicGenerationModel` ve `videoGenerationModel`, paylaşılan medya oluşturma araçlarını destekler. Ayarlanmadığında her araç, kimlik doğrulama destekli bir sağlayıcı varsayılanı çıkarır: önce geçerli varsayılan sağlayıcı, ardından bu yetenek için kayıtlı kalan sağlayıcılar sağlayıcı kimliği sırasıyla kullanılır. Açık geri dönüşleri korurken sağlayıcılar arası bu çıkarımı devre dışı bırakmak için `agents.defaults.mediaGenerationAutoProviderFallback: false` değerini ayarlayın.
- Agent başına `agents.list[].model` (bağlamalarla birlikte), `agents.defaults.model` değerini geçersiz kılar — bkz. [Çok agent'lı yönlendirme](/tr/concepts/multi-agent).

Eksiksiz anahtar başvurusu, varsayılanlar ve JSON5 örnekleri: [Yapılandırma başvurusu](/tr/gateway/config-agents#agent-defaults).

## Seçim kaynağı ve geri dönüş katılığı

Aynı `provider/model`, geldiği yere bağlı olarak farklı davranır:

| Kaynak                                                                  | Davranış                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yapılandırılmış varsayılan (`agents.defaults.model.primary`, agent başına birincil) | Normal başlangıç noktası; `agents.defaults.model.fallbacks` kullanır.                                                                                                                                                                                                 |
| Otomatik geri dönüş                                                           | `modelOverrideSource: "auto"` olarak saklanan geçici kurtarma durumu. OpenClaw, özgün birincili düzenli aralıklarla yeniden yoklar, kurtarma gerçekleştiğinde otomatik seçimi temizler ve geri dönüş/kurtarma geçişlerini durum değişikliği başına bir kez duyurur.                              |
| Kullanıcı oturumu seçimi                                                  | Kesin ve katı. `/model`, model seçici, `session_status(model=...)` ve `sessions.patch`, `modelOverrideSource: "user"` değerini saklar. Bu sağlayıcı/model erişilemez hâle gelirse çalıştırma, yapılandırılmış başka bir modele geçmek yerine görünür biçimde başarısız olur. |
| Cron `--model` / yük `model`                                        | İş başına birincil. İş kendi yük `fallbacks` değerini sağlamadığı sürece yapılandırılmış geri dönüşleri kullanmaya devam eder (`fallbacks: []` katı bir çalıştırmayı zorunlu kılar).                                                                                                                    |

Diğer seçim kuralları:

- `agents.defaults.model.primary` değerinin değiştirilmesi mevcut oturum sabitlemelerini yeniden yazmaz. Durum `This session is pinned to X; config primary Y will apply to new/unpinned sessions.` bildiriyorsa sabitlemeyi temizlemek için `/model default` komutunu çalıştırın.
- CLI varsayılan model ve izin listesi seçicileri, tam yerleşik katalog yerine yalnızca `models.providers.*.models` değerini listeleyerek `models.mode: "replace"` değerine uyar.
- Control UI model seçicisi, yapılandırılmış model görünümünü Gateway'den ister: ayarlandığında `agents.defaults.models` (`provider/*` joker girdileri dâhil), aksi hâlde `models.providers.*.models` ve kullanılabilir kimlik doğrulaması bulunan sağlayıcılar. Tam yerleşik katalog, açık tarama görünümlerine ayrılmıştır (`models.list` ile `view: "all"` veya `openclaw models list --all`).
- Sağlayıcı envanteri kullanıcı arayüzleri, seçici izin listelerini uygulamadan kaynak tarafından yazılmış `models.providers.*.models` satırlarını göstermek için `view: "provider-config"` ile `models.list` kullanır.

Tüm işleyiş: [Model yük devretme](/tr/concepts/model-failover).

## Hızlı model ilkesi

- Birincil modelinizi erişiminiz olan en güçlü, en yeni nesil modele ayarlayın.
- Maliyet/gecikme duyarlı görevler ve daha düşük riskli sohbetler için geri dönüşleri kullanın.
- Araçların etkin olduğu agent'lar veya güvenilmeyen girdiler için eski/daha zayıf model katmanlarından kaçının.

## İlk katılım

```bash
openclaw onboard
```

OpenAI Codex abonelik OAuth'ı ve Anthropic (API anahtarı veya Claude CLI'ı yeniden kullanma) dâhil olmak üzere yaygın sağlayıcıların model ve kimlik doğrulamasını, yapılandırmayı elle düzenlemeyi gerektirmeden ayarlar.

Yapılandırılmış bir birincil model yoksa yeni OpenAI API anahtarı kurulumu `openai/gpt-5.6` değerini seçer; yalın doğrudan API kimliği Sol katmanına çözümlenir. Yeni ChatGPT/Codex OAuth kurulumu tam `openai/gpt-5.6-sol` katalog başvurusunu seçer. Yeniden kimlik doğrulama, `openai/gpt-5.5` dâhil olmak üzere mevcut açık birincil modeli korur. GPT-5.6 hesapta kullanılamıyorsa `openai/gpt-5.5` değerini açıkça seçin; OpenClaw bunu sessizce daha düşük bir sürüme indirmez.

## "Modele izin verilmiyor" (ve yanıtların neden durduğu)

`agents.defaults.models` ayarlanmışsa `/model` ve oturum geçersiz kılmaları için izin listesi olur. Bu izin listesinin dışındaki bir model seçildiğinde normal bir yanıt oluşturulmadan önce şunlar döndürülür:

```text
"provider/model" modeline izin verilmiyor. Sağlayıcıları listelemek için /models veya modelleri listelemek için /models <provider> kullanın.
Şununla ekleyin: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

Modeli `agents.defaults.models` değerine ekleyerek, izin listesini tamamen temizleyerek (anahtarı kaldırın) veya `/model list` içinden bir model seçerek düzeltin. Reddedilen komut `/model openai/gpt-5.5 --runtime codex` gibi bir çalışma zamanı geçersiz kılması içeriyorsa önce izin listesini düzeltin, ardından aynı `/model ... --runtime ...` komutunu yeniden deneyin.

Yerel/GGUF modellerinde izin listesi, örneğin `ollama/gemma4:26b` veya `lmstudio/Gemma4-26b-a4-it-gguf` gibi sağlayıcı önekli tam başvuruyu gerektirir — tam dize için `openclaw models list --provider <provider>` çıktısını kontrol edin. İzin listesi etkinleştirildikten sonra yalın dosya adları veya görünen adlar yeterli değildir.

Her modeli listelemeden sağlayıcıları sınırlamak için `provider/*` joker girdilerini kullanın:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

`/model`, `/models` ve model seçiciler bundan sonra yalnızca bu sağlayıcılar için keşfedilen kataloğu gösterir ve izin listesi düzenlenmeden yeni modeller görünebilir. Başka bir sağlayıcıdan belirli bir modeli dâhil etmek için tam `provider/model` girdilerini `provider/*` girdileriyle birlikte kullanın.

Takma adları içeren örnek izin listesi:

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
}
```

<Accordion title="CLI üzerinden güvenli izin listesi düzenlemeleri">
Eklemeli değişiklikler için `--merge` kullanın:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set`, mevcut girdileri kaldıracakları zaman `agents.defaults.models`, `models.providers` veya `models.providers.<id>.models` için düz nesne atamalarını reddeder; yalnızca yeni değerin eksiksiz hedef değer olması gerektiğinde `--replace` kullanın. Etkileşimli sağlayıcı kurulumu ve `openclaw configure --section model`, sağlayıcı kapsamlı seçimleri zaten izin listesiyle birleştirir; dolayısıyla bir sağlayıcı eklemek ilgisiz girdileri kaldırmaz ve yapılandırma mevcut bir `agents.defaults.model.primary` değerini korur. `openclaw models auth login --provider <id> --set-default` ve `openclaw models set <model>` gibi açık komutlar birincil modeli yine değiştirir.
</Accordion>

## Sohbette `/model`

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model default
/model status
```

- `/model` ve `/model list`, kompakt ve numaralı bir seçici (model ailesi + kullanılabilir sağlayıcılar) gösterir; `/model <#>` buradan seçim yapar. Discord'da bu, Gönder adımıyla birlikte sağlayıcı/model açılır listelerini açar; Telegram'da seçici seçimleri oturum kapsamındadır ve `openclaw.json` içindeki ajanın kalıcı varsayılanını hiçbir zaman yeniden yazmaz. `/models add` kullanımdan kaldırılmıştır ve sohbetten modelleri kaydetmek yerine bir ileti döndürür.
- `/model`, yeni oturum seçimini hemen kalıcılaştırır. Ajan boştaysa sonraki çalıştırma bunu hemen kullanır; bir çalıştırma zaten etkinse geçiş, sonraki temiz yeniden deneme noktası için (veya araç etkinliği ya da yanıt çıktısı zaten başladıysa daha sonraki bir nokta için) kuyruğa alınır.
- `/model default`, oturum seçimini temizleyerek yeniden yapılandırılmış birincil değeri devralmasını sağlar.
- Kullanıcı tarafından seçilen bir `/model` başvurusu, ilgili oturum için katıdır: erişilemez hâle gelirse yanıt, `agents.defaults.model.fallbacks` üzerinden sessizce yedeğe geçmek yerine görünür biçimde başarısız olur. Yapılandırılmış varsayılanlar ve Cron işi birincilleri yedek zincirlerini kullanmaya devam eder.
- `/model status` ayrıntılı görünümdür: sağlayıcı başına kimlik doğrulama adaylarını ve (yapılandırıldığında) sağlayıcı uç noktası `baseUrl` ile `api` modunu gösterir.
- Model başvuruları ilk `/` üzerinden bölünerek ayrıştırılır; `provider/model` yazın. Model kimliğinin kendisi `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini ekleyin; ör. `/model openrouter/moonshotai/kimi-k2`. Sağlayıcıyı atlarsanız OpenClaw şunları dener: (1) diğer ad eşleşmesi, (2) tam olarak bu öneksiz model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesi, (3) yapılandırılmış varsayılan sağlayıcı (kullanımdan kaldırılmış yedek davranış) — ayrıca bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa, kaldırılmış bir sağlayıcıya ait eski bir varsayılanın gösterilmesini önlemek için bunun yerine yapılandırılmış ilk sağlayıcı/model kullanılır.
- Model başvuruları küçük harfe dönüştürülerek normalleştirilir; sağlayıcı kimlikleri bunun dışında birebir eşleşir, bu nedenle plugin tarafından duyurulan kimliği kullanın.

Komut davranışının ve yapılandırmanın tamamı: [Eğik çizgi komutları](/tr/tools/slash-commands).

## CLI

```bash
openclaw models status
openclaw models list
openclaw models set <provider/model>
openclaw models set-image <provider/model>
openclaw models scan
openclaw models aliases list|add|remove
openclaw models fallbacks list|add|remove|clear
openclaw models image-fallbacks list|add|remove|clear
openclaw models auth list|add|login|paste-api-key|paste-token|setup-token|order
```

Alt komut olmadan `openclaw models`, `models status` için bir kısayoldur; bu komut ayrıca kimlik doğrulama deposu profillerinin OAuth süre sonunu gösterir (varsayılan olarak 24 saat içinde uyarır). Tüm bayraklar, JSON biçimleri ve kimlik doğrulama profili alt komutları: [Models CLI başvurusu](/tr/cli/models).

<AccordionGroup>
  <Accordion title="Tarama (ücretsiz OpenRouter modelleri)">
    `openclaw models scan`, OpenRouter'ın herkese açık ücretsiz model kataloğunu inceler ve adayların araç ve görüntü desteğini canlı olarak sınayabilir. Kataloğun kendisi herkese açık olduğundan yalnızca meta veri taramaları (`--no-probe`) anahtar gerektirmez; canlı sınama ile `--set-default`/`--set-image` bir OpenRouter API anahtarı (kimlik doğrulama profili veya `OPENROUTER_API_KEY`) gerektirir ve anahtar yoksa güvenli biçimde yalnızca meta veri çıktısına geçer.

    Sonuçlar şu sırayla derecelendirilir: görüntü desteği, ardından araç gecikmesi, bağlam boyutu ve parametre sayısı. Bir TTY'de sınanmış sonuçlar etkileşimli bir yedek seçimi istemi gösterir; etkileşimsiz modun varsayılanları kabul etmesi için `--yes` gerekir.

  </Accordion>
</AccordionGroup>

## Model kayıt defteri (`models.json`)

`models.providers` altında yapılandırılan özel sağlayıcılar, ajan dizini altındaki `models.json` dosyasına yazılır (varsayılan `~/.openclaw/agents/<agentId>/agent/models.json`). Sağlayıcı plugin katalogları, oluşturulmuş ve plugin'e ait katalog parçaları olarak ayrı depolanır ve otomatik yüklenir. Bu dosya varsayılan olarak yapılandırmayla birleştirilir; yalnızca yapılandırdığınız sağlayıcıları kullanmak için `models.mode: "replace"` ayarını yapın.

<AccordionGroup>
  <Accordion title="Birleştirme modu önceliği">
    Eşleşen sağlayıcı kimlikleri için:

    - Ajanın `models.json` dosyasında zaten bulunan, boş olmayan bir `baseUrl` önceliklidir.
    - `models.json` içindeki boş olmayan bir `apiKey`, yalnızca ilgili sağlayıcı mevcut yapılandırma/kimlik doğrulama profili bağlamında SecretRef tarafından yönetilmiyorsa önceliklidir.
    - SecretRef tarafından yönetilen `apiKey` değerleri, çözümlenmiş gizli değerleri kalıcılaştırmak yerine kaynak işaretçilerinden yenilenir: ortam başvuruları için ortam değişkeninin adı, dosya/exec başvuruları için `secretref-managed`.
    - SecretRef tarafından yönetilen üstbilgi değerleri de aynı şekilde, ortam başvuruları için `secretref-env:ENV_VAR_NAME` kullanılarak yenilenir.
    - `models.json` içindeki boş veya eksik `apiKey`/`baseUrl`, yapılandırmadaki `models.providers` değerine geri döner.
    - Diğer sağlayıcı alanları yapılandırmadan ve normalleştirilmiş katalog verilerinden yenilenir.

  </Accordion>
</AccordionGroup>

İşaretçilerin kalıcılaştırılmasında kaynak belirleyicidir: OpenClaw, `models.json` dosyasını yeniden oluşturduğunda — `openclaw agent` gibi komutla yürütülen yollar dâhil — çözümlenmiş çalışma zamanı gizli değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden (çözümleme öncesi) alınan işaretçileri yazar.

## İlgili

- [Ajan çalışma zamanları](/tr/concepts/agent-runtimes) — OpenClaw, Codex ve diğer ajan döngüsü çalışma zamanları
- [Yapılandırma başvurusu](/tr/gateway/config-agents#agent-defaults) — model yapılandırma anahtarları
- [Görüntü oluşturma](/tr/tools/image-generation) — görüntü modeli yapılandırması
- [Model yedeklemesi](/tr/concepts/model-failover) — yedek zincirleri
- [Model sağlayıcıları](/tr/concepts/model-providers) — sağlayıcı yönlendirmesi ve kimlik doğrulama
- [Models CLI başvurusu](/tr/cli/models) — tüm komut ve bayrakların başvurusu
- [Müzik oluşturma](/tr/tools/music-generation) — müzik modeli yapılandırması
- [Video oluşturma](/tr/tools/video-generation) — video modeli yapılandırması
