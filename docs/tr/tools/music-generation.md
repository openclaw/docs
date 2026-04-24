---
read_when:
    - Agent üzerinden müzik veya ses üretme
    - Müzik üretimi sağlayıcılarını ve modellerini yapılandırma
    - '`music_generate` aracı parametrelerini anlama'
summary: İş akışı destekli plugin'ler dahil paylaşılan sağlayıcılarla müzik üretin
title: Müzik üretimi
x-i18n:
    generated_at: "2026-04-24T09:36:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5fe640c6b83f6f2cf5ad8e57294da147f241706c30eee0d0eb6f7d82cbbe0d3
    source_path: tools/music-generation.md
    workflow: 15
---

`music_generate` aracı, agent'in
Google, MiniMax ve iş akışıyla yapılandırılmış ComfyUI gibi sağlayıcılarla yapılandırılmış paylaşılan müzik üretimi yeteneği üzerinden müzik veya ses oluşturmasına izin verir.

Paylaşılan sağlayıcı destekli agent oturumları için OpenClaw, müzik üretimini bir
arka plan görevi olarak başlatır, bunu görev defterinde izler, ardından parça hazır olduğunda
agent'i yeniden uyandırır; böylece agent bitmiş sesi özgün kanala geri gönderebilir.

<Note>
Yerleşik paylaşılan araç yalnızca en az bir müzik üretimi sağlayıcısı mevcut olduğunda görünür. Agent araçlarınızda `music_generate` görmüyorsanız `agents.defaults.musicGenerationModel` yapılandırın veya bir sağlayıcı API anahtarı ayarlayın.
</Note>

## Hızlı başlangıç

### Paylaşılan sağlayıcı destekli üretim

1. En az bir sağlayıcı için bir API anahtarı ayarlayın; örneğin `GEMINI_API_KEY` veya
   `MINIMAX_API_KEY`.
2. İsteğe bağlı olarak tercih ettiğiniz modeli ayarlayın:

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

3. Agent'e şunu söyleyin: _"Neon bir şehirde gece sürüşü hakkında enerjik bir synthpop parçası üret."_

Agent otomatik olarak `music_generate` çağırır. Araç allow-list eklemesi gerekmez.

Gerçek oturum destekli bir agent çalıştırması olmayan doğrudan eşzamanlı bağlamlar için, yerleşik
araç yine satır içi üretime geri döner ve son medya yolunu araç sonucunda döndürür.

Örnek prompt'lar:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### İş akışı güdümlü Comfy üretimi

Paketli `comfy` plugin'i, müzik üretimi sağlayıcısı kayıt defteri üzerinden paylaşılan `music_generate` aracına bağlanır.

1. `models.providers.comfy.music` altında bir iş akışı JSON'u ve
   prompt/çıktı Node'ları yapılandırın.
2. Comfy Cloud kullanıyorsanız `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` ayarlayın.
3. Agent'den müzik isteyin veya aracı doğrudan çağırın.

Örnek:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## Paylaşılan paketli sağlayıcı desteği

