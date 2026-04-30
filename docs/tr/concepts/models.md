---
read_when:
    - Modeller CLI’si ekleme veya değiştirme (models list/set/scan/aliases/fallbacks)
    - Model geri dönüş davranışını veya seçim kullanıcı deneyimini değiştirme
    - Model tarama yoklamalarını güncelleme (araçlar/görseller)
sidebarTitle: Models CLI
summary: 'Modeller CLI''si: listeleme, ayarlama, takma adlar, yedekler, tarama, durum'
title: Modeller CLI
x-i18n:
    generated_at: "2026-04-30T09:17:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64b97ddfcc6f804044580dfc9a441d426f737e9e7d007d78b0b045a52068b34f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Model devretme" href="/tr/concepts/model-failover">
    Auth profili rotasyonu, cooldown süreleri ve bunun fallback'lerle nasıl etkileştiği.
  </Card>
  <Card title="Model providers" href="/tr/concepts/model-providers">
    Hızlı provider genel bakışı ve örnekler.
  </Card>
  <Card title="Agent runtime'ları" href="/tr/concepts/agent-runtimes">
    PI, Codex ve diğer agent döngüsü runtime'ları.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/config-agents#agent-defaults">
    Model yapılandırma anahtarları.
  </Card>
</CardGroup>

Model ref'leri bir provider ve model seçer. Genellikle düşük düzey agent runtime'ını seçmezler. Örneğin `openai/gpt-5.5`, `agents.defaults.agentRuntime.id` değerine bağlı olarak normal OpenAI provider yolu üzerinden veya Codex app-server runtime'ı üzerinden çalışabilir. Bkz. [Agent runtime'ları](/tr/concepts/agent-runtimes).

## Model seçimi nasıl çalışır

OpenClaw modelleri şu sırayla seçer:

