---
read_when:
    - models CLI'sini ekleme veya değiştirme (models list/set/scan/aliases/fallbacks)
    - Model geri dönüş davranışını veya seçim kullanıcı deneyimini değiştirme
    - Model tarama yoklamaları güncelleniyor (araçlar/görseller)
sidebarTitle: Models CLI
summary: 'Modeller CLI: listeleme, ayarlama, takma adlar, geri dönüşler, tarama, durum'
title: Modeller CLI
x-i18n:
    generated_at: "2026-05-10T19:33:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b4d473b9b437e213f8cd2b40cf0ae6000d8fb4a8fa3522813e14659cecc5450
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Model yük devri" href="/tr/concepts/model-failover">
    Auth profili rotasyonu, bekleme süreleri ve bunun yedeklerle nasıl etkileştiği.
  </Card>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers">
    Hızlı sağlayıcı özeti ve örnekler.
  </Card>
  <Card title="Aracı çalışma zamanları" href="/tr/concepts/agent-runtimes">
    PI, Codex ve diğer aracı döngüsü çalışma zamanları.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/config-agents#agent-defaults">
    Model yapılandırma anahtarları.
  </Card>
</CardGroup>

Model başvuruları bir sağlayıcı ve model seçer. Genellikle düşük düzeyli aracı çalışma zamanını seçmezler. OpenAI aracı başvuruları ana istisnadır: `openai/gpt-5.5`, resmi OpenAI sağlayıcısında varsayılan olarak Codex uygulama sunucusu çalışma zamanı üzerinden çalışır. Açık çalışma zamanı geçersiz kılmaları, tüm aracıya veya oturuma değil, sağlayıcı/model politikasına ait olmalıdır. Codex çalışma zamanı modunda, `openai/gpt-*` başvurusu API anahtarı faturalandırmasını ima etmez; auth bir Codex hesabından veya `openai-codex` auth profilinden gelebilir. Bkz. [Aracı çalışma zamanları](/tr/concepts/agent-runtimes).

## Model seçimi nasıl çalışır?

OpenClaw modelleri şu sırayla seçer:

