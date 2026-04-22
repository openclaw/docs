---
read_when:
    - Models CLI ekleme veya değiştirme (models list/set/scan/aliases/fallbacks)
    - Model geri dönüş davranışını veya seçim kullanıcı deneyimini değiştirme
    - Model tarama yoklamalarını güncelleme (araçlar/görseller)
summary: 'Models CLI: listele, ayarla, takma adlar, geri dönüşler, tara, durum'
title: Models CLI
x-i18n:
    generated_at: "2026-04-22T04:22:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cf7a17a20bea66e5e8dce134ed08b483417bc70ed875e796609d850aa79280e
    source_path: concepts/models.md
    workflow: 15
---

# Models CLI

Kimlik doğrulama profili
rotasyonu, bekleme süreleri ve bunların geri dönüşlerle nasıl etkileştiği için bkz. [/concepts/model-failover](/tr/concepts/model-failover).
Hızlı sağlayıcı genel bakışı + örnekler: [/concepts/model-providers](/tr/concepts/model-providers).

## Model seçimi nasıl çalışır

OpenClaw modelleri şu sırayla seçer:

1. **Birincil** model (`agents.defaults.model.primary` veya `agents.defaults.model`).
2. `agents.defaults.model.fallbacks` içindeki **geri dönüşler** (sırayla).
3. **Sağlayıcı kimlik doğrulama devretmesi**, bir sonraki modele geçmeden önce sağlayıcının içinde gerçekleşir.

İlgili:

- `agents.defaults.models`, OpenClaw'ın kullanabileceği modellerin izin listesi/kataloğudur (ve takma adları içerir).
- `agents.defaults.imageModel`, **yalnızca** birincil model görselleri kabul edemediğinde kullanılır.
- `agents.defaults.pdfModel`, `pdf` aracı tarafından kullanılır. Atlanırsa araç sırasıyla `agents.defaults.imageModel`, ardından çözümlenmiş oturum/varsayılan modele geri döner.
- `agents.defaults.imageGenerationModel`, paylaşılan görsel oluşturma yeteneği tarafından kullanılır. Atlanırsa `image_generate`, kimlik doğrulama destekli bir sağlayıcı varsayılanını yine de çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından sağlayıcı kimliği sırasına göre kalan kayıtlı görsel oluşturma sağlayıcılarını dener. Belirli bir sağlayıcı/model ayarlarsanız o sağlayıcının kimlik doğrulamasını/API anahtarını da yapılandırın.
- `agents.defaults.musicGenerationModel`, paylaşılan müzik oluşturma yeteneği tarafından kullanılır. Atlanırsa `music_generate`, kimlik doğrulama destekli bir sağlayıcı varsayılanını yine de çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından sağlayıcı kimliği sırasına göre kalan kayıtlı müzik oluşturma sağlayıcılarını dener. Belirli bir sağlayıcı/model ayarlarsanız o sağlayıcının kimlik doğrulamasını/API anahtarını da yapılandırın.
- `agents.defaults.videoGenerationModel`, paylaşılan video oluşturma yeteneği tarafından kullanılır. Atlanırsa `video_generate`, kimlik doğrulama destekli bir sağlayıcı varsayılanını yine de çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından sağlayıcı kimliği sırasına göre kalan kayıtlı video oluşturma sağlayıcılarını dener. Belirli bir sağlayıcı/model ayarlarsanız o sağlayıcının kimlik doğrulamasını/API anahtarını da yapılandırın.
- Aracı başına varsayılanlar, `agents.list[].model` ve bağlar aracılığıyla `agents.defaults.model` değerini geçersiz kılabilir (bkz. [/concepts/multi-agent](/tr/concepts/multi-agent)).

## Hızlı model ilkesi

- Birincil modelinizi kullanabildiğiniz en güçlü yeni nesil modele ayarlayın.
- Maliyet/gecikme duyarlı görevler ve daha düşük riskli sohbetler için geri dönüşleri kullanın.
- Araç etkin agent'lar veya güvenilmeyen girdiler için eski/zayıf model katmanlarından kaçının.

## Onboarding (önerilir)

Yapılandırmayı elle düzenlemek istemiyorsanız onboarding'i çalıştırın:

```bash
openclaw onboard
```

Bu işlem yaygın sağlayıcılar için model + kimlik doğrulamayı kurabilir; buna **OpenAI Code (Codex)
subscription** (OAuth) ve **Anthropic** (API anahtarı veya Claude CLI) dahildir.

## Yapılandırma anahtarları (genel bakış)

