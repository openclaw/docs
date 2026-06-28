---
read_when:
    - Modeller CLI'sını ekleme veya değiştirme (models list/set/scan/aliases/fallbacks)
    - Model yedek davranışını veya seçim kullanıcı deneyimini değiştirme
    - Model tarama probları güncelleniyor (araçlar/görseller)
sidebarTitle: Models CLI
summary: 'Modeller CLI: listeleme, ayarlama, takma adlar, yedekler, tarama, durum'
title: Modeller CLI
x-i18n:
    generated_at: "2026-06-28T00:29:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c7d4cbe1e0854a281f57f39dac9ac5f54c65f50da08cf37dfd298f8f1dd5536
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Model yük devretme" href="/tr/concepts/model-failover">
    Kimlik doğrulama profili rotasyonu, bekleme süreleri ve bunun yedeklerle nasıl etkileştiği.
  </Card>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers">
    Hızlı sağlayıcı özeti ve örnekler.
  </Card>
  <Card title="Ajan çalışma zamanları" href="/tr/concepts/agent-runtimes">
    OpenClaw, Codex ve diğer ajan döngüsü çalışma zamanları.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/config-agents#agent-defaults">
    Model yapılandırma anahtarları.
  </Card>
</CardGroup>

Model ref'leri bir sağlayıcı ve model seçer. Genellikle düşük seviyeli ajan çalışma zamanını seçmezler. OpenAI ajan ref'leri ana istisnadır: `openai/gpt-5.5`, resmi OpenAI sağlayıcısında varsayılan olarak Codex app-server çalışma zamanı üzerinden çalışır. Abonelik Copilot ref'leri (`github-copilot/*`) ayrıca harici GitHub Copilot ajan çalışma zamanı Plugin'ine dahil edilebilir; bu yol açık kalır (`auto` yedeği yoktur). Açık çalışma zamanı geçersiz kılmaları tüm ajan veya oturum üzerinde değil, sağlayıcı/model ilkesi üzerinde yer alır. Codex çalışma zamanı modunda, `openai/gpt-*` ref'i API anahtarı faturalandırması anlamına gelmez; kimlik doğrulama bir Codex hesabından veya `openai` OAuth profilinden gelebilir. Bkz. [Ajan çalışma zamanları](/tr/concepts/agent-runtimes) ve [GitHub Copilot ajan çalışma zamanı](/tr/plugins/copilot).

## Model seçimi nasıl çalışır

OpenClaw modelleri şu sırayla seçer:

<Steps>
  <Step title="Birincil model">
    `agents.defaults.model.primary` (veya `agents.defaults.model`).
  </Step>
  <Step title="Yedekler">
    `agents.defaults.model.fallbacks` (sırayla).
  </Step>
  <Step title="Sağlayıcı kimlik doğrulama yük devretmesi">
    Kimlik doğrulama yük devretmesi, sonraki modele geçmeden önce sağlayıcı içinde gerçekleşir.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="İlgili model yüzeyleri">
    - `agents.defaults.models`, OpenClaw'ın kullanabileceği modellerin izin listesi/kataloğudur (takma adlarla birlikte). Sağlayıcı keşfini dinamik tutarken görünür sağlayıcıları sınırlamak için `provider/*` girdilerini kullanın.
    - `agents.defaults.imageModel`, **yalnızca** birincil model görüntü kabul edemediğinde kullanılır.
    - `agents.defaults.pdfModel`, `pdf` aracı tarafından kullanılır. Atlanırsa araç `agents.defaults.imageModel` değerine, ardından çözümlenen oturum/varsayılan modele geri döner.
    - `agents.defaults.imageGenerationModel`, paylaşılan görüntü oluşturma yeteneği tarafından kullanılır. Atlanırsa `image_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanı çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından kalan kayıtlı görüntü oluşturma sağlayıcılarını sağlayıcı kimliği sırasına göre dener. Belirli bir sağlayıcı/model ayarlarsanız, o sağlayıcının kimlik doğrulamasını/API anahtarını da yapılandırın.
    - `agents.defaults.musicGenerationModel`, paylaşılan müzik oluşturma yeteneği tarafından kullanılır. Atlanırsa `music_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanı çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından kalan kayıtlı müzik oluşturma sağlayıcılarını sağlayıcı kimliği sırasına göre dener. Belirli bir sağlayıcı/model ayarlarsanız, o sağlayıcının kimlik doğrulamasını/API anahtarını da yapılandırın.
    - `agents.defaults.videoGenerationModel`, paylaşılan video oluşturma yeteneği tarafından kullanılır. Atlanırsa `video_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanı çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından kalan kayıtlı video oluşturma sağlayıcılarını sağlayıcı kimliği sırasına göre dener. Belirli bir sağlayıcı/model ayarlarsanız, o sağlayıcının kimlik doğrulamasını/API anahtarını da yapılandırın.
    - Ajan başına varsayılanlar, `agents.list[].model` artı bağlamalar üzerinden `agents.defaults.model` değerini geçersiz kılabilir (bkz. [Çok ajanlı yönlendirme](/tr/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Seçim kaynağı ve yedek davranışı

Aynı `provider/model`, nereden geldiğine bağlı olarak farklı şeyler ifade edebilir:

- Yapılandırılmış varsayılanlar (`agents.defaults.model.primary` ve ajana özgü birinciller) normal başlangıç noktasıdır ve `agents.defaults.model.fallbacks` kullanır.
- Otomatik yedek seçimleri geçici kurtarma durumudur. Sonraki turların bilinen bozuk bir birincili her seferinde yoklamadan yedek zincirini kullanmaya devam edebilmesi için `modelOverrideSource: "auto"` ile saklanırlar; OpenClaw özgün birincili düzenli olarak tekrar yoklar, toparlandığında otomatik seçimi temizler ve yedek/toparlanma geçişlerini durum değişikliği başına bir kez duyurur.
- Kullanıcı oturum seçimleri kesindir. `/model`, model seçici, `session_status(model=...)` ve `sessions.patch`, `modelOverrideSource: "user"` saklar; seçilen sağlayıcı/model erişilemezse OpenClaw başka bir yapılandırılmış modele düşmek yerine görünür şekilde başarısız olur.
- `agents.defaults.model.primary` değiştirmek mevcut oturum seçimlerini yeniden yazmaz. Durum `This session is pinned to X; config primary Y will apply to new/unpinned sessions.` diyorsa, geçerli oturum seçimini `/model default` ile temizleyin; böylece yapılandırılmış birincili tekrar devralır.
- Cron `--model` / yük `model`, iş başına bir birincildir. İş açık yük `fallbacks` sağlamadığı sürece yapılandırılmış yedekleri kullanmaya devam eder (katı bir cron çalıştırması için `fallbacks: []` kullanın).
- CLI varsayılan model ve izin listesi seçicileri, tam yerleşik kataloğu yüklemek yerine açık `models.providers.*.models` değerlerini listeleyerek `models.mode: "replace"` ayarına uyar.
- Control UI model seçici, Gateway'den yapılandırılmış model görünümünü ister: varsa sağlayıcı genelinde `provider/*` girdileri dahil `agents.defaults.models`, yoksa açık `models.providers.*.models` artı kullanılabilir kimlik doğrulamaya sahip sağlayıcılar. Tam yerleşik katalog, `view: "all"` ile `models.list` veya `openclaw models list --all` gibi açık göz atma görünümleri için ayrılmıştır.

## Hızlı model ilkesi

- Birincilinizi erişebildiğiniz en güçlü en yeni nesil modele ayarlayın.
- Maliyet/gecikme duyarlı görevler ve daha düşük riskli sohbet için yedekleri kullanın.
- Araç etkin ajanlar veya güvenilmeyen girdiler için daha eski/zayıf model katmanlarından kaçının.

## İlk kurulum (önerilir)

Yapılandırmayı elle düzenlemek istemiyorsanız ilk kurulumu çalıştırın:

```bash
openclaw onboard
```

Yaygın sağlayıcılar için model + kimlik doğrulama kurabilir; buna **OpenAI Code (Codex) aboneliği** (OAuth) ve **Anthropic** (API anahtarı veya Claude CLI) dahildir.

## Yapılandırma anahtarları (genel bakış)

- `agents.defaults.model.primary` ve `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` ve `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` ve `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` ve `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` ve `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (izin listesi + takma adlar + sağlayıcı parametreleri + `provider/*` dinamik sağlayıcı girdileri)
- `models.providers` (`models.json` içine yazılan özel sağlayıcılar)

<Note>
Model ref'leri küçük harfe normalize edilir. Sağlayıcı kimlikleri bunun dışında birebirdir; plugin'in duyurduğu
sağlayıcı kimliğini kullanın.

Sağlayıcı yapılandırma örnekleri (OpenCode dahil) [OpenCode](/tr/providers/opencode) içinde bulunur.
</Note>

### Güvenli izin listesi düzenlemeleri

`agents.defaults.models` değerini elle güncellerken eklemeli yazmaları kullanın:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Üzerine yazma koruması kuralları">
    `openclaw config set`, model/sağlayıcı eşlemelerini kazara üzerine yazmalardan korur. Mevcut girdileri kaldıracaksa `agents.defaults.models`, `models.providers` veya `models.providers.<id>.models` için düz nesne ataması reddedilir. Eklemeli değişiklikler için `--merge` kullanın; `--replace` yalnızca sağlanan değer tam hedef değer olmalıysa kullanın.

    Etkileşimli sağlayıcı kurulumu ve `openclaw configure --section model` de sağlayıcı kapsamlı seçimleri mevcut izin listesine birleştirir; böylece Codex, Ollama veya başka bir sağlayıcı eklemek ilgisiz model girdilerini düşürmez. Configure, sağlayıcı kimlik doğrulaması yeniden uygulandığında mevcut `agents.defaults.model.primary` değerini korur. `openclaw models auth login --provider <id> --set-default` ve `openclaw models set <model>` gibi açık varsayılan ayarlama komutları yine de `agents.defaults.model.primary` değerini değiştirir.

  </Accordion>
</AccordionGroup>

## "Model is not allowed" (ve yanıtların neden durduğu)

`agents.defaults.models` ayarlanırsa `/model` ve oturum geçersiz kılmaları için **izin listesi** haline gelir. Bir kullanıcı bu izin listesinde olmayan bir model seçtiğinde OpenClaw şunu döndürür:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
Bu, normal bir yanıt oluşturulmadan **önce** gerçekleşir; bu yüzden mesaj "yanıt vermemiş" gibi hissettirebilir. Çözüm şunlardan biridir:

- Modeli `agents.defaults.models` değerine ekleyin veya
- İzin listesini temizleyin (`agents.defaults.models` değerini kaldırın) veya
- `/model list` içinden bir model seçin.

</Warning>

Reddedilen komut `/model openai/gpt-5.5 --runtime codex` gibi bir çalışma zamanı geçersiz kılması içeriyorsa önce izin listesini düzeltin, ardından aynı `/model ... --runtime ...` komutunu tekrar deneyin. Yerel Codex yürütmesi için seçilen model yine `openai/gpt-5.5` olur; `codex` çalışma zamanı harness'i seçer ve Codex kimlik doğrulamasını ayrı kullanır.

Yerel/GGUF modeller için izin listesinde tam sağlayıcı önekli ref'i saklayın;
örneğin `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` veya
`openclaw models list --provider <provider>` tarafından gösterilen tam
sağlayıcı/model. İzin listesi etkinken çıplak yerel dosya adları veya görünen
adlar yeterli değildir.

Her modeli elle listelemeden sağlayıcıları sınırlamak istiyorsanız
`agents.defaults.models` değerine `provider/*` girdileri ekleyin:

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

Bu ilkeyle `/model`, `/models` ve model seçiciler yalnızca bu sağlayıcılar için
keşfedilen kataloğu gösterir. Seçilen sağlayıcılardan gelen yeni modeller
izin listesini düzenlemeden görünebilir. Başka bir sağlayıcıdan tek bir belirli
modele ihtiyaç duyduğunuzda tam `provider/model` girdileri `provider/*` girdileriyle karıştırılabilir.

Örnek izin listesi yapılandırması:

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

## Sohbette model değiştirme (`/model`)

Yeniden başlatmadan geçerli oturum için modelleri değiştirebilirsiniz:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model default
/model status
```

<AccordionGroup>
  <Accordion title="Seçici davranışı">
    - `/model` (ve `/model list`) kompakt, numaralı bir seçicidir (model ailesi + kullanılabilir sağlayıcılar).
    - Discord'da `/model` ve `/models`, sağlayıcı ve model açılır menüleri ile bir Gönder adımı içeren etkileşimli bir seçici açar.
    - Telegram'da `/models` seçici seçimleri oturum kapsamlıdır; ajanın `openclaw.json` içindeki kalıcı varsayılanını değiştirmez.
    - `/models add` kullanımdan kaldırılmıştır ve artık sohbetten model kaydetmek yerine bir kullanımdan kaldırma mesajı döndürür.
    - `/model <#>` o seçiciden seçim yapar.

  </Accordion>
  <Accordion title="Kalıcılık ve canlı geçiş">
    - `/model` yeni oturum seçimini hemen kalıcı hale getirir.
    - Aracı boştaysa, sonraki çalıştırma yeni modeli hemen kullanır.
    - Bir çalıştırma zaten etkinse, OpenClaw canlı geçişi beklemede olarak işaretler ve yalnızca temiz bir yeniden deneme noktasında yeni modelle yeniden başlar.
    - Araç etkinliği veya yanıt çıktısı zaten başladıysa, bekleyen geçiş daha sonraki bir yeniden deneme fırsatına veya sonraki kullanıcı sırasına kadar kuyrukta kalabilir.
    - `/model default` oturum seçimini temizler ve oturumu yapılandırılmış varsayılan modele döndürür.
    - Kullanıcının seçtiği `/model` ref değeri o oturum için katıdır: seçilen sağlayıcı/modele ulaşılamıyorsa, yanıt `agents.defaults.model.fallbacks` içinden sessizce yanıt vermek yerine görünür biçimde başarısız olur. Bu, hâlâ fallback zincirlerini kullanabilen yapılandırılmış varsayılanlardan ve cron işi birincillerinden farklıdır.
    - `/model status` ayrıntılı görünümdür (kimlik doğrulama adayları ve yapılandırıldığında sağlayıcı uç noktası `baseUrl` + `api` modu).

  </Accordion>
  <Accordion title="Ref ayrıştırma">
    - Model ref değerleri **ilk** `/` üzerinden bölünerek ayrıştırılır. `/model <ref>` yazarken `provider/model` kullanın.
    - Model kimliğinin kendisi `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini eklemelisiniz (örnek: `/model openrouter/moonshotai/kimi-k2`).
    - Sağlayıcıyı atlarsanız, OpenClaw girdiyi şu sırayla çözer:
      1. alias eşleşmesi
      2. tam olarak o öneksiz model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesi
      3. yapılandırılmış varsayılan sağlayıcıya kullanımdan kaldırılmış fallback — bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa, OpenClaw eski ve kaldırılmış bir sağlayıcı varsayılanını yüzeye çıkarmamak için bunun yerine ilk yapılandırılmış sağlayıcı/modele geri döner.
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

Varsayılan olarak yapılandırılmış/kimlik doğrulamayla kullanılabilir modelleri gösterir. Yararlı bayraklar:

<ParamField path="--all" type="boolean">
  Tam katalog. Kimlik doğrulama yapılandırılmadan önce paketlenmiş sağlayıcıya ait statik katalog satırlarını içerir; böylece yalnızca keşif görünümleri, eşleşen sağlayıcı kimlik bilgilerini ekleyene kadar kullanılamayan modelleri gösterebilir.
</ParamField>
<ParamField path="--local" type="boolean">
  Yalnızca yerel sağlayıcılar.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Sağlayıcı kimliğine göre filtreler, örneğin `moonshot`. Etkileşimli seçicilerdeki görüntü etiketleri kabul edilmez.
</ParamField>
<ParamField path="--plain" type="boolean">
  Satır başına bir model.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir çıktı.
</ParamField>

### `models status`

Çözümlenen birincil modeli, fallback'leri, görüntü modelini ve yapılandırılmış sağlayıcıların kimlik doğrulama özetini gösterir. Ayrıca kimlik doğrulama deposunda bulunan profiller için OAuth süre sonu durumunu yüzeye çıkarır (varsayılan olarak 24 saat içinde uyarır). `--plain` yalnızca çözümlenen birincil modeli yazdırır.

<AccordionGroup>
  <Accordion title="Kimlik doğrulama ve yoklama davranışı">
    - OAuth durumu her zaman gösterilir (ve `--json` çıktısına dahil edilir). Yapılandırılmış bir sağlayıcının kimlik bilgileri yoksa, `models status` bir **Eksik kimlik doğrulama** bölümü yazdırır.
    - JSON, `auth.oauth` (uyarı penceresi + profiller) ve `auth.providers` (env destekli kimlik bilgileri dahil sağlayıcı başına etkili kimlik doğrulama) içerir. `auth.oauth` yalnızca kimlik doğrulama deposu profil sağlığıdır; yalnızca env kullanan sağlayıcılar burada görünmez.
    - Otomasyon için `--check` kullanın (eksik/süresi dolmuşsa çıkış `1`, süresi dolmak üzereyse `2`).
    - Canlı kimlik doğrulama kontrolleri için `--probe` kullanın; yoklama satırları kimlik doğrulama profillerinden, env kimlik bilgilerinden veya `models.json` içinden gelebilir.
    - Açık `auth.order.<provider>` depolanmış bir profili dışarıda bırakırsa, yoklama bunu denemek yerine `excluded_by_auth_order` bildirir. Kimlik doğrulama varsa ancak bu sağlayıcı için yoklanabilir bir model çözümlenemiyorsa, yoklama `status: no_model` bildirir.

  </Accordion>
</AccordionGroup>

<Note>
Kimlik doğrulama seçimi sağlayıcıya/hesaba bağlıdır. Sürekli açık Gateway ana makineleri için API anahtarları genellikle en öngörülebilir seçenektir; Claude CLI yeniden kullanımı ve mevcut Anthropic OAuth/token profilleri de desteklenir.
</Note>

Örnek (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Tarama (OpenRouter ücretsiz modelleri)

`openclaw models scan`, OpenRouter'ın **ücretsiz model kataloğunu** inceler ve isteğe bağlı olarak modelleri araç ve görüntü desteği için yoklayabilir.

<ParamField path="--no-probe" type="boolean">
  Canlı yoklamaları atla (yalnızca meta veri).
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
  Fallback listesi boyutu.
</ParamField>
<ParamField path="--set-default" type="boolean">
  `agents.defaults.model.primary` değerini ilk seçime ayarla.
</ParamField>
<ParamField path="--set-image" type="boolean">
  `agents.defaults.imageModel.primary` değerini ilk görüntü seçimine ayarla.
</ParamField>

<Note>
OpenRouter `/models` kataloğu herkese açıktır; bu yüzden yalnızca meta veri taramaları, anahtar olmadan ücretsiz adayları listeleyebilir. Yoklama ve çıkarım yine de bir OpenRouter API anahtarı gerektirir (kimlik doğrulama profillerinden veya `OPENROUTER_API_KEY`). Anahtar yoksa, `openclaw models scan` yalnızca meta veri çıktısına geri döner ve yapılandırmayı değiştirmeden bırakır. Yalnızca meta veri modunu açıkça istemek için `--no-probe` kullanın.
</Note>

Tarama sonuçları şuna göre sıralanır:

1. Görüntü desteği
2. Araç gecikmesi
3. Bağlam boyutu
4. Parametre sayısı

Girdi:

- OpenRouter `/models` listesi (filtre `:free`)
- Canlı yoklamalar, kimlik doğrulama profillerinden veya `OPENROUTER_API_KEY` içinden OpenRouter API anahtarı gerektirir (bkz. [Ortam değişkenleri](/tr/help/environment))
- İsteğe bağlı filtreler: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- İstek/yoklama denetimleri: `--timeout`, `--concurrency`

Canlı yoklamalar bir TTY içinde çalıştığında, fallback'leri etkileşimli olarak seçebilirsiniz. Etkileşimsiz modda varsayılanları kabul etmek için `--yes` iletin. Yalnızca meta veri sonuçları bilgilendirme amaçlıdır; `--set-default` ve `--set-image`, OpenClaw'ın kullanılamaz anahtarsız bir OpenRouter modeli yapılandırmaması için canlı yoklamalar gerektirir.

## Modeller kayıt defteri (`models.json`)

`models.providers` içindeki özel sağlayıcılar, aracı dizini altında `models.json` içine yazılır (varsayılan `~/.openclaw/agents/<agentId>/agent/models.json`). Sağlayıcı-Plugin katalogları, aracının Plugin durumu altında oluşturulmuş Plugin'e ait katalog parçaları olarak saklanır ve otomatik yüklenir. Bu dosya, `models.mode` `replace` olarak ayarlanmadığı sürece varsayılan olarak birleştirilir.

<AccordionGroup>
  <Accordion title="Birleştirme modu önceliği">
    Eşleşen sağlayıcı kimlikleri için birleştirme modu önceliği:

    - Aracı `models.json` içinde zaten bulunan boş olmayan `baseUrl` kazanır.
    - Aracı `models.json` içindeki boş olmayan `apiKey`, yalnızca bu sağlayıcı mevcut yapılandırma/kimlik doğrulama profili bağlamında SecretRef tarafından yönetilmiyorsa kazanır.
    - SecretRef tarafından yönetilen sağlayıcı `apiKey` değerleri, çözümlenmiş sırları kalıcı hale getirmek yerine kaynak işaretçilerinden (env ref değerleri için `ENV_VAR_NAME`, file/exec ref değerleri için `secretref-managed`) yenilenir.
    - SecretRef tarafından yönetilen sağlayıcı header değerleri, kaynak işaretçilerinden (env ref değerleri için `secretref-env:ENV_VAR_NAME`, file/exec ref değerleri için `secretref-managed`) yenilenir.
    - Boş veya eksik aracı `apiKey`/`baseUrl`, yapılandırma `models.providers` değerlerine geri döner.
    - Diğer sağlayıcı alanları yapılandırmadan ve normalleştirilmiş katalog verilerinden yenilenir.

  </Accordion>
</AccordionGroup>

<Note>
İşaretçi kalıcılığı kaynak yetkilidir: OpenClaw işaretçileri çözümlenmiş çalışma zamanı sır değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden (çözümleme öncesi) yazar. Bu, OpenClaw `models.json` dosyasını yeniden oluşturduğunda, `openclaw agent` gibi komut odaklı yollar dahil her zaman geçerlidir.
</Note>

## İlgili

- [Aracı çalışma zamanları](/tr/concepts/agent-runtimes) — OpenClaw, Codex ve diğer aracı döngüsü çalışma zamanları
- [Yapılandırma başvurusu](/tr/gateway/config-agents#agent-defaults) — model yapılandırma anahtarları
- [Görüntü oluşturma](/tr/tools/image-generation) — görüntü modeli yapılandırması
- [Model devretme](/tr/concepts/model-failover) — fallback zincirleri
- [Model sağlayıcıları](/tr/concepts/model-providers) — sağlayıcı yönlendirme ve kimlik doğrulama
- [Müzik oluşturma](/tr/tools/music-generation) — müzik modeli yapılandırması
- [Video oluşturma](/tr/tools/video-generation) — video modeli yapılandırması
