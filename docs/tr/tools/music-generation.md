---
read_when:
    - Agent üzerinden müzik veya ses oluşturma
    - Müzik oluşturma sağlayıcılarını ve modellerini yapılandırma
    - '`music_generate` tool parametrelerini anlama'
sidebarTitle: Music generation
summary: Google Lyria, MiniMax ve ComfyUI iş akışlarında `music_generate` üzerinden müzik oluşturun
title: Müzik oluşturma
x-i18n:
    generated_at: "2026-04-26T11:43:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4eda549dbb93cbfe15e04462e08b7c86ff0718160244e3e5de3b041c62ee81ea
    source_path: tools/music-generation.md
    workflow: 15
---

`music_generate` tool'u, agent'ın
bugün Google, MiniMax ve iş akışıyla yapılandırılmış ComfyUI olmak üzere, yapılandırılmış sağlayıcılarla paylaşılan müzik oluşturma yeteneği üzerinden müzik veya ses oluşturmasına izin verir.

Oturum destekli agent çalıştırmaları için OpenClaw, müzik üretimini
bir arka plan görevi olarak başlatır, bunu görev ledger'ında izler, ardından parça hazır olduğunda
agent'ı yeniden uyandırır; böylece agent bitmiş sesi
özgün kanala geri gönderebilir.

<Note>
Yerleşik paylaşılan tool yalnızca en az bir müzik oluşturma
sağlayıcısı kullanılabilir olduğunda görünür. Agent'ınızın
tools listesinde `music_generate` görmüyorsanız `agents.defaults.musicGenerationModel` yapılandırın veya bir
sağlayıcı API anahtarı ayarlayın.
</Note>

## Hızlı başlangıç

<Tabs>
  <Tab title="Paylaşılan sağlayıcı destekli">
    <Steps>
      <Step title="Auth yapılandırın">
        En az bir sağlayıcı için bir API anahtarı ayarlayın — örneğin
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
      <Step title="Agent'a sorun">
        _"Bir neon şehirde gece sürüşü hakkında tempolu bir synthpop parça oluştur."_

        Agent, `music_generate` tool'unu otomatik çağırır. Tool
        allow-listing gerekmez.
      </Step>
    </Steps>

    Oturum destekli agent çalıştırması olmayan doğrudan eşzamanlı bağlamlar için,
    yerleşik tool yine satır içi üretime fallback yapar ve
    son medya yolunu tool sonucunda döndürür.

  </Tab>
  <Tab title="ComfyUI iş akışı">
    <Steps>
      <Step title="İş akışını yapılandırın">
        Bir iş akışı
        JSON'u ve prompt/çıktı node'ları ile `plugins.entries.comfy.config.music` yapılandırın.
      </Step>
      <Step title="Bulut auth (isteğe bağlı)">
        Comfy Cloud için `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` ayarlayın.
      </Step>
      <Step title="Tool'u çağırın">
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

| Sağlayıcı | Varsayılan model       | Başvuru girdileri | Desteklenen denetimler                                  | Auth                                   |
| --------- | ---------------------- | ----------------- | ------------------------------------------------------- | -------------------------------------- |
| ComfyUI   | `workflow`             | En fazla 1 görsel | İş akışı tanımlı müzik veya ses                         | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google    | `lyria-3-clip-preview` | En fazla 10 görsel | `lyrics`, `instrumental`, `format`                     | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax   | `music-2.6`            | Yok               | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` veya MiniMax OAuth   |

### Yetenek matrisi

`music_generate`, sözleşme testleri ve
paylaşılan canlı tarama tarafından kullanılan açık mod sözleşmesi:

| Sağlayıcı | `generate` | `edit` | Düzenleme sınırı | Paylaşılan canlı şeritler                                              |
| --------- | :--------: | :----: | ---------------- | ---------------------------------------------------------------------- |
| ComfyUI   |     ✓      |   ✓    | 1 görsel         | Paylaşılan taramada yok; `extensions/comfy/comfy.live.test.ts` ile kapsanır |
| Google    |     ✓      |   ✓    | 10 görsel        | `generate`, `edit`                                                     |
| MiniMax   |     ✓      |   —    | Yok              | `generate`                                                             |

Çalışma zamanında kullanılabilir paylaşılan sağlayıcıları ve modelleri
incelemek için `action: "list"` kullanın:

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

## Tool parametreleri

<ParamField path="prompt" type="string" required>
  Müzik oluşturma istemi. `action: "generate"` için zorunludur.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` geçerli oturum görevini döndürür; `"list"` sağlayıcıları inceler.
