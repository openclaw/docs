---
read_when:
    - models CLI'sini ekleme veya değiştirme (models list/set/scan/aliases/fallbacks)
    - Model yedeğe düşme davranışını veya seçim kullanıcı deneyimini değiştirme
    - Model tarama yoklamalarını güncelleme (araçlar/görseller)
sidebarTitle: Models CLI
summary: 'Modeller CLI''si: list, set, aliases, fallbacks, scan, status'
title: Modeller CLI
x-i18n:
    generated_at: "2026-05-02T08:52:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: d362c8cc41801b5e480560c8d34be53e1ada53a23c49af99adb7874e265ddb1f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Model yük devri" href="/tr/concepts/model-failover">
    Kimlik doğrulama profili rotasyonu, bekleme süreleri ve bunun geri dönüşlerle nasıl etkileştiği.
  </Card>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers">
    Hızlı sağlayıcı genel bakışı ve örnekler.
  </Card>
  <Card title="Ajan çalışma zamanları" href="/tr/concepts/agent-runtimes">
    PI, Codex ve diğer ajan döngüsü çalışma zamanları.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/config-agents#agent-defaults">
    Model yapılandırma anahtarları.
  </Card>
</CardGroup>

Model başvuruları bir sağlayıcı ve model seçer. Genellikle düşük seviyeli ajan çalışma zamanını seçmezler. Örneğin, `openai/gpt-5.5`, `agents.defaults.agentRuntime.id` değerine bağlı olarak normal OpenAI sağlayıcı yolu üzerinden veya Codex uygulama sunucusu çalışma zamanı üzerinden çalışabilir. Codex çalışma zamanı modunda, `openai/gpt-*` başvurusu API anahtarı faturalandırması anlamına gelmez; kimlik doğrulama bir Codex hesabından veya `openai-codex` kimlik doğrulama profilinden gelebilir. Bkz. [Ajan çalışma zamanları](/tr/concepts/agent-runtimes).

## Model seçimi nasıl çalışır

OpenClaw modelleri şu sırayla seçer:

