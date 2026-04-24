---
read_when:
    - code_execution'ı etkinleştirmek veya yapılandırmak istiyorsunuz
    - Yerel shell erişimi olmadan uzak analiz istiyorsunuz
    - x_search veya web_search'ü uzak Python analiziyle birleştirmek istiyorsunuz
summary: code_execution -- xAI ile sandbox'lanmış uzak Python analizi çalıştırma
title: Kod yürütme
x-i18n:
    generated_at: "2026-04-24T09:34:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 332afbbef15eaa832d87f263eb095eff680e8f941b9e123add9b37f9b4fa5e00
    source_path: tools/code-execution.md
    workflow: 15
---

`code_execution`, xAI'ın Responses API'si üzerinde sandbox'lanmış uzak Python analizi çalıştırır.
Bu, yerel [`exec`](/tr/tools/exec) aracından farklıdır:

- `exec`, makinenizde veya Node'unuzda shell komutları çalıştırır
- `code_execution`, xAI'ın uzak sandbox'ında Python çalıştırır

`code_execution` şu işler için kullanın:

- hesaplamalar
- tablo oluşturma
- hızlı istatistikler
- grafik tarzı analiz
- `x_search` veya `web_search` tarafından döndürülen verileri analiz etme

Yerel dosyalarınıza, shell'inize, deponuza veya eşleştirilmiş
cihazlara ihtiyaç duyduğunuzda bunu kullanmayın. Bunun için [`exec`](/tr/tools/exec) kullanın.

## Kurulum

Bir xAI API anahtarına ihtiyacınız var. Şunlardan herhangi biri çalışır:

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

Örnek:

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## Nasıl kullanılır

Doğal konuşun ve analiz niyetini açıkça belirtin:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Araç dahili olarak tek bir `task` parametresi alır; bu yüzden ajan,
tam analiz isteğini ve satır içi verileri tek bir istemde göndermelidir.

## Sınırlar

- Bu, yerel süreç yürütmesi değil, uzak xAI yürütmesidir.
- Bunu kalıcı bir notebook değil, geçici analiz olarak değerlendirin.
- Yerel dosyalara veya çalışma alanınıza erişim olduğunu varsaymayın.
- Yeni X verileri için önce [`x_search`](/tr/tools/web#x_search) kullanın.

## İlgili

- [Exec aracı](/tr/tools/exec)
- [Yürütme onayları](/tr/tools/exec-approvals)
- [apply_patch aracı](/tr/tools/apply-patch)
- [Web araçları](/tr/tools/web)
- [xAI](/tr/providers/xai)