| Sağlayıcı | Varsayılan model       | Referans girdileri | Desteklenen denetimler                                     | API anahtarı                           |
| --------- | ---------------------- | ------------------ | ---------------------------------------------------------- | -------------------------------------- |
| ComfyUI   | `workflow`             | En fazla 1 görüntü | İş akışı tanımlı müzik veya ses                            | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google    | `lyria-3-clip-preview` | En fazla 10 görüntü | `lyrics`, `instrumental`, `format`                         | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax   | `music-2.5+`           | Yok                | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3`  | `MINIMAX_API_KEY`                      |

### Bildirilen yetenek matrisi

Bu, `music_generate`, sözleşme testleri
ve paylaşılan canlı tarama tarafından kullanılan açık mod sözleşmesidir.

| Sağlayıcı | `generate` | `edit` | Düzenleme sınırı | Paylaşılan canlı hatlar                                                    |
| --------- | ---------- | ------ | ---------------- | -------------------------------------------------------------------------- |
| ComfyUI   | Evet       | Evet   | 1 görüntü        | Paylaşılan taramada yok; `extensions/comfy/comfy.live.test.ts` ile kapsanır |
| Google    | Evet       | Evet   | 10 görüntü       | `generate`, `edit`                                                         |
| MiniMax   | Evet       | Hayır  | Yok              | `generate`                                                                 |

Çalışma zamanında kullanılabilir paylaşılan sağlayıcıları ve modelleri incelemek için
`action: "list"` kullanın:

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

## Yerleşik araç parametreleri

| Parametre         | Tür      | Açıklama                                                                                         |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `prompt`          | string   | Müzik üretim prompt'u (`action: "generate"` için gerekli)                                        |
| `action`          | string   | `"generate"` (varsayılan), geçerli oturum görevi için `"status"` veya sağlayıcıları incelemek için `"list"` |
| `model`           | string   | Sağlayıcı/model geçersiz kılması, ör. `google/lyria-3-pro-preview` veya `comfy/workflow`         |
| `lyrics`          | string   | Sağlayıcı açık söz girdisini destekliyorsa isteğe bağlı sözler                                   |
| `instrumental`    | boolean  | Sağlayıcı destekliyorsa yalnızca enstrümantal çıktı isteği                                       |
| `image`           | string   | Tek referans görüntü yolu veya URL                                                               |
| `images`          | string[] | Birden fazla referans görüntü (en fazla 10)                                                      |
| `durationSeconds` | number   | Sağlayıcı süre ipuçlarını destekliyorsa hedef süre (saniye)                                      |
| `timeoutMs`       | number   | Sağlayıcı isteği için isteğe bağlı zaman aşımı (milisaniye)                                      |
| `format`          | string   | Sağlayıcı destekliyorsa çıktı biçimi ipucu (`mp3` veya `wav`)                                    |
| `filename`        | string   | Çıktı dosya adı ipucu                                                                             |

Tüm sağlayıcılar tüm parametreleri desteklemez. OpenClaw yine de gönderimden önce
girdi sayıları gibi katı sınırları doğrular. Bir sağlayıcı süreyi destekliyor ama
istenen değerden daha kısa bir maksimum kullanıyorsa OpenClaw otomatik olarak
en yakın desteklenen süreye sınırlar. Gerçekten desteklenmeyen isteğe bağlı ipuçları,
seçilen sağlayıcı veya model bunları karşılayamadığında bir uyarıyla yok sayılır.

Araç sonuçları uygulanan ayarları bildirir. OpenClaw, sağlayıcı fallback'i sırasında süreyi sınırlandırdığında döndürülen `durationSeconds` gönderilen değeri yansıtır ve `details.normalization.durationSeconds`, istenenden uygulanana eşlemeyi gösterir.

## Paylaşılan sağlayıcı destekli yol için async davranış

- Oturum destekli agent çalıştırmaları: `music_generate` bir arka plan görevi oluşturur, hemen bir başladı/görev yanıtı döndürür ve bitmiş parçayı daha sonra takip eden bir agent mesajında gönderir.
- Yinelenen önleme: aynı oturumda bu arka plan görevi hâlâ `queued` veya `running` durumundaysa, sonraki `music_generate` çağrıları başka bir üretim başlatmak yerine görev durumunu döndürür.
- Durum arama: yeni üretim başlatmadan etkin oturum destekli müzik görevini incelemek için `action: "status"` kullanın.
- Görev takibi: üretim için kuyruğa alınmış, çalışan ve terminal durumları incelemek üzere `openclaw tasks list` veya `openclaw tasks show <taskId>` kullanın.
- Tamamlama uyandırması: OpenClaw aynı oturuma dahili bir tamamlama olayı enjekte eder; böylece model kullanıcıya dönük takibi kendisi yazabilir.
- Prompt ipucu: aynı oturumdaki sonraki kullanıcı/elle yapılan turlar, modelin körü körüne yeniden `music_generate` çağırmaması için bir müzik görevi zaten devam ediyorsa küçük bir çalışma zamanı ipucu alır.
- Oturumsuz fallback: gerçek agent oturumu olmayan doğrudan/yerel bağlamlar yine satır içi çalışır ve son ses sonucunu aynı turda döndürür.

### Görev yaşam döngüsü

Her `music_generate` isteği dört durumdan geçer:

1. **queued** -- görev oluşturuldu, sağlayıcının kabul etmesi bekleniyor.
2. **running** -- sağlayıcı işliyor (genellikle sağlayıcıya ve süreye bağlı olarak 30 saniye ile 3 dakika arası).
3. **succeeded** -- parça hazır; agent uyanır ve bunu konuşmaya gönderir.
4. **failed** -- sağlayıcı hatası veya zaman aşımı; agent hata ayrıntılarıyla uyanır.

Durumu CLI'den kontrol edin:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Yinelenen önleme: geçerli oturum için bir müzik görevi zaten `queued` veya `running` durumundaysa `music_generate`, yeni bir tane başlatmak yerine mevcut görev durumunu döndürür. Yeni üretim tetiklemeden açıkça kontrol etmek için `action: "status"` kullanın.

## Yapılandırma

### Model seçimi

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.5+"],
      },
    },
  },
}
```