<Steps>
  <Step title="Birincil model">
    `agents.defaults.model.primary` (veya `agents.defaults.model`).
  </Step>
  <Step title="Yedekler">
    `agents.defaults.model.fallbacks` (sırayla).
  </Step>
  <Step title="Sağlayıcı auth yük devri">
    Auth yük devri, bir sonraki modele geçilmeden önce sağlayıcının içinde gerçekleşir.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="İlgili model yüzeyleri">
    - `agents.defaults.models`, OpenClaw'ın kullanabileceği modellerin izin listesi/kataloğudur (takma adlarla birlikte). Sağlayıcı keşfini dinamik tutarken görünür sağlayıcıları sınırlamak için `provider/*` girdilerini kullanın.
    - `agents.defaults.imageModel` **yalnızca** birincil model görüntüleri kabul edemediğinde kullanılır.
    - `agents.defaults.pdfModel`, `pdf` aracı tarafından kullanılır. Atlanırsa araç önce `agents.defaults.imageModel` değerine, sonra çözümlenen oturum/varsayılan modele geri döner.
    - `agents.defaults.imageGenerationModel`, paylaşılan görüntü oluşturma yeteneği tarafından kullanılır. Atlanırsa `image_generate`, yine de auth destekli bir sağlayıcı varsayılanını çıkarımlayabilir. Önce geçerli varsayılan sağlayıcıyı, ardından kalan kayıtlı görüntü oluşturma sağlayıcılarını sağlayıcı kimliği sırasıyla dener. Belirli bir sağlayıcı/model ayarlarsanız, o sağlayıcının auth/API anahtarını da yapılandırın.
    - `agents.defaults.musicGenerationModel`, paylaşılan müzik oluşturma yeteneği tarafından kullanılır. Atlanırsa `music_generate`, yine de auth destekli bir sağlayıcı varsayılanını çıkarımlayabilir. Önce geçerli varsayılan sağlayıcıyı, ardından kalan kayıtlı müzik oluşturma sağlayıcılarını sağlayıcı kimliği sırasıyla dener. Belirli bir sağlayıcı/model ayarlarsanız, o sağlayıcının auth/API anahtarını da yapılandırın.
    - `agents.defaults.videoGenerationModel`, paylaşılan video oluşturma yeteneği tarafından kullanılır. Atlanırsa `video_generate`, yine de auth destekli bir sağlayıcı varsayılanını çıkarımlayabilir. Önce geçerli varsayılan sağlayıcıyı, ardından kalan kayıtlı video oluşturma sağlayıcılarını sağlayıcı kimliği sırasıyla dener. Belirli bir sağlayıcı/model ayarlarsanız, o sağlayıcının auth/API anahtarını da yapılandırın.
    - Aracı başına varsayılanlar, `agents.list[].model` artı bağlamalar üzerinden `agents.defaults.model` değerini geçersiz kılabilir (bkz. [Çok aracılı yönlendirme](/tr/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Seçim kaynağı ve yedek davranışı

Aynı `provider/model`, nereden geldiğine bağlı olarak farklı şeyler ifade edebilir:

- Yapılandırılmış varsayılanlar (`agents.defaults.model.primary` ve aracıya özgü birinciller) normal başlangıç noktasıdır ve `agents.defaults.model.fallbacks` kullanır.
- Otomatik yedek seçimleri geçici kurtarma durumudur. Daha sonraki turların önce bilinen bozuk bir birincili yoklamadan yedek zincirini kullanmayı sürdürebilmesi için `modelOverrideSource: "auto"` ile saklanırlar.
- Kullanıcı oturumu seçimleri kesindir. `/model`, model seçici, `session_status(model=...)` ve `sessions.patch`, `modelOverrideSource: "user"` saklar; seçilen sağlayıcı/model erişilemezse OpenClaw başka bir yapılandırılmış modele geçmek yerine görünür biçimde başarısız olur.
- Cron `--model` / yük `model`, iş başına bir birincildir. İş açık yük `fallbacks` sağlamadığı sürece yapılandırılmış yedekleri yine kullanır (katı bir cron çalıştırması için `fallbacks: []` kullanın).
- CLI varsayılan model ve izin listesi seçicileri, tam yerleşik kataloğu yüklemek yerine açık `models.providers.*.models` öğelerini listeleyerek `models.mode: "replace"` ayarına uyar.
- Control kullanıcı arayüzü model seçici, Gateway'den yapılandırılmış model görünümünü ister: varsa sağlayıcı genelinde `provider/*` girdileri dahil `agents.defaults.models`, aksi halde açık `models.providers.*.models` artı kullanılabilir auth bulunan sağlayıcılar. Tam yerleşik katalog, `view: "all"` ile `models.list` veya `openclaw models list --all` gibi açık göz atma görünümleri için ayrılmıştır.

## Hızlı model politikası

- Birincilinizi erişiminiz olan en güçlü son nesil modele ayarlayın.
- Maliyet/gecikmeye duyarlı görevler ve daha düşük riskli sohbet için yedekleri kullanın.
- Araç etkin aracılar veya güvenilmeyen girdiler için eski/zayıf model katmanlarından kaçının.

## İlk kurulum (önerilir)

Yapılandırmayı elle düzenlemek istemiyorsanız ilk kurulumu çalıştırın:

```bash
openclaw onboard
```

**OpenAI Code (Codex) subscription** (OAuth) ve **Anthropic** (API anahtarı veya Claude CLI) dahil yaygın sağlayıcılar için model + auth kurabilir.

## Yapılandırma anahtarları (genel bakış)

- `agents.defaults.model.primary` ve `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` ve `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` ve `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` ve `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` ve `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (izin listesi + takma adlar + sağlayıcı parametreleri + `provider/*` dinamik sağlayıcı girdileri)
- `models.providers` (`models.json` içine yazılan özel sağlayıcılar)

<Note>
Model başvuruları küçük harfe normalleştirilir. `z.ai/*` gibi sağlayıcı takma adları `zai/*` biçimine normalleştirilir.

Sağlayıcı yapılandırma örnekleri (OpenCode dahil) [OpenCode](/tr/providers/opencode) içinde yer alır.
</Note>

### Güvenli izin listesi düzenlemeleri

`agents.defaults.models` değerini elle güncellerken eklemeli yazmalar kullanın:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Üzerine yazma koruma kuralları">
    `openclaw config set`, model/sağlayıcı eşlemelerini kazara üzerine yazmalardan korur. `agents.defaults.models`, `models.providers` veya `models.providers.<id>.models` için düz nesne ataması, mevcut girdileri kaldıracaksa reddedilir. Eklemeli değişiklikler için `--merge` kullanın; yalnızca sağlanan değer hedef değerin tamamı olmalıysa `--replace` kullanın.

    Etkileşimli sağlayıcı kurulumu ve `openclaw configure --section model` de sağlayıcı kapsamlı seçimleri mevcut izin listesiyle birleştirir; böylece Codex, Ollama veya başka bir sağlayıcı eklemek ilgisiz model girdilerini düşürmez. Configure, sağlayıcı auth yeniden uygulandığında mevcut `agents.defaults.model.primary` değerini korur. `openclaw models auth login --provider <id> --set-default` ve `openclaw models set <model>` gibi açık varsayılan ayarlama komutları yine de `agents.defaults.model.primary` değerini değiştirir.

  </Accordion>
</AccordionGroup>

## "Modele izin verilmiyor" (ve yanıtların neden durduğu)

`agents.defaults.models` ayarlanmışsa, `/model` ve oturum geçersiz kılmaları için **izin listesi** haline gelir. Kullanıcı bu izin listesinde olmayan bir model seçtiğinde OpenClaw şunu döndürür:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
Bu, normal bir yanıt oluşturulmadan **önce** gerçekleşir; bu yüzden mesaj "yanıt vermedi" gibi gelebilir. Çözüm şunlardan biridir:

- Modeli `agents.defaults.models` içine ekleyin veya
- İzin listesini temizleyin (`agents.defaults.models` öğesini kaldırın) veya
- `/model list` içinden bir model seçin.

</Warning>

Reddedilen komut `/model openai/gpt-5.5 --runtime codex` gibi bir çalışma zamanı geçersiz kılması içeriyorsa, önce izin listesini düzeltin, sonra aynı `/model ... --runtime ...` komutunu yeniden deneyin. Yerel Codex yürütmesi için seçilen model yine `openai/gpt-5.5` olur; `codex` çalışma zamanı koşumu seçer ve Codex auth öğesini ayrı olarak kullanır.

Yerel/GGUF modelleri için, izin listesinde tam sağlayıcı ön ekli başvuruyu saklayın;
örneğin `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` veya
`openclaw models list --provider <provider>` tarafından gösterilen tam
sağlayıcı/model. İzin listesi etkinken çıplak yerel dosya adları veya görünen
adlar yeterli değildir.

Her modeli elle listelemeden sağlayıcıları sınırlamak istiyorsanız,
`agents.defaults.models` içine `provider/*` girdileri ekleyin:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai-codex/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

Bu politikayla `/model`, `/models` ve model seçiciler yalnızca bu sağlayıcılar
için keşfedilen kataloğu gösterir. Seçilen sağlayıcılardan yeni modeller,
izin listesini düzenlemeden görünebilir. Başka bir sağlayıcıdan belirli bir modele
ihtiyaç duyduğunuzda tam `provider/model` girdileri `provider/*` girdileriyle karıştırılabilir.

Örnek izin listesi yapılandırması:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Sohbette model değiştirme (`/model`)

Yeniden başlatmadan geçerli oturum için modeller arasında geçiş yapabilirsiniz:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="Seçici davranışı">
    - `/model` (ve `/model list`) kompakt, numaralı bir seçicidir (model ailesi + kullanılabilir sağlayıcılar).
    - Discord'da `/model` ve `/models`, sağlayıcı ve model açılır menüleri ile bir Gönder adımı içeren etkileşimli bir seçici açar.
    - Telegram'da `/models` seçici seçimleri oturum kapsamlıdır; aracının `openclaw.json` içindeki kalıcı varsayılanını değiştirmezler.
    - `/models add` kullanımdan kaldırıldı ve artık sohbetten model kaydetmek yerine bir kullanımdan kaldırma mesajı döndürüyor.
    - `/model <#>` bu seçiciden seçim yapar.

  </Accordion>
  <Accordion title="Kalıcılık ve canlı geçiş">
    - `/model` yeni oturum seçimini hemen kalıcı hale getirir.
    - Aracı boştaysa, bir sonraki çalıştırma yeni modeli hemen kullanır.
    - Bir çalıştırma zaten etkinse, OpenClaw canlı geçişi beklemede olarak işaretler ve yalnızca temiz bir yeniden deneme noktasında yeni modele yeniden başlatır.
    - Araç etkinliği veya yanıt çıktısı zaten başladıysa, bekleyen geçiş daha sonraki bir yeniden deneme fırsatına veya bir sonraki kullanıcı turuna kadar kuyrukta kalabilir.
    - Kullanıcı tarafından seçilen `/model` başvurusu o oturum için katıdır: seçilen sağlayıcı/model erişilemezse yanıt, `agents.defaults.model.fallbacks` üzerinden sessizce cevaplamak yerine görünür biçimde başarısız olur. Bu, yedek zincirlerini hâlâ kullanabilen yapılandırılmış varsayılanlardan ve cron işi birincillerinden farklıdır.
    - `/model status` ayrıntılı görünümdür (auth adayları ve yapılandırıldığında sağlayıcı uç noktası `baseUrl` + `api` modu).

  </Accordion>
  <Accordion title="Ref ayrıştırma">
    - Model ref'leri **ilk** `/` karakterinden bölünerek ayrıştırılır. `/model <ref>` yazarken `provider/model` kullanın.
    - Model kimliğinin kendisi `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini eklemeniz gerekir (örnek: `/model openrouter/moonshotai/kimi-k2`).
    - Sağlayıcıyı atlarsanız OpenClaw girdiyi şu sırayla çözümler:
      1. alias eşleşmesi
      2. aynı öneksiz model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesi
      3. yapılandırılmış varsayılan sağlayıcıya kullanımdan kaldırılmış geri dönüş — bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw, eski ve kaldırılmış sağlayıcı varsayılanını göstermemek için bunun yerine ilk yapılandırılmış sağlayıcı/modele geri döner.
  </Accordion>
</AccordionGroup>

Tam komut davranışı/yapılandırması: [Slash komutları](/tr/tools/slash-commands).

## CLI komutları

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (alt komut olmadan), `models status` için bir kısayoldur.

### `models list`

Varsayılan olarak yapılandırılmış/kimlik doğrulaması kullanılabilir modelleri gösterir. Kullanışlı bayraklar:

<ParamField path="--all" type="boolean">
  Tam katalog. Kimlik doğrulaması yapılandırılmadan önce paketle gelen ve sağlayıcıya ait statik katalog satırlarını içerir; böylece yalnızca keşif amaçlı görünümler, eşleşen sağlayıcı kimlik bilgilerini ekleyene kadar kullanılamayan modelleri gösterebilir.
</ParamField>
<ParamField path="--local" type="boolean">
  Yalnızca yerel sağlayıcılar.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Sağlayıcı kimliğine göre filtreleyin; örneğin `moonshot`. Etkileşimli seçicilerdeki görünen etiketler kabul edilmez.
</ParamField>
<ParamField path="--plain" type="boolean">
  Her satırda bir model.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir çıktı.
</ParamField>

### `models status`

Çözümlenen birincil modeli, geri dönüşleri, görüntü modelini ve yapılandırılmış sağlayıcıların kimlik doğrulama özetini gösterir. Ayrıca kimlik doğrulama deposunda bulunan profiller için OAuth süre sonu durumunu da gösterir (varsayılan olarak 24 saat içinde uyarır). `--plain` yalnızca çözümlenen birincil modeli yazdırır.

<AccordionGroup>
  <Accordion title="Kimlik doğrulama ve yoklama davranışı">
    - OAuth durumu her zaman gösterilir (ve `--json` çıktısına dahil edilir). Yapılandırılmış bir sağlayıcının kimlik bilgileri yoksa `models status` bir **Eksik kimlik doğrulaması** bölümü yazdırır.
    - JSON, `auth.oauth` (uyarı penceresi + profiller) ve `auth.providers` (env destekli kimlik bilgileri dahil sağlayıcı başına etkili kimlik doğrulama) içerir. `auth.oauth` yalnızca kimlik doğrulama deposu profil sağlığıdır; yalnızca env kullanan sağlayıcılar burada görünmez.
    - Otomasyon için `--check` kullanın (eksik/süresi dolmuş olduğunda çıkış `1`, süresi dolmak üzere olduğunda `2`).
    - Canlı kimlik doğrulama denetimleri için `--probe` kullanın; yoklama satırları kimlik doğrulama profillerinden, env kimlik bilgilerinden veya `models.json` dosyasından gelebilir.
    - Açık `auth.order.<provider>` depolanmış bir profili atlıyorsa, yoklama bunu denemek yerine `excluded_by_auth_order` bildirir. Kimlik doğrulama varsa ancak o sağlayıcı için yoklanabilir bir model çözümlenemiyorsa, yoklama `status: no_model` bildirir.

  </Accordion>
</AccordionGroup>

<Note>
Kimlik doğrulama seçimi sağlayıcıya/hesaba bağlıdır. Her zaman açık Gateway ana makineleri için API anahtarları genellikle en öngörülebilir seçenektir; Claude CLI yeniden kullanımı ve mevcut Anthropic OAuth/token profilleri de desteklenir.
</Note>

Örnek (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Tarama (OpenRouter ücretsiz modelleri)

`openclaw models scan`, OpenRouter'ın **ücretsiz model kataloğunu** inceler ve isteğe bağlı olarak modelleri araç ve görüntü desteği için yoklayabilir.

<ParamField path="--no-probe" type="boolean">
  Canlı yoklamaları atla (yalnızca metadata).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Minimum parametre boyutu (milyar).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Daha eski modelleri atla.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Sağlayıcı öneki filtresi.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  Geri dönüş listesi boyutu.
</ParamField>
<ParamField path="--set-default" type="boolean">
  `agents.defaults.model.primary` değerini ilk seçime ayarla.
</ParamField>
<ParamField path="--set-image" type="boolean">
  `agents.defaults.imageModel.primary` değerini ilk görüntü seçimine ayarla.
</ParamField>

<Note>
OpenRouter `/models` kataloğu herkese açıktır; bu nedenle yalnızca metadata taramaları, anahtar olmadan ücretsiz adayları listeleyebilir. Yoklama ve çıkarım yine de bir OpenRouter API anahtarı gerektirir (kimlik doğrulama profillerinden veya `OPENROUTER_API_KEY`). Anahtar yoksa `openclaw models scan`, yalnızca metadata çıktısına geri döner ve yapılandırmayı değiştirmeden bırakır. Yalnızca metadata modunu açıkça istemek için `--no-probe` kullanın.
</Note>

Tarama sonuçları şu ölçütlere göre sıralanır:

1. Görüntü desteği
2. Araç gecikmesi
3. Bağlam boyutu
4. Parametre sayısı

Girdi:

- OpenRouter `/models` listesi (filtre `:free`)
- Canlı yoklamalar, kimlik doğrulama profillerinden veya `OPENROUTER_API_KEY` üzerinden OpenRouter API anahtarı gerektirir (bkz. [Ortam değişkenleri](/tr/help/environment))
- İsteğe bağlı filtreler: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- İstek/yoklama kontrolleri: `--timeout`, `--concurrency`

Canlı yoklamalar bir TTY içinde çalıştığında, geri dönüşleri etkileşimli olarak seçebilirsiniz. Etkileşimli olmayan modda, varsayılanları kabul etmek için `--yes` geçirin. Yalnızca metadata sonuçları bilgilendirme amaçlıdır; `--set-default` ve `--set-image`, OpenClaw'ın kullanılamaz, anahtarsız bir OpenRouter modeli yapılandırmaması için canlı yoklamalar gerektirir.

## Model kayıt defteri (`models.json`)

`models.providers` içindeki özel sağlayıcılar, agent dizini altında `models.json` içine yazılır (varsayılan `~/.openclaw/agents/<agentId>/agent/models.json`). `models.mode` değeri `replace` olarak ayarlanmadıkça bu dosya varsayılan olarak birleştirilir.

<AccordionGroup>
  <Accordion title="Birleştirme modu önceliği">
    Eşleşen sağlayıcı kimlikleri için birleştirme modu önceliği:

    - Agent `models.json` içinde zaten bulunan boş olmayan `baseUrl` kazanır.
    - Agent `models.json` içindeki boş olmayan `apiKey`, yalnızca bu sağlayıcı geçerli yapılandırma/kimlik doğrulama profili bağlamında SecretRef tarafından yönetilmiyorsa kazanır.
    - SecretRef tarafından yönetilen sağlayıcı `apiKey` değerleri, çözümlenen sırları kalıcı hale getirmek yerine kaynak işaretçilerinden (env ref'leri için `ENV_VAR_NAME`, file/exec ref'leri için `secretref-managed`) yenilenir.
    - SecretRef tarafından yönetilen sağlayıcı header değerleri, kaynak işaretçilerinden (env ref'leri için `secretref-env:ENV_VAR_NAME`, file/exec ref'leri için `secretref-managed`) yenilenir.
    - Boş veya eksik agent `apiKey`/`baseUrl`, yapılandırma `models.providers` değerlerine geri döner.
    - Diğer sağlayıcı alanları yapılandırmadan ve normalleştirilmiş katalog verilerinden yenilenir.

  </Accordion>
</AccordionGroup>

<Note>
İşaretçi kalıcılığında kaynak belirleyicidir: OpenClaw işaretçileri, çözümlenen çalışma zamanı sır değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden (çözümleme öncesi) yazar. Bu, OpenClaw `models.json` dosyasını yeniden oluşturduğunda, `openclaw agent` gibi komut odaklı yollar dahil olmak üzere her zaman geçerlidir.
</Note>

## İlgili

- [Agent çalışma zamanları](/tr/concepts/agent-runtimes) — Pi, Codex ve diğer agent döngüsü çalışma zamanları
- [Yapılandırma başvurusu](/tr/gateway/config-agents#agent-defaults) — model yapılandırma anahtarları
- [Görüntü oluşturma](/tr/tools/image-generation) — görüntü modeli yapılandırması
- [Model failover](/tr/concepts/model-failover) — geri dönüş zincirleri
- [Model sağlayıcıları](/tr/concepts/model-providers) — sağlayıcı yönlendirme ve kimlik doğrulama
- [Müzik oluşturma](/tr/tools/music-generation) — müzik modeli yapılandırması
- [Video oluşturma](/tr/tools/video-generation) — video modeli yapılandırması