<Steps>
  <Step title="Birincil model">
    `agents.defaults.model.primary` (veya `agents.defaults.model`).
  </Step>
  <Step title="Geri dönüşler">
    `agents.defaults.model.fallbacks` (sırayla).
  </Step>
  <Step title="Sağlayıcı kimlik doğrulama yük devri">
    Kimlik doğrulama yük devri, sonraki modele geçmeden önce sağlayıcının içinde gerçekleşir.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="İlgili model yüzeyleri">
    - `agents.defaults.models`, OpenClaw'ın kullanabileceği modellerin izin listesidir/kataloğudur (takma adlarla birlikte).
    - `agents.defaults.imageModel`, **yalnızca** birincil model görüntü kabul edemediğinde kullanılır.
    - `agents.defaults.pdfModel`, `pdf` aracı tarafından kullanılır. Atlanırsa araç önce `agents.defaults.imageModel` değerine, sonra çözümlenen oturum/varsayılan modele geri döner.
    - `agents.defaults.imageGenerationModel`, paylaşılan görüntü oluşturma yeteneği tarafından kullanılır. Atlanırsa `image_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanı çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından kalan kayıtlı görüntü oluşturma sağlayıcılarını sağlayıcı kimliği sırasıyla dener. Belirli bir sağlayıcı/model ayarlarsanız o sağlayıcının kimlik doğrulamasını/API anahtarını da yapılandırın.
    - `agents.defaults.musicGenerationModel`, paylaşılan müzik oluşturma yeteneği tarafından kullanılır. Atlanırsa `music_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanı çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından kalan kayıtlı müzik oluşturma sağlayıcılarını sağlayıcı kimliği sırasıyla dener. Belirli bir sağlayıcı/model ayarlarsanız o sağlayıcının kimlik doğrulamasını/API anahtarını da yapılandırın.
    - `agents.defaults.videoGenerationModel`, paylaşılan video oluşturma yeteneği tarafından kullanılır. Atlanırsa `video_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanı çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından kalan kayıtlı video oluşturma sağlayıcılarını sağlayıcı kimliği sırasıyla dener. Belirli bir sağlayıcı/model ayarlarsanız o sağlayıcının kimlik doğrulamasını/API anahtarını da yapılandırın.
    - Ajan başına varsayılanlar, `agents.list[].model` artı bağlamalar aracılığıyla `agents.defaults.model` değerini geçersiz kılabilir (bkz. [Çoklu ajan yönlendirme](/tr/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Seçim kaynağı ve geri dönüş davranışı

Aynı `provider/model`, nereden geldiğine bağlı olarak farklı şeyler ifade edebilir:

- Yapılandırılmış varsayılanlar (`agents.defaults.model.primary` ve ajana özgü birinciller) normal başlangıç noktasıdır ve `agents.defaults.model.fallbacks` değerini kullanır.
- Otomatik geri dönüş seçimleri geçici kurtarma durumudur. Daha sonraki dönüşlerin önce bilinen sorunlu bir birincili yoklamadan geri dönüş zincirini kullanmaya devam edebilmesi için `modelOverrideSource: "auto"` ile saklanırlar.
- Kullanıcı oturum seçimleri kesindir. `/model`, model seçici, `session_status(model=...)` ve `sessions.patch`, `modelOverrideSource: "user"` değerini saklar; seçilen sağlayıcı/model erişilemezse OpenClaw başka bir yapılandırılmış modele geçmek yerine görünür şekilde başarısız olur.
- Cron `--model` / yük `model`, iş başına bir birincildir. İş açıkça yük `fallbacks` sağlamadıkça yapılandırılmış geri dönüşleri yine kullanır (katı bir cron çalıştırması için `fallbacks: []` kullanın).
- CLI varsayılan model ve izin listesi seçicileri, tam yerleşik kataloğu yüklemek yerine açık `models.providers.*.models` değerlerini listeleyerek `models.mode: "replace"` ayarına uyar.
- Control UI model seçici, Gateway'den yapılandırılmış model görünümünü ister: varsa `agents.defaults.models`, yoksa açık `models.providers.*.models` artı kullanılabilir kimlik doğrulaması olan sağlayıcılar. Tam yerleşik katalog, `view: "all"` ile `models.list` veya `openclaw models list --all` gibi açık gezinme görünümleri için ayrılmıştır.

## Hızlı model ilkesi

- Birincilinizi kullanabildiğiniz en güçlü en yeni nesil modele ayarlayın.
- Maliyet/gecikme duyarlı görevler ve daha düşük riskli sohbet için geri dönüşleri kullanın.
- Araç etkin ajanlar veya güvenilmeyen girdiler için daha eski/zayıf model katmanlarından kaçının.

## İlk kurulum (önerilir)

Yapılandırmayı elle düzenlemek istemiyorsanız ilk kurulumu çalıştırın:

```bash
openclaw onboard
```

**OpenAI Code (Codex) subscription** (OAuth) ve **Anthropic** (API anahtarı veya Claude CLI) dahil olmak üzere yaygın sağlayıcılar için model + kimlik doğrulama ayarlayabilir.

## Yapılandırma anahtarları (genel bakış)

- `agents.defaults.model.primary` ve `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` ve `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` ve `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` ve `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` ve `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (izin listesi + takma adlar + sağlayıcı parametreleri)
- `models.providers` (`models.json` içine yazılan özel sağlayıcılar)

<Note>
Model başvuruları küçük harfe normalleştirilir. `z.ai/*` gibi sağlayıcı takma adları `zai/*` olarak normalleştirilir.

Sağlayıcı yapılandırma örnekleri (OpenCode dahil) [OpenCode](/tr/providers/opencode) içinde yer alır.
</Note>

### Güvenli izin listesi düzenlemeleri

