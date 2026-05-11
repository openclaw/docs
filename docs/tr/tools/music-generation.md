---
read_when:
    - Ajan aracılığıyla müzik veya ses oluşturma
    - Müzik üretimi sağlayıcılarını ve modellerini yapılandırma
    - music_generate aracının parametrelerini anlama
sidebarTitle: Music generation
summary: Google Lyria, MiniMax ve ComfyUI iş akışlarında music_generate ile müzik oluşturun
title: Müzik üretimi
x-i18n:
    generated_at: "2026-05-11T20:38:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: b355dd6f1f41074624b692edb8a597a65ad99fc3ad61d2ed5e32f1b6cf393244
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` aracı, ajanın yapılandırılmış sağlayıcılarla paylaşılan
müzik üretimi yeteneği üzerinden müzik veya ses oluşturmasını sağlar — bugün
Google, MiniMax ve iş akışıyla yapılandırılmış ComfyUI.

Oturum destekli ajan çalıştırmaları için OpenClaw müzik üretimini bir arka plan
görevi olarak başlatır, bunu görev defterinde izler, ardından parça hazır
olduğunda ajanı yeniden uyandırır; böylece ajan kullanıcıya haber verebilir ve
tamamlanan sesi ekleyebilir. Yalnızca mesaj aracıyla görünür teslim kullanan
grup/kanal sohbetlerinde ajan sonucu mesaj aracı üzerinden iletir. Tamamlama
ajanı yalnızca özel bir final yanıtı yazarsa OpenClaw, oluşturulan medyayla
doğrudan kanal gönderimine geri döner. Tamamlama uyandırması, ajana normal final
yanıtlarının bu rotalarda özel olduğunu açıkça bildirir.

<Note>
Yerleşik paylaşılan araç yalnızca en az bir müzik üretimi sağlayıcısı
kullanılabilir olduğunda görünür. Ajanınızın araçlarında `music_generate`
görmüyorsanız `agents.defaults.musicGenerationModel` yapılandırın veya bir
sağlayıcı API anahtarı ayarlayın.
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
      <Step title="Ajana sorun">
        _"Neon bir şehirde gece sürüşü hakkında enerjik bir synthpop parçası oluştur."_

        Ajan `music_generate` aracını otomatik olarak çağırır. Araç izin
        listesine ekleme gerekmez.
      </Step>
    </Steps>

    Oturum destekli ajan çalıştırması olmayan doğrudan senkron bağlamlarda,
    yerleşik araç yine satır içi üretime geri döner ve araç sonucunda
    final medya yolunu döndürür.

  </Tab>
  <Tab title="ComfyUI iş akışı">
    <Steps>
      <Step title="İş akışını yapılandırın">
        `plugins.entries.comfy.config.music` öğesini bir iş akışı
        JSON’u ve istem/çıktı düğümleriyle yapılandırın.
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

| Sağlayıcı | Varsayılan model       | Referans girdileri | Desteklenen kontroller                                  | Kimlik doğrulama                       |
| -------- | ---------------------- | ------------------ | ------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | En fazla 1 görsel  | İş akışıyla tanımlanan müzik veya ses                   | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | En fazla 10 görsel | `lyrics`, `instrumental`, `format`                      | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Yok                | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` veya MiniMax OAuth   |

### Yetenek matrisi

`music_generate`, sözleşme testleri ve paylaşılan canlı tarama tarafından
kullanılan açık mod sözleşmesi:

| Sağlayıcı | `generate` | `edit` | Düzenleme sınırı | Paylaşılan canlı hatlar                                                    |
| -------- | :--------: | :----: | ---------------- | -------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 görsel         | Paylaşılan taramada yok; `extensions/comfy/comfy.live.test.ts` kapsamındadır |
| Google   |     ✓      |   ✓    | 10 görsel        | `generate`, `edit`                                                         |
| MiniMax  |     ✓      |   —    | Yok              | `generate`                                                                 |

