---
read_when:
    - '`.experimental` yapılandırma anahtarını görüyorsunuz ve bunun kararlı olup olmadığını bilmek istiyorsunuz'
    - Önizleme çalışma zamanı özelliklerini normal varsayılanlarla karıştırmadan denemek istiyorsunuz
    - Şu anda belgelenmiş deneysel bayrakları bulmak için tek bir yer istiyorsunuz
summary: OpenClaw'da deneysel bayrakların ne anlama geldiği ve hangilerinin şu anda belgelendiği
title: Deneysel özellikler
x-i18n:
    generated_at: "2026-05-02T22:18:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 066efa297bac995597f1092ed6473d9cff28c01d7e28fa1382d7997f8f83a346
    source_path: concepts/experimental-features.md
    workflow: 16
---

OpenClaw'daki deneysel özellikler **isteğe bağlı önizleme yüzeyleridir**. Henüz kararlı bir varsayılanı veya uzun ömürlü bir herkese açık sözleşmeyi hak etmeden önce gerçek dünya kullanımı gerektirdikleri için açık bayrakların arkasındadırlar.

Bunlara normal yapılandırmadan farklı davranın:

- İlgili belge birini denemenizi söylemedikçe bunları **varsayılan olarak kapalı** tutun.
- **Şekil ve davranışın** kararlı yapılandırmadan daha hızlı değişmesini bekleyin.
- Zaten mevcutsa önce kararlı yolu tercih edin.
- OpenClaw'ı geniş ölçekte kullanıma alıyorsanız, deneysel bayrakları paylaşılan bir temele yerleştirmeden önce daha küçük bir ortamda test edin.

## Şu anda belgelenen bayraklar

| Yüzey                    | Anahtar                                                   | Ne zaman kullanılır                                                                                                 | Daha fazla                                                                                   |
| ------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Yerel model çalışma zamanı | `agents.defaults.experimental.localModelLean`             | Daha küçük veya daha katı bir yerel arka uç, OpenClaw'ın tam varsayılan araç yüzeyinde zorlanıyorsa                  | [Yerel Modeller](/tr/gateway/local-models)                                                       |
| Bellek araması           | `agents.defaults.memorySearch.experimental.sessionMemory` | `memory_search` aracının önceki oturum dökümlerini dizine eklemesini istiyor ve ek depolama/dizinleme maliyetini kabul ediyorsanız | [Bellek yapılandırma başvurusu](/tr/reference/memory-config#session-memory-search-experimental) |
| Yapılandırılmış planlama aracı | `tools.experimental.planTool`                             | Uyumlu çalışma zamanlarında ve kullanıcı arayüzlerinde çok adımlı iş takibi için yapılandırılmış `update_plan` aracının sunulmasını istiyorsanız | [Gateway yapılandırma başvurusu](/tr/gateway/config-tools#toolsexperimental)                    |

## Yerel model yalın modu

`agents.defaults.experimental.localModelLean: true`, daha zayıf yerel model kurulumları için bir baskı azaltma valfidir. Açık olduğunda OpenClaw, her tur için ajanın araç yüzeyinden üç varsayılan aracı — `browser`, `cron` ve `message` — kaldırır. Başka hiçbir şey değişmez.

### Neden bu üç araç

Bu üç araç, varsayılan OpenClaw çalışma zamanında en büyük açıklamalara ve en çok parametre şekline sahiptir. Küçük bağlamlı veya daha katı OpenAI uyumlu bir arka uçta bu, şu farkı yaratır:

- Araç şemalarının isteme temizce sığması ile konuşma geçmişini sıkıştırması arasındaki fark.
- Modelin doğru aracı seçmesi ile çok fazla benzer görünen şema olduğu için hatalı biçimlendirilmiş araç çağrıları üretmesi arasındaki fark.
- Chat Completions bağdaştırıcısının sunucunun yapılandırılmış çıktı sınırları içinde kalması ile araç çağrısı yük boyutu nedeniyle 400 hatasına takılması arasındaki fark.

Bunları kaldırmak OpenClaw'ı sessizce yeniden bağlamaz; yalnızca araç listesini kısaltır. Modelin kullanabileceği `read`, `write`, `edit`, `exec`, `apply_patch`, web araması/getirme (yapılandırıldığında), bellek ve oturum/ajan araçları hâlâ vardır.

### Ne zaman açılmalı

Yalın modu, modelin Gateway ile konuşabildiğini zaten kanıtladıysanız ancak tam ajan turları hatalı davranıyorsa etkinleştirin. Tipik sinyal zinciri şöyledir:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` başarılı olur.
2. Normal bir ajan turu hatalı biçimlendirilmiş araç çağrıları, aşırı büyük istemler veya modelin araçlarını yok sayması nedeniyle başarısız olur.
3. `localModelLean: true` ayarını açmak hatayı giderir.

### Ne zaman kapalı bırakılmalı

Arka ucunuz tam varsayılan çalışma zamanını temiz şekilde işliyorsa bunu kapalı bırakın. Yalın mod bir geçici çözümdür, varsayılan değildir. Bazı yerel yığınların düzgün davranmak için daha küçük bir araç yüzeyine ihtiyaç duyması nedeniyle vardır; barındırılan modeller ve iyi kaynak ayrılmış yerel sistemler buna ihtiyaç duymaz.

Yalın mod ayrıca `tools.profile`, `tools.allow`/`tools.deny` veya model `compat.supportsTools: false` kaçış yolunun yerine geçmez. Belirli bir ajan için kalıcı olarak daha dar bir araç yüzeyine ihtiyacınız varsa, deneysel bayrak yerine bu kararlı ayarları tercih edin.

### Etkinleştir

```json5
{
  agents: {
    defaults: {
      experimental: {
        localModelLean: true,
      },
    },
  },
}
```

Bayrağı değiştirdikten sonra Gateway'i yeniden başlatın, ardından kırpılmış araç listesini şununla doğrulayın:

```bash
openclaw status --deep
```

Derin durum çıktısı etkin ajan araçlarını listeler; yalın mod açıkken `browser`, `cron` ve `message` bulunmamalıdır.

## Deneysel, gizli anlamına gelmez

Bir özellik deneyselse OpenClaw bunu belgelerde ve yapılandırma yolunun kendisinde açıkça söylemelidir. Yapmaması gereken şey, önizleme davranışını kararlı görünen bir varsayılan ayarın içine gizlice sokup bunun normalmiş gibi davranmaktır. Yapılandırma yüzeyleri böyle dağınık hale gelir.

## İlgili

- [Özellikler](/tr/concepts/features)
- [Sürüm kanalları](/tr/install/development-channels)