`agents.defaults.models` değerini elle güncellerken eklemeli yazmaları kullanın:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Üzerine yazma koruması kuralları">
    `openclaw config set`, model/sağlayıcı eşlemelerini yanlışlıkla üzerine yazmalardan korur. `agents.defaults.models`, `models.providers` veya `models.providers.<id>.models` için düz bir nesne ataması, mevcut girişleri kaldıracaksa reddedilir. Eklemeli değişiklikler için `--merge` kullanın; yalnızca verilen değerin tam hedef değer olması gerektiğinde `--replace` kullanın.

    Etkileşimli sağlayıcı kurulumu ve `openclaw configure --section model` de sağlayıcı kapsamlı seçimleri mevcut izin listesine birleştirir; böylece Codex, Ollama veya başka bir sağlayıcı eklemek ilgisiz model girişlerini düşürmez. Configure, sağlayıcı kimlik doğrulaması yeniden uygulandığında mevcut `agents.defaults.model.primary` değerini korur. `openclaw models auth login --provider <id> --set-default` ve `openclaw models set <model>` gibi açık varsayılan ayarlama komutları yine de `agents.defaults.model.primary` değerini değiştirir.

  </Accordion>
</AccordionGroup>

## "Model is not allowed" (ve yanıtların neden durduğu)

`agents.defaults.models` ayarlanırsa, `/model` ve oturum geçersiz kılmaları için **izin listesi** haline gelir. Kullanıcı bu izin listesinde olmayan bir model seçtiğinde OpenClaw şunu döndürür:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Bu, normal bir yanıt oluşturulmadan **önce** gerçekleşir; bu yüzden mesaj "yanıt vermedi" gibi hissedilebilir. Çözüm şunlardan biridir:

- Modeli `agents.defaults.models` içine ekleyin veya
- İzin listesini temizleyin (`agents.defaults.models` değerini kaldırın) veya
- `/model list` içinden bir model seçin.

</Warning>

Yerel/GGUF modeller için, izin listesinde tam sağlayıcı önekli başvuruyu saklayın;
örneğin `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` veya
`openclaw models list --provider <provider>` tarafından gösterilen tam
sağlayıcı/model. İzin listesi etkinken çıplak yerel dosya adları veya görünen
adlar yeterli değildir.

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

