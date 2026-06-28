---
read_when:
    - Bir `.experimental` yapılandırma anahtarı görüyorsunuz ve bunun kararlı olup olmadığını bilmek istiyorsunuz
    - Önizleme çalışma zamanı özelliklerini normal varsayılanlarla karıştırmadan denemek istiyorsunuz
    - Belgelenmiş mevcut deneysel bayrakları bulmak için tek bir yer istiyorsunuz
summary: OpenClaw'da deneysel bayrakların ne anlama geldiği ve hangilerinin şu anda belgelendiği
title: Deneysel özellikler
x-i18n:
    generated_at: "2026-06-28T00:27:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0f42e6b574c5db9508412c9c5d9919d1a54a16fe00edea43664f3a01e8e38f5
    source_path: concepts/experimental-features.md
    workflow: 16
---

OpenClaw’daki deneysel özellikler **isteğe bağlı önizleme yüzeyleridir**. Kararlı bir varsayılanı veya uzun ömürlü bir genel sözleşmeyi hak etmeden önce gerçek dünyada daha fazla denenmeleri gerektiği için açık bayrakların arkasındadırlar.

Bunları normal yapılandırmadan farklı ele alın:

- İlgili doküman denemenizi söylemediği sürece **varsayılan olarak kapalı** tutun.
- **Şekil ve davranışın** kararlı yapılandırmadan daha hızlı değişmesini bekleyin.
- Zaten mevcut olduğunda önce kararlı yolu tercih edin.
- OpenClaw’ı geniş ölçekte kullanıma alıyorsanız, deneysel bayrakları paylaşılan bir temele dahil etmeden önce daha küçük bir ortamda test edin.

## Şu Anda Belgelenen Bayraklar

