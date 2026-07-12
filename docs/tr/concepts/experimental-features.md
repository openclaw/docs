---
read_when:
    - Bir `.experimental` yapılandırma anahtarı görüyorsunuz ve bunun kararlı olup olmadığını bilmek istiyorsunuz
    - Önizleme çalışma zamanı özelliklerini normal varsayılanlarla karıştırmadan denemek istiyorsunuz
    - Şu anda belgelenmiş deneysel bayrakları bulabileceğiniz tek bir yer istiyorsunuz
summary: OpenClaw'daki deneysel bayrakların anlamı ve şu anda hangilerinin belgelendiği
title: Deneysel özellikler
x-i18n:
    generated_at: "2026-07-12T12:13:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d4f6d066ef80cad2fb8a54c8aecb9fca5b4ed91cd5a3626dad4ad889dc3e8f2
    source_path: concepts/experimental-features.md
    workflow: 16
---

Deneysel özellikler, açık bayrakların arkasında yer alan ve isteğe bağlı etkinleştirilen önizleme yüzeyleridir. Kararlı bir varsayılan veya uzun ömürlü bir sözleşme edinmeden önce gerçek dünyada daha fazla kullanılarak sınanmaları gerekir.

- Bir belge etkinleştirmenizi söylemediği sürece varsayılan olarak kapalıdır.
- Yapısı ve davranışı, kararlı yapılandırmaya göre daha hızlı değişebilir.
- Mevcut bir kararlı yol varsa onu tercih edin.
- Yalnızca önce daha küçük bir ortamda test ettikten sonra geniş çapta kullanıma sunun.

## Şu anda belgelenen bayraklar

