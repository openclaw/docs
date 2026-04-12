---
read_when:
    - OpenClaw içinde Anthropic modellerini kullanmak istiyorsunuz
summary: OpenClaw içinde Anthropic Claude’u API anahtarları veya Claude CLI ile kullanın
title: Anthropic
x-i18n:
    generated_at: "2026-04-12T23:29:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e3dda5f98ade9d4c3841888103bfb43d59e075d358a701ed0ae3ffb8d5694a7
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic, **Claude** model ailesini geliştirir. OpenClaw iki kimlik doğrulama yolunu destekler:

- **API key** — kullanım bazlı faturalandırma ile doğrudan Anthropic API erişimi (`anthropic/*` modelleri)
- **Claude CLI** — aynı ana makinede mevcut bir Claude CLI oturumunu yeniden kullanma

<Warning>
Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi, bu yüzden
Anthropic yeni bir politika yayımlamadığı sürece OpenClaw, Claude CLI yeniden kullanımını ve
`claude -p` kullanımını onaylanmış kabul eder.

Uzun ömürlü gateway ana makineleri için Anthropic API anahtarları hâlâ en net ve
en öngörülebilir üretim yoludur.

Anthropic'in mevcut genel belgeleri:

- [Claude Code CLI referansı](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK genel bakışı](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Claude Code'u Pro veya Max planınızla kullanma](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Claude Code'u Team veya Enterprise planınızla kullanma](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)
  </Warning>

## Başlangıç

