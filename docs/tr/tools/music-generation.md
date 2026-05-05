---
read_when:
    - Ajan aracılığıyla müzik veya ses oluşturma
    - Müzik üretimi sağlayıcılarını ve modellerini yapılandırma
    - music_generate aracının parametrelerini anlama
sidebarTitle: Music generation
summary: Google Lyria, MiniMax ve ComfyUI iş akışlarında music_generate ile müzik oluşturun
title: Müzik oluşturma
x-i18n:
    generated_at: "2026-05-05T06:19:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5e74aa7d43ffe00adb6d6c170d36dbc107f2baf0069243733c5dd6e4582175a
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` aracı, ajanın yapılandırılmış sağlayıcılarla ortak müzik üretme yeteneği üzerinden müzik veya ses oluşturmasını sağlar — bugün Google, MiniMax ve workflow ile yapılandırılmış ComfyUI.

Oturum destekli ajan çalıştırmaları için OpenClaw, müzik üretimini bir arka plan görevi olarak başlatır, görev defterinde izler, ardından parça hazır olduğunda ajanı tekrar uyandırır; böylece ajan kullanıcıya haber verebilir ve tamamlanan sesi ekleyebilir. Yalnızca mesaj aracıyla görünür teslim kullanan grup/kanal sohbetlerinde ajan sonucu mesaj aracı üzerinden iletir. Tamamlama ajanı yalnızca özel bir nihai yanıt yazarsa OpenClaw, üretilen medyayla doğrudan kanal gönderimine geri döner. Tamamlama uyandırması, ajana bu rotalarda normal nihai yanıtların özel olduğunu açıkça bildirir.

<Note>
Yerleşik ortak araç yalnızca en az bir müzik üretme sağlayıcısı mevcut olduğunda görünür. Ajanınızın araçlarında `music_generate` görmüyorsanız `agents.defaults.musicGenerationModel` yapılandırın veya bir sağlayıcı API anahtarı ayarlayın.
</Note>

## Hızlı başlangıç

<Tabs>
  <Tab title="Shared provider-backed">
    <Steps>
      <Step title="Configure auth">
        En az bir sağlayıcı için bir API anahtarı ayarlayın — örneğin `GEMINI_API_KEY` veya `MINIMAX_API_KEY`.
      </Step>
      <Step title="Pick a default model (optional)">
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
      <Step title="Ask the agent">
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        Ajan `music_generate` öğesini otomatik olarak çağırır. Araç allow-list'e ekleme gerekmez.
      </Step>
    </Steps>

    Oturum destekli bir ajan çalıştırması olmayan doğrudan senkron bağlamlarda, yerleşik araç yine de satır içi üretime geri döner ve araç sonucunda nihai medya yolunu döndürür.

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        `plugins.entries.comfy.config.music` öğesini bir workflow JSON'u ve prompt/çıktı düğümleriyle yapılandırın.
      </Step>
      <Step title="Cloud auth (optional)">
        Comfy Cloud için `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` ayarlayın.
      </Step>
      <Step title="Call the tool">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Örnek prompt'lar:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## Desteklenen sağlayıcılar

| Sağlayıcı | Varsayılan model       | Referans girişler | Desteklenen kontroller                                  | Kimlik doğrulama                       |
| -------- | ---------------------- | ---------------- | ------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | En fazla 1 görsel | Workflow tarafından tanımlanan müzik veya ses           | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | En fazla 10 görsel | `lyrics`, `instrumental`, `format`                      | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Yok              | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` veya MiniMax OAuth   |

### Yetenek matrisi

`music_generate`, sözleşme testleri ve ortak canlı tarama tarafından kullanılan açık mod sözleşmesi:

| Sağlayıcı | `generate` | `edit` | Düzenleme sınırı | Ortak canlı şeritler                                                      |
| -------- | :--------: | :----: | ---------------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 görsel         | Ortak taramada değil; `extensions/comfy/comfy.live.test.ts` tarafından kapsanır |
| Google   |     ✓      |   ✓    | 10 görsel        | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | Yok              | `generate`                                                                |

Çalışma zamanında mevcut ortak sağlayıcıları ve modelleri incelemek için `action: "list"` kullanın:

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
  Müzik üretme prompt'u. `action: "generate"` için gereklidir.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` mevcut oturum görevini döndürür; `"list"` sağlayıcıları inceler.