<Steps>
  <Step title="Birincil model">
    `agents.defaults.model.primary` (veya `agents.defaults.model`).
  </Step>
  <Step title="Fallback'ler">
    `agents.defaults.model.fallbacks` (sırayla).
  </Step>
  <Step title="Provider auth failover">
    Auth failover, bir sonraki modele geçmeden önce provider içinde gerçekleşir.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="İlgili model yüzeyleri">
    - `agents.defaults.models`, OpenClaw'ın kullanabileceği modellerin allowlist/catalog listesidir (alias'larla birlikte).
    - `agents.defaults.imageModel`, **yalnızca** birincil model görüntüleri kabul edemediğinde kullanılır.
    - `agents.defaults.pdfModel`, `pdf` aracı tarafından kullanılır. Atlanırsa araç `agents.defaults.imageModel` değerine, ardından çözümlenmiş session/varsayılan modele fallback yapar.
    - `agents.defaults.imageGenerationModel`, paylaşılan görüntü üretimi capability'si tarafından kullanılır. Atlanırsa `image_generate` yine de auth destekli bir provider varsayılanı çıkarımlayabilir. Önce geçerli varsayılan provider'ı, ardından kalan kayıtlı görüntü üretimi provider'larını provider-id sırasına göre dener. Belirli bir provider/model ayarlarsanız, o provider'ın auth/API key'ini de yapılandırın.
    - `agents.defaults.musicGenerationModel`, paylaşılan müzik üretimi capability'si tarafından kullanılır. Atlanırsa `music_generate` yine de auth destekli bir provider varsayılanı çıkarımlayabilir. Önce geçerli varsayılan provider'ı, ardından kalan kayıtlı müzik üretimi provider'larını provider-id sırasına göre dener. Belirli bir provider/model ayarlarsanız, o provider'ın auth/API key'ini de yapılandırın.
    - `agents.defaults.videoGenerationModel`, paylaşılan video üretimi capability'si tarafından kullanılır. Atlanırsa `video_generate` yine de auth destekli bir provider varsayılanı çıkarımlayabilir. Önce geçerli varsayılan provider'ı, ardından kalan kayıtlı video üretimi provider'larını provider-id sırasına göre dener. Belirli bir provider/model ayarlarsanız, o provider'ın auth/API key'ini de yapılandırın.
    - Agent başına varsayılanlar, `agents.list[].model` ve binding'ler aracılığıyla `agents.defaults.model` değerini override edebilir (bkz. [Çok agent'lı yönlendirme](/tr/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Seçim kaynağı ve fallback davranışı

Aynı `provider/model`, nereden geldiğine bağlı olarak farklı şeyler ifade edebilir:

- Yapılandırılmış varsayılanlar (`agents.defaults.model.primary` ve agent'a özgü birinciller) normal başlangıç noktasıdır ve `agents.defaults.model.fallbacks` kullanır.
- Otomatik fallback seçimleri geçici kurtarma durumudur. Bilinen sorunlu birincili önce yoklamadan sonraki turn'lerin fallback zincirini kullanmaya devam edebilmesi için `modelOverrideSource: "auto"` ile saklanırlar.
- Kullanıcı session seçimleri kesindir. `/model`, model seçici, `session_status(model=...)` ve `sessions.patch`, `modelOverrideSource: "user"` saklar; seçilen provider/model erişilemezse OpenClaw başka bir yapılandırılmış modele geçmek yerine görünür şekilde başarısız olur.
- Cron `--model` / payload `model`, iş başına bir birincildir. İş açık payload `fallbacks` sağlamadığı sürece yapılandırılmış fallback'leri kullanmaya devam eder (katı bir cron çalıştırması için `fallbacks: []` kullanın).
- CLI default-model ve allowlist seçicileri, tam yerleşik catalog'u yüklemek yerine açık `models.providers.*.models` listesini göstererek `models.mode: "replace"` değerine uyar.
- Control UI model seçicisi, Gateway'den yapılandırılmış model görünümünü ister: varsa `agents.defaults.models`, aksi halde açık `models.providers.*.models` ve kullanılabilir auth'a sahip provider'lar. Tam yerleşik catalog, `view: "all"` ile `models.list` veya `openclaw models list --all` gibi açık göz atma görünümleri için ayrılmıştır.

## Hızlı model politikası

- Birincilinizi erişiminiz olan en güçlü son nesil modele ayarlayın.
- Maliyet/gecikmeye duyarlı görevler ve daha düşük riskli sohbet için fallback'ler kullanın.
- Araç etkin agent'lar veya güvenilmeyen girdiler için daha eski/zayıf model katmanlarından kaçının.

## Onboarding (önerilir)

Yapılandırmayı elle düzenlemek istemiyorsanız onboarding çalıştırın:

```bash
openclaw onboard
```

**OpenAI Code (Codex) aboneliği** (OAuth) ve **Anthropic** (API key veya Claude CLI) dahil olmak üzere yaygın provider'lar için model + auth kurabilir.

## Yapılandırma anahtarları (genel bakış)

- `agents.defaults.model.primary` ve `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` ve `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` ve `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` ve `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` ve `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + alias'lar + provider parametreleri)
- `models.providers` (`models.json` içine yazılan özel provider'lar)

<Note>
Model ref'leri küçük harfe normalize edilir. `z.ai/*` gibi provider alias'ları `zai/*` olarak normalize edilir.

Provider yapılandırma örnekleri (OpenCode dahil) [OpenCode](/tr/providers/opencode) içinde bulunur.
</Note>

### Güvenli allowlist düzenlemeleri

`agents.defaults.models` değerini elle güncellerken eklemeli yazmaları kullanın:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Clobber koruma kuralları">
    `openclaw config set`, model/provider map'lerini yanlışlıkla üzerine yazılmaya karşı korur. `agents.defaults.models`, `models.providers` veya `models.providers.<id>.models` için düz bir nesne ataması, mevcut girdileri kaldıracaksa reddedilir. Eklemeli değişiklikler için `--merge` kullanın; `--replace` yalnızca sağlanan değer eksiksiz hedef değer olmalıysa kullanın.

    Etkileşimli provider kurulumu ve `openclaw configure --section model` da provider kapsamlı seçimleri mevcut allowlist içine merge eder, böylece Codex, Ollama veya başka bir provider eklemek ilgisiz model girdilerini düşürmez. Configure, provider auth yeniden uygulandığında mevcut `agents.defaults.model.primary` değerini korur. `openclaw models auth login --provider <id> --set-default` ve `openclaw models set <model>` gibi açık varsayılan ayarlama komutları yine de `agents.defaults.model.primary` değerini değiştirir.

  </Accordion>
</AccordionGroup>

## "Modele izin verilmiyor" (ve yanıtların neden durduğu)

`agents.defaults.models` ayarlanırsa, `/model` ve session override'ları için **allowlist** haline gelir. Bir kullanıcı bu allowlist içinde olmayan bir model seçtiğinde OpenClaw şunu döndürür:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Bu, normal bir yanıt oluşturulmadan **önce** gerçekleşir, bu yüzden mesaj "yanıt vermedi" gibi hissettirebilir. Çözüm şunlardan biridir:

- Modeli `agents.defaults.models` içine ekleyin veya
- Allowlist'i temizleyin (`agents.defaults.models` değerini kaldırın) veya
- `/model list` içinden bir model seçin.

</Warning>

Yerel/GGUF modeller için tam provider önekli ref'i allowlist içinde saklayın;
örneğin `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` veya
`openclaw models list --provider <provider>` tarafından gösterilen tam
provider/model. Allowlist etkin olduğunda çıplak yerel dosya adları veya
görünen adlar yeterli değildir.

Örnek allowlist yapılandırması:

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

Geçerli session için modelleri yeniden başlatmadan değiştirebilirsiniz:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="Seçici davranışı">
    - `/model` (ve `/model list`) kompakt, numaralı bir seçicidir (model ailesi + kullanılabilir provider'lar).
    - Discord'da `/model` ve `/models`, provider ve model açılır menülerinin yanı sıra Submit adımı içeren etkileşimli bir seçici açar.
    - `/models add` kullanım dışıdır ve artık sohbetten model kaydetmek yerine kullanım dışı bırakma mesajı döndürür.
    - `/model <#>` o seçiciden seçim yapar.

  </Accordion>
  <Accordion title="Kalıcılık ve canlı değiştirme">
    - `/model`, yeni session seçimini hemen kalıcı hale getirir.
    - Agent boşta ise bir sonraki çalıştırma yeni modeli hemen kullanır.
    - Bir çalıştırma zaten etkinse OpenClaw canlı değiştirmeyi beklemede olarak işaretler ve yalnızca temiz bir retry noktasında yeni modelle yeniden başlar.
    - Araç etkinliği veya yanıt çıktısı zaten başladıysa bekleyen değiştirme daha sonraki bir retry fırsatına veya bir sonraki kullanıcı turn'üne kadar kuyrukta kalabilir.
    - Kullanıcı tarafından seçilen `/model` ref'i o session için katıdır: seçilen provider/model erişilemezse yanıt, `agents.defaults.model.fallbacks` içinden sessizce yanıt vermek yerine görünür şekilde başarısız olur. Bu, yine de fallback zincirleri kullanabilen yapılandırılmış varsayılanlardan ve cron işi birincillerinden farklıdır.
    - `/model status` ayrıntılı görünümdür (auth adayları ve yapılandırıldığında provider endpoint `baseUrl` + `api` modu).

  </Accordion>
  <Accordion title="Ref ayrıştırma">
    - Model ref'leri **ilk** `/` üzerinden bölünerek ayrıştırılır. `/model <ref>` yazarken `provider/model` kullanın.
    - Model ID'sinin kendisi `/` içeriyorsa (OpenRouter tarzı), provider önekini eklemelisiniz (örnek: `/model openrouter/moonshotai/kimi-k2`).
    - Provider'ı atlarsanız OpenClaw girdiyi şu sırayla çözer:
      1. alias eşleşmesi
      2. tam öneksiz model id için benzersiz yapılandırılmış-provider eşleşmesi
      3. yapılandırılmış varsayılan provider'a kullanım dışı fallback — o provider artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw, eski kaldırılmış-provider varsayılanını göstermemek için bunun yerine ilk yapılandırılmış provider/model değerine fallback yapar.
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

Varsayılan olarak yapılandırılmış/auth-kullanılabilir modelleri gösterir. Yararlı flag'ler:

<ParamField path="--all" type="boolean">
  Tam catalog. Auth yapılandırılmadan önce paketli provider'a ait statik catalog satırlarını içerir, böylece yalnızca keşif amaçlı görünümler, eşleşen provider kimlik bilgilerini ekleyene kadar kullanılamayan modelleri gösterebilir.
</ParamField>
<ParamField path="--local" type="boolean">
  Yalnızca yerel provider'lar.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Provider id'ye göre filtrele, örneğin `moonshot`. Etkileşimli seçicilerdeki görüntüleme etiketleri kabul edilmez.
</ParamField>
<ParamField path="--plain" type="boolean">
  Satır başına bir model.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir çıktı.
</ParamField>

### `models status`

Çözümlenen birincil modeli, yedekleri, görsel modelini ve yapılandırılmış sağlayıcıların kimlik doğrulama özetini gösterir. Ayrıca auth deposunda bulunan profiller için OAuth süre dolumu durumunu da yüzeye çıkarır (varsayılan olarak 24 saat içinde uyarır). `--plain` yalnızca çözümlenen birincil modeli yazdırır.

<AccordionGroup>
  <Accordion title="Kimlik doğrulama ve yoklama davranışı">
    - OAuth durumu her zaman gösterilir (ve `--json` çıktısına dahil edilir). Yapılandırılmış bir sağlayıcının kimlik bilgileri yoksa, `models status` bir **Eksik kimlik doğrulama** bölümü yazdırır.
    - JSON, `auth.oauth` (uyarı penceresi + profiller) ve `auth.providers` (env destekli kimlik bilgileri dahil sağlayıcı başına etkili kimlik doğrulama) içerir. `auth.oauth` yalnızca auth deposu profil sağlığıdır; yalnızca env kullanan sağlayıcılar burada görünmez.
    - Otomasyon için `--check` kullanın (eksik/süresi dolmuşsa çıkış `1`, süresi dolmak üzereyse `2`).
    - Canlı kimlik doğrulama denetimleri için `--probe` kullanın; yoklama satırları auth profillerinden, env kimlik bilgilerinden veya `models.json` içinden gelebilir.
    - Açık `auth.order.<provider>` depolanmış bir profili atlıyorsa, yoklama denemek yerine `excluded_by_auth_order` bildirir. Kimlik doğrulama varsa ancak bu sağlayıcı için yoklanabilir bir model çözümlenemiyorsa, yoklama `status: no_model` bildirir.

  </Accordion>
</AccordionGroup>

<Note>
Kimlik doğrulama seçimi sağlayıcıya/hesaba bağlıdır. Her zaman açık gateway hostları için API anahtarları genellikle en öngörülebilir seçenektir; Claude CLI yeniden kullanımı ve mevcut Anthropic OAuth/token profilleri de desteklenir.
</Note>

Örnek (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Tarama (OpenRouter ücretsiz modelleri)

`openclaw models scan`, OpenRouter'ın **ücretsiz model kataloğunu** inceler ve isteğe bağlı olarak modelleri araç ve görsel desteği için yoklayabilir.

<ParamField path="--no-probe" type="boolean">
  Canlı yoklamaları atla (yalnızca metadata).
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
  `agents.defaults.imageModel.primary` değerini ilk görsel seçimine ayarla.
</ParamField>

<Note>
OpenRouter `/models` kataloğu herkese açıktır, bu yüzden yalnızca metadata taramaları anahtar olmadan ücretsiz adayları listeleyebilir. Yoklama ve çıkarım hâlâ bir OpenRouter API anahtarı gerektirir (auth profillerinden veya `OPENROUTER_API_KEY` içinden). Anahtar yoksa, `openclaw models scan` yalnızca metadata çıktısına geri döner ve yapılandırmayı değiştirmeden bırakır. Yalnızca metadata modunu açıkça istemek için `--no-probe` kullanın.
</Note>

Tarama sonuçları şuna göre sıralanır:

1. Görsel desteği
2. Araç gecikmesi
3. Bağlam boyutu
4. Parametre sayısı

Girdi:

- OpenRouter `/models` listesi (`:free` filtresi)
- Canlı yoklamalar auth profillerinden veya `OPENROUTER_API_KEY` içinden OpenRouter API anahtarı gerektirir (bkz. [Ortam değişkenleri](/tr/help/environment))
- İsteğe bağlı filtreler: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- İstek/yoklama denetimleri: `--timeout`, `--concurrency`

Canlı yoklamalar bir TTY içinde çalıştığında, yedekleri etkileşimli olarak seçebilirsiniz. Etkileşimsiz modda, varsayılanları kabul etmek için `--yes` geçirin. Yalnızca metadata sonuçları bilgilendirme amaçlıdır; OpenClaw'ın kullanılamaz, anahtarsız bir OpenRouter modeli yapılandırmaması için `--set-default` ve `--set-image` canlı yoklamalar gerektirir.

## Model kayıt defteri (`models.json`)

`models.providers` içindeki özel sağlayıcılar, agent dizini altında `models.json` dosyasına yazılır (varsayılan `~/.openclaw/agents/<agentId>/agent/models.json`). `models.mode` `replace` olarak ayarlanmadığı sürece bu dosya varsayılan olarak birleştirilir.

<AccordionGroup>
  <Accordion title="Birleştirme modu önceliği">
    Eşleşen sağlayıcı kimlikleri için birleştirme modu önceliği:

    - Agent `models.json` içinde zaten bulunan boş olmayan `baseUrl` kazanır.
    - Agent `models.json` içindeki boş olmayan `apiKey`, yalnızca bu sağlayıcı mevcut yapılandırma/auth profili bağlamında SecretRef tarafından yönetilmiyorsa kazanır.
    - SecretRef tarafından yönetilen sağlayıcı `apiKey` değerleri, çözümlenmiş sırları kalıcılaştırmak yerine kaynak işaretleyicilerden (env refleri için `ENV_VAR_NAME`, file/exec refleri için `secretref-managed`) yenilenir.
    - SecretRef tarafından yönetilen sağlayıcı başlık değerleri kaynak işaretleyicilerden (env refleri için `secretref-env:ENV_VAR_NAME`, file/exec refleri için `secretref-managed`) yenilenir.
    - Boş veya eksik agent `apiKey`/`baseUrl` değerleri, yapılandırma `models.providers` değerlerine geri döner.
    - Diğer sağlayıcı alanları yapılandırmadan ve normalize edilmiş katalog verilerinden yenilenir.

  </Accordion>
</AccordionGroup>

<Note>
İşaretleyici kalıcılığı kaynak otoritelidir: OpenClaw, işaretleyicileri çözümlenmiş runtime sır değerlerinden değil, etkin kaynak yapılandırma snapshot'ından (çözümleme öncesi) yazar. Bu, `openclaw agent` gibi komutla yürütülen yollar dahil OpenClaw `models.json` dosyasını yeniden oluşturduğunda geçerlidir.
</Note>

## İlgili

- [Agent runtime'ları](/tr/concepts/agent-runtimes) — PI, Codex ve diğer agent döngüsü runtime'ları
- [Yapılandırma referansı](/tr/gateway/config-agents#agent-defaults) — model yapılandırma anahtarları
- [Görsel oluşturma](/tr/tools/image-generation) — görsel modeli yapılandırması
- [Model yük devri](/tr/concepts/model-failover) — yedek zincirleri
- [Model sağlayıcıları](/tr/concepts/model-providers) — sağlayıcı yönlendirme ve kimlik doğrulama
- [Müzik oluşturma](/tr/tools/music-generation) — müzik modeli yapılandırması
- [Video oluşturma](/tr/tools/video-generation) — video modeli yapılandırması