<Tabs>
  <Tab title="API key">
    **En iyisi:** standart API erişimi ve kullanım bazlı faturalandırma.

    <Steps>
      <Step title="API anahtarınızı alın">
        [Anthropic Console](https://console.anthropic.com/) içinde bir API anahtarı oluşturun.
      </Step>
      <Step title="Başlangıç kurulumunu çalıştırın">
        ```bash
        openclaw onboard
        # seçin: Anthropic API key
        ```

        Veya anahtarı doğrudan verin:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Yapılandırma örneği

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **En iyisi:** ayrı bir API anahtarı olmadan mevcut bir Claude CLI oturumunu yeniden kullanmak.

    <Steps>
      <Step title="Claude CLI'nin kurulu ve oturum açılmış olduğundan emin olun">
        Şu komutla doğrulayın:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Başlangıç kurulumunu çalıştırın">
        ```bash
        openclaw onboard
        # seçin: Claude CLI
        ```

        OpenClaw mevcut Claude CLI kimlik bilgilerini algılar ve yeniden kullanır.
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI arka ucu için kurulum ve çalışma zamanı ayrıntıları [CLI Backends](/tr/gateway/cli-backends) bölümündedir.
    </Note>

    <Tip>
    En net faturalandırma yolunu istiyorsanız bunun yerine bir Anthropic API anahtarı kullanın. OpenClaw ayrıca [OpenAI Codex](/tr/providers/openai), [Qwen Cloud](/tr/providers/qwen), [MiniMax](/tr/providers/minimax) ve [Z.AI / GLM](/tr/providers/glm) üzerinden abonelik tarzı seçenekleri de destekler.
    </Tip>

  </Tab>
</Tabs>

## Thinking varsayılanları (Claude 4.6)

Claude 4.6 modelleri, açık bir thinking düzeyi ayarlanmadığında OpenClaw içinde varsayılan olarak `adaptive` kullanır.

Mesaj başına `/think:<level>` ile veya model parametrelerinde geçersiz kılın:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
İlgili Anthropic belgeleri:
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## Prompt caching

OpenClaw, API key kimlik doğrulaması için Anthropic'in prompt caching özelliğini destekler.

| Value               | Cache duration | Açıklama                               |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (varsayılan) | 5 dakika    | API key kimlik doğrulaması için otomatik uygulanır |
| `"long"`            | 1 saat         | Genişletilmiş önbellek                 |
| `"none"`            | Önbellekleme yok | Prompt caching'i devre dışı bırakır  |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Ajan başına önbellek geçersiz kılmaları">
    Model düzeyi parametreleri temeliniz olarak kullanın, ardından belirli ajanları `agents.list[].params` ile geçersiz kılın:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Yapılandırma birleştirme sırası:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (eşleşen `id`, anahtara göre geçersiz kılar)

    Bu, aynı modeli kullanan bir ajanın uzun ömürlü bir önbellek tutmasına, başka bir ajanın ise dalgalı/düşük yeniden kullanım trafiği için önbelleği devre dışı bırakmasına olanak tanır.

  </Accordion>

  <Accordion title="Bedrock Claude notları">
    - Bedrock üzerindeki Anthropic Claude modelleri (`amazon-bedrock/*anthropic.claude*`), yapılandırıldığında `cacheRetention` geçişini kabul eder.
    - Anthropic dışı Bedrock modelleri çalışma zamanında zorla `cacheRetention: "none"` olarak ayarlanır.
    - API key akıllı varsayılanları, açık bir değer ayarlanmamışsa Claude-on-Bedrock referansları için `cacheRetention: "short"` da başlatır.
  </Accordion>
</AccordionGroup>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Hızlı mod">
    OpenClaw'un paylaşılan `/fast` anahtarı, doğrudan Anthropic trafiğini destekler (`api.anthropic.com` için API key ve OAuth).

    | Komut | Eşlenir |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Yalnızca doğrudan `api.anthropic.com` isteklerine eklenir. Proxy yolları `service_tier` değerine dokunmaz.
    - Açık `serviceTier` veya `service_tier` parametreleri, ikisi birden ayarlandığında `/fast` değerini geçersiz kılar.
    - Priority Tier kapasitesi olmayan hesaplarda `service_tier: "auto"` değeri `standard` olarak çözümlenebilir.
    </Note>

  </Accordion>

  <Accordion title="Medya anlama (görüntü ve PDF)">
    Paketlenmiş Anthropic Plugin'i görüntü ve PDF anlamayı kaydeder. OpenClaw
    yapılandırılmış Anthropic kimlik doğrulamasından medya yeteneklerini otomatik çözümler — ek
    yapılandırma gerekmez.

    | Özellik       | Değer                |
    | -------------- | -------------------- |
    | Varsayılan model  | `claude-opus-4-6`    |
    | Desteklenen girdi | Görüntüler, PDF belgeleri |

    Bir konuşmaya görüntü veya PDF eklendiğinde, OpenClaw bunu otomatik olarak
    Anthropic medya anlama sağlayıcısı üzerinden yönlendirir.

  </Accordion>

  <Accordion title="1M bağlam penceresi (beta)">
    Anthropic'in 1M bağlam penceresi beta geçitlidir. Bunu model başına etkinleştirin:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw bunu isteklerde `anthropic-beta: context-1m-2025-08-07` olarak eşler.

    <Warning>
    Anthropic kimlik bilginizde uzun bağlam erişimi gerektirir. Eski token kimlik doğrulaması (`sk-ant-oat-*`) 1M bağlam istekleri için reddedilir — OpenClaw bir uyarı günlüğe kaydeder ve standart bağlam penceresine geri döner.
    </Warning>

  </Accordion>
</AccordionGroup>

## Sorun giderme

<AccordionGroup>
  <Accordion title="401 hataları / token aniden geçersiz">
    Anthropic token kimlik doğrulamasının süresi dolabilir veya iptal edilebilir. Yeni kurulumlar için bir Anthropic API key'e geçin.
  </Accordion>

  <Accordion title='Sağlayıcı "anthropic" için API key bulunamadı'>
    Kimlik doğrulama **ajan başınadır**. Yeni ajanlar, ana ajanın anahtarlarını devralmaz. Bu ajan için başlangıç kurulumunu yeniden çalıştırın veya gateway ana makinesinde bir API key yapılandırın, ardından `openclaw models status` ile doğrulayın.
  </Accordion>

  <Accordion title='Profil "anthropic:default" için kimlik bilgisi bulunamadı'>
    Hangi kimlik doğrulama profilinin etkin olduğunu görmek için `openclaw models status` çalıştırın. Başlangıç kurulumunu yeniden çalıştırın veya bu profil yolu için bir API key yapılandırın.
  </Accordion>

  <Accordion title="Kullanılabilir kimlik doğrulama profili yok (hepsi bekleme süresinde)">
    `auth.unusableProfiles` için `openclaw models status --json` çıktısını kontrol edin. Anthropic hız sınırı bekleme süreleri model kapsamlı olabilir, bu yüzden kardeş bir Anthropic modeli hâlâ kullanılabilir olabilir. Başka bir Anthropic profili ekleyin veya bekleme süresinin dolmasını bekleyin.
  </Accordion>
</AccordionGroup>

<Note>
Daha fazla yardım: [Sorun Giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="CLI arka uçları" href="/tr/gateway/cli-backends" icon="terminal">
    Claude CLI arka uç kurulumu ve çalışma zamanı ayrıntıları.
  </Card>
  <Card title="Prompt caching" href="/tr/reference/prompt-caching" icon="database">
    Prompt caching'in sağlayıcılar arasında nasıl çalıştığı.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>