</ParamField>
<ParamField path="model" type="string">
  Sağlayıcı/model geçersiz kılması (örn. `google/lyria-3-pro-preview`, `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Sağlayıcı açık şarkı sözü girişini desteklediğinde isteğe bağlı şarkı sözleri.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Sağlayıcı desteklediğinde yalnızca enstrümantal çıktı isteyin.
</ParamField>
<ParamField path="image" type="string">
  Tek referans görsel yolu veya URL'si.
</ParamField>
<ParamField path="images" type="string[]">
  Birden çok referans görsel (destekleyen sağlayıcılarda en fazla 10).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Sağlayıcı süre ipuçlarını desteklediğinde saniye cinsinden hedef süre.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Sağlayıcı desteklediğinde çıktı biçimi ipucu.
</ParamField>
<ParamField path="filename" type="string">Çıktı dosya adı ipucu.</ParamField>
<ParamField path="timeoutMs" type="number">İsteğe bağlı sağlayıcı isteği zaman aşımı, milisaniye cinsinden. 10000ms altındaki değerler 10000ms'ye yükseltilir ve araç sonucunda bildirilir.</ParamField>

<Note>
Tüm sağlayıcılar tüm parametreleri desteklemez. OpenClaw yine de gönderimden önce giriş sayıları gibi katı sınırları doğrular. Bir sağlayıcı süreyi destekliyor ancak istenen değerden daha kısa bir maksimum kullanıyorsa OpenClaw en yakın desteklenen süreye sınırlar. Gerçekten desteklenmeyen isteğe bağlı ipuçları, seçilen sağlayıcı veya model bunları karşılayamadığında bir uyarıyla yok sayılır. Araç sonuçları uygulanan ayarları bildirir; `details.normalization` istenenden uygulanana yapılan eşlemeleri yakalar.
</Note>

## Asenkron davranış

Oturum destekli müzik üretimi arka plan görevi olarak çalışır:

- **Arka plan görevi:** `music_generate` bir arka plan görevi oluşturur, başlatıldı/görev yanıtını hemen döndürür ve tamamlanan parçayı daha sonra takip eden bir ajan mesajında gönderir.
- **Yinelenenleri önleme:** Bir görev `queued` veya `running` durumundayken, aynı oturumdaki sonraki `music_generate` çağrıları başka bir üretim başlatmak yerine görev durumunu döndürür. Açıkça kontrol etmek için `action: "status"` kullanın.
- **Durum arama:** `openclaw tasks list` veya `openclaw tasks show <taskId>` kuyrukta, çalışıyor ve terminal durumlarını inceler.
- **Tamamlama uyandırması:** OpenClaw, modelin kullanıcıya dönük takip mesajını kendisinin yazabilmesi için aynı oturuma dahili bir tamamlama olayı enjekte eder.
- **Prompt ipucu:** Aynı oturumdaki sonraki kullanıcı/manuel turlar, bir müzik görevi zaten devam ediyorsa küçük bir çalışma zamanı ipucu alır; böylece model körü körüne tekrar `music_generate` çağırmaz.
- **Oturumsuz geri dönüş:** Gerçek bir ajan oturumu olmayan doğrudan/yerel bağlamlar satır içi çalışır ve nihai ses sonucunu aynı turda döndürür.

### Görev yaşam döngüsü

| Durum       | Anlam                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------- |
| `queued`    | Görev oluşturuldu, sağlayıcının kabul etmesini bekliyor.                                      |
| `running`   | Sağlayıcı işliyor (sağlayıcıya ve süreye bağlı olarak genellikle 30 saniye ile 3 dakika).     |
| `succeeded` | Parça hazır; ajan uyanır ve onu konuşmaya gönderir.                                           |
| `failed`    | Sağlayıcı hatası veya zaman aşımı; ajan hata ayrıntılarıyla uyanır.                           |

CLI'dan durumu kontrol edin:

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

1. Araç çağrısından `model` parametresi (ajan bir tane belirtirse).
2. Yapılandırmadan `musicGenerationModel.primary`.
3. Sırayla `musicGenerationModel.fallbacks`.
4. Yalnızca kimlik doğrulama destekli sağlayıcı varsayılanlarıyla otomatik algılama:
   - önce mevcut varsayılan sağlayıcı;
   - kalan kayıtlı müzik üretme sağlayıcıları, sağlayıcı kimliği sırasına göre.

Bir sağlayıcı başarısız olursa sonraki aday otomatik olarak denenir. Tümü başarısız olursa hata her denemeden ayrıntılar içerir.

Yalnızca açık `model`, `primary` ve `fallbacks` girişlerini kullanmak için `agents.defaults.mediaGenerationAutoProviderFallback: false` ayarlayın.

## Sağlayıcı notları

<AccordionGroup>
  <Accordion title="ComfyUI">
    Workflow odaklıdır ve prompt/çıktı alanları için yapılandırılmış grafiğe ve düğüm eşlemesine bağlıdır. Paketlenen `comfy` Plugin, müzik üretme sağlayıcı kayıt defteri üzerinden ortak `music_generate` aracına bağlanır.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Lyria 3 toplu üretimini kullanır. Mevcut paketlenmiş akış prompt'u, isteğe bağlı şarkı sözü metnini ve isteğe bağlı referans görselleri destekler.
  </Accordion>
  <Accordion title="MiniMax">
    Toplu `music_generation` endpoint'ini kullanır. `minimax` API anahtarı kimlik doğrulaması veya `minimax-portal` OAuth üzerinden prompt, isteğe bağlı şarkı sözleri, enstrümantal mod, süre yönlendirme ve mp3 çıktısını destekler.
  </Accordion>
</AccordionGroup>

## Doğru yolu seçme

- **Ortak sağlayıcı destekli**: Model seçimi, sağlayıcı failover'ı ve yerleşik asenkron görev/durum akışı istediğinizde.
- **Plugin yolu (ComfyUI)**: Özel bir workflow grafiğine veya ortak paketlenmiş müzik yeteneğinin parçası olmayan bir sağlayıcıya ihtiyacınız olduğunda.

ComfyUI'ye özgü davranışta hata ayıklıyorsanız bkz. [ComfyUI](/tr/providers/comfy). Ortak sağlayıcı davranışında hata ayıklıyorsanız [Google (Gemini)](/tr/providers/google) veya [MiniMax](/tr/providers/minimax) ile başlayın.

## Sağlayıcı yetenek modları

Ortak müzik üretme sözleşmesi açık mod bildirimlerini destekler:

- Yalnızca prompt ile üretim için `generate`.
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

`maxInputImages`, `supportsLyrics` ve `supportsFormat` gibi eski düz alanlar düzenleme desteğini duyurmak için **yeterli değildir**. Sağlayıcılar `generate` ve `edit` öğelerini açıkça bildirmelidir; böylece canlı testler, sözleşme testleri ve ortak `music_generate` aracı mod desteğini deterministik olarak doğrulayabilir.

## Canlı testler

Ortak paketlenmiş sağlayıcılar için isteğe bağlı canlı kapsam:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Repo sarmalayıcısı:

```bash
pnpm test:live:media music
```

Bu canlı dosya eksik sağlayıcı env değişkenlerini `~/.profile` öğesinden yükler, varsayılan olarak canlı/env API anahtarlarını depolanmış kimlik doğrulama profillerinin önüne alır ve sağlayıcı düzenleme modunu etkinleştirdiğinde hem `generate` hem de bildirilen `edit` kapsamını çalıştırır. Bugünkü kapsam:

- `google`: `generate` artı `edit`
- `minimax`: yalnızca `generate`
- `comfy`: paylaşılan sağlayıcı taraması değil, ayrı Comfy canlı kapsamı

Paketle gelen ComfyUI müzik yolu için isteğe bağlı canlı kapsam:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy canlı dosyası, bu bölümler yapılandırıldığında comfy görüntü ve video iş akışlarını da kapsar.

## İlgili

- [Arka plan görevleri](/tr/automation/tasks) — ayrılmış `music_generate` çalıştırmaları için görev takibi
- [ComfyUI](/tr/providers/comfy)
- [Yapılandırma referansı](/tr/gateway/config-agents#agent-defaults) — `musicGenerationModel` yapılandırması
- [Google (Gemini)](/tr/providers/google)
- [MiniMax](/tr/providers/minimax)
- [Modeller](/tr/concepts/models) — model yapılandırması ve yük devretme
- [Araçlara genel bakış](/tr/tools)
