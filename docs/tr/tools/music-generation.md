---
read_when:
    - Agent aracılığıyla müzik veya ses oluşturma
    - Müzik üretimi sağlayıcılarını ve modellerini yapılandırma
    - music_generate aracı parametrelerini anlama
sidebarTitle: Music generation
summary: ComfyUI, fal, Google Lyria, MiniMax ve OpenRouter iş akışlarında music_generate aracılığıyla müzik oluşturun
title: Müzik oluşturma
x-i18n:
    generated_at: "2026-06-28T01:23:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4fe6ad09b6e2cfae03bc5d5ef4368e80845a9e4a8c25c6303e181a6436a17c7e
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` aracı, ajanın yapılandırılmış sağlayıcılarla paylaşılan
müzik üretme yeteneği üzerinden müzik veya ses oluşturmasını sağlar — bugün
ComfyUI, fal, Google, MiniMax ve OpenRouter.

Oturum destekli ajan çalıştırmaları için OpenClaw müzik üretimini bir
arka plan görevi olarak başlatır, görev kayıt defterinde izler, ardından parça
hazır olduğunda ajanı yeniden uyandırır; böylece ajan kullanıcıya haber verip
tamamlanan sesi ekleyebilir. Tamamlama ajanı, oturumun normal görünür yanıt
modunu izler: yapılandırıldığında otomatik son yanıt teslimi veya oturum mesaj
aracını gerektiriyorsa `message(action="send")`. İstek sahibi oturum etkin
değilse veya etkin uyandırması başarısız olursa ve oluşturulan sesin bir kısmı
tamamlama yanıtında hâlâ eksikse, OpenClaw yalnızca eksik sesi içeren idempotent
bir doğrudan geri dönüş gönderir.

<Note>
Yerleşik paylaşılan araç yalnızca en az bir müzik üretme sağlayıcısı
kullanılabilir olduğunda görünür. Ajanınızın araçlarında `music_generate`
görmüyorsanız `agents.defaults.musicGenerationModel` yapılandırın veya bir
sağlayıcı API anahtarı ayarlayın.
</Note>

## Hızlı başlangıç

<Tabs>
  <Tab title="Shared provider-backed">
    <Steps>
      <Step title="Configure auth">
        En az bir sağlayıcı için bir API anahtarı ayarlayın — örneğin
        `GEMINI_API_KEY` veya `MINIMAX_API_KEY`.
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

        Ajan `music_generate` aracını otomatik olarak çağırır. Araç için
        izin listesi gerekmez.
      </Step>
    </Steps>

    Oturum destekli ajan çalıştırması olmayan doğrudan eşzamanlı bağlamlarda
    yerleşik araç yine de satır içi üretime geri döner ve araç sonucunda
    son medya yolunu döndürür.

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        `plugins.entries.comfy.config.music` değerini bir iş akışı JSON'u ve
        prompt/çıktı düğümleriyle yapılandırın.
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

Örnek promptlar:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## Desteklenen sağlayıcılar

| Sağlayıcı  | Varsayılan model             | Referans girdileri | Desteklenen denetimler                              | Kimlik doğrulama                       |
| ---------- | ---------------------------- | ------------------ | --------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | En fazla 1 görüntü | İş akışı tanımlı müzik veya ses                     | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | Yok                | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` veya `FAL_API_KEY`           |
| Google     | `lyria-3-clip-preview`       | En fazla 10 görüntü | `lyrics`, `instrumental`, `format`                  | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | Yok                | `lyrics`, `instrumental`, `format=mp3`              | `MINIMAX_API_KEY` veya MiniMax OAuth   |
| OpenRouter | `google/lyria-3-pro-preview` | En fazla 1 görüntü | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

### Yetenek matrisi

`music_generate`, sözleşme testleri ve paylaşılan canlı tarama tarafından
kullanılan açık mod sözleşmesi:

| Sağlayıcı  | `generate` | `edit` | Düzenleme sınırı | Paylaşılan canlı hatlar                                                   |
| ---------- | :--------: | :----: | ---------------- | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 görüntü        | Paylaşılan taramada değil; `extensions/comfy/comfy.live.test.ts` kapsar    |
| fal        |     ✓      |   —    | Yok              | `generate`                                                                |
| Google     |     ✓      |   ✓    | 10 görüntü       | `generate`, `edit`                                                        |
| MiniMax    |     ✓      |   —    | Yok              | `generate`                                                                |
| OpenRouter |     ✓      |   ✓    | 1 görüntü        | `generate`, `edit`                                                        |

Çalışma zamanında kullanılabilir paylaşılan sağlayıcıları ve modelleri
incelemek için `action: "list"` kullanın:

```text
/tool music_generate action=list
```

Etkin oturum destekli müzik görevini incelemek için `action: "status"`
kullanın:

```text
/tool music_generate action=status
```

Doğrudan üretim örneği:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Araç parametreleri