Yeniden başlatmadan geçerli oturum için modelleri değiştirebilirsiniz:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="Seçici davranışı">
    - `/model` (ve `/model list`), kompakt, numaralı bir seçicidir (model ailesi + kullanılabilir sağlayıcılar).
    - Discord'da `/model` ve `/models`, sağlayıcı ve model açılır menüleri ile bir Gönder adımı içeren etkileşimli bir seçici açar.
    - Telegram'da `/models` seçici seçimleri oturum kapsamlıdır; ajanın `openclaw.json` içindeki kalıcı varsayılanını değiştirmez.
    - `/models add` kullanımdan kaldırıldı ve artık sohbetten model kaydetmek yerine kullanımdan kaldırma mesajı döndürür.
    - `/model <#>`, o seçiciden seçim yapar.

  </Accordion>
  <Accordion title="Kalıcılık ve canlı değiştirme">
    - `/model`, yeni oturum seçimini hemen kalıcı hale getirir.
    - Ajan boştaysa sonraki çalıştırma yeni modeli hemen kullanır.
    - Bir çalıştırma zaten etkinse OpenClaw canlı değiştirmeyi beklemede olarak işaretler ve yalnızca temiz bir yeniden deneme noktasında yeni modelle yeniden başlatır.
    - Araç etkinliği veya yanıt çıktısı zaten başladıysa bekleyen değişiklik daha sonraki bir yeniden deneme fırsatına veya sonraki kullanıcı dönüşüne kadar kuyrukta kalabilir.
    - Kullanıcı tarafından seçilen `/model` başvurusu o oturum için katıdır: seçilen sağlayıcı/model erişilemezse yanıt, sessizce `agents.defaults.model.fallbacks` içinden yanıtlamak yerine görünür şekilde başarısız olur. Bu, geri dönüş zincirlerini hâlâ kullanabilen yapılandırılmış varsayılanlardan ve cron işi birincillerinden farklıdır.
    - `/model status`, ayrıntılı görünümdür (kimlik doğrulama adayları ve yapılandırıldığında sağlayıcı uç noktası `baseUrl` + `api` modu).

  </Accordion>
  <Accordion title="Başvuru ayrıştırma">
    - Model başvuruları **ilk** `/` üzerinden bölünerek ayrıştırılır. `/model <ref>` yazarken `provider/model` kullanın.
    - Model kimliğinin kendisi `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini eklemeniz gerekir (örnek: `/model openrouter/moonshotai/kimi-k2`).
    - Sağlayıcıyı atlarsanız OpenClaw girdiyi şu sırayla çözer:
      1. takma ad eşleşmesi
      2. tam öneksiz model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesi
      3. yapılandırılmış varsayılan sağlayıcıya kullanımdan kaldırılmış geri dönüş — bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw, eski kaldırılmış sağlayıcı varsayılanını göstermemek için bunun yerine ilk yapılandırılmış sağlayıcı/modele geri döner.
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

Varsayılan olarak yapılandırılmış/kimlik doğrulama ile kullanılabilir modelleri gösterir. Yararlı bayraklar:

<ParamField path="--all" type="boolean">
  Tam katalog. Kimlik doğrulama yapılandırılmadan önce paketlenmiş, sağlayıcıya ait statik katalog satırlarını içerir; böylece yalnızca keşif görünümleri, eşleşen sağlayıcı kimlik bilgilerini ekleyene kadar kullanılamayan modelleri gösterebilir.
</ParamField>
<ParamField path="--local" type="boolean">
  Yalnızca yerel sağlayıcılar.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Sağlayıcı kimliğine göre filtrele, örneğin `moonshot`. Etkileşimli seçicilerden gelen görüntü etiketleri kabul edilmez.
</ParamField>
<ParamField path="--plain" type="boolean">
  Satır başına bir model.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir çıktı.
</ParamField>

### `models status`

Çözümlenen birincil modeli, yedekleri, görüntü modelini ve yapılandırılmış sağlayıcıların kimlik doğrulama özetini gösterir. Ayrıca kimlik doğrulama deposunda bulunan profiller için OAuth süre dolumu durumunu da yüzeye çıkarır (varsayılan olarak 24 saat içinde uyarır). `--plain` yalnızca çözümlenen birincil modeli yazdırır.

<AccordionGroup>
  <Accordion title="Auth and probe behavior">
    - OAuth durumu her zaman gösterilir (ve `--json` çıktısına dahil edilir). Yapılandırılmış bir sağlayıcının kimlik bilgileri yoksa `models status`, **Eksik kimlik doğrulama** bölümünü yazdırır.
    - JSON, `auth.oauth` (uyarı penceresi + profiller) ve `auth.providers` (env destekli kimlik bilgileri dahil, sağlayıcı başına etkin kimlik doğrulama) içerir. `auth.oauth` yalnızca kimlik doğrulama deposu profil sağlığıdır; yalnızca env kullanan sağlayıcılar burada görünmez.
    - Otomasyon için `--check` kullanın (eksik/süresi dolmuş olduğunda çıkış `1`, süresi dolmak üzere olduğunda `2`).
    - Canlı kimlik doğrulama denetimleri için `--probe` kullanın; probe satırları kimlik doğrulama profillerinden, env kimlik bilgilerinden veya `models.json` dosyasından gelebilir.
    - Açık `auth.order.<provider>` depolanmış bir profili atlıyorsa, probe onu denemek yerine `excluded_by_auth_order` bildirir. Kimlik doğrulama varsa ancak bu sağlayıcı için probe edilebilir bir model çözümlenemiyorsa, probe `status: no_model` bildirir.

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

`openclaw models scan`, OpenRouter'ın **ücretsiz model kataloğunu** inceler ve isteğe bağlı olarak modelleri araç ve görüntü desteği için probe edebilir.

<ParamField path="--no-probe" type="boolean">
  Canlı probe işlemlerini atla (yalnızca metadata).
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
  Yedek liste boyutu.
</ParamField>
<ParamField path="--set-default" type="boolean">
  `agents.defaults.model.primary` değerini ilk seçime ayarla.
</ParamField>
<ParamField path="--set-image" type="boolean">
  `agents.defaults.imageModel.primary` değerini ilk görüntü seçimine ayarla.
</ParamField>

<Note>
OpenRouter `/models` kataloğu herkese açıktır, bu nedenle yalnızca metadata taramaları anahtar olmadan ücretsiz adayları listeleyebilir. Probe ve çıkarım yine de bir OpenRouter API anahtarı gerektirir (kimlik doğrulama profillerinden veya `OPENROUTER_API_KEY` üzerinden). Kullanılabilir anahtar yoksa `openclaw models scan`, yalnızca metadata çıktısına geri döner ve yapılandırmayı değiştirmez. Yalnızca metadata modunu açıkça istemek için `--no-probe` kullanın.
</Note>

Tarama sonuçları şuna göre sıralanır:

1. Görüntü desteği
2. Araç gecikmesi
3. Bağlam boyutu
4. Parametre sayısı

Girdi:

- OpenRouter `/models` listesi (filtre `:free`)
- Canlı probe işlemleri, kimlik doğrulama profillerinden veya `OPENROUTER_API_KEY` üzerinden OpenRouter API anahtarı gerektirir (bkz. [Ortam değişkenleri](/tr/help/environment))
- İsteğe bağlı filtreler: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- İstek/probe denetimleri: `--timeout`, `--concurrency`

Canlı probe işlemleri bir TTY içinde çalıştığında, yedekleri etkileşimli olarak seçebilirsiniz. Etkileşimli olmayan modda, varsayılanları kabul etmek için `--yes` iletin. Yalnızca metadata sonuçları bilgilendirme amaçlıdır; OpenClaw'ın kullanılamaz, anahtarsız bir OpenRouter modelini yapılandırmaması için `--set-default` ve `--set-image` canlı probe gerektirir.

## Modeller kayıt defteri (`models.json`)

`models.providers` içindeki özel sağlayıcılar, ajan dizini altında `models.json` dosyasına yazılır (varsayılan `~/.openclaw/agents/<agentId>/agent/models.json`). `models.mode`, `replace` olarak ayarlanmadıkça bu dosya varsayılan olarak birleştirilir.

<AccordionGroup>
  <Accordion title="Merge mode precedence">
    Eşleşen sağlayıcı kimlikleri için birleştirme modu önceliği:

    - Ajan `models.json` içinde zaten bulunan boş olmayan `baseUrl` kazanır.
    - Ajan `models.json` içindeki boş olmayan `apiKey`, yalnızca bu sağlayıcı mevcut yapılandırma/kimlik doğrulama profili bağlamında SecretRef tarafından yönetilmiyorsa kazanır.
    - SecretRef tarafından yönetilen sağlayıcı `apiKey` değerleri, çözümlenmiş secret'ları kalıcılaştırmak yerine kaynak işaretçilerinden (`ENV_VAR_NAME` env başvuruları için, `secretref-managed` file/exec başvuruları için) yenilenir.
    - SecretRef tarafından yönetilen sağlayıcı başlık değerleri, kaynak işaretçilerinden (`secretref-env:ENV_VAR_NAME` env başvuruları için, `secretref-managed` file/exec başvuruları için) yenilenir.
    - Boş veya eksik ajan `apiKey`/`baseUrl`, config `models.providers` değerlerine geri döner.
    - Diğer sağlayıcı alanları config ve normalleştirilmiş katalog verilerinden yenilenir.

  </Accordion>
</AccordionGroup>

<Note>
İşaretçi kalıcılığında kaynak belirleyicidir: OpenClaw işaretçileri, çözümlenmiş çalışma zamanı secret değerlerinden değil, etkin kaynak config anlık görüntüsünden (çözümleme öncesi) yazar. Bu, `openclaw agent` gibi komut odaklı yollar dahil olmak üzere OpenClaw `models.json` dosyasını yeniden oluşturduğunda her zaman geçerlidir.
</Note>

## İlgili

- [Ajan çalışma zamanları](/tr/concepts/agent-runtimes) — PI, Codex ve diğer ajan döngüsü çalışma zamanları
- [Yapılandırma başvurusu](/tr/gateway/config-agents#agent-defaults) — model config anahtarları
- [Görüntü üretimi](/tr/tools/image-generation) — görüntü modeli yapılandırması
- [Model failover](/tr/concepts/model-failover) — yedek zincirleri
- [Model sağlayıcıları](/tr/concepts/model-providers) — sağlayıcı yönlendirme ve kimlik doğrulama
- [Müzik üretimi](/tr/tools/music-generation) — müzik modeli yapılandırması
- [Video üretimi](/tr/tools/video-generation) — video modeli yapılandırması
