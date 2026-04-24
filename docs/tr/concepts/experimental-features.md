---
read_when:
    - Bir `.experimental` yapılandırma anahtarı görüyorsunuz ve bunun kararlı olup olmadığını bilmek istiyorsunuz
    - Önizleme çalışma zamanı özelliklerini, normal varsayılanlarla karıştırmadan denemek istiyorsunuz
    - Şu anda belgelenen deneysel bayrakları tek bir yerde bulmak istiyorsunuz
summary: OpenClaw'da deneysel bayrakların ne anlama geldiği ve hangilerinin şu anda belgelendiği
title: Deneysel özellikler
x-i18n:
    generated_at: "2026-04-24T09:05:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a97e8efa180844e1ca94495d626956847a15a15bba0846aaf54ff9c918cda02
    source_path: concepts/experimental-features.md
    workflow: 15
---

OpenClaw'daki deneysel özellikler **isteğe bağlı önizleme yüzeyleridir**. Bunlar
açık bayrakların arkasındadır çünkü kararlı bir varsayılanı veya uzun ömürlü bir genel sözleşmeyi hak etmeden önce
gerçek dünya kullanımına hâlâ ihtiyaç duyarlar.

Bunlara normal yapılandırmadan farklı yaklaşın:

- İlgili belge size denemenizi söylemediği sürece bunları varsayılan olarak **kapalı tutun**.
- Biçim ve davranışın kararlı yapılandırmaya göre daha hızlı **değişmesini bekleyin**.
- Mevcutsa önce kararlı yolu tercih edin.
- OpenClaw'ı geniş çapta devreye alıyorsanız, deneysel bayrakları ortak bir temele yerleştirmeden önce
  daha küçük bir ortamda test edin.

## Şu anda belgelenen bayraklar

| Yüzey                   | Anahtar                                                  | Şu durumda kullanın                                                                                             | Daha fazla                                                                                     |
| ----------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Yerel model çalışma zamanı | `agents.defaults.experimental.localModelLean`          | Daha küçük veya daha katı bir yerel backend, OpenClaw'ın tam varsayılan araç yüzeyinde zorlanıyorsa            | [Local Models](/tr/gateway/local-models)                                                          |
| Bellek araması          | `agents.defaults.memorySearch.experimental.sessionMemory` | `memory_search` aracının önceki oturum dökümlerini indekslemesini istiyor ve ek depolama/indeksleme maliyetini kabul ediyorsanız | [Memory configuration reference](/tr/reference/memory-config#session-memory-search-experimental) |
| Yapılandırılmış planlama aracı | `tools.experimental.planTool`                    | Uyumlu çalışma zamanları ve arayüzlerde çok adımlı iş takibi için yapılandırılmış `update_plan` aracının görünmesini istiyorsanız | [Gateway configuration reference](/tr/gateway/config-tools#toolsexperimental)                     |

## Yerel model lean modu

`agents.defaults.experimental.localModelLean: true`, daha zayıf yerel model kurulumları için bir
basınç tahliye vanasıdır. `browser`, `cron` ve `message`
gibi ağır varsayılan araçları budar; böylece istem biçimi küçük bağlamlı veya daha katı
OpenAI uyumlu backend'ler için daha küçük ve daha az kırılgan olur.

Bu, bilerek **normal yol değildir**. Backend'iniz tam
çalışma zamanını temiz biçimde işliyorsa, bunu kapalı bırakın.

## Deneysel gizli anlamına gelmez

Bir özellik deneyselse OpenClaw, bunu belgelerde ve
yapılandırma yolunun kendisinde açıkça söylemelidir. Yapmaması gereken şey ise önizleme davranışını
kararlı görünen varsayılan bir düğmenin içine gizlice sokup bunun normalmiş gibi davranmaktır. Yapılandırma
yüzeyleri böyle dağınık hale gelir.

## İlgili

- [Features](/tr/concepts/features)
- [Release channels](/tr/install/development-channels)