| Yüzey                    | Anahtar                                                                                    | Şu durumda kullanın                                                                                                                              | Daha fazla bilgi                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Yerel model çalışma zamanı | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Daha küçük veya daha katı bir yerel arka uç, OpenClaw'ın tam varsayılan araç yüzeyini işleyemediğinde                                               | [Yerel Modeller](/tr/gateway/local-models)                                                          |
| Bellek araması            | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | `memory_search` aracının önceki oturum dökümlerini dizine eklemesini istiyor ve ek depolama/dizinleme maliyetini kabul ediyorsanız                 | [Bellek yapılandırması referansı](/tr/reference/memory-config#session-memory-search-experimental)   |
| Codex çalıştırma düzeneği | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Code Mode'u devre dışı bırakmak yerine yerel Codex app-server 0.132.0 veya daha yeni bir sürümün OpenClaw sandbox destekli bir exec-server'ı hedeflemesini istiyorsanız | [Codex çalıştırma düzeneği referansı](/tr/plugins/codex-harness-reference#sandboxed-native-execution) |
| Yapılandırılmış planlama aracı | `tools.experimental.planTool`                                                              | Uyumlu çalışma zamanlarında ve kullanıcı arayüzlerinde çok adımlı iş takibi için yapılandırılmış `update_plan` aracının sunulmasını istiyorsanız   | [Gateway yapılandırması referansı](/tr/gateway/config-tools#toolsexperimental)                       |

## Yerel model yalın modu

`agents.defaults.experimental.localModelLean: true`, her turda ağır isteğe bağlı araçları ajanın doğrudan yüzeyinden kaldırır: `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` ve `pdf`. Açıkça izin verilen veya teslimat için gerekli araçlar kullanılabilir kalır; ancak Araç Arama bunları doğrudan sunmak yerine kataloğa alabilir. Yalın mod ayrıca, `tools.toolSearch` önceden ayarlanmamışsa Plugin/MCP/istemci katalogları için varsayılan olarak yapılandırılmış Araç Arama'yı (`tool_search`, `tool_describe`, `tool_call`) kullanır. Bunu tek bir ajanla sınırlamak için `agents.list[].experimental.localModelLean` kullanın.

Araç Arama'yı zaten genel olarak ayarlıyorsanız OpenClaw bu yapılandırmayı değiştirmez. Yalın modun Araç Arama varsayılanını devre dışı bırakmak için `tools.toolSearch: false` ayarlayın.

Yapılandırılmış `tools` modunda yalın çalıştırmalar, kodlama için ayarlanmış yerel modellerin alışık oldukları kabuk yolunu seçebilmeleri amacıyla `exec` aracını Araç Arama denetimlerinin yanında doğrudan görünür tutar. Bu yalnızca şema görünürlüğünü değiştirir: normal araç ilkesi, sandbox kullanımı ve exec onayları geçerliliğini korur. Açık `code` ve `directory` modları normal Compaction davranışlarını korur.

### Neden bu araçlar

Bu araçlar en büyük açıklamalara, en geniş parametre yapılarına veya küçük bir modelin normal kodlama ve konuşma yolundan sapmasına neden olma olasılığına sahiptir. Küçük bağlamlı veya daha katı OpenAI uyumlu bir arka uçta bu, şu durumlar arasındaki farkı oluşturur:

- Araç şemalarının isteme sığması veya konuşma geçmişine yer bırakmaması.
- Modelin doğru aracı seçmesi veya birbirine benzeyen çok fazla şema nedeniyle hatalı araç çağrıları oluşturması.
- Chat Completions bağdaştırıcısının yapılandırılmış çıktı sınırları içinde kalması veya araç çağrısı yükü boyutu nedeniyle 400 hatası vermesi.

Bunların kaldırılması yalnızca doğrudan araç listesini kısaltır. Model yine de `read`, `write`, `edit`, `exec`, `apply_patch`, görüntü anlama, web arama/getirme (yapılandırıldığında), bellek ve oturum/ajan araçlarına sahiptir. `tools.toolSearch: false` ayarlamadığınız sürece ek kataloglara Araç Arama üzerinden erişilebilir; açık araç izinleri, yalın bir ajanın daraltılmış bir iş akışına yeniden katılmasını sağlayabilir.

### Ne zaman etkinleştirilmeli

Modelin Gateway ile iletişim kurabildiğini ancak tam ajan turlarının hatalı davrandığını kanıtladıktan sonra yalın modu etkinleştirin:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` başarılı olur.
2. Normal bir ajan turu; hatalı araç çağrıları, aşırı büyük istemler veya modelin araçlarını yok sayması nedeniyle başarısız olur.
3. `localModelLean: true` olarak değiştirmek hatayı giderir.

### Ne zaman kapalı bırakılmalı

Arka ucunuz tam varsayılan çalışma zamanını sorunsuz biçimde işliyorsa bunu kapalı bırakın. Bu, barındırılan modeller veya yeterli kaynağa sahip yerel sistemler için bir varsayılan değil, daha küçük bir araç yüzeyine ihtiyaç duyan yerel yığınlar için geçici bir çözümdür.

Yalın mod; `tools.profile`, `tools.allow`/`tools.deny` veya modelin `compat.supportsTools: false` kaçış seçeneğinin yerini almaz. Belirli bir ajanda kalıcı olarak daha dar bir araç yüzeyi için bu kararlı ayarları tercih edin.

### Etkinleştirme

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

Yalnızca bir ajan için:

```json5
{
  agents: {
    list: [
      {
        id: "local",
        model: "lmstudio/gemma-4-e4b-it",
        experimental: {
          localModelLean: true,
        },
      },
    ],
  },
}
```

Bayrağı değiştirdikten sonra Gateway'i yeniden başlatın. Yalın filtreleme; `tools.allow` veya `tools.alsoAllow` ile açıkça korumadığınız sürece `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` ve `pdf` araçlarını kaldırır. Araç Arama, korunan araçları doğrudan sunmak yerine yine de kataloğa alabilir.

## Deneysel, gizli demek değildir

Deneysel bir özellik, kararlı görünen varsayılan bir ayarın arkasına gizlenmek yerine hem belgelerde hem de yapılandırma yolunda açıkça deneysel olarak belirtilmelidir.

## İlgili

- [Özellikler](/tr/concepts/features)
- [Sürüm kanalları](/tr/install/development-channels)
