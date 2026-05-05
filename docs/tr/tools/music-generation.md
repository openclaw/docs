---
read_when:
    - Ajan aracılığıyla müzik veya ses oluşturma
    - Müzik üretimi sağlayıcılarını ve modellerini yapılandırma
    - music_generate aracının parametrelerini anlama
sidebarTitle: Music generation
summary: Google Lyria, MiniMax ve ComfyUI iş akışlarında music_generate aracılığıyla müzik oluşturun
title: Müzik üretimi
x-i18n:
    generated_at: "2026-05-05T01:50:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e14a5a10dd485c2d3dbbd23a0fc2c12de500d9f7bfb7db471c27ed2a99ad650
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` aracı, aracının yapılandırılmış sağlayıcılarla paylaşılan müzik üretimi yeteneği üzerinden müzik veya ses oluşturmasını sağlar — bugün Google, MiniMax ve iş akışı yapılandırmalı ComfyUI.

Oturum destekli aracı çalıştırmaları için OpenClaw, müzik üretimini bir arka plan görevi olarak başlatır, görev defterinde izler, ardından parça hazır olduğunda aracıyı yeniden uyandırır; böylece aracı kullanıcıya bilgi verebilir ve tamamlanmış sesi ekleyebilir. Yalnızca mesaj aracıyla görünür teslim kullanan grup/kanal sohbetlerinde aracı, sonucu mesaj aracı üzerinden iletir.

<Note>
Yerleşik paylaşılan araç yalnızca en az bir müzik üretimi sağlayıcısı kullanılabilir olduğunda görünür. Aracınızın araçlarında `music_generate` görmüyorsanız `agents.defaults.musicGenerationModel` değerini yapılandırın veya bir sağlayıcı API anahtarı ayarlayın.
</Note>

## Hızlı başlangıç

<Tabs>
  <Tab title="Paylaşılan sağlayıcı destekli">
    <Steps>
      <Step title="Kimlik doğrulamayı yapılandırın">
        En az bir sağlayıcı için bir API anahtarı ayarlayın — örneğin
        `GEMINI_API_KEY` veya `MINIMAX_API_KEY`.
      </Step>
      <Step title="Varsayılan bir model seçin (isteğe bağlı)">
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
      <Step title="Aracıdan isteyin">
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        Aracı `music_generate` çağrısını otomatik olarak yapar. Araç izin listesine alma gerekmez.
      </Step>
    </Steps>

    Oturum destekli aracı çalıştırması olmayan doğrudan eşzamanlı bağlamlarda, yerleşik araç yine satır içi üretime geri döner ve araç sonucunda nihai medya yolunu döndürür.

  </Tab>
  <Tab title="ComfyUI iş akışı">
    <Steps>
      <Step title="İş akışını yapılandırın">
        `plugins.entries.comfy.config.music` değerini bir iş akışı JSON'u ve istem/çıktı düğümleriyle yapılandırın.
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

## Desteklenen sağlayıcılar

| Sağlayıcı | Varsayılan model       | Referans girdileri | Desteklenen denetimler                                   | Kimlik doğrulama                      |
| -------- | ---------------------- | ------------------ | -------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | En fazla 1 görsel  | İş akışı tarafından tanımlanan müzik veya ses            | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | En fazla 10 görsel | `lyrics`, `instrumental`, `format`                       | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Yok                | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` veya MiniMax OAuth   |

### Yetenek matrisi

`music_generate`, sözleşme testleri ve paylaşılan canlı tarama tarafından kullanılan açık mod sözleşmesi:

| Sağlayıcı | `generate` | `edit` | Düzenleme sınırı | Paylaşılan canlı şeritler                                                |
| -------- | :--------: | :----: | ---------------- | ------------------------------------------------------------------------ |
| ComfyUI  |     ✓      |   ✓    | 1 görsel         | Paylaşılan taramada değil; `extensions/comfy/comfy.live.test.ts` kapsar |
| Google   |     ✓      |   ✓    | 10 görsel        | `generate`, `edit`                                                       |
| MiniMax  |     ✓      |   —    | Yok              | `generate`                                                               |

Çalışma zamanında kullanılabilir paylaşılan sağlayıcıları ve modelleri incelemek için `action: "list"` kullanın:

```text
/tool music_generate action=list
```

Etkin oturum destekli müzik görevini incelemek için `action: "status"` kullanın:

```text
/tool music_generate action=status
```

Doğrudan üretim örneği:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Araç parametreleri