| Yüzey                    | Anahtar                                                                                    | Ne zaman kullanılır                                                                                                             | Daha fazla                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Yerel model çalışma zamanı | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Daha küçük veya daha katı bir yerel arka uç, OpenClaw’ın tam varsayılan araç yüzeyinde zorlandığında                              | [Yerel Modeller](/tr/gateway/local-models)                                                       |
| Bellek araması           | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | `memory_search` aracının önceki oturum transcriptlerini indekslemesini ve ek depolama/indeksleme maliyetini kabul etmesini istediğinizde | [Bellek yapılandırma referansı](/tr/reference/memory-config#session-memory-search-experimental) |
| Codex harness            | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Native Codex app-server 0.132.0 veya daha yenisinin, Code Mode’u devre dışı bırakmak yerine OpenClaw sandbox destekli exec-server’ı hedeflemesini istediğinizde | [Codex harness referansı](/tr/plugins/codex-harness-reference#sandboxed-native-execution)        |
| Yapılandırılmış planlama aracı | `tools.experimental.planTool`                                                              | Uyumlu çalışma zamanlarında ve UI’larda çok adımlı iş takibi için yapılandırılmış `update_plan` aracının açığa çıkarılmasını istediğinizde | [Gateway yapılandırma referansı](/tr/gateway/config-tools#toolsexperimental)                    |

## Yerel Model Lean Mode

`agents.defaults.experimental.localModelLean: true`, daha zayıf yerel model kurulumları için bir basınç azaltma valfidir. Açık olduğunda OpenClaw, her turda aracının araç yüzeyinden üç varsayılan aracı — `browser`, `cron` ve `message` — kaldırır. Ayrıca `tools.toolSearch` açıkça yapılandırılmamışsa bu çalıştırmayı varsayılan olarak yapılandırılmış Tool Search kontrollerine yönlendirir; böylece daha büyük Plugin, MCP veya istemci araç katalogları prompt’a dökülmek yerine `tool_search`, `tool_describe` ve `tool_call` arkasında kalır. Doğrudan `message` teslimi gerektiren çalıştırmalar, lean-mode Tool Search varsayılanını etkinleştirmek yerine bu aracı doğrudan tutar. Yapılandırılmış tek bir agent için aynı davranışı etkinleştirmek veya devre dışı bırakmak üzere `agents.list[].experimental.localModelLean` kullanın.

### Neden Bu Üç Araç

Bu üç araç, varsayılan OpenClaw çalışma zamanında en büyük açıklamalara ve en fazla parametre şekline sahiptir. Küçük bağlamlı veya daha katı OpenAI uyumlu bir arka uçta bu, şunlar arasındaki farktır:

- Araç şemalarının prompt’a temizce sığması veya konuşma geçmişini sıkıştırması.
- Modelin doğru aracı seçmesi veya çok fazla benzer görünen şema olduğu için hatalı biçimlendirilmiş araç çağrıları üretmesi.
- Chat Completions adaptörünün sunucunun yapılandırılmış çıktı sınırları içinde kalması veya araç çağrısı yük boyutu nedeniyle 400 hatasına takılması.

Bunların kaldırılması OpenClaw’ı sessizce yeniden bağlamaz; yalnızca doğrudan araç listesini kısaltır. Modelin hâlâ `read`, `write`, `edit`, `exec`, `apply_patch`, web araması/getirme (yapılandırıldığında), bellek ve oturum/agent araçları kullanılabilir. Ek kataloglar, açıkça `tools.toolSearch: false` ayarlamadığınız sürece Tool Search üzerinden çağrılabilir kalır.

### Ne Zaman Açılmalı

Lean mode’u, modelin Gateway ile konuşabildiğini zaten kanıtladığınız ancak tam agent turlarının sorun çıkardığı durumda etkinleştirin. Tipik sinyal zinciri şudur:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` başarılı olur.
2. Normal bir agent turu hatalı biçimlendirilmiş araç çağrıları, aşırı büyük prompt’lar veya modelin araçlarını yok sayması nedeniyle başarısız olur.
3. `localModelLean: true` ayarını değiştirmek hatayı giderir.

### Ne Zaman Kapalı Bırakılmalı

Arka ucunuz tam varsayılan çalışma zamanını temiz şekilde işliyorsa bunu kapalı bırakın. Lean mode bir geçici çözümdür, varsayılan değildir. Bazı yerel yığınların düzgün çalışmak için daha küçük bir araç yüzeyine ihtiyaç duyması nedeniyle vardır; barındırılan modeller ve iyi kaynaklandırılmış yerel sistemler buna ihtiyaç duymaz.

Lean mode ayrıca `tools.profile`, `tools.allow`/`tools.deny` veya model `compat.supportsTools: false` kaçış yolunun yerine geçmez. Belirli bir agent için kalıcı olarak daha dar bir araç yüzeyine ihtiyacınız varsa, deneysel bayrak yerine bu kararlı ayarları tercih edin.

Tool Search’ü zaten genel olarak ayarlıyorsanız, OpenClaw bu operatör yapılandırmasını olduğu gibi bırakır. Lean-mode Tool Search varsayılanından çıkmak için `tools.toolSearch: false` ayarlayın.

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

Yalnızca bir agent için:

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

Bayrağı değiştirdikten sonra Gateway’i yeniden başlatın, ardından kısaltılmış araç listesini şununla doğrulayın:

```bash
openclaw status --deep
```

Derin durum çıktısı etkin agent araçlarını listeler; mevcut teslim modu doğrudan `message` yanıtlarını zorunlu kılmadıkça, lean mode açıkken `browser`, `cron` ve `message` bulunmamalıdır.

## Deneysel Gizli Anlamına Gelmez

Bir özellik deneyselse OpenClaw bunu dokümanlarda ve yapılandırma yolunun kendisinde açıkça söylemelidir. Yapmaması gereken şey, önizleme davranışını kararlı görünen varsayılan bir ayara gizlice sokup bunun normalmiş gibi davranmaktır. Yapılandırma yüzeyleri bu şekilde karmaşıklaşır.

## İlgili

- [Özellikler](/tr/concepts/features)
- [Sürüm kanalları](/tr/install/development-channels)