### Sağlayıcı seçim sırası

Müzik üretirken OpenClaw sağlayıcıları şu sırayla dener:

1. Agent özellikle belirtiyorsa araç çağrısından gelen `model` parametresi
2. Yapılandırmadan gelen `musicGenerationModel.primary`
3. Sırayla `musicGenerationModel.fallbacks`
4. Yalnızca auth destekli sağlayıcı varsayılanları kullanılarak otomatik algılama:
   - önce geçerli varsayılan sağlayıcı
   - sonra sağlayıcı kimliği sırasıyla kalan kayıtlı müzik üretimi sağlayıcıları

Bir sağlayıcı başarısız olursa sıradaki aday otomatik olarak denenir. Hepsi başarısız olursa
hata her denemeden ayrıntıları içerir.

Müzik üretiminin yalnızca açık `model`, `primary` ve `fallbacks`
girdilerini kullanmasını istiyorsanız `agents.defaults.mediaGenerationAutoProviderFallback: false` ayarlayın.

## Sağlayıcı notları

- Google, Lyria 3 toplu üretimini kullanır. Geçerli paketli akış
  prompt, isteğe bağlı şarkı sözleri metni ve isteğe bağlı referans görüntüleri destekler.
- MiniMax, toplu `music_generation` uç noktasını kullanır. Geçerli paketli akış
  prompt, isteğe bağlı sözler, enstrümantal mod, süre yönlendirme ve
  mp3 çıktıyı destekler.
- ComfyUI desteği iş akışı güdümlüdür ve yapılandırılmış grafik ile
  prompt/çıktı alanları için Node eşlemesine bağlıdır.

## Sağlayıcı yetenek modları

Paylaşılan müzik üretimi sözleşmesi artık açık mod bildirimlerini destekler:

- yalnızca prompt ile üretim için `generate`
- istek bir veya daha fazla referans görüntü içerdiğinde `edit`

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
`supportsFormat` gibi eski düz alanlar düzenleme desteğini bildirmek için yeterli değildir. Sağlayıcılar,
canlı testler, sözleşme testleri ve paylaşılan `music_generate` aracının mod desteğini deterministik biçimde doğrulayabilmesi için
`generate` ve `edit` alanlarını açıkça bildirmelidir.

## Doğru yolu seçme

- Model seçimi, sağlayıcı failover'ı ve yerleşik async görev/durum akışını istiyorsanız paylaşılan sağlayıcı destekli yolu kullanın.
- Özel iş akışı grafiğine veya paylaşılan paketli müzik yeteneğinin parçası olmayan bir sağlayıcıya ihtiyacınız varsa ComfyUI gibi bir plugin yolunu kullanın.
- ComfyUI'ye özgü davranışta hata ayıklıyorsanız bkz. [ComfyUI](/tr/providers/comfy). Paylaşılan sağlayıcı davranışında hata ayıklıyorsanız [Google (Gemini)](/tr/providers/google) veya [MiniMax](/tr/providers/minimax) ile başlayın.

## Canlı testler

Paylaşılan paketli sağlayıcılar için opt-in canlı kapsam:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Repo sarmalayıcısı:

```bash
pnpm test:live:media music
```

Bu canlı dosya eksik sağlayıcı env değişkenlerini `~/.profile` dosyasından yükler, varsayılan olarak
saklanan auth profillerinden önce canlı/env API anahtarlarını tercih eder ve
sağlayıcı düzenleme modunu etkinleştirdiğinde hem `generate` hem de bildirilen `edit` kapsamını çalıştırır.

Bugün bu şu anlama gelir:

- `google`: `generate` artı `edit`
- `minimax`: yalnızca `generate`
- `comfy`: paylaşılan sağlayıcı taraması değil, ayrı Comfy canlı kapsamı

Paketli ComfyUI müzik yolu için opt-in canlı kapsam:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy canlı dosyası, bu bölümler yapılandırıldığında comfy görüntü ve video iş akışlarını da kapsar.

## İlgili

- [Background Tasks](/tr/automation/tasks) - ayrılmış `music_generate` çalıştırmaları için görev takibi
- [Configuration Reference](/tr/gateway/config-agents#agent-defaults) - `musicGenerationModel` yapılandırması
- [ComfyUI](/tr/providers/comfy)
- [Google (Gemini)](/tr/providers/google)
- [MiniMax](/tr/providers/minimax)
- [Models](/tr/concepts/models) - model yapılandırması ve failover
- [Tools Overview](/tr/tools)
