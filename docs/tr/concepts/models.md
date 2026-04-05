---
read_when:
    - Models CLI'yi ekleme veya değiştirme (`models list/set/scan/aliases/fallbacks`)
    - Model fallback davranışını veya seçim UX'ini değiştirme
    - Model tarama problarını güncelleme (araçlar/görseller)
summary: 'Models CLI: listeleme, ayarlama, takma adlar, geri dönüşler, tarama, durum'
title: Models CLI
x-i18n:
    generated_at: "2026-04-05T13:51:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: e08f7e50da263895dae2bd2b8dc327972ea322615f8d1918ddbd26bb0fb24840
    source_path: concepts/models.md
    workflow: 15
---

# Models CLI

Auth profile rotasyonu, cooldown'lar ve bunların fallback'lerle nasıl etkileştiği için bkz. [/concepts/model-failover](/concepts/model-failover).
Hızlı sağlayıcı genel bakışı + örnekler: [/concepts/model-providers](/concepts/model-providers).

## Model seçimi nasıl çalışır

OpenClaw modelleri şu sırayla seçer:

1. **Birincil** model (`agents.defaults.model.primary` veya `agents.defaults.model`).
2. `agents.defaults.model.fallbacks` içindeki **fallback**'ler (sırayla).
3. **Sağlayıcı auth failover**, bir sonraki modele geçmeden önce bir sağlayıcının içinde gerçekleşir.

İlgili:

- `agents.defaults.models`, OpenClaw'ın kullanabildiği modellerin allowlist/catalog'udur (ayrıca takma adlar).
- `agents.defaults.imageModel`, **yalnızca** birincil model görselleri kabul edemediğinde kullanılır.
- `agents.defaults.pdfModel`, `pdf` aracı tarafından kullanılır. Atlanırsa araç sırasıyla `agents.defaults.imageModel`'e, ardından çözümlenmiş oturum/varsayılan modele geri döner.
- `agents.defaults.imageGenerationModel`, paylaşılan görsel oluşturma yeteneği tarafından kullanılır. Atlanırsa `image_generate`, auth destekli bir sağlayıcı varsayılanını yine de çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından sağlayıcı kimliği sırasına göre kalan kayıtlı görsel oluşturma sağlayıcılarını dener. Belirli bir sağlayıcı/model ayarlarsanız, o sağlayıcının auth/API anahtarını da yapılandırın.
- `agents.defaults.videoGenerationModel`, paylaşılan video oluşturma yeteneği tarafından kullanılır. Görsel oluşturmadan farklı olarak bu bugün bir sağlayıcı varsayılanı çıkarmaz. `qwen/wan2.6-t2v` gibi açık bir `provider/model` ayarlayın ve o sağlayıcının auth/API anahtarını da yapılandırın.
- Aracı başına varsayılanlar, `agents.list[].model` ve binding'ler aracılığıyla `agents.defaults.model` değerini geçersiz kılabilir (bkz. [/concepts/multi-agent](/concepts/multi-agent)).

## Hızlı model politikası

- Birincil modelinizi, sizin için kullanılabilir en güçlü yeni nesil modele ayarlayın.
- Maliyet/gecikmeye duyarlı görevler ve daha düşük öncelikli sohbetler için fallback'leri kullanın.
- Araç etkin aracılar veya güvenilmeyen girdiler için eski/zayıf model katmanlarından kaçının.

## Onboarding (önerilen)

Yapılandırmayı elle düzenlemek istemiyorsanız onboarding'i çalıştırın:

```bash
openclaw onboard
```

Yaygın sağlayıcılar için model + auth kurabilir; buna **OpenAI Code (Codex) subscription** (OAuth) ve **Anthropic** (API anahtarı veya Claude CLI) dahildir.

## Yapılandırma anahtarları (genel bakış)

