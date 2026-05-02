---
read_when:
    - Aracı üzerinden müzik veya ses oluşturma
    - Müzik oluşturma sağlayıcılarını ve modellerini yapılandırma
    - music_generate aracının parametrelerini anlama
sidebarTitle: Music generation
summary: Google Lyria, MiniMax ve ComfyUI iş akışlarında music_generate aracılığıyla müzik oluşturun
title: Müzik üretimi
x-i18n:
    generated_at: "2026-05-02T09:08:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9199afe17b2641efb1a7523c651724af9c312c1415c7e60ca736341699f6bc26
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` aracı, aracının yapılandırılmış sağlayıcılarla paylaşılan müzik oluşturma yeteneği üzerinden müzik veya ses oluşturmasını sağlar: bugün Google, MiniMax ve iş akışıyla yapılandırılmış ComfyUI.

Oturum destekli aracı çalıştırmaları için OpenClaw, müzik oluşturmayı bir arka plan görevi olarak başlatır, görev defterinde izler, ardından parça hazır olduğunda aracıyı yeniden uyandırır; böylece aracı tamamlanan sesi özgün kanala geri gönderebilir.

<Note>
Yerleşik paylaşılan araç yalnızca en az bir müzik oluşturma sağlayıcısı kullanılabilir olduğunda görünür. Aracınızın araçlarında `music_generate` görmüyorsanız `agents.defaults.musicGenerationModel` yapılandırın veya bir sağlayıcı API anahtarı ayarlayın.
</Note>

## Hızlı başlangıç

<Tabs>
  <Tab title="Paylaşılan sağlayıcı destekli">
    <Steps>
      <Step title="Kimlik doğrulamayı yapılandırın">
        En az bir sağlayıcı için bir API anahtarı ayarlayın; örneğin `GEMINI_API_KEY` veya `MINIMAX_API_KEY`.
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
      <Step title="Aracıdan isteyin">
        _"Neon bir şehirde gece sürüşü hakkında hareketli bir synthpop parçası oluştur."_

        Aracı `music_generate` çağrısını otomatik olarak yapar. Araç izin listesi gerekmez.
      </Step>
    </Steps>

    Oturum destekli bir aracı çalıştırması olmayan doğrudan eşzamanlı bağlamlarda, yerleşik araç yine satır içi oluşturmaya geri döner ve araç sonucunda nihai medya yolunu döndürür.

  </Tab>
  <Tab title="ComfyUI iş akışı">
    <Steps>
      <Step title="İş akışını yapılandırın">
        `plugins.entries.comfy.config.music` değerini bir iş akışı JSON'u ve prompt/çıktı düğümleriyle yapılandırın.
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

Örnek promptlar:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## Desteklenen sağlayıcılar

| Sağlayıcı | Varsayılan model       | Referans girdileri | Desteklenen denetimler                                  | Kimlik doğrulama                       |
| -------- | ---------------------- | ------------------ | ------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | En fazla 1 görsel  | İş akışıyla tanımlanan müzik veya ses                   | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | En fazla 10 görsel | `lyrics`, `instrumental`, `format`                      | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Yok                | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` veya MiniMax OAuth   |

### Yetenek matrisi

`music_generate`, sözleşme testleri ve paylaşılan canlı tarama tarafından kullanılan açık mod sözleşmesi:

| Sağlayıcı | `generate` | `edit` | Düzenleme sınırı | Paylaşılan canlı hatlar                                                     |
| -------- | :--------: | :----: | ---------------- | --------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 görsel         | Paylaşılan taramada değil; `extensions/comfy/comfy.live.test.ts` kapsar     |
| Google   |     ✓      |   ✓    | 10 görsel        | `generate`, `edit`                                                          |
| MiniMax  |     ✓      |   —    | Yok              | `generate`                                                                  |

Çalışma zamanında kullanılabilir paylaşılan sağlayıcıları ve modelleri incelemek için `action: "list"` kullanın:

```text
/tool music_generate action=list
```

Etkin oturum destekli müzik görevini incelemek için `action: "status"` kullanın:

```text
/tool music_generate action=status
```

Doğrudan oluşturma örneği:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Araç parametreleri

<ParamField path="prompt" type="string" required>
  Müzik oluşturma promptu. `action: "generate"` için gereklidir.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` geçerli oturum görevini döndürür; `"list"` sağlayıcıları inceler.
</ParamField>
<ParamField path="model" type="string">
  Sağlayıcı/model geçersiz kılma (ör. `google/lyria-3-pro-preview`, `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Sağlayıcı açık şarkı sözü girdisini desteklediğinde isteğe bağlı şarkı sözleri.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Sağlayıcı desteklediğinde yalnızca enstrümantal çıktı isteyin.
</ParamField>
<ParamField path="image" type="string">
  Tek referans görsel yolu veya URL.
</ParamField>
<ParamField path="images" type="string[]">
  Birden çok referans görseli (destekleyen sağlayıcılarda en fazla 10).
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
Tüm sağlayıcılar tüm parametreleri desteklemez. OpenClaw, gönderimden önce girdi sayıları gibi katı sınırları yine de doğrular. Bir sağlayıcı süreyi destekleyip istenen değerden daha kısa bir maksimum kullanıyorsa OpenClaw en yakın desteklenen süreye sınırlar. Seçilen sağlayıcı veya model gerçekten desteklenmeyen isteğe bağlı ipuçlarını karşılayamıyorsa bunlar bir uyarıyla yok sayılır. Araç sonuçları uygulanan ayarları raporlar; `details.normalization` istenen değerden uygulanan değere yapılan eşlemeleri yakalar.
</Note>

## Async davranışı

Oturum destekli müzik oluşturma bir arka plan görevi olarak çalışır:

- **Arka plan görevi:** `music_generate` bir arka plan görevi oluşturur, başlatıldı/görev yanıtını hemen döndürür ve tamamlanan parçayı daha sonra takip eden bir aracı mesajında gönderir.
- **Yinelenmeyi önleme:** Bir görev `queued` veya `running` durumundayken aynı oturumdaki sonraki `music_generate` çağrıları başka bir oluşturma başlatmak yerine görev durumunu döndürür. Açıkça denetlemek için `action: "status"` kullanın.
- **Durum arama:** `openclaw tasks list` veya `openclaw tasks show <taskId>` kuyruğa alınmış, çalışan ve terminal durumları inceler.
- **Tamamlanma uyandırması:** OpenClaw, modelin kullanıcıya yönelik takip mesajını kendisi yazabilmesi için aynı oturuma dahili bir tamamlanma olayı enjekte eder.
- **Prompt ipucu:** Aynı oturumdaki sonraki kullanıcı/manuel turlar, bir müzik görevi zaten devam ediyorsa küçük bir çalışma zamanı ipucu alır; böylece model körü körüne yeniden `music_generate` çağırmaz.
- **Oturumsuz geri dönüş:** Gerçek bir aracı oturumu olmayan doğrudan/yerel bağlamlar satır içi çalışır ve nihai ses sonucunu aynı turda döndürür.

### Görev yaşam döngüsü

| Durum       | Anlam                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Görev oluşturuldu, sağlayıcının kabul etmesini bekliyor.                                       |
| `running`   | Sağlayıcı işliyor (sağlayıcıya ve süreye bağlı olarak genellikle 30 saniye ile 3 dakika arası). |
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

### Sağlayıcı seçim sırası

OpenClaw sağlayıcıları şu sırayla dener:

1. Araç çağrısından gelen `model` parametresi (aracı bir tane belirttiyse).
2. Yapılandırmadan `musicGenerationModel.primary`.
3. Sırayla `musicGenerationModel.fallbacks`.
4. Yalnızca kimlik doğrulama destekli sağlayıcı varsayılanları kullanılarak otomatik algılama:
   - önce geçerli varsayılan sağlayıcı;
   - provider-id sırasına göre kalan kayıtlı müzik oluşturma sağlayıcıları.

Bir sağlayıcı başarısız olursa sonraki aday otomatik olarak denenir. Tümü başarısız olursa hata, her denemenin ayrıntılarını içerir.

Yalnızca açık `model`, `primary` ve `fallbacks` girdilerini kullanmak için `agents.defaults.mediaGenerationAutoProviderFallback: false` ayarlayın.

## Sağlayıcı notları

<AccordionGroup>
  <Accordion title="ComfyUI">
    İş akışı güdümlüdür ve yapılandırılmış grafiğe ek olarak prompt/çıktı alanları için düğüm eşlemesine bağlıdır. Paketli `comfy` Plugin, müzik oluşturma sağlayıcı kayıt defteri üzerinden paylaşılan `music_generate` aracına bağlanır.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Lyria 3 toplu oluşturmayı kullanır. Geçerli paketli akış promptu, isteğe bağlı şarkı sözü metnini ve isteğe bağlı referans görselleri destekler.
  </Accordion>
  <Accordion title="MiniMax">
    Toplu `music_generation` endpoint'ini kullanır. Promptu, isteğe bağlı şarkı sözlerini, enstrümantal modu, süre yönlendirmesini ve `minimax` API anahtarı kimlik doğrulaması ya da `minimax-portal` OAuth üzerinden mp3 çıktısını destekler.
  </Accordion>
</AccordionGroup>

## Doğru yolu seçme

- **Paylaşılan sağlayıcı destekli**: model seçimi, sağlayıcı yük devri ve yerleşik async görev/durum akışı istediğinizde.
- **Plugin yolu (ComfyUI)**: özel bir iş akışı grafiğine veya paylaşılan paketli müzik yeteneğinin parçası olmayan bir sağlayıcıya ihtiyaç duyduğunuzda.

ComfyUI'ye özgü davranışta hata ayıklıyorsanız [ComfyUI](/tr/providers/comfy) bölümüne bakın. Paylaşılan sağlayıcı davranışında hata ayıklıyorsanız [Google (Gemini)](/tr/providers/google) veya [MiniMax](/tr/providers/minimax) ile başlayın.

## Sağlayıcı yetenek modları

Paylaşılan müzik oluşturma sözleşmesi açık mod bildirimlerini destekler:

- Yalnızca prompt ile oluşturma için `generate`.
- İstek bir veya daha fazla referans görseli içerdiğinde `edit`.

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

`maxInputImages`, `supportsLyrics` ve `supportsFormat` gibi eski düz alanlar düzenleme desteğini duyurmak için **yeterli değildir**. Sağlayıcılar `generate` ve `edit` değerlerini açıkça bildirmelidir; böylece canlı testler, sözleşme testleri ve paylaşılan `music_generate` aracı mod desteğini deterministik olarak doğrulayabilir.

## Canlı testler

Paylaşılan paketli sağlayıcılar için katılımlı canlı kapsam:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Repo sarmalayıcısı:

```bash
pnpm test:live:media music
```

Bu canlı dosya eksik sağlayıcı env var'larını `~/.profile` içinden yükler, varsayılan olarak canlı/env API anahtarlarını saklanan kimlik doğrulama profillerinden önce tercih eder ve sağlayıcı düzenleme modunu etkinleştirdiğinde hem `generate` hem de bildirilen `edit` kapsamını çalıştırır. Bugünkü kapsam:

- `google`: `generate` artı `edit`
- `minimax`: yalnızca `generate`
- `comfy`: ayrı Comfy canlı kapsamı, paylaşılan sağlayıcı taraması değil

Paketli ComfyUI müzik yolu için katılımlı canlı kapsam:

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
