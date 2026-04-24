---
read_when:
    - Models CLI'yi ekleme veya değiştirme (`models list/set/scan/aliases/fallbacks`)
    - Model fallback davranışını veya seçim UX'ini değiştirme
    - Model tarama probe'larını güncelleme (araçlar/görüntüler)
summary: 'Models CLI: listeleme, ayarlama, takma adlar, fallback''ler, tarama, durum'
title: Models CLI
x-i18n:
    generated_at: "2026-04-24T09:05:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12f784984c87b33e645ec296f7f93ec3acc2a91efa3b63d3a912a6b09b90e048
    source_path: concepts/models.md
    workflow: 15
---

Bkz. auth profili rotasyonu, bekleme süreleri ve bunun fallback'lerle nasıl etkileştiği için [/concepts/model-failover](/tr/concepts/model-failover).
Hızlı sağlayıcı genel bakışı + örnekler: [/concepts/model-providers](/tr/concepts/model-providers).

## Model seçimi nasıl çalışır

OpenClaw modelleri şu sırayla seçer:

1. **Birincil** model (`agents.defaults.model.primary` veya `agents.defaults.model`).
2. `agents.defaults.model.fallbacks` içindeki **fallback**'ler (sırayla).
3. **Sağlayıcı auth failover**, bir sonraki modele geçmeden önce aynı sağlayıcının içinde gerçekleşir.

İlgili:

- `agents.defaults.models`, OpenClaw'ın kullanabileceği modellerin allowlist/catalog alanıdır (artı takma adlar).
- `agents.defaults.imageModel`, **yalnızca** birincil model görüntü kabul edemediğinde kullanılır.
- `agents.defaults.pdfModel`, `pdf` aracı tarafından kullanılır. Belirtilmezse araç önce `agents.defaults.imageModel`, sonra çözülmüş oturum/varsayılan modele geri düşer.
- `agents.defaults.imageGenerationModel`, paylaşılan görüntü üretimi yeteneği tarafından kullanılır. Belirtilmezse `image_generate`, auth destekli bir sağlayıcı varsayılanını yine çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, sonra kayıtlı kalan görüntü üretimi sağlayıcılarını sağlayıcı kimliği sırasıyla dener. Belirli bir sağlayıcı/model ayarlarsanız, o sağlayıcının auth/API anahtarını da yapılandırın.
- `agents.defaults.musicGenerationModel`, paylaşılan müzik üretimi yeteneği tarafından kullanılır. Belirtilmezse `music_generate`, auth destekli bir sağlayıcı varsayılanını yine çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, sonra kayıtlı kalan müzik üretimi sağlayıcılarını sağlayıcı kimliği sırasıyla dener. Belirli bir sağlayıcı/model ayarlarsanız, o sağlayıcının auth/API anahtarını da yapılandırın.
- `agents.defaults.videoGenerationModel`, paylaşılan video üretimi yeteneği tarafından kullanılır. Belirtilmezse `video_generate`, auth destekli bir sağlayıcı varsayılanını yine çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, sonra kayıtlı kalan video üretimi sağlayıcılarını sağlayıcı kimliği sırasıyla dener. Belirli bir sağlayıcı/model ayarlarsanız, o sağlayıcının auth/API anahtarını da yapılandırın.
- Agent başına varsayılanlar, `agents.list[].model` ve binding'ler aracılığıyla `agents.defaults.model` değerini geçersiz kılabilir (bkz. [/concepts/multi-agent](/tr/concepts/multi-agent)).

## Hızlı model ilkesi

- Birincil modelinizi, sizin için erişilebilir olan en güçlü yeni nesil model olarak ayarlayın.
- Fallback'leri maliyet/gecikme duyarlı görevler ve daha düşük riskli sohbetler için kullanın.
- Araç etkin agent'ler veya güvenilmeyen girdiler için eski/daha zayıf model katmanlarından kaçının.

## Onboarding (önerilen)

Yapılandırmayı elle düzenlemek istemiyorsanız onboarding çalıştırın:

```bash
openclaw onboard
```

Bu, **OpenAI Code (Codex) subscription** (OAuth) ve **Anthropic** (API anahtarı veya Claude CLI) dahil yaygın sağlayıcılar için model + auth kurulumu yapabilir.

## Yapılandırma anahtarları (genel bakış)

- `agents.defaults.model.primary` ve `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` ve `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` ve `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` ve `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` ve `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + takma adlar + sağlayıcı parametreleri)
- `models.providers` (`models.json` içine yazılan özel sağlayıcılar)

Model referansları küçük harfe normalize edilir. `z.ai/*` gibi sağlayıcı takma adları
`zai/*` biçimine normalize edilir.

Sağlayıcı yapılandırma örnekleri (OpenCode dahil) şu adreste bulunur:
[/providers/opencode](/tr/providers/opencode).

### Güvenli allowlist düzenlemeleri

`agents.defaults.models` alanını elle güncellerken eklemeli yazımlar kullanın:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set`, model/sağlayıcı map'lerini kazayla ezilmeye karşı korur. 
`agents.defaults.models`, `models.providers` veya
`models.providers.<id>.models` alanlarına düz nesne ataması, mevcut
girdileri kaldıracaksa reddedilir. Eklemeli değişiklikler için `--merge` kullanın; sağlanan değerin
tam hedef değer olması gerekiyorsa yalnızca `--replace` kullanın.

Etkileşimli sağlayıcı kurulumu ve `openclaw configure --section model` de
sağlayıcı kapsamlı seçimleri mevcut allowlist ile birleştirir; böylece Codex,
Ollama veya başka bir sağlayıcı eklemek, alakasız model girdilerini düşürmez.

## "Modele izin verilmiyor" (ve yanıtlar neden duruyor)

`agents.defaults.models` ayarlıysa, bu `/model` ve
oturum geçersiz kılmaları için **allowlist** olur. Bir kullanıcı bu allowlist'te olmayan bir modeli seçtiğinde,
OpenClaw şunu döndürür:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Bu, normal bir yanıt üretilmeden **önce** gerçekleşir; bu nedenle mesaj
"yanıt vermedi" gibi hissedilebilir. Çözüm şunlardan biridir:

- Modeli `agents.defaults.models` alanına eklemek, veya
- Allowlist'i temizlemek (`agents.defaults.models` alanını kaldırmak), veya
- `/model list` içinden bir model seçmek.

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

Yeniden başlatmadan geçerli oturum için model değiştirebilirsiniz:

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Notlar:

- `/model` (ve `/model list`) kompakt, numaralı bir seçicidir (model ailesi + kullanılabilir sağlayıcılar).
- Discord'da `/model` ve `/models`, sağlayıcı ve model açılır listeleri ile bir Submit adımı içeren etkileşimli bir seçici açar.
- `/models add`, varsayılan olarak kullanılabilir ve `commands.modelsWrite=false` ile devre dışı bırakılabilir.
- Etkin olduğunda en hızlı yol `/models add <provider> <modelId>` olur; desteklenen yerlerde yalın `/models add`, önce sağlayıcı seçilen yönlendirmeli bir akış başlatır.
- `/models add` sonrasında yeni model, Gateway'i yeniden başlatmadan `/models` ve `/model` içinde kullanılabilir olur.
- `/model <#>`, o seçiciden seçim yapar.
- `/model`, yeni oturum seçimini anında kalıcı hale getirir.
- Agent boşta ise bir sonraki çalıştırma yeni modeli hemen kullanır.
- Bir çalıştırma zaten etkinse, OpenClaw canlı değişikliği beklemede olarak işaretler ve yalnızca temiz bir yeniden deneme noktasında yeni modele yeniden başlatır.
- Araç etkinliği veya yanıt çıktısı zaten başladıysa, bekleyen değişiklik daha sonraki bir yeniden deneme fırsatına veya sonraki kullanıcı turuna kadar kuyrukta kalabilir.
- `/model status`, ayrıntılı görünümdür (auth adayları ve yapılandırıldıysa sağlayıcı uç noktası `baseUrl` + `api` modu).
- Model referansları **ilk** `/` karakterinden bölünerek ayrıştırılır. `/model <ref>` yazarken `provider/model` kullanın.
- Model kimliğinin kendisi `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini eklemelisiniz (örnek: `/model openrouter/moonshotai/kimi-k2`).
- Sağlayıcıyı atlarsanız, OpenClaw girdiyi şu sırayla çözer:
  1. takma ad eşleşmesi
  2. o tam öneksiz model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesi
  3. yapılandırılmış varsayılan sağlayıcıya kullanımdan kaldırılmış fallback
     Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa, OpenClaw
     bunun yerine eski ve kaldırılmış bir sağlayıcı varsayılanını göstermemek için
     yapılandırılmış ilk sağlayıcı/modele geri düşer.

Tam komut davranışı/yapılandırması: [Slash commands](/tr/tools/slash-commands).

Örnekler:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

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

`openclaw models` (alt komut olmadan), `models status` için kısa yoldur.

### `models list`

Varsayılan olarak yapılandırılmış modelleri gösterir. Kullanışlı bayraklar:

- `--all`: tam katalog
- `--local`: yalnızca yerel sağlayıcılar
- `--provider <id>`: örneğin `moonshot` gibi sağlayıcı kimliğine göre filtrele; etkileşimli seçicilerdeki görünen etiketler kabul edilmez
- `--plain`: satır başına bir model
- `--json`: makine tarafından okunabilir çıktı

`--all`, auth yapılandırılmadan önce paketli sağlayıcıya ait statik katalog satırlarını da içerir; böylece yalnızca keşif amaçlı görünümler, eşleşen sağlayıcı kimlik bilgilerini ekleyene kadar kullanılamayan modelleri gösterebilir.

### `models status`

Çözülmüş birincil modeli, fallback'leri, görüntü modelini ve yapılandırılmış sağlayıcıların auth genel bakışını gösterir. Ayrıca auth store'da bulunan profiller için OAuth sona erme durumunu da gösterir (varsayılan olarak 24 saat içinde uyarır). `--plain` yalnızca çözülmüş birincil modeli yazdırır.
OAuth durumu her zaman gösterilir (ve `--json` çıktısına dahil edilir). Yapılandırılmış bir sağlayıcının kimlik bilgileri yoksa, `models status` bir **Missing auth** bölümü yazdırır.
JSON, `auth.oauth` (uyarı penceresi + profiller) ve `auth.providers`
(sağlayıcı başına etkin auth; env destekli kimlik bilgileri dahil) içerir. `auth.oauth`
yalnızca auth-store profil sağlığı içindir; yalnızca env kullanan sağlayıcılar burada görünmez.
Otomasyon için `--check` kullanın (eksik/süresi dolmuşsa çıkış `1`, süresi dolmak üzereyse `2`).
Canlı auth kontrolleri için `--probe` kullanın; probe satırları auth profillerinden, env
kimlik bilgilerinden veya `models.json` dosyasından gelebilir.
Açık `auth.order.<provider>` kayıtlı bir profili dışlıyorsa probe,
onu denemek yerine `excluded_by_auth_order` bildirir. Auth mevcut ancak bu sağlayıcı için probe edilebilir model çözülemiyorsa, probe `status: no_model` bildirir.

Auth seçimi sağlayıcıya/hesaba bağlıdır. Her zaman açık Gateway sunucuları için API
anahtarları genellikle en öngörülebilir olanlardır; Claude CLI yeniden kullanımı ve mevcut Anthropic
OAuth/token profilleri de desteklenir.

Örnek (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Tarama (OpenRouter ücretsiz modelleri)

`openclaw models scan`, OpenRouter'ın **ücretsiz model kataloğunu** inceler ve
isteğe bağlı olarak modelleri araç ve görüntü desteği açısından probe edebilir.

Temel bayraklar:

- `--no-probe`: canlı probe'ları atla (yalnızca meta veriler)
- `--min-params <b>`: minimum parametre boyutu (milyar)
- `--max-age-days <days>`: daha eski modelleri atla
- `--provider <name>`: sağlayıcı öneki filtresi
- `--max-candidates <n>`: fallback listesi boyutu
- `--set-default`: `agents.defaults.model.primary` değerini ilk seçime ayarla
- `--set-image`: `agents.defaults.imageModel.primary` değerini ilk görüntü seçimine ayarla

Probe işlemi için bir OpenRouter API anahtarı gerekir (auth profillerinden veya
`OPENROUTER_API_KEY` üzerinden). Anahtar olmadan yalnızca adayları listelemek için `--no-probe` kullanın.

Tarama sonuçları şu ölçütlere göre sıralanır:

1. Görüntü desteği
2. Araç gecikmesi
3. Bağlam boyutu
4. Parametre sayısı

Girdi

- OpenRouter `/models` listesi (`:free` filtresi)
- Auth profillerinden veya `OPENROUTER_API_KEY` üzerinden OpenRouter API anahtarı gerekir (bkz. [/environment](/tr/help/environment))
- İsteğe bağlı filtreler: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Probe denetimleri: `--timeout`, `--concurrency`

TTY içinde çalıştırıldığında fallback'leri etkileşimli olarak seçebilirsiniz. Etkileşimsiz
modda varsayılanları kabul etmek için `--yes` geçin.

## Models kayıt defteri (`models.json`)

`models.providers` içindeki özel sağlayıcılar, agent dizini altındaki
`models.json` dosyasına yazılır (varsayılan `~/.openclaw/agents/<agentId>/agent/models.json`). Bu dosya,
`models.mode` değeri `replace` olarak ayarlanmadıkça varsayılan olarak birleştirilir.

Eşleşen sağlayıcı kimlikleri için birleştirme modu önceliği:

- Agent `models.json` içindeki boş olmayan `baseUrl` zaten mevcutsa önceliklidir.
- Agent `models.json` içindeki boş olmayan `apiKey`, yalnızca o sağlayıcı mevcut config/auth-profile bağlamında SecretRef ile yönetilmiyorsa önceliklidir.
- SecretRef ile yönetilen sağlayıcı `apiKey` değerleri, çözümlenmiş secret'ları kalıcı hale getirmek yerine kaynak işaretleyicilerden (`env` ref'leri için `ENV_VAR_NAME`, `file`/`exec` ref'leri için `secretref-managed`) yenilenir.
- SecretRef ile yönetilen sağlayıcı header değerleri kaynak işaretleyicilerden yenilenir (`env` ref'leri için `secretref-env:ENV_VAR_NAME`, `file`/`exec` ref'leri için `secretref-managed`).
- Boş veya eksik agent `apiKey`/`baseUrl`, config `models.providers` alanına geri düşer.
- Diğer sağlayıcı alanları yapılandırmadan ve normalize edilmiş katalog verilerinden yenilenir.

İşaretleyici kalıcılığı kaynak açısından yetkilidir: OpenClaw işaretleyicileri, çözümlenmiş çalışma zamanı secret değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden (çözümleme öncesi) yazar.
Bu, OpenClaw `models.json` dosyasını yeniden oluşturduğunda, `openclaw agent` gibi komut odaklı yollar dahil olmak üzere her zaman geçerlidir.

## İlgili

- [Model Providers](/tr/concepts/model-providers) — sağlayıcı yönlendirme ve auth
- [Model Failover](/tr/concepts/model-failover) — fallback zincirleri
- [Image Generation](/tr/tools/image-generation) — görüntü modeli yapılandırması
- [Music Generation](/tr/tools/music-generation) — müzik modeli yapılandırması
- [Video Generation](/tr/tools/video-generation) — video modeli yapılandırması
- [Configuration Reference](/tr/gateway/config-agents#agent-defaults) — model yapılandırma anahtarları