<ParamField path="prompt" type="string" required>
  Müzik üretimi istemi. `action: "generate"` için gereklidir.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` geçerli oturum görevini döndürür; `"list"` sağlayıcıları inceler.
</ParamField>
<ParamField path="model" type="string">
  Sağlayıcı/model geçersiz kılma (örn. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Sağlayıcı açık şarkı sözü girdisini desteklediğinde isteğe bağlı şarkı sözleri.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Sağlayıcı desteklediğinde yalnızca enstrümantal çıktı isteyin.
</ParamField>
<ParamField path="image" type="string">
  Tek referans görsel yolu veya URL'si.
</ParamField>
<ParamField path="images" type="string[]">
  Birden fazla referans görsel (destekleyen sağlayıcılarda en fazla 10).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Sağlayıcı süre ipuçlarını desteklediğinde saniye cinsinden hedef süre.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Sağlayıcı desteklediğinde çıktı biçimi ipucu.
</ParamField>
<ParamField path="filename" type="string">Çıktı dosya adı ipucu.</ParamField>
<ParamField path="timeoutMs" type="number">Milisaniye cinsinden isteğe bağlı sağlayıcı istek zaman aşımı. 10000ms altındaki değerler 10000ms değerine yükseltilir ve araç sonucunda raporlanır.</ParamField>

<Note>
Tüm sağlayıcılar tüm parametreleri desteklemez. OpenClaw, gönderimden önce girdi sayıları gibi katı sınırları yine de doğrular. Bir sağlayıcı süreyi destekler ancak istenen değerden daha kısa bir üst sınır kullanırsa OpenClaw en yakın desteklenen süreye sınırlar. Seçilen sağlayıcı veya model bunları karşılayamadığında gerçekten desteklenmeyen isteğe bağlı ipuçları bir uyarıyla yok sayılır. Araç sonuçları uygulanan ayarları raporlar; `details.normalization` istenenden uygulanana eşlemeleri yakalar.
</Note>

## Eşzamansız davranış

Oturum destekli müzik üretimi arka plan görevi olarak çalışır:

- **Arka plan görevi:** `music_generate` bir arka plan görevi oluşturur, hemen bir başlatıldı/görev yanıtı döndürür ve tamamlanan parçayı daha sonra takip aracı mesajında gönderir.
- **Yinelenenleri önleme:** bir görev `queued` veya `running` durumundayken, aynı oturumdaki sonraki `music_generate` çağrıları başka bir üretim başlatmak yerine görev durumunu döndürür. Açıkça denetlemek için `action: "status"` kullanın.
- **Durum arama:** `openclaw tasks list` veya `openclaw tasks show <taskId>` kuyruğa alınmış, çalışan ve son durumları inceler.
- **Tamamlama uyandırması:** OpenClaw, modelin kullanıcıya dönük takibi kendisinin yazabilmesi için aynı oturuma dahili bir tamamlama olayı enjekte eder.
- **İstem ipucu:** aynı oturumdaki sonraki kullanıcı/manuel turlar, bir müzik görevi zaten devam ediyorsa küçük bir çalışma zamanı ipucu alır; böylece model körlemesine `music_generate` çağrısını tekrar yapmaz.
- **Oturumsuz geri dönüş:** gerçek bir aracı oturumu olmayan doğrudan/yerel bağlamlar satır içi çalışır ve nihai ses sonucunu aynı turda döndürür.

### Görev yaşam döngüsü

| Durum       | Anlam                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Görev oluşturuldu, sağlayıcının kabul etmesi bekleniyor.                                       |
| `running`   | Sağlayıcı işliyor (sağlayıcıya ve süreye bağlı olarak genellikle 30 saniye ila 3 dakika).      |
| `succeeded` | Parça hazır; aracı uyanır ve konuşmaya gönderir.                                               |
| `failed`    | Sağlayıcı hatası veya zaman aşımı; aracı hata ayrıntılarıyla uyanır.                           |

CLI'dan durumu denetleyin:

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
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### Sağlayıcı seçimi sırası

OpenClaw sağlayıcıları şu sırayla dener:

1. Araç çağrısından `model` parametresi (aracı bir tane belirtirse).
2. Yapılandırmadan `musicGenerationModel.primary`.
3. Sırayla `musicGenerationModel.fallbacks`.
4. Yalnızca kimlik doğrulama destekli sağlayıcı varsayılanlarını kullanarak otomatik algılama:
   - önce geçerli varsayılan sağlayıcı;
   - kalan kayıtlı müzik üretimi sağlayıcıları, sağlayıcı kimliği sırasıyla.

Bir sağlayıcı başarısız olursa bir sonraki aday otomatik olarak denenir. Tümü başarısız olursa hata, her denemeden ayrıntıları içerir.

Yalnızca açık `model`, `primary` ve `fallbacks` girişlerini kullanmak için `agents.defaults.mediaGenerationAutoProviderFallback: false` ayarlayın.

## Sağlayıcı notları

<AccordionGroup>
  <Accordion title="ComfyUI">
    İş akışı odaklıdır ve yapılandırılmış grafiğe ek olarak istem/çıktı alanları için düğüm eşlemesine bağlıdır. Paketlenmiş `comfy` plugin, müzik üretimi sağlayıcı kayıt defteri üzerinden paylaşılan `music_generate` aracına bağlanır.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Lyria 3 toplu üretimini kullanır. Geçerli paketlenmiş akış istemi, isteğe bağlı şarkı sözü metnini ve isteğe bağlı referans görselleri destekler.
  </Accordion>
  <Accordion title="MiniMax">
    Toplu `music_generation` uç noktasını kullanır. `minimax` API anahtarı kimlik doğrulaması veya `minimax-portal` OAuth üzerinden istemi, isteğe bağlı şarkı sözlerini, enstrümantal modu, süre yönlendirmesini ve mp3 çıktısını destekler.
  </Accordion>
</AccordionGroup>

## Doğru yolu seçme

- **Paylaşılan sağlayıcı destekli**, model seçimi, sağlayıcı yük devretmesi ve yerleşik eşzamansız görev/durum akışını istediğinizde.
- **Plugin yolu (ComfyUI)**, özel bir iş akışı grafiğine veya paylaşılan paketlenmiş müzik yeteneğinin parçası olmayan bir sağlayıcıya ihtiyaç duyduğunuzda.

ComfyUI'ye özgü davranışta hata ayıklıyorsanız [ComfyUI](/tr/providers/comfy) bölümüne bakın. Paylaşılan sağlayıcı davranışında hata ayıklıyorsanız [Google (Gemini)](/tr/providers/google) veya [MiniMax](/tr/providers/minimax) ile başlayın.

## Sağlayıcı yetenek modları

Paylaşılan müzik üretimi sözleşmesi açık mod bildirimlerini destekler:

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

`maxInputImages`, `supportsLyrics` ve `supportsFormat` gibi eski düz alanlar, düzenleme desteğinin reklamını yapmak için **yeterli değildir**. Sağlayıcılar `generate` ve `edit` değerlerini açıkça bildirmelidir; böylece canlı testler, sözleşme testleri ve paylaşılan `music_generate` aracı mod desteğini deterministik olarak doğrulayabilir.

## Canlı testler

Paylaşılan paketlenmiş sağlayıcılar için isteğe bağlı canlı kapsam:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Repo sarmalayıcısı:

```bash
pnpm test:live:media music
```

Bu canlı dosya eksik sağlayıcı ortam değişkenlerini `~/.profile` içinden yükler, varsayılan olarak depolanmış kimlik doğrulama profillerinden önce canlı/ortam API anahtarlarını tercih eder ve sağlayıcı düzenleme modunu etkinleştirdiğinde hem `generate` hem de bildirilen `edit` kapsamını çalıştırır. Bugünkü kapsam:

- `google`: `generate` ve `edit`
- `minimax`: yalnızca `generate`
- `comfy`: ayrı Comfy canlı kapsamı, paylaşılan sağlayıcı taraması değil

Paketlenmiş ComfyUI müzik yolu için isteğe bağlı canlı kapsam:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy canlı dosyası, bu bölümler yapılandırıldığında Comfy görüntü ve video iş akışlarını da kapsar.

## İlgili

- [Arka plan görevleri](/tr/automation/tasks) — ayrılmış `music_generate` çalıştırmaları için görev takibi
- [ComfyUI](/tr/providers/comfy)
- [Yapılandırma başvurusu](/tr/gateway/config-agents#agent-defaults) — `musicGenerationModel` yapılandırması
- [Google (Gemini)](/tr/providers/google)
- [MiniMax](/tr/providers/minimax)
- [Modeller](/tr/concepts/models) — model yapılandırması ve yük devretme
- [Araçlara genel bakış](/tr/tools)