</ParamField>
<ParamField path="model" type="string">
  Sağlayıcı/model geçersiz kılması (örn. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Sağlayıcı açık söz girdisini destekliyorsa isteğe bağlı sözler.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Sağlayıcı destekliyorsa yalnızca enstrümantal çıktı isteyin.
</ParamField>
<ParamField path="image" type="string">
  Tek bir başvuru görsel yolu veya URL'si.
</ParamField>
<ParamField path="images" type="string[]">
  Birden çok başvuru görseli (destekleyen sağlayıcılarda en fazla 10).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Sağlayıcı süre ipuçlarını destekliyorsa saniye cinsinden hedef süre.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Sağlayıcı destekliyorsa çıktı biçimi ipucu.
</ParamField>
<ParamField path="filename" type="string">Çıktı dosya adı ipucu.</ParamField>
<ParamField path="timeoutMs" type="number">Milisaniye cinsinden isteğe bağlı sağlayıcı istek zaman aşımı.</ParamField>

<Note>
Tüm sağlayıcılar tüm parametreleri desteklemez. OpenClaw yine de gönderim öncesinde
girdi sayısı gibi katı sınırları doğrular. Bir sağlayıcı süreyi destekliyor ama istenen değerden daha kısa bir azami değer kullanıyorsa OpenClaw
en yakın desteklenen süreye sınırlar. Gerçekten desteklenmeyen isteğe bağlı ipuçları,
seçilen sağlayıcı veya model bunları yerine getiremiyorsa bir uyarıyla yok sayılır.
Tool sonuçları uygulanan ayarları bildirir; `details.normalization`
istenenden uygulanana yapılan tüm eşlemeleri yakalar.
</Note>

## Eşzamansız davranış

Oturum destekli müzik oluşturma bir arka plan görevi olarak çalışır:

- **Arka plan görevi:** `music_generate` bir arka plan görevi oluşturur, hemen bir
  başlatıldı/görev yanıtı döndürür ve bitmiş parçayı daha sonra
  takip eden bir agent mesajında gönderir.
- **Yinelenmeyi önleme:** bir görev `queued` veya `running` durumundayken aynı oturumda sonraki
  `music_generate` çağrıları başka bir üretim başlatmak yerine görev durumunu döndürür. Açıkça denetlemek için `action: "status"` kullanın.
- **Durum araması:** `openclaw tasks list` veya `openclaw tasks show <taskId>`
  kuyrukta, çalışıyor ve sonlanmış durumları inceler.
- **Tamamlama uyandırması:** OpenClaw dahili bir tamamlama olayını
  aynı oturuma geri enjekte eder; böylece model kullanıcıya dönük takip mesajını
  kendisi yazabilir.
- **İstem ipucu:** aynı oturumdaki sonraki kullanıcı/manuel turlar, zaten
  çalışan bir müzik görevi olduğunda küçük bir çalışma zamanı ipucu alır; böylece model
  körü körüne tekrar `music_generate` çağırmaz.
- **Oturumsuz fallback:** gerçek bir agent
  oturumu olmayan doğrudan/yerel bağlamlar satır içi çalışır ve son ses sonucunu aynı turda döndürür.

### Görev yaşam döngüsü

| Durum       | Anlamı                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------ |
| `queued`    | Görev oluşturuldu, sağlayıcının kabul etmesi bekleniyor.                                   |
| `running`   | Sağlayıcı işliyor (genellikle sağlayıcıya ve süreye bağlı olarak 30 saniye ila 3 dakika). |
| `succeeded` | Parça hazır; agent uyanır ve bunu konuşmaya gönderir.                                      |
| `failed`    | Sağlayıcı hatası veya zaman aşımı; agent hata ayrıntılarıyla uyanır.                       |

Durumu CLI'den denetleyin:

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

1. Tool çağrısından gelen `model` parametresi (agent bir tane belirtirse).
2. Config içindeki `musicGenerationModel.primary`.
3. Sırasıyla `musicGenerationModel.fallbacks`.
4. Yalnızca auth destekli sağlayıcı varsayılanları kullanılarak otomatik algılama:
   - önce geçerli varsayılan sağlayıcı;
   - sonra sağlayıcı kimliği sırasına göre kayıtlı kalan müzik oluşturma sağlayıcıları.

Bir sağlayıcı başarısız olursa, bir sonraki aday otomatik olarak denenir. Tümü
başarısız olursa hata her denemeden ayrıntılar içerir.

Yalnızca açık `model`, `primary` ve `fallbacks` girdilerini kullanmak için
`agents.defaults.mediaGenerationAutoProviderFallback: false` ayarlayın.

## Sağlayıcı notları

<AccordionGroup>
  <Accordion title="ComfyUI">
    İş akışı odaklıdır ve yapılandırılmış grafik ile
    prompt/çıktı alanları için node eşlemesine bağlıdır. Paketlenmiş `comfy` Plugin'i,
    müzik oluşturma sağlayıcı
    kayıt defteri üzerinden paylaşılan `music_generate` tool'una takılır.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Lyria 3 toplu üretimini kullanır. Mevcut paketlenmiş akış;
    istemi, isteğe bağlı söz metnini ve isteğe bağlı başvuru görsellerini destekler.
  </Accordion>
  <Accordion title="MiniMax">
    Toplu `music_generation` uç noktasını kullanır. İstem, isteğe bağlı
    sözler, enstrümantal mod, süre yönlendirmesi ve
    `minimax` API anahtarı auth'u veya `minimax-portal` OAuth üzerinden mp3 çıktısını destekler.
  </Accordion>
</AccordionGroup>

## Doğru yolu seçme

- Model seçimi, sağlayıcı
  failover'ı ve yerleşik eşzamansız görev/durum akışını istediğinizde **paylaşılan sağlayıcı destekli**.
- Özel bir iş akışı grafiğine veya
  paylaşılan paketlenmiş müzik yeteneğinin parçası olmayan bir sağlayıcıya ihtiyaç duyduğunuzda **Plugin yolu (ComfyUI)**.

ComfyUI'ye özgü davranışta hata ayıklıyorsanız
[ComfyUI](/tr/providers/comfy) sayfasına bakın. Paylaşılan sağlayıcı
davranışında hata ayıklıyorsanız [Google (Gemini)](/tr/providers/google) veya
[MiniMax](/tr/providers/minimax) ile başlayın.

## Sağlayıcı yetenek modları

Paylaşılan müzik oluşturma sözleşmesi açık mod bildirimlerini destekler:

- Yalnızca istemle üretim için `generate`.
- İstek bir veya daha fazla başvuru görseli içerdiğinde `edit`.

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

`maxInputImages`, `supportsLyrics` ve
`supportsFormat` gibi eski düz alanlar, düzenleme desteğini bildirmek için **yeterli değildir**. Sağlayıcılar
`generate` ve `edit` modlarını açıkça bildirmelidir; böylece canlı testler, sözleşme
testleri ve paylaşılan `music_generate` tool'u mod desteğini deterministik olarak doğrulayabilir.

## Canlı testler

Paylaşılan paketlenmiş sağlayıcılar için katılımlı canlı kapsam:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Depo sarmalayıcısı:

```bash
pnpm test:live:media music
```

Bu canlı dosya, eksik sağlayıcı env değişkenlerini `~/.profile` içinden yükler, varsayılan olarak
saklanan auth profilleri yerine canlı/env API anahtarlarını tercih eder ve sağlayıcı düzenleme modunu etkinleştirirse hem `generate` hem de bildirilmiş `edit` kapsamını çalıştırır. Bugünkü kapsam:

- `google`: `generate` artı `edit`
- `minimax`: yalnızca `generate`
- `comfy`: ayrı Comfy canlı kapsamı, paylaşılan sağlayıcı taraması değil

Paketlenmiş ComfyUI müzik yolu için katılımlı canlı kapsam:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy canlı dosyası ayrıca bu bölümler yapılandırıldığında comfy görsel ve video iş akışlarını da kapsar.

## İlgili

- [Background tasks](/tr/automation/tasks) — ayrık `music_generate` çalıştırmaları için görev takibi
- [ComfyUI](/tr/providers/comfy)
- [Configuration reference](/tr/gateway/config-agents#agent-defaults) — `musicGenerationModel` config'i
- [Google (Gemini)](/tr/providers/google)
- [MiniMax](/tr/providers/minimax)
- [Models](/tr/concepts/models) — model yapılandırması ve failover
- [Tools overview](/tr/tools)
