---
read_when:
    - Models CLI'yi ekleme veya değiştirme (models list/set/scan/aliases/fallbacks)
    - Model yedek davranışını veya seçim UX'ini değiştirme
    - Model tarama sondalarını güncelleme (araçlar/görseller)
sidebarTitle: Models CLI
summary: 'Models CLI: listele, ayarla, takma adlar, yedekler, tara, durum'
title: Models CLI
x-i18n:
    generated_at: "2026-04-26T11:27:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: d70dfb3f69532c6bfff5d8854ee7a5db3134e5ede3e1875410cea95072ca42a0
    source_path: concepts/models.md
    workflow: 15
---

<CardGroup cols={2}>
  <Card title="Model yedekleme" href="/tr/concepts/model-failover">
    Kimlik doğrulama profili döndürme, soğuma süreleri ve bunların yedeklerle nasıl etkileştiği.
  </Card>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers">
    Hızlı sağlayıcı genel bakışı ve örnekler.
  </Card>
  <Card title="Ajan çalışma zamanları" href="/tr/concepts/agent-runtimes">
    Pi, Codex ve diğer ajan döngüsü çalışma zamanları.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/config-agents#agent-defaults">
    Model yapılandırma anahtarları.
  </Card>
</CardGroup>

Model referansları bir sağlayıcı ve model seçer. Genellikle düşük seviyeli ajan çalışma zamanını seçmezler. Örneğin `openai/gpt-5.5`, `agents.defaults.agentRuntime.id` değerine bağlı olarak normal OpenAI sağlayıcı yolu üzerinden veya Codex uygulama sunucusu çalışma zamanı üzerinden çalışabilir. Bkz. [Ajan çalışma zamanları](/tr/concepts/agent-runtimes).

## Model seçimi nasıl çalışır

OpenClaw modelleri şu sırayla seçer:

<Steps>
  <Step title="Birincil model">
    `agents.defaults.model.primary` (veya `agents.defaults.model`).
  </Step>
  <Step title="Yedekler">
    `agents.defaults.model.fallbacks` (sırayla).
  </Step>
  <Step title="Sağlayıcı kimlik doğrulama yedeklemesi">
    Kimlik doğrulama yedeklemesi, sonraki modele geçmeden önce bir sağlayıcının içinde gerçekleşir.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="İlgili model yüzeyleri">
    - `agents.defaults.models`, OpenClaw'un kullanabildiği modellerin izin listesi/kataloğudur (artı takma adlar).
    - `agents.defaults.imageModel`, **yalnızca** birincil model görsel kabul edemediğinde kullanılır.
    - `agents.defaults.pdfModel`, `pdf` aracı tarafından kullanılır. Atlanırsa araç sırayla `agents.defaults.imageModel`, sonra çözümlenen oturum/varsayılan modele geri döner.
    - `agents.defaults.imageGenerationModel`, paylaşılan görsel üretim yeteneği tarafından kullanılır. Atlanırsa `image_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanını çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, sonra kayıtlı kalan görsel üretim sağlayıcılarını sağlayıcı kimliği sırasıyla dener. Belirli bir sağlayıcı/model ayarlarsanız, o sağlayıcının kimlik doğrulamasını/API anahtarını da yapılandırın.
    - `agents.defaults.musicGenerationModel`, paylaşılan müzik üretim yeteneği tarafından kullanılır. Atlanırsa `music_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanını çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, sonra kayıtlı kalan müzik üretim sağlayıcılarını sağlayıcı kimliği sırasıyla dener. Belirli bir sağlayıcı/model ayarlarsanız, o sağlayıcının kimlik doğrulamasını/API anahtarını da yapılandırın.
    - `agents.defaults.videoGenerationModel`, paylaşılan video üretim yeteneği tarafından kullanılır. Atlanırsa `video_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanını çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, sonra kayıtlı kalan video üretim sağlayıcılarını sağlayıcı kimliği sırasıyla dener. Belirli bir sağlayıcı/model ayarlarsanız, o sağlayıcının kimlik doğrulamasını/API anahtarını da yapılandırın.
    - Ajan başına varsayılanlar, `agents.list[].model` artı bindings üzerinden `agents.defaults.model` değerini geçersiz kılabilir (bkz. [Çoklu ajan yönlendirme](/tr/concepts/multi-agent)).
  </Accordion>
</AccordionGroup>

## Hızlı model politikası

- Birincil modelinizi, sizin için erişilebilir en güçlü yeni nesil model olarak ayarlayın.
- Maliyet/gecikme duyarlı görevler ve daha düşük riskli sohbetler için yedekler kullanın.
- Araç etkin ajanlar veya güvenilmeyen girdiler için eski/zayıf model katmanlarından kaçının.

## İlk kurulum (önerilir)

Yapılandırmayı elle düzenlemek istemiyorsanız ilk kurulumu çalıştırın:

```bash
openclaw onboard
```

Bu, **OpenAI Code (Codex) aboneliği** (OAuth) ve **Anthropic** (API anahtarı veya Claude CLI) dahil yaygın sağlayıcılar için model + kimlik doğrulamayı ayarlayabilir.

## Yapılandırma anahtarları (genel bakış)

- `agents.defaults.model.primary` ve `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` ve `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` ve `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` ve `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` ve `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (izin listesi + takma adlar + sağlayıcı parametreleri)
- `models.providers` (`models.json` içine yazılan özel sağlayıcılar)

