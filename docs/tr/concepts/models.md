---
read_when:
    - models CLI'sini ekleme veya değiştirme (models list/set/scan/aliases/fallbacks)
    - Modelin yedek modele geçiş davranışını veya seçim kullanıcı deneyimini değiştirme
    - Model tarama problarını güncelleme (araçlar/görseller)
sidebarTitle: Models CLI
summary: 'Modeller CLI''si: list, set, aliases, fallbacks, scan, status'
title: Modeller CLI
x-i18n:
    generated_at: "2026-05-05T01:45:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a1dcdb046b914d35513974d4b69fec03a415118d11860dd1c5107efc754ed4f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Model yük devretmesi" href="/tr/concepts/model-failover">
    Auth profili rotasyonu, bekleme süreleri ve bunun fallback'lerle nasıl etkileştiği.
  </Card>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers">
    Hızlı sağlayıcı özeti ve örnekler.
  </Card>
  <Card title="Ajan çalışma zamanları" href="/tr/concepts/agent-runtimes">
    PI, Codex ve diğer ajan döngüsü çalışma zamanları.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/config-agents#agent-defaults">
    Model config anahtarları.
  </Card>
</CardGroup>

Model ref'leri bir sağlayıcı ve model seçer. Genellikle düşük seviyeli ajan çalışma zamanını seçmezler. Örneğin `openai/gpt-5.5`, `agents.defaults.agentRuntime.id` değerine bağlı olarak normal OpenAI sağlayıcı yolu üzerinden veya Codex uygulama sunucusu çalışma zamanı üzerinden çalışabilir. Codex çalışma zamanı modunda `openai/gpt-*` ref'i API anahtarı faturalandırması anlamına gelmez; auth bir Codex hesabından veya `openai-codex` auth profilinden gelebilir. Bkz. [Ajan çalışma zamanları](/tr/concepts/agent-runtimes).

## Model seçimi nasıl çalışır?

OpenClaw modelleri şu sırayla seçer:

<Steps>
  <Step title="Birincil model">
    `agents.defaults.model.primary` (veya `agents.defaults.model`).
  </Step>
  <Step title="Fallback'ler">
    `agents.defaults.model.fallbacks` (sırayla).
  </Step>
  <Step title="Sağlayıcı auth yük devretmesi">
    Auth yük devretmesi, sonraki modele geçmeden önce sağlayıcının içinde gerçekleşir.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="İlgili model yüzeyleri">
    - `agents.defaults.models`, OpenClaw'ın kullanabileceği modellerin izin listesidir/kataloğudur (alias'lar dahil).
    - `agents.defaults.imageModel`, **yalnızca** birincil model görüntü kabul edemediğinde kullanılır.
    - `agents.defaults.pdfModel`, `pdf` aracı tarafından kullanılır. Atlanırsa araç önce `agents.defaults.imageModel` değerine, ardından çözümlenen oturum/varsayılan modele fallback yapar.
    - `agents.defaults.imageGenerationModel`, paylaşılan görüntü oluşturma yeteneği tarafından kullanılır. Atlanırsa `image_generate`, auth destekli bir sağlayıcı varsayılanını yine de çıkarabilir. Önce mevcut varsayılan sağlayıcıyı, ardından kalan kayıtlı görüntü oluşturma sağlayıcılarını sağlayıcı kimliği sırasına göre dener. Belirli bir sağlayıcı/model ayarlarsanız o sağlayıcının auth/API anahtarını da yapılandırın.
    - `agents.defaults.musicGenerationModel`, paylaşılan müzik oluşturma yeteneği tarafından kullanılır. Atlanırsa `music_generate`, auth destekli bir sağlayıcı varsayılanını yine de çıkarabilir. Önce mevcut varsayılan sağlayıcıyı, ardından kalan kayıtlı müzik oluşturma sağlayıcılarını sağlayıcı kimliği sırasına göre dener. Belirli bir sağlayıcı/model ayarlarsanız o sağlayıcının auth/API anahtarını da yapılandırın.
    - `agents.defaults.videoGenerationModel`, paylaşılan video oluşturma yeteneği tarafından kullanılır. Atlanırsa `video_generate`, auth destekli bir sağlayıcı varsayılanını yine de çıkarabilir. Önce mevcut varsayılan sağlayıcıyı, ardından kalan kayıtlı video oluşturma sağlayıcılarını sağlayıcı kimliği sırasına göre dener. Belirli bir sağlayıcı/model ayarlarsanız o sağlayıcının auth/API anahtarını da yapılandırın.
    - Ajan başına varsayılanlar, bağlamalarla birlikte `agents.list[].model` üzerinden `agents.defaults.model` değerini geçersiz kılabilir (bkz. [Çoklu ajan yönlendirme](/tr/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Seçim kaynağı ve fallback davranışı

Aynı `provider/model`, nereden geldiğine bağlı olarak farklı şeyler ifade edebilir:

- Yapılandırılmış varsayılanlar (`agents.defaults.model.primary` ve ajana özgü birinciller) normal başlangıç noktasıdır ve `agents.defaults.model.fallbacks` kullanır.
- Otomatik fallback seçimleri geçici kurtarma durumudur. Sonraki turların önce kötü olduğu bilinen bir birincili yoklamadan fallback zincirini kullanmaya devam edebilmesi için `modelOverrideSource: "auto"` ile saklanırlar.
- Kullanıcı oturumu seçimleri kesindir. `/model`, model seçici, `session_status(model=...)` ve `sessions.patch`, `modelOverrideSource: "user"` saklar; seçilen sağlayıcı/model erişilemez durumdaysa OpenClaw başka bir yapılandırılmış modele düşmek yerine görünür şekilde başarısız olur.
- Cron `--model` / payload `model`, iş başına bir birincildir. İş açık payload `fallbacks` sağlamadıkça yapılandırılmış fallback'leri kullanmaya devam eder (katı bir cron çalıştırması için `fallbacks: []` kullanın).
- CLI varsayılan model ve izin listesi seçicileri, tam yerleşik kataloğu yüklemek yerine açık `models.providers.*.models` listelenerek `models.mode: "replace"` değerine uyar.
- Control UI model seçici, Gateway'den yapılandırılmış model görünümünü ister: varsa `agents.defaults.models`, aksi halde açık `models.providers.*.models` ve kullanılabilir auth'a sahip sağlayıcılar. Tam yerleşik katalog, `view: "all"` ile `models.list` veya `openclaw models list --all` gibi açık gezinti görünümleri için ayrılmıştır.

## Hızlı model politikası

- Birincil modelinizi erişiminiz olan en güçlü son nesil modele ayarlayın.
- Maliyet/gecikmeye duyarlı görevler ve daha düşük riskli sohbet için fallback'ler kullanın.
- Araç etkin ajanlar veya güvenilmeyen girdiler için eski/zayıf model katmanlarından kaçının.

## Onboarding (önerilir)

Config dosyasını elle düzenlemek istemiyorsanız onboarding'i çalıştırın:

```bash
openclaw onboard
```

**OpenAI Code (Codex) aboneliği** (OAuth) ve **Anthropic** (API anahtarı veya Claude CLI) dahil yaygın sağlayıcılar için model + auth kurabilir.

## Config anahtarları (genel bakış)

- `agents.defaults.model.primary` ve `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` ve `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` ve `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` ve `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` ve `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (izin listesi + alias'lar + sağlayıcı parametreleri)
- `models.providers` (`models.json` içine yazılan özel sağlayıcılar)

<Note>
Model ref'leri küçük harfe normalleştirilir. `z.ai/*` gibi sağlayıcı alias'ları `zai/*` değerine normalleştirilir.

Sağlayıcı yapılandırma örnekleri (OpenCode dahil) [OpenCode](/tr/providers/opencode) içinde bulunur.
</Note>

### Güvenli izin listesi düzenlemeleri

`agents.defaults.models` değerini elle güncellerken eklemeli yazımlar kullanın:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Üzerine yazma koruması kuralları">
    `openclaw config set`, model/sağlayıcı haritalarını yanlışlıkla üzerine yazmalardan korur. `agents.defaults.models`, `models.providers` veya `models.providers.<id>.models` için düz bir nesne ataması mevcut girdileri kaldıracaksa reddedilir. Eklemeli değişiklikler için `--merge` kullanın; `--replace` yalnızca sağlanan değer tam hedef değer olmalıysa kullanın.

    Etkileşimli sağlayıcı kurulumu ve `openclaw configure --section model` de sağlayıcı kapsamlı seçimleri mevcut izin listesine birleştirir; böylece Codex, Ollama veya başka bir sağlayıcı eklemek ilgisiz model girdilerini düşürmez. Configure, sağlayıcı auth'u yeniden uygulandığında mevcut `agents.defaults.model.primary` değerini korur. `openclaw models auth login --provider <id> --set-default` ve `openclaw models set <model>` gibi açık varsayılan ayarlama komutları yine de `agents.defaults.model.primary` değerini değiştirir.

  </Accordion>
</AccordionGroup>

## "Modele izin verilmiyor" (ve yanıtların neden durduğu)

`agents.defaults.models` ayarlanırsa `/model` ve oturum geçersiz kılmaları için **izin listesi** haline gelir. Kullanıcı bu izin listesinde olmayan bir model seçtiğinde OpenClaw şunu döndürür:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
Bu, normal bir yanıt oluşturulmadan **önce** gerçekleşir; bu yüzden mesaj "yanıt vermedi" gibi hissettirebilir. Çözüm şunlardan biridir:

- Modeli `agents.defaults.models` içine ekleyin veya
- İzin listesini temizleyin (`agents.defaults.models` değerini kaldırın) veya
- `/model list` içinden bir model seçin.

</Warning>

Reddedilen komut `/model openai/gpt-5.5 --runtime codex` gibi bir çalışma zamanı geçersiz kılması içeriyorsa önce izin listesini düzeltin, ardından aynı `/model ... --runtime ...` komutunu yeniden deneyin. Yerel Codex yürütmesi için seçilen model hâlâ `openai/gpt-5.5` olur; `codex` çalışma zamanı harness'i seçer ve Codex auth'unu ayrı olarak kullanır.

Yerel/GGUF modeller için izin listesinde sağlayıcı önekli tam ref'i saklayın;
örneğin `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` veya
`openclaw models list --provider <provider>` tarafından gösterilen tam
sağlayıcı/model. İzin listesi etkinken yalın yerel dosya adları veya görünen adlar
yeterli değildir.

Örnek izin listesi config'i:

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

Yeniden başlatmadan mevcut oturum için model değiştirebilirsiniz:

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
    - Discord'da `/model` ve `/models`, sağlayıcı ve model açılır menüleri ile bir Submit adımı içeren etkileşimli bir seçici açar.
    - Telegram'da `/models` seçici seçimleri oturum kapsamındadır; ajanın `openclaw.json` içindeki kalıcı varsayılanını değiştirmez.
    - `/models add` kullanımdan kaldırılmıştır ve artık sohbetten model kaydetmek yerine bir kullanımdan kaldırma mesajı döndürür.
    - `/model <#>` bu seçiciden seçim yapar.

  </Accordion>
  <Accordion title="Kalıcılık ve canlı değiştirme">
    - `/model`, yeni oturum seçimini hemen kalıcı hale getirir.
    - Ajan boştaysa sonraki çalıştırma yeni modeli hemen kullanır.
    - Bir çalıştırma zaten etkinse OpenClaw canlı değişimi beklemede olarak işaretler ve yalnızca temiz bir yeniden deneme noktasında yeni modele yeniden başlar.
    - Araç etkinliği veya yanıt çıktısı zaten başladıysa bekleyen değişim daha sonraki bir yeniden deneme fırsatına veya sonraki kullanıcı turuna kadar kuyrukta kalabilir.
    - Kullanıcı tarafından seçilen `/model` ref'i o oturum için katıdır: seçilen sağlayıcı/model erişilemez durumdaysa yanıt, sessizce `agents.defaults.model.fallbacks` üzerinden cevap vermek yerine görünür şekilde başarısız olur. Bu, fallback zincirlerini hâlâ kullanabilen yapılandırılmış varsayılanlardan ve cron iş birincillerinden farklıdır.
    - `/model status` ayrıntılı görünümdür (auth adayları ve yapılandırıldığında sağlayıcı uç noktası `baseUrl` + `api` modu).

  </Accordion>
  <Accordion title="Ref ayrıştırma">
    - Model ref'leri **ilk** `/` üzerinden bölünerek ayrıştırılır. `/model <ref>` yazarken `provider/model` kullanın.
    - Model kimliğinin kendisi `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini eklemeniz gerekir (örnek: `/model openrouter/moonshotai/kimi-k2`).
    - Sağlayıcıyı atlarsanız OpenClaw girdiyi şu sırayla çözer:
      1. alias eşleşmesi
      2. tam öneksiz model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesi
      3. yapılandırılmış varsayılan sağlayıcıya kullanımdan kaldırılmış fallback — bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw, eski ve kaldırılmış sağlayıcı varsayılanını yüzeye çıkarmamak için bunun yerine ilk yapılandırılmış sağlayıcı/modele fallback yapar.
  </Accordion>
</AccordionGroup>

Tam komut davranışı/config: [Slash komutları](/tr/tools/slash-commands).

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

`openclaw models` (alt komut yok) `models status` için bir kısayoldur.

### `models list`

Varsayılan olarak yapılandırılmış/kimlik doğrulaması kullanılabilir modelleri gösterir. Faydalı bayraklar:

<ParamField path="--all" type="boolean">
  Tam katalog. Kimlik doğrulaması yapılandırılmadan önce paketlenmiş, sağlayıcıya ait statik katalog satırlarını içerir; böylece yalnızca keşif amaçlı görünümler, eşleşen sağlayıcı kimlik bilgilerini ekleyene kadar kullanılamayan modelleri gösterebilir.
</ParamField>
<ParamField path="--local" type="boolean">
  Yalnızca yerel sağlayıcılar.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Sağlayıcı kimliğine göre filtrele, örneğin `moonshot`. Etkileşimli seçicilerdeki görüntü etiketleri kabul edilmez.
</ParamField>
<ParamField path="--plain" type="boolean">
  Her satırda bir model.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir çıktı.
</ParamField>

### `models status`

Çözümlenen birincil modeli, yedekleri, görüntü modelini ve yapılandırılmış sağlayıcıların kimlik doğrulaması özetini gösterir. Ayrıca kimlik doğrulaması deposunda bulunan profiller için OAuth süre sonu durumunu da gösterir (varsayılan olarak 24 saat içinde uyarır). `--plain` yalnızca çözümlenen birincil modeli yazdırır.

<AccordionGroup>
  <Accordion title="Auth and probe behavior">
    - OAuth durumu her zaman gösterilir (ve `--json` çıktısına dahil edilir). Yapılandırılmış bir sağlayıcının kimlik bilgileri yoksa, `models status` bir **Eksik kimlik doğrulaması** bölümü yazdırır.
    - JSON, `auth.oauth` (uyarı penceresi + profiller) ve `auth.providers` (env destekli kimlik bilgileri dahil, sağlayıcı başına etkin kimlik doğrulaması) içerir. `auth.oauth` yalnızca kimlik doğrulaması deposu profil sağlığıdır; yalnızca env kullanan sağlayıcılar burada görünmez.
    - Otomasyon için `--check` kullanın (eksik/süresi dolmuşsa çıkış `1`, süresi dolmak üzereyse `2`).
    - Canlı kimlik doğrulaması denetimleri için `--probe` kullanın; prob satırları kimlik doğrulaması profillerinden, env kimlik bilgilerinden veya `models.json` dosyasından gelebilir.
    - Açık `auth.order.<provider>` saklanan bir profili dışarıda bırakırsa, prob bunu denemek yerine `excluded_by_auth_order` bildirir. Kimlik doğrulaması varsa ancak bu sağlayıcı için problanabilir bir model çözümlenemiyorsa, prob `status: no_model` bildirir.

  </Accordion>
</AccordionGroup>

<Note>
Kimlik doğrulaması seçimi sağlayıcıya/hesaba bağlıdır. Sürekli açık Gateway ana makineleri için API anahtarları genellikle en öngörülebilir seçenektir; Claude CLI yeniden kullanımı ve mevcut Anthropic OAuth/token profilleri de desteklenir.
</Note>

Örnek (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Tarama (OpenRouter ücretsiz modelleri)

`openclaw models scan`, OpenRouter'ın **ücretsiz model kataloğunu** inceler ve isteğe bağlı olarak modelleri araç ve görüntü desteği için problayabilir.

<ParamField path="--no-probe" type="boolean">
  Canlı probları atla (yalnızca meta veriler).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  En düşük parametre boyutu (milyar).
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
OpenRouter `/models` kataloğu herkese açıktır; bu nedenle yalnızca meta veri taramaları, anahtar olmadan ücretsiz adayları listeleyebilir. Problama ve çıkarım yine de bir OpenRouter API anahtarı gerektirir (kimlik doğrulaması profillerinden veya `OPENROUTER_API_KEY` üzerinden). Anahtar yoksa, `openclaw models scan` yalnızca meta veri çıktısına geri döner ve yapılandırmayı değiştirmez. Yalnızca meta veri modunu açıkça istemek için `--no-probe` kullanın.
</Note>

Tarama sonuçları şuna göre sıralanır:

1. Görüntü desteği
2. Araç gecikmesi
3. Bağlam boyutu
4. Parametre sayısı

Girdi:

- OpenRouter `/models` listesi (`:free` filtresi)
- Canlı problar, kimlik doğrulaması profillerinden veya `OPENROUTER_API_KEY` üzerinden OpenRouter API anahtarı gerektirir (bkz. [Ortam değişkenleri](/tr/help/environment))
- İsteğe bağlı filtreler: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- İstek/prob denetimleri: `--timeout`, `--concurrency`

Canlı problar bir TTY içinde çalıştığında, yedekleri etkileşimli olarak seçebilirsiniz. Etkileşimsiz modda varsayılanları kabul etmek için `--yes` iletin. Yalnızca meta veri sonuçları bilgilendirme amaçlıdır; OpenClaw'ın kullanılamaz, anahtarsız bir OpenRouter modeli yapılandırmaması için `--set-default` ve `--set-image` canlı problar gerektirir.

## Model kayıt defteri (`models.json`)

`models.providers` içindeki özel sağlayıcılar, aracı dizini altında `models.json` dosyasına yazılır (varsayılan `~/.openclaw/agents/<agentId>/agent/models.json`). `models.mode` `replace` olarak ayarlanmadıkça bu dosya varsayılan olarak birleştirilir.

<AccordionGroup>
  <Accordion title="Merge mode precedence">
    Eşleşen sağlayıcı kimlikleri için birleştirme modu önceliği:

    - Aracı `models.json` dosyasında zaten bulunan boş olmayan `baseUrl` kazanır.
    - Aracı `models.json` dosyasındaki boş olmayan `apiKey`, yalnızca bu sağlayıcı geçerli yapılandırma/kimlik doğrulaması profili bağlamında SecretRef tarafından yönetilmiyorsa kazanır.
    - SecretRef tarafından yönetilen sağlayıcı `apiKey` değerleri, çözümlenmiş sırları kalıcı hale getirmek yerine kaynak işaretleyicilerinden (env ref'leri için `ENV_VAR_NAME`, dosya/exec ref'leri için `secretref-managed`) yenilenir.
    - SecretRef tarafından yönetilen sağlayıcı başlık değerleri, kaynak işaretleyicilerinden (env ref'leri için `secretref-env:ENV_VAR_NAME`, dosya/exec ref'leri için `secretref-managed`) yenilenir.
    - Boş veya eksik aracı `apiKey`/`baseUrl`, yapılandırma `models.providers` değerlerine geri döner.
    - Diğer sağlayıcı alanları yapılandırmadan ve normalleştirilmiş katalog verilerinden yenilenir.

  </Accordion>
</AccordionGroup>

<Note>
İşaretleyici kalıcılığı kaynak otoritelidir: OpenClaw, işaretleyicileri çözümlenmiş çalışma zamanı sırrı değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden (çözümleme öncesi) yazar. Bu, `openclaw agent` gibi komut odaklı yollar dahil olmak üzere OpenClaw `models.json` dosyasını her yeniden oluşturduğunda geçerlidir.
</Note>

## İlgili

- [Aracı çalışma zamanları](/tr/concepts/agent-runtimes) — PI, Codex ve diğer aracı döngüsü çalışma zamanları
- [Yapılandırma başvurusu](/tr/gateway/config-agents#agent-defaults) — model yapılandırma anahtarları
- [Görüntü oluşturma](/tr/tools/image-generation) — görüntü modeli yapılandırması
- [Model yük devri](/tr/concepts/model-failover) — yedek zincirleri
- [Model sağlayıcıları](/tr/concepts/model-providers) — sağlayıcı yönlendirmesi ve kimlik doğrulaması
- [Müzik oluşturma](/tr/tools/music-generation) — müzik modeli yapılandırması
- [Video oluşturma](/tr/tools/video-generation) — video modeli yapılandırması