- `agents.defaults.model.primary` ve `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` ve `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` ve `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` ve `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` ve `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + takma adlar + sağlayıcı parametreleri)
- `models.providers` (`models.json` içine yazılan özel sağlayıcılar)

Model referansları küçük harfe normalize edilir. `z.ai/*` gibi sağlayıcı takma adları `zai/*` olarak normalize edilir.

Sağlayıcı yapılandırma örnekleri (OpenCode dahil) şurada bulunur:
[/providers/opencode](/providers/opencode).

## "Model is not allowed" ("Modele izin verilmiyor") hatası nedir ve yanıtlar neden durur

`agents.defaults.models` ayarlanmışsa, `/model` ve oturum geçersiz kılmaları için **allowlist** hâline gelir. Kullanıcı bu allowlist içinde olmayan bir modeli seçtiğinde, OpenClaw şunu döndürür:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Bu durum normal bir yanıt oluşturulmadan **önce** gerçekleşir, bu yüzden mesaj sanki “yanıt vermemiş” gibi hissedilebilir. Düzeltmek için şunlardan birini yapın:

- Modeli `agents.defaults.models` içine ekleyin veya
- allowlist'i temizleyin (`agents.defaults.models` öğesini kaldırın) veya
- `/model list` içinden bir model seçin.

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

## Sohbet içinde model değiştirme (`/model`)

Yeniden başlatmadan geçerli oturum için model değiştirebilirsiniz:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Notlar:

- `/model` (ve `/model list`) kompakt, numaralandırılmış bir seçicidir (model ailesi + kullanılabilir sağlayıcılar).
- Discord'da `/model` ve `/models`, sağlayıcı ve model açılır listeleriyle birlikte bir Submit adımı içeren etkileşimli bir seçici açar.
- `/model <#>`, o seçiciden seçim yapar.
- `/model`, yeni oturum seçimini hemen kalıcı hâle getirir.
- Aracı boşta ise sonraki çalıştırma yeni modeli hemen kullanır.
- Bir çalıştırma zaten etkinse OpenClaw canlı değişikliği beklemede olarak işaretler ve yalnızca temiz bir yeniden deneme noktasında yeni modele geçerek yeniden başlatır.
- Araç etkinliği veya yanıt çıktısı zaten başladıysa, bekleyen değişiklik daha sonraki bir yeniden deneme fırsatına ya da sonraki kullanıcı turuna kadar kuyrukta kalabilir.
- `/model status` ayrıntılı görünümdür (auth adayları ve yapılandırılmışsa sağlayıcı uç noktası `baseUrl` + `api` modu).
- Model referansları ilk `/` karakterine göre bölünerek ayrıştırılır. `/model <ref>` yazarken `provider/model` kullanın.
- Model kimliğinin kendisi `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini eklemeniz gerekir (örnek: `/model openrouter/moonshotai/kimi-k2`).
- Sağlayıcıyı atlarsanız OpenClaw girdiyi şu sırayla çözümler:
  1. takma ad eşleşmesi
  2. tam o öneksiz model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesi
  3. yapılandırılmış varsayılan sağlayıcıya yönelik kullanımdan kaldırılmış fallback
     Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa, OpenClaw
     bunun yerine eski, kaldırılmış sağlayıcı varsayılanını göstermemek için
     ilk yapılandırılmış sağlayıcı/modele geri döner.

Tam komut davranışı/yapılandırması: [Slash commands](/tools/slash-commands).

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

- `--all`: tam katalog
- `--local`: yalnızca yerel sağlayıcılar
- `--provider <name>`: sağlayıcıya göre filtrele
- `--plain`: satır başına bir model
- `--json`: makine tarafından okunabilir çıktı

### `models status`

Çözümlenmiş birincil modeli, fallback'leri, görsel modelini ve yapılandırılmış sağlayıcıların auth genel görünümünü gösterir. Ayrıca auth deposunda bulunan profiller için OAuth sona erme durumunu da gösterir (varsayılan olarak 24 saat içinde uyarır). `--plain` yalnızca çözümlenmiş birincil modeli yazdırır.
OAuth durumu her zaman gösterilir (ve `--json` çıktısına dahil edilir). Yapılandırılmış bir sağlayıcının kimlik bilgileri yoksa `models status` bir **Eksik auth** bölümü yazdırır.
JSON, `auth.oauth` (uyarı penceresi + profiller) ve `auth.providers`
(sağlayıcı başına etkin auth) içerir.
Otomasyon için `--check` kullanın (eksik/süresi dolmuşsa çıkış `1`, süresi dolmak üzereyse `2`).
Canlı auth denetimleri için `--probe` kullanın; probe satırları auth profile'larından, env kimlik bilgilerinden veya `models.json` dosyasından gelebilir.
Açık `auth.order.<provider>` kayıtlı bir profili dışlıyorsa, probe bunu denemek yerine
`excluded_by_auth_order` bildirir. Auth varsa ama o sağlayıcı için probe yapılabilir
bir model çözümlenemiyorsa probe `status: no_model` bildirir.

Auth seçimi sağlayıcıya/hesaba bağlıdır. Her zaman açık gateway ana makinelerinde API anahtarları genellikle en öngörülebilir seçenektir; Claude CLI yeniden kullanımı ve mevcut Anthropic OAuth/token profilleri de desteklenir.

Örnek (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Tarama (OpenRouter ücretsiz modelleri)

`openclaw models scan`, OpenRouter'ın **ücretsiz model kataloğunu** inceler ve isteğe bağlı olarak modellerde araç ve görsel desteğini probe edebilir.

Temel bayraklar:

- `--no-probe`: canlı probe'ları atla (yalnızca meta veri)
- `--min-params <b>`: minimum parametre boyutu (milyar)
- `--max-age-days <days>`: daha eski modelleri atla
- `--provider <name>`: sağlayıcı öneki filtresi
- `--max-candidates <n>`: fallback listesi boyutu
- `--set-default`: `agents.defaults.model.primary` değerini ilk seçime ayarla
- `--set-image`: `agents.defaults.imageModel.primary` değerini ilk görsel seçimine ayarla

Probe işlemi bir OpenRouter API anahtarı gerektirir (auth profile'larından veya
`OPENROUTER_API_KEY` üzerinden). Anahtar yoksa yalnızca adayları listelemek için `--no-probe` kullanın.

Tarama sonuçları şu ölçütlere göre sıralanır:

1. Görsel desteği
2. Araç gecikmesi
3. Bağlam boyutu
4. Parametre sayısı

Girdi

- OpenRouter `/models` listesi (`:free` filtresi)
- Auth profile'larından veya `OPENROUTER_API_KEY` üzerinden OpenRouter API anahtarı gerekir (bkz. [/environment](/help/environment))
- İsteğe bağlı filtreler: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Probe denetimleri: `--timeout`, `--concurrency`

Bir TTY içinde çalıştırıldığında fallback'leri etkileşimli olarak seçebilirsiniz. Etkileşimli olmayan modda varsayılanları kabul etmek için `--yes` geçin.

## Models registry (`models.json`)

`models.providers` içindeki özel sağlayıcılar aracı dizini altındaki `models.json` dosyasına yazılır (varsayılan `~/.openclaw/agents/<agentId>/agent/models.json`). `models.mode`, `replace` olarak ayarlanmadığı sürece bu dosya varsayılan olarak birleştirilir.

Eşleşen sağlayıcı kimlikleri için birleştirme modu önceliği:

- Aracı `models.json` içinde zaten bulunan boş olmayan `baseUrl` kazanır.
- Aracı `models.json` içindeki boş olmayan `apiKey`, yalnızca o sağlayıcı geçerli config/auth-profile bağlamında SecretRef tarafından yönetilmiyorsa kazanır.
- SecretRef tarafından yönetilen sağlayıcı `apiKey` değerleri, çözümlenmiş gizli verileri kalıcılaştırmak yerine kaynak işaretleyicilerden (`ENV_VAR_NAME` env referansları için, `secretref-managed` file/exec referansları için) yenilenir.
- SecretRef tarafından yönetilen sağlayıcı üstbilgi değerleri, kaynak işaretleyicilerden (`secretref-env:ENV_VAR_NAME` env referansları için, `secretref-managed` file/exec referansları için) yenilenir.
- Boş veya eksik aracı `apiKey`/`baseUrl` değerleri, yapılandırma `models.providers` değerine geri döner.
- Diğer sağlayıcı alanları yapılandırmadan ve normalize edilmiş katalog verilerinden yenilenir.

İşaretleyici kalıcılığı kaynak açısından yetkilidir: OpenClaw işaretleyicileri çözümlenmiş çalışma zamanı gizli değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden (çözümleme öncesi) yazar.
Bu, OpenClaw `models.json` dosyasını yeniden oluşturduğunda, `openclaw agent` gibi komut güdümlü yollar dahil olmak üzere geçerlidir.

## İlgili

- [Model Providers](/concepts/model-providers) — sağlayıcı yönlendirme ve auth
- [Model Failover](/concepts/model-failover) — fallback zincirleri
- [Image Generation](/tools/image-generation) — görsel model yapılandırması
- [Configuration Reference](/gateway/configuration-reference#agent-defaults) — model yapılandırma anahtarları