<Note>
Model referansları küçük harfe normalize edilir. `z.ai/*` gibi sağlayıcı takma adları `zai/*` olarak normalize edilir.

OpenCode dahil sağlayıcı yapılandırma örnekleri [OpenCode](/tr/providers/opencode) içinde bulunur.
</Note>

### Güvenli izin listesi düzenlemeleri

`agents.defaults.models` değerini elle güncellerken eklemeli yazımları kullanın:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Ezme koruması kuralları">
    `openclaw config set`, model/sağlayıcı map'lerini kazara ezmeye karşı korur. `agents.defaults.models`, `models.providers` veya `models.providers.<id>.models` üzerine düz nesne ataması, mevcut girdileri kaldıracaksa reddedilir. Eklemeli değişiklikler için `--merge` kullanın; yalnızca sağlanan değerin hedefin tamamı olması gerektiğinde `--replace` kullanın.

    Etkileşimli sağlayıcı kurulumu ve `openclaw configure --section model` de sağlayıcı kapsamlı seçimleri mevcut izin listesine birleştirir; böylece Codex, Ollama veya başka bir sağlayıcı eklemek ilgisiz model girdilerini düşürmez. Configure, sağlayıcı kimlik doğrulaması yeniden uygulandığında mevcut `agents.defaults.model.primary` değerini korur. `openclaw models auth login --provider <id> --set-default` ve `openclaw models set <model>` gibi açık varsayılan ayarlama komutları ise yine `agents.defaults.model.primary` değerini değiştirir.

  </Accordion>
</AccordionGroup>

## "Modele izin verilmiyor" (ve yanıtlar neden durur)

`agents.defaults.models` ayarlanmışsa, `/model` ve oturum geçersiz kılmaları için **izin listesi** haline gelir. Kullanıcı bu izin listesinde olmayan bir modeli seçtiğinde OpenClaw şunu döndürür:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Bu, normal bir yanıt oluşturulmadan **önce** gerçekleşir; bu nedenle mesaj "yanıt vermemiş" gibi hissedilebilir. Çözüm şunlardan biridir:

- Modeli `agents.defaults.models` içine eklemek veya
- İzin listesini temizlemek (`agents.defaults.models` değerini kaldırmak) veya
- `/model list` içinden bir model seçmek.
  </Warning>

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