<ParamField path="prompt" type="string" required>
  Müzik üretme promptu. `action: "generate"` için gereklidir.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` geçerli oturum görevini döndürür; `"list"` sağlayıcıları inceler.
</ParamField>
<ParamField path="model" type="string">
  Sağlayıcı/model geçersiz kılması (örn. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Sağlayıcı açık şarkı sözü girdisini desteklediğinde isteğe bağlı şarkı sözleri.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Sağlayıcı desteklediğinde yalnızca enstrümantal çıktı isteyin.
</ParamField>
<ParamField path="image" type="string">
  Tek referans görüntü yolu veya URL.
</ParamField>
<ParamField path="images" type="string[]">
  Birden çok referans görüntüsü (destekleyen sağlayıcılarda en fazla 10).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Sağlayıcı süre ipuçlarını desteklediğinde saniye cinsinden hedef süre.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Sağlayıcı desteklediğinde çıktı biçimi ipucu.
</ParamField>
<ParamField path="filename" type="string">Çıktı dosya adı ipucu.</ParamField>

<Note>
Tüm sağlayıcılar tüm parametreleri desteklemez. OpenClaw yine de gönderimden
önce girdi sayısı gibi katı sınırları doğrular. Bir sağlayıcı süreyi destekliyor
ancak istenen değerden daha kısa bir maksimum kullanıyorsa OpenClaw en yakın
desteklenen süreye sınırlar. Seçilen sağlayıcı veya model gerçekten
desteklenmeyen isteğe bağlı ipuçlarını yerine getiremiyorsa bunlar bir uyarıyla
yok sayılır. Araç sonuçları uygulanan ayarları bildirir; `details.normalization`
istenenden uygulanana yapılan tüm eşlemeleri yakalar.
</Note>

Sağlayıcı istek zaman aşımları yalnızca operatör yapılandırmasıdır. OpenClaw
yapılandırıldığında `agents.defaults.musicGenerationModel.timeoutMs` kullanır,
120000ms altındaki değerleri 120000ms değerine yükseltir ve aksi halde sağlayıcı
istekleri için varsayılan olarak 300000ms kullanır.

## Eşzamansız davranış

Oturum destekli müzik üretimi arka plan görevi olarak çalışır:

- **Arka plan görevi:** `music_generate` bir arka plan görevi oluşturur, hemen
  başlatıldı/görev yanıtı döndürür ve tamamlanan parçayı daha sonra takip eden
  bir ajan mesajında gönderir.
- **Yinelenmeyi önleme:** bir görev `queued` veya `running` durumundayken aynı
  oturumdaki sonraki `music_generate` çağrıları yeni bir üretim başlatmak yerine
  görev durumunu döndürür. Açıkça kontrol etmek için `action: "status"` kullanın.
- **Durum arama:** `openclaw tasks list` veya `openclaw tasks show <taskId>`
  kuyruğa alınmış, çalışan ve terminal durumları inceler.
- **Tamamlama uyandırması:** OpenClaw, modelin kullanıcıya yönelik takip
  mesajını kendisi yazabilmesi için aynı oturuma dahili bir tamamlama olayı
  enjekte eder.
- **Prompt ipucu:** aynı oturumdaki sonraki kullanıcı/manuel turlar, bir müzik
  görevi zaten devam ediyorsa küçük bir çalışma zamanı ipucu alır; böylece model
  körlemesine tekrar `music_generate` çağırmaz.
- **Oturumsuz geri dönüş:** gerçek bir ajan oturumu olmayan doğrudan/yerel
  bağlamlar satır içi çalışır ve son ses sonucunu aynı turda döndürür.

### Görev yaşam döngüsü

| Durum       | Anlamı                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Görev oluşturuldu, sağlayıcının kabul etmesini bekliyor.                                       |
| `running`   | Sağlayıcı işliyor (sağlayıcıya ve süreye bağlı olarak genellikle 30 saniye ila 3 dakika).       |
| `succeeded` | Parça hazır; ajan uyanır ve bunu konuşmaya gönderir.                                           |
| `failed`    | Sağlayıcı hatası veya zaman aşımı; ajan hata ayrıntılarıyla uyanır.                            |

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
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
      },
    },
  },
}
```

### Sağlayıcı seçimi sırası

OpenClaw sağlayıcıları şu sırayla dener:

1. Araç çağrısından gelen `model` parametresi (ajan bir tane belirtiyorsa).
2. Yapılandırmadan `musicGenerationModel.primary`.
3. Sırayla `musicGenerationModel.fallbacks`.
4. Yalnızca kimlik doğrulama destekli sağlayıcı varsayılanlarını kullanarak
   otomatik algılama:
   - önce geçerli varsayılan sağlayıcı;
   - ardından sağlayıcı kimliği sırasına göre kalan kayıtlı müzik üretme sağlayıcıları.

Bir sağlayıcı başarısız olursa sıradaki aday otomatik olarak denenir. Tümü
başarısız olursa hata her denemeden ayrıntılar içerir.