Çalışma zamanında kullanılabilir paylaşılan sağlayıcıları ve modelleri incelemek
için `action: "list"` kullanın:

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
  Sağlayıcı/model geçersiz kılma (ör. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Sağlayıcı açık söz girdisini desteklediğinde isteğe bağlı şarkı sözleri.
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
<ParamField path="timeoutMs" type="number">Milisaniye cinsinden isteğe bağlı sağlayıcı istek zaman aşımı. Atlandığında OpenClaw, yapılandırılmışsa `agents.defaults.musicGenerationModel.timeoutMs` değerini kullanır. 10000ms altındaki değerler 10000ms değerine yükseltilir ve araç sonucunda raporlanır.</ParamField>

<Note>
Tüm sağlayıcılar tüm parametreleri desteklemez. OpenClaw yine de gönderimden
önce girdi sayıları gibi katı sınırları doğrular. Bir sağlayıcı süreyi
destekleyip istenen değerden daha kısa bir maksimum kullanıyorsa OpenClaw
en yakın desteklenen süreye sınırlar. Gerçekten desteklenmeyen isteğe bağlı
ipuçları, seçilen sağlayıcı veya model bunları karşılayamadığında bir uyarıyla
yok sayılır. Araç sonuçları uygulanan ayarları raporlar; `details.normalization`
istenenden uygulanana yapılan eşlemeleri yakalar.
</Note>

## Zaman uyumsuz davranış

Oturum destekli müzik üretimi bir arka plan görevi olarak çalışır:

- **Arka plan görevi:** `music_generate` bir arka plan görevi oluşturur,
  başlatıldı/görev yanıtını hemen döndürür ve tamamlanan parçayı daha sonra
  takip eden bir ajan mesajında gönderir.
- **Yinelenmeyi önleme:** bir görev `queued` veya `running` durumundayken aynı
  oturumdaki sonraki `music_generate` çağrıları başka bir üretim başlatmak
  yerine görev durumunu döndürür. Açıkça kontrol etmek için `action: "status"`
  kullanın.
- **Durum araması:** `openclaw tasks list` veya `openclaw tasks show <taskId>`
  kuyruğa alınmış, çalışan ve terminal durumları inceler.
- **Tamamlama uyandırması:** OpenClaw, modelin kullanıcıya yönelik takip
  yanıtını kendisinin yazabilmesi için aynı oturuma dahili bir tamamlama olayı
  enjekte eder.
- **İstem ipucu:** aynı oturumdaki sonraki kullanıcı/manuel dönüşler, bir müzik
  görevi zaten sürüyorsa küçük bir çalışma zamanı ipucu alır; böylece model
  körlemesine yeniden `music_generate` çağırmaz.
- **Oturumsuz geri dönüş:** gerçek ajan oturumu olmayan doğrudan/yerel bağlamlar
  satır içi çalışır ve final ses sonucunu aynı dönüşte döndürür.

### Görev yaşam döngüsü

| Durum       | Anlamı                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Görev oluşturuldu, sağlayıcının kabul etmesi bekleniyor.                                       |
| `running`   | Sağlayıcı işliyor (sağlayıcıya ve süreye bağlı olarak genellikle 30 saniye ila 3 dakika).      |
| `succeeded` | Parça hazır; ajan uyanır ve bunu konuşmaya gönderir.                                           |
| `failed`    | Sağlayıcı hatası veya zaman aşımı; ajan hata ayrıntılarıyla uyanır.                            |

Durumu CLI’dan kontrol edin:

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

1. Araç çağrısından gelen `model` parametresi (ajan bir tane belirtirse).
2. Yapılandırmadan `musicGenerationModel.primary`.
3. Sırayla `musicGenerationModel.fallbacks`.
4. Yalnızca kimlik doğrulama destekli sağlayıcı varsayılanlarını kullanarak otomatik algılama:
   - önce geçerli varsayılan sağlayıcı;
   - kalan kayıtlı müzik üretimi sağlayıcıları, sağlayıcı kimliği sırasına göre.

Bir sağlayıcı başarısız olursa sonraki aday otomatik olarak denenir. Tümü
başarısız olursa hata, her denemeden ayrıntılar içerir.

Yalnızca açık `model`, `primary` ve `fallbacks` girdilerini kullanmak için
`agents.defaults.mediaGenerationAutoProviderFallback: false` ayarlayın.

## Sağlayıcı notları

<AccordionGroup>
  <Accordion title="ComfyUI">
    İş akışı güdümlüdür ve istem/çıktı alanları için yapılandırılmış grafa
    ve düğüm eşlemesine bağlıdır. Paketle birlikte gelen `comfy` Plugin’i,
    müzik üretimi sağlayıcı kayıt defteri üzerinden paylaşılan `music_generate`
    aracına bağlanır.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Lyria 3 toplu üretimini kullanır. Geçerli paketlenmiş akış istemi,
    isteğe bağlı şarkı sözü metnini ve isteğe bağlı referans görselleri
    destekler.
  </Accordion>
  <Accordion title="MiniMax">
    Toplu `music_generation` uç noktasını kullanır. İstem, isteğe bağlı şarkı
    sözleri, enstrümantal mod, süre yönlendirmesi ve `minimax` API anahtarı
    kimlik doğrulaması ya da `minimax-portal` OAuth üzerinden mp3 çıktısını
    destekler.
  </Accordion>
</AccordionGroup>

## Doğru yolu seçme

- **Paylaşılan sağlayıcı destekli**, model seçimi, sağlayıcı devretmesi ve
  yerleşik zaman uyumsuz görev/durum akışı istediğinizde.
- **Plugin yolu (ComfyUI)**, özel bir iş akışı grafiğine veya paylaşılan
  paketlenmiş müzik yeteneğinin parçası olmayan bir sağlayıcıya ihtiyaç
  duyduğunuzda.

ComfyUI’ye özgü davranışta hata ayıklıyorsanız
[ComfyUI](/tr/providers/comfy) bölümüne bakın. Paylaşılan sağlayıcı davranışında
hata ayıklıyorsanız [Google (Gemini)](/tr/providers/google) veya
[MiniMax](/tr/providers/minimax) ile başlayın.

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

`maxInputImages`, `supportsLyrics` ve `supportsFormat` gibi eski düz alanlar
düzenleme desteğini duyurmak için **yeterli değildir**. Sağlayıcılar `generate`
ve `edit` öğelerini açıkça bildirmelidir; böylece canlı testler, sözleşme
testleri ve paylaşılan `music_generate` aracı mod desteğini deterministik
biçimde doğrulayabilir.

## Canlı testler

Paylaşılan paketlenmiş sağlayıcılar için isteğe bağlı canlı kapsam:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Repo sarmalayıcısı:

```bash
pnpm test:live:media music
```

Bu canlı dosya eksik sağlayıcı ortam değişkenlerini `~/.profile` içinden yükler, varsayılan olarak
kayıtlı kimlik doğrulama profillerinden önce canlı/ortam API anahtarlarını tercih eder ve sağlayıcı düzenleme
modunu etkinleştirdiğinde hem `generate` hem de bildirilen `edit` kapsamını çalıştırır. Mevcut kapsam:

- `google`: `generate` ve `edit`
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
- [Yapılandırma başvurusu](/tr/gateway/config-agents#agent-defaults) — `musicGenerationModel` yapılandırması
- [Google (Gemini)](/tr/providers/google)
- [MiniMax](/tr/providers/minimax)
- [Modeller](/tr/concepts/models) — model yapılandırması ve yük devretme
- [Araçlara genel bakış](/tr/tools)