Yeniden başlatmadan geçerli oturum için model değiştirebilirsiniz:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="Seçici davranışı">
    - `/model` (ve `/model list`) kompakt, numaralandırılmış bir seçicidir (model ailesi + kullanılabilir sağlayıcılar).
    - Discord'da `/model` ve `/models`, sağlayıcı ve model açılır listeleri ile bir Gönder adımı içeren etkileşimli bir seçici açar.
    - `/models add` artık kullanımdan kaldırılmıştır ve sohbetten model kaydetmek yerine kullanımdan kaldırma mesajı döndürür.
    - `/model <#>`, o seçiciden seçim yapar.
  </Accordion>
  <Accordion title="Kalıcılık ve canlı değiştirme">
    - `/model`, yeni oturum seçimini anında kalıcı hale getirir.
    - Ajan boşta ise sonraki çalışma yeni modeli hemen kullanır.
    - Bir çalışma zaten etkinse OpenClaw canlı değişikliği beklemede olarak işaretler ve yalnızca temiz bir yeniden deneme noktasında yeni modele yeniden başlar.
    - Araç etkinliği veya yanıt çıktısı zaten başladıysa bekleyen değişiklik daha sonraki bir yeniden deneme fırsatına veya sonraki kullanıcı dönüşüne kadar kuyrukta kalabilir.
    - `/model status` ayrıntılı görünümdür (kimlik doğrulama adayları ve yapılandırılmışsa sağlayıcı uç nokta `baseUrl` + `api` modu).
  </Accordion>
  <Accordion title="Ref ayrıştırma">
    - Model referansları **ilk** `/` karakterinden bölünerek ayrıştırılır. `/model <ref>` yazarken `provider/model` kullanın.
    - Model kimliğinin kendisi `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini eklemelisiniz (örnek: `/model openrouter/moonshotai/kimi-k2`).
    - Sağlayıcıyı atlarsanız OpenClaw girdiyi şu sırayla çözümler:
      1. takma ad eşleşmesi
      2. tam aynı öneksiz model kimliği için tekil yapılandırılmış sağlayıcı eşleşmesi
      3. yapılandırılmış varsayılan sağlayıcıya eski yedek geri dönüşü — bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw eski kaldırılmış-sağlayıcı varsayılanını göstermemek için bunun yerine ilk yapılandırılmış sağlayıcı/modele geri döner.
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

Varsayılan olarak yapılandırılmış modelleri gösterir. Yararlı bayraklar:

<ParamField path="--all" type="boolean">
  Tam katalog. Kimlik doğrulama yapılandırılmadan önce birlikte gelen sağlayıcıya ait statik katalog satırlarını içerir; böylece yalnızca keşif amaçlı görünümler, eşleşen sağlayıcı kimlik bilgilerini ekleyene kadar kullanılamayan modelleri gösterebilir.
</ParamField>
<ParamField path="--local" type="boolean">
  Yalnızca yerel sağlayıcılar.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Sağlayıcı kimliğine göre filtreler, örneğin `moonshot`. Etkileşimli seçicilerdeki görünen etiketler kabul edilmez.
</ParamField>
<ParamField path="--plain" type="boolean">
  Satır başına bir model.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir çıktı.
</ParamField>

### `models status`

Çözümlenen birincil modeli, yedekleri, görsel modelini ve yapılandırılmış sağlayıcıların kimlik doğrulama genel görünümünü gösterir. Ayrıca kimlik doğrulama deposunda bulunan profiller için OAuth sona erme durumunu da gösterir (varsayılan olarak 24 saat içinde uyarır). `--plain` yalnızca çözümlenen birincil modeli yazdırır.

<AccordionGroup>
  <Accordion title="Kimlik doğrulama ve sonda davranışı">
    - OAuth durumu her zaman gösterilir (ve `--json` çıktısına dahil edilir). Yapılandırılmış bir sağlayıcının kimlik bilgisi yoksa `models status`, **Eksik kimlik doğrulama** bölümü yazdırır.
    - JSON; `auth.oauth` (uyarı penceresi + profiller) ve `auth.providers` (ortam destekli kimlik bilgileri dahil sağlayıcı başına etkin kimlik doğrulama) içerir. `auth.oauth` yalnızca auth-store profil sağlığı içindir; yalnızca ortam kullanan sağlayıcılar burada görünmez.
    - Otomasyon için `--check` kullanın (eksik/süresi dolmuşsa çıkış `1`, süresi dolmak üzereyse `2`).
    - Canlı kimlik doğrulama kontrolleri için `--probe` kullanın; sonda satırları auth profillerinden, ortam kimlik bilgilerinden veya `models.json` dosyasından gelebilir.
    - Açık `auth.order.<provider>` kayıtlı bir profili atlıyorsa sonda, bunu denemek yerine `excluded_by_auth_order` bildirir. Kimlik doğrulama varsa ancak o sağlayıcı için sondalanabilir bir model çözümlenemiyorsa sonda `status: no_model` bildirir.
  </Accordion>
</AccordionGroup>

<Note>
Kimlik doğrulama seçimi sağlayıcıya/hesaba bağlıdır. Her zaman açık gateway host'ları için API anahtarları genellikle en öngörülebilir seçenektir; Claude CLI yeniden kullanımı ve mevcut Anthropic OAuth/token profilleri de desteklenir.
</Note>

Örnek (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Tarama (OpenRouter ücretsiz modelleri)

`openclaw models scan`, OpenRouter'ın **ücretsiz model kataloğunu** inceler ve isteğe bağlı olarak modelleri araç ve görsel desteği için sondalayabilir.

<ParamField path="--no-probe" type="boolean">
  Canlı sondaları atla (yalnızca meta veriler).
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
  `agents.defaults.model.primary` değerini ilk seçime ayarlar.
</ParamField>
<ParamField path="--set-image" type="boolean">
  `agents.defaults.imageModel.primary` değerini ilk görsel seçimine ayarlar.
</ParamField>

<Note>
OpenRouter `/models` kataloğu herkese açıktır; bu nedenle yalnızca meta veri taramaları anahtar olmadan ücretsiz adayları listeleyebilir. Sondalama ve çıkarım için yine de bir OpenRouter API anahtarı gerekir (kimlik doğrulama profillerinden veya `OPENROUTER_API_KEY` içinden). Kullanılabilir bir anahtar yoksa `openclaw models scan` yalnızca meta veri çıktısına geri döner ve yapılandırmayı değiştirmez. Yalnızca meta veri kipini açıkça istemek için `--no-probe` kullanın.
</Note>

Tarama sonuçları şu ölçütlere göre sıralanır:

1. Görsel desteği
2. Araç gecikmesi
3. Bağlam boyutu
4. Parametre sayısı

Girdi:

- OpenRouter `/models` listesi (`:free` filtresi)
- Canlı sondalar, auth profillerinden veya `OPENROUTER_API_KEY` içinden OpenRouter API anahtarı gerektirir (bkz. [Ortam değişkenleri](/tr/help/environment))
- İsteğe bağlı filtreler: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- İstek/sonda denetimleri: `--timeout`, `--concurrency`

Canlı sondalar bir TUI içinde çalıştığında, yedekleri etkileşimli olarak seçebilirsiniz. Etkileşimsiz kipte, varsayılanları kabul etmek için `--yes` geçin. Yalnızca meta veri sonuçları bilgilendirme amaçlıdır; `--set-default` ve `--set-image` canlı sondalar gerektirir, böylece OpenClaw kullanılamaz, anahtarsız bir OpenRouter modelini yapılandırmaz.

## Modeller kayıt defteri (`models.json`)

`models.providers` içindeki özel sağlayıcılar, ajan dizini altındaki `models.json` içine yazılır (varsayılan `~/.openclaw/agents/<agentId>/agent/models.json`). `models.mode`, `replace` olarak ayarlanmadığı sürece bu dosya varsayılan olarak birleştirilir.

<AccordionGroup>
  <Accordion title="Birleştirme kipi önceliği">
    Eşleşen sağlayıcı kimlikleri için birleştirme kipi önceliği:

    - Ajan `models.json` içinde zaten bulunan boş olmayan `baseUrl` kazanır.
    - Ajan `models.json` içindeki boş olmayan `apiKey`, yalnızca bu sağlayıcı geçerli yapılandırma/auth-profile bağlamında SecretRef tarafından yönetilmiyorsa kazanır.
    - SecretRef tarafından yönetilen sağlayıcı `apiKey` değerleri, çözümlenmiş sırları kalıcılaştırmak yerine kaynak işaretleyicilerden (`env` ref'leri için `ENV_VAR_NAME`, `file`/`exec` ref'leri için `secretref-managed`) yenilenir.
    - SecretRef tarafından yönetilen sağlayıcı başlık değerleri, kaynak işaretleyicilerden (`env` ref'leri için `secretref-env:ENV_VAR_NAME`, `file`/`exec` ref'leri için `secretref-managed`) yenilenir.
    - Boş veya eksik ajan `apiKey`/`baseUrl` değerleri, yapılandırmadaki `models.providers` değerine geri döner.
    - Diğer sağlayıcı alanları yapılandırmadan ve normalize edilmiş katalog verilerinden yenilenir.

  </Accordion>
</AccordionGroup>

<Note>
İşaretleyici kalıcılığı kaynak açısından yetkilidir: OpenClaw, çözümlenmiş çalışma zamanı gizli değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden (çözümleme öncesi) işaretleyiciler yazar. Bu, `openclaw agent` gibi komut güdümlü yollar dahil, OpenClaw `models.json` dosyasını her yeniden oluşturduğunda geçerlidir.
</Note>

## İlgili

- [Ajan çalışma zamanları](/tr/concepts/agent-runtimes) — Pi, Codex ve diğer ajan döngüsü çalışma zamanları
- [Yapılandırma başvurusu](/tr/gateway/config-agents#agent-defaults) — model yapılandırma anahtarları
- [Görsel üretimi](/tr/tools/image-generation) — görsel model yapılandırması
- [Model yedeklemesi](/tr/concepts/model-failover) — yedek zincirleri
- [Model sağlayıcıları](/tr/concepts/model-providers) — sağlayıcı yönlendirme ve kimlik doğrulama
- [Müzik üretimi](/tr/tools/music-generation) — müzik model yapılandırması
- [Video üretimi](/tr/tools/video-generation) — video model yapılandırması