- `agents.defaults.model.primary` ve `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` ve `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` ve `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` ve `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` ve `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (izin listesi + takma adlar + sağlayıcı parametreleri)
- `models.providers` (`models.json` içine yazılan özel sağlayıcılar)

Model başvuruları küçük harfe normalize edilir. `z.ai/*` gibi sağlayıcı takma adları
`zai/*` biçimine normalize edilir.

OpenCode dahil sağlayıcı yapılandırma örnekleri
[/providers/opencode](/tr/providers/opencode) altında bulunur.

## "Model is not allowed" (ve yanıtların neden durduğu)

`agents.defaults.models` ayarlanmışsa `/model` ve
oturum geçersiz kılmaları için **izin listesi** hâline gelir. Kullanıcı bu izin listesinde olmayan
bir model seçtiğinde OpenClaw şunu döndürür:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Bu, normal bir yanıt üretilmeden **önce** gerçekleşir; bu yüzden mesaj sanki
“yanıt vermedi” gibi hissedilebilir. Çözüm:

- Modeli `agents.defaults.models` içine eklemek, veya
- İzin listesini temizlemek (`agents.defaults.models` değerini kaldırmak), veya
- `/model list` içinden bir model seçmek.

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

Notlar:

- `/model` (ve `/model list`) kompakt, numaralı bir seçicidir (model ailesi + kullanılabilir sağlayıcılar).
- Discord üzerinde `/model` ve `/models`, sağlayıcı ve model açılır menülerinin yanında bir de Gönder adımı içeren etkileşimli bir seçici açar.
- `/model <#>`, bu seçiciden seçim yapar.
- `/model`, yeni oturum seçimini hemen kalıcı hâle getirir.
- Agent boşta ise bir sonraki çalıştırma yeni modeli hemen kullanır.
- Bir çalıştırma zaten etkinse OpenClaw canlı geçişi beklemede olarak işaretler ve yalnızca temiz bir yeniden deneme noktasında yeni modele yeniden başlatır.
- Araç etkinliği veya yanıt çıktısı zaten başlamışsa bekleyen geçiş, daha sonraki bir yeniden deneme fırsatına veya bir sonraki kullanıcı turuna kadar kuyrukta kalabilir.
- `/model status` ayrıntılı görünümdür (kimlik doğrulama adayları ve yapılandırılmışsa sağlayıcı uç noktası `baseUrl` + `api` modu).
- Model başvuruları **ilk** `/` karakterinden bölünerek ayrıştırılır. `/model <ref>` yazarken `provider/model` kullanın.
- Model kimliğinin kendisi `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini eklemelisiniz (örnek: `/model openrouter/moonshotai/kimi-k2`).
- Sağlayıcıyı atlarsanız OpenClaw girdiyi şu sırayla çözümler:
  1. takma ad eşleşmesi
  2. tam bu öneksiz model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesi
  3. yapılandırılmış varsayılan sağlayıcıya yönelik kullanımdan kalkmış geri dönüş
     Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw,
     kaldırılmış eski bir sağlayıcı varsayılanını göstermemek için bunun yerine
     ilk yapılandırılmış sağlayıcı/modele geri döner.

Tam komut davranışı/yapılandırması: [Eğik çizgi komutları](/tr/tools/slash-commands).

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

`--all`, kimlik doğrulama yapılandırılmadan önce paketlenmiş sağlayıcıya ait statik katalog satırlarını içerir;
bu nedenle yalnızca keşif amaçlı görünümler, eşleşen sağlayıcı kimlik bilgilerini
ekleyene kadar kullanılamayan modelleri gösterebilir.

### `models status`

Çözümlenmiş birincil modeli, geri dönüşleri, görsel modelini ve
yapılandırılmış sağlayıcıların kimlik doğrulama genel bakışını gösterir. Ayrıca kimlik doğrulama deposunda bulunan profiller için
OAuth sona erme durumunu da gösterir (varsayılan olarak 24 saat içinde uyarır). `--plain`
yalnızca çözümlenmiş birincil modeli yazdırır.
OAuth durumu her zaman gösterilir (ve `--json` çıktısına dâhil edilir). Yapılandırılmış bir
sağlayıcının kimlik bilgileri yoksa `models status`, bir **Eksik kimlik doğrulama**
bölümü yazdırır.
JSON, `auth.oauth` (uyarı penceresi + profiller) ve `auth.providers`
(sağlayıcı başına etkin kimlik doğrulama, env destekli kimlik bilgileri dâhil) içerir. `auth.oauth`
yalnızca kimlik doğrulama deposu profili sağlığını kapsar; yalnızca env kullanan sağlayıcılar burada görünmez.
Otomasyon için `--check` kullanın (eksik/süresi dolmuşsa çıkış `1`, süresi dolmak üzereyse `2`).
Canlı kimlik doğrulama kontrolleri için `--probe` kullanın; probe satırları kimlik doğrulama profillerinden, env
kimlik bilgilerinden veya `models.json` içinden gelebilir.
Açık `auth.order.<provider>` kaydedilmiş bir profili atlıyorsa probe,
onu denemek yerine `excluded_by_auth_order` bildirir. Kimlik doğrulama mevcutsa ancak o sağlayıcı için
probe yapılabilir bir model çözümlenemiyorsa probe `status: no_model` bildirir.

Kimlik doğrulama seçimi sağlayıcıya/hesaba bağlıdır. Her zaman açık Gateway ana bilgisayarları için API
anahtarları genelde en öngörülebilir seçenektir; Claude CLI yeniden kullanımı ve mevcut Anthropic
OAuth/token profilleri de desteklenir.

Örnek (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Tarama (OpenRouter ücretsiz modeller)

`openclaw models scan`, OpenRouter’ın **ücretsiz model kataloğunu** inceler ve
isteğe bağlı olarak araç ve görsel desteği için modelleri probe edebilir.

Temel bayraklar:

- `--no-probe`: canlı probe'ları atla (yalnızca meta veri)
- `--min-params <b>`: en küçük parametre boyutu (milyar)
- `--max-age-days <days>`: daha eski modelleri atla
- `--provider <name>`: sağlayıcı öneki filtresi
- `--max-candidates <n>`: geri dönüş listesi boyutu
- `--set-default`: `agents.defaults.model.primary` değerini ilk seçime ayarla
- `--set-image`: `agents.defaults.imageModel.primary` değerini ilk görsel seçimine ayarla

Probe için bir OpenRouter API anahtarı gerekir (kimlik doğrulama profillerinden veya
`OPENROUTER_API_KEY` üzerinden).
Anahtar olmadan yalnızca adayları listelemek için `--no-probe` kullanın.

Tarama sonuçları şu ölçütlere göre sıralanır:

1. Görsel desteği
2. Araç gecikmesi
3. Bağlam boyutu
4. Parametre sayısı

Girdi

- OpenRouter `/models` listesi (`:free` filtresi)
- Kimlik doğrulama profillerinden veya `OPENROUTER_API_KEY` üzerinden OpenRouter API anahtarı gerektirir (bkz. [/environment](/tr/help/environment))
- İsteğe bağlı filtreler: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Probe denetimleri: `--timeout`, `--concurrency`

Bir TTY içinde çalıştırıldığında geri dönüşleri etkileşimli olarak seçebilirsiniz. Etkileşimli olmayan
modda varsayılanları kabul etmek için `--yes` geçin.

## Models kayıt defteri (`models.json`)

`models.providers` içindeki özel sağlayıcılar
agent dizini altındaki `models.json` içine yazılır (varsayılan `~/.openclaw/agents/<agentId>/agent/models.json`). Bu dosya
`models.mode` değeri `replace` olarak ayarlanmadıkça varsayılan olarak birleştirilir.

Eşleşen sağlayıcı kimlikleri için birleştirme modu önceliği:

- Agent `models.json` dosyasında zaten bulunan boş olmayan `baseUrl` kazanır.
- Agent `models.json` dosyasındaki boş olmayan `apiKey`, yalnızca o sağlayıcı geçerli yapılandırma/kimlik doğrulama profili bağlamında SecretRef tarafından yönetilmiyorsa kazanır.
- SecretRef tarafından yönetilen sağlayıcı `apiKey` değerleri, çözümlenmiş sırları kalıcılaştırmak yerine kaynak işaretlerinden (`ENV_VAR_NAME` env başvuruları için, dosya/exec başvuruları için `secretref-managed`) yenilenir.
- SecretRef tarafından yönetilen sağlayıcı header değerleri, kaynak işaretlerinden (env başvuruları için `secretref-env:ENV_VAR_NAME`, dosya/exec başvuruları için `secretref-managed`) yenilenir.
- Boş veya eksik agent `apiKey`/`baseUrl` değerleri, yapılandırmadaki `models.providers` değerine geri döner.
- Diğer sağlayıcı alanları yapılandırmadan ve normalize edilmiş katalog verilerinden yenilenir.

İşaretleyici kalıcılığı kaynak açısından yetkilidir: OpenClaw işaretleyicileri çözülmüş çalışma zamanı sır değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden (çözümleme öncesi) yazar.
Bu, OpenClaw `models.json` dosyasını yeniden oluşturduğunda, `openclaw agent` gibi komut odaklı yollar dâhil, her zaman geçerlidir.

## İlgili

- [Model Sağlayıcıları](/tr/concepts/model-providers) — sağlayıcı yönlendirmesi ve kimlik doğrulama
- [Model Devretme](/tr/concepts/model-failover) — geri dönüş zincirleri
- [Görsel Oluşturma](/tr/tools/image-generation) — görsel model yapılandırması
- [Müzik Oluşturma](/tr/tools/music-generation) — müzik model yapılandırması
- [Video Oluşturma](/tr/tools/video-generation) — video model yapılandırması
- [Yapılandırma Başvurusu](/tr/gateway/configuration-reference#agent-defaults) — model yapılandırma anahtarları