Yalnızca açık `model`, `primary` ve `fallbacks` girdilerini kullanmak için
`agents.defaults.mediaGenerationAutoProviderFallback: false` ayarlayın.

## Sağlayıcı notları

<AccordionGroup>
  <Accordion title="ComfyUI">
    İş akışı güdümlüdür ve prompt/çıktı alanları için yapılandırılmış grafiğe
    ve düğüm eşlemesine bağlıdır. Paketlenen `comfy` Plugin'i, müzik üretme
    sağlayıcı kayıt defteri üzerinden paylaşılan `music_generate` aracına bağlanır.
  </Accordion>
  <Accordion title="fal">
    Paylaşılan sağlayıcı kimlik doğrulama yolu üzerinden fal model uç
    noktalarını kullanır. Paketlenen sağlayıcı varsayılan olarak
    `fal-ai/minimax-music/v2.6` kullanır ve prompttan sese istekleri için ayrıca
    `fal-ai/ace-step/prompt-to-audio` ve
    `fal-ai/stable-audio-25/text-to-audio` sunar.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Lyria 3 toplu üretimini kullanır. Geçerli paketlenmiş akış promptu, isteğe
    bağlı şarkı sözü metnini ve isteğe bağlı referans görüntülerini destekler.
  </Accordion>
  <Accordion title="MiniMax">
    Toplu `music_generation` uç noktasını kullanır. Promptu, isteğe bağlı şarkı
    sözlerini, enstrümantal modu ve `minimax` API anahtarı kimlik doğrulaması
    veya `minimax-portal` OAuth üzerinden mp3 çıktısını destekler.
  </Accordion>
  <Accordion title="OpenRouter">
    Akış etkinleştirilmiş OpenRouter sohbet tamamlama ses çıktısını kullanır.
    Paketlenen sağlayıcı varsayılan olarak `google/lyria-3-pro-preview` kullanır
    ve ayrıca `openrouter/google/lyria-3-clip-preview` sunar.
  </Accordion>
</AccordionGroup>

## Doğru yolu seçme

- **Paylaşılan sağlayıcı destekli**: model seçimi, sağlayıcı yük devretmesi ve
  yerleşik eşzamansız görev/durum akışını istediğinizde.
- **Plugin yolu (ComfyUI)**: özel bir iş akışı grafiğine veya paylaşılan
  paketlenmiş müzik yeteneğinin parçası olmayan bir sağlayıcıya ihtiyacınız
  olduğunda.

ComfyUI'ye özgü davranışı hata ayıklıyorsanız bkz.
[ComfyUI](/tr/providers/comfy). Paylaşılan sağlayıcı davranışını hata ayıklıyorsanız
[fal](/tr/providers/fal), [Google (Gemini)](/tr/providers/google),
[MiniMax](/tr/providers/minimax) veya [OpenRouter](/tr/providers/openrouter) ile başlayın.

## Sağlayıcı yetenek modları

Paylaşılan müzik üretimi sözleşmesi açık mod bildirimlerini destekler:

- Yalnızca istemle üretim için `generate`.
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

`maxInputImages`, `supportsLyrics` ve `supportsFormat` gibi eski düz alanlar,
düzenleme desteğini duyurmak için **yeterli değildir**. Sağlayıcılar
`generate` ve `edit` değerlerini açıkça bildirmelidir; böylece canlı testler,
sözleşme testleri ve paylaşılan `music_generate` aracı mod desteğini
deterministik olarak doğrulayabilir.

## Canlı testler

Paylaşılan paketli sağlayıcılar için isteğe bağlı canlı kapsam:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Depo sarmalayıcısı:

```bash
pnpm test:live:media music
```

Bu canlı dosya varsayılan olarak saklanan kimlik doğrulama profillerinden önce
zaten dışa aktarılmış sağlayıcı ortam değişkenlerini kullanır ve sağlayıcı
düzenleme modunu etkinleştirdiğinde hem `generate` hem de bildirilen `edit`
kapsamını çalıştırır. Bugünkü kapsam:

- `google`: `generate` ve `edit`
- `fal`: yalnızca `generate`
- `minimax`: yalnızca `generate`
- `openrouter`: `generate` ve `edit`
- `comfy`: paylaşılan sağlayıcı taraması değil, ayrı Comfy canlı kapsamı

Paketli ComfyUI müzik yolu için isteğe bağlı canlı kapsam:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy canlı dosyası, bu bölümler yapılandırıldığında comfy görsel ve video iş
akışlarını da kapsar.

## İlgili

- [Arka plan görevleri](/tr/automation/tasks) — ayrılmış `music_generate` çalıştırmaları için görev takibi
- [ComfyUI](/tr/providers/comfy)
- [Yapılandırma başvurusu](/tr/gateway/config-agents#agent-defaults) — `musicGenerationModel` yapılandırması
- [Google (Gemini)](/tr/providers/google)
- [MiniMax](/tr/providers/minimax)
- [Modeller](/tr/concepts/models) — model yapılandırması ve yük devretme
- [Araçlara genel bakış](/tr/tools)
