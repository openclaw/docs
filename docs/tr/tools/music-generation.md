---
read_when:
    - Aracı aracılığıyla müzik veya ses oluşturma
    - Müzik oluşturma sağlayıcılarını ve modellerini yapılandırma
    - music_generate aracı parametrelerini anlama
sidebarTitle: Music generation
summary: ComfyUI, fal, Google Lyria, MiniMax ve OpenRouter iş akışlarında music_generate aracılığıyla müzik oluşturun
title: Müzik üretimi
x-i18n:
    generated_at: "2026-07-12T12:49:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a540f537141f0d97b264420aae9e986c1f0c3927b8988ebbaf3798b8afd5dd2
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` aracı, ComfyUI, fal, Google, MiniMax ve OpenRouter tarafından
desteklenen ortak müzik üretme özelliği aracılığıyla müzik veya ses oluşturur.

<Note>
`music_generate` yalnızca en az bir müzik üretme sağlayıcısı kullanılabilir
olduğunda görünür: açık bir `agents.defaults.musicGenerationModel`
yapılandırması veya kimlik doğrulaması yapılandırılmış bir sağlayıcı (örneğin
ayarlanmış bir API anahtarı).
</Note>

Oturum destekli ajan çalıştırmalarında `music_generate` bir arka plan görevi
olarak başlar, görev kaydındaki ilerlemeyi izler ve ardından parça hazır
olduğunda kullanıcıyı bilgilendirip tamamlanan sesi ekleyebilmesi için ajanı
uyandırır. Tamamlama ajanı, oturumun görünür yanıt sözleşmesine uyar:
yapılandırıldığında otomatik nihai yanıt verir veya oturum mesaj aracını
gerektirdiğinde `message(action="send")` kullanır. İstekte bulunan oturum etkin
değilse ya da uyandırma işlemi başarısız olursa ve oluşturulan ses hâlâ yanıtta
eksikse OpenClaw, yalnızca eksik sesi içeren eşgüçlü bir doğrudan geri dönüş
gönderir.

## Hızlı başlangıç

<Tabs>
  <Tab title="Ortak sağlayıcı destekli">
    <Steps>
      <Step title="Kimlik doğrulamayı yapılandırın">
        En az bir sağlayıcı için bir API anahtarı ayarlayın; örneğin
        `GEMINI_API_KEY` veya `MINIMAX_API_KEY`.
      </Step>
      <Step title="Varsayılan model seçin (isteğe bağlı)">
        ```json5
        {
          agents: {
            defaults: {
              musicGenerationModel: {
                primary: "google/lyria-3-clip-preview",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Ajandan isteyin">
        _"Neon bir şehirde gece sürüşünü anlatan hareketli bir synthpop
        parçası oluştur."_

        Ajan `music_generate` aracını otomatik olarak çağırır. Aracın izin
        listesine eklenmesi gerekmez.
      </Step>
    </Steps>

    Oturum destekli bir ajan çalıştırması olmadan (doğrudan/yerel bağlamlarda)
    araç satır içi çalışır ve nihai medya yolunu aynı araç sonucunda döndürür.

  </Tab>
  <Tab title="ComfyUI iş akışı">
    <Steps>
      <Step title="İş akışını yapılandırın">
        `plugins.entries.comfy.config.music` öğesini bir iş akışı JSON'u ve
        istem/çıktı düğümleriyle yapılandırın.
      </Step>
      <Step title="Bulut kimlik doğrulaması (isteğe bağlı)">
        Comfy Cloud için `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` ayarlayın.
      </Step>
      <Step title="Aracı çağırın">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Örnek istemler:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

Kullanılabilir sağlayıcıları/modelleri incelemek için `action: "list"`,
etkin oturum destekli müzik görevini incelemek için `action: "status"` kullanın:

```text
/tool music_generate action=list
/tool music_generate action=status
```

Doğrudan üretim örneği:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Desteklenen sağlayıcılar

| Sağlayıcı   | Varsayılan model             | Referans girdileri | Desteklenen denetimler                                | Kimlik doğrulama                       |
| ----------- | ---------------------------- | ------------------ | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI     | `workflow`                   | En fazla 1 görsel  | İş akışı tanımlı müzik veya ses                       | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal         | `fal-ai/minimax-music/v2.6`  | Yok                | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` veya `FAL_API_KEY`           |
| Google      | `lyria-3-clip-preview`       | En fazla 10 görsel | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax     | `music-2.6`                  | Yok                | `lyrics`, `instrumental`, `format` (yalnızca mp3)     | `MINIMAX_API_KEY` veya MiniMax OAuth   |
| OpenRouter  | `google/lyria-3-pro-preview` | En fazla 1 görsel  | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

MiniMax, aynı modelleri paylaşan iki sağlayıcı kimliği kaydeder: API anahtarıyla
kimlik doğrulama için `minimax`, OAuth için `minimax-portal`. Model referansları
kimlik doğrulama yolunu izler (`minimax/music-2.6` ile
`minimax-portal/music-2.6`); bkz.
[MiniMax](/tr/providers/minimax#music-generation).

fal, varsayılan MiniMax destekli modelinin yanı sıra
`fal-ai/ace-step/prompt-to-audio` (wav, şarkı sözü yok, enstrümantal geçiş
anahtarı yok) ve `fal-ai/stable-audio-25/text-to-audio` (wav, yalnızca istem)
modellerini de sunar. Google'ın varsayılan `lyria-3-clip-preview` modeli yalnızca
mp3 çıktısı verir; `lyria-3-pro-preview` ayrıca wav biçimini destekler. MiniMax
ayrıca `music-2.6-free`, `music-cover` ve `music-cover-free` modellerini sunar.
OpenRouter ayrıca `google/lyria-3-clip-preview` modelini sunar.

### Yetenek matrisi

`music_generate`, sözleşme testleri ve ortak canlı tarama tarafından kullanılan
açık kip sözleşmesi:

| Sağlayıcı  | `generate` | `edit` | Düzenleme sınırı | Ortak canlı kulvarlar                                                     |
| ---------- | :--------: | :----: | ---------------- | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 görsel         | Ortak taramada değil; `extensions/comfy/comfy.live.test.ts` kapsamındadır |
| fal        |     ✓      |   —    | Yok              | `generate`                                                                |
| Google     |     ✓      |   ✓    | 10 görsel        | `generate`, `edit`                                                        |
| MiniMax    |     ✓      |   —    | Yok              | `generate`                                                                |
| OpenRouter |     ✓      |   ✓    | 1 görsel         | `generate`, `edit`                                                        |

## Araç parametreleri

<ParamField path="prompt" type="string" required>
  Müzik üretme istemi. `action: "generate"` için gereklidir.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` geçerli oturum görevini döndürür; `"list"` sağlayıcıları inceler.
</ParamField>
<ParamField path="model" type="string">
  Sağlayıcı/model geçersiz kılması (ör. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Sağlayıcı açık şarkı sözü girdisini desteklediğinde isteğe bağlı şarkı sözleri.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Sağlayıcı desteklediğinde yalnızca enstrümantal çıktı isteyin.
</ParamField>
<ParamField path="image" type="string">
  Tek referans görselinin yolu veya URL'si.
</ParamField>
<ParamField path="images" type="string[]">
  Birden fazla referans görseli (destekleyen sağlayıcılarda en fazla 10).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Sağlayıcı süre ipuçlarını desteklediğinde saniye cinsinden hedef süre.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Sağlayıcı desteklediğinde çıktı biçimi ipucu.
</ParamField>
<ParamField path="filename" type="string">Çıktı dosyası adı ipucu.</ParamField>

<Note>
Tüm sağlayıcılar bütün parametreleri desteklemez. OpenClaw, gönderimden önce
girdi sayıları gibi kesin sınırları yine de doğrular. Bir sağlayıcı süreyi
destekliyor ancak istenen değerden daha kısa bir azami değer kullanıyorsa
OpenClaw bunu desteklenen en yakın süreye sınırlar. Seçilen sağlayıcı veya model
gerçekten desteklenmeyen isteğe bağlı ipuçlarını yerine getiremiyorsa bu ipuçları
bir uyarıyla yok sayılır. Araç sonuçları uygulanan ayarları bildirir;
`details.normalization`, istenen değerlerden uygulanan değerlere yapılan tüm
eşlemeleri içerir.
</Note>

Sağlayıcı istek zaman aşımları yalnızca operatör yapılandırmasıdır. OpenClaw,
yapılandırıldığında `agents.defaults.musicGenerationModel.timeoutMs` değerini
kullanır, 120000ms altındaki değerleri 120000ms değerine yükseltir ve aksi
durumda sağlayıcı istekleri için varsayılan olarak 300000ms kullanır.

## Eşzamansız davranış

Oturum destekli müzik üretimi bir arka plan görevi olarak çalışır:

- **Arka plan görevi:** `music_generate` bir arka plan görevi oluşturur,
  başlatıldı/görev yanıtını hemen döndürür ve tamamlanan parçayı daha sonra bir
  takip ajan mesajında gönderir.
- **Yinelemeyi önleme:** Bir görev `queued` veya `running` durumundayken aynı
  oturumdaki sonraki `music_generate` çağrıları başka bir üretim başlatmak
  yerine görev durumunu döndürür. Açıkça denetlemek için `action: "status"`
  kullanın. Yakın zamanda tamamlanmış eşleşen bir istek de 2 dakika boyunca
  yinelenmez.
- **Durum sorgulama:** `openclaw tasks list` veya
  `openclaw tasks show <taskId>`, sıraya alınmış, çalışan ve sonlandırılmış
  durumları inceler.
- **Tamamlama uyandırması:** OpenClaw, modelin kullanıcıya yönelik takip
  mesajını kendisinin yazabilmesi için aynı oturuma bir dahili tamamlama olayı
  ekler.
- **İstem ipucu:** Aynı oturumdaki sonraki kullanıcı/manuel turlarında, bir
  müzik görevi zaten devam ediyorsa modele küçük bir çalışma zamanı ipucu
  verilir; böylece model `music_generate` aracını körü körüne yeniden çağırmaz.
- **Oturumsuz geri dönüş:** Gerçek bir ajan oturumu olmayan doğrudan/yerel
  bağlamlar satır içi çalışır ve nihai ses sonucunu aynı turda döndürür.

### Görev yaşam döngüsü

Müzik görevi, genel görev kaydıyla aynı durumları gösterir (`timed_out`,
`cancelled` ve `lost` dâhil tam durum makinesi için bkz.
[Arka plan görevleri](/tr/automation/tasks#task-lifecycle)). Çoğu müzik çalıştırması
şu durumlardan geçer:

| Durum       | Anlamı                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| `queued`    | Görev oluşturuldu; sağlayıcının görevi kabul etmesi bekleniyor.                                      |
| `running`   | Sağlayıcı işliyor (sağlayıcıya ve süreye bağlı olarak genellikle 30 saniye ile 3 dakika arası).       |
| `succeeded` | Parça hazırdır; ajan uyanır ve parçayı konuşmaya gönderir.                                            |
| `failed`    | Sağlayıcı hatası veya zaman aşımı; ajan hata ayrıntılarıyla uyanır.                                   |

Durumu CLI üzerinden denetleyin:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## Yapılandırma

### Model seçimi

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
      },
    },
  },
}
```

### Sağlayıcı seçme sırası

OpenClaw sağlayıcıları şu sırayla dener:

1. Araç çağrısındaki `model` parametresi (ajan bir tane belirtirse).
2. Yapılandırmadaki `musicGenerationModel.primary`.
3. Sırasıyla `musicGenerationModel.fallbacks`.
4. Yalnızca kimlik doğrulama destekli sağlayıcı varsayılanlarını kullanarak
   otomatik algılama:
   - müzik üretimi de sunuyorsa önce geçerli varsayılan metin modeli sağlayıcısı;
   - kalan kayıtlı müzik üretme sağlayıcıları, sağlayıcı kimliğine göre alfabetik
     sırada.

Bir sağlayıcı başarısız olursa sonraki aday otomatik olarak denenir. Tümü
başarısız olursa hata, her denemenin ayrıntılarını içerir.

Yalnızca açık `model`, `primary` ve `fallbacks` girdilerini kullanmak için
`agents.defaults.mediaGenerationAutoProviderFallback: false` ayarını yapın.

## Sağlayıcı notları

<AccordionGroup>
  <Accordion title="ComfyUI">
    İş akışı odaklıdır ve yapılandırılmış grafiğin yanı sıra istem/çıktı
    alanlarının Node eşlemesine bağlıdır. Birlikte gelen `comfy` Plugin'i,
    müzik üretimi sağlayıcı kayıt defteri üzerinden paylaşılan
    `music_generate` aracına bağlanır.
  </Accordion>
  <Accordion title="fal">
    Paylaşılan sağlayıcı kimlik doğrulama yolu üzerinden fal model uç
    noktalarını kullanır. Birlikte gelen sağlayıcı varsayılan olarak
    `fal-ai/minimax-music/v2.6` modelini kullanır ve istemden ses üretme
    istekleri için ayrıca `fal-ai/ace-step/prompt-to-audio` ile
    `fal-ai/stable-audio-25/text-to-audio` modellerini sunar. Şarkı sözleri
    ve enstrümantal mod yalnızca MiniMax modelinde kullanılabilir; diğer iki
    model yalnızca istem kabul eder.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Lyria 3 toplu üretimini kullanır. Birlikte gelen mevcut akış; istemi,
    isteğe bağlı şarkı sözü metnini ve isteğe bağlı referans görselleri
    destekler. Varsayılan `lyria-3-clip-preview` modeli yalnızca mp3 çıktısı
    verir; `lyria-3-pro-preview` modeli wav biçimini de destekler.
  </Accordion>
  <Accordion title="MiniMax">
    Toplu `music_generation` uç noktasını kullanır. `minimax` API anahtarıyla
    kimlik doğrulama veya `minimax-portal` OAuth üzerinden istemi, isteğe
    bağlı şarkı sözlerini, enstrümantal modu ve mp3 çıktısını destekler.
    Ayrıca `music-2.6-free`, `music-cover` ve `music-cover-free` modellerini
    sunar.
  </Accordion>
  <Accordion title="OpenRouter">
    Akış etkinleştirilmiş olarak OpenRouter sohbet tamamlama ses çıktısını
    kullanır. Birlikte gelen sağlayıcı varsayılan olarak
    `google/lyria-3-pro-preview` modelini kullanır ve ayrıca
    `openrouter/google/lyria-3-clip-preview` modelini sunar.
  </Accordion>
</AccordionGroup>

## Doğru yolu seçme

- Model seçimi, sağlayıcı yük devri ve yerleşik eşzamansız görev/durum
  akışını istediğinizde **paylaşılan sağlayıcı destekli yol**.
- Özel bir iş akışı grafiğine veya paylaşılan ve birlikte gelen müzik
  yeteneğinin parçası olmayan bir sağlayıcıya ihtiyaç duyduğunuzda
  **Plugin yolu (ComfyUI)**.

ComfyUI'ye özgü davranışlarda hata ayıklıyorsanız
[ComfyUI](/tr/providers/comfy) sayfasına bakın. Paylaşılan sağlayıcı
davranışında hata ayıklıyorsanız [fal](/tr/providers/fal),
[Google (Gemini)](/tr/providers/google), [MiniMax](/tr/providers/minimax) veya
[OpenRouter](/tr/providers/openrouter) ile başlayın.

## Sağlayıcı yetenek modları

Paylaşılan müzik üretimi sözleşmesi, açık mod bildirimlerini destekler:

- Yalnızca istemle üretim için `generate`.
- İstek bir veya daha fazla referans görsel içerdiğinde `edit`.

Yeni sağlayıcı uygulamaları açık mod bloklarını tercih etmelidir:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

`maxInputImages`, `supportsLyrics` ve `supportsFormat` gibi eski düz alanlar,
düzenleme desteğini duyurmak için **yeterli değildir**. Canlı testlerin,
sözleşme testlerinin ve paylaşılan `music_generate` aracının mod desteğini
belirlenimci biçimde doğrulayabilmesi için sağlayıcılar `generate` ile
`edit` modlarını açıkça bildirmelidir.

## Canlı testler

Paylaşılan ve birlikte gelen sağlayıcılar (fal, Google, MiniMax, OpenRouter)
için isteğe bağlı canlı kapsam:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Aynı test dosyasını çalıştıran eşdeğer depo sarmalayıcısı:

```bash
pnpm test:live:media:music
```

Bu canlı test dosyası, varsayılan olarak saklanan kimlik doğrulama
profillerinden önce dışa aktarılmış mevcut sağlayıcı ortam değişkenlerini
kullanır ve sağlayıcı düzenleme modunu etkinleştirdiğinde hem `generate`
hem de bildirilen `edit` kapsamını çalıştırır. Güncel kapsam:

- `google`: `generate` ve `edit`
- `fal`: yalnızca `generate`
- `minimax`: yalnızca `generate`
- `openrouter`: `generate` ve `edit`
- `comfy`: paylaşılan sağlayıcı taramasından ayrı Comfy canlı kapsamı

Birlikte gelen ComfyUI müzik yolu için isteğe bağlı canlı kapsam:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy canlı test dosyası, ilgili bölümler yapılandırıldığında Comfy görsel ve
video iş akışlarını da kapsar.

## İlgili

- [Arka plan görevleri](/tr/automation/tasks) — ayrılmış `music_generate` çalıştırmalarının görev takibi
- [ComfyUI](/tr/providers/comfy)
- [Yapılandırma başvurusu](/tr/gateway/config-agents#agent-defaults) — `musicGenerationModel` yapılandırması
- [Google (Gemini)](/tr/providers/google)
- [MiniMax](/tr/providers/minimax)
- [Modeller](/tr/concepts/models) — model yapılandırması ve yük devri
- [Araçlara genel bakış](/tr/tools)
